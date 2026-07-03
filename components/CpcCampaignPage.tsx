import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Checkbox } from 'antd';
import {
  Wallet,
  HelpCircle,
  X,
  RefreshCw,
  ChevronDown,
  Clock,
  SingleAccountIcon,
  Bell,
  Calendar,
  MoreVertical,
} from './Icons';
import {
  PRODUCT_TABLE_THUMB_FALLBACK,
  resolveProductTableThumbSrc,
} from './SuccessPageTestData';
import { AppHeader } from './AppHeader';
import { DailyLimitInfoTooltip } from './DailyLimitInfoTooltip';
import { DailyLimitBidMismatchHint } from './DailyLimitBidMismatchHint';
import { CampaignRepeatPerformanceBlock } from './CampaignRepeatPerformanceBlock';
import { SimilarDemandProductsBlock } from './SimilarDemandProductsBlock';
import { useProfile, type RepeatLaunchPreset } from './ProfileContext';
import {
  DAILY_LIMIT_ABSOLUTE_MIN,
  minDailyLimitForMaxBid,
  isDailyLimitBelowRecommendedForMaxBid,
  CPC_MAX_BID_RUB,
} from '../utils/cpcDailyLimitBid';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const UNIFIED_BALANCE = 105350;
const TOTAL_PROMO_BONUS = 226660517;

const BONUS_PACKAGES = [
  { id: 'p1', amount: 209527397, maxPercent: 100, expiry: '20.03.26', displayBurn: '209.4M' },
  { id: 'p2', amount: 17133120, maxPercent: 99, expiry: '27.03.26', displayBurn: '168.3k' },
];

const formatForDisplay = (num: number | string | undefined | null): string => {
  if (num === null || num === undefined || num === '') return '0';
  const numValue = typeof num === 'string' ? parseDisplayValue(num) : num;
  if (isNaN(numValue) || numValue === null || numValue === undefined) return '0';
  return numValue.toLocaleString('ru-RU', { useGrouping: true });
};

const formatCurrency = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return 'Н/Д';
  return `${num.toLocaleString('ru-RU')} ₽`;
};

const parseDisplayValue = (str: string): number => {
  return Number(String(str).replace(/\s/g, '').replace(/,/g, '.'));
};

const DEMO_CPC_PRODUCT_NM = 791194805;

const DEMO_CPC_PRODUCT = {
  nmId: DEMO_CPC_PRODUCT_NM,
  productName: 'Майка белая',
  brand: 'H&M',
  articleSeller: '791194805',
  imageUrl: '',
  category: 'Футболки',
};

const PRODUCT_THUMB_CLASS =
  'h-[38px] w-[30px] shrink-0 rounded-md border border-gray-100 bg-gray-50 object-cover';

function CampaignProductThumb({
  nmId,
  imageUrl,
  category,
  alt,
}: {
  nmId: number;
  imageUrl: string;
  category: string;
  alt: string;
}) {
  const id = String(nmId);
  const [url, setUrl] = useState(() => resolveProductTableThumbSrc(id, imageUrl, category));
  useEffect(() => {
    setUrl(resolveProductTableThumbSrc(id, imageUrl, category));
  }, [id, imageUrl, category]);
  return (
    <img
      src={url}
      alt={alt}
      width={30}
      height={38}
      className={PRODUCT_THUMB_CLASS}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => {
        if (url !== PRODUCT_TABLE_THUMB_FALLBACK) setUrl(PRODUCT_TABLE_THUMB_FALLBACK);
      }}
    />
  );
}

function CopyNmIdButton({ nmId }: { nmId: number }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(nmId));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex shrink-0 text-gray-400 hover:text-gray-600"
      aria-label={copied ? 'Скопировано' : 'Скопировать артикул'}
      title={copied ? 'Скопировано' : 'Скопировать'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3.5 w-3.5"
        aria-hidden
      >
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    </button>
  );
}

function HeaderHint({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-normal text-gray-400${className ? ` ${className}` : ''}`}
    >
      {label}
      <HelpCircle className="h-3.5 w-3.5 text-gray-300" aria-hidden />
    </span>
  );
}

function BidHistogramButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
      aria-label="Статистика ставки"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <rect x="1" y="8" width="3" height="7" rx="0.5" fill="currentColor" opacity="0.35" />
        <rect x="6.5" y="5" width="3" height="10" rx="0.5" fill="currentColor" opacity="0.6" />
        <rect x="12" y="2" width="3" height="13" rx="0.5" fill="currentColor" />
      </svg>
    </button>
  );
}

const PRODUCT_BID_INPUT_WIDTH_CLASS = 'w-[5.75rem]';

/** Индикатор «ставка за позиции 1–2» под полем поиска, когда преследование выключено */
function SearchBidPositionHint() {
  const segments = 12;
  const activeThrough = 4;
  return (
    <div className={`mt-1.5 ${PRODUCT_BID_INPUT_WIDTH_CLASS}`}>
      <div className="flex h-1 gap-px overflow-hidden rounded-full">
        {Array.from({ length: segments }, (_, i) => (
          <span
            key={i}
            className={`h-full flex-1 rounded-sm ${
              i < activeThrough ? 'bg-purple-500' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className="mt-1 text-[10px] leading-none text-gray-400 text-right">Ставка за 1–2</p>
    </div>
  );
}

function ProductBidField({
  value,
  onChange,
  onBlur,
  disabled = false,
  title,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <div
      title={title}
      className={`inline-flex h-9 ${PRODUCT_BID_INPUT_WIDTH_CLASS} items-center rounded-lg border px-2 ${
        disabled
          ? 'cursor-not-allowed border-gray-200 bg-gray-50'
          : 'border-gray-200 bg-white focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500'
      }`}
    >
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        readOnly={disabled}
        title={title}
        className={`min-w-0 flex-1 bg-transparent text-right text-sm tabular-nums outline-none ${
          disabled ? 'cursor-not-allowed text-gray-500' : 'text-gray-900'
        }`}
      />
      <span className={`shrink-0 pl-0.5 text-sm ${disabled ? 'text-gray-300' : 'text-gray-400'}`}>₽</span>
    </div>
  );
}

/** Ставка в поиске при включённом преследовании — только отображение, без поля ввода */
function ProductBidReadOnly({ value }: { value: string }) {
  const parsed = parseDisplayValue(value);
  const display =
    value === '' || Number.isNaN(parsed)
      ? '—'
      : formatForDisplay(parsed);
  return (
    <div
      className={`inline-flex h-9 ${PRODUCT_BID_INPUT_WIDTH_CLASS} items-center justify-end gap-0.5 px-2 text-sm tabular-nums text-gray-900`}
      aria-label={`Ставка в поиске ${display === '—' ? 'не задана' : `${display} ₽`}`}
    >
      <span>{display}</span>
      <span className="shrink-0 text-gray-400">₽</span>
    </div>
  );
}

function DisplayZoneSearchArt() {
  return (
    <svg
      width="88"
      height="48"
      viewBox="0 0 88 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 pointer-events-none select-none"
      aria-hidden
    >
      <rect x="8" y="10" width="72" height="28" rx="8" fill="#F3F0FF" />
      <rect x="14" y="18" width="44" height="6" rx="3" fill="#E4D9FF" />
      <circle cx="62" cy="21" r="7" fill="#CBB5FF" />
      <path
        d="M59.5 21h5M61.75 18.75v4.5"
        stroke="#9A41FE"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M65 24l3 3"
        stroke="#9A41FE"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DisplayZoneRecommendationsArt() {
  return (
    <svg
      width="88"
      height="48"
      viewBox="0 0 88 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 pointer-events-none select-none"
      aria-hidden
    >
      <rect x="10" y="8" width="68" height="32" rx="8" fill="#F3F0FF" />
      <rect x="16" y="14" width="18" height="18" rx="4" fill="#E4D9FF" />
      <rect x="38" y="14" width="18" height="8" rx="3" fill="#E4D9FF" />
      <rect x="38" y="26" width="28" height="6" rx="3" fill="#E4D9FF" />
      <path
        d="M22 26c1.2-2.2 3.4-3.5 6-3.5 2.2 0 4 1 5.2 2.6"
        stroke="#9A41FE"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M19 24.5l1.8 1.8 3.6-4"
        stroke="#9A41FE"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type ProductBidEntry = { draft: string; saved: string };

interface CpcCampaignPageProps {
  campaignId: number;
  name: string;
  remainingBudget: number | null;
  dailyLimit: number | null;
  scheduledDailyLimit: number | null;
  /** true = дневной лимит израсходован, показы остановлены до завтра */
  dailyLimitExhausted?: boolean;
  fromReadyToRepeat?: boolean;
  repeatLaunchPreset?: RepeatLaunchPreset;
  onBack: () => void;
  onUpdateData?: (data: { name?: string; remainingBudget?: number | null; dailyLimit?: number | null; scheduledDailyLimit?: number | null; maxCpcBidRub?: number }) => void;
}

const ToggleSwitch = ({ checked, onChange, disabled = false }: { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) => (
  <button 
    role="switch" 
    aria-checked={checked} 
    onClick={() => !disabled && onChange(!checked)} 
    disabled={disabled} 
    className={`relative inline-flex h-4 w-7 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${ 
      disabled ? 'cursor-not-allowed bg-gray-200' : 'cursor-pointer' 
    } ${ 
      checked ? (disabled ? 'bg-purple-300' : 'bg-purple-600') : 'bg-gray-300' 
    }`}
  >
    <span 
      aria-hidden="true" 
      className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${ 
        checked ? 'translate-x-3' : 'translate-x-0' 
      }`} 
    />
  </button>
);

const StatsChartToggleSwitch = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
      checked ? 'bg-purple-600' : 'bg-gray-300'
    }`}
  >
    <span
      aria-hidden
      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-4' : 'translate-x-0'
      }`}
    />
  </button>
);

const Toast = ({ show, message, onClose, isSuccess = false, isError = false, durationMs = 3000 }: { show: boolean, message: string, onClose: () => void, isSuccess?: boolean, isError?: boolean, durationMs?: number }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, durationMs);
      return () => clearTimeout(timer);
    }
  }, [show, onClose, durationMs]);
  
  if (!show) return null;
  
  const bgClass = isError ? 'bg-red-600' : isSuccess ? 'bg-green-600' : 'bg-gray-900';
  return (
    <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 ${bgClass} text-white px-6 py-3 rounded-lg shadow-xl z-[100] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 max-w-md ${isError ? 'pointer-events-none' : ''}`}>
      <span className="font-medium whitespace-pre-line">{message}</span>
    </div>
  );
};

type StatTrendDirection = 'up' | 'down';

function StatTrendBadge({
  value,
  direction,
  positiveIsGood = true,
}: {
  value: string;
  direction: StatTrendDirection;
  positiveIsGood?: boolean;
}) {
  const favorable = direction === 'up' ? positiveIsGood : !positiveIsGood;
  const isNeutral = value === '0%' || value === '0';
  if (isNeutral) {
    return <span className="text-xs font-medium tabular-nums text-gray-400">{value}</span>;
  }
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium tabular-nums ${
        favorable ? 'text-emerald-600' : 'text-red-500'
      }`}
    >
      <span aria-hidden>{direction === 'up' ? '▲' : '▼'}</span>
      {value}
    </span>
  );
}

function StatPrimaryMetric({
  value,
  trend,
  compact,
}: {
  value: string;
  trend: { value: string; direction: StatTrendDirection; positiveIsGood?: boolean };
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-wrap items-baseline gap-2 ${compact ? 'mb-2' : 'mb-4'}`}>
      <p className="text-2xl font-bold tabular-nums tracking-tight text-gray-900">{value}</p>
      <StatTrendBadge {...trend} />
    </div>
  );
}

function StatSecondaryMetric({
  label,
  value,
  trend,
  valueMuted,
}: {
  label: string;
  value: string;
  trend?: { value: string; direction: StatTrendDirection; positiveIsGood?: boolean };
  valueMuted?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-gray-500">{label}</p>
      <p
        className={`mt-0.5 flex flex-wrap items-baseline gap-1.5 text-sm font-semibold tabular-nums ${
          valueMuted ? 'text-gray-400' : 'text-gray-900'
        }`}
      >
        <span>{value}</span>
        {trend ? <StatTrendBadge {...trend} /> : null}
      </p>
    </div>
  );
}

type CpcStatsChartTab = 'dynamics' | 'position';

type CpcChartCardMetricId = 'impressions' | 'clicks' | 'orders' | 'costShare';

type CpcChartSubMetricId =
  | 'cpm'
  | 'searchPosition'
  | 'ctr'
  | 'cpc'
  | 'cr'
  | 'cpo'
  | 'orderSum'
  | 'spend';

type CpcChartMetricId =
  | 'impressions'
  | 'cpm'
  | 'searchPosition'
  | 'clicks'
  | 'ctr'
  | 'cpc'
  | 'orders'
  | 'cr'
  | 'cpo'
  | 'costShare'
  | 'orderSum'
  | 'spend';

type CpcChartThirdMetricId = 'clicks' | 'impressions' | 'clickShare' | 'impressionShare';

const CPC_CHART_ALL_METRICS: { id: CpcChartMetricId; label: string; optionTag?: string }[] = [
  { id: 'impressions', label: 'Показы' },
  { id: 'cpm', label: 'CPM' },
  { id: 'searchPosition', label: 'Позиция в поиске', optionTag: 'Новое' },
  { id: 'clicks', label: 'Клики' },
  { id: 'ctr', label: 'CTR' },
  { id: 'cpc', label: 'CPC' },
  { id: 'orders', label: 'Заказы' },
  { id: 'cr', label: 'CR' },
  { id: 'cpo', label: 'CPO' },
  { id: 'costShare', label: 'Доля затрат' },
  { id: 'orderSum', label: 'Сумма заказов' },
  { id: 'spend', label: 'Затраты' },
];

