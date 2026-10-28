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
        SELECT dp.*, p.nombre, p.tienda, p.ubicacion 
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