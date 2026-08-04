const mongoose = require("mongoose");

const STAGES = ["Contacto Inicial", "Cotizado", "En Negociacion", "Ganado", "Perdido"];

const opportunitySchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "La oportunidad debe estar vinculada a un cliente"],
    },
    title: {
      type: String,
      required: [true, "El titulo de la oportunidad es obligatorio"],
      trim: true,
    },
    serviceType: {
      type: String,
      required: [true, "El tipo de servicio es obligatorio"],
      enum: ["Pagina Web", "Sistema a la Medida", "Codigo QR", "Hosting", "Mantenimiento"],
    },
    stage: {
      type: String,
      enum: STAGES,
      default: "Contacto Inicial",
    },
    amount: {
      type: Number,
      default: 0,
      min: [0, "El monto no puede ser negativo"],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    history: [
      {
        stage: { type: String, enum: STAGES },
        date: { type: Date, default: Date.now },
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
  },
  { timestamps: true }
);

opportunitySchema.statics.STAGES = STAGES;

module.exports = mongoose.model("Opportunity", opportunitySchema);
