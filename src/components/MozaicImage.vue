<template>
  <img class="mozaic" v-if="isSingleImage" :src="images[0]" :alt="title" :title="title" />
  <div v-else class="mozaic" :title="title">
    <img v-for="image of images" :key="image" :src="image" :alt="title" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

interface CComputed {
  isSingleImage: boolean;
}

interface CProps {
  images: string[];
  title: string;
}

export default Vue.extend<{}, {}, CComputed, CProps>({
  name: 'mozaic-image',
  props: {
    images: Array,
    title: String,
  },
  computed: {
    isSingleImage() {
      return this.images.length === 1;
    },
  },
});
</script>

<style lang="scss" scoped>
.mozaic {
  display: grid;
  grid-template: auto auto / auto auto;
  overflow: hidden;
  cursor: pointer;

  img {
    width: 100%;
  }
}
</style>
