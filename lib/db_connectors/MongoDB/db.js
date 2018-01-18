'use strict';

const MongoClient = require('mongodb').MongoClient;
const fs = require('fs');
const path = require('path');

const Table = require('./table');
const ChangesTable = require('./changes_table');
const UncommittedChangesTable = require('./uncommitted_changes_table');

function getInitialMeta() {
  // Initial meta data
  return {
    nextClientID: 1,
    tables: [],
  };
}

const metaFileName = 'meta.json';
const changesTableName = 'changes';
const uncommittedTableName = 'uncommittedChanges';

class DB {
  constructor(dbOptions, logger) {
    this.tables = new Map();
    this.dataPath = dbOptions.dataPath || '';
    this.dbOptions = dbOptions;
    this.isInMemory = Boolean(dbOptions.inMemoryOnly);
  }

  _getMongoDbInstance() {
    return new Promise((resolve, reject) => {
      MongoClient.connect(this.dbOptions.url, (err, client) => {
        if (err) {
          reject(err);
        } else {
          resolve(client.db(this.dbOptions.dbName));
        }
      });
    });
  }

  init() {
    return this._loadMetaFile()
        .then((meta) => {
          this.meta = meta;
          return this._getMongoDbInstance();
        })
        .then((db) => {
          this.db = db;
          return this._loadTables(this.dataPath, this.meta.tables, this.dbOptions);
        });
  }

  _loadTables(dataPath, tableNames, dbOptions) {
    tableNames.forEach((tableName) => {
      const tableInstance = new Table(tableName, dbOptions, this.db);
      this.tables
          .set(tableName, tableInstance);
    });
    this.changesTable = new ChangesTable(changesTableName, dbOptions, this.db);
    this.uncommittedChanges = new UncommittedChangesTable(uncommittedTableName, dbOptions, this.db);
  }

  _loadMetaFile() {
    return new Promise((resolve, reject) => {
      const metaFilePath = path.join(this.dataPath, metaFileName);
      if (this.isInMemory) {
        const meta = getInitialMeta();
        return resolve(meta);
      }

      fs.readFile(metaFilePath, { encoding: 'utf8' }, (err, data) => {
        if (err) {
          if (err.code === 'ENOENT') {
            const meta = getInitialMeta();
            resolve(meta);
          } else {
            reject(err);
          }
        } else {
          const meta = JSON.parse(data);
          resolve(meta);
        }
      });
    });
  }

  _updateMeta() {
    if (!this.isInMemory) {
      return new Promise((resolve, reject) => {
        const metaFilePath = path.join(this.dataPath, metaFileName);
        fs.writeFile(metaFilePath, JSON.stringify(this.meta), (err) => {
          if (err) {
            reject();
          }
          resolve();
        });
      });
    }
    return Promise.resolve();
  }

  _addTable(tableName) {
    this.tables.set(tableName, new Table(tableName, this.dbOptions, this.db));
    this.meta.tables.push(tableName);
    return this._updateMeta();
  }

  hasTable(tableName) {
    return this.tables.has(tableName);
  }

  getNextClientID() {
    const nextID = this.meta.nextClientID;
    this.meta.nextClientID = this.meta.nextClientID + 1;
    return this._updateMeta()
        .then(() => {
          return nextID;
        });
  }

  getRevision() {
    return this.changesTable.getLatestRevision();
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
    if (this.hasTable(tableName)) {
      return this.tables.get(tableName).add(key, data);
    }
    return this._addTable(tableName)
        .then(() => {
          return this.tables.get(tableName).add(key, data);
        });
  }

  getData(tableName, key) {
    if (this.hasTable(tableName)) {
      return this.tables.get(tableName).get(key);
    }
    return Promise.resolve();
  }

  updateData(tableName, key, data) {
    return this.tables.get(tableName).update(key, data);
  }

  removeData(tableName, key) {
    return this.tables.get(tableName).remove(key);
  }
}

module.exports = DB;
