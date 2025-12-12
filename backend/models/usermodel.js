import { pool } from '../config/bdconfig.js';

/**
 * Registra un nuevo usuario en la base de datos.
 */
export async function crearUsuario(nombre, email, passwordHash) {
    const query = `
        INSERT INTO usuarios (nombre, email, password_hash)
        VALUES (?, ?, ?)
    `;
    const [result] = await pool.execute(query, [nombre, email, passwordHash]);
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
 * Actualiza los datos de perfil de un usuario.
 */
export async function actualizarUsuario(id_usuario, datos) {
    const query = `
        UPDATE usuarios 
        SET nombre = ?, direccion_envio = ? 
        WHERE id_usuario = ?
    `;
    const [result] = await pool.execute(query, [datos.nombre, datos.direccion_envio, id_usuario]);
    return result.affectedRows;
}

// Exportamos todas las funciones como un objeto
export default {
    crearUsuario,
    buscarUsuarioPorEmail,
    actualizarUsuario
};