const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verifica que la peticion incluya un token JWT valido (ver 4.2 Autenticacion)
async function protect(req, res, next) {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "No autorizado: falta el token de acceso" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.active) {
      return res.status(401).json({ message: "No autorizado: usuario no valido o inactivo" });
    }

    req.user = user; // Disponible para el resto de la peticion
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalido o expirado" });
  }
}

module.exports = { protect };
