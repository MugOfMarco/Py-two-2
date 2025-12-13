document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');

    if (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();

            // 1. Ejecutar la validación del lado del cliente
            if (!validarFormulario()) {
                const primerError = document.querySelector('.input-validation-error');
                if (primerError) {
                    primerError.focus();
                }
                return;
            }

            // 2. Si la validación es exitosa, se procede con el envío de datos a la API
            enviarRegistroAPI();
        });
    }

    // --- FUNCIÓN PRINCIPAL DE VALIDACIÓN ---
    function validarFormulario() {
        let esValido = true;

        // Limpiamos los estados de error previos
        document.querySelectorAll('.input-validation-error').forEach(el => {
            el.classList.remove('input-validation-error');
        });
        document.querySelectorAll('.error-message').forEach(el => el.remove());

        // 1. Campos de Solo Letras (Nombre y Apellido)
        document.querySelectorAll('.input-letras').forEach(input => {
            if (!validarInputLetras(input)) {
                esValido = false;
            }
        });

        // 2. Campo de Correo Electrónico
        document.querySelectorAll('.input-correo').forEach(input => {
            if (!validarInputCorreo(input)) {
                esValido = false;
            }
        });

        // 3. Campo de Teléfono (Solo Números)
        document.querySelectorAll('.input-numeros').forEach(input => {
            if (!validarInputNumeros(input)) {
                esValido = false;
            }
        });

        // 4. Campo de Contraseña
        document.querySelectorAll('.input-password').forEach(input => {
            if (!validarInputPassword(input)) {
                esValido = false;
            }
        });

        // 5. Confirmación de Contraseña
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirm_password');
        // Usamos la clase simple 'input' o ninguna para Confirmar Contraseña
        if (password && confirmPassword) {
            if (!validarConfirmacionPassword(password, confirmPassword)) {
                esValido = false;
            }
        }
        
        // 6. Campo Fecha de Nacimiento (Validación de Edad)
        const fechaNacimiento = document.getElementById('fecha_nacimiento');
        if (fechaNacimiento) {
             if (!validarEdad(fechaNacimiento)) {
                 esValido = false;
             }
        }

        // 7. Campo Código Postal
        const codigoPostal = document.getElementById('codigo_postal');
        if (codigoPostal) {
            if (!validarCodigoPostal(codigoPostal)) {
                esValido = false;
            }
        }
        
        // 8. Validación de la casilla de Términos (Si la agregas al HTML)
        const termsCheckbox = document.getElementById('terms');
        if (termsCheckbox && !termsCheckbox.checked) {
            mostrarError(termsCheckbox.closest('.terms-checkbox'), 'Debes aceptar los términos y condiciones.');
            esValido = false;
        }

        return esValido;
    }

    // --- FUNCIÓN PARA EL ENVÍO DE DATOS A LA API ---
    async function enviarRegistroAPI() {
        // Recoger todos los datos del formulario
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/usuarios/registro', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const responseData = await response.json();

            if (response.ok) {
                alert('✅ ¡Registro exitoso! Ahora puedes iniciar sesión.');
                // Redirigir al login después del registro
                window.location.href = '/login.html'; 
            } else {
                // Manejar errores de validación del Backend (ej: Email ya registrado)
                alert('❌ Error de registro: ' + (responseData.message || 'Verifica tus datos.'));
            }
        } catch (error) {
            console.error('Error de conexión/servidor:', error);
            alert('Hubo un problema al conectar con el servidor. Intenta de nuevo más tarde.');
        }
    }

    // --- FUNCIONES ESPECÍFICAS DE VALIDACIÓN ---

    function validarInputLetras(input) {
        const value = input.value.trim();
        const minLength = 4;
        const maxLength = 64;
        const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\._]{4,64}$/; 

        if (value.length < minLength || value.length > maxLength) {
            mostrarError(input, `Debe tener entre ${minLength} y ${maxLength} caracteres.`);
            return false;
        }
        
        if (!regex.test(value)) {
            mostrarError(input, 'Solo se permiten letras, espacios, puntos (.) y guiones bajos (_).');
            return false;
        }
        
        return true;
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

    function validarInputNumeros(input) {
        const value = input.value.trim().replace(/\D/g, ''); 
        const minDigits = 8; 
        const maxDigits = 10;
        
        if (!input.required && value === '') {
            return true;
        }
        
        const regex = /^\d{8,10}$/; 

        if (value.length < minDigits || value.length > maxDigits) {
             mostrarError(input, `Debe tener entre ${minDigits} y ${maxDigits} dígitos (solo números).`);
            return false;
        }
        
        if (!regex.test(value)) {
            mostrarError(input, `Solo se permiten números.`);
            return false;
        }
        
        return true;
    }

    function validarInputPassword(input) {
        const value = input.value;
        const minLength = 8;
        const maxLength = 64;
        
        // Requiere: Al menos 8 caracteres, una mayúscula, un número.
        const regex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,64}$/;

        if (value.length < minLength || value.length > maxLength) {
            mostrarError(input, `La contraseña debe tener entre ${minLength} y ${maxLength} caracteres.`);
            return false;
        }

        if (!regex.test(value)) {
            mostrarError(input, 'Debe contener al menos una mayúscula y un número.');
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
        const birthday = new Date(input.value);
        const today = new Date();
        const minAge = 18;
        
        let age = today.getFullYear() - birthday.getFullYear();
        const monthDifference = today.getMonth() - birthday.getMonth();
        
        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthday.getDate())) {
            age--;
        }

        if (age < minAge) {
            mostrarError(input, `Debes ser mayor de ${minAge} años para registrarte.`);
            return false;
        }
        return true;
    }

    function validarCodigoPostal(input) {
        const value = input.value.trim();
        // Regex simple para 5 dígitos
        const regex = /^\d{5}$/; 

        if (!input.required && value === '') {
            return true;
        }

        if (!regex.test(value)) {
            mostrarError(input, 'Introduce un código postal válido (5 dígitos).');
            return false;
        }
        return true;
    }
    
    // --- FUNCIÓN DE UTILIDAD PARA MOSTRAR ERRORES EN EL DOM ---
    function mostrarError(inputElement, mensaje) {
        inputElement.classList.add('input-validation-error');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = mensaje;

        const formGroup = inputElement.closest('.form-group') || inputElement.closest('.terms-checkbox');
        
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) {
            existingError.textContent = mensaje;
        } else if (formGroup) {
            formGroup.appendChild(errorDiv);
        }
    }
});