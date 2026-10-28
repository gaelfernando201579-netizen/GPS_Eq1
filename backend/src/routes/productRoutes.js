import { Router } from 'express';
import { obtenerProductos, crearProducto } from '../controllers/productController.js';
import { verificarToken } from '../middleware/auth.js';

const router = Router();
router.get('/', obtenerProductos);
router.post('/', verificarToken, crearProducto);

export default router;