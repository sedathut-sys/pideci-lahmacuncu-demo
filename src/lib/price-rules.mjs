/** Vitrin ve yönetici formu aynı fiyat sınırlarını uygular. */
export const MAX_UNIT_PRICE = 1000000;
export const isValidUnitPrice = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= MAX_UNIT_PRICE && Math.round(value * 100) / 100 === value;
export const formatAdminPrice = value => new Intl.NumberFormat('tr-TR', {style:'currency', currency:'TRY', minimumFractionDigits:0, maximumFractionDigits:2}).format(value);
export function normalizePriceInput(value) {
  const text=String(value ?? '').trim();
  return text.replace(/^0+(?=\d)/,'');
}
export function parsePriceDraft(text) {
  const value=normalizePriceInput(text);
  if(!/^\d+(?:[.,]\d{0,2})?$/.test(value))return Number.NaN;
  const parsed=Number(value.replace(',','.'));
  return isValidUnitPrice(parsed) ? parsed : Number.NaN;
}
export function validateProductPricing(product) {
  if(!isValidUnitPrice(product.price))throw new Error('Satış fiyatı 0–1.000.000 TL arasında, en fazla iki kuruş basamağıyla girilmelidir.');
  for(const [items,label] of [[product.variants||[],'Porsiyon'],[product.extras||[],'Ek malzeme']]) {
    if(!Array.isArray(items))throw new Error(`${label} seçenekleri geçersiz.`);
    for(const option of items)if(!isValidUnitPrice(option.price))throw new Error(`${label} fiyatını kontrol edin: en fazla 1.000.000 TL ve iki ondalık basamak kullanılabilir.`);
  }
  return true;
}
