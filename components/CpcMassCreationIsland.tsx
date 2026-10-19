import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Checkbox } from 'antd';
import type { CampaignRecord } from '../types';
import { DAILY_LIMIT_ABSOLUTE_MIN, minDailyLimitForMaxBid } from '../utils/cpcDailyLimitBid';
import {
  DEFAULT_BID_CHASING_POSITION,
  formatBidChasingClusterBidRangeLabel,
  formatBidChasingPositionLabel,
  presetBidChasingPosition,
  resolveBidChasingDemoBids,
  searchBidForecastMetaForPosition,
  type BidChasingPosition,
} from '../utils/cpcBidChasingPositionTiers';
import { effectivePromoBonusAmount } from '../utils/promoBonus';
import {
  AdvancedDailyLimitModal,
  AutoStrategiesModal,
  createDefaultAdvancedDailyLimitSettings,
  formatConfiguredDailyLimitConditions,
  type AdvancedDailyLimitSettings,
  type AutoStrategiesTab,
} from './CpcCampaignPage';
import { AlertTriangle, Bell, Edit2 } from './Icons';
import {
  useStockRemainderHoverPortal,
  type StockHoverProductItem,
} from './ProductStockDetailHover';
import { SearchBidForecastField } from './SearchBidForecastField';

const CHIP_TIP_DELAY_MS = 1000;

type AutobidderSetup = {
  mode: AutoStrategiesTab;
  settings: AdvancedDailyLimitSettings;
  position: BidChasingPosition;
  maxBid: number;
};

