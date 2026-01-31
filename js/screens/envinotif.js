/**
 * Envi Notif Screen Module
 * Programación de Notificaciones Web Push
 */

const EnvinotifScreen = {
    name: 'envinotif',

    // Estado interno
    users: [],
    flatpickrDate: null,
    flatpickrTime: null,

    template: (params = {}) => `
        <div class="h-full flex flex-col p-2 font-sans overflow-hidden text-sm bg-gray-100 rounded-lg">
            <header class="mb-2 flex justify-between items-center shrink-0 px-2">
                <div>
                    <h1 class="text-xl font-bold text-gray-800">Programación de Notificaciones Web Push</h1>
                    <p class="text-gray-600 text-xs">Configura destinatarios, fecha, hora y mensaje para notificación Push.</p>
                </div>
                <div class="flex gap-2">
                    <button id="btn-salir-notif"
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
                <aside class="bg-white rounded-xl shadow-xl overflow-hidden flex flex-col h-full bg-opacity-90 backdrop-blur-sm border border-white/30" style="width: 40%; flex-shrink: 0;">
                    <div class="p-2 bg-blue-600 text-white flex justify-between items-center shrink-0">
                        <h2 class="font-bold text-sm">Destinatarios (Suscritos)</h2>
                        <div class="flex items-center gap-2">
                            <input type="checkbox" id="select-all-notif" class="w-3 h-3 rounded cursor-pointer">
                            <label for="select-all-notif" class="text-xs cursor-pointer">Todos</label>
                        </div>
                    </div>
                    <!-- Buscador rápido -->
                    <div class="p-2 border-b shrink-0">
                        <input type="text" id="user-search-notif" placeholder="Buscar usuario..."
                            class="w-full px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500 outline-none text-xs">
                    </div>
                    <!-- Lista de usuarios -->
                    <div id="user-list-notif" class="flex-1 overflow-y-auto p-1 space-y-1">
                        <div class="flex items-center justify-center h-full text-gray-400 italic text-xs">
                            Cargando usuarios...
                        </div>
                    </div>
                    <div class="p-2 bg-gray-50 border-t text-xs text-gray-500 shrink-0">
                        Seleccionados: <span id="selected-count-notif" class="font-bold text-blue-600">0</span>
                    </div>
                </aside>

                <!-- Columna Derecha: Formulario (60%) -->
                <main class="h-full" style="width: 60%; flex-grow: 1; min-w-0;">
                    <form id="notif-form"
                        class="bg-white rounded-xl shadow-xl p-3 h-full flex flex-col gap-2 bg-opacity-90 backdrop-blur-sm border border-white/30">
                        
                        <div class="grid grid-cols-2 gap-3 shrink-0">
                            <!-- Fecha -->
                            <div>
                                <label class="block text-xs font-semibold text-gray-700 mb-1">Fecha de Envío</label>
                                <input type="text" id="fecha-notif" required
                                    class="w-full px-2 py-1.5 rounded border border-gray-200 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm">
                            </div>
                            <!-- Hora -->
                            <div>
                                <label class="block text-xs font-semibold text-gray-700 mb-1">Hora de Envío</label>
                                <input type="text" id="hora-notif" required
                                    class="w-full px-2 py-1.5 rounded border border-gray-200 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm">
                            </div>
                        </div>

                        <!-- Mensaje -->
                        <div class="flex-1 flex flex-col min-h-0">
                            <label class="block text-xs font-semibold text-gray-700 mb-1">Contenido de la Notificación</label>
                            <textarea id="mensaje-notif" placeholder="Escribe el cuerpo de la notificación aquí..." required
                                data-validations='{"tipo":"char", "largo":500}'
                                class="w-full p-2 rounded border border-gray-200 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none flex-1 text-sm"></textarea>
                        </div>

                        <!-- Botón Enviar -->
                        <div class="pt-0 shrink-0">
                            <button type="submit" id="btn-submit-notif"
                                class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-2 text-sm">
                                <span>Programar Notificación</span>
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
    `,

    init: async (params = {}) => {

        const self = EnvinotifScreen;
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
        self.flatpickrDate = flatpickr("#fecha-notif", {
            locale: "es",
            dateFormat: "d/m/Y",
            defaultDate: "today",
            altInput: true,
            altFormat: "d/m/Y"
        });

        self.flatpickrTime = flatpickr("#hora-notif", {
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
        const self = EnvinotifScreen;

        // Salir
        document.getElementById('btn-salir-notif')?.addEventListener('click', () => {
            navigate('dashboard');
            if (typeof openSidebar === 'function') openSidebar();
        });

        // Validaciones inputs
        document.querySelectorAll('textarea[data-validations]').forEach(el => {
            el.addEventListener('input', validateInput);
        });

        // Search
        document.getElementById('user-search-notif')?.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = self.users.filter(u =>
                u.nombre.toLowerCase().includes(term) || u.u.toLowerCase().includes(term)
            );
            self.renderUsers(filtered);
        });

        // Select All
        document.getElementById('select-all-notif')?.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.user-checkbox');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
            self.updateCount();
        });

        // Submit
        document.getElementById('notif-form')?.addEventListener('submit', (e) => self.handleSubmit(e, token));
    },

    loadUsers: async (token) => {
        const self = EnvinotifScreen;
        const listContainer = document.getElementById('user-list-notif');

        try {
            const response = await fetch('/api/notificaciones/destinatarios', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Error al cargar destinatarios');
            self.users = await response.json();
            self.renderUsers(self.users);
        } catch (error) {
            listContainer.innerHTML = `<div class="p-4 text-red-500 text-sm">${error.message}</div>`;
        }
    },

    renderUsers: (usersToRender) => {
        const self = EnvinotifScreen;
        const listContainer = document.getElementById('user-list-notif');
        if (!listContainer) return;

        listContainer.innerHTML = '';
        if (usersToRender.length === 0) {
            listContainer.innerHTML = `<div class="p-4 text-gray-500 text-sm text-center">No hay usuarios suscritos.</div>`;
            return;
        }

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

        // Mantener contador actualizado
        self.updateCount();
    },

    updateCount: () => {
        const checkboxes = document.querySelectorAll('.user-checkbox');
        const checked = document.querySelectorAll('.user-checkbox:checked');
        const countSpan = document.getElementById('selected-count-notif');
        const selectAll = document.getElementById('select-all-notif');

        if (countSpan) countSpan.textContent = checked.length;
        if (selectAll && checkboxes.length > 0) selectAll.checked = checked.length > 0 && checked.length === checkboxes.length;
    },

    handleSubmit: async (e, token) => {
        e.preventDefault();
        const self = EnvinotifScreen;

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

        const horaVal = document.getElementById('hora-notif').value;

        const data = {
            destinatarios: checkedUsers,
            fecha: fechaISO,
            hora: horaVal,
            mensaje: document.getElementById('mensaje-notif').value
        };

        const btn = document.getElementById('btn-submit-notif');
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');

        try {
            const response = await fetch('/api/notificaciones/guardar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            const res = await response.json();

            if (response.ok) {
                showToast(res.message || 'Notificación programada.', 'success');
                // Reset
                document.getElementById('notif-form').reset();
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
        const self = EnvinotifScreen;
        const screenName = self.name;
        // Asumiendo que 'envinotif' es el nombre en UserPermissions
        const permissions = window.UserPermissions && window.UserPermissions[screenName];
        const canWrite = permissions ? permissions.canWrite : false;



        const btnSubmit = document.getElementById('btn-submit-notif');
        if (btnSubmit) {
            if (!canWrite) {
                btnSubmit.disabled = true;
                btnSubmit.classList.add('opacity-50', 'cursor-not-allowed');
                btnSubmit.title = "No tienes permisos para enviar notificaciones";
            } else {
                btnSubmit.disabled = false;
                btnSubmit.classList.remove('opacity-50', 'cursor-not-allowed');
                btnSubmit.title = "";
            }
        }
    },

    destroy: () => {
        const self = EnvinotifScreen;
        if (self.flatpickrDate) self.flatpickrDate.destroy();
        if (self.flatpickrTime) self.flatpickrTime.destroy();
    }
};

if (window.SpaRouter) {
    window.SpaRouter.registerScreen('envinotif', EnvinotifScreen);
}
