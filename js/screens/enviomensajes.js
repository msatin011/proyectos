/**
 * Envio Mensajes Screen Module
 * Envío de mensajes a usuarios (Web / App)
 * Screen: enviomensajes
 */

const EnvioMensajesScreen = {
    name: 'enviomensajes',

    // Estado interno
    users: [],
    flatpickrDate: null,
    flatpickrTime: null,
    isDraggingHelp: false,
    startXHelp: 0,
    startYHelp: 0,
    initialLeftHelp: 0,
    initialTopHelp: 0,

    // Handlers
    documentMouseMoveHandler: null,
    documentMouseUpHandler: null,

    styles: `
        .glass-panel {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .user-checkbox:checked+label {
            background-color: #3b82f6;
            color: white;
        }

        /* Modal Styles */
        #help-modal-masivo {
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

        #help-modal-header-masivo {
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

    template: (params = {}) => `
        <style>${EnvioMensajesScreen.styles}</style>
        
        <div class="h-full flex flex-col p-2 font-sans overflow-hidden text-sm bg-gray-100 rounded-lg">
            <header class="mb-2 flex justify-between items-center shrink-0 px-2">
                <div>
                    <h1 class="text-xl font-bold text-gray-800">Programación de Mensajes</h1>
                    <p class="text-gray-600 text-xs">Configura destinatarios, fecha, hora y mensaje.</p>
                </div>
                <div class="flex gap-2">
                    <button id="btn-ayuda-masivo"
                        class="flex items-center justify-center gap-2 rounded-md shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 text-white font-medium text-sm"
                        style="width: 140px; padding: 0.5rem 0.75rem; background: linear-gradient(180deg, #aad2eb 0%, #8c9bc4 100%); border: 0.5px solid #888;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                        <span>Ayuda</span>
                    </button>
                    <button id="btn-salir-masivo"
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

            <div class="flex flex-row gap-3 flex-1 min-h-0" style="display: flex; flex-direction: row; gap: 0.75rem;">
                <!-- Columna Izquierda: Destinatarios (40%) -->
                <aside class="bg-white rounded-xl shadow-xl overflow-hidden glass-panel flex flex-col h-full" style="width: 40%; flex-shrink: 0;">
                    <div class="p-2 bg-blue-600 text-white flex justify-between items-center shrink-0">
                        <h2 class="font-bold text-sm">Destinatarios</h2>
                        <div class="flex items-center gap-2">
                            <input type="checkbox" id="select-all-masivo" class="w-3 h-3 rounded cursor-pointer">
                            <label for="select-all-masivo" class="text-xs cursor-pointer">Todos</label>
                        </div>
                    </div>
                    <!-- Buscador rápido -->
                    <div class="p-2 border-b shrink-0">
                        <input type="text" id="user-search-masivo" placeholder="Buscar usuario..."
                            class="w-full px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500 outline-none text-xs">
                    </div>
                    <!-- Lista de usuarios -->
                    <div id="user-list-masivo" class="flex-1 overflow-y-auto p-1 space-y-1">
                        <div class="flex items-center justify-center h-full text-gray-400 italic text-xs">
                            Cargando usuarios...
                        </div>
                    </div>
                    <div class="p-2 bg-gray-50 border-t text-xs text-gray-500 shrink-0">
                        Seleccionados: <span id="selected-count-masivo" class="font-bold text-blue-600">0</span>
                    </div>
                </aside>

                <!-- Columna Derecha: Formulario (60%) -->
                <main class="h-full" style="width: 60%; flex-grow: 1; min-w-0;">
                    <form id="message-form-masivo"
                        class="bg-white rounded-xl shadow-xl p-3 glass-panel h-full flex flex-col gap-2">
                        <!-- Destinos -->
                        <div class="shrink-0">
                            <label class="block text-xs font-semibold text-gray-700 mb-1">Canales de Envío</label>
                            <div class="flex flex-wrap gap-2">
                                <div class="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                                    <input type="checkbox" id="dest-web-masivo" value="web" checked
                                        class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500">
                                    <label for="dest-web-masivo" class="text-gray-700 cursor-pointer select-none text-xs">🖥️
                                        Web</label>
                                </div>
                                <div class="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                                    <input type="checkbox" id="dest-celular-masivo" value="celular" checked
                                        class="w-4 h-4 text-green-600 rounded focus:ring-green-500">
                                    <label for="dest-celular-masivo" class="text-gray-700 cursor-pointer select-none text-xs">📱
                                        App</label>
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3 shrink-0">
                            <!-- Fecha -->
                            <div>
                                <label class="block text-xs font-semibold text-gray-700 mb-1">Fecha de Envío</label>
                                <input type="text" id="fecha-masivo" required
                                    class="w-full px-2 py-1.5 rounded border border-gray-200 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm">
                            </div>
                            <!-- Hora -->
                            <div>
                                <label class="block text-xs font-semibold text-gray-700 mb-1">Hora de Envío</label>
                                <input type="text" id="hora-masivo" required
                                    class="w-full px-2 py-1.5 rounded border border-gray-200 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm">
                            </div>
                        </div>

                        <!-- Título -->
                        <div class="shrink-0">
                            <label class="block text-xs font-semibold text-gray-700 mb-1">Título del Mensaje</label>
                            <input type="text" id="titulo-masivo" placeholder="Ej: Recordatorio de Tarea" required
                                data-validations='{"tipo":"char", "largo":40}' size="45"
                                class="w-full px-2 py-1.5 rounded border border-gray-200 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm">
                        </div>

                        <!-- Mensaje -->
                        <div class="flex-1 flex flex-col min-h-0">
                            <label class="block text-xs font-semibold text-gray-700 mb-1">Contenido del Mensaje</label>
                            <textarea id="mensaje-masivo" placeholder="Escribe el cuerpo del mensaje aquí..." required
                                data-validations='{"tipo":"char", "largo":500}'
                                class="w-full p-2 rounded border border-gray-200 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none flex-1 text-sm"></textarea>
                        </div>

                        <!-- Botón Enviar -->
                        <div class="pt-0 shrink-0">
                            <button type="submit" id="btn-submit-masivo"
                                class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-2 text-sm">
                                <span>Enviar Mensaje(s)</span>
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20"
                                    fill="currentColor">
                                    <path
                                        d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                </svg>
                            </button>
                        </div>
                    </form>
                </main>
            </div>
        </div>

        <!-- Help Modal -->
        <div id="help-modal-masivo">
            <div id="help-modal-header-masivo">
                <div class="flex items-center gap-4 font-bold text-lg">
                    <span>Manual de Usuario - Programación de Mensajes</span>
                    <button onclick="document.getElementById('help-iframe-masivo').contentWindow.print()"
                        class="bg-white text-blue-600 px-3 py-1 text-sm rounded hover:bg-blue-50 transition flex items-center gap-2 shadow-sm">
                        <i class="fas fa-print"></i>
                        <span>Imprimir</span>
                    </button>
                </div>
                <div class="flex items-center">
                    <span class="text-white text-sm mr-2">Abrir en una nueva solapa la ayuda -></span>
                    <button id="maximize-help-masivo" title="Maximizar / Abrir en nueva pestaña"
                        class="text-white hover:text-gray-200 hover:bg-blue-700 rounded p-1 transition-colors mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                    </button>
                    <button id="close-help-masivo"
                        class="text-white hover:text-gray-200 hover:bg-blue-700 rounded p-1 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
            <iframe id="help-iframe-masivo" src="" class="w-full flex-grow bg-white" frameborder="0"></iframe>
        </div>
    `,

    init: async (params = {}) => {

        const self = EnvioMensajesScreen;
        const token = sessionStorage.getItem('authToken');

        if (!token) {
            navigate('dashboard');
            return;
        }

        // Cargar Flatpickr
        if (typeof loadFlatpickr === 'function') {
            await loadFlatpickr();
        }

        // Inicializar Pickers
        self.flatpickrDate = flatpickr("#fecha-masivo", {
            locale: "es",
            dateFormat: "d/m/Y",
            defaultDate: "today",
            altInput: true,
            altFormat: "d/m/Y"
        });

        self.flatpickrTime = flatpickr("#hora-masivo", {
            enableTime: true,
            noCalendar: true,
            dateFormat: "H:i",
            time_24hr: true,
            defaultDate: new Date()
        });

        // Event Listeners
        self.setupEventListeners(token);
        self.checkPermissions();

        // Cargar Usuarios
        await self.loadUsers(token);


    },

    setupEventListeners: (token) => {
        const self = EnvioMensajesScreen;

        // Salir
        document.getElementById('btn-salir-masivo')?.addEventListener('click', () => {
            navigate('dashboard');
            if (typeof openSidebar === 'function') openSidebar();
        });

        // Validaciones inputs
        document.querySelectorAll('input[data-validations], textarea[data-validations]').forEach(el => {
            el.addEventListener('input', validateInput);
        });

        // Search
        document.getElementById('user-search-masivo')?.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = self.users.filter(u =>
                u.nombre.toLowerCase().includes(term) || u.u.toLowerCase().includes(term)
            );
            self.renderUsers(filtered);
        });

        // Select All
        document.getElementById('select-all-masivo')?.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.user-checkbox');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
            self.updateCount();
        });

        // Submit
        document.getElementById('message-form-masivo')?.addEventListener('submit', (e) => self.handleSubmit(e, token));

        // Ayuda
        self.setupHelp();
    },

    loadUsers: async (token) => {
        const self = EnvioMensajesScreen;
        const listContainer = document.getElementById('user-list-masivo');

        try {
            const response = await fetch('/api/mensajeria/destinatarios', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Error al cargar usuarios');
            self.users = await response.json();
            self.renderUsers(self.users);
        } catch (error) {
            listContainer.innerHTML = `<div class="p-4 text-red-500 text-sm">${error.message}</div>`;
        }
    },

    renderUsers: (usersToRender) => {
        const self = EnvioMensajesScreen;
        const listContainer = document.getElementById('user-list-masivo');
        if (!listContainer) return;

        listContainer.innerHTML = '';
        usersToRender.forEach(user => {
            const row = document.createElement('div');
            row.className = 'flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer group';
            row.innerHTML = `
                <input type="checkbox" id="user-${user.usuarioID}-${user.subusuarioID}" 
                    class="user-checkbox w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    data-uid="${user.usuarioID}" data-subid="${user.subusuarioID}">
                <label for="user-${user.usuarioID}-${user.subusuarioID}" class="flex-1 cursor-pointer select-none">
                    <div class="font-medium text-gray-800">${user.nombre}</div>
                    <div class="text-xs text-gray-500">@${user.u}</div>
                </label>
            `;
            // Hacer click en la fila trigger checkbox
            row.addEventListener('click', (e) => {
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'LABEL') {
                    const cb = row.querySelector('input');
                    cb.checked = !cb.checked;
                    self.updateCount();
                }
            });
            listContainer.appendChild(row);
        });

        // Listeners for individual checkboxes
        listContainer.querySelectorAll('.user-checkbox').forEach(cb => {
            cb.addEventListener('change', () => self.updateCount());
        });

        // Mantener contador actualizado si se renderiza filtro
        self.updateCount();
    },

    updateCount: () => {
        const checkboxes = document.querySelectorAll('.user-checkbox');
        const checked = document.querySelectorAll('.user-checkbox:checked');
        const countSpan = document.getElementById('selected-count-masivo');
        const selectAll = document.getElementById('select-all-masivo');

        if (countSpan) countSpan.textContent = checked.length;
        if (selectAll) selectAll.checked = checked.length > 0 && checked.length === checkboxes.length;
    },

    handleSubmit: async (e, token) => {
        e.preventDefault();
        const self = EnvioMensajesScreen;

        const checkedUsers = Array.from(document.querySelectorAll('.user-checkbox:checked')).map(cb => ({
            usuarioID: parseInt(cb.dataset.uid),
            subusuarioID: parseInt(cb.dataset.subid)
        }));

        if (checkedUsers.length === 0) {
            return showToast('Debes seleccionar al menos un destinatario', 'warning');
        }

        // Fecha y Hora
        const rawDate = self.flatpickrDate.selectedDates[0];
        if (!rawDate) return showToast('Fecha inválida', 'error');

        const fechaISO = rawDate.getFullYear() + '-' +
            String(rawDate.getMonth() + 1).padStart(2, '0') + '-' +
            String(rawDate.getDate()).padStart(2, '0');

        const horaVal = document.getElementById('hora-masivo').value;

        // Destinos
        const destinos = [];
        if (document.getElementById('dest-web-masivo').checked) destinos.push('web');
        if (document.getElementById('dest-celular-masivo').checked) destinos.push('celular');

        if (destinos.length === 0) {
            return showToast('Debes seleccionar al menos un canal de envío (Web o App)', 'warning');
        }

        const data = {
            destinatarios: checkedUsers,
            destinos: destinos,
            fecha: fechaISO,
            hora: horaVal,
            titulo: document.getElementById('titulo-masivo').value,
            mensaje: document.getElementById('mensaje-masivo').value
        };

        const btn = document.getElementById('btn-submit-masivo');
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');

        try {
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
                showToast('Mensaje(s) programados para enviar.', 'success');
                // Reset
                document.getElementById('message-form-masivo').reset();
                self.flatpickrDate.setDate(new Date());
                self.flatpickrTime.setDate(new Date());
                document.querySelectorAll('.user-checkbox').forEach(cb => cb.checked = false);
                self.updateCount();
            } else {
                throw new Error(res.message || 'Error al guardar');
            }
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    },

    checkPermissions: () => {
        const self = EnvioMensajesScreen;
        const screenName = self.name;

        let permissions = window.UserPermissions && window.UserPermissions[screenName];

        const canWrite = permissions ? permissions.canWrite : false;



        const btnSubmit = document.getElementById('btn-submit-masivo');
        if (btnSubmit) {
            if (!canWrite) {
                btnSubmit.disabled = true;
                btnSubmit.classList.add('opacity-50', 'cursor-not-allowed');
                btnSubmit.title = "No tienes permisos para enviar mensajes";
            } else {
                btnSubmit.disabled = false;
                btnSubmit.classList.remove('opacity-50', 'cursor-not-allowed');
                btnSubmit.title = "";
            }
        }
    },

    setupHelp: () => {
        const self = EnvioMensajesScreen;
        const modal = document.getElementById('help-modal-masivo');
        const iframe = document.getElementById('help-iframe-masivo');
        const header = document.getElementById('help-modal-header-masivo');
        const manualPath = 'ayudas/manual_enviomensajes.html';

        document.getElementById('btn-ayuda-masivo')?.addEventListener('click', () => {
            if (!iframe.getAttribute('src') || iframe.getAttribute('src') !== manualPath) {
                iframe.src = manualPath;
            }
            modal.style.display = 'flex';
        });

        document.getElementById('close-help-masivo')?.addEventListener('click', () => modal.style.display = 'none');
        document.getElementById('maximize-help-masivo')?.addEventListener('click', () => {
            modal.style.display = 'none';
            window.open(manualPath, '_blank');
        });

        // Draggable
        if (header) {
            header.addEventListener('mousedown', (e) => {
                if (e.target.closest('button')) return;
                self.isDraggingHelp = true;
                self.startXHelp = e.clientX;
                self.startYHelp = e.clientY;
                const rect = modal.getBoundingClientRect();
                self.initialLeftHelp = rect.left;
                self.initialTopHelp = rect.top;

                modal.style.right = 'auto';
                modal.style.bottom = 'auto';
                modal.style.left = self.initialLeftHelp + 'px';
                modal.style.top = self.initialTopHelp + 'px';

                document.body.style.userSelect = 'none';
            });

            self.documentMouseMoveHandler = (e) => {
                if (!self.isDraggingHelp) return;
                const dx = e.clientX - self.startXHelp;
                const dy = e.clientY - self.startYHelp;
                modal.style.left = (self.initialLeftHelp + dx) + 'px';
                modal.style.top = (self.initialTopHelp + dy) + 'px';
            };

            self.documentMouseUpHandler = () => {
                self.isDraggingHelp = false;
                document.body.style.userSelect = '';
            };

            document.addEventListener('mousemove', self.documentMouseMoveHandler);
            document.addEventListener('mouseup', self.documentMouseUpHandler);
        }
    },

    destroy: () => {
        const self = EnvioMensajesScreen;
        if (self.flatpickrDate) self.flatpickrDate.destroy();
        if (self.flatpickrTime) self.flatpickrTime.destroy();

        if (self.documentMouseMoveHandler) {
            document.removeEventListener('mousemove', self.documentMouseMoveHandler);
        }
        if (self.documentMouseUpHandler) {
            document.removeEventListener('mouseup', self.documentMouseUpHandler);
        }
    }
};

if (window.SpaRouter) {
    window.SpaRouter.registerScreen('enviomensajes', EnvioMensajesScreen);
}
