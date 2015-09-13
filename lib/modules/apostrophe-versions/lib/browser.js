module.exports = function(self, options) {

  self.pushAssets = function() {
    self.pushAsset('script', 'user', { when: 'user' });
    self.pushAsset('script', 'editor', { when: 'user' });
    self.pushAsset('stylesheet', 'user', { when: 'user' });
  }

  self.pushCreateSingleton = function() {

    var browserOptions = {
      action: self.action,
      messages: {
        tryAgain: self.apos.i18n.__('Server error, please try again.')
      }
    };

    self.apos.push.browserCall('always', 'apos.create("apostrophe-versions", ?)', browserOptions);
  };

};
