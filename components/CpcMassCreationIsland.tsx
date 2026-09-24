import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Checkbox } from 'antd';
import type { CampaignRecord } from '../types';
import { DAILY_LIMIT_ABSOLUTE_MIN } from '../utils/cpcDailyLimitBid';
import { effectivePromoBonusAmount, maxPromoBonusForBudget } from '../utils/promoBonus';
import {
  AdvancedDailyLimitModal,
  createDefaultAdvancedDailyLimitSettings,
  type AdvancedDailyLimitSettings,
} from './CpcCampaignPage';
import { Calendar, Settings } from './Icons';
import {
  useStockRemainderHoverPortal,
  type StockHoverProductItem,
} from './ProductStockDetailHover';

const CHIP_TIP_DELAY_MS = 1000;

/** Демо-остаток по артикулу, если в записи ещё нет stockLeft */
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
        className={`mt-0.5 inline-block cursor-default text-xs ${
          stockLeft === 0 ? 'text-red-600' : 'text-gray-400'
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

const ToggleSwitch = ({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
      disabled ? 'cursor-not-allowed bg-gray-200' : 'cursor-pointer'
    } ${checked ? (disabled ? 'bg-purple-300' : 'bg-purple-600') : 'bg-gray-300'}`}
  >
    <span
      aria-hidden
      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-4' : 'translate-x-0'
      }`}
    />
  </button>
);

const BarChartIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M4 20V10" />
    <path d="M10 20V4" />
    <path d="M16 20v-7" />
    <path d="M22 20V8" />
  </svg>
);

function formatRub(value: number): string {
  return value.toLocaleString('ru-RU');
}

function parseRubInput(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, '').replace('₽', '').replace(',', '.');
  if (cleaned === '') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

const inputClass =
  'w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm font-medium text-gray-900 shadow-sm outline-none transition-colors focus:border-purple-500 focus:ring-1 focus:ring-purple-500';

const valueInputClass =
  'w-[146px] shrink-0 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm font-medium text-gray-900 shadow-sm outline-none transition-colors focus:border-purple-500 focus:ring-1 focus:ring-purple-500';

type BudgetColumnVariant = 0 | 2 | 4;

const BUDGET_COLUMN_VARIANTS: { id: BudgetColumnVariant; label: string }[] = [
  { id: 2, label: 'V2 Чипы' },
  { id: 0, label: 'Классика' },
  { id: 4, label: 'V4 Итог' },
];

export type MassCreationIslandProps = {
  title: string;
  zonesPill: string;
  /** CPC: бюджет + дневной лимит. CPM: только бюджет. */
  showDailyLimit?: boolean;
  /** zones = Поиск + Рекомендации; unified = одна ставка */
  bidMode?: 'zones' | 'unified';
  defaultZoneBid?: number;
  defaultRecsBid?: number;
  campaigns: CampaignRecord[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (ids: string[], checked: boolean) => void;
  onUpdate: (id: string, patch: Partial<CampaignRecord>) => void;
  onOpenAutoRefill: (row: CampaignRecord) => void;
  onOpenBonusBudget: (row: CampaignRecord) => void;
  unifiedAccountTotal: number;
  promoBonusesTotal: number;
};

export function MassCreationIsland({
  title,
  zonesPill,
  showDailyLimit = false,
  bidMode = 'zones',
  defaultZoneBid = 30,
  defaultRecsBid = 200,
  campaigns,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onUpdate,
  onOpenAutoRefill,
  onOpenBonusBudget,
  unifiedAccountTotal,
  promoBonusesTotal,
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
  const [budgetColumnVariant, setBudgetColumnVariant] = useState<BudgetColumnVariant>(2);
  /** Черновик суммы бюджета: коммит только на blur, чтобы бонусы не ужимались на промежуточных цифрах. */
  const [budgetDrafts, setBudgetDrafts] = useState<Record<string, string>>({});
  const [chipTip, setChipTip] = useState<{
    text: string;
    left: number;
    top: number;
  } | null>(null);
  const chipTipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearChipTipTimer = useCallback(() => {
    if (chipTipTimerRef.current != null) {
      clearTimeout(chipTipTimerRef.current);
      chipTipTimerRef.current = null;
    }
  }, []);

  const hideChipTip = useCallback(() => {
    clearChipTipTimer();
    setChipTip(null);
  }, [clearChipTipTimer]);

  const showChipTipDelayed = useCallback(
    (e: React.MouseEvent<HTMLElement>, text: string) => {
      clearChipTipTimer();
      const anchor = e.currentTarget;
      chipTipTimerRef.current = setTimeout(() => {
        const rect = anchor.getBoundingClientRect();
        setChipTip({
          text,
          left: rect.left + rect.width / 2,
          top: rect.bottom + 10,
        });
        chipTipTimerRef.current = null;
      }, CHIP_TIP_DELAY_MS);
    },
    [clearChipTipTimer],
  );

  useEffect(() => () => clearChipTipTimer(), [clearChipTipTimer]);

  useEffect(() => {
    if (!BUDGET_COLUMN_VARIANTS.some((variant) => variant.id === budgetColumnVariant)) {
      setBudgetColumnVariant(BUDGET_COLUMN_VARIANTS[0]!.id);
    }
  }, [budgetColumnVariant]);

  useEffect(() => {
    if (!dailyLimitCampaign) return;
    const limit = dailyLimitCampaign.dailyLimit;
    const limitStr = limit != null && limit > 0 ? String(limit) : '';
    setIsDailyLimitEnabled(limit != null && limit > 0);
    setDailyLimitValue(limitStr);
    setSavedDailyLimit(limitStr);
    setAdvancedSettings(createDefaultAdvancedDailyLimitSettings());
    setIsCarryoverEnabled(false);
    setAutoRefillOnRulesTrigger(true);
  }, [dailyLimitCampaign]);

  const maxBidForLimit = Math.max(
    dailyLimitCampaign?.bid ?? 0,
    dailyLimitCampaign?.searchBid ?? 0,
    dailyLimitCampaign?.recommendationsBid ?? 0,
    DAILY_LIMIT_ABSOLUTE_MIN,
  );

  const enableDailyLimit = useCallback(() => {
    const next = String(Math.max(DAILY_LIMIT_ABSOLUTE_MIN, maxBidForLimit));
    setDailyLimitValue(next);
    setSavedDailyLimit(next);
    setIsDailyLimitEnabled(true);
  }, [maxBidForLimit]);

  const disableDailyLimit = useCallback(() => {
    setIsDailyLimitEnabled(false);
    setDailyLimitValue('');
    setSavedDailyLimit('');
  }, []);

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
  const isClassicBudget = budgetColumnVariant === 0;
  const isChipsBudget = budgetColumnVariant === 2;

  const bonusAmountOf = (row: CampaignRecord) => effectivePromoBonusAmount(row);

  const setPromoOn = (row: CampaignRecord, on: boolean) => {
    if (!on) {
      onUpdate(row.id, { usePromoBonuses: false, bonusAmount: 0 });
      return;
    }
    onOpenBonusBudget(row);
  };

  const commitBudget = (row: CampaignRecord, budget: number) => {
    if (row.usePromoBonuses) {
      const maxAllowed = maxPromoBonusForBudget(row.bonusPackageId, budget);
      const current =
        row.bonusAmount != null && row.bonusAmount > 0
          ? row.bonusAmount
          : maxPromoBonusForBudget(row.bonusPackageId, row.budget);
      // Не поднимаем бонусы при росте бюджета; ужимаем только если новый лимит пакета ниже.
      onUpdate(row.id, {
        budget,
        bonusAmount: Math.min(current, maxAllowed),
      });
      return;
    }
    onUpdate(row.id, { budget });
  };

  const budgetInputValue = (row: CampaignRecord) =>
    budgetDrafts[row.id] ?? `${formatRub(row.budget)} ₽`;

  const handleBudgetDraftChange = (rowId: string, raw: string) => {
    setBudgetDrafts((prev) => ({ ...prev, [rowId]: raw }));
  };

  const commitBudgetInput = (row: CampaignRecord, raw: string) => {
    const parsed = parseRubInput(raw);
    const next = parsed == null || !Number.isFinite(parsed) || parsed < 1000 ? 1000 : parsed;
    commitBudget(row, next);
    setBudgetDrafts((prev) => {
      if (!(row.id in prev)) return prev;
      const { [row.id]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const budgetInput = (row: CampaignRecord, widthClass = 'w-[146px]') => (
    <input
      type="text"
      value={budgetInputValue(row)}
      onChange={(e) => handleBudgetDraftChange(row.id, e.target.value)}
      onBlur={(e) => commitBudgetInput(row, e.target.value)}
      className={`shrink-0 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm font-medium text-gray-900 shadow-sm outline-none transition-colors focus:border-purple-500 focus:ring-1 focus:ring-purple-500 ${widthClass}`}
    />
  );

  const limitControl = (row: CampaignRecord, className = 'w-[146px]') => {
    if (!showDailyLimit) return null;
    if (row.dailyLimit != null && row.dailyLimit > 0) {
      return (
        <button
          type="button"
          className={`mt-1 inline-flex items-center justify-end gap-1 text-xs hover:opacity-80 ${className}`}
          onClick={() => setDailyLimitCampaign(row)}
        >
          <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
          <span className="font-medium text-gray-500">в день</span>
          <span className="font-medium tabular-nums text-[#3B82F6]">
            {formatRub(row.dailyLimit)} ₽
          </span>
        </button>
      );
    }
    return (
      <button
        type="button"
        className={`mt-1 block text-right text-xs font-medium text-[#3B82F6] hover:underline ${className}`}
        onClick={() => setDailyLimitCampaign(row)}
      >
        Настроить лимит
      </button>
    );
  };

  const limitChip = (row: CampaignRecord) => {
    if (!showDailyLimit) return null;
    const hasLimit = row.dailyLimit != null && row.dailyLimit > 0;
    return (
      <button
        type="button"
        onClick={() => {
          hideChipTip();
          setDailyLimitCampaign(row);
        }}
        onMouseEnter={(e) =>
          showChipTipDelayed(e, hasLimit ? 'Лимит в день' : 'Задать дневной лимит')
        }
        onMouseLeave={hideChipTip}
        className={
          hasLimit
            ? 'inline-flex shrink-0 items-center whitespace-nowrap rounded-md bg-[#E8F5E9] px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-[#2E7D32] hover:bg-[#C8E6C9]'
            : 'inline-flex shrink-0 items-center whitespace-nowrap rounded-md border border-dashed border-gray-300 px-1.5 py-0.5 text-[11px] font-medium text-gray-500 hover:border-[#2E7D32] hover:text-[#2E7D32]'
        }
      >
        {hasLimit ? `${formatRub(row.dailyLimit!)} ₽ в дн` : '+ Лимит'}
      </button>
    );
  };

  const bonusChip = (row: CampaignRecord) => {
    const amount = bonusAmountOf(row);
    if (row.usePromoBonuses) {
      return (
        <button
          type="button"
          onClick={() => {
            hideChipTip();
            onOpenBonusBudget(row);
          }}
          onMouseEnter={(e) =>
            showChipTipDelayed(
              e,
              `Списывать ${formatRub(amount)} B с промобонусов на бюджет`,
            )
          }
          onMouseLeave={hideChipTip}
          className="inline-flex shrink-0 items-center whitespace-nowrap rounded-md bg-[#E8F5E9] px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-[#2E7D32] hover:bg-[#C8E6C9]"
        >
          {`${formatRub(amount)} B`}
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => setPromoOn(row, true)}
        onMouseEnter={(e) => showChipTipDelayed(e, 'Тратить бонусы')}
        onMouseLeave={hideChipTip}
        className="inline-flex shrink-0 items-center whitespace-nowrap rounded-md border border-dashed border-gray-300 px-1.5 py-0.5 text-[11px] font-medium text-gray-500 hover:border-[#2E7D32] hover:text-[#2E7D32]"
      >
        +Бонусы
      </button>
    );
  };

  const autoChip = (row: CampaignRecord) => {
    if (row.autoReplenishment) {
      const threshold = row.autoRefillThreshold ?? 1000;
      const amount = row.autoRefillAmount ?? 3000;
      const tooltip = `Если бюджет меньше ${formatRub(threshold)} ₽ — пополнять на ${formatRub(amount)} ₽`;
      return (
        <button
          type="button"
          onClick={() => {
            hideChipTip();
            onOpenAutoRefill(row);
          }}
          onMouseEnter={(e) => showChipTipDelayed(e, tooltip)}
          onMouseLeave={hideChipTip}
          className="inline-flex shrink-0 items-center whitespace-nowrap rounded-md bg-[#E8F5E9] px-1.5 py-0.5 text-[11px] font-medium text-[#2E7D32] hover:bg-[#C8E6C9]"
        >
          Автопополнение
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => {
          hideChipTip();
          onOpenAutoRefill(row);
        }}
        onMouseEnter={(e) => showChipTipDelayed(e, 'Задать автопополнение бюджета')}
        onMouseLeave={hideChipTip}
        className="inline-flex shrink-0 items-center whitespace-nowrap rounded-md border border-dashed border-gray-300 px-1.5 py-0.5 text-[11px] font-medium text-gray-500 hover:border-[#2E7D32] hover:text-[#2E7D32]"
      >
        +Автопополнение
      </button>
    );
  };

  const renderUnifiedBudgetCell = (row: CampaignRecord) => {
    const amount = bonusAmountOf(row);
    switch (budgetColumnVariant) {
      case 2: {
        return (
          <div className="w-[280px]">
            <input
              type="text"
              value={budgetInputValue(row)}
              onChange={(e) => handleBudgetDraftChange(row.id, e.target.value)}
              onBlur={(e) => commitBudgetInput(row, e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-right text-sm font-medium tabular-nums text-gray-900 shadow-sm outline-none transition-colors focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
            <div className="mt-1.5 flex flex-nowrap items-center justify-end gap-1">
              {bonusChip(row)}
              {autoChip(row)}
              {limitChip(row)}
            </div>
          </div>
        );
      }
      case 4: {
        const hasLimit = row.dailyLimit != null && row.dailyLimit > 0;
        return (
          <div className="w-[220px]">
            <div className="rounded-xl border border-gray-200 bg-white px-2.5 py-2 shadow-sm focus-within:border-purple-400 focus-within:ring-1 focus-within:ring-purple-400">
              <input
                type="text"
                value={budgetInputValue(row)}
                onChange={(e) => handleBudgetDraftChange(row.id, e.target.value)}
                onBlur={(e) => commitBudgetInput(row, e.target.value)}
                className="w-full border-0 bg-transparent p-0 text-right text-sm font-semibold tabular-nums text-gray-900 outline-none"
              />
              <div className="mt-1 flex flex-nowrap items-center justify-end gap-2 text-[11px] leading-none">
                {showDailyLimit ? (
                  <button
                    type="button"
                    onClick={() => setDailyLimitCampaign(row)}
                    className={
                      hasLimit
                        ? 'shrink-0 whitespace-nowrap font-medium tabular-nums text-[#9A41FE] hover:underline'
                        : 'shrink-0 whitespace-nowrap font-medium text-gray-400 hover:text-[#9A41FE] hover:underline'
                    }
                  >
                    {hasLimit
                      ? `${formatRub(row.dailyLimit!)} ₽ лимит/дн`
                      : 'Без лимита'}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() =>
                    row.usePromoBonuses ? onOpenBonusBudget(row) : setPromoOn(row, true)
                  }
                  className={
                    row.usePromoBonuses
                      ? 'shrink-0 whitespace-nowrap font-medium tabular-nums text-[#9A41FE] hover:underline'
                      : 'shrink-0 whitespace-nowrap font-medium text-gray-400 hover:text-[#9A41FE] hover:underline'
                  }
                >
                  {row.usePromoBonuses
                    ? `${formatRub(amount)} B`
                    : 'Без бонусов'}
                </button>
              </div>
            </div>
            {row.usePromoBonuses ? (
              <div className="mt-1 text-right text-[11px] leading-none text-gray-400">
                К оплате {formatRub(Math.max(0, row.budget - amount))} ₽
              </div>
            ) : null}
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <section className="space-y-4 rounded-2xl bg-white px-6 pb-6 pt-5 shadow-sm animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h2>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-medium text-gray-600">
            {countLabel}
          </span>
          <span className="inline-flex items-center rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-medium text-gray-600">
            {zonesPill}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Колонка бюджета:</span>
          {BUDGET_COLUMN_VARIANTS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setBudgetColumnVariant(v.id)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                budgetColumnVariant === v.id
                  ? 'bg-[#9A41FE] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1240px] table-fixed text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-[13px] font-semibold text-gray-700">
              <th className={`${isZones ? 'w-[20%]' : 'w-[22%]'} px-2 py-3 font-semibold`}>
                <div className="flex items-center gap-2.5">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={indeterminate}
                    onChange={(e) => onToggleSelectAll(pageIds, e.target.checked)}
                    className="h-4 w-4 text-purple-600"
                  />
                  <span>Товар</span>
                </div>
              </th>
              <th
                className={`${
                  isChipsBudget ? (isZones ? 'w-[16%]' : 'w-[18%]') : isZones ? 'w-[18%]' : 'w-[22%]'
                } px-2 py-3 font-semibold`}
              >
                Название кампании
              </th>
              {!isChipsBudget ? (
                <th className="w-[9%] px-2 py-3 text-right font-semibold">Автопополнение</th>
              ) : null}
              {isClassicBudget ? (
                <>
                  <th className="w-[12%] px-2 py-3 text-right font-semibold">Пополнить промобонусами</th>
                  <th className="w-[13%] px-2 py-3 font-semibold">
                    <span className="block w-[146px] text-right">
                      {showDailyLimit ? 'Бюджет и лимит' : 'Бюджет'}
                    </span>
                  </th>
                </>
              ) : (
                <th
                  className={`w-[22%] py-3 font-semibold ${
                    isChipsBudget ? 'pl-8 pr-2 text-left' : 'px-2 text-right'
                  }`}
                >
                  {isChipsBudget ? (
                    <span className="block w-[280px] text-right">Бюджет</span>
                  ) : (
                    'Бюджет'
                  )}
                </th>
              )}
              {isZones ? (
                <>
                  <th className={`${isChipsBudget ? 'w-[16%]' : 'w-[14%]'} px-2 py-3 font-semibold`}>
                    Поиск
                  </th>
                  <th className={`${isChipsBudget ? 'w-[16%]' : 'w-[14%]'} px-2 py-3 font-semibold`}>
                    Рекомендации
                  </th>
                </>
              ) : (
                <th className="w-[22%] px-2 py-3 font-semibold">Ставка</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {campaigns.map((row, rowIndex) => {
              const searchOn = row.searchBid != null;
              const recsOn = row.recommendationsBid != null;
              const stockLeft = rowIndex === 0 ? 0 : stockLeftForRow(row);
              return (
                <tr key={row.id} className="align-top">
                  <td className="px-2 py-3.5">
                    <div className="flex items-start gap-2.5">
                      <Checkbox
                        checked={selectedIds.includes(row.id)}
                        onChange={() => onToggleSelect(row.id)}
                        className="mt-1 h-4 w-4 text-purple-600"
                      />
                      <img
                        src={row.imageUrl}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-lg object-cover bg-gray-100"
                      />
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-semibold leading-snug text-gray-900">
                          {row.productName}
                        </div>
                        <div className="mt-0.5 text-xs text-gray-400">
                          Артикул: {row.nmId}
                        </div>
                        <MassCreationStockQty row={row} stockLeft={stockLeft} />
                      </div>
                    </div>
                  </td>

                  <td className="px-2 py-3.5">
                    <input
                      type="text"
                      value={row.campaignName}
                      onChange={(e) => onUpdate(row.id, { campaignName: e.target.value })}
                      className={inputClass}
                    />
                  </td>

                  {!isChipsBudget ? (
                    <td className="px-2 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <ToggleSwitch
                          checked={row.autoReplenishment}
                          onChange={(checked) => {
                            if (!checked) {
                              onUpdate(row.id, { autoReplenishment: false });
                              return;
                            }
                            onOpenAutoRefill(row);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => onOpenAutoRefill(row)}
                          className="text-gray-400 transition-colors hover:text-purple-600"
                          aria-label="Настройки автопополнения"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  ) : null}

                  {isClassicBudget ? (
                    <>
                      <td className="px-2 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <div className="flex h-8 min-w-[108px] items-center justify-end">
                            {row.usePromoBonuses ? (
                              <button
                                type="button"
                                onClick={() => onOpenBonusBudget(row)}
                                className="inline-flex items-center rounded-lg px-1.5 py-1 text-sm font-medium tabular-nums text-[#3B82F6] transition-colors hover:bg-gray-50"
                              >
                                <span>
                                  {`${formatRub(bonusAmountOf(row))} B`}
                                </span>
                              </button>
                            ) : null}
                          </div>
                          <ToggleSwitch
                            checked={row.usePromoBonuses}
                            onChange={(checked) => setPromoOn(row, checked)}
                          />
                        </div>
                      </td>
                      <td className="px-2 py-3.5">
                        <div className="relative w-[146px]">
                          <input
                            type="text"
                            value={budgetInputValue(row)}
                            onChange={(e) => handleBudgetDraftChange(row.id, e.target.value)}
                            onBlur={(e) => commitBudgetInput(row, e.target.value)}
                            className={valueInputClass}
                          />
                        </div>
                        {limitControl(row)}
                      </td>
                    </>
                  ) : (
                    <td className={isChipsBudget ? 'pl-8 pr-2 py-3.5' : 'px-2 py-3.5'}>
                      <div className={`flex ${isChipsBudget ? 'justify-start' : 'justify-end'}`}>
                        {renderUnifiedBudgetCell(row)}
                      </div>
                    </td>
                  )}

                  {isZones ? (
                    <>
                      <td className="px-2 py-3.5">
                        <div className="flex items-center gap-2">
                          <ToggleSwitch
                            checked={searchOn}
                            onChange={(checked) =>
                              onUpdate(row.id, {
                                searchBid: checked
                                  ? row.searchBid ?? defaultZoneBid
                                  : undefined,
                              })
                            }
                          />
                          <div className="relative w-[146px] shrink-0">
                            <input
                              type="text"
                              disabled={!searchOn}
                              value={
                                searchOn && row.searchBid != null
                                  ? `${formatRub(row.searchBid)} ₽`
                                  : ''
                              }
                              onChange={(e) => {
                                const parsed = parseRubInput(e.target.value);
                                if (parsed != null) onUpdate(row.id, { searchBid: parsed });
                              }}
                              className={`${valueInputClass} pr-8 text-right ${
                                !searchOn
                                  ? 'cursor-not-allowed bg-gray-50 text-gray-400'
                                  : ''
                              }`}
                            />
                            <BarChartIcon className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                          </div>
                        </div>
                      </td>

                      <td className="px-2 py-3.5">
                        <div className="flex items-center gap-2">
                          <ToggleSwitch
                            checked={recsOn}
                            onChange={(checked) =>
                              onUpdate(row.id, {
                                recommendationsBid: checked
                                  ? row.recommendationsBid ?? defaultRecsBid
                                  : undefined,
                              })
                            }
                          />
                          <input
                            type="text"
                            disabled={!recsOn}
                            value={
                              recsOn && row.recommendationsBid != null
                                ? `${formatRub(row.recommendationsBid)} ₽`
                                : ''
                            }
                            onChange={(e) => {
                              const parsed = parseRubInput(e.target.value);
                              if (parsed != null)
                                onUpdate(row.id, { recommendationsBid: parsed });
                            }}
                            className={`${valueInputClass} text-right ${
                              !recsOn
                                ? 'cursor-not-allowed bg-gray-50 text-gray-400'
                                : ''
                            }`}
                          />
                        </div>
                      </td>
                    </>
                  ) : (
                    <td className="px-2 py-3.5">
                      <input
                        type="text"
                        value={`${formatRub(row.bid ?? defaultZoneBid)} ₽`}
                        onChange={(e) => {
                          const parsed = parseRubInput(e.target.value);
                          if (parsed != null) onUpdate(row.id, { bid: parsed });
                        }}
                        className={`${valueInputClass} text-right`}
                      />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-end gap-10 pt-2">
        <div>
          <div className="text-sm font-medium text-gray-900">Единый счет</div>
          <div className="mt-0.5 text-xl font-bold tabular-nums text-gray-900">
            {formatRub(unifiedAccountTotal)} ₽
          </div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-400">Промобонусы</div>
          <div className="mt-0.5 text-xl font-bold tabular-nums text-gray-400">
            {formatRub(promoBonusesTotal)} ₽
          </div>
        </div>
      </div>

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
              setDailyLimitCampaign(null);
              return;
            }
            const limitFromSettings =
              settings.strategyId === 'maxSpend' &&
              settings.maxSpendLimitRub != null &&
              settings.maxSpendLimitRub > 0
                ? settings.maxSpendLimitRub
                : Number.parseFloat(savedDailyLimit) ||
                  Number.parseFloat(dailyLimitValue) ||
                  null;
            onUpdate(dailyLimitCampaign.id, {
              dailyLimit:
                limitFromSettings != null && limitFromSettings > 0 ? limitFromSettings : null,
            });
            setDailyLimitCampaign(null);
          }}
        />
      ) : null}

      {chipTip
        ? createPortal(
            <div
              role="tooltip"
              className="pointer-events-none fixed z-[9999] w-max max-w-[260px] rounded-lg bg-gray-900 px-2.5 py-1.5 text-left text-[11px] font-normal leading-snug text-white shadow-lg"
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
      bidMode="zones"
      defaultZoneBid={30}
      defaultRecsBid={200}
      {...props}
    />
  );
}
