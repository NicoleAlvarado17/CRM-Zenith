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
      <div class="d-flex flex-wrap gap-2 nav-tabs-wrapper">
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
        <span v-if="user.role === 'administrador'" class="me-3 text-nowrap">{{ user.name }}</span>
        <button class="btn btn-sm btn-outline-light" @click="onLogout">
          <i class="bi bi-box-arrow-right"></i> Salir
        </button>
      </div>
    </nav>
  `,
};

// Componente reutilizable: barra de paginacion.
// Se usa en los listados/tablas de los distintos modulos (clientes, bitacora,
// alertas, reportes) para no repetir la misma logica de botones en cada vista.
const PaginationBar = {
  props: {
    currentPage: { type: Number, required: true },
    totalPages: { type: Number, required: true },
  },
  emits: ["change"],
  computed: {
    pages() {
      const pages = [];
      for (let p = 1; p <= this.totalPages; p++) pages.push(p);
      return pages;
    },
  },
  template: `
    <nav v-if="totalPages > 1" class="d-flex justify-content-center mt-3" aria-label="Paginacion">
      <ul class="pagination pagination-sm mb-0 flex-wrap justify-content-center">
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <button class="page-link" @click="$emit('change', currentPage - 1)" aria-label="Pagina anterior">
            <i class="bi bi-chevron-left"></i>
          </button>
        </li>
        <li class="page-item" v-for="p in pages" :key="p" :class="{ active: p === currentPage }">
          <button class="page-link" @click="$emit('change', p)">{{ p }}</button>
        </li>
        <li class="page-item" :class="{ disabled: currentPage === totalPages }">
          <button class="page-link" @click="$emit('change', currentPage + 1)" aria-label="Pagina siguiente">
            <i class="bi bi-chevron-right"></i>
          </button>
        </li>
      </ul>
    </nav>
  `,
};
