<template>
  <div
    class="cover-image"
    @click.left="$emit('left-click', $event)"
    @click.right="$emit('right-click', $event)"
  >
    <img v-if="image !== null && image !== undefined" :src="image" :alt="title" />
    <mozaic-image v-else :images="images" :title="title" />
    <div class="text">
      <h6 class="title">{{ title }}</h6>
      <p class="subtitle">{{ subtitle }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import MozaicImage from './MozaicImage.vue';

interface CProps {
  title: string;
  image?: string;
  images?: string[];
  subtitle: string;
}

export default Vue.extend<{}, {}, {}, CProps>({
  name: 'cover-image',
  props: {
    title: { type: String, required: true },
    image: { type: String },
    images: { type: Array },
    subtitle: { type: String, required: true },
  },
  components: {
    MozaicImage,
  },
});
</script>

<style lang="scss" scoped>
@import '@/vars.scss';

.cover-image {
  @include flex-box($justify: space-around, $direction: column);

  height: 13.3rem;
  width: 10rem;

  img {
    height: 10rem;
    width: 10rem;
    border-radius: 5%;
    user-select: none;
    cursor: pointer;
  }

  .mozaic {
    height: 10rem;
    width: 10rem;
    border-radius: 5%;
  }

  .text {
    @include flex-box($direction: column);
  }
}

.title {
  font-size: 1rem;
  max-width: 10rem;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.subtitle {
  color: $subtext;
  font-size: $subtext-size;
}
</style>
