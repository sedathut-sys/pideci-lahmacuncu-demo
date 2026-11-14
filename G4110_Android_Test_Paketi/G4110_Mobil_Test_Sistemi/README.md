# G4.1.10 Android test aracı

Site kodundan ayrı çalışır. Emülasyon Playwright'ı test edilecek projenin `node_modules` klasöründen yükler; yeni paket kurmaz. Fiziksel araç Android Chrome sekmesi zaten öndeyken çalışır, uygulama başlatmaz ve başka sekmeleri okumaz. ADB ekran görüntüleri cihazdan geçici dosyaya yazılır, `adb pull` ile alınır ve cihazdaki geçici dosya temizlenir.

## Playwright

```powershell
node run.mjs --project C:\site --url http://127.0.0.1:4321/ --panel-url http://127.0.0.1:4321/panel/ --device SERIAL --out C:\kanıt --scenario panel
```

Parametreler: `--project`, `--url`, `--panel-url`, `--device`, `--out`, `--scenario panel|storefront|all`, `--config`. Rapor/kanıt klasörü hedef proje dışındadır. `--device` emülatör sonuçlarına etiket olarak yazılır; Playwright fiziksel Android'i emüle ettiğini iddia etmez.

Yerel demo için ürün Kaydet/İptal, fiyat, ekstra ve kategori senaryoları:

```powershell
node mutation-runner.mjs --project C:\site --url http://127.0.0.1:4321/ --panel-url http://127.0.0.1:4321/panel/ --out C:\kanıt --config scenarios\tas-firin.json
```

Bu senaryo geçici Playwright bağlamı kullanır; tarayıcı bağlamı kapanınca test verileri tutulmaz.

## Gerçek Android

ADB reverse ve USB bağlantısı mevcut olmalıdır. Açık Chrome'daki tek Taş Fırın yerel test sekmesini izinli panel yoluna götürüp URL'yi doğrulamak için:

```powershell
node navigate-test-tab.mjs --adb C:\Android\Sdk\platform-tools\adb.exe --device SERIAL --url http://127.0.0.1:4321/pideci-lahmacuncu-demo/panel/ --scope-prefix /pideci-lahmacuncu-demo/
```

Gezinme aracı yalnız tek mevcut sekme varsa ve hedef mevcut sekmeyle aynı origin/`--scope-prefix` içindeyse ilerler; sekme açmaz, diğer uygulamalara dokunmaz. A/B projelerinde prefix ilgili proje yoluna ayarlanır.

Sonra:

```powershell
node device-runner.mjs --url http://127.0.0.1:4321/panel/ --panel-url http://127.0.0.1:4321/panel/ --device SERIAL --adb C:\Android\Sdk\platform-tools\adb.exe --out C:\kanıt --scenario panel --config scenarios\tas-firin.json
```

Salt okunur fiziksel kontroller için `device-runner.mjs`; izin verilmiş yerel demo mutasyonları için `android-mutation-runner.mjs` kullanılır:

```powershell
node android-mutation-runner.mjs --device SERIAL --adb C:\Android\Sdk\platform-tools\adb.exe --out C:\kanıt
```

Araç Chrome önde değilse veya izinli tam panel URL'si açık değilse durur. Fiziksel dokunma/kaydırma CDP ile yapılır; metin girişi Android klavyesi açıkken gerçekleşir. Yalnız yerel demo URL'si kullanılmalıdır.

## Taş Fırın senaryosu

`scenarios/tas-firin.json` ürün/kategori isimlerini ve UI seçicilerini içerir. Başka projede yeni yapılandırma verip aynı runner kullanılabilir.
