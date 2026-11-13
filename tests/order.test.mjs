import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import { buildCartLine, addLine, changeQuantity, totals, refreshCart, validateCheckout, orderMessage, isValidWhatsApp, whatsAppLink, money, MAX_LINE_QUANTITY } from '../src/lib/order-core.mjs';
const seed=JSON.parse(readFileSync(new URL('../scripts/seed-data.json',import.meta.url),'utf8'));
const products=seed.products;
const find=id=>products.find(product=>product.id===id);
const one=buildCartLine(find('pide-kiymali'),{variantIndex:1,extraLabels:['Yumurta','Ekstra kaşar'],quantity:2});
const options={customer:'Ayşe Yılmaz',address:'Atatürk Mah. 123. Sokak No 5 Daire 3',delivery:'delivery',note:'Zile basmayınız'};

test('Porsiyon + ekler + adet = kuruş hassasiyetinde toplam',()=>{
 assert.equal(one.unitPrice,370);assert.equal(one.quantity,2);
 assert.equal(totals([one]).subtotal,740);
 assert.match(one.options,/1,5 porsiyon/);assert.match(one.options,/Ekstra kaşar/);
 assert.match(money(370),/370/);
});
test('Ücretsiz ekstra fiyatı artırmaz',()=>{
 const p=buildCartLine(find('lahmacun'),{extraLabels:['Acılı','Ekstra yeşillik']});
 assert.equal(p.unitPrice,115);
});
test('Aynı tercihleri farklı sırayla seçmek aynı sepete birleşir',()=>{
 const x=buildCartLine(find('pide-kiymali'),{variantIndex:1,extraLabels:['Ekstra kaşar','Yumurta']});
 const y=buildCartLine(find('pide-kiymali'),{variantIndex:1,extraLabels:['Yumurta','Ekstra kaşar'],quantity:2});
 assert.equal(x.key,y.key);
 assert.equal(addLine([x],y)[0].quantity,3);
});
test('Porsiyon veya malzeme değişirse ayrı sepet satırıdır',()=>{
 const p=find('pide-kiymali');const a=buildCartLine(p,{variantIndex:0});const b=buildCartLine(p,{variantIndex:1});const c=buildCartLine(p,{variantIndex:0,extraLabels:['Yumurta']});
 assert.equal(addLine(addLine([a],b),c).length,3);
});
test('Azaltma, artırma ve sıfırda satır kaldırma',()=>{
 const p=buildCartLine(find('ayran'));
 assert.equal(changeQuantity([p],p.key,3)[0].quantity,4);
 assert.equal(changeQuantity([p],p.key,-1).length,0);
 assert.equal(changeQuantity([{...p,quantity:50}],p.key,1)[0].quantity,50);
});
test('Aşırı adet, sahte porsiyon, tekrar ekstra ve sahte ekstra engellenir',()=>{
 const p=find('pide-kiymali');
 assert.throws(()=>buildCartLine(p,{quantity:MAX_LINE_QUANTITY+1}));
 assert.throws(()=>buildCartLine(p,{variantIndex:99}));
 assert.throws(()=>buildCartLine(p,{extraLabels:['Yumurta','Yumurta']}));
 assert.throws(()=>buildCartLine(p,{extraLabels:['Ücretsiz altın']}));
 assert.throws(()=>addLine([one],{...one,quantity:49}));
});
test('Fiyatlarda kuruş hassasiyeti korunur',()=>{
 const p={...find('ayran'),price:1.10,extras:[{label:'Ek',price:.20}]};
 const l=buildCartLine(p,{extraLabels:['Ek'],quantity:3});
 assert.equal(l.unitPrice,1.3);assert.equal(totals([l]).subtotal,3.9);
});
test('Fiyat değişince sepet yenilenir, ürünü kaldırınca sepetten çıkar',()=>{
 const changed=products.map(p=>p.id===one.productId?{...p,variants:[{label:'Standart',price:215},{label:'1,5 porsiyon',price:330}]}:p);
 const out=refreshCart([one],changed);
 assert.equal(out.removed,0);assert.equal(out.priceChanged,true);assert.equal(out.lines[0].unitPrice,390);
 const removed=refreshCart([one],products.filter(p=>p.id!==one.productId));
 assert.equal(removed.removed,2);assert.equal(removed.lines.length,0);
});
test('Satışta olmayan üründen sipariş verilemez',()=>{
 assert.throws(()=>buildCartLine({...find('ayran'),available:false}));
});
test('Ad ve teslimat adresi doğrulanır',()=>{
 const base={cart:[one],...options,settings:seed.settings};
 assert.equal(validateCheckout({...base,customer:' '}),'Sipariş için adınızı girin (en az 2 karakter).');
 assert.match(validateCheckout({...base,address:'Kısa'}),/adres/);
 assert.equal(validateCheckout(base),'');
});
test('Gel-al için adres zorunlu değildir, işletme açık olmalıdır',()=>{
 const base={cart:[one],...options,delivery:'pickup',address:'',settings:seed.settings};
 assert.equal(validateCheckout(base),'');
 assert.match(validateCheckout({...base,settings:{...seed.settings,pickupAvailable:false}}),/kullanılamıyor/);
 assert.match(validateCheckout({...base,settings:{...seed.settings,orderingEnabled:false}}),/almıyor/);
});
test('Minimum sipariş ve WhatsApp numarası doğrulaması',()=>{
 const base={cart:[one],...options,settings:{...seed.settings,minimumOrder:750}};
 assert.match(validateCheckout(base),/Minimum sipariş/);
 assert.match(validateCheckout({...base,settings:{...seed.settings,minimumOrder:0},requireWhatsapp:true}),/WhatsApp/);
 assert.equal(isValidWhatsApp('905551234567'),true);
 assert.equal(isValidWhatsApp('90555-123-4567'),false);
 assert.throws(()=>whatsAppLink('javascript:alert(1)','Sipariş'));
});
test('Sipariş metninde adet, seçenek, ara tutar, adres ve not var',()=>{
 const msg=orderMessage({cart:[one],...options});
 for(const part of ['2 × Kıymalı Pide','1,5 porsiyon','Ekstra kaşar','Yumurta','740','Paket servis','Ayşe Yılmaz','Atatürk Mah.','Zile basmayınız','onaylar mısınız']) assert.ok(msg.includes(part),part);
 assert.ok(!msg.includes('undefined'));
 const url=whatsAppLink('905551234567',msg);assert.ok(url.startsWith('https://wa.me/905551234567?text='));assert.equal(decodeURIComponent(url.split('text=')[1]),msg);
});
test('Gel-al metninde adres yok, boş not basılmaz',()=>{
 const msg=orderMessage({cart:[buildCartLine(find('lahmacun'))],customer:'Ali',address:'Gizli adres',delivery:'pickup',note:'  '});
 assert.ok(msg.includes('Gel-al'));assert.ok(!msg.includes('Gizli adres'));assert.ok(!msg.includes('Sipariş notu:'));
});
test('Kayıtlı müşteri bilgileri sipariş hesaplayıcıda tutulmaz',()=>{
 const line=buildCartLine(find('lahmacun'));
 assert.equal(Object.hasOwn(line,'customer'),false);
 assert.equal(Object.hasOwn(line,'address'),false);
});
