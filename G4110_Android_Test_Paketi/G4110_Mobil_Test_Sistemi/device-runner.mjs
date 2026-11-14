#!/usr/bin/env node
import {execFileSync} from 'node:child_process';
import {basename,join,resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';

const arg=(k,d='')=>{const i=process.argv.indexOf(k);return i<0?d:process.argv[i+1]};
const url=arg('--url');const panelUrl=arg('--panel-url',url);const serial=arg('--device');
const adb=resolve(arg('--adb','C:/Android/Sdk/platform-tools/adb.exe'));
const out=resolve(arg('--out','./G4110_Test_Kanitlari'));
const configPath=resolve(arg('--config',join(import.meta.dirname,'scenarios/tas-firin.json')));
const scenario=arg('--scenario','panel');
if(!url||!panelUrl||!serial)throw Error('Gerekli seçenekler: --url --panel-url --device --out');
const config=JSON.parse(await(await import('node:fs/promises')).readFile(configPath,'utf8'));
const call=(args,encoding='utf8')=>execFileSync(adb,['-s',serial,...args],{encoding,stdio:['ignore','pipe','pipe']});
const result={kind:'Gerçek Android Chrome',device:'Android USB cihazı (seri kimliği redakte edildi)',targetUrl:url,scenario,status:'BELİRSİZ',checks:[],evidence:[],mutationsAllowed:false};
const pngOk=buf=>buf.length>24&&buf.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
await mkdir(out,{recursive:true});
let forwarded=false,ws;
const png=async name=>{const remote=`/sdcard/${name}`;call(['shell','screencap','-p',remote]);const dest=join(out,basename(name));call(['pull',remote,dest]);call(['shell','rm',remote]);const b=await import('node:fs/promises').then(fs=>fs.readFile(dest));if(!pngOk(b))throw Error(`Geçersiz PNG: ${name}`);result.evidence.push(dest);return dest};
const failClosed=async reason=>{result.status='BELİRSİZ';result.reason=reason;await writeFile(join(out,'android-results.json'),JSON.stringify(result,null,2),'utf8');console.log(JSON.stringify(result,null,2));process.exit(0)};
try{
  const connected=call(['devices','-l']);if(!new RegExp(`^${serial}\\s+device\\b`,'m').test(connected))await failClosed('ADB cihazı hazır/izinli değil.');
  const focus=call(['shell','dumpsys','window']);if(!/mCurrentFocus=.*com\.android\.chrome\//.test(focus))await failClosed('Chrome önde değil; uygulama başlatma veya bildirim perdesine dokunma yapılmadı.');
  call(['forward','tcp:9222','localabstract:chrome_devtools_remote']);forwarded=true;
  const tabs=await(await fetch('http://127.0.0.1:9222/json')).json();
  const target=tabs.find(t=>t.type==='page'&&t.url===url);
  if(!target)await failClosed('Belirtilen test URL’si açık Chrome sekmelerinde bulunamadı.');
  ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;setTimeout(()=>j(Error('CDP timeout')),5000)});
  let seq=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}};
  const cdp=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,resolve);ws.send(JSON.stringify({id,method,params}));setTimeout(()=>reject(Error(method+' timeout')),8000)});
  const evaluate=async expression=>{const m=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(m.error)throw Error(JSON.stringify(m.error));return m.result?.result?.value};
  const touch=async(x,y)=>{await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1} ]});await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})};
  const swipe=async(x,yStart,yEnd)=>{await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:yStart,id:1}]});for(let i=1;i<=8;i++){await new Promise(r=>setTimeout(r,35));await cdp('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:yStart+(yEnd-yStart)*i/8,id:1}]})}await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})};
  const bounds=async selector=>evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,centerX:r.x+r.width/2,centerY:r.y+r.height/2,text:e.innerText?.trim()||e.getAttribute('aria-label')||''}})()`);
  const metrics=await evaluate('({viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},screen:{width:screen.width,height:screen.height}})');
  const physical=call(['shell','wm','size']).match(/(\d+)x(\d+)/);result.deviceMetrics={...metrics,physicalPixels:physical?`${physical[1]}x${physical[2]}`:null,density:call(['shell','wm','density']).trim()};
  await png(`g4110-${scenario}-initial.png`);
  if(scenario==='panel'){
    const locateCard=()=>evaluate(`(()=>{const cards=[...document.querySelectorAll(${JSON.stringify(config.selectors.productCards)})];const c=cards.find(x=>x.innerText.includes(${JSON.stringify(config.productName)}));if(!c)return null;const b=c.querySelector(${JSON.stringify(config.selectors.editButton)});if(!b)return null;const r=b.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,centerX:r.x+r.width/2,centerY:r.y+r.height/2}})()`);
    let card=await locateCard();
    for(let n=0;n<8&&card&&(card.y<0||card.y+card.h>metrics.viewport.height);n++){await swipe(metrics.viewport.width/2,metrics.viewport.height*.78,metrics.viewport.height*.28);await new Promise(r=>setTimeout(r,350));card=await locateCard()}
    if(card)await png('g4110-panel-product-visible.png');
    if(!card||card.y<0||card.y+card.h>metrics.viewport.height){result.checks.push({name:'Ürün düzenleyici',status:'BELİRSİZ',actual:'Ürün kartı dokunma alanı ekranda görünür konuma getirilemedi'});}
    else{
      await touch(card.centerX,card.centerY);await new Promise(r=>setTimeout(r,500));
      const open=await evaluate(`!!document.querySelector(${JSON.stringify(config.selectors.dialog)})`);
      result.checks.push({name:'Kıymalı Pide düzenleyicisi',status:open?'PASS':'FAIL',actual:open?'Gerçek Chrome sekmesinde açıldı':'Açılmadı'});
      await png('g4110-panel-editor.png');
      if(open){
        const formSelector=config.selectors.form;
        const formState=await evaluate(`(()=>{const d=document.querySelector(${JSON.stringify(config.selectors.dialog)}),f=d?.querySelector(${JSON.stringify(formSelector)});return {fields:d?.querySelectorAll(${JSON.stringify(config.selectors.formFields)}).length||0,optionSections:d?.querySelectorAll(${JSON.stringify(config.selectors.options)}).length||0,footerButtons:[...(d?.querySelectorAll(${JSON.stringify(config.selectors.footer+' button')})||[])].map(b=>{const r=b.getBoundingClientRect();return {text:b.innerText.trim(),top:r.top,bottom:r.bottom,left:r.left,right:r.right}}),form:f?{scrollTop:f.scrollTop,scrollHeight:f.scrollHeight,clientHeight:f.clientHeight}:null}})()`);
        result.checks.push({name:'Alanlar ve porsiyon/ekstra',status:formState.fields>0&&formState.optionSections>=2?'PASS':'BELİRSİZ',actual:`${formState.fields} alan; ${formState.optionSections} bölüm`});
        const formBox=await bounds(`${config.selectors.dialog} ${formSelector}`);
        if(formBox){const before=await evaluate(`document.querySelector(${JSON.stringify(config.selectors.dialog+' '+formSelector)}).scrollTop`);if(formState.form?.scrollHeight>formState.form?.clientHeight){if(before>0){await swipe(formBox.x+formBox.width/2,formBox.y+formBox.height*.25,formBox.y+formBox.height*.78);await new Promise(r=>setTimeout(r,350))}const start=await evaluate(`document.querySelector(${JSON.stringify(config.selectors.dialog+' '+formSelector)}).scrollTop`);await swipe(formBox.x+formBox.width/2,formBox.y+formBox.height*.78,formBox.y+formBox.height*.28);await new Promise(r=>setTimeout(r,450));const after=await evaluate(`document.querySelector(${JSON.stringify(config.selectors.dialog+' '+formSelector)}).scrollTop`);result.checks.push({name:'Gerçek dokunmatik form kaydırma',status:after>start?'PASS':'FAIL',actual:`scrollTop ${start} → ${after} (önce ${before})`});await png('g4110-panel-form-scrolled.png')}else result.checks.push({name:'Gerçek dokunmatik form kaydırma',status:'BELİRSİZ',actual:'Formda kaydırılabilir içerik ölçülmedi'})}
        const input=await bounds(`${config.selectors.dialog} ${config.selectors.formFields}`);
        if(input){
          await touch(input.centerX,input.centerY);await new Promise(r=>setTimeout(r,700));
          const ime=call(['shell','dumpsys','input_method']);const shown=/mInputShown=true/.test(ime);
          result.checks.push({name:'Android klavyesi açma',status:shown?'PASS':'BELİRSİZ',actual:shown?'IME görünür':'IME durumu doğrulanamadı'});await png('g4110-panel-keyboard-open.png');
          if(shown){
            const visible=await evaluate(`(()=>{const h=visualViewport?.height||innerHeight,o=visualViewport?.offsetTop||0;const b=[...document.querySelectorAll(${JSON.stringify(config.selectors.footer+' button')})].map(x=>{const r=x.getBoundingClientRect();return {text:x.innerText.trim(),top:r.top,bottom:r.bottom}});return {height:h,offset:o,buttons:b,accessible:b.length>=2&&b.every(x=>x.top>=o&&x.bottom<=o+h)}})()`);
            result.checks.push({name:'Kaydet/İptal klavye açıkken erişilebilir',status:visible.accessible?'PASS':'FAIL',actual:`${visible.buttons.map(x=>`${x.text}: ${Math.round(x.top)}-${Math.round(x.bottom)}`).join('; ')}; görünür alan ${Math.round(visible.offset)}-${Math.round(visible.offset+visible.height)}px`});
            call(['shell','input','keyevent','4']);await new Promise(r=>setTimeout(r,500));const hidden=/mInputShown=false/.test(call(['shell','dumpsys','input_method']));
            result.checks.push({name:'Android klavyesi kapama',status:hidden?'PASS':'BELİRSİZ',actual:hidden?'Geri tuşuyla kapandı':'Kapanma doğrulanamadı'});await png('g4110-panel-keyboard-closed.png');
          }
        }
        const cancel=await bounds(`${config.selectors.dialog} ${config.selectors.cancel}`);
        const liveHeight=await evaluate('innerHeight');
        if(cancel&&cancel.centerY>=0&&cancel.centerY<liveHeight){await touch(cancel.centerX,cancel.centerY);await new Promise(r=>setTimeout(r,500));const closed=!(await evaluate(`!!document.querySelector(${JSON.stringify(config.selectors.dialog)})`));result.checks.push({name:'İptal düğmesi ve düzenleyiciyi kapatma',status:closed?'PASS':'FAIL',actual:closed?'İptal sonrası editör kapandı; kaydetme yapılmadı':'Düzenleyici açık kaldı'});await png('g4110-panel-after-cancel.png')}else result.checks.push({name:'İptal düğmesi ve düzenleyiciyi kapatma',status:'BELİRSİZ',actual:`İptal düğmesi görünür alan dışında (y=${cancel?.y}, h=${cancel?.h}, viewport=${liveHeight})`})
      }
    }
  }else if(scenario==='storefront'){
    const cats=await evaluate(`(()=>[...document.querySelectorAll(${JSON.stringify(config.selectors.filters)})].map(b=>{const r=b.getBoundingClientRect();return {name:b.innerText.trim(),pressed:b.getAttribute('aria-pressed'),x:r.x,y:r.y,w:r.width,h:r.height}}))()`);
    const rows=new Set(cats.map(x=>Math.round(x.y))).size;result.checks.push({name:'Filtre düğmeleri 3+2',status:cats.length===config.categoryNames.length&&rows===2?'PASS':'BELİRSİZ',actual:`${cats.length} düğme, ${rows} satır`});
    const pick=cats.find(x=>x.name==='Pide');if(pick){await touch(pick.x+pick.w/2,pick.y+pick.h/2);await new Promise(r=>setTimeout(r,300));const active=await evaluate(`document.querySelectorAll(${JSON.stringify(config.selectors.filters)})[1]?.getAttribute('aria-pressed')`);const count=await evaluate(`document.querySelectorAll(${JSON.stringify(config.selectors.products)}).length`);result.checks.push({name:'Fiziksel kategori dokunuşu',status:active==='true'?'PASS':'FAIL',actual:`aria-pressed=${active}, ${count} kart`});await png('g4110-storefront-category.png')}
  }else throw Error('scenario panel|storefront olmalı');
  result.status=result.checks.some(x=>x.status==='FAIL')?'FAIL':result.checks.some(x=>x.status==='BELİRSİZ')?'KISMİ':'PASS';
  await writeFile(join(out,'android-results.json'),JSON.stringify(result,null,2),'utf8');console.log(JSON.stringify(result,null,2));
}catch(e){result.status='BELİRSİZ';result.reason=String(e);await writeFile(join(out,'android-results.json'),JSON.stringify(result,null,2),'utf8');console.log(JSON.stringify(result,null,2))}
finally{try{ws?.close()}catch{};if(forwarded)try{call(['forward','--remove','tcp:9222'])}catch{}}
