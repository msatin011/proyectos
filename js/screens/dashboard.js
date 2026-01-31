/**
 * Dashboard Screen Module
 * Primera pantalla de la SPA - muestra resumen general
 */

const DashboardScreen = {
    name: 'dashboard',

    /**
     * Template HTML del dashboard
     */
    template: (params = {}) => `
        <div class="p-4 md:p-6">
            <!-- Cabecera del Contenido -->
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-800">Dashboard General</h1>
                <p class="text-gray-500 mt-1">Resumen general de proyectos y tareas. Mensajes. Pendientes</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

                <div id="cardMsg"
                    class="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <p id="qmsg" class="text-4xl font-bold text-gray-800">--</p>
                            <p class="text-gray-500">Mensajes</p>
                        </div>
                        <div class="bg-blue-100 text-blue-600 p-3 rounded-full">
                            <img src="img/mensajeria.png">
                        </div>
                    </div>
                    <p id="adimsg" class="text-sm text-green-500 flex items-center gap-1"></p>
                </div>
                
                <!-- Card Equipo -->
                <div class="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <p class="text-4xl font-bold text-gray-800">8</p>
                            <p class="text-gray-500">Miembros del Equipo</p>
                        </div>
                        <div class="bg-purple-100 text-purple-600 p-3 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.28-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.28.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                    </div>
                    <p class="text-sm text-green-500 flex items-center gap-1">+1 este mes</p>
                </div>
            </div>
        </div>
    `,

    /**
     * Inicialización del módulo
     */
    init: async (params = {}) => {


        // Actualizar contadores de mensajes
        const qmsgEl = document.getElementById('qmsg');
        const adimsgEl = document.getElementById('adimsg');

        if (qmsgEl) qmsgEl.innerHTML = '44';
        if (adimsgEl) adimsgEl.innerHTML = '+2 de hoy';

        // Evento click en card de mensajes
        const cardMsg = document.getElementById('cardMsg');
        if (cardMsg) {
            cardMsg.addEventListener('click', () => {
                // Navegar a mis mensajes cuando esté migrado
                if (window.SpaRouter.screens.has('mismensajes')) {
                    navigate('mismensajes');
                }
            });
        }


    },

    /**
     * Limpieza al salir del módulo
     */
    destroy: () => {

        // Cleanup de event listeners si fuera necesario
    }
};

// Registrar en el router (si ya está cargado)
if (window.SpaRouter) {
    window.SpaRouter.registerScreen('dashboard', DashboardScreen);
}

// Exponer para uso manual
window.DashboardScreen = DashboardScreen;
