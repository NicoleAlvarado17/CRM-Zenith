// Aplicacion raiz del CRM Zenith.
// Controla la sesion del usuario (login/logout) y la navegacion entre los 5 modulos
// definidos en el Documento de Requerimientos (AN01).

const App = {
  components: {
    LoginView,
    NavBar,
    ClientsView,
    PipelineView,
    BitacoraView,
    AlertsView,
    ReportsView,
  },
  data() {
    return {
      user: ApiClient.getUser(),
      currentView: "clientes",
    };
  },
  methods: {
    handleLoginSuccess(user) {
      this.user = user;
      this.currentView = "clientes";
    },
    handleLogout() {
      ApiClient.clearSession();
      this.user = null;
    },
    navigate(view) {
      this.currentView = view;
    },
  },
  template: `
    <div>
      <login-view v-if="!user" :on-login-success="handleLoginSuccess"></login-view>
      <div v-else>
        <nav-bar
          :user="user"
          :current-view="currentView"
          :on-navigate="navigate"
          :on-logout="handleLogout"
        ></nav-bar>
        <div class="container-fluid px-4 pb-5">
          <clients-view v-if="currentView === 'clientes'" :user="user"></clients-view>
          <pipeline-view v-else-if="currentView === 'pipeline'" :user="user"></pipeline-view>
          <bitacora-view v-else-if="currentView === 'bitacora'" :user="user"></bitacora-view>
          <alerts-view v-else-if="currentView === 'alertas'" :user="user"></alerts-view>
          <reports-view v-else-if="currentView === 'reportes'" :user="user"></reports-view>
        </div>
      </div>
    </div>
  `,
};

Vue.createApp(App).mount("#app");
