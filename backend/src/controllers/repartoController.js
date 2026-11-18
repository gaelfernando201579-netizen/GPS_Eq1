import { pool } from '../config/db.js';

const entero = (v) => Number.isSafeInteger(Number(v)) && Number(v) > 0;
async function tieneRol(db, id, rol) {
  const r = await db.query(`SELECT 1 FROM public.usuario_roles ur JOIN public.roles r ON r.id_rol=ur.id_rol WHERE ur.id_usuario=$1 AND LOWER(r.nombre)=$2 LIMIT 1`, [id, rol]);
  return r.rowCount > 0;
}
const fallo = (res, status, mensaje) => res.status(status).json({ mensaje });

export async function aceptarPedido(req, res) {
  const id = Number(req.params.id), vendedor = Number(req.usuario?.id);
  if (!entero(id) || !entero(vendedor)) return fallo(res, 400, 'Identificadores inválidos.');
  const rep = req.body?.requiereRepartidor === true;
  const origen = String(req.body?.lugarRecoleccion || '').trim();
  const destino = null;
  const comision = Number(req.body?.comisionRepartidor ?? 0);
  if (rep && (!origen || !Number.isFinite(comision) || comision < 0)) return fallo(res, 400, 'Indica punto de recogida, entrega y comisión válidos.');
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    if (!await tieneRol(db, vendedor, 'vendedor')) { await db.query('ROLLBACK'); return fallo(res, 403, 'No tienes rol de vendedor.'); }
    const pedido = await db.query(`UPDATE public.pedidos SET estado='En preparación' WHERE id_pedido=$1 AND id_vendedor=$2 AND estado='Pendiente' AND oculto_por_retiro_vendedor=FALSE RETURNING id_pedido, estado, punto_entrega_acordado`, [id, vendedor]);
    if (!pedido.rowCount) { await db.query('ROLLBACK'); return fallo(res, 409, 'El pedido ya fue aceptado o no te pertenece.'); }
    if (rep) await db.query(`INSERT INTO public.pedido_repartos (id_pedido, lugar_recoleccion, punto_entrega, comision, estado) VALUES ($1,$2,$3,$4,'Buscando repartidor')`, [id, origen, pedido.rows[0].punto_entrega_acordado, comision]);
    await db.query('COMMIT');
    res.json({ pedido: pedido.rows[0], requiereRepartidor: rep, estadoReparto: rep ? 'Buscando repartidor' : null });
  } catch (e) { await db.query('ROLLBACK').catch(()=>{}); console.error('Aceptar pedido:',e); fallo(res,500,'No se pudo aceptar el pedido.'); }
  finally { db.release(); }
}

export async function repartos(req, res) {
  const usuario = Number(req.usuario?.id);
  if (!entero(usuario)) return fallo(res,401,'Inicia sesión.');
  try {
    if (!await tieneRol(pool, usuario, 'repartidor')) return fallo(res,403,'No tienes rol de repartidor.');
    const r = await pool.query(`
      SELECT pr.id_pedido AS id, pr.estado AS estado_reparto, pr.id_repartidor,
        pr.lugar_recoleccion AS "lugarRecoleccion", pr.punto_entrega AS "puntoEntrega",
        pr.comision AS "comisionRepartidor", p.estado, p.total,
        p.comentario_entrega_comprador AS "comentarioEntregaComprador",
        p.comentario_entrega_vendedor AS "comentarioEntregaVendedor",
        p.comentario_entrega_repartidor AS "comentarioEntregaRepartidor",
        c.nombre AS "compradorNombre", v.nombre AS "vendedorNombre",
        ('Vende: ' || v.nombre) AS tienda,
        COALESCE((SELECT json_agg(json_build_object('cantidad',d.cantidad,'nombre',prod.nombre))
          FROM public.detalle_pedido d JOIN public.productos prod ON prod.id_producto=d.id_producto
          WHERE d.id_pedido=p.id_pedido),'[]'::json) AS items
      FROM public.pedido_repartos pr
      JOIN public.pedidos p ON p.id_pedido=pr.id_pedido
      JOIN public.usuarios c ON c.id_usuario=p.id_comprador
      JOIN public.usuarios v ON v.id_usuario=p.id_vendedor
      WHERE (pr.id_repartidor IS NULL OR pr.id_repartidor=$1)
        AND p.oculto_por_retiro_vendedor=FALSE AND (pr.id_repartidor=$1 OR p.estado NOT IN ('Cancelado','Entregado'))
      ORDER BY pr.fecha_creacion DESC, pr.id_pedido DESC`, [usuario]);
    res.json(r.rows.map(p => ({ ...p, requiereRepartidor:true, repartidorId:p.id_repartidor, repartidorAsignado:p.id_repartidor ? String(usuario) : null,
      costoProductoRepartidor:Number(p.total), estadoReparto:p.estado_reparto })));
  } catch(e) { console.error('Consultar repartos:',e); fallo(res,500,'No se pudieron consultar repartos.'); }
}

