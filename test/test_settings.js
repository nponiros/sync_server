'use strict';

const path = require('path');

module.exports = {
  apiPath: '/api/v1',
  dataPath: path.resolve(__dirname, 'integration/test_data'),
  collectionNames: ['upload', 'empty', 'non_empty'],
  port: 8080,
  // Settings only used in tests
  test: {
    domain: 'localhost',
    protocol: 'http://'
  }
};
