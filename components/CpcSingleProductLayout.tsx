import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from './Icons';
import { DailyLimitInfoTooltip } from './DailyLimitInfoTooltip';
import { CpcTopSearchClustersBlock } from './CpcTopSearchClustersBlock';
import { CPC_TOP_SEARCH_CLUSTERS_ROWS } from '../utils/cpcTopSearchClustersDemo';
import { ProductBidField } from './ProductBidField';
import { SearchBidPositionHint } from './SearchBidPositionHint';
import { BidHistogramButton, SearchBidPositionPicker } from './SearchBidPositionPicker';
import type { BidChasingRange } from '../utils/cpcBidChasingPositionTiers';
import {
  PRODUCT_TABLE_THUMB_FALLBACK,
  resolveProductTableThumbSrc,
} from './SuccessPageTestData';

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
    } ${checked ? (disabled ? 'bg-purple-300' : 'bg-purple-600') : 'bg-gray-300'}`}
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

export function CpcSingleProductHeroCard({
  campaignName,
  campaignId,
  campaignBudget,
  product,
  onRefill,
  isAutoRefillEnabled,
  onAutoRefillChange,
}: {
  campaignName: string;
  campaignId: number;
  campaignBudget: number;
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
  onAutoRefillChange: (enabled: boolean) => void;
}) {
  return (
    <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 gap-4">
          <HeroProductThumb
            nmId={product.nmId}
            imageUrl={product.imageUrl}
            category={product.category}
            alt={product.productName}
            className="!h-[76px] !w-[60px] shrink-0 rounded-xl border border-gray-100 bg-gray-50 object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="mb-0 text-lg font-bold text-gray-900">{campaignName}</h1>
              <ToggleSwitch checked onChange={() => {}} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700">Активна</span>
              <span className="text-gray-500">CPC</span>
              <span className="text-gray-500">ID {campaignId}</span>
            </div>
            <p className="mb-0 mt-3 text-sm font-medium text-gray-900">{product.productName}</p>
            <p className="mt-1 text-xs text-gray-500">
              {product.stockLabel ?? '1 000 шт'} · Арт. продавца {product.articleSeller} · Арт. WB{' '}
              {product.nmId}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm text-gray-500">Денег на кампании</p>
          <div className="mt-1 flex items-center justify-end gap-2">
            <p className="mb-0 text-2xl font-bold tabular-nums text-gray-900">
              {campaignBudget.toLocaleString('ru-RU')} ₽
            </p>
            <button
              type="button"
              onClick={onRefill}
              className="flex h-9 w-9 items-center justify-center rounded-[16px] bg-[#9A41FE] text-lg font-bold text-white hover:bg-purple-700"
              aria-label="Пополнить бюджет"
            >
              +
            </button>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <ToggleSwitch checked={isAutoRefillEnabled} onChange={onAutoRefillChange} />
            <span className="text-xs text-gray-600">Автопополнение бюджета</span>
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
  onOpenSpendStrategy,
  onSelectManualSearchStrategy,
  isDailyLimitEnabled,
  onDailyLimitEnabledChange,
  dailyLimitValue,
  onDailyLimitValueChange,
  onDailyLimitBlur,
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
  onOpenSpendStrategy: () => void;
  onSelectManualSearchStrategy: () => void;
  isDailyLimitEnabled: boolean;
  onDailyLimitEnabledChange: (enabled: boolean) => void;
  dailyLimitValue: string;
  onDailyLimitValueChange: (v: string) => void;
  onDailyLimitBlur: () => void;
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

  const setZone = (key: 'search' | 'recommendations', checked: boolean) => {
    const next = { ...displayZones, [key]: checked };
    if (!next.search && !next.recommendations) return;
    onDisplayZonesChange({ [key]: checked });
  };

  return (
    <section className="mb-8 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900">Управление стратегией</h2>

      <div className="mt-3 space-y-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-purple-100 bg-[#FAFAFC] px-3 py-2.5">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <ToggleSwitch checked={isDailyLimitEnabled} onChange={onDailyLimitEnabledChange} />
            <span className="text-sm font-semibold text-gray-900">Дневной лимит</span>
            <DailyLimitInfoTooltip />
          </div>
          {isDailyLimitEnabled ? (
            <div className="relative w-[7.5rem] shrink-0">
              <input
                type="text"
                value={dailyLimitValue}
                onChange={(e) => onDailyLimitValueChange(e.target.value)}
                onBlur={onDailyLimitBlur}
                className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 pr-7 text-sm font-medium tabular-nums outline-none focus:border-purple-500"
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                ₽
              </span>
            </div>
          ) : null}
          <button
            type="button"
            onClick={onOpenSpendStrategy}
            className="ml-auto shrink-0 text-sm font-medium text-[#6366f1] transition-colors hover:text-purple-700"
          >
            Расширенные настройки
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div
            className={`min-w-0 rounded-xl border border-gray-100 p-3 ${
              displayZones.search ? 'md:col-span-2' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <ToggleSwitch checked={displayZones.search} onChange={(c) => setZone('search', c)} />
              <span className="text-sm font-semibold text-gray-900">Показываем в поиске</span>
            </div>

            {!displayZones.search ? (
              <p className="mt-2 text-xs text-gray-400">Продвижение в поиске выключено</p>
            ) : (
              <>
              <div className="mt-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={onSelectManualSearchStrategy}
                    className={`min-w-0 rounded-xl border-2 p-2.5 text-left transition-colors ${
                      !isBidChasingEnabled
                        ? 'border-purple-600 bg-[#F6F2FF] shadow-sm'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <span className="text-sm font-semibold text-gray-900">Временная позиция</span>
                    {!isBidChasingEnabled ? (
                      <div
                        className="mt-2 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-start gap-1.5">
                          <div className="shrink-0">
                            <ProductBidField
                              value={searchBidDraft}
                              onChange={(e) => onSearchBidDraftChange(e.target.value.replace(',', '.'))}
                              onBlur={onSearchBidBlur}
                            />
                            <SearchBidPositionHint
                              selectedPosition={bidChasingPosition}
                              onSelectPosition={onSearchPositionTierSelect}
                            />
                          </div>
                          <div className="relative shrink-0" ref={searchBidPickerRef}>
                            <BidHistogramButton
                              isActive={isSearchBidPickerOpen}
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsSearchBidPickerOpen((open) => !open);
                              }}
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
                    ) : (
                      <p className="mt-1 text-[11px] leading-snug text-gray-500">CPC задаёте вы</p>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={onOpenPositionStrategy}
                    className={`min-w-0 rounded-xl border-2 p-2.5 text-left transition-colors ${
                      isBidChasingEnabled
                        ? 'border-purple-600 bg-[#F6F2FF] shadow-sm'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <span className="text-sm font-semibold text-gray-900">Постоянная позиция в поиске</span>
                    {isBidChasingEnabled ? (
                      <p className="mt-2 text-xs font-medium text-gray-800">
                        {bidChasingPositionLabel}
                        <span className="font-normal text-purple-700"> · Настроить</span>
                      </p>
                    ) : (
                      <p className="mt-1 text-[11px] leading-snug text-gray-500">
                        Будем держать нужную позицию
                      </p>
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-4 border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => setSearchClustersExpanded((v) => !v)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-1 py-1.5 text-left hover:bg-gray-50"
                  aria-expanded={searchClustersExpanded}
                >
                  <span className="text-sm font-semibold text-gray-900">
                    Кластера в поиске
                    <span className="font-normal text-gray-500">
                      {' '}
                      · {CPC_TOP_SEARCH_CLUSTERS_ROWS.length}
                    </span>
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 stroke-[2.5] text-gray-900 transition-transform ${
                      searchClustersExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {searchClustersExpanded ? (
                  <div className="mt-2">
                    <CpcTopSearchClustersBlock nestedInSearchZone />
                  </div>
                ) : null}
              </div>
              </>
            )}
          </div>

          <div className="rounded-xl border border-gray-100 p-3">
            <div className="flex items-center gap-2">
              <ToggleSwitch
                checked={displayZones.recommendations}
                onChange={(c) => setZone('recommendations', c)}
              />
              <span className="text-sm font-semibold text-gray-900">Показываем в рекомендациях</span>
            </div>
            {displayZones.recommendations ? (
              <div className="mt-2 flex h-9 w-24 items-center rounded-lg border border-gray-200 px-2 text-sm tabular-nums">
                <input
                  className="w-full bg-transparent text-sm outline-none"
                  value={recommendationsBidDraft}
                  onChange={(e) => onRecommendationsBidDraftChange(e.target.value.replace(',', '.'))}
                  onBlur={onRecommendationsBidBlur}
                />
                <span className="text-xs text-gray-400">₽</span>
              </div>
            ) : (
              <p className="mt-2 text-xs text-gray-400">Выкл.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
