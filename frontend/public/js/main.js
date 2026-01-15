// main.js - Script para manejar la autenticación en la página principal
console.log("Script main.js cargado.");

document.addEventListener('DOMContentLoaded', () => {
    // Seleccionar el botón/enlace de "Cuenta" (perfil)
    const perfilBtn = document.querySelector('a[href="/perfil"]');
    
    if (perfilBtn) {
        perfilBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevenir la navegación por defecto
            
            // Verificar si existe el token en localStorage
            const token = localStorage.getItem('userToken');
            const userId = localStorage.getItem('userId');
            
            if (token && userId) {
                // Usuario está logueado → redirigir a perfil
                console.log("Usuario autenticado, redirigiendo a perfil...");
                window.location.href = '/perfil';
            } else {
                // No hay sesión → redirigir a login
                console.log("Usuario no autenticado, redirigiendo a login...");
                window.location.href = '/login';
            }
        });
    }

    // También podemos aplicar lo mismo para el botón de "Pedidos"
    const historialBtn = document.querySelector('a[href="/historial"]');
    
    if (historialBtn) {
        historialBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            const token = localStorage.getItem('userToken');
            
            if (token) {
                window.location.href = '/historial';
            } else {
                alert('Debes iniciar sesión para ver tu historial de pedidos');
                window.location.href = '/login';
            }
        });
    }

    // Opcional: Mostrar el nombre del usuario si está logueado
    const token = localStorage.getItem('userToken');
    if (token) {
        // Cambiar el texto del botón "Cuenta" por algo personalizado si quieres
        if (perfilBtn) {
            const perfilSpan = perfilBtn.querySelector('span');
            if (perfilSpan) {
                perfilSpan.textContent = 'Mi Cuenta';
            }
        }
    }
});