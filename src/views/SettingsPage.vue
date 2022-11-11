<template>
  <div class="scroll-el" id="scroll-el" key="settings">
    <div class="page">
      <h1 class="header">Settings</h1>
      <div class="setting">
        <p class="name">
          Directory from which songs are taken:
          <span v-if="folderStored.length">{{ folderStored }}</span>
          <span v-else>Unset</span>
        </p>
        <button class="change" @click="changeDirectory">Change Directory</button>
      </div>
      <hr />
      <setting-item name="Jump Backward timer: ">
        <number-selection :num="jumpBack" @prev="changeJumpBack(-1)" @next="changeJumpBack(1)" />
      </setting-item>
      <setting-item name="Seek Backward timer: ">
        <number-selection :num="seekBack" @prev="changeSeekBack(-1)" @next="changeSeekBack(1)" />
      </setting-item>
      <setting-item name="Seek Forward timer: ">
        <number-selection :num="seekAhead" @prev="changeSeekAhead(-1)" @next="changeSeekAhead(1)" />
      </setting-item>
      <setting-item name="Jump Forward timer: ">
        <number-selection :num="jumpAhead" @prev="changeJumpAhead(-1)" @next="changeJumpAhead(1)" />
      </setting-item>
      <button :disabled="!hasChanges" class="change center" @click="updateChanges">Change</button>
      <hr />
      <setting-item name="Open Secondary Control Window when music is playing?">
        <toggle-button :toggled="controlWindow" @toggle="toggleControlWindow" />
      </setting-item>
      <setting-item name="Animate between pages">
        <toggle-button :toggled="animations" @toggle="toggleAnimations" />
      </setting-item>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapState, mapMutations, mapActions } from 'vuex';
import { remote } from 'electron';
import path from 'path';

import { SettingsState } from '@/store/types';
import ToggleButton from '@/components/ToggleButton.vue';
import NumberSelection from '@/components/NumberSelection.vue';
import SettingItem from '@/components/SettingItem.vue';

interface CMethods {
  toggleAnimations: () => void;
  toggleControlWindow: () => void;
  changeJumpBack: (delta: number) => void;
  changeSeekBack: (delta: number) => void;
  changeSeekAhead: (delta: number) => void;
  changeJumpAhead: (delta: number) => void;
  updateChanges: () => Promise<void>;
  changeDirectory: () => Promise<void>;
}

interface CComputed {
  results: NapsterSongData[];
  error: any;
  loading: boolean;
  errored: boolean;
  mappedCompleted: boolean[];
  filteredResults: NapsterSongData[];
}

export default Vue.extend<{}, CMethods, SettingsState>({
  name: 'settings-page',
  components: { ToggleButton, NumberSelection, SettingItem },
  computed: mapState('settings', [
    'animations',
    'controlWindow',
    'folderStored',
    'jumpAhead',
    'jumpBack',
    'seekAhead',
    'seekBack',
    'hasChanges',
  ]),
  methods: {
    ...mapMutations('settings', [
      'toggleAnimations',
      'toggleControlWindow',
      'changeJumpBack',
      'changeSeekBack',
      'changeSeekAhead',
      'changeJumpAhead',
    ]),
    ...mapActions('settings', ['updateChanges']),
    async changeDirectory() {
      const win = remote.getCurrentWindow();

      const prevPath = this.folderStored;

      const { canceled, filePaths } = await remote.dialog.showOpenDialog(win, {
        properties: ['openDirectory', 'createDirectory'],
        title: 'Choose Music Directory',
        defaultPath: path.join(prevPath, '..'),
      });

      if (!canceled && prevPath !== filePaths[0]) {
        this.$store.dispatch('settings/setFolderStored', filePaths[0]);
      }
    },
  },
});
</script>

<style lang="scss" scoped>
@import '@/vars.scss';

.setting {
  @include flex-box(space-between);

  margin: 2rem 0;
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

.change {
  background: $btncol;
  padding: 0.75rem 1.5rem;
  transition: background-color 0.3s linear;
  border-radius: 3rem;

  &:hover {
    background-color: lighten($btncol, 10%);
  }

  &:disabled {
    background: $primary;
    cursor: auto;
  }
}

.center {
  margin-left: 50%;
  transform: translateX(-50%);
}
</style>
