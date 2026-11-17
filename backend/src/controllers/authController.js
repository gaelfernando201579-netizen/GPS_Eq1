import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { pool } from '../config/db.js';

// Memoria temporal para códigos de recuperación (10 minutos)
const codigosRecuperacion = new Map();

async function enviarCorreoGoogleStyle(correoDestino, nombreUsuario, codigo) {
  console.log('\n======================================================');
  console.log(`🔑 CÓDIGO DE VERIFICACIÓN PARA ${correoDestino}: ${codigo}`);
  console.log('======================================================\n');

  try {
    let transporter;

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    } else {
      const cuentaPrueba = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: cuentaPrueba.user,
          pass: cuentaPrueba.pass
        }
      });
    }

    const info = await transporter.sendMail({
      from: `"Seguridad de Campy" <${process.env.EMAIL_USER || 'no-reply@campy.ito.mx'}>`,
      to: correoDestino,
      subject: `${codigo} es tu código de verificación de Campy`,
      html: `
        <div style="font-family: 'Google Sans', Roboto, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; border: 1px solid #dadce0; border-radius: 8px; color: #202124;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 22px; font-weight: 700; color: #0A3895;">CAMPY</span>
            <p style="font-size: 11px; color: #5f6368; letter-spacing: 1.5px; margin: 4px 0 0; text-transform: uppercase;">Campus Delivery ITO</p>
          </div>
          <h2 style="font-size: 20px; font-weight: 500; text-align: center; margin: 0 0 16px;">Recuperación de contraseña</h2>
          <p style="font-size: 14px; line-height: 20px; color: #3c4043;">
            Hola, <strong>${nombreUsuario}</strong>:
          </p>
          <p style="font-size: 14px; line-height: 20px; color: #3c4043;">
            Recibimos una solicitud para recuperar el acceso a tu cuenta asociada a <strong>${correoDestino}</strong>. Usa este código de verificación para continuar:
          </p>
          <div style="background-color: #f8f9fa; border: 1px solid #e8eaed; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
            <span style="font-size: 34px; font-weight: 700; letter-spacing: 8px; color: #1a73e8;">${codigo}</span>
          </div>
          <p style="font-size: 12px; line-height: 18px; color: #5f6368; margin-bottom: 0;">
            Este código caduca en 10 minutos. Si no solicitaste este código, puedes ignorar este mensaje de forma segura.
          </p>
        </div>
      `
    });

    const urlVistaPrevia = nodemailer.getTestMessageUrl(info);
    if (urlVistaPrevia) {
      console.log(`📧 VER CORREO ENVIADO (Ctrl + Clic): ${urlVistaPrevia}\n`);
    }
  } catch (errCorreo) {
    console.warn('⚠️ Aviso: No se pudo conectar al servidor SMTP, pero puedes usar el código impreso arriba para tus pruebas:', errCorreo.message);
  }
}

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

    const consultaRoles = await pool.query(
      `SELECT LOWER(TRIM(r.nombre)) AS nombre
       FROM public.usuario_roles ur
       JOIN public.roles r ON r.id_rol = ur.id_rol
       WHERE ur.id_usuario = $1`,
      [usuario.id_usuario]
    );
    const roles = consultaRoles.rows.map((fila) => fila.nombre);
    const esVendedor = roles.includes('vendedor');
    const esRepartidor = roles.includes('repartidor');
    const esModerador = roles.includes('moderador');

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
        correo: usuario.correo,
        esVendedor,
        esRepartidor,
        esModerador
      }
    });
  } catch (error) {
    console.error('Error de autenticación:', error);
    res.status(500).json({ mensaje: 'No fue posible validar la cuenta' });
  }
}

