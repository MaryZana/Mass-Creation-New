import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  type CampaignsInsightFilterKind,
  useCampaignsInsightFilter,
} from '../context/CampaignsInsightFilterContext';
import { ArrowUp, ChevronDown, ChevronRight, Sparkles } from '../components/Icons';

/** Ritm 4px grid — см. .cursor/rules/ritm-spacing.mdc */
const OV = {
  tight: 'gap-[4px]',
  inline: 'gap-2',
  group: 'gap-3',
  stack: 'gap-4',
  page: 'space-y-6',
  pageRow: 'gap-6',
  card: 'p-4',
  cardCompact: 'p-3',
  mtStack: 'mt-4',
  mtSection: 'mt-6',
} as const;

/** Полоса «Кампании с виджетами» — фиксированные px, без замера DOM. */
const MINI_WIDGETS_ROW_MIN_PX = 64;
const MINI_WIDGETS_ROW_GAP_PX = 8;
const MINI_WIDGETS_STATS_CHROME_PX = 48;
const MINI_WIDGETS_STRIP_HEIGHT_PX =
  MINI_WIDGETS_ROW_MIN_PX * 3 + MINI_WIDGETS_ROW_GAP_PX * 2 + MINI_WIDGETS_STATS_CHROME_PX;
const miniWidgetsStripHeightStyle: React.CSSProperties = {
  height: MINI_WIDGETS_STRIP_HEIGHT_PX,
  minHeight: MINI_WIDGETS_STRIP_HEIGHT_PX,
};
const miniWidgetsRowMinStyle: React.CSSProperties = { minHeight: MINI_WIDGETS_ROW_MIN_PX };

const INSIGHT_TABLE_CTA_CLASS =
  'inline-flex shrink-0 whitespace-nowrap rounded-lg border border-transparent bg-[#ececef] px-3 py-1.5 text-xs font-medium leading-none text-gray-700 transition-colors hover:bg-[#e2e2e6]';

const fmtRub = (n: number) =>
  new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n) + ' ₽';

const fmtNum = (n: number) => new Intl.NumberFormat('ru-RU').format(n);

/** Минус в тренде: ASCII `-`, unicode `−` (U+2212), en-dash `–`. */
function trendLooksLikeDecrease(trend: string): boolean {
  const t = trend.trim();
  return t.startsWith('-') || t.startsWith('−') || t.startsWith('–');
}

/** Для метрик вроде доли затрат снижение — хорошая динамика. */
function isTrendPositive(trend: string, lowerIsBetter: boolean): boolean {
  const down = trendLooksLikeDecrease(trend);
  return lowerIsBetter ? down : !down;
}

const OVERVIEW_PRODUCT_IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=160&h=160&fit=crop&q=80';

const OVERVIEW_IMG = {
  shirt: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=80&h=80&fit=crop&q=80',
  dress: 'https://images.unsplash.com/photo-1595777457583-95e059d58199?w=80&h=80&fit=crop&q=80',
  office: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=80&h=80&fit=crop&q=80',
  sarafan: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=80&h=80&fit=crop&q=80',
  bag: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=80&h=80&fit=crop&q=80',
  shoes: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=80&h=80&fit=crop&q=80',
} as const;

/** Портрет 30×38, как превью товара в списке кампаний (масштаб ~28×22). */
const OVERVIEW_PRODUCT_THUMB_CLASS = 'h-7 w-[22px]';

function OverviewProductImage({ src, sizeClass = OVERVIEW_PRODUCT_THUMB_CLASS }: { src: string; sizeClass?: string }) {
  const [resolvedSrc, setResolvedSrc] = useState(src);

  useEffect(() => {
    setResolvedSrc(src);
  }, [src]);

  return (
    <img
      src={resolvedSrc}
      alt=""
      className={`shrink-0 rounded-md object-cover bg-gray-100 ${sizeClass}`}
      onError={() => {
        if (resolvedSrc !== OVERVIEW_PRODUCT_IMAGE_FALLBACK) {
          setResolvedSrc(OVERVIEW_PRODUCT_IMAGE_FALLBACK);
        }
      }}
    />
  );
}

function OverviewProductTitleId({ name, id }: { name: string; id: string }) {
  return (
    <div className={`flex min-w-0 flex-col ${OV.tight}`}>
      <span
        className="block truncate text-xs font-medium leading-none text-gray-900"
      >
        {name}
      </span>
      <span className="block text-[10px] leading-none text-gray-400 tabular-nums">
        {id}
      </span>
    </div>
  );
}

type Period = 'd' | 'w' | '2w' | 'm';

type StatsMetricConfig = {
  title: string;
  value: string;
  trend: string;
  lowerIsBetter: boolean;
  points: number[];
  /** Динамика прошлого периода (пунктир на спарклайне) */
  previousPoints: number[];
};

type StatsPeriodConfig = {
  dateLabels: [string, string, string];
  metrics: StatsMetricConfig[];
};

const STATS_BY_PERIOD: Record<Period, StatsPeriodConfig> = {
  d: {
    dateLabels: ['00', '12', '24'],
    metrics: [
      {
        title: 'Доля затрат',
        value: '11,8%',
        trend: '−0,2 п.п. за день',
        lowerIsBetter: true,
        points: [74, 72, 73, 70, 69, 68, 66, 64],
        previousPoints: [76, 75, 74, 73, 72, 71, 70, 69],
      },
      {
        title: 'Сумма заказов',
        value: fmtRub(186_000),
        trend: '+4% · +7 200 ₽ за день',
        lowerIsBetter: false,
        points: [52, 54, 53, 56, 58, 57, 60, 62],
        previousPoints: [48, 49, 50, 51, 52, 53, 54, 55],
      },
      {
        title: 'Заказы',
        value: fmtNum(24),
        trend: '+3 · +1 за день',
        lowerIsBetter: false,
        points: [55, 56, 55, 57, 58, 57, 59, 61],
        previousPoints: [52, 53, 52, 54, 55, 54, 56, 57],
      },
    ],
  },
  w: {
    dateLabels: ['пн', 'чт', 'вс'],
    metrics: [
      {
        title: 'Доля затрат',
        value: '11,5%',
        trend: '−0,6 п.п. за неделю',
        lowerIsBetter: true,
        points: [86, 84, 82, 80, 78, 76, 72],
        previousPoints: [88, 87, 86, 85, 84, 83, 81],
      },
      {
        title: 'Сумма заказов',
        value: fmtRub(1_120_000),
        trend: '+9% · +92 000 ₽ за неделю',
        lowerIsBetter: false,
        points: [45, 48, 47, 52, 54, 58, 64],
        previousPoints: [40, 42, 41, 44, 46, 48, 52],
      },
      {
        title: 'Заказы',
        value: fmtNum(168),
        trend: '+4% · +7 за неделю',
        lowerIsBetter: false,
        points: [54, 55, 56, 57, 58, 60, 63],
        previousPoints: [51, 52, 52, 53, 54, 55, 57],
      },
    ],
  },
  '2w': {
    dateLabels: ['07', '14', '20'],
    metrics: [
      {
        title: 'Доля затрат',
        value: '11,2%',
        trend: '−1,4 п.п. за 2 недели',
        lowerIsBetter: true,
        points: [92, 88, 86, 84, 82, 80, 78, 76, 74, 72, 70, 68, 65, 62],
        previousPoints: [94, 92, 90, 88, 86, 84, 82, 80, 78, 76, 74, 72, 70, 68],
      },
      {
        title: 'Сумма заказов',
        value: fmtRub(4_280_000),
        trend: '+18% · +648 000 ₽ за 2 недели',
        lowerIsBetter: false,
        points: [48, 52, 50, 56, 58, 57, 63, 65, 64, 70, 72, 76, 80, 88],
        previousPoints: [42, 44, 43, 46, 48, 47, 50, 52, 51, 54, 56, 58, 62, 66],
      },
      {
        title: 'Заказы',
        value: fmtNum(692),
        trend: '+6% · +39 за 2 недели',
        lowerIsBetter: false,
        points: [58, 59, 60, 61, 60, 62, 64, 63, 65, 66, 67, 68, 70, 74],
        previousPoints: [55, 56, 56, 57, 57, 58, 59, 58, 60, 61, 62, 63, 64, 67],
      },
    ],
  },
  m: {
    dateLabels: ['1', '15', '30'],
    metrics: [
      {
        title: 'Доля затрат',
        value: '10,9%',
        trend: '−2,1 п.п. за месяц',
        lowerIsBetter: true,
        points: [96, 94, 90, 88, 86, 84, 82, 80, 78, 76, 74, 72, 70, 68, 66, 64],
        previousPoints: [98, 96, 94, 92, 90, 88, 86, 84, 82, 80, 78, 76, 74, 72, 70, 68],
      },
      {
        title: 'Сумма заказов',
        value: fmtRub(18_400_000),
        trend: '+24% · +3,6 млн ₽ за месяц',
        lowerIsBetter: false,
        points: [40, 42, 44, 46, 48, 50, 52, 54, 56, 60, 62, 66, 70, 74, 78, 85],
        previousPoints: [34, 36, 37, 38, 40, 41, 43, 44, 46, 48, 50, 52, 55, 58, 62, 66],
      },
      {
        title: 'Заказы',
        value: fmtNum(2_840),
        trend: '+11% · +281 за месяц',
        lowerIsBetter: false,
        points: [50, 52, 53, 54, 55, 56, 57, 58, 59, 60, 62, 64, 66, 68, 70, 73],
        previousPoints: [46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 58, 60, 62, 64, 67],
      },
    ],
  },
};

type ChannelKey = 'promo' | 'influence' | 'media';

const PERIOD_LABELS: { id: Period; label: string }[] = [
  { id: 'd', label: 'Д' },
  { id: 'w', label: 'Н' },
  { id: '2w', label: '2Н' },
  { id: 'm', label: 'М' },
];

