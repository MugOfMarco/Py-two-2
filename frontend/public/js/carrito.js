/**
 * /frontend/public/js/carrito.js
 * Versión segura con TOKEN.
 */

const API_BASE_URL = '/api/carrito'; 

// Obtenemos ID y Token
const getUserId = () => localStorage.getItem('userId');
const getToken = () => localStorage.getItem('userToken'); // 🔐 CLAVE

// ==========================================
// 1. RENDERIZADO (Igual que antes)
// ==========================================
function renderCart(items, totalItems) {
    const cartItemsContainer = document.querySelector('.cart-items-list'); 
    const emptyCartElement = document.querySelector('.empty-cart');
    const cartHeader = document.querySelector('.cart-header');
    
    const itemsCountElement = document.getElementById('items-count');
    const subtotalElement = document.getElementById('subtotal');
    const ivaElement = document.getElementById('iva');
    const totalAmountElement = document.getElementById('total-amount');

    if (!cartItemsContainer) return;

    if (!items || items.length === 0) {
        if (emptyCartElement) emptyCartElement.style.display = 'block';
        if (cartHeader) cartHeader.style.display = 'none';
        cartItemsContainer.innerHTML = '';
        if (totalAmountElement) {
            itemsCountElement.textContent = 0;
            subtotalElement.textContent = '$0.00';
            ivaElement.textContent = '$0.00';
            totalAmountElement.textContent = '$0.00';
        }
        return;
    }

    if (emptyCartElement) emptyCartElement.style.display = 'none';
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
                    <button type="button" onclick="modificarCantidad(${item.id_producto}, -1)">-</button>
                    <input type="number" value="${item.cantidad}" readonly style="width: 40px; text-align: center;">
                    <button type="button" onclick="modificarCantidad(${item.id_producto}, 1)">+</button>
                </div>
                <div class="item-total">$${itemTotal.toFixed(2)}</div>
                <button class="remove-item-btn" onclick="eliminarProducto(${item.id_producto})">Eliminar</button>
            </div>
        `;
        cartItemsContainer.appendChild(itemElement);
    });

    const ivaRate = 0.16;
    const ivaAmount = subTotal * ivaRate;
    const grandTotal = subTotal + ivaAmount;

    if (itemsCountElement) itemsCountElement.textContent = totalItems;
    if (subtotalElement) subtotalElement.textContent = `$${subTotal.toFixed(2)}`;
    if (ivaElement) ivaElement.textContent = `$${ivaAmount.toFixed(2)}`;
    if (totalAmountElement) totalAmountElement.textContent = `$${grandTotal.toFixed(2)}`;
}

// ==========================================
// 2. LÓGICA CON TOKEN
// ==========================================

async function loadCart() {
    const userId = getUserId();
    const token = getToken();

    if (!userId || !token) return; // Si no hay token, no cargamos nada

    try {
        const response = await fetch(`${API_BASE_URL}/usuario/${userId}`, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': token // 🔐 Enviamos el token
            }
        });
        const result = await response.json();
        
        if (result.success) {
            renderCart(result.data, result.totalItems);
        } else {
            renderCart([], 0);
        }
    } catch (error) {
        console.error('Error cargando carrito:', error);
        renderCart([], 0); 
    }
}

window.modificarCantidad = async function(productId, delta) {
    const userId = getUserId();
    const token = getToken();
    
    if (!userId || !token) return window.location.href = '/login';

    // Validación visual rápida
    const itemElement = document.querySelector(`.cart-item[data-product-id="${productId}"]`);
    const input = itemElement ? itemElement.querySelector('input') : null;
    if (input) {
        let currentQty = parseInt(input.value);
        if (currentQty + delta < 1) {
            return eliminarProducto(productId);
        }
    }

    try {
        const response = await fetch(`${API_BASE_URL}/add`, {
            method: 'POST', 
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': token // 🔐 Token
            },
            body: JSON.stringify({ 
                id_usuario: userId, 
                id_producto: productId, 
                cantidad: delta 
            }),
        });

        const result = await response.json();
        if (result.success) loadCart(); 
    } catch (error) {
        console.error('Error:', error);
    }
};

window.eliminarProducto = async function(productId) {
    if (!confirm('¿Eliminar este producto?')) return;
    const userId = getUserId();
    const token = getToken();
    
    try {
        const response = await fetch(`${API_BASE_URL}/item/${productId}`, {
            method: 'DELETE',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': token // 🔐 Token
            },
            body: JSON.stringify({ id_usuario: userId })
        });
        const result = await response.json();
        if (result.success) loadCart();
    } catch (error) {
        console.error('Error:', error);
    }
};

window.vaciarCarrito = async function() {
    if (!confirm('¿Estás seguro de vaciar TODO el carrito?')) return;
    const userId = getUserId();
    const token = getToken();

    try {
        const response = await fetch(`${API_BASE_URL}/usuario/${userId}`, {
            method: 'DELETE',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': token // 🔐 Token
            }
        });
        
        const result = await response.json();
        if (result.success) loadCart();
    } catch (error) {
        console.error('Error vaciando carrito:', error);
    }
};

window.irAPagar = function() {
    const userId = getUserId();
    const token = getToken();

    if (!userId || !token) {
        alert("Tu sesión ha expirado. Por favor inicia sesión.");
        window.location.href = '/login';
        return;
    }

    const totalText = document.getElementById('total-amount');
    if (totalText && totalText.textContent === '$0.00') {
        alert("Tu carrito está vacío.");
        return;
    }
    
    window.location.href = '/pago';
};

document.addEventListener('DOMContentLoaded', loadCart);