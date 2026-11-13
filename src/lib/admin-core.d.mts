export const DEFAULT_CATEGORIES: readonly string[];
export function validateCategories(input: unknown): string[];
export function addCategory(existing: string[], name: string): string[];
export function removeCategory(existing: string[], name: string, products: Array<{category:string}>): string[];
export function assertCategoriesUsed(products: Array<{category:string,name:string}>, categories: string[]): void;
