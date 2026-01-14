// backend/server.js

// 1. IMPORTS NECESARIOS
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Importación de Controladores
import { getCart } from './controllers/carritocontroller.js';
import { getProducts } from './controllers/productcontroller.js';

// Importación de Configuración y Rutas
import { testConnection } from './config/dbconfig.js';
import userRoutes from './routers/userroutes.js';
import carritoRoutes from './routers/carritoroutes.js';
import productRoutes from './routers/productroutes.js';
// 🚨 NUEVO: Importación de Rutas de Pedidos e Historial
import pedidoRoutes from './routers/pedidoroutes.js';

// --- Configuración Inicial ---
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

// ====================================================================
// 2. MIDDLEWARES GLOBALES
// ====================================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(PROJECT_ROOT, 'frontend', 'views'));

const PUBLIC_PATH = path.join(PROJECT_ROOT, 'frontend', 'public');
app.use(express.static(PUBLIC_PATH));

// ====================================================================
// 3. RUTAS DE LA API (ENDPOINTS)
// ====================================================================
app.use('/api/users', userRoutes);
app.use('/api/carrito', carritoRoutes);
app.use('/api/productos', productRoutes);
// 🚨 NUEVO: Endpoint para procesar pagos y guardar historial
app.use('/api/pedidos', pedidoRoutes);

// ====================================================================
// 4. RUTAS DE VISTAS (PÁGINAS EJS)
// ====================================================================

app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    res.render('login', { title: 'Iniciar Sesión' });
});

app.get('/registro', (req, res) => {
    res.render('registro', { title: 'Crear Cuenta' });
});

// --- TIENDA PRINCIPAL ---
app.get('/main', async (req, res) => {
    const searchQuery = req.query.q || '';
    let productos = [];
    let message = null;

    try {
        const result = await getProducts({ query: searchQuery });
        productos = result.productos;
        message = result.message;
    } catch (error) {
        console.error("Error al cargar productos:", error.message);
        message = 'Hubo un error al cargar los productos.';
    }

    res.render('main', {
        title: searchQuery ? `Búsqueda: ${searchQuery}` : 'Inicio',
        productos: productos,
        searchQuery: searchQuery,
        message: message
    });
});

// --- RUTA DEL CARRITO ---
app.get('/carrito', (req, res) => {
    res.render('carrito', { title: 'Mi Carrito de Compras' }); 
});

// --- NUEVO: RUTA DE LA PÁGINA DE PAGO ---
app.get('/pago', (req, res) => {
    res.render('pago', { title: 'Finalizar Pago' });
});

// --- NUEVO: RUTA DEL HISTORIAL DE COMPRAS ---
app.get('/historial', (req, res) => {
    res.render('historial', { title: 'Mis Compras Pasadas' });
});

// --- CATEGORÍAS ---
app.get('/juguetes', (req, res) => { res.render('juguetes', { title: 'Juguetes' }); });
app.get('/lenceria', (req, res) => { res.render('lenceria', { title: 'Lencería' }); });
app.get('/bdsm', (req, res) => { res.render('bdsm', { title: 'BDSM' }); });
app.get('/bienestar', (req, res) => { res.render('bienestar', { title: 'Bienestar' }); });

// ====================================================================
// 5. INICIO DEL SERVIDOR
// ====================================================================
async function startServer() {
    await testConnection(); 
    app.listen(PORT, () => {
        console.log(`🚀 Servidor en http://localhost:${PORT}`);
    });
}

startServer();

// Manejo de errores 404
app.use((req, res) => {
    if (req.accepts('json')) {
        return res.status(404).json({ success: false, message: 'Ruta API no encontrada' });
    }
    res.status(404).render('404', { title: 'Página no encontrada' });
});