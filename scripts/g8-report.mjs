// Playwright G8 Türkçe HTML + JSON merkezi kabul raporu. Ek ücretli servis yok.
import {readdir,readFile,mkdir,writeFile,appendFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';

const directory=resolve('test-results/g8/observations');
const target=resolve('test-results/g8');
const escapeHtml=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const count=(arr,field,value)=>arr.filter(x=>x[field]===value).length;

async function readObservations(){
  let names=[];
  try{names=(await readdir(directory)).filter(x=>x.endsWith('.json'));}catch{}
  const all=[];
  for(const name of names){
    const data=JSON.parse(await readFile(join(directory,name),'utf8'));
    all.push(data);
  }
  // Playwright retry sırasında aynı senaryo için son koşumu esas al.
  const latest=new Map();
  for(const item of all){
    const key=item.proje+':'+item.senaryo;
    if(!latest.has(key)||item.tarih>latest.get(key).tarih)latest.set(key,item);
  }
  return [...latest.values()].sort((a,b)=>a.proje.localeCompare(b.proje,'tr')||a.senaryo.localeCompare(b.senaryo,'tr'));
}
async function getPlaywrightSummary(){
  try{
    const file=JSON.parse(await readFile(resolve('test-results/g8-results.json'),'utf8'));
    let passed=0,failed=0,skipped=0;
    function walk(suites){
      for(const suite of suites||[]){
        for(const spec of suite.specs||[]){
          for(const t of spec.tests||[]){
            if(t.status==='expected'||t.status==='passed')passed++;
            else if(t.status==='skipped')skipped++;
            else if(t.status==='unexpected'||t.status==='failed')failed++;
            else if(t.results?.at(-1)?.status==='passed')passed++;
            else if(t.results?.at(-1)?.status==='skipped')skipped++;
            else failed++;
          }
        }
        walk(suite.suites);
      }
    }
    walk(file.suites);
    return {passed,failed,skipped,sonuc:file.stats?.unexpected||0};
  }catch{return {passed:null,failed:null,skipped:null,sonuc:null};}
}
const cases=await readObservations();
const real=cases.filter(x=>!x.simulasyon);
const simulations=cases.filter(x=>x.simulasyon);
const findings=real.flatMap(c=>(c.bulgular||[]).map(f=>({...f,profil:c.proje,senaryo:c.senaryo})));
const tester=await getPlaywrightSummary();
const summary={
  surum:'G8-1',
  tarih:new Date().toISOString(),
  site:'Taş Fırın — izole yerel Astro demo',
  commit:process.env.GITHUB_SHA||'local',
  kontrol_edilen_gercek_senaryolar:real.length,
  sentetik_senaryolar:simulations.length,
  toplam_bulgu:findings.length,
  uygulama_kritik:findings.filter(x=>x.kaynak==='uygulama'&&x.oncelik==='kritik').length,
  uygulama_yuksek:findings.filter(x=>x.kaynak==='uygulama'&&x.oncelik==='yüksek').length,
  uygulama_orta:findings.filter(x=>x.kaynak==='uygulama'&&x.oncelik==='orta').length,
  harici_servis_uyarilari:findings.filter(x=>x.kaynak==='harici').length,
  belirsiz_kaynaklar:findings.filter(x=>x.kaynak==='belirsiz').length,
  playwright:tester,
  yayin_kapisi:'G8 bu dalda yayın kapısını etkinleştirmez; değerlendirme testleri ayrıdır.',
};
const output={ozet:summary,senaryolar:cases,gercek_bulgular:findings};
await mkdir(target,{recursive:true});
await writeFile(join(target,'G8_Turkce_Rapor.json'),JSON.stringify(output,null,2),'utf8');
const rows=findings.length?findings.map(f=>'<tr><td>'+escapeHtml(f.profil)+'</td><td>'+escapeHtml(f.senaryo)+'</td><td>'+escapeHtml(f.oncelik)+'</td><td>'+escapeHtml(f.kaynak)+'</td><td>'+escapeHtml(f.kind)+'</td><td>'+escapeHtml(f.adres)+'</td><td>'+escapeHtml(f.durum??'—')+'</td><td>'+escapeHtml(f.aciklama)+'</td><td>'+escapeHtml(f.cozum)+'</td></tr>').join('\n'):'<tr><td colspan="9">Gerçek site taramasında kaydedilmiş bulgu yok.</td></tr>';
const view='<html lang="tr"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>G8 — Türkçe Tanılama Raporu</title><style>body{font:15px/1.5 system-ui,Arial;background:#f5f7fa;color:#172538;margin:0;padding:25px}main{max-width:1250px;margin:auto}h1{margin:0 0 6px}p{color:#4a596a}.grid{display:flex;flex-wrap:wrap;gap:12px;margin:24px 0}.tile{background:white;min-width:130px;padding:16px 22px;border:1px solid #dce2e9;border-radius:12px}.tile strong{display:block;font-size:26px}.table-scroll{overflow:auto;background:white;border-radius:12px;border:1px solid #dce2e9}table{width:100%;border-collapse:collapse;min-width:980px}th,td{padding:12px;vertical-align:top;text-align:left;border-bottom:1px solid #e5e9ef;word-break:break-word}th{background:#e8eef5}small{color:#687587}code{word-break:break-all}</style></head><body><main><h1>G8 — Merkezi Hata Denetimi</h1><p>Taş Fırın / Playwright · '+escapeHtml(summary.tarih)+' · Commit: <code>'+escapeHtml(summary.commit)+'</code></p><div class="grid"><div class="tile">Gerçek senaryo<strong>'+real.length+'</strong></div><div class="tile">Kritik<strong>'+summary.uygulama_kritik+'</strong></div><div class="tile">Yüksek<strong>'+summary.uygulama_yuksek+'</strong></div><div class="tile">Orta<strong>'+summary.uygulama_orta+'</strong></div><div class="tile">Dış servis uyarısı<strong>'+summary.harici_servis_uyarilari+'</strong></div><div class="tile">Kaynağı belirsiz<strong>'+summary.belirsiz_kaynaklar+'</strong></div></div><h2>Gerçek site bulguları</h2><div class="table-scroll"><table><thead><tr><th>Profil</th><th>Sayfa</th><th>Öncelik</th><th>Kaynak</th><th>Tür</th><th>Adres</th><th>HTTP</th><th>Gerçekleşen hata</th><th>Önerilen çözüm</th></tr></thead><tbody>'+rows+'</tbody></table></div><p>Sentetik negatif testler ayrı kaydedilir, gerçek site hatalarına veya uyarı toplamlarına eklenmez.</p><small>Bu test yalnızca izole yerel önizlemede yapılır; gerçek müşterilere istek ve WhatsApp mesajı gönderilmez. Görsel test G1 ile ayrı doğrulanır. Yayın kapısı etkinleştirilmedi.</small></main></body></html>';
await writeFile(join(target,'G8_Turkce_Rapor.html'),view,'utf8');
const lines=[
'## G8 — Merkezi Hata Denetimi',
'- Gerçek tarama senaryosu: '+real.length,
'- Sentetik negatif test: '+simulations.length,
'- Uygulama kaynaklı kritik: '+summary.uygulama_kritik,
'- Uygulama kaynaklı yüksek: '+summary.uygulama_yuksek,
'- Uygulama kaynaklı orta: '+summary.uygulama_orta,
'- Dış servis uyarısı: '+summary.harici_servis_uyarilari,
'- Kaynağı belirsiz: '+summary.belirsiz_kaynaklar,
'- Playwright: '+JSON.stringify(tester),
'- Rapor: test-results/g8/G8_Turkce_Rapor.html ve .json',
];
console.log(lines.join('\n'));
if(process.env.GITHUB_STEP_SUMMARY){
  await appendFile(process.env.GITHUB_STEP_SUMMARY,lines.join('\n')+'\n','utf8');
}
