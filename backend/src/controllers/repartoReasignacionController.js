
import { pool } from '../config/db.js';

export async function reasignarReparto(req, res) {
  const pedido = Number(req.params.id);
  const vendedor = Number(req.usuario?.id);
  const motivo = String(req.body?.motivo || '').trim();

  if (
    !Number.isSafeInteger(pedido) ||
    pedido < 1 ||
    motivo.length < 8 ||
    motivo.length > 500
  ) {
    return res.status(400).json({
      mensaje: 'Indica por qué no se presentó el repartidor (mínimo 8 caracteres).'
    });
  }

  const c = await pool.connect();

  try {
    await c.query('BEGIN');

    const permiso = await c.query(
      `SELECT 1
       FROM public.usuario_roles ur
       JOIN public.roles r ON ur.id_rol = r.id_rol
       WHERE ur.id_usuario = $1
       AND LOWER(TRIM(r.nombre)) = 'vendedor'`,
      [vendedor]
    );

    if (!permiso.rowCount) {
      await c.query('ROLLBACK');
      return res.status(403).json({
        mensaje: 'Solo el vendedor puede liberar este reparto.'
      });
    }

    const r = await c.query(
      `SELECT pr.id_repartidor, pr.estado
       FROM public.pedido_repartos pr
       JOIN public.pedidos p ON p.id_pedido = pr.id_pedido
       WHERE pr.id_pedido = $1
         AND p.id_vendedor = $2
         AND pr.id_repartidor IS NOT NULL
         AND pr.estado IN ('Aceptado', 'Listo', 'Repartidor llegó')
         AND p.estado NOT IN ('Cancelado', 'Entregado')
       FOR UPDATE OF pr`,
      [pedido, vendedor]
    );

    if (!r.rowCount) {
      await c.query('ROLLBACK');
      return res.status(409).json({
        mensaje: 'El reparto ya fue recogido o no se puede liberar.'
      });
    }

    await c.query(
      `INSERT INTO public.reparto_reasignaciones
       (id_pedido, id_repartidor_anterior, id_vendedor, motivo)
       VALUES ($1, $2, $3, $4)`,
      [
        pedido,
        r.rows[0].id_repartidor,
        vendedor,
        motivo
      ]
    );

    await c.query(
      `UPDATE public.pedido_repartos
       SET id_repartidor = NULL,
           estado = CASE
             WHEN $2 = 'Listo' OR $2 = 'Repartidor llegó'
             THEN 'Listo'
             ELSE 'Buscando repartidor'
           END
       WHERE id_pedido = $1`,
      [pedido, r.rows[0].estado]
    );

    await c.query('COMMIT');

    return res.json({
      mensaje: 'El pedido se liberó para otro repartidor.'
    });

  } catch (e) {
    await c.query('ROLLBACK').catch(() => {});
    console.error('Reasignar reparto:', e);

    return res.status(500).json({
      mensaje: 'No se pudo liberar el pedido.'
    });

  } finally {
    c.release();
  }
}

export async function cancelarAsignacionRepartidor(req, res) {
  const pedido = Number(req.params.id);
  const repartidor = Number(req.usuario?.id);
  const motivo = String(req.body?.motivo || '').trim();

  if (!Number.isSafeInteger(pedido) || pedido < 1) {
    return res.status(400).json({
      mensaje: 'El pedido indicado no es válido.'
    });
  }

  if (!Number.isSafeInteger(repartidor) || repartidor < 1) {
    return res.status(401).json({
      mensaje: 'Debes iniciar sesión para cancelar una entrega.'
    });
  }

  if (motivo.length < 8 || motivo.length > 500) {
    return res.status(400).json({
      mensaje: 'Explica por qué no podrás realizar la entrega (entre 8 y 500 caracteres).'
    });
  }

  let c;

  try {
    c = await pool.connect();

    await c.query('BEGIN');

    const permiso = await c.query(
      `SELECT 1
       FROM public.usuario_roles ur
       JOIN public.roles r ON r.id_rol = ur.id_rol
       WHERE ur.id_usuario = $1
         AND LOWER(TRIM(r.nombre)) = 'repartidor'
       LIMIT 1`,
      [repartidor]
    );

    if (!permiso.rowCount) {
      await c.query('ROLLBACK');

      return res.status(403).json({
        mensaje: 'Solo un repartidor autorizado puede cancelar su entrega.'
      });
    }

    const resultado = await c.query(
      `SELECT
         pr.id_repartidor,
         pr.estado,
         p.id_vendedor
       FROM public.pedido_repartos pr
       JOIN public.pedidos p
         ON p.id_pedido = pr.id_pedido
       WHERE pr.id_pedido = $1
         AND pr.id_repartidor = $2
         AND pr.estado IN (
           'Aceptado',
           'Listo',
           'Repartidor llegó'
         )
         AND p.estado NOT IN ('Cancelado', 'Entregado')
       FOR UPDATE OF pr, p`,
      [pedido, repartidor]
    );

    if (!resultado.rowCount) {
      await c.query('ROLLBACK');

      return res.status(409).json({
        mensaje: 'No puedes cancelar esta entrega porque ya fue recogida, finalizada o no está asignada a tu cuenta.'
      });
    }

    const reparto = resultado.rows[0];

    await c.query(
      `INSERT INTO public.reparto_reasignaciones
       (
         id_pedido,
         id_repartidor_anterior,
         id_vendedor,
         motivo
       )
       VALUES ($1, $2, $3, $4)`,
      [
        pedido,
        repartidor,
        reparto.id_vendedor,
        motivo
      ]
    );

    const nuevoEstado =
      reparto.estado === 'Listo' ||
      reparto.estado === 'Repartidor llegó'
        ? 'Listo'
        : 'Buscando repartidor';

    await c.query(
      `UPDATE public.pedido_repartos
       SET id_repartidor = NULL,
           estado = $2
       WHERE id_pedido = $1`,
      [pedido, nuevoEstado]
    );

    await c.query('COMMIT');

    return res.json({
      mensaje: 'Cancelaste tu entrega correctamente. El pedido sigue activo y está disponible para otro repartidor.',
      idPedido: pedido,
      estadoReparto: nuevoEstado,
      liberado: true
    });

  } catch (error) {
    if (c) {
      await c.query('ROLLBACK').catch(() => {});
    }

    console.error('Error cancelando asignación del repartidor:', error);

    return res.status(500).json({
      mensaje: 'No se pudo cancelar la entrega. Inténtalo nuevamente.'
    });

  } finally {
    if (c) c.release();
  }
}
