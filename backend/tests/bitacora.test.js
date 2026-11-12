const request = require("supertest");
const { fakeQuery, mockAuthUser } = require("./mocks");
const BitacoraEntry = require("../models/BitacoraEntry");
const app = require("../app");

afterEach(() => jest.clearAllMocks());

describe("Modulo de Bitacora Tecnica (HU-07, HU-08, HU-09)", () => {
  it("un tecnico puede registrar una interaccion (HU-07)", async () => {
    const token = mockAuthUser({ role: "tecnico" });
    BitacoraEntry.create.mockImplementation(async (data) => ({ _id: "b1", ...data }));

    const res = await request(app)
      .post("/api/bitacora")
      .set("Authorization", `Bearer ${token}`)
      .send({ client: "cliente1", type: "Llamada", description: "Se coordina visita tecnica" });

    expect(res.statusCode).toBe(201);
    expect(res.body.description).toBe("Se coordina visita tecnica");
  });

  it("un comercial no puede registrar interacciones de bitacora", async () => {
    const token = mockAuthUser({ role: "comercial" });

    const res = await request(app)
      .post("/api/bitacora")
      .set("Authorization", `Bearer ${token}`)
      .send({ client: "cliente1", description: "No deberia poder registrar esto" });

    expect(res.statusCode).toBe(403);
  });

  it("exige cliente y descripcion al registrar una interaccion", async () => {
    const token = mockAuthUser({ role: "administrador" });

    const res = await request(app)
      .post("/api/bitacora")
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "Llamada" });

    expect(res.statusCode).toBe(400);
  });

  it("filtra las interacciones por cliente (HU-08)", async () => {
    const token = mockAuthUser({ role: "tecnico" });
    BitacoraEntry.find.mockReturnValue(fakeQuery([{ _id: "e1", description: "Interaccion con cliente A" }]));

    const res = await request(app)
      .get("/api/bitacora/client/cliente1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(BitacoraEntry.find).toHaveBeenCalledWith({ client: "cliente1" });
  });

  it("lista todas las interacciones registradas (HU-09)", async () => {
    const token = mockAuthUser({ role: "administrador" });
    BitacoraEntry.find.mockReturnValue(fakeQuery([{ _id: "e1" }, { _id: "e2" }]));

    const res = await request(app).get("/api/bitacora").set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it("exporta la bitacora como archivo descargable (HU-09)", async () => {
    const token = mockAuthUser({ role: "tecnico" });
    BitacoraEntry.find.mockReturnValue(fakeQuery([{ _id: "e1", description: "Visita tecnica" }]));

    const res = await request(app)
      .get("/api/bitacora/exportar")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-disposition"]).toContain("bitacora_zenith.json");
    expect(JSON.parse(res.text)).toHaveLength(1);
  });

  it("no permite exportar la bitacora sin token", async () => {
    const res = await request(app).get("/api/bitacora/exportar");
    expect(res.statusCode).toBe(401);
  });

  it("un comercial no puede consultar la bitacora", async () => {
    const token = mockAuthUser({ role: "comercial" });

    const res = await request(app).get("/api/bitacora").set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
  });
});
