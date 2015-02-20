var _ = require('lodash');

module.exports = {

  afterConstruct: function(self) {
    self.createApp();
    self.prefix();
    self.sessions();
    self.requiredMiddleware();
    self.optionalMiddleware();
    self.addListenMethod();
  },

  construct: function(self, options) {

    var express = require('express');
    var bodyParser = require('body-parser');
    var expressSession = require('express-session');
    var connectFlash = require('connect-flash');
    var cookieParser = require('cookie-parser');

    self.createApp = function() {
      self.apos.app = self.apos.baseApp = express();
      self.apos.express = express;
    };

    self.prefix = function() {
      if (self.options.prefix) {
        express.response.redirect = function(status, url) {
          if (arguments.length === 1) {
            url = status;
            status = 302;
          }
          if (!url.match(/^[a-zA-Z]+:/))
          {
            url = options.prefix + url;
          }
          return original.call(this, status, url);
        };
        self.apos.baseApp = express();
        self.apos.baseApp.use(options.prefix, self.apos.app);
      }
    };

    self.sessions = function() {
      var sessionOptions = self.apos.options.sessions || {};
      _.defaults(sessionOptions, {
        // Do not save sesions until something is stored in them.
        // Greatly reduces aposSessions collection size
        saveUninitialized: false,
        // The mongo store uses TTL which means we do need
        // to signify that the session is still alive when someone
        // views a page, even if their session has not changed
        resave: true,
        // Always update the cookie, so that each successive
        // access revives your login session timeout
        rolling: true,
        secret: 'required',
        cookie: {}
      });
      _.defaults(sessionOptions.cookie, {
        path: '/',
        httpOnly: true,
        secure: false,
        // Default login lifetime between requests is one day
        maxAge: 86400
      });
      if (!sessionOptions.secret) {
        throw 'You must set the sessions.secret option to a string unique to your project.';
      }
      if (!sessionOptions.store) {
        var MongoStore = require('connect-mongo')(expressSession);
        sessionOptions.store = new MongoStore({ db: self.apos.db });
      }
      self.apos.app.use(expressSession(sessionOptions));
    };

    self.requiredMiddleware = function() {
      // extended: true means that people[address[street]] works
      // like it does in a PHP urlencoded form. This has a cost
      // but is too useful and familiar to leave out. -Tom and Ben

      self.apos.app.use(function(req, res, next) {
        req.rawBody = '';

        req.on('data', function(chunk) {
          req.rawBody += chunk;
        });

        next();
      });

      self.apos.app.use(bodyParser.urlencoded({ extended: true }));
      self.apos.app.use(bodyParser.json({}));
      self.apos.app.use(cookieParser());
      self.apos.app.use(connectFlash());
    };

    self.optionalMiddleware = function() {
      // Middleware that is not automatically installed on
      // every route but is recommended for use in your own
      // routes when needful
      self.apos.middleware = {
        files: require('connect-multiparty')()
      };
    }

    self.addListenMethod = function() {
      self.apos.listen = function() {
        // Default address for dev
        var address = self.options.address || '0.0.0.0';
        // Default port for dev
        var port = self.options.port || 3000;
        // Heroku
        if (process.env.ADDRESS) {
          address = process.env.ADDRESS;
        } else {
          try {
            // Stagecoach option
            address = fs.readFileSync(self.apos.rootDir + '/data/address', 'UTF-8').replace(/\s+$/, '');
          } catch (err) {
            console.log("I see no data/address file, defaulting to address " + address);
          }
        }
        if (process.env.PORT) {
          port = process.env.PORT;
        } else {
          try {
            // Stagecoach option
            port = fs.readFileSync(self.apos.rootDir + '/data/port', 'UTF-8').replace(/\s+$/, '');
          } catch (err) {
            console.log("I see no data/port file, defaulting to port " + port);
          }
        }
        var server;
        if (port.toString().match(/^\d+$/)) {
          console.log("Listening on " + address + ":" + port);
          server = self.apos.baseApp.listen(port, address);
        } else {
          console.log("Listening at " + port);
          server = self.apos.baseApp.listen(port);
        }
        if (self.apos.options.afterListen) {
          server.on('error', function(err) {
            return self.apos.options.afterListen(err);
          });
          server.on('listening', function() {
            return self.apos.options.afterListen(null);
          });
        }
      };
    };
  }
};