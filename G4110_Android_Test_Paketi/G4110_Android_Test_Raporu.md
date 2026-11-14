# G4.1.10 Yerel Demo Mobil Test Raporu

> Paylaşım kopyasında Android durum çubuğundaki bildirim simgesi alanı maskelenmiştir; yerel orijinal ekran görüntüleri korunmuştur.

## Kapsam

- Yerel demo: `Yalnızca http://127.0.0.1:4321/pideci-lahmacuncu-demo/ yerel demo`
- Fiziksel telefon: Android USB cihazı (seri kimliği redakte edildi); ekran 1080x2396, CSS viewport 384×737, DPR 2.8125.
- Playwright ekranları: 320×560, 320×720 ve 390×844.
- Veri işlemleri Playwright'ta geçici tarayıcı bağlamında; Android'de yalnızca yerel demo Chrome origininde yapıldı.

## Sonuç özeti

| Grup | PASS | FAIL | BELİRSİZ |
|---|---:|---:|---:|
| Önceki responsive ölçümler | 15 | 0 | 3 |
| Playwright veri/UI işlemleri | 20 | 0 | 0 |
| Gerçek Android veri/UI işlemleri | 10 | 0 | 0 |

Emülasyondaki BELİRSİZ kayıtlar gerçek sistem klavyesi kontrolüdür; gerçek Android klavyesi ayrı testte açılıp kapandı.

## Playwright veri/UI işlemleri

| Kontrol | Sonuç | Beklenen | Gerçekleşen |
|---|---|---|---|
| Yerel demo kapsamı | PASS | Panel yerel demo modunda | İşletmeci paneli / Yerel Demo |
| Ürün düzenle ve İptal | PASS | Düzenleme kaydedilmemeli | Pide
Kıymalı Pide
₺215

İncecik hamur, bol baharatlı kıyma ve taş fırın lezzeti.

● Görünür
Düzenle
Sil |
| Ürün fiyatı Kaydet ve kalıcılık | PASS | Fiyat 216 kaydedilmeli | Kart: ₺216; storage varyant fiyatı 216 |
| Ürün fiyatını test sonrası geri alma | PASS | Fiyat 215 olmalı | Kaydedilen fiyat 215 |
| Porsiyon/ekstra bölümlerine kaydırma | PASS | Form altına erişilmeli | {"top":1162,"height":1669,"client":507} |
| Ekstra ekleme ve Kaydet | PASS | Yeni ekstra 1 TL ile saklanmalı | [{"label":"Ekstra kaşar","price":35},{"label":"Yumurta","price":25},{"label":"G4110 Geçici Ekstra","price":1}] |
| Ekstra test değerini kaldırma | PASS | Geçici ekstra kalmamalı | [{"label":"Ekstra kaşar","price":35},{"label":"Yumurta","price":25}] |
| Müşteri sitesi 7 kategori 320×560 | PASS | 7 kategori düğmesi 320px yatay taşmasız olmalı | {"count":7,"rows":3,"width":320} |
| Müşteri sitesi 7 kategori 320×720 | PASS | 7 kategori düğmesi 320px yatay taşmasız olmalı | {"count":7,"rows":3,"width":320} |
| Müşteri sitesi 7 kategori 390×844 | PASS | 7 kategori düğmesi 390px yatay taşmasız olmalı | {"count":7,"rows":3,"width":390} |
| Yeni kategoriyi seçme/ürün filtresi | PASS | Seçilen kategori etkin olmalı | aria-pressed=true; kart=0 |
| Müşteri sitesi 8 kategori 320×560 | PASS | 8 kategori düğmesi 320px yatay taşmasız olmalı | {"count":8,"width":320,"rows":3} |
| Müşteri sitesi 8 kategori 320×720 | PASS | 8 kategori düğmesi 320px yatay taşmasız olmalı | {"count":8,"width":320,"rows":3} |
| Müşteri sitesi 8 kategori 390×844 | PASS | 8 kategori düğmesi 390px yatay taşmasız olmalı | {"count":8,"width":390,"rows":3} |
| Uzun kategori 320×560 | PASS | Uzun ad viewport dışına taşmamalı | {"text":"Fırından Çıkan Uzun İsimli Tatlılar","width":91.34375,"right":305,"scrollWidth":89,"clientWidth":89,"scrollHeight":62,"whiteSpace":"normal","overflow":320} |
| Uzun kategori 320×720 | PASS | Uzun ad viewport dışına taşmamalı | {"text":"Fırından Çıkan Uzun İsimli Tatlılar","width":91.34375,"right":305,"scrollWidth":89,"clientWidth":89,"scrollHeight":61,"whiteSpace":"normal","overflow":320} |
| Uzun kategori 390×844 | PASS | Uzun ad viewport dışına taşmamalı | {"text":"Fırından Çıkan Uzun İsimli Tatlılar","width":114.65625,"right":374.984375,"scrollWidth":113,"clientWidth":113,"scrollHeight":48,"whiteSpace":"normal","overflow":390} |
| Uzun kategori filtre seçimi | PASS | Kategori seçilebilmeli | aria-pressed=true |
| Test kategorilerini silme | PASS | Geçici kategoriler listeden kaldırılmalı | ["Pide","Lahmacun","Yan Ürün","İçecek"] |
| Test sonrası yerel demo verisi | PASS | Fiyat 215 ve 4 temel kategori kalmalı | {"finalPrice":215,"finalSettings":["Pide","Lahmacun","Yan Ürün","İçecek"]} |

