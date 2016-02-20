'use strict';

const chakram = require('chakram');
const expect = chakram.expect;
const path = require('path');

const getSettings = require('../../lib/settings_handler');
const defaultSettings = require('../../lib/default_settings');
const userSettings = require('./test_data/config.json');

describe('Settings handler', () => {
  it('should return the default settings if no flags are given', () => {
    const argv = ['node', 'server.js'];
    const res = getSettings(defaultSettings, argv);

    expect(res).to.deep.equal(defaultSettings);
  });

  it('should use the given config if one was passed with -c', () => {
    const argv = ['node', 'server.js', '-c', 'test/unit/test_data/config.json'];
    const expectedUserSettings = userSettings;
    expectedUserSettings.apiPath = defaultSettings.apiPath;
    expectedUserSettings.dataPath = path.resolve(userSettings.dataPath);

    const res = getSettings(defaultSettings, argv);

    expect(res).to.deep.equal(expectedUserSettings);
  });

  it('should use the given config if one was passed with --config', () => {
    const argv = ['node', 'server.js', '--config=test/unit/test_data/config.json'];
    const expectedUserSettings = userSettings;
    expectedUserSettings.apiPath = defaultSettings.apiPath;
    expectedUserSettings.dataPath = path.resolve(userSettings.dataPath);

    const res = getSettings(defaultSettings, argv);

    expect(res).to.deep.equal(expectedUserSettings);
  });

  it('should ignore -p, --path, --size and --collections if --config is used', () => {
    const argv = ['node', 'server.js', '-p', 20, '--size=100', '--path=bla', '--collections=a', '--config=test/unit/test_data/config.json'];
    const expectedUserSettings = userSettings;
    expectedUserSettings.apiPath = defaultSettings.apiPath;
    expectedUserSettings.dataPath = path.resolve(userSettings.dataPath);

    const res = getSettings(defaultSettings, argv);

    expect(res).to.deep.equal(expectedUserSettings);
  });

  it('should ignore -p, --path, --size and --collections if -c is used', () => {
    const argv = ['node', 'server.js', '-p', 20, '--size=100', '--path=bla', '--collections=a', '-c', 'test/unit/test_data/config.json'];
    const expectedUserSettings = userSettings;
    expectedUserSettings.apiPath = defaultSettings.apiPath;
    expectedUserSettings.dataPath = path.resolve(userSettings.dataPath);

    const res = getSettings(defaultSettings, argv);

    expect(res).to.deep.equal(expectedUserSettings);
  });

  it('should convert the string list into an array list when --collections is used', () => {
    const argv = ['node', 'server.js', '--collections=a,b,c'];

    const res = getSettings(defaultSettings, argv);

    expect(res.collectionNames).to.deep.equal(['a', 'b', 'c']);
  });

  it('should convert the string into an array when --collection is used with one collection', () => {
    const argv = ['node', 'server.js', '--collections=a'];

    const res = getSettings(defaultSettings, argv);

    expect(res.collectionNames).to.deep.equal(['a']);
  });

  it('should use the given port if -p or --port is used', () => {
    const argv1 = ['node', 'server.js', '-p', '20'];
    const argv2 = ['node', 'server.js', '--port=20'];

    const res1 = getSettings(defaultSettings, argv1);
    const res2 = getSettings(defaultSettings, argv2);

    expect(res1.port).to.equal(20);
    expect(res2.port).to.equal(20);
  });

  it('should use the given requestSizeLimit and append "kb" to it if --size is used', () => {
    const argv = ['node', 'server.js', '--size=1'];

    const res = getSettings(defaultSettings, argv);

    expect(res.requestSizeLimit).to.equal('1kb');
  });

  it('should use the given path and resolve it if --path is used', () => {
    const argv = ['node', 'server.js', '--path=my_path'];

    const res = getSettings(defaultSettings, argv);

    expect(res.dataPath).to.equal(path.resolve('my_path'));
  });
});
