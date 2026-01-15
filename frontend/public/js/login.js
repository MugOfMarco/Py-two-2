// 1. Verificamos carga
console.log("Script login.js cargado.");

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();

            if (!email || !password) return alert("Completa los campos");

            try {
                // 🚨 CAMBIO AQUÍ: Usamos '/api/users/login' para coincidir con tu server.js original
                const response = await fetch('/api/users/login', { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();
                console.log("Respuesta:", data);

                if (data.success) {
                    localStorage.setItem('userToken', data.token);
                    localStorage.setItem('userId', data.id_usuario);
                    alert('¡Bienvenido!');
                    window.location.href = '/main'; 
                } else {
                    alert('Error: ' + (data.message || 'Credenciales incorrectas'));
                }
            } catch (error) {
                console.error(error);
                alert('Error de conexión con el servidor.');
            }
        });
    }
});