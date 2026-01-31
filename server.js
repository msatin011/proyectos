console.log('INICIANDO SERVICIO PROYECTOS');
const express = require('express');
const sql = require('mssql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Cargar variables de entorno
const ExcelJS = require('exceljs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const upload = multer({ storage: multer.memoryStorage() });

const publicVapidKey = process.env.PUBLIC_VAPID_KEY ? process.env.PUBLIC_VAPID_KEY.trim() : null;
const privateVapidKey = process.env.PRIVATE_VAPID_KEY ? process.env.PRIVATE_VAPID_KEY.trim() : null;
var LOGSERVER = process.env.LOGSERVER;
const PORT = process.env.PORT;
const JWT_SECRET = process.env.JWT_SECRET || 'este-es-un-secreto-muy-largo-y-dificil-de-adivinar-para-produccion-2025';


const chatImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const uploadPath = path.join(__dirname, 'uploads', 'chat', today);

        // Crear carpeta si no existe
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'chat-' + uniqueSuffix + ext);
    }
});

const chatImageFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes (JPEG, PNG, GIF, WEBP)'), false);
    }
};

const uploadChatImage = multer({
    storage: chatImageStorage,
    fileFilter: chatImageFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB máximo
});

// Configuración de multer para fotos de usuario (PWA)
const userPhotoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads', 'fotousuarios');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const { usuarioID, subusuarioID } = req.user;
        const ext = path.extname(file.originalname) || '.jpg';
        cb(null, `${usuarioID}-${subusuarioID}-foto${ext}`);
    }
});

const uploadUserPhoto = multer({
    storage: userPhotoStorage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});
const axios = require('axios');
const webPush = require('web-push');


if (!publicVapidKey || !privateVapidKey) {
    console.warn('⚠️ ADVERTENCIA: No se encontraron las claves VAPID en el archivo .env. Las notificaciones Web Push no funcionarán.');
} else {
    webPush.setVapidDetails(
        'mailto:tu@email.com',
        publicVapidKey,
        privateVapidKey
    );
}


// --- Helper para enviar notificaciones web push ---
async function sendWebPushNotification(usuarioID, subusuarioID, messageData) {
    console.log(`📨 [DEBUG] sendWebPushNotification iniciado para ${usuarioID}-${subusuarioID}`);
    try {
        const pool = app.locals.db;
        if (!pool) {
            console.error('❌ [DEBUG] No hay conexión a DB');
            return;
        }

        // Obtener suscripción del usuario
        const result = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .input('subusuarioID', sql.Int, subusuarioID)
            .query(`SELECT param, valor 
                    FROM usuario_data 
                    WHERE usuarioID = @usuarioID 
                    AND subusuarioID = @subusuarioID 
                    AND param IN ('endpoint', 'key', 'auth')`);

        console.log(`🔍 [DEBUG] Suscripción encontrada (filas): ${result.recordset.length}`);

        if (result.recordset.length < 3) {
            log(`? No se encontró suscripción completa para usuario ${usuarioID}-${subusuarioID}`);
            console.log('⚠️ [DEBUG] Faltan parámetros (endpoint, key, auth)');
            return;
        }

        const endpoint = result.recordset.find(r => r.param === 'endpoint')?.valor;
        const p256dh = result.recordset.find(r => r.param === 'key')?.valor;
        const auth = result.recordset.find(r => r.param === 'auth')?.valor;

        if (!endpoint || !p256dh || !auth) {
            log(`⚠️ Datos de suscripción incompletos para usuario ${usuarioID}-${subusuarioID}`);
            return;
        }

        const subscription = {
            endpoint: endpoint,
            keys: { p256dh, auth }
        };

        const payload = JSON.stringify(messageData);

        console.log(`🚀 [DEBUG] Enviando payload a webPush... Título: "${messageData.title}"`);
        await webPush.sendNotification(subscription, payload);
        log(`? Notificación Web Push enviada a ${usuarioID}-${subusuarioID}`);
        console.log(`✅ [DEBUG] Notificación enviada con éxito`);

    } catch (error) {
        logError(`? Error enviando Web Push a ${usuarioID}-${subusuarioID}:`, error);
        console.error(`❌ [DEBUG] Error en webPush.sendNotification:`, error);
    }
}

const { getAhora } = require('./funciones_node.js');
const app = express();

// Endpoint para obtener la clave pública VAPID
app.get('/api/vapid-public-key', (req, res) => {
    if (!process.env.PUBLIC_VAPID_KEY) {
        return res.status(500).json({ error: 'VAPID keys not configured on server' });
    }
    res.json({ publicKey: process.env.PUBLIC_VAPID_KEY });
});

// Endpoint para obtener URL de la APP (QR)
app.get('/api/config/urlapp', (req, res) => {
    const url = process.env.URLAPP || '';
    res.json({ url });
});
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Hacer io global para que emitLog pueda acceder
global.io = io;

// Manejar errores no capturados para evitar crash silencioso
process.on('uncaughtException', (err) => {
    logError('? CRASH DETECTED (Uncaught Exception):', err);
});
process.on('unhandledRejection', (reason, promise) => {
    logError('? CRASH DETECTED (Unhandled Rejection) at:', promise, 'reason:', reason);
});


// --- Buffer de logs en memoria ---
const logHistory = [];
const MAX_LOG_HISTORY = 200;

function emitLog(type, args) {
    const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    const logEntry = {
        timestamp: new Date().toISOString(),
        type,
        message
    };

    logHistory.push(logEntry);
    if (logHistory.length > MAX_LOG_HISTORY) logHistory.shift();

    // Emitir a todos los clientes conectados (solo admin verá)
    if (global.io) {
        global.io.emit('server_log', logEntry);
    }
}

// --- Funciones de logging condicional ---
const log = (...args) => {
    if (LOGSERVER === 'true') {
        console.log(...args);
        emitLog('log', args);
    }
};

const logError = (...args) => {
    if (LOGSERVER === 'true') {
        console.error(...args);
        emitLog('error', args);
    }
};

const logWarn = (...args) => {
    if (LOGSERVER === 'true') {
        console.warn(...args);
        emitLog('warn', args);
    }
};

app.use(express.json()); // Para parsear body de requests como JSON

// --- ESTRATEGIA DE CACHÉ: Desactivar caché para asegurar que el usuario vea cambios recientes ---
app.use((req, res, next) => {
    // Aplicar a archivos web (HTML, JS, CSS)
    if (req.method === 'GET' && req.url.match(/\.(html|js|css)$/)) {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        res.set('Surrogate-Control', 'no-store');
    }
    next();
});

// Servir archivos estáticos del directorio raíz (si no se estaba haciendo explícitamente antes, esto asegura que se sirvan)
// Nota: Si ya existía uno abajo, este tomará precedencia pero con los headers de arriba aplicados.
app.use(express.static(path.join(__dirname, '')));


// --- Configuración de la base de datos desde entorno ---
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

// --- Conexión persistente a la base de datos ---
sql.connect(dbConfig).then(pool => {
    log('? Conectado a SQL Server');
    // Hacemos el pool de conexiones accesible para todas las rutas
    app.locals.db = pool;
}).catch(err => {
    logError('? Error al conectar con SQL Server:', err);
});

// --- Middleware de depuración ---
// Endpoint de salud para verificar estado del servidor
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', uptime: process.uptime() });
});


// --- Función de Log General ---
async function logGeneral(usuarioID, subusuarioID, actividad, ipCliente) {
    try {
        const pool = app.locals.db;
        if (!pool) return;
        const cuando = getAhora(14);
        await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .input('subusuarioID', sql.Int, subusuarioID)
            .input('cuando', sql.Char(14), cuando)
            .input('actividad', sql.VarChar(255), actividad)
            .input('ip', sql.VarChar(50), ipCliente)
            .query('INSERT INTO log_general (usuarioID, subusuarioID, cuando, actividad, ip) VALUES (@usuarioID, @subusuarioID, @cuando, @actividad, @ip)'); // Corregido aquí
    } catch (err) {
        logError('Error en logGeneral:', err);
    }
}
// --- Middleware de Autenticación JWT ---
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) return res.sendStatus(401); // No hay token

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Token no es válido
        req.user = user;
        next();
    });
}

// --- Middleware de Autenticación para Socket.io ---
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error("Autenticación fallida: Token no proporcionado."));
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return next(new Error("Autenticación fallida: Token inválido."));
        }
        socket.user = user; // Guardamos los datos del usuario en la instancia del socket
        next();
    });
});

// --- Mapa de Sesiones Activas (Sesión Única por Usuario) ---
// Key: "usuarioID-subusuarioID" -> Value: socketId
const activeSessions = new Map();

// --- Lógica de Socket.io ---
io.on('connection', (socket) => {
    const usuarioID = socket.user.usuarioID;
    const subusuarioID = socket.user.subusuarioID;
    const nombre = socket.user.nombre;

    const source = socket.handshake.query.source || 'unknown'; // 'web' or 'celular'

    log(`?? Usuario conectado via Socket.io: ${nombre} (uID: ${usuarioID}, subID: ${subusuarioID}) Source: ${source}`);

    // Unir al usuario a una sala privada basada en su usuarioID y subusuarioID
    // Esto permite enviar mensajes directos a un usuario específico
    const userRoom = `user_${usuarioID}_${subusuarioID}`;
    socket.join(userRoom);
    log(`? Usuario ${nombre} unido a sala privada: ${userRoom}`);

    // También unir a una sala general del grupo (todos los subusuarios de un mismo usuarioID)
    socket.join(`group_${usuarioID}`);
    log(`🏠 Usuario ${nombre} unido a sala de grupo: group_${usuarioID}`);

    // --- Verificar y cerrar sesiones duplicadas ---
    // Key sin source: Solo 1 sesión por usuario, sea web o celular
    const sessionKey = `${usuarioID}-${subusuarioID}`;
    console.log(`🔍 [DEBUG SESSION] New Connection: ${sessionKey} (Socket: ${socket.id}, Source: ${source})`);
    console.log(`🔍 [DEBUG SESSION] Active Sessions Keys:`, [...activeSessions.keys()]);

    const existingSession = activeSessions.get(sessionKey);

    if (existingSession && existingSession.socketId !== socket.id) {
        // Buscar el socket antiguo
        const oldSocket = io.sockets.sockets.get(existingSession.socketId);
        if (oldSocket) {
            log(`⚠️ Sesión duplicada detectada para ${nombre}. Cerrando sesión anterior (Socket: ${existingSession.socketId}).`);

            // Emitir evento de sesión expulsada al socket antiguo
            oldSocket.emit('session_kicked', {
                message: 'Abrió sesión en otro dispositivo'
            });

            log(`📤 Evento session_kicked enviado a Socket: ${existingSession.socketId}`);

            // Desconectar el socket antiguo después de 3 segundos (para que el toast se muestre)
            setTimeout(() => {
                oldSocket.disconnect(true);
                log(`🔌 Socket antiguo desconectado: ${existingSession.socketId}`);
            }, 3000);
        }
        // Registrar la nueva sesión inmediatamente
        activeSessions.set(sessionKey, { socketId: socket.id, source: source });
        log(`✅ Sesión registrada (reemplazó anterior): ${sessionKey} -> ${socket.id} (${source})`);
    } else {
        // No hay sesión duplicada, registrar normalmente
        activeSessions.set(sessionKey, { socketId: socket.id, source: source });
        log(`✅ Sesión registrada (primera conexión): ${sessionKey} -> ${socket.id} (${source})`);
    }

    // Manejar envío de mensajes (Soporte Room y Directo)
    socket.on('mensaje_chat', (data) => {
        // data llega como { salaID: "...", texto: "...", tipo: "imagen", imagen: "..." } desde layout.js

        const roomId = data.salaID || data.chatRoomID;
        const texto = data.texto || data.message;

        if (roomId) {
            const payload = {
                de: nombre,
                deID: usuarioID,
                deSubID: subusuarioID,
                texto: texto,
                chatRoomID: roomId,
                timestamp: new Date()
            };

            // Si es una imagen, agregar campos adicionales
            if (data.tipo === 'imagen') {
                payload.tipo = 'imagen';
                payload.imagen = data.imagen; // Base64 o URL
            }

            // Emitir evento que layout.js espera: 'nuevo_mensaje_sala'
            io.to(roomId).emit('nuevo_mensaje_sala', payload);
        }
    });

    // Test inmediato de conexión
    socket.emit('welcome_test', { msg: 'Bienvenido al servidor de sockets' });

    // Emitir cambio de estado a todos (Usuario Conectado)
    io.emit('user_status_change', { usuarioID, subusuarioID, online: true });

    socket.on('disconnect', () => {
        log(`🔌 Usuario desconectado: ${nombre}`);

        // Limpiar del mapa de sesiones activas (key sin source)
        const sessionKey = `${usuarioID}-${subusuarioID}`;
        const session = activeSessions.get(sessionKey);

        if (session && session.socketId === socket.id) {
            activeSessions.delete(sessionKey);
            log(`🗑️ Sesión eliminada del registro: ${sessionKey}`);
        }

        io.emit('user_status_change', { usuarioID, subusuarioID, online: false });
    });

    // Manejar invitación de chat (Nueva lógica grupal)
    socket.on('invite_users', async (data) => {
        log('?? SOCKET EVENT: invite_users', data);
        console.time('invite_users_timer');
        try {
            const { targetUsuarioIDs, existingChatRoomID } = data; // Array of { usuarioID, subusuarioID }

            if (!targetUsuarioIDs || !Array.isArray(targetUsuarioIDs)) {
                logError('? invite_users: targetUsuarioIDs inválido', targetUsuarioIDs);
                return;
            }

            // Generar ID de sala si no existe
            const chatRoomID = existingChatRoomID || `room_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}`;

            log(`?? Procesando invitación de ${nombre} a ${targetUsuarioIDs.length} usuarios. Room: ${chatRoomID}`);

            // El creador se une automáticamente a la sala
            socket.join(chatRoomID);
            log(`? Creador (Socket ${socket.id}) unido a room: ${chatRoomID}`);

            // Notificar al creador que el chat se inició (para abrir ventana)
            // Filtramos targetUsuarioIDs para asegurar consistencia, asumiendo que ya traen nombre si el cliente lo manda
            // Si el cliente no manda nombres, el frontend mostrará undefined. Corregiremos frontend también.
            socket.emit('chat_iniciado', {
                salaID: chatRoomID,
                miembros: targetUsuarioIDs
            });

            // Result tracking
            const results = [];
            const connectedSockets = Array.from(io.sockets.sockets.values()); // Get all sockets once

            // Process each target with a timeout race to prevent hanging
            const processTarget = async (target) => {
                const userPrivateRoom = `user_${target.usuarioID}_${target.subusuarioID}`;
                let isUserConnected = false;
                let socketIds = [];

                // 1. Check if ANY socket is already in the room
                const roomData = io.sockets.adapter.rooms.get(userPrivateRoom);
                if (roomData && roomData.size > 0) {
                    isUserConnected = true;
                    socketIds = Array.from(roomData);
                }

                // 2. Fallback: Search manually if not found effectively
                if (!isUserConnected) {
                    // Try to find a socket that MATCHES
                    const foundSocket = connectedSockets.find(s =>
                        s.user &&
                        s.user.usuarioID == target.usuarioID &&
                        s.user.subusuarioID == target.subusuarioID
                    );

                    if (foundSocket) {
                        try {
                            // Force join synchronously (fastest)
                            foundSocket.join(userPrivateRoom);
                            isUserConnected = true;
                            socketIds.push(foundSocket.id);
                            log(`?? REPAIRED: ${userPrivateRoom}`);
                        } catch (e) {
                            logError('Error joining socket:', e);
                        }
                    }
                }

                // 3. Send Invite logic (Non-blocking emit)
                if (isUserConnected) {
                    io.to(userPrivateRoom).emit('new_message', {
                        type: 'InvitacionChat',
                        data: {
                            salaID: chatRoomID,
                            solicitante: nombre,
                            solicitanteID: usuarioID, // Useful for debug
                            solicitanteSubID: subusuarioID
                        }
                    });

                    // Simple debug emit
                    io.to(userPrivateRoom).emit('debug_invite', { msg: 'DEBUG OK' });
                }

                return {
                    target,
                    connected: isUserConnected,
                    room: userPrivateRoom
                };
            };

            // Ejecutar todos en paralelo
            const promises = targetUsuarioIDs.map(t => processTarget(t));
            const processedResults = await Promise.all(promises);
            results.push(...processedResults);

            // Notify sender of delivery details
            socket.emit('invite_delivery_report', { results });
            console.timeEnd('invite_users_timer');
        } catch (error) {
            logError('? CRITICAL ERROR invite_users:', error);
            socket.emit('invite_error', { message: 'Server error processing invite' });
        }
    });



    // Manejar aceptación de chat
    socket.on('accept_invite', (data) => {
        log('?? SOCKET EVENT: accept_invite', data);
        // data llega como { salaID: '...' } desde layout.js
        const chatRoomID = data.chatRoomID || data.salaID;

        if (chatRoomID) {
            socket.join(chatRoomID);
            log(`? Usuario ${nombre} se unió a la sala ${chatRoomID}`);

            // Notificar a la sala que alguien se unió
            io.to(chatRoomID).emit('chat_accepted', {
                nombre: nombre,
                usuarioID: usuarioID,
                subusuarioID: subusuarioID,
                chatRoomID: chatRoomID
            });
        }
    });

    // Typing Indicators
    socket.on('typing', (data) => {
        if (data.salaID) {
            socket.to(data.salaID).emit('typing', {
                usuarioID: usuarioID,
                subusuarioID: subusuarioID,
                nombre: nombre,
                salaID: data.salaID
            });
        }
    });

    socket.on('stop_typing', (data) => {
        if (data.salaID) {
            socket.to(data.salaID).emit('stop_typing', {
                usuarioID: usuarioID,
                subusuarioID: subusuarioID,
                salaID: data.salaID
            });
        }
    });

});


