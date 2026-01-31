/**
 * ABM Cron Screen Module
 * Administración de Tareas Cron
 */

const AbmCronScreen = {
    name: 'abmcron',

    // Estado interno
    cronList: [],
    selectedRow: null,

    // Help Dragging
    isDraggingHelp: false,
    startXHelp: 0,
    startYHelp: 0,
    initialLeftHelp: 0,
    initialTopHelp: 0,
    documentMouseMoveHandler: null,
    documentMouseUpHandler: null,

    template: (params = {}) => `
        <div class="h-full flex flex-col p-4 md:p-6 font-sans overflow-hidden bg-gray-100 rounded-lg">
            <!-- Toolbar -->
            <div class="mb-4 flex flex-wrap items-center gap-2 pb-4 border-b border-gray-300 shrink-0">
                <h1 class="text-2xl font-bold text-gray-800 mr-2">Cron</h1>
                <img style="width:3em" src="img/tiempo.png" alt="Icono">

                <button id="btn-alta-cron"
                    class="gradiente hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M5 12h14" />
                        <path d="M12 5v14" />
                    </svg>
                    <span>Agregar Cron</span>
                </button>
                <button id="btn-modificar-cron"
                    class="gradiente hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                        <path d="m15 5 4 4" />
                    </svg>
                    <span>Modificar Cron</span>
                </button>
                <button id="btn-eliminar-cron"
                    class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                    <span>Eliminar Cron</span>
                </button>

                <div class="ml-auto flex gap-3">
                    <button id="btn-ayuda-cron"
                        class="flex items-center justify-center gap-2 rounded-md shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 text-white font-medium text-sm"
                        style="width: 140px; padding: 0.5rem 0.75rem; background: linear-gradient(180deg, #aad2eb 0%, #8c9bc4 100%); border: 0.5px solid #888;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                        <span>Ayuda</span>
                    </button>
                    <button id="btn-salir-cron"
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

            <!-- Grid -->
            <div id="grid-cron-container" class="flex-grow overflow-y-auto relative bg-white rounded-lg shadow">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cron</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Hora Inicio</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Hora Fin</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Valor</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Repetir (min)</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Activo</th>
                        </tr>
                    </thead>
                    <tbody id="grid-cron-body" class="bg-white divide-y divide-gray-200">
                        <!-- Rows -->
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Modal para Alta/Edición (Reutilizado) -->
        <div id="modal-cron" class="fixed inset-0 bg-black bg-opacity-50 z-[60] hidden items-center justify-center p-4">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all scale-95 opacity-0 overflow-hidden flex flex-col max-h-[90vh]">
                <div class="flex justify-between items-center p-5 bg-white border-b shrink-0">
                    <h2 class="text-2xl font-bold text-gray-800 flex items-center">
                        <span id="modal-cron-title-icon" class="mr-2"></span>
                        <span id="modal-cron-title">Gestión Cron</span>
                    </h2>
                    <button id="modal-cron-close-btn" class="text-gray-400 hover:text-gray-800 text-3xl leading-none">&times;</button>
                </div>
                <div class="p-6 overflow-y-auto">
                    <form id="form-cron">
                        <input type="hidden" id="cron-id">

                        <div class="mb-4">
                            <label class="block text-gray-700 text-xs font-bold mb-1" for="input-cron">Nombre del Cron</label>
                            <input id="input-cron" type="text" data-validations='{"tipo":"char", "largo":40}'
                                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                placeholder="Ej: Backup diario" required>
                            <p class="text-[10px] text-gray-500 mt-1">Máximo 40 caracteres</p>
                        </div>

                        <div class="mb-4">
                            <label class="block text-gray-700 text-xs font-bold mb-1" for="input-tipo">Tipo</label>
                            <select id="input-tipo"
                                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                required>
                                <option value="">Seleccionar tipo</option>
                                <option value="dia fijo">Dia fijo</option>
                                <option value="todos los dias">Todos los dias</option>
                                <option value="dias del mes">Dias del mes</option>
                                <option value="dias de la semana">Dias de la semana</option>
                            </select>
                        </div>

                        <div class="mb-4 flex gap-4">
                            <div class="flex-1">
                                <label class="block text-gray-700 text-xs font-bold mb-1" for="input-horainicio">Hora Inicio (HHMM)</label>
                                <input id="input-horainicio" type="text" data-validations='{"tipo":"num", "largo":4}'
                                    class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                    placeholder="Ej: 0715" required>
                            </div>
                            <div class="flex-1">
                                <label class="block text-gray-700 text-xs font-bold mb-1" for="input-horafin">Hora Fin (HHMM)</label>
                                <input id="input-horafin" type="text" data-validations='{"tipo":"num", "largo":4}'
                                    class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                    placeholder="Ej: 1700" required>
                            </div>
                        </div>

                        <div class="mb-4" id="valor-container-cron">
                            <label class="block text-gray-700 text-xs font-bold mb-1" for="input-valor">Valor</label>
                            <input id="input-valor" type="text"
                                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow">
                        </div>

                        <div class="mb-4">
                            <label class="block text-gray-700 text-xs font-bold mb-1" for="input-repetir">Repetir cada minutos</label>
                            <input id="input-repetir" type="number" min="1"
                                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow">
                        </div>

                        <div class="mb-6">
                            <label class="flex items-center cursor-pointer">
                                <span class="text-gray-700 text-sm font-bold mr-3">Activo</span>
                                <div class="relative">
                                    <input id="input-activo" type="checkbox" checked class="sr-only peer">
                                    <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </div>
                            </label>
                        </div>

                        <div class="flex justify-end gap-3 pt-4 border-t shrink-0">
                            <button type="button" id="modal-cron-cancel-btn"
                                class="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded hover:bg-gray-300 transition-colors">Cancelar</button>
                            <button type="submit" id="btn-save-cron"
                                class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors flex items-center gap-2">
                                <i class="fas fa-save"></i> <span>Guardar</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Help Modal -->
        <div id="help-modal-cron">
            <div id="help-modal-header-cron">
                <div class="flex items-center gap-4 font-bold text-lg">
                    <span>Manual de Usuario - Cron</span>
                    <button onclick="document.getElementById('help-iframe-cron').contentWindow.print()"
                        class="bg-white text-blue-600 px-3 py-1 text-sm rounded hover:bg-blue-50 transition flex items-center gap-2 shadow-sm">
                        <i class="fas fa-print"></i>
                        <span>Imprimir</span>
                    </button>
                </div>
                <div class="flex items-center">
                    <span class="text-white text-sm mr-2">Abrir en una nueva solapa la ayuda -></span>
                    <button id="maximize-help-cron" title="Maximizar / Abrir en nueva pestaña"
                        class="text-white hover:text-gray-200 hover:bg-blue-700 rounded p-1 transition-colors mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                    </button>
                    <button id="close-help-cron"
                        class="text-white hover:text-gray-200 hover:bg-blue-700 rounded p-1 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
            <iframe id="help-iframe-cron" src="" class="w-full flex-grow bg-white" frameborder="0"></iframe>
        </div>

        <style>
             /* Local styles for modal content if needed */
             #help-modal-cron {
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
            #help-modal-header-cron {
                background: linear-gradient(180deg, #aad2eb 0%, #8c9bc4 100%);
                color: white;
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
        </style>
    `,

    init: async (params = {}) => {

        const self = AbmCronScreen;
        const token = sessionStorage.getItem('authToken');

        if (!token) {
            navigate('dashboard');
            return;
        }

        self.cronList = [];
        self.selectedRow = null;

        // Listeners
        self.setupEventListeners(token);

        // Load Data
        await self.loadCron(token);

        // Permissions
        self.checkPermissions();


    },

    setupEventListeners: (token) => {
        const self = AbmCronScreen;

        // Toolbar
        document.getElementById('btn-alta-cron')?.addEventListener('click', () => self.openModal('new'));
        document.getElementById('btn-modificar-cron')?.addEventListener('click', () => {
            if (!self.selectedRow) return showToast('Seleccione un cron', 'warning');
            const r = self.cronList.find(c => c.cronID == self.selectedRow.dataset.id);
            if (r) self.openModal('edit', r);
        });
        document.getElementById('btn-eliminar-cron')?.addEventListener('click', () => self.deleteCron(token));
        document.getElementById('btn-salir-cron')?.addEventListener('click', () => {
            navigate('dashboard');
            if (typeof openSidebar === 'function') openSidebar();
        });

        // Modal
        const modal = document.getElementById('modal-cron');
        const closeModal = () => {
            modal.querySelector('div.transform').classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }, 300);
        };

        document.getElementById('modal-cron-close-btn')?.addEventListener('click', closeModal);
        document.getElementById('modal-cron-cancel-btn')?.addEventListener('click', closeModal);

        document.getElementById('form-cron')?.addEventListener('submit', (e) => self.handleSave(e, token));

        // Toggle Valor field
        document.getElementById('input-tipo')?.addEventListener('change', (e) => {
            const valContainer = document.getElementById('valor-container-cron');
            if (e.target.value === 'todos los dias') {
                valContainer.style.display = 'none';
            } else {
                valContainer.style.display = 'block';
            }
        });

        // Validations
        document.querySelectorAll('input[data-validations]').forEach(el => {
            el.addEventListener('input', validateInput);
        });

        // Help
        self.setupHelp();
    },

    loadCron: async (token) => {
        const self = AbmCronScreen;
        try {
            const res = await fetch('/api/cron', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Error al cargar');
            self.cronList = await res.json();
            self.renderGrid(self.cronList);
        } catch (error) {
            showToast(error.message, 'error');
        }
    },

    renderGrid: (list) => {
        const self = AbmCronScreen;
        const tbody = document.getElementById('grid-cron-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        list.forEach(c => {
            const tr = document.createElement('tr');
            tr.className = 'cursor-pointer hover:bg-gray-100 border-b hover:bg-blue-50 transition-colors';
            tr.dataset.id = c.cronID;

            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">${c.cron || ''}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${c.tipo}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${c.horainicio}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${c.horafin}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${c.valor || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${c.repetircadaminutos || '-'}</td>
                 <td class="px-6 py-4 whitespace-nowrap text-sm">
                    ${c.activo
                    ? '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Sí</span>'
                    : '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">No</span>'}
                </td>
            `;

            tr.addEventListener('click', () => {
                if (self.selectedRow) self.selectedRow.classList.remove('bg-blue-100');
                self.selectedRow = tr;
                tr.classList.add('bg-blue-100');
            });

            tbody.appendChild(tr);
        });
    },

    openModal: (mode, data = null) => {
        const modal = document.getElementById('modal-cron');
        const content = modal.querySelector('div.transform');
        const form = document.getElementById('form-cron');
        form.reset();

        const title = document.getElementById('modal-cron-title');
        const icon = document.getElementById('modal-cron-title-icon');

        if (mode === 'new') {
            title.textContent = 'Nuevo Cron';
            icon.innerHTML = '<img src="img/add.gif" class="h-6 w-6">';
            document.getElementById('cron-id').value = '';
        } else {
            title.textContent = 'Modificar Cron';
            icon.innerHTML = '<img src="img/edit.gif" class="h-6 w-6">';

            document.getElementById('cron-id').value = data.cronID;
            document.getElementById('input-cron').value = data.cron || '';
            document.getElementById('input-tipo').value = data.tipo;
            document.getElementById('input-horainicio').value = data.horainicio;
            document.getElementById('input-horafin').value = data.horafin;
            document.getElementById('input-valor').value = data.valor || '';
            document.getElementById('input-repetir').value = data.repetircadaminutos || '';
            document.getElementById('input-activo').checked = data.activo;
        }

        // Trigger change to update valor container visibility
        document.getElementById('input-tipo').dispatchEvent(new Event('change'));

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => content.classList.remove('scale-95', 'opacity-0'), 10);
    },

    handleSave: async (e, token) => {
        e.preventDefault();
        const self = AbmCronScreen;
        const id = document.getElementById('cron-id').value;
        const isUpdate = !!id;

        const tipo = document.getElementById('input-tipo').value;
        const data = {
            cron: document.getElementById('input-cron').value,
            tipo: tipo,
            horainicio: document.getElementById('input-horainicio').value,
            horafin: document.getElementById('input-horafin').value,
            valor: tipo === 'todos los dias' ? '' : document.getElementById('input-valor').value,
            repetircadaminutos: document.getElementById('input-repetir').value,
            activo: document.getElementById('input-activo').checked
        };

        const url = isUpdate ? `/api/cron/${id}` : '/api/cron';
        const method = isUpdate ? 'PUT' : 'POST';

        const btn = document.getElementById('btn-save-cron');
        btn.disabled = true;

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            const result = await res.json();

            if (res.ok) {
                showToast(result.message, 'success');
                // Close modal
                document.getElementById('modal-cron-close-btn').click();
                self.loadCron(token);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            btn.disabled = false;
        }
    },

    deleteCron: async (token) => {
        const self = AbmCronScreen;
        if (!self.selectedRow) return showToast('Seleccione un cron', 'warning');
        if (!confirm('¿Eliminar este cron?')) return;

        const id = self.selectedRow.dataset.id;
        try {
            const res = await fetch(`/api/cron/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                showToast('Cron eliminado', 'success');
                self.selectedRow = null;
                self.loadCron(token);
            } else {
                showToast('Error al eliminar', 'error');
            }
        } catch (error) {
            showToast('Error de red', 'error');
        }
    },

    checkPermissions: () => {
        const self = AbmCronScreen;
        const screenName = self.name;
        const permissions = window.UserPermissions && window.UserPermissions[screenName];
        const canWrite = permissions ? permissions.canWrite : false; // Default to false if not found? Or maybe check if admin.



        const ids = ['btn-alta-cron', 'btn-modificar-cron', 'btn-eliminar-cron', 'btn-save-cron'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (!canWrite) {
                    el.disabled = true;
                    el.classList.add('opacity-50', 'cursor-not-allowed');
                } else {
                    el.disabled = false;
                    el.classList.remove('opacity-50', 'cursor-not-allowed');
                }
            }
        });
    },

    setupHelp: () => {
        const self = AbmCronScreen;
        const modal = document.getElementById('help-modal-cron');
        const iframe = document.getElementById('help-iframe-cron');
        const header = document.getElementById('help-modal-header-cron');
        const manualPath = 'ayudas/manual_cron.html';

        document.getElementById('btn-ayuda-cron')?.addEventListener('click', () => {
            if (!iframe.getAttribute('src') || iframe.getAttribute('src') !== manualPath) {
                iframe.src = manualPath;
            }
            modal.style.display = 'flex';
        });

        document.getElementById('close-help-cron')?.addEventListener('click', () => modal.style.display = 'none');
        document.getElementById('maximize-help-cron')?.addEventListener('click', () => {
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
        const self = AbmCronScreen;
        if (self.documentMouseMoveHandler) {
            document.removeEventListener('mousemove', self.documentMouseMoveHandler);
        }
        if (self.documentMouseUpHandler) {
            document.removeEventListener('mouseup', self.documentMouseUpHandler);
        }
    }
};

if (window.SpaRouter) {
    window.SpaRouter.registerScreen('abmcron', AbmCronScreen);
}
