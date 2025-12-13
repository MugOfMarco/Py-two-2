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
        SELECT id_usuario, nombre, email, password_hash 
        FROM usuarios 
        WHERE email = ?
    `;
    const [rows] = await pool.execute(query, [email]);
    return rows.length > 0 ? rows[0] : null;
}

/**
 * Actualiza los datos de perfil de un usuario (ejemplo).
 */
export async function actualizarUsuario(id_usuario, datos) {
    // Para simplificar, solo actualizamos nombre y apellido aquí
    const query = `
        UPDATE usuarios 
        SET nombre = ?, apellido = ? 
        WHERE id_usuario = ?
    `;
    const [result] = await pool.execute(query, [datos.nombre, datos.apellido, id_usuario]);
    return result.affectedRows;
}

// Exportamos todas las funciones como un objeto
export default {
    crearUsuario,
    buscarUsuarioPorEmail,
    actualizarUsuario
};