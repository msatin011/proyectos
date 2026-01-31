/**
 * MisMensajes Screen Module
 * Bandeja de mensajes del usuario - Pantalla SPA
 */

const MisMensajesScreen = {
    name: 'mismensajes',

    /**
     * Estilos específicos del módulo
     */
    styles: `
        .tab-active {
            border-bottom: 2px solid #2563EB;
            color: #2563EB;
            font-weight: bold;
        }
        .tab-inactive {
            color: #6B7280;
        }
        .tab-inactive:hover {
            color: #374151;
        }
    `,

    /**
     * Template HTML del módulo
     */
    template: (params = {}) => `
        <style>${MisMensajesScreen.styles}</style>
        
        <div class="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
            <div class="flex justify-between items-center mb-6 border-b pb-2">
                <h1 class="text-2xl font-bold text-gray-800">Mis Mensajes</h1>
                <div>
                    <button id="btn-salir-mensajes"
                        class="gradiente hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        <span>Salir</span>
                    </button>
                </div>
            </div>

            <!-- Tabs -->
            <div class="flex border-b border-gray-200 mb-6">
                <button id="tab-btn-unread"
                    class="flex-1 py-3 px-4 text-center focus:outline-none tab-active transition-colors duration-200">
                    No Leídos (<span id="count-unread">0</span>)
                </button>
                <button id="tab-btn-read"
                    class="flex-1 py-3 px-4 text-center focus:outline-none tab-inactive transition-colors duration-200">
                    Leídos (<span id="count-read">0</span>)
                </button>
            </div>

            <!-- Content Area -->
            <div id="content-area-mensajes" class="min-h-[300px]">
                <!-- Unread Messages -->
                <div id="view-unread" class="space-y-4">
                    <p class="text-center text-gray-500 py-8">Cargando mensajes...</p>
                </div>

                <!-- Read Messages -->
                <div id="view-read" class="space-y-4 hidden">
                    <!-- Populated via JS -->
                </div>
            </div>
        </div>
    `,

    /**
     * Inicialización del módulo
     */
    init: async (params = {}) => {

        const self = MisMensajesScreen;

        // Setup tabs
        self.setupTabs();

        // Setup salir button
        document.getElementById('btn-salir-mensajes')?.addEventListener('click', (e) => {
            e.preventDefault();
            navigate('dashboard');
            if (typeof openSidebar === 'function') {
                openSidebar();
            }
        });

        // Cargar mensajes
        await self.loadMessages();


    },

    /**
     * Configurar tabs
     */
    setupTabs: () => {
        const btnUnread = document.getElementById('tab-btn-unread');
        const btnRead = document.getElementById('tab-btn-read');

        btnUnread?.addEventListener('click', () => MisMensajesScreen.switchTab('unread'));
        btnRead?.addEventListener('click', () => MisMensajesScreen.switchTab('read'));
    },

    /**
     * Cambiar tab activo
     */
    switchTab: (tab) => {
        const viewUnread = document.getElementById('view-unread');
        const viewRead = document.getElementById('view-read');
        const btnUnread = document.getElementById('tab-btn-unread');
        const btnRead = document.getElementById('tab-btn-read');

        if (tab === 'unread') {
            viewUnread.classList.remove('hidden');
            viewRead.classList.add('hidden');
            btnUnread.classList.add('tab-active');
            btnUnread.classList.remove('tab-inactive');
            btnRead.classList.remove('tab-active');
            btnRead.classList.add('tab-inactive');
        } else {
            viewUnread.classList.add('hidden');
            viewRead.classList.remove('hidden');
            btnRead.classList.add('tab-active');
            btnRead.classList.remove('tab-inactive');
            btnUnread.classList.remove('tab-active');
            btnUnread.classList.add('tab-inactive');
        }
    },

    /**
     * Cargar mensajes
     */
    loadMessages: async () => {
        const listUnread = document.getElementById('view-unread');
        const listRead = document.getElementById('view-read');
        const countUnread = document.getElementById('count-unread');
        const countRead = document.getElementById('count-read');
        const token = sessionStorage.getItem('authToken');

        if (!token) {
            listUnread.innerHTML = '<p class="text-center text-red-500">No hay sesión activa.</p>';
            listRead.innerHTML = '<p class="text-center text-red-500">No hay sesión activa.</p>';
            return;
        }

        try {
            const [resUnread, resRead] = await Promise.all([
                fetch('/api/mensajeria/pendientes', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/mensajeria/leidos', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (resUnread.ok && resRead.ok) {
                const unreadMsgs = await resUnread.json();
                const readMsgs = await resRead.json();

                countUnread.textContent = unreadMsgs.length;
                countRead.textContent = readMsgs.length;

                MisMensajesScreen.renderList(listUnread, unreadMsgs, false);
                MisMensajesScreen.renderList(listRead, readMsgs, true);

                // Auto-read logic
                if (unreadMsgs.length > 0) {
                    const ids = unreadMsgs.map(m => m.mensajeID);
                    MisMensajesScreen.silentMarkAsRead(ids, token);
                }
            } else {
                listUnread.innerHTML = '<p class="text-center text-red-500">Error al cargar mensajes</p>';
            }
        } catch (err) {
            console.error(err);
            listUnread.innerHTML = '<p class="text-center text-red-500">Error de conexión</p>';
        }
    },

    /**
     * Renderizar lista de mensajes
     */
    renderList: (container, messages, isRead) => {
        if (messages.length === 0) {
            container.innerHTML = `<div class="text-center py-8 text-gray-500">No tienes mensajes ${isRead ? 'leídos' : 'nuevos'}</div>`;
            return;
        }

        container.innerHTML = '';
        messages.forEach(msg => {
            const div = document.createElement('div');
            div.className = `bg-white p-4 rounded shadow-sm border ${isRead ? 'border-gray-200' : 'border-blue-300 bg-blue-50'}`;

            // Date Formatting
            let dateDisplay = msg.cuando || '';
            if (msg.cuando && msg.cuando.length >= 12) {
                const y = msg.cuando.slice(0, 4);
                const m = msg.cuando.slice(4, 6);
                const d = msg.cuando.slice(6, 8);
                const h = msg.cuando.slice(8, 10);
                const min = msg.cuando.slice(10, 12);
                dateDisplay = `${d}/${m}/${y} ${h}:${min}`;
            }

            div.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-bold text-gray-800">${msg.titulo || '(Sin Asunto)'}</h3>
                    <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">${dateDisplay}</span>
                </div>
                <p class="text-gray-700 whitespace-pre-wrap">${msg.mensaje}</p>
                <div class="mt-3 text-sm text-gray-500 text-right">
                    De: <span class="font-semibold">${msg.deNombre || 'Sistema'}</span>
                </div>
            `;
            container.appendChild(div);
        });
    },

    /**
     * Marcar mensajes como leídos silenciosamente
     */
    silentMarkAsRead: async (ids, token) => {
        if (!ids || ids.length === 0) return;
        try {
            await fetch('/api/mensajeria/marcar-leidos', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ mensajeIDs: ids })
            });
        } catch (e) { console.error(e); }
    },

    /**
     * Limpieza al salir del módulo
     */
    destroy: () => {

    }
};

// Registrar en el router
if (window.SpaRouter) {
    window.SpaRouter.registerScreen('mismensajes', MisMensajesScreen);
}

// Exponer para uso manual
window.MisMensajesScreen = MisMensajesScreen;
