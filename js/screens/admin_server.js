/**
 * Admin Server Screen Module
 * Panel de Administración del Servidor (Live Monitor)
 */

const AdminServerScreen = {
    name: 'admin_server',

    // Config
    socket: null,
    zIndexCounter: 100,
    refreshTimeout: null,

    // State
    userInfo: null,
    logBuffer: [],
    viewingLogs: false,
    loggingEnabled: false,

    // Pending Actions state
    pendingKickData: null,
    pendingMessageData: null,

    // Dragging state for modals
    dragState: {
        active: false,
        el: null,
        pos1: 0, pos2: 0, pos3: 0, pos4: 0
    },

    styles: `
        /* Background Pattern */
        .bg-grid-pattern {
            background-color: #f3f4f6;
            background-image: radial-gradient(#6b7280 1px, transparent 1px); 
            background-size: 20px 20px;
        }

        /* Sidebar Button Style */
        .sidebar-btn-admin {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            margin-bottom: 1rem;
            border-radius: 0.75rem;
            background: white;
            color: #4b5563;
            transition: all 0.2s;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            width: 100%;
            height: 100px;
        }

        .sidebar-btn-admin:hover {
            transform: translateY(-2px);
            background-color: #3b82f6;
            color: white;
            box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);
            cursor: pointer;
        }

        .sidebar-btn-admin svg,
        .sidebar-btn-admin img {
            width: 32px;
            height: 32px;
            margin-bottom: 0.5rem;
        }

        /* Movable Modal */
        .movable-modal {
            position: absolute;
            background: white;
            border-radius: 0.75rem;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            border: 1px solid #e5e7eb;
            min-width: 400px;
            max-width: 800px;
            display: flex;
            flex-direction: column;
            resize: both;
            overflow: hidden;
        }

        .modal-header-admin {
            background: #1e293b;
            color: white;
            padding: 0.75rem 1rem;
            cursor: move;
            display: flex;
            justify-content: space-between;
            align-items: center;
            user-select: none;
        }
    `,

    template: (params = {}) => `
        <style>${AdminServerScreen.styles}</style>
        
        <div class="h-full flex overflow-hidden">
            <!-- Sidebar -->
            <div class="w-24 bg-white border-r border-gray-200 flex flex-col items-center py-6 px-2 shadow-sm z-20 shrink-0">
                <!-- Tools List -->
                <div class="flex-1 w-full space-y-4 overflow-y-auto no-scrollbar">
                    <button id="btn-connected-users" class="sidebar-btn-admin group">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span class="text-[10px] font-bold text-center leading-tight">Usuarios<br>Conectados</span>
                    </button>

                    <button id="btn-chat-rooms" class="sidebar-btn-admin group">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                        </svg>
                        <span class="text-[10px] font-bold text-center leading-tight">Salas<br>Chat</span>
                    </button>

                    <button id="btn-log-server" class="sidebar-btn-admin group">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span class="text-[10px] font-bold text-center leading-tight">Log<br>Server</span>
                    </button>
                </div>

                <!-- Exit -->
                <div class="mt-auto pt-4 border-t w-full flex justify-center">
                    <button id="btn-salir-admin"
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

            <!-- Canvas Area -->
            <div id="admin-canvas" class="flex-1 relative bg-grid-pattern p-6 overflow-hidden">
                <h1 class="text-2xl font-bold text-gray-800 z-10 relative pointer-events-none opacity-50 select-none">Admin Server Monitor</h1>
                
                <!-- Modals will be appended here -->
            </div>
        </div>

        <!-- Static Modals (Confirmations, etc) -->
        
        <!-- Kick Confirmation Modal -->
        <div id="kick-confirmation-modal" class="fixed inset-0 bg-black bg-opacity-50 z-[9999] hidden items-center justify-center p-4">
             <div class="bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all scale-95 opacity-0 overflow-hidden">
                <div class="p-6">
                    <h2 class="text-2xl font-bold text-gray-800 flex items-center mb-4">
                        <svg class="w-8 h-8 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Confirmar Expulsión
                    </h2>
                    <p id="kick-confirmation-message" class="text-gray-600 mb-6">¿Estás seguro?</p>
                    <div class="flex justify-end gap-3">
                        <button id="btn-cancel-kick" class="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Cancelar</button>
                        <button id="btn-confirm-kick" class="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700">Sacar Usuario</button>
                    </div>
                </div>
            </div>
        </div>

         <!-- Message Modal -->
         <div id="send-message-modal" class="fixed inset-0 bg-black bg-opacity-50 z-[9999] hidden items-center justify-center p-4">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all scale-95 opacity-0 overflow-hidden">
                <div class="p-6">
                    <h2 class="text-2xl font-bold text-gray-800 mb-4">
                        Mensaje a: <span id="message-target-name" class="text-blue-600"></span>
                    </h2>
                    <form id="form-send-message">
                         <textarea id="message-text" rows="4" class="w-full border rounded px-3 py-2 border-gray-300 focus:outline-none focus:border-blue-500 resize-none" placeholder="Escribe tu mensaje..."></textarea>
                         <div class="flex justify-end gap-3 mt-4">
                             <button type="button" id="btn-cancel-msg" class="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Cancelar</button>
                             <button type="submit" class="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 font-bold">Enviar</button>
                         </div>
                    </form>
                </div>
            </div>
        </div>
    `,

    init: async (params = {}) => {

        const self = AdminServerScreen;

        // Verify Admin Access
        const userDataString = sessionStorage.getItem('userData');
        const userData = userDataString ? JSON.parse(userDataString) : {};

        if (userData.usuarioID != 1) {
            console.error('Acceso denegado: Se requiere usuarioID=1');
            navigate('dashboard');
            return;
        }

        self.userInfo = userData;
        self.socket = window.appSocket; // Use global socket
        self.zIndexCounter = 100;

        self.setupEventListeners();
        self.setupSocketListeners();
        self.setupDragDocs();


    },

    setupEventListeners: () => {
        const self = AdminServerScreen;

        document.getElementById('btn-connected-users')?.addEventListener('click', () => self.openMovableModal('connected-users'));
        document.getElementById('btn-chat-rooms')?.addEventListener('click', () => self.openMovableModal('chat-rooms'));
        document.getElementById('btn-log-server')?.addEventListener('click', () => self.openMovableModal('log-server'));
        document.getElementById('btn-salir-admin')?.addEventListener('click', () => {
            navigate('dashboard');
            if (typeof openSidebar === 'function') openSidebar();
        });

        // Modal Action Buttons
        document.getElementById('btn-cancel-kick')?.addEventListener('click', self.closeKickConfirmModal);
        document.getElementById('btn-confirm-kick')?.addEventListener('click', self.confirmKickUser);

        document.getElementById('btn-cancel-msg')?.addEventListener('click', self.closeSendMessageModal);
        document.getElementById('form-send-message')?.addEventListener('submit', self.handleSendMessage);
    },

    setupSocketListeners: () => {
        const self = AdminServerScreen;
        if (!self.socket) return;

        self.socket.on('new_message', (payload) => {
            if (payload.type === 'usuario_conectado' || payload.type === 'usuario_desconectado') {
                if (self.refreshTimeout) clearTimeout(self.refreshTimeout);
                self.refreshTimeout = setTimeout(() => {
                    self.refreshIfOpen('connected-users');
                }, 2000); // Debounce
            }
        });

        self.socket.on('server_log', (logData) => {
            if (self.viewingLogs) {
                self.logBuffer.push(logData);
                if (self.logBuffer.length > 200) self.logBuffer.shift();
                self.renderLogsIfNeeded();
            }
        });
    },

    setupDragDocs: () => {
        const self = AdminServerScreen;

        document.addEventListener('mousemove', (e) => {
            if (self.dragState.active && self.dragState.el) {
                e.preventDefault();
                self.dragState.pos1 = self.dragState.pos3 - e.clientX;
                self.dragState.pos2 = self.dragState.pos4 - e.clientY;
                self.dragState.pos3 = e.clientX;
                self.dragState.pos4 = e.clientY;
                self.dragState.el.style.top = (self.dragState.el.offsetTop - self.dragState.pos2) + "px";
                self.dragState.el.style.left = (self.dragState.el.offsetLeft - self.dragState.pos1) + "px";
            }
        });

        document.addEventListener('mouseup', () => {
            self.dragState.active = false;
            self.dragState.el = null;
        });
    },

    openMovableModal: (type) => {
        const self = AdminServerScreen;
        const id = 'modal-' + type;
        const canvas = document.getElementById('admin-canvas');

        if (document.getElementById(id)) {
            document.getElementById(id).style.zIndex = ++self.zIndexCounter;
            return;
        }

        const modal = document.createElement('div');
        modal.id = id;
        modal.className = 'movable-modal shadow-xl';
        modal.style.left = '50px';
        modal.style.top = '50px';
        modal.style.zIndex = ++self.zIndexCounter;

        // Initial setup per type
        let title = '';
        let content = '';

        if (type === 'connected-users') {
            title = 'Usuarios Conectados (Live)';
            modal.style.width = '800px';
            content = `
                <div class="p-4 overflow-auto h-96 flex flex-col">
                    <div class="flex justify-between items-center mb-4 shrink-0">
                         <button id="btn-refresh-${type}" class="text-blue-600 font-bold text-sm flex gap-1 items-center hover:underline">
                             <i class="fas fa-sync"></i> Actualizar
                         </button>
                         <span class="text-xs text-gray-500 last-update">---</span>
                    </div>
                    <table class="w-full text-sm text-left text-gray-500">
                        <thead class="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                            <tr>
                                <th class="px-3 py-2">Usuario</th>
                                <th class="px-3 py-2">ID</th>
                                <th class="px-3 py-2">Conexion</th>
                                <th class="px-3 py-2">Desde</th>
                                <th class="px-3 py-2">Acciones</th>
                            </tr>
                        </thead>
                        <tbody class="data-body"></tbody>
                    </table>
                </div>
            `;
        } else if (type === 'chat-rooms') {
            title = 'Salas Chat';
            modal.style.width = '600px';
            content = `
                 <div class="p-4 overflow-auto h-96 flex flex-col">
                    <div class="flex justify-between items-center mb-4 shrink-0">
                         <button id="btn-refresh-${type}" class="text-blue-600 font-bold text-sm flex gap-1 items-center hover:underline">
                             <i class="fas fa-sync"></i> Actualizar
                         </button>
                         <span class="text-xs text-gray-500 last-update">---</span>
                    </div>
                    <div class="data-body space-y-4"></div>
                </div>
            `;
        } else if (type === 'log-server') {
            title = 'Log Server';
            modal.style.width = '700px';
            content = `
                 <div class="p-4 overflow-auto h-96 flex flex-col">
                     <div class="mb-4 space-y-3 shrink-0">
                        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded">
                            <input type="checkbox" id="chk-toggle-logging" class="w-5 h-5">
                            <label for="chk-toggle-logging" class="font-semibold cursor-pointer select-none">Habilitar Log Server</label>
                        </div>
                         <div class="flex items-center gap-3 p-3 bg-gray-50 rounded">
                            <input type="checkbox" id="chk-view-logs" class="w-5 h-5">
                            <label for="chk-view-logs" class="font-semibold cursor-pointer select-none">Ver Logs</label>
                        </div>
                     </div>
                     <div id="log-viewer" class="bg-black text-green-400 font-mono text-xs p-4 rounded h-full overflow-y-auto hidden">
                        <div id="log-content"></div>
                     </div>
                 </div>
            `;
        }

        modal.innerHTML = `
            <div class="modal-header-admin">
                <span class="font-bold flex items-center gap-2">
                     <i class="fas fa-grip-lines opacity-50"></i> ${title}
                </span>
                <button class="text-gray-300 hover:text-white" id="close-${type}">✕</button>
            </div>
            <div class="bg-white flex-1 overflow-hidden relative flex flex-col">
                ${content}
            </div>
        `;

        canvas.appendChild(modal);

        // Header Drag Logic
        const header = modal.querySelector('.modal-header-admin');
        header.addEventListener('mousedown', (e) => {
            e.preventDefault();
            self.dragState.active = true;
            self.dragState.el = modal;
            self.dragState.pos3 = e.clientX;
            self.dragState.pos4 = e.clientY;
            modal.style.zIndex = ++self.zIndexCounter;
        });

        modal.addEventListener('mousedown', () => modal.style.zIndex = ++self.zIndexCounter);
        modal.querySelector(`#close-${type}`).onclick = () => {
            if (type === 'log-server') self.viewingLogs = false;
            modal.remove();
        };

        // Bind Specific Events
        if (type === 'connected-users') {
            modal.querySelector(`#btn-refresh-${type}`).onclick = () => self.loadConnectedUsers(modal);
            self.loadConnectedUsers(modal);
        } else if (type === 'chat-rooms') {
            modal.querySelector(`#btn-refresh-${type}`).onclick = () => self.loadChatRooms(modal);
            self.loadChatRooms(modal);
        } else if (type === 'log-server') {
            self.initLogServer(modal);
        }
    },

    refreshIfOpen: (type) => {
        const self = AdminServerScreen;
        const modal = document.getElementById('modal-' + type);
        if (modal) {
            if (type === 'connected-users') self.loadConnectedUsers(modal);
        }
    },

    loadConnectedUsers: async (modal) => {
        const tbody = modal.querySelector('.data-body');
        const timeSpan = modal.querySelector('.last-update');
        const token = sessionStorage.getItem('authToken');

        try {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Cargando...</td></tr>';
            const res = await fetch(`/api/admin/connected-users?_=${Date.now()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const users = await res.json();

            tbody.innerHTML = '';
            if (users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-400">Sin usuarios</td></tr>';
            } else {
                // Grouping logic (simplified)
                const grouped = {};
                users.forEach(u => {
                    const k = `${u.usuarioID}-${u.subusuarioID}`;
                    if (!grouped[k]) grouped[k] = { ...u, sources: [] };
                    grouped[k].sources.push(u.source || 'unknown');
                });

                Object.values(grouped).forEach(u => {
                    const tr = document.createElement('tr');
                    tr.className = 'border-b hover:bg-gray-50';
                    tr.innerHTML = `
                          <td class="px-3 py-2 font-medium">${u.nombre}</td>
                          <td class="px-3 py-2 font-mono text-xs">${u.usuarioID}-${u.subusuarioID}</td>
                          <td class="px-3 py-2 text-xs">${u.sources.join(', ')}</td>
                          <td class="px-3 py-2 text-xs text-green-600">${new Date(u.connectedAt).toLocaleTimeString()}</td>
                          <td class="px-3 py-2 flex gap-1">
                              <button class="kick-btn bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600" title="Sacar">Sacar</button>
                              <button class="msg-btn bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600" title="Mensaje">Msg</button>
                          </td>
                      `;

                    tr.querySelector('.kick-btn').onclick = () => AdminServerScreen.openKickModal(u);
                    tr.querySelector('.msg-btn').onclick = () => AdminServerScreen.openMsgModal(u);
                    tbody.appendChild(tr);
                });
            }
            timeSpan.textContent = new Date().toLocaleTimeString();

        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-red-500 text-center">${error.message}</td></tr>`;
        }
    },

    loadChatRooms: async (modal) => {
        const container = modal.querySelector('.data-body');
        const timeSpan = modal.querySelector('.last-update');
        const token = sessionStorage.getItem('authToken');

        try {
            container.innerHTML = '<div class="text-center py-4">Cargando...</div>';
            const res = await fetch('/api/admin/chat-rooms', { headers: { 'Authorization': `Bearer ${token}` } });
            const rooms = await res.json();

            container.innerHTML = '';
            if (rooms.length === 0) {
                container.innerHTML = '<div class="text-center text-gray-400">Sin salas activas</div>';
            } else {
                rooms.forEach(room => {
                    const div = document.createElement('div');
                    div.className = 'border rounded p-2 text-sm';
                    div.innerHTML = `
                        <div class="flex justify-between font-bold">
                            <span>Sala ${room.id.substring(0, 8)}...</span>
                            <span class="bg-green-100 px-1 rounded text-xs">${room.miembros.length} Mbs</span>
                        </div>
                        <div class="text-xs text-gray-500">
                             Creador: ${room.creador.nombre}<br>
                             Miembros: ${room.miembros.map(m => m.nombre).join(', ')}
                        </div>
                    `;
                    container.appendChild(div);
                });
            }
            timeSpan.textContent = new Date().toLocaleTimeString();
        } catch (error) {
            container.innerHTML = `<div class="text-red-500">${error.message}</div>`;
        }
    },

    initLogServer: async (modal) => {
        const self = AdminServerScreen;
        const toggle = modal.querySelector('#chk-toggle-logging');
        const view = modal.querySelector('#chk-view-logs');
        const viewer = modal.querySelector('#log-viewer');
        const token = sessionStorage.getItem('authToken');

        // Initial Status
        try {
            const res = await fetch('/api/admin/logging-status', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                self.loggingEnabled = data.enabled;
                toggle.checked = data.enabled;
            }
        } catch (e) { }

        toggle.onchange = async (e) => {
            const enabled = e.target.checked;
            try {
                await fetch('/api/admin/toggle-logging', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ enabled })
                });
                self.loggingEnabled = enabled;
            } catch (err) { e.target.checked = !enabled; }
        };

        view.onchange = (e) => {
            self.viewingLogs = e.target.checked;
            if (self.viewingLogs) {
                viewer.classList.remove('hidden');
                self.fetchInitialLogs();
            } else {
                viewer.classList.add('hidden');
            }
        };
    },

    fetchInitialLogs: async () => {
        const self = AdminServerScreen;
        const token = sessionStorage.getItem('authToken');
        try {
            const res = await fetch('/api/admin/logs', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const logs = await res.json();
                self.logBuffer = logs;
                self.renderLogsIfNeeded();
            }
        } catch (e) { }
    },

    renderLogsIfNeeded: () => {
        const self = AdminServerScreen;
        const viewer = document.getElementById('log-viewer')?.querySelector('#log-content');
        if (!viewer || !self.viewingLogs) return;

        viewer.innerHTML = self.logBuffer.slice(-200).map(log => {
            const color = log.type === 'error' ? 'text-red-400' : (log.type === 'warn' ? 'text-yellow-400' : 'text-green-400');
            return `<div class="mb-1 ${color}">${log.timestamp} [${log.type.toUpperCase()}] ${log.message}</div>`;
        }).join('');

        // Auto scroll
        viewer.parentElement.scrollTop = viewer.parentElement.scrollHeight;
    },

    openKickModal: (user) => {
        const self = AdminServerScreen;
        self.pendingKickData = user;
        const modal = document.getElementById('kick-confirmation-modal');
        document.getElementById('kick-confirmation-message').textContent = `¿Sacar a ${user.nombre}?`;

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => modal.firstElementChild.classList.remove('scale-95', 'opacity-0'), 10);
    },

    closeKickConfirmModal: () => {
        const modal = document.getElementById('kick-confirmation-modal');
        modal.firstElementChild.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }, 300);
        AdminServerScreen.pendingKickData = null;
    },

    confirmKickUser: async () => {
        const self = AdminServerScreen;
        if (!self.pendingKickData) return;
        const { usuarioID, subusuarioID, nombre } = self.pendingKickData;
        const token = sessionStorage.getItem('authToken');

        try {
            await fetch('/api/admin/kick-user', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuarioID, subusuarioID })
            });
            showToast(`Expulsando a ${nombre}...`, 'info');
            self.closeKickConfirmModal();
            // Force refresh connected users
            self.refreshIfOpen('connected-users');
        } catch (e) { showToast('Error al expulsar', 'error'); }
    },

    openMsgModal: (user) => {
        const self = AdminServerScreen;
        self.pendingMessageData = user;
        const modal = document.getElementById('send-message-modal');
        document.getElementById('message-target-name').textContent = user.nombre;
        document.getElementById('message-text').value = '';

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => modal.firstElementChild.classList.remove('scale-95', 'opacity-0'), 10);
    },

    closeSendMessageModal: () => {
        const modal = document.getElementById('send-message-modal');
        modal.firstElementChild.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }, 300);
        AdminServerScreen.pendingMessageData = null;
    },

    handleSendMessage: async (e) => {
        e.preventDefault();
        const self = AdminServerScreen;
        const msg = document.getElementById('message-text').value;
        if (!msg.trim()) return;
        const { usuarioID, subusuarioID } = self.pendingMessageData;
        const token = sessionStorage.getItem('authToken');

        try {
            await fetch('/api/admin/send-message', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuarioID, subusuarioID, mensaje: msg })
            });
            showToast('Mensaje enviado', 'success');
            self.closeSendMessageModal();
        } catch (e) { showToast('Error enviando mensaje', 'error'); }
    },

    destroy: () => {
        const self = AdminServerScreen;
        if (self.socket) {
            self.socket.off('new_message');
            self.socket.off('server_log');
        }
        if (self.refreshTimeout) clearTimeout(self.refreshTimeout);
    }
};

if (window.SpaRouter) {
    window.SpaRouter.registerScreen('admin_server', AdminServerScreen);
}
