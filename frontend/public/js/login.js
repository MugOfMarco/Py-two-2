document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault(); // Evita la recarga de la página
            
            // 1. Validar campos del lado del cliente antes de enviar
            if (!validarLogin()) {
                return;
            }

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/api/usuarios/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    // ÉXITO: GUARDAR EL TOKEN y REDIRIGIR
                    localStorage.setItem('userToken', data.token);
                    console.log("Inicio de sesión exitoso. Redirigiendo...");
                    alert('✅ Inicio de sesión exitoso. ¡Bienvenido!');
                    window.location.href = '/main'; // Redirigir a la página principal

                } else {
                    alert('❌ Error: ' + data.message);
                }
            } catch (error) {
                console.error('Error de conexión:', error);
                alert('Hubo un problema al conectar con el servidor.');
            }
        });
    }

    // =======================================================
    // --- LÓGICA DE VALIDACIÓN DEL CLIENTE (COPIADA DE VALIDACION.JS) ---
    // =======================================================

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