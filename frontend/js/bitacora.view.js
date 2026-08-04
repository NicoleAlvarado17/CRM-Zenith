// Componente: Modulo 3 - Bitacora Tecnica (HU-07, HU-08, HU-09)
const BitacoraView = {
  props: ["user"],
  data() {
    return {
      entries: [],
      clients: [],
      loading: false,
      errorMsg: "",
      successMsg: "",
      message: "",
      showModal: false,
      form: { client: "", type: "Reunion", description: "" },
      typeOptions: ["Reunion", "Llamada", "Correo", "Requerimiento", "Otro"],
      filterClient: "",
    };
  },
  computed: {
    filteredEntries() {
      if (!this.filterClient) return this.entries;
      return this.entries.filter((e) => e.client && e.client._id === this.filterClient);
    },
  },
  mounted() {
    this.loadEntries();
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
    async loadEntries() {
      this.loading = true;
      this.errorMsg = "";
      this.message = "";
      try {
        const data = await ApiClient.getBitacora();
        if (Array.isArray(data)) {
          this.entries = data;
        } else {
          this.entries = data.entries || [];
          this.message = data.message || "";
        }
      } catch (error) {
        this.errorMsg = error.message;
      } finally {
        this.loading = false;
      }
    },
    openCreateModal() {
      this.form = { client: this.clients[0] ? this.clients[0]._id : "", type: "Reunion", description: "" };
      this.showModal = true;
    },
    async saveEntry() {
      this.errorMsg = "";
      try {
        await ApiClient.createBitacoraEntry(this.form);
        this.successMsg = "Interaccion registrada correctamente";
        this.showModal = false;
        await this.loadEntries();
      } catch (error) {
        this.errorMsg = error.message;
      }
    },
    formatDate(dateStr) {
      return new Date(dateStr).toLocaleString("es-CR");
    },
    exportar() {
      window.open(
        `http://localhost:4000/api/bitacora/exportar?token=${ApiClient.getToken()}`,
        "_blank"
      );
    },
  },
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h4><i class="bi bi-journal-text me-2"></i>Bitacora Tecnica</h4>
        <div class="d-flex gap-2">
          <select class="form-select form-select-sm" v-model="filterClient" style="width:220px">
            <option value="">Todos los clientes</option>
            <option v-for="c in clients" :key="c._id" :value="c._id">{{ c.name }}</option>
          </select>
          <button class="btn btn-primary" @click="openCreateModal">
            <i class="bi bi-plus-lg"></i> Nueva interaccion
          </button>
        </div>
      </div>

      <div v-if="successMsg" class="alert alert-success py-2">{{ successMsg }}</div>
      <div v-if="errorMsg" class="alert alert-danger py-2">{{ errorMsg }}</div>
      <div v-if="message" class="alert alert-info py-2">{{ message }}</div>

      <div v-if="loading" class="text-center py-4"><span class="spinner-border"></span></div>

      <div v-else class="list-group shadow-sm">
        <div v-if="filteredEntries.length === 0" class="text-center text-muted py-4 bg-white rounded">
          No hay interacciones registradas
        </div>
        <div class="list-group-item" v-for="entry in filteredEntries" :key="entry._id">
          <div class="d-flex justify-content-between">
            <div>
              <span class="badge bg-primary me-2">{{ entry.type }}</span>
              <strong>{{ entry.client ? entry.client.name : 'Cliente eliminado' }}</strong>
            </div>
            <small class="text-muted">{{ formatDate(entry.createdAt) }}</small>
          </div>
          <p class="mb-1 mt-2">{{ entry.description }}</p>
          <small class="text-muted">Registrado por: {{ entry.user ? entry.user.name : 'N/D' }}</small>
        </div>
      </div>

      <!-- Modal nueva interaccion -->
      <div v-if="showModal" class="modal d-block" style="background: rgba(0,0,0,0.5)">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Registrar interaccion</h5>
              <button class="btn-close" @click="showModal = false"></button>
            </div>
            <div class="modal-body">
              <div v-if="errorMsg" class="alert alert-danger py-2">{{ errorMsg }}</div>
              <form @submit.prevent="saveEntry">
                <div class="mb-3">
                  <label class="form-label">Cliente *</label>
                  <select class="form-select" v-model="form.client" required>
                    <option v-for="c in clients" :key="c._id" :value="c._id">{{ c.name }}</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">Tipo de interaccion</label>
                  <select class="form-select" v-model="form.type">
                    <option v-for="t in typeOptions" :key="t" :value="t">{{ t }}</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">Descripcion / minuta *</label>
                  <textarea class="form-control" rows="4" v-model="form.description" required></textarea>
                </div>
                <div class="text-end">
                  <button type="button" class="btn btn-secondary me-2" @click="showModal = false">Cancelar</button>
                  <button type="submit" class="btn btn-primary">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
};
