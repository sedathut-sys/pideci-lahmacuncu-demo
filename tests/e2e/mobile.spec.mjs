import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

async function capture(page,testInfo,label){
  await testInfo.attach(`${testInfo.project.name}-${label}.png`,{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
}
async function noHorizontalOverflow(page){
  const dimensions=await page.evaluate(()=>({viewport:window.innerWidth,document:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
  expect(dimensions.document,JSON.stringify(dimensions)).toBeLessThanOrEqual(dimensions.viewport+2);
}

test('Müşteri: mobil menü, fotoğraflar, arama ve yatay taşma',async ({page},testInfo)=>{
  await page.goto('./');
  await expect(page.locator('.product-card')).toHaveCount(8);
  await expect(page.getByRole('heading',{name:'Kıymalı Pide'})).toBeVisible();
  const firstPhoto=page.locator('.product-card img').first();
  await firstPhoto.scrollIntoViewIfNeeded();
  await expect.poll(()=>firstPhoto.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
  await noHorizontalOverflow(page);
  await capture(page,testInfo,'musteri-menu');
  await page.getByRole('searchbox',{name:'Menüde ara'}).fill('Kıymalı');
  await expect(page.locator('.product-card')).toHaveCount(1);
  await expect(page.getByRole('heading',{name:'Kıymalı Pide'})).toBeVisible();
});

test('Müşteri: 215+35+25, iki adet, 550 TL sepet ve gel-al',async ({page},testInfo)=>{
  await page.goto('./');
  await expect(page.locator('.product-card')).toHaveCount(8);
  await page.getByRole('button',{name:'Kıymalı Pide sepete ekle'}).click();
  const dialog=page.getByRole('dialog',{name:'Kıymalı Pide seçenekleri'});
  await expect(dialog).toBeVisible();
  await dialog.getByRole('checkbox').nth(0).check();
  await dialog.getByRole('checkbox').nth(1).check();
  await dialog.getByRole('button',{name:'Ürün adetini artır'}).click();
  await expect(dialog.locator('.option-summary strong')).toContainText('550,00');
  await capture(page,testInfo,'urun-secenekleri');
  await dialog.getByRole('button',{name:/Sepete ekle/}).click();
  await page.getByRole('button',{name:/Sepeti aç/}).click();
  const cart=page.getByRole('dialog',{name:'Sepetim'});
  await expect(cart).toBeVisible();
  await expect(cart.locator('.cart-total strong')).toContainText('550,00');
  await cart.getByRole('button',{name:/Gel-al/}).click();
  await expect(cart.getByPlaceholder('Mahalle, sokak, bina, daire...')).toHaveCount(0);
  await capture(page,testInfo,'sepet-gelal');
  await noHorizontalOverflow(page);
  // Demo testi gerçek WhatsApp siparişi göndermez.
});

test('Panel: ürün oluşturma, kuruşlu fiyat, yenileme ve diğer sekmede menü',async ({page,context},testInfo)=>{
  await page.goto('./panel/');
  await expect(page.locator('.admin-mobile-product')).toHaveCount(8);
  await noHorizontalOverflow(page);
  await capture(page,testInfo,'panel-urunler');
  await page.getByRole('button',{name:/Yeni ürün/}).click();
  const editor=page.getByRole('dialog',{name:'Ürün oluştur'});
  await expect(editor).toBeVisible();
  await editor.getByPlaceholder('Kıymalı Pide').fill('QA MOBİL TEST');
  await editor.getByRole('textbox',{name:'Menüde görünen satış fiyatı'}).fill('0020,49');
  await expect(editor.getByRole('textbox',{name:'Menüde görünen satış fiyatı'})).toHaveValue('20,49');
  await capture(page,testInfo,'panel-urun-formu');
  await editor.locator('.admin-dialog-footer').getByRole('button',{name:'Ürünü kaydet'}).click();
  await expect(page.locator('.admin-mobile-product')).toHaveCount(9);
  const customer=await context.newPage();
  await customer.goto('./');
  await expect(customer.locator('.product-card')).toHaveCount(9);
  await expect(customer.getByRole('heading',{name:'QA MOBİL TEST'})).toBeVisible();
  const card=customer.locator('.product-card').filter({has:customer.getByRole('heading',{name:'QA MOBİL TEST'})});
  await expect(card.locator('.product-price')).toContainText('20,49');
  await capture(customer,testInfo,'panel-musteri-senkron');
  await page.reload();
  await expect(page.locator('.admin-mobile-product')).toHaveCount(9);
});

test('Panel: kategori ve JSON yedek geri yükleme',async ({page},testInfo)=>{
  await page.goto('./panel/');
  await expect(page.locator('.admin-mobile-product')).toHaveCount(8);
  const downloadWait=page.waitForEvent('download');
  await page.getByRole('button',{name:/Demo yedeğini indir/}).click();
  const backup=await downloadWait;
  expect(backup.suggestedFilename()).toMatch(/\.json$/);
  const original=await readFile(await backup.path());
  const data=JSON.parse(original.toString('utf8'));
  expect(data.products).toHaveLength(8);
  await page.getByRole('button',{name:/Kategoriler/}).click();
  await page.locator('#new-category').fill('QA MOBİL DENEME');
  await page.getByRole('button',{name:/Kategori ekle/}).click();
  await expect(page.locator('.admin-category-row')).toHaveCount(5);
  await page.getByRole('button',{name:/Ürünler ve menü/}).click();
  page.once('dialog',d=>d.accept());
  await page.getByLabel('Demo JSON yedeği seç').setInputFiles({name:'tas-firin-demo-yedek.json',mimeType:'application/json',buffer:original});
  await expect(page.locator('.admin-notice')).toContainText('Yedek doğrulandı ve geri yüklendi');
  await page.getByRole('button',{name:/Kategoriler/}).click();
  await expect(page.locator('.admin-category-row')).toHaveCount(4);
  await capture(page,testInfo,'yedek-geri-yukleme');
});
