import { Router } from 'express';
import {
  crearPedido, obtenerMisPedidos, obtenerPedidosVendedor, cancelarPedido, actualizarEstadoPedidoVendedor, confirmarRecepcionComprador, calificarPedido
} from '../controllers/orderController.js';
import { verificarToken } from '../middleware/auth.js';
import { guardarComentarioEntrega } from '../controllers/comentarioEntregaController.js';

const router = Router();
router.post('/', verificarToken, crearPedido);
router.get('/', verificarToken, obtenerMisPedidos);
router.get('/vendedor', verificarToken, obtenerPedidosVendedor);
router.post('/:id/cancel', verificarToken, cancelarPedido);
router.patch('/:id/estado', verificarToken, actualizarEstadoPedidoVendedor);
router.patch('/:id/confirmar-recepcion', verificarToken, confirmarRecepcionComprador);
router.post('/:id/calificacion', verificarToken, calificarPedido);
router.patch('/:id/comentario-entrega', verificarToken, guardarComentarioEntrega);

export default router;
