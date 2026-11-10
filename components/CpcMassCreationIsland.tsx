import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CampaignRecord } from '../types';
import { DAILY_LIMIT_ABSOLUTE_MIN, minDailyLimitForMaxBid } from '../utils/cpcDailyLimitBid';
import {
  bidChasingPositionOption,
  DEFAULT_BID_CHASING_MAX_BID_RUB,
  DEFAULT_BID_CHASING_POSITION,
  formatBidChasingClusterBidRangeLabel,
  formatBidChasingPositionLabel,
  resolveBidChasingDemoBids,
  type BidChasingPosition,
  type BidChasingRange,
} from '../utils/cpcBidChasingPositionTiers';
import { effectivePromoBonusAmount } from '../utils/promoBonus';
import { PROMOTION_ACCOUNT_BALANCE_BY_PROFILE } from './AppHeader';
import { useProfile } from './ProfileContext';
import { FINANCE_BALANCE_DEMO_EVENT, readFinanceBufferRub } from '../utils/financeBalanceDemo';
import {
  AdvancedDailyLimitModal,
  AutoStrategiesModal,
  createDefaultAdvancedDailyLimitSettings,
  formatDynamicDailyLimitBadgeLabel,
  formatDynamicDailyLimitTooltipLines,
  isDynamicDailyLimitConfigured,
  type AdvancedDailyLimitSettings,
  type AutoStrategiesTab,
} from './CpcCampaignPage';
import {
  buildDemoConflictCards,
  CampaignConflictModal,
  type ConflictProductCard,
} from './CampaignConflictModal';
import { AlertTriangle, Edit2 } from './Icons';
import {
  useStockRemainderHoverPortal,
  type StockHoverProductItem,
} from './ProductStockDetailHover';
import {
  bidForCpcBarSegment,
  bidForCpmBarSegment,
  CPC_DEFAULT_SEARCH_BID_RUB,
  CPM_DEFAULT_COMPETITIVE_BID_RUB,
  resolveCpcSearchBidStatus,
  resolveCpmBidStatus,
  SearchBidForecastField,
  statusFromCpcPositionTier,
  type RichBidSegmentIndex,
  type RichBidVisualStatus,
} from './SearchBidForecastField';
import { SearchBidPositionPicker } from './SearchBidPositionPicker';

const CHIP_TIP_DELAY_MS = 1000;

/** RITM RtFormFieldText (neutral / filling), без @dpa */
const RITM_INPUT_CLASS =
  'w-full rounded-xl border border-transparent bg-[#F2F2F7] px-3 py-2 text-[13px] font-medium leading-snug text-gray-900 outline-none transition-colors placeholder:text-gray-400 hover:bg-[#EBEBF0] focus:border-black focus:bg-white focus:ring-0';
const RITM_INPUT_COMPACT_CLASS =
  'h-[38px] rounded-xl border border-transparent bg-[#F2F2F7] px-3 text-sm font-medium tabular-nums text-gray-900 outline-none transition-colors hover:bg-[#EBEBF0] focus:border-black focus:bg-white focus:ring-0';
const RITM_INPUT_DISABLED_CLASS =
  'cursor-not-allowed bg-[#EFEFF3] text-gray-400 hover:bg-[#EFEFF3]';

export type MassCreationAutobidderSetup = {
  mode: AutoStrategiesTab;
  settings: AdvancedDailyLimitSettings;
  position: BidChasingPosition;
  maxBid: number;
};

function autobidderCellLabel(setup: MassCreationAutobidderSetup | undefined): string | null {
  if (!setup || setup.mode !== 'positions') return null;
  return formatBidChasingPositionLabel(setup.position);
}

function formatRub(value: number): string {
  return value.toLocaleString('ru-RU');
}

function parseRubInput(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, '').replace('₽', '').replace(',', '.').replace(/B/gi, '');
  if (cleaned === '') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function stockLeftForRow(row: Pick<CampaignRecord, 'nmId' | 'stockLeft'>): number {
  if (row.stockLeft != null && Number.isFinite(row.stockLeft)) return Math.max(0, row.stockLeft);
  const seed = Math.abs(row.nmId) || 1;
  const bucket = seed % 20;
  if (bucket === 0) return 0;
  if (bucket <= 2) return 1 + (seed % 8);
  return 20 + (seed % 480);
}

function MassCreationStockQty({
  row,
  stockLeft,
}: {
  row: CampaignRecord;
  stockLeft: number;
}) {
  const items = useMemo<StockHoverProductItem[]>(
    () => [
      {
        key: row.id,
        name: row.productName,
        image: row.imageUrl,
        category: row.category,
        stockLeft,
        stockSeed: Math.abs(row.nmId) || 1,
      },
    ],
    [row.category, row.id, row.imageUrl, row.nmId, row.productName, stockLeft],
  );
  const { anchorRef, openHover, scheduleClose, portal } = useStockRemainderHoverPortal(
    items,
    'right',
  );

  return (
    <>
      <span
        ref={anchorRef}
        className={`inline-block cursor-default text-[11px] font-bold leading-4 tracking-[0.2px] tabular-nums ${
          stockLeft === 0 ? 'text-red-600' : 'text-[#9191A0]'
        }`}
        onMouseEnter={openHover}
        onMouseLeave={scheduleClose}
      >
        {stockLeft.toLocaleString('ru-RU')} шт
      </span>
      {portal}
    </>
  );
}

/** RITM-like toggle (RtToggle primary), без @dpa — ярче активный primary */
const ToggleSwitch = ({
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
    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C26CFF]/40 ${
      checked ? 'bg-[#B45AFF]' : 'bg-[#D8D8E0]'
    }`}
  >
    <span
      aria-hidden
      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition duration-200 ease-in-out ${
        checked ? 'translate-x-4' : 'translate-x-0'
      }`}
    />
  </button>
);

