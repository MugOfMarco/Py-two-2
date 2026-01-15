const loginForm = document.getElementById('login-form');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evita que la página se recargue sola

        // 1. Obtener datos limpios
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!email || !password) {
            return alert("Por favor completa todos los campos.");
        }

        try {
            // 2. Conectar con el Backend
            const response = await fetch('/api/usuarios/login', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            // 3. Manejar respuesta
            if (data.success) {
                // ✅ GUARDAR TOKEN (Lo más importante)
                localStorage.setItem('userToken', data.token);
                localStorage.setItem('userId', data.id_usuario);
                
                // Redirigir
                window.location.href = '/main'; 
            } else {
                // ❌ Error (Usuario no existe o contraseña mal)
                alert(data.message || 'Error al iniciar sesión');
            }
        } catch (error) {
            console.error('Error de red:', error);
            alert('El servidor no responde. Intenta más tarde.');
        }
    });
}