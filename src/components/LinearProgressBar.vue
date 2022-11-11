<template>
  <div class="progress-bar" :style="{ width }">
    <div :style="{ width: `${percent * 100}%` }"></div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

interface CProps {
  percent: number;
  width: string;
}

export default Vue.extend<{}, {}, {}, CProps>({
  name: 'linear-progress-bar',
  props: {
    percent: Number,
    width: String,
  },
});
</script>

<style lang="scss" scoped>
@import '@/vars.scss';

.progress-bar {
  height: 5px;
  background: $secondary;

  div {
    height: 5px;
    background: $accent;
    transition: 250ms;
  }
}
</style>
