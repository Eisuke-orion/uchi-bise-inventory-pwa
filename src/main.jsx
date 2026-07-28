import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AlertTriangle, ArrowLeft, BarChart3, Check, ChevronDown, ChevronRight, Clipboard, Download, Home, Leaf, Minus, PackageCheck, Pencil, Plus, RotateCcw, Save, Settings, Share2, Trash2, Upload } from 'lucide-react';
import './styles.css';
import './navigation.css';

const CATEGORIES = ['フルーツ', 'ジュース', '牛乳・乳製品', 'コーヒー', 'トッピング', '消耗品', 'その他'];
const INITIAL_PRODUCTS = [
  ['ストロベリー','フルーツ','コストコ','個',1,2,2],
  ['ラズベリー','フルーツ','コストコ','個',1,2,2],
  ['マンゴーチャンク','フルーツ','コストコ','個',7,20,8],
  ['ベリー','ジュース','コストコ','個',2,6,2],
  ['レモネード','ジュース','コストコ','個',2,6,11],
  ['マンゴー','ジュース','コストコ','個',2,10,10],
  ['パインジュース','ジュース','コストコ','個',2,6,0],
  ['牛乳','牛乳・乳製品','コンビニ / Aプライス','本',2,4,0],
  ['コーヒーミルク','牛乳・乳製品','Aプライス','袋',1,3,3],
  ['コーヒー','コーヒー','Aプライス','個',1,5,2],
  ['レモン輪切り 10枚','トッピング','Aプライス','個',2,6,4],
  ['ライム三日月 6枚','トッピング','Aプライス','個',1,2,1],
  ['ミント ※タッパー','トッピング','Aプライス','折',1,3,1],
  ['ガムシロップ','トッピング','Aプライス','袋',1,3,3],
  ['氷','消耗品','コンビニ / Aプライス','袋',2,4,3],
  ['食器用洗剤 ※大きめ','消耗品','ドラッグストア','個',1,2,1],
  ['ハンドソープ ※大きめ','消耗品','ドラッグストア','個',1,2,1],
  ['ハンドペーパー','消耗品','ドラッグストア','袋',2,1,18],
  ['ティッシュペーパー 袋（5パック）','消耗品','ドラッグストア','袋',1,2,16],
  ['トイレットペーパー 袋（12ロール）','消耗品','ドラッグストア','袋',1,2,2],
  ['手袋','消耗品','みつわ','箱',1,3,2],
  ['コップ','消耗品','みつわ','個',100,500,50],
  ['蓋','消耗品','みつわ','個',100,500,150],
  ['ストロー','消耗品','みつわ','袋',1,4,1],
  ['ゴミ袋 大','消耗品','ドラッグストア','袋',2,5,5],
  ['ゴミ袋 小','消耗品','ドラッグストア','袋',2,5,5],
  ['炭酸','その他','Aプライス','本',1,4,31],
  ['チャンダー','その他','サンエー / ドンキ','箱',1,3,2],
].map((p, i) => ({ id: `item-${i + 1}`, name:p[0], category:p[1], supplier:p[2], unit:p[3], minimum:p[4], target:p[5], stock:p[6], order:i + 1 }));

