declare module '*.vue' {
  import Vue from 'vue';

  export default Vue;
}

declare module '*.png' {
  const data: string;
  export default data;
}

declare module 'vuex-electron' {
  const createPersistedState: (options?: obj) => (store: any) => any;
}

declare module 'vue-ellipse-progress' {
  const VueEllipseProgress: (store: any) => any;

  export default VueEllipseProgress;
}
