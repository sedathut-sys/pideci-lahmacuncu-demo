import type {Product} from '../data/products';
export const MAX_UNIT_PRICE:number;
export function isValidUnitPrice(value:unknown):value is number;
export function formatAdminPrice(value:number):string;
export function normalizePriceInput(value:string):string;
export function parsePriceDraft(text:string):number;
export function validateProductPricing(product:Product):true;
