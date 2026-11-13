import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const storefront=readFileSync(new URL('../src/components/Storefront.tsx',import.meta.url),'utf8');
const styles=readFileSync(new URL('../src/styles/global.css',import.meta.url),'utf8');
test('Sepete ekleme otomatik ödeme/sepet ekranına yönlendirmez',()=>{
  const fn=storefront.split('function addToCart(')[1].split('function quantityChange(')[0];
  assert.match(fn, /setAddedProduct\(product\.name\)/);
  assert.doesNotMatch(fn, /setCartOpen\(true\)/);
  assert.match(fn, /addLine\(current,line\)/);
});
test('Ürün seçicinin sabit işlemleri kaydırılabilir seçeneklerden ayrıdır',()=>{
  assert.match(storefront, /className="config-options-scroll"/);
  assert.match(storefront, /className="config-sticky-actions"/);
  assert.match(styles, /\.config-options-scroll\{[^}]*overflow-y:auto/);
  assert.match(styles, /\.config-sticky-actions\{[^}]*flex:none/);
  assert.match(styles, /\.product-backdrop .config-modal\{[^}]*max-height:88dvh/);
});
test('Sepete ürün ekledikten sonra geri bildirim ve Sepeti Gör seçeneği görünür',()=>{
  assert.match(storefront, /addedProduct && !selected && !cartOpen/);
  assert.match(storefront, /sepete eklendi/);
  assert.match(storefront, /Sepeti gör/);
});
test('Dolu sepetten menüye dönüş yolu vardır',()=>{
  assert.match(storefront, /cart-continue-link/);
  assert.match(storefront, /href="#menu"/);
  assert.match(storefront, /Menüden başka ürün ekle/);
});
test('Mobil sepet çubuğu toplamı ve ürün adedini gösterir',()=>{
  assert.match(storefront, /className="mobile-cart-bar"/);
  assert.match(storefront, /cartQuantity\(cart\)/);
  assert.match(storefront, /money\(total\)/);
  assert.match(styles, /\.mobile-cart-bar\{position:fixed/);
  assert.match(styles, /env\(safe-area-inset-bottom\)/);
});
test('Sipariş hesaplaması ve demo güvenliği korunur',()=>{
  assert.match(storefront, /validateCheckout\(/);
  assert.match(storefront, /refreshCart\(/);
  assert.match(storefront, /if\(!LIVE\) \{setMessagePreview\(message\)/);
  assert.match(storefront, /3 \/ 3 · Sipariş mesajını gör/);
});
test('Daha az tekrarlanan CTA ve üç aşamalı bilgi akışı',()=>{
  assert.match(storefront, /Üç adımda/);
  assert.match(storefront, /2 \/ 3 · SEPET VE TESLİMAT/);
  assert.doesNotMatch(storefront, /Şimdi sipariş oluştur/);
});
