<template>
  <nav class="sidebar">
    <div>
      <component :is="disabled ? 'span' : 'router-link'" to="/" class="item no-hover">
        <div class="first">
          <img src="@/assets/logo.png" alt="Music Logo" />
        </div>
        <div class="second">
          <h5>Music</h5>
        </div>
      </component>
      <component
        :is="disabled ? 'span' : 'router-link'"
        to="/"
        exact-active-class="sel"
        class="item"
      >
        <div class="first">
          <home-icon title="Home" />
        </div>
        <div class="second">
          <h6>Home</h6>
        </div>
      </component>
      <component
        :is="disabled ? 'span' : 'router-link'"
        to="/music"
        active-class="sel"
        class="item"
      >
        <div class="first">
          <music-note-icon title="My Music" />
        </div>
        <div class="second">
          <h6>My Music</h6>
        </div>
      </component>
      <component
        :is="disabled ? 'span' : 'router-link'"
        to="/albums"
        active-class="sel"
        class="item"
      >
        <div class="first">
          <music-box-multiple-icon title="Albums" />
        </div>
        <div class="second">
          <h6>Albums</h6>
        </div>
      </component>
      <component
        :is="disabled ? 'span' : 'router-link'"
        to="/artists"
        active-class="sel"
        class="item"
      >
        <div class="first">
          <account-multiple-icon title="Artists" />
        </div>
        <div class="second">
          <h6>Artists</h6>
        </div>
      </component>
    </div>
    <div>
      <div v-for="{ text, progress } in progress" class="item" :title="text" :key="text">
        <div class="first">
          <vue-ellipse-progress
            :progress="progress"
            color="#1763d4"
            empty-color="#323232"
            :size="34"
            :thickness="4"
            :empty-thickness="4"
            animation="bounce 700 1000"
            fontSize="0.7rem"
            font-color="white"
          />
        </div>
        <div class="second">
          <p class="one-line">{{ text }}</p>
        </div>
      </div>
      <component
        :is="disabled ? 'span' : 'router-link'"
        to="/settings"
        active-class="sel"
        class="item"
      >
        <div class="first">
          <cog-icon title="Settings" />
        </div>
        <div class="second">
          <h6>Settings</h6>
        </div>
      </component>
    </div>
  </nav>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapGetters } from 'vuex';
import { ipcRenderer } from 'electron';
import MusicNoteIcon from 'vue-material-design-icons/MusicNote.vue';
import MusicBoxMultipleIcon from 'vue-material-design-icons/MusicBoxMultiple.vue';
import AccountMultipleIcon from 'vue-material-design-icons/AccountMultiple.vue';
import HomeIcon from 'vue-material-design-icons/Home.vue';
import CogIcon from 'vue-material-design-icons/Cog.vue';

interface Progress {
  text: string;
  progress: number;
}

interface CData {
  progress: Progress[];
}

interface CComputed {
  disabled: boolean;
  apiKeysValid: boolean;
}

export default Vue.extend<CData, {}, CComputed>({
  name: 'side-bar',
  data: () => ({
    progress: [],
  }),
  computed: {
    ...mapGetters('apiKeys', {
      apiKeysValid: 'valid',
    }),
    disabled() {
      return !this.apiKeysValid || this.$route.path === '/sync-status';
    },
  },
  components: {
    MusicNoteIcon,
    MusicBoxMultipleIcon,
    AccountMultipleIcon,
    HomeIcon,
    CogIcon,
  },
  mounted() {
    ipcRenderer.on('download:progress', (_, { artist, title, percent }) => {
      const text = `${title} by ${artist}`;
      const index = this.progress.findIndex(item => item.text === text);
      percent *= 100;

      const item = {
        text,
        progress: percent > 100 ? 100 : Math.round(percent),
      };

      if (index >= 0) {
        this.progress.splice(index, 1, item);
      } else {
        this.progress.push(item);
      }
    });

    ipcRenderer.on('download:complete', (_, { artist, title }) => {
      const text = `${title} by ${artist}`;
      const index = this.progress.findIndex(item => item.text === text);

      this.progress.splice(index, 1);
    });
  },
});
</script>

<style lang="scss" scoped>
@import '@/vars.scss';

.sidebar {
  @include flex-box(space-between, flex-start, column);

  transition: width 0.3s cubic-bezier(0.215, 0.61, 0.355, 1);
  width: 4rem;
  height: 100vh;
  z-index: 3;
  background: $secondary;
  overflow: hidden;

  .item {
    @include flex-box;

    transition: 0.2s;
    margin: 0.5rem 0;
    padding: 0.5rem 0;
    min-height: 2.5rem;
    width: calc(4rem + 150px);

    &.sel {
      color: $accent;
    }

    .first {
      @include flex-box;

      transition: 0.2s;
      width: 4rem;

      .material-design-icon {
        height: 24px;
      }

      img {
        height: 3rem;
        user-select: none;
      }
    }

    .second {
      transition: 0.2s;

      width: 150px;
      padding: 0 0.4rem;
      transform: translateX(-0.6rem);
      opacity: 0;

      h5 {
        font-size: 1.4rem;
        user-select: none;
      }
      h6 {
        font-size: 1.2rem;
        user-select: none;
      }
    }

    &:hover {
      background: $primary;
      cursor: pointer;
    }

    &.no-hover:hover {
      background: $secondary;
      // cursor: auto;
    }
  }

  span.item {
    color: #aaaaaa;
    cursor: not-allowed !important;

    &.no-hover {
      color: white;
      cursor: default !important;
    }
  }

  &:hover {
    width: calc(4rem + 150px);

    .second {
      opacity: 1;
      transform: translateX(0);
    }
  }
}

.one-line {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

@media screen and (min-width: 1400px) {
  .sidebar {
    width: calc(4rem + 150px);

    .item .second {
      opacity: 1;
      transform: translateX(0);
    }
  }
}
</style>
