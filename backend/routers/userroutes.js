import express from 'express';
// Importamos las funciones del controlador
import { registrarUsuario, iniciarSesion } from '../controllers/usercontroller.js'; 

const router = express.Router();

/**
 * @route POST /api/usuarios/registro
 */
router.post('/registro', registrarUsuario);

/**
 * @route POST /api/usuarios/login
 */
router.post('/login', iniciarSesion);

export default router;