<template>
  <song-page
    :songs="songs"
    :image="image"
    :title="album.name"
    :subtext="subtext"
    @edit="showEdit = true"
    @delete="deleteAlbum"
  >
    <edit-custom-album v-if="isCustom" :show="showEdit" :album="album" @close="showEdit = false" />
  </song-page>
</template>

<script lang="ts">
import Vue from 'vue';

import generateSubtitle from '@/helpers/generateSubtitle';
import { stringifyArr } from '@/helpers/database_functions';
import musicSymbol from '@/assets/music_symbol.png';
import SongPage from '@/components/SongPage.vue';
import EditCustomAlbum from '@/components/EditCustomAlbum.vue';

interface CData {
  songs: SongData[];
  showEdit: boolean;
}

interface CMethods {
  fetchData: (songs?: string[]) => void;
  deleteAlbum: () => void;
}

interface CComputed {
  image: string;
  subtext: string | null;
}

interface CADProps {
  isCustom: true;
  album: CustomAlbumData;
}

interface ADProps {
  isCustom: false;
  album: AlbumData;
}

export default Vue.extend<CData, CMethods, CComputed, CADProps | ADProps>({
  name: 'album-page',
  data: () => ({
    songs: [],
    showEdit: false,
  }),
  props: {
    album: Object,
    isCustom: Boolean as any, // TS doesnt like Boolean being converted to true | false
  },
  computed: {
    image() {
      return this.isCustom ? musicSymbol : this.album.imagePath;
    },
    subtext() {
      if (this.isCustom) return null;
      return generateSubtitle({
        type: 'Album',
        artist: this.album.artist,
      });
    },
  },
  methods: {
    fetchData(songs?: string[]) {
      if (songs) {
        window.db.getSongs(`title IN (${stringifyArr(songs)})`).then(songs => {
          this.songs = songs;
        });
      } else {
        window.db.getSongs('albumId LIKE ?', [this.album.id]).then(songs => {
          this.songs = songs;
        });
      }
    },
    async deleteAlbum() {
      if (!this.isCustom) throw new Error('Only allowed for custom albums');
      await this.$store.dispatch('deleteCustomAlbum', this.album.id);
      this.$router.back();
    },
  },
  watch: {
    '$store.state.updater': async function () {
      const album = await window.db.getCustomAlbums('id LIKE ?', [this.album.id]);
      this.fetchData(album[0].songs);
    },
  },
  beforeMount() {
    if (this.isCustom) {
      this.fetchData(this.album.songs);
    } else {
      this.fetchData();
    }
  },
  components: {
    SongPage,
    EditCustomAlbum,
  },
});
</script>
