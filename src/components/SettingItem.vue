<template>
  <div class="setting">
    <p class="name">{{ name }}</p>
    <slot />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

interface CProps {
  name: string;
}

export default Vue.extend<{}, {}, {}, CProps>({
  name: 'setting-item',
  props: {
    name: { type: String, required: true },
  },
});
</script>

<style scoped lang="scss">
@import '@/vars.scss';

.setting {
  @include flex-box(space-between);

  width: 90%;
  margin: 2rem auto;
}

.name {
  font-size: 1.3rem;

  span {
    background-color: $secondary;
    padding: 0.4rem 0.7rem;
    border-radius: 0.4rem;
    font-family: monospace;
    font-size: 0.8em;
    margin-left: 1rem;
  }
}
</style>
