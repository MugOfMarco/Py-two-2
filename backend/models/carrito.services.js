// services/carrito.service.js

import { pool } from '../database/db.connection.js'; // Ajusta la ruta de importación si es necesario

// ====================================================================
// 1. FUNCIONES INTERNAS DE UTILIDAD
// ====================================================================

/**
 * Asegura que exista un carrito para el usuario. Si no existe, lo crea.
 * @param {number} id_usuario El ID del usuario.
 * @returns {Promise<number>} El ID del carrito existente o recién creado.
 */
async function getOrCreateCartId(id_usuario) {
    let [result] = await pool.query(
        'SELECT id_carrito FROM carritos WHERE id_usuario = ?',
        [id_usuario]
    );

    if (result.length > 0) {
        return result[0].id_carrito;
    }

    // Si no existe, crear uno
    [result] = await pool.query(
        'INSERT INTO carritos (id_usuario) VALUES (?)',
        [id_usuario]
    );
    return result.insertId;
}

/**
 * Obtiene los detalles de un producto por su ID.
 * @param {number} id_producto El ID del producto.
 * @returns {Promise<object | null>} Los detalles del producto o null si no existe.
 */
async function getProductDetails(id_producto) {
    const [result] = await pool.query(
        'SELECT precio, stock, nombre, descripcion, categoria FROM productos WHERE id_producto = ?',
        [id_producto]
    );
    return result.length > 0 ? result[0] : null;
}

// ====================================================================
// 2. FUNCIÓN PRINCIPAL: LEER CARRITO
// ====================================================================

/**
 * Obtiene todos los ítems del carrito para un usuario, incluyendo detalles del producto.
 * @param {number} id_usuario El ID del usuario.
 * @returns {Promise<Array<object>>} Una lista de ítems del carrito con sus detalles.
 */
export async function getCartItems(id_usuario) {
    const query = `
        SELECT 
            ic.id_item, 
            ic.id_producto, 
            ic.cantidad, 
            ic.precio_unitario,
            p.nombre, 
            p.descripcion, 
            p.categoria,
            p.imagen_url
        FROM items_carrito ic
        JOIN carritos c ON ic.id_carrito = c.id_carrito
        JOIN productos p ON ic.id_producto = p.id_producto
        WHERE c.id_usuario = ?
        ORDER BY ic.id_item DESC;
    `;
    
    const [rows] = await pool.query(query, [id_usuario]);
    return rows;
}

// ====================================================================
// 3. FUNCIÓN CRUD: AGREGAR/ACTUALIZAR ÍTEM (CREATE/UPDATE)
// ====================================================================

/**
 * Agrega un producto al carrito o actualiza su cantidad si ya existe.
 * @param {number} id_usuario - El ID del usuario.
 * @param {number} id_producto - El ID del producto.
 * @param {number} cantidad - La cantidad a agregar/establecer.
 * @returns {Promise<object>} Objeto con el estado de la operación.
 */
export async function addOrUpdateItem(id_usuario, id_producto, cantidad) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Obtener ID del carrito o crearlo
        const id_carrito = await getOrCreateCartId(id_usuario);

        // 2. Obtener detalles del producto y verificar stock
        const product = await getProductDetails(id_producto);

        if (!product) {
            throw new Error(`Producto con ID ${id_producto} no encontrado.`);
        }
        if (product.stock < cantidad) {
            throw new Error(`Stock insuficiente. Solo quedan ${product.stock} unidades.`);
        }

        // 3. Verificar si el ítem ya existe en el carrito
        const [existingItem] = await connection.query(
            'SELECT id_item, cantidad FROM items_carrito WHERE id_carrito = ? AND id_producto = ?',
            [id_carrito, id_producto]
        );

        const precio_unitario = product.precio;

        if (existingItem.length > 0) {
            // Si existe, actualizar la cantidad
            const newQuantity = cantidad; 
            
            await connection.query(
                'UPDATE items_carrito SET cantidad = ? WHERE id_item = ?',
                [newQuantity, existingItem[0].id_item]
            );
            
            // Actualizar la fecha de modificación del carrito
            await connection.query('UPDATE carritos SET fecha_actualizacion = NOW() WHERE id_carrito = ?', [id_carrito]);

            await connection.commit();
            return { success: true, message: `Cantidad del producto ${id_producto} actualizada a ${newQuantity}.` };

        } else {
            // Si no existe, insertarlo
            await connection.query(
                'INSERT INTO items_carrito (id_carrito, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
                [id_carrito, id_producto, cantidad, precio_unitario]
            );
            
            // Actualizar la fecha de modificación del carrito
            await connection.query('UPDATE carritos SET fecha_actualizacion = NOW() WHERE id_carrito = ?', [id_carrito]);

            await connection.commit();
            return { success: true, message: `Producto ${id_producto} agregado al carrito.` };
        }

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// ====================================================================
// 4. FUNCIONES CRUD: ELIMINAR ÍTEMS
// ====================================================================

/**
 * Elimina un producto específico del carrito del usuario.
 * @param {number} id_usuario El ID del usuario.
 * @param {number} id_producto El ID del producto a eliminar.
 * @returns {Promise<object>} Objeto con el estado de la operación.
 */
export async function removeItem(id_usuario, id_producto) {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Obtener el ID del carrito
        const [cartResult] = await connection.query('SELECT id_carrito FROM carritos WHERE id_usuario = ?', [id_usuario]);
        if (cartResult.length === 0) {
            await connection.rollback();
            return { success: false, message: 'Carrito no encontrado para el usuario.' };
        }
        const id_carrito = cartResult[0].id_carrito;
        
        // Eliminar el ítem
        const [deleteResult] = await connection.query(
            'DELETE FROM items_carrito WHERE id_carrito = ? AND id_producto = ?',
            [id_carrito, id_producto]
        );
        
        if (deleteResult.affectedRows === 0) {
            await connection.rollback();
            return { success: false, message: 'El producto no se encontraba en el carrito.' };
        }

        // Actualizar la fecha de modificación del carrito
        await connection.query('UPDATE carritos SET fecha_actualizacion = NOW() WHERE id_carrito = ?', [id_carrito]);

        await connection.commit();
        return { success: true, message: `Producto ${id_producto} eliminado del carrito.` };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * Elimina todos los productos del carrito (vaciar carrito).
 * @param {number} id_usuario El ID del usuario.
 * @returns {Promise<object>} Objeto con el estado de la operación.
 */
export async function clearCart(id_usuario) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Obtener el ID del carrito
        const [cartResult] = await connection.query('SELECT id_carrito FROM carritos WHERE id_usuario = ?', [id_usuario]);
        if (cartResult.length === 0) {
            await connection.rollback();
            return { success: true, message: 'El carrito ya estaba vacío o no existía.' };
        }
        const id_carrito = cartResult[0].id_carrito;
        
        // Eliminar todos los ítems
        const [deleteResult] = await connection.query(
            'DELETE FROM items_carrito WHERE id_carrito = ?',
            [id_carrito]
        );
        
        // Opcional: Actualizar la fecha de modificación del carrito (para registrar la acción)
        await connection.query('UPDATE carritos SET fecha_actualizacion = NOW() WHERE id_carrito = ?', [id_carrito]);

        await connection.commit();
        return { success: true, message: `Carrito del usuario ${id_usuario} vaciado. ${deleteResult.affectedRows} ítems eliminados.` };
        
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}