document.addEventListener('DOMContentLoaded', async () => {
    // 1. Validar sesión
    const userId = localStorage.getItem('userId');
    if (!userId) {
        window.location.href = '/login';
        return;
    }

    // 2. Elementos de tu HTML
    const listaResumen = document.getElementById('lista-resumen');
    const totalDisplay = document.getElementById('monto-total'); // Tu <strong> del total
    const paymentForm = document.getElementById('paymentForm');

    // Variable para guardar los productos y usarlos en el ticket
    let itemsCarrito = [];

    // 3. Cargar el resumen (GET)
    try {
        const response = await fetch(`/api/carrito/usuario/${userId}`);
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            itemsCarrito = result.data; // Guardar para el ticket
            renderResumen(result.data, listaResumen, totalDisplay);
        } else {
            listaResumen.innerHTML = '<p>Tu carrito está vacío.</p>';
        }
    } catch (error) {
        console.error("Error cargando carrito:", error);
    }

    // 4. Manejar el Pago (POST)
    if (paymentForm) {
        paymentForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Evita recargar la página

            // Obtener método de pago seleccionado
            const metodoInput = document.querySelector('input[name="metodo"]:checked');
            const metodo = metodoInput ? metodoInput.value : 'tarjeta';

            try {
                const res = await fetch('/api/pedidos/crear', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        id_usuario: userId,
                        metodo_pago: metodo
                    })
                });

                const data = await res.json();

                if (data.success) {
                    // MAGIA: Ocultamos tu formulario y mostramos el ticket
                    mostrarTicket(data.id_pedido, itemsCarrito);
                } else {
                    alert("Error en el pago: " + data.message);
                }

            } catch (error) {
                alert("Error de conexión al procesar el pago.");
            }
        });
    }
});

// Función para pintar el resumen inicial (Lado izquierdo de tu pantalla)
function renderResumen(items, container, totalElement) {
    let subtotal = 0;
    
    // Generar HTML simple para tu lista
    const html = items.map(item => {
        const total = item.cantidad * parseFloat(item.precio_unitario);
        subtotal += total;
        return `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>${item.nombre} <small>x${item.cantidad}</small></span>
                <span>$${total.toFixed(2)}</span>
            </div>
        `;
    }).join('');

    const totalConIva = subtotal * 1.16;

    container.innerHTML = html;
    // Actualizar el strong id="monto-total"
    if (totalElement) totalElement.textContent = `$${totalConIva.toFixed(2)}`;
}

// Función para ocultar formulario y mostrar Ticket
function mostrarTicket(idPedido, items) {
    // 1. Ocultar el grid original (usando el ID que añadimos)
    document.getElementById('seccion-formulario').style.display = 'none';

    // 2. Mostrar el ticket
    const ticketDiv = document.getElementById('seccion-ticket');
    ticketDiv.style.display = 'block';

    // 3. Llenar datos
    document.getElementById('ticket-fecha').textContent = new Date().toLocaleString();
    document.getElementById('ticket-orden').textContent = `Orden #${idPedido}`;

    let totalCalculado = 0;
    const itemsHtml = items.map(item => {
        const t = item.cantidad * parseFloat(item.precio_unitario);
        totalCalculado += t;
        return `
            <div style="display: flex; justify-content: space-between; font-size: 0.9em; margin-bottom: 5px;">
                <span>${item.nombre} (${item.cantidad})</span>
                <span>$${t.toFixed(2)}</span>
            </div>
        `;
    }).join('');

    document.getElementById('ticket-items').innerHTML = itemsHtml;
    document.getElementById('ticket-total').textContent = `$${(totalCalculado * 1.16).toFixed(2)}`;
}