import {expect} from '@playwright/test';
import {
  openPanel,editEditor,newEditor,saveEditor,productAction,
  addCategory,downloadBackup,
} from '../g2/helpers.mjs';
import {openCustomer,addToCart,openCart,pickup,preview} from '../g3/helpers.mjs';

export const baseURL='http://127.0.0.1:4321/pideci-lahmacuncu-demo/';
export const productsKey='tas-firin:pideci-lahmacuncu-demo:products:v2';
export const settingsKey='tas-firin:pideci-lahmacuncu-demo:settings:v3';

export const cards=page=>page.locator('.product-card');
export const findCard=(page,name)=>cards(page).filter({has:page.getByRole('heading',{name,exact:true})});

export async function setPrice(panel,info,name,price){
  const dialog=await editEditor(panel,info,name);
  await dialog.getByRole('textbox',{name:'Menüde görünen satış fiyatı'}).fill(String(price));
  await saveEditor(panel,dialog);
}
export async function setName(panel,info,name,newName){
  const dialog=await editEditor(panel,info,name);
  await dialog.getByPlaceholder('Kıymalı Pide').fill(newName);
  await saveEditor(panel,dialog);
}
export async function seedCategory(panel,name='G41 KATEGORİ'){
  await panel.getByRole('button',{name:/Kategoriler/}).click();
  await addCategory(panel,name);
  await expect(panel.locator('.admin-category-row')).toHaveCount(5);
  await panel.getByRole('button',{name:/Ürünler ve menü/}).click();
}
export async function addProduct(panel,name,category){
  const dialog=await newEditor(panel);
  await dialog.getByPlaceholder('Kıymalı Pide').fill(name);
  await dialog.getByRole('textbox',{name:'Menüde görünen satış fiyatı'}).fill('49,99');
  if(category)await dialog.locator('.admin-form label').filter({hasText:'Kategori'}).locator('select').selectOption(category);
  await saveEditor(panel,dialog);
}
export async function setBusinessName(panel,name){
  await panel.getByRole('button',{name:/İşletme ayarları/}).click();
  const field=panel.locator('.admin-settings-grid label').filter({hasText:'İşletme adı'}).locator('input');
  await field.fill(name);
  await panel.getByRole('button',{name:'Ayarları kaydet'}).click();
  await expect(panel.locator('.admin-notice')).toContainText('İşletme ayarları kaydedildi');
}
export async function watchFirstPaint(page){
  await page.addInitScript(()=>{
    window.__g41Observed={cards:[],branding:[]};
    const observer=new MutationObserver(()=>{
      const values=Array.from(document.querySelectorAll('.product-card')).map(x=>({
        name:x.querySelector('h3')?.textContent?.trim()||'',
        price:x.querySelector('.product-price')?.textContent?.trim()||'',
      }));
      if(values.length)window.__g41Observed.cards.push(values);
      const brand=document.querySelector('.announcement')?.textContent?.trim();
      if(brand && window.__g41Observed.branding.at(-1)!==brand)window.__g41Observed.branding.push(brand);
    });
    observer.observe(document,{subtree:true,childList:true,characterData:true});
  });
}
export async function firstPaint(page){
  return await page.evaluate(()=>window.__g41Observed||{cards:[],branding:[]});
}
export async function takeEvidence(page,info,name){
  await info.attach('G41-'+name+'.png',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
}
export {openPanel,productAction,downloadBackup,openCustomer,addToCart,openCart,pickup,preview};
