# G8 — Konsol, ağ, görsel ve bağlantı tanılama

**Temel dal:** G1'in onaylı 35 görsel referansını içeren \`feature/playwright-g1-gorsel-regresyon-20261114\`.

**Güvenlik:** Yalnız test dosyaları ve yeni bir GitHub Actions işi. \`main\`, GitHub Pages yayını ve mevcut dağıtım kapısı değişmez. İzole Astro önizlemesi ve sahte test verisi kullanılır, gerçek müşteri kaydı/WhatsApp mesajı gönderilmez.

## Denetim kapsamı
- **JS:** \`pageerror\` ile yakalanamayan istisnalar
- **Konsol:** \`console.error\` ve kaynağı
- **HTTP:** 4xx/5xx yanıtlar ve özgün istek adresi (sorgu parametresi gizlenir)
- **Ağ:** \`requestfailed\` ve iptal/hata ayrımı
- **Resimler:** \`decode()\`, \`naturalWidth\`, görünür tembel yüklenmiş görseller
- **Bağlantılar:** sadece aynı kökenli GET bağlantıları ve sayfa içi çapa hedefleri; harici bağlantılar ziyaret edilmez
- **Boş sayfa:** sayfa gövdesi ve zorunlu ürün kartları

**Sınıflandırma:** uygulama kaynaklı kritik/yüksek hatalar Playwright testini başarısız yapar. Uygulama kaynaklı orta önem bulgular raporlanır. Dış servis kesintileri ayrı *uyarı* olarak belirtilir; uygulama hatası olarak sayılmaz. Kaynağı belirsiz mesajlar da gizlenmez.

**Sentetik kontrol:** Tek 390 px tarayıcıda kasıtlı JS istisnası, konsol hatası, 404, kırık görsel, harici ağ başarısızlığı ve boş sayfa oluşturularak algılayıcı denetlenir. Simülasyonlar gerçek site bulgularına eklenmez.

## Rapor
\`test-results/g8/G8_Turkce_Rapor.html\` (tek sayfa Türkçe HTML),
\`test-results/g8/G8_Turkce_Rapor.json\` (makine tarafından okunabilir),
\`test-results/g8/observations/*.json\` (her gerçek senaryo için hata listesi).
Her bulguda profil, sayfa, kaynak, öncelik, adres, HTTP kodu, açıklama ve çözüm önerisi vardır. Sorgu parametreleri rapora alınmaz.

## GitHub Actions
\`.github/workflows/g8-diagnostics.yml\`, yalnız **G8 → G1** taslak PR'ında çalışır. Önceki mobil 28 koşumu, G1'in 35 görsel karşılaştırması, G8'in birim testleri ve gerçek tarayıcı denetimini aynı işte çalıştırır. Her durumda rapor artifact'lerini yükler.

Açık kaynakların URL ve erişim kontrolü yalnızca izole yerel önizleme içinde yapılır. Gerçek iPhone veya Android cihaz testi yapıldığı iddia edilmez.
