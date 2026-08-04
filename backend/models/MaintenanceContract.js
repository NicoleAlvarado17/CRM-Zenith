const mongoose = require("mongoose");

const maintenanceContractSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "El contrato debe estar vinculado a un cliente"],
    },
    service: {
      type: String,
      required: [true, "El servicio contratado es obligatorio"],
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, "La fecha de vencimiento es obligatoria"],
    },
    status: {
      type: String,
      enum: ["Activo", "Por Vencer", "Vencido", "Renovado"],
      default: "Activo",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MaintenanceContract", maintenanceContractSchema);
