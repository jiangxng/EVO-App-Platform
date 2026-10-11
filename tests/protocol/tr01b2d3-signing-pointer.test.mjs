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

test('signer pointer read uses verified file descriptor, never a second pathname open',()=>{
 const source=readFileSync(new URL('../../apps/trading-reference/finance-owner-key-pointer.ts',
   import.meta.url),'utf8');
 assert.match(source,/O_NOFOLLOW/);
 assert.match(source,/fstatSync\(fd\)/);
 assert.match(source,/readFileSync\(fd, 'utf8'\)/);
 assert.doesNotMatch(source,/readFileSync\(file\s*,/);
});

test('signer pointer rejects directories and still permits safe atomic renames',()=>{
 const dir=mkdtempSync(join(tmpdir(),'evo-finance-pointer-fd-'));
 try{
   assert.throws(()=>readFinanceOwnerActiveKeyIdV010(dir),
     /TR01B2D3_SIGNING_POINTER_PERMISSIONS_INVALID/);
   const active=join(dir,'active'),swap=join(dir,'swap');
   writeFileSync(active,'old-key\n',{mode:0o600});
   writeFileSync(swap,'new-key\n',{mode:0o600});
   assert.equal(readFinanceOwnerActiveKeyIdV010(active),'old-key');
   renameSync(swap,active);
   assert.equal(readFinanceOwnerActiveKeyIdV010(active),'new-key');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
