import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildCartLine,totals} from '../src/lib/order-core.mjs';
import {isValidUnitPrice,validateProductPricing,normalizePriceInput,parsePriceDraft,formatAdminPrice} from '../src/lib/price-rules.mjs';
import {addCategory,validateCategories} from '../src/lib/admin-core.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const admin=read('src/components/AdminPanel.tsx');
const priceInput=read('src/components/PriceInput.tsx');
const css=read('src/styles/global.css');
const products=read('src/data/products.ts');
const config=read('src/data/config.ts');
const clean={id:'p1',name:'Kıymalı Pide',available:true,price:215,variants:[{label:'Standart',price:215},{label:'1,5 porsiyon',price:310}],extras:[{label:'Ekstra kaşar',price:35},{label:'Yumurta',price:25}]};

test('Pide 215+35+25 = 275 TL; 2 adet = 550 TL',()=>{
 assert.equal(validateProductPricing(clean),true);
 const line=buildCartLine(clean,{extraLabels:['Ekstra kaşar','Yumurta'],quantity:2});
 assert.equal(line.unitPrice,275);assert.equal(totals([line]).subtotal,550);
});
test('İkinci porsiyon ve ekstra için 1.000.001 TL reddedilir',()=>{
 for(const kind of ['variants','extras']) {
  const product=structuredClone(clean);product[kind][kind==='variants'?1:0].price=1000001;
  assert.throws(()=>validateProductPricing(product),/fiyatını kontrol edin/);
  assert.throws(()=>buildCartLine(product,kind==='variants'?{variantIndex:1}:{extraLabels:['Ekstra kaşar']}),/fiyatı geçersiz/);
 }
});
test('Ürün fiyatları negatif, NaN, boş ve üç ondalık ile reddedilir',()=>{
 for(const value of [-1,Number.NaN,Number.POSITIVE_INFINITY,1.234,1000000.01]){
  assert.equal(isValidUnitPrice(value),false);
  assert.throws(()=>validateProductPricing({...clean,price:value}));
 }
 for(const text of ['',',','0,001','9999999','--1'])assert.equal(Number.isNaN(parsePriceDraft(text)),true);
});
test('Sıfır bilerek girildiğinde geçerlidir; boş değer sıfır değildir',()=>{
 assert.equal(parsePriceDraft('0'),0);
 assert.equal(Number.isNaN(parsePriceDraft('')),true);
 assert.equal(parsePriceDraft('00020,49'),20.49);
 assert.equal(parsePriceDraft('0,50'),0.5);
 assert.equal(normalizePriceInput('0020'),'20');
});
test('Kuruşlu fiyat yönetici ekranında kaybolmaz',()=>{
 assert.match(formatAdminPrice(20.49),/20,49/);
 assert.match(formatAdminPrice(20),/20/);
 assert.doesNotMatch(formatAdminPrice(20.49),/₺20\s*$/);
});
test('Tümü kategori çakışması engellenir',()=>{
 assert.throws(()=>addCategory(['Pide'],'Tümü'),/sistem filtresi/);
 assert.throws(()=>validateCategories(['TÜMÜ','Pide']),/sistem filtresi/);
 assert.deepEqual(addCategory(['Pide'],'Tatlılar'),['Pide','Tatlılar']);
});
test('Tüm para alanları ortak fiyat bileşeni ve tek doğrulayıcı kullanır',()=>{
 assert.match(priceInput,/parsePriceDraft\(next\)/);
 assert.match(priceInput,/inputMode="decimal"/);
 assert.match(priceInput,/aria-invalid/);
 assert.equal((admin.match(/<PriceInput/g)||[]).length,4);
 assert.match(admin,/validateProductPricing\(next\)/);
});
test('Taslak değişiklikleri X Escape dış tık Vazgeç ile uyarılır',()=>{
 assert.match(admin,/editingBaseline/);
 assert.match(admin,/Kaydedilmemiş değişiklikler var/);
 assert.match(admin,/onClick=\{requestCloseEditor\}/);
 assert.match(admin,/if\(e.key==='Escape'\)/);
 assert.match(admin,/if\(e.target===e.currentTarget\)requestCloseEditor\(\)/);
});
test('Sıfırlama iki ayrı seçenek: ürünler ve tüm demo',()=>{
 assert.match(admin,/Örnek ürünleri sıfırla/);
 assert.match(admin,/Tüm demoyu başlangıca döndür/);
 assert.match(admin,/downloadDemoBackup\(\)/);
 assert.match(admin,/writeDemoProducts\(originalProducts\);writeDemoSettings\(originalSettings\)/);
});
test('Demo depolama anahtarları siteye özel ve eski kayıtlar bu yolda göç eder',()=>{
 assert.match(products,/pideci-lahmacuncu-demo:products:v2/);
 assert.match(config,/pideci-lahmacuncu-demo:settings:v3/);
 assert.match(products,/window\.location\.pathname\.startsWith\('\/pideci-lahmacuncu-demo\/'\)/);
 assert.match(config,/window\.location\.hostname === 'sedathut-sys\.github\.io'/);
 assert.match(products,/LEGACY_STORAGE_KEY/);
 assert.match(config,/LEGACY_SITE_KEY/);
});
test('Üstteki Kaydet yalnız klavye açıkken görünür',()=>{
 assert.doesNotMatch(css,/\.admin-dialog-large:focus-within \.admin-header-save/);
 assert.match(css,/\.admin-backdrop-keyboard \.admin-header-save/);
});
