<!-- eslint-disable max-len   For the svg paths -->
<template>
  <div class="player-bar-wrapper">
    <add-song-to-album
      :show="showAddSongToAlbum"
      :song="current"
      @close="showAddSongToAlbum = false"
    />
    <transition name="player-bar">
      <div v-if="playingSongs" :class="['player-bar', { hide }]" @click="$router.push('/queue')">
        <div class="controls">
          <div>
            <img
              :title="current.title"
              :src="current.thumbnail"
              :alt="current.title"
              class="album"
            />
            <div class="text">
              <p class="song">{{ current.title }}</p>
              <p class="artist">{{ current.artist }}</p>
            </div>
          </div>
          <div>
            <button
              class="prev"
              title="Previous Song"
              @click.stop="prevSong()"
              :disabled="queue.length <= 1"
            >
              <rewind-icon :size="24" title="Previous Song" />
            </button>
            <button class="play-pause" :title="playPauseTitle" @click.stop="togglePlay">
              <play-pause :playing="playing" />
            </button>
            <button
              class="next"
              title="Next Song"
              @click.stop="nextSong()"
              :disabled="queue.length <= 1"
            >
              <fast-forward-icon :size="24" title="Next Song" />
            </button>
          </div>
          <div class="end">
            <button :title="current.liked ? 'Unlike' : 'Like'" @click.stop="toggleLiked(current)">
              <heart-icon title="Unlike" v-if="current.liked" :size="24" fillColor="#ab1313" />
              <heart-outline-icon title="Like" v-else :size="24" />
            </button>
            <button title="Loop" @click.stop="toggleLoop">
              <loop-icon :selected="loop" />
            </button>
            <button title="Shuffle" @click.stop="toggleShuffle">
              <shuffle-icon :selected="shuffle" />
            </button>
            <button title="Add to Album" @click.stop="showAddSongToAlbum = true">
              <playlist-plus-icon title="Add to Album" :size="24" />
            </button>
            <p class="timestamp" :style="{ width: `${timestamp.length - 2.5}ch` }">
              {{ timestamp }}
            </p>
          </div>
        </div>
        <button title="Close" class="close" @click.stop="dequeue">
          ×
        </button>
        <audio
          ref="audio"
          @ended="nextSong"
          :loop="loop"
          @timeupdate="currentTime = Math.round($event.target.currentTime)"
          @error="logError"
          :autoplay="playing"
          :src="`file://${current.filePath}`"
        ></audio>
        <input
          type="range"
          name="timeline"
          class="timeline"
          :value="currentTime"
          :min="0"
          :max="current.length"
          @input="$refs.audio.currentTime = $event.target.valueAsNumber"
        />
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapState, mapMutations, mapActions } from 'vuex';
import { ipcRenderer } from 'electron';
import FastForwardIcon from 'vue-material-design-icons/FastForward.vue';
import RewindIcon from 'vue-material-design-icons/Rewind.vue';
import PlaylistPlusIcon from 'vue-material-design-icons/PlaylistPlus.vue';
import HeartIcon from 'vue-material-design-icons/Heart.vue';
import HeartOutlineIcon from 'vue-material-design-icons/HeartOutline.vue';

import formatLength from '@/helpers/formatLength';

import PlayPause from './PlayPause.vue';
import AddSongToAlbum from './AddSongToAlbum.vue';
import LoopIcon from './LoopIcon.vue';
import ShuffleIcon from './ShuffleIcon.vue';

interface CData {
  playing: boolean;
  currentTime: number;
  showAddSongToAlbum: boolean;
}

interface CMethods {
  toggleLiked: (song: SongData) => void;
  togglePlay: () => void;
  prevSong: () => void;
  nextSong: () => void;
  dequeue: () => void;
  toggleShuffle: () => void;
  toggleLoop: () => void;
  logError: (error: any) => void;
  addListeners: () => void;
  removeListeners: () => void;
}

interface CComputed {
  queue: SongData[];
  index: number;
  loop: boolean;
  shuffle: boolean;
  current: SongData;
  playingSongs: boolean;
  playPauseTitle: string;
  timestamp: string;
  jumpAhead: number;
  seekAhead: number;
  seekBack: number;
  jumpBack: number;
  controlWindow: boolean;
  hide: boolean;
}

