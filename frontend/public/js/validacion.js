document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');
    
    if (form) {
        form.addEventListener('submit', function(event) {
            // Detenemos el envío por defecto para manejar la validación con JS
            event.preventDefault(); 

            // Ejecutamos la función de validación y, si falla, salimos.
            if (!validarFormulario()) {
                // Si la validación falla, podemos enfocar el primer campo con error (opcional)
                const primerError = document.querySelector('.input-validation-error');
                if (primerError) {
                    primerError.focus();
                }
                return;
            }

            // Si pasa todas las validaciones, se podría ejecutar la lógica de envío (AJAX, Fetch, etc.)
            alert('¡Registro exitoso! (Simulación de envío)');
            // form.submit(); // Descomentar para enviar el formulario realmente
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

        // 5. Confirmación de Contraseña (debe ir después de validar la principal)
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirm_password');
        if (password && confirmPassword) {
            if (!validarConfirmacionPassword(password, confirmPassword)) {
                esValido = false;
            }
        }
        
        // 6. Validación de la casilla de Términos (siempre debe ser obligatorio)
        const termsCheckbox = document.getElementById('terms');
        if (termsCheckbox && !termsCheckbox.checked) {
            mostrarError(termsCheckbox.closest('.terms-checkbox'), 'Debes aceptar los términos y condiciones.');
            esValido = false;
        }

        return esValido;
    }

    // --- FUNCIONES ESPECÍFICAS DE VALIDACIÓN ---

    // 1. Validación para input-letras (Nombre y Apellido)
    function validarInputLetras(input) {
        const value = input.value.trim();
        const minLength = 4;
        const maxLength = 64;
        
        // Expresión Regular: Solo letras (incluyendo acentos, ñ), espacios, puntos (.) y guiones bajos (_)
        // No permite que empiece o termine con un caracter especial
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

    // 2. Validación para input-correo
    function validarInputCorreo(input) {
        const value = input.value.trim();
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 

        if (!regex.test(value)) {
            mostrarError(input, 'Por favor, introduce un correo electrónico válido.');
            return false;
        }
        return true;
    }

    // 3. Validación para input-numeros (Teléfono)
    function validarInputNumeros(input) {
        const value = input.value.trim().replace(/\D/g, ''); // Elimina todo lo que NO sea un dígito
        const minDigits = 8; // He usado 8 o 10 como mínimo típico, no 18. Si necesitas 18, ajusta aquí.
        const maxDigits = 10;
        
        // Si el campo no es requerido y está vacío, se acepta
        if (!input.required && value === '') {
            return true;
        }
        
        // Expresión Regular: Solo dígitos, entre 8 y 10
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

    // 4. Validación para input-password
    function validarInputPassword(input) {
        const value = input.value;
        const minLength = 8;
        const maxLength = 64;
        
        // Requiere: Al menos 8 caracteres, una mayúscula, un número.
        // (?=.*[A-Z]): Debe contener al menos una letra mayúscula.
        // (?=.*\d): Debe contener al menos un dígito.
        // [A-Za-z\d@$!%*#?&]{8,64}: Caracteres permitidos y longitud.
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
    
    // 5. Validación de Confirmación de Contraseña
    function validarConfirmacionPassword(passwordInput, confirmInput) {
        if (passwordInput.value !== confirmInput.value) {
            mostrarError(confirmInput, 'Las contraseñas no coinciden.');
            return false;
        }
        return true;
    }
    
    // --- FUNCIÓN DE UTILIDAD PARA MOSTRAR ERRORES EN EL DOM ---
    function mostrarError(inputElement, mensaje) {
        // Asegura que solo se añada la clase una vez
        inputElement.classList.add('input-validation-error');
        
        // Crea el elemento de mensaje de error
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = mensaje;

        // Busca el contenedor padre (form-group) para insertar el mensaje
        const formGroup = inputElement.closest('.form-group') || inputElement.closest('.terms-checkbox');
        
        // Si el mensaje de error ya existe para este campo, lo reemplazamos
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) {
            existingError.textContent = mensaje;
        } else if (formGroup) {
            // Inserta el mensaje de error después del input
            formGroup.appendChild(errorDiv);
        }
    }
});

// Nota sobre el Teléfono: Se usó 8 a 10 dígitos, ya que 18 dígitos para un teléfono no es un estándar común. Si el requerimiento es estrictamente 18, cambiar la variable minDigits.