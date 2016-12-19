const path = require('path');

const winston = require('winston');
const Logger = winston.Logger;
const FileTransport = winston.transports.File;
const ConsoleTransport = winston.transports.Console;

const errorTransportName = 'errorTransport';
const infoTransportName = 'infoTransport';

function initializeFileLogger(logsPath, accessLogFileName, errorLogFileName) {
  return new Logger({
    transports: [
      new FileTransport({
        name: infoTransportName,
        filename: path.join(logsPath, accessLogFileName),
        level: 'info',
      }),
      new FileTransport({
        name: errorTransportName,
        filename: path.join(logsPath, errorLogFileName),
        level: 'error',
        handleExceptions: true,
        humanReadableUnhandledException: true,
      }),
    ],
  });
}

function initializeConsoleLogger() {
  return new Logger({
    transports: [
      new ConsoleTransport({
        name: infoTransportName,
        level: 'info',
      }),
      new ConsoleTransport({
        name: errorTransportName,
        level: 'error',
        handleExceptions: true,
        humanReadableUnhandledException: true,
      }),
    ],
  });
}

function initializeLogger(logsPath, { accessLogFileName, errorLogFileName }) {
  return {
    console: initializeConsoleLogger(),
    file: initializeFileLogger(logsPath, accessLogFileName, errorLogFileName),
  };
}

module.exports = initializeLogger;
