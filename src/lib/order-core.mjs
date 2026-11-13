/** Sipariş matematiğinin tek kaynağı. Tarayıcı, demo önizlemesi ve Node testleri kullanır. */
export const MAX_LINE_QUANTITY = 50;
export const money = amount => new Intl.NumberFormat('tr-TR', {style:'currency', currency:'TRY'}).format(amount);
const kurus = value => Math.round(value * 100);
const positivePrice = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1000000;
const normalize = (text, max) => String(text ?? '').replace(/\s+/g,' ').trim().slice(0, max);
export const isValidWhatsApp = number => typeof number === 'string' && /^[1-9]\d{9,14}$/.test(number);

export function buildCartLine(product, {variantIndex=0, extraLabels=[], quantity=1}={}) {
  if (!product || !product.available) throw new Error('Bu ürün şu anda satışta değil.');
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_LINE_QUANTITY) throw new Error(`Adet 1–${MAX_LINE_QUANTITY} arasında olmalıdır.`);
  if (!Number.isInteger(variantIndex) || variantIndex < 0) throw new Error('Geçersiz porsiyon seçimi.');
  if (!Array.isArray(extraLabels) || !extraLabels.every(label=>typeof label==='string')) throw new Error('Geçersiz ek malzeme.');
  const variants = product.variants ?? [];
  if (variants.length === 0 && variantIndex !== 0 || variants.length > 0 && variantIndex >= variants.length) throw new Error('Porsiyon bulunamadı.');
  const variant = variants.length ? variants[variantIndex] : null;
  const configuredExtras = product.extras ?? [];
  if (new Set(extraLabels).size !== extraLabels.length || extraLabels.some(label=>!configuredExtras.some(item=>item.label===label))) throw new Error('Geçersiz ek malzeme seçimi.');
  const extras = configuredExtras.filter(item=>extraLabels.includes(item.label));
  const basePrice = variant ? variant.price : product.price;
  if (![basePrice,...extras.map(item=>item.price)].every(positivePrice)) throw new Error('Ürün fiyatı geçersiz.');
  const unitPriceKurus = kurus(basePrice) + extras.reduce((sum,item)=>sum+kurus(item.price),0);
  const optionLabels = [variant?.label, ...extras.map(item=>item.label)].filter(Boolean);
  const key = JSON.stringify([product.id,variant?.label ?? null,extras.map(x=>x.label).sort()]);
  return {key,productId:product.id,name:product.name,options:optionLabels.join(' · '),variantLabel:variant?.label??null,extraLabels:extras.map(item=>item.label),unitPrice:unitPriceKurus/100,quantity};
}
export function addLine(cart,line) {
  const existing = cart.find(x=>x.key===line.key);
  if (existing && existing.quantity+line.quantity > MAX_LINE_QUANTITY) throw new Error(`Bir ürün seçeneğinden en çok ${MAX_LINE_QUANTITY} adet ekleyebilirsiniz.`);
  return existing ? cart.map(x=>x.key===line.key?{...x,quantity:x.quantity+line.quantity}:x) : [...cart,line];
}
export function changeQuantity(cart,key,change) {
  if (!Number.isInteger(change)) throw new Error('Adet değişikliği geçersiz.');
  return cart.map(x=>x.key===key?{...x,quantity:Math.min(MAX_LINE_QUANTITY,Math.max(0,x.quantity+change))}:x).filter(x=>x.quantity>0);
}
export function totals(cart) {
  const totalKurus=cart.reduce((sum,line)=>sum+kurus(line.unitPrice)*line.quantity,0);
  return {quantity:cart.reduce((sum,line)=>sum+line.quantity,0),subtotal:totalKurus/100};
}
export function refreshCart(cart,products) {
  let removed=0, priceChanged=false;
  const lines=[];
  for(const old of cart){
    const product=products.find(p=>p.id===old.productId);
    try {
      const variantIndex=old.variantLabel==null ? 0 : (product?.variants??[]).findIndex(v=>v.label===old.variantLabel);
      const updated=buildCartLine(product,{variantIndex,extraLabels:old.extraLabels,quantity:old.quantity});
      if(updated.unitPrice!==old.unitPrice || updated.name!==old.name) priceChanged=true;
      lines.push(updated);
    } catch {removed+=old.quantity;}
  }
  return {lines,removed,priceChanged};
}
export function validateCheckout({cart,customer,address,delivery,settings,requireWhatsapp=false}) {
  if(!cart.length) return 'Önce sepetinize ürün ekleyin.';
  if(!settings.orderingEnabled) return 'İşletme şu anda yeni sipariş almıyor.';
  if(delivery!=='delivery' && delivery!=='pickup') return 'Geçerli bir teslimat türü seçin.';
  if(delivery==='delivery' && !settings.deliveryAvailable || delivery==='pickup' && !settings.pickupAvailable) return 'Seçtiğiniz teslimat türü şu anda kullanılamıyor.';
  if(normalize(customer,80).length<2) return 'Sipariş için adınızı girin (en az 2 karakter).';
  if(delivery==='delivery' && normalize(address,400).length<8) return 'Paket servis için açık teslimat adresini yazın (en az 8 karakter).';
  if(totals(cart).subtotal < (Number(settings.minimumOrder)||0)) return `Minimum sipariş tutarı ${money(Number(settings.minimumOrder)||0)}.`;
  if(requireWhatsapp && !isValidWhatsApp(settings.whatsappNumber)) return 'Geçerli işletme WhatsApp numarası tanımlanmamış.';
  return '';
}
export function orderMessage({cart,customer,address,note='',delivery}) {
  const rows=cart.map(line=>`• ${line.quantity} × ${line.name}${line.options?` (${line.options})`:''} — ${money(line.unitPrice)} / adet = ${money(line.unitPrice*line.quantity)}`);
  return [
    'Merhaba, sipariş oluşturmak istiyorum.', '',
    ...rows,'',`*Ürün toplamı: ${money(totals(cart).subtotal)}*`,
    'Varsa teslimat ücreti ayrıca bildirilecektir.','',
    `Teslimat türü: ${delivery==='delivery'?'Paket servis':'Gel-al'}`,
    `Ad: ${normalize(customer,80)}`,
    ...(delivery==='delivery'?[`Adres: ${normalize(address,400)}`]:[]),
    ...(normalize(note,300)?[`Sipariş notu: ${normalize(note,300)}`]:[]),
    '', 'Siparişin uygunluğunu ve toplam tutarı onaylar mısınız?'
  ].join('\n');
}
export function whatsAppLink(phone,message) {
  if(!isValidWhatsApp(phone)) throw new Error('Geçerli WhatsApp numarası gerekli.');
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
