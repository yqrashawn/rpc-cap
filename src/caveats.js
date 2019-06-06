
const deepClone = require('rfdc')() // really fast deep clone
const deepFreeze = require('deep-freeze-strict')
const equal = require('fast-deep-equal')
const freeze = Object.freeze

const errors = require('./errors').caveats

module.exports = {
  addCaveat,
  removeCaveat,
  caveatEqual,
}

/**
 *  caveats: [ // An optional array of objects describing limitations on the method reference.
 *    {
 *      type: 'static', // The static caveat only returns the specified static response value.
 *      value: [{ fixed: true, value: 'Always this!' }, ...]
 *    },
 *    {
 *      type: 'requiredAccount' // The condition caveat ensures the request conforms to some condition
 *      value: ['0x1ac390...'],
 *      validate: request => boolean
 *    }
 *  ]
 * 
 * addCaveat takes a permission object and options defining the caveat.
 * The caveat options are self-explanatory, except for the validator function.
 * The validator function must accept 2 parameters: a permissions request RPC
 * object and a condition value (of any type) with which the request will be
 * compared.
 * 
 */

/**
 * Creates a caveat per the options and adds it to the permission.
 * 
 * @param {Object} perm the permission
 * @param {Object} opts the caveat options
 */
function addCaveat (perm, opts) {

  const caveats = perm.caveats ? perm.caveats.slice() : []

  if (
    typeof opts.type !== 'string' ||
    opts.value === undefined ||
    typeof opts.validator !== 'function' ||
    opts.validator.length !== 2 // accepts 2 params
  ) throw new Error(errors.invalidOptions(opts))

  if (alreadyExists(caveats, opts.type))
    throw new Error(errors.duplicateType(opts.type))

  caveats.push(deepFreeze({
    type: opts.type,
    value: deepClone(opts.value),
    _validator: opts.validator,
    validate,
  }))

  // once this is pure:
  // return deepFreze({
  //   ...perm,
  //   caveats: newCaveats
  // })
      
  // TODO: freeze permissions and make this function pure
  perm.caveats = freeze(caveats)
}

/**
 * Removes the caveat of the given type for the given permission.
 * Returns the removed caveat if it exists; null otherwise.
 * 
 * @param {Object} perm 
 * @param {String} type 
 */
function removeCaveat(perm, type) {
  let cav = null
  if (perm.caveats && perm.caveats.length > 0) {
    const newCaveats = []
    for (let c of perm.caveats) {
      if (c.type === type) cav = c
      else newCaveats.push(c)
    }
    perm.caveats = newCaveats
  }
  return cav
}

/**
 * Checks if two caveats are semantically equivalent.
 * @param {Object} a 
 * @param {Object} b 
 */
function caveatEqual(a, b) {
  return (
    a.type === b.type &&
    equal(a.value, b.value) &&
    ''+a._validator === ''+b._validator // functionBody.toString()
  )
}

/**
 * The internal validation function used by all caveats.
 * @param {Object} request 
 */
function validate(request) {
  return this._validator(request, this.value)
}

/**
 * Returns whether the given array of caveats already has a caveat of the
 * given type.
 * 
 * @param {Array} caveats 
 * @param {String} type 
 */
function alreadyExists(caveats, type) {
  for (let c of caveats) {
    if (c.type === type) return true
  }
  return false
}
