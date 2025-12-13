document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Evita la recarga de la página

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/usuarios/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // ÉXITO: GUARDAR EL TOKEN y REDIRIGIR
            localStorage.setItem('userToken', data.token);
            console.log("Inicio de sesión exitoso. Redirigiendo...");
            window.location.href = '/main.html'; // Redirigir a la página principal

        } else {
            // ERROR
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        alert('Hubo un problema al conectar con el servidor.');
    }
});