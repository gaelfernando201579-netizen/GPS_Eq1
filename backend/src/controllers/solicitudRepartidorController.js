import { pool } from '../config/db.js';

const id = req => Number(req.usuario?.id);
async function moderador(c, usuario) {
  const r = await c.query(`SELECT 1 FROM public.usuario_roles ur JOIN public.roles r ON ur.id_rol=r.id_rol
    WHERE ur.id_usuario=$1 AND LOWER(TRIM(r.nombre))='moderador' LIMIT 1`,[usuario]);
  return r.rowCount>0;
}
export async function consultarMiSolicitud(req,res) {
  try {
    const [s,rol] = await Promise.all([
      pool.query(`SELECT id_solicitud,estado,comentario_revision,fecha_solicitud FROM public.solicitudes_repartidor WHERE id_usuario=$1`,[id(req)]),
      pool.query(`SELECT 1 FROM public.usuario_roles ur JOIN public.roles r ON ur.id_rol=r.id_rol WHERE ur.id_usuario=$1 AND LOWER(TRIM(r.nombre))='repartidor'`,[id(req)])
    ]);
    res.json({solicitud:s.rows[0]||null,esRepartidor:rol.rowCount>0});
  } catch(e){console.error('Solicitud repartidor:',e);res.status(500).json({mensaje:'No se pudo consultar la solicitud.'});}
}
export async function enviarSolicitudRepartidor(req,res) {
  const {identificacion,nombre,zonas}=req.body||{};
  if(!identificacion?.trim()||!nombre?.trim()||!zonas?.trim()||
    identificacion.length>30||nombre.length>120||zonas.length>250) return res.status(400).json({mensaje:'Completa los datos del repartidor.'});
  try {
    const rol=await pool.query(`SELECT 1 FROM public.usuario_roles ur JOIN public.roles r ON ur.id_rol=r.id_rol WHERE ur.id_usuario=$1 AND LOWER(TRIM(r.nombre))='repartidor'`,[id(req)]);
    if(rol.rowCount) return res.status(409).json({mensaje:'Ya tienes el rol de repartidor.'});
    const s=await pool.query(`INSERT INTO public.solicitudes_repartidor (id_usuario,numero_control,nombre,zonas)
      VALUES($1,$2,$3,$4) ON CONFLICT(id_usuario) DO UPDATE SET
      numero_control=EXCLUDED.numero_control,nombre=EXCLUDED.nombre,zonas=EXCLUDED.zonas,
      estado='Pendiente',comentario_revision=NULL,id_moderador=NULL,fecha_solicitud=now(),fecha_revision=NULL
      WHERE solicitudes_repartidor.estado='Rechazada'
      RETURNING id_solicitud,estado`,[id(req),identificacion.trim(),nombre.trim(),zonas.trim()]);
    if(!s.rowCount)return res.status(409).json({mensaje:'Ya tienes una solicitud pendiente o aprobada.'});
    res.status(201).json({solicitud:s.rows[0],mensaje:'Solicitud enviada al moderador.'});
  }catch(e){console.error('Enviando solicitud repartidor:',e);res.status(500).json({mensaje:'No se pudo enviar la solicitud.'});}
}
export async function solicitudesPendientesRepartidor(req,res) {
  try {
    if(!await moderador(pool,id(req)))return res.status(403).json({mensaje:'Solo moderadores.'});
    const s=await pool.query(`SELECT s.id_solicitud,s.numero_control,s.nombre,s.zonas,s.fecha_solicitud,u.correo
      FROM public.solicitudes_repartidor s JOIN public.usuarios u ON u.id_usuario=s.id_usuario
      WHERE s.estado='Pendiente' ORDER BY s.fecha_solicitud ASC`);
    res.json(s.rows);
  }catch(e){console.error('Solicitudes repartidor:',e);res.status(500).json({mensaje:'Error consultando solicitudes.'});}
}
export async function revisarSolicitudRepartidor(req,res) {
  const solicitud=Number(req.params.id), decision=req.body?.decision, comentario=String(req.body?.comentario||'').trim();
  if(!Number.isSafeInteger(solicitud)||solicitud<1||!['Aprobada','Rechazada'].includes(decision)||comentario.length>500)
    return res.status(400).json({mensaje:'Solicitud o decisión inválida.'});
  const c=await pool.connect();
  try {
    await c.query('BEGIN');
    if(!await moderador(c,id(req))){await c.query('ROLLBACK');return res.status(403).json({mensaje:'Solo moderadores.'});}
    const r=await c.query(`SELECT id_usuario FROM public.solicitudes_repartidor WHERE id_solicitud=$1 AND estado='Pendiente' FOR UPDATE`,[solicitud]);
    if(!r.rowCount){await c.query('ROLLBACK');return res.status(409).json({mensaje:'Solicitud ya revisada o inexistente.'});}
    if(decision==='Aprobada') {
      const rol=await c.query(`SELECT id_rol FROM public.roles WHERE LOWER(TRIM(nombre))='repartidor' LIMIT 1`);
      if(!rol.rowCount){await c.query('ROLLBACK');return res.status(503).json({mensaje:'Falta crear el rol repartidor en Supabase.'});}
      await c.query(`INSERT INTO public.usuario_roles(id_usuario,id_rol,fecha_asignacion)
        SELECT $1,$2,now() WHERE NOT EXISTS(SELECT 1 FROM public.usuario_roles WHERE id_usuario=$1 AND id_rol=$2)`,[r.rows[0].id_usuario,rol.rows[0].id_rol]);
    }
    await c.query(`UPDATE public.solicitudes_repartidor SET estado=$1,comentario_revision=$2,id_moderador=$3,fecha_revision=now() WHERE id_solicitud=$4`,[decision,comentario||null,id(req),solicitud]);
    await c.query('COMMIT'); res.json({mensaje:`Solicitud ${decision.toLowerCase()}.`});
  }catch(e){await c.query('ROLLBACK').catch(()=>{});console.error('Revisando repartidor:',e);res.status(500).json({mensaje:'No se pudo revisar la solicitud.'});}
  finally{c.release();}
}
