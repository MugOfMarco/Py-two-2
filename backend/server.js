import express from 'express';
import path from 'path'; 
import { fileURLToPath } from 'url';

// --- Importaciones del Subsistema ---
import { testConnection } from './config/dbconfig.js'; 
import userRoutes from './routers/userroutes.js'; 

const app = express();

// Configuración de __dirname para Módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

// ------------------------------------------------------------------
// MIDDLEWARES GLOBALES
// ------------------------------------------------------------------

app.use(express.json()); // Para peticiones con cuerpo JSON
app.use(express.urlencoded({ extended: true })); // Para peticiones de formularios

// Configuración de EJS y Vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'frontend', 'views')); 

// Servir archivos estáticos (CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));

// ------------------------------------------------------------------
// MONTAJE DE RUTAS
// ------------------------------------------------------------------

// Rutas de la API de Usuarios (Login/Registro)
app.use('/api/usuarios', userRoutes); 

// === Redirección a Login como página de inicio ===
app.get('/', (req, res) => {
    res.render('login.ejs'); 
});

// ------------------------------------------------------------------
// INICIO DEL SERVIDOR
// ------------------------------------------------------------------

// Prueba de conexión a la base de datos (usando dbconfig.js)
testConnection(); 

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});