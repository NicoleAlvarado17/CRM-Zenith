// Componente: Modulo 4 - Alertas de Mantenimiento (HU-10, HU-11, HU-12)
const AlertsView = {
  props: ["user"],
  data() {
    return {
      alerts: [],
      contracts: [],
      clients: [],
      loading: false,
      errorMsg: "",
      successMsg: "",
      message: "",
      sortByDate: false,
      showContractModal: false,
      contractForm: { client: "", service: "", dueDate: "" },
    };
  },
  computed: {
    isAdmin() {
      return this.user.role === "administrador";
    },
  },
  mounted() {
    this.loadAlerts();
    this.loadContracts();
    this.loadClients();
  },
  methods: {
    async loadClients() {
      try {
        this.clients = await ApiClient.getClients();
      } catch (error) {
        this.errorMsg = error.message;
      }
    },
    async loadContracts() {
      try {
        this.contracts = await ApiClient.getContracts();
      } catch (error) {
        this.errorMsg = error.message;
      }
    },
    async loadAlerts() {
      this.loading = true;
      this.message = "";
      try {
        const data = await ApiClient.getAlerts(this.sortByDate ? "dueDate" : null);
        if (Array.isArray(data)) {
          this.alerts = data;
        } else {
          this.alerts = data.alerts || [];
          this.message = data.message || "";
        }
      } catch (error) {
        this.errorMsg = error.message;
      } finally {
        this.loading = false;
      }
    },
    async toggleSort() {
      this.sortByDate = !this.sortByDate;
      await this.loadAlerts();
    },
    async generarAlertas() {
      this.errorMsg = "";
      try {
        const res = await ApiClient.generateAlerts();
        this.successMsg = res.message;
        await this.loadAlerts();
        await this.loadContracts();
      } catch (error) {
        this.errorMsg = error.message;
      }
    },
    async resolverAlerta(alert) {
      try {
        await ApiClient.resolveAlert(alert._id);
        await this.loadAlerts();
      } catch (error) {
        this.errorMsg = error.message;
      }
    },
    openContractModal() {
      this.contractForm = { client: this.clients[0] ? this.clients[0]._id : "", service: "", dueDate: "" };
      this.showContractModal = true;
    },
    async saveContract() {
      this.errorMsg = "";
      try {
        await ApiClient.createContract(this.contractForm);
        this.successMsg = "Contrato de mantenimiento registrado correctamente";
        this.showContractModal = false;
        await this.loadContracts();
      } catch (error) {
        this.errorMsg = error.message;
      }
    },
    diasRestantes(dueDate) {
      const hoy = new Date();
      const venc = new Date(dueDate);
      return Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));
    },
    formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString("es-CR");
    },
    statusClass(status) {
      if (status === "Vencido") return "text-bg-danger";
      if (status === "Por Vencer") return "text-bg-warning";
      if (status === "Renovado") return "text-bg-success";
      return "text-bg-secondary";
    },
  },
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h4><i class="bi bi-bell-fill me-2"></i>Alertas de Mantenimiento</h4>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" @click="toggleSort">
            <i class="bi bi-sort-down"></i> Ordenar por vencimiento
          </button>
          <button class="btn btn-outline-primary" @click="openContractModal">
            <i class="bi bi-plus-lg"></i> Nuevo contrato
          </button>
          <button v-if="isAdmin" class="btn btn-primary" @click="generarAlertas">
            <i class="bi bi-arrow-repeat"></i> Generar alertas ahora
          </button>
        </div>
      </div>

      <div v-if="successMsg" class="alert alert-success py-2">{{ successMsg }}</div>
      <div v-if="errorMsg" class="alert alert-danger py-2">{{ errorMsg }}</div>

      <div class="row">
        <div class="col-md-7">
          <h6>Alertas pendientes</h6>
          <div v-if="message" class="alert alert-info py-2">{{ message }}</div>
          <div v-if="loading" class="text-center py-3"><span class="spinner-border"></span></div>
          <div v-else>
            <div v-if="alerts.length === 0" class="text-center text-muted py-3 bg-white rounded">
              No hay alertas disponibles
            </div>
            <div
              class="card mb-2 p-2 alert-card"
              :class="diasRestantes(alert.dueDate) < 0 ? 'vencido' : 'pendiente'"
              v-for="alert in alerts"
              :key="alert._id"
            >
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <strong>{{ alert.client ? alert.client.name : 'Cliente eliminado' }}</strong>
                  <div class="small">{{ alert.message }}</div>
                  <div class="small text-muted">Vence: {{ formatDate(alert.dueDate) }}</div>
                </div>
                <div class="text-end">
                  <span class="badge" :class="alert.status === 'Atendida' ? 'text-bg-success' : 'text-bg-warning'">
                    {{ alert.status }}
                  </span>
                  <div v-if="alert.status === 'Pendiente'" class="mt-1">
                    <button class="btn btn-sm btn-outline-success" @click="resolverAlerta(alert)">
                      Marcar atendida
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-5">
          <h6>Contratos de mantenimiento</h6>
          <div class="list-group">
            <div v-if="contracts.length === 0" class="text-center text-muted py-3 bg-white rounded">
              No hay contratos registrados
            </div>
            <div class="list-group-item" v-for="c in contracts" :key="c._id">
              <div class="d-flex justify-content-between">
                <span>{{ c.client ? c.client.name : 'N/D' }} - {{ c.service }}</span>
                <span class="badge" :class="statusClass(c.status)">{{ c.status }}</span>
              </div>
              <small class="text-muted">Vence: {{ formatDate(c.dueDate) }}</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal nuevo contrato -->
      <div v-if="showContractModal" class="modal d-block" style="background: rgba(0,0,0,0.5)">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Nuevo contrato de mantenimiento</h5>
              <button class="btn-close" @click="showContractModal = false"></button>
            </div>
            <div class="modal-body">
              <div v-if="errorMsg" class="alert alert-danger py-2">{{ errorMsg }}</div>
              <form @submit.prevent="saveContract">
                <div class="mb-3">
                  <label class="form-label">Cliente *</label>
                  <select class="form-select" v-model="contractForm.client" required>
                    <option v-for="c in clients" :key="c._id" :value="c._id">{{ c.name }}</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">Servicio *</label>
                  <input class="form-control" v-model="contractForm.service" required placeholder="Ej: Mantenimiento preventivo mensual" />
                </div>
                <div class="mb-3">
                  <label class="form-label">Fecha de vencimiento *</label>
                  <input type="date" class="form-control" v-model="contractForm.dueDate" required />
                </div>
                <div class="text-end">
                  <button type="button" class="btn btn-secondary me-2" @click="showContractModal = false">Cancelar</button>
                  <button type="submit" class="btn btn-primary">Guardar contrato</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
};
