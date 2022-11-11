<template>
  <svg viewBox="0 0 80 100">
    <polygon fill="white" points="0,0 26.6,0 26.6,100 0,100">
      <animate
        ref="pa1"
        begin="indefinite"
        attributeName="points"
        dur="150ms"
        fill="freeze"
        to="0,0 26.6,0 26.6,100 0,100"
      />
      <animate
        ref="pl1"
        begin="indefinite"
        attributeName="points"
        dur="150ms"
        fill="freeze"
        to="80,50 80,50 0,50 0,0"
      />
    </polygon>
    <polygon fill="white" points="53.4,0 80,0 80,100 53.4,100">
      <animate
        ref="pa2"
        begin="indefinite"
        attributeName="points"
        dur="150ms"
        fill="freeze"
        to="53.4,0 80,0 80,100 53.4,100"
      />
      <animate
        ref="pl2"
        begin="indefinite"
        attributeName="points"
        fill="freeze"
        dur="150ms"
        to="80,50 80,50 0,100 0,50"
      />
    </polygon>
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

interface CProps {
  playing: boolean;
}

export default Vue.extend<{}, {}, {}, CProps>({
  name: 'play-pause',
  props: {
    playing: Boolean,
  },
  watch: {
    playing() {
      if (this.playing) {
        (this.$refs.pa1 as any).beginElement();
        (this.$refs.pa2 as any).beginElement();
      } else {
        (this.$refs.pl1 as any).beginElement();
        (this.$refs.pl2 as any).beginElement();
      }
    },
  },
  mounted() {
    if (this.playing) {
      (this.$refs.pa1 as any).beginElement();
      (this.$refs.pa2 as any).beginElement();
    } else {
      (this.$refs.pl1 as any).beginElement();
      (this.$refs.pl2 as any).beginElement();
    }
  },
});
</script>
