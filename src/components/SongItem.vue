<template>
  <div
    class="song-item"
    @click.left="$emit('left-click', $event)"
    @click.right="$emit('right-click', $event)"
  >
    <img :src="song.thumbnail" class="thumbnail" :alt="song.title" />
    <div class="info">
      <p class="title">{{ song.title }}</p>
      <p class="artist">{{ song.artist }}</p>
    </div>
    <div class="end">
      <p class="length">{{ length }}</p>
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import formatLength from '@/helpers/formatLength';

interface CComputed {
  length: string;
}

interface CProps {
  song: SongData;
}

export default Vue.extend<{}, {}, CComputed, CProps>({
  name: 'song-item',
  computed: {
    length() {
      return formatLength(this.song.length)[0];
    },
  },
  props: {
    song: {
      type: Object,
      required: true,
      validator(song) {
        const hasProps = song.title && song.artist && song.length && song.thumbnail;
        return hasProps !== undefined && hasProps !== null;
      },
    },
  },
});
</script>

<style lang="scss" scoped>
@import '@/vars.scss';

.song-item {
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

    .title {
      margin-bottom: 0.1rem;
    }

    .artist {
      color: $subtext;
      font-size: $subtext-size;
    }
  }

  .end {
    @include flex-box(flex-end);

    .length {
      margin-right: 0.5rem;
    }

    flex: 1;
  }

  &:hover {
    background: $primary;
  }
}
</style>
