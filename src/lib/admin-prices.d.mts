import type {Product} from '../data/products';
export function displayedPrice(product:Product):number;
export function withDisplayedPrice(product:Product,price:number):Product;
export function syncDisplayPrice(product:Product):Product;
export function addVariant(product:Product):Product;
export function removeVariant(product:Product,index:number):Product;
