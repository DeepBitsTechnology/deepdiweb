import { /* BRANCH_INSTRS , */ CALL_INSTRS, TRANSFER_INSTRS } from './x86'

export function buildDUs (state, odbFile, { data, branches }) {
  const dusByAddress = new Map()
  // const labels = new Set()
  // const a = odbFile.functions

  const baseAddress = odbFile.binary.base_address

  const instrAddrs = new Set()
  const functionCalls = [] // [ srcDu, functionAddress ][]

  const vmaOffsetToAdd = odbFile.binary.desc.some(x => x.toLowerCase().indexOf('pe32') !== -1)
    ? 0
    : baseAddress

  const dus = []
  for (const [offset, size, text] of data) {
    // deepdi returns addresses as an offset
    // we only need to add baseAddress for elf files
    const vma = offset + vmaOffsetToAdd

    const instruction = parseInstruction(odbFile, { vma, size, text })

    const physOffsetStart = odbFile.binary.desc.some(x => x.toLowerCase().indexOf('pe32') !== -1)
      ? offset - baseAddress // pe offset is from the vma of the first section
      : offset // elf offset is directly from start of file

    // push all instructions returned by deepdi
    const du = {
      sectionName: '', // find sections later after the instructions are sorted
      vma,
      rawBytes: [...state.binaryBytes.slice(physOffsetStart, physOffsetStart + size)].map(x => x.toString(16).padStart(2, '0')).join(''),
      instStr: instruction.text,
      // branch: '',
      // branch_label: '',
      opcode: instruction.opcode,
      operands: instruction.operands,
      // stringRef: undefined, // unused
      // branchRef: undefined, // unused
      targetRef: instruction.transferAddress ? { vma: instruction.transferAddress } : undefined, // whatever vma this du branches to
      isBranch: false, // if this is the target of a branch instruction
      crossRef: [], // list of dus that reference this du
      // isFunction: false, // unused
      // labelName: '', // unused
      isCode: true
    }

    dusByAddress.set(vma, du)
    dus.push(du)
    if (CALL_INSTRS.has(instruction.opcode)) {
      functionCalls.push([du, instruction.transferAddress])
    }

    // keep track of every address with an instruction
    for (let i = 0; i < size; i++) { instrAddrs.add(vma + i) }
  }

  // push every non-byte instruction
  for (let i = 0; i < state.binaryBytes.length; i++) {
    const vma = i + baseAddress

    if (!instrAddrs.has(vma)) {
      const byte = state.binaryBytes[i]
      const hexByte = byte.toString(16).padStart(2, '0')
      dus.push({
        sectionName: '',
        vma,
        rawBytes: hexByte,
        instStr: `<insn>db</insn>  <span class='raw'>${hexByte}h</span>${getCommentIfASCII(byte)}`,
        opcode: '',
        operands: '',
        targetRef: undefined,
        isBranch: false,
        isCode: false
      })
    }
  }

  // sort by vma
  dus.sort((a, b) => a.vma - b.vma)

  // populate sections
  populateSections(odbFile.sections, dus)

  // process xrefs
  // branches from deepdi
  for (const { srcAddr, targetAddr } of branches) {
    const src = dusByAddress.get(srcAddr)
    const target = dusByAddress.get(targetAddr)

    if (src && target) {
      src.targetRef = { vma: target.vma }
      target.isBranch = true
      target.crossRef.push({ vma: src.vma })
    }
  }

  // add xrefs for functions
  for (const [srcDu, functionAddress] of functionCalls) {
    const func = dusByAddress.get(functionAddress)
    if (func) {
      srcDu.targetRef = { vma: functionAddress }
      func.crossRef.push(srcDu)
    }
  }

  return dus
}