/** RITM-like checkbox (RtCheckbox primary), ярче заливки */
const RitmCheckbox = ({
  checked,
  indeterminate = false,
  onChange,
  className = '',
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={indeterminate ? 'mixed' : checked}
    onClick={() => onChange(!(checked || indeterminate))}
    className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C26CFF]/40 ${
      checked || indeterminate
        ? 'border-[#B45AFF] bg-[#B45AFF] text-white'
        : 'border-[#C5C5CE] bg-white hover:border-[#B45AFF]'
    } ${className}`}
  >
    {indeterminate ? (
      <span className="block h-0.5 w-2 rounded-full bg-white" aria-hidden />
    ) : checked ? (
      <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
        <path
          d="M2.5 6.2 4.8 8.5 9.5 3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ) : null}
  </button>
);

function DrrTrendIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" aria-hidden>
      <path
        d="M1.5 11.5 4.2 8.2 6.8 10.4 10.2 5.5 14.5 9.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Зелёный кружок с галочкой — автопополнение включено */
function AutoRefillOnIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={className} aria-hidden>
      <circle cx="6" cy="6" r="6" fill="#34C759" />
      <path
        d="M3.4 6.15 5.05 7.8 8.6 4.2"
        fill="none"
        stroke="#0B3D1C"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Чёрный кружок с крестиком — автопополнение выключено */
function AutoRefillOffIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={className} aria-hidden>
      <circle cx="6" cy="6" r="6" fill="#1C1C1E" />
      <path
        d="M4 4 8 8M8 4 4 8"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BudgetSettingsCard({
  row,
  onOpenOneTime,
  onOpenAutoRefill,
}: {
  row: CampaignRecord;
  onOpenOneTime: () => void;
  onOpenAutoRefill: () => void;
}) {
  const bonusAmount = effectivePromoBonusAmount(row);
  const hasPromo = row.usePromoBonuses && bonusAmount > 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpenOneTime}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenOneTime();
        }
      }}
      className="relative flex min-h-[97px] w-full min-w-[160px] max-w-[200px] cursor-pointer flex-col gap-1 rounded-xl border border-[#E3E4E9] bg-white p-2 text-left transition-colors hover:bg-[#F7F7F8]"
      aria-label="Настроить разовое пополнение бюджета"
    >
      <span className="pointer-events-none absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#757383]">
        <Edit2 className="h-3.5 w-3.5" />
      </span>

      <p className="mb-0 pr-8 text-[15px] font-bold leading-5 tracking-[0.3px] tabular-nums text-gray-900">
        {formatRub(row.budget)} ₽
      </p>

      <p className="flex items-center gap-1 text-[11px] leading-4 tracking-[0.2px]">
        <span
          className={`font-bold tabular-nums ${
            hasPromo ? 'text-[#166533]' : 'text-gray-900'
          }`}
        >
          {hasPromo ? `–${formatRub(bonusAmount)} ₽` : '0 ₽'}
        </span>
        <span className="font-bold text-[#9191A0]">промобонусами</span>
      </p>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenAutoRefill();
        }}
        className={`mt-0.5 inline-flex w-fit items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium leading-[14px] transition-colors ${
          row.autoReplenishment
            ? 'bg-[#E7FCDE] text-[#166533] hover:bg-[#D8F5CC]'
            : 'bg-[#F0F0F2] text-gray-900 hover:bg-[#E4E4EA]'
        }`}
        aria-label="Настроить автопополнение"
      >
        {row.autoReplenishment ? (
          <>
            <AutoRefillOnIcon className="h-3.5 w-3.5 shrink-0" />
            Автопополнение
          </>
        ) : (
          <>
            <AutoRefillOffIcon className="h-3.5 w-3.5 shrink-0" />
            Без автопополнения
          </>
        )}
      </button>
    </div>
  );
}

function DailyLimitSettingsCard({
  row,
  showDailyLimit,
  dynamicBadgeLabel,
  dynamicTooltipLines,
  onOpen,
}: {
  row: CampaignRecord;
  showDailyLimit: boolean;
  dynamicBadgeLabel: string | null;
  dynamicTooltipLines: string[];
  onOpen: () => void;
}) {
  if (!showDailyLimit) return null;

  const hasLimit = row.dailyLimit != null && row.dailyLimit > 0;
  const maxBid = Math.max(row.searchBid ?? 0, row.recommendationsBid ?? 0, row.bid ?? 0);
  const recommended = maxBid > 0 ? minDailyLimitForMaxBid(maxBid) : 0;
  const needsRaise =
    hasLimit && recommended > 0 && (row.dailyLimit as number) < recommended;

  if (!hasLimit) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex h-9 items-center rounded-[10px] bg-[#F0F0F2] px-3 text-sm font-medium text-gray-900 transition-colors hover:bg-[#E8E8ED]"
      >
        Установить
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Настроить дневной лимит"
      className="relative flex min-h-[97px] w-full min-w-[160px] max-w-[200px] flex-col gap-1 rounded-xl border border-[#E3E4E9] bg-white p-2 text-left transition-colors hover:bg-[#F7F7F8]"
    >
      <span className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#757383]">
        <Edit2 className="h-3.5 w-3.5" />
      </span>
      <p className="pr-8 text-[15px] font-bold leading-5 tracking-[0.3px] tabular-nums text-gray-900">
        {formatRub(row.dailyLimit!)} ₽ в день
      </p>
      {needsRaise ? (
        <div className="group/limit-warn relative">
          <p className="inline-flex items-center gap-0.5 text-[11px] font-bold leading-4 text-[#F97316]">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>Нужно от</span>
            <span>{formatRub(recommended)} ₽</span>
          </p>
          <div className="pointer-events-none absolute left-0 top-full z-50 mt-1.5 hidden w-[260px] rounded-lg bg-gray-900 px-3 py-2 text-left text-[11px] font-normal leading-snug text-white shadow-lg group-hover/limit-warn:block">
            Для выбранных ставок нужен лимит от {formatRub(recommended)} ₽. С меньшим лимитом бюджет
            может расходоваться неравномерно, и в кампании возникнут ошибки
          </div>
        </div>
      ) : null}
      {dynamicBadgeLabel ? (
        <div className="group/dynamic-limit relative mt-auto">
          <p className="inline-flex items-center gap-0.5 text-[11px] font-bold leading-4 text-[#0F9F6E]">
            <DrrTrendIcon className="h-3.5 w-3.5 shrink-0 text-[#34C759]" />
            {dynamicBadgeLabel}
          </p>
          {dynamicTooltipLines.length > 0 ? (
            <div className="pointer-events-none absolute left-0 top-full z-50 mt-1.5 hidden w-[280px] rounded-lg bg-gray-900 px-3 py-2 text-left text-[11px] font-normal leading-snug text-white shadow-lg group-hover/dynamic-limit:block">
              <ul className="m-0 list-none space-y-1 p-0">
                {dynamicTooltipLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </button>
  );
}

export type MassCreationIslandProps = {
  title: string;
  zonesPill: string;
  showDailyLimit?: boolean;
  /** Автобиддер только для CPC */
  showAutobidder?: boolean;
  /** Фиолетовый тег про умный алгоритм (CPC) */
  showAlgorithmTag?: boolean;
  bidMode?: 'zones' | 'unified';
  defaultZoneBid?: number;
  defaultRecsBid?: number;
  campaigns: CampaignRecord[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (ids: string[], checked: boolean) => void;
  onUpdate: (id: string, patch: Partial<CampaignRecord>) => void;
  onOpenBudgetSettings: (
    row: CampaignRecord,
    tab?: 'budget' | 'autorefill',
  ) => void;
  unifiedAccountTotal: number;
  promoBonusesTotal: number;
  /** Состояние автобиддера по id кампании (общий стейт для массовой настройки) */
  autobidderSetup: Record<string, MassCreationAutobidderSetup>;
  onAutobidderSetupChange: React.Dispatch<
    React.SetStateAction<Record<string, MassCreationAutobidderSetup>>
  >;
  /** Правила автоувеличения дневного лимита (отдельно от автобиддера) */
  dailyLimitRules?: Record<string, AdvancedDailyLimitSettings>;
  onDailyLimitRulesChange?: React.Dispatch<
    React.SetStateAction<Record<string, AdvancedDailyLimitSettings>>
  >;
};

export function MassCreationIsland({
  title,
  zonesPill,
  showDailyLimit = false,
  showAutobidder = false,
  showAlgorithmTag = false,
  bidMode = 'zones',
  defaultZoneBid = CPC_DEFAULT_SEARCH_BID_RUB,
  defaultRecsBid = CPC_DEFAULT_SEARCH_BID_RUB,
  campaigns,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onUpdate,
  onOpenBudgetSettings,
  unifiedAccountTotal,
  promoBonusesTotal,
  autobidderSetup,
  onAutobidderSetupChange,
  dailyLimitRules = {},
  onDailyLimitRulesChange,
}: MassCreationIslandProps) {
  const [dailyLimitCampaign, setDailyLimitCampaign] = useState<CampaignRecord | null>(null);
  const [isDailyLimitEnabled, setIsDailyLimitEnabled] = useState(false);
  const [dailyLimitValue, setDailyLimitValue] = useState('');
  const [savedDailyLimit, setSavedDailyLimit] = useState('');
  const [isCarryoverEnabled, setIsCarryoverEnabled] = useState(false);
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedDailyLimitSettings>(() =>
    createDefaultAdvancedDailyLimitSettings(),
  );
  const [autoRefillOnRulesTrigger, setAutoRefillOnRulesTrigger] = useState(true);
  const setAutobidderSetup = onAutobidderSetupChange;
  const [autobidderRowId, setAutobidderRowId] = useState<string | null>(null);
  const [searchBidPickerRowId, setSearchBidPickerRowId] = useState<string | null>(null);
  const [searchPositionTier, setSearchPositionTier] = useState<Record<string, BidChasingRange>>(
    {},
  );
  const [manualSearchBidIds, setManualSearchBidIds] = useState<Record<string, true>>({});

  // CPC: по умолчанию у всех строк — ставка за 11-34
  useEffect(() => {
    if (!showAutobidder) return;
    setSearchPositionTier((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const row of campaigns) {
        if (row.searchBid == null) continue;
        if (row.id in manualSearchBidIds) continue;
        if (next[row.id] == null) {
          next[row.id] = '11-34';
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [campaigns, showAutobidder, manualSearchBidIds]);

  // Число ставки держим в согласии с выбранным диапазоном (не для ручного ввода)
  useEffect(() => {
    if (!showAutobidder) return;
    for (const row of campaigns) {
      if (row.searchBid == null) continue;
      if (row.id in manualSearchBidIds) continue;
      const tier = searchPositionTier[row.id] ?? '11-34';
      const expected = bidChasingPositionOption(tier).demoBidRub;
      if (Math.abs(row.searchBid - expected) > 0.001) {
        onUpdate(row.id, { searchBid: expected });
      }
    }
  }, [campaigns, showAutobidder, manualSearchBidIds, searchPositionTier, onUpdate]);

  const searchBidPickerAnchorRef = useRef<HTMLDivElement | null>(null);
  const searchBidPickerPopoverRef = useRef<HTMLDivElement | null>(null);
  const [chipTip, setChipTip] = useState<{
    text: string;
    left: number;
    top: number;
  } | null>(null);
  const [zoneOffError, setZoneOffError] = useState<{
    rowId: string;
    zone: 'search' | 'recs';
  } | null>(null);
  const [conflictProducts, setConflictProducts] = useState<ConflictProductCard[] | null>(
    null,
  );
  const chipTipTimerRef = useRef<number | null>(null);

  const clearChipTipTimer = () => {
    if (chipTipTimerRef.current != null) {
      window.clearTimeout(chipTipTimerRef.current);
      chipTipTimerRef.current = null;
    }
  };

  const hideChipTip = useCallback(() => {
    clearChipTipTimer();
    setChipTip(null);
  }, []);

  useEffect(() => () => clearChipTipTimer(), []);

  useEffect(() => {
    if (!searchBidPickerRowId) return;
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchBidPickerAnchorRef.current?.contains(target)) return;
      if (searchBidPickerPopoverRef.current?.contains(target)) return;
      setSearchBidPickerRowId(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSearchBidPickerRowId(null);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [searchBidPickerRowId]);

  useEffect(() => {
    if (!dailyLimitCampaign) return;
    const limit = dailyLimitCampaign.dailyLimit;
    const hasExisting = limit != null && limit > 0;
    const limitStr = hasExisting ? String(limit) : String(DAILY_LIMIT_ABSOLUTE_MIN);
    setIsDailyLimitEnabled(hasExisting);
    setDailyLimitValue(limitStr);
    setSavedDailyLimit(limitStr);
    setIsCarryoverEnabled(true);
    const existing = dailyLimitRules[dailyLimitCampaign.id];
    setAdvancedSettings(
      existing && isDynamicDailyLimitConfigured(existing)
        ? existing
        : createDefaultAdvancedDailyLimitSettings(),
    );
  }, [dailyLimitCampaign, dailyLimitRules]);

  const enableDailyLimit = useCallback(() => {
    if (!dailyLimitCampaign) return;
    const min = Math.max(
      DAILY_LIMIT_ABSOLUTE_MIN,
      Math.max(
        dailyLimitCampaign.searchBid ?? 0,
        dailyLimitCampaign.recommendationsBid ?? 0,
        dailyLimitCampaign.bid ?? 0,
      ),
    );
    const next = String(min);
    setDailyLimitValue(next);
    setSavedDailyLimit(next);
    setIsDailyLimitEnabled(true);
  }, [dailyLimitCampaign]);

  const disableDailyLimit = useCallback(() => {
    if (!dailyLimitCampaign) return;
    setIsDailyLimitEnabled(false);
    setDailyLimitValue('');
    setSavedDailyLimit('');
    setAdvancedSettings(createDefaultAdvancedDailyLimitSettings());
    onUpdate(dailyLimitCampaign.id, { dailyLimit: null });
    onDailyLimitRulesChange?.((prev) => {
      if (!(dailyLimitCampaign.id in prev)) return prev;
      const { [dailyLimitCampaign.id]: _removed, ...rest } = prev;
      return rest;
    });
  }, [dailyLimitCampaign, onUpdate, onDailyLimitRulesChange]);

  const handleDailyLimitCommit = useCallback(
    (parsed: number) => {
      if (!dailyLimitCampaign || Number.isNaN(parsed)) return;
      setDailyLimitValue(String(parsed));
      setSavedDailyLimit(String(parsed));
      setIsDailyLimitEnabled(true);
      onUpdate(dailyLimitCampaign.id, { dailyLimit: parsed });
    },
    [dailyLimitCampaign, onUpdate],
  );

  const pageIds = campaigns.map((c) => c.id);
  const selectedOnPage = pageIds.filter((id) => selectedIds.includes(id)).length;
  const allSelected = selectedOnPage === pageIds.length && pageIds.length > 0;
  const indeterminate = !allSelected && selectedOnPage > 0;
  const countLabel = `${campaigns.length} ${
    campaigns.length === 1
      ? 'кампания'
      : campaigns.length >= 2 && campaigns.length <= 4
        ? 'кампании'
        : 'кампаний'
  }`;
  const isZones = bidMode === 'zones';

  const totalBudget = campaigns.reduce((sum, row) => sum + row.budget, 0);
  const totalPromoSpend = campaigns.reduce((sum, row) => sum + effectivePromoBonusAmount(row), 0);
  const unifiedCharge = Math.max(0, totalBudget - totalPromoSpend);
  const { profileId } = useProfile();
  const [financeBufferRub, setFinanceBufferRub] = useState(readFinanceBufferRub);
  useEffect(() => {
    const syncBuffer = () => setFinanceBufferRub(readFinanceBufferRub());
    window.addEventListener(FINANCE_BALANCE_DEMO_EVENT, syncBuffer);
    return () => window.removeEventListener(FINANCE_BALANCE_DEMO_EVENT, syncBuffer);
  }, []);
  const accountBalance = PROMOTION_ACCOUNT_BALANCE_BY_PROFILE[profileId] + financeBufferRub;
  const cashFromAccount = Math.min(
    totalPromoSpend > 0
      ? unifiedCharge || Math.max(0, unifiedAccountTotal - promoBonusesTotal)
      : unifiedCharge || unifiedAccountTotal,
    Math.max(0, accountBalance),
  );

  const maxBidForLimit = dailyLimitCampaign
    ? Math.max(
        dailyLimitCampaign.searchBid ?? 0,
        dailyLimitCampaign.recommendationsBid ?? 0,
        dailyLimitCampaign.bid ?? 0,
        defaultZoneBid,
      )
    : defaultZoneBid;

  const autobidderCampaign =
    campaigns.find((row) => row.id === autobidderRowId) ?? null;

  return (
    <section className="mx-auto w-full min-w-[1392px] max-w-[1920px] animate-fade-in overflow-hidden rounded-2xl bg-[#F0F0F2] p-1">
      <div className="flex flex-wrap items-start gap-3 px-3 pb-2 pt-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[22px] font-bold leading-7 tracking-[0.4px] text-gray-900">
            {title}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex min-h-5 items-center rounded px-1.5 py-0.5 text-[11px] font-medium leading-[14px] text-gray-900 bg-white">
              {countLabel}
            </span>
            <span className="inline-flex min-h-5 items-center rounded px-1.5 py-0.5 text-[11px] font-medium leading-[14px] text-gray-900 bg-white">
              {zonesPill}
            </span>
            {showAlgorithmTag ? (
              <span className="inline-flex min-h-5 max-w-full items-center gap-1 rounded bg-[#F5E5FF] px-1.5 py-0.5 text-[11px] font-medium leading-[14px] text-[#651CAD]">
                <svg
                  viewBox="0 0 14 14"
                  className="h-3.5 w-3.5 shrink-0"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M8.2 1.4 9.6 2.8 4.55 7.85l-.7 1.9 1.9-.7L10.8 3.95 9.4 2.55 8.2 1.4Zm-5.5 9.1h8.1v1.2H2.7v-1.2Z" />
                </svg>
                <span className="truncate">
                  Умный алгоритм помогает платить меньше с аукционом второй цены
                </span>
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[12px] bg-white">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[1280px] table-fixed text-left text-sm">
          <colgroup>
            <col className={showAutobidder ? 'w-[28%]' : 'w-[34%]'} />
            <col className="w-[14%]" />
            {showDailyLimit ? <col className="w-[12%]" /> : null}
            {showAutobidder ? <col className="w-[12%]" /> : null}
            {isZones ? (
              <>
                <col className="w-[18%]" />
                <col className="w-[14%]" />
              </>
            ) : (
              <col className="w-[20%]" />
            )}
          </colgroup>
          <thead>
            <tr className="border-b border-[rgba(0,0,0,0.08)] text-[14px] font-medium text-gray-900">
              <th className="px-3 py-2 font-medium">
                <div className="flex items-center gap-2.5">
                  <RitmCheckbox
                    checked={allSelected}
                    indeterminate={indeterminate}
                    onChange={(next) => onToggleSelectAll(pageIds, next)}
                  />
                  <span>Товар (кампания)</span>
                </div>
              </th>
              <th className="px-3 py-2 font-medium">Бюджет</th>
              {showDailyLimit ? (
                <th className="px-3 py-2 font-medium">Дневной лимит</th>
              ) : null}
              {showAutobidder ? (
                <th className="px-3 py-2 font-medium">Автобиддер</th>
              ) : null}
              {isZones ? (
                <>
                  <th className="px-3 py-2 font-medium">Поиск</th>
                  <th className="px-3 py-2 font-medium">Рекомендации</th>
                </>
              ) : (
                <th className="px-3 py-2 font-medium">Ставка CPM</th>
              )}
            </tr>
          </thead>
          <tbody>
            {campaigns.map((row, rowIndex) => {
              const searchOn = row.searchBid != null;
              const recsOn = row.recommendationsBid != null;
              const stockLeft = rowIndex === 0 ? 0 : stockLeftForRow(row);
              const bidderSetup = autobidderSetup[row.id];
              const bidderLabel = autobidderCellLabel(bidderSetup);
              const showConflict = rowIndex === 2;
              const dynamicSettings = dailyLimitRules[row.id] ?? null;
              const dynamicBadgeLabel =
                dynamicSettings && isDynamicDailyLimitConfigured(dynamicSettings)
                  ? formatDynamicDailyLimitBadgeLabel(dynamicSettings)
                  : null;
              const dynamicTooltipLines =
                dynamicSettings && isDynamicDailyLimitConfigured(dynamicSettings)
                  ? formatDynamicDailyLimitTooltipLines(dynamicSettings)
                  : [];

              return (
                <tr key={row.id} className="align-top">
                  <td className="px-3 py-3">
                    <div className="flex items-start gap-3">
                      <RitmCheckbox
                        checked={selectedIds.includes(row.id)}
                        onChange={() => onToggleSelect(row.id)}
                        className="mt-7"
                      />
                      <img
                        src={row.imageUrl}
                        alt=""
                        className="h-16 w-16 shrink-0 rounded-lg bg-gray-100 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <input
                          type="text"
                          value={row.campaignName}
                          onChange={(e) => onUpdate(row.id, { campaignName: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                          className={`${RITM_INPUT_CLASS} cursor-text truncate`}
                          aria-label="Название кампании"
                        />
                        <div className="mt-1 truncate text-[13px] font-bold leading-5 text-gray-900">
                          {row.productName}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold leading-4 tracking-[0.2px]">
                          <MassCreationStockQty row={row} stockLeft={stockLeft} />
                          <span className="text-[#9191A0]">·</span>
                          <span className="tabular-nums text-[#9191A0]">Арт: {row.nmId}</span>
                        </div>
                        {showConflict ? (
                          <button
                            type="button"
                            onClick={() => setConflictProducts(buildDemoConflictCards(row))}
                            className="mt-1.5 inline-flex items-center gap-0.5 border-0 bg-transparent p-0 text-[11px] font-bold leading-4 text-[#F97316] hover:opacity-80"
                          >
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            Конфликт кампаний
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <BudgetSettingsCard
                      row={row}
                      onOpenOneTime={() => onOpenBudgetSettings(row, 'budget')}
                      onOpenAutoRefill={() => onOpenBudgetSettings(row, 'autorefill')}
                    />
                  </td>

                  {showDailyLimit ? (
                    <td className="px-3 py-3">
                      <DailyLimitSettingsCard
                        row={row}
                        showDailyLimit={showDailyLimit}
                        dynamicBadgeLabel={
                          row.dailyLimit != null && row.dailyLimit > 0
                            ? dynamicBadgeLabel
                            : null
                        }
                        dynamicTooltipLines={
                          row.dailyLimit != null && row.dailyLimit > 0
                            ? dynamicTooltipLines
                            : []
                        }
                        onOpen={() => setDailyLimitCampaign(row)}
                      />
                    </td>
                  ) : null}

                  {showAutobidder ? (
                    <td className="px-3 py-3">
                      {bidderLabel ? (
                        <button
                          type="button"
                          className="h-9 max-w-full truncate rounded-lg bg-[#FBF7FF] px-4 text-sm font-medium text-[#9A41FE] hover:bg-[#F3E8FF]"
                          onClick={() => {
                            hideChipTip();
                            setAutobidderRowId(row.id);
                          }}
                          title={bidderLabel}
                        >
                          {bidderLabel}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isZones && !searchOn}
                          title={
                            isZones && !searchOn
                              ? 'Автобиддер настраивается только для поиска'
                              : undefined
                          }
                          className={`h-9 rounded-lg px-4 text-sm font-medium ${
                            isZones && !searchOn
                              ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                              : 'bg-[#F2F2F7] text-gray-800 hover:bg-[#e8e8ed]'
                          }`}
                          onClick={() => {
                            hideChipTip();
                            setAutobidderRowId(row.id);
                          }}
                        >
                          Настроить
                        </button>
                      )}
                    </td>
                  ) : null}

                  {isZones ? (
                    <>
                      <td className="px-3 py-3">
                        <div className="flex items-start gap-2">
                          <div className="flex h-9 shrink-0 items-center">
                            <ToggleSwitch
                              checked={searchOn}
                              onChange={(checked) => {
                                if (!checked && !recsOn) {
                                  setZoneOffError({ rowId: row.id, zone: 'search' });
                                  return;
                                }
                                setZoneOffError((current) =>
                                  current?.rowId === row.id ? null : current,
                                );
                                onUpdate(row.id, {
                                  searchBid: checked
                                    ? row.searchBid ?? defaultZoneBid
                                    : undefined,
                                });
                                if (checked) {
                                  setManualSearchBidIds((prev) => {
                                    if (!(row.id in prev)) return prev;
                                    const { [row.id]: _removed, ...rest } = prev;
                                    return rest;
                                  });
                                  setSearchPositionTier((prev) => ({
                                    ...prev,
                                    [row.id]: '11-34',
                                  }));
                                } else {
                                  hideChipTip();
                                  setSearchPositionTier((prev) => {
                                    if (!(row.id in prev)) return prev;
                                    const { [row.id]: _removed, ...rest } = prev;
                                    return rest;
                                  });
                                  setManualSearchBidIds((prev) => {
                                    if (!(row.id in prev)) return prev;
                                    const { [row.id]: _removed, ...rest } = prev;
                                    return rest;
                                  });
                                  setAutobidderSetup((prev) => {
                                    if (!(row.id in prev)) return prev;
                                    const { [row.id]: _removed, ...rest } = prev;
                                    return rest;
                                  });
                                  setAutobidderRowId((current) =>
                                    current === row.id ? null : current,
                                  );
                                }
                              }}
                            />
                          </div>
                          {searchOn ? (
                            (() => {
                              const searchBidValue =
                                row.searchBid ?? bidderSetup?.maxBid ?? defaultZoneBid;
                              const selectedTier =
                                searchPositionTier[row.id] ?? '11-34';
                              const bidStatus: RichBidVisualStatus =
                                bidderSetup?.mode === 'positions'
                                  ? {
                                      kind: 'autobidder',
                                      rangeLabel: (() => {
                                        const bids = resolveBidChasingDemoBids(
                                          bidderSetup.position,
                                        );
                                        return `${formatBidChasingClusterBidRangeLabel(
                                          bids.demoBidMinRub,
                                          bids.demoBidMaxRub,
                                        )} ₽`;
                                      })(),
                                    }
                                  : showAutobidder
                                    ? row.id in manualSearchBidIds
                                      ? resolveCpcSearchBidStatus(searchBidValue)
                                      : statusFromCpcPositionTier(selectedTier)
                                    : resolveCpmBidStatus(
                                        searchBidValue,
                                        CPM_DEFAULT_COMPETITIVE_BID_RUB,
                                      );

                              return (
                                <div
                                  ref={
                                    searchBidPickerRowId === row.id
                                      ? searchBidPickerAnchorRef
                                      : undefined
                                  }
                                >
                                  <SearchBidForecastField
                                    value={String(searchBidValue)}
                                    disabled={false}
                                    readOnly={Boolean(bidderLabel)}
                                    status={bidStatus}
                                    segmentMode={showAutobidder ? 'cpc' : 'cpm'}
                                    onSegmentSelect={
                                      bidderSetup?.mode === 'positions' || bidderLabel
                                        ? undefined
                                        : (segment: RichBidSegmentIndex) => {
                                            setManualSearchBidIds((prev) => {
                                              if (!(row.id in prev)) return prev;
                                              const { [row.id]: _removed, ...rest } = prev;
                                              return rest;
                                            });
                                            if (showAutobidder) {
                                              const { tier, bid } = bidForCpcBarSegment(segment);
                                              setSearchPositionTier((prev) => ({
                                                ...prev,
                                                [row.id]: tier,
                                              }));
                                              onUpdate(row.id, { searchBid: bid });
                                            } else {
                                              const { bid } = bidForCpmBarSegment(segment);
                                              onUpdate(row.id, { searchBid: bid });
                                            }
                                          }
                                    }
                                    onChange={(raw) => {
                                      const parsed = parseRubInput(raw);
                                      if (parsed != null) {
                                        setManualSearchBidIds((prev) => ({
                                          ...prev,
                                          [row.id]: true,
                                        }));
                                        setSearchPositionTier((prev) => {
                                          if (!(row.id in prev)) return prev;
                                          const { [row.id]: _removed, ...rest } = prev;
                                          return rest;
                                        });
                                        onUpdate(row.id, { searchBid: parsed });
                                      }
                                    }}
                                    onBarsClick={
                                      showAutobidder && bidderSetup?.mode !== 'positions'
                                        ? () => {
                                            hideChipTip();
                                            setSearchBidPickerRowId((current) =>
                                              current === row.id ? null : row.id,
                                            );
                                          }
                                        : undefined
                                    }
                                    showBarsButton={
                                      showAutobidder && bidderSetup?.mode !== 'positions'
                                    }
                                    barsActive={searchBidPickerRowId === row.id}
                                    onTipEnter={
                                      bidderLabel
                                        ? (e) => {
                                            clearChipTipTimer();
                                            chipTipTimerRef.current = window.setTimeout(() => {
                                              const rect =
                                                e.currentTarget.getBoundingClientRect();
                                              setChipTip({
                                                text: 'Ставку регулирует алгоритм',
                                                left: rect.left + rect.width / 2,
                                                top: rect.bottom + 10,
                                              });
                                            }, CHIP_TIP_DELAY_MS);
                                          }
                                        : undefined
                                    }
                                    onTipLeave={bidderLabel ? hideChipTip : undefined}
                                  />
                                </div>
                              );
                            })()
                          ) : null}
                        </div>
                        {zoneOffError?.rowId === row.id && zoneOffError.zone === 'search' ? (
                          <p className="mb-0 mt-1.5 text-[12px] font-medium leading-snug text-[#E11D48]">
                            Выключить можно только 1
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-start gap-2">
                          <div className="flex h-9 shrink-0 items-center">
                            <ToggleSwitch
                              checked={recsOn}
                              onChange={(checked) => {
                                if (!checked && !searchOn) {
                                  setZoneOffError({ rowId: row.id, zone: 'recs' });
                                  return;
                                }
                                setZoneOffError((current) =>
                                  current?.rowId === row.id ? null : current,
                                );
                                onUpdate(row.id, {
                                  recommendationsBid: checked
                                    ? row.recommendationsBid ?? defaultRecsBid
                                    : undefined,
                                });
                              }}
                            />
                          </div>
                          {recsOn ? (
                            <div className="relative w-[140px] shrink-0 overflow-hidden rounded-[10px] border border-transparent bg-[#F2F2F7] transition-colors hover:bg-[#EBEBF0] focus-within:border-black focus-within:bg-white">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={String(row.recommendationsBid ?? defaultRecsBid)}
                                onChange={(e) => {
                                  const parsed = parseRubInput(e.target.value);
                                  if (parsed != null)
                                    onUpdate(row.id, { recommendationsBid: parsed });
                                }}
                                className="box-border h-9 w-full bg-transparent px-2.5 pr-7 text-sm font-medium tabular-nums text-gray-900 outline-none"
                              />
                              <span
                                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm font-medium text-[#A0A0AB]"
                                aria-hidden
                              >
                                ₽
                              </span>
                            </div>
                          ) : null}
                        </div>
                        {zoneOffError?.rowId === row.id && zoneOffError.zone === 'recs' ? (
                          <p className="mb-0 mt-1.5 text-[12px] font-medium leading-snug text-[#E11D48]">
                            Выключить можно только 1
                          </p>
                        ) : null}
                      </td>
                    </>
                  ) : (
                    <td className="px-3 py-3">
                      {(() => {
                        const unifiedBid = row.bid ?? defaultZoneBid;
                        const bidStatus = resolveCpmBidStatus(
                          unifiedBid,
                          CPM_DEFAULT_COMPETITIVE_BID_RUB,
                        );
                        return (
                          <SearchBidForecastField
                            value={String(unifiedBid)}
                            disabled={false}
                            readOnly={false}
                            status={bidStatus}
                            segmentMode="cpm"
                            showBarsButton={false}
                            onSegmentSelect={(segment: RichBidSegmentIndex) => {
                              const { bid } = bidForCpmBarSegment(segment);
                              onUpdate(row.id, { bid });
                            }}
                            onChange={(raw) => {
                              const parsed = parseRubInput(raw);
                              if (parsed != null) onUpdate(row.id, { bid: parsed });
                            }}
                          />
                        );
                      })()}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>

        <div className="flex flex-wrap items-end gap-x-5 gap-y-2 px-3 py-4">
          <div>
            <div className="text-[11px] font-bold leading-4 tracking-[0.2px] text-[#63616C]">
              Промобонусы
            </div>
            {(totalPromoSpend || promoBonusesTotal) > 0 ? (
              <div className="mt-1 text-[17px] font-bold leading-6 tracking-[0.4px] tabular-nums text-gray-900">
                {formatRub(totalPromoSpend || promoBonusesTotal)} B
              </div>
            ) : (
              <div className="mt-1 text-[17px] font-bold leading-6 tracking-[0.4px] tabular-nums text-gray-900">
                0 B
              </div>
            )}
          </div>
          <div>
            <div className="text-[11px] font-bold leading-4 tracking-[0.2px] text-[#63616C]">
              С единого счёта
            </div>
            {totalPromoSpend > 0 ? (
              <div className="mt-1 flex items-center gap-2 text-[17px] font-bold leading-6 tracking-[0.4px]">
                <span className="tabular-nums text-[#63616C] line-through">
                  {formatRub(totalBudget || unifiedAccountTotal)} ₽
                </span>
                <span className="tabular-nums text-gray-900">
                  {formatRub(cashFromAccount)} ₽
                </span>
              </div>
            ) : (
              <div className="mt-1 text-[17px] font-bold leading-6 tracking-[0.4px] tabular-nums text-gray-900">
                {formatRub(cashFromAccount)} ₽
              </div>
            )}
          </div>
        </div>
      </div>

      {searchBidPickerRowId ? (
        <SearchBidPositionPicker
          anchorRef={searchBidPickerAnchorRef}
          popoverRef={searchBidPickerPopoverRef}
          selectedPosition={searchPositionTier[searchBidPickerRowId] ?? '11-34'}
          onSelectPosition={(position) => {
            const bid = bidChasingPositionOption(position).demoBidRub;
            const rowId = searchBidPickerRowId;
            setManualSearchBidIds((prev) => {
              if (!(rowId in prev)) return prev;
              const { [rowId]: _removed, ...rest } = prev;
              return rest;
            });
            setSearchPositionTier((prev) => ({
              ...prev,
              [rowId]: position,
            }));
            onUpdate(rowId, { searchBid: bid });
            setSearchBidPickerRowId(null);
          }}
          onClose={() => setSearchBidPickerRowId(null)}
        />
      ) : null}

      {showAutobidder && autobidderCampaign ? (
        <AutoStrategiesModal
          key={autobidderCampaign.id}
          isOpen
          onClose={() => setAutobidderRowId(null)}
          bidChasing={{
            initialPosition:
              autobidderSetup[autobidderCampaign.id]?.position ?? DEFAULT_BID_CHASING_POSITION,
            initialMaxBid:
              autobidderSetup[autobidderCampaign.id]?.maxBid ??
              DEFAULT_BID_CHASING_MAX_BID_RUB,
            isDailyLimitEnabled: (autobidderCampaign.dailyLimit ?? 0) > 0,
            savedDailyLimitRub: autobidderCampaign.dailyLimit ?? 0,
            otherMaxProductBidRub: Math.max(
              autobidderCampaign.searchBid ?? 0,
              autobidderCampaign.recommendationsBid ?? 0,
              autobidderCampaign.bid ?? 0,
            ),
            isBidChasingEnabled: autobidderSetup[autobidderCampaign.id]?.mode === 'positions',
            onDisable: () => {
              setAutobidderSetup((prev) => {
                const next = { ...prev };
                delete next[autobidderCampaign.id];
                return next;
              });
              setAutobidderRowId(null);
            },
            onApply: ({ position, maxBid }) => {
              setAutobidderSetup((prev) => ({
                ...prev,
                [autobidderCampaign.id]: {
                  mode: 'positions',
                  settings:
                    prev[autobidderCampaign.id]?.settings ??
                    createDefaultAdvancedDailyLimitSettings(),
                  position,
                  maxBid,
                },
              }));
              setAutobidderRowId(null);
            },
          }}
        />
      ) : null}

      {dailyLimitCampaign ? (
        <AdvancedDailyLimitModal
          dailyLimitOnly
          conditionRuleBuilder
          allowLimitAboveBudget
          isOpen
          onClose={() => setDailyLimitCampaign(null)}
          isDailyLimitEnabled={isDailyLimitEnabled}
          onEnableDailyLimit={enableDailyLimit}
          onDisableDailyLimit={disableDailyLimit}
          dailyLimitValue={dailyLimitValue}
          onDailyLimitValueChange={setDailyLimitValue}
          onDailyLimitCommit={handleDailyLimitCommit}
          savedDailyLimit={savedDailyLimit}
          isCarryoverEnabled={isCarryoverEnabled}
          onCarryoverChange={setIsCarryoverEnabled}
          campaignBudget={dailyLimitCampaign.budget}
          initialSettings={advancedSettings}
          referenceCpcBidRub={maxBidForLimit}
          autoRefillOnRulesTrigger={autoRefillOnRulesTrigger}
          onAutoRefillOnRulesTriggerChange={setAutoRefillOnRulesTrigger}
          onApply={(settings, options) => {
            setAdvancedSettings(settings);
            if (options?.reset) {
              onUpdate(dailyLimitCampaign.id, { dailyLimit: null });
              onDailyLimitRulesChange?.((prev) => {
                if (!(dailyLimitCampaign.id in prev)) return prev;
                const { [dailyLimitCampaign.id]: _removed, ...rest } = prev;
                return rest;
              });
              setDailyLimitCampaign(null);
              return;
            }
            const typedLimit = Number.parseFloat(dailyLimitValue);
            const savedLimit = Number.parseFloat(savedDailyLimit);
            const liveLimit =
              Number.isFinite(typedLimit) && typedLimit > 0
                ? typedLimit
                : Number.isFinite(savedLimit) && savedLimit > 0
                  ? savedLimit
                  : null;
            const limitFromSettings =
              settings.strategyId === 'maxSpend' &&
              settings.maxSpendLimitRub != null &&
              settings.maxSpendLimitRub > 0
                ? settings.maxSpendLimitRub
                : liveLimit;
            onUpdate(dailyLimitCampaign.id, {
              dailyLimit:
                limitFromSettings != null && limitFromSettings > 0 ? limitFromSettings : null,
            });
            onDailyLimitRulesChange?.((prev) => {
              const next = { ...prev };
              if (isDynamicDailyLimitConfigured(settings)) {
                next[dailyLimitCampaign.id] = settings;
              } else {
                delete next[dailyLimitCampaign.id];
              }
              return next;
            });
            setDailyLimitCampaign(null);
          }}
        />
      ) : null}

      {chipTip
        ? createPortal(
            <div
              role="tooltip"
              className="pointer-events-none fixed z-[9999] w-max max-w-[350px] rounded-lg bg-gray-900 px-2.5 py-1.5 text-left text-[11px] font-normal leading-snug text-white shadow-lg"
              style={{
                left: chipTip.left,
                top: chipTip.top,
                transform: 'translateX(-50%)',
              }}
            >
              {chipTip.text}
            </div>,
            document.body,
          )
        : null}

      <CampaignConflictModal
        isOpen={conflictProducts != null}
        products={conflictProducts ?? []}
        onClose={() => setConflictProducts(null)}
      />
    </section>
  );
}

/** @deprecated используйте MassCreationIsland */
export function CpcMassCreationIsland(
  props: Omit<MassCreationIslandProps, 'title' | 'zonesPill' | 'showDailyLimit'> & {
    title?: string;
    zonesPill?: string;
  },
) {
  return (
    <MassCreationIsland
      title={props.title ?? 'CPC'}
      zonesPill={props.zonesPill ?? 'Покажем в поиске и рекомендациях'}
      showDailyLimit
      showAutobidder
      bidMode="zones"
      defaultZoneBid={CPC_DEFAULT_SEARCH_BID_RUB}
      defaultRecsBid={CPC_DEFAULT_SEARCH_BID_RUB}
      {...props}
    />
  );
}
