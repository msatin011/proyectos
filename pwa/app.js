// Debug Version
console.log('--- APP V10 LOADED (Network Only) ---');
// alert('DEBUG: App Version 5 Loaded'); // Removed

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Primero intentamos desregistrar cualquier SW anterior si hay problemas raros (opcional, pero útil ahora)
        // navigator.serviceWorker.getRegistrations().then(regs => {
        //     for(let reg of regs) { reg.unregister(); } 
        // }); 
        // ^ Comentado porque queremos que funcione el nuevo "Network Only" SW, no quitarlo.

        navigator.serviceWorker.register('service-worker-app.js')
            .then(reg => {
                console.log('SW registered!', reg);
                // Forzar actualización inmediata
                reg.update();
            })
            .catch(err => console.log('SW registration failed', err));
    });
}

// UI Elements
const splashScreen = document.getElementById('splash-screen');
// ...

// PWA Install Prompt Logic
let deferredPrompt;
const installItem = document.getElementById('install-item');
const installBtn = document.getElementById('install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Update UI notify the user they can install the PWA
    if (installItem) installItem.classList.remove('hidden');
    console.log('beforeinstallprompt fired');
});

if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        // We've used the prompt, clear it
        deferredPrompt = null;
        installItem.classList.add('hidden');
    });
}

window.addEventListener('appinstalled', () => {
    // Hide the app-provided install promotion
    if (installItem) installItem.classList.add('hidden');
    // Clear the deferredPrompt so it can be garbage collected
    deferredPrompt = null;
    console.log('PWA was installed');
});
const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const menuBtn = document.getElementById('menu-btn');
const drawer = document.getElementById('drawer');
const drawerOverlay = document.getElementById('drawer-overlay');
const logoutBtn = document.getElementById('logout-btn');
const userDisplay = document.getElementById('user-display');

// State
const DEFAULT_PROFILE_SVG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%239ca3af"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-2.21 0-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';
let currentUser = null;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // 1. Splash Screen Logic (4 seconds)
    setTimeout(() => {
        hideSplash();
    }, 4000);

    // 2. Load stored credentials
    const savedCuit = localStorage.getItem('savedCuit');
    const savedU = localStorage.getItem('savedU');
    const savedPassword = localStorage.getItem('savedPassword');

    if (savedCuit) document.getElementById('cuit').value = savedCuit;
    if (savedU) document.getElementById('usuario').value = savedU;
    if (savedPassword) document.getElementById('password').value = savedPassword;

    // Initial check for session (optional, but good for PWA)
    const token = sessionStorage.getItem('authToken');
    if (token) {
        // Validation could happen here, for now assume valid if we want auto-login
        // But for this task, we'll stick to the flow: Splash -> Login (if not logged in)
        // But for this task, we'll stick to the flow: Splash -> Login (if not logged in)
        if (!window.socketInitialized) {
            initializeWebSockets();
            window.socketInitialized = true;
        }
    }
});

function hideSplash() {
    splashScreen.classList.add('opacity-0');
    setTimeout(() => {
        splashScreen.classList.add('hidden');

        // Show login if not logged in, else App
        // For this demo, always show login first as requested
        loginScreen.classList.remove('hidden');
    }, 1000); // Wait for transition
}

// Login Logic
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cuit = document.getElementById('cuit').value;
    const u = document.getElementById('usuario').value;



    const password = document.getElementById('password').value;

    loginError.classList.add('hidden');

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cuit: cuit, u: u, password: password, isPwa: true })
        });

        const data = await response.json();

        if (response.ok) {
            // Success
            currentUser = data.user;
            sessionStorage.setItem('authToken', data.token);
            sessionStorage.setItem('userData', JSON.stringify(data.user));

            // Save credentials for next time
            localStorage.setItem('savedCuit', cuit);
            localStorage.setItem('savedU', u);
            localStorage.setItem('savedPassword', password);

            userDisplay.textContent = currentUser.nombre;

            // Update Header Profile Photo
            const headerProfileImg = document.getElementById('header-profile-img');
            if (headerProfileImg) {
                if (currentUser.foto) {
                    headerProfileImg.src = currentUser.foto;
                } else {
                    headerProfileImg.src = 'usuario.png';
                }
            }

            loginScreen.classList.add('hidden');
            appScreen.classList.remove('hidden');
            loginScreen.classList.add('hidden');
            appScreen.classList.remove('hidden');
            if (!window.socketInitialized) {
                initializeWebSockets();
                window.socketInitialized = true;
            }
        } else {
            // Error
            loginError.textContent = data.message || 'Error al iniciar sesión';
            loginError.classList.remove('hidden');
        }

    } catch (error) {
        console.error(error);
        loginError.textContent = 'Error de conexión';
        loginError.classList.remove('hidden');
    }
});

// Menu Logic
function toggleMenu() {
    const isClosed = drawer.classList.contains('-translate-x-full');
    if (isClosed) {
        // Open
        drawer.classList.remove('-translate-x-full');
        drawerOverlay.classList.remove('hidden', 'opacity-0');
        drawerOverlay.classList.add('opacity-100');
    } else {
        // Close
        drawer.classList.add('-translate-x-full');
        drawerOverlay.classList.remove('opacity-100');
        setTimeout(() => drawerOverlay.classList.add('hidden'), 300); // wait for fade
    }
}

// Password Toggle Logic
const togglePasswordBtn = document.getElementById('toggle-password');
const passwordInput = document.getElementById('password');

