module.exports = {
  caveats: {
    valueUndefined: () => 'Caveat value is undefined.',
    duplicateSubType: (type, subType) => (
      'Permission already has "' + type +
      '" caveat of subType "' + subType + '".'
    ),
    invalidOptions: opts => (
      'Invalid condition caveat options:\n' + opts
    ),
    invalidType: type => 'Invalid caveat type: ' + type,
    incompatibleType: (newType, existingType) => (
      'Cannot add caveat of type "' + newType  + '"; permission already ' + 
      'has caveat of type"' + existingType + '".'
    )
  }
}