function autobidderCellLabel(setup: AutobidderSetup | undefined): string | null {
  if (!setup) return null;
  if (setup.mode === 'profit') return formatConfiguredDailyLimitConditions(setup.settings);
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
        className={`inline-block cursor-default text-[13px] leading-5 tabular-nums ${
          stockLeft === 0 ? 'text-red-600' : 'text-gray-500'
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
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
      checked ? 'bg-[#9A41FE]' : 'bg-gray-300'
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

function DrrTrendIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" aria-hidden>
      <path
        d="M1.5 10.5 5 7l3 3 6.5-6.5"
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
      className="relative flex min-h-[128px] w-full min-w-[168px] max-w-[200px] cursor-pointer flex-col rounded-2xl border border-gray-200 bg-white p-3 text-left transition-colors hover:bg-[#F5F5F7]"
      aria-label="Настроить разовое пополнение бюджета"
    >
      <span className="pointer-events-none absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#F3F4F6] text-gray-600">
        <Edit2 className="h-3.5 w-3.5" />
      </span>

      <p className="pr-8 text-base font-bold leading-5 tabular-nums text-gray-900">
        {formatRub(row.budget)} ₽
      </p>

      <p
        className={`mt-0.5 text-xs font-medium leading-4 tabular-nums ${
          hasPromo ? 'text-[#2E7D32]' : 'text-gray-400'
        }`}
      >
        {hasPromo
          ? `–${formatRub(bonusAmount)} ₽ промобонусами`
          : '0 ₽ промобонусами'}
      </p>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenAutoRefill();
        }}
        className={`mt-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors ${
          row.autoReplenishment
            ? 'bg-[#E8F5E9] text-[#2E7D32] hover:bg-[#DCEFDE]'
            : 'bg-[#E5E7EB] text-gray-700 hover:bg-[#D1D5DB]'
        }`}
        aria-label="Настроить автопополнение"
      >
        {row.autoReplenishment ? (
          <>
            <AutoRefillOnIcon className="h-3 w-3 shrink-0" />
            Автопополнение
          </>
        ) : (
          <>
            <AutoRefillOffIcon className="h-3 w-3 shrink-0" />
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
  hasDynamicRules,
  onOpen,
}: {
  row: CampaignRecord;
  showDailyLimit: boolean;
  hasDynamicRules: boolean;
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
        className="inline-flex h-9 items-center rounded-lg bg-[#F3F4F6] px-3 text-sm font-medium text-gray-800 transition-colors hover:bg-[#E8E8ED]"
      >
        Установить
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative flex min-h-[128px] w-full min-w-[148px] max-w-[180px] flex-col rounded-2xl border border-gray-200 bg-white p-3 text-left transition-colors hover:bg-[#F5F5F7]"
    >
      <span className="pointer-events-none absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#F3F4F6] text-gray-600">
        <Edit2 className="h-3.5 w-3.5" />
      </span>
      <p className="pr-8 text-base font-bold tabular-nums text-gray-900">
        {formatRub(row.dailyLimit!)} ₽ в дн
      </p>
      {needsRaise ? (
        <p className="mt-1.5 flex items-start gap-1 text-[11px] font-medium leading-snug text-[#E11D48]">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
          Нужно от {formatRub(recommended)} ₽
        </p>
      ) : null}
      {hasDynamicRules ? (
        <p className="mt-auto inline-flex items-center gap-1 text-[11px] font-medium text-[#2E7D32]">
          <DrrTrendIcon className="h-3 w-3 shrink-0 text-[#34C759]" />
          Меняется от ДРР
        </p>
      ) : null}
    </button>
  );
}

export type MassCreationIslandProps = {
  title: string;
  zonesPill: string;
  showDailyLimit?: boolean;
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
  onOpenBudgetSettings,
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
  const [autobidderSetup, setAutobidderSetup] = useState<Record<string, AutobidderSetup>>({});
  const [autobidderRowId, setAutobidderRowId] = useState<string | null>(null);
  const [chipTip, setChipTip] = useState<{
    text: string;
    left: number;
    top: number;
  } | null>(null);
  const chipTipTimerRef = React.useRef<number | null>(null);

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
    if (!dailyLimitCampaign) return;
    const limit = dailyLimitCampaign.dailyLimit;
    const limitStr = limit != null && limit > 0 ? String(limit) : '';
    setIsDailyLimitEnabled(limit != null && limit > 0);
    setDailyLimitValue(limitStr);
    setSavedDailyLimit(limitStr);
    const existing = autobidderSetup[dailyLimitCampaign.id];
    setAdvancedSettings(
      existing?.mode === 'profit'
        ? existing.settings
        : createDefaultAdvancedDailyLimitSettings(),
    );
  }, [dailyLimitCampaign, autobidderSetup]);

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
  }, [dailyLimitCampaign, onUpdate]);

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
    <section className="mx-auto w-full min-w-[1392px] max-w-[1920px] space-y-4 rounded-2xl bg-white px-6 pb-6 pt-5 shadow-sm animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
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
        </div>
      </div>

      <div className="flex items-center justify-start gap-2.5 rounded-xl bg-[#FBF7FF] px-4 py-3 text-left">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F3E8FF] text-[#9A41FE]"
          aria-hidden
        >
          <Bell className="h-4 w-4" />
        </span>
        <p className="mb-0 text-sm font-bold leading-snug text-[#9A41FE]">
          Умный алгоритм помогает платить меньше с{' '}
          <span className="underline decoration-[#9A41FE]/50 underline-offset-2">
            аукционом второй цены
          </span>
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1420px] table-fixed text-left text-sm">
          <colgroup>
            <col className="w-[30%]" />
            <col className="w-[14%]" />
            {showDailyLimit ? <col className="w-[12%]" /> : null}
            <col className="w-[12%]" />
            {isZones ? (
              <>
                <col className="w-[18%]" />
                <col className="w-[14%]" />
              </>
            ) : (
              <col className="w-[18%]" />
            )}
          </colgroup>
          <thead>
            <tr className="border-b border-gray-100 text-[13px] font-semibold text-gray-700">
              <th className="px-2 py-3 font-semibold">
                <div className="flex items-center gap-2.5">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={indeterminate}
                    onChange={(e) => onToggleSelectAll(pageIds, e.target.checked)}
                    className="h-4 w-4 text-purple-600"
                  />
                  <span>Товар (кампания)</span>
                </div>
              </th>
              <th className="px-2 py-3 font-semibold">Бюджет</th>
              {showDailyLimit ? (
                <th className="px-2 py-3 font-semibold">Дневной лимит</th>
              ) : null}
              <th className="px-2 py-3 font-semibold">Автобиддер</th>
              {isZones ? (
                <>
                  <th className="px-2 py-3 font-semibold">Поиск</th>
                  <th className="px-2 py-3 font-semibold">Рекомендации</th>
                </>
              ) : (
                <th className="px-2 py-3 font-semibold">Ставка</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {campaigns.map((row, rowIndex) => {
              const searchOn = row.searchBid != null;
              const recsOn = row.recommendationsBid != null;
              const stockLeft = rowIndex === 0 ? 0 : stockLeftForRow(row);
              const bidderSetup = autobidderSetup[row.id];
              const bidderLabel = autobidderCellLabel(bidderSetup);
              const showDiscount = rowIndex === 1 || rowIndex === 3;
              const showConflict = rowIndex === 2;
              const hasDynamicRules =
                bidderSetup?.mode === 'profit' ||
                (advancedSettings.autoIncreaseEnabled &&
                  dailyLimitCampaign?.id === row.id) ||
                (row.dailyLimit != null &&
                  row.dailyLimit > 0 &&
                  (rowIndex === 1 || rowIndex === 4));

              return (
                <tr key={row.id} className="align-top">
                  <td className="px-2 py-3.5">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedIds.includes(row.id)}
                        onChange={() => onToggleSelect(row.id)}
                        className="mt-7 h-4 w-4 text-purple-600"
                      />
                      <img
                        src={row.imageUrl}
                        alt=""
                        className="h-[72px] w-[52px] shrink-0 rounded-lg bg-gray-100 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <input
                          type="text"
                          value={row.campaignName}
                          onChange={(e) => onUpdate(row.id, { campaignName: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full cursor-text truncate rounded-[10px] border border-[#D8D8D8] bg-white px-2.5 py-1.5 text-[13px] font-semibold leading-snug text-gray-900 outline-none transition-colors focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                          aria-label="Название кампании"
                        />
                        <div className="mt-1 truncate text-[13px] leading-5 text-gray-500">
                          {row.productName}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                          <MassCreationStockQty row={row} stockLeft={stockLeft} />
                          <span className="tabular-nums text-gray-500">{row.nmId}</span>
                          {showDiscount ? (
                            <span className="inline-flex rounded-md bg-[#E8F5E9] px-1.5 py-0.5 text-[11px] font-semibold text-[#2E7D32]">
                              –30%
                            </span>
                          ) : null}
                        </div>
                        {showConflict ? (
                          <div className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium text-[#E11D48]">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            Конфликт кампаний
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </td>

                  <td className="px-2 py-3.5">
                    <BudgetSettingsCard
                      row={row}
                      onOpenOneTime={() => onOpenBudgetSettings(row, 'budget')}
                      onOpenAutoRefill={() => onOpenBudgetSettings(row, 'autorefill')}
                    />
                  </td>

                  {showDailyLimit ? (
                    <td className="px-2 py-3.5">
                      <DailyLimitSettingsCard
                        row={row}
                        showDailyLimit={showDailyLimit}
                        hasDynamicRules={Boolean(hasDynamicRules && row.dailyLimit)}
                        onOpen={() => setDailyLimitCampaign(row)}
                      />
                    </td>
                  ) : null}

                  <td className="px-2 py-3.5">
                    {bidderLabel ? (
                      <button
                        type="button"
                        className="text-left text-sm font-medium leading-snug text-blue-600 hover:text-blue-700 hover:underline"
                        onClick={() => {
                          hideChipTip();
                          setAutobidderRowId(row.id);
                        }}
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

                  {isZones ? (
                    <>
                      <td className="px-2 py-3.5">
                        <div className="flex items-start gap-2">
                          <div className={searchOn ? (bidderSetup?.mode === 'positions' ? 'pt-2' : 'pt-3') : undefined}>
                            <ToggleSwitch
                              checked={searchOn}
                              onChange={(checked) => {
                                onUpdate(row.id, {
                                  searchBid: checked
                                    ? row.searchBid ?? defaultZoneBid
                                    : undefined,
                                });
                                if (!checked) {
                                  hideChipTip();
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
                            bidderSetup?.mode === 'positions' ? (
                              <div
                                className="flex h-9 items-center text-sm font-medium tabular-nums text-gray-900"
                                title="Диапазон ставок"
                              >
                                {(() => {
                                  const bids = resolveBidChasingDemoBids(bidderSetup.position);
                                  return `${formatBidChasingClusterBidRangeLabel(
                                    bids.demoBidMinRub,
                                    bids.demoBidMaxRub,
                                  )} ₽`;
                                })()}
                              </div>
                            ) : (
                              <SearchBidForecastField
                                value={`${formatRub(
                                  row.searchBid ?? bidderSetup?.maxBid ?? defaultZoneBid,
                                )} ₽`}
                                disabled={false}
                                readOnly={Boolean(bidderLabel)}
                                filled={
                                  (bidderSetup?.mode === 'positions'
                                    ? searchBidForecastMetaForPosition(bidderSetup.position)
                                    : searchBidForecastMetaForPosition(
                                        presetBidChasingPosition('11-34'),
                                      )
                                  ).filled
                                }
                                caption={`Ставка за ${
                                  (bidderSetup?.mode === 'positions'
                                    ? searchBidForecastMetaForPosition(bidderSetup.position)
                                    : searchBidForecastMetaForPosition(
                                        presetBidChasingPosition('11-34'),
                                      )
                                  ).label
                                }`}
                                onChange={(raw) => {
                                  const parsed = parseRubInput(raw);
                                  if (parsed != null) onUpdate(row.id, { searchBid: parsed });
                                }}
                                onBarsClick={() => {
                                  hideChipTip();
                                  setAutobidderRowId(row.id);
                                }}
                                onTipEnter={
                                  bidderLabel
                                    ? (e) => {
                                        clearChipTipTimer();
                                        chipTipTimerRef.current = window.setTimeout(() => {
                                          const rect = e.currentTarget.getBoundingClientRect();
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
                            )
                          ) : null}
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
                            className={`h-[38px] w-[120px] shrink-0 rounded-[10px] border border-[#D8D8D8] bg-white px-3 text-right text-sm font-medium tabular-nums outline-none focus:border-purple-500 ${
                              !recsOn
                                ? 'cursor-not-allowed bg-[#F7F7F8] text-gray-400'
                                : 'text-gray-900'
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
                        className="h-[38px] w-[140px] rounded-[10px] border border-[#D8D8D8] bg-white px-3 text-right text-sm font-medium tabular-nums text-gray-900 outline-none focus:border-purple-500"
                      />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-end gap-x-8 gap-y-2 border-t border-gray-100 pt-4">
        <div>
          <div className="text-xs font-medium text-gray-500">Промобонусы</div>
          {(totalPromoSpend || promoBonusesTotal) > 0 ? (
            <div className="mt-0.5 text-sm font-semibold tabular-nums text-[#2E7D32]">
              –{formatRub(totalPromoSpend || promoBonusesTotal)} B
            </div>
          ) : (
            <div className="mt-0.5 text-sm font-semibold tabular-nums text-gray-400">
              0 B
            </div>
          )}
        </div>
        <div>
          <div className="text-xs font-medium text-gray-500">С единого счета</div>
          {totalPromoSpend > 0 ? (
            <div className="mt-0.5 flex items-baseline gap-1.5 text-sm">
              <span className="tabular-nums text-gray-400 line-through">
                {formatRub(totalBudget || unifiedAccountTotal)} ₽
              </span>
              <span className="font-bold tabular-nums text-gray-900">
                {formatRub(unifiedCharge || Math.max(0, unifiedAccountTotal - promoBonusesTotal))} ₽
              </span>
            </div>
          ) : (
            <div className="mt-0.5 text-sm font-bold tabular-nums text-gray-900">
              {formatRub(unifiedCharge || unifiedAccountTotal)} ₽
            </div>
          )}
        </div>
      </div>

      {autobidderCampaign ? (
        <AutoStrategiesModal
          key={autobidderCampaign.id}
          isOpen
          onClose={() => setAutobidderRowId(null)}
          bidChasing={{
            initialPosition:
              autobidderSetup[autobidderCampaign.id]?.position ?? DEFAULT_BID_CHASING_POSITION,
            initialMaxBid:
              autobidderSetup[autobidderCampaign.id]?.maxBid ??
              autobidderCampaign.searchBid ??
              defaultZoneBid,
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
            if (settings.autoIncreaseEnabled) {
              setAutobidderSetup((prev) => ({
                ...prev,
                [dailyLimitCampaign.id]: {
                  mode: 'profit',
                  settings,
                  position:
                    prev[dailyLimitCampaign.id]?.position ?? DEFAULT_BID_CHASING_POSITION,
                  maxBid: prev[dailyLimitCampaign.id]?.maxBid ?? maxBidForLimit,
                },
              }));
            }
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
