// Script de inicializacion: crea el usuario administrador y algunos datos de ejemplo
// para poder probar el sistema de inmediato. Ejecutar con: npm run seed
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const User = require("../models/User");
const Client = require("../models/Client");
const Opportunity = require("../models/Opportunity");
const MaintenanceContract = require("../models/MaintenanceContract");

async function seed() {
  await connectDB();

  console.log("Iniciando carga de datos de ejemplo...");

  // 1. Usuario administrador
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@zenith.com").toLowerCase();
  let admin = await User.findOne({ email: adminEmail });

  if (!admin) {
    admin = await User.create({
      name: process.env.ADMIN_NAME || "Administrador Zenith",
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD || "Admin123!",
      role: "administrador",
    });
    console.log(`Usuario administrador creado -> correo: ${admin.email}`);
  } else {
    console.log("El usuario administrador ya existia, no se duplico.");
  }

  // 2. Usuarios de ejemplo: tecnico y comercial
  const usuariosEjemplo = [
    { name: "Sofia Arana", email: "tecnico@zenith.com", password: "Tecnico123!", role: "tecnico" },
    { name: "Valery Vargas", email: "comercial@zenith.com", password: "Comercial123!", role: "comercial" },
  ];

  for (const u of usuariosEjemplo) {
    const existe = await User.findOne({ email: u.email });
    if (!existe) {
      await User.create(u);
      console.log(`Usuario de ejemplo creado -> correo: ${u.email} / rol: ${u.role}`);
    }
  }

  const tecnico = await User.findOne({ email: "tecnico@zenith.com" });
  const comercial = await User.findOne({ email: "comercial@zenith.com" });

  // 3. Cliente de ejemplo
  let cliente = await Client.findOne({ email: "contacto@clienteejemplo.com" });
  if (!cliente) {
    cliente = await Client.create({
      name: "Comercial La Estrella",
      contactName: "Marco Jimenez",
      email: "contacto@clienteejemplo.com",
      phone: "8888-0000",
      businessType: "Retail",
      servicesContracted: ["Pagina Web", "Hosting", "Mantenimiento"],
      notes: "Cliente de ejemplo cargado por el script de seed.",
      createdBy: admin._id,
    });
    console.log("Cliente de ejemplo creado:", cliente.name);
  }

  // 4. Oportunidad de ejemplo
  const oportunidadExiste = await Opportunity.findOne({ client: cliente._id });
  if (!oportunidadExiste) {
    await Opportunity.create({
      client: cliente._id,
      title: "Renovacion de sitio web corporativo",
      serviceType: "Pagina Web",
      stage: "Cotizado",
      amount: 450000,
      assignedTo: comercial ? comercial._id : admin._id,
      history: [
        { stage: "Contacto Inicial", user: admin._id },
        { stage: "Cotizado", user: comercial ? comercial._id : admin._id },
      ],
    });
    console.log("Oportunidad de ejemplo creada.");
  }

  // 5. Contrato de mantenimiento de ejemplo (vence pronto para poder probar las alertas)
  const contratoExiste = await MaintenanceContract.findOne({ client: cliente._id });
  if (!contratoExiste) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 10); // vence en 10 dias -> debe disparar alerta

    await MaintenanceContract.create({
      client: cliente._id,
      service: "Mantenimiento preventivo mensual",
      startDate: new Date(),
      dueDate,
    });
    console.log("Contrato de mantenimiento de ejemplo creado (vence en 10 dias).");
  }

  console.log("\nCarga de datos finalizada. Puede iniciar sesion con:");
  console.log(`   Administrador -> ${adminEmail} / ${process.env.ADMIN_PASSWORD || "Admin123!"}`);
  console.log("   Tecnico       -> tecnico@zenith.com / Tecnico123!");
  console.log("   Comercial     -> comercial@zenith.com / Comercial123!");

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((error) => {
  console.error("Error durante el seed:", error);
  process.exit(1);
});
