document.addEventListener('DOMContentLoaded', () => {
    console.log('--- 💳 JS: Pago cargado y listo ---');

    const formPago = document.getElementById('payment-form'); // Asegúrate que tu <form> tenga id="payment-form"
    
    // --- 1. BLOQUEO EN TIEMPO REAL (UX) ---
    // Esto impide que el usuario escriba letras en campos numéricos mientras teclea.
    
    const inputTarjeta = document.getElementById('card-number');
    const inputCvv = document.getElementById('cvv');
    const inputFecha = document.getElementById('expiry-date');

    if (inputTarjeta) {
        inputTarjeta.addEventListener('input', (e) => {
            // Reemplaza todo lo que NO sea número con vacío
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 16); // Máximo 16 dígitos
        });
    }

    if (inputCvv) {
        inputCvv.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 3); // Máximo 3 dígitos (4 para Amex)
        });
    }

    if (inputFecha) {
        inputFecha.addEventListener('input', (e) => {
            // Permite números y la barra diagonal '/'
            let val = e.target.value.replace(/[^0-9/]/g, '');
            // Pequeño truco: si escriben 2 números, agregar la barra automático (opcional, pero pulido)
            if (val.length === 2 && !val.includes('/')) {
                val += '/';
            }
            e.target.value = val.slice(0, 5); // MM/YY son 5 caracteres
        });
    }

    // --- 2. VALIDACIÓN AL ENVIAR (Lógica Fuerte) ---

    if (formPago) {
        formPago.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('--- 🛑 Interceptando pago para validación ---');

            // Limpiar errores previos
            limpiarErrores();

            // Ejecutar validaciones
            if (!validarTodo()) {
                console.log('❌ Validación falló.');
                return;
            }

            console.log('✅ Validación exitosa. Procesando cobro...');
            await procesarPagoBackend();
        });
    }

    // --- FUNCIONES DE VALIDACIÓN ---

    function validarTodo() {
        let esValido = true;

        // A. Validar Número de Tarjeta
        const tarjeta = document.getElementById('card-number');
        if (tarjeta.value.length < 16) {
            mostrarError(tarjeta, 'El número de tarjeta debe tener 16 dígitos.');
            esValido = false;
        }

        // B. Validar CVV
        const cvv = document.getElementById('cvv');
        if (cvv.value.length < 3) {
            mostrarError(cvv, 'CVV inválido (3 dígitos).');
            esValido = false;
        }

        // C. Validar Fecha de Vencimiento (LA JOYA DE LA CORONA 👑)
        const fecha = document.getElementById('expiry-date');
        if (!validarFechaVencimiento(fecha.value)) {
            mostrarError(fecha, 'Tarjeta vencida o fecha inválida.');
            esValido = false;
        }

        // D. Validar Nombre (Que no esté vacío)
        const nombre = document.getElementById('card-name');
        if (nombre.value.trim().length < 3) {
            mostrarError(nombre, 'Ingresa el nombre tal cual aparece en la tarjeta.');
            esValido = false;
        }

        return esValido;
    }

    /**
     * Valida que la fecha MM/YY sea posterior al mes actual.
     */
    function validarFechaVencimiento(fechaString) {
        // 1. Formato básico MM/YY
        if (!/^\d{2}\/\d{2}$/.test(fechaString)) return false;

        const partes = fechaString.split('/');
        const mesInput = parseInt(partes[0], 10);
        const anioInput = parseInt(partes[1], 10);

        // 2. Validar mes lógico (1-12)
        if (mesInput < 1 || mesInput > 12) return false;

        // 3. Obtener fecha actual
        const ahora = new Date();
        const anioActual = ahroa.getFullYear() % 100; // Obtiene los últimos 2 dígitos (ej: 25 para 2025)
        const mesActual = ahora.getMonth() + 1; // Enero es 0, sumamos 1

        // 4. Comparación Lógica
        // Si el año de la tarjeta es MENOR al actual -> Vencida
        if (anioInput < anioActual) return false;

        // Si el año es IGUAL, pero el mes es MENOR al actual -> Vencida
        if (anioInput === anioActual && mesInput < mesActual) return false;

        return true; // Tarjeta válida
    }

    // --- CONEXIÓN CON BACKEND ---

    async function procesarPagoBackend() {
        const token = localStorage.getItem('userToken');
        const userId = localStorage.getItem('userId');

        if (!token || !userId) {
            alert("Sesión expirada. Por favor inicia sesión.");
            window.location.href = '/login';
            return;
        }

        // Simulación de datos de tarjeta (NUNCA guardes esto real en BD sin encriptar, 
        // aquí lo enviamos para que el backend simule el proceso)
        const datosPago = {
            id_usuario: userId,
            metodo_pago: 'tarjeta',
            detalles: {
                ultimos_digitos: document.getElementById('card-number').value.slice(-4)
            }
        };

        try {
            // Asegúrate que esta ruta exista en tu pedidoroutes.js
            const response = await fetch('/api/pedidos/crear', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify(datosPago)
            });

            const data = await response.json();

            if (data.success) {
                alert('✅ ¡Pago procesado con éxito! Gracias por tu compra.');
                // Limpiar carrito visualmente o redirigir
                window.location.href = '/historial'; 
            } else {
                alert('❌ Error en el pago: ' + (data.message || 'Intente nuevamente.'));
            }

        } catch (error) {
            console.error('Error de red:', error);
            alert('Error de conexión al procesar el pago.');
        }
    }

    // --- UTILIDADES UI ---
    function mostrarError(input, mensaje) {
        input.style.borderColor = '#ff4d4d'; // Borde rojo
        input.style.backgroundColor = '#fff0f0';
        
        // Crear mensajito abajo
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-text';
        errorDiv.style.color = 'red';
        errorDiv.style.fontSize = '0.8rem';
        errorDiv.style.marginTop = '4px';
        errorDiv.innerText = mensaje;
        
        // Insertar si no existe ya
        if (!input.nextElementSibling || !input.nextElementSibling.classList.contains('error-text')) {
            input.parentNode.insertBefore(errorDiv, input.nextSibling);
        }
    }

    function limpiarErrores() {
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.style.borderColor = '#ddd'; // O tu color original
            input.style.backgroundColor = 'white';
        });
        document.querySelectorAll('.error-text').forEach(el => el.remove());
    }
});