const STORAGE_KEY = 'uchi-bise-inventory-v1';
const SALES_APP_URL = 'https://uchi-bise-sales.yuuuzo.chatgpt.site/admin';
const DATA_VERSION = 5;
const STOCK_SNAPSHOT_AT = '2026-07-26T17:00:00+09:00';
const STOCK_SNAPSHOT_EDITOR = '比嘉 眞子';
const STOCK_SNAPSHOT = {
  'ストロベリー': 2,
  'ラズベリー': 2,
  'マンゴーチャンク': 8,
  'ベリー': 2,
  'レモネード': 11,
  'マンゴー': 10,
  'パインジュース': 0,
  '牛乳': 0,
  'コーヒーミルク': 3,
  'コーヒー': 2,
  'レモン輪切り 10枚': 4,
  'ライム三日月 6枚': 1,
  'ミント ※タッパー': 1,
  'ガムシロップ': 3,
  '氷': 3,
  '食器用洗剤 ※大きめ': 1,
  'ハンドソープ ※大きめ': 1,
  'ハンドペーパー': 18,
  'ティッシュペーパー 袋（5パック）': 16,
  'トイレットペーパー 袋（12ロール）': 2,
  '手袋': 2,
  'コップ': 50,
  '蓋': 150,
  'ストロー': 1,
  '炭酸': 31,
  'チャンダー': 2,
};
const STOCK_ALIASES = {
  'レモネード': ['レモネードベース'],
  'ミント ※タッパー': ['ミント'],
  'コップ': ['カップ'],
  '蓋': ['フタ'],
};
const BASE_URL = import.meta.env.BASE_URL;
const nowText = value => value ? new Intl.DateTimeFormat('ja-JP', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' }).format(new Date(value)) : 'まだ保存されていません';
const dateText = () => new Intl.DateTimeFormat('ja-JP', { month:'numeric', day:'numeric' }).format(new Date());
const orderQuantity = product => product.target <= product.minimum ? 1 : Math.max(0, product.target - product.stock);

function loadData() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
    if (!stored) return null;
    if (stored.dataVersion === DATA_VERSION) return stored;
    const previous = Array.isArray(stored.products) ? stored.products : [];
    const migrated = INITIAL_PRODUCTS.map(product => {
      const names = [product.name, ...(STOCK_ALIASES[product.name] || [])];
      const match = previous.find(item => names.includes(item.name));
      return match ? { ...product, stock: Number(match.stock) || 0 } : product;
    });
    const shouldApplySnapshot = !stored.lastUpdated || Date.parse(stored.lastUpdated) < Date.parse(STOCK_SNAPSHOT_AT);
    const products = shouldApplySnapshot
      ? migrated.map(product => Object.hasOwn(STOCK_SNAPSHOT, product.name)
        ? { ...product, stock: STOCK_SNAPSHOT[product.name] }
        : product)
      : migrated;
    const next = {
      ...stored,
      products,
      dataVersion: DATA_VERSION,
      lastUpdated: shouldApplySnapshot ? STOCK_SNAPSHOT_AT : stored.lastUpdated,
      lastEditor: shouldApplySnapshot ? STOCK_SNAPSHOT_EDITOR : stored.lastEditor,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch { return null; }
}

function App() {
  const initial = loadData();
  const [products, setProducts] = useState(initial?.products || INITIAL_PRODUCTS);
  const [page, setPage] = useState('home');
  const [lastUpdated, setLastUpdated] = useState(initial?.lastUpdated || STOCK_SNAPSHOT_AT);
  const [lastEditor, setLastEditor] = useState(initial?.lastEditor || STOCK_SNAPSHOT_EDITOR);
  const [editor, setEditor] = useState(initial?.lastEditor || STOCK_SNAPSHOT_EDITOR);
  const [toast, setToast] = useState('');
  const alerts = useMemo(() => products.filter(p => Number(p.stock) <= Number(p.minimum)), [products]);

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register(`${BASE_URL}sw.js`);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [page]);

  const persist = (nextProducts = products, meta = {}) => {
    const data = { products: nextProducts, lastUpdated: meta.lastUpdated ?? lastUpdated, lastEditor: meta.lastEditor ?? lastEditor, dataVersion: DATA_VERSION };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const notify = message => { setToast(message); setTimeout(() => setToast(''), 2400); };
  const go = next => setPage(next);

  const saveInventory = () => {
    const time = new Date().toISOString();
    setLastUpdated(time); setLastEditor(editor.trim());
    persist(products, { lastUpdated: time, lastEditor: editor.trim() });
    notify('今日の在庫を保存しました');
    setTimeout(() => setPage('home'), 500);
  };

  const updateProducts = next => { setProducts(next); persist(next); };

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => go('home')} aria-label="ホームへ">
        <img src={`${BASE_URL}brand-logo.jpg`} alt="" /><span><b>ウチの備瀬カフェ</b><small>INVENTORY</small></span>
      </button>
      <a className="sales-app-link" href={SALES_APP_URL} aria-label="売上管理アプリへ移動">
        <BarChart3 />
        <span>売上管理へ</span>
      </a>
    </header>

    <main>
      {page === 'home' && <HomePage alerts={alerts} lastUpdated={lastUpdated} lastEditor={lastEditor} go={go} />}
      {page === 'check' && <InventoryPage products={products} setProducts={setProducts} editor={editor} setEditor={setEditor} save={saveInventory} go={go} />}
      {page === 'orders' && <OrdersPage alerts={alerts} lastEditor={lastEditor || editor} go={go} notify={notify} />}
      {page === 'master' && <MasterPage products={products} updateProducts={updateProducts} go={go} notify={notify} />}
    </main>

    <nav className="bottom-nav" aria-label="メインメニュー">
      <NavButton active={page==='home'} icon={Home} label="ホーム" onClick={() => go('home')} />
      <NavButton active={page==='check'} icon={PackageCheck} label="在庫入力" onClick={() => go('check')} />
      <NavButton active={page==='orders'} icon={Clipboard} label="発注リスト" badge={alerts.length} onClick={() => go('orders')} />
      <NavButton active={page==='master'} icon={Settings} label="商品設定" onClick={() => go('master')} />
    </nav>
    {toast && <div className="toast"><Check size={18}/>{toast}</div>}
  </div>;
}

