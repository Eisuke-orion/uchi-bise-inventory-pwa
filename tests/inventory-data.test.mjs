import test from 'node:test';
import assert from 'node:assert/strict';
import { DATA_VERSION, INITIAL_PRODUCTS, migrateInventoryData } from '../src/inventory-data.js';

const stored = (products, overrides = {}) => ({
  products,
  dataVersion: 5,
  lastUpdated: '2026-08-01T12:00:00+09:00',
  lastEditor: 'テスト',
  ...overrides,
});

test('旧端末へパインジュースを補完し、牛乳の誤った例示値2だけを訂正する', () => {
  const oldProducts = INITIAL_PRODUCTS
    .filter(product => product.name !== 'パインジュース')
    .map(product => product.name === '牛乳' ? { ...product, stock: 2 } : product);
  oldProducts.push({ id: 'custom-tea', name: '紅茶', category: 'その他', stock: 4, order: 99 });

  const result = migrateInventoryData(stored(oldProducts));
  assert.equal(result.dataVersion, DATA_VERSION);
  assert.equal(result.products.filter(product => product.name === 'パインジュース').length, 1);
  assert.equal(result.products.find(product => product.name === 'パインジュース').stock, 0);
  assert.equal(result.products.find(product => product.name === '牛乳').stock, 0);
  assert.equal(result.products.find(product => product.name === '紅茶').stock, 4);
});

test('修正版で入力した牛乳2本は再読込しても維持する', () => {
  const products = INITIAL_PRODUCTS.map(product => product.name === '牛乳' ? { ...product, stock: 2 } : product);
  const result = migrateInventoryData(stored(products, { dataVersion: DATA_VERSION }));
  assert.equal(result.products.find(product => product.name === '牛乳').stock, 2);
});

test('牛乳の旧在庫が2以外なら既存数量を保護する', () => {
  const products = INITIAL_PRODUCTS.map(product => product.name === '牛乳' ? { ...product, stock: 1 } : product);
  const result = migrateInventoryData(stored(products));
  assert.equal(result.products.find(product => product.name === '牛乳').stock, 1);
});

test('マスター品目は重複せず全件そろう', () => {
  const duplicate = { ...INITIAL_PRODUCTS.find(product => product.name === 'パインジュース'), id: 'old-pine' };
  const result = migrateInventoryData(stored([...INITIAL_PRODUCTS, duplicate]));
  const names = result.products.map(product => product.name);
  assert.equal(new Set(names).size, names.length);
  assert.deepEqual(
    INITIAL_PRODUCTS.map(product => product.name).filter(name => !names.includes(name)),
    [],
  );
});