// 1. Solicitar código al correo
export async function solicitarCodigoPassword(req, res) {
  const { correo } = req.body ?? {};

  if (typeof correo !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
    return res.status(400).json({ mensaje: 'Ingresa un correo electrónico válido.' });
  }

  const correoLimpio = correo.trim().toLowerCase();

  try {
    let usuario = null;

    if (process.env.DATABASE_URL) {
      const resultado = await pool.query(
        'SELECT id_usuario, nombre, correo, estado FROM public.usuarios WHERE LOWER(correo) = $1 LIMIT 1',
        [correoLimpio]
      );
      usuario = resultado.rows[0];

      if (!usuario || usuario.estado?.toLowerCase() !== 'activo') {
        return res.status(404).json({ mensaje: 'No se encontró ninguna cuenta activa asociada a este correo.' });
      }
    } else {
      usuario = {
        id_usuario: 1,
        nombre: correoLimpio.split('@')[0],
        correo: correoLimpio,
        estado: 'Activo'
      };
    }

    const codigo = crypto.randomInt(100000, 999999).toString();

    codigosRecuperacion.set(correoLimpio, {
      id_usuario: usuario.id_usuario,
      codigo,
      verificado: false,
      expira: Date.now() + 10 * 60 * 1000
    });

    await enviarCorreoGoogleStyle(usuario.correo, usuario.nombre, codigo);

    return res.json({
      mensaje: `Se envió un código de verificación de 6 dígitos a ${usuario.correo}`
    });
  } catch (error) {
    console.error('Error al solicitar código de recuperación:', error);
    return res.status(500).json({ mensaje: 'No se pudo enviar el correo de verificación. Intenta de nuevo.' });
  }
}

// 2. Verificar el código de 6 dígitos
export async function verificarCodigoPassword(req, res) {
  const { correo, codigo } = req.body ?? {};

  if (typeof correo !== 'string' || typeof codigo !== 'string' || !/^\d{6}$/.test(codigo.trim())) {
    return res.status(400).json({ mensaje: 'Ingresa el código de 6 dígitos.' });
  }

  const correoLimpio = correo.trim().toLowerCase();
  const registro = codigosRecuperacion.get(correoLimpio);

  if (!registro || Date.now() > registro.expira) {
    codigosRecuperacion.delete(correoLimpio);
    return res.status(400).json({ mensaje: 'El código ha expirado. Solicita uno nuevo.' });
  }

  if (registro.codigo !== codigo.trim()) {
    return res.status(400).json({ mensaje: 'Código incorrecto. Verifica e intenta nuevamente.' });
  }

  registro.verificado = true;
  codigosRecuperacion.set(correoLimpio, registro);

  return res.json({ mensaje: 'Código verificado correctamente. Ahora crea tu nueva contraseña.' });
}

// 3. Guardar la nueva contraseña
export async function confirmarCambioPassword(req, res) {
  const { correo, codigo, nuevaPassword } = req.body ?? {};

  if (
    typeof correo !== 'string' ||
    typeof codigo !== 'string' || !/^\d{6}$/.test(codigo.trim()) ||
    typeof nuevaPassword !== 'string' || nuevaPassword.length < 8 || Buffer.byteLength(nuevaPassword, 'utf8') > 72
  ) {
    return res.status(400).json({
      mensaje: 'La nueva contraseña debe tener al menos 8 caracteres.'
    });
  }

  const correoLimpio = correo.trim().toLowerCase();
  const registro = codigosRecuperacion.get(correoLimpio);

  if (!registro || registro.codigo !== codigo.trim() || Date.now() > registro.expira) {
    return res.status(400).json({ mensaje: 'Tu sesión de recuperación expiró o el código es inválido.' });
  }

  try {
    const nuevoHash = await bcrypt.hash(nuevaPassword, 12);

    if (process.env.DATABASE_URL) {
      await pool.query(
        'UPDATE public.usuarios SET contrasena_hash = $1 WHERE id_usuario = $2',
        [nuevoHash, registro.id_usuario]
      );
    }

    codigosRecuperacion.delete(correoLimpio);

    return res.json({ mensaje: '¡Contraseña actualizada correctamente! Ya puedes iniciar sesión.' });
  } catch (error) {
    console.error('Error al actualizar contraseña:', error);
    return res.status(500).json({ mensaje: 'No fue posible actualizar la contraseña.' });
  }
}