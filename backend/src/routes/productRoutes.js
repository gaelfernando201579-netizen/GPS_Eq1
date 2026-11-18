import { Router } from 'express';
import { obtenerProductos, obtenerCategorias, crearProducto, editarProducto, inhabilitarProducto, avisosProductosVendedor, descartarAvisoProducto } from '../controllers/productController.js';
import { cargarFoto, subirFotoProducto } from '../controllers/productoFotoController.js';
import { verificarToken } from '../middleware/auth.js';

const router = Router();
router.get('/', obtenerProductos);
router.get('/categorias', obtenerCategorias);
router.post('/foto', verificarToken, (req,res,next) => cargarFoto(req,res,error => error ? res.status(400).json({mensaje:'Selecciona una foto JPG, PNG o WEBP de hasta 5 MB.'}) : next()), subirFotoProducto);
router.post('/', verificarToken, crearProducto);
router.patch('/:id', verificarToken, editarProducto);
router.post('/mis-avisos/:id/descartar', verificarToken, descartarAvisoProducto);
router.get('/mis-avisos', verificarToken, avisosProductosVendedor);
router.delete('/:id', verificarToken, inhabilitarProducto);

export default router;