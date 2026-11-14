import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizePriceInput,displayedPrice,withDisplayedPrice} from '../src/lib/admin-prices.mjs';

const panel=readFileSync(new URL('../src/components/AdminPanel.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles/global.css',import.meta.url),'utf8');

test('Fiyat girişinde baştaki sıfırlar temizlenir',()=>{
  for(const [raw,expected] of [['0150','150'],['000150','150'],['000','0'],['000.5','0.5'],['0.5','0.5'],['0','0'],['',''],['105.25','105.25']])
    assert.equal(normalizePriceInput(raw),expected);
  const p={price:215,variants:[{label:'Standart',price:215},{label:'1,5 porsiyon',price:310}]};
  const n=withDisplayedPrice(p,Number(normalizePriceInput('0225')));
  assert.equal(displayedPrice(n),225);
  assert.equal(n.variants[1].price,310);
});

test('Fiyat alanı giriş ve odak kaybında düzenlenir',()=>{
  assert.match(panel,/normalizePriceInput\(input\.value\)/);
  assert.match(panel,/input\.value=normalized/);
  assert.match(panel,/onBlur=\{e=>\{e\.currentTarget\.value=String\(displayedPrice\(editing\)\)/);
});

test('Telefon klavyesi açılınca Kaydet erişilebilir kalır',()=>{
  assert.match(panel,/window\.visualViewport/);
  assert.match(panel,/viewport\.addEventListener\('resize',update\)/);
  assert.match(panel,/admin-backdrop-keyboard/);
  assert.match(panel,/keyboardViewport\.height/);
  assert.match(css,/\.admin-backdrop-keyboard \.admin-dialog-large\{height:100%;max-height:100%;/);
  assert.match(css,/\.admin-dialog-large:focus-within \.admin-header-save/);
  assert.match(panel,/className="admin-header-save" disabled=\{busy\} onClick=\{saveProduct\}/);
});

test('Fotoğraf seçenekleri Türkçe ürün adlarıyla listelenir',()=>{
  for(const name of ['Kıymalı Pide','Kaşarlı Pide','Karışık Pide','Antep Usulü Lahmacun','Çoban Salata','Künefe','Ayran','Maden Suyu'])
    assert.ok(panel.includes(`label:'${name}'`));
  assert.match(panel,/IMAGE_OPTIONS\.map\(\(\{image,label\}\)=>/);
  assert.doesNotMatch(panel,/\{img\.split\('\/'\)\.pop\(\)\}/);
});

test('Hazır görsel seçimi ve fotoğraf yükleme bildirimleri ayrıdır',()=>{
  assert.match(panel,/Hazır menü görseli seçildi/);
  assert.match(panel,/Yeni fotoğraf işlendi/);
  assert.match(panel,/Yeni fotoğraf sunucuya yüklendi/);
  assert.match(panel,/Yüklenen fotoğraf \(mevcut\)/);
  assert.match(panel,/setUploadState\(''\);setEditing\(syncDisplayPrice\(structuredClone\(p\)\)\)/);
});
