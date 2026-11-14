import {test,expect} from '@playwright/test';

async function noOverflow(page){
  const sizes=await page.evaluate(()=>({width:innerWidth,doc:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
  expect(sizes.doc,JSON.stringify(sizes)).toBeLessThanOrEqual(sizes.width+2);
  expect(sizes.body,JSON.stringify(sizes)).toBeLessThanOrEqual(sizes.width+2);
}
async function capture(page,testInfo,label){
  await testInfo.attach(`${testInfo.project.name}-5109-${label}.png`,{body:await page.screenshot({fullPage:false}),contentType:'image/png'});
}

test('5.10.9: mobil kartlarda görünür/gizli filtre ve arama birlikte çalışır',async ({page},testInfo)=>{
  await page.goto('./panel/');
  const cards=page.locator('.admin-mobile-product');
  await expect(cards).toHaveCount(8);
  await expect(page.locator('.admin-mobile-count')).toHaveText('8 / 8 ürün gösteriliyor');
  await expect(page.getByRole('button',{name:'Tüm ürünler'})).toHaveAttribute('aria-pressed','true');
  await noOverflow(page);
  await capture(page,testInfo,'panel-ilk-ekran');
  await page.getByRole('button',{name:'Gizli ürünler'}).click();
  await expect(cards).toHaveCount(0);
  await expect(page.locator('.admin-mobile-count')).toHaveText('0 / 8 ürün gösteriliyor');
  await page.getByRole('button',{name:'Tüm ürünler'}).click();
  await page.getByRole('button',{name:'Kıymalı Pide: görünür, gizlemek için tıkla'}).click();
  await page.getByRole('button',{name:'Gizli ürünler'}).click();
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('Kıymalı Pide');
  await page.getByRole('searchbox',{name:'Ürün ara'}).fill('Kaşarlı');
  await expect(cards).toHaveCount(0);
  await page.getByRole('searchbox',{name:'Ürün ara'}).fill('Kıymalı');
  await expect(cards).toHaveCount(1);
  await capture(page,testInfo,'gizli-filtre');
  await page.getByRole('button',{name:'Görünür ürünler'}).click();
  await expect(cards).toHaveCount(0);
  await page.getByRole('searchbox',{name:'Ürün ara'}).fill('');
  await expect(cards).toHaveCount(7);
  await noOverflow(page);
});

test('5.10.9: değişiklik uyarısı, İptal ve Kaydet gerçek ürün düzenleme akışını korur',async ({page},testInfo)=>{
  await page.goto('./panel/');
  await expect(page.locator('.admin-mobile-product')).toHaveCount(8);
  await page.getByRole('button',{name:'Kıymalı Pide düzenle'}).click();
  const editor=page.getByRole('dialog',{name:'Ürün düzenle'});
  const input=editor.getByRole('textbox',{name:'Menüde görünen satış fiyatı'});
  const cancel=editor.locator('.admin-dialog-footer').getByRole('button',{name:'İptal'});
  const save=editor.locator('.admin-dialog-footer').getByRole('button',{name:'Ürünü kaydet'});
  await expect(cancel).toBeVisible();
  await expect(save).toBeVisible();
  await input.fill('00230,50');
  await expect(input).toHaveValue('230,50');
  page.once('dialog',d=>d.dismiss());
  await cancel.click();
  await expect(editor).toBeVisible();
  await expect(input).toHaveValue('230,50');
  page.once('dialog',d=>d.accept());
  await cancel.click();
  await expect(editor).toHaveCount(0);
  await page.getByRole('button',{name:'Kıymalı Pide düzenle'}).click();
  await expect(input).toHaveValue('215');
  await input.fill('00230,50');
  await capture(page,testInfo,'editor-kaydet');
  await save.click();
  await expect(editor).toHaveCount(0);
  await expect(page.locator('.admin-mobile-product').filter({hasText:'Kıymalı Pide'}).first()).toContainText('230,50');
  await page.reload();
  await expect(page.locator('.admin-mobile-product').filter({hasText:'Kıymalı Pide'}).first()).toContainText('230,50');
  const customer=await page.context().newPage();
  await customer.goto('./');
  const pide=customer.locator('.product-card').filter({has:customer.getByRole('heading',{name:'Kıymalı Pide'})});
  await expect(pide.locator('.product-price')).toContainText('230,50');
  await noOverflow(page);
});

test('5.10.9: 320-430 px kompakt başlık ve kısa ekranda form düğmeleri erişilir',async ({page},testInfo)=>{
  await page.goto('./panel/');
  await expect(page.locator('.admin-mobile-product')).toHaveCount(8);
  if(page.viewportSize().width<=360){
    const heading=await page.locator('.admin-top h1').boundingBox();
    const back=await page.locator('.admin-top-link').first().boundingBox();
    expect(heading).not.toBeNull();
    expect(back).not.toBeNull();
    const overlaps=heading.x<back.x+back.width && heading.x+heading.width>back.x && heading.y<back.y+back.height && heading.y+heading.height>back.y;
    expect(overlaps,'Başlık ve Siteye dön düğmesi çakışmamalı').toBe(false);
  }
  const nav=page.locator('.admin-sidebar');
  const navBox=await nav.boundingBox();
  expect(navBox).not.toBeNull();
  expect(navBox.height).toBeLessThan(210);
  const search=await page.getByRole('searchbox',{name:'Ürün ara'}).boundingBox();
  const backup=await page.getByRole('button',{name:/Demo yedeğini indir/}).boundingBox();
  expect(search).not.toBeNull();
  expect(backup).not.toBeNull();
  expect(search.y).toBeLessThan(backup.y);
  const filterButtons=page.locator('.admin-mobile-visibility button');
  await expect(filterButtons).toHaveCount(3);
  for(const button of await filterButtons.all()){
    const bounds=await button.boundingBox();
    expect(bounds.height).toBeGreaterThanOrEqual(44);
  }
  await noOverflow(page);
  await page.getByRole('button',{name:'Kıymalı Pide düzenle'}).click();
  const editor=page.getByRole('dialog',{name:'Ürün düzenle'});
  const viewportWidth=page.viewportSize().width;
  await page.setViewportSize({width:viewportWidth,height:560});
  await editor.locator('.admin-form').evaluate(el=>{el.scrollTop=el.scrollHeight;});
  const footer=editor.locator('.admin-dialog-footer');
  await expect(footer.getByRole('button',{name:'İptal'})).toBeVisible();
  await expect(footer.getByRole('button',{name:'Ürünü kaydet'})).toBeVisible();
  const rect=await footer.boundingBox();
  expect(rect).not.toBeNull();
  expect(rect.y).toBeGreaterThanOrEqual(0);
  expect(rect.y+rect.height).toBeLessThanOrEqual(561);
  await capture(page,testInfo,'kisa-ekran-editor');
  await noOverflow(page);
});
