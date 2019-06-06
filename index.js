
const caveats = require('./src/caveats')

module.exports = {
  default: require('./src/middleware'),
  addCaveat: caveats.addCaveat,
  removeCaveat: caveats.removeCaveat,
  caveatEqual: caveats.caveatEqual,
}