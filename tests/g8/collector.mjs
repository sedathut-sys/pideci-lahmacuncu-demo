// G8 merkezi tanılama çekirdeği: yalnızca izole Playwright testleri kullanır.
import {mkdir, writeFile} from 'node:fs/promises';
import {resolve, join} from 'node:path';

export const BASE_URL='http://127.0.0.1:4321/pideci-lahmacuncu-demo/';
const root=new URL(BASE_URL);
const guidance={
  javascript:'Hata yığınını inceleyin; ilgili sayfada tekrar oluşturup uygulama kodunu düzeltin.',
  console:'Konsol mesajının kaynağını araştırın; sayfadan mı dış servisten mi geldiğini doğrulayın.',
  http:'İstek adresini ve sunucu yanıtını doğrulayın; kırık iç bağlantı veya eksik dosyayı düzeltin.',
  network:'Ağ isteğinin adresini ve kesilme nedenini inceleyin; tekrar deneyerek servis sürekliliğini doğrulayın.',
  image:'Görsel yolunu, dosyanın varlığını ve tarayıcıda yüklenmesini doğrulayın.',
  link:'Bağlantı hedefi/çapa kimliğini düzeltin; yönlendirme ve 404 sonucunu test edin.',
  empty:'Sayfa gövdesini, veri yüklemesini ve React/Astro başlangıç hatalarını kontrol edin.',
  test:'Playwright adımlarını ve uygulama davranışını birlikte inceleyin.',
};
export const maskUrl=(value)=>{
  if(!value) return '';
  try{
    const u=new URL(String(value),BASE_URL);
    if(!['http:','https:'].includes(u.protocol)) return u.protocol.replace(':','')+':';
    return u.origin+u.pathname; // sorgu, token ve fragment rapora alınmaz
  }catch{return String(value).slice(0,180).replace(/[?#].*$/,'');}
};
export function isInternal(value){
  if(!value) return false;
  try{
    const u=new URL(value,BASE_URL);
    return u.origin===root.origin && u.pathname.startsWith(root.pathname);
  }catch{return false;}
}
export function classify(raw){
  const kind=raw.kind || 'test';
  const internal=isInternal(raw.url || '');
  let source=internal?'uygulama':'harici';
  let level='uyarı';
  if(kind==='javascript'||kind==='empty'){
    source='uygulama';level='kritik';
  }else if(kind==='image'){
    source='uygulama';level='yüksek';
  }else if(kind==='link'){
    source='uygulama';level=raw.status>=400?'yüksek':'orta';
  }else if(kind==='test'){
    source='uygulama';level='yüksek';
  }else if(kind==='http'){
    level=internal?(raw.status>=500?'kritik':'yüksek'):'uyarı';
  }else if(kind==='network'){
    if(/ERR_ABORTED|NS_BINDING_ABORTED/i.test(raw.message||'')){
      source=internal?'uygulama':'harici';level='bilgi';
    }else level=internal?'yüksek':'uyarı';
  }else if(kind==='console'){
    if(!raw.url){
      source='belirsiz';level='orta'; // kaynağı belli olmayan mesaj gizlenmez
    }else level=internal?'yüksek':'uyarı';
  }
  return {
    kind,
    kaynak:source,
    oncelik:level,
    adres:maskUrl(raw.url),
    durum:raw.status||null,
    aciklama:String(raw.message||'').replace(/https?:\/\/\S+/g,match=>maskUrl(match)).slice(0,400),
    cozum:guidance[kind]||guidance.test,
  };
}
export const isBlocking=issue=>issue.kaynak==='uygulama' && ['kritik','yüksek'].includes(issue.oncelik);

export class G8Monitor {
  constructor(page,{scenario,simulation=false}={}){
    this.page=page;
    this.scenario=scenario || 'belirsiz';
    this.simulation=simulation;
    this.issues=[];
    this.duplicates=new Set();
    this.attach();
  }
  add(raw){
    const issue=classify(raw);
    const key=[issue.kind,issue.adres,issue.durum,issue.aciklama].join('|');
    if(this.duplicates.has(key))return;
    this.duplicates.add(key);
    this.issues.push(issue);
  }
  attach(){
    const page=this.page;
    page.on('pageerror',err=>this.add({kind:'javascript',url:page.url(),message:err.message}));
    page.on('console',msg=>{
      if(msg.type()!=='error')return;
      const loc=msg.location();
      const text=msg.text();
      const hinted=String(text).match(/https?:\/\/[^\s)]+/);
      this.add({kind:'console',url:loc?.url||hinted?.[0]||'',message:text});
    });
    page.on('requestfailed',req=>{
      this.add({kind:'network',url:req.url(),message:req.failure()?.errorText||'Bilinmeyen ağ hatası'});
    });
    page.on('response',res=>{
      if(res.status()>=400){
        this.add({kind:'http',url:res.url(),status:res.status(),message:'HTTP '+res.status()+' '+res.request().method()});
      }
    });
  }
  async inspectImages(){
    const page=this.page;
    const images=page.locator('img');
    const total=await images.count();
    if(total===0)this.add({kind:'image',url:page.url(),message:'Sayfada hiçbir görsel yok'});
    for(let i=0;i<total;i++){
      const img=images.nth(i);
      if(!await img.isVisible())continue;
      await img.scrollIntoViewIfNeeded();
      const state=await img.evaluate(async node=>{
        try{await node.decode();}catch{}
        return {src:node.currentSrc||node.src,complete:node.complete,width:node.naturalWidth};
      });
      if(!state.complete||state.width===0){
        this.add({kind:'image',url:state.src||page.url(),message:'Kırık veya yüklenemeyen görsel (naturalWidth='+state.width+')'});
      }
    }
    return total;
  }
  async inspectLinks(){
    const page=this.page;
    const urls=await page.locator('a[href]').evaluateAll(nodes=>nodes.map(a=>({
      href:a.getAttribute('href'),
      label:(a.textContent||a.getAttribute('aria-label')||'').trim().slice(0,70),
    })));
    const visited=new Set();
    for(const item of urls){
      if(!item.href||item.href==='#')continue;
      let u;
      try{u=new URL(item.href,page.url());}catch{continue;}
      if(!['http:','https:'].includes(u.protocol))continue;
      if(!isInternal(u.href))continue; // dış bağlantıların ziyaret edilmesi yasak
      if(u.hash && u.pathname===new URL(page.url()).pathname){
        const fragment=decodeURIComponent(u.hash.slice(1));
        const found=await page.evaluate(id=>Boolean(document.getElementById(id)||
          document.getElementsByName(id).length),fragment);
        if(!found)this.add({kind:'link',url:u.href,status:0,
          message:'Sayfa içinde bulunamayan hedef #'+fragment+' ('+item.label+')'});
        continue;
      }
      u.hash='';u.search='';
      if(visited.has(u.href))continue;
      visited.add(u.href);
      try{
        const response=await page.request.get(u.href,{timeout:10000,failOnStatusCode:false});
        if(response.status()>=400){
          this.add({kind:'link',url:u.href,status:response.status(),message:'Dahili bağlantı HTTP '+response.status()});
        }
      }catch(err){this.add({kind:'network',url:u.href,message:'İç bağlantı isteği başarısız: '+err.message});}
    }
    return urls.length;
  }
  async inspectBlank({selector,minCharacters=35}={}){
    const page=this.page;
    const text=await page.locator('body').innerText().catch(()=> '');
    if(text.trim().length<minCharacters){
      this.add({kind:'empty',url:page.url(),message:'Beklenmedik boş veya çok kısa sayfa (karakter: '+text.trim().length+')'});
    }
    if(selector){
      const count=await page.locator(selector).count();
      if(count===0)this.add({kind:'empty',url:page.url(),message:'Zorunlu içerik bulunamadı: '+selector});
    }
    return text.length;
  }
  async save(info){
    const data={
      version:1,
      tarih:new Date().toISOString(),
      commit:process.env.GITHUB_SHA||'local',
      proje:info.project.name,
      senaryo:this.scenario,
      simulasyon:this.simulation,
      sayfa:maskUrl(this.page.url()),
      hataSayisi:this.issues.length,
      engelleyici:this.issues.filter(isBlocking).length,
      bulgular:this.issues,
    };
    const dir=resolve('test-results/g8/observations');
    await mkdir(dir,{recursive:true});
    const file=join(dir,info.project.name+'-'+this.scenario+'-retry'+info.retry+'.json');
    await writeFile(file,JSON.stringify(data,null,2),'utf8');
    await info.attach('G8-Turkce-Denetim.json',{body:Buffer.from(JSON.stringify(data,null,2)),contentType:'application/json'});
    return data;
  }
}
