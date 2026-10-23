// Build-time only. The Host reads JSON and never loads the TypeScript parser.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import ts from 'typescript';
import {auditWebAssetGraph} from './web-asset-graph-audit.mjs';
export const browserEntries = ['manager/app-host-client.js'];
const hash=value=>createHash('sha256').update(value).digest('hex');
export function buildWebAssetManifest({sourceRoot, shellCss, entries=browserEntries}) {
  const graph=auditWebAssetGraph({sourceRoot,entries});
  if(graph.unresolved.length)throw Error('WEB_ASSET_GRAPH_UNRESOLVED: '+JSON.stringify(graph.unresolved));
  // These mechanisms need an explicit resource contract before being admitted.
  for(const file of graph.reachable){
    const ast=ts.createSourceFile(file.path,fs.readFileSync(path.join(sourceRoot,file.path),'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
    function walk(node){
      if((ts.isNewExpression(node)||ts.isCallExpression(node))&&
        ['Worker','SharedWorker','Function','eval','importScripts','require'].includes(node.expression.getText(ast)))throw Error('WEB_ASSET_GRAPH_UNSUPPORTED_LOADER: '+file.path);
      if(ts.isNewExpression(node)&&node.expression.getText(ast)==='URL'&&node.arguments?.some(x=>x.getText(ast).includes('import.meta')))throw Error('WEB_ASSET_GRAPH_RESOURCE_URL_REQUIRES_CONTRACT: '+file.path);
      ts.forEachChild(node,walk);
    }
    walk(ast);
  }
  return {schemaVersion:1,entries,files:graph.reachable,shellCss:{path:'manager/app-host-shell.css',bytes:Buffer.byteLength(shellCss),sha256:hash(shellCss)}};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const sourceRoot=fileURLToPath(new URL('../dist/',import.meta.url));
  const {appHostShellCss}=await import(pathToFileURL(path.join(sourceRoot,'manager/app-host-shell.js')).href);
  const manifest=buildWebAssetManifest({sourceRoot,shellCss:appHostShellCss});
  fs.writeFileSync(path.join(sourceRoot,'web-asset-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log(`Browser archive manifest: ${manifest.files.length} JS files and shell CSS`);
}
