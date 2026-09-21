import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, MoreVertical, Sparkles } from './Icons';
import { DynamicDailyLimitMark } from './DynamicDailyLimitMark';
import { CpcTopSearchClustersBlock } from './CpcTopSearchClustersBlock';
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

function SingleProductSpendProgressControls({
  summary,
  compact = false,
}: {
  summary: SingleProductDailyLimitSpendSummary;
  compact?: boolean;
}) {
  return (
    <div className={`min-w-0 w-full ${compact ? 'max-w-[9.5rem]' : 'max-w-[14rem]'}`}>
      <p className="text-sm tabular-nums text-gray-900">
        <span className="font-semibold">{formatSpend(summary.spent)} ₽</span>
        <span className="font-normal text-gray-500"> из {formatSpend(summary.total)} ₽</span>
      </p>
      <div
        className={`mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200 ${
          compact ? 'w-[3.15rem]' : 'w-full'
        }`}
      >
        <div
          className="h-full rounded-full bg-[#9A41FE] transition-[width] duration-300"
          style={{ width: `${summary.progress}%` }}
        />
      </div>
    </div>
  );
}

export function AutomationColumn({
  buttonLabel,
  onButtonClick,
  settingsApplied = false,
  activeLinkLabel,
  activeLinkVariant = 'purple',
}: {
  buttonLabel: string;
  onButtonClick: () => void;
  settingsApplied?: boolean;
  /** Если задано — вместо кнопки показываем ссылку (например, выбранная позиция или условие трат) */
  activeLinkLabel?: string;
  activeLinkVariant?: 'purple' | 'blue';
}) {
  const activeLinkClass =
    activeLinkVariant === 'blue'
      ? 'text-blue-600 hover:text-blue-700'
      : 'text-[#9A41FE] hover:text-purple-700';

  const rootClassName = activeLinkLabel
    ? 'flex w-fit max-w-[10rem] min-w-0 flex-col items-start gap-2.5'
    : 'flex w-fit max-w-full shrink-0 flex-col items-start gap-2.5';

  return (
    <div className={rootClassName}>
      <div className="flex h-5 items-center gap-1.5">
        <Sparkles className="h-4 w-4 shrink-0 text-[#9A41FE]" aria-hidden />
        <span className="text-sm text-gray-500">Автоматизация</span>
      </div>
      {activeLinkLabel ? (
        <button
          type="button"
          onClick={onButtonClick}
          className={`block max-w-full min-w-0 min-h-0 text-left text-[11px] font-medium leading-snug transition-colors hover:underline break-words ${activeLinkClass}`}
        >
          {activeLinkLabel}
        </button>
      ) : (
        <button
          type="button"
          onClick={onButtonClick}
          className="inline-flex h-9 w-fit shrink-0 self-start items-center justify-center whitespace-nowrap rounded-lg bg-[#F2F2F7] px-3 text-sm font-medium text-gray-800 transition-colors hover:bg-[#e8e8ed]"
        >
          {buttonLabel}
        </button>
      )}
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

function SearchPositionIndicator({ positionRangeLabel }: { positionRangeLabel: string }) {
  return (
    <p className="mt-0.5 text-[10px] leading-tight tabular-nums text-gray-500">
      {positionRangeLabel} позиция
    </p>
  );
}

export function CpcSingleProductHeroCard({
  campaignName,
  campaignId,
  product,
  isCampaignActive,
  onCampaignActiveChange,
  onFinishCampaign,
  isAutoRefillEnabled,
  onConfigureAutoRefill,
  paymentModelLabel = 'CPC',
  activeBadgeTextOverride,
  onOpenRankingFactors,
}: {
  campaignName: string;
  campaignId: number;
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
  isAutoRefillEnabled: boolean;
  onConfigureAutoRefill: () => void;
  paymentModelLabel?: 'CPC' | 'CPM';
  activeBadgeTextOverride?: string;
  onOpenRankingFactors?: () => void;
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
    <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex min-w-0 items-start gap-4">
        <HeroProductThumb
          nmId={product.nmId}
          imageUrl={product.imageUrl}
          category={product.category}
          alt={product.productName}
          className="h-11 w-11 shrink-0 rounded-lg border border-gray-100 bg-gray-50 object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <ToggleSwitch checked={isCampaignActive} onChange={onCampaignActiveChange} />
              <h1 className="mb-0 min-w-0 text-base font-bold leading-snug text-gray-900 sm:text-lg">
                {campaignName}
              </h1>
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
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
            {isCampaignActive ? (
              <span className="rounded-md bg-[#E8F5E9] px-2 py-0.5 font-medium text-[#2E7D32]">
                {activeBadgeTextOverride ?? 'Активна'}
              </span>
            ) : (
              <span className="rounded-md bg-yellow-100 px-2 py-0.5 font-medium text-yellow-700">
                Приостановлена
              </span>
            )}
            <span>{paymentModelLabel}</span>
            <span>ID {campaignId}</span>
            <span>{product.productName}</span>
            <span>{product.stockLabel ?? '1 000 шт'}</span>
            <span>Арт. продавца {product.articleSeller}</span>
            <span>Арт. WB {product.nmId}</span>
            {onOpenRankingFactors ? (
              <button
                type="button"
                onClick={onOpenRankingFactors}
                className="font-medium text-gray-500 transition-colors hover:text-gray-700"
              >
                Факторы ранжирования <span className="text-[#F07167]">-2</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CpcSingleProductBudgetCard({
  campaignBudget,
  onRefill,
  isAutoRefillEnabled,
  onAutoRefillEnabledChange,
  onConfigureAutoRefill,
  isDailyLimitEnabled,
  onDailyLimitEnabledChange,
  dailyLimitValue,
  onDailyLimitValueChange,
  onDailyLimitBlur,
  onOpenAdvancedDailyLimit,
  dailyLimitSpendSummary,
  advancedDailyLimitSettingsApplied = false,
  spendRulesLinkLabel,
  showSpendRulesAutomation = false,
  hideDailyLimit = false,
  dynamicDailyLimitCampaignId,
  dynamicDailyLimitRub = 0,
}: {
  campaignBudget: number;
  onRefill: () => void;
  isAutoRefillEnabled: boolean;
  onAutoRefillEnabledChange: (enabled: boolean) => void;
  onConfigureAutoRefill: () => void;
  isDailyLimitEnabled: boolean;
  onDailyLimitEnabledChange: (enabled: boolean) => void;
  dailyLimitValue: string;
  onDailyLimitValueChange: (v: string) => void;
  onDailyLimitBlur: () => void;
  onOpenAdvancedDailyLimit: () => void;
  dailyLimitSpendSummary: SingleProductDailyLimitSpendSummary | null;
  advancedDailyLimitSettingsApplied?: boolean;
  spendRulesLinkLabel?: string;
  showSpendRulesAutomation?: boolean;
  hideDailyLimit?: boolean;
  dynamicDailyLimitCampaignId?: number;
  dynamicDailyLimitRub?: number;
}) {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900">Бюджет</h2>
      <div className="mt-4 flex min-w-0 max-w-full flex-wrap items-start gap-x-5 gap-y-3 overflow-hidden">
        <div className="flex shrink-0 flex-col gap-1.5">
          <p className="mb-0 whitespace-nowrap text-sm text-gray-500">Остаток</p>
          <button
            type="button"
            onClick={onRefill}
            className="whitespace-nowrap pr-2.5 text-left text-xl font-bold tabular-nums leading-none text-[#9A41FE] transition-colors hover:text-purple-700 hover:underline"
            aria-label="Пополнить бюджет"
          >
            {campaignBudget.toLocaleString('ru-RU')} ₽
          </button>
          <div className="flex items-center gap-1.5 pt-0.5">
            <ToggleSwitch
              checked={isAutoRefillEnabled}
              onChange={onAutoRefillEnabledChange}
            />
            <button
              type="button"
              onClick={onConfigureAutoRefill}
              className="whitespace-nowrap text-left text-sm text-gray-500 transition-colors hover:text-[#9A41FE]"
            >
              Автопополнение
            </button>
          </div>
        </div>

        {!hideDailyLimit ? (
          <div className="mr-2.5 flex w-[8.5rem] shrink-0 flex-col gap-1.5 pr-2.5">
            <div className="flex items-center gap-1.5">
              <ToggleSwitch
                checked={isDailyLimitEnabled}
                onChange={onDailyLimitEnabledChange}
              />
              <span className="whitespace-nowrap text-sm text-gray-500">Дневной лимит</span>
              {advancedDailyLimitSettingsApplied && dynamicDailyLimitRub > 0 ? (
                <DynamicDailyLimitMark
                  dailyLimitRub={dynamicDailyLimitRub}
                  campaignId={dynamicDailyLimitCampaignId}
                  compact
                />
              ) : null}
            </div>
            <div className="relative w-full">
              <input
                type="text"
                disabled={!isDailyLimitEnabled}
                value={dailyLimitValue}
                onChange={(e) => onDailyLimitValueChange(e.target.value)}
                onBlur={onDailyLimitBlur}
                className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2.5 pr-7 text-sm font-semibold tabular-nums text-gray-900 outline-none transition-colors focus:border-[#9A41FE] focus:ring-1 focus:ring-[#9A41FE] disabled:cursor-not-allowed disabled:border-gray-100 disabled:bg-gray-50 disabled:text-gray-400"
                aria-label="Сумма дневного лимита"
              />
              <span
                className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs ${
                  isDailyLimitEnabled ? 'text-gray-400' : 'text-gray-300'
                }`}
              >
                ₽
              </span>
            </div>
          </div>
        ) : null}

        {!hideDailyLimit && isDailyLimitEnabled && dailyLimitSpendSummary ? (
          <div className="flex w-[9.5rem] shrink-0 flex-col gap-1.5">
            <p className="mb-0 whitespace-nowrap text-sm text-gray-500">Истратили</p>
            <SingleProductSpendProgressControls summary={dailyLimitSpendSummary} compact />
          </div>
        ) : null}

        {!hideDailyLimit && showSpendRulesAutomation ? (
          <div
            className={
              spendRulesLinkLabel
                ? 'min-w-0 max-w-[10rem] shrink'
                : 'w-fit shrink-0 max-w-full'
            }
          >
            <AutomationColumn
              buttonLabel="Задать правила"
              onButtonClick={onOpenAdvancedDailyLimit}
              settingsApplied={advancedDailyLimitSettingsApplied}
              activeLinkLabel={spendRulesLinkLabel}
            />
          </div>
        ) : null}
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

  const bidInputClass =
    'h-9 w-full min-w-[5.5rem] rounded-lg border border-gray-200 bg-white px-2.5 pr-7 text-sm font-semibold tabular-nums text-gray-900 outline-none focus:border-[#9A41FE] focus:ring-1 focus:ring-[#9A41FE]';

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900">Ставки</h2>

      <div className="mt-4 flex flex-1 flex-col gap-6 sm:flex-row sm:flex-wrap sm:items-start sm:gap-x-6 sm:gap-y-4">
        <div className="flex w-full min-w-[8.5rem] max-w-[10rem] shrink-0 flex-col">
          <div className="mb-2 flex h-5 items-center gap-2">
            <ToggleSwitch
              checked={displayZones.recommendations}
              onChange={(c) => setZone('recommendations', c)}
            />
            <span className="text-sm text-gray-500">Рекомендации</span>
          </div>
          {displayZones.recommendations ? (
            <div className="relative w-full">
              <input
                className={bidInputClass}
                value={recommendationsBidDraft}
                onChange={(e) => onRecommendationsBidDraftChange(e.target.value.replace(',', '.'))}
                onBlur={onRecommendationsBidBlur}
                aria-label="Ставка в рекомендациях"
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                ₽
              </span>
            </div>
          ) : (
            <div className="h-9" aria-hidden />
          )}
        </div>

        <div className="flex w-fit shrink-0 flex-col">
          <div className="mb-2 flex h-5 items-center gap-2">
            <ToggleSwitch checked={displayZones.search} onChange={(c) => setZone('search', c)} />
            <span className="text-sm text-gray-500">Поиск</span>
          </div>
          {displayZones.search ? (
            <>
              <div className="flex items-center gap-1">
                {isBidChasingEnabled ? (
                  <SearchBidReadOnly value={searchBidDraft} />
                ) : (
                  <ProductBidField
                    value={searchBidDraft}
                    onChange={(e) => onSearchBidDraftChange(e.target.value.replace(',', '.'))}
                    onBlur={onSearchBidBlur}
                  />
                )}
                <div className="relative shrink-0" ref={searchBidPickerRef}>
                  <BidHistogramButton
                    isActive={isSearchBidPickerOpen}
                    onClick={() => {
                      if (isBidChasingEnabled) onSelectManualSearchStrategy();
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
              <SearchPositionIndicator positionRangeLabel={positionRangeLabel} />
            </>
          ) : (
            <div className="h-9" aria-hidden />
          )}
        </div>

        <div
          className={
            isBidChasingEnabled
              ? 'min-w-0 max-w-full w-fit shrink-0'
              : 'w-fit shrink-0 max-w-full'
          }
        >
        <AutomationColumn
          buttonLabel="Удерживать позицию"
          onButtonClick={onOpenPositionStrategy}
          settingsApplied={isBidChasingEnabled}
          activeLinkLabel={
            isBidChasingEnabled
              ? `${positionRangeLabel.replace(/–/g, '-')} позиция`
              : undefined
          }
        />
        </div>
      </div>
    </section>
  );
}

export function CpcSingleProductClustersCard() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="mb-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
        aria-expanded={expanded}
      >
        <span className="text-xl font-bold text-gray-900">
          Кластера{' '}
          <span className="font-normal tabular-nums text-gray-500">{SINGLE_PRODUCT_CLUSTER_COUNT}</span>
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-gray-500 transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>
      {expanded ? (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <CpcTopSearchClustersBlock nestedInSearchZone />
        </div>
      ) : null}
    </section>
  );
}
