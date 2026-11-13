/** Transpile-only AST checks. Astro build and TypeScript typecheck yerine geçmez. */
import {createRequire} from 'node:module';
import {readdirSync,readFileSync} from 'node:fs';
import {join,extname} from 'node:path';
import {spawnSync} from 'node:child_process';
const require=createRequire(import.meta.url);
let ts;
try{ts=require('typescript');}catch{
  try{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');}
  catch{console.error('Global TypeScript bulunamadı.');process.exit(2);}
}
const root=new URL('../',import.meta.url);
function walk(folder){let result=[];for(const item of readdirSync(folder,{withFileTypes:true})){
  const path=join(folder,item.name);
  if(item.isDirectory()){if(!['node_modules','dist','.wrangler'].includes(item.name))result.push(...walk(path));}
  else if(['.ts','.tsx','.mjs'].includes(extname(path)) && !item.name.endsWith('.d.mts'))result.push(path);
}return result;}
let parsed=0;let broken=0;
for(const path of walk(root.pathname)){
  if(path.endsWith('.mjs')){
    const r=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});
    if(r.status!==0){console.error('SYNTAX ERROR',path,r.stderr);broken++;}else parsed++;
  }else{
    const source=readFileSync(path,'utf8');
    const result=ts.transpileModule(source,{fileName:path,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}});
    const errors=(result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
    if(errors.length){console.error('TSX SYNTAX ERROR',path,errors.map(e=>ts.flattenDiagnosticMessageText(e.messageText,' ')));broken++;}else parsed++;
  }
}
console.log(`${parsed} kaynak dosyası sözdizimi PASS; ${broken} başarısız. (Bağımlılıksız, tür kontrolü ve Astro derlemesi değildir.)`);
if(broken)process.exitCode=1;
