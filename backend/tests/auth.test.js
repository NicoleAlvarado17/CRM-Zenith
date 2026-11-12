const request = require("supertest");
const { fakeQuery } = require("./mocks");
const User = require("../models/User");
const app = require("../app");

afterEach(() => jest.clearAllMocks());

describe("POST /api/auth/login", () => {
  it("devuelve un token y los datos del usuario con credenciales correctas", async () => {
    const fakeUser = {
      _id: "64b000000000000000000002",
      name: "Admin de prueba",
      email: "admin@test.com",
      role: "administrador",
      active: true,
      comparePassword: jest.fn().mockResolvedValue(true),
    };
    User.findOne.mockReturnValue(fakeQuery(fakeUser));

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@test.com", password: "Admin123!" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.email).toBe("admin@test.com");
    expect(res.body.user.role).toBe("administrador");
  });

  it("rechaza una contrasena incorrecta", async () => {
    const fakeUser = {
      _id: "64b000000000000000000002",
      active: true,
      comparePassword: jest.fn().mockResolvedValue(false),
    };
    User.findOne.mockReturnValue(fakeQuery(fakeUser));

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@test.com", password: "contrasena-incorrecta" });

    expect(res.statusCode).toBe(401);
  });

  it("rechaza un correo que no existe", async () => {
    User.findOne.mockReturnValue(fakeQuery(null));

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "noexiste@test.com", password: "Admin123!" });

    expect(res.statusCode).toBe(401);
  });

  it("exige correo y contrasena", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "admin@test.com" });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/auth/me", () => {
  it("rechaza la peticion si no se envia un token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.statusCode).toBe(401);
  });
});
