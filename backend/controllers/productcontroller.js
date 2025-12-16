// backend/controllers/productcontroller.js

import { pool } from '../config/dbconfig.js'; 

/**
 * Función central para obtener productos de la BD.
 * Esta función es llamada internamente o por el controlador que sirve la vista.
 * @param {object} options - Opciones que incluyen el término de búsqueda.
 * @returns {Promise<{productos: Array, message: string|null}>}
 */
export async function getProductsData({ query }) {
    let productos = [];
    let message = null;

    try {
        // --- NOMBRES DE COLUMNAS COINCIDIENDO CON EL ESQUEMA 'productos' ---
        // 🚨 CRÍTICO: Eliminamos imagen_url ya que no existe en la BD
        const COLUMN_SELECT = `
            id_producto AS id, 
            nombre AS nombre, 
            descripcion AS descripcion, 
            precio AS precio, 
            NULL AS badge 
        `;
        // -----------------------------------------------------------------
        
        let result;
        
        if (query) {
            const searchTerm = `%${query}%`;
            const sql = `
                SELECT ${COLUMN_SELECT} 
                FROM productos 
                WHERE nombre LIKE ? OR descripcion LIKE ?
            `;
            
            // Usamos execute si tu cliente MySQL devuelve [rows, fields]
            const [rows] = await pool.execute(sql, [searchTerm, searchTerm]);
            productos = rows;
            
       } else {
            // Consulta para obtener productos de Home (MODIFICADA)
            const sql = `
                SELECT ${COLUMN_SELECT} 
                FROM productos 
                WHERE stock > 0
                ORDER BY id_producto DESC
                -- LIMIT 4  <-- LÍNEA ELIMINADA O COMENTADA
            `;
            
            // Usamos execute si tu cliente MySQL devuelve [rows, fields]
            const [rows] = await pool.execute(sql);
            productos = rows;
        }

        if (productos.length === 0) {
            message = query ? `No se encontraron resultados para "${query}".` : 'No hay productos disponibles en este momento.';
        }

    } catch (error) {
        console.error("Error en productController.getProductsData (BD):", error.message);
        // Devolvemos un error que la capa superior pueda manejar
        throw new Error("Error interno del servidor al obtener productos de la base de datos.");
    }
    
    return { productos, message };
}


/**
 * 🎯 Controlador para la API de productos (GET /api/productos)
 * Devuelve el catálogo en formato JSON.
 */
export const getProductsAPI = async (req, res) => {
    try {
        const query = req.query.q || null; // Captura el parámetro de búsqueda 'q'
        const { productos, message } = await getProductsData({ query });

        return res.status(200).json({
            success: true,
            productos,
            message
        });

    } catch (error) {
        // Manejo de errores de BD o internos
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export default {
    getProductsAPI,
    getProductsData
};

export { getProductsData as getProducts };