function parseInstruction (odbFile, { vma, size, text }) {
  const parts = text.split(' ')
  const opcode = parts.splice(0, 1)[0]
  const instruction = {
    text,
    opcode,
    operands: parts.join(' '),

    // if the instruction is a transfer
    transferOp: undefined,
    transferAddress: undefined
  }

  /*
    Need to fix some instructions from deepdi since they do not account for the base_address (elf)
    ex: call 0x1234
  */
  const addressOffsetToAdd = odbFile.binary.desc.some(x => x.toLowerCase().indexOf('pe32') !== -1)
    ? 0
    : odbFile.binary.base_address

  const match = text.match(/(\w+?) 0x(.+)/)
  if (match) {
    // eslint-disable-next-line no-unused-vars
    const [_, op, operand] = match
    const address = Number.parseInt(operand, 16) + addressOffsetToAdd

    if (TRANSFER_INSTRS.has(op)) {
      instruction.text = `${op} 0x${address.toString(16)}`
      instruction.transferOp = op
      instruction.transferAddress = address
    }

    if (CALL_INSTRS.has(op)) {
      // create a new function if it's not a function already
      if (!odbFile.functions.some(func => func.vma === address)) {
        const name = `func_0x${address.toString(16)}`
        odbFile.functions.push({
          retval: 'unknown',
          args: 'unknown',
          vma: address,
          name
        })

        odbFile.symbols.push({
          name,
          vma: address,
          type: 't'
        })
      }
    }
  }

  /*
  jmp qword ptr [rip + 0x205e52] does not have to be "fixed" because it is an actual offset
  but we still want to extract the address from it for xrefs
  */
  const offsetMatch = text.match(/(\w+?)\s.+?\[.+? \+ 0x(.+)\]/)
  if (offsetMatch) {
    // eslint-disable-next-line no-unused-vars
    const [_, op, addressOffset] = offsetMatch
    if (TRANSFER_INSTRS.has(op)) {
      const transferAddress = vma + size + Number.parseInt(addressOffset, 16)
      instruction.transferOp = op
      instruction.transferAddress = transferAddress
    }
  }

  return instruction
}

function populateSections (sections, dus) {
  // we only care for sections that are ALLOC'd
  const allocedSections = sections.filter((section) => section.flags.some(flag => flag.abbrev === 'ALLOC'))
  allocedSections.sort((a, b) => a.vma - b.vma)

  let currSectionIndex = 0
  let currSection = allocedSections[currSectionIndex]
  for (const du of dus) {
    // find the lower bound of the section
    while (currSectionIndex < sections.length && du.vma > (currSection.vma + currSection.size)) {
      currSection = allocedSections[currSectionIndex++]
    }

    if (currSectionIndex >= sections.length) { break }

    // console.log(`${currSection.vma} - ${currSection.vma + currSection.size} | ${du.vma}`)
    // check if the du is actually in the section, since there are dus that dont belong to any section
    if (currSection.vma <= du.vma && du.vma <= currSection.vma + currSection.size) {
      du.sectionName = currSection.name
    }
  }
}

function getCommentIfASCII (byteVal) {
  if (byteVal >= 0x20 && byteVal <= 0x7e) {
    return ` <span class='comment'>; ${String.fromCharCode(byteVal)}</span>`
  } else return ''
}

export function buildParcels (dus, vmaToLda, transferTargets) {
  /*
    {
        vma_start: number
        vma_end: number
        lda_start: number
        is_code: bool
    }
  */
  // build parcels based on sorted dus
  const parcels = []

  // a parcel is defined as a contiguous block of data/instructions in the same section
  // additionally, a parcel ends when there is a transfer instruction
  // or starts (ending the previous parcel) when it is the target of a transfer instruction
  let currParcel
  let currSection
  let currAddr
  let currCode

  for (const du of dus) {
    const { sectionName, vma, rawBytes, isCode, opcode } = du
    // console.log(`${sectionName} ? ${currSection} | ${currAddr} ? ${vma} | ${currCode} ? ${isCode}`)
    if (sectionName !== currSection || currAddr !== vma || currCode !== isCode || transferTargets.indexOf(vma) !== -1) {
      // the current parcel is done
      if (currParcel) {
        parcels.push(currParcel)
        currParcel = undefined
        currSection = undefined
        currAddr = undefined
        currCode = undefined
      }

      // create a new parcel
      currParcel = {
        vma_start: vma,
        vma_end: vma,
        lda_start: vmaToLda.get(vma),
        is_code: isCode,
        dus: [du]
      }

      currSection = sectionName
      // rawBytes is a hex string, so every 2 characters is a byte
      currAddr = vma + (rawBytes.length / 2)
      currCode = isCode
    } else {
      // current parcel is continuing
      currParcel.vma_end = vma
      currParcel.dus.push(du)
    }

    // if we have a transfer instruction, the parcel is done
    if (TRANSFER_INSTRS.has(opcode)) {
      parcels.push(currParcel)
      currAddr = undefined
      currParcel = undefined
    } else {
      currAddr = vma + (rawBytes.length / 2)
    }
  }

  if (currParcel) { parcels.push(currParcel) }
  window.parcels = parcels
  return parcels
}

