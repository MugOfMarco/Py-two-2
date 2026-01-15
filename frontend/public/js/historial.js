document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('userToken'); // 🔐

    const container = document.getElementById('historial-lista');

    if (!userId || !token) {
        window.location.href = '/login';
        return;
    }

    try {
        // Pedir pedidos con Token
        const response = await fetch(`/api/pedidos/usuario/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token // 🔐
            }
        });
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            container.innerHTML = result.data.map(pedido => `
                <div class="pedido-card">
                    <div class="pedido-header">
                        <span class="pedido-id">Pedido #${pedido.id_pedido}</span>
                        <span class="pedido-fecha">${new Date(pedido.fecha_pedido).toLocaleDateString()}</span>
                    </div>
                    <div class="pedido-detalle">
                        <p>Total Pagado: <strong>$${parseFloat(pedido.total).toFixed(2)}</strong></p>
                        <p>Método: ${pedido.metodo_pago}</p>
                        <p>Estado: <span class="badge-exito">${pedido.estado_pago}</span></p>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p style="text-align:center;">Aún no has realizado ninguna compra.</p>';
        }
    } catch (error) {
        console.error(error);
        container.innerHTML = '<p style="text-align:center;">Error al cargar el historial. Intenta iniciar sesión de nuevo.</p>';
    }
});