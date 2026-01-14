import { pool } from '../config/dbconfig.js';

/**
 * Procesa el pago, mueve items del carrito al historial y vacía el carrito.
 */
export const finalizarCompra = async (req, res) => {
    const { id_usuario, metodo_pago } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Obtener items del carrito
        const [items] = await connection.query(
            `SELECT ic.id_producto, ic.cantidad, p.precio 
             FROM items_carrito ic 
             JOIN carritos c ON ic.id_carrito = c.id_carrito
             JOIN productos p ON ic.id_producto = p.id_producto
             WHERE c.id_usuario = ?`, [id_usuario]
        );

        if (items.length === 0) throw new Error("El carrito está vacío.");

        const total = items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

        // 2. Crear pedido en historial
        const [pedidoResult] = await connection.query(
            `INSERT INTO pedidos (id_usuario, total, metodo_pago) VALUES (?, ?, ?)`,
            [id_usuario, total, metodo_pago]
        );
        const id_pedido = pedidoResult.insertId;

        // 3. Mover a detalles y restar stock
        for (const item of items) {
            await connection.query(
                `INSERT INTO detalles_pedido (id_pedido, id_producto, cantidad, precio_unitario_historico) 
                 VALUES (?, ?, ?, ?)`,
                [id_pedido, item.id_producto, item.cantidad, item.precio]
            );
            await connection.query(
                `UPDATE productos SET stock = stock - ? WHERE id_producto = ?`,
                [item.cantidad, item.id_producto]
            );
        }

        // 4. Vaciar carrito
        await connection.query(
            `DELETE ic FROM items_carrito ic 
             JOIN carritos c ON ic.id_carrito = c.id_carrito 
             WHERE c.id_usuario = ?`, [id_usuario]
        );

        await connection.commit();
        res.status(200).json({ success: true, message: "Compra exitosa", id_pedido });

    } catch (error) {
        await connection.rollback();
        console.error("Error en pago:", error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};

/**
 * Obtiene la lista de pedidos de un usuario para el historial.
 */
export const getHistorialUsuario = async (req, res) => {
    const { id_usuario } = req.params;
    
    try {
        const [pedidos] = await pool.query(
            `SELECT id_pedido, fecha_pedido, total, metodo_pago, estado_pago 
             FROM pedidos 
             WHERE id_usuario = ? 
             ORDER BY fecha_pedido DESC`, 
            [id_usuario]
        );
        
        res.status(200).json({ success: true, data: pedidos });
    } catch (error) {
        console.error("Error al obtener historial:", error);
        res.status(500).json({ success: false, message: "Error al cargar el historial." });
    }
};