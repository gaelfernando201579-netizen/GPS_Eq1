
import { Router } from 'express';
import { verificarToken } from '../middleware/auth.js';
import { aceptarPedido, repartos, aceptarReparto, avanzarReparto } from '../controllers/repartoController.js';
import { reasignarReparto, cancelarAsignacionRepartidor } from '../controllers/repartoReasignacionController.js';

const router = Router();

router.post('/pedido/:id/aceptar', verificarToken, aceptarPedido);

router.get('/', verificarToken, repartos);

router.patch('/:id/aceptar', verificarToken, aceptarReparto);

router.patch('/:id/avanzar', verificarToken, avanzarReparto);

router.post('/:id/liberar', verificarToken, reasignarReparto);

router.post('/:id/cancelar-asignacion', verificarToken, cancelarAsignacionRepartidor);

export default router;
