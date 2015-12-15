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
    const query = {
      lastUpdateTS: {
        $gt: lastUpdateTS
      }
    };
    const projection = {
      lastUpdateTS: 0
    };
    return this.datastore.find(query, projection);
  }
}

module.exports = Collection;