function NavButton({ icon: Icon, label, active, badge, onClick }) {
  return <button className={active ? 'active' : ''} onClick={onClick}><span className="nav-icon"><Icon />{badge > 0 && <i>{badge}</i>}</span><small>{label}</small></button>;
}

function HomePage({ alerts, lastUpdated, lastEditor, go }) {
  return <div className="home-page page-wrap">
    <section className="hero-card">
      <div className="hero-copy"><span className="eyebrow"><Leaf size={15}/> DAILY STOCK</span><h1>今日も、気持ちよく<br/>在庫チェック。</h1><p>{dateText()} ・ 備瀬</p></div>
      <img src={`${BASE_URL}hero-coffee.jpg`} alt="フクギ並木とカフェラテ" />
    </section>

    <section className={`alert-summary ${alerts.length ? 'has-alert' : 'all-good'}`}>
      <div className="alert-number"><span>{alerts.length}</span><small>品目</small></div>
      <div><b>{alerts.length ? '発注が必要です' : '在庫は十分です'}</b><p>{alerts.length ? '不足している商品を確認しましょう' : '今日も問題ありません'}</p></div>
      {alerts.length ? <AlertTriangle /> : <Check />}
    </section>

    <button className="primary-action" onClick={() => go('check')}><span><PackageCheck/><b>今日の在庫チェック</b><small>商品ごとに数を入力</small></span><ChevronRight/></button>
    <div className="action-grid">
      <button className="action-card order" onClick={() => go('orders')}><span className="icon-box"><Clipboard/></span><b>発注リストを見る</b><small>{alerts.length ? `${alerts.length}品目の確認が必要` : '発注品はありません'}</small><ChevronRight/></button>
      <button className="action-card" onClick={() => go('master')}><span className="icon-box"><Settings/></span><b>商品マスタ編集</b><small>商品・下限・仕入れ先</small><ChevronRight/></button>
    </div>
    <a className="sales-home-action" href={SALES_APP_URL}>
      <span className="icon-box"><BarChart3 /></span>
      <span><b>売上管理ホームへ</b><small>運営ダッシュボードを直接開く</small></span>
      <ChevronRight />
    </a>
    <div className="last-update"><span className="status-dot"></span><div><small>最終更新</small><b>{nowText(lastUpdated)}{lastEditor && ` ・ ${lastEditor}`}</b></div></div>
  </div>;
}

function PageHeader({ title, sub, go }) {
  return <div className="page-header"><button className="back" onClick={() => go('home')}><ArrowLeft/></button><div><h1>{title}</h1>{sub && <p>{sub}</p>}</div></div>;
}

function InventoryPage({ products, setProducts, editor, setEditor, save, go }) {
  const [open, setOpen] = useState(Object.fromEntries(CATEGORIES.map(c => [c, true])));
  const changeStock = (id, value) => setProducts(products.map(p => p.id === id ? { ...p, stock: Math.max(0, Number(value) || 0) } : p));
  return <div className="page-wrap sub-page">
    <PageHeader title="今日の在庫チェック" sub={`${dateText()} ・ ${products.length}品目`} go={go}/>
    <div className="editor-field"><label htmlFor="editor">入力者</label><input id="editor" list="staff" value={editor} onChange={e => setEditor(e.target.value)} placeholder="名前を入力・選択"/><datalist id="staff"><option value="店長"/><option value="スタッフA"/><option value="スタッフB"/></datalist></div>
    <div className="legend"><span><i className="ok"></i>余裕あり</span><span><i className="warn"></i>残りわずか</span><span><i className="bad"></i>発注</span></div>
    {CATEGORIES.map(category => {
      const items = products.filter(p => p.category === category).sort((a,b) => a.order-b.order);
      if (!items.length) return null;
      const catAlerts = items.filter(p => p.stock <= p.minimum).length;
      return <section className="category" key={category}>
        <button className="category-head" onClick={() => setOpen({ ...open, [category]: !open[category] })}><span>{open[category] ? <ChevronDown/> : <ChevronRight/>}<b>{category}</b><small>{items.length}品目</small></span>{catAlerts > 0 && <em>{catAlerts} 発注</em>}</button>
        {open[category] && <div className="stock-list">{items.map(item => <StockCard key={item.id} item={item} change={changeStock}/>)}</div>}
      </section>;
    })}
    <div className="sticky-save"><button onClick={save}><Save/>在庫を保存する</button></div>
  </div>;
}

