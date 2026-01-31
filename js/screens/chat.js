/**
 * Chat Screen Module
 * Pantalla de selección de usuarios e inicio de chat.
 * La conversación real ocurre en la ventana flotante gestionada por layout.js.
 */

const ChatScreen = {
    name: 'chat',

    // Config & State
    socket: null,
    allUsers: [],
    selectedUserIds: new Set(),
    activeChatUsers: new Set(),
    currentSalaID: null,

    template: (params = {}) => `
        <div class="h-full flex flex-col font-sans bg-gray-50 overflow-hidden">
            <!-- Header -->
            <header class="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm shrink-0 z-10">
                <div class="flex items-center gap-4 w-1/3">
                    <h1 class="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <i class="fas fa-comments text-blue-600"></i>
                        Chat
                    </h1>
                </div>

                <div class="flex flex-col items-center justify-center w-1/3 text-center">
                    <div class="text-sm font-medium text-gray-600">
                        Conectados: <span id="chat-online-count" class="text-green-600 font-bold">0</span>
                    </div>
                </div>

                <div class="flex justify-end w-1/3">
                    <button id="btn-salir-chat"
                        class="gradiente hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        <span>Salir</span>
                    </button>
                </div>
            </header>

            <!-- Main Content -->
            <div class="flex-1 overflow-hidden flex max-w-7xl mx-auto w-full p-4 md:p-6 gap-6 justify-start">
                <!-- User List Panel -->
                <div class="bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col h-full overflow-hidden w-full lg:w-[35%]">
                    
                    <!-- Search -->
                    <div class="p-4 border-b border-gray-100 bg-gray-50/50">
                        <div class="relative">
                            <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                <i class="fas fa-search"></i>
                            </span>
                            <input type="text" id="chat-user-search" placeholder="Buscar usuario..." class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm">
                        </div>
                    </div>

                    <!-- Users List -->
                    <div id="chat-user-list" class="flex-1 overflow-y-auto p-4 space-y-2">
                         <div class="flex flex-col items-center justify-center h-40 text-gray-400">
                            <i class="fas fa-circle-notch fa-spin text-3xl mb-2 text-blue-500"></i>
                            <span class="text-sm">Cargando usuarios...</span>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center transition-colors" id="chat-footer">
                        <div class="text-sm text-gray-500">
                            <span id="chat-selected-count" class="font-bold text-gray-800">0</span> seleccionados
                        </div>
                        <button id="btn-start-chat" disabled class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all transform active:scale-95 flex items-center gap-2">
                            Iniciar Chat
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,

    init: async (params = {}) => {

        const self = ChatScreen;
        const token = sessionStorage.getItem('authToken');

        if (!token) {
            navigate('dashboard');
            return;
        }

        // Reset State
        self.allUsers = [];
        self.selectedUserIds.clear();
        self.activeChatUsers.clear();
        self.currentSalaID = null;
        self.socket = window.appSocket;

        self.setupEventListeners();

        await self.fetchUsers(token);
        self.setupSocketListeners();


    },

    fetchUsers: async (token) => {
        const self = ChatScreen;
        const listEl = document.getElementById('chat-user-list');
        try {
            const res = await fetch('/api/chat/usuarios', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Error al cargar usuarios');
            self.allUsers = await res.json();
            self.renderUsers();
            self.updateOnlineCounter();
        } catch (error) {
            if (listEl) listEl.innerHTML = `<div class="text-center text-red-500 py-8">${error.message}</div>`;
        }
    },

    setupEventListeners: () => {
        const self = ChatScreen;

        document.getElementById('btn-salir-chat')?.addEventListener('click', () => {
            navigate('dashboard');
            if (typeof openSidebar === 'function') openSidebar();
        });

        const searchInput = document.getElementById('chat-user-search');
        searchInput?.addEventListener('input', (e) => self.renderUsers(e.target.value));
        searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') e.preventDefault();
        });

        document.getElementById('btn-start-chat')?.addEventListener('click', self.startChat);
    },

    setupSocketListeners: () => {
        const self = ChatScreen;
        if (!self.socket) return;

        self.socket.on('user_status_change', self.handleUserStatusChange);
        self.socket.on('chat_iniciado', self.handleChatIniciado);
        self.socket.on('usuario_unido_sala', self.handleUsuarioUnido);
    },

    handleUserStatusChange: (data) => {
        const self = ChatScreen;
        const user = self.allUsers.find(u => u.usuarioID == data.usuarioID && u.subusuarioID == data.subusuarioID);
        if (user) {
            user.online = data.online;
            if (!data.online) {
                const key = `${data.usuarioID}-${data.subusuarioID}`;
                if (self.selectedUserIds.has(key)) {
                    self.selectedUserIds.delete(key);
                    self.updateSelectionUI();
                }
            }
            self.renderUsers(document.getElementById('chat-user-search')?.value || '');
            self.updateOnlineCounter();
        }
    },

    handleChatIniciado: (data) => {
        // data: { salaID, miembros }
        const self = ChatScreen;

        if (window.openFloatingChat) {
            const membersNames = data.miembros.map(m => m.nombre).join(', ');
            window.openFloatingChat(data.salaID, membersNames, true); // true = waitingForAcceptance
        }

        const btn = document.getElementById('btn-start-chat');
        if (btn) {
            btn.innerHTML = 'Iniciar Chat <i class="fas fa-paper-plane"></i>';
            btn.disabled = true;
        }
        self.selectedUserIds.clear();
        self.updateSelectionUI();
    },

    handleUsuarioUnido: (data) => {
        const self = ChatScreen;
        // Remove user from list
        if (self.currentSalaID) {
            const key = `${data.usuario.usuarioID}-${data.usuario.subusuarioID}`;
            self.activeChatUsers.add(key);
            self.renderUsers(document.getElementById('chat-user-search')?.value || '');
        }
    },

    renderUsers: (filterText = '') => {
        const self = ChatScreen;
        const listEl = document.getElementById('chat-user-list');
        if (!listEl) return;

        listEl.innerHTML = '';

        const filtered = self.allUsers.filter(u => {
            const idKey = `${u.usuarioID}-${u.subusuarioID}`;
            if (self.activeChatUsers.has(idKey)) return false;

            const match = u.nombre.toLowerCase().includes(filterText.toLowerCase()) ||
                (u.u && u.u.toLowerCase().includes(filterText.toLowerCase()));
            return match;
        });

        // Sort: Online first, then Alpha
        filtered.sort((a, b) => {
            if (a.online === b.online) return a.nombre.localeCompare(b.nombre);
            return a.online ? -1 : 1;
        });

        if (filtered.length === 0) {
            listEl.innerHTML = `
                <div class="flex flex-col items-center justify-center h-40 text-gray-400">
                    <i class="fas fa-users-slash text-3xl mb-2 text-gray-300"></i>
                    <p class="text-sm">No se encontraron usuarios</p>
                </div>`;
            return;
        }

        filtered.forEach(user => {
            const isOnline = user.online;
            const idKey = `${user.usuarioID}-${user.subusuarioID}`;
            const isSelected = self.selectedUserIds.has(idKey);

            const row = document.createElement('div');
            // Tailwind classes logic
            let bgClass = isSelected ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500' : (isOnline ? 'bg-white hover:bg-green-50 border-gray-100' : 'bg-gray-50 border-gray-100 opacity-60 grayscale');
            let cursorClass = isOnline ? 'cursor-pointer' : 'cursor-not-allowed';

            row.innerHTML = `
                <div class="relative group ${cursorClass} select-none transition-all duration-200 p-3 rounded-xl border ${bgClass} flex items-center">
                    <div class="flex-shrink-0 mr-4 relative">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 flex items-center justify-center font-bold text-sm shadow-sm border border-blue-200">
                            ${self.getInitials(user.nombre)}
                        </div>
                        <div class="absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'} shadow-sm"></div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h3 class="text-sm font-bold text-gray-900 truncate">${user.nombre}</h3>
                        <p class="text-xs text-gray-500 truncate">@${user.u || 'user'}</p>
                    </div>
                    <div class="w-6 h-6 rounded-full border-2 ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'} flex items-center justify-center text-white transition-all group-hover:border-blue-400">
                         <i class="fas fa-check text-xs ${isSelected ? '' : 'opacity-0'}"></i>
                    </div>
                </div>
            `;

            if (isOnline) {
                row.addEventListener('click', () => self.toggleSelection(idKey));
            }
            listEl.appendChild(row);
        });
    },

    toggleSelection: (idKey) => {
        const self = ChatScreen;
        if (self.selectedUserIds.has(idKey)) {
            self.selectedUserIds.delete(idKey);
        } else {
            self.selectedUserIds.add(idKey);
        }
        self.updateSelectionUI();
        self.renderUsers(document.getElementById('chat-user-search')?.value || '');
    },

    updateSelectionUI: () => {
        const self = ChatScreen;
        const count = self.selectedUserIds.size;
        document.getElementById('chat-selected-count').textContent = count;
        document.getElementById('btn-start-chat').disabled = count === 0;
    },

    updateOnlineCounter: () => {
        const self = ChatScreen;
        const count = self.allUsers.filter(u => u.online).length;
        document.getElementById('chat-online-count').textContent = count;
    },

    getInitials: (name) => {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    },

    startChat: () => {
        const self = ChatScreen;
        if (self.selectedUserIds.size === 0) return;

        const targets = [];
        self.selectedUserIds.forEach(key => {
            const [uid, subid] = key.split('-');
            const user = self.allUsers.find(u => u.usuarioID == uid && u.subusuarioID == subid);
            if (user) {
                targets.push({
                    usuarioID: user.usuarioID,
                    subusuarioID: user.subusuarioID,
                    nombre: user.nombre
                });
            }
        });

        if (self.socket) {
            self.socket.emit('invite_users', { targetUsuarioIDs: targets });

            const btn = document.getElementById('btn-start-chat');
            btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Invitando...';
            btn.disabled = true;
        }
    },

    destroy: () => {
        const self = ChatScreen;
        if (self.socket) {
            self.socket.off('user_status_change', self.handleUserStatusChange);
            self.socket.off('chat_iniciado', self.handleChatIniciado);
            self.socket.off('usuario_unido_sala', self.handleUsuarioUnido);
        }
    }
};

if (window.SpaRouter) {
    window.SpaRouter.registerScreen('chat', ChatScreen);
}
