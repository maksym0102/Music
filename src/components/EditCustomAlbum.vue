<template>
  <modal-view
    :show="show"
    :title="album.name"
    buttonText="Edit"
    @close="handleClose"
    :isValid="numSelected > 0"
  >
    <song-item
      v-for="(song, index) of songs"
      :key="song.title"
      :song="song"
      @left-click="toggleSelected(song.title, index)"
    >
      <svg class="svg" viewBox="0 0 110 110">
        <rect class="box" x="5" y="5" width="100" height="100" transform="rotate(90 55 55)" />
        <path :class="selected[index] ? 'check' : 'unchecked'" d="M90,20 L45.7,75.1 L20.2,55.4" />
      </svg>
    </song-item>
  </modal-view>
</template>

<script lang="ts">
import Vue from 'vue';

import ModalView from './ModalView.vue';
import SongItem from './SongItem.vue';

interface CData {
  songs: SongData[];
  selected: boolean[];
  numSelected: number;
}

interface CMethods {
  toggleSelected: (title: string, index: number) => void;
  handleClose: (cancel: boolean, title?: string) => void;
}

interface CProps {
  show: boolean;
  album: CustomAlbumData;
}

export default Vue.extend<CData, CMethods, {}, CProps>({
  name: 'edit-custom-album',
  data: () => ({
    songs: [],
    selected: [],
    numSelected: 0,
  }),
  methods: {
    toggleSelected(title, index) {
      if (this.selected[index]) {
        this.numSelected--;
      } else {
        this.numSelected++;
      }
      Vue.set(this.selected, index, !this.selected[index]);
    },
    async handleClose(cancel) {
      if (!cancel) {
        const songs = this.songs.filter((_, index) => this.selected[index]).map(s => s.title);
        this.$store.dispatch('editCustomAlbum', { ...this.album, songs });
      }
      this.$emit('close');
    },
  },
  props: {
    show: Boolean,
    album: Object,
  },
  watch: {
    show(show: boolean) {
      if (show) {
        window.db.getSongs().then(songs => {
          this.selected = songs.map(s => this.album.songs.includes(s.title));
          this.songs = songs;
        });
      } else {
        this.songs = [];
        this.selected = [];
        this.numSelected = 0;
      }
    },
  },
  components: {
    ModalView,
    SongItem,
  },
});
</script>

<style lang="scss" scoped>
@import '@/vars.scss';

.svg {
  display: block;
  height: 1.5rem;
  margin-right: 1.3rem;

  .unchecked {
    stroke: $accent;
    fill: none;
    stroke-width: 20;
    stroke-dasharray: 200;
    stroke-dashoffset: 200;
    animation: uncheck 0.75s linear forwards;
  }

  .check {
    stroke: $accent;
    fill: none;
    stroke-width: 20;
    stroke-dasharray: 200;
    stroke-dashoffset: 0;
    animation: check 0.75s linear forwards;
  }

  .box {
    stroke: #555555;
    stroke-width: 7;
    fill: none;
  }
}

@keyframes check {
  0% {
    stroke-dashoffset: -200;
  }
  100% {
    stroke-dashoffset: 0;
  }
}

@keyframes uncheck {
  0% {
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dashoffset: 200;
  }
}
</style>
