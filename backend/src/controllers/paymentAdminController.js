import {pool} from '../config/db.js';
import {generarDistribuciones} from '../services/paymentDistributionService.js';
import {registrarAuditoria,responderError,idValido,tieneRol} from '../services/paymentService.js';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
export async function autorizarAdmin(req,res,next){
 try{if(!await tieneRol(req.usuario.id,['moderador','administrador','admin']))return res.status(403).json({mensaje:'Solo personal autorizado puede gestionar pagos.'});next();}
 catch(e){return responderError(res,e);}
}
export async function pendientes(req,res){
 try{const r=await pool.query(`SELECT p.id,p.pedido_id,p.comprador_id,p.monto_esperado,p.monto_detectado,p.estado,p.clave_rastreo,p.fecha_transferencia,p.motivo_revision,p.fecha_creacion,p.comprobante_clave IS NOT NULL AS tiene_comprobante FROM public.pagos p WHERE p.estado NOT IN ('Confirmado') ORDER BY p.fecha_creacion DESC LIMIT 200`);res.json(r.rows);}catch(e){responderError(res,e);}
}
export async function comprobanteAdmin(req,res){
 if(!idValido(req.params.id))return res.status(400).json({mensaje:'Pago inválido.'});
 try{const r=await pool.query('SELECT comprobante_clave,comprobante_mime FROM public.pagos WHERE id=$1',[req.params.id]);if(!r.rowCount||!r.rows[0].comprobante_clave)return res.status(404).json({mensaje:'Sin comprobante.'});
 const bytes=await readFile(path.resolve(process.env.PRIVATE_RECEIPTS_DIR||'./private/receipts',path.basename(r.rows[0].comprobante_clave)));
 res.set('Content-Type',r.rows[0].comprobante_mime).set('Cache-Control','no-store').set('X-Content-Type-Options','nosniff').send(bytes);
 }catch(e){responderError(res,e);}
}
export async function resolver(req,res){
 if(!idValido(req.params.id))return res.status(400).json({mensaje:'Pago inválido.'});
 const {decision,evidenciaBancaria,motivo}=req.body||{};
 if(!['Confirmado','Rechazado','Revision_manual'].includes(decision))return res.status(400).json({mensaje:'Decisión inválida.'});
 if(decision==='Confirmado'&&(!process.env.CAMPY_BENEFICIARY_ACCOUNT||typeof evidenciaBancaria!=='string'||evidenciaBancaria.trim().length<12))return res.status(400).json({mensaje:'Configura la cuenta CAMPY y registra evidencia bancaria de acreditación verificada (no basta la captura).'});
 if(decision!=='Confirmado'&&(typeof motivo!=='string'||motivo.trim().length<5))return res.status(400).json({mensaje:'Incluye el motivo de la resolución.'});
 let client;
 try{client=await pool.connect();await client.query('BEGIN');
 const r=await client.query(`SELECT p.*,o.id_vendedor,o.estado AS pedido_estado FROM public.pagos p JOIN public.pedidos o ON o.id_pedido=p.pedido_id WHERE p.id=$1 FOR UPDATE OF p,o`,[req.params.id]);
 if(!r.rowCount)throw Object.assign(new Error('Pago no encontrado.'),{status:404});const pago=r.rows[0];
 if(pago.estado==='Confirmado')throw Object.assign(new Error('El pago ya fue confirmado; no puede reprocesarse.'),{status:409});
 if(pago.pedido_estado==='Cancelado'&&decision==='Confirmado')throw Object.assign(new Error('El pedido está cancelado; requiere un procedimiento de conciliación o devolución.'),{status:409});
 if(decision==='Confirmado'&&!pago.comprobante_clave)throw Object.assign(new Error('Falta comprobante del comprador.'),{status:409});
 // La resolución manual requiere verificación REAL de acreditación por el administrador.
 await client.query(`UPDATE public.pagos SET estado=$2,evidencia_bancaria=$3,confirmado_por=CASE WHEN $2='Confirmado' THEN $4 ELSE NULL END,fecha_confirmacion=CASE WHEN $2='Confirmado' THEN now() ELSE NULL END,motivo_revision=$5,fecha_actualizacion=now() WHERE id=$1`,[pago.id,decision,decision==='Confirmado'?evidenciaBancaria.trim():null,req.usuario.id,motivo||null]);
 if(decision==='Confirmado')await generarDistribuciones(client,{...pago,vendedor_id:pago.id_vendedor});
 await registrarAuditoria(client,pago.id,req.usuario.id,'Resolución administrativa',pago.estado,decision,{motivo:motivo||null,metodo:'verificación bancaria manual'});
 await client.query('COMMIT');res.json({mensaje:'Resolución registrada.',estado:decision});
 }catch(e){if(client)await client.query('ROLLBACK').catch(()=>{});responderError(res,e,'resolución de pago');}finally{client?.release();}
}
export async function distribuciones(req,res){
 try{const r=await pool.query(`SELECT d.id,d.pago_id,d.destinatario_id,d.tipo,d.importe,d.estado,d.referencia_liquidacion,d.fecha_liquidacion FROM public.distribuciones_pago d ORDER BY d.fecha_creacion DESC LIMIT 300`);res.json(r.rows);}catch(e){responderError(res,e);}
}
export async function distribucionesPropias(req,res){
 try{const r=await pool.query(`SELECT d.id,d.pago_id,d.tipo,d.importe,d.estado,d.fecha_liquidacion FROM public.distribuciones_pago d WHERE d.destinatario_id=$1 ORDER BY d.fecha_creacion DESC LIMIT 200`,[req.usuario.id]);res.json(r.rows);}catch(e){responderError(res,e);}
}
export async function liquidar(req,res){
 if(!idValido(req.params.id))return res.status(400).json({mensaje:'Distribución inválida.'});
 const {referencia,evidencia}=req.body||{};
 if(typeof referencia!=='string'||referencia.trim().length<6||typeof evidencia!=='string'||evidencia.trim().length<8)return res.status(400).json({mensaje:'Registra referencia y evidencia de una transferencia real ya efectuada.'});
 let client;
 try{client=await pool.connect();await client.query('BEGIN');
 const r=await client.query(`SELECT d.id,d.estado,d.tipo,p.estado AS pago_estado FROM public.distribuciones_pago d JOIN public.pagos p ON p.id=d.pago_id WHERE d.id=$1 FOR UPDATE OF d`,[req.params.id]);
 if(!r.rowCount)throw Object.assign(new Error('Distribución no encontrada.'),{status:404});
 const d=r.rows[0];if(d.estado!=='Pendiente'||d.pago_estado!=='Confirmado'||d.tipo==='Campy')throw Object.assign(new Error('Distribución no liquidable.'),{status:409});
 await client.query(`UPDATE public.distribuciones_pago SET estado='Liquidado',referencia_liquidacion=$2,evidencia_liquidacion=$3,fecha_liquidacion=now(),liquidado_por=$4 WHERE id=$1`,[d.id,referencia.trim(),evidencia.trim(),req.usuario.id]);
 await client.query('COMMIT');res.json({mensaje:'Transferencia de salida registrada; no fue ejecutada por CAMPY.'});
 }catch(e){if(client)await client.query('ROLLBACK').catch(()=>{});responderError(res,e,'liquidación');}finally{client?.release();}
}
export async function actualizarComision(req,res){
 const cantidad=req.body?.comisionFija;
 if(!/^(0|[1-9]\d{0,5})(\.\d{1,2})?$/.test(String(cantidad)))return res.status(400).json({mensaje:'Comisión inválida.'});
 let client;try{client=await pool.connect();await client.query('BEGIN');
 await client.query('SELECT id FROM public.configuracion_comisiones WHERE activo FOR UPDATE');
 await client.query('UPDATE public.configuracion_comisiones SET activo=false WHERE activo');
 const r=await client.query('INSERT INTO public.configuracion_comisiones(comision_fija) VALUES($1) RETURNING *',[cantidad]);
 await client.query('COMMIT');res.json(r.rows[0]);
 }catch(e){if(client)await client.query('ROLLBACK').catch(()=>{});responderError(res,e,'comisiones');}finally{client?.release();}
}
