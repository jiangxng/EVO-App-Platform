import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, chmodSync, symlinkSync, rmSync, renameSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readFinanceOwnerActiveKeyIdV010 } from
  '../../dist/apps/trading-reference/finance-owner-key-pointer.js';

test('operator finance signer pointer switches atomically, never caches the former key',()=>{
 const dir=mkdtempSync(join(tmpdir(),'evo-finance-pointer-'));
 try{
  const path=join(dir,'active');
  writeFileSync(path,'key-one\n',{mode:0o600});
  assert.equal(readFinanceOwnerActiveKeyIdV010(path),'key-one');
  const next=join(dir,'new');
  writeFileSync(next,'key-two\n',{mode:0o600});
  renameSync(next,path);
  assert.equal(readFinanceOwnerActiveKeyIdV010(path),'key-two');
  rmSync(path);
  assert.throws(()=>readFinanceOwnerActiveKeyIdV010(path),
   /TR01B2D3_SIGNING_POINTER_UNAVAILABLE/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('signer pointer rejects malformed, symlinked or externally readable operator files',()=>{
 const dir=mkdtempSync(join(tmpdir(),'evo-finance-pointer-bad-'));
 try{
  const path=join(dir,'active'),alias=join(dir,'alias');
  for(const bad of ['','  key','key   \n','key\nmore','key/escape','key'.repeat(150)]){
   writeFileSync(path,bad,{mode:0o600});
   assert.throws(()=>readFinanceOwnerActiveKeyIdV010(path),
    /TR01B2D3_SIGNING_POINTER_INVALID/);
  }
  writeFileSync(path,'safe-key\n',{mode:0o600});
  symlinkSync(path,alias);
  assert.throws(()=>readFinanceOwnerActiveKeyIdV010(alias),
   /TR01B2D3_SIGNING_POINTER_PERMISSIONS_INVALID/);
  if(process.platform!=='win32'){
   chmodSync(path,0o644);
   assert.throws(()=>readFinanceOwnerActiveKeyIdV010(path),
    /TR01B2D3_SIGNING_POINTER_PERMISSIONS_INVALID/);
  }
 }finally{rmSync(dir,{recursive:true,force:true});}
});
