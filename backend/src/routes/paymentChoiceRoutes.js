import { Router } from 'express';
import { verificarToken } from '../middleware/auth.js';
import { obtenerMetodoPedido, guardarMetodoPedido } from '../controllers/paymentChoiceController.js';

const router = Router();
router.get('/:id/metodo-pago', verificarToken, obtenerMetodoPedido);
router.put('/:id/metodo-pago', verificarToken, guardarMetodoPedido);
export default router;
