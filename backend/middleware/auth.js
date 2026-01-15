import jwt from 'jsonwebtoken';

export const verificarToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ success: false, message: 'No tienes permiso (Falta Token)' });
    }

    try {
        // 🔐 CAMBIO: Ahora usa process.env.JWT_SECRET
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 
        
        req.user = decoded; 
        next(); 

    } catch (error) {
        return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
    }
};