import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const mode=process.argv[2];
if(!['demo','live'].includes(mode)){console.error('Kullanım: node scripts/build-mode.mjs demo|live');process.exit(2);}
const entry=fileURLToPath(new URL('../node_modules/astro/astro.js',import.meta.url));
console.log(`Astro derleme: ${mode==='live'?'D1 API canlı mod':'yerel statik demo modu'}`);
const result=spawnSync(process.execPath,[entry,'build'],{
  stdio:'inherit',env:{...process.env,PUBLIC_DATA_MODE:mode}
});
if(result.error){console.error(result.error.message);process.exit(1);}
process.exit(result.status??1);
