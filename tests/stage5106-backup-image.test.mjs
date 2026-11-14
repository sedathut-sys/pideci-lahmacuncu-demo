import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseDemoBackupJson} from '../src/lib/demo-backup.mjs';
import {validateProductPricing} from '../src/lib/price-rules.mjs';

const base={
 version:3,
 products:[{id:'pide-1',name:'Kıymalı Pide',description:'Deneme',category:'Pide',price:215,image:'/images/pide-kiymali.svg',available:true,variants:[{label:'Standart',price:215},{label:'1,5 porsiyon',price:310}],extras:[{label:'Kaşar',price:35}]}],
 settings:{name:'Taş Fırın',tagline:'Deneme',address:'Örnek',hours:'11-22',phoneDisplay:'',whatsappNumber:'',notice:'',deliveryAvailable:true,pickupAvailable:true,minimumOrder:0,orderingEnabled:true,categories:['Pide']}
};
const parse=v=>parseDemoBackupJson(JSON.stringify(v));
const clone=()=>structuredClone(base);
test('Geçerli sürüm 3 JSON ürün ve ayarlara geri açılır',()=>{
 const data=parse(clone());assert.equal(data.products.length,1);assert.equal(data.products[0].price,215);
 assert.equal(data.settings.categories[0],'Pide');assert.equal(validateProductPricing(data.products[0]),true);
});
test('Hatalı JSON ve desteklenmeyen yedek reddedilir',()=>{
 assert.throws(()=>parseDemoBackupJson('bozuk'),/JSON/);
 assert.throws(()=>parse({...clone(),version:2}),/Sürüm 3/);
 assert.throws(()=>parseDemoBackupJson('x'.repeat(12*1024*1024+1)),/12 MB/);
});
test('Bozuk ürün, kategori ve fiyat yedeğe alınamaz',()=>{
 const dup=clone();dup.products.push(structuredClone(dup.products[0]));
 assert.throws(()=>parse(dup),/tekrarlanan/);
 const mismatch=clone();mismatch.products[0].category='Tatlı';
 assert.throws(()=>parse(mismatch),/geçersiz ürün/);
 const wrong=clone();wrong.products[0].extras[0].price=1000001;
 assert.throws(()=>parse(wrong),/fiyatını kontrol/);
 const injection=clone();injection.products[0].image='javascript:alert(1)';
 assert.throws(()=>parse(injection),/geçersiz ürün/);
 const bad=clone();bad.settings.categories=['Tümü'];
 assert.throws(()=>parse(bad),/sistem filtresidir/);
});
test('Yedek gereksiz alanları ürünlere taşımıyor',()=>{
 const v=clone();v.products[0].unexpected='x';v.settings.unexpected=true;
 const p=parse(v);assert.equal(p.products[0].unexpected,undefined);assert.equal(p.settings.unexpected,undefined);
});
test('Görsel yükleme sonucunun stale request olarak elenmesi ve form odak yönetimi kodda var',()=>{
 const admin=readFileSync(new URL('../src/components/AdminPanel.tsx',import.meta.url),'utf8');
 assert.match(admin,/uploadGeneration=useRef\(0\)/);
 assert.match(admin,/const generation=\+\+uploadGeneration.current/);
 assert.match(admin,/if\(generation!==uploadGeneration.current\)return/);
 assert.match(admin,/parseDemoBackupJson\(await file.text\(\)\)/);
 assert.match(admin,/writeDemoProducts\(data.products\)/);
 assert.match(admin,/writeDemoSettings\(data.settings\)/);
 assert.match(admin,/ref=\{dialogRef\}/);
 assert.match(admin,/e.key==='Tab'/);
 assert.match(admin,/returnFocus.current\?\.focus\(\)/);
});
test('WebP sıkıştırma kademeli ve yüksek çözünürlük sınırı var',()=>{
 const image=readFileSync(new URL('../src/lib/demo-image.mjs',import.meta.url),'utf8');
 assert.match(image,/img.naturalWidth\*img.naturalHeight>80000000/);
 assert.match(image,/\[0.72,0.58,0.44\]/);
 assert.match(image,/URL.revokeObjectURL\(url\)/);
});
