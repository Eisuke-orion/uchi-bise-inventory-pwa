export const CATEGORIES = ['フルーツ', 'ジュース', '牛乳・乳製品', 'コーヒー', 'トッピング', '消耗品', 'その他'];

export const INITIAL_PRODUCTS = [
  ['ストロベリー','フルーツ','コストコ','個',1,2,2],
  ['ラズベリー','フルーツ','コストコ','個',1,2,2],
  ['マンゴーチャンク','フルーツ','コストコ','個',7,20,6],
  ['ベリー','ジュース','コストコ','個',2,6,7],
  ['レモネード','ジュース','コストコ','個',2,6,6],
  ['マンゴー','ジュース','コストコ','個',2,10,5],
  ['パインジュース','ジュース','コストコ','個',2,6,0],
  ['牛乳','牛乳・乳製品','コンビニ / Aプライス','本',2,4,2],
  ['コーヒーミルク','牛乳・乳製品','Aプライス','袋',1,3,5],
  ['コーヒー','コーヒー','Aプライス','個',1,5,4],
  ['レモン輪切り 10枚','トッピング','Aプライス','個',2,6,3],
  ['ライム三日月 6枚','トッピング','Aプライス','個',1,2,3],
  ['ミント（タッパー残量）','トッピング','Aプライス','%',25,100,50],
  ['ガムシロップ','トッピング','Aプライス','袋',1,3,4],
  ['氷','消耗品','コンビニ / Aプライス','袋',2,4,5],
  ['食器用洗剤 ※大きめ','消耗品','ドラッグストア','個',1,2,2],
  ['ハンドソープ ※大きめ','消耗品','ドラッグストア','個',1,2,2],
  ['ハンドペーパー','消耗品','ドラッグストア','袋',2,1,10],
  ['ティッシュペーパー 袋（5パック）','消耗品','ドラッグストア','袋',1,2,8],
  ['トイレットペーパー 袋（12ロール）','消耗品','ドラッグストア','袋',1,2,2],
  ['手袋','消耗品','みつわ','箱',1,3,2],
  ['コップ','消耗品','みつわ','個',100,500,200],
  ['蓋','消耗品','みつわ','個',100,500,150],
  ['ストロー','消耗品','みつわ','袋',1,4,2],
  ['ゴミ袋 大','消耗品','ドラッグストア','袋',2,5,5],
  ['ゴミ袋 小','消耗品','ドラッグストア','袋',2,5,5],
  ['炭酸','その他','Aプライス','本',1,4,2.5],
  ['チャンダー','その他','サンエー / ドンキ','箱',1,3,1],
].map((p, i) => ({
  id: `item-${i + 1}`,
  name:p[0], category:p[1], supplier:p[2], unit:p[3], minimum:p[4], target:p[5], stock:p[6], order:i + 1,
  ...(p[0] === 'ミント（タッパー残量）' ? { inputType:'level', orderUnit:'パック' } : {}),
}));

export const DATA_VERSION = 16;
export const STOCK_SNAPSHOT_AT = '2026-08-19T17:00:00+09:00';
export const STOCK_SNAPSHOT_EDITOR = '阿部 夢香、仲本 理七';

const STOCK_SNAPSHOT = {
  'ストロベリー': 2,
  'ラズベリー': 2,
  'マンゴーチャンク': 6,
  'ベリー': 7,
  'レモネード': 6,
  'マンゴー': 5,
  'パインジュース': 0,
  '牛乳': 2,
  'コーヒーミルク': 5,
  'コーヒー': 4,
  'レモン輪切り 10枚': 3,
  'ライム三日月 6枚': 3,
  'ミント（タッパー残量）': 50,
  'ガムシロップ': 4,
  '氷': 5,
  '食器用洗剤 ※大きめ': 2,
  'ハンドソープ ※大きめ': 2,
  'ハンドペーパー': 10,
  'ティッシュペーパー 袋（5パック）': 8,
  'トイレットペーパー 袋（12ロール）': 2,
  '手袋': 2,
  'コップ': 200,
  '蓋': 150,
  'ストロー': 2,
  '炭酸': 2.5,
  'チャンダー': 1,
};

