// Centraliza el mockeo de los modelos de Mongoose para las pruebas de las rutas.
// Las pruebas no dependen de una base de datos real (ni local ni mongodb-memory-server):
// esto permite correr "npm test" en cualquier maquina, incluso sin conexion a internet.
jest.mock("../models/User");
jest.mock("../models/Client");
jest.mock("../models/BitacoraEntry");
jest.mock("../models/MaintenanceContract");
jest.mock("../models/MaintenanceAlert");
jest.mock("../models/AuditLog");

const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const jwt = require("jsonwebtoken");

// El registro de auditoria no es relevante para estas pruebas; se deja resuelto
// para que no truene al ejecutarse dentro de cada ruta.
AuditLog.create.mockResolvedValue({ _id: "auditlog-fake" });

// Simula un usuario autenticado de un rol determinado y devuelve un token JWT
// valido para usarlo en el header Authorization de las pruebas.
function mockAuthUser({ id = "64b000000000000000000001", role, active = true } = {}) {
  User.findById.mockResolvedValue({ _id: id, role, active, name: "Usuario de prueba" });
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });
}

// Simula el objeto encadenable que devuelven las consultas de Mongoose
// (find().populate().sort(), findOne().select(), etc.), resolviendo en "result".
function fakeQuery(result) {
  const query = {};
  query.populate = jest.fn(() => query);
  query.sort = jest.fn(() => query);
  query.select = jest.fn(() => query);
  query.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  query.catch = (reject) => Promise.resolve(result).catch(reject);
  return query;
}

module.exports = { mockAuthUser, fakeQuery };
