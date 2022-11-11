<template>
  <div class="scroll-el" id="scroll-el">
    <div class="page">
      <h1 class="header">Download</h1>
      <loading-icon v-if="loading" />
      <p v-if="errored" class="error"><alert-circle-icon title="Error" />Error</p>
      <pre v-if="error !== null">{{ error }}</pre>
      <template v-if="!errored && !loading">
        <song-item
          v-for="(song, index) of filteredResults"
          :key="song.title + song.albumId"
          :song="song"
          @left-click="mappedCompleted[index] ? null : downloadSong(song)"
        >
          <div class="after-icon">
            <check-icon v-if="mappedCompleted[index]" />
            <vue-ellipse-progress
              v-else-if="mappedProgress[index]"
              :progress="mappedProgress[index].progress"
              color="#1763d4"
              empty-color="#323232"
              :size="34"
              :thickness="4"
              :empty-thickness="4"
              animation="bounce 700 1000"
              fontSize="0.7rem"
              font-color="white"
            />
            <img v-else src="@/assets/download.png" alt="Download" class="download" />
          </div>
        </song-item>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapState, mapActions } from 'vuex';
import { ipcRenderer } from 'electron';
import AlertCircleIcon from 'vue-material-design-icons/AlertCircle.vue';
import CheckIcon from 'vue-material-design-icons/Check.vue';

import SongItem from '@/components/SongItem.vue';
import LoadingIcon from '@/components/LoadingIcon.vue';

interface Progress {
  text: string;
  progress: number;
}

interface CData {
  progress: Progress[];
  completed: string[];
  alreadyDownloaded: Set<string>;
}

interface CMethods {
  downloadSong: (song: NapsterSongData) => Promise<void>;
  createText: (song: { title: string; albumId: string }) => string;
}

interface CComputed {
  results: NapsterSongData[];
  error: any;
  loading: boolean;
  errored: boolean;
  mappedProgress: (Progress | undefined)[];
  mappedCompleted: boolean[];
  filteredResults: NapsterSongData[];
}

export default Vue.extend<CData, CMethods, CComputed>({
  name: 'search-page',
  data: () => ({
    progress: [],
    completed: [],
    alreadyDownloaded: new Set(),
  }),
  computed: {
    ...mapState('searchResults', ['results', 'error']),
    loading() {
      return this.results !== null && this.results.length === 0;
    },
    errored() {
      return this.results === null || this.error !== null;
    },
    mappedProgress() {
      if (this.loading || this.errored) return [];

      return this.results.map(s => {
        const text = this.createText(s);
        return this.progress.find(item => item.text === text);
      });
    },
    mappedCompleted() {
      if (this.loading || this.errored) return [];

      return this.results.map(s => this.completed.includes(this.createText(s)));
    },
    filteredResults() {
      return this.results.filter(r => !this.alreadyDownloaded.has(this.createText(r)));
    },
  },
  methods: {
    ...mapActions('data', ['downloadSong']),
    createText: s => `${s.title}${s.albumId}`,
  },
  mounted() {
    window.db.getSongs().then(songs => {
      this.alreadyDownloaded = new Set(songs.map(this.createText));
    });

    ipcRenderer.on('download:progress', (_, { percent, ...progress }: DownloadProgress) => {
      const text = this.createText(progress);
      const index = this.progress.findIndex(item => item.text === text);
      percent *= 100;

      const item: Progress = {
        text,
        progress: percent > 100 ? 100 : Math.round(percent),
      };

      if (index >= 0) {
        this.progress.splice(index, 1, item);
      } else {
        this.progress.push(item);
      }
    });

    ipcRenderer.on('download:complete', (_, song: NapsterSongData) => {
      const text = this.createText(song);
      const index = this.progress.findIndex(item => item.text === text);

      this.progress.splice(index, 1);
      this.completed.push(text);
    });
  },
  components: {
    AlertCircleIcon,
    SongItem,
    LoadingIcon,
    CheckIcon,
  },
});
</script>

<style lang="scss" scoped>
@import '@/vars.scss';

.download {
  max-height: 1.5rem;
  margin-bottom: 0.2rem;
}

.error {
  @include flex-box(flex-start);

  color: #d02a2a;
  font-size: 1.3rem;
  margin-top: 30vh;

  .material-design-icon {
    margin-right: 0.5ch;
    display: inline-flex;
  }
}

.after-icon {
  @include flex-box(flex-end);

  width: 2.5rem;
}
</style>
