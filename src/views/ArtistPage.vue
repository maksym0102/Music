<template>
  <song-page :songs="songs" :images="artist.images" :title="artist.name" :subtext="subtext" />
</template>

<script lang="ts">
import Vue from 'vue';

import generateSubtitle from '@/helpers/generateSubtitle';
import SongPage from '@/components/SongPage.vue';

interface CData {
  songs: SongData[];
}

interface CMethods {
  fetchData: () => void;
}

interface CComputed {
  subtext: string | null;
}

interface CProps {
  artist: ArtistData;
}

export default Vue.extend<CData, CMethods, CComputed, CProps>({
  name: 'artist-page',
  data: () => ({
    songs: [],
  }),
  props: {
    artist: Object,
  },
  computed: {
    subtext() {
      return generateSubtitle({
        type: 'Artist',
        numSongs: this.songs.length,
      });
    },
  },
  methods: {
    fetchData() {
      window.db.getSongs('artist LIKE ?', [this.artist.name]).then(songs => {
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