const STOCK_ALIASES = {
  'レモネード': ['レモネードベース'],
  'ミント（タッパー残量）': ['ミント ※タッパー', 'ミント'],
  'コップ': ['カップ'],
  '蓋': ['フタ'],
};
const CANONICAL_NAMES = new Set(
  INITIAL_PRODUCTS.flatMap(product => [product.name, ...(STOCK_ALIASES[product.name] || [])]),
);

const stockNumber = value => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
};

export function applyRemoteInventorySnapshot(stored, snapshot) {
  if (!stored || typeof stored !== 'object' || !Array.isArray(stored.products)) return stored;
  if (!snapshot || typeof snapshot !== 'object' || !snapshot.products || typeof snapshot.products !== 'object') return stored;

  const snapshotAt = String(snapshot.snapshotAt || '');
  const snapshotTime = Date.parse(snapshotAt);
  const currentTime = Date.parse(stored.lastUpdated || '');
  if (!Number.isFinite(snapshotTime) || (Number.isFinite(currentTime) && snapshotTime <= currentTime)) return stored;

  const products = stored.products.map(product => Object.hasOwn(snapshot.products, product.name)
    ? { ...product, stock: stockNumber(snapshot.products[product.name]) }
    : product);
  return {
    ...stored,
    products,
    dataVersion: DATA_VERSION,
    lastUpdated: snapshotAt,
    lastEditor: String(snapshot.editorName || stored.lastEditor || '運営管理者'),
  };
}

export function migrateInventoryData(stored) {
  if (!stored || typeof stored !== 'object') return null;

  const previous = Array.isArray(stored.products) ? stored.products : [];
  const usedIndexes = new Set();
  const previousVersion = Number(stored.dataVersion) || 0;

  const canonicalProducts = INITIAL_PRODUCTS.map(product => {
    const aliases = STOCK_ALIASES[product.name] || [];
    let matchIndex = previous.findIndex((item, index) =>
      !usedIndexes.has(index) && item?.name === product.name
    );
    if (matchIndex < 0) {
      matchIndex = previous.findIndex((item, index) =>
        !usedIndexes.has(index) && aliases.includes(item?.name)
      );
    }
    if (matchIndex < 0) return product;

    usedIndexes.add(matchIndex);
    let stock = stockNumber(previous[matchIndex].stock);
    // v5以前で牛乳が2の場合は、用紙の記入例を在庫数として保存した誤値。
    // v6適用後にスタッフが実在庫2本を入力した場合は、その値を維持する。
    if (previousVersion < 6 && product.name === '牛乳' && stock === 2) stock = 0;
    // 旧版の「折」(0〜3)を、タッパー残量の5段階(0〜100%)へ移行する。
    if (previousVersion < 7 && product.name === 'ミント（タッパー残量）') {
      stock = stock <= 0 ? 0 : stock === 1 ? 25 : stock === 2 ? 50 : 100;
    }
    return { ...product, stock };
  });

  // 商品マスターでスタッフが追加した独自品目は版更新でも消さない。
  const customProducts = previous
    .filter((item, index) =>
      !usedIndexes.has(index) && item?.name && !CANONICAL_NAMES.has(item.name)
    )
    .map((item, index) => ({
      ...item,
      id: item.id || `custom-${index + 1}`,
      stock: stockNumber(item.stock),
      order: Number(item.order) || canonicalProducts.length + index + 1,
    }));

  const shouldApplySnapshot = !stored.lastUpdated || Date.parse(stored.lastUpdated) < Date.parse(STOCK_SNAPSHOT_AT);
  const products = shouldApplySnapshot
    ? canonicalProducts.map(product => Object.hasOwn(STOCK_SNAPSHOT, product.name)
      ? { ...product, stock: STOCK_SNAPSHOT[product.name] }
      : product)
    : canonicalProducts;

  return {
    ...stored,
    products: [...products, ...customProducts],
    dataVersion: DATA_VERSION,
    lastUpdated: shouldApplySnapshot ? STOCK_SNAPSHOT_AT : stored.lastUpdated,
    lastEditor: shouldApplySnapshot ? STOCK_SNAPSHOT_EDITOR : stored.lastEditor,
  };
}
