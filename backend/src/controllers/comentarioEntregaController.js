import { pool } from '../config/db.js';
export async function guardarComentarioEntrega(req,res) {
  const pedidoId=Number(req.params.id), usuario=Number(req.usuario?.id);
  const comentario=String(req.body?.comentario||'').trim();
  if(!Number.isSafeInteger(pedidoId)||pedidoId<1||comentario.length>500)
    return res.status(400).json({mensaje:'Comentario inválido (máximo 500 caracteres).'});
  const c=await pool.connect();
  try {
    await c.query('BEGIN');
    const r=await c.query(`SELECT p.id_comprador,p.id_vendedor,p.estado,pr.id_repartidor
      FROM public.pedidos p LEFT JOIN public.pedido_repartos pr ON pr.id_pedido=p.id_pedido
      WHERE p.id_pedido=$1 FOR UPDATE OF p`,[pedidoId]);
    if(!r.rowCount){await c.query('ROLLBACK');return res.status(404).json({mensaje:'Pedido no encontrado.'});}
    const p=r.rows[0];
    if(['Entregado','Cancelado'].includes(p.estado)) {await c.query('ROLLBACK');return res.status(409).json({mensaje:'La entrega ya terminó.'});}
    const columna=Number(p.id_comprador)===usuario?'comentario_entrega_comprador':
      Number(p.id_vendedor)===usuario?'comentario_entrega_vendedor':
      Number(p.id_repartidor)===usuario?'comentario_entrega_repartidor':null;
    if(!columna){await c.query('ROLLBACK');return res.status(403).json({mensaje:'No participas en este pedido.'});}
    const guardado=await c.query(`UPDATE public.pedidos SET ${columna}=$2 WHERE id_pedido=$1 RETURNING ${columna} AS comentario`,[pedidoId,comentario||null]);
    await c.query('COMMIT');res.json({comentario:guardado.rows[0].comentario||'',mensaje:'Comentario guardado.'});
  }catch(e){await c.query('ROLLBACK').catch(()=>{});console.error('Comentario entrega:',e);res.status(500).json({mensaje:'No se pudo guardar el comentario.'});}
  finally{c.release();}
}
