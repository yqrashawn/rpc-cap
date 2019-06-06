
const test = require('tape')
const equal = require('fast-deep-equal')
const clone = require('rfdc')()

const createPermissionsMiddleware = require('../').default
const { addCaveat, removeCaveat, caveatEqual } = require('../')
const errors = require('../src/errors').caveats

const perm1 = {
  method: 'restrictedMethodName',
  id: '63b225d0-414e-4a2d-8067-c34499c984c7', // UUID string
  date: 0, // unix time of creation
}

const validator1 = (req, val) => req.val === val

const opts1 = {
  type: 'foo',
  value: 'bar',
  validator: validator1,
}

const cav1 = {
  type: 'foo',
  value: 'bar',
  _validator: validator1,
  validate: validateFunction,
}

test('addCaveat: valid caveat', t => {

  const perm = clone(perm1)

  addCaveat(perm, clone(opts1))
  t.ok(
    caveatEqual(
      perm.caveats[0], cav1, { val: 'bar' }
    ), 'caveat was added and validates'
  )
  t.end()
})

test('addCaveat: multiple valid caveats', t => {

  const perm = clone(perm1)
  const opts = clone(opts1)
  const cav = clone(cav1)

  addCaveat(perm, opts)
  t.ok(
    perm.caveats.length === 1 && caveatEqual(
      perm.caveats[0], cav, { val: 'bar' }
    ), 'caveat was added and validates'
  )

  opts.type = 'abc'
  cav.type = 'abc'
  addCaveat(perm, opts)
  t.ok(
    perm.caveats.length === 2 && caveatEqual(
      perm.caveats[1], cav, { val: 'bar' }
    ), 'caveat was added and validates'
  )

  opts.type = 'xyz'
  cav.type = 'xyz'
  addCaveat(perm, opts)
  t.ok(
    perm.caveats.length === 3 && caveatEqual(
      perm.caveats[2], cav, { val: 'bar' }
    ), 'caveat was added and validates'
  )

  t.end()
})

test('addCaveat: invalid options', t => {

  // invalid options conditions in addCaveat
  // typeof opts.type !== 'string' ||
  // opts.value === undefined ||
  // typeof opts.validator !== 'function' ||
  // opts.validator.length !== 2 // accepts 2 params

  const perm = clone(perm1)
  let opts = clone(opts1)

  opts.type = 2
  try {
    addCaveat(perm, opts)
    t.ok(false, 'should have thrown')
  } catch (err) {
    t.ok(
      err.message === errors.invalidOptions(opts),
      'throws expected error for invalid "type" value'
    )
    t.ok(equal(perm, perm1), 'did not modify perm')
  }

  opts = clone(opts1)
  opts.value = undefined
  try {
    addCaveat(perm, opts)
    t.ok(false, 'should have thrown')
  } catch (err) {
    t.ok(
      err.message === errors.invalidOptions(opts),
      'throws expected error for undefined "value"'
    )
    t.ok(equal(perm, perm1), 'did not modify perm')
  }

  opts = clone(opts1)
  opts.validator = 'sune'
  try {
    addCaveat(perm, opts)
    t.ok(false, 'should have thrown')
  } catch (err) {
    t.ok(
      err.message === errors.invalidOptions(opts),
      'throws expected error for invalid "validator" value'
    )
    t.ok(equal(perm, perm1), 'did not modify perm')
  }

  opts = clone(opts1)
  opts.validator = foo => true
  try {
    addCaveat(perm, opts)
    t.ok(false, 'should have thrown')
  } catch (err) {
    t.ok(
      err.message === errors.invalidOptions(opts),
      'throws expected error for invalid number of "validator" params'
    )
    t.ok(equal(perm, perm1), 'did not modify perm')
  }

  t.end()
})

test('addCaveat: valid caveat with duplicate type', t => {

  const perm = clone(perm1)
  perm.caveats = [ clone(cav1) ]

  try {
    addCaveat(perm, clone(opts1))
    t.ok(false, 'should have thrown')
  } catch (err) {
    t.ok(
      err.message === errors.duplicateType('foo'),
      'throws expected error'
    )
    t.ok(
      equal(perm, { ...perm1, caveats: [ clone(cav1) ]}),
      'did not modify perm'
    )
  }
  t.end()
})

test('removeCaveat: remove existing caveats', t => {

  const perm = clone(perm1)
  perm.caveats = [ clone(cav1) ]
  const cav2 = { ...cav1, type: 'abc' }
  const cav3 = { ...cav1, type: 'xyz' }
  perm.caveats.push(cav2)
  perm.caveats.push(cav3)

  t.ok((
      caveatEqual(removeCaveat(perm, 'abc'), clone(cav2)) &&
      perm.caveats.length === 2 &&
      perm.caveats[0].type === 'foo' &&
      perm.caveats[1].type === 'xyz'
    ), 'only specified caveat was removed'
  )

  t.ok((
      caveatEqual(removeCaveat(perm, 'foo'), clone(cav1)) &&
      perm.caveats.length === 1 &&
      perm.caveats[0].type === 'xyz'
    ), 'only specified caveat was removed'
  )

  t.ok((
      caveatEqual(removeCaveat(perm, 'xyz'), clone(cav3)) &&
      perm.caveats.length === 0
    ), 'only specified caveat was removed'
  )

  t.end()
})

test('removeCaveat: remove existing caveats', t => {
  const perm = clone(perm1)
  perm.caveats = [ clone(cav1) ]
  t.ok(
    removeCaveat(perm, 'abc') === null && perm.caveats.length === 1,
    'removing non-existing caveat returns null and does not modify caveats'
  )
  t.end()
})

test('removeCaveat and addCaveat: replace existing caveat', t => {
  
  const perm = clone(perm1)
  perm.caveats = [ clone(cav1), { ...cav1, type: 'abc' } ]
  const cav = removeCaveat(perm, 'foo')
  t.ok(perm.caveats.length === 1, 'caveat was removed')

  addCaveat(perm, {
    validator: cav._validator,
    type: cav.type,
    value: 'kabobviously',
  })
  t.ok(
    (
      perm.caveats.length === 2 &&
      caveatEqual(perm.caveats[0], { ...cav1, type: 'abc' } ) &&
      caveatEqual(perm.caveats[1], { ...cav1, value: 'kabobviously' })
    ), 'caveat added back without side effects'
  )

  t.end()
})

// exactly as in caveats.js
function validateFunction (req) {
  return this._validator(req, this.value)
}
