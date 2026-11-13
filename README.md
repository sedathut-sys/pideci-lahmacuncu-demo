# Taş Fırın — Pideci & Lahmacuncu Pro (Demo)

GitHub Pages üzerinde müşterilere gösterilecek **etkileşimli demo site**. Gerçek işletme ve sipariş sistemi değildir.

**Demo adresi (Pages etkinleştirildikten sonra):** https://sedathut-sys.github.io/pideci-lahmacuncu-demo/

## Kaynak düzeni

- `src/`, `public/`: Astro + React ziyaretçi sitesi ve demo işletmeci paneli.
- `tests/`: Ürün, sepet ve demo yönetim testleri.
- `.github/workflows/astro-ci.yml`: GitHub Actions üzerinden `npm test`, `npm run quality`, `npm run build` ve çıktı doğrulama.
- `.github/workflows/pages.yml`: `main` dalına güncelleme gelince aynı testlerden sonra Astro `dist/` çıktısını GitHub Pages'e yayınlar.
- `index.html`, `PANEL-DEMO.html`: İlk aşamanın bağımsız HTML yedek demoları; Pages yayınında kaynak olarak kullanılmaz.

## Güvenlik ve kapsam

- Ziyaretçi üyeliği yok.
- Sipariş sepeti ve WhatsApp mesajı **demo** amaçlıdır; gerçek numaraya mesaj gönderimi kapalıdır.
- Yönetim paneli demo modunda çalışır; gerçek oturum ve kalıcı sunucu veritabanı aktif değildir.
- D1/R2 ve gerçek yönetim API kaynakları **Private** ana projede saklanır.
- Demo arama motorlarına `noindex` olarak sunulur.

## Yayınlama

1. Repository → Settings → Pages → Build and deployment → Source = **GitHub Actions** seçilir (ilk kurulumda bir kez).
2. `main` dalına yapılan güncellemelerden sonra `pages.yml` iş akışı çalışır.
3. Yeşil başarılı dağıtım sonrası aynı demo bağlantısından site incelenir.

## Durum

13 Kasım 2026: Public Astro/React kaynakları GitHub'a aktarıldı. PR #1 üzerinde 19/19 test, kalite kontrolleri, Astro build ve çıktı doğrulama başarıyla geçti. GitHub Pages'in ilk aktif yayını ayrı olarak doğrulanmalıdır. Cloudflare hosting bağlantısı yapılmadı.
