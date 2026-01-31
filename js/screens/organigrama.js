/**
 * Organigrama Screen Module
 * Administración de organigramas con editor visual (Árbol SVG)
 */

const OrganigramaScreen = {
    name: 'organigrama',

    // Estado interno
    selectedOG: null,
    currentOGData: {
        id: null,
        name: '',
        niveles: [], // { nivel: '1', nombreNivel: '...' }
        subusuarios: [] // { nivel: '1', subusuarioID: ... }
    },
    availableSubusers: [],
    tempSubusuarios: [],
    editingLevel: null,

    // Help Dragging state
    isDraggingHelp: false,
    startXHelp: 0,
    startYHelp: 0,
    initialLeftHelp: 0,
    initialTopHelp: 0,
    documentMouseMoveHandler: null,
    documentMouseUpHandler: null,

    styles: `
        /* Grid Styles from grillas.css */
        .tabla {
            width: 100%;
            border-collapse: collapse;
        }
        .tabla thead th {
            position: sticky;
            top: 0;
            z-index: 10;
            padding: 12px 12px;
            background-color: #4788c9;
            border-bottom: 2px solid #e5e7eb;
            color: #f0f2f5;
            font-size: 0.75rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            text-align: left;
            border: solid 0.4pt #fff;
            text-align: center;
            cursor: pointer;
            user-select: none;
        }

        .selected-row {
            background-color: rgba(68, 102, 187, 0.1) !important;
            border-left: 4px solid #3b82f6;
        }

        /* Editor Styles */
        #editor-container-og {
            background-color: #f8fafc;
            overflow: auto;
            position: relative;
            padding: 50px;
            min-height: 100%;
        }

        .og-node {
            width: 230px;
            background: white;
            border: 1px solid #5092e7;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            position: absolute; /* Changed dynamically but default absolute for lines */
            z-index: 10;
            height: 65px !important;
        }

        .og-node-header {
            padding: 5px;
            text-align: center;
            font-weight: 600;
            border-bottom: 0.5px solid #2d6dc7;
            min-height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.9em;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .og-node-body {
            padding: 4px;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 4px;
            font-size: 0.9em;
            white-space: nowrap;
            overflow: hidden;
        }

        .og-btn {
            padding: 4px;
            border-radius: 4px;
            font-size: 10px;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            background: transparent;
        }

        .og-btn:hover {
            background-color: #f1f5f9;
        }

        /* Tree Structure */
        .tree-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 60px;
            margin-top: 20px;
        }

        .tree-level {
            display: flex;
            justify-content: center;
            gap: 40px;
        }

        .static {
            position: relative !important;
        }

        /* Help Modal */
        #help-modal-og {
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
        #help-modal-header-og {
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
    `,

    template: (params = {}) => `
        <style>${OrganigramaScreen.styles}</style>
        
        <div class="h-full flex flex-col p-4 md:p-6 font-sans overflow-hidden bg-gray-100 rounded-lg">
            <!-- Toolbar -->
            <div class="mb-4 flex flex-wrap items-center gap-4 pb-4 border-b border-gray-300 shrink-0">
                <h1 class="text-2xl font-bold text-gray-800 mr-2">Organigramas</h1>
                <img style="width:2.5em" src="img/manual.png">

                <button id="btn-crear-og"
                    class="gradiente hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M5 12h14" />
                        <path d="M12 5v14" />
                    </svg>
                    <span>Crear Organigrama</span>
                </button>
                <button id="btn-modificar-og"
                    class="gradiente hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                        <path d="m15 5 4 4" />
                    </svg>
                    <span>Modificar</span>
                </button>
                <button id="btn-eliminar-og"
                    class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                    <span>Eliminar</span>
                </button>

                <div class="ml-auto flex gap-3">
                    <button id="btn-ayuda-og"
                        class="flex items-center justify-center gap-2 rounded-md shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 text-white font-medium text-sm"
                        style="width: 140px; padding: 0.5rem 0.75rem; background: linear-gradient(180deg, #aad2eb 0%, #8c9bc4 100%); border: 0.5px solid #888;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                        <span>Ayuda</span>
                    </button>
                    <button id="btn-salir-og"
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
            <div class="flex-grow overflow-y-auto bg-white rounded-lg shadow">
                <table class="tabla min-w-full divide-y divide-gray-200">
                    <thead>
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre del Organigrama</th>
                        </tr>
                    </thead>
                    <tbody id="grid-body-og" class="bg-white divide-y divide-gray-200">
                        <!-- Rows -->
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Full Screen Editor Modal -->
        <div id="editor-modal-og" class="fixed inset-0 bg-black bg-opacity-70 z-[100] hidden flex-col">
            <div class="bg-white h-full flex flex-col w-full relative">
                <!-- Header Editor -->
                <div class="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
                    <div class="flex items-center gap-4">
                        <h2 class="text-xl font-bold" id="editor-title-og">Editor de Organigrama</h2>
                        <input type="text" size="60" id="input-og-name" placeholder="Nombre del Organigrama"
                            data-validations='{"tipo":"char", "largo":45}'
                            class="border rounded p-2 w-64 focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div class="flex gap-3">
                        <button id="btn-grabar-og"
                            class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-all flex items-center gap-2">
                            <img src="img/guardar.png" class="h-5 w-5">
                            <span>Grabar</span>
                        </button>
                        <button id="btn-ayuda-editor-og"
                            class="flex items-center justify-center gap-2 rounded-md shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 text-white font-medium text-sm ml-2"
                            style="width: 140px; padding: 0.5rem 0.75rem; background: linear-gradient(180deg, #aad2eb 0%, #8c9bc4 100%); border: 0.5px solid #888;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                            <span>Ayuda</span>
                        </button>
                        <button id="btn-cerrar-editor-og"
                            class="gradiente hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2 ml-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                            <span>Salir</span>
                        </button>
                    </div>
                </div>

                <!-- Drawing Area -->
                <div id="editor-container-og" class="flex-grow relative pt-10">
                    <svg id="og-svg-layer" class="absolute inset-0 w-full h-full pointer-events-none" style="z-index: 5;"></svg>
                    <div id="og-tree-render" class="relative"></div>
                </div>
            </div>
        </div>

        <!-- Pop Up para nombres de nivel -->
        <div id="level-name-modal-og"
            class="fixed inset-0 bg-black bg-opacity-50 z-[120] hidden flex items-center justify-center">
            <div class="bg-white p-6 rounded-lg shadow-xl w-80">
                <h3 class="font-bold mb-4">Nombre del Nivel</h3>
                <input type="text" id="input-level-name-og" class="w-full border rounded p-2 mb-4"
                    data-validations='{"tipo":"char", "largo":45}'
                    placeholder="Ej: Dirección">
                <div class="flex justify-end gap-2">
                    <button id="btn-cancel-level-name-og" class="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                    <button id="btn-save-level-name-og" class="px-4 py-2 bg-blue-600 text-white rounded">Aceptar</button>
                </div>
            </div>
        </div>

        <!-- Pop Up para asignar usuarios -->
        <div id="users-modal-og" class="fixed inset-0 bg-black bg-opacity-50 z-[120] hidden flex items-center justify-center">
            <div class="bg-white p-6 rounded-lg shadow-xl w-96 max-h-[80vh] flex flex-col">
                <h3 class="font-bold mb-4">Colaboradores del Nivel</h3>
                <div id="subusers-list-og" class="flex-grow overflow-y-auto mb-4 border rounded p-2">
                    <!-- User list -->
                </div>
                <div class="flex justify-end gap-2">
                    <button id="btn-cancel-users-og"
                        class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 font-semibold transition-colors">Cancelar</button>
                    <button id="btn-apply-users-og"
                        class="px-4 py-2 bg-blue-600 text-white rounded hover:opacity-90 font-semibold transition-colors">OK</button>
                </div>
            </div>
        </div>

        <!-- Modal Confirmación Eliminar Nivel -->
        <div id="delete-confirm-modal-og" class="fixed inset-0 bg-black bg-opacity-50 hidden flex items-center justify-center" style="z-index: 2000;">
            <div class="bg-white p-6 rounded-lg shadow-xl w-96">
                <h3 class="text-lg font-bold text-gray-800 mb-2">Confirmar Eliminación</h3>
                <p class="text-gray-600 mb-6">¿Seguro desea eliminar este nivel y todos sus dependientes?</p>
                <div class="flex justify-end gap-3">
                    <button id="btn-cancel-delete-level-og"
                        class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors">Cancelar</button>
                    <button id="btn-confirm-delete-level-og"
                        class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">Eliminar</button>
                </div>
            </div>
        </div>

        <!-- Help Modal -->
        <div id="help-modal-og">
            <div id="help-modal-header-og">
                <div class="flex items-center gap-4 font-bold text-lg">
                    <span>Manual de Usuario - Organigramas</span>
                    <button onclick="document.getElementById('help-iframe-og').contentWindow.print()"
                        class="bg-white text-blue-600 px-3 py-1 text-sm rounded hover:bg-blue-50 transition flex items-center gap-2 shadow-sm">
                        <i class="fas fa-print"></i>
                        <span>Imprimir</span>
                    </button>
                </div>
                <div class="flex items-center">
                    <span class="text-white text-sm mr-2">Abrir en una nueva solapa la ayuda -></span>
                    <button id="maximize-help-og" title="Maximizar / Abrir en nueva pestaña"
                        class="text-white hover:text-gray-200 hover:bg-blue-700 rounded p-1 transition-colors mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                    </button>
                    <button id="close-help-og"
                        class="text-white hover:text-gray-200 hover:bg-blue-700 rounded p-1 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
            <iframe id="help-iframe-og" src="" class="w-full flex-grow bg-white" frameborder="0"></iframe>
        </div>
    `,

    init: async (params = {}) => {

        const self = OrganigramaScreen;
        const token = sessionStorage.getItem('authToken');

        if (!token) {
            navigate('dashboard');
            return;
        }

        // Reset state
        self.selectedOG = null;
        self.currentOGData = { id: null, name: '', niveles: [], subusuarios: [] };
        self.tempSubusuarios = [];

        // Setup listeners
        self.setupEventListeners(token);

        // Permissions
        self.checkPermissions();

        // Load Initial Data
        await self.loadOrganigramas(token);
        await self.loadAvailableSubusers(token);


    },

    setupEventListeners: (token) => {
        const self = OrganigramaScreen;

        // Toolbar
        document.getElementById('btn-crear-og')?.addEventListener('click', () => self.openEditor());
        document.getElementById('btn-modificar-og')?.addEventListener('click', () => {
            if (!self.selectedOG) return showToast('Seleccione un organigrama', 'warning');
            self.openEditor(self.selectedOG, token);
        });
        document.getElementById('btn-eliminar-og')?.addEventListener('click', () => self.deleteOrganigrama(token));
        document.getElementById('btn-salir-og')?.addEventListener('click', () => {
            navigate('dashboard');
            if (typeof openSidebar === 'function') openSidebar();
        });

        // Editor Toolbar
        document.getElementById('btn-cerrar-editor-og')?.addEventListener('click', () => {
            // Confirm exit without save?
            // Simple version for now:
            document.getElementById('editor-modal-og').classList.add('hidden');
        });
        document.getElementById('btn-grabar-og')?.addEventListener('click', () => self.saveOrganigrama(token));

        // Validation inputs
        document.querySelectorAll('input[data-validations]').forEach(el => {
            el.addEventListener('input', validateInput);
        });

        // Modals
        document.getElementById('btn-cancel-level-name-og')?.addEventListener('click', () => {
            document.getElementById('level-name-modal-og').classList.add('hidden');
        });
        document.getElementById('btn-save-level-name-og')?.addEventListener('click', () => {
            const input = document.getElementById('input-level-name-og');
            const n = self.currentOGData.niveles.find(x => x.nivel === self.editingLevel);
            if (n) {
                n.nombreNivel = input.value;
                document.getElementById('level-name-modal-og').classList.add('hidden');
                self.renderTree();
            }
        });

        document.getElementById('btn-cancel-users-og')?.addEventListener('click', () => {
            document.getElementById('users-modal-og').classList.add('hidden');
            self.tempSubusuarios = [];
        });
        document.getElementById('btn-apply-users-og')?.addEventListener('click', () => self.applyUsersSelection());

        // Delete Confirmation Modal
        document.getElementById('btn-cancel-delete-level-og')?.addEventListener('click', () => {
            document.getElementById('delete-confirm-modal-og').classList.add('hidden');
            self.pendingDeleteLevel = null;
        });
        document.getElementById('btn-confirm-delete-level-og')?.addEventListener('click', () => self.confirmDeleteLevel());

        // Help
        self.setupHelp();
    },

    loadOrganigramas: async (token) => {
        const self = OrganigramaScreen;
        const body = document.getElementById('grid-body-og');
        try {
            const res = await fetch('/api/organigramas', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            body.innerHTML = '';
            data.forEach(og => {
                const tr = document.createElement('tr');
                tr.className = 'cursor-pointer hover:bg-gray-50 transition-colors';
                tr.onclick = () => {
                    document.querySelectorAll('#grid-body-og tr').forEach(r => r.classList.remove('selected-row'));
                    tr.classList.add('selected-row');
                    self.selectedOG = og.organigramaID;
                };
                tr.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${og.organigramaID}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${og.organigrama}</td>
                `;
                body.appendChild(tr);
            });
        } catch (error) {
            console.error('Error loading OGs', error);
            showToast('Error al cargar organigramas', 'error');
        }
    },

    loadAvailableSubusers: async (token) => {
        const self = OrganigramaScreen;
        try {
            const res = await fetch('/api/subusuarios', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) self.availableSubusers = await res.json();
        } catch (error) {
            console.error('Error loading subusers', error);
        }
    },

    deleteOrganigrama: async (token) => {
        const self = OrganigramaScreen;
        if (!self.selectedOG) return showToast('Seleccione un organigrama', 'warning');

        // Use standard confirm for now or implement custom modal if needed
        if (!confirm('¿Seguro desea eliminar este organigrama?')) return;

        try {
            const res = await fetch(`/api/organigramas/${self.selectedOG}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                showToast('Eliminado correctamente', 'success');
                self.selectedOG = null;
                self.loadOrganigramas(token);
            } else {
                showToast('Error al eliminar', 'error');
            }
        } catch (error) {
            showToast('Error de red', 'error');
        }
    },

    openEditor: async (ogID = null, token = null) => {
        const self = OrganigramaScreen;
        document.getElementById('editor-modal-og').classList.remove('hidden');
        const treeRender = document.getElementById('og-tree-render');
        treeRender.innerHTML = '';
        document.getElementById('og-svg-layer').innerHTML = ''; // Clear SVG

        if (ogID) {
            try {
                const res = await fetch(`/api/organigramas/${ogID}/details`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();

                // Get name from grid? Or query? Assuming grid has it correct.
                const rowName = document.querySelector('.selected-row')?.children[1]?.innerText || '';

                self.currentOGData = {
                    id: ogID,
                    name: rowName,
                    niveles: data.niveles || [],
                    subusuarios: data.subusuarios || []
                };
            } catch (error) {
                showToast('Error cargando detalles', 'error');
                return;
            }
        } else {
            self.currentOGData = {
                id: null,
                name: '',
                niveles: [{ nivel: '1', nombreNivel: 'Nuevo Nivel' }],
                subusuarios: []
            };
        }

        document.getElementById('input-og-name').value = self.currentOGData.name;
        self.renderTree();
    },

    saveOrganigrama: async (token) => {
        const self = OrganigramaScreen;
        const name = document.getElementById('input-og-name').value;
        if (!name) return showToast('Ingrese nombre del organigrama', 'error');

        const body = {
            organigramaNombre: name,
            niveles: self.currentOGData.niveles,
            subusuarios: self.currentOGData.subusuarios
        };

        const isUpdate = !!self.currentOGData.id;
        const url = isUpdate
            ? `/api/organigramas/${self.currentOGData.id}/details`
            : '/api/organigramas';
        const method = isUpdate ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                showToast('Guardado correctamente', 'success');
                document.getElementById('editor-modal-og').classList.add('hidden');
                self.loadOrganigramas(token);
            } else {
                showToast('Error al guardar', 'error');
            }
        } catch (error) {
            showToast('Error de red', 'error');
        }
    },

    renderTree: () => {
        const self = OrganigramaScreen;
        const container = document.getElementById('og-tree-render');
        const svg = document.getElementById('og-svg-layer');
        if (!container || !svg) return;

        container.innerHTML = '';
        svg.innerHTML = '';

        const levelGroups = {};
        self.currentOGData.niveles.forEach(n => {
            const depth = n.nivel.split('.').length;
            if (!levelGroups[depth]) levelGroups[depth] = [];
            levelGroups[depth].push(n);
        });

        const depths = Object.keys(levelGroups).sort((a, b) => a - b);
        const nodeElements = {};

        const wrapper = document.createElement('div');
        wrapper.className = 'tree-wrapper';

        depths.forEach(d => {
            const levelDiv = document.createElement('div');
            levelDiv.className = 'tree-level';
            levelGroups[d].sort((a, b) => a.nivel.localeCompare(b.nivel, undefined, { numeric: true })).forEach(n => {
                const node = self.createNodeElement(n);
                levelDiv.appendChild(node);
                nodeElements[n.nivel] = node;
            });
            wrapper.appendChild(levelDiv);
        });

        container.appendChild(wrapper);

        // Draw connections after render
        setTimeout(() => self.drawConnections(nodeElements), 50);
    },

    // Estado interno para eliminación
    pendingDeleteLevel: null,

    createNodeElement: (n) => {
        const self = OrganigramaScreen;
        const div = document.createElement('div');
        div.className = 'og-node static'; // Use static relative for flex layout
        div.style.position = 'relative';

        const header = document.createElement('div');
        header.className = 'og-node-header cursor-pointer hover:bg-gray-50';
        header.innerText = n.nombreNivel;
        header.onclick = () => {
            // Check write permission?
            self.editingLevel = n.nivel;
            document.getElementById('input-level-name-og').value = n.nombreNivel;
            document.getElementById('level-name-modal-og').classList.remove('hidden');
        };

        const body = document.createElement('div');
        body.className = 'og-node-body';

        // Add Button
        const btnAdd = document.createElement('button');
        btnAdd.className = 'og-btn text-blue-600';
        btnAdd.title = 'Agregar Nivel';
        btnAdd.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>';
        btnAdd.onclick = (e) => { e.stopPropagation(); self.addChildLevel(n.nivel); };

        // Users Button (NEW SVG)
        const btnUsers = document.createElement('button');
        btnUsers.className = 'og-btn text-green-600';
        btnUsers.title = 'Usuarios';
        const userCount = self.currentOGData.subusuarios.filter(s => s.nivel === n.nivel).length;
        // SVG Icon for Users (Users Group)
        btnUsers.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>${userCount > 0 ? `<span class="text-black ml-1 text-[10px] font-bold">(${userCount})</span>` : ''}`;
        btnUsers.onclick = (e) => { e.stopPropagation(); self.openUsersModal(n.nivel); };

        // Delete Button
        const btnDel = document.createElement('button');
        btnDel.className = 'og-btn text-red-600';
        btnDel.title = 'Eliminar';
        btnDel.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>`;
        btnDel.onclick = (e) => { e.stopPropagation(); self.deleteLevel(n.nivel); };

        body.appendChild(btnAdd);
        body.appendChild(btnUsers);
        if (n.nivel !== '1') body.appendChild(btnDel);

        div.appendChild(header);
        div.appendChild(body);
        return div;
    },

    addChildLevel: (parentNivel) => {
        const self = OrganigramaScreen;
        const siblings = self.currentOGData.niveles.filter(n => {
            const parts = n.nivel.split('.');
            const parentParts = parentNivel.split('.');
            return parts.length === parentParts.length + 1 && n.nivel.startsWith(parentNivel + '.');
        });

        const nextIdx = siblings.length + 1;
        const newNivel = `${parentNivel}.${nextIdx}`;

        self.currentOGData.niveles.push({ nivel: newNivel, nombreNivel: 'Nuevo Nivel' });
        self.renderTree();
    },

    deleteLevel: (nivel) => {
        const self = OrganigramaScreen;
        self.pendingDeleteLevel = nivel;
        document.getElementById('delete-confirm-modal-og').classList.remove('hidden');
    },

    confirmDeleteLevel: () => {
        const self = OrganigramaScreen;
        if (self.pendingDeleteLevel) {
            const nivel = self.pendingDeleteLevel;
            self.currentOGData.niveles = self.currentOGData.niveles.filter(n => !n.nivel.startsWith(nivel));
            self.currentOGData.subusuarios = self.currentOGData.subusuarios.filter(s => !s.nivel.startsWith(nivel));
            self.renderTree();
            self.pendingDeleteLevel = null;
        }
        document.getElementById('delete-confirm-modal-og').classList.add('hidden');
    },

    drawConnections: (nodes) => {
        const self = OrganigramaScreen;
        const svg = document.getElementById('og-svg-layer');
        if (!svg) return;

        svg.innerHTML = '';
        const rect = svg.getBoundingClientRect();

        self.currentOGData.niveles.forEach(n => {
            const parts = n.nivel.split('.');
            if (parts.length > 1) {
                const parentNivel = parts.slice(0, -1).join('.');
                const startNode = nodes[parentNivel];
                const endNode = nodes[n.nivel];

                if (startNode && endNode) {
                    const startRect = startNode.getBoundingClientRect();
                    const endRect = endNode.getBoundingClientRect();

                    const x1 = (startRect.left + startRect.right) / 2 - rect.left;
                    const y1 = startRect.bottom - rect.top;
                    const x2 = (endRect.left + endRect.right) / 2 - rect.left;
                    const y2 = endRect.top - rect.top;

                    // Line logic
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    const midY = (y1 + y2) / 2;
                    const d = `M ${x1} ${y1} V ${midY} H ${x2} V ${y2}`;
                    line.setAttribute('d', d);
                    line.setAttribute('stroke', '#000');
                    line.setAttribute('stroke-width', '1');
                    line.setAttribute('fill', 'none');
                    svg.appendChild(line);
                }
            }
        });
    },

    openUsersModal: (nivel) => {
        const self = OrganigramaScreen;
        self.editingLevel = nivel;
        document.getElementById('users-modal-og').classList.remove('hidden');

        self.tempSubusuarios = self.currentOGData.subusuarios
            .filter(s => s.nivel === nivel)
            .map(s => s.subusuarioID);

        self.refreshUsersList();
    },

    refreshUsersList: () => {
        const self = OrganigramaScreen;
        const list = document.getElementById('subusers-list-og');
        list.innerHTML = '';

        // Header: Select All
        const headerDiv = document.createElement('div');
        headerDiv.className = 'flex items-center justify-between p-2 border-b bg-gray-50 font-bold mb-2 sticky top-0';
        const allSelected = self.availableSubusers.length > 0 && self.availableSubusers.every(u => self.tempSubusuarios.includes(u.subusuarioID));

        headerDiv.innerHTML = `
            <span>Todos</span>
            <div id="btn-toggle-all-og" class="cursor-pointer text-xl select-none w-8 h-8 flex items-center justify-center">
                ${allSelected ? '✅' : '⬜'}
            </div>
        `;
        list.appendChild(headerDiv);

        document.getElementById('btn-toggle-all-og').onclick = () => {
            if (allSelected) self.tempSubusuarios = [];
            else self.tempSubusuarios = self.availableSubusers.map(u => u.subusuarioID);
            self.refreshUsersList();
        };

        self.availableSubusers.forEach(u => {
            const div = document.createElement('div');
            div.className = 'flex items-center justify-between p-2 border-b hover:bg-gray-50 transition-colors cursor-pointer';
            const isSelected = self.tempSubusuarios.includes(u.subusuarioID);

            div.innerHTML = `
                <span>${u.nombre}</span>
                <div class="text-xl select-none w-8 h-8 flex items-center justify-center">
                    ${isSelected ? '✅' : '⬜'}
                </div>
            `;
            div.onclick = () => {
                if (isSelected) self.tempSubusuarios = self.tempSubusuarios.filter(id => id !== u.subusuarioID);
                else self.tempSubusuarios.push(u.subusuarioID);
                self.refreshUsersList();
            };
            list.appendChild(div);
        });
    },

    applyUsersSelection: () => {
        const self = OrganigramaScreen;
        // Remove existing for this level
        self.currentOGData.subusuarios = self.currentOGData.subusuarios.filter(s => s.nivel !== self.editingLevel);

        // Add new
        self.tempSubusuarios.forEach(subID => {
            self.currentOGData.subusuarios.push({ nivel: self.editingLevel, subusuarioID: subID });
        });

        document.getElementById('users-modal-og').classList.add('hidden');
        self.renderTree();
    },

    checkPermissions: () => {
        const self = OrganigramaScreen;
        const screenName = self.name;
        // Asumiendo que 'organigrama' es el nombre en UserPermissions (verify this matches router name which matches html name usually)
        // organigrama.html -> organigrama
        const permissions = window.UserPermissions && window.UserPermissions[screenName];
        const canWrite = permissions ? permissions.canWrite : false;



        const idsToCheck = ['btn-crear-og', 'btn-modificar-og', 'btn-eliminar-og', 'btn-grabar-og'];

        idsToCheck.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                if (!canWrite) {
                    btn.disabled = true;
                    btn.classList.add('opacity-50', 'cursor-not-allowed');
                } else {
                    btn.disabled = false;
                    btn.classList.remove('opacity-50', 'cursor-not-allowed');
                }
            }
        });

        // Also note that inside createNodeElement we should technically check permissions for adding child nodes/deleting nodes,
        // but since the Editor is only openable via "Modificar" (which is disabled above), it might be safe. 
        // BUT, if someone hacked UI, better to check inside editor too if we want to be strict.
        // For now, disabling the entry points is consistent with Phase 2 requirements so far.
    },

    setupHelp: () => {
        const self = OrganigramaScreen;
        const modal = document.getElementById('help-modal-og');
        const iframe = document.getElementById('help-iframe-og');
        const header = document.getElementById('help-modal-header-og');
        const manualPath = 'ayudas/manual_organigrama.html';

        const openManual = () => {
            if (!iframe.getAttribute('src') || iframe.getAttribute('src') !== manualPath) {
                iframe.src = manualPath;
            }
            modal.style.display = 'flex';
        };

        document.getElementById('btn-ayuda-og')?.addEventListener('click', openManual);
        document.getElementById('btn-ayuda-editor-og')?.addEventListener('click', openManual);

        document.getElementById('close-help-og')?.addEventListener('click', () => modal.style.display = 'none');
        document.getElementById('maximize-help-og')?.addEventListener('click', () => {
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
        const self = OrganigramaScreen;
        if (self.documentMouseMoveHandler) {
            document.removeEventListener('mousemove', self.documentMouseMoveHandler);
        }
        if (self.documentMouseUpHandler) {
            document.removeEventListener('mouseup', self.documentMouseUpHandler);
        }
    }
};

if (window.SpaRouter) {
    window.SpaRouter.registerScreen('organigrama', OrganigramaScreen);
}