## Gerçek Android veri/UI işlemleri

| Kontrol | Sonuç | Beklenen | Gerçekleşen |
|---|---|---|---|
| Gerçek telefonda ürün düzenlemede İptal | PASS | Kıymalı Pide | Kıymalı Pide |
| Gerçek telefonda fiyat alanına yazma | PASS | 216 | 216 |
| Gerçek telefonda fiyat Kaydet | PASS | Fiyat 216 saklanmalı | saved=true; price=216 |
| Fiyatı başlangıç değerine döndürme | PASS | 215 | 215 |
| Gerçek telefonda ekstra ekleme ve Kaydet | PASS | G4110 Android Ekstra · 1 TL | [{"label":"Ekstra kaşar","price":35},{"label":"Yumurta","price":25},{"label":"G4110 Android Ekstra","price":1}] |
| Geçici ekstrayı silme | PASS | Test ekstrası kalmamalı | [{"label":"Ekstra kaşar","price":35},{"label":"Yumurta","price":25}] |
| Gerçek Android müşteri görünümü 7 kategori | PASS | 7 kategori düğmesi yatay taşmasız | {"count":7,"rows":3,"width":384,"viewport":384,"labels":["Tümü","Pide","Lahmacun","Yan Ürün","İçecek","Sıcak Fırın Tatlıları","Kahvaltı Tabağı"]} |
| Gerçek Android 8 kategori ve uzun ad | PASS | 8 kategori, uzun ad taşmasız | {"count":8,"rows":3,"width":384,"viewport":384,"long":{"text":"Fırından Çıkan Uzun İsimli Tatlılar","right":369,"height":50.222225189208984,"scrollHeight":49,"clientHeight":49,"whiteSpace":"normal"}} |
| Gerçek Android kategori filtresi | PASS | Dokunulan kategori seçilmeli | aria-pressed=true |
| Test sonrası demo değerleri | PASS | Fiyat/ekstralar başlangıçta, geçici kategoriler silinmiş olmalı | {"price":215,"extras":[{"label":"Ekstra kaşar","price":35},{"label":"Yumurta","price":25}],"categories":["Pide","Lahmacun","Yan Ürün","İçecek"]} |

## Önceki responsive ölçümler

| Viewport | Kontrol | Sonuç | Gerçekleşen |
|---|---|---|---|
| 320x560 | Panel ürün listesi | PASS | ürün kartı bulundu |
| 320x560 | Düzenleyici ve seçenek bölümleri | PASS | 15 alan, 2 seçenek bölümü |
| 320x560 | Kaydet/İptal ilk görünürlük | PASS | ikisi de ilk görünümde |
| 320x560 | Form sonuna kaydırma | PASS | scrollTop 1322, scrollHeight 1669, clientHeight 347 |
| 320x560 | Alt düğmeler çakışması | PASS | 2 düğme, çakışma yok |
| 320x560 | Gerçek sistem klavyesi | BELİRSİZ | Playwright emülasyonu fiziksel Android klavyesini doğrulamaz |
| 320x720 | Panel ürün listesi | PASS | ürün kartı bulundu |
| 320x720 | Düzenleyici ve seçenek bölümleri | PASS | 15 alan, 2 seçenek bölümü |
| 320x720 | Kaydet/İptal ilk görünürlük | PASS | ikisi de ilk görünümde |
| 320x720 | Form sonuna kaydırma | PASS | scrollTop 1162, scrollHeight 1669, clientHeight 507 |
| 320x720 | Alt düğmeler çakışması | PASS | 2 düğme, çakışma yok |
| 320x720 | Gerçek sistem klavyesi | BELİRSİZ | Playwright emülasyonu fiziksel Android klavyesini doğrulamaz |
| 390x844 | Panel ürün listesi | PASS | ürün kartı bulundu |
| 390x844 | Düzenleyici ve seçenek bölümleri | PASS | 15 alan, 2 seçenek bölümü |
| 390x844 | Kaydet/İptal ilk görünürlük | PASS | ikisi de ilk görünümde |
| 390x844 | Form sonuna kaydırma | PASS | scrollTop 945, scrollHeight 1586, clientHeight 641 |
| 390x844 | Alt düğmeler çakışması | PASS | 2 düğme, çakışma yok |
| 390x844 | Gerçek sistem klavyesi | BELİRSİZ | Playwright emülasyonu fiziksel Android klavyesini doğrulamaz |