const CPC_CHART_CARD_METRICS: { id: CpcChartCardMetricId; label: string }[] = [
  { id: 'impressions', label: 'Показы' },
  { id: 'clicks', label: 'Клики' },
  { id: 'orders', label: 'Заказы' },
  { id: 'costShare', label: 'Доля затрат' },
];

const CPC_CHART_SUB_METRICS_BY_CARD: Record<
  CpcChartCardMetricId,
  { id: CpcChartSubMetricId; label: string }[]
> = {
  impressions: [
    { id: 'cpm', label: 'CPM' },
    { id: 'searchPosition', label: 'Позиция в поиске' },
  ],
  clicks: [
    { id: 'ctr', label: 'CTR' },
    { id: 'cpc', label: 'CPC' },
  ],
  orders: [
    { id: 'cr', label: 'CR' },
    { id: 'cpo', label: 'CPO' },
  ],
  costShare: [
    { id: 'orderSum', label: 'Сумма заказов' },
    { id: 'spend', label: 'Затраты' },
  ],
};

const CPC_CHART_THIRD_METRICS: { id: CpcChartThirdMetricId; label: string }[] = [
  { id: 'impressions', label: 'Показы и CTR' },
  { id: 'clicks', label: 'Клики и CTR' },
  { id: 'impressionShare', label: 'Доля показов и CTR' },
  { id: 'clickShare', label: 'Доля кликов и CTR' },
];

function defaultSubMetricForCard(card: CpcChartCardMetricId): CpcChartSubMetricId {
  return CPC_CHART_SUB_METRICS_BY_CARD[card][0].id;
}

type CpcChartFocus = {
  card: CpcChartCardMetricId;
  sub: CpcChartSubMetricId;
  third: CpcChartThirdMetricId;
  tab: CpcStatsChartTab;
};

function chartFocusFor(card: CpcChartCardMetricId, sub?: CpcChartSubMetricId): CpcChartFocus {
  const resolvedSub = sub ?? defaultSubMetricForCard(card);
  if (resolvedSub === 'searchPosition') {
    return { card, sub: resolvedSub, third: 'impressionShare', tab: 'position' };
  }
  if (card === 'clicks') {
    return {
      card,
      sub: resolvedSub,
      third: resolvedSub === 'ctr' ? 'clickShare' : 'clicks',
      tab: 'dynamics',
    };
  }
  if (card === 'impressions') {
    return { card, sub: resolvedSub, third: 'impressions', tab: 'dynamics' };
  }
  if (card === 'orders') {
    return { card, sub: resolvedSub, third: 'clicks', tab: 'dynamics' };
  }
  return { card, sub: resolvedSub, third: 'impressionShare', tab: 'dynamics' };
}

function chartFocusForMetric(metricId: CpcChartMetricId): CpcChartFocus {
  switch (metricId) {
    case 'impressions':
      return chartFocusFor('impressions');
    case 'cpm':
      return chartFocusFor('impressions', 'cpm');
    case 'searchPosition':
      return chartFocusFor('impressions', 'searchPosition');
    case 'clicks':
      return chartFocusFor('clicks');
    case 'ctr':
      return chartFocusFor('clicks', 'ctr');
    case 'cpc':
      return chartFocusFor('clicks', 'cpc');
    case 'orders':
      return chartFocusFor('orders');
    case 'cr':
      return chartFocusFor('orders', 'cr');
    case 'cpo':
      return chartFocusFor('orders', 'cpo');
    case 'costShare':
      return chartFocusFor('costShare');
    case 'orderSum':
      return chartFocusFor('costShare', 'orderSum');
    case 'spend':
      return chartFocusFor('costShare', 'spend');
    default:
      return chartFocusFor('clicks', 'ctr');
  }
}

function isPositionChartTabAvailable(metricId: CpcChartMetricId): boolean {
  return metricId === 'searchPosition';
}

const CPC_POSITION_LEFT_METRIC: Record<
  CpcChartThirdMetricId,
  { dataKey: 'impressions' | 'clicks' | 'impressionShare' | 'clickShare'; label: string; kind: 'count' | 'share' }
> = {
  impressions: { dataKey: 'impressions', label: 'Показы', kind: 'count' },
  clicks: { dataKey: 'clicks', label: 'Клики', kind: 'count' },
  impressionShare: { dataKey: 'impressionShare', label: 'Доля показов', kind: 'share' },
  clickShare: { dataKey: 'clickShare', label: 'Доля кликов', kind: 'share' },
};

const CPC_POSITION_CHART_DATA = [
  { range: '1–2 позиции', impressions: 4_200, clicks: 252, impressionShare: 0.05, clickShare: 0.04, ctr: 0.06 },
  { range: '3–10', impressions: 6_300, clicks: 420, impressionShare: 0.12, clickShare: 0.05, ctr: 0.05 },
  { range: '11–34', impressions: 12_600, clicks: 756, impressionShare: 0.2, clickShare: 0.04, ctr: 0.04 },
  { range: '35–50', impressions: 3_150, clicks: 210, impressionShare: 0.08, clickShare: 0.035, ctr: 0.035 },
  { range: '51–100', impressions: 1_575, clicks: 126, impressionShare: 0.04, clickShare: 0.025, ctr: 0.025 },
  { range: '101–300', impressions: 788, clicks: 84, impressionShare: 0.02, clickShare: 0.015, ctr: 0.015 },
  { range: '301+', impressions: 263, clicks: 42, impressionShare: 0.48, clickShare: 0.01, ctr: 0.01 },
];

const CPC_POSITION_CHART_DATA_LOW = CPC_POSITION_CHART_DATA.map((row, index) => ({
  ...row,
  impressions: index === 2 ? 3 : 0,
  clicks: 0,
  impressionShare: 0,
  clickShare: 0,
  ctr: 0,
}));

function isDynamicsChartTabAvailable(_metricId: CpcChartMetricId): boolean {
  return true;
}

type CpcChartValueKind = 'count' | 'percent' | 'position' | 'currency';

function chartValueKindForMetric(metricId: CpcChartMetricId): CpcChartValueKind {
  if (metricId === 'searchPosition') return 'position';
  if (metricId === 'impressions' || metricId === 'clicks' || metricId === 'orders') {
    return 'count';
  }
  if (metricId === 'orderSum' || metricId === 'spend' || metricId === 'cpm' || metricId === 'cpc' || metricId === 'cpo') {
    return 'currency';
  }
  if (metricId === 'ctr' || metricId === 'cr' || metricId === 'costShare') {
    return 'percent';
  }
  return 'percent';
}

function formatChartAxisTick(kind: CpcChartValueKind, value: number): string {
  if (kind === 'percent') return `${(value * 100).toFixed(1)}%`;
  if (kind === 'position') return String(Math.round(value));
  return Math.round(value).toLocaleString('ru-RU');
}

function formatChartTooltipValue(kind: CpcChartValueKind, value: number): string {
  if (kind === 'percent') return `${(value * 100).toFixed(2)}%`;
  if (kind === 'position') return String(Math.round(value));
  if (kind === 'currency') {
    return `${Math.round(value).toLocaleString('ru-RU')} ₽`;
  }
  return Math.round(value).toLocaleString('ru-RU');
}

type CpcDynamicsPoint = { date: string; primary: number; previous: number };

const CPC_DYNAMICS_PERCENT_CHART_DATA: CpcDynamicsPoint[] = [
  { date: '27.06', primary: 0.02, previous: 0.018 },
  { date: '28.06', primary: 0.022, previous: 0.019 },
  { date: '29.06', primary: 0.025, previous: 0.021 },
  { date: '30.06', primary: 0.028, previous: 0.023 },
  { date: '01.07', primary: 0.026, previous: 0.024 },
  { date: '02.07', primary: 0.03, previous: 0.025 },
  { date: '03.07', primary: 0.032, previous: 0.027 },
];

const CPC_DYNAMICS_PERCENT_CHART_DATA_LOW: CpcDynamicsPoint[] = [
  { date: '27.06', primary: 0, previous: 0 },
  { date: '28.06', primary: 0, previous: 0 },
  { date: '29.06', primary: 0, previous: 0 },
  { date: '30.06', primary: 0, previous: 0 },
  { date: '01.07', primary: 0, previous: 0 },
  { date: '02.07', primary: 0, previous: 0 },
  { date: '03.07', primary: 0, previous: 0 },
];

const CPC_DYNAMICS_IMPRESSIONS_CHART_DATA: CpcDynamicsPoint[] = [
  { date: '27.06', primary: 26_500, previous: 25_200 },
  { date: '28.06', primary: 27_100, previous: 25_800 },
  { date: '29.06', primary: 27_800, previous: 26_400 },
  { date: '30.06', primary: 28_400, previous: 27_000 },
  { date: '01.07', primary: 28_900, previous: 27_500 },
  { date: '02.07', primary: 29_100, previous: 27_900 },
  { date: '03.07', primary: 29_231, previous: 28_100 },
];

const CPC_DYNAMICS_IMPRESSIONS_CHART_DATA_LOW: CpcDynamicsPoint[] = [
  { date: '27.06', primary: 0, previous: 0 },
  { date: '28.06', primary: 0, previous: 0 },
  { date: '29.06', primary: 1, previous: 0 },
  { date: '30.06', primary: 2, previous: 1 },
  { date: '01.07', primary: 2, previous: 1 },
  { date: '02.07', primary: 3, previous: 2 },
  { date: '03.07', primary: 3, previous: 2 },
];

const CPC_DYNAMICS_CLICKS_CHART_DATA: CpcDynamicsPoint[] = [
  { date: '27.06', primary: 71, previous: 65 },
  { date: '28.06', primary: 74, previous: 68 },
  { date: '29.06', primary: 76, previous: 70 },
  { date: '30.06', primary: 78, previous: 72 },
  { date: '01.07', primary: 80, previous: 74 },
  { date: '02.07', primary: 82, previous: 76 },
  { date: '03.07', primary: 83, previous: 77 },
];

const CPC_DYNAMICS_CLICKS_CHART_DATA_LOW: CpcDynamicsPoint[] = [
  { date: '27.06', primary: 0, previous: 0 },
  { date: '28.06', primary: 0, previous: 0 },
  { date: '29.06', primary: 0, previous: 0 },
  { date: '30.06', primary: 0, previous: 0 },
  { date: '01.07', primary: 0, previous: 0 },
  { date: '02.07', primary: 0, previous: 0 },
  { date: '03.07', primary: 0, previous: 0 },
];

const CPC_DYNAMICS_ORDERS_CHART_DATA: CpcDynamicsPoint[] = [
  { date: '27.06', primary: 15, previous: 13 },
  { date: '28.06', primary: 16, previous: 14 },
  { date: '29.06', primary: 16, previous: 14 },
  { date: '30.06', primary: 17, previous: 15 },
  { date: '01.07', primary: 18, previous: 16 },
  { date: '02.07', primary: 18, previous: 17 },
  { date: '03.07', primary: 19, previous: 17 },
];

const CPC_DYNAMICS_ORDERS_CHART_DATA_LOW: CpcDynamicsPoint[] = [
  { date: '27.06', primary: 0, previous: 0 },
  { date: '28.06', primary: 0, previous: 0 },
  { date: '29.06', primary: 0, previous: 0 },
  { date: '30.06', primary: 0, previous: 0 },
  { date: '01.07', primary: 0, previous: 0 },
  { date: '02.07', primary: 0, previous: 0 },
  { date: '03.07', primary: 0, previous: 0 },
];

const CPC_DYNAMICS_COUNT_CHART_DATA_BY_METRIC: Partial<
  Record<CpcChartMetricId, { normal: CpcDynamicsPoint[]; low: CpcDynamicsPoint[] }>
> = {
  impressions: {
    normal: CPC_DYNAMICS_IMPRESSIONS_CHART_DATA,
    low: CPC_DYNAMICS_IMPRESSIONS_CHART_DATA_LOW,
  },
  clicks: { normal: CPC_DYNAMICS_CLICKS_CHART_DATA, low: CPC_DYNAMICS_CLICKS_CHART_DATA_LOW },
  orders: { normal: CPC_DYNAMICS_ORDERS_CHART_DATA, low: CPC_DYNAMICS_ORDERS_CHART_DATA_LOW },
};

const CPC_DYNAMICS_ORDER_SUM_CHART_DATA: CpcDynamicsPoint[] = [
  { date: '27.06', primary: 178_000, previous: 165_000 },
  { date: '28.06', primary: 182_000, previous: 168_000 },
  { date: '29.06', primary: 186_000, previous: 172_000 },
  { date: '30.06', primary: 189_000, previous: 176_000 },
  { date: '01.07', primary: 192_000, previous: 180_000 },
  { date: '02.07', primary: 194_000, previous: 183_000 },
  { date: '03.07', primary: 196_000, previous: 185_000 },
];

const CPC_DYNAMICS_ORDER_SUM_CHART_DATA_LOW: CpcDynamicsPoint[] = [
  { date: '27.06', primary: 0, previous: 0 },
  { date: '28.06', primary: 0, previous: 0 },
  { date: '29.06', primary: 0, previous: 0 },
  { date: '30.06', primary: 0, previous: 0 },
  { date: '01.07', primary: 0, previous: 0 },
  { date: '02.07', primary: 0, previous: 0 },
  { date: '03.07', primary: 0, previous: 0 },
];

