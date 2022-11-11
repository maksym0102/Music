import { ActionTree, MutationTree } from 'vuex';

import FirestoreSync, { FirestoreKeys } from '@/helpers/firestore_sync';
import { SyncStatus, SyncInitial } from '@/helpers/firestore_sync/sync_status';

import { SyncState, RootState } from '../types';

const state: SyncState = {
  status: new SyncInitial(),
};

const mutations: MutationTree<SyncState> = {
  setStatus(state, status: SyncStatus) {
    state.status = status;
  },
};

const actions: ActionTree<SyncState, RootState> = {
  connect({ rootState, rootGetters, commit }) {
    if (!rootGetters['apiKeys/syncable']) throw new Error('Sync Keys not available');

    commit('setStatus', new SyncInitial());

    const keys: FirestoreKeys = {
      apiKey: rootState.apiKeys.firestoreApiKey ?? '',
      appId: rootState.apiKeys.firestoreAppId ?? '',
      projectId: rootState.apiKeys.firestoreProjectId ?? '',
    };

    window.syncDB = new FirestoreSync(keys);

    window.syncDB.onUpdate = () => commit('update', undefined, { root: true });
    window.syncDB.onStatusUpdate = status => commit('setStatus', status);

    return window.syncDB.init();
  },
};

export default {
  state,
  actions,
  mutations,
  namespaced: true,
};
