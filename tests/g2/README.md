# G2 — İşletmeci Paneli Kapsamlı Test Kabul Protokolü

**Taban:** G8'in `feature/playwright-g8-merkezi-hata-denetimi-20261114` dalı.
**Güvenlik:** Yalnız test altyapısı, `main` ve canlı GitHub Pages kaynaklarına müdahale yok. G1'in onaylı 35 PNG'si ve G8 merkezi kayıtları korunur.

## Test matrisi: 17 senaryo × 5 Chromium ekran profili = 85 koşum

1. Yeni ürün ekle; 20,49 TL, müşteri görünümü, yeni sekme ve yenileme
2. Boş ürün adı ve geçersiz fiyat; kayıt yapılmaması
3. Mevcut ürün fiyatı; açık müşteri sekmesi eşitleme, kalıcılık
4. Silme onayını reddet/kabul et; yenileme
5. Ürün gizle/göster; müşteri menüsü, kalıcılık
6. Porsiyon ve ekstra malzeme fiyatları; mükerrer adın reddi
7. Kategori ekle; Türkçe harf tekrarı reddi ve boş kategori silme
8. Ürün bağlı kategori silinemez; kategori değişimi kalıcı
9. Hazır fotoğraf seç; kaydedilmeden müşteriye yansımaz
10. Geçerli PNG dosyası yükle; tarayıcı WebP dönüşümü ve saklama
11. Uygunsuz MIME ve 2 MB üzeri görselin reddi
12. Kaydedilmemiş değişiklikler; onay reddi/kabulü ve ESC
13. JSON sürüm 3 yedeği; veri değişimi, geri yükleme ve yenileme
14. Bozuk JSON, eski sürüm ve yinelenen kimlik; veri bütünlüğü
15. Ürünleri kısmen sıfırla, tüm demoyu sıfırla; onay ve kategori koruma
16. İşletme WhatsApp numarası; geçersiz değer ve kayıt kalıcılığı
17. Ayrı tarayıcı oturumlarının demo verisini paylaşmaması

Dört mobil emülasyon (320/360/390/430 px) ve 1280 px masaüstü. Bunlar gerçek telefon veya gerçek müşteri hesabı kabulü değildir.

## G8-001 — AÇIK
Paneldeki **Doğrudan menüye geç** erişilebilirlik bağlantısının **#menu** hedefi yok. Bu orta öncelikli hata ilgili Taş Fırın site geliştirme konuşmasında düzeltilmeli. G2 test dalı uygulama kodunu değiştirmediği için bulgu kapatılmış sayılmaz.

## Komutlar

- `npx playwright test --config=playwright.g2.config.mjs`
- `node scripts/g2-report.mjs` (önce test sonucu JSON dosyası gerekir)

GitHub Actions `.github/workflows/g2-panel-tests.yml` yalnız G2 → G8 taslak PR için tetiklenir. Önceki 28 mobil, G1'in 35 görsel karşılaştırması, G8'in 10 birim + 11 tarayıcı koşumu ve G2'nin 85 testini yeniden çalıştırır.

## Kabul raporu
`test-results/g2/G2_Turkce_Kabul_Raporu.html` ve `.json`; her senaryonun profil bazında PASS/FAIL/SKIP sonuçları ve varsa hata açıklamaları. Artifact tüm G1/G8/G2 hata izlerini de barındırır.