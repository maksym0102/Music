<template>
  <div class="scroll-el" id="scroll-el" key="queue">
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
        @addToAlbum="addToAlbum(index)"
        @toggleLike="toggleLike(index)"
        @delete="deleteSong"
      />
      <section class="details">
        <img
          class="thumbnail"
          :src="current.thumbnail"
          :alt="current.title"
          :title="current.title"
        />
        <h3>{{ current.title }}</h3>
        <p class="subtext">{{ current.artist }}</p>
        <div class="control-bar">
          <button title="Add to Album" @click="addSongToAlbumSong = current">
            <playlist-plus-icon title="Add to Album" :size="24" />
          </button>
          <button title="Shuffle" @click="toggleShuffle">
            <shuffle-icon :selected="shuffle" />
          </button>

          <button
            class="prev"
            title="Previous Song"
            @click="prevSong()"
            :disabled="queue.length <= 1"
          >
            <rewind-icon :size="24" title="Previous Song" />
          </button>
          <button class="play-pause" :title="playing ? 'Pause' : 'Play'" @click="togglePlay">
            <play-pause :playing="playing" />
          </button>
          <button class="next" title="Next Song" @click="nextSong()" :disabled="queue.length <= 1">
            <fast-forward-icon :size="24" title="Next Song" />
          </button>

          <button title="Loop" @click="toggleLoop">
            <loop-icon :selected="loop" />
          </button>
          <button :title="current.liked ? 'Unlike' : 'Like'" @click="toggleLike(-1)">
            <heart-icon title="Unlike" v-if="current.liked" :size="24" fillColor="#ab1313" />
            <heart-outline-icon title="Like" v-else :size="24" />
          </button>
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
import { mapState, mapMutations } from 'vuex';
import { remote, ipcRenderer } from 'electron';
import DotsHorizontalIcon from 'vue-material-design-icons/DotsHorizontal.vue';
import FastForwardIcon from 'vue-material-design-icons/FastForward.vue';
import RewindIcon from 'vue-material-design-icons/Rewind.vue';
import PlaylistPlusIcon from 'vue-material-design-icons/PlaylistPlus.vue';
import HeartIcon from 'vue-material-design-icons/Heart.vue';
import HeartOutlineIcon from 'vue-material-design-icons/HeartOutline.vue';

import { displaceWithoutIndex } from '@/helpers/displace';
import PlayPause from '@/components/PlayPause.vue';
import LoopIcon from '@/components/LoopIcon.vue';
import ShuffleIcon from '@/components/ShuffleIcon.vue';
import SongItem from '@/components/SongItem.vue';
import ContextMenu from '@/components/ContextMenu.vue';
import AddSongToAlbum from '@/components/AddSongToAlbum.vue';

interface CData {
  posx: number;
  posy: number;
  items: ContextMenuItem[];
  contextMenuIndex: number;
  addSongToAlbumSong: SongData | null;
  playing: boolean;
}

interface CMethods {
  playSong: (index: number) => void;
  addToAlbum: (index: number) => void;
  toggleLike: (index: number) => void;
  deleteSong: () => void;
  openContextMenu: (event: MouseEvent, index: number, deletable: boolean) => void;
  reset: () => void;
  // Controls bar specific
  togglePlay: () => void;
  prevSong: () => void;
  nextSong: () => void;
  toggleShuffle: () => void;
  toggleLoop: () => void;
}

interface CComputed {
  queue: SongData[];
  queueIndex: number;
  loop: boolean;
  shuffle: boolean;
  current: SongData;
  songs: SongData[];
}

export default Vue.extend<CData, CMethods, CComputed>({
  name: 'queue-page',
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
    contextMenuIndex: -1,
    addSongToAlbumSong: null,
    playing: localStorage.getItem('playing') !== 'false',
  }),
  computed: {
    ...mapState('queue', ['queue', 'loop', 'shuffle']),
    ...mapState('queue', {
      queueIndex: 'index',
    }),
    current() {
      return this.queue[this.queueIndex];
    },
    songs() {
      return displaceWithoutIndex(this.queue, this.queueIndex);
    },
  },
  methods: {
    ...mapMutations('queue', ['prevSong', 'nextSong', 'toggleShuffle', 'toggleLoop']),
    togglePlay() {
      remote.getCurrentWebContents().send('pause-play');
    },
    playSong(index) {
      this.$store.commit('queue/gotoSong', index + this.queueIndex);
      this.reset();
    },
    addToAlbum(index) {
      this.addSongToAlbumSong = index < 0 ? this.current : this.songs[index];
      this.reset();
    },
    toggleLike(index) {
      this.$store.dispatch('toggleLiked', index < 0 ? this.current : this.songs[index]);
      this.reset();
    },
    deleteSong() {
      this.$store.dispatch('deleteSong', this.songs[this.contextMenuIndex]);
      this.reset();
    },
    openContextMenu(event, index) {
      const { liked } = this.songs[index];
      this.contextMenuIndex = index;

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
  mounted() {
    ipcRenderer.on('song-pause-play', (_, isPaused) => {
      console.log(isPaused);
      this.playing = !isPaused;
    });
  },
  components: {
    SongItem,
    DotsHorizontalIcon,
    ContextMenu,
    AddSongToAlbum,
    FastForwardIcon,
    RewindIcon,
    PlaylistPlusIcon,
    HeartIcon,
    HeartOutlineIcon,
    PlayPause,
    LoopIcon,
    ShuffleIcon,
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

  .thumbnail {
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

  .control-bar {
    @include flex-box(space-around);

    margin-top: 1.5rem;
    padding: 0.5rem 0.7rem;
    width: min-content;
    background: $secondary;
    border-radius: 0.4rem;

    > button {
      margin: 0 0.7ch;
    }
  }
}

.play-pause {
  height: 18px;
  margin: 0 1ch;

  svg {
    height: 18px;
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
