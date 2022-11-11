<template>
  <div class="scroll-el" id="scroll-el" key="music">
    <div class="page">
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
      <div class="top">
        <h1 class="header">My Music</h1>
        <search-bar v-if="allSongs !== null" placeholder="Filter" @search="searchQuery = $event" />
      </div>
      <div class="button-bar">
        <button class="btn" @click.left="playSong(0)">Play All</button>
        <button class="btn" @click.left="playSong(random(), true)">Play Random</button>
      </div>
      <p v-if="songs === null || songs.length === 0" class="nothing">No Songs</p>
      <template v-else>
        <song-item
          v-for="(song, index) of songs"
          :key="song.title"
          :song="song"
          @right-click="openContextMenu($event, index)"
          @left-click="playSong(index)"
        >
          <dots-horizontal-icon title="Options" @click.stop="openContextMenu($event, index)" />
        </song-item>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapMutations } from 'vuex';
import DotsHorizontalIcon from 'vue-material-design-icons/DotsHorizontal.vue';

import { displace } from '@/helpers/displace';
import SongItem from '@/components/SongItem.vue';
import SearchBar from '@/components/SearchBar.vue';
import ContextMenu from '@/components/ContextMenu.vue';
import AddSongToAlbum from '@/components/AddSongToAlbum.vue';

interface CData {
  allSongs: SongData[] | null;
  searchQuery: string;
  items: ContextMenuItem[];
  posx: number;
  posy: number;
  index: number;
  addSongToAlbumSong: SongData | null;
}

interface CMethods {
  enqueue: Enqueue;
  playSong: (index: number, shuffle?: boolean) => void;
  addToAlbum: () => void;
  toggleLike: () => void;
  deleteSong: () => void;
  random: () => number;
  openContextMenu: (event: MouseEvent, index: number, deletable: boolean) => void;
  reset: () => void;
  fetchData: () => void;
}

interface CComputed {
  songs: SongData[] | null;
}

export default Vue.extend<CData, CMethods, CComputed>({
  name: 'music-page',
  data: () => ({
    allSongs: [],
    searchQuery: '',
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
  methods: {
    ...mapMutations('queue', ['enqueue']),
    playSong(index, shuffle = false) {
      if (this.songs === null) throw new Error('No Songs');
      this.enqueue({ songs: displace(this.songs, index), shuffle });
      this.reset();
    },
    addToAlbum() {
      if (this.songs === null) throw new Error('No Songs');
      this.addSongToAlbumSong = this.songs[this.index];
      this.reset();
    },
    toggleLike() {
      if (this.songs === null) throw new Error('No Songs');
      this.$store.dispatch('toggleLiked', this.songs[this.index]);
      this.reset();
    },
    deleteSong() {
      if (this.songs === null) throw new Error('No Songs');
      this.$store.dispatch('deleteSong', this.songs[this.index]);
      this.reset();
    },
    openContextMenu(event, index) {
      if (this.songs === null) throw new Error('No Songs');
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
    fetchData() {
      window.db.getSongs().then(songs => {
        this.allSongs = songs.length ? songs : null;
      });
    },
    random() {
      if (this.songs) return Math.floor(Math.random() * this.songs.length);
      return -1;
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
  computed: {
    songs() {
      if (this.allSongs === null) return null;
      return this.allSongs.filter(s => {
        const hay = s.title.toLowerCase();
        let i = 0;
        let n = -1;
        let l;
        const query = this.searchQuery.toLowerCase();
        // eslint-disable-next-line
        for (; (l = query[i++]); ) {
          n = hay.indexOf(l, n + 1);
          if (n < 0) return false;
        }
        return true;
      });
    },
  },
  components: {
    DotsHorizontalIcon,
    SongItem,
    SearchBar,
    ContextMenu,
    AddSongToAlbum,
  },
});
</script>

<style lang="scss" scoped>
@import '@/vars.scss';

.top {
  @include flex-box(space-between);
  margin-bottom: 0.5rem;
}

.button-bar {
  @include flex-box(flex-start);

  margin-bottom: 2rem;
}

.btn {
  margin-right: 0.8rem;
}
</style>
