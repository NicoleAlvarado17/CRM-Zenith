require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const checkMaintenanceAlerts = require("./utils/checkMaintenanceAlerts");

// Rutas
const authRoutes = require("./routes/auth.routes");
const clientsRoutes = require("./routes/clients.routes");
const opportunitiesRoutes = require("./routes/opportunities.routes");
const bitacoraRoutes = require("./routes/bitacora.routes");
const contractsRoutes = require("./routes/contracts.routes");
const alertsRoutes = require("./routes/alerts.routes");
const reportsRoutes = require("./routes/reports.routes");

const app = express();

// Conexion a la base de datos (MongoDB Atlas o local, ver seccion 4.1.1 del Documento de Arquitectura)
connectDB();

// Middlewares globales
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*",
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));

// Ruta de verificacion (health check) util para confirmar que el servidor esta activo
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "CRM Zenith API funcionando correctamente" });
});

// Registro de rutas por modulo
app.use("/api/auth", authRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/opportunities", opportunitiesRoutes);
app.use("/api/bitacora", bitacoraRoutes);
app.use("/api/contracts", contractsRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/reports", reportsRoutes);

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

// Manejador de errores (siempre al final)
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`CRM Zenith API corriendo en http://localhost:${PORT}`);

  // Genera alertas de mantenimiento automaticamente cada 6 horas (RF04 / HU-10)
  checkMaintenanceAlerts().catch((e) => console.error("Error al revisar alertas:", e.message));
  setInterval(() => {
    checkMaintenanceAlerts().catch((e) => console.error("Error al revisar alertas:", e.message));
  }, 6 * 60 * 60 * 1000);
});
