import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('Mobil panel ürün kartları ve tüm yönetim eylemleri',()=>{
 const panel=read('src/components/AdminPanel.tsx');
 assert.match(panel,/admin-mobile-cards/);
 assert.match(panel,/admin-mobile-product-actions/);
 assert.match(panel,/onClick=\{\(\)=>toggleProduct\(p\)\}/);
 assert.match(panel,/onClick=\{\(\)=>deleteProduct\(p\)\}/);
});
test('Marka bilgileri vitrin başlığında tek ayardan okunuyor',()=>{
 const store=read('src/components/Storefront.tsx');
 assert.match(store,/settings\.name\.toLocaleUpperCase/);
 assert.match(store,/brandInitials\(settings\.name\)/);
 assert.doesNotMatch(store,/<span className="brand-text">TAŞ FIRIN/);
});
test('Mobil kart düzeni ve dokunma hedefleri tanımlı',()=>{
 const css=read('src/styles/global.css');
 assert.match(css,/\.admin-mobile-cards\{display:grid/);
 assert.match(css,/\.products-grid\{display:grid;grid-template-columns:minmax\(0,1fr\)/);
 assert.match(css,/\.admin-mobile-product-actions button\{[^}]*min-height:46px/);
 assert.match(css,/\.add-button\{min-height:46px/);
});
