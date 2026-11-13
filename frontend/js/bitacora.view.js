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
      // Buscador y paginacion del listado (correccion de evaluacion)
      searchQuery: "",
      currentPage: 1,
      pageSize: 6,
    };
  },
  computed: {
    filteredEntries() {
      const q = this.searchQuery.trim().toLowerCase();
      return this.entries.filter((e) => {
        const matchesClient = !this.filterClient || (e.client && e.client._id === this.filterClient);
        const matchesQuery =
          !q ||
          (e.description || "").toLowerCase().includes(q) ||
          (e.type || "").toLowerCase().includes(q) ||
          (e.client && e.client.name && e.client.name.toLowerCase().includes(q));
        return matchesClient && matchesQuery;
      });
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.filteredEntries.length / this.pageSize));
    },
    paginatedEntries() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredEntries.slice(start, start + this.pageSize);
    },
  },
  watch: {
    searchQuery() {
      this.currentPage = 1;
    },
    filterClient() {
      this.currentPage = 1;
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
    // Descarga la bitacora completa (HU-09). La peticion envia el token en el
    // encabezado Authorization, igual que el resto de la API, en lugar de
    // ponerlo en la URL.
    async exportar() {
      this.errorMsg = "";
      try {
        const response = await fetch(`${API_BASE_URL}/bitacora/exportar`, {
          headers: { Authorization: `Bearer ${ApiClient.getToken()}` },
        });
        if (!response.ok) {
          throw new Error(`No fue posible exportar la bitacora (${response.status})`);
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "bitacora_zenith.json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        this.errorMsg = error.message;
      }
    },
  },
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2 action-toolbar">
        <h4 class="mb-0"><i class="bi bi-journal-text me-2"></i>Bitacora Tecnica</h4>
        <div class="d-flex flex-wrap gap-2 action-buttons">
          <button class="btn btn-outline-secondary" @click="exportar">
            <i class="bi bi-download me-1"></i>Exportar bitacora
          </button>
          <button class="btn btn-primary" @click="openCreateModal">
            <i class="bi bi-plus-lg me-1"></i>Nueva interaccion
          </button>
        </div>
      </div>

      <div v-if="successMsg" class="alert alert-success py-2">{{ successMsg }}</div>
      <div v-if="errorMsg" class="alert alert-danger py-2">{{ errorMsg }}</div>
      <div v-if="message" class="alert alert-info py-2">{{ message }}</div>

      <div v-if="loading" class="text-center py-4"><span class="spinner-border"></span></div>

      <div v-else class="bg-white rounded shadow-sm p-2">
        <div class="d-flex flex-wrap gap-2 align-items-center p-2 table-toolbar">
          <div class="input-group input-group-sm" style="max-width: 300px">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input
              type="text"
              class="form-control"
              placeholder="Buscar por descripcion, tipo o cliente"
              v-model="searchQuery"
            />
          </div>
          <select class="form-select form-select-sm" style="max-width: 220px" v-model="filterClient">
            <option value="">Todos los clientes</option>
            <option v-for="c in clients" :key="c._id" :value="c._id">{{ c.name }}</option>
          </select>
          <span class="text-muted small ms-auto">{{ filteredEntries.length }} interaccion(es) encontrada(s)</span>
        </div>

        <div class="list-group list-group-flush">
          <div v-if="filteredEntries.length === 0" class="text-center text-muted py-4">
            No se encontraron interacciones con los filtros seleccionados
          </div>
          <div class="list-group-item" v-for="entry in paginatedEntries" :key="entry._id">
            <div class="d-flex justify-content-between flex-wrap gap-1">
              <div>
                <span class="badge bg-primary me-2">{{ entry.type }}</span>
                <strong>{{ entry.client ? entry.client.name : 'Cliente eliminado' }}</strong>
              </div>
              <small class="text-muted">{{ formatDate(entry.createdAt) }}</small>
            </div>
            <p class="mb-1 mt-2">{{ entry.description }}</p>
            <small class="text-muted">Registrado por: {{ $userLabel(entry.user) }}</small>
          </div>
        </div>

        <pagination-bar :current-page="currentPage" :total-pages="totalPages" @change="currentPage = $event"></pagination-bar>
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
                <div class="text-end action-buttons d-flex justify-content-end">
                  <button type="button" class="btn btn-secondary" @click="showModal = false">Cancelar</button>
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
