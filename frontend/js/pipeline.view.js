// Componente: Modulo 2 - Pipeline Comercial (HU-04, HU-05, HU-06)
const PipelineView = {
  props: ["user"],
  data() {
    return {
      pipeline: {},
      stages: ["Contacto Inicial", "Cotizado", "En Negociacion", "Ganado", "Perdido"],
      clients: [],
      loading: false,
      errorMsg: "",
      successMsg: "",
      showModal: false,
      form: { client: "", title: "", serviceType: "Pagina Web", amount: 0 },
      serviceOptions: ["Pagina Web", "Sistema a la Medida", "Codigo QR", "Hosting", "Mantenimiento"],
      message: "",
    };
  },
  computed: {
    canEdit() {
      return ["administrador", "comercial"].includes(this.user.role);
    },
  },
  mounted() {
    this.loadPipeline();
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
    async loadPipeline() {
      this.loading = true;
      this.errorMsg = "";
      this.message = "";
      try {
        const data = await ApiClient.getPipeline();
        if (data.message) {
          this.message = data.message;
          this.pipeline = {};
        } else {
          this.pipeline = data.pipeline;
        }
      } catch (error) {
        this.errorMsg = error.message;
      } finally {
        this.loading = false;
      }
    },
    openCreateModal() {
      this.form = { client: this.clients[0] ? this.clients[0]._id : "", title: "", serviceType: "Pagina Web", amount: 0 };
      this.showModal = true;
    },
    async createOpportunity() {
      this.errorMsg = "";
      try {
        await ApiClient.createOpportunity(this.form);
        this.successMsg = "Oportunidad registrada correctamente";
        this.showModal = false;
        await this.loadPipeline();
      } catch (error) {
        this.errorMsg = error.message;
      }
    },
    async moveStage(opportunity, direction) {
      const currentIndex = this.stages.indexOf(opportunity.stage);
      const nextIndex = currentIndex + direction;
      if (nextIndex < 0 || nextIndex >= this.stages.length) return;

      const nextStage = this.stages[nextIndex];
      try {
        await ApiClient.updateOpportunityStage(opportunity._id, nextStage);
        await this.loadPipeline();
      } catch (error) {
        this.errorMsg = error.message;
      }
    },
    formatMoney(amount) {
      return new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC" }).format(amount || 0);
    },
  },
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h4><i class="bi bi-kanban-fill me-2"></i>Pipeline Comercial</h4>
        <button v-if="canEdit" class="btn btn-primary" @click="openCreateModal">
          <i class="bi bi-plus-lg"></i> Nueva oportunidad
        </button>
      </div>

      <div v-if="successMsg" class="alert alert-success py-2">{{ successMsg }}</div>
      <div v-if="errorMsg" class="alert alert-danger py-2">{{ errorMsg }}</div>
      <div v-if="message" class="alert alert-info py-2">{{ message }}</div>

      <div v-if="loading" class="text-center py-4"><span class="spinner-border"></span></div>

      <div v-else class="row g-2">
        <div class="col" v-for="stage in stages" :key="stage">
          <div class="pipeline-column">
            <h6 class="text-center mb-2">
              {{ stage }}
              <span class="badge bg-secondary">{{ (pipeline[stage] || []).length }}</span>
            </h6>
            <div
              class="card mb-2 p-2 pipeline-card"
              :class="'stage-' + stage.replace(' ', '')"
              v-for="op in (pipeline[stage] || [])"
              :key="op._id"
            >
              <div class="fw-semibold small">{{ op.title }}</div>
              <div class="text-muted small">{{ op.client ? op.client.name : 'Sin cliente' }}</div>
              <div class="small">{{ formatMoney(op.amount) }}</div>
              <div class="d-flex justify-content-between mt-1" v-if="canEdit">
                <button class="btn btn-sm btn-outline-secondary" @click="moveStage(op, -1)" title="Etapa anterior">
                  <i class="bi bi-arrow-left"></i>
                </button>
                <button class="btn btn-sm btn-outline-secondary" @click="moveStage(op, 1)" title="Siguiente etapa">
                  <i class="bi bi-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal nueva oportunidad -->
      <div v-if="showModal" class="modal d-block" style="background: rgba(0,0,0,0.5)">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Nueva oportunidad</h5>
              <button class="btn-close" @click="showModal = false"></button>
            </div>
            <div class="modal-body">
              <div v-if="errorMsg" class="alert alert-danger py-2">{{ errorMsg }}</div>
              <form @submit.prevent="createOpportunity">
                <div class="mb-3">
                  <label class="form-label">Cliente *</label>
                  <select class="form-select" v-model="form.client" required>
                    <option v-for="c in clients" :key="c._id" :value="c._id">{{ c.name }}</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">Titulo de la oportunidad *</label>
                  <input class="form-control" v-model="form.title" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Tipo de servicio *</label>
                  <select class="form-select" v-model="form.serviceType">
                    <option v-for="s in serviceOptions" :key="s" :value="s">{{ s }}</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">Monto estimado (CRC)</label>
                  <input type="number" min="0" class="form-control" v-model.number="form.amount" />
                </div>
                <div class="text-end">
                  <button type="button" class="btn btn-secondary me-2" @click="showModal = false">Cancelar</button>
                  <button type="submit" class="btn btn-primary">Guardar oportunidad</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
};
