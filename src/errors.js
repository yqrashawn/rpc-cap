module.exports = {
  caveats: {
    duplicateType: type => (
      'Permission already has caveat of type "' + type + '".'
    ),
    invalidOptions: opts => (
      'Invalid caveat options:\n' + opts
    ),
  }
}