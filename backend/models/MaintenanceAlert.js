const mongoose = require("mongoose");

const maintenanceAlertSchema = new mongoose.Schema(
  {
    contract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MaintenanceContract",
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pendiente", "Atendida"],
      default: "Pendiente",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MaintenanceAlert", maintenanceAlertSchema);
