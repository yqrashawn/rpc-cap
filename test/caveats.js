
const test = require('tape')
const equal = require('fast-deep-equal')
const clone = require('rfdc')()

const createPermissionsMiddleware = require('../').default
const addCaveat = require('../').addCaveat
const TYPES = require('../').caveatTypes

const perm1 = {
  method: 'restrictedMethodName',
  id: '63b225d0-414e-4a2d-8067-c34499c984c7', // UUID string
  date: 0, // unix time of creation
}

const perm2 = {
  method: 'restrictedMethodName',
  id: '63b225d0-414e-4a2d-8067-c34499c984c7', // UUID string
  date: 0, // unix time of creation
  caveats: [ // An optional array of objects describing limitations on the method reference.
    {
      type: 'static', // The static caveat only returns the specified static response value.
      value: 'Always this!'
    }
  ]
}

test('addCaveat with invalid permission type', t => {

  const perm = clone(perm1)

  try {
    addCaveat(perm, { type: 'foo' })
    t.ok(false, 'should have thrown')
  } catch (err) {
    t.ok(err.message === 'Invalid caveat type.', 'throws expected error')
    t.ok(equal(perm, perm1), 'did not modify perm')
    t.end()
  }
})

const staticCav1 = {
  type: TYPES.STATIC,
  value: 'Always this!'
}

const staticCav2 = {
  type: TYPES.STATIC,
  value: 'Always this other thing!'
}

test('addCaveat with static permission type', t => {

  const perm = clone(perm1)

  addCaveat(perm, clone(staticCav1))
  t.ok(equal(perm.caveats[0], staticCav1), 'perm was added')
  t.end()
})

const fixedParamsCav1 = {
  type: TYPES.FIXED_PARAMS,
  value: [{fixed: true, value: 'foo'}, {fixed: false}, {fixed: true, value: 'bar'}]
}

const fixedParamsCav2 = {
  type: TYPES.FIXED_PARAMS,
  value: [{fixed: false}, {fixed: false}, {fixed: true, value: 'foo'}]
}

test('addCaveat with fixed-params permission type', t => {

  const perm = clone(perm1)

  addCaveat(perm, { type: TYPES.FIXED_PARAMS, value: ['foo', undefined, 'bar']})
  t.ok(equal(perm.caveats[0], fixedParamsCav1), 'perm was added')
  t.end()
})

const conditionCav1 = {
  type: TYPES.CONDITION,
  subType: '1',
  value: 'foo',
  _validator: (req, val) => req.val === val,
  validate: function (req) {
    return this._validator(req, this.value)
  },
}

test('addCaveat with condition permission type', t => {

  const perm = clone(perm1)

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