const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado.' });
  }
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
  }
  next();
};

const requireEmpleado = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado.' });
  }
  if (!['admin', 'empleado'].includes(req.user.rol)) {
    return res.status(403).json({ error: 'Acceso denegado.' });
  }
  next();
};

module.exports = { requireAdmin, requireEmpleado };
