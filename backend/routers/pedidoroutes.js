import { Router } from 'express';
// Importamos AMBAS funciones del controlador
import { finalizarCompra, getHistorialUsuario } from '../controllers/pedidocontroller.js';

const router = Router();

// Ruta para hacer el pago (POST)
router.post('/crear', finalizarCompra);

// Ruta para ver el historial (GET)
router.get('/usuario/:id_usuario', getHistorialUsuario);

export default router;