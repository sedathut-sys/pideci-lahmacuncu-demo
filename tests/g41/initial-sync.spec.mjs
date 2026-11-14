import {test,expect} from '@playwright/test';
import {
  baseURL,productsKey,settingsKey,cards,findCard,openPanel,setPrice,setName,
  seedCategory,addProduct,setBusinessName,watchFirstPaint,firstPaint,takeEvidence,
  productAction,openCustomer,addToCart,openCart,pickup,preview
} from './helpers.mjs';

test('G41-01 SSR: veri okunmadan 8 sahte ürün ve kategori düğmesi gönderilmez',async ({request})=>{
  const response=await request.get('./');
  expect(response.status()).toBe(200);
  const html=await response.text();
  expect(html).toContain('Menü hazırlanıyor');
  expect(html).not.toContain('class="product-card"');
  expect(html).not.toContain('aria-label="Ürün kategorileri"');
  expect(html).not.toContain('₺215,00');
});

test('G41-02 JavaScript kapalıyken SSR güvenli: ürün, fiyat ve sahte sipariş yok',async ({browser},info)=>{
  const isolated=await browser.newContext({
    baseURL,javaScriptEnabled:false,
    viewport:info.project.use.viewport||{width:390,height:844}
  });
  try{
    const page=await isolated.newPage();
    await page.goto('./');
    await expect(page.getByText('Menü hazırlanıyor…')).toBeVisible();
    await expect(cards(page)).toHaveCount(0);
    await expect(page.getByRole('group',{name:'Ürün kategorileri'})).toHaveCount(0);
    await expect(page.getByRole('button',{name:/Sepeti Gör/})).toHaveCount(0);
  }finally{await isolated.close();}
});

test('G41-03 yeni sekmenin ilk ürün renderında eski 215 TL fiyatı hiç görünmez',async ({page,context},info)=>{
  await openPanel(page);
  await setPrice(page,info,'Kıymalı Pide','249,49');
  const customer=await context.newPage();
  await watchFirstPaint(customer);
  await openCustomer(customer);
  await expect(findCard(customer,'Kıymalı Pide').locator('.product-price')).toContainText('249,49');
  const observed=await firstPaint(customer);
  expect(observed.cards.length).toBeGreaterThan(0);
  const entries=observed.cards.flat().filter(item=>item.name==='Kıymalı Pide');
  expect(entries.length).toBeGreaterThan(0);
  expect(entries.every(item=>item.price.includes('249,49'))).toBe(true);
  await takeEvidence(customer,info,'fresh-tab-latest-price');
});

test('G41-04 yeni ürün eklenince ilk müşteri renderında eski sekiz ürün listesi çıkmaz',async ({page,context})=>{
  await openPanel(page);
  await addProduct(page,'G41 YENİ PİDE');
  const customer=await context.newPage();
  await watchFirstPaint(customer);
  await openCustomer(customer,{count:9});
  const observed=await firstPaint(customer);
  expect(observed.cards.length).toBeGreaterThan(0);
  expect(observed.cards.every(batch=>batch.length===9)).toBe(true);
  expect(observed.cards.every(batch=>batch.some(item=>item.name==='G41 YENİ PİDE'))).toBe(true);
});

test('G41-05 gizlenen ürün ilk yeni sekme görüntüsüne bir an dahi sızmaz',async ({page,context},info)=>{
  await openPanel(page);
  await productAction(page,info,'Kıymalı Pide','status').click();
  const customer=await context.newPage();
  await watchFirstPaint(customer);
  await openCustomer(customer,{count:7});
  await expect(findCard(customer,'Kıymalı Pide')).toHaveCount(0);
  const observed=await firstPaint(customer);
  expect(observed.cards.length).toBeGreaterThan(0);
  expect(observed.cards.every(batch=>batch.length===7 && !batch.some(x=>x.name==='Kıymalı Pide'))).toBe(true);
});

test('G41-06 yeni kategori ve ürün ilk müşteri açılışından itibaren tutarlı',async ({page,context})=>{
  await openPanel(page);
  await seedCategory(page,'G41 ÖZEL');
  await addProduct(page,'G41 ÖZEL ÜRÜN','G41 ÖZEL');
  const customer=await context.newPage();
  await watchFirstPaint(customer);
  await openCustomer(customer,{count:9});
  await expect(customer.getByRole('group',{name:'Ürün kategorileri'}).getByRole('button',{name:'G41 ÖZEL'})).toBeVisible();
  await customer.getByRole('button',{name:'G41 ÖZEL',exact:true}).click();
  await expect(cards(customer)).toHaveCount(1);
  const observed=await firstPaint(customer);
  expect(observed.cards.every(batch=>batch.length===9||batch.length===1)).toBe(true);
  await customer.reload();
  await expect(customer.getByRole('button',{name:'G41 ÖZEL',exact:true})).toBeVisible();
});

