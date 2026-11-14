import {test,expect} from '@playwright/test';
import {BASE_URL,G8Monitor,isBlocking} from './collector.mjs';

async function audit(page,info,{scenario,path,selector}){
  const observer=new G8Monitor(page,{scenario});
  try{
    await page.goto(path,{waitUntil:'domcontentloaded'});
    await expect(page.locator(selector)).toHaveCount(8);
    await observer.inspectBlank({selector});
    await observer.inspectImages();
    await observer.inspectLinks();
  }catch(err){
    observer.add({kind:'test',url:page.url()||BASE_URL,message:err.message});
    throw err;
  }finally{
    await observer.save(info);
  }
  const blocking=observer.issues.filter(isBlocking);
  expect(blocking,JSON.stringify(blocking,null,2)).toEqual([]);
}

test('G8 gerçek müşteri: konsol, ağ, görsel, bağlantı, boş sayfa',async ({page},info)=>{
  await audit(page,info,{scenario:'musteri',path:'./',selector:'.product-card'});
});
test('G8 gerçek panel: konsol, ağ, görsel, bağlantı, boş sayfa',async ({page},info)=>{
  await audit(page,info,{scenario:'panel',path:'./panel/',selector:'.admin-mobile-product'});
});

test('G8 sentetik hata: olayların gerçekten algılanması (gerçek site bulgusu değildir)',async ({page},info)=>{
  test.skip(info.project.name!=='mobil-390px','Sentetik test tek profil üzerinde çalıştırılır.');
  const observer=new G8Monitor(page,{scenario:'sentetik',simulation:true});
  await page.goto('./');
  await expect(page.locator('.product-card')).toHaveCount(8);

  await page.evaluate(()=>console.error('G8_SENTETIK_KONSOL'));
  const thrown=page.waitForEvent('pageerror');
  await page.evaluate(()=>setTimeout(()=>{throw new Error('G8_SENTETIK_JAVASCRIPT')},0));
  await thrown;

  await page.route('**/g8-sentetik-404.png',route=>route.fulfill({
    status:404,contentType:'image/png',body:'not-found',
  }));
  await page.evaluate(()=>{
    const image=document.createElement('img');
    image.src='/pideci-lahmacuncu-demo/g8-sentetik-404.png';
    image.alt='G8 sentetik hatalı görsel';
    document.body.appendChild(image);
  });
  await page.locator('img[src$="g8-sentetik-404.png"]').evaluate(img=>new Promise(done=>{
    if(img.complete){done();return;}
    img.addEventListener('error',()=>done(),{once:true});
    img.addEventListener('load',()=>done(),{once:true});
  }));
  await observer.inspectImages();

  await page.route('https://g8-external.example.invalid/mock',route=>route.abort('failed'));
  await page.evaluate(()=>fetch('https://g8-external.example.invalid/mock').catch(()=>null));
  await page.setContent('<html><body></body></html>');
  await observer.inspectBlank({selector:'.product-card'});
  const observations=await observer.save(info);
  const issues=observations.bulgular;
  expect(issues.some(x=>x.kind==='javascript'&&x.aciklama.includes('G8_SENTETIK_JAVASCRIPT'))).toBe(true);
  expect(issues.some(x=>x.kind==='console'&&x.aciklama.includes('G8_SENTETIK_KONSOL'))).toBe(true);
  expect(issues.some(x=>x.kind==='http'&&x.durum===404&&x.kaynak==='uygulama')).toBe(true);
  expect(issues.some(x=>x.kind==='image'&&x.oncelik==='yüksek')).toBe(true);
  expect(issues.some(x=>x.kind==='network'&&x.kaynak==='harici')).toBe(true);
  expect(issues.some(x=>x.kind==='empty'&&x.oncelik==='kritik')).toBe(true);
});
