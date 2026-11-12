const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const errorHandler = require("./middleware/errorHandler");

// Rutas
const authRoutes = require("./routes/auth.routes");
const clientsRoutes = require("./routes/clients.routes");
const opportunitiesRoutes = require("./routes/opportunities.routes");
const bitacoraRoutes = require("./routes/bitacora.routes");
const contractsRoutes = require("./routes/contracts.routes");
const alertsRoutes = require("./routes/alerts.routes");
const reportsRoutes = require("./routes/reports.routes");

// Construccion de la app de Express por separado de server.js (T-04): de esta forma
// las pruebas automatizadas pueden importar la app con supertest sin levantar un
// puerto real ni abrir la conexion a MongoDB de produccion.
const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*",
    credentials: true,
  })
);
app.use(express.json());

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

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

module.exports = app;
