import { Router } from 'express';
import {
  crearPedido, obtenerMisPedidos, obtenerPedidosVendedor, cancelarPedido
} from '../controllers/orderController.js';
import { verificarToken } from '../middleware/auth.js';

const router = Router();
router.post('/', verificarToken, crearPedido);
router.get('/', verificarToken, obtenerMisPedidos);
router.get('/vendedor', verificarToken, obtenerPedidosVendedor);
router.post('/:id/cancel', verificarToken, cancelarPedido);

export default router;
