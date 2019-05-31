
const caveats = require('./src/caveats')

module.exports = {
  default: require('./src/middleware'),
  addCaveat: caveats.default,
  caveatTypes: caveats.caveatTypes,
}