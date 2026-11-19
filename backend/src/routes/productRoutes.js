
import { Router } from 'express';

import {
  obtenerProductos,
  obtenerCategorias,
  crearProducto,
  editarProducto,
  inhabilitarProducto,
  avisosProductosVendedor,
  descartarAvisoProducto,
  obtenerResenasProducto
} from '../controllers/productController.js';

import {
  cargarFoto,
  subirFotoProducto
} from '../controllers/productoFotoController.js';

import { verificarToken } from '../middleware/auth.js';

const router = Router();

// Consultar productos y categorías
router.get('/', obtenerProductos);
router.get('/categorias', obtenerCategorias);

// Consultar reseñas reales de un producto desde Supabase
router.get('/:id/resenas', obtenerResenasProducto);

// Subir fotografía del producto
router.post(
  '/foto',
  verificarToken,
  (req, res, next) =>
    cargarFoto(req, res, error =>
      error
        ? res.status(400).json({
            mensaje: 'Selecciona una foto JPG, PNG o WEBP de hasta 5 MB.'
          })
        : next()
    ),
  subirFotoProducto
);

// Crear producto
router.post('/', verificarToken, crearProducto);

// Editar producto
router.patch('/:id', verificarToken, editarProducto);

// Avisos de publicaciones retiradas
router.post(
  '/mis-avisos/:id/descartar',
  verificarToken,
  descartarAvisoProducto
);

router.get(
  '/mis-avisos',
  verificarToken,
  avisosProductosVendedor
);

// Inhabilitar producto
router.delete('/:id', verificarToken, inhabilitarProducto);

export default router;
