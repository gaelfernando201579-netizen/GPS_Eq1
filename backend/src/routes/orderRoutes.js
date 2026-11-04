// routes/orderRoutes.js
import { Router } from 'express';
import { crearPedido, obtenerMisPedidos, cancelarPedido } from '../controllers/orderController.js';
import { verificarToken } from '../middleware/auth.js';

const router = Router();
router.post('/', verificarToken, crearPedido);
router.get('/', verificarToken, obtenerMisPedidos);
router.post('/:id/cancel', verificarToken, cancelarPedido); // Nueva ruta para cancelar pedido

export default router;