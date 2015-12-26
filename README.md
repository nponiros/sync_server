# SyncServer

A small node server which uses [NeDB](https://github.com/louischatriot/nedb) to write data to the disk. The server can be used with a client for example [SyncClient](https://github.com/nponiros/sync_client) to save change sets which can later be synchronized with other devices.

## Installation and usage

Install globally using npm:

```bash
npm install -g sync-server
```

You can start the server with:

```bash
sync-server
```

The server will listen per default on port 3000 and save data in your HOME directory under SYNC_SERVER_DATA. The default collection is called _test\_collection_. This is the collection name to use with the [SyncClient](https://github.com/nponiros/sync_client).

You can use the following flags to change the defaults:

```bash
-p number                     # Specify the port number
--path path                   # Specify the path to the data directory. It has to be an absolute path
--collections collectionName  # A comma separated list of collection names in which data is saved. Only names given here can be used in the SyncClient
```
### Node.js Version

You need to use a new version of Node.js as the code uses ES2015 features which are not available in Node.js versions < 5.0.0.

## REST API

### Data upload
Used to upload the change sets. Each changes gets saved in a collection depending on the collectionName attribute in the change object.

* URL: /api/v1/upload
* Method: POST
* Params: JSON with
  * changes:
    * type: Array<ChangeObj>
    * explanation: Array of change object to be saved to disk
* Return: JSON with
  * changeIds:
    * type: Array<String>
    * explanation: Array with the IDs of all objects which where written in the various collections
  * lastUpdateTS:
    * type: Number
    * explanation: Timestamp created with Date.now(). Used by the download operation

### Data download
Used to download new change sets missing from the client. Which changes get downloaded depend on the lastUpdateTS attribute.

* URL: /api/v1/download
* Method: POST
* Params: JSON with
  * lastUpdateTS:
    * type: Number
    * explanation: Timestamp created with Date.now(). Used to distinguish between new and old change sets so we know what to send to the client
  * collectionNames:
    * type: Array<String>
    * explanation: Name of collections in which we want to look for new data
* Return: JSON with
  * changes:
    * type: Array<ChangeObj>
    * explanation: Array of change objects newer than lastUpdateTS

### Online check
Can be used to check if the server is online

* URL: /api/v1/check
* Method: HEAD
* Params: None
* Return: Headers

### ChangeObj

Object with:
* operation:
  * type: ENUM(update | delete),
  * explanation: Used to distinguish between data update and delete. Delete does not actually delete anything in the server database. It is used to delete data in the client database
* changeSet:
  * type: Object
  * explanation: The actual data to be updated. Only relevant for update operations
* collectionName:
  * type: String
  * explanation: The name of the collection in which we want to save the change set
* \_id:
  * type: String
  * explanation: ID of the object we are changing. If used with SyncClient, this ID is the same as the ID in the change set

## Running the tests

The following commands can be execute to run the tests.

```bash
npm install
npm test
```

The last command will run the integration tests for the server. The integration tests will start a [test server](./test/test_server.js) on port 8080 so make sure that port if not in use before running the tests. The server will be stopped automatically after the tests are through.
Coverage results for the unit tests can be found in the coverage directory.

## Contributing

If you feel you can help in any way, be it with documentation, examples, extra testing, or new features please open an [issue](https://github.com/nponiros/sync_server/issues) or [pull request](https://github.com/nponiros/sync_server/pulls).
If you have any questions feel free to open an [issue](https://github.com/nponiros/sync_server/issues) with your question.

## TODO

* Add logging

## License
[MIT License](./LICENSE)
