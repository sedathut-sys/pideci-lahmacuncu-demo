import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {refreshCart,buildCartLine} from '../src/lib/order-core.mjs';

const store=readFileSync(new URL('../src/components/Storefront.tsx',import.meta.url),'utf8');

test('SSR ve ilk React hidratasyonu boş ürün listesiyle başlar',()=>{
  assert.match(store,/const \[products, setProducts\] = useState<Product\[\]>\(\[\]\)/);
  assert.match(store,/const \[menuReady, setMenuReady\] = useState\(false\)/);
  assert.doesNotMatch(store,/useState<Product\[\]>\(LIVE \? \[\] : initialProducts\)/);
});
test('İlk menü ve kategoriler yalnızca güncel veri yüklenince gösterilir',()=>{
  assert.match(store,/\{menuReady \? <>/);
  assert.match(store,/Menü hazırlanıyor…/);
  assert.match(store,/const sync = \(\) => \{setProducts\(readDemoProducts\(\)\);setSettings\(readDemoSettings\(\)\);setMenuReady\(true\);\}/);
  assert.match(store,/window\.addEventListener\('storage',sync\)/);
  assert.match(store,/setMenuReady\(true\)/);
});
test('Fiyat değişikliği eski sepette fark edilir ve yeni tutarla yenilenir',()=>{
  const old={id:'p1',name:'Kıymalı Pide',available:true,price:215,variants:[{label:'Standart',price:215}],extras:[]};
  const line=buildCartLine(old,{quantity:2});
  const changed={...old,price:235,variants:[{label:'Standart',price:235}]};
  const updated=refreshCart([line],[changed]);
  assert.equal(updated.priceChanged,true);
  assert.equal(updated.removed,0);
  assert.equal(updated.lines[0].unitPrice,235);
  assert.equal(updated.lines[0].quantity,2);
});
test('Silinen veya görünmez ürün sepetteki güncellemede çıkarılır',()=>{
  const product={id:'p2',name:'Ayran',available:true,price:40,extras:[]};
  const line=buildCartLine(product,{quantity:3});
  assert.equal(refreshCart([line],[]).removed,3);
  assert.equal(refreshCart([line],[{...product,available:false}]).lines.length,0);
});
