import {pool} from '../config/db.js';
export const idValido=(id)=>Number.isSafeInteger(Number(id))&&Number(id)>0;
export async function tieneRol(usuarioId,rol,client=pool){
 const result=await client.query(`SELECT 1 FROM public.usuario_roles ur JOIN public.roles r ON r.id_rol=ur.id_rol WHERE ur.id_usuario=$1 AND LOWER(TRIM(r.nombre))=ANY($2::text[]) LIMIT 1`,[usuarioId,Array.isArray(rol)?rol:[rol]]);
 return result.rowCount>0;
}
export async function registrarAuditoria(client,pagoId,usuario,accion,anterior,nuevo,detalle={}){
 await client.query(`INSERT INTO public.pagos_auditoria(pago_id,usuario_id,accion,estado_anterior,estado_nuevo,detalle) VALUES($1,$2,$3,$4,$5,$6::jsonb)`,[pagoId,usuario,accion,anterior,nuevo,JSON.stringify(detalle)]);
}
export function responderError(res,error,contexto='pagos'){
 if(!error.status)console.error(`Error en ${contexto}:`,error);
 const faltanTablas=['42P01','42703'].includes(error.code);
 return res.status(error.status|| (faltanTablas?503:500)).json({mensaje:error.status?error.message:faltanTablas?'Es necesario aplicar la migración de pagos y verificar el esquema existente.':'No se pudo completar la operación.'});
}
