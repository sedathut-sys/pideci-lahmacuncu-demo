import {test,expect} from '@playwright/test';
import {
  isMobile,openMenu,cards,category,search,nav,chooseCategory,navVisible,
  addCustomCategoryAndProduct,openPanel,productAction,
} from './helpers.mjs';

test('G4-01 menü açılışında 8 ürün ve 5 kategori düğmesi erişilebilir',async ({page})=>{
  const group=await openMenu(page);
  await expect(group.getByRole('button')).toHaveCount(5);
  for(const label of ['Tümü','Pide','Lahmacun','Yan Ürün','İçecek']){
    await expect(category(page,label)).toBeVisible();
  }
  await expect(category(page,'Tümü')).toHaveAttribute('aria-pressed','true');
});

test('G4-02 kategori: Pide 3 ürün, yalnız Pide kartları',async ({page})=>{
  await openMenu(page);
  await chooseCategory(page,'Pide',3);
  await expect(cards(page).locator('.product-category')).toHaveText(['Pide','Pide','Pide']);
});

test('G4-03 kategori: Lahmacun 1 ürün ve doğru isim',async ({page})=>{
  await openMenu(page);
  await chooseCategory(page,'Lahmacun',1);
  await expect(cards(page).getByRole('heading',{name:'Antep Usulü Lahmacun'})).toBeVisible();
});

test('G4-04 kategori: Yan Ürün 2 adet, kategoriye uygunluk',async ({page})=>{
  await openMenu(page);
  await chooseCategory(page,'Yan Ürün',2);
  await expect(cards(page).locator('.product-category')).toHaveText(['Yan Ürün','Yan Ürün']);
});

test('G4-05 kategori: İçecek 2 adet, ürün isimleri',async ({page})=>{
  await openMenu(page);
  await chooseCategory(page,'İçecek',2);
  await expect(cards(page).getByRole('heading',{name:'Ayran'})).toBeVisible();
  await expect(cards(page).getByRole('heading',{name:'Maden Suyu'})).toBeVisible();
});

test('G4-06 kategori değiştirme ve Tümü ile 8 ürüne güvenli dönüş',async ({page})=>{
  await openMenu(page);
  await chooseCategory(page,'Pide',3);
  await chooseCategory(page,'İçecek',2);
  await chooseCategory(page,'Tümü',8);
  await expect(category(page,'İçecek')).toHaveAttribute('aria-pressed','false');
});

test('G4-07 arama: farklı harf büyüklüğü KıYmAlI bulunur',async ({page})=>{
  await openMenu(page);
  await search(page).fill('KıYmAlI');
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page).getByRole('heading',{name:'Kıymalı Pide'})).toBeVisible();
});

test('G4-08 açıklama içinde kelime arama, Türkçe harf duyarlılığı',async ({page})=>{
  await openMenu(page);
  await search(page).fill('baharatlı');
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page).getByRole('heading',{name:'Kıymalı Pide'})).toBeVisible();
  await search(page).fill('KÜNEFE');
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page).getByRole('heading',{name:'Künefe'})).toBeVisible();
});

test('G4-09 negatif: olmayan ürün araması sıfır sonuç ve bilgilendirme',async ({page})=>{
  await openMenu(page);
  await search(page).fill('G4-HIC-BULUNMAYAN-URUN-987');
  await expect(cards(page)).toHaveCount(0);
  await expect(page.locator('.empty-products').last()).toContainText('Bu kategoride ürün bulunamadı');
});

test('G4-10 negatif: özel karakterler regex veya HTML gibi işletilmez',async ({page})=>{
  await openMenu(page);
  await search(page).fill('.*[<>]');
  await expect(cards(page)).toHaveCount(0);
  await expect(page.locator('.empty-products').last()).toBeVisible();
  await search(page).fill('<img src=x onerror=alert(1)>');
  await expect(cards(page)).toHaveCount(0);
  await expect(page.locator('img[src="x"]')).toHaveCount(0);
});

test('G4-11 arama temizlenince tüm ürünler ve kategori seçimi korunur',async ({page})=>{
  await openMenu(page);
  await chooseCategory(page,'Pide',3);
  await search(page).fill('Kıymalı');
  await expect(cards(page)).toHaveCount(1);
  await search(page).fill('');
  await expect(cards(page)).toHaveCount(3);
  await expect(category(page,'Pide')).toHaveAttribute('aria-pressed','true');
});

test('G4-12 kategori ve arama kesişimi: ayran Pide içinde görünmez',async ({page})=>{
  await openMenu(page);
  await chooseCategory(page,'Pide',3);
  await search(page).fill('Ayran');
  await expect(cards(page)).toHaveCount(0);
  await chooseCategory(page,'İçecek',1);
  await expect(cards(page).getByRole('heading',{name:'Ayran'})).toBeVisible();
  await chooseCategory(page,'Tümü',1);
});

test('G4-13 mobil menü aç-kapat, masaüstünde sabit menü',async ({page},info)=>{
  await openMenu(page);
  await navVisible(page,info);
  if(isMobile(info)){
    const expanded=page.getByRole('button',{name:'Menüyü kapat'});
    await expect(expanded).toHaveAttribute('aria-controls','site-navigation');
    await expanded.click();
    await expect(page.getByRole('button',{name:'Menüyü aç'})).toHaveAttribute('aria-expanded','false');
    await expect(nav(page)).toBeHidden();
  }else{
    await expect(nav(page)).toBeVisible();
  }
});

