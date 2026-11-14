# G4 — Mobil Menü, Kategori, Arama ve Gezinme Playwright Kabulü

## Dal ve sürüm ayrımı
- **G4 test dalı:** `feature/playwright-g4-mobil-menu-arama-gezinme-20261114`, G3 taslak test dalından ayrıldı.
- **Güncel main:** `c6922069e759936eed5bb1252774c1ce1f18b585` — Aşama 5.10.9.
- **G1/G2/G3 tabanı:** 5.10.8 kaynak kodu + onaylı test dalı. Main 5.10.9 değişiklikleri: `src/components/AdminPanel.tsx`, `PriceInput.tsx`, `src/lib/price-rules.mjs`, `src/styles/global.css` ve 2 ek 5.10.9 test dosyası.
- **Güvenli uyum kararı:** Main ile G4 **merge edilmedi**. G1'in 35 onaylı görseli yalnız kullanıcı onayıyla değişebilir. 5.10.9 için ayrı bir uyum incelemesi gerekiyor. Güncel main'deki 40 mobil test ile G4 tabanındaki 28 mobil testi aynı sürümün sonucu gibi gösterme.

## G4 — 22 senaryo × 5 Chromium profil = 110 tarayıcı kabul testi

01. Açılış: 8 ürün, 5 kategori, Tümü seçimi
02. Pide: 3 kart ve doğru kategori
03. Lahmacun: 1 kart
04. Yan Ürün: 2 kart
05. İçecek: 2 kart
06. Tümü: kategori değişiklikleri sonrası geri dönüş
07. Büyük/küçük harf duyarsız ürün adı araması
08. Açıklama ve Türkçe harflerle ürün araması
09. Olumsuz: bulunmayan arama, sıfır sonuç uyarısı
10. Olumsuz: regex ve HTML benzeri girdinin düz metin olarak işlenmesi
11. Arama temizleme ve seçili kategori korunması
12. Kategori ile aramanın kesişimi
13. Mobil menü aç/kapat, masaüstü sabit navigasyon
14. Mobil/masaüstü Menümüz bağlantısı ile #menu hedefi
15. Dört sayfa içi menü bağlantısının kimlik doğrulaması
16. Mobil Escape ile menüyü kapatma
17. Klavyeden Enter ile kategori seçimi, arama
18. Klavye ile doğrudan menüye geçme bağlantısı
19. Sayfa içi hash adresleri, tarayıcı geri ve ileri
20. Footer üzerinden işletmeci paneline gidip tarayıcı geri dönme
21. Açık müşteri sekmesinde panelden yeni kategori ve ürünün eşitlenmesi
22. Panelde gizlenen/gösterilen ürünün müşteri arama ve kategori filtresine yansıması

Profiller: 320, 360, 390, 430 px mobil ve 1280 px masaüstü — **tarayıcı emülasyonu**, gerçek iPhone/Android değil.

## Değişmez test kabulleri
- G1 35/35 görsel karşılaştırma ve değişmeyen onay SHA-256
- 28/28 önceki mobil işlev testi
- G8 hata sınıflandırması + tarayıcı tanılama
- G2 85/85 panel testi
- G3 90/90 sepet testi ve 11 sipariş birim testi

**G8-001 (AÇIK):** Yönetici panelinde “Doğrudan menüye geç” bağlantısının `#menu` hedefi bulunmuyor. G4 müşteri sayfasındaki mevcut hedefi doğrular; yönetim panelindeki açığı gizlemez veya kapatmaz. Çözüm için ana site geliştirme süreci gerekli.

## Emniyet
Yalnız test/CI/rapor dosyaları eklenir; `src/`, `public/`, `main`, canlı yayın, gerçek müşteri verileri, WhatsApp ve yayın kapısı **değiştirilmez**. PR G4 → G3 taslak kalır. CI yalnız `contents: read` yetkisiyle çalışır.

## Rapor
- `npx playwright test --config=playwright.g4.config.mjs`
- `node scripts/g4-report.mjs` (önce test JSON dosyası gerekiyor)
- `test-results/g4/G4_Turkce_Kabul_Raporu.html` ve `.json`
- Kanıt: `.github/workflows/g4-navigation.yml` ile GitHub Actions artifact.
