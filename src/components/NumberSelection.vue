<template>
  <div class="number-selection">
    <svg @click="$emit('prev')" viewBox="0 0 86.6 100">
      <path d="M86.6 100 L0 50 L86.6 0" />
    </svg>
    <span class="num">{{ num }}s</span>
    <svg @click="$emit('next')" viewBox="0 0 86.6 100" class="rev">
      <path d="M0 0 L86.6 50 L0 100" />
    </svg>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

interface CProps {
  num: number;
}

export default Vue.extend<{}, {}, {}, CProps>({
  name: 'number-selection',
  props: {
    num: { type: Number, required: true },
  },
});
</script>

<style lang="scss" scoped>
@import '@/vars.scss';

.number-selection {
  @include flex-box(space-evenly);

  height: 3rem;
  background-color: $secondary;
  border-radius: 1.3rem;
  width: 4.5rem;
  margin: 0 2rem;
  transition: 0.6s;

  .num {
    font-size: 1.6rem;
    margin: 0 0.8rem;
    transform: translateY(-0.15rem);
    user-select: none;
  }

  svg {
    height: 1.3rem;
    transform: translateX(1rem) scale(0.7);
    opacity: 0;
    pointer-events: all;
    fill: none;
    stroke: white;
    stroke-width: 10;
    stroke-linecap: butt;
    stroke-linejoin: miter;

    transition: 0.4s;
  }

  .rev {
    transform: translateX(-1rem) scale(0.7);
  }

  &:hover {
    cursor: pointer;
    background-color: $accent;
    width: 8.5rem;
    margin: 0;

    svg {
      opacity: 1;
      transform: translateX(0) scale(1);
      transition: 0.4s 0.2s;
    }
  }
}
</style>
