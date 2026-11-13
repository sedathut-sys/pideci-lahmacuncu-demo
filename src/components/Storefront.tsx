import {publicUrl} from '../lib/paths';
import { useEffect, useMemo, useState } from 'react';
import { site, SITE_CHANGED, readDemoSettings, brandInitials, brandSubtitle, type SiteSettings } from '../data/config';
import { CHANGE_EVENT, initialProducts, readDemoProducts, type Product } from '../data/products';
import {MAX_LINE_QUANTITY, money, buildCartLine, addLine, changeQuantity, totals, refreshCart, validateCheckout, orderMessage, whatsAppLink, type CartLine, type Delivery} from '../lib/order-core.mjs';

const LIVE = import.meta.env.PUBLIC_DATA_MODE === 'live';

const cartQuantity = (items: CartLine[]) => totals(items).quantity;

function Icon({name, size=20}: {name:'bag'|'arrow'|'close'|'plus'|'minus'|'search'|'star'|'check'|'clock'|'map'|'menu'|'whatsapp',size?:number}) {
  const paths:Record<string,React.ReactNode> = {
    bag: <><path d="M4.5 8h15l-1 12h-13L4.5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></>,
    arrow: <><path d="M4 12h16"/><path d="m14 6 6 6-6 6"/></>,
    close: <><path d="M5 5l14 14M19 5 5 19"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    minus: <path d="M5 12h14"/>,
    search: <><circle cx="10.7" cy="10.7" r="6.7"/><path d="m16 16 5 5"/></>,
    star: <path d="m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.5l-5.7 3 1.1-6.3-4.6-4.5 6.4-.9L12 3Z"/>,
    check: <path d="m4 12 5 5L20 6"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    map: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    whatsapp: <><path d="M7.2 20.1 3 21l.9-4.4A9 9 0 1 1 7.2 20.1Z"/><path d="M8.2 8.3c.6 3.5 3.1 6 6.6 6.9l1.6-1.7 1.2 1.4c-.1 2.4-2.3 2.4-4.2 1.6-3.2-1.4-5.2-3.6-6.1-6.4-.4-1.4-.1-2.6.9-3.1l1.1 1.3-1.1 0Z"/></>
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export default function Storefront() {
  const [products, setProducts] = useState<Product[]>(LIVE ? [] : initialProducts);
  const [settings, setSettings] = useState<SiteSettings>(site);
  const [loadError, setLoadError] = useState('');
  const [category, setCategory] = useState<string>('Tümü');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [selected, setSelected] = useState<Product|null>(null);
  const [variantIdx, setVariantIdx] = useState(0);
  const [chosenExtras, setChosenExtras] = useState<string[]>([]);
  const [configQty, setConfigQty] = useState(1);
  const [configError,setConfigError] = useState('');
  const [messagePreview,setMessagePreview] = useState('');
  const [delivery, setDelivery] = useState<Delivery>('delivery');
  const [customer, setCustomer] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [copyResult, setCopyResult] = useState('');

  useEffect(() => {
    if (LIVE) {
      let stopped = false;
      const load = async () => {
        try {
          const r=await fetch('/api/public/data',{cache:'no-store'});
          if(!r.ok) throw new Error('Menü şu anda yüklenemiyor. Lütfen biraz sonra tekrar deneyin.');
          const data=await r.json();
          if(!stopped){setProducts(Array.isArray(data.products)?data.products:[]);if(data.settings)setSettings(data.settings);setLoadError('');}
        } catch(e) {if(!stopped) setLoadError(e instanceof Error?e.message:'Menü yüklenemedi.');}
      };
      void load();
      const id=window.setInterval(load,60000);
      return ()=>{stopped=true;window.clearInterval(id);};
    }
    const sync = () => {setProducts(readDemoProducts());setSettings(readDemoSettings());};
    sync();
    window.addEventListener('storage',sync);
    window.addEventListener(CHANGE_EVENT,sync);
    window.addEventListener(SITE_CHANGED,sync);
    return () => {window.removeEventListener('storage',sync);window.removeEventListener(CHANGE_EVENT,sync);window.removeEventListener(SITE_CHANGED,sync);};
  }, []);

  useEffect(() => {
    const handle = (event: KeyboardEvent) => { if (event.key === 'Escape') {setCartOpen(false);setSelected(null);setMobileNav(false);} };
    window.addEventListener('keydown',handle);
    return () => window.removeEventListener('keydown',handle);
  }, []);

  // Erişilebilir diyalog: odağı içeride tut, arkaya kaydırmayı engelle, kapatınca odağı geri ver.
  const dialogIsOpen = Boolean(selected || cartOpen);
  useEffect(() => {
    if (!dialogIsOpen) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = document.querySelector<HTMLElement>(selected ? '.config-modal' : '.cart-panel');
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () => [...dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )].filter(el => el.getClientRects().length > 0);
    focusable()[0]?.focus();
    const trapTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const controls = focusable();
      if (!controls.length) {event.preventDefault(); dialog.focus(); return;}
      const first = controls[0], last = controls[controls.length-1];
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();first.focus();
      }
    };
    document.addEventListener('keydown',trapTab);
    return () => {document.removeEventListener('keydown',trapTab);document.body.style.overflow = previousOverflow;previous?.focus();};
  }, [dialogIsOpen, Boolean(selected)]);

  const categories = useMemo(()=>['Tümü',...(settings.categories?.length?settings.categories:Array.from(new Set(products.map(p=>p.category))))], [settings.categories,products]);
  useEffect(()=>{if(!categories.includes(category))setCategory('Tümü');},[category,categories]);
  const visible = useMemo(() => products.filter(p => p.available &&
    (category === 'Tümü' || p.category === category) &&
    `${p.name} ${p.description}`.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR'))),
    [products,category,search]);
  const total = totals(cart).subtotal;
  const configuredUnitPrice = selected ? (selected.variants?.[variantIdx]?.price ?? selected.price) + (selected.extras??[]).filter(item=>chosenExtras.includes(item.label)).reduce((sum,item)=>sum+item.price,0) : 0;

  useEffect(()=>{setMessagePreview('');setCopyResult('');},[cart,delivery,customer,address,note]);
  useEffect(()=>{if(!settings.deliveryAvailable && settings.pickupAvailable)setDelivery('pickup');else if(!settings.pickupAvailable && settings.deliveryAvailable)setDelivery('delivery');},[settings.deliveryAvailable,settings.pickupAvailable]);

  function openConfigurator(product:Product) {
    setSelected(product); setVariantIdx(0);setChosenExtras([]);setConfigQty(1);setConfigError('');
  }
  function addToCart(product:Product,variantIndex=0,extras:string[]=[],quantity=1) {
    try {
      const line=buildCartLine(product,{variantIndex,extraLabels:extras,quantity});
      setCart(current=>addLine(current,line));
      setSelected(null);setConfigError('');setCartOpen(true);
    } catch(e) {setConfigError(e instanceof Error?e.message:'Ürün eklenemedi.');}
  }
  function quantityChange(key:string,delta:number) {
    setCart(current=>changeQuantity(current,key,delta));
  }
  function makeMessage() {
    // Canlı menüde değişmiş fiyat veya satış dışı ürünler için son kontrol.
    const updated=refreshCart(cart,products);
    if(updated.removed || updated.priceChanged){
      setCart(updated.lines);
      setError(updated.removed ? 'Bazı ürünler artık satışta değil; sepet güncellendi. Lütfen tekrar kontrol edin.' : 'Ürün fiyatları güncellendi; lütfen sepet toplamını kontrol edip yeniden deneyin.');
      return null;
    }
    const problem=validateCheckout({cart,customer,address,delivery,settings,requireWhatsapp:LIVE});
    if(problem){setError(problem);setMessagePreview('');return null;}
    setError('');
    return orderMessage({cart,customer,address,note,delivery});
  }
  function sendWhatsApp() {
    const message=makeMessage();if(!message)return;
    if(!LIVE) {setMessagePreview(message);setCopyResult('');return;}
    try {
      const tab=window.open(whatsAppLink(settings.whatsappNumber,message),'_blank','noopener,noreferrer');
      // Bazı tarayıcılar noopener nedeniyle null döndürür; bu tek başına hata değildir.
      void tab;
      setCopyResult('WhatsApp açıldıysa mesajı kontrol edip kendiniz gönderin. Mesaj otomatik gönderilmez.');
    }catch(e){setError(e instanceof Error?e.message:'WhatsApp bağlantısı açılamadı.');}
  }
  async function copyMessage() {
    const message=makeMessage();if(!message)return;
    setMessagePreview(message);
    try {await navigator.clipboard.writeText(message);setCopyResult('Sipariş metni kopyalandı.');}
    catch {setCopyResult('Kopyalama izni verilemedi. Mesajı aşağıdaki kutudan seçerek kopyalayabilirsiniz.');}
  }

  return <>
    <div className="announcement"><span className="announcement-dot"/> {settings.name} · Sıcacık lezzetler <span className="announcement-separator">✦</span> <strong>{LIVE ? "Online menümüz" : "SATIŞ DEMOSU · Gerçek sipariş alınmaz"}</strong></div>
    <header className="topbar">
      <div className="container topbar-inner">
        <a className="brand" href="#anasayfa" aria-label={`${settings.name} ana sayfa`}>
          <span className="brand-mark">{brandInitials(settings.name).slice(0,1)}<span>{brandInitials(settings.name).slice(1)}</span></span>
          <span className="brand-text">{settings.name.toLocaleUpperCase('tr-TR')} <small>{brandSubtitle(settings.name)}</small></span>
        </a>
        <nav id="site-navigation" className={mobileNav?'nav-links nav-visible':'nav-links'} aria-label="Ana menü">
          <a href="#anasayfa" onClick={()=>setMobileNav(false)}>Ana Sayfa</a>
          <a href="#menu" onClick={()=>setMobileNav(false)}>Menümüz</a>
          <a href="#nedenbiz" onClick={()=>setMobileNav(false)}>Hikâyemiz</a>
          <a href="#iletisim" onClick={()=>setMobileNav(false)}>İletişim</a>
        </nav>
        <div className="header-actions">
          <a className="outline-button desktop-cta" href="#menu">Menüyü keşfet <Icon name="arrow" size={17}/></a>
          <button className="cart-pill" type="button" onClick={()=>setCartOpen(true)} aria-label={`Sepeti aç, ${cartQuantity(cart)} ürün`}><Icon name="bag" size={19}/><span>Sepetim</span><b>{cartQuantity(cart)}</b></button>
          <button className="mobile-menu" aria-label={mobileNav?"Menüyü kapat":"Menüyü aç"} aria-expanded={mobileNav} aria-controls="site-navigation" type="button" onClick={()=>setMobileNav(v=>!v)}><Icon name={mobileNav?'close':'menu'}/></button>
        </div>
      </div>
    </header>

    <main id="anasayfa">
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-line"/> GELENEKSEL LEZZET, MODERN SİPARİŞ</div>
            <h1>Lezzetin en güzel<br/>hali, <em>{settings.name}.</em></h1>
            <p className="hero-lead">{settings.tagline} Özenle hazırlanan lezzetleri incele, üye olmadan kolayca sipariş mesajını oluştur.</p>
            <div className="hero-buttons"><a href="#menu" className="primary-button">Menüyü İncele <Icon name="arrow" size={19}/></a><a href="#nedenbiz" className="link-button">Bizi tanıyın <span>↗</span></a></div>
            <div className="hero-notes"><div className="note-icon"><Icon name="check" size={16}/></div><span>Üyelik yok, uğraş yok</span><i/> <div className="note-icon"><Icon name="check" size={16}/></div><span>WhatsApp'tan kolay sipariş</span></div>
          </div>
          <div className="hero-visual">
            <div className="hero-orbit" aria-hidden="true"/>
            <img src={publicUrl("/images/hero-pide.svg")} alt="Taş fırından taze pide ve lahmacun illüstrasyonu" className="hero-image" width="650" height="540" loading="eager" decoding="async" fetchPriority="high"/>
            <div className="hero-sticker"><span>✦</span><b>USTA İŞİ</b><small>HER LOKMADA</small></div>
            <div className="hero-floating"><span className="flame">♨</span><span><strong>Taş fırın lezzeti</strong><small>Özenle hazırlanan yemekler</small></span></div>
          </div>
        </div>
        <div className="hero-bottom-line"/>
      </section>

      <section className="feature-strip" aria-label="Özellikler"><div className="container feature-strip-inner">
        <div><span className="feature-symbol">✦</span> Özenle hazırlanan lezzetler</div><span className="feature-divider"/>
        <div><span className="feature-symbol">♨</span> Taş fırında pişirilir</div><span className="feature-divider"/>
        <div><span className="feature-symbol">♡</span> Mahalle sıcaklığında hizmet</div>
      </div></section>

      <section className="menu-section" id="menu"><div className="container">
        <div className="section-heading-row"><div><p className="overline">LEZZET DOLU BİR MENÜ</p><h2>Ne yesek <em>bugün?</em></h2><p className="section-subtitle">Canınız ne çekiyorsa, ustamızın elinden taptaze.</p></div><div className="section-side-note">{LIVE ? 'Güncel işletme fiyatları ve ürünleri' : 'Menüdeki fiyatlar örnektir.'}<br/>{LIVE ? 'Siparişinizi WhatsApp üzerinden onaylatın.' : 'Gerçek işletme fiyatlarıyla değiştirilecek.'}</div></div>
        <div className="menu-controls"><div className="filters" role="group" aria-label="Ürün kategorileri">{categories.map(cat=><button key={cat} type="button" aria-pressed={category===cat} className={category===cat?'filter selected':'filter'} onClick={()=>setCategory(cat)}>{cat}</button>)}</div><label className="search-box"><Icon name="search" size={18}/><input type="search" placeholder="Lezzet ara..." aria-label="Menüde ara" value={search} onChange={e=>setSearch(e.target.value)}/></label></div>
        {loadError&&<div className="empty-products" role="alert">{loadError}</div>}<div className="products-grid" aria-live="polite">{visible.map(p=><article className="product-card" key={p.id}><div className="product-image-wrap"><img src={publicUrl(p.image)} alt={p.name} loading="lazy" decoding="async" width="500" height="350"/>{p.badge&&<span className="product-badge">✦ {p.badge}</span>}</div><div className="product-info"><div className="product-category">{p.category}</div><h3>{p.name}</h3><p>{p.description}</p><div className="product-footer"><div className="product-price">{money(p.variants?.[0]?.price??p.price)}<small>{p.variants?.length?'başlangıç fiyatı':'/ adet'}</small></div><button type="button" className="add-button" onClick={()=>p.variants?.length||p.extras?.length?openConfigurator(p):addToCart(p)} aria-label={`${p.name} sepete ekle`}><Icon name="plus" size={19}/> <span>Ekle</span></button></div></div></article>)}</div>
        {visible.length===0&&<div className="empty-products">{loadError?'':'Bu kategoride ürün bulunamadı. Başka bir kelime deneyin.'}</div>}
      </div></section>

      <section className="how-section" id="nedenbiz"><div className="container how-grid"><div><p className="overline">SİPARİŞ VERMENİN EN KOLAY HALİ</p><h2>Üç adımda <em>sofranızda.</em></h2><p>Ne uygulama indirmeniz ne de üye olmanız gerekiyor. Lezzeti seçin, gerisini bize bırakın.</p><a className="text-link" href="#menu">Şimdi sipariş oluştur <Icon name="arrow" size={18}/></a></div><div className="how-steps"><div className="how-step"><span>01</span><div><h3>Lezzetini seç</h3><p>Menüden dilediğin ürünleri sepete ekle.</p></div></div><div className="how-step"><span>02</span><div><h3>Sepetini hazırla</h3><p>Adetleri belirle, teslimat bilgilerini yaz.</p></div></div><div className="how-step"><span>03</span><div><h3>WhatsApp'tan gönder</h3><p>Hazır mesajını işletmeye ilet, onayını bekle.</p></div></div></div></div></section>

      <section className="cta-section"><div className="container"><div className="cta-panel"><div><p className="overline">CANINIZ PİDE Mİ ÇEKTİ?</p><h2>Bir mesajla<br/><em>sipariş verin.</em></h2><p>Sepetinizi hazırlayın, WhatsApp üzerinden bizimle iletişime geçin.</p><button className="white-button" type="button" onClick={()=>setCartOpen(true)}>Sepetimi aç <Icon name="arrow" size={19}/></button></div><img src={publicUrl("/images/lahmacun.svg")} alt="Çıtır lahmacun" width="420" height="340" loading="lazy" decoding="async"/></div></div></section>
    </main>

    <footer id="iletisim" className="site-footer"><div className="container footer-main"><div><a className="brand brand-footer" href="#anasayfa"><span className="brand-mark">{brandInitials(settings.name).slice(0,1)}<span>{brandInitials(settings.name).slice(1)}</span></span><span className="brand-text">{settings.name.toLocaleUpperCase('tr-TR')} <small>{brandSubtitle(settings.name)}</small></span></a><p>{settings.tagline}</p>{!LIVE&&<div className="demo-disclaimer">SATIŞ DEMOSU · Gerçek işletme bilgisi veya sipariş hattı değildir.</div>}</div><div><h4>Hızlı bağlantılar</h4><a href="#anasayfa">Ana sayfa</a><a href="#menu">Menümüz</a><a href="#nedenbiz">Nasıl sipariş verilir?</a></div><div><h4>İletişim bilgileri</h4><span><Icon name="map" size={18}/> {settings.address}</span><span><Icon name="clock" size={18}/> {settings.hours}</span><span>WhatsApp: <strong>{settings.phoneDisplay}</strong></span></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} {settings.name}{LIVE?'':' · Örnek site şablonu.'}</span><a href={publicUrl("/panel/")}>{LIVE?'İşletmeci girişi':'İşletmeci paneli demosu'} ↗</a></div></footer>

    <button type="button" className="floating-cart" onClick={()=>setCartOpen(true)} aria-label="Sepeti aç"><Icon name="bag" size={23}/>{cartQuantity(cart)>0&&<span>{cartQuantity(cart)}</span>}</button>

    {selected && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null);}}>
      <div className="config-modal" tabIndex={-1} role="dialog" aria-modal="true" aria-label={`${selected.name} seçenekleri`}>
        <button type="button" className="close-icon" onClick={()=>setSelected(null)} aria-label="Ürün seçeneklerini kapat"><Icon name="close"/></button>
        <div className="config-head"><img src={publicUrl(selected.image)} alt=""/><div><p className="overline">SİPARİŞİ KİŞİSELLEŞTİR</p><h3>{selected.name}</h3><p>{selected.description}</p></div></div>
        {!!selected.variants?.length && <fieldset className="choices"><legend>Porsiyon / boy seçimi</legend>{selected.variants.map((variant,i)=><label key={`${i}-${variant.label}`} className="choice-row"><input name="variant" type="radio" checked={variantIdx===i} onChange={()=>setVariantIdx(i)}/><span>{variant.label}</span><strong>{money(variant.price)}</strong></label>)}</fieldset>}
        {!!selected.extras?.length && <fieldset className="choices"><legend>Ek malzemeler ve tercihlerin</legend><p className="option-helper">Birden fazla tercih seçebilirsiniz. Ücretsiz seçenekler toplama eklenmez.</p>{selected.extras.map((extra,i)=><label key={`${i}-${extra.label}`} className="choice-row"><input type="checkbox" checked={chosenExtras.includes(extra.label)} onChange={e=>setChosenExtras(current=>e.target.checked?[...current,extra.label]:current.filter(label=>label!==extra.label))}/><span>{extra.label}</span><strong>{extra.price?`+${money(extra.price)}`:'Ücretsiz'}</strong></label>)}</fieldset>}
        <div className="config-bottom"><div><b>Adet</b><span className="option-helper">En fazla {MAX_LINE_QUANTITY} adet</span></div><div className="qty-control quantity-large"><button type="button" aria-label="Ürün adetini azalt" disabled={configQty<=1} onClick={()=>setConfigQty(count=>Math.max(1,count-1))}><Icon name="minus" size={17}/></button><span>{configQty}</span><button type="button" aria-label="Ürün adetini artır" disabled={configQty>=MAX_LINE_QUANTITY} onClick={()=>setConfigQty(count=>Math.min(MAX_LINE_QUANTITY,count+1))}><Icon name="plus" size={17}/></button></div></div>
        <div className="option-summary"><span>Birim fiyat: {money(configuredUnitPrice)}</span><strong>Toplam: {money(configuredUnitPrice*configQty)}</strong></div>
        {configError && <p className="form-error" role="alert">{configError}</p>}
        <button type="button" className="primary-button full-button" onClick={()=>addToCart(selected,variantIdx,chosenExtras,configQty)}><Icon name="bag"/> Sepete ekle · {money(configuredUnitPrice*configQty)}</button>
      </div>
    </div>}

    {cartOpen && <div className="modal-backdrop cart-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setCartOpen(false);}}>
      <aside className="cart-panel" tabIndex={-1} role="dialog" aria-modal="true" aria-label="Sepetim">
        <div className="cart-header"><div><p className="overline">SİPARİŞİNİZİ HAZIRLAYIN</p><h2>Sepetim <span>({cartQuantity(cart)})</span></h2></div><button className="close-icon" aria-label="Sepeti kapat" type="button" onClick={()=>setCartOpen(false)}><Icon name="close"/></button></div>
        <div className="cart-scroll">
          {cart.length===0?<div className="cart-empty"><div>🛍️</div><h3>Sepetiniz henüz boş</h3><p>Menüden lezzetleri seçerek başlayın.</p><button className="outline-button" type="button" onClick={()=>setCartOpen(false)}>Menüye dön</button></div>:<>
            <div className="cart-lines">{cart.map(line=><div className="cart-line" key={line.key}><div className="cart-line-main"><h4>{line.name}</h4>{line.options&&<p>{line.options}</p>}<small>{money(line.unitPrice)} / adet</small><b>{money(line.unitPrice*line.quantity)}</b></div><div className="cart-line-controls"><div className="qty-control"><button type="button" aria-label={`${line.name} adetini azalt`} onClick={()=>quantityChange(line.key,-1)}><Icon name="minus" size={16}/></button><span>{line.quantity}</span><button type="button" aria-label={`${line.name} adetini artır`} disabled={line.quantity>=MAX_LINE_QUANTITY} onClick={()=>quantityChange(line.key,1)}><Icon name="plus" size={16}/></button></div><button type="button" className="line-remove" aria-label={`${line.name} ürününü sepetten kaldır`} onClick={()=>setCart(current=>current.filter(item=>item.key!==line.key))}>Kaldır</button></div></div>)}</div>
            <div className="checkout-fields"><h3>Teslimat bilgileri</h3><div className="delivery-switch"><button disabled={!settings.deliveryAvailable} type="button" aria-pressed={delivery==='delivery'} className={delivery==='delivery'?'active':''} onClick={()=>{setDelivery('delivery');setError('');}}>🚲 Paket servis</button><button disabled={!settings.pickupAvailable} type="button" aria-pressed={delivery==='pickup'} className={delivery==='pickup'?'active':''} onClick={()=>{setDelivery('pickup');setError('');}}>🏪 Gel-al</button></div><label>Adınız <span>*</span><input type="text" maxLength={80} value={customer} onChange={e=>{setCustomer(e.target.value);setError('');}} placeholder="Adınızı yazın" autoComplete="name"/></label>{delivery==='delivery'&&<label>Teslimat adresi <span>*</span><textarea rows={2} maxLength={400} value={address} onChange={e=>{setAddress(e.target.value);setError('');}} placeholder="Mahalle, sokak, bina, daire..." autoComplete="street-address"/></label>}<label>Sipariş notu <small>(isteğe bağlı)</small><textarea rows={2} maxLength={300} value={note} onChange={e=>{setNote(e.target.value);setError('');}} placeholder="Kapı zili, özel istekler..."/></label></div>
          </>}
        </div>
        <div className="cart-checkout"><div className="cart-total"><span>Ürün toplamı</span><strong>{money(total)}</strong></div><p className="cart-hint">Varsa servis ücreti işletme tarafından bildirilir. WhatsApp'ta <b>mesajı sen göndermeden</b> sipariş oluşmaz.</p>
        {!LIVE&&<p className="warning-inline">⚠ SATIŞ DEMOSU: Gerçek işletme hattına mesaj gönderilmez. Hazır metni görüntüleyebilir ve kopyalayabilirsiniz.</p>}
        {LIVE&&!settings.whatsappNumber&&<p className="warning-inline">⚠ WhatsApp sipariş hattı henüz ayarlanmamış.</p>}
        {error&&<p className="form-error" role="alert">{error}</p>}
        {copyResult&&<p className="copy-success" role="status">{copyResult}</p>}
        {messagePreview&&<div className="message-preview" role="status"><strong>Hazırlanan sipariş mesajı</strong><pre>{messagePreview}</pre></div>}
        <button type="button" className="whatsapp-button" disabled={cart.length===0 || !settings.orderingEnabled} onClick={sendWhatsApp}><Icon name="whatsapp" size={21}/>{settings.orderingEnabled?(LIVE?'WhatsApp mesajını hazırla':'Sipariş mesajını önizle'):'Sipariş alımı kapalı'} <Icon name="arrow" size={17}/></button>
        <button type="button" className="copy-button" disabled={cart.length===0} onClick={copyMessage}>Sipariş metnini kopyala</button>
        </div>
      </aside>
    </div>}

  </>;
}
