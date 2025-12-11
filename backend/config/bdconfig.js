// Importa y carga las variables de entorno desde el archivo .env
import 'dotenv/config'; 
import mysql from 'mysql2/promise';


const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true, 
    connectionLimit: 10,      
    queueLimit: 0            
};


const pool = mysql.createPool(config);


export async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión exitosa a la base de datos:', process.env.DB_NAME);
        connection.release(); // Libera la conexión
    } catch (error) {
        console.error('❌ Error al conectar a la base de datos. Verifica tu archivo .env y el servicio MySQL:', error.message);
    }
}


export { pool };

testConnection();