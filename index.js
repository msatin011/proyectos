console.log('INICIANDO SERVICIO PROYECTOS');
require('dotenv').config();
const https = require('https');
const httpProxy = require('http-proxy');
const fs = require('fs');
const path = require('path');

const certPath = path.join(__dirname, 'localhost.pfx');

if (!fs.existsSync(certPath)) {
    console.error('❌ ERROR: No se encontró localhost.pfx');
    process.exit(1);
}

const sslOptions = {
    pfx: fs.readFileSync(certPath),
    passphrase: 'miPassword123'
};

const TARGET_PORT = process.env.PORT || 3000;


const proxy = httpProxy.createProxyServer({
    target: `http://localhost:${TARGET_PORT}`,
    secure: false
});

const server = https.createServer(sslOptions, (req, res) => {
    if (req.url === '/proyectos' || req.url === '/proyectos/') {
        req.url = '/index.html';
        proxy.web(req, res);
    } else if (req.url.startsWith('/proyectos')) {
        req.url = req.url.replace(/^\/proyectos/, '');
        proxy.web(req, res);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

proxy.on('error', (err, req, res) => {
    console.error('Error en el proxy:', err);
    if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Proxy Error');
    }
});


server.listen(PORT, () => {
    console.log(`✅ Proxy HTTPS corriendo en puerto ${SYSTEMPORT}`);
    console.log(`🔒 Accede a: https://localhost:${SYSTEMPORT}/proyectos`);
});