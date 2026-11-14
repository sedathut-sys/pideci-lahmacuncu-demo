import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {formatAdminPrice,parsePriceDraft} from '../src/lib/price-rules.mjs';

const priceInput=readFileSync(new URL('../src/components/PriceInput.tsx',import.meta.url),'utf8');
const panel=readFileSync(new URL('../src/components/AdminPanel.tsx',import.meta.url),'utf8');

test('5.10.9: fiyat 230,50 olarak yazılabilir ve tam 230,50 TL gösterilir',()=>{
  assert.equal(parsePriceDraft('00230,50'),230.5);
  assert.match(formatAdminPrice(230.5),/230,50/);
  assert.match(formatAdminPrice(20.49),/20,49/);
  assert.match(formatAdminPrice(215),/215/);
  assert.match(priceInput,/Number\.isInteger\(value\)\?String\(value\):value\.toFixed\(2\)/);
});

test('5.10.9: mobil kart görünürlük filtresi ve arama birleşir, kaydetme bekler',()=>{
  assert.match(panel,/visibilityFilter==='all'/);
  assert.match(panel,/aria-pressed=\{visibilityFilter===mode\}/);
  assert.match(panel,/matches\.length\} \/ \{products\.length\} ürün gösteriliyor/);
  assert.match(panel,/Kaydedilmemiş değişiklikler var/);
  assert.match(panel,/className="admin-cancel" onClick=\{requestCloseEditor\}>İptal/);
});
