import { pool } from '../config/db.js';

const NUM_MAX_PRODUCTOS = 50;
const CANTIDAD_MAX = 100;

function errorCliente(mensaje, status = 400) {
  const error = new Error(mensaje);
  error.status = status;
  return error;
}

function normalizarItems(items) {
  if (!Array.isArray(items) || items.length === 0 || items.length > NUM_MAX_PRODUCTOS) {
    throw errorCliente('Agrega entre 1 y 50 productos al carrito.');
  }
  const cantidades = new Map();
  for (const item of items) {
    const id = Number(item.id_producto ?? item.id);
    const cantidad = Number(item.cantidad);
    if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(cantidad) || cantidad < 1 || cantidad > CANTIDAD_MAX) {
      throw errorCliente('Los productos y las cantidades deben ser válidos.');
    }
    const nuevaCantidad = (cantidades.get(id) || 0) + cantidad;
    if (nuevaCantidad > CANTIDAD_MAX) throw errorCliente('Cantidad máxima por producto: 100.');
    cantidades.set(id, nuevaCantidad);
  }
  return cantidades;
}

export async function crearPedido(req, res) {
  let client;
  try {
    if (!Number.isSafeInteger(Number(req.usuario?.id)) || Number(req.usuario.id) <= 0) {
      throw errorCliente('Debes iniciar sesión para comprar.', 401);
    }
    const cantidades = normalizarItems(req.body?.items);
    const puntoEntrega = req.body?.puntoEntrega?.trim();
    const horarioEntrega = req.body?.horarioEntrega;
    const fechaEntrega = new Date(horarioEntrega);
    if (typeof puntoEntrega !== 'string' || puntoEntrega.length < 5 || puntoEntrega.length > 200) {
      throw errorCliente('Especifica un punto de entrega de al menos 5 caracteres.');
    }
    if (typeof horarioEntrega !== 'string' || !Number.isFinite(fechaEntrega.getTime()) ||
      fechaEntrega.getTime() <= Date.now() || fechaEntrega.getTime() > Date.now() + 30 * 86400000) {
      throw errorCliente('Selecciona una fecha y hora futuras dentro de los próximos 30 días. Se permite el mismo día si la hora no ha pasado.');
    }
    // Los horarios de entrega se interpretan según la hora del ITO (Oaxaca, México).
    const partesHora = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(fechaEntrega);
    const hora = Number(partesHora.find((parte) => parte.type === 'hour')?.value);
    const minuto = Number(partesHora.find((parte) => parte.type === 'minute')?.value);
    const minutosDelDia = hora * 60 + minuto;
    if (minutosDelDia < 7 * 60 || minutosDelDia > 18 * 60) {
      throw errorCliente('La hora de entrega debe estar entre las 7:00 a. m. y las 6:00 p. m. (hora de Oaxaca).');
    }

    client = await pool.connect();
    await client.query('BEGIN');
    const compradorId = Number(req.usuario.id);
    const comprador = await client.query(
      `SELECT id_usuario FROM public.usuarios WHERE id_usuario = $1 AND LOWER(estado) = 'activo'`,
      [compradorId]
    );
    if (!comprador.rowCount) throw errorCliente('Tu cuenta no está activa.', 403);

    const resultados = await client.query(
      `SELECT id_producto, id_vendedor, nombre, precio, cantidad_disponible, estado
       FROM public.productos WHERE id_producto = ANY($1::integer[])
       ORDER BY id_producto FOR UPDATE`,
      [[...cantidades.keys()]]
    );
    if (resultados.rowCount !== cantidades.size) {
      throw errorCliente('Uno de los productos ya no está disponible.', 409);
    }

    const porVendedor = new Map();
    for (const producto of resultados.rows) {
      const cantidad = cantidades.get(producto.id_producto);
      if (['inactivo', 'rechazado', 'eliminado', 'bloqueado', 'pendiente'].includes(String(producto.estado).toLowerCase())) {
        throw errorCliente(`El producto "${producto.nombre}" no está disponible.`, 409);
      }
      if (Number(producto.cantidad_disponible) < cantidad) {
        throw errorCliente(`No hay suficientes existencias de "${producto.nombre}".`, 409);
      }
      if (!Number.isFinite(Number(producto.precio)) || Number(producto.precio) < 0) {
        throw errorCliente(`Precio inválido para "${producto.nombre}".`, 409);
      }
      if (Number(producto.id_vendedor) === compradorId) {
        throw errorCliente('No puedes comprarte productos a ti mismo.', 400);
      }
      const idVendedor = Number(producto.id_vendedor);
      if (!porVendedor.has(idVendedor)) porVendedor.set(idVendedor, []);
      porVendedor.get(idVendedor).push({ ...producto, cantidad });
    }

    const idsPedidos = [];
    for (const [idVendedor, productos] of porVendedor) {
      const subtotalCentavos = productos.reduce(
        (suma, producto) => suma + Math.round(Number(producto.precio) * 100) * producto.cantidad, 0
      );
      const subtotal = (subtotalCentavos / 100).toFixed(2);
      const creado = await client.query(
        `INSERT INTO public.pedidos
           (id_comprador, id_vendedor, subtotal, total, punto_entrega_acordado,
            horario_entrega_acordado, estado, fecha_pedido)
         VALUES ($1, $2, $3, $3, $4, $5, 'Pendiente', CURRENT_TIMESTAMP)
         RETURNING id_pedido`,
        [compradorId, idVendedor, subtotal, puntoEntrega, fechaEntrega.toISOString()]
      );
      const idPedido = creado.rows[0].id_pedido;
      for (const producto of productos) {
        const precio = Number(producto.precio).toFixed(2);
        const subtotalDetalle = (Math.round(Number(producto.precio) * 100) * producto.cantidad / 100).toFixed(2);
        await client.query(
          `INSERT INTO public.detalle_pedido
             (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
           VALUES ($1, $2, $3, $4, $5)`,
          [idPedido, producto.id_producto, producto.cantidad, precio, subtotalDetalle]
        );
      }
      idsPedidos.push(idPedido);
    }

    await client.query('COMMIT');
    return res.status(201).json({
      mensaje: idsPedidos.length === 1 ? 'Pedido registrado en Supabase.' : 'Pedidos registrados en Supabase.',
      idsPedidos,
      totalPedidos: idsPedidos.length
    });
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    if (!error.status) console.error('Error guardando pedido:', error);
    return res.status(error.status || 500).json({
      mensaje: error.status ? error.message : 'No se pudo guardar el pedido en Supabase.'
    });
  } finally {
    if (client) client.release();
  }
}

