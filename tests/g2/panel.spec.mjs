import {test,expect} from '@playwright/test';
import {
  openPanel,openStore,productAction,newEditor,editEditor,saveEditor,
  nameInput,priceInput,createProduct,downloadBackup,restoreBackup,
  openCategories,addCategory,makePng,
} from './helpers.mjs';

// Her Playwright testi kendi boş BrowserContext + localStorage alanı ile başlar.
// Sadece PUBLIC_DATA_MODE=demo altında; üretim paneline ağ isteği gönderilmez.
test('G2-01 ürün oluşturma: 20,49 TL, müşteri görünümü, yeni sekme ve yenileme',async ({page,context},info)=>{
  await openPanel(page);
  const name=await createProduct(page,{name:'G2 YENİ ÜRÜN',price:'0020,49'});
  await expect(page.locator('.admin-mobile-product')).toHaveCount(9);
  const backup=await downloadBackup(page);
  expect(backup.products.find(p=>p.name===name).price).toBe(20.49);
  const customer=await context.newPage();
  await customer.goto('./');
  await expect(customer.locator('.product-card')).toHaveCount(9);
  const card=customer.locator('.product-card').filter({has:customer.getByRole('heading',{name})});
  await expect(card.locator('.product-price')).toContainText('20,49');
  await page.reload();
  await expect(page.locator('.admin-mobile-product')).toHaveCount(9);
  await customer.reload();
  await expect(customer.getByRole('heading',{name})).toBeVisible();
});

test('G2-02 olumsuz: eksik ürün adı ve geçersiz fiyat kayda geçmez',async ({page})=>{
  await openPanel(page);
  const editor=await newEditor(page);
  await priceInput(editor).fill('60,49');
  await editor.locator('.admin-dialog-footer').getByRole('button',{name:'Ürünü kaydet'}).click();
  await expect(editor.getByRole('alert')).toContainText('Ürün adı en az iki karakter');
  await nameInput(editor).fill('G2 AD KONTROL');
  await priceInput(editor).fill('');
  await editor.locator('.admin-dialog-footer').getByRole('button',{name:'Ürünü kaydet'}).click();
  await expect(editor.getByRole('alert')).toContainText('Satış fiyatı');
  await expect(page.locator('.admin-mobile-product')).toHaveCount(8);
});

test('G2-03 mevcut fiyat düzenlemesi: 215→234,75 TL, açık müşteri sekmesi ve yenileme',async ({page,context},info)=>{
  await openPanel(page);
  const customer=await context.newPage();
  await openStore(customer);
  const editor=await editEditor(page,info);
  await priceInput(editor).fill('234,75');
  await saveEditor(page,editor);
  const card=customer.locator('.product-card').filter({has:customer.getByRole('heading',{name:'Kıymalı Pide'})});
  await expect(card.locator('.product-price')).toContainText('234,75');
  await page.reload();
  const backup=await downloadBackup(page);
  expect(backup.products.find(p=>p.name==='Kıymalı Pide').price).toBe(234.75);
});

test('G2-04 silme: ilk onay reddedilir, ikinci kabul edilir ve kalıcıdır',async ({page},info)=>{
  await openPanel(page);
  page.once('dialog',d=>d.dismiss());
  await productAction(page,info,'Kıymalı Pide','delete').click();
  await expect(page.locator('.admin-mobile-product')).toHaveCount(8);
  page.once('dialog',d=>d.accept());
  await productAction(page,info,'Kıymalı Pide','delete').click();
  await expect(page.locator('.admin-mobile-product')).toHaveCount(7);
  await page.reload();
  await expect(page.locator('.admin-mobile-product')).toHaveCount(7);
  const backup=await downloadBackup(page);
  expect(backup.products.some(p=>p.name==='Kıymalı Pide')).toBe(false);
});

