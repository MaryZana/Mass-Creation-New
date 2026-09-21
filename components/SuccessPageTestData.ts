/**
 * Единый источник тестовых данных для страницы списка кампаний и товаров.
 * Товары и кампании связаны: у товара — список кампаний, у кампании — привязка к товару.
 * Часть товаров без кампаний, часть в нескольких (в т.ч. CPC + CPM).
 */

export const CATEGORIES = ['Платья', 'Футболки', 'Кроссовки', 'Сумки', 'Косметика', 'Товары для дома'] as const;
export const BRANDS = ['Zara', 'H&M', 'Nike', 'Adidas', "L'Oreal", 'Oriflame', 'IKEA', 'Hoff', 'Decathlon', 'Reserved', 'Mango'] as const;

export type CampaignType = 'CPC' | 'CPM';
export type CampaignStatus = 'active' | 'paused' | 'draft' | 'error';

/** Предсобранная однотоварная CPC-кампания — первая строка в списке (profile 1) */
export const PREBUILT_LIST_SINGLE_PRODUCT_CPC_CAMPAIGN_ID = 999998;

/** Дубликат второй строки списка (profile 1) — отдельный id для UI-концепта блока бюджета */
export const BUDGET_CONCEPT_DEMO_CAMPAIGN_ID = 999997;

/** 4-я кампания в списке (profile 1) — концепт единого блока «Бюджет» (диапазон) */
export const BUDGET_RANGE_CONCEPT_DEMO_CAMPAIGN_ID = 999996;

export interface CampaignSpec {
  type: CampaignType;
  status: CampaignStatus;
  statusText: string;
  typeDetails: string;
  budget: number;
  remainingBudget: number;
  dailyLimit?: number;
  dailyLimitExhausted?: boolean;
  autoRefill: boolean;
  spend: number;
  impressions: number;
  ctr: number;
  orders: number;
  spendShare: number;
  tag?: 'warning' | 'info' | 'error';
  campaignTags: string[];
  changeImpressions?: number;
  changeCtr?: number;
  changeOrders?: number;
  changeShare?: number;
  changePosition?: number;
  avgPosition?: number;
}

/** Те же источники превью, что на странице «Обзор» (Unsplash). */
const UNSPLASH_THUMB = (photoId: string) =>
  `https://images.unsplash.com/photo-${photoId}?w=60&h=76&fit=crop&q=80`;

const PRODUCT_THUMB_PHOTO = {
  shirt: '1521572163474-6864f9cf17ab',
  dress: '1515372039744-b8f02a3ae446',
  office: '1566174053879-31528523f8ae',
  sarafan: '1496747611176-843222e1e57c',
  bag: '1553062407-98eeb64c6a62',
  shoes: '1549298916-b41d501d3772',
  shoesAlt: '1542291026-7eec264c27ff',
  cosmetic: '1571019613454-1cb2f99b2d8b',
  home: '1445205170230-053b83016050',
} as const;

const PRODUCT_THUMB_PHOTO_EXTRA = {
  shirtAlt: '1551028719-00167b16eac5',
  shirtAlt2: '1505740420928-5e560c06d30e',
  shirtAlt3: '1539109136881-3be0616acf4b',
  dressAlt: '1434389677669-e08b4cac3105',
  dressAlt2: '1469334031218-e382a71b716b',
  dressAlt3: '1460353581641-37baddab0fa2',
} as const;

export const PRODUCT_TABLE_THUMB_FALLBACK = UNSPLASH_THUMB(PRODUCT_THUMB_PHOTO.shirt);

