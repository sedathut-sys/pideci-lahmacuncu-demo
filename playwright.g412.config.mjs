import {defineConfig} from '@playwright/test';

const baseURL='http://127.0.0.1:4321/pideci-lahmacuncu-demo/';

export default defineConfig({
  testDir:'./tests/g412',
  testMatch:'**/*.spec.mjs',
  timeout:75_000,
  expect:{timeout:15_000},
  fullyParallel:false,
  retries:process.env.CI?1:0,
  workers:1,
  reporter:[
    ['list'],
    ['html',{outputFolder:'playwright-report/g412',open:'never'}],
    ['json',{outputFile:'test-results/g412-results.json'}],
  ],
  outputDir:'test-results/g412/traces',
  use:{
    baseURL,browserName:'chromium',headless:true,
    locale:'tr-TR',timezoneId:'Europe/Istanbul',
    colorScheme:'light',reducedMotion:'reduce',
    acceptDownloads:true,
    screenshot:'only-on-failure',
    trace:'retain-on-failure',
  },
  projects:[
    ...[320,360,390,430].map(width=>({
      name:'mobil-'+width+'px',
      use:{viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true},
    })),
    {name:'masaustu-1280px',use:{viewport:{width:1280,height:900},deviceScaleFactor:1}},
  ],
  webServer:{
    command:'npm run preview -- --host 127.0.0.1 --port 4321',
    url:baseURL,reuseExistingServer:!process.env.CI,timeout:120_000,
  },
});
