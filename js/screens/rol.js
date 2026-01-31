/**
 * Rol Screen Module
 * Asignación de Roles - Pantalla SPA con Drag & Drop
 */

const RolScreen = {
    name: 'rol',

    // Estado interno
    usuarios: [],
    draggedRolID: null,
    draggedFromUser: null,
    isDragging: false,
    startX: 0,
    startY: 0,
    initialLeft: 0,
    initialTop: 0,

    // Handlers para document-level events (para poder removerlos en destroy)
    documentDragOverHandler: null,
    documentDropHandler: null,
    documentMouseMoveHandler: null,
    documentMouseUpHandler: null,

    /**
     * Estilos específicos del módulo
     */
    styles: `
        .role-button {
            cursor: grab;
            transition: all 0.2s;
        }
        .role-button:active {
            cursor: grabbing;
        }
        .role-button.dragging {
            opacity: 0.5;
        }
        .user-button {
            transition: all 0.2s;
        }
        .user-button.drag-over {
            background-color: #dbeafe !important;
            transform: scale(1.05);
        }
        .role-badge {
            animation: fadeInRol 0.3s;
            cursor: grab;
            min-width: 120px;
            text-align: center;
        }
        .role-badge:active {
            cursor: grabbing;
        }
        .role-badge.dragging {
            opacity: 0.5;
        }
        @keyframes fadeInRol {
            from { opacity: 0; transform: scale(0.8); }
            to { opacity: 1; transform: scale(1); }
        }
        #help-modal-rol {
            position: fixed;
            top: 5%;
            right: 2%;
            width: 90%;
            height: 70%;
            background-color: white;
            border: 1px solid #d1d5db;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            display: none;
            flex-direction: column;
            resize: both;
            overflow: auto;
            min-width: 400px;
            min-height: 300px;
            border-radius: 8px;
        }
        #help-modal-header-rol {
            background: linear-gradient(180deg, #aad2eb 0%, #8c9bc4 100%);
            color: rgb(255, 255, 255);
            padding: 12px 16px;
            cursor: move;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-shrink: 0;
            border-top-left-radius: 7px;
            border-top-right-radius: 7px;
            user-select: none;
        }
    `,

    /**
     * Template HTML del módulo
     */
    template: (params = {}) => `
        <style>${RolScreen.styles}</style>
        
        <div class="h-full flex flex-col">
            <!-- Header -->
            <div class="mb-4 flex items-center gap-4 pb-4 border-b border-gray-300">
                <img style="width:3em" src="img/asignarol.png" alt="Icono" onerror="this.style.display='none'">
                <h1 class="text-2xl font-bold text-gray-800">Asignación de Roles a Usuarios</h1>
                <div class="flex-grow"></div>
                <button id="btn-ayuda-rol"
                    class="flex items-center justify-center gap-2 rounded-md shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 text-white font-medium text-sm"
                    style="width: 140px; padding: 0.5rem 0.75rem; background: linear-gradient(180deg, #aad2eb 0%, #8c9bc4 100%); border: 0.5px solid #888;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <span>Ayuda</span>
                </button>
                <button id="btn-salir-rol"
                    class="gradiente hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    <span>Salir</span>
                </button>
            </div>

            <!-- Main Content -->
            <div class="flex-grow flex gap-6 overflow-hidden">
                <!-- Left Panel: Roles -->
                <div class="w-1/3 bg-white rounded-lg shadow-lg p-6">
                    <h2 class="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <i class="fas fa-user-tag text-blue-600"></i>
                        Roles Disponibles
                    </h2>
                    <p class="text-sm text-gray-500 mb-4">Arrastra un rol hacia un usuario para asignarlo</p>
                    <div id="roles-container-rol" class="flex flex-col gap-3">
                        <!-- Roles will be generated here -->
                    </div>
                </div>

                <!-- Right Panel: Users -->
                <div class="flex-1 bg-white rounded-lg shadow-lg p-6 flex flex-col">
                    <h2 class="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <i class="fas fa-users text-green-600"></i>
                        Usuarios
                    </h2>
                    <p class="text-sm text-gray-500 mb-4">Arrastra un rol fuera del usuario para eliminarlo</p>
                    <div id="users-container-rol" class="flex-1 overflow-y-auto flex flex-col gap-2">
                        <!-- Users will be generated here -->
                    </div>
                </div>
            </div>
        </div>

        <!-- Help Modal -->
        <div id="help-modal-rol">
            <div id="help-modal-header-rol">
                <div class="flex items-center gap-4 font-bold text-lg">
                    <span>Manual de Usuario - Asignación de Roles a Usuarios</span>
                    <button onclick="document.getElementById('help-modal-iframe-rol').contentWindow.print()"
                        class="bg-white text-blue-600 px-3 py-1 text-sm rounded hover:bg-blue-50 transition flex items-center gap-2 shadow-sm">
                        <i class="fas fa-print"></i>
                        <span>Imprimir</span>
                    </button>
                </div>
                <div class="flex items-center">
                    <span class="text-white text-sm mr-2">Abrir en una nueva solapa la ayuda -></span>
                    <button id="maximize-help-modal-rol" title="Maximizar / Abrir en nueva pestaña"
                        class="text-white hover:text-gray-200 hover:bg-blue-700 rounded p-1 transition-colors mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                    </button>
                    <button id="close-help-modal-rol"
                        class="text-white hover:text-gray-200 hover:bg-blue-700 rounded p-1 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
            <iframe id="help-modal-iframe-rol" src="" class="w-full flex-grow bg-white" frameborder="0"></iframe>
        </div>
    `,

    /**
     * Inicialización del módulo
     */
    init: async (params = {}) => {

        const self = RolScreen;
        const token = sessionStorage.getItem('authToken');

        if (!token) {
            showToast('No hay sesión activa', 'error');
            navigate('dashboard');
            return;
        }

        // Render roles
        self.renderRoles();

        // Load users
        await self.loadUsers(token);

        // Setup event listeners
        self.setupEventListeners(token);

        // Setup document-level drag handlers
        self.setupDocumentHandlers(token);

        // Setup help modal
        self.setupHelpModal();

        // Salir button
        document.getElementById('btn-salir-rol')?.addEventListener('click', (e) => {
            e.preventDefault();
            navigate('dashboard');
            if (typeof openSidebar === 'function') {
                openSidebar();
            }
        });


    },

    /**
     * Renderizar botones de roles
     */
    renderRoles: () => {
        const rolesContainer = document.getElementById('roles-container-rol');
        if (!rolesContainer) return;

        const roles = [
            { id: 1, name: 'Rol 1', color: 'bg-blue-500' },
            { id: 2, name: 'Rol 2', color: 'bg-green-500' },
            { id: 3, name: 'Rol 3', color: 'bg-yellow-500' },
            { id: 4, name: 'Rol 4', color: 'bg-purple-500' },
            { id: 5, name: 'Rol 5', color: 'bg-pink-500' }
        ];

        rolesContainer.innerHTML = roles.map(role => `
            <div draggable="true" 
                 data-role-id="${role.id}"
                 class="role-button ${role.color} text-white font-bold py-3 px-4 rounded-lg shadow-md text-center">
                <i class="fas fa-grip-vertical mr-2"></i>${role.name}
            </div>
        `).join('');

        // Add drag event listeners
        document.querySelectorAll('#roles-container-rol .role-button').forEach(btn => {
            btn.addEventListener('dragstart', RolScreen.handleDragStart);
            btn.addEventListener('dragend', RolScreen.handleDragEnd);
        });
    },

    /**
     * Renderizar usuarios
     */
    renderUsers: () => {
        const self = RolScreen;
        const usersContainer = document.getElementById('users-container-rol');
        if (!usersContainer) return;

        usersContainer.innerHTML = self.usuarios.map(user => {
            const roleBadge = user.rolID ? `
                <span draggable="true" 
                      data-role-id="${user.rolID}"
                      data-usuario-id="${user.usuarioID}"
                      data-subusuario-id="${user.subusuarioID}"
                      class="role-badge ml-2 px-6 py-2 rounded-full text-white text-sm font-semibold ${self.getRoleColor(user.rolID)}">
                    <i class="fas fa-grip-vertical mr-1"></i>Rol ${user.rolID}
                </span>
            ` : '';

            return `
                <div class="user-button bg-gray-100 hover:bg-gray-200 p-4 rounded-lg shadow flex items-center justify-between"
                     data-usuario-id="${user.usuarioID}"
                     data-subusuario-id="${user.subusuarioID}">
                    <div class="flex items-center gap-3">
                        <i class="fas fa-user text-gray-600"></i>
                        <span class="font-semibold text-gray-800">${user.nombre}</span>
                        ${roleBadge}
                    </div>
                </div>
            `;
        }).join('');

        // Add drop event listeners
        document.querySelectorAll('#users-container-rol .user-button').forEach(btn => {
            btn.addEventListener('dragover', self.handleDragOver);
            btn.addEventListener('dragleave', self.handleDragLeave);
            btn.addEventListener('drop', self.handleDrop);
        });

        // Add drag event listeners to role badges
        document.querySelectorAll('#users-container-rol .role-badge').forEach(badge => {
            badge.addEventListener('dragstart', self.handleBadgeDragStart);
            badge.addEventListener('dragend', self.handleDragEnd);
        });
    },

    /**
     * Obtener color del rol
     */
    getRoleColor: (rolID) => {
        const colors = {
            1: 'bg-blue-500',
            2: 'bg-green-500',
            3: 'bg-yellow-500',
            4: 'bg-purple-500',
            5: 'bg-pink-500'
        };
        return colors[rolID] || 'bg-gray-500';
    },

    // Drag handlers
    handleDragStart: (e) => {
        // Verificar permisos antes de iniciar drag
        const screenName = RolScreen.name;
        const permissions = window.UserPermissions && window.UserPermissions[screenName];
        const canWrite = permissions ? permissions.canWrite : false;

        if (!canWrite) {
            e.preventDefault();
            return;
        }

        RolScreen.draggedRolID = parseInt(e.target.dataset.roleId);
        RolScreen.draggedFromUser = null;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    },

    handleBadgeDragStart: (e) => {
        // Verificar permisos antes de iniciar drag
        const screenName = RolScreen.name;
        const permissions = window.UserPermissions && window.UserPermissions[screenName];
        const canWrite = permissions ? permissions.canWrite : false;

        if (!canWrite) {
            e.preventDefault();
            return;
        }

        RolScreen.draggedRolID = parseInt(e.target.dataset.roleId);
        RolScreen.draggedFromUser = {
            usuarioID: e.target.dataset.usuarioId,
            subusuarioID: e.target.dataset.subusuarioId
        };
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.stopPropagation();
    },

    handleDragEnd: (e) => {
        e.target.classList.remove('dragging');
        document.querySelectorAll('#users-container-rol .user-button').forEach(btn => {
            btn.classList.remove('drag-over');
        });
    },

    handleDragOver: (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        e.currentTarget.classList.add('drag-over');
    },

    handleDragLeave: (e) => {
        e.currentTarget.classList.remove('drag-over');
    },

    handleDrop: async (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        const token = sessionStorage.getItem('authToken');
        const usuarioID = e.currentTarget.dataset.usuarioId;
        const subusuarioID = e.currentTarget.dataset.subusuarioId;
        await RolScreen.assignRole(usuarioID, subusuarioID, RolScreen.draggedRolID, token);
    },

    /**
     * Configurar handlers a nivel documento
     */
    setupDocumentHandlers: (token) => {
        const self = RolScreen;

        self.documentDragOverHandler = (e) => {
            if (e.target.closest('#users-container-rol .user-button')) return;
            e.preventDefault();
        };

        self.documentDropHandler = async (e) => {
            if (e.target.closest('#users-container-rol .user-button')) return;
            e.preventDefault();
            if (self.draggedFromUser) {
                await self.removeRole(self.draggedFromUser.usuarioID, self.draggedFromUser.subusuarioID, token);
                self.draggedFromUser = null;
            }
        };

        document.addEventListener('dragover', self.documentDragOverHandler);
        document.addEventListener('drop', self.documentDropHandler);
    },

    /**
     * Setup event listeners
     */
    setupEventListeners: (token) => {
        // Ya configurado en renderRoles y renderUsers
    },

    /**
     * Cargar usuarios
     */
    loadUsers: async (token) => {
        const self = RolScreen;
        try {
            const response = await fetch('/api/usuarios-roles', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                if (response.status === 403) {
                    showToast('No tienes permisos para gestionar roles', 'error');
                    setTimeout(() => navigate('dashboard'), 2000);
                    return;
                }
                throw new Error('Error al cargar usuarios');
            }

            const data = await response.json();
            self.usuarios = data.usuarios;
            self.renderUsers();
        } catch (error) {
            showToast(error.message, 'error');
        }
    },

    /**
     * Asignar rol
     */
    assignRole: async (usuarioID, subusuarioID, rolID, token) => {
        const self = RolScreen;
        try {
            const response = await fetch(`/api/usuarios-roles/${usuarioID}/${subusuarioID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ rolID })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            showToast(result.message, 'info');

            const user = self.usuarios.find(u => u.usuarioID == usuarioID && u.subusuarioID == subusuarioID);
            if (user) {
                user.rolID = rolID;
                self.renderUsers();
            }
        } catch (error) {
            showToast(error.message, 'error');
        }
    },

    /**
     * Remover rol
     */
    removeRole: async (usuarioID, subusuarioID, token) => {
        const self = RolScreen;
        try {
            const response = await fetch(`/api/usuarios-roles/${usuarioID}/${subusuarioID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ rolID: null })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            showToast(result.message, 'info');

            const user = self.usuarios.find(u => u.usuarioID == usuarioID && u.subusuarioID == subusuarioID);
            if (user) {
                user.rolID = null;
                self.renderUsers();
            }
        } catch (error) {
            showToast(error.message, 'error');
        }
    },

    /**
     * Configurar modal de ayuda
     */
    setupHelpModal: () => {
        const self = RolScreen;
        const helpModal = document.getElementById('help-modal-rol');
        const helpHeader = document.getElementById('help-modal-header-rol');
        const helpIframe = document.getElementById('help-modal-iframe-rol');

        // Abrir modal
        document.getElementById('btn-ayuda-rol')?.addEventListener('click', () => {
            const manualPath = 'ayudas/manual_roles.html';
            if (!helpIframe.getAttribute('src') || helpIframe.getAttribute('src') !== manualPath) {
                helpIframe.src = manualPath;
            }
            helpModal.style.display = 'flex';
        });

        // Cerrar modal
        document.getElementById('close-help-modal-rol')?.addEventListener('click', () => {
            helpModal.style.display = 'none';
        });

        // Maximizar
        document.getElementById('maximize-help-modal-rol')?.addEventListener('click', () => {
            helpModal.style.display = 'none';
            window.open('ayudas/manual_roles.html', '_blank');
        });

        // Arrastrable
        helpHeader?.addEventListener('mousedown', function (e) {
            self.isDragging = true;
            self.startX = e.clientX;
            self.startY = e.clientY;
            const rect = helpModal.getBoundingClientRect();
            self.initialLeft = rect.left;
            self.initialTop = rect.top;
            helpModal.style.right = 'auto';
            helpModal.style.bottom = 'auto';
            helpModal.style.left = self.initialLeft + 'px';
            helpModal.style.top = self.initialTop + 'px';
            document.body.style.userSelect = 'none';
        });

        self.documentMouseMoveHandler = (e) => {
            if (!self.isDragging) return;
            e.preventDefault();
            const dx = e.clientX - self.startX;
            const dy = e.clientY - self.startY;
            helpModal.style.left = (self.initialLeft + dx) + 'px';
            helpModal.style.top = (self.initialTop + dy) + 'px';
        };

        self.documentMouseUpHandler = () => {
            self.isDragging = false;
            document.body.style.userSelect = '';
        };

        document.addEventListener('mousemove', self.documentMouseMoveHandler);
        document.addEventListener('mouseup', self.documentMouseUpHandler);
    },

    /**
     * Limpieza al salir del módulo
     */
    destroy: () => {
        const self = RolScreen;

        // Remover event listeners de document
        if (self.documentDragOverHandler) {
            document.removeEventListener('dragover', self.documentDragOverHandler);
        }
        if (self.documentDropHandler) {
            document.removeEventListener('drop', self.documentDropHandler);
        }
        if (self.documentMouseMoveHandler) {
            document.removeEventListener('mousemove', self.documentMouseMoveHandler);
        }
        if (self.documentMouseUpHandler) {
            document.removeEventListener('mouseup', self.documentMouseUpHandler);
        }

        self.usuarios = [];
        self.draggedRolID = null;
        self.draggedFromUser = null;
    }
};

// Registrar en el router
if (window.SpaRouter) {
    window.SpaRouter.registerScreen('rol', RolScreen);
}

// Exponer para uso manual
window.RolScreen = RolScreen;
