import { Router } from 'express';
// 🚨 Importamos el controlador API (la función que responde a HTTP)
import { getProductsAPI } from '../controllers/productcontroller.js';

const router = Router();

// 1. Ruta para obtener todos los productos (y manejar la búsqueda por query parameter)
// Ejemplo de llamada: GET /api/productos?q=conejo
router.get('/', getProductsAPI);

// 2. Aquí podríamos añadir rutas para obtener por ID, crear, actualizar, etc.
// router.get('/:id', getProductById); 

export default router;