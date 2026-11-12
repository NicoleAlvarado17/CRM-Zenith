const request = require("supertest");
const { fakeQuery, mockAuthUser } = require("./mocks");
const Client = require("../models/Client");
const app = require("../app");

afterEach(() => jest.clearAllMocks());

describe("Modulo de Clientes (HU-01, HU-02)", () => {
  it("un usuario comercial puede registrar un cliente nuevo", async () => {
    const token = mockAuthUser({ role: "comercial" });
    Client.findOne.mockReturnValue(fakeQuery(null));
    Client.create.mockImplementation(async (data) => ({ _id: "64b000000000000000000010", ...data }));

    const res = await request(app)
      .post("/api/clients")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Soda La Esquina", email: "contacto@sodaesquina.com", phone: "8888-1234" });

    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe("Soda La Esquina");
  });

  it("un usuario tecnico no puede registrar clientes", async () => {
    const token = mockAuthUser({ role: "tecnico" });

    const res = await request(app)
      .post("/api/clients")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Cliente no autorizado", email: "cliente@test.com", phone: "1111" });

    expect(res.statusCode).toBe(403);
  });

  it("rechaza un correo de cliente duplicado", async () => {
    const token = mockAuthUser({ role: "administrador" });
    Client.findOne.mockReturnValue(fakeQuery({ _id: "existente", email: "duplicado@test.com" }));

    const res = await request(app)
      .post("/api/clients")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Cliente Dos", email: "duplicado@test.com", phone: "3333" });

    expect(res.statusCode).toBe(409);
  });

  it("exige un token valido para listar clientes", async () => {
    const res = await request(app).get("/api/clients");
    expect(res.statusCode).toBe(401);
  });

  it("lista los clientes registrados", async () => {
    const token = mockAuthUser({ role: "comercial" });
    Client.find.mockReturnValue(fakeQuery([{ _id: "1", name: "Cliente A" }]));

    const res = await request(app).get("/api/clients").set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});
