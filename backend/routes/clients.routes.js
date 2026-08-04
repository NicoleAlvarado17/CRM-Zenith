const express = require("express");
const router = express.Router();
const Client = require("../models/Client");
const BitacoraEntry = require("../models/BitacoraEntry");
const MaintenanceContract = require("../models/MaintenanceContract");
const { protect } = require("../middleware/auth");
const { checkRole } = require("../middleware/checkRole");
const logAction = require("../utils/logAction");

router.use(protect); // Todas las rutas de este modulo requieren estar autenticado

// GET /api/clients - todos los roles pueden consultar el listado
router.get("/", async (req, res, next) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 });
    res.json(clients);
  } catch (error) {
    next(error);
  }
});

// GET /api/clients/:id - detalle de un cliente
router.get("/:id", async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    res.json(client);
  } catch (error) {
    next(error);
  }
});

// GET /api/clients/:id/historial - HU-03: consultar historial tecnico
router.get("/:id/historial", async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    const bitacora = await BitacoraEntry.find({ client: client._id })
      .populate("user", "name role")
      .sort({ createdAt: -1 });

    const contracts = await MaintenanceContract.find({ client: client._id }).sort({ dueDate: 1 });

    if (bitacora.length === 0 && contracts.length === 0) {
      return res.json({ message: "Sin historial tecnico registrado", bitacora: [], contracts: [] });
    }

    res.json({ bitacora, contracts });
  } catch (error) {
    next(error);
  }
});

// POST /api/clients - HU-01: registrar clientes (administrador, comercial)
router.post("/", checkRole("administrador", "comercial"), async (req, res, next) => {
  try {
    const { name, contactName, email, phone, businessType, servicesContracted, notes } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ message: "Nombre, correo y telefono son obligatorios" });
    }

    const existing = await Client.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Ya existe un cliente registrado con ese correo" });
    }

    const client = await Client.create({
      name,
      contactName,
      email,
      phone,
      businessType,
      servicesContracted,
      notes,
      createdBy: req.user._id,
    });

    await logAction({
      userId: req.user._id,
      action: "CREATE",
      entity: "Client",
      entityId: client._id,
      details: `Cliente creado: ${client.name}`,
    });

    res.status(201).json(client);
  } catch (error) {
    next(error);
  }
});

// PUT /api/clients/:id - HU-02: editar clientes (administrador, comercial)
router.put("/:id", checkRole("administrador", "comercial"), async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    const camposPermitidos = [
      "name",
      "contactName",
      "email",
      "phone",
      "businessType",
      "servicesContracted",
      "notes",
    ];

    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined) {
        client[campo] = req.body[campo];
      }
    });

    await client.save();

    await logAction({
      userId: req.user._id,
      action: "UPDATE",
      entity: "Client",
      entityId: client._id,
      details: `Cliente actualizado: ${client.name}`,
    });

    res.json(client);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/clients/:id - solo administrador
router.delete("/:id", checkRole("administrador"), async (req, res, next) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    await logAction({
      userId: req.user._id,
      action: "DELETE",
      entity: "Client",
      entityId: client._id,
      details: `Cliente eliminado: ${client.name}`,
    });

    res.json({ message: "Cliente eliminado correctamente" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