function StockCard({ item, change }) {
  const isAlert = item.stock <= item.minimum;
  const isWarn = !isAlert && item.stock <= item.minimum * 1.5;
  return <article className={`stock-card ${isAlert ? 'stock-alert' : isWarn ? 'stock-warn' : ''}`}>
    <div className="stock-info"><div><h3>{item.name}</h3><p>下限 {item.minimum}{item.unit} / 上限 {item.target}{item.unit}</p></div><span className={`pill ${isAlert ? 'bad' : isWarn ? 'warn' : 'ok'}`}>{isAlert ? '発注' : isWarn ? '注意' : 'OK'}</span></div>
    <div className="stepper"><button onClick={() => change(item.id, item.stock - 1)} aria-label={`${item.name}を減らす`}><Minus/></button><label><input type="number" inputMode="decimal" min="0" value={item.stock} onChange={e => change(item.id, e.target.value)}/><span>{item.unit}</span></label><button onClick={() => change(item.id, item.stock + 1)} aria-label={`${item.name}を増やす`}><Plus/></button></div>
  </article>;
}

function OrdersPage({ alerts, lastEditor, go, notify }) {
  const grouped = Object.groupBy ? Object.groupBy(alerts, p => p.supplier || '仕入れ先未設定') : alerts.reduce((a,p) => ((a[p.supplier || '仕入れ先未設定'] ||= []).push(p), a), {});
  const text = ['【ウチの備瀬カフェ 発注リスト】', `${dateText()} 在庫チェック`, `入力者：${lastEditor || '未入力'}`, '', ...Object.entries(grouped).flatMap(([supplier, items]) => [`▼${supplier}`, ...items.map(p => `・${p.name}：現在 ${p.stock}${p.unit} / 下限 ${p.minimum}${p.unit} → 発注目安 ${orderQuantity(p)}${p.unit}`), ''])].join('\n').trim();
  const copy = async () => { try { await navigator.clipboard.writeText(text); notify('LINE共有用テキストをコピーしました'); } catch { notify('コピーできませんでした'); } };
  const share = async () => { if (navigator.share) await navigator.share({ text }); else copy(); };
  return <div className="page-wrap sub-page">
    <PageHeader title="発注リスト" sub={`${alerts.length}品目が発注対象です`} go={go}/>
    {alerts.length === 0 ? <div className="empty-state"><span><Check/></span><h2>発注が必要な商品は<br/>ありません</h2><p>在庫はすべて下限を上回っています。</p><button onClick={() => go('check')}>在庫チェックへ</button></div> : <>
      <div className="order-note"><AlertTriangle/><span><b>発注目安は「上限 − 現在庫」</b><small>必要に応じて発注時に調整してください</small></span></div>
      {Object.entries(grouped).map(([supplier, items]) => <section className="supplier" key={supplier}><div className="supplier-head"><b>{supplier}</b><span>{items.length}品目</span></div>{items.map(p => <article className="order-item" key={p.id}><div><h3>{p.name}</h3><p>現在 <b>{p.stock}{p.unit}</b>　/　下限 {p.minimum}{p.unit}</p></div><div className="order-qty"><small>発注目安</small><b>{orderQuantity(p)}<em>{p.unit}</em></b></div></article>)}</section>)}
      <div className="share-actions"><button className="copy-button" onClick={copy}><Clipboard/>LINE共有用テキストをコピー</button><button className="share-button" onClick={share} aria-label="共有"><Share2/></button></div>
      <details className="copy-preview"><summary>コピーされる文面を確認</summary><pre>{text}</pre></details>
    </>}
  </div>;
}

