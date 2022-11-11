<template>
  <transition name="modal-wrapper">
    <div v-if="show" class="modal-wrapper" @click.self="$emit('close', true)" :key="title">
      <div class="modal">
        <header>
          <arrow-left-icon title="Back" @click="$emit('close', true)" />
          <span v-if="isInput" class="input">
            <input :placeholder="title" v-model="input" type="text" />
          </span>
          <h3 v-else>{{ title }}</h3>
          <button @click="$emit('close', false, input)" class="btn" :disabled="disabled">
            {{ buttonText }}
          </button>
        </header>
        <div class="main">
          <slot />
        </div>
      </div>
    </div>
  </transition>
</template>

<script lang="ts">
import Vue from 'vue';
import ArrowLeftIcon from 'vue-material-design-icons/ArrowLeft.vue';

interface CData {
  input: string;
}

interface CComputed {
  disabled: boolean;
}

interface CProps {
  title: string;
  show: boolean;
  isValid: boolean;
  buttonText: string;
  isInput: boolean;
}

export default Vue.extend<CData, {}, CComputed, CProps>({
  name: 'modal-view',
  data: () => ({
    input: '',
  }),
  computed: {
    disabled() {
      if (this.isInput) {
        return !this.isValid || this.input.length === 0;
      }

      return !this.isValid;
    },
  },
  props: {
    title: {
      type: String,
      required: true,
    },
    show: {
      type: Boolean,
      required: true,
    },
    isValid: {
      type: Boolean,
      required: true,
    },
    buttonText: {
      type: String,
      default: 'Done',
    },
    isInput: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    ArrowLeftIcon,
  },
});
</script>

<style lang="scss" scoped>
@import '@/vars.scss';

.modal-wrapper {
  @include flex-box;

  position: fixed;
  height: 100vh;
  width: 100vw;
  top: 0;
  left: 0;
  backdrop-filter: blur(4px);
  background: #0000007c;
  opacity: 1;
  z-index: 2;

  &-enter-active,
  &-leave-active {
    transition: 0.5s cubic-bezier(0.215, 0.61, 0.355, 1), backdrop-filter 0s;
  }
  &-enter,
  &-leave-to {
    background: #00000000;
    backdrop-filter: none;

    .modal {
      transform: translateY(-85vh);
    }
  }
}

.modal {
  background: $bg;
  transform: translateY(0);
  border-radius: 1rem;
  transition: 0.5s cubic-bezier(0.215, 0.61, 0.355, 1);
  overflow: hidden;
}

header {
  @include flex-box(space-between);
  margin-bottom: 0.5rem;
  padding: 1.5rem 1.5rem 0 1.5rem;

  .material-design-icon {
    cursor: pointer;
  }

  input {
    text-align: center;
  }
}

hr {
  width: calc(100% - 3rem);
  margin: 1.5rem;
  height: 1px;
}

.main {
  height: 50vh;
  width: 50vw;
  padding: 0 1.5rem 1.5rem 1.5rem;
  overflow: auto;
}
</style>
