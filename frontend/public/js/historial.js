document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('userId');
    const container = document.getElementById('historial-lista');

    if (!userId) {
        window.location.href = '/login';
        return;
    }

    try {
        // 1. Pedir los pedidos al servidor
        const response = await fetch(`/api/pedidos/usuario/${userId}`);
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            container.innerHTML = result.data.map(pedido => `
                <div class="pedido-card">
                    <div class="pedido-header">
                        <span><strong>Pedido #${pedido.id_pedido}</strong></span>
                        <span>${new Date(pedido.fecha_pedido).toLocaleDateString()}</span>
                    </div>
                    <div class="pedido-detalle">
                        <p>Total: <strong>$${pedido.total}</strong></p>
                        <p>Método de Pago: ${pedido.metodo_pago}</p>
                        <p>Estado: <span class="badge-exito">${pedido.estado_pago}</span></p>
                    </div>
                    <button onclick="verDetalle(${pedido.id_pedido})" class="btn-sm">Ver Productos</button>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p>Aún no has realizado ninguna compra.</p>';
        }
    } catch (error) {
        container.innerHTML = '<p>Error al cargar el historial.</p>';
    }
});