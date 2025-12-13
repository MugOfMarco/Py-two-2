import express from 'express';
// Importamos las funciones del controlador
import { registrarUsuario, iniciarSesion } from '../controllers/usercontroller.js'; 

const router = express.Router();

/**
 * @route POST /api/usuarios/registro
 * @description Ruta para crear un nuevo usuario.
 */
router.post('/registro', registrarUsuario);

/**
 * @route POST /api/usuarios/login
 * @description Ruta para autenticar al usuario y recibir el token JWT.
 */
router.post('/login', iniciarSesion);

export default router;