async function consultarPedidos(req, res, campo) {
  try {
    if (!Number.isSafeInteger(Number(req.usuario?.id)) || Number(req.usuario.id) <= 0) {
      return res.status(401).json({ mensaje: 'Inicia sesión para ver tus pedidos.' });
    }
    // Solo se interpolan nombres de columnas constantes definidos por el servidor.
    const resultado = await pool.query(
      `SELECT p.id_pedido, p.estado, p.total, p.subtotal, p.fecha_pedido,
              p.punto_entrega_acordado, p.horario_entrega_acordado,
              c.nombre AS comprador_nombre, v.nombre AS vendedor_nombre,
              d.id_producto, d.cantidad, d.precio_unitario,
              pr.nombre AS producto_nombre, pr.imagen_url
       FROM public.pedidos p
       JOIN public.usuarios c ON c.id_usuario = p.id_comprador
       JOIN public.usuarios v ON v.id_usuario = p.id_vendedor
       LEFT JOIN public.detalle_pedido d ON d.id_pedido = p.id_pedido
       LEFT JOIN public.productos pr ON pr.id_producto = d.id_producto
       WHERE p.${campo} = $1
       ORDER BY p.fecha_pedido DESC, p.id_pedido DESC, d.id_producto`,
      [Number(req.usuario.id)]
    );
    const mapa = new Map();
    for (const fila of resultado.rows) {
      if (!mapa.has(fila.id_pedido)) {
        mapa.set(fila.id_pedido, {
          id: fila.id_pedido,
          compradorNombre: fila.comprador_nombre,
          compradorCarrera: '',
          tienda: `Vende: ${fila.vendedor_nombre}`,
          estado: fila.estado,
          total: Number(fila.total),
          puntoEntrega: fila.punto_entrega_acordado,
          hora: fila.horario_entrega_acordado,
          lugarRecoleccion: 'Por acordar con el vendedor',
          metodoPago: 'Pendiente',
          requiereRepartidor: false,
          repartidorAsignado: null,
          notaCancelacion: '',
          items: []
        });
      }
      if (fila.id_producto !== null) {
        mapa.get(fila.id_pedido).items.push({
          id: fila.id_producto,
          nombre: fila.producto_nombre,
          imagen: fila.imagen_url,
          cantidad: Number(fila.cantidad),
          precio: Number(fila.precio_unitario)
        });
      }
    }
    return res.json([...mapa.values()]);
  } catch (error) {
    console.error('Error consultando pedidos:', error);
    return res.status(500).json({ mensaje: 'No se pudieron consultar los pedidos.' });
  }
}

export async function obtenerMisPedidos(req, res) {
  return consultarPedidos(req, res, 'id_comprador');
}

export async function obtenerPedidosVendedor(req, res) {
  const permiso = await pool.query(
    `SELECT 1 FROM public.usuario_roles ur JOIN public.roles r ON r.id_rol = ur.id_rol
     WHERE ur.id_usuario = $1 AND LOWER(r.nombre) = 'vendedor' LIMIT 1`,
    [req.usuario.id]
  ).catch(() => null);
  if (!permiso) return res.status(500).json({ mensaje: 'No se pudo validar el rol del vendedor.' });
  if (!permiso.rowCount) return res.status(403).json({ mensaje: 'No tienes rol de vendedor.' });
  return consultarPedidos(req, res, 'id_vendedor');
}

