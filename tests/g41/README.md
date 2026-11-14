# G4.1 — İlk Yükleme, SSR–React Hidratasyon ve İki Sekme Veri Senkronizasyonu

## Amaç
İlk müşteri ekranının yanlış veya eski ürün/fiyatı göstermediğini, iki sekmenin güncel verileri kullandığını, sipariş önizlemesinin eski fiyatla oluşturulmadığını ve eşzamanlı yönetici işlemlerinin veri kaybına yol açmadığını **gerçek tarayıcıda** kanıtlamak. Testlerin amacı kusur bulmak; ortaya çıkan gerçek sorunları saklamak veya test beklentisini gevşetmek değil.

## İlerleme dalı ve sürüm uyumu
- Yeni, izole test dalı: `feature/playwright-g4-1-ilk-yukleme-sekme-senkron-20261114`, temel G4: `feature/playwright-g4-mobil-menu-arama-gezinme-20261114`.
- Güncel main `c6922069e759936eed5bb1252774c1ce1f18b585` (5.10.9, 40 mobil test). G1–G4.1 zincirinin uygulama tabanı 5.10.8 (28 mobil test).
- `main` üzerinde 5.10.9 için `AdminPanel.tsx`, `PriceInput.tsx`, `price-rules.mjs`, `global.css` ve iki yeni test dosyası var. Bu değişiklikler G4.1'e merge edilmedi; uyum değerlendirmesi sonraki ayrı aşamada yapılmalı.
- G1 **35 onaylı PNG** korunur; otomatik güncelleme ve yeniden temel alma yok.

## G4.1: 18 senaryo × 5 Chromium profili = 90 koşum
01. SSR HTML'de veri yüklenmeden örnek 8 ürünün / kategorilerin sunulmaması
02. JavaScript kapalı SSR'da sahte ürün ve sipariş görünmemesi
03. İlk müşteri görüntüsünde güncellenmiş fiyat, eski 215 TL'nin hiç görünmemesi (MutationObserver)
04. Yeni ürün sonrası ilk görüntüde eski 8 ürün listesine dönmeme
05. Gizlenen ürünün yeni açılan sekmede bir an bile gösterilmemesi
06. İlk açılışta güncel kategori ve ürün tutarlılığı
07. İki müşteri sekmesinde üç hızlı fiyat değişikliğinin son değerinin görünmesi
08. Ürün adının iki sekmede arama sonuçlarına canlı yansıması
09. Silinen seçili kategoriden Tümü filtresine güvenli dönüş
10. İki hızlı fiyat değişikliğinden sonra eski sepetin sessizce sipariş oluşturmaması
11. Gizlenen ürünün iki açık sepette doğrulama sırasında kaldırılması
12. Art arda sayfa yenilemede en güncel fiyat ve kalıcılık
13. Bozuk localStorage JSON'unda güvenli varsayılanlara dönüş ve React hatası olmaması
14. Geçerli boş ürün dizisinin eski 8 örnek ürünle doldurulmaması
15. Bağımsız tarayıcı bağlamının başka kullanıcının demo verisini almaması
16. **Kritik yarış koşulu denetimi:** Aynı anda açık iki admin sekmesi farklı ürünleri güncellediğinde iki değişiklik de korunmalı. Gerçek veri kaybı varsa FAIL.
17. **İlk boya denetimi:** Yeni işletme adı kayıtlıyken SSR/hidratasyon boyunca eski marka anlık bile görünmemeli. Gerçek kısa süreli yanlış bilgi varsa FAIL.
18. İşletme adı değişikliği açık iki müşteri sekmesine ve yenilemeye doğru yansımalı

Profiller: mobil 320/360/390/430 ve masaüstü 1280 px, Chromium emülasyonu. Gerçek Android/iOS / canlı yayın testi değildir.

## CI kabulü
`.github/workflows/g41-initial-sync.yml` yalnız **G4.1 → G4 taslak PR** üzerinde ve `contents: read` yetkisiyle:
- G4.1 390 px ön tarama *bilgilendirici*, sonucu yeşile zorlamaz. Tam 90 test kesin kabul kapısıdır; hata varsa CI kırmızı kalır.
- G1 onay SHA256 + 35 gerçek görsel regresyon, önceki 28 mobil test, G8 10 birim + gerçek/sentetik tarayıcı kontrolleri, G2 85 panel, G3 90 sipariş +11 Node, G4 110 gezinme testi değişmeden koşar.
- G4.1 90 tarayıcı kabulü tamamında kırmızı/kritik bulgu saklanmaz.
- Türkçe HTML/JSON: `test-results/g41/G41_Turkce_Kabul_Raporu.html` ve `.json`; başarısız testlerin screenshot, error-context ve trace.zip kanıtları artifact olarak saklanır.

## Açık kusur
**G8-001 AÇIK:** Yönetici panelinin `Doğrudan menüye geç` bağlantısı `#menu` hedefi bulamıyor. G4.1 bunu kapatmaz.

## Sınırlar
**Sadece test/rapor/CI dosyaları**; `main`, `src/`, `public/`, canlı GitHub Pages, yayın kapısı, Cloudflare ve kullanıcı onaylı G1 görselleri kesinlikle değiştirilmez. Gerçek sipariş veya WhatsApp açılması yok. PR **draft**, merge yok.
