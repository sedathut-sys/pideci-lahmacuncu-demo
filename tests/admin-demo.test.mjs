import test from 'node:test';
import assert from 'node:assert/strict';
import { addCategory, removeCategory, validateCategories, assertCategoriesUsed } from '../src/lib/admin-core.mjs';

test('Aynı kategori iki kere eklenemez', () => {
  assert.deepEqual(addCategory(['Pide'],' Tatlılar '), ['Pide','Tatlılar']);
  assert.throws(() => addCategory(['Pide'],'pide'),/aynı/i);
});
test('Ürünü olan kategori silinemez', () => {
  assert.throws(() => removeCategory(['Pide','Tatlılar'],'Pide',[{category:'Pide'}]),/ürün var/);
  assert.deepEqual(removeCategory(['Pide','Tatlılar'],'Tatlılar',[]),['Pide']);
});
test('Kategorisiz ürün kalamaz', () => {
  assert.throws(() => assertCategoriesUsed([{category:'Pide'}],['Tatlılar']),/silinemez/);
});
test('En az 1 en fazla 24 kategori vardır', () => {
  assert.throws(() => validateCategories([]));
  assert.throws(() => validateCategories(Array.from({length:25},(_,i)=>`Kategori ${i}`)));
});
