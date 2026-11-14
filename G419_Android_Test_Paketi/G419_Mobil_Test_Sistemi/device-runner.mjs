#!/usr/bin/env node
import {execFileSync} from 'node:child_process';
import {resolve,join,basename} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
const get=(k,d)=>{const i=process.argv.indexOf(k);return i<0?d:process.argv[i+1]};
const url=get('--url','');
const out=resolve(get('--out','./G419_Test_Kanitlari'));
const adb=resolve(get('--adb','C:/Android/Sdk/platform-tools/adb.exe'));
if(!url||!/^https?:\/\//.test(url))throw Error('Kullanım: node device-runner.mjs --url <Chrome sekme URL> --out <kanıt klasörü>');
const call=(args,encoding='utf8')=>execFileSync(adb,args,{encoding,stdio:['ignore','pipe','pipe']});
call(['forward','tcp:9222','localabstract:chrome_devtools_remote']);
try{
  const tabs=await(await fetch('http://127.0.0.1:9222/json')).json();
  const tab=tabs.find(t=>t.type==='page'&&t.url===url);
  if(!tab)throw Error('Chrome’da hedef URL açık değil. Kişisel sekmeler otomatik açılmaz veya değiştirilmez.');
  const ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});
  const metrics=await new Promise((resolve,reject)=>{ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id===1)resolve(m.result?.result?.value)};ws.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{expression:'({url:location.href,title:document.title,viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},screen:{width:screen.width,height:screen.height}})',returnByValue:true}}));setTimeout(()=>reject(Error('CDP bekleme süresi doldu')),5000)});
  ws.close();await mkdir(out,{recursive:true});
  const name=basename(get('--name','android-screen.png'));
  const devicePath=`/sdcard/${name}`;
  call(['shell','screencap','-p',devicePath]);
  call(['pull',devicePath,join(out,name)]);
  call(['shell','rm',devicePath]);
  await writeFile(join(out,name.replace(/\.png$/i,'.json')),JSON.stringify({kind:'Gerçek Android Chrome',...metrics,screenshot:name},null,2),'utf8');
  console.log(JSON.stringify({metrics,screenshot:join(out,name)},null,2));
}finally{try{call(['forward','--remove','tcp:9222'])}catch{}}
