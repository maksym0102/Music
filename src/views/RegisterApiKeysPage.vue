<template>
  <div class="scroll-el" id="scroll-el">
    <div class="page">
      <h1 class="header">Register Api Keys</h1>
      <h4>Napster</h4>
      <p class="about">
        This is used to get data, such as title, artist and the album picture,about every Song and
        Album.
      </p>
      <a
        target="_blank"
        href="https://github.com/Lutetium-Vanadium/Music-Vue/blob/master/docs/apikeys.md#napster"
        class="learn-more"
      >
        Learn More
      </a>
      <span :class="['input', { errored: napsterErrored }]">
        <input
          placeholder="Napster Api Key"
          v-model="napsterApiKey"
          @change="validateNapsterKey"
          @input="napsterErrored = false"
        />
      </span>
      <h4>Firestore (optional)</h4>
      <p class="about">
        This can be used to sync all locally stored metadata about songs up to firebase.
      </p>
      <a
        target="_blank"
        href="https://github.com/Lutetium-Vanadium/Music-Vue/blob/master/docs/apikeys.md#firebase-optional"
        class="learn-more"
      >
        Learn More
      </a>
      <span class="input">
        <input placeholder="Firestore Project Id" v-model="firestoreProjectId" />
      </span>
      <span class="input">
        <input placeholder="Firestore App Id" v-model="firestoreAppId" />
      </span>
      <span class="input">
        <input placeholder="Firestore Api Key" v-model="firestoreApiKey" />
      </span>

      <p class="disclaimer">
        Make sure the above keys are properly inputed as there is no way to verify. If they are, the
        app will automatically sync to firestore.
      </p>

      <button class="btn" @click="handleClick">
        <component :is="buttonIcon" />
        {{ buttonText }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import axios from 'axios';
import CheckIcon from 'vue-material-design-icons/Check.vue';

import MaterialLoader from '@/components/MaterialLoader.vue';

interface CData {
  state: number;
  napsterApiKey: string;
  firestoreProjectId: string;
  firestoreAppId: string;
  firestoreApiKey: string;
  napsterErrored: boolean;
}

interface CMethods {
  validateNapsterKey: () => Promise<void>;
  handleClick: () => void;
}

interface CComputed {
  buttonText: string;
  buttonIcon: string;
}

export default Vue.extend<CData, CMethods, CComputed>({
  name: 'register-api-keys-page',
  data: () => ({
    state: -1,
    napsterApiKey: '',
    firestoreProjectId: '',
    firestoreAppId: '',
    firestoreApiKey: '',
    napsterErrored: false,
  }),
  computed: {
    buttonText() {
      switch (this.state) {
        case 1:
          return 'Done';
        case 0:
          return 'Verifying';
        default:
          return 'Verify Napster';
      }
    },
    buttonIcon() {
      switch (this.state) {
        case 1:
          return 'check-icon';
        case 0:
          return 'material-loader';
        default:
          return 'span';
      }
    },
  },
  methods: {
    async validateNapsterKey() {
      this.state = 1;

      // try {
      //   const response = await axios.get(
      //     `https://api.napster.com/v2/?apikey=${this.napsterApiKey.trim()}`
      //   );

      //   if (response.status !== 200) {
      //     throw response.headers.status;
      //   }

      //   this.state = 1;
      // } catch (e) {
      //   console.error(e);
      //   this.napsterErrored = true;
      //   this.state = -1;
      // }
    },
    handleClick() {
      if (this.state === -1) {
        this.validateNapsterKey();
      } else if (this.state === 1) {
        if (
          this.firestoreProjectId.trim().length > 0 &&
          this.firestoreAppId.trim().length > 0 &&
          this.firestoreApiKey.trim().length > 0
        ) {
          this.$store.commit('apiKeys/setKeys', {
            firestoreProjectId: this.firestoreProjectId.trim(),
            firestoreAppId: this.firestoreAppId.trim(),
            firestoreApiKey: this.firestoreApiKey.trim(),
            napster: this.napsterApiKey.trim(),
          });
          this.$router.replace('/sync-status');
          this.$store.dispatch('sync/connect');
        } else {
          this.$store.commit('apiKeys/setKeys', {
            napster: this.napsterApiKey.trim(),
          });
          this.$router.back();
        }
      }
    },
  },
  components: {
    CheckIcon,
    MaterialLoader,
  },
});
</script>

<style lang="scss" scoped>
@import '@/vars.scss';

.about {
  font-size: 1.1rem;
  margin: 0.4rem 0;
}

.learn-more {
  color: $accent;
}

h4 {
  font-size: 1.5rem;
  margin-top: 2rem;
  margin-bottom: 0.4rem;
}

.disclaimer {
  border-left: 0.4ch solid $accent;
  color: $subtext;
  padding-left: 1ch;
}

.btn {
  @include flex-box;

  margin: 3rem auto;
  padding: 0;
  width: 16ch;

  .material-design-icon {
    margin-right: 0.5ch;
  }
}
</style>
