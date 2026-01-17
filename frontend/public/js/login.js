// login.js - Script de Inicio de Sesión Mejorado
console.log("Script login.js cargado.");

document.addEventListener('DOMContentLoaded', () => {
    
    // Limpiamos cualquier sesión vieja al entrar al login para evitar conflictos
    localStorage.removeItem('userToken');
    localStorage.removeItem('userId');

    const loginForm = document.getElementById('login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();

            if (!email || !password) return alert("Por favor, completa los campos");

            try {
                console.log("Enviando credenciales...");

                // Petición al backend
                const response = await fetch('/api/users/login', { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();
                console.log("📥 Respuesta del Servidor:", data);

                if (data.success) {
                    // ------------------------------------------------------
                    // 🔍 DETECCIÓN INTELIGENTE DEL ID DE USUARIO
                    // ------------------------------------------------------
                    // El servidor podría devolver el ID con distintos nombres.
                    // Buscamos el correcto en este orden:
                    const userId = data.id_usuario || 
                                   data.userId || 
                                   data.id || 
                                   (data.user ? data.user.id : null) ||
                                   (data.user ? data.user.id_usuario : null);

                    const token = data.token;

                    // Validar que realmente tenemos datos antes de guardar
                    if (!token || !userId) {
                        console.error("❌ Error CRÍTICO: El servidor dijo success pero faltan datos.");
                        console.error("Token recibido:", token);
                        console.error("ID recibido:", userId);
                        alert("Error de sistema: Login exitoso pero faltan datos de sesión.");
                        return;
                    }

                    // ✅ Guardar en LocalStorage
                    localStorage.setItem('userToken', token);
                    localStorage.setItem('userId', userId);
                    
                    console.log("✅ Datos guardados en LocalStorage:");
                    console.log("Token:", localStorage.getItem('userToken'));
                    console.log("UserId:", localStorage.getItem('userId'));

                    alert('¡Bienvenido!');
                    
                    // Redirigir al main
                    window.location.href = '/main'; 
                } else {
                    alert('Error: ' + (data.message || 'Credenciales incorrectas'));
                }
            } catch (error) {
                console.error("❌ Error de red o código:", error);
                alert('Error de conexión con el servidor.');
            }
        });
    }
}); 