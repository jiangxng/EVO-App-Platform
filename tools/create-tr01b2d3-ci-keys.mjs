#!/usr/bin/env node
/** Creates CI-only, ephemeral Ed25519 trust for *the original seeded EVO DB*.
 * The private key never enters repository content or job logs.
 */
import { generateKeyPairSync } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { createDatabase } from '../evo/dist/platform/database/src/index.js';
const database=createDatabase(process.env.DATABASE_URL);
try {
 const tenant=await database.db.selectFrom('enterprise')
  .select('id').where('code','=','EVO_DEMO').executeTakeFirstOrThrow();
 const {privateKey,publicKey}=generateKeyPairSync('ed25519');
 writeFileSync('/tmp/tr01b2d3-host-signing-key.pem',
   privateKey.export({type:'pkcs8',format:'pem'}),{mode:0o600});
 const config={
   installationId:'tr01b2d3-ci-finance-owner',
   issuer:'app-platform-tr01b2d3-ci-host',
   keyId:'tr01b2d3-ephemeral-1',
   publicKeyPem:publicKey.export({type:'spki',format:'pem'}).toString(),
   hostEnterpriseId:'host-ci-enterprise',
   contextId:'host-ci-enterprise-context',
   evoEnterpriseId:tenant.id,enabled:true
 };
 writeFileSync('/tmp/tr01b2d3-evo-trust.json',
  JSON.stringify([config]),{mode:0o600});
 writeFileSync('/tmp/tr01b2d3-host-install.json',
  JSON.stringify({ ...config,active:true,
   endpoint:'http://127.0.0.1:3000/api/v1/plugins/trading-finance/readonly-verifications'
  }),{mode:0o600});
 console.log('TR01B2D3_EPHEMERAL_OWNER_INSTALLATION_READY');
}finally{await database.destroy();}
