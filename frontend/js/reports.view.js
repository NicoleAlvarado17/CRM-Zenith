// Componente: Modulo 5 - Reportes (HU-13, HU-14, HU-15)
const ReportsView = {
  props: ["user"],
  data() {
    return {
      loading: true,
      errorMsg: "",
      sales: null,
      maintenance: null,
      activeOpportunities: null,
    };
  },
  async mounted() {
    await this.loadAll();
  },
  methods: {
    async loadAll() {
      this.loading = true;
      this.errorMsg = "";
      try {
        const [sales, maintenance, activeOpportunities] = await Promise.all([
          ApiClient.getSalesReport(),
          ApiClient.getMaintenanceReport(),
          ApiClient.getActiveOpportunitiesReport(),
        ]);
        this.sales = sales;
        this.maintenance = maintenance;
        this.activeOpportunities = activeOpportunities;
      } catch (error) {
        this.errorMsg = error.message;
      } finally {
        this.loading = false;
      }
    },
    formatMoney(amount) {
      return new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC" }).format(amount || 0);
    },
  },
  template: `
    <div>
      <h4 class="mb-3"><i class="bi bi-bar-chart-fill me-2"></i>Reportes</h4>
      <div v-if="errorMsg" class="alert alert-danger py-2">{{ errorMsg }}</div>
      <div v-if="loading" class="text-center py-4"><span class="spinner-border"></span></div>

      <div v-else class="row g-3">
        <!-- Reporte de ventas: HU-13 -->
        <div class="col-md-4">
          <div class="card stat-card p-3 h-100">
            <h6><i class="bi bi-graph-up-arrow me-1"></i> Ventas (oportunidades ganadas)</h6>
            <div v-if="sales.message" class="text-muted small">{{ sales.message }}</div>
            <div v-else>
              <h2 class="fw-bold">{{ sales.totalVentas }}</h2>
              <p class="text-muted mb-0">Monto total: {{ formatMoney(sales.montoTotal) }}</p>
            </div>
          </div>
        </div>

        <!-- Reporte de mantenimientos: HU-14 -->
        <div class="col-md-4">
          <div class="card stat-card p-3 h-100">
            <h6><i class="bi bi-tools me-1"></i> Mantenimientos</h6>
            <div v-if="maintenance.message" class="text-muted small">{{ maintenance.message }}</div>
            <div v-else>
              <ul class="list-unstyled mb-0">
                <li>Activos: <strong>{{ maintenance.resumen.activos }}</strong></li>
                <li>Por vencer: <strong>{{ maintenance.resumen.porVencer }}</strong></li>
                <li>Vencidos: <strong class="text-danger">{{ maintenance.resumen.vencidos }}</strong></li>
                <li>Renovados: <strong class="text-success">{{ maintenance.resumen.renovados }}</strong></li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Reporte de oportunidades activas: HU-15 -->
        <div class="col-md-4">
          <div class="card stat-card p-3 h-100">
            <h6><i class="bi bi-lightning-charge-fill me-1"></i> Oportunidades activas</h6>
            <div v-if="activeOpportunities.message" class="text-muted small">{{ activeOpportunities.message }}</div>
            <div v-else>
              <h2 class="fw-bold">{{ activeOpportunities.length }}</h2>
              <p class="text-muted mb-0">En proceso de negociacion o cotizacion</p>
            </div>
          </div>
        </div>

        <div class="col-12" v-if="sales.opportunities && sales.opportunities.length">
          <div class="card p-3">
            <h6>Detalle de ventas cerradas</h6>
            <table class="table table-sm">
              <thead><tr><th>Cliente</th><th>Titulo</th><th>Monto</th></tr></thead>
              <tbody>
                <tr v-for="op in sales.opportunities" :key="op._id">
                  <td>{{ op.client ? op.client.name : 'N/D' }}</td>
                  <td>{{ op.title }}</td>
                  <td>{{ formatMoney(op.amount) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
};
