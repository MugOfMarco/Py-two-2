document.addEventListener('DOMContentLoaded', () => {
    console.log('--- 🚀 JS: DOMContentLoaded iniciado ---');
    const form = document.getElementById('registerForm');
    const apiMessageDiv = document.getElementById('mensaje-api'); 

    if (form) {
        console.log('✅ JS: Formulario de Registro encontrado.');
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            console.log('--- ⚙️ Evento Submit interceptado ---');

            // Limpiar mensaje previo de la API
            if (apiMessageDiv) {
                apiMessageDiv.textContent = '';
            }

            // 1. Ejecutar la validación del lado del cliente
            if (!validarFormulario()) {
                console.log('❌ JS: La validación del formulario falló.');
                const primerError = document.querySelector('.input-validation-error');
                if (primerError) {
                    primerError.focus();
                }
                return;
            }

            // 2. Si la validación es exitosa, se procede con el envío de datos a la API
            console.log('✅ JS: Validación de Frontend exitosa. Preparando envío a API...');
            enviarRegistroAPI();
        });
    } else {
        console.log('⚠️ JS: No se encontró el formulario registerForm.');
    }

    // --- FUNCIÓN PRINCIPAL DE VALIDACIÓN ---
    function validarFormulario() {
        console.log('--- 🛠️ Iniciando validación de campos ---');
        let esValido = true;

        // Limpiamos los estados de error previos
        document.querySelectorAll('.input-validation-error').forEach(el => {
            el.classList.remove('input-validation-error');
        });
        document.querySelectorAll('.error-message').forEach(el => el.remove());

        // 1. Campos de Solo Letras (Nombre y Apellido)
        document.querySelectorAll('.input-letras').forEach(input => {
            if (!validarInputLetras(input)) {
                console.log(`❌ Validación Fallida: ${input.id}`);
                esValido = false;
            }
        });

        // 2. Campo de Correo Electrónico
        document.querySelectorAll('.input-correo').forEach(input => {
            if (!validarInputCorreo(input)) {
                 console.log(`❌ Validación Fallida: ${input.id}`);
                esValido = false;
            }
        });

        // 3. Campo de Teléfono (Solo Números)
        document.querySelectorAll('.input-numeros').forEach(input => {
            if (!validarInputNumeros(input)) {
                 console.log(`❌ Validación Fallida: ${input.id}`);
                esValido = false;
            }
        });

        // 4. Campo de Contraseña
        document.querySelectorAll('.input-password').forEach(input => {
            if (!validarInputPassword(input)) {
                 console.log(`❌ Validación Fallida: ${input.id}`);
                esValido = false;
            }
        });

        // 5. Confirmación de Contraseña
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirm_password');
        if (password && confirmPassword) {
            if (!validarConfirmacionPassword(password, confirmPassword)) {
                 console.log(`❌ Validación Fallida: ${confirmPassword.id}`);
                esValido = false;
            }
        }
        
        // 6. Campo Fecha de Nacimiento (Validación de Edad)
        const fechaNacimiento = document.getElementById('fecha_nacimiento');
        if (fechaNacimiento) {
             if (!validarEdad(fechaNacimiento)) {
                 console.log(`❌ Validación Fallida: ${fechaNacimiento.id}`);
                 esValido = false;
             }
        }

        // 7. Campo Código Postal
        const codigoPostal = document.getElementById('codigo_postal');
        if (codigoPostal) {
            if (!validarCodigoPostal(codigoPostal)) {
                 console.log(`❌ Validación Fallida: ${codigoPostal.id}`);
                esValido = false;
            }
        }
        
        // 8. Validación de la casilla de Términos 
        const termsCheckbox = document.getElementById('terms');
        if (termsCheckbox && !termsCheckbox.checked) {
            console.log('❌ Validación Fallida: Términos no aceptados');
            mostrarError(termsCheckbox.closest('.terms-checkbox'), 'Debes aceptar los términos y condiciones.');
            esValido = false;
        }
        
        console.log(`--- 🏁 Validación finalizada. Resultado: ${esValido ? 'OK' : 'FALLO'} ---`);
        return esValido;
    }

    // --- FUNCIÓN PARA EL ENVÍO DE DATOS A LA API ---
    async function enviarRegistroAPI() {
        const formData = new FormData(form); 
        const data = Object.fromEntries(formData.entries());
        console.log('⚙️ Datos de formulario a enviar:', data);

        try {
        // ✅ Cambiamos /usuarios/ por /users/ para que coincida con tu Backend
        const response = await fetch('/api/users/registro', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

            console.log(`📡 Respuesta recibida. Status: ${response.status}`);
            const responseData = await response.json();
            console.log('📦 Respuesta JSON:', responseData);

            if (response.ok) {
                console.log('✅ API: Registro exitoso.');
                alert('✅ ¡Registro exitoso! Ahora puedes iniciar sesión.');
                // Redirigir al login después del registro
                window.location.href = '/login'; 
            } else {
                
                let errorMessage = responseData.message || 'Error desconocido al registrar.';
                console.log('❌ API: Error de Backend/Validación.');

                if (apiMessageDiv) {
                    apiMessageDiv.textContent = '❌ ' + errorMessage;
                    apiMessageDiv.style.color = 'red';
                } else {
                    alert('❌ Error de registro: ' + errorMessage);
                }
            }
        } catch (error) {
            console.error('❌ Error de conexión/servidor (CATCH):', error);
            alert('⚠️ No se pudo conectar con el servidor. Verifica que el Backend esté corriendo.');
        }
    }

    // --- FUNCIONES ESPECÍFICAS DE VALIDACIÓN (MISMO CÓDIGO) ---
    function validarInputLetras(input) {
        // ... (Tu código aquí) ...
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
        // ... (Tu código aquí) ...
        const value = input.value.trim();
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 

        if (!regex.test(value)) {
            mostrarError(input, 'Por favor, introduce un correo electrónico válido.');
            return false;
        }
        return true;
    }

    function validarInputNumeros(input) {
        // ... (Tu código aquí) ...
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
        // ... (Tu código aquí) ...
        const value = input.value;
        const minLength = 8;
        const maxLength = 64;
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
        // ... (Tu código aquí) ...
        if (passwordInput.value !== confirmInput.value) {
            mostrarError(confirmInput, 'Las contraseñas no coinciden.');
            return false;
        }
        return true;
    }

    function validarEdad(input) {
        // ... (Tu código aquí) ...
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
        // ... (Tu código aquí) ...
        const value = input.value.trim();
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
        // ... (Tu código aquí) ...
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
}); // Fin de DOMContentLoaded