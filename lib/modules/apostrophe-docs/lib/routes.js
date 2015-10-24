var _ = require('lodash');

module.exports = function(self, options) {

  self.route('all', 'autocomplete', function(req, res) {
    var data = (req.method === 'POST') ? req.body : req.query;
    return self.autocomplete(req, data, function(err, response) {
      if (err) {
        res.statusCode = 500;
        return res.send('error');
      }
      return res.send(
        JSON.stringify(response)
      );
    });
  });

  self.route('post', 'choices', function(req, res) {
    // We're supposed to receive an array of objects with "value"
    // properties (the id) and additional relationship properties that
    // are of simple types, but don't trust that, sanitize so it's
    // not easy to crash our templates. -Tom
    var _items = req.body.items;
    var items = [];
    _.each(_.isArray(_items) ? _items : [], function(_item) {
      var item = {
        value: self.apos.launder.id(_item.value)
      };
      _.each(item, function(value, key) {
        if (key === '_id') {
          return;
        }
        var type = typeof(value);
        if ((type === 'boolean') || (type === 'string') || (type === 'number')) {
          item[key] = value;
        }
      });
    });
    if (typeof(data) !== 'object') {
      res.statusCode = 500;
      return res.send('error');
    }
    var schema = [ field ];
    return self.apos.schemas.join(req, schema, data, true, function(err) {
      if (err) {
        console.error(err);
        res.statusCode = 500;
        return res.send('error');
      }
      console.log(data);
      return res.send(self.render(req, 'choices', { choices: data[field.name], data: data, field: field }));
    });
  });

};
