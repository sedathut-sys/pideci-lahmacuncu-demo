/** Admin UI, Workers API ve Node testlerinde ortak kategori kuralları. */
export const DEFAULT_CATEGORIES = Object.freeze(['Pide', 'Lahmacun', 'Yan Ürün', 'İçecek']);
const canonical = text => String(text ?? '').trim().replace(/\s+/g, ' ');
export function validateCategories(input) {
  if (!Array.isArray(input) || input.length < 1 || input.length > 24) throw new Error('En az bir, en fazla 24 kategori tanımlayın.');
  const names = input.map(canonical);
  if (names.some(x => x.length < 2 || x.length > 36 || /[<>\x00-\x1f]/.test(x))) throw new Error('Kategori adları 2–36 karakter olmalıdır.');
  const fold = name => name.toLocaleLowerCase('tr-TR');
  if (names.some(name=>fold(name)==='tümü'))throw new Error('“Tümü” sistem filtresidir; kategori adı olarak kullanılamaz.');
  if (new Set(names.map(fold)).size !== names.length) throw new Error('Aynı kategori iki kez eklenemez.');
  return names;
}
export function addCategory(existing, name) {
  return validateCategories([...existing, name]);
}
export function removeCategory(existing, name, products) {
  if (products.some(p => p.category === name)) throw new Error('Bu kategoride ürün var; önce ürünleri başka kategoriye taşıyın.');
  return validateCategories(existing.filter(x => x !== name));
}
export function assertCategoriesUsed(products, categories) {
  const unknown = products.find(p => !categories.includes(p.category));
  if (unknown) throw new Error(`“${unknown.name}” ürününün kategorisi silinemez: ${unknown.category}.`);
}
