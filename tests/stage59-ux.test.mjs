import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {orderMessage,buildCartLine} from '../src/lib/order-core.mjs';
const store=readFileSync(new URL('../src/components/Storefront.tsx',import.meta.url),'utf8');
const admin=readFileSync(new URL('../src/components/AdminPanel.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles/global.css',import.meta.url),'utf8');
test('Demo mesajı bir kez gösterilir, ardından ana düğme kopyalamaya dönüşür',()=>{
 assert.match(store,/messagePreview\?copyMessage:sendWhatsApp/);
 assert.match(store,/messagePreview\?'Sipariş metnini kopyala'/);
 assert.match(store,/!messagePreview&&/);
});
test('WhatsApp metninde teslimat ücretinin henüz kesinleşmediği belirtilir',()=>{
 const product={id:'p',name:'Kıymalı Pide',price:215,available:true};
 const cart=[buildCartLine(product)];
 const message=orderMessage({cart,customer:'Deneme Müşteri',address:'Rize Merkez sokak 12',delivery:'delivery'});
 assert.match(message,/Varsa teslimat ücreti ayrıca bildirilecektir/);
 assert.match(message,/215,00/);
 assert.doesNotMatch(message,/Servis ücreti varsa ve nihai tutar/);
});
test('Mobil ürün metinleri ve fiyat altı bilgisi okunurluğu artırıldı',()=>{
 assert.match(css,/AŞAMA 5\.9/);assert.match(css,/\.product-price small\{font-size:11px/);
 assert.match(css,/\.product-info p\{font-size:13px/);
});
test('Panel porsiyon-fiyat önceliğini açıklıyor',()=>{
 assert.match(admin,/Menüde görünen satış fiyatı/);assert.match(admin,/Değişiklikler yalnızca/);
});
