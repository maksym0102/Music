<template>
  <div class="loader">
    <span></span>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'loading-icon',
});
</script>

<style lang="scss" scoped>
.loader {
  height: 4rem;
  width: 4rem;
  animation: loader-1 2s cubic-bezier(0.77, 0, 0.175, 1) infinite;
  transform: translate(-50%, -50%);
  margin-left: 50%;
  margin-top: 25vh;

  &::before {
    content: '';
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: auto;
    margin: auto;
    width: 1rem;
    height: 1rem;
    background: #fff;
    border-radius: 50%;
    animation: loader-2 2s cubic-bezier(0.77, 0, 0.175, 1) infinite;
  }

  &::after {
    content: '';
    display: block;
    position: absolute;
    top: 0;
    left: auto;
    bottom: 0;
    right: 0;
    margin: auto;
    width: 1rem;
    height: 1rem;
    background: #fff;
    border-radius: 50%;
    animation: loader-3 2s cubic-bezier(0.77, 0, 0.175, 1) infinite;
  }

  span {
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    margin: auto;
    height: 4rem;
    width: 4rem;

    &::before {
      content: '';
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      bottom: auto;
      right: 0;
      margin: auto;
      width: 1rem;
      height: 1rem;
      background: #fff;
      border-radius: 50%;
      animation: loader-4 2s cubic-bezier(0.77, 0, 0.175, 1) infinite;
    }

    &::after {
      content: '';
      display: block;
      position: absolute;
      top: auto;
      left: 0;
      bottom: 0;
      right: 0;
      margin: auto;
      width: 1rem;
      height: 1rem;
      background: #fff;
      border-radius: 50%;
      animation: loader-5 2s cubic-bezier(0.77, 0, 0.175, 1) infinite;
    }
  }
}

@keyframes loader-1 {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes loader-2 {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(3rem, 0, 0) scale(0.5);
  }
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@keyframes loader-3 {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(-3rem, 0, 0) scale(0.5);
  }
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@keyframes loader-4 {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(0, 3rem, 0) scale(0.5);
  }
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@keyframes loader-5 {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(0, -3rem, 0) scale(0.5);
  }
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
}
</style>
