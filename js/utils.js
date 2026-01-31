function validateInput(event) {
    const input = event.target;
    const validationsAttr = input.getAttribute('data-validations');
    if (!validationsAttr) return;

    const validations = JSON.parse(validationsAttr);
    let value = input.value;
    let errorMessage = '';

    if (validations.tipo === 'num') {
        const originalValue = value;
        // Filtrar caracteres no permitidos
        if (validations.entero) {
            value = value.replace(/[^\d]/g, '');
        } else {
            value = value.replace(/[^\d.,]/g, '');
        }

        if (originalValue !== value) {
            input.value = value;
            errorMessage = validations.entero ? 'Solo números enteros' : 'Solo números';
        }

        if (validations.largo && value.length > validations.largo) {
            errorMessage = `Máximo ${validations.largo} dígitos`;
            input.value = value.substring(0, validations.largo);
        }

        // Check numeric range if needed (after formatting)
        // ... (existing min/max logic could be added here if needed, but keeping it simple)

    } else if (validations.tipo === 'char') {
        if (value.length > validations.largo) {
            errorMessage = `Máximo ${validations.largo} caracteres`;
            input.value = value.substring(0, validations.largo);
        }
    }

    if (errorMessage) {
        showValidationBadge(input, errorMessage);
    }
}

function showValidationBadge(input, message) {
    const existingErrors = document.querySelectorAll('.validation-error-badge');
    existingErrors.forEach(err => err.remove());

    const errorDiv = document.createElement('div');
    errorDiv.className = 'validation-error-badge';
    errorDiv.textContent = message;

    // Obtener la posición del input respecto al viewport
    const rect = input.getBoundingClientRect();

    // Configuración de estilo crítica para visibilidad absoluta
    errorDiv.style.position = 'fixed';
    errorDiv.style.zIndex = '2147483647'; // Máximo valor de z-index posible

    // Posicionamiento calculado para estar justo sobre el input
    // Se asegura de que no salga por la parte superior de la ventana
    const topPos = Math.max(5, rect.top - 35);
    errorDiv.style.top = `${topPos}px`;
    errorDiv.style.left = `${rect.left}px`;

    // Estética de ALTA VISIBILIDAD (Rojo Intenso / Blanco)
    errorDiv.style.backgroundColor = '#f16310ff'; // rose-600
    errorDiv.style.color = '#ffffff';
    errorDiv.style.padding = '4px 12px';
    errorDiv.style.borderRadius = '6px';
    errorDiv.style.fontSize = '13px';
    errorDiv.style.fontWeight = 'bold';
    errorDiv.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.3)';
    errorDiv.style.pointerEvents = 'none';
    errorDiv.style.whiteSpace = 'nowrap';
    errorDiv.style.border = '2px solid white';

    // Animación de entrada
    errorDiv.style.opacity = '1';
    errorDiv.style.transition = 'opacity 0.2s ease-in-out';

    // Se agrega al body para que no le afecten overflow:hidden de contenedores padres
    document.body.appendChild(errorDiv);

    // Auto-eliminación tras 3 segundos
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.style.opacity = '0';
            setTimeout(() => errorDiv.remove(), 300);
        }
    }, 3000);
}

/**
 * Inicializa el manejo de una tabla (Ordenamiento y Filtrado)
 * @param {string} tableContainerSelector Selector del contenedor de la tabla
 * @param {Array} dataArray Los datos originales sin filtrar
 * @param {Function} renderCallback Función para redibujar la tabla con los datos resultantes
 */
