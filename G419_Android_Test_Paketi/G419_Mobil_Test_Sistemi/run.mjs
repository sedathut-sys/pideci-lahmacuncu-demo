#!/usr/bin/env node
import {createRequire} from 'node:module';
import {resolve, join} from 'node:path';
import {mkdir, writeFile} from 'node:fs/promises';

function arg(name, fallback) { const i=process.argv.indexOf(name); return i >= 0 ? process.argv[i+1] : fallback; }
const project=resolve(arg('--project', 'C:/Users/PC/TasFirin-G418-Test'));
const baseURL=arg('--url', 'http://127.0.0.1:4321/pideci-lahmacuncu-demo/');
const out=resolve(arg('--out', '../G419_Test_Kanitlari'));
const executablePath=arg('--browser', 'C:/Program Files/Google/Chrome/Application/chrome.exe');
const require=createRequire(join(project, 'package.json'));
const {chromium}=require('playwright');
await mkdir(out,{recursive:true});
const results=[];
const browser=await chromium.launch({headless:true,executablePath});
for (const viewport of [{width:320,height:560},{width:320,height:720},{width:390,height:844}]) {
  const context=await browser.newContext({viewport,deviceScaleFactor:1,isMobile:true,hasTouch:true,locale:'tr-TR'});
  const page=await context.newPage();
  const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
  const base=baseURL.endsWith('/')?baseURL:baseURL+'/';
  await page.goto(base,{waitUntil:'networkidle',timeout:45000});
  await page.locator('.products-grid').waitFor({state:'attached',timeout:15000}).catch(()=>{});
  const storefront=await page.evaluate(()=>{
    const cats=[...document.querySelectorAll('.filters .filter')];
    const grid=document.querySelector('.filters');
    const rects=cats.map(x=>{const r=x.getBoundingClientRect();return {text:x.textContent.trim(),x:r.x,y:r.y,width:r.width,height:r.height,scrollWidth:x.scrollWidth,clientWidth:x.clientWidth}});
    const rows=[...new Set(rects.map(r=>Math.round(r.y)))];
    return {title:document.title,viewport:{width:innerWidth,height:innerHeight},screen:{width:screen.width,height:screen.height},document:{clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth},categories:rects,categoryCount:cats.length,categoryRows:rows.length,filterScrollWidth:grid?.scrollWidth,filterClientWidth:grid?.clientWidth,products:document.querySelectorAll('.product-card').length,descriptions:[...document.querySelectorAll('.product-card p')].map(p=>({text:p.textContent.trim(),scrollWidth:p.scrollWidth,clientWidth:p.clientWidth,scrollHeight:p.scrollHeight,clientHeight:p.clientHeight})).slice(0,8)};
  });
  const checks=[];
  const search=page.getByRole('searchbox',{name:'Menüde ara'});
  if(await search.count()) { await search.fill('Kıymalı'); const count=await page.locator('.product-card').count(); checks.push({name:'Menü araması',expected:'Kıymalı Pide eşleşmesi',actual:`${count} kart`,status:count>0?'PASS':'FAIL'}); await search.fill(''); }
  const firstCat=page.locator('.filters .filter').nth(0);
  if(await firstCat.count()){ const name=(await firstCat.textContent()).trim(); await firstCat.click(); const active=await firstCat.getAttribute('aria-pressed'); checks.push({name:'Kategori seçimi',expected:'aria-pressed=true',actual:`${name}: ${active}`,status:active==='true'?'PASS':'FAIL'}); }
  checks.push({name:'Yatay taşma',expected:'document scrollWidth <= viewport',actual:`${storefront.document.scrollWidth} / ${storefront.viewport.width}`,status:storefront.document.scrollWidth<=storefront.viewport.width?'PASS':'FAIL'});
  const filename=`playwright-${viewport.width}x${viewport.height}.png`;
  await page.screenshot({path:join(out,filename),fullPage:true});
  results.push({kind:'Playwright emülasyonu',viewport,...storefront,checks,pageErrors:errors,screenshot:filename});
  await context.close();
}
await browser.close();
await writeFile(join(out,'playwright-results.json'),JSON.stringify(results,null,2),'utf8');
console.log(JSON.stringify(results,null,2));
