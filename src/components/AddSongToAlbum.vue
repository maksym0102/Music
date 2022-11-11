<template>
  <modal-view
    :show="show"
    :title="title"
    buttonText="Add"
    @close="handleClose"
    :isValid="selectedIndex >= 0"
  >
    <h3 class="center" v-if="albums.length === 0">
      No Custom Albums.
    </h3>
    <div
      v-else
      v-for="(album, index) of albums"
      :key="album.id"
      class="album-item"
      @click.left="selectAlbum(index)"
    >
      <img src="@/assets/music_symbol.png" class="thumbnail" :alt="album.name" />
      <div class="info">
        <p class="name">{{ album.name }}</p>
        <p class="num-songs">
          {{ album.songs.length === 1 ? '1 song' : `${album.songs.length} songs` }}
        </p>
      </div>
      <div class="end">
        <svg class="svg" viewBox="0 0 110 110">
          <rect class="box" x="5" y="5" width="100" height="100" transform="rotate(90 55 55)" />
          <path
            :class="index === selectedIndex ? 'check' : 'unchecked'"
            d="M90,20 L45.7,75.1 L20.2,55.4"
          />
        </svg>
      </div>
    </div>
  </modal-view>
</template>

<script lang="ts">
import Vue from 'vue';

import ModalView from './ModalView.vue';

interface CData {
  albums: CustomAlbumData[];
  selectedIndex: number;
}

interface CMethods {
  selectAlbum: (index: number) => void;
  handleClose: (cancel: boolean, title?: string) => void;
}

interface CComputed {
  title: string;
}

interface CProps {
  show: boolean;
  song: SongData;
}

export default Vue.extend<CData, CMethods, {}, CProps>({
  name: 'add-song-to-album',
  data: () => ({
    albums: [],
    selectedIndex: -1,
  }),
  methods: {
    selectAlbum(index) {
      if (this.selectedIndex === index) {
        this.selectedIndex = -1;
      } else {
        this.selectedIndex = index;
      }
    },
    async handleClose(cancel) {
      if (!cancel) {
        this.$store.dispatch('addSongToAlbum', {
          album: this.albums[this.selectedIndex],
          song: this.song,
        });
      }
      this.$emit('close');
    },
  },
  computed: {
    title() {
      return this.song?.title ?? '';
    },
  },
  props: {
    show: Boolean,
    song: Object,
  },
  watch: {
    show(show: boolean) {
      if (show) {
        window.db.getCustomAlbums().then(albums => {
          this.albums = albums;
        });
      } else {
        this.albums = [];
        this.selectedIndex = 0;
      }
    },
  },
  components: {
    ModalView,
  },
});
</script>

<style lang="scss" scoped>
@import '@/vars.scss';

.center {
  @include flex-box;

  height: 100%;
  width: 100%;
}

.album-item {
  @include flex-box(space-between);
  transition: 0.2s;

  padding: 1.1rem 1.5rem;
  background: $secondary;
  border-radius: 0.6rem;
  margin: 1rem 0;
  cursor: pointer;

  .thumbnail {
    height: 4rem;
    width: 4rem;
    border-radius: 10%;
  }

  .info {
    @include flex-box($align: flex-start, $direction: column);

    flex: 9;
    padding-left: 1.3rem;

    .name {
      margin-bottom: 0.1rem;
    }

    .num-songs {
      color: $subtext;
      font-size: $subtext-size;
    }
  }

  .end {
    @include flex-box(flex-end);

    flex: 1;
  }

  &:hover {
    background: $primary;
  }
}

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
