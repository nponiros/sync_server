'use strict';

const NeDBDataStore = require('nedb');

class ChangesTable {
  constructor(name, dbOptions) {
    const options = {
      filename: name,
      autoload: true,
    };
    this.store = new NeDBDataStore(Object.assign({}, options, dbOptions));
    this.dotReplacer = '__DOT__';
  }

  _replaceObjectKeys(obj, originalString, replaceString) {
    return Object.keys(obj).reduce((newObj, key) =>
      Object.assign(newObj, { [key.replace(originalString, replaceString)]: obj[key] }),
      {}
    );
  }

  add(changeObject) {
    // NeDB does not support dots in an object attribute
    // Dexie.Syncable could send mods with dots in the attribute names so
    // we need to replace the dots here
    let mods = changeObject.mods;
    if (mods) {
      mods = this._replaceObjectKeys(mods, '.', this.dotReplacer);
      Object.assign(changeObject, { mods });
    }

    return new Promise((resolve, reject) => {
      this.store.insert(changeObject, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  getLatestRevision() {
    return new Promise((resolve, reject) => {
      const query = {};
      return this.store.find(query).sort({ rev: 1 }).exec((err, result) => {
        if (err) {
          reject(err);
        } else {
          const rev = result[result.length - 1] ? result[result.length - 1].rev : 0;
          resolve(rev);
        }
      });
    });
  }

  getByRevision(revisionNumber) {
    return new Promise((resolve, reject) => {
      const query = {
        rev: {
          $gt: revisionNumber,
        },
      };
      return this.store.find(query, { _id: 0, rev: 0 }).sort({ rev: 1 }).exec((err, result) => {
        if (err) {
          reject(err);
        } else {
          // See comment in add method
          const resultWithDots = result.map((res) => {
            if (res.mods) {
              const newMods = this._replaceObjectKeys(res.mods, this.dotReplacer, '.');
              Object.assign(res, { mods: newMods });
            }
            return res;
          });
          resolve(resultWithDots);
        }
      });
    });
  }

  // Revision (rev) needs to be sent back to the sync handler
  // so it knows what the currentRevision for a client is
  getByRevisionAndClientID(revisionNumber, clientID) {
    return new Promise((resolve, reject) => {
      const query = {
        rev: {
          $gt: revisionNumber,
        },
        source: {
          $ne: clientID,
        },
      };
      return this.store.find(query, { _id: 0, source: 0 }).sort({ rev: 1 }).exec((err, result) => {
        if (err) {
          reject(err);
        } else {
          // See comment in add method
          const resultWithDots = result.map((res) => {
            if (res.mods) {
              const newMods = this._replaceObjectKeys(res.mods, this.dotReplacer, '.');
              Object.assign(res, { mods: newMods });
            }
            return res;
          });
          resolve(resultWithDots);
        }
      });
    });
  }
}

module.exports = ChangesTable;