function PeriodToggle({
  value,
  onChange,
  className = '',
}: {
  value: Period;
  onChange: (p: Period) => void;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex rounded-xl bg-[#F2F2F7] p-0.5 text-xs font-semibold text-[#4A4D57] ${className}`}
      role="tablist"
    >
      {PERIOD_LABELS.map((p) => (
        <button
          key={p.id}
          type="button"
          role="tab"
          aria-selected={value === p.id}
          onClick={() => onChange(p.id)}
          className={`min-w-[2rem] rounded-[10px] px-2.5 py-1.5 transition-colors ${
            value === p.id ? 'bg-white text-gray-900 shadow-sm' : 'hover:text-gray-900'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

type AttentionTab = 'conv' | 'growth' | 'issues' | 'rating' | 'ab' | 'promo';

const ATTENTION_TAB_ITEMS: { id: AttentionTab; label: string; count: number }[] = [
  { id: 'conv', label: 'Хорошая конверсия', count: 12 },
  { id: 'growth', label: 'Хороший рост заказов', count: 4 },
  { id: 'issues', label: 'Проблемные кампании', count: 7 },
];

/** Вкладки блока «Требует внимания» на /campaigns-with-widgets */
export const ATTENTION_MINI_TABS_CAMPAIGNS: { id: AttentionTab; label: string; count: number }[] = [
  { id: 'conv', label: 'Рост конверсии', count: 12 },
  { id: 'growth', label: 'Рост заказов', count: 4 },
  { id: 'issues', label: 'Проблемные', count: 7 },
  { id: 'ab', label: 'А/Б тест', count: 2 },
  { id: 'promo', label: 'В акциях', count: 5 },
];

export const ATTENTION_MINI_TABS_PRODUCTS: { id: AttentionTab; label: string; count: number }[] = [
  { id: 'conv', label: 'Хорошая конверсия', count: 12 },
  { id: 'rating', label: 'Лучший рейтинг', count: 6 },
];

const ATTENTION_TAB_ROW_CTA: Record<AttentionTab, string | null> = {
  conv: 'Продвигать',
  growth: 'Пополнить бюджет',
  issues: null,
  rating: 'Продвигать',
  ab: 'Открыть',
  promo: 'Открыть',
};

/** Короткие подписи CTA в компактной таблице (без горизонтального скролла) */
const ATTENTION_TAB_ROW_CTA_COMPACT: Record<AttentionTab, string | null> = {
  conv: 'Продвигать',
  growth: 'Пополнить бюджет',
  issues: null,
  rating: 'Продвигать',
  ab: 'Продвигать',
  promo: 'Продвигать',
};

const ATTENTION_TAB_HEADERS_COMPACT: Record<AttentionTab, [string, string, string]> = {
  conv: ['CTR', 'Рост', 'CR в корзину'],
  growth: ['Заказы', 'Рост', ''],
  issues: ['ДРР', 'Затраты', 'Проблема'],
  rating: ['Рейтинг', 'Отзывы', 'Заказы'],
  ab: ['CTR', 'CR', 'Тест'],
  promo: ['Скидка WB', 'Заказы', 'Рост'],
};

type AttentionMetricCell = {
  value: string;
  trend?: string;
  trendUp?: boolean;
  muted?: boolean;
};

type AttentionProductRow = {
  id: string;
  name: string;
  image: string;
  col2: AttentionMetricCell;
  col3: AttentionMetricCell;
  col4: AttentionMetricCell;
};

type AttentionTabConfig = {
  headers: [string, string, string];
  rows: AttentionProductRow[];
};

/** Советы по метрике в колонке «Проблема» (таб проблемных кампаний) */
const ATTENTION_ISSUE_ADVICE: Record<string, string> = {
  Показы:
    'Поднимите ставки или расширьте семантику — так вернёте объём показов без смены карточки.',
  CTR: 'Обновите главное фото и заголовок, протестируйте 2–3 варианта креатива в кампании.',
  CR: 'Проверьте цену, остатки и первое фото — они сильнее всего влияют на CR в корзину.',
  ROAS: 'Снизьте ставки на слабые кластеры или отключите фразы с высоким ДРР и без заказов.',
  Заказы:
    'Сопоставьте динамику заказов с сезонностью категории и при необходимости перераспределите бюджет.',
};

const ATTENTION_BY_TAB: Record<AttentionTab, AttentionTabConfig> = {
  conv: {
    headers: ['CTR', 'Рост', 'CR в корзину'],
    rows: [
      {
        id: '312883517',
        name: 'Рюкзак школьный',
        image: OVERVIEW_IMG.bag,
        col2: { value: '28%', trendUp: true },
        col3: { value: '+34%', trend: 'за 2 недели', trendUp: true },
        col4: { value: '+128%', trendUp: true },
      },
      {
        id: '1400001',
        name: 'Летнее платье «Ривьера»',
        image: OVERVIEW_IMG.dress,
        col2: { value: '24%', trendUp: true },
        col3: { value: '+28%', trend: 'за 2 недели', trendUp: true },
        col4: { value: '+96%', trendUp: true },
      },
      {
        id: '1400003',
        name: 'Платье-футляр «Офис»',
        image: OVERVIEW_IMG.office,
        col2: { value: '22%', trendUp: true },
        col3: { value: '+22%', trend: 'за 2 недели', trendUp: true },
        col4: { value: '+84%', trendUp: true },
      },
      {
        id: '7002002',
        name: 'Футболка с принтом «Лето»',
        image: OVERVIEW_IMG.shirt,
        col2: { value: '21%', trendUp: true },
        col3: { value: '+18%', trend: 'за 2 недели', trendUp: true },
        col4: { value: '+71%', trendUp: true },
      },
      {
        id: '6001002',
        name: 'Вечернее платье «Грация»',
        image: OVERVIEW_IMG.dress,
        col2: { value: '30%', trendUp: true },
        col3: { value: '+12%', trend: 'за 2 недели', trendUp: true },
        col4: { value: '+62%', trendUp: true },
      },
    ],
  },
  growth: {
    headers: ['Заказы', 'Рост заказов', 'Сезонность'],
    rows: [
      {
        id: '312883519',
        name: 'Кроссовки беговые',
        image: OVERVIEW_IMG.shoes,
        col2: { value: '186' },
        col3: { value: '+34%', trend: 'за 2 недели', trendUp: true },
        col4: { value: '+128%', trendUp: true },
      },
      {
        id: '1400009',
        name: 'Футболка хлопок мягкая',
        image: OVERVIEW_IMG.shirt,
        col2: { value: '142' },
        col3: { value: '+28%', trend: 'за 2 недели', trendUp: true },
        col4: { value: '+96%', trendUp: true },
      },
      {
        id: '312883518',
        name: 'Платье женское лён',
        image: OVERVIEW_IMG.dress,
        col2: { value: '98' },
        col3: { value: '+22%', trend: 'за 2 недели', trendUp: true },
        col4: { value: '+84%', trendUp: true },
      },
      {
        id: '6001001',
        name: 'Летнее платье «Ривьера»',
        image: OVERVIEW_IMG.dress,
        col2: { value: '76' },
        col3: { value: '+19%', trend: 'за 2 недели', trendUp: true },
        col4: { value: '+71%', trendUp: true },
      },
      {
        id: '1400005',
        name: 'Сарафан «Прованс»',
        image: OVERVIEW_IMG.sarafan,
        col2: { value: '54' },
        col3: { value: '+16%', trend: 'за 2 недели', trendUp: true },
        col4: { value: '+62%', trendUp: true },
      },
    ],
  },
  issues: {
    headers: ['ДРР', 'Затраты', 'Проблема'],
    rows: [
      {
        id: '1400004',
        name: 'Сарафан «Прованс»',
        image: OVERVIEW_IMG.sarafan,
        col2: { value: '22,4%', trend: '+4,1 п.п.', trendUp: false },
        col3: { value: '124 000 ₽' },
        col4: { value: 'Показы', trend: '↓ 18% за 2 нед.', trendUp: false },
      },
      {
        id: '1400006',
        name: 'Коктейльное платье «Шарм»',
        image: OVERVIEW_IMG.office,
        col2: { value: '19,8%', trend: '+2,8 п.п.', trendUp: false },
        col3: { value: '86 400 ₽' },
        col4: { value: 'CTR', trend: '↓ 0,6 п.п. за 2 нед.', trendUp: false },
      },
      {
        id: '7002003',
        name: 'Футболка поло мужская',
        image: OVERVIEW_IMG.shirt,
        col2: { value: '18,1%', trend: '+1,6 п.п.', trendUp: false },
        col3: { value: '62 000 ₽' },
        col4: { value: 'CR', trend: '↓ 0,9 п.п. за 2 нед.', trendUp: false },
      },
      {
        id: '1400008',
        name: 'Платье с принтом «Флора»',
        image: OVERVIEW_IMG.dress,
        col2: { value: '17,2%' },
        col3: { value: '48 200 ₽' },
        col4: { value: 'ROAS', trend: '↓ 11% за 2 нед.', trendUp: false },
      },
      {
        id: '1400010',
        name: 'Футболка oversize',
        image: OVERVIEW_IMG.shirt,
        col2: { value: '16,4%', trend: '+0,9 п.п.', trendUp: false },
        col3: { value: '41 800 ₽' },
        col4: { value: 'Показы', trend: '↓ 24% за 2 нед.', trendUp: false },
      },
      {
        id: '1400011',
        name: 'Джинсы slim fit',
        image: OVERVIEW_IMG.shirt,
        col2: { value: '15,8%', trend: '+0,5 п.п.', trendUp: false },
        col3: { value: '36 500 ₽' },
        col4: { value: 'Заказы', trend: '↓ 12% за 2 нед.', trendUp: false },
      },
      {
        id: '1400012',
        name: 'Куртка демисезон',
        image: OVERVIEW_IMG.bag,
        col2: { value: '14,9%' },
        col3: { value: '28 100 ₽' },
        col4: { value: 'CTR', trend: '↓ 1,4 п.п. за 2 нед.', trendUp: false },
      },
    ],
  },
  rating: {
    headers: ['Рейтинг', 'Отзывы', 'Заказы'],
    rows: [
      {
        id: '1400001',
        name: 'Летнее платье «Ривьера»',
        image: OVERVIEW_IMG.dress,
        col2: { value: '4,9' },
        col3: { value: '1 842' },
        col4: { value: '124', trend: '+18%', trendUp: true },
      },
      {
        id: '312883517',
        name: 'Рюкзак школьный',
        image: OVERVIEW_IMG.bag,
        col2: { value: '4,8' },
        col3: { value: '956' },
        col4: { value: '89', trend: '+9%', trendUp: true },
      },
      {
        id: '7002002',
        name: 'Футболка с принтом «Лето»',
        image: OVERVIEW_IMG.shirt,
        col2: { value: '4,8' },
        col3: { value: '612' },
        col4: { value: '76', trend: '+6%', trendUp: true },
      },
      {
        id: '1400003',
        name: 'Платье-футляр «Офис»',
        image: OVERVIEW_IMG.office,
        col2: { value: '4,7' },
        col3: { value: '428' },
        col4: { value: '54', trend: '+4%', trendUp: true },
      },
    ],
  },
  ab: {
    headers: ['CTR', 'CR', 'Тест'],
    rows: [
      {
        id: '312883519',
        name: 'Кроссовки беговые',
        image: OVERVIEW_IMG.shoes,
        col2: { value: '2,9%', trend: '+0,3 п.п.', trendUp: true },
        col3: { value: '1,8%', trend: '+0,2 п.п.', trendUp: true },
        col4: { value: 'Тест 3 креативов', trend: 'Идет до 21 мая', trendUp: true },
      },
      {
        id: '1400009',
        name: 'Футболка хлопок мягкая',
        image: OVERVIEW_IMG.shirt,
        col2: { value: '2,4%', trend: '−0,1 п.п.', trendUp: false },
        col3: { value: '1,5%', trend: '+0,1 п.п.', trendUp: true },
        col4: { value: 'Тест 2 креативов', trend: 'Идет до 21 мая', trendUp: true },
      },
      {
        id: '1400003',
        name: 'Платье-футляр «Офис»',
        image: OVERVIEW_IMG.office,
        col2: { value: '3,1%', trend: '+0,2 п.п.', trendUp: true },
        col3: { value: '2,0%', trend: '+0,3 п.п.', trendUp: true },
        col4: { value: 'Тест 3 креативов', trend: 'Идет до 21 мая', trendUp: true },
      },
    ],
  },
  promo: {
    headers: ['Скидка WB', 'Заказы', 'Рост'],
    rows: [
      {
        id: '1400001',
        name: 'Летнее платье «Ривьера»',
        image: OVERVIEW_IMG.dress,
        col2: { value: '−15%', trendUp: true },
        col3: { value: '124', trend: '+18%', trendUp: true },
        col4: { value: '+7%', trend: 'за 2 недели', trendUp: true },
      },
      {
        id: '7002002',
        name: 'Футболка с принтом «Лето»',
        image: OVERVIEW_IMG.shirt,
        col2: { value: '−10%', trendUp: true },
        col3: { value: '76', trend: '+6%', trendUp: true },
        col4: { value: '+4%', trend: 'за 2 недели', trendUp: true },
      },
      {
        id: '312883517',
        name: 'Рюкзак школьный',
        image: OVERVIEW_IMG.bag,
        col2: { value: '−20%', trendUp: true },
        col3: { value: '89', trend: '+9%', trendUp: true },
        col4: { value: '+5%', trend: 'за 2 недели', trendUp: true },
      },
    ],
  },
};

function AttentionMetricTd({
  cell,
  compact,
  alignStart = false,
  hideTrend = false,
  valueClassName,
  trendClassName,
}: {
  cell: AttentionMetricCell;
  compact?: boolean;
  alignStart?: boolean;
  hideTrend?: boolean;
  valueClassName?: string;
  trendClassName?: string;
}) {
  const trendClass =
    cell.trendUp === false
      ? 'text-rose-600'
      : cell.trendUp
        ? 'text-emerald-600'
        : 'text-gray-400';
  return (
    <td className={`align-middle tabular-nums ${compact ? 'px-2 py-1.5' : 'px-2 py-2'}`}>
      <div
        className={`flex flex-col ${alignStart ? 'items-start' : 'items-end'} ${OV.tight} leading-none`}
      >
        <span
          className={`text-xs font-semibold ${
            valueClassName ?? (cell.muted ? 'text-gray-600' : 'text-gray-900')
          }`}
        >
          {cell.value}
        </span>
        {!hideTrend && cell.trend ? (
          <span
            className={`font-medium ${
              trendClassName ?? trendClass
            } ${compact ? 'text-[10px]' : 'mt-0.5 text-[10px]'}`}
          >
            {cell.trend}
          </span>
        ) : null}
      </div>
    </td>
  );
}

const ATTENTION_TIP_VIEWPORT_MARGIN = 8;
const ATTENTION_TIP_GAP = 6;

type AttentionTipPlacement = {
  top: number;
  left: number;
  maxHeight: number;
};

function AttentionProblemTd({
  cell,
  compact,
  advice,
}: {
  cell: AttentionMetricCell;
  compact?: boolean;
  advice: string;
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [tipPlacement, setTipPlacement] = useState<AttentionTipPlacement | null>(null);
  const trendClass =
    cell.trendUp === false
      ? 'text-rose-600'
      : cell.trendUp
        ? 'text-emerald-600'
        : 'text-gray-400';

  const syncTipPosition = useCallback(() => {
    const anchor = anchorRef.current;
    const tip = tipRef.current;
    if (!anchor) return;

    const ar = anchor.getBoundingClientRect();
    const margin = ATTENTION_TIP_VIEWPORT_MARGIN;
    const gap = ATTENTION_TIP_GAP;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tipWidth = Math.min(288, vw - margin * 2);
    const tipHeight = tip?.offsetHeight ?? 88;

    let top = ar.top - tipHeight - gap;
    if (top < margin) {
      top = ar.bottom + gap;
    }
    if (top + tipHeight > vh - margin) {
      top = Math.max(margin, vh - margin - tipHeight);
    }
    top = Math.max(margin, Math.min(top, vh - margin - 40));

    let left = ar.left;
    if (left + tipWidth > vw - margin) {
      left = vw - margin - tipWidth;
    }
    left = Math.max(margin, left);

    const maxHeight = Math.max(72, vh - top - margin);

    setTipPlacement({ top, left, maxHeight });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    syncTipPosition();
    const raf = requestAnimationFrame(() => syncTipPosition());
    const onScrollOrResize = () => syncTipPosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open, syncTipPosition, advice]);

  const tipPanel =
    open && tipPlacement ? (
      <div
        ref={tipRef}
        className="pointer-events-none fixed z-[200] w-[min(18rem,calc(100vw-1rem))]"
        style={{
          top: tipPlacement.top,
          left: tipPlacement.left,
          maxHeight: tipPlacement.maxHeight,
        }}
      >
        <div className="max-h-[inherit] overflow-y-auto overscroll-contain rounded-xl border border-gray-100 bg-white p-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0" role="img" aria-label="ИИ-рекомендация">
              <Sparkles className="h-4 w-4 text-[#9a41fe]" />
            </span>
            <p className="min-w-0 text-xs leading-snug text-gray-800">{advice}</p>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <td className={`align-middle ${compact ? 'px-2 py-1.5' : 'px-2 py-2'}`}>
      <div
        ref={anchorRef}
        className="inline-block max-w-full text-left"
        onMouseEnter={() => {
          const anchor = anchorRef.current;
          if (anchor) {
            const ar = anchor.getBoundingClientRect();
            setTipPlacement({
              top: Math.max(ATTENTION_TIP_VIEWPORT_MARGIN, ar.top - 100),
              left: Math.max(ATTENTION_TIP_VIEWPORT_MARGIN, ar.left),
              maxHeight: Math.min(200, window.innerHeight - ATTENTION_TIP_VIEWPORT_MARGIN * 2),
            });
          }
          setOpen(true);
        }}
        onMouseLeave={() => {
          setOpen(false);
          setTipPlacement(null);
        }}
      >
        <div className={`flex cursor-default flex-col items-start ${OV.tight} leading-none`}>
          <span className="text-xs font-semibold text-gray-900">{cell.value}</span>
          {cell.trend ? (
            <span className={`text-[10px] font-medium ${trendClass}`}>{cell.trend}</span>
          ) : null}
        </div>
      </div>
      {typeof document !== 'undefined' && tipPanel
        ? createPortal(tipPanel, document.body)
        : null}
    </td>
  );
}

function AttentionProductsTable({
  tab,
  maxRows,
  compact,
}: {
  tab: AttentionTab;
  maxRows?: number;
  /** Плотная таблица (страница «Кампании с виджетами») */
  compact?: boolean;
}) {
  const { headers, rows } = ATTENTION_BY_TAB[tab];
  const visibleRows = maxRows != null ? rows.slice(0, maxRows) : rows;
  const tight = compact ?? maxRows != null;
  const rowCtaLabel = compact
    ? ATTENTION_TAB_ROW_CTA_COMPACT[tab]
    : ATTENTION_TAB_ROW_CTA[tab];
  const showRowCta = rowCtaLabel != null;
  const displayHeaders = compact ? ATTENTION_TAB_HEADERS_COMPACT[tab] : headers;
  const hideThirdMetricColumn = compact && tab === 'growth';
  const cellPad = tight ? 'px-1.5 py-1.5' : 'px-2 py-2';
  const headPad = tight ? 'px-1.5 py-1.5' : 'px-2 py-1.5';

  if (tight && tab === 'issues') {
    const shortIssueLabel = (value: string) => {
      const v = value.trim();
      if (v === 'Показы') return 'Мало показов';
      if (v === 'CTR') return 'Низкий CTR';
      if (v === 'CR') return 'Низкий CR';
      if (v === 'ROAS') return 'Низкий ROAS';
      if (v === 'Заказы') return 'Мало заказов';
      return v;
    };

    const issueMetricValue = (value: string) => {
      const v = value.trim();
      // Intentionally "low" demo values for the compact widget.
      if (v === 'Показы') return '5';
      if (v === 'CTR') return '0,6%';
      if (v === 'CR') return '0,4%';
      if (v === 'ROAS') return '38%';
      if (v === 'Заказы') return '2';
      return '—';
    };

    const shortAdviceLabel = (value: string) => {
      const v = value.trim();
      if (v === 'Показы') return 'Поднять ставки';
      if (v === 'CTR') return 'Сменить фото';
      if (v === 'CR') return 'Проверить цену';
      if (v === 'ROAS') return 'Снизить ставки';
      if (v === 'Заказы') return 'Проверить спрос';
      return 'Что делать';
    };

    return (
      <table className="w-full min-w-0 table-fixed border-collapse text-left text-xs">
        <colgroup>
          <col style={{ width: '42%' }} />
          <col style={{ width: '24%' }} />
          <col style={{ width: '34%' }} />
        </colgroup>
        <thead className="sticky top-0 z-[1] bg-white">
          <tr className="text-[10px] leading-none text-gray-500">
            <th className={`${headPad} text-left font-medium`}>Кампания</th>
            <th className={`${headPad} text-left font-medium`}>Проблема</th>
            <th className={`${headPad} text-left font-medium`}>Совет</th>
          </tr>
        </thead>
        <tbody className="[&_td]:align-middle">
          {visibleRows.map((row) => (
            <tr key={row.id} className="border-t border-gray-50 hover:bg-gray-50/60">
              <td className={`${cellPad} min-w-0`}>
                <div className={`flex min-w-0 items-center ${tight ? 'gap-1.5' : OV.inline}`}>
                  <OverviewProductImage src={row.image} />
                  <OverviewProductTitleId name={row.name} id={row.id} />
                </div>
              </td>
              <td className={`${cellPad} min-w-0`}>
                <div className={`flex min-w-0 flex-col ${OV.tight} leading-none`}>
                  <span className="block truncate text-xs font-semibold text-gray-900">
                    {issueMetricValue(row.col4.value)}
                  </span>
                  <span className="block truncate text-[10px] font-medium text-gray-400">
                    {shortIssueLabel(row.col4.value)}
                  </span>
                </div>
              </td>
              <AttentionProblemTd
                cell={{ ...row.col4, value: shortAdviceLabel(row.col4.value), trend: undefined }}
                compact={tight}
                advice={
                  ATTENTION_ISSUE_ADVICE[row.col4.value] ??
                  'Сверьте динамику с прошлым периодом и скорректируйте ставки или креативы.'
                }
              />
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (tight && tab === 'ab') {
    return (
      <table className="w-full min-w-0 table-fixed border-collapse text-left text-xs">
        <colgroup>
          <col style={{ width: '40%' }} />
          <col style={{ width: '42%' }} />
          <col style={{ width: '18%' }} />
        </colgroup>
        <thead className="sticky top-0 z-[1] bg-white">
          <tr className="text-[10px] leading-none text-gray-500">
            <th className={`${headPad} text-left font-medium`}>Кампания</th>
            <th className={`${headPad} text-left font-medium`}>Тест</th>
            <th className={headPad} />
          </tr>
        </thead>
        <tbody className="[&_td]:align-middle">
          {visibleRows.map((row) => (
            <tr key={row.id} className="border-t border-gray-50 hover:bg-gray-50/60">
              <td className={`${cellPad} min-w-0`}>
                <div className={`flex min-w-0 items-center ${tight ? 'gap-1.5' : OV.inline}`}>
                  <OverviewProductImage src={row.image} />
                  <OverviewProductTitleId name={row.name} id={row.id} />
                </div>
              </td>
              <AttentionMetricTd cell={row.col4} compact={tight} alignStart />
              <td className={`${cellPad} min-w-0 pl-3 text-right`}>
                <button type="button" className={INSIGHT_TABLE_CTA_CLASS}>
                  Продвигать
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (tight && tab === 'conv') {
    return (
      <table className="w-full min-w-0 table-fixed border-collapse text-left text-xs">
        <colgroup>
          <col style={{ width: '38%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '24%' }} />
          <col style={{ width: '22%' }} />
        </colgroup>
        <thead className="sticky top-0 z-[1] bg-white">
          <tr className="text-[10px] leading-none text-gray-500">
            <th className={`${headPad} text-left font-medium`}>Кампания</th>
            <th className={`${headPad} text-right font-medium`}>CTR</th>
            <th className={`${headPad} text-right font-medium`}>Рост</th>
            <th className={headPad} />
          </tr>
        </thead>
        <tbody className="[&_td]:align-middle">
          {visibleRows.map((row) => (
            <tr key={row.id} className="border-t border-gray-50 hover:bg-gray-50/60">
              <td className={`${cellPad} min-w-0`}>
                <div className={`flex min-w-0 items-center ${tight ? 'gap-1.5' : OV.inline}`}>
                  <OverviewProductImage src={row.image} />
                  <OverviewProductTitleId name={row.name} id={row.id} />
                </div>
              </td>
              <AttentionMetricTd cell={row.col2} compact={tight} hideTrend />
              <AttentionMetricTd
                cell={row.col3}
                compact={tight}
                valueClassName="text-emerald-600"
                trendClassName="text-gray-400"
              />
              <td className={`${cellPad} min-w-0 pl-3 text-right`}>
                <button type="button" className={INSIGHT_TABLE_CTA_CLASS}>
                  Продвигать
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <table className="w-full min-w-0 table-fixed border-collapse text-left text-xs">
      <colgroup>
        {compact && showRowCta && hideThirdMetricColumn ? (
          <>
            <col style={{ width: '32%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '32%' }} />
          </>
        ) : compact && showRowCta ? (
          <>
            <col style={{ width: '26%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '32%' }} />
          </>
        ) : compact && hideThirdMetricColumn ? (
          <>
            <col style={{ width: '40%' }} />
            <col style={{ width: '30%' }} />
            <col style={{ width: '30%' }} />
          </>
        ) : compact ? (
          <>
            <col style={{ width: '34%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '34%' }} />
          </>
        ) : (
          <>
            <col style={{ width: showRowCta ? '38%' : '42%' }} />
            <col style={{ width: showRowCta ? '14%' : '16%' }} />
            <col style={{ width: showRowCta ? '14%' : '16%' }} />
            <col style={{ width: showRowCta ? (tab === 'issues' ? '16%' : '14%') : '26%' }} />
            {showRowCta ? <col style={{ width: '6.75rem' }} /> : null}
          </>
        )}
      </colgroup>
      <thead className="sticky top-0 z-[1] bg-white">
        <tr className="text-[10px] leading-none text-gray-500">
          <th className={`${headPad} text-left font-medium`}>Кампания</th>
          <th className={`${headPad} text-right font-medium`}>{displayHeaders[0]}</th>
          <th className={`${headPad} text-right font-medium`}>{displayHeaders[1]}</th>
          {!hideThirdMetricColumn ? (
            <th
              className={`${headPad} font-medium ${tab === 'issues' ? 'text-left' : 'text-right'}`}
            >
              {displayHeaders[2]}
            </th>
          ) : null}
          {showRowCta ? <th className={headPad} /> : null}
        </tr>
      </thead>
      <tbody className="[&_td]:align-middle">
        {visibleRows.map((row) => (
          <tr key={row.id} className="border-t border-gray-50 hover:bg-gray-50/60">
            <td className={`${cellPad} min-w-0`}>
              <div className={`flex min-w-0 items-center ${tight ? 'gap-1.5' : OV.inline}`}>
                <OverviewProductImage src={row.image} />
                <OverviewProductTitleId name={row.name} id={row.id} />
              </div>
            </td>
            <AttentionMetricTd cell={row.col2} compact={tight} hideTrend={tab === 'conv'} />
            <AttentionMetricTd cell={row.col3} compact={tight} hideTrend={tab === 'conv'} />
            {!hideThirdMetricColumn ? (
              tab === 'issues' ? (
                <AttentionProblemTd
                  cell={row.col4}
                  compact={tight}
                  advice={
                    ATTENTION_ISSUE_ADVICE[row.col4.value] ??
                    'Сверьте динамику с прошлым периодом и скорректируйте ставки или креативы.'
                  }
                />
              ) : (
                <AttentionMetricTd cell={row.col4} compact={tight} hideTrend={tab === 'conv'} />
              )
            ) : null}
            {showRowCta ? (
              <td className={`min-w-0 text-right align-middle ${cellPad}`}>
                <button
                  type="button"
                  className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-lg bg-[#ececef] font-medium leading-none text-gray-700 transition-colors hover:bg-[#e2e2e6] ${
                    tight ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-1.5 text-xs'
                  }`}
                >
                  {rowCtaLabel}
                </button>
              </td>
            ) : null}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AttentionTabToggle({
  value,
  onChange,
  items = ATTENTION_TAB_ITEMS,
  className = '',
  ariaLabel = 'Фильтр кампаний',
}: {
  value: AttentionTab;
  onChange: (tab: AttentionTab) => void;
  items?: { id: AttentionTab; label: string; count: number }[];
  className?: string;
  ariaLabel?: string;
}) {
  const resolvedItems = useMemo(
    () =>
      items.map((tab) => ({
        ...tab,
        count: ATTENTION_BY_TAB[tab.id]?.rows?.length ?? tab.count,
      })),
    [items],
  );
  return (
    <div
      className={`inline-flex max-w-full flex-wrap rounded-xl bg-[#F2F2F7] p-0.5 text-xs font-semibold text-[#4A4D57] ${className}`}
      role="tablist"
      aria-label={ariaLabel}
    >
      {resolvedItems.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={`whitespace-nowrap rounded-[10px] px-2.5 py-1.5 transition-colors ${
            value === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'hover:text-gray-900'
          }`}
        >
          {tab.label}{' '}
          <span className="font-semibold tabular-nums text-gray-400">{tab.count}</span>
        </button>
      ))}
    </div>
  );
}

const QUICK_ACTION_ICON_CLASS = 'h-5 w-5 shrink-0 text-gray-900';

function QuickActionPromoIcon() {
  return (
    <svg
      className={QUICK_ACTION_ICON_CLASS}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m3 11 18-5v12L3 14v-3z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  );
}

function QuickActionBloggersIcon() {
  return (
    <svg
      className={QUICK_ACTION_ICON_CLASS}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function QuickActionBannerIcon() {
  return (
    <svg
      className={QUICK_ACTION_ICON_CLASS}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 15h4" />
      <path d="M7 11h10" />
    </svg>
  );
}

const OVERVIEW_QUICK_ACTIONS: { label: string; icon: React.ReactNode }[] = [
  { label: 'Продвигать карточку', icon: <QuickActionPromoIcon /> },
  { label: 'Продвигать у блогеров', icon: <QuickActionBloggersIcon /> },
  { label: 'Разместить баннера', icon: <QuickActionBannerIcon /> },
];

function OverviewQuickActions() {
  return (
    <nav aria-label="Быстрые действия" className={`mt-[20px] flex flex-col ${OV.inline}`}>
      <p className="text-xs font-medium leading-none text-gray-500">Быстрые действия</p>
      <ul className={`flex flex-col ${OV.stack}`}>
        {OVERVIEW_QUICK_ACTIONS.map((item) => (
          <li key={item.label}>
            <button
              type="button"
              className={`flex w-full items-center text-left ${OV.group} rounded-lg py-0.5 transition-colors hover:opacity-80`}
            >
              {item.icon}
              <span className="text-sm font-bold leading-snug text-gray-900">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function RitmButton({
  children,
  className = '',
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl bg-[#F2F2F7] px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-[#E8E8ED] ${className}`}
    >
      {children}
    </button>
  );
}

function TrendPill({ value, positive }: { value: string; positive?: boolean }) {
  const up = positive ?? !trendLooksLikeDecrease(value);
  return (
    <span className={`text-xs font-medium ${up ? 'text-emerald-600' : 'text-rose-600'}`}>
      {value}
    </span>
  );
}

/** Подписи оси Y спарклайна (шкала points — условная, привязана к типу метрики). */
function formatSparklineYAxisValue(metricTitle: string, chartValue: number): string {
  switch (metricTitle) {
    case 'Доля затрат':
      return `${(chartValue / 6.5).toFixed(1).replace('.', ',')}%`;
    case 'Заказы':
      return fmtNum(Math.round(chartValue * 9.5));
    case 'Сумма заказов': {
      const rub = Math.round(chartValue * 55_000);
      if (rub >= 1_000_000) {
        const m = rub / 1_000_000;
        const s = m >= 10 ? String(Math.round(m)) : m.toFixed(1).replace('.', ',');
        return `${s} млн`;
      }
      return fmtNum(rub);
    }
    default:
      return String(Math.round(chartValue));
  }
}

function sparklineSmoothPath(vals: number[], w: number, h: number, min: number, range: number): string {
  const coords = vals.map((v, i) => ({
    x: (i / (vals.length - 1)) * w,
    y: h - ((v - min) / range) * (h - 8) - 4,
  }));
  if (coords.length < 2) return '';
  if (coords.length === 2) {
    return `M ${coords[0].x} ${coords[0].y} L ${coords[1].x} ${coords[1].y}`;
  }
  let d = `M ${coords[0].x} ${coords[0].y}`;
  const tension = 0.32;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[Math.max(0, i - 1)];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[Math.min(coords.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function MiniSparkline({
  points,
  previousPoints,
  stroke,
  className = '',
  dense = false,
  showYAxis = false,
  axisMetricTitle,
}: {
  points: number[];
  previousPoints: number[];
  stroke: string;
  className?: string;
  /** Компактный спарклайн (кампании с виджетами) — толще текущая линия */
  dense?: boolean;
  /** Подписи min / mid / max слева от графика */
  showYAxis?: boolean;
  axisMetricTitle?: string;
}) {
  const w = 280;
  const h = 56;
  const scaleValues = [...points, ...previousPoints];
  const min = Math.min(...scaleValues);
  const max = Math.max(...scaleValues);
  const mid = (min + max) / 2;
  const range = max - min || 1;
  const previousPath = sparklineSmoothPath(previousPoints, w, h, min, range);
  const currentPath = sparklineSmoothPath(points, w, h, min, range);

  const currentStrokeWidth = dense ? 6 : 2;

  const formatY =
    axisMetricTitle != null
      ? (v: number) => formatSparklineYAxisValue(axisMetricTitle, v)
      : (v: number) => String(Math.round(v));

  const svg = (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={showYAxis ? 'h-14 w-full' : `w-full h-14 ${className}`.trim()}
      preserveAspectRatio="none"
      aria-hidden={showYAxis || undefined}
    >
      <path
        fill="none"
        stroke="#D1D5DB"
        strokeWidth="2.5"
        strokeDasharray="3 3"
        strokeLinecap="round"
        strokeLinejoin="round"
        d={previousPath}
      />
      <path
        fill="none"
        stroke={stroke}
        strokeWidth={currentStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        d={currentPath}
      />
    </svg>
  );

  if (!showYAxis) {
    return svg;
  }

  return (
    <div className={`flex items-stretch gap-1.5 ${className}`}>
      <div
        className="flex w-10 shrink-0 flex-col justify-between py-0.5 text-right text-[10px] leading-none text-gray-400 tabular-nums"
        aria-hidden
      >
        <span>{formatY(max)}</span>
        <span>{formatY(mid)}</span>
        <span>{formatY(min)}</span>
      </div>
      <div className="min-w-0 flex-1">{svg}</div>
    </div>
  );
}

const DROPDOWN_SHOW = 'pointer-events-auto visible opacity-100';
const DROPDOWN_HIDE = 'pointer-events-none invisible opacity-0';

const INSIGHT_DROPDOWN_VIEWPORT_MARGIN = 8;
const INSIGHT_DROPDOWN_GAP = 6;

function InsightAlertDropdownFloater({
  open,
  anchorRef,
  align,
  variant,
  onPointerEnter,
  onPointerLeave,
}: {
  open: boolean;
  anchorRef: React.RefObject<HTMLDivElement | null>;
  align: 'start' | 'end';
  variant: 'budget' | 'stock' | 'launch';
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const syncPosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const ar = anchor.getBoundingClientRect();
    const panel = panelRef.current;
    const pw = panel?.offsetWidth ?? 520;
    const ph = panel?.offsetHeight ?? 300;
    const margin = INSIGHT_DROPDOWN_VIEWPORT_MARGIN;
    const gap = INSIGHT_DROPDOWN_GAP;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = align === 'end' ? ar.right - pw : ar.left;
    if (left < margin) left = margin;
    if (left + pw > vw - margin) left = Math.max(margin, vw - margin - pw);

    let top = ar.bottom + gap;
    if (top + ph > vh - margin) {
      top = Math.max(margin, ar.top - ph - gap);
    }

    setPos({ top, left });
  }, [align, anchorRef]);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    syncPosition();
    const raf = requestAnimationFrame(syncPosition);
    const onScrollOrResize = () => syncPosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open, syncPosition, variant]);

  if (!open || typeof document === 'undefined') return null;

  const displayPos =
    pos ??
    (() => {
      const ar = anchorRef.current?.getBoundingClientRect();
      if (!ar) return { top: 0, left: 0 };
      return { top: ar.bottom + INSIGHT_DROPDOWN_GAP, left: ar.left };
    })();

  return createPortal(
    <div
      className="fixed z-[200]"
      style={{ top: displayPos.top, left: displayPos.left }}
      onMouseEnter={onPointerEnter}
      onMouseLeave={onPointerLeave}
    >
      <div ref={panelRef}>
        <InsightAlertDropdownPanel variant={variant} />
      </div>
    </div>,
    document.body,
  );
}

function SegmentBars({
  items,
}: {
  items: { label: string; pct: number; color: string }[];
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3 text-xs">
          <span className="w-16 shrink-0 text-gray-500">{item.label}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#F2F2F7]">
            <div
              className="h-full rounded-full"
              style={{ width: `${item.pct}%`, backgroundColor: item.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

type SummaryBreakdownLine = { channelId: ChannelKey; name: string; value: string; color: string };

function SummaryMixBlock({
  label,
  items,
  breakdown,
}: {
  label: string;
  items: { label: string; pct: number; color: string }[];
  breakdown: SummaryBreakdownLine[];
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div
      className="relative overflow-visible"
      onMouseEnter={() => setDropdownOpen(true)}
      onMouseLeave={() => setDropdownOpen(false)}
    >
      <p className="mb-2 cursor-default text-xs font-medium text-gray-500">{label}</p>
      <SegmentBars items={items} />
      <div
        className={`absolute left-0 top-full z-[60] pt-1.5 ${dropdownOpen ? DROPDOWN_SHOW : DROPDOWN_HIDE}`}
      >
        <div className="min-w-[13.5rem] rounded-lg border border-gray-100 bg-white px-3 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
          <ul className="space-y-2 text-xs">
            {breakdown.map((line) => (
              <li key={line.channelId} className="flex items-center justify-between gap-4">
                <span className="flex min-w-0 items-center gap-1.5 text-gray-600">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: line.color }}
                    aria-hidden
                  />
                  <span className="truncate">{line.name}</span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-gray-900">{line.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

const CHANNEL_COLORS = {
  promo: '#9a41fe',
  influence: '#22c55e',
  media: '#3b82f6',
};

type BudgetCampaignRow = {
  id: string;
  name: string;
  image: string;
  shows: number;
  orders: number;
  ordersTrend: number;
};

const BUDGET_EMPTY_CAMPAIGNS: BudgetCampaignRow[] = [
  {
    id: '1400001',
    name: 'Летнее платье «Ривьера»',
    image: OVERVIEW_IMG.dress,
    shows: 842_000,
    orders: 12,
    ordersTrend: 8.4,
  },
  {
    id: '1400009',
    name: 'Футболка хлопок мягкая',
    image: OVERVIEW_IMG.shirt,
    shows: 1_120_000,
    orders: 6,
    ordersTrend: 5.2,
  },
  {
    id: '1400003',
    name: 'Платье-футляр «Офис»',
    image: OVERVIEW_IMG.office,
    shows: 506_000,
    orders: 4,
    ordersTrend: 12.1,
  },
];

type StockProductRow = {
  id: string;
  name: string;
  image: string;
  shows: number;
  stockLeft: number;
  lostPerDay: number;
};

const STOCK_OUT_PRODUCTS: StockProductRow[] = [
  {
    id: '7002003',
    name: 'Футболка поло мужская',
    image: OVERVIEW_IMG.shirt,
    shows: 612_000,
    stockLeft: 0,
    lostPerDay: 4,
  },
  {
    id: '1400004',
    name: 'Сарафан «Прованс»',
    image: OVERVIEW_IMG.sarafan,
    shows: 284_000,
    stockLeft: 0,
    lostPerDay: 2,
  },
];

type LaunchCampaignRow = {
  id: string;
  name: string;
  image: string;
  shows: number;
  ctr: number;
  seasonality: number;
};

const READY_TO_LAUNCH_CAMPAIGNS: LaunchCampaignRow[] = [
  {
    id: '312883517',
    name: 'Рюкзак школьный',
    image: OVERVIEW_IMG.bag,
    shows: 1_234_000,
    ctr: 23,
    seasonality: 1092,
  },
  {
    id: '312883518',
    name: 'Платье женское',
    image: OVERVIEW_IMG.dress,
    shows: 1_346_000,
    ctr: 10,
    seasonality: 1092,
  },
  {
    id: '1400002',
    name: 'Вечернее платье «Грация»',
    image: OVERVIEW_IMG.dress,
    shows: 892_000,
    ctr: 18,
    seasonality: 856,
  },
  {
    id: '6001001',
    name: 'CPC — Ривьера (тест)',
    image: OVERVIEW_IMG.dress,
    shows: 756_000,
    ctr: 15,
    seasonality: 920,
  },
  {
    id: '1400006',
    name: 'Коктейльное платье «Шарм»',
    image: OVERVIEW_IMG.office,
    shows: 428_000,
    ctr: 21,
    seasonality: 780,
  },
  {
    id: '1400007',
    name: 'Блуза шёлк премиум',
    image: OVERVIEW_IMG.sarafan,
    shows: 512_000,
    ctr: 14,
    seasonality: 640,
  },
  {
    id: '1400010',
    name: 'Футболка oversize',
    image: OVERVIEW_IMG.shirt,
    shows: 980_000,
    ctr: 19,
    seasonality: 710,
  },
];

function InsightAlertDropdownPanel({ variant }: { variant: 'budget' | 'stock' | 'launch' }) {
  if (variant === 'budget') {
    return (
      <div className="flex w-[min(92vw,560px)] min-w-[480px] max-w-[560px] flex-col rounded-2xl border border-gray-100 bg-white p-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
        <h3 className="shrink-0 text-base font-bold leading-snug text-gray-900">Кампании без бюджета</h3>
        <div className={`${OV.mtStack} max-h-[min(360px,50vh)] overflow-y-auto overscroll-contain`}>
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="text-[10px] leading-none text-gray-500">
                <th className="px-2 py-1 text-left font-medium">Кампания</th>
                <th className="px-2 py-1 text-left font-medium">Показы</th>
                <th className="px-2 py-1 text-left font-medium">Заказы</th>
                <th className="w-[9.5rem] px-2 py-1 text-right font-medium" />
              </tr>
            </thead>
            <tbody className="[&_td]:align-middle">
              {BUDGET_EMPTY_CAMPAIGNS.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/60">
                  <td className="px-2 py-3">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <OverviewProductImage src={row.image} />
                      <OverviewProductTitleId name={row.name} id={row.id} />
                    </div>
                  </td>
                  <td className="px-2 py-3 text-xs font-semibold tabular-nums text-gray-900">
                    {fmtNum(row.shows)}
                  </td>
                  <td className="px-2 py-3">
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <span className="text-xs font-semibold text-gray-900">{row.orders}</span>
                      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
                        <ArrowUp className="h-2.5 w-2.5" aria-hidden />+{row.ordersTrend}%
                      </span>
                    </span>
                  </td>
                  <td className="px-2 py-3 text-right">
                    <button type="button" className={INSIGHT_TABLE_CTA_CLASS}>
                      Пополнить бюджет
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (variant === 'stock') {
    return (
      <div className="flex w-[min(92vw,560px)] min-w-[480px] max-w-[560px] flex-col rounded-2xl border border-gray-100 bg-white p-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
        <h3 className="shrink-0 text-base font-bold leading-snug text-gray-900">Товары без остатков</h3>
        <div className={OV.mtStack}>
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="text-[10px] leading-none text-gray-500">
                <th className="px-2 py-1 text-left font-medium">Товар</th>
                <th className="px-2 py-1 text-left font-medium">Показы</th>
                <th className="px-2 py-1 text-left font-medium">Остаток</th>
                <th className="w-[9.5rem] px-2 py-1 text-right font-medium" />
              </tr>
            </thead>
            <tbody className="[&_td]:align-middle">
              {STOCK_OUT_PRODUCTS.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/60">
                  <td className="px-2 py-3">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <OverviewProductImage src={row.image} />
                      <OverviewProductTitleId name={row.name} id={row.id} />
                    </div>
                  </td>
                  <td className="px-2 py-3 text-xs font-semibold tabular-nums text-gray-900">
                    {fmtNum(row.shows)}
                  </td>
                  <td className="px-2 py-3 text-xs font-semibold text-rose-600 tabular-nums">
                    {row.stockLeft} шт.
                  </td>
                  <td className="px-2 py-3 text-right">
                    <button type="button" className={INSIGHT_TABLE_CTA_CLASS}>
                      Проверить остатки
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const launchRows = READY_TO_LAUNCH_CAMPAIGNS;
  return (
    <div className="flex w-[min(92vw,560px)] min-w-0 max-w-[min(560px,calc(100vw-1rem))] flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
      <h3 className="shrink-0 text-base font-bold leading-snug text-gray-900">Кампании готовы к запуску</h3>
      <div className={`${OV.mtStack} max-h-[min(360px,calc(100dvh-11rem))] overflow-y-auto overscroll-contain`}>
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="text-[10px] leading-none text-gray-500">
              <th className="px-2 py-1 text-left font-medium">Кампания</th>
              <th className="px-2 py-1 text-left font-medium">Показы</th>
              <th className="px-2 py-1 text-left font-medium">CTR</th>
              <th className="px-2 py-1 text-left font-medium">Сезонность</th>
              <th className="w-[88px] px-2 py-1" />
            </tr>
          </thead>
          <tbody className="[&_td]:align-middle">
            {launchRows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50/60">
                <td className="px-2 py-3">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <OverviewProductImage src={row.image} />
                    <OverviewProductTitleId name={row.name} id={row.id} />
                  </div>
                </td>
                <td className="px-2 py-3 text-xs font-semibold tabular-nums text-gray-900">
                  {fmtNum(row.shows)}
                </td>
                <td className="px-2 py-3 text-xs font-semibold tabular-nums text-gray-900">{row.ctr}%</td>
                <td className="px-2 py-3">
                  <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 tabular-nums">
                    <ArrowUp className="h-2.5 w-2.5" aria-hidden />+{fmtNum(row.seasonality)}%
                  </span>
                </td>
                <td className="px-2 py-3 text-right">
                  <button type="button" className={INSIGHT_TABLE_CTA_CLASS}>
                    Продвигать
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OverviewInsightAlertCard({
  icon,
  iconToneClassName,
  title,
  countLabel,
  subtitle,
  buttonLabel,
  panelVariant,
  dropdownAlign = 'start',
  compact = false,
  dense = false,
  onButtonClick,
}: {
  icon: React.ReactNode;
  iconToneClassName: string;
  title: string;
  countLabel: string;
  subtitle?: string;
  buttonLabel: string;
  panelVariant: 'budget' | 'stock' | 'launch';
  dropdownAlign?: 'start' | 'end';
  compact?: boolean;
  /** Одна строка — для полосы виджетов на списке кампаний */
  dense?: boolean;
  onButtonClick?: () => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownAnchorRef = useRef<HTMLDivElement>(null);
  const dropdownHoverDepthRef = useRef(0);

  const onDropdownPointerEnter = () => {
    dropdownHoverDepthRef.current += 1;
    setDropdownOpen(true);
  };

  const onDropdownPointerLeave = () => {
    dropdownHoverDepthRef.current = Math.max(0, dropdownHoverDepthRef.current - 1);
    window.setTimeout(() => {
      if (dropdownHoverDepthRef.current === 0) setDropdownOpen(false);
    }, 80);
  };

  const countBtnClass = dense
    ? 'text-xs'
    : compact
      ? 'text-sm'
      : 'text-base tracking-tight';
  const countChevronClass = dense
    ? 'h-3 w-3'
    : compact
      ? 'h-3 w-3'
      : 'h-3.5 w-3.5';

  const countDropdownTrigger = (
    <span
      ref={dropdownAnchorRef}
      className="relative inline-block max-w-full align-baseline"
      onMouseEnter={onDropdownPointerEnter}
      onMouseLeave={onDropdownPointerLeave}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className={`inline-flex max-w-full items-center gap-0.5 border-0 bg-transparent p-0 text-left font-bold leading-none text-gray-900 hover:text-[#7c3aed] ${countBtnClass}`}
        aria-expanded={dropdownOpen}
        onClick={() => setDropdownOpen((open) => !open)}
      >
        <span className="truncate">{countLabel}</span>
        <ChevronDown className={`shrink-0 text-gray-400 ${countChevronClass}`} aria-hidden />
      </button>
      <InsightAlertDropdownFloater
        open={dropdownOpen}
        anchorRef={dropdownAnchorRef}
        align={dropdownAlign}
        variant={panelVariant}
        onPointerEnter={onDropdownPointerEnter}
        onPointerLeave={onDropdownPointerLeave}
      />
    </span>
  );

  if (dense) {
    const clickable = Boolean(onButtonClick);
    return (
      <section
        style={miniWidgetsRowMinStyle}
        className={`flex flex-1 flex-col justify-center overflow-visible rounded-lg bg-white px-3 py-2 shadow-sm ${
          clickable ? 'cursor-pointer transition-colors hover:bg-gray-50/90' : ''
        }`}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={onButtonClick}
        onKeyDown={(e) => {
          if (!onButtonClick) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onButtonClick();
          }
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${iconToneClassName}`}
          >
            {icon}
          </div>
          <div className={`flex min-w-0 flex-1 flex-col items-start text-left ${OV.tight}`}>
            <p className="mb-0 w-full text-xs font-semibold leading-none text-gray-500">{title}</p>
            <span
              className={`block w-full truncate font-bold leading-none text-gray-900 ${countBtnClass}`}
            >
              {countLabel}
            </span>
            {subtitle ? (
              <p className="mb-0 w-full text-xs leading-tight text-gray-500">{subtitle}</p>
            ) : null}
          </div>
          {clickable ? (
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
          ) : null}
        </div>
      </section>
    );
  }

  const cardPad = compact ? 'p-2' : 'px-3 py-6';

  if (onButtonClick) {
    return (
      <section
        className={`flex h-full cursor-pointer flex-col overflow-visible rounded-[20px] bg-white shadow-sm transition-colors hover:bg-gray-50/90 ${cardPad}`}
        role="button"
        tabIndex={0}
        onClick={onButtonClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onButtonClick();
          }
        }}
      >
        <div className={`flex h-full flex-1 items-center ${compact ? 'gap-2' : OV.inline}`}>
          <div
            className={`flex shrink-0 items-center justify-center rounded-lg ${iconToneClassName} ${
              compact ? 'h-6 w-6' : 'h-8 w-8'
            }`}
          >
            {icon}
          </div>
          <div className={`flex min-h-0 min-w-0 flex-1 flex-col ${compact ? 'gap-2' : OV.stack}`}>
            <div className={`flex flex-col ${OV.tight}`}>
              <span
                className={`block font-medium leading-none text-gray-500 ${
                  compact ? 'text-[10px]' : 'text-xs'
                }`}
              >
                {title}
              </span>
              <span className={`block leading-none text-gray-600 ${compact ? 'text-[10px]' : 'text-xs'}`}>
                {countDropdownTrigger}
                {subtitle ? <span> · {subtitle}</span> : null}
              </span>
            </div>
          </div>
          <ChevronRight
            className={`shrink-0 text-gray-400 ${compact ? 'h-4 w-4' : 'h-5 w-5'}`}
            aria-hidden
          />
        </div>
      </section>
    );
  }

  return (
    <section
      className={`flex h-full flex-col overflow-visible rounded-[20px] bg-white shadow-sm ${cardPad}`}
    >
      <div className={`flex h-full flex-1 ${compact ? 'gap-2' : OV.inline}`}>
        <div
          className={`flex shrink-0 items-center justify-center rounded-lg ${iconToneClassName} ${
            compact ? 'h-6 w-6' : 'h-8 w-8'
          }`}
        >
          {icon}
        </div>
        <div className={`flex min-h-0 min-w-0 flex-1 flex-col ${compact ? 'gap-2' : OV.stack}`}>
          <div className={`flex flex-col ${OV.tight}`}>
            <span
              className={`block font-medium leading-none text-gray-500 ${
                compact ? 'text-[10px]' : 'text-xs'
              }`}
            >
              {title}
            </span>
            <span className={`block leading-none text-gray-600 ${compact ? 'text-[10px]' : 'text-xs'}`}>
              {countDropdownTrigger}
              {subtitle ? <span> · {subtitle}</span> : null}
            </span>
          </div>
          <RitmButton
            className={`mt-auto w-fit ${compact ? 'px-2.5 py-1 text-[11px]' : 'py-1.5 text-xs'}`}
          >
            {buttonLabel}
          </RitmButton>
        </div>
      </div>
    </section>
  );
}

const parseRoasPercent = (roas: string) => {
  const n = parseFloat(roas.replace('%', '').replace(',', '.').trim());
  return Number.isFinite(n) ? n : 0;
};

type ChannelSortKey = 'spend' | 'orders' | 'cpo' | 'roas';

const CHANNEL_BAR_LABEL_TO_ID: Record<string, ChannelKey> = {
  'Продв.': 'promo',
  'Инфл.': 'influence',
  'Медиа': 'media',
};

const CHANNEL_FULL_NAMES: Record<ChannelKey, string> = {
  promo: 'Продвижение',
  influence: 'Инфлюенс',
  media: 'Медиа',
};

const CHANNEL_ORDER: ChannelKey[] = ['promo', 'influence', 'media'];

/** Средний чек для оценки суммы заказов в сводных барах */
const ORDERS_SUM_AVG_RUB = 10_200;

type ChannelChildRow = {
  name: string;
  spend: number;
  orders: number;
  clicks: number;
  cpo: number;
  drr: string;
  roas: string;
};

type ChannelRowData = {
  id: ChannelKey;
  name: string;
  color: string;
  spend: number;
  orders: number;
  clicks: number;
  cpo: number;
  drr: string;
  roas: string;
  trend: string;
  children: ChannelChildRow[];
};

type SummaryMixBlock = {
  label: string;
  items: { label: string; pct: number; color: string }[];
};

const CHANNEL_DATA_BY_PERIOD: Record<Period, ChannelRowData[]> = {
  d: [
    {
      id: 'promo',
      name: 'Продвижение',
      color: CHANNEL_COLORS.promo,
      spend: 128_400,
      orders: 31,
      clicks: 19_800,
      cpo: 4_142,
      drr: '13,9%',
      roas: '318%',
      trend: '+4,2%',
      children: [
        { name: 'Поиск', spend: 78_200, orders: 19, clicks: 11_400, cpo: 4_116, drr: '13,4%', roas: '331%' },
        { name: 'Рекомендации', spend: 50_200, orders: 12, clicks: 8_400, cpo: 4_183, drr: '14,6%', roas: '292%' },
      ],
    },
    {
      id: 'influence',
      name: 'Инфлюенс',
      color: CHANNEL_COLORS.influence,
      spend: 44_800,
      orders: 15,
      clicks: 3_600,
      cpo: 2_987,
      drr: '11,1%',
      roas: '392%',
      trend: '+9,8%',
      children: [
        { name: 'Блогеры', spend: 29_400, orders: 10, clicks: 2_300, cpo: 2_940, drr: '10,8%', roas: '401%' },
        { name: 'Внешние площадки', spend: 15_400, orders: 5, clicks: 1_300, cpo: 3_080, drr: '11,9%', roas: '374%' },
      ],
    },
    {
      id: 'media',
      name: 'Медиа',
      color: CHANNEL_COLORS.media,
      spend: 20_600,
      orders: 6,
      clicks: 6_800,
      cpo: 3_433,
      drr: '17,2%',
      roas: '235%',
      trend: '-1,1%',
      children: [
        { name: 'Баннеры', spend: 12_400, orders: 3, clicks: 4_200, cpo: 4_133, drr: '18,1%', roas: '212%' },
        { name: 'Видео', spend: 8_200, orders: 3, clicks: 2_600, cpo: 2_733, drr: '15,4%', roas: '281%' },
      ],
    },
  ],
  w: [
    {
      id: 'promo',
      name: 'Продвижение',
      color: CHANNEL_COLORS.promo,
      spend: 912_000,
      orders: 208,
      clicks: 142_000,
      cpo: 4_385,
      drr: '14,0%',
      roas: '315%',
      trend: '+6,1%',
      children: [
        { name: 'Поиск', spend: 554_000, orders: 128, clicks: 81_000, cpo: 4_328, drr: '13,6%', roas: '329%' },
        { name: 'Рекомендации', spend: 358_000, orders: 80, clicks: 61_000, cpo: 4_475, drr: '14,7%', roas: '289%' },
      ],
    },
    {
      id: 'influence',
      name: 'Инфлюенс',
      color: CHANNEL_COLORS.influence,
      spend: 312_000,
      orders: 98,
      clicks: 24_100,
      cpo: 3_184,
      drr: '11,4%',
      roas: '388%',
      trend: '+11,2%',
      children: [
        { name: 'Блогеры', spend: 204_000, orders: 64, clicks: 15_600, cpo: 3_188, drr: '11,0%', roas: '395%' },
        { name: 'Внешние площадки', spend: 108_000, orders: 34, clicks: 8_500, cpo: 3_176, drr: '12,2%', roas: '371%' },
      ],
    },
    {
      id: 'media',
      name: 'Медиа',
      color: CHANNEL_COLORS.media,
      spend: 142_000,
      orders: 39,
      clicks: 46_200,
      cpo: 3_641,
      drr: '16,5%',
      roas: '246%',
      trend: '-1,8%',
      children: [
        { name: 'Баннеры', spend: 86_000, orders: 22, clicks: 29_000, cpo: 3_909, drr: '17,6%', roas: '221%' },
        { name: 'Видео', spend: 56_000, orders: 17, clicks: 17_200, cpo: 3_294, drr: '14,9%', roas: '278%' },
      ],
    },
  ],
  '2w': [
    {
      id: 'promo',
      name: 'Продвижение',
      color: CHANNEL_COLORS.promo,
      spend: 1_842_000,
      orders: 418,
      clicks: 284_000,
      cpo: 4_406,
      drr: '14,2%',
      roas: '312%',
      trend: '+8,4%',
      children: [
        { name: 'Поиск', spend: 1_120_000, orders: 256, clicks: 162_000, cpo: 4_375, drr: '13,8%', roas: '328%' },
        { name: 'Рекомендации', spend: 722_000, orders: 162, clicks: 122_000, cpo: 4_457, drr: '14,9%', roas: '286%' },
      ],
    },
    {
      id: 'influence',
      name: 'Инфлюенс',
      color: CHANNEL_COLORS.influence,
      spend: 628_000,
      orders: 196,
      clicks: 48_200,
      cpo: 3_204,
      drr: '11,6%',
      roas: '385%',
      trend: '+12,1%',
      children: [
        { name: 'Блогеры', spend: 412_000, orders: 128, clicks: 31_000, cpo: 3_219, drr: '11,2%', roas: '392%' },
        { name: 'Внешние площадки', spend: 216_000, orders: 68, clicks: 17_200, cpo: 3_176, drr: '12,4%', roas: '368%' },
      ],
    },
    {
      id: 'media',
      name: 'Медиа',
      color: CHANNEL_COLORS.media,
      spend: 286_000,
      orders: 78,
      clicks: 92_400,
      cpo: 3_667,
      drr: '16,8%',
      roas: '241%',
      trend: '-2,3%',
      children: [
        { name: 'Баннеры', spend: 174_000, orders: 44, clicks: 58_000, cpo: 3_955, drr: '17,9%', roas: '218%' },
        { name: 'Видео', spend: 112_000, orders: 34, clicks: 34_400, cpo: 3_294, drr: '14,6%', roas: '276%' },
      ],
    },
  ],
  m: [
    {
      id: 'promo',
      name: 'Продвижение',
      color: CHANNEL_COLORS.promo,
      spend: 3_960_000,
      orders: 892,
      clicks: 612_000,
      cpo: 4_439,
      drr: '14,6%',
      roas: '305%',
      trend: '+7,2%',
      children: [
        { name: 'Поиск', spend: 2_408_000, orders: 548, clicks: 348_000, cpo: 4_394, drr: '14,1%', roas: '321%' },
        { name: 'Рекомендации', spend: 1_552_000, orders: 344, clicks: 264_000, cpo: 4_512, drr: '15,3%', roas: '279%' },
      ],
    },
    {
      id: 'influence',
      name: 'Инфлюенс',
      color: CHANNEL_COLORS.influence,
      spend: 1_348_000,
      orders: 418,
      clicks: 103_800,
      cpo: 3_225,
      drr: '12,0%',
      roas: '378%',
      trend: '+10,4%',
      children: [
        { name: 'Блогеры', spend: 884_000, orders: 272, clicks: 66_800, cpo: 3_250, drr: '11,6%', roas: '384%' },
        { name: 'Внешние площадки', spend: 464_000, orders: 146, clicks: 37_000, cpo: 3_178, drr: '12,8%', roas: '361%' },
      ],
    },
    {
      id: 'media',
      name: 'Медиа',
      color: CHANNEL_COLORS.media,
      spend: 612_000,
      orders: 166,
      clicks: 198_000,
      cpo: 3_687,
      drr: '17,1%',
      roas: '233%',
      trend: '-3,1%',
      children: [
        { name: 'Баннеры', spend: 372_000, orders: 94, clicks: 124_000, cpo: 3_957, drr: '18,2%', roas: '209%' },
        { name: 'Видео', spend: 240_000, orders: 72, clicks: 74_000, cpo: 3_333, drr: '15,1%', roas: '268%' },
      ],
    },
  ],
};

const SUMMARY_MIX_BY_PERIOD: Record<Period, SummaryMixBlock[]> = {
  d: [
    {
      label: 'Трафик',
      items: [
        { label: 'Продв.', pct: 54, color: CHANNEL_COLORS.promo },
        { label: 'Инфл.', pct: 26, color: CHANNEL_COLORS.influence },
        { label: 'Медиа', pct: 20, color: CHANNEL_COLORS.media },
      ],
    },
    {
      label: 'Затраты',
      items: [
        { label: 'Продв.', pct: 66, color: CHANNEL_COLORS.promo },
        { label: 'Инфл.', pct: 23, color: CHANNEL_COLORS.influence },
        { label: 'Медиа', pct: 11, color: CHANNEL_COLORS.media },
      ],
    },
    {
      label: 'Заказы',
      items: [
        { label: 'Продв.', pct: 59, color: CHANNEL_COLORS.promo },
        { label: 'Инфл.', pct: 28, color: CHANNEL_COLORS.influence },
        { label: 'Медиа', pct: 13, color: CHANNEL_COLORS.media },
      ],
    },
  ],
  w: [
    {
      label: 'Трафик',
      items: [
        { label: 'Продв.', pct: 53, color: CHANNEL_COLORS.promo },
        { label: 'Инфл.', pct: 27, color: CHANNEL_COLORS.influence },
        { label: 'Медиа', pct: 20, color: CHANNEL_COLORS.media },
      ],
    },
    {
      label: 'Затраты',
      items: [
        { label: 'Продв.', pct: 67, color: CHANNEL_COLORS.promo },
        { label: 'Инфл.', pct: 23, color: CHANNEL_COLORS.influence },
        { label: 'Медиа', pct: 10, color: CHANNEL_COLORS.media },
      ],
    },
    {
      label: 'Заказы',
      items: [
        { label: 'Продв.', pct: 58, color: CHANNEL_COLORS.promo },
        { label: 'Инфл.', pct: 27, color: CHANNEL_COLORS.influence },
        { label: 'Медиа', pct: 15, color: CHANNEL_COLORS.media },
      ],
    },
  ],
  '2w': [
    {
      label: 'Трафик',
      items: [
        { label: 'Продв.', pct: 52, color: CHANNEL_COLORS.promo },
        { label: 'Инфл.', pct: 28, color: CHANNEL_COLORS.influence },
        { label: 'Медиа', pct: 20, color: CHANNEL_COLORS.media },
      ],
    },
    {
      label: 'Затраты',
      items: [
        { label: 'Продв.', pct: 67, color: CHANNEL_COLORS.promo },
        { label: 'Инфл.', pct: 23, color: CHANNEL_COLORS.influence },
        { label: 'Медиа', pct: 10, color: CHANNEL_COLORS.media },
      ],
    },
    {
      label: 'Заказы',
      items: [
        { label: 'Продв.', pct: 58, color: CHANNEL_COLORS.promo },
        { label: 'Инфл.', pct: 27, color: CHANNEL_COLORS.influence },
        { label: 'Медиа', pct: 15, color: CHANNEL_COLORS.media },
      ],
    },
  ],
  m: [
    {
      label: 'Трафик',
      items: [
        { label: 'Продв.', pct: 51, color: CHANNEL_COLORS.promo },
        { label: 'Инфл.', pct: 29, color: CHANNEL_COLORS.influence },
        { label: 'Медиа', pct: 20, color: CHANNEL_COLORS.media },
      ],
    },
    {
      label: 'Затраты',
      items: [
        { label: 'Продв.', pct: 68, color: CHANNEL_COLORS.promo },
        { label: 'Инфл.', pct: 22, color: CHANNEL_COLORS.influence },
        { label: 'Медиа', pct: 10, color: CHANNEL_COLORS.media },
      ],
    },
    {
      label: 'Заказы',
      items: [
        { label: 'Продв.', pct: 57, color: CHANNEL_COLORS.promo },
        { label: 'Инфл.', pct: 28, color: CHANNEL_COLORS.influence },
        { label: 'Медиа', pct: 15, color: CHANNEL_COLORS.media },
      ],
    },
  ],
};

const CHANNEL_INSIGHT_BY_PERIOD: Record<Period, React.ReactNode> = {
  d: (
    <>
      <span className="font-semibold">Инфлюенс лидирует за день</span> — на 23% бюджета приходится 28% заказов (+5 п.п. к
      доле трафика).
    </>
  ),
  w: (
    <>
      <span className="font-semibold">Инфлюенс эффективнее за неделю</span> — на 23% бюджета приходится 27% заказов (+4
      п.п. к доле трафика).
    </>
  ),
  '2w': (
    <>
      <span className="font-semibold">Инфлюенс эффективнее других</span> — на 23% бюджета приходится 27% заказов (+4 п.п.
      к доле трафика).
    </>
  ),
  m: (
    <>
      <span className="font-semibold">За месяц инфлюенс держит отдачу</span> — на 22% бюджета приходится 28% заказов (+6
      п.п. к доле трафика).
    </>
  ),
};

const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { applyFilter } = useCampaignsInsightFilter();

  const showInList = (kind: CampaignsInsightFilterKind, label: string) => () => {
    applyFilter(kind, label);
    navigate('/campaigns-with-widgets');
  };

  const [period, setPeriod] = useState<Period>('2w');
  const [chartPeriod, setChartPeriod] = useState<Period>('2w');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [attentionTab, setAttentionTab] = useState<AttentionTab>('conv');
  const [channelSort, setChannelSort] = useState<ChannelSortKey>('orders');
  const [channelSortDesc, setChannelSortDesc] = useState(true);

  const channelRows = useMemo(() => CHANNEL_DATA_BY_PERIOD[period], [period]);

  const bestChannelId = useMemo(() => {
    if (!channelRows.length) return null;
    return channelRows.reduce((best, row) => (row.cpo < best.cpo ? row : best)).id;
  }, [channelRows]);

  const toggleChannelSort = (key: ChannelSortKey) => {
    if (channelSort === key) {
      setChannelSortDesc((d) => !d);
    } else {
      setChannelSort(key);
      setChannelSortDesc(key !== 'cpo');
    }
  };

  const sortedChannelRows = useMemo(() => {
    const rows = [...channelRows];
    rows.sort((a, b) => {
      let cmp = 0;
      switch (channelSort) {
        case 'spend':
          cmp = a.spend - b.spend;
          break;
        case 'orders':
          cmp = a.orders - b.orders;
          break;
        case 'cpo':
          cmp = a.cpo - b.cpo;
          break;
        case 'roas':
          cmp = parseRoasPercent(a.roas) - parseRoasPercent(b.roas);
          break;
      }
      return channelSortDesc ? -cmp : cmp;
    });
    return rows;
  }, [channelRows, channelSort, channelSortDesc]);
  const summaryMix = useMemo(() => {
    const base = SUMMARY_MIX_BY_PERIOD[period];
    const rows = CHANNEL_DATA_BY_PERIOD[period];
    const rowById = Object.fromEntries(rows.map((r) => [r.id, r])) as Record<ChannelKey, ChannelRowData>;

    return base.map((block) => {
      const breakdown: SummaryBreakdownLine[] = CHANNEL_ORDER.map((channelId) => {
        const row = rowById[channelId];
        const barItem = block.items.find((i) => CHANNEL_BAR_LABEL_TO_ID[i.label] === channelId);
        let value = '';
        if (block.label === 'Трафик') {
          value = `${barItem?.pct ?? 0}%`;
        } else if (block.label === 'Затраты') {
          value = fmtRub(row.spend);
        } else {
          value = fmtRub(row.orders * ORDERS_SUM_AVG_RUB);
        }
        return {
          channelId,
          name: CHANNEL_FULL_NAMES[channelId],
          value,
          color: CHANNEL_COLORS[channelId],
        };
      });

      return {
        label: block.label,
        items: block.items,
        breakdown,
      };
    });
  }, [period]);
  const channelInsight = CHANNEL_INSIGHT_BY_PERIOD[period];
  const statsForPeriod = useMemo(() => STATS_BY_PERIOD[chartPeriod], [chartPeriod]);
  const promotionHealth = useMemo(() => {
    // Demo: fixed value for preview iterations.
    const score = 74;

    const label =
      score >= 85
        ? 'Отличное состояние'
        : score >= 70
          ? 'Хорошее состояние'
          : score >= 55
            ? 'Есть риски'
            : 'Нужно внимание';

    const hint =
      score >= 85
        ? 'Продолжайте в том же темпе — показатели выглядят устойчиво.'
        : score >= 70
          ? 'Пара точечных правок — и кабинет будет в идеальном состоянии.'
          : score >= 55
            ? 'Проверьте ставки и распределение бюджета — часть кампаний недополучает трафик.'
            : 'Сначала закройте критичные алерты: бюджет/остатки, затем оптимизируйте ставки.';

    const markerTone =
      score >= 85 ? 'bg-emerald-500' : score >= 70 ? 'bg-lime-500' : score >= 55 ? 'bg-amber-500' : 'bg-rose-500';

    return { score, label, hint, markerTone };
  }, []);

  const healthImproveItems = useMemo(() => {
    // Demo factors: replace with real inputs later (coverage/profit/roas/etc).
    const coveragePromoted = 100;
    const coverageTotal = 500;
    const profitWeeklyRub = 128_000;
    const profitTargetRub = 180_000;
    const roasPct = 292;
    const roasTargetPct = 320;

    const items = [
      {
        title: 'Покрытие ассортимента',
        subtitle: `Продвигаются ${coveragePromoted}/${coverageTotal} товаров`,
        weight: -(coverageTotal - coveragePromoted >= 250 ? 10 : coverageTotal - coveragePromoted >= 150 ? 8 : 5),
      },
      {
        title: 'Работа с кластерами',
        subtitle: 'Проверьте неэффективные кластера',
        weight: -(roasPct < roasTargetPct * 0.85 ? 8 : roasPct < roasTargetPct ? 5 : 1),
      },
      {
        title: 'Нехватка бюджета',
        subtitle: '3 кампании остановились из‑за бюджета',
        weight: -6,
      },
      {
        title: 'Остатки',
        subtitle: '2 товара с низкими остатками в рекламе',
        weight: -4,
      },
    ] as const;

    const impact = (w: number) =>
      Math.abs(w) >= 8 ? { label: 'Сильно влияет', tone: 'bg-rose-50 text-rose-700' }
      : Math.abs(w) >= 5 ? { label: 'Средне влияет', tone: 'bg-amber-50 text-amber-700' }
      : { label: 'Слабо влияет', tone: 'bg-emerald-50 text-emerald-700' };

    return items
      .map((it) => ({ ...it, impact: impact(it.weight) }))
      .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));
  }, []);

  const healthImproveHint = useMemo(() => {
    const top = healthImproveItems.slice(0, 2);
    if (top.length === 0) return '';
    const t0 = top[0]!.title;
    const t1 = top[1]?.title;
    if (!t1) return `В первую очередь улучшите: ${t0}`;
    return `Улучшите в первую очередь: ${t0}, ${t1}`;
  }, [healthImproveItems]);

  const recommendations: {
    title: string;
    body: string;
    action: string;
  }[] = [
    {
      title: 'Увеличить бюджет в инфлюенс',
      body: 'Инфлюенс приносит больше денег, чем другие каналы',
      action: 'Настроить бюджет',
    },
    {
      title: 'Запустить кампании из блока “Готовы к запуску”',
      body: 'Кампании уже настроены и готовы к запуску',
      action: 'Посмотреть и запустить',
    },
    {
      title: 'Добавьте товары с высоким рейтингом больше 4.8',
      body: 'Такие товары лучше конвертятся и дешевле в заказе',
      action: 'Смотреть товары',
    },
  ];

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-[#F3F5F8] px-7 py-4 pb-10 text-gray-900">
      <div className={`mx-auto max-w-[1440px] ${OV.page}`}>
        <div className={`flex ${OV.pageRow}`}>
          <aside className="hidden w-[13.5rem] shrink-0 self-stretch xl:block">
            <div className={`sticky top-14 z-30 flex flex-col ${OV.group}`}>
              <section className={`rounded-[20px] bg-white shadow-sm ${OV.cardCompact}`}>
                <button type="button" className="flex w-full items-center justify-between text-left">
                  <span className="text-xs font-semibold text-gray-900">Счёт</span>
                  <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                </button>
                <p className={`${OV.mtStack} text-xl font-bold leading-none tracking-tight`}>
                  {fmtRub(187_250)}
                </p>
                <RitmButton className={`mt-2 w-full py-1.5 text-xs`}>Пополнить</RitmButton>
              </section>

              <section className={`rounded-[20px] bg-white shadow-sm ${OV.cardCompact}`}>
                <button type="button" className="flex w-full items-center justify-between text-left">
                  <span className="text-xs font-semibold text-gray-900">Заработано бонусов</span>
                  <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                </button>
                <p className={`${OV.mtStack} flex items-baseline gap-2 leading-none tracking-tight`}>
                  <span className="text-xl font-bold tabular-nums text-gray-900">{fmtRub(1_280)}</span>
                  <span className="text-xs font-semibold text-gray-400 tabular-nums">
                    из {fmtRub(14_000)}
                  </span>
                </p>
                <p className="mt-1 flex items-center gap-1 text-[11px] font-medium leading-none text-gray-400">
                  <span aria-hidden>🔥</span> Сгорят 3 200 через 5 дней
                </p>
                <button
                  type="button"
                  className="mt-2 w-full rounded-xl bg-[#F2F2F7] px-4 py-1.5 text-xs font-semibold text-gray-900 transition-colors hover:bg-[#E8E8ED]"
                >
                  Потратить
                </button>
              </section>

              <OverviewQuickActions />
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className={`flex flex-col items-stretch gap-6 xl:flex-row xl:items-start ${OV.pageRow}`}>
              <div className={`min-w-0 flex-1 space-y-6`}>
                <div
                  className={`grid grid-cols-1 overflow-visible md:grid-cols-3 md:items-stretch ${OV.stack}`}
                >
                  <OverviewInsightAlertCard
                    icon={<AlertBudgetIcon />}
                    iconToneClassName="bg-rose-50 text-rose-600"
                    title="Закончился бюджет"
                    countLabel="3 кампании"
                    buttonLabel="Пополнить"
                    panelVariant="budget"
                    onButtonClick={showInList('budget', 'Закончился бюджет')}
                  />
                  <OverviewInsightAlertCard
                    icon={<AlertStockIcon />}
                    iconToneClassName="bg-amber-50 text-amber-600"
                    title="Закончились остатки"
                    countLabel="2 товара"
                    buttonLabel="Проверить"
                    panelVariant="stock"
                    onButtonClick={showInList('stock', 'Закончились остатки')}
                  />
                  <OverviewInsightAlertCard
                    icon={<AlertGrowthChartIcon />}
                    iconToneClassName="bg-[#9a41fe]/10 text-[#9a41fe]"
                    title="Готовы к запуску"
                    countLabel="7 кампаний"
                    buttonLabel="Продвигать"
                    panelVariant="launch"
                    dropdownAlign="end"
                    onButtonClick={showInList('launch', 'Готовы к запуску')}
                  />
                </div>

                <section className={`rounded-[20px] bg-white shadow-sm ${OV.card}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-bold">Статистика</h2>
                    <PeriodToggle value={chartPeriod} onChange={setChartPeriod} />
                  </div>
                  <div className={`${OV.mtStack} grid grid-cols-1 ${OV.pageRow} lg:grid-cols-3`}>
                    {statsForPeriod.metrics.map((m) => {
                      const trendPositive = isTrendPositive(m.trend, m.lowerIsBetter);
                      const sparkPositive =
                        m.points[m.points.length - 1] < m.points[0]
                          ? m.lowerIsBetter
                          : m.points[m.points.length - 1] > m.points[0]
                            ? !m.lowerIsBetter
                            : trendPositive;
                      return (
                        <div key={m.title}>
                          <p className="text-xs font-medium text-gray-500">{m.title}</p>
                          <p className="mt-1 text-2xl font-bold">{m.value}</p>
                          <TrendPill value={m.trend} positive={trendPositive} />
                          <MiniSparkline
                            points={m.points}
                            previousPoints={m.previousPoints}
                            stroke={sparkPositive ? '#22c55e' : '#ef4444'}
                            className="mt-3"
                            showYAxis
                            axisMetricTitle={m.title}
                          />
                          <div className="mt-1 flex justify-between pl-11 text-[10px] text-gray-400">
                            {statsForPeriod.dateLabels.map((label) => (
                              <span key={label}>{label}</span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className={`rounded-[20px] bg-white shadow-sm ${OV.card}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-bold">Обратите внимание</h2>
                    <AttentionTabToggle value={attentionTab} onChange={setAttentionTab} />
                  </div>
                  <div className={`${OV.mtStack} min-w-0 overflow-x-auto`}>
                    <AttentionProductsTable tab={attentionTab} />
                  </div>
                </section>

                <section className={`flex flex-col rounded-[20px] bg-white shadow-sm ${OV.card}`}>
                  <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
                    <h2 className="text-lg font-bold">Сравнение каналов продвижения</h2>
                    <PeriodToggle value={period} onChange={setPeriod} />
                  </div>

                  <div
                    className={`${OV.mtStack} flex shrink-0 items-start gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs leading-snug text-gray-800`}
                  >
                    <span className="shrink-0 text-emerald-600 leading-none" aria-hidden>
                      ✓
                    </span>
                    <p className="min-w-0 leading-snug">{channelInsight}</p>
                  </div>

                  <div className={`${OV.mtStack} grid shrink-0 grid-cols-1 ${OV.stack} overflow-visible sm:grid-cols-3`}>
                    {summaryMix.map((block) => (
                      <SummaryMixBlock
                        key={block.label}
                        label={block.label}
                        items={block.items}
                        breakdown={block.breakdown}
                      />
                    ))}
                  </div>

                  <div className={`${OV.mtStack} overflow-x-auto`}>
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 text-xs text-gray-500">
                          <th className="pb-2 pr-3 font-medium">Канал продвижения</th>
                          <th className="pb-2 pr-3 font-medium">
                            <ChannelTableSortHeader
                              label="Затраты"
                              sortKey="spend"
                              activeKey={channelSort}
                              desc={channelSortDesc}
                              onSort={toggleChannelSort}
                            />
                          </th>
                          <th className="pb-2 pr-3 font-medium">
                            <ChannelTableSortHeader
                              label="Заказы"
                              sortKey="orders"
                              activeKey={channelSort}
                              desc={channelSortDesc}
                              onSort={toggleChannelSort}
                            />
                          </th>
                          <th className="pb-2 pr-3 font-medium">Переходы</th>
                          <th className="pb-2 pr-3 font-medium">
                            <ChannelTableSortHeader
                              label="₽ за заказ"
                              sortKey="cpo"
                              activeKey={channelSort}
                              desc={channelSortDesc}
                              onSort={toggleChannelSort}
                            />
                          </th>
                          <th className="pb-2 pr-3 font-medium">ДРР</th>
                          <th className="pb-2 font-medium">
                            <ChannelTableSortHeader
                              label="ROAS"
                              sortKey="roas"
                              activeKey={channelSort}
                              desc={channelSortDesc}
                              onSort={toggleChannelSort}
                            />
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedChannelRows.map((row) => {
                          const isOpen = expanded[row.id];
                          const isBest = row.id === bestChannelId;
                          return (
                            <React.Fragment key={row.id}>
                              <tr
                                className={`border-b border-gray-50 ${
                                  isBest ? 'bg-emerald-50/50' : ''
                                }`}
                              >
                                <td className="py-3 pr-3">
                                  <button
                                    type="button"
                                    className="flex flex-wrap items-center gap-2 font-semibold text-gray-900"
                                    onClick={() =>
                                      setExpanded((e) => ({ ...e, [row.id]: !e[row.id] }))
                                    }
                                  >
                                    <span
                                      className="h-2 w-2 shrink-0 rounded-full"
                                      style={{ backgroundColor: row.color }}
                                    />
                                    {row.name}
                                    {isBest ? (
                                      <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-emerald-800">
                                        Лучший по ₽ за заказ
                                      </span>
                                    ) : null}
                                    {isOpen ? (
                                      <ChevronDown className="h-4 w-4 text-gray-400" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-gray-400" />
                                    )}
                                  </button>
                                </td>
                                <td className="py-3 pr-3 font-medium">{fmtRub(row.spend)}</td>
                                <td className="py-3 pr-3">{fmtNum(row.orders)}</td>
                                <td className="py-3 pr-3">{fmtNum(row.clicks)}</td>
                                <td className="py-3 pr-3">{fmtRub(row.cpo)}</td>
                                <td className="py-3 pr-3">{row.drr}</td>
                                <td className="py-3">
                                  <span className="font-medium">{row.roas}</span>
                                  <TrendPill value={row.trend} positive={!row.trend.startsWith('-')} />
                                </td>
                              </tr>
                              {isOpen &&
                                row.children.map((child) => (
                                  <tr key={child.name} className="border-b border-gray-50/80 bg-[#FAFAFC]">
                                    <td className="py-2.5 pl-8 pr-3 text-gray-700">{child.name}</td>
                                    <td className="py-2.5 pr-3 text-gray-600">{fmtRub(child.spend)}</td>
                                    <td className="py-2.5 pr-3 text-gray-600">{fmtNum(child.orders)}</td>
                                    <td className="py-2.5 pr-3 text-gray-600">{fmtNum(child.clicks)}</td>
                                    <td className="py-2.5 pr-3 text-gray-600">{fmtRub(child.cpo)}</td>
                                    <td className="py-2.5 pr-3 text-gray-600">{child.drr}</td>
                                    <td className="py-2.5 text-gray-600">{child.roas}</td>
                                  </tr>
                                ))}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>

              <aside
                className="flex w-full shrink-0 flex-col gap-3 xl:w-[18rem] xl:self-start"
              >
                <section className={`group rounded-[20px] bg-white shadow-sm ${OV.cardCompact}`}>
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-bold text-gray-900">Здоровье кабинета</h2>
                    <div className="shrink-0 text-right">
                      <div className="text-2xl font-bold leading-none tabular-nums text-gray-900">
                        {promotionHealth.score}%
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="relative">
                      <div className="relative h-2 w-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500">
                        <div
                          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                          style={{ left: `${promotionHealth.score}%` }}
                        >
                          <div className="h-5 w-[4px] rounded-full bg-gray-900/80 shadow-sm ring-2 ring-white/90" />
                        </div>
                      </div>
                      <div className="pointer-events-none absolute right-0 top-full z-30 pt-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                        <div className="w-[min(420px,92vw)] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_16px_48px_rgba(0,0,0,0.14)]">
                          <div className="flex items-center justify-between px-4 py-3">
                            <div className="text-sm font-semibold text-gray-900">Что улучшить</div>
                            <div className="text-xs font-semibold text-gray-500 tabular-nums">
                              {promotionHealth.score}% здоровья
                            </div>
                          </div>
                          <div className="h-px bg-gray-100" />
                          <div className="p-2">
                            <div className="flex flex-col gap-2">
                              {healthImproveItems.map((row) => (
                                <div
                                  key={row.title}
                                  className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 hover:bg-gray-50"
                                >
                                  <div className="min-w-0">
                                    <div className="flex min-w-0 items-center gap-2">
                                      <span className="text-sm font-semibold text-gray-900">
                                        {row.title}
                                      </span>
                                      <span
                                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${row.impact.tone}`}
                                      >
                                        {row.impact.label}
                                      </span>
                                    </div>
                                    <div className="mt-0.5 truncate text-xs text-gray-500">
                                      {row.subtitle}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-xs leading-snug text-gray-600">{healthImproveHint}</p>
                  </div>
                </section>

                <section className={`rounded-[20px] bg-white shadow-sm ${OV.cardCompact}`}>
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-lg font-bold text-gray-900">Рекомендации</h2>
                    <span className="text-lg text-[#9a41fe]" aria-hidden>
                      ✦
                    </span>
                  </div>
                  <ul className={`${OV.mtStack} divide-y divide-gray-100`}>
                    {recommendations.map((rec) => (
                      <li key={rec.title} className="py-4 first:pt-0 last:pb-0">
                        <p className="text-sm font-semibold leading-snug text-gray-900">{rec.title}</p>
                        <p className="mt-2 text-sm leading-relaxed text-gray-600">{rec.body}</p>
                        <button
                          type="button"
                          className="mt-3 text-sm font-semibold leading-snug text-[#2979FF] hover:underline"
                        >
                          {rec.action}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className={`${OV.mtStack} w-full shrink-0 rounded-xl bg-[#F2F2F7] py-2 text-sm font-semibold text-gray-900 hover:bg-[#E8E8ED]`}
                  >
                    Показать ещё
                  </button>
                </section>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

const INSIGHT_ALERT_ICON_SIZE = 18;

function AlertBudgetIcon() {
  return (
    <svg
      width={INSIGHT_ALERT_ICON_SIZE}
      height={INSIGHT_ALERT_ICON_SIZE}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}

function AlertStockIcon() {
  return (
    <svg
      width={INSIGHT_ALERT_ICON_SIZE}
      height={INSIGHT_ALERT_ICON_SIZE}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function AlertGrowthChartIcon() {
  return (
    <svg
      width={INSIGHT_ALERT_ICON_SIZE}
      height={INSIGHT_ALERT_ICON_SIZE}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 4 3 6-7" />
    </svg>
  );
}

function ChannelTableSortHeader({
  label,
  sortKey,
  activeKey,
  desc,
  onSort,
}: {
  label: string;
  sortKey: ChannelSortKey;
  activeKey: ChannelSortKey;
  desc: boolean;
  onSort: (key: ChannelSortKey) => void;
}) {
  const active = activeKey === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`inline-flex items-center gap-0.5 border-0 bg-transparent p-0 font-medium transition-colors ${
        active ? 'text-gray-900' : 'text-gray-500 hover:text-gray-800'
      }`}
      aria-sort={active ? (desc ? 'descending' : 'ascending') : 'none'}
    >
      {label}
      <ChevronDown
        className={`h-3.5 w-3.5 shrink-0 transition-transform ${active ? 'text-gray-700' : 'text-transparent'} ${
          active && !desc ? 'rotate-180' : ''
        }`}
        aria-hidden
      />
    </button>
  );
}

/** Компактные виджеты обзора для страницы «Кампании с виджетами». */
export function OverviewMiniWidgetsForCampaignsList({
  listTab,
}: {
  listTab: 'campaigns' | 'products';
}) {
  const { applyFilter } = useCampaignsInsightFilter();
  // Use the same "requires attention" block for both tabs (Campaigns and Products).
  const attentionTabItems = useMemo(() => ATTENTION_MINI_TABS_CAMPAIGNS, []);
  const [attentionTab, setAttentionTab] = useState<AttentionTab>(attentionTabItems[0]!.id);

  useEffect(() => {
    setAttentionTab(attentionTabItems[0]!.id);
  }, [attentionTabItems]);

  /** Период метрик — с панели DateFilter в шапке списка (пока демо: 2 недели). */
  const statsForPeriod = useMemo(() => STATS_BY_PERIOD['2w'], []);

  const showInList = (kind: CampaignsInsightFilterKind, label: string) => () =>
    applyFilter(kind, label);

  return (
    <div className="flex w-full min-w-0 items-stretch gap-2 overflow-visible">
      <div
        style={miniWidgetsStripHeightStyle}
        className="flex min-h-0 w-[min(100%,16rem)] shrink-0 flex-col overflow-hidden"
      >
        <div className="flex h-full min-h-0 flex-col gap-2">
        <OverviewInsightAlertCard
          dense
          icon={<AlertBudgetIcon />}
          iconToneClassName="bg-rose-50 text-rose-600"
          title="Закончился бюджет"
          countLabel="3 кампании"
          buttonLabel="Показать в списке"
          panelVariant="budget"
          onButtonClick={showInList('budget', 'Закончился бюджет')}
        />
        <OverviewInsightAlertCard
          dense
          icon={<AlertStockIcon />}
          iconToneClassName="bg-amber-50 text-amber-600"
          title="Закончились остатки"
          countLabel="2 товара"
          buttonLabel="Показать в списке"
          panelVariant="stock"
          onButtonClick={showInList('stock', 'Закончились остатки')}
        />
        <OverviewInsightAlertCard
          dense
          icon={<AlertGrowthChartIcon />}
          iconToneClassName="bg-[#9a41fe]/10 text-[#9a41fe]"
          title="Готовы к запуску"
          countLabel="7 кампаний"
          buttonLabel="Показать в списке"
          panelVariant="launch"
          dropdownAlign="end"
          onButtonClick={showInList('launch', 'Готовы к запуску')}
        />
        </div>
      </div>

      <section
        style={miniWidgetsStripHeightStyle}
        className="flex min-h-0 min-w-0 flex-1 shrink-0 flex-col rounded-xl bg-white p-4 shadow-sm"
      >
        <div className="grid min-h-0 flex-1 grid-cols-3 gap-2 pt-5 pb-5">
          {statsForPeriod.metrics.map((m, metricIndex) => {
            const trendPositive = isTrendPositive(m.trend, m.lowerIsBetter);
            const sparkPositive =
              m.points[m.points.length - 1] < m.points[0]
                ? m.lowerIsBetter
                : m.points[m.points.length - 1] > m.points[0]
                  ? !m.lowerIsBetter
                  : trendPositive;
            return (
              <div
                key={m.title}
                className={`flex min-h-0 min-w-0 flex-col justify-between gap-1${metricIndex === 0 ? ' pr-2' : ''}`}
              >
                <div className="min-w-0 shrink-0">
                  <p className="text-[9px] font-medium leading-none text-gray-500">{m.title}</p>
                  <p className="mt-0.5 text-2xl font-bold leading-none text-gray-900">{m.value}</p>
                  <div className="mt-0.5">
                    <TrendPill value={m.trend} positive={trendPositive} />
                  </div>
                </div>
                <div className="min-w-0 shrink-0">
                  <MiniSparkline
                    points={m.points}
                    previousPoints={m.previousPoints}
                    stroke={sparkPositive ? '#22c55e' : '#ef4444'}
                    className="!h-5 w-full shrink-0"
                    dense
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                    {statsForPeriod.dateLabels.map((label) => (
                      <span key={label}>{label}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section
        style={miniWidgetsStripHeightStyle}
        className="flex min-h-0 min-w-0 flex-[1.15] flex-col overflow-hidden rounded-xl bg-white p-2 shadow-sm"
      >
        <div className="flex shrink-0 justify-start pb-2.5">
          <AttentionTabToggle
            value={attentionTab}
            onChange={setAttentionTab}
            items={attentionTabItems}
            className="scale-[0.92] origin-left"
            ariaLabel={listTab === 'products' ? 'Подборки товаров' : 'Подборки кампаний'}
          />
        </div>
        <div className="mt-0.5 min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain">
          <AttentionProductsTable tab={attentionTab} compact />
        </div>
      </section>
    </div>
  );
}

export default OverviewPage;
