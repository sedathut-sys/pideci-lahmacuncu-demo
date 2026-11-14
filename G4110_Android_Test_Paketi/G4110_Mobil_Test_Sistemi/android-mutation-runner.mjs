#!/usr/bin/env node
import {execFileSync} from 'node:child_process';
import {basename,join,resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';

const arg=(k,d='')=>{const i=process.argv.indexOf(k);return i<0?d:process.argv[i+1]};
const serial=arg('--device'),adb=resolve(arg('--adb','C:/Android/Sdk/platform-tools/adb.exe'));
const out=resolve(arg('--out','./G4110_Test_Kanitlari'));const root='http://127.0.0.1:4321/pideci-lahmacuncu-demo/';
const panelUrl=new URL('panel/',root).href,storeUrl=root;
const cats=['Sıcak Fırın Tatlıları','Kahvaltı Tabağı','Fırından Çıkan Uzun İsimli Tatlılar'];
if(!serial)throw Error('Kullanım: --device SERIAL --adb PATH --out DIR');
const call=(xs,encoding='utf8')=>execFileSync(adb,['-s',serial,...xs],{encoding,stdio:['ignore','pipe','pipe']});
await mkdir(out,{recursive:true});
const result={kind:'Gerçek Android yerel demo mutasyon testleri',device:'Android USB cihazı (seri kimliği redakte edildi)',panelUrl,storeUrl,status:'PASS',tests:[],evidence:[],dataChanges:[],cleanup:{priceReverted:false,temporaryExtraRemoved:false,temporaryCategoriesRemoved:false}};
const add=(name,status,expected,actual)=>result.tests.push({name,status,expected,actual});
const pngOK=b=>b.length>24&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
let forwarded=false,ws,seq=0;const pending=new Map();let dialogSeen=[];
const cdp=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,resolve);ws.send(JSON.stringify({id,method,params}));setTimeout(()=>reject(Error(`${method} timeout`)),8000)});
const evalValue=async expression=>{const m=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(m.error)throw Error(JSON.stringify(m.error));return m.result?.result?.value};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const screenshot=async name=>{const remote=`/sdcard/${name}`;call(['shell','screencap','-p',remote]);const dest=join(out,basename(name));call(['pull',remote,dest]);call(['shell','rm',remote]);const b=await import('node:fs/promises').then(fs=>fs.readFile(dest));if(!pngOK(b))throw Error(`Invalid screenshot PNG: ${name}`);result.evidence.push(dest)};
const touch=async(x,y)=>{await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait(400)};
const swipe=async(x,y1,y2)=>{await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:y1,id:1}]});for(let i=1;i<=8;i++){await wait(35);await cdp('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y1+(y2-y1)*i/8,id:1}]})}await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait(350)};
const bounds=async selector=>evalValue(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,cx:r.x+r.width/2,cy:r.y+r.height/2}})()`);
const boundsExpr=async expression=>evalValue(`(()=>{const e=(${expression})();if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,cx:r.x+r.width/2,cy:r.y+r.height/2}})()`);
const screenHeight=async()=>evalValue('innerHeight');
const tap=async selector=>{const b=await bounds(selector);if(!b)throw Error(`Tap target missing: ${selector}`);const h=await screenHeight();if(b.cy<0||b.cy>=h)throw Error(`Tap target not on screen: ${selector}, y=${b.cy}, height=${h}`);await touch(b.cx,b.cy);return b};
const tapExpr=async expression=>{const b=await boundsExpr(expression);if(!b)throw Error(`Tap target missing: ${expression}`);const h=await screenHeight();if(b.cy<0||b.cy>=h)throw Error(`Tap target not on screen: ${expression}, y=${b.cy}, height=${h}`);await touch(b.cx,b.cy);return b};
const keyboardHeight=async()=>evalValue('visualViewport?.height||innerHeight');
const closeKeyboard=async()=>{const before=await keyboardHeight(),layout=await screenHeight();if(before<layout-60){call(['shell','input','keyevent','4']);await wait(500)}return (await keyboardHeight())>before+40||before>layout-60};
const typeFocused=async(text,clear=false)=>{if(clear){const count=Number(await evalValue(`String(document.activeElement?.value||'').length`));call(['shell','input','keyevent','123']);for(let i=0;i<count;i++)call(['shell','input','keyevent','67'])}await cdp('Input.insertText',{text:String(text)});await wait(300);return await evalValue(`String(document.activeElement?.value??'')`)};
const typeSelector=async(selector,text,clear=false)=>{let before=await keyboardHeight(),layout=await screenHeight();if(before<layout-60){await closeKeyboard();before=await keyboardHeight()}await tap(selector);await wait(700);const after=await keyboardHeight();const shown=after<before-60||/mInputShown=true/.test(call(['shell','dumpsys','input_method']));if(!shown)throw Error(`Android keyboard did not show for ${selector} (viewport ${before}→${after})`);const actual=await typeFocused(text,clear);if(actual!==String(text))throw Error(`Typed value mismatch for ${selector}: expected ${text}, got ${actual}`);await screenshot(`g4110-android-keyboard-${result.evidence.length}.png`);return shown};
const tapExprVisible=async expression=>{await closeKeyboard();for(let i=0;i<10;i++){const b=await boundsExpr(expression),h=await keyboardHeight();if(b&&b.cy>=0&&b.cy<h){await touch(b.cx,b.cy);return b}if(b&&b.y<0)await swipe(192,h*.25,h*.78);else await swipe(192,h*.78,h*.28)}throw Error(`Physical tap target remained off screen: ${expression}`)};
const pageNavigate=async url=>{const u=new URL(url);if(u.origin!=='http://127.0.0.1:4321'||!u.pathname.startsWith('/pideci-lahmacuncu-demo/'))throw Error('Navigation escaped local Taş Fırın demo');await cdp('Page.navigate',{url});await wait(1000)};
const findAndSwipe=async selector=>{for(let i=0;i<8;i++){const b=await bounds(selector);if(b&&b.y>=0&&b.y+b.h<=await screenHeight())return b;const h=await screenHeight();await swipe(192,h*.78,h*.28)}return await bounds(selector)};
const revealSelector=async selector=>{for(let i=0;i<10;i++){const b=await bounds(selector),h=await keyboardHeight();if(b&&b.y>=0&&b.y+b.h<=h)return b;await swipe(192,h*.78,h*.28)}throw Error(`Physical scroll could not reveal ${selector}`)};
const saveProduct=async()=>{await closeKeyboard();await tap('.admin-dialog-footer .admin-create');for(let i=0;i<30;i++){if(!(await evalValue(`!!document.querySelector(${JSON.stringify('[role=dialog]')})`)))return true;await wait(250)}return false};
const openProduct=async()=>{const editSelector='.admin-mobile-product';let b=await boundsExpr(`()=>[...document.querySelectorAll(${JSON.stringify(editSelector)})].find(x=>x.innerText.includes('Kıymalı Pide'))?.querySelector('.edit-button')`);for(let i=0;i<8&&b&&(b.y<0||b.y+b.h>await screenHeight());i++){const h=await screenHeight();await swipe(192,h*.78,h*.28);b=await boundsExpr(`()=>[...document.querySelectorAll(${JSON.stringify(editSelector)})].find(x=>x.innerText.includes('Kıymalı Pide'))?.querySelector('.edit-button')`)}if(!b)throw Error('Kıymalı Pide edit button not found');await touch(b.cx,b.cy);await wait(500);return !!(await evalValue(`!!document.querySelector('[role=dialog]')`))};

try{
  const dev=call(['devices','-l']);if(!new RegExp(`^${serial}\\s+device\\b`,'m').test(dev))throw Error('ADB device unavailable');
  if(!/mCurrentFocus=.*com\.android\.chrome\//.test(call(['shell','dumpsys','window'])))throw Error('Chrome is not foreground; refusing physical input');
  call(['forward','tcp:9222','localabstract:chrome_devtools_remote']);forwarded=true;
  const tabs=await(await fetch('http://127.0.0.1:9222/json/list')).json();const targets=tabs.filter(t=>t.type==='page'&&t.url===panelUrl);
  if(targets.length!==1)throw Error(`Expected exactly one authorized panel tab; found ${targets.length}`);
  ws=new WebSocket(targets[0].webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;setTimeout(()=>j(Error('CDP open timeout')),5000)});
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}if(m.method==='Page.javascriptDialogOpening'){dialogSeen.push(m.params.message);void cdp('Page.handleJavaScriptDialog',{accept:true})}};
  await cdp('Page.enable');await cdp('Runtime.enable');
  const viewport=await evalValue('({width:innerWidth,height:innerHeight,dpr:devicePixelRatio})'),physical=call(['shell','wm','size']).match(/(\d+)x(\d+)/);result.deviceMetrics={viewport,physicalPixels:physical?`${physical[1]}x${physical[2]}`:null,density:call(['shell','wm','density']).trim()};
  const kick=await evalValue(`document.querySelector('.admin-top-kicker')?.innerText||''`);if(!kick.includes('Yerel Demo'))throw Error(`Not local demo panel: ${kick}`);
  if(!(await evalValue(`!!document.querySelector('.admin-mobile-product')`))){await tapExprVisible(`()=>[...document.querySelectorAll('.admin-side-link')].find(x=>x.innerText.includes('Ürünler ve menü'))`);await wait(450)}
  if(await evalValue(`!!document.querySelector('[role=dialog]')`)){await closeKeyboard();await tap('.admin-dialog-footer .admin-cancel');await wait(500)}
  if(!(await openProduct()))throw Error('Edit dialog did not open');
  const start=await evalValue(`(()=>{const price=document.querySelector('input[aria-label="Menüde görünen satış fiyatı"]')?.value;const extras=[...document.querySelectorAll('.admin-options-field')[1]?.querySelectorAll('.admin-option-row')||[]].map(r=>{const i=r.querySelectorAll('input');return {label:i[0]?.value,price:Number(i[1]?.value)}});const s=JSON.parse(localStorage.getItem('tas-firin:pideci-lahmacuncu-demo:settings:v3')||'{}');return {price:Number(String(price||'215').replace(',','.')),extras,categories:s.categories||['Pide','Lahmacun','Yan Ürün','İçecek']}})()`);
  result.observedStartingPrice=start.price;const baseline=arg('--baseline-price');if(baseline!=='')start.price=Number(baseline);
  const priorCategories=start.categories.filter(x=>cats.includes(x));
  if(priorCategories.length){await closeKeyboard();await tapExprVisible(`()=>document.querySelector('.admin-dialog-footer .admin-cancel')`);await tapExprVisible(`()=>[...document.querySelectorAll('.admin-side-link')].find(x=>x.innerText.includes('Kategoriler'))`);for(const name of priorCategories){await tapExprVisible(`()=>[...document.querySelectorAll('.admin-category-row')].find(x=>x.innerText.includes(${JSON.stringify(name)}))?.querySelector('.admin-danger-btn')`);await wait(350);result.dataChanges.push({action:'Önceki çalıştırmadan kalan test kategorisi kaldırıldı',name})}start.categories=start.categories.filter(x=>!cats.includes(x));await pageNavigate(panelUrl);if(!(await openProduct()))throw Error('Product editor did not reopen after category cleanup')}
  result.initialState={price:start.price,extras:start.extras,categories:start.categories};
  await screenshot('g4110-android-mutation-start.png');

  const priorTestExtra=start.extras.findIndex(x=>x.label==='G4110 Android Ekstra');
  if(priorTestExtra>=0){await tapExprVisible(`()=>[...document.querySelectorAll('.admin-options-field')][1]?.querySelectorAll('.admin-option-row')?.[${priorTestExtra}]?.querySelector('button[aria-label="Ekstrayı sil"]')`);await closeKeyboard();await saveProduct();result.cleanup.temporaryExtraRemoved=true;result.dataChanges.push({action:'Önceki çalıştırmadan kalan test ekstrası kaldırıldı',label:'G4110 Android Ekstra'});await screenshot('g4110-android-extra-prior-cleanup.png');if(!(await openProduct()))throw Error('Product editor did not reopen after cleanup')}

  // Change the draft name on the physical phone, cancel it, and verify storage stayed unchanged.
  const nameInputExpr=`()=>[...document.querySelectorAll('.admin-dialog label')].find(x=>x.innerText.includes('Ürün adı'))?.control`;
  const originalName=await evalValue(`JSON.parse(localStorage.getItem('tas-firin:pideci-lahmacuncu-demo:products:v2')||'[]').find(x=>x.id==='pide-kiymali')?.name`);
  await tapExprVisible(nameInputExpr);await wait(650);const nameKeyboardShown=(await keyboardHeight())<await screenHeight()-60;
  if(!nameKeyboardShown)throw Error('Android keyboard did not show for product name cancellation test');
  const editedName=await typeFocused(`${originalName} CANCEL TEST`,true);if(editedName!==`${originalName} CANCEL TEST`)throw Error('Product name draft entry mismatch');
  await screenshot('g4110-android-cancel-draft.png');await closeKeyboard();await tapExprVisible(`()=>document.querySelector('.admin-dialog-footer .admin-cancel')`);await wait(500);
  const storedName=await evalValue(`JSON.parse(localStorage.getItem('tas-firin:pideci-lahmacuncu-demo:products:v2')||'[]').find(x=>x.id==='pide-kiymali')?.name`);
  add('Gerçek telefonda ürün düzenlemede İptal',storedName===originalName?'PASS':'FAIL',String(originalName),String(storedName));await screenshot('g4110-android-cancel-verified.png');
  if(!(await openProduct()))throw Error('Product editor did not reopen after cancel test');

  // Product edit and save, then return that test value to its starting value.
  const priceSelector='input[aria-label="Menüde görünen satış fiyatı"]';const newPrice=Number(start.price)+1;
  await typeSelector(priceSelector,String(newPrice),true);const typedPrice=await evalValue(`document.querySelector(${JSON.stringify(priceSelector)})?.value`);
  add('Gerçek telefonda fiyat alanına yazma',typedPrice===String(newPrice)?'PASS':'FAIL',String(newPrice),typedPrice);
  await screenshot('g4110-android-price-draft.png');
  const saved=await saveProduct();const savedPrice=await evalValue(`JSON.parse(localStorage.getItem('tas-firin:pideci-lahmacuncu-demo:products:v2')||'[]').find(x=>x.id==='pide-kiymali')?.variants?.[0]?.price`);
  add('Gerçek telefonda fiyat Kaydet',saved&&savedPrice===newPrice?'PASS':'FAIL',`Fiyat ${newPrice} saklanmalı`,`saved=${saved}; price=${savedPrice}`);result.dataChanges.push({action:'Ürün fiyatı kaydedildi',from:start.price,to:savedPrice});await screenshot('g4110-android-price-saved.png');
  if(!(await openProduct()))throw Error('Price revert editor did not open');await typeSelector(priceSelector,String(start.price),true);const reverted=await saveProduct();const finalPrice=await evalValue(`JSON.parse(localStorage.getItem('tas-firin:pideci-lahmacuncu-demo:products:v2')||'[]').find(x=>x.id==='pide-kiymali')?.variants?.[0]?.price`);
  result.cleanup.priceReverted=finalPrice===start.price;add('Fiyatı başlangıç değerine döndürme',reverted&&result.cleanup.priceReverted?'PASS':'FAIL',String(start.price),String(finalPrice));await screenshot('g4110-android-price-reverted.png');

  // Add and save one temporary extra, then remove it through the editor.
  if(!(await openProduct()))throw Error('Extra editor did not open');
  let form=await bounds('.admin-dialog .admin-form');if(form){for(let n=0;n<8;n++){const st=await evalValue(`document.querySelector('.admin-dialog .admin-form').scrollTop`);const sh=await evalValue(`document.querySelector('.admin-dialog .admin-form').scrollHeight`);const ch=await evalValue(`document.querySelector('.admin-dialog .admin-form').clientHeight`);if(st+ch>=sh-2)break;const h=await keyboardHeight();await swipe(192,h*.78,h*.28)}}
  await tapExprVisible(`()=>[...document.querySelectorAll('.admin-options-field')][1]?.querySelector('.admin-add-option')`);
  await wait(250);
  const rowInputExpr=n=>`()=>{const r=[...document.querySelectorAll('.admin-options-field')][1]?.querySelectorAll('.admin-option-row');return r?.[r.length-1]?.querySelectorAll('input')?.[${n}]}`;
  const extraName=await tapExprVisible(rowInputExpr(0));await wait(250);const actualExtraName=await typeFocused('G4110 Android Ekstra');if(actualExtraName!=='G4110 Android Ekstra')throw Error(`Extra name mismatch: ${actualExtraName}`);
  const extraPrice=await tapExprVisible(rowInputExpr(1));await wait(250);const actualExtraPrice=await typeFocused('1');if(actualExtraPrice!=='1')throw Error(`Extra price mismatch: ${actualExtraPrice}`);await closeKeyboard();await screenshot('g4110-android-extra-draft.png');
  const extraSaved=await saveProduct();let extras=await evalValue(`JSON.parse(localStorage.getItem('tas-firin:pideci-lahmacuncu-demo:products:v2')||'[]').find(x=>x.id==='pide-kiymali')?.extras||[]`);
  add('Gerçek telefonda ekstra ekleme ve Kaydet',extraSaved&&extras.some(x=>x.label==='G4110 Android Ekstra'&&x.price===1)?'PASS':'FAIL','G4110 Android Ekstra · 1 TL',JSON.stringify(extras));result.dataChanges.push({action:'Geçici ekstra kaydedildi',label:'G4110 Android Ekstra',price:1});await screenshot('g4110-android-extra-saved.png');
  if(!(await openProduct()))throw Error('Extra removal editor did not open');form=await bounds('.admin-dialog .admin-form');for(let n=0;n<8;n++){const st=await evalValue(`document.querySelector('.admin-dialog .admin-form').scrollTop`),sh=await evalValue(`document.querySelector('.admin-dialog .admin-form').scrollHeight`),ch=await evalValue(`document.querySelector('.admin-dialog .admin-form').clientHeight`);if(st+ch>=sh-2)break;const h=await keyboardHeight();await swipe(192,h*.78,h*.28)}
  await tapExprVisible(`()=>{const r=[...document.querySelectorAll('.admin-options-field')][1]?.querySelectorAll('.admin-option-row');return r?.[r.length-1]?.querySelector('button[aria-label="Ekstrayı sil"]')}`);await closeKeyboard();await saveProduct();extras=await evalValue(`JSON.parse(localStorage.getItem('tas-firin:pideci-lahmacuncu-demo:products:v2')||'[]').find(x=>x.id==='pide-kiymali')?.extras||[]`);
  result.cleanup.temporaryExtraRemoved=!extras.some(x=>x.label==='G4110 Android Ekstra');add('Geçici ekstrayı silme',result.cleanup.temporaryExtraRemoved?'PASS':'FAIL','Test ekstrası kalmamalı',JSON.stringify(extras));await screenshot('g4110-android-extra-removed.png');

  // Add temporary categories through the real panel UI and test the customer view.
  await tapExprVisible(`()=>[...document.querySelectorAll('.admin-side-link')].find(x=>x.innerText.includes('Kategoriler'))`);await wait(500);
  const addCategory=async name=>{await typeSelector('#new-category',name);await closeKeyboard();await tap('.admin-category-add button.admin-create');for(let i=0;i<30;i++){const n=await evalValue(`document.querySelectorAll('.admin-category-row').length`);if(n===start.categories.length+result.dataChanges.filter(x=>x.action==='Kategori eklendi').length+1)break;await wait(150)}result.dataChanges.push({action:'Kategori eklendi',name})};
  await addCategory(cats[0]);await addCategory(cats[1]);
  await pageNavigate(storeUrl);await revealSelector('.filters');await screenshot('g4110-android-categories-7.png');
  let catState=await evalValue(`(()=>{const a=[...document.querySelectorAll('.filters .filter')];return {count:a.length,rows:new Set(a.map(x=>Math.round(x.getBoundingClientRect().y))).size,width:document.documentElement.scrollWidth,viewport:innerWidth,labels:a.map(x=>x.innerText.trim())}})()`);
  add('Gerçek Android müşteri görünümü 7 kategori',catState.count===7&&catState.width<=catState.viewport?'PASS':'FAIL','7 kategori düğmesi yatay taşmasız',JSON.stringify(catState));
  await pageNavigate(panelUrl);await tapExprVisible(`()=>[...document.querySelectorAll('.admin-side-link')].find(x=>x.innerText.includes('Kategoriler'))`);await wait(400);await addCategory(cats[2]);
  await pageNavigate(storeUrl);await revealSelector('.filters');await screenshot('g4110-android-categories-8-long.png');
  catState=await evalValue(`(()=>{const a=[...document.querySelectorAll('.filters .filter')],e=a.find(x=>x.innerText.includes(${JSON.stringify(cats[2])})),r=e?.getBoundingClientRect();return {count:a.length,rows:new Set(a.map(x=>Math.round(x.getBoundingClientRect().y))).size,width:document.documentElement.scrollWidth,viewport:innerWidth,long:e?{text:e.innerText.trim(),right:r.right,height:r.height,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight,whiteSpace:getComputedStyle(e).whiteSpace}:null}})()`);
  add('Gerçek Android 8 kategori ve uzun ad',catState.count===8&&catState.width<=catState.viewport&&catState.long?.right<=catState.viewport?'PASS':'FAIL','8 kategori, uzun ad taşmasız',JSON.stringify(catState));
  await tapExprVisible(`()=>[...document.querySelectorAll('.filters .filter')].find(x=>x.innerText.includes(${JSON.stringify(cats[1])}))`);
  const filterPressed=await evalValue(`(()=>[...document.querySelectorAll('.filters .filter')].find(x=>x.innerText.includes(${JSON.stringify(cats[1])}))?.getAttribute('aria-pressed'))()`);
  add('Gerçek Android kategori filtresi',filterPressed==='true'?'PASS':'FAIL','Dokunulan kategori seçilmeli',`aria-pressed=${filterPressed}`);

  // Delete only the temporary zero-product categories created by this run.
  await pageNavigate(panelUrl);await tapExprVisible(`()=>[...document.querySelectorAll('.admin-side-link')].find(x=>x.innerText.includes('Kategoriler'))`);await wait(400);
  for(const name of cats){await tapExprVisible(`()=>[...document.querySelectorAll('.admin-category-row')].find(x=>x.innerText.includes(${JSON.stringify(name)}))?.querySelector('.admin-danger-btn')`);await wait(350)}
  const final=await evalValue(`(()=>{const p=JSON.parse(localStorage.getItem('tas-firin:pideci-lahmacuncu-demo:products:v2')||'[]').find(x=>x.id==='pide-kiymali');const s=JSON.parse(localStorage.getItem('tas-firin:pideci-lahmacuncu-demo:settings:v3')||'{}');return {price:p?.variants?.[0]?.price,extras:p?.extras||[],categories:s.categories||[]}})()`);
  result.cleanup.temporaryCategoriesRemoved=cats.every(x=>!final.categories.includes(x));
  add('Test sonrası demo değerleri',final.price===start.price&&result.cleanup.temporaryExtraRemoved&&result.cleanup.temporaryCategoriesRemoved?'PASS':'FAIL','Fiyat/ekstralar başlangıçta, geçici kategoriler silinmiş olmalı',JSON.stringify(final));await screenshot('g4110-android-after-cleanup.png');
  result.finalState=final;result.status=result.tests.some(x=>x.status==='FAIL')?'FAIL':result.tests.some(x=>x.status==='BELİRSİZ')?'KISMİ':'PASS';
}catch(e){result.status='FAIL';result.error=String(e);result.tests.push({name:'Beklenmeyen Android runner hatası',status:'FAIL',actual:String(e)});try{await screenshot('g4110-android-failure-state.png')}catch{}}
finally{try{await writeFile(join(out,'android-mutation-results.json'),JSON.stringify(result,null,2),'utf8')}catch{}try{ws?.close()}catch{}if(forwarded)try{call(['forward','--remove','tcp:9222'])}catch{}}
console.log(JSON.stringify(result,null,2));
