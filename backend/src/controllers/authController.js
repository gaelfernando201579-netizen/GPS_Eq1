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
  const { correo, password } = req.body ?? {};
  if (typeof correo !== 'string' || typeof password !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim()) || !password) {
    return res.status(400).json({ mensaje: 'Ingresa un correo y contraseña válidos' });
  }

  try {
    const resultado = await pool.query(
      'SELECT id_usuario, nombre, correo, contrasena_hash, estado FROM public.usuarios WHERE LOWER(correo) = LOWER($1) LIMIT 1',
      [correo.trim()]
    );
    const usuario = resultado.rows[0];
    const valida = usuario?.contrasena_hash
      ? await bcrypt.compare(password, usuario.contrasena_hash)
      : false;

    if (!usuario || !valida || usuario.estado?.toLowerCase() !== 'activo') {
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ mensaje: 'Autenticación no configurada' });
    }

    const token = jwt.sign(
      { id: usuario.id_usuario, correo: usuario.correo },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      mensaje: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        correo: usuario.correo
      }
    });
  } catch (error) {
    console.error('Error de autenticación:', error);
    res.status(500).json({ mensaje: 'No fue posible validar la cuenta' });
  }
}
