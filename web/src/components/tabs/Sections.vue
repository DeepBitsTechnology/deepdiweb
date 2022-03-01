<template>
  <div
    class="container"
    style="padding: 8px"
  >
    <table
      class="sections-table"
      style="min-width: 750px; font-size: 14px"
    >
      <tbody>
        <tr>
          <th>Name</th>
          <th style="text-align: right">
            Size
          </th>
          <th style="text-align: right">
            VMA
          </th>
          <th style="text-align: left">
            Flags
          </th>
          <th style="text-align: right">
            Alignment
          </th>
        </tr>

        <tr
          v-for="section in sections"
          :key="section.name"
          class="even"
        >
          <td>
            <span
              class="clickable"
              @click="setSection(section)"
            >{{
              section.name
            }}</span>
          </td>

          <td align="right">
            {{ section.size }} bytes
          </td>

          <td
            align="right"
            style="
              font-family: Menlo, Monaco, Consolas, 'Courier New', monospace;
            "
            class="clickable"
            @click="setSection(section)"
          >
            0x{{ section.vma | hex }}
          </td>

          <td align="left">
            <span
              v-for="flag in section.flags"
              :key="section.name + '-' + flag.name"
              v-b-popover.hover="flag.desc"
              :class="['badge', 'badge-pill', getFlagLabel(flag)]"
              :title="flag.name"
              placement="top"
              style="margin-right: 5px"
            >
              {{ getFlagText(flag.name) }}
            </span>
          </td>

          <td align="right">
            2<sup>0</sup>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import Vue from 'vue'
import { mapState } from 'vuex'
import { bus, NAVIGATE_TO_ADDRESS, OPEN_LISTING_TAB } from '../../bus'

const labels = [
  'bg-primary',
  'bg-success',
  'bg-danger',
  'bg-warning',
  'bg-info',
  'bg-secondary'
]
let labelIndex = 0
const flagLabelMap = []
function getFlagLabel (flag) {
  if (flagLabelMap[flag] === undefined) {
    flagLabelMap[flag] = labels[labelIndex]
    labelIndex = (labelIndex + 1) % labels.length
  }

  const label = flagLabelMap[flag]

  return label
}

export default {
  name: 'SectionsTab',
  data () {
    return {}
  },
  computed: mapState(['projectName', 'binary', 'sections']),
  methods: {
    getFlagText: function (flag) {
      const s = flag.split('_')
      return s[s.length - 1]
    },
    getFlagLabel (flag) {
      return getFlagLabel(flag.name)
    },
    setSection: function (section) {
      bus.$emit(OPEN_LISTING_TAB)
      Vue.nextTick().then(function () {
        bus.$emit(NAVIGATE_TO_ADDRESS, { address: section.vma })
      })
    }
  }
}
</script>

<style scope>
.clickable {
  color: #0088cc;
  text-decoration: none;
  cursor: pointer;
}

.clickable:hover {
  text-decoration: underline;
}

.sections-table td,
.sections-table th {
  padding: 3px 10px 3px 10px;
}

.sections-table th {
  background-color: #92c1f0;
}

.sections-table tr.odd td {
  background-color: #c8deff;
}
</style>
