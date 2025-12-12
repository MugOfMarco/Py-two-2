// backend/routers/carritorouters.js

import { Router } from 'express';
import { 
    getCart, 
    getCartItemCount,
    addOrUpdateCartItem, 
    removeItemFromCart,
    clearUserCart 
} from '../controllers/carritocontroller.js'; 
// Ajusta la ruta de importación si es necesario.

const router = Router();

// =======================================================
// RUTAS DE LA API PARA EL CARRITO (/api/carrito)
// =======================================================

// 1. OBTENER CARRITO COMPLETO Y CONTEO DE ÍTEMS
// Nota: La URL es /api/carrito/usuario/1 (si el ID es 1)
router.get('/usuario/:userId', getCart);

// 2. OBTENER SOLO EL CONTEO DE ÍTEMS (Usado por el header en tienda.js)
// URL: /api/carrito/count/usuario/1
router.get('/count/usuario/:userId', getCartItemCount);

// 3. AÑADIR O ACTUALIZAR ÍTEM (POST)
// Se usa POST para enviar { userId, productId, quantity } y dejar que el backend
// decida si es una creación o una actualización.
// URL: /api/carrito
router.post('/', addOrUpdateCartItem); 

// 4. ELIMINAR ÍTEM ESPECÍFICO
// URL: DELETE /api/carrito/item/10 (si el ID del producto es 10)
router.delete('/item/:productId', removeItemFromCart);

// 5. VACIAR CARRITO COMPLETO
// URL: DELETE /api/carrito/usuario/1
router.delete('/usuario/:userId', clearUserCart);


export default router;