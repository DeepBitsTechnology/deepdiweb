<template>
  <div id="app">
    <notifications group="oda" />

    <Navigation />

    <router-view />
  </div>
</template>

<script>
import Navigation from './components/Navigation'
import { bus, API_ERROR, NOTIFY } from './bus'

export default {
  name: 'App',
  components: {
    Navigation
  },
  created () {
    const self = this
    bus.$on(API_ERROR, function (error) {
      self.$notify({
        group: 'oda',
        type: 'error',
        title: 'API Error',
        duration: 10000,
        text: `${error.message}.`
      })
    })
    bus.$on(NOTIFY, function (message) {
      self.$notify({
        group: 'oda',
        duration: 5000,
        ...message
      })
    })
  }
}
</script>

<style>
  #app {
    font-family: system-ui, 'Avenir', Helvetica, Arial, sans-serif;
  }

  .error {
    background: #E54D42;
  }
</style>
