<template>
  <div
    style="position: absolute; left: 10px; top: 60px; bottom:0; right: 0; overflow: scroll;"
    @wheel="onWheel"
  >
    <div v-if="!hexLines">
      Loading...
    </div>
    <table class="hex-dump-table">
      <tbody>
        <tr v-for="h in hexLines">
          <td class="hex-cell-sec">
            {{ h.name }}:
          </td>
          <td class="hex-cell-addr">
            {{ h.addr|hex }}
          </td>
          <td class="hex-cell-gap" />
          <td
            v-for="byte in h.bytes"
            class="hex-cell-byte"
          >
            {{ byte }}
          </td>
          <td
            v-for="asc in h.asc"
            class="hex-cell-asc"
          >
            {{ asc }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import * as api from '../../api/oda'
import { bus, NAVIGATE_TO_ADDRESS } from '@/bus'

function convertDisplayUnitsToHexLines (dus) {
  const WIDTH = 16
  let curSection = ''
  let idx = -1

  const hexLines = []

  for (let i = 0; i < dus.length; i++) {
    const du = dus[i]

    if (du === undefined || du.dummy) {
      continue
    }

    // if this du is starting a new section
    if (du.sectionName !== curSection) {
      // if this isn't the first section and there actually was a previous section
      if (idx !== -1) {
        // pad out last line of the section to WIDTH
        while (hexLines[idx].bytes.length < WIDTH) {
          hexLines[idx].bytes.push('  ')
          hexLines[idx].asc.push('  ')
        }
      }

      // if the new section start is not 16-byte aligned
      if (du.vma % WIDTH !== 0) {
        // add a new hex line
        hexLines.push({
          name: du.sectionName,
          addr: du.vma,
          bytes: [],
          asc: []
        })
        idx++

        // pad out with leading empty bytes
        for (let p = 0; p < (du.vma % WIDTH); p++) {
          hexLines[idx].bytes.push('  ')
          hexLines[idx].asc.push('  ')
        }
      }
    }

    curSection = du.sectionName

    // add the raw bytes and ascii representation
    for (let b = 0; b < du.rawBytes.length; b += 2) {
      if ((du.vma + b / 2) % WIDTH === 0) {
        hexLines.push({
          name: du.sectionName,
          addr: du.vma + b / 2,
          bytes: [],
          asc: []
        })
        idx++
      }

      const byte = du.rawBytes.substring(b, b + 2)
      let asc = parseInt(byte, 16)
      asc = asc < 32 || asc > 127 ? '.' : String.fromCharCode(asc)
      try {
        hexLines[idx].bytes.push(byte)
        hexLines[idx].asc.push(asc)
      } catch (ex) { console.log(`err on ${idx}`) }
    }
  }

  if (idx !== -1) {
    // pad out last line to WIDTH
    while (hexLines[idx].bytes.length < WIDTH) {
      hexLines[idx].bytes.push('  ')
      hexLines[idx].asc.push('  ')
    }
  }

  return hexLines
}

export default {
  name: 'HexView',
  data () {
    return {
      topLda: 0,
      accumulate: 0
    }
  },
  computed: {
    hexLines () {
      return convertDisplayUnitsToHexLines(this.$store.getters.dusByRange(this.topLda, 300))
    }
  },
  watch: {
    hexLines () {
      if (this.hexLines[0]) {
        // bus.$emit(NAVIGATE_TO_ADDRESS, {address: this.hexLines[0].addr, lda: this.topLda})
      }
    }
  },
  created () {
    bus.$on(NAVIGATE_TO_ADDRESS, async (event) => {
      if (event.lda) {
        this.topLda = event.lda
        return
      }

      this.topLda = await api.vmaToLda(event.address)
    })
  },
  methods: {
    onWheel (event) {
      this.accumulate += event.deltaY / 15.0
      if (Math.abs(this.accumulate) > 1) {
        this.topLda += (Math.round(this.accumulate) * 5)
        if (this.topLda < 0) { this.topLda = 0 }
        this.accumulate = 0
      }
      event.preventDefault()
    }
  }
}
</script>

<style scoped>
  .hex-dump-table {
    font-family: monospace;
    cursor: text;
  }

  .hex-cell-sec {
    text-align: right;
    color: #808080;
  }

  .hex-cell-gap {
    padding: 0px 5px 0px 5px;
  }

  .hex-cell-asc {
    color: gray;
    padding: 0px 0px 0px 0px;
  }
</style>
