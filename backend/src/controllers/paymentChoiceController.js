import { pool } from '../config/db.js';

const metodos = { efectivo: 'Efectivo', transferencia: 'Transferencia', tarjeta: 'Tarjeta' };
const estadosPagoPermitidos = new Set(['Pendiente', 'Aceptado', 'En preparación', 'En camino']);

const idValido = valor => Number.isSafeInteger(Number(valor)) && Number(valor) > 0;

async function buscarPedido(req, res) {
  const comprador = Number(req.usuario?.id);
  const pedido = Number(req.params.id);

  if (!idValido(comprador) || !idValido(pedido)) {
    res.status(400).json({ mensaje: 'Pedido o sesión inválidos.' });
    return null;
  }

  const resultado = await pool.query(
    `SELECT id_pedido, estado FROM public.pedidos
     WHERE id_pedido = $1 AND id_comprador = $2`,
    [pedido, comprador]
  );

  if (!resultado.rowCount) {
    res.status(404).json({ mensaje: 'El pedido no existe en tu cuenta.' });
    return null;
  }

  return resultado.rows[0];
}

export async function obtenerMetodoPedido(req, res) {
  try {
    if (!await buscarPedido(req, res)) return;

    const resultado = await pool.query(
      `SELECT metodo, id_tarjeta::text AS "idTarjeta", fecha_actualizacion
       FROM public.pedido_metodos_pago
       WHERE pedido_id = $1 AND id_comprador = $2`,
      [req.params.id, req.usuario.id]
    );

    res.set('Cache-Control', 'no-store').json(
      resultado.rows[0] || { metodo: '', idTarjeta: null }
    );
  } catch (error) {
    console.error('Consultando método de pago:', error);
    res.status(500).json({ mensaje: 'No se pudo consultar el método de pago.' });
  }
}

export async function guardarMetodoPedido(req, res) {
  const metodo = metodos[String(req.body?.metodo || '').toLowerCase()];
  const idTarjeta = req.body?.idTarjeta;

  if (!metodo || (metodo === 'Tarjeta' && !idValido(idTarjeta))) {
    return res.status(400).json({ mensaje: 'Selecciona un método y una tarjeta de prueba válidos.' });
  }

  const comprador = Number(req.usuario?.id);
  const pedidoId = Number(req.params.id);

  if (!idValido(comprador) || !idValido(pedidoId)) {
    return res.status(400).json({ mensaje: 'Pedido o sesión inválidos.' });
  }

  let cliente;

  try {
    cliente = await pool.connect();
    await cliente.query('BEGIN');

    const pedidos = await cliente.query(
      `SELECT id_pedido, estado FROM public.pedidos
       WHERE id_pedido = $1 AND id_comprador = $2
       FOR UPDATE`,
      [pedidoId, comprador]
    );

    if (!pedidos.rowCount) {
      await cliente.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'El pedido no existe en tu cuenta.' });
    }

    if (!estadosPagoPermitidos.has(pedidos.rows[0].estado)) {
      await cliente.query('ROLLBACK');
      return res.status(409).json({
        mensaje: 'Ya no puedes cambiar el método de pago de este pedido.'
      });
    }

    let tarjetaParaGuardar = null;

    if (metodo === 'Tarjeta') {
      const tarjetas = await cliente.query(
        `SELECT id_tarjeta FROM public.tarjetas_guardadas
         WHERE id_tarjeta = $1 AND id_usuario = $2`,
        [idTarjeta, comprador]
      );

      if (!tarjetas.rowCount) {
        await cliente.query('ROLLBACK');
        return res.status(403).json({ mensaje: 'Esa tarjeta no pertenece a tu cuenta.' });
      }

      tarjetaParaGuardar = idTarjeta;
    }

    const resultado = await cliente.query(
      `INSERT INTO public.pedido_metodos_pago
         (pedido_id, id_comprador, metodo, id_tarjeta)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (pedido_id) DO UPDATE
       SET metodo = EXCLUDED.metodo,
           id_tarjeta = EXCLUDED.id_tarjeta,
           fecha_actualizacion = now()
       WHERE public.pedido_metodos_pago.id_comprador = EXCLUDED.id_comprador
       RETURNING metodo, id_tarjeta::text AS "idTarjeta"`,
      [pedidoId, comprador, metodo, tarjetaParaGuardar]
    );

    if (!resultado.rowCount) {
      await cliente.query('ROLLBACK');
      return res.status(403).json({ mensaje: 'No puedes modificar ese pedido.' });
    }

    await cliente.query('COMMIT');

    return res.json({
      mensaje: `Método ${metodo.toLowerCase()} guardado. El pedido sigue pendiente de pago.`,
      ...resultado.rows[0],
      estadoPago: 'Pendiente'
    });
  } catch (error) {
    if (cliente) await cliente.query('ROLLBACK').catch(() => {});
    console.error('Guardando método de pago:', error);
    return res.status(500).json({ mensaje: 'No se pudo guardar el método de pago.' });
  } finally {
    if (cliente) cliente.release();
  }
}
