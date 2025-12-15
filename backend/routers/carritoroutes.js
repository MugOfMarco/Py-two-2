// backend/routers/carritorouters.js

import { Router } from 'express';
import { 
    getCart, 
    addOrUpdateCartItem, 
    removeItemFromCart,
    clearUserCart 
} from '../controllers/carritocontroller.js'; // 👈 Asegúrate que esta ruta es correcta

const router = Router();

// =======================================================
// RUTAS DE LA API PARA EL CARRITO (/api/carrito)
// =======================================================

// 1. OBTENER CARRITO COMPLETO Y CONTEO DE ÍTEMS
// URL: /api/carrito/usuario/1 (si el ID es 1)
router.get('/usuario/:userId', getCart);

// 2. AÑADIR O ACTUALIZAR ÍTEM (POST)
// URL: /api/carrito/add
router.post('/add', addOrUpdateCartItem); 

// 3. ELIMINAR ÍTEM ESPECÍFICO
// URL: DELETE /api/carrito/item/10 (si el ID del producto es 10)
router.delete('/item/:productId', removeItemFromCart);

// 4. VACIAR CARRITO COMPLETO
// URL: DELETE /api/carrito/usuario/1
router.delete('/usuario/:userId', clearUserCart);


export default router;