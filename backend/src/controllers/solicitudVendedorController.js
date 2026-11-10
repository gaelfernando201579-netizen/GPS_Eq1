import { pool } from '../config/db.js';

function idSesion(req) {
  const id = Number(req.usuario?.id);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function tieneRol(conexion, usuarioId, rol) {
  const resultado = await conexion.query(
    `SELECT EXISTS (
       SELECT 1 FROM public.usuario_roles ur
       JOIN public.roles r ON r.id_rol = ur.id_rol
       WHERE ur.id_usuario = $1 AND LOWER(TRIM(r.nombre)) = $2
     ) AS autorizado`,
    [usuarioId, rol]
  );
  return resultado.rows[0]?.autorizado === true;
}

function errorSolicitud(res, error, contexto) {
  if (error?.code === '42P01') {
    return res.status(503).json({ mensaje: 'Falta crear la tabla solicitudes_vendedor. Ejecuta primero la migración SQL.' });
  }
  console.error(contexto, error);
  return res.status(500).json({ mensaje: 'No fue posible procesar la solicitud.' });
}

export async function miSolicitud(req, res) {
  const id = idSesion(req);
  if (!id) return res.status(401).json({ mensaje: 'Inicia sesión.' });
  try {
    const [solicitud, roles] = await Promise.all([
      pool.query(
        `SELECT id_solicitud, estado, nombre_tienda, giro, ubicacion,
                comentario_revision, fecha_solicitud, fecha_revision
         FROM public.solicitudes_vendedor WHERE id_usuario = $1 LIMIT 1`,
        [id]
      ),
      pool.query(
        `SELECT LOWER(TRIM(r.nombre)) AS rol
         FROM public.usuario_roles ur
         JOIN public.roles r ON ur.id_rol = r.id_rol
         WHERE ur.id_usuario = $1`, [id]
      )
    ]);
    const nombres = roles.rows.map((fila) => fila.rol);
    return res.json({
      solicitud: solicitud.rows[0] || null,
      esVendedor: nombres.includes('vendedor'),
      esRepartidor: nombres.includes('repartidor'),
      esModerador: nombres.includes('moderador')
    });
  } catch (error) { return errorSolicitud(res, error, 'Error consultando solicitud:'); }
}

export async function enviarSolicitud(req, res) {
  const id = idSesion(req);
  if (!id) return res.status(401).json({ mensaje: 'Inicia sesión.' });
  const {
    identificacion, nombre, queVende, ubicacion,
    matrizHorario, horarios, notaHorario = ''
  } = req.body ?? {};
  const valido =
    typeof identificacion === 'string' && identificacion.trim().length >= 4 && identificacion.trim().length <= 30 &&
    typeof nombre === 'string' && nombre.trim().length >= 3 && nombre.trim().length <= 120 &&
    typeof queVende === 'string' && queVende.trim().length >= 3 && queVende.trim().length <= 200 &&
    typeof ubicacion === 'string' && ubicacion.trim().length >= 3 && ubicacion.trim().length <= 200 &&
    matrizHorario && typeof matrizHorario === 'object' && !Array.isArray(matrizHorario) &&
    Object.keys(matrizHorario).length >= 1 && Object.keys(matrizHorario).length <= 100 &&
    typeof horarios === 'string' && horarios.trim().length > 0 && horarios.length <= 2000 &&
    typeof notaHorario === 'string' && notaHorario.length <= 1000;
  if (!valido) return res.status(400).json({ mensaje: 'Completa correctamente la información y selecciona al menos un horario.' });

  try {
    if (await tieneRol(pool, id, 'vendedor')) {
      return res.status(409).json({ mensaje: 'Tu cuenta ya tiene el rol Vendedor.' });
    }
    const resultado = await pool.query(
      `INSERT INTO public.solicitudes_vendedor
         (id_usuario, numero_control, nombre_tienda, giro, ubicacion,
          matriz_horario, horario_resumen, nota_horario)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
       ON CONFLICT (id_usuario) DO UPDATE SET
         numero_control = EXCLUDED.numero_control,
         nombre_tienda = EXCLUDED.nombre_tienda,
         giro = EXCLUDED.giro,
         ubicacion = EXCLUDED.ubicacion,
         matriz_horario = EXCLUDED.matriz_horario,
         horario_resumen = EXCLUDED.horario_resumen,
         nota_horario = EXCLUDED.nota_horario,
         estado = 'Pendiente',
         comentario_revision = NULL,
         id_moderador = NULL,
         fecha_solicitud = NOW(),
         fecha_revision = NULL
       WHERE solicitudes_vendedor.estado = 'Rechazada'
       RETURNING id_solicitud, estado, fecha_solicitud`,
      [id, identificacion.trim(), nombre.trim(), queVende.trim(), ubicacion.trim(),
       JSON.stringify(matrizHorario), horarios.trim(), notaHorario.trim()]
    );
    if (!resultado.rows.length) {
      return res.status(409).json({ mensaje: 'Ya tienes una solicitud pendiente o aprobada.' });
    }
    return res.status(201).json({
      mensaje: 'Tu solicitud fue enviada al moderador y está pendiente de revisión.',
      solicitud: resultado.rows[0]
    });
  } catch (error) { return errorSolicitud(res, error, 'Error enviando solicitud:'); }
}

export async function pendientes(req, res) {
  const id = idSesion(req);
  if (!id) return res.status(401).json({ mensaje: 'Inicia sesión.' });
  try {
    if (!(await tieneRol(pool, id, 'moderador'))) {
      return res.status(403).json({ mensaje: 'Solo los moderadores pueden revisar solicitudes.' });
    }
    const resultado = await pool.query(
      `SELECT s.id_solicitud, s.id_usuario, u.nombre AS solicitante,
              u.correo, s.numero_control, s.nombre_tienda, s.giro,
              s.ubicacion, s.horario_resumen, s.nota_horario,
              s.estado, s.fecha_solicitud
       FROM public.solicitudes_vendedor s
       JOIN public.usuarios u ON u.id_usuario = s.id_usuario
       WHERE s.estado = 'Pendiente'
       ORDER BY s.fecha_solicitud, s.id_solicitud`
    );
    return res.json(resultado.rows);
  } catch (error) { return errorSolicitud(res, error, 'Error listando solicitudes:'); }
}

export async function revisarSolicitud(req, res) {
  const moderadorId = idSesion(req);
  if (!moderadorId) return res.status(401).json({ mensaje: 'Inicia sesión.' });
  const idSolicitud = Number(req.params.id);
  const { decision, comentario = '' } = req.body ?? {};
  if (!Number.isSafeInteger(idSolicitud) || idSolicitud <= 0 ||
      !['Aprobada', 'Rechazada'].includes(decision) ||
      typeof comentario !== 'string' || comentario.length > 500) {
    return res.status(400).json({ mensaje: 'Decisión o solicitud inválida.' });
  }
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    if (!(await tieneRol(client, moderadorId, 'moderador'))) {
      await client.query('ROLLBACK');
      return res.status(403).json({ mensaje: 'Solo los moderadores pueden revisar solicitudes.' });
    }
    const encontrado = await client.query(
      `SELECT id_solicitud, id_usuario, estado FROM public.solicitudes_vendedor
       WHERE id_solicitud = $1 FOR UPDATE`,
      [idSolicitud]
    );
    if (!encontrado.rows.length || encontrado.rows[0].estado !== 'Pendiente') {
      await client.query('ROLLBACK');
      return res.status(409).json({ mensaje: 'La solicitud ya fue revisada o no existe.' });
    }
    const usuarioId = encontrado.rows[0].id_usuario;
    if (decision === 'Aprobada') {
      const rol = await client.query(
        `SELECT id_rol FROM public.roles WHERE LOWER(TRIM(nombre)) = 'vendedor' LIMIT 1`
      );
      if (!rol.rows.length) {
        await client.query('ROLLBACK');
        return res.status(500).json({ mensaje: 'No existe el rol Vendedor en la base de datos.' });
      }
      await client.query(
        `INSERT INTO public.usuario_roles (id_usuario, id_rol, fecha_asignacion)
         SELECT $1, $2, NOW()
         WHERE NOT EXISTS (
           SELECT 1 FROM public.usuario_roles
           WHERE id_usuario = $1 AND id_rol = $2
         )`,
        [usuarioId, rol.rows[0].id_rol]
      );
    }
    const actualizado = await client.query(
      `UPDATE public.solicitudes_vendedor
       SET estado = $1, comentario_revision = $2,
           id_moderador = $3, fecha_revision = NOW()
       WHERE id_solicitud = $4
       RETURNING id_solicitud, estado, id_usuario`,
      [decision, comentario.trim() || null, moderadorId, idSolicitud]
    );
    await client.query('COMMIT');
    return res.json({ mensaje: decision === 'Aprobada' ? 'Solicitud aprobada.' : 'Solicitud rechazada.', solicitud: actualizado.rows[0] });
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    return errorSolicitud(res, error, 'Error revisando solicitud:');
  } finally {
    if (client) client.release();
  }
}
