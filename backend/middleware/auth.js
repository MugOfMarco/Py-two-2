import jwt from 'jsonwebtoken';

export const verificarToken = (req, res, next) => {
    // 1. Buscar el token en la cabecera de la petición
    const token = req.headers['authorization'];

    // 2. Si no trae token, no entra
    if (!token) {
        return res.status(403).json({ success: false, message: 'No tienes permiso (Falta Token)' });
    }

    try {
        // 3. Verificar si el token es real y fue creado por nosotros
        // 'TU_SECRETO_SUPER_SECRETO' debe ser la misma clave que usaste en usercontroller.js
        const decoded = jwt.verify(token, 'TU_SECRETO_SUPER_SECRETO');
        
        // 4. Si pasa, guardamos los datos del usuario en la petición para usarlos luego
        req.user = decoded; 
        
        // 5. ¡PÁSALE! (next permite que el código siga al controlador)
        next(); 

    } catch (error) {
        return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
    }
};