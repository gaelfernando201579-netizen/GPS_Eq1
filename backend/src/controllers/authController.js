import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

export async function registro(req, res) {
  const { nombre, correo, password, telefono } = req.body ?? {};

  if (
    typeof nombre !== 'string' || nombre.trim().length < 3 || nombre.trim().length > 120 ||
    typeof correo !== 'string' || correo.trim().length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim()) ||
    typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72 ||
    typeof telefono !== 'string' || !/^\d{10}$/.test(telefono.trim())
  ) {
    return res.status(400).json({ mensaje: 'Revisa tu nombre, correo, teléfono de 10 dígitos y contraseña de al menos 8 caracteres.' });
  }

  const nombreLimpio = nombre.trim();
  const correoLimpio = correo.trim().toLowerCase();
  const telefonoLimpio = telefono.trim();

  try {
    const existente = await pool.query(
      'SELECT 1 FROM public.usuarios WHERE LOWER(correo) = $1 LIMIT 1',
      [correoLimpio]
    );

    if (existente.rows.length > 0) {
      return res.status(409).json({ mensaje: 'El correo ya está registrado.' });
    }

    const contrasenaHash = await bcrypt.hash(password, 12);
    const resultado = await pool.query(
      `INSERT INTO public.usuarios
        (nombre, correo, contrasena_hash, telefono, tipo_comunidad, estado, fecha_registro)
       VALUES ($1, $2, $3, $4, 'Estudiante', 'Activo', CURRENT_TIMESTAMP)
       RETURNING id_usuario, nombre, correo`,
      [nombreLimpio, correoLimpio, contrasenaHash, telefonoLimpio]
    );

    return res.status(201).json({
      mensaje: 'Usuario registrado con éxito.',
      usuario: resultado.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ mensaje: 'El correo ya está registrado.' });
    }
    console.error('Error al registrar usuario:', error);
    return res.status(500).json({ mensaje: 'No fue posible registrar tu cuenta.' });
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