if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        // Toggle Icon
        if (type === 'text') {
            // Show Eye Slash
            togglePasswordBtn.innerHTML = `
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
            `;
        } else {
            // Show Eye
            togglePasswordBtn.innerHTML = `
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            `;
        }
    });
}

menuBtn.addEventListener('click', toggleMenu);
drawerOverlay.addEventListener('click', toggleMenu);

// Navigation Logic
window.showView = function (viewName) {
    const views = ['home', 'config', 'messages', 'team-chat', 'send-message'];

    views.forEach(v => {
        const el = document.getElementById(`view-${v}`);
        if (el) {
            if (v === viewName) {
                el.classList.remove('hidden');
                // Load data if needed
                if (v === 'messages') {
                    loadMessages();
                } else if (v === 'team-chat') {
                    // Force Layout Fix (Absolute positioning to ensure visibility)
                    el.classList.remove('hidden');
                    el.style.display = 'flex';
                    el.style.position = 'absolute';
                    el.style.top = '0';
                    el.style.left = '0';
                    el.style.right = '0';
                    el.style.bottom = '0';
                    el.style.zIndex = '50';
                    el.style.backgroundColor = 'white';
                    loadChatUsers();
                } else if (v === 'send-message') {
                    loadSendMessageUsers();
                    // Set default date/time
                    document.getElementById('send-date').valueAsDate = new Date();
                    const now = new Date();
                    const timeString = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
                    document.getElementById('send-time').value = timeString;
                }
            } else {
                el.classList.add('hidden');
            }
        }
    });

    // Close menu after selection (mobile friendly)
    if (!drawer.classList.contains('-translate-x-full')) {
        toggleMenu();
    }
}

// Photo Upload Logic
// Photo Logic (Header & Modal)
const headerProfileImg = document.getElementById('header-profile-img');
const photoModal = document.getElementById('photo-options-modal');
const btnCamera = document.getElementById('btn-camera');
const btnGallery = document.getElementById('btn-gallery');
const btnDeletePhoto = document.getElementById('btn-delete-photo');
const btnCancelPhoto = document.getElementById('btn-cancel-photo');
const headerPhotoInput = document.getElementById('header-photo-input');

if (headerProfileImg) {
    headerProfileImg.addEventListener('click', () => {
        // Show options
        photoModal.classList.remove('hidden');
    });
}

if (btnCancelPhoto) {
    btnCancelPhoto.addEventListener('click', () => {
        photoModal.classList.add('hidden');
    });
}

// 1. Camera (Selfie)
if (btnCamera) {
    btnCamera.addEventListener('click', () => {
        // Force camera
        if (headerPhotoInput) {
            headerPhotoInput.setAttribute('capture', 'user');
            headerPhotoInput.click();
        }
    });
}

// 2. Gallery
if (btnGallery) {
    btnGallery.addEventListener('click', () => {
        // Unlock capture to allow file picker
        if (headerPhotoInput) {
            headerPhotoInput.removeAttribute('capture');
            headerPhotoInput.click();
        }
    });
}

// 2. Handle File Selection (Auto Upload)
if (headerPhotoInput) {
    headerPhotoInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Close modal
        photoModal.classList.add('hidden');

        // Optimistic UI Update (optional)
        // headerProfileImg.src = URL.createObjectURL(file);

        const formData = new FormData();
        formData.append('photo', file);

        try {
            const token = sessionStorage.getItem('authToken');
            // Show loading indicator or toast?
            // For now, simple alert or console

            const response = await fetch('/api/pwa/upload-photo', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                // Update Image src with timestamp to force refresh
                if (headerProfileImg && data.photoUrl) {
                    headerProfileImg.src = data.photoUrl + '?t=' + new Date().getTime();
                }
                // Update currentUser logic if needed
                if (currentUser) {
                    currentUser.foto = data.photoUrl;
                    sessionStorage.setItem('userData', JSON.stringify(currentUser));
                }
                showToast('Foto actualizada', 'success');
            } else {
                showToast('Error al subir foto', 'error');
            }

        } catch (error) {
            console.error(error);
            showToast('Error de conexión', 'error');
        } finally {
            headerPhotoInput.value = ''; // Reset
        }
    });
}

// 3. Delete Photo
if (btnDeletePhoto) {
    btnDeletePhoto.addEventListener('click', async () => {
        if (!confirm('¿Estás seguro de eliminar tu foto de perfil?')) return;

        photoModal.classList.add('hidden');

        try {
            const token = sessionStorage.getItem('authToken');
            const response = await fetch('/api/pwa/photo', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok || response.status === 204) {
                // Reset to default icon
                if (headerProfileImg) {
                    headerProfileImg.src = 'usuario.png';
                }
                if (currentUser) {
                    currentUser.foto = null;
                    sessionStorage.setItem('userData', JSON.stringify(currentUser));
                }
                showToast('Foto eliminada', 'success');
            } else {
                showToast('Error al eliminar foto', 'error');
            }

        } catch (error) {
            console.error(error);
            showToast('Error de conexión', 'error');
        }
    });
}

// Logout
logoutBtn.addEventListener('click', () => {
    sessionStorage.clear();
    currentUser = null;
    toggleMenu();
    loginScreen.classList.remove('hidden');
    loginForm.reset();
});


