// backend/controllers/carritocontroller.js

import { pool } from '../config/bdconfig.js'; 
// ✅ Importación directa del pool de conexiones. Asegúrate que la ruta '../config/bdconfig.js' sea correcta.

// ====================================================================
// 1. FUNCIONES INTERNAS DE UTILIDAD (Integradas)
// ====================================================================

/**
 * Asegura que exista un carrito para el usuario. Si no existe, lo crea.
 * NOTA: Esta función utiliza la conexión 'pool' para asegurar que sea transaccional.
 * @param {number} id_usuario El ID del usuario.
 * @param {object} connection La conexión de pool activa.
 * @returns {Promise<number>} El ID del carrito existente o recién creado.
 */
async function getOrCreateCartId(id_usuario, connection) {
    let [result] = await connection.query(
        'SELECT id_carrito FROM carritos WHERE id_usuario = ?',
        [id_usuario]
    );

    if (result.length > 0) {
        return result[0].id_carrito;
    }

    // Si no existe, crear uno
    [result] = await connection.query(
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
        'SELECT precio, stock FROM productos WHERE id_producto = ?',
        [id_producto]
    );
    return result.length > 0 ? result[0] : null;
}


// ====================================================================
// 2. OBTENER CARRITO (GET)
// ====================================================================

/**
 * Obtiene todos los ítems del carrito para un usuario específico.
 * RUTA: GET /api/carrito/usuario/:userId
 */
export async function getCart(req, res) {
    const id_usuario = parseInt(req.params.userId);

    if (isNaN(id_usuario)) {
        return res.status(400).json({ success: false, message: 'ID de usuario inválido.' });
    }

    try {
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
        
        const [items] = await pool.query(query, [id_usuario]);
        
        // Calcular el total de ítems (útil para el contador del header)
        const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);

        res.status(200).json({ 
            success: true, 
            data: items,
            totalItems: totalItems
        });

    } catch (error) {
        console.error('Error al obtener el carrito:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor al obtener el carrito.' 
        });
    }
}

/**
 * Obtiene solo el conteo de ítems del carrito (utilizado por tienda.js).
 * RUTA: GET /api/carrito/count/usuario/:userId
 */
export async function getCartItemCount(req, res) {
    const id_usuario = parseInt(req.params.userId);

    if (isNaN(id_usuario)) {
        return res.status(400).json({ success: false, message: 'ID de usuario inválido.' });
    }

    try {
        // Obtenemos solo la suma de las cantidades
        const query = `
            SELECT SUM(ic.cantidad) AS totalItems
            FROM items_carrito ic
            JOIN carritos c ON ic.id_carrito = c.id_carrito
            WHERE c.id_usuario = ?;
        `;
        
        const [rows] = await pool.query(query, [id_usuario]);
        const totalItems = rows[0].totalItems || 0;

        res.status(200).json({ 
            success: true, 
            totalItems: totalItems
        });

    } catch (error) {
        console.error('Error al obtener el conteo del carrito:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Error al contar los ítems.' 
        });
    }
}


// ====================================================================
// 3. AÑADIR/ACTUALIZAR ÍTEM (POST)
// ====================================================================

/**
 * Agrega o actualiza la cantidad de un producto en el carrito, usando transacciones.
 * RUTA: POST /api/carrito
 */
