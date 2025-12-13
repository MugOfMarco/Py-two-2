// backend/controllers/carritocontroller.js

import { pool } from '../config/bdconfig.js'; 

// =======================================================
// HELPER: Obtener ID del Carrito (Función interna)
// =======================================================

const getCartId = async (userId) => {
    try {
        const [cart] = await pool.query(
            'SELECT id_carrito FROM carritos WHERE id_usuario = ?',
            [userId]
        );
        return cart.length > 0 ? cart[0].id_carrito : null;
    } catch (error) {
        console.error('Error al obtener el ID del carrito:', error);
        throw error;
    }
};

// =======================================================
// LÓGICA: addOrUpdateCartItem (POST /api/carrito)
// Recibe la CANTIDAD FINAL deseada (quantity)
// =======================================================

export const addOrUpdateCartItem = async (req, res) => {
    // Tu JS envía userId, productId y quantity (cantidad FINAL)
    let { userId, productId, quantity } = req.body; 
    
if (!userId || isNaN(parseInt(userId))) {
        userId = 1; // Usamos el ID por defecto que estamos simulando
        console.warn(`[CARRITO] WARNING: userId era nulo/inválido. Forzando a userId: ${userId}`);
    }

    // Validación básica
    if (!productId || typeof quantity !== 'number' || quantity < 0) {
        return res.status(400).json({ success: false, message: 'Datos de producto o cantidad inválidos.' });
    }
    
    try {
        console.log(`[CARRITO] Actualizando P:${productId} a Q:${quantity} para U:${userId}`);

        let cartId = await getCartId(userId);

        // Si el carrito no existe, lo creamos
        if (!cartId) {
            const [result] = await pool.query(
                'INSERT INTO carritos (id_usuario) VALUES (?)',
                [userId]
            );
            cartId = result.insertId;
        }

        // Si la cantidad es 0, eliminamos el ítem (lógica de removeItem)
        if (quantity === 0) {
            await pool.query(
                `DELETE FROM items_carrito WHERE id_carrito = ? AND id_producto = ?`,
                [cartId, productId]
            );
            return res.json({ success: true, message: `Producto ${productId} eliminado.` });
        }

        // Buscar si el ítem ya existe en items_carrito
        const [existingItem] = await pool.query(
            'SELECT id_item FROM items_carrito WHERE id_carrito = ? AND id_producto = ?',
            [cartId, productId]
        );
        
        let message;
        
        if (existingItem.length > 0) {
            // Si existe, actualizar a la nueva cantidad (quantity)
            await pool.query(
                'UPDATE items_carrito SET cantidad = ? WHERE id_item = ?',
                [quantity, existingItem[0].id_item]
            );
            message = `Cantidad del producto ${productId} actualizada a ${quantity}.`;
            
        } else {
            // Si no existe, insertar el nuevo ítem.
            // NOTA: Se usa 0.00 como precio unitario para cumplir el INSERT, pero el GET lo obtendrá de la tabla de productos.
            await pool.query(
                'INSERT INTO items_carrito (id_carrito, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
                [cartId, productId, quantity, 0.00] 
            );
            message = `Producto ${productId} insertado con cantidad ${quantity}.`;
        }

        console.log(`✅ [CARRITO]: ${message}`);
        res.json({ success: true, message: message }); 

    } catch (error) {
        console.error('❌ [CARRITO]: Error al actualizar/guardar:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor al actualizar el carrito.', error: error.message });
    }
};


// =======================================================
// LÓGICA: getCartAPI (GET /api/carrito/usuario/:userId)
// =======================================================

export const getCartAPI = async (req, res) => {
    const userId = req.params.userId; 

    try {
        const query = `
            SELECT
                ic.id_item,
                ic.cantidad,
                p.id_producto,
                p.nombre,
                p.descripcion,
                p.precio AS precio_unitario,
                p.imagen_url
            FROM carritos AS c
            JOIN items_carrito AS ic ON c.id_carrito = ic.id_carrito
            JOIN productos AS p ON ic.id_producto = p.id_producto
            WHERE c.id_usuario = ?
        `;

        const [items] = await pool.query(query, [userId]);
        
        // Suma de la cantidad total de unidades
        const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);

        if (items.length === 0) {
             return res.json({ success: true, data: [], totalItems: 0, message: "Carrito vacío." });
        }
        
        console.log(`✅ [CARRITO API]: ${items.length} ítems únicos encontrados.`);

        return res.json({ 
            success: true, 
            data: items,
            totalItems: totalItems,
            message: "Carrito cargado exitosamente."
        }); 

    } catch (error) {
        console.error('❌ [CARRITO API]: Error SQL al obtener el carrito:', error);
        return res.status(500).json({ success: false, message: 'Error al cargar los datos del carrito desde la BD.' });
    }
};


// =======================================================
// LÓGICA: removeItem (DELETE /api/carrito/item/:productId)
// =======================================================

export const removeItem = async (req, res) => {
    // Tomamos el userId del query string, como lo envía el frontend
    const userId = req.query.userId || 1; 
    const { productId } = req.params; 

    try {
        const cartId = await getCartId(userId);

        if (!cartId) {
            return res.status(404).json({ success: false, message: "No se encontró el carrito." });
        }

        const [result] = await pool.query(
            `DELETE FROM items_carrito WHERE id_carrito = ? AND id_producto = ?`,
            [cartId, productId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "El producto no se encontró en el carrito." });
        }
        
        return res.json({ success: true, message: "Producto eliminado del carrito." });

    } catch (error) {
        console.error('❌ [CARRITO]: Error SQL al eliminar ítem:', error);
        return res.status(500).json({ success: false, message: "Error interno del servidor al eliminar el producto." });
    }
};


// =======================================================
// LÓGICA: clearCart (DELETE /api/carrito/usuario/:userId)
// =======================================================

export const clearCart = async (req, res) => {
    const userId = req.params.userId; 

    try {
        const cartId = await getCartId(userId);

        if (!cartId) {
            return res.status(200).json({ success: true, message: "El carrito ya está vacío o no existe." });
        }

        const [result] = await pool.query(
            `DELETE FROM items_carrito WHERE id_carrito = ?`,
            [cartId]
        );

        return res.json({ success: true, message: `Carrito vaciado completamente. ${result.affectedRows} ítems eliminados.` });

    } catch (error) {
        console.error('❌ [CARRITO]: Error SQL al vaciar carrito:', error);
        return res.status(500).json({ success: false, message: "Error interno del servidor al vaciar el carrito." });
    }
};

// Función auxiliar para EJS (si la usas)
export const getCart = async (req, res) => {
    const userId = 1; 
    try {
        const query = `
            SELECT
                ic.id_item,
                ic.cantidad,
                p.id_producto,
                p.nombre,
                p.descripcion,
                p.precio AS precio_unitario,
                p.imagen_url
            FROM carritos AS c
            JOIN items_carrito AS ic ON c.id_carrito = ic.id_carrito
            JOIN productos AS p ON ic.id_producto = p.id_producto
            WHERE c.id_usuario = ?
        `;

        const [items] = await pool.query(query, [userId]);
        return items; 
    } catch (error) {
        throw new Error('Error al cargar los datos del carrito desde la BD.'); 
    }
};