import express from 'express';
import mysql from 'mysql2';
import session from 'express-session';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de la base de datos
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', // Cambia según tu configuración
    database: 'APICRUD_JUGUETES',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Configuración de sesiones
app.use(session({
    secret: 'tu_secreto_super_seguro_aqui',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Cambiar a true si usas HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Motor de plantillas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../frontend/views'));

// ==================== RUTAS ====================

// Página principal con búsqueda
app.get('/', (req, res) => {
    const searchQuery = req.query.q || '';
    let query = 'SELECT * FROM productos WHERE stock > 0';
    let params = [];

    if (searchQuery) {
        query += ' AND (nombre LIKE ? OR descripcion LIKE ? OR categoria LIKE ?)';
        const searchPattern = `%${searchQuery}%`;
        params = [searchPattern, searchPattern, searchPattern];
    }

    query += ' ORDER BY id_producto DESC LIMIT 20';

    db.query(query, params, (err, productos) => {
        if (err) {
            console.error('Error al obtener productos:', err);
            return res.status(500).send('Error al cargar productos');
        }

        res.render('main', {
            title: searchQuery ? `Búsqueda: ${searchQuery}` : 'Inicio',
            productos: productos,
            searchQuery: searchQuery,
            message: productos.length === 0 && searchQuery ? 'No se encontraron productos' : null
        });
    });
});

// API: Buscar productos (para búsqueda en tiempo real)
app.get('/api/productos/buscar', (req, res) => {
    const searchQuery = req.query.q || '';
    
    if (!searchQuery || searchQuery.trim().length < 2) {
        return res.json({ productos: [] });
    }

    const query = `
        SELECT id_producto, nombre, descripcion, precio, stock, categoria, imagen_url 
        FROM productos 
        WHERE stock > 0 
        AND (nombre LIKE ? OR descripcion LIKE ? OR categoria LIKE ?)
        LIMIT 10
    `;
    
    const searchPattern = `%${searchQuery}%`;
    
    db.query(query, [searchPattern, searchPattern, searchPattern], (err, productos) => {
        if (err) {
            console.error('Error en búsqueda:', err);
            return res.status(500).json({ error: 'Error al buscar productos' });
        }
        res.json({ productos });
    });
});

// API: Agregar producto al carrito
app.post('/api/carrito/agregar', (req, res) => {
    const { id_producto, cantidad = 1 } = req.body;
    const id_usuario = req.session.userId;

    if (!id_usuario) {
        return res.status(401).json({ 
            success: false, 
            message: 'Debes iniciar sesión para agregar productos al carrito',
            requireLogin: true 
        });
    }

    if (!id_producto) {
        return res.status(400).json({ 
            success: false, 
            message: 'ID de producto no válido' 
        });
    }

    // Verificar que el producto existe y tiene stock
    db.query('SELECT * FROM productos WHERE id_producto = ? AND stock >= ?', 
        [id_producto, cantidad], 
        (err, productos) => {
            if (err) {
                console.error('Error al verificar producto:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error al verificar el producto' 
                });
            }

            if (productos.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Producto no disponible o sin stock suficiente' 
                });
            }

            const producto = productos[0];

            // Obtener o crear carrito del usuario
            db.query('SELECT id_carrito FROM carritos WHERE id_usuario = ?', 
                [id_usuario], 
                (err, carritos) => {
                    if (err) {
                        console.error('Error al obtener carrito:', err);
                        return res.status(500).json({ 
                            success: false, 
                            message: 'Error al acceder al carrito' 
                        });
                    }

                    let id_carrito;

                    const agregarItem = () => {
                        // Verificar si el producto ya está en el carrito
                        db.query(
                            'SELECT * FROM items_carrito WHERE id_carrito = ? AND id_producto = ?',
                            [id_carrito, id_producto],
                            (err, items) => {
                                if (err) {
                                    console.error('Error al verificar item:', err);
                                    return res.status(500).json({ 
                                        success: false, 
                                        message: 'Error al verificar el carrito' 
                                    });
                                }

                                if (items.length > 0) {
                                    // Actualizar cantidad
                                    const nuevaCantidad = items[0].cantidad + cantidad;
                                    
                                    db.query(
                                        'UPDATE items_carrito SET cantidad = ? WHERE id_item = ?',
                                        [nuevaCantidad, items[0].id_item],
                                        (err) => {
                                            if (err) {
                                                console.error('Error al actualizar item:', err);
                                                return res.status(500).json({ 
                                                    success: false, 
                                                    message: 'Error al actualizar el carrito' 
                                                });
                                            }

                                            res.json({ 
                                                success: true, 
                                                message: 'Cantidad actualizada en el carrito',
                                                producto: producto.nombre
                                            });
                                        }
                                    );
                                } else {
                                    // Insertar nuevo item
                                    db.query(
                                        'INSERT INTO items_carrito (id_carrito, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
                                        [id_carrito, id_producto, cantidad, producto.precio],
                                        (err) => {
                                            if (err) {
                                                console.error('Error al insertar item:', err);
                                                return res.status(500).json({ 
                                                    success: false, 
                                                    message: 'Error al agregar al carrito' 
                                                });
                                            }

                                            res.json({ 
                                                success: true, 
                                                message: 'Producto agregado al carrito',
                                                producto: producto.nombre
                                            });
                                        }
                                    );
                                }
                            }
                        );
                    };

                    if (carritos.length === 0) {
                        // Crear nuevo carrito
                        db.query(
                            'INSERT INTO carritos (id_usuario) VALUES (?)',
                            [id_usuario],
                            (err, result) => {
                                if (err) {
                                    console.error('Error al crear carrito:', err);
                                    return res.status(500).json({ 
                                        success: false, 
                                        message: 'Error al crear el carrito' 
                                    });
                                }

                                id_carrito = result.insertId;
                                agregarItem();
                            }
                        );
                    } else {
                        id_carrito = carritos[0].id_carrito;
                        agregarItem();
                    }
                }
            );
        }
    );
});

