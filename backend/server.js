import express from 'express';
import path from 'path'; 
import { fileURLToPath } from 'url';

// --- Importaciones del Subsistema ---
import { testConnection } from './config/dbconfig.js'; 
import userRoutes from './routers/userroutes.js'; // Asegúrate de que este path sea correcto: './routes'
// NOTA: Cambié './routers' a './routes' para estandarizar. Si tu carpeta es 'routers', cámbialo.

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

// ------------------------------------------------------------------
// MIDDLEWARES GLOBALES
// ------------------------------------------------------------------

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de EJS y Vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'frontend', 'views')); 

// Servir archivos estáticos (CSS, JS, imágenes)
// Esto sirve archivos desde /public, así /css/login.css funciona si está ahí.
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public'))); 

// ------------------------------------------------------------------
// MONTAJE DE RUTAS
// ------------------------------------------------------------------

// Rutas de la API de Usuarios (POST /api/usuarios/login, POST /api/usuarios/registro)
app.use('/api/usuarios', userRoutes); 

// === RUTAS DE VISTA DEL FRONTEND ===

// --- RUTAS DE VISTA DEL FRONTEND (CORREGIDAS) ---

app.get('/', (req, res) => {
    res.render('login', { title: 'Iniciar Sesión' }); 
});

app.get('/login', (req, res) => {
    res.render('login', { title: 'Iniciar Sesión' });
});

app.get('/registro', (req, res) => {
    res.render('registro', { title: 'Crear Cuenta' }); 
});

app.get('/main', (req, res) => {
    // Inicializamos todas las variables esperadas por main.ejs
    res.render('main', { 
        title: 'Tienda Principal', 
        searchQuery: '',        // Se inicializa para evitar el ReferenceError
        message: null,          // Se inicializa a null (o '') para el alert
        productos: []           // Se inicializa como un array vacío para evitar errores en el forEach
    });
});
// ------------------------------------------------------------------
// INICIO DEL SERVIDOR
// ------------------------------------------------------------------

testConnection(); 

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});