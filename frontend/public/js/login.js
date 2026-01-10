document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault(); 
            
            if (!validarLogin()) {
                return;
            }

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                // 🚨 CORRECCIÓN 1: Cambiamos /usuarios/ por /users/
                const response = await fetch('/api/users/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    // ÉXITO: GUARDAR EL TOKEN
                    localStorage.setItem('userToken', data.token);

                    // 🚨 CORRECCIÓN 2: GUARDAR EL ID DEL USUARIO PARA EL CARRITO
                    // Nota: Asegúrate de que tu backend envíe 'id_usuario' dentro del objeto 'user'
                    if (data.user && data.user.id_usuario) {
                        localStorage.setItem('userId', data.user.id_usuario);
                    }

                    console.log("Inicio de sesión exitoso. Redirigiendo...");
                    alert('✅ Inicio de sesión exitoso. ¡Bienvenido!');
                    window.location.href = '/main'; 

                } else {
                    alert('❌ Error: ' + data.message);
                }
            } catch (error) {
                console.error('Error de conexión:', error);
                alert('Hubo un problema al conectar con el servidor.');
            }
        });
    }

    // --- LÓGICA DE VALIDACIÓN (Se mantiene igual) ---
    function validarLogin() {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        let esValido = true;
        
        document.querySelectorAll('.error-message').forEach(el => el.remove());
        if (!validarInputCorreo(emailInput)) {
            esValido = false;
        }
        if (passwordInput.value.trim() === '') {
            mostrarError(passwordInput, 'La contraseña es obligatoria.');
            esValido = false;
        }

        return esValido;
    }
    
    function validarInputCorreo(input) {
        const value = input.value.trim();
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 

        if (!regex.test(value)) {
            mostrarError(input, 'Por favor, introduce un correo electrónico válido.');
            return false;
        }
        return true;
    }

    function mostrarError(inputElement, mensaje) {
        inputElement.classList.add('input-validation-error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = mensaje;
        const formGroup = inputElement.closest('.form-group');
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) {
            existingError.textContent = mensaje;
        } else if (formGroup) {
            formGroup.appendChild(errorDiv);
        }
    }
});