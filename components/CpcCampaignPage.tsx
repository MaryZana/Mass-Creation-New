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
  Settings,
  Sparkles,
  Plus,
} from './Icons';
import {
  PRODUCT_TABLE_THUMB_FALLBACK,
  resolveProductTableThumbSrc,
  PREBUILT_LIST_SINGLE_PRODUCT_CPC_CAMPAIGN_ID,
} from './SuccessPageTestData';
import {
  CpcSingleProductHeroCard,
  CpcSingleProductBudgetCard,
  CpcSingleProductStrategyCard,
  CpcSingleProductClustersCard,
  AutomationColumn,
} from './CpcSingleProductLayout';
import { AppHeader } from './AppHeader';
import { DailyLimitInfoTooltip } from './DailyLimitInfoTooltip';
import { DailyLimitBidMismatchHint } from './DailyLimitBidMismatchHint';
import { ProductBidField, PRODUCT_BID_INPUT_WIDTH_CLASS } from './ProductBidField';
import { SearchBidPositionHint } from './SearchBidPositionHint';
import { BidHistogramButton, SearchBidPositionPicker } from './SearchBidPositionPicker';
import {
  BID_CHASING_POSITION_OPTIONS,
  BID_CHASING_TARGET_AVG_POSITION,
  bidChasingPositionOption,
  isBidChasingHoldOfferedForChartRange,
  type BidChasingRange,
} from '../utils/cpcBidChasingPositionTiers';
import { useProfile, type RepeatLaunchPreset } from './ProfileContext';
import {
  DAILY_LIMIT_ABSOLUTE_MIN,
  minDailyLimitForMaxBid,
  isDailyLimitBelowRecommendedForMaxBid,
  shouldPromptRaiseDailyLimitForMaxBid,
  CPC_MAX_BID_RUB,
  estimateDailyLimitSpendPreview,
} from '../utils/cpcDailyLimitBid';
import { normalizeCpmBidRub } from '../utils/cpmBidRounding';
import { useCpmBidRoundedAlert } from './CpmBidRoundedAlert';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
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

