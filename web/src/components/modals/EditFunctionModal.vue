<template>
  <div>
    <b-modal
      ref="editFunction"
      size="lg"
      title="Create/Edit Function"
      no-fade
      @ok="ok"
      @hidden="onHidden"
    >
      <h4>Updating a function at address {{ address | hex }}</h4>
      <div class="form-group">
        <label for="functionName">Function Name</label>
        <input
          id="functionName"
          ref="functionName"
          v-model="functionName"
          type="text"
          class="form-control"
          placeholder="Comment ..."
          @keyup.enter="ok"
        >
        <!-- <small id="emailHelp" class="form-text text-muted">We'll never share your email with anyone else.</small> -->
      </div>

      <div class="form-group">
        <label for="functionReturnValue">Function Return Value</label>
        <input
          id="functionReturnValue"
          ref="functionReturnValue"
          v-model="functionReturnValue"
          type="text"
          class="form-control"
        >
        <!-- <small id="emailHelp" class="form-text text-muted">We'll never share your email with anyone else.</small> -->
      </div>

      <div class="form-group">
        <label for="functionArgs">Function Arguments</label>
        <input
          id="functionArgs"
          ref="functionArgs"
          v-model="functionArgs"
          type="text"
          class="form-control"
        >
        <!-- <small id="emailHelp" class="form-text text-muted">We'll never share your email with anyone else.</small> -->
      </div>
    </b-modal>
  </div>
</template>

<script>
import { bus, MODAL_HIDDEN, SHOW_FUNCTION_MODAL } from '../../bus'
import { toHex } from '../../utils/vue.hex'

export default {
  name: 'EditFunctionModal',
  data () {
    return {
      address: 0,

      functionName: 'F-NAME',
      functionReturnValue: 'F-RETURN VALUE',
      functionArgs: 'F-ARGS'
    }
  },
  created () {
    bus.$on(SHOW_FUNCTION_MODAL, (event) => {
      this.address = event.addr
      const f = this.$store.getters.functionsByAddress[this.address]
      console.log('EditFunction', f)
      if (f) {
        this.functionName = f.name
        this.functionArgs = f.args
        this.functionReturnValue = f.retval
      } else {
        this.functionName = 'function_' + toHex(this.address)
        this.functionReturnValue = 'unknown'
        this.functionArgs = 'unknown'
      }
      this.$refs.editFunction.show()
    })

    /* const self = this
      bus.$on(SHOW_FUNCTION_MODAL, function (event) {
        self.address = event.addr
        if (self.$store.getters.commentsByAddress[self.address]) {
          self.comment = self.$store.getters.commentsByAddress[self.address].comment
        } else {
          self.comment = ''
        }
        self.$refs.commentModal.show()
        setTimeout(() => {
          self.$refs.inputField.setSelectionRange(0, self.comment.length)
          self.$refs.inputField.focus()
        }, 1)

      }) */
  },
  methods: {
    onHidden () {
      bus.$emit(MODAL_HIDDEN)
    },
    async ok (e) {
      e.preventDefault()

      await this.$store.dispatch('upsertFunction', {
        vma: this.address,
        name: this.functionName,
        retval: this.functionReturnValue,
        args: this.functionArgs
      })
      this.$refs.editFunction.hide()
    }
  }
}
</script>

<style scoped></style>
