
import { Router } from 'express';
import { verificarToken } from '../middleware/auth.js';

import {
  listarTarjetas,
  crearTarjeta,
  predeterminarTarjeta,
  borrarTarjeta
} from '../controllers/cardController.js';

const router = Router();

router.use(verificarToken);

router.get('/', listarTarjetas);
router.post('/', crearTarjeta);
router.patch('/:id/predeterminada', predeterminarTarjeta);
router.delete('/:id', borrarTarjeta);

export default router;
