
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { pool } from '../config/db.js';

// VALIDACIÓN DE CONTRASEÑAS DE CAMPY

function validarContrasena(password) {
  if (typeof password !== 'string' || !password) {
    return 'Debes ingresar una contraseña.';
  }

  if (password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres.';
  }

  if (password.length > 10) {
    return 'La contraseña no puede tener más de 10 caracteres.';
  }

  if (/\s/.test(password)) {
    return 'La contraseña no debe contener espacios.';
  }

  if (!/[A-Z]/.test(password)) {
    return 'La contraseña debe incluir al menos una letra mayúscula.';
  }

  if (!/[a-z]/.test(password)) {
    return 'La contraseña debe incluir al menos una letra minúscula.';
  }

  if (!/[0-9]/.test(password)) {
    return 'La contraseña debe incluir al menos un número.';
  }

  if (!/[^A-Za-z0-9\s]/.test(password)) {
    return 'La contraseña debe incluir al menos un carácter especial, como @, #, $, ! o *.';
  }

  if (Buffer.byteLength(password, 'utf8') > 72) {
    return 'La contraseña supera el tamaño máximo permitido.';
  }

  return null;
}

// RESPUESTA DE ERROR PARA UN CAMPO ESPECÍFICO

function errorDeCampo(res, estado, campo, mensaje) {
  return res.status(estado).json({
    mensaje,
    campo,
    errores: {
      [campo]: mensaje
    }
  });
}

// CÓDIGOS DE RECUPERACIÓN (10 MINUTOS)

const codigosRecuperacion = new Map();

// ENVÍO DEL CÓDIGO MEDIANTE EMAILJS DESDE EL BACKEND

async function enviarCorreoGoogleStyle(correoDestino, nombreUsuario, codigo) {
  const {
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    EMAILJS_PUBLIC_KEY,
    EMAILJS_PRIVATE_KEY
  } = process.env;

  if (
    !EMAILJS_SERVICE_ID ||
    !EMAILJS_TEMPLATE_ID ||
    !EMAILJS_PUBLIC_KEY ||
    !EMAILJS_PRIVATE_KEY
  ) {
    throw new Error('Faltan las variables de EmailJS en backend/.env.');
  }

  const respuesta = await fetch(
    'https://api.emailjs.com/api/v1.0/email/send',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        accessToken: EMAILJS_PRIVATE_KEY,
        template_params: {
          to_name: nombreUsuario,
          to_email: correoDestino,
          verification_code: codigo
        }
      }),
      signal: AbortSignal.timeout(15000)
    }
  );

  if (!respuesta.ok) {
    const detalle = await respuesta.text();

    console.error(
      'Error de EmailJS:',
      respuesta.status,
      detalle
    );

    throw new Error(
      'EmailJS no pudo aceptar el correo de recuperación.'
    );
  }
}

// 1. REGISTRO DE USUARIOS

export async function registro(req, res) {
  const { nombre, correo, password, telefono } = req.body ?? {};

  // Validar nombre
  if (
    typeof nombre !== 'string' ||
    nombre.trim().length < 3 ||
    nombre.trim().length > 120
  ) {
    return errorDeCampo(
      res,
      400,
      'nombre',
      'El nombre debe tener entre 3 y 120 caracteres.'
    );
  }

  // Validar correo electrónico
  if (
    typeof correo !== 'string' ||
    !correo.trim() ||
    correo.trim().length > 255 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())
  ) {
    return errorDeCampo(
      res,
      400,
      'correo',
      'Ingresa un correo electrónico válido.'
    );
  }

  // Validar teléfono
  if (
    typeof telefono !== 'string' ||
    !/^\d{10}$/.test(telefono.trim())
  ) {
    return errorDeCampo(
      res,
      400,
      'telefono',
      'El número de teléfono debe tener exactamente 10 dígitos.'
    );
  }

  // Validar seguridad de contraseña
  const errorContrasena = validarContrasena(password);

  if (errorContrasena) {
    return errorDeCampo(
      res,
      400,
      'password',
      errorContrasena
    );
  }

  const nombreLimpio = nombre.trim();
  const correoLimpio = correo.trim().toLowerCase();
  const telefonoLimpio = telefono.trim();

  try {
    // Comprobar si el correo ya existe
    const existente = await pool.query(
      `SELECT 1
       FROM public.usuarios
       WHERE LOWER(correo) = $1
       LIMIT 1`,
      [correoLimpio]
    );

    if (existente.rows.length > 0) {
      return errorDeCampo(
        res,
        409,
        'correo',
        'Este correo ya está registrado. Inicia sesión.'
      );
    }

    // Cifrar contraseña
    const contrasenaHash = await bcrypt.hash(password, 12);

    // Guardar usuario en Supabase PostgreSQL
    const resultado = await pool.query(
      `INSERT INTO public.usuarios
        (
          nombre,
          correo,
          contrasena_hash,
          telefono,
          tipo_comunidad,
          estado,
          fecha_registro
        )
       VALUES (
         $1,
         $2,
         $3,
         $4,
         'Estudiante',
         'Activo',
         CURRENT_TIMESTAMP
       )
       RETURNING id_usuario, nombre, correo`,
      [
        nombreLimpio,
        correoLimpio,
        contrasenaHash,
        telefonoLimpio
      ]
    );

    return res.status(201).json({
      mensaje: 'Usuario registrado con éxito.',
      usuario: resultado.rows[0]
    });

  } catch (error) {
    if (error.code === '23505') {
      return errorDeCampo(
        res,
        409,
        'correo',
        'Este correo ya está registrado. Inicia sesión.'
      );
    }

    console.error('Error al registrar usuario:', error);

    return res.status(500).json({
      mensaje: 'No fue posible registrar tu cuenta.'
    });
  }
}

