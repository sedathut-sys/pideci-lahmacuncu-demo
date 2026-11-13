/** GitHub Pages (/repo/) ve Cloudflare (/) için tek yol çözümleyici. */
const rawBase = import.meta.env.BASE_URL || '/';
export const pageBase = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
export function publicUrl(path: string): string {
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(path) || path.startsWith('#')) return path;
  return pageBase + path.replace(/^\/+/, '');
}
