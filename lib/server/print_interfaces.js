'use strict';

const os = require('os');

function printInterfaces(logger, protocol, port) {
  const ifaces = os.networkInterfaces();
  const ifaceNames = Object.keys(ifaces);
  logger.console.info('Server addresses:');
  ifaceNames.forEach((name) => {
    const iface = ifaces[name];
    iface.forEach((ifaceEntry) => {
      if (ifaceEntry.family === 'IPv4') {
        logger.console.info(`${ifaceEntry.family}: ${protocol}://${ifaceEntry.address}:${port}`);
      } else {
        logger.console.info(`${ifaceEntry.family}: ${protocol}://[${ifaceEntry.address}]:${port}`);
      }
    });
  });
  logger.file.info('Server start');
}

module.exports = printInterfaces;
