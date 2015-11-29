const OK_STATUS_TEXT = 'OK';
const OK_STATUS_CODE = 200;
const OK_CONTENT_TYPE = 'application/json;charset=UTF-8';
const OK_CHAR_SET = 'utf8';

const NO_CONTENT_STATUS_TEXT = 'No content';
const NO_CONTENT_STATUS_CODE = 204;

function sendJsonContent(res, content) {
  const jsonData = JSON.stringify(content);
  const dataLength = Buffer.byteLength(jsonData, OK_CHAR_SET);
  res.writeHead(OK_STATUS_CODE, OK_STATUS_TEXT, {
    'Content-Length': dataLength,
    'Content-Type': OK_CONTENT_TYPE
  });
  res.end(jsonData, OK_CHAR_SET);
}

function sendNoContent(res) {
  res.writeHead(NO_CONTENT_STATUS_CODE, NO_CONTENT_STATUS_TEXT);
  res.end();
}

function sendError(res, status, data) {
  res.status(status || 500);
  res.end(JSON.stringify(data), 'utf8');
}

module.exports = {
  jsonContent: sendJsonContent,
  noContent: sendNoContent,
  error: sendError
};
