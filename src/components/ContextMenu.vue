<template>
  <ul
    class="context-menu"
    :style="{ left: `${posx}px`, top: `${posy}px` }"
    @mouseenter="clearTimer"
    @mouseleave="startTimer"
  >
    <div class="padding"></div>
    <li
      v-for="(item, index) of items"
      :key="index"
      :style="{ color: item.colour || 'currentColor' }"
      @click="$emit(item.handler)"
    >
      <span>{{ item.title }}</span>
      <component :is="item.icon" :title="item.title"></component>
    </li>
    <div class="padding"></div>
  </ul>
</template>

<script lang="ts">
import Vue from 'vue';
import HeartIcon from 'vue-material-design-icons/Heart.vue';
import HeartOutlineIcon from 'vue-material-design-icons/HeartOutline.vue';
import PlayIcon from 'vue-material-design-icons/Play.vue';
import PlaylistPlayIcon from 'vue-material-design-icons/PlaylistPlay.vue';
import PlaylistPlusIcon from 'vue-material-design-icons/PlaylistPlus.vue';
import DeleteIcon from 'vue-material-design-icons/Delete.vue';

interface CData {
  timeout: NodeJS.Timeout | null;
}

interface CMethods {
  startTimer: () => void;
  clearTimer: () => void;
}

interface CProps {
  posx: number;
  posy: number;
  items: ContextMenuItem[];
}

export default Vue.extend<CData, CMethods, {}, CProps>({
  name: 'context-menu',
  data: () => ({
    timeout: null,
  }),
  methods: {
    startTimer() {
      this.timeout = setTimeout(() => this.$emit('reset'), 1000);
    },
    clearTimer() {
      if (this.timeout) {
        clearTimeout(this.timeout);
      }
    },
  },
  props: {
    posx: Number,
    posy: Number,
    items: {
      type: Array,
      required: true,
    },
  },
  components: {
    HeartIcon,
    HeartOutlineIcon,
    PlayIcon,
    PlaylistPlayIcon,
    PlaylistPlusIcon,
    DeleteIcon,
  },
});
</script>

<style lang="scss" scoped>
@import '@/vars.scss';

.context-menu {
  border-radius: 0.5rem;
  backdrop-filter: blur(20px);
  transform: translate(-50%, 10px);
  position: absolute;
  overflow: hidden;
  width: 10.5rem;

  .padding {
    height: 0.6rem;
    background: #29292969;
  }

  li {
    @include flex-box(space-between);
    background: #29292969;
    cursor: pointer;

    padding: 0.5rem 0.8rem;

    &:hover {
      background: lighten(#3d3d3d69, 10%);
    }

    > span:first-child {
      white-space: nowrap;
      margin-right: 1rem;
    }
  }
}
</style>
