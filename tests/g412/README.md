# G4.1.2 — İki Kusurun 5.10.10 Ana Tabanında İzole Düzeltilmesi

**Taban:** Dal doğrudan güncel `main` **5.10.10**, başlangıç commit `aec1c067a04f50f843ce76e3777ec5620ed525e0` üzerinden açıldı. 5.10.9 ana sürümünün üzerine başka çalışma sırasında 5.10.10 mobil kategori düzeni ve 12 yeni mobil koşum eklendi; bunlar korunuyor.

## Bağımsız onay zinciri
G1–G4.1 test dalındaki 74 ek dosya GitHub git tree içinde **aynı blob SHA** ile bu yeni dala taşındı; bunlardan 35'i önceden onaylı PNG. Asıl G4.1 dalının `main` ile birleştirilmesi yapılmadı, ana site kodu mevcut `main` sürümünü koruyor.

G1 onaylı görsellerin SHA-256 özeti: `ed93c886e685a6a0c168378e9004e1ffcbf07b194accae6ad00334bf3df61f40`. Onaylı PNG'ler **güncellenmez**. Ana daldaki 5.10.9 ve 5.10.10 mobil CSS değişikliklerinin, özellikle yönetim panelinde, eski görüntülerden meşru farklılıklar yaratabilmesi bekleniyor. Bunlar sonuçlarda **FAIL olarak görünür**, gizlenmez veya yeni referans diye onaylanmaz.

## G41-001 — Ürün değişikliği kaybını önleme
- `src/data/products.ts` içine demo için `mutateDemoProducts` eklendi.
- Her yazma öncesi son `localStorage` ürün listesi okunur; hedef ürünün değişikliği diğer ürünleri ezmeden uygulanır.
- Güvenli ortamda Web Locks API ile aynı kökendeki sekmeler arasında yazma adımları seri hâle getirilir. Web Locks desteklenmiyorsa yalnız *son değeri okumaya dayalı en iyi çaba* sağlanır; atomiklik **garanti edilmez**.
- `AdminPanel.tsx` içinde `storage` + mevcut veri değişikliği olaylarına abonelik kuruldu.
- Ürün editörü başka sekmeden gelen değişiklikte otomatik kapatılmaz; aynı ürün değiştirilmişse `editingBaseline` kontrolü ile hata gösterilir, yazma yapılmaz.
- Aynı güvenli yol ürün oluşturma, kaydetme, silme ve görünürlüğü değiştirmeye uygulandı.
- Canlı `D1` API işleme yolu **değiştirilmedi**; canlıda çoklu yazma atomikliği ayrıca sunucu tarafında ele alınmalı.

## G41-002 — İlk SSR/React yüklemesinde eski marka
- `src/components/Storefront.tsx` başlangıçta menü verisi okunmadan marka adı, slogan, iletişim ve footer bilgilerini varsayılan kayıtlardan görüntülemez.
- SSR ve ilk istemci renderı aynı nötr yükleme içeriğini kullanır; veriler okununca mevcut görünüm normal hâline gelir.
- Sayfanın statik `<title>` ve SEO metaverileri SSR iş modeliyle ilişkili başka bir karardır; kullanıcıya görünen ilk React içerik düzeltmesiyle karıştırılmaz.

## Ek kabul testleri
`tests/g412/concurrency.spec.mjs` — 6 × 5 = 30 ek Playwright koşumu:
1. Gerçek iki panelden eşzamanlı farklı ürün kaydı
2. Aynı ürün editöründe çakışma uyarısı ve taslağın korunması
3. Panel–panel–müşteri fiyat senkronizasyonu
4. Dış güncellemede açık editörün güvenli davranışı
5. İlk DOM'da yanlış marka bulunmaması
6. Görünürlük değişiminin sekmeler arası aktarılması

Ayrıca G4.1'in özgün **90 testinin tamamı**, G4 **110**, G3 **90**, G2 **85**, G8, G1 **35 PNG**, eski **28** mobil ve 5.10.9'un **12** + 5.10.10'un **12** yeni mobil koşumu gerçek CI üzerinde çalıştırılır. Ancak özgün 28 ile yeni toplam **52** aynı sürüm değil; güncel dalda toplam 52 mobil test hedeflenir.

## Kabul koşulları
- G41-16 ve G41-17 dahil **G4.1 90/90 PASS**.
- Ek G412 30/30 PASS ve güncel main mobil testleri PASS.
- Eski G2/G3/G4/G8 davranış testleri bozulmaz.
- G1'in 35 onaylı PNG'lerinin byte/SHA koruması PASS. Görsel karşılaştırmada fark varsa açık gerekçe ve kullanıcı onayı olmadan referans yenileme yok.
- **G8-001 açık:** panel skip-link `#menu` hedefine gitmiyor, bu PR kapsamına alınmadı.
- GitHub Actions `contents: read`; canlı site, `main`, GitHub Pages ve yayın kapısı değişmez; PR **draft** ve merge edilmeyecek.

## Yerel deneme
`npx playwright test --config=playwright.g41.config.mjs`
`npx playwright test --config=playwright.g412.config.mjs`
`npx playwright test --config=playwright.config.mjs`

**Dikkat:** Testler yerel Astro demo + Chromium emülasyonu. Gerçek telefon ve üretimdeki canlı D1 verisi için otomatik olarak güvenli sonucu vermez.
