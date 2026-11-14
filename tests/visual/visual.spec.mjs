import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve, relative } from 'node:path';

const approvalFile = resolve('tests/visual/BASELINES_APPROVED.md');
const requestedMode = process.env.VISUAL_MODE || 'auto';
if (!['auto', 'capture', 'compare'].includes(requestedMode)) {
  throw new Error('VISUAL_MODE must be auto, capture or compare.');
}
const mode = requestedMode === 'auto'
  ? (existsSync(approvalFile) ? 'compare' : 'capture')
  : requestedMode;
if (mode === 'compare' && !existsSync(approvalFile)) {
  throw new Error('G1 comparison refused: approved baseline marker is missing.');
}
const screenshotOptions = {
  animations: 'disabled',
  caret: 'hide',
  scale: 'css',
  timeout: 20_000,
};

async function stablePage(page) {
  await page.addStyleTag({
    content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important}.topbar{position:relative!important}.skip-link{display:none!important}',
  });
  await page.evaluate(async () => { await document.fonts.ready; });
}

async function loadedImages(page, selector) {
  const images = page.locator(selector);
  const count = await images.count();
  for (let i = 0; i < count; i += 1) {
    const img = images.nth(i);
    await img.scrollIntoViewIfNeeded();
    await expect.poll(
      () => img.evaluate(node => node.complete && node.naturalWidth > 0),
      { timeout: 15_000 },
    ).toBe(true);
  }
}

async function compareOrCapture(locator, testInfo, name) {
  const approvedPath = testInfo.snapshotPath(name, { kind: 'screenshot' });
  if (mode === 'compare') {
    if (!existsSync(approvedPath)) {
      throw new Error('Approved G1 screenshot missing: ' + relative(process.cwd(), approvedPath));
    }
    await expect(locator).toHaveScreenshot(name, {
      ...screenshotOptions,
      maxDiffPixelRatio: 0.005,
    });
    return;
  }

  // Candidate capture is not a passing visual comparison.
  const candidate = resolve('test-results/visual-baseline-candidates', testInfo.project.name, name);
  await mkdir(dirname(candidate), { recursive: true });
  const png = await locator.screenshot(screenshotOptions);
  await writeFile(candidate, png);
  await testInfo.attach('ADAY-' + testInfo.project.name + '-' + name, {
    path: candidate,
    contentType: 'image/png',
  });
  console.log('G1 ADAY (henüz karşılaştırılmadı): ' + relative(process.cwd(), candidate));
  console.log('Onaydan sonraki referans yolu: ' + relative(process.cwd(), approvedPath));
}

test.beforeAll(() => {
  console.log('G1 GÖRSEL MOD: ' + mode.toUpperCase());
});

test('G1 müşteri: ana karşılama alanı', async ({ page }, info) => {
  await page.goto('./');
  await expect(page.locator('.product-card')).toHaveCount(8);
  await stablePage(page);
  await loadedImages(page, '.hero img');
  await compareOrCapture(page.locator('.hero'), info, 'musteri-ana-alan.png');
});

test('G1 müşteri: ürün menüsü ve kartlar', async ({ page }, info) => {
  await page.goto('./');
  await expect(page.locator('.product-card')).toHaveCount(8);
  await stablePage(page);
  await loadedImages(page, '.menu-section .product-card img');
  await compareOrCapture(page.locator('.menu-section'), info, 'musteri-menu-kartlari.png');
});

test('G1 müşteri: ürün seçenek penceresi', async ({ page }, info) => {
  await page.goto('./');
  await expect(page.locator('.product-card')).toHaveCount(8);
  await page.getByRole('button', { name: 'Kıymalı Pide sepete ekle' }).click();
  const dialog = page.getByRole('dialog', { name: 'Kıymalı Pide seçenekleri' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('checkbox').nth(0).check();
  await stablePage(page);
  await loadedImages(page, '.config-modal img');
  await compareOrCapture(dialog, info, 'musteri-urun-secenekleri.png');
});

test('G1 müşteri: sepet ve teslimat görünümü', async ({ page }, info) => {
  await page.goto('./');
  await expect(page.locator('.product-card')).toHaveCount(8);
  await page.getByRole('button', { name: 'Kıymalı Pide sepete ekle' }).click();
  const choices = page.getByRole('dialog', { name: 'Kıymalı Pide seçenekleri' });
  await expect(choices).toBeVisible();
  await choices.getByRole('checkbox').nth(0).check();
  await choices.getByRole('button', { name: /Sepete ekle/ }).click();
  const mobileBar = page.locator('.mobile-cart-bar');
  if (await mobileBar.isVisible()) {
    await mobileBar.getByRole('button', { name: /Sepeti Gör/i }).click();
  } else {
    await page.locator('.cart-pill').click();
  }
  const cart = page.getByRole('dialog', { name: 'Sepetim' });
  await expect(cart).toBeVisible();
  await stablePage(page);
  await compareOrCapture(cart, info, 'musteri-sepet.png');
  // Demo: WhatsApp mesajı gönderilmez.
});

test('G1 panel: ürün yönetim listesi', async ({ page }, info) => {
  await page.goto('./panel/');
  await expect(page.locator('.admin-mobile-product')).toHaveCount(8);
  const desktop = info.project.name === 'masaustu-1280px';
  await stablePage(page);
  await loadedImages(page, desktop ? '.admin-table-wrap img' : '.admin-mobile-product img');
  const list = page.locator(desktop ? '.admin-table-wrap' : '.admin-mobile-cards');
  await expect(list).toBeVisible();
  await compareOrCapture(list, info, 'panel-urun-listesi.png');
});

test('G1 panel: yeni ürün düzenleme penceresi', async ({ page }, info) => {
  await page.goto('./panel/');
  await expect(page.locator('.admin-mobile-product')).toHaveCount(8);
  await page.getByRole('button', { name: /Yeni ürün/ }).click();
  const editor = page.getByRole('dialog', { name: 'Ürün oluştur' });
  await expect(editor).toBeVisible();
  await stablePage(page);
  await compareOrCapture(editor, info, 'panel-urun-duzenleyici.png');
  // Kaydetme yapılmaz; izole demo bağlamı korunur.
});

test('G1 panel: formun alt bölümü, porsiyon ve ekstra alanları', async ({ page }, info) => {
  await page.goto('./panel/');
  await expect(page.locator('.admin-mobile-product')).toHaveCount(8);
  await page.getByRole('button', { name: /Yeni ürün/ }).click();
  const editor = page.getByRole('dialog', { name: 'Ürün oluştur' });
  await expect(editor).toBeVisible();
  await stablePage(page);
  const form = editor.locator('.admin-form');
  await expect(form).toBeVisible();
  const dimensions = await form.evaluate(node => ({
    scrollHeight: node.scrollHeight,
    clientHeight: node.clientHeight,
  }));
  expect(dimensions.scrollHeight).toBeGreaterThan(dimensions.clientHeight);
  await form.evaluate(node => { node.scrollTop = node.scrollHeight; });
  await expect(editor.getByRole('button', { name: 'Ürünü kaydet' }).last()).toBeVisible();
  await compareOrCapture(editor, info, 'panel-form-alt-bolum.png');
});
