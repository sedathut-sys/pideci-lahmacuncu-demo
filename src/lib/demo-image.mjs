/** Sadece demo: yüklenen fotoğrafı küçültüp bu tarayıcıdaki localStorage'a yazar. */
export async function demoImageData(file) {
  if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('PNG, JPG veya WebP fotoğraf seçin.');
  if(!file.size || file.size>2*1024*1024)throw new Error('Fotoğraf 2 MB veya daha küçük olmalı.');
  const url=URL.createObjectURL(file);
  try {
    const img=new Image();img.src=url;await img.decode();
    if(!img.naturalWidth||!img.naturalHeight||img.naturalWidth>12000||img.naturalHeight>12000||img.naturalWidth*img.naturalHeight>80000000)throw new Error('Fotoğraf çözünürlüğü çok yüksek; daha küçük bir fotoğraf seçin.');
    const scale=Math.min(1,960/Math.max(img.naturalWidth,img.naturalHeight));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Görsel işlenemedi.');
    ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
    for(const quality of [0.72,0.58,0.44]){
      const data=canvas.toDataURL('image/webp',quality);
      if(!data.startsWith('data:image/webp;base64,'))throw new Error('Tarayıcı WebP dönüştürmeyi desteklemiyor.');
      if(data.length<=480000)return data;
    }
    throw new Error('Fotoğraf demo depolaması için çok büyük; daha küçük bir fotoğraf seçin.');
  } finally {URL.revokeObjectURL(url);}
}
