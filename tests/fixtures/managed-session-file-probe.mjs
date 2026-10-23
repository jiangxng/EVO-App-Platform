// Target only the synthetic Session file; leave all other Host stores intact.
import fs from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {syncBuiltinESMExports} from 'node:module';
const target = resolve(process.env.TEST_MANAGED_SESSION_TARGET);
const attempts = [];
function same(path) {
  try {return resolve(path instanceof URL ? fileURLToPath(path) : String(path)) === target;}
  catch {return false;}
}
for (const name of ['existsSync', 'readFileSync', 'openSync', 'writeFileSync', 'appendFileSync', 'unlinkSync', 'renameSync']) {
  const original = fs[name];
  fs[name] = (...args) => {
    if (same(args[0]) || (name === 'renameSync' && same(args[1]))) {
      attempts.push(name);
      if (process.env.APP_PLATFORM_MANAGED_SESSION_ENABLED !== 'true') throw Error('DISABLED_MANAGED_SESSION_FILE_ACCESS:' + name);
    }
    return original(...args);
  };
}
syncBuiltinESMExports();
process.on('message', message => {
  if (message?.kind === 'managed-session-file-access') process.send?.({id: message.id, attempts});
});
