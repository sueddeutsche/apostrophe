var _ = require('lodash');
var async = require('async');

module.exports = {

  alias: 'areas',

  afterConstruct: function(self) {
    self.pushAssets();
    self.pushCreateSingleton();
  },

  construct: function(self, options) {
    require('./lib/api.js')(self, options);
    require('./lib/protectedApi.js')(self, options);
    require('./lib/helpers.js')(self, options);
    require('./lib/routes.js')(self, options);
    require('./lib/browser.js')(self, options);
  }
};