const CPC_DYNAMICS_SPEND_CHART_DATA: CpcDynamicsPoint[] = [
  { date: '27.06', primary: 4_650, previous: 4_400 },
  { date: '28.06', primary: 4_780, previous: 4_520 },
  { date: '29.06', primary: 4_890, previous: 4_610 },
  { date: '30.06', primary: 4_960, previous: 4_680 },
  { date: '01.07', primary: 5_020, previous: 4_750 },
  { date: '02.07', primary: 5_080, previous: 4_820 },
  { date: '03.07', primary: 5_115, previous: 4_860 },
];

const CPC_DYNAMICS_SPEND_CHART_DATA_LOW: CpcDynamicsPoint[] = [
  { date: '27.06', primary: 1, previous: 1 },
  { date: '28.06', primary: 1, previous: 1 },
  { date: '29.06', primary: 1, previous: 1 },
  { date: '30.06', primary: 1, previous: 1 },
  { date: '01.07', primary: 1, previous: 1 },
  { date: '02.07', primary: 1, previous: 1 },
  { date: '03.07', primary: 1, previous: 1 },
];

const CPC_DYNAMICS_CPM_CHART_DATA: CpcDynamicsPoint[] = [
  { date: '27.06', primary: 172, previous: 168 },
  { date: '28.06', primary: 173, previous: 169 },
  { date: '29.06', primary: 174, previous: 170 },
  { date: '30.06', primary: 174, previous: 171 },
  { date: '01.07', primary: 175, previous: 172 },
  { date: '02.07', primary: 175, previous: 173 },
  { date: '03.07', primary: 175, previous: 174 },
];

const CPC_DYNAMICS_CPM_CHART_DATA_LOW: CpcDynamicsPoint[] = [
  { date: '27.06', primary: 347, previous: 350 },
  { date: '28.06', primary: 347, previous: 348 },
  { date: '29.06', primary: 347, previous: 347 },
  { date: '30.06', primary: 347, previous: 347 },
  { date: '01.07', primary: 347, previous: 347 },
  { date: '02.07', primary: 347, previous: 347 },
  { date: '03.07', primary: 347, previous: 347 },
];

const CPC_DYNAMICS_CPC_CHART_DATA: CpcDynamicsPoint[] = [
  { date: '27.06', primary: 58, previous: 62 },
  { date: '28.06', primary: 59, previous: 61 },
  { date: '29.06', primary: 60, previous: 60 },
  { date: '30.06', primary: 61, previous: 59 },
  { date: '01.07', primary: 62, previous: 58 },
  { date: '02.07', primary: 62, previous: 57 },
  { date: '03.07', primary: 62, previous: 56 },
];

const CPC_DYNAMICS_CPC_CHART_DATA_LOW: CpcDynamicsPoint[] = [
  { date: '27.06', primary: 0, previous: 0 },
  { date: '28.06', primary: 0, previous: 0 },
  { date: '29.06', primary: 0, previous: 0 },
  { date: '30.06', primary: 0, previous: 0 },
  { date: '01.07', primary: 0, previous: 0 },
  { date: '02.07', primary: 0, previous: 0 },
  { date: '03.07', primary: 0, previous: 0 },
];

const CPC_DYNAMICS_CPO_CHART_DATA: CpcDynamicsPoint[] = [
  { date: '27.06', primary: 278, previous: 295 },
  { date: '28.06', primary: 275, previous: 290 },
  { date: '29.06', primary: 272, previous: 285 },
  { date: '30.06', primary: 270, previous: 280 },
  { date: '01.07', primary: 268, previous: 275 },
  { date: '02.07', primary: 269, previous: 272 },
  { date: '03.07', primary: 269, previous: 270 },
];

const CPC_DYNAMICS_CPO_CHART_DATA_LOW: CpcDynamicsPoint[] = [
  { date: '27.06', primary: 0, previous: 0 },
  { date: '28.06', primary: 0, previous: 0 },
  { date: '29.06', primary: 0, previous: 0 },
  { date: '30.06', primary: 0, previous: 0 },
  { date: '01.07', primary: 0, previous: 0 },
  { date: '02.07', primary: 0, previous: 0 },
  { date: '03.07', primary: 0, previous: 0 },
];

const CPC_DYNAMICS_CURRENCY_CHART_DATA_BY_METRIC: Partial<
  Record<CpcChartMetricId, { normal: CpcDynamicsPoint[]; low: CpcDynamicsPoint[] }>
> = {
  orderSum: { normal: CPC_DYNAMICS_ORDER_SUM_CHART_DATA, low: CPC_DYNAMICS_ORDER_SUM_CHART_DATA_LOW },
  spend: { normal: CPC_DYNAMICS_SPEND_CHART_DATA, low: CPC_DYNAMICS_SPEND_CHART_DATA_LOW },
  cpm: { normal: CPC_DYNAMICS_CPM_CHART_DATA, low: CPC_DYNAMICS_CPM_CHART_DATA_LOW },
  cpc: { normal: CPC_DYNAMICS_CPC_CHART_DATA, low: CPC_DYNAMICS_CPC_CHART_DATA_LOW },
  cpo: { normal: CPC_DYNAMICS_CPO_CHART_DATA, low: CPC_DYNAMICS_CPO_CHART_DATA_LOW },
};

const CPC_DYNAMICS_SEARCH_POSITION_CHART_DATA: CpcDynamicsPoint[] = [
  { date: '27.06', primary: 3, previous: 4 },
  { date: '28.06', primary: 3, previous: 3 },
  { date: '29.06', primary: 2, previous: 3 },
  { date: '30.06', primary: 2, previous: 2 },
  { date: '01.07', primary: 2, previous: 2 },
  { date: '02.07', primary: 2, previous: 2 },
  { date: '03.07', primary: 2, previous: 2 },
];

const CPC_DYNAMICS_SEARCH_POSITION_CHART_DATA_LOW: CpcDynamicsPoint[] = [
  { date: '27.06', primary: 24, previous: 26 },
  { date: '28.06', primary: 22, previous: 25 },
  { date: '29.06', primary: 21, previous: 23 },
  { date: '30.06', primary: 20, previous: 22 },
  { date: '01.07', primary: 19, previous: 21 },
  { date: '02.07', primary: 19, previous: 20 },
  { date: '03.07', primary: 19, previous: 19 },
];

function dynamicsChartDataForMetric(
  metricId: CpcChartMetricId,
  isLowActivityDemo: boolean,
): CpcDynamicsPoint[] {
  const kind = chartValueKindForMetric(metricId);
  if (kind === 'position') {
    return isLowActivityDemo
      ? CPC_DYNAMICS_SEARCH_POSITION_CHART_DATA_LOW
      : CPC_DYNAMICS_SEARCH_POSITION_CHART_DATA;
  }
  const countSeries = CPC_DYNAMICS_COUNT_CHART_DATA_BY_METRIC[metricId];
  if (kind === 'count' && countSeries) {
    return isLowActivityDemo ? countSeries.low : countSeries.normal;
  }
  const currencySeries = CPC_DYNAMICS_CURRENCY_CHART_DATA_BY_METRIC[metricId];
  if (kind === 'currency' && currencySeries) {
    return isLowActivityDemo ? currencySeries.low : currencySeries.normal;
  }
  return isLowActivityDemo ? CPC_DYNAMICS_PERCENT_CHART_DATA_LOW : CPC_DYNAMICS_PERCENT_CHART_DATA;
}

const CHART_AXIS_TITLE_CLASS =
  'pointer-events-none absolute top-0 z-10 text-sm font-semibold text-gray-900';

const CHART_VERTICAL_AXIS_TICK = { fill: '#111827', fontSize: 13, fontWeight: 600 };

function StatsChartPositionsGridIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className={className} aria-hidden>
      <rect x="2" y="2" width="5" height="5" rx="1" fill="currentColor" />
      <rect x="9" y="2" width="5" height="5" rx="1" fill="currentColor" opacity="0.28" />
      <rect x="2" y="9" width="5" height="5" rx="1" fill="currentColor" opacity="0.28" />
      <rect x="9" y="9" width="5" height="5" rx="1" fill="currentColor" opacity="0.28" />
    </svg>
  );
}

function StatsChartPositionIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className={className} aria-hidden>
      <rect x="2" y="9" width="2.5" height="5" rx="0.5" fill="currentColor" opacity="0.35" />
      <rect x="6.5" y="6" width="2.5" height="8" rx="0.5" fill="currentColor" opacity="0.65" />
      <rect x="11" y="3" width="2.5" height="11" rx="0.5" fill="currentColor" />
    </svg>
  );
}

function StatOpenChartButton({ onClick, label }: { onClick: () => void; label: string }) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  return (
    <div
      className="absolute right-0 top-0 z-10"
      onMouseEnter={() => setIsTooltipVisible(true)}
      onMouseLeave={() => setIsTooltipVisible(false)}
    >
      {isTooltipVisible ? (
        <div
          role="tooltip"
          className="pointer-events-none absolute bottom-full right-0 z-50 mb-1.5 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg"
        >
          Показать на графике
        </div>
      ) : null}
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClick();
        }}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#9A41FE]/35 bg-[#F6F2FF] text-[#9A41FE] opacity-0 shadow-sm transition-[opacity,colors] hover:border-[#9A41FE] hover:bg-[#9A41FE] hover:text-white group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A41FE]/40"
        aria-label={`Показать на графике: ${label}`}
      >
        <StatsChartPositionIcon className="h-4 w-4 shrink-0" />
      </button>
    </div>
  );
}

function StatMetricCard({
  title,
  onOpenChart,
  primaryMetric,
  footer,
}: {
  title: string;
  onOpenChart: () => void;
  primaryMetric: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="min-h-[7.5rem] rounded-xl border border-gray-200 bg-white p-4">
      <div className="group relative pr-10">
        <StatOpenChartButton onClick={onOpenChart} label={title} />
        <p className="text-sm font-medium text-gray-900">{title}</p>
        {primaryMetric}
      </div>
      {footer}
    </div>
  );
}

function StatSecondaryMetricWithChart({
  label,
  onOpenChart,
  value,
  trend,
  valueMuted,
}: {
  label: string;
  onOpenChart: () => void;
  value: string;
  trend?: { value: string; direction: StatTrendDirection; positiveIsGood?: boolean };
  valueMuted?: boolean;
}) {
  return (
    <div className="group relative min-w-0 pr-9">
      <StatOpenChartButton onClick={onOpenChart} label={label} />
      <StatSecondaryMetric label={label} value={value} trend={trend} valueMuted={valueMuted} />
    </div>
  );
}

