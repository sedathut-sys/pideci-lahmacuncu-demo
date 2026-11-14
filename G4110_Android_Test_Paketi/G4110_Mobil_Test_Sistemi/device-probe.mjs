import {execFileSync} from 'node:child_process';
const adb='C:/Android/Sdk/platform-tools/adb.exe',serial=process.argv[2];
if(!serial) throw Error('Pass an authorized ADB serial as argument.');
const call=a=>execFileSync(adb,['-s',serial,...a],{encoding:'utf8'}).trim();
call(['forward','tcp:9222','localabstract:chrome_devtools_remote']);
let ws;
try{
const tabs=await(await fetch('http://127.0.0.1:9222/json/list')).json();const t=tabs.filter(x=>x.type==='page'&&x.url==='http://127.0.0.1:4321/pideci-lahmacuncu-demo/panel/');if(t.length!==1)throw Error('Test panel sekmesi tekil değil');
ws=new WebSocket(t[0].webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});let id=0;const p=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&p.has(m.id)){p.get(m.id)(m);p.delete(m.id)}};
const send=(method,params={})=>new Promise(r=>{const n=++id;p.set(n,r);ws.send(JSON.stringify({id:n,method,params}))});
const ev=async()=>{const m=await send('Runtime.evaluate',{expression:`(()=>{const e=document.querySelector('input[aria-label="Menüde görünen satış fiyatı"]'),r=e?.getBoundingClientRect();return {inner:{w:innerWidth,h:innerHeight},visual:{h:visualViewport?.height,top:visualViewport?.offsetTop},active:{tag:document.activeElement?.tagName,label:document.activeElement?.getAttribute('aria-label')},price:{value:e?.value,x:r?.x,y:r?.y,w:r?.width,h:r?.height,cx:r?.x+r?.width/2,cy:r?.y+r?.height/2}}})()` ,returnByValue:true});return m.result?.result?.value};
const before=await ev();if(!before.price?.cx)throw Error('Fiyat alanı bulunamadı');await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:before.price.cx,y:before.price.cy,id:1}]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await new Promise(r=>setTimeout(r,800));const after=await ev();console.log(JSON.stringify({before,after,ime:call(['shell','dumpsys','input_method']).split(/\r?\n/).filter(x=>/mInputShown|mServedView|show|visible/i.test(x)).slice(0,12)},null,2));
}finally{try{ws?.close()}catch{};try{call(['forward','--remove','tcp:9222'])}catch{}}
