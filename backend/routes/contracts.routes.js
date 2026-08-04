const express = require("express");
const router = express.Router();
const MaintenanceContract = require("../models/MaintenanceContract");
const { protect } = require("../middleware/auth");
const { checkRole } = require("../middleware/checkRole");
const logAction = require("../utils/logAction");

router.use(protect);

// GET /api/contracts - listar contratos de mantenimiento
router.get("/", checkRole("administrador", "tecnico"), async (req, res, next) => {
  try {
    const contracts = await MaintenanceContract.find()
      .populate("client", "name")
      .sort({ dueDate: 1 });
    res.json(contracts);
  } catch (error) {
    next(error);
  }
});

// POST /api/contracts - registrar un nuevo contrato de mantenimiento
router.post("/", checkRole("administrador", "tecnico"), async (req, res, next) => {
  try {
    const { client, service, startDate, dueDate } = req.body;

    if (!client || !service || !dueDate) {
      return res
        .status(400)
        .json({ message: "Cliente, servicio y fecha de vencimiento son obligatorios" });
    }

    const contract = await MaintenanceContract.create({ client, service, startDate, dueDate });

    await logAction({
      userId: req.user._id,
      action: "CREATE",
      entity: "MaintenanceContract",
      entityId: contract._id,
      details: `Contrato de mantenimiento creado para servicio: ${service}`,
    });

    res.status(201).json(contract);
  } catch (error) {
    next(error);
  }
});

// PUT /api/contracts/:id/renovar - marca un contrato como renovado y extiende la fecha
router.put("/:id/renovar", checkRole("administrador", "tecnico"), async (req, res, next) => {
  try {
    const { newDueDate } = req.body;
    const contract = await MaintenanceContract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({ message: "Contrato no encontrado" });
    }

    contract.dueDate = newDueDate || contract.dueDate;
    contract.status = "Renovado";
    await contract.save();

    await logAction({
      userId: req.user._id,
      action: "UPDATE",
      entity: "MaintenanceContract",
      entityId: contract._id,
      details: "Contrato renovado",
    });

    res.json(contract);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