export async function addOrUpdateCartItem(req, res) {
    const { userId, productId, quantity } = req.body;
    
    // Validaciones básicas
    if (!userId || !productId || !quantity || isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({ success: false, message: 'Datos incompletos o inválidos (userId, productId, quantity).' });
    }
    
    const id_usuario = parseInt(userId);
    const id_producto = parseInt(productId);
    const cantidad = parseInt(quantity);
    
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Obtener ID del carrito o crearlo
        const id_carrito = await getOrCreateCartId(id_usuario, connection);

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
        let message;

        if (existingItem.length > 0) {
            // Si existe, actualizar la cantidad
            await connection.query(
                'UPDATE items_carrito SET cantidad = ?, precio_unitario = ? WHERE id_item = ?',
                [cantidad, precio_unitario, existingItem[0].id_item]
            );
            message = `Cantidad del producto ${id_producto} actualizada a ${cantidad}.`;

        } else {
            // Si no existe, insertarlo
            await connection.query(
                'INSERT INTO items_carrito (id_carrito, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
                [id_carrito, id_producto, cantidad, precio_unitario]
            );
            message = `Producto ${id_producto} agregado al carrito.`;
        }
        
        // 4. Actualizar la fecha de modificación del carrito
        await connection.query('UPDATE carritos SET fecha_actualizacion = NOW() WHERE id_carrito = ?', [id_carrito]);

        await connection.commit();
        res.status(200).json({ success: true, message: message });

    } catch (error) {
        await connection.rollback();
        console.error('Error al añadir/actualizar ítem:', error.message);
        
        // Manejo de errores específicos para el frontend (Stock/No encontrado)
        const statusCode = error.message.includes('Stock insuficiente') || error.message.includes('no encontrado') ? 409 : 500;
        
        res.status(statusCode).json({ 
            success: false, 
            message: error.message 
        });

    } finally {
        connection.release();
    }
}

// ====================================================================
// 4. ELIMINAR ÍTEMS (DELETE)
// ====================================================================

/**
 * Elimina un producto específico del carrito, usando transacciones.
 * RUTA: DELETE /api/carrito/item/:productId
 */
export async function removeItemFromCart(req, res) {
    const id_usuario = 1; // ⚠️ Simulado: DEBE OBTENERSE DE LA SESIÓN/TOKEN
    const id_producto = parseInt(req.params.productId);

    if (isNaN(id_producto)) {
        return res.status(400).json({ success: false, message: 'ID de producto inválido.' });
    }

    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // 1. Obtener el ID del carrito
        const [cartResult] = await connection.query('SELECT id_carrito FROM carritos WHERE id_usuario = ?', [id_usuario]);
        if (cartResult.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Carrito no encontrado para el usuario.' });
        }
        const id_carrito = cartResult[0].id_carrito;
        
        // 2. Eliminar el ítem
        const [deleteResult] = await connection.query(
            'DELETE FROM items_carrito WHERE id_carrito = ? AND id_producto = ?',
            [id_carrito, id_producto]
        );
        
        if (deleteResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'El producto no se encontraba en el carrito.' });
        }

        // 3. Actualizar la fecha de modificación del carrito
        await connection.query('UPDATE carritos SET fecha_actualizacion = NOW() WHERE id_carrito = ?', [id_carrito]);

        await connection.commit();
        res.status(200).json({ success: true, message: `Producto ${id_producto} eliminado del carrito.` });

    } catch (error) {
        await connection.rollback();
        console.error('Error al eliminar ítem:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor al eliminar el ítem.' 
        });
    } finally {
        connection.release();
    }
}

/**
 * Vacía todo el carrito de un usuario.
 * RUTA: DELETE /api/carrito/usuario/:userId
 */
export async function clearUserCart(req, res) {
    const id_usuario = parseInt(req.params.userId);

    if (isNaN(id_usuario)) {
        return res.status(400).json({ success: false, message: 'ID de usuario inválido.' });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Obtener el ID del carrito
        const [cartResult] = await connection.query('SELECT id_carrito FROM carritos WHERE id_usuario = ?', [id_usuario]);
        if (cartResult.length === 0) {
            // Si el carrito no existe, se considera exitoso (ya está vacío)
            await connection.rollback(); 
            return res.status(200).json({ success: true, message: 'El carrito ya estaba vacío o no existía.' });
        }
        const id_carrito = cartResult[0].id_carrito;
        
        // 2. Eliminar todos los ítems
        const [deleteResult] = await connection.query(
            'DELETE FROM items_carrito WHERE id_carrito = ?',
            [id_carrito]
        );
        
        // 3. Actualizar la fecha de modificación del carrito
        await connection.query('UPDATE carritos SET fecha_actualizacion = NOW() WHERE id_carrito = ?', [id_carrito]);

        await connection.commit();
        res.status(200).json({ success: true, message: `Carrito del usuario ${id_usuario} vaciado. ${deleteResult.affectedRows} ítems eliminados.` });
        
    } catch (error) {
        await connection.rollback();
        console.error('Error al vaciar el carrito:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor al vaciar el carrito.' 
        });
    } finally {
        connection.release();
    }
}