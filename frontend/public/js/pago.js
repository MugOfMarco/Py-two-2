document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar sesión
    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert("Debes iniciar sesión para realizar un pago.");
        window.location.href = '/login';
        return;
    }

    // 2. Obtener elementos del DOM (Asegúrate de que existan en tu HTML)
    const listaResumen = document.getElementById('lista-resumen');
    const totalDisplay = document.getElementById('monto-total');
    const paymentForm = document.getElementById('paymentForm');

    // 3. Cargar datos del carrito para el resumen
    try {
        const response = await fetch(`/api/carrito/usuario/${userId}`);
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            // Llamamos a la función que dibuja el HTML (que antes faltaba)
            renderResumen(result.data, listaResumen, totalDisplay);
        } else {
            listaResumen.innerHTML = '<p>No hay productos para pagar.</p>';
            totalDisplay.textContent = '$0.00';
        }
    } catch (error) {
        console.error("Error al cargar resumen:", error);
    }

    // 4. Manejar el clic en "Confirmar y Pagar"
    if (paymentForm) {
        paymentForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Evita que la página se recargue sola
            await procesarPago(userId);
        });
    }
});

/**
 * Función que dibuja la lista de productos y calcula el total final
 */
function renderResumen(items, container, totalElement) {
    let subtotal = 0;
    
    // Generar el HTML de cada producto
    const htmlItems = items.map(item => {
        const precioNum = parseFloat(item.precio_unitario);
        const totalItem = precioNum * item.cantidad;
        subtotal += totalItem;

        return `
            <div class="resumen-item" style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>${item.nombre} (x${item.cantidad})</span>
                <span>$${totalItem.toFixed(2)}</span>
            </div>
        `;
    }).join('');

    // Calcular IVA (16%)
    const totalConIva = subtotal * 1.16;

    // Insertar en la página
    container.innerHTML = htmlItems;
    totalElement.textContent = `$${totalConIva.toFixed(2)}`;
}

/**
 * Función que envía la orden de compra al servidor
 */
async function procesarPago(userId) {
    // Obtener el método de pago seleccionado
    const metodoInput = document.querySelector('input[name="metodo"]:checked');
    const metodo = metodoInput ? metodoInput.value : 'tarjeta';

    try {
        const response = await fetch('/api/pedidos/crear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id_usuario: userId,
                metodo_pago: metodo
            })
        });

        const data = await response.json();

        if (data.success) {
            alert("✅ ¡Pago exitoso! Tu pedido ha sido registrado.");
            // Redirigir al historial para ver la compra guardada
            window.location.href = '/historial'; 
        } else {
            alert("❌ Error: " + data.message);
        }

    } catch (error) {
        console.error("Error al procesar pago:", error);
        alert("Hubo un error de conexión al intentar pagar.");
    }
}