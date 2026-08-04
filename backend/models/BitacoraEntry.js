const mongoose = require("mongoose");

const bitacoraEntrySchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "La bitacora debe estar vinculada a un cliente"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["Reunion", "Llamada", "Correo", "Requerimiento", "Otro"],
      default: "Otro",
    },
    description: {
      type: String,
      required: [true, "La descripcion de la interaccion es obligatoria"],
      trim: true,
    },
    attachments: [
      {
        type: String, // nombre/URL del archivo adjunto
      },
    ],
  },
  { timestamps: true }
);

// Una bitacora es un registro historico: no se permite editarla ni eliminarla (ver seccion 4.2 del documento de arquitectura)
module.exports = mongoose.model("BitacoraEntry", bitacoraEntrySchema);