test('G2-05 ürünü gizle/göster: müşteri menüsü, durum ve kalıcılık',async ({page,context},info)=>{
  await openPanel(page);
  const customer=await context.newPage();
  await openStore(customer);
  await productAction(page,info,'Kıymalı Pide','status').click();
  await expect(page.locator('.admin-mobile-product').filter({hasText:'Kıymalı Pide'}).locator('.status-pill')).toContainText('Gizli');
  await expect(customer.getByRole('heading',{name:'Kıymalı Pide'})).toHaveCount(0);
  await customer.reload();
  await expect(customer.locator('.product-card')).toHaveCount(7);
  await productAction(page,info,'Kıymalı Pide','status').click();
  await expect(customer.getByRole('heading',{name:'Kıymalı Pide'})).toBeVisible();
  await page.reload();
  const backup=await downloadBackup(page);
  expect(backup.products.find(p=>p.name==='Kıymalı Pide').available).toBe(true);
});

test('G2-06 porsiyon ve ekstra malzeme: fiyat senkronu, mükerrer seçenek reddi',async ({page,context})=>{
  await openPanel(page);
  const editor=await newEditor(page);
  await nameInput(editor).fill('G2 SEÇENEKLİ PİDE');
  await priceInput(editor).fill('249,49');
  await editor.getByRole('button',{name:/Porsiyon ekle/}).click();
  await editor.getByRole('textbox',{name:'1. porsiyon adı'}).fill('Normal');
  await editor.getByRole('button',{name:/Porsiyon ekle/}).click();
  await editor.getByRole('textbox',{name:'2. porsiyon adı'}).fill('Büyük');
  await editor.getByRole('textbox',{name:'Büyük fiyatı'}).fill('329,99');
  await editor.getByRole('button',{name:/Ekstra ekle/}).click();
  await editor.getByRole('textbox',{name:'1. ekstra adı'}).fill('Kaşar');
  await editor.getByRole('textbox',{name:'Kaşar fiyatı'}).fill('35,50');
  await editor.getByRole('button',{name:/Ekstra ekle/}).click();
  await editor.getByRole('textbox',{name:'2. ekstra adı'}).fill('Kaşar');
  await editor.locator('.admin-dialog-footer').getByRole('button',{name:'Ürünü kaydet'}).click();
  await expect(editor.getByRole('alert')).toContainText('Aynı porsiyon veya ekstra seçenek');
  await editor.locator('fieldset').filter({hasText:'Ekstra malzemeler'}).getByRole('button',{name:'Ekstrayı sil'}).last().click();
  await saveEditor(page,editor);
  const backup=await downloadBackup(page);
  const product=backup.products.find(p=>p.name==='G2 SEÇENEKLİ PİDE');
  expect(product.price).toBe(249.49);
  expect(product.variants).toEqual([{label:'Normal',price:249.49},{label:'Büyük',price:329.99}]);
  expect(product.extras).toEqual([{label:'Kaşar',price:35.5}]);
  const customer=await context.newPage();await customer.goto('./');
  await expect(customer.getByRole('heading',{name:'G2 SEÇENEKLİ PİDE'})).toBeVisible();
  await customer.getByRole('button',{name:'G2 SEÇENEKLİ PİDE sepete ekle'}).click();
  await expect(customer.getByRole('dialog',{name:'G2 SEÇENEKLİ PİDE seçenekleri'})).toContainText('Büyük');
});

test('G2-07 kategori ekleme, Türkçe büyük/küçük harf tekrarını reddetme ve silme',async ({page})=>{
  await openPanel(page);
  await openCategories(page);
  await addCategory(page,'G2 Kategori');
  await expect(page.locator('.admin-category-row')).toHaveCount(5);
  await addCategory(page,'g2 kategori');
  await expect(page.getByRole('alert')).toContainText('Aynı kategori');
  await expect(page.locator('.admin-category-row')).toHaveCount(5);
  page.once('dialog',d=>d.accept());
  await page.locator('.admin-category-row').filter({hasText:'G2 Kategori'}).getByRole('button',{name:'Kategoriyi sil'}).click();
  await expect(page.locator('.admin-category-row')).toHaveCount(4);
  await page.reload();
  await page.getByRole('button',{name:/Kategoriler/}).click();
  await expect(page.locator('.admin-category-row')).toHaveCount(4);
});

