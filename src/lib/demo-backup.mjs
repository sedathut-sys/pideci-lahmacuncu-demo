import {validateCategories} from './admin-core.mjs';
import {validateProductPricing} from './price-rules.mjs';
const MAX_BACKUP_BYTES=12*1024*1024;
const isText=(v,max)=>typeof v==='string' && v.length<=max;
const validImage=v=>isText(v,650000) && (/^\/images\/[a-z0-9-]+\.svg$/.test(v) || /^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(v));
function parseBackupObject(data){
  if(!data || typeof data!=='object' || Array.isArray(data) || data.version!==3)throw new Error('Desteklenmeyen demo yedeği. Sürüm 3 dosyası seçin.');
  const settings=data.settings;
  if(!settings || typeof settings!=='object' || Array.isArray(settings))throw new Error('İşletme ayarları bulunamadı.');
  const categories=validateCategories(settings.categories);
  for(const field of ['name','tagline','address','hours','phoneDisplay','whatsappNumber','notice'])
    if(!isText(settings[field],field==='notice'?150:500))throw new Error('Yedekte işletme bilgileri geçersiz.');
  for(const field of ['deliveryAvailable','pickupAvailable','orderingEnabled'])
    if(typeof settings[field]!=='boolean')throw new Error('Yedekte teslimat ayarları geçersiz.');
  if(typeof settings.minimumOrder!=='number' || !Number.isFinite(settings.minimumOrder)||settings.minimumOrder<0||settings.minimumOrder>1000000)throw new Error('Minimum sipariş fiyatı geçersiz.');
  const products=data.products;
  if(!Array.isArray(products)||products.length>200)throw new Error('Yedekte ürün sayısı geçersiz.');
  const ids=new Set();
  const normalized=products.map(p=>{
    if(!p || typeof p!=='object'||Array.isArray(p)|| !isText(p.id,150)||!p.id ||
      !isText(p.name,80)||p.name.trim().length<2||!isText(p.description,300)||!isText(p.category,36)||
      !categories.includes(p.category)||!validImage(p.image)||typeof p.available!=='boolean'||
      (p.badge!==undefined && !isText(p.badge,35)))
      throw new Error('Yedekte geçersiz ürün veya görsel var.');
    if(ids.has(p.id))throw new Error('Yedekte tekrarlanan ürün kimliği var.');
    ids.add(p.id);
    for(const key of ['variants','extras']) {
      const entries=p[key]??[];
      if(!Array.isArray(entries)||entries.length>30)throw new Error('Yedekte seçenek sayısı geçersiz.');
      const seen=new Set();
      for(const option of entries){
        if(!option||!isText(option.label,80)||!option.label.trim())throw new Error('Yedekte boş seçenek adı var.');
        const k=option.label.trim().toLocaleLowerCase('tr-TR');
        if(seen.has(k))throw new Error('Yedekte aynı seçenek iki kez var.');
        seen.add(k);
      }
    }
    validateProductPricing(p);
    return {
      id:p.id,name:p.name,description:p.description,category:p.category,price:p.price,
      image:p.image,available:p.available,badge:p.badge||'',
      variants:(p.variants||[]).map(v=>({label:v.label,price:v.price})),
      extras:(p.extras||[]).map(e=>({label:e.label,price:e.price}))
    };
  });
  return {products:normalized,settings:{name:settings.name,tagline:settings.tagline,address:settings.address,
    hours:settings.hours,phoneDisplay:settings.phoneDisplay,whatsappNumber:settings.whatsappNumber,
    deliveryAvailable:settings.deliveryAvailable,pickupAvailable:settings.pickupAvailable,
    minimumOrder:settings.minimumOrder,orderingEnabled:settings.orderingEnabled,
    notice:settings.notice,categories}};
}
export function parseDemoBackupJson(json){
 if(typeof json!=='string'||new TextEncoder().encode(json).length>MAX_BACKUP_BYTES)throw new Error('Yedek dosyası en fazla 12 MB olabilir.');
 let data;try{data=JSON.parse(json);}catch{throw new Error('Geçerli JSON yedeği seçin.');}
 return parseBackupObject(data);
}
