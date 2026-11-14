# G4.1.9 mobil test aracı

Kaynak proje dışında çalışır. Emülasyon aracı mevcut proje içindeki Playwright bağımlılığını kullanır; yeni paket kurmaz. `--project` ve `--url` verilerek başka web projelerinde de kullanılabilir.

```powershell
node run.mjs --project C:\site-projesi --url http://127.0.0.1:4321/
```

Gerçek Android Chrome kanıt aracı açık Chrome sekmesini arar; başka sekmeyi açmaz. Önce telefonda test URL'sini Chrome'da açın:

```powershell
node device-runner.mjs --url http://127.0.0.1:4321/ --out .\G419_Test_Kanitlari --name telefon.png
```

ADB executable yolu `--adb` ile değiştirilebilir. Araç ekran ölçülerini/viewport'u ve PNG ekran kanıtını toplar, geçici ADB port yönlendirmesini temizler. Test adımlarının beklenen sonuçlarını ve PASS/FAIL/BELİRSİZ kararlarını her proje için ayrıca tanımlayın.

`create-report.mjs` Taş Fırın'a özgü bu koşunun üç rapor dosyasını üretir.
