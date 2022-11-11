<template>
  <div class="scroll-el" id="scroll-el" key="albums">
    <div class="page">
      <add-custom-album :show="showAddCustomAlbum" @close="showAddCustomAlbum = false" />
      <context-menu
        :items="items"
        :posx="posx"
        :posy="posy"
        @reset="reset"
        @playAlbum="playAlbum"
        @playCustomAlbum="playCustomAlbum"
        @deleteCustomAlbum="deleteCustomAlbum"
      />
      <h1 class="header">Custom Albums</h1>
      <ul class="albums">
        <cover-image
          title="Liked"
          :subtitle="likedSubtitle"
          :image="likedImage"
          @left-click="$router.push({ name: '\\liked-page' })"
          @right-click="openContextMenu($event, -1, false)"
        />
        <cover-image
          v-for="(album, index) in customAlbums"
          :key="album.id"
          :title="album.name"
          :subtitle="customAlbumSubtitles[index]"
          :image="musicSymbol"
          @left-click="$router.push({ name: '\\c-album-page', query: album })"
          @right-click="openContextMenu($event, index, true)"
        />
        <button class="plus" title="Add Custom Album" @click="showAddCustomAlbum = true">
          <plus-icon />
        </button>
      </ul>
      <h1 class="header">Albums</h1>
      <ul class="albums">
        <cover-image
          v-for="(album, index) in albums"
          :key="album.id"
          :title="album.name"
          :subtitle="albumSubtitles[index]"
          :image="album.imagePath"
          @left-click="$router.push({ name: '\\album-page', query: album })"
          @right-click="openContextMenu($event, index, false)"
        />
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapMutations } from 'vuex';
import PlusIcon from 'vue-material-design-icons/Plus.vue';

import generateSubtitle from '@/helpers/generateSubtitle';
import { stringifyArr } from '@/helpers/database_functions';
import musicSymbol from '@/assets/music_symbol.png';
import likedImage from '@/assets/liked.png';
import CoverImage from '@/components/CoverImage.vue';
import ContextMenu from '@/components/ContextMenu.vue';
import AddCustomAlbum from '@/components/AddCustomAlbum.vue';

interface CData {
  musicSymbol: string;
  likedImage: string;
  likedSubtitle: string;
  albums: AlbumData[];
  customAlbums: CustomAlbumData[];
  posx: number;
  posy: number;
  albumItems: ContextMenuItem[];
  customAlbumItems: ContextMenuItem[];
  items: ContextMenuItem[];
  index: number;
  showAddCustomAlbum: boolean;
}

interface CMethods {
  enqueue: Enqueue;
  playAlbum: () => Promise<void>;
  playCustomAlbum: () => Promise<void>;
  deleteCustomAlbum: () => void;
  openContextMenu: (event: MouseEvent, index: number, deletable: boolean) => void;
  reset: () => void;
  fetchData: () => void;
}

interface CComputed {
  albumSubtitles: string[];
  customAlbumSubtitles: string[];
}

export default Vue.extend<CData, CMethods, CComputed>({
  name: 'albums-page',
  data: () => ({
    musicSymbol,
    likedImage,
    likedSubtitle: '',
    albums: [],
    customAlbums: [],
    posx: -200,
    posy: -200,
    showAddCustomAlbum: false,
    albumItems: [
      {
        icon: 'playlist-play-icon',
        title: 'Play',
        handler: 'playAlbum',
      },
    ],
    customAlbumItems: [
      {
        icon: 'playlist-play-icon',
        title: 'Play',
        handler: 'playCustomAlbum',
      },
      {
        icon: 'delete-icon',
        title: 'Delete',
        colour: 'red',
        handler: 'deleteCustomAlbum',
      },
    ],
    items: [],
    index: -1,
  }),
  computed: {
    customAlbumSubtitles() {
      return this.customAlbums.map(a =>
        generateSubtitle({
          type: 'Album',
          numSongs: a.songs.length,
        })
      );
    },
    albumSubtitles() {
      return this.albums.map(a =>
        generateSubtitle({
          type: 'Album',
          numSongs: a.numSongs,
        })
      );
    },
  },
  methods: {
    ...mapMutations('queue', ['enqueue']),
    async playAlbum() {
      if (this.index === -1) {
        const songs = await window.db.getSongs('liked');
        this.enqueue({ songs });
      } else {
        const songs = await window.db.getSongs('albumId LIKE ?', [this.albums[this.index].id]);
        this.enqueue({ songs });
      }
      this.reset();
    },
    async playCustomAlbum() {
      const songs = await window.db.getSongs(
        `title IN (${stringifyArr(this.customAlbums[this.index].songs)})`
      );
      this.enqueue({ songs });
      this.reset();
    },
    deleteCustomAlbum() {
      this.$store.dispatch('deleteCustomAlbum', this.customAlbums[this.index].id);
      this.reset();
    },
    openContextMenu(event, index, deletable) {
      const scrollEl = document.getElementById('scroll-el');

      if (deletable) {
        this.items = this.customAlbumItems;
      } else {
        this.items = this.albumItems;
      }

      this.index = index;

      if (scrollEl) {
        this.posx = event.pageX + scrollEl.scrollLeft - 50;
        this.posy = event.pageY + scrollEl.scrollTop;
      }
    },
    reset() {
      this.posx = -200;
      this.posy = -200;
    },
    fetchData() {
      window.db.getNumLiked().then(numLiked => {
        this.likedSubtitle = generateSubtitle({ type: 'Album', numSongs: numLiked });
      });
      window.db.getAlbums().then(albums => {
        this.albums = albums;
      });
      window.db.getCustomAlbums().then(albums => {
        this.customAlbums = albums;
      });
    },
  },
  watch: {
    '$store.state.updater': function () {
      this.fetchData();
    },
  },
  beforeMount() {
    this.fetchData();
  },
  components: {
    PlusIcon,
    CoverImage,
    ContextMenu,
    AddCustomAlbum,
  },
});
</script>

<style lang="scss" scoped>
@import '@/vars.scss';

.albums {
  display: inline-grid;
  grid-template-columns: repeat(auto-fill, 10rem);
  gap: 1.1rem;
  width: 100%;
  justify-content: space-between;
  margin-top: 0.5rem;
  margin-bottom: 2rem;
}

.plus {
  @include flex-box;

  width: 10rem;
  height: 10rem;
  background: $primary;
  margin-top: (13.3rem - (1.8rem + 10rem))/4;
  border-radius: 5%;
  cursor: pointer;
  transition: 0.2s;

  svg {
    height: 3rem;
    width: 3rem;
  }

  &:hover {
    background: lighten($primary, 10%);
  }
}
</style>
