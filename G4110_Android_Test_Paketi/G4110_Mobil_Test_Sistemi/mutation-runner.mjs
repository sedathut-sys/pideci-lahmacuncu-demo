#!/usr/bin/env node
import {createRequire} from 'node:module';
import {resolve,join} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';

const arg=(k,d='')=>{const i=process.argv.indexOf(k);return i<0?d:process.argv[i+1]};
const project=resolve(arg('--project','C:/Users/PC/TasFirin-G418-Test'));
const url=arg('--url','http://127.0.0.1:4321/pideci-lahmacuncu-demo/');
const panelUrl=arg('--panel-url',new URL('panel/',url.endsWith('/')?url:`${url}/`).href);
const out=resolve(arg('--out','../G4110_Test_Kanitlari'));
const config=JSON.parse(await(await import('node:fs/promises')).readFile(resolve(arg('--config',join(import.meta.dirname,'scenarios/tas-firin.json'))),'utf8'));
const {chromium}=createRequire(join(project,'package.json'))('playwright');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:arg('--browser','C:/Program Files/Google/Chrome/Application/chrome.exe')});
const context=await browser.newContext({viewport:{width:320,height:720},deviceScaleFactor:1,isMobile:true,hasTouch:true,locale:'tr-TR'});
const page=await context.newPage();const results=[];const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
const record=(name,status,expected,actual,extra={})=>results.push({name,status,expected,actual,...extra});
const nav=page.locator('.admin-side-link').filter({hasText:'Kategoriler'}).first();
const openEditor=async()=>{const c=page.locator(config.selectors.productCards).filter({hasText:config.productName}).first();await c.locator(config.selectors.editButton).click();await page.locator(config.selectors.dialog).waitFor({state:'visible'});return page.locator(config.selectors.dialog)};
const saveEditor=async d=>{await d.locator(config.selectors.save).click();await d.waitFor({state:'hidden',timeout:10000})};
try{
  await page.goto(panelUrl,{waitUntil:'networkidle',timeout:45000});
  page.on('dialog',d=>d.accept());
  const demo=await page.locator('.admin-top-kicker').innerText().catch(()=>'' );
  record('Yerel demo kapsamı',demo.includes('Yerel Demo')?'PASS':'FAIL','Panel yerel demo modunda',demo);

  let d=await openEditor();
  await d.getByLabel('Ürün adı *').fill(`${config.productName} İPTAL TESTİ`);
  await d.locator(config.selectors.cancel).click();await d.waitFor({state:'hidden'});
  let card=page.locator(config.selectors.productCards).filter({hasText:config.productName}).first();
  const cancelOk=await card.innerText();record('Ürün düzenle ve İptal',cancelOk.includes(config.productName)&&!cancelOk.includes('İPTAL TESTİ')?'PASS':'FAIL','Düzenleme kaydedilmemeli',cancelOk);
  await page.screenshot({path:join(out,'playwright-cancel-result.png'),fullPage:true});

  d=await openEditor();const price=d.getByLabel('Menüde görünen satış fiyatı');const original=await price.inputValue();const changed=String(Number(original.replace(',','.'))+1);
  await price.fill(changed);await saveEditor(d);card=page.locator(config.selectors.productCards).filter({hasText:config.productName}).first();
  const afterPrice=await card.innerText();const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('tas-firin:pideci-lahmacuncu-demo:products:v2')||'[]').find(p=>p.id==='pide-kiymali')?.variants?.[0]?.price);
  record('Ürün fiyatı Kaydet ve kalıcılık',afterPrice.includes(`₺${changed}`)&&persisted===Number(changed)?'PASS':'FAIL',`Fiyat ${changed} kaydedilmeli`,`Kart: ${afterPrice.match(/₺\s?[\d.,]+/)?.[0]||'fiyat yok'}; storage varyant fiyatı ${persisted}`);
  await page.screenshot({path:join(out,'playwright-price-saved.png'),fullPage:true});
  d=await openEditor();await d.getByLabel('Menüde görünen satış fiyatı').fill(original);await saveEditor(d);
  const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('tas-firin:pideci-lahmacuncu-demo:products:v2')||'[]').find(p=>p.id==='pide-kiymali')?.variants?.[0]?.price);
  record('Ürün fiyatını test sonrası geri alma',restored===Number(original)?'PASS':'FAIL',`Fiyat ${original} olmalı`,`Kaydedilen fiyat ${restored}`);

  d=await openEditor();const form=d.locator(config.selectors.form);await form.evaluate(e=>e.scrollTop=e.scrollHeight);await page.waitForTimeout(120);
  const formScroll=await form.evaluate(e=>({top:e.scrollTop,height:e.scrollHeight,client:e.clientHeight}));
  record('Porsiyon/ekstra bölümlerine kaydırma',formScroll.top+formScroll.client>=formScroll.height-2?'PASS':'FAIL','Form altına erişilmeli',JSON.stringify(formScroll));
  const extras=d.locator(config.selectors.options).nth(1);await extras.getByRole('button',{name:/Ekstra ekle/}).click();
  const row=extras.locator('.admin-option-row').last();await row.locator('input').nth(0).fill('G4110 Geçici Ekstra');await row.locator('input').nth(1).fill('1');
  await saveEditor(d);
  let extraState=await page.evaluate(()=>JSON.parse(localStorage.getItem('tas-firin:pideci-lahmacuncu-demo:products:v2')||'[]').find(p=>p.id==='pide-kiymali')?.extras||[]);
  record('Ekstra ekleme ve Kaydet',extraState.some(x=>x.label==='G4110 Geçici Ekstra'&&x.price===1)?'PASS':'FAIL','Yeni ekstra 1 TL ile saklanmalı',JSON.stringify(extraState));
  d=await openEditor();await d.locator(config.selectors.form).evaluate(e=>e.scrollTop=e.scrollHeight);const extrasAgain=d.locator(config.selectors.options).nth(1);const tempRow=extrasAgain.locator('.admin-option-row').last();
  await tempRow.getByRole('button',{name:'Ekstrayı sil'}).click();await saveEditor(d);
  extraState=await page.evaluate(()=>JSON.parse(localStorage.getItem('tas-firin:pideci-lahmacuncu-demo:products:v2')||'[]').find(p=>p.id==='pide-kiymali')?.extras||[]);
  record('Ekstra test değerini kaldırma',!extraState.some(x=>x.label==='G4110 Geçici Ekstra')?'PASS':'FAIL','Geçici ekstra kalmamalı',JSON.stringify(extraState));

  await nav.click();await page.locator('#new-category').waitFor();
  const cats7=['Sıcak Fırın Tatlıları','Kahvaltı Tabağı'];
  for(const name of cats7){await page.locator('#new-category').fill(name);await page.getByRole('button',{name:/Kategori ekle/}).click();await page.getByText(name,{exact:true}).waitFor()}
  await page.goto(url,{waitUntil:'networkidle'});
  let filters=page.locator(config.selectors.filters);let count=await filters.count();
  for(const vp of [{width:320,height:560},{width:320,height:720},{width:390,height:844}]){await page.setViewportSize(vp);const s=await page.evaluate(sel=>{const b=[...document.querySelectorAll(sel)].map(x=>{const r=x.getBoundingClientRect();return {text:x.innerText.trim(),x:r.x,right:r.right,y:r.y,height:r.height}});return {count:b.length,rows:new Set(b.map(x=>Math.round(x.y))).size,width:document.documentElement.scrollWidth,buttons:b}},config.selectors.filters);record(`Müşteri sitesi 7 kategori ${vp.width}×${vp.height}`,s.count===7&&s.width<=vp.width?'PASS':'FAIL',`7 kategori düğmesi ${vp.width}px yatay taşmasız olmalı`,JSON.stringify({count:s.count,rows:s.rows,width:s.width}));await page.screenshot({path:join(out,`playwright-7-categories-${vp.width}x${vp.height}.png`),fullPage:true})}
  await page.setViewportSize({width:320,height:720});filters=page.locator(config.selectors.filters);
  await filters.filter({hasText:'Kahvaltı Tabağı'}).click();const active7=await filters.filter({hasText:'Kahvaltı Tabağı'}).getAttribute('aria-pressed');
  record('Yeni kategoriyi seçme/ürün filtresi',active7==='true'?'PASS':'FAIL','Seçilen kategori etkin olmalı',`aria-pressed=${active7}; kart=${await page.locator(config.selectors.products).count()}`);

  await page.goto(panelUrl,{waitUntil:'networkidle'});await nav.click();
  const name8='Günün Çıtırları';await page.locator('#new-category').fill(name8);await page.getByRole('button',{name:/Kategori ekle/}).click();await page.getByText(name8,{exact:true}).waitFor();
  await page.goto(url,{waitUntil:'networkidle'});filters=page.locator(config.selectors.filters);count=await filters.count();
  for(const vp of [{width:320,height:560},{width:320,height:720},{width:390,height:844}]){await page.setViewportSize(vp);const s=await page.evaluate(sel=>({count:document.querySelectorAll(sel).length,width:document.documentElement.scrollWidth,rows:new Set([...document.querySelectorAll(sel)].map(x=>Math.round(x.getBoundingClientRect().y))).size}),config.selectors.filters);record(`Müşteri sitesi 8 kategori ${vp.width}×${vp.height}`,s.count===8&&s.width<=vp.width?'PASS':'FAIL',`8 kategori düğmesi ${vp.width}px yatay taşmasız olmalı`,JSON.stringify(s));await page.screenshot({path:join(out,`playwright-8-categories-${vp.width}x${vp.height}.png`),fullPage:true})}

  const longName='Fırından Çıkan Uzun İsimli Tatlılar';
  await page.goto(panelUrl,{waitUntil:'networkidle'});await nav.click();await page.locator('#new-category').fill(longName);await page.getByRole('button',{name:/Kategori ekle/}).click();await page.getByText(longName,{exact:true}).waitFor();
  await page.goto(url,{waitUntil:'networkidle'});filters=page.locator(config.selectors.filters);
  for(const vp of [{width:320,height:560},{width:320,height:720},{width:390,height:844}]){await page.setViewportSize(vp);const longButton=filters.filter({hasText:longName});const longMetrics=await longButton.evaluate(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {text:e.innerText.trim(),width:r.width,right:r.right,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth,scrollHeight:e.scrollHeight,whiteSpace:s.whiteSpace,overflow:document.documentElement.scrollWidth}});record(`Uzun kategori ${vp.width}×${vp.height}`,longMetrics.right<=vp.width&&longMetrics.overflow<=vp.width?'PASS':'FAIL','Uzun ad viewport dışına taşmamalı',JSON.stringify(longMetrics));await page.screenshot({path:join(out,`playwright-long-category-${vp.width}x${vp.height}.png`),fullPage:true})}
  await page.setViewportSize({width:320,height:720});const longButton=filters.filter({hasText:longName});const selected=await longButton.getAttribute('aria-pressed');if(selected!=='true')await longButton.click();
  record('Uzun kategori filtre seçimi',(await longButton.getAttribute('aria-pressed'))==='true'?'PASS':'FAIL','Kategori seçilebilmeli',`aria-pressed=${await longButton.getAttribute('aria-pressed')}`);

  await page.goto(panelUrl,{waitUntil:'networkidle'});await nav.click();
  const temporary=[...cats7,name8,longName];
  for(const name of temporary){const r=page.locator('.admin-category-row').filter({hasText:name});if(await r.count()){await r.getByRole('button',{name:'Kategoriyi sil'}).click();await r.waitFor({state:'detached'})}}
  const remaining=await page.locator('.admin-category-row').locator('strong').allTextContents();
  record('Test kategorilerini silme',temporary.every(x=>!remaining.includes(x))?'PASS':'FAIL','Geçici kategoriler listeden kaldırılmalı',JSON.stringify(remaining));
  const finalPrice=await page.evaluate(()=>JSON.parse(localStorage.getItem('tas-firin:pideci-lahmacuncu-demo:products:v2')||'[]').find(p=>p.id==='pide-kiymali')?.variants?.[0]?.price);
  const finalSettings=await page.evaluate(()=>JSON.parse(localStorage.getItem('tas-firin:pideci-lahmacuncu-demo:settings:v3')||'{}').categories);
  record('Test sonrası yerel demo verisi',finalPrice===215&&finalSettings?.length===4?'PASS':'FAIL','Fiyat 215 ve 4 temel kategori kalmalı',JSON.stringify({finalPrice,finalSettings}));
}catch(e){record('Beklenmeyen Playwright hatası','FAIL','Senaryo tamamlanmalı',String(e))}
finally{
  await writeFile(join(out,'playwright-mutation-results.json'),JSON.stringify({kind:'Playwright local-demo mutation tests',project,url,panelUrl,viewport:{width:320,height:720},changesWereIsolatedInEphemeralBrowserContext:true,tests:results,pageErrors},null,2),'utf8');
  await context.close();await browser.close();
}
console.log(JSON.stringify(results,null,2));
