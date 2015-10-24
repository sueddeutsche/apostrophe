apos.define('apostrophe-pieces-manager', {
  extend: 'apostrophe-modal',
  source: 'manage',

  beforeConstruct: function(self, options) {
    if (options.choose) {
      options.body = { choose: options.choose.field };
    }
  },

  construct: function(self, options) {
    self.page = 1;
    self.schema = self.options.schema;
    self.choose = self.options.choose;

    // turn a filter config object into a working filter

    self.generateFilter = function(filter) {
      return {
        name: filter.name,
        setDefault: function() {
          self.currentFilters[filter.name] = stringify(filter.def);
        }
      }
      function stringify(def) {
        if (typeof(def) === 'string') {
          return def;
        }
        else if ((def === undefined) || (def === null)) {
          return 'any';
        } else if (def) {
          return '1';
        } else {
          return '0';
        }
      }
    };

    self.beforeShow = function(callback) {
      self.$headings = self.$el.find('[data-manage-headings]');
      self.$list = self.$el.find('[data-manage-list]:first');
      self.$pager = self.$el.find('[data-manage-pager]');
      self.$filters = self.$el.find('[data-manage-filters]');
      self.enableFilters();
      self.enableSorts();
      self.enableChoose(function(err) {
        if (err) {
          return callback(err);
        }
        apos.on('change', self.onChange);
        self.refresh();
        return callback(null);
      });
    };

    self.enableFilters = function() {

      self.filters = [
        {
          name: 'page',
          handler: function($el, value) {
            self.currentFilters.page = value;
            self.refresh();
          }
        }
      ];

      _.each(self.options.filters, function(filter) {
        return self.filterTo
      })
      var filterFields = _.filter(self.schema, function(field) {
        return !!(field.manage && field.manage.filter);
      });

      self.filters = self.filters.concat(_.map(self.options.filters, function(filterConfig) {
        return self.generateFilter(filterConfig);
      }));

      self.currentFilters = {};

      _.each(self.filters, function(filter) {
        filter.setDefault = filter.setDefault || function() {
          self.currentFilters[filter.name] = 1;
        };
        filter.handler = filter.handler || function($el, value) {
          self.currentFilters[filter.name] = value;
          self.currentFilters.page = 1;
          self.refresh();
        };
        filter.setDefault();
        self.link(filter.name, filter.handler);
      });
    };

    self.enableSorts = function() {
      self.$el.on('change', '[name="sort"]', function() {
        self.sort = JSON.parse(self.$el.find('[name="sort"]').val());
        self.refresh();
      });
    }

    self.refresh = function() {
      var listOptions = {
        format: 'managePage',
        choose: self.options.choose && self.options.choose.field
      };

      _.extend(listOptions, self.currentFilters);
      listOptions.sort = self.sort;

      self.api('list', listOptions, function(response) {
        if (!response.status === 'ok') {
          alert('An error occurred. Please try again.');
          return;
        }
        self.$filters.html(response.data.filters);
        self.$headings.html(response.data.headings);
        self.$list.html(response.data.list);
        self.refreshListSelect();
        self.$pager.html(response.data.pager);
        // right now only filters needs this, but be more futureproof
        apos.emit('enhance', self.$filters);
        apos.emit('enhance', self.$headings);
        apos.emit('enhance', self.$list);
        apos.emit('enhance', self.$pager);
      });
    };

    // If a previously selected item is part of the current list view, precheck its box

    self.refreshListSelect = function() {
      if (!self.choose) {
        return;
      }
      var $selective = self.$choose.find('[data-selective]:first');
      var data = $selective.selective('get');
      var $select = self.$list.find('[name="choose-select"]');
      _.each(data, function(item) {
        var id = item.value || item;
        var $checkbox = self.$list.find('[data-piece="' + id + '"]').find('[name="choose-select"]');
        $checkbox.prop('checked', true);
      });
    };

    self.onChange = function(type) {
      if (type === self.options.name) {
        self.refresh();
      }
    };

    self.afterHide = function() {
      // So we don't leak memory and keep refreshing
      // after we're gone
      apos.off('change', self.onChange);
    };

    self.enableChoose = function(callback) {

      if (!self.choose) {
        return setImmediate(callback);
      }

      self.enableSelectToggle();

      self.choose.schema = [ self.choose.field ];
      self.$choose = self.$el.find('[data-manage-choose]');

      var data = {};

      return self.refreshChoices(callback);
    };

    self.enableSelectToggle = function() {
      // When the checkboxes are toggled, talk to the jquery selective control
      // that implements the chooser
      self.$el.on('change', '[name="choose-select"]', function() {
        var $checkbox = $(this);
        var id = $checkbox.closest('[data-piece]').attr('data-piece');
        var data = self.choose.data;
        var field = self.choose.field;
        if (field.type === 'joinByArray') {
          if (!data[field.idsField]) {
            field.idsField = [];
          }
          var ids = data[field.idsField];
          if ($checkbox.prop('checked')) {
            ids.push(id);
          } else {
            data[field.idsField] = ids.filter(function(_id) {
              return _id !== id;
            });
          }
        } else if (field.type === 'joinByOne') {
          if ($checkbox.prop('checked')) {
            data[field.idField] = id;
          } else {
            delete data[field.idField];
          }
        } else {
          apos.log('Unsupported join type in chooser (pieces/manager.js): ' + field.type);
        }
        self.refreshChoices(function() {});
        return false;
      });
    };

    self.refreshChoices = function(callback) {
      return self.html(
        'choices',
        _.pick(self.choose, 'field', 'data'),
        function(html) {
          self.$choose.html(html);
          return callback(null);
        },
        function(err) {
          return callback(err);
        }
      );
    };

    self.saveContent = function(callback) {
      if (!self.choose) {
        return setImmediate(callback);
      }
      self.choose.save(null);
      return setImmediate(callback);
    };
  }
});
