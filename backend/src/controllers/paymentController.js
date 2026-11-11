import {pool} from '../config/db.js';
import {createHash,randomUUID} from 'node:crypto';
import {mkdir,writeFile,readFile,unlink} from 'node:fs/promises';
import path from 'node:path';
import {validarImagen} from '../middleware/uploadMiddleware.js';
import {analizarComprobante} from '../services/aiReceiptService.js';
import {verificarCep} from '../services/banxicoCepService.js';
import {idValido,registrarAuditoria,responderError} from '../services/paymentService.js';
const storage=()=>path.resolve(process.env.PRIVATE_RECEIPTS_DIR||'./private/receipts');
const permiso=async(client,id,usuario,bloqueo=false)=>{
 const result=await client.query(`SELECT p.*,o.estado AS estado_pedido,o.id_vendedor AS vendedor_id FROM public.pagos p JOIN public.pedidos o ON o.id_pedido=p.pedido_id WHERE p.pedido_id=$1 AND p.comprador_id=$2 ${bloqueo?'FOR UPDATE OF p':''}`,[id,usuario]);
 return result.rows[0];
};
export function cuentaCampy(req,res){
 const cuenta=process.env.CAMPY_BENEFICIARY_ACCOUNT;
 if(!cuenta||!process.env.CAMPY_BENEFICIARY_BANK||!process.env.CAMPY_BENEFICIARY_NAME)return res.status(503).json({mensaje:'Cuenta CAMPY no configurada. No realices la transferencia hasta obtener los datos oficiales.'});
 res.set('Cache-Control','no-store').json({clabe:cuenta,banco:process.env.CAMPY_BENEFICIARY_BANK,titular:process.env.CAMPY_BENEFICIARY_NAME});
}
export async function estadoPago(req,res){
 if(!idValido(req.params.pedidoId))return res.status(400).json({mensaje:'Pedido inválido.'});
 try{const pago=await permiso(pool,req.params.pedidoId,req.usuario.id);if(!pago)return res.status(404).json({mensaje:'Pago no encontrado.'});
  const {comprobante_clave,comprobante_sha256,evidencia_bancaria,resultado_ia,...seguro}=pago;
  return res.json({...seguro,tieneComprobante:!!comprobante_clave,analisisDisponible:!!process.env.OPENAI_API_KEY&&!!process.env.OPENAI_RECEIPT_MODEL,verificacionAutomatica:false});
 }catch(error){return responderError(res,error);}
}
export async function descargarComprobante(req,res){
 if(!idValido(req.params.pedidoId))return res.status(400).json({mensaje:'Pedido inválido.'});
 try{const pago=await permiso(pool,req.params.pedidoId,req.usuario.id);if(!pago||!pago.comprobante_clave)return res.status(404).json({mensaje:'Comprobante no encontrado.'});
 const contenido=await readFile(path.join(storage(),path.basename(pago.comprobante_clave)));
 res.set('Content-Type',pago.comprobante_mime).set('Cache-Control','no-store').set('X-Content-Type-Options','nosniff').send(contenido);
 }catch(error){return responderError(res,error);}
}
export async function subirComprobante(req,res){
 if(!idValido(req.params.pedidoId))return res.status(400).json({mensaje:'Pedido inválido.'});
 let client,clave=null;
 try{
  const imagen=await validarImagen(req.file);
  client=await pool.connect();await client.query('BEGIN');
  const pago=await permiso(client,req.params.pedidoId,req.usuario.id,true);
  if(!pago)throw Object.assign(new Error('Pago no encontrado.'),{status:404});
  if(pago.estado_pedido==='Cancelado')throw Object.assign(new Error('El pedido está cancelado.'),{status:409});
  if(!['Pendiente','Rechazado','Revision_manual','Pendiente_confirmacion_bancaria'].includes(pago.estado))throw Object.assign(new Error('El pago está siendo procesado o ya fue confirmado.'),{status:409});
  if(pago.estado!=='Pendiente'&&!['Rechazado','Revision_manual'].includes(pago.estado))throw Object.assign(new Error('Solicita autorización administrativa para reemplazar el comprobante.'),{status:409});
  const sha=createHash('sha256').update(imagen.buffer).digest('hex');
  clave=`${randomUUID()}.img`;await mkdir(storage(),{recursive:true,mode:0o700});
  await writeFile(path.join(storage(),clave),imagen.buffer,{flag:'wx',mode:0o600});
  await client.query(`INSERT INTO public.comprobantes_intentos(pago_id,clave,mime,sha256) VALUES($1,$2,$3,$4)`,[pago.id,clave,imagen.mime,sha]);
  await client.query(`UPDATE public.pagos SET comprobante_clave=$2,comprobante_mime=$3,comprobante_sha256=$4,estado='Analizando',motivo_revision=NULL,resultado_ia=NULL,monto_detectado=NULL,clave_rastreo=NULL,fecha_actualizacion=now() WHERE id=$1`,[pago.id,clave,imagen.mime,sha]);
  await registrarAuditoria(client,pago.id,req.usuario.id,'Subida comprobante',pago.estado,'Analizando');
  await client.query('COMMIT');client.release();client=null;
  // Análisis no modifica el estado financiero. El estado se estabiliza incluso si falla la IA.
  let resultado,datos={};
  try{resultado=await analizarComprobante(imagen.buffer,imagen.mime);datos=resultado.datos||{};}
  catch(error){resultado={configurado:false,mensaje:error.message};}
  const monto=datos.monto!=null&&/^\d+(\.\d{1,2})?$/.test(String(datos.monto).replace(/[$, ]/g,''))?String(datos.monto).replace(/[$, ]/g,''):null;
  const fecha=typeof datos.fecha==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(datos.fecha)?datos.fecha:null;
  const claveRastreo=typeof datos.clave_rastreo==='string'?datos.clave_rastreo.trim().slice(0,120):null;
  const coincidencias=[];
  if(monto!==null&&Number(monto)!==Number(pago.monto_esperado))coincidencias.push('El importe del comprobante no coincide con el pedido.');
  const cuentaEsperada=(process.env.CAMPY_BENEFICIARY_ACCOUNT||'').replace(/\s/g,'');
  const cuentaDetectada=String(datos.cuenta_beneficiaria||'').replace(/\s/g,'');
  if(cuentaEsperada&&cuentaDetectada&&cuentaDetectada!==cuentaEsperada&&!cuentaEsperada.endsWith(cuentaDetectada))coincidencias.push('La cuenta receptora no coincide con la cuenta configurada.');
  const siguiente=coincidencias.length?'Revision_manual':'Pendiente_confirmacion_bancaria';
  try{await pool.query(`UPDATE public.pagos SET estado=$2,resultado_ia=$3::jsonb,monto_detectado=$4,fecha_transferencia=$5,clave_rastreo=$6,banco_emisor=$7,banco_receptor=$8,cuenta_beneficiaria_detectada=$9,motivo_revision=$10,fecha_actualizacion=now() WHERE id=$1 AND estado='Analizando'`,[pago.id,siguiente,JSON.stringify({configurado:resultado.configurado,datos,mensaje:resultado.mensaje||null}),monto,fecha,claveRastreo||null,String(datos.banco_emisor||'').slice(0,120)||null,String(datos.banco_receptor||'').slice(0,120)||null,cuentaDetectada||null,coincidencias.join(' ')||resultado.mensaje||'Falta comprobación bancaria.']);}
  catch(error){if(error.code==='23505'){await pool.query(`UPDATE public.pagos SET estado='Revision_manual',clave_rastreo=NULL,motivo_revision='Clave de rastreo duplicada.',fecha_actualizacion=now() WHERE id=$1`,[pago.id]);}else { await pool.query(`UPDATE public.pagos SET estado='Revision_manual',motivo_revision='Fallo al guardar el análisis; requiere revisión.',fecha_actualizacion=now() WHERE id=$1`,[pago.id]).catch(()=>{});throw error;}}
  return res.status(202).json({mensaje:'Comprobante recibido. Falta verificar la acreditación bancaria.',estado:siguiente,avisos:coincidencias,analisis:resultado.configurado?'procesado':'no disponible'});
 }catch(error){if(client){await client.query('ROLLBACK').catch(()=>{});client.release();if(clave)await unlink(path.join(storage(),clave)).catch(()=>{});}return responderError(res,error,'subida de comprobante');}
}
export async function solicitarVerificacion(req,res){
 if(!idValido(req.params.pedidoId))return res.status(400).json({mensaje:'Pedido inválido.'});
 try{const pago=await permiso(pool,req.params.pedidoId,req.usuario.id);if(!pago)return res.status(404).json({mensaje:'Pago no encontrado.'});
 const consulta=await verificarCep();return res.json({...consulta,estadoActual:pago.estado,consultaManual:'https://www.banxico.org.mx/cep/'});
 }catch(error){return responderError(res,error);}
}
