# G3 — Sepet ve Sipariş Playwright Kabul Planı

## Sürüm ayrımı

- **main:** Aşama 5.10.9, `c6922069e759936eed5bb1252774c1ce1f18b585`.
- **G2 tabanı:** Ana uygulama Aşama 5.10.8; G1 ve G8 izole test dallarıyla korunmuş.
- **main 5.10.9 farkı:** `src/components/AdminPanel.tsx`, `PriceInput.tsx`, `src/lib/price-rules.mjs`, `src/styles/global.css` ile 5.10.9 mobil panel test dosyaları. G1 görsel referansları 5.10.8 için kullanıcı tarafından onaylanmıştır.
- **Karar:** main ile G2/G3 dalı birleştirilmedi; 35 PNG'nin baytı değiştirilmedi. G3 işlevleri önce G2 üzerinde doğrulanır. Güncel main uyarlaması daha sonra ayrı uyumluluk/taşıma dalında, yeni referanslar kullanıcının açık onayı alınmadan güncellenmeksizin yapılmalıdır.

## G3 tarayıcı test kapsamı — 18 senaryo × 5 profil = 90 test

01. Boş sepet, sipariş butonu devre dışı
02. Varsayılan 215 TL pide, gel-al ve sipariş mesajı
03. 1,5 porsiyon + iki ekstra × iki adet = 740 TL
04. Ücretsiz ekstra fiyatı değiştirmez
05. Aynı yapılandırmayı tek satırda birleştirme
06. Farklı porsiyonların ayrı satırları
07. Sepet adet artırma/azaltma ve ürünü kaldırma
08. Eksik ad, kısa adres engeli, paket servis
09. Gel-al, ad ve sipariş notu, adrese gerek yok
10. Çoklu ürün ara toplamı ve mesaj
11. Minimum sipariş sınırı; dışarıdan ayar değişikliği
12. Sipariş alımı kapanınca buton devre dışı
13. Paket servis kapanınca yalnız gel-al
14. Panel fiyat değişikliğiyle sepet uyarısı ve yeniden fiyatlandırma
15. Gizlenen ürün sepetten çıkarılır
16. Porsiyon/ekstra malzeme fiyatı değişimi
17. Seçenek penceresinden vazgeç, sepete ürün girmez
18. Demo mesajı WhatsApp açmadan görüntülenir

Ek olarak sipariş matematiği ve güvenlik doğrulaması için 11 bağımsız Node birim testi.

## Korunan önceki kabul güvenceleri

- G1 onaylı 35 PNG SHA-256 korunur, görsel karşılaştırma 35 koşum.
- G2 onaylı panel fonksiyonları 85 koşum.
- G8 10 sınıflandırma birim testi + 11 gerçek/sentetik tarayıcı kabulü.
- Önceki 28 mobil test (G2 tabanındaki Aşama 5.10.8).
- Güncel main'de ayrıca Aşama 5.10.9 kapsamında 40 mobil koşum bulunur; G3 tabanına otomatik eklenmez.

## Açık kusur: G8-001

Yönetici panelinde 'Doğrudan menüye geç' bağlantısının `#menu` hedefi bulunmuyor. Açık, orta öncelikli erişilebilirlik kaydıdır; G3 test kodu bu kusuru kapatmaz.

## İzolasyon ve çalıştırma

- Chromium profilleri: 320, 360, 390, 430 px ve 1280 px. Bunlar gerçek telefon testi değildir.
- `PUBLIC_DATA_MODE=demo` ve `PUBLIC_SITE_READY=false`; gerçek WhatsApp, ödeme, sipariş veya müşteri hesabı işlemi yok.
- `npx playwright test --config=playwright.g3.config.mjs`
- `node --test tests/g3/order-core.test.mjs`
- GitHub Actions: `.github/workflows/g3-checkout.yml`; yalnız G3 → G2 taslak PR'ında, `contents: read` yetkisiyle.
- Raporlar: `test-results/g3/G3_Turkce_Kabul_Raporu.{html,json}` ve Playwright hata izleri.

**PR otomatik birleştirilmez. `main`, canlı site, GitHub Pages ve yayın kapısı değiştirilmez.**