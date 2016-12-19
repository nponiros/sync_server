'use strict';

const fs = require('fs');
const path = require('path');

const Table = require('./table');
const ChangesTable = require('./changes_table');

// Initial meta data
const meta = {
  revision: 0,
  nextClientID: 1,
  clients: {}, // Save latest revision of each client here
  tables: [],
};

const metaFileName = 'meta.json';
const changesTableName = 'changes.table';

// TODO: error handling for meta reading/writing
class DB {
  constructor(dbOptions, logger) {
    this.tables = new Map();
    this.dataPath = dbOptions.dataPath;
    this.tableOptions = dbOptions.tables;
    this._loadMetaFile();
    this._loadTables(this.dataPath, this.meta.tables, dbOptions.tables);
  }

  _loadTables(dataPath, tableNames, tableOptions) {
    tableNames.forEach((tableName) => {
      const filename = path.join(dataPath, tableName);
      const tableInstance = new Table(filename, tableOptions);
      this.tables
          .set(tableName, tableInstance);
    });
    this.changesTable = new ChangesTable(path.join(dataPath, changesTableName), tableOptions);
  }

  _updateMeta() {
    const metaFilePath = path.join(this.dataPath, metaFileName);
    fs.writeFileSync(metaFilePath, JSON.stringify(this.meta));
  }

  _loadMetaFile() {
    const metaFilePath = path.join(this.dataPath, metaFileName);
    if (fs.existsSync(metaFilePath)) {
      this.meta = JSON.parse(fs.readFileSync(metaFilePath, { encoding: 'utf8' }));
    } else {
      this.meta = meta;
      this._updateMeta();
    }
  }

  _addTable(tableName) {
    const filename = path.join(this.dataPath, tableName);
    this.tables.set(tableName, new Table(filename, this.tableOptions));
    this.meta.tables.push(tableName);
    this._updateMeta();
  }

  hasTable(tableName) {
    return this.tables.has(tableName);
  }

  // TODO make this async
  getRevision() {
    return this.meta.revision;
  }

  // TODO make this async
  setRevision(rev) {
    this.meta.revision = rev;
    this._updateMeta();
  }

  getNextClientID() {
    const nextID = this.meta.nextClientID;
    this.meta.nextClientID = this.meta.nextClientID + 1;
    this._updateMeta();
    return nextID;
  }

  setClientRevision(clientID, revision) {
    if (this.meta.clients[clientID]) {
      this.meta.clients[clientID].revision = revision;
    } else {
      this.meta.clients[clientID] = {
        revision,
      };
    }
    this._updateMeta();
  }

  addChangesData(data) {
    return this.changesTable.add(data);
  }

  getChangesData(revision, clientID) {
    if (clientID) {
      return this.changesTable.getByRevisionAndClientID(revision, clientID);
    }
    return this.changesTable.getByRevision(revision);
  }

  addData(tableName, key, data) {
    if (this.tables.has(tableName)) {
      return this.tables.get(tableName).add(key, data);
    }
    this._addTable(tableName);
    return this.tables.get(tableName).add(key, data);
  }

  getData(tableName, key) {
    if (this.tables.has(tableName)) {
      return this.tables.get(tableName).get(key);
    }
    return Promise.resolve();
  }

  updateData(tableName, key, data) {
    if (this.tables.has(tableName)) {
      return this.tables.get(tableName).update(key, data);
    }
    return Promise.resolve();
  }

  removeData(tableName, key) {
    if (this.tables.has(tableName)) {
      return this.tables.get(tableName).remove(key);
    }
    return Promise.resolve();
  }
}

module.exports = DB;
