const express = require("express");
const router = express.Router();
const Opportunity = require("../models/Opportunity");
const { protect } = require("../middleware/auth");
const { checkRole } = require("../middleware/checkRole");
const logAction = require("../utils/logAction");

router.use(protect);

// GET /api/opportunities - HU-06: ver estado del pipeline (todos los roles pueden consultar)
router.get("/", async (req, res, next) => {
  try {
    const { stage } = req.query;
    const filter = stage ? { stage } : {};

    const opportunities = await Opportunity.find(filter)
      .populate("client", "name email")
      .populate("assignedTo", "name")
      .sort({ createdAt: -1 });

    res.json(opportunities);
  } catch (error) {
    next(error);
  }
});

// GET /api/opportunities/pipeline - agrupa las oportunidades por etapa para la vista Kanban
router.get("/pipeline", async (req, res, next) => {
  try {
    const opportunities = await Opportunity.find()
      .populate("client", "name")
      .populate("assignedTo", "name");

    if (opportunities.length === 0) {
      return res.json({ message: "No hay oportunidades registradas", pipeline: {} });
    }

    const pipeline = {};
    Opportunity.STAGES.forEach((stage) => (pipeline[stage] = []));
    opportunities.forEach((op) => pipeline[op.stage].push(op));

    res.json({ pipeline });
  } catch (error) {
    next(error);
  }
});

// POST /api/opportunities - HU-04: registrar oportunidades (comercial, administrador)
router.post("/", checkRole("administrador", "comercial"), async (req, res, next) => {
  try {
    const { client, title, serviceType, amount } = req.body;

    if (!client || !title || !serviceType) {
      return res
        .status(400)
        .json({ message: "Cliente, titulo y tipo de servicio son obligatorios" });
    }

    const duplicated = await Opportunity.findOne({
      client,
      title,
      stage: { $nin: ["Ganado", "Perdido"] },
    });
    if (duplicated) {
      return res
        .status(409)
        .json({ message: "Ya existe una oportunidad similar activa para este cliente" });
    }

    const opportunity = await Opportunity.create({
      client,
      title,
      serviceType,
      amount,
      assignedTo: req.user._id,
      stage: "Contacto Inicial",
      history: [{ stage: "Contacto Inicial", user: req.user._id }],
    });

    await logAction({
      userId: req.user._id,
      action: "CREATE",
      entity: "Opportunity",
      entityId: opportunity._id,
      details: `Oportunidad creada: ${opportunity.title}`,
    });

    res.status(201).json(opportunity);
  } catch (error) {
    next(error);
  }
});

// PUT /api/opportunities/:id/stage - HU-05: actualizar etapas (comercial, administrador)
router.put("/:id/stage", checkRole("administrador", "comercial"), async (req, res, next) => {
  try {
    const { stage } = req.body;

    if (!Opportunity.STAGES.includes(stage)) {
      return res.status(400).json({
        message: `Etapa invalida. Debe ser una de: ${Opportunity.STAGES.join(", ")}`,
      });
    }

    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) {
      return res.status(404).json({ message: "Oportunidad no encontrada" });
    }

    opportunity.stage = stage;
    opportunity.history.push({ stage, user: req.user._id });
    await opportunity.save();

    await logAction({
      userId: req.user._id,
      action: "UPDATE",
      entity: "Opportunity",
      entityId: opportunity._id,
      details: `Etapa actualizada a: ${stage}`,
    });

    res.json(opportunity);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/opportunities/:id - solo administrador
router.delete("/:id", checkRole("administrador"), async (req, res, next) => {
  try {
    const opportunity = await Opportunity.findByIdAndDelete(req.params.id);
    if (!opportunity) {
      return res.status(404).json({ message: "Oportunidad no encontrada" });
    }

    await logAction({
      userId: req.user._id,
      action: "DELETE",
      entity: "Opportunity",
      entityId: opportunity._id,
      details: `Oportunidad eliminada: ${opportunity.title}`,
    });

    res.json({ message: "Oportunidad eliminada correctamente" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
