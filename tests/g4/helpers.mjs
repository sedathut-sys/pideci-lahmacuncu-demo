import {expect} from '@playwright/test';
import {openPanel,newEditor,saveEditor,addCategory,editEditor,productAction} from '../g2/helpers.mjs';

export const isMobile=info=>info.project.name!=='masaustu-1280px';

export async function openMenu(page,count=8){
  await page.goto('./');
  await expect(page.locator('.product-card')).toHaveCount(count);
  await expect(page.getByRole('searchbox',{name:'Menüde ara'})).toBeVisible();
  return page.getByRole('group',{name:'Ürün kategorileri'});
}
export const cards=page=>page.locator('.product-card');
export const category=(page,name)=>page.getByRole('group',{name:'Ürün kategorileri'}).getByRole('button',{name,exact:true});
export const search=page=>page.getByRole('searchbox',{name:'Menüde ara'});
export const nav=page=>page.getByRole('navigation',{name:'Ana menü'});

export async function chooseCategory(page,name,count){
  await category(page,name).click();
  await expect(category(page,name)).toHaveAttribute('aria-pressed','true');
  await expect(cards(page)).toHaveCount(count);
}
export async function navVisible(page,info){
  if(isMobile(info)){
    const toggle=page.getByRole('button',{name:'Menüyü aç'});
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(page.getByRole('button',{name:'Menüyü kapat'})).toHaveAttribute('aria-expanded','true');
    await expect(nav(page)).toBeVisible();
  }else{
    await expect(nav(page)).toBeVisible();
    await expect(page.locator('.mobile-menu')).toBeHidden();
  }
}
export async function addCustomCategoryAndProduct(panel,name='G4 DEMO KATEGORİ',product='G4 DEMO ÜRÜN'){
  await openPanel(panel);
  await panel.getByRole('button',{name:/Kategoriler/}).click();
  await addCategory(panel,name);
  await expect(panel.locator('.admin-category-row')).toHaveCount(5);
  await panel.getByRole('button',{name:/Ürünler ve menü/}).click();
  const editor=await newEditor(panel);
  await editor.getByPlaceholder('Kıymalı Pide').fill(product);
  await editor.getByRole('textbox',{name:'Menüde görünen satış fiyatı'}).fill('25,49');
  await editor.locator('.admin-form label').filter({hasText:'Kategori'}).locator('select').selectOption(name);
  await saveEditor(panel,editor);
  await expect(panel.locator('.admin-mobile-product')).toHaveCount(9);
}
export {openPanel,editEditor,productAction};
