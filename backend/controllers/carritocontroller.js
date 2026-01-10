import { pool } from '../config/dbconfig.js';

async function getOrCreateCartId(id_usuario, connection) {
    let [result] = await connection.query('SELECT id_carrito FROM carritos WHERE id_usuario = ?', [id_usuario]);
    if (result.length > 0) return result[0].id_carrito;
    [result] = await connection.query('INSERT INTO carritos (id_usuario) VALUES (?)', [id_usuario]);
    return result.insertId;
}

async function getProductDetails(id_producto, connection) {
    const [result] = await connection.query('SELECT precio, stock FROM productos WHERE id_producto = ?', [id_producto]);
    return result.length > 0 ? result[0] : null;
}

export async function getCart(req, res) {
    const id_usuario = parseInt(req.params.userId);
    if (isNaN(id_usuario)) return res.status(400).json({ success: false, message: 'ID de usuario inválido.' });
    try {
        const query = `
            SELECT ic.id_item, ic.id_producto, ic.cantidad, ic.precio_unitario, p.nombre, p.descripcion
            FROM items_carrito ic
            JOIN carritos c ON ic.id_carrito = c.id_carrito
            JOIN productos p ON ic.id_producto = p.id_producto
            WHERE c.id_usuario = ?
            ORDER BY ic.id_item DESC;`;
        const [items] = await pool.query(query, [id_usuario]);
        const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);
        res.status(200).json({ success: true, data: items, totalItems });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export async function addOrUpdateCartItem(req, res) {
    const { id_usuario, id_producto, cantidad } = req.body;
    if (!id_usuario || !id_producto || !cantidad) {
        return res.status(400).json({ success: false, message: 'Datos incompletos.' });
    }
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const id_carrito = await getOrCreateCartId(id_usuario, connection);
        const product = await getProductDetails(id_producto, connection);
        if (!product) throw new Error('Producto no encontrado.');
        if (product.stock < cantidad) throw new Error('Stock insuficiente.');

        const [existing] = await connection.query(
            'SELECT id_item, cantidad FROM items_carrito WHERE id_carrito = ? AND id_producto = ?',
            [id_carrito, id_producto]
        );

        if (existing.length > 0) {
            await connection.query(
                'UPDATE items_carrito SET cantidad = cantidad + ?, precio_unitario = ? WHERE id_item = ?',
                [cantidad, product.precio, existing[0].id_item]
            );
        } else {
            await connection.query(
                'INSERT INTO items_carrito (id_carrito, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
                [id_carrito, id_producto, cantidad, product.precio]
            );
        }
        await connection.commit();
        res.status(200).json({ success: true, message: 'Carrito actualizado' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
}

// --- ELIMINAR UN PRODUCTO DEL CARRITO ---
export async function removeItemFromCart(req, res) {
    const id_producto = parseInt(req.params.productId);
    // En un sistema real, el id_usuario vendría del token JWT (req.user.id)
    const id_usuario = req.body.id_usuario; 

    const connection = await pool.getConnection();
    try {
        const [cart] = await connection.query('SELECT id_carrito FROM carritos WHERE id_usuario = ?', [id_usuario]);
        if (cart.length > 0) {
            await connection.query('DELETE FROM items_carrito WHERE id_carrito = ? AND id_producto = ?', [cart[0].id_carrito, id_producto]);
            res.status(200).json({ success: true, message: 'Producto eliminado.' });
        } else {
            res.status(404).json({ success: false, message: 'Carrito no encontrado.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
}

// --- VACÍAR TODO EL CARRITO ---
export async function clearUserCart(req, res) {
    const id_usuario = parseInt(req.params.userId);
    const connection = await pool.getConnection();
    try {
        const [cart] = await connection.query('SELECT id_carrito FROM carritos WHERE id_usuario = ?', [id_usuario]);
        if (cart.length > 0) {
            await connection.query('DELETE FROM items_carrito WHERE id_carrito = ?', [cart[0].id_carrito]);
            res.status(200).json({ success: true, message: 'Carrito vaciado.' });
        } else {
            res.status(404).json({ success: false, message: 'Carrito no encontrado.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
}