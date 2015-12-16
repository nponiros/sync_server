'use strict';

const path = require('path');

const dataFolder = `sync_server_test`;

module.exports = {
  apiPath: '/api/v1',
  dataPath: path.resolve('/tmp', dataFolder),
  collectionNames: ['test_collection'],
  port: 8080,
  // Settings only used in tests
  test: {
    domain: 'localhost',
    protocol: 'http://'
  }
};
