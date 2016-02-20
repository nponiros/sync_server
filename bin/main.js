#!/usr/bin/env node

'use strict';

const defaultSettings = require('../lib/default_settings.js');
const server = require('../lib/server.js');

const getSettings = require('../lib/settings_handler');

const settings = getSettings(defaultSettings, process.argv);

server.start(settings);
