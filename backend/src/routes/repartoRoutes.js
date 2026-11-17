import { Router } from 'express';
import { verificarToken } from '../middleware/auth.js';
import { aceptarPedido, repartos, aceptarReparto, avanzarReparto } from '../controllers/repartoController.js';
const router=Router();
router.post('/pedido/:id/aceptar', verificarToken, aceptarPedido);
router.get('/', verificarToken, repartos);
router.patch('/:id/aceptar', verificarToken, aceptarReparto);
router.patch('/:id/avanzar', verificarToken, avanzarReparto);
export default router;
