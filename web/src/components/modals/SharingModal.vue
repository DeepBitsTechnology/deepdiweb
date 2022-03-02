<template>
  <div>
    <b-modal
      ref="sharingModal"
      size="lg"
      @ok="ok"
    >
      <div slot="modal-title">
        <i class="fa fa-lg fa-lock" /> Sharing Settings
      </div>

      <div class="form-check">
        <label class="form-check-label">
          <input
            id="exampleRadios1"
            v-model="permissionLevel"
            class="form-check-input"
            type="radio"
            name="exampleRadios"
            value="edit"
            checked
          >
          <h6><strong>Editable</strong> anyone with a link</h6>
          Anyone with a link can read/edit this disassembly. Use this option to allow <strong>group editing</strong> of files
        </label>
      </div>
      <div class="form-check">
        <label class="form-check-label">
          <input
            id="exampleRadios2"
            v-model="permissionLevel"
            class="form-check-input"
            type="radio"
            name="exampleRadios"
            value="read"
          >
          <h6><strong>Read Only</strong> anyone with a link</h6>
          Anyone with a link can read this disassembly
        </label>
      </div>
      <div
        v-if="isActiveUser"
        class="form-check"
      >
        <label class="form-check-label">
          <input
            id="exampleRadios3"
            v-model="permissionLevel"
            class="form-check-input"
            type="radio"
            name="exampleRadios"
            value="none"
          >
          <h6><strong>Private</strong></h6>
          Only <strong>you</strong> are able to access this location
        </label>
      </div>
      <div
        v-if="!isActiveUser"
        class="form-check"
      >
        <label class="form-check-label">
          <h6><strong>Private (login to enable this option)</strong></h6>
          Only <strong>you</strong> are able to access this location
        </label>
      </div>
    </b-modal>
  </div>
</template>

<script>
import { bus, SHOW_SHARING_MODAL } from '../../bus'

export default {
  name: 'SharingModal',
  data () {
    return {
      permissionLevel: null
    }
  },
  computed: {
    isActiveUser () {
      return this.$store.getters.isActiveUser
    }
  },
  created () {
    const self = this
    bus.$on(SHOW_SHARING_MODAL, function () {
      self.permissionLevel = self.$store.state.default_permission_level
      self.$refs.sharingModal.show()
    })
  },
  methods: {
    async ok (evt) {
      evt.preventDefault()
      await this.$store.dispatch('setDefaultSharingLevel', { permissionLevel: this.permissionLevel })
      this.$refs.sharingModal.hide()
    }
  }
}
</script>
