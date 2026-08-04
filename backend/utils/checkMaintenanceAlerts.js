const MaintenanceContract = require("../models/MaintenanceContract");
const MaintenanceAlert = require("../models/MaintenanceAlert");

const ALERT_WINDOW_DAYS = 15; // Ver HU-10 y RF04: se avisa cuando faltan 15 dias o menos

/**
 * Recorre los contratos de mantenimiento activos y genera una alerta cuando
 * el vencimiento esta dentro de la ventana definida (15 dias), evitando duplicar
 * alertas que ya existan para el mismo contrato.
 */
async function checkMaintenanceAlerts() {
  const today = new Date();
  const limitDate = new Date();
  limitDate.setDate(today.getDate() + ALERT_WINDOW_DAYS);

  const contractsNearDue = await MaintenanceContract.find({
    status: { $in: ["Activo", "Por Vencer"] },
    dueDate: { $lte: limitDate },
  });

  let created = 0;

  for (const contract of contractsNearDue) {
    const existingAlert = await MaintenanceAlert.findOne({
      contract: contract._id,
      status: "Pendiente",
    });

    if (!existingAlert) {
      const daysLeft = Math.ceil((contract.dueDate - today) / (1000 * 60 * 60 * 24));
      const message =
        daysLeft >= 0
          ? `El servicio "${contract.service}" vence en ${daysLeft} dia(s).`
          : `El servicio "${contract.service}" ya se encuentra vencido.`;

      await MaintenanceAlert.create({
        contract: contract._id,
        client: contract.client,
        message,
        dueDate: contract.dueDate,
      });
      created += 1;
    }

    if (contract.status === "Activo") {
      contract.status = "Por Vencer";
      await contract.save();
    }

    if (contract.dueDate < today && contract.status !== "Vencido") {
      contract.status = "Vencido";
      await contract.save();
    }
  }

  return created;
}

module.exports = checkMaintenanceAlerts;
