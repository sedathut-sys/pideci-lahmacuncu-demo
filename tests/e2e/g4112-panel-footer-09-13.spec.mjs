import {test,expect} from '@playwright/test';

// G4.1.12 #09/#13: Dar mobil düzenleyicinin yalnızca görsel düğme yerleşimi.
// Beş ekran tek testte çalışır; diğer mobil projelerde tekrar etmez.
const viewports=[
  {width:320,height:560},
  {width:320,height:720},
  {width:360,height:640},
  {width:390,height:844},
  {width:1280,height:800},
];

test('G4.1.12 #09/#13: Kaydet tek satır, düğmeler çakışmaz; mobil ve masaüstü korunur',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='mobil-320px','Beş viewport aynı testte bir kez ölçülür');
  test.setTimeout(120_000);
  for(const viewport of viewports){
    await page.setViewportSize(viewport);
    await page.goto('./panel/');
    const edit=viewport.width<800
      ?page.getByRole('button',{name:'Kıymalı Pide düzenle'})
      :page.locator('.admin-actions-cell .edit-button').first();
    await expect(edit).toBeVisible();
    await edit.click();
    const editor=page.getByRole('dialog',{name:'Ürün düzenle'});
    await expect(editor).toBeVisible();
    await editor.locator('.admin-form').evaluate(el=>{el.scrollTop=el.scrollHeight});
    const footer=editor.locator('.admin-dialog-footer');
    const cancel=footer.getByRole('button',{name:'İptal',exact:true});
    const save=footer.getByRole('button',{name:'Ürünü kaydet',exact:true});
    await expect(cancel).toBeVisible();
    await expect(save).toBeVisible();

    const measured=await footer.evaluate(element=>{
      const rect=el=>{const b=el.getBoundingClientRect();return{x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height}};
      const lines=el=>{
        const range=document.createRange();
        range.selectNodeContents(el);
        return Array.from(range.getClientRects()).filter(b=>b.width>0).map(b=>({width:b.width,top:b.top,bottom:b.bottom}));
      };
      const buttons=Array.from(element.querySelectorAll('button'));
      return {
        viewport:{width:innerWidth,height:innerHeight},
        footer:rect(element),
        cancel:rect(buttons[0]),
        save:rect(buttons[1]),
        saveTextLines:lines(buttons[1]),
        footerOverflow:element.scrollWidth-element.clientWidth,
      };
    });

    expect(measured.cancel.height).toBeGreaterThanOrEqual(44);
    expect(measured.save.height).toBeGreaterThanOrEqual(44);
    expect(measured.cancel.right).toBeLessThanOrEqual(measured.save.x+1);
    expect(measured.cancel.x).toBeGreaterThanOrEqual(measured.footer.x-2);
    expect(measured.save.right).toBeLessThanOrEqual(measured.footer.right+2);
    expect(measured.footer.bottom).toBeLessThanOrEqual(viewport.height+2);
    expect(measured.footerOverflow).toBeLessThanOrEqual(2);

    if(viewport.width<=360){
      const saveShare=measured.save.width/(measured.cancel.width+measured.save.width);
      expect(saveShare).toBeGreaterThan(0.60);
      expect(saveShare).toBeLessThan(0.70);
      expect(measured.saveTextLines,'Ürünü kaydet yazısı tek satır olmalı').toHaveLength(1);
    } else if(viewport.width===390){
      // Mevcut ana sürümde iki düğmenin iç yazıları farklı uzunlukta olduğu için
      // piksel genişlikleri zaten tam eşit değildir. Geliştirme sadece <=360px.
      // Burada önceki yerleşimin dengesinin bozulmadığını ve taşma olmadığını kontrol et.
      const relativeDifference=Math.abs(measured.cancel.width-measured.save.width)/measured.save.width;
      expect(relativeDifference,'390px önceki dengeli mobil düzeni korunmalı').toBeLessThan(0.15);
    }

    await testInfo.attach(`G4112-${viewport.width}x${viewport.height}-editor.png`,{
      body:await page.screenshot({fullPage:false}),contentType:'image/png'
    });
  }
});
