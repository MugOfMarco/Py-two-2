// frontend/public/js/pago.js
document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('userId');
    
    // 1. Obtener datos del carrito para mostrar el resumen antes de pagar
    const response = await fetch(`/api/carrito/usuario/${userId}`);
    const result = await response.json();
    
    if (result.success) {
        renderResumen(result.data, result.totalItems);
    }
});

async function procesarPago(event) {
    event.preventDefault();
    const userId = localStorage.getItem('userId');
    const metodo = document.querySelector('input[name="metodo"]:checked').value;

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
            alert("¡Pago exitoso! Gracias por tu compra.");
            window.location.href = '/historial'; // Redirigir al historial
        }
    } catch (error) {
        alert("Hubo un error al procesar el pago.");
    }
}