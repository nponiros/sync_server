'use strict';

class Collection {
  constructor(datastore) {
    this.datastore = datastore;
  }

  save(changeObject, lastUpdateTS) {
    changeObject.lastUpdateTS = lastUpdateTS;
    return this.datastore.save(changeObject);
  }

  find(lastUpdateTS) {
    const projection = {
      lastUpdateTS: 0
    };

    if (lastUpdateTS) {
      const query = {
        lastUpdateTS: {
          $gt: lastUpdateTS
        }
      };
      return this.datastore.find(query, projection);
    } else {
      return this.datastore.find({}, projection);
    }
  }
}

module.exports = Collection;