export async function cancelarPedido(req, res) {
  const idPedido = Number(req.params.id);
  if (!Number.isSafeInteger(idPedido) || idPedido <= 0) {
    return res.status(400).json({ mensaje: 'Pedido inválido.' });
  }
  try {
    const resultado = await pool.query(
      `UPDATE public.pedidos SET estado = 'Cancelado'
       WHERE id_pedido = $1 AND id_comprador = $2 AND estado = 'Pendiente'
         AND fecha_pedido >= CURRENT_TIMESTAMP - INTERVAL '10 minutes'
       RETURNING id_pedido`,
      [idPedido, req.usuario.id]
    );
    if (!resultado.rowCount) return res.status(409).json({ mensaje: 'Solo puedes cancelar tus pedidos pendientes dentro de los primeros 10 minutos.' });
    return res.json({ mensaje: 'Pedido cancelado.' });
  } catch (error) {
    console.error('Error al cancelar pedido:', error);
    return res.status(500).json({ mensaje: 'No se pudo cancelar el pedido.' });
  }
}


// Los cambios que hace un vendedor deben persistir en la BD, no solo en React.
export async function actualizarEstadoPedidoVendedor(req, res) {
  const idPedido = Number(req.params.id);
  const estadoNuevo = req.body?.estado;
  const estadosPermitidos = ['En preparación', 'En camino', 'En el punto de entrega', 'Entregado', 'Cancelado'];
  if (!Number.isSafeInteger(idPedido) || idPedido <= 0 || !estadosPermitidos.includes(estadoNuevo)) {
    return res.status(400).json({ mensaje: 'Pedido o estado inválido.' });
  }
  if (!Number.isSafeInteger(Number(req.usuario?.id)) || Number(req.usuario.id) <= 0) {
    return res.status(401).json({ mensaje: 'Debes iniciar sesión.' });
  }
  try {
    const vendedorId = Number(req.usuario.id);
    const rol = await pool.query(
      `SELECT 1 FROM public.usuario_roles ur
       JOIN public.roles r ON r.id_rol = ur.id_rol
       WHERE ur.id_usuario = $1 AND LOWER(r.nombre) = 'vendedor' LIMIT 1`,
      [vendedorId]
    );
    if (!rol.rowCount) return res.status(403).json({ mensaje: 'Solo un vendedor puede modificar sus pedidos.' });

    const transiciones = {
      'En preparación': ['Pendiente'],
      'En camino': ['En preparación'],
      'En el punto de entrega': ['En camino'],
      'Entregado': ['En el punto de entrega'],
      'Cancelado': ['Pendiente', 'En preparación', 'En camino', 'En el punto de entrega']
    };
    const resultado = await pool.query(
      `UPDATE public.pedidos
       SET estado = $1
       WHERE id_pedido = $2 AND id_vendedor = $3
         AND estado = ANY($4::text[])
       RETURNING id_pedido, estado`,
      [estadoNuevo, idPedido, vendedorId, transiciones[estadoNuevo]]
    );
    if (!resultado.rowCount) {
      return res.status(409).json({
        mensaje: 'No fue posible cambiar el estado: el pedido no pertenece a tu cuenta o ya cambió de estado. Recarga los pedidos.'
      });
    }
    return res.json({ mensaje: 'Estado del pedido guardado en Supabase.', pedido: resultado.rows[0] });
  } catch (error) {
    console.error('Error actualizando el estado del pedido:', error);
    return res.status(500).json({ mensaje: 'No se pudo actualizar el pedido en Supabase. Revisa el backend y las restricciones del estado.' });
  }
}


// Solo el comprador puede confirmar una recepción que realmente ya está lista para entregar.
export async function confirmarRecepcionComprador(req, res) {
  const idPedido = Number(req.params.id);
  if (!Number.isSafeInteger(idPedido) || idPedido <= 0) {
    return res.status(400).json({ mensaje: 'Pedido inválido.' });
  }
  if (!Number.isSafeInteger(Number(req.usuario?.id)) || Number(req.usuario.id) <= 0) {
    return res.status(401).json({ mensaje: 'Debes iniciar sesión.' });
  }
  try {
    const resultado = await pool.query(
      `UPDATE public.pedidos SET estado = 'Entregado'
       WHERE id_pedido = $1 AND id_comprador = $2 AND estado = 'En el punto de entrega'
       RETURNING id_pedido, estado`,
      [idPedido, Number(req.usuario.id)]
    );
    if (!resultado.rowCount) {
      return res.status(409).json({ mensaje: 'Solo puedes confirmar la recepción cuando el pedido está en el punto de entrega.' });
    }
    return res.json({ mensaje: 'Recepción confirmada y guardada en Supabase.', pedido: resultado.rows[0] });
  } catch (error) {
    console.error('Error confirmando recepción del pedido:', error);
    return res.status(500).json({ mensaje: 'No se pudo guardar la recepción en Supabase.' });
  }
}
