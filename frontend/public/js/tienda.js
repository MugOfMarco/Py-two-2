document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Definición Global de la Función addToCart ---
    window.addToCart = async function(productId) { 
        console.log(`[CARRITO] Intentando agregar producto ${productId} al carrito (Llamada a API).`);
        
        try {
            // Llama al router de carrito con la nueva ruta POST /api/carrito/add
            const response = await fetch('/api/carrito/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productId: productId, quantity: 1 }) // Enviamos el ID y cantidad
            });
            
            const result = await response.json();
    
            if (response.ok && result.success) {
                console.log(`✅ [CARRITO] Producto ${productId} agregado exitosamente a la BD.`);
                alert(`"${productId}" agregado al carrito.`);
            } else {
                console.error(`❌ [CARRITO] Error al agregar a la BD:`, result.message || 'Error desconocido.');
                alert('Error: No se pudo agregar el producto. Revisa la consola.');
            }
    
        } catch (error) {
            console.error('❌ [CARRITO] Fallo en la comunicación con el servidor:', error);
            alert('Error de conexión con el servidor.');
        }
    }
    
    // --- 2. Detección de Ruta y Lógica de Detención ---
    
    const pathName = window.location.pathname.toLowerCase();
    
    // Rutas estáticas donde el script solo debe definir addToCart y detenerse.
    if (pathName === '/' || pathName.includes('login') || pathName.includes('carrito') || pathName.includes('registro')) {
        console.log(`[DEBUG TIENDA.JS]: Script ejecutado en ruta estática (${pathName}). Solo definiendo la función carrito.`);
        return; 
    }

    // --- 3. Lógica para Rutas de Categoría (Carga Dinámica) ---

    const categoryMap = {
        '/bdsm': 'BDSM',
        '/bienestar': 'Bienestar',
        '/juguetes': 'Juguetes',
        '/lenceria': 'Lencería'
    };
    
    const categoryApiName = categoryMap[pathName] || null; 
    
    if (!categoryApiName) {
        return;
    }
    
    console.log(`[DEBUG TIENDA.JS]: Ruta detectada: ${pathName}. Iniciando carga dinámica de ${categoryApiName}.`);

    // --- 4. Conexión con el DOM y Preparación ---
    
    const productsGrid = document.querySelector('.products-grid');
    const sectionTitle = document.querySelector('.section-title');
    
    if (!productsGrid) {
        console.error("⛔ Error: No se encontró el contenedor '.products-grid'. Revisa la vista EJS de la categoría.");
        return;
    }

    // --- 5. Función de Carga (Llama a la API de productos) ---
    async function fetchAndRenderProducts(category) {
        
        productsGrid.innerHTML = `<p style="text-align: center;">Cargando productos de ${category}...</p>`;
        if (sectionTitle) sectionTitle.textContent = `Cargando ${category}...`;

        try {
            const response = await fetch(`/api/products/${category}`); 
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}.`);
            }

            const result = await response.json();
            
            if (result.success && result.data.length > 0) {
                productsGrid.innerHTML = result.data.map(p => createProductCard(p)).join('');
            } else {
                productsGrid.innerHTML = `<p class="no-products">No se encontraron productos para ${category}.</p>`;
            }

        } catch (error) {
            console.error(`[ERROR]: Fallo al cargar productos para ${category}:`, error);
            productsGrid.innerHTML = `<p class="error-message">Error de conexión o datos. (${error.message})</p>`;
        } finally {
            if (sectionTitle && productsGrid.innerHTML.includes('Cargando') ) {
                 sectionTitle.textContent = categoryApiName;
            }
        }
    }

    // --- 6. Funciones Auxiliares ---
    
    /** Genera el HTML de la tarjeta */
    function createProductCard(producto) {
        const precio = typeof producto.precio === 'number' ? producto.precio : 0;
        const priceFormatted = precio.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        
        return `
            <div class="product-card" data-id="${producto.id}">
                ${producto.badge ? `<div class="product-badge">${producto.badge}</div>` : ''}
                <div class="product-image">
                    <div class="placeholder-img">${producto.imagen || '✨'}</div>
                </div>
                <h3 class="product-name">${producto.nombre}</h3>
                <p class="product-description">${producto.descripcion || 'Sin descripción.'}</p>
                <div class="product-footer">
                    <span class="product-price">$${priceFormatted}</span>
                    <button class="add-to-cart-btn" onclick="addToCart('${producto.id}')" data-id="${producto.id}">Agregar</button> 
                </div>
            </div>
        `;
    }

    // --- 7. Ejecutar Carga ---
    if (categoryApiName) {
        fetchAndRenderProducts(categoryApiName);
    }
});