function initTableManager(tableContainerSelector, dataArray, renderCallback) {
    const tableContainer = document.querySelector(tableContainerSelector);
    if (!tableContainer) return;

    const gridHeader = tableContainer.querySelector('thead');
    if (!gridHeader) return;

    // Verificar si ya está inicializado para evitar duplicados
    if (tableContainer.dataset.tableManagerInitialized === 'true') {
        return;
    }

    // Marcar como inicializado INMEDIATAMENTE
    tableContainer.dataset.tableManagerInitialized = 'true';

    const headers = gridHeader.querySelectorAll('th[data-sort]');
    let currentSort = { column: null, direction: 'asc' };
    let activeFilters = {}; // { column: "string" }

    // Función principal de procesamiento
    const processData = () => {
        // 1. Filtrar
        let processedData = dataArray.filter(item => {
            return Object.keys(activeFilters).every(col => {
                const term = activeFilters[col].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const val = (item[col] || '').toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return val.includes(term);
            });
        });

        // 2. Ordenar
        if (currentSort.column) {
            processedData.sort((a, b) => {
                let valA = a[currentSort.column];
                let valB = b[currentSort.column];

                if (valA === null || valA === undefined) valA = '';
                if (valB === null || valB === undefined) valB = '';

                if (typeof valA === 'string') {
                    valA = valA.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                }
                if (typeof valB === 'string') {
                    valB = valB.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                }

                if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
                if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        // Llamar callback con los datos procesados
        if (typeof renderCallback === 'function') {
            renderCallback(processedData);
        }
    };

    headers.forEach(th => {
        const col = th.dataset.sort;

        // --- Lógica de Ordenamiento (al hacer click en el resto del header) ---
        th.addEventListener('click', (e) => {
            // No ordenar si se hace click en el icono de búsqueda o dentro del popup
            if (e.target.closest('.filter-popup') || e.target.classList.contains('filter-icon')) return;

            if (currentSort.column === col) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.column = col;
                currentSort.direction = 'asc';
            }

            // Actualizar UI
            headers.forEach(h => {
                h.classList.remove('sort-asc', 'sort-desc');
                if (h.dataset.sort === currentSort.column) {
                    h.classList.add(`sort-${currentSort.direction}`);
                }
            });

            processData();
        });

        // --- Lógica de Filtrado (Icono de búsqueda) ---
        if (th.dataset.noFilter === 'true') return;

        // Inyectamos un span invisible sobre el pseudo-elemento ::before o simplemente usamos un elemento real
        // Para mayor control, removeremos el ::before y usaremos un elemento DOM
        const filterIcon = document.createElement('span');
        filterIcon.className = 'filter-icon';
        filterIcon.innerHTML = '<span class="icono-lupa">&#x1F50D;</span>';

        // th.style.position = 'relative';  <-- REMOVED: Breaks sticky positioning (sticky implies a stacking context anyway)

        th.appendChild(filterIcon);

        const filterPopup = document.createElement('div');
        filterPopup.className = 'filter-popup';
        filterPopup.innerHTML = `
            <div class="filter-input-wrapper">
                <input type="text" placeholder="Filtrar..." value="${activeFilters[col] || ''}">
                <button class="filter-clear-btn" title="Limpiar filtro">&times;</button>
            </div>
        `;
        th.appendChild(filterPopup);

        const filterInput = filterPopup.querySelector('input');
        const clearBtn = filterPopup.querySelector('.filter-clear-btn');

        filterIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            // Cerrar otros popups
            document.querySelectorAll('.filter-popup').forEach(p => {
                if (p !== filterPopup) p.style.display = 'none';
            });

            const isVisible = filterPopup.style.display === 'block';
            filterPopup.style.display = isVisible ? 'none' : 'block';
            if (!isVisible) {
                setTimeout(() => filterInput.focus(), 50);
            }
        });

        filterInput.addEventListener('click', (e) => e.stopPropagation());
        clearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            filterInput.value = '';
            delete activeFilters[col];
            th.classList.remove('filter-active');
            processData();
        });

        filterInput.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            if (val) {
                activeFilters[col] = val;
                th.classList.add('filter-active');
            } else {
                delete activeFilters[col];
                th.classList.remove('filter-active');
            }
            processData();
        });

        filterInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === 'Escape') {
                filterPopup.style.display = 'none';
            }
        });
    });

    // Cerrar popups al hacer click afuera
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.filter-popup') && !e.target.closest('.filter-icon')) {
            document.querySelectorAll('.filter-popup').forEach(p => p.style.display = 'none');
        }
    });
}

function showToast(message, type = 'info', duration = 4500) {

    // Buscar el contenedor de toasts
    let container = document.getElementById('toast-container');

    // Si no existe el contenedor (backup), usar el body pero el sistema ya lo tiene
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed top-4 right-4 flex flex-col items-end gap-3 z-[10000] pointer-events-none';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    // z-index muy alto para estar sobre cualquier modal
    // Eliminamos position absolute/fixed manual y dejamos que el contenedor flex-col maneje el apilamiento
    toast.className = 'toast-notification text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-x-10 opacity-0 flex items-center gap-3 pointer-events-auto max-w-md w-fit';

    // El contenedor maneja la posición global, por lo que el toast solo necesita ser relativo al flujo
    toast.style.cssText = 'pointer-events: auto;';

    let bgClass, icon;
    switch (type) {
        case 'success':
            bgClass = 'bg-green-600';
            icon = '✓';
            break;
        case 'error':
            bgClass = 'bg-red-600';
            icon = '✕';
            break;
        case 'warning':
            bgClass = 'bg-orange-600';
            icon = '⚠';
            break;
        default:
            bgClass = 'bg-blue-400';
            icon = 'ℹ';
    }

    toast.classList.add(bgClass);
    toast.innerHTML = `${icon} <span class="break-words font-medium">${message}</span>`;
    toast.classList.add('cursor-pointer', 'hover:opacity-90');

    container.appendChild(toast);

    // Función para cerrar el toast con animación
    const dismissToast = () => {
        if (toast.dataset.dismissing) return;
        toast.dataset.dismissing = 'true';

        toast.classList.add('translate-x-10', 'opacity-0');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 300);
    };

    // Cerrar al hacer click
    toast.addEventListener('click', dismissToast);

    // Trigger animation de entrada (desde la derecha)
    requestAnimationFrame(() => {
        toast.classList.remove('translate-x-10', 'opacity-0');
    });

    // Auto-eliminación
    setTimeout(dismissToast, duration);
}

/**
 * Cargar Flatpickr dinámicamente
 * @returns {Promise}
 */
function loadFlatpickr() {
    return new Promise((resolve) => {
        // Si ya está cargado, resolver inmediatamente
        if (typeof flatpickr !== 'undefined') {
            resolve();
            return;
        }

        // Cargar CSS
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css';
        document.head.appendChild(css);

        // Cargar JS
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/flatpickr';
        script.onload = () => {
            // Cargar locale español
            const localeScript = document.createElement('script');
            localeScript.src = 'https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/es.js';
            localeScript.onload = resolve;
            document.head.appendChild(localeScript);
        };
        document.head.appendChild(script);
    });
}
