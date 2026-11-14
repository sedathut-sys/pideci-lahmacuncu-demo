import {spawnSync} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';

const args=process.argv.slice(2);const get=k=>args[args.indexOf(k)+1];
const adb=get('--adb'),serial=get('--device'),url=get('--url');
if(!adb||!serial||!url)throw Error('Kullanım: --adb PATH --device SERIAL --url TEST_URL [--scope-prefix /proje-yolu/]');
const target=new URL(url);const allowedOrigin=target.origin;const allowedPath=get('--scope-prefix')||'/';
if(target.origin!==allowedOrigin||!target.pathname.startsWith(allowedPath))throw Error('Hedef, izin verilen yerel Taş Fırın test yolu dışında.');
const call=xs=>{const r=spawnSync(adb,['-s',serial,...xs],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr||r.stdout||'ADB başarısız');return r.stdout.trim()};
let forwarded=false,ws;
try{
  call(['forward','tcp:9222','localabstract:chrome_devtools_remote']);forwarded=true;
  const tabs=await (await fetch('http://127.0.0.1:9222/json/list')).json();
  const matches=tabs.filter(t=>t.type==='page'&&t.url.startsWith(`${allowedOrigin}${allowedPath}`));
  if(matches.length!==1)throw Error(`Taş Fırın test sekmesi tekil değil (${matches.length}); gezinme yapılmadı.`);
  ws=new WebSocket(matches[0].webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;setTimeout(()=>reject(Error('Chrome DevTools bağlantısı zaman aşımına uğradı')),5000)});
  let id=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}};
  const cdp=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,resolve);ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>reject(Error(`${method} zaman aşımı`)),8000)});
  await cdp('Page.enable');await cdp('Page.navigate',{url});await delay(1200);
  const m=await cdp('Runtime.evaluate',{expression:'location.href',returnByValue:true});
  const actual=m.result?.result?.value;
  if(actual!==url)throw Error(`URL doğrulanmadı: ${actual}`);
  console.log(JSON.stringify({status:'PASS',navigatedOnlyExistingTab:true,url:actual},null,2));
}finally{try{ws?.close()}catch{};if(forwarded)try{call(['forward','--remove','tcp:9222'])}catch{}}
