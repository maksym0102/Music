import { MutationTree, GetterTree } from 'vuex';

import { ApiKeysState, RootState } from '../types';

const state: ApiKeysState = {
  napster: null,
  firestoreApiKey: null,
  firestoreProjectId: null,
  firestoreAppId: null,
};

const mutations: MutationTree<ApiKeysState> = {
  setKeys(state, keys: ApiKeysState) {
    keys = {
      firestoreApiKey: null,
      firestoreProjectId: null,
      firestoreAppId: null,
      ...keys,
    };

    state.napster = keys.napster;
    state.firestoreApiKey = keys.firestoreApiKey;
    state.firestoreProjectId = keys.firestoreProjectId;
    state.firestoreAppId = keys.firestoreAppId;
  },
};

const getters: GetterTree<ApiKeysState, RootState> = {
  valid(state) {
    return state.napster !== null;
  },
  syncable(state) {
    return (
      state.firestoreApiKey !== null &&
      state.firestoreProjectId !== null &&
      state.firestoreAppId !== null
    );
  },
};

export default {
  state,
  mutations,
  getters,
  namespaced: true,
};
