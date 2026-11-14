import {test,expect} from '@playwright/test';
import {openPanel,editEditor,saveEditor,productAction,productCard} from '../g2/helpers.mjs';
import {openCustomer} from '../g3/helpers.mjs';

const priceEditor=editor=>editor.getByRole('textbox',{name:'Menüde görünen satış fiyatı'});
const savedLine=(page,name)=>page.locator('.product-card').filter({has:page.getByRole('heading',{name,exact:true})});
const getPrice=async (panel,info,name)=>{
  return (await productCard(panel,info,name).innerText());
};

test('G412-01 iki yönetici sekmesi aynı anda farklı ürün kaydeder, ikisi de korunur',async ({page,context},info)=>{
  await openPanel(page);
  const second=await context.newPage();await openPanel(second);
  const a=await editEditor(page,info,'Kıymalı Pide');
  const b=await editEditor(second,info,'Kaşarlı Pide');
  await priceEditor(a).fill('270,49');
  await priceEditor(b).fill('250,75');
  const save=a.locator('.admin-dialog-footer').getByRole('button',{name:'Ürünü kaydet'});
  const save2=b.locator('.admin-dialog-footer').getByRole('button',{name:'Ürünü kaydet'});
  await Promise.all([save.click(),save2.click()]);
  await expect(a).toHaveCount(0);
  await expect(b).toHaveCount(0);
  const buyer=await context.newPage();
  await openCustomer(buyer);
  await expect(savedLine(buyer,'Kıymalı Pide').locator('.product-price')).toContainText('270,49');
  await expect(savedLine(buyer,'Kaşarlı Pide').locator('.product-price')).toContainText('250,75');
  await buyer.reload();
  await expect(savedLine(buyer,'Kıymalı Pide').locator('.product-price')).toContainText('270,49');
  await expect(savedLine(buyer,'Kaşarlı Pide').locator('.product-price')).toContainText('250,75');
});

test('G412-02 aynı ürünün çakışan düzenlemesinde kayıt reddedilir ve taslak kaybolmaz',async ({page,context},info)=>{
  await openPanel(page);
  const second=await context.newPage();await openPanel(second);
  const a=await editEditor(page,info,'Kıymalı Pide');
  const b=await editEditor(second,info,'Kıymalı Pide');
  await priceEditor(a).fill('261,49');
  await saveEditor(page,a);
  await priceEditor(b).fill('288,99');
  await b.locator('.admin-dialog-footer').getByRole('button',{name:'Ürünü kaydet'}).click();
  await expect(b).toBeVisible();
  await expect(second.locator('.admin-notice')).not.toContainText('Ürün kaydedildi');
  await expect(second.getByRole('alert')).toContainText('başka bir sekmede değiştirildi');
  await expect(priceEditor(b)).toHaveValue(/288,99/);
  const buyer=await context.newPage();await openCustomer(buyer);
  await expect(savedLine(buyer,'Kıymalı Pide').locator('.product-price')).toContainText('261,49');
});

test('G412-03 bir sekmedeki fiyat değişimi ikinci admin listesine ve müşteri sekmesine canlı yansır',async ({page,context},info)=>{
  await openPanel(page);
  const second=await context.newPage();await openPanel(second);
  const buyer=await context.newPage();await openCustomer(buyer);
  await editEditor(page,info,'Kaşarlı Pide').then(async dlg=>{
    await priceEditor(dlg).fill('243,75');
    await saveEditor(page,dlg);
  });
  await expect(productCard(second,info,'Kaşarlı Pide')).toContainText('243,75');
  await expect(savedLine(buyer,'Kaşarlı Pide').locator('.product-price')).toContainText('243,75');
});

test('G412-04 açık yönetici editörü dış güncellemede kapanmaz, eski veri üzerine yazılmaz',async ({page,context},info)=>{
  await openPanel(page);
  const second=await context.newPage();await openPanel(second);
  const draft=await editEditor(second,info,'Kıymalı Pide');
  await draft.getByPlaceholder('Kıymalı Pide').fill('G412 KAYDEDİLMEMİŞ TASLAK');
  const first=await editEditor(page,info,'Kıymalı Pide');
  await priceEditor(first).fill('274,75');
  await saveEditor(page,first);
  await expect(draft).toBeVisible();
  await expect(draft.getByPlaceholder('Kıymalı Pide')).toHaveValue('G412 KAYDEDİLMEMİŞ TASLAK');
  await draft.locator('.admin-dialog-footer').getByRole('button',{name:'Ürünü kaydet'}).click();
  await expect(second.getByRole('alert')).toContainText('başka bir sekmede değiştirildi');
  const buyer=await context.newPage();await openCustomer(buyer);
  await expect(savedLine(buyer,'Kıymalı Pide').locator('.product-price')).toContainText('274,75');
  await expect(buyer.getByRole('heading',{name:'G412 KAYDEDİLMEMİŞ TASLAK'})).toHaveCount(0);
});

test('G412-05 nötr ilk SSR metinleri ve güncellenmiş işletme adı',async ({page,context})=>{
  await openPanel(page);
  await page.getByRole('button',{name:/İşletme ayarları/}).click();
  const name=page.locator('.admin-settings-grid label').filter({hasText:'İşletme adı'}).locator('input');
  await name.fill('G412 KONTROLLÜ FIRIN');
  await page.getByRole('button',{name:'Ayarları kaydet'}).click();
  const buyer=await context.newPage();
  await buyer.addInitScript(()=>{
    const values=[];
    const observer=new MutationObserver(()=>{
      const announcement=document.querySelector('.announcement')?.textContent?.trim();
      if(announcement && announcement!==values.at(-1))values.push(announcement);
    });
    observer.observe(document,{childList:true,subtree:true,characterData:true});
    window.__g412Brands=values;
  });
  await openCustomer(buyer);
  await expect(buyer.locator('.announcement')).toContainText('G412 KONTROLLÜ FIRIN');
  const values=await buyer.evaluate(()=>window.__g412Brands);
  expect(values.length).toBeGreaterThan(0);
  expect(values.every(v=>!v.includes('Taş Fırın'))).toBe(true);
  await expect(buyer.locator('.brand-text').first()).toContainText('G412 KONTROLLÜ FIRIN');
});

test('G412-06 görünürlük değişikliği ayrı admin sekmesine ve müşteri menüsüne geçer',async ({page,context},info)=>{
  await openPanel(page);
  const second=await context.newPage();await openPanel(second);
  const buyer=await context.newPage();await openCustomer(buyer);
  await productAction(page,info,'Kıymalı Pide','status').click();
  await expect(productCard(second,info,'Kıymalı Pide').locator('.status-pill')).toContainText('Gizli');
  await expect(savedLine(buyer,'Kıymalı Pide')).toHaveCount(0);
  await productAction(second,info,'Kıymalı Pide','status').click();
  await expect(savedLine(buyer,'Kıymalı Pide')).toHaveCount(1);
});
