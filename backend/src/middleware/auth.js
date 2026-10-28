import jwt from 'jsonwebtoken';

export function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ mensaje: 'Acceso denegado, falta token de autenticación' });
  }

  try {
    const verificado = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.usuario = verificado;
    next();
  } catch (error) {
    res.status(403).json({ mensaje: 'Token inválido o expirado' });
  }
}