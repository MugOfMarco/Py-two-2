document.addEventListener('DOMContentLoaded', async () => {
    console.log('--- 👤 JS: Perfil cargado ---');

    const token = localStorage.getItem('userToken');
    if (!token) {
        alert("Debes iniciar sesión.");
        window.location.href = '/login';
        return;
    }

    const form = document.getElementById('profile-form');

    // 1. CARGAR DATOS ACTUALES (GET)
    try {
        // 🚨 CAMBIO AQUÍ: Usamos '/api/users' (Inglés) para coincidir con tu server.js
        const response = await fetch('/api/users/perfil', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token 
            }
        });

        // Verificamos que sea un JSON válido
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Ruta API no encontrada (404)");
        }

        const result = await response.json();

        if (result.success) {
            const user = result.data;
            document.getElementById('nombre').value = user.nombre || '';
            document.getElementById('apellido').value = user.apellido || '';
            document.getElementById('email').value = user.email || ''; 
            document.getElementById('telefono').value = user.telefono || '';
            document.getElementById('codigo_postal').value = user.codigo_postal || '';
        } else {
            alert('Error al cargar datos: ' + result.message);
        }

    } catch (error) {
        console.error("Error cargando perfil:", error);
        alert("Error al cargar datos: " + error.message);
    }

    // 2. GUARDAR CAMBIOS (PUT)
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const datosActualizados = {
                nombre: document.getElementById('nombre').value.trim(),
                apellido: document.getElementById('apellido').value.trim(),
                telefono: document.getElementById('telefono').value.trim(),
                codigo_postal: document.getElementById('codigo_postal').value.trim()
            };

            try {
                // 🚨 CAMBIO AQUÍ TAMBIÉN: '/api/users/perfil'
                const response = await fetch('/api/users/perfil', {
                    method: 'PUT', 
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token
                    },
                    body: JSON.stringify(datosActualizados)
                });

                const result = await response.json();

                if (result.success) {
                    alert('✅ ¡Datos actualizados correctamente!');
                    window.location.reload();
                } else {
                    alert('❌ Error: ' + result.message);
                }

            } catch (error) {
                console.error("Error guardando:", error);
                alert("Error de conexión.");
            }
        });
    }

    // 3. LOGOUT
    const btnLogout = document.getElementById('btn-logout');
    if(btnLogout){
        btnLogout.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = '/login';
        });
    }
});