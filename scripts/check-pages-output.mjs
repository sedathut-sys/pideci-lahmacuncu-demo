import {existsSync,readFileSync} from 'node:fs';
import path from 'node:path';
const dist=new URL('../dist/', import.meta.url);
const fail=(why)=>{console.error('HATA: '+why);process.exitCode=1;};
for(const file of ['index.html','panel/index.html','404.html','robots.txt']) {
 const f=new URL(file,dist);
 if(!existsSync(f)) {fail('Eksik dosya: '+file);continue;}
 const text=readFileSync(f,'utf8');
 if(file.endsWith('.html') && !text.includes('<html'))fail('Boş/geçersiz HTML: '+file);
 if(file==='index.html' && !text.includes('noindex'))fail('Demo index kapalı değil');
 if(file==='panel/index.html' && !text.includes('noindex'))fail('Panel index kapalı değil');
}
const html=existsSync(new URL('index.html',dist))?readFileSync(new URL('index.html',dist),'utf8'):'';
if(!html.includes('/pideci-lahmacuncu-demo/'))fail('GitHub Pages base eksik');
if(html.includes('ADMIN_PASSWORD_HASH')||html.includes('D1_DATABASE_ID'))fail('Gizli backend değişkeni dağıtıma girmiş');
if(!process.exitCode)console.log('GitHub Pages statik dosyalar, demo noindex ve base doğrulandı.');
