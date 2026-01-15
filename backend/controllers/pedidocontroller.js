import { pool } from '../config/dbconfig.js';

// ==========================================
// 1. FINALIZAR COMPRA (finalizarCompra)
// ==========================================
export const finalizarCompra = async (req, res) => {
    // Tu ruta espera estos datos en el cuerpo (body)
    const { id_usuario, metodo_pago } = req.body;
    
    // Validar datos básicos
    if (!id_usuario || !metodo_pago) {
        return res.status(400).json({ success: false, message: "Faltan datos del usuario o método de pago" });
    }

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

        if (items.length === 0) {
            throw new Error("El carrito está vacío.");
        }

        // 2. Calcular total
        const total = items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        // Agregamos IVA si tu lógica lo requiere (x 1.16) o lo dejamos neto. 
        // Aquí guardamos el subtotal base de los productos.
        
        // 3. Crear pedido en la tabla 'pedidos'
        const [pedidoResult] = await connection.query(
            `INSERT INTO pedidos (id_usuario, total, metodo_pago) VALUES (?, ?, ?)`,
            [id_usuario, total, metodo_pago]
        );
        const id_pedido = pedidoResult.insertId;

        // 4. Mover items a 'detalles_pedido' y restar stock
        for (const item of items) {
            // Guardar detalle
            await connection.query(
                `INSERT INTO detalles_pedido (id_pedido, id_producto, cantidad, precio_unitario_historico) 
                 VALUES (?, ?, ?, ?)`,
                [id_pedido, item.id_producto, item.cantidad, item.precio]
            );

            // Restar inventario (Stock)
            await connection.query(
                `UPDATE productos SET stock = stock - ? WHERE id_producto = ?`,
                [item.cantidad, item.id_producto]
            );
        }

        // 5. Vaciar el carrito
        await connection.query(
            `DELETE ic FROM items_carrito ic 
             JOIN carritos c ON ic.id_carrito = c.id_carrito 
             WHERE c.id_usuario = ?`, [id_usuario]
        );

        await connection.commit();
        res.status(200).json({ success: true, message: "Compra exitosa", id_pedido });

    } catch (error) {
        await connection.rollback();
        console.error("Error en finalizarCompra:", error);
        res.status(500).json({ success: false, message: error.message || "Error al procesar el pago" });
    } finally {
        connection.release();
    }
};

// ==========================================
// 2. VER HISTORIAL (getHistorialUsuario)
// ==========================================
export const getHistorialUsuario = async (req, res) => {
    // Tu ruta usa :id_usuario en la URL
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
        console.error("Error en getHistorialUsuario:", error);
        res.status(500).json({ success: false, message: "Error al cargar el historial." });
    }
};