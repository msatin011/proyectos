/**
 * Feriado Screen Module
 * ABM de Feriados - Pantalla SPA
 */

const FeriadoScreen = {
    name: 'feriado',

    // Referencia al Flatpickr para limpieza
    flatpickrInstance: null,
    selectedFeriadoID: null,

    /**
     * Estilos específicos del módulo
     */
    styles: `
        .selected-row {
            background-color: rgba(68, 102, 187, 0.1) !important;
            border-left: 4px solid var(--color-primary);
        }
        .table-container {
            flex-grow: 1;
            overflow-y: auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
    `,

    /**
     * Template HTML del módulo
     */
    template: (params = {}) => `
        <style>${FeriadoScreen.styles}</style>
        
        <div class="h-full flex flex-col">
            <!-- Barra de Herramientas -->
            <div class="mb-4 flex flex-wrap items-center gap-4 pb-4 border-b border-gray-300 sticky top-0 bg-theme-bg z-20">
                <h1 class="text-2xl font-bold text-gray-800 mr-2">Feriados</h1>
                <img style="width:2.5em" src="img/manual.png">

                <button id="btn-agregar-feriado"
                    class="gradiente hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M5 12h14" />
                        <path d="M12 5v14" />
                    </svg>
                    <span>Agregar Feriado</span>
                </button>
                <button id="btn-eliminar-feriado"
                    class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                    <span>Eliminar Feriado</span>
                </button>

                <div class="flex-grow"></div>
                <!-- Boton Salir a la derecha -->
                <button id="btn-salir-feriado"
                    class="gradiente hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    <span>Salir</span>
                </button>
            </div>
            
            <!-- Tabla de Feriados -->
            <div class="table-container">
                <table class="min-w-full divide-y divide-gray-200" id="tabla-feriados">
                    <thead class="bg-gray-50 sticky top-0">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Formato</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200" id="cuerpo-tabla-feriados">
                        <tr><td colspan="2" class="px-6 py-4 text-center text-gray-500 italic">Cargando...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Modal Agregar Feriado -->
        <div id="modal-agregar-feriado" class="fixed inset-0 bg-black bg-opacity-50 hidden flex items-center justify-center z-50">
            <div class="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm">
                <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
                    <i class="fas fa-calendar-day text-theme-primary"></i>
                    Nuevo Feriado
                </h2>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Seleccionar Fecha (DD/MM/AAAA)</label>
                    <div class="relative">
                        <input type="text" id="input-fecha-feriado" placeholder="Seleccione una fecha..."
                            class="w-full border border-gray-300 rounded-lg p-2 pr-10 focus:ring-2 focus:ring-theme-primary outline-none">
                        <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <i class="fas fa-calendar text-gray-400"></i>
                        </div>
                    </div>
                    <div class="flex justify-end gap-3 mt-4">
                        <button id="btn-cancelar-modal-feriado"
                            class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold transition-colors">Cancelar</button>
                        <button id="btn-guardar-feriado"
                            class="gradiente px-4 py-2 text-white rounded-lg font-bold shadow-md hover:opacity-90 transition-all">Guardar</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal de Confirmación de Eliminación -->
        <div id="confirmation-modal-feriado"
            class="fixed inset-0 bg-black bg-opacity-50 z-[110] hidden items-center justify-center p-4">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all scale-95 opacity-0 overflow-hidden"
                id="confirmation-modal-content-feriado">
                <div class="p-6">
                    <h2 class="text-2xl font-bold text-gray-800 flex items-center mb-4">
                        <img src='img/delete.gif' class="mr-2">Confirmar Eliminación
                    </h2>
                    <p id="confirmation-message-feriado" class="text-gray-600 mb-6">¿Estás seguro de que deseas eliminar este feriado?</p>
                    <div class="flex justify-end gap-3">
                        <button id="btn-cancel-delete-feriado"
                            class="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
                            Cancelar
                        </button>
                        <button id="btn-confirm-delete-feriado"
                            class="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                            OK-Eliminar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,

    /**
     * Inicialización del módulo
     */
    init: async (params = {}) => {

        const self = FeriadoScreen;
        self.selectedFeriadoID = null;

        // Cargar Flatpickr dinámicamente si no está disponible
        if (typeof loadFlatpickr === 'function') {
            await loadFlatpickr();
        }

        // Inicializar Flatpickr en el input
        self.flatpickrInstance = flatpickr("#input-fecha-feriado", {
            locale: "es",
            dateFormat: "d/m/Y",
            allowInput: true
        });

        // Verificar permisos
        self.checkPermissions();

        // Cargar datos
        await self.loadFeriados();

        // Event listeners
        self.setupEventListeners();


    },

    /**
     * Configurar event listeners
     */
    setupEventListeners: () => {
        const self = FeriadoScreen;

        // Botón Agregar -> Modal
        document.getElementById('btn-agregar-feriado')?.addEventListener('click', () => {
            document.getElementById('modal-agregar-feriado').classList.remove('hidden');
            const today = new Date();
            self.flatpickrInstance?.setDate(today);
            document.getElementById('input-fecha-feriado').focus();
        });

        // Cancelar Modal
        document.getElementById('btn-cancelar-modal-feriado')?.addEventListener('click', () => {
            document.getElementById('modal-agregar-feriado').classList.add('hidden');
        });

        // Guardar Feriado
        document.getElementById('btn-guardar-feriado')?.addEventListener('click', async () => {
            const fechaRaw = document.getElementById('input-fecha-feriado').value;
            if (!fechaRaw || fechaRaw.length < 10) {
                showToast('Por favor ingrese una fecha válida (DD/MM/AAAA).', 'error');
                return;
            }

            // Convertir DD/MM/AAAA a YYYY-MM-DD
            const parts = fechaRaw.split('/');
            if (parts.length !== 3) {
                showToast('Formato de fecha inválido.', 'error');
                return;
            }
            const fecha = `${parts[2]}-${parts[1]}-${parts[0]}`;

            try {
                const response = await fetch('/api/feriados', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify({ fecha })
                });

                const result = await response.json();
                if (response.ok) {
                    showToast(result.message || 'Feriado guardado', 'info');
                    document.getElementById('modal-agregar-feriado').classList.add('hidden');
                    self.loadFeriados();
                } else {
                    showToast(result.message || 'Error al guardar.', 'error');
                }
            } catch (err) {
                console.error('Error:', err);
                showToast('Error de conexión.', 'error');
            }
        });

        // Botón Eliminar
        document.getElementById('btn-eliminar-feriado')?.addEventListener('click', () => {
            if (!self.selectedFeriadoID) {
                showToast('Por favor seleccione un feriado de la tabla.', 'warning');
                return;
            }
            self.openConfirmationModal();
        });

        // Confirmar Eliminación
        document.getElementById('btn-confirm-delete-feriado')?.addEventListener('click', async () => {
            self.closeConfirmationModal();
            try {
                const response = await fetch(`/api/feriados/${self.selectedFeriadoID}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
                    }
                });

                if (response.ok) {
                    showToast('Feriado eliminado.', 'info');
                    self.selectedFeriadoID = null;
                    self.loadFeriados();
                } else {
                    const result = await response.json();
                    showToast(result.message || 'Error al eliminar.', 'error');
                }
            } catch (err) {
                showToast('Error de conexión.', 'error');
            }
        });

        // Cancelar Eliminación
        document.getElementById('btn-cancel-delete-feriado')?.addEventListener('click', () => self.closeConfirmationModal());
        document.getElementById('confirmation-modal-feriado')?.addEventListener('click', (e) => {
            if (e.target.id === 'confirmation-modal-feriado') self.closeConfirmationModal();
        });

        // Botón Salir -> SPA navigation
        document.getElementById('btn-salir-feriado')?.addEventListener('click', (e) => {
            e.preventDefault();
            navigate('dashboard');
            if (typeof openSidebar === 'function') {
                openSidebar();
            }
        });
    },

    /**
     * Cargar lista de feriados
     */
    loadFeriados: async () => {
        const self = FeriadoScreen;
        const tbody = document.getElementById('cuerpo-tabla-feriados');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="2" class="px-6 py-4 text-center text-gray-500 italic">Cargando...</td></tr>';

        try {
            const response = await fetch('/api/feriados', {
                headers: { 'Authorization': `Bearer ${sessionStorage.getItem('authToken')}` }
            });
            const feriados = await response.json();

            tbody.innerHTML = '';
            if (feriados.length === 0) {
                tbody.innerHTML = '<tr><td colspan="2" class="px-6 py-4 text-center text-gray-500 italic">No hay feriados definidos.</td></tr>';
                return;
            }

            feriados.forEach(f => {
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-gray-50 cursor-pointer transition-colors';
                tr.dataset.id = f.feriadoID;

                tr.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${self.formatIntDate(f.feriadoID)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${f.feriadoID}</td>
                `;

                tr.addEventListener('click', function () {
                    document.querySelectorAll('#cuerpo-tabla-feriados tr').forEach(row => row.classList.remove('selected-row'));
                    this.classList.add('selected-row');
                    self.selectedFeriadoID = this.dataset.id;
                });

                tbody.appendChild(tr);
            });
        } catch (err) {
            tbody.innerHTML = '<tr><td colspan="2" class="px-6 py-4 text-center text-red-500 italic">Error al cargar datos.</td></tr>';
        }
    },

    /**
     * Formatear fecha int (AAAAMMDD) a DD/MM/AAAA
     */
    formatIntDate: (intDate) => {
        const s = intDate.toString();
        if (s.length !== 8) return s;
        const y = s.substring(0, 4);
        const m = s.substring(4, 6);
        const d = s.substring(6, 8);
        return `${d}/${m}/${y}`;
    },

    /**
     * Abrir modal de confirmación
     */
    openConfirmationModal: () => {
        const modal = document.getElementById('confirmation-modal-feriado');
        const content = document.getElementById('confirmation-modal-content-feriado');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => {
            content.classList.remove('scale-95', 'opacity-0');
            content.classList.add('scale-100', 'opacity-100');
        }, 10);
    },

    /**
     * Cerrar modal de confirmación
     */
    closeConfirmationModal: () => {
        const modal = document.getElementById('confirmation-modal-feriado');
        const content = document.getElementById('confirmation-modal-content-feriado');
        content.classList.remove('scale-100', 'opacity-100');
        content.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }, 200);
    },

    /**
     * Verificar permisos de escritura
     */
    checkPermissions: () => {
        const self = FeriadoScreen;
        const screenName = self.name;
        const permissions = window.UserPermissions && window.UserPermissions[screenName];
        const canWrite = permissions ? permissions.canWrite : false;



        const buttons = [
            'btn-agregar-feriado',
            'btn-eliminar-feriado'
        ];

        buttons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                if (!canWrite) {
                    btn.classList.add('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
                    btn.disabled = true;
                    btn.title = "No tiene permisos para modificar";
                } else {
                    btn.classList.remove('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
                    btn.disabled = false;
                    btn.title = "";
                }
            }
        });
    },

    /**
     * Limpieza al salir del módulo
     */
    destroy: () => {

        const self = FeriadoScreen;

        // Destruir instancia de Flatpickr
        if (self.flatpickrInstance) {
            self.flatpickrInstance.destroy();
            self.flatpickrInstance = null;
        }

        self.selectedFeriadoID = null;
    }
};

// Registrar en el router
if (window.SpaRouter) {
    window.SpaRouter.registerScreen('feriado', FeriadoScreen);
}

// Exponer para uso manual
window.FeriadoScreen = FeriadoScreen;
