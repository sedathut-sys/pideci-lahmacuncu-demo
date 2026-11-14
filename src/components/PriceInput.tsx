import {useState} from 'react';
import {normalizePriceInput,parsePriceDraft} from '../lib/price-rules.mjs';
/** Boş tutar geçerli bir sıfır değildir; alan, düzenleme sırasında kuruşları korur. */
export default function PriceInput({value,onChange,ariaLabel}:{value:number;onChange:(value:number)=>void;ariaLabel:string}) {
  const [draft,setDraft]=useState(()=>Number.isFinite(value)?String(value).replace('.',','):'');
  function change(raw:string) {
    const next=normalizePriceInput(raw);
    if(!/^\d*(?:[.,]\d{0,2})?$/.test(next))return;
    setDraft(next);
    onChange(parsePriceDraft(next));
  }
  return <input type="text" inputMode="decimal" autoComplete="off" aria-label={ariaLabel}
    value={draft} onChange={e=>change(e.currentTarget.value)}
    onBlur={()=>{if(Number.isFinite(value))setDraft(String(value).replace('.',','));}}
    aria-invalid={!Number.isFinite(value)} />;
}
