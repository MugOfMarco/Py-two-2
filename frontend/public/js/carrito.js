/**
 * /frontend/public/js/carrito.js
 * Lógica integrada con el sistema de autenticación y pedidos.
 */

// --- 1. Variables Dinámicas ---
const API_BASE_URL = '/api/carrito'; 
const IVA_RATE = 0.16; 

// ✅ CORRECCIÓN: Obtener el ID real del usuario desde el navegador
const getUserId = () => localStorage.getItem('userId');
const getToken = () => localStorage.getItem('userToken');

// --- 2. Renderizado del Carrito ---

function renderCart(items, totalItems) {
    const cartItemsContainer = document.querySelector('.cart-items-list'); 
    const emptyCartElement = document.querySelector('.empty-cart');
    const cartHeader = document.querySelector('.cart-header');
    
    const itemsCountElement = document.getElementById('items-count');
    const subtotalElement = document.getElementById('subtotal');
    const ivaElement = document.getElementById('iva');
    const totalAmountElement = document.getElementById('total-amount');

    if (!cartItemsContainer || !emptyCartElement) return;

    if (items.length === 0) {
        emptyCartElement.style.display = 'block';
        if (cartHeader) cartHeader.style.display = 'none';
        cartItemsContainer.innerHTML = '';
        if (subtotalElement) {
            itemsCountElement.textContent = 0;
            subtotalElement.textContent = '$0.00';
            ivaElement.textContent = '$0.00';
            totalAmountElement.textContent = '$0.00';
        }
        return;
    }

    emptyCartElement.style.display = 'none';
    if (cartHeader) cartHeader.style.display = 'flex';
    cartItemsContainer.innerHTML = ''; 

    let subTotal = 0;

    items.forEach(item => {
        const unitPrice = parseFloat(item.precio_unitario); 
        const itemTotal = item.cantidad * unitPrice; 
        subTotal += itemTotal; 

        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.setAttribute('data-product-id', item.id_producto); 
        
        itemElement.innerHTML = `
            <div class="item-details">
                <div class="info">
                    <h4 class="product-name">${item.nombre}</h4>
                    <p class="unit-price">Precio: <span class="price">$${unitPrice.toFixed(2)}</span></p>
                </div>
            </div>
            <div class="item-controls">
                <div class="quantity-input">
                    <button onclick="changeQuantity(${item.id_producto}, -1)">-</button>
                    <input type="number" value="${item.cantidad}" readonly style="width: 40px; text-align: center;">
                    <button onclick="changeQuantity(${item.id_producto}, 1)">+</button>
                </div>
                <div class="item-total">$${itemTotal.toFixed(2)}</div>
                <button class="remove-item-btn" onclick="removeItem(${item.id_producto})">Eliminar</button>
            </div>
        `;
        cartItemsContainer.appendChild(itemElement);
    });

    const ivaAmount = subTotal * IVA_RATE;
    const grandTotal = subTotal + ivaAmount;

    if (itemsCountElement) itemsCountElement.textContent = totalItems;
    if (subtotalElement) subtotalElement.textContent = `$${subTotal.toFixed(2)}`;
    if (ivaElement) ivaElement.textContent = `$${ivaAmount.toFixed(2)}`;
    if (totalAmountElement) totalAmountElement.textContent = `$${grandTotal.toFixed(2)}`;
}

// --- 3. Funciones de API ---

async function loadCart() {
    const userId = getUserId();
    if (!userId) {
        window.location.href = '/login';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/usuario/${userId}`);
        const result = await response.json();
        
        if (result.success) {
            renderCart(result.data, result.totalItems);
        } else {
            renderCart([], 0);
        }
    } catch (error) {
        console.error('Error al cargar carrito:', error);
        renderCart([], 0); 
    }
}
window.loadCart = loadCart;

window.changeQuantity = async function(productId, delta) {
    const userId = getUserId();
    const itemElement = document.querySelector(`.cart-item[data-product-id="${productId}"]`);
    const input = itemElement ? itemElement.querySelector('input[type="number"]') : null;
    if (!input) return;

    let currentQuantity = parseInt(input.value);
    let newQuantity = currentQuantity + delta;

    if (newQuantity < 1) {
        if (confirm('¿Desea eliminar este producto del carrito?')) {
            removeItem(productId);
        }
        return; 
    }
    
    // Llamar al endpoint de actualización (POST /api/carrito)
    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userId: USER_ID, 
                productId: productId, 
                quantity: newQuantity 
            }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
            loadCart(); // Recargar el carrito para mostrar los nuevos totales
        } else {
            alert(`Error al actualizar la cantidad: ${result.message}`);
            // Recargar para restaurar la cantidad correcta si hay un error (ej: stock)
            loadCart();
        }
    } catch (error) {
        console.error('Error de conexión al actualizar la cantidad:', error);
        alert('Error de conexión. Inténtalo más tarde.');
    }
}


window.removeItem = async function(productId) {
    if (!confirm('¿Eliminar producto?')) return;
    
    try {
        // Se asume que el backend usa el USER_ID codificado para la sesión
        const response = await fetch(`${API_BASE_URL}/item/${productId}?userId=${USER_ID}`, {
            method: 'DELETE',
        });

        const result = await response.json();
        if (result.success) loadCart();
    } catch (error) {
        console.error('Error de conexión al eliminar el ítem:', error);
        alert('Error de conexión. Inténtalo más tarde.');
    }
}

/**
 * Vacía todo el carrito del usuario.
 */
window.clearCart = async function() {
    if (!confirm('¿Estás seguro de que deseas vaciar todo el carrito? Esta acción es irreversible.')) {
        return;
    }
    window.location.href = '/pago';
}

document.addEventListener('DOMContentLoaded', () => {
    loadCart();
});