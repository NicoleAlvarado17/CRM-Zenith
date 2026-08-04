const express = require("express");
const router = express.Router();
const BitacoraEntry = require("../models/BitacoraEntry");
const { protect } = require("../middleware/auth");
const { checkRole } = require("../middleware/checkRole");
const logAction = require("../utils/logAction");

router.use(protect);

// GET /api/bitacora - HU-09: ver bitacoras (administrador, tecnico)
router.get("/", checkRole("administrador", "tecnico"), async (req, res, next) => {
  try {
    const entries = await BitacoraEntry.find()
      .populate("client", "name")
      .populate("user", "name role")
      .sort({ createdAt: -1 });

    if (entries.length === 0) {
      return res.json({ message: "No hay interacciones registradas", entries: [] });
    }

    res.json(entries);
  } catch (error) {
    next(error);
  }
});

// GET /api/bitacora/client/:clientId - HU-08/HU-09: filtrar por cliente
router.get("/client/:clientId", checkRole("administrador", "tecnico"), async (req, res, next) => {
  try {
    const entries = await BitacoraEntry.find({ client: req.params.clientId })
      .populate("user", "name role")
      .sort({ createdAt: -1 });

    res.json(entries);
  } catch (error) {
    next(error);
  }
});

// POST /api/bitacora - HU-07: registrar interacciones (tecnico, administrador)
router.post("/", checkRole("administrador", "tecnico"), async (req, res, next) => {
  try {
    const { client, type, description, attachments } = req.body;

    if (!client || !description) {
      return res.status(400).json({ message: "Cliente y descripcion son obligatorios" });
    }

    const entry = await BitacoraEntry.create({
      client,
      user: req.user._id,
      type,
      description,
      attachments,
    });

    await logAction({
      userId: req.user._id,
      action: "CREATE",
      entity: "BitacoraEntry",
      entityId: entry._id,
      details: `Interaccion registrada para cliente ${client}`,
    });

    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
});

// GET /api/bitacora/exportar - HU-09: exportacion simple en formato JSON descargable
router.get("/exportar", checkRole("administrador", "tecnico"), async (req, res, next) => {
  try {
    const entries = await BitacoraEntry.find()
      .populate("client", "name")
      .populate("user", "name");

    res.setHeader("Content-Disposition", "attachment; filename=bitacora_zenith.json");
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(entries, null, 2));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
