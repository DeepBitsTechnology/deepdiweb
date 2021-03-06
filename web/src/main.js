// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import BootstrapVue from 'bootstrap-vue'
import store from './store'
import Notifications from 'vue-notification'
import VueHighlightJS from 'vue-highlightjs'

import './utils/vue.pretty-bytes'
import './utils/vue.hex'

import 'font-awesome/css/font-awesome.min.css'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

Vue.use(BootstrapVue)
Vue.use(Notifications)
Vue.use(VueHighlightJS)

Vue.config.productionTip = false

const vm = new Vue({ // eslint-disable no-new
  router,
  store,
  components: { App },
  template: '<App/>'
})
vm.$mount('#app')

// auth.whoami().then((whoami) => {
//   store.commit(types.UPDATE_USER, { user: whoami })

//   /* eslint-disable no-new */
//   new Vue({
//     el: '#app',
//     router,
//     store: store,
//     components: { App },
//     template: '<App/>'
//   })
// }).catch(() => {
//   $('#app').html('<div style="margin-top: 40px; text-align: center;"><h1>Cannot Contact Oda Server.</h1><h2>Please Try Again Later.</h2></div>')
// })