test('G2-08 ürün bağlı kategori kilidi; kategori ve ürünün birlikte saklanması',async ({page},info)=>{
  await openPanel(page);
  await openCategories(page);
  const row=page.locator('.admin-category-row').filter({hasText:'Pide'}).first();
  await expect(row.getByRole('button',{name:'Kategoriyi sil'})).toBeDisabled();
  await addCategory(page,'G2 ÖZEL KATEGORİ');
  await page.getByRole('button',{name:/Ürünler ve menü/}).click();
  const editor=await editEditor(page,info);
  await editor.locator('.admin-form label').filter({hasText:'Kategori'}).locator('select').selectOption('G2 ÖZEL KATEGORİ');
  await saveEditor(page,editor);
  const backup=await downloadBackup(page);
  expect(backup.settings.categories).toContain('G2 ÖZEL KATEGORİ');
  expect(backup.products.find(p=>p.name==='Kıymalı Pide').category).toBe('G2 ÖZEL KATEGORİ');
  await page.getByRole('button',{name:/Kategoriler/}).click();
  await expect(page.locator('.admin-category-row').filter({hasText:'G2 ÖZEL KATEGORİ'}).getByRole('button',{name:'Kategoriyi sil'})).toBeDisabled();
});

test('G2-09 hazır fotoğraf değişimi kayıttan önce uygulanmaz; kayıttan sonra kalıcı',async ({page,context},info)=>{
  await openPanel(page);
  const editor=await editEditor(page,info);
  const select=editor.locator('.admin-form label').filter({hasText:'Fotoğraf seç'}).locator('select');
  await select.selectOption('/images/lahmacun.svg');
  await expect(editor.locator('.admin-edit-preview')).toHaveAttribute('src',/lahmacun.svg/);
  const customer=await context.newPage();await openStore(customer);
  const before=customer.locator('.product-card').filter({has:customer.getByRole('heading',{name:'Kıymalı Pide'})}).locator('img');
  await expect(before).not.toHaveAttribute('src',/lahmacun.svg/);
  await saveEditor(page,editor);
  await expect(before).toHaveAttribute('src',/lahmacun.svg/);
  await page.reload();
  const backup=await downloadBackup(page);
  expect(backup.products.find(p=>p.name==='Kıymalı Pide').image).toBe('/images/lahmacun.svg');
});

test('G2-10 gerçek PNG yükleme: önizleme, sıkıştırma, tarayıcıya kaydetme',async ({page,context},info)=>{
  await openPanel(page);
  const editor=await editEditor(page,info);
  const file=await makePng(page);
  await editor.locator('input[type=file]').setInputFiles({name:'g2-test.png',mimeType:'image/png',buffer:file});
  await expect(editor.locator('.admin-upload-status')).toContainText('Yeni fotoğraf işlendi');
  await expect(editor.locator('.admin-edit-preview')).toHaveAttribute('src',/^data:image\/webp;base64,/);
  await saveEditor(page,editor);
  const backup=await downloadBackup(page);
  const image=backup.products.find(p=>p.name==='Kıymalı Pide').image;
  expect(image).toMatch(/^data:image\/webp;base64,/);
  const customer=await context.newPage();await customer.goto('./');
  const card=customer.locator('.product-card').filter({has:customer.getByRole('heading',{name:'Kıymalı Pide'})});
  await expect(card.locator('img')).toHaveAttribute('src',/^data:image\/webp;base64,/);
  await page.reload();
  const after=await downloadBackup(page);
  expect(after.products.find(p=>p.name==='Kıymalı Pide').image).toBe(image);
});

