import {expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

export const productName='Kıymalı Pide';
export const mobileWidths=[320,360,390,430];
export const profileDesktop=info=>info.project.name==='masaustu-1280px';

export async function openPanel(page){
  await page.goto('./panel/');
  await expect(page.locator('.admin-mobile-product')).toHaveCount(8);
}
export async function openStore(page){
  await page.goto('./');
  await expect(page.locator('.product-card')).toHaveCount(8);
}
export function productCard(page,info,name=productName){
  return profileDesktop(info)
    ?page.locator('.admin-table-wrap tbody tr').filter({hasText:name}).first()
    :page.locator('.admin-mobile-product').filter({hasText:name}).first();
}
export function productAction(page,info,name,action){
  const card=productCard(page,info,name);
  if(profileDesktop(info)){
    if(action==='edit')return card.getByRole('button',{name:'Düzenle'});
    if(action==='delete')return card.getByRole('button',{name:'Sil'});
    return card.locator('.status-pill');
  }
  if(action==='edit')return card.getByRole('button',{name:name+' düzenle'});
  if(action==='delete')return card.getByRole('button',{name:name+' sil'});
  return card.locator('.status-pill');
}
export async function newEditor(page){
  await page.getByRole('button',{name:/Yeni ürün/}).click();
  const editor=page.getByRole('dialog',{name:'Ürün oluştur'});
  await expect(editor).toBeVisible();
  return editor;
}
export async function editEditor(page,info,name=productName){
  await productAction(page,info,name,'edit').click();
  const editor=page.getByRole('dialog',{name:'Ürün düzenle'});
  await expect(editor).toBeVisible();
  return editor;
}
export async function saveEditor(page,editor){
  await editor.locator('.admin-dialog-footer').getByRole('button',{name:'Ürünü kaydet'}).click();
  await expect(editor).toHaveCount(0);
  await expect(page.locator('.admin-notice')).toContainText('Ürün kaydedildi');
}
export function nameInput(editor){return editor.getByPlaceholder('Kıymalı Pide');}
export function priceInput(editor){return editor.getByRole('textbox',{name:'Menüde görünen satış fiyatı'});}
export async function createProduct(page,{name='G2 Test Ürün',price='20,49',category}={}){
  const editor=await newEditor(page);
  await nameInput(editor).fill(name);
  await priceInput(editor).fill(price);
  if(category){
    await editor.locator('.admin-form label').filter({hasText:'Kategori'}).locator('select').selectOption(category);
  }
  await saveEditor(page,editor);
  return name;
}
export async function downloadBackup(page){
  const event=page.waitForEvent('download');
  await page.getByRole('button',{name:/Demo yedeğini indir/}).click();
  const download=await event;
  const json=JSON.parse((await readFile(await download.path())).toString('utf8'));
  expect(json.version).toBe(3);
  return json;
}
export async function restoreBackup(page,data,{accept=true}={}){
  let dialogs=0;
  page.once('dialog',async d=>{dialogs++;if(accept)await d.accept();else await d.dismiss();});
  await page.getByLabel('Demo JSON yedeği seç').setInputFiles({
    name:'g2-izole-demo.json',
    mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify(data),'utf8'),
  });
  if(accept){
    await expect(page.locator('.admin-notice')).toContainText('Yedek doğrulandı ve geri yüklendi');
  }
  return dialogs;
}
export async function openCategories(page){
  await page.getByRole('button',{name:/Kategoriler/}).click();
  await expect(page.locator('.admin-category-row')).toHaveCount(4);
}
export async function addCategory(page,name){
  await page.locator('#new-category').fill(name);
  await page.getByRole('button',{name:/Kategori ekle/}).click();
}
export async function assertDefault(page){
  await expect(page.locator('.admin-mobile-product')).toHaveCount(8);
}
export async function makePng(page){
  const base64=await page.evaluate(()=>{
    const c=document.createElement('canvas');
    c.width=24;c.height=24;
    const ctx=c.getContext('2d');
    ctx.fillStyle='#ef7444';ctx.fillRect(0,0,24,24);
    ctx.fillStyle='#ffffff';ctx.fillRect(6,6,12,12);
    return c.toDataURL('image/png').split(',')[1];
  });
  return Buffer.from(base64,'base64');
}