function MasterPage({ products, updateProducts, go, notify }) {
  const blank = { name:'', category:'フルーツ', supplier:'', unit:'袋', minimum:1, target:3, order:products.length+1 };
  const [form, setForm] = useState(blank); const [editing, setEditing] = useState(null); const [showForm, setShowForm] = useState(false);
  const submit = e => { e.preventDefault(); if (!form.name.trim()) return; const next = editing ? products.map(p => p.id === editing ? { ...p, ...form } : p) : [...products, { ...form, id:`item-${Date.now()}`, stock:form.target }]; updateProducts(next); setForm({...blank, order:next.length+1}); setEditing(null); setShowForm(false); notify(editing ? '商品を更新しました' : '商品を追加しました'); };
  const edit = p => { setForm(p); setEditing(p.id); setShowForm(true); window.scrollTo({top:0,behavior:'smooth'}); };
  const remove = p => { if (confirm(`「${p.name}」を削除しますか？`)) { updateProducts(products.filter(x => x.id !== p.id)); notify('商品を削除しました'); } };
  const exportData = () => { const blob = new Blob([JSON.stringify({ products, exportedAt:new Date().toISOString() }, null, 2)], {type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`uchi-bise-inventory-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(a.href); };
  const importData = e => { const file=e.target.files?.[0]; if (!file) return; const reader=new FileReader(); reader.onload=() => { try { const data=JSON.parse(reader.result); if (!Array.isArray(data.products)) throw new Error(); if (confirm(`${data.products.length}件の商品データに置き換えますか？`)) { updateProducts(data.products); notify('データを読み込みました'); } } catch { notify('正しいJSONファイルを選んでください'); } }; reader.readAsText(file); e.target.value=''; };
  const reset = () => { if (confirm('初期商品データに戻しますか？現在のデータは上書きされます。')) { updateProducts(INITIAL_PRODUCTS); notify('初期データに戻しました'); } };
  return <div className="page-wrap sub-page">
    <PageHeader title="商品マスタ編集" sub={`${products.length}品目を登録中`} go={go}/>
    <button className="add-product" onClick={() => { setForm(blank); setEditing(null); setShowForm(!showForm); }}><Plus/>{showForm && !editing ? '入力を閉じる' : '新しい商品を追加'}</button>
    {showForm && <form className="product-form" onSubmit={submit}><div className="form-title"><b>{editing ? '商品を編集' : '商品を追加'}</b><small>すべて端末内に保存されます</small></div><Field label="商品名"><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="例：マンゴーチャンク"/></Field><div className="form-row"><Field label="カテゴリ"><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></Field><Field label="仕入れ先"><input value={form.supplier} onChange={e=>setForm({...form,supplier:e.target.value})} placeholder="コストコ"/></Field></div><div className="form-row three"><Field label="単位"><input value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})}/></Field><Field label="下限"><input type="number" min="0" value={form.minimum} onChange={e=>setForm({...form,minimum:Number(e.target.value)})}/></Field><Field label="上限"><input type="number" min="0" value={form.target} onChange={e=>setForm({...form,target:Number(e.target.value)})}/></Field></div><Field label="並び順"><input type="number" min="1" value={form.order} onChange={e=>setForm({...form,order:Number(e.target.value)})}/></Field><button className="form-save"><Save/>{editing ? '変更を保存' : '商品を追加'}</button></form>}
    <div className="master-list">{CATEGORIES.map(category => { const items=products.filter(p=>p.category===category).sort((a,b)=>a.order-b.order); if(!items.length)return null; return <section key={category}><h2>{category}<span>{items.length}</span></h2>{items.map(p=><article className="master-item" key={p.id}><div><b>{p.name}</b><small>{p.supplier || '仕入れ先未設定'} ・ {p.unit} ・ 下限 {p.minimum} / 上限 {p.target}</small></div><button onClick={()=>edit(p)} aria-label={`${p.name}を編集`}><Pencil/></button><button className="delete" onClick={()=>remove(p)} aria-label={`${p.name}を削除`}><Trash2/></button></article>)}</section>})}</div>
    <section className="data-tools"><h2>データ管理</h2><p>機種変更やバックアップに使えます。</p><div><button onClick={exportData}><Download/>JSONを書き出す</button><label><Upload/>JSONを読み込む<input type="file" accept="application/json" onChange={importData}/></label></div><button className="reset-button" onClick={reset}><RotateCcw/>初期データに戻す</button></section>
  </div>;
}

function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label>; }

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
