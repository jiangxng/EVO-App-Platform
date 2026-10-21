// Test-only observation before Host evaluation; never records file contents.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {syncBuiltinESMExports} from 'node:module';
const state = resolve(process.env.APP_PLATFORM_SECRETS_FILE);
const key = resolve(process.env.APP_PLATFORM_SECRETS_KEY_FILE);
const targets = new Map([[state, 'state'], [state + '.tmp', 'temporary-state'], [key, 'key']]);
const directories = new Set([dirname(state), dirname(key)]);
const accesses = []; let decryptions = 0;
function label(value, directory = false) {
  try {
    const path = resolve(value instanceof URL ? fileURLToPath(value) : String(value));
    return targets.get(path) ?? (directory && directories.has(path) ? 'directory' : undefined);
  } catch {return undefined;}
}
for (const name of ['existsSync', 'readFileSync', 'openSync', 'writeFileSync', 'appendFileSync', 'chmodSync', 'unlinkSync', 'renameSync', 'mkdirSync']) {
  const original = fs[name];
  fs[name] = (...args) => {
    const target = label(args[0], name === 'mkdirSync') ?? (name === 'renameSync' ? label(args[1]) : undefined);
    if (target) {
      accesses.push({operation: name, target});
      if (process.env.TEST_SECRETS_FORBID_ACCESS === 'true') throw Error('UNQUALIFIED_SECRET_FILE_ACCESS:' + name);
    }
    return original(...args);
  };
}
const decipher = crypto.createDecipheriv;
crypto.createDecipheriv = (...args) => {if (args[0] === 'aes-256-gcm') decryptions++; return decipher(...args);};
syncBuiltinESMExports();
process.on('message', message => {
  if (message?.kind === 'secrets-file-access') process.send?.({id: message.id, accesses, decryptions});
});
