import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_LINE_QUANTITY,buildCartLine,addLine,changeQuantity,totals,
  refreshCart,validateCheckout,orderMessage,whatsAppLink,
} from '../../src/lib/order-core.mjs';

const product={
  id:'g3-pide',name:'G3 Pide',available:true,price:215,
  variants:[{label:'Standart',price:215},{label:'1,5 porsiyon',price:310}],
  extras:[{label:'Kaşar',price:35},{label:'Yumurta',price:25}],
};
const settings={
  orderingEnabled:true,deliveryAvailable:true,pickupAvailable:true,
  minimumOrder:0,whatsappNumber:'905555555555',
};
const ready={customer:'G3 Test',address:'Merkez Mahallesi No 10 Rize',delivery:'delivery',settings};

test('G3 matematik: iki porsiyon, iki ekstra, iki adet 740 TL',()=>{
  const x=buildCartLine(product,{variantIndex:1,extraLabels:['Kaşar','Yumurta'],quantity:2});
  assert.equal(x.unitPrice,370);
  assert.deepEqual(totals([x]),{quantity:2,subtotal:740});
});
test('G3 kuruş: 225,49 + 35,75 = 261,24 TL',()=>{
  const x=buildCartLine({...product,variants:[{label:'Standart',price:225.49}],extras:[{label:'Kaşar',price:35.75}]},{extraLabels:['Kaşar']});
  assert.equal(x.unitPrice,261.24);
  assert.equal(totals([x]).subtotal,261.24);
});
test('G3 aynı yapılandırma tek satır olur; farklı porsiyon ayrı satırdır',()=>{
  const a=buildCartLine(product,{extraLabels:['Kaşar']});
  const b=buildCartLine(product,{extraLabels:['Kaşar']});
  const c=buildCartLine(product,{variantIndex:1,extraLabels:['Kaşar']});
  assert.equal(addLine(addLine([],a),b).length,1);
  assert.equal(addLine(addLine([],a),c).length,2);
});
test('G3 adet 1..50 sınırı, sepet ekleme ve artış',()=>{
  assert.throws(()=>buildCartLine(product,{quantity:0}),/Adet/);
  assert.throws(()=>buildCartLine(product,{quantity:MAX_LINE_QUANTITY+1}),/Adet/);
  const line=buildCartLine(product,{quantity:50});
  assert.throws(()=>addLine([line],buildCartLine(product)),/en çok/);
  assert.equal(changeQuantity([line],line.key,+1)[0].quantity,50);
  assert.equal(changeQuantity([line],line.key,-50).length,0);
});
test('G3 geçersiz porsiyon, ekstra ve gizli ürün siparişe giremez',()=>{
  assert.throws(()=>buildCartLine(product,{variantIndex:99}),/Porsiyon/);
  assert.throws(()=>buildCartLine(product,{extraLabels:['Tanımsız']}),/Geçersiz ek malzeme/);
  assert.throws(()=>buildCartLine(product,{extraLabels:['Kaşar','Kaşar']}),/Geçersiz ek malzeme/);
  assert.throws(()=>buildCartLine({...product,available:false}),/satışta değil/);
});
test('G3 fiyat güncelleme: eski sepet korunarak yeni fiyat tespit edilir',()=>{
  const old=buildCartLine(product);
  const result=refreshCart([old],[{...product,price:235,variants:[{label:'Standart',price:235},product.variants[1]]}]);
  assert.equal(result.priceChanged,true);
  assert.equal(result.removed,0);
  assert.equal(result.lines[0].unitPrice,235);
});
test('G3 gizlenen veya silinen ürün kontrol aşamasında sepetten kaldırılır',()=>{
  const old=buildCartLine(product,{quantity:2});
  const a=refreshCart([old],[{...product,available:false}]);
  assert.equal(a.removed,2);assert.equal(a.lines.length,0);
  const b=refreshCart([old],[]);
  assert.equal(b.removed,2);assert.equal(b.lines.length,0);
});
test('G3 doğrulama: boş sepet, kısa ad/adres ve minimum sipariş',()=>{
  const line=buildCartLine(product);
  assert.match(validateCheckout({...ready,cart:[]}),/Önce sepet/);
  assert.match(validateCheckout({...ready,cart:[line],customer:'A'}),/adınızı/);
  assert.match(validateCheckout({...ready,cart:[line],address:'Rize'}),/açık teslimat/);
  assert.match(validateCheckout({...ready,cart:[line],settings:{...settings,minimumOrder:300}}),/Minimum sipariş/);
});
test('G3 gel-al adrese ihtiyaç duymaz; kapatılan teslimat veya sipariş reddedilir',()=>{
  const cart=[buildCartLine(product)];
  assert.equal(validateCheckout({...ready,cart,delivery:'pickup',address:''}),'');
  assert.match(validateCheckout({...ready,cart,settings:{...settings,orderingEnabled:false}}),/sipariş almıyor/);
  assert.match(validateCheckout({...ready,cart,settings:{...settings,pickupAvailable:false},delivery:'pickup'}),/kullanılamıyor/);
});
test('G3 mesaj: teslimat ve not alanları doğru, gel-al adresi sızdırmaz',()=>{
  const cart=[buildCartLine(product,{quantity:2})];
  const txt=orderMessage({cart,customer:'  G3   Test  ',address:'Merkez',note:'Az  tuzlu',delivery:'pickup'});
  assert.match(txt,/2 × G3 Pide/);
  assert.match(txt,/430,00/);
  assert.match(txt,/Teslimat türü: Gel-al/);
  assert.doesNotMatch(txt,/Adres:/);
  assert.match(txt,/Sipariş notu: Az tuzlu/);
});
test('G3 canlı WhatsApp URL formatı ancak geçerli numara ile oluşturulur',()=>{
  assert.throws(()=>whatsAppLink('','test'),/WhatsApp/);
  const url=whatsAppLink('905555555555','G3 A&B');
  assert.match(url,/^https:\/\/wa\.me\/905555555555\?text=G3%20A%26B$/);
});
