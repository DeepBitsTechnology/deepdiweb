/* function OdbFileOld (duList) {
  this.getInstructions = function (ldu, number) {
    var dus = duList.slice(ldu, ldu + number)
    for (var i = 0; i < dus.length; i++) {
      dus[i].index = ldu + i
    }
    return dus
  }

  this.getInstruction = function (ldu) {
    return duList[ldu]
  }

  this.numberInstructions = function () {
    return duList.length
  }
} */

import { mkdir } from './mkdir'
import Q from 'q'

export class OdbFile {
  constructor (duList) {
    this.duList = duList
  }

  getInstructions (ldu, number) {
    console.log('getInstructions', ldu, number)
    const deferred = Q.defer()
    const self = this
    setTimeout(function () {
      const dus = self.duList.slice(ldu, ldu + number)
      for (let i = 0; i < dus.length; i++) {
        dus[i].index = ldu + i
      }
      deferred.resolve(dus)
    }, 200)
    return deferred.promise
  }

  getInstruction (ldu) {
    const deferred = Q.defer()
    const self = this
    setTimeout(function () {
      deferred.resolve(self.duList[ldu])
    }, 250)
    return deferred.promise
  }

  numberInstructions () {
    return this.duList.length
  }

  randomAddress () {
    return this.duList[Math.floor(Math.random() * this.duList.length)]
  }

  static loadMkdir () {
    return new OdbFile(mkdir)
  }
}
