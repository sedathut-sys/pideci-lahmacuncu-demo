import {test,expect} from '@playwright/test';

async function evidence(page,testInfo,name){
  await testInfo.attach(`${testInfo.project.name}-${name}.png`,{
    body:await page.screenshot({fullPage:true}),contentType:'image/png'
  });
}
test('SSR: güncel veri okunmadan varsayılan 8 ürün ve kategori görünmez',async ({request})=>{
  const response=await request.get('./');
  expect(response.ok()).toBe(true);
  const html=await response.text();
  expect(html).toContain('Menü hazırlanıyor');
  expect(html).not.toMatch(/class="product-card"/);
  expect(html).not.toMatch(/aria-label="Ürün kategorileri"/);
});
test('İlk yeni sekmede panelde eklenen ürün ve kategori doğru açılır',async ({page,context},testInfo)=>{
  await page.goto('./panel/');
  await expect(page.locator('.admin-mobile-product')).toHaveCount(8);
  await page.getByRole('button',{name:/Kategoriler/}).click();
  await page.locator('#new-category').fill('QA YENI KATEGORI');
  await page.getByRole('button',{name:/Kategori ekle/}).click();
  await expect(page.locator('.admin-category-row')).toHaveCount(5);
  await page.getByRole('button',{name:/Ürünler ve menü/}).click();
  await page.getByRole('button',{name:/Yeni ürün/}).click();
  const editor=page.getByRole('dialog',{name:'Ürün oluştur'});
  await editor.getByPlaceholder('Kıymalı Pide').fill('QA YENI MENU');
  await editor.locator('select').first().selectOption('QA YENI KATEGORI');
  await editor.getByRole('textbox',{name:'Menüde görünen satış fiyatı'}).fill('125,49');
  await editor.locator('.admin-dialog-footer').getByRole('button',{name:'Ürünü kaydet'}).click();
  await expect(page.locator('.admin-mobile-product')).toHaveCount(9);
  const fresh=await context.newPage();
  await fresh.goto('./');
  await expect(fresh.locator('.product-card')).toHaveCount(9);
  await expect(fresh.getByRole('button',{name:'QA YENI KATEGORI'})).toBeVisible();
  const card=fresh.locator('.product-card').filter({has:fresh.getByRole('heading',{name:'QA YENI MENU'})});
  await expect(card.locator('.product-price')).toContainText('125,49');
  await evidence(fresh,testInfo,'ilk-yeni-sekme');
  await fresh.reload();
  await expect(fresh.locator('.product-card')).toHaveCount(9);
  await expect(fresh.getByRole('button',{name:'QA YENI KATEGORI'})).toBeVisible();
});
test('İki sekmede fiyat değişimi ve sipariş öncesi sepet yenileme',async ({page,context},testInfo)=>{
  await page.goto('./panel/');
  const customer=await context.newPage();
  await customer.goto('./');
  await expect(customer.locator('.product-card')).toHaveCount(8);
  const editPrice=async price=>{
    await page.getByRole('button',{name:'Kıymalı Pide düzenle'}).click();
    const editor=page.getByRole('dialog',{name:'Ürün düzenle'});
    await editor.getByRole('textbox',{name:'Menüde görünen satış fiyatı'}).fill(price);
    await editor.locator('.admin-dialog-footer').getByRole('button',{name:'Ürünü kaydet'}).click();
    await expect(editor).toHaveCount(0);
  };
  const pideCard=customer.locator('.product-card').filter({has:customer.getByRole('heading',{name:'Kıymalı Pide'})});
  await editPrice('225');
  await expect(pideCard.locator('.product-price')).toContainText('225,00');
  await customer.getByRole('button',{name:'Kıymalı Pide sepete ekle'}).click();
  await customer.getByRole('dialog',{name:'Kıymalı Pide seçenekleri'}).getByRole('button',{name:/Sepete ekle/}).click();
  await customer.locator('.mobile-cart-bar').getByRole('button',{name:/Sepeti Gör/i}).click();
  const cart=customer.getByRole('dialog',{name:'Sepetim'});
  await expect(cart.locator('.cart-total strong')).toContainText('225,00');
  await editPrice('235');
  await expect(pideCard.locator('.product-price')).toContainText('235,00');
  await cart.getByRole('button',{name:/Sipariş mesajını görüntüle/}).click();
  await expect(cart.getByRole('alert')).toContainText('Ürün fiyatları güncellendi');
  await expect(cart.locator('.cart-total strong')).toContainText('235,00');
  await cart.getByRole('button',{name:/Gel-al/}).click();
  await cart.getByPlaceholder('Adınızı yazın').fill('QA Denetim');
  await cart.getByRole('button',{name:/Sipariş mesajını görüntüle/}).click();
  await expect(cart.locator('.message-preview pre')).toContainText('235,00');
  await evidence(customer,testInfo,'sekme-fiyat-sepet');
});