// API: Obtener carrito del usuario
app.get('/api/carrito', (req, res) => {
    const id_usuario = req.session.userId;

    if (!id_usuario) {
        return res.status(401).json({ 
            success: false, 
            message: 'Debes iniciar sesión' 
        });
    }

    const query = `
        SELECT 
            ic.id_item,
            ic.cantidad,
            ic.precio_unitario,
            p.id_producto,
            p.nombre,
            p.descripcion,
            p.imagen_url,
            (ic.cantidad * ic.precio_unitario) as subtotal
        FROM carritos c
        INNER JOIN items_carrito ic ON c.id_carrito = ic.id_carrito
        INNER JOIN productos p ON ic.id_producto = p.id_producto
        WHERE c.id_usuario = ?
    `;

    db.query(query, [id_usuario], (err, items) => {
        if (err) {
            console.error('Error al obtener carrito:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error al cargar el carrito' 
            });
        }

        const total = items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

        res.json({ 
            success: true, 
            items, 
            total,
            cantidad_items: items.length
        });
    });
});

// Página de carrito
app.get('/carrito', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }

    res.render('carrito', {
        title: 'Mi Carrito'
    });
});

// Página de login (simple)
app.get('/login', (req, res) => {
    res.render('login', {
        title: 'Iniciar Sesión'
    });
});

// Login POST
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM usuarios WHERE email = ?', [email], async (err, users) => {
        if (err) {
            console.error('Error en login:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error al iniciar sesión' 
            });
        }

        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Email o contraseña incorrectos' 
            });
        }

        const user = users[0];
        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            return res.status(401).json({ 
                success: false, 
                message: 'Email o contraseña incorrectos' 
            });
        }

        req.session.userId = user.id_usuario;
        req.session.userName = user.nombre;

        res.json({ 
            success: true, 
            message: 'Inicio de sesión exitoso',
            user: { nombre: user.nombre, email: user.email }
        });
    });
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error al cerrar sesión' 
            });
        }
        res.json({ success: true, message: 'Sesión cerrada' });
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});