test('G41-07 iki açık müşteri sekmesi üç ardışık fiyat değişikliğinin sonuncusunu görür',async ({page,context},info)=>{
  await openPanel(page);
  const first=await context.newPage(),second=await context.newPage();
  await openCustomer(first);
  await openCustomer(second);
  for(const price of ['221','222,49','223,75'])await setPrice(page,info,'Kıymalı Pide',price);
  for(const tab of [first,second]){
    await expect(findCard(tab,'Kıymalı Pide').locator('.product-price')).toContainText('223,75');
    await tab.reload();
    await expect(findCard(tab,'Kıymalı Pide').locator('.product-price')).toContainText('223,75');
  }
});

test('G41-08 ürün adı güncellenince açık iki sekmenin arama sonuçları yenilenir',async ({page,context},info)=>{
  await openPanel(page);
  const a=await context.newPage(),b=await context.newPage();
  await openCustomer(a);await openCustomer(b);
  for(const tab of [a,b]){
    await tab.getByRole('searchbox',{name:'Menüde ara'}).fill('Kıymalı');
    await expect(cards(tab)).toHaveCount(1);
  }
  await setName(page,info,'Kıymalı Pide','G41 DİNAMİK PİDE');
  for(const tab of [a,b]){
    await expect(cards(tab)).toHaveCount(0);
    await tab.getByRole('searchbox',{name:'Menüde ara'}).fill('G41 DİNAMİK');
    await expect(cards(tab)).toHaveCount(1);
  }
});

