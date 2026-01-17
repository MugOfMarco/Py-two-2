import { pool } from '../config/dbconfig.js';

/**
 * Registra un nuevo usuario en la base de datos.
 */
export async function crearUsuario(nombre, apellido, email, passwordHash, telefono, fechaNacimiento, codigoPostal) {
    const query = `
        INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, fecha_nacimiento, codigo_postal)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(query, [
        nombre, 
        apellido, 
        email, 
        passwordHash, 
        telefono, 
        fechaNacimiento, 
        codigoPostal
    ]);
    return { id_usuario: result.insertId };
}

/**
 * Busca un usuario por su correo electrónico (usado para el login).
 */
export async function buscarUsuarioPorEmail(email) {
    const query = `
        SELECT id_usuario, nombre, email, password_hash, rol 
        FROM usuarios 
        WHERE email = ?
    `;
    const [rows] = await pool.execute(query, [email]);
    return rows.length > 0 ? rows[0] : null;
}

/**
 * 🆕 NUEVO: Obtiene todos los datos del perfil por ID (Sin contraseña).
 * Usado para rellenar el formulario de "Mi Perfil".
 */
export async function obtenerUsuarioPorId(id) {
    const query = `
        SELECT id_usuario, nombre, apellido, email, telefono, fecha_nacimiento, codigo_postal 
        FROM usuarios 
        WHERE id_usuario = ?
    `;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0 ? rows[0] : null;
}

/**
 * 🔄 ACTUALIZADO: Actualiza los datos de perfil de un usuario.
 * Ahora incluye teléfono y código postal.
 */
export async function actualizarUsuario(id_usuario, datos) {
    const { nombre, apellido, telefono, codigo_postal } = datos;
    
    const query = `
        UPDATE usuarios 
        SET nombre = ?, apellido = ?, telefono = ?, codigo_postal = ?
        WHERE id_usuario = ?
    `;
    
    const [result] = await pool.execute(query, [
        nombre, 
        apellido, 
        telefono, 
        codigo_postal, 
        id_usuario
    ]);
    
    return result.affectedRows;
}

// Exportamos todas las funciones como un objeto y también individualmente
export default {
    crearUsuario,
    buscarUsuarioPorEmail,
    obtenerUsuarioPorId, // 👈 Agregado
    actualizarUsuario
};