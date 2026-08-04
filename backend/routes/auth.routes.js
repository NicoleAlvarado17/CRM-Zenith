const express = require("express");
const router = express.Router();
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { protect } = require("../middleware/auth");
const { checkRole } = require("../middleware/checkRole");
const logAction = require("../utils/logAction");

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Debe indicar correo y contrasena" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user || !user.active) {
      return res.status(401).json({ message: "Credenciales invalidas" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Credenciales invalidas" });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/register  (solo el administrador puede crear nuevos usuarios)
router.post("/register", protect, checkRole("administrador"), async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Nombre, correo y contrasena son obligatorios" });
    }

    const user = await User.create({ name, email, password, role });

    await logAction({
      userId: req.user._id,
      action: "CREATE",
      entity: "User",
      entityId: user._id,
      details: `Usuario creado: ${user.email} (rol: ${user.role})`,
    });

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  });
});

module.exports = router;
