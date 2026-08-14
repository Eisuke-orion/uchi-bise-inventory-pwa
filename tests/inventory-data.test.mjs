import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DATA_VERSION,
  INITIAL_PRODUCTS,
  STOCK_SNAPSHOT_EDITOR,
  migrateInventoryData,
} from '../src/inventory-data.js';

const stored = (products, overrides = {}) => ({
  products,
  dataVersion: 5,
  lastUpdated: '2026-08-01T12:00:00+09:00',
  lastEditor: 'テスト',
  ...overrides,
});

test('旧端末へ8月14日の棚卸し値とパインジュースを補完する', () => {
  const oldProducts = INITIAL_PRODUCTS
    .filter(product => product.name !== 'パインジュース')
    .map(product => product.name === '牛乳' ? { ...product, stock: 2 } : product);
  oldProducts.push({ id: 'custom-tea', name: '紅茶', category: 'その他', stock: 4, order: 99 });

  const result = migrateInventoryData(stored(oldProducts));
  assert.equal(result.dataVersion, DATA_VERSION);
  assert.equal(result.products.filter(product => product.name === 'パインジュース').length, 1);
  assert.equal(result.products.find(product => product.name === 'パインジュース').stock, 0);
  assert.equal(result.products.find(product => product.name === 'ストロベリー').stock, 2);
  assert.equal(result.products.find(product => product.name === 'マンゴーチャンク').stock, 8);
  assert.equal(result.products.find(product => product.name === 'ベリー').stock, 7);
  assert.equal(result.products.find(product => product.name === '牛乳').stock, 4);
  assert.equal(result.products.find(product => product.name === 'コップ').stock, 300);
  assert.equal(result.products.find(product => product.name === '蓋').stock, 250);
  assert.equal(result.products.find(product => product.name === '紅茶').stock, 4);
  assert.equal(result.lastEditor, STOCK_SNAPSHOT_EDITOR);
});

test('8月14日の棚卸し後に入力した牛乳2本は再読込しても維持する', () => {
  const products = INITIAL_PRODUCTS.map(product => product.name === '牛乳' ? { ...product, stock: 2 } : product);
  const result = migrateInventoryData(stored(products, {
    dataVersion: DATA_VERSION,
    lastUpdated: '2026-08-14T20:00:00+09:00',
  }));
  assert.equal(result.products.find(product => product.name === '牛乳').stock, 2);
});

test('牛乳の旧在庫が2以外なら既存数量を保護する', () => {
  const products = INITIAL_PRODUCTS.map(product => product.name === '牛乳' ? { ...product, stock: 1 } : product);
  const result = migrateInventoryData(stored(products, {
    lastUpdated: '2026-08-14T20:00:00+09:00',
  }));
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

test('旧ミント在庫をタッパー残量の5段階へ移行する', () => {
  const products = INITIAL_PRODUCTS.map(product => product.name === 'ミント（タッパー残量）'
    ? { ...product, name:'ミント ※タッパー', unit:'折', minimum:1, target:3, stock:2 }
    : product);
  const result = migrateInventoryData(stored(products));
  const mint = result.products.find(product => product.name === 'ミント（タッパー残量）');
  assert.equal(mint.stock, 50);
  assert.equal(mint.minimum, 25);
  assert.equal(mint.target, 100);
  assert.equal(mint.inputType, 'level');
});
