// Manejador centralizado de errores para no repetir try/catch con formato distinto en cada ruta
function errorHandler(err, req, res, next) {
  console.error(err.stack);

  // Errores de validacion de Mongoose
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: "Error de validacion", errors: messages });
  }

  // Error de clave duplicada (por ejemplo, correo de cliente ya existente)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ message: `Ya existe un registro con ese ${field}` });
  }

  // Error de ID con formato invalido
  if (err.name === "CastError") {
    return res.status(400).json({ message: "Identificador invalido" });
  }

  res.status(err.statusCode || 500).json({
    message: err.message || "Error interno del servidor",
  });
}

module.exports = errorHandler;
