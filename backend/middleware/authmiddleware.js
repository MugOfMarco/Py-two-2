import jwt from 'jsonwebtoken';

/**
 * Middleware para verificar la validez del token JWT enviado por el cliente.
 * El cliente debe enviarlo en el header: Authorization: Bearer <token_aqui>
 */
export const validarToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Acceso denegado. Se requiere un token de autorización.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded; 
                next();

    } catch (error) {
        // 401 Unauthorized: El token es inválido (expirado, firma modificada, clave secreta incorrecta)
        return res.status(401).json({ message: 'Token inválido o expirado. Vuelve a iniciar sesión.' });
    }
};