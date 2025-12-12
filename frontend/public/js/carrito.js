/**
 * /frontend/public/js/carrito.js
 * Lógica de frontend para la página del carrito, interactuando con la API REST.
 */

// --- Variables de Configuración ---
const API_BASE_URL = '/api/carrito'; 
// NOTA: Reemplaza este valor estático con el ID de usuario real de la sesión cuando implementes la autenticación.
const USER_ID = 1; 
const IVA_RATE = 0.16; // 16% de IVA

// --- Funciones de Utilidad y Renderizado ---

/**
 * Muestra el carrito vacío o la lista de ítems.
 * @param {Array<object>} items - Lista de ítems del carrito desde la BD.
 * @param {number} totalItems - Cantidad total de productos únicos.
 */
function renderCart(items, totalItems) {
    // Referencias a los contenedores principales
    const cartItemsContainer = document.querySelector('.cart-items-list'); 
    const emptyCartElement = document.querySelector('.empty-cart');
    const cartHeader = document.querySelector('.cart-header');
    
    // Referencias a los elementos del resumen
    const itemsCountElement = document.getElementById('items-count');
    const subtotalElement = document.getElementById('subtotal');
    const ivaElement = document.getElementById('iva');
    const totalAmountElement = document.getElementById('total-amount'); // Total final

    if (!cartItemsContainer || !emptyCartElement || !itemsCountElement || !cartHeader || !totalAmountElement || !subtotalElement || !ivaElement) {
        console.error('No se encontraron todos los elementos DOM necesarios para renderizar el carrito.');
        return;
    }

    // 1. Mostrar/Ocultar elementos estructurales
    if (items.length === 0) {
        emptyCartElement.style.display = 'block';
        cartHeader.style.display = 'none';
        cartItemsContainer.innerHTML = ''; // Limpiar lista
        
        // Resetear totales
        itemsCountElement.textContent = 0;
        subtotalElement.textContent = '$0.00';
        ivaElement.textContent = '$0.00';
        totalAmountElement.textContent = '$0.00';
        return;
    }

    emptyCartElement.style.display = 'none';
    cartHeader.style.display = 'flex';
    cartItemsContainer.innerHTML = ''; // Limpiar antes de renderizar

    let subTotal = 0;

    // 2. Renderizar cada ítem
    items.forEach(item => {
        // ✅ CORRECCIÓN: Convertir el precio unitario a un número flotante, ya que MySQL lo devuelve como string.
        const unitPrice = parseFloat(item.precio_unitario); 

        const itemTotal = item.cantidad * unitPrice; 
        subTotal += itemTotal; 

        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.setAttribute('data-product-id', item.id_producto); 
        
        // Formatear precio
        // ✅ CORRECCIÓN: Llamar toFixed() sobre el valor numérico (unitPrice)
        const formattedPrice = unitPrice.toFixed(2); 
        const formattedTotal = itemTotal.toFixed(2);
        
        itemElement.innerHTML = `
            <div class="item-details">
                <img src="${item.imagen_url || '/img/default_product.jpg'}" alt="${item.nombre}">
                <div class="info">
                    <h4 class="product-name">${item.nombre}</h4>
                    <p class="product-category">${item.categoria || 'Sin Categoría'}</p>
                    <p class="unit-price">Precio: <span class="price">$${formattedPrice}</span></p>
                </div>
            </div>

            <div class="item-controls">
                <div class="quantity-input">
                    <button onclick="changeQuantity(${item.id_producto}, -1)">-</button>
                    <input type="number" value="${item.cantidad}" min="1" readonly>
                    <button onclick="changeQuantity(${item.id_producto}, 1)">+</button>
                </div>
                <div class="item-total">$${formattedTotal}</div>
                <button class="remove-item-btn" onclick="removeItem(${item.id_producto})">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        `;
        cartItemsContainer.appendChild(itemElement);
    });

    // 3. Calcular y Actualizar resumen y contador
    const ivaAmount = subTotal * IVA_RATE;
    const grandTotal = subTotal + ivaAmount; // Asumiendo que el envío es GRATIS

    itemsCountElement.textContent = totalItems;
    subtotalElement.textContent = `$${subTotal.toFixed(2)}`;
    ivaElement.textContent = `$${ivaAmount.toFixed(2)}`;
    totalAmountElement.textContent = `$${grandTotal.toFixed(2)}`;
    
    // Actualizar el contador del header (si existe un .cart-count global)
    const cartCountElement = document.querySelector('.cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = totalItems;
    }
}

// --- Funciones de Interacción con la API ---

/**
 * Carga los ítems del carrito desde el backend.
 */
async function loadCart() {
    try {
        const response = await fetch(`${API_BASE_URL}/usuario/${USER_ID}`);
        
        if (response.status === 404) {
             // Esto significa que el usuario no tiene carrito o no existe, renderizamos vacío
             renderCart([], 0);
             return;
        }

        if (!response.ok) {
            throw new Error('Error al cargar el carrito.');
        }

        const result = await response.json();
        
        if (result.success) {
            renderCart(result.data, result.totalItems);
        } else {
            // Manejar error de carga, renderizar carrito vacío
            renderCart([], 0); 
            console.error(result.message);
        }

    } catch (error) {
        console.error('Error de conexión al cargar el carrito:', error);
        // En caso de error de red, renderizar carrito vacío
        renderCart([], 0); 
    }
}
window.loadCart = loadCart; 


/**
 * Actualiza la cantidad de un producto.
 * @param {number} productId - ID del producto a modificar.
 * @param {number} delta - Cambio en la cantidad (+1 o -1).
 */
window.changeQuantity = async function(productId, delta) {
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


/**
 * Elimina un producto del carrito.
 * @param {number} productId - ID del producto a eliminar.
 */
window.removeItem = async function(productId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto del carrito?')) {
        return;
    }
    
    try {
        // Se asume que el backend usa el USER_ID codificado para la sesión
        const response = await fetch(`${API_BASE_URL}/item/${productId}?userId=${USER_ID}`, {
            method: 'DELETE',
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert('Producto eliminado correctamente.');
            loadCart(); // Recargar el carrito
        } else {
            alert(`Error al eliminar el producto: ${result.message}`);
        }

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

    try {
        const response = await fetch(`${API_BASE_URL}/usuario/${USER_ID}`, {
            method: 'DELETE',
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert(result.message);
            loadCart(); // Recargar para mostrar el carrito vacío
        } else {
            alert(`Error al vaciar el carrito: ${result.message}`);
        }

    } catch (error) {
        console.error('Error de conexión al vaciar el carrito:', error);
        alert('Error de conexión. Inténtalo más tarde.');
    }
}

/**
 * Simula el proceso de pago
 */
window.checkout = function() {
    alert('Función de pago (checkout) no implementada. Redireccionando a la página principal.');
    window.location.href = '/';
}


// --- Inicialización ---

document.addEventListener('DOMContentLoaded', () => {
    // Cuando la página del carrito carga, inmediatamente pedimos los datos al backend
    loadCart();
});