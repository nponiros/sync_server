const fs = require('fs');
const path = require('path');

module.exports = function readCertificates(dataPath, tlsSettings) {
  const pfx = tlsSettings.pfx;
  const key = tlsSettings.key;
  const cert = tlsSettings.cert;

  if (cert && key) {
    return {
      key: fs.readFileSync(path.join(dataPath, key)),
      cert: fs.readFileSync(path.join(dataPath, cert)),
    };
  } else if (pfx) {
    return {
      pfx: fs.readFileSync(path.join(dataPath, pfx)),
    };
  }
  throw new Error('No certificates provided');
};
