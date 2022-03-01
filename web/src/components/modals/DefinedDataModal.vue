<template>
  <div>
    <b-modal
      ref="definedDataModal"
      size="lg"
      title="Create Struct Variable"
      no-fade
      @ok="ok"
      @hidden="onHidden"
    >
      <div class="form-group">
        <label for="varName">Create Variable at  0x{{ address | hex }}</label>
        <input
          id="varName"
          ref="varName"
          v-model="varName"
          type="text"
          class="form-control"
          placeholder=""
          @keyup.enter="ok"
        >
      </div>

      <div class="form-group">
        <label for="fieldType">Select Variable Type</label>
        <select
          id="fieldType"
          v-model="dataType"
          class="form-control"
        >
          <option v-for="structType in structTypes">
            {{ structType.name }}
          </option>
        </select>
      </div>
    </b-modal>
  </div>
</template>

<script>
import { bus, SHOW_DEFINED_DATA_MODAL, MODAL_HIDDEN } from '../../bus'

export default {
  name: 'DefinedDataModal',
  data () {
    return {
      address: null,
      varName: 'StructVarName',
      dataType: null
    }
  },
  computed: {
    structTypes () {
      return this.$store.state.structTypes
    }
  },
  created () {
    bus.$on(SHOW_DEFINED_DATA_MODAL, (event) => {
      this.address = event.addr
      this.$refs.definedDataModal.show()
      /* if (self.$store.getters.commentsByAddress[self.address]) {
          self.comment = self.$store.getters.commentsByAddress[self.address].comment
        } else {
          self.comment = ''
        }
        self.$refs.commentModal.show()
        setTimeout(() => {
          self.$refs.inputField.setSelectionRange(0, self.comment.length)
          self.$refs.inputField.focus()
        }, 1)  */
    })
  },
  methods: {
    onHidden () {
      bus.$emit(MODAL_HIDDEN)
    },
    ok () {
      this.$store.dispatch('createStructDefinedData', {
        structName: this.dataType,
        varName: this.varName,
        addr: this.address
      })
    }
  }
}
</script>

<style scoped></style>
