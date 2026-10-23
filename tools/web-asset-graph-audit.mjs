// Read-only diagnostic, not an archive allowlist. TypeScript is a build-time dependency.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import ts from 'typescript';

export function auditWebAssetGraph({sourceRoot, entries=['manager/app-host-client.js']}) {
  const root=path.resolve(sourceRoot), seen=new Set(), pending=[...entries], unresolved=[];
  const digest=file=>({path:file,bytes:fs.statSync(path.join(root,file)).size,sha256:createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')});
  while(pending.length){
    const file=pending.pop();if(seen.has(file))continue;
    if(path.isAbsolute(file)||file.split('/').includes('..'))throw Error('AUDIT_ENTRY_OUTSIDE_ROOT');
    seen.add(file);
    const source=fs.readFileSync(path.join(root,file),'utf8');
    const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
    if(ast.parseDiagnostics.length)throw Error('AUDIT_INVALID_JS: '+file);
    function add(node){
      if(!node||!ts.isStringLiteralLike(node)){unresolved.push({file,kind:'computed-import',expression:node?.getText(ast)??''});return;}
      const spec=node.text;
      if(!spec.startsWith('.')){unresolved.push({file,kind:'external-import',specifier:spec});return;}
      const target=path.posix.normalize(path.posix.join(path.posix.dirname(file),spec));
      if(target.startsWith('../')||!target.endsWith('.js')||!fs.existsSync(path.join(root,target))){unresolved.push({file,kind:'unresolved-relative',specifier:spec});return;}
      pending.push(target);
    }
    function walk(node){
      if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier)add(node.moduleSpecifier);
      if(ts.isCallExpression(node)&&node.expression.kind===ts.SyntaxKind.ImportKeyword)add(node.arguments[0]);
      ts.forEachChild(node,walk);
    }
    walk(ast);
  }
  const all=[];
  function inventory(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const file=path.join(dir,entry.name);
    if(entry.isDirectory())inventory(file);
    else if(entry.isFile()&&entry.name.endsWith('.js'))all.push(path.relative(root,file).split(path.sep).join('/'));
  }}
  inventory(root);all.sort();
  const reachable=[...seen].sort().map(digest), outside=all.filter(file=>!seen.has(file)).map(digest);
  return {entries,scope:'Static imports, re-exports and literal dynamic imports from declared roots only. Does not execute modules. Excludes CSS/HTML, iframe documents, workers, eval, computed resource URLs, network responses and independently loaded roots. Not a deletion allowlist or production performance result.',
    totalJavaScript:{files:all.length,bytes:[...reachable,...outside].reduce((n,f)=>n+f.bytes,0)},
    reachableJavaScript:{files:reachable.length,bytes:reachable.reduce((n,f)=>n+f.bytes,0)},
    unresolved,reachable,outsideEntryGraph:outside};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const output=process.argv[2];if(!output)throw Error('Usage: node tools/web-asset-graph-audit.mjs <report.json> [dist-root]');
  const repo=fileURLToPath(new URL('../',import.meta.url));
  const report={schemaVersion:1,measuredAt:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),node:process.version,
    ...auditWebAssetGraph({sourceRoot:process.argv[3]??path.join(repo,'dist')})};
  fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({total:report.totalJavaScript,reachable:report.reachableJavaScript,unresolved:report.unresolved},null,2));
}
