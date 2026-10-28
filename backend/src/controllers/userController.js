import { pool } from '../config/db.js';

export async function obtenerPerfil(req, res) {
  try {
    const usuario = await pool.query(
      'SELECT id, nombre, correo, carrera, telefono, es_emprendedor FROM usuarios WHERE id = $1',
      [req.usuario.id]
    );
    res.json(usuario.rows[0]);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener perfil', error: error.message });
  }
}

export async function actualizarPerfil(req, res) {
  const { nombre, carrera, telefono, es_emprendedor } = req.body;
  try {
    await pool.query(
      `UPDATE usuarios SET 
        nombre = COALESCE($1, nombre),
        carrera = COALESCE($2, carrera),
        telefono = COALESCE($3, telefono),
        es_emprendedor = COALESCE($4, es_emprendedor)
      WHERE id = $5`,
      [
        nombre || null, 
        carrera || null, 
        telefono || null, 
        es_emprendedor !== undefined ? (es_emprendedor ? 1 : 0) : null, 
        req.usuario.id
      ]
    );

    res.json({ mensaje: 'Perfil actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar perfil', error: error.message });
  }
}