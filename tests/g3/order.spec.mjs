import {test,expect} from '@playwright/test';
import {
  openCustomer,choose,addToCart,openCart,line,pickup,delivery,preview,setSettings,
  screenshotEvidence,
} from './helpers.mjs';
import {openPanel,editEditor,saveEditor,productAction} from '../g2/helpers.mjs';

test('G3-01 boş sepet: yanlışlıkla sipariş gönderilemez',async ({page})=>{
  await openCustomer(page);
  const cart=await openCart(page);
  await expect(cart).toContainText('Sepetiniz henüz boş');
  await expect(cart.locator('.whatsapp-button')).toBeDisabled();
  await expect(cart.locator('.cart-total strong')).toContainText('0,00');
});

test('G3-02 standart pide 215 TL, gel-al, müşteri adı ve mesaj oluşturma',async ({page})=>{
  await openCustomer(page);
  await addToCart(page,{});
  const cart=await openCart(page);
  await expect(cart.locator('.cart-total strong')).toContainText('215,00');
  await pickup(cart,'G3 Denetim');
  const message=await preview(cart);
  await expect(message).toContainText('1 × Kıymalı Pide');
  await expect(message).toContainText('215,00');
  await expect(message).toContainText('Teslimat türü: Gel-al');
  await expect(message).toContainText('Ad: G3 Denetim');
  await expect(message).not.toContainText('Adres:');
});

test('G3-03 1,5 porsiyon ve iki ekstra, iki adet: 740 TL',async ({page},info)=>{
  await openCustomer(page);
  const dialog=await choose(page,{variantIndex:1,extras:['Ekstra kaşar','Yumurta'],qty:2});
  await expect(dialog.locator('.option-summary strong')).toContainText('740,00');
  await dialog.getByRole('button',{name:/Sepete ekle/}).click();
  const cart=await openCart(page);
  await expect(cart.locator('.cart-total strong')).toContainText('740,00');
  const row=line(cart,'Kıymalı Pide');
  await expect(row).toContainText('1,5 porsiyon');
  await expect(row).toContainText('Ekstra kaşar');
  await expect(row).toContainText('Yumurta');
  await pickup(cart);
  const message=await preview(cart);
  await expect(message).toContainText('2 × Kıymalı Pide');
  await expect(message).toContainText('370,00');
  await expect(message).toContainText('740,00');
  if(info.project.name==='mobil-390px')await screenshotEvidence(page,info,'porsiyon-iki-ekstra');
});

test('G3-04 ücretsiz ekstra tutarı artırmaz',async ({page})=>{
  await openCustomer(page);
  const dialog=await choose(page,{name:'Antep Usulü Lahmacun',extras:['Ekstra yeşillik','Acılı']});
  await expect(dialog.locator('.option-summary strong')).toContainText('115,00');
  await dialog.getByRole('button',{name:/Sepete ekle/}).click();
  const cart=await openCart(page);
  await expect(cart.locator('.cart-total strong')).toContainText('115,00');
  await expect(line(cart,'Antep Usulü Lahmacun')).toContainText('Acılı');
});

test('G3-05 aynı porsiyon ve ekstralar tek kalemde birleştirilir',async ({page})=>{
  await openCustomer(page);
  await addToCart(page,{extras:['Ekstra kaşar']});
  await addToCart(page,{extras:['Ekstra kaşar']});
  const cart=await openCart(page);
  await expect(cart.locator('.cart-line')).toHaveCount(1);
  await expect(line(cart,'Kıymalı Pide').locator('.qty-control span')).toHaveText('2');
  await expect(cart.locator('.cart-total strong')).toContainText('500,00');
});

test('G3-06 farklı porsiyonlar ayrı satır tutulur',async ({page})=>{
  await openCustomer(page);
  await addToCart(page,{variantIndex:0});
  await addToCart(page,{variantIndex:1});
  const cart=await openCart(page);
  await expect(cart.locator('.cart-line')).toHaveCount(2);
  await expect(cart.locator('.cart-total strong')).toContainText('525,00');
  await expect(line(cart,'Kıymalı Pide','Standart')).toContainText('215,00');
  await expect(line(cart,'Kıymalı Pide','1,5 porsiyon')).toContainText('310,00');
});

