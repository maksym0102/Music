<template>
  <div class="scroll-el" id="scroll-el" key="sync-status">
    <div class="page">
      <div class="progress">
        <h3>Syncing with Firebase</h3>
        <p class="subtext bottom">This may take some time.</p>
        <linear-progress-bar class="bottom" :percent="this.status.progress / 5" width="100px" />
        <p class="main bottom">{{ text }}</p>
        <linear-progress-bar
          class="bottom"
          v-if="percent !== null"
          :percent="percent"
          width="80%"
        />
        <p v-if="numFailedText !== null" class="subtext bottom">{{ numFailedText }}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapState } from 'vuex';

import * as _ from '@/helpers/firestore_sync/sync_status';
import LinearProgressBar from '@/components/LinearProgressBar.vue';

interface CComputed {
  status: _.SyncStatus;
  text: string;
  percent: number | null;
  numFailedText: string | null;
}

export default Vue.extend<{}, {}, CComputed>({
  name: 'sync-status-page',
  computed: {
    ...mapState('sync', ['status']),
    text() {
      if (this.status instanceof _.SyncSongsInitial) {
        return 'Checking Songs...';
      }
      if (this.status instanceof _.SyncSongsName) {
        if (this.status.isDelete) {
          return `Deleting ${this.status.name}`;
        }
        return `Starting download for ${this.status.name}`;
      }
      if (this.status instanceof _.SyncSongsProgress) {
        return `Downloading ${this.status.title}`;
      }
      if (this.status instanceof _.SyncSongsFailed) {
        return `Retrying ${this.status.failed} song${this.status.failed === 1 ? '' : 's'}.`;
      }
      if (this.status instanceof _.SyncAlbumsInitial) {
        return 'Checking Albums...';
      }
      if (this.status instanceof _.SyncAlbumsName) {
        return `Adding ${this.status.name}`;
      }
      if (this.status instanceof _.SyncCustomAlbumsInitial) {
        return 'Checking Custom Albums...';
      }
      if (this.status instanceof _.SyncCustomAlbumsName) {
        return `Adding ${this.status.name}`;
      }
      if (this.status instanceof _.SyncCleaningUp) {
        return 'Cleaning Up...';
      }
      if (this.status instanceof _.SyncComplete) {
        return 'Sync Complete';
      }

      return 'Starting Sync...';
    },
    percent() {
      if (this.status instanceof _.SyncSongsProgress) {
        return this.status.percent;
      }
      return null;
    },
    numFailedText() {
      if (this.status instanceof _.SyncSongsName || this.status instanceof _.SyncSongsProgress) {
        return `${this.status.failed} song${this.status.failed === 1 ? '' : 's'} failed`;
      }
      return null;
    },
  },
  watch: {
    status(status) {
      if (status instanceof _.SyncComplete) {
        this.$router.back();
      }
    },
  },
  components: {
    LinearProgressBar,
  },
});
</script>

<style lang="scss" scoped>
@import '@/vars.scss';

.page {
  @include flex-box;
}

.progress {
  @include flex-box($direction: column);
}

.bottom {
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }
}

.subtext {
  color: $subtext;
}

.main {
  font-weight: 500;
  font-size: 1.1rem;
}
</style>
