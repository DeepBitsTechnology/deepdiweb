import * as api from '../api/oda'

// import {Realtime} from '../realtime'
import * as types from './mutation-types'

import { bus, NOTIFY } from '../bus'
import { buildDUs, buildParcels } from '../lib/lib'

// function sendRealtimeUpdate (msg, payload) {
//   if (realtime) {
//     realtime.emit(msg, payload)
//   }
// }

// function commitAndSendRealtimeUpdate ({ commit, state }, msg, payload) {
//   commit(msg, payload)
//   payload.user = _.get(state, 'user.username')
//   payload.timestamp = new Date()
//   sendRealtimeUpdate(msg, payload)
// }

export async function loadOdbFile ({ commit, state }) {
  const odbFile = await api.loadOdbFile()

  bus.$emit(NOTIFY, {
    text: 'Disassembling...'
  })
  let disassemblyTask
  if (odbFile.live_mode) {
    disassemblyTask = api.disassembleBytes({
      bytes: odbFile.binary.text,
      arch: odbFile.binary.options.architecture,
      mode: odbFile.binary.options.endian
    })
  } else {
    disassemblyTask = api.disassemble(state.shortName)
  }

  // we can do some local parsing while we wait for disassembly to finish
  // find strings (any contiguous sequence of more than 4 ascii characters)
  const strings = []
  const currString = { addr: 0, string: '' }
  for (let i = 0; i < state.binaryBytes.length; i++) {
    const char = state.binaryBytes[i]
    if (char >= 0x20 && char <= 0x7e) {
      if (currString.string === '') currString.addr = odbFile.binary.base_address + i
      currString.string += String.fromCharCode(char)
    } else {
      if (currString.string.length > 4) { strings.push(Object.assign({}, currString)) }
      currString.string = ''
    }
  }
  if (currString.string.length > 4) { strings.push(currString) }
  odbFile.strings = strings

  const { data, transfer } = await disassemblyTask
  bus.$emit(NOTIFY, {
    text: 'Parsing disassembling...'
  })

  // parse branches
  // deepdi returns { <dec_address: String>: [ if_taken, next_instr ] }[]
  // frontend needs { srcAddr, targetAddr }[]
  const branches = []
  for (const [address, branchTargets] of Object.entries(transfer)) {
    branches.push({
      srcAddr: Number.parseInt(address) + odbFile.binary.base_address,
      targetAddr: branchTargets[0] + odbFile.binary.base_address
    })
  }
  odbFile.branches = branches

  // parse dus
  const allDus = buildDUs(state, odbFile, { data, branches })

  // populate vma to lda store
  const vmaToLda = new Map()
  for (let i = 0; i < allDus.length; i++) {
    vmaToLda.set(allDus[i].vma, i)
  }

  commit(types.LOAD_ODBFILE, {
    odbFile,
    allDus,
    vmaToLda
  })

  commit(types.SET_PARCELS, {
    parcels: buildParcels(allDus, vmaToLda, branches.map(x => x.targetAddr))
  })

  commit(types.SET_BRANCHES, {
    branches: odbFile.branches
  })

  // if (realtime) {
  //   realtime.close()
  // }

  // realtime = new Realtime('http://localhost:8080')
}

export function loadDu ({ commit, state }, { addr, units }) {
  // console.log('loadDu', addr, units)
  // const slice = _.slice(state.displayUnits, addr, addr + units)
  // if (slice.length > 0 && _.every(slice) && slice.length === units) {
  //   return Q.resolve(slice)
  // }

  // return api.loadDisplayUnits(addr, units).then((displayUnits) => {
  //   commit(types.CACHE_DISPLAYUNITS, {
  //     start: addr,
  //     displayUnits: displayUnits
  //   })
  //   return displayUnits
  // })
}

