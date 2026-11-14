export type ProductVariant = { label: string; price: number };
export type ProductExtra = { label: string; price: number };

export type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image: string;
  badge?: string;
  available: boolean;
  variants?: ProductVariant[];
  extras?: ProductExtra[];
};

export const STORAGE_KEY = 'tas-firin:pideci-lahmacuncu-demo:products:v2';
const LEGACY_STORAGE_KEY = 'mahalle-pide-products-demo-v1';
const canMigrateLegacy = () => typeof window !== 'undefined' && window.location.hostname === 'sedathut-sys.github.io' && window.location.pathname.startsWith('/pideci-lahmacuncu-demo/');
export const CHANGE_EVENT = 'mahalle-pide-products-changed';

// Tüm fiyatlar ve ürünler DEMODUR; gerçek menüye göre değiştirilmelidir.
export const initialProducts: Product[] = [
  {
    id: 'pide-kiymali', name: 'Kıymalı Pide', category: 'Pide',
    description: 'İncecik hamur, bol baharatlı kıyma ve taş fırın lezzeti.',
    price: 215, image: '/images/pide-kiymali.svg', badge: 'Çok sevilen', available: true,
    variants: [{label:'Standart',price:215},{label:'1,5 porsiyon',price:310}],
    extras: [{label:'Ekstra kaşar',price:35},{label:'Yumurta',price:25}],
  },
  {
    id: 'lahmacun', name: 'Antep Usulü Lahmacun', category: 'Lahmacun',
    description: 'İnce çıtır hamur, dengeli baharat ve bol yeşillik.',
    price: 115, image: '/images/lahmacun.svg', badge: 'Favori', available: true,
    extras: [{label:'Ekstra yeşillik',price:0},{label:'Acılı',price:0}],
  },
  {
    id: 'pide-kasarli', name: 'Kaşarlı Pide', category: 'Pide',
    description: 'Uzayan kaşar peyniriyle fırından yeni çıkmış lezzet.',
    price: 205, image: '/images/pide-kasarli.svg', available: true,
    variants: [{label:'Standart',price:205},{label:'1,5 porsiyon',price:295}],
  },
  {
    id: 'pide-karisik', name: 'Karışık Pide', category: 'Pide',
    description: 'Sucuk, kaşar, kavurma ve sebzelerin nefis uyumu.',
    price: 285, image: '/images/pide-karisik.svg', badge: 'Ustanın seçimi', available: true,
    extras: [{label:'Ekstra kaşar',price:35},{label:'Yumurta',price:25}],
  },
  {
    id: 'salata', name: 'Çoban Salata', category: 'Yan Ürün',
    description: 'Mevsimin taze sebzeleri, limon ve zeytinyağı.',
    price: 95, image: '/images/salata.svg', available: true,
  },
  {
    id: 'kunefe', name: 'Künefe', category: 'Yan Ürün',
    description: 'Çıtır kadayıf, erimiş peynir ve tam kararında şerbet.',
    price: 160, image: '/images/kunefe.svg', available: true,
  },
  {
    id: 'ayran', name: 'Ayran', category: 'İçecek',
    description: 'Soğuk, ferahlatıcı ve yemeklerin vazgeçilmezi.',
    price: 40, image: '/images/ayran.svg', available: true,
  },
  {
    id: 'soda', name: 'Maden Suyu', category: 'İçecek',
    description: 'Serinleten sade maden suyu.',
    price: 35, image: '/images/soda.svg', available: true,
  },
];

export function isValidProduct(value: unknown): value is Product {
  if (!value || typeof value !== 'object') return false;
  const p = value as Partial<Product>;
  return typeof p.id === 'string' && typeof p.name === 'string' &&
    typeof p.price === 'number' && Number.isFinite(p.price) && p.price >= 0 &&
    typeof p.category === 'string' && typeof p.description === 'string' &&
    typeof p.image === 'string' && typeof p.available === 'boolean';
}

export function readDemoProducts(): Product[] {
  if (typeof window === 'undefined') return initialProducts;
  try {
    let raw = window.localStorage.getItem(STORAGE_KEY);
    if(raw === null && canMigrateLegacy()) {
      const legacy=window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if(legacy){const old: unknown=JSON.parse(legacy);if(Array.isArray(old)&&old.every(isValidProduct)) {window.localStorage.setItem(STORAGE_KEY,legacy);raw=legacy;}}
    }
    if (!raw) return initialProducts;
    const data: unknown = JSON.parse(raw);
    return Array.isArray(data) && data.every(isValidProduct) ? data : initialProducts;
  } catch { return initialProducts; }
}

export function writeDemoProducts(products: Product[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}


/**
 * DEMO only. Synchronizes product writes between tabs in browsers with Web Locks.
 * A read-modify-write operation on localStorage alone is not atomic across tabs.
 * Unsupported browsers receive best-effort latest-read semantics, not an atomic guarantee.
 * LIVE mode must enforce concurrency on the server instead.
 */
export async function mutateDemoProducts(
  change:(latest:Product[])=>Product[]
):Promise<Product[]> {
  if(typeof window==='undefined')throw new Error('Demo ürünleri yalnız tarayıcıda değiştirilebilir.');
  const commit=()=>{
    const latest=readDemoProducts();
    const updated=change(latest);
    if(!Array.isArray(updated)||!updated.every(isValidProduct))throw new Error('Ürün verisi geçersiz.');
    writeDemoProducts(updated);
    return updated;
  };
  if(typeof navigator!=='undefined' && navigator.locks?.request){
    return navigator.locks.request(STORAGE_KEY+':write',{mode:'exclusive'},commit);
  }
  // Fallback has no cross-tab atomicity: never claim equivalent safety.
  return commit();
}
