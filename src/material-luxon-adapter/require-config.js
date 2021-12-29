// Require.js is being used by the karma bazel rules and needs to be configured to properly
// load AMD modules which are not explicitly named in their output bundle.
require.config({
  paths: {
    'luxon': '/base/npm/node_modules/luxon/build/amd/luxon',
  },
});
