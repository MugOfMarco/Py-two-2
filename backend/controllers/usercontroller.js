import userModel from '../models/usermodel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Se recomienda obtener la clave secreta del .env y guardarla aquí
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_super_segura'; 
// Asegúrate de definir JWT_SECRET en tu archivo .env: JWT_SECRET=una_frase_muy_larga_y_aleatoria

/**
 * Lógica para registrar un nuevo usuario (POST /api/usuarios/registro).
 */
export async function registrarUsuario(req, res) {
    const { nombre, email, password } = req.body;
    
    // 1. Validaciones básicas
    if (!nombre || !email || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    try {
        // 2. Verificar si el email ya existe
        const usuarioExistente = await userModel.buscarUsuarioPorEmail(email);
        if (usuarioExistente) {
            return res.status(409).json({ message: 'El correo electrónico ya está registrado.' });
        }

        // 3. Encriptar la contraseña (Usando 10 rondas de salting)
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 4. Crear el usuario en la BD
        const nuevoUsuario = await userModel.crearUsuario(nombre, email, passwordHash);

        // 5. Respuesta exitosa
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
        // 1. Buscar usuario por email
        const usuario = await userModel.buscarUsuarioPorEmail(email);
        if (!usuario) {
            // Se usa el mismo mensaje para seguridad (no revelar si existe el usuario o si la contraseña es incorrecta)
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // 2. Comparar la contraseña ingresada con el hash de la BD
        const esValido = await bcrypt.compare(password, usuario.password_hash);
        if (!esValido) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // 3. Generar el JSON Web Token (JWT)
        const token = jwt.sign(
            { id: usuario.id_usuario, email: usuario.email },
            JWT_SECRET,
            { expiresIn: '1h' } // El token expira en 1 hora
        );

        // 4. Respuesta exitosa
        res.status(200).json({
            message: 'Inicio de sesión exitoso.',
            token: token,
            nombre_usuario: usuario.nombre
        });

    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
}