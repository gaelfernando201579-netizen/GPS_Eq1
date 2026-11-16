import { Router } from 'express';
import { obtenerProductos, crearProducto, inhabilitarProducto, avisosProductosVendedor } from '../controllers/productController.js';
import { verificarToken } from '../middleware/auth.js';

const router = Router();
router.get('/', obtenerProductos);
router.post('/', verificarToken, crearProducto);
router.get('/mis-avisos', verificarToken, avisosProductosVendedor);
router.delete('/:id', verificarToken, inhabilitarProducto);

export default router;