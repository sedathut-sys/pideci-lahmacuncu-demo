#!/usr/bin/env node
import {createRequire} from 'node:module';
import {resolve,join} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';

const arg=(key,fallback='')=>{const i=process.argv.indexOf(key);return i<0?fallback:process.argv[i+1]};
const project=resolve(arg('--project','C:/Users/PC/TasFirin-G418-Test'));
const url=arg('--url','http://127.0.0.1:4321/pideci-lahmacuncu-demo/');
const panelUrl=arg('--panel-url',new URL('panel/',url.endsWith('/')?url:`${url}/`).href);
const device=arg('--device','unknown');
const out=resolve(arg('--out','../G4110_Test_Kanitlari'));
const scenario=arg('--scenario','all');
const configPath=resolve(arg('--config',join(import.meta.dirname,'scenarios/tas-firin.json')));
if(!['panel','storefront','all'].includes(scenario))throw Error('--scenario panel|storefront|all olmalı');
const config=JSON.parse(await (await import('node:fs/promises')).readFile(configPath,'utf8'));
const {chromium}=createRequire(join(project,'package.json'))('playwright');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:arg('--browser','C:/Program Files/Google/Chrome/Application/chrome.exe')});
const results=[];
const viewports=[{width:320,height:560},{width:320,height:720},{width:390,height:844}];
for(const viewport of viewports){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,isMobile:true,hasTouch:true,locale:'tr-TR'});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  if(scenario==='panel'||scenario==='all'){
    const tests=[];
    await page.goto(panelUrl,{waitUntil:'networkidle',timeout:45000});
    const product=page.locator(config.selectors.productCards).filter({hasText:config.productName}).first();
    const hasProduct=await product.count()>0;
    tests.push({name:'Panel ürün listesi',status:hasProduct?'PASS':'FAIL',expected:config.productName+' görünür',actual:hasProduct?'ürün kartı bulundu':'ürün kartı bulunamadı'});
    if(hasProduct){
      const edit=product.locator(config.selectors.editButton).first();await edit.click();
      const dialog=page.locator(config.selectors.dialog);await dialog.waitFor({state:'visible',timeout:10000});
      const before=await page.evaluate(s=>{const d=document.querySelector(s.dialog),f=d?.querySelector(s.form),r=e=>{const q=e.getBoundingClientRect();return {x:q.x,y:q.y,w:q.width,h:q.height,top:q.top,bottom:q.bottom,right:q.right,left:q.left}};return {viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},document:{clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth},dialog:d?r(d):null,form:f?{...r(f),scrollHeight:f.scrollHeight,clientHeight:f.clientHeight,scrollTop:f.scrollTop}:null,fieldCount:d?.querySelectorAll(s.formFields).length||0,options:d?[...d.querySelectorAll(s.options)].map(r):[],footer:d?.querySelector(s.footer)?r(d.querySelector(s.footer)):null,buttons:d?[...d.querySelectorAll(s.footer+' button')].map(b=>({text:b.innerText.trim(),...r(b)})):[]}},config.selectors);
      await page.screenshot({path:join(out,`panel-${viewport.width}x${viewport.height}-editor-top.png`),fullPage:true});
      const optionsCount=before.options.length;
      tests.push({name:'Düzenleyici ve seçenek bölümleri',status:before.fieldCount>0&&optionsCount>=2?'PASS':'BELİRSİZ',expected:'Form alanları, porsiyon ve ekstra bölümleri var',actual:`${before.fieldCount} alan, ${optionsCount} seçenek bölümü`});
      const footerVisible=before.buttons.length>=2&&before.buttons.every(b=>b.top<viewport.height&&b.bottom>0);
      tests.push({name:'Kaydet/İptal ilk görünürlük',status:footerVisible?'PASS':'BELİRSİZ',expected:'Alt eylemler viewport içinde',actual:footerVisible?'ikisi de ilk görünümde':'kaydırma gerekebilir'});
      const options=await dialog.locator(config.selectors.options).count();
      const form=dialog.locator(config.selectors.form);
      await form.evaluate(e=>{e.scrollTop=e.scrollHeight});await page.waitForTimeout(150);
      const bottom=await page.evaluate(s=>{const d=document.querySelector(s.dialog),f=d?.querySelector(s.form),r=e=>{const q=e.getBoundingClientRect();return {top:q.top,bottom:q.bottom,left:q.left,right:q.right,width:q.width,height:q.height}};return {form:f?{scrollTop:f.scrollTop,scrollHeight:f.scrollHeight,clientHeight:f.clientHeight}:null,footer:d?.querySelector(s.footer)?r(d.querySelector(s.footer)):null,buttons:d?[...d.querySelectorAll(s.footer+' button')].map(r):[],options:d?[...d.querySelectorAll(s.options)].map(r):[],documentWidth:document.documentElement.scrollWidth}},config.selectors);
      await page.screenshot({path:join(out,`panel-${viewport.width}x${viewport.height}-editor-bottom.png`),fullPage:true});
      const bottomReach=bottom.form&&bottom.form.scrollTop+bottom.form.clientHeight>=bottom.form.scrollHeight-2;
      tests.push({name:'Form sonuna kaydırma',status:bottomReach?'PASS':'FAIL',expected:'Formun sonuna erişilebilir',actual:`scrollTop ${bottom.form?.scrollTop}, scrollHeight ${bottom.form?.scrollHeight}, clientHeight ${bottom.form?.clientHeight}`});
      const btns=bottom.buttons;const overlap=btns.length>=2&&btns.slice(0,2).some((a,i)=>btns.slice(i+1).some(b=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top));
      tests.push({name:'Alt düğmeler çakışması',status:btns.length>=2&&!overlap?'PASS':btns.length<2?'BELİRSİZ':'FAIL',expected:'Kaydet ve İptal ayrı dokunma alanlarında',actual:overlap?'çakışma var':`${btns.length} düğme, çakışma yok`});
      tests.push({name:'Gerçek sistem klavyesi',status:'BELİRSİZ',expected:'Android klavyesi açılıp kapanır',actual:'Playwright emülasyonu fiziksel Android klavyesini doğrulamaz'});
      // Close without editing or saving.
      const close=dialog.getByRole('button',{name:'Kapat'});if(await close.count())await close.click();else await dialog.getByRole('button',{name:/✕/}).first().click();
      results.push({kind:'Playwright emülasyonu',target:'panel',device,viewport,measurements:{before,bottom},tests,pageErrors:errors});
    }else results.push({kind:'Playwright emülasyonu',target:'panel',device,viewport,tests,pageErrors:errors});
  }
  if(scenario==='storefront'||scenario==='all'){
    const tests=[];await page.goto(url,{waitUntil:'networkidle',timeout:45000});
    const state=await page.evaluate(s=>{const filters=[...document.querySelectorAll(s.filters)];const boxes=filters.map(e=>{const r=e.getBoundingClientRect();return {text:e.innerText.trim(),x:r.x,y:r.y,width:r.width,height:r.height}});return {viewport:{width:innerWidth,height:innerHeight},documentWidth:document.documentElement.scrollWidth,categoryButtons:boxes,rows:new Set(boxes.map(x=>Math.round(x.y))).size,products:document.querySelectorAll(s.products).length}},config.selectors);
    tests.push({name:'Sayfa yatay taşma',status:state.documentWidth<=viewport.width?'PASS':'FAIL',expected:`${viewport.width}px aşılmamalı`,actual:`${state.documentWidth}px`});
    const search=page.locator(config.selectors.search);if(await search.count()){await search.fill(config.productName);const n=await page.locator(config.selectors.products).count();tests.push({name:'Menü araması',status:n>0?'PASS':'FAIL',expected:'Ürün adı eşleşmeli',actual:`${n} kart`});await search.fill('')}
    const filter=page.locator(config.selectors.filters).nth(1);if(await filter.count()){await filter.click();const pressed=await filter.getAttribute('aria-pressed');tests.push({name:'Kategori filtresi',status:pressed==='true'?'PASS':'FAIL',expected:'Seçili kategori etkin',actual:`aria-pressed=${pressed}`})}
    await page.screenshot({path:join(out,`storefront-${viewport.width}x${viewport.height}.png`),fullPage:true});
    results.push({kind:'Playwright emülasyonu',target:'storefront',device,viewport,measurements:state,tests,pageErrors:errors});
  }
  await context.close();
}
await browser.close();
await writeFile(join(out,'playwright-results.json'),JSON.stringify(results,null,2),'utf8');
console.log(JSON.stringify(results,null,2));
