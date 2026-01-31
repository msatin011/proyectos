/**
 * Usuario Screen Module
 * Administración de Colaboradores - Pantalla SPA
 */

const UsuarioScreen = {
    name: 'usuario',

    // Estado interno
    datosUsuarios: [],
    filaSeleccionada: null,
    deleteId: null,

    // Handlers para document-level events
    documentMouseMoveHandler: null,
    documentMouseUpHandler: null,
    isDraggingHelp: false,
    startXHelp: 0,
    startYHelp: 0,
    initialLeftHelp: 0,
    initialTopHelp: 0,

    /**
     * Estilos específicos del módulo
     */
    styles: `
        #help-modal-usuario {
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
        #help-modal-header-usuario {
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
        <style>${UsuarioScreen.styles}</style>
        
        <div class="h-full flex flex-col" data-menu-id="2">
            <!-- Barra de Herramientas -->
            <div class="mb-4 flex flex-wrap items-center gap-2 pb-4 border-b border-gray-300 sticky top-0 bg-theme-bg z-20">
                <h1 class="text-2xl font-bold text-gray-800 mr-6">Colaboradores</h1>
                <img style="width:3em" src="img/usuarios.png" alt="Icono">
                <button id="btn-alta-usu"
                    class="gradiente hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M5 12h14" />
                        <path d="M12 5v14" />
                    </svg>
                    <span>Agregar</span>
                </button>
                <button id="btn-modificar-usu"
                    class="gradiente hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                        <path d="m15 5 4 4" />
                    </svg>
                    <span>Modificar</span>
                </button>
                <button id="btn-eliminar-usu"
                    class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                    <span>Eliminar</span>
                </button>
                <button id="btn-exportar-usu"
                    class="gradiente hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" x2="12" y1="15" y2="3" />
                    </svg>
                    <span>Exportar</span>
                </button>
                <button id="btn-importar-usu"
                    class="gradiente hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" x2="12" y1="3" y2="15" />
                    </svg>
                    <span>Importar</span>
                </button>

                <div class="flex-grow"></div>

                <button id="btn-ayuda-usu"
                    class="flex items-center justify-center gap-2 rounded-md shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 text-white font-medium text-sm mr-4"
                    style="width: 140px; padding: 0.5rem 0.75rem; background: linear-gradient(180deg, #aad2eb 0%, #8c9bc4 100%); border: 0.5px solid #888;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <span>Ayuda</span>
                </button>

                <button id="btn-salir-usu"
                    class="gradiente hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    <span>Salir</span>
                </button>
            </div>

            <!-- Grilla de Usuarios -->
            <div id="grid-usuarios-usu" class="flex-grow overflow-y-auto relative">
                <table class="tabla w-full">
                    <thead>
                        <tr class="sticky top-0 z-10 bg-gray-100">
                            <th data-sort="nombre">Nombre</th>
                            <th data-sort="u">Usuario</th>
                            <th data-sort="celular">Celular</th>
                            <th data-sort="email">Email</th>
                            <th data-sort="activo" class="text-center">Activo</th>
                            <th data-sort="activohasta" class="text-center">Hasta</th>
                        </tr>
                    </thead>
                    <tbody id="tabla-usuarios-body-usu">
                        <!-- Las filas se insertarán aquí con JavaScript -->
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Modal para Alta -->
        <div id="usuario-modal-usu" class="fixed inset-0 bg-black bg-opacity-50 z-[60] hidden items-center justify-center p-4">
            <div class="bg-gray-50 rounded-lg shadow-xl w-full max-w-md transform transition-all scale-95 opacity-0 overflow-hidden">
                <div class="flex justify-between items-center p-5 bg-white border-b">
                    <h2 class="text-2xl font-bold text-theme-text flex items-center">
                        <img src='img/add.gif' class="mr-2">Nuevo Colaborador
                    </h2>
                    <button id="modal-close-btn-usu" class="text-gray-400 hover:text-gray-800 text-3xl leading-none">&times;</button>
                </div>
                <div class="p-6">
                    <form id="form-subusuario-usu">
                        <div class="mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2" for="x_n_usu">Nombre Completo</label>
                            <input id="x_n_usu" type="text" data-validations='{"tipo":"char", "largo":100}'
                                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                                placeholder="Ej: Juan Pérez" required>
                        </div>
                        <div class="mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2" for="x_u_usu">Usuario (Login)</label>
                            <input id="x_u_usu" type="text" data-validations='{"tipo":"char", "largo":45}'
                                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                                placeholder="Ej: jperez" required>
                        </div>
                        <div class="mb-6">
                            <label class="block text-gray-700 text-sm font-bold mb-2" for="x_c_usu">Celular</label>
                            <input id="x_c_usu" type="tel" data-validations='{"tipo":"num"}'
                                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                                placeholder="Ej: 54911..." required>
                        </div>
                        <div class="mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2" for="x_email_usu">Email (Opcional)</label>
                            <input id="x_email_usu" type="email" data-validations='{"tipo":"char", "largo":80}'
                                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                                placeholder="ejemplo@correo.com">
                        </div>
                        <div class="mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2" for="x_ah_usu">Activo Hasta (Opcional)</label>
                            <input id="x_ah_usu" type="text"
                                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                                placeholder="AAAAMMDD">
                        </div>
                        <div class="mb-6">
                            <label class="flex items-center cursor-pointer">
                                <span class="text-gray-700 text-sm font-bold mr-3">Activo</span>
                                <div class="relative">
                                    <input id="x_a_usu" type="checkbox" checked class="sr-only peer">
                                    <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </div>
                            </label>
                        </div>
                        <div class="flex justify-end gap-3 pt-4 border-t">
                            <button type="button" id="modal-cancel-btn-usu"
                                class="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded hover:bg-gray-300 transition-colors">Cancelar</button>
                            <button type="submit"
                                class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors">
                                <i class="fas fa-save mr-2"></i>Guardar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Modal para Modificación -->
        <div id="modal-editar-usuario-usu" class="fixed inset-0 bg-black bg-opacity-50 z-[60] hidden items-center justify-center p-4">
            <div class="bg-gray-50 rounded-lg shadow-xl w-full max-w-md transform transition-all scale-95 opacity-0 overflow-hidden">
                <div class="flex justify-between items-center p-5 bg-white border-b">
                    <h2 class="text-2xl font-bold text-theme-text flex items-center">
                        <img src='img/edit.gif' class="mr-2">Modificar Colaborador
                    </h2>
                    <button id="modal-edit-close-btn-usu" class="text-gray-400 hover:text-gray-800 text-3xl leading-none">&times;</button>
                </div>
                <div class="p-6">
                    <form id="form-editar-subusuario-usu">
                        <input type="hidden" id="edit_id_usu">
                        <div class="mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2" for="edit_n_usu">Nombre Completo</label>
                            <input id="edit_n_usu" type="text" data-validations='{"tipo":"char", "largo":100}'
                                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                                required>
                        </div>
                        <div class="mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2" for="edit_u_usu">Usuario (Login)</label>
                            <input id="edit_u_usu" type="text" data-validations='{"tipo":"char", "largo":45}'
                                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                                required>
                        </div>
                        <div class="mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2" for="edit_email_usu">Email</label>
                            <input id="edit_email_usu" type="email" data-validations='{"tipo":"char", "largo":80}'
                                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500">
                        </div>
                        <div class="mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2" for="edit_password_usu">Nueva Clave</label>
                            <input id="edit_password_usu" type="text" data-validations='{"tipo":"char", "largo":100}'
                                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                                placeholder="Dejar vacío para no cambiar">
                            <p class="text-xs text-gray-500 mt-1">Ingrese solo si desea cambiar la clave actual.</p>
                        </div>
                        <div class="mb-6">
                            <label class="block text-gray-700 text-sm font-bold mb-2" for="edit_c_usu">Celular</label>
                            <input id="edit_c_usu" type="tel" data-validations='{"tipo":"num"}'
                                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                                required>
                        </div>
                        <div class="mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2" for="edit_ah_usu">Activo Hasta</label>
                            <input id="edit_ah_usu" type="text"
                                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                                placeholder="AAAAMMDD">
                        </div>
                        <div class="mb-6">
                            <label class="flex items-center cursor-pointer">
                                <span class="text-gray-700 text-sm font-bold mr-3">Activo</span>
                                <div class="relative">
                                    <input id="edit_a_usu" type="checkbox" class="sr-only peer">
                                    <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </div>
                            </label>
                        </div>
                        <div class="flex justify-end gap-3 pt-4 border-t">
                            <button type="button" id="modal-edit-cancel-btn-usu"
                                class="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded hover:bg-gray-300 transition-colors">Cancelar</button>
                            <button type="submit"
                                class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors">
                                <i class="fas fa-save mr-2"></i>Actualizar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Modal de Confirmación de Eliminación -->
        <div id="confirmation-modal-usu" class="fixed inset-0 bg-black bg-opacity-50 z-[110] hidden items-center justify-center p-4">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all scale-95 opacity-0 overflow-hidden">
                <div class="p-6">
                    <h2 class="text-2xl font-bold text-theme-text flex items-center">
                        <img src='img/delete.gif' class="mr-2">Confirmar Eliminación de Colaborador
                    </h2>
                    <p id="confirmation-message-usu" class="text-gray-600 mb-6">¿Estás seguro?</p>
                    <div class="flex justify-end gap-3">
                        <button id="btn-cancel-delete-usu"
                            class="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Cancelar</button>
                        <button id="btn-confirm-delete-usu"
                            class="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700">Eliminar</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal de Importación -->
        <div id="import-modal-usu" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden items-center justify-center p-4">
            <div id="import-modal-content-usu" class="bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all scale-95 opacity-0 overflow-hidden">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold text-gray-800">Importar Colaboradores</h3>
                        <button id="close-import-modal-usu" class="text-gray-400 hover:text-gray-800 text-3xl leading-none">&times;</button>
                    </div>
                    <div class="space-y-4 text-gray-600">
                        <p>Descargar la plantilla de muestra en tu disco y completar los campos Nombre, Usuario login, email y celular.</p>
                        <p>Grabar las modificaciones.</p>
                    </div>
                    <div class="pt-8 flex flex-col items-center gap-4 border-t mt-6">
                        <input type="file" id="input-excel-import-usu" accept=".xlsx, .xls" class="hidden">
                        <button id="btn-descargar-plantilla-usu"
                            class="bg-blue-100 text-blue-700 hover:bg-blue-200 font-bold py-3 px-8 rounded-lg border border-blue-300 transition-all flex items-center gap-2 w-full justify-center">
                            <i class="fas fa-download"></i>
                            <span>Descargar Plantilla</span>
                        </button>
                        <button id="btn-abrir-excel-usu"
                            class="gradiente hover:bg-theme-secondary text-white font-bold py-3 px-8 rounded-lg shadow-md transition-all transform hover:scale-105 flex items-center gap-2 w-full justify-center">
                            <i class="fas fa-folder-open"></i>
                            <span>Abrir Excel para Importar</span>
                        </button>
                        <button id="btn-cancel-import-usu"
                            class="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors w-full">
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Help Modal -->
        <div id="help-modal-usuario">
            <div id="help-modal-header-usuario">
                <div class="flex items-center gap-4 font-bold text-lg">
                    <span>Manual de Usuario - Administración de Colaboradores</span>
                    <button onclick="document.getElementById('help-modal-iframe-usuario').contentWindow.print()"
                        class="bg-white text-blue-600 px-3 py-1 text-sm rounded hover:bg-blue-50 transition flex items-center gap-2 shadow-sm">
                        <i class="fas fa-print"></i>
                        <span>Imprimir</span>
                    </button>
                </div>
                <div class="flex items-center">
                    <span class="text-white text-sm mr-2">Abrir en una nueva solapa la ayuda -></span>
                    <button id="maximize-help-modal-usuario" title="Maximizar / Abrir en nueva pestaña"
                        class="text-white hover:text-gray-200 hover:bg-blue-700 rounded p-1 transition-colors mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                    </button>
                    <button id="close-help-modal-usuario"
                        class="text-white hover:text-gray-200 hover:bg-blue-700 rounded p-1 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
            <iframe id="help-modal-iframe-usuario" src="" class="w-full flex-grow bg-white" frameborder="0"></iframe>
        </div>
    `,

    /**
     * Inicialización del módulo
     */
    init: async (params = {}) => {
        const self = UsuarioScreen;
        const token = sessionStorage.getItem('authToken');

        if (!token) {
            showToast('No hay sesión activa', 'error');
            navigate('dashboard');
            return;
        }

        // Verificar permisos
        await self.checkPermissions(token);

        // Setup validación de usuario en tiempo real
        self.setupUsernameValidation(token);

        // Setup modales
        self.setupAltaModal(token);
        self.setupEditModal(token);
        self.setupDeleteModal(token);
        self.setupImportModal(token);
        self.setupExportButton(token);
        self.setupHelpModal();

        // Salir button
        document.getElementById('btn-salir-usu')?.addEventListener('click', (e) => {
            e.preventDefault();
            navigate('dashboard');
            if (typeof openSidebar === 'function') {
                openSidebar();
            }
        });

        // Cargar usuarios
        await self.cargarUsuarios(token);
    },

    /**
     * Verificar permisos del usuario
     * NOTA: El endpoint /api/permissions no existe en el servidor actual.
     * Los permisos se manejan a nivel de endpoint del backend.
     */
    checkPermissions: async (token) => {
        const self = UsuarioScreen;
        const screenName = self.name;
        const permissions = window.UserPermissions && window.UserPermissions[screenName];

        // Por defecto asumimos FALSE si no hay permisos cargados, salvo que sea admin (pero el backend ya filtra)
        // Sin embargo, para evitar bloqueo si falla la carga, podríamos validar.
        // Pero la regla es estricta: si rol != 1 y write != 1 -> disable.
        const canWrite = permissions ? permissions.canWrite : false;

        const buttons = [
            'btn-alta-usu',
            'btn-modificar-usu',
            'btn-eliminar-usu',
            'btn-importar-usu' // Importar es escribir
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
     * Debounce helper
     */
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Setup validación de username
     */
    setupUsernameValidation: (token) => {
        const self = UsuarioScreen;

        const checkUsernameAvailability = async (inputElement, subID = null) => {
            const u = inputElement.value.trim();
            const feedbackId = inputElement.id + '-feedback';
            let feedback = document.getElementById(feedbackId);

            if (!u || u.length < 2) {
                inputElement.classList.remove('border-red-500', 'border-green-500', 'border-2');
                inputElement.setCustomValidity('');
                if (feedback) feedback.remove();
                return;
            }

            if (!feedback) {
                feedback = document.createElement('p');
                feedback.id = feedbackId;
                feedback.className = 'text-xs mt-1 font-bold';
                inputElement.parentNode.appendChild(feedback);
            }

            try {
                let url = `/api/check-username?u=${encodeURIComponent(u)}`;
                if (subID) url += `&subID=${subID}`;

                const response = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const { exists } = await response.json();
                    if (exists) {
                        inputElement.classList.add('border-red-500', 'border-2');
                        inputElement.classList.remove('border-green-500');
                        feedback.textContent = '⚠ El usuario ya existe.';
                        feedback.className = 'text-xs mt-1 font-bold text-red-600';
                        inputElement.setCustomValidity('El usuario ya existe');
                    } else {
                        inputElement.classList.remove('border-red-500');
                        inputElement.classList.add('border-green-500', 'border-2');
                        feedback.textContent = '✔ Usuario disponible.';
                        feedback.className = 'text-xs mt-1 font-bold text-green-600';
                        inputElement.setCustomValidity('');
                    }
                }
            } catch (e) {
                console.error(e);
            }
        };

        const debouncedCheck = self.debounce((e) => checkUsernameAvailability(e.target), 500);
        const debouncedCheckEdit = self.debounce((e) => checkUsernameAvailability(e.target, document.getElementById('edit_id_usu').value), 500);

        document.getElementById('x_u_usu')?.addEventListener('input', debouncedCheck);
        document.getElementById('edit_u_usu')?.addEventListener('input', debouncedCheckEdit);
    },

    /**
     * Cargar usuarios
     */
    cargarUsuarios: async (token) => {
        const self = UsuarioScreen;
        try {
            const response = await fetch('/api/subusuarios', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Error al cargar colaboradores.');
            self.datosUsuarios = await response.json();
            self.renderTabla();

            // Inicializar gestor de tabla (filtros y ordenamiento)
            if (typeof initTableManager === 'function') {
                initTableManager('#grid-usuarios-usu', self.datosUsuarios, (data) => {
                    self.renderTabla(data);
                });
            }
        } catch (error) {
            showToast(error.message, 'error');
        }
    },

    /**
     * Renderizar tabla
     */
    renderTabla: (data = null) => {
        const self = UsuarioScreen;
        const tablaBody = document.getElementById('tabla-usuarios-body-usu');
        if (!tablaBody) return;

        tablaBody.innerHTML = '';
        const usuarios = data || self.datosUsuarios;
        usuarios.forEach(u => {
            const row = document.createElement('tr');
            row.className = 'cursor-pointer hover:bg-gray-100 border-b';
            row.dataset.id = u.subusuarioID;
            row.dataset.email = u.email || '';
            row.innerHTML = `
                <td class="px-4 py-2">${u.nombre}</td>
                <td class="px-4 py-2">${u.u}</td>
                <td class="px-4 py-2">${u.celular}</td>
                <td class="px-4 py-2">${u.email || ''}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-center">
                    ${u.activo
                    ? '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Sí</span>'
                    : '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">No</span>'}
                </td>
                <td class="px-4 py-2 text-center text-sm">
                    ${u.activoHasta ? String(u.activoHasta).replace(/^(\d{4})(\d{2})(\d{2})$/, '$3/$2/$1') : '-'}
                </td>
            `;
            row.addEventListener('click', () => {
                if (self.filaSeleccionada) self.filaSeleccionada.classList.remove('bg-blue-100');
                self.filaSeleccionada = row;
                self.filaSeleccionada.classList.add('bg-blue-100');
            });
            tablaBody.appendChild(row);
        });
    },

    /**
     * Setup modal de alta
     */
    setupAltaModal: (token) => {
        const self = UsuarioScreen;
        const modal = document.getElementById('usuario-modal-usu');
        const modalContent = modal?.querySelector('.transform');
        const form = document.getElementById('form-subusuario-usu');

        const openModal = () => {
            form.reset();
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            setTimeout(() => modalContent.classList.remove('scale-95', 'opacity-0'), 10);

            // Init Flatpickr
            if (typeof loadFlatpickr === 'function') {
                loadFlatpickr().then(() => {
                    flatpickr('#x_ah_usu', {
                        dateFormat: 'Ymd',
                        altInput: true,
                        altFormat: 'd/m/Y',
                        locale: 'es'
                    });
                });
            }
        };

        const closeModal = () => {
            modalContent.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }, 300);
        };

        document.getElementById('btn-alta-usu')?.addEventListener('click', openModal);
        document.getElementById('modal-close-btn-usu')?.addEventListener('click', closeModal);
        document.getElementById('modal-cancel-btn-usu')?.addEventListener('click', closeModal);

        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                nombre: document.getElementById('x_n_usu').value,
                u: document.getElementById('x_u_usu').value,
                celular: document.getElementById('x_c_usu').value,
                email: document.getElementById('x_email_usu').value
            };

            try {
                const response = await fetch('/api/subusuarios', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        ...data,
                        activo: document.getElementById('x_a_usu').checked,
                        activohasta: document.getElementById('x_ah_usu').value
                    })
                });

                const result = await response.json();
                if (!response.ok) {
                    if (response.status === 409) {
                        showToast(result.message, 'warning');
                        return;
                    }
                    throw new Error(result.message);
                }

                showToast(result.message, 'info');
                closeModal();
                self.cargarUsuarios(token);
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    },

    /**
     * Setup modal de edición
     */
    setupEditModal: (token) => {
        const self = UsuarioScreen;
        const modal = document.getElementById('modal-editar-usuario-usu');
        const modalContent = modal?.querySelector('.transform');
        const form = document.getElementById('form-editar-subusuario-usu');

        const openModal = (usuario) => {
            form.reset();
            document.getElementById('edit_id_usu').value = usuario.subusuarioID;
            document.getElementById('edit_n_usu').value = usuario.nombre;
            document.getElementById('edit_u_usu').value = usuario.u;
            document.getElementById('edit_c_usu').value = usuario.celular;
            document.getElementById('edit_email_usu').value = usuario.email || self.filaSeleccionada?.dataset.email || '';
            document.getElementById('edit_a_usu').checked = usuario.activo;
            document.getElementById('edit_ah_usu').value = usuario.activoHasta || '';

            modal.classList.remove('hidden');
            modal.classList.add('flex');
            setTimeout(() => modalContent.classList.remove('scale-95', 'opacity-0'), 10);

            // Init/Update Flatpickr
            if (typeof loadFlatpickr === 'function') {
                loadFlatpickr().then(() => {
                    const fp = flatpickr('#edit_ah_usu', {
                        dateFormat: 'Ymd',
                        altInput: true,
                        altFormat: 'd/m/Y',
                        locale: 'es'
                    });
                    if (usuario.activoHasta) {
                        fp.setDate(String(usuario.activoHasta), true, 'Ymd');
                    } else {
                        fp.clear();
                    }
                });
            }
        };

        const closeModal = () => {
            modalContent.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }, 300);
        };

        document.getElementById('btn-modificar-usu')?.addEventListener('click', () => {
            if (!self.filaSeleccionada) return showToast('Seleccione un colaborador.', 'warning');
            const id = self.filaSeleccionada.dataset.id;
            const usuario = self.datosUsuarios.find(u => u.subusuarioID == id);
            if (usuario) openModal(usuario);
        });

        document.getElementById('modal-edit-close-btn-usu')?.addEventListener('click', closeModal);
        document.getElementById('modal-edit-cancel-btn-usu')?.addEventListener('click', closeModal);

        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit_id_usu').value;
            const data = {
                nombre: document.getElementById('edit_n_usu').value,
                u: document.getElementById('edit_u_usu').value,
                celular: document.getElementById('edit_c_usu').value,
                email: document.getElementById('edit_email_usu').value,
                password: document.getElementById('edit_password_usu').value
            };

            try {
                const response = await fetch(`/api/subusuarios/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        ...data,
                        activo: document.getElementById('edit_a_usu').checked,
                        activohasta: document.getElementById('edit_ah_usu').value
                    })
                });

                const result = await response.json();
                if (!response.ok) {
                    if (response.status === 409) {
                        showToast(result.message, 'warning');
                        return;
                    }
                    throw new Error(result.message);
                }

                showToast(result.message, 'info');
                closeModal();
                self.cargarUsuarios(token);
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    },

    /**
     * Setup modal de eliminación
     */
    setupDeleteModal: (token) => {
        const self = UsuarioScreen;
        const modal = document.getElementById('confirmation-modal-usu');
        const modalContent = modal?.querySelector('.transform');

        const closeModal = () => {
            modalContent.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }, 300);
        };

        document.getElementById('btn-eliminar-usu')?.addEventListener('click', () => {
            if (!self.filaSeleccionada) return showToast('Seleccione un colaborador.', 'warning');
            self.deleteId = self.filaSeleccionada.dataset.id;
            const usuario = self.datosUsuarios.find(u => u.subusuarioID == self.deleteId);

            document.getElementById('confirmation-message-usu').textContent = `¿Eliminar a ${usuario.nombre}?`;
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            setTimeout(() => modalContent.classList.remove('scale-95', 'opacity-0'), 10);
        });

        document.getElementById('btn-cancel-delete-usu')?.addEventListener('click', closeModal);

        document.getElementById('btn-confirm-delete-usu')?.addEventListener('click', async () => {
            try {
                const response = await fetch(`/api/subusuarios/${self.deleteId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Error al eliminar.');

                showToast('Colaborador eliminado.', 'info');
                closeModal();
                self.filaSeleccionada = null;
                self.cargarUsuarios(token);
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    },

    /**
     * Setup modal de importación
     */
    setupImportModal: (token) => {
        const self = UsuarioScreen;
        const modal = document.getElementById('import-modal-usu');
        const modalContent = document.getElementById('import-modal-content-usu');
        const inputExcel = document.getElementById('input-excel-import-usu');

        const openModal = () => {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            setTimeout(() => modalContent.classList.remove('scale-95', 'opacity-0'), 10);
        };

        const closeModal = () => {
            modalContent.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                inputExcel.value = '';
            }, 300);
        };

        document.getElementById('btn-importar-usu')?.addEventListener('click', openModal);
        document.getElementById('close-import-modal-usu')?.addEventListener('click', closeModal);
        document.getElementById('btn-cancel-import-usu')?.addEventListener('click', closeModal);

        document.getElementById('btn-descargar-plantilla-usu')?.addEventListener('click', () => {
            window.location.href = 'templates/template_usuarios.xlsx';
        });

        document.getElementById('btn-abrir-excel-usu')?.addEventListener('click', () => {
            inputExcel.click();
        });

        inputExcel?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            e.target.value = '';
            if (!file) return;

            const formData = new FormData();
            formData.append('archivo', file);

            showToast('Importando...', 'info');

            try {
                const response = await fetch('/api/usuarios/importar', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });

                const result = await response.json();
                debugger;
                if (!response.ok) {
                    showToast(result.message, 'warning');
                } else {
                    closeModal();
                    showToast(result.message, 'info', 4000);
                    self.cargarUsuarios(token);
                }
            } catch (error) {
                showToast('Error de conexión al importar.', 'error');
                console.error(error);
            }
        });
    },

    /**
     * Setup botón de exportar
     */
    setupExportButton: (token) => {
        document.getElementById('btn-exportar-usu')?.addEventListener('click', async () => {
            showToast('Iniciando exportacion...Exportación completada.', 'info');

            try {
                const response = await fetch('/api/usuarios/exportar', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) throw new Error('Error al exportar');

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'Usuarios.xlsx';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                showToast('Exportación completada.', 'success');
            } catch (error) {
                console.error(error);
                showToast('Error al exportar usuarios.', 'error');
            }
        });
    },

    /**
     * Setup modal de ayuda
     */
    setupHelpModal: () => {
        const self = UsuarioScreen;
        const helpModal = document.getElementById('help-modal-usuario');
        const helpHeader = document.getElementById('help-modal-header-usuario');
        const helpIframe = document.getElementById('help-modal-iframe-usuario');
        const manualPath = 'ayudas/manual_usuario.html';

        document.getElementById('btn-ayuda-usu')?.addEventListener('click', () => {
            if (!helpIframe.getAttribute('src') || helpIframe.getAttribute('src') !== manualPath) {
                helpIframe.src = manualPath;
            }
            helpModal.style.display = 'flex';
        });

        document.getElementById('close-help-modal-usuario')?.addEventListener('click', () => {
            helpModal.style.display = 'none';
        });

        document.getElementById('maximize-help-modal-usuario')?.addEventListener('click', () => {
            helpModal.style.display = 'none';
            window.open(manualPath, '_blank');
        });

        // Draggable
        helpHeader?.addEventListener('mousedown', function (e) {
            if (e.target.closest('button')) return;
            self.isDraggingHelp = true;
            self.startXHelp = e.clientX;
            self.startYHelp = e.clientY;
            const rect = helpModal.getBoundingClientRect();
            self.initialLeftHelp = rect.left;
            self.initialTopHelp = rect.top;
            helpModal.style.right = 'auto';
            helpModal.style.bottom = 'auto';
            helpModal.style.left = self.initialLeftHelp + 'px';
            helpModal.style.top = self.initialTopHelp + 'px';
            document.body.style.userSelect = 'none';
        });

        self.documentMouseMoveHandler = (e) => {
            if (!self.isDraggingHelp) return;
            e.preventDefault();
            const dx = e.clientX - self.startXHelp;
            const dy = e.clientY - self.startYHelp;
            helpModal.style.left = (self.initialLeftHelp + dx) + 'px';
            helpModal.style.top = (self.initialTopHelp + dy) + 'px';
        };

        self.documentMouseUpHandler = () => {
            self.isDraggingHelp = false;
            document.body.style.userSelect = '';
        };

        document.addEventListener('mousemove', self.documentMouseMoveHandler);
        document.addEventListener('mouseup', self.documentMouseUpHandler);
    },

    /**
     * Limpieza al salir del módulo
     */
    destroy: () => {
        const self = UsuarioScreen;

        if (self.documentMouseMoveHandler) {
            document.removeEventListener('mousemove', self.documentMouseMoveHandler);
        }
        if (self.documentMouseUpHandler) {
            document.removeEventListener('mouseup', self.documentMouseUpHandler);
        }

        self.datosUsuarios = [];
        self.filaSeleccionada = null;
        self.deleteId = null;
    }
};

// Registrar en el router
if (window.SpaRouter) {
    window.SpaRouter.registerScreen('usuario', UsuarioScreen);
}

// Exponer para uso manual
window.UsuarioScreen = UsuarioScreen;
