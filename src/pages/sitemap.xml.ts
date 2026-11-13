export const prerender = true;
const raw = import.meta.env.PUBLIC_SITE_URL || '';
function ready() {
  try {return import.meta.env.PUBLIC_DATA_MODE === 'live' &&
      import.meta.env.PUBLIC_SITE_READY === 'true' &&
      Boolean(import.meta.env.PUBLIC_BUSINESS_NAME?.trim()) &&
      new URL(raw).protocol === 'https:';
  } catch {return false;}
}
export function GET() {
  // Yalnız doğrulanmış ana sayfa. İleride gerçek kategori sayfaları eklendiğinde genişletilir.
  const url = ready() ? `<url><loc>${new URL('/',raw).href.replaceAll('&','&amp;')}</loc></url>` : '';
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${url}</urlset>`,
    {headers:{'content-type':'application/xml; charset=utf-8','cache-control':'public,max-age=3600'}});
}