const PRODUCT_THUMB_BY_CATEGORY: Record<string, readonly string[]> = {
  Платья: [
    UNSPLASH_THUMB(PRODUCT_THUMB_PHOTO.dress),
    UNSPLASH_THUMB(PRODUCT_THUMB_PHOTO.sarafan),
    UNSPLASH_THUMB(PRODUCT_THUMB_PHOTO.office),
    UNSPLASH_THUMB(PRODUCT_THUMB_PHOTO.dress),
    UNSPLASH_THUMB(PRODUCT_THUMB_PHOTO.sarafan),
    UNSPLASH_THUMB(PRODUCT_THUMB_PHOTO.office),
  ],
  Футболки: [
    UNSPLASH_THUMB(PRODUCT_THUMB_PHOTO.shirt),
    UNSPLASH_THUMB(PRODUCT_THUMB_PHOTO_EXTRA.shirtAlt),
    UNSPLASH_THUMB(PRODUCT_THUMB_PHOTO_EXTRA.shirtAlt2),
    UNSPLASH_THUMB(PRODUCT_THUMB_PHOTO_EXTRA.shirtAlt3),
    UNSPLASH_THUMB(PRODUCT_THUMB_PHOTO_EXTRA.dressAlt),
  ],
  Кроссовки: [
    UNSPLASH_THUMB(PRODUCT_THUMB_PHOTO.shoes),
    UNSPLASH_THUMB(PRODUCT_THUMB_PHOTO.shoesAlt),
    UNSPLASH_THUMB(PRODUCT_THUMB_PHOTO.shoes),
    UNSPLASH_THUMB(PRODUCT_THUMB_PHOTO.shoesAlt),
    UNSPLASH_THUMB(PRODUCT_THUMB_PHOTO.shoes),
  ],
  Сумки: [
    UNSPLASH_THUMB(PRODUCT_THUMB_PHOTO.bag),
    UNSPLASH_THUMB(PRODUCT_THUMB_PHOTO.bag),
    UNSPLASH_THUMB(PRODUCT_THUMB_PHOTO.bag),
    UNSPLASH_THUMB(PRODUCT_THUMB_PHOTO.bag),
  ],
  Косметика: [
    UNSPLASH_THUMB(PRODUCT_THUMB_PHOTO.cosmetic),
    UNSPLASH_THUMB(PRODUCT_THUMB_PHOTO.cosmetic),
    UNSPLASH_THUMB(PRODUCT_THUMB_PHOTO.cosmetic),
    UNSPLASH_THUMB(PRODUCT_THUMB_PHOTO.cosmetic),
    UNSPLASH_THUMB(PRODUCT_THUMB_PHOTO.cosmetic),
  ],
  'Товары для дома': [
    UNSPLASH_THUMB(PRODUCT_THUMB_PHOTO.home),
    UNSPLASH_THUMB(PRODUCT_THUMB_PHOTO.home),
    UNSPLASH_THUMB(PRODUCT_THUMB_PHOTO.home),
    UNSPLASH_THUMB(PRODUCT_THUMB_PHOTO.home),
    UNSPLASH_THUMB(PRODUCT_THUMB_PHOTO.home),
  ],
};

const PRODUCT_THUMB_URLS_BY_INDEX: readonly string[] = Array.from({ length: 30 }, (_, i) => {
  const pool = [
    PRODUCT_THUMB_PHOTO.dress,
    PRODUCT_THUMB_PHOTO.sarafan,
    PRODUCT_THUMB_PHOTO.shirt,
    PRODUCT_THUMB_PHOTO.bag,
    PRODUCT_THUMB_PHOTO.shoes,
    PRODUCT_THUMB_PHOTO.cosmetic,
    PRODUCT_THUMB_PHOTO.home,
  ];
  return UNSPLASH_THUMB(pool[i % pool.length]!);
});

