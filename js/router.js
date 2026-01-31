/**
 * SPA Router - Sistema de navegación para Single Page Application
 * 
 * Uso:
 *   import { registerScreen, navigate, getCurrentScreen } from './router.js';
 *   registerScreen('dashboard', dashboardModule);
 *   navigate('dashboard');
 */

// Registro de pantallas (módulos)
const screens = new Map();

// Pantalla actual
let currentScreen = null;
let currentModule = null;

// Versión para cache-busting (se actualiza en cada build)
const BUILD_VERSION = Date.now();

/**
 * Registrar un módulo de pantalla
 * @param {string} name - Nombre de la pantalla (ej: 'dashboard', 'cliente')
 * @param {object} module - Módulo con { template, init, destroy? }
 */
function registerScreen(name, module) {
    if (!module.template || !module.init) {
        return;
    }
    screens.set(name, module);
}

/**
 * Navegar a una pantalla
 * @param {string} screenName - Nombre de la pantalla
 * @param {object} params - Parámetros opcionales para pasar al módulo
 * @param {boolean} pushState - Si agregar al historial (default: true)
 */
async function navigate(screenName, params = {}, pushState = true) {
    const container = document.getElementById('app-container');

    if (!container) {
        return false;
    }

    const module = screens.get(screenName);

    if (!module) {
        return false;
    }

    try {
        // Cleanup del módulo anterior
        if (currentModule && typeof currentModule.destroy === 'function') {
            await currentModule.destroy();
        }

        // Renderizar nuevo template
        container.innerHTML = module.template(params);

        // Inicializar nuevo módulo
        await module.init(params);

        // Actualizar Título del Header (Cartel)
        const headerTitle = document.getElementById('header-title');
        if (headerTitle) {
            const menuInfo = window.MenuData && window.MenuData[screenName];
            const cartel = (menuInfo && menuInfo.cartel) ? menuInfo.cartel : 'Panel de Control';
            headerTitle.textContent = cartel;
        }

        // Actualizar estado
        currentScreen = screenName;
        currentModule = module;

        // Agregar al historial del browser
        if (pushState) {
            const url = `#/${screenName}`;
            history.pushState({ screen: screenName, params }, '', url);
        }

        // Loguear acceso a pantalla (si existe la función)
        if (typeof logScreenAccess === 'function') {
            logScreenAccess(screenName);
        }

        return true;

    } catch (error) {
        console.error(`[Router] Error navegando a ${screenName}:`, error);
        container.innerHTML = `
            <div class="p-6 text-center">
                <h2 class="text-2xl font-bold text-red-600 mb-4">Error al cargar pantalla</h2>
                <p class="text-gray-600">${error.message}</p>
                <button onclick="navigate('dashboard')" class="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
                    Volver al Dashboard
                </button>
            </div>
        `;
        return false;
    }
}

/**
 * Obtener pantalla actual
 * @returns {string|null}
 */
function getCurrentScreen() {
    return currentScreen;
}

/**
 * Obtener versión de build para cache-busting
 * @returns {number}
 */
function getBuildVersion() {
    return BUILD_VERSION;
}

/**
 * Manejar navegación con botón atrás del browser
 */
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.screen) {
        navigate(event.state.screen, event.state.params || {}, false);
    }
});

/**
 * Inicializar router desde URL hash
 */
function initFromHash() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#/')) {
        const screenName = hash.substring(2); // Quitar "#/"
        if (screens.has(screenName)) {
            navigate(screenName, {}, false);
            return true;
        }
    }
    return false;
}

// Exponer funciones globalmente para uso sin ES modules
window.SpaRouter = {
    registerScreen,
    navigate,
    getCurrentScreen,
    getBuildVersion,
    initFromHash,
    screens // Para debug
};

// También exponer navigate globalmente para facilidad de uso
window.navigate = navigate;
