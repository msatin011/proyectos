const express = require('express');
const sql = require('mssql');
require('dotenv').config();
var job = [];
const app = express();
app.use(express.json());
const path = require('path');
const { getAhora, sumaMS, sumaHMS, restaHMS, restaDias, } = require(path.join(__dirname, 'funciones_node.js'));

const PORT = process.env.CRONPORT || 912;
const LOOP1_DELAY = parseInt(process.env.CRONLOOP1) || 5000;
const LOOP2_DELAY = parseInt(process.env.CRONLOOP2) || 60000;
const LOOP3_DELAY = parseInt(process.env.CRONLOOP3) || 3600000;

// Configuración de la base de datos
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_CERT === 'true'
    }
};

let pool;

async function connectDB() {
    try {
        pool = await sql.connect(dbConfig);
        console.log('✅ Cron Server: Conectado a SQL Server');
    } catch (err) {
        console.error('❌ Cron Server: Error al conectar con SQL Server:', err);
    }
}

// --- Funciones de Tarea ---

async function revisarMensajes() {
    console.log(`[${new Date().toLocaleTimeString()}] Ejecutando revisarMensajes...`);
    // TODO: Implementar lógica de revisión de mensajes
}

async function revisarJobs() {
    console.log(`[${new Date().toLocaleTimeString()}] Ejecutando revisarJobs...`);
    // TODO: Implementar lógica de revisión de jobs
}

async function refreshData() {
    console.log(`[${new Date().toLocaleTimeString()}] Ejecutando refreshData...`);
    // TODO: Implementar lógica de refresco de datos
}

// --- Loops ---

async function startLoop1() {
    try {
        await revisarMensajes();
    } catch (e) {
        console.error('Error en Loop 1 (revisarMensajes):', e);
    } finally {
        setTimeout(startLoop1, LOOP1_DELAY);
    }
}

async function startLoop2() {
    try {
        await revisarJobs();
    } catch (e) {
        console.error('Error en Loop 2 (revisarJobs):', e);
    } finally {
        setTimeout(startLoop2, LOOP2_DELAY);
    }
}

async function startLoop3() {
    try {
        await refreshData();
    } catch (e) {
        console.error('Error en Loop 3 (refreshData):', e);
    } finally {
        setTimeout(startLoop3, LOOP3_DELAY);
    }
}

// --- API Endpoints ---

app.get('/api1/refreshData', async (req, res) => {
    try {
        console.log('🔄 Request manual: refreshData invocado via API');
        await refreshData();
        res.json({ message: 'refreshData ejecutado correctamente' });
    } catch (error) {
        console.error('Error invocando refreshData via API:', error);
        res.status(500).json({ message: 'Error al ejecutar refreshData' });
    }
});

// --- Inicialización ---

async function main() {
    await connectDB();

    // Iniciar loops
    startLoop1();
    startLoop2();
    startLoop3();

    app.listen(PORT, () => {
        console.log(`🚀 Cron Server corriendo en el puerto ${PORT}`);
        console.log(`⏱️ Loop 1 (revisarMensajes): ${LOOP1_DELAY}ms`);
        console.log(`⏱️ Loop 2 (revisarJobs): ${LOOP2_DELAY}ms`);
        console.log(`⏱️ Loop 3 (refreshData): ${LOOP3_DELAY}ms`);
    });
}

main();


async function revisarMensajes() {
    console.log('ahora()  ' + getAhora());
    console.log('12  ' + getAhora(12));
    console.log('14  ' + getAhora(14))
    //await espera10Segundos()
}


function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Función que usa delay para esperar 10 segundos
async function espera10Segundos() {
    console.log('Esperando 10 segundos...');
    await delay(10000); // 10,000 milisegundos = 10 segundos
    console.log('Han pasado 10 segundos');
}