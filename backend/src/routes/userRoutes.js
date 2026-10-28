import { Router } from 'express';
import { obtenerPerfil, actualizarPerfil } from '../controllers/userController.js';
import { verificarToken } from '../middleware/auth.js';

const router = Router();
router.get('/perfil', verificarToken, obtenerPerfil);
router.put('/perfil', verificarToken, actualizarPerfil);

export default router;