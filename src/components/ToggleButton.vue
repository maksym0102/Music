<template>
  <div class="toggle" @click="$emit('toggle')">
    <span :class="[{ toggled: toggled }, 'button']"></span>
    <span :class="[{ toggled: toggled }, 'color']"></span>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

interface CProps {
  toggled: boolean;
}

export default Vue.extend<{}, {}, {}, CProps>({
  name: 'toggle-button',
  props: { toggled: Boolean },
});
</script>

<style lang="scss" scoped>
@import '@/vars.scss';

.toggle {
  width: 4rem;
  height: 2rem;
  border-radius: 1rem;
  overflow: hidden;
  background-color: $primary;
  cursor: pointer;

  transition: 0.3s;

  .button {
    display: inline-block;
    position: absolute;
    height: 1.5rem;
    width: 1.5rem;
    border-radius: 50%;
    background-color: #ddd;
    margin: 0.25rem;
    transform: translateX(0);
    z-index: 2;

    transition: background-color 0.3s, transform 0.2s cubic-bezier(0.785, 0.135, 0.15, 0.86);
  }
  .color {
    display: inline-block;
    border-radius: 0.3rem;
    z-index: 1;
    transform: translateX(-4rem);
    background-color: $accent;
    width: 4rem;
    height: 2rem;

    transition: 0.3s cubic-bezier(0.785, 0.135, 0.15, 0.86);
  }

  .toggled.button {
    transform: translateX(2rem);
  }

  .toggled.color {
    transform: translateX(0);
  }
}
</style>
