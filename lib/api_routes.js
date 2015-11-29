'use strict';

const express = require('express');

const router = express.Router(); // eslint-disable-line new-cap

function init(upload, download) {
  // Connection check
  router.head('/check', function(req, res) {
    res.end();
  });

  // Synchronization
  router.post('/upload', upload);
  router.post('/download', download);

  return router;
}

module.exports = {init};