// GET: Obtener destinatarios (usuarios/colaboradores)
app.get('/api/mensajeria/destinatarios', authenticateToken, async (req, res) => {
    try {
        const pool = req.app.locals.db;
        const usuarioID = req.user.usuarioID;
        const subusuarioID = req.user.subusuarioID;

        let query = '';
        if (usuarioID === 0) {
            // Admin Global: Ve todos
            query = 'SELECT usuarioID, subusuarioID, nombre, u FROM usuario WHERE activohasta >= CAST(CONVERT(VARCHAR(8), GETDATE(), 112) AS INT) ORDER BY nombre';
        } else {
            // Usuario normal: Ve solo los subusuarios de su cuenta
            query = 'SELECT usuarioID, subusuarioID, nombre, u FROM usuario WHERE usuarioID = @usuarioID AND activohasta >= CAST(CONVERT(VARCHAR(8), GETDATE(), 112) AS INT) ORDER BY nombre';
        }

        const result = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .query(query);

        res.json(result.recordset);
    } catch (err) {
        logError('Error al obtener destinatarios:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// POST: Guardar mensajes programados


// GET: Obtener menú para el usuario logueado (filtrado por rol)
app.get('/api/menu', authenticateToken, async (req, res) => {
    try {
        const pool = req.app.locals.db;
        const { usuarioID, rol } = req.user;

        let result;
        const orderByClause = `
            ORDER BY
            CAST(SUBSTRING(nivel, 1, CHARINDEX('.', nivel + '.') - 1) AS INT),
            CAST(CASE WHEN CHARINDEX('.', nivel) > 0 
                THEN SUBSTRING(nivel, CHARINDEX('.', nivel) + 1,
                     CHARINDEX('.', nivel + '.', CHARINDEX('.', nivel) + 1) - CHARINDEX('.', nivel) - 1)
                ELSE '0' END AS INT),
            CAST(CASE WHEN LEN(nivel) - LEN(REPLACE(nivel, '.', '')) >= 2
                THEN SUBSTRING(nivel,
                     CHARINDEX('.', nivel, CHARINDEX('.', nivel) + 1) + 1,
                     CHARINDEX('.', nivel + '.', CHARINDEX('.', nivel, CHARINDEX('.', nivel) + 1) + 1) -
                     CHARINDEX('.', nivel, CHARINDEX('.', nivel) + 1) - 1)
                ELSE '0' END AS INT)`;

        if (usuarioID === 1 || (usuarioID != 1 && rol == 1)) {
            // Admin (usuarioID = 1): Obtener todos los menús
            result = await pool.request()
                .query(`SELECT menuID, menu, nivel, programa, icono, prgAdmin, cartel, 1 as write FROM menu ${orderByClause}`);
        } else {
            // Usuario normal: Obtener menús asignados a su rol
            result = await pool.request()
                .input('usuarioID', sql.Int, usuarioID)
                .input('rolID', sql.Int, rol)
                .query(`SELECT m.menuID, m.menu, m.nivel, m.programa, m.icono, m.prgAdmin, m.cartel, rm.write 
                        FROM menu m
                        INNER JOIN rol_menu rm ON m.menuID = rm.menuID
                        WHERE rm.usuarioID = @usuarioID AND rm.rolID = @rolID
                        ${orderByClause}`);
        }

        res.json(result.recordset);
    } catch (err) {
        logError('Error al obtener menú:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.get('/api/mensajeria/pendientescel', authenticateToken, async (req, res) => {
    try {
        const pool = req.app.locals.db;
        const aID = req.user.usuarioID;
        const aSubId = req.user.subusuarioID;

        const result = await pool.request()
            .input('aID', sql.Int, aID)
            .input('aSubId', sql.Int, aSubId)
            .query(`SELECT m.*, u.nombre as deNombre ,m.destino
                    FROM mensaje m
                    LEFT JOIN usuario u ON m.deID = u.usuarioID AND m.deSubId = u.subusuarioID
                    WHERE m.aID = @aID AND m.leido = 0 and destino='celular' 
                    ORDER BY m.cuando ASC`);

        res.json(result.recordset);
    } catch (err) {
        logError('Error al obtener mensajes pendientes:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});


// PUT: Marcar mensajes como leídos
app.put('/api/mensajeria/marcar-leidos', authenticateToken, async (req, res) => {
    try {
        const { mensajeIDs } = req.body;
        const aID = req.user.usuarioID;
        const aSubId = req.user.subusuarioID;

        if (!mensajeIDs || !Array.isArray(mensajeIDs) || mensajeIDs.length === 0) {
            return res.status(400).json({ message: 'Se requiere una lista de mensajeIDs.' });
        }

        const pool = req.app.locals.db;

        // Usamos un bucle para actualizar cada mensaje y asegurar que pertenezca al usuario
        for (const id of mensajeIDs) {
            await pool.request()
                .input('id', sql.Int, id)
                .input('aID', sql.Int, aID)
                .input('aSubId', sql.Int, aSubId)
                .query('UPDATE mensaje SET leido = 1 WHERE mensajeID = @id AND aID = @aID AND aSubId = @aSubId');
        }

        res.json({ message: 'Mensajes marcados como leídos.' });
    } catch (err) {
        logError('Error al marcar mensajes como leídos:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});


// --- Rutas de la API ---



// Endpoint para loguear acceso a pantallas
app.post('/api/log/screen', authenticateToken, async (req, res) => {
    try {
        const { actividad } = req.body;
        const { usuarioID, subusuarioID } = req.user;

        if (!actividad) return res.status(400).json({ message: 'Actividad requerida' });

        await logGeneral(usuarioID, subusuarioID, actividad, req.connection.remoteAddress);
        res.sendStatus(200);
    } catch (err) {
        logError('Error logueando pantalla:', err);
        res.status(500).send();
    }
});

// --- Endpoints para Feriados (ABM) ---

// Obtener todos los feriados
app.get('/api/feriados', authenticateToken, async (req, res) => {
    try {
        const usuarioID = req.user.usuarioID;
        const pool = req.app.locals.db;
        const result = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .query('SELECT feriadoID FROM feriado WHERE usuarioID = @usuarioID ORDER BY feriadoID DESC');
        res.json(result.recordset);
    } catch (error) { // Changed 'err' to 'error' to match the provided snippet
        logError('Error al obtener usuarios conectados:', error); // This line is from the snippet, assuming it's the connected-users endpoint
        res.status(500).json({ message: 'Error al obtener usuarios conectados.' }); // This line is from the snippet
    }
});

// Endpoint para sacar un usuario del sistema (Admin)
app.post('/api/admin/kick-user', authenticateToken, (req, res) => {
    // Validar permisos (solo usuarioID=1)
    if (req.user.usuarioID !== 1) {
        return res.status(403).json({ message: 'No autorizado. Solo administrador principal.' });
    }

    const { usuarioID, subusuarioID } = req.body;

    if (!usuarioID || subusuarioID === undefined) {
        return res.status(400).json({ message: 'usuarioID y subusuarioID son requeridos.' });
    }

    try {
        const userRoom = `user_${usuarioID}_${subusuarioID}`;

        // Emitir evento admin_kick al usuario target
        io.to(userRoom).emit('admin_kick', {
            message: 'El administrador lo sacó del sistema. Se cerrará en 15 segundos.',
            countdown: 15
        });

        log(`👮 Admin kick enviado a usuario ${usuarioID}-${subusuarioID} (room: ${userRoom})`);

        res.json({
            success: true,
            message: `Orden de expulsión enviada a usuario ${usuarioID}-${subusuarioID}`
        });
    } catch (error) {
        logError('Error al sacar usuario:', error);
        res.status(500).json({ message: 'Error al procesar la solicitud.' });
    }
});

// Endpoint para enviar mensaje a un usuario (Admin)
app.post('/api/admin/send-message', authenticateToken, async (req, res) => {
    // Validar permisos (solo usuarioID=1)
    if (req.user.usuarioID !== 1) {
        return res.status(403).json({ message: 'No autorizado. Solo administrador principal.' });
    }

    const { usuarioID, subusuarioID, mensaje } = req.body;

    if (!usuarioID || subusuarioID === undefined || !mensaje) {
        return res.status(400).json({ message: 'Faltan datos requeridos.' });
    }

    try {
        const pool = app.locals.db;
        const cuando = getAhora(14);
        const titulo = 'Mensaje del Administrador';
        await pool.request()
            .input('deID', sql.Int, req.user.usuarioID)
            .input('deSubID', sql.Int, req.user.subusuarioID)
            .input('aID', sql.Int, usuarioID)
            .input('aSubId', sql.Int, subusuarioID)
            .input('cuando', sql.Char(14), cuando)
            .input('titulo', sql.VarChar(40), titulo)
            .input('mensaje', sql.VarChar(500), mensaje)
            .input('leido', sql.Bit, 0)
            .query(`
                INSERT INTO mensaje (deID, deSubID, aID, aSubId, cuando, titulo, mensaje, leido)
                VALUES (@deID, @deSubID, @aID, @aSubId, @cuando, @titulo, @mensaje, @leido)
            `);

        // Intentar enviar en tiempo real si el usuario está conectado
        const userRoom = `user_${usuarioID}_${subusuarioID}`;
        io.to(userRoom).emit('new_message', {
            type: 'mensajepantalla',
            text: mensaje
        });

        log(`📧 Mensaje enviado de admin a usuario ${usuarioID}-${subusuarioID}`);

        res.json({
            success: true,
            message: 'Mensaje enviado correctamente'
        });
    } catch (error) {
        logError('Error al enviar mensaje:', error);
        res.status(500).json({ message: 'Error al procesar la solicitud.' });
    }
});

// Endpoint para toggle logging (Admin)
app.post('/api/admin/toggle-logging', authenticateToken, (req, res) => {
    if (req.user.usuarioID !== 1) {
        return res.status(403).json({ message: 'No autorizado. Solo administrador principal.' });
    }

    const { enabled } = req.body;
    LOGSERVER = enabled ? 'true' : 'false';

    log(`📝 Logging ${enabled ? 'activado' : 'desactivado'} por admin`);

    res.json({ success: true, enabled: LOGSERVER === 'true' });
});

// Endpoint para obtener logs (Admin)
app.get('/api/admin/logs', authenticateToken, (req, res) => {
    if (req.user.usuarioID !== 1) {
        return res.status(403).json({ message: 'No autorizado. Solo administrador principal.' });
    }

    res.json(logHistory);
});

// Endpoint para obtener estado actual de logging (Admin)
app.get('/api/admin/logging-status', authenticateToken, (req, res) => {
    if (req.user.usuarioID !== 1) {
        return res.status(403).json({ message: 'No autorizado. Solo administrador principal.' });
    }

    res.json({ enabled: LOGSERVER === 'true' });
});


// Agregar un feriado
// Recibe { fecha: 'YYYY-MM-DD' } y lo guarda como AAAAMMDD (int)
app.post('/api/feriados', authenticateToken, async (req, res) => {
    try {
        const { fecha } = req.body;
        if (!fecha) return res.status(400).json({ message: 'La fecha es obligatoria.' });

        const usuarioID = req.user.usuarioID;
        const dateInt = parseInt(fecha.replace(/-/g, ''));

        const pool = req.app.locals.db;

        // Verificar si ya existe PARA ESTE USUARIO
        const check = await pool.request()
            .input('feriadoID', sql.Int, dateInt)
            .input('usuarioID', sql.Int, usuarioID)
            .query('SELECT 1 FROM feriado WHERE feriadoID = @feriadoID AND usuarioID = @usuarioID');

        if (check.recordset.length > 0) {
            return res.status(409).json({ message: 'El feriado ya existe para este usuario.' });
        }

        await pool.request()
            .input('feriadoID', sql.Int, dateInt)
            .input('usuarioID', sql.Int, usuarioID)
            .query('INSERT INTO feriado (feriadoID, usuarioID) VALUES (@feriadoID, @usuarioID)');

        res.json({ message: 'Feriado agregado correctamente.', feriadoID: dateInt });
    } catch (err) {
        logError('Error al agregar feriado:', err);
        res.status(500).json({ message: 'Error interno al guardar feriado.' });
    }
});




// Endpoint para obtener permisos de un usuario para un menú específico (protegido)
app.get('/api/permissions/:menuID/:usuarioID', authenticateToken, async (req, res) => {
    try {
        const { menuID } = req.params;
        let rolID = req.user.rol;
        const usuarioID = req.user.usuarioID;

        // rol0 tiene todos los permisos sin restricciones
        if (rolID === 0) {
            log(`Admin (rol 0) detectado. Otorgando todos los permisos.`);
            return res.json({
                canAdd: true,
                canEdit: true,
                canDelete: true,
                canSMS: true
            });
        }

        // Si el rol no es 0 y es nulo/indefinido, asignar un rol por defecto (ej. el más restrictivo)
        if (rolID == null) { // '==' catches both null and undefined
            rolID = 5; // Rol por defecto para usuarios sin rol asignado
        }

        log(`Verificando permisos para menuID = ${menuID}, rolID = ${rolID}, usuarioID = ${usuarioID}`);

        // Para otros roles, verificar en la tabla autori
        const pool = req.app.locals.db;
        const result = await pool.request()
            .input('menuID', sql.Int, menuID)
            .input('rolID', sql.Int, rolID)
            .input('usuarioID', sql.Int, usuarioID)
            .query('SELECT * FROM autori WHERE usuarioID = @usuarioID AND menuID = @menuID AND rolID = @rolID');

        // Si existe el registro, tiene permisos
        const hasPermission = result.recordset.length > 0;

        res.json({
            canAdd: hasPermission,
            canEdit: hasPermission,
            canDelete: hasPermission,
            canSMS: hasPermission
        });
    } catch (err) {
        logError('Error al obtener permisos:', err);
        // En caso de error, denegar permisos por seguridad
        res.json({
            canAdd: false,
            canEdit: false,
            canDelete: false,
            canSMS: false
        });
    }
});

// Endpoint para obtener usuarios con sus roles asignados (solo para rolID=0)
app.get('/api/usuarios-roles', authenticateToken, async (req, res) => {
    try {
        const { usuarioID, rol } = req.user;

        const pool = req.app.locals.db;
        const result = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .query(`SELECT u.usuarioID, u.subusuarioID, u.nombre, ru.rolID
                    FROM usuario u
                    LEFT JOIN rol_usuario ru ON u.usuarioID = ru.usuarioID AND u.subusuarioID = ru.subusuarioID
                    WHERE u.usuarioID = @usuarioID AND u.subusuarioID > 0
                    ORDER BY u.nombre`);

        res.json({ usuarios: result.recordset });
    } catch (err) {
        logError('Error al obtener usuarios y roles:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Endpoint para asignar/remover rol a un usuario (solo para rolID=0)
app.put('/api/usuarios-roles/:usuarioID/:subusuarioID', authenticateToken, async (req, res) => {
    try {
        const { rol } = req.user;
        const { usuarioID, subusuarioID } = req.params;
        const { rolID } = req.body;

        // Validar que el usuario pertenece al mismo usuarioID
        if (parseInt(usuarioID) !== req.user.usuarioID) {
            return res.status(403).json({ message: 'No puede modificar roles de otros usuarios.' });
        }

        const pool = req.app.locals.db;

        if (rolID === null || rolID === undefined) {
            // Eliminar rol
            await pool.request()
                .input('usuarioID', sql.Int, usuarioID)
                .input('subusuarioID', sql.Int, subusuarioID)
                .query('DELETE FROM rol_usuario WHERE usuarioID = @usuarioID AND subusuarioID = @subusuarioID');

            res.json({ message: 'Rol eliminado correctamente.' });
        } else {
            // Validar rolID (1-5)
            if (rolID < 1 || rolID > 5) {
                return res.status(400).json({ message: 'El rolID debe estar entre 1 y 5.' });
            }

            // Verificar si ya existe un registro
            const checkResult = await pool.request()
                .input('usuarioID', sql.Int, usuarioID)
                .input('subusuarioID', sql.Int, subusuarioID)
                .query('SELECT * FROM rol_usuario WHERE usuarioID = @usuarioID AND subusuarioID = @subusuarioID');

            if (checkResult.recordset.length > 0) {
                // Actualizar
                await pool.request()
                    .input('usuarioID', sql.Int, usuarioID)
                    .input('subusuarioID', sql.Int, subusuarioID)
                    .input('rolID', sql.Int, rolID)
                    .query('UPDATE rol_usuario SET rolID = @rolID WHERE usuarioID = @usuarioID AND subusuarioID = @subusuarioID');
            } else {
                // Insertar
                await pool.request()
                    .input('usuarioID', sql.Int, usuarioID)
                    .input('subusuarioID', sql.Int, subusuarioID)
                    .input('rolID', sql.Int, rolID)
                    .query('INSERT INTO rol_usuario (usuarioID, subusuarioID, rolID) VALUES (@usuarioID, @subusuarioID, @rolID)');
            }

            res.json({ message: 'Rol asignado correctamente.', rolID });
        }
    } catch (err) {
        logError('Error al asignar/remover rol:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Función para notificar mensajes pendientes via WebSocket
async function enviarMsgPendientes() {
    log('🔔 Ejecutando enviarMsgPendientes()...');
    try {
        const pool = app.locals.db;
        if (!pool) {
            logError('❌ Error: No hay conexión a la BD en app.locals.db');
            return;
        }

        const ahora = getAhora(12);
        log(`🕒 Hora actual servidor: ${ahora}`);

        // 1. Mensajes WEB y CELULAR pendientes
        const result = await pool.request()
            .input('ahora', sql.Char(12), ahora)
            .query("SELECT DISTINCT aID, aSubId, destino FROM mensaje WHERE leido = 0 AND cuando <= @ahora AND destino IN ('web', 'celular')");

        const destinatarios = result.recordset;

        if (destinatarios.length > 0) {
            log(`🔔 Procesando ${destinatarios.length} mensajes pendientes...`);

            // Obtener sockets conectados una sola vez
            const connectedSockets = Array.from(io.sockets.sockets.values());

            for (const dest of destinatarios) {
                // Lógica WEB: Emitir evento siempre (si está conectado lo recibe)
                if (dest.destino === 'web') {
                    const room = `user_${dest.aID}_${dest.aSubId}`;
                    io.to(room).emit('new_message', { type: 'mensajepantalla', text: '' });
                    // log(`🔔 Notificación web emitida a sala: ${room}`);
                }

                // Lógica CELULAR: Chequear si está ONLINE, si no -> PUSH
                if (dest.destino === 'celular') {
                    // Verificar si está conectado (Web o App)
                    const isOnline = connectedSockets.some(s =>
                        s.user && s.user.usuarioID == dest.aID && s.user.subusuarioID == dest.aSubId
                    );

                    if (!isOnline) {
                        log(`📱 Usuario ${dest.aID}-${dest.aSubId} OFFLINE. Intentando Web Push...`);
                        await sendWebPushNotification(dest.aID, dest.aSubId, {
                            title: 'Nuevo Mensaje',
                            body: 'Tienes un nuevo mensaje pendiente en la app.',
                            url: '/?view=messages'
                        });
                    } else {
                        log(`📱 Usuario ${dest.aID}-${dest.aSubId} ONLINE. No se envía Push.`);
                    }
                }
            }
        }
    } catch (error) {
        logError('❌ Error en enviarMsgPendientes:', error);
    }
}

// Endpoint para obtener información de soporte técnico (protegido)
app.get('/api/support-info', authenticateToken, async (req, res) => {
    try {
        const { usuarioID } = req.user;
        const pool = req.app.locals.db;

        let supportEmail = null;
        let supportPhone = null;

        // Primero, intentar obtener de usuario_data para el usuario logueado
        const userDataResult = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .query(`SELECT param, valor 
                    FROM usuario_data 
                    WHERE usuarioID = @usuarioID 
                    AND param IN('mail soporte', 'celular soporte')`);

        // Mapear los resultados de usuario_data
        userDataResult.recordset.forEach(row => {
            if (row.param === 'mail soporte' && row.valor) {
                supportEmail = row.valor;
            } else if (row.param === 'celular soporte' && row.valor) {
                supportPhone = row.valor;
            }
        });

        // Si no se encontró en usuario_data, buscar en usuario_ayuda para subusuarioID = 0
        if (!supportEmail || !supportPhone) {
            const ayudaResult = await pool.request()
                .query(`SELECT mail, celular 
                        FROM usuario_ayuda 
                        WHERE subusuarioID = 0`);

            if (ayudaResult.recordset.length > 0) {
                const ayuda = ayudaResult.recordset[0];
                if (!supportEmail && ayuda.mail) {
                    supportEmail = ayuda.mail;
                }
                if (!supportPhone && ayuda.celular) {
                    supportPhone = ayuda.celular;
                }
            }
        }

        res.json({
            email: supportEmail || 'soporte@tuempresa.com',
            phone: supportPhone || '+54 11 1234-5678'
        });

    } catch (err) {
        logError('Error al obtener información de soporte:', err);
        // En caso de error, devolver valores por defecto
        res.json({
            email: 'soporte@tuempresa.com',
            phone: '+54 11 1234-5678'
        });
    }
});

// Endpoint para obtener clientes (protegido)
// --- Provincias Endpoints ---
app.get('/api/provincias', authenticateToken, async (req, res) => {
    try {
        const pool = req.app.locals.db;
        const result = await pool.request().query('SELECT provinciaID, provincia as nombre FROM provincia ORDER BY provincia');
        res.json(result.recordset);
    } catch (error) {
        console.error('Error al obtener provincias:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});
// Clientes
app.get('/api/clientes', authenticateToken, async (req, res) => {
    try {
        const usuarioID = req.user.usuarioID;
        const pool = req.app.locals.db;
        const result = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .query(`
                SELECT c.*, 
                       p.provincia as provinciaNombre, 
                       c.codigopostal as codigoPostal,
                       (SELECT COUNT(*) FROM contacto_cliente WHERE contacto_cliente.clienteID = c.clienteID) as contactosCount
                FROM cliente c 
                LEFT JOIN provincia p ON c.provinciaID = p.provinciaID 
                WHERE c.usuarioID = @usuarioID
            `);
        res.json(result.recordset);
    } catch (err) {
        logError('Error al obtener clientes:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Endpoint para exportar clientes a Excel (protegido)
app.get('/api/exportar-clientes', authenticateToken, async (req, res) => {
    try {
        const usuarioID = req.user.usuarioID;
        const nombreUsuario = req.user.nombre;
        const pool = req.app.locals.db;

        // Obtener datos de clientes con el nombre de la provincia
        const result = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .query(`SELECT
        c.nombre,
            c.cuit,
            c.activo,
            c.direccion,
            c.localidad,
            p.provincia as provinciaNombre,
            c.codigoPostal,
            c.telefono,
            c.tipo 
                    FROM cliente c 
                    LEFT JOIN provincia p ON c.provinciaID = p.provinciaID 
                    WHERE c.usuarioID = @usuarioID`);

        const clientes = result.recordset;

        // Crear libro y hoja de cálculo
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Clientes');

        // Definir columnas
        worksheet.columns = [
            { header: 'Nombre', key: 'nombre', width: 30 },
            { header: 'CUIT', key: 'cuit', width: 15 },
            { header: 'Activo', key: 'activo', width: 10 },
            { header: 'Dirección', key: 'direccion', width: 40 },
            { header: 'Localidad', key: 'localidad', width: 20 },
            { header: 'Provincia', key: 'provinciaNombre', width: 20 },
            { header: 'Código Postal', key: 'codigoPostal', width: 15 },
            { header: 'Teléfono', key: 'telefono', width: 15 },
            { header: 'Tipo', key: 'tipo', width: 15 }
        ];

        // Estilar encabezados
        worksheet.getRow(1).font = { bold: true };

        // Agregar filas
        clientes.forEach(cliente => {
            worksheet.addRow({
                ...cliente,
                activo: cliente.activo ? 'Sí' : 'No' // Formatear booleano
            });
        });

        // Configurar respuesta para descarga
        const filename = `${nombreUsuario} clientes.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename = "${filename}"`);

        // Escribir el libro en la respuesta
        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        logError('Error al exportar clientes:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Endpoint para importar clientes desde Excel (protegido)
app.post('/api/importar-clientes', authenticateToken, upload.single('archivo'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No se subió ningún archivo.' });
    }

    const pool = req.app.locals.db;
    const usuarioID = req.user.usuarioID;

    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);
        const worksheet = workbook.getWorksheet(1); // Tomar la primera hoja

        const clientesAImportar = [];
        const errores = [];

        // Obtener provincias para mapeo de nombres a IDs
        const provinciasResult = await pool.request().query('SELECT provinciaID, provincia FROM provincia');
        const provinciasMap = {};
        provinciasResult.recordset.forEach(p => {
            provinciasMap[p.provincia.toLowerCase().trim()] = p.provinciaID;
        });

        // Iterar filas (empezando desde la 2)
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Saltar encabezado

            const nombre = row.getCell(1).text?.trim(); // Nombre
            const cuit = row.getCell(2).text?.trim();   // CUIT
            const activoRaw = row.getCell(3).text?.trim().toLowerCase(); // Activo
            const tipo = row.getCell(4).text?.trim();   // Tipo
            const localidad = row.getCell(5).text?.trim(); // Localidad
            const provinciaNombre = row.getCell(6).text?.trim(); // Provincia

            // Validaciones básicas
            if (!nombre || !cuit) {
                errores.push(`Fila ${rowNumber}: Nombre y CUIT son obligatorios.`);
                return;
            }

            // Validar CUIT (11 dígitos, numérico)
            if (!/^\d{11}$/.test(cuit)) {
                errores.push(`Fila ${rowNumber}: El CUIT "${cuit}" debe ser numérico y tener 11 dígitos.`);
                return;
            }

            // Mapear Activo
            const activo = (activoRaw === 'sí' || activoRaw === 'si' || activoRaw === 'true' || activoRaw === '1') ? 1 : 0;

            // Mapear ProvinciaID
            let provinciaID = null;
            if (provinciaNombre) {
                provinciaID = provinciasMap[provinciaNombre.toLowerCase().trim()];
                if (!provinciaID) {
                    errores.push(`Fila ${rowNumber}: La provincia "${provinciaNombre}" no es válida.`);
                    return;
                }
            } else {
                errores.push(`Fila ${rowNumber}: La provincia es obligatoria.`);
                return;
            }

            clientesAImportar.push({
                nombre,
                cuit,
                activo,
                tipo: tipo || 'Unipersonal',
                localidad: localidad || '',
                provinciaID,
                usuarioID,
                direccion: '', // Opcionales en el prompt del modal
                codigoPostal: '',
                telefono: ''
            });
        });

        if (clientesAImportar.length === 0 && errores.length === 0) {
            return res.status(400).json({ message: 'El archivo está vacío o no tiene datos válidos.' });
        }

        // Insertar en la base de datos (uno por uno o batch)
        let procesados = 0;
        for (const cliente of clientesAImportar) {
            try {
                // Verificar si ya existe el cliente para este usuario/cuit
                const checkExist = await pool.request()
                    .input('usuarioID', sql.Int, usuarioID)
                    .input('cuit', sql.VarChar(11), cliente.cuit)
                    .query('SELECT clienteID FROM cliente WHERE usuarioID = @usuarioID AND cuit = @cuit');

                if (checkExist.recordset.length > 0) {
                    // Actualizar
                    await pool.request()
                        .input('clienteID', sql.Int, checkExist.recordset[0].clienteID)
                        .input('usuarioID', sql.Int, usuarioID)
                        .input('nombre', sql.VarChar(100), cliente.nombre)
                        .input('activo', sql.Bit, cliente.activo)
                        .input('tipo', sql.VarChar(50), cliente.tipo)
                        .input('localidad', sql.VarChar(100), cliente.localidad)
                        .input('provinciaID', sql.Int, cliente.provinciaID)
                        .input('direccion', sql.VarChar(200), cliente.direccion)
                        .input('codigopostal', sql.VarChar(12), cliente.codigoPostal)
                        .input('telefono', sql.VarChar(100), cliente.telefono)
                        .query(`UPDATE cliente SET
        nombre = @nombre,
            activo = @activo,
            tipo = @tipo,
            localidad = @localidad,
            provinciaID = @provinciaID,
            direccion = ISNULL(NULLIF(@direccion, ''), direccion),
            codigopostal = ISNULL(NULLIF(@codigopostal, ''), codigopostal),
            telefono = ISNULL(NULLIF(@telefono, ''), telefono)
                                WHERE clienteID = @clienteID AND usuarioID = @usuarioID`);
                } else {
                    // Insertar con nuevo clienteID
                    const maxIdResult = await pool.request()
                        .input('usuarioID', sql.Int, usuarioID)
                        .query('SELECT ISNULL(MAX(clienteID), 0) + 1 as nextID FROM cliente WHERE usuarioID = @usuarioID');

                    const nextID = maxIdResult.recordset[0].nextID;

                    await pool.request()
                        .input('clienteID', sql.Int, nextID)
                        .input('usuarioID', sql.Int, usuarioID)
                        .input('nombre', sql.VarChar(100), cliente.nombre)
                        .input('cuit', sql.VarChar(11), cliente.cuit)
                        .input('activo', sql.Bit, cliente.activo)
                        .input('tipo', sql.VarChar(50), cliente.tipo)
                        .input('localidad', sql.VarChar(100), cliente.localidad)
                        .input('provinciaID', sql.Int, cliente.provinciaID)
                        .input('direccion', sql.VarChar(200), cliente.direccion)
                        .input('codigopostal', sql.VarChar(12), cliente.codigoPostal)
                        .input('telefono', sql.VarChar(100), cliente.telefono)
                        .query(`INSERT INTO cliente(clienteID, usuarioID, nombre, cuit, activo, tipo, localidad, provinciaID, direccion, codigopostal, telefono)
        VALUES(@clienteID, @usuarioID, @nombre, @cuit, @activo, @tipo, @localidad, @provinciaID, @direccion, @codigopostal, @telefono)`);
                }
                procesados++;
            } catch (dbErr) {
                logError('Error procesando cliente en importación:', dbErr);
                errores.push(`Error al procesar cliente ${cliente.nombre}: ${dbErr.message} `);
            }
        }

        res.json({
            message: `Importación finalizada.Procesados: ${procesados}.`,
            success: true,
            errors: errores.length > 0 ? errores : null
        });

    } catch (err) {
        logError('Error al importar clientes:', err);
        res.status(500).json({ message: 'Error interno al procesar el archivo.' });
    }
});

// Endpoint para obtener todas las provincias (protegido)
app.get('/api/provincias', authenticateToken, async (req, res) => {
    try {
        const pool = req.app.locals.db;
        const result = await pool.request().query('SELECT provinciaID, provincia FROM provincia ORDER BY provincia');
        res.json(result.recordset);
    } catch (err) {
        logError('Error al obtener provincias:', err);
    }
});

// Endpoint para crear un nuevo cliente (protegido)
app.post('/api/clientes', authenticateToken, async (req, res) => {
    const pool = req.app.locals.db;
    const transaction = new sql.Transaction(pool);

    try {
        const { nombre, cuit, activo, tipo, localidad, provinciaID, direccion, codigoPostal, telefono } = req.body;
        const usuarioID = req.user.usuarioID;

        if (!nombre || !cuit) {
            return res.status(400).json({ message: 'Los campos Nombre y CUIT son obligatorios.' });
        }

        const cleanCuit = cuit.replace(/\D/g, '');

        // Check for duplicate CUIT
        const duplicateCheck = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .input('cuit', sql.VarChar(11), cleanCuit)
            .query('SELECT 1 FROM cliente WHERE usuarioID = @usuarioID AND cuit = @cuit');

        if (duplicateCheck.recordset.length > 0) {
            return res.status(409).json({ message: 'Ya existe un cliente con ese CUIT.' });
        }

        await transaction.begin();

        const maxIdResult = await new sql.Request(transaction)
            .input('usuarioID', sql.Int, usuarioID)
            .query('SELECT MAX(clienteID) as maxID FROM cliente WHERE usuarioID = @usuarioID');

        const newClienteID = (maxIdResult.recordset[0].maxID || 0) + 1;

        const result = await new sql.Request(transaction)
            .input('usuarioID', sql.Int, usuarioID)
            .input('clienteID', sql.Int, newClienteID)
            .input('nombre', sql.VarChar(100), nombre)
            .input('cuit', sql.VarChar(11), cleanCuit)
            .input('activo', sql.Bit, activo ? 1 : 0)
            .input('tipo', sql.VarChar(50), tipo || null)
            .input('localidad', sql.VarChar(100), localidad || null)
            .input('provinciaID', sql.Int, (provinciaID && provinciaID !== '') ? provinciaID : null)
            .input('direccion', sql.VarChar(80), direccion || null)
            .input('codigopostal', sql.VarChar(12), codigoPostal || null)
            .input('telefono', sql.VarChar(100), telefono || null)
            .query(`INSERT INTO cliente(usuarioID, clienteID, nombre, cuit, activo, tipo, localidad, provinciaID, direccion, codigopostal, telefono) 
                    OUTPUT inserted.*
            VALUES(@usuarioID, @clienteID, @nombre, @cuit, @activo, @tipo, @localidad, @provinciaID, @direccion, @codigopostal, @telefono)`);

        await transaction.commit();
        const clientObj = result.recordset[0];
        clientObj.codigoPostal = clientObj.codigopostal; // Map for frontend
        res.status(201).json(clientObj);
    } catch (err) {
        if (transaction._beginCalled && !transaction._aborted) await transaction.rollback();
        logError('Error al crear el cliente:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Endpoint para modificar un cliente existente (protegido)
app.put('/api/clientes/:clienteID', authenticateToken, async (req, res) => {
    const { clienteID } = req.params;
    const usuarioID = req.user.usuarioID;
    const { nombre, cuit, activo, tipo, localidad, provinciaID, direccion, codigoPostal, telefono } = req.body;

    if (!nombre || !cuit) {
        return res.status(400).json({ message: 'Los campos Nombre y CUIT son obligatorios.' });
    }

    try {
        const cleanCuit = cuit.replace(/\D/g, '');
        const pool = req.app.locals.db;

        // Check for duplicate CUIT (excluding current client)
        const duplicateCheck = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .input('cuit', sql.VarChar(11), cleanCuit)
            .input('clienteID', sql.Int, clienteID)
            .query('SELECT 1 FROM cliente WHERE usuarioID = @usuarioID AND cuit = @cuit AND clienteID != @clienteID');

        if (duplicateCheck.recordset.length > 0) {
            return res.status(409).json({ message: 'Ya existe otro cliente con ese CUIT.' });
        }

        const result = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .input('clienteID', sql.Int, clienteID)
            .input('nombre', sql.VarChar(100), nombre)
            .input('cuit', sql.VarChar(11), cleanCuit)
            .input('activo', sql.Bit, activo ? 1 : 0)
            .input('tipo', sql.VarChar(50), tipo || null)
            .input('localidad', sql.VarChar(100), localidad || null)
            .input('provinciaID', sql.Int, (provinciaID && provinciaID !== '') ? provinciaID : null)
            .input('direccion', sql.VarChar(80), direccion || null)
            .input('codigopostal', sql.VarChar(12), codigoPostal || null)
            .input('telefono', sql.VarChar(100), telefono || null)
            .query(`UPDATE cliente SET
        nombre = @nombre, cuit = @cuit, activo = @activo, tipo = @tipo, localidad = @localidad,
            provinciaID = @provinciaID, direccion = @direccion, codigopostal = @codigopostal, telefono = @telefono
                    OUTPUT inserted.*
            WHERE usuarioID = @usuarioID AND clienteID = @clienteID`);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Cliente no encontrado o no pertenece al usuario.' });
        }

        const clientObj = result.recordset[0];
        clientObj.codigoPostal = clientObj.codigopostal; // Map for frontend
        res.status(200).json(clientObj);
    } catch (err) {
        logError('Error al modificar el cliente:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Endpoint para eliminar un cliente (protegido)
app.delete('/api/clientes/:clienteID', authenticateToken, async (req, res) => {
    const { clienteID } = req.params;
    const usuarioID = req.user.usuarioID;

    try {
        const pool = req.app.locals.db;
        await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .input('clienteID', sql.Int, clienteID)
            .query('DELETE FROM cliente WHERE usuarioID = @usuarioID AND clienteID = @clienteID');
        res.status(204).send();
    } catch (err) {
        logError('Error al eliminar el cliente:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});





// Endpoint para obtener TODOS los menús (para admin)
app.get('/api/admin/menus', authenticateToken, async (req, res) => {
    try {
        if (req.user.rol !== 0) {
            return res.status(403).json({ message: 'No autorizado.' });
        }

        const pool = req.app.locals.db;
        // Misma lógica de ordenamiento que /api/menu pero sin filtrar por rol
        const usuarioID = req.user.usuarioID;

        // Construimos columnas dinámicas para rol1..rol5 según rol_menu y el usuarioID
        const query = `SELECT menuID, menu, nivel, programa, 
            (CASE WHEN EXISTS(SELECT 1 FROM rol_menu rm WHERE rm.menuID = menu.menuID AND rm.rolID = 1 AND rm.usuarioID = @usuarioID) THEN 1 ELSE 0 END) as rol1,
    (CASE WHEN EXISTS(SELECT 1 FROM rol_menu rm WHERE rm.menuID = menu.menuID AND rm.rolID = 2 AND rm.usuarioID = @usuarioID) THEN 1 ELSE 0 END) as rol2,
        (CASE WHEN EXISTS(SELECT 1 FROM rol_menu rm WHERE rm.menuID = menu.menuID AND rm.rolID = 3 AND rm.usuarioID = @usuarioID) THEN 1 ELSE 0 END) as rol3,
            (CASE WHEN EXISTS(SELECT 1 FROM rol_menu rm WHERE rm.menuID = menu.menuID AND rm.rolID = 4 AND rm.usuarioID = @usuarioID) THEN 1 ELSE 0 END) as rol4,
                (CASE WHEN EXISTS(SELECT 1 FROM rol_menu rm WHERE rm.menuID = menu.menuID AND rm.rolID = 5 AND rm.usuarioID = @usuarioID) THEN 1 ELSE 0 END) as rol5
                       FROM menu 
                       ORDER BY
CAST(SUBSTRING(nivel, 1, CHARINDEX('.', nivel + '.') - 1) AS INT),
    CAST(CASE WHEN CHARINDEX('.', nivel) > 0 
                                THEN SUBSTRING(nivel, CHARINDEX('.', nivel) + 1,
        CHARINDEX('.', nivel + '.', CHARINDEX('.', nivel) + 1) - CHARINDEX('.', nivel) - 1)
                                ELSE '0' END AS INT),
    CAST(CASE WHEN LEN(nivel) - LEN(REPLACE(nivel, '.', '')) >= 2
                                THEN SUBSTRING(nivel,
        CHARINDEX('.', nivel, CHARINDEX('.', nivel) + 1) + 1,
        CHARINDEX('.', nivel + '.', CHARINDEX('.', nivel, CHARINDEX('.', nivel) + 1) + 1) -
        CHARINDEX('.', nivel, CHARINDEX('.', nivel) + 1) - 1)
                                ELSE '0' END AS INT)`;

        const result = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .query(query);

        res.json(result.recordset);
    } catch (err) {
        logError('Error al obtener todos los menús:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Endpoint para asignar/remover rol a un menú
app.put('/api/menu-role', authenticateToken, async (req, res) => {
    try {
        if (req.user.rol !== 0) {
            return res.status(403).json({ message: 'No autorizado.' });
        }

        const { menuID, rolID, assign } = req.body; // assign: true/false
        const usuarioID = req.user.usuarioID;

        if (rolID < 1 || rolID > 5) {
            return res.status(400).json({ message: 'Rol inválido.' });
        }

        const pool = req.app.locals.db;

        // 1. Obtener el nivel del menú seleccionado para encontrar hijos
        const menuResult = await pool.request()
            .input('menuID', sql.Int, menuID)
            .query('SELECT nivel FROM menu WHERE menuID = @menuID');

        if (menuResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Menú no encontrado.' });
        }

        const nivel = menuResult.recordset[0].nivel;

        // 2. Actualizar el menú y sus hijos en rol_menu
        if (assign) {
            // INSERT (Evitar duplicados)
            await pool.request()
                .input('usuarioID', sql.Int, usuarioID)
                .input('rolID', sql.Int, rolID)
                .query(`INSERT INTO rol_menu (usuarioID, menuID, rolID) 
                        SELECT @usuarioID, menuID, @rolID 
                        FROM menu 
                        WHERE (nivel = '${nivel}' OR nivel LIKE '${nivel}.%')
                        AND NOT EXISTS (
                            SELECT 1 FROM rol_menu rm 
                            WHERE rm.menuID = menu.menuID AND rm.usuarioID = @usuarioID AND rm.rolID = @rolID
                        )`);
        } else {
            // DELETE
            await pool.request()
                .input('usuarioID', sql.Int, usuarioID)
                .input('rolID', sql.Int, rolID)
                .query(`DELETE FROM rol_menu 
                        WHERE usuarioID = @usuarioID AND rolID = @rolID
                        AND menuID IN (
                            SELECT menuID FROM menu 
                            WHERE nivel = '${nivel}' OR nivel LIKE '${nivel}.%'
                        )`);
        }

        res.json({ message: `Permisos actualizados para Rol ${rolID}.` });

    } catch (err) {
        logError('Error al actualizar rol-menú:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Endpoint público para obtener configuración del frontend
app.get('/api/config/public', (req, res) => {
    res.json({
        urlNotificacion: process.env.URLNOTIFICACION || 'https://bipoint.duckdns.org/notificaciones/',
        vapidPublicKey: process.env.PUBLIC_VAPID_KEY
    });
});


// Endpoint de Login
app.post('/api/login', async (req, res) => {
    const { cuit, u, password, isPwa } = req.body;

    if (!cuit || !u || !password) {
        return res.status(400).json({ message: 'CUIT, Usuario y Clave son requeridos.' });
    }

    // Limpiar el CUIT de la máscara
    const cleanCuit = cuit.replace(/\D/g, '');

    try {
        const pool = req.app.locals.db;
        const request = pool.request();

        // Buscar el usuario por CUIT
        log(`Login Attempt: CUIT=${cleanCuit}, User=${u}`);
        const result = await request
            .input('cuit', sql.VarChar(11), cleanCuit) // Asegúrate que el tipo de dato coincida con tu BD
            .input('u', sql.VarChar(50), u) // Asumiendo que 'u' es VarChar(50)
            .query("SELECT u.*, ru.rolID,FORMAT(GETDATE(), 'yyyyMMdd') as hoy FROM usuario u left join rol_usuario ru on ru.usuarioID=u.usuarioID and u.subusuarioID=ru.subusuarioID WHERE u.cuit = @cuit AND u.u = @u"); // Asumo que la tabla usuario tiene un campo 'rol'

        log('Login Query Result Count:', result.recordset.length);

        if (result.recordset.length === 0) {
            log('Login Failed: User not found in DB');
            await logGeneral(0, 0, `Login fallido : cuit: ${cleanCuit}, usuario: ${u} clave:${password}`, req.connection.remoteAddress);
            return res.status(404).json({ message: 'Error: Verifique los datos ingresados.' });
        }

        const user = result.recordset[0];
        log(`User Found: ID=${user.usuarioID}, SubID=${user.subusuarioID}, Hash=${user.password ? 'Present' : 'Missing'}`);

        // Comparar la clave enviada con el hash almacenado en la BD
        const isMatch = await bcrypt.compare(password, user.password);
        log('Password Match Result:', isMatch);

        if (!isMatch) {
            log('Login Failed: Password does not match');
            await logGeneral(0, 0, `Login fallido : cuit: ${cleanCuit}, usuario: ${u} clave:${password}`, req.connection.remoteAddress);
            return res.status(401).json({ message: 'Clave incorrecta.' });
        }

        // Login exitoso, verificar si el usuario está activo
        if (user.hoy > user.activoHasta) {
            const desde = user.activoHasta.toString().substring(6, 8) + '/' + user.activoHasta.toString().substring(4, 6) + '/' + user.activoHasta.toString().substring(0, 4);
            return res.status(401).json({ message: 'Usuario INACTIVO<br>Desde el ' + desde + '<br>Comunicarse con el administrador' });
        }

        // --- Generar el Token JWT ---
        const payload = {
            usuarioID: user.usuarioID,
            subusuarioID: user.subusuarioID,
            nombre: user.nombre,
            rol: user.rolID
            // Puedes agregar más datos como roles si los tuvieras
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); // El token expira en 1 hora

        // Obtener foto de perfil si existe
        const fotoResult = await pool.request()
            .input('usuarioID', sql.Int, user.usuarioID)
            .input('subusuarioID', sql.Int, user.subusuarioID)
            .query("SELECT valor FROM usuario_data WHERE usuarioID = @usuarioID AND subusuarioID = @subusuarioID AND param = 'foto'");

        const fotoUrl = fotoResult.recordset.length > 0 ? fotoResult.recordset[0].valor : null;

        res.status(200).json({
            message: 'Login exitoso.',
            user: {
                usuarioID: user.usuarioID,
                subusuarioID: user.subusuarioID,
                nombre: user.nombre,
                email: user.email,
                rol: user.rolID, // Devolver el rol del usuario
                foto: fotoUrl
            }
            , token // Enviar el token al cliente
        });
        const ip = await req.connection.remoteAddress;

        // Registrar login de PWA
        if (req.body.isPwa) {
            try {
                // Formato YYYY-MM-DD HH:MM:SS
                const fechaHora = new Date().toISOString().replace('T', ' ').substring(0, 19);
                const mergeQuery = `
                    MERGE INTO usuario_data AS target
                    USING (SELECT @usuarioID AS usuarioID, @subusuarioID AS subusuarioID, 'usuario app' AS param) AS source
                    ON (target.usuarioID = source.usuarioID AND target.subusuarioID = source.subusuarioID AND target.param = source.param)
                    WHEN MATCHED THEN
                        UPDATE SET valor = @valor
                    WHEN NOT MATCHED THEN
                        INSERT (usuarioID, subusuarioID, param, valor)
                        VALUES (@usuarioID, @subusuarioID, 'usuario app', @valor);
                `;
                await pool.request()
                    .input('usuarioID', sql.Int, user.usuarioID)
                    .input('subusuarioID', sql.Int, user.subusuarioID)
                    .input('valor', sql.VarChar(sql.MAX), fechaHora)
                    .query(mergeQuery);
            } catch (pwaErr) {
                logError('Error registrando login PWA:', pwaErr);
            }
        }

        await logGeneral(user.usuarioID, user.subusuarioID, 'login', ip);

    } catch (err) {
        logError('Error en el login:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Endpoint para Cambiar Clave (a desarrollar)
// Endpoint para Cambiar Clave
app.post('/api/change-password', async (req, res) => {
    const { cuit, u, oldPassword, newPassword } = req.body;

    if (!cuit || !u || !oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    const cleanCuit = cuit.replace(/\D/g, '');

    try {
        const pool = req.app.locals.db;
        const request = pool.request();

        // 1. Verificar usuario y obtener clave actual
        const result = await request
            .input('cuit', sql.VarChar(11), cleanCuit)
            .input('u', sql.VarChar(50), u)
            .query("SELECT * FROM usuario WHERE cuit = @cuit AND u = @u");

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const user = result.recordset[0];

        // 2. Verificar la clave anterior
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'La clave anterior es incorrecta.' });
        }

        // 3. Hashear la nueva clave
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 4. Actualizar en base de datos
        await pool.request()
            .input('p', sql.VarChar(255), hashedPassword)
            .input('id', sql.Int, user.usuarioID)
            .query("UPDATE usuario SET password = @p WHERE usuarioID = @id and u = '" + u + "'");

        res.status(200).json({ message: 'Clave actualizada correctamente.' });

    } catch (err) {
        logError('Error al cambiar clave:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// --- Endpoint Feriados ---
app.get('/api/feriados', authenticateToken, async (req, res) => {
    try {
        const pool = req.app.locals.db;
        const result = await pool.request()
            .query('SELECT feriadoID FROM feriado ORDER BY feriadoID DESC');
        res.json(result.recordset);
    } catch (err) {
        logError('Error al obtener feriados:', err);
        res.status(500).json({ message: 'Error interno.' });
    }
});

app.post('/api/feriados', authenticateToken, async (req, res) => {
    const { fecha } = req.body; // YYYY-MM-DD
    if (!fecha) return res.status(400).json({ message: 'Fecha requerida' });

    try {
        const parts = fecha.split('-');
        const feriadoID = parseInt(parts[0] + parts[1] + parts[2]); // YYYYMMDD

        const pool = req.app.locals.db;
        await pool.request()
            .input('id', sql.Int, feriadoID)
            .query('INSERT INTO feriado (feriadoID) VALUES (@id)');

        res.status(201).json({ message: 'Feriado agregado' });
    } catch (err) {
        logError('Error al crear feriado:', err);
        if (err.number === 2627) { // Violation of PRIMARY KEY constraint
            return res.status(409).json({ message: 'El feriado ya existe.' });
        }
        res.status(500).json({ message: 'Error interno.' });
    }
});

app.delete('/api/feriados/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const pool = req.app.locals.db;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM feriado WHERE feriadoID = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Feriado no encontrado' });
        }
        res.json({ message: 'Feriado eliminado' });
    } catch (err) {
        logError('Error al eliminar feriado:', err);
        res.status(500).json({ message: 'Error interno.' });
    }
});

// Endpoint para obtener Subusuarios (Colaboradores)
app.get('/api/subusuarios', authenticateToken, async (req, res) => {
    const usuarioID = req.user.usuarioID;

    try {
        const pool = req.app.locals.db;
        const result = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .query(`SELECT subusuarioID, nombre, u, celular, email, activoHasta,
                           CASE WHEN activoHasta >= FORMAT(GETDATE(), 'yyyyMMdd') THEN 1 ELSE 0 END as activo 
                    FROM usuario 
                    WHERE usuarioID = @usuarioID AND subusuarioID > 0`);

        // Convertir activo a boolean para que coincida con lo esperado por el frontend
        const colaboradores = result.recordset.map(c => ({
            ...c,
            activo: c.activo === 1
        }));

        res.json(colaboradores);
    } catch (err) {
        logError('Error al obtener subusuarios:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Endpoint para verificar disponibilidad de nombre de usuario en tiempo real
app.get('/api/check-username', authenticateToken, async (req, res) => {
    const { u, subID } = req.query;
    const { usuarioID } = req.user;

    if (!u) return res.status(400).json({ message: 'Parámetro u requerido' });

    try {
        const pool = req.app.locals.db;
        const request = pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .input('u', sql.VarChar(50), u);

        let query = 'SELECT 1 FROM usuario WHERE usuarioID = @usuarioID AND u = @u';

        if (subID) {
            query += ' AND subusuarioID <> @subID';
            request.input('subID', sql.Int, subID);
        }

        const result = await request.query(query);
        res.json({ exists: result.recordset.length > 0 });
    } catch (err) {
        logError('Error verificando usuario:', err);
        res.status(500).json({ message: 'Error interno' });
    }
});

// Endpoint para Alta de Subusuarios (Colaboradores)
app.post('/api/subusuarios', authenticateToken, async (req, res) => {
    const { nombre, u, celular, activohasta } = req.body;
    const { usuarioID, subusuarioID } = req.user;

    // Validar que sea el titular (subusuarioID == 0)
    // Se excluye validación para admin del sistema (id=1) según requerimiento, 
    // pero aquí asumimos que la lógica aplica a clientes normales.
    if (subusuarioID !== 0) {
        return res.status(403).json({ message: 'Solo el titular de la cuenta puede dar de alta colaboradores.' });
    }
    if (!nombre || !u || !celular) {
        return res.status(400).json({ message: 'Nombre, Usuario y Celular son obligatorios.' });
    }

    const pool = req.app.locals.db;
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // Validar duplicado de usuario (u)
        const checkDup = await new sql.Request(transaction)
            .input('usuarioID', sql.Int, usuarioID)
            .input('u', sql.VarChar(50), u)
            .query('SELECT 1 FROM usuario WHERE usuarioID = @usuarioID AND u = @u');

        if (checkDup.recordset.length > 0) {
            await transaction.rollback();
            return res.status(409).json({ message: 'El usuario para login debe ser unico, no puede repetirse' });
        }

        const emailCheck = req.body.email || '';

        // 1. Validar celular
        if (celular) {
            const checkCel = await new sql.Request(transaction)
                .input('usuarioID', sql.Int, usuarioID)
                .input('celular', sql.VarChar(50), celular)
                .query(`SELECT 1 FROM usuario 
                         WHERE usuarioID = @usuarioID 
                         AND celular = @celular`);

            if (checkCel.recordset.length > 0) {
                await transaction.rollback();
                return res.status(409).json({ message: 'Ese celular ya esta asociado a otro colaborador.' });
            }
        }

        // 2. Validar email (si no está vacío)
        if (emailCheck) {
            const checkEmail = await new sql.Request(transaction)
                .input('usuarioID', sql.Int, usuarioID)
                .input('email', sql.VarChar(100), emailCheck)
                .query(`SELECT 1 FROM usuario 
                         WHERE usuarioID = @usuarioID 
                         AND email = @email`);

            if (checkEmail.recordset.length > 0) {
                await transaction.rollback();
                return res.status(409).json({ message: 'Ese email ya esta asociado a otro colaborador.' });
            }
        }

        // 1. Obtener datos del titular para replicar (CUIT y Vencimiento)
        const titularResult = await new sql.Request(transaction)
            .input('usuarioID', sql.Int, usuarioID)
            .query('SELECT cuit, activoHasta FROM usuario WHERE usuarioID = @usuarioID AND subusuarioID = 0');

        if (titularResult.recordset.length === 0) {
            throw new Error('No se encontró el usuario titular.');
        }
        const { cuit, activoHasta: titularVence } = titularResult.recordset[0];
        const finalVence = activohasta || titularVence;

        // 2. Calcular siguiente subusuarioID
        const maxIdResult = await new sql.Request(transaction)
            .input('usuarioID', sql.Int, usuarioID)
            .query('SELECT ISNULL(MAX(subusuarioID), 0) + 1 as nextID FROM usuario WHERE usuarioID = @usuarioID');

        const nextSubID = maxIdResult.recordset[0].nextID;

        // 3. Insertar nuevo subusuario (Password y Email vacíos)
        await new sql.Request(transaction)
            .input('usuarioID', sql.Int, usuarioID)
            .input('subusuarioID', sql.Int, nextSubID)
            .input('nombre', sql.VarChar(100), nombre)
            .input('u', sql.VarChar(50), u)
            .input('celular', sql.VarChar(50), celular)
            .input('email', sql.VarChar(100), emailCheck)
            .input('cuit', sql.VarChar(11), cuit ? String(cuit) : cuit)
            .input('activoHasta', sql.VarChar(8), finalVence ? String(finalVence) : finalVence)
            .query(`INSERT INTO usuario (usuarioID, subusuarioID, nombre, u, password, email, celular, cuit, activoHasta) 
                    VALUES (@usuarioID, @subusuarioID, @nombre, @u, '', @email, @celular, @cuit, @activoHasta)`);

        // 4. Asignar rol por defecto (rolID = 5)
        // Primero limpiar cualquier registro huérfano previa reutilización de ID
        await new sql.Request(transaction)
            .input('usuarioID', sql.Int, usuarioID)
            .input('subusuarioID', sql.Int, nextSubID)
            .query('DELETE FROM rol_usuario WHERE usuarioID = @usuarioID AND subusuarioID = @subusuarioID');

        await new sql.Request(transaction)
            .input('usuarioID', sql.Int, usuarioID)
            .input('subusuarioID', sql.Int, nextSubID)
            .query('INSERT INTO rol_usuario (usuarioID, subusuarioID, rolID) VALUES (@usuarioID, @subusuarioID, 5)');

        await transaction.commit();



        res.status(201).json({ message: 'Colaborador creado exitosamente.', subusuarioID: nextSubID });

    } catch (err) {
        if (transaction._beginCalled && !transaction._aborted) await transaction.rollback();
        logError('Error al crear subusuario:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Endpoint para Modificar Subusuario
app.put('/api/subusuarios/:subID', authenticateToken, async (req, res) => {
    const { subID } = req.params;
    const { nombre, u, celular, email, password, activohasta } = req.body;
    const { usuarioID, subusuarioID } = req.user;

    if (subusuarioID !== 0) return res.status(403).json({ message: 'No autorizado.' });

    try {
        const pool = req.app.locals.db;

        // Validar duplicado de usuario (u) excluyendo el actual
        const checkDup = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .input('u', sql.VarChar(50), u)
            .input('subID', sql.Int, subID)
            .query('SELECT 1 FROM usuario WHERE usuarioID = @usuarioID AND u = @u AND subusuarioID <> @subID');

        if (checkDup.recordset.length > 0) {
            return res.status(409).json({ message: 'El usuario para login debe ser unico, no puede repetirse' });
        }

        // Validar unicidad de EMAIL y CELULAR (excluyendo el subusuario actual)
        const emailCheck = email || '';

        const checkDupDatos = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .input('subID', sql.Int, subID)
            .input('celular', sql.VarChar(50), celular)
            .input('email', sql.VarChar(100), emailCheck)
            .query(`SELECT 1 FROM usuario 
                    WHERE usuarioID = @usuarioID 
                    AND (celular = @celular OR (email = @email AND @email <> ''))
                    AND subusuarioID <> @subID`);

        if (checkDupDatos.recordset.length > 0) {
            return res.status(409).json({ message: 'El celular o email ya existen para otro colaborador.' });
        }

        let query = `UPDATE usuario SET nombre = @nombre, u = @u, celular = @celular, email = @email, activoHasta = @activoHasta`;

        const request = pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .input('subusuarioID', sql.Int, subID)
            .input('nombre', sql.VarChar(100), nombre)
            .input('u', sql.VarChar(50), u)
            .input('celular', sql.VarChar(50), celular)
            .input('email', sql.VarChar(100), email || '')
            .input('activoHasta', sql.VarChar(8), activohasta || '');

        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            request.input('password', sql.VarChar(255), hashedPassword);
            query += `, password = @password`;
        }

        query += ` WHERE usuarioID = @usuarioID AND subusuarioID = @subusuarioID`;

        await request.query(query);

        res.json({ message: 'Colaborador actualizado correctamente.' });
    } catch (err) {
        logError('Error al modificar subusuario:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Endpoint para Eliminar Subusuario
app.delete('/api/subusuarios/:subID', authenticateToken, async (req, res) => {
    const { subID } = req.params;
    const { usuarioID, subusuarioID } = req.user;

    if (subusuarioID !== 0) return res.status(403).json({ message: 'No autorizado.' });

    try {
        const pool = req.app.locals.db;
        await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .input('subusuarioID', sql.Int, subID)
            .query('DELETE FROM usuario WHERE usuarioID = @usuarioID AND subusuarioID = @subusuarioID');

        res.status(204).send();
    } catch (err) {
        logError('Error al eliminar subusuario:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Endpoint para enviar alerta push (usado cuando se detecta mensaje en web)
// Endpoint para enviar alerta push (usado cuando se detecta mensaje en web)
app.post('/api/notificaciones/send-push-alert', authenticateToken, async (req, res) => {
    console.log('🔔 [DEBUG] Endpoint /send-push-alert llamado por usuario:', req.user.usuarioID, req.user.subusuarioID);
    try {
        const usuarioID = req.user.usuarioID;
        // Obtenemos los destinos del body
        const { targets } = req.body; // Array de IDs de subusuario (ej: [1, 2])

        if (!targets || !Array.isArray(targets) || targets.length === 0) {
            console.log('🔔 [DEBUG] No targets provided, skipping.');
            return res.json({ success: false, message: 'No targets' });
        }

        console.log('🔔 [DEBUG] Targets recibidos:', targets);

        for (const targetSubId of targets) {
            console.log(`🔔 [DEBUG] Enviando a subusuario: ${targetSubId}`);
            await sendWebPushNotification(usuarioID, targetSubId, {
                title: 'Nuevo Mensaje',
                body: 'Tienes un nuevo mensaje pendiente en la app.',
                url: '/?view=messages'
            });
        }

        console.log('🔔 [DEBUG] Push Alert procesado correctamente');
        res.json({ success: true, message: 'Push enviado a targets' });

    } catch (error) {
        logError('Error enviando push alert:', error);
        res.status(500).json({ message: 'Error interno' });
    }
});

// Guardar suscripción Web Push
app.post('/api/save-subscription', async (req, res) => {
    try {
        const { subscription, usuarioID, subusuarioID } = req.body;

        if (!subscription || !usuarioID || !subusuarioID) {
            return res.status(400).json({ message: 'Faltan datos requeridos (subscription, usuarioID, subusuarioID).' });
        }

        const endpoint = subscription.endpoint;
        // keys tiene p256dh y auth

        const pool = req.app.locals.db;

        if (!pool) {
            logError('Intentando guardar suscripción, pero la conexión a BD no está disponible.');
            return res.status(500).json({ message: 'Error interno: Base de datos no conectada.' });
        }

        // Query genérica para MERGE (Insertar o Actualizar)
        const mergeQuery = `
            MERGE INTO usuario_data AS target
            USING (SELECT @usuarioID AS usuarioID, @subusuarioID AS subusuarioID, @param AS param) AS source
            ON (target.usuarioID = source.usuarioID AND target.subusuarioID = source.subusuarioID AND target.param = source.param)
            WHEN MATCHED THEN
                UPDATE SET valor = @valor
            WHEN NOT MATCHED THEN
                INSERT (usuarioID, subusuarioID, param, valor)
                VALUES (@usuarioID, @subusuarioID, @param, @valor);
        `;

        // Check if subscription exists (to decide on welcome message)
        let isNewSubscription = false;
        try {
            // Verificamos si ya existe el endpoint para este usuario
            const checkResult = await pool.request()
                .input('usuarioID', sql.Int, usuarioID)
                .input('subusuarioID', sql.Int, subusuarioID)
                .query("SELECT COUNT(*) as count FROM usuario_data WHERE usuarioID = @usuarioID AND subusuarioID = @subusuarioID AND param = 'endpoint'");

            if (checkResult.recordset[0].count === 0) {
                isNewSubscription = true;
            }
        } catch (e) {
            console.error('Error checking existing subscription:', e);
        }

        // Guardar endpoint
        await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .input('subusuarioID', sql.Int, subusuarioID)
            .input('param', sql.VarChar(50), 'endpoint')
            .input('valor', sql.VarChar(sql.MAX), endpoint)
            .query(mergeQuery);

        // Guardar key (p256dh)
        await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .input('subusuarioID', sql.Int, subusuarioID)
            .input('param', sql.VarChar(50), 'key')
            .input('valor', sql.VarChar(sql.MAX), subscription.keys.p256dh)
            .query(mergeQuery);

        // Guardar auth
        await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .input('subusuarioID', sql.Int, subusuarioID)
            .input('param', sql.VarChar(50), 'auth')
            .input('valor', sql.VarChar(sql.MAX), subscription.keys.auth)
            .query(mergeQuery);

        res.json({ message: 'Suscripción guardada correctamente.' });

        // Enviar notificación de bienvenida SOLO si es nueva suscripción
        if (isNewSubscription) {
            sendWebPushNotification(usuarioID, subusuarioID, {
                title: 'Bienvenido a BiPoint-Proyectos',
                body: 'A partir de ahora podrá recibir notificaciones del sistema en su dispositivo.',
                url: '/dashboard.html'
            });
        }

    } catch (err) {
        logError('Error al guardar suscripción:', err);
        res.status(500).json({ message: 'Error interno al guardar la suscripción.' });
    }
});


// Endpoint para eliminar suscripción (Reset) - PÚBLICO para permitir reset sin login
app.delete('/api/remove-subscription', async (req, res) => {
    try {
        // Permitir envío por body o query
        const usuarioID = req.body.usuarioID || req.query.usuarioID;
        const subusuarioID = req.body.subusuarioID || req.query.subusuarioID;

        if (!usuarioID || !subusuarioID) {
            return res.status(400).json({ message: 'Faltan datos (usuarioID, subusuarioID).' });
        }

        const pool = req.app.locals.db;

        if (!pool) return res.status(500).json({ message: 'Error de conexión a BD' });

        log(`🗑️ Eliminando datos de suscripción para ${usuarioID}-${subusuarioID}`);

        await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .input('subusuarioID', sql.Int, subusuarioID)
            .query(`DELETE FROM usuario_data 
                    WHERE usuarioID = @usuarioID 
                    AND subusuarioID = @subusuarioID 
                    AND param IN ('endpoint', 'key', 'auth')`);

        res.json({ message: 'Suscripción eliminada correctamente del servidor.' });

    } catch (err) {
        logError('Error al eliminar suscripción:', err);
        res.status(500).json({ message: 'Error interno: ' + err.message });
    }
});

// Verificar estado de suscripción Web Push
app.get('/api/check-subscription-status', authenticateToken, async (req, res) => {
    try {
        const { usuarioID, subusuarioID } = req.user;
        const pool = req.app.locals.db;

        if (!pool) return res.status(500).json({ message: 'Error de conexión a BD' });

        const result = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .input('subusuarioID', sql.Int, subusuarioID)
            .query(`SELECT COUNT(*) as count 
                    FROM usuario_data 
                    WHERE usuarioID = @usuarioID 
                    AND subusuarioID = @subusuarioID 
                    AND param IN ('endpoint', 'key', 'auth')`);

        // Debe tener los 3 registros para considerarse suscrito
        const isSubscribed = result.recordset[0].count >= 3;

        res.json({ subscribed: isSubscribed, usuarioID, subusuarioID });

    } catch (err) {
        logError('Error al verificar suscripción:', err);
        res.status(500).json({ message: 'Error interno.' });
    }
});

// --- Endpoints Mensajería ---

// 1. Obtener Destinatarios (Usuarios Activos)
// Retorna usuarios para poblar la lista de selección en enviomensajes.html
app.get('/api/mensajeria/destinatarios', authenticateToken, async (req, res) => {
    try {
        const pool = req.app.locals.db;
        // Obtenemos solo usuarios activos
        // Asumiendo tabla usuario o usuario_data. 
        // Según layout.js: nombre, u, usuarioID, subusuarioID, activo
        const result = await pool.request()
            .query(`SELECT usuarioID, subusuarioID, nombre, u 
                    FROM usuario 
                    WHERE activoHasta >= FORMAT(GETDATE(), 'yyyyMMdd') 
                    ORDER BY nombre`);

        res.json(result.recordset);
    } catch (err) {
        logError('Error obteniendo destinatarios:', err);
        res.status(500).json({ message: 'Error al obtener destinatarios.' });
    }
});

// 2. Guardar Mensajes (Enviar)
app.post('/api/mensajeria/OLD_guardar', authenticateToken, async (req, res) => {
    const { destinatarios, destinos, titulo, mensaje, fecha, hora } = req.body;
    // destinatarios: [{usuarioID, subusuarioID}, ...]

    if (!destinatarios || destinatarios.length === 0) {
        return res.status(400).json({ message: 'No hay destinatarios.' });
    }
    if (!destinos || destinos.length === 0) {
        return res.status(400).json({ message: 'Debe seleccionar al menos un canal de envío.' });
    }
    if (!mensaje && !titulo) {
        return res.status(400).json({ message: 'Debe ingresar un título o mensaje.' });
    }

    // Formatear 'cuando' a YYYYMMDDHHMM00
    const fParts = fecha.split('-');
    const hParts = hora.split(':');
    const cuando = `${fParts[0]}${fParts[1]}${fParts[2]}${hParts[0]}${hParts[1]}00`;

    const deID = req.user.usuarioID;
    const deSubId = req.user.subusuarioID;

    try {
        const pool = req.app.locals.db;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            for (const destUser of destinatarios) {
                for (const canal of destinos) {
                    await new sql.Request(transaction)
                        .input('aID', sql.Int, destUser.usuarioID)
                        .input('aSubId', sql.Int, destUser.subusuarioID)
                        .input('deID', sql.Int, deID)
                        .input('deSubId', sql.Int, deSubId)
                        .input('titulo', sql.VarChar(100), titulo || '')
                        .input('mensaje', sql.VarChar(sql.MAX), mensaje || '')
                        .input('cuando', sql.VarChar(14), cuando)
                        .input('destino', sql.VarChar(20), canal)
                        .input('leido', sql.Int, 0)
                        .query(`INSERT INTO mensaje (aID, aSubId, deID, deSubId, titulo, mensaje, cuando, destino, leido) 
                                VALUES (@aID, @aSubId, @deID, @deSubId, @titulo, @mensaje, @cuando, @destino, @leido)`);
                }
            }

            await transaction.commit();
            res.json({ message: 'Mensajes programados correctamente.' });

        } catch (innerErr) {
            await transaction.rollback();
            throw innerErr;
        }

    } catch (err) {
        logError('Error al guardar mensajes:', err);
        res.status(500).json({ message: 'Error al enviar mensajes.' });
    }
});

// 3. Obtener Mensajes Pendientes (Para la App/PWA)
// [REMOVED DUPLICATE /api/mensajeria/pendientes]

// 3.5 Obtener Mensajes Leídos (Para la App/PWA - Tab Leídos)
app.get('/api/mensajeria/leidos', authenticateToken, async (req, res) => {
    try {
        const { usuarioID, subusuarioID } = req.user;
        const pool = req.app.locals.db;

        const result = await pool.request()
            .input('uid', sql.Int, usuarioID)
            .input('subid', sql.Int, subusuarioID)
            .query(`SELECT TOP 50 m.*, u.nombre as deNombre
                    FROM mensaje m
                    LEFT JOIN usuario u ON m.deID = u.usuarioID AND m.deSubId = u.subusuarioID
                    WHERE m.aID = @uid 
                    AND m.aSubId = @subid 
                    AND m.leido = 1 
                    AND (m.destino = 'celular' OR m.destino = 'web')
                    ORDER BY m.cuando DESC`);

        res.json(result.recordset);

    } catch (err) {
        logError('Error obteniendo mensajes leídos:', err);
        res.status(500).json({ message: 'Error interno.' });
    }
});

// 4. Marcar Mensajes como Leídos
app.put('/api/mensajeria/marcar-leidos', authenticateToken, async (req, res) => {
    const { mensajeIDs } = req.body;
    if (!mensajeIDs || !Array.isArray(mensajeIDs) || mensajeIDs.length === 0) {
        return res.status(400).json({ message: 'No se enviaron IDs.' });
    }

    try {
        const pool = req.app.locals.db;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            for (const id of mensajeIDs) {
                await new sql.Request(transaction)
                    .input('id', sql.Int, id)
                    .input('uid', sql.Int, req.user.usuarioID)
                    .input('subid', sql.Int, req.user.subusuarioID)
                    // Validar que el mensaje pertenece al usuario (aID/aSubId)
                    .query(`UPDATE mensaje SET leido = 1 
                            WHERE mensajeID = @id AND aID = @uid AND aSubId = @subid`);
            }
            await transaction.commit();
            res.json({ message: 'Mensajes marcados como leídos.' });

        } catch (innerErr) {
            await transaction.rollback();
            throw innerErr;
        }

    } catch (err) {
        logError('Error marcando leídos:', err);
        res.status(500).json({ message: 'Error interno.' });
    }
});

// --- Endpoints para Cron ---

// Obtener todos los cron
app.get('/api/cron', authenticateToken, async (req, res) => {
    try {
        const usuarioID = req.user.usuarioID;
        const pool = req.app.locals.db;
        const result = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .query('SELECT cronID, cron, tipo, horainicio, horafin, valor, repetircadaminutos, activo FROM cron WHERE usuarioID = @usuarioID ORDER BY cronID');
        res.json(result.recordset);
    } catch (err) {
        logError('Error al obtener cron:', err);
        res.status(500).json({ message: 'Error al obtener cron.' });
    }
});

// Agregar un cron
app.post('/api/cron', authenticateToken, async (req, res) => {
    try {
        const { cron, tipo, horainicio, horafin, valor, repetircadaminutos, activo } = req.body;

        // Validaciones básicas
        if (!cron || !tipo || !horainicio || !horafin) {
            return res.status(400).json({ message: 'Nombre, Tipo, Hora Inicio y Hora Fin son obligatorios.' });
        }

        // Validar que si tipo != "todos los dias", valor debe estar informado
        if (tipo !== 'todos los dias' && (!valor || valor.trim() === '')) {
            return res.status(400).json({ message: 'El campo Valor es obligatorio cuando el tipo no es "todos los dias".' });
        }

        // Convertir horas a número para validación
        const horaInicioNum = parseInt(horainicio, 10);
        const horaFinNum = parseInt(horafin, 10);

        // Validar rango de horas (0-2359)
        if (isNaN(horaInicioNum) || horaInicioNum < 0 || horaInicioNum > 2359) {
            return res.status(400).json({ message: 'Hora Inicio debe ser un valor entre 0 y 2359.' });
        }
        if (isNaN(horaFinNum) || horaFinNum < 0 || horaFinNum > 2359) {
            return res.status(400).json({ message: 'Hora Fin debe ser un valor entre 0 y 2359.' });
        }

        // Validar que Hora Fin > Hora Inicio
        if (horaFinNum <= horaInicioNum) {
            return res.status(400).json({ message: 'Hora Fin debe ser mayor que Hora Inicio.' });
        }

        const usuarioID = req.user.usuarioID;
        const pool = req.app.locals.db;

        // Insertar el cron y obtener el cronID generado automáticamente (IDENTITY)
        const result = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .input('cron', sql.VarChar(40), cron)
            .input('tipo', sql.VarChar(50), tipo)
            .input('horainicio', sql.Char(4), horainicio)
            .input('horafin', sql.Char(4), horafin)
            .input('valor', sql.VarChar(100), valor || '')
            .input('repetircadaminutos', sql.Int, repetircadaminutos || 0)
            .input('activo', sql.Bit, activo ? 1 : 0)
            .query('INSERT INTO cron (usuarioID, cron, tipo, horainicio, horafin, valor, repetircadaminutos, activo) OUTPUT INSERTED.cronID VALUES (@usuarioID, @cron, @tipo, @horainicio, @horafin, @valor, @repetircadaminutos, @activo)');

        // Verificar que el INSERT retornó un resultado
        if (!result.recordset || result.recordset.length === 0) {
            logError('Error: INSERT no retornó cronID');
            return res.status(500).json({ message: 'Error al crear el cron: no se pudo obtener el ID.' });
        }

        const cronID = result.recordset[0].cronID;

        res.json({ message: 'Cron agregado correctamente.', cronID: cronID });
    } catch (err) {
        logError('Error al agregar cron:', err);
        logError('Error details:', err.message);
        res.status(500).json({ message: `Error interno al guardar cron: ${err.message}` });
    }
});

// Modificar un cron
app.put('/api/cron/:cronID', authenticateToken, async (req, res) => {
    try {
        const { cronID } = req.params;
        const { cron, tipo, horainicio, horafin, valor, repetircadaminutos, activo } = req.body;

        // Validaciones básicas
        if (!cron || !tipo || !horainicio || !horafin) {
            return res.status(400).json({ message: 'Nombre, Tipo, Hora Inicio y Hora Fin son obligatorios.' });
        }

        // Validar que si tipo != "todos los dias", valor debe estar informado
        if (tipo !== 'todos los dias' && (!valor || valor.trim() === '')) {
            return res.status(400).json({ message: 'El campo Valor es obligatorio cuando el tipo no es "todos los dias".' });
        }

        // Convertir horas a número para validación
        const horaInicioNum = parseInt(horainicio, 10);
        const horaFinNum = parseInt(horafin, 10);

        // Validar rango de horas (0-2359)
        if (isNaN(horaInicioNum) || horaInicioNum < 0 || horaInicioNum > 2359) {
            return res.status(400).json({ message: 'Hora Inicio debe ser un valor entre 0 y 2359.' });
        }
        if (isNaN(horaFinNum) || horaFinNum < 0 || horaFinNum > 2359) {
            return res.status(400).json({ message: 'Hora Fin debe ser un valor entre 0 y 2359.' });
        }

        // Validar que Hora Fin > Hora Inicio
        if (horaFinNum <= horaInicioNum) {
            return res.status(400).json({ message: 'Hora Fin debe ser mayor que Hora Inicio.' });
        }

        const usuarioID = req.user.usuarioID;
        const pool = req.app.locals.db;

        // Verificar si ya existe otro cron con ese tipo
        const check = await pool.request()
            .input('tipo', sql.VarChar(50), tipo)
            .input('usuarioID', sql.Int, usuarioID)
            .input('cronID', sql.Int, cronID)
            .query('SELECT 1 FROM cron WHERE tipo = @tipo AND usuarioID = @usuarioID AND cronID <> @cronID');

        if (check.recordset.length > 0) {
            return res.status(409).json({ message: 'Ya existe otro cron con ese tipo.' });
        }

        await pool.request()
            .input('cronID', sql.Int, cronID)
            .input('usuarioID', sql.Int, usuarioID)
            .input('cron', sql.VarChar(40), cron)
            .input('tipo', sql.VarChar(50), tipo)
            .input('horainicio', sql.Char(4), horainicio)
            .input('horafin', sql.Char(4), horafin)
            .input('valor', sql.VarChar(100), valor || '')
            .input('repetircadaminutos', sql.Int, repetircadaminutos || 0)
            .input('activo', sql.Bit, activo ? 1 : 0)
            .query('UPDATE cron SET cron = @cron, tipo = @tipo, horainicio = @horainicio, horafin = @horafin, valor = @valor, repetircadaminutos = @repetircadaminutos, activo = @activo WHERE cronID = @cronID AND usuarioID = @usuarioID');

        res.json({ message: 'Cron actualizado correctamente.' });
    } catch (err) {
        logError('Error al modificar cron:', err);
        res.status(500).json({ message: 'Error interno al actualizar cron.' });
    }
});

// Eliminar un cron
app.delete('/api/cron/:cronID', authenticateToken, async (req, res) => {
    try {
        const { cronID } = req.params;
        const usuarioID = req.user.usuarioID;
        const pool = req.app.locals.db;

        await pool.request()
            .input('cronID', sql.Int, cronID)
            .input('usuarioID', sql.Int, usuarioID)
            .query('DELETE FROM cron WHERE cronID = @cronID AND usuarioID = @usuarioID');

        res.status(204).send();
    } catch (err) {
        logError('Error al eliminar cron:', err);
        res.status(500).json({ message: 'Error interno al eliminar cron.' });
    }
});

// --- Endpoints para Contactos de Clientes ---

// Obtener contactos de un cliente
app.get('/api/clientes/:clienteID/contactos', authenticateToken, async (req, res) => {
    const { clienteID } = req.params;
    const usuarioID = req.user.usuarioID;

    try {
        const pool = req.app.locals.db;
        const result = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .input('clienteID', sql.Int, clienteID)
            .query('SELECT * FROM contacto_cliente WHERE usuario_ID = @usuarioID AND clienteID = @clienteID ORDER BY contactoID');
        res.json(result.recordset);
    } catch (err) {
        logError('Error al obtener contactos:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Crear un nuevo contacto
app.post('/api/clientes/:clienteID/contactos', authenticateToken, async (req, res) => {
    const { clienteID } = req.params;
    const usuarioID = req.user.usuarioID;
    const { nombre, cargo, email, celular, activo } = req.body;

    if (!nombre || !email || !celular) {
        return res.status(400).json({ message: 'Nombre, Email y Celular son campos requeridos.' });
    }

    const transaction = new sql.Transaction(req.app.locals.db);

    try {
        await transaction.begin();

        // Calcular el próximo contactoID para este cliente y usuario
        const maxIdResult = await new sql.Request(transaction)
            .input('usuarioID', sql.Int, usuarioID)
            .input('clienteID', sql.Int, clienteID)
            .query('SELECT MAX(contactoID) as maxID FROM contacto_cliente WHERE usuario_ID = @usuarioID AND clienteID = @clienteID');

        const nextContactoID = (maxIdResult.recordset[0].maxID || 0) + 1;

        // Validar unicidad de email y celular para este usuarioID
        const checkDup = await new sql.Request(transaction)
            .input('usuarioID', sql.Int, usuarioID)
            .input('email', sql.VarChar(80), email)
            .input('celular', sql.VarChar(15), celular)
            .query(`SELECT 1 FROM contacto_cliente 
                    WHERE usuario_ID = @usuarioID 
                    AND (email = @email OR celular = @celular)`);

        if (checkDup.recordset.length > 0) {
            await transaction.rollback();
            return res.status(409).json({ message: 'El email o celular ya existen para otro contacto de este usuario.' });
        }

        // Insertar el contacto
        const result = await new sql.Request(transaction)
            .input('usuarioID', sql.Int, usuarioID)
            .input('clienteID', sql.Int, clienteID)
            .input('contactoID', sql.Int, nextContactoID)
            .input('nombre', sql.VarChar(50), nombre)
            .input('cargo', sql.VarChar(30), cargo || 'Empleado')
            .input('email', sql.VarChar(80), email)
            .input('celular', sql.VarChar(15), celular)
            .input('activo', sql.Int, activo ? 1 : 0) // Asumiendo que activo viene como boolean o 1/0
            .query(`INSERT INTO contacto_cliente (usuario_ID, clienteID, contactoID, nombre, cargo, email, celular, activo)
                    OUTPUT inserted.*
                    VALUES (@usuarioID, @clienteID, @contactoID, @nombre, @cargo, @email, @celular, @activo)`);

        await transaction.commit();
        const nuevoCliente = result.recordset[0];

        res.status(201).json(nuevoCliente);

    } catch (err) {
        if (transaction._aborted === false) { // Solo rollback si no se ha abortado ya
            await transaction.rollback();
        }
        logError('Error al crear contacto:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Modificar un contacto
app.put('/api/clientes/:clienteID/contactos/:contactoID', authenticateToken, async (req, res) => {
    const { clienteID, contactoID } = req.params;
    const usuarioID = req.user.usuarioID;
    const { nombre, cargo, email, celular, activo } = req.body;

    const emailTrimmed = email ? email.trim() : '';
    const celularTrimmed = celular ? celular.trim() : '';
    const nombreTrimmed = nombre ? nombre.trim() : '';
    const cargoTrimmed = cargo ? cargo.trim() : '';

    try {
        const pool = req.app.locals.db;

        // 1. Validar unicidad de EMAIL
        if (emailTrimmed) {
            const checkEmail = await pool.request()
                .input('usuarioID', sql.Int, usuarioID)
                .input('email', sql.VarChar(80), emailTrimmed)
                .input('contactoID', sql.Int, contactoID)
                .query(`SELECT contactoID FROM contacto_cliente 
                        WHERE usuario_ID = @usuarioID 
                        AND email = @email 
                        AND contactoID <> @contactoID`);

            if (checkEmail.recordset.length > 0) {
                return res.status(409).json({ message: 'El email ya existe para otro contacto.' });
            }
        }

        // 2. Validar unicidad de CELULAR
        if (celularTrimmed) {
            const checkCel = await pool.request()
                .input('usuarioID', sql.Int, usuarioID)
                .input('celular', sql.VarChar(15), celularTrimmed)
                .input('contactoID', sql.Int, contactoID)
                .query(`SELECT contactoID FROM contacto_cliente 
                        WHERE usuario_ID = @usuarioID 
                        AND celular = @celular 
                        AND contactoID <> @contactoID`);

            if (checkCel.recordset.length > 0) {
                return res.status(409).json({ message: 'El celular ya existe para otro contacto.' });
            }
        }
        const result = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .input('clienteID', sql.Int, clienteID)
            .input('contactoID', sql.Int, contactoID)
            .input('nombre', sql.VarChar(50), nombre)
            .input('cargo', sql.VarChar(30), cargo)
            .input('email', sql.VarChar(80), email)
            .input('celular', sql.VarChar(15), celular)
            .input('activo', sql.Int, activo ? 1 : 0)
            .query(`UPDATE contacto_cliente 
                    SET nombre = @nombre, cargo = @cargo, email = @email, celular = @celular, activo = @activo
                    OUTPUT inserted.*
                    WHERE usuario_ID = @usuarioID AND clienteID = @clienteID AND contactoID = @contactoID`);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Contacto no encontrado.' });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        logError('Error al modificar contacto:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Eliminar un contacto
app.delete('/api/clientes/:clienteID/contactos/:contactoID', authenticateToken, async (req, res) => {
    const { clienteID, contactoID } = req.params;
    const usuarioID = req.user.usuarioID;

    try {
        const pool = req.app.locals.db;
        const result = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .input('clienteID', sql.Int, clienteID)
            .input('contactoID', sql.Int, contactoID)
            .query('DELETE FROM contacto_cliente WHERE usuario_ID = @usuarioID AND clienteID = @clienteID AND contactoID = @contactoID');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Contacto no encontrado para eliminar.' });
        }

        res.status(204).send();
    } catch (err) {
        logError('Error al eliminar contacto:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Endpoint para obtener datos de un subusuario para el registro (público)
app.get('/api/subusuario-registro', async (req, res) => {
    const { u, s } = req.query; // u: usuarioID, s: subusuarioID

    if (!u || !s) {
        return res.status(400).json({ message: 'Faltan parámetros de usuario.' });
    }

    try {
        const pool = req.app.locals.db;
        const result = await pool.request()
            .input('usuarioID', sql.Int, u)
            .input('subusuarioID', sql.Int, s)
            .query(`SELECT nombre, u, celular,email FROM usuario WHERE usuarioID = @usuarioID AND subusuarioID = @subusuarioID`);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Colaborador no encontrado.' });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        logError('Error al obtener datos de subusuario para registro:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// --- PWA Photo Endpoints ---

// Subir Foto
app.post('/api/pwa/upload-photo', authenticateToken, uploadUserPhoto.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se subió ningún archivo.' });
        }

        const photoUrl = `/uploads/fotousuarios/${req.file.filename}`;
        const pool = req.app.locals.db;
        const usuarioID = req.user.usuarioID;
        const subusuarioID = req.user.subusuarioID;

        // Validar si ya existe el registro en usuario_data
        const check = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .input('subusuarioID', sql.Int, subusuarioID)
            .query("SELECT 1 FROM usuario_data WHERE usuarioID = @usuarioID AND subusuarioID = @subusuarioID AND param = 'foto'");

        if (check.recordset.length > 0) {
            // Actualizar
            await pool.request()
                .input('usuarioID', sql.Int, usuarioID)
                .input('subusuarioID', sql.Int, subusuarioID)
                .input('foto', sql.VarChar(255), photoUrl)
                .query("UPDATE usuario_data SET valor = @foto WHERE usuarioID = @usuarioID AND subusuarioID = @subusuarioID AND param = 'foto'");
        } else {
            // Insertar
            await pool.request()
                .input('usuarioID', sql.Int, usuarioID)
                .input('subusuarioID', sql.Int, subusuarioID)
                .input('foto', sql.VarChar(255), photoUrl)
                .query("INSERT INTO usuario_data (usuarioID, subusuarioID, param, valor) VALUES (@usuarioID, @subusuarioID, 'foto', @foto)");
        }

        res.json({ message: 'Foto subida correctamente.', photoUrl: photoUrl });

    } catch (err) {
        logError('Error upload photo PWA:', err);
        res.status(500).json({ message: 'Error al subir foto.' });
    }
});

// Eliminar Foto
app.delete('/api/pwa/photo', authenticateToken, async (req, res) => {
    try {
        const usuarioID = req.user.usuarioID;
        const subusuarioID = req.user.subusuarioID;
        const pool = req.app.locals.db;

        // Obtener ruta actual de la foto
        const result = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .input('subusuarioID', sql.Int, subusuarioID)
            .query("SELECT valor FROM usuario_data WHERE usuarioID = @usuarioID AND subusuarioID = @subusuarioID AND param = 'foto'");

        const currentPhoto = result.recordset.length > 0 ? result.recordset[0].valor : null;

        if (currentPhoto) {
            try {
                // Eliminar archivo físico
                const filePath = path.join(__dirname, currentPhoto);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (fileErr) {
                console.error('Error eliminando archivo fisico (ignorado):', fileErr);
            }
        }

        // Eliminar registro DB
        await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .input('subusuarioID', sql.Int, subusuarioID)
            .query("DELETE FROM usuario_data WHERE usuarioID = @usuarioID AND subusuarioID = @subusuarioID AND param = 'foto'");

        res.json({ message: 'Foto eliminada correctamente.' });
    } catch (err) {
        logError('Error deleting photo PWA:', err);
        res.status(500).json({ message: 'Error al eliminar foto.' });
    }
});

// Endpoint para registrar (completar datos) de un colaborador (público)
app.put('/api/colaborador/registrar', async (req, res) => {
    const { usuarioID, subusuarioID, nombre, u, clave, email } = req.body;

    if (!usuarioID || !subusuarioID || !clave || !email) {
        return res.status(400).json({ message: 'Faltan datos obligatorios.' });
    }

    try {
        const pool = req.app.locals.db;

        // Hashear la clave
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(clave, salt);

        const result = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .input('subusuarioID', sql.Int, subusuarioID)
            .input('nombre', sql.VarChar(100), nombre)
            .input('u', sql.VarChar(50), u)
            .input('password', sql.VarChar(255), hashedPassword)
            .input('email', sql.VarChar(100), email)
            .query(`UPDATE usuario SET 
                        nombre = @nombre, 
                        u = @u, 
                        password = @password, 
                        email = @email 
                    WHERE usuarioID = @usuarioID AND subusuarioID = @subusuarioID`);

        res.json({ message: 'Usuario registrado con éxito.' });

    } catch (err) {
        logError('Error al registrar colaborador:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Endpoint para obtener menús con estado de roles (rol_menu)
app.get('/api/admin/rol-menus', authenticateToken, async (req, res) => {
    try {
        const pool = req.app.locals.db;
        const usuarioID = req.user.usuarioID;

        // Excluir Menu 10 (Admin) y traer roles 2-5 con flag write (0=Lectura, 1=Full, NULL=Sin Acceso)
        const query = `
            SELECT m.menuID, m.menu, m.nivel, m.programa,
                rm2.write as rol2,
                rm3.write as rol3,
                rm4.write as rol4,
                rm5.write as rol5
            FROM menu m
            LEFT JOIN rol_menu rm2 ON m.menuID = rm2.menuID AND rm2.rolID = 2 AND rm2.usuarioID = @usuarioID
            LEFT JOIN rol_menu rm3 ON m.menuID = rm3.menuID AND rm3.rolID = 3 AND rm3.usuarioID = @usuarioID
            LEFT JOIN rol_menu rm4 ON m.menuID = rm4.menuID AND rm4.rolID = 4 AND rm4.usuarioID = @usuarioID
            LEFT JOIN rol_menu rm5 ON m.menuID = rm5.menuID AND rm5.rolID = 5 AND rm5.usuarioID = @usuarioID
            WHERE m.menuID <> 10 AND m.nivel NOT LIKE (SELECT nivel FROM menu WHERE menuID = 10) + '.%'
            ORDER BY
            CAST(SUBSTRING(nivel, 1, CHARINDEX('.', nivel + '.') - 1) AS INT),
            CAST(CASE WHEN CHARINDEX('.', nivel) > 0 
                    THEN SUBSTRING(nivel, CHARINDEX('.', nivel) + 1,
                    CHARINDEX('.', nivel + '.', CHARINDEX('.', nivel) + 1) - CHARINDEX('.', nivel) - 1)
                    ELSE '0' END AS INT),
            CAST(CASE WHEN LEN(nivel) - LEN(REPLACE(nivel, '.', '')) >= 2
                    THEN SUBSTRING(nivel,
                    CHARINDEX('.', nivel, CHARINDEX('.', nivel) + 1) + 1,
                    CHARINDEX('.', nivel + '.', CHARINDEX('.', nivel, CHARINDEX('.', nivel) + 1) + 1) -
                    CHARINDEX('.', nivel, CHARINDEX('.', nivel) + 1) - 1)
                    ELSE '0' END AS INT)`;

        const result = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .query(query);

        res.json(result.recordset);
    } catch (err) {
        logError('Error al obtener rol-menus:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Endpoint para asignar/remover rol a un menú en rol_menu
app.put('/api/rol-menu', authenticateToken, async (req, res) => {
    try {
        const { menuID, rolID, write, assign } = req.body; // assign: true/false, write: 0/1
        const usuarioID = req.user.usuarioID;

        if (rolID < 2 || rolID > 5) return res.status(400).json({ message: 'Rol inválido (solo 2-5 permitidos).' });

        const pool = req.app.locals.db;

        // Obtener nivel para recursividad
        const menuResult = await pool.request()
            .input('menuID', sql.Int, menuID)
            .query('SELECT nivel FROM menu WHERE menuID = @menuID');

        if (menuResult.recordset.length === 0) return res.status(404).json({ message: 'Menú no encontrado.' });
        const nivel = menuResult.recordset[0].nivel;

        if (assign) {
            // Upsert lógica: Primero borrar existentes para ese usuario/rol en el árbol
            const deleteQuery = `
                DELETE FROM rol_menu 
                WHERE usuarioID = @usuarioID AND rolID = @rolID 
                AND menuID IN (SELECT menuID FROM menu WHERE nivel = '${nivel}' OR nivel LIKE '${nivel}.%')`;

            const insertQuery = `
                INSERT INTO rol_menu (usuarioID, menuID, rolID, write)
                SELECT @usuarioID, menuID, @rolID, @write 
                FROM menu 
                WHERE nivel = '${nivel}' OR nivel LIKE '${nivel}.%'`;

            await pool.request()
                .input('usuarioID', sql.Int, usuarioID)
                .input('rolID', sql.Int, rolID)
                .input('write', sql.Int, write)
                .query(deleteQuery + '; ' + insertQuery);

        } else {
            // Solo borrar (Unassign)
            await pool.request()
                .input('usuarioID', sql.Int, usuarioID)
                .input('rolID', sql.Int, rolID)
                .query(`DELETE FROM rol_menu WHERE usuarioID = @usuarioID AND rolID = @rolID AND menuID IN (SELECT menuID FROM menu WHERE nivel = '${nivel}' OR nivel LIKE '${nivel}.%')`);
        }

        res.json({ message: `Permisos actualizados para Rol ${rolID}.` });
    } catch (err) {
        logError('Error al actualizar rol-menu:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});


// --- Endpoints Públicos para Registro de Colaborador ---

// GET: Obtener datos del colaborador (validado por usuarioID y subusuarioID)
app.get('/api/subusuario-registro', async (req, res) => {
    const { u, s } = req.query; // u=usuarioID, s=subusuarioID

    if (!u || !s) {
        return res.status(400).json({ message: 'Parámetros inválidos.' });
    }

    try {
        const pool = req.app.locals.db;
        const result = await pool.request()
            .input('usuarioID', sql.Int, u)
            .input('subusuarioID', sql.Int, s)
            .query('SELECT nombre, u, email, celular, cuit FROM usuario WHERE usuarioID = @usuarioID AND subusuarioID = @subusuarioID');

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        logError('Error al obtener info de usuario (público):', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// PUT: Completar registro de colaborador
app.put('/api/colaborador/registrar', async (req, res) => {
    const { usuarioID, subusuarioID, nombre, u, email, clave } = req.body;

    if (!usuarioID || !subusuarioID || !nombre || !u || !clave) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    try {
        const pool = req.app.locals.db;

        // 1. Validar unicidad de U y Email (excluyendo el actual usuario)
        const checkDup = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .input('subusuarioID', sql.Int, subusuarioID)
            .input('u', sql.VarChar(50), u)
            .input('email', sql.VarChar(100), email)
            .query(`SELECT 1 FROM usuario 
                    WHERE usuarioID = @usuarioID 
                    AND (u = @u OR (email = @email AND @email <> '')) 
                    AND subusuarioID <> @subusuarioID`);

        if (checkDup.recordset.length > 0) {
            return res.status(409).json({ message: 'El usuario o email ya están en uso por otro colaborador.' });
        }

        // 2. Hashear password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(clave, salt);

        // 3. Actualizar
        await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .input('subusuarioID', sql.Int, subusuarioID)
            .input('nombre', sql.VarChar(100), nombre)
            .input('u', sql.VarChar(50), u)
            .input('email', sql.VarChar(100), email)
            .input('password', sql.VarChar(255), hashedPassword)
            .query(`UPDATE usuario 
                    SET nombre = @nombre, u = @u, email = @email, password = @password, activo = 1 
                    WHERE usuarioID = @usuarioID AND subusuarioID = @subusuarioID`);

        res.json({ message: 'Registro completado exitosamente.' });

    } catch (err) {
        logError('Error al completar registro:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Importar usuarios desde Excel
app.post('/api/usuarios/importar', authenticateToken, upload.single('archivo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se subió ningún archivo.' });
        }

        const usuarioID = req.user.usuarioID;
        const pool = req.app.locals.db;
        const workbook = new ExcelJS.Workbook();

        await workbook.xlsx.load(req.file.buffer);
        const worksheet = workbook.getWorksheet(1);

        if (!worksheet) {
            return res.status(400).json({ message: 'El archivo Excel no tiene hojas.' });
        }

        const newUsers = [];
        const errors = [];

        // Cache existing data for quick validation
        const existingData = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .query("SELECT u, email, celular FROM usuario WHERE usuarioID = @usuarioID");

        const existingU = new Set(existingData.recordset.map(r => r.u.toLowerCase()));
        const existingEmail = new Set(existingData.recordset.filter(r => r.email).map(r => r.email.toLowerCase()));

        // Get Max SubusuarioID
        const resultMax = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .query("SELECT ISNULL(MAX(subusuarioID), 0) as maxId, (SELECT TOP 1 activohasta FROM usuario WHERE usuarioID = @usuarioID AND subusuarioID = 0) as mainActive, (SELECT TOP 1 cuit FROM usuario WHERE usuarioID = @usuarioID AND subusuarioID = 0) as mainCuit FROM usuario WHERE usuarioID = @usuarioID");

        let nextSubId = resultMax.recordset[0].maxId + 1;
        const mainActive = resultMax.recordset[0].mainActive;
        const mainCuit = resultMax.recordset[0].mainCuit;

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header

            const nombre = row.getCell(1).value ? String(row.getCell(1).value).trim() : null;
            const u = row.getCell(2).value ? String(row.getCell(2).value).trim() : null;
            const email = row.getCell(3).value ? String(row.getCell(3).value).trim() : null;
            const celular = row.getCell(4).value ? String(row.getCell(4).value).trim() : null;

            if (!nombre || !u || !celular) {
                if (!nombre && !u && !celular) return; // Skip completely empty rows
                errors.push(`Fila ${rowNumber}: Faltan datos obligatorios (Nombre, Usuario, Celular).`);
                return;
            }

            // Validations
            if (existingU.has(u.toLowerCase())) {
                errors.push(`Fila ${rowNumber}: El usuario '${u}' ya existe.`);
            }
            if (email && existingEmail.has(email.toLowerCase())) {
                errors.push(`Fila ${rowNumber}: El email '${email}' ya existe.`);
            }
            // Validar duplicados en el MISMO archivo
            if (newUsers.some(nu => nu.u.toLowerCase() === u.toLowerCase())) {
                errors.push(`Fila ${rowNumber}: El usuario '${u}' está duplicado en el archivo.`);
            }

            if (errors.length === 0) {
                newUsers.push({
                    subusuarioID: nextSubId++,
                    nombre,
                    u,
                    email,
                    celular
                });
            }
        });

        if (errors.length > 0) {
            return res.status(400).json({ message: 'Errores en la importación:<br>' + errors.slice(0, 5).join('<br>') + (errors.length > 5 ? '<br>... y más errores.' : '') });
        }

        if (newUsers.length === 0) {
            return res.status(400).json({ message: 'No se encontraron usuarios válidos para importar.' });
        }

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const salt = await bcrypt.genSalt(10);
            const hashed = await bcrypt.hash('123456', salt); // Default password '123456'

            for (const user of newUsers) {
                const reqInsert = new sql.Request(transaction);
                await reqInsert
                    .input('usuarioID', sql.Int, usuarioID)
                    .input('subusuarioID', sql.Int, user.subusuarioID)
                    .input('nombre', sql.VarChar(100), user.nombre)
                    .input('u', sql.VarChar(50), user.u)
                    .input('email', sql.VarChar(100), user.email || null)
                    .input('celular', sql.VarChar(20), user.celular)
                    .input('password', sql.VarChar(255), hashed)
                    .input('activohasta', sql.Int, mainActive)
                    .input('cuit', sql.VarChar(50), mainCuit)
                    .query(`INSERT INTO usuario (usuarioID, subusuarioID, nombre, u, email, celular, password, activohasta, cuit) 
                            VALUES (@usuarioID, @subusuarioID, @nombre, @u, @email, @celular, @password, @activohasta, @cuit)`);
            }

            await transaction.commit();
            res.json({ message: `Se importaron ${newUsers.length} colaboradores correctamente. Clave por defecto: 123456` });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (err) {
        logError('Error al importar usuarios:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Exportar usuarios a Excel
app.get('/api/usuarios/exportar', authenticateToken, async (req, res) => {
    try {
        const usuarioID = req.user.usuarioID;
        const pool = req.app.locals.db;

        // Obtener datos
        const result = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .query(`SELECT subusuarioID, nombre, u, email, celular, activohasta 
                    FROM usuario 
                    WHERE usuarioID = @usuarioID 
                    ORDER BY subusuarioID`);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Usuarios');

        // Definir columnas
        worksheet.columns = [
            { header: 'Nro.', key: 'subusuarioID', width: 10 },
            { header: 'Nombre', key: 'nombre', width: 30 },
            { header: 'Usuario Login', key: 'u', width: 20 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Celular', key: 'celular', width: 20 },
            { header: 'Activo Hasta', key: 'activohasta', width: 15 }
        ];

        // Estilar cabecera
        worksheet.getRow(1).font = { bold: true };

        // Agregar filas
        result.recordset.forEach(user => {
            worksheet.addRow(user);
        });

        // Configurar respuesta
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Usuarios.xlsx');

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        logError('Error al exportar usuarios:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// GET: Obtener titulares para filtro (Solo Admin usuarioID=1, subusuarioID=0)
app.get('/api/admin/titulares', authenticateToken, async (req, res) => {
    if (req.user.usuarioID !== 1 || req.user.subusuarioID !== 0) {
        return res.status(403).json({ message: 'No autorizado. Solo administradores.' });
    }

    try {
        const pool = req.app.locals.db;
        const result = await pool.request()
            .query('SELECT usuarioID, nombre, cuit FROM usuario WHERE subusuarioID = 0 ORDER BY nombre');
        res.json(result.recordset);
    } catch (err) {
        logError('Error al obtener titulares:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// GET: Reporte de Seguridad (Usuarios y Roles)
app.get('/api/reports/seguridad', authenticateToken, async (req, res) => {
    try {
        const { ids } = req.query; // lista separada por comas de usuarioIDs
        const currentUsuarioID = req.user.usuarioID;
        const pool = req.app.locals.db;

        let query = `
            SELECT u.usuarioID, u.subusuarioID, u.nombre, ISNULL(ru.rolID, 5) as rolID 
            FROM usuario u 
            LEFT JOIN rol_usuario ru ON u.usuarioID = ru.usuarioID AND u.subusuarioID = ru.subusuarioID
        `;

        const request = pool.request();

        log('DEBUG SECURITY REPORT:', { currentUsuarioID, sub: req.user.subusuarioID, ids });

        // Lógica de Filtro
        // Lógica de Filtro
        const esAdmin = currentUsuarioID === 1 && req.user.subusuarioID === 0;

        if (esAdmin) {
            // Es Administrador General
            let whereClauses = ["(u.usuarioID <> 1 OR u.subusuarioID <> 0)"]; // Excluir al propio Admin

            if (ids && ids.trim() !== '') {
                // Filtrar por IDs seleccionados
                const idList = ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

                if (idList.length > 0) {
                    whereClauses.push(`u.usuarioID IN (${idList.join(',')})`);
                }
            }

            if (whereClauses.length > 0) {
                query += ` WHERE ${whereClauses.join(' AND ')}`;
            }

        } else {
            // Es un Cliente Tenant -> Solo ve su propia cuenta
            query += ` WHERE u.usuarioID = @currentUsuarioID`;
            request.input('currentUsuarioID', sql.Int, currentUsuarioID);
        }

        query += ` ORDER BY u.usuarioID, u.subusuarioID`;

        const result = await request.query(query);
        res.json(result.recordset);

    } catch (err) {
        logError('Error en reporte de seguridad:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// GET: Obtener Lista Usuarios (ABM Usuarios Admin) - Solo subusuarioID=0
app.get('/api/admin/usuarios', authenticateToken, async (req, res) => {
    // Validar permisos (solo usuarioID=1 o administradores designados)
    // El usuario dijo "El programa sera utilizado por administrador (ya esta resuelto el acceso)"
    // Pero por seguridad validamos que quien llame tenga permisos básicos de admin (usuarioID 1)
    if (req.user.usuarioID !== 1) {
        return res.status(403).json({ message: 'No autorizado.' });
    }

    try {
        const pool = req.app.locals.db;
        const result = await pool.request()
            .query(`SELECT usuarioID, cuit, nombre, u, email, celular, activohasta 
                    FROM usuario 
                    WHERE subusuarioID = 0 
                    ORDER BY nombre`);
        res.json(result.recordset);
    } catch (err) {
        logError('Error al obtener usuarios admin:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// POST: Alta de Usuario (subusuarioID=0)
app.post('/api/admin/usuarios', authenticateToken, async (req, res) => {
    if (req.user.usuarioID !== 1) return res.sendStatus(403);

    const { cuit, nombre, u, password, email, celular, activohasta } = req.body;

    if (!u || !password || !nombre) {
        return res.status(400).json({ message: 'Datos incompletos.' });
    }

    try {
        const pool = req.app.locals.db;

        // Validar si CUIT ya existe (globalmente)
        if (cuit) {
            const checkCuit = await pool.request()
                .input('cuit', sql.VarChar(50), cuit)
                .query("SELECT COUNT(*) as count FROM usuario WHERE cuit = @cuit");
            if (checkCuit.recordset[0].count > 0) {
                return res.status(409).json({ message: 'El CUIT ya existe en el sistema.' });
            }
        }

        // Validar si nombre de usuario ya existe (para login)
        const checkU = await pool.request()
            .input('u', sql.VarChar(50), u)
            .query("SELECT COUNT(*) as count FROM usuario WHERE u = @u"); // Global unique username check usually good practice? Or per subuserID? Login is usually global unique or unique per tenant.
        // Asuming unique login globally is safer.

        if (checkU.recordset[0].count > 0) {
            return res.status(409).json({ message: 'El nombre de usuario (login) ya existe.' });
        }


        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);

        // Get Next UsuarioID
        const rId = await pool.request().query("SELECT ISNULL(MAX(usuarioID), 0) + 1 as nextID FROM usuario");
        const nextID = rId.recordset[0].nextID;

        await pool.request()
            .input('usuarioID', sql.Int, nextID)
            .input('subusuarioID', sql.Int, 0) // Basic user
            .input('nombre', sql.VarChar(100), nombre)
            .input('u', sql.VarChar(50), u)
            .input('password', sql.VarChar(255), hashed)
            .input('email', sql.VarChar(100), email || null)
            .input('celular', sql.VarChar(50), celular || null)
            .input('activohasta', sql.Int, activohasta ? parseInt(activohasta) : 20301231) // Default date if missing
            .input('cuit', sql.VarChar(50), cuit || null)
            .query(`INSERT INTO usuario (usuarioID, subusuarioID, nombre, u, password, email, celular, activohasta, cuit) 
                    VALUES (@usuarioID, @subusuarioID, @nombre, @u, @password, @email, @celular, @activohasta, @cuit)`);

        res.json({ message: 'Usuario creado correctamente', usuarioID: nextID });

    } catch (err) {
        logError('Error creando usuario:', err);
        res.status(500).json({ message: 'Error interno.' });
    }
});

// PUT: Modificar Usuario
app.put('/api/admin/usuarios/:id', authenticateToken, async (req, res) => {
    if (req.user.usuarioID !== 1) return res.sendStatus(403);

    const id = req.params.id;
    const { cuit, nombre, u, password, email, celular, activohasta } = req.body;

    try {
        const pool = req.app.locals.db;

        // Validar CUIT unico (excluyendo este usuario)
        if (cuit) {
            const checkCuit = await pool.request()
                .input('cuit', sql.VarChar(50), cuit)
                .input('id', sql.Int, id)
                .query("SELECT COUNT(*) as count FROM usuario WHERE cuit = @cuit AND usuarioID != @id");
            if (checkCuit.recordset[0].count > 0) {
                return res.status(409).json({ message: 'El CUIT ya existe en otro usuario.' });
            }
        }

        // Update 1: CUIT globally for this usuarioID (all subusers)
        await pool.request()
            .input('cuit', sql.VarChar(50), cuit || null)
            .input('id', sql.Int, id)
            .query("UPDATE usuario SET cuit=@cuit WHERE usuarioID=@id");

        // Update 2: Other fields only for the main account (subusuarioID=0)
        let query = `UPDATE usuario SET 
                     nombre=@nombre, u=@u, email=@email, celular=@celular, activohasta=@activohasta`;

        const reqSql = pool.request()
            .input('id', sql.Int, id)
            .input('nombre', sql.VarChar(100), nombre)
            .input('u', sql.VarChar(50), u)
            .input('email', sql.VarChar(100), email || null)
            .input('celular', sql.VarChar(50), celular || null)
            .input('activohasta', sql.Int, activohasta);

        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            const hashed = await bcrypt.hash(password, salt);
            query += `, password=@password`;
            reqSql.input('password', sql.VarChar(255), hashed);
        }

        query += ` WHERE usuarioID=@id AND subusuarioID=0`;

        await reqSql.query(query);
        res.json({ message: 'Usuario actualizado.' });

    } catch (err) {
        logError('Error actualizando usuario:', err);
        res.status(500).json({ message: 'Error interno.' });
    }
});

// DELETE: Eliminar Usuario
app.delete('/api/admin/usuarios/:id', authenticateToken, async (req, res) => {
    if (req.user.usuarioID !== 1) return res.sendStatus(403);
    const id = req.params.id;

    try {
        const pool = req.app.locals.db;
        // Optional: Check if it has related data before delete or CASCADE
        // For simplicity, we delete from usuario table. 
        // NOTE: subusuarioID=0 means we delete ALL subusers? OR just the main user? 
        // "Eliminar" usually means removing the account. 
        // We will delete where usuarioID = @id (all subusers too) to avoid orphan data, 
        // OR just the subusuarioID=0? 
        // Usually deleting the main account deletes the whole access.

        await pool.request()
            .input('id', sql.Int, id)
            .query("DELETE FROM usuario WHERE usuarioID = @id");

        res.json({ message: 'Usuario eliminado.' });
    } catch (err) {
        logError('Error eliminando usuario:', err);
        res.status(500).json({ message: 'Error interno.' });
    }
});

// --- Endpoints Organigramas ---

// Inicializar Tablas si no existen
async function initOrganigramaTables(pool) {
    try {
        await pool.request().query(`
            IF OBJECT_ID('organigrama', 'U') IS NULL
            CREATE TABLE organigrama (
                organigramaID INT PRIMARY KEY,
                usuarioID INT,
                organigrama VARCHAR(100)
            );

            IF OBJECT_ID('organigrama_nivel', 'U') IS NULL
            CREATE TABLE organigrama_nivel (
                usuarioID INT,
                organigramaID INT,
                nivel VARCHAR(50),
                nombreNivel VARCHAR(100)
            );

            IF OBJECT_ID('organigrama_subusuario', 'U') IS NULL
            CREATE TABLE organigrama_subusuario (
                usuarioID INT,
                organigramaID INT,
                nivel VARCHAR(50),
                subusuarioID INT
            );
        `);
        console.log('Tablas de organigrama verificadas/creadas.');
    } catch (err) {
        console.error('Error initOrganigramaTables:', err);
    }
}

// GET: Listar Organigramas
app.get('/api/organigramas', authenticateToken, async (req, res) => {
    try {
        const pool = req.app.locals.db;
        const usuarioID = req.user.usuarioID;

        // Lazy init
        await initOrganigramaTables(pool);

        const result = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .query('SELECT organigramaID, organigrama FROM organigrama WHERE usuarioID = @usuarioID ORDER BY organigrama');

        res.json(result.recordset);
    } catch (err) {
        logError('Error GET /api/organigramas:', err);
        res.status(500).json({ message: 'Error interno.' });
    }
});

// GET: Detalles Organigrama
app.get('/api/organigramas/:id/details', authenticateToken, async (req, res) => {
    try {
        const pool = req.app.locals.db;
        const organigramaID = req.params.id;
        const usuarioID = req.user.usuarioID;

        const niveles = await pool.request()
            .input('oid', sql.Int, organigramaID)
            .input('uid', sql.Int, usuarioID)
            .query('SELECT nivel, nombreNivel FROM organigrama_nivel WHERE organigramaID = @oid AND usuarioID = @uid');

        const subusuarios = await pool.request()
            .input('oid', sql.Int, organigramaID)
            .input('uid', sql.Int, usuarioID)
            .query('SELECT nivel, subusuarioID FROM organigrama_subusuario WHERE organigramaID = @oid AND usuarioID = @uid');

        res.json({
            niveles: niveles.recordset,
            subusuarios: subusuarios.recordset
        });
    } catch (err) {
        logError('Error GET details:', err);
        res.status(500).json({ message: 'Error interno.' });
    }
});

// POST: Crear Organigrama
app.post('/api/organigramas', authenticateToken, async (req, res) => {
    try {
        const { organigramaNombre, niveles, subusuarios } = req.body;
        const usuarioID = req.user.usuarioID;
        const pool = req.app.locals.db;

        if (!organigramaNombre) return res.status(400).json({ message: 'Nombre requerido' });

        const rId = await pool.request()
            .input('uid', sql.Int, usuarioID)
            .query("SELECT ISNULL(MAX(organigramaID), 0) + 1 as nextID FROM organigrama WHERE usuarioID = @uid");
        const nextID = rId.recordset[0].nextID;

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Header
            await new sql.Request(transaction)
                .input('id', sql.Int, nextID)
                .input('uid', sql.Int, usuarioID)
                .input('nombre', sql.VarChar(100), organigramaNombre)
                .query("INSERT INTO organigrama (organigramaID, usuarioID, organigrama) VALUES (@id, @uid, @nombre)");

            // Niveles
            if (niveles && niveles.length > 0) {
                for (const n of niveles) {
                    await new sql.Request(transaction)
                        .input('uid', sql.Int, usuarioID)
                        .input('id', sql.Int, nextID)
                        .input('nivel', sql.VarChar(50), n.nivel)
                        .input('nom', sql.VarChar(100), n.nombreNivel)
                        .query("INSERT INTO organigrama_nivel (usuarioID, organigramaID, nivel, nombreNivel) VALUES (@uid, @id, @nivel, @nom)");
                }
            }

            // Subusuarios
            if (subusuarios && subusuarios.length > 0) {
                for (const s of subusuarios) {
                    await new sql.Request(transaction)
                        .input('uid', sql.Int, usuarioID)
                        .input('id', sql.Int, nextID)
                        .input('nivel', sql.VarChar(50), s.nivel)
                        .input('sid', sql.Int, s.subusuarioID)
                        .query("INSERT INTO organigrama_subusuario (usuarioID, organigramaID, nivel, subusuarioID) VALUES (@uid, @id, @nivel, @sid)");
                }
            }

            await transaction.commit();
            res.json({ message: 'Creado correctamente', id: nextID });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        logError('Error POST organigramas:', err);
        res.status(500).json({ message: 'Error interno.' });
    }
});

// PUT: Modificar Organigrama
app.put('/api/organigramas/:id/details', authenticateToken, async (req, res) => {
    try {
        const organigramaID = req.params.id;
        const { organigramaNombre, niveles, subusuarios } = req.body;
        const pool = req.app.locals.db;

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Update Header
            await new sql.Request(transaction)
                .input('id', sql.Int, organigramaID)
                .input('uid', sql.Int, req.user.usuarioID)
                .input('nombre', sql.VarChar(100), organigramaNombre)
                .query("UPDATE organigrama SET organigrama = @nombre WHERE organigramaID = @id AND usuarioID = @uid");

            // Replace Details
            const reqDel = new sql.Request(transaction);
            reqDel.input('id', sql.Int, organigramaID);
            reqDel.input('uid', sql.Int, req.user.usuarioID);

            await reqDel.query("DELETE FROM organigrama_nivel WHERE organigramaID = @id AND usuarioID = @uid");
            await reqDel.query("DELETE FROM organigrama_subusuario WHERE organigramaID = @id AND usuarioID = @uid");

            // Niveles
            if (niveles && niveles.length > 0) {
                for (const n of niveles) {
                    await new sql.Request(transaction)
                        .input('id', sql.Int, organigramaID)
                        .input('uid', sql.Int, req.user.usuarioID)
                        .input('nivel', sql.VarChar(50), n.nivel)
                        .input('nom', sql.VarChar(100), n.nombreNivel)
                        .query("INSERT INTO organigrama_nivel (usuarioID, organigramaID, nivel, nombreNivel) VALUES (@uid, @id, @nivel, @nom)");
                }
            }

            // Subusuarios
            if (subusuarios && subusuarios.length > 0) {
                for (const s of subusuarios) {
                    await new sql.Request(transaction)
                        .input('id', sql.Int, organigramaID)
                        .input('uid', sql.Int, req.user.usuarioID)
                        .input('nivel', sql.VarChar(50), s.nivel)
                        .input('sid', sql.Int, s.subusuarioID)
                        .query("INSERT INTO organigrama_subusuario (usuarioID, organigramaID, nivel, subusuarioID) VALUES (@uid, @id, @nivel, @sid)");
                }
            }

            await transaction.commit();
            res.json({ message: 'Actualizado correctamente' });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        logError('Error PUT organigramas:', err);
        res.status(500).json({ message: 'Error interno.' });
    }
});

// DELETE: Eliminar Organigrama
app.delete('/api/organigramas/:id', authenticateToken, async (req, res) => {
    try {
        const organigramaID = req.params.id;
        const pool = req.app.locals.db;

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const reqDel = new sql.Request(transaction);
            reqDel.input('id', sql.Int, organigramaID);
            reqDel.input('uid', sql.Int, req.user.usuarioID);

            await reqDel.query("DELETE FROM organigrama_nivel WHERE organigramaID = @id AND usuarioID = @uid");
            await reqDel.query("DELETE FROM organigrama_subusuario WHERE organigramaID = @id AND usuarioID = @uid");
            await reqDel.query("DELETE FROM organigrama WHERE organigramaID = @id AND usuarioID = @uid");

            await transaction.commit();
            res.json({ message: 'Eliminado correctamente' });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        logError('Error DELETE organigramas:', err);
        res.status(500).json({ message: 'Error interno.' });
    }
});

// Endpoint para obtener usuarios conectados (Admin Server Monitor)
app.get('/api/admin/connected-users', authenticateToken, (req, res) => {
    // Validar permisos (solo usuarioID=1)
    if (req.user.usuarioID !== 1) {
        return res.status(403).json({ message: 'No autorizado. Solo administrador principal.' });
    }

    try {
        const connectedUsers = [];
        const sockets = Array.from(io.sockets.sockets.values());

        sockets.forEach(s => {
            if (s.user) {
                connectedUsers.push({
                    socketId: s.id,
                    usuarioID: s.user.usuarioID,
                    subusuarioID: s.user.subusuarioID,
                    nombre: s.user.nombre,
                    source: s.handshake.query.source || 'unknown',
                    connectedAt: s.handshake.time || new Date().toISOString()
                });
            }
        });

        res.json(connectedUsers);
    } catch (err) {
        logError('Error admin/connected-users:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Endpoint: Enviar mensaje instantáneo (Admin -> Usuario)
app.post('/api/admin/send-message', authenticateToken, async (req, res) => {
    if (req.user.usuarioID !== 1) return res.sendStatus(403);

    const { usuarioID, subusuarioID, mensaje } = req.body;

    if (!mensaje || !usuarioID) {
        return res.status(400).json({ message: 'Faltan datos.' });
    }

    try {
        const pool = req.app.locals.db;
        const now = new Date();
        const yyyymmddhhmm = now.getFullYear().toString() +
            (now.getMonth() + 1).toString().padStart(2, '0') +
            now.getDate().toString().padStart(2, '0') +
            now.getHours().toString().padStart(2, '0') +
            now.getMinutes().toString().padStart(2, '0');

        // Determine destino based on user's connected socket source
        const sockets = Array.from(io.sockets.sockets.values());
        const userSockets = sockets.filter(s =>
            s.user && s.user.usuarioID == usuarioID && s.user.subusuarioID == subusuarioID
        );

        // Default to 'web', but if user is connected via 'celular', use that
        let destino = 'web';
        if (userSockets.length > 0) {
            const sources = userSockets.map(s => (s.handshake.query.source || 'web').toLowerCase());
            if (sources.includes('celular')) {
                destino = 'celular';
            }
        }

        // 1. Guardar en DB
        await pool.request()
            .input('deID', sql.Int, 1) // Admin
            .input('deSubId', sql.Int, 0)
            .input('aID', sql.Int, usuarioID)
            .input('aSubId', sql.Int, subusuarioID)
            .input('cuando', sql.VarChar(12), yyyymmddhhmm)
            .input('titulo', sql.VarChar(100), 'Mensaje de Administrador')
            .input('mensaje', sql.VarChar(sql.MAX), mensaje)
            .input('destino', sql.VarChar(50), destino)
            .query(`INSERT INTO mensaje (deID, deSubId, aID, aSubId, cuando, titulo, mensaje, leido, destino)
                    VALUES (@deID, @deSubId, @aID, @aSubId, @cuando, @titulo, @mensaje, 0, @destino)`);

        // 2. Enviar por Socket si está conectado (reusing userSockets from destino logic above)
        // DEBUG: Imprimir todos los sockets conectados para ver user info
        log(`🔍 [DEBUG SEND-MESSAGE] Buscando sockets para usuarioID: ${usuarioID}, subusuarioID: ${subusuarioID}`);
        userSockets.forEach(s => {
            if (s.user) {
                log(`   - Socket ID: ${s.id} | User: ${s.user.usuarioID}-${s.user.subusuarioID} | Nombre: ${s.user.nombre}`);
            } else {
                log(`   - Socket ID: ${s.id} | User: undefined (Anon??)`);
            }
        });

        const targetSockets = userSockets;

        log(`🎯 [DEBUG SEND-MESSAGE] Sockets encontrados: ${targetSockets.length}`);

        let sentViaSocket = false;
        targetSockets.forEach(s => {
            log(`🚀 [DEBUG SEND-MESSAGE] Enviando mensaje a socket ${s.id}`);
            s.emit('mensaje_admin', {
                titulo: 'Mensaje de Administrador',
                mensaje: mensaje,
                fecha: now.toLocaleDateString(),
                hora: now.toLocaleTimeString()
            });
            sentViaSocket = true;
        });

        res.json({ message: 'Mensaje enviado.', online: sentViaSocket });

    } catch (err) {
        logError('Error admin/send-message:', err);
        res.status(500).json({ message: 'Error enviando mensaje.' });
    }
});

// Endpoint: Sacar usuario (Kick)
app.post('/api/admin/kick-user', authenticateToken, (req, res) => {
    if (req.user.usuarioID !== 1) return res.sendStatus(403);

    const { usuarioID, subusuarioID } = req.body;

    try {
        const sockets = Array.from(io.sockets.sockets.values());
        const targetSockets = sockets.filter(s =>
            s.user && s.user.usuarioID == usuarioID && s.user.subusuarioID == subusuarioID
        );

        targetSockets.forEach(s => {
            // Emit admin_kick to trigger the countdown UI on client
            s.emit('admin_kick', {
                message: 'El administrador ha cerrado su sesión.',
                countdown: 5
            });
            // Delay disconnect to allow client to receive event
            setTimeout(() => s.disconnect(true), 1000);
        });

        res.json({ message: `Usuario desconectado (${targetSockets.length} sesiones cerradas).` });

    } catch (err) {
        logError('Error admin/kick-user:', err);
        res.status(500).json({ message: 'Error desconectando usuario.' });
    }
});

// Endpoint: Obtener mensajes pendientes (No leídos) - SINGLE INSTANCE CHECKED
app.get('/api/mensajeria/pendientes', authenticateToken, async (req, res) => {
    try {
        const pool = req.app.locals.db;
        const { usuarioID, subusuarioID } = req.user;

        // Obtener fecha/hora actual (YYYYMMDDHHMM)
        const ahora = getAhora(12);

        // Obtener mensajes no leidos destinados a este usuario y que ya deban mostrarse
        const result = await pool.request()
            .input('aID', sql.Int, usuarioID)
            .input('aSubId', sql.Int, subusuarioID)
            .input('ahora', sql.VarChar(12), ahora)
            .query(`SELECT mensajeID, titulo, mensaje, cuando ,destino
                    FROM mensaje 
                    WHERE aID = @aID AND aSubId = @aSubId AND leido = 0 AND destino = 'web' 
                    AND cuando <= @ahora
                    ORDER BY cuando ASC`);

        res.json(result.recordset);

    } catch (err) {
        logError('Error recuperando mensajes pendientes:', err);
        res.status(500).json({ message: 'Error interno.' });
    }
});

// Endpoint: Marcar mensajes como leídos
app.put('/api/mensajeria/marcar-leidos', authenticateToken, async (req, res) => {
    try {
        const { mensajeIDs } = req.body;
        if (!mensajeIDs || !Array.isArray(mensajeIDs) || mensajeIDs.length === 0) {
            return res.status(400).json({ message: 'No se proporcionaron IDs de mensajes.' });
        }

        const pool = req.app.locals.db;

        // Usamos una lista de IDs para actualizar
        // SQL Server no soporta arrays nativos fácilmente en IN, así que iteramos o usamos STRING_SPLIT si fuera string.
        // Dado el volumen bajo, iterar en transacción es aceptable, o construir query dinámica.
        // Opción segura: Query dinámica con parámetros (limitado a 2100 params) o Table Valued Parameter.
        // Simplificación: Un UPDATE por ID o string list.
        // Construyamos una lista para IN (...)

        // Validación de que son enteros
        const safeIDs = mensajeIDs.filter(id => Number.isInteger(id)).join(',');

        if (safeIDs) {
            await pool.request()
                .query(`UPDATE mensaje SET leido = 1 WHERE mensajeID IN (${safeIDs})`);
        }

        res.json({ message: 'Mensajes marcados como leídos.' });

    } catch (err) {
        logError('Error marcando mensajes como leídos:', err);
        res.status(500).json({ message: 'Error interno.' });
    }
});

// Endpoint para obtener salas de chat activas
app.get('/api/admin/chat-rooms', authenticateToken, (req, res) => {
    if (req.user.usuarioID !== 1) {
        return res.status(403).json({ message: 'No autorizado.' });
    }

    try {
        const roomsInfo = [];
        const rooms = io.sockets.adapter.rooms;
        const connectedSockets = io.sockets.sockets;

        rooms.forEach((socketIds, roomId) => {
            // Filtrar solo salas de chat generadas (empiezan con room_)
            if (roomId.startsWith('room_')) {
                const miembros = [];
                socketIds.forEach(socketId => {
                    const s = connectedSockets.get(socketId);
                    if (s && s.user) {
                        miembros.push({
                            nombre: s.user.nombre,
                            usuarioID: s.user.usuarioID,
                            subusuarioID: s.user.subusuarioID
                        });
                    }
                });

                // Si no hay miembros conectados, igual la mostramos
                const creador = miembros.length > 0 ? miembros[0] : { nombre: 'Desconocido' };

                roomsInfo.push({
                    id: roomId,
                    creador: creador,
                    miembros: miembros
                });
            }
        });

        res.json(roomsInfo);
    } catch (err) {
        logError('Error admin/chat-rooms:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Servir archivos estáticos (HTML, CSS, JS, imágenes) DESPUÉS de definir las rutas de la API.
// Si una petición no coincide con ninguna ruta de API, Express buscará un archivo aquí.
app.use(express.static('.'));

server.listen(PORT, () => {
    log(`Servidor corriendo en http://localhost:${PORT}`);

});






// Endpoint para obtener usuarios para el chat (con estado online)
app.get('/api/chat/usuarios', authenticateToken, async (req, res) => {
    try {
        const pool = req.app.locals.db;
        const usuarioID = req.user.usuarioID;
        const subusuarioID = req.user.subusuarioID; // El usuario que solicita

        let query = '';
        if (usuarioID === 0 || usuarioID === 100) { // Asumimos 100 como admin también o lógica especial
            // Admin ve a todos o lógica específica. 
            // Según requerimiento: "si el logueado es administrador (usuarioid=0) todos los usuarios, si es otro usuario, solo los de su mismo usuarioID"
            // NOTA: El usuario 100 (BiPoint) parece ser admin en los logs, así que lo incluyo.
            if (usuarioID === 0) {
                query = 'SELECT usuarioID, subusuarioID, nombre FROM usuario WHERE activohasta >= CAST(CONVERT(VARCHAR(8), GETDATE(), 112) AS INT)';
            } else {
                // Si no es 0, solo los de su grupo
                query = 'SELECT usuarioID, subusuarioID, nombre FROM usuario WHERE usuarioID = @usuarioID AND activohasta >= CAST(CONVERT(VARCHAR(8), GETDATE(), 112) AS INT)';
            }
        } else {
            query = 'SELECT usuarioID, subusuarioID, nombre FROM usuario WHERE usuarioID = @usuarioID AND activohasta >= CAST(CONVERT(VARCHAR(8), GETDATE(), 112) AS INT)';
        }

        const request = pool.request();
        if (usuarioID !== 0) request.input('usuarioID', sql.Int, usuarioID);

        const result = await request.query(query);
        let usuarios = result.recordset;

        // Filtrar al propio usuario que solicita (opcional, pero lógico no invitarse a sí mismo)
        log(`?? DEBUG API DB Result: ${usuarios.length} usuarios encontrados. IDs:`, usuarios.map(u => `${u.usuarioID}-${u.subusuarioID}`).join(', '));
        usuarios = usuarios.filter(u => !(u.usuarioID === usuarioID && u.subusuarioID === subusuarioID));

        // Determinar estado online verificado sockets conectados
        // io.sockets.sockets es un Map en versiones recientes
        const connectedSockets = Array.from(io.sockets.sockets.values());
        log(`?? DEBUG /api/chat/usuarios: ${connectedSockets.length} sockets conectados. IDs:`, connectedSockets.map(s => s.user ? `${s.user.usuarioID}-${s.user.subusuarioID}` : 'anon').join(', '));

        usuarios = usuarios.map(u => {
            // Verificar si hay algún socket conectado para este usuarioID+subusuarioID
            // Usamos == para evitar problemas de tipos (string vs int)
            const isOnline = connectedSockets.some(s =>
                s.user && s.user.usuarioID == u.usuarioID && s.user.subusuarioID == u.subusuarioID
            );
            return {
                ...u,
                online: isOnline
            };
        });

        res.json(usuarios);

    } catch (err) {
        logError('Error al obtener usuarios para chat:', err);
        res.status(500).json({ message: 'Error interno.' });
    }
});


// --- Servir archivos estáticos de uploads ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Servir archivos PWA sin caché para evitar problemas de actualización ---
app.use('/pwa', (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
    next();
}, express.static(path.join(__dirname, 'pwa')));

// --- Servir index.html SIN CACHÉ ---
app.get(['/', '/index.html'], (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Servir archivos estáticos (HTML, CSS, JS, imágenes) DESPUÉS de definir las rutas de la API.
// Si una petición no coincide con ninguna ruta de API, Express buscará un archivo aquí.
app.use(express.static('.'));

// --- Endpoint para subir imágenes de chat ---
app.post('/api/chat/upload-image', authenticateToken, uploadChatImage.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se recibió ninguna imagen.' });
        }

        // Construir URL relativa para el cliente
        const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const imageUrl = `/uploads/chat/${today}/${req.file.filename}`;

        log(`📸 Imagen subida: ${imageUrl} (${(req.file.size / 1024).toFixed(2)} KB)`);

        res.json({
            success: true,
            url: imageUrl,
            size: req.file.size,
            mimetype: req.file.mimetype
        });
    } catch (err) {
        logError('Error al subir imagen de chat:', err);
        res.status(500).json({ message: 'Error al procesar la imagen.' });
    }
});

// --- Endpoint Mensajería ---
app.post('/api/mensajeria/guardar', authenticateToken, async (req, res) => {
    try {
        const { destinatarios, destinos, fecha, hora, titulo, mensaje } = req.body;
        const deID = req.user.usuarioID;
        const deSubId = req.user.subusuarioID;

        if (!destinatarios || destinatarios.length === 0) {
            return res.status(400).json({ message: 'No hay destinatarios seleccionados.' });
        }

        const pool = req.app.locals.db;
        // FORMATO: YYYYMMDDHHMM (12 chars) para coincidir con el resto del sistema
        const cuando = fecha.replace(/-/g, '') + hora.replace(/:/g, '');

        // Default destinos si no vienen (compatibilidad)
        const canales = (destinos && destinos.length > 0) ? destinos : ['web'];

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            for (const dest of destinatarios) {
                for (const canal of canales) {
                    const request = new sql.Request(transaction);
                    await request
                        .input('deID', sql.Int, deID)
                        .input('deSubId', sql.Int, deSubId)
                        .input('aID', sql.Int, dest.usuarioID)
                        .input('aSubId', sql.Int, dest.subusuarioID)
                        .input('cuando', sql.VarChar(12), cuando)
                        .input('titulo', sql.VarChar(100), titulo)
                        .input('mensaje', sql.VarChar(sql.MAX), mensaje)
                        .input('destino', sql.VarChar(50), canal.toLowerCase()) // 'web', 'celular', 'telegram'
                        .query(`
                            INSERT INTO mensaje (deID, deSubId, aID, aSubId, cuando, titulo, mensaje, leido, destino)
                            VALUES (@deID, @deSubId, @aID, @aSubId, @cuando, @titulo, @mensaje, 0, @destino)
                        `);
                }
            }
            await transaction.commit();

            // Verificar si hay que enviar notificaciones inmediatas
            // Usamos getAhora(12) que es lo que espera enviarMsgPendientes
            if (getAhora(12) >= cuando) {
                // Disparamos proceso de envío sin esperar (fire & forget) o esperamos si es crítico
                enviarMsgPendientes();
            }

            res.json({ message: 'Mensajes programados correctamente.' });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (err) {
        logError('Error al guardar mensajes:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Endpoint para subir foto de usuario (PWA)
app.post('/api/pwa/upload-photo', authenticateToken, uploadUserPhoto.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se recibió ninguna imagen.' });
        }

        const { usuarioID, subusuarioID } = req.user;
        const pool = app.locals.db;
        const appUrl = process.env.URLAPLICACION || 'http://localhost:911/';

        // Construir la URL completa
        // NOTA: Asegurarse de que appUrl termine en /
        const baseUrl = appUrl.endsWith('/') ? appUrl : appUrl + '/';
        const photoUrl = `${baseUrl}uploads/fotousuarios/${req.file.filename}`;

        // Actualizar o Insertar en usuario_data
        // Primero verificamos si existe
        const check = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .input('subusuarioID', sql.Int, subusuarioID)
            .input('param', sql.VarChar(50), 'foto')
            .query('SELECT 1 FROM usuario_data WHERE usuarioID = @usuarioID AND subusuarioID = @subusuarioID AND param = @param');

        if (check.recordset.length > 0) {
            // Update
            await pool.request()
                .input('usuarioID', sql.Int, usuarioID)
                .input('subusuarioID', sql.Int, subusuarioID)
                .input('param', sql.VarChar(50), 'foto')
                .input('valor', sql.VarChar(255), photoUrl)
                .query('UPDATE usuario_data SET valor = @valor WHERE usuarioID = @usuarioID AND subusuarioID = @subusuarioID AND param = @param');
        } else {
            // Insert
            await pool.request()
                .input('usuarioID', sql.Int, usuarioID)
                .input('subusuarioID', sql.Int, subusuarioID)
                .input('param', sql.VarChar(50), 'foto')
                .input('valor', sql.VarChar(255), photoUrl)
                .query('INSERT INTO usuario_data (usuarioID, subusuarioID, param, valor) VALUES (@usuarioID, @subusuarioID, @param, @valor)');
        }

        log(`📸 Foto de perfil actualizada para usuario ${usuarioID}-${subusuarioID}: ${photoUrl}`);

        res.json({
            success: true,
            message: 'Foto de perfil actualizada correctamente.',
            url: photoUrl
        });

    } catch (err) {
        logError('Error al subir foto de perfil:', err);
        res.status(500).json({ message: 'Error interno al guardar la foto.' });
    }
});

