/** Menüde görünen başlangıç fiyatı ile ilk porsiyonun tek fiyat kaynağı. */
export function displayedPrice(product) {
  return product.variants?.length ? product.variants[0].price : product.price;
}
export function withDisplayedPrice(product, price) {
  const next = {...product, price};
  if(product.variants?.length) next.variants=product.variants.map((v,i)=>i===0?{...v,price}:{...v});
  return next;
}
export function syncDisplayPrice(product) {
  return {...product,price:displayedPrice(product)};
}
export function addVariant(product) {
  if(!product.variants?.length) return {...product,variants:[{label:'Standart',price:product.price}]};
  return {...product,variants:[...product.variants,{label:'',price:product.price}]};
}
export function removeVariant(product,index) {
  const variants=(product.variants||[]).filter((_,i)=>i!==index);
  return syncDisplayPrice({...product,variants});
}

/** Sayı alanındaki 0150 / 000.5 gibi baştaki gereksiz sıfırları temizler. */
export function normalizePriceInput(value) {
  return String(value).replace(/^0+(?=\d)/, '');
}