/** Уникальное превью на каждый pr1…pr30 (по индексу id); только рабочие Unsplash id. */
const PRODUCT_THUMB_UNIQUE_PHOTO_IDS: readonly string[] = [
  PRODUCT_THUMB_PHOTO.sarafan,
  PRODUCT_THUMB_PHOTO.office,
  PRODUCT_THUMB_PHOTO.dress,
  PRODUCT_THUMB_PHOTO_EXTRA.dressAlt,
  PRODUCT_THUMB_PHOTO_EXTRA.dressAlt2,
  PRODUCT_THUMB_PHOTO_EXTRA.dressAlt3,
  PRODUCT_THUMB_PHOTO.shirt,
  PRODUCT_THUMB_PHOTO_EXTRA.shirtAlt,
  PRODUCT_THUMB_PHOTO_EXTRA.shirtAlt2,
  PRODUCT_THUMB_PHOTO_EXTRA.shirtAlt3,
  PRODUCT_THUMB_PHOTO.shoes,
  PRODUCT_THUMB_PHOTO.shoesAlt,
  PRODUCT_THUMB_PHOTO.bag,
  '1606107557195-0e29a4b5b4aa',
  '1594633312681-425c7b97ccd1',
  '1618354691373-d851c5c3a990',
  '1556909114-f6e7ad7d3136',
  '1591047139829-d91aecb6caea',
  '1590874103328-eac38a683ce7',
  '1556228720-195a672e8a03',
  '1541643600914-78b084683601',
  '1512496015851-a90fb38ba796',
  '1490481651871-ab68de25d43d',
  '1543163521-1bf539c55dd2',
  '1539533018447-63fcce2678e3',
  PRODUCT_THUMB_PHOTO.home,
  PRODUCT_THUMB_PHOTO.cosmetic,
  '1558618666-fcd25c85cd64',
  PRODUCT_THUMB_PHOTO_EXTRA.shirtAlt2,
  PRODUCT_THUMB_PHOTO_EXTRA.shirtAlt3,
];

const PRODUCT_THUMB_UNIQUE_BY_PRODUCT_INDEX: readonly string[] =
  PRODUCT_THUMB_UNIQUE_PHOTO_IDS.map((id) => UNSPLASH_THUMB(id));

/** Первые 15 строк на вкладке «Мультикарточки» — гарантированно разные кадры (по позиции в списке). */
export const PRODUCT_THUMB_UNIQUE_ALL_TAB_FIRST_ROWS = 15;

const PRODUCT_THUMB_UNIQUE_FIRST_15: readonly string[] =
  PRODUCT_THUMB_UNIQUE_BY_PRODUCT_INDEX.slice(0, PRODUCT_THUMB_UNIQUE_ALL_TAB_FIRST_ROWS);

function productIndexFromId(productId: string): number {
  const n = Number.parseInt(productId.replace(/\D/g, ''), 10);
  return Number.isFinite(n) && n > 0 ? n - 1 : 0;
}

export function isProductTablePlaceholderImage(url: string | undefined): boolean {
  return !url || /placehold\.co/i.test(url);
}

export function productTableThumbPlaceholderUrl(_productId: string): string {
  return PRODUCT_TABLE_THUMB_FALLBACK;
}

export function productTableThumbFallbackUrl(productId: string): string {
  return `https://picsum.photos/seed/wb-${encodeURIComponent(productId)}/60/76`;
}

export function productTableThumbUrl(productId: string, category?: string): string {
  const idx = productIndexFromId(productId);
  if (idx >= 0 && idx < PRODUCT_THUMB_UNIQUE_BY_PRODUCT_INDEX.length) {
    return PRODUCT_THUMB_UNIQUE_BY_PRODUCT_INDEX[idx]!;
  }
  if (category && PRODUCT_THUMB_BY_CATEGORY[category]?.length) {
    const list = PRODUCT_THUMB_BY_CATEGORY[category]!;
    return list[idx % list.length]!;
  }
  return PRODUCT_THUMB_URLS_BY_INDEX[idx] ?? PRODUCT_TABLE_THUMB_FALLBACK;
}

/** Вкладка «Мультикарточки»: первые 15 видимых строк — свои URL, независимо от сортировки. */
export function productTableThumbUrlForAllTabListRow(
  listRowIndex: number,
  productId: string,
  category?: string,
): string {
  if (listRowIndex >= 0 && listRowIndex < PRODUCT_THUMB_UNIQUE_FIRST_15.length) {
    return PRODUCT_THUMB_UNIQUE_FIRST_15[listRowIndex]!;
  }
  return productTableThumbUrl(productId, category);
}

export function resolveProductTableThumbSrc(
  productId: string,
  src?: string,
  category?: string,
  allTabListRowIndex?: number,
): string {
  if (
    allTabListRowIndex !== undefined &&
    allTabListRowIndex >= 0 &&
    allTabListRowIndex < PRODUCT_THUMB_UNIQUE_FIRST_15.length
  ) {
    return PRODUCT_THUMB_UNIQUE_FIRST_15[allTabListRowIndex]!;
  }
  const catalog = productTableThumbUrl(productId, category);
  if (isProductTablePlaceholderImage(src)) return catalog;
  return src!;
}

