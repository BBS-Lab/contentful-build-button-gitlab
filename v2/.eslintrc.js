const path = require('path')

module.exports = {
  extends: [
    require.resolve('@contentful/eslint-config-extension/jest'),
    require.resolve('@contentful/eslint-config-extension/jsx-a11y'),
    require.resolve('@contentful/eslint-config-extension/react'),
    require.resolve('@contentful/eslint-config-extension/typescript'),
  ],
}
