// Test-only observation, installed before Host evaluation. No record contents.
import fs from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {syncBuiltinESMExports} from 'node:module';
const target = resolve(process.env.TEST_IDENTITY_DIRECTORY_FILE);
const accesses = [];
function selected(value) {
  try {const path = resolve(value instanceof URL ? fileURLToPath(value) : String(value)); return path === target || path === target + '.tmp';}
  catch {return false;}
}
for (const name of ['readFileSync', 'openSync', 'writeFileSync', 'appendFileSync', 'renameSync', 'unlinkSync']) {
  const original = fs[name];
  fs[name] = (...args) => {
    if (selected(args[0]) || (name === 'renameSync' && selected(args[1]))) {
      accesses.push(name);
      if (process.env.TEST_IDENTITY_DIRECTORY_FORBID === 'true') throw Error('DORMANT_DIRECTORY_FILE_ACCESS:' + name);
    }
    return original(...args);
  };
}
syncBuiltinESMExports();
process.on('message', message => {
  if (message?.kind === 'identity-directory-file-access') process.send?.({id: message.id, accesses});
});
