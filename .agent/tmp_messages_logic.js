
// Messages Logic
async function loadMessages() {
    const list = document.getElementById('messages-list');
    list.innerHTML = '<p class="text-center text-gray-500 py-4">Cargando mensajes...</p>';

    try {
        const token = sessionStorage.getItem('authToken');
        const response = await fetch('/api/mensajeria/pendientes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const messages = await response.json();

            if (messages.length === 0) {
                list.innerHTML = `
                    <div class="text-center py-8">
                        <svg class="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                        </svg>
                        <p class="text-gray-500">No tienes mensajes nuevos</p>
                    </div>`;
                return;
            }

            list.innerHTML = '';
            messages.forEach(msg => {
                const el = document.createElement('div');
                el.className = 'bg-white p-4 rounded-lg shadow border-l-4 border-blue-500 mb-3';

                // Formatear fecha (YYYYMMDDHHMM -> DD/MM/YYYY HH:MM)
                let fechaStr = "Fecha desconocida";
                if (msg.cuando && msg.cuando.length >= 12) {
                    const y = msg.cuando.substring(0, 4);
                    const m = msg.cuando.substring(4, 6);
                    const d = msg.cuando.substring(6, 8);
                    const h = msg.cuando.substring(8, 10);
                    const min = msg.cuando.substring(10, 12);
                    fechaStr = `${d}/${m}/${y} ${h}:${min}`;
                }

                el.innerHTML = `
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="font-bold text-lg text-gray-800">${msg.titulo || 'Sin título'}</h3>
                        <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">${fechaStr}</span>
                    </div>
                    <p class="text-gray-600 mb-3">${msg.mensaje}</p>
                    <div class="flex justify-between items-center text-sm text-gray-500">
                        <span>De: <span class="font-semibold text-gray-700">${msg.deNombre || 'Sistema'}</span></span>
                        <button onclick="markAsRead(${msg.mensajeID})" class="text-blue-600 hover:text-blue-800 font-semibold text-xs uppercase tracking-wide">
                            Marcar leido
                        </button>
                    </div>
                `;
                list.appendChild(el);
            });

        } else {
            list.innerHTML = '<p class="text-center text-red-500">Error al cargar mensajes</p>';
        }
    } catch (err) {
        console.error(err);
        list.innerHTML = '<p class="text-center text-red-500">Error de conexión</p>';
    }
}

// Global scope for onclick
window.markAsRead = async function (id) {
    if (!confirm('¿Marcar como leído?')) return;

    try {
        const token = sessionStorage.getItem('authToken');
        const response = await fetch('/api/mensajeria/marcar-leidos', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ mensajeIDs: [id] })
        });

        if (response.ok) {
            // Reload list
            loadMessages();
        } else {
            alert('Error al actualizar');
        }
    } catch (e) {
        console.error(e);
        alert('Error de conexión');
    }
}
