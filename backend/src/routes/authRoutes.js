import { Router } from 'express';
import {
  login,
  registro,
  solicitarCodigoPassword,
  verificarCodigoPassword,
  confirmarCambioPassword
} from '../controllers/authController.js';

const router = Router();

router.post('/login', login);
router.post('/registro', registro);

// Rutas de recuperación estilo Google
router.post('/recuperar-password/solicitar', solicitarCodigoPassword);
router.post('/recuperar-password/verificar', verificarCodigoPassword);
router.post('/recuperar-password/confirmar', confirmarCambioPassword);

export default router;