function CpcChartSelectDropdown<T extends string>({
  options,
  value,
  onChange,
  isOpen,
  onOpenChange,
}: {
  options: { id: T; label: string; optionTag?: string }[];
  value: T;
  onChange: (id: T) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((m) => m.id === value);
  const label = selected?.label ?? '';
  const selectedTag = selected?.optionTag;

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onOpenChange]);

  const buttonClass =
    'border-gray-200 bg-[#F2F2F7] font-medium text-gray-900 hover:bg-[#E8E8ED]';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => onOpenChange(!isOpen)}
        className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition-colors ${buttonClass}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <span className="truncate">{label}</span>
          {selectedTag ? (
            <span className="shrink-0 rounded-md bg-[#F6F2FF] px-1.5 py-0.5 text-xs font-semibold text-[#9A41FE]">
              {selectedTag}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen ? (
        <div
          className="absolute left-0 top-full z-50 mt-1 min-w-[11rem] max-w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
          role="listbox"
        >
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={value === option.id}
              className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${
                value === option.id ? 'bg-[#F2F2F7] font-medium text-gray-900' : 'text-gray-700'
              }`}
              onClick={() => {
                onChange(option.id);
                onOpenChange(false);
              }}
            >
              <span className="flex items-center justify-between gap-2">
                <span>{option.label}</span>
                {option.optionTag ? (
                  <span className="shrink-0 rounded-md bg-[#F6F2FF] px-1.5 py-0.5 text-xs font-semibold text-[#9A41FE]">
                    {option.optionTag}
                  </span>
                ) : null}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CpcPositionComboChart({
  thirdMetric,
  isLowActivityDemo,
}: {
  thirdMetric: CpcChartThirdMetricId;
  isLowActivityDemo: boolean;
}) {
  const leftMetric = CPC_POSITION_LEFT_METRIC[thirdMetric];
  const data = isLowActivityDemo ? CPC_POSITION_CHART_DATA_LOW : CPC_POSITION_CHART_DATA;
  const leftDomain = leftMetric.kind === 'share' ? ([0, 0.5] as const) : ([0, 'auto'] as const);
  const leftTicks =
    leftMetric.kind === 'share' ? [0, 0.1, 0.2, 0.3, 0.4, 0.5] : undefined;

  const leftValueKind: CpcChartValueKind = leftMetric.kind === 'share' ? 'percent' : 'count';

  const formatLeftTick = (value: number) => formatChartAxisTick(leftValueKind, value);

  const formatLeftTooltip = (value: number) => [
    formatChartTooltipValue(leftValueKind, value),
    leftMetric.label,
  ];

  return (
    <div className="mt-2 h-[300px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 28, right: 8, left: 4, bottom: 4 }}>
          <CartesianGrid stroke="#ECECF0" vertical />
          <XAxis
            dataKey="range"
            tick={{ fill: '#767386', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval={0}
            height={48}
          />
          <YAxis
            yAxisId="left"
            orientation="left"
            tick={CHART_VERTICAL_AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={leftMetric.kind === 'share' ? 44 : 52}
            domain={leftDomain}
            ticks={leftTicks}
            tickFormatter={formatLeftTick}
          />
          <YAxis
            yAxisId="ctr"
            orientation="right"
            tick={CHART_VERTICAL_AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={40}
            domain={[0, 0.07]}
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => {
              if (name === 'ctr') return [`${(value * 100).toFixed(2)}%`, 'CTR'];
              return formatLeftTooltip(value);
            }}
          />
          <Bar
            yAxisId="left"
            dataKey={leftMetric.dataKey}
            fill="#9A41FE"
            radius={[3, 3, 0, 0]}
            barSize={28}
            name="left"
          />
          <Line
            yAxisId="ctr"
            type="monotone"
            dataKey="ctr"
            stroke="#22C55E"
            strokeWidth={2}
            dot={false}
            name="ctr"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function CpcDynamicsLineChart({
  isLowActivityDemo,
  primaryLineLabel,
  chartMetric,
}: {
  isLowActivityDemo: boolean;
  primaryLineLabel: string;
  chartMetric: CpcChartMetricId;
}) {
  const valueKind = chartValueKindForMetric(chartMetric);
  const data = dynamicsChartDataForMetric(chartMetric, isLowActivityDemo);

  return (
    <div className="mt-2 h-[300px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 28, right: 8, left: 4, bottom: 4 }}>
          <CartesianGrid stroke="#ECECF0" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: '#767386', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={CHART_VERTICAL_AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={valueKind === 'percent' ? 44 : 56}
            domain={[0, 'auto']}
            tickFormatter={(v) => formatChartAxisTick(valueKind, v)}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => {
              if (name === 'previous') {
                return [formatChartTooltipValue(valueKind, value), 'Прошлый период'];
              }
              return [formatChartTooltipValue(valueKind, value), primaryLineLabel];
            }}
          />
          <Line
            type="monotone"
            dataKey="primary"
            stroke="#22C55E"
            strokeWidth={2}
            dot={false}
            name="primary"
          />
          <Line
            type="monotone"
            dataKey="previous"
            stroke="#22C55E"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="previous"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function CpcCampaignStatisticsSection({
  isLowActivityDemo,
  onIncreaseBidClick,
}: {
  isLowActivityDemo: boolean;
  onIncreaseBidClick: () => void;
}) {
  const statsChartRef = useRef<HTMLDivElement>(null);
  const [isChartVisible, setIsChartVisible] = useState(true);
  const [chartTab, setChartTab] = useState<CpcStatsChartTab>('dynamics');
  const [chartMetric, setChartMetric] = useState<CpcChartMetricId>('ctr');
  const [chartThirdMetric, setChartThirdMetric] =
    useState<CpcChartThirdMetricId>('impressionShare');
  const [openChartDropdown, setOpenChartDropdown] = useState<'metric' | 'thirdMetric' | null>(
    null,
  );

  const chartMetricLabel =
    CPC_CHART_ALL_METRICS.find((m) => m.id === chartMetric)?.label ?? 'Метрика';

  const positionLeftAxisLabel = CPC_POSITION_LEFT_METRIC[chartThirdMetric].label;

  const isPositionTabAvailable = isPositionChartTabAvailable(chartMetric);
  const isDynamicsTabAvailable = isDynamicsChartTabAvailable(chartMetric);
  const showChartModeTabs = chartMetric === 'searchPosition';
  const effectiveChartTab: CpcStatsChartTab = showChartModeTabs ? chartTab : 'dynamics';

  useEffect(() => {
    if (chartTab === 'position' && !isPositionTabAvailable && isDynamicsTabAvailable) {
      setChartTab('dynamics');
    }
    if (chartTab === 'dynamics' && !isDynamicsTabAvailable && isPositionTabAvailable) {
      setChartTab('position');
    }
  }, [chartTab, isPositionTabAvailable, isDynamicsTabAvailable]);

  useEffect(() => {
    if (chartTab !== 'position') {
      setOpenChartDropdown((open) => (open === 'thirdMetric' ? null : open));
    }
  }, [chartTab]);

  const handleChartMetricChange = (metricId: CpcChartMetricId) => {
    setChartMetric(metricId);
    const focus = chartFocusForMetric(metricId);
    setChartThirdMetric(focus.third);
    const positionOk = isPositionChartTabAvailable(metricId);
    const dynamicsOk = isDynamicsChartTabAvailable(metricId);
    if (focus.tab === 'position' && positionOk) {
      setChartTab('position');
    } else if (dynamicsOk) {
      setChartTab('dynamics');
    } else if (positionOk) {
      setChartTab('position');
    }
  };

  const handleChartThirdMetricChange = (thirdMetricId: CpcChartThirdMetricId) => {
    setChartThirdMetric(thirdMetricId);
  };

  const focusChart = useCallback((metricId: CpcChartMetricId) => {
    const focus = chartFocusForMetric(metricId);
    const openingChart = !isChartVisible;
    setIsChartVisible(true);
    setChartMetric(metricId);
    setChartThirdMetric(focus.third);
    const positionOk = isPositionChartTabAvailable(metricId);
    const dynamicsOk = isDynamicsChartTabAvailable(metricId);
    if (focus.tab === 'position' && positionOk) {
      setChartTab('position');
    } else if (dynamicsOk) {
      setChartTab('dynamics');
    } else if (positionOk) {
      setChartTab('position');
    }
    setOpenChartDropdown(null);
    const scrollToChart = () => {
      statsChartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    if (openingChart) {
      window.setTimeout(scrollToChart, 50);
    } else {
      window.requestAnimationFrame(scrollToChart);
    }
  }, [isChartVisible]);

  const dateLabel = isLowActivityDemo ? '27.06.2026 — 03.07.2026' : '15.04.25—21.04.25';

  const impressionsMain = isLowActivityDemo ? '3' : '29 231';
  const impressionsTrend = isLowActivityDemo
    ? { value: '0%', direction: 'up' as const }
    : { value: '3,4%', direction: 'up' as const };
  const cpmValue = isLowActivityDemo ? '346,67 ₽' : '175 ₽';
  const cpmTrend = isLowActivityDemo
    ? { value: '0%', direction: 'up' as const }
    : { value: '1,0%', direction: 'up' as const };
  const searchPosition = isLowActivityDemo ? '19' : '2';

  const clicksMain = isLowActivityDemo ? '0' : '83';
  const clicksTrend = isLowActivityDemo
    ? { value: '0%', direction: 'up' as const }
    : { value: '12,1%', direction: 'up' as const };

  const ordersMain = isLowActivityDemo ? '0' : '19';
  const ordersTrend = isLowActivityDemo
    ? { value: '0%', direction: 'down' as const, positiveIsGood: false }
    : { value: '18,8%', direction: 'up' as const };
  const cpoValue = isLowActivityDemo ? 'Нет данных' : '269 ₽';
  const cpoMuted = isLowActivityDemo;

  const shareMain = isLowActivityDemo ? '0%' : '50,6%';
  const shareTrend = isLowActivityDemo
    ? { value: '0%', direction: 'down' as const, positiveIsGood: true }
    : { value: '0,3%', direction: 'down' as const, positiveIsGood: true };
  const orderSum = isLowActivityDemo ? '0 ₽' : '196 000 ₽';
  const spendLabel = 'Затраты';
  const spendValue = isLowActivityDemo ? '1,04 ₽' : '5 115 ₽';

  return (
    <section className="mb-8 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-bold text-gray-900">Статистика</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="tabular-nums">{dateLabel}</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <span className="text-gray-500" aria-hidden>
              📊
            </span>
            Полная статистика
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatMetricCard
          title="Показы"
          onOpenChart={() => focusChart('impressions')}
          primaryMetric={
            <StatPrimaryMetric value={impressionsMain} trend={impressionsTrend} compact />
          }
          footer={
            <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
              <StatSecondaryMetricWithChart
                label="CPM"
                value={cpmValue}
                trend={cpmTrend}
                onOpenChart={() => focusChart('cpm')}
              />
              <StatSecondaryMetricWithChart
                label="Позиция в поиске"
                value={searchPosition}
                onOpenChart={() => focusChart('searchPosition')}
              />
            </div>
          }
        />

        <StatMetricCard
          title="Клики"
          onOpenChart={() => focusChart('clicks')}
          primaryMetric={<StatPrimaryMetric value={clicksMain} trend={clicksTrend} compact />}
          footer={
            <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
              <StatSecondaryMetricWithChart
                label="CTR"
                value={isLowActivityDemo ? '0%' : '0,28%'}
                trend={
                  isLowActivityDemo
                    ? { value: '0%', direction: 'up' }
                    : { value: '0,03%', direction: 'down', positiveIsGood: false }
                }
                onOpenChart={() => focusChart('ctr')}
              />
              <StatSecondaryMetricWithChart
                label="CPC"
                value={isLowActivityDemo ? '0 ₽' : '61 ₽'}
                trend={
                  isLowActivityDemo
                    ? { value: '0%', direction: 'up' }
                    : { value: '6,1%', direction: 'up' }
                }
                onOpenChart={() => focusChart('cpc')}
              />
            </div>
          }
        />

        <StatMetricCard
          title="Заказы"
          onOpenChart={() => focusChart('orders')}
          primaryMetric={<StatPrimaryMetric value={ordersMain} trend={ordersTrend} compact />}
          footer={
            <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
              <StatSecondaryMetricWithChart
                label="CR"
                value={isLowActivityDemo ? '0%' : '22,9%'}
                trend={
                  isLowActivityDemo
                    ? { value: '0%', direction: 'down', positiveIsGood: false }
                    : { value: '1,4%', direction: 'up' }
                }
                onOpenChart={() => focusChart('cr')}
              />
              <StatSecondaryMetricWithChart
                label="CPO"
                value={cpoValue}
                valueMuted={cpoMuted}
                onOpenChart={() => focusChart('cpo')}
              />
            </div>
          }
        />

        <StatMetricCard
          title="Доля затрат"
          onOpenChart={() => focusChart('costShare')}
          primaryMetric={<StatPrimaryMetric value={shareMain} trend={shareTrend} compact />}
          footer={
            <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
              <StatSecondaryMetricWithChart
                label="Сумма заказов"
                value={orderSum}
                trend={
                  isLowActivityDemo
                    ? { value: '0%', direction: 'down', positiveIsGood: false }
                    : { value: '5,8%', direction: 'up' }
                }
                onOpenChart={() => focusChart('orderSum')}
              />
              <StatSecondaryMetricWithChart
                label={spendLabel}
                value={spendValue}
                trend={
                  isLowActivityDemo
                    ? { value: '0%', direction: 'up' }
                    : { value: '5,3%', direction: 'up' }
                }
                onOpenChart={() => focusChart('spend')}
              />
            </div>
          }
        />
      </div>

      <label className="mt-4 flex cursor-pointer select-none items-center gap-2.5 text-[15px] font-medium text-gray-700">
        <StatsChartToggleSwitch checked={isChartVisible} onChange={setIsChartVisible} />
        <span>Показать график</span>
      </label>

      <div ref={statsChartRef} className="scroll-mt-6" aria-hidden={!isChartVisible} />

      {isChartVisible ? (
        <div className="mt-4 border-t border-gray-100 pt-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <CpcChartSelectDropdown
                options={CPC_CHART_ALL_METRICS}
                value={chartMetric}
                onChange={handleChartMetricChange}
                isOpen={openChartDropdown === 'metric'}
                onOpenChange={(open) => setOpenChartDropdown(open ? 'metric' : null)}
              />
              {showChartModeTabs ? (
                <div className="inline-flex shrink-0 rounded-lg bg-[#F2F2F7] p-0.5">
                  <button
                    type="button"
                    disabled={!isDynamicsTabAvailable}
                    onClick={() => isDynamicsTabAvailable && setChartTab('dynamics')}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      !isDynamicsTabAvailable
                        ? 'cursor-not-allowed text-gray-400 opacity-50'
                        : chartTab === 'dynamics'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Calendar className="h-4 w-4 shrink-0" />
                    По дням
                  </button>
                  <button
                    type="button"
                    disabled={!isPositionTabAvailable}
                    onClick={() => isPositionTabAvailable && setChartTab('position')}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      !isPositionTabAvailable
                        ? 'cursor-not-allowed text-gray-400 opacity-50'
                        : chartTab === 'position'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <StatsChartPositionsGridIcon className="shrink-0" />
                    По позициям
                  </button>
                </div>
              ) : null}
              {showChartModeTabs && chartTab === 'position' ? (
                <CpcChartSelectDropdown
                  options={CPC_CHART_THIRD_METRICS}
                  value={chartThirdMetric}
                  onChange={handleChartThirdMetricChange}
                  isOpen={openChartDropdown === 'thirdMetric'}
                  onOpenChange={(open) => setOpenChartDropdown(open ? 'thirdMetric' : null)}
                />
              ) : null}
            </div>
          </div>

          {effectiveChartTab === 'position' ? (
            <>
              <div className="relative mt-4">
                <p className={`${CHART_AXIS_TITLE_CLASS} left-0`}>{positionLeftAxisLabel}</p>
                <p className={`${CHART_AXIS_TITLE_CLASS} right-0`}>CTR, %</p>
                <CpcPositionComboChart
                  thirdMetric={chartThirdMetric}
                  isLowActivityDemo={isLowActivityDemo}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-600">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-sm bg-[#9A41FE]" aria-hidden />
                  {positionLeftAxisLabel}
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-0.5 w-4 rounded bg-[#22C55E]" aria-hidden />
                  CTR
                </span>
              </div>
              <div className="mt-4 rounded-xl bg-[#F6F2FF] px-4 py-3 text-sm leading-snug text-gray-800">
                Ваша карточка чаще всего показывалась в поиске на позициях с 11 по 34. Чтобы поднять её
                выше,{' '}
                <button
                  type="button"
                  onClick={onIncreaseBidClick}
                  className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  увеличьте ставку
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="relative mt-4">
                <p className={`${CHART_AXIS_TITLE_CLASS} left-0`}>{chartMetricLabel}</p>
                <CpcDynamicsLineChart
                  isLowActivityDemo={isLowActivityDemo}
                  primaryLineLabel={chartMetricLabel}
                  chartMetric={chartMetric}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-600">
                <span className="inline-flex items-center gap-2">
                  <span className="h-0.5 w-4 rounded bg-[#22C55E]" aria-hidden />
                  {chartMetricLabel}
                </span>
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-0 w-4 border-t-2 border-dashed border-[#22C55E]"
                    aria-hidden
                  />
                  Прошлый период
                </span>
              </div>
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}

export const CpcCampaignPage: React.FC<CpcCampaignPageProps> = ({
  campaignId,
  name,
  remainingBudget,
  dailyLimit,
  scheduledDailyLimit,
  dailyLimitExhausted,
  fromReadyToRepeat,
  repeatLaunchPreset,
  onBack,
  onUpdateData,
}) => {
  const { beginRepeatLaunchFlow, profileId } = useProfile();
  const [isAutoRefillModalOpen, setIsAutoRefillModalOpen] = useState(false);
  const [isDailyLimitEnabled, setIsDailyLimitEnabled] = useState(dailyLimit !== null && dailyLimit !== undefined);
  const [dailyLimitValue, setDailyLimitValue] = useState(dailyLimit ? String(dailyLimit) : '');
  const [isBudgetRefillModalOpen, setIsBudgetRefillModalOpen] = useState(false);
  const [dailyLimitBudgetShortfall, setDailyLimitBudgetShortfall] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastIsError, setToastIsError] = useState(false);
  const [isAutoRefillEnabled, setIsAutoRefillEnabled] = useState(false);
  const [wasAutoRefillToggledOn, setWasAutoRefillToggledOn] = useState(false);
  const [campaignBudget, setCampaignBudget] = useState(remainingBudget ?? 1000);
  const [campaignName, setCampaignName] = useState(name);
  const [isDailyLimitTooltipVisible, setIsDailyLimitTooltipVisible] = useState(false);
  const [isExhaustedPlaqueTooltipVisible, setIsExhaustedPlaqueTooltipVisible] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [pendingDailyLimit, setPendingDailyLimit] = useState<string | null>(null);
  const [savedDailyLimit, setSavedDailyLimit] = useState(dailyLimit ? String(dailyLimit) : '');
  const [isCarryoverEnabled, setIsCarryoverEnabled] = useState(false);
  const [isCarryoverTooltipVisible, setIsCarryoverTooltipVisible] = useState(false);
  const productsSectionRef = useRef<HTMLElement>(null);
  const productKey = String(DEMO_CPC_PRODUCT_NM);
  const [productSearchBids, setProductSearchBids] = useState<Record<string, ProductBidEntry>>({
    [productKey]: { draft: '17.9', saved: '17.9' },
  });
  const [productRecommendationsBids, setProductRecommendationsBids] = useState<Record<string, ProductBidEntry>>({
    [productKey]: { draft: '7.9', saved: '7.9' },
  });
  const [isProductActionsMenuOpen, setIsProductActionsMenuOpen] = useState(false);
  const productActionsMenuRef = useRef<HTMLDivElement>(null);
  const [isBidChasingEnabled, setIsBidChasingEnabled] = useState(false);
  const [isBidChasingModalOpen, setIsBidChasingModalOpen] = useState(false);
  const [bidChasingPosition, setBidChasingPosition] = useState<'1-2' | '3-10' | '11-34'>('1-2');
  const [bidChasingMaxBid, setBidChasingMaxBid] = useState(11.88);
  const [displayZones, setDisplayZones] = useState({ search: true, recommendations: true });
  const [bidLimitBudgetConflictModal, setBidLimitBudgetConflictModal] = useState<
    | {
        kind: 'productBid';
        productKey: string;
        zone: 'search' | 'recommendations';
        attemptedBid: number;
        newDailyLimit: number;
        shortfall: number;
      }
    | {
        kind: 'bidChasing';
        position: '1-2' | '3-10' | '11-34';
        maxBid: number;
        shortfall: number;
      }
    | null
  >(null);

  const maxSavedProductBidRub = useMemo(() => {
    const values = [
      ...Object.values(productSearchBids).map((b) => parseDisplayValue(b.saved)),
      ...Object.values(productRecommendationsBids).map((b) => parseDisplayValue(b.saved)),
    ].filter((n) => n > 0);
    if (isBidChasingEnabled && bidChasingMaxBid > 0) {
      values.push(bidChasingMaxBid);
    }
    return values.length ? Math.max(...values) : 0;
  }, [productSearchBids, productRecommendationsBids, isBidChasingEnabled, bidChasingMaxBid]);

  const bidChasingPositionLinkLabel = useMemo(() => {
    const labels: Record<'1-2' | '3-10' | '11-34', string> = {
      '1-2': '1–2',
      '3-10': '3–10',
      '11-34': '11–34',
    };
    return `${labels[bidChasingPosition]} позиции в поиске`;
  }, [bidChasingPosition]);

  const recommendedDailyLimitForBids = useMemo(
    () => minDailyLimitForMaxBid(maxSavedProductBidRub),
    [maxSavedProductBidRub],
  );

  const savedDailyLimitRub = useMemo(() => {
    const parsed = parseDisplayValue(savedDailyLimit);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [savedDailyLimit]);

  const onUpdateDataRef = useRef(onUpdateData);
  onUpdateDataRef.current = onUpdateData;
  const lastSyncedMaxBidRef = useRef<number | null>(null);

  useEffect(() => {
    if (maxSavedProductBidRub <= 0) return;
    if (lastSyncedMaxBidRef.current === maxSavedProductBidRub) return;
    lastSyncedMaxBidRef.current = maxSavedProductBidRub;
    onUpdateDataRef.current?.({ maxCpcBidRub: maxSavedProductBidRub });
  }, [maxSavedProductBidRub]);

  const showDailyLimitBidMismatchHint =
    isDailyLimitEnabled &&
    savedDailyLimitRub > 0 &&
    maxSavedProductBidRub > 0 &&
    isDailyLimitBelowRecommendedForMaxBid(savedDailyLimitRub, maxSavedProductBidRub);

  const applyBidWithDailyLimitDisabled = useCallback(
    (productKey: string, zone: 'search' | 'recommendations', bid: number) => {
      setIsDailyLimitEnabled(false);
      setDailyLimitValue('');
      setSavedDailyLimit('');
      setIsCarryoverEnabled(false);
      setDailyLimitBudgetShortfall(null);
      if (onUpdateData) {
        onUpdateData({ dailyLimit: null, scheduledDailyLimit: null });
      }
      const setter = zone === 'search' ? setProductSearchBids : setProductRecommendationsBids;
      setter((prev) => ({
        ...prev,
        [productKey]: { draft: String(bid), saved: String(bid) },
      }));
      setToastMessage('Ставка изменена');
      setToastIsError(false);
      setShowToast(true);
    },
    [onUpdateData],
  );

  const applyBidChasingWithDailyLimitDisabled = useCallback(
    (position: '1-2' | '3-10' | '11-34', maxBid: number) => {
      setIsDailyLimitEnabled(false);
      setDailyLimitValue('');
      setSavedDailyLimit('');
      setIsCarryoverEnabled(false);
      setDailyLimitBudgetShortfall(null);
      if (onUpdateData) {
        onUpdateData({ dailyLimit: null, scheduledDailyLimit: null });
      }
      setBidChasingPosition(position);
      setBidChasingMaxBid(maxBid);
      setIsBidChasingEnabled(true);
      setToastMessage('Преследование ставки настроено');
      setToastIsError(false);
      setShowToast(true);
    },
    [onUpdateData],
  );

  const commitProductBid = useCallback(
    (zone: 'search' | 'recommendations', parsed: number) => {
      const bids = zone === 'search' ? productSearchBids : productRecommendationsBids;
      const entry = bids[productKey];
      if (!entry) return;
      if (parsed > CPC_MAX_BID_RUB) {
        const setter = zone === 'search' ? setProductSearchBids : setProductRecommendationsBids;
        setter((prev) => ({
          ...prev,
          [productKey]: { ...entry, draft: entry.saved },
        }));
        setToastMessage(`Максимальная ставка в CPC — ${formatForDisplay(CPC_MAX_BID_RUB)} ₽`);
        setToastIsError(true);
        setShowToast(true);
        return;
      }
      const bidStr = String(parsed);
      const otherSaved =
        zone === 'search'
          ? parseDisplayValue(productRecommendationsBids[productKey]?.saved ?? '0')
          : parseDisplayValue(productSearchBids[productKey]?.saved ?? '0');
      const chasingCeiling = isBidChasingEnabled ? bidChasingMaxBid : 0;
      const maxBid = Math.max(parsed, otherSaved, chasingCeiling);

      const setter = zone === 'search' ? setProductSearchBids : setProductRecommendationsBids;
      setter((prev) => ({
        ...prev,
        [productKey]: { draft: bidStr, saved: bidStr },
      }));
      setToastMessage('Ставка изменена');
      setToastIsError(false);
      setShowToast(true);
    },
    [
      productKey,
      productSearchBids,
      productRecommendationsBids,
      isBidChasingEnabled,
      bidChasingMaxBid,
    ],
  );

  const handleProductBidDraftChange = useCallback(
    (zone: 'search' | 'recommendations', raw: string) => {
      const v = raw.replace(',', '.');
      if (v === '' || /^\d*\.?\d*$/.test(v)) {
        const setter = zone === 'search' ? setProductSearchBids : setProductRecommendationsBids;
        setter((prev) => ({
          ...prev,
          [productKey]: {
            ...prev[productKey],
            draft: v,
          },
        }));
      }
    },
    [productKey],
  );

  const handleProductBidBlur = useCallback(
    (zone: 'search' | 'recommendations') => {
      const bids = zone === 'search' ? productSearchBids : productRecommendationsBids;
      const entry = bids[productKey];
      if (!entry) return;
      const parsed = parseDisplayValue(entry.draft);
      if (entry.draft === '' || isNaN(parsed) || parsed <= 0) {
        const setter = zone === 'search' ? setProductSearchBids : setProductRecommendationsBids;
        setter((prev) => ({
          ...prev,
          [productKey]: { ...entry, draft: entry.saved },
        }));
        return;
      }
      if (parseDisplayValue(entry.draft) === parseDisplayValue(entry.saved)) return;
      commitProductBid(zone, parsed);
    },
    [productKey, productSearchBids, productRecommendationsBids, commitProductBid],
  );

  const disableDailyLimit = useCallback(() => {
    setIsDailyLimitEnabled(false);
    setPendingDailyLimit(null);
    setDailyLimitValue('');
    setSavedDailyLimit('');
    setIsCarryoverEnabled(false);
    setDailyLimitBudgetShortfall(null);
    setToastMessage('Дневной лимит отключен');
    setToastIsError(false);
    setShowToast(true);
    if (onUpdateData) {
      onUpdateData({ dailyLimit: null, scheduledDailyLimit: null });
    }
  }, [onUpdateData]);

  const applyMinDailyLimitOnEnable = useCallback(() => {
    const minLimit = DAILY_LIMIT_ABSOLUTE_MIN;
    if (minLimit > campaignBudget) {
      setDailyLimitBudgetShortfall(minLimit - campaignBudget);
      setDailyLimitValue('');
      setIsCarryoverEnabled(false);
      return;
    }
    setIsDailyLimitEnabled(true);
    setIsCarryoverEnabled(true);
    setDailyLimitValue(String(minLimit));
    setPendingDailyLimit(null);
    setSavedDailyLimit(String(minLimit));
    setDailyLimitBudgetShortfall(null);
    setToastMessage(`Дневной лимит ${formatForDisplay(minLimit)} ₽ включён`);
    setToastIsError(false);
    setShowToast(true);
    if (onUpdateData) {
      onUpdateData({ dailyLimit: minLimit, scheduledDailyLimit: null });
    }
  }, [campaignBudget, onUpdateData]);

  // Sync with props when they change
  useEffect(() => {
    setCampaignName(name);
  }, [name]);

  useEffect(() => {
    setCampaignBudget(remainingBudget ?? 1000);
  }, [remainingBudget]);

  useEffect(() => {
    const isEnabled = dailyLimit !== null && dailyLimit !== undefined;
    setIsDailyLimitEnabled(isEnabled);
    if (isEnabled && dailyLimit) {
      setDailyLimitValue(String(dailyLimit));
      setSavedDailyLimit(String(dailyLimit));
    } else {
      setDailyLimitValue('');
      setSavedDailyLimit('');
    }
  }, [dailyLimit]);

  useEffect(() => {
    if (isFirstVisit) {
      const timer = setTimeout(() => {
        setIsDailyLimitTooltipVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isFirstVisit]);

  useEffect(() => {
    if (isFirstVisit && isDailyLimitTooltipVisible) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.tooltip-container')) {
          setIsDailyLimitTooltipVisible(false);
          setIsFirstVisit(false);
        }
      };
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [isFirstVisit, isDailyLimitTooltipVisible]);

  useEffect(() => {
    if (!isProductActionsMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        productActionsMenuRef.current &&
        !productActionsMenuRef.current.contains(target)
      ) {
        setIsProductActionsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [isProductActionsMenuOpen]);

  const isCardWorkBonusScenario = fromReadyToRepeat && profileId === '2';

  const dailyLimitSpendSummary = useMemo(() => {
    if (!isDailyLimitEnabled) return null;
    const parsedSaved = parseDisplayValue(savedDailyLimit);
    const parsedInput = parseDisplayValue(dailyLimitValue);
    const total =
      parsedSaved > 0 ? parsedSaved : parsedInput > 0 ? parsedInput : DAILY_LIMIT_ABSOLUTE_MIN;
    const spent = dailyLimitExhausted ? total : 0;
    const progress = total > 0 ? Math.min(100, (spent / total) * 100) : 0;
    return { total, spent, progress };
  }, [isDailyLimitEnabled, savedDailyLimit, dailyLimitValue, dailyLimitExhausted]);

  return (
    <div className="min-h-screen bg-[#F6F6F9] font-sans text-gray-900 pb-10">
      <AppHeader onNavigate={onBack} />

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
            <div className="mt-2 flex items-center gap-3 text-sm text-gray-500 flex-wrap">
              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                Активна
              </span>
              {fromReadyToRepeat && (
                <span className="px-2 py-0.5 rounded-full bg-[#f3e8ff] text-[#9a41fe] text-xs font-medium">
                  Кампания за бонусы
                </span>
              )}
              <span>CPC</span>
              <span>ID {campaignId}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm font-medium bg-gray-800 text-white rounded-lg hover:bg-gray-900">
              Приостановить
            </button>
            <button className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200">
              Завершить
            </button>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
          <div className="flex min-h-[148px] flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="mb-4 text-sm font-semibold text-gray-900">Остаток бюджета</p>
            <div className="flex flex-1 flex-col justify-center gap-4 sm:flex-row sm:items-start sm:justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsBudgetRefillModalOpen(true);
                }}
                className="shrink-0 text-left text-[26px] font-semibold leading-none text-[#6366f1] transition-colors hover:text-purple-700"
              >
                {formatCurrency(campaignBudget)}
              </button>
              <div className="min-w-0 flex-1 sm:max-w-[320px]">
                <div className="flex items-center gap-2">
                  <ToggleSwitch
                    checked={isAutoRefillEnabled}
                    onChange={(checked) => {
                      if (checked) {
                        setWasAutoRefillToggledOn(true);
                        setIsAutoRefillModalOpen(true);
                      } else {
                        setIsAutoRefillEnabled(false);
                        setWasAutoRefillToggledOn(false);
                        setToastMessage('Изменения сохранены');
                        setShowToast(true);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setWasAutoRefillToggledOn(false);
                      setIsAutoRefillModalOpen(true);
                    }}
                    className="text-sm font-medium text-[#6366f1] transition-colors hover:text-purple-700"
                  >
                    Автопополнение бюджета
                  </button>
                  <div className="group/autorefill-tip relative inline-block">
                    <HelpCircle className="h-4 w-4 cursor-help text-gray-400" />
                    <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 hidden w-64 -translate-x-1/2 rounded-lg bg-gray-900 p-3 text-left text-xs text-white shadow-lg group-hover/autorefill-tip:block">
                      Пополняем бюджет автоматически по заданным условиям, не чаще одного раза в день.
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-xs leading-snug text-gray-400">
                  {isAutoRefillEnabled ? (
                    <>
                      Если бюджет меньше {formatForDisplay(1000)} ₽, пополнять на{' '}
                      {formatForDisplay(3000)} ₽ не чаще 1 раза в день
                    </>
                  ) : (
                    <>Включите автопополнение, чтобы кампания не останавливалась</>
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="flex min-h-[148px] flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-start justify-center gap-2">
                  <ToggleSwitch
                    checked={isDailyLimitEnabled}
                    onChange={(checked) => {
                      if (checked) {
                        applyMinDailyLimitOnEnable();
                      } else {
                        disableDailyLimit();
                      }
                    }}
                  />
                  <div className="min-w-0 flex-1 pt-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">Дневной лимит</span>
                      <DailyLimitInfoTooltip />
                    </div>
                  </div>
                </div>
              {dailyLimitExhausted && (
                <div
                  className="relative inline-block shrink-0"
                  onMouseEnter={() => setIsExhaustedPlaqueTooltipVisible(true)}
                  onMouseLeave={() => setIsExhaustedPlaqueTooltipVisible(false)}
                >
                  <div className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">
                    Дневной лимит исчерпан
                  </div>
                  {isExhaustedPlaqueTooltipVisible && (
                    <>
                      <div
                        className="absolute right-0 top-full h-2 w-48"
                        onMouseEnter={() => setIsExhaustedPlaqueTooltipVisible(true)}
                      />
                      <div
                        className="absolute right-0 top-full z-50 mt-2 w-max max-w-[300px] rounded-lg bg-gray-900 p-3 text-left text-xs text-white shadow-lg"
                        onMouseEnter={() => setIsExhaustedPlaqueTooltipVisible(true)}
                        onMouseLeave={() => setIsExhaustedPlaqueTooltipVisible(false)}
                      >
                        Показы остановлены до завтра. Если хотите возобновить показы сейчас, увеличьте
                        лимит
                      </div>
                    </>
                  )}
                </div>
              )}
              </div>
            </div>

            <div className="flex flex-1 items-center">
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 pr-4">
                <div className="relative w-full max-w-[240px]">
                  <input
                    type="text"
                    value={dailyLimitValue ? formatForDisplay(dailyLimitValue) : ''}
                    disabled={!isDailyLimitEnabled}
                    onChange={(e) => {
                      const parsed = parseDisplayValue(e.target.value);
                      if (!isNaN(parsed)) {
                        setDailyLimitValue(String(parsed));
                      } else if (e.target.value === '') {
                        setDailyLimitValue('');
                      }
                    }}
                    onBlur={() => {
                      if (!isDailyLimitEnabled) return;
                      const parsed = parseDisplayValue(dailyLimitValue);
                      if (
                        dailyLimitValue === '' ||
                        parseDisplayValue(dailyLimitValue) === parseDisplayValue(savedDailyLimit)
                      ) {
                        return;
                      }
                      if (isNaN(parsed) || parsed < DAILY_LIMIT_ABSOLUTE_MIN) {
                        setDailyLimitValue(savedDailyLimit || '');
                        setToastMessage(
                          `Минимальный дневной лимит — ${formatForDisplay(DAILY_LIMIT_ABSOLUTE_MIN)} ₽`,
                        );
                        setToastIsError(true);
                        setShowToast(true);
                        return;
                      }
                      if (parsed > campaignBudget) {
                        setDailyLimitValue(savedDailyLimit || '');
                        setDailyLimitBudgetShortfall(parsed - campaignBudget);
                        return;
                      }
                      setSavedDailyLimit(dailyLimitValue);
                      setDailyLimitBudgetShortfall(null);
                      setToastMessage(
                        `Новый дневной лимит установлен.\nРаспределяем ${formatForDisplay(parsed)}₽ в течении суток равномерно`,
                      );
                      setShowToast(true);
                      if (onUpdateData) {
                        onUpdateData({ dailyLimit: parsed, scheduledDailyLimit: null });
                      }
                    }}
                    className={`w-full rounded-lg border py-2 pl-3 pr-8 text-sm font-medium shadow-sm outline-none transition-colors ${
                      !isDailyLimitEnabled
                        ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
                        : 'border-gray-200 bg-white text-gray-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                    }`}
                    placeholder={`Задайте от ${formatForDisplay(DAILY_LIMIT_ABSOLUTE_MIN)}`}
                  />
                  <span
                    className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm ${
                      !isDailyLimitEnabled ? 'text-gray-300' : 'text-gray-400'
                    }`}
                  >
                    ₽
                  </span>
                </div>
                {showDailyLimitBidMismatchHint ? (
                  <DailyLimitBidMismatchHint
                    recommendedDailyLimitRub={recommendedDailyLimitForBids}
                    className="mt-1.5"
                  />
                ) : null}
                <label className="m-0 flex cursor-pointer items-center gap-2">
                  <Checkbox
                    disabled={!isDailyLimitEnabled}
                    checked={isCarryoverEnabled}
                    onChange={(e) => {
                      if (!isDailyLimitEnabled) return;
                      setIsCarryoverEnabled(e.target.checked);
                      setToastMessage('Настройка переноса лимита сохранена');
                      setShowToast(true);
                    }}
                  />
                  <span
                    className={`text-xs ${isDailyLimitEnabled ? 'text-gray-700' : 'text-gray-400'}`}
                  >
                    Переносить неистраченные деньги
                  </span>
                  <div
                    className="relative inline-block"
                    onMouseEnter={() => setIsCarryoverTooltipVisible(true)}
                    onMouseLeave={() => setIsCarryoverTooltipVisible(false)}
                  >
                    <HelpCircle className="h-4 w-4 cursor-help text-gray-400" />
                    {isCarryoverTooltipVisible && (
                      <div className="absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2 rounded-lg bg-gray-900 p-3 text-left text-xs text-white shadow-lg">
                        <p className="mb-1">Система старается тратить бюджет равномерно.</p>
                        <p>
                          Если сегодня потратится меньше дневного лимита, остаток будет добавлен к
                          лимиту следующего дня. Общая сумма расходов не увеличивается.
                        </p>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              {dailyLimitSpendSummary ? (
                <div className="flex w-[min(148px,30%)] shrink-0 flex-col justify-center gap-1 border-l border-gray-200 pl-4">
                  <span className="text-xs text-gray-500">Истратили</span>
                  <p className="whitespace-nowrap text-sm leading-none tabular-nums text-gray-900">
                    <span className="font-semibold">
                      {formatForDisplay(dailyLimitSpendSummary.spent)} ₽
                    </span>
                    <span className="font-normal text-gray-500">
                      {' '}
                      из {formatForDisplay(dailyLimitSpendSummary.total)} ₽
                    </span>
                  </p>
                  <div className="mt-1 h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-gray-700 transition-[width] duration-300"
                      style={{ width: `${dailyLimitSpendSummary.progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex w-[min(148px,30%)] shrink-0 flex-col justify-center border-l border-gray-200 pl-4">
                  <p className="text-xs leading-snug text-gray-500">
                    Чем больше ставка, тем больше будет минимальный лимит
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {fromReadyToRepeat && (
          <CampaignRepeatPerformanceBlock
            profileId={profileId}
            rankingProduct={
              repeatLaunchPreset
                ? {
                    name: repeatLaunchPreset.product.productName,
                    imageUrl: repeatLaunchPreset.product.imageUrl,
                    meta: `${repeatLaunchPreset.product.category} • ${repeatLaunchPreset.product.nmId}`,
                  }
                : undefined
            }
            onRepeatCampaign={() => {
              if (repeatLaunchPreset) {
                beginRepeatLaunchFlow(repeatLaunchPreset);
              }
            }}
          />
        )}

        <CpcCampaignStatisticsSection
          isLowActivityDemo={isCardWorkBonusScenario}
          onIncreaseBidClick={() => {
            productsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setToastMessage('Измените ставку в блоке «Товары»');
            setToastIsError(false);
            setShowToast(true);
          }}
        />

        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Зоны показов</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 min-h-[4.5rem]">
              <div className="flex items-center gap-2 min-w-0">
                <ToggleSwitch
                  checked={displayZones.search}
                  onChange={(checked) => {
                    setDisplayZones((prev) => {
                      const next = { ...prev, search: checked };
                      if (!next.search && !next.recommendations) return { ...prev, search: true };
                      return next;
                    });
                  }}
                />
                <span className="text-sm font-medium text-gray-900">Поиск</span>
              </div>
              <DisplayZoneSearchArt />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 min-h-[4.5rem]">
              <div className="flex items-center gap-2 min-w-0">
                <ToggleSwitch
                  checked={displayZones.recommendations}
                  onChange={(checked) => {
                    setDisplayZones((prev) => {
                      const next = { ...prev, recommendations: checked };
                      if (!next.search && !next.recommendations) return { ...prev, recommendations: true };
                      return next;
                    });
                  }}
                />
                <span className="text-sm font-medium text-gray-900">Рекомендации</span>
              </div>
              <DisplayZoneRecommendationsArt />
            </div>
          </div>
        </section>

        <section
          ref={productsSectionRef}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-8"
        >
          <h2 className="mb-5 text-lg font-bold text-gray-900">
            Товары{' '}
            <span className="font-normal text-gray-500">1 шт.</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] table-fixed text-sm">
              <colgroup>
                <col className="w-[52px]" />
                <col />
                <col className="w-[6.5rem]" />
                <col className="w-[10.5rem]" />
                <col className="w-[11.5rem]" />
                <col className="w-[5.5rem]" />
              </colgroup>
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="pb-3 pr-3 font-normal align-bottom">
                    <HeaderHint label="Фото" />
                  </th>
                  <th className="pb-3 pr-4 font-normal align-bottom">
                    <HeaderHint label="Бренд · Артикул · Название" />
                  </th>
                  <th className="pb-3 pr-3 font-normal align-bottom text-right">
                    <span className="inline-flex justify-end w-full">
                      <HeaderHint label="Рекомендации" />
                    </span>
                  </th>
                  <th className="pb-3 pr-3 font-normal align-bottom text-right">
                    <span className="inline-flex justify-end w-full">
                      <HeaderHint label="Поиск" className="pr-[42px]" />
                    </span>
                  </th>
                  <th className="pb-3 pr-3 font-normal align-bottom">
                    <HeaderHint label="Преследование ставки" />
                  </th>
                  <th className="pb-3 font-normal align-bottom" aria-hidden />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 pr-3 align-top">
                    <CampaignProductThumb
                      nmId={DEMO_CPC_PRODUCT.nmId}
                      imageUrl={DEMO_CPC_PRODUCT.imageUrl}
                      category={DEMO_CPC_PRODUCT.category}
                      alt={DEMO_CPC_PRODUCT.productName}
                    />
                  </td>
                  <td className="py-3 pr-4 align-top">
                    <p className="text-sm font-semibold leading-tight text-gray-900">
                      {DEMO_CPC_PRODUCT.productName}
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                      <span>{DEMO_CPC_PRODUCT.nmId}</span>
                      <CopyNmIdButton nmId={DEMO_CPC_PRODUCT.nmId} />
                    </div>
                  </td>
                  <td className="py-3 pr-3 align-top text-right">
                    <div className="flex justify-end">
                      <ProductBidField
                        value={productRecommendationsBids[productKey]?.draft ?? ''}
                        onChange={(e) => {
                          const v = e.target.value.replace(',', '.');
                          if (v === '' || /^\d*\.?\d*$/.test(v)) {
                            setProductRecommendationsBids((prev) => ({
                              ...prev,
                              [productKey]: {
                                ...prev[productKey],
                                draft: v,
                              },
                            }));
                          }
                        }}
                        onBlur={() => handleProductBidBlur('recommendations')}
                      />
                    </div>
                  </td>
                  <td className="py-3 pr-3 align-top text-right">
                    <div className="flex items-start justify-end gap-1.5">
                      <div className="shrink-0">
                        {isBidChasingEnabled ? (
                          <ProductBidReadOnly
                            value={
                              productSearchBids[productKey]?.saved ||
                              productSearchBids[productKey]?.draft ||
                              ''
                            }
                          />
                        ) : (
                          <>
                            <ProductBidField
                              value={productSearchBids[productKey]?.draft ?? ''}
                              onChange={(e) => handleProductBidDraftChange('search', e.target.value)}
                              onBlur={() => handleProductBidBlur('search')}
                            />
                            <SearchBidPositionHint />
                          </>
                        )}
                      </div>
                      {!isBidChasingEnabled ? (
                        <BidHistogramButton
                          onClick={() => {
                            setToastMessage('Статистика ставки в поиске');
                            setShowToast(true);
                          }}
                        />
                      ) : null}
                    </div>
                  </td>
                  <td className="py-3 pr-3 align-top">
                    <div className="flex min-h-9 items-start">
                      {isBidChasingEnabled ? (
                        <button
                          type="button"
                          className="text-left text-sm font-medium leading-snug text-blue-600 hover:text-blue-700 hover:underline"
                          onClick={() => setIsBidChasingModalOpen(true)}
                        >
                          {bidChasingPositionLinkLabel}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="h-9 rounded-lg bg-[#F2F2F7] px-4 text-sm font-medium text-gray-800 hover:bg-[#e8e8ed]"
                          onClick={() => setIsBidChasingModalOpen(true)}
                        >
                          Настроить
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-3 align-top text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      <div className="relative inline-flex" ref={productActionsMenuRef}>
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                          aria-label="Действия"
                          aria-haspopup="menu"
                          aria-expanded={isProductActionsMenuOpen}
                          onClick={() => setIsProductActionsMenuOpen((v) => !v)}
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        {isProductActionsMenuOpen && (
                          <div
                            role="menu"
                            className="absolute right-0 bottom-[calc(100%+6px)] z-50 min-w-[10rem] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
                          >
                            {isBidChasingEnabled ? (
                              <button
                                type="button"
                                role="menuitem"
                                className="block w-full px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-50"
                                onClick={() => {
                                  setIsProductActionsMenuOpen(false);
                                  setIsBidChasingEnabled(false);
                                  setToastMessage('Преследование ставки отключено');
                                  setShowToast(true);
                                }}
                              >
                                Отключить преследование
                              </button>
                            ) : null}
                            <button
                              type="button"
                              role="menuitem"
                              className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                              onClick={() => {
                                setIsProductActionsMenuOpen(false);
                                setToastMessage('Товар удалён из кампании');
                                setShowToast(true);
                              }}
                            >
                              Удалить
                            </button>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                        aria-label="Подробнее"
                        onClick={() => {
                          setToastMessage('Детали товара');
                          setShowToast(true);
                        }}
                      >
                        <ChevronDown className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {fromReadyToRepeat && (
          <SimilarDemandProductsBlock
            onAddToLaunch={() => {
              if (repeatLaunchPreset) {
                beginRepeatLaunchFlow(repeatLaunchPreset);
              }
            }}
          />
        )}
      </main>

      {/* Auto Refill Modal */}
      {isAutoRefillModalOpen && (
        <AutoRefillModal
          isOpen={isAutoRefillModalOpen}
          onClose={() => {
            setIsAutoRefillModalOpen(false);
            if (wasAutoRefillToggledOn) {
              setIsAutoRefillEnabled(false);
              setWasAutoRefillToggledOn(false);
            }
          }}
          onSave={() => {
            setIsAutoRefillEnabled(true);
            setIsAutoRefillModalOpen(false);
            setWasAutoRefillToggledOn(false);
            setToastMessage('Автопополнение настроено');
            setShowToast(true);
          }}
        />
      )}

      <BidChasingClustersModal
        isOpen={isBidChasingModalOpen}
        initialPosition={bidChasingPosition}
        initialMaxBid={bidChasingMaxBid}
        isDailyLimitEnabled={isDailyLimitEnabled}
        savedDailyLimitRub={savedDailyLimitRub}
        otherMaxProductBidRub={Math.max(
          parseDisplayValue(productSearchBids[productKey]?.saved ?? '0'),
          parseDisplayValue(productRecommendationsBids[productKey]?.saved ?? '0'),
        )}
        isBidChasingEnabled={isBidChasingEnabled}
        onDisable={() => {
          setIsBidChasingEnabled(false);
          setIsBidChasingModalOpen(false);
          setToastMessage('Преследование ставки отключено');
          setToastIsError(false);
          setShowToast(true);
        }}
        onClose={() => setIsBidChasingModalOpen(false)}
        onApply={({ position, maxBid }) => {
          setBidChasingPosition(position);
          setBidChasingMaxBid(maxBid);
          setIsBidChasingEnabled(true);
          setIsBidChasingModalOpen(false);
          setToastMessage('Преследование ставки настроено');
          setToastIsError(false);
          setShowToast(true);
        }}
      />

      {/* Budget Refill Modal */}
      {isBudgetRefillModalOpen && (
        <BudgetRefillModal
          isOpen={isBudgetRefillModalOpen}
          onClose={() => setIsBudgetRefillModalOpen(false)}
          onSave={(amount) => {
            const newBudget = campaignBudget + amount;
            setCampaignBudget((prev) => prev + amount);
            setIsBudgetRefillModalOpen(false);
            if (onUpdateData) {
              onUpdateData({ remainingBudget: newBudget });
            }
            setToastMessage('Бюджет пополнен');
            setShowToast(true);
          }}
          dailyLimit={parseDisplayValue(dailyLimitValue)}
          currentBudget={campaignBudget}
          showDailyLimitInfo={false}
        />
      )}

      {bidLimitBudgetConflictModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
          onClick={() => setBidLimitBudgetConflictModal(null)}
        >
          <div
            className="relative w-full max-w-[540px] rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setBidLimitBudgetConflictModal(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-4 pr-8">
              <p className="text-base font-semibold leading-snug text-gray-900">
                {bidLimitBudgetConflictModal.kind === 'bidChasing' ? (
                  <>
                    Не получилось установить Дневной лимит. Пополните бюджет на{' '}
                    {formatForDisplay(bidLimitBudgetConflictModal.shortfall)} ₽
                  </>
                ) : (
                  <>
                    Чтобы установить ставку {formatForDisplay(bidLimitBudgetConflictModal.attemptedBid)}{' '}
                    ₽, пополните бюджет на {formatForDisplay(bidLimitBudgetConflictModal.shortfall)} ₽ —
                    иначе мы не сможем повысить дневной лимит
                  </>
                )}
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-3 sm:items-end">
              <button
                type="button"
                onClick={() => {
                  setBidLimitBudgetConflictModal(null);
                  setIsBudgetRefillModalOpen(true);
                }}
                className="rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-700 sm:min-w-[200px]"
              >
                Пополнить бюджет
              </button>
              <button
                type="button"
                onClick={() => {
                  const payload = bidLimitBudgetConflictModal;
                  setBidLimitBudgetConflictModal(null);
                  if (payload.kind === 'productBid') {
                    applyBidWithDailyLimitDisabled(
                      payload.productKey,
                      payload.zone,
                      payload.attemptedBid,
                    );
                  } else {
                    applyBidChasingWithDailyLimitDisabled(payload.position, payload.maxBid);
                  }
                }}
                className="text-left text-sm font-medium leading-snug text-blue-600 transition-colors hover:text-blue-700 hover:underline sm:text-right"
              >
                {bidLimitBudgetConflictModal.kind === 'bidChasing'
                  ? `Отключить дневной лимит и применить лимит ставки ${formatForDisplay(bidLimitBudgetConflictModal.maxBid)} ₽`
                  : 'Отключить дневной лимит и применить ставку'}
              </button>
            </div>
          </div>
        </div>
      )}

      {dailyLimitBudgetShortfall != null && dailyLimitBudgetShortfall > 0 && (
        <div
          className="fixed top-20 right-8 z-[100] flex max-w-sm items-start gap-3 rounded-xl border border-red-500 bg-white px-4 py-3 shadow-xl animate-in fade-in slide-in-from-right-4 duration-300"
          role="alert"
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500 text-white"
            aria-hidden
          >
            <X className="h-4 w-4" />
          </div>
          <p className="flex-1 pt-1 text-sm font-semibold leading-snug text-gray-900">
            Не получилось установить Дневной лимит. Пополните бюджет на{' '}
            {formatForDisplay(dailyLimitBudgetShortfall)} ₽
          </p>
          <button
            type="button"
            onClick={() => setDailyLimitBudgetShortfall(null)}
            className="shrink-0 text-gray-900 hover:text-gray-600"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Toast */}
      <Toast 
        show={showToast} 
        message={toastMessage} 
        onClose={() => { setShowToast(false); setToastIsError(false); }} 
        isSuccess={!toastIsError && (toastMessage.includes('Новый дневной лимит установлен') || toastMessage.includes('Дневной лимит отключен'))}
        isError={toastIsError}
        durationMs={toastIsError ? 2000 : 3000}
      />
    </div>
  );
};

// Auto Refill Modal Component
const AutoRefillModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}> = ({ isOpen, onClose, onSave }) => {
  const [threshold, setThreshold] = useState('1000');
  const [amount, setAmount] = useState('3000');
  const [usePromoBonuses, setUsePromoBonuses] = useState(true);
  const [showPackages, setShowPackages] = useState(true);

  const ModalToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) => (
    <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none cursor-pointer ${checked ? 'bg-purple-500' : 'bg-gray-300'}`}>
      <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
  
  const handleNumericInput = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseDisplayValue(e.target.value);
    if (!isNaN(parsed)) {
      setter(String(parsed));
    } else if (e.target.value === '') {
      setter('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Автопополнение бюджета кампании</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="bg-gray-50/70 p-6 rounded-xl border border-gray-100">
            <h3 className="text-lg font-bold mb-4">Условия пополнения</h3>
            <div className="space-y-4 max-w-lg">
              <div className="grid grid-cols-2 items-center gap-4">
                <label htmlFor="threshold" className="text-gray-600">Если бюджет меньше</label>
                <div className="relative">
                  <input id="threshold" type="text" value={formatForDisplay(threshold)} onChange={handleNumericInput(setThreshold)} className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 w-full pr-6" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">₽</span>
                </div>
              </div>
              <div className="grid grid-cols-2 items-center gap-4">
                <label htmlFor="amount" className="text-gray-600">Пополнять на</label>
                 <div className="relative">
                  <input id="amount" type="text" value={formatForDisplay(amount)} onChange={handleNumericInput(setAmount)} className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 w-full pr-6" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">₽</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">Источники списания <span className="tooltip"><HelpCircle className="w-4 h-4 text-gray-400" /><span className="tooltip-text">Деньги будут списываться с Единого счёта</span></span></h3>
                 <button className="flex items-center gap-2 text-sm text-blue-600 font-medium hover:underline">
                    <RefreshCw className="w-4 h-4" />
                    <span>Обновить счета</span>
                 </button>
             </div>
             <div className="space-y-3">
                <div className="flex items-center py-2">
                    <SingleAccountIcon className="w-6 h-6 text-gray-500 mr-4"/>
                    <p className="font-medium text-gray-800">Единый счёт: {UNIFIED_BALANCE.toLocaleString('ru-RU')} ₽</p>
                </div>
                <div className="flex items-center py-2">
                    <div className="w-6 h-6 mr-4 rounded-full bg-purple-500"></div>
                    <div className="flex-grow">
                        <p className="font-medium text-gray-800">Промо-бонусы: {TOTAL_PROMO_BONUS.toLocaleString('ru-RU')} B <span className="text-gray-500 font-normal">(до 100% от суммы пополнения)</span></p>
                    </div>
                    <ModalToggleSwitch checked={usePromoBonuses} onChange={setUsePromoBonuses} />
                </div>
             </div>
             <p className="text-sm text-gray-500 mt-4 pl-10">Спишем промо-бонусы из ваших пакетов автоматически. Сначала из тех, что сгорают быстрее, затем из остальных. Сумма списания зависит от условий пакета</p>

            <div className="mt-6 pl-10">
                <button onClick={() => setShowPackages(!showPackages)} className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200">
                    <span>Мои пакеты</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showPackages ? 'rotate-180' : ''}`} />
                </button>
                {showPackages && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-300">
                        {BONUS_PACKAGES.map(pkg => (
                            <div key={pkg.id} className="bg-white p-4 rounded-xl border-2 border-gray-200 shadow-sm hover:border-purple-400 transition-all cursor-pointer">
                                <span className="text-2xl font-bold text-gray-900">{pkg.amount.toLocaleString('ru-RU')}</span>
                                <p className="text-sm text-gray-600 mt-1 mb-3">Оплата до {pkg.maxPercent}% от суммы</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{pkg.displayBurn} сгорят {pkg.expiry}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                 <p className="text-sm text-gray-500 mt-4">Новые пакеты учтём автоматически, и доступных промо-бонусов станет больше</p>
            </div>
          </div>
        </div>

        <div className="flex justify-start items-center gap-3 p-6 bg-gray-50/70 border-t border-gray-100 rounded-b-2xl">
            <button onClick={onSave} className="px-6 py-2.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg">
                Сохранить
            </button>
            <button onClick={onClose} className="px-6 py-2.5 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                Отмена
            </button>
        </div>
      </div>
    </div>
  );
};

// Budget Refill Modal Component
const BudgetRefillModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (amount: number) => void;
  dailyLimit: number;
  currentBudget: number;
  showDailyLimitInfo?: boolean;
}> = ({ isOpen, onClose, onSave, dailyLimit, currentBudget, showDailyLimitInfo = false }) => {
  const [refillAmount, setRefillAmount] = useState('3000');
  const [useBonuses, setUseBonuses] = useState(false);
  const [selectedPkgId, setSelectedPkgId] = useState(BONUS_PACKAGES[0].id);
  const [bonusValue, setBonusValue] = useState<number | string>(3000);
  const [budgetError, setBudgetError] = useState('');
  const [bonusError, setBonusError] = useState('');
  const neededAmount = dailyLimit > currentBudget ? dailyLimit - currentBudget : 0;

  useEffect(() => {
    if (isOpen) {
      setRefillAmount('3000');
      setUseBonuses(false);
      setBonusValue(3000);
      setBudgetError('');
      setBonusError('');
    }
  }, [isOpen]);

  const selectedPkg = useMemo(() => BONUS_PACKAGES.find(p => p.id === selectedPkgId) || BONUS_PACKAGES[0], [selectedPkgId]);
  const currentBudgetValue = parseDisplayValue(refillAmount);
  const numericBonusValue = parseDisplayValue(String(bonusValue));

  useEffect(() => {
    setBudgetError('');
    setBonusError('');

    if (currentBudgetValue < 1000 && refillAmount !== '') {
      setBudgetError('Минимальный бюджет 1000 ₽');
    }

    if (useBonuses) {
      if (numericBonusValue > currentBudgetValue) {
        setBonusError('Сумма бонусов не может превышать общий бюджет');
        return;
      }

      const maxBonusFromPackage = selectedPkg.amount;
      if (numericBonusValue > maxBonusFromPackage) {
        setBonusError(`В пакете доступно только ${formatForDisplay(maxBonusFromPackage)} B`);
        return;
      }

      const maxPercent = selectedPkg.maxPercent / 100;
      const maxBonusAllowedByPercent = currentBudgetValue * maxPercent;

      if (numericBonusValue > maxBonusAllowedByPercent) {
        setBonusError(`Можно списать максимум ${formatForDisplay(Math.floor(maxBonusAllowedByPercent))} B (${selectedPkg.maxPercent}% от суммы)`);
        return;
      }
    }
  }, [refillAmount, useBonuses, bonusValue, selectedPkg, currentBudgetValue, numericBonusValue]);

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseDisplayValue(e.target.value);
    if (!isNaN(parsed)) {
      setRefillAmount(String(parsed));
    } else if (e.target.value === '') {
      setRefillAmount('');
    }
  };

  const handleBudgetBlur = () => {
    const parsed = parseDisplayValue(refillAmount);
    if (isNaN(parsed) || parsed < 1000) {
      setRefillAmount('1000');
    }
  };

  const handleBonusBlur = () => {
    const numericValue = parseDisplayValue(String(bonusValue));
    if (isNaN(numericValue) || numericValue < 0) {
      setBonusValue(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-xl p-6 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-gray-900">Пополнение бюджета</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="mb-6 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
          <div className="space-y-6">
            {showDailyLimitInfo && dailyLimit > currentBudget && neededAmount > 0 && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                <p className="text-sm text-gray-900 font-medium">
                  Чтобы задать дневной лимит {formatForDisplay(dailyLimit)} ₽, пополните бюджет еще на {formatForDisplay(neededAmount)} ₽
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Сумма пополнения</label>
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  className={`w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 pr-8 ${budgetError ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="3000"
                  value={formatForDisplay(refillAmount)}
                  onChange={handleBudgetChange}
                  onBlur={handleBudgetBlur}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">₽</span>
              </div>
              {budgetError && <p className="text-red-500 text-xs mt-1.5">{budgetError}</p>}
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-4">
              <Checkbox
                id="bonus-toggle"
                checked={useBonuses}
                onChange={e => setUseBonuses(e.target.checked)}
                className="w-5 h-5 text-purple-600 cursor-pointer"
              />
              <label htmlFor="bonus-toggle" className="text-sm font-semibold text-gray-900 cursor-pointer">
                Списать промо-бонусы <span className="text-gray-400 font-normal ml-1">({formatForDisplay(TOTAL_PROMO_BONUS)} B)</span>
              </label>
            </div>

              {useBonuses && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                    {BONUS_PACKAGES.map(pkg => (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPkgId(pkg.id)}
                        className={`min-w-[200px] p-4 rounded-xl border-2 transition-all cursor-pointer snap-start relative ${selectedPkgId === pkg.id ? 'border-purple-600 bg-purple-50/30' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xl font-bold text-gray-900">{formatForDisplay(pkg.amount)}</span>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPkgId === pkg.id ? 'border-purple-600' : 'border-gray-300'}`}>
                            {selectedPkgId === pkg.id && <div className="w-2.5 h-2.5 bg-purple-600 rounded-full"></div>}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mb-3 font-medium leading-tight">Оплата до {pkg.maxPercent}% от суммы</p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-auto pt-1">
                          <span className="text-orange-500">🔥</span>
                          <span>{pkg.displayBurn} сгорят {pkg.expiry}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-col md:flex-row md:items-center gap-6">
                    <div className="relative w-full md:w-48">
                      <input
                        type="text"
                        value={formatForDisplay(bonusValue)}
                        onChange={e => setBonusValue(e.target.value)}
                        onBlur={handleBonusBlur}
                        className={`w-full border rounded-xl px-4 py-3 text-lg font-bold outline-none focus:ring-2 focus:ring-purple-500 ${bonusError ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      <p className="text-xs text-gray-500 mt-1.5">до {formatForDisplay(numericBonusValue)} B (1B = 1P)</p>
                    </div>
                    <div className="text-sm text-gray-500 leading-snug">
                      {bonusError ? (
                        <p className="text-red-500">{bonusError}</p>
                      ) : (
                        <p>Списать можно максимум {selectedPkg.maxPercent}% от суммы пополнения</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Отмена</button>
          <button
            onClick={() => {
              const amount = parseDisplayValue(refillAmount);
              onSave(amount);
            }}
            disabled={!!budgetError || !!bonusError}
            className="px-4 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Пополнить
          </button>
        </div>
      </div>
    </div>
  );
};

const BID_CHASING_MIN_BID_RUB = 1.88;

type BidChasingRange = '1-2' | '3-10' | '11-34';

const BID_CHASING_POSITION_OPTIONS: {
  id: BidChasingRange;
  label: string;
  accentClass: string;
  selectedBgClass: string;
}[] = [
  {
    id: '1-2',
    label: '1–2 позиции',
    accentClass: 'border-l-[#9A41FE]',
    selectedBgClass: 'bg-[#F6F2FF]',
  },
  {
    id: '3-10',
    label: '3–10 позиции',
    accentClass: 'border-l-emerald-400',
    selectedBgClass: 'bg-white',
  },
  {
    id: '11-34',
    label: '11–34 позиции',
    accentClass: 'border-l-teal-300',
    selectedBgClass: 'bg-white',
  },
];

const BidChasingClustersModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onApply: (config: { position: BidChasingRange; maxBid: number }) => void;
  initialPosition: BidChasingRange;
  initialMaxBid: number;
  isDailyLimitEnabled: boolean;
  savedDailyLimitRub: number;
  otherMaxProductBidRub: number;
  isBidChasingEnabled: boolean;
  onDisable: () => void;
}> = ({
  isOpen,
  onClose,
  onApply,
  initialPosition,
  initialMaxBid,
  isDailyLimitEnabled,
  savedDailyLimitRub,
  otherMaxProductBidRub,
  isBidChasingEnabled,
  onDisable,
}) => {
  const [position, setPosition] = useState<BidChasingRange>(initialPosition);
  const [maxBidDraft, setMaxBidDraft] = useState(String(initialMaxBid));

  useEffect(() => {
    if (!isOpen) return;
    setPosition(initialPosition);
    setMaxBidDraft(String(initialMaxBid));
  }, [isOpen, initialPosition, initialMaxBid]);

  if (!isOpen) return null;

  const parsedMaxBid = parseDisplayValue(maxBidDraft.replace(',', '.'));
  const maxBidValid =
    Number.isFinite(parsedMaxBid) &&
    parsedMaxBid >= BID_CHASING_MIN_BID_RUB &&
    parsedMaxBid <= CPC_MAX_BID_RUB;

  const effectiveMaxBidRub = Math.max(
    Number.isFinite(parsedMaxBid) ? parsedMaxBid : 0,
    otherMaxProductBidRub,
  );
  const handleApply = () => {
    if (!maxBidValid) return;
    onApply({ position, maxBid: parsedMaxBid });
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/50" onClick={onClose} role="presentation">
      <div className="flex h-full w-full justify-end" onClick={onClose}>
        <div
          className="flex h-full max-h-full items-stretch"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 flex-col justify-start pt-5 pl-3">
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-500 shadow-md hover:bg-gray-50 hover:text-gray-700"
              aria-label="Закрыть"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            className="flex h-full w-full max-w-[560px] flex-col overflow-hidden bg-white shadow-2xl animate-in slide-in-from-right duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bid-chasing-modal-title"
          >
            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              <h2 id="bid-chasing-modal-title" className="text-xl font-bold text-gray-900 leading-snug">
                Преследование ставки в кластерах
              </h2>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            Алгоритм будет автоматически регулировать ставку, чтобы карточка занимала выбранные позиции в
            поисковой выдаче
          </p>

          <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5">
            <h3 className="text-base font-semibold text-gray-900">Какие позиции хотите занимать в поиске</h3>
            <p className="mt-1 text-sm text-gray-500">Показываем диапазоны ставок для разных позиций</p>
            <div className="mt-4 flex flex-col gap-2">
              {BID_CHASING_POSITION_OPTIONS.map((opt) => {
                const selected = position === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPosition(opt.id)}
                    className={`flex w-full items-start gap-3 rounded-xl border border-gray-100 border-l-4 px-4 py-3 text-left transition-colors ${opt.accentClass} ${
                      selected ? opt.selectedBgClass : 'bg-white hover:bg-gray-50/80'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        selected ? 'border-purple-600 bg-purple-600' : 'border-gray-300 bg-white'
                      }`}
                      aria-hidden
                    >
                      {selected ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-gray-900">{opt.label}</span>
                      <span className="mt-0.5 block text-xs text-gray-400">Ставки: собираем данные</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-5">
            <h3 className="text-base font-semibold text-gray-900">Установите лимит ставки</h3>
            <p className="mt-1 text-sm text-gray-500">
              Алгоритм не превысит его, даже если ставка в кластерах вырастет
            </p>
            <div className="relative mt-4">
              <input
                type="text"
                inputMode="decimal"
                value={maxBidDraft}
                onChange={(e) => {
                  const v = e.target.value.replace(',', '.');
                  if (v === '' || /^\d*\.?\d*$/.test(v)) setMaxBidDraft(v);
                }}
                className={`w-full rounded-xl border px-4 py-3 pr-10 text-base text-gray-900 outline-none transition-colors ${
                  maxBidValid || maxBidDraft === ''
                    ? 'border-gray-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                    : 'border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-400'
                }`}
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                ₽
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              От {BID_CHASING_MIN_BID_RUB.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} до{' '}
              {formatForDisplay(CPC_MAX_BID_RUB)} ₽
            </p>

          </div>

          <div className="mt-4 flex gap-3 rounded-2xl bg-[#F6F2FF] px-4 py-3">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white text-sm font-bold"
              aria-hidden
            >
              !
            </span>
            <div className="min-w-0 text-sm leading-snug">
              <p className="font-semibold text-gray-900">
                Если не получится удержать позиции, применим рекомендованную ставку
              </p>
              <p className="mt-0.5 text-gray-500">При слишком высокой ставке применим лимит</p>
            </div>
          </div>
            </div>

            <div className="flex shrink-0 flex-col gap-3 border-t border-gray-100 bg-gray-50/60 px-6 py-4 sm:px-8">
              {isBidChasingEnabled ? (
                <button
                  type="button"
                  onClick={onDisable}
                  className="self-start text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
                >
                  Отключить преследование ставки
                </button>
              ) : null}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-[#F2F2F7] px-6 py-2.5 text-sm font-medium text-gray-900 hover:bg-[#e8e8ed]"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={!maxBidValid}
                onClick={handleApply}
                className="rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Применить
              </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

