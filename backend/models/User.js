const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "El correo es obligatorio"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "El formato del correo no es valido"],
    },
    password: {
      type: String,
      required: [true, "La contrasena es obligatoria"],
      minlength: [6, "La contrasena debe tener al menos 6 caracteres"],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ["administrador", "tecnico", "comercial"],
        message: "Rol invalido. Debe ser administrador, tecnico o comercial",
      },
      default: "comercial",
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Cifra la contrasena antes de guardar (RNF01 - Seguridad y Confidencialidad)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
