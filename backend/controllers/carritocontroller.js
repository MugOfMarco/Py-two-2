import { pool } from '../config/dbconfig.js';

// ==========================================
// 1. OBTENER CARRITO (getCart)
// ==========================================
export const getCart = async (req, res) => {
    // 1. INTENTAMOS OBTENER EL ID DESDE EL TOKEN (req.user)
    // Si no existe (porque no usamos middleware en esta ruta), usamos params.
    let userId = null;

    if (req.user && req.user.id) {
        userId = req.user.id; // ID seguro del token
    } else {
        userId = req.params.userId; // Fallback a URL
    }

    if (!userId || userId === 'undefined') {
        return res.status(400).json({ success: false, message: "ID de usuario no válido" });
    }

    try {
        // Validar si existe carrito, si no, crear
        const [carritoExistente] = await pool.query('SELECT id_carrito FROM carritos WHERE id_usuario = ?', [userId]);
        
        if (carritoExistente.length === 0) {
            await pool.query('INSERT INTO carritos (id_usuario) VALUES (?)', [userId]);
        }

        const query = `
            SELECT 
                ic.id_producto, 
                p.nombre, 
                p.precio AS precio_unitario, 
                ic.cantidad,
                (p.precio * ic.cantidad) AS total
            FROM items_carrito ic
            JOIN carritos c ON ic.id_carrito = c.id_carrito
            JOIN productos p ON ic.id_producto = p.id_producto
            WHERE c.id_usuario = ?
        `;

        const [items] = await pool.query(query, [userId]);

        const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);
        const totalPrecio = items.reduce((sum, item) => sum + parseFloat(item.total), 0);

        res.json({ success: true, data: items, totalItems, totalPrecio });

    } catch (error) {
        console.error("Error en getCart:", error);
        res.status(500).json({ success: false, message: "Error al obtener el carrito" });
    }
};

// ==========================================
// 2. AÑADIR O ACTUALIZAR (addOrUpdateCartItem) -> AQUÍ FALLABA
// ==========================================
export const addOrUpdateCartItem = async (req, res) => {
    const { id_producto, cantidad } = req.body; 
    
    // 🚨 CORRECCIÓN CLAVE:
    // Priorizamos el ID que viene del TOKEN (req.user.id).
    // Si no hay token, buscamos en el body.
    let usuarioFinal = null;

    if (req.user && req.user.id) {
        usuarioFinal = req.user.id;
    } else {
        // Soporte para body.id_usuario o body.userId
        usuarioFinal = req.body.id_usuario || req.body.userId;
    }

    // Validación extra: Si sigue siendo undefined, detenemos todo
    if (!usuarioFinal || usuarioFinal === 'undefined') {
        console.error("Intento de agregar al carrito sin ID de usuario válido.");
        return res.status(400).json({ success: false, message: "No se identificó al usuario." });
    }

    const cantidadNumerica = parseInt(cantidad) || 1;

    try {
        // 1. Obtener ID Carrito
        let [carrito] = await pool.query('SELECT id_carrito FROM carritos WHERE id_usuario = ?', [usuarioFinal]);
        
        if (carrito.length === 0) {
            const [result] = await pool.query('INSERT INTO carritos (id_usuario) VALUES (?)', [usuarioFinal]);
            carrito = [{ id_carrito: result.insertId }];
        }
        const id_carrito = carrito[0].id_carrito;

        // 2. Obtener precio
        const [producto] = await pool.query('SELECT precio FROM productos WHERE id_producto = ?', [id_producto]);
        if (producto.length === 0) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        const precio = producto[0].precio;

        // 3. Insertar o Actualizar
        const [itemExistente] = await pool.query(
            'SELECT * FROM items_carrito WHERE id_carrito = ? AND id_producto = ?', 
            [id_carrito, id_producto]
        );

        if (itemExistente.length > 0) {
            const nuevaCantidad = itemExistente[0].cantidad + cantidadNumerica;
            if (nuevaCantidad < 1) {
                await pool.query('DELETE FROM items_carrito WHERE id_item = ?', [itemExistente[0].id_item]);
            } else {
                await pool.query('UPDATE items_carrito SET cantidad = ? WHERE id_item = ?', [nuevaCantidad, itemExistente[0].id_item]);
            }
        } else {
            if (cantidadNumerica > 0) {
                await pool.query(
                    'INSERT INTO items_carrito (id_carrito, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
                    [id_carrito, id_producto, cantidadNumerica, precio]
                );
            }
        }

        res.json({ success: true, message: 'Carrito actualizado' });

    } catch (error) {
        console.error("Error en addOrUpdateCartItem:", error);
        res.status(500).json({ success: false, message: "Error al actualizar carrito: " + error.message });
    }
};

// ==========================================
// 3. ELIMINAR ÍTEM (removeItemFromCart)
// ==========================================
export const removeItemFromCart = async (req, res) => {
    const { productId } = req.params;
    
    // Lo mismo: Buscar ID en Token primero
    let usuarioFinal = null;
    if (req.user && req.user.id) {
        usuarioFinal = req.user.id;
    } else {
        usuarioFinal = req.body.id_usuario || req.body.userId;
    }

    if (!usuarioFinal) return res.status(400).json({ success: false, message: "Usuario no identificado" });

    try {
        const [carrito] = await pool.query('SELECT id_carrito FROM carritos WHERE id_usuario = ?', [usuarioFinal]);
        if (carrito.length === 0) return res.status(404).json({ success: false, message: "Carrito no encontrado" });

        await pool.query(
            'DELETE FROM items_carrito WHERE id_carrito = ? AND id_producto = ?',
            [carrito[0].id_carrito, productId]
        );

        res.json({ success: true, message: "Producto eliminado" });

    } catch (error) {
        console.error("Error en removeItemFromCart:", error);
        res.status(500).json({ success: false, message: "Error al eliminar producto" });
    }
};

// ==========================================
// 4. VACIAR CARRITO (clearUserCart)
// ==========================================
export const clearUserCart = async (req, res) => {
    // Buscar ID en Token primero
    let userId = null;
    if (req.user && req.user.id) {
        userId = req.user.id;
    } else {
        userId = req.params.userId;
    }

    if (!userId) return res.status(400).json({ success: false, message: "Usuario no identificado" });

    try {
        const [carrito] = await pool.query('SELECT id_carrito FROM carritos WHERE id_usuario = ?', [userId]);
        if (carrito.length === 0) return res.json({ success: true });

        await pool.query('DELETE FROM items_carrito WHERE id_carrito = ?', [carrito[0].id_carrito]);

        res.json({ success: true, message: "Carrito vaciado" });

    } catch (error) {
        console.error("Error en clearUserCart:", error);
        res.status(500).json({ success: false, message: "Error al vaciar carrito" });
    }
};