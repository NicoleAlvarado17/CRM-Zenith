const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre del cliente es obligatorio"],
      trim: true,
    },
    contactName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "El correo de contacto es obligatorio"],
      lowercase: true,
      trim: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "El formato del correo no es valido"],
    },
    phone: {
      type: String,
      required: [true, "El telefono de contacto es obligatorio"],
      trim: true,
    },
    businessType: {
      type: String,
      trim: true,
      default: "General",
    },
    servicesContracted: [
      {
        type: String,
        enum: ["Pagina Web", "Sistema a la Medida", "Codigo QR", "Hosting", "Mantenimiento"],
      },
    ],
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Client", clientSchema);