export async function clearDisplayUnits ({ commit, state }, { addr }) {
  // const lda = await api.vmaToLda(addr)
  // const start = Math.max(0, lda - 250)
  // const displayUnits = await api.loadDisplayUnits(start, 600)

  // api.loadBranches().then((branches) => {
  //   commit(types.SET_BRANCHES, {
  //     branches: branches
  //   })
  // })

  // commitAndSendRealtimeUpdate({ commit, state }, types.CLEAR_AND_SET_DISPLAYUNITS, {
  //   start: start,
  //   displayUnits: displayUnits
  // })
}

export async function setBinaryText ({ commit, state, dispatch }, { binaryText }) {
  // await api.setBinaryText(binaryText)

  // commit(types.SET_BINARYTEXT, {
  //   binaryText
  // })

  // dispatch('clearDisplayUnits', { addr: 0 })
  // return true
}

export async function setBinaryOptions ({ commit, state, dispatch }, { architecture, baseAddress, endian, selectedOpts }) {
  // await api.setBinaryOptions(architecture, baseAddress, endian, selectedOpts)
  // commit(types.SET_BINARYOPTIONS, { architecture, baseAddress, endian, selectedOpts })
  // dispatch('clearDisplayUnits', { addr: 0 })
  // return true
}

export async function dataToCode ({ commit, state, dispatch }, { addr }) {
  // await api.dataToCode(addr)
  // const parcels = await api.loadParcels()
  // commitAndSendRealtimeUpdate({ commit, state }, types.SET_PARCELS, { parcels })
  // dispatch('clearDisplayUnits', { addr: addr })
}

export async function codeToData ({ commit, state, dispatch }, { addr }) {
  // await api.codeToData(addr)
  // const parcels = await api.loadParcels()
  // commitAndSendRealtimeUpdate({ commit, state }, types.SET_PARCELS, { parcels })
  // dispatch('clearDisplayUnits', { addr: addr })
}

export async function addComment ({ commit, state }, { comment, vma }) {
  // await api.makeComment(comment, vma)
  // commitAndSendRealtimeUpdate({ commit, state }, types.MAKE_COMMENT, { comment, vma })
}

export async function setDefaultSharingLevel ({ commit, state }, { permissionLevel }) {
  // await api.setDefaultPermissionLevel(permissionLevel)
  // commit(types.SET_DEFAULT_PERMISSION_LEVEL, { permissionLevel })
}

export function updateUserPosition ({ commit, state }, { username, address }) {
  // commit(types.UPDATE_USER_POSITION, { username, address })
}

export async function createString ({ commit, state, dispatch }, { addr }) {
  // await api.createDefinedData(addr, 'builtin', 'ascii', 'string_' + addr.toString(16))
  // dispatch('clearDisplayUnits', { addr: addr })
}

export async function undefineData ({ commit, state, dispatch }, { addr }) {
  // await api.undefineData(addr)
  // dispatch('clearDisplayUnits', { addr: addr })
}

export async function createStructDefinedData ({ commit, state, dispatch }, { addr, varName, structName }) {
  // await api.createDefinedData(addr, 'struct', structName, varName)
  // dispatch('clearDisplayUnits', { addr: addr })
}

export async function upsertFunction ({ commit, state }, { vma, name, retval, args }) {
  // const f = _.find(state.functions, { vma: vma })
  // if (f) {
  //   await api.updateFunction(vma, name, retval, args)
  // } else {
  //   await api.createFunction(vma, name, retval, args)
  // }

  // commitAndSendRealtimeUpdate({ commit, state }, types.UPDATE_FUNCTION, { vma, name, retval, args })
}

export async function addStruct ({ commit, state }, { name }) {
  // await api.createStructure(name)
  // commit(types.ADD_STRUCTURE, { name })
}

export async function deleteStruct ({ commit, state }, { index }) {
  // await api.deleteStructure(index)
  // commit(types.DELETE_STRUCT, { index: index })
}

export async function updateStruct ({ commit, state }, { index, struct }) {
  // await api.updateStructure(index, struct)
}

export async function login ({ commit, state }, { username, password }) {
  // await auth.login(username, password)
  // const whoami = auth.whoami()
  // commit(types.UPDATE_USER, { user: whoami })
  // return whoami
}
