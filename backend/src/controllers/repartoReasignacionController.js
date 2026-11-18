import { pool } from '../config/db.js';
export async function reasignarReparto(req,res) {
  const pedido=Number(req.params.id), vendedor=Number(req.usuario?.id);
  const motivo=String(req.body?.motivo||'').trim();
  if(!Number.isSafeInteger(pedido)||pedido<1||motivo.length<8||motivo.length>500)
    return res.status(400).json({mensaje:'Indica por qué no se presentó el repartidor (mínimo 8 caracteres).'});
  const c=await pool.connect();
  try {
    await c.query('BEGIN');
    const permiso=await c.query(`SELECT 1 FROM public.usuario_roles ur JOIN public.roles r ON ur.id_rol=r.id_rol WHERE ur.id_usuario=$1 AND LOWER(TRIM(r.nombre))='vendedor'`,[vendedor]);
    if(!permiso.rowCount){await c.query('ROLLBACK');return res.status(403).json({mensaje:'Solo el vendedor puede liberar este reparto.'});}
    const r=await c.query(`SELECT pr.id_repartidor,pr.estado FROM public.pedido_repartos pr
      JOIN public.pedidos p ON p.id_pedido=pr.id_pedido
      WHERE pr.id_pedido=$1 AND p.id_vendedor=$2 AND pr.id_repartidor IS NOT NULL
        AND pr.estado IN ('Aceptado','Listo','Repartidor llegó')
        AND p.estado NOT IN ('Cancelado','Entregado') FOR UPDATE OF pr`,[pedido,vendedor]);
    if(!r.rowCount){await c.query('ROLLBACK');return res.status(409).json({mensaje:'El reparto ya fue recogido o no se puede liberar.'});}
    await c.query(`INSERT INTO public.reparto_reasignaciones(id_pedido,id_repartidor_anterior,id_vendedor,motivo)
      VALUES($1,$2,$3,$4)`,[pedido,r.rows[0].id_repartidor,vendedor,motivo]);
    await c.query(`UPDATE public.pedido_repartos SET id_repartidor=NULL,
      estado=CASE WHEN $2='Listo' OR $2='Repartidor llegó' THEN 'Listo' ELSE 'Buscando repartidor' END
      WHERE id_pedido=$1`,[pedido,r.rows[0].estado]);
    await c.query('COMMIT');res.json({mensaje:'El pedido se liberó para otro repartidor.'});
  }catch(e){await c.query('ROLLBACK').catch(()=>{});console.error('Reasignar reparto:',e);res.status(500).json({mensaje:'No se pudo liberar el pedido.'});}
  finally{c.release();}
}
