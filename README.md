# Taş Fırın — Pideci & Lahmacuncu GitHub Pages Demosu

Bu depo, **müşterilere bağlantıyla gösterilen herkese açık etkileşimli satış demosudur.** Taş Fırın örnek isimdir; gerçek işletme değildir.

- Ana site: `index.html`
- İşletmeci arayüzü demosu: `PANEL-DEMO.html`
- Otomatik yayın: `.github/workflows/pages.yml`
- Planlanan Pages adresi: https://sedathut-sys.github.io/pideci-lahmacuncu-demo/

## Güvenlik ve kapsam
- Gerçek sipariş gönderilmez ve gerçek WhatsApp hattına bağlanmaz.
- Yönetim paneli demo sürümdür; kalıcı sunucu veritabanı ve gerçek şifreli yönetici oturumu bulunmaz.
- D1/R2, sunucu API'si ve ticari müşteri ayarları **Private** ana projede kalır.
- Site **noindex** işaretlidir. Bu depo gerçek müşteri siparişlerini toplamak için kullanılmaz.

## Güncellemeler
`main` dalındaki her değişiklik GitHub Actions iş akışını tetikler. GitHub Pages → Source seçeneği **GitHub Actions** olmalıdır. Başarılı dağıtımdan sonra aynı demo URL'si güncellenir.

## Tam Astro kaynak projesi
Aşama 5.5 Astro/React kaynak paketi bu tek dosyalık demo dağıtımından ayrıdır. Astro üretim derlemesi, Wrangler ve D1/R2 yerel kabul testleri henüz tamamlanmamıştır. Bu demo yayını o testlerin geçtiği anlamına gelmez.
