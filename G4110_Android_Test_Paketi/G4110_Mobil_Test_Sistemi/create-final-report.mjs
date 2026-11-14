import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const root=join(import.meta.dirname,'..'),evidence=join(root,'G4110_Test_Kanitlari');
const read=async name=>JSON.parse(await readFile(join(evidence,name),'utf8'));
const [base,emulated,android,androidSafe]=await Promise.all([read('playwright-results.json'),read('playwright-mutation-results.json'),read('android-mutation-results.json'),read('android-results.json')]);
const counts=items=>({PASS:items.filter(x=>x.status==='PASS').length,FAIL:items.filter(x=>x.status==='FAIL').length,BELİRSİZ:items.filter(x=>x.status==='BELİRSİZ').length});
const responsive=base.flatMap(x=>x.tests.map(t=>({scenario:x.target,viewport:`${x.viewport.width}x${x.viewport.height}`,name:t.name,status:t.status,expected:t.expected,actual:t.actual})));
const baseScreens=base.flatMap(x=>[...Object.keys(x.measurements||{}).filter(k=>k==='before'||k==='bottom').map(k=>`panel-${x.viewport.width}x${x.viewport.height}-editor-${k==='before'?'top':'bottom'}.png`),...(x.target==='storefront'?[`storefront-${x.viewport.width}x${x.viewport.height}.png`]:[])]);
const screenshots=[...new Set([...baseScreens,...(android.evidence||[]).map(x=>x.split(/[\\/]/).pop()),'playwright-cancel-result.png','playwright-price-saved.png',...['320x560','320x720','390x844'].flatMap(v=>[`playwright-7-categories-${v}.png`,`playwright-8-categories-${v}.png`,`playwright-long-category-${v}.png`])])];
const data={title:'G4.1.10 Yerel Demo Mobil Test Raporu',date:new Date().toISOString(),project:'Local demo project path redacted',scope:'Yalnızca http://127.0.0.1:4321/pideci-lahmacuncu-demo/ yerel demo',device:'Gerçek Android USB telefonu (ADB seri kimliği redakte edildi)',physicalMetrics:android.deviceMetrics||androidSafe.deviceMetrics,responsive:{tests:responsive,counts:counts(responsive)},playwrightMutations:{tests:emulated.tests,counts:counts(emulated.tests),isolatedContext:emulated.changesWereIsolatedInEphemeralBrowserContext},androidMutations:{tests:android.tests,counts:counts(android.tests),status:android.status,initialState:android.initialState,finalState:android.finalState,dataChanges:android.dataChanges,cleanup:android.cleanup},executionNotes:['İlk fiziksel yazma denemesi 215216 değerini geçici olarak kaydetti; sonraki UI kaydıyla 215 yapıldı ve son doğrulama 215 gösterdi.','Ara denemelerde eklenen test kategorileri ve G4110 Android Ekstra silindi; son durum başlangıç değerleriyle eşleşti.'],priorPhysicalSafeChecks:androidSafe.checks||[],screenshots,dataChangesSummary:{productPrice:'215 → 216 Kaydet testi → 215; ilk hatalı 215216 ara değeri de 215 olarak düzeltildi.',extra:'G4110 Android Ekstra 1 TL eklendi ve silindi.',categories:'Sıcak Fırın Tatlıları, Kahvaltı Tabağı ve Fırından Çıkan Uzun İsimli Tatlılar eklendi ve silindi.',finalDemo:'Fiyat 215, iki başlangıç ekstrası ve dört temel kategori kaldı.'},unchanged:{siteSource:true,main:true,pr19:true,g1Pngs:true,liveSite:true,cloudflare:true,githubUpload:false,commit:false,push:false}};
await writeFile(join(root,'G4110_Android_Test_Sonuclari.json'),JSON.stringify(data,null,2),'utf8');
const table=items=>items.map(t=>`| ${t.viewport||'Android 384×737'} | ${t.name} | ${t.status} | ${t.actual||''} |`).join('\n');
const md=`# G4.1.10 Yerel Demo Mobil Test Raporu

## Kapsam

- Yerel demo: \`${data.scope}\`
- Fiziksel telefon: Gerçek Android USB telefonu (ADB seri kimliği redakte edildi); ekran ${android.deviceMetrics?.physicalPixels}, CSS viewport ${android.deviceMetrics?.viewport?.width}×${android.deviceMetrics?.viewport?.height}, DPR ${android.deviceMetrics?.viewport?.dpr}.
- Playwright ekranları: 320×560, 320×720 ve 390×844.
- Veri işlemleri Playwright'ta geçici tarayıcı bağlamında; Android'de yalnızca yerel demo Chrome origininde yapıldı.

## Sonuç özeti

| Grup | PASS | FAIL | BELİRSİZ |
|---|---:|---:|---:|
| Önceki responsive ölçümler | ${data.responsive.counts.PASS} | ${data.responsive.counts.FAIL} | ${data.responsive.counts.BELİRSİZ} |
| Playwright veri/UI işlemleri | ${data.playwrightMutations.counts.PASS} | ${data.playwrightMutations.counts.FAIL} | ${data.playwrightMutations.counts.BELİRSİZ} |
| Gerçek Android veri/UI işlemleri | ${data.androidMutations.counts.PASS} | ${data.androidMutations.counts.FAIL} | ${data.androidMutations.counts.BELİRSİZ} |

Emülasyondaki BELİRSİZ kayıtlar gerçek sistem klavyesi kontrolüdür; gerçek Android klavyesi ayrı testte açılıp kapandı.

## Playwright veri/UI işlemleri

| Kontrol | Sonuç | Beklenen | Gerçekleşen |
|---|---|---|---|
${data.playwrightMutations.tests.map(t=>`| ${t.name} | ${t.status} | ${t.expected} | ${t.actual} |`).join('\n')}

## Gerçek Android veri/UI işlemleri

| Kontrol | Sonuç | Beklenen | Gerçekleşen |
|---|---|---|---|
${data.androidMutations.tests.map(t=>`| ${t.name} | ${t.status} | ${t.expected||''} | ${t.actual||''} |`).join('\n')}

## Önceki responsive ölçümler

| Viewport | Kontrol | Sonuç | Gerçekleşen |
|---|---|---|---|
${table(responsive)}

## Demo verisindeki değişiklikler

- ${data.dataChangesSummary.productPrice}
- ${data.dataChangesSummary.extra}
- ${data.dataChangesSummary.categories}
- ${data.dataChangesSummary.finalDemo}

## Yürütme notları

${data.executionNotes.map(x=>`- ${x}`).join('\n')}

## Kapsam dışı değişiklikler

Site kaynakları, \`main\`, PR #19, onaylı G1 PNG’leri, canlı site ve Cloudflare değiştirilmedi. GitHub’a yükleme, commit veya push yapılmadı.

## Ekran kanıtları

${screenshots.map(f=>`- \`G4110_Test_Kanitlari/${f}\``).join('\n')}
`;
await writeFile(join(root,'G4110_Android_Test_Raporu.md'),md,'utf8');
const img=f=>`<figure><figcaption>${f}</figcaption><img loading="lazy" src="G4110_Test_Kanitlari/${f}" alt="${f}"></figure>`;
const html=`<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${data.title}</title><style>body{font:16px system-ui;max-width:1100px;margin:32px auto;padding:0 18px;color:#29231f}table{border-collapse:collapse;width:100%;margin:14px 0 28px}td,th{border:1px solid #ddd;padding:8px;text-align:left;vertical-align:top}img{max-width:320px;border:1px solid #ddd}figure{display:inline-block;vertical-align:top;margin:10px;width:330px}figcaption{overflow-wrap:anywhere}section{margin-top:28px}</style><h1>${data.title}</h1><p><b>Yerel demo:</b> ${data.scope}</p><p><b>Gerçek Android:</b> Gerçek Android USB telefonu (ADB seri kimliği redakte edildi), ${android.deviceMetrics?.physicalPixels} px, CSS ${android.deviceMetrics?.viewport?.width}×${android.deviceMetrics?.viewport?.height}, DPR ${android.deviceMetrics?.viewport?.dpr}</p><section><h2>Playwright veri/UI işlemleri</h2><p>PASS ${data.playwrightMutations.counts.PASS}; FAIL ${data.playwrightMutations.counts.FAIL}; BELİRSİZ ${data.playwrightMutations.counts.BELİRSİZ}</p><table><tr><th>Kontrol</th><th>Sonuç</th><th>Gerçekleşen</th></tr>${data.playwrightMutations.tests.map(t=>`<tr><td>${t.name}</td><td>${t.status}</td><td>${t.actual}</td></tr>`).join('')}</table></section><section><h2>Gerçek Android veri/UI işlemleri</h2><p>PASS ${data.androidMutations.counts.PASS}; FAIL ${data.androidMutations.counts.FAIL}; BELİRSİZ ${data.androidMutations.counts.BELİRSİZ}</p><table><tr><th>Kontrol</th><th>Sonuç</th><th>Gerçekleşen</th></tr>${data.androidMutations.tests.map(t=>`<tr><td>${t.name}</td><td>${t.status}</td><td>${t.actual||''}</td></tr>`).join('')}</table></section><section><h2>Responsive ölçümler</h2><table><tr><th>Viewport</th><th>Kontrol</th><th>Sonuç</th><th>Gerçekleşen</th></tr>${responsive.map(t=>`<tr><td>${t.viewport}</td><td>${t.name}</td><td>${t.status}</td><td>${t.actual}</td></tr>`).join('')}</table></section><section><h2>Veri değişiklikleri</h2><ul>${Object.values(data.dataChangesSummary).map(x=>`<li>${x}</li>`).join('')}</ul><h3>Yürütme notları</h3><ul>${data.executionNotes.map(x=>`<li>${x}</li>`).join('')}</ul><p>Site kaynağı, main, PR #19, G1 PNG’leri, canlı site ve Cloudflare değişmedi. GitHub’a yükleme yapılmadı.</p></section><section><h2>Ekran kanıtları</h2>${screenshots.map(img).join('')}</section></html>`;
await writeFile(join(root,'G4110_Android_Test_Raporu.html'),html,'utf8');
await writeFile(join(root,'G4110_Otomasyon_Degisiklik_Raporu.md'),`# G4.1.10 Otomasyon Değişiklik Raporu\n\nAyrı \`G4110_Mobil_Test_Sistemi/\` altında Playwright panel/storefront ve mutasyon runner’ları ile Android CDP/ADB runner’ı hazırlandı. Playwright emülasyonunda veri değişiklikleri geçici bağlamda tutuldu; Android yerel testinde fiyat, ekstra ve kategoriler eklendi ve test sonunda başlangıç değerlerine döndürüldü.\n\nTest verisi değiştirme işlemleri için kullanıcı bu turda açıkça izin verdi. Yedekleme/geri yükleme planı uygulanmadı. GitHub’a hiçbir şey yüklenmedi.`, 'utf8');
console.log(JSON.stringify({responsive:data.responsive.counts,playwright:data.playwrightMutations.counts,android:data.androidMutations.counts,files:3},null,2));
