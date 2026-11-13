// Componente: Modulo 5 - Reportes (HU-13, HU-14, HU-15)
// Correccion de evaluacion: modulo mas robusto, con graficos, descarga de datos
// y elementos visuales que faciliten la toma de decisiones.
const ReportsView = {
  props: ["user"],
  data() {
    return {
      loading: true,
      errorMsg: "",
      sales: null,
      maintenance: null,
      activeOpportunities: null,
      salesChartInstance: null,
      maintenanceChartInstance: null,
      activeStageChartInstance: null,
      chartError: "",
      // Buscador y paginacion del detalle de ventas cerradas
      salesSearch: "",
      salesPage: 1,
      pageSize: 5,
    };
  },
  computed: {
    filteredSalesOpportunities() {
      const opportunities = (this.sales && this.sales.opportunities) || [];
      const q = this.salesSearch.trim().toLowerCase();
      if (!q) return opportunities;
      return opportunities.filter(
        (op) =>
          op.title.toLowerCase().includes(q) ||
          (op.client && op.client.name && op.client.name.toLowerCase().includes(q))
      );
    },
    salesTotalPages() {
      return Math.max(1, Math.ceil(this.filteredSalesOpportunities.length / this.pageSize));
    },
    paginatedSalesOpportunities() {
      const start = (this.salesPage - 1) * this.pageSize;
      return this.filteredSalesOpportunities.slice(start, start + this.pageSize);
    },
    // Porcentaje de contratos de mantenimiento vigentes (activos + por vencer + renovados)
    maintenanceHealthPercent() {
      if (!this.maintenance || this.maintenance.message) return 0;
      const r = this.maintenance.resumen;
      const total = r.activos + r.porVencer + r.vencidos + r.renovados;
      if (total === 0) return 0;
      return Math.round(((r.activos + r.porVencer + r.renovados) / total) * 100);
    },
  },
  watch: {
    salesSearch() {
      this.salesPage = 1;
    },
  },
  async mounted() {
    await this.loadAll();
  },
  beforeUnmount() {
    // Evita fugas de memoria al salir del modulo (los graficos de Chart.js
    // deben destruirse explicitamente cuando el canvas desaparece del DOM)
    if (this.salesChartInstance) this.salesChartInstance.destroy();
    if (this.maintenanceChartInstance) this.maintenanceChartInstance.destroy();
    if (this.activeStageChartInstance) this.activeStageChartInstance.destroy();
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
      // Los graficos solo pueden dibujarse una vez que Vue termino de actualizar
      // el DOM con loading=false (los <canvas> no existen mientras se ve el spinner)
      await this.$nextTick();
      this.renderCharts();
    },
    renderCharts() {
      // Si la libreria de graficos no cargo (sin internet o CDN bloqueado) se avisa
      // en pantalla en lugar de dejar los cuadros vacios.
      if (typeof Chart === "undefined") {
        this.chartError = "No se pudo cargar la libreria de graficos. Revise su conexion y recargue la pagina.";
        return;
      }
      this.chartError = "";
      this.renderSalesChart();
      this.renderMaintenanceChart();
      this.renderActiveStageChart();
    },
    renderSalesChart() {
      const canvas = this.$refs.salesChartCanvas;
      if (!canvas || !this.sales || this.sales.message) return;
      if (this.salesChartInstance) this.salesChartInstance.destroy();
      const opportunities = this.sales.opportunities || [];
      this.salesChartInstance = new Chart(canvas.getContext("2d"), {
        type: "bar",
        data: {
          labels: opportunities.map((op) => (op.client ? op.client.name : op.title)),
          datasets: [
            {
              label: "Monto vendido (CRC)",
              data: opportunities.map((op) => op.amount || 0),
              backgroundColor: "#1f3b73",
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } },
        },
      });
    },
    renderMaintenanceChart() {
      const canvas = this.$refs.maintenanceChartCanvas;
      if (!canvas || !this.maintenance || this.maintenance.message) return;
      if (this.maintenanceChartInstance) this.maintenanceChartInstance.destroy();
      const r = this.maintenance.resumen;
      this.maintenanceChartInstance = new Chart(canvas.getContext("2d"), {
        type: "doughnut",
        data: {
          labels: ["Activos", "Por vencer", "Vencidos", "Renovados"],
          datasets: [
            {
              data: [r.activos, r.porVencer, r.vencidos, r.renovados],
              backgroundColor: ["#2ecc71", "#f39c12", "#e74c3c", "#1f3b73"],
            },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false },
      });
    },
    renderActiveStageChart() {
      const canvas = this.$refs.activeStageChartCanvas;
      const opportunities = Array.isArray(this.activeOpportunities) ? this.activeOpportunities : [];
      if (!canvas || opportunities.length === 0) return;
      if (this.activeStageChartInstance) this.activeStageChartInstance.destroy();

      const porEtapa = opportunities.reduce((acc, op) => {
        acc[op.stage] = (acc[op.stage] || 0) + 1;
        return acc;
      }, {});

      this.activeStageChartInstance = new Chart(canvas.getContext("2d"), {
        type: "bar",
        data: {
          labels: Object.keys(porEtapa),
          datasets: [
            {
              label: "Oportunidades activas",
              data: Object.values(porEtapa),
              backgroundColor: "#2ecc71",
              borderRadius: 4,
            },
          ],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } },
        },
      });
    },
    descargarVentasCSV() {
      const opportunities = (this.sales && this.sales.opportunities) || [];
      if (opportunities.length === 0) return;

      const escaparCelda = (valor) => `"${String(valor).replace(/"/g, '""')}"`;
      const encabezado = "Cliente,Titulo,Monto (CRC)\n";
      const filas = opportunities.map((op) => {
        const cliente = op.client ? op.client.name : "N/D";
        return `${escaparCelda(cliente)},${escaparCelda(op.title)},${op.amount || 0}`;
      });

      const csv = encabezado + filas.join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "reporte_ventas_zenith.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    formatMoney(amount) {
      return new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC" }).format(amount || 0);
    },
  },
  template: `
    <div>
      <h4 class="mb-3"><i class="bi bi-bar-chart-fill me-2"></i>Reportes</h4>
      <div v-if="errorMsg" class="alert alert-danger py-2">{{ errorMsg }}</div>
      <div v-if="chartError" class="alert alert-warning py-2">{{ chartError }}</div>
      <div v-if="loading" class="text-center py-4"><span class="spinner-border"></span></div>

      <div v-else class="row g-3">
        <!-- Reporte de ventas: HU-13 -->
        <div class="col-md-4">
          <div class="card stat-card p-3 h-100">
            <h6><i class="bi bi-graph-up-arrow me-1"></i> Ventas (oportunidades ganadas)</h6>
            <div v-if="sales.message" class="text-muted small">{{ sales.message }}</div>
            <div v-else>
              <h2 class="fw-bold mb-0">{{ sales.totalVentas }}</h2>
              <p class="text-muted mb-0">Monto total: {{ formatMoney(sales.montoTotal) }}</p>
              <div class="kpi-trend text-success mt-1">
                <i class="bi bi-arrow-up-short"></i> Ventas cerradas acumuladas
              </div>
            </div>
          </div>
        </div>

        <!-- Reporte de mantenimientos: HU-14 -->
        <div class="col-md-4">
          <div class="card stat-card p-3 h-100">
            <h6><i class="bi bi-tools me-1"></i> Mantenimientos</h6>
            <div v-if="maintenance.message" class="text-muted small">{{ maintenance.message }}</div>
            <div v-else>
              <ul class="list-unstyled mb-2">
                <li>Activos: <strong>{{ maintenance.resumen.activos }}</strong></li>
                <li>Por vencer: <strong>{{ maintenance.resumen.porVencer }}</strong></li>
                <li>Vencidos: <strong class="text-danger">{{ maintenance.resumen.vencidos }}</strong></li>
                <li>Renovados: <strong class="text-success">{{ maintenance.resumen.renovados }}</strong></li>
              </ul>
              <div class="small text-muted mb-1">Contratos vigentes: {{ maintenanceHealthPercent }}%</div>
              <div class="progress" style="height: 8px">
                <div
                  class="progress-bar bg-success"
                  role="progressbar"
                  :style="{ width: maintenanceHealthPercent + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Reporte de oportunidades activas: HU-15 -->
        <div class="col-md-4">
          <div class="card stat-card p-3 h-100">
            <h6><i class="bi bi-lightning-charge-fill me-1"></i> Oportunidades activas</h6>
            <div v-if="activeOpportunities.message" class="text-muted small">{{ activeOpportunities.message }}</div>
            <div v-else>
              <h2 class="fw-bold mb-0">{{ activeOpportunities.length }}</h2>
              <p class="text-muted mb-0">En proceso de negociacion o cotizacion</p>
            </div>
          </div>
        </div>

        <!-- Graficos (correccion de evaluacion: modulo mas visual para apoyar decisiones) -->
        <div class="col-md-6">
          <div class="card chart-card p-3 h-100">
            <h6 class="mb-2">Ventas por cliente</h6>
            <div v-if="sales.opportunities && sales.opportunities.length" style="position: relative; height: 260px">
              <canvas ref="salesChartCanvas"></canvas>
            </div>
            <div v-else class="text-muted small py-4 text-center">
              <i class="bi bi-bar-chart me-1"></i>Aun no hay ventas ganadas para graficar.
            </div>
          </div>
        </div>

        <div class="col-md-6">
          <div class="card chart-card p-3 h-100">
            <h6 class="mb-2">Distribucion de contratos de mantenimiento</h6>
            <div v-if="!maintenance.message" style="position: relative; height: 260px">
              <canvas ref="maintenanceChartCanvas"></canvas>
            </div>
            <div v-else class="text-muted small py-4 text-center">
              <i class="bi bi-pie-chart me-1"></i>Aun no hay contratos de mantenimiento para graficar.
            </div>
          </div>
        </div>

        <div class="col-md-6">
          <div class="card chart-card p-3 h-100">
            <h6 class="mb-2">Oportunidades activas por etapa</h6>
            <div v-if="Array.isArray(activeOpportunities) && activeOpportunities.length" style="position: relative; height: 260px">
              <canvas ref="activeStageChartCanvas"></canvas>
            </div>
            <div v-else class="text-muted small py-4 text-center">
              <i class="bi bi-kanban me-1"></i>Aun no hay oportunidades activas para graficar.
            </div>
          </div>
        </div>

        <!-- Detalle de ventas cerradas, con buscador, paginacion y descarga -->
        <div class="col-12">
          <div class="card p-3">
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2 action-toolbar">
              <h6 class="mb-0">Detalle de ventas cerradas</h6>
              <button class="btn btn-sm btn-outline-secondary" @click="descargarVentasCSV" :disabled="!(sales.opportunities && sales.opportunities.length)">
                <i class="bi bi-download me-1"></i>Descargar CSV
              </button>
            </div>

            <div class="d-flex flex-wrap gap-2 align-items-center mb-2 table-toolbar">
              <div class="input-group input-group-sm" style="max-width: 280px">
                <span class="input-group-text"><i class="bi bi-search"></i></span>
                <input type="text" class="form-control" placeholder="Buscar por cliente o titulo" v-model="salesSearch" />
              </div>
              <span class="text-muted small ms-auto">{{ filteredSalesOpportunities.length }} resultado(s)</span>
            </div>

            <div class="table-responsive">
              <table class="table table-sm table-hover align-middle mb-0 table-stack">
                <thead><tr><th>Cliente</th><th>Titulo</th><th>Monto</th></tr></thead>
                <tbody>
                  <tr v-if="filteredSalesOpportunities.length === 0">
                    <td colspan="3" class="text-center text-muted py-3">
                      {{ (sales.opportunities && sales.opportunities.length) ? 'Sin resultados para la busqueda' : 'Aun no hay ventas ganadas registradas' }}
                    </td>
                  </tr>
                  <tr v-for="op in paginatedSalesOpportunities" :key="op._id">
                    <td data-label="Cliente">{{ op.client ? op.client.name : 'N/D' }}</td>
                    <td data-label="Titulo">{{ op.title }}</td>
                    <td data-label="Monto">{{ formatMoney(op.amount) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <pagination-bar :current-page="salesPage" :total-pages="salesTotalPages" @change="salesPage = $event"></pagination-bar>
          </div>
        </div>
      </div>
    </div>
  `,
};