function withCatalogProductImages(products: ProductSource[]): ProductSource[] {
  return products.map((p) => ({
    ...p,
    image: productTableThumbUrl(p.id, p.category),
  }));
}

export interface ProductSource {
  id: string;
  name: string;
  article: string;
  /** Артикул WB */
  articleWb?: string;
  /** Артикул продавца */
  articleSeller?: string;
  category: string;
  brand: string;
  image: string;
  tags: string[];
  campaigns: CampaignSpec[];
}

/** 30 товаров. Теги: тест, регулярный, Распродажа, Новинки — не у всех кампаний. */
const PRODUCTS_SOURCE_BASE: ProductSource[] = [
  // Платья (6)
  { id: 'pr1', name: 'Летнее платье "Ривьера"', article: '1001001', category: 'Платья', brand: 'Zara', image: 'https://placehold.co/64x64/E9D5FF/4C1D95?text=1', tags: ['регулярный'], campaigns: [{ type: 'CPC', status: 'active', statusText: 'активна', typeDetails: '', budget: 300000, remainingBudget: 1500, dailyLimit: 2000, dailyLimitExhausted: false, autoRefill: true, spend: 100350, impressions: 324580, ctr: 1.2, orders: 89, spendShare: 15.8, campaignTags: ['тест'] }, { type: 'CPM', status: 'active', statusText: 'активна', typeDetails: 'Единая', budget: 300000, remainingBudget: 3200, autoRefill: false, spend: 50200, impressions: 180000, ctr: 1.1, orders: 45, spendShare: 9.8, campaignTags: [], changeImpressions: -9.7, changeCtr: -1.3 }] },
  { id: 'pr2', name: 'Вечернее платье "Грация"', article: '1001002', category: 'Платья', brand: 'Zara', image: 'https://placehold.co/64x64/E9D5FF/4C1D95?text=2', tags: ['Новинки', 'Распродажа'], campaigns: [{ type: 'CPC', status: 'active', statusText: 'активна', typeDetails: '', budget: 300000, remainingBudget: 800, dailyLimit: 1500, dailyLimitExhausted: true, autoRefill: false, spend: 100350, impressions: 324580, ctr: 1.2, orders: 89, spendShare: 15.8, tag: 'warning', campaignTags: ['регулярный'] }] },
  { id: 'pr3', name: 'Платье-футляр "Офис"', article: '1001003', category: 'Платья', brand: 'H&M', image: 'https://placehold.co/64x64/E9D5FF/4C1D95?text=3', tags: ['регулярный'], campaigns: [{ type: 'CPM', status: 'active', statusText: 'активна', typeDetails: 'Единая', budget: 300000, remainingBudget: 3200, autoRefill: false, spend: 100350, impressions: 324580, ctr: 1.2, orders: 89, spendShare: 15.8, campaignTags: ['регулярный'] }] },
  { id: 'pr4', name: 'Сарафан "Прованс"', article: '1001004', category: 'Платья', brand: 'H&M', image: 'https://placehold.co/64x64/E9D5FF/4C1D95?text=4', tags: [], campaigns: [{ type: 'CPM', status: 'paused', statusText: 'приостановлена', typeDetails: 'Ручная', budget: 300000, remainingBudget: 500, autoRefill: false, spend: 0, impressions: 0, ctr: 0, orders: 0, spendShare: 0, campaignTags: [] }] },
  { id: 'pr5', name: 'Платье с принтом "Флора"', article: '1001005', category: 'Платья', brand: 'Mango', image: 'https://placehold.co/64x64/E9D5FF/4C1D95?text=5', tags: ['Новинки'], campaigns: [{ type: 'CPM', status: 'active', statusText: 'активна', typeDetails: 'Ручная', budget: 300000, remainingBudget: 2100, autoRefill: false, spend: 80200, impressions: 250000, ctr: 1.1, orders: 75, spendShare: 14.1, campaignTags: ['регулярный'] }] },
  { id: 'pr6', name: 'Коктейльное платье "Шарм"', article: '1001006', category: 'Платья', brand: 'Reserved', image: 'https://placehold.co/64x64/E9D5FF/4C1D95?text=6', tags: [], campaigns: [{ type: 'CPC', status: 'draft', statusText: 'черновик', typeDetails: '', budget: 300000, remainingBudget: 4500, dailyLimit: 3000, dailyLimitExhausted: false, autoRefill: true, spend: 0, impressions: 0, ctr: 0, orders: 0, spendShare: 0, campaignTags: ['тест', 'Новинки'] }] },
  // Футболки (5)
  { id: 'pr7', name: 'Футболка базовая оверсайз', article: '2002001', category: 'Футболки', brand: 'Zara', image: 'https://placehold.co/64x64/BFDBFE/1E3A8A?text=7', tags: [], campaigns: [] },
  { id: 'pr8', name: 'Футболка с принтом "Лето"', article: '2002002', category: 'Футболки', brand: 'H&M', image: 'https://placehold.co/64x64/BFDBFE/1E3A8A?text=8', tags: ['Новинки'], campaigns: [{ type: 'CPC', status: 'active', statusText: 'активна', typeDetails: '', budget: 150000, remainingBudget: 8200, dailyLimit: 5000, dailyLimitExhausted: false, autoRefill: true, spend: 45000, impressions: 120000, ctr: 1.5, orders: 56, spendShare: 8.2, campaignTags: ['Регулярный ассортимент'] }] },
  { id: 'pr9', name: 'Футболка поло мужская', article: '2002003', category: 'Футболки', brand: 'Nike', image: 'https://placehold.co/64x64/BFDBFE/1E3A8A?text=9', tags: ['регулярный'], campaigns: [{ type: 'CPC', status: 'active', statusText: 'активна', typeDetails: 'Ручная', budget: 200000, remainingBudget: 11000, dailyLimit: 3000, dailyLimitExhausted: false, autoRefill: false, spend: 89000, impressions: 280000, ctr: 1.8, orders: 98, spendShare: 12.1, campaignTags: ['регулярный'] }, { type: 'CPM', status: 'paused', statusText: 'приостановлена', typeDetails: 'Единая', budget: 200000, remainingBudget: 200000, autoRefill: false, spend: 0, impressions: 0, ctr: 0, orders: 0, spendShare: 0, campaignTags: [] }] },
  { id: 'pr10', name: 'Футболка детская', article: '2002004', category: 'Футболки', brand: 'Decathlon', image: 'https://placehold.co/64x64/BFDBFE/1E3A8A?text=10', tags: [], campaigns: [] },
  { id: 'pr11', name: 'Футболка с длинным рукавом', article: '2002005', category: 'Футболки', brand: 'Reserved', image: 'https://placehold.co/64x64/BFDBFE/1E3A8A?text=11', tags: ['регулярный'], campaigns: [{ type: 'CPM', status: 'active', statusText: 'активна', typeDetails: 'Единая', budget: 180000, remainingBudget: 5400, autoRefill: false, spend: 72000, impressions: 190000, ctr: 1.2, orders: 67, spendShare: 10.5, campaignTags: [] }] },
  // Кроссовки (5)
  { id: 'pr12', name: 'Кроссовки беговые Air', article: '3003001', category: 'Кроссовки', brand: 'Nike', image: 'https://placehold.co/64x64/A7F3D0/065F46?text=12', tags: ['тест', 'Новинки'], campaigns: [{ type: 'CPC', status: 'active', statusText: 'активна', typeDetails: '', budget: 500000, remainingBudget: 12500, dailyLimit: 8000, dailyLimitExhausted: false, autoRefill: true, spend: 250000, impressions: 600000, ctr: 1.5, orders: 220, spendShare: 18.2, campaignTags: ['тест'] }, { type: 'CPM', status: 'active', statusText: 'активна', typeDetails: 'Единая', budget: 500000, remainingBudget: 380000, autoRefill: false, spend: 85000, impressions: 200000, ctr: 1.1, orders: 95, spendShare: 5.2, campaignTags: ['Новинки'], changeImpressions: 12.3, changeOrders: 7.3 }] },
  { id: 'pr13', name: 'Кроссовки повседневные', article: '3003002', category: 'Кроссовки', brand: 'Adidas', image: 'https://placehold.co/64x64/A7F3D0/065F46?text=13', tags: [], campaigns: [{ type: 'CPC', status: 'paused', statusText: 'приостановлена', typeDetails: '', budget: 220000, remainingBudget: 1100, dailyLimit: 2000, dailyLimitExhausted: true, autoRefill: false, spend: 215000, impressions: 300000, ctr: 1.8, orders: 110, spendShare: 22, tag: 'warning', campaignTags: ['Регулярный ассортимент'] }] },
  { id: 'pr14', name: 'Кроссовки для зала', article: '3003003', category: 'Кроссовки', brand: 'Nike', image: 'https://placehold.co/64x64/A7F3D0/065F46?text=14', tags: [], campaigns: [] },
  { id: 'pr15', name: 'Кроссовки трейловые', article: '3003004', category: 'Кроссовки', brand: 'Decathlon', image: 'https://placehold.co/64x64/A7F3D0/065F46?text=15', tags: ['Новинки'], campaigns: [{ type: 'CPM', status: 'active', statusText: 'активна', typeDetails: 'Ручная', budget: 120000, remainingBudget: 2400, autoRefill: false, spend: 30000, impressions: 100000, ctr: 0.8, orders: 40, spendShare: 10, campaignTags: [], tag: 'info' }] },
  { id: 'pr16', name: 'Кроссовки детские', article: '3003005', category: 'Кроссовки', brand: 'Adidas', image: 'https://placehold.co/64x64/A7F3D0/065F46?text=16', tags: [], campaigns: [{ type: 'CPC', status: 'draft', statusText: 'черновик', typeDetails: '', budget: 80000, remainingBudget: 80000, autoRefill: false, spend: 0, impressions: 0, ctr: 0, orders: 0, spendShare: 0, campaignTags: [] }] },
  // Сумки (4)
  { id: 'pr17', name: 'Сумка-шоппер "Эко"', article: '4004001', category: 'Сумки', brand: 'Zara', image: 'https://placehold.co/64x64/FED7AA/9A3412?text=17', tags: ['Распродажа'], campaigns: [{ type: 'CPM', status: 'error', statusText: 'приостановлена', typeDetails: 'Ручная', budget: 0, remainingBudget: 600, autoRefill: false, spend: 0, impressions: 0, ctr: 0, orders: 0, spendShare: 0, tag: 'error', campaignTags: ['регулярный'] }] },
  { id: 'pr18', name: 'Рюкзак городской', article: '4004002', category: 'Сумки', brand: 'H&M', image: 'https://placehold.co/64x64/FED7AA/9A3412?text=18', tags: ['регулярный'], campaigns: [{ type: 'CPC', status: 'active', statusText: 'активна', typeDetails: '', budget: 90000, remainingBudget: 3500, dailyLimit: 4000, dailyLimitExhausted: true, autoRefill: false, spend: 85000, impressions: 120000, ctr: 2.2, orders: 130, spendShare: 28, campaignTags: ['Новинки'] }, { type: 'CPM', status: 'active', statusText: 'активна', typeDetails: 'Единая', budget: 90000, remainingBudget: 41000, autoRefill: false, spend: 15000, impressions: 90000, ctr: 1, orders: 45, spendShare: 11.5, campaignTags: ['регулярный'] }] },
  { id: 'pr19', name: 'Клатч вечерний', article: '4004003', category: 'Сумки', brand: 'Mango', image: 'https://placehold.co/64x64/FED7AA/9A3412?text=19', tags: [], campaigns: [] },
  { id: 'pr20', name: 'Сумка кожаная "Классика"', article: '4004004', category: 'Сумки', brand: 'Reserved', image: 'https://placehold.co/64x64/FED7AA/9A3412?text=20', tags: ['регулярный'], campaigns: [{ type: 'CPM', status: 'active', statusText: 'активна', typeDetails: 'Ручная', budget: 75000, remainingBudget: 4100, autoRefill: false, spend: 15000, impressions: 90000, ctr: 1, orders: 45, spendShare: 11.5, campaignTags: ['регулярный'] }] },
  // Косметика (5)
  { id: 'pr21', name: 'Крем увлажняющий 50 мл', article: '5005001', category: 'Косметика', brand: "L'Oreal", image: 'https://placehold.co/64x64/FBCFE8/831843?text=21', tags: ['регулярный'], campaigns: [{ type: 'CPC', status: 'active', statusText: 'активна', typeDetails: '', budget: 200000, remainingBudget: 2600, dailyLimit: 3000, dailyLimitExhausted: false, autoRefill: false, spend: 0, impressions: 0, ctr: 0, orders: 0, spendShare: 0, campaignTags: [] }] },
  { id: 'pr22', name: 'Тушь для ресниц', article: '5005002', category: 'Косметика', brand: "L'Oreal", image: 'https://placehold.co/64x64/FBCFE8/831843?text=22', tags: [], campaigns: [{ type: 'CPM', status: 'active', statusText: 'активна', typeDetails: 'Единая', budget: 150000, remainingBudget: 88000, autoRefill: false, spend: 42000, impressions: 250000, ctr: 1.4, orders: 180, spendShare: 14.2, campaignTags: ['Новинки'] }] },
  { id: 'pr23', name: 'Набор подарочный', article: '5005003', category: 'Косметика', brand: 'Oriflame', image: 'https://placehold.co/64x64/FBCFE8/831843?text=23', tags: [], campaigns: [] },
  { id: 'pr24', name: 'Сыворотка для лица', article: '5005004', category: 'Косметика', brand: 'Oriflame', image: 'https://placehold.co/64x64/FBCFE8/831843?text=24', tags: ['Новинки'], campaigns: [{ type: 'CPC', status: 'active', statusText: 'активна', typeDetails: 'Ручная', budget: 180000, remainingBudget: 1700, dailyLimit: 2200, dailyLimitExhausted: false, autoRefill: true, spend: 95000, impressions: 280000, ctr: 1.3, orders: 92, spendShare: 16, campaignTags: [] }, { type: 'CPM', status: 'draft', statusText: 'черновик', typeDetails: 'Единая', budget: 180000, remainingBudget: 180000, autoRefill: false, spend: 0, impressions: 0, ctr: 0, orders: 0, spendShare: 0, campaignTags: [] }] },
  { id: 'pr25', name: 'Помада матовая', article: '5005005', category: 'Косметика', brand: "L'Oreal", image: 'https://placehold.co/64x64/FBCFE8/831843?text=25', tags: ['регулярный'], campaigns: [{ type: 'CPM', status: 'active', statusText: 'активна', typeDetails: 'Ручная', budget: 95000, remainingBudget: 12000, autoRefill: false, spend: 41000, impressions: 150000, ctr: 1.6, orders: 88, spendShare: 9.1, campaignTags: ['регулярный'] }] },
  // Товары для дома (5)
  { id: 'pr26', name: 'Набор полотенец 3 шт', article: '6006001', category: 'Товары для дома', brand: 'IKEA', image: 'https://placehold.co/64x64/DBEAFE/1E40AF?text=26', tags: [], campaigns: [] },
  { id: 'pr27', name: 'Настольная лампа', article: '6006002', category: 'Товары для дома', brand: 'Hoff', image: 'https://placehold.co/64x64/DBEAFE/1E40AF?text=27', tags: [], campaigns: [{ type: 'CPC', status: 'active', statusText: 'активна', typeDetails: '', budget: 50000, remainingBudget: 50000, dailyLimit: 2000, dailyLimitExhausted: false, autoRefill: false, spend: 0, impressions: 0, ctr: 0, orders: 0, spendShare: 0, campaignTags: [] }] },
  { id: 'pr28', name: 'Плед декоративный', article: '6006003', category: 'Товары для дома', brand: 'IKEA', image: 'https://placehold.co/64x64/DBEAFE/1E40AF?text=28', tags: ['регулярный'], campaigns: [{ type: 'CPM', status: 'active', statusText: 'активна', typeDetails: 'Единая', budget: 120000, remainingBudget: 2400, autoRefill: false, spend: 30000, impressions: 100000, ctr: 0.8, orders: 40, spendShare: 10, campaignTags: [], tag: 'info' }] },
  { id: 'pr29', name: 'Ваза керамическая', article: '6006004', category: 'Товары для дома', brand: 'Hoff', image: 'https://placehold.co/64x64/DBEAFE/1E40AF?text=29', tags: [], campaigns: [{ type: 'CPC', status: 'paused', statusText: 'приостановлена', typeDetails: '', budget: 60000, remainingBudget: 900, dailyLimit: 1500, dailyLimitExhausted: true, autoRefill: false, spend: 58000, impressions: 80000, ctr: 1.2, orders: 35, spendShare: 8.5, campaignTags: ['Регулярный ассортимент'] }] },
  { id: 'pr30', name: 'Набор посуды 6 персон', article: '6006005', category: 'Товары для дома', brand: 'IKEA', image: 'https://placehold.co/64x64/DBEAFE/1E40AF?text=30', tags: ['регулярный', 'Новинки'], campaigns: [{ type: 'CPC', status: 'active', statusText: 'активна', typeDetails: 'Ручная', budget: 400000, remainingBudget: 4900, dailyLimit: 5000, dailyLimitExhausted: false, autoRefill: false, spend: 390000, impressions: 800000, ctr: 1.1, orders: 150, spendShare: 19.5, campaignTags: ['регулярный'] }, { type: 'CPM', status: 'active', statusText: 'активна', typeDetails: 'Единая', budget: 400000, remainingBudget: 120000, autoRefill: false, spend: 180000, impressions: 450000, ctr: 1.2, orders: 210, spendShare: 12.1, campaignTags: ['Новинки'], changeImpressions: -5.2, changeOrders: 3.1 }] },
];

