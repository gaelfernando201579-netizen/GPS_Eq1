
import { Router } from 'express';

import {
  login,
  registro,
  solicitarCodigoPassword,
  verificarCodigoPassword,
  confirmarCambioPassword,
  cambiarPasswordAutenticado
} from '../controllers/authController.js';

const router = Router();

router.post('/login', login);
router.post('/registro', registro);

router.post('/recuperar-password/solicitar', solicitarCodigoPassword);
router.post('/recuperar-password/verificar', verificarCodigoPassword);
router.post('/recuperar-password/confirmar', confirmarCambioPassword);

router.patch('/cambiar-password', cambiarPasswordAutenticado);

export default router;