export function buildGraph (store, vma) {
  /*
      {
        nodes:
        [
            {id: '0xdu1.vma', instructions: [du1, du2, du3, du4 ... }
            {id: '0xdu9.vma', instructions: [du9, du10, du11 .... }
            ....
        ]
        links: [
            { from: x, to: y, type: 'taken' }
            { from: y, to: z, type: 'notTaken'}
            { from: o, to: q, type: 'unconditional'}
        ]
    }
  */
  // console.log(parcels)
  const graph = { nodes: [], links: [] }

  // first find the parcel containing this vma
  const startingParcel = store.getters.parcelByVma(vma)
  if (!startingParcel || !startingParcel.is_code) {
    return graph
  }

  const graphNodes = new Set()
  graph.nodes.push(createGraphNode(startingParcel))
  graphNodes.add(startingParcel)

  const processedParcels = new Set()
  const parcelsToProcess = [startingParcel]
  while (parcelsToProcess.length > 0) {
    const currParcel = parcelsToProcess.pop()
    // console.log('currParcel', currParcel)

    const { links, referencedParcels, newParcelsToCheck } = getParcelOutgoing(store, currParcel)
    graph.links.push(...links)
    // console.log(`links for ${currParcel.vma_start}`, graph.links)
    // console.log(`newParcels for ${currParcel.vma_start}`, newParcelsToCheck)

    for (const parcel of [...referencedParcels, ...newParcelsToCheck]) {
      if (!graphNodes.has(parcel)) {
        graph.nodes.push(createGraphNode(parcel))
        graphNodes.add(currParcel)
      }
    }

    for (const newParcel of newParcelsToCheck) {
      if (!processedParcels.has(newParcel.vma_start)) {
        parcelsToProcess.push(newParcel)
      }
    }
    // console.log('processedParcels', processedParcels)

    processedParcels.add(currParcel.vma_start)
  }

  return graph
}

function createGraphNode (parcel) {
  return {
    id: `0x${parcel.vma_start.toString(16)}`,
    instructions: parcel.dus
  }
}

function getParcelOutgoing (store, parcel) {
  // gets outgoing links from a parcel
  // if the last instruction is unconditional transfser, i.e., jmp or call, we have 1 edge
  // if the last instruction is a transfer instruction, i.e., jne, we have 2 edges, taken and notTaken
  // otherwise we have an unconditional transfer to the next parcel

  const outgoing = {
    links: [], // any outgoing edges from the current parcel
    referencedParcels: [], // any parcels we referenced, but don't need to call getParcelOutgoing on
    newParcelsToCheck: [] // parcels that we should recursively call getParcelOutgoing on
  }

  const lastDu = parcel.dus[parcel.dus.length - 1]
  const nextParcelVma = lastDu.vma + (lastDu.rawBytes.length / 2)
  const notTakenParcel = store.getters.parcelByVma(nextParcelVma)

  if (!parcel.is_code) {
    return outgoing
  }

  if (lastDu.targetRef) {
    // a branch instruction

    const targetParcel = store.getters.parcelByVma(lastDu.targetRef.vma)
    if (!targetParcel) {
      console.log(`Parcel at ${lastDu.targetRef.vma} doesn't exist?`)
      return outgoing
    }

    if (lastDu.opcode === 'jmp' || CALL_INSTRS.has(lastDu.opcode)) {
      outgoing.links.push({ from: `0x${parcel.vma_start.toString(16)}`, to: `0x${targetParcel.vma_start.toString(16)}`, type: 'unconditional' })
      outgoing.newParcelsToCheck.push(targetParcel)
    } else {
      outgoing.links.push({ from: `0x${parcel.vma_start.toString(16)}`, to: `0x${targetParcel.vma_start.toString(16)}`, type: 'taken' })
      outgoing.links.push({ from: `0x${parcel.vma_start.toString(16)}`, to: `0x${notTakenParcel.vma_start.toString(16)}`, type: 'notTaken' })
      outgoing.newParcelsToCheck.push(targetParcel, notTakenParcel)
    }
  } else {
    // unconditional edge to next parcel because we don't have a transfer instruction
    if (notTakenParcel) {
      // if we have another parcel to default to
      if (notTakenParcel.dus.length > 0 && notTakenParcel.dus[0].opcode !== 'ret') {
        outgoing.links.push({ from: `0x${parcel.vma_start.toString(16)}`, to: `0x${notTakenParcel.vma_start.toString(16)}`, type: 'unconditional' })
        outgoing.referencedParcels.push(notTakenParcel)
      } else if (notTakenParcel.dus.length > 0 && notTakenParcel.dus[0].isBranch) {
        // if the first instruction of the next parcel is a target of a branch instruction, it might be the
        // start of a loop, so we need to check outgoing edges of that
        outgoing.newParcelsToCheck.push(notTakenParcel)
      }
    }
  }

  return outgoing
}
