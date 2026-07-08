export type CpcTopSearchClusterRow = {
  id: string;
  query: string;
  avgPosition: number;
  clicks: number;
  cart: number;
  orders: number;
  spendRub: number;
  impressions: number;
  cpc: number;
  /** Кластер не удерживает целевую позицию (предупреждение в таблице) */
  losesPosition?: boolean;
};

export const CPC_TOP_SEARCH_CLUSTERS_DATE_LABEL = '09.11.23 — 09.12.23';

export const CPC_TOP_SEARCH_CLUSTERS_TOTAL = {
  label: 'Всего по товару',
  avgPosition: 10.5,
  clicks: 953_214,
  cart: 30_165,
  orders: 128,
  spendRub: 75,
  impressions: 1488,
  cpc: 43.76,
} as const;

/** Демо-данные «Топ поисковых кластеров» (как в макете статистики) */
export const CPC_TOP_SEARCH_CLUSTERS_ROWS: CpcTopSearchClusterRow[] = [
  {
    id: '1',
    query: 'платье летнее женское',
    avgPosition: 10.5,
    clicks: 1_653,
    cart: 412,
    orders: 100,
    spendRub: 75,
    impressions: 1488,
    cpc: 43.76,
  },
  {
    id: '2',
    query: 'женское платье летнее',
    avgPosition: 10.5,
    clicks: 6_000,
    cart: 890,
    orders: 100,
    spendRub: 75,
    impressions: 1488,
    cpc: 43.76,
    losesPosition: true,
  },
  {
    id: '3',
    query: 'платье для девочки летнее',
    avgPosition: 10.5,
    clicks: 7_000,
    cart: 520,
    orders: 100,
    spendRub: 75,
    impressions: 1488,
    cpc: 43.76,
  },
  {
    id: '4',
    query: 'платье футляр летнее',
    avgPosition: 10.5,
    clicks: 100,
    cart: 24,
    orders: 100,
    spendRub: 75,
    impressions: 1488,
    cpc: 43.76,
  },
  {
    id: '5',
    query: 'черное платье летнее',
    avgPosition: 10.5,
    clicks: 100,
    cart: 18,
    orders: 100,
    spendRub: 75,
    impressions: 1488,
    cpc: 43.76,
  },
  {
    id: '6',
    query: 'черное платье полулетнее',
    avgPosition: 10.5,
    clicks: 100,
    cart: 15,
    orders: 100,
    spendRub: 75,
    impressions: 1488,
    cpc: 43.76,
    losesPosition: true,
  },
  {
    id: '7',
    query: 'платье летнее в рубчик',
    avgPosition: 10.5,
    clicks: 100,
    cart: 12,
    orders: 100,
    spendRub: 75,
    impressions: 1488,
    cpc: 43.76,
  },
  {
    id: '8',
    query: 'летнее платье с цветочным принтом',
    avgPosition: 10.5,
    clicks: 100,
    cart: 9,
    orders: 100,
    spendRub: 75,
    impressions: 1488,
    cpc: 43.76,
  },
  {
    id: '9',
    query: 'платье офисное летнее',
    avgPosition: 10.5,
    clicks: 100,
    cart: 11,
    orders: 100,
    spendRub: 75,
    impressions: 1488,
    cpc: 43.76,
  },
  {
    id: '10',
    query: 'летнее платье для полных женщин',
    avgPosition: 10.5,
    clicks: 100,
    cart: 14,
    orders: 100,
    spendRub: 75,
    impressions: 1488,
    cpc: 43.76,
  },
  {
    id: '11',
    query: 'платье миди летнее',
    avgPosition: 11.2,
    clicks: 86,
    cart: 8,
    orders: 4,
    spendRub: 12,
    impressions: 920,
    cpc: 41.2,
  },
  {
    id: '12',
    query: 'платье на выпускной летнее',
    avgPosition: 12.8,
    clicks: 64,
    cart: 6,
    orders: 2,
    spendRub: 9,
    impressions: 710,
    cpc: 39.5,
  },
];

export function countClustersLosingPosition(rows: CpcTopSearchClusterRow[]): number {
  return rows.filter((r) => r.losesPosition).length;
}
