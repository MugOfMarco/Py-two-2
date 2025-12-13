// backend/controllers/carritocontroller.js

// Importamos tu conexión a la base de datos ya existente
import { pool } from '../config/bdconfig.js'; 

// =======================================================
// LÓGICA PRINCIPAL: addOrUpdateCartItem (USA SQL REAL)
// =======================================================

/**
 * 1. Garantiza que el carrito principal (tabla carritos) exista para el usuario.
 * 2. Inserta o actualiza el ítem de producto en la tabla items_carrito.
 */
export const addOrUpdateCartItem = async (req, res) => {
    // NOTA: Usamos el ID de usuario '1' de forma fija hasta implementar el sistema de login/sesión.
    const userId = 1; 
    const { productId, quantity = 1 } = req.body;
    
    if (!productId) {
        return res.status(400).json({ success: false, message: 'Falta el ID del producto.' });
    }
    
    try {
        // --- 1. Garantizar que el Carrito (tabla carritos) exista ---
        let cartId;
        
        // Buscar el carrito existente del usuario
        const [existingCart] = await pool.query(
            'SELECT id_carrito FROM carritos WHERE id_usuario = ?',
            [userId]
        );

        if (existingCart.length > 0) {
            cartId = existingCart[0].id_carrito;
            console.log(`[BACKEND - CARRITO]: Carrito principal encontrado (ID: ${cartId}).`);
        } else {
            // Si no existe, crear un nuevo carrito para el usuario
            const [result] = await pool.query(
                'INSERT INTO carritos (id_usuario) VALUES (?)',
                [userId]
            );
            cartId = result.insertId;
            console.log(`[BACKEND - CARRITO]: Nuevo carrito principal creado (ID: ${cartId}).`);
        }

        // --- 2. Insertar o Actualizar el Ítem en items_carrito ---
        
        // Buscar el ítem dentro de items_carrito
        const [existingItem] = await pool.query(
            'SELECT id_item, cantidad FROM items_carrito WHERE id_carrito = ? AND id_producto = ?',
            [cartId, productId]
        );

        let query;
        let params;
        let message;
        
        // NOTA: El precio_unitario se puede ignorar en esta etapa si se consulta de la tabla 'productos'.
        // Aquí asumimos que aún no tienes la tabla 'productos' poblada, así que no se usa el precio.

        if (existingItem.length > 0) {
            // Si el ítem existe, actualizar la cantidad
            const newQuantity = existingItem[0].cantidad + quantity;
            
            query = 'UPDATE items_carrito SET cantidad = ? WHERE id_item = ?';
            params = [newQuantity, existingItem[0].id_item];
            message = `Cantidad del producto ${productId} actualizada en el carrito ${cartId}.`;
            
        } else {
            // Si no existe, insertar el nuevo ítem
            query = 'INSERT INTO items_carrito (id_carrito, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)';
            // El precio unitario debe ser consultado de la tabla productos. Usamos 0 como placeholder.
            params = [cartId, productId, quantity, 0.00]; 
            message = `Producto ${productId} insertado en el carrito ${cartId}.`;
        }

        await pool.query(query, params);

        console.log(`✅ [BACKEND - CARRITO]: ${message}`);
        
        // Respuesta de éxito (JSON) al frontend
        res.json({ success: true, message: message }); 

    } catch (error) {
        console.error('❌ [BACKEND - CARRITO]: Error SQL al guardar en el carrito:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor al guardar en el carrito.', error: error.message });
    }
};

// =======================================================
// Otras funciones (MOCKS temporales - Pendientes de conectar a SQL)
// =======================================================

// Estas funciones aún son MOCKs y solo devuelven datos fijos:
// backend/controllers/carritocontroller.js (Fragmento)

// ... (asegúrate de que el resto del código, incluido addOrUpdateCartItem, se mantenga)

// =======================================================
// LÓGICA PRINCIPAL: getCart (AHORA USA SQL REAL)
// =======================================================
export const getCart = async (req, res) => {
    // NOTA: Usamos el ID de usuario '1' de forma fija hasta implementar el sistema de login/sesión.
    const userId = 1; 

    try {
        console.log(`[BACKEND - CARRITO]: Ejecutando SQL para obtener carrito del Usuario ID: ${userId}`);

        // Consulta SQL para obtener todos los ítems del carrito.
        // Unimos (JOIN) las tres tablas: carritos, items_carrito y productos.
        const query = `
            SELECT
                ic.id_item,
                ic.cantidad,
                p.id_producto,
                p.nombre,
                p.descripcion,
                p.precio,
                p.imagen_url
            FROM carritos AS c
            JOIN items_carrito AS ic ON c.id_carrito = ic.id_carrito
            JOIN productos AS p ON ic.id_producto = p.id_producto
            WHERE c.id_usuario = ?
        `;

        const [items] = await pool.query(query, [userId]);
        
        console.log(`✅ [BACKEND - CARRITO]: ${items.length} ítems encontrados en el carrito.`);
        
        // Esta función devolverá el array de ítems (lo usaremos en server.js, no en una API directa)
        return items; 

    } catch (error) {
        console.error('❌ [BACKEND - CARRITO]: Error SQL al obtener el carrito:', error);
        // Lanzamos el error para que sea capturado por el middleware de ruta en server.js
        throw new Error('Error al cargar los datos del carrito desde la BD.'); 
    }
};

// ... (El resto del controlador debe permanecer igual: addOrUpdateCartItem, etc.)

export const getCartItemCount = async (req, res) => {
    const { userId } = req.params;
    console.log(`[BACKEND - CARRITO] MOCK: Obteniendo conteo para el usuario ${userId}`);
    res.json({ success: true, count: 0 }); 
};

export const removeItemFromCart = (req, res) => { res.json({ success: true, message: 'Ítem eliminado (MOCK).' }); };
export const clearUserCart = (req, res) => { res.json({ success: true, message: 'Carrito vaciado (MOCK).' }); };