// 2. INICIO DE SESIÓN

export async function login(req, res) {
  const { correo, password } = req.body ?? {};

  // Comprobar correo
  if (
    typeof correo !== 'string' ||
    !correo.trim() ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())
  ) {
    return errorDeCampo(
      res,
      400,
      'correo',
      'Ingresa un correo electrónico válido.'
    );
  }

  // Comprobar que se haya escrito una contraseña
  if (typeof password !== 'string' || !password) {
    return errorDeCampo(
      res,
      400,
      'password',
      'Debes ingresar tu contraseña.'
    );
  }

  try {
    // Buscar el correo en la base de datos
    const resultado = await pool.query(
      `SELECT
         id_usuario,
         nombre,
         correo,
         contrasena_hash,
         estado
       FROM public.usuarios
       WHERE LOWER(correo) = LOWER($1)
       LIMIT 1`,
      [correo.trim()]
    );

    const usuario = resultado.rows[0];

    // Correo no registrado
    if (!usuario) {
      return errorDeCampo(
        res,
        404,
        'correo',
        'Este correo no está registrado. Debes registrarte para iniciar sesión.'
      );
    }

    // Cuenta no activa
    if (usuario.estado?.toLowerCase() !== 'activo') {
      return errorDeCampo(
        res,
        403,
        'correo',
        'Esta cuenta no está activa. No puedes iniciar sesión.'
      );
    }

    // Verificar contraseña
    const valida = usuario.contrasena_hash
      ? await bcrypt.compare(password, usuario.contrasena_hash)
      : false;

    if (!valida) {
      return errorDeCampo(
        res,
        401,
        'password',
        'La contraseña es incorrecta. Inténtalo nuevamente.'
      );
    }

    // Verificar configuración JWT
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        mensaje: 'Autenticación no configurada'
      });
    }

    // Consultar roles del usuario
    const consultaRoles = await pool.query(
      `SELECT LOWER(TRIM(r.nombre)) AS nombre
       FROM public.usuario_roles ur
       JOIN public.roles r
         ON r.id_rol = ur.id_rol
       WHERE ur.id_usuario = $1`,
      [usuario.id_usuario]
    );

    const roles = consultaRoles.rows.map(
      (fila) => fila.nombre
    );

    const esVendedor = roles.includes('vendedor');
    const esRepartidor = roles.includes('repartidor');
    const esModerador = roles.includes('moderador');

    // Generar token para la sesión
    const token = jwt.sign(
      {
        id: usuario.id_usuario,
        correo: usuario.correo
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
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

    return res.status(500).json({
      mensaje: 'No fue posible validar la cuenta'
    });
  }
}

// 3. SOLICITAR CÓDIGO DE RECUPERACIÓN

