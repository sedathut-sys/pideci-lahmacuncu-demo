const url=process.argv[2];
if(!url||!url.startsWith('http://127.0.0.1:4321/pideci-lahmacuncu-demo/'))throw Error('Yalnız yerel Taş Fırın test URL kabul edilir');
const tabs=await (await fetch('http://127.0.0.1:9222/json')).json();
const tab=tabs.find(t=>t.type==='page'&&t.url.startsWith('http://127.0.0.1:4321/pideci-lahmacuncu-demo/'));
if(!tab)throw Error('Yerel Taş Fırın Chrome sekmesi bulunamadı');
const ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});
ws.send(JSON.stringify({id:1,method:'Page.navigate',params:{url}}));
await new Promise((r,j)=>{ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id===1){console.log(JSON.stringify(m.result));r()}};setTimeout(()=>j(Error('navigasyon bekleme süresi doldu')),10000)});ws.close();
