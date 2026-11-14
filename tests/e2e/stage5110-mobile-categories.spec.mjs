import { test, expect } from '@playwright/test';

const names = ['Tümü','Pide','Lahmacun','Yan Ürün','İçecek'];

async function noPageOverflow(page){
  const widths = await page.evaluate(() => ({
    viewport:innerWidth,
    document:document.documentElement.scrollWidth,
    body:document.body.scrollWidth,
  }));
  expect(widths.document,JSON.stringify(widths)).toBeLessThanOrEqual(widths.viewport+2);
  expect(widths.body,JSON.stringify(widths)).toBeLessThanOrEqual(widths.viewport+2);
}

async function categoryRects(page){
  const bar=page.getByRole('group',{name:'Ürün kategorileri'});
  const buttons=bar.locator('button');
  const boxes=[];
  for(const button of await buttons.all()){
    const b=await button.boundingBox();
    expect(b).not.toBeNull();
    boxes.push(b);
  }
  const barBox=await bar.boundingBox();
  expect(barBox).not.toBeNull();
  const overflow=await bar.evaluate(el=>({
    scrollWidth:el.scrollWidth,
    clientWidth:el.clientWidth,
    scrollLeft:el.scrollLeft,
  }));
  expect(overflow.scrollWidth,JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.clientWidth+2);
  for(const b of boxes){
    expect(b.x).toBeGreaterThanOrEqual(barBox.x-2);
    expect(b.x+b.width).toBeLessThanOrEqual(barBox.x+barBox.width+2);
  }
  return {boxes,bar};
}

async function evidence(page,testInfo,label){
  await testInfo.attach(`${testInfo.project.name}-51010-${label}.png`,{
    body:await page.screenshot({fullPage:true}),
    contentType:'image/png'
  });
}

test('5.10.10: beş kategori iki satırda, tamamı görünür ve yatay kaydırma yok',async ({page},testInfo)=>{
  await page.goto('./');
  await expect(page.locator('.product-card')).toHaveCount(8);
  const {boxes,bar}=await categoryRects(page);
  await expect(bar.locator('button')).toHaveCount(5);
  for(let i=0;i<names.length;i++){
    await expect(bar.getByRole('button',{name:names[i],exact:true})).toBeVisible();
  }
  const sameRow=(a,b)=>Math.abs(a.y-b.y)<=2;
  expect(sameRow(boxes[0],boxes[1])&&sameRow(boxes[1],boxes[2]),'İlk 3 kategori aynı satırda olmalı').toBe(true);
  expect(sameRow(boxes[3],boxes[4]),'Son 2 kategori aynı satırda olmalı').toBe(true);
  expect(boxes[3].y).toBeGreaterThan(boxes[0].y+boxes[0].height-2);
  expect(Math.abs(boxes[3].width-boxes[4].width)).toBeLessThanOrEqual(2);
  await expect(bar.getByRole('button',{name:'Tümü',exact:true})).toHaveAttribute('aria-pressed','true');
  await noPageOverflow(page);
  await evidence(page,testInfo,'iki-satir-bes-kategori');
});

test('5.10.10: içecek ve pide kategorileri aramayla birlikte doğru çalışır',async ({page},testInfo)=>{
  await page.goto('./');
  await expect(page.locator('.product-card')).toHaveCount(8);
  const bar=page.getByRole('group',{name:'Ürün kategorileri'});
  await bar.getByRole('button',{name:'İçecek',exact:true}).click();
  await expect(bar.getByRole('button',{name:'İçecek',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.product-card')).toHaveCount(2);
  await expect(page.getByRole('heading',{name:'Ayran'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Maden Suyu'})).toBeVisible();
  await page.getByRole('searchbox',{name:'Menüde ara'}).fill('Ayran');
  await expect(page.locator('.product-card')).toHaveCount(1);
  await bar.getByRole('button',{name:'Pide',exact:true}).click();
  await expect(page.locator('.product-card')).toHaveCount(0);
  await page.getByRole('searchbox',{name:'Menüde ara'}).fill('');
  await expect(page.locator('.product-card')).toHaveCount(3);
  await bar.getByRole('button',{name:'Tümü',exact:true}).click();
  await expect(page.locator('.product-card')).toHaveCount(8);
  await categoryRects(page);
  await noPageOverflow(page);
  await evidence(page,testInfo,'kategori-arama');
});

test('5.10.10: yeni ve uzun kategoriler eklendiğinde mobil grid taşmadan büyür',async ({page,context},testInfo)=>{
  await page.goto('./panel/');
  await expect(page.locator('.admin-mobile-product')).toHaveCount(8);
  await page.getByRole('button',{name:/Kategoriler/}).click();
  for(const name of ['Tatlılar','Günün Çok Uzun Özel Lezzetleri']){
    await page.locator('#new-category').fill(name);
    await page.getByRole('button',{name:/Kategori ekle/}).click();
  }
  await expect(page.locator('.admin-category-row')).toHaveCount(6);
  const customer=await context.newPage();
  await customer.goto('./');
  await expect(customer.locator('.product-card')).toHaveCount(8);
  const {boxes,bar}=await categoryRects(customer);
  await expect(bar.locator('button')).toHaveCount(7);
  expect(boxes[6].y).toBeGreaterThan(boxes[3].y+boxes[3].height-2);
  expect(boxes[6].width,'Tek kalan uzun kategori tam satırı kaplamalı').toBeGreaterThan(boxes[0].width*2.5);
  await expect(bar.getByRole('button',{name:'Günün Çok Uzun Özel Lezzetleri'})).toBeVisible();
  await bar.getByRole('button',{name:'Günün Çok Uzun Özel Lezzetleri'}).click();
  await expect(customer.locator('.product-card')).toHaveCount(0);
  await bar.getByRole('button',{name:'Tümü',exact:true}).click();
  await expect(customer.locator('.product-card')).toHaveCount(8);
  await noPageOverflow(customer);
  await evidence(customer,testInfo,'dinamik-yedi-kategori');
});
