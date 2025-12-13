// Importa y carga las variables de entorno desde el archivo .env
import 'dotenv/config'; 

// Importa el módulo mysql2 con soporte para Promesas
import mysql from 'mysql2/promise';

// Configuración de la conexión usando las variables de entorno
const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true, 
    connectionLimit: 10,      
    queueLimit: 0,
    // Aseguramos que la clave secreta JWT esté disponible aquí si es necesario, aunque generalmente va en server/controller
    secret_key: process.env.JWT_SECRET || 'clave_secreta_default_y_temporal'
};

// Crea el Pool de Conexiones
const pool = mysql.createPool(config);

/**
 * Función que prueba la conexión a la base de datos.
 */
export async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión exitosa a la base de datos:', process.env.DB_NAME);
        connection.release(); // Libera la conexión
    } catch (error) {
        console.error('❌ Error al conectar a la base de datos. Verifica tu archivo .env y el servicio MySQL:', error.message);
    }
}

// Exporta el pool de conexiones para usarlo en los modelos
export { pool };

// Ejecuta la prueba de conexión al iniciar para verificar el estado
testConnection();