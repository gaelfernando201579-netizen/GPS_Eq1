// controllers/orderController.js
import { pool } from '../config/db.js';

export async function crearPedido(req, res) {
  const { items } = req.body; 
  if (!items || items.length === 0) {
    return res.status(400).json({ mensaje: 'El carrito está vacío' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const total = items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

    const resultPedido = await client.query(
      'INSERT INTO pedidos (comprador_id, total, estado) VALUES ($1, $2, $3) RETURNING id',
      [req.usuario.id, total, 'En Camino']
    );

    const pedidoId = resultPedido.rows[0].id;

    for (const item of items) {
      await client.query(
        'INSERT INTO detalles_pedido (pedido_id, producto_id, cantidad, precio_unitario) VALUES ($1, $2, $3, $4)',
        [pedidoId, item.id, item.cantidad, item.precio]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ mensaje: 'Pedido registrado correctamente', pedidoId, total });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ mensaje: 'Error al procesar pedido', error: error.message });
  } finally {
    client.release();
  }
}

export async function obtenerMisPedidos(req, res) {
  try {
    const pedidosRes = await pool.query(
      'SELECT * FROM pedidos WHERE comprador_id = $1 ORDER BY fecha DESC',
      [req.usuario.id]
    );

    const pedidos = pedidosRes.rows;

    for (let pedido of pedidos) {
      const detallesRes = await pool.query(`
        SELECT dp.*, p.nombre, p.tienda, p.ubicacion, p.allow_cancellation 
        FROM detalles_pedido dp 
        JOIN productos p ON dp.producto_id = p.id 
        WHERE dp.pedido_id = $1
      `, [pedido.id]);
      
      pedido.items = detallesRes.rows;
    }

    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener historial de pedidos', error: error.message });
  }
}

export async function cancelarPedido(req, res) {
  const pedidoId = req.params.id;
  const userId = req.usuario.id;

  const client = await pool.connect();
  try {
    // 1. Obtener el pedido verificando que pertenezca al usuario comprador
    const pedidoRes = await client.query(
      'SELECT * FROM pedidos WHERE id = $1 AND comprador_id = $2',
      [pedidoId, userId]
    );

    const pedido = pedidoRes.rows[0];
    if (!pedido) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado o no autorizado' });
    }

    if (pedido.estado === 'Cancelado' || pedido.estado === 'Entregado') {
      return res.status(400).json({ mensaje: `El pedido ya se encuentra en estado: ${pedido.estado}` });
    }

    // 2. Validar el tiempo límite de cancelación (ej. 10 minutos)
    const TIEMPO_LIMITE_MINUTOS = 10;
    const fechaCreacion = new Date(pedido.fecha);
    const ahora = new Date();
    const minutosTranscurridos = (ahora - fechaCreacion) / (1000 * 60);

    if (minutosTranscurridos > TIEMPO_LIMITE_MINUTOS) {
      return res.status(400).json({ 
        mensaje: `El tiempo límite para cancelar ha expirado (máximo ${TIEMPO_LIMITE_MINUTOS} minutos).` 
      });
    }

    // 3. Revisar si algún producto del pedido prohíbe la cancelación
    const detallesRes = await client.query(`
      SELECT dp.*, p.nombre, p.allow_cancellation 
      FROM detalles_pedido dp 
      JOIN productos p ON dp.producto_id = p.id 
      WHERE dp.pedido_id = $1
    `, [pedidoId]);

    for (const item of detallesRes.rows) {
      if (item.allow_cancellation === false) {
        return res.status(400).json({ 
          mensaje: `El producto "${item.nombre}" es de venta final y no acepta cancelación.` 
        });
      }
    }

    // 4. Actualizar el estado del pedido a 'Cancelado'
    await client.query(
      'UPDATE pedidos SET estado = $1 WHERE id = $2',
      ['Cancelado', pedidoId]
    );

    res.json({ mensaje: 'Pedido cancelado exitosamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al procesar la cancelación', error: error.message });
  } finally {
    client.release();
  }
}