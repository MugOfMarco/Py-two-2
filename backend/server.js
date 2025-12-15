// backend/server.js

// 1. IMPORTS NECESARIOS
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Importación de Controladores de Lógica (BD)
import { getCart } from './controllers/carritocontroller.js';
import { getProducts } from './controllers/productcontroller.js'; // Usa la BD

// Importación de Configuración y Rutas
// NOTA: Se usa bdconfig.js de la primera versión, asumiendo que es la fuente correcta.
// Si tu archivo de BD correcto es dbconfig.js, cambia la importación abajo.
import { testConnection } from './config/dbconfig.js'; 
import userRoutes from './routers/userroutes.js'; 
import carritoRoutes from './routers/carritoroutes.js';


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


// ====================================================================
// 3. RUTAS DE LA API (ENDPOINT DE BACKEND)
// ====================================================================

// NOTA: Mantuve el path original '/api/users' para userRoutes. 
// Si la ruta del segundo fragmento ('/api/usuarios') es la correcta, ajusta aquí.
app.use('/api/users', userRoutes); 
app.use('/api/carrito', carritoRoutes); 


// ====================================================================
// 4. RUTAS DE VISTAS (PÁGINAS EJS)
// ====================================================================

// --- RUTA PRINCIPAL (REDISPOSICIÓN DE HOME) ---
// La ruta '/' ahora redirige a /login (según tu solicitud)
app.get('/', (req, res) => {
    res.redirect('/login');
});


// --- RUTAS DE AUTENTICACIÓN (Del segundo fragmento) ---
app.get('/login', (req, res) => { 
    res.render('login', { title: 'Iniciar Sesión' }); 
}); 

app.get('/registro', (req, res) => { 
    res.render('registro', { title: 'Crear Cuenta' });  
}); 


// --- RUTA PRINCIPAL DE TIENDA (AHORA ES '/main') ---
app.get('/main', async (req, res) => {
    const searchQuery = req.query.q || ''; 
    let productos = [];
    let message = null;

    try {
        // Llama al controlador que usa la BD
        const result = await getProducts({ query: searchQuery });
        
        productos = result.productos;
        message = result.message; 
        
    } catch (error) {
        // Captura errores de conexión o consulta de la BD
        console.error("Error al cargar productos de la tienda:", error.message);
        message = 'Hubo un error al cargar los productos de la tienda.';
    }

    // Renderizar main.ejs
    res.render('main', { 
        title: searchQuery ? `Búsqueda: ${searchQuery}` : 'Inicio',
        productos: productos, 
        searchQuery: searchQuery, 
        message: message 
    }); 
});


// --- OTRAS VISTAS (DE CATEGORÍAS) ---
app.get('/juguetes', (req, res) => { res.render('juguetes', { title: 'Juguetes' }); });
app.get('/lenceria', (req, res) => { res.render('lenceria', { title: 'Lencería' }); });
app.get('/bdsm', (req, res) => { res.render('bdsm', { title: 'BDSM' }); });
app.get('/bienestar', (req, res) => { res.render('bienestar', { title: 'Bienestar' }); });


// --- RUTA DEL CARRITO (CON DATOS DE BD REAL) ---
app.get('/carrito', async (req, res) => {
    let itemsCarrito = [];
    let errorMessage = null;
    
    try {
        // Llama al controlador de carrito que usa la BD
        itemsCarrito = await getCart(req, res); 
        
    } catch (error) {
        console.error("Error al cargar la página de carrito:", error.message);
        errorMessage = 'Hubo un error al cargar tu carrito de compras. Intenta más tarde.';
    }

    res.render('carrito', { 
        title: 'Mi Carrito de Compras', 
        items: itemsCarrito, // Array de ítems devuelto por el controlador de BD
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