test('G2-11 olumsuz fotoğraf yükleme: metin dosyası ve 2 MB üstü reddedilir',async ({page},info)=>{
  await openPanel(page);
  const before=await downloadBackup(page);
  const editor=await editEditor(page,info);
  const input=editor.locator('input[type=file]');
  await input.setInputFiles({name:'yasak.txt',mimeType:'text/plain',buffer:Buffer.from('text')});
  await expect(editor.locator('.admin-upload-status')).toContainText('PNG, JPG veya WebP');
  await input.setInputFiles({name:'cok-buyuk.png',mimeType:'image/png',buffer:Buffer.alloc(2*1024*1024+1)});
  await expect(editor.locator('.admin-upload-status')).toContainText('2 MB');
  await editor.getByRole('button',{name:'Kapat'}).click();
  await expect(editor).toHaveCount(0);
  const unchanged=await downloadBackup(page);
  expect(unchanged.products).toEqual(before.products);
  expect(unchanged.settings).toEqual(before.settings);
});

test('G2-12 kaydedilmemiş değişiklik: Vazgeç onayı reddi/kabulü ve ESC',async ({page},info)=>{
  await openPanel(page);
  const editor=await editEditor(page,info);
  await nameInput(editor).fill('G2 KAYDEDİLMEMİŞ');
  page.once('dialog',d=>d.dismiss());
  await editor.getByRole('button',{name:/^(Vazgeç|İptal)$/}).click();
  await expect(editor).toBeVisible();
  page.once('dialog',d=>d.accept());
  await editor.getByRole('button',{name:'Kapat'}).click();
  await expect(editor).toHaveCount(0);
  await page.reload();
  const backup=await downloadBackup(page);
  expect(backup.products.find(p=>p.name==='Kıymalı Pide')).toBeTruthy();
  expect(backup.products.some(p=>p.name==='G2 KAYDEDİLMEMİŞ')).toBe(false);
  const another=await editEditor(page,info);
  await nameInput(another).fill('G2 ESC TEST');
  page.once('dialog',d=>d.accept());
  await page.keyboard.press('Escape');
  await expect(another).toHaveCount(0);
});

test('G2-13 JSON yedek/geri yükleme: ürün, kategori, ayar ve yenileme',async ({page,context})=>{
  await openPanel(page);
  const original=await downloadBackup(page);
  await createProduct(page,{name:'G2 GEÇİCİ ÜRÜN',price:'27,50'});
  await page.getByRole('button',{name:/Kategoriler/}).click();
  await addCategory(page,'G2 GEÇİCİ KAT');
  await expect(page.locator('.admin-category-row')).toHaveCount(5);
  await page.getByRole('button',{name:/Ürünler ve menü/}).click();
  await expect(page.locator('.admin-mobile-product')).toHaveCount(9);
  await restoreBackup(page,original);
  await expect(page.locator('.admin-mobile-product')).toHaveCount(8);
  await page.reload();
  const restored=await downloadBackup(page);
  // JSON yedek sürüm 3 geri yüklerken boş isteğe bağlı alanları normalize eder.
  // Bunlar veri kaybı değildir: yalnızca semantik ürün içeriğini karşılaştır.
  const normalizeProducts=products=>products.map(p=>({
    id:p.id,name:p.name,description:p.description,category:p.category,
    price:p.price,image:p.image,available:p.available,
    badge:p.badge||'',variants:p.variants||[],extras:p.extras||[],
  }));
  expect(normalizeProducts(restored.products)).toEqual(normalizeProducts(original.products));
  expect(restored.settings).toEqual(original.settings);
  const customer=await context.newPage();await openStore(customer);
  await expect(customer.getByRole('heading',{name:'G2 GEÇİCİ ÜRÜN'})).toHaveCount(0);
});

