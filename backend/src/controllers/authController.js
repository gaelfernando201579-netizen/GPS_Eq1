import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

export async function registro(req, res) {
  const { nombre, correo, password, carrera } = req.body;
  try {
    const usuarioExistente = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);
    
    if (usuarioExistente.rows.length > 0) {
      return res.status(400).json({ mensaje: 'El correo ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const nuevoUsuario = await pool.query(
      'INSERT INTO usuarios (nombre, correo, password, carrera) VALUES ($1, $2, $3, $4) RETURNING id, correo',
      [nombre, correo, hashedPassword, carrera || 'Ing. Sistemas Computacionales']
    );

    const token = jwt.sign({ id: nuevoUsuario.rows[0].id, correo }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ mensaje: 'Usuario registrado con éxito', token });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al registrar usuario', error: error.message });
  }
}

export async function login(req, res) {
  const { correo, password } = req.body;
  try {
    let resultado = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);
    let usuario = resultado.rows[0];

    if (!usuario) {
      // Si entra por primera vez, crea el usuario demo automáticamente
      const hashedPassword = await bcrypt.hash(password, 10);
      const nuevo = await pool.query(
        'INSERT INTO usuarios (nombre, correo, password, carrera) VALUES ($1, $2, $3, $4) RETURNING *',
        ['Cintia Yadai Salinas Montesinos', correo, hashedPassword, 'Ing. Sistemas Computacionales']
      );
      usuario = nuevo.rows[0];
    } else {
      const passwordValida = await bcrypt.compare(password, usuario.password);
      if (!passwordValida) {
        return res.status(400).json({ mensaje: 'Contraseña incorrecta' });
      }
    }

    const token = jwt.sign({ id: usuario.id, correo: usuario.correo }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      mensaje: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        carrera: usuario.carrera,
        es_emprendedor: Boolean(usuario.es_emprendedor)
      }
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error en inicio de sesión', error: error.message });
  }
}