const winston = require('winston');
const Logger = winston.Logger;
const FileTransport = winston.transports.File;
const ConsoleTransport = winston.transports.Console;

const errorTransportName = 'errorTransport';

function initializeFileLogger(accessLogFileName, errorLogFileName, logsPath) {
  const logger = new Logger({
    transports: [
      new FileTransport({
        name: 'infoTransport',
        filename: `${logsPath}/${accessLogFileName}`,
        level: 'info'
      }),
      new FileTransport({
        name: errorTransportName,
        filename: `${logsPath}/${errorLogFileName}`,
        level: 'error',
        handleExceptions: true,
        humanReadableUnhandledException: true
      })
    ]
  });
  return logger;
}

function initializeConsoleLogger() {
  const logger = new Logger({
    transports: [
      new ConsoleTransport({
        name: 'infoTransport',
        level: 'info'
      }),
      new ConsoleTransport({
        name: errorTransportName,
        level: 'error',
        handleExceptions: true,
        humanReadableUnhandledException: true
      })
    ]
  });
  return logger;
}

function initializeLogger(accessLogFileName, errorLogFileName, logsPath) {
  return {
    console: initializeConsoleLogger(),
    file: initializeFileLogger(accessLogFileName, errorLogFileName, logsPath)
  };
}

module.exports = initializeLogger;
