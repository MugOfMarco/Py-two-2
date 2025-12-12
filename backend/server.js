import express from 'express';
import path from 'path'; 
import { fileURLToPath } from 'url';

// 1. CÓDIGO EXISTENTE: Importar dbconfig y rutas de usuario
import { testConnection } from './config/dbconfig.js'; 
import userRoutes from './routes/userroutes.js'; 

const app = express();

// Obtener __dirname (directorio base) de forma compatible con Módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

// 2. CÓDIGO EXISTENTE: Middleware
app.use(express.json()); // Para parsear peticiones con cuerpo JSON
app.use(express.urlencoded({ extended: true })); // Para parsear peticiones de formularios

// CÓDIGO EXISTENTE: Configurar EJS y Vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'Frontend', 'views')); 

// CÓDIGO EXISTENTE: Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, '..', 'Frontend', 'public')));

// ------------------------------------------------------------------
// RUTAS PRINCIPALES DE LA APLICACIÓN
// ------------------------------------------------------------------

// CÓDIGO EXISTENTE: Ruta de prueba inicial
app.get('/', (req, res) => {
    res.render('index', { titulo: 'API CRUD Carrito' }); 
});

// 3. NUEVO CÓDIGO: Usar las rutas de usuario
app.use('/api/usuarios', userRoutes); 

// ------------------------------------------------------------------
// INICIO DEL SERVIDOR
// ------------------------------------------------------------------

// CÓDIGO EXISTENTE: Test de conexión
testConnection(); 

app.listen(PORT, () => {
    console.log(`🚀 Servidor en modo MÓDULO corriendo en http://localhost:${PORT}`);
    console.log(`Usando base de datos: ${process.env.DB_NAME}`);
});