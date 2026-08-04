const mongoose = require("mongoose");

async function connectDB() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error("La variable MONGO_URI no esta definida en el archivo .env");
    }

    await mongoose.connect(uri);
    console.log(`[MongoDB] Conectado correctamente a: ${mongoose.connection.name}`);
  } catch (error) {
    console.error("[MongoDB] Error al conectar:", error.message);
    process.exit(1);
  }
}

module.exports = connectDB;