test('G41-09 silinen boş kategori seçili müşteride güvenle Tümü filtresine döner',async ({page,context})=>{
  await openPanel(page);
  await seedCategory(page,'G41 GEÇİCİ');
  const customer=await context.newPage();await openCustomer(customer);
  await customer.getByRole('button',{name:'G41 GEÇİCİ',exact:true}).click();
  await expect(cards(customer)).toHaveCount(0);
  await page.getByRole('button',{name:/Kategoriler/}).click();
  page.once('dialog',d=>d.accept());
  await page.locator('.admin-category-row').filter({hasText:'G41 GEÇİCİ'}).getByRole('button',{name:'Kategoriyi sil'}).click();
  await expect(customer.getByRole('button',{name:'G41 GEÇİCİ',exact:true})).toHaveCount(0);
  await expect(customer.getByRole('button',{name:'Tümü',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(cards(customer)).toHaveCount(8);
});

test('G41-10 iki hızlı fiyat güncellemesinden sonra eski sepet sessizce onaylanamaz',async ({page,context},info)=>{
  await openCustomer(page);
  await addToCart(page,{name:'Kıymalı Pide'});
  const cart=await openCart(page);await pickup(cart,'G41 Fiyat Kontrol');
  const panel=await context.newPage();await openPanel(panel);
  await setPrice(panel,info,'Kıymalı Pide','250');
  await setPrice(panel,info,'Kıymalı Pide','275,25');
  await cart.getByRole('button',{name:/Sipariş mesajını görüntüle/}).click();
  await expect(cart.getByRole('alert')).toContainText('Ürün fiyatları güncellendi');
  await expect(cart.locator('.message-preview pre')).toHaveCount(0);
  await expect(cart.locator('.cart-total strong')).toContainText('275,25');
  const message=await preview(cart);
  await expect(message).toContainText('275,25');
});

test('G41-11 görünürlük kapanınca iki müşteri sekmesinde sepet temizlenir, sipariş oluşmaz',async ({page,context},info)=>{
  await openCustomer(page);
  const twin=await context.newPage();await openCustomer(twin);
  await addToCart(page,{name:'Kıymalı Pide'});
  await addToCart(twin,{name:'Kıymalı Pide'});
  const cartA=await openCart(page),cartB=await openCart(twin);
  await pickup(cartA,'G41 A');await pickup(cartB,'G41 B');
  const panel=await context.newPage();await openPanel(panel);
  await productAction(panel,info,'Kıymalı Pide','status').click();
  for(const cart of [cartA,cartB]){
    await cart.getByRole('button',{name:/Sipariş mesajını görüntüle/}).click();
    await expect(cart.getByRole('alert')).toContainText('Bazı ürünler artık satışta değil');
    await expect(cart.locator('.cart-line')).toHaveCount(0);
    await expect(cart.locator('.message-preview pre')).toHaveCount(0);
  }
});

test('G41-12 arka arkaya yenileme sonrası en son kaydedilmiş fiyat gelir',async ({page,context},info)=>{
  await openPanel(page);
  const customer=await context.newPage();await openCustomer(customer);
  for(const price of ['234','235,49','236,75']){
    await setPrice(page,info,'Kıymalı Pide',price);
    await customer.reload();
    await expect(findCard(customer,'Kıymalı Pide').locator('.product-price')).toContainText(price.replace('.',',')+(price.includes(',')?'':',00'));
  }
  await customer.reload();
  await expect(findCard(customer,'Kıymalı Pide').locator('.product-price')).toContainText('236,75');
});

test('G41-13 negatif: bozuk ürün JSON sonrasında uygulama güvenli varsayılana döner',async ({page})=>{
  await openCustomer(page);
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.evaluate(key=>localStorage.setItem(key,'{hatalı json'),productsKey);
  await page.reload();
  await expect(cards(page)).toHaveCount(8);
  await expect(findCard(page,'Kıymalı Pide')).toBeVisible();
  expect(errors).toEqual([]);
});

test('G41-14 negatif: geçerli boş ürün listesi varsayılan 8 ürünle doldurulmaz',async ({page})=>{
  await openCustomer(page);
  await page.evaluate(key=>localStorage.setItem(key,'[]'),productsKey);
  await watchFirstPaint(page);
  await page.reload();
  await expect(cards(page)).toHaveCount(0);
  await expect(page.locator('.empty-products').last()).toContainText('Bu kategoride ürün bulunamadı');
  const observed=await firstPaint(page);
  expect(observed.cards).toHaveLength(0);
});

test('G41-15 yeni bağımsız tarayıcı bağlamı önceki müşterinin verisini devralmaz',async ({page,browser},info)=>{
  await openPanel(page);
  await setPrice(page,info,'Kıymalı Pide','264,49');
  const separate=await browser.newContext({
    baseURL,viewport:info.project.use.viewport||{width:390,height:844}
  });
  try{
    const customer=await separate.newPage();
    await watchFirstPaint(customer);
    await openCustomer(customer);
    await expect(findCard(customer,'Kıymalı Pide').locator('.product-price')).toContainText('215,00');
    const observed=await firstPaint(customer);
    expect(observed.cards.every(batch=>batch.some(item=>item.name==='Kıymalı Pide'&&item.price.includes('215,00')))).toBe(true);
  }finally{await separate.close();}
});

test('G41-16 gerçek veri yarışı: aynı anda açık iki panelde farklı ürün değişiklikleri kaybolmamalı',async ({page,context},info)=>{
  await openPanel(page);
  const panel2=await context.newPage();await openPanel(panel2);
  await setPrice(page,info,'Kıymalı Pide','270,49');
  await setPrice(panel2,info,'Kaşarlı Pide','250,75');
  const customer=await context.newPage();await openCustomer(customer);
  await expect(findCard(customer,'Kaşarlı Pide').locator('.product-price')).toContainText('250,75');
  // Bu kabul maddesi gerçek bir kayıp-güncelleme tehlikesini yakalar. Başarısızsa test zayıflatılmaz.
  await expect(findCard(customer,'Kıymalı Pide').locator('.product-price')).toContainText('270,49',{timeout:4000});
  await takeEvidence(customer,info,'two-admin-concurrent-updates');
});

test('G41-17 ilk boya riski: yeni işletme adı kayıtlıyken eski Taş Fırın adı bir an görünmemeli',async ({page,context},info)=>{
  await openPanel(page);
  await setBusinessName(page,'G41 YENİ FIRIN');
  const customer=await context.newPage();
  await watchFirstPaint(customer);
  await openCustomer(customer);
  await expect(customer.locator('.announcement')).toContainText('G41 YENİ FIRIN');
  const observed=await firstPaint(customer);
  expect(observed.branding.length).toBeGreaterThan(0);
  // SSR ve ilk hidratasyon sırasında eski marka görünürse kusur açıkça raporlanır.
  expect(observed.branding.every(name=>!name.includes('Taş Fırın')),
    'SSR/hidratasyon kısa süreli eski marka bilgisi gösteriyor: '+observed.branding.join(' => ')
  ).toBe(true);
  await takeEvidence(customer,info,'no-stale-brand-first-paint');
});

test('G41-18 işletme bilgisi değişince açık iki müşteri sekmesinde son marka görünür',async ({page,context})=>{
  await openPanel(page);
  const a=await context.newPage(),b=await context.newPage();
  await openCustomer(a);await openCustomer(b);
  await setBusinessName(page,'G41 SİPARİŞ FIRINI');
  for(const tab of [a,b]){
    await expect(tab.locator('.announcement')).toContainText('G41 SİPARİŞ FIRINI');
    await tab.reload();
    await expect(tab.locator('.announcement')).toContainText('G41 SİPARİŞ FIRINI');
  }
});
