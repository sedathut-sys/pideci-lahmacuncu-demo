# G1 - Görsel regresyon adayları ve kontrollü referans onayı

Bu klasör Taş Fırın'ın yalnızca görsel testlerini içerir. Mevcut dört mobil işlev senaryosu ve GitHub Pages yayını değiştirilmemiştir.

## İlk aşama - aday görüntüler

- Ayrı G1 GitHub Actions işi main hedefli PR üzerinde otomatik çalışır.
- VISUAL_MODE=auto, BASELINES_APPROVED.md yoksa capture modunu, varsa compare modunu seçer.
- 6 durum ve 5 ekran profili için 30 aday PNG üretir: 320, 360, 390, 430 px mobil ve 1280 px masaüstü.
- Aday PNG: test-results/visual-baseline-candidates/<profil>/<dosya>.png. HTML, JSON ve ekran görüntüleri Actions artifact olarak saklanır.
- Aday modundaki başarı, görsel karşılaştırmanın geçtiğini DEĞİL, adayların başarıyla üretildiğini ifade eder.

## Referans görüntülerini onaylama - açık kullanıcı onayı gerekir

1. Adayları incele; mevcut onaylı Taş Fırın tasarımıyla karşılaştır.
2. Kabul edilen aday PNG dosyalarını, proje klasörü ve isimleri değişmeden tests/visual/__snapshots__/<profil>/<dosya>.png altına ekle.
3. Yalnızca kullanıcı açıkça onayladıktan sonra tests/visual/BASELINES_APPROVED.md dosyasını onay tarihi ve kaynak commit bilgisiyle oluştur.
4. Bundan sonraki auto koşularında compare modu referansları Playwright toHaveScreenshot ile denetler. Referans eksikse test kesin olarak başarısız olur.
5. Karşılaştırma başarısız olduğunda Playwright beklenen/gerçek/fark görsellerini rapora ve artifact'e kaydeder.

Referanslar otomatik güncellenmez. CI'da --update-snapshots kullanılmaz. Tasarım değişikliklerinden sonra yalnızca yeni açık onay ile referans güncellenir.

## Kararlılık ve yanlış alarm önlemleri

- İzole tarayıcı bağlamları, gerçek müşteri verisini değiştirmez.
- Sabit Ubuntu 24.04, Chromium, locale tr-TR, Europe/Istanbul, açık tema ve sabit görüntü boyutları.
- CSS animasyonları/geçişler devre dışıdır; caret gizlenir, document.fonts.ready beklenir.
- Tembel yüklenen resimlere kaydırılır; complete ve naturalWidth kontrolleri geçmeden ekran görüntüsü alınmaz.
- maxDiffPixelRatio = 0.005 (%0,5) başlangıç eşiğidir; kritik alanlar maskelenmez.
- Google Fonts dış hizmeti hâlen kararlılık riski: G1'in sonraki sertleştirmesinde yerel ve sürüm sabit font değerlendirilmelidir.

## Çalıştırma

npm install
npx playwright install chromium
PUBLIC_DATA_MODE=demo PUBLIC_SITE_READY=false npm run build
VISUAL_MODE=capture npx playwright test --config=playwright.visual.config.mjs
VISUAL_MODE=compare npx playwright test --config=playwright.visual.config.mjs  (yalnızca onaylı referanstan sonra)

Eski 16 işlev senaryosu aynen korunur: npm run test:mobile.

## G1 tamamlanma şartları

- [ ] 30 aday görüntüsü CI'da başarıyla üretildi ve incelendi
- [ ] Kullanıcı tasarım referanslarını açıkça onayladı
- [ ] Onaylı referanslar Git geçmişine alındı
- [ ] Tekrarlanan karşılaştırma başarılı ve kasıtlı bozulma testi başarısız
- [ ] Mevcut 16/16 işlevsel test yeniden doğrulandı

Bu koşullar sağlanmadan G1 tamamlandı sayılmaz.