<template>
  <div class="scroll-el" id="scroll-el" key="album">
    <div class="page">
      <slot />
      <add-song-to-album
        :show="addSongToAlbumSong !== null"
        :song="addSongToAlbumSong"
        @close="addSongToAlbumSong = null"
      />
      <context-menu
        :items="items"
        :posx="posx"
        :posy="posy"
        @reset="reset"
        @play="playSong(index)"
        @addToAlbum="addToAlbum"
        @toggleLike="toggleLike"
        @delete="deleteSong"
      />
      <section class="details">
        <mozaic-image :images="mozaicImages" :title="title" />
        <h3>{{ title }}</h3>
        <p v-if="subtext !== null" class="subtext">{{ subtext }}</p>
        <div class="button-bar">
          <button class="btn">Play All</button>
          <button class="btn">Play Random</button>
        </div>
        <div v-if="subtext === null" class="subbuttons">
          <button class="btn" @click="$emit('edit')">Edit</button>
          <button class="btn del" @click="$emit('delete')">Delete</button>
        </div>
      </section>
      <section class="songs">
        <song-item
          v-for="(song, index) of songs"
          :key="song.title"
          :song="song"
          @right-click="openContextMenu($event, index)"
          @left-click="playSong(index)"
        >
          <dots-horizontal-icon title="Options" @click.stop="openContextMenu($event, index)" />
        </song-item>
      </section>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapMutations } from 'vuex';
import DotsHorizontalIcon from 'vue-material-design-icons/DotsHorizontal.vue';

import { displace } from '@/helpers/displace';

import SongItem from './SongItem.vue';
import MozaicImage from './MozaicImage.vue';
import ContextMenu from './ContextMenu.vue';
import AddSongToAlbum from './AddSongToAlbum.vue';

interface CData {
  posx: number;
  posy: number;
  items: ContextMenuItem[];
  index: number;
  addSongToAlbumSong: SongData | null;
}

interface CMethods {
  enqueue: Enqueue;
  playSong: (index: number) => void;
  addToAlbum: () => void;
  toggleLike: () => void;
  deleteSong: () => void;
  openContextMenu: (event: MouseEvent, index: number, deletable: boolean) => void;
  reset: () => void;
}

interface CComputed {
  mozaicImages: string[];
}

interface CProps {
  subtext: string | null;
  title: string;
  songs: SongData[];
  image: string | undefined;
  images: string[];
}

export default Vue.extend<CData, CMethods, CComputed, CProps>({
  name: 'album-page',
  data: () => ({
    items: [
      {
        icon: 'play-icon',
        title: 'Play',
        handler: 'play',
      },
      {
        icon: 'playlist-plus-icon',
        title: 'Add to Album',
        handler: 'addToAlbum',
      },
      {
        icon: 'heart-icon',
        title: 'Unlike',
        handler: 'toggleLike',
      },
      {
        icon: 'delete-icon',
        title: 'Delete',
        colour: 'red',
        handler: 'delete',
      },
    ],
    posx: -200,
    posy: -200,
    index: -1,
    addSongToAlbumSong: null,
  }),
  computed: {
    mozaicImages() {
      return this.images || [this.image];
    },
  },
  props: {
    subtext: { type: String, default: null },
    title: { type: String, required: true },
    songs: { type: Array, required: true },
    image: { type: String },
    images: { type: Array },
  },
  methods: {
    ...mapMutations('queue', ['enqueue']),
    playSong(index) {
      this.enqueue({ songs: displace(this.songs, index) });
      this.reset();
    },
    addToAlbum() {
      this.addSongToAlbumSong = this.songs[this.index];
      this.reset();
    },
    toggleLike() {
      this.$store.dispatch('toggleLiked', this.songs[this.index]);
      this.reset();
    },
    deleteSong() {
      this.$store.dispatch('deleteSong', this.songs[this.index]);
      this.reset();
    },
    openContextMenu(event, index) {
      const { liked } = this.songs[index];
      this.index = index;

      this.items[2].title = liked ? 'Unlike' : 'Like';
      this.items[2].icon = liked ? 'heart-icon' : 'heart-outline-icon';

      const scrollEl = document.getElementById('scroll-el');

      if (scrollEl) {
        this.posx = event.pageX + scrollEl.scrollLeft - 50;
        this.posy = event.pageY + scrollEl.scrollTop;
      }
    },
    reset() {
      this.posx = -200;
      this.posy = -200;
    },
  },
  components: {
    SongItem,
    DotsHorizontalIcon,
    MozaicImage,
    ContextMenu,
    AddSongToAlbum,
  },
});
</script>

<style lang="scss" scoped>
@import '@/vars.scss';

.page {
  @include flex-box(flex-end, flex-start);

  padding-top: 0;
  padding-bottom: 0;
}

.details {
  @include flex-box($direction: column);

  flex-basis: 400px;
  position: sticky;
  top: 50%;
  right: calc(95% - 400px - 1.5rem);
  transform: translateY(-50%);
  bottom: auto;

  .mozaic {
    width: 270px;
    height: 270px;
    border-radius: 10px;
    margin-bottom: 1.5rem;
  }

  h3 {
    font-size: 1.5rem;
    max-width: 400px;
    text-align: center;
  }

  .subtext {
    color: $subtext;
  }

  .del {
    background: #a71e1e;
  }

  .subbuttons {
    @include flex-box;

    button {
      margin: 0.5ch;
      width: 9ch;
    }
  }

  .button-bar {
    @include flex-box;

    margin-top: 1.5rem;
    width: 100%;

    button {
      width: 15ch;
      margin: 0.5ch;
    }
  }
}

.songs {
  width: calc(95% - 400px - 1.5rem);
  margin-top: 2rem;
  margin-bottom: calc(2rem + var(--extra-padding));
}

@media screen and (max-width: 1000px) {
  .page {
    flex-direction: column;

    .details {
      position: static;
      transform: translateY(0);
      width: 100%;
    }

    .songs {
      width: 100%;
    }
  }
}
</style>