export const PRODUCTS_SOURCE: ProductSource[] = withCatalogProductImages(PRODUCTS_SOURCE_BASE);

/** Профиль 2: 2 товара, 3 кампании (1 + 2). */
const PRODUCTS_SOURCE_PROFILE_2_BASE: ProductSource[] = [
  {
    id: 'pr2',
    name: 'Вечернее платье "Грация"',
    article: '1001002',
    category: 'Платья',
    brand: 'Zara',
    image: 'https://placehold.co/64x64/E9D5FF/4C1D95?text=2',
    tags: ['Новинки', 'Распродажа'],
    campaigns: [
      {
        type: 'CPC',
        status: 'active',
        statusText: 'активна',
        typeDetails: '',
        budget: 300000,
        remainingBudget: 800,
        dailyLimit: 1500,
        dailyLimitExhausted: true,
        autoRefill: false,
        spend: 100350,
        impressions: 324580,
        ctr: 1.2,
        orders: 89,
        spendShare: 15.8,
        tag: 'warning',
        campaignTags: ['регулярный'],
      },
    ],
  },
  {
    id: 'pr18',
    name: 'Рюкзак городской',
    article: '4004002',
    category: 'Сумки',
    brand: 'H&M',
    image: 'https://placehold.co/64x64/FED7AA/9A3412?text=18',
    tags: ['регулярный'],
    campaigns: [
      {
        type: 'CPC',
        status: 'active',
        statusText: 'активна',
        typeDetails: '',
        budget: 90000,
        remainingBudget: 3500,
        dailyLimit: 4000,
        dailyLimitExhausted: true,
        autoRefill: false,
        spend: 85000,
        impressions: 120000,
        ctr: 2.2,
        orders: 130,
        spendShare: 28,
        campaignTags: ['Новинки'],
      },
      {
        type: 'CPM',
        status: 'active',
        statusText: 'активна',
        typeDetails: 'Единая',
        budget: 90000,
        remainingBudget: 41000,
        autoRefill: false,
        spend: 15000,
        impressions: 90000,
        ctr: 1,
        orders: 45,
        spendShare: 11.5,
        campaignTags: ['регулярный'],
      },
    ],
  },
];

export const PRODUCTS_SOURCE_PROFILE_2: ProductSource[] = withCatalogProductImages(
  PRODUCTS_SOURCE_PROFILE_2_BASE,
);
