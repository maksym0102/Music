import Vue from 'vue';
import Vuex from 'vuex';
import { createPersistedState } from 'vuex-electron';

import modules from './modules';
import root from './root';

Vue.use(Vuex);

export default new Vuex.Store<any>({
  ...root,
  modules,
  plugins: [createPersistedState()],
  strict: process.env.NODE_ENV !== 'production',
});
