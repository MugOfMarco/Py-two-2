document.addEventListener('DOMContentLoaded', () => {
    
    // =========================================================
    // 1. FUNCIÓN GLOBAL ADD TO CART (Con Seguridad Token)
    // =========================================================
    // Se define en window para que el onclick="" del HTML la encuentre.
    window.addToCart = async function(productId) { 
        console.log(`Intentando agregar producto ID: ${productId}`);

        const token = localStorage.getItem('userToken');
        const userId = localStorage.getItem('userId'); 

        // 1. Validar Sesión Local
        if (!token || !userId) {
            alert("Por favor, inicia sesión para comprar.");
            window.location.href = '/login';
            return;
        }

        try {
            // 2. Enviar petición al Backend
            const response = await fetch('/api/carrito/add', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': token // 🔐 LLAVE DE ACCESO
                },
                body: JSON.stringify({ 
                    id_usuario: userId, 
                    id_producto: productId, // Aseguramos que se envía el ID
                    cantidad: 1 
                })
            });
            
            const result = await response.json();

            // 3. Manejar Respuesta
            if (result.success) {
                alert("✅ Producto añadido al carrito.");
                // Opcional: Podrías llamar a updateCartCount() aquí
            } else {
                console.error("Error servidor:", result);
                alert("❌ Error: " + (result.message || "No se pudo agregar"));
            }

        } catch (error) {
            console.error("Error red:", error);
            alert("Error de conexión al intentar agregar al carrito.");
        }
    };
    
    // =========================================================
    // 2. DETECCIÓN DE RUTA (Para no ejecutarse donde no debe)
    // =========================================================
    
    const pathName = window.location.pathname.toLowerCase();
    
    // Si estamos en Login, Registro, Carrito o Home, NO hacemos nada más (solo definimos addToCart)
    if (pathName === '/' || pathName === '/main' || pathName.includes('login') || pathName.includes('carrito') || pathName.includes('registro') || pathName.includes('pago') || pathName.includes('historial')) {
        console.log(`[TIENDA.JS]: Modo pasivo en ${pathName}. (Solo función addToCart activa)`);
        return; 
    }

    // =========================================================
    // 3. CARGA DINÁMICA DE CATEGORÍAS
    // =========================================================

    // Mapa: Ruta del navegador -> Nombre de la Categoría en Base de Datos
    const categoryMap = {
        '/bdsm': 'BDSM',
        '/bienestar': 'Bienestar',
        '/juguetes': 'Juguetes',
        '/lenceria': 'Lenceria' // Sin acento suele ser mejor para URLs/BD, ajusta según tu BD
    };
    
    const categoryApiName = categoryMap[pathName] || null; 
    
    // Si la ruta no es de categoría, terminamos
    if (!categoryApiName) return;
    
    console.log(`[TIENDA.JS]: Cargando categoría dinámica: ${categoryApiName}`);

    // Referencias al DOM
    const productsGrid = document.querySelector('.products-grid');
    const sectionTitle = document.querySelector('.section-title');
    
    if (!productsGrid) {
        console.error("⛔ Error: No se encontró '.products-grid' en el HTML.");
        return;
    }

    // =========================================================
    // 4. FUNCIÓN FETCH Y RENDER
    // =========================================================
    async function fetchAndRenderProducts(category) {
        
        // UI de Carga
        productsGrid.innerHTML = `<p style="text-align: center; width: 100%;">Cargando productos...</p>`;
        if (sectionTitle) sectionTitle.textContent = category;

        try {
            // Nota: Asegúrate de que tu ruta de backend sea /api/productos (en plural) o /api/products
            const response = await fetch(`/api/productos/categoria/${category}`); 
            
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

            const result = await response.json();
            
            if (result.success && result.data && result.data.length > 0) {
                // Renderizar productos
                productsGrid.innerHTML = result.data.map(p => createProductCard(p)).join('');
            } else {
                productsGrid.innerHTML = `<p class="no-products">No hay productos en esta categoría aún.</p>`;
            }

        } catch (error) {
            console.error(`[ERROR]: Fallo al cargar ${category}:`, error);
            productsGrid.innerHTML = `<p class="error-message">No se pudieron cargar los productos.</p>`;
        }
    }

    // =========================================================
    // 5. TEMPLATE DE TARJETA (HTML)
    // =========================================================
    function createProductCard(producto) {
        const precio = parseFloat(producto.precio) || 0;
        
        // Ajusta id_producto vs id según tu base de datos
        const prodId = producto.id_producto || producto.id; 

        return `
            <div class="product-card">
                ${producto.badge ? `<div class="product-badge">${producto.badge}</div>` : ''}
                <div class="product-image">
                    <div class="placeholder-img">✨</div>
                </div>
                <h3 class="product-name">${producto.nombre}</h3>
                <p class="product-description">${producto.descripcion || ''}</p>
                <div class="product-footer">
                    <span class="product-price">$${precio.toFixed(2)}</span>
                    <button class="add-to-cart-btn" onclick="addToCart('${prodId}')">Agregar</button> 
                </div>
            </div>
        `;
    }

    // =========================================================
    // 6. INICIAR
    // =========================================================
    if (categoryApiName) {
        fetchAndRenderProducts(categoryApiName);
    }
});