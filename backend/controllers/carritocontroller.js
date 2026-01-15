import { pool } from '../config/dbconfig.js';

// ==========================================
// 1. OBTENER CARRITO (getCart)
// ==========================================
export const getCart = async (req, res) => {
    // Nota: Tu ruta usa :userId, así que lo leemos así
    const { userId } = req.params; 

    try {
        // 1. Asegurar que existe el carrito
        const [carritoExistente] = await pool.query('SELECT id_carrito FROM carritos WHERE id_usuario = ?', [userId]);
        
        if (carritoExistente.length === 0) {
            await pool.query('INSERT INTO carritos (id_usuario) VALUES (?)', [userId]);
        }

        // 2. Traer productos
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

        // Calcular totales
        const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);
        const totalPrecio = items.reduce((sum, item) => sum + parseFloat(item.total), 0);

        res.json({ 
            success: true, 
            data: items, 
            totalItems, 
            totalPrecio 
        });

    } catch (error) {
        console.error("Error en getCart:", error);
        res.status(500).json({ success: false, message: "Error al obtener el carrito" });
    }
};

// ==========================================
// 2. AÑADIR O ACTUALIZAR (addOrUpdateCartItem)
// ==========================================
export const addOrUpdateCartItem = async (req, res) => {
    // Tu ruta espera userId en el body para este POST
    const { id_usuario, id_producto, cantidad } = req.body; 
    
    // A veces el frontend manda 'userId' o 'id_usuario', aseguramos cual llega
    const usuarioFinal = id_usuario || req.body.userId;
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
        res.status(500).json({ success: false, message: "Error al actualizar carrito" });
    }
};

// ==========================================
// 3. ELIMINAR ÍTEM (removeItemFromCart)
// ==========================================
export const removeItemFromCart = async (req, res) => {
    const { productId } = req.params; // Tu ruta usa :productId
    const { id_usuario, userId } = req.body; // Puede venir uno u otro
    const usuarioFinal = id_usuario || userId;

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
    const { userId } = req.params; // Tu ruta usa :userId

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