export async function solicitarCodigoPassword(req, res) {
  const { correo } = req.body ?? {};

  if (
    typeof correo !== 'string' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())
  ) {
    return res.status(400).json({
      mensaje: 'Ingresa un correo electrónico válido.'
    });
  }

  const correoLimpio = correo.trim().toLowerCase();

  try {
    const resultado = await pool.query(
      `SELECT id_usuario, nombre, correo, estado
       FROM public.usuarios
       WHERE LOWER(correo) = $1
       LIMIT 1`,
      [correoLimpio]
    );

    const usuario = resultado.rows[0];

    if (!usuario) {
      return res.status(404).json({
        mensaje: 'Este correo no está registrado. Debes registrarte primero.'
      });
    }

    if (usuario.estado?.toLowerCase() !== 'activo') {
      return res.status(403).json({
        mensaje: 'La cuenta asociada a este correo no está activa.'
      });
    }

    // Generar código aleatorio de seis dígitos
    const codigo = crypto.randomInt(
      100000,
      1000000
    ).toString();

    // Enviar el código usando EmailJS
    // Si EmailJS falla, no se guardará un código nuevo.
    await enviarCorreoGoogleStyle(
      usuario.correo,
      usuario.nombre,
      codigo
    );

    // Guardar el código durante 10 minutos
    codigosRecuperacion.set(correoLimpio, {
      id_usuario: usuario.id_usuario,
      codigo,
      verificado: false,
      expira: Date.now() + 10 * 60 * 1000
    });

    return res.json({
      mensaje: 'Enviamos un código de seis dígitos a tu correo electrónico.'
    });

  } catch (error) {
    console.error(
      'Error al solicitar código de recuperación:',
      error
    );

    return res.status(500).json({
      mensaje: 'No fue posible enviar el código. Intenta nuevamente.'
    });
  }
}

// 4. VERIFICAR CÓDIGO DE RECUPERACIÓN

export async function verificarCodigoPassword(req, res) {
  const { correo, codigo } = req.body ?? {};

  if (
    typeof correo !== 'string' ||
    typeof codigo !== 'string' ||
    !/^\d{6}$/.test(codigo.trim())
  ) {
    return res.status(400).json({
      mensaje: 'Ingresa el código de 6 dígitos.'
    });
  }

  const correoLimpio = correo.trim().toLowerCase();

  const registro = codigosRecuperacion.get(
    correoLimpio
  );

  if (!registro || Date.now() > registro.expira) {
    codigosRecuperacion.delete(correoLimpio);

    return res.status(400).json({
      mensaje: 'El código ha expirado. Solicita uno nuevo.'
    });
  }

  if (registro.codigo !== codigo.trim()) {
    return res.status(400).json({
      mensaje: 'Código incorrecto. Verifica e intenta nuevamente.'
    });
  }

  registro.verificado = true;

  codigosRecuperacion.set(
    correoLimpio,
    registro
  );

  return res.json({
    mensaje: 'Código verificado correctamente. Ahora crea tu nueva contraseña.'
  });
}

// 5. CONFIRMAR RECUPERACIÓN DE CONTRASEÑA

export async function confirmarCambioPassword(req, res) {
  const { correo, codigo, nuevaPassword } = req.body ?? {};

  if (
    typeof correo !== 'string' ||
    typeof codigo !== 'string' ||
    !/^\d{6}$/.test(codigo.trim())
  ) {
    return res.status(400).json({
      mensaje: 'Los datos de recuperación no son válidos.'
    });
  }

  const errorContrasena = validarContrasena(
    nuevaPassword
  );

  if (errorContrasena) {
    return res.status(400).json({
      mensaje: errorContrasena
    });
  }

  const correoLimpio = correo.trim().toLowerCase();

  const registro = codigosRecuperacion.get(
    correoLimpio
  );

  if (
    !registro ||
    !registro.verificado ||
    registro.codigo !== codigo.trim() ||
    Date.now() > registro.expira
  ) {
    return res.status(400).json({
      mensaje: 'Tu sesión de recuperación expiró o el código es inválido.'
    });
  }

  try {
    // Generar nuevo hash
    const nuevoHash = await bcrypt.hash(
      nuevaPassword,
      12
    );

    // Actualizar contraseña en Supabase
    const actualizacion = await pool.query(
      `UPDATE public.usuarios
       SET contrasena_hash = $1
       WHERE id_usuario = $2
       RETURNING id_usuario`,
      [nuevoHash, registro.id_usuario]
    );

    if (actualizacion.rows.length === 0) {
      return res.status(404).json({
        mensaje: 'No se encontró la cuenta.'
      });
    }

    codigosRecuperacion.delete(correoLimpio);

    return res.json({
      mensaje: '¡Contraseña actualizada correctamente! Ya puedes iniciar sesión.'
    });

  } catch (error) {
    console.error(
      'Error al actualizar contraseña:',
      error
    );

    return res.status(500).json({
      mensaje: 'No fue posible actualizar la contraseña.'
    });
  }
}

