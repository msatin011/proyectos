function initializeLayout() {
    const sidebar = document.getElementById('sidebar');
    const menuOpenBtn = document.getElementById('menu-open-btn');
    const menuCloseBtn = document.getElementById('menu-close-btn');
    const contentFrame = document.getElementById('content-frame');
    const mainContainer = document.getElementById('main-container');
    const sidebarCollapseBtn = document.getElementById('sidebar-collapse-btn');
    const sidebarCollapseIcon = document.getElementById('sidebar-collapse-icon');
    const authToken = sessionStorage.getItem('authToken');
    // --- Función para loguear acceso a pantalla ---
    async function logScreenAccess(url) {
        if (!url || !authToken) return;
        try {
            // Extraer el nombre del archivo de la URL (ej: cliente.html)
            const screenName = url.split('/').pop().split('?')[0];
            await fetch('/api/log/screen', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ actividad: screenName })
            });
        } catch (err) {
            console.error('Error logueando acceso a pantalla:', err);
        }
    }


    // --- Lógica de Usuario ---
    const userDataString = sessionStorage.getItem('userData');
    let userData = null;
    if (userDataString) {
        userData = JSON.parse(userDataString);
        const userNameEl = document.getElementById('user-name');
        const userAvatarEl = document.getElementById('user-avatar');


        if (userNameEl) {
            userNameEl.textContent = userData.nombre;
        }
        if (userAvatarEl) {
            if (userData.foto) {
                // Si hay foto, mostrarla
                userAvatarEl.innerHTML = `<img src="${userData.foto}" alt="Perfil" class="w-full h-full object-cover rounded-full">`;
                userAvatarEl.classList.remove('bg-theme-primary', 'text-white'); // Remover estilos de placeholder
            } else {
                // Crear iniciales a partir del nombre
                const initials = userData.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                userAvatarEl.textContent = initials;
                userAvatarEl.classList.add('bg-theme-primary', 'text-white'); // Asegurar estilos de placeholder
            }
        }
    } else {
        // Si no hay datos de usuario, quizás redirigir al login
        // window.location.href = '/index.html';
    }

    // --- Lógica para Abrir/Cerrar Sidebar ---
    const openSidebar = () => {
        sidebar.classList.remove('-translate-x-full');
        if (window.innerWidth >= 768) {
            mainContainer.style.marginLeft = '24rem'; // 24rem es el ancho de w-96
        }
        sidebarCollapseIcon.classList.remove('rotate-180');
    };
    window.openSidebar = openSidebar;

    const closeSidebar = () => {
        sidebar.classList.add('-translate-x-full');
        if (window.innerWidth >= 768) {
            mainContainer.style.marginLeft = '0';
        }
        sidebarCollapseIcon.classList.add('rotate-180');
    };

    if (menuOpenBtn && menuCloseBtn && sidebar) {
        menuOpenBtn.addEventListener('click', openSidebar);
        menuCloseBtn.addEventListener('click', closeSidebar);
    }

    if (sidebarCollapseBtn) {
        sidebarCollapseBtn.addEventListener('click', () => {
            // Funciona en todas las pantallas
            if (sidebar.classList.contains('-translate-x-full')) {
                openSidebar();
            } else {
                closeSidebar();
            }
        });
    }

    // --- Lógica del Botón de Notificaciones (Header) ---
    const notificationBtn = document.getElementById('notificationBtn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', () => {
            if (window.navigate) {
                window.navigate('mismensajes');
            }
        });
    }

    // --- Lógica del Menú Dinámico ---
    async function buildMenu() {
        const authToken = sessionStorage.getItem('authToken');
        if (!authToken || !userData || typeof userData.rol === 'undefined') {
            return;
        }

        try {
            const response = await fetch('/api/menu', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (!response.ok) throw new Error('No se pudo obtener el menú.');

            const menuItems = await response.json();
            // El backend ya filtra por rol, así que usamos la respuesta directa
            const accessibleItems = menuItems;

            // 2. MAPEAR PERMISOS Y CARTELES GLOBALES
            window.UserPermissions = {};
            window.MenuData = {};
            accessibleItems.forEach(item => {
                if (item.programa) {
                    // Normalizar nombre de pantalla igual que en router (ej: 'cliente.html' -> 'cliente')
                    const screenName = item.programa.split('/').pop().replace('.html', '').split('?')[0];
                    // Asegurar booleano (SQL devuelve 0/1 o null)
                    const canWrite = item.write === 1 || item.write === true;

                    window.UserPermissions[screenName] = { canWrite };
                    window.MenuData[screenName] = {
                        canWrite,
                        cartel: item.cartel
                    };
                }
            });

            // AUTO-ACTUALIZAR TÍTULO (Si ya se navegó a una pantalla antes de cargar el menú)
            if (window.SpaRouter) {
                const currentScreen = window.SpaRouter.getCurrentScreen();
                if (currentScreen && window.MenuData[currentScreen]) {
                    const headerTitle = document.getElementById('header-title');
                    if (headerTitle) {
                        const cartel = window.MenuData[currentScreen].cartel || 'Panel de Control';
                        headerTitle.textContent = cartel;
                    }
                }
            }

            // 2. Construir la estructura de árbol
            const menuTree = [];
            const map = {};

            // Primero, crear el mapa de todos los items
            accessibleItems.forEach(item => {
                map[item.nivel] = { ...item, children: [] };
            });

            // Luego, construir el árbol
            accessibleItems.forEach(item => {
                const parentNivel = item.nivel.substring(0, item.nivel.lastIndexOf('.'));

                if (parentNivel && map[parentNivel]) {
                    // Tiene padre válido, agregarlo como hijo
                    map[parentNivel].children.push(map[item.nivel]);
                } else if (!parentNivel) {
                    // No tiene punto, es raíz
                    menuTree.push(map[item.nivel]);
                }
                // Si parentNivel existe pero no está en map, no hacer nada (item huérfano)
            });

            // 3. Renderizar el HTML
            const menuContainer = document.getElementById('menu-container');
            if (menuContainer) {
                menuContainer.innerHTML = renderMenuItems(menuTree, 1); // Renderiza items dinámicos

                // Crea y añade el ítem "Salir"
                const salirLi = document.createElement('li');
                salirLi.className = 'menu-item mt-auto pt-2 border-t border-gray-700'; // mt-auto lo empuja al fondo
                salirLi.innerHTML = `
                    <a href="#" id="btn-salir-app" class="menu-link flex items-center justify-between gap-3 px-4 py-1 rounded-md hover:bg-gray-700">
                        <div class="flex items-center gap-3">
                            <div class="w-8 flex-shrink-0"></div> <!-- Espaciador para alinear con otros menús -->
                            <span class="font-semibold">Salir</span>
                        </div>
                        <img src="img/salirapp.png" class="w-6 h-6 object-contain">
                    </a>
                `;
                menuContainer.appendChild(salirLi);

                addMenuEventListeners();

                // Añade el evento de clic específico para el botón de salir
                document.getElementById('btn-salir-app').addEventListener('click', (e) => {
                    e.preventDefault();
                    sessionStorage.clear(); // Limpia solo los datos de la sesión (token)
                    // localStorage.clear(); // Se comenta para no borrar las credenciales guardadas
                    window.location.href = '/index.html';
                });
            }

        } catch (error) {
            console.error("Error al construir el menú:", error);
        }
    }

    function renderMenuItems(items, level) {
        let html = '';

        items.forEach(item => {
            const hasChildren = item.children.length > 0;
            const hasProgram = item.programa && item.programa.trim() !== '';
            const url = hasProgram ? item.programa : 'javascript:void(0);';
            const targetsIframe = hasProgram;
            let icon = '';
            // Para los menús de nivel superior, crea un contenedor para el ícono para mantener la alineación del texto.
            if (item.nivel.indexOf('.') === -1) {
                // Si hay ícono, lo muestra; si no, crea un espacio vacío del mismo tamaño.
                icon = item.icono
                    ? `<img src="img/${item.icono}" class="w-8 h-8 object-contain flex-shrink-0">`
                    : '<div class="w-8 flex-shrink-0"></div>';
            }
            const arrowIcon = `<svg class="menu-arrow w-4 h-4 transition-transform duration-500" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;

            // Aplicar la indentación al <li> en lugar del <a>
            html += `<li class="menu-item" style="padding-left: ${level > 1 ? (level - 1) * 1.5 : 0}rem;">`;
            html += `<a href="${url}" 
                        class="menu-link flex items-center justify-between gap-3 px-4 py-1 rounded-md hover:bg-gray-700" 
                        aria-expanded="false" 
                        data-target-iframe="${targetsIframe}"
                        data-cartel="${item.cartel || ''}">
                        <div class="flex items-center gap-3">
                            ${icon}
                            <span prgAdmin="${item.prgAdmin}">${item.menu}</span>
                        </div>
                        ${hasChildren ? arrowIcon : ''}
                     </a>`;

            if (hasChildren) {
                html += `<ul class="submenu">`;
                html += renderMenuItems(item.children, level + 1);
                html += `</ul>`;
            }
            html += `</li>`;
        });
        return html;
    }

    function addMenuEventListeners() {
        const menuLinks = document.querySelectorAll('.menu-link');
        menuLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                const hasSubmenu = this.nextElementSibling && this.nextElementSibling.classList.contains('submenu');
                const targetsIframe = this.dataset.targetIframe === 'true';
                const prgAdmin = this.querySelector('span').getAttribute('prgAdmin')
                const ud = userData.usuarioID;
                var url;
                if (targetsIframe || (ud == 1 && prgAdmin != '')) {
                    e.preventDefault();

                    if (ud == 1 && prgAdmin != "") {
                        url = prgAdmin
                    }
                    else {
                        url = this.getAttribute('href');
                    }

                    if (url && url !== '#') {
                        // === NAVEGACIÓN SPA ===
                        // Extraer nombre de pantalla de la URL (ej: cliente.html -> cliente)
                        const screenName = url.split('/').pop().replace('.html', '').split('?')[0];

                        // Verificar si la pantalla está migrada al SPA router
                        if (window.SpaRouter && window.SpaRouter.screens.has(screenName)) {
                            window.navigate(screenName);
                            logScreenAccess(screenName);
                        } else {
                            // Pantalla no migrada aún - mostrar mensaje
                            const container = document.getElementById('app-container');
                            if (container) {
                                container.innerHTML = `
                                    <div class="flex items-center justify-center h-full">
                                        <div class="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
                                            <div class="text-6xl mb-4">🚧</div>
                                            <h2 class="text-2xl font-bold text-gray-800 mb-2">Pantalla en migración</h2>
                                            <p class="text-gray-600 mb-4">La pantalla <strong>${screenName}</strong> aún no está migrada al nuevo sistema SPA.</p>
                                            <button onclick="navigate('dashboard')" class="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors">
                                                Volver al Dashboard
                                            </button>
                                        </div>
                                    </div>
                                `;
                            }
                            logScreenAccess(screenName);
                        }
                    }

                    // Desmarcar todos los enlaces y marcar el actual como activo
                    document.querySelectorAll('.menu-link.active').forEach(l => {
                        l.classList.remove('active', 'bg-theme-primary', 'text-white', 'font-semibold');
                    });
                    this.classList.add('active', 'bg-theme-primary', 'text-white', 'font-semibold');
                    // Replegar el menú si está abierto, sin importar el tamaño de la pantalla
                    if (!sidebar.classList.contains('-translate-x-full')) {
                        closeSidebar();
                    }
                    return;
                }

                if (hasSubmenu) {
                    e.preventDefault();
                    const submenu = this.nextElementSibling;
                    const isCurrentlyExpanded = this.getAttribute('aria-expanded') === 'true';

                    // Lógica de Acordeón: Cerrar otros menús abiertos en el mismo nivel
                    const parentUl = this.closest('ul');
                    const siblingLinks = parentUl.querySelectorAll(':scope > .menu-item > .menu-link');
                    siblingLinks.forEach(siblingLink => {
                        if (siblingLink !== this && siblingLink.getAttribute('aria-expanded') === 'true') {
                            const otherSubmenu = siblingLink.nextElementSibling;
                            siblingLink.setAttribute('aria-expanded', 'false');
                            siblingLink.querySelector('.menu-arrow')?.classList.remove('rotate-90');
                            if (otherSubmenu) {
                                otherSubmenu.style.maxHeight = null; // Colapsa usando la clase CSS
                            }
                        }
                    });

                    // Abrir/Cerrar el submenú actual
                    if (isCurrentlyExpanded) {
                        this.setAttribute('aria-expanded', 'false');
                        this.querySelector('.menu-arrow')?.classList.remove('rotate-90');

                        // Para colapsar suavemente, primero volvemos a poner el scrollHeight literal
                        submenu.style.maxHeight = submenu.scrollHeight + 'px';
                        // Forzamos un reflow
                        submenu.offsetHeight;
                        submenu.style.maxHeight = null;
                    } else {
                        this.setAttribute('aria-expanded', 'true');
                        this.querySelector('.menu-arrow')?.classList.add('rotate-90');
                        submenu.style.maxHeight = submenu.scrollHeight + 'px';

                        // Una vez terminada la transición, quitamos el max-height para permitir que los hijos se expandan
                        const onTransitionEnd = (e) => {
                            if (e.propertyName === 'max-height' && this.getAttribute('aria-expanded') === 'true') {
                                submenu.style.maxHeight = 'none';
                                submenu.removeEventListener('transitionend', onTransitionEnd);
                            }
                        };
                        submenu.addEventListener('transitionend', onTransitionEnd);
                    }
                }
            });
        });
    }

    // --- Lógica del Perfil de Usuario ---
    const userProfile = document.getElementById('userProfile');
    if (userProfile) {
        userProfile.addEventListener('click', () => {
            alert('Menú de usuario (por implementar)');
        });
    }

    // --- Rastreo de estados de espera de chat ---
    const chatWaitingStates = new Map(); // salaID -> { timeoutId, isWaiting }

    // --- Rastreo de salas de chat activas ---
    const activeChatRooms = new Set(); // Track active chat rooms for cleanup on disconnect

    // --- Lógica de WebSockets (Socket.io) ---
    function initializeWebSockets() {
        // Evitar conexión duplicada si se ejecuta dentro de un iframe (el Shell ya tiene la conexión)
        if (window.self !== window.top) {
            if (window.top.appSocket) {
                window.appSocket = window.top.appSocket;
            }
            return;
        }

        const authToken = sessionStorage.getItem('authToken');
        if (!authToken) {
            return;
        }
        const socket = io({
            auth: {
                token: authToken
            },
            query: { source: 'web' },
            transports: ['websocket'], // Force WebSocket to avoid HTTP connection limit blocking
            upgrade: false, // Upgrade not needed if forcing websocket
            secure: window.location.protocol === 'https:',
            reconnectionAttempts: 10
        });
        window.appSocket = socket; // Exponer para uso global (chat.html)

        socket.on('connect', () => {
        });

        socket.on('connect_error', (err) => {
            console.error('❌ Error de conexión Socket.io:', err.message);
            console.error('Contexto del error:', err.context || 'Sin contexto adicional');

            if (err.message === 'xhr poll error') {
                showToast('Problema de conexión con el servidor de tiempo real.', 'warning');
            }
        });

        socket.on('disconnect', (reason) => {
            if (reason === 'io server disconnect') {
                // The disconnection was initiated by the server, you need to reconnect manually
                socket.connect();
            }
            if (reason === 'ping timeout') {
                showToast('Conexión inestable (Ping Timeout). Reconectando...', 'warning');
            } else {
                showToast('Desconectado ...', 'error');
            }
        });

        socket.on('new_message', (data) => {
            try {
                if (data.type === "mensajepantalla") {
                    checkPendingMessages();
                } else if (data.type === "mensaje_admin") {
                    // Mostrar mensaje directo del admin
                    // Reutilizamos showWindowsMessagePopup que acepta array, asi que lo envolvemos
                    showWindowsMessagePopup([{
                        titulo: data.titulo,
                        mensaje: data.mensaje,
                        fecha: data.fecha,
                        hora: data.hora
                    }]);
                } else if (data.type === "InvitacionChat") {
                    showChatInvitationModal(data.data);
                }
            } catch (err) {
                console.error('🔥 [DEBUG CLIENTE] ERROR FATAL procesando new_message:', err);
            }
        });

        // Listener para cierre de sesión forzado (sesión duplicada)
        socket.on('session_kicked', (data) => {
            // Mostrar toast por 3 segundos
            showToast(data.message, 'warning', 3000);

            // Después de 3 segundos, limpiar y redirigir
            setTimeout(() => {
                sessionStorage.clear();
                window.location.href = 'about:blank';
            }, 3000);
        });

        // Listener para expulsión por administrador
        socket.on('admin_kick', (data) => {
            let countdown = data.countdown || 15;

            // Mostrar toast con countdown
            showToast(data.message, 'info');

            // Actualizar toast cada segundo
            const countdownInterval = setInterval(() => {
                countdown--;
                if (countdown > 0) {
                    showToast(`El administrador lo sacó del sistema. Se cerrará en ${countdown} segundos.`, 'warning');
                }
            }, 1000);

            // Después de 15 segundos, cerrar sesión
            setTimeout(() => {
                clearInterval(countdownInterval);
                sessionStorage.clear();
                window.location.href = 'about:blank';
            }, data.countdown * 1000);
        });

        // Eventos de chat
        socket.on('chat_accepted', (data) => {
            // Si el modal de chat está abierto, agregar mensaje de sistema
            const chatModal = document.getElementById('chat-active-modal');
            if (chatModal) {
                const salaID = chatModal.dataset.salaId;

                // Verificar si estaba esperando aceptación
                if (salaID && chatWaitingStates.has(salaID)) {
                    const waitState = chatWaitingStates.get(salaID);

                    if (waitState.isWaiting) {

                        // Alguien aceptó! Habilitar el botón de envío
                        const submitBtn = chatModal.querySelector('#floating-chat-form button[type="submit"]');
                        const input = chatModal.querySelector('#floating-chat-input');



                        if (submitBtn) {
                            submitBtn.disabled = false;

                        }
                        if (input) {
                            input.disabled = false;
                            input.focus();

                        }

                        // Cancelar el timeout
                        clearTimeout(waitState.timeoutId);
                        waitState.isWaiting = false;


                        // Remover el mensaje de "Esperando aceptación..."
                        const messagesDiv = chatModal.querySelector('#floating-chat-messages');
                        const firstMsg = messagesDiv?.querySelector('.text-center.text-xs.text-gray-400');
                        if (firstMsg && firstMsg.textContent.includes('Esperando aceptación')) {
                            firstMsg.remove();

                        }
                    }
                }

                appendSystemMessage(chatModal, `${data.nombre} se unió al chat.`);
            }
        });
        socket.on('nuevo_mensaje_sala', (msg) => {
            const chatModal = document.getElementById('chat-active-modal');
            if (chatModal) {
                appendChatMessage(chatModal, msg);
            }
        });


        function showChatInvitationModal(invitation) {
            // invitation: { salaID, solicitante, solicitanteID ... }
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-50';

            const modal = document.createElement('div');
            modal.className = 'bg-white rounded-lg shadow-2xl p-6 w-96 text-center transform transition-all scale-100';
            modal.innerHTML = `
                <div class="mb-4">
                    <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                        <svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <h3 class="text-lg leading-6 font-medium text-gray-900">Invitación de Chat</h3>
                    <div class="mt-2">
                        <p class="text-sm text-gray-500">
                            <strong>${invitation.solicitante}</strong> ha solicitado unirse a un chat.
                        </p>
                    </div>
                </div>
                <div class="mt-6 flex justify-center gap-3">
                    <button id="btn-cancel-invite" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded w-1/2">
                        Cancelar
                    </button>
                    <button id="btn-accept-invite" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-1/2">
                        Aceptar
                    </button>
                </div>
            `;

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            document.getElementById('btn-cancel-invite').onclick = () => overlay.remove();

            document.getElementById('btn-accept-invite').onclick = () => {
                overlay.remove();
                if (window.appSocket) {
                    window.appSocket.emit('accept_invite', { salaID: invitation.salaID });
                    openFloatingChat(invitation.salaID, invitation.solicitante);
                }
            };
        }

        function openFloatingChat(salaID, title, waitingForAcceptance = false) {
            // Verificar si ya existe
            if (document.getElementById('chat-active-modal')) return;

            const overlay = document.createElement('div');
            overlay.id = 'chat-active-modal';
            overlay.dataset.salaId = salaID; // Store salaID for later reference
            // Posicionar abajo a la derecha estilo Facebook/Gmail o flotante
            // Usando grid para mejor control de altura de las secciones
            overlay.className = 'fixed bottom-4 right-20 w-80 h-32 bg-white shadow-2xl rounded-t-lg border border-gray-300 z-[9999]';
            overlay.style.display = 'grid';
            overlay.style.height = '60%';
            overlay.style.gridTemplateRows = 'auto 1fr auto';

            const initialMessage = waitingForAcceptance
                ? '<div class="flex flex-col items-center"><span>-- Esperando aceptación... --</span><img src="/img/waiting.gif" class="h-8 mt-1"></div>'
                : '-- Chat Iniciado --';

            overlay.innerHTML = `
                <div style="background: linear-gradient(180deg, #aad2eb 0%, #8c9bc4 100%); color: rgb(255, 255, 255); padding: 12px 16px; cursor: move; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; border-top-left-radius: 7px; border-top-right-radius: 7px; user-select: none;" id="chat-header">
                    <span class="font-bold text-sm truncate">Chat con ${title}</span>
                    <button id="close-chat-btn" class="text-white hover:text-gray-200 hover:bg-blue-700 rounded p-1 transition-colors font-bold text-lg leading-none border" style="min-width: 24px; min-height: 24px;">
                        ×
                    </button>
                </div>
                <div id="floating-chat-messages" style="overflow-y: auto; overflow-x: hidden; padding: 0.75rem; background-color: #f9fafb;" class="space-y-2 text-sm">
                    <!-- Mensajes -->
                    <div class="text-center text-xs text-gray-400 my-2">${initialMessage}</div>
                    <div id="web-typing-indicator" class="hidden">
                         <div class="typing-indicator"><span></span><span></span><span></span></div>
                    </div>
                </div>
                <div style="padding: 0.5rem; border-top: 1px solid #e5e7eb; background-color: white;">
                    <input type="file" id="floating-chat-file-input" accept="image/*" style="display: none;">
                    <form id="floating-chat-form" class="flex gap-2">
                        <button type="button" id="floating-chat-attach-btn" class="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-2 py-1 text-xs transition-colors" title="Adjuntar imagen">
                            📎
                        </button>
                        <input type="text" id="floating-chat-input" class="flex-1 border rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500" placeholder="Escribe un mensaje o pega una imagen..." autocomplete="off" ${waitingForAcceptance ? 'disabled' : ''}>
                        <button type="submit" class="bg-blue-600 text-white rounded px-3 py-1 text-xs font-bold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed" ${waitingForAcceptance ? 'disabled' : ''}>Enviar</button>
                    </form>
                </div>
            `;

            document.body.appendChild(overlay);

            // Add to active rooms
            activeChatRooms.add(salaID);

            // Close
            const closeBtn = overlay.querySelector('#close-chat-btn');
            closeBtn.onclick = () => {
                // Emit leave room event before removing the chat
                if (window.appSocket && window.appSocket.connected) {
                    window.appSocket.emit('salir_sala', { salaID });
                }
                // Remove from active rooms
                activeChatRooms.delete(salaID);
                // Remove waiting state if exists
                if (chatWaitingStates.has(salaID)) {
                    clearTimeout(chatWaitingStates.get(salaID).timeoutId);
                    chatWaitingStates.delete(salaID);
                }
                overlay.remove();
            };

            // Send
            // Use querySelector on overlay to ensure we get the form IN THIS MODAL
            // avoiding conflicts with other elements in the DOM (like invalid markup with duplicate IDs)
            const form = overlay.querySelector('#floating-chat-form');
            const input = overlay.querySelector('#floating-chat-input');
            const messagesDiv = overlay.querySelector('#floating-chat-messages');

            // Force focus
            setTimeout(() => input.focus(), 100);

            // --- Image Upload Logic ---
            const fileInput = overlay.querySelector('#floating-chat-file-input');
            const attachBtn = overlay.querySelector('#floating-chat-attach-btn');

            // Handle attach button click
            attachBtn.addEventListener('click', () => {
                fileInput.click();
            });

            // Handle file selection
            fileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    await handleImageUpload(file, salaID);
                    fileInput.value = ''; // Reset input
                }
            });

            // --- Typing Logic Web ---
            // 1. Inject CSS if not exists
            if (!document.getElementById('typing-style')) {
                const style = document.createElement('style');
                style.id = 'typing-style';
                style.innerHTML = `
                    .typing-indicator { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; margin-top: 4px; border-radius: 12px; }
                    .typing-indicator span { width: 6px; height: 6px; background: #9ca3af; border-radius: 50%; animation: typing 1.4s infinite ease-in-out both; }
                    .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
                    .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
                    @keyframes typing { 0%, 80%, 100% { transform: scale(0); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }
                `;
                document.head.appendChild(style);
            }

            // 2. Logic
            let typingTimeout = null;
            let isTyping = false;

            input.addEventListener('input', () => {
                if (!isTyping) {
                    isTyping = true;
                    if (window.appSocket) window.appSocket.emit('typing', { salaID: salaID });
                }

                clearTimeout(typingTimeout);
                typingTimeout = setTimeout(() => {
                    isTyping = false;
                    if (window.appSocket) window.appSocket.emit('stop_typing', { salaID: salaID });
                }, 2000);
            });

            // Listeners
            const onTyping = (data) => {
                if (data.salaID === salaID) {
                    const ind = overlay.querySelector('#web-typing-indicator');
                    if (ind) {
                        ind.classList.remove('hidden');
                        messagesDiv.scrollTop = messagesDiv.scrollHeight;
                    }
                }
            };

            const onStopTyping = (data) => {
                if (data.salaID === salaID) {
                    const ind = overlay.querySelector('#web-typing-indicator');
                    if (ind) ind.classList.add('hidden');
                }
            };

            if (window.appSocket) {
                window.appSocket.on('typing', onTyping);
                window.appSocket.on('stop_typing', onStopTyping);
            }

            // Clean up listeners when closing
            const originalClose = closeBtn.onclick;
            closeBtn.onclick = () => {
                if (window.appSocket) {
                    window.appSocket.off('typing', onTyping);
                    window.appSocket.off('stop_typing', onStopTyping);
                }
                originalClose();
            };


            // Handle paste event (Ctrl+V)
            input.addEventListener('paste', async (e) => {
                const items = e.clipboardData.items;
                for (let item of items) {
                    if (item.type.startsWith('image/')) {
                        e.preventDefault();
                        const file = item.getAsFile();
                        await handleImageUpload(file, salaID);
                        break;
                    }
                }
            });

            // Hybrid image upload function
            async function handleImageUpload(file, salaID) {
                // Validate file type
                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                if (!allowedTypes.includes(file.type)) {
                    showToast('Solo se permiten imágenes (JPEG, PNG, GIF, WEBP)', 'error');
                    return;
                }

                // Validate file size (max 10MB)
                const maxSize = 10 * 1024 * 1024;
                if (file.size > maxSize) {
                    showToast('La imagen es demasiado grande (máximo 10MB)', 'error');
                    return;
                }

                const SIZE_THRESHOLD = 500 * 1024; // 500KB

                try {
                    let imageData;

                    if (file.size < SIZE_THRESHOLD) {
                        // Small file: Convert to Base64
                        imageData = await new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result);
                            reader.onerror = reject;
                            reader.readAsDataURL(file);
                        });
                    } else {
                        // Large file: Upload to server
                        const formData = new FormData();
                        formData.append('image', file);

                        const authToken = sessionStorage.getItem('authToken');
                        const response = await fetch('/api/chat/upload-image', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${authToken}`
                            },
                            body: formData
                        });

                        if (!response.ok) {
                            throw new Error('Error al subir la imagen');
                        }

                        const result = await response.json();
                        imageData = result.url;
                    }

                    // Send image message via socket
                    if (window.appSocket) {
                        window.appSocket.emit('mensaje_chat', {
                            salaID,
                            tipo: 'imagen',
                            imagen: imageData,
                            texto: file.name // Optional caption
                        });
                        showToast('Imagen enviada', 'success');
                    }
                } catch (error) {
                    console.error('Error al procesar imagen:', error);
                    showToast('Error al enviar la imagen', 'error');
                }
            }

            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const texto = input.value.trim();

                if (!window.appSocket) {
                    alert('Error de conexión: No se puede enviar el mensaje.');
                    return;
                }

                if (texto) {
                    window.appSocket.emit('mensaje_chat', { salaID, texto });
                    input.value = '';
                    input.focus();
                }
            });

            // Lógica Draggable
            const header = overlay.querySelector('#chat-header');
            let isDragging = false;
            let startX, startY, initialLeft, initialTop;

            header.addEventListener('mousedown', (e) => {
                // Ignore if clicking close button
                if (e.target.closest('#close-chat-btn')) return;

                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;

                const rect = overlay.getBoundingClientRect();

                // Cambiar a posicionamiento fixed con coordenadas absolutas
                overlay.style.position = 'fixed';
                overlay.style.left = rect.left + 'px';
                overlay.style.top = rect.top + 'px';
                overlay.style.bottom = 'auto';
                overlay.style.right = 'auto';
                overlay.style.margin = '0';
                overlay.classList.remove('bottom-4', 'right-20');

                initialLeft = rect.left;
                initialTop = rect.top;

                document.body.style.userSelect = 'none';
            });

            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                e.preventDefault();

                const dx = e.clientX - startX;
                const dy = e.clientY - startY;

                overlay.style.left = (initialLeft + dx) + 'px';
                overlay.style.top = (initialTop + dy) + 'px';
            });

            document.addEventListener('mouseup', () => {
                isDragging = false;
                document.body.style.userSelect = '';
            });

            // Lógica de timeout si está en modo espera
            if (waitingForAcceptance) {
                const timeoutId = setTimeout(() => {
                    // Si después de 30 segundos nadie aceptó
                    if (chatWaitingStates.has(salaID) && chatWaitingStates.get(salaID).isWaiting) {
                        appendSystemMessage(overlay, 'Nadie aceptó la invitación.');
                        // Habilitar controles para retry o cancelar
                        // chatWaitingStates.delete(salaID);
                    }
                }, 30000);

                chatWaitingStates.set(salaID, {
                    timeoutId,
                    isWaiting: true
                });
            }
        }



        // Exponer globalmente para que chat.html pueda llamarla
        window.openFloatingChat = openFloatingChat;

        function appendChatMessage(modal, msg) {
            const container = modal.querySelector('#floating-chat-messages') || modal.querySelector('#chat-messages');
            if (!container) return;

            const isMe = userData && (msg.deID == userData.usuarioID && msg.deSubID == userData.subusuarioID);

            const div = document.createElement('div');
            div.className = `flex w-full ${isMe ? 'justify-end' : 'justify-start'}`;

            // Check if it's an image message
            if (msg.tipo === 'imagen' && msg.imagen) {
                div.innerHTML = `
                    <div class="max-w-[80%] rounded-lg px-3 py-2 ${isMe ? 'bg-blue-100 text-blue-900' : 'bg-white border text-gray-800'}">
                        ${!isMe ? `<div class="text-xs font-bold text-gray-500 mb-1">${msg.de}</div>` : ''}
                        <img src="${msg.imagen}" alt="Imagen" class="max-w-full rounded border cursor-pointer hover:opacity-90 transition-opacity" style="max-height: 300px;" onclick="window.open('${msg.imagen}', '_blank')">
                        ${msg.texto ? `<div class="text-xs text-gray-600 mt-1">${msg.texto}</div>` : ''}
                    </div>
                `;
            } else {
                // Regular text message
                div.innerHTML = `
                    <div class="max-w-[80%] rounded-lg px-3 py-2 ${isMe ? 'bg-blue-100 text-blue-900' : 'bg-white border text-gray-800'}">
                        ${!isMe ? `<div class="text-xs font-bold text-gray-500 mb-0.5">${msg.de}</div>` : ''}
                        <div class="text-sm">${msg.texto}</div>
                    </div>
                `;
            }
            container.appendChild(div);
            container.scrollTop = container.scrollHeight;
        }

        // Exponer globalmente para que chat.html pueda agregar mensajes
        window.appendChatMessage = appendChatMessage;

        function appendSystemMessage(modal, text) {
            const container = modal.querySelector('#chat-messages');
            if (!container) return;
            const div = document.createElement('div');
            div.className = 'text-center text-xs text-gray-500 italic my-1';
            div.textContent = text;
            container.appendChild(div);
            container.scrollTop = container.scrollHeight;
        }


        // Función para buscar mensajes no leídos y mostrarlos
        async function checkPendingMessages() {
            try {
                const response = await fetch('/api/mensajeria/pendientes', {
                    headers: { 'Authorization': `Bearer ${sessionStorage.getItem('authToken')}` }
                });
                if (!response.ok) {
                    return;
                }
                const mensajes = await response.json();

                // 1. Lógica del Badge (Solo mensajes Web)
                const webMessages = mensajes.filter(m => m.destino === 'web');
                const badge = document.getElementById('notification-badge');
                if (badge) {
                    if (webMessages.length > 0) {
                        badge.textContent = webMessages.length;
                        badge.classList.remove('hidden');
                    } else {
                        badge.classList.add('hidden');
                    }
                }

                // 2. Popup de Windows (Solo mensajes Web)
                if (webMessages.length > 0) {
                    showWindowsMessagePopup(webMessages);
                }

                // 3. Lógica de Push para Celular - DESHABILITADO (Ya se maneja en Server al crear mensaje)
                /*
                const celMessages = mensajes.filter(m => m.destino === 'celular');
                if (celMessages.length > 0) {
                    showMessageCel(celMessages);
                }
                */

            } catch (error) {
                console.error('Error al verificar mensajes pendientes:', error);
            }
        }

        function showMessageCel(mensajes) {
            const lastPush = sessionStorage.getItem('lastPushTime');
            const now = new Date().getTime();

            if (!lastPush || now - lastPush > 60000) {
                // Extract unique subUser IDs from messages
                const targetSubIDs = [...new Set(mensajes.map(m => m.aSubId))];

                if (targetSubIDs.length > 0) {
                    fetch('/api/notificaciones/send-push-alert', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
                        },
                        body: JSON.stringify({ targets: targetSubIDs })
                    })
                        .then(res => res.json())
                        .then(data => { })
                        .catch(err => console.error('Error triggering push:', err));

                    sessionStorage.setItem('lastPushTime', now);
                }
            } else {
            }
        }

        function showWindowsMessagePopup(mensajes) {
            // Evitar duplicados si ya está abierto
            if (document.getElementById('win-msg-popup')) return;

            const overlay = document.createElement('div');
            overlay.id = 'win-msg-popup';
            overlay.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4';

            const win = document.createElement('div');
            win.className = 'bg-white rounded-lg shadow-xl w-full max-w-2xl transform transition-all scale-95 opacity-0 overflow-hidden';

            const title = mensajes.length > 1 ? `${mensajes.length} Mensajes Nuevos` : 'Mensaje Nuevo';

            win.innerHTML = `
                <div class="p-6">
                    <h2 class="text-2xl font-bold text-gray-800 flex items-center mb-4">
                        <svg class="w-8 h-8 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        ${title}
                    </h2>

                    <div class="max-h-96 overflow-y-auto mb-6 space-y-4">
                        ${mensajes.map((m, idx) => {
                // Formatear fecha/hora (AAAAMMDDHHMM)
                const f = m.cuando;
                const fechaFormateada = `${f.substring(6, 8)}/${f.substring(4, 6)}/${f.substring(0, 4)}`;
                const horaFormateada = `${f.substring(8, 10)}:${f.substring(10, 12)}`;

                return `
                                <div class="${idx > 0 ? 'pt-4 border-t border-gray-200' : ''} bg-gray-50 rounded-lg p-4">
                                    <div class="flex justify-between items-start mb-2">
                                        <div class="text-sm text-gray-600">
                                            <strong>De:</strong> ${m.deNombre || 'Sistema'}
                                        </div>
                                        <div class="text-xs text-gray-500">
                                            ${fechaFormateada} ${horaFormateada}
                                        </div>
                                    </div>
                                    <div class="font-bold text-lg text-blue-800 mb-2">${m.titulo}</div>
                                    ${m.mensaje ? `<div class="text-gray-700 whitespace-pre-wrap">${m.mensaje}</div>` : ''}
                                </div>
                            `;
            }).join('')}
                    </div>

                    <div class="flex justify-end">
                        <button id="win-close-btn"
                            class="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors">
                            Cerrar
                        </button>
                    </div>
                </div>
            `;

            overlay.appendChild(win);
            document.body.appendChild(overlay);

            // Trigger entrance animation
            setTimeout(() => {
                win.classList.remove('scale-95', 'opacity-0');
            }, 10);

            // Marcar como leídos
            const mensajeIDs = mensajes.map(m => m.mensajeID);
            fetch('/api/mensajeria/marcar-leidos', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ mensajeIDs })
            }).catch(err => console.error('Error marking as read:', err));

            // Evento cerrar con animación
            document.getElementById('win-close-btn').onclick = () => {
                win.classList.add('scale-95', 'opacity-0');
                setTimeout(() => overlay.remove(), 300);
            };
        }

        // Verificar mensajes al conectar
        checkPendingMessages();

        // Hacer el socket accesible globalmente
        window.appSocket = socket;
    }

    // --- Inicialización ---
    buildMenu();
    initializeWebSockets();

    // --- Cleanup on page unload ---
    window.addEventListener('beforeunload', () => {
        if (window.appSocket && window.appSocket.connected && activeChatRooms.size > 0) {
            // Emit leave events for all active rooms
            activeChatRooms.forEach(salaID => {
                window.appSocket.emit('salir_sala', { salaID });
            });
        }
    });
}