import axios from 'axios/index'
import { bus, API_ERROR } from '../bus'
import store from '../store/index'

const API_ROOT_URL = process.env.API_ROOT_URL

axios.defaults.xsrfCookieName = 'csrftoken'
axios.defaults.xsrfHeaderName = 'X-CSRFToken'

const odaAxios = axios.create({ baseURL: API_ROOT_URL })

export const state = {
  vmaToLda: undefined
}

function error (e) {
  bus.$emit(API_ERROR, e)
  throw e
}

export async function loadOdbFile () {
  try {
    const response = await odaAxios.get('/odaweb/api/load', {
      params: {
        short_name: store.state.shortName,
        revision: store.state.revision
      }
    })
    // state.odbFile = response.data
    return response.data
  } catch (e) {
    error({ e, message: `loading an odb file ${store.state.shortName}` })
  }
}

// export async function loadDisplayUnits (addr, units) {
//   console.log('loading display units', addr, units)
//   try {
//     const response = await odaAxios.get('/odaweb/api/displayunits/', {
//       params: {
//         short_name: store.state.shortName,
//         revision: store.state.revision,
//         addr: addr,
//         units: units,
//         logical: true
//       }
//     })

//     return response.data
//   } catch (e) {
//     error({ e })
//   }
// }

export async function disassemble (shortName) {
  try {
    const response = await odaAxios.post(`/odaweb/api/${shortName}/disassemble`)
    return response.data
    // const formData = new FormData()
    // formData.append('file', file, 'file')
    // const response = await odaAxios.post('/odaweb/api/disassemble', formData, {
    //   headers: {
    //     'Content-Type': 'multipart/form-data'
    //   }
    // })
    // return response.data
  } catch (e) {
    error({ e, message: e.response.data })
  }
}

