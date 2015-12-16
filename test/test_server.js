'use strict';

const fs = require('fs');

const pidFile = '/tmp/sync_server.pid';
const action = process.argv[2];
const settings = require('./test_settings.js');

if (action === 'start') {
  const server = require('../lib/server.js');

  fs.writeFileSync(pidFile, process.pid);

  server.start(settings);
} else if (action === 'stop') {
  const pid = fs.readFileSync(pidFile);
  process.kill(Number(pid));
  fs.unlinkSync(pidFile);
  fs.unlinkSync(`${settings.dataPath}/upload.db`);
} else {
  throw Error('Action not supported!');
}
