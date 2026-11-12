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
      searchQuery: "",
      // Estado del arrastre (correccion de evaluacion: el cambio de etapa debe ser drag and drop)
      draggedOpportunity: null,
      dragOverStage: null,
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
    opportunitiesByStage(stage) {
      const list = this.pipeline[stage] || [];
      const q = this.searchQuery.trim().toLowerCase();
      if (!q) return list;
      return list.filter(
        (op) =>
          op.title.toLowerCase().includes(q) ||
          (op.client && op.client.name && op.client.name.toLowerCase().includes(q))
      );
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
    // Cambia la etapa de una oportunidad, ya sea por arrastre o por el selector accesible
    async changeStage(opportunity, newStage) {
      if (!newStage || newStage === opportunity.stage) return;
      try {
        await ApiClient.updateOpportunityStage(opportunity._id, newStage);
        await this.loadPipeline();
      } catch (error) {
        this.errorMsg = error.message;
      }
    },
    onDragStart(op, event) {
      if (!this.canEdit) return;
      this.draggedOpportunity = op;
      event.dataTransfer.effectAllowed = "move";
    },
    onDragEnd() {
      this.draggedOpportunity = null;
      this.dragOverStage = null;
    },
    onDragEnterColumn(stage) {
      if (!this.canEdit || !this.draggedOpportunity) return;
      this.dragOverStage = stage;
    },
    async onDropColumn(stage) {
      this.dragOverStage = null;
      if (!this.canEdit || !this.draggedOpportunity) return;
      const opportunity = this.draggedOpportunity;
      this.draggedOpportunity = null;
      await this.changeStage(opportunity, stage);
    },
    formatMoney(amount) {
      return new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC" }).format(amount || 0);
    },
  },
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2 action-toolbar">
        <h4 class="mb-0"><i class="bi bi-kanban-fill me-2"></i>Pipeline Comercial</h4>
        <button v-if="canEdit" class="btn btn-primary" @click="openCreateModal">
          <i class="bi bi-plus-lg"></i> Nueva oportunidad
        </button>
      </div>

      <div v-if="successMsg" class="alert alert-success py-2">{{ successMsg }}</div>
      <div v-if="errorMsg" class="alert alert-danger py-2">{{ errorMsg }}</div>
      <div v-if="message" class="alert alert-info py-2">{{ message }}</div>

      <div v-if="!loading && !message" class="d-flex flex-wrap gap-2 align-items-center mb-2 table-toolbar bg-white rounded shadow-sm p-2">
        <div class="input-group input-group-sm" style="max-width: 300px">
          <span class="input-group-text"><i class="bi bi-search"></i></span>
          <input type="text" class="form-control" placeholder="Buscar oportunidad o cliente" v-model="searchQuery" />
        </div>
        <span class="text-muted small">
          <i class="bi bi-arrows-move me-1"></i>Arrastre una tarjeta a otra columna para cambiar su etapa,
          o use el selector "Cambiar etapa" de cada tarjeta.
        </span>
      </div>

      <div v-if="loading" class="text-center py-4"><span class="spinner-border"></span></div>

      <div v-else class="row g-2 pipeline-row">
        <div class="col" v-for="stage in stages" :key="stage">
          <div
            class="pipeline-column"
            :class="{ 'drag-over': dragOverStage === stage }"
            @dragover.prevent="onDragEnterColumn(stage)"
            @dragleave="dragOverStage = null"
            @drop.prevent="onDropColumn(stage)"
          >
            <h6 class="text-center mb-2">
              {{ stage }}
              <span class="badge bg-secondary">{{ opportunitiesByStage(stage).length }}</span>
            </h6>
            <div
              class="card mb-2 p-2 pipeline-card"
              :class="[ 'stage-' + stage.replace(' ', ''), { 'pipeline-card-draggable': canEdit, dragging: draggedOpportunity === op } ]"
              :draggable="canEdit"
              v-for="op in opportunitiesByStage(stage)"
              :key="op._id"
              @dragstart="onDragStart(op, $event)"
              @dragend="onDragEnd"
            >
              <div class="fw-semibold small">{{ op.title }}</div>
              <div class="text-muted small">{{ op.client ? op.client.name : 'Sin cliente' }}</div>
              <div class="small">{{ formatMoney(op.amount) }}</div>
              <div class="mt-2" v-if="canEdit">
                <label class="form-label small text-muted mb-1">Cambiar etapa:</label>
                <select
                  class="form-select form-select-sm"
                  :value="op.stage"
                  @change="changeStage(op, $event.target.value)"
                  @mousedown.stop
                >
                  <option v-for="s in stages" :key="s" :value="s">{{ s }}</option>
                </select>
              </div>
            </div>
            <p v-if="opportunitiesByStage(stage).length === 0" class="text-center text-muted small mb-0">
              Sin oportunidades
            </p>
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
                <div class="text-end action-buttons d-flex justify-content-end">
                  <button type="button" class="btn btn-secondary" @click="showModal = false">Cancelar</button>
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
