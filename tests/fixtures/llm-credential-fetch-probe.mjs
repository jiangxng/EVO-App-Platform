// Test-only synthetic endpoint. No real Provider traffic or credential output.
import crypto from 'node:crypto';
import {syncBuiltinESMExports} from 'node:module';
let decryptions = 0;
const decipher = crypto.createDecipheriv;
crypto.createDecipheriv = (...args) => {decryptions++; return decipher(...args);};
syncBuiltinESMExports();
const counts = {openai: 0, deepseek: 0};
globalThis.fetch = async (url, init) => {
  const endpoint = new URL(url);
  const provider = endpoint.pathname.split('/')[1];
  if (endpoint.origin !== 'https://llm-credential.invalid' || !(provider in counts)
      || init.method !== 'GET') throw Error('UNEXPECTED_LLM_CREDENTIAL_TEST_FETCH');
  if (!new Headers(init.headers).get('authorization')?.startsWith('Bearer synthetic-')) throw Error('CREDENTIAL_NOT_BOUND_AT_REQUEST');
  counts[provider]++;
  return new Response(JSON.stringify({data: [{id: 'deepseek-flash'}]}), {status: 200});
};
process.on('message', message => {
  if (message?.kind === 'llm-credential-counts') process.send?.({kind: 'llm-credential-counts', id: message.id, counts});
  if (message?.kind === 'llm-credential-decryptions') process.send?.({kind: 'llm-credential-decryptions', id: message.id, decryptions});
});
