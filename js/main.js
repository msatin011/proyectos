var S = {};
const initApp = () => {
    const splashScreen = document.getElementById('splash-screen');
    const mainContent = document.getElementById('main-content');

    // --- Lógica del Splash Screen (MOVIDO AL INICIO) ---
    // Se ejecuta primero para garantizar que la pantalla de carga desaparezca
    setTimeout(() => {
        if (splashScreen) {
            splashScreen.classList.add('opacity-0');

            // Fallback sde seguridad: ocultar si la transición CSS falla o no existe
            setTimeout(() => {
                splashScreen.classList.add('hidden');
            }, 1600);

            splashScreen.addEventListener('transitionend', () => {
                splashScreen.classList.add('hidden');
            });
        }
        if (mainContent) {
            mainContent.classList.remove('opacity-0');
        }
    }, 1000);

    try {
        if (typeof localStorage !== 'undefined') {
            const savedCuit = localStorage.getItem('savedCuit');
            const savedU = localStorage.getItem('savedU');
            const savedPassword = localStorage.getItem('savedPassword');
            const cuitLoginInput = document.getElementById('cuit-login');
            const uLoginInput = document.getElementById('u-login');
            const passwordLoginInput = document.getElementById('password-login');

            if (savedCuit && cuitLoginInput) cuitLoginInput.value = savedCuit;
            if (savedU && uLoginInput) uLoginInput.value = savedU;
            if (savedPassword && passwordLoginInput) passwordLoginInput.value = savedPassword;
        }
    } catch (e) {
        console.warn('No se pudo acceder a localStorage (posible restricción de seguridad):', e);
    }

    // --- Lógica de Navegación entre Formularios ---
    const loginContainer = document.getElementById('login-form-container');

    const changeContainer = document.getElementById('change-password-container');


    const showChangePasswordLink = document.getElementById('show-change-password');
    const backToLogin1 = document.getElementById('back-to-login-1');
    const backToLogin2 = document.getElementById('back-to-login-2');

    const showForm = (formToShow) => {
        [loginContainer, changeContainer].forEach(container => {
            if (container) container.classList.add('hidden');
        });
        if (formToShow) formToShow.classList.remove('hidden');
    };



    if (showChangePasswordLink) {
        showChangePasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            showForm(changeContainer);
        });
    }

    if (backToLogin1) {
        backToLogin1.addEventListener('click', () => showForm(loginContainer));
    }
    if (backToLogin2) {
        backToLogin2.addEventListener('click', () => showForm(loginContainer));
    }

    // --- Máscara de CUIT ---
    const cuitInputs = document.querySelectorAll('input[id^="cuit-"]');

    const applyCuitMask = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        let maskedValue = '';

        if (value.length > 0) {
            maskedValue = value.substring(0, 2);
        }
        if (value.length > 2) {
            maskedValue += '-' + value.substring(2, 10);
        }
        if (value.length > 10) {
            maskedValue += '-' + value.substring(10, 11);
        }
        e.target.value = maskedValue;
    };

    cuitInputs.forEach(input => {
        input.addEventListener('input', applyCuitMask);
        input.setAttribute('maxlength', '13');
    });

    // --- Lógica para ver/ocultar contraseña ---
    const togglePasswordButtons = document.querySelectorAll('.password-toggle');

    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetInput = document.getElementById(button.dataset.target);
            const eyeOpenIcon = button.querySelector('.eye-open');
            const eyeClosedIcon = button.querySelector('.eye-closed');

            if (targetInput) {
                if (targetInput.type === 'password') {
                    targetInput.type = 'text';
                    eyeOpenIcon.classList.add('hidden');
                    eyeClosedIcon.classList.remove('hidden');
                } else {
                    targetInput.type = 'password';
                    eyeOpenIcon.classList.remove('hidden');
                    eyeClosedIcon.classList.add('hidden');
                }
            }
        });
    });

    // --- Lógica de Notificaciones Toast ---
    const toastContainer = document.getElementById('toast-container');

    window.showToast = function (message, type = 'info', duration = 4000) {
        if (!toastContainer) return;

        const toast = document.createElement('div');

        // Clases base y de animación
        toast.className = 'text-white font-bold py-3 px-6 rounded-lg shadow-xl animate-fade-in-right cursor-pointer z-50';

        // Clases de color según el tipo
        const toastTypes = {
            info: 'bg-green-500',
            warning: 'bg-orange-500',
            error: 'bg-red-600'
        };
        toast.classList.add(toastTypes[type] || toastTypes.info);

        toast.innerHTML = message; // Cambiado a innerHTML para permitir etiquetas como <br>
        toastContainer.appendChild(toast);

        const dismissToast = () => {
            if (toast.parentElement) { // Evita errores si ya se está eliminando
                toast.classList.remove('animate-fade-in-right');
                toast.classList.add('animate-fade-out');
                toast.addEventListener('animationend', (e) => {
                    if (e.animationName === 'fade-out') {
                        toast.remove();
                    }
                });
            }
        };

        // Evento para cerrar con un clic
        toast.addEventListener('click', () => {
            clearTimeout(timer); // Cancela el temporizador si se cierra manualmente
            dismissToast();
        });

        // Temporizador para auto-cierre
        const timer = setTimeout(dismissToast, duration);
    }

    // --- Lógica de Envío de Formularios (Ejemplo) ---
    const loginBtn = document.getElementById('btn-login-submit');
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const loginForm = document.getElementById('login-form');
            if (loginForm && !loginForm.checkValidity()) {
                loginForm.reportValidity();
                return;
            }

            const cuit = document.getElementById('cuit-login').value;
            const u = document.getElementById('u-login').value;
            const password = document.getElementById('password-login').value;
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ cuit, u, password }),
                });

                const data = await response.json(); // Use await to parse the JSON response

                if (response.ok) {
                    // Login exitoso
                    // Guardar credenciales en localStorage
                    S.usuario = data;
                    localStorage.setItem('savedCuit', cuit);
                    localStorage.setItem('savedU', u);
                    localStorage.setItem('savedPassword', password);
                    // Guardar datos del usuario para la sesión del layout
                    sessionStorage.setItem('userData', JSON.stringify(data.user));
                    sessionStorage.setItem('authToken', data.token); // Guardar el token
                    S.usuario = data.user; // Guardar datos del usuario, incluyendo el rol

                    // Mostrar toast de bienvenida
                    showToast(`¡Bienvenido, ${data.user.nombre}!`, 'info', 1500);

                    // === NAVEGACIÓN SPA ===
                    // Redirigir a la aplicación SPA después de un breve delay para mostrar el toast
                    setTimeout(() => {
                        window.location.href = '/app.html';
                    }, 800);

                } else {
                    // Error manejado por el backend (ej: clave incorrecta, usuario no existe)
                    showToast(data.message, 'error');
                }
            } catch (error) {
                // Error de red o si el servidor no responde
                showToast('No se pudo conectar con el servidor. Inténtalo de nuevo más tarde.', 'error');
            }
        });
    }



    const changePwdBtn = document.getElementById('btn-change-password-submit');
    if (changePwdBtn) {
        changePwdBtn.addEventListener('click', async () => {
            const changePasswordForm = document.getElementById('change-password-form');
            if (changePasswordForm && !changePasswordForm.checkValidity()) {
                changePasswordForm.reportValidity();
                return;
            }
            const cuit = document.getElementById('cuit-change').value;
            const u = document.getElementById('u-change').value;
            const oldPassword = document.getElementById('old-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (newPassword !== confirmPassword) {
                showToast('Las nuevas claves no coinciden.', 'warning');
                return;
            }

            try {
                const response = await fetch('/api/change-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ cuit, u, oldPassword, newPassword }),
                });

                const data = await response.json();

                if (response.ok) {
                    showToast(data.message, 'info');
                    // Limpiar formulario y volver al login
                    changePasswordForm.reset();
                    setTimeout(() => {
                        showForm(loginContainer);
                    }, 2000);
                } else {
                    showToast(data.message, 'error');
                }
            } catch (error) {
                console.error(error);
                showToast('Error de conexión. Inténtalo de nuevo.', 'error');
            }
        });
    }

    // --- Validaciones de entrada ---
    const inputsToValidate = [
        'cuit-login', 'u-login',
        'cuit-change', 'u-change'
    ];

    inputsToValidate.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', validateInput);
        }
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
