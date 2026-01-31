const CACHE_NAME = 'proyectos-pwa-v28-final';

const ASSETS_TO_CACHE = [
    '/img/logoproyectos.png'
];

// ============================================
// INSTALL - Instalar nuevo SW inmediatamente
// ============================================
self.addEventListener('install', (event) => {
    console.log('[SW] Instalando nueva versión:', CACHE_NAME);
    self.skipWaiting(); // Activar inmediatamente sin esperar

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Cacheando assets mínimos');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// ============================================
// ACTIVATE - Limpiar cachés antiguos
// ============================================
self.addEventListener('activate', (event) => {
    console.log('[SW] Activando nueva versión:', CACHE_NAME);

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Eliminando caché antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Tomar control de TODAS las páginas inmediatamente
            console.log('[SW] Tomando control de todos los clientes');
            return self.clients.claim();
        }).then(() => {
            // CRÍTICO: Forzar recarga de todas las páginas abiertas
            return self.clients.matchAll({ type: 'window' }).then(clients => {
                clients.forEach(client => {
                    console.log('[SW] Notificando actualización al cliente');
                    client.postMessage({
                        type: 'SW_UPDATED',
                        version: CACHE_NAME
                    });
                });
            });
        })
    );
});

// ============================================
// FETCH - Network First con fallback a caché
// ============================================
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Estrategia Network First para HTML y JS
    if (event.request.method === 'GET') {
        event.respondWith(
            fetch(event.request, {
                cache: 'no-cache' // CRÍTICO: No usar caché del navegador
            })
                .then(response => {
                    // Clonar la respuesta para guardarla en caché
                    const responseToCache = response.clone();

                    // Solo cachear respuestas exitosas
                    if (response.status === 200) {
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    }

                    return response;
                })
                .catch(() => {
                    // Fallback al caché solo si falla la red
                    console.log('[SW] Usando caché para:', event.request.url);
                    return caches.match(event.request);
                })
        );
    }
});

// ============================================
// PUSH NOTIFICATIONS
// ============================================
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Nueva Notificación';
    const options = {
        body: data.body || 'Tienes una nueva notificación.',
        icon: '/img/logoproyectos.png',
        badge: '/img/logoproyectos.png',
        data: { url: data.url || '/' }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (let client of windowClients) {
                if (client.url.includes(self.registration.scope) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url || '/');
            }
        })
    );
});