test('G4-14 menü bağlantısıyla #menu hedefine git, mobil açılır menü kapanır',async ({page},info)=>{
  await openMenu(page);
  await navVisible(page,info);
  await nav(page).getByRole('link',{name:'Menümüz'}).click();
  await expect(page).toHaveURL(/#menu$/);
  await expect(page.locator('#menu')).toBeVisible();
  if(isMobile(info))await expect(page.getByRole('button',{name:'Menüyü aç'})).toHaveAttribute('aria-expanded','false');
});

test('G4-15 navigasyon bağlantılarının tüm sayfa içi hedefleri mevcut',async ({page},info)=>{
  await openMenu(page);
  await navVisible(page,info);
  const links=await nav(page).locator('a[href^="#"]').evaluateAll(nodes=>nodes.map(a=>({
    href:a.getAttribute('href'),label:(a.textContent||'').trim(),
  })));
  expect(links).toHaveLength(4);
  const ids=links.map(x=>x.href.slice(1));
  expect(ids).toEqual(['anasayfa','menu','nedenbiz','iletisim']);
  for(const id of ids)await expect(page.locator('#'+id)).toHaveCount(1);
  const missing=await page.evaluate(ids=>ids.filter(id=>!document.getElementById(id)),ids);
  expect(missing).toEqual([]);
});

test('G4-16 mobil açılır menü Escape ile kapanır, masaüstünde görünür kalır',async ({page},info)=>{
  await openMenu(page);
  await navVisible(page,info);
  await page.keyboard.press('Escape');
  if(isMobile(info)){
    await expect(nav(page)).toBeHidden();
    await expect(page.getByRole('button',{name:'Menüyü aç'})).toHaveAttribute('aria-expanded','false');
  }else await expect(nav(page)).toBeVisible();
});

test('G4-17 klavyeyle kategori Enter ve arama alanı filtreleme',async ({page})=>{
  await openMenu(page);
  await category(page,'Lahmacun').focus();
  await expect(category(page,'Lahmacun')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(cards(page)).toHaveCount(1);
  await search(page).focus();
  await page.keyboard.type('AranmayanG4');
  await expect(cards(page)).toHaveCount(0);
  await search(page).fill('');
  await expect(cards(page)).toHaveCount(1);
});

test('G4-18 erişilebilir klavye atlaması gerçek #menu hedefine gider',async ({page})=>{
  await openMenu(page);
  const skip=page.getByRole('link',{name:'Doğrudan menüye geç'});
  await skip.focus();
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#menu$/);
  await expect(page.locator('#menu')).toHaveCount(1);
});

test('G4-19 tarayıcı geçmişi: #menu, #nedenbiz ve geri/ileri',async ({page})=>{
  await openMenu(page);
  await page.locator('.hero-buttons a[href="#menu"]').click();
  await expect(page).toHaveURL(/#menu$/);
  await page.locator('.hero-buttons a[href="#nedenbiz"]').click();
  await expect(page).toHaveURL(/#nedenbiz$/);
  await page.goBack();
  await expect(page).toHaveURL(/#menu$/);
  await page.goForward();
  await expect(page).toHaveURL(/#nedenbiz$/);
});

test('G4-20 footer ile paneli açma ve tarayıcı geri dönüşü',async ({page})=>{
  await openMenu(page);
  await page.getByRole('link',{name:/İşletmeci paneli demosu/}).click();
  await expect(page).toHaveURL(/\/panel\/$/);
  await expect(page.locator('.admin-mobile-product')).toHaveCount(8);
  await page.goBack();
  await expect(page.locator('.product-card')).toHaveCount(8);
  await expect(page).toHaveURL(/\/pideci-lahmacuncu-demo\/$/);
});

test('G4-21 yeni kategori/ürün panelden açık müşteri sekmesine gelir',async ({page,context})=>{
  const group=await openMenu(page);
  const panel=await context.newPage();
  await addCustomCategoryAndProduct(panel);
  await expect(group.getByRole('button',{name:'G4 DEMO KATEGORİ'})).toBeVisible();
  await chooseCategory(page,'G4 DEMO KATEGORİ',1);
  await expect(cards(page).getByRole('heading',{name:'G4 DEMO ÜRÜN'})).toBeVisible();
  await search(page).fill('G4 DEMO');
  await expect(cards(page)).toHaveCount(1);
  await page.reload();
  await expect(category(page,'G4 DEMO KATEGORİ')).toBeVisible();
});

test('G4-22 panelin gizlediği ürün müşteri kategori/arama filtresinden kalkar',async ({page,context},info)=>{
  await openMenu(page);
  await chooseCategory(page,'Pide',3);
  await search(page).fill('Kıymalı');
  await expect(cards(page)).toHaveCount(1);
  const panel=await context.newPage();
  await openPanel(panel);
  await productAction(panel,info,'Kıymalı Pide','status').click();
  await expect(cards(page)).toHaveCount(0);
  await expect(page.locator('.empty-products').last()).toBeVisible();
  await productAction(panel,info,'Kıymalı Pide','status').click();
  await expect(cards(page)).toHaveCount(1);
  await expect(category(page,'Pide')).toHaveAttribute('aria-pressed','true');
});
