document.addEventListener('DOMContentLoaded', () => {
    console.log('--- 🚀 JS: DOMContentLoaded iniciado (Perfil) ---');
    const form = document.getElementById('profileForm');
    const apiMessageDiv = document.getElementById('mensaje-api');

    if (form) {
        console.log('✅ JS: Formulario de Perfil encontrado.');
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            console.log('--- ⚙️ Evento Submit interceptado ---');

            // Limpiar mensaje previo de la API
            if (apiMessageDiv) {
                apiMessageDiv.textContent = '';
                apiMessageDiv.className = '';
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
            enviarActualizacionAPI();
        });
    } else {
        console.log('⚠️ JS: No se encontró el formulario profileForm.');
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

        // 1. Campo de Correo Electrónico (siempre se valida)
        const emailInput = document.getElementById('email');
        if (emailInput && !validarInputCorreo(emailInput)) {
            console.log(`❌ Validación Fallida: ${emailInput.id}`);
            esValido = false;
        }

        // 2. Campo de Teléfono
        const telefonoInput = document.getElementById('telefono');
        if (telefonoInput && telefonoInput.value.trim() !== '') {
            if (!validarInputNumeros(telefonoInput)) {
                console.log(`❌ Validación Fallida: ${telefonoInput.id}`);
                esValido = false;
            }
        }

        // 3. Campo Código Postal
        const codigoPostalInput = document.getElementById('codigo_postal');
        if (codigoPostalInput && codigoPostalInput.value.trim() !== '') {
            if (!validarCodigoPostal(codigoPostalInput)) {
                console.log(`❌ Validación Fallida: ${codigoPostalInput.id}`);
                esValido = false;
            }
        }

        // 4. Validación de Contraseñas (solo si se están cambiando)
        const passwordActual = document.getElementById('password_actual');
        const passwordNueva = document.getElementById('password_nueva');
        const confirmPassword = document.getElementById('confirm_password');

        const hayCambioPassword = passwordActual.value || passwordNueva.value || confirmPassword.value;

        if (hayCambioPassword) {
            // Si hay algún campo de contraseña lleno, todos deben estarlo
            if (!passwordActual.value) {
                mostrarError(passwordActual, 'Debes ingresar tu contraseña actual.');
                esValido = false;
            }
            
            if (!passwordNueva.value) {
                mostrarError(passwordNueva, 'Debes ingresar una nueva contraseña.');
                esValido = false;
            } else {
                // Validar formato de nueva contraseña
                if (!validarInputPassword(passwordNueva)) {
                    console.log(`❌ Validación Fallida: ${passwordNueva.id}`);
                    esValido = false;
                }
            }

            if (!confirmPassword.value) {
                mostrarError(confirmPassword, 'Debes confirmar tu nueva contraseña.');
                esValido = false;
            } else if (passwordNueva.value && confirmPassword.value) {
                // Validar que coincidan
                if (!validarConfirmacionPassword(passwordNueva, confirmPassword)) {
                    console.log(`❌ Validación Fallida: ${confirmPassword.id}`);
                    esValido = false;
                }
            }
        }

        console.log(`--- 🏁 Validación finalizada. Resultado: ${esValido ? 'OK' : 'FALLO'} ---`);
        return esValido;
    }

    // --- FUNCIÓN PARA EL ENVÍO DE DATOS A LA API ---
    async function enviarActualizacionAPI() {
        const formData = new FormData(form);
        const data = {};

        // Solo enviamos los campos editables y no vacíos
        const camposEditables = ['email', 'telefono', 'codigo_postal', 'password_actual', 'password_nueva', 'confirm_password'];
        
        camposEditables.forEach(campo => {
            const valor = formData.get(campo);
            if (valor && valor.trim() !== '') {
                data[campo] = valor;
            }
        });

        console.log('⚙️ Datos de formulario a enviar:', data);

        try {
            const response = await fetch('/api/usuarios/perfil', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            console.log(`📡 Respuesta recibida. Status: ${response.status}`);
            const responseData = await response.json();
            console.log('📦 Respuesta JSON:', responseData);

            if (response.ok) {
                console.log('✅ API: Actualización exitosa.');
                
                if (apiMessageDiv) {
                    apiMessageDiv.textContent = '✅ ' + (responseData.message || '¡Perfil actualizado exitosamente!');
                    apiMessageDiv.className = 'success';
                }

                // Limpiar campos de contraseña después de actualización exitosa
                document.getElementById('password_actual').value = '';
                document.getElementById('password_nueva').value = '';
                document.getElementById('confirm_password').value = '';

                // Opcional: Recargar la página después de 2 segundos
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                let errorMessage = responseData.message || 'Error desconocido al actualizar.';
                console.log('❌ API: Error de Backend/Validación.');

                if (apiMessageDiv) {
                    apiMessageDiv.textContent = '❌ ' + errorMessage;
                    apiMessageDiv.className = 'error';
                }
            }
        } catch (error) {
            console.error('❌ Error de conexión/servidor (CATCH):', error);
            
            if (apiMessageDiv) {
                apiMessageDiv.textContent = '⚠️ No se pudo conectar con el servidor. Intenta nuevamente.';
                apiMessageDiv.className = 'error';
            }
        }
    }

    // --- FUNCIONES ESPECÍFICAS DE VALIDACIÓN ---
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

    function validarCodigoPostal(input) {
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
}); // Fin de DOMContentLoaded