export default Vue.extend<CData, CMethods, CComputed>({
  name: 'player-bar',
  data: () => ({
    playing: true,
    currentTime: 0,
    showAddSongToAlbum: false,
  }),
  methods: {
    ...mapMutations('queue', ['prevSong', 'nextSong', 'dequeue', 'toggleShuffle', 'toggleLoop']),
    ...mapActions(['toggleLiked']),
    logError(error: any) {
      console.error(error);
    },
    togglePlay() {
      this.playing = !this.playing;

      if (this.playing) {
        (this.$refs.audio as HTMLAudioElement).play();
      } else {
        (this.$refs.audio as HTMLAudioElement).pause();
      }
    },
    addListeners() {
      ipcRenderer.on('jump-back', () => {
        (this.$refs.audio as HTMLAudioElement).currentTime -= this.jumpBack;
      });
      ipcRenderer.on('seek-back', () => {
        (this.$refs.audio as HTMLAudioElement).currentTime -= this.seekBack;
      });
      ipcRenderer.on('seek-ahead', () => {
        (this.$refs.audio as HTMLAudioElement).currentTime += this.seekAhead;
      });
      ipcRenderer.on('jump-ahead', () => {
        (this.$refs.audio as HTMLAudioElement).currentTime += this.jumpAhead;
      });
      ipcRenderer.on('volume++', () => {
        (this.$refs.audio as HTMLAudioElement).volume += 0.05;
      });
      ipcRenderer.on('volume--', () => {
        (this.$refs.audio as HTMLAudioElement).volume -= 0.05;
      });
      ipcRenderer.on('loop-song', () => {
        this.toggleLoop();
      });
      ipcRenderer.on('shuffle-songs', () => {
        this.toggleShuffle();
      });
      ipcRenderer.on('prev-track', () => this.prevSong());
      ipcRenderer.on('next-track', () => this.nextSong());
      ipcRenderer.on('stop-track', () => this.dequeue());
      ipcRenderer.on('pause-play', () => {
        this.togglePlay();
      });
    },
    removeListeners() {
      ipcRenderer.removeAllListeners('jump-back');
      ipcRenderer.removeAllListeners('seek-back');
      ipcRenderer.removeAllListeners('seek-ahead');
      ipcRenderer.removeAllListeners('jump-ahead');
      ipcRenderer.removeAllListeners('volume++');
      ipcRenderer.removeAllListeners('volume--');
      ipcRenderer.removeAllListeners('loop-song');
      ipcRenderer.removeAllListeners('shuffle-songs');
      ipcRenderer.removeAllListeners('prev-track');
      ipcRenderer.removeAllListeners('next-track');
      ipcRenderer.removeAllListeners('stop-track');
      ipcRenderer.removeAllListeners('pause-play');
    },
  },
  computed: {
    ...mapState('queue', ['queue', 'index', 'loop', 'shuffle']),
    ...mapState('settings', ['jumpAhead', 'seekAhead', 'seekBack', 'jumpBack', 'controlWindow']),
    current() {
      return this.queue[this.index];
    },
    playingSongs() {
      return this.queue.length > 0;
    },
    playPauseTitle() {
      return this.playing ? 'Pause' : 'Play';
    },
    timestamp() {
      return formatLength(this.currentTime, this.current.length).join(' / ');
    },
    hide() {
      return this.$route.name === '\\queue-page';
    },
  },
  mounted() {
    if (this.playingSongs) {
      this.playing = localStorage.getItem('playing') !== 'false';
      this.currentTime = parseInt(localStorage.getItem('currentTime') ?? '0', 10);
      (this.$refs.audio as HTMLAudioElement).currentTime = this.currentTime;
      this.addListeners();

      if (this.controlWindow) {
        ipcRenderer.send('toggle-remote', this.current);
      }
    }
  },
  watch: {
    playing(newPlaying: boolean) {
      localStorage.setItem('playing', newPlaying.toString());
      ipcRenderer.send('main-play-pause', !newPlaying);
    },
    currentTime(newCurrentTime: number) {
      localStorage.setItem('currentTime', newCurrentTime.toString());
    },
    playingSongs(newPlayingSongs: boolean) {
      if (!newPlayingSongs) {
        document.documentElement.style.setProperty('--extra-padding', '0px');
        localStorage.setItem('currentTime', '-1');
        this.removeListeners();

        if (this.controlWindow) {
          ipcRenderer.send('toggle-remote');
        }
      } else {
        document.documentElement.style.setProperty('--extra-padding', '4rem');
        this.addListeners();

        if (this.controlWindow) {
          ipcRenderer.send('toggle-remote', this.current);
        }
      }
    },
    current() {
      this.currentTime = 0;
      this.playing = true;

      if (this.controlWindow && this.current) {
        ipcRenderer.send('main-song-update', this.current);
      }
    },
    controlWindow(newControlWindow) {
      if (this.current) {
        if (newControlWindow) {
          ipcRenderer.send('toggle-remote', this.current);
        } else {
          ipcRenderer.send('toggle-remote');
        }
      }
    },
  },
  components: {
    PlayPause,
    FastForwardIcon,
    RewindIcon,
    PlaylistPlusIcon,
    HeartIcon,
    HeartOutlineIcon,
    AddSongToAlbum,
    LoopIcon,
    ShuffleIcon,
  },
});
</script>

