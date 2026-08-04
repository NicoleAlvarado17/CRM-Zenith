// Modulo centralizado de comunicacion con el backend (API REST).
// Ver seccion 4.5.1 del Documento de Arquitectura: interfaz Frontend <-> Backend.

const API_BASE_URL = "http://localhost:4000/api";

const ApiClient = {
  getToken() {
    return localStorage.getItem("zenith_token");
  },

  setSession(token, user) {
    localStorage.setItem("zenith_token", token);
    localStorage.setItem("zenith_user", JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem("zenith_token");
    localStorage.removeItem("zenith_user");
  },

  getUser() {
    const raw = localStorage.getItem("zenith_user");
    return raw ? JSON.parse(raw) : null;
  },

  async request(path, { method = "GET", body = null } = {}) {
    const headers = { "Content-Type": "application/json" };
    const token = this.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    let data = null;
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }

    if (!response.ok) {
      const message =
        (data && (data.message || (data.errors && data.errors.join(", ")))) ||
        `Error en la solicitud (${response.status})`;
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }

    return data;
  },

  // --- Autenticacion ---
  login(email, password) {
    return this.request("/auth/login", { method: "POST", body: { email, password } });
  },
  me() {
    return this.request("/auth/me");
  },

  // --- Clientes (Modulo 1) ---
  getClients() {
    return this.request("/clients");
  },
  getClient(id) {
    return this.request(`/clients/${id}`);
  },
  getClientHistorial(id) {
    return this.request(`/clients/${id}/historial`);
  },
  createClient(payload) {
    return this.request("/clients", { method: "POST", body: payload });
  },
  updateClient(id, payload) {
    return this.request(`/clients/${id}`, { method: "PUT", body: payload });
  },
  deleteClient(id) {
    return this.request(`/clients/${id}`, { method: "DELETE" });
  },

  // --- Pipeline Comercial (Modulo 2) ---
  getPipeline() {
    return this.request("/opportunities/pipeline");
  },
  getOpportunities() {
    return this.request("/opportunities");
  },
  createOpportunity(payload) {
    return this.request("/opportunities", { method: "POST", body: payload });
  },
  updateOpportunityStage(id, stage) {
    return this.request(`/opportunities/${id}/stage`, { method: "PUT", body: { stage } });
  },
  deleteOpportunity(id) {
    return this.request(`/opportunities/${id}`, { method: "DELETE" });
  },

  // --- Bitacora Tecnica (Modulo 3) ---
  getBitacora() {
    return this.request("/bitacora");
  },
  getBitacoraByClient(clientId) {
    return this.request(`/bitacora/client/${clientId}`);
  },
  createBitacoraEntry(payload) {
    return this.request("/bitacora", { method: "POST", body: payload });
  },

  // --- Contratos y Alertas de Mantenimiento (Modulo 4) ---
  getContracts() {
    return this.request("/contracts");
  },
  createContract(payload) {
    return this.request("/contracts", { method: "POST", body: payload });
  },
  renewContract(id, newDueDate) {
    return this.request(`/contracts/${id}/renovar`, { method: "PUT", body: { newDueDate } });
  },
  getAlerts(sort) {
    return this.request(`/alerts${sort ? `?sort=${sort}` : ""}`);
  },
  generateAlerts() {
    return this.request("/alerts/generate", { method: "POST" });
  },
  resolveAlert(id) {
    return this.request(`/alerts/${id}/atender`, { method: "PUT" });
  },

  // --- Reportes (Modulo 5) ---
  getSalesReport() {
    return this.request("/reports/sales");
  },
  getMaintenanceReport() {
    return this.request("/reports/maintenance");
  },
  getActiveOpportunitiesReport() {
    return this.request("/reports/opportunities");
  },
};
