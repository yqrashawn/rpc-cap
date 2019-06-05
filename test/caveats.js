
const test = require('tape')
const equal = require('fast-deep-equal')
const clone = require('rfdc')()

const createPermissionsMiddleware = require('../').default
const addCaveat = require('../').addCaveat
const TYPES = require('../').caveatTypes
const errors = require('../src/errors').caveats

const defaultPerm = {
  method: 'restrictedMethodName',
  id: '63b225d0-414e-4a2d-8067-c34499c984c7', // UUID string
  date: 0, // unix time of creation
}

const permStatic = {
  ...defaultPerm,
  caveats: [ // An optional array of objects describing limitations on the method reference.
    {
      type: TYPES.STATIC, // The static caveat only returns the specified static response value.
      value: 'Always this!'
    }
  ]
}

const permFixedParams = {
  ...defaultPerm,
  caveats: [ // An optional array of objects describing limitations on the method reference.
    {
      type: TYPES.FIXED_PARAMS, // The static caveat only returns the specified static response value.
      value: [{fixed: true, value: 'foo'}, {fixed: false}, {fixed: true, value: 'bar'}],
    }
  ]
}

test('addCaveat: undefined caveat value', t => {

  const perm = clone(defaultPerm)

  try {
    addCaveat(perm, { type: TYPES.STATIC, value: undefined })
    t.ok(false, 'should have thrown')
  } catch (err) {
    t.ok(err.message === errors.valueUndefined(), 'throws expected error')
    t.ok(equal(perm, defaultPerm), 'did not modify perm')
  }
  t.end()
})

test('addCaveat: invalid caveat type', t => {

  const perm = clone(defaultPerm)

  try {
    addCaveat(perm, { type: 'foo', value: true })
    t.ok(false, 'should have thrown')
  } catch (err) {
    t.ok(err.message === errors.invalidType('foo'), 'throws expected error')
    t.ok(equal(perm, defaultPerm), 'did not modify perm')
  }
  t.end()
})

const staticCav = {
  type: TYPES.STATIC,
  value: 'Always this!'
}

test('addCaveat: static, valid', t => {

  const perm = clone(defaultPerm)

  addCaveat(perm, clone(staticCav))
  t.ok(equal(perm.caveats[0], staticCav), 'perm was added')
  t.end()
})

test('addCaveat: static with incompatible existing permissions', t => {

  let perm = clone(permStatic)

  try {
    addCaveat(perm, clone(staticCav))
    t.ok(false, 'should have thrown')
  } catch (err) {
    t.ok(
      err.message === errors.incompatibleType(TYPES.STATIC, TYPES.STATIC),
      'throws expected error'
    )
    t.ok(equal(perm, permStatic), 'did not modify perm')
  }

  perm = clone(permFixedParams)

  try {
    addCaveat(perm, clone(staticCav))
    t.ok(false, 'should have thrown')
  } catch (err) {
    t.ok(
      err.message === errors.incompatibleType(TYPES.STATIC, TYPES.FIXED_PARAMS),
      'throws expected error'
    )
    t.ok(equal(perm, permFixedParams), 'did not modify perm')
  }
  t.end()
})

// test('addCaveat with static permission type', t => {

// })

const fixedParamsCav = {
  type: TYPES.FIXED_PARAMS,
  value: [{fixed: true, value: 'foo'}, {fixed: false}, {fixed: true, value: 'bar'}]
}

test('addCaveat: fixed-params, valid', t => {

  const perm = clone(defaultPerm)

  addCaveat(perm, { type: TYPES.FIXED_PARAMS, value: ['foo', undefined, 'bar']})
  t.ok(equal(perm.caveats[0], fixedParamsCav), 'perm was added')
  t.end()
})

test('addCaveat: fixed-params with incompatible existing permissions', t => {

  let perm = clone(permFixedParams)

  try {
    addCaveat(perm, clone(fixedParamsCav))
    t.ok(false, 'should have thrown')
  } catch (err) {
    t.ok(
      err.message === errors.incompatibleType(TYPES.FIXED_PARAMS, TYPES.FIXED_PARAMS),
      'throws expected error'
    )
    t.ok(equal(perm, permFixedParams), 'did not modify perm')
  }

  perm = clone(permStatic)

  try {
    addCaveat(perm, clone(fixedParamsCav))
    t.ok(false, 'should have thrown')
  } catch (err) {
    t.ok(
      err.message === errors.incompatibleType(TYPES.FIXED_PARAMS, TYPES.STATIC),
      'throws expected error'
    )
    t.ok(equal(perm, permStatic), 'did not modify perm')
  }

  t.end()
})

const conditionCav1 = {
  type: TYPES.CONDITION,
  subType: '1',
  value: 'foo',
  _validator: (req, val) => req.val === val,
  validate: validateFunction,
}

// exactly as in caveats.js
function validateFunction (req) {
  return this._validator(req, this.value)
}

test('addCaveat with condition permission type', t => {

  const perm = clone(defaultPerm)

  addCaveat(perm, {
    type: TYPES.CONDITION,
    subType: '1',
    value: 'foo',
    validator: (req, val) => req.val === val
  })
  t.ok(
    conditionCaveatEqual(
      perm.caveats[0], conditionCav1, { val: 'foo' }
    ), 'perm was added'
  )
  t.end()
})

function conditionCaveatEqual(a, b, testReq) {
  return (
    a.type === b.type &&
    a.subType === b.subType &&
    equal(a.value, b.value) &&
    ''+a._validator === ''+b._validator && // functionBody.toString()
    a.validate(testReq) === b.validate(testReq)
  )
}