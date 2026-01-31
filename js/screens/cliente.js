/**
* Cliente Screen Module
* Administración de Clientes y Contactos - Pantalla SPA
*/

const ClienteScreen = {
    name: 'cliente',

    // Estado interno
    datosClientes: [],
    filaSeleccionada: null,
    deleteId: null,

    // Estado Contactos
    currentClienteIDForContactos: null,
    lastLoadedContactos: [],
    filaContactoSeleccionada: null,

    // Handlers para draggable inputs
    isDraggingHelp: false,
    startXHelp: 0,
    startYHelp: 0,
    initialLeftHelp: 0,
    initialTopHelp: 0,

    styles: `
        #help-modal-cliente {
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
        #help-modal-header-cliente {
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
        /* Estilos específicos para modales anidados si fuera necesario */
    `,

    template: (params = {}) => `
        <style>${ClienteScreen.styles}</style>
        
        <div class="h-full flex flex-col" data-menu-id="1">
            <!-- Barra de Herramientas -->
            <div class="mb-4 flex flex-wrap items-center gap-4 pb-4 border-b border-gray-300 sticky top-0 bg-theme-bg z-20">
                <h1 class="text-2xl font-bold text-gray-800 mr-6">Clientes</h1>
                <img style="width:3em" src="img/clientes.png" alt="Icono Clientes">

                <button id="btn-alta-cli"
                    class="gradiente hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M5 12h14" />
                        <path d="M12 5v14" />
                    </svg>
                    <span>Agregar</span>
                </button>
<button id="btn-modificar-cli"
                    class="gradiente hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                        <path d="m15 5 4 4" />
                    </svg>
                    <span>Modificar</span>
                </button>
                <button id="btn-eliminar-cli"
                    class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                    <span>Eliminar</span>
                </button>
                
                <button id="btn-exportar-cli"
                    class="gradiente hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" x2="12" y1="15" y2="3" />
                    </svg>
                    <span>Exportar</span>
                </button>
                <button id="btn-importar-cli"
                    class="gradiente hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" x2="12" y1="3" y2="15" />
                    </svg>
                    <span>Importar</span>
                </button>

                <div class="flex-grow"></div>

                <button id="btn-ayuda-cli"
                    class="flex items-center justify-center gap-2 rounded-md shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 text-white font-medium text-sm mr-4"
                    style="width: 140px; padding: 0.5rem 0.75rem; background: linear-gradient(180deg, #aad2eb 0%, #8c9bc4 100%); border: 0.5px solid #888;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <span>Ayuda</span>
                </button>

                <button id="btn-salir-cli"
                    class="gradiente hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    <span>Salir</span>
                </button>
            </div>

            <!-- Grilla Principal -->
            <div id="grid-clientes-cli" class="flex-grow overflow-y-auto relative">
            <center>
                <table class="tabla w-full-10">
                    <thead>
                        <tr class="sticky top-0 z-10 bg-gray-100">
                            <th data-sort="nombre">Nombre</th>
                            <th data-sort="cuit">CUIT</th>
                            <th data-sort="tipo">Tipo</th>
                            <th data-sort="localidad">Localidad</th>
                            <th data-sort="provinciaNombre">Provincia</th>
                            <th data-sort="activo" class="text-center">Activo</th>
                            <th class="text-center">Contactos</th>
                        </tr>
                    </thead>
                    <tbody id="tabla-clientes-body-cli">
                        <!-- Filas -->
                    </tbody>
                </table>
                </center>
            </div>
        </div>

        <!-- Modal Alta/Modificación Cliente -->
        <div id="cliente-modal-cli" class="fixed inset-0 bg-black bg-opacity-50 z-[60] hidden items-center justify-center p-4">
            <div class="bg-gray-50 rounded-lg shadow-xl w-full max-w-2xl transform transition-all scale-95 opacity-0 overflow-hidden">
                <div class="flex justify-between items-center p-5 bg-white border-b">
                    <h2 class="text-2xl font-bold text-theme-text flex items-center">
                        <img id="modal-icon-cli" src="img/add.gif" class="mr-2">
                        <span id="modal-title-cli">Alta de Cliente</span>
                    </h2>
                    <button id="modal-close-btn-cli" class="text-gray-400 hover:text-gray-800 text-3xl leading-none">&times;</button>
                </div>
                <div class="p-6">
                    <form id="form-cliente-cli">
                        <input type="hidden" id="x_id_cli">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                            <div class="md:col-span-3">
                                <label class="block text-sm font-semibold text-gray-600 mb-1">Nombre o Razón Social</label>
                                <input type="text" id="x_n_cli" data-validations='{"tipo":"char", "largo":100}'
                                    class="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" required>
                            </div>
                            <div class="md:col-span-1">
                                <label class="block text-sm font-semibold text-gray-600 mb-1">CUIT</label>
                                <input type="text" id="x_c_cli" placeholder="99-99999999-9" maxlength="13"
                                    class="block w-full border border-gray-300 rounded-md shadow-sm p-2" required>
                            </div>
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-600 mb-1">Tipo</label>
                                <select id="x_t_cli" class="block w-full border border-gray-300 rounded-md shadow-sm p-2">
                                    <option value="">Seleccione un tipo</option>
                                    <option value="Unipersonal">Unipersonal</option>
                                    <option value="Sociedad">Sociedad</option>
                                    <option value="ONG">ONG</option>
                                    <option value="Gobierno">Gobierno</option>
                                </select>
                            </div>
                            <div class="md:col-span-3">
                                <label class="block text-sm font-semibold text-gray-600 mb-1">Dirección</label>
                                <input type="text" id="x_d_cli" data-validations='{"tipo":"char", "largo":80}'
                                    class="block w-full border border-gray-300 rounded-md shadow-sm p-2">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-600 mb-1">Provincia</label>
                                <select id="x_p_cli" class="block w-full border border-gray-300 rounded-md shadow-sm p-2">
                                    <option value="">Cargando...</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-600 mb-1">Localidad</label>
                                <input type="text" id="x_l_cli" data-validations='{"tipo":"char", "largo":100}'
                                    class="block w-full border border-gray-300 rounded-md shadow-sm p-2">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-600 mb-1">Código Postal</label>
                                <input type="text" id="x_cp_cli" data-validations='{"tipo":"char", "largo":12}'
                                    class="block w-full border border-gray-300 rounded-md shadow-sm p-2">
                            </div>
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-600 mb-1">Teléfono</label>
                                <input type="text" id="x_tf_cli" data-validations='{"tipo":"num", "entero":true}'
                                    class="block w-full border border-gray-300 rounded-md shadow-sm p-2">
                            </div>
                            <div class="md:col-span-3 pt-2">
                                <label class="flex items-center cursor-pointer">
                                    <span class="text-gray-700 text-sm font-bold mr-3">Cliente Activo</span>
                                    <div class="relative">
                                        <input id="x_a_cli" type="checkbox" checked class="sr-only peer">
                                        <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </div>
                                </label>
                            </div>
                        </div>
                        <div class="pt-6 flex justify-end gap-3 border-t mt-6">
                            <button type="button" id="modal-cancel-btn-cli" class="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300">Cancelar</button>
                            <button type="submit" class="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700">Guardar Cliente</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Modal Contactos -->
        <div id="contactos-modal-cli" class="fixed inset-0 bg-black bg-opacity-50 z-[100] hidden items-center justify-center p-4">
            <div class="bg-white rounded-lg shadow-xl w-1/2 flex flex-col transform transition-all scale-95 opacity-0 overflow-hidden" style="height: 63vh;">
                <div class="p-4 border-b bg-gray-50 flex justify-between items-center flex-shrink-0">
                    <h2 id="contactos-title-cli" class="text-xl font-bold text-gray-800">Contactos</h2>
                    <button id="btn-salir-contactos-cli" class="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                </div>
                <div class="p-4 bg-gray-100 border-b flex gap-2 flex-shrink-0">
                    <button id="btn-alta-contacto-cli"
                        class="gradiente hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M5 12h14" />
                            <path d="M12 5v14" />
                        </svg>
                        <span>Agregar</span>
                    </button>
                    <button id="btn-eliminar-contacto-cli"
                        class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                        <span>Eliminar</span>
                    </button>
                </div>
                <!-- Grid Container: Flex-1 to take available space, overflow for scrolling -->
                <div id="grid-contactos-cli" class="flex-1 overflow-y-auto px-4 pb-4">
                    <table class="tabla w-full mt-2">
                        <thead class="sticky top-0 z-10 bg-gray-100">
                            <tr>
                                <th data-sort="nombre">Nombre</th>
                                <th data-sort="cargo">Cargo</th>
                                <th data-sort="email">Email</th>
                                <th data-sort="celular">Celular</th>
                                <th data-sort="activo" class="text-center">Activo</th>
                            </tr>
                        </thead>
                        <tbody id="tabla-contactos-body-cli">
                            <!-- Contactos -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Modal Alta/Edición Contacto (Popup sobre Modal Contactos) -->
        <div id="contacto-form-modal-cli" class="fixed inset-0 bg-black bg-opacity-50 z-[110] hidden items-center justify-center p-4">
             <div class="bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all scale-95 opacity-0 overflow-hidden">
                <div class="flex justify-between items-center p-4 border-b bg-gray-50">
                    <h3 id="contacto-form-title-cli" class="font-bold text-lg">Nuevo Contacto</h3>
                    <button id="close-contacto-form-cli" class="text-gray-400 hover:text-gray-800">&times;</button>
                </div>
                <div class="p-6">
                    <form id="form-contacto-cli">
                        <input type="hidden" id="cx_id_cli">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-bold text-gray-700">Nombre</label>
                                <input type="text" id="cx_n_cli" class="w-full border rounded p-2" required>
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-gray-700">Cargo</label>
                                <input type="text" id="cx_c_cli" class="w-full border rounded p-2">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-gray-700">Email</label>
                                <input type="email" id="cx_e_cli" class="w-full border rounded p-2">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-gray-700">Celular</label>
                                <input type="tel" id="cx_cl_cli" data-validations='{"tipo":"num"}' class="w-full border rounded p-2" required>
                            </div>
                            <div class="flex items-center cursor-pointer">
                                <span class="text-gray-700 text-sm font-bold mr-3">Activo</span>
                                <div class="relative">
                                    <input id="cx_a_cli" type="checkbox" checked class="sr-only peer">
                                    <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </div>
                            </div>
                        </div>
                        <div class="pt-4 flex justify-end gap-2 border-t mt-4">
                            <button type="button" id="cancel-contacto-btn-cli" class="bg-gray-200 px-4 py-2 rounded text-sm font-bold">Cancelar</button>
                            <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold">Guardar</button>
                        </div>
                    </form>
                </div>
             </div>
        </div>

        <!-- Confirmación Eliminar Cliente -->
        <div id="confirmation-modal-cli" class="fixed inset-0 bg-black bg-opacity-50 z-[120] hidden items-center justify-center p-4">
             <div class="bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all scale-95 opacity-0 p-6">
                <h2 class="text-xl font-bold mb-4">Confirmar Eliminación</h2>
                <p id="confirmation-message-cli" class="text-gray-600 mb-6">¿Seguro?</p>
                <div class="flex justify-end gap-3">
                    <button id="btn-cancel-delete-cli" class="bg-gray-200 px-4 py-2 rounded font-bold">Cancelar</button>
                    <button id="btn-confirm-delete-cli" class="bg-red-600 text-white px-4 py-2 rounded font-bold">Eliminar</button>
                </div>
             </div>
        </div>


        <!-- Import Modal -->
        <div id="import-modal-cli" class="fixed inset-0 bg-black bg-opacity-50 z-[90] hidden items-center justify-center p-4">
            <div id="import-modal-content-cli" class="bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all scale-95 opacity-0 p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold">Importar Clientes</h3>
                    <button id="close-import-modal-cli" class="text-gray-400 hover:text-gray-800 text-2xl">&times;</button>
                </div>
                <div class="space-y-4">
                    <button id="btn-descargar-plantilla-cli" class="w-full bg-blue-100 text-blue-700 py-3 rounded font-bold flex justify-center gap-2">
                        <i class="fas fa-download"></i> Descargar Plantilla
                    </button>
                    <input type="file" id="input-excel-import-cli" accept=".xlsx, .xls" class="hidden">
                    <button id="btn-abrir-excel-cli" class="w-full bg-green-600 text-white py-3 rounded font-bold flex justify-center gap-2">
                        <i class="fas fa-folder-open"></i> Abrir Excel
                    </button>
                </div>
            </div>
        </div>

        <!-- Ayuda Modal -->
        <div id="help-modal-cliente">
            <div id="help-modal-header-cliente">
                <span class="font-bold">Manual de Clientes</span>
                <div>
                     <button id="maximize-help-cli" class="text-white hover:bg-blue-700 p-1 rounded" title="Maximizar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                     </button>
                     <button id="close-help-cli" class="text-white hover:bg-blue-700 p-1 rounded" title="Cerrar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                     </button>
                </div>
            </div>
            <iframe id="help-iframe-cli" class="flex-grow w-full border-none"></iframe>
        </div>
    `,

    init: async (params = {}) => {
        const self = ClienteScreen;
        const token = sessionStorage.getItem('authToken');

        if (!token) {
            showToast('Sesión expirada', 'error');
            navigate('dashboard');
            return;
        }

        // Event Listeners
        self.setupEventListeners(token);

        // Verificar permisos
        self.checkPermissions();

        // Cargar datos
        await self.cargarProvincias(token);
        await self.cargarClientes(token);
    },

    setupEventListeners: (token) => {
        const self = ClienteScreen;

        // Salir
        document.getElementById('btn-salir-cli')?.addEventListener('click', () => {
            navigate('dashboard');
            if (typeof openSidebar === 'function') openSidebar();
        });

        // Alta Cliente
        document.getElementById('btn-alta-cli')?.addEventListener('click', () => self.openModalCliente());
        document.getElementById('modal-close-btn-cli')?.addEventListener('click', () => self.closeModalCliente());
        document.getElementById('modal-cancel-btn-cli')?.addEventListener('click', () => self.closeModalCliente());

        // Modificar Cliente
        document.getElementById('btn-modificar-cli')?.addEventListener('click', () => {
            if (!self.filaSeleccionada) return showToast('Seleccione un cliente', 'warning');
            const id = self.filaSeleccionada.dataset.id;
            const cliente = self.datosClientes.find(c => c.clienteID == id);
            if (cliente) self.openModalCliente(cliente);
        });

        // Formulario Cliente Submit
        document.getElementById('form-cliente-cli')?.addEventListener('submit', (e) => self.handleSaveCliente(e, token));

        // Eliminar Cliente
        document.getElementById('btn-eliminar-cli')?.addEventListener('click', () => {
            if (!self.filaSeleccionada) return showToast('Seleccione un cliente', 'warning');
            const id = self.filaSeleccionada.dataset.id;
            const nombre = self.filaSeleccionada.cells[0].textContent;
            self.openConfirmationModal(`¿Eliminar cliente "${nombre}"?`, () => self.deleteCliente(id, token));
        });

        // Confirmación Eliminar
        document.getElementById('btn-cancel-delete-cli')?.addEventListener('click', () => self.closeConfirmationModal());
        document.getElementById('btn-confirm-delete-cli')?.addEventListener('click', () => {
            if (typeof self.onConfirmDelete === 'function') {
                const callback = self.onConfirmDelete;
                self.onConfirmDelete = null; // Clear immediately to prevent double execution
                callback();
            }
        });

        // Importar / Exportar
        self.setupImportExport(token);

        // Ayuda
        self.setupHelp();

        // Contactos Modal Events
        document.getElementById('btn-salir-contactos-cli')?.addEventListener('click', () => self.closeContactosModal());
        document.getElementById('btn-alta-contacto-cli')?.addEventListener('click', () => self.openContactoForm());
        document.getElementById('btn-eliminar-contacto-cli')?.addEventListener('click', () => {
            if (!self.filaContactoSeleccionada) return showToast('Seleccione un contacto', 'warning');
            const id = self.filaContactoSeleccionada.dataset.id;
            const nombre = self.filaContactoSeleccionada.cells[0].textContent;
            self.openConfirmationModal(`¿Eliminar contacto "${nombre}"?`, () => self.performDeleteContacto(id));
        });
        document.getElementById('close-contacto-form-cli')?.addEventListener('click', () => self.closeContactoForm());
        document.getElementById('cancel-contacto-btn-cli')?.addEventListener('click', () => self.closeContactoForm());
        document.getElementById('form-contacto-cli')?.addEventListener('submit', (e) => self.handleSaveContacto(e, token));

        // Telefono y Celular Contacto: usar validateInput de utils.js
        const tfInput = document.getElementById('x_tf_cli');
        if (tfInput) tfInput.addEventListener('input', validateInput);

        const cxCelInput = document.getElementById('cx_cl_cli');
        if (cxCelInput) cxCelInput.addEventListener('input', validateInput);

        // CUIT: Máscara 99-99999999-9 y solo números
        const cuitInput = document.getElementById('x_c_cli');
        if (cuitInput) {
            cuitInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, ''); // Solo números
                if (value.length > 11) value = value.substring(0, 11); // Max 11 dígitos reales

                // Formatear: 99-99999999-9
                let formatted = '';
                if (value.length > 0) formatted = value.substring(0, 2);
                if (value.length > 2) formatted += '-' + value.substring(2, 10);
                if (value.length > 10) formatted += '-' + value.substring(10, 11);

                e.target.value = formatted;
            });
        }
    },

    cargarProvincias: async (token) => {
        try {
            const select = document.getElementById('x_p_cli');
            // Intentamos endpoint standard, si falla usaremos hardcoded o vacio
            const response = await fetch('/api/provincias', { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) {
                const provincias = await response.json();
                select.innerHTML = '<option value="">Seleccione...</option>';
                provincias.forEach(p => {
                    select.innerHTML += `<option value="${p.provinciaID}">${p.nombre}</option>`;
                });
            } else {
                select.innerHTML = '<option value="">Error cargando provincias</option>';
            }
        } catch (e) {
            console.error(e);
        }
    },

    cargarClientes: async (token) => {
        const self = ClienteScreen;
        try {
            const response = await fetch('/api/clientes', { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Error al cargar clientes');
            self.datosClientes = await response.json();
            self.renderTablaClientes();

            // Inicializar gestor de tabla (sort/filter) solo una vez
            if (typeof initTableManager === 'function') {
                initTableManager('#grid-clientes-cli', self.datosClientes, self.renderTablaClientes);
            }
        } catch (error) {
            showToast(error.message, 'error');
        }
    },

    renderTablaClientes: (dataToRender = null) => {
        const self = ClienteScreen;
        const tbody = document.getElementById('tabla-clientes-body-cli');
        tbody.innerHTML = '';

        // Usar datos proporcionados o todos los datos
        const data = dataToRender || self.datosClientes;

        data.forEach(c => {
            const row = document.createElement('tr');
            row.className = 'cursor-pointer hover:bg-gray-100 border-b';
            row.dataset.id = c.clienteID;

            // Contactos Button Logic
            const btnContactos = `<button class="btn-contactos-cli bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 rounded text-xs font-bold" data-id="${c.clienteID}" data-nombre="${c.nombre}">
                <i class="fas fa-users"></i> Ver (${c.contactosCount || 0})
            </button>`;

            row.innerHTML = `
                <td class="px-4 py-2">${c.nombre}</td>
                <td class="px-4 py-2">${c.cuit}</td>
                <td class="px-4 py-2">${c.tipo}</td>
                <td class="px-4 py-2">${c.localidad || ''}</td>
                <td class="px-4 py-2">${c.provinciaNombre || ''}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-center">
                    ${c.activo
                    ? '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Sí</span>'
                    : '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">No</span>'}
                </td>
                <td class="px-4 py-2 text-center" onclick="event.stopPropagation()">
                    ${btnContactos}
                </td>
            `;

            row.addEventListener('click', () => {
                if (self.filaSeleccionada) self.filaSeleccionada.classList.remove('bg-blue-100');
                self.filaSeleccionada = row;
                self.filaSeleccionada.classList.add('bg-blue-100');
            });

            // Contactos Click
            const btn = row.querySelector('.btn-contactos-cli');
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                self.openContactosModal(c.clienteID, c.nombre);
            });

            tbody.appendChild(row);
        });
    },

    // --- Modal Cliente Logic ---
    openModalCliente: (cliente = null) => {
        const modal = document.getElementById('cliente-modal-cli');
        const content = modal.querySelector('.transform');
        const form = document.getElementById('form-cliente-cli');
        const title = document.getElementById('modal-title-cli');
        const icon = document.getElementById('modal-icon-cli');

        form.reset();
        if (cliente) {
            title.textContent = 'Modificar Cliente';
            icon.src = 'img/edit.gif';
            document.getElementById('x_id_cli').value = cliente.clienteID;
            document.getElementById('x_n_cli').value = cliente.nombre;
            document.getElementById('x_c_cli').value = cliente.cuit;
            document.getElementById('x_t_cli').value = cliente.tipo;
            document.getElementById('x_d_cli').value = cliente.direccion || '';
            document.getElementById('x_p_cli').value = cliente.provinciaID || '';
            document.getElementById('x_l_cli').value = cliente.localidad || '';
            document.getElementById('x_cp_cli').value = cliente.codigoPostal || '';
            document.getElementById('x_tf_cli').value = cliente.telefono || '';
            document.getElementById('x_a_cli').checked = cliente.activo;
        } else {
            title.textContent = 'Alta de Cliente';
            icon.src = 'img/add.gif';
            document.getElementById('x_id_cli').value = '';
            document.getElementById('x_a_cli').checked = true;
        }

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => content.classList.remove('scale-95', 'opacity-0'), 10);
    },

    closeModalCliente: () => {
        const modal = document.getElementById('cliente-modal-cli');
        const content = modal.querySelector('.transform');
        content.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }, 300);
    },

    handleSaveCliente: async (e, token) => {
        e.preventDefault();
        const self = ClienteScreen;

        const data = {
            clienteID: document.getElementById('x_id_cli').value,
            nombre: document.getElementById('x_n_cli').value,
            cuit: document.getElementById('x_c_cli').value,
            tipo: document.getElementById('x_t_cli').value,
            direccion: document.getElementById('x_d_cli').value,
            provinciaID: document.getElementById('x_p_cli').value,
            localidad: document.getElementById('x_l_cli').value,
            codigoPostal: document.getElementById('x_cp_cli').value,
            telefono: document.getElementById('x_tf_cli').value,
            activo: document.getElementById('x_a_cli').checked
        };

        const method = data.clienteID ? 'PUT' : 'POST';
        const url = data.clienteID ? `/api/clientes/${data.clienteID}` : '/api/clientes';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Error guardando cliente');

            showToast(result.message || 'Cliente guardado', 'success');
            self.closeModalCliente();
            self.cargarClientes(token);

        } catch (error) {
            showToast(error.message, 'error');
        }
    },

    // --- Delete Confirmation ---
    openConfirmationModal: (msg, callback) => {
        const modal = document.getElementById('confirmation-modal-cli');
        const content = modal.querySelector('.transform');
        document.getElementById('confirmation-message-cli').textContent = msg;

        // Guardamos el callback en el objeto para usarlo en el listener estático
        ClienteScreen.onConfirmDelete = callback;

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => content.classList.remove('scale-95', 'opacity-0'), 10);
    },

    closeConfirmationModal: () => {
        const modal = document.getElementById('confirmation-modal-cli');
        const content = modal.querySelector('.transform');
        content.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            ClienteScreen.onConfirmDelete = null; // Limpiar callback
        }, 300);
    },

    deleteCliente: async (id, token) => {
        const self = ClienteScreen;
        try {
            const response = await fetch(`/api/clientes/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Error al eliminar');
            showToast('Cliente eliminado', 'info');
            self.closeConfirmationModal();
            self.filaSeleccionada = null;
            self.cargarClientes(token);
        } catch (error) {
            showToast(error.message, 'error');
        }
    },

    // --- Contactos Logic ---
    openContactosModal: async (clienteID, clienteNombre) => {
        const self = ClienteScreen;
        const token = sessionStorage.getItem('authToken');
        self.currentClienteIDForContactos = clienteID;

        document.getElementById('contactos-title-cli').textContent = `Contactos de: ${clienteNombre}`;

        const modal = document.getElementById('contactos-modal-cli');
        const content = modal.querySelector('.transform');

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => content.classList.remove('scale-95', 'opacity-0'), 10);

        await self.loadContactos(token);
    },

    closeContactosModal: () => {
        const self = ClienteScreen;
        const modal = document.getElementById('contactos-modal-cli');
        const content = modal.querySelector('.transform');
        content.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            self.filaContactoSeleccionada = null; // Reset selected row
        }, 300);
    },

    loadContactos: async (token) => {
        const self = ClienteScreen;
        try {
            const response = await fetch(`/api/clientes/${self.currentClienteIDForContactos}/contactos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                self.lastLoadedContactos = await response.json();
                self.renderTablaContactos();

                // Inicializar Table Manager para ordenamiento y filtrado
                if (typeof initTableManager === 'function') {
                    initTableManager('#grid-contactos-cli', self.lastLoadedContactos, self.renderTablaContactos);
                }
            }
        } catch (e) {
            console.error(e);
            showToast('Error cargando contactos', 'error');
        }
    },

    renderTablaContactos: (dataToRender = null) => {
        const self = ClienteScreen;
        const tbody = document.getElementById('tabla-contactos-body-cli');
        tbody.innerHTML = '';

        // Usar datos proporcionados o todos los datos
        const data = dataToRender || self.lastLoadedContactos;

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-500">No hay contactos.</td></tr>';
            return;
        }

        data.forEach(c => {
            const row = document.createElement('tr');
            row.className = 'cursor-pointer hover:bg-gray-100 border-b';
            row.dataset.id = c.contactoID;
            row.innerHTML = `
                <td class="px-4 py-2">${c.nombre}</td>
                <td class="px-4 py-2">${c.cargo || ''}</td>
                <td class="px-4 py-2">${c.email || ''}</td>
                <td class="px-4 py-2">${c.celular || ''}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-center">
                    ${c.activo
                    ? '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Sí</span>'
                    : '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">No</span>'
                }
                </td>
            `;

            // Row click selection
            row.addEventListener('click', () => {
                if (self.filaContactoSeleccionada) self.filaContactoSeleccionada.classList.remove('bg-blue-100');
                self.filaContactoSeleccionada = row;
                self.filaContactoSeleccionada.classList.add('bg-blue-100');
            });

            tbody.appendChild(row);
        });
    },

    openContactoForm: (contacto = null) => {
        const modal = document.getElementById('contacto-form-modal-cli');
        const content = modal.querySelector('.transform');
        const form = document.getElementById('form-contacto-cli');
        form.reset();

        if (contacto) {
            document.getElementById('contacto-form-title-cli').textContent = 'Editar Contacto';
            document.getElementById('cx_id_cli').value = contacto.contactoID;
            document.getElementById('cx_n_cli').value = contacto.nombre;
            document.getElementById('cx_c_cli').value = contacto.cargo || '';
            document.getElementById('cx_e_cli').value = contacto.email || '';
            document.getElementById('cx_cl_cli').value = contacto.celular || '';
            document.getElementById('cx_a_cli').checked = contacto.activo;
        } else {
            document.getElementById('contacto-form-title-cli').textContent = 'Nuevo Contacto';
            document.getElementById('cx_id_cli').value = '';
            document.getElementById('cx_a_cli').checked = true;
        }

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => content.classList.remove('scale-95', 'opacity-0'), 10);
    },

    closeContactoForm: () => {
        const modal = document.getElementById('contacto-form-modal-cli');
        const content = modal.querySelector('.transform');
        content.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }, 300);
    },

    handleSaveContacto: async (e, token) => {
        e.preventDefault();
        const self = ClienteScreen;
        const data = {
            contactoID: document.getElementById('cx_id_cli').value,
            nombre: document.getElementById('cx_n_cli').value.trim(),
            cargo: document.getElementById('cx_c_cli').value.trim(),
            email: document.getElementById('cx_e_cli').value.trim(),
            celular: document.getElementById('cx_cl_cli').value.trim(),
            activo: document.getElementById('cx_a_cli').checked
        };

        // Validaciones
        if (!data.nombre) return showToast('El nombre es obligatorio', 'warning');
        if (!data.celular) return showToast('El celular es obligatorio', 'warning');

        // Validar formato email si no está vacío
        if (data.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                return showToast('El formato del email es inválido', 'warning');
            }
        }

        const method = data.contactoID ? 'PUT' : 'POST';
        const url = data.contactoID
            ? `/api/clientes/${self.currentClienteIDForContactos}/contactos/${data.contactoID}`
            : `/api/clientes/${self.currentClienteIDForContactos}/contactos`;

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || result.error || 'Error al guardar contacto');
            }

            showToast('Contacto guardado', 'success');
            self.closeContactoForm();
            self.loadContactos(token);

        } catch (error) {
            showToast(error.message, 'error');
        }
    },

    deleteContacto: (contactoID) => {
        const self = ClienteScreen;
        self.openConfirmationModal('¿Eliminar este contacto?', () => self.performDeleteContacto(contactoID));
    },

    performDeleteContacto: async (contactoID) => {
        const self = ClienteScreen;
        const token = sessionStorage.getItem('authToken');
        try {
            const response = await fetch(`/api/clientes/${self.currentClienteIDForContactos}/contactos/${contactoID}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            let result;
            const textHTML = await response.text();
            try {
                result = JSON.parse(textHTML);
            } catch (e) {
                result = { message: textHTML || (response.ok ? 'Contacto eliminado' : 'Error al eliminar contacto') };
            }

            if (!response.ok) {
                throw new Error(result.message || result.error || 'Error al eliminar contacto');
            }

            showToast('Contacto eliminado', 'info');
            self.closeConfirmationModal();
            self.filaContactoSeleccionada = null; // Reset selected row
            self.loadContactos(token);
        } catch (error) {
            showToast(error.message, 'error');
        }
    },

    // --- Import/Export ---
    setupImportExport: (token) => {
        // Export
        document.getElementById('btn-exportar-cli')?.addEventListener('click', async () => {
            showToast('Generando Excel...', 'info');
            try {
                const response = await fetch('/api/exportar-clientes', { headers: { 'Authorization': `Bearer ${token}` } });
                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'clientes.xlsx';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                } else {
                    showToast('Error exportando', 'error');
                }
            } catch (e) { console.error(e); }
        });

        // Import
        const modal = document.getElementById('import-modal-cli');
        const content = document.getElementById('import-modal-content-cli');
        const input = document.getElementById('input-excel-import-cli');

        document.getElementById('btn-importar-cli')?.addEventListener('click', () => {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            setTimeout(() => content.classList.remove('scale-95', 'opacity-0'), 10);
        });

        document.getElementById('close-import-modal-cli')?.addEventListener('click', () => {
            content.classList.add('scale-95', 'opacity-0');
            setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); }, 300);
        });

        document.getElementById('btn-abrir-excel-cli')?.addEventListener('click', () => input.click());
        document.getElementById('btn-descargar-plantilla-cli')?.addEventListener('click', () => window.location.href = '/templates/template-clientes.xlsx');

        input?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const formData = new FormData();
            formData.append('archivo', file);

            showToast('Importando...', 'info');
            try {
                const response = await fetch('/api/importar-clientes', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                const res = await response.json();
                if (response.ok) {
                    showToast(res.message, 'success');
                    document.getElementById('close-import-modal-cli').click();
                    ClienteScreen.cargarClientes(token);
                } else {
                    showToast(res.message, 'error');
                }
            } catch (e) {
                showToast('Error de conexión', 'error');
            }
        });
    },

    // --- Help Modal ---
    setupHelp: () => {
        const self = ClienteScreen;
        const modal = document.getElementById('help-modal-cliente');
        const iframe = document.getElementById('help-iframe-cli');
        const header = document.getElementById('help-modal-header-cliente');
        const manualPath = 'ayudas/manual_clientes.html';

        document.getElementById('btn-ayuda-cli')?.addEventListener('click', () => {
            if (iframe.src.indexOf(manualPath) === -1) iframe.src = manualPath;
            modal.style.display = 'flex';
        });

        document.getElementById('close-help-cli')?.addEventListener('click', () => modal.style.display = 'none');
        document.getElementById('maximize-help-cli')?.addEventListener('click', () => {
            modal.style.display = 'none';
            window.open(manualPath, '_blank');
        });

        // Draggable logic
        header?.addEventListener('mousedown', (e) => {
            if (e.target.closest('button')) return;
            self.isDraggingHelp = true;
            self.startXHelp = e.clientX;
            self.startYHelp = e.clientY;
            const rect = modal.getBoundingClientRect();
            self.initialLeftHelp = rect.left;
            self.initialTopHelp = rect.top;
            modal.style.left = self.initialLeftHelp + 'px';
            modal.style.top = self.initialTopHelp + 'px';
            modal.style.right = 'auto';
            modal.style.bottom = 'auto';
            document.body.style.userSelect = 'none';

            if (!self.documentMouseMoveHandler) {
                self.documentMouseMoveHandler = (e) => {
                    if (!self.isDraggingHelp) return;
                    const dx = e.clientX - self.startXHelp;
                    const dy = e.clientY - self.startYHelp;
                    modal.style.left = (self.initialLeftHelp + dx) + 'px';
                    modal.style.top = (self.initialTopHelp + dy) + 'px';
                };
                document.addEventListener('mousemove', self.documentMouseMoveHandler);
            }

            if (!self.documentMouseUpHandler) {
                self.documentMouseUpHandler = () => {
                    self.isDraggingHelp = false;
                    document.body.style.userSelect = 'auto';
                };
                document.addEventListener('mouseup', self.documentMouseUpHandler);
            }
        });
    },

    /**
     * Verificar permisos de escritura
     */
    checkPermissions: () => {
        const self = ClienteScreen;
        const screenName = self.name;
        const permissions = window.UserPermissions && window.UserPermissions[screenName];
        const canWrite = permissions ? permissions.canWrite : false;



        const buttons = [
            'btn-alta-cli',
            'btn-modificar-cli',
            'btn-eliminar-cli',
            'btn-importar-cli'
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
    }
};

// Registrar en el router
if (window.SpaRouter) {
    window.SpaRouter.registerScreen('cliente', ClienteScreen);
}

// Exponer globalmente
window.ClienteScreen = ClienteScreen;
