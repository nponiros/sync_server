# SyncServer

[![Code Climate](https://codeclimate.com/github/nponiros/sync_server/badges/gpa.svg)](https://codeclimate.com/github/nponiros/sync_server)

## Synopsis

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

### Default settings

| Setting name      | Value                   | Description                                                                                     |
| ----------------- | ----------------------- | ----------------------------------------------------------------------------------------------- |
| dataPath          | $HOME/SYNC_SERVER_DATA  | Directory in which logs and data are saved                                                                   |
| collectionNames   | ['testCollection']      | The collections available to use with the [SyncClient](https://github.com/nponiros/sync_client) |
| errorLogFileName  | 'error.log'             | File name for the error log. Contains information about exceptions and rejected promises        |
| accessLogFileName | 'access.log'            | File name for the access log. Contains information about the requests made against the server   |
| requestSizeLimit  | '100kb'                 | request size limit for body-parser                                                              |
| port              | 3000                    | Server port                                                                                     |

### CLI Flags

You can use the following flags to change the defaults:

```bash
-c file | --config=file       # JSON configuration file to use. When this flag is used the rest of the CLI Flags are ignored. If settings are missing, the defaults are used
-p number | --port=number     # Specify the port number
--path=path                   # Path to a directory in which to save the data and logfiles. It is relative to the current directory or an absolute path
--collections=collectionName  # A comma separated list of collection names in which data is saved. Only names given here can be used in the SyncClient
--size=number                 # The request size limit for body-parser in KB
--help                        # Shows this info
--version                     # Shows the version of the sync-server
```

### Config file example
```json
{
  "dataPath": "test/integration/test_data",
  "collectionNames": ["testCollection"],
  "errorLogFileName": "error.log",
  "accessLogFileName": "access.log",
  "requestSizeLimit": "100kb",
  "port": 3000
}
```

dataPath is relative to the directory you execute the server in. You could also pass an absolute path for it.

### Node.js Version

You need to use a new version of Node.js as the code uses ES2015 features which are not available in Node.js versions < 4.0.0.

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
    * explanation: Timestamp created with Date.now(). Used to distinguish between new and old change sets so we know what to send to the client. If the timestamp is __null__ or __undefined__ then all change sets are sent.
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

The last command will run the integration tests for the server. The integration tests will start a [test server](./test/test_server.js) on port 8080 so make sure that the port is not in use before running the tests. The server will be stopped automatically after the tests are through.

## Contributing

If you feel you can help in any way, be it with documentation, examples, extra testing, or new features please open an [issue](https://github.com/nponiros/sync_server/issues) or [pull request](https://github.com/nponiros/sync_server/pulls).
If you have any questions feel free to open an [issue](https://github.com/nponiros/sync_server/issues) with your question.

## License
[MIT License](./LICENSE)
