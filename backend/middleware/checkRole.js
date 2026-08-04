// Implementa la autorizacion segun perfiles de usuario definida en la seccion 4.2
// del Documento de Arquitectura: administrador, tecnico, comercial.
// Uso: checkRole("administrador", "comercial")
function checkRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "No autorizado" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Acceso denegado: su rol (${req.user.role}) no tiene permiso para esta accion`,
      });
    }

    next();
  };
}

module.exports = { checkRole };
