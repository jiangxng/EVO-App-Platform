// Observe original crypto calls before Host imports; no production hooks.
import crypto from 'node:crypto';
import {syncBuiltinESMExports} from 'node:module';
let decryptions = 0, requests = 0;
const decipher = crypto.createDecipheriv;
crypto.createDecipheriv = (...args) => {decryptions++; return decipher(...args);};
syncBuiltinESMExports();
globalThis.fetch = async () => {requests++; throw Error('UNEXPECTED_SEMANTIC_HOST_FETCH');};
process.on('message', message => {
  if (message?.kind === 'semantic-credential-snapshot') process.send?.({id: message.id, decryptions, requests});
});
