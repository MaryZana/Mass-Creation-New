/**
 * Единый источник тестовых данных для страницы списка кампаний и товаров.
 * Товары и кампании связаны: у товара — список кампаний, у кампании — привязка к товару.
 * Часть товаров без кампаний, часть в нескольких (в т.ч. CPC + CPM).
 */

export const CATEGORIES = ['Платья', 'Футболки', 'Кроссовки', 'Сумки', 'Косметика', 'Товары для дома'] as const;
export const BRANDS = ['Zara', 'H&M', 'Nike', 'Adidas', "L'Oreal", 'Oriflame', 'IKEA', 'Hoff', 'Decathlon', 'Reserved', 'Mango'] as const;

export type CampaignType = 'CPC' | 'CPM';
export type CampaignStatus = 'active' | 'paused' | 'draft' | 'error';

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

/** 30 товаров. Теги: тест, Регулярный ассортимент, Распродажа, Новинки — не у всех кампаний. */
export const PRODUCTS_SOURCE: ProductSource[] = [
  // Платья (6)
  { id: 'pr1', name: 'Летнее платье "Ривьера"', article: '1001001', category: 'Платья', brand: 'Zara', image: 'https://placehold.co/64x64/E9D5FF/4C1D95?text=1', tags: ['Регулярный ассортимент'], campaigns: [{ type: 'CPC', status: 'active', statusText: 'активна', typeDetails: '', budget: 300000, remainingBudget: 1500, dailyLimit: 2000, dailyLimitExhausted: false, autoRefill: true, spend: 100350, impressions: 324580, ctr: 1.2, orders: 89, spendShare: 15.8, campaignTags: ['тест'] }, { type: 'CPM', status: 'active', statusText: 'активна', typeDetails: 'Единая', budget: 300000, remainingBudget: 3200, autoRefill: false, spend: 50200, impressions: 180000, ctr: 1.1, orders: 45, spendShare: 9.8, campaignTags: [], changeImpressions: -9.7, changeCtr: -1.3 }] },
  { id: 'pr2', name: 'Вечернее платье "Грация"', article: '1001002', category: 'Платья', brand: 'Zara', image: 'https://placehold.co/64x64/E9D5FF/4C1D95?text=2', tags: ['Новинки', 'Распродажа'], campaigns: [{ type: 'CPC', status: 'active', statusText: 'активна', typeDetails: '', budget: 300000, remainingBudget: 800, dailyLimit: 1500, dailyLimitExhausted: true, autoRefill: false, spend: 100350, impressions: 324580, ctr: 1.2, orders: 89, spendShare: 15.8, tag: 'warning', campaignTags: ['Регулярный ассортимент'] }] },
  { id: 'pr3', name: 'Платье-футляр "Офис"', article: '1001003', category: 'Платья', brand: 'H&M', image: 'https://placehold.co/64x64/E9D5FF/4C1D95?text=3', tags: ['Регулярный ассортимент'], campaigns: [{ type: 'CPM', status: 'active', statusText: 'активна', typeDetails: 'Единая', budget: 300000, remainingBudget: 3200, autoRefill: false, spend: 100350, impressions: 324580, ctr: 1.2, orders: 89, spendShare: 15.8, campaignTags: ['Регулярный ассортимент'] }] },
  { id: 'pr4', name: 'Сарафан "Прованс"', article: '1001004', category: 'Платья', brand: 'H&M', image: 'https://placehold.co/64x64/E9D5FF/4C1D95?text=4', tags: [], campaigns: [{ type: 'CPM', status: 'paused', statusText: 'приостановлена', typeDetails: 'Ручная', budget: 300000, remainingBudget: 500, autoRefill: false, spend: 0, impressions: 0, ctr: 0, orders: 0, spendShare: 0, campaignTags: [] }] },
  { id: 'pr5', name: 'Платье с принтом "Флора"', article: '1001005', category: 'Платья', brand: 'Mango', image: 'https://placehold.co/64x64/E9D5FF/4C1D95?text=5', tags: ['Новинки'], campaigns: [{ type: 'CPM', status: 'active', statusText: 'активна', typeDetails: 'Ручная', budget: 300000, remainingBudget: 2100, autoRefill: false, spend: 80200, impressions: 250000, ctr: 1.1, orders: 75, spendShare: 14.1, campaignTags: ['Регулярный ассортимент'] }] },
  { id: 'pr6', name: 'Коктейльное платье "Шарм"', article: '1001006', category: 'Платья', brand: 'Reserved', image: 'https://placehold.co/64x64/E9D5FF/4C1D95?text=6', tags: [], campaigns: [{ type: 'CPC', status: 'draft', statusText: 'черновик', typeDetails: '', budget: 300000, remainingBudget: 4500, dailyLimit: 3000, dailyLimitExhausted: false, autoRefill: true, spend: 0, impressions: 0, ctr: 0, orders: 0, spendShare: 0, campaignTags: ['тест', 'Новинки'] }] },
  // Футболки (5)
  { id: 'pr7', name: 'Футболка базовая оверсайз', article: '2002001', category: 'Футболки', brand: 'Zara', image: 'https://placehold.co/64x64/BFDBFE/1E3A8A?text=7', tags: [], campaigns: [] },
  { id: 'pr8', name: 'Футболка с принтом "Лето"', article: '2002002', category: 'Футболки', brand: 'H&M', image: 'https://placehold.co/64x64/BFDBFE/1E3A8A?text=8', tags: ['Новинки'], campaigns: [{ type: 'CPC', status: 'active', statusText: 'активна', typeDetails: '', budget: 150000, remainingBudget: 8200, dailyLimit: 5000, dailyLimitExhausted: false, autoRefill: true, spend: 45000, impressions: 120000, ctr: 1.5, orders: 56, spendShare: 8.2, campaignTags: ['Регулярный ассортимент'] }] },
  { id: 'pr9', name: 'Футболка поло мужская', article: '2002003', category: 'Футболки', brand: 'Nike', image: 'https://placehold.co/64x64/BFDBFE/1E3A8A?text=9', tags: ['Регулярный ассортимент'], campaigns: [{ type: 'CPC', status: 'active', statusText: 'активна', typeDetails: 'Ручная', budget: 200000, remainingBudget: 11000, dailyLimit: 3000, dailyLimitExhausted: false, autoRefill: false, spend: 89000, impressions: 280000, ctr: 1.8, orders: 98, spendShare: 12.1, campaignTags: ['Регулярный ассортимент'] }, { type: 'CPM', status: 'paused', statusText: 'приостановлена', typeDetails: 'Единая', budget: 200000, remainingBudget: 200000, autoRefill: false, spend: 0, impressions: 0, ctr: 0, orders: 0, spendShare: 0, campaignTags: [] }] },
  { id: 'pr10', name: 'Футболка детская', article: '2002004', category: 'Футболки', brand: 'Decathlon', image: 'https://placehold.co/64x64/BFDBFE/1E3A8A?text=10', tags: [], campaigns: [] },
  { id: 'pr11', name: 'Футболка с длинным рукавом', article: '2002005', category: 'Футболки', brand: 'Reserved', image: 'https://placehold.co/64x64/BFDBFE/1E3A8A?text=11', tags: ['Регулярный ассортимент'], campaigns: [{ type: 'CPM', status: 'active', statusText: 'активна', typeDetails: 'Единая', budget: 180000, remainingBudget: 5400, autoRefill: false, spend: 72000, impressions: 190000, ctr: 1.2, orders: 67, spendShare: 10.5, campaignTags: [] }] },
  // Кроссовки (5)
  { id: 'pr12', name: 'Кроссовки беговые Air', article: '3003001', category: 'Кроссовки', brand: 'Nike', image: 'https://placehold.co/64x64/A7F3D0/065F46?text=12', tags: ['тест', 'Новинки'], campaigns: [{ type: 'CPC', status: 'active', statusText: 'активна', typeDetails: '', budget: 500000, remainingBudget: 12500, dailyLimit: 8000, dailyLimitExhausted: false, autoRefill: true, spend: 250000, impressions: 600000, ctr: 1.5, orders: 220, spendShare: 18.2, campaignTags: ['тест'] }, { type: 'CPM', status: 'active', statusText: 'активна', typeDetails: 'Единая', budget: 500000, remainingBudget: 380000, autoRefill: false, spend: 85000, impressions: 200000, ctr: 1.1, orders: 95, spendShare: 5.2, campaignTags: ['Новинки'], changeImpressions: 12.3, changeOrders: 7.3 }] },
  { id: 'pr13', name: 'Кроссовки повседневные', article: '3003002', category: 'Кроссовки', brand: 'Adidas', image: 'https://placehold.co/64x64/A7F3D0/065F46?text=13', tags: [], campaigns: [{ type: 'CPC', status: 'paused', statusText: 'приостановлена', typeDetails: '', budget: 220000, remainingBudget: 1100, dailyLimit: 2000, dailyLimitExhausted: true, autoRefill: false, spend: 215000, impressions: 300000, ctr: 1.8, orders: 110, spendShare: 22, tag: 'warning', campaignTags: ['Регулярный ассортимент'] }] },
  { id: 'pr14', name: 'Кроссовки для зала', article: '3003003', category: 'Кроссовки', brand: 'Nike', image: 'https://placehold.co/64x64/A7F3D0/065F46?text=14', tags: [], campaigns: [] },
  { id: 'pr15', name: 'Кроссовки трейловые', article: '3003004', category: 'Кроссовки', brand: 'Decathlon', image: 'https://placehold.co/64x64/A7F3D0/065F46?text=15', tags: ['Новинки'], campaigns: [{ type: 'CPM', status: 'active', statusText: 'активна', typeDetails: 'Ручная', budget: 120000, remainingBudget: 2400, autoRefill: false, spend: 30000, impressions: 100000, ctr: 0.8, orders: 40, spendShare: 10, campaignTags: [], tag: 'info' }] },
  { id: 'pr16', name: 'Кроссовки детские', article: '3003005', category: 'Кроссовки', brand: 'Adidas', image: 'https://placehold.co/64x64/A7F3D0/065F46?text=16', tags: [], campaigns: [{ type: 'CPC', status: 'draft', statusText: 'черновик', typeDetails: '', budget: 80000, remainingBudget: 80000, autoRefill: false, spend: 0, impressions: 0, ctr: 0, orders: 0, spendShare: 0, campaignTags: [] }] },
  // Сумки (4)
  { id: 'pr17', name: 'Сумка-шоппер "Эко"', article: '4004001', category: 'Сумки', brand: 'Zara', image: 'https://placehold.co/64x64/FED7AA/9A3412?text=17', tags: ['Распродажа'], campaigns: [{ type: 'CPM', status: 'error', statusText: 'приостановлена', typeDetails: 'Ручная', budget: 0, remainingBudget: 600, autoRefill: false, spend: 0, impressions: 0, ctr: 0, orders: 0, spendShare: 0, tag: 'error', campaignTags: ['Регулярный ассортимент'] }] },
  { id: 'pr18', name: 'Рюкзак городской', article: '4004002', category: 'Сумки', brand: 'H&M', image: 'https://placehold.co/64x64/FED7AA/9A3412?text=18', tags: ['Регулярный ассортимент'], campaigns: [{ type: 'CPC', status: 'active', statusText: 'активна', typeDetails: '', budget: 90000, remainingBudget: 3500, dailyLimit: 4000, dailyLimitExhausted: true, autoRefill: false, spend: 85000, impressions: 120000, ctr: 2.2, orders: 130, spendShare: 28, campaignTags: ['Новинки'] }, { type: 'CPM', status: 'active', statusText: 'активна', typeDetails: 'Единая', budget: 90000, remainingBudget: 41000, autoRefill: false, spend: 15000, impressions: 90000, ctr: 1, orders: 45, spendShare: 11.5, campaignTags: ['Регулярный ассортимент'] }] },
  { id: 'pr19', name: 'Клатч вечерний', article: '4004003', category: 'Сумки', brand: 'Mango', image: 'https://placehold.co/64x64/FED7AA/9A3412?text=19', tags: [], campaigns: [] },
  { id: 'pr20', name: 'Сумка кожаная "Классика"', article: '4004004', category: 'Сумки', brand: 'Reserved', image: 'https://placehold.co/64x64/FED7AA/9A3412?text=20', tags: ['Регулярный ассортимент'], campaigns: [{ type: 'CPM', status: 'active', statusText: 'активна', typeDetails: 'Ручная', budget: 75000, remainingBudget: 4100, autoRefill: false, spend: 15000, impressions: 90000, ctr: 1, orders: 45, spendShare: 11.5, campaignTags: ['Регулярный ассортимент'] }] },
  // Косметика (5)
  { id: 'pr21', name: 'Крем увлажняющий 50 мл', article: '5005001', category: 'Косметика', brand: "L'Oreal", image: 'https://placehold.co/64x64/FBCFE8/831843?text=21', tags: ['Регулярный ассортимент'], campaigns: [{ type: 'CPC', status: 'active', statusText: 'активна', typeDetails: '', budget: 200000, remainingBudget: 2600, dailyLimit: 3000, dailyLimitExhausted: false, autoRefill: false, spend: 0, impressions: 0, ctr: 0, orders: 0, spendShare: 0, campaignTags: [] }] },
  { id: 'pr22', name: 'Тушь для ресниц', article: '5005002', category: 'Косметика', brand: "L'Oreal", image: 'https://placehold.co/64x64/FBCFE8/831843?text=22', tags: [], campaigns: [{ type: 'CPM', status: 'active', statusText: 'активна', typeDetails: 'Единая', budget: 150000, remainingBudget: 88000, autoRefill: false, spend: 42000, impressions: 250000, ctr: 1.4, orders: 180, spendShare: 14.2, campaignTags: ['Новинки'] }] },
  { id: 'pr23', name: 'Набор подарочный', article: '5005003', category: 'Косметика', brand: 'Oriflame', image: 'https://placehold.co/64x64/FBCFE8/831843?text=23', tags: [], campaigns: [] },
  { id: 'pr24', name: 'Сыворотка для лица', article: '5005004', category: 'Косметика', brand: 'Oriflame', image: 'https://placehold.co/64x64/FBCFE8/831843?text=24', tags: ['Новинки'], campaigns: [{ type: 'CPC', status: 'active', statusText: 'активна', typeDetails: 'Ручная', budget: 180000, remainingBudget: 1700, dailyLimit: 2200, dailyLimitExhausted: false, autoRefill: true, spend: 95000, impressions: 280000, ctr: 1.3, orders: 92, spendShare: 16, campaignTags: [] }, { type: 'CPM', status: 'draft', statusText: 'черновик', typeDetails: 'Единая', budget: 180000, remainingBudget: 180000, autoRefill: false, spend: 0, impressions: 0, ctr: 0, orders: 0, spendShare: 0, campaignTags: [] }] },
  { id: 'pr25', name: 'Помада матовая', article: '5005005', category: 'Косметика', brand: "L'Oreal", image: 'https://placehold.co/64x64/FBCFE8/831843?text=25', tags: ['Регулярный ассортимент'], campaigns: [{ type: 'CPM', status: 'active', statusText: 'активна', typeDetails: 'Ручная', budget: 95000, remainingBudget: 12000, autoRefill: false, spend: 41000, impressions: 150000, ctr: 1.6, orders: 88, spendShare: 9.1, campaignTags: ['Регулярный ассортимент'] }] },
  // Товары для дома (5)
  { id: 'pr26', name: 'Набор полотенец 3 шт', article: '6006001', category: 'Товары для дома', brand: 'IKEA', image: 'https://placehold.co/64x64/DBEAFE/1E40AF?text=26', tags: [], campaigns: [] },
  { id: 'pr27', name: 'Настольная лампа', article: '6006002', category: 'Товары для дома', brand: 'Hoff', image: 'https://placehold.co/64x64/DBEAFE/1E40AF?text=27', tags: [], campaigns: [{ type: 'CPC', status: 'active', statusText: 'активна', typeDetails: '', budget: 50000, remainingBudget: 50000, dailyLimit: 2000, dailyLimitExhausted: false, autoRefill: false, spend: 0, impressions: 0, ctr: 0, orders: 0, spendShare: 0, campaignTags: [] }] },
  { id: 'pr28', name: 'Плед декоративный', article: '6006003', category: 'Товары для дома', brand: 'IKEA', image: 'https://placehold.co/64x64/DBEAFE/1E40AF?text=28', tags: ['Регулярный ассортимент'], campaigns: [{ type: 'CPM', status: 'active', statusText: 'активна', typeDetails: 'Единая', budget: 120000, remainingBudget: 2400, autoRefill: false, spend: 30000, impressions: 100000, ctr: 0.8, orders: 40, spendShare: 10, campaignTags: [], tag: 'info' }] },
  { id: 'pr29', name: 'Ваза керамическая', article: '6006004', category: 'Товары для дома', brand: 'Hoff', image: 'https://placehold.co/64x64/DBEAFE/1E40AF?text=29', tags: [], campaigns: [{ type: 'CPC', status: 'paused', statusText: 'приостановлена', typeDetails: '', budget: 60000, remainingBudget: 900, dailyLimit: 1500, dailyLimitExhausted: true, autoRefill: false, spend: 58000, impressions: 80000, ctr: 1.2, orders: 35, spendShare: 8.5, campaignTags: ['Регулярный ассортимент'] }] },
  { id: 'pr30', name: 'Набор посуды 6 персон', article: '6006005', category: 'Товары для дома', brand: 'IKEA', image: 'https://placehold.co/64x64/DBEAFE/1E40AF?text=30', tags: ['Регулярный ассортимент', 'Новинки'], campaigns: [{ type: 'CPC', status: 'active', statusText: 'активна', typeDetails: 'Ручная', budget: 400000, remainingBudget: 4900, dailyLimit: 5000, dailyLimitExhausted: false, autoRefill: false, spend: 390000, impressions: 800000, ctr: 1.1, orders: 150, spendShare: 19.5, campaignTags: ['Регулярный ассортимент'] }, { type: 'CPM', status: 'active', statusText: 'активна', typeDetails: 'Единая', budget: 400000, remainingBudget: 120000, autoRefill: false, spend: 180000, impressions: 450000, ctr: 1.2, orders: 210, spendShare: 12.1, campaignTags: ['Новинки'], changeImpressions: -5.2, changeOrders: 3.1 }] },
];
