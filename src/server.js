// Express modules
const bodyParser = require('body-parser');
const express = require('express');

// Internal modules
const settings = require('./settings.js');
const apiRoutes = require('./api_routes.js');
const send = require('./sender_functions.js');

const Collection = require('./collection.js');
let apiHandlers = require('./api_handlers.js');

const collections = new Map();
collections.set('tags', new Collection('tags'));
collections.set('bookmarks', new Collection('bookmarks'));
apiHandlers = apiHandlers.init(collections);

function start(port) {
// TODO CORS
  const expressApp = express();

  expressApp.set('port', port);
  expressApp.set('x-powered-by', false);
  expressApp.use(bodyParser.json());

  expressApp.use(settings.apiPath, apiRoutes.init(apiHandlers.upload, apiHandlers.download));

// catch 404 and forward to error handler
  expressApp.use(function(req, res, next) {
    const err = new Error('Not Found');
    next(err);
  });

// Error handler
  expressApp.use(function(err, req, res, next) { // eslint-disable-line no-unused-vars
    send.error(res, 500, err);
  });

  expressApp.listen(expressApp.get('port'), function() {
    console.log(`Express server listening on port ${expressApp.get('port')}`);
  });
}

module.exports = {start};
