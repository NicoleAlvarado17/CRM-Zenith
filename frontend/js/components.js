// Componente: Pantalla de inicio de sesion
const LoginView = {
  props: ["onLoginSuccess"],
  data() {
    return {
      email: "",
      password: "",
      errorMsg: "",
      loading: false,
    };
  },
  methods: {
    async handleLogin() {
      this.errorMsg = "";
      this.loading = true;
      try {
        const data = await ApiClient.login(this.email, this.password);
        ApiClient.setSession(data.token, data.user);
        this.onLoginSuccess(data.user);
      } catch (error) {
        this.errorMsg = error.message || "No fue posible iniciar sesion";
      } finally {
        this.loading = false;
      }
    },
  },
  template: `
    <div class="login-wrapper">
      <div class="card login-card p-4">
        <div class="text-center mb-3">
          <i class="bi bi-diagram-3-fill brand-icon"></i>
          <h3 class="mt-2 mb-0 fw-bold">CRM Zenith</h3>
          <small class="text-muted">Zenith Soluciones Digitales</small>
        </div>
        <form @submit.prevent="handleLogin">
          <div class="mb-3">
            <label class="form-label">Correo electronico</label>
            <input type="email" class="form-control" v-model="email" required autofocus />
          </div>
          <div class="mb-3">
            <label class="form-label">Contrasena</label>
            <input type="password" class="form-control" v-model="password" required />
          </div>
          <div v-if="errorMsg" class="alert alert-danger py-2">{{ errorMsg }}</div>
          <button type="submit" class="btn btn-primary w-100" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            Ingresar
          </button>
        </form>
        <hr />
        <small class="text-muted d-block text-center">
          Usuarios de prueba (creados con <code>npm run seed</code>):<br />
          admin@zenith.com / Admin123!<br />
          tecnico@zenith.com / Tecnico123!<br />
          comercial@zenith.com / Comercial123!
        </small>
      </div>
    </div>
  `,
};

// Componente: barra de navegacion superior
const NavBar = {
  props: ["user", "currentView", "onNavigate", "onLogout"],
  computed: {
    tabs() {
      const all = [
        { key: "clientes", label: "Clientes", icon: "bi-people-fill", roles: ["administrador", "tecnico", "comercial"] },
        { key: "pipeline", label: "Pipeline Comercial", icon: "bi-kanban-fill", roles: ["administrador", "comercial"] },
        { key: "bitacora", label: "Bitacora Tecnica", icon: "bi-journal-text", roles: ["administrador", "tecnico"] },
        { key: "alertas", label: "Alertas de Mantenimiento", icon: "bi-bell-fill", roles: ["administrador", "tecnico"] },
        { key: "reportes", label: "Reportes", icon: "bi-bar-chart-fill", roles: ["administrador"] },
      ];
      return all.filter((tab) => tab.roles.includes(this.user.role));
    },
  },
  template: `
    <nav class="navbar navbar-expand-lg navbar-zenith px-3 mb-4 shadow-sm">
      <span class="navbar-brand fw-bold">
        <i class="bi bi-diagram-3-fill me-2"></i>CRM Zenith
      </span>
      <div class="d-flex flex-wrap gap-1">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="btn btn-sm nav-link"
          :class="{ active: currentView === tab.key }"
          @click="onNavigate(tab.key)"
        >
          <i :class="'bi ' + tab.icon + ' me-1'"></i>{{ tab.label }}
        </button>
      </div>
      <div class="ms-auto d-flex align-items-center text-white">
        <span class="badge bg-light text-dark role-badge me-2">{{ user.role }}</span>
        <span class="me-3">{{ user.name }}</span>
        <button class="btn btn-sm btn-outline-light" @click="onLogout">
          <i class="bi bi-box-arrow-right"></i> Salir
        </button>
      </div>
    </nav>
  `,
};
