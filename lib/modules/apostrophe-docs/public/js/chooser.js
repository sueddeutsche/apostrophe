apos.define('apostrophe-docs-chooser', {
  extend: 'apostrophe-context',
  afterConstruct: function(options) {
    self.refresh(callback);
  },
  construct: function(self, options) {
    // drag
    // up
    // down
    // relationship edit
    self.$el = options.$el;
    // clone the data so we don't modify it even when cancelled
    self.items = _.cloneDeep(options.items || []);
    self.relationships = options.relationships;
    self.$list = self.$el.find('[data-chooser-list]');
    self.refresh = function(callback) {
      self.html('choices', {
        items: self.items,
        edit: self.options.edit,
        add: self.options.add,
        limit: self.options.limit
      }, function(html) {
        self.$list.html(html);
        if (callback) {
          return callback(null);
        }
      }, function(err) {
        if (callback) {
          return callback(err);
        }
      });
    };
    self.add = function(id, callback) {
      self.items.push({ value: id });
      return self.refresh(callback);
    };
    self.remove = function(id, callback) {
      self.items = _.filter(self.items, function(item) {
        return item.value !== id;
      });
      return self.refresh(callback);
    };
    self.get = function(callback) {
      return callback(null, self.items);
    };
  }
});
