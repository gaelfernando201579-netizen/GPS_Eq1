import { Router } from 'express';
import { verificarToken } from '../middleware/auth.js';
import {
  miSolicitud, enviarSolicitud, pendientes, revisarSolicitud
} from '../controllers/solicitudVendedorController.js';

const router = Router();
router.use(verificarToken);
router.get('/mia', miSolicitud);
router.post('/', enviarSolicitud);
router.get('/pendientes', pendientes);
router.patch('/:id/revisar', revisarSolicitud);
export default router;
