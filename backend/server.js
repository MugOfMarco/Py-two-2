// backend/server.js

// 1. IMPORTS NECESARIOS
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
// Importamos la función getCart para usarla directamente en la ruta de vista
import { getCart } from './controllers/carritocontroller.js';
import { testConnection } from './config/bdconfig.js'; 
import userRoutes from './routers/userroutes.js'; 

// === Importación Robustecida para evitar el error 'default' ===
import * as carritoModule from './routers/carritoroutes.js'; 
const carritoRoutes = carritoModule.default;
// ==============================================================


// --- Configuración Inicial ---

dotenv.config(); 

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración para usar __dirname y __filename con módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); 
const PROJECT_ROOT = path.join(__dirname, '..'); 

// ====================================================================
// 2. MIDDLEWARES GLOBALES
// ====================================================================

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Configurar EJS como motor de plantillas
app.set('view engine', 'ejs');

// Configurando VISTAS
app.set('views', path.join(PROJECT_ROOT, 'frontend', 'views')); 

// Configurando ARCHIVOS ESTÁTICOS: [ROOT]/frontend/public
const PUBLIC_PATH = path.join(PROJECT_ROOT, 'frontend', 'public');
app.use(express.static(PUBLIC_PATH));

console.log(`[DEBUG RUTA ESTÁTICA]: Archivos servidos desde: ${PUBLIC_PATH}`); 

// --- MOCK DE DATOS para Home y API ---
function getMockProducts(category) {
    const allProducts = {
        'Destacados': [
            { id: 1, nombre: "Vibrador Premium", descripcion: "Diseño ergonómico de alta gama", precio: 1299, imagen: '🌟', badge: 'Best Seller' },
            { id: 2, nombre: "Set Lencería Deluxe", descripcion: "Elegancia y comodidad", precio: 899, imagen: '💜', badge: 'Top 2' },
            { id: 3, nombre: "Aceite Masaje Sensual", descripcion: "Aromaterapia para parejas", precio: 449, imagen: '🎀', badge: 'Top 3' },
            { id: 4, nombre: "Kit BDSM Principiantes", descripcion: "Todo para empezar", precio: 1599, imagen: '🔥', badge: 'Top 4' }
        ],
        'BDSM': [
            { id: 101, nombre: 'Esposas de Terciopelo', descripcion: 'Suaves y resistentes.', precio: 850, imagen: '⛓️', badge: 'Nuevo' },
            { id: 102, nombre: 'Máscara de Cuero', descripcion: 'Arnés ajustable.', precio: 2500, imagen: '🎭', badge: 'Top' },
        ],
        'Juguetes': [
            { id: 201, nombre: 'Vibrador Bala', descripcion: 'Potente y discreto.', precio: 799, imagen: '⚡', badge: 'S/N' },
            { id: 202, nombre: 'Dildo Clásico', descripcion: 'Textura realista.', precio: 1150, imagen: '🍆', badge: '' },
        ],
        'Lencería': [
            { id: 301, nombre: 'Body de Encaje', descripcion: 'Transparente y sensual.', precio: 1599, imagen: '👗', badge: 'Hot' },
        ],
        'Bienestar': [
            { id: 401, nombre: 'Velas Aromáticas', descripcion: 'Ambiente relajante.', precio: 300, imagen: '🕯️', badge: '' },
        ],
    };
    return allProducts[category] || [];
}

// ====================================================================
// 3. RUTAS DE LA API (ENDPOINT DE BACKEND)
// ====================================================================

app.use('/api/users', userRoutes); 
app.use('/api/carrito', carritoRoutes); 

// RUTA API para tienda.js (Carga de productos dinámicos)
app.get('/api/products/:categorySlug', (req, res) => {
    const categoryName = req.params.categorySlug;
    const products = getMockProducts(categoryName);
    
    if (products.length > 0) {
        res.json({ success: true, data: products });
    } else {
        res.status(404).json({ success: false, message: 'Categoría no encontrada o sin productos' });
    }
});


// ====================================================================
// 4. RUTAS DE VISTAS (PÁGINAS EJS)
// ====================================================================

// --- RUTA PRINCIPAL (HOME) Y BÚSQUEDA ---
app.get('/', async (req, res) => {
    const searchQuery = req.query.q || ''; 
    let productos = [];
    let message = null;

    // Cargar productos destacados para HOME (o resultado de búsqueda)
    const allProducts = getMockProducts('Destacados');

    if (searchQuery) {
        // Lógica de búsqueda simulada
        productos = allProducts.filter(p => 
            p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
            p.descripcion.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (productos.length === 0) {
            message = `No se encontraron resultados para "${searchQuery}".`;
        }
    } else {
        productos = allProducts;
    }

    // Renderizar main.ejs
    res.render('main', { 
        title: searchQuery ? `Búsqueda: ${searchQuery}` : 'Inicio',
        productos: productos, 
        searchQuery: searchQuery, 
        message: message 
    }); 
});

// --- OTRAS VISTAS ---
app.get('/juguetes', (req, res) => { res.render('juguetes', { title: 'Juguetes' }); });
app.get('/lenceria', (req, res) => { res.render('lenceria', { title: 'Lencería' }); });
app.get('/bdsm', (req, res) => { res.render('bdsm', { title: 'BDSM' }); });
app.get('/bienestar', (req, res) => { res.render('bienestar', { title: 'Bienestar' }); });
app.get('/login', (req, res) => { res.render('login', { title: 'Iniciar Sesión' }); });


// --- RUTA DEL CARRITO (AHORA CON DATOS DE BD) ---
app.get('/carrito', async (req, res) => {
    let itemsCarrito = [];
    let errorMessage = null;
    
    try {
        // La función getCart está implementada en carritocontroller.js y devuelve los ítems
        itemsCarrito = await getCart(req, res); 
        
    } catch (error) {
        console.error("Error al cargar la página de carrito:", error.message);
        errorMessage = 'Hubo un error al cargar tu carrito de compras. Intenta más tarde.';
    }

    res.render('carrito', { 
        title: 'Mi Carrito de Compras', 
        items: itemsCarrito, // Pasamos el array de ítems a la vista
        error: errorMessage
    }); 
});


// ====================================================================
// 5. INICIO DEL SERVIDOR
// ====================================================================

async function startServer() {
    await testConnection(); // Intenta conectar a la BD
    
    app.listen(PORT, () => {
        console.log(`🚀 Servidor Express iniciado en el puerto ${PORT}`);
        console.log(`🌐 Accede a la aplicación en http://localhost:${PORT}`);
    });
}

startServer();

// --- Manejo de errores 404 (JSON vs HTML) ---
app.use((req, res) => {
    // Verifica si la solicitud acepta JSON (típico de una llamada API)
    if (req.accepts('json')) {
        // Si es una llamada API, devuelve un JSON de error 404
        return res.status(404).json({ success: false, message: 'Ruta API no encontrada' });
    }

    // Si acepta HTML (típico de navegar a una URL), devuelve la vista 404
    res.status(404).render('404', { title: 'Página no encontrada' });
});