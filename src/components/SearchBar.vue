<template>
  <div class="search-box">
    <input
      type="text"
      v-model="searchQuery"
      :placeholder="placeholder"
      @keyup.enter="search"
      @input="search"
    />
    <button @click="search">
      <magnify-icon title="Search" />
    </button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import MagnifyIcon from 'vue-material-design-icons/Magnify.vue';

interface CData {
  searchQuery: string;
}

interface CMethods {
  search: () => void;
}

interface CProps {
  placeholder: string;
}

export default Vue.extend<CData, CMethods, {}, CProps>({
  name: 'search-box',
  props: {
    placeholder: {
      type: String,
      default: 'Search',
    },
  },
  data: () => ({
    searchQuery: '',
  }),
  components: {
    MagnifyIcon,
  },
  methods: {
    search() {
      this.$emit('search', this.searchQuery);
    },
  },
});
</script>

<style lang="scss" scoped>
@import '@/vars.scss';

.search-box {
  @include flex-box;

  padding: 0.3rem 0.5rem;

  border-radius: 0.3rem;
  background: $primary;
  height: 2.3rem;
  width: 25ch;

  > input {
    flex: 1;
    color: white;

    &::placeholder {
      color: $subtext;
    }
  }

  button {
    height: 1.4rem;
    width: 1.4rem;

    padding: 0.1rem 0 0.1rem 0.2rem;

    svg {
      height: 1.2rem;
      width: 1.2rem;
    }
  }
}
</style>
