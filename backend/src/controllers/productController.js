// controllers/productController.js
import { pool } from '../config/db.js';

export async function obtenerProductos(req, res) {
  try {
    const { categoria, busqueda } = req.query;
    const filtros = [
      'p.inhabilitado_permanente = FALSE',
      "LOWER(COALESCE(p.estado, '')) NOT IN ('inactivo','rechazado','eliminado','bloqueado','pendiente')",
      `EXISTS (
        SELECT 1 FROM public.usuario_roles ur
        JOIN public.roles r ON r.id_rol = ur.id_rol
        WHERE ur.id_usuario = p.id_vendedor
          AND LOWER(TRIM(r.nombre)) = 'vendedor'
      )`
    ];
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
        u.nombre AS nombre_vendedor,
        cal.calificacion,
        cal.num_resenas
      FROM public.productos p
      LEFT JOIN public.categorias c ON c.id_categoria = p.id_categoria
      LEFT JOIN public.usuarios u ON u.id_usuario = p.id_vendedor
      LEFT JOIN LATERAL (
        SELECT ROUND(AVG(cp.estrellas)::numeric, 1) AS calificacion,
               COUNT(DISTINCT cp.id_pedido)::integer AS num_resenas
        FROM public.detalle_pedido dp
        JOIN public.calificaciones_pedidos cp ON cp.id_pedido = dp.id_pedido
        WHERE dp.id_producto = p.id_producto
      ) cal ON true
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

export async function inhabilitarProducto(req, res) {
  const productoId = Number(req.params.id);
  const usuarioId = Number(req.usuario?.id);
  if (!Number.isSafeInteger(productoId) || productoId <= 0 ||
      !Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
    return res.status(400).json({ mensaje: 'Identificador inválido.' });
  }

  try {
    const permiso = await pool.query(
      `SELECT LOWER(TRIM(r.nombre)) AS rol
       FROM public.usuario_roles ur
       JOIN public.roles r ON r.id_rol = ur.id_rol
       WHERE ur.id_usuario = $1 AND LOWER(TRIM(r.nombre)) IN ('moderador','vendedor')`,
      [usuarioId]
    );
    const roles = permiso.rows.map((fila) => fila.rol);
    const moderador = roles.includes('moderador');
    const vendedor = roles.includes('vendedor');
    if (!moderador && !vendedor) {
      return res.status(403).json({ mensaje: 'No tienes permiso para retirar publicaciones.' });
    }

    const resultado = await pool.query(
      `UPDATE public.productos
       SET inhabilitado_permanente = TRUE,
           fecha_inhabilitacion = NOW(),
           origen_inhabilitacion = $3,
           motivo_inhabilitacion = $4,
           id_usuario_inhabilitacion = $2
       WHERE id_producto = $1
         AND inhabilitado_permanente = FALSE
         AND ($5::boolean OR (id_vendedor = $2 AND $6::boolean))
       RETURNING id_producto, id_vendedor, nombre`,
      [productoId, usuarioId, moderador ? 'Moderación' : 'Vendedor',
       moderador ? 'La publicación fue retirada por moderación.' : 'Publicación retirada por su vendedor.',
       moderador, vendedor]
    );
    if (!resultado.rowCount) {
      return res.status(404).json({ mensaje: 'El producto no existe, ya fue retirado o no te pertenece.' });
    }
    return res.json({ mensaje: 'Publicación inhabilitada correctamente.', producto: resultado.rows[0] });
  } catch (error) {
    console.error('Inhabilitando publicación:', error);
    return res.status(500).json({ mensaje: 'No se pudo inhabilitar el producto.' });
  }
}

export async function avisosProductosVendedor(req, res) {
  const idUsuario = Number(req.usuario?.id);
  if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) {
    return res.status(401).json({ mensaje: 'Debes iniciar sesión.' });
  }
  try {
    const resultado = await pool.query(
      `SELECT id_producto, nombre, origen_inhabilitacion, motivo_inhabilitacion, fecha_inhabilitacion
       FROM public.productos
       WHERE id_vendedor = $1 AND inhabilitado_permanente = TRUE
         AND origen_inhabilitacion IN ('Moderación', 'Retiro de vendedor')
       ORDER BY fecha_inhabilitacion DESC NULLS LAST, id_producto DESC
       LIMIT 15`,
      [idUsuario]
    );
    return res.json(resultado.rows);
  } catch (error) {
    console.error('Consultando avisos de publicaciones:', error);
    return res.status(500).json({ mensaje: 'No se pudieron consultar los avisos.' });
  }
}
