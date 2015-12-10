#!/usr/bin/env node

'use strict';

const settings = require('../lib/settings.js');
const server = require('../lib/server.js');

server.start(settings);
