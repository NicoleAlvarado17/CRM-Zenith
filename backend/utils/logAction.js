const AuditLog = require("../models/AuditLog");

// Registra una accion CRUD en la bitacora interna de auditoria (RQNF-006 / seccion 4.2)
// No se espera a que termine (fire and forget) para no afectar el tiempo de respuesta al usuario.
async function logAction({ userId, action, entity, entityId, details }) {
  try {
    await AuditLog.create({ user: userId, action, entity, entityId, details });
  } catch (error) {
    console.error("[AuditLog] No se pudo registrar la accion:", error.message);
  }
}

module.exports = logAction;
