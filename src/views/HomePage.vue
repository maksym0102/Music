<template>
  <div class="scroll-el" id="scroll-el" key="home">
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
        @playAlbum="playAlbum"
        @play="playSong(index)"
        @addToAlbum="addToAlbum"
        @toggleLike="toggleLike"
        @delete="deleteSong"
      />
      <p v-if="topSongs === null" class="nothing">No Songs</p>
      <template v-else>
        <h1 class="header">Top Albums</h1>
        <ul class="cover-images">
          <cover-image
            v-for="(album, index) in topAlbums"
            :key="album.id"
            :title="album.name"
            :subtitle="albumSubtitles[index]"
            :image="album.imagePath"
            @right-click="openContextMenu($event, index, false)"
            @left-click="$router.push({ name: '\\album-page', query: album })"
          />
        </ul>
        <h1 class="header">Top Songs</h1>
        <ul class="cover-images">
          <cover-image
            v-for="(song, index) in topSongs"
            :key="song.title"
            :title="song.title"
            :subtitle="songSubtitles[index]"
            :image="song.thumbnail"
            @right-click="openContextMenu($event, index, true)"
            @left-click="playSong(index)"
          />
        </ul>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapMutations } from 'vuex';

import generateSubtitle from '@/helpers/generateSubtitle';
import { displace } from '@/helpers/displace';
import CoverImage from '@/components/CoverImage.vue';
import ContextMenu from '@/components/ContextMenu.vue';
import AddSongToAlbum from '@/components/AddSongToAlbum.vue';

interface CData {
  topSongs: SongData[] | null;
  topAlbums: AlbumData[] | null;
  posx: number;
  posy: number;
  songItems: ContextMenuItem[];
  albumItems: ContextMenuItem[];
  items: ContextMenuItem[];
  index: number;
  addSongToAlbumSong: SongData | null;
}

interface CMethods {
  enqueue: Enqueue;
  playSong: (index: number) => Promise<void>;
  playAlbum: () => Promise<void>;
  addToAlbum: () => void;
  toggleLike: () => void;
  deleteSong: () => void;
  openContextMenu: (event: MouseEvent, index: number, deletable: boolean) => void;
  reset: () => void;
  fetchData: () => void;
}

interface CComputed {
  songSubtitles: string[];
  albumSubtitles: string[];
}

export default Vue.extend<CData, CMethods, CComputed>({
  name: 'home-page',
  data: () => ({
    topSongs: [],
    topAlbums: [],
    posx: -200,
    posy: -200,
    songItems: [
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
    albumItems: [
      {
        icon: 'playlist-play-icon',
        title: 'Play',
        handler: 'playAlbum',
      },
    ],
    items: [],
    index: 0,
    addSongToAlbumSong: null,
  }),
  computed: {
    songSubtitles() {
      if (this.topSongs === null) return [];
      return this.topSongs.map(s =>
        generateSubtitle({
          type: 'Song',
          artist: s.artist,
        })
      );
    },
    albumSubtitles() {
      if (this.topAlbums === null) return [];
      return this.topAlbums.map(a =>
        generateSubtitle({
          type: 'Album',
          artist: a.artist,
        })
      );
    },
  },
  methods: {
    ...mapMutations('queue', ['enqueue']),
    async playAlbum() {
      if (this.topAlbums === null) throw new Error('No Albums');
      const songs = await window.db.getSongs('albumId LIKE ?', [this.topAlbums[this.index].id]);
      this.enqueue({ songs });
      this.reset();
    },
    async playSong(index) {
      if (this.topSongs === null) throw new Error('No Songs');
      const songs = await window.db.getTopSongs();
      this.enqueue({ songs: displace(songs, index) });
      this.reset();
    },
    addToAlbum() {
      if (this.topSongs === null) throw new Error('No Songs');
      this.addSongToAlbumSong = this.topSongs[this.index];
      this.reset();
    },
    toggleLike() {
      if (this.topSongs === null) throw new Error('No Songs');
      this.$store.dispatch('toggleLiked', this.topSongs[this.index]);
      this.reset();
    },
    deleteSong() {
      if (this.topSongs === null) throw new Error('No Songs');
      this.$store.dispatch('deleteSong', this.topSongs[this.index]);
      this.reset();
    },
    openContextMenu(event, index, isSong) {
      if (this.topSongs === null) throw new Error('No Songs');
      if (isSong) {
        const { liked } = this.topSongs[index];

        this.songItems[2].title = liked ? 'Unlike' : 'Like';
        this.songItems[2].icon = liked ? 'heart-icon' : 'heart-outline-icon';

        this.items = this.songItems;
      } else {
        this.items = this.albumItems;
      }

      this.index = index;

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
      window.db.getTop().then(({ songs, albums }) => {
        this.topSongs = songs.length ? songs : null;
        this.topAlbums = albums.length ? albums : null;
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
    CoverImage,
    ContextMenu,
    AddSongToAlbum,
  },
});
</script>

<style lang="scss" scoped>
@import '@/vars.scss';

.cover-images {
  @include flex-box(space-between);

  flex-wrap: wrap;
  margin-top: 1rem;
  margin-bottom: 2.5rem;
  min-height: 14rem;

  .cover-image {
    margin-right: 1rem;
    transition: 1s;
    &:last-child {
      margin-right: 0;
    }
  }
}
</style>
