import { Router } from 'express';
import { 
    getCart, 
    addOrUpdateCartItem, 
    removeItemFromCart,
    clearUserCart 
} from '../controllers/carritocontroller.js';

// 1. IMPORTAR EL GUARDIA DE SEGURIDAD (Middleware)
// Asegúrate de que la ruta '../middleware/auth.js' exista y sea correcta
import { verificarToken } from '../middleware/auth.js'; 

const router = Router();

// =======================================================
// RUTAS DE LA API PARA EL CARRITO (/api/carrito)
// =======================================================

// NOTA: Agregamos 'verificarToken' antes de llamar al controlador.
// Esto llena 'req.user' con los datos del token.

// 1. OBTENER CARRITO
// URL: /api/carrito/usuario/1
router.get('/usuario/:userId', verificarToken, getCart);

// 2. AÑADIR O ACTUALIZAR ÍTEM (POST) -> ¡Aquí fallaba!
// Ahora con 'verificarToken', el controlador recibirá el ID correctamente.
router.post('/add', verificarToken, addOrUpdateCartItem); 

// 3. ELIMINAR ÍTEM ESPECÍFICO
router.delete('/item/:productId', verificarToken, removeItemFromCart);

// 4. VACIAR CARRITO COMPLETO
router.delete('/usuario/:userId', verificarToken, clearUserCart);

export default router;