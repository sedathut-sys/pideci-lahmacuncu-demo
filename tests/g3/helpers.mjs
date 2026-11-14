import {expect} from '@playwright/test';

export async function openCustomer(page,{count=8}={}){
  await page.goto('./');
  await expect(page.locator('.product-card')).toHaveCount(count);
}
export async function choose(page,{
  name='Kıymalı Pide',
  variantIndex=0,
  extras=[],
  qty=1,
}={}){
  await page.getByRole('button',{name:name+' sepete ekle'}).click();
  const dialog=page.getByRole('dialog',{name:name+' seçenekleri'});
  await expect(dialog).toBeVisible();
  if(variantIndex){
    await dialog.getByRole('radio').nth(variantIndex).check();
  }
  for(const name of extras){
    await dialog.getByRole('checkbox',{name}).check();
  }
  for(let i=1;i<qty;i++)await dialog.getByRole('button',{name:'Ürün adetini artır'}).click();
  return dialog;
}
export async function addToCart(page,options){
  const dialog=await choose(page,options);
  await dialog.getByRole('button',{name:/Sepete ekle/}).click();
  await expect(dialog).toHaveCount(0);
}
export async function openCart(page){
  const bar=page.locator('.mobile-cart-bar');
  if(await bar.isVisible())await bar.getByRole('button',{name:/Sepeti Gör/i}).click();
  else await page.locator('.cart-pill').click();
  const cart=page.getByRole('dialog',{name:'Sepetim'});
  await expect(cart).toBeVisible();
  return cart;
}
export function line(cart,productName,option=''){
  const rows=cart.locator('.cart-line').filter({has:cart.locator('h4').filter({hasText:productName})});
  return option?rows.filter({hasText:option}):rows.first();
}
export async function pickup(cart,name='G3 Kontrol'){
  await cart.getByRole('button',{name:/Gel-al/}).click();
  await cart.getByPlaceholder('Adınızı yazın').fill(name);
  return cart;
}
export async function delivery(cart,name='G3 Kontrol',address='Merkez Mahallesi Şehitler Sokak No 8 Rize'){
  await cart.getByRole('button',{name:/Paket servis/}).click();
  await cart.getByPlaceholder('Adınızı yazın').fill(name);
  await cart.getByPlaceholder('Mahalle, sokak, bina, daire...').fill(address);
  return cart;
}
export async function preview(cart){
  await cart.getByRole('button',{name:/Sipariş mesajını görüntüle/}).click();
  const message=cart.locator('.message-preview pre');
  await expect(message).toBeVisible();
  return message;
}
export async function setSettings(panel,{minimumOrder,orderingEnabled,deliveryAvailable,pickupAvailable}={}){
  await panel.getByRole('button',{name:/İşletme ayarları/}).click();
  const grid=panel.locator('.admin-settings-grid');
  if(minimumOrder!==undefined){
    await grid.getByRole('textbox',{name:'Minimum sipariş tutarı'}).fill(String(minimumOrder).replace('.',','));
  }
  if(orderingEnabled!==undefined){
    await grid.getByRole('checkbox',{name:/Sipariş alımı açık/}).setChecked(orderingEnabled);
  }
  if(deliveryAvailable!==undefined){
    await grid.getByRole('checkbox',{name:/Paket servis var/}).setChecked(deliveryAvailable);
  }
  if(pickupAvailable!==undefined){
    await grid.getByRole('checkbox',{name:/Gel-al var/}).setChecked(pickupAvailable);
  }
  await panel.getByRole('button',{name:'Ayarları kaydet'}).click();
  await expect(panel.locator('.admin-notice')).toContainText('İşletme ayarları kaydedildi');
}
export async function screenshotEvidence(page,info,label){
  await info.attach('G3-'+label+'.png',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
}
