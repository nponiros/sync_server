'use strict';

const OK_STATUS_TEXT = 'OK';
const OK_STATUS_CODE = 200;
const ERROR_STATUS_TEXT = 'INTERNAL ERROR';
const ERROR_STATUS_CODE = 500;

const CONTENT_TYPE = 'application/json;charset=UTF-8';
const CHAR_SET = 'utf8';

function send(res, options) {
  res.writeHead(options.statusCode, options.statusText, options.headers);
  res.end(options.data, CHAR_SET);
}

function sendJsonContent(res, content) {
  const data = JSON.stringify(content);
  const dataLength = Buffer.byteLength(data, CHAR_SET);
  const headers = {
    'Content-Length': dataLength,
    'Content-Type': CONTENT_TYPE
  };
  const options = {
    statusCode: OK_STATUS_CODE,
    statusText: OK_STATUS_TEXT,
    data,
    headers
  };
  send(res, options);
}

function sendError(res, content) {
  const data = JSON.stringify(content);
  const dataLength = Buffer.byteLength(data, CHAR_SET);
  const headers = {
    'Content-Length': dataLength,
    'Content-Type': CONTENT_TYPE
  };
  const options = {
    statusCode: ERROR_STATUS_CODE,
    statusText: ERROR_STATUS_TEXT,
    data,
    headers
  };
  send(res, options);
}

module.exports = {
  jsonContent: sendJsonContent,
  error: sendError
};
