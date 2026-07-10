import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, MoreVertical, Settings } from './Icons';
import { DailyLimitInfoTooltip } from './DailyLimitInfoTooltip';
import { CpcTopSearchClustersBlock } from './CpcTopSearchClustersBlock';
import { CPC_TOP_SEARCH_CLUSTERS_ROWS } from '../utils/cpcTopSearchClustersDemo';
import { ProductBidField, PRODUCT_BID_INPUT_WIDTH_CLASS } from './ProductBidField';
import { BidHistogramButton, SearchBidPositionPicker } from './SearchBidPositionPicker';
import type { BidChasingRange } from '../utils/cpcBidChasingPositionTiers';
import {
  PRODUCT_TABLE_THUMB_FALLBACK,
  resolveProductTableThumbSrc,
} from './SuccessPageTestData';

export type SingleProductDailyLimitSpendSummary = {
  total: number;
  spent: number;
  progress: number;
};

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
    role="switch"
    aria-checked={checked}
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    className={`relative inline-flex h-4 w-7 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
      disabled ? 'cursor-not-allowed bg-gray-200' : 'cursor-pointer'
    } ${checked ? (disabled ? 'bg-purple-300' : 'bg-[#9A41FE]') : 'bg-gray-300'}`}
  >
    <span
      aria-hidden
      className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-3' : 'translate-x-0'
      }`}
    />
  </button>
);

function HeroProductThumb({
  nmId,
  imageUrl,
  category,
  alt,
  className,
}: {
  nmId: number;
  imageUrl: string;
  category: string;
  alt: string;
  className?: string;
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
      className={
        className ??
        'h-[38px] w-[30px] shrink-0 rounded-md border border-gray-100 bg-gray-50 object-cover'
      }
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => {
        if (url !== PRODUCT_TABLE_THUMB_FALLBACK) setUrl(PRODUCT_TABLE_THUMB_FALLBACK);
      }}
    />
  );
}

function formatSpend(n: number) {
  return n.toLocaleString('ru-RU');
}

const POSITION_RANGE_LABEL: Record<BidChasingRange, string> = {
  '1-2': '1–2',
  '3-10': '3–10',
  '11-34': '14–35',
};

function SingleProductSpendProgressControls({ summary }: { summary: SingleProductDailyLimitSpendSummary }) {
  return (
    <div className="min-w-0">
      <p className="text-sm tabular-nums text-gray-900">
        <span className="font-semibold">{formatSpend(summary.spent)} ₽</span>
        <span className="font-normal text-gray-500"> из {formatSpend(summary.total)} ₽</span>
      </p>
      <div className="mt-2 h-1.5 w-full min-w-[4rem] max-w-[10rem] overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-[#9A41FE] transition-[width] duration-300"
          style={{ width: `${summary.progress}%` }}
        />
      </div>
    </div>
  );
}

/** Число кластеров в макете однотоварной кампании */
const SINGLE_PRODUCT_CLUSTER_COUNT = 234;

function SearchBidReadOnly({ value }: { value: string }) {
  return (
    <div
      className={`inline-flex h-9 ${PRODUCT_BID_INPUT_WIDTH_CLASS} items-center justify-end gap-0.5 rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm tabular-nums text-gray-900`}
    >
      <span>{value || '—'}</span>
      <span className="shrink-0 text-gray-400">₽</span>
    </div>
  );
}

export function CpcSingleProductHeroCard({
  campaignName,
  campaignId,
  campaignBudget,
  product,
  isCampaignActive,
  onCampaignActiveChange,
  onFinishCampaign,
  onRefill,
  isAutoRefillEnabled,
  onConfigureAutoRefill,
  isDailyLimitEnabled,
  onDailyLimitEnabledChange,
  dailyLimitValue,
  onDailyLimitValueChange,
  onDailyLimitBlur,
  onOpenAdvancedDailyLimit,
  dailyLimitSpendSummary,
  advancedDailyLimitSettingsApplied = false,
  hideDailyLimit = false,
  paymentModelLabel = 'CPC',
}: {
  campaignName: string;
  campaignId: number;
  campaignBudget: number;
  isCampaignActive: boolean;
  onCampaignActiveChange: (active: boolean) => void;
  onFinishCampaign: () => void;
  product: {
    nmId: number;
    productName: string;
    brand: string;
    articleSeller: string;
    category: string;
    imageUrl: string;
    stockLabel?: string;
  };
  onRefill: () => void;
  isAutoRefillEnabled: boolean;
  onConfigureAutoRefill: () => void;
  isDailyLimitEnabled: boolean;
  onDailyLimitEnabledChange: (enabled: boolean) => void;
  dailyLimitValue: string;
  onDailyLimitValueChange: (v: string) => void;
  onDailyLimitBlur: () => void;
  onOpenAdvancedDailyLimit: () => void;
  dailyLimitSpendSummary: SingleProductDailyLimitSpendSummary | null;
  advancedDailyLimitSettingsApplied?: boolean;
  hideDailyLimit?: boolean;
  paymentModelLabel?: 'CPC' | 'CPM';
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  return (
    <div className="mb-4 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
      <div className="flex min-h-[148px] flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex min-w-0 flex-1 gap-4">
          <HeroProductThumb
            nmId={product.nmId}
            imageUrl={product.imageUrl}
            category={product.category}
            alt={product.productName}
            className="h-[88px] w-[72px] shrink-0 rounded-xl border border-gray-100 bg-gray-50 object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <ToggleSwitch checked={isCampaignActive} onChange={onCampaignActiveChange} />
                <h1 className="mb-0 text-lg font-bold leading-snug text-gray-900">{campaignName}</h1>
              </div>
              <div className="relative shrink-0" ref={menuRef}>
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                  aria-label="Действия с кампанией"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
                {menuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-1 min-w-[12rem] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      className="block w-full px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-50"
                      onClick={() => {
                        setMenuOpen(false);
                        onConfigureAutoRefill();
                      }}
                    >
                      {isAutoRefillEnabled ? 'Автопополнение включено' : 'Автопополнение бюджета'}
                    </button>
                    <div className="my-1 border-t border-gray-100" role="separator" />
                    <button
                      type="button"
                      role="menuitem"
                      className="block w-full px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-50"
                      onClick={() => {
                        setMenuOpen(false);
                        onFinishCampaign();
                      }}
                    >
                      Завершить кампанию
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              {isCampaignActive ? (
                <span className="rounded-md bg-[#E8F5E9] px-2 py-0.5 font-medium text-[#2E7D32]">Активна</span>
              ) : (
                <span className="rounded-md bg-yellow-100 px-2 py-0.5 font-medium text-yellow-700">
                  Приостановлена
                </span>
              )}
              <span className="text-gray-500">{paymentModelLabel}</span>
              <span className="text-gray-500">ID {campaignId}</span>
            </div>
            <p className="mb-0 mt-3 text-xs leading-relaxed text-gray-500">
              <span className="text-gray-700">{product.productName}</span>
              <span className="mx-2 text-gray-300">·</span>
              {product.stockLabel ?? '1 000 шт'}
              <span className="mx-2 text-gray-300">·</span>
              Арт. продавца {product.articleSeller}
              <span className="mx-2 text-gray-300">·</span>
              Арт. WB {product.nmId}
            </p>
          </div>
        </div>
      </div>

      <div className="flex min-h-[148px] flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-gray-900">Бюджет</h2>
        <div className="mt-4 flex flex-1 flex-wrap items-start gap-x-8 gap-y-4">
          <div className="flex shrink-0 flex-col gap-2">
            <p className="mb-0 flex h-5 items-center text-sm text-gray-500">Денег на кампании</p>
            <div className="flex h-9 items-center">
              <button
                type="button"
                onClick={onRefill}
                className="mb-0 text-xl font-bold tabular-nums leading-none text-[#9A41FE] hover:text-purple-700 hover:underline"
                aria-label="Пополнить бюджет"
              >
                {campaignBudget.toLocaleString('ru-RU')} ₽
              </button>
            </div>
          </div>

          <div className="flex min-w-0 flex-nowrap items-start gap-x-8">
            {!hideDailyLimit ? (
            <div className="flex shrink-0 flex-col gap-2">
              <div className="flex h-5 min-w-0 items-center gap-2">
                <ToggleSwitch checked={isDailyLimitEnabled} onChange={onDailyLimitEnabledChange} />
                <span className="text-sm text-gray-500">Дневной лимит</span>
                <DailyLimitInfoTooltip />
              </div>
              <div className="flex h-9 items-center">
                {isDailyLimitEnabled ? (
                  <div className="flex h-9 w-[220px] shrink-0 items-center gap-1.5">
                    <div className="relative min-w-0 flex-1">
                      <input
                        type="text"
                        value={dailyLimitValue}
                        onChange={(e) => onDailyLimitValueChange(e.target.value)}
                        onBlur={onDailyLimitBlur}
                        className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2.5 pr-7 text-sm font-semibold tabular-nums text-gray-900 outline-none transition-colors focus:border-[#9A41FE] focus:ring-1 focus:ring-[#9A41FE]"
                        aria-label="Сумма дневного лимита"
                      />
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                        ₽
                      </span>
                    </div>
                    <div className="group relative shrink-0">
                      {advancedDailyLimitSettingsApplied ? (
                        <span
                          className="pointer-events-none absolute -top-1 left-1/2 z-[1] h-2 w-2 -translate-x-1/2 rounded-full bg-[#9A41FE]"
                          aria-hidden
                        />
                      ) : null}
                      <div
                        role="tooltip"
                        className="pointer-events-none absolute bottom-full left-1/2 z-[100] mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                      >
                        Расширенные настройки
                      </div>
                      <button
                        type="button"
                        onClick={onOpenAdvancedDailyLimit}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F2F2F7] text-gray-500 transition-colors hover:bg-[#e8e8ed] hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A41FE]/40"
                        aria-label="Расширенные настройки дневного лимита"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            ) : null}

            {!hideDailyLimit && isDailyLimitEnabled && dailyLimitSpendSummary ? (
              <div className="flex shrink-0 flex-col gap-2">
                <p className="mb-0 flex h-5 items-center text-sm text-gray-500">Истратили</p>
                <div className="min-h-9 flex flex-col justify-center">
                  <SingleProductSpendProgressControls summary={dailyLimitSpendSummary} />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CpcSingleProductStrategyCard({
  displayZones,
  onDisplayZonesChange,
  isBidChasingEnabled,
  bidChasingPositionLabel,
  searchBidDraft,
  onSearchBidDraftChange,
  onSearchBidBlur,
  bidChasingPosition,
  onSearchPositionTierSelect,
  recommendationsBidDraft,
  onRecommendationsBidDraftChange,
  onRecommendationsBidBlur,
  onOpenPositionStrategy,
  onSelectManualSearchStrategy,
}: {
  displayZones: { search: boolean; recommendations: boolean };
  onDisplayZonesChange: (patch: Partial<{ search: boolean; recommendations: boolean }>) => void;
  isBidChasingEnabled: boolean;
  bidChasingPositionLabel: string;
  searchBidDraft: string;
  onSearchBidDraftChange: (v: string) => void;
  onSearchBidBlur: () => void;
  bidChasingPosition: BidChasingRange;
  onSearchPositionTierSelect: (position: BidChasingRange) => void;
  recommendationsBidDraft: string;
  onRecommendationsBidDraftChange: (v: string) => void;
  onRecommendationsBidBlur: () => void;
  onOpenPositionStrategy: () => void;
  onSelectManualSearchStrategy: () => void;
}) {
  const [searchClustersExpanded, setSearchClustersExpanded] = useState(false);
  const [isSearchBidPickerOpen, setIsSearchBidPickerOpen] = useState(false);
  const searchBidPickerRef = useRef<HTMLDivElement>(null);
  const searchBidPickerPopoverRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!displayZones.search) setIsSearchBidPickerOpen(false);
  }, [displayZones.search]);

  const setZone = (key: 'search' | 'recommendations', checked: boolean) => {
    const next = { ...displayZones, [key]: checked };
    if (!next.search && !next.recommendations) return;
    onDisplayZonesChange({ [key]: checked });
  };

  const positionRangeLabel = POSITION_RANGE_LABEL[bidChasingPosition];

  return (
    <section className="mb-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900">Ставки и позиция</h2>

      <div className="mt-4 flex flex-wrap items-start gap-[40px]">
        <div className="flex w-fit shrink-0 flex-col items-start gap-2">
          <div className="mb-3.5 flex h-5 items-center gap-2">
            <ToggleSwitch
              checked={displayZones.recommendations}
              onChange={(c) => setZone('recommendations', c)}
            />
            <span className="text-sm text-gray-500">Рекомендации</span>
          </div>
          <div className="flex h-9 items-center">
            {displayZones.recommendations ? (
              <div className="relative w-[5.5rem]">
                <input
                  className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2.5 pr-7 text-sm font-semibold tabular-nums text-gray-900 outline-none focus:border-[#9A41FE] focus:ring-1 focus:ring-[#9A41FE]"
                  value={recommendationsBidDraft}
                  onChange={(e) => onRecommendationsBidDraftChange(e.target.value.replace(',', '.'))}
                  onBlur={onRecommendationsBidBlur}
                  aria-label="Ставка в рекомендациях"
                />
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  ₽
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex w-fit shrink-0 flex-col items-start gap-2">
          <div className="mb-3.5 flex h-5 items-center gap-2">
            <ToggleSwitch checked={displayZones.search} onChange={(c) => setZone('search', c)} />
            <span className="text-sm text-gray-500">Поиск</span>
          </div>
          <div className="flex h-9 items-center">
            {displayZones.search ? (
              isBidChasingEnabled ? (
                <SearchBidReadOnly value={searchBidDraft} />
              ) : (
                <ProductBidField
                  value={searchBidDraft}
                  onChange={(e) => onSearchBidDraftChange(e.target.value.replace(',', '.'))}
                  onBlur={onSearchBidBlur}
                />
              )
            ) : null}
          </div>
        </div>

        {displayZones.search ? (
          <>
            <div className="flex w-fit shrink-0 flex-col items-start gap-2">
              <p className="flex h-5 items-center text-sm text-gray-500">Позиция в поиске</p>
              <div className="flex h-9 items-center gap-2">
                <div className="inline-flex h-9 min-w-[4.5rem] items-center justify-center rounded-lg border border-gray-200 bg-[#F6F6F9] px-3 text-sm font-semibold tabular-nums text-gray-900">
                  {positionRangeLabel}
                </div>
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
                      onSelectPosition={onSearchPositionTierSelect}
                      onClose={() => setIsSearchBidPickerOpen(false)}
                    />
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex w-fit shrink-0 flex-col items-start gap-2">
              <p className="flex h-5 items-center text-sm text-gray-500">Удержание позиции</p>
              <div className="flex h-9 items-center">
                {isBidChasingEnabled ? (
                  <button
                    type="button"
                    onClick={onOpenPositionStrategy}
                    className="max-w-[11rem] truncate text-left text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {bidChasingPositionLabel}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenPositionStrategy}
                    className="h-9 shrink-0 rounded-lg bg-[#F2F2F7] px-4 text-sm font-medium text-gray-800 hover:bg-[#e8e8ed]"
                  >
                    Настроить
                  </button>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => setSearchClustersExpanded((v) => !v)}
        className="mt-5 flex w-full items-center justify-between gap-2 border-t border-gray-100 pt-4 text-left"
        aria-expanded={searchClustersExpanded}
      >
        <span className="text-base font-bold text-gray-900">
          Кластера{' '}
          <span className="font-normal tabular-nums text-gray-500">{SINGLE_PRODUCT_CLUSTER_COUNT}</span>
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-gray-500 transition-transform ${
            searchClustersExpanded ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>
      {searchClustersExpanded ? (
        <div className="mt-3">
          <CpcTopSearchClustersBlock nestedInSearchZone />
        </div>
      ) : null}
    </section>
  );
}
