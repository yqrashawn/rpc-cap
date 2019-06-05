
const deepClone = require('rfdc')() // really fast deep clone
const deepFreeze = require('deep-freeze-strict')
const freeze = Object.freeze

const errors = require('./errors').caveats

const TYPES = {
  STATIC: 'static',
  FIXED_PARAMS: 'fixed-params',
  CONDITION: 'condition',
}

module.exports = {
  default: addCaveat,
  caveatTypes: TYPES,
}

/**
 *  caveats: [ // An optional array of objects describing limitations on the method reference.
 *    {
 *      type: 'static', // The static caveat only returns the specified static response value.
 *      value: [{ fixed: true, value: 'Always this!' }, ...]
 *    },
 *    {
 *      type: 'condition' // The condition caveat ensures the request conforms to some condition
 *      subType: 'valid-accounts',
 *      condition: ['0x1ac390...'],
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

  if (opts.value === undefined)
    throw new Error(errors.valueUndefined())

  switch (opts.type) {

    case TYPES.STATIC:

      if (alreadyExists(caveats, 'type', TYPES.STATIC))
        throw new Error(errors.incompatibleType(TYPES.STATIC, TYPES.STATIC))

      if (alreadyExists(caveats, 'type', TYPES.FIXED_PARAMS))
        throw new Error(errors.incompatibleType(
          TYPES.STATIC, TYPES.FIXED_PARAMS
        ))

      caveats.push(deepFreeze({
        type: TYPES.STATIC,
        value: deepClone(opts.value),
      }))
      break
      // once this is pure:
      // return deepFreze({
      //   ...perm,
      //   caveats: newCaveats
      // })
    
    case TYPES.FIXED_PARAMS:

      if (alreadyExists(caveats, 'type', TYPES.STATIC))
        throw new Error(errors.incompatibleType(
          TYPES.FIXED_PARAMS, TYPES.STATIC
        ))

      if (alreadyExists(caveats, 'type', TYPES.FIXED_PARAMS))
        throw new Error(errors.incompatibleType(
          TYPES.FIXED_PARAMS, TYPES.FIXED_PARAMS
        ))

      caveats.push(deepFreeze({
        type: TYPES.FIXED_PARAMS,
        value: createFixedParams(opts.value),
      }))
      break
    
    case TYPES.CONDITION:

      if (alreadyExists(caveats, 'subType', opts.subType))
        throw new Error(errors.duplicateSubType(type, subType))

      if (
        typeof opts.subType !== 'string' ||
        typeof opts.validator !== 'function' ||
        opts.validator.length !== 2 // accepts 2 params
      ) throw new Error(errors.invalidOptions(opts))

      caveats.push(deepFreeze({
        type: TYPES.CONDITION,
        subType: opts.subType,
        value: deepClone(opts.value),
        _validator: opts.validator,
        validate: function (req) {
          return this._validator(req, this.value)
        },
      }))
      break
    
    default:
      throw new Error(errors.invalidType(opts.type))
  }
  // TODO: freeze permissions and make this function pure
  perm.caveats = freeze(caveats)
}

/**
 * Creates formatted fixed parameters value property from argument.
 * 
 * Ex: 'abc' => { fixed: true, value: 'abc' }
 *     ['abc', , 123] => [
 *       { fixed: true, value: 'abc' },
 *       { fixed: false },
 *       { fixed: true, value: 123 }
 *     ]
 * 
 * @param {any} value single value !== undefined OR array of arbitrary values
 */
function createFixedParams(value) {

  if (value === undefined) throw new Error(
    'Single fixed param value must not be undefined; use null instead.'
  )

  let vals
  if (!Array.isArray(value)) vals = [value]
  else vals = value

  const params = []
  // traditional for-loop to handle empty as well as undefind array items
  for (let i = 0; i < vals.length; i++) {
    if (vals[i] === undefined) params.push({ fixed: false })
    else params.push({ fixed: true, value: deepClone(vals[i]) })
  }
  return params
}

/**
 * Returns whether the given array of caveats already has a caveat with key: val
 * 
 * @param {Array} caveats 
 * @param {String} key 
 * @param {String} val 
 */
function alreadyExists(caveats, key, val) {
  for (let c of caveats) {
    if (c[key] === val) return true
  }
  return false
}
