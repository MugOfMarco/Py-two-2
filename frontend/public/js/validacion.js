document.addEventListener('DOMContentLoaded', () => {
    console.log('--- 🚀 JS: Validación cargada ---');
    
    const form = document.getElementById('registerForm');
    const apiMessageDiv = document.getElementById('mensaje-api'); 

    if (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault(); // 🛑 Detener el envío automático
            
            // Limpiar mensajes previos
            if (apiMessageDiv) {
                apiMessageDiv.textContent = '';
                apiMessageDiv.style.color = 'inherit';
            }

            // 1. EJECUTAR VALIDACIÓN LOCAL
            if (!validarFormulario()) {
                console.log('❌ JS: Validación falló. Corregir errores.');
                return; 
            }

            // 2. SI TODO ESTÁ BIEN, ENVIAR AL SERVIDOR
            console.log('✅ JS: Todo válido. Enviando a la API...');
            enviarRegistroAPI();
        });
    }

    // ==========================================
    // 📡 CONEXIÓN CON EL BACKEND
    // ==========================================
    async function enviarRegistroAPI() {
        const formData = new FormData(form); 
        const data = Object.fromEntries(formData.entries());

        try {
            // 👇👇👇 AQUÍ ESTÁ EL CAMBIO (Línea 112 aprox) 👇👇👇
            // Usamos '/api/users/register' para coincidir con tu server.js original
            const response = await fetch('/api/users/register', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            // Verificar si la respuesta es JSON
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("El servidor no devolvió JSON (Posible error 404 o 500)");
            }

            const responseData = await response.json();

            if (response.ok && responseData.success) { 
                alert('✅ ¡Cuenta creada con éxito! Redirigiendo...');
                window.location.href = '/login'; 
            } else {
                // Error del servidor (ej: Email duplicado)
                mostrarErrorGlobal(responseData.message || 'Error al registrar.');
            }
        } catch (error) {
            console.error('Error de red/servidor:', error);
            mostrarErrorGlobal('Ruta API no encontrada o Servidor caído.');
        }
    }

    // ==========================================
    // 🧠 CEREBRO DE LA VALIDACIÓN
    // ==========================================
    function validarFormulario() {
        let esValido = true;

        // Limpiar estilos de error previos
        document.querySelectorAll('.input-validation-error').forEach(el => el.classList.remove('input-validation-error'));
        document.querySelectorAll('.error-message').forEach(el => el.remove());

        // 1. Validar Nombres y Apellidos
        document.querySelectorAll('.input-letras').forEach(input => {
            if (!validarInputLetras(input)) esValido = false;
        });

        // 2. Validar Correo
        document.querySelectorAll('.input-correo').forEach(input => {
            if (!validarInputCorreo(input)) esValido = false;
        });

        // 3. Validar Teléfono
        document.querySelectorAll('.input-numeros').forEach(input => {
            if (!validarInputNumeros(input)) esValido = false;
        });

        // 4. Validar Contraseña
        document.querySelectorAll('.input-password').forEach(input => {
            if (input.id !== 'confirm_password') {
                if (!validarInputPassword(input)) esValido = false;
            }
        });

        // 5. Comparar Contraseñas
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirm_password');
        if (password && confirmPassword) {
            if (!validarConfirmacionPassword(password, confirmPassword)) esValido = false;
        }
        
        // 6. Validar Edad
        const fechaNacimiento = document.getElementById('fecha_nacimiento');
        if (fechaNacimiento) {
            if (!validarEdad(fechaNacimiento)) esValido = false;
        }

        // 7. Validar Código Postal
        const codigoPostal = document.getElementById('codigo_postal');
        if (codigoPostal) {
            if (!validarCodigoPostal(codigoPostal)) esValido = false;
        }

        if (!esValido) {
            const primerError = document.querySelector('.input-validation-error');
            if (primerError) primerError.focus();
        }

        return esValido;
    }

    // ==========================================
    // 🛠️ HERRAMIENTAS DE VALIDACIÓN (Regex)
    // ==========================================

    function validarInputLetras(input) {
        const value = input.value.trim();
        const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,64}$/; 
        if (!regex.test(value)) {
            mostrarError(input, 'Solo letras y espacios (mín. 2 letras).');
            return false;
        }
        return true;
    }

    function validarInputCorreo(input) {
        const value = input.value.trim();
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
        if (!regex.test(value)) {
            mostrarError(input, 'Correo inválido.');
            return false;
        }
        return true;
    }

    function validarInputNumeros(input) {
        const value = input.value.trim();
        const regex = /^\d{8,15}$/; 
        if (!input.required && value === '') return true;
        if (!regex.test(value)) {
            mostrarError(input, 'Solo números (8-15 dígitos).');
            return false;
        }
        return true;
    }

    function validarInputPassword(input) {
        const value = input.value;
        const regex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&._-]{8,}$/;
        if (!regex.test(value)) {
            mostrarError(input, 'Mínimo 8 chars, 1 Mayúscula, 1 Número.');
            return false;
        }
        return true;
    }
    
    function validarConfirmacionPassword(passwordInput, confirmInput) {
        if (passwordInput.value !== confirmInput.value) {
            mostrarError(confirmInput, 'Las contraseñas no coinciden.');
            return false;
        }
        return true;
    }

    function validarEdad(input) {
        if (!input.value) { mostrarError(input, 'Fecha requerida.'); return false; }
        const birthday = new Date(input.value);
        const today = new Date();
        let age = today.getFullYear() - birthday.getFullYear();
        const monthDiff = today.getMonth() - birthday.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
            age--;
        }
        if (age < 18) {
            mostrarError(input, 'Debes ser mayor de 18 años.');
            return false;
        }
        return true;
    }

    function validarCodigoPostal(input) {
        const value = input.value.trim();
        const regex = /^\d{4,5}$/; 
        if (!input.required && value === '') return true;
        if (!regex.test(value)) {
            mostrarError(input, 'CP inválido.');
            return false;
        }
        return true;
    }

    // ==========================================
    // 🎨 UI: ERRORES
    // ==========================================
    function mostrarError(inputElement, mensaje) {
        inputElement.classList.add('input-validation-error'); 
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.color = '#ff4d4d';
        errorDiv.style.fontSize = '0.85rem';
        errorDiv.style.marginTop = '5px';
        errorDiv.textContent = mensaje;
        inputElement.parentNode.appendChild(errorDiv);
    }

    function mostrarErrorGlobal(mensaje) {
        if (apiMessageDiv) {
            apiMessageDiv.textContent = '❌ ' + mensaje;
            apiMessageDiv.style.color = 'red';
        } else {
            alert(mensaje);
        }
    }
});