test('G2-14 olumsuz JSON: bozuk, eski sürüm ve yinelenen ID yedeği veri kaybettirmez',async ({page})=>{
  await openPanel(page);
  const original=await downloadBackup(page);
  const input=page.getByLabel('Demo JSON yedeği seç');
  await input.setInputFiles({name:'bozuk.json',mimeType:'application/json',buffer:Buffer.from('{gecersiz')});
  await expect(page.getByRole('alert')).toContainText('Geçerli JSON yedeği');
  await input.setInputFiles({name:'eski.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...original,version:2}))});
  await expect(page.getByRole('alert')).toContainText('Desteklenmeyen demo yedeği');
  const repeated={...original,products:[...original.products,structuredClone(original.products[0])]};
  await input.setInputFiles({name:'tekrar.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(repeated))});
  await expect(page.getByRole('alert')).toContainText('tekrarlanan ürün kimliği');
  const after=await downloadBackup(page);
  expect(after.products).toEqual(original.products);
  expect(after.settings).toEqual(original.settings);
});

test('G2-15 kısmi demo sıfırlama kategorileri korur; tüm demo sıfırlama onayı',async ({page})=>{
  await openPanel(page);
  await createProduct(page,{name:'G2 SIFIRLA',price:'80'});
  await page.getByRole('button',{name:/Kategoriler/}).click();
  await addCategory(page,'G2 KORUNACAK');
  await page.getByRole('button',{name:/Ürünler ve menü/}).click();
  page.once('dialog',d=>d.dismiss());
  await page.getByRole('button',{name:/Örnek ürünleri sıfırla/}).click();
  await expect(page.locator('.admin-mobile-product')).toHaveCount(9);
  page.once('dialog',d=>d.accept());
  await page.getByRole('button',{name:/Örnek ürünleri sıfırla/}).click();
  await expect(page.locator('.admin-mobile-product')).toHaveCount(8);
  let snapshot=await downloadBackup(page);
  expect(snapshot.settings.categories).toContain('G2 KORUNACAK');
  const saved=page.waitForEvent('download');
  page.once('dialog',d=>d.accept());
  await page.getByRole('button',{name:/Tüm demoyu başlangıca döndür/}).click();
  await saved;
  await page.reload();
  snapshot=await downloadBackup(page);
  expect(snapshot.products.length).toBe(8);
  expect(snapshot.settings.categories).not.toContain('G2 KORUNACAK');
});

test('G2-16 işletme ayarları: geçersiz WhatsApp numarası reddi ve doğru kaydın kalıcılığı',async ({page})=>{
  await openPanel(page);
  await page.getByRole('button',{name:/İşletme ayarları/}).click();
  const input=page.locator('.admin-settings-grid label').filter({hasText:'WhatsApp numarası'}).locator('input');
  await input.fill('123');
  await page.getByRole('button',{name:'Ayarları kaydet'}).click();
  await expect(page.getByRole('alert')).toContainText('WhatsApp numarasını ülke koduyla');
  await input.fill('905555555555');
  await page.getByRole('button',{name:'Ayarları kaydet'}).click();
  await expect(page.locator('.admin-notice')).toContainText('İşletme ayarları kaydedildi');
  await page.reload();
  await page.getByRole('button',{name:/İşletme ayarları/}).click();
  await expect(page.locator('.admin-settings-grid label').filter({hasText:'WhatsApp numarası'}).locator('input')).toHaveValue('905555555555');
});

test('G2-17 tarayıcı veri izolasyonu: ikinci bağımsız oturum test verisini görmez',async ({page,browser})=>{
  await openPanel(page);
  await createProduct(page,{name:'G2 İZOLE KAYIT',price:'11'});
  await expect(page.locator('.admin-mobile-product')).toHaveCount(9);
  const second=await browser.newContext({baseURL:'http://127.0.0.1:4321/pideci-lahmacuncu-demo/'});
  try{
    const isolated=await second.newPage();
    await openPanel(isolated);
    await expect(isolated.locator('.admin-mobile-product')).toHaveCount(8);
    await isolated.reload();
    await expect(isolated.locator('.admin-mobile-product')).toHaveCount(8);
  }finally{await second.close();}
});
