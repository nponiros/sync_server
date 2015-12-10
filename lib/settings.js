'use strict';

const path = require('path');

module.exports = {
  apiPath: '/api/v1',
  dataPath: path.resolve(process.env.HOME, 'BM_DATA'),
  collectionNames: ['tags', 'bookmarks'],
  port: 3000
};
