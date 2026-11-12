require("dotenv").config();
const connectDB = require("./config/db");
const checkMaintenanceAlerts = require("./utils/checkMaintenanceAlerts");
const app = require("./app");

// Conexion a la base de datos (MongoDB Atlas o local, ver seccion 4.1.1 del Documento de Arquitectura)
connectDB();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`CRM Zenith API corriendo en http://localhost:${PORT}`);

  // Genera alertas de mantenimiento automaticamente cada 6 horas (RF04 / HU-10)
  checkMaintenanceAlerts().catch((e) => console.error("Error al revisar alertas:", e.message));
  setInterval(() => {
    checkMaintenanceAlerts().catch((e) => console.error("Error al revisar alertas:", e.message));
  }, 6 * 60 * 60 * 1000);
});
