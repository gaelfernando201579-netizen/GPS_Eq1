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

export async function obtenerCategorias(req,res) {
  try {
    const r=await pool.query('SELECT nombre FROM public.categorias ORDER BY nombre ASC');
    res.json(r.rows.map(x=>x.nombre));
  } catch(e) {console.error('Categorias:',e);res.status(500).json({mensaje:'No se pudieron consultar las categorías.'});}
}

export async function crearProducto(req, res) {
  const usuario=Number(req.usuario?.id);
  const nombre=String(req.body?.nombre||'').trim();
  const descripcion=String(req.body?.descripcion||'').trim();
  const categoria=String(req.body?.categoria||'').trim();
  const imagen=String(req.body?.imagen_url||'').trim();
  const precio=Number(req.body?.precio);
  const clave=String(req.body?.claveCreacion||'').trim();
  if(!clave||clave.length>80)return res.status(400).json({mensaje:'Identificador de publicación inválido.'});
  if(!nombre||nombre.length>120||descripcion.length>1000||!Number.isFinite(precio)||precio<=0||precio>100000||
    imagen.length>1000||!categoria) return res.status(400).json({mensaje:'Completa nombre, categoría y precio válidos.'});
  try {
    const rol=await pool.query(`SELECT 1 FROM public.usuario_roles ur JOIN public.roles r ON r.id_rol=ur.id_rol
      WHERE ur.id_usuario=$1 AND LOWER(TRIM(r.nombre))='vendedor'`,[usuario]);
    if(!rol.rowCount)return res.status(403).json({mensaje:'Solo vendedores aprobados pueden publicar productos.'});
    const cat=await pool.query(`SELECT id_categoria FROM public.categorias WHERE LOWER(TRIM(nombre))=LOWER($1) LIMIT 1`,[categoria]);
    if(!cat.rowCount)return res.status(400).json({mensaje:'Selecciona una categoría válida del catálogo.'});
    const resultado=await pool.query(`INSERT INTO public.productos
      (id_vendedor,id_categoria,nombre,descripcion,precio,cantidad_disponible,imagen_url,estado,clave_creacion)
      VALUES($1,$2,$3,$4,$5,10,$6,'Aprobado',$7) ON CONFLICT (clave_creacion) WHERE clave_creacion IS NOT NULL DO NOTHING RETURNING id_producto`,
      [usuario,cat.rows[0].id_categoria,nombre,descripcion,precio,imagen||null,clave]);
    if(!resultado.rowCount) {
      const existente=await pool.query('SELECT id_producto FROM public.productos WHERE clave_creacion=$1 AND id_vendedor=$2',[clave,usuario]);
      if(!existente.rowCount)return res.status(409).json({mensaje:'Identificador de producto ya utilizado.'});
      return res.json({id_producto:existente.rows[0].id_producto});
    }
    res.status(201).json({id_producto:resultado.rows[0].id_producto});
  }catch(e){console.error('Crear producto:',e);res.status(500).json({mensaje:'No se pudo crear el producto.'});}
}

export async function editarProducto(req,res) {
  const usuario=Number(req.usuario?.id), id=Number(req.params.id);
  const nombre=String(req.body?.nombre||'').trim(), descripcion=String(req.body?.descripcion||'').trim();
  const categoria=String(req.body?.categoria||'').trim(), imagen=String(req.body?.imagen_url||'').trim();
  const precio=Number(req.body?.precio);
  if(!Number.isSafeInteger(id)||id<1||!nombre||!categoria||!Number.isFinite(precio)||precio<=0||
    descripcion.length>1000||imagen.length>1000)return res.status(400).json({mensaje:'Datos de producto inválidos.'});
  try {
    const r=await pool.query(`UPDATE public.productos p SET
      nombre=$3,descripcion=$4,precio=$5,imagen_url=$6,id_categoria=c.id_categoria
      FROM public.categorias c WHERE p.id_producto=$1 AND p.id_vendedor=$2 AND p.inhabilitado_permanente=FALSE
      AND LOWER(TRIM(c.nombre))=LOWER($7)
      RETURNING p.id_producto`,[id,usuario,nombre,descripcion,precio,imagen||null,categoria]);
    if(!r.rowCount)return res.status(404).json({mensaje:'Producto no encontrado o categoría inválida.'});
    res.json({id_producto:id});
  }catch(e){console.error('Editar producto:',e);res.status(500).json({mensaje:'No se pudo editar el producto.'});}
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
         AND NOT EXISTS(SELECT 1 FROM public.avisos_productos_descartados a WHERE a.id_usuario=$1 AND a.id_producto=productos.id_producto)
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

export async function descartarAvisoProducto(req,res) {
  const usuario=Number(req.usuario?.id), producto=Number(req.params.id);
  if(!Number.isSafeInteger(producto)||producto<1)return res.status(400).json({mensaje:'Producto inválido.'});
  try {
    const r=await pool.query(`INSERT INTO public.avisos_productos_descartados(id_usuario,id_producto)
      SELECT $1,id_producto FROM public.productos WHERE id_producto=$2 AND id_vendedor=$1
      ON CONFLICT DO NOTHING RETURNING id_producto`,[usuario,producto]);
    res.json({mensaje:'Aviso descartado.'});
  }catch(e){console.error('Descartar aviso:',e);res.status(500).json({mensaje:'No se pudo descartar el aviso.'});}
}
