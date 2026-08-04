const mongoose = require("mongoose");

// Registra quien hizo que y cuando dentro del sistema (ver seccion 4.2 - Auditoria y trazabilidad
// del Documento de Arquitectura). Cubre las tablas indicadas en la matriz de bitacoras de CRUD.
const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: ["CREATE", "READ", "UPDATE", "DELETE"],
      required: true,
    },
    entity: {
      type: String,
      required: true, // Ej: "Client", "Opportunity", "MaintenanceAlert"
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    details: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