export async function disassembleBytes ({ bytes, arch, mode }) {
  try {
    const form = new FormData()
    form.append('bytes', bytes)
    form.append('arch', arch)
    form.append('mode', mode)
    const response = await odaAxios.post('/odaweb/api/disassemble_bytes', form, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  } catch (e) {
    error({ e, message: e.response.data })
  }
}

// export async function loadBranches () {
//   try {
//     const response = await odaAxios.get(`/odaweb/api/masters/${store.state.shortName}/branches/`)
//     return response.data.branches
//   } catch (e) {
//     error({ e })
//   }
// }

export async function vmaToLda (vma) {
  // return the closest lda we have to vma
  let closest
  for (const [currVma, currLda] of state.vmaToLda.entries()) {
    if (vma >= currVma) { closest = currLda } else { break }
  }
  return closest

  // try {
  //   const response = await odaAxios.get('/odaweb/api/displayunits/1/vmaToLda/', {
  //     params: {
  //       short_name: store.state.shortName,
  //       revision: store.state.revision,
  //       vma: vma
  //     }
  //   })

  //   return response.data
  // } catch (e) {
  //   error({ e })
  // }
}

export async function findBytes (store, bytes) {
  const bytesToSearch = [] // the byte values to search for

  if (bytes.length > 2 && bytes[0] === '"' && bytes[bytes.length - 1] === '"') {
    // convert everything between the quotes to its actual value
    for (let i = 1; i < bytes.length - 1; i++) {
      bytesToSearch.push(bytes.charCodeAt(i))
    }
  } else {
    bytes = bytes.replaceAll(' ', '')
    if (bytes.length % 2 !== 0) {
      error({ message: 'Byte string to search for is not divisible by 2' })
      return []
    }

    for (let i = 0; i < bytes.length - 1; i += 2) {
      const hex = bytes.slice(i, i + 2)
      const number = Number.parseInt(hex, 16)
      if (isNaN(number)) {
        error({ message: `${hex} is not valid hex` })
        return []
      } else {
        bytesToSearch.push(number)
      }
    }
  }

  if (bytesToSearch.length === 0) { return [] }

  const results = []
  function isMatch (binaryBytes, i, bytesToSearch) {
    if (binaryBytes[i] === bytesToSearch[0]) {
      for (let j = 1; j < bytesToSearch.length; j++) {
        if (binaryBytes[i + j] !== bytesToSearch[j]) {
          return false
        }
      }
      return true
    }
    return false
  }

  const binaryBytes = store.getters.binaryBytes()
  for (let i = 0; i < binaryBytes.length; i++) {
    if (isMatch(binaryBytes, i, bytesToSearch)) {
      results.push({ addr: i, section: '' })
    }
  }

  // convert our relative file offsets to vma
  for (const result of results) {
    result.addr += store.getters.binaryInfo().base_address
  }

  return results
  // const response = await odaAxios.get('/odaweb/api/find/', {
  //   params: {
  //     short_name: store.state.shortName,
  //     revision: store.state.revision,
  //     bytes: bytes
  //   }
  // })

  // return response.data
}

export async function setBinaryText (binaryText) {
  try {
    const response = await odaAxios.patch('/odaweb/api/binarystrings/0/', {
      short_name: store.state.shortName,
      revision: store.state.revision,
      binary_string: binaryText
    })
    return response.data
  } catch (e) {
    error({ e })
  }
}

export async function canEdit (shortName) {
  const response = await odaAxios.get(`/odaweb/api/masters/${shortName}/can_edit/`)
  return response.data
}

export async function copyOdaMaster (shortName) {
  try {
    const response = await odaAxios.get(`/odaweb/api/masters/${shortName}/clone/`)
    return response.data // { short_name, binary_bytes, raw }
  } catch (e) {
    error({ e, message: e.resp.data })
  }
}

export async function getArchitectureOptions (arch) {
  if (arch === 'UNKNOWN!') {
    return Promise.resolve([])
  }
  try {
    const response = await odaAxios.get(`/odaweb/api/disassembler/0/options/?arch=${arch}`)
    return response.data
  } catch (e) {
    error({ e, message: `getting the architecture ${arch} options` })
  }
}

export async function setBinaryOptions (architecture, baseAddress, endian, selectedOpts, shortName, revision = 0) {
  if (!shortName) {
    shortName = store.state.shortName
  }

  try {
    const response = await odaAxios.patch('/odaweb/api/options/0/', {
      architecture: architecture,
      base_address: baseAddress,
      endian: endian,
      selected_opts: selectedOpts,
      short_name: shortName,
      revision: revision
    })
    return response.data
  } catch (e) {
    error({ e, message: 'set the binary options' })
  }
}

export async function uploadFile ({ filedata, projectName, arch, mode }) {
  try {
    const formData = new FormData()
    formData.append('filedata', filedata)
    formData.append('project_name', projectName)
    formData.append('arch', arch)
    formData.append('mode', mode)
    const response = await odaAxios.post('/odaweb/_upload', formData)
    return response.data
  } catch (e) {
    error({ e, message: e.response.data })
  }
}

export async function graph (addr) {
  const response = await odaAxios.get('/odaweb/api/graph', {
    params: {
      short_name: store.state.shortName,
      revision: store.state.revision,
      addr: addr
    }
  })
  return response.data
}

// export async function loadParcels() {
//   const response = await odaAxios.get('/odaweb/api/parcels/', {
//     params: {
//       short_name: store.state.shortName,
//       revision: store.state.revision
//     }
//   })
//   return response.data
// }

export async function dataToCode (addr) {
  try {
    const response = await odaAxios.get('/odaweb/api/displayunits/1/makeCode/', {
      params: {
        short_name: store.state.shortName,
        revision: store.state.revision,
        vma: addr
      }
    })
    return response.data
  } catch (e) {
    error({ e, message: e.response.data.detail })
  }
}

export async function codeToData (addr) {
  try {
    const response = await odaAxios.get('/odaweb/api/displayunits/1/makeData/', {
      params: {
        short_name: store.state.shortName,
        revision: store.state.revision,
        vma: addr
      }
    })
    return response.data
  } catch (e) {
    error({ e, message: 'change code to data' })
  }
}

export async function createDefinedData (addr, typeKind, typeName, varName) {
  try {
    const response = await odaAxios.post('/odaweb/api/definedData/', {
      short_name: store.state.shortName,
      revision: store.state.revision,
      vma: addr,
      type_kind: typeKind,
      type_name: typeName,
      var_name: varName
    })
    return response.data
  } catch (e) {
    error({ e, message: e.response.data.detail })
  }
}

export async function undefineData (addr) {
  try {
    const response = await odaAxios.delete('/odaweb/api/definedData/0/', {
      data: {
        short_name: store.state.shortName,
        revision: store.state.revision,
        vma: addr
      }
    })
    return response.data
  } catch (e) {
    error({ e, message: e.response.data.detail })
  }
}

export async function makeComment (comment, vma) {
  try {
    const response = await odaAxios.post('/odaweb/api/comments/', {
      short_name: store.state.shortName,
      revision: store.state.revision,
      comment: comment,
      vma: vma
    })
    return response.data
  } catch (e) {
    error({ e, message: 'adding a comment' })
  }
}

// export async function loadOperations() {
//   try {
//     const response = await odaAxios.get('/odaweb/api/operations/', {
//       params: {
//         short_name: store.state.shortName,
//         revision: store.state.revision
//       }
//     })
//     return response.data
//   } catch (e) {
//     error({ e, message: 'Loading the operations...' })
//   }
// }

// export async function decompiled(addr) {
//   const response = await odaAxios.get('/odaweb/api/decompiler', {
//     params: {
//       short_name: store.state.shortName,
//       revision: store.state.revision,
//       addr: addr
//     }
//   })
//   return response.data
// }

// export async function setDefaultPermissionLevel(permissionLevel) {
//   try {
//     const response = await odaAxios.post(`/odaweb/api/masters/${store.state.shortName}/set_default_permission_level/`, {
//       permission_level: permissionLevel
//     })
//     return response.data
//   } catch (e) {
//     error({ e, message: 'getting the decompiled results' })
//   }
// }

export async function createFunction (vma, name, retval, args) {
  try {
    const response = await odaAxios.post('/odaweb/api/displayunits/1/makeFunction/', {
      short_name: store.state.shortName,
      revision: store.state.revision,
      vma: vma,
      name: name,
      retval: retval,
      args: args
    })
    return response.data
  } catch (e) {
    error({ e, message: 'adding a new function' })
  }
}

export async function updateFunction (vma, name, retval, args) {
  try {
    const response = await odaAxios.patch('/odaweb/api/functions/0/', {
      short_name: store.state.shortName,
      revision: store.state.revision,
      vma: vma,
      name: name,
      retval: retval,
      args: args
    })
    return response.data
  } catch (e) {
    error({ e, message: 'updating an existing function' })
  }
}

// export async function createStructure(name) {
//   try {
//     const response = await odaAxios.post('/odaweb/api/cstructs/', {
//       short_name: store.state.shortName,
//       revision: store.state.revision,
//       is_packed: true,
//       name: name

//     })
//     return response.data
//   } catch (e) {
//     error({ e, message: 'creating a structure definition' })
//   }
// }

// export async function deleteStructure(index) {
//   try {
//     const response = await odaAxios.delete(`/odaweb/api/cstructs/${index}/`, {
//       data: {
//         short_name: store.state.shortName,
//         revision: store.state.revision
//       }
//     })
//     return response.data
//   } catch (e) {
//     error({ e, message: 'deleting a structure definition' })
//   }
// }

// export async function updateStructure(index, structure) {
//   try {
//     const structFieldNames = []
//     const structFieldTypes = []

//     const numFields = structure.fields.length
//     for (let i = 0; i < numFields; i++) {
//       structFieldNames[i] = structure.fields[i].name
//       structFieldTypes[i] = structure.fields[i].type
//     }

//     const response = await odaAxios.get(`/odaweb/api/cstructs/${index}/modify/`, {
//       params: {
//         short_name: store.state.shortName,
//         revision: store.state.revision,
//         field_types: structFieldTypes,
//         field_names: structFieldNames
//       }
//     })

//     return response.data
//   } catch (e) {
//     error({ e, message: 'deleting a structure definition' })
//   }
// }

// export async function listMyDocuments() {
//   try {
//     const response = await odaAxios.get('/odaweb/api/masters/')
//     return response.data
//   } catch (e) {
//     error({ e, message: 'deleting a structure definition' })
//   }
// }

// export async function deleteDocument(shortName) {
//   try {
//     const response = await odaAxios.delete(`/odaweb/api/masters/${shortName}/`)
//     return response.data
//   } catch (e) {
//     error({ e, message: 'deleting a structure definition' })
//   }
// }
