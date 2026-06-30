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
import { CampaignRepeatPerformanceBlock } from './CampaignRepeatPerformanceBlock';
import { SimilarDemandProductsBlock } from './SimilarDemandProductsBlock';
import { useProfile, type RepeatLaunchPreset } from './ProfileContext';
import {
  minDailyLimitForMaxBid,
  maxBidRubForDailyLimit,
  CPC_MAX_BID_RUB,
} from '../utils/cpcDailyLimitBid';

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
}: {
  value: string;
  trend: { value: string; direction: StatTrendDirection; positiveIsGood?: boolean };
}) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline gap-2">
      <p className="text-2xl font-bold tabular-nums tracking-tight text-gray-900">{value}</p>
      <StatTrendBadge {...trend} />
    </div>
  );
}

function StatSecondaryMetric({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend: { value: string; direction: StatTrendDirection; positiveIsGood?: boolean };
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 flex flex-wrap items-baseline gap-1.5 text-sm font-semibold tabular-nums text-gray-900">
        <span>{value}</span>
        <StatTrendBadge {...trend} />
      </p>
    </div>
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
  const [isStatsChartEnabled, setIsStatsChartEnabled] = useState(false);
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
  const [bidRaisesDailyLimitModal, setBidRaisesDailyLimitModal] = useState<{
    productKey: string;
    zone: 'search' | 'recommendations';
    attemptedBid: number;
    currentDailyLimit: number;
    newDailyLimit: number;
  } | null>(null);
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

  const requiredMinDailyLimit = useMemo(
    () => minDailyLimitForMaxBid(maxSavedProductBidRub),
    [maxSavedProductBidRub],
  );

  useEffect(() => {
    if (!onUpdateData || maxSavedProductBidRub <= 0) return;
    onUpdateData({ maxCpcBidRub: maxSavedProductBidRub });
  }, [maxSavedProductBidRub, onUpdateData]);

  const savedDailyLimitRub = useMemo(() => {
    const parsed = parseDisplayValue(savedDailyLimit);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [savedDailyLimit]);

  const syncDailyLimitAfterMaxBidChange = useCallback(
    (maxBidRub: number) => {
      if (!isDailyLimitEnabled) return;
      const newMinLimit = minDailyLimitForMaxBid(maxBidRub);
      // Лимит, заданный селлером вручную или после повышения ставки, не уменьшаем при снижении ставки
      if (newMinLimit <= savedDailyLimitRub) return;
      if (newMinLimit > campaignBudget) return;
      const limitStr = String(newMinLimit);
      setSavedDailyLimit(limitStr);
      setDailyLimitValue(limitStr);
      if (onUpdateData) {
        onUpdateData({ dailyLimit: newMinLimit, scheduledDailyLimit: null });
      }
    },
    [isDailyLimitEnabled, savedDailyLimitRub, campaignBudget, onUpdateData],
  );

  const applyBidWithDailyLimit = useCallback(
    (productKey: string, zone: 'search' | 'recommendations', bid: number, newDailyLimit: number) => {
      if (newDailyLimit > campaignBudget) {
        setBidLimitBudgetConflictModal({
          kind: 'productBid',
          productKey,
          zone,
          attemptedBid: bid,
          newDailyLimit,
          shortfall: newDailyLimit - campaignBudget,
        });
        return;
      }
      const applyZoneBid = (setter: React.Dispatch<React.SetStateAction<Record<string, ProductBidEntry>>>) => {
        setter((prev) => ({
          ...prev,
          [productKey]: { draft: String(bid), saved: String(bid) },
        }));
      };
      if (zone === 'search') applyZoneBid(setProductSearchBids);
      else applyZoneBid(setProductRecommendationsBids);

      const limitStr = String(newDailyLimit);
      setSavedDailyLimit(limitStr);
      setDailyLimitValue(limitStr);
      setDailyLimitBudgetShortfall(null);
      if (onUpdateData) {
        onUpdateData({ dailyLimit: newDailyLimit, scheduledDailyLimit: null });
      }
      setToastMessage('Ставка изменена');
      setToastIsError(false);
      setShowToast(true);
    },
    [campaignBudget, onUpdateData],
  );

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

      if (isDailyLimitEnabled && savedDailyLimitRub > 0) {
        const newDailyLimit = minDailyLimitForMaxBid(maxBid);
        if (newDailyLimit > savedDailyLimitRub) {
          const setter = zone === 'search' ? setProductSearchBids : setProductRecommendationsBids;
          setter((prev) => ({
            ...prev,
            [productKey]: { ...entry, draft: entry.saved },
          }));
          if (newDailyLimit > campaignBudget) {
            setBidLimitBudgetConflictModal({
              kind: 'productBid',
              productKey,
              zone,
              attemptedBid: parsed,
              newDailyLimit,
              shortfall: newDailyLimit - campaignBudget,
            });
            return;
          }
          setBidRaisesDailyLimitModal({
            productKey,
            zone,
            attemptedBid: parsed,
            currentDailyLimit: savedDailyLimitRub,
            newDailyLimit,
          });
          return;
        }
      }

      const setter = zone === 'search' ? setProductSearchBids : setProductRecommendationsBids;
      setter((prev) => ({
        ...prev,
        [productKey]: { draft: bidStr, saved: bidStr },
      }));
      syncDailyLimitAfterMaxBidChange(maxBid);
      setToastMessage('Ставка изменена');
      setToastIsError(false);
      setShowToast(true);
    },
    [
      productKey,
      productSearchBids,
      productRecommendationsBids,
      isDailyLimitEnabled,
      savedDailyLimitRub,
      syncDailyLimitAfterMaxBidChange,
      isBidChasingEnabled,
      bidChasingMaxBid,
      campaignBudget,
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
    const minLimit = requiredMinDailyLimit;
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
  }, [requiredMinDailyLimit, campaignBudget, onUpdateData]);

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
      parsedSaved >= requiredMinDailyLimit
        ? parsedSaved
        : parsedInput >= requiredMinDailyLimit
          ? parsedInput
          : requiredMinDailyLimit;
    const spent = dailyLimitExhausted ? total : 0;
    const progress = total > 0 ? Math.min(100, (spent / total) * 100) : 0;
    return { total, spent, progress };
  }, [isDailyLimitEnabled, savedDailyLimit, dailyLimitValue, dailyLimitExhausted, requiredMinDailyLimit]);

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
                      if (isNaN(parsed) || parsed < requiredMinDailyLimit) {
                        setDailyLimitValue(savedDailyLimit || '');
                        setToastMessage(
                          `Минимальный лимит для ставки ${formatForDisplay(maxSavedProductBidRub)} ₽ — ${formatForDisplay(requiredMinDailyLimit)} ₽`,
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
                    placeholder={`Задайте от ${formatForDisplay(requiredMinDailyLimit)}`}
                  />
                  <span
                    className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm ${
                      !isDailyLimitEnabled ? 'text-gray-300' : 'text-gray-400'
                    }`}
                  >
                    ₽
                  </span>
                </div>
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

        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <h2 className="text-lg font-bold text-gray-900">Статистика</h2>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                <ToggleSwitch checked={isStatsChartEnabled} onChange={setIsStatsChartEnabled} />
                <span>График</span>
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
              >
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="tabular-nums">15.04.25—21.04.25</span>
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
              >
                <span className="text-gray-500" aria-hidden>
                  📊
                </span>
                Полная статистика
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="border border-gray-200 rounded-2xl px-5 py-4 bg-white">
              <p className="text-base font-semibold text-gray-900 mb-1">Показы</p>
              <StatPrimaryMetric value="29 231" trend={{ value: '3,4%', direction: 'up' }} />
              <div className="border-t border-gray-100 pt-3 grid grid-cols-2 gap-3">
                <StatSecondaryMetric label="CPM" value="175 ₽" trend={{ value: '1,0%', direction: 'up' }} />
                <StatSecondaryMetric
                  label="Позиция в поиске"
                  value="2"
                  trend={{ value: '123', direction: 'up' }}
                />
              </div>
            </div>

            <div className="border border-gray-200 rounded-2xl px-5 py-4 bg-white">
              <p className="text-base font-semibold text-gray-900 mb-1">Клики</p>
              <StatPrimaryMetric value="83" trend={{ value: '12,1%', direction: 'up' }} />
              <div className="border-t border-gray-100 pt-3 grid grid-cols-2 gap-3">
                <StatSecondaryMetric
                  label="CTR"
                  value="0,28%"
                  trend={{ value: '0,03%', direction: 'down', positiveIsGood: false }}
                />
                <StatSecondaryMetric label="CPC" value="61 ₽" trend={{ value: '6,1%', direction: 'up' }} />
              </div>
            </div>

            <div className="border border-gray-200 rounded-2xl px-5 py-4 bg-white">
              <p className="text-base font-semibold text-gray-900 mb-1">Заказы</p>
              {isCardWorkBonusScenario ? (
                <>
                  <StatPrimaryMetric
                    value="0"
                    trend={{ value: '0%', direction: 'down', positiveIsGood: false }}
                  />
                  <div className="border-t border-gray-100 pt-3 grid grid-cols-2 gap-3">
                    <StatSecondaryMetric
                      label="CR"
                      value="0%"
                      trend={{ value: '0%', direction: 'down', positiveIsGood: false }}
                    />
                    <StatSecondaryMetric label="CPO" value="—" trend={{ value: '0%', direction: 'down' }} />
                  </div>
                </>
              ) : (
                <>
                  <StatPrimaryMetric value="19" trend={{ value: '18,8%', direction: 'up' }} />
                  <div className="border-t border-gray-100 pt-3 grid grid-cols-2 gap-3">
                    <StatSecondaryMetric label="CR" value="22,9%" trend={{ value: '1,4%', direction: 'up' }} />
                    <StatSecondaryMetric label="CPO" value="269 ₽" trend={{ value: '8,4%', direction: 'up' }} />
                  </div>
                </>
              )}
            </div>

            <div className="border border-gray-200 rounded-2xl px-5 py-4 bg-white">
              <p className="text-base font-semibold text-gray-900 mb-1">Доля затрат</p>
              <StatPrimaryMetric
                value="50,6%"
                trend={{ value: '0,3%', direction: 'down', positiveIsGood: true }}
              />
              <div className="border-t border-gray-100 pt-3 grid grid-cols-2 gap-3">
                <StatSecondaryMetric
                  label="Сумма заказов"
                  value={isCardWorkBonusScenario ? '0 ₽' : '196 000 ₽'}
                  trend={
                    isCardWorkBonusScenario
                      ? { value: '0%', direction: 'down', positiveIsGood: false }
                      : { value: '5,8%', direction: 'up' }
                  }
                />
                <StatSecondaryMetric label="Расход" value="5 115 ₽" trend={{ value: '5,3%', direction: 'up' }} />
              </div>
            </div>
          </div>
        </section>

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

        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-8">
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
          const effectiveMaxBidRub = Math.max(
            maxBid,
            parseDisplayValue(productSearchBids[productKey]?.saved ?? '0'),
            parseDisplayValue(productRecommendationsBids[productKey]?.saved ?? '0'),
          );
          const requiredDailyLimit = minDailyLimitForMaxBid(effectiveMaxBidRub);
          if (isDailyLimitEnabled && requiredDailyLimit > campaignBudget) {
            setIsBidChasingModalOpen(false);
            setBidLimitBudgetConflictModal({
              kind: 'bidChasing',
              position,
              maxBid,
              shortfall: requiredDailyLimit - campaignBudget,
            });
            return;
          }
          setBidChasingPosition(position);
          setBidChasingMaxBid(maxBid);
          setIsBidChasingEnabled(true);
          setIsBidChasingModalOpen(false);
          syncDailyLimitAfterMaxBidChange(effectiveMaxBidRub);
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

      {bidRaisesDailyLimitModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
          onClick={() => setBidRaisesDailyLimitModal(null)}
        >
          <div
            className="relative w-full max-w-[540px] rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setBidRaisesDailyLimitModal(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>
            <p className="pr-8 text-base text-gray-900 leading-snug">
              <span className="font-semibold">
                При новой ставке {formatForDisplay(bidRaisesDailyLimitModal.attemptedBid)} ₽ дневного
                лимита не хватит на весь день, нужно увеличить лимит
              </span>
            </p>
            <div className="mt-6 flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:flex-nowrap sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  const { productKey: pk, zone, currentDailyLimit } = bidRaisesDailyLimitModal;
                  const capBid = maxBidRubForDailyLimit(currentDailyLimit);
                  setBidRaisesDailyLimitModal(null);
                  if (capBid > 0) {
                    const setter = zone === 'search' ? setProductSearchBids : setProductRecommendationsBids;
                    setter((prev) => ({
                      ...prev,
                      [pk]: { draft: String(capBid), saved: String(capBid) },
                    }));
                    setToastMessage('Ставка изменена');
                    setToastIsError(false);
                    setShowToast(true);
                  }
                }}
                className="whitespace-nowrap rounded-lg bg-gray-100 px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 sm:shrink-0"
              >
                Оставить ставку{' '}
                {formatForDisplay(maxBidRubForDailyLimit(bidRaisesDailyLimitModal.currentDailyLimit))} ₽
              </button>
              <button
                type="button"
                onClick={() => {
                  const { productKey: pk, zone, attemptedBid, newDailyLimit } = bidRaisesDailyLimitModal;
                  setBidRaisesDailyLimitModal(null);
                  applyBidWithDailyLimit(pk, zone, attemptedBid, newDailyLimit);
                }}
                className="whitespace-nowrap rounded-lg bg-purple-600 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-700 sm:shrink-0"
              >
                Поднять лимит до {formatForDisplay(bidRaisesDailyLimitModal.newDailyLimit)} ₽
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
  const requiredDailyLimitRub = minDailyLimitForMaxBid(effectiveMaxBidRub);
  const showDailyLimitBumpNotice =
    isDailyLimitEnabled &&
    savedDailyLimitRub > 0 &&
    maxBidValid &&
    requiredDailyLimitRub > savedDailyLimitRub;

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
            {showDailyLimitBumpNotice && (
              <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white"
                  aria-hidden
                >
                  !
                </span>
                <p className="min-w-0 text-sm leading-snug text-amber-950">
                  Если примените такой лимит ставки, дневной лимит изменится до{' '}
                  <span className="font-semibold">{formatForDisplay(requiredDailyLimitRub)} ₽</span>. Чтобы бюджета
                  хватило на целый день показов, если ставка будет близка к лимиту.
                </p>
              </div>
            )}
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

