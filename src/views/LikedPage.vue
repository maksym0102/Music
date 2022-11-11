<template>
  <song-page :songs="songs" :image="image" title="Liked" :subtext="subtext" />
</template>

<script lang="ts">
import Vue from 'vue';

import generateSubtitle from '@/helpers/generateSubtitle';
import likedImage from '@/assets/liked.png';
import SongPage from '@/components/SongPage.vue';

interface CData {
  songs: SongData[];
  image: string;
}

interface CMethods {
  fetchData: () => void;
}

interface CComputed {
  subtext: string;
}

export default Vue.extend<CData, CMethods, CComputed>({
  name: 'album-page',
  data: () => ({
    songs: [],
    image: likedImage,
  }),
  computed: {
    subtext() {
      return generateSubtitle({
        type: 'Liked',
        numSongs: this.songs.length,
      });
    },
  },
  methods: {
    fetchData() {
      window.db.getSongs('liked').then(songs => {
        this.songs = songs;
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
    SongPage,
  },
});
</script>
