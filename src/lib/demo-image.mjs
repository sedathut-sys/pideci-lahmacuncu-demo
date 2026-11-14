/** Sadece demo: yüklenen fotoğrafı küçültüp bu tarayıcıdaki localStorage'a yazar. */
export async function demoImageData(file) {
  if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('PNG, JPG veya WebP fotoğraf seçin.');
  if(!file.size || file.size>2*1024*1024)throw new Error('Fotoğraf 2 MB veya daha küçük olmalı.');
  const url=URL.createObjectURL(file);
  try {
    const img=new Image();img.src=url;await img.decode();
    const scale=Math.min(1,960/Math.max(img.naturalWidth,img.naturalHeight));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Görsel işlenemedi.');
    ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
    const data=canvas.toDataURL('image/webp',0.72);
    if(!data.startsWith('data:image/webp;base64,'))throw new Error('Tarayıcı WebP dönüştürmeyi desteklemiyor.');
    if(data.length>480000)throw new Error('Fotoğraf demo depolaması için çok büyük, daha küçük bir resim seçin.');
    return data;
  } finally {URL.revokeObjectURL(url);}
}