// 6. CAMBIAR CONTRASEÑA DESDE MI PERFIL
// No necesita un archivo middleware adicional.

export async function cambiarPasswordAutenticado(req, res) {
  const {
    passwordActual,
    nuevaPassword,
    confirmarPassword
  } = req.body ?? {};

  // Obtener el token del usuario autenticado
  const autorizacion = req.headers.authorization || '';

  const token = autorizacion.startsWith('Bearer ')
    ? autorizacion.slice(7).trim()
    : '';

  if (!token || !process.env.JWT_SECRET) {
    return res.status(401).json({
      mensaje: 'Debes iniciar sesión para cambiar tu contraseña.'
    });
  }

  // Identificar al usuario mediante el token
  let usuarioId;

  try {
    const datos = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    usuarioId = Number(datos.id);

    if (
      !Number.isSafeInteger(usuarioId) ||
      usuarioId <= 0
    ) {
      throw new Error('Usuario inválido');
    }

  } catch {
    return res.status(401).json({
      mensaje: 'Tu sesión expiró o no es válida. Inicia sesión nuevamente.'
    });
  }

  // Verificar que proporcionó su contraseña actual
  if (
    typeof passwordActual !== 'string' ||
    !passwordActual
  ) {
    return res.status(400).json({
      mensaje: 'Ingresa tu contraseña actual.'
    });
  }

  // Validar la nueva contraseña
  const errorContrasena = validarContrasena(
    nuevaPassword
  );

  if (errorContrasena) {
    return res.status(400).json({
      mensaje: errorContrasena
    });
  }

  // Comparar la nueva contraseña con su confirmación
  if (
    typeof confirmarPassword !== 'string' ||
    nuevaPassword !== confirmarPassword
  ) {
    return res.status(400).json({
      mensaje: 'Las contraseñas nuevas no coinciden.'
    });
  }

  try {
    // Consultar contraseña actual desde PostgreSQL
    const resultado = await pool.query(
      `SELECT contrasena_hash
       FROM public.usuarios
       WHERE id_usuario = $1
         AND LOWER(estado) = 'activo'
       LIMIT 1`,
      [usuarioId]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: 'No se encontró una cuenta activa.'
      });
    }

    const hashActual = resultado.rows[0].contrasena_hash;

    if (!hashActual) {
      return res.status(409).json({
        mensaje: 'Esta cuenta no tiene una contraseña local.'
      });
    }

    // Validar que la contraseña actual sea correcta
    const coincide = await bcrypt.compare(
      passwordActual,
      hashActual
    );

    if (!coincide) {
      return res.status(401).json({
        mensaje: 'La contraseña actual es incorrecta.'
      });
    }

    // Evitar reutilizar la misma contraseña
    const esLaMisma = await bcrypt.compare(
      nuevaPassword,
      hashActual
    );

    if (esLaMisma) {
      return res.status(400).json({
        mensaje: 'La nueva contraseña debe ser diferente de la actual.'
      });
    }

    // Generar nuevo hash de la contraseña
    const nuevoHash = await bcrypt.hash(
      nuevaPassword,
      12
    );

    // Actualizar la contraseña del usuario autenticado
    const actualizacion = await pool.query(
      `UPDATE public.usuarios
       SET contrasena_hash = $1
       WHERE id_usuario = $2
         AND contrasena_hash = $3
         AND LOWER(estado) = 'activo'
       RETURNING id_usuario`,
      [
        nuevoHash,
        usuarioId,
        hashActual
      ]
    );

    if (actualizacion.rows.length === 0) {
      return res.status(409).json({
        mensaje: 'La contraseña cambió durante la operación. Vuelve a intentarlo.'
      });
    }

    return res.status(200).json({
      mensaje: '¡Tu contraseña se actualizó correctamente!'
    });

  } catch (error) {
    console.error(
      'Error al cambiar contraseña:',
      error
    );

    return res.status(500).json({
      mensaje: 'No fue posible actualizar la contraseña.'
    });
  }
}
