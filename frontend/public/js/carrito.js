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
 * @param {number} totalItems - Cantidad total de productos (suma de cantidades).
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
    const cartSummaryContainer = document.querySelector('.cart-summary'); // Contenedor del resumen
    const checkoutButton = document.querySelector('.btn-checkout'); // Botón de pagar (si existe)

    if (!cartItemsContainer || !emptyCartElement || !itemsCountElement || !cartHeader || !totalAmountElement || !subtotalElement || !ivaElement || !cartSummaryContainer) {
        console.error('No se encontraron todos los elementos DOM necesarios para renderizar el carrito. Revise su carrito.ejs.');
        return;
    }

    // 1. Mostrar/Ocultar elementos estructurales
    if (items.length === 0) {
        emptyCartElement.style.display = 'block';
        cartHeader.style.display = 'none';
        cartSummaryContainer.style.display = 'none'; // Ocultar el resumen al vaciarse
        cartItemsContainer.innerHTML = ''; // Limpiar lista
        
        // Resetear totales
        itemsCountElement.textContent = 0;
        subtotalElement.textContent = '$0.00';
        ivaElement.textContent = '$0.00';
        totalAmountElement.textContent = '$0.00';
        if (checkoutButton) checkoutButton.disabled = true;
        return;
    }

    // Si hay ítems:
    emptyCartElement.style.display = 'none';
    cartHeader.style.display = 'flex'; // O 'block' según tu CSS original
    cartSummaryContainer.style.display = 'block'; // Mostrar el resumen
    cartItemsContainer.innerHTML = ''; // Limpiar antes de renderizar
    if (checkoutButton) checkoutButton.disabled = false;

    let subTotal = 0;

    // 2. Renderizar cada ítem
    items.forEach(item => {
        // Obtenemos el precio unitario del alias que dimos en el controller
        const unitPrice = parseFloat(item.precio_unitario); 
        
        const itemTotal = item.cantidad * unitPrice; 
        subTotal += itemTotal; 

        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.setAttribute('data-product-id', item.id_producto); 
        
        const formattedPrice = unitPrice.toFixed(2); 
        const formattedTotal = itemTotal.toFixed(2);
        
        itemElement.innerHTML = `
            <div class="item-details">
                <img src="${item.imagen_url || '/img/default_product.jpg'}" alt="${item.nombre}">
                <div class="info">
                    <h4 class="product-name">${item.nombre}</h4>
                    <p class="product-category">${item.descripcion || 'Sin Descripción'}</p> 
                    <p class="unit-price">Precio: <span class="price">$${formattedPrice}</span></p>
                </div>
            </div>

            <div class="item-controls">
                <div class="quantity-input">
                    <button onclick="changeQuantity(${item.id_producto}, ${item.cantidad - 1})">-</button>
                    <input type="number" value="${item.cantidad}" min="1" readonly>
                    <button onclick="changeQuantity(${item.id_producto}, ${item.cantidad + 1})">+</button>
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
    const grandTotal = subTotal + ivaAmount; 

    itemsCountElement.textContent = items.length; // Cantidad de productos ÚNICOS
    subtotalElement.textContent = `$${subTotal.toFixed(2)}`;
    ivaElement.textContent = `$${ivaAmount.toFixed(2)}`;
    totalAmountElement.textContent = `$${grandTotal.toFixed(2)}`;
    
    // Actualizar el contador del header (si existe un .cart-count global)
    const cartCountElement = document.querySelector('.cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = totalItems; // Total de unidades
    }
}

// --- Funciones de Interacción con la API ---

/**
 * Carga los ítems del carrito desde el backend.
 */
async function loadCart() {
    try {
        // GET /api/carrito/usuario/:userId
        const response = await fetch(`${API_BASE_URL}/usuario/${USER_ID}`);
        
        if (response.status === 404) {
             // Esto significa que el usuario no tiene carrito o no existe, renderizamos vacío
             renderCart([], 0);
             return;
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error desconocido.' }));
            throw new Error(errorData.message || 'Error al cargar el carrito.');
        }

        const result = await response.json();
        
        if (result.success) {
            // result.data es el array de ítems, result.totalItems es la suma de cantidades
            renderCart(result.data, result.totalItems);
        } else {
            renderCart([], 0); 
            console.error(result.message);
        }

    } catch (error) {
        console.error('Error de conexión o de servidor al cargar el carrito:', error);
        // En caso de error de red, renderizar carrito vacío
        renderCart([], 0); 
    }
}
window.loadCart = loadCart; 


/**
 * Actualiza la cantidad de un producto.
 * @param {number} productId - ID del producto a modificar.
 * @param {number} newQuantity - La nueva cantidad TOTAL deseada (ej: 5).
 */
window.changeQuantity = async function(productId, newQuantity) {

    if (newQuantity < 1) {
        // Si se intenta bajar a 0 o menos, confirmamos la eliminación
        if (confirm('¿Desea eliminar este producto del carrito?')) {
            // Usamos removeItem, que ya usa la ruta DELETE correcta.
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
                quantity: newQuantity // Enviamos la cantidad TOTAL deseada
            }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
            loadCart(); // <--- RECARGA LA VISTA
        } else {
            alert(`Error al actualizar la cantidad: ${result.message}`);
            loadCart(); // Recargar para restaurar la cantidad correcta si hay un error (ej: stock)
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
        // DELETE /api/carrito/item/:productId?userId=1
        const response = await fetch(`${API_BASE_URL}/item/${productId}?userId=${USER_ID}`, {
            method: 'DELETE',
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert('Producto eliminado correctamente.');
            loadCart(); // <--- RECARGA LA VISTA
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
        // DELETE /api/carrito/usuario/:userId
        const response = await fetch(`${API_BASE_URL}/usuario/${USER_ID}`, {
            method: 'DELETE',
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert(result.message);
            loadCart(); // <--- RECARGA LA VISTA
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