import { pool } from '../config/db.js';

export async function obtenerProductos(req, res) {
  try {
    const { categoria, busqueda } = req.query;
    let query = 'SELECT * FROM productos WHERE 1=1';
    let params = [];
    let counter = 1;

    if (categoria && categoria !== 'Todo') {
      query += ` AND categoria = $${counter++}`;
      params.push(categoria);
    }

    if (busqueda) {
      query += ` AND (nombre ILIKE $${counter} OR tienda ILIKE $${counter})`;
      params.push(`%${busqueda}%`);
    }

    const productos = await pool.query(query, params);
    res.json(productos.rows);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener productos', error: error.message });
  }
}

export async function crearProducto(req, res) {
  const { nombre, tienda, ubicacion, precio, categoria } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO productos (nombre, tienda, ubicacion, precio, categoria, vendedor_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [nombre, tienda, ubicacion, precio, categoria, req.usuario.id]
    );

    res.status(201).json({ id: result.rows[0].id, nombre, tienda, ubicacion, precio, categoria });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear producto', error: error.message });
  }
}