test('G3-07 sepette adet artır/azalt, son ürünü sil ve boş durum',async ({page})=>{
  await openCustomer(page);
  await addToCart(page,{});
  const cart=await openCart(page);
  await cart.getByRole('button',{name:'Kıymalı Pide adetini artır'}).click();
  await expect(cart.locator('.cart-total strong')).toContainText('430,00');
  await cart.getByRole('button',{name:'Kıymalı Pide adetini azalt'}).click();
  await expect(cart.locator('.cart-total strong')).toContainText('215,00');
  await cart.getByRole('button',{name:'Kıymalı Pide ürününü sepetten kaldır'}).click();
  await expect(cart.locator('.cart-line')).toHaveCount(0);
  await expect(cart).toContainText('Sepetiniz henüz boş');
  await expect(cart.locator('.whatsapp-button')).toBeDisabled();
});

test('G3-08 olumsuz teslimat: eksik ad, kısa adres reddedilir',async ({page})=>{
  await openCustomer(page);
  await addToCart(page,{});
  const cart=await openCart(page);
  await cart.getByRole('button',{name:/Sipariş mesajını görüntüle/}).click();
  await expect(cart.getByRole('alert')).toContainText('Sipariş için adınızı girin');
  await cart.getByPlaceholder('Adınızı yazın').fill('G3');
  await cart.getByRole('button',{name:/Sipariş mesajını görüntüle/}).click();
  await expect(cart.getByRole('alert')).toContainText('açık teslimat adresini');
  await cart.getByPlaceholder('Mahalle, sokak, bina, daire...').fill('Rize');
  await cart.getByRole('button',{name:/Sipariş mesajını görüntüle/}).click();
  await expect(cart.getByRole('alert')).toContainText('açık teslimat adresini');
  await cart.getByPlaceholder('Mahalle, sokak, bina, daire...').fill('Rize Merkez Atatürk Caddesi No 15');
  const message=await preview(cart);
  await expect(message).toContainText('Teslimat türü: Paket servis');
  await expect(message).toContainText('Adres: Rize Merkez');
});

test('G3-09 gel-al adresi olmadan onay, sipariş notu eklenir',async ({page})=>{
  await openCustomer(page);
  await addToCart(page,{name:'Kaşarlı Pide'});
  const cart=await openCart(page);
  await pickup(cart,'G3 Paket Test');
  await cart.getByPlaceholder('Kapı zili, özel istekler...').fill('Az pişmiş  olsun');
  const message=await preview(cart);
  await expect(message).toContainText('Sipariş notu: Az pişmiş olsun');
  await expect(message).not.toContainText('Adres:');
  await expect(message).toContainText('205,00');
});

test('G3-10 çoklu ürün ve kuruşlu ara toplam: 215 + 115 + 40',async ({page})=>{
  await openCustomer(page);
  await addToCart(page,{name:'Kıymalı Pide'});
  await addToCart(page,{name:'Antep Usulü Lahmacun'});
  await addToCart(page,{name:'Ayran'});
  const cart=await openCart(page);
  await expect(cart.locator('.cart-line')).toHaveCount(3);
  await expect(cart.locator('.cart-total strong')).toContainText('370,00');
  await pickup(cart);
  const message=await preview(cart);
  await expect(message).toContainText('Ürün toplamı: 370,00');
  await expect(message).toContainText('Ayran');
});

test('G3-11 minimum sipariş eşiği: 300 TL altı reddedilir, artınca kabul',async ({page,context})=>{
  await openCustomer(page);
  const panel=await context.newPage();
  await openPanel(panel);
  await setSettings(panel,{minimumOrder:300});
  await addToCart(page,{});
  const cart=await openCart(page);
  await pickup(cart);
  await cart.getByRole('button',{name:/Sipariş mesajını görüntüle/}).click();
  await expect(cart.getByRole('alert')).toContainText('Minimum sipariş tutarı 300,00');
  await cart.getByRole('button',{name:'Sepeti kapat'}).click();
  await addToCart(page,{name:'Antep Usulü Lahmacun'});
  const updated=await openCart(page);
  await expect(updated.locator('.cart-total strong')).toContainText('330,00');
  const message=await preview(updated);
  await expect(message).toContainText('330,00');
});

test('G3-12 sipariş alımı kapanınca gönderme düğmesi devre dışı kalır',async ({page,context})=>{
  await openCustomer(page);
  await addToCart(page,{});
  const panel=await context.newPage();
  await openPanel(panel);
  await setSettings(panel,{orderingEnabled:false});
  const cart=await openCart(page);
  await expect(cart.locator('.whatsapp-button')).toBeDisabled();
  await expect(cart.locator('.whatsapp-button')).toContainText('Sipariş alımı kapalı');
  await expect(cart.locator('.cart-line')).toHaveCount(1);
});

test('G3-13 paket servis devre dışı: gel-al seçeneğiyle sipariş',async ({page,context})=>{
  await openCustomer(page);
  const panel=await context.newPage();
  await openPanel(panel);
  await setSettings(panel,{deliveryAvailable:false,pickupAvailable:true});
  await addToCart(page,{});
  const cart=await openCart(page);
  await expect(cart.getByRole('button',{name:/Paket servis/})).toBeDisabled();
  await expect(cart.getByRole('button',{name:/Gel-al/})).toHaveAttribute('aria-pressed','true');
  await cart.getByPlaceholder('Adınızı yazın').fill('G3 Paket Kapalı');
  const message=await preview(cart);
  await expect(message).toContainText('Teslimat türü: Gel-al');
});

test('G3-14 fiyat güncellendiğinde eski sepet uyarı verir ve yeni tutara geçer',async ({page,context},info)=>{
  await openCustomer(page);
  await addToCart(page,{});
  const cart=await openCart(page);
  await pickup(cart);
  await expect(cart.locator('.cart-total strong')).toContainText('215,00');
  const panel=await context.newPage();
  await openPanel(panel);
  const editor=await editEditor(panel,info,'Kıymalı Pide');
  await editor.getByRole('textbox',{name:'Menüde görünen satış fiyatı'}).fill('235,49');
  await saveEditor(panel,editor);
  await cart.getByRole('button',{name:/Sipariş mesajını görüntüle/}).click();
  await expect(cart.getByRole('alert')).toContainText('Ürün fiyatları güncellendi');
  await expect(cart.locator('.cart-total strong')).toContainText('235,49');
  const message=await preview(cart);
  await expect(message).toContainText('235,49');
});

test('G3-15 gizlenen ürün sipariş öncesi sepetten çıkarılır ve uyarı verir',async ({page,context},info)=>{
  await openCustomer(page);
  await addToCart(page,{});
  const cart=await openCart(page);
  await pickup(cart);
  const panel=await context.newPage();
  await openPanel(panel);
  await productAction(panel,info,'Kıymalı Pide','status').click();
  await expect(page.locator('.product-card').filter({has:page.getByRole('heading',{name:'Kıymalı Pide'})})).toHaveCount(0);
  await cart.getByRole('button',{name:/Sipariş mesajını görüntüle/}).click();
  await expect(cart.getByRole('alert')).toContainText('Bazı ürünler artık satışta değil');
  await expect(cart.locator('.cart-line')).toHaveCount(0);
  await expect(cart.locator('.whatsapp-button')).toBeDisabled();
});

test('G3-16 porsiyon/ekstra fiyatı değişince toplam yeniden doğrulanır',async ({page,context},info)=>{
  await openCustomer(page);
  await addToCart(page,{variantIndex:1,extras:['Ekstra kaşar']});
  const cart=await openCart(page);
  await pickup(cart);
  await expect(cart.locator('.cart-total strong')).toContainText('345,00');
  const panel=await context.newPage();
  await openPanel(panel);
  const editor=await editEditor(panel,info);
  await editor.getByRole('textbox',{name:'1,5 porsiyon fiyatı'}).fill('315,25');
  await editor.getByRole('textbox',{name:'Ekstra kaşar fiyatı'}).fill('36,75');
  await saveEditor(panel,editor);
  await cart.getByRole('button',{name:/Sipariş mesajını görüntüle/}).click();
  await expect(cart.getByRole('alert')).toContainText('Ürün fiyatları güncellendi');
  await expect(cart.locator('.cart-total strong')).toContainText('352,00');
  const message=await preview(cart);
  await expect(message).toContainText('352,00');
});

test('G3-17 seçenek penceresinden vazgeçince sepete ürün eklenmez',async ({page})=>{
  await openCustomer(page);
  const dialog=await choose(page,{qty:2,extras:['Ekstra kaşar']});
  await dialog.getByRole('button',{name:'Ürün seçeneklerini kapat'}).click();
  await expect(dialog).toHaveCount(0);
  const cart=await openCart(page);
  await expect(cart.locator('.cart-line')).toHaveCount(0);
  await expect(cart.locator('.cart-total strong')).toContainText('0,00');
});

test('G3-18 demo güvenliği: WhatsApp yönlendirmesi yapılmadan mesaj önizlemesi açılır',async ({page})=>{
  await openCustomer(page);
  const external=[];
  page.on('popup',popup=>external.push(popup.url()));
  await addToCart(page,{});
  const cart=await openCart(page);
  await pickup(cart);
  const message=await preview(cart);
  await expect(message).toContainText('Merhaba, sipariş oluşturmak istiyorum.');
  await expect(cart.locator('.whatsapp-button')).toContainText('Sipariş metnini kopyala');
  expect(external).toEqual([]);
  expect(page.url()).toMatch(/127\.0\.0\.1:4321\/pideci-lahmacuncu-demo\//);
});