// Messages Logic
async function loadMessages() {
    const listUnread = document.getElementById('content-unread');
    const listRead = document.getElementById('content-read');
    const countUnread = document.getElementById('count-unread-tab');
    const countRead = document.getElementById('count-read-tab');

    // Reset UI
    listUnread.innerHTML = '<p class="text-center text-gray-500 py-4">Cargando...</p>';
    listRead.innerHTML = '<p class="text-center text-gray-500 py-4">Cargando...</p>';

    try {
        const token = sessionStorage.getItem('authToken');

        // Parallel Fetch
        const [resUnread, resRead] = await Promise.all([
            fetch('/api/mensajeria/pendientes', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/mensajeria/leidos', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (resUnread.ok && resRead.ok) {
            const unreadMsgs = await resUnread.json();
            const readMsgs = await resRead.json();

            // Update Counts
            countUnread.textContent = unreadMsgs.length;
            countRead.textContent = readMsgs.length;

            // Render Unread
            renderMessageList(listUnread, unreadMsgs, false); // false = no show 'Marcar leido' btn (auto-read)

            // Render Read
            renderMessageList(listRead, readMsgs, true); // true = read state (no btn needed either per req)

            // Auto-Read Logic: Mark ALL loaded unread messages as read silently
            if (unreadMsgs.length > 0) {
                const ids = unreadMsgs.map(m => m.mensajeID);
                silentMarkAsRead(ids);
            }

        } else {
            listUnread.innerHTML = '<p class="text-center text-red-500">Error cargando mensajes</p>';
            listRead.innerHTML = '';
        }

    } catch (err) {
        console.error(err);
        listUnread.innerHTML = '<p class="text-center text-red-500">Error de conexión</p>';
    }
}

function renderMessageList(container, messages, isReadSection) {
    if (messages.length === 0) {
        container.innerHTML = `
            <div class="text-center py-6">
                <p class="text-gray-400 text-sm">No hay mensajes ${isReadSection ? 'leídos' : 'nuevos'}</p>
            </div>`;
        return;
    }

    container.innerHTML = '';
    messages.forEach(msg => {
        const el = document.createElement('div');
        // Different style for read vs unread?
        const borderClass = isReadSection ? 'border-gray-300' : 'border-blue-500';
        el.className = `bg-white p-4 rounded-lg shadow border-l-4 ${borderClass} mb-3`;

        // Format Date
        let fechaStr = "Fecha desconocida";
        if (msg.cuando && msg.cuando.length >= 12) {
            const y = msg.cuando.substring(0, 4);
            const m = msg.cuando.substring(4, 6);
            const d = msg.cuando.substring(6, 8);
            const h = msg.cuando.substring(8, 10);
            const min = msg.cuando.substring(10, 12);
            fechaStr = `${d}/${m}/${y} ${h}:${min}`;
        }

        el.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <h3 class="font-bold text-lg text-gray-800">${msg.titulo || 'Sin título'}</h3>
                <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">${fechaStr}</span>
            </div>
            <p class="text-gray-600 mb-3">${msg.mensaje}</p>
            <div class="flex justify-between items-center text-sm text-gray-500">
                <span>De: <span class="font-semibold text-gray-700">${msg.deNombre || 'Sistema'}</span></span>
            </div>
        `;
        container.appendChild(el);
    });
}

async function silentMarkAsRead(ids) {
    if (!ids || ids.length === 0) return;
    try {
        const token = sessionStorage.getItem('authToken');
        await fetch('/api/mensajeria/marcar-leidos', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ mensajeIDs: ids })
        });
        console.log('Auto-read marked for IDs:', ids);
    } catch (e) {
        console.error('Auto-read failed', e);
    }
}

window.switchTab = function (tab) {
    const btnUnread = document.getElementById('tab-btn-unread');
    const btnRead = document.getElementById('tab-btn-read');
    const contentUnread = document.getElementById('content-unread');
    const contentRead = document.getElementById('content-read');

    if (tab === 'unread') {
        contentUnread.classList.remove('hidden');
        contentRead.classList.add('hidden');

        btnUnread.classList.add('text-blue-600', 'border-blue-600');
        btnUnread.classList.remove('text-gray-500');

        btnRead.classList.remove('text-blue-600', 'border-blue-600');
        btnRead.classList.add('text-gray-500');
    } else {
        contentUnread.classList.add('hidden');
        contentRead.classList.remove('hidden');

        btnRead.classList.add('text-blue-600', 'border-blue-600');
        btnRead.classList.remove('text-gray-500');

        btnUnread.classList.remove('text-blue-600', 'border-blue-600');
        btnUnread.classList.add('text-gray-500');
    }
}

// Socket.io Logic
function initializeWebSockets() {
    const token = sessionStorage.getItem('authToken');
    if (!token) return;

    console.log('🔌 Iniciando conexión Socket.io-PWA...');
    // Asumimos que socket.io script ya cargó
    if (typeof io === 'undefined') {
        console.error('Socket.io library not loaded');
        return;
    }

    const socket = io({
        auth: { token },
        query: { source: 'celular' },
        transports: ['websocket'],
        reconnectionAttempts: 10
    });
    window.appSocket = socket;

    socket.on('connect', () => {
        console.log('✅ PWA Conectado a Socket.io:', socket.id);
    });

    socket.on('connect_error', (err) => {
        console.error('❌ Error de conexión Socket.io:', err.message);
    });

    socket.on('force_logout', (data) => {
        console.warn('⚠️ Sesión cerrada por el servidor:', data.reason);
        sessionStorage.clear();
        alert('Sesión cerrada: ' + data.reason);
        window.location.reload();
    });

    // Eventos de Chat
    socket.on('new_message', (data) => {
        if (data.type === 'InvitacionChat') {
            // Mostrar modal de invitación
            if (confirm(`Invitación de chat de ${data.data.solicitante}. ¿Aceptar?`)) {
                socket.emit('accept_invite', { salaID: data.data.salaID });
                enterChatRoom(data.data.salaID, data.data.solicitante);
            }
        }
    });

    socket.on('user_status_change', (data) => {
        // Refrescar lista si estamos en la vista de chat
        const viewChat = document.getElementById('view-team-chat');
        if (viewChat && !viewChat.classList.contains('hidden')) {
            loadChatUsers();
        }
    });

    socket.on('chat_iniciado', (data) => {
        // data: { salaID, miembros }
        enterChatRoom(data.salaID, 'Grupo');
    });

    socket.on('chat_accepted', (data) => {
        // Alguien se unió
        const introMsg = document.getElementById('pwa-intro-msg');
        if (introMsg) introMsg.remove();

        addChatMessage({ de: 'Sistema', texto: `${data.nombre} se unió.`, tipo: 'sistema' });
    });

    socket.on('nuevo_mensaje_sala', (data) => {
        // data: { de, texto, ... }
        if (currentChatRoomID === data.chatRoomID) {
            addChatMessage(data);
        }
    });

    // Iniciar suscripción a Web Push
    subscribeToPush();
}

async function subscribeToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
        const reg = await navigator.serviceWorker.ready;

        // 1. Obtener VAPID Key del servidor
        const configResp = await fetch('/api/config/public');
        const config = await configResp.json();
        const publicVapidKey = config.vapidPublicKey;

        if (!publicVapidKey) {
            console.error('VAPID Key no disponible en servidor');
            return;
        }

        // 2. Suscribirse (o recuperar suscripción existente)
        const subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });

        console.log('✅ Web Push Suscrito:', subscription);

        // 3. Enviar al servidor
        const token = sessionStorage.getItem('authToken');
        // Necesitamos usuarioID y subusuarioID del token o sessionStorage
        const userData = JSON.parse(sessionStorage.getItem('userData'));

        await fetch('/api/save-subscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Endpoint might handle token, but body acts as fallback
            },
            body: JSON.stringify({
                subscription: subscription,
                usuarioID: userData.usuarioID,
                subusuarioID: userData.subusuarioID
            })
        });

    } catch (err) {
        console.error('Error suscribiendo a Web Push:', err);
    }
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Toast Logic
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const el = document.createElement('div');
    el.className = `transform transition-all duration-300 ease-out translate-y-[-100%] opacity-0 pointer-events-auto flex items-center p-4 mb-2 rounded-lg shadow-lg text-white font-semibold ${type === 'error' ? 'bg-red-500' :
        type === 'success' ? 'bg-green-500' :
            'bg-blue-500' // info/default
        }`;

    // Icon based on type
    let icon = '';
    if (type === 'success') icon = '<svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
    else if (type === 'error') icon = '<svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>';
    else icon = '<svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';

    el.innerHTML = `${icon}<span>${message}</span>`;

    container.appendChild(el);

    // Animate In
    requestAnimationFrame(() => {
        el.classList.remove('translate-y-[-100%]', 'opacity-0');
    });

    // Auto Dismiss
    setTimeout(() => {
        el.classList.add('opacity-0', 'translate-y-[-100%]');
        setTimeout(() => el.remove(), 300); // Wait for transition
    }, 1500);
}

window.showView = function (viewName) {
    const views = ['home', 'config', 'messages', 'team-chat', 'send-message'];
    const drawer = document.getElementById('drawer');

    views.forEach(v => {
        const el = document.getElementById(`view-${v}`);
        if (el) {
            if (v === viewName) {
                el.classList.remove('hidden');
                if (v === 'messages') {
                    loadMessages();
                } else if (v === 'team-chat') {
                    // Launch Overlay instead of showing view
                    el.classList.add('hidden'); // Keep it hidden
                    openTeamChatOverlay();
                } else if (v === 'send-message') {
                    loadSendMessageUsers();
                    // Set default date/time
                    document.getElementById('send-date').valueAsDate = new Date();
                    const now = new Date();
                    const timeString = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
                    document.getElementById('send-time').value = timeString;
                }
            } else {
                el.classList.add('hidden');
            }
        }
    });

    // Close menu after selection (mobile friendly)
    if (!drawer.classList.contains('-translate-x-full')) {
        toggleMenu();
    }
}

// --- Team Chat Logic (Overlay Mode) ---
let currentChatRoomID = null;
let teamChatOverlay = null;

function openTeamChatOverlay() {
    // 1. Check if exists
    if (document.getElementById('team-chat-overlay')) return;

    // 2. Create Overlay
    teamChatOverlay = document.createElement('div');
    teamChatOverlay.id = 'team-chat-overlay';
    teamChatOverlay.className = 'fixed inset-0 z-50 bg-white flex flex-col';
    teamChatOverlay.innerHTML = `
        <header class="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md flex-shrink-0">
            <h1 class="text-xl font-bold">Chat de Equipo</h1>
            <button onclick="closeTeamChatOverlay()" class="text-white font-bold text-lg">✕</button>
        </header>

        <div id="overlay-chat-container" class="flex-grow p-4 overflow-y-auto flex flex-col">
            <p class="text-center text-gray-500 mt-10">Cargando usuarios...</p>
        </div>
    `;

    document.body.appendChild(teamChatOverlay);

    // 3. Load Data
    loadChatUsersOverlay();
}

function closeTeamChatOverlay() {
    if (teamChatOverlay) {
        teamChatOverlay.remove();
        teamChatOverlay = null;
    }
    // Restore Home view selection logic if needed, but for now just close
}

async function loadChatUsersOverlay() {
    const container = document.getElementById('overlay-chat-container');
    if (!container) return;

    try {
        const token = sessionStorage.getItem('authToken');
        const response = await fetch('/api/chat/usuarios', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error al cargar usuarios');

        const users = await response.json();
        window.lastLoadedUsers = users;
        renderChatUsersOverlay(users);

    } catch (e) {
        console.error(e);
        container.innerHTML = `<p class="text-center text-red-500 mt-10">Error: ${e.message}</p>`;
    }
}

function renderChatUsersOverlay(users) {
    const container = document.getElementById('overlay-chat-container');
    if (!container) return;

    try { users.sort((a, b) => (b.online === a.online) ? 0 : b.online ? 1 : -1); } catch (e) { }

    if (users.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 mt-10">No hay usuarios disponibles.</p>';
        return;
    }

    let html = '<div class="space-y-3 pb-20">'; // Padding for bottom button

    users.forEach((u) => {
        const key = `${u.usuarioID}-${u.subusuarioID}`;
        const isSelected = selectedChatUsers.has(key);
        const isOnline = u.online;
        const charInitial = (u.nombre && u.nombre.length > 0) ? u.nombre.charAt(0) : '?';

        const baseClasses = "flex items-center p-4 rounded-lg border shadow-sm transition-all select-none";
        const stateClasses = isOnline
            ? (isSelected ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500' : 'bg-white border-gray-200')
            : 'bg-gray-50 border-gray-100 opacity-60 grayscale';

        html += `
            <div onclick="toggleChatSelectionOverlay(${u.usuarioID}, ${u.subusuarioID}, '${u.nombre}', ${isOnline})" 
                 class="${baseClasses} ${stateClasses}">
                
                <div class="relative w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-xl text-blue-600 mr-4">
                    ${charInitial}
                    <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'}"></div>
                </div>
                
                <div class="flex-1">
                    <div class="font-bold text-gray-800 text-lg">${u.nombre}</div>
                    <div class="text-sm text-gray-500">${isOnline ? 'En línea' : 'Desconectado'}</div>
                </div>

                <div class="w-8 h-8 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}">
                     ${isSelected ? '<svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>' : ''}
                </div>
            </div>
        `;
    });
    html += '</div>';

    // Button fixed bottom
    html += `
        <div class="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg z-50">
            <button id="btn-invite-chat-overlay" onclick="sendBulkInvitesOverlay()" 
                class="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-lg">
                Invitar al Chat (${selectedChatUsers.size})
            </button>
        </div>
    `;

    container.innerHTML = html;
    updateInviteButtonStateOverlay();
}

function toggleChatSelectionOverlay(uid, subid, nombre, isOnline) {
    if (!isOnline && isOnline !== undefined) {
        showToast('No puedes seleccionar usuarios desconectados', 'info');
        return;
    }
    const key = `${uid}-${subid}`;
    if (selectedChatUsers.has(key)) selectedChatUsers.delete(key);
    else selectedChatUsers.set(key, { usuarioID: uid, subusuarioID: subid, nombre: nombre });

    if (window.lastLoadedUsers) renderChatUsersOverlay(window.lastLoadedUsers);
}

function updateInviteButtonStateOverlay() {
    const btn = document.getElementById('btn-invite-chat-overlay');
    if (btn) {
        btn.innerHTML = `Invitar al Chat (${selectedChatUsers.size})`;
        btn.disabled = selectedChatUsers.size === 0;
    }
}

function sendBulkInvitesOverlay() {
    if (selectedChatUsers.size === 0) return;
    if (window.appSocket) {
        const targets = Array.from(selectedChatUsers.values());
        window.appSocket.emit('invite_users', { targetUsuarioIDs: targets });
        // Don't close immediately, wait for 'chat_iniciado'
        selectedChatUsers.clear();
        updateInviteButtonStateOverlay();
        if (window.lastLoadedUsers) renderChatUsersOverlay(window.lastLoadedUsers);
    }
}

// --- Team Chat Logic ---
// let currentChatRoomID = null; // Moved declaration to overlay section
// No longer needed as a separate function, use openTeamChatOverlay()
// async function loadChatUsers() {
//     const container = document.getElementById('chat-container');
//     if (!container) return;

//     container.innerHTML = '<p class="text-center text-gray-500 p-4">Cargando usuarios...</p>';

//     try {
//         const token = sessionStorage.getItem('authToken');
//         const response = await fetch('/api/chat/usuarios', {
//             headers: { 'Authorization': `Bearer ${token}` }
//         });

//         if (!response.ok) throw new Error('Error al cargar usuarios');

//         const users = await response.json();
//         window.lastLoadedUsers = users; // Cache for re-render
//         renderChatUsers(users);

//     } catch (e) {
//         console.error(e);
//         container.innerHTML = '<p class="text-center text-red-500 p-4">Error cargando usuarios.</p>';
//     }
// }

// State for selection
let selectedChatUsers = new Map(); // Key: "uid-subid", Value: {uid, subid, nombre}

// No longer needed as a separate function, use renderChatUsersOverlay()
// function renderChatUsers(users) {
//     const container = document.getElementById('chat-container');
//     if (!container) return;

//     // Sort: Online first
//     try {
//         users.sort((a, b) => (b.online === a.online) ? 0 : b.online ? 1 : -1);
//     } catch (e) { console.error(e); }

//     if (users.length === 0) {
//         container.innerHTML = '<p class="text-center text-gray-500 p-4">No hay usuarios disponibles.</p>';
//         return;
//     }

//     // Direct children for flex-col parent
//     let html = '';

//     // 1. List (Scrollable)
//     html += '<div class="flex-1 overflow-y-auto space-y-2 mb-2 min-h-0">';

//     users.forEach((u) => {
//         const key = `${u.usuarioID}-${u.subusuarioID}`;
//         const isSelected = selectedChatUsers.has(key);
//         const isOnline = u.online;

//         // Styles
//         const baseClasses = "flex items-center p-3 rounded border transition-all select-none";
//         const stateClasses = isOnline
//             ? (isSelected ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 cursor-pointer' : 'bg-white border-green-200 cursor-pointer hover:bg-blue-50')
//             : 'bg-gray-100 border-gray-100 opacity-60 cursor-not-allowed grayscale';

//         // Safe Strings
//         const charInitial = (u.nombre && u.nombre.length > 0) ? u.nombre.charAt(0) : '?';

//         html += `
//             <div onclick="toggleChatSelection(${u.usuarioID}, ${u.subusuarioID}, '${u.nombre}', ${isOnline})" 
//                  id="user-row-${key}"
//                  class="${baseClasses} ${stateClasses}">

//                 <div class="relative w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 mr-3">
//                     ${charInitial}
//                     <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'}"></div>
//                 </div>

//                 <div class="flex-1">
//                     <div class="font-bold text-gray-800">${u.nombre}</div>
//                     <div class="text-xs text-gray-500">${isOnline ? 'En línea' : 'Desconectado'}</div>
//                 </div>

//                 <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}">
//                      ${isSelected ? '<svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>' : ''}
//                 </div>
//             </div>
//         `;
//     });

//     html += '</div>'; // End List

//     // 2. Button Area (Fixed bottom)
//     html += `
//         <div class="pt-3 border-t border-gray-100 mt-auto">
//             <button id="btn-invite-chat" onclick="sendBulkInvites()" 
//                 class="w-full bg-blue-600 text-white font-bold py-3 rounded-lg shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed transition-all">
//                 Invitar al Chat (${selectedChatUsers.size})
//             </button>
//         </div>
//     `;

//     container.innerHTML = html;
//     updateInviteButtonState();
// }

// No longer needed as a separate function, use toggleChatSelectionOverlay()
// function toggleChatSelection(uid, subid, nombre, isOnline) {
//     if (!isOnline && isOnline !== undefined) {
//         showToast('No puedes seleccionar usuarios desconectados', 'info');
//         return;
//     }

//     const key = `${uid}-${subid}`;
//     if (selectedChatUsers.has(key)) {
//         selectedChatUsers.delete(key);
//     } else {
//         selectedChatUsers.set(key, { usuarioID: uid, subusuarioID: subid, nombre: nombre });
//     }

//     // Re-render
//     if (window.lastLoadedUsers) {
//         renderChatUsers(window.lastLoadedUsers);
//     }
// }

// No longer needed as a separate function, use updateInviteButtonStateOverlay()
// function updateInviteButtonState() {
//     const btn = document.getElementById('btn-invite-chat');
//     if (btn) {
//         btn.innerHTML = `Invitar al Chat (${selectedChatUsers.size})`;
//         btn.disabled = selectedChatUsers.size === 0;
//     }
// }

// No longer needed as a separate function, use sendBulkInvitesOverlay()
// function sendBulkInvites() {
//     if (selectedChatUsers.size === 0) return;

//     if (window.appSocket) {
//         const targets = Array.from(selectedChatUsers.values());
//         window.appSocket.emit('invite_users', {
//             targetUsuarioIDs: targets
//         });

//         showToast(`Enviando ${targets.length} invitaciones...`, 'info');

//         // Clear selection
//         selectedChatUsers.clear();
//         updateInviteButtonState();
//         if (window.lastLoadedUsers) renderChatUsers(window.lastLoadedUsers);
//     }
// }

function enterChatRoom(salaID, title) {
    currentChatRoomID = salaID;

    // Launch overlay if not open (e.g. from notification)
    if (!document.getElementById('team-chat-overlay')) {
        openTeamChatOverlay();
    }

    const container = document.getElementById('overlay-chat-container');
    if (!container) return;

    // Switch to Chat Interface
    container.innerHTML = `
        <div class="flex flex-col h-full">
            <div class="bg-blue-50 p-2 text-sm font-bold text-blue-800 mb-2 rounded flex justify-between">
                <span>Chat: ${title}</span>
                <button onclick="leaveChat()" class="text-red-500 font-bold border border-red-200 px-2 rounded bg-white">Volver</button>
            </div>
            <div id="pwa-chat-messages" class="flex-1 overflow-y-auto space-y-2 mb-2 p-2 border rounded bg-gray-50">
                <div id="pwa-intro-msg" class="text-center text-xs text-gray-400 flex flex-col items-center">
                    <span>Inicio del chat. Esperando aceptación(es)...</span>
                    <img src="/img/waiting.gif" alt="Esperando..." class="h-8 mt-2">
                </div>
                <!-- Typing Indicator (Hidden by default) -->
                <div id="pwa-typing-indicator" class="hidden">
                     <div class="typing-indicator"><span></span><span></span><span></span></div>
                </div>
            </div>
            <form onsubmit="sendChatMessage(event)" class="flex gap-2">
                <input type="text" id="pwa-chat-input" class="flex-1 border rounded px-3 py-2 text-sm" placeholder="Mensaje..." autocomplete="off">
                <button type="submit" class="bg-blue-600 text-white rounded px-4 py-2 font-bold">></button>
            </form>
        </div>
    `;

    // --- Typing Logic PWA ---
    const chatInput = document.getElementById('pwa-chat-input');
    let typingTimeout = null;
    let isTyping = false;

    // Emitir escribiendo
    if (window.appSocket) {
        chatInput.addEventListener('input', () => {
            if (!isTyping) {
                isTyping = true;
                window.appSocket.emit('typing', { salaID: currentChatRoomID });
            }

            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                isTyping = false;
                window.appSocket.emit('stop_typing', { salaID: currentChatRoomID });
            }, 2000);
        });

        // Escuchar escribiendo (Clean first)
        window.appSocket.off('typing');
        window.appSocket.on('typing', (data) => {
            if (data.salaID === currentChatRoomID) {
                const ind = document.getElementById('pwa-typing-indicator');
                if (ind) {
                    ind.classList.remove('hidden');
                    // Scroll to bottom
                    const messagesDiv = document.getElementById('pwa-chat-messages');
                    if (messagesDiv) messagesDiv.scrollTop = messagesDiv.scrollHeight;
                }
            }
        });

        window.appSocket.off('stop_typing');
        window.appSocket.on('stop_typing', (data) => {
            if (data.salaID === currentChatRoomID) {
                const ind = document.getElementById('pwa-typing-indicator');
                if (ind) ind.classList.add('hidden');
            }
        });
    }
}

function leaveChat() {
    if (window.appSocket && currentChatRoomID) {
        window.appSocket.emit('salir_sala', { salaID: currentChatRoomID });
    }
    currentChatRoomID = null;

    // Switch content back to list
    loadChatUsersOverlay();
}



window.sendChatMessage = function (e) {
    e.preventDefault();
    if (!currentChatRoomID || !window.appSocket) return;

    const input = document.getElementById('pwa-chat-input');
    const text = input.value.trim();

    if (text) {
        window.appSocket.emit('mensaje_chat', { salaID: currentChatRoomID, texto: text });
        input.value = '';
    }
}

function addChatMessage(msg) {
    const container = document.getElementById('pwa-chat-messages');
    if (!container) return; // Maybe exited

    // Check if me (Using currentUser global or parse session)
    const me = JSON.parse(sessionStorage.getItem('userData'));
    const isMe = (msg.deID === me.usuarioID && msg.deSubID === me.subusuarioID);

    const div = document.createElement('div');
    if (msg.tipo === 'sistema') {
        div.className = 'text-center text-xs text-gray-400 my-1';
        div.textContent = msg.texto;
    } else {
        div.className = `flex w-full ${isMe ? 'justify-end' : 'justify-start'}`;
        div.innerHTML = `
            <div class="max-w-[85%] rounded px-3 py-2 text-sm ${isMe ? 'bg-blue-600 text-white' : 'bg-white border text-gray-800'}">
                ${!isMe ? `<div class="text-[10px] opacity-75 mb-1">${msg.de}</div>` : ''}
                <div>${msg.texto || ''}</div>
                 ${msg.imagen ? `<img src="${msg.imagen}" class="mt-1 rounded max-w-full">` : ''}
            </div>
        `;
    }

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// Global scope for onclick
window.markAsRead = async function (id) {
    if (!confirm('¿Marcar como leído?')) return;

    try {
        const token = sessionStorage.getItem('authToken');
        const response = await fetch('/api/mensajeria/marcar-leidos', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ mensajeIDs: [id] })
        });

        if (response.ok) {
            // Reload list
            loadMessages();
            showToast('Mensaje marcado como leído', 'success');
        } else {
            showToast('Error al actualizar', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Error de conexión', 'error');
    }
}

// --- Send Message Feature Logic ---

window.toggleSubmenu = function (id) {
    const el = document.getElementById(id);
    const arrow = document.getElementById('arrow-' + id);
    if (el) {
        el.classList.toggle('hidden');
        if (arrow) arrow.classList.toggle('rotate-180');
    }
}

let allSendUsers = [];
let selectedSendUsers = new Set();

window.loadSendMessageUsers = async function () {
    const list = document.getElementById('send-user-list');
    list.innerHTML = '<div class="text-center text-gray-400 mt-4">Cargando usuarios...</div>';

    try {
        const token = sessionStorage.getItem('authToken');
        const response = await fetch('/api/mensajeria/destinatarios', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error al cargar usuarios');

        allSendUsers = await response.json();
        selectedSendUsers.clear();
        document.getElementById('send-selected-count').textContent = '0';

        renderSendUsers(allSendUsers);

        // Search listener
        const searchInput = document.getElementById('send-user-search');
        if (searchInput) {
            searchInput.oninput = (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = allSendUsers.filter(u =>
                    u.nombre.toLowerCase().includes(term) || u.u.toLowerCase().includes(term)
                );
                renderSendUsers(filtered);
            }
        }

    } catch (e) {
        list.innerHTML = '<div class="text-center text-red-500 mt-4">Error cargando destinatarios.</div>';
        console.error(e);
    }
}

function renderSendUsers(users) {
    const list = document.getElementById('send-user-list');
    list.innerHTML = '';

    if (users.length === 0) {
        list.innerHTML = '<div class="text-center text-gray-400 mt-4">No se encontraron usuarios.</div>';
        return;
    }

    users.forEach(u => {
        const key = `${u.usuarioID}-${u.subusuarioID}`;
        const isSelected = selectedSendUsers.has(key);

        const div = document.createElement('div');
        div.className = `flex items-center p-3 rounded border transition-all cursor-pointer ${isSelected ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-200'}`;
        div.onclick = () => toggleSendUser(u.usuarioID, u.subusuarioID);

        div.innerHTML = `
            <div class="w-5 h-5 rounded border flex items-center justify-center mr-3 ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-400 bg-white'}">
                ${isSelected ? '<svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>' : ''}
            </div>
            <div>
                <div class="font-bold text-gray-800 text-sm">${u.nombre}</div>
                <div class="text-xs text-gray-500">@${u.u}</div>
            </div>
        `;
        list.appendChild(div);
    });
}

window.toggleSendUser = function (uid, subid) {
    const key = `${uid}-${subid}`;
    if (selectedSendUsers.has(key)) {
        selectedSendUsers.delete(key);
    } else {
        selectedSendUsers.add(key);
    }
    document.getElementById('send-selected-count').textContent = selectedSendUsers.size;

    // Efficiently re-render or just search? Re-render for simplicity now (list is small usually)
    // To keep search filter active
    const searchInput = document.getElementById('send-user-search');
    let usersToShow = allSendUsers;
    if (searchInput && searchInput.value) {
        const term = searchInput.value.toLowerCase();
        usersToShow = allSendUsers.filter(u => u.nombre.toLowerCase().includes(term) || u.u.toLowerCase().includes(term));
    }
    renderSendUsers(usersToShow);
}

window.toggleSelectAllSend = function () {
    // Current visible users
    const searchInput = document.getElementById('send-user-search');
    let usersToShow = allSendUsers;
    if (searchInput && searchInput.value) {
        const term = searchInput.value.toLowerCase();
        usersToShow = allSendUsers.filter(u => u.nombre.toLowerCase().includes(term) || u.u.toLowerCase().includes(term));
    }

    const allSelected = usersToShow.every(u => selectedSendUsers.has(`${u.usuarioID}-${u.subusuarioID}`));

    usersToShow.forEach(u => {
        const key = `${u.usuarioID}-${u.subusuarioID}`;
        if (allSelected) {
            selectedSendUsers.delete(key);
        } else {
            selectedSendUsers.add(key);
        }
    });

    document.getElementById('send-selected-count').textContent = selectedSendUsers.size;
    renderSendUsers(usersToShow);
}

window.switchSendTab = function (tab) {
    const btnUsers = document.getElementById('tab-send-users');
    const btnDetails = document.getElementById('tab-send-details');
    const contentUsers = document.getElementById('send-content-users');
    const contentDetails = document.getElementById('send-content-details');

    if (tab === 'users') {
        btnUsers.className = 'flex-1 py-2 px-4 text-center font-bold text-blue-600 border-b-2 border-blue-600 transition-colors';
        btnDetails.className = 'flex-1 py-2 text-center font-bold text-gray-500 hover:text-gray-700 transition-colors';
        contentUsers.classList.remove('hidden');
        contentDetails.classList.add('hidden');
    } else {
        // Validate selection before switching? Optional.
        btnDetails.className = 'flex-1 py-2 px-4 text-center font-bold text-blue-600 border-b-2 border-blue-600 transition-colors';
        btnUsers.className = 'flex-1 py-2 text-center font-bold text-gray-500 hover:text-gray-700 transition-colors';
        contentDetails.classList.remove('hidden');
        contentUsers.classList.add('hidden');
    }
}

window.submitSystemMessage = async function () {
    if (selectedSendUsers.size === 0) {
        showToast('Seleccione al menos un destinatario', 'warning');
        switchSendTab('users');
        return;
    }

    const title = document.getElementById('send-title').value.trim();
    const body = document.getElementById('send-body').value.trim();
    const date = document.getElementById('send-date').value;
    const time = document.getElementById('send-time').value;

    const useWeb = document.getElementById('send-channel-web').checked;
    const useApp = document.getElementById('send-channel-app').checked;

    if (!useWeb && !useApp) {
        showToast('Seleccione al menos un canal', 'warning');
        return;
    }
    if (!title || !body || !date || !time) {
        showToast('Complete todos los campos', 'warning');
        return;
    }

    const destinos = [];
    if (useWeb) destinos.push('web');
    if (useApp) destinos.push('celular');

    const destinatarios = Array.from(selectedSendUsers).map(key => {
        const [uid, subid] = key.split('-');
        return { usuarioID: parseInt(uid), subusuarioID: parseInt(subid) };
    });

    const data = {
        destinatarios: destinatarios,
        destinos: destinos,
        fecha: date,
        hora: time,
        titulo: title,
        mensaje: body
    };

    try {
        const btn = document.getElementById('btn-submit-message');
        btn.disabled = true;
        btn.textContent = 'Enviando...';

        const token = sessionStorage.getItem('authToken');
        const response = await fetch('/api/mensajeria/guardar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        const res = await response.json();

        if (response.ok) {
            showToast('Mensaje enviado correctamente', 'success');
            // Reset
            document.getElementById('send-title').value = '';
            document.getElementById('send-body').value = '';
            selectedSendUsers.clear();
            document.getElementById('send-selected-count').textContent = '0';
            renderSendUsers(allSendUsers);
            switchSendTab('users');
            // Go back to inbox? or stay?
            // Optionally go to inbox:
            // showView('messages');
        } else {
            throw new Error(res.message || 'Error al enviar');
        }

    } catch (e) {
        console.error(e);
        showToast(e.message, 'error');
    } finally {
        const btn = document.getElementById('btn-submit-message');
        btn.disabled = false;
        btn.textContent = 'Enviar Mensaje';
    }
}
