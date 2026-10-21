// Observe the original binding store's writes, before project evaluation.
import fs from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {syncBuiltinESMExports} from 'node:module';
const target = resolve(process.env.APP_PLATFORM_APPLICATION_RUNTIME_BINDING_FILE);
const writes = []; let requests = 0;
const matches = path => {
  try {const value = resolve(path instanceof URL ? fileURLToPath(path) : String(path)); return value === target || value === target + '.tmp';}
  catch {return false;}
};
for (const name of ['writeFileSync', 'appendFileSync', 'renameSync', 'unlinkSync']) {
  const original = fs[name];
  fs[name] = (...args) => {
    if (matches(args[0]) || (name === 'renameSync' && matches(args[1]))) {
      writes.push(name);
      if (process.env.APP_PLATFORM_EVO_OBSERVATORY_ENABLED !== 'true') throw Error('DISABLED_EVO_MAP_WRITE:' + name);
    }
    return original(...args);
  };
}
syncBuiltinESMExports();
globalThis.fetch = async () => {requests++; throw Error('UNEXPECTED_EVO_MAP_STARTUP_FETCH');};
process.on('message', message => {
  if (message?.kind === 'evo-map-startup-snapshot') process.send?.({id: message.id, writes, requests});
});
