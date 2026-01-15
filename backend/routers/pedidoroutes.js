import { Router } from 'express';
// 1. Importamos el controlador
import { finalizarCompra, getHistorialUsuario } from '../controllers/pedidocontroller.js';

// 2. Importamos al "Cadenero"
import { verificarToken } from '../middleware/auth.js'; 

const router = Router();

// 3. Protegemos las rutas

// POST: Pagar (Crear pedido)
router.post('/crear', verificarToken, finalizarCompra);

// GET: Ver historial
router.get('/usuario/:id_usuario', verificarToken, getHistorialUsuario);

export default router;