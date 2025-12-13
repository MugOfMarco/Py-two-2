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

// 1. Ruta de Inicio (La raíz ahora carga la página de LOGIN)
app.get('/', (req, res) => {
    // Usa res.render SIN extensión (.ejs) y SIN barra inicial (/)
    res.render('login'); 
});

// 2. Ruta de Login (Si alguien navega directamente a /login)
app.get('/login', (req, res) => {
    res.render('login');
});

// 3. Ruta de Registro
app.get('/registro', (req, res) => {
    // Busca el archivo 'registro.ejs' en la carpeta views
    res.render('registro'); 
});

app.get('/main', (req, res) => {
    // Carga la vista 'main.ejs'
    res.render('main');
});
// ------------------------------------------------------------------
// INICIO DEL SERVIDOR
// ------------------------------------------------------------------

testConnection(); 

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});