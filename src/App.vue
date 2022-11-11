<template>
  <div id="app">
    <main>
      <side-bar />
      <header v-if="showBar" :style="{ opacity: headerOpacity }">
        <div></div>
        <div :style="{ opacity: titleOpacity }">
          <h3>{{ pageTitle }}</h3>
        </div>
        <div>
          <search-bar placeholder="Download" @search="handleSearch" />
        </div>
      </header>
      <div>
        <transition v-if="animations" :name="transitionName">
          <router-view></router-view>
        </transition>
        <router-view v-else />
      </div>
      <player-bar />
    </main>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapState, mapGetters } from 'vuex';
import { Route } from 'vue-router';
import { remote } from 'electron';
import { debounce } from 'lodash';

import performChecks from './helpers/checks';
import SideBar from './components/SideBar.vue';
import PlayerBar from './components/PlayerBar.vue';
import SearchBar from './components/SearchBar.vue';

const paths: { [key: string]: number[] } = {
  '/': [0, 0, 0],
  '/home': [0, 1, 0],
  '/music': [0, 2, 0],
  '/albums/album': [0, 3, 1],
  '/albums/liked': [0, 3, 1],
  '/albums': [0, 3, 0],
  '/artists/artist': [0, 4, 1],
  '/artists': [0, 4, 0],
  '/settings': [0, 5, 0],
  '/queue': [0, 6, 0],
  '/search': [1, 0, 0],
  '/register-keys': [2, 0, 0],
  '/sync-status': [2, 0, 1],
};

interface CData {
  transitionName: string;
  titleOpacity: number;
  headerOpacity: number;
}

interface CMethods {
  onScroll: (event: Event) => void;
  getTransitionName: (to: Route, from: Route) => string;
  search: (query: string) => void;
  handleSearch: (query: string) => void;
}

interface CComputed {
  apiKeysValid: boolean;
  syncable: boolean;
  pageTitle: string;
  animations: boolean;
  showBar: boolean;
}

export default Vue.extend<CData, CMethods, CComputed>({
  name: 'Music',
  data: () => ({
    transitionName: '',
    titleOpacity: 0,
    headerOpacity: 1,
  }),
  async mounted() {
    this.$store.dispatch('settings/load');
    // eslint-disable-next-line no-unused-expressions
    document.getElementById('scroll-el')?.addEventListener('scroll', this.onScroll);
    window.onkeydown = (e: KeyboardEvent) => {
      if (e.keyCode === 32 && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        remote.getCurrentWebContents().send('pause-play');
      }
    };
    if (!this.apiKeysValid && this.$route.path !== '/register-keys') {
      this.$router.push('/register-keys');
    } else if (this.syncable && this.$route.path !== '/sync-status') {
      const dispatch = this.$store.dispatch('sync/connect');
      this.$router.push('/sync-status');
      await dispatch;
    }

    await performChecks({
      napsterKey: this.$store.state.apiKeys.napster,
      folderStored: this.$store.state.settings.folderStored,
    });
  },
  methods: {
    onScroll(event) {
      const opacity = (event.target as HTMLDivElement).scrollTop > 80 ? 1 : 0;
      if (opacity !== this.titleOpacity) this.titleOpacity = opacity;
    },
    getTransitionName(to, from) {
      let transitionName = 'page-transition';

      const [xto, yto, zto] = paths[to.path];
      const [xfrom, yfrom, zfrom] = paths[from.path];

      if (xto > xfrom) {
        transitionName += '-right';
      } else if (xto < xfrom) {
        transitionName += '-left';
      } else if (yto > yfrom) {
        transitionName += '-bottom';
      } else if (yto < yfrom) {
        transitionName += '-top';
      } else if (zto > zfrom) {
        transitionName += '-above';
      } else if (zto < zfrom) {
        transitionName += '-below';
      }

      return transitionName;
    },
    search: debounce(function (this: any, query: string) {
      this.$store.dispatch('searchResults/search', query);
    }, 700),
    handleSearch(query) {
      if (this.$route.name !== 'Download') this.$router.push('/search');
      this.search(query);
    },
  },
  computed: {
    ...mapGetters('apiKeys', {
      apiKeysValid: 'valid',
      syncable: 'syncable',
    }),
    ...mapState('settings', ['animations']),
    pageTitle() {
      return (this.$route.name?.charAt(0) === '\\' ? '' : this.$route.name) ?? '';
    },
    showBar() {
      return this.apiKeysValid && this.$route.path !== '/sync-status';
    },
  },
  components: {
    PlayerBar,
    SideBar,
    SearchBar,
  },
  watch: {
    $route(to: Route, from: Route) {
      this.transitionName = this.getTransitionName(to, from);
      this.headerOpacity = (to.name?.charAt(0) === '\\' ? 0 : 1) ?? 0;
      this.titleOpacity = 0;
      if (to.name === 'Download') this.$store.commit('searchResults/clear');
      setTimeout(() => {
        const [prevScreen, nextScreen] = document.querySelectorAll('#scroll-el');
        // eslint-disable-next-line no-unused-expressions
        prevScreen?.removeEventListener('scroll', this.onScroll);
        // eslint-disable-next-line no-unused-expressions
        nextScreen?.addEventListener('scroll', this.onScroll);
      }, 100);
    },
  },
});
</script>

<style lang="scss" scoped>
@import './vars.scss';
@import './pageAnimations.scss';

main {
  @include flex-box;
  width: 100vw;

  > div {
    flex: 1;
  }
}

header {
  @include flex-box(space-between);

  position: fixed;
  left: 0;
  top: 0;
  width: calc(100vw - 0.8rem);
  height: 4.5rem;
  backdrop-filter: blur(20px);
  z-index: 1;
  transition: 0.3s cubic-bezier(0.215, 0.61, 0.355, 1);
  padding-right: calc(5vw + 1.3rem);
  padding-left: calc(5vw + 2.1rem);
  background: transparentize($color: $bg, $amount: 0.35);

  > div {
    @include flex-box;

    transition: 0.2s;
    flex: 1;

    &:nth-child(3) {
      justify-content: flex-end;
    }
  }

  h3 {
    font-size: 1.4rem;
  }
}

.sidebar:hover + header {
  padding-right: calc(5vw + 1.3rem - 10px);
  padding-left: calc(5vw + 2.1rem - 10px);
}
</style>

<style lang="scss" src="./global.scss"></style>
