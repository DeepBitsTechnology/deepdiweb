<template>
  <div
    id="hex-sidebar-scroll"
    class="sidebar-content"
  >
    <div class="oda-sidebar-title">
      Raw View
    </div>

    <div class="alert alert-info">
      Set the platform below. You can also upload an ELF, PE, or other raw executable file from the <em>File</em> menu.
    </div>

    <div
      id="accordion3"
      class="accordion"
      style="padding-bottom:10px"
    >
      <button
        id="platform-btn"
        type="button"
        class="btn btn-small btn-danger"
        @click="toggleOptionsView()"
      >
        Platform: <span class="platform-option">{{ binaryOptions.architecture }}</span>
      </button>

      <button
        type="button"
        class="btn btn-small btn-danger"
        @click="disassembleText()"
      >
        Disassemble!
      </button>

      <div
        v-if="showBinaryOptions"
        style="border: 1px solid #e5e5e5; border-radius: 5px; margin-top: 10px; width:95%;padding: 10px;"
      >
        <PlatformOptions
          :binary-options="binaryOptions"
          @options-updated="optionsUpdated($event)"
        />
      </div>
    </div>

    <div
      v-if="entryError"
      id="hex-alert"
      class="alert alert-warning"
    >
      <button
        type="button"
        class="close"
        data-dismiss="alert"
      >
        &times;
      </button>
      <strong>Warning!</strong> You can only disassemble hexadecimal characters, check your inputs.
    </div>

    <textarea
      id="hex"
      v-model="binaryText"
      class="sidebar-scroll-container-text form-control"
      style="width:95%; margin-bottom: 5px; height:275px;"
    />
  </div>
</template>

<script>
import { mapState } from 'vuex'
import _ from 'lodash'
import PlatformOptions from '../PlatformOptions'
import { bus, LIVE_ENTRY_CHANGED, NOTIFY } from '../../bus'
import { LOAD_BINARY } from '../../store/mutation-types'
import { uploadFile } from '../../api/oda'

export default {
  name: 'LiveEntry',
  components: {
    PlatformOptions
  },
  data () {
    return {
      binaryText: null,
      entryError: false,
      showBinaryOptions: false
    }
  },
  computed: mapState(['architectures', 'binaryOptions']),

  watch: {
    binaryText: _.debounce(async function (newValue, oldValue) {
      if (oldValue != null) {
        try {
          await this.$store.dispatch('setBinaryText', { binaryText: this.binaryText })
          this.entryError = false
          bus.$emit(LIVE_ENTRY_CHANGED)
        } catch (e) {
          this.entryError = true
        }
      }
    }, 500)
  },

  created: function () {
    this.binaryText = this.$store.state.binaryText
  },
  methods: {
    toggleOptionsView () {
      this.showBinaryOptions = !this.showBinaryOptions
    },
    async optionsUpdated (options) {
      await this.$store.dispatch('setBinaryOptions', options)
      bus.$emit(LIVE_ENTRY_CHANGED)
      // console.log('optionsUpdated', options)
    },
    async disassembleText () {
      let bytes
      try {
        bytes = new Uint8Array([...this.binaryText.split(' ').map(x => Number.parseInt(x, 16))])
      } catch (ex) {
        this.$bus.emit(NOTIFY, { message: 'Unable to parse binary string into hex stream.' })
      }
      const f = new FormData()
      f.append('filedata', new Blob([bytes]), 'raw')
      const { short_name: shortName } = await uploadFile({
        filedata: f.get('filedata'),
        projectName: 'data',
        arch: this.binaryOptions.architecture,
        mode: this.binaryOptions.endian
      })
      this.$store.commit(LOAD_BINARY, { binaryBytes: bytes })
      this.$router.push({ path: `/odaweb/${shortName}` })
    }
  }
}
</script>

<style scoped>
  .sidebar-content {
    padding: 10px;
  }

  .oda-sidebar-title {
    font-size: 16px;
    font-weight: bold;
    border-bottom: 2px solid #ddd;
    margin-bottom: 10px;
  }
</style>
