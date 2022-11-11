import Vue from 'vue';
import VueEllipseProgress from 'vue-ellipse-progress';

import App from './App.vue';
import router from './router';
import store from './store';
import DatabaseFunctions from './helpers/database_functions';

window.db = new DatabaseFunctions();

Vue.config.productionTip = false;
Vue.use(VueEllipseProgress);

new Vue({
  router,
  store,
  render: h => h(App),
}).$mount('#app');