<style lang="scss" scoped>
@import '@/vars.scss';

.player-bar-wrapper {
  width: 100vw;
  height: 100vh;
  position: fixed;
  pointer-events: none;
  z-index: 3;

  > * {
    pointer-events: all;
  }
}

.player-bar {
  width: 70vw;
  height: 4.8rem;
  border-radius: 0.75rem;
  background: transparentize($color: $secondary, $amount: 0.35);
  backdrop-filter: blur(25px);
  position: fixed;
  bottom: 0.5rem;
  left: 15vw;
  box-shadow: 0 0 20px 7px #00000059;
  overflow: hidden;

  &-enter-active,
  &-leave-active {
    transition: 0.5s cubic-bezier(0.215, 0.61, 0.355, 1);
  }
  &-enter,
  &-leave-to {
    transform: translateY(5rem);
  }
}

.hide {
  display: none;
  pointer-events: none;
}

.controls {
  @include flex-box(space-between);

  padding: 0.5rem 1.3rem;
  height: 4.5rem;
  width: 70vw;
  border-radius: 0.75rem;

  * {
    user-select: none;
  }

  > div {
    @include flex-box;

    flex: 1;

    &:nth-of-type(1) {
      justify-content: flex-start;
    }
    &:nth-of-type(3) {
      justify-content: flex-end;
    }
  }
}

.close {
  opacity: 0;
  transition: 0.3s;
  cursor: pointer;
  position: absolute;
  top: 0.3ch;
  right: 0.7ch;
  font-size: 1.4rem;

  &:hover {
    opacity: 1;
  }
}

.album {
  height: 2.6rem;
  border-radius: 0.3rem;
}

.text {
  padding: 0 1ch;

  .artist {
    color: $subtext;
    font-size: 0.8rem;
  }
}

button:disabled {
  opacity: 0.6;
}

.play-pause {
  height: 18px;
  margin: 0 1ch;

  svg {
    height: 18px;
  }
}

.end {
  button {
    margin-right: 1ch;
    height: 24px;

    &:last-child {
      margin-right: 0;
    }
  }
}

.timestamp {
  text-align: end;
}

.material-design-icon__svg {
  transition: 0.3s;
}

.timeline {
  display: inline-block;
  overflow: hidden;
  width: 100%;
  -webkit-appearance: none;
  height: 0.3rem;
  cursor: pointer;
  position: absolute;
  bottom: 0;

  &:focus {
    outline: none;
  }

  &::-webkit-slider-runnable-track {
    height: 0.3rem;
    -webkit-appearance: none;
    color: $accent;
    margin-top: -1px;
  }

  &::-webkit-slider-thumb {
    width: 0px;
    -webkit-appearance: none;
    height: 0.3rem;
    cursor: ew-resize;
    background: transparent;
    box-shadow: -100vh 0 0 100vh $accent;
  }
}
</style>
