/** İlk proje bir örnek marka ile başlar. Canlı işletme bilgileri panelden D1'e kaydedilir. */
export type SiteSettings = {
  name: string;
  tagline: string;
  address: string;
  hours: string;
  phoneDisplay: string;
  whatsappNumber: string;
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  minimumOrder: number;
  orderingEnabled: boolean;
  notice: string;
  categories: string[];
};
export const site: SiteSettings = {
  name: 'Taş Fırın', tagline: 'Mahallenin fırınından, sıcacık sofranıza.',
  whatsappNumber: '', phoneDisplay: 'Telefon henüz tanımlanmadı',
  address: 'Örnek adres — gerçek işletme bilgisi değildir',
  hours: 'Her gün 11.00 – 22.00 (örnek)',
  deliveryAvailable: true, pickupAvailable: true, minimumOrder: 0,
  orderingEnabled: true,
  notice: 'Bu bir şablon demosudur. Fiyatlar örnektir.',
  categories: ['Pide', 'Lahmacun', 'Yan Ürün', 'İçecek']
};
export const SITE_KEY = 'mahalle-yemek-site-demo-v2';
export const SITE_CHANGED = 'mahalle-yemek-site-changed';
export function readDemoSettings(): SiteSettings {
  if(typeof window==='undefined') return site;
  try {
    const raw=window.localStorage.getItem(SITE_KEY);
    return raw?{...site,...JSON.parse(raw)}:site;
  }catch{return site;}
}
export function writeDemoSettings(settings:SiteSettings) {
  if(typeof window==='undefined') return;
  window.localStorage.setItem(SITE_KEY,JSON.stringify(settings));
  window.dispatchEvent(new Event(SITE_CHANGED));
}
