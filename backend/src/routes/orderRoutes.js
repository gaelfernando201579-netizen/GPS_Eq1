import { Router } from 'express';
import { crearPedido, obtenerMisPedidos } from '../controllers/orderController.js';
import { verificarToken } from '../middleware/auth.js';

const router = Router();
router.post('/', verificarToken, crearPedido);
router.get('/', verificarToken, obtenerMisPedidos);

export default router;