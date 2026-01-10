import userModel from '../models/usermodel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


const JWT_SECRET = process.env.JWT_SECRET; 

/**
 * Lógica para registrar un nuevo usuario (POST /api/usuarios/registro).
 */
export async function registrarUsuario(req, res) {
    const { 
        nombre, 
        apellido, 
        email, 
        password, 
        telefono, 
        fecha_nacimiento, 
        codigo_postal 
    } = req.body;
    
    // Validaciones básicas (se complementan con express-validator)
    if (!nombre || !apellido || !email || !password || !fecha_nacimiento) {
        return res.status(400).json({ message: 'Campos requeridos faltantes.' });
    }

    try {
        // 1. Verificar si el email ya existe
        const usuarioExistente = await userModel.buscarUsuarioPorEmail(email);
        if (usuarioExistente) {
            return res.status(409).json({ message: 'El correo electrónico ya está registrado.' });
        }

        // 2. Encriptar la contraseña (seguridad)
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 3. Crear el usuario en la BD (llama al Modelo)
        const nuevoUsuario = await userModel.crearUsuario(
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
            message: 'Usuario registrado exitosamente.',
            id_usuario: nuevoUsuario.id_usuario
        });

    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
}

/**
 * Lógica para iniciar sesión de un usuario (POST /api/usuarios/login).
 */
export async function iniciarSesion(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email y contraseña son obligatorios.' });
    }

    try {
        // 1. Buscar usuario
        const usuario = await userModel.buscarUsuarioPorEmail(email);
        if (!usuario) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // 2. Comparar la contraseña (desencriptación)
        const esValido = await bcrypt.compare(password, usuario.password_hash);
        if (!esValido) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // 3. Generar el JSON Web Token (JWT)
        const token = jwt.sign(
            { id: usuario.id_usuario, email: usuario.email },
            JWT_SECRET,
            { expiresIn: '1h' } 
        );

        // 4. Respuesta exitosa
        res.status(200).json({
    success: true, // Añadimos esto para facilitar validación en frontend
    message: 'Inicio de sesión exitoso.',
    token: token,
    user: {
        id_usuario: usuario.id_usuario, // 🚨 ESTO ES LO QUE FALTABA
        nombre: usuario.nombre,
        email: usuario.email
    }
});

    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
}
