const express = require("express");
const router = express.Router();
const Opportunity = require("../models/Opportunity");
const MaintenanceContract = require("../models/MaintenanceContract");
const { protect } = require("../middleware/auth");
const { checkRole } = require("../middleware/checkRole");

router.use(protect);
router.use(checkRole("administrador")); // Los reportes son exclusivos del rol gerencial/administrador

// GET /api/reports/sales - HU-13: reporte de ventas
router.get("/sales", async (req, res, next) => {
  try {
    const opportunities = await Opportunity.find({ stage: "Ganado" }).populate("client", "name");

    if (opportunities.length === 0) {
      return res.json({ message: "No hay ventas registradas", total: 0, opportunities: [] });
    }

    const total = opportunities.reduce((sum, op) => sum + (op.amount || 0), 0);

    res.json({
      totalVentas: opportunities.length,
      montoTotal: total,
      opportunities,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/maintenance - HU-14: reporte de mantenimientos
router.get("/maintenance", async (req, res, next) => {
  try {
    const contracts = await MaintenanceContract.find().populate("client", "name");

    if (contracts.length === 0) {
      return res.json({ message: "No hay mantenimientos registrados", contracts: [] });
    }

    const resumen = {
      activos: contracts.filter((c) => c.status === "Activo").length,
      porVencer: contracts.filter((c) => c.status === "Por Vencer").length,
      vencidos: contracts.filter((c) => c.status === "Vencido").length,
      renovados: contracts.filter((c) => c.status === "Renovado").length,
    };

    res.json({ resumen, contracts });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/opportunities - HU-15: oportunidades activas
router.get("/opportunities", async (req, res, next) => {
  try {
    const opportunities = await Opportunity.find({
      stage: { $nin: ["Ganado", "Perdido"] },
    }).populate("client", "name");

    if (opportunities.length === 0) {
      return res.json({ message: "No hay oportunidades activas", opportunities: [] });
    }

    res.json(opportunities);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
