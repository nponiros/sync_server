# SyncServer

[![Code Climate](https://codeclimate.com/github/nponiros/sync_server/badges/gpa.svg)](https://codeclimate.com/github/nponiros/sync_server)

## Synopsis

A small node server which uses [NeDB](https://github.com/louischatriot/nedb) to write data to the disk. The server can be used with a client for example [SyncClient](https://github.com/nponiros/sync_client) to save change sets which can later be synchronized with other devices. The server was made to work with the [ISyncProtocol](https://github.com/dfahlander/Dexie.js/wiki/Dexie.Syncable.ISyncProtocol) and [Dexie.Syncable](https://www.npmjs.com/package/dexie-syncable). It supports the poll pattern using AJAX and the react pattern using [nodejs-websocket](https://www.npmjs.com/package/nodejs-websocket).

## Installation and usage

Install globally using npm:

```bash
npm install -g sync-server
```

Before using the server it has to be initialized with:

```bash
sync-server init
```

The `init` action must be executed in an empty directory which will later be used to store the data. This folder represents a Database. During initialization a `config.json` file is create with the default server configuration.

You can start the server with:

```bash
sync-server --path INIT/DIRECTORY/PATH
```

The `--path` flag must be given the path to the directory in which `init` was called.

### Default settings

These settings are written in a file called `config.json` in the directory in which `init` was called. The config file is split into 4 sections: `db`, `logging`, `server`,  and `sync`.

#### db

| Setting name      | Value                   | Description                                                                                                    |
| ----------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| connector         | 'NeDB'                  | The database used to store the data. Currently only [NeDB](https://github.com/louischatriot/nedb) is supported |
| opts              | {}                      | Options for the database. These depend on the selected connector                                               |

__NeDB Options__

The `sync-server` supports the following NeDB options:

* inMemoryOnly
* timestampData
* corruptAlertThreshold

The [NeDB README](https://github.com/louischatriot/nedb#creatingloading-a-database) contains more information about these options.

#### logging

| Setting name      | Value                   | Description                                                                                     |
| ----------------- | ----------------------- | ----------------------------------------------------------------------------------------------- |
| errorLogFileName  | "error.log"             | File name for the error log. Contains information about exceptions and rejected promises        |
| accessLogFileName | "access.log"            | File name for the access log. Contains information about the requests made against the server   |

#### server

| Setting name      | Value                   | Description                                                                                          |
| ----------------- | ----------------------- | ---------------------------------------------------------------------------------------------------- |
| requestSizeLimit  | "100kb"                 | Request size limit for [body-parser](https://www.npmjs.com/package/body-parser)                      |
| port              | 3000                    | Server port. Must be a non-privileged port                                                           |
| protocol          | "http"                  | Protocol used by the server. "http", "https", "ws" or "wss"                                          |
| https             | {}                      | This object contains the paths for the files needed by https                                         |
| wss               | {}                      | This object contains the paths for the files needed by wss                                           |
| cors              | {}                      | You can use this object to configure [CORS](https://github.com/expressjs/cors#configuration-options) |

#### sync

| Setting name      | Value                   | Description                                                                                           |
| ----------------- | ----------------------- | ----------------------------------------------------------------------------------------------------- |
| partialsThreshold | 1000                    | If we have more than 1000 changes to send to the client, send only the first 1000 and `partial: true` |


### Node.js Version

You need to use a new version of Node.js as the code uses ES2015 features which are not available in Node.js versions < 6.0.0.

## Caveat

In case the server encounters an `uncaughtException` or an `unhandledRejection` it will write to the log and exit with status code 1. This should normally not happen, if it does happen please open an [issue](https://github.com/nponiros/sync_server/issues) with the information from the error log.

## Protocols

The server supports 4 different protocols: `http`, `https`, `ws` and `wss`. The `http` and `https` protocols can be used for the poll pattern where the server and client communicate via HTTP requests. The `ws` and `wss` protocols can be used for the react pattern where server and client communicate via WebSockets. Per default the `http` protocol is used. For `https` and `wss` you have to at least provide certificates. See below on how to configure those.

### Configuring HTTPS

In order to use HTTPS you need to set the `protocol` to `"https"` and add paths for the certificate in the `https` object. The attributes `key` and `cert` or for `pfx` are required. For example:

```json
{
  "server": {
    "protocol": "https",
    "https": {
      "key": "key_filename.pem",
      "cert": "cert_filename.pem"
    }
  }
}
```

The files must be in the same directory as the server's config file. You can also specify other options allowed by Node.js for a https server.

### Configuring WebSockets (WS)

In order to use WebSockets you need to set the `protocol` to `"ws"`.

### Configuring Secure WebSockets (WSS)

In order to use WSS you need to set the `protocol` to `"wss"` and add paths for the certificate in the `wss` object. The attributes `key` and `cert` or for `pfx` are required. For example:

```json
{
  "server": {
    "protocol": "wss",
    "wss": {
      "key": "key_filename.pem",
      "cert": "cert_filename.pem"
    }
  }
}
```

The files must be in the same directory as the server's config file. You can also specify other options allowed by Node.js for a tls server and options allowed by nodejs-websocket.

## API for the poll pattern

### Synchronization

* URL: `/`
* Method: `POST`
* ContentType: `application/json`. This header must be set, otherwise the server will not be able to parse the data
* Params: JSON with
  * baseRevision: number (It is set to `0` if it is not defined)
  * changes: Array<ChangeObj> (The [ChangeObj](#changeobj) is described below) 
  * clientIdentity: number (The server generates one if it is not defined)
  * syncedRevision: number (It is set to `0` if it is not defined)
  * requestId: any
  * partial: boolean (If `true` this is a partial synchronization. Default is `false`)
* Return: JSON object
  * If the synchronization was successful
    * success: true
    * changes: Array<ChangeObj> (The [ChangeObj](#changeobj) is described below)
    * currentRevision: number
    * clientIdentity: number (The newly generated clientIdentity or the one that was provided by the client)
    * partial: boolean (This is a partial synchronization. The `partialsThreshold` number defines when we only send a partial synchronization)
    * requestId: any (requestId sent by the client)
  * If the synchronization failed
    * success: false
    * errorMessage: string
    * requestId: any (requestId sent by the client)
  * In both cases the status code is set to 200

### Online check

Can be used to check if the server is online.

* URL: `/check`
* Method: `HEAD`
* Params: None
* Return: Headers

## API for the react pattern

Currently the WebSocket server only supports sending and receiving text messages. Binary is not supported.

__Request Messages__

The server can receive 3 message types: `clientIdentity`, `subscribe` and `changes`.

__Response Messages__

The server can respond with 4 message types: `clientIdentity`, `ack`, `changes` and `error`.
 
### Requests

#### clientIdentity

This must be the first message sent.

* Params: JSON with
  * type: "clientIdentity"
  * clientIdentity: number (The server generates one if it is not defined)
* Server responds with `clientIdentity`

#### subscribe

This must be the second message sent. It is needed to setup callbacks to inform the client about changes made by other clients.
You need to wait on the `clientIdentity` response before subscribing to make sure that the server saved the clientIdentity.

* Params: JSON with
  * type: "subscribe"
  * syncedRevision: number (It is set to `0` if it is not defined)
* Server responds with `changes` or `error`

#### changes

* Params: JSON with
  * type: "changes"
  * baseRevision: number (It is set to `0` if it is not defined)
  * changes: Array<ChangeObj> (The [ChangeObj](#changeobj) is described below)
  * partial: boolean (If `true` this is a partial synchronization. Default is `false`)
  * requestId: any
* Server responds with `ack` or `error`
* This event would trigger a `changes` or `error` message for all other connected clients

### Responses

#### ack

* Params: JSON object
  * type: "ack"
  * requestId: any (The ID sent by the client)

#### clientIdentity

* Params: JSON object
  * type: "clientIdentity"
  * clientIdentity: number (The newly generated clientIdentity or the one that was provided by the client)

#### changes

* Params: JSON object
  * type: "changes"
  * changes: Array<ChangeObj> (The [ChangeObj](#changeobj) is described below)
  * currentRevision: number
  * partial: boolean (This is a partial synchronization. The `partialsThreshold` number defines when we only send a partial synchronization)

#### error

* Params: JSON
  * type: "error"
  * errorMessage: string
  * requestId: any (Only sent if the `changes` request caused an error)

## ChangeObj

There are 3 types of `ChangeObj`. See also [Dexie.Syncable.IDatabaseChange](https://github.com/dfahlander/Dexie.js/wiki/Dexie.Syncable.IDatabaseChange)

__CREATE__

Object with:
* type: 1
* obj: Object (The object to add to the database. Must also contain the `key`, but does not have to use the `key` property )
* key: any (The unique ID of the object. Is also contained in `obj`)
* table: string (The name of the table to which the object belongs to)

__UPDATE__

Object with:
* type: 2
* mods: Object (Contains only the modifications made to the object with the given `key`)
* key: any (The unique ID of the object. Is also contained in `obj`)
* table: string (The name of the table to which the object belongs to)

__DELETE__

Object with:
* type: 3
* key: any (The unique ID of the object we want to delete)
* table: string (The name of the table to which the object belongs to)

## Running the tests

The following commands can be execute to run the tests.

```bash
npm install
npm test
```

## TODO

* cleanup changes table -> Can only do that after Dexie.Syncable supports the clear flag
* Add E2E tests

## Contributing

If you feel you can help in any way, be it with documentation, examples, extra testing, or new features please open an [issue](https://github.com/nponiros/sync_server/issues) or [pull request](https://github.com/nponiros/sync_server/pulls).
If you have any questions feel free to open an [issue](https://github.com/nponiros/sync_server/issues) with your question.

## License

[MIT License](./LICENSE)

Most files in the `sync` directory where copied from the [Dexie Websockets Sample](https://github.com/dfahlander/Dexie.js/blob/master/samples/remote-sync/websocket/WebSocketSyncServer.js) and are under the [Apache 2 license](./Apache_License). Look at the individual file for more details.
