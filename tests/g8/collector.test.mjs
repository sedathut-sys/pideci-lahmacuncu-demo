import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BASE_URL, isInternal, maskUrl, classify, isBlocking} from './collector.mjs';

test('Dahili 404: yüksek öncelik ve engelleyici',()=>{
  const x=classify({kind:'http',url:BASE_URL+'missing.js?token=SHOULD_NOT_LEAK',status:404});
  assert.equal(x.kaynak,'uygulama');
  assert.equal(x.oncelik,'yüksek');
  assert.ok(isBlocking(x));
  assert.doesNotMatch(x.adres,/SHOULD_NOT_LEAK/);
});
test('Dış servis 503: uyarı, yayın engelleyici değil',()=>{
  const x=classify({kind:'http',url:'https://fonts.googleapis.com/test.css',status:503});
  assert.equal(x.kaynak,'harici');
  assert.equal(x.oncelik,'uyarı');
  assert.equal(isBlocking(x),false);
});
test('JavaScript çalışma zamanı hatası: kritik',()=>{
  const x=classify({kind:'javascript',url:BASE_URL,message:'TypeError: Something failed'});
  assert.equal(x.oncelik,'kritik');
  assert.ok(isBlocking(x));
});
test('Kırık görsel yüksek öncelik taşır',()=>{
  const x=classify({kind:'image',url:BASE_URL+'images/missing.svg',message:'naturalWidth=0'});
  assert.ok(isBlocking(x));
});
test('Harici ağ kesilmesi uygulama hatası olarak yazılmaz',()=>{
  const x=classify({kind:'network',url:'https://fonts.gstatic.com/font.woff2',message:'net::ERR_TIMED_OUT'});
  assert.equal(x.kaynak,'harici');
  assert.equal(x.oncelik,'uyarı');
});
test('Beklenen iptal işlemi bilgi seviyesinde',()=>{
  const x=classify({kind:'network',url:BASE_URL+'index.js',message:'net::ERR_ABORTED'});
  assert.equal(x.oncelik,'bilgi');
  assert.equal(isBlocking(x),false);
});
test('Eksik sayfa içi çapa raporlanır ve gizlenmez',()=>{
  const x=classify({kind:'link',url:BASE_URL+'panel/#menu',message:'Çapa yok'});
  assert.equal(x.kaynak,'uygulama');
  assert.equal(x.oncelik,'orta');
});
test('Boş sayfa kritik hata',()=>{
  assert.equal(classify({kind:'empty',url:BASE_URL}).oncelik,'kritik');
});
test('Kaynağı belirsiz konsol mesajı manuel inceleme ister',()=>{
  const x=classify({kind:'console',message:'Resource failed'});
  assert.equal(x.kaynak,'belirsiz');
  assert.equal(x.oncelik,'orta');
});
test('Uygulama kapsamı ve hassas sorgu alanları',()=>{
  assert.ok(isInternal(BASE_URL+'panel/'));
  assert.ok(!isInternal('https://example.org/'));
  assert.ok(!isInternal('http://127.0.0.1:4321/private'));
  assert.equal(maskUrl(BASE_URL+'panel/?secret=123#hash'),BASE_URL+'panel/');
});
