
import { pool } from '../config/db.js';

const camposTarjeta = `
  id_tarjeta::text AS id,
  titular,
  marca,
  ultimos4,
  vencimiento,
  predeterminada
`;

const usuarioId = (req) => Number(req.usuario?.id);

const idValido = (valor) =>
  /^\d+$/.test(String(valor)) && Number(valor) > 0;

export async function listarTarjetas(req, res) {
  try {
    const resultado = await pool.query(
      `SELECT ${camposTarjeta}
       FROM public.tarjetas_guardadas
       WHERE id_usuario = $1
       ORDER BY predeterminada DESC, id_tarjeta DESC`,
      [usuarioId(req)]
    );

    res.json(resultado.rows);
  } catch (error) {
    console.error('Listando tarjetas:', error);
    res.status(500).json({
      mensaje: 'No se pudieron consultar las tarjetas.'
    });
  }
}

export async function crearTarjeta(req, res) {
  const { titular, marca, ultimos4, vencimiento } = req.body || {};

  if (
    Object.keys(req.body || {}).some(
      clave => !['titular', 'marca', 'ultimos4', 'vencimiento'].includes(clave)
    ) ||
    typeof titular !== 'string' ||
    !titular.trim() ||
    titular.length > 80 ||
    marca !== 'Visa (prueba)' ||
    ultimos4 !== '4242' ||
    vencimiento !== '12/30'
  ) {
    return res.status(400).json({
      mensaje: 'Usa únicamente los datos autorizados de la tarjeta de prueba.'
    });
  }

  let cliente;

  try {
    cliente = await pool.connect();
    await cliente.query('BEGIN');

    await cliente.query(
      'SELECT id_usuario FROM public.usuarios WHERE id_usuario = $1 FOR UPDATE',
      [usuarioId(req)]
    );

    const total = await cliente.query(
      `SELECT COUNT(*)::int AS cantidad
       FROM public.tarjetas_guardadas
       WHERE id_usuario = $1`,
      [usuarioId(req)]
    );

    const resultado = await cliente.query(
      `INSERT INTO public.tarjetas_guardadas
       (id_usuario, titular, marca, ultimos4, vencimiento, predeterminada)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${camposTarjeta}`,
      [
        usuarioId(req),
        titular.trim(),
        marca,
        ultimos4,
        vencimiento,
        total.rows[0].cantidad === 0
      ]
    );

    await cliente.query('COMMIT');
    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    if (cliente) await cliente.query('ROLLBACK').catch(() => {});
    console.error('Guardando tarjeta:', error);
    res.status(500).json({
      mensaje: 'No fue posible guardar la tarjeta.'
    });
  } finally {
    if (cliente) cliente.release();
  }
}

export async function predeterminarTarjeta(req, res) {
  if (!idValido(req.params.id)) {
    return res.status(400).json({ mensaje: 'Tarjeta inválida.' });
  }

  let cliente;

  try {
    cliente = await pool.connect();
    await cliente.query('BEGIN');

    await cliente.query(
      'SELECT id_usuario FROM public.usuarios WHERE id_usuario = $1 FOR UPDATE',
      [usuarioId(req)]
    );

    const existe = await cliente.query(
      `SELECT 1 FROM public.tarjetas_guardadas
       WHERE id_tarjeta = $1 AND id_usuario = $2`,
      [req.params.id, usuarioId(req)]
    );

    if (!existe.rowCount) {
      await cliente.query('ROLLBACK');
      return res.status(404).json({
        mensaje: 'Tarjeta no encontrada.'
      });
    }

    await cliente.query(
      `UPDATE public.tarjetas_guardadas
       SET predeterminada = false
       WHERE id_usuario = $1 AND predeterminada`,
      [usuarioId(req)]
    );

    await cliente.query(
      `UPDATE public.tarjetas_guardadas
       SET predeterminada = true
       WHERE id_usuario = $1 AND id_tarjeta = $2`,
      [usuarioId(req), req.params.id]
    );

    await cliente.query('COMMIT');

    res.json({
      mensaje: 'Tarjeta predeterminada actualizada.'
    });
  } catch (error) {
    if (cliente) await cliente.query('ROLLBACK').catch(() => {});
    console.error('Predeterminando tarjeta:', error);
    res.status(500).json({
      mensaje: 'No se pudo actualizar la tarjeta.'
    });
  } finally {
    if (cliente) cliente.release();
  }
}

export async function borrarTarjeta(req, res) {
  if (!idValido(req.params.id)) {
    return res.status(400).json({ mensaje: 'Tarjeta inválida.' });
  }

  let cliente;

  try {
    cliente = await pool.connect();
    await cliente.query('BEGIN');

    await cliente.query(
      'SELECT id_usuario FROM public.usuarios WHERE id_usuario = $1 FOR UPDATE',
      [usuarioId(req)]
    );

    const borrada = await cliente.query(
      `DELETE FROM public.tarjetas_guardadas
       WHERE id_usuario = $1 AND id_tarjeta = $2
       RETURNING predeterminada`,
      [usuarioId(req), req.params.id]
    );

    if (!borrada.rowCount) {
      await cliente.query('ROLLBACK');
      return res.status(404).json({
        mensaje: 'Tarjeta no encontrada.'
      });
    }

    if (borrada.rows[0].predeterminada) {
      await cliente.query(
        `UPDATE public.tarjetas_guardadas
         SET predeterminada = true
         WHERE id_tarjeta = (
           SELECT id_tarjeta
           FROM public.tarjetas_guardadas
           WHERE id_usuario = $1
           ORDER BY id_tarjeta DESC
           LIMIT 1
         )`,
        [usuarioId(req)]
      );
    }

    await cliente.query('COMMIT');
    res.json({ mensaje: 'Tarjeta eliminada.' });
  } catch (error) {
    if (cliente) await cliente.query('ROLLBACK').catch(() => {});
    console.error('Eliminando tarjeta:', error);
    res.status(500).json({
      mensaje: 'No se pudo eliminar la tarjeta.'
    });
  } finally {
    if (cliente) cliente.release();
  }
}
