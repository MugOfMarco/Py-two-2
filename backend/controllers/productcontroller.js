// backend/controllers/productcontroller.js

// Importamos el cliente real de BD (pool, asumiendo la exportación desde bdconfig.js)
import { pool } from '../config/dbconfig.js'; 


/**
 * Obtiene los productos para la vista principal (Home o Resultados de Búsqueda) usando la BD.
 * @param {object} options - Opciones que incluyen el término de búsqueda.
 * @returns {Promise<{productos: Array, message: string|null}>}
 */
export async function getProducts({ query }) {
    let productos = [];
    let message = null;

    try {
        // --- NOMBRES DE COLUMNAS COINCIDIENDO CON EL ESQUEMA 'productos' ---
        // Usamos id_producto AS id para que el frontend lo reconozca
        const COLUMN_SELECT = `
            id_producto AS id, 
            nombre AS nombre, 
            descripcion AS descripcion, 
            precio AS precio, 
            imagen_url AS imagen, 
            NULL AS badge 
        `;
        // -----------------------------------------------------------------
        
        let result;
        
        if (query) {
            // Consulta de Búsqueda en la BD (Usando ? para MySQL)
            const searchTerm = `%${query}%`;
            const sql = `
                SELECT ${COLUMN_SELECT} 
                FROM productos 
                WHERE nombre LIKE ? OR descripcion LIKE ?
            `;
            
            result = await pool.query(sql, [searchTerm, searchTerm]);
            
        } else {
            // Consulta para obtener productos de Home
            const sql = `
                SELECT ${COLUMN_SELECT} 
                FROM productos 
                WHERE stock > 0
                ORDER BY id_producto DESC
                LIMIT 4
            `;
            
            result = await pool.query(sql);
        }

        // ****** MANEJO DE RESULTADOS (CORRECCIÓN DEL ERROR 'length') ******
        // Asume el patrón de MySQL (result es un array donde el primer elemento [0] son las filas)
        if (Array.isArray(result) && Array.isArray(result[0])) {
            productos = result[0];
        } 
        // Patron de node-postgres (result es un objeto con la propiedad .rows)
        else if (result && Array.isArray(result.rows)) {
            productos = result.rows;
        } 
        // Si el resultado es directamente un array de filas
        else if (Array.isArray(result)) {
            productos = result;
        }

        // Revisar si la búsqueda o la carga inicial no devolvió filas
        if (productos.length === 0) {
            message = query ? `No se encontraron resultados para "${query}".` : 'No hay productos disponibles en este momento.';
        }


    } catch (error) {
        console.error("Error en productController.getProducts (BD):", error.message);
        // Volver a lanzar un error con un mensaje general para la capa de presentación
        throw new Error("Error interno del servidor al obtener productos de la base de datos.");
    }
    
    return { productos, message };
}