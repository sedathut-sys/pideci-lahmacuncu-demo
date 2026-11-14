import {defineConfig} from '@playwright/test';

const baseURL='http://127.0.0.1:4321/pideci-lahmacuncu-demo/';

export default defineConfig({
  testDir:'./tests/e2e',
  timeout:45_000,
  expect:{timeout:12_000},
  fullyParallel:false,
  retries:process.env.CI?1:0,
  workers:process.env.CI?1:undefined,
  reporter:[['list'],['html',{outputFolder:'playwright-report',open:'never'}]],
  outputDir:'test-results/e2e',
  use:{
    baseURL,
    browserName:'chromium',
    headless:true,
    locale:'tr-TR',
    timezoneId:'Europe/Istanbul',
    screenshot:'only-on-failure',
    trace:'retain-on-failure',
  },
  projects:[320,360,390,430].map(width=>({
    name:`mobil-${width}px`,
    use:{viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true},
  })),
  webServer:{
    command:'npm run preview -- --host 127.0.0.1 --port 4321',
    url:baseURL,
    reuseExistingServer:!process.env.CI,
    timeout:120_000,
  },
});
