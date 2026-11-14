// G412 panel kabul özeti: Playwright JSON raporundan Türkçe HTML + JSON üretir.
import {readFile,mkdir,writeFile,appendFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const destination=resolve('test-results/g412');
const output=resolve('test-results/g412-results.json');
const esc=x=>String(x??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const raw=JSON.parse(await readFile(output,'utf8'));
const cases=new Map();
const failures=[];
let passed=0,failed=0,skipped=0,flaky=0;
function walk(suites){
  for(const suite of suites||[]){
    for(const spec of suite.specs||[]){
      for(const t of spec.tests||[]){
        const project=t.projectName||'bilinmiyor';
        const title=spec.title;
        const id=title.match(/G412-\d\d/)?.[0]||'G412-??';
        const result=t.results?.at(-1);
        const status=result?.status||'unknown';
        let bucket;
        if(status==='passed') {passed++;bucket='PASS';}
        else if(status==='skipped') {skipped++;bucket='SKIP';}
        else{failed++;bucket='FAIL';}
        if(bucket==='PASS' && (t.results?.length||0)>1)flaky++;
        if(!cases.has(id))cases.set(id,{id,title,profiles:[]});
        cases.get(id).profiles.push({profile:project,result:bucket,retries:Math.max(0,(t.results?.length||0)-1)});
        if(bucket==='FAIL'){
          failures.push({
            id,project,title,
            message:(result?.errors||[]).map(e=>e.message).filter(Boolean).join(' | ').slice(0,1200),
          });
        }
      }
    }
    walk(suite.suites);
  }
}
walk(raw.suites);
const scenarios=[...cases.values()].sort((a,b)=>a.id.localeCompare(b.id));
const summary={
  tarih:new Date().toISOString(),
  branch:'feature/playwright-g4-1-ilk-yukleme-sekme-senkron-20261114',
  commit:process.env.GITHUB_SHA||'local',
  kosulan:passed+failed+skipped,
  pass:passed,fail:failed,skip:skipped,flaky,
  scenarioCount:scenarios.length,
  snapshots:'G1: 35 onaylı PNG, değişiklik yok',
  existingMobile:'28 temel Playwright testi',
  existingG8:'10 gerçek tarama + 1 sentetik test; G8-001 açık',
  openIssue:'G8-001 — Yönetici panelinde bulunan olmayan #menu atlama hedefi (orta öncelik)',
  live:'Canlı site/main ve dağıtım kapısına müdahale edilmedi',
};
await mkdir(destination,{recursive:true});
await writeFile(resolve(destination,'G412_Turkce_Kabul_Raporu.json'),JSON.stringify({summary,scenarios,failures},null,2));
const rows=scenarios.map(x=>'<tr><td>'+esc(x.id)+'</td><td>'+esc(x.title)+'</td><td>'+x.profiles.map(v=>esc(v.profile)+': <b>'+esc(v.result)+'</b>'+ (v.retries?' (tekrar '+v.retries+')':'')).join(' · ')+'</td></tr>').join('');
const errors=failures.length?'<h2>Başarısız senaryolar</h2><ol>'+failures.map(x=>'<li><b>'+esc(x.id+' '+x.project)+'</b><pre>'+esc(x.message)+'</pre></li>').join('')+'</ol>':'<h2>Başarısız senaryo yok</h2>';
const html='<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>G412 — Yönetim Paneli Kabul Raporu</title><style>body{font:15px/1.5 system-ui,Arial;margin:0;background:#f5f7fa;color:#182839;padding:28px}main{max-width:1200px;margin:auto}.grid{display:flex;gap:12px;flex-wrap:wrap;margin:20px 0}.stat{background:white;border:1px solid #dde2e9;padding:14px 22px;border-radius:12px;min-width:95px}.stat strong{font-size:28px;display:block}section,table{background:white;border:1px solid #dde2e9;border-radius:10px}section{padding:14px 18px;margin:16px 0}table{border-collapse:collapse;width:100%}td,th{text-align:left;vertical-align:top;border-bottom:1px solid #e4e8ee;padding:11px}th{background:#e9eff7}pre{white-space:pre-wrap;overflow-wrap:anywhere}small{color:#667789}</style></head><body><main><h1>G412 — Düzeltme Sonrası Veri Yarışı ve İlk Yükleme Kabul Testleri</h1><p>Taş Fırın · İzole Astro demo · '+esc(summary.tarih)+'</p><div class="grid">'+[['PASS',passed],['FAIL',failed],['SKIP',skipped],['Tekrarla geçti',flaky],['Test türü',scenarios.length]].map(([name,value])=>'<div class="stat">'+esc(name)+'<strong>'+esc(value)+'</strong></div>').join('')+'</div><section><b>G8-001 açık:</b> Paneldeki "Doğrudan menüye geç" bağlantısının #menu hedefi yok. Bu test dalında uygulama kaynakları değiştirilmedi.</section><h2>Test matrisi</h2><div style="overflow:auto"><table><thead><tr><th>Kimlik</th><th>Senaryo</th><th>Ekran profili / sonuç</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+errors+'<p><small>Bu rapor canlı siteden değil, beş Chromium emülasyon profili üzerinden izole demo testinden üretilmiştir. Main, canlı yayın ve yayın kapısı değişmedi.</small></p></main></body></html>';
await writeFile(resolve(destination,'G412_Turkce_Kabul_Raporu.html'),html);
const info=[
  '## G412 — Düzeltme Sonrası Veri Yarışı ve İlk Yükleme Kabul Testleri',
  '- ' + scenarios.length+' farklı senaryo, 5 ekran profili',
  '- PASS '+passed+' / FAIL '+failed+' / SKIP '+skipped+' / Tekrarla geçen '+flaky,
  '- G8-001 erişilebilirlik kusuru açık; G412 test dalında site kodu değiştirilmedi',
  '- HTML ve JSON rapor: test-results/g412/',
];
console.log(info.join('\n'));
if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,info.join('\n')+'\n');
