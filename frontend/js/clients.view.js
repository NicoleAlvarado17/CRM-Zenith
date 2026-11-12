// Componente: Modulo 1 - Gestion de Clientes (HU-01, HU-02, HU-03)
const ClientsView = {
  props: ["user"],
  data() {
    return {
      clients: [],
      loading: false,
      errorMsg: "",
      successMsg: "",
      showModal: false,
      editingClient: null,
      form: this.emptyForm(),
      servicesOptions: ["Pagina Web", "Sistema a la Medida", "Codigo QR", "Hosting", "Mantenimiento"],
      historial: null,
      showHistorial: false,
      historialClientName: "",
      // Busqueda, filtro y paginacion del listado (correccion de evaluacion)
      searchQuery: "",
      filterService: "",
      currentPage: 1,
      pageSize: 8,
    };
  },
  computed: {
    canEdit() {
      return ["administrador", "comercial"].includes(this.user.role);
    },
    canDelete() {
      return this.user.role === "administrador";
    },
    filteredClients() {
      const q = this.searchQuery.trim().toLowerCase();
      return this.clients.filter((client) => {
        const matchesQuery =
          !q ||
          client.name.toLowerCase().includes(q) ||
          (client.contactName || "").toLowerCase().includes(q) ||
          client.email.toLowerCase().includes(q) ||
          (client.phone || "").toLowerCase().includes(q);
        const matchesService =
          !this.filterService || (client.servicesContracted || []).includes(this.filterService);
        return matchesQuery && matchesService;
      });
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.filteredClients.length / this.pageSize));
    },
    paginatedClients() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredClients.slice(start, start + this.pageSize);
    },
  },
  watch: {
    searchQuery() {
      this.currentPage = 1;
    },
    filterService() {
      this.currentPage = 1;
    },
  },
  mounted() {
    this.loadClients();
  },
  methods: {
    emptyForm() {
      return {
        name: "",
        contactName: "",
        email: "",
        phone: "",
        businessType: "",
        servicesContracted: [],
        notes: "",
      };
    },
    async loadClients() {
      this.loading = true;
      this.errorMsg = "";
      try {
        this.clients = await ApiClient.getClients();
      } catch (error) {
        this.errorMsg = error.message;
      } finally {
        this.loading = false;
      }
    },
    openCreateModal() {
      this.editingClient = null;
      this.form = this.emptyForm();
      this.showModal = true;
    },
    openEditModal(client) {
      this.editingClient = client;
      this.form = {
        name: client.name,
        contactName: client.contactName || "",
        email: client.email,
        phone: client.phone,
        businessType: client.businessType || "",
        servicesContracted: [...(client.servicesContracted || [])],
        notes: client.notes || "",
      };
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
      this.errorMsg = "";
    },
    async saveClient() {
      this.errorMsg = "";
      this.successMsg = "";
      try {
        if (this.editingClient) {
          await ApiClient.updateClient(this.editingClient._id, this.form);
          this.successMsg = "Cliente actualizado correctamente";
        } else {
          await ApiClient.createClient(this.form);
          this.successMsg = "Cliente registrado correctamente";
        }
        this.showModal = false;
        await this.loadClients();
      } catch (error) {
        this.errorMsg = error.message;
      }
    },
    async removeClient(client) {
      if (!confirm(`Esta seguro de eliminar al cliente "${client.name}"?`)) return;
      try {
        await ApiClient.deleteClient(client._id);
        await this.loadClients();
      } catch (error) {
        this.errorMsg = error.message;
      }
    },
    async viewHistorial(client) {
      this.historialClientName = client.name;
      this.historial = null;
      this.showHistorial = true;
      try {
        this.historial = await ApiClient.getClientHistorial(client._id);
      } catch (error) {
        this.errorMsg = error.message;
        this.showHistorial = false;
      }
    },
    formatDate(dateStr) {
      if (!dateStr) return "-";
      return new Date(dateStr).toLocaleDateString("es-CR");
    },
  },
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2 action-toolbar">
        <h4 class="mb-0"><i class="bi bi-people-fill me-2"></i>Gestion de Clientes</h4>
        <button v-if="canEdit" class="btn btn-primary" @click="openCreateModal">
          <i class="bi bi-plus-lg"></i> Nuevo cliente
        </button>
      </div>

      <div v-if="successMsg" class="alert alert-success py-2">{{ successMsg }}</div>
      <div v-if="errorMsg" class="alert alert-danger py-2">{{ errorMsg }}</div>

      <div v-if="loading" class="text-center py-4">
        <span class="spinner-border"></span>
      </div>

      <div v-else class="bg-white rounded shadow-sm p-2">
        <!-- Buscador y filtro (correccion de evaluacion: toda tabla debe tener buscador y filtros) -->
        <div class="d-flex flex-wrap gap-2 align-items-center p-2 table-toolbar">
          <div class="input-group input-group-sm" style="max-width: 300px">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input
              type="text"
              class="form-control"
              placeholder="Buscar por nombre, correo o telefono"
              v-model="searchQuery"
            />
          </div>
          <select class="form-select form-select-sm" style="max-width: 220px" v-model="filterService">
            <option value="">Todos los servicios</option>
            <option v-for="s in servicesOptions" :key="s" :value="s">{{ s }}</option>
          </select>
          <span class="text-muted small ms-auto">{{ filteredClients.length }} cliente(s) encontrado(s)</span>
        </div>

        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Contacto</th>
                <th>Correo</th>
                <th>Telefono</th>
                <th>Servicios</th>
                <th class="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredClients.length === 0">
                <td colspan="6" class="text-center text-muted py-3">
                  No se encontraron clientes con los filtros seleccionados
                </td>
              </tr>
              <tr v-for="client in paginatedClients" :key="client._id">
                <td class="fw-semibold">{{ client.name }}</td>
                <td>{{ client.contactName || '-' }}</td>
                <td>{{ client.email }}</td>
                <td>{{ client.phone }}</td>
                <td>
                  <span v-for="s in client.servicesContracted" :key="s" class="badge bg-secondary me-1">{{ s }}</span>
                </td>
                <td class="text-end">
                  <div class="d-flex action-buttons">
                    <button class="btn btn-sm btn-outline-info" @click="viewHistorial(client)">
                      <i class="bi bi-clock-history me-1"></i>Historial
                    </button>
                    <button v-if="canEdit" class="btn btn-sm btn-outline-primary" @click="openEditModal(client)">
                      <i class="bi bi-pencil-fill me-1"></i>Editar
                    </button>
                    <button v-if="canDelete" class="btn btn-sm btn-outline-danger" @click="removeClient(client)">
                      <i class="bi bi-trash-fill me-1"></i>Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <pagination-bar :current-page="currentPage" :total-pages="totalPages" @change="currentPage = $event"></pagination-bar>
      </div>

      <!-- Modal crear/editar cliente -->
      <div v-if="showModal" class="modal d-block" style="background: rgba(0,0,0,0.5)">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ editingClient ? 'Editar cliente' : 'Registrar nuevo cliente' }}</h5>
              <button class="btn-close" @click="closeModal"></button>
            </div>
            <div class="modal-body">
              <div v-if="errorMsg" class="alert alert-danger py-2">{{ errorMsg }}</div>
              <form @submit.prevent="saveClient">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Nombre del cliente *</label>
                    <input class="form-control" v-model="form.name" required />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Nombre de contacto</label>
                    <input class="form-control" v-model="form.contactName" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Correo *</label>
                    <input type="email" class="form-control" v-model="form.email" required />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Telefono *</label>
                    <input class="form-control" v-model="form.phone" required />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Tipo de negocio</label>
                    <input class="form-control" v-model="form.businessType" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Servicios contratados</label>
                    <select class="form-select" multiple v-model="form.servicesContracted">
                      <option v-for="s in servicesOptions" :key="s" :value="s">{{ s }}</option>
                    </select>
                  </div>
                  <div class="col-12">
                    <label class="form-label">Notas</label>
                    <textarea class="form-control" v-model="form.notes" rows="2"></textarea>
                  </div>
                </div>
                <div class="mt-4 text-end action-buttons d-flex justify-content-end">
                  <button type="button" class="btn btn-secondary" @click="closeModal">Cancelar</button>
                  <button type="submit" class="btn btn-primary">Guardar cliente</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal historial tecnico (HU-03) -->
      <div v-if="showHistorial" class="modal d-block" style="background: rgba(0,0,0,0.5)">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Historial tecnico: {{ historialClientName }}</h5>
              <button class="btn-close" @click="showHistorial = false"></button>
            </div>
            <div class="modal-body">
              <div v-if="!historial" class="text-center py-3"><span class="spinner-border"></span></div>
              <div v-else>
                <p v-if="historial.message" class="text-muted">{{ historial.message }}</p>

                <h6 class="mt-2">Contratos de mantenimiento</h6>
                <ul class="list-group mb-3" v-if="historial.contracts && historial.contracts.length">
                  <li class="list-group-item d-flex justify-content-between" v-for="c in historial.contracts" :key="c._id">
                    <span>{{ c.service }}</span>
                    <span class="badge bg-info">Vence: {{ formatDate(c.dueDate) }}</span>
                  </li>
                </ul>
                <p v-else class="text-muted">Sin contratos de mantenimiento registrados.</p>

                <h6>Bitacora de interacciones</h6>
                <ul class="list-group" v-if="historial.bitacora && historial.bitacora.length">
                  <li class="list-group-item" v-for="b in historial.bitacora" :key="b._id">
                    <strong>{{ b.type }}</strong> - {{ formatDate(b.createdAt) }}
                    <div class="text-muted small">{{ b.description }}</div>
                    <div class="small">Registrado por: {{ b.user ? b.user.name : 'N/D' }}</div>
                  </li>
                </ul>
                <p v-else class="text-muted">Sin interacciones registradas.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
};
