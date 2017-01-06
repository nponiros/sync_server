'use strict';

const OK_STATUS_TEXT = 'OK';
const OK_STATUS_CODE = 200;
const ERROR_STATUS_TEXT = 'INTERNAL ERROR';
const ERROR_STATUS_CODE = 500;

const CONTENT_TYPE = 'application/json;charset=UTF-8';
const CHAR_SET = 'utf8';

function send(res, content, statusCode, statusText) {
  const data = JSON.stringify(content);
  const dataLength = Buffer.byteLength(data, CHAR_SET);
  const headers = {
    'Content-Length': dataLength,
    'Content-Type': CONTENT_TYPE,
  };
  res.writeHead(statusCode, statusText, headers);
  res.end(data, CHAR_SET);
}

function sendJsonContent(res, content) {
  send(res, content, OK_STATUS_CODE, OK_STATUS_TEXT);
}

function sendError(res, content) {
  send(res, content, ERROR_STATUS_CODE, ERROR_STATUS_TEXT);
}

module.exports = {
  jsonContent: sendJsonContent,
  error: sendError,
};
