import type { Product } from '../data/products';
export type CartLine = {
 key:string;productId:string;name:string;options:string;variantLabel:string|null;
 extraLabels:string[];unitPrice:number;quantity:number;
};
export type Delivery = 'delivery'|'pickup';
export const MAX_LINE_QUANTITY:number;
export function money(amount:number):string;
export function isValidWhatsApp(number:unknown):boolean;
export function buildCartLine(product:Product|undefined|null,choice?:{variantIndex?:number;extraLabels?:string[];quantity?:number}):CartLine;
export function addLine(cart:CartLine[],line:CartLine):CartLine[];
export function changeQuantity(cart:CartLine[],key:string,change:number):CartLine[];
export function totals(cart:CartLine[]):{quantity:number;subtotal:number};
export function refreshCart(cart:CartLine[],products:Product[]):{lines:CartLine[];removed:number;priceChanged:boolean};
export function validateCheckout(args:{cart:CartLine[];customer:string;address:string;delivery:Delivery;settings:{orderingEnabled:boolean;deliveryAvailable:boolean;pickupAvailable:boolean;minimumOrder:number;whatsappNumber:string};requireWhatsapp?:boolean}):string;
export function orderMessage(args:{cart:CartLine[];customer:string;address:string;delivery:Delivery;note?:string}):string;
export function whatsAppLink(number:string,message:string):string;
