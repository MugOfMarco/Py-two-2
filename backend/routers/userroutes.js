import express from 'express';

// 1. IMPORTAMOS CONTROLADORES
// Nota: Importamos 'login' porque así se llama en el controlador que te pasé.
// Si prefieres usar 'iniciarSesion', tendrías que cambiarle el nombre en el controlador.
import { 
    registrarUsuario, 
    login, 
    obtenerPerfil, 
    actualizarPerfil 
} from '../controllers/usercontroller.js'; 

// 2. IMPORTAMOS MIDDLEWARE (SEGURIDAD)
import { verificarToken } from '../middleware/auth.js'; 

const router = express.Router();

// ====================================================================
// RUTAS PÚBLICAS (No requieren token)
// ====================================================================

/**
 * @route POST /api/usuarios/registro
 * @description Ruta para crear un nuevo usuario.
 */
router.post('/registro', registrarUsuario);

/**
 * @route POST /api/usuarios/login
 * @description Ruta para autenticar al usuario.
 * Usamos la función 'login' del controlador.
 */
router.post('/login', login);


// ====================================================================
// RUTAS PRIVADAS (Requieren 'verificarToken')
// ====================================================================

// GET: Para leer los datos actuales y llenar el formulario
router.get('/perfil', verificarToken, obtenerPerfil);

// PUT: Para guardar los cambios editados
router.put('/perfil', verificarToken, actualizarPerfil);


// 3. EXPORTAR AL FINAL (Siempre debe ser lo último)
export default router;