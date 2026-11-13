import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// Bu kaynak kodu SADECE herkese açık GitHub Pages demosudur.
// Gerçek backend ve müşteri sitesi ana özel depoda kalır.
export default defineConfig({
  output: 'static',
  site: 'https://sedathut-sys.github.io',
  base: '/pideci-lahmacuncu-demo',
  integrations: [react()],
});
