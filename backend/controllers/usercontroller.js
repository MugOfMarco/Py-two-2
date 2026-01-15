import userModel from '../models/usermodel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Leemos la clave secreta del archivo .env
// Si por alguna razón no la lee, usa una de respaldo (solo para desarrollo)
const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_fallback';

/**
 * REGISTRAR USUARIO (POST /api/usuarios/registro)
 */
export const registrarUsuario = async (req, res) => {
    const { 
        nombre, 
        apellido, 
        email, 
        password, 
        telefono, 
        fecha_nacimiento, 
        codigo_postal 
    } = req.body;
    
    // Validaciones básicas
    if (!nombre || !apellido || !email || !password || !fecha_nacimiento) {
        return res.status(400).json({ success: false, message: 'Faltan campos obligatorios.' });
    }

    try {
        // 1. Verificar si el email ya existe
        const usuarioExistente = await userModel.buscarUsuarioPorEmail(email);
        if (usuarioExistente) {
            return res.status(409).json({ success: false, message: 'El correo electrónico ya está registrado.' });
        }

        // 2. Encriptar la contraseña
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 3. Crear el usuario en la BD
        const nuevoUsuarioId = await userModel.crearUsuario(
            nombre, 
            apellido, 
            email, 
            passwordHash, 
            telefono, 
            fecha_nacimiento, 
            codigo_postal
        );

        // 4. Respuesta exitosa
        res.status(201).json({ 
            success: true,
            message: 'Usuario registrado exitosamente.',
            id_usuario: nuevoUsuarioId
        });

    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};

/**
 * INICIAR SESIÓN (POST /api/usuarios/login)
 * Nota: La exportamos como 'login' para que coincida con userroutes.js
 */
export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email y contraseña son obligatorios.' });
    }

    try {
        // 1. Buscar usuario por email
        const usuario = await userModel.buscarUsuarioPorEmail(email);
        
        if (!usuario) {
            return res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos.' });
        }

        // 2. Verificar Contraseña
        // NOTA: Si tienes usuarios viejos con contraseña plana (ej: "12345"), esto fallará.
        // Deben ser usuarios nuevos o registrados con bcrypt.
        const passwordValida = await bcrypt.compare(password, usuario.password_hash);
        
        if (!passwordValida) {
            return res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos.' });
        }

        // 3. Generar Token (Usando la clave del .env)
        const token = jwt.sign(
            { id: usuario.id_usuario, email: usuario.email },
            JWT_SECRET, // 🔐 Aquí usamos la clave segura
            { expiresIn: '2h' } 
        );

        // 4. Respuesta Exitosa
        // 🚨 IMPORTANTE: Enviamos 'id_usuario' en la raíz para que login.js lo lea fácil
        res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso.',
            token: token,
            id_usuario: usuario.id_usuario, // Para localStorage.getItem('userId')
            nombre: usuario.nombre,
            user: { // Información extra por si la necesitas luego
                email: usuario.email,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};