export const prerender = true;
const rawUrl = import.meta.env.PUBLIC_SITE_URL || '';
function ready() {
  try {return import.meta.env.PUBLIC_DATA_MODE === 'live' &&
      import.meta.env.PUBLIC_SITE_READY === 'true' &&
      Boolean(import.meta.env.PUBLIC_BUSINESS_NAME?.trim()) &&
      new URL(rawUrl).protocol === 'https:';
  } catch {return false;}
}
export function GET() {
  const content = ready()
    ? `User-agent: *\nAllow: /\nDisallow: /panel\nDisallow: /api/\nSitemap: ${new URL('/sitemap.xml',rawUrl).href}\n`
    : 'User-agent: *\nDisallow: /\n';
  return new Response(content,{headers:{'content-type':'text/plain; charset=utf-8','cache-control':'public,max-age=3600'}});
}
