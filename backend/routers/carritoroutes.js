// backend/routers/carritoroutes.js

import { Router } from 'express';
// Importamos todas las funciones del controlador del carrito
import { 
    getCart, 
    getCartItemCount,
    addOrUpdateCartItem, 
    removeItemFromCart,
    clearUserCart 
} from '../controllers/carritocontroller.js'; 

const router = Router();

// =======================================================
// RUTAS DE LA API PARA EL CARRITO (/api/carrito)
// =======================================================

// 1. OBTENER CARRITO COMPLETO Y CONTEO DE ÍTEMS
router.get('/usuario/:userId', getCart);

// 2. OBTENER SOLO EL CONTEO DE ÍTEMS (Usado por el header en tienda.js)
router.get('/count/usuario/:userId', getCartItemCount);

// 3. AÑADIR O ACTUALIZAR ÍTEM (POST)
// COINCIDE CON LA LLAMADA DEL FRONTEND: /api/carrito/add
router.post('/add', addOrUpdateCartItem); 

// 4. ELIMINAR ÍTEM ESPECÍFICO
router.delete('/item/:productId', removeItemFromCart);

// 5. VACIAR CARRITO COMPLETO
router.delete('/usuario/:userId', clearUserCart);


export default router;