const request = require("supertest");
const { fakeQuery, mockAuthUser } = require("./mocks");
const MaintenanceAlert = require("../models/MaintenanceAlert");
const MaintenanceContract = require("../models/MaintenanceContract");
const app = require("../app");

afterEach(() => jest.clearAllMocks());

describe("Modulo de Alertas de Mantenimiento (HU-10, HU-11, HU-12)", () => {
  it("genera una alerta para un contrato proximo a vencer (HU-10)", async () => {
    const token = mockAuthUser({ role: "administrador" });

    const contratoFalso = {
      _id: "c1",
      client: "cliente1",
      service: "Mantenimiento preventivo",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: "Activo",
      save: jest.fn().mockResolvedValue(true),
    };

    MaintenanceContract.find.mockResolvedValue([contratoFalso]);
    MaintenanceAlert.findOne.mockResolvedValue(null);
    MaintenanceAlert.create.mockResolvedValue({ _id: "a1", status: "Pendiente" });

    const res = await request(app)
      .post("/api/alerts/generate")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(MaintenanceAlert.create).toHaveBeenCalledTimes(1);
    expect(contratoFalso.save).toHaveBeenCalled();
  });

  it("un tecnico no puede disparar la generacion manual de alertas", async () => {
    const token = mockAuthUser({ role: "tecnico" });

    const res = await request(app)
      .post("/api/alerts/generate")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
  });

  it("no genera alertas duplicadas para el mismo contrato (HU-12)", async () => {
    const token = mockAuthUser({ role: "administrador" });

    const contratoFalso = {
      _id: "c1",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: "Activo",
      save: jest.fn().mockResolvedValue(true),
    };

    MaintenanceContract.find.mockResolvedValue([contratoFalso]);
    MaintenanceAlert.findOne.mockResolvedValue({ _id: "alerta-existente", status: "Pendiente" });

    const res = await request(app)
      .post("/api/alerts/generate")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(MaintenanceAlert.create).not.toHaveBeenCalled();
  });

  it("permite marcar una alerta como atendida (HU-11)", async () => {
    const token = mockAuthUser({ role: "tecnico" });

    const alertaFalsa = {
      _id: "a1",
      status: "Pendiente",
      save: jest.fn().mockResolvedValue(true),
    };
    MaintenanceAlert.findById.mockResolvedValue(alertaFalsa);

    const res = await request(app)
      .put("/api/alerts/a1/atender")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(alertaFalsa.status).toBe("Atendida");
    expect(alertaFalsa.save).toHaveBeenCalled();
  });

  it("lista las alertas existentes", async () => {
    const token = mockAuthUser({ role: "administrador" });
    MaintenanceAlert.find.mockReturnValue(fakeQuery([{ _id: "a1" }]));

    const res = await request(app).get("/api/alerts").set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});