## Demo verisindeki değişiklikler

- 215 → 216 Kaydet testi → 215; ilk hatalı 215216 ara değeri de 215 olarak düzeltildi.
- G4110 Android Ekstra 1 TL eklendi ve silindi.
- Sıcak Fırın Tatlıları, Kahvaltı Tabağı ve Fırından Çıkan Uzun İsimli Tatlılar eklendi ve silindi.
- Fiyat 215, iki başlangıç ekstrası ve dört temel kategori kaldı.

## Yürütme notları

- İlk fiziksel yazma denemesi 215216 değerini geçici olarak kaydetti; sonraki UI kaydıyla 215 yapıldı ve son doğrulama 215 gösterdi.
- Ara denemelerde eklenen test kategorileri ve G4110 Android Ekstra silindi; son durum başlangıç değerleriyle eşleşti.

## Kapsam dışı değişiklikler

Site kaynakları, `main`, PR #19, onaylı G1 PNG’leri, canlı site ve Cloudflare değiştirilmedi. GitHub’a yükleme, commit veya push yapılmadı.

## Ekran kanıtları

- `G4110_Test_Kanitlari/panel-320x560-editor-top.png`
- `G4110_Test_Kanitlari/panel-320x560-editor-bottom.png`
- `G4110_Test_Kanitlari/panel-320x720-editor-top.png`
- `G4110_Test_Kanitlari/panel-320x720-editor-bottom.png`
- `G4110_Test_Kanitlari/panel-390x844-editor-top.png`
- `G4110_Test_Kanitlari/panel-390x844-editor-bottom.png`
- `G4110_Test_Kanitlari/g4110-android-mutation-start.png`
- `G4110_Test_Kanitlari/g4110-android-cancel-draft.png`
- `G4110_Test_Kanitlari/g4110-android-cancel-verified.png`
- `G4110_Test_Kanitlari/g4110-android-keyboard-3.png`
- `G4110_Test_Kanitlari/g4110-android-price-draft.png`
- `G4110_Test_Kanitlari/g4110-android-price-saved.png`
- `G4110_Test_Kanitlari/g4110-android-keyboard-6.png`
- `G4110_Test_Kanitlari/g4110-android-price-reverted.png`
- `G4110_Test_Kanitlari/g4110-android-extra-draft.png`
- `G4110_Test_Kanitlari/g4110-android-extra-saved.png`
- `G4110_Test_Kanitlari/g4110-android-extra-removed.png`
- `G4110_Test_Kanitlari/g4110-android-keyboard-11.png`
- `G4110_Test_Kanitlari/g4110-android-keyboard-12.png`
- `G4110_Test_Kanitlari/g4110-android-categories-7.png`
- `G4110_Test_Kanitlari/g4110-android-keyboard-14.png`
- `G4110_Test_Kanitlari/g4110-android-categories-8-long.png`
- `G4110_Test_Kanitlari/g4110-android-after-cleanup.png`
- `G4110_Test_Kanitlari/playwright-cancel-result.png`
- `G4110_Test_Kanitlari/playwright-price-saved.png`
- `G4110_Test_Kanitlari/playwright-7-categories-320x560.png`
- `G4110_Test_Kanitlari/playwright-8-categories-320x560.png`
- `G4110_Test_Kanitlari/playwright-long-category-320x560.png`
- `G4110_Test_Kanitlari/playwright-7-categories-320x720.png`
- `G4110_Test_Kanitlari/playwright-8-categories-320x720.png`
- `G4110_Test_Kanitlari/playwright-long-category-320x720.png`
- `G4110_Test_Kanitlari/playwright-7-categories-390x844.png`
- `G4110_Test_Kanitlari/playwright-8-categories-390x844.png`
- `G4110_Test_Kanitlari/playwright-long-category-390x844.png`