function formatRecommendedBidRub(value: number): string {
  return value.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatApproxDailyBudgetRub(bidRub: number, clicksPerDay: number): string {
  const total = bidRub * clicksPerDay;
  return total.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
}

function formatApproxClicksPerDay(clicks: number): string {
  return clicks.toLocaleString('ru-RU');
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

type ProductBidEntry = { draft: string; saved: string };

interface CpcCampaignPageProps {
  campaignId: number;
  name: string;
  paymentModel?: 'CPC' | 'CPM';
  remainingBudget: number | null;
  dailyLimit: number | null;
  scheduledDailyLimit: number | null;
  /** true = дневной лимит израсходован, показы остановлены до завтра */
  dailyLimitExhausted?: boolean;
  fromReadyToRepeat?: boolean;
  repeatLaunchPreset?: RepeatLaunchPreset;
  campaignStatus?: 'active' | 'paused';
  onBack: () => void;
  onUpdateData?: (data: {
    name?: string;
    remainingBudget?: number | null;
    dailyLimit?: number | null;
    scheduledDailyLimit?: number | null;
    maxCpcBidRub?: number;
    status?: 'active' | 'paused';
    statusText?: string;
  }) => void;
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

type StatMetricTone = 'default' | 'highlight' | 'muted' | 'faded';

function StatTrendBadge({
  value,
  direction,
  positiveIsGood = true,
  tone = 'default',
}: {
  value: string;
  direction: StatTrendDirection;
  positiveIsGood?: boolean;
  tone?: StatMetricTone;
}) {
  const favorable = direction === 'up' ? positiveIsGood : !positiveIsGood;
  const isNeutral = value === '0%' || value === '0';
  if (tone === 'muted') {
    return <span className="text-xs font-medium tabular-nums text-gray-400">{value}</span>;
  }
  if (tone === 'faded') {
    return <span className="text-xs font-medium tabular-nums text-gray-500">{value}</span>;
  }
  if (isNeutral) {
    return <span className="text-xs font-medium tabular-nums text-gray-400">{value}</span>;
  }
  if (tone === 'highlight') {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium tabular-nums text-[#9A41FE]">
        <span aria-hidden>{direction === 'up' ? '▲' : '▼'}</span>
        {value}
      </span>
    );
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
  tone = 'default',
}: {
  value: string;
  trend: { value: string; direction: StatTrendDirection; positiveIsGood?: boolean };
  compact?: boolean;
  tone?: StatMetricTone;
}) {
  const valueClass =
    tone === 'highlight'
      ? 'text-[#9A41FE]'
      : tone === 'faded'
        ? 'text-gray-500'
        : tone === 'muted'
          ? 'text-gray-400'
          : 'text-gray-900';

  return (
    <div className={`flex flex-wrap items-baseline gap-1.5 ${compact ? 'mb-1' : 'mb-4'}`}>
      <p className={`font-bold tabular-nums tracking-tight ${compact ? 'text-xl' : 'text-2xl'} ${valueClass}`}>
        {value}
      </p>
      <StatTrendBadge {...trend} tone={tone} />
    </div>
  );
}

function StatSecondaryMetric({
  label,
  value,
  trend,
  valueMuted,
  tone = 'default',
}: {
  label: string;
  value: string;
  trend?: { value: string; direction: StatTrendDirection; positiveIsGood?: boolean };
  valueMuted?: boolean;
  tone?: StatMetricTone;
}) {
  const labelClass =
    tone === 'highlight'
      ? 'text-[#9A41FE]/80'
      : tone === 'faded'
        ? 'text-gray-500'
        : tone === 'muted' || valueMuted
          ? 'text-gray-500'
          : 'text-gray-600';
  const valueClass =
    tone === 'highlight'
      ? 'text-[#9A41FE]'
      : tone === 'faded'
        ? 'text-gray-600'
        : tone === 'muted' || valueMuted
          ? 'text-gray-400'
          : 'text-gray-900';

  return (
    <div className="min-w-0">
      <p className={`text-xs leading-tight ${labelClass}`}>{label}</p>
      <p
        className={`mt-0 flex flex-wrap items-baseline gap-1 text-sm font-semibold leading-tight tabular-nums ${valueClass}`}
      >
        <span>{value}</span>
        {trend ? <StatTrendBadge {...trend} tone={tone} /> : null}
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

type StatCardHighlightState = 'none' | 'active' | 'inactive';

function statCardHighlightForMetric(
  cardId: CpcChartCardMetricId,
  isChartVisible: boolean,
  chartMetric: CpcChartMetricId,
): StatCardHighlightState {
  if (!isChartVisible) return 'none';
  return chartFocusForMetric(chartMetric).card === cardId ? 'active' : 'none';
}

function isPrimaryMetricOnChart(
  cardId: CpcChartCardMetricId,
  chartMetric: CpcChartMetricId,
  isChartVisible: boolean,
): boolean {
  if (!isChartVisible) return false;
  return chartMetric === cardId;
}

function isSubMetricOnChart(
  cardId: CpcChartCardMetricId,
  subMetricId: CpcChartSubMetricId,
  chartMetric: CpcChartMetricId,
  isChartVisible: boolean,
): boolean {
  if (!isChartVisible) return false;
  if (chartMetric === cardId) return false;
  const focus = chartFocusForMetric(chartMetric);
  return focus.card === cardId && focus.sub === subMetricId;
}

function primaryMetricToneForCard(
  cardId: CpcChartCardMetricId,
  highlight: StatCardHighlightState,
  chartMetric: CpcChartMetricId,
): StatMetricTone {
  if (highlight === 'inactive') return 'default';
  if (highlight === 'none') return 'default';
  const focus = chartFocusForMetric(chartMetric);
  if (focus.card !== cardId) return 'default';
  if (chartMetric === cardId) return 'highlight';
  return 'default';
}

function secondaryMetricToneForCard(
  cardId: CpcChartCardMetricId,
  subMetricId: CpcChartSubMetricId,
  highlight: StatCardHighlightState,
  chartMetric: CpcChartMetricId,
): StatMetricTone {
  if (highlight === 'inactive') return 'default';
  if (highlight === 'none') return 'default';
  const focus = chartFocusForMetric(chartMetric);
  if (focus.card !== cardId) return 'default';
  if (focus.sub === subMetricId && chartMetric !== cardId) return 'highlight';
  return 'default';
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

function chartRangeLabelForPosition(position: number): string {
  const p = Math.max(1, Math.round(position));
  if (p <= 2) return '1–2 позиции';
  if (p <= 10) return '3–10';
  if (p <= 34) return '11–34';
  if (p <= 50) return '35–50';
  if (p <= 100) return '51–100';
  if (p <= 300) return '101–300';
  return '301+';
}

function CpcPositionChartXAxisTick({
  x,
  y,
  payload,
  currentRangeLabel,
  currentPosition,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
  currentRangeLabel: string | null;
  currentPosition: number | null;
}) {
  if (x == null || y == null || !payload) return null;
  const isCurrent = currentRangeLabel != null && payload.value === currentRangeLabel;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={12}
        textAnchor="middle"
        fill={isCurrent ? '#9A41FE' : '#767386'}
        fontSize={11}
        fontWeight={isCurrent ? 600 : 400}
      >
        {payload.value}
      </text>
      {isCurrent && currentPosition != null ? (
        <text x={0} y={0} dy={26} textAnchor="middle" fill="#9A41FE" fontSize={9} fontWeight={600}>
          ▲ ~{currentPosition}
        </text>
      ) : null}
    </g>
  );
}

function isDynamicsChartTabAvailable(_metricId: CpcChartMetricId): boolean {
  return true;
}

type CpcChartValueKind = 'count' | 'percent' | 'position' | 'currency';

function chartValueKindForMetric(metricId: CpcChartMetricId): CpcChartValueKind {
  if (metricId === 'searchPosition') return 'position';
  if (metricId === 'impressions' || metricId === 'clicks' || metricId === 'orders') {
    return 'count';
  }
  if (metricId === 'orderSum' || metricId === 'spend' || metricId === 'cpc' || metricId === 'cpo') {
    return 'currency';
  }
  if (metricId === 'ctr' || metricId === 'cr' || metricId === 'costShare' || metricId === 'cpm') {
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
  { date: '27.06', primary: 0.0096, previous: 0.0099 },
  { date: '28.06', primary: 0.0097, previous: 0.0098 },
  { date: '29.06', primary: 0.0098, previous: 0.0097 },
  { date: '30.06', primary: 0.0099, previous: 0.0096 },
  { date: '01.07', primary: 0.0099, previous: 0.0098 },
  { date: '02.07', primary: 0.01, previous: 0.0097 },
  { date: '03.07', primary: 0.01, previous: 0.0098 },
];

const CPC_DYNAMICS_CPM_CHART_DATA_LOW: CpcDynamicsPoint[] = [
  { date: '27.06', primary: 0, previous: 0 },
  { date: '28.06', primary: 0, previous: 0 },
  { date: '29.06', primary: 0, previous: 0 },
  { date: '30.06', primary: 0, previous: 0 },
  { date: '01.07', primary: 0, previous: 0 },
  { date: '02.07', primary: 0, previous: 0 },
  { date: '03.07', primary: 0, previous: 0 },
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

const CPC_DYNAMICS_PERCENT_CHART_DATA_BY_METRIC: Partial<
  Record<CpcChartMetricId, { normal: CpcDynamicsPoint[]; low: CpcDynamicsPoint[] }>
> = {
  cpm: { normal: CPC_DYNAMICS_CPM_CHART_DATA, low: CPC_DYNAMICS_CPM_CHART_DATA_LOW },
};

const CPC_DYNAMICS_CURRENCY_CHART_DATA_BY_METRIC: Partial<
  Record<CpcChartMetricId, { normal: CpcDynamicsPoint[]; low: CpcDynamicsPoint[] }>
> = {
  orderSum: { normal: CPC_DYNAMICS_ORDER_SUM_CHART_DATA, low: CPC_DYNAMICS_ORDER_SUM_CHART_DATA_LOW },
  spend: { normal: CPC_DYNAMICS_SPEND_CHART_DATA, low: CPC_DYNAMICS_SPEND_CHART_DATA_LOW },
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
  const percentSeries = CPC_DYNAMICS_PERCENT_CHART_DATA_BY_METRIC[metricId];
  if (kind === 'percent' && percentSeries) {
    return isLowActivityDemo ? percentSeries.low : percentSeries.normal;
  }
  return isLowActivityDemo ? CPC_DYNAMICS_PERCENT_CHART_DATA_LOW : CPC_DYNAMICS_PERCENT_CHART_DATA;
}

const CHART_AXIS_TITLE_CLASS =
  'pointer-events-none absolute top-0 z-10 text-sm font-semibold leading-none text-gray-900';

const CHART_AXIS_TITLE_BAND_CLASS = 'relative mt-4 pt-6';

const CHART_RECHARTS_MARGIN = { top: 40, right: 8, left: 4, bottom: 4 };

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
      className="absolute right-2 top-2 z-20 overflow-visible"
      onMouseEnter={() => setIsTooltipVisible(true)}
      onMouseLeave={() => setIsTooltipVisible(false)}
    >
      {isTooltipVisible ? (
        <div
          role="tooltip"
          className="pointer-events-none absolute bottom-full right-0 z-[100] mb-1.5 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg"
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
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#9A41FE]/35 bg-[#F6F2FF] text-[#9A41FE] opacity-0 shadow-sm transition-[opacity,colors] hover:border-[#9A41FE] hover:bg-[#9A41FE] hover:text-white group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A41FE]/40"
        aria-label={`Показать на графике: ${label}`}
      >
        <StatsChartPositionIcon className="h-4 w-4 shrink-0" />
      </button>
    </div>
  );
}

function StatMetricCard({
  title,
  highlightState,
  primaryCellSelected,
  onOpenChart,
  primaryMetric,
  footer,
}: {
  title: string;
  highlightState: StatCardHighlightState;
  primaryCellSelected: boolean;
  onOpenChart: () => void;
  primaryMetric: React.ReactNode;
  footer: React.ReactNode;
}) {
  const titleClass =
    primaryCellSelected ? 'text-[#9A41FE]' : 'text-gray-900';

  return (
    <div
      className={`relative overflow-visible rounded-xl border border-gray-200 bg-white transition-[opacity,colors] hover:z-30`}
    >
      <div className={primaryCellSelected ? 'bg-[#F2F2F7]' : ''}>
        <div className="group relative overflow-visible px-3 pb-2 pt-3 pr-9">
          <StatOpenChartButton onClick={onOpenChart} label={title} />
          <p className={`text-xs font-medium leading-tight ${titleClass}`}>{title}</p>
          {primaryMetric}
        </div>
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
  tone = 'default',
  cellSelected = false,
}: {
  label: string;
  onOpenChart: () => void;
  value: string;
  trend?: { value: string; direction: StatTrendDirection; positiveIsGood?: boolean };
  valueMuted?: boolean;
  tone?: StatMetricTone;
  cellSelected?: boolean;
}) {
  return (
    <div className={cellSelected ? 'bg-[#F2F2F7]' : ''}>
      <div className="group relative min-w-0 overflow-visible px-3 pb-2 pt-2 pr-8">
        <StatOpenChartButton onClick={onOpenChart} label={label} />
        <StatSecondaryMetric
          label={label}
          value={value}
          trend={trend}
          valueMuted={valueMuted}
          tone={tone}
        />
      </div>
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

  const renderTriggerContent = (optionLabel: string, optionTag?: string) => (
    <>
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <span>{optionLabel}</span>
        {optionTag ? (
          <span className="shrink-0 rounded-md bg-[#F6F2FF] px-1.5 py-0.5 text-xs font-semibold text-[#9A41FE]">
            {optionTag}
          </span>
        ) : null}
      </span>
      <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
    </>
  );

  return (
    <div ref={ref} className="relative inline-grid w-max max-w-[min(20rem,calc(100vw-2rem))]">
      <div
        aria-hidden
        className="pointer-events-none col-start-1 row-start-1 h-0 min-h-0 overflow-hidden opacity-0"
      >
        <div className="flex w-max flex-col items-start">
          {options.map((option) => (
            <span
              key={option.id}
              className={`inline-flex items-center gap-1 whitespace-nowrap rounded-lg border px-3 py-1.5 text-sm ${buttonClass}`}
            >
              {renderTriggerContent(option.label, option.optionTag)}
            </span>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onOpenChange(!isOpen)}
        className={`col-start-1 row-start-1 inline-flex w-full min-w-0 items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition-colors ${buttonClass}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="inline-flex min-w-0 flex-1 items-center gap-1.5 whitespace-nowrap">
          <span>{label}</span>
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
          className="absolute left-0 top-full z-50 mt-1 min-w-full max-w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
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

function CpcPositionChartTooltip({
  active,
  payload,
  label,
  leftMetricLabel,
  leftValueKind,
  onHoldPosition,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ name?: string; value?: number; color?: string }>;
  label?: string;
  leftMetricLabel: string;
  leftValueKind: CpcChartValueKind;
  onHoldPosition: () => void;
}) {
  if (!active || !payload?.length) return null;

  const rows = payload
    .filter((item) => item.value != null && Number.isFinite(item.value))
    .map((item) => {
      const name = item.name ?? '';
      const value = item.value as number;
      if (name === 'ctr') {
        return { key: name, label: 'CTR', value: `${(value * 100).toFixed(2)}%` };
      }
      if (name === 'withoutPromo') {
        return {
          key: name,
          label: 'Без продвижения',
          value: formatChartTooltipValue(leftValueKind, value),
        };
      }
      if (name === 'withPromo') {
        return {
          key: name,
          label: leftMetricLabel,
          value: formatChartTooltipValue(leftValueKind, value),
        };
      }
      return {
        key: name,
        label: leftMetricLabel,
        value: formatChartTooltipValue(leftValueKind, value),
      };
    });

  return (
    <div className="pointer-events-auto max-w-[240px] rounded-xl border border-gray-200 bg-white p-3 text-xs shadow-lg">
      {label ? <p className="mb-2 font-semibold text-gray-900">{label}</p> : null}
      <ul className="space-y-1 text-gray-700">
        {rows.map((row) => (
          <li key={row.key} className="flex justify-between gap-3">
            <span className="text-gray-500">{row.label}</span>
            <span className="font-medium tabular-nums text-gray-900">{row.value}</span>
          </li>
        ))}
      </ul>
      {label && isBidChasingHoldOfferedForChartRange(label) ? (
        <button
          type="button"
          className="mt-3 w-full rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-purple-700"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onHoldPosition();
          }}
        >
          Удерживать позицию
        </button>
      ) : null}
    </div>
  );
}

function CpcPositionComboChart({
  thirdMetric,
  isLowActivityDemo,
  onHoldPositionClick,
  currentSearchPosition,
}: {
  thirdMetric: CpcChartThirdMetricId;
  isLowActivityDemo: boolean;
  onHoldPositionClick: () => void;
  currentSearchPosition: number | null;
}) {
  const leftMetric = CPC_POSITION_LEFT_METRIC[thirdMetric];
  const data = isLowActivityDemo ? CPC_POSITION_CHART_DATA_LOW : CPC_POSITION_CHART_DATA;
  const withoutPromoKey = `${leftMetric.dataKey}WithoutPromo`;
  const currentRangeLabel =
    currentSearchPosition != null && currentSearchPosition > 0
      ? chartRangeLabelForPosition(currentSearchPosition)
      : null;
  const chartData = useMemo(() => {
    const organicFactor = 0.55;
    return data.map((row) => {
      const withPromo = row[leftMetric.dataKey] as number;
      const withoutPromo =
        leftMetric.kind === 'share'
          ? Math.round(withPromo * organicFactor * 1000) / 1000
          : Math.round(withPromo * organicFactor);
      return { ...row, [withoutPromoKey]: withoutPromo };
    });
  }, [data, leftMetric.dataKey, leftMetric.kind, withoutPromoKey]);
  const leftDomain = leftMetric.kind === 'share' ? ([0, 0.5] as const) : ([0, 'auto'] as const);
  const leftTicks =
    leftMetric.kind === 'share' ? [0, 0.1, 0.2, 0.3, 0.4, 0.5] : undefined;

  const leftValueKind: CpcChartValueKind = leftMetric.kind === 'share' ? 'percent' : 'count';

  const formatLeftTick = (value: number) => formatChartAxisTick(leftValueKind, value);

  return (
    <div className="h-[300px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={CHART_RECHARTS_MARGIN} barGap={3}>
          <defs>
            <linearGradient id="cpcPositionWithoutPromoGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9A41FE" stopOpacity={0.38} />
              <stop offset="100%" stopColor="#9A41FE" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#ECECF0" vertical />
          <XAxis
            dataKey="range"
            axisLine={false}
            tickLine={false}
            interval={0}
            height={currentRangeLabel ? 56 : 48}
            tick={(props) => (
              <CpcPositionChartXAxisTick
                {...props}
                currentRangeLabel={currentRangeLabel}
                currentPosition={currentSearchPosition}
              />
            )}
          />
          {currentRangeLabel ? (
            <ReferenceLine
              x={currentRangeLabel}
              yAxisId="left"
              stroke="#9A41FE"
              strokeWidth={2}
              strokeDasharray="4 4"
              ifOverflow="extendDomain"
            />
          ) : null}
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
            cursor={{ fill: 'rgba(154, 65, 254, 0.06)' }}
            wrapperStyle={{ pointerEvents: 'auto', zIndex: 20 }}
            content={
              <CpcPositionChartTooltip
                leftMetricLabel={leftMetric.label}
                leftValueKind={leftValueKind}
                onHoldPosition={onHoldPositionClick}
              />
            }
          />
          <Bar
            yAxisId="left"
            dataKey={withoutPromoKey}
            fill="url(#cpcPositionWithoutPromoGradient)"
            radius={[3, 3, 0, 0]}
            barSize={22}
            name="withoutPromo"
          >
            {chartData.map((entry) => (
              <Cell
                key={`wo-${entry.range}`}
                stroke={entry.range === currentRangeLabel ? '#9A41FE' : 'transparent'}
                strokeWidth={entry.range === currentRangeLabel ? 2 : 0}
              />
            ))}
          </Bar>
          <Bar
            yAxisId="left"
            dataKey={leftMetric.dataKey}
            fill="#9A41FE"
            radius={[3, 3, 0, 0]}
            barSize={22}
            name="withPromo"
          >
            {chartData.map((entry) => (
              <Cell
                key={`wp-${entry.range}`}
                fill={entry.range === currentRangeLabel ? '#7C2DEE' : '#9A41FE'}
                stroke={entry.range === currentRangeLabel ? '#4C1D95' : 'transparent'}
                strokeWidth={entry.range === currentRangeLabel ? 2 : 0}
              />
            ))}
          </Bar>
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
    <div className="h-[300px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={CHART_RECHARTS_MARGIN}>
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
  onHoldPositionClick,
  currentSearchPosition,
}: {
  isLowActivityDemo: boolean;
  onIncreaseBidClick: () => void;
  onHoldPositionClick: () => void;
  currentSearchPosition: number | null;
}) {
  const [isPositionInsightModalOpen, setIsPositionInsightModalOpen] = useState(false);
  const statsChartRef = useRef<HTMLDivElement>(null);
  const [isChartVisible, setIsChartVisible] = useState(true);
  const [chartTab, setChartTab] = useState<CpcStatsChartTab>('position');
  const [chartMetric, setChartMetric] = useState<CpcChartMetricId>('searchPosition');
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

  const handleChartVisibilityChange = (visible: boolean) => {
    setIsChartVisible(visible);
    if (visible) {
      handleChartMetricChange('searchPosition');
      window.setTimeout(() => {
        statsChartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
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

  const impressionsCardHighlight = statCardHighlightForMetric(
    'impressions',
    isChartVisible,
    chartMetric,
  );
  const clicksCardHighlight = statCardHighlightForMetric('clicks', isChartVisible, chartMetric);
  const ordersCardHighlight = statCardHighlightForMetric('orders', isChartVisible, chartMetric);
  const costShareCardHighlight = statCardHighlightForMetric(
    'costShare',
    isChartVisible,
    chartMetric,
  );

  return (
    <section className="mb-8 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900">Статистика</h2>
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

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <StatMetricCard
          title="Показы"
          highlightState={impressionsCardHighlight}
          primaryCellSelected={isPrimaryMetricOnChart(
            'impressions',
            chartMetric,
            isChartVisible,
          )}
          onOpenChart={() => focusChart('impressions')}
          primaryMetric={
            <StatPrimaryMetric
              value={impressionsMain}
              trend={impressionsTrend}
              compact
              tone={primaryMetricToneForCard('impressions', impressionsCardHighlight, chartMetric)}
            />
          }
          footer={
            <div className="grid grid-cols-2 border-t border-gray-100">
              <StatSecondaryMetricWithChart
                label="CPM"
                value={cpmValue}
                trend={cpmTrend}
                tone={secondaryMetricToneForCard(
                  'impressions',
                  'cpm',
                  impressionsCardHighlight,
                  chartMetric,
                )}
                onOpenChart={() => focusChart('cpm')}
                cellSelected={isSubMetricOnChart(
                  'impressions',
                  'cpm',
                  chartMetric,
                  isChartVisible,
                )}
              />
              <StatSecondaryMetricWithChart
                label="Позиция в поиске"
                value={searchPosition}
                tone={secondaryMetricToneForCard(
                  'impressions',
                  'searchPosition',
                  impressionsCardHighlight,
                  chartMetric,
                )}
                onOpenChart={() => focusChart('searchPosition')}
                cellSelected={isSubMetricOnChart(
                  'impressions',
                  'searchPosition',
                  chartMetric,
                  isChartVisible,
                )}
              />
            </div>
          }
        />

        <StatMetricCard
          title="Клики"
          highlightState={clicksCardHighlight}
          primaryCellSelected={isPrimaryMetricOnChart('clicks', chartMetric, isChartVisible)}
          onOpenChart={() => focusChart('clicks')}
          primaryMetric={
            <StatPrimaryMetric
              value={clicksMain}
              trend={clicksTrend}
              compact
              tone={primaryMetricToneForCard('clicks', clicksCardHighlight, chartMetric)}
            />
          }
          footer={
            <div className="grid grid-cols-2 border-t border-gray-100">
              <StatSecondaryMetricWithChart
                label="CTR"
                value={isLowActivityDemo ? '0%' : '0,28%'}
                trend={
                  isLowActivityDemo
                    ? { value: '0%', direction: 'up' }
                    : { value: '0,03%', direction: 'down', positiveIsGood: false }
                }
                tone={secondaryMetricToneForCard('clicks', 'ctr', clicksCardHighlight, chartMetric)}
                onOpenChart={() => focusChart('ctr')}
                cellSelected={isSubMetricOnChart('clicks', 'ctr', chartMetric, isChartVisible)}
              />
              <StatSecondaryMetricWithChart
                label="CPC"
                value={isLowActivityDemo ? '0 ₽' : '61 ₽'}
                trend={
                  isLowActivityDemo
                    ? { value: '0%', direction: 'up' }
                    : { value: '6,1%', direction: 'up' }
                }
                tone={secondaryMetricToneForCard('clicks', 'cpc', clicksCardHighlight, chartMetric)}
                onOpenChart={() => focusChart('cpc')}
                cellSelected={isSubMetricOnChart('clicks', 'cpc', chartMetric, isChartVisible)}
              />
            </div>
          }
        />

        <StatMetricCard
          title="Заказы"
          highlightState={ordersCardHighlight}
          primaryCellSelected={isPrimaryMetricOnChart('orders', chartMetric, isChartVisible)}
          onOpenChart={() => focusChart('orders')}
          primaryMetric={
            <StatPrimaryMetric
              value={ordersMain}
              trend={ordersTrend}
              compact
              tone={primaryMetricToneForCard('orders', ordersCardHighlight, chartMetric)}
            />
          }
          footer={
            <div className="grid grid-cols-2 border-t border-gray-100">
              <StatSecondaryMetricWithChart
                label="CR"
                value={isLowActivityDemo ? '0%' : '22,9%'}
                trend={
                  isLowActivityDemo
                    ? { value: '0%', direction: 'down', positiveIsGood: false }
                    : { value: '1,4%', direction: 'up' }
                }
                tone={secondaryMetricToneForCard('orders', 'cr', ordersCardHighlight, chartMetric)}
                onOpenChart={() => focusChart('cr')}
                cellSelected={isSubMetricOnChart('orders', 'cr', chartMetric, isChartVisible)}
              />
              <StatSecondaryMetricWithChart
                label="CPO"
                value={cpoValue}
                valueMuted={cpoMuted}
                tone={secondaryMetricToneForCard('orders', 'cpo', ordersCardHighlight, chartMetric)}
                onOpenChart={() => focusChart('cpo')}
                cellSelected={isSubMetricOnChart('orders', 'cpo', chartMetric, isChartVisible)}
              />
            </div>
          }
        />

        <StatMetricCard
          title="Доля затрат"
          highlightState={costShareCardHighlight}
          primaryCellSelected={isPrimaryMetricOnChart('costShare', chartMetric, isChartVisible)}
          onOpenChart={() => focusChart('costShare')}
          primaryMetric={
            <StatPrimaryMetric
              value={shareMain}
              trend={shareTrend}
              compact
              tone={primaryMetricToneForCard('costShare', costShareCardHighlight, chartMetric)}
            />
          }
          footer={
            <div className="grid grid-cols-2 border-t border-gray-100">
              <StatSecondaryMetricWithChart
                label="Сумма заказов"
                value={orderSum}
                tone={secondaryMetricToneForCard(
                  'costShare',
                  'orderSum',
                  costShareCardHighlight,
                  chartMetric,
                )}
                onOpenChart={() => focusChart('orderSum')}
                cellSelected={isSubMetricOnChart(
                  'costShare',
                  'orderSum',
                  chartMetric,
                  isChartVisible,
                )}
              />
              <StatSecondaryMetricWithChart
                label={spendLabel}
                value={spendValue}
                trend={
                  isLowActivityDemo
                    ? { value: '0%', direction: 'up' }
                    : { value: '5,3%', direction: 'up' }
                }
                tone={secondaryMetricToneForCard(
                  'costShare',
                  'spend',
                  costShareCardHighlight,
                  chartMetric,
                )}
                onOpenChart={() => focusChart('spend')}
                cellSelected={isSubMetricOnChart('costShare', 'spend', chartMetric, isChartVisible)}
              />
            </div>
          }
        />
      </div>

      <label className="mt-4 flex cursor-pointer select-none items-center gap-2.5 text-[15px] font-medium text-gray-700">
        <StatsChartToggleSwitch checked={isChartVisible} onChange={handleChartVisibilityChange} />
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
              <div className={CHART_AXIS_TITLE_BAND_CLASS}>
                <p className={`${CHART_AXIS_TITLE_CLASS} left-0`}>{positionLeftAxisLabel}</p>
                <p className={`${CHART_AXIS_TITLE_CLASS} right-0`}>CTR, %</p>
                <CpcPositionComboChart
                  thirdMetric={chartThirdMetric}
                  isLowActivityDemo={isLowActivityDemo}
                  onHoldPositionClick={onHoldPositionClick}
                  currentSearchPosition={currentSearchPosition}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-600">
                {currentSearchPosition != null && currentSearchPosition > 0 ? (
                  <span className="inline-flex items-center gap-2 rounded-md bg-[#F6F2FF] px-2 py-1 font-medium text-[#7C2DEE]">
                    <span className="h-2 w-2 rounded-sm bg-[#7C2DEE]" aria-hidden />
                    Ваша позиция ~ {currentSearchPosition} (
                    {chartRangeLabelForPosition(currentSearchPosition)})
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-sm bg-[#9A41FE]" aria-hidden />
                  {positionLeftAxisLabel}
                </span>
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-sm bg-gradient-to-t from-[#9A41FE]/15 to-[#9A41FE]/40"
                    aria-hidden
                  />
                  Без продвижения
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-0.5 w-4 rounded bg-[#22C55E]" aria-hidden />
                  CTR
                </span>
              </div>
              <div className="mt-4 rounded-xl bg-[#F6F2FF] px-4 py-3 text-sm leading-snug text-gray-800">
                Ваша карточка чаще всего показывалась в поиске на позициях с 11 по 34.{' '}
                <button
                  type="button"
                  onClick={() => setIsPositionInsightModalOpen(true)}
                  className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Что можно сделать
                </button>
              </div>
              {isPositionInsightModalOpen ? (
                <div
                  className="fixed inset-0 z-[105] flex items-center justify-center bg-black/50 p-4"
                  onClick={() => setIsPositionInsightModalOpen(false)}
                  role="presentation"
                >
                  <div
                    className="relative w-full max-w-[440px] rounded-2xl bg-white p-6 shadow-xl"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="position-insight-modal-title"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => setIsPositionInsightModalOpen(false)}
                      className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                      aria-label="Закрыть"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    <h2
                      id="position-insight-modal-title"
                      className="pr-8 text-base font-semibold text-gray-900"
                    >
                      Позиции в поиске
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-gray-600">
                      Ваша карточка чаще всего показывалась в поиске на позициях с 11 по 34. Чтобы
                      поднять её выше, увеличьте ставку или включите удержание позиции — автобиддер
                      сам подстроит CPC.
                    </p>
                    <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setIsPositionInsightModalOpen(false);
                          onIncreaseBidClick();
                        }}
                        className="rounded-xl bg-[#F2F2F7] px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-[#e8e8ed]"
                      >
                        Увеличить ставку
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPositionInsightModalOpen(false);
                          onHoldPositionClick();
                        }}
                        className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-purple-700"
                      >
                        Держать позицию
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <div className={CHART_AXIS_TITLE_BAND_CLASS}>
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

type DailyLimitSpendSummary = { total: number; spent: number; progress: number };

function DailyLimitSpendSummaryBlock({
  summary,
  layout = 'sidebar',
  compact = false,
}: {
  summary: DailyLimitSpendSummary;
  layout?: 'sidebar' | 'stacked' | 'card';
  compact?: boolean;
}) {
  const progressBarWidthClass =
    layout === 'sidebar' ? 'w-full max-w-[60px]' : layout === 'card' ? 'w-1/3' : 'w-full max-w-[120px]';
  const labelClass = compact ? 'text-[11px] text-gray-500' : 'text-xs text-gray-500';
  const amountClassName = compact
    ? 'mt-0.5 text-xs leading-snug tabular-nums text-gray-900'
    : layout === 'sidebar'
      ? 'mt-1 whitespace-nowrap text-sm leading-none tabular-nums text-gray-900'
      : 'mt-1 text-sm leading-snug tabular-nums text-gray-900';
  const progressHeight = compact ? 'h-1' : 'h-1.5';
  const content = (
    <>
      <span className={labelClass}>Истратили</span>
      <p className={amountClassName}>
        <span className="font-semibold">{formatForDisplay(summary.spent)} ₽</span>
        <span className="font-normal text-gray-500"> из {formatForDisplay(summary.total)} ₽</span>
      </p>
      <div
        className={`mt-1 ${progressHeight} overflow-hidden rounded-full bg-gray-200 ${progressBarWidthClass}`}
      >
        <div
          className="h-full rounded-full bg-gray-700 transition-[width] duration-300"
          style={{ width: `${summary.progress}%` }}
        />
      </div>
    </>
  );

  if (layout === 'sidebar') {
    return (
      <div className="flex w-[min(148px,30%)] shrink-0 flex-col justify-center gap-1 border-l border-gray-200 pl-3">
        {content}
      </div>
    );
  }

  if (layout === 'card') {
    return <div className="flex min-w-0 flex-col justify-center gap-1">{content}</div>;
  }

  return (
    <div className="flex w-fit max-w-[148px] min-w-0 flex-col justify-center gap-1">{content}</div>
  );
}

function AutomationDailyLimitTile({ summary }: { summary: DailyLimitSpendSummary }) {
  return (
    <div className="min-w-0 rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Дневной лимит</p>
        <span className="shrink-0 rounded bg-gray-900 px-1.5 py-0.5 text-[9px] font-semibold leading-none text-white">
          Вкл
        </span>
      </div>
      <DailyLimitSpendSummaryBlock summary={summary} layout="card" compact />
    </div>
  );
}

function AutomationStrategiesTile({ messages }: { messages: string[] }) {
  return (
    <div className="min-w-0 rounded-lg border border-emerald-200/90 bg-gradient-to-br from-emerald-50/80 to-white p-2.5 shadow-sm">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800/80">
          Держать позицию в поиске
        </p>
        <span className="shrink-0 rounded bg-emerald-600 px-1.5 py-0.5 text-[9px] font-semibold leading-none text-white">
          Вкл
        </span>
      </div>
      <div className="space-y-1">
        {messages.map((message) => (
          <p key={message} className="text-xs leading-snug text-emerald-950">
            {message}
          </p>
        ))}
      </div>
    </div>
  );
}

function AutomationSpendInactiveRow({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-500"
        aria-hidden
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="mb-0 text-sm font-semibold text-gray-900">{title}</p>
        <p className="mt-0.5 text-sm text-gray-400">{subtitle}</p>
      </div>
    </div>
  );
}

export const CpcCampaignPage: React.FC<CpcCampaignPageProps> = ({
  campaignId,
  name,
  paymentModel = 'CPC',
  remainingBudget,
  dailyLimit,
  scheduledDailyLimit,
  dailyLimitExhausted,
  fromReadyToRepeat,
  repeatLaunchPreset,
  campaignStatus = 'active',
  onBack,
  onUpdateData,
}) => {
  const isCpmCampaign = paymentModel === 'CPM';
  const { showCpmBidRoundedAlert, cpmBidRoundedAlertNode } = useCpmBidRoundedAlert();
  const isSingleProductHeroCampaign = campaignId === PREBUILT_LIST_SINGLE_PRODUCT_CPC_CAMPAIGN_ID;
  const showSingleProductLayout = isSingleProductHeroCampaign || isCpmCampaign;
  const { profileId } = useProfile();
  const [isAutoRefillModalOpen, setIsAutoRefillModalOpen] = useState(false);
  const [isDailyLimitEnabled, setIsDailyLimitEnabled] = useState(dailyLimit !== null && dailyLimit !== undefined);
  const [dailyLimitValue, setDailyLimitValue] = useState(dailyLimit ? String(dailyLimit) : '');
  const [isBudgetRefillModalOpen, setIsBudgetRefillModalOpen] = useState(false);
  const [dailyLimitBudgetShortfall, setDailyLimitBudgetShortfall] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastIsError, setToastIsError] = useState(false);
  const [isAutoRefillEnabled, setIsAutoRefillEnabled] = useState(false);
  const [autoRefillMode, setAutoRefillMode] = useState<AutoRefillMode>('manual');
  const [wasAutoRefillToggledOn, setWasAutoRefillToggledOn] = useState(false);
  const [campaignBudget, setCampaignBudget] = useState(remainingBudget ?? 1000);
  const [campaignName, setCampaignName] = useState(name);
  const [isCampaignActive, setIsCampaignActive] = useState(campaignStatus === 'active');
  const [isFinishCampaignModalOpen, setIsFinishCampaignModalOpen] = useState(false);
  const [isDailyLimitTooltipVisible, setIsDailyLimitTooltipVisible] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [pendingDailyLimit, setPendingDailyLimit] = useState<string | null>(null);
  const [savedDailyLimit, setSavedDailyLimit] = useState(dailyLimit ? String(dailyLimit) : '');
  const [isCarryoverEnabled, setIsCarryoverEnabled] = useState(false);
  const [isCarryoverTooltipVisible, setIsCarryoverTooltipVisible] = useState(false);
  const productsSectionRef = useRef<HTMLElement>(null);
  const [campaignProductNmIds, setCampaignProductNmIds] = useState([DEMO_CPC_PRODUCT_NM]);
  const canRemoveProductFromCampaign = campaignProductNmIds.length > 1;
  const productKey = String(DEMO_CPC_PRODUCT_NM);
  const [productSearchBids, setProductSearchBids] = useState<Record<string, ProductBidEntry>>({
    [productKey]: { draft: '17.9', saved: '17.9' },
  });
  const [productRecommendationsBids, setProductRecommendationsBids] = useState<Record<string, ProductBidEntry>>({
    [productKey]: { draft: '7.9', saved: '7.9' },
  });
  const [isProductActionsMenuOpen, setIsProductActionsMenuOpen] = useState(false);
  const productActionsMenuRef = useRef<HTMLDivElement>(null);
  const [isSearchBidPickerOpen, setIsSearchBidPickerOpen] = useState(false);
  const searchBidPickerRef = useRef<HTMLDivElement>(null);
  const searchBidPickerPopoverRef = useRef<HTMLDivElement>(null);
  const [isBidChasingEnabled, setIsBidChasingEnabled] = useState(false);
  const [autoStrategiesModal, setAutoStrategiesModal] = useState<{
    tab: 'positions' | 'profit';
  } | null>(null);
  const openAutoStrategies = (tab: 'positions' | 'profit' = 'profit') => setAutoStrategiesModal({ tab });
  const closeAutoStrategies = () => setAutoStrategiesModal(null);
  const [isAdvancedDailyLimitModalOpen, setIsAdvancedDailyLimitModalOpen] = useState(false);
  const [isAutomationDailyLimitModalOpen, setIsAutomationDailyLimitModalOpen] = useState(false);
  const [isBidChasingSetupModalOpen, setIsBidChasingSetupModalOpen] = useState(false);
  const [advancedDailyLimitSettings, setAdvancedDailyLimitSettings] = useState(() => ({
    strategyId: null as 'spendOptimization' | 'clicksOptimization' | null,
    strategyGroupLabel: '',
    autoIncreaseEnabled: false,
    metric: 'drr' as 'drr' | 'cr',
    thresholdPercent: 15,
    drrThresholdPercent: 15,
    crThresholdPercent: 2.8,
    drrMetricEnabled: false,
    crMetricEnabled: false,
    increaseAmountRub: 500,
    limitIncreasePercent: 25 as 25 | 50 | 100,
    increaseRules: [] as DailyLimitIncreaseRule[],
  }));
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
  const [dailyLimitBidRaiseModal, setDailyLimitBidRaiseModal] = useState<
    | {
        kind: 'productBid';
        zone: 'search' | 'recommendations';
        attemptedBid: number;
        recommendedLimit: number;
      }
    | {
        kind: 'bidChasing';
        position: '1-2' | '3-10' | '11-34';
        maxBid: number;
        recommendedLimit: number;
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

  const dailyLimitTrafficReference = useMemo(() => {
    if (isBidChasingEnabled) {
      const tier = bidChasingPositionOption(bidChasingPosition);
      return {
        cpcBidRub: tier.demoBidRub,
        targetAvgPosition: BID_CHASING_TARGET_AVG_POSITION[bidChasingPosition],
      };
    }
    const searchBid = parseDisplayValue(productSearchBids[productKey]?.saved ?? '0');
    const cpcBidRub = searchBid > 0 ? searchBid : maxSavedProductBidRub;
    return { cpcBidRub, targetAvgPosition: undefined as number | undefined };
  }, [
    isBidChasingEnabled,
    bidChasingPosition,
    productSearchBids,
    productKey,
    maxSavedProductBidRub,
  ]);

  useEffect(() => {
    if (!isSingleProductHeroCampaign) return;
    const searchTier = bidChasingPositionOption('3-10');
    const searchBid = String(searchTier.demoBidRub);
    setProductSearchBids({ [productKey]: { draft: searchBid, saved: searchBid } });
    setProductRecommendationsBids({ [productKey]: { draft: '30', saved: '30' } });
    setBidChasingPosition('3-10');
    setIsDailyLimitEnabled(true);
    setDailyLimitValue('2000');
    setSavedDailyLimit('2000');
    setCampaignProductNmIds([DEMO_CPC_PRODUCT_NM]);
  }, [isSingleProductHeroCampaign, productKey]);

  useEffect(() => {
    if (!isCpmCampaign) return;
    setProductSearchBids({ [productKey]: { draft: '400', saved: '400' } });
    setProductRecommendationsBids({ [productKey]: { draft: '300', saved: '300' } });
    setBidChasingPosition('3-10');
    setIsDailyLimitEnabled(false);
    setDailyLimitValue('');
    setSavedDailyLimit('');
    setCampaignProductNmIds([DEMO_CPC_PRODUCT_NM]);
  }, [isCpmCampaign, productKey]);

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
    !isCpmCampaign &&
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
      let finalBid = parsed;
      let cpmDidRound = false;
      if (isCpmCampaign) {
        const min = 150;
        const { value: stepped, didRoundFromInput } = normalizeCpmBidRub(parsed, min);
        finalBid = stepped;
        cpmDidRound = didRoundFromInput;
        if (didRoundFromInput) {
          showCpmBidRoundedAlert(stepped);
        }
      } else if (parsed > CPC_MAX_BID_RUB) {
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
      const bidStr = String(finalBid);
      const setter = zone === 'search' ? setProductSearchBids : setProductRecommendationsBids;
      setter((prev) => ({
        ...prev,
        [productKey]: { draft: bidStr, saved: bidStr },
      }));
      if (!isCpmCampaign || !cpmDidRound) {
        setToastMessage('Ставка изменена');
        setToastIsError(false);
        setShowToast(true);
      }
    },
    [isCpmCampaign, productKey, productSearchBids, productRecommendationsBids, showCpmBidRoundedAlert],
  );

  const maxBidRubAfterProductBid = useCallback(
    (zone: 'search' | 'recommendations', parsed: number) => {
      const otherSaved =
        zone === 'search'
          ? parseDisplayValue(productRecommendationsBids[productKey]?.saved ?? '0')
          : parseDisplayValue(productSearchBids[productKey]?.saved ?? '0');
      const chasingCeiling = isBidChasingEnabled ? bidChasingMaxBid : 0;
      return Math.max(parsed, otherSaved, chasingCeiling);
    },
    [productKey, productSearchBids, productRecommendationsBids, isBidChasingEnabled, bidChasingMaxBid],
  );

  const applySavedDailyLimitRub = useCallback(
    (
      limit: number,
      budgetConflict?:
        | {
            kind: 'productBid';
            productKey: string;
            zone: 'search' | 'recommendations';
            attemptedBid: number;
          }
        | {
            kind: 'bidChasing';
            position: '1-2' | '3-10' | '11-34';
            maxBid: number;
          },
    ) => {
      if (limit > campaignBudget) {
        if (budgetConflict?.kind === 'productBid') {
          setBidLimitBudgetConflictModal({
            kind: 'productBid',
            productKey: budgetConflict.productKey,
            zone: budgetConflict.zone,
            attemptedBid: budgetConflict.attemptedBid,
            newDailyLimit: limit,
            shortfall: limit - campaignBudget,
          });
        } else if (budgetConflict?.kind === 'bidChasing') {
          setBidLimitBudgetConflictModal({
            kind: 'bidChasing',
            position: budgetConflict.position,
            maxBid: budgetConflict.maxBid,
            shortfall: limit - campaignBudget,
          });
        }
        return false;
      }
      setIsDailyLimitEnabled(true);
      setDailyLimitValue(String(limit));
      setSavedDailyLimit(String(limit));
      setDailyLimitBudgetShortfall(null);
      setToastMessage(
        `Новый дневной лимит установлен.\nРаспределяем ${formatForDisplay(limit)}₽ в течении суток равномерно`,
      );
      setToastIsError(false);
      setShowToast(true);
      if (onUpdateData) {
        onUpdateData({ dailyLimit: limit, scheduledDailyLimit: null });
      }
      return true;
    },
    [campaignBudget, onUpdateData],
  );

  const promptOrCommitProductBid = useCallback(
    (zone: 'search' | 'recommendations', parsed: number) => {
      if (isCpmCampaign) {
        commitProductBid(zone, parsed);
        return;
      }
      const maxBid = maxBidRubAfterProductBid(zone, parsed);
      if (
        shouldPromptRaiseDailyLimitForMaxBid(isDailyLimitEnabled, savedDailyLimitRub, maxBid)
      ) {
        setDailyLimitBidRaiseModal({
          kind: 'productBid',
          zone,
          attemptedBid: parsed,
          recommendedLimit: minDailyLimitForMaxBid(maxBid),
        });
        return;
      }
      commitProductBid(zone, parsed);
    },
    [
      commitProductBid,
      isCpmCampaign,
      isDailyLimitEnabled,
      maxBidRubAfterProductBid,
      savedDailyLimitRub,
    ],
  );

  const applyBidChasingConfig = useCallback(
    (position: '1-2' | '3-10' | '11-34', maxBid: number) => {
      setBidChasingPosition(position);
      setBidChasingMaxBid(maxBid);
      setIsBidChasingEnabled(true);
      closeAutoStrategies();
      setToastMessage('Преследование ставки настроено');
      setToastIsError(false);
      setShowToast(true);
    },
    [],
  );

  const promptOrApplyBidChasing = useCallback(
    (position: '1-2' | '3-10' | '11-34', maxBid: number) => {
      if (isCpmCampaign) {
        applyBidChasingConfig(position, maxBid);
        return;
      }
      const otherMax = Math.max(
        parseDisplayValue(productSearchBids[productKey]?.saved ?? '0'),
        parseDisplayValue(productRecommendationsBids[productKey]?.saved ?? '0'),
      );
      const effectiveMax = Math.max(maxBid, otherMax);
      if (
        shouldPromptRaiseDailyLimitForMaxBid(isDailyLimitEnabled, savedDailyLimitRub, effectiveMax)
      ) {
        closeAutoStrategies();
        setDailyLimitBidRaiseModal({
          kind: 'bidChasing',
          position,
          maxBid,
          recommendedLimit: minDailyLimitForMaxBid(effectiveMax),
        });
        return;
      }
      applyBidChasingConfig(position, maxBid);
    },
    [
      applyBidChasingConfig,
      isCpmCampaign,
      isDailyLimitEnabled,
      productKey,
      productRecommendationsBids,
      productSearchBids,
      savedDailyLimitRub,
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

  const handleSearchPositionTierSelect = useCallback(
    (position: BidChasingRange) => {
      setBidChasingPosition(position);
      const bidStr = String(bidChasingPositionOption(position).demoBidRub);
      setProductSearchBids((prev) => ({
        ...prev,
        [productKey]: { draft: bidStr, saved: bidStr },
      }));
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
      promptOrCommitProductBid(zone, parsed);
    },
    [productKey, productSearchBids, productRecommendationsBids, promptOrCommitProductBid],
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
    if (isCpmCampaign) {
      setIsDailyLimitEnabled(false);
      setDailyLimitValue('');
      setSavedDailyLimit('');
      return;
    }
    const isEnabled = dailyLimit !== null && dailyLimit !== undefined;
    setIsDailyLimitEnabled(isEnabled);
    if (isEnabled && dailyLimit) {
      setDailyLimitValue(String(dailyLimit));
      setSavedDailyLimit(String(dailyLimit));
    } else {
      setDailyLimitValue('');
      setSavedDailyLimit('');
    }
  }, [dailyLimit, isCpmCampaign]);

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

  useEffect(() => {
    if (!isSearchBidPickerOpen) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        searchBidPickerRef.current?.contains(target) ||
        searchBidPickerPopoverRef.current?.contains(target)
      ) {
        return;
      }
      setIsSearchBidPickerOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [isSearchBidPickerOpen]);

  const isCardWorkBonusScenario = fromReadyToRepeat && profileId === '2';

  const statsCurrentSearchPosition = useMemo(() => {
    if (isBidChasingEnabled) return BID_CHASING_TARGET_AVG_POSITION[bidChasingPosition];
    const bid = parseDisplayValue(productSearchBids[productKey]?.saved ?? '0');
    const limitRub = parseDisplayValue(
      isDailyLimitEnabled && savedDailyLimit ? savedDailyLimit : dailyLimitValue,
    );
    if (bid > 0 && limitRub > 0) {
      return Math.min(300, Math.max(1, Math.round(limitRub / bid)));
    }
    return isCardWorkBonusScenario ? 19 : 33;
  }, [
    isBidChasingEnabled,
    bidChasingPosition,
    productSearchBids,
    productKey,
    isDailyLimitEnabled,
    savedDailyLimit,
    dailyLimitValue,
    isCardWorkBonusScenario,
  ]);

  const dailyLimitSpendSummary = useMemo(() => {
    if (!isDailyLimitEnabled) return null;
    if (isSingleProductHeroCampaign) {
      return {
        total: 1100,
        spent: 1010,
        progress: Math.min(100, Math.round((1010 / 1100) * 100)),
      };
    }
    const parsedSaved = parseDisplayValue(savedDailyLimit);
    const parsedInput = parseDisplayValue(dailyLimitValue);
    const total =
      parsedSaved > 0 ? parsedSaved : parsedInput > 0 ? parsedInput : DAILY_LIMIT_ABSOLUTE_MIN;
    const spent = dailyLimitExhausted ? total : 0;
    const progress = total > 0 ? Math.min(100, (spent / total) * 100) : 0;
    return { total, spent, progress };
  }, [
    isDailyLimitEnabled,
    savedDailyLimit,
    dailyLimitValue,
    dailyLimitExhausted,
    isSingleProductHeroCampaign,
  ]);

  const savedDailyLimitRubDisplay = useMemo(() => {
    const parsedSaved = parseDisplayValue(savedDailyLimit);
    const parsedInput = parseDisplayValue(dailyLimitValue);
    return parsedSaved > 0 ? parsedSaved : parsedInput > 0 ? parsedInput : 0;
  }, [savedDailyLimit, dailyLimitValue]);

  const budgetDailyLimitStatusLabel = useMemo(() => {
    if (!isDailyLimitEnabled) return 'Неограничен';
    if (dailyLimitExhausted) return 'Исчерпан';
    if (savedDailyLimitRubDisplay > 0) {
      return `${formatForDisplay(savedDailyLimitRubDisplay)} ₽`;
    }
    return 'Не задан';
  }, [isDailyLimitEnabled, dailyLimitExhausted, savedDailyLimitRubDisplay]);

  const dynamicDailyLimitConfigured = useMemo(
    () => isDynamicDailyLimitConfigured(advancedDailyLimitSettings),
    [advancedDailyLimitSettings],
  );

  const enableAutoRefillLinkedToDailyLimit = useCallback(() => {
    setAutoRefillMode('dailyLimit');
    setIsAutoRefillEnabled(true);
  }, []);

  const autoRefillOnRulesTrigger =
    isAutoRefillEnabled && autoRefillMode === 'dailyLimit';

  const setAutoRefillOnRulesTrigger = useCallback(
    (enabled: boolean) => {
      if (enabled) {
        enableAutoRefillLinkedToDailyLimit();
      } else {
        setAutoRefillMode('manual');
        setIsAutoRefillEnabled(false);
      }
    },
    [enableAutoRefillLinkedToDailyLimit],
  );

  const dailyLimitSpendRulesLinkLabel = useMemo(() => {
    if (!dynamicDailyLimitConfigured) return undefined;
    const rules = advancedDailyLimitSettings.increaseRules ?? [];
    const activeRule = rules.find((r) => r.enabled && isDailyLimitIncreaseRuleValid(r));
    if (activeRule) {
      const summary = formatDailyLimitIncreaseConditionsSummary(activeRule.conditions ?? []);
      return formatDailyLimitSpendRulesActiveLinkLabel(
        activeRule.limitIncreasePercent,
        summary,
      );
    }
    const metrics = resolveAutoIncreaseMetricEnabled(advancedDailyLimitSettings);
    const thresholds = resolveAutoIncreaseThresholds(advancedDailyLimitSettings);
    const parts: string[] = [];
    if (metrics.drr) {
      parts.push(
        formatDailyLimitConditionPhrase('drr', 'below', thresholds.drr),
      );
    }
    if (metrics.cr) {
      parts.push(
        formatDailyLimitConditionPhrase('cr', 'above', thresholds.cr),
      );
    }
    const legacySummary = parts.join(', ');
    return formatDailyLimitSpendRulesActiveLinkLabel(
      advancedDailyLimitSettings.limitIncreasePercent ?? 25,
      legacySummary,
    );
  }, [advancedDailyLimitSettings, dynamicDailyLimitConfigured]);

  const budgetStrategiesStatusLabel = useMemo(() => {
    const strategiesEnabled = isBidChasingEnabled || dynamicDailyLimitConfigured;
    if (strategiesEnabled) return 'Стратегии включены';
    return 'Не настроены';
  }, [isBidChasingEnabled, dynamicDailyLimitConfigured]);

  const budgetAutomationStrategiesActive = useMemo(
    () => budgetStrategiesStatusLabel === 'Стратегии включены',
    [budgetStrategiesStatusLabel],
  );

  const budgetAutomationStrategySummary = useMemo(() => {
    const messages: string[] = [];
    const profitStrategyActive = dynamicDailyLimitConfigured;
    if (profitStrategyActive) {
      messages.push('Выбрана стратегия «Эффективные траты»');
    }
    if (isBidChasingEnabled) {
      messages.push(`Автобиддер держит ${bidChasingPositionLinkLabel}`);
    }
    return messages;
  }, [isBidChasingEnabled, dynamicDailyLimitConfigured, bidChasingPositionLinkLabel]);

  useEffect(() => {
    setIsCampaignActive(campaignStatus === 'active');
  }, [campaignStatus]);

  const handleSingleProductCampaignActiveChange = useCallback(
    (active: boolean) => {
      setIsCampaignActive(active);
      const status = active ? 'active' : 'paused';
      const statusText = active ? 'активна' : 'приостановлена';
      onUpdateData?.({ status, statusText });
      setToastMessage(active ? 'Кампания возобновлена' : 'Кампания приостановлена');
      setShowToast(true);
    },
    [onUpdateData],
  );

  const confirmFinishSingleProductCampaign = useCallback(() => {
    setIsFinishCampaignModalOpen(false);
    setIsCampaignActive(false);
    onUpdateData?.({ status: 'paused', statusText: 'приостановлена' });
    setToastMessage('Кампания завершена');
    setShowToast(true);
    onBack();
  }, [onBack, onUpdateData]);

  return (
    <div className="min-h-screen bg-[#F6F6F9] font-sans text-gray-900 pb-10">
      {cpmBidRoundedAlertNode}
      <AppHeader onNavigate={onBack} />

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        {showSingleProductLayout ? (
          <>
            <CpcSingleProductHeroCard
              campaignName={campaignName}
              campaignId={campaignId}
              isCampaignActive={isCampaignActive}
              onCampaignActiveChange={handleSingleProductCampaignActiveChange}
              onFinishCampaign={() => setIsFinishCampaignModalOpen(true)}
              product={{
                nmId: DEMO_CPC_PRODUCT.nmId,
                productName: isCpmCampaign ? DEMO_CPC_PRODUCT.productName : 'Шапка зимняя',
                brand: DEMO_CPC_PRODUCT.brand,
                articleSeller: DEMO_CPC_PRODUCT.articleSeller,
                category: DEMO_CPC_PRODUCT.category,
                imageUrl: DEMO_CPC_PRODUCT.imageUrl,
                stockLabel: '1 000 шт',
              }}
              isAutoRefillEnabled={isAutoRefillEnabled}
              onConfigureAutoRefill={() => {
                setWasAutoRefillToggledOn(false);
                setIsAutoRefillModalOpen(true);
              }}
              paymentModelLabel={paymentModel}
            />
            <div className="mb-4 grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
              <CpcSingleProductBudgetCard
                campaignBudget={campaignBudget}
                onRefill={() => setIsBudgetRefillModalOpen(true)}
                isAutoRefillEnabled={isAutoRefillEnabled}
                onAutoRefillEnabledChange={(checked) => {
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
                onConfigureAutoRefill={() => {
                  setWasAutoRefillToggledOn(false);
                  setIsAutoRefillModalOpen(true);
                }}
                hideDailyLimit={isCpmCampaign}
                isDailyLimitEnabled={isDailyLimitEnabled}
                onDailyLimitEnabledChange={(checked) => {
                  if (checked) applyMinDailyLimitOnEnable();
                  else disableDailyLimit();
                }}
                dailyLimitValue={dailyLimitValue ? formatForDisplay(dailyLimitValue) : ''}
                onDailyLimitValueChange={(raw) => {
                  const parsed = parseDisplayValue(raw);
                  if (!isNaN(parsed)) setDailyLimitValue(String(parsed));
                  else if (raw === '') setDailyLimitValue('');
                }}
                onDailyLimitBlur={() => {
                  if (!isDailyLimitEnabled) return;
                  const parsed = parseDisplayValue(dailyLimitValue);
                  if (isNaN(parsed) || parsed < DAILY_LIMIT_ABSOLUTE_MIN) return;
                  if (parsed > campaignBudget) return;
                  setSavedDailyLimit(dailyLimitValue);
                  if (onUpdateData) onUpdateData({ dailyLimit: parsed, scheduledDailyLimit: null });
                }}
                onOpenAdvancedDailyLimit={() => setIsAdvancedDailyLimitModalOpen(true)}
                dailyLimitSpendSummary={dailyLimitSpendSummary}
                advancedDailyLimitSettingsApplied={dynamicDailyLimitConfigured}
                spendRulesLinkLabel={dailyLimitSpendRulesLinkLabel}
                showSpendRulesAutomation={
                  isDailyLimitEnabled && savedDailyLimitRub >= DAILY_LIMIT_ABSOLUTE_MIN
                }
              />
              <CpcSingleProductStrategyCard
                displayZones={displayZones}
                onDisplayZonesChange={(patch) =>
                  setDisplayZones((prev) => {
                    const next = { ...prev, ...patch };
                    if (!next.search && !next.recommendations) return prev;
                    return next;
                  })
                }
                isBidChasingEnabled={isBidChasingEnabled}
                bidChasingPositionLabel={bidChasingPositionLinkLabel}
                searchBidDraft={productSearchBids[productKey]?.draft ?? ''}
                onSearchBidDraftChange={(v) => {
                  if (v === '' || /^\d*\.?\d*$/.test(v)) {
                    setProductSearchBids((prev) => ({
                      ...prev,
                      [productKey]: { ...prev[productKey], draft: v },
                    }));
                  }
                }}
                onSearchBidBlur={() => handleProductBidBlur('search')}
                bidChasingPosition={bidChasingPosition}
                onSearchPositionTierSelect={handleSearchPositionTierSelect}
                recommendationsBidDraft={productRecommendationsBids[productKey]?.draft ?? ''}
                onRecommendationsBidDraftChange={(v) => {
                  if (v === '' || /^\d*\.?\d*$/.test(v)) {
                    setProductRecommendationsBids((prev) => ({
                      ...prev,
                      [productKey]: { ...prev[productKey], draft: v },
                    }));
                  }
                }}
                onRecommendationsBidBlur={() => handleProductBidBlur('recommendations')}
                onOpenPositionStrategy={() => openAutoStrategies('positions')}
                onSelectManualSearchStrategy={() => setIsBidChasingEnabled(false)}
              />
            </div>
            <CpcSingleProductClustersCard />
          </>
        ) : null}

        {!showSingleProductLayout ? (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
            <div className="mt-2 flex items-center gap-3 text-sm text-gray-500 flex-wrap">
              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                Активна
              </span>
              <span>{paymentModel}</span>
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
        ) : null}

        {!showSingleProductLayout ? (
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
                    autoRefillMode === 'dailyLimit' ? (
                      <>
                        Пополняем бюджет автоматически, если он меньше нужного дневного лимита
                      </>
                    ) : (
                      <>
                        Если бюджет меньше {formatForDisplay(1000)} ₽, пополнять на{' '}
                        {formatForDisplay(3000)} ₽ не чаще 1 раза в день
                      </>
                    )
                  ) : (
                    <>Включите автопополнение, чтобы кампания не останавливалась</>
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="flex min-h-[148px] flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <div className="flex min-w-0 items-start gap-2">
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
            </div>

            <div className="flex flex-1 items-center gap-2">
              <div className="flex min-w-0 flex-col justify-center gap-3">
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
                <DailyLimitSpendSummaryBlock summary={dailyLimitSpendSummary} layout="sidebar" />
              ) : (
                <div className="flex w-[min(148px,30%)] shrink-0 flex-col justify-center border-l border-gray-200 pl-3">
                  <p className="text-xs leading-snug text-gray-500">
                    Чем больше ставка, тем больше будет минимальный лимит
                  </p>
                </div>
              )}

              {isDailyLimitEnabled && savedDailyLimitRub >= DAILY_LIMIT_ABSOLUTE_MIN ? (
                <div
                  className={
                    dailyLimitSpendRulesLinkLabel
                      ? 'min-w-0 max-w-[10rem] shrink'
                      : 'w-fit shrink-0'
                  }
                >
                <AutomationColumn
                  buttonLabel="Задать правила"
                  onButtonClick={() => setIsAdvancedDailyLimitModalOpen(true)}
                  settingsApplied={dynamicDailyLimitConfigured}
                  activeLinkLabel={dailyLimitSpendRulesLinkLabel}
                />
                </div>
              ) : null}
            </div>
          </div>
        </div>
        ) : null}

        <CpcCampaignStatisticsSection
          isLowActivityDemo={isCardWorkBonusScenario}
          currentSearchPosition={statsCurrentSearchPosition}
          onIncreaseBidClick={() => {
            productsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setToastMessage('Измените ставку в блоке «Товары»');
            setToastIsError(false);
            setShowToast(true);
          }}
          onHoldPositionClick={() => setIsBidChasingSetupModalOpen(true)}
        />

        {!showSingleProductLayout ? (
        <>
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Зоны показов</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 min-h-[4.5rem]">
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
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 min-h-[4.5rem]">
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
            </div>
          </div>
        </section>

        <section
          ref={productsSectionRef}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-8"
        >
          <h2 className="mb-5 text-xl font-bold text-gray-900">
            Товары{' '}
            <span className="font-normal text-gray-500">{campaignProductNmIds.length} шт.</span>
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
                    <HeaderHint label="Автобиддер в поиске" />
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
                            <SearchBidPositionHint
                              selectedPosition={bidChasingPosition}
                              onSelectPosition={handleSearchPositionTierSelect}
                            />
                          </>
                        )}
                      </div>
                      {!isBidChasingEnabled ? (
                        <div className="relative shrink-0" ref={searchBidPickerRef}>
                          <BidHistogramButton
                            isActive={isSearchBidPickerOpen}
                            onClick={() => setIsSearchBidPickerOpen((open) => !open)}
                          />
                          {isSearchBidPickerOpen ? (
                            <SearchBidPositionPicker
                              anchorRef={searchBidPickerRef}
                              popoverRef={searchBidPickerPopoverRef}
                              selectedPosition={bidChasingPosition}
                              onSelectPosition={handleSearchPositionTierSelect}
                              onClose={() => setIsSearchBidPickerOpen(false)}
                            />
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td className="py-3 pr-3 align-top">
                    <div className="flex min-h-9 items-start">
                      {isBidChasingEnabled ? (
                        <button
                          type="button"
                          className="text-left text-sm font-medium leading-snug text-blue-600 hover:text-blue-700 hover:underline"
                          onClick={() => openAutoStrategies('positions')}
                        >
                          {bidChasingPositionLinkLabel}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="h-9 rounded-lg bg-[#F2F2F7] px-4 text-sm font-medium text-gray-800 hover:bg-[#e8e8ed]"
                          onClick={() => openAutoStrategies('positions')}
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
                              disabled={!canRemoveProductFromCampaign}
                              className={`block w-full px-3 py-2 text-left text-sm ${
                                canRemoveProductFromCampaign
                                  ? 'text-red-600 hover:bg-red-50'
                                  : 'cursor-not-allowed text-gray-400'
                              }`}
                              onClick={() => {
                                setIsProductActionsMenuOpen(false);
                                if (!canRemoveProductFromCampaign) {
                                  setToastMessage('Нельзя удалить единственный товар в кампании');
                                  setToastIsError(true);
                                  setShowToast(true);
                                  return;
                                }
                                setCampaignProductNmIds((prev) =>
                                  prev.filter((id) => id !== DEMO_CPC_PRODUCT_NM),
                                );
                                setToastMessage('Товар удалён из кампании');
                                setToastIsError(false);
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
        </>
        ) : null}

      </main>

      {/* Auto Refill Modal */}
      {isAutoRefillModalOpen && (
        <AutoRefillModal
          isOpen={isAutoRefillModalOpen}
          initialMode={autoRefillMode}
          onClose={() => {
            setIsAutoRefillModalOpen(false);
            if (wasAutoRefillToggledOn) {
              setIsAutoRefillEnabled(false);
              setWasAutoRefillToggledOn(false);
            }
          }}
          onSave={(mode) => {
            setAutoRefillMode(mode);
            setIsAutoRefillEnabled(true);
            setIsAutoRefillModalOpen(false);
            setWasAutoRefillToggledOn(false);
            setToastMessage('Автопополнение настроено');
            setShowToast(true);
          }}
        />
      )}

      <AutoStrategiesModal
        isOpen={autoStrategiesModal !== null}
        tab={autoStrategiesModal?.tab ?? 'profit'}
        onTabChange={(tab) => setAutoStrategiesModal({ tab })}
        onClose={closeAutoStrategies}
        bidChasing={{
          initialPosition: bidChasingPosition,
          initialMaxBid: bidChasingMaxBid,
          isDailyLimitEnabled,
          savedDailyLimitRub,
          otherMaxProductBidRub: Math.max(
            parseDisplayValue(productSearchBids[productKey]?.saved ?? '0'),
            parseDisplayValue(productRecommendationsBids[productKey]?.saved ?? '0'),
          ),
          isBidChasingEnabled,
          onDisable: () => {
            setIsBidChasingEnabled(false);
            closeAutoStrategies();
            setToastMessage('Преследование ставки отключено');
            setToastIsError(false);
            setShowToast(true);
          },
          onApply: ({ position, maxBid }) => {
            promptOrApplyBidChasing(position, maxBid);
          },
        }}
        dailyLimit={{
          advancedSettingsOnly: true,
          conditionRuleBuilder: true,
          isDailyLimitEnabled,
          onEnableDailyLimit: applyMinDailyLimitOnEnable,
          onDisableDailyLimit: disableDailyLimit,
          dailyLimitValue,
          onDailyLimitValueChange: setDailyLimitValue,
          onDailyLimitCommit: (parsed, options) => {
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
            if (!options?.silent) {
              setToastMessage(
                `Новый дневной лимит установлен.\nРаспределяем ${formatForDisplay(parsed)}₽ в течении суток равномерно`,
              );
              setToastIsError(false);
              setShowToast(true);
            }
            if (onUpdateData) {
              onUpdateData({ dailyLimit: parsed, scheduledDailyLimit: null });
            }
            setIsDailyLimitEnabled(true);
          },
          savedDailyLimit,
          isCarryoverEnabled,
          onCarryoverChange: setIsCarryoverEnabled,
          campaignBudget,
          initialSettings: advancedDailyLimitSettings,
          referenceCpcBidRub: dailyLimitTrafficReference.cpcBidRub,
          targetAvgPosition: dailyLimitTrafficReference.targetAvgPosition,
          autoRefillOnRulesTrigger,
          onAutoRefillOnRulesTriggerChange: setAutoRefillOnRulesTrigger,
          onApply: (settings) => {
            setAdvancedDailyLimitSettings(settings);
            closeAutoStrategies();
            setToastMessage('Настройки стратегии «Тратить эффективно» сохранены');
            setToastIsError(false);
            setShowToast(true);
          },
        }}
      />

      <AdvancedDailyLimitModal
        advancedSettingsOnly
        conditionRuleBuilder
        isOpen={isAdvancedDailyLimitModalOpen}
        onClose={() => setIsAdvancedDailyLimitModalOpen(false)}
        isDailyLimitEnabled={isDailyLimitEnabled}
        onEnableDailyLimit={applyMinDailyLimitOnEnable}
        onDisableDailyLimit={disableDailyLimit}
        dailyLimitValue={dailyLimitValue}
        onDailyLimitValueChange={setDailyLimitValue}
        onDailyLimitCommit={(parsed, options) => {
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
          if (!options?.silent) {
            setToastMessage(
              `Новый дневной лимит установлен.\nРаспределяем ${formatForDisplay(parsed)}₽ в течении суток равномерно`,
            );
            setToastIsError(false);
            setShowToast(true);
          }
          if (onUpdateData) {
            onUpdateData({ dailyLimit: parsed, scheduledDailyLimit: null });
          }
          setIsDailyLimitEnabled(true);
        }}
        savedDailyLimit={savedDailyLimit}
        isCarryoverEnabled={isCarryoverEnabled}
        onCarryoverChange={setIsCarryoverEnabled}
        campaignBudget={campaignBudget}
        initialSettings={advancedDailyLimitSettings}
        referenceCpcBidRub={dailyLimitTrafficReference.cpcBidRub}
        targetAvgPosition={dailyLimitTrafficReference.targetAvgPosition}
        autoRefillOnRulesTrigger={autoRefillOnRulesTrigger}
        onAutoRefillOnRulesTriggerChange={setAutoRefillOnRulesTrigger}
        onApply={(settings, options) => {
          setAdvancedDailyLimitSettings(settings);
          if (options?.reset) return;
          setIsAdvancedDailyLimitModalOpen(false);
          setToastMessage(
            isDynamicDailyLimitConfigured(settings)
              ? 'Настроен динамичный лимит'
              : 'Настройки дневного лимита сохранены',
          );
          setToastIsError(false);
          setShowToast(true);
        }}
        onAfterResetSettings={() => {
          setToastMessage('Расширенные настройки сброшены');
          setToastIsError(false);
          setShowToast(true);
        }}
      />

      <AdvancedDailyLimitModal
        isOpen={isAutomationDailyLimitModalOpen}
        onClose={() => setIsAutomationDailyLimitModalOpen(false)}
        isDailyLimitEnabled={isDailyLimitEnabled}
        onEnableDailyLimit={applyMinDailyLimitOnEnable}
        onDisableDailyLimit={disableDailyLimit}
        dailyLimitValue={dailyLimitValue}
        onDailyLimitValueChange={setDailyLimitValue}
        onDailyLimitCommit={(parsed, options) => {
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
          if (!options?.silent) {
            setToastMessage(
              `Новый дневной лимит установлен.\nРаспределяем ${formatForDisplay(parsed)}₽ в течении суток равномерно`,
            );
            setToastIsError(false);
            setShowToast(true);
          }
          if (onUpdateData) {
            onUpdateData({ dailyLimit: parsed, scheduledDailyLimit: null });
          }
          setIsDailyLimitEnabled(true);
        }}
        savedDailyLimit={savedDailyLimit}
        isCarryoverEnabled={isCarryoverEnabled}
        onCarryoverChange={setIsCarryoverEnabled}
        campaignBudget={campaignBudget}
        initialSettings={advancedDailyLimitSettings}
        referenceCpcBidRub={dailyLimitTrafficReference.cpcBidRub}
        targetAvgPosition={dailyLimitTrafficReference.targetAvgPosition}
        onApply={(settings) => {
          setAdvancedDailyLimitSettings(settings);
          setIsAutomationDailyLimitModalOpen(false);
          setToastMessage('Настройки дневного лимита сохранены');
          setToastIsError(false);
          setShowToast(true);
        }}
      />

      <BidChasingClustersModal
        isOpen={isBidChasingSetupModalOpen}
        onClose={() => setIsBidChasingSetupModalOpen(false)}
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
          setIsBidChasingSetupModalOpen(false);
          setToastMessage('Преследование ставки отключено');
          setToastIsError(false);
          setShowToast(true);
        }}
        onApply={({ position, maxBid }) => {
          setIsBidChasingSetupModalOpen(false);
          promptOrApplyBidChasing(position, maxBid);
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

      {dailyLimitBidRaiseModal && (
        <div
          className="fixed inset-0 z-[105] flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            const payload = dailyLimitBidRaiseModal;
            setDailyLimitBidRaiseModal(null);
            if (payload.kind === 'productBid') {
              commitProductBid(payload.zone, payload.attemptedBid);
            } else {
              applyBidChasingConfig(payload.position, payload.maxBid);
            }
          }}
        >
          <div
            className="relative w-full max-w-[480px] rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                const payload = dailyLimitBidRaiseModal;
                setDailyLimitBidRaiseModal(null);
                if (payload.kind === 'productBid') {
                  commitProductBid(payload.zone, payload.attemptedBid);
                } else {
                  applyBidChasingConfig(payload.position, payload.maxBid);
                }
              }}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              aria-label="Закрыть"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="mb-2 pr-8 text-base font-semibold text-gray-900">
              Поднимите дневной лимит
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-gray-600">
              При текущей ставке кампания может работать некорректно или возможны перекруты. Чтобы
              этого не было, установите дневной лимит не ниже{' '}
              <span className="font-semibold text-gray-900">
                {formatForDisplay(dailyLimitBidRaiseModal.recommendedLimit)} ₽
              </span>{' '}
              (до 30 кликов в день по максимальной ставке).
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  const payload = dailyLimitBidRaiseModal;
                  setDailyLimitBidRaiseModal(null);
                  if (payload.kind === 'productBid') {
                    commitProductBid(payload.zone, payload.attemptedBid);
                  } else {
                    applyBidChasingConfig(payload.position, payload.maxBid);
                  }
                }}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                Закрыть
              </button>
              <button
                type="button"
                onClick={() => {
                  const payload = dailyLimitBidRaiseModal;
                  const budgetConflict =
                    payload.kind === 'productBid'
                      ? {
                          kind: 'productBid' as const,
                          productKey,
                          zone: payload.zone,
                          attemptedBid: payload.attemptedBid,
                        }
                      : {
                          kind: 'bidChasing' as const,
                          position: payload.position,
                          maxBid: payload.maxBid,
                        };
                  const raised = applySavedDailyLimitRub(
                    payload.recommendedLimit,
                    budgetConflict,
                  );
                  setDailyLimitBidRaiseModal(null);
                  if (!raised) return;
                  if (payload.kind === 'productBid') {
                    commitProductBid(payload.zone, payload.attemptedBid);
                  } else {
                    applyBidChasingConfig(payload.position, payload.maxBid);
                  }
                }}
                className="rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-700"
              >
                Поднять лимит до {formatForDisplay(dailyLimitBidRaiseModal.recommendedLimit)} ₽
              </button>
            </div>
          </div>
        </div>
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
      {showSingleProductLayout && isFinishCampaignModalOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsFinishCampaignModalOpen(false)}
          role="presentation"
        >
          <div
            className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="finish-campaign-title"
          >
            <button
              type="button"
              onClick={() => setIsFinishCampaignModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              aria-label="Закрыть"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 id="finish-campaign-title" className="pr-8 text-lg font-bold text-gray-900">
              Завершить кампанию?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Показы остановятся. Кампанию можно будет найти в списке в статусе «Приостановлена».
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsFinishCampaignModalOpen(false)}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-100"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={confirmFinishSingleProductCampaign}
                className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
              >
                Завершить
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
export type AutoRefillMode = 'manual' | 'dailyLimit';

export const AutoRefillModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (mode: AutoRefillMode) => void;
  initialMode: AutoRefillMode;
}> = ({
  isOpen,
  onClose,
  onSave,
  initialMode,
}) => {
  const [refillMode, setRefillMode] = useState<AutoRefillMode>(initialMode);
  const [threshold, setThreshold] = useState('1000');
  const [amount, setAmount] = useState('3000');
  const [usePromoBonuses, setUsePromoBonuses] = useState(true);
  const [showPackages, setShowPackages] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setRefillMode(initialMode);
  }, [isOpen, initialMode]);

  const refillTabClass = (active: boolean) =>
    `shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
    }`;

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
            <div
              className="mb-5 inline-flex w-fit max-w-full gap-1 rounded-xl bg-[#F2F2F7] p-1"
              role="tablist"
              aria-label="Способ автопополнения"
            >
              <button
                type="button"
                role="tab"
                aria-selected={refillMode === 'manual'}
                className={refillTabClass(refillMode === 'manual')}
                onClick={() => setRefillMode('manual')}
              >
                Ручная настройка
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={refillMode === 'dailyLimit'}
                className={refillTabClass(refillMode === 'dailyLimit')}
                onClick={() => setRefillMode('dailyLimit')}
              >
                Пополнение от дневного лимита
              </button>
            </div>

            {refillMode === 'manual' ? (
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
            ) : (
              <p className="max-w-lg text-sm leading-relaxed text-gray-600">
                Пополняем бюджет, если его окажется меньше, чем нужно для текущего дневного лимита.
              </p>
            )}
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
            <button onClick={() => onSave(refillMode)} className="px-6 py-2.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg">
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

type AutoStrategiesTab = 'positions' | 'profit';

const AutoStrategiesModal: React.FC<{
  isOpen: boolean;
  tab: AutoStrategiesTab;
  onTabChange: (tab: AutoStrategiesTab) => void;
  onClose: () => void;
  bidChasing: React.ComponentProps<typeof BidChasingClustersModal>;
  dailyLimit: React.ComponentProps<typeof AdvancedDailyLimitModal>;
}> = ({ isOpen, tab, onTabChange, onClose, bidChasing, dailyLimit }) => {
  if (!isOpen) return null;

  const tabClass = (active: boolean) =>
    `flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
    }`;

  return (
    <div className="fixed inset-0 z-[110] bg-black/50" onClick={onClose} role="presentation">
      <div className="flex h-full w-full justify-end" onClick={onClose}>
        <div className="flex h-full max-h-full min-w-0 items-stretch gap-2" onClick={(e) => e.stopPropagation()}>
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
            className="flex h-full w-[560px] max-w-[calc(100vw-3rem)] shrink-0 flex-col overflow-hidden bg-white shadow-2xl animate-in slide-in-from-right duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auto-strategies-title"
          >
            <div className="shrink-0 px-6 pt-6 pb-4 sm:px-8">
              <h2 id="auto-strategies-title" className="text-xl font-bold leading-snug text-gray-900">
                Автостратегии
              </h2>
              <div
                className="mt-4 flex gap-1 rounded-xl bg-[#F2F2F7] p-1"
                role="tablist"
                aria-label="Стратегии"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'profit'}
                  className={tabClass(tab === 'profit')}
                  onClick={() => onTabChange('profit')}
                >
                  Тратить эффективно
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'positions'}
                  className={tabClass(tab === 'positions')}
                  onClick={() => onTabChange('positions')}
                >
                  Вывести в топ
                </button>
              </div>
            </div>

            {tab === 'positions' ? (
              <BidChasingClustersModal {...bidChasing} embedded isOpen onClose={onClose} />
            ) : (
              <AdvancedDailyLimitModal {...dailyLimit} embedded isOpen onClose={onClose} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const BidChasingClustersModal: React.FC<{
  embedded?: boolean;
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
  embedded = false,
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

  const body = (
    <>
      <div className={`min-w-0 flex-1 overflow-x-hidden overflow-y-auto ${embedded ? 'px-6 pb-4 sm:px-8' : 'p-6 sm:p-8'}`}>
        {!embedded ? (
          <>
            <h2 id="bid-chasing-modal-title" className="text-xl font-bold text-gray-900 leading-snug">
              Автобиддер в поиске
            </h2>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              Алгоритм будет автоматически регулировать ставку, чтобы карточка занимала выбранные позиции в
              поисковой выдаче
            </p>
          </>
        ) : null}

          <div className={`rounded-2xl border border-gray-100 bg-white p-5 ${embedded ? '' : 'mt-6'}`}>
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
                      <span className="mt-1 block text-xs text-gray-500">
                        Рекомендуемая ставка: {formatRecommendedBidRub(opt.demoBidRub)} ₽
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-500">
                        Клики: ~ {formatApproxClicksPerDay(opt.demoClicksPerDay)} в день
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-500">
                        Примерный дневной бюджет: ~{' '}
                        {formatApproxDailyBudgetRub(opt.demoBidRub, opt.demoClicksPerDay)} ₽
                      </span>
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
    </>
  );

  if (embedded) {
    return <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{body}</div>;
  }

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
            className="flex h-full w-[560px] max-w-[calc(100vw-3rem)] shrink-0 flex-col overflow-hidden bg-white shadow-2xl animate-in slide-in-from-right duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bid-chasing-modal-title"
          >
            {body}
          </div>
        </div>
      </div>
    </div>
  );
};

type DailyLimitStrategyId = 'spendOptimization' | 'clicksOptimization';

type LimitIncreasePercent = 25 | 50 | 100;

const LIMIT_INCREASE_PERCENT_OPTIONS: LimitIncreasePercent[] = [25, 50, 100];

const DEFAULT_AUTO_INCREASE_THRESHOLD: Record<'drr' | 'cr', number> = {
  drr: 15,
  cr: 2.8,
};

function autoIncreaseThresholdLabel(metric: 'drr' | 'cr') {
  return metric === 'drr' ? 'При ДРР ниже' : 'При CR выше';
}

export type AdvancedDailyLimitSettings = {
  strategyId: DailyLimitStrategyId | null;
  strategyGroupLabel: string;
  autoIncreaseEnabled: boolean;
  /** @deprecated сохраняем для совместимости; дублирует drrThresholdPercent */
  metric: 'drr' | 'cr';
  /** @deprecated сохраняем для совместимости; дублирует drrThresholdPercent */
  thresholdPercent: number;
  drrThresholdPercent: number;
  crThresholdPercent: number;
  drrMetricEnabled: boolean;
  crMetricEnabled: boolean;
  increaseAmountRub: number;
  limitIncreasePercent: LimitIncreasePercent;
  /** Конструктор условий увеличения дневного лимита */
  increaseRules?: DailyLimitIncreaseRule[];
};

type DailyLimitConditionMetric = 'drr' | 'cr' | 'impressions';

type DailyLimitConditionCompare = 'below' | 'above';

type DailyLimitIncreaseCondition = {
  id: string;
  metric: DailyLimitConditionMetric | null;
  compare: DailyLimitConditionCompare;
  threshold: number;
};

type DailyLimitIncreaseRule = {
  id: string;
  enabled: boolean;
  /** Шаблон правила: встроенный, сохранённый пользователем или своё условие */
  presetId?: string;
  limitIncreasePercent: number;
  conditions?: DailyLimitIncreaseCondition[];
  drrBelowPercent: number;
  crAbovePercent: number;
};

const DAILY_LIMIT_RULE_MAX_CONDITIONS = 5;

function newDailyLimitIncreaseRuleId() {
  return `rule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function newDailyLimitIncreaseConditionId() {
  return `condition-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

type DailyLimitSettingsLegacy = AdvancedDailyLimitSettings & {
  ctrThresholdPercent?: number;
  ctrMetricEnabled?: boolean;
  metric?: 'drr' | 'cr' | 'ctr';
};

function resolveAutoIncreaseThresholds(settings: AdvancedDailyLimitSettings) {
  const legacy = settings as DailyLimitSettingsLegacy;
  const drr =
    settings.drrThresholdPercent ??
    (legacy.metric === 'drr'
      ? settings.thresholdPercent
      : DEFAULT_AUTO_INCREASE_THRESHOLD.drr);
  const cr =
    settings.crThresholdPercent ??
    legacy.ctrThresholdPercent ??
    (legacy.metric === 'cr' || legacy.metric === 'ctr'
      ? settings.thresholdPercent
      : DEFAULT_AUTO_INCREASE_THRESHOLD.cr);
  return { drr, cr };
}

function resolveAutoIncreaseMetricEnabled(settings: AdvancedDailyLimitSettings) {
  const legacy = settings as DailyLimitSettingsLegacy;
  return {
    drr:
      settings.drrMetricEnabled ??
      (legacy.metric !== 'cr' && legacy.metric !== 'ctr'),
    cr:
      settings.crMetricEnabled ??
      legacy.ctrMetricEnabled ??
      (legacy.metric === 'cr' || legacy.metric === 'ctr'),
  };
}

export function createDefaultAdvancedDailyLimitSettings(): AdvancedDailyLimitSettings {
  return {
    strategyId: null,
    strategyGroupLabel: '',
    autoIncreaseEnabled: false,
    metric: 'drr',
    thresholdPercent: DEFAULT_AUTO_INCREASE_THRESHOLD.drr,
    drrThresholdPercent: DEFAULT_AUTO_INCREASE_THRESHOLD.drr,
    crThresholdPercent: DEFAULT_AUTO_INCREASE_THRESHOLD.cr,
    drrMetricEnabled: false,
    crMetricEnabled: false,
    increaseAmountRub: 500,
    limitIncreasePercent: 25,
    increaseRules: [],
  };
}

function isDynamicDailyLimitConfigured(settings: AdvancedDailyLimitSettings): boolean {
  if (!settings.autoIncreaseEnabled) return false;
  if (settings.increaseRules?.length) {
    return settings.increaseRules.some((r) => r.enabled && isDailyLimitIncreaseRuleValid(r));
  }
  const metrics = resolveAutoIncreaseMetricEnabled(settings);
  return metrics.drr || metrics.cr;
}

function isAutoIncreaseThresholdValid(parsed: number) {
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 100;
}

function conditionMetricLabel(metric: DailyLimitConditionMetric) {
  switch (metric) {
    case 'drr':
      return 'ДРР';
    case 'cr':
      return 'CR';
    case 'impressions':
      return 'Показы';
  }
}

function defaultCompareForMetric(metric: DailyLimitConditionMetric): DailyLimitConditionCompare {
  return metric === 'drr' ? 'below' : 'above';
}

function resolveConditionCompare(
  condition: DailyLimitIncreaseCondition,
): DailyLimitConditionCompare {
  if (condition.metric == null) return 'below';
  return condition.compare ?? defaultCompareForMetric(condition.metric);
}

function conditionCompareLabel(compare: DailyLimitConditionCompare) {
  return compare === 'below' ? 'Ниже' : 'Выше';
}

function conditionMetricUnit(metric: DailyLimitConditionMetric) {
  return metric === 'impressions' ? '' : '%';
}

function formatDailyLimitConditionPhrase(
  metric: DailyLimitConditionMetric,
  compare: DailyLimitConditionCompare,
  threshold: number,
): string {
  const unit = conditionMetricUnit(metric);
  const thresholdPart = threshold > 0 ? ` ${threshold}${unit}` : '';
  return `${conditionMetricLabel(metric)} ${conditionCompareLabel(compare).toLowerCase()}${thresholdPart}`;
}

function formatDailyLimitIncreaseConditionsSummary(
  conditions: DailyLimitIncreaseCondition[],
): string {
  const parts = conditions
    .filter((c): c is DailyLimitIncreaseCondition & { metric: DailyLimitConditionMetric } =>
      c.metric != null,
    )
    .map((c) =>
      formatDailyLimitConditionPhrase(c.metric, resolveConditionCompare(c), c.threshold),
    );
  return parts.join(', ');
}

function formatDailyLimitSpendRulesActiveLinkLabel(
  limitIncreasePercent: number,
  conditionsSummary: string,
): string | undefined {
  const trimmed = conditionsSummary.trim();
  if (!trimmed) return undefined;
  return `Увеличим бюджет на ${limitIncreasePercent}% если ${trimmed}`;
}

function isConditionThresholdValid(metric: DailyLimitConditionMetric, parsed: number) {
  if (!Number.isFinite(parsed) || parsed <= 0) return false;
  if (metric === 'impressions') return parsed <= 99_999_999;
  return parsed <= 100;
}

function migrateLegacyRuleConditions(rule: DailyLimitIncreaseRule): DailyLimitIncreaseRule {
  if (rule.conditions !== undefined) {
    return {
      ...rule,
      conditions: rule.conditions.map((c) => ({
        ...c,
        metric: c.metric ?? null,
        compare:
          c.compare ??
          (c.metric != null ? defaultCompareForMetric(c.metric) : 'below'),
      })),
    };
  }
  const hasLegacy =
    rule.drrBelowPercent > 0 || rule.crAbovePercent > 0;
  if (!hasLegacy) {
    return { ...rule, conditions: [] };
  }
  return {
    ...rule,
    conditions: [
      {
        id: newDailyLimitIncreaseConditionId(),
        metric: 'drr',
        compare: 'below',
        threshold: rule.drrBelowPercent,
      },
      {
        id: newDailyLimitIncreaseConditionId(),
        metric: 'cr',
        compare: 'above',
        threshold: rule.crAbovePercent,
      },
    ],
  };
}

function isDailyLimitIncreaseRuleValid(rule: DailyLimitIncreaseRule) {
  const conditions = rule.conditions ?? [];
  if (conditions.length === 0) return false;
  return conditions.every(
    (condition) =>
      condition.metric != null &&
      isConditionThresholdValid(condition.metric, condition.threshold),
  );
}

function areDailyLimitIncreaseRulesValid(rules: DailyLimitIncreaseRule[]) {
  const active = rules.filter((r) => r.enabled);
  if (active.length === 0) return false;
  return active.every(isDailyLimitIncreaseRuleValid);
}

const DAILY_LIMIT_STRATEGY_PRESETS: {
  id: DailyLimitStrategyId;
  title: string;
  description: string;
  metric: 'drr' | 'cr';
  metricLabel: string;
  metricHint: string;
  thresholdPercent: number;
  thresholdHint: string;
  increaseAmountRub: number;
  accentClass: string;
  selectedBgClass: string;
}[] = [
  {
    id: 'spendOptimization',
    title: 'Оптимизация расходов',
    description: 'Повышаем дневной лимит, когда доля расходов ниже, чем у большинства в категории',
    metric: 'drr',
    metricLabel: 'ДРР (доля расходов)',
    metricHint: 'Чем ниже ДРР, тем выгоднее продвижение — можно смелее повышать дневной лимит.',
    thresholdPercent: 12,
    thresholdHint: 'Порог ДРР подобран по медиане лидеров категории',
    increaseAmountRub: 750,
    accentClass: 'border-l-[#9A41FE]',
    selectedBgClass: 'bg-[#F6F2FF]',
  },
  {
    id: 'clicksOptimization',
    title: 'Оптимизация кликов',
    description: 'Увеличиваем лимит, когда CR стабильно выше среднего по сильным игрокам категории',
    metric: 'cr',
    metricLabel: 'CR',
    metricHint: 'Высокий CR говорит о востребованности карточки — можно наращивать показы.',
    thresholdPercent: 2.8,
    thresholdHint: 'Порог CR основан на средних показателях лидеров в категории',
    increaseAmountRub: 500,
    accentClass: 'border-l-emerald-400',
    selectedBgClass: 'bg-white',
  },
];

const RECOMMENDED_DRR_THRESHOLD_PERCENT = DAILY_LIMIT_STRATEGY_PRESETS.find(
  (s) => s.id === 'spendOptimization',
)!.thresholdPercent;

const RECOMMENDED_CR_THRESHOLD_PERCENT = DAILY_LIMIT_STRATEGY_PRESETS.find(
  (s) => s.id === 'clicksOptimization',
)!.thresholdPercent;

function dailyLimitStrategyPreset(id: DailyLimitStrategyId) {
  return DAILY_LIMIT_STRATEGY_PRESETS.find((s) => s.id === id)!;
}

function limitIncreasePercentLabel(percent: LimitIncreasePercent) {
  return `Увеличивать лимит на ${percent}%`;
}

function LimitIncreasePercentDropdown({
  value,
  onChange,
}: {
  value: LimitIncreasePercent;
  onChange: (value: LimitIncreasePercent) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={ref} className="relative min-w-0 w-full max-w-full">
      <button
        type="button"
        id="limit-increase-percent"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm font-medium text-gray-900 outline-none transition-colors hover:border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="min-w-0 truncate">{limitIncreasePercentLabel(value)}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {isOpen ? (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
          role="listbox"
          aria-labelledby="limit-increase-percent"
        >
          {LIMIT_INCREASE_PERCENT_OPTIONS.map((percent) => (
            <button
              key={percent}
              type="button"
              role="option"
              aria-selected={value === percent}
              className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${
                value === percent ? 'bg-[#F6F2FF] font-medium text-gray-900' : 'text-gray-700'
              }`}
              onClick={() => {
                onChange(percent);
                setIsOpen(false);
              }}
            >
              {limitIncreasePercentLabel(percent)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const conditionRuleValueInputClass =
  'w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-3 pr-7 text-sm font-medium tabular-nums text-gray-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500';

function ConditionRuleFieldDropdown<T extends string>({
  value,
  options,
  placeholder,
  disabled = false,
  onChange,
  ariaLabel,
}: {
  value: T | '';
  options: { value: T; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value);
  const displayLabel = selectedOption?.label ?? placeholder ?? '—';

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={ref} className="relative min-w-0 w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setIsOpen((open) => !open);
        }}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 py-2.5 pl-3 pr-2.5 text-left text-sm font-medium outline-none transition-colors ${
          disabled
            ? 'cursor-not-allowed bg-gray-50 text-gray-400'
            : 'bg-white text-gray-900 hover:border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
      >
        <span
          className={`min-w-0 truncate ${!selectedOption && placeholder ? 'text-gray-400' : ''}`}
        >
          {displayLabel}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''} ${disabled ? 'opacity-50' : ''}`}
          aria-hidden
        />
      </button>
      {isOpen && !disabled ? (
        <div
          className="absolute left-0 right-0 top-full z-[60] mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
          role="listbox"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={value === option.value}
              className={`w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${
                value === option.value
                  ? 'bg-[#F6F2FF] font-medium text-gray-900'
                  : 'text-gray-700'
              }`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const DAILY_LIMIT_RULE_TEMPLATE_STORAGE_KEY = 'massCreation.dailyLimitIncreaseRuleTemplates';

type DailyLimitRuleTemplateConditionDef = {
  metric: DailyLimitConditionMetric;
  compare: DailyLimitConditionCompare;
  threshold: number;
};

type DailyLimitRuleTemplateDef = {
  id: string;
  label: string;
  limitIncreasePercent: number;
  conditions: DailyLimitRuleTemplateConditionDef[];
};

function formatDailyLimitRuleTemplateConditionsSummary(
  defs: DailyLimitRuleTemplateConditionDef[],
): string {
  return defs
    .map((def) => formatDailyLimitConditionPhrase(def.metric, def.compare, def.threshold))
    .join(', ');
}

const DAILY_LIMIT_INCREASE_RULE_BUILTIN_PRESETS: DailyLimitRuleTemplateDef[] = [
  {
    id: 'raise-from-drr',
    label: 'Стратегия от ДРР',
    limitIncreasePercent: 50,
    conditions: [
      { metric: 'drr', compare: 'below', threshold: 5 },
      { metric: 'cr', compare: 'above', threshold: 10 },
    ],
  },
  {
    id: 'raise-from-profit',
    label: 'Стратегия от прибыли',
    limitIncreasePercent: 25,
    conditions: [{ metric: 'cr', compare: 'above', threshold: RECOMMENDED_CR_THRESHOLD_PERCENT }],
  },
];

function loadUserDailyLimitRuleTemplates(): DailyLimitRuleTemplateDef[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(DAILY_LIMIT_RULE_TEMPLATE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DailyLimitRuleTemplateDef[];
    return Array.isArray(parsed) ? parsed.filter((t) => t?.id && t?.label) : [];
  } catch {
    return [];
  }
}

function persistUserDailyLimitRuleTemplate(template: DailyLimitRuleTemplateDef) {
  const existing = loadUserDailyLimitRuleTemplates();
  const next = [...existing.filter((t) => t.id !== template.id), template];
  window.localStorage.setItem(DAILY_LIMIT_RULE_TEMPLATE_STORAGE_KEY, JSON.stringify(next));
}

function saveDailyLimitIncreaseRuleAsUserTemplate(
  rule: DailyLimitIncreaseRule,
): DailyLimitRuleTemplateDef | null {
  if (!isDailyLimitIncreaseRuleValid(rule)) return null;
  const label = formatDailyLimitIncreaseConditionsSummary(rule.conditions ?? []);
  if (!label) return null;
  const conditions = (rule.conditions ?? []).filter(
    (c): c is DailyLimitIncreaseCondition & { metric: DailyLimitConditionMetric } =>
      c.metric != null,
  );
  const template: DailyLimitRuleTemplateDef = {
    id: `user-${Date.now()}`,
    label,
    limitIncreasePercent: rule.limitIncreasePercent,
    conditions: conditions.map((c) => ({
      metric: c.metric,
      compare: resolveConditionCompare(c),
      threshold: c.threshold,
    })),
  };
  persistUserDailyLimitRuleTemplate(template);
  return template;
}

function buildConditionsFromTemplateDefs(
  defs: DailyLimitRuleTemplateConditionDef[],
): DailyLimitIncreaseCondition[] {
  return defs.map((def) => ({
    id: newDailyLimitIncreaseConditionId(),
    metric: def.metric,
    compare: def.compare,
    threshold: def.threshold,
  }));
}

function findDailyLimitRuleTemplate(
  presetKey: string,
  userTemplates: DailyLimitRuleTemplateDef[],
): DailyLimitRuleTemplateDef | undefined {
  if (presetKey === 'custom') return undefined;
  if (presetKey.startsWith('user:')) {
    const userId = presetKey.slice('user:'.length);
    return userTemplates.find((t) => t.id === userId);
  }
  return DAILY_LIMIT_INCREASE_RULE_BUILTIN_PRESETS.find((t) => t.id === presetKey);
}

function ruleFromTemplatePreset(
  rule: DailyLimitIncreaseRule,
  presetKey: string,
  userTemplates: DailyLimitRuleTemplateDef[],
): DailyLimitIncreaseRule {
  const template = findDailyLimitRuleTemplate(presetKey, userTemplates);
  if (!template) {
    return { ...rule, presetId: 'custom' };
  }
  const conditions = buildConditionsFromTemplateDefs(template.conditions);
  const drrCondition = conditions.find(
    (c) => c.metric === 'drr' && resolveConditionCompare(c) === 'below',
  );
  const crCondition = conditions.find(
    (c) => c.metric === 'cr' && resolveConditionCompare(c) === 'above',
  );
  const drrAny = conditions.find((c) => c.metric === 'drr');
  const crAny = conditions.find((c) => c.metric === 'cr');
  return {
    ...rule,
    presetId: presetKey,
    limitIncreasePercent: template.limitIncreasePercent,
    conditions,
    drrBelowPercent: (drrCondition ?? drrAny)?.threshold ?? 0,
    crAbovePercent: (crCondition ?? crAny)?.threshold ?? 0,
  };
}

function markRuleAsCustomPreset(rules: DailyLimitIncreaseRule[], ruleId: string) {
  return rules.map((rule) =>
    rule.id === ruleId && rule.presetId !== 'custom' ? { ...rule, presetId: 'custom' } : rule,
  );
}

function createEmptyCustomDailyLimitRule(existingId?: string): DailyLimitIncreaseRule {
  return {
    id: existingId ?? newDailyLimitIncreaseRuleId(),
    enabled: true,
    presetId: 'custom',
    limitIncreasePercent: 20,
    conditions: [],
    drrBelowPercent: 0,
    crAbovePercent: 0,
  };
}

function createDefaultDailyLimitIncreaseRule(): DailyLimitIncreaseRule {
  return createEmptyCustomDailyLimitRule();
}

function dailyLimitRulePresetDisplayLabel(
  presetKey: string,
  userTemplates: DailyLimitRuleTemplateDef[],
  customConditions?: DailyLimitIncreaseCondition[],
): string {
  if (presetKey === 'custom') {
    const summary = formatDailyLimitIncreaseConditionsSummary(customConditions ?? []);
    return summary || 'Шаблон не выбран';
  }
  const template = findDailyLimitRuleTemplate(presetKey, userTemplates);
  if (!template) return 'Шаблон не выбран';
  if (presetKey.startsWith('user:')) {
    return formatDailyLimitRuleTemplateConditionsSummary(template.conditions) || template.label;
  }
  return template.label;
}

function DailyLimitStrategyTemplateDropdown({
  presetKey,
  userTemplates,
  customConditions,
  onSelectPreset,
}: {
  presetKey: string;
  userTemplates: DailyLimitRuleTemplateDef[];
  customConditions?: DailyLimitIncreaseCondition[];
  onSelectPreset: (key: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerLabel = dailyLimitRulePresetDisplayLabel(
    presetKey,
    userTemplates,
    customConditions,
  );
  const isUnsetTemplate = triggerLabel === 'Шаблон не выбран';

  const templateOptions: { key: string; label: string }[] = [
    ...DAILY_LIMIT_INCREASE_RULE_BUILTIN_PRESETS.map((preset) => ({
      key: preset.id,
      label: preset.label,
    })),
    ...userTemplates.map((preset) => ({
      key: `user:${preset.id}`,
      label: formatDailyLimitRuleTemplateConditionsSummary(preset.conditions) || preset.label,
    })),
  ];

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={ref} className="relative min-w-0 w-full">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm outline-none transition-colors hover:border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 ${
          isUnsetTemplate ? 'font-medium text-gray-700' : 'font-semibold text-gray-900'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="min-w-0 truncate">{triggerLabel}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {isOpen ? (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
          role="listbox"
        >
          <div className="py-1">
            <button
              type="button"
              role="option"
              aria-selected={presetKey === 'custom'}
              className={`w-full px-4 py-3 text-left text-sm font-semibold transition-colors hover:bg-gray-50 ${
                presetKey === 'custom' ? 'bg-[#F6F2FF] text-gray-900' : 'text-gray-900'
              }`}
              onClick={() => {
                onSelectPreset('custom');
                setIsOpen(false);
              }}
            >
              Шаблон не выбран
            </button>
            {templateOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                role="option"
                aria-selected={presetKey === option.key}
                className={`w-full px-4 py-3 text-left text-sm font-semibold transition-colors hover:bg-gray-50 ${
                  presetKey === option.key ? 'bg-[#F6F2FF] text-gray-900' : 'text-gray-900'
                }`}
                onClick={() => {
                  onSelectPreset(option.key);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DailyLimitConditionRulesBuilder({
  rules,
  onChange,
  templatesRevision = 0,
}: {
  rules: DailyLimitIncreaseRule[];
  onChange: (rules: DailyLimitIncreaseRule[]) => void;
  templatesRevision?: number;
}) {
  const [userTemplates, setUserTemplates] = useState<DailyLimitRuleTemplateDef[]>(() =>
    loadUserDailyLimitRuleTemplates(),
  );

  const refreshUserTemplates = () => {
    setUserTemplates(loadUserDailyLimitRuleTemplates());
  };

  useEffect(() => {
    refreshUserTemplates();
  }, [templatesRevision]);

  useEffect(() => {
    if (rules.length === 0) {
      onChange([createDefaultDailyLimitIncreaseRule()]);
    }
  }, [rules.length, onChange]);

  const patchRules = (next: DailyLimitIncreaseRule[]) => {
    onChange(next);
  };

  const updateRule = (id: string, patch: Partial<DailyLimitIncreaseRule>) => {
    const touchesPreset =
      patch.limitIncreasePercent !== undefined ||
      patch.conditions !== undefined ||
      patch.drrBelowPercent !== undefined ||
      patch.crAbovePercent !== undefined;
    patchRules(
      rules.map((rule) => {
        if (rule.id !== id) return rule;
        const merged = { ...rule, ...patch };
        if (touchesPreset && patch.presetId === undefined) {
          merged.presetId = 'custom';
        }
        return merged;
      }),
    );
  };

  const removeRule = (id: string) => {
    patchRules(rules.filter((rule) => rule.id !== id));
  };

  const updateCondition = (
    ruleId: string,
    conditionId: string,
    patch: Partial<DailyLimitIncreaseCondition>,
  ) => {
    patchRules(
      markRuleAsCustomPreset(
        rules.map((rule) =>
          rule.id === ruleId
            ? {
                ...rule,
                presetId: 'custom',
                conditions: (rule.conditions ?? []).map((condition) =>
                  condition.id === conditionId ? { ...condition, ...patch } : condition,
                ),
              }
            : rule,
        ),
        ruleId,
      ),
    );
  };

  const removeCondition = (ruleId: string, conditionId: string) => {
    patchRules(
      markRuleAsCustomPreset(
        rules.map((rule) => {
          if (rule.id !== ruleId) return rule;
          return {
            ...rule,
            presetId: 'custom',
            conditions: (rule.conditions ?? []).filter((c) => c.id !== conditionId),
          };
        }),
        ruleId,
      ),
    );
  };

  const addConditionSlot = (ruleId: string) => {
    patchRules(
      markRuleAsCustomPreset(
        rules.map((rule) =>
          rule.id === ruleId
            ? {
                ...rule,
                presetId: 'custom',
                conditions: [
                  ...(rule.conditions ?? []),
                  {
                    id: newDailyLimitIncreaseConditionId(),
                    metric: null,
                    compare: 'below',
                    threshold: 0,
                  },
                ],
              }
            : rule,
        ),
        ruleId,
      ),
    );
  };

  const applyPresetToRule = (ruleId: string, presetKey: string) => {
    if (presetKey === 'custom') {
      patchRules(
        rules.map((rule) =>
          rule.id === ruleId ? createEmptyCustomDailyLimitRule(rule.id) : rule,
        ),
      );
      return;
    }
    patchRules(
      rules.map((rule) =>
        rule.id === ruleId ? ruleFromTemplatePreset(rule, presetKey, userTemplates) : rule,
      ),
    );
  };

  const conditionLogicBadgeClass =
    'inline-flex min-w-[2.75rem] items-center justify-center rounded-md bg-[#F3E8FF] px-2 py-1 text-xs font-semibold text-[#7C3AED]';

  const conditionRuleRowClass = 'flex items-center gap-2';
  const conditionRuleLabelGutterClass = 'flex w-[2.75rem] shrink-0 justify-start';
  const conditionRuleActionGutterClass = 'flex w-8 shrink-0 justify-center';
  const conditionRuleFieldsGridClass =
    'grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_4.25rem] items-center gap-2';

  return (
    <div className="mt-4 min-w-0 max-w-full space-y-4">
      <ul className="space-y-3">
        {rules.map((rule, index) => {
          const conditions = rule.conditions ?? [];
          const usedMetrics = new Set(
            conditions
              .map((c) => c.metric)
              .filter((m): m is DailyLimitConditionMetric => m != null),
          );
          const canAddConditionSlot =
            conditions.length < DAILY_LIMIT_RULE_MAX_CONDITIONS &&
            !conditions.some((c) => c.metric == null);
          const presetSelectValue = rule.presetId ?? 'custom';
          const budgetPercentDraft =
            rule.limitIncreasePercent > 0 ? String(rule.limitIncreasePercent) : '20';

          return (
            <li key={rule.id} className="py-1">
              <div className="flex flex-col gap-3">
                <div className={conditionRuleRowClass}>
                  <div className={conditionRuleLabelGutterClass} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <DailyLimitStrategyTemplateDropdown
                      presetKey={presetSelectValue}
                      userTemplates={userTemplates}
                      customConditions={conditions}
                      onSelectPreset={(key) => applyPresetToRule(rule.id, key)}
                    />
                  </div>
                  <div className={conditionRuleActionGutterClass} aria-hidden />
                </div>

                <div className={conditionRuleRowClass}>
                  <div className={conditionRuleLabelGutterClass} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="flex overflow-hidden rounded-xl border border-gray-200">
                      <div className="flex min-w-0 flex-1 items-center bg-[#F2F2F7] px-4 py-3 text-sm font-medium text-gray-900">
                        Увеличивать бюджет на
                      </div>
                      <div className="relative w-[5.5rem] shrink-0 border-l border-gray-200 bg-white">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={budgetPercentDraft}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, '');
                            if (v === '') {
                              updateRule(rule.id, { limitIncreasePercent: 20 });
                              return;
                            }
                            const parsed = Math.min(100, Math.max(1, parseInt(v, 10)));
                            if (!Number.isNaN(parsed)) {
                              updateRule(rule.id, { limitIncreasePercent: parsed });
                            }
                          }}
                          className="w-full bg-transparent py-3 pl-3 pr-7 text-center text-sm font-medium tabular-nums text-gray-900 outline-none"
                          aria-label={`Процент увеличения бюджета, правило ${index + 1}`}
                        />
                        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={conditionRuleActionGutterClass} aria-hidden />
                </div>

                {conditions.length > 0 ? (
                <div className="space-y-2">
                  {conditions.map((condition, conditionIndex) => {
                    const unit = condition.metric != null ? conditionMetricUnit(condition.metric) : '%';
                    const metricsForSelect = (['drr', 'cr', 'impressions'] as const).filter(
                      (metric) => metric === condition.metric || !usedMetrics.has(metric),
                    );

                    return (
                      <div key={condition.id} className={conditionRuleRowClass}>
                        <div className={conditionRuleLabelGutterClass}>
                          <span className={conditionLogicBadgeClass}>
                            {conditionIndex === 0 ? 'Если' : 'И'}
                          </span>
                        </div>

                        <div className={conditionRuleFieldsGridClass}>
                        <ConditionRuleFieldDropdown
                          value={condition.metric ?? ''}
                          placeholder="Метрика"
                          ariaLabel={`Метрика, правило ${index + 1}`}
                          options={metricsForSelect.map((metric) => ({
                            value: metric,
                            label: conditionMetricLabel(metric),
                          }))}
                          onChange={(metric) => {
                            updateCondition(rule.id, condition.id, {
                              metric,
                              compare: defaultCompareForMetric(metric),
                              threshold: condition.threshold > 0 ? condition.threshold : 0,
                            });
                          }}
                        />

                        <ConditionRuleFieldDropdown
                          value={condition.metric == null ? '' : resolveConditionCompare(condition)}
                          disabled={condition.metric == null}
                          ariaLabel={`Сравнение, правило ${index + 1}`}
                          options={[
                            { value: 'below' as const, label: conditionCompareLabel('below') },
                            { value: 'above' as const, label: conditionCompareLabel('above') },
                          ]}
                          onChange={(compare) =>
                            updateCondition(rule.id, condition.id, { compare })
                          }
                        />

                        <div className="relative min-w-0">
                          <input
                            type="text"
                            inputMode="decimal"
                            disabled={condition.metric == null}
                            value={condition.threshold > 0 ? String(condition.threshold) : ''}
                            placeholder="—"
                            onChange={(e) => {
                              const v = e.target.value.replace(',', '.');
                              if (v === '' || /^\d*\.?\d*$/.test(v)) {
                                const parsed = parseDisplayValue(v);
                                if (v === '' || !Number.isNaN(parsed)) {
                                  updateCondition(rule.id, condition.id, {
                                    threshold: v === '' ? 0 : parsed,
                                  });
                                }
                              }
                            }}
                            className={`${conditionRuleValueInputClass} disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400`}
                            aria-label={`Порог, правило ${index + 1}`}
                          />
                          {unit ? (
                            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                              {unit}
                            </span>
                          ) : null}
                        </div>
                        </div>

                        <div className={conditionRuleActionGutterClass}>
                        <button
                          type="button"
                          onClick={() => removeCondition(rule.id, condition.id)}
                          className="flex h-8 w-8 items-center justify-center text-gray-400 transition-colors hover:text-gray-600"
                          aria-label="Убрать условие"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                ) : null}

                {canAddConditionSlot ? (
                  <div className={conditionRuleRowClass}>
                    <div className={conditionRuleLabelGutterClass} aria-hidden />
                    <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => addConditionSlot(rule.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#F2F2F7] text-gray-800 transition-colors hover:bg-[#e8e8ed]"
                    aria-label={`Добавить условие (${conditions.length}/${DAILY_LIMIT_RULE_MAX_CONDITIONS})`}
                  >
                    <Plus className="h-4 w-4 shrink-0" />
                  </button>
                    </div>
                    <div className={conditionRuleActionGutterClass} aria-hidden />
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export const AdvancedDailyLimitModal: React.FC<{
  embedded?: boolean;
  /** Только блок «Расширенные настройки» (без лимита на день и переноса) */
  advancedSettingsOnly?: boolean;
  /** Только лимит на день и перенос (без расширенных настроек) */
  dailyLimitOnly?: boolean;
  /** Конструктор условий вместо одного процента и двух порогов */
  conditionRuleBuilder?: boolean;
  isOpen: boolean;
  onClose: () => void;
  isDailyLimitEnabled: boolean;
  onEnableDailyLimit: () => void;
  onDisableDailyLimit: () => void;
  dailyLimitValue: string;
  onDailyLimitValueChange: (value: string) => void;
  onDailyLimitCommit: (parsed: number, options?: { silent?: boolean }) => void;
  savedDailyLimit: string;
  isCarryoverEnabled: boolean;
  onCarryoverChange: (enabled: boolean) => void;
  campaignBudget: number;
  initialSettings: AdvancedDailyLimitSettings;
  onApply: (settings: AdvancedDailyLimitSettings, options?: { reset?: boolean }) => void;
  referenceCpcBidRub: number;
  targetAvgPosition?: number;
  onAfterResetSettings?: () => void;
  /** Автопополнение бюджета при срабатывании правил (конструктор условий) */
  autoRefillOnRulesTrigger?: boolean;
  onAutoRefillOnRulesTriggerChange?: (enabled: boolean) => void;
}> = ({
  embedded = false,
  advancedSettingsOnly = false,
  dailyLimitOnly = false,
  conditionRuleBuilder = false,
  isOpen,
  onClose,
  dailyLimitValue,
  onDailyLimitValueChange,
  onDailyLimitCommit,
  savedDailyLimit,
  isCarryoverEnabled,
  onCarryoverChange,
  campaignBudget,
  initialSettings,
  onApply,
  referenceCpcBidRub,
  targetAvgPosition,
  onAfterResetSettings,
  autoRefillOnRulesTrigger = true,
  onAutoRefillOnRulesTriggerChange,
}) => {
  const [strategyId, setStrategyId] = useState<DailyLimitStrategyId | null>(initialSettings.strategyId);
  const [strategyGroupLabel, setStrategyGroupLabel] = useState(initialSettings.strategyGroupLabel);
  const [autoIncreaseEnabled, setAutoIncreaseEnabled] = useState(() =>
    dailyLimitOnly && conditionRuleBuilder
      ? isDynamicDailyLimitConfigured(initialSettings)
      : conditionRuleBuilder
        ? true
        : initialSettings.autoIncreaseEnabled,
  );
  const [thresholdByMetric, setThresholdByMetric] = useState<Record<'drr' | 'cr', string>>(() => {
    const resolved = resolveAutoIncreaseThresholds(initialSettings);
    return {
      drr: String(resolved.drr),
      cr: String(resolved.cr),
    };
  });
  const [limitIncreasePercent, setLimitIncreasePercent] = useState<LimitIncreasePercent>(
    initialSettings.limitIncreasePercent ?? 25,
  );
  const [metricEnabled, setMetricEnabled] = useState(() =>
    resolveAutoIncreaseMetricEnabled(initialSettings),
  );
  const [increaseRules, setIncreaseRules] = useState<DailyLimitIncreaseRule[]>(() =>
    initialSettings.increaseRules?.length
      ? initialSettings.increaseRules.map((rule) => migrateLegacyRuleConditions({ ...rule }))
      : conditionRuleBuilder
        ? [createDefaultDailyLimitIncreaseRule()]
        : [],
  );
  const [ruleTemplatesRevision, setRuleTemplatesRevision] = useState(0);
  const [autoRefillOnRules, setAutoRefillOnRules] = useState(true);

  useEffect(() => {
    if (!isOpen || !conditionRuleBuilder) return;
    setAutoRefillOnRules(true);
  }, [isOpen, conditionRuleBuilder]);

  useEffect(() => {
    if (!isOpen) return;
    setStrategyId(initialSettings.strategyId);
    setStrategyGroupLabel(initialSettings.strategyGroupLabel);
    const resolved = resolveAutoIncreaseThresholds(initialSettings);
    setThresholdByMetric({
      drr: String(resolved.drr),
      cr: String(resolved.cr),
    });
    setLimitIncreasePercent(initialSettings.limitIncreasePercent ?? 25);
    if (initialSettings.increaseRules?.length) {
      setIncreaseRules(
        initialSettings.increaseRules.map((rule) => migrateLegacyRuleConditions({ ...rule })),
      );
    } else if (conditionRuleBuilder) {
      setIncreaseRules([createDefaultDailyLimitIncreaseRule()]);
    }
    if (advancedSettingsOnly) {
      setAutoIncreaseEnabled(true);
      const metrics = resolveAutoIncreaseMetricEnabled(initialSettings);
      setMetricEnabled(
        metrics.drr || metrics.cr ? metrics : { drr: true, cr: false },
      );
    } else {
      setAutoIncreaseEnabled(
        dailyLimitOnly && conditionRuleBuilder
          ? isDynamicDailyLimitConfigured(initialSettings)
          : conditionRuleBuilder
            ? true
            : initialSettings.autoIncreaseEnabled,
      );
      setMetricEnabled(resolveAutoIncreaseMetricEnabled(initialSettings));
    }
  }, [isOpen, initialSettings, advancedSettingsOnly, conditionRuleBuilder, dailyLimitOnly]);

  useEffect(() => {
    if (!isOpen || advancedSettingsOnly) return;
    if (dailyLimitValue.trim() === '') {
      onDailyLimitValueChange(String(DAILY_LIMIT_ABSOLUTE_MIN));
    }
  }, [isOpen, advancedSettingsOnly, dailyLimitOnly]);

  if (!isOpen) return null;

  const parsedDrrThreshold = parseDisplayValue(thresholdByMetric.drr.replace(',', '.'));
  const parsedCrThreshold = parseDisplayValue(thresholdByMetric.cr.replace(',', '.'));
  const limitRubSource = advancedSettingsOnly
    ? savedDailyLimit || dailyLimitValue
    : dailyLimitValue;
  const parsedDailyLimit = parseDisplayValue(limitRubSource.replace(',', '.'));
  const drrThresholdValid = isAutoIncreaseThresholdValid(parsedDrrThreshold);
  const crThresholdValid = isAutoIncreaseThresholdValid(parsedCrThreshold);
  const anyAutoIncreaseMetricEnabled = metricEnabled.drr || metricEnabled.cr;
  const autoIncreaseMetricsValid = conditionRuleBuilder
    ? areDailyLimitIncreaseRulesValid(increaseRules)
    : anyAutoIncreaseMetricEnabled &&
      (!metricEnabled.drr || drrThresholdValid) &&
      (!metricEnabled.cr || crThresholdValid);
  const dailyLimitValid =
    Number.isFinite(parsedDailyLimit) &&
    parsedDailyLimit >= DAILY_LIMIT_ABSOLUTE_MIN &&
    parsedDailyLimit <= campaignBudget;
  const advancedAutoIncreaseOk = conditionRuleBuilder
    ? dailyLimitOnly
      ? !autoIncreaseEnabled || autoIncreaseMetricsValid
      : autoIncreaseMetricsValid
    : !autoIncreaseEnabled || autoIncreaseMetricsValid;
  const spendRulesIncomplete =
    conditionRuleBuilder &&
    autoIncreaseEnabled &&
    increaseRules.some(
      (r) =>
        r.enabled &&
        (r.conditions?.length ?? 0) > 0 &&
        !isDailyLimitIncreaseRuleValid(r),
    );
  const canSave = dailyLimitOnly
    ? dailyLimitValid && !spendRulesIncomplete
    : advancedSettingsOnly
      ? advancedAutoIncreaseOk
      : dailyLimitValid && advancedAutoIncreaseOk;
  const primaryIncreaseRule = increaseRules[0];
  const canSaveRuleTemplate =
    conditionRuleBuilder &&
    autoIncreaseEnabled &&
    primaryIncreaseRule != null &&
    isDailyLimitIncreaseRuleValid(primaryIncreaseRule);

  const handleSaveRuleTemplate = () => {
    if (!primaryIncreaseRule) return;
    const template = saveDailyLimitIncreaseRuleAsUserTemplate(primaryIncreaseRule);
    if (!template) return;
    setIncreaseRules(
      increaseRules.map((rule) =>
        rule.id === primaryIncreaseRule.id
          ? { ...rule, presetId: `user:${template.id}` }
          : rule,
      ),
    );
    setRuleTemplatesRevision((revision) => revision + 1);
  };

  const handleSave = () => {
    if (!canSave) return;

    const applyAdvancedSettingsPayload = (options?: { enableSpendRulesOnlyWhenValid?: boolean }) => {
      const hasValidSpendRules = increaseRules.some(
        (r) => r.enabled && isDailyLimitIncreaseRuleValid(r),
      );
      const effectiveAutoIncreaseEnabled = conditionRuleBuilder
        ? options?.enableSpendRulesOnlyWhenValid
          ? autoIncreaseEnabled && hasValidSpendRules
          : dailyLimitOnly
            ? autoIncreaseEnabled
            : true
        : autoIncreaseEnabled;
      const increaseAmountRub = effectiveAutoIncreaseEnabled
        ? Math.max(1, Math.round(parsedDailyLimit * (limitIncreasePercent / 100)))
        : initialSettings.increaseAmountRub;
      const firstActiveRule = increaseRules.find((r) => r.enabled);
      onApply({
        strategyId,
        strategyGroupLabel: strategyGroupLabel.trim(),
        autoIncreaseEnabled: effectiveAutoIncreaseEnabled,
        metric: metricEnabled.cr && !metricEnabled.drr ? 'cr' : 'drr',
        thresholdPercent: metricEnabled.drr
          ? drrThresholdValid
            ? parsedDrrThreshold
            : DEFAULT_AUTO_INCREASE_THRESHOLD.drr
          : metricEnabled.cr && crThresholdValid
            ? parsedCrThreshold
            : DEFAULT_AUTO_INCREASE_THRESHOLD.cr,
        drrThresholdPercent: drrThresholdValid ? parsedDrrThreshold : DEFAULT_AUTO_INCREASE_THRESHOLD.drr,
        crThresholdPercent: crThresholdValid ? parsedCrThreshold : DEFAULT_AUTO_INCREASE_THRESHOLD.cr,
        drrMetricEnabled: conditionRuleBuilder ? true : metricEnabled.drr,
        crMetricEnabled: conditionRuleBuilder ? true : metricEnabled.cr,
        increaseAmountRub:
          conditionRuleBuilder && firstActiveRule
            ? Math.max(
                1,
                Math.round(parsedDailyLimit * (firstActiveRule.limitIncreasePercent / 100)),
              )
            : increaseAmountRub,
        limitIncreasePercent:
          conditionRuleBuilder && firstActiveRule
            ? firstActiveRule.limitIncreasePercent
            : limitIncreasePercent,
        ...(conditionRuleBuilder
          ? {
              increaseRules: increaseRules.map((rule) => {
                const conditions = rule.conditions ?? [];
                const drrCondition = conditions.find(
                  (c) => c.metric === 'drr' && resolveConditionCompare(c) === 'below',
                );
                const crCondition = conditions.find(
                  (c) => c.metric === 'cr' && resolveConditionCompare(c) === 'above',
                );
                const drrAny = conditions.find((c) => c.metric === 'drr');
                const crAny = conditions.find((c) => c.metric === 'cr');
                return {
                  ...rule,
                  conditions,
                  drrBelowPercent: (drrCondition ?? drrAny)?.threshold ?? 0,
                  crAbovePercent: (crCondition ?? crAny)?.threshold ?? 0,
                };
              }),
            }
          : {}),
      });
    };

    if (dailyLimitOnly) {
      if (parsedDailyLimit > campaignBudget) {
        onDailyLimitCommit(parsedDailyLimit);
        return;
      }
      onDailyLimitCommit(parsedDailyLimit);
      if (conditionRuleBuilder) {
        applyAdvancedSettingsPayload({ enableSpendRulesOnlyWhenValid: true });
        onAutoRefillOnRulesTriggerChange?.(autoRefillOnRules);
      } else {
        onApply(initialSettings);
      }
      return;
    }
    if (!advancedSettingsOnly) {
      if (parsedDailyLimit > campaignBudget) {
        onDailyLimitCommit(parsedDailyLimit);
        return;
      }
      onDailyLimitCommit(parsedDailyLimit, { silent: true });
    }
    applyAdvancedSettingsPayload();
    if (conditionRuleBuilder) {
      onAutoRefillOnRulesTriggerChange?.(autoRefillOnRules);
    }
  };

  const applySettingsToForm = (settings: AdvancedDailyLimitSettings) => {
    setStrategyId(settings.strategyId);
    setStrategyGroupLabel(settings.strategyGroupLabel);
    const resolved = resolveAutoIncreaseThresholds(settings);
    setThresholdByMetric({
      drr: String(resolved.drr),
      cr: String(resolved.cr),
    });
    setLimitIncreasePercent(settings.limitIncreasePercent ?? 25);
    setIncreaseRules(
      settings.increaseRules?.length
        ? settings.increaseRules.map((rule) => migrateLegacyRuleConditions({ ...rule }))
        : conditionRuleBuilder
          ? [createDefaultDailyLimitIncreaseRule()]
          : [],
    );
    if (advancedSettingsOnly) {
      setAutoIncreaseEnabled(settings.autoIncreaseEnabled);
      const metrics = resolveAutoIncreaseMetricEnabled(settings);
      setMetricEnabled(metrics);
    } else {
      setAutoIncreaseEnabled(settings.autoIncreaseEnabled);
      setMetricEnabled(resolveAutoIncreaseMetricEnabled(settings));
    }
  };

  const handleResetAdvancedSettings = () => {
    const defaults = createDefaultAdvancedDailyLimitSettings();
    applySettingsToForm(defaults);
    onCarryoverChange(false);
    onApply(defaults, { reset: true });
    onAfterResetSettings?.();
  };

  const handleDisableSpendRules = () => {
    handleResetAdvancedSettings();
    onClose();
  };

  const body = (
    <>
      <div className={`min-w-0 flex-1 overflow-x-hidden overflow-y-auto ${embedded ? 'px-6 pb-4 sm:px-8' : 'p-6 sm:p-8'}`}>
        {!embedded && dailyLimitOnly ? (
          <>
            <h2 id="daily-limit-setup-title" className="text-xl font-bold leading-snug text-gray-900">
              Дневной лимит
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              {conditionRuleBuilder
                ? 'Задайте сумму на день и при необходимости правила автоматического увеличения лимита'
                : 'Задайте сумму на день — распределим её равномерно в течение суток'}
            </p>
          </>
        ) : !embedded && !dailyLimitOnly ? (
          <>
            <div className="flex items-center gap-3">
              {conditionRuleBuilder ? (
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-sm shadow-fuchsia-200/80"
                  aria-hidden
                >
                  <Sparkles className="h-5 w-5" />
                </div>
              ) : null}
              <h2 id="advanced-daily-limit-title" className="mb-0 text-xl font-bold leading-snug text-gray-900">
                {conditionRuleBuilder
                  ? 'Настройка правил'
                  : 'Расширенные настройки дневного лимита'}
              </h2>
            </div>
            {!conditionRuleBuilder ? (
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                {advancedSettingsOnly
                  ? 'Настройте автоматическое увеличение лимита по метрикам эффективности.'
                  : 'Выберите готовую стратегию — её можно назначить сразу на много кампаний. Параметры подстраиваются под средние показатели эффективности лидеров в вашей категории.'}
              </p>
            ) : null}
          </>
        ) : null}

              {!advancedSettingsOnly ? (
                <div className="rounded-2xl border border-gray-100 bg-white p-5">
                  <h3 className="text-base font-semibold text-gray-900">Лимит на день</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Распределяем сумму равномерно в течение дня
                  </p>
                  <div className="relative mt-4">
                    <input
                      type="text"
                      value={dailyLimitValue ? formatForDisplay(dailyLimitValue) : ''}
                      onChange={(e) => {
                        const parsed = parseDisplayValue(e.target.value);
                        if (!isNaN(parsed)) onDailyLimitValueChange(String(parsed));
                        else if (e.target.value === '') onDailyLimitValueChange('');
                      }}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-10 text-base font-medium text-gray-900 outline-none transition-colors focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                      placeholder={`Задайте от ${formatForDisplay(DAILY_LIMIT_ABSOLUTE_MIN)}`}
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      ₽
                    </span>
                  </div>
                  <label className="mt-4 flex cursor-pointer items-center gap-2">
                    <Checkbox
                      checked={isCarryoverEnabled}
                      onChange={(e) => onCarryoverChange(e.target.checked)}
                    />
                    <span className="text-sm text-gray-700">
                      Переносить неистраченные деньги
                    </span>
                  </label>
                </div>
              ) : null}

              {conditionRuleBuilder || !dailyLimitOnly ? (
              <div
                className={
                  conditionRuleBuilder
                    ? dailyLimitOnly
                      ? 'mt-6'
                      : 'mt-4'
                    : 'mt-4 rounded-2xl border border-gray-100 bg-white p-5'
                }
              >
                {dailyLimitOnly && conditionRuleBuilder ? (
                  <div className="mb-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-base font-semibold text-gray-900">Автоматизация трат</h3>
                      <ToggleSwitch
                        checked={autoIncreaseEnabled}
                        onChange={setAutoIncreaseEnabled}
                      />
                    </div>
                  </div>
                ) : null}
                {!conditionRuleBuilder && !dailyLimitOnly ? (
                <div className="flex items-center justify-between gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-sm shadow-fuchsia-200/80"
                    aria-hidden
                  >
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <ToggleSwitch checked={autoIncreaseEnabled} onChange={setAutoIncreaseEnabled} />
                </div>
                ) : null}

                {(conditionRuleBuilder
                  ? dailyLimitOnly
                    ? autoIncreaseEnabled
                    : true
                  : autoIncreaseEnabled) ? (
                conditionRuleBuilder ? (
                  <>
                    <DailyLimitConditionRulesBuilder
                      rules={increaseRules}
                      onChange={setIncreaseRules}
                      templatesRevision={ruleTemplatesRevision}
                    />
                    {canSaveRuleTemplate ? (
                      <button
                        type="button"
                        onClick={handleSaveRuleTemplate}
                        className="mt-4 rounded-xl px-2 py-2.5 text-left text-sm font-medium text-[#6C5CE7] hover:text-[#5B4BFF]"
                      >
                        Сохранить шаблон
                      </button>
                    ) : null}
                  </>
                ) : (
                <div className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="limit-increase-percent" className="sr-only">
                      Увеличивать лимит
                    </label>
                    <LimitIncreasePercentDropdown
                      value={limitIncreasePercent}
                      onChange={setLimitIncreasePercent}
                    />
                  </div>

                  <div className="space-y-4">
                      {(['drr', 'cr'] as const).map((metricKey) => {
                        const enabled = metricEnabled[metricKey];
                        const draft = thresholdByMetric[metricKey];
                        const parsed = parseDisplayValue(draft.replace(',', '.'));
                        const valid =
                          !enabled || isAutoIncreaseThresholdValid(parsed) || draft === '';
                        const inputId =
                          metricKey === 'drr' ? 'metric-threshold-drr' : 'metric-threshold-cr';
                        const recommendedPercent =
                          metricKey === 'drr'
                            ? RECOMMENDED_DRR_THRESHOLD_PERCENT
                            : RECOMMENDED_CR_THRESHOLD_PERCENT;
                        return (
                          <div key={metricKey} className="min-w-0">
                            <div className="flex min-w-0 items-center justify-between gap-3">
                              <label
                                className="min-w-0 flex-1 text-sm font-medium text-gray-900"
                                htmlFor={inputId}
                              >
                                {autoIncreaseThresholdLabel(metricKey)}
                              </label>
                              <div className="shrink-0">
                                <ToggleSwitch
                                  checked={enabled}
                                  onChange={(checked) =>
                                    setMetricEnabled((prev) => ({ ...prev, [metricKey]: checked }))
                                  }
                                />
                              </div>
                            </div>
                            {enabled ? (
                              <>
                                <div className="relative mt-2 min-w-0">
                                  <input
                                    id={inputId}
                                    type="text"
                                    inputMode="decimal"
                                    value={draft}
                                    onChange={(e) => {
                                      const v = e.target.value.replace(',', '.');
                                      if (v === '' || /^\d*\.?\d*$/.test(v)) {
                                        setThresholdByMetric((prev) => ({ ...prev, [metricKey]: v }));
                                      }
                                    }}
                                    className={`w-full rounded-xl border px-4 py-3 pr-10 text-base outline-none ${
                                      valid
                                        ? 'border-gray-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                                        : 'border-red-300'
                                    }`}
                                  />
                                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    %
                                  </span>
                                </div>
                                <div className="mt-2 min-w-0 rounded-xl bg-[#F6F2FF] px-3 py-2.5 text-xs leading-relaxed break-words text-gray-600">
                                  <span className="font-medium text-gray-900">Рекомендуем </span>
                                  {recommendedPercent}% — порог по медиане эффективных кампаний в категории
                                </div>
                              </>
                            ) : null}
                          </div>
                        );
                      })}
                  </div>
                </div>
                )
                ) : null}
              </div>
              ) : null}
            </div>

            {conditionRuleBuilder ? (
              <div className="shrink-0 px-6 pb-4 sm:px-8">
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#F6F2FF] px-4 py-3">
                  <p className="min-w-0 flex-1 text-sm leading-snug text-gray-800">
                    Автопополнять бюджет до суммы дневного лимита, если на кампании окажется меньше
                  </p>
                  <ToggleSwitch
                    checked={autoRefillOnRules}
                    onChange={(checked) => {
                      setAutoRefillOnRules(checked);
                      onAutoRefillOnRulesTriggerChange?.(checked);
                    }}
                  />
                </div>
              </div>
            ) : null}

            <div className="flex shrink-0 flex-col gap-3 border-t border-gray-100 bg-gray-50/60 px-6 py-4 sm:px-8">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                {conditionRuleBuilder ? (
                  <button
                    type="button"
                    onClick={handleDisableSpendRules}
                    className="rounded-xl px-2 py-2.5 text-left text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 sm:-ml-2"
                  >
                    Отключить
                  </button>
                ) : !dailyLimitOnly ? (
                  <button
                    type="button"
                    onClick={handleResetAdvancedSettings}
                    className="rounded-xl px-2 py-2.5 text-left text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 sm:-ml-2"
                  >
                    Сбросить настройки
                  </button>
                ) : (
                  <span className="hidden sm:block" aria-hidden />
                )}
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
                  disabled={!canSave}
                  onClick={handleSave}
                  className="rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  Сохранить
                </button>
                </div>
              </div>
            </div>
    </>
  );

  if (embedded) {
    return <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{body}</div>;
  }

  return (
    <div className="fixed inset-0 z-[110] bg-black/50" onClick={onClose} role="presentation">
      <div className="flex h-full w-full justify-end" onClick={onClose}>
        <div className="flex h-full max-h-full min-w-0 items-stretch gap-2" onClick={(e) => e.stopPropagation()}>
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
            className="flex h-full w-[560px] max-w-[calc(100vw-3rem)] shrink-0 flex-col overflow-hidden bg-white shadow-2xl animate-in slide-in-from-right duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby={
              dailyLimitOnly
                ? 'daily-limit-setup-title'
                : 'advanced-daily-limit-title'
            }
            aria-label={
              advancedSettingsOnly
                ? 'Расширенные настройки'
                : dailyLimitOnly
                  ? 'Дневной лимит'
                  : undefined
            }
          >
            {body}
          </div>
        </div>
      </div>
    </div>
  );
};

