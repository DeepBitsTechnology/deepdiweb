<template>
  <div>
    <b-modal
      ref="gotoAddressModal"
      size="lg"
      title="Goto Address"
      no-fade
      @ok="ok"
      @hidden="onHidden"
    >
      <div class="form-group">
        <label for="gotoAddressInput">Goto an Address/Symbol Name</label>
        <div class="dropdown">
          <input
            id="gotoAddressInput"
            ref="inputField"
            v-model="address"
            type="text"
            class="form-control"
            placeholder="Address ..."
            @keyup.enter="ok"
          >
          <div
            v-if="autocompleteItems.length > 0"
            class="dropdown-menu"
            aria-labelledby="dropdownMenu2"
            style="display:block; width: 100%;"
          >
            <button
              v-for="symbol in autocompleteItems"
              class="dropdown-item"
              type="button"
              @click="setSymbol(symbol)"
            >
              {{ symbol.name }} <small class="symbol-address">0x{{ symbol.vma | hex }}</small>
            </button>
          </div>
        </div>
      </div>
    </b-modal>
  </div>
</template>

<script>
import { bus, SHOW_GOTOADDRESS_MODAL, MODAL_HIDDEN, NAVIGATE_TO_ADDRESS } from '../../bus'
import _ from 'lodash'

export default {
  name: 'GotoAddressModal',
  data () {
    return {
      address: null
    }
  },
  computed: {
    autocompleteItems () {
      if (!this.address || this.address.length === 0) {
        return []
      }
      return _.filter(this.$store.state.symbols, (symbol) => {
        return symbol.name.indexOf(this.address) !== -1
      }).slice(0, 10)
    }
  },
  created () {
    bus.$on(SHOW_GOTOADDRESS_MODAL, (event) => {
      this.address = null
      this.$refs.gotoAddressModal.show()

      setTimeout(() => {
        this.$refs.inputField.focus()
      }, 1)
    })
  },
  methods: {
    onHidden () {
      bus.$emit(MODAL_HIDDEN)
    },
    setSymbol (symbol) {
      this.address = symbol.name
      this.ok()
    },
    ok () {
      const symbolName = _.find(this.$store.state.symbols, { name: this.address })
      if (symbolName) {
        bus.$emit(NAVIGATE_TO_ADDRESS, { address: symbolName.vma })
      } else {
        bus.$emit(NAVIGATE_TO_ADDRESS, { address: parseInt(this.address, 16) })
      }
      this.$refs.gotoAddressModal.hide()
    }
  }
}
</script>

<style scoped>
  .symbol-address {
    color: #adadad;
  }
</style>
