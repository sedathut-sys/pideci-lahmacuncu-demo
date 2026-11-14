import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {displayedPrice,withDisplayedPrice,syncDisplayPrice,addVariant,removeVariant} from '../src/lib/admin-prices.mjs';
const product={id:'p',name:'Deneme Pidesi',price:125,variants:[{label:'Standart',price:100},{label:'1,5 porsiyon',price:180}]};
test('Eski tutarsız fiyatlar gösterilen fiyatla eşitlenir',()=>{
 const x=syncDisplayPrice(product);assert.equal(x.price,100);assert.equal(displayedPrice(x),100);assert.equal(product.price,125);
});
test('Ana fiyatın değiştirilmesi ilk porsiyonu günceller, ikinciyi bozmaz',()=>{
 const x=withDisplayedPrice(product,150);assert.equal(x.price,150);assert.equal(x.variants[0].price,150);assert.equal(x.variants[1].price,180);assert.equal(product.variants[0].price,100);
});
test('Porsiyonsuz ürün fiyatı değiştirilir',()=>{
 const x=withDisplayedPrice({name:'Ayran',price:40},55);assert.equal(displayedPrice(x),55);
});
test('İlk porsiyon eklenince ana fiyat kullanılır',()=>{
 const x=addVariant({name:'Pide',price:215,variants:[]});assert.equal(x.variants[0].label,'Standart');assert.equal(x.variants[0].price,215);
});
test('İlk porsiyon silinince diğer porsiyon menü fiyatı olur',()=>{
 const x=removeVariant(product,0);assert.equal(x.price,180);assert.equal(displayedPrice(x),180);
 const y=removeVariant({name:'Pide',price:215,variants:[{label:'Standart',price:215}]},0);assert.equal(y.price,215);assert.equal(y.variants.length,0);
});
test('Panel mobil ve fotoğraf yükleme geri bildirimi içerir',()=>{
 const panel=readFileSync(new URL('../src/components/AdminPanel.tsx',import.meta.url),'utf8');
 assert.match(panel,/admin-first-variant-price/);assert.match(panel,/Menüde görünen satış fiyatı/);assert.match(panel,/setUploadState/);assert.match(panel,/admin-upload-status/);
});
