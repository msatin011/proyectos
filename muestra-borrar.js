const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();
const axios = require('axios'); // Importar axios

const authRoutes = require('./routes/auth');
const clientesRoutes = require('./routes/clientes');
const productosRoutes = require('./routes/productos'); // Importar nueva ruta
const { verifyToken } = require('./middleware/authenticateToken'); // CORREGIDO: Ruta y desestructuración correctas
const condicionesPagoRoutes = require('./routes/condicionespago'); // Importar ruta de condiciones de pago
const pedidosRoutes = require('./routes/pedidos'); // Importar ruta de pedidos

const app = express();
const PORT = process.env.PORT || 711;

// Middleware de seguridad
app.use(helmet({
    contentSecurityPolicy: false, // Deshabilitado para PWA
    crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors({
    origin: ['https://pedidos.bipoint.com.ar', 'http://localhost:711'],
    credentials: true
}));

// Compression middleware - comprime respuestas HTTP con gzip
app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
}));

// Body parser con límites aumentados
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos con cache (desde raíz del proyecto)
app.use(express.static(__dirname, {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
    etag: true,
    lastModified: true,
    index: 'index.html'
}));

// Rutas de API
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/productos', productosRoutes); // Usar nueva ruta
app.use('/api/condiciones-pago', condicionesPagoRoutes);
app.use('/api/pedidos', pedidosRoutes); // Usar ruta de pedidos

// Endpoint de stock integrado directamente aquí
app.get('/api/stock', async (req, res) => {
    const { codigo } = req.query;
    console.log(`(Proxy) Recibida petición de stock para el código: ${codigo || 'No especificado'}`);

    try {
        const stockServiceUrl = `http://127.0.0.1:712/stock`;
        const responseFromStockService = await axios.get(stockServiceUrl, {
            params: { codigo }
        });
        res.status(200).json(responseFromStockService.data);
    } catch (error) {
        console.error('Error al contactar el servicio de stock interno:', error.message);
        // 4. Si el servicio en el puerto 712 no responde o da un error,
        //    devolvemos un error 502 (Bad Gateway) para indicar que el fallo fue en la comunicación interna.
        res.status(502).json({
            message: 'El servicio interno de stock no está disponible.'
        });
    }
});

app.get('/api/precio', async (req, res) => {
    const { codigo } = req.query;
    console.log(`(Proxy) Recibida petición de precio para el código: ${codigo || 'No especificado'}`);

    try {
        const precioServiceUrl = `http://127.0.0.1:712/precio`;
        const responseFromPrecioService = await axios.get(precioServiceUrl, {
            params: { codigo }
        });
        res.status(200).json(responseFromPrecioService.data);
    } catch (error) {
        console.error('Error al contactar el servicio de precio interno:', error.message);
        // 4. Si el servicio en el puerto 712 no responde o da un error,
        //    devolvemos un error 502 (Bad Gateway) para indicar que el fallo fue en la comunicación interna.
        res.status(502).json({
            message: 'El servicio interno de precio no está disponible.'
        });
    }
});

// Ruta raíz - servir index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
    });
});

// Iniciar servidor HTTP (IIS manejará HTTPS)
const server = app.listen(PORT, 'localhost', () => {
    console.log('═══════════════════════════════════════════════');
    console.log('  🚀 Servidor HTTP iniciado');
    console.log('  📍 Puerto:', PORT);
    console.log('  🌐 Escuchando en: http://localhost:' + PORT);
    console.log('  💻 Cores disponibles:', require('os').cpus().length);
    console.log('  🔧 Modo:', process.env.NODE_ENV || 'development');
    console.log('  ℹ️  IIS manejará HTTPS en puerto 443');
    console.log('  📅 Fecha:', new Date().toLocaleString('es-AR'));
    console.log('═══════════════════════════════════════════════');

    // Señal para PM2
    if (process.send) {
        process.send('ready');
    }
});

// Configurar timeouts
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

module.exports = app;
