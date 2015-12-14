'use strict';

const fs = require('fs');

const pidFile = '/tmp/sync_server.pid';
const action = process.argv[2];

if (action === 'start') {
  const settings = require('./test_settings.js');
  const server = require('../lib/server.js');

  fs.writeFileSync(pidFile, process.pid);

  server.start(settings);
} else if (action === 'stop') {
  const pid = fs.readFileSync(pidFile);
  process.kill(Number(pid));
  fs.unlink(pidFile);
} else {
  throw Error('Action not supported!');
}
