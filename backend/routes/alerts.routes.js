const express = require("express");
const router = express.Router();
const MaintenanceAlert = require("../models/MaintenanceAlert");
const checkMaintenanceAlerts = require("../utils/checkMaintenanceAlerts");
const { protect } = require("../middleware/auth");
const { checkRole } = require("../middleware/checkRole");
const logAction = require("../utils/logAction");

router.use(protect);

// GET /api/alerts - HU-11: ver alertas en el panel (administrador, tecnico)
router.get("/", checkRole("administrador", "tecnico"), async (req, res, next) => {
  try {
    const { sort } = req.query; // ?sort=dueDate para HU-11 escenario 3 (ordenamiento)
    const sortField = sort === "dueDate" ? { dueDate: 1 } : { createdAt: -1 };

    const alerts = await MaintenanceAlert.find()
      .populate("client", "name")
      .populate("contract", "service")
      .sort(sortField);

    if (alerts.length === 0) {
      return res.json({ message: "No hay alertas disponibles", alerts: [] });
    }

    res.json(alerts);
  } catch (error) {
    next(error);
  }
});

// POST /api/alerts/generate - HU-10: genera alertas automaticas (administrador)
// En produccion esto tambien puede ejecutarse mediante una tarea programada (cron)
router.post("/generate", checkRole("administrador"), async (req, res, next) => {
  try {
    const created = await checkMaintenanceAlerts();

    await logAction({
      userId: req.user._id,
      action: "CREATE",
      entity: "MaintenanceAlert",
      details: `Proceso de generacion automatica ejecutado (${created} alertas nuevas)`,
    });

    res.json({ message: `Proceso finalizado. Se generaron ${created} alerta(s) nueva(s).` });
  } catch (error) {
    next(error);
  }
});

// PUT /api/alerts/:id/atender - marca una alerta como atendida
router.put("/:id/atender", checkRole("administrador", "tecnico"), async (req, res, next) => {
  try {
    const alert = await MaintenanceAlert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ message: "Alerta no encontrada" });
    }

    alert.status = "Atendida";
    await alert.save();

    res.json(alert);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