export async function aceptarReparto(req, res) {
  const id=Number(req.params.id), usuario=Number(req.usuario?.id);
  if (!entero(id)||!entero(usuario)) return fallo(res,400,'Datos inválidos.');
  try {
    if (!await tieneRol(pool,usuario,'repartidor')) return fallo(res,403,'No tienes rol de repartidor.');
    const r=await pool.query(`UPDATE public.pedido_repartos pr SET id_repartidor=$2, estado=CASE WHEN pr.estado='Listo' THEN 'Listo' ELSE 'Aceptado' END
      FROM public.pedidos p
      WHERE pr.id_pedido=$1 AND p.id_pedido=pr.id_pedido
        AND pr.id_repartidor IS NULL AND pr.estado IN ('Buscando repartidor','Listo')
        AND NOT EXISTS(SELECT 1 FROM public.reparto_reasignaciones ra WHERE ra.id_pedido=pr.id_pedido AND ra.id_repartidor_anterior=$2)
        AND p.estado NOT IN ('Cancelado','Entregado')
        AND p.oculto_por_retiro_vendedor=FALSE
      RETURNING pr.id_pedido, pr.estado`,[id,usuario]);
    if (!r.rowCount) return fallo(res,409,'Otro repartidor ya aceptó el pedido.');
    res.json({pedido:r.rows[0]});
  } catch(e) { console.error('Aceptar reparto:',e); fallo(res,500,'No se pudo aceptar el reparto.'); }
}

const cambiosVendedor={ listo:{anterior:['Buscando repartidor','Aceptado'],nuevo:'Listo'}, repartidor_llego:{anterior:['Listo'],nuevo:'Repartidor llegó'} };
const cambiosRepartidor={ recibido:{anterior:['Repartidor llegó'],nuevo:'Recibido'}, en_camino:{anterior:['Recibido'],nuevo:'En camino',estadoPedido:'En camino'}, llegue:{anterior:['En camino'],nuevo:'En el punto de entrega',estadoPedido:'En el punto de entrega'}, entregado:{anterior:['En el punto de entrega'],nuevo:'Entregado',estadoPedido:'Entregado'} };
export async function avanzarReparto(req,res) {
  const id=Number(req.params.id),usuario=Number(req.usuario?.id),accion=req.body?.accion;
  const esVendedor=Object.hasOwn(cambiosVendedor,accion), cambio=cambiosVendedor[accion]||cambiosRepartidor[accion];
  if(!entero(id)||!entero(usuario)||!cambio)return fallo(res,400,'Acción o usuario inválido.');
  const db=await pool.connect();
  try {
    await db.query('BEGIN');
    if(!await tieneRol(db,usuario,esVendedor?'vendedor':'repartidor')) {await db.query('ROLLBACK');return fallo(res,403,'Rol no autorizado.');}
    const r=await db.query(`UPDATE public.pedido_repartos pr SET estado=$3
      FROM public.pedidos p WHERE pr.id_pedido=$1 AND p.id_pedido=pr.id_pedido
      AND ${esVendedor?'p.id_vendedor=$2':'pr.id_repartidor=$2'}
      AND pr.estado=ANY($4::text[]) AND p.oculto_por_retiro_vendedor=FALSE AND p.estado NOT IN ('Cancelado','Entregado')
      ${accion==='repartidor_llego'?'AND pr.id_repartidor IS NOT NULL':''}
      RETURNING pr.id_pedido, pr.estado`,[id,usuario,cambio.nuevo,cambio.anterior]);
    if(!r.rowCount) {await db.query('ROLLBACK');return fallo(res,409,'Acción fuera de orden, o el pedido no te corresponde. Actualiza la pantalla.');}
    if(cambio.estadoPedido) await db.query('UPDATE public.pedidos SET estado=$2 WHERE id_pedido=$1',[id,cambio.estadoPedido]);
    await db.query('COMMIT');res.json({pedido:{id,estado:cambio.estadoPedido||null,estadoReparto:cambio.nuevo}});
  } catch(e){await db.query('ROLLBACK').catch(()=>{});console.error('Avanzar reparto:',e);fallo(res,500,'No se pudo actualizar el reparto.');}
  finally{db.release();}
}
