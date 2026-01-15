import { Router } from 'express';

// 🚨 CORRECCIÓN AQUÍ: 
// Importamos 'login' (que es como se llama ahora en el controlador)
import { registrarUsuario, login } from '../controllers/usercontroller.js'; 

const router = Router();

// Ruta para registrarse
router.post('/register', registrarUsuario); // Ojo: verifica si en tu frontend llamas a /register o /registro

// Ruta para iniciar sesión
router.post('/login', login);

export default router;