document.addEventListener('DOMContentLoaded', async () => {
    // 1. Validar Sesión y Token
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('userToken'); // 🔐

    if (!userId || !token) {
        alert("Sesión no válida.");
        window.location.href = '/login';
        return;
    }

    // 2. Elementos DOM
    const listaResumen = document.getElementById('lista-resumen');
    const totalDisplay = document.getElementById('monto-total');
    const paymentForm = document.getElementById('paymentForm');

    let itemsCarrito = [];

    // 3. Cargar Resumen con Token
    try {
        const response = await fetch(`/api/carrito/usuario/${userId}`, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': token // 🔐
            }
        });
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            itemsCarrito = result.data;
            renderResumen(result.data, listaResumen, totalDisplay);
        } else {
            listaResumen.innerHTML = '<p>Tu carrito está vacío.</p>';
        }
    } catch (error) {
        console.error("Error cargando carrito:", error);
    }

    // 4. Pagar con Token
    if (paymentForm) {
        paymentForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const metodoInput = document.querySelector('input[name="metodo"]:checked');
            const metodo = metodoInput ? metodoInput.value : 'tarjeta';

            try {
                const res = await fetch('/api/pedidos/crear', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': token // 🔐 Enviamos Token al pagar
                    },
                    body: JSON.stringify({ 
                        id_usuario: userId,
                        metodo_pago: metodo
                    })
                });

                const data = await res.json();

                if (data.success) {
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

function renderResumen(items, container, totalElement) {
    let subtotal = 0;
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
    if (totalElement) totalElement.textContent = `$${totalConIva.toFixed(2)}`;
}

function mostrarTicket(idPedido, items) {
    document.getElementById('seccion-formulario').style.display = 'none';
    const ticketDiv = document.getElementById('seccion-ticket');
    ticketDiv.style.display = 'block';

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