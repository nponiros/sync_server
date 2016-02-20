'use strict';

const fs = require('fs');
const path = require('path');
const minimist = require('minimist');

const pjson = require('../package.json');

function showHelp() {
  const help = `
    sync-server [OPTIONS]

    -c file | --config=file       # JSON configuration file to use. When this flag is used the rest of the CLI Flags are ignored. If settings are missing, the defaults are used
    -p number | --port=number     # Specify the port number
    --path=path                   # Path to a directory in which to save the data and logfiles. It is relative to the current directory or an absolute path
    --collections=collectionName  # A comma separated list of collection names in which data is saved. Only names given here can be used in the SyncClient
    --size=number                 # The request size limit for body-parser in KB
    --help                        # Shows this info
    --version                     # Shows the version of the sync-server
  `;
  console.log(help);
}

function showVersion() {
  console.log(`Version: ${pjson.version}`);
}

function readConfigFile(filePath) {
  const resolvedPath = path.resolve(filePath);
  try {
    const contents = fs.readFileSync(resolvedPath, {encoding: 'UTF8'});
    const settings = JSON.parse(contents);
    settings.dataPath = settings.dataPath && path.resolve(settings.dataPath);
    return settings;
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
  return {};
}

function mergeSettings(defaultSettings, userSettings) {
  const settings = {
    apiPath: defaultSettings.apiPath,
    port: userSettings.port || defaultSettings.port,
    dataPath: userSettings.dataPath || defaultSettings.dataPath,
    collectionNames: userSettings.collectionNames || defaultSettings.collectionNames,
    accessLogFileName: userSettings.accessLogFileName || defaultSettings.accessLogFileName,
    errorLogFileName: userSettings.errorLogFileName || defaultSettings.errorLogFileName,
    requestSizeLimit: userSettings.requestSizeLimit || defaultSettings.requestSizeLimit
  };
  return settings;
}

function convertCLIArgsToSettingsObject(argv) {
  const settings = {
    port: argv.p || argv.port,
    dataPath: argv.path && path.resolve(argv.path),
    collectionNames: argv.collections && argv.collections.split(','),
    requestSizeLimit: argv.size && argv.size + 'kb'
  };
  return settings;
}

function getSettings(defaultSettings, argv) {
  argv = minimist(argv.slice(2));
  if (argv.help) {
    showHelp();
    process.exit(0);
  }

  if (argv.version) {
    showVersion();
    process.exit(0);
  }

  if (argv.c || argv.config) {
    const userSettings = readConfigFile(argv.c || argv.config);
    return mergeSettings(defaultSettings, userSettings);
  }

  return mergeSettings(defaultSettings, convertCLIArgsToSettingsObject(argv));
}

module.exports = getSettings;
