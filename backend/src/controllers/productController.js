// controllers/productController.js
import { pool } from '../config/db.js';

export async function obtenerProductos(req, res) {
  try {
    const { categoria, busqueda } = req.query;
    const filtros = [];
    const parametros = [];

    if (categoria && categoria !== 'Todo') {
      parametros.push(categoria);
      filtros.push(`c.nombre ILIKE $${parametros.length}`);
    }

    if (busqueda && busqueda.trim()) {
      parametros.push(`%${busqueda.trim()}%`);
      filtros.push(`(p.nombre ILIKE $${parametros.length} OR u.nombre ILIKE $${parametros.length})`);
    }

    const consulta = `
      SELECT
        p.id_producto,
        p.id_vendedor,
        p.nombre,
        p.descripcion,
        p.precio,
        p.cantidad_disponible,
        p.imagen_url,
        p.estado,
        c.nombre AS categoria,
        u.nombre AS nombre_vendedor
      FROM public.productos p
      LEFT JOIN public.categorias c ON c.id_categoria = p.id_categoria
      LEFT JOIN public.usuarios u ON u.id_usuario = p.id_vendedor
      ${filtros.length ? `WHERE ${filtros.join(' AND ')}` : ''}
      ORDER BY p.id_producto ASC
    `;

    const resultado = await pool.query(consulta, parametros);
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ mensaje: 'Error al obtener productos' });
  }
}

export async function crearProducto(req, res) {
  const { nombre, tienda, ubicacion, precio, categoria, allow_cancellation } = req.body;
  try {
    const permiteCancelacion = allow_cancellation !== undefined ? allow_cancellation : true;
    const result = await pool.query(
      'INSERT INTO productos (nombre, tienda, ubicacion, precio, categoria, vendedor_id, allow_cancellation) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [nombre, tienda, ubicacion, precio, categoria, req.usuario.id, permiteCancelacion]
    );

    res.status(201).json({ 
      id: result.rows[0].id, 
      nombre, 
      tienda, 
      ubicacion, 
      precio, 
      categoria, 
      allow_cancellation: permiteCancelacion 
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear producto', error: error.message });
  }
}