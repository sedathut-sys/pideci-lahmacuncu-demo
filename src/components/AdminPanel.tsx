import {publicUrl} from '../lib/paths';
import { useEffect, useMemo, useState } from 'react';
import { initialProducts,readDemoProducts,writeDemoProducts,type Product, type ProductExtra, type ProductVariant } from '../data/products';
import { site,brandInitials,readDemoSettings,writeDemoSettings,type SiteSettings } from '../data/config';
import {addCategory,removeCategory,validateCategories,assertCategoriesUsed} from '../lib/admin-core.mjs';
import {displayedPrice,withDisplayedPrice,syncDisplayPrice,addVariant,removeVariant} from '../lib/admin-prices.mjs';
import {formatAdminPrice,validateProductPricing} from '../lib/price-rules.mjs';
import PriceInput from './PriceInput';
import {demoImageData} from '../lib/demo-image.mjs';

const LIVE = import.meta.env.PUBLIC_DATA_MODE === 'live';
const IMAGE_OPTIONS=[
  {file:'pide-kiymali',label:'Kıymalı Pide'},
  {file:'pide-kasarli',label:'Kaşarlı Pide'},
  {file:'pide-karisik',label:'Karışık Pide'},
  {file:'lahmacun',label:'Antep Usulü Lahmacun'},
  {file:'salata',label:'Çoban Salata'},
  {file:'kunefe',label:'Künefe'},
  {file:'ayran',label:'Ayran'},
  {file:'soda',label:'Maden Suyu'}
].map(({file,label})=>({image:`/images/${file}.svg`,label}));
const IMAGES=IMAGE_OPTIONS.map(({image})=>image);
const money=formatAdminPrice;
function emptyProduct(category:string):Product {return {id:'',name:'',description:'',category,price:0,image:IMAGES[0],available:true,badge:'',variants:[],extras:[]};}
async function responseJson(response:Response) {
  let data:any;
  try{data=await response.json();}catch{throw new Error(`İşlem başarısız (${response.status}).`);}
  if(!response.ok)throw new Error(data.error||'İşlem gerçekleştirilemedi.');
  return data;
}
function normalize(product:Product):Product {
  return {...product,name:product.name.trim(),description:product.description.trim(),
    variants:(product.variants||[]).filter(x=>x.label.trim()).map(x=>({label:x.label.trim(),price:x.price})),
    extras:(product.extras||[]).filter(x=>x.label.trim()).map(x=>({label:x.label.trim(),price:x.price}))};
}
export default function AdminPanel() {
  const [status,setStatus]=useState<'loading'|'login'|'ready'>(LIVE?'loading':'ready');
  const [csrf,setCsrf]=useState('');
  const [username,setUsername]=useState('admin');
  const [password,setPassword]=useState('');
  const [loginBusy,setLoginBusy]=useState(false);
  const [products,setProducts]=useState<Product[]>(LIVE?[]:initialProducts);
  const [settings,setSettings]=useState<SiteSettings>(site);
  const [editing,setEditing]=useState<Product|null>(null);
  const [editingBaseline,setEditingBaseline]=useState('');
  const [isNew,setIsNew]=useState(false);
  const [filter,setFilter]=useState('');
  const [tab,setTab]=useState<'products'|'categories'|'settings'>('products');
  const [newCategory,setNewCategory]=useState('');
  const [busy,setBusy]=useState(false);
  const [uploadState,setUploadState]=useState('');
  const [keyboardViewport,setKeyboardViewport]=useState<{height:number;top:number}|null>(null);
  const [notice,setNotice]=useState('');
  const [error,setError]=useState('');

  function info(msg:string){setNotice(msg);setError('');}
  function warn(err:unknown){setError(err instanceof Error?err.message:'İşlem tamamlanamadı.');setNotice('');}
  async function getData() {
    const data=await responseJson(await fetch('/api/admin/data',{credentials:'same-origin',cache:'no-store'}));
    setProducts(data.products||[]);setSettings(data.settings||site);
  }
  useEffect(()=>{
    let mounted=true;
    if(!LIVE){setProducts(readDemoProducts());setSettings(readDemoSettings());return;}
    (async()=>{
      try {
        const me=await responseJson(await fetch('/api/admin/me',{credentials:'same-origin',cache:'no-store'}));
        if(!mounted)return;
        setCsrf(me.csrf);
        await getData();
        if(mounted)setStatus('ready');
      }catch{if(mounted)setStatus('login');}
    })();
    return ()=>{mounted=false;};
  },[]);
  function startEditing(product:Product,isNewProduct=false) {
    const draft=syncDisplayPrice(structuredClone(product));
    setIsNew(isNewProduct);setUploadState('');setError('');
    setEditingBaseline(JSON.stringify(draft));setEditing(draft);
  }
  function requestCloseEditor() {
    if(busy || !editing)return;
    if(JSON.stringify(editing)!==editingBaseline && !window.confirm('Kaydedilmemiş değişiklikler var. Kaydetmeden çıkmak istiyor musunuz?'))return;
    setEditing(null);
  }
  useEffect(()=>{
    if(!editing)return;
    function onKey(e:KeyboardEvent){if(e.key==='Escape'){e.preventDefault();requestCloseEditor();}}
    window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);
  },[editing,editingBaseline,busy]);
  // Android/iOS ekran klavyesi bazen yalnızca visualViewport'u küçültür.
  useEffect(()=>{
    if(!editing){setKeyboardViewport(null);return;}
    const viewport=window.visualViewport;
    if(!viewport)return;
    function update(){
      const focused=document.activeElement;
      const formFocused=focused instanceof HTMLElement && Boolean(focused.closest('.admin-dialog-large'));
      const obscured=window.innerHeight-viewport!.height-viewport!.offsetTop;
      const keyboardOpen=window.innerWidth<=800 && formFocused && obscured>120;
      const next=keyboardOpen?{height:Math.round(viewport!.height),top:Math.round(viewport!.offsetTop)}:null;
      setKeyboardViewport(prev=>prev?.height===next?.height&&prev?.top===next?.top?prev:next);
    }
    viewport.addEventListener('resize',update);
    viewport.addEventListener('scroll',update);
    window.addEventListener('resize',update);
    document.addEventListener('focusin',update);
    document.addEventListener('focusout',update);
    update();
    return ()=>{
      viewport.removeEventListener('resize',update);
      viewport.removeEventListener('scroll',update);
      window.removeEventListener('resize',update);
      document.removeEventListener('focusin',update);
      document.removeEventListener('focusout',update);
    };
  },[editing!==null]);
  const matches=useMemo(()=>products.filter(p=>`${p.name} ${p.category}`.toLocaleLowerCase('tr-TR').includes(filter.toLocaleLowerCase('tr-TR'))),[products,filter]);

  async function api(method:string,path:string,data?:any) {
    const result=await fetch(path,{method,credentials:'same-origin',headers:{'content-type':'application/json','x-csrf-token':csrf},body:data===undefined?undefined:JSON.stringify(data)});
    return responseJson(result);
  }
  async function login(event:React.FormEvent) {
    event.preventDefault();setLoginBusy(true);setError('');
    try {
      const result=await responseJson(await fetch('/api/admin/login',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({username,password})}));
      setCsrf(result.csrf);setPassword('');
      const data=await responseJson(await fetch('/api/admin/data',{credentials:'same-origin',cache:'no-store'}));
      setProducts(data.products||[]);setSettings(data.settings||site);
      setStatus('ready');info('Giriş başarılı.');
    } catch(e){warn(e);}finally{setLoginBusy(false);}
  }
  async function logout() {
    if(!LIVE)return;
    try{await api('POST','/api/admin/logout');}catch{/* oturumun süresi zaten dolmuş olabilir */}
    setCsrf('');setStatus('login');setProducts([]);setPassword('');
  }
  async function saveProduct() {
    if(!editing)return;
    const next=syncDisplayPrice(normalize(editing));
    if(next.name.length<2) {warn(new Error('Ürün adı en az iki karakter olmalı.'));return;}
    try{validateProductPricing(next);}catch(e){warn(e);return;}
    if(!settings.categories.includes(next.category)) {warn(new Error('Geçerli bir kategori seçin.'));return;}
    for(const opts of [next.variants||[],next.extras||[]]) {if(new Set(opts.map(x=>x.label.toLocaleLowerCase('tr-TR'))).size!==opts.length){warn(new Error('Aynı porsiyon veya ekstra seçenek iki kez eklenemez.'));return;}}
    setBusy(true);
    try{
      if(LIVE) {
        const result=isNew?await api('POST','/api/admin/products',next):await api('PUT',`/api/admin/products/${encodeURIComponent(next.id)}`,next);
        if(isNew)setProducts(p=>[...p,result.product]);else setProducts(p=>p.map(x=>x.id===next.id?result.product:x));
      } else {
        const product={...next,id:isNew?crypto.randomUUID():next.id};
        const changed=isNew?[...products,product]:products.map(x=>x.id===product.id?product:x);
        writeDemoProducts(changed);setProducts(changed);
      }
      setEditing(null);info('Ürün kaydedildi.');
    }catch(e){warn(e);}finally{setBusy(false);}
  }
  async function deleteProduct(product:Product){
    if(!confirm(`“${product.name}” ürününü silmek istiyor musun?`))return;
    setBusy(true);
    try{
      if(LIVE)await api('DELETE',`/api/admin/products/${encodeURIComponent(product.id)}`);
      const next=products.filter(p=>p.id!==product.id);setProducts(next);
      if(!LIVE)writeDemoProducts(next);
      info('Ürün silindi.');
    }catch(e){warn(e);}finally{setBusy(false);}
  }
  async function toggleProduct(product:Product){
    const next={...product,available:!product.available};
    setBusy(true);
    try{
      if(LIVE) await api('PUT',`/api/admin/products/${encodeURIComponent(product.id)}`,normalize(next));
      const updated=products.map(p=>p.id===product.id?next:p);
      setProducts(updated);if(!LIVE)writeDemoProducts(updated);
      info(next.available?'Ürün yeniden gösteriliyor.':'Ürün geçici olarak gizlendi.');
    }catch(e){warn(e);}finally{setBusy(false);}
  }
  async function saveSettings(){
    const next={...settings,whatsappNumber:settings.whatsappNumber.replace(/[\s+()-]/g,'')};
    try {validateCategories(next.categories);assertCategoriesUsed(products,next.categories);
      if(next.whatsappNumber && !/^[1-9]\d{9,14}$/.test(next.whatsappNumber))throw new Error('WhatsApp numarasını ülke koduyla girin.');
      if(next.orderingEnabled&&!next.deliveryAvailable&&!next.pickupAvailable)throw new Error('Sipariş için paket servis veya gel-al seçin.');
      if(!Number.isFinite(next.minimumOrder)||next.minimumOrder<0||next.minimumOrder>1000000)throw new Error('Minimum sipariş tutarını kontrol edin.');
    }catch(e){warn(e);return;}
    setBusy(true);
    try{
      if(LIVE) {const result=await api('PUT','/api/admin/settings',next);setSettings(result.settings);}
      else {writeDemoSettings(next);setSettings(next);}
      info('İşletme ayarları kaydedildi.');
    }catch(e){warn(e);}finally{setBusy(false);}
  }
  async function persistCategories(next:string[]) {
    try {
      validateCategories(next);assertCategoriesUsed(products,next);setBusy(true);
      const newSettings={...settings,categories:next};
      if(LIVE){const result=await api('PUT','/api/admin/settings',newSettings);setSettings(result.settings);}
      else {writeDemoSettings(newSettings);setSettings(newSettings);}
      info('Kategoriler kaydedildi.');return true;
    }catch(e){warn(e);return false;}finally{setBusy(false);}
  }
  async function addNewCategory(event:React.FormEvent){
    event.preventDefault();
    try{if(await persistCategories(addCategory(settings.categories,newCategory)))setNewCategory('');}catch(e){warn(e);}
  }
  async function removeExistingCategory(name:string) {
    if(!confirm(`“${name}” kategorisini silmek istiyor musun?`))return;
    try{await persistCategories(removeCategory(settings.categories,name,products));}catch(e){warn(e);}
  }
  function resetDemoProducts() {
    if(LIVE)return;
    const missing=site.categories.filter(c=>!settings.categories.includes(c));
    if(missing.length){warn(new Error('Örnek ürünleri sıfırlamak için eksik kategorileri geri ekleyin veya Tüm demoyu başlangıca döndür seçeneğini kullanın.'));return;}
    if(!window.confirm('Yalnızca 8 örnek ürün baştan yüklenecek. İşletme ayarları ve kategoriler korunacak. Devam edilsin mi?'))return;
    try{writeDemoProducts(structuredClone(initialProducts));setProducts(structuredClone(initialProducts));info('Örnek ürünler sıfırlandı; işletme ayarları korundu.');}catch(e){warn(e);}
  }
  function resetEntireDemo() {
    if(LIVE || !window.confirm('TÜM DEMO sıfırlanacak: ürünler, kategoriler, işletme bilgileri ve sipariş ayarları başlangıca döner. Önce JSON yedeği indirilecek. Devam edilsin mi?'))return;
    try {
      downloadDemoBackup();
      const originalProducts=structuredClone(initialProducts), originalSettings=structuredClone(site);
      writeDemoProducts(originalProducts);writeDemoSettings(originalSettings);
      setProducts(originalProducts);setSettings(originalSettings);setNewCategory('');setFilter('');
      info('Tüm demo başlangıç ayarlarına döndürüldü. Önceki bilgilerin yedeği indirildi.');
    }catch(e){warn(e);}
  }
  function downloadDemoBackup(){
    if(LIVE)return;
    const blob=new Blob([JSON.stringify({version:3,products,settings,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='tas-firin-demo-yedek.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    info('Demo yedek dosyası indirildi.');
  }
  async function downloadLiveBackup(){
    if(!LIVE)return;
    setBusy(true);
    try{
      const result=await responseJson(await fetch('/api/admin/export',{credentials:'same-origin',cache:'no-store'}));
      const blob=new Blob([JSON.stringify(result,null,2)],{type:'application/json'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');a.href=url;a.download='isletme-verileri-yedek.json';a.click();
      window.setTimeout(()=>URL.revokeObjectURL(url),1000);
      info('Ürün ve işletme bilgileri yedeği indirildi. Fotoğraf dosyalarını ayrıca yedekleyin.');
    }catch(e){warn(e);}finally{setBusy(false);}
  }
  async function uploadImage(file:File){
    setUploadState('Fotoğraf işleniyor…');
    if(!LIVE){
      setBusy(true);try{const image=await demoImageData(file);setEditing(p=>p?{...p,image}:p);setUploadState('✓ Yeni fotoğraf işlendi. Önizlemeyi kontrol edip Ürünü kaydet düğmesine basın.');info('Yeni fotoğraf hazırlandı; kalıcı olması için ürünü kaydedin.');}
      catch(e){setUploadState(e instanceof Error?e.message:'Fotoğraf yüklenemedi.');warn(e);}finally{setBusy(false);}return;
    }
    if(file.size>2*1024*1024){warn(new Error('En fazla 2 MB görsel yükleyebilirsiniz.'));return;}
    setBusy(true);
    try{
      const res=await fetch('/api/admin/uploads',{method:'POST',credentials:'same-origin',headers:{'content-type':file.type,'x-csrf-token':csrf},body:file});
      const data=await responseJson(res);
      setEditing(p=>p?{...p,image:data.url}:p);setUploadState('✓ Yeni fotoğraf sunucuya yüklendi. Ürünü kaydet düğmesine basın.');info('Yeni fotoğraf yüklendi. Ürüne uygulamak için kaydedin.');
    }catch(e){warn(e);}finally{setBusy(false);}
  }
  function setOption(kind:'variants'|'extras',index:number,key:'label'|'price',val:string|number){
    setEditing(p=>{
      if(!p)return p;
      const options=[...(p[kind]||[])];
      options[index]=key==='price'?{...options[index],price:Number(val)}:{...options[index],label:String(val)};
      return kind==='variants' && key==='price' && index===0 ? withDisplayedPrice({...p,variants:options},Number(val)) : {...p,[kind]:options};
    });
  }
  function addOption(kind:'variants'|'extras'){setEditing(p=>p?(kind==='variants'?addVariant(p):{...p,extras:[...(p.extras||[]),{label:'',price:0}]}):p);}
  function removeOption(kind:'variants'|'extras',index:number){setEditing(p=>p?(kind==='variants'?removeVariant(p,index):{...p,extras:(p.extras||[]).filter((_,i)=>i!==index)}):p);}

  if(status==='loading')return <div className="admin-login-page"><div className="admin-login-box">İşletmeci paneli yükleniyor…</div></div>;
  if(status==='login')return <div className="admin-login-page"><form className="admin-login-box" onSubmit={login}>
    <a className="admin-login-back" href={publicUrl("/")}>← Siteye dön</a>
    <div className="brand-mark">{brandInitials(site.name).slice(0,1)}<span>{brandInitials(site.name).slice(1)}</span></div>
    <p className="overline">İŞLETME YÖNETİMİ</p><h1>Panel girişi</h1><p>Ürünlerinizi, menünüzü ve iletişim bilgilerinizi güvenle yönetin.</p>
    <label>Kullanıcı adı<input autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} required /></label>
    <label>Şifre<input autoComplete="current-password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></label>
    {error&&<div className="form-error" role="alert">{error}</div>}
    <button className="admin-create" disabled={loginBusy} type="submit">{loginBusy?'Giriş yapılıyor…':'Giriş yap'} →</button>
  </form></div>;

  return <div className="admin-app">
    <aside className="admin-sidebar"><a href={publicUrl("/")} className="admin-logo"><span className="brand-mark">{brandInitials(settings.name).slice(0,1)}<span>{brandInitials(settings.name).slice(1)}</span></span><span>{settings.name.toUpperCase()}<small>İŞLETME YÖNETİMİ</small></span></a>
      <div className="admin-side-label">YÖNETİM</div>
      <button type="button" className={`admin-side-link ${tab==='products'?'active':''}`} onClick={()=>setTab('products')}>▦ <span>Ürünler ve menü</span></button>
      <button type="button" className={`admin-side-link ${tab==='categories'?'active':''}`} onClick={()=>setTab('categories')}>▤ <span>Kategoriler</span></button>
      <button type="button" className={`admin-side-link ${tab==='settings'?'active':''}`} onClick={()=>setTab('settings')}>⚙ <span>İşletme ayarları</span></button>
      <a href={publicUrl("/")} className="admin-side-link">↗ <span>Siteyi görüntüle</span></a>
      <div className="admin-side-foot">{LIVE?'🔒 Korunan yönetici oturumu':'⚠ DEMO: Veriler sadece bu tarayıcıda kaydedilir.'}</div>
    </aside>
    <main className="admin-main"><header className="admin-top"><div><span className="admin-top-kicker">İşletmeci paneli / {LIVE?'D1 Veritabanı':'Yerel Demo'}</span><h1>Merhaba, hoş geldin 👋</h1><p>Menünü ve sipariş hattını kolayca yönet.</p></div><div className="admin-top-actions"><a href={publicUrl("/")} className="admin-top-link">← Siteye dön</a>{LIVE&&<button type="button" className="admin-top-link" onClick={logout}>Çıkış yap</button>}</div></header>
      {!LIVE&&<div className="admin-alert"><b>DEMO · Şifresiz</b><span>Bu panel yalnızca tanıtım içindir. Ürünler, görseller ve ayarlar bu tarayıcıda saklanır; başka cihazlarda görünmez. Gerçek müşteriye henüz açmayın.</span></div>}
      {notice&&<div className="admin-notice" role="status">✓ {notice}</div>}{error&&<div className="admin-error" role="alert">{error}</div>}
      {tab==='products'?<>
        <div className="admin-stats"><div className="admin-stat"><small>Toplam ürün</small><strong>{products.length}</strong><span>Menüdeki kayıt</span></div><div className="admin-stat"><small>Görünür</small><strong>{products.filter(p=>p.available).length}</strong><span>Aktif ürün</span></div><div className="admin-stat"><small>Gizli ürün</small><strong>{products.filter(p=>!p.available).length}</strong><span>Geçici olarak kapalı</span></div></div>
        <section className="admin-section" id="urunler"><div className="admin-section-top"><div><h2>Menüdeki ürünler <span>{products.length}</span></h2><p>Ürün ekle, sil, fiyat veya porsiyon seçeneklerini değiştir.</p></div><button className="admin-create" type="button" onClick={()=>startEditing(emptyProduct(settings.categories[0]||'Pide'),true)}>＋ Yeni ürün</button></div>
          <div className="admin-toolbar">{!LIVE&&<button type="button" onClick={downloadDemoBackup}>↓ Demo yedeğini indir</button>}{LIVE&&<button type="button" disabled={busy} onClick={downloadLiveBackup}>↓ İşletme yedeği (JSON)</button>}<input type="search" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Ürün veya kategori ara…" aria-label="Ürün ara"/>{!LIVE&&<><button type="button" onClick={resetDemoProducts}>↺ Örnek ürünleri sıfırla</button><button type="button" className="admin-reset-all" onClick={resetEntireDemo}>↺ Tüm demoyu başlangıca döndür</button></>}</div>
          <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Ürün</th><th>Kategori</th><th>Başlangıç fiyatı</th><th>Durum</th><th>İşlemler</th></tr></thead><tbody>{matches.map(p=><tr key={p.id}><td><div className="admin-product"><img src={publicUrl(p.image)} alt=""/><div><strong>{p.name}</strong><small>{p.description}</small></div></div></td><td>{p.category}</td><td className="admin-price">{money(displayedPrice(p))}</td><td><button disabled={busy} className={`status-pill ${p.available?'on':'off'}`} type="button" onClick={()=>toggleProduct(p)}>{p.available?'● Görünür':'○ Gizli'}</button></td><td className="admin-actions-cell"><button className="edit-button" type="button" onClick={()=>startEditing(p)}>Düzenle</button><button className="admin-danger-btn" type="button" disabled={busy} onClick={()=>deleteProduct(p)}>Sil</button></td></tr>)}</tbody></table>{matches.length===0&&<p className="admin-no-results">Ürün bulunamadı.</p>}</div>
          <div className="admin-mobile-cards" aria-label="Ürünleri telefondan yönet">
            {matches.map(p=><article className="admin-mobile-product" key={p.id}>
              <div className="admin-mobile-product-top">
                <img src={publicUrl(p.image)} alt="" loading="lazy" width="92" height="92"/>
                <div className="admin-mobile-product-info">
                  <small>{p.category}</small>
                  <h3>{p.name}</h3>
                  <strong>{money(displayedPrice(p))}</strong>
                </div>
              </div>
              <div className="admin-mobile-product-actions" role="group" aria-label={`${p.name} yönetimi`}>
                <button disabled={busy} className={`status-pill ${p.available?'on':'off'}`} type="button" onClick={()=>toggleProduct(p)} aria-label={`${p.name}: ${p.available?'görünür, gizlemek için tıkla':'gizli, göstermek için tıkla'}`}>{p.available?'● Görünür':'○ Gizli'}</button>
                <button className="edit-button" type="button" onClick={()=>startEditing(p)} aria-label={`${p.name} düzenle`}>Düzenle</button>
                <button className="admin-danger-btn" type="button" disabled={busy} onClick={()=>deleteProduct(p)} aria-label={`${p.name} sil`}>Sil</button>
              </div>
            </article>)}
            {matches.length===0&&<p className="admin-no-results">Ürün bulunamadı.</p>}
          </div>
        </section>
      </>:tab==='categories'?<section className="admin-section admin-category-section">
        <div className="admin-section-top"><div><h2>Kategori yönetimi <span>{settings.categories?.length||0}</span></h2><p>Menüdeki başlıkları düzenle. Ürünü olan kategoriyi silmeden önce ürünleri taşımalısın.</p></div></div>
        <form className="admin-category-add" onSubmit={addNewCategory}>
          <label htmlFor="new-category">Yeni kategori</label><input id="new-category" maxLength={36} value={newCategory} onChange={e=>setNewCategory(e.target.value)} placeholder="Örn. Tatlılar"/>
          <button className="admin-create" disabled={busy||!newCategory.trim()} type="submit">＋ Kategori ekle</button>
        </form>
        <div className="admin-category-list">{settings.categories.map(name=>{const count=products.filter(p=>p.category===name).length;return <div className="admin-category-row" key={name}><div><strong>{name}</strong><small>{count} ürün bağlı</small></div><button type="button" disabled={busy||count>0||settings.categories.length===1} className="admin-danger-btn" title={count>0?'Önce içindeki ürünleri başka kategoriye taşıyın':''} onClick={()=>removeExistingCategory(name)}>Kategoriyi sil</button></div>;})}</div>
      </section>:<section className="admin-section admin-settings-section"><div className="admin-section-top"><div><h2>İşletme ayarları</h2><p>Telefon, WhatsApp, adres, sipariş ve çalışma saatlerini güncelle.</p></div></div>
        <div className="admin-form admin-settings-grid"><label>İşletme adı *<input maxLength={75} value={settings.name} onChange={e=>setSettings({...settings,name:e.target.value})}/></label><label>Telefon (görünür)<input value={settings.phoneDisplay} maxLength={40} onChange={e=>setSettings({...settings,phoneDisplay:e.target.value})} placeholder="0 (555) 000 00 00"/></label>
        <label>WhatsApp numarası (ülke koduyla)<input value={settings.whatsappNumber} onChange={e=>setSettings({...settings,whatsappNumber:e.target.value})} placeholder="905XXXXXXXXX"/><small>Örnek: 905XXXXXXXXX. Demo bu numaraya mesaj göndermez.</small></label>
        <label>Çalışma saatleri (ziyaretçiye görünür)<input maxLength={170} value={settings.hours} onChange={e=>setSettings({...settings,hours:e.target.value})}/></label>
        <label className="admin-field-wide">Adres<textarea rows={2} maxLength={280} value={settings.address} onChange={e=>setSettings({...settings,address:e.target.value})}/></label>
        <label className="admin-field-wide">Kısa tanıtım<input maxLength={160} value={settings.tagline} onChange={e=>setSettings({...settings,tagline:e.target.value})}/></label>
        <label>Minimum sipariş (₺)<PriceInput ariaLabel="Minimum sipariş tutarı" value={settings.minimumOrder} onChange={value=>setSettings({...settings,minimumOrder:value})}/></label>
        <label className="admin-field-wide">Bilgilendirme notu<input maxLength={150} value={settings.notice} onChange={e=>setSettings({...settings,notice:e.target.value})}/></label>
        <label className="admin-checkbox"><input type="checkbox" checked={settings.orderingEnabled} onChange={e=>setSettings({...settings,orderingEnabled:e.target.checked})}/> Sipariş alımı açık</label>
        <label className="admin-checkbox"><input type="checkbox" checked={settings.deliveryAvailable} onChange={e=>setSettings({...settings,deliveryAvailable:e.target.checked})}/> Paket servis var</label>
        <label className="admin-checkbox"><input type="checkbox" checked={settings.pickupAvailable} onChange={e=>setSettings({...settings,pickupAvailable:e.target.checked})}/> Gel-al var</label></div>
        <div className="admin-settings-footer"><button disabled={busy} type="button" className="admin-create" onClick={saveSettings}>{busy?'Kaydediliyor…':'Ayarları kaydet'}</button></div>
      </section>}
    </main>
    {editing&&<div className={`modal-backdrop${keyboardViewport?' admin-backdrop-keyboard':''}`} style={keyboardViewport?{top:keyboardViewport.top,bottom:'auto',height:keyboardViewport.height}:undefined} onMouseDown={e=>{if(e.target===e.currentTarget)requestCloseEditor();}}><section className="admin-dialog admin-dialog-large" role="dialog" aria-modal="true" aria-label={isNew?'Ürün oluştur':'Ürün düzenle'}><div className="admin-dialog-top"><div><p className="overline">MENÜ YÖNETİMİ</p><h2>{isNew?'Yeni ürün':'Ürün düzenle'}</h2></div><div className="admin-header-actions"><button type="button" className="admin-header-save" disabled={busy} onClick={saveProduct} aria-label="Ürünü kaydet">Kaydet</button><button className="close-icon" aria-label="Kapat" onClick={requestCloseEditor} type="button">✕</button></div></div>
      <div className="admin-form"><p className="admin-menu-price-preview" role="status">Müşterinin gördüğü başlangıç fiyatı <strong>{money(displayedPrice(editing))}</strong></p><p className="admin-draft-hint">Değişiklikler yalnızca <b>Ürünü kaydet</b> düğmesine bastığınızda uygulanır.</p><label>Ürün adı *<input autoFocus maxLength={80} value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})} placeholder="Kıymalı Pide"/></label>
        <label>Kategori<select value={editing.category} onChange={e=>setEditing({...editing,category:e.target.value as Product['category']})}>{settings.categories.map(cat=><option key={cat}>{cat}</option>)}</select></label>
        <label className="admin-primary-price">Menüde görünen satış fiyatı (₺) *<PriceInput ariaLabel="Menüde görünen satış fiyatı" value={displayedPrice(editing)} onChange={value=>setEditing(withDisplayedPrice(editing,value))}/><small className="admin-price-help">{editing.variants?.length ? ('Bu fiyat “' + (editing.variants[0].label||'ilk porsiyon') + '” ile birlikte güncellenir. Diğer porsiyonların fiyatı ayrı değişir.') : 'Müşterinin menüde gördüğü fiyat budur.'}</small></label>
        <label>Etiket / rozet<input value={editing.badge||''} maxLength={35} onChange={e=>setEditing({...editing,badge:e.target.value})} placeholder="Çok sevilen"/></label>
        <label>Açıklama<textarea rows={3} maxLength={300} value={editing.description} onChange={e=>setEditing({...editing,description:e.target.value})}/></label>
        <label>Fotoğraf seç<select value={IMAGES.includes(editing.image)?editing.image:'custom'} onChange={e=>{if(e.target.value==='custom')return;setEditing({...editing,image:e.target.value});setUploadState('✓ Hazır menü görseli seçildi. Ürünü kaydet düğmesine basın.');setError('');}}>{!IMAGES.includes(editing.image)&&<option value="custom">Yüklenen fotoğraf (mevcut)</option>}{IMAGE_OPTIONS.map(({image,label})=><option key={image} value={image}>{label}</option>)}</select></label>
        <label>Yeni fotoğraf yükle<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{const file=e.target.files?.[0];if(file)void uploadImage(file);e.target.value='';}}/><small>{LIVE?'En fazla 2 MB · R2 üzerinde saklanır':'2 MB görsel seçilebilir; demo için küçültülerek bu tarayıcıda saklanır.'}</small></label>{uploadState&&<p className="admin-upload-status" role="status">{uploadState}</p>}{error&&<p className="form-error" role="alert">{error}</p>}
        <img className="admin-edit-preview" src={publicUrl(editing.image)} alt={`${editing.name||'Ürün'} görseli`}/>
        <fieldset className="admin-options-field"><legend>Porsiyon / boy seçenekleri</legend><p>İlk porsiyonun fiyatı yukarıdaki satış fiyatına bağlıdır. Diğer porsiyonları burada bağımsız düzenleyin.</p>{(editing.variants||[]).map((v,i)=><div className="admin-option-row" key={`v${i}`}><input aria-label={`${i+1}. porsiyon adı`} value={v.label} placeholder="Standart" onChange={e=>setOption('variants',i,'label',e.target.value)}/>{i===0?<span className="admin-first-variant-price">{money(displayedPrice(editing))}<small>Üstteki fiyat</small></span>:<PriceInput key={`v-${i}-${v.label}`} ariaLabel={`${v.label||"Porsiyon"} fiyatı`} value={v.price} onChange={value=>setOption("variants",i,"price",value)}/>}<button type="button" onClick={()=>removeOption('variants',i)} aria-label="Porsiyonu sil">✕</button></div>)}<button type="button" className="admin-add-option" onClick={()=>addOption('variants')}>+ Porsiyon ekle</button></fieldset>
        <fieldset className="admin-options-field"><legend>Ekstra malzemeler</legend><p>Örn. Ekstra kaşar +35 TL, acılı +0 TL.</p>{(editing.extras||[]).map((v,i)=><div className="admin-option-row" key={`e${i}`}><input aria-label={`${i+1}. ekstra adı`} value={v.label} placeholder="Ekstra kaşar" onChange={e=>setOption('extras',i,'label',e.target.value)}/><PriceInput key={`e-${i}-${v.label}`} ariaLabel={`${v.label||"Ekstra"} fiyatı`} value={v.price} onChange={value=>setOption("extras",i,"price",value)}/><button type="button" onClick={()=>removeOption('extras',i)} aria-label="Ekstrayı sil">✕</button></div>)}<button type="button" className="admin-add-option" onClick={()=>addOption('extras')}>+ Ekstra ekle</button></fieldset>
        <label className="admin-checkbox"><input type="checkbox" checked={editing.available} onChange={e=>setEditing({...editing,available:e.target.checked})}/> Ürünü menüde göster</label>
      </div><div className="admin-dialog-footer"><button type="button" className="admin-cancel" onClick={requestCloseEditor}>Vazgeç</button><button type="button" disabled={busy} className="admin-create" onClick={saveProduct}>{busy?'Kaydediliyor…':'Ürünü kaydet'}</button></div>
    </section></div>}
  </div>;
}
