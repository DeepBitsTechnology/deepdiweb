<template>
  <b-navbar
    toggleable="sm"
    type="dark"
    variant="dark"
    class="main-nav"
  >
    <!-- <b-navbar-toggle target="nav_collapse" /> -->

    <b-navbar-brand
      href="/odaweb/"
      class="d-flex flex-row align-items-center"
    >
      <img
        src="../assets/deepbits.png"
        style="height:30px;"
      >
      DeepDi
    </b-navbar-brand>

    <b-collapse
      id="nav_collapse"
      is-nav
    >
      <b-navbar-nav>
        <b-nav-text v-if="showingDisassembly">
          {{ projectName }}
        </b-nav-text>

        <!-- <b-nav-item href="#">Link</b-nav-item>
        <b-nav-item href="#" disabled>Disabled</b-nav-item> -->
      </b-navbar-nav>

      <!-- Right aligned nav items -->
      <b-navbar-nav class="ml-auto">
        <!-- <span
          v-for="user in otherUsers"
          class="navbar-user"
        >
          <div
            v-b-tooltip.hover
            class="navbar-letter"
            :style="{ 'background-color': activeColor(user) }"
            :title="user.username"
          >{{ user.username.charAt(0).toUpperCase() }}</div>
        </span> -->

        <!--<b-nav-form>
          <b-form-input size="sm" class="mr-sm-2" type="text" placeholder="Search"/>
          <b-button size="sm" class="my-2 my-sm-0" type="submit">Search</b-button>
        </b-nav-form>-->

        <b-nav-item-dropdown
          text="Examples"
          right
        >
          <b-dropdown-item href="/odaweb/test">
            test
          </b-dropdown-item>
        </b-nav-item-dropdown>

        <!-- <b-nav-item-dropdown
          v-if="isActiveUser"
          right
        > -->
        <!-- Using button-content slot -->
        <!-- <template slot="button-content">
            <em>User <i class="fa fa-user" /></em>
          </template>
          <b-dropdown-item disabled>
            {{ username }}
          </b-dropdown-item>
          <b-dropdown-item href="#/user/profile">
            Profile
          </b-dropdown-item>
          <b-dropdown-item @click="logout">
            Signout
          </b-dropdown-item>
        </b-nav-item-dropdown> -->

        <!-- <b-button-group>-->

        <!--          <b-button size="sm" class="my-1 px-2 btn-primary"-->
        <!--                    href="#/login"-->
        <!--                    v-if="!isActiveUser"-->
        <!--                    right>-->
        <!--            <i class="fa fa-lock"></i>-->
        <!--            Login-->
        <!--          </b-button>-->

        <!--          <b-button size="sm" class="my-1 px-2 btn-primary"-->
        <!--                    href="#/signup"-->
        <!--                    variant="success"-->
        <!--                    v-if="!isActiveUser"-->
        <!--                    right>-->
        <!--            <i class="fa fa-lock"></i>-->
        <!--            Signup-->
        <!--          </b-button>-->

        <!--          <b-button size="sm"-->
        <!--                    v-if="showingDisassembly"-->
        <!--                    class="my-1 px-2 btn-primary" right-->
        <!--                    @click="showSharingDialog">-->
        <!--            <i class="fa fa-lock"></i>-->
        <!--            Share-->
        <!--          </b-button>-->

        <!--        </b-button-group> -->
      </b-navbar-nav>
    </b-collapse>
  </b-navbar>
</template>

<script>
// import ColorHash from 'color-hash'
// import { bus, SHOW_SHARING_MODAL } from '../bus'
// import * as auth from '../api/auth'

export default {
  name: 'NavigationBar',
  data () {
    return {
    }
  },
  computed: {
    projectName () {
      return this.$store.state.projectName
    },
    // username () {
    //   if (this.$store.state.user) {
    //     return this.$store.state.user.username
    //   }
    // },
    // isActiveUser () {
    //   return this.$store.getters.isActiveUser
    // },
    // otherUsers () {
    //   return this.$store.getters.otherUsers
    // },
    showingDisassembly () {
      return (this.$route.name === 'Disassembler')
    }
  },
  methods: {
    // showSharingDialog () {
    //   bus.$emit(SHOW_SHARING_MODAL)
    // },
    // logout () {
    //   auth.logout().then(() => {
    //     this.$router.push('/')
    //   })
    // },
    // activeColor (user) {
    //   const colorHash = new ColorHash({ lightness: 0.4 })
    //   const color = colorHash.hex(user.username)
    //   return color
    // }
  }
}
</script>

<style scoped>
  .main-nav {
    padding-top: 2px;
    padding-bottom: 2px;
    font-size: 0.75rem;
  }

  .main-nav .navbar-brand {
    font-size: 0.95rem;
  }

  .navbar-user .navbar-letter {
    font-size: 20px;
    margin: 6px 2px 4px 2px;
    padding: 1px 8px 1px 8px;
    line-height: 18px;
    font-family: Arial, Helvetica, sans-serif;
    font-weight: bold;
    color: #CCCCCC;
    border: 1px solid #a29ea2
  }

  .btn {
    padding: 2px;
    margin: 0;
    font-size: 12px;
    height: 24px;
  }
</style>
