// backend/routers/carritoroutes.js (Versión COMPLETA y FINAL)

import express from 'express';
import { 
    addOrUpdateCartItem, 
    getCartAPI,          
    removeItem,          
    clearCart,           
} from '../controllers/carritocontroller.js';

const router = express.Router();

// 1. POST /api/carrito - RUTA PARA EL CHANGE QUANTITY DEL CARRITO.JS
router.post('/', addOrUpdateCartItem);

// 1.b POST /api/carrito/add - ¡RUTA AÑADIDA PARA TIENDA.JS!
router.post('/add', addOrUpdateCartItem); 

// 2. GET /api/carrito/usuario/:userId - Obtener todos los ítems para renderizar
router.get('/usuario/:userId', getCartAPI); 

// 3. DELETE /api/carrito/item/:productId - Eliminar un solo ítem
router.delete('/item/:productId', removeItem); 

// 4. DELETE /api/carrito/usuario/:userId - Vaciar todo el carrito
router.delete('/usuario/:userId', clearCart); 

export default router;