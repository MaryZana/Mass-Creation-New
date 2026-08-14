import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  CAMPAIGNS_WITH_WIDGETS_V1_PATH,
  isCampaignsWidgetsV1Layout,
  PRODUCT_PROMOTION_CONCEPT_PATH,
} from '../constants/campaignListRoutes';
import {
  DAILY_LIMIT_ABSOLUTE_MIN,
  demoMaxCpcBidForCampaignId,
  minDailyLimitForMaxBid,
  isDailyLimitBelowRecommendedForMaxBid,
} from '../utils/cpcDailyLimitBid';
import { normalizeCpmBidRub } from '../utils/cpmBidRounding';
import { useCpmBidRoundedAlert } from './CpmBidRoundedAlert';
import { OverviewMiniWidgetsForCampaignsList } from '../pages/OverviewPage';
import { DailyLimitInfoTooltip } from './DailyLimitInfoTooltip';
import { DailyLimitBidMismatchHint } from './DailyLimitBidMismatchHint';
import { ConceptPromotionInsightStrip } from './ConceptPromotionInsightStrip';
import {
  NotPromotedBonusCampaignBanner,
  NotPromotedBonusCampaignModal,
  CampaignsListBonusBanner,
  notPromotedV3BonusOffer,
} from './NotPromotedBonusCampaignOffer';
import ReactDOM from 'react-dom';
import { Checkbox } from 'antd';
import { 
    Plus, 
    Menu,
    Search, 
    Calendar, 
    Filter, 
    CheckCircle, 
    X, 
    ChevronDown, 
    ChevronRight,
    HelpCircle, 
    ArrowUp,
    Zap,
    AlertTriangle,
    ThumbsUp,
    Loader,
    Info,
    Download,
    ClipboardCheck,
    Clock,
    Settings,
    Gift,
    RefreshCw,
    MoreVertical,
    Trash2,
    Edit2,
    Check,
    Sparkles,
    Wallet,
    TrendingUp,
} from './Icons';
import { CampaignRecord } from '../types';
import {
  campaignMatchesInsightFilter,
  useCampaignsInsightFilterOptional,
} from '../context/CampaignsInsightFilterContext';
import {
  PRODUCTS_SOURCE,
  PRODUCTS_SOURCE_PROFILE_2,
  CATEGORIES,
  type CampaignSpec,
  type ProductSource,
  PRODUCT_TABLE_THUMB_FALLBACK,
  productTableThumbFallbackUrl,
  resolveProductTableThumbSrc,
  productTableThumbUrl,
  PREBUILT_LIST_SINGLE_PRODUCT_CPC_CAMPAIGN_ID,
} from './SuccessPageTestData';
import {
  useProfile,
  isNewSellerProfile,
  type ProfileId,
  type RepeatLaunchPreset,
  type SingleCampaignSeedProduct,
} from './ProfileContext';
import { NEW_SELLER_EMPTY_LIST } from './newSeller/newSellerProfileData';
import {
  BonusCampaignNotificationPeekCard,
  BonusCampaignNotificationStack,
  ListHeaderVariant3Panel,
  ListHeaderVariant3StatCard,
  ListHeaderVariant4Panel,
  ListHeaderVariant4Strip,
  LIST_HEADER_V4_BONUS_REFILL_CAMPAIGN_COUNT,
  LIST_HEADER_V4_BONUS_REFILL_CAMPAIGN_NAMES,
  type BonusCampaignNotification,
} from './BonusCampaignRepeatBanner';
import type { BonusNotificationCardVariant } from './BonusCampaignRepeatBanner';
import { ReferralCampaignCreatedNotice } from './ReferralCampaignCreatedNotice';
import { BudgetRefillModal } from './BudgetRefillModal';
import {
  CampaignListAutomationModals,
  type CampaignListAutomationKind,
  type CampaignListAutomationModalTarget,
} from './CampaignListAutomationModals';

// --- Constants ---
const TOTAL_PROMO_BONUS = 226660517;
const BONUS_PACKAGES = [
  { id: 'p1', amount: 209527397, maxPercent: 100, expiry: '20.03.26', displayBurn: '209.4M' },
  { id: 'p2', amount: 17133120, maxPercent: 99, expiry: '27.03.26', displayBurn: '168.3k' },
];

// --- Banner (Figma: "Баннер" node-id 53:22668) ---
const PRODUCTS_PROMO_BANNER = {
  backgroundImg: 'https://www.figma.com/api/mcp/asset/8cf71de5-9bd9-4cc6-bf8c-ff6d6f2e65d3',
  imageYoutube: 'https://www.figma.com/api/mcp/asset/925a8051-c81f-408c-a642-1c0d2ebfa9ac',
  imageMarketingFold: 'https://www.figma.com/api/mcp/asset/36924ccf-5961-4003-b15a-b0efa538fb04',
  imageEllipse: 'https://www.figma.com/api/mcp/asset/94c99742-95a9-495f-a2ca-024371f3990f',
  imageRenderBg: 'https://www.figma.com/api/mcp/asset/99b8bcfd-9a2f-42fc-ac9a-6b71b7802da1',
  closeIcon: 'https://www.figma.com/api/mcp/asset/f64d6b12-fd4b-440c-a39d-1b5d48583f77',
} as const;

// --- Helpers ---
const getPlural = (number: number, one: string, two: string, five: string) => { let n = Math.abs(number); n %= 100; if (n >= 5 && n <= 20) { return five; } n %= 10; if (n === 1) { return one; } if (n >= 2 && n <= 4) { return two; } return five; };

// --- Sub-Components ---
const CompactLaunchLoader: React.FC<{ total: number }> = ({ total }) => (
    <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-100 flex items-center gap-4 animate-in fade-in duration-300">
        <Loader className="w-6 h-6 text-purple-600 animate-spin shrink-0" />
        <div>
            <h2 className="text-lg font-bold text-gray-900">
                Запускаем {total} {getPlural(total, 'кампанию', 'кампании', 'кампаний')}...
            </h2>
            <p className="text-gray-500 text-sm">Это может занять некоторое время. Процесс не прервётся, если вы уйдёте со страницы.</p>
        </div>
        <div className="ml-auto w-48 h-2 bg-gray-200 rounded-full overflow-hidden relative">
            <div className="absolute top-0 left-0 h-full bg-purple-500 animate-loader-progress"></div>
        </div>
        <style>{`
            @keyframes loader-progress {
                0% { transform: translateX(-100%) scaleX(0.5); }
                50% { transform: translateX(0) scaleX(1); }
                100% { transform: translateX(100%) scaleX(0.5); }
            }
            .animate-loader-progress {
                width: 100%;
                animation: loader-progress 1.8s ease-in-out infinite;
            }
        `}</style>
    </div>
);


const Toast = ({ show, message, onClose, isSuccess = false, isError = false, durationMs = 3000, aboveOverlay = false }: { show: boolean, message: string, onClose: () => void, isSuccess?: boolean, isError?: boolean, durationMs?: number, aboveOverlay?: boolean }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, durationMs);
      return () => clearTimeout(timer);
    }
  }, [show, onClose, durationMs]);
  
  if (!show) return null;
  
  const bgClass = isError ? 'bg-red-600' : isSuccess ? 'bg-green-600' : 'bg-gray-900';
  const zClass = aboveOverlay ? 'z-[110]' : 'z-[100]';
  return (
    <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 ${bgClass} text-white px-6 py-3 rounded-lg shadow-xl ${zClass} flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 max-w-md ${isError ? 'pointer-events-none' : ''}`}>
      <span className="font-medium whitespace-pre-line">{message}</span>
    </div>
  );
};

const ToggleSwitch = ({ id, checked, onChange, disabled = false }: { id?: string; checked: boolean; onChange: (checked: boolean) => void, disabled?: boolean }) => ( <button id={id} role="switch" aria-checked={checked} onClick={() => !disabled && onChange(!checked)} disabled={disabled} className={`relative inline-flex h-4 w-7 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${ disabled ? 'cursor-not-allowed bg-gray-200' : 'cursor-pointer' } ${ checked ? (disabled ? 'bg-purple-300' : 'bg-purple-600') : 'bg-gray-300' }`} > <span aria-hidden="true" className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${ checked ? 'translate-x-3' : 'translate-x-0' }`} /> </button> );

const Pagination = ({ total, pageSize, current, onChange }: { total: number, pageSize: number, current: number, onChange: (page: number) => void }) => {
    const totalPages = Math.ceil(total / pageSize);
    if (totalPages <= 1) return null;
    const handlePrev = () => { if (current > 1) onChange(current - 1); };
    const handleNext = () => { if (current < totalPages) onChange(current + 1); };

    let items = [];
    if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) items.push(i);
    } else {
        items.push(1);
        if (current > 3) items.push('...');
        if (current > 2) items.push(current - 1);
        if (current > 1 && current < totalPages) items.push(current);
        if (current < totalPages - 1) items.push(current + 1);
        if (current < totalPages - 2) items.push('...');
        items.push(totalPages);
    }
    const uniqueItems = [...new Set(items)];

    return ( <div className="pagination-container"> <button onClick={handlePrev} className={`pagination-item ${current === 1 ? 'disabled' : ''}`} disabled={current === 1}>&lt;</button> {uniqueItems.map((item, index) => ( <button key={index} onClick={() => typeof item === 'number' && onChange(item)} className={`pagination-item ${current === item ? 'active' : ''} ${typeof item !== 'number' ? 'disabled' : ''}`} disabled={typeof item !== 'number'}> {item} </button> ))} <button onClick={handleNext} className={`pagination-item ${current === totalPages ? 'disabled' : ''}`} disabled={current === totalPages}>&gt;</button> </div> );
};

interface SuccessPageProps {
  isLaunching: boolean;
  launchTotal: number;
  launchResult: { success: number; error: number } | null;
  failedCampaigns: CampaignRecord[];
  onClearLaunchResult: () => void;
  onNavigateToCreation: () => void;
  /** Массовое создание с конкретными товарами */
  onNavigateToCreationWithProducts?: (
    items: { nmId: number; productName: string; imageUrl: string; category: string }[],
  ) => void;
  /** Массовое создание с товарами «хорошая конверсия» (вариант 4) */
  onNavigateToCreationWithGrowingDemand?: () => void;
  onOpenUploadEditsModal: () => void;
  selectedCampaigns: string[];
  onSelectionChange: (ids: string[]) => void;
  isApplyingEdits: boolean;
  onOpenReview: () => void;
  onCancelEdits: () => void;
  onOpenHistoryModal: () => void;
  showUploadHint?: boolean;
  onDismissUploadHint?: () => void;
  onOpenCpcCampaign: (payload: {
    campaignId: number;
    name: string;
    paymentModel?: 'CPC' | 'CPM';
    remainingBudget: number | null;
    dailyLimit: number | null;
    scheduledDailyLimit: number | null;
    dailyLimitExhausted?: boolean;
    fromReadyToRepeat?: boolean;
    repeatLaunchPreset?: RepeatLaunchPreset;
    campaignStatus?: 'active' | 'paused';
    openBidRecommendations?: boolean;
    bidRecommendationProduct?: { name: string; image: string };
  }) => void;
  onUpdateCampaignData?: (campaignId: number, data: { name?: string; remainingBudget?: number | null; dailyLimit?: number | null; scheduledDailyLimit?: number | null; maxCpcBidRub?: number; status?: 'active' | 'paused'; statusText?: string }) => void;
  onRegisterUpdateFn?: (fn: (campaignId: number, data: { name?: string; remainingBudget?: number | null; dailyLimit?: number | null; scheduledDailyLimit?: number | null; maxCpcBidRub?: number; status?: 'active' | 'paused'; statusText?: string }) => void) => void;
  /** Открыть массовую настройку дневного лимита для текущего выделения (панель в App) */
  onRegisterBulkDailyLimitOpener?: (open: () => void) => void;
  onOpenSingleCampaign?: () => void;
  /** Патчи данных кампаний с CPC-страницы (список при этом размонтирован) */
  campaignListPatches?: Record<number, CampaignListDataPatch>;
  onPersistCampaignListPatch?: (campaignId: number, data: CampaignListDataPatch) => void;
}

interface DisplayCampaign {
  id: string;
  image: string;
  name: string;
  /** Категория товара для сортировки по категории */
  category?: string;
  status: 'active' | 'paused' | 'draft' | 'error';
  statusText: string;
  campaignId: number;
  tags: { text: string; icon: React.ReactNode; type: 'warning' | 'info' | 'error' }[];
  campaignTags: string[];
  /** Теги товара (дубль от товара для отображения в кампании) */
  productTags?: string[];
  /** ID товара для учёта productTagsOverride */
  productId?: string;
  /** Несколько товаров в одной кампании — объединяем их теги в списке */
  productIds?: string[];
  type: 'CPC' | 'CPM';
  typeDetails: string;
  typeIcons: React.ReactNode[];
  autoRefill: boolean;
  autoRefillStatus: 'ok' | 'error';
  budget: number | null;
  remainingBudget: number | null;
  dailyLimit?: number | null;
  scheduledDailyLimit?: number | null;
  /** Макс. CPC-ставка в кампании (для минимума дневного лимита в списке) */
  maxCpcBidRub?: number;
  /** true = лимит на сегодня израсходован, показы остановлены */
  dailyLimitExhausted?: boolean;
  spend: number | null;
  impressions: number | null;
  ctr: number | null;
  orders: number | null;
  spendShare: number | null;
  /** Вторая строка в списке: кампания за бонусы, открывается как из «Готовы к повтору» */
  isBonusCampaign?: boolean;
}

type CampaignListDataPatch = {
  name?: string;
  remainingBudget?: number | null;
  dailyLimit?: number | null;
  scheduledDailyLimit?: number | null;
  maxCpcBidRub?: number;
  status?: 'active' | 'paused';
  statusText?: string;
};

function applyCampaignListPatches(
  campaigns: DisplayCampaign[],
  patches: Record<number, CampaignListDataPatch> | undefined,
): DisplayCampaign[] {
  if (!patches || Object.keys(patches).length === 0) return campaigns;
  return campaigns.map((c) => {
    const patch = patches[c.campaignId];
    if (!patch) return c;
    return {
      ...c,
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.remainingBudget !== undefined && { remainingBudget: patch.remainingBudget }),
      ...(patch.dailyLimit !== undefined && { dailyLimit: patch.dailyLimit }),
      ...(patch.scheduledDailyLimit !== undefined && { scheduledDailyLimit: patch.scheduledDailyLimit }),
      ...(patch.maxCpcBidRub !== undefined && { maxCpcBidRub: patch.maxCpcBidRub }),
      ...(patch.status !== undefined && { status: patch.status }),
      ...(patch.statusText !== undefined && { statusText: patch.statusText }),
    };
  });
}

const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return 'Н/Д';
    return num.toLocaleString('ru-RU');
}
const formatCurrency = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return 'Н/Д';
    return `${num.toLocaleString('ru-RU')} ₽`;
}

const formatForDisplay = (num: number | string | undefined | null): string => {
    if (num === null || num === undefined || num === '') return '0';
    const numValue = typeof num === 'string' ? parseDisplayValue(num) : num;
    if (isNaN(numValue) || numValue === null || numValue === undefined) return '0';
    return numValue.toLocaleString('ru-RU', { useGrouping: true });
};

const parseDisplayValue = (str: string): number => {
    return Number(String(str).replace(/\s/g, '').replace(/,/g, '.'));
};
const formatPercentage = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return 'Н/Д';
    return `${num.toFixed(1).replace('.', ',')}%`;
}

const currentDate = new Date().toLocaleDateString('ru-RU');

// Типы для дерева товаров (вкладка «Товары»)
type ProductCampaign = {
  id: string; campaignId: number; name: string; status: 'active' | 'paused' | 'draft' | 'error'; statusText: string;
  type: string; typeDetails: string; budget: number; remainingBudget: number; autoRefill: boolean;
  dailyLimit: number | null; dailyLimitExhausted?: boolean; spend: number; impressions: number; ctr: number; orders: number; spendShare: number; avgPosition?: number;
  changeSpend?: number; changeImpressions?: number; changeCtr?: number; changeOrders?: number; changeShare?: number; changePosition?: number;
};
type ProductRow = {
  id: string; image: string; name: string; article: string; articleWb: string; articleSeller: string; category: string; campaignCount: number; tags: string[];
  campaigns: ProductCampaign[];
  /** Остаток на складе (шт.), для вкладки «Не продвигаются». */
  stockLeft: number;
  agg?: { spend: number; impressions: number; ctr: number; orders: number; spendShare: number; changeSpend?: number; changeImpressions?: number; changeCtr?: number; changeOrders?: number; changeShare?: number };
};

const PRODUCTS_STOCK_COLUMN_ID = 'stock';
const PRODUCTS_RECOMMENDED_BID_CPM_SEARCH_COLUMN_ID = 'recommendedBidCpmSearch';
const PRODUCTS_RECOMMENDED_BID_CPM_REC_COLUMN_ID = 'recommendedBidCpmRec';
const PRODUCTS_RECOMMENDED_BID_CPC_SEARCH_COLUMN_ID = 'recommendedBidCpcSearch';

const CONCEPT_NOT_PROMOTED_RECOMMENDED_BID_COLUMN_IDS = [
  PRODUCTS_RECOMMENDED_BID_CPC_SEARCH_COLUMN_ID,
  PRODUCTS_RECOMMENDED_BID_CPM_SEARCH_COLUMN_ID,
  PRODUCTS_RECOMMENDED_BID_CPM_REC_COLUMN_ID,
] as const;

function isConceptNotPromotedRecommendedBidColumnId(columnId: string): boolean {
  return (CONCEPT_NOT_PROMOTED_RECOMMENDED_BID_COLUMN_IDS as readonly string[]).includes(
    columnId,
  );
}
/** Пустая колонка: на широком экране отталкивает блок статистики вправо. */
const PRODUCTS_STAT_SPACER_COLUMN_ID = 'statSpacer';
const PRODUCTS_STAT_SPACER_CELL_CLASS = 'w-full min-w-0 p-0';
const PRODUCTS_STOCK_TH_CLASS = 'p-4 text-left font-normal whitespace-nowrap min-w-[108px]';
const PRODUCTS_STOCK_TD_CLASS = 'p-4 align-middle text-left whitespace-nowrap tabular-nums';

type ProductStockSizeRow = { label: string; qty: number };

type ProductStockBreakdown = {
  displayTotal: number;
  wb: { total: number; sizes: ProductStockSizeRow[] };
  seller: { total: number; sizes: ProductStockSizeRow[] };
};

const PRODUCT_STOCK_SIZE_PRESETS: Record<string, readonly (readonly string[])[]> = {
  Платья: [
    ['XS / 40', 'S / 44', 'M / 46', 'L / 48', 'XL / 50'],
    ['XXS / 38', 'XS / 40', 'S / 42', 'M / 44', 'L / 46', 'XL / 48'],
    ['40', '42', '44', '46', '48'],
  ],
  Футболки: [
    ['XS / 40', 'S / 44', 'M / 46', 'L / 48', 'XL / 50'],
    ['S / 44', 'M / 46', 'L / 48', 'XL / 50', 'XXL / 52'],
    ['40', '42', '44', '46'],
  ],
  Кроссовки: [
    ['36', '37', '38', '39', '40', '41', '42'],
    ['38', '39', '40', '41', '42', '43'],
    ['40', '41', '42', '43', '44'],
  ],
  Сумки: [
    ['One size'],
    ['Мини', 'Средний', 'Макси'],
  ],
};

/** Артикул WB демо-товара с длинной размерной сеткой (платье «Ривьера», pr1) */
const PRODUCT_STOCK_SCROLLABLE_GRID_NM_ID = 1_001_001;

function buildExtendedScrollDemoSizeLabels(category: string): string[] {
  const labels: string[] = [];
  if (category === 'Платья' || category === 'Футболки') {
    for (let ru = 38; ru <= 62; ru++) {
      labels.push(`${ru} RU`);
      labels.push(`XS–${ru}`);
      if (ru % 2 === 0) {
        labels.push(`${ru}/44`);
      }
    }
  } else {
    for (let eu = 33; eu <= 50; eu++) {
      labels.push(`${eu}`);
      if (eu < 50) {
        labels.push(`${eu},5`);
      }
    }
  }
  return labels;
}

function productStockSizeLabelsForSeed(seed: number, category: string): string[] {
  if (seed === PRODUCT_STOCK_SCROLLABLE_GRID_NM_ID) {
    return buildExtendedScrollDemoSizeLabels(category);
  }
  const sized = Object.prototype.hasOwnProperty.call(PRODUCT_STOCK_SIZE_PRESETS, category);
  if (!sized) {
    return ['Всего'];
  }
  const presets = PRODUCT_STOCK_SIZE_PRESETS[category]!;
  return [...presets[Math.abs(seed) % presets.length]!];
}

function distributeStockAcrossSizeLabels(
  labels: string[],
  baseStock: number,
  seed: number,
): ProductStockSizeRow[] {
  if (labels.length === 1) {
    return [{ label: labels[0]!, qty: baseStock }];
  }
  if (baseStock === 0) {
    return labels.map((label) => ({ label, qty: 0 }));
  }
  const weights = labels.map((_, i) => (seed + i * 17) % 11 + 1);
  const weightSum = weights.reduce((a, b) => a + b, 0);
  let allocated = 0;
  return labels.map((label, i) => {
    const isLast = i === labels.length - 1;
    const qty = isLast
      ? Math.max(0, baseStock - allocated)
      : Math.floor((baseStock * weights[i]!) / weightSum);
    allocated += qty;
    return { label, qty };
  });
}

type StockHoverProductItem = {
  key: string;
  name: string;
  image: string;
  category: string;
  stockLeft: number;
  stockSeed: number;
};

function demoProductStockLeft(source: Pick<ProductSource, 'id' | 'article' | 'category'>): number {
  return buildProductStockBreakdownFromSource(source).displayTotal;
}

function buildProductStockBreakdownFromSource(
  source: Pick<ProductSource, 'id' | 'article' | 'category'>,
): ProductStockBreakdown {
  const seed =
    Number.parseInt(source.article, 10) ||
    [...source.id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const bucket = seed % 20;
  const baseStock =
    bucket === 0 ? 0 : bucket <= 2 ? 1 + (seed % 8) : 20 + (seed % 480);
  return buildProductStockBreakdownValues(seed, source.category, baseStock);
}

function buildProductStockBreakdown(product: ProductRow): ProductStockBreakdown {
  const seed = productRowNmId(product) || 1;
  return buildProductStockBreakdownValues(seed, product.category, product.stockLeft);
}

function buildProductStockBreakdownValues(
  seed: number,
  category: string,
  baseStock: number,
): ProductStockBreakdown {
  const sizeLabels = productStockSizeLabelsForSeed(seed, category);
  const sized = sizeLabels.length > 1 || sizeLabels[0] !== 'Всего';
  const richSizedDemo = sized && baseStock > 0 && seed % 3 === 1 && sizeLabels.length >= 5;

  let wbSizes: ProductStockSizeRow[];
  if (!sized) {
    wbSizes = [{ label: 'Всего', qty: baseStock }];
  } else if (richSizedDemo) {
    const demoQtyPattern = [100_000, 0, 100, 20, 1_240, 55, 12];
    wbSizes = sizeLabels.map((label, i) => ({
      label,
      qty: demoQtyPattern[i] ?? Math.max(0, (seed + i * 13) % 400),
    }));
  } else {
    wbSizes = distributeStockAcrossSizeLabels(sizeLabels, baseStock, seed);
  }

  const wbTotal = wbSizes.reduce((sum, row) => sum + row.qty, 0);
  const sellerTotal = sized && seed % 11 === 0 ? (seed % 90) + 5 : 0;
  const sellerSizes: ProductStockSizeRow[] = sized
    ? sizeLabels.map((label, i) => ({
        label,
        qty:
          sellerTotal === 0
            ? 0
            : Math.floor((sellerTotal * ((seed + i * 3) % 7)) / Math.max(1, sizeLabels.length * 2)),
      }))
    : [{ label: 'Всего', qty: sellerTotal }];
  const sellerSum = sellerSizes.reduce((sum, row) => sum + row.qty, 0);

  return {
    displayTotal: wbTotal + sellerSum,
    wb: { total: wbTotal, sizes: wbSizes },
    seller: { total: sellerSum, sizes: sellerSizes },
  };
}

const STOCK_HOVER_THUMB_SLOTS = 5;
const STOCK_HOVER_SCROLL_BODY_MAX_PX = 400;
/** Заголовок колонки + итого до списка размеров */
const STOCK_HOVER_COLUMN_HEADER_PX = 92;
/** Строка размера с gap-2.5 */
const STOCK_HOVER_SIZE_ROW_PX = 26;

function stockHoverScrollBodyHeightPx(items: StockHoverProductItem[]): number | null {
  if (items.length <= 1) return null;
  let maxRows = 0;
  for (const item of items) {
    const breakdown = buildBreakdownForStockItem(item);
    maxRows = Math.max(maxRows, breakdown.wb.sizes.length);
  }
  const content = STOCK_HOVER_COLUMN_HEADER_PX + maxRows * STOCK_HOVER_SIZE_ROW_PX;
  return Math.min(STOCK_HOVER_SCROLL_BODY_MAX_PX, content);
}

function stockHoverItemFromProductRow(product: ProductRow): StockHoverProductItem {
  return {
    key: product.id,
    name: product.name,
    image: product.image,
    category: product.category,
    stockLeft: product.stockLeft,
    stockSeed: productRowNmId(product) || 1,
  };
}

function stockHoverItemsForCampaign(
  campaign: DisplayCampaign,
  productTree: ProductRow[],
): StockHoverProductItem[] {
  const ids =
    campaign.productIds?.length > 0
      ? campaign.productIds
      : campaign.productId
        ? [campaign.productId]
        : [];
  const fromTree = ids
    .map((id) => productTree.find((p) => p.id === id))
    .filter((p): p is ProductRow => Boolean(p));
  if (fromTree.length > 0) {
    return fromTree.map(stockHoverItemFromProductRow);
  }
  const seed = Number.parseInt(campaign.productId?.replace(/\D/g, '') ?? '0', 10) || campaign.campaignId;
  const demoStock = Math.max(0, (seed % 97) * 1000 + 459);
  return [
    {
      key: campaign.productId ?? campaign.id,
      name: campaign.name.split(' / ')[0]?.trim() || campaign.name,
      image: campaign.image,
      category: campaign.category ?? '',
      stockLeft: demoStock,
      stockSeed: seed,
    },
  ];
}

function buildBreakdownForStockItem(item: StockHoverProductItem): ProductStockBreakdown {
  return buildProductStockBreakdownValues(item.stockSeed, item.category, item.stockLeft);
}

function ProductStockBreakdownColumn({
  title,
  total,
  sizes,
  totalClassName,
  emphasizeQty = false,
}: {
  title: string;
  total: number;
  sizes: ProductStockSizeRow[];
  totalClassName: string;
  emphasizeQty?: boolean;
}) {
  return (
    <div className="min-w-[168px] flex-1">
      <div className="text-sm leading-snug text-gray-500">{title}</div>
      <div className={`mt-1 text-[28px] font-bold leading-none tabular-nums tracking-tight ${totalClassName}`}>
        {total.toLocaleString('ru-RU')} шт
      </div>
      <div className="mt-4 flex flex-col gap-2.5">
        {sizes.map((row) => (
          <div key={row.label} className="flex items-baseline gap-2 text-sm leading-none">
            <span className="shrink-0 text-gray-600">{row.label}</span>
            <span
              className="min-h-[1px] min-w-[12px] flex-1 border-b border-dotted border-gray-300"
              aria-hidden
            />
            <span
              className={`shrink-0 tabular-nums ${
                row.qty === 0
                  ? 'text-gray-400'
                  : emphasizeQty
                    ? 'font-bold text-gray-900'
                    : 'font-medium text-gray-900'
              }`}
            >
              {row.qty.toLocaleString('ru-RU')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductStockDetailHoverCard({
  items,
  anchorRect,
  onPointerEnterCard,
  onPointerLeaveCard,
}: {
  items: StockHoverProductItem[];
  anchorRect: DOMRect;
  onPointerEnterCard: () => void;
  onPointerLeaveCard: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollPanelRef = useRef<HTMLDivElement>(null);
  const safeActiveIndex = Math.min(activeIndex, Math.max(0, items.length - 1));
  const activeItem = items[safeActiveIndex] ?? items[0];
  const breakdown = useMemo(
    () => (activeItem ? buildBreakdownForStockItem(activeItem) : null),
    [activeItem],
  );

  const multiScrollBodyHeightPx = useMemo(
    () => stockHoverScrollBodyHeightPx(items),
    [items],
  );

  useEffect(() => {
    scrollPanelRef.current?.scrollTo({ top: 0 });
  }, [safeActiveIndex]);

  const showOverflowTail = items.length > STOCK_HOVER_THUMB_SLOTS;
  const thumbSlotCount = showOverflowTail ? STOCK_HOVER_THUMB_SLOTS : items.length;
  const overflowBadge =
    showOverflowTail && items.length > STOCK_HOVER_THUMB_SLOTS
      ? items.length - STOCK_HOVER_THUMB_SLOTS
      : 0;

  const cardWidth = 440;
  const gap = 14;
  const top = anchorRect.top + anchorRect.height / 2;
  const left = anchorRect.left - gap;

  if (!activeItem || !breakdown) return null;

  return (
    <div
      className="pointer-events-auto fixed z-[220]"
      style={{
        top,
        left,
        transform: 'translate(-100%, -50%)',
        width: cardWidth,
      }}
      onMouseEnter={onPointerEnterCard}
      onMouseLeave={onPointerLeaveCard}
    >
      <div className="relative" style={{ width: cardWidth }}>
        <div
          className="pointer-events-none absolute right-0 top-1/2 z-10 h-3 w-3 translate-x-1/2 -translate-y-1/2 rotate-45 border-r border-t border-gray-100 bg-white"
          aria-hidden
        />
        <div className="overflow-hidden rounded-[20px] border border-gray-100 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.14)]">
          <div className="shrink-0 px-5 pt-4">
            <div className="mb-3 flex h-11 flex-wrap items-center gap-2">
              {Array.from({ length: thumbSlotCount }).map((_, slotIndex) => {
                const isOverflowSlot =
                  showOverflowTail && slotIndex === STOCK_HOVER_THUMB_SLOTS - 1;
                const itemIndex = slotIndex;
                const item = items[itemIndex];
                if (!item) return null;
                const thumbSrc = resolveProductTableThumbSrc(item.key, item.image, item.category);
                const selected = safeActiveIndex === itemIndex;
                return (
                  <button
                    key={`${item.key}-${slotIndex}`}
                    type="button"
                    className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border bg-gray-50 transition-shadow ${
                      selected ? 'border-[#9A41FE] ring-2 ring-[#9A41FE]/35' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onMouseEnter={() => setActiveIndex(itemIndex)}
                    aria-label={item.name}
                  >
                    <img src={thumbSrc} alt="" className="h-full w-full object-cover" />
                    {isOverflowSlot && overflowBadge > 0 ? (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-semibold text-white">
                        +{overflowBadge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <p
              className="mb-0 min-h-5 truncate pb-3 text-sm font-medium leading-5 text-gray-600"
              title={activeItem.name}
            >
              {activeItem.name}
            </p>
          </div>
          <div
            ref={scrollPanelRef}
            className="overflow-y-auto overflow-x-hidden custom-scrollbar px-5 pb-4"
            style={
              multiScrollBodyHeightPx != null
                ? {
                    height: multiScrollBodyHeightPx,
                    maxHeight: STOCK_HOVER_SCROLL_BODY_MAX_PX,
                  }
                : { maxHeight: STOCK_HOVER_SCROLL_BODY_MAX_PX }
            }
          >
            <div className="flex gap-6">
              <ProductStockBreakdownColumn
                title="На складах WB"
                total={breakdown.wb.total}
                sizes={breakdown.wb.sizes}
                totalClassName="text-gray-900"
                emphasizeQty
              />
              <ProductStockBreakdownColumn
                title="На ваших складах"
                total={breakdown.seller.total}
                sizes={breakdown.seller.sizes}
                totalClassName={breakdown.seller.total === 0 ? 'text-red-500' : 'text-gray-900'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function useStockRemainderHoverPortal(
  items: StockHoverProductItem[],
) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncAnchorRect = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    setAnchorRect(el.getBoundingClientRect());
  }, []);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), 120);
  }, [clearCloseTimer]);

  const openHover = useCallback(() => {
    clearCloseTimer();
    syncAnchorRect();
    setOpen(true);
  }, [clearCloseTimer, syncAnchorRect]);

  useEffect(() => {
    if (!open) return;
    syncAnchorRect();
    const onScrollOrResize = () => syncAnchorRect();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open, syncAnchorRect]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  const portal =
    open && anchorRect && items.length > 0 && typeof document !== 'undefined'
      ? ReactDOM.createPortal(
          <ProductStockDetailHoverCard
            items={items}
            anchorRect={anchorRect}
            onPointerEnterCard={clearCloseTimer}
            onPointerLeaveCard={scheduleClose}
          />,
          document.body,
        )
      : null;

  return {
    anchorRef,
    openHover,
    scheduleClose,
    portal,
  };
}

function ProductStockRemainderCell({
  product,
  compact = false,
}: {
  product: ProductRow;
  compact?: boolean;
}) {
  const items = useMemo(() => [stockHoverItemFromProductRow(product)], [product]);
  const breakdown = useMemo(() => buildProductStockBreakdown(product), [product]);
  const { anchorRef, openHover, scheduleClose, portal } = useStockRemainderHoverPortal(items);
  const amountClassName = productStockAmountClassName(breakdown.displayTotal, compact);

  return (
    <>
      <span
        ref={anchorRef}
        className={`cursor-default underline decoration-dotted decoration-gray-300 underline-offset-4 ${amountClassName}`}
        onMouseEnter={openHover}
        onMouseLeave={scheduleClose}
      >
        {formatProductStockAmount(breakdown.displayTotal)}
      </span>
      {portal}
    </>
  );
}

function CampaignStockRemainderCell({
  campaign,
  productTree,
}: {
  campaign: DisplayCampaign;
  productTree: ProductRow[];
}) {
  const items = useMemo(
    () => stockHoverItemsForCampaign(campaign, productTree),
    [campaign, productTree],
  );
  const displayTotal = useMemo(
    () => items.reduce((sum, item) => sum + buildBreakdownForStockItem(item).displayTotal, 0),
    [items],
  );
  const { anchorRef, openHover, scheduleClose, portal } = useStockRemainderHoverPortal(items);
  const amountClassName = productStockAmountClassName(displayTotal, false);

  return (
    <>
      <span
        ref={anchorRef}
        className={`cursor-default underline decoration-dotted decoration-gray-300 underline-offset-4 ${amountClassName}`}
        onMouseEnter={openHover}
        onMouseLeave={scheduleClose}
      >
        {formatProductStockAmount(displayTotal)}
      </span>
      {portal}
    </>
  );
}

function formatProductStockAmount(total: number): string {
  return `${total.toLocaleString('ru-RU')} шт`;
}

function productStockAmountClassName(total: number, compact = false): string {
  const toneClass = total === 0 ? 'text-gray-400' : 'text-gray-900';
  return `font-semibold tabular-nums ${compact ? 'text-xs' : 'text-sm'} ${toneClass}`;
}

function ProductStockStaticTotal({
  total,
  compact = false,
}: {
  total: number;
  compact?: boolean;
}) {
  return (
    <span className={productStockAmountClassName(total, compact)}>
      {formatProductStockAmount(total)}
    </span>
  );
}

function productStockTableTdClass(compactTable: boolean): string {
  return compactTable ? CONCEPT_NOT_PROMOTED_STOCK_TD_CLASS : PRODUCTS_STOCK_TD_CLASS;
}

/** Столбцы статистики на вкладке «Товары» (слева направо после служебных колонок). */
const PRODUCTS_STAT_COLUMN_LABELS = [
  'Затраты',
  'Показы',
  'CTR',
  'Заказы',
  'Доля затрат',
  'Средняя позиция',
  'Клики',
  'Добавления в корзину',
  'Сумма заказов',
  'CPC',
  'CPO',
  'CR',
  'CPM',
  'Отмены технические',
] as const;

const PRODUCTS_PRIMARY_COLUMN_IDS = [
  { id: 'product', label: 'Товар' },
  { id: 'campaignType', label: 'Тип кампании' },
  { id: 'bid', label: 'Ставка' },
  { id: 'budgetRemainder', label: 'Остаток бюджета' },
] as const;

const PRODUCTS_MIDDLE_COLUMN_IDS = [
  { id: 'dailyLimit', label: 'Дневной лимит' },
  { id: 'tags', label: 'Ярлыки' },
] as const;

type ProductsPickTab =
  | 'all_products'
  | 'not_promoted'
  | 'not_promoted_v3'
  | 'promoted'
  | 'growth'
  | 'high_conversion'
  | 'ab'
  | 'promo';

function isNotPromotedProductsPickTab(tab: ProductsPickTab): boolean {
  return tab === 'not_promoted' || tab === 'not_promoted_v3';
}

/** Вкладки товаров на концепте товарного продвижения. */
const CONCEPT_PRODUCTS_PICK_TABS: {
  id: Extract<
    ProductsPickTab,
    | 'all_products'
    | 'promoted'
    | 'not_promoted'
    | 'not_promoted_v3'
  >;
  label: string;
}[] = [
  { id: 'promoted', label: 'Товары' },
  { id: 'not_promoted', label: 'Без продвижения' },
  { id: 'not_promoted_v3', label: 'V3' },
  { id: 'all_products', label: 'Мультикарточки' },
];

const PRODUCTS_PICK_TABS: { id: ProductsPickTab; label: string }[] = [
  { id: 'promoted', label: 'Продвигаются' },
  { id: 'not_promoted', label: 'Не продвигаются' },
  { id: 'growth', label: 'Рост заказов' },
  { id: 'high_conversion', label: 'Высокая конверсия' },
  { id: 'ab', label: 'А/Б тест' },
  { id: 'promo', label: 'В акциях' },
];

type ProductsSecondaryPickTab = 'all' | 'high_conversion' | 'ab';

const PRODUCTS_PICK_SECONDARY_TABS: { id: ProductsSecondaryPickTab; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'high_conversion', label: 'Перспективные' },
  { id: 'ab', label: 'Новые' },
];

const PRODUCTS_PICK_SECONDARY_TAB_VISUAL: Record<
  ProductsSecondaryPickTab,
  {
    Icon: React.FC<{ className?: string }> | null;
  }
> = {
  all: {
    Icon: null,
  },
  high_conversion: {
    Icon: TrendingUp,
  },
  ab: {
    Icon: Sparkles,
  },
};

type ProductsPickCtaTab = 'growth' | 'high_conversion' | 'ab';

const PRODUCTS_PICK_PROMOTION_CTA_CONFIG: Record<
  ProductsPickCtaTab,
  {
    message: string;
    iconWrapClass: string;
    Icon: React.FC<{ className?: string }>;
  }
> = {
  growth: {
    message: 'Заказы растут. Получите больше охват с продвижением',
    iconWrapClass: 'bg-emerald-100 text-emerald-600',
    Icon: ArrowUp,
  },
  high_conversion: {
    message: 'Вашими товарами интересуются. Получите больше заказов с продвижением',
    iconWrapClass: 'bg-violet-100 text-violet-600',
    Icon: ThumbsUp,
  },
  ab: {
    message: 'Товары тестируют креативы. Получите больше охват с продвижением',
    iconWrapClass: 'bg-sky-100 text-sky-600',
    Icon: Sparkles,
  },
};

function productsPickPromotionCtaTab(
  tab: ProductsPickTab | ProductsSecondaryPickTab,
): ProductsPickCtaTab | null {
  if (tab === 'growth' || tab === 'high_conversion' || tab === 'ab') {
    return tab;
  }
  return null;
}

function ProductsPickPromotionCtaBanner({ tab }: { tab: ProductsPickCtaTab }) {
  const { message, iconWrapClass, Icon } = PRODUCTS_PICK_PROMOTION_CTA_CONFIG[tab];
  return (
    <div className="mx-4 flex items-center gap-3 px-4 py-3 sm:mx-6" role="note">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconWrapClass}`}
        aria-hidden
      >
        <Icon className="h-5 w-5" />
      </span>
      <p className="mb-0 text-sm font-medium leading-snug text-gray-900">{message}</p>
    </div>
  );
}

const PRODUCT_BID_BULK_ACTIONS = [
  { id: 'cpc', label: 'Изменить ставку за клик' },
  { id: 'search', label: 'Изменить ставку в поиске' },
  { id: 'recommendations', label: 'Изменить ставку в рекомендациях' },
] as const;

type ProductBidBulkModalKind = (typeof PRODUCT_BID_BULK_ACTIONS)[number]['id'];

const PRODUCT_BID_MODAL_TITLES: Record<ProductBidBulkModalKind, string> = {
  cpc: 'Изменить ставку за клик',
  search: 'Изменить ставку в поиске',
  recommendations: 'Изменить ставку в рекомендациях',
};

function productBidPresets(kind: ProductBidBulkModalKind): number[] {
  return kind === 'cpc' ? [10, 15, 20] : [150, 300, 500];
}

function productBidMin(kind: ProductBidBulkModalKind): number {
  return kind === 'cpc' ? 10 : 150;
}

function ProductBulkBidField({
  value,
  onChange,
  presets,
  min,
  applyCpmStep = false,
  onCpmBidRounded,
}: {
  value: number;
  onChange: (value: number) => void;
  presets: number[];
  min: number;
  applyCpmStep?: boolean;
  onCpmBidRounded?: (roundedRub: number) => void;
}) {
  const [inputValue, setInputValue] = useState(String(value || ''));
  useEffect(() => {
    setInputValue(String(value || ''));
  }, [value]);

  const commit = (raw: string) => {
    const parsed = parseDisplayValue(raw);
    if (Number.isNaN(parsed)) return;
    let numericValue = parsed;
    if (applyCpmStep) {
      const { value: stepped, didRoundFromInput } = normalizeCpmBidRub(numericValue, min);
      if (didRoundFromInput) onCpmBidRounded?.(stepped);
      numericValue = stepped;
    } else if (numericValue < min) {
      numericValue = min;
    }
    onChange(numericValue);
    setInputValue(String(numericValue));
  };

  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-300 shadow-sm">
      <div className="relative bg-white">
        <input
          type="text"
          value={inputValue}
          placeholder="Ставка"
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={() => commit(inputValue)}
          className="hide-arrows w-full bg-transparent px-2 py-2 text-left text-sm font-medium outline-none"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
          ₽
        </span>
      </div>
      <div className="flex h-2 w-full border-t border-gray-200">
        {presets.map((p, index) => (
          <button
            key={p}
            type="button"
            onClick={() => {
              setInputValue(String(p));
              onChange(p);
            }}
            title={`Установить ставку ${p} ₽`}
            className={`relative h-full flex-1 transition-colors ${
              Number(value) === p ? 'bg-green-300' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {index > 0 ? <div className="absolute bottom-0 left-0 top-0 w-px bg-white" /> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

function isProductCampaignCpmManual(camp: ProductCampaign): boolean {
  return camp.type === 'CPM' && /ручн/i.test(camp.typeDetails);
}

function formatProductCampaignTypeLabel(camp: ProductCampaign): string {
  const details = camp.typeDetails?.trim();
  if (!details) return camp.type;
  return `${camp.type} · ${details}`;
}

/** Третья строка в блоке кампании в списке: «Единая» / «Ручная» (CPC и CPM). */
function listCampaignBidModeSubtitle(typeDetails?: string): string | null {
  const details = typeDetails?.trim();
  if (!details) return null;
  if (/един/i.test(details)) return 'Единая ставка';
  if (/ручн/i.test(details)) return 'Ручная ставка';
  return null;
}

function ProductCampaignTypeCell({ type }: { type: string }) {
  return (
    <>
      <div className="font-semibold text-gray-900">{type}</div>
      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
        <span className="rounded bg-gray-100 p-1">
          {type === 'CPC' ? (
            <Search className="h-4 w-4 text-gray-400" />
          ) : (
            <ThumbsUp className="h-4 w-4 text-gray-400" />
          )}
        </span>
      </div>
    </>
  );
}

function defaultProductCampaignBid(camp: ProductCampaign): number {
  return camp.type === 'CPC' ? 10 + (camp.campaignId % 11) : 150 + (camp.campaignId % 351);
}

function defaultProductCampaignSearchBid(camp: ProductCampaign): number {
  return 150 + (camp.campaignId % 200);
}

function defaultProductCampaignRecommendationsBid(camp: ProductCampaign): number {
  return 160 + (camp.campaignId % 190);
}

function productCampaignBidMin(camp: ProductCampaign): number {
  return camp.type === 'CPC' ? 10 : 150;
}

function conceptNotPromotedProductBidSeed(product: ProductRow): number {
  const fromArticle = Number.parseInt(String(product.articleWb ?? '').replace(/\D/g, ''), 10);
  if (Number.isFinite(fromArticle) && fromArticle > 0) return fromArticle;
  return [...product.id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

type ConceptCpcPositionTierDemo = {
  key: string;
  label: string;
  bidRub: number;
  clicksPerDay: number;
};

type ConceptCpmBenchmarkTierDemo = {
  key: string;
  title: string;
  description?: string;
  budgetRub?: number;
  impressions?: number;
  clicks?: number;
  bidRub: number;
};

function placementBidScale(placement: 'search' | 'recommendations'): number {
  return placement === 'search' ? 1 : 0.82;
}

function demoCpcSearchRecommendedTiers(product: ProductRow): ConceptCpcPositionTierDemo[] {
  const seed = conceptNotPromotedProductBidSeed(product);
  const tier12 = Math.round((42 + (seed % 9)) * 100) / 100;
  const tier310 = Math.round((27 + (seed % 7)) * 100) / 100;
  const tier1134 = Math.round((15 + (seed % 5)) * 100) / 100;
  return [
    {
      key: 'search-1-2',
      label: '1–2 позиции',
      bidRub: tier12,
      clicksPerDay: 900 + (seed % 200),
    },
    {
      key: 'search-3-10',
      label: '3–10 позиции',
      bidRub: tier310,
      clicksPerDay: 450 + (seed % 120),
    },
    {
      key: 'search-11-34',
      label: '11–34 позиции',
      bidRub: tier1134,
      clicksPerDay: Math.max(8, 12 + (seed % 10)),
    },
  ];
}

function demoCpmSearchRecommendedTiers(product: ProductRow): ConceptCpmBenchmarkTierDemo[] {
  const seed = conceptNotPromotedProductBidSeed(product);
  return [
    {
      key: 'search-top2',
      title: 'Ставка за ТОП-2',
      description: 'Минимальная ставка за первые две позиции в поиске',
      bidRub: 1180 + (seed % 80),
    },
    {
      key: 'search-leaders',
      title: 'Ставка лидеров',
      budgetRub: 4800,
      impressions: 12000,
      clicks: 320 + (seed % 80),
      bidRub: 380 + (seed % 60),
    },
    {
      key: 'search-competitive',
      title: 'Конкурентная ставка',
      budgetRub: 480,
      impressions: 1700,
      clicks: 280 + (seed % 90),
      bidRub: 165 + (seed % 45),
    },
  ];
}

function demoCpmRecommendationsBidRub(product: ProductRow): number {
  const seed = conceptNotPromotedProductBidSeed(product);
  return Math.round((290 + (seed % 85)) * placementBidScale('recommendations'));
}

function demoCpcSearchRecommendedBidNa(product: ProductRow): boolean {
  return conceptNotPromotedProductBidSeed(product) % 7 === 0;
}

function demoCpmSearchRecommendedBidNa(product: ProductRow): boolean {
  return conceptNotPromotedProductBidSeed(product) % 11 === 0;
}

function demoCpmRecommendationsBidNa(product: ProductRow): boolean {
  return conceptNotPromotedProductBidSeed(product) % 2 === 0;
}

function conceptFormatBidVolumeCompact(value: number): string {
  if (value >= 1000) {
    const thousands = value / 1000;
    if (thousands >= 10) return `${Math.round(thousands)}K`;
    const rounded = Math.round(thousands * 10) / 10;
    return `${rounded}K`.replace('.0K', 'K');
  }
  return formatForDisplay(Math.round(value));
}

function conceptRecommendedCpcDailyClicksSubtitle(tier: ConceptCpcPositionTierDemo): string {
  const daily = Math.max(8, Math.round(tier.clicksPerDay / 45));
  return `~ ${conceptFormatBidVolumeCompact(daily)} клика/дн`;
}

function conceptRecommendedCpmDailyImpressionsSubtitle(
  product: ProductRow,
  tier: ConceptCpmBenchmarkTierDemo,
): string {
  const seed = conceptNotPromotedProductBidSeed(product);
  const daily = tier.impressions ?? 15000 + (seed % 12000);
  return `~ ${conceptFormatBidVolumeCompact(daily)} показа/дн`;
}

function ConceptRecommendedBidNaCell({ reserveChartSlot = false }: { reserveChartSlot?: boolean }) {
  return (
    <div className="flex w-full min-w-0 items-start justify-end gap-0.5 py-0.5">
      <span className="text-right text-sm font-semibold text-gray-400">Н/Д</span>
      {reserveChartSlot ? (
        <span className="inline-block h-7 w-7 shrink-0" aria-hidden />
      ) : null}
    </div>
  );
}

function ConceptRecommendedBidMetricStack({
  bidRub,
  subtitle,
  chart,
}: {
  bidRub: number;
  subtitle?: string;
  chart?: React.ReactNode;
}) {
  return (
    <div className="flex w-full min-w-0 items-start justify-end gap-0.5 py-0.5">
      <div className="min-w-0 text-right leading-tight">
        <p className="mb-0 text-sm font-semibold tabular-nums text-gray-900">
          {formatForDisplay(bidRub)} ₽
        </p>
        {subtitle ? (
          <p className={`${CONCEPT_RECOMMENDED_BID_MUTED_CLASS} tabular-nums`}>{subtitle}</p>
        ) : null}
      </div>
      {chart}
    </div>
  );
}

const CONCEPT_RECOMMENDED_BID_TEXT_CLASS = 'text-sm leading-snug text-gray-600';
const CONCEPT_RECOMMENDED_BID_MUTED_CLASS = 'text-xs leading-snug text-gray-400';

const CONCEPT_CPC_POPOVER_ACCENT: Record<string, string> = {
  'search-1-2': 'border-l-[#9A41FE]',
  'search-3-10': 'border-l-emerald-600',
  'search-11-34': 'border-l-teal-400',
};

const CONCEPT_CPM_POPOVER_ACCENT: Record<string, string> = {
  'search-top2': 'border-l-[#9A41FE]',
  'search-leaders': 'border-l-emerald-600',
  'search-competitive': 'border-l-teal-400',
};

function ConceptRecommendedBidHistogramButton({
  ariaLabel,
  onMouseEnter,
  onMouseLeave,
  buttonRef,
  className = '',
}: {
  ariaLabel: string;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  className?: string;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 ${className}`}
      aria-label={ariaLabel}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
        <rect x="1" y="8" width="3" height="7" rx="0.5" fill="currentColor" opacity="0.35" />
        <rect x="6.5" y="5" width="3" height="10" rx="0.5" fill="currentColor" opacity="0.6" />
        <rect x="12" y="2" width="3" height="13" rx="0.5" fill="currentColor" />
      </svg>
    </button>
  );
}

function ConceptRecommendedBidDetailsHover({
  ariaLabel,
  panelTitle,
  panelSubtitle,
  children,
}: {
  ariaLabel: string;
  panelTitle: string;
  panelSubtitle?: string;
  children: React.ReactNode;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const syncAnchorRect = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;
    setAnchorRect(el.getBoundingClientRect());
  }, []);

  useEffect(() => {
    if (!hovered) return;
    syncAnchorRect();
    const onScrollOrResize = () => syncAnchorRect();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [hovered, syncAnchorRect]);

  const open = () => {
    syncAnchorRect();
    setHovered(true);
  };

  return (
    <>
      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center">
        <ConceptRecommendedBidHistogramButton
          ariaLabel={ariaLabel}
          buttonRef={buttonRef}
          className={`pointer-events-none invisible group-hover/product-row:pointer-events-auto group-hover/product-row:visible${
            hovered ? ' pointer-events-auto visible' : ''
          }`}
          onMouseEnter={open}
          onMouseLeave={() => setHovered(false)}
        />
      </span>
      {hovered && anchorRect && typeof document !== 'undefined'
        ? ReactDOM.createPortal(
            <div
              className="fixed z-[230] w-[min(320px,calc(100vw-24px))] rounded-xl border border-gray-100 bg-white p-3 text-left shadow-lg"
              style={{
                top: anchorRect.top + anchorRect.height / 2,
                left: Math.min(anchorRect.right + 8, window.innerWidth - 336),
                transform: 'translateY(-50%)',
              }}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
            >
              <p className="text-sm font-semibold leading-snug text-gray-900">{panelTitle}</p>
              {panelSubtitle ? (
                <p className="mt-1 text-xs leading-snug text-gray-500">{panelSubtitle}</p>
              ) : null}
              <div className="mt-3 flex flex-col gap-2">{children}</div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function ConceptCpcPositionTierPopoverCard({ tier }: { tier: ConceptCpcPositionTierDemo }) {
  const accent = CONCEPT_CPC_POPOVER_ACCENT[tier.key] ?? 'border-l-gray-300';
  return (
    <div
      className={`rounded-lg border border-gray-100 border-l-[3px] bg-white px-3 py-2 ${accent}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{tier.label}</p>
          <p className="mt-0.5 text-xs text-gray-600">
            Рекомендуемая ставка: {formatForDisplay(tier.bidRub)} ₽
          </p>
          <p className="text-xs text-gray-400">
            Клики: ~ {formatForDisplay(tier.clicksPerDay)} в день
          </p>
        </div>
        <span className="shrink-0 rounded-md bg-[#f3f4f6] px-2 py-1 text-xs font-medium tabular-nums text-gray-900">
          {formatForDisplay(tier.bidRub)} ₽
        </span>
      </div>
    </div>
  );
}

function ConceptCpmBenchmarkTierPopoverCard({ tier }: { tier: ConceptCpmBenchmarkTierDemo }) {
  const accent = CONCEPT_CPM_POPOVER_ACCENT[tier.key] ?? 'border-l-gray-300';
  return (
    <div
      className={`flex items-start gap-2 rounded-lg border border-gray-100 border-l-[3px] bg-white px-3 py-2 ${accent}`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900">{tier.title}</p>
        {tier.description ? (
          <p className="mt-0.5 text-xs text-gray-500">{tier.description}</p>
        ) : null}
        {tier.budgetRub != null ? (
          <div className="mt-1.5 space-y-0.5 text-xs text-gray-500">
            <p>Бюджет: ~ {formatForDisplay(tier.budgetRub)} ₽</p>
            <p>Показы: {formatForDisplay(tier.impressions ?? 0)}</p>
            <p>Клики: {formatForDisplay(tier.clicks ?? 0)}</p>
          </div>
        ) : null}
      </div>
      <span className="shrink-0 rounded-md bg-[#f3f4f6] px-2 py-1 text-xs font-medium tabular-nums text-gray-900">
        {formatForDisplay(tier.bidRub)} ₽
      </span>
    </div>
  );
}

function ProductRecommendedCpmSearchBidCell({ product }: { product: ProductRow }) {
  const searchTiers = useMemo(() => demoCpmSearchRecommendedTiers(product), [product]);
  const top2 = searchTiers[0];
  if (demoCpmSearchRecommendedBidNa(product) || !top2) {
    return <ConceptRecommendedBidNaCell reserveChartSlot />;
  }
  return (
    <ConceptRecommendedBidMetricStack
      bidRub={top2.bidRub}
      subtitle={conceptRecommendedCpmDailyImpressionsSubtitle(product, top2)}
      chart={
        <ConceptRecommendedBidDetailsHover
          ariaLabel="Все ориентиры CPM в поиске"
          panelTitle="У других продавцов"
          panelSubtitle="Метрики похожих товаров с близкой ценой за последние сутки"
        >
          {searchTiers.map((tier) => (
            <ConceptCpmBenchmarkTierPopoverCard key={tier.key} tier={tier} />
          ))}
        </ConceptRecommendedBidDetailsHover>
      }
    />
  );
}

function ProductRecommendedCpmRecBidCell({ product }: { product: ProductRow }) {
  const recBid = useMemo(() => demoCpmRecommendationsBidRub(product), [product]);
  if (demoCpmRecommendationsBidNa(product)) {
    return <ConceptRecommendedBidNaCell />;
  }
  return <ConceptRecommendedBidMetricStack bidRub={recBid} />;
}

function ProductRecommendedCpcSearchBidCell({ product }: { product: ProductRow }) {
  const searchTiers = useMemo(() => demoCpcSearchRecommendedTiers(product), [product]);
  const tier12 = searchTiers[0];
  if (demoCpcSearchRecommendedBidNa(product) || !tier12) {
    return <ConceptRecommendedBidNaCell reserveChartSlot />;
  }
  return (
    <ConceptRecommendedBidMetricStack
      bidRub={tier12.bidRub}
      subtitle={conceptRecommendedCpcDailyClicksSubtitle(tier12)}
      chart={
        <ConceptRecommendedBidDetailsHover
          ariaLabel="Все позиции CPC в поиске"
          panelTitle="Позиции в поиске"
          panelSubtitle="Рекомендуемые ставки и оценка кликов по диапазонам позиций"
        >
          {searchTiers.map((tier) => (
            <ConceptCpcPositionTierPopoverCard key={tier.key} tier={tier} />
          ))}
        </ConceptRecommendedBidDetailsHover>
      }
    />
  );
}

type ProductCampaignBidOverride = {
  unified?: number;
  search?: number;
  recommendations?: number;
};

function ProductCampaignBidInput({
  camp,
  value,
  onChange,
  compact = false,
  onCpmBidRounded,
}: {
  camp: ProductCampaign;
  value: number;
  onChange: (value: number) => void;
  compact?: boolean;
  onCpmBidRounded?: (roundedRub: number) => void;
}) {
  const min = productCampaignBidMin(camp);
  const [inputValue, setInputValue] = useState(String(value || ''));
  useEffect(() => {
    setInputValue(String(value || ''));
  }, [value]);

  const commit = (raw: string) => {
    const parsed = parseDisplayValue(raw);
    if (Number.isNaN(parsed)) return;
    let numericValue = parsed;
    if (camp.type === 'CPM') {
      const { value: stepped, didRoundFromInput } = normalizeCpmBidRub(numericValue, min);
      if (didRoundFromInput) onCpmBidRounded?.(stepped);
      numericValue = stepped;
    } else {
      if (numericValue < min) numericValue = min;
    }
    onChange(numericValue);
    setInputValue(String(numericValue));
  };

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-md border border-gray-300 bg-white shadow-sm ${
        compact ? 'w-[76px]' : 'w-[88px]'
      }`}
    >
      <input
        type="text"
        value={inputValue}
        placeholder="Ставка"
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={() => commit(inputValue)}
        onClick={(e) => e.stopPropagation()}
        className={`hide-arrows w-full bg-transparent text-left font-medium outline-none ${
          compact ? 'py-1.5 pl-1.5 pr-5 text-xs' : 'py-2 pl-2 pr-6 text-sm'
        }`}
      />
      <span
        className={`pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 font-medium text-gray-500 ${
          compact ? 'text-xs' : 'text-sm'
        }`}
      >
        ₽
      </span>
    </div>
  );
}

function ProductCampaignBidCell({
  camp,
  overrides,
  onChange,
  onCpmBidRounded,
}: {
  camp: ProductCampaign;
  overrides?: ProductCampaignBidOverride;
  onChange: (next: ProductCampaignBidOverride) => void;
  onCpmBidRounded?: (roundedRub: number) => void;
}) {
  if (isProductCampaignCpmManual(camp)) {
    const searchVal = overrides?.search ?? defaultProductCampaignSearchBid(camp);
    const recVal =
      overrides?.recommendations ?? defaultProductCampaignRecommendationsBid(camp);
    return (
      <div className="flex flex-col gap-2">
        <div>
          <p className="mb-0.5 text-[11px] leading-tight text-gray-500">В поиске</p>
          <ProductCampaignBidInput
            camp={camp}
            value={searchVal}
            compact
            onCpmBidRounded={onCpmBidRounded}
            onChange={(val) =>
              onChange({ ...overrides, search: val, recommendations: recVal })
            }
          />
        </div>
        <div>
          <p className="mb-0.5 text-[11px] leading-tight text-gray-500">В рекомендациях</p>
          <ProductCampaignBidInput
            camp={camp}
            value={recVal}
            compact
            onCpmBidRounded={onCpmBidRounded}
            onChange={(val) =>
              onChange({ ...overrides, search: searchVal, recommendations: val })
            }
          />
        </div>
      </div>
    );
  }

  const unified = overrides?.unified ?? defaultProductCampaignBid(camp);
  return (
    <ProductCampaignBidInput
      camp={camp}
      value={unified}
      compact
      onCpmBidRounded={onCpmBidRounded}
      onChange={(val) => onChange({ unified: val })}
    />
  );
}

function ProductBidBulkModal({
  kind,
  isOpen,
  onClose,
  categories,
  campaignCount,
  productCount,
  onApply,
  onCpmBidRounded,
}: {
  kind: ProductBidBulkModalKind;
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  campaignCount: number;
  productCount: number;
  onApply: () => void;
  onCpmBidRounded?: (roundedRub: number) => void;
}) {
  const presets = productBidPresets(kind);
  const min = productBidMin(kind);
  const applyCpmStep = kind !== 'cpc';
  const multiCategory = categories.length > 1;
  const [singleBid, setSingleBid] = useState(min);
  const [bidsByCategory, setBidsByCategory] = useState<Record<string, number>>({});
  const [activeCategory, setActiveCategory] = useState(categories[0] ?? '');

  useEffect(() => {
    if (!isOpen) return;
    setSingleBid(min);
    const next: Record<string, number> = {};
    for (const cat of categories) next[cat] = min;
    setBidsByCategory(next);
    setActiveCategory(categories[0] ?? '');
  }, [isOpen, kind, categories, min]);

  if (!isOpen) return null;

  const title = PRODUCT_BID_MODAL_TITLES[kind];

  const handleApply = () => {
    onApply();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="product-bid-bulk-modal-title"
      >
        <div className="mb-1 flex items-start justify-between gap-3">
          <h2 id="product-bid-bulk-modal-title" className="text-lg font-bold text-gray-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 text-sm text-gray-500">
          {productCount} {getPlural(productCount, 'товар', 'товара', 'товаров')} ·{' '}
          {campaignCount} {getPlural(campaignCount, 'кампания', 'кампании', 'кампаний')}
        </p>

        {multiCategory ? (
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-700">Категории</p>
            <div
              className="inline-flex max-w-full flex-wrap gap-1 rounded-[10px] bg-[rgba(74,74,89,0.08)] p-1"
              role="tablist"
              aria-label="Фильтр по категориям"
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`max-w-[200px] truncate rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                    activeCategory === cat
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-[#767386] hover:text-gray-900'
                  }`}
                  title={cat}
                >
                  {cat}
                </button>
              ))}
            </div>
            {categories.map((cat) =>
              activeCategory === cat ? (
                <div key={cat}>
                  <label className="mb-2 block text-sm font-medium text-gray-700">{cat}</label>
                  <ProductBulkBidField
                    value={bidsByCategory[cat] ?? min}
                    onChange={(val) =>
                      setBidsByCategory((prev) => ({ ...prev, [cat]: val }))
                    }
                    presets={presets}
                    min={min}
                    applyCpmStep={applyCpmStep}
                    onCpmBidRounded={onCpmBidRounded}
                  />
                </div>
              ) : null,
            )}
          </div>
        ) : (
          <div>
            {categories[0] ? (
              <p className="mb-2 text-sm text-gray-500">Категория: {categories[0]}</p>
            ) : null}
            <label className="mb-2 block text-sm font-medium text-gray-700">Новая ставка (₽)</label>
            <ProductBulkBidField
              value={singleBid}
              onChange={setSingleBid}
              presets={presets}
              min={min}
              applyCpmStep={applyCpmStep}
              onCpmBidRounded={onCpmBidRounded}
            />
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700"
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}

function productRowNmId(product: ProductRow): number {
  const nmId = Number.parseInt(product.articleWb, 10) || Number.parseInt(product.article, 10);
  return Number.isFinite(nmId) ? nmId : 0;
}

function productRecencySortKey(product: ProductRow): number {
  const nmId = productRowNmId(product);
  if (nmId > 0) return nmId;
  const fromId = /^pr(\d+)$/i.exec(product.id);
  if (fromId) return Number.parseInt(fromId[1]!, 10);
  return 0;
}

type ProductsInsightPickTab = 'growth' | 'high_conversion' | 'ab' | 'promo';

/** Демо: в каждой подборке есть хотя бы один товар (продвигается и без продвижения). */
const PRODUCTS_INSIGHT_PICK_GUARANTEED_IDS: Record<ProductsInsightPickTab, readonly string[]> = {
  growth: ['pr5', 'pr7', 'pr2'],
  high_conversion: ['pr8', 'pr14', 'pr18'],
  ab: ['pr12', 'pr19', 'pr2'],
  promo: ['pr22', 'pr26', 'pr18'],
};

function productMatchesInsightPickTab(product: ProductRow, tab: ProductsInsightPickTab): boolean {
  if (PRODUCTS_INSIGHT_PICK_GUARANTEED_IDS[tab].includes(product.id)) return true;
  const nmId = productRowNmId(product);
  if (nmId <= 0) return false;
  if (tab === 'growth') return nmId % 5 === 0;
  if (tab === 'high_conversion') return nmId % 13 === 0;
  if (tab === 'ab') return nmId % 9 === 0;
  return nmId % 7 === 0;
}

function productHasActiveCampaign(
  product: ProductRow,
  productCampaignStatusOverride: Record<string, 'active' | 'paused'>,
): boolean {
  return product.campaigns.some((camp) => {
    const effectiveStatus =
      camp.status === 'draft' || camp.status === 'error'
        ? camp.status
        : (productCampaignStatusOverride[camp.id] ?? camp.status);
    return effectiveStatus === 'active';
  });
}

function productMatchesProductsPickTab(
  product: ProductRow,
  tab: ProductsPickTab,
  productCampaignStatusOverride: Record<string, 'active' | 'paused'>,
  segmentation: 'concept' | 'default' = 'default',
): boolean {
  const hasActiveCampaign = productHasActiveCampaign(product, productCampaignStatusOverride);
  if (tab === 'all_products') {
    if (segmentation === 'concept') {
      return (
        hasActiveCampaign ||
        product.campaigns.length === 0
      );
    }
    return true;
  }
  if (tab === 'not_promoted' || tab === 'not_promoted_v3') {
    if (segmentation === 'concept') {
      return product.campaigns.length === 0;
    }
    if (product.campaigns.length === 0) return true;
    return !hasActiveCampaign;
  }
  if (tab === 'promoted') return hasActiveCampaign;
  if (tab === 'growth' || tab === 'high_conversion' || tab === 'ab' || tab === 'promo') {
    return productMatchesInsightPickTab(product, tab);
  }
  return true;
}

function productMatchesSecondaryPickTab(product: ProductRow, tab: ProductsSecondaryPickTab): boolean {
  if (tab === 'all') return true;
  return productMatchesInsightPickTab(product, tab);
}

function productConceptIsNotPromoted(
  product: ProductRow,
  productCampaignStatusOverride: Record<string, 'active' | 'paused'>,
): boolean {
  return productMatchesProductsPickTab(
    product,
    'not_promoted',
    productCampaignStatusOverride,
    'concept',
  );
}

function productEligibleForProductBidBulkActions(
  product: ProductRow,
  productCampaignStatusOverride: Record<string, 'active' | 'paused'>,
  conceptAllProductsPickTab: boolean,
  conceptMulticardTabDemoNotPromotedProductIds: Set<string>,
): boolean {
  if (productConceptIsNotPromoted(product, productCampaignStatusOverride)) {
    return false;
  }
  if (
    conceptAllProductsPickTab &&
    conceptMulticardTabDemoNotPromotedProductIds.has(product.id)
  ) {
    return false;
  }
  return true;
}

function productsStatColumnId(label: (typeof PRODUCTS_STAT_COLUMN_LABELS)[number]): string {
  return `stat:${label}`;
}

/** Концепт товарного продвижения → вкладка «Без продвижения»: колонки статистики в таблице товаров. */
const CONCEPT_NOT_PROMOTED_PRODUCT_STAT_LABELS: readonly (typeof PRODUCTS_STAT_COLUMN_LABELS)[number][] =
  ['Заказы', 'Добавления в корзину', 'Сумма заказов'];

const CONCEPT_JAM_SUBSCRIPTION_TOOLTIP_TITLE = 'Показы недоступны';
const CONCEPT_JAM_SUBSCRIPTION_TOOLTIP_BODY =
  'Данные доступны с подпиской «Джем» или после запуска продвижения';

type ConceptNotPromotedStatSortLabel = (typeof CONCEPT_NOT_PROMOTED_PRODUCT_STAT_LABELS)[number];

type ConceptNotPromotedAverageBidSortKey =
  | typeof PRODUCTS_RECOMMENDED_BID_CPM_SEARCH_COLUMN_ID
  | typeof PRODUCTS_RECOMMENDED_BID_CPM_REC_COLUMN_ID
  | typeof PRODUCTS_RECOMMENDED_BID_CPC_SEARCH_COLUMN_ID;

type ConceptNotPromotedProductSortKey =
  | ConceptNotPromotedStatSortLabel
  | ConceptNotPromotedAverageBidSortKey;

const CONCEPT_AVERAGE_BID_SORT_COLUMN_TITLES: Record<ConceptNotPromotedAverageBidSortKey, string> = {
  [PRODUCTS_RECOMMENDED_BID_CPC_SEARCH_COLUMN_ID]: 'Ставка CPC в поиске за 1-2 место',
  [PRODUCTS_RECOMMENDED_BID_CPM_SEARCH_COLUMN_ID]: 'Ставка CPM в поиске за 1-2 место',
  [PRODUCTS_RECOMMENDED_BID_CPM_REC_COLUMN_ID]: 'Min ставка CPM в рекомендациях',
};

function isConceptNotPromotedAverageBidSortKey(
  key: ConceptNotPromotedProductSortKey,
): key is ConceptNotPromotedAverageBidSortKey {
  return isConceptNotPromotedRecommendedBidColumnId(key);
}

function isConceptNotPromotedStatSortLabel(
  label: (typeof PRODUCTS_STAT_COLUMN_LABELS)[number],
): label is ConceptNotPromotedStatSortLabel {
  return (CONCEPT_NOT_PROMOTED_PRODUCT_STAT_LABELS as readonly string[]).includes(label);
}

function productStatSortNumericValue(
  product: ProductRow,
  label: ConceptNotPromotedStatSortLabel,
  useOrganicWhenMissing: boolean,
): number {
  const agg = productRowStatsAgg(product, useOrganicWhenMissing);
  if (!agg) return Number.NEGATIVE_INFINITY;
  const stats = buildExtendedProductStats(agg);
  switch (label) {
    case 'Заказы':
      return stats.orders;
    case 'Добавления в корзину':
      return stats.cartAdds;
    case 'Сумма заказов':
      return stats.orderSum;
    default:
      return 0;
  }
}

function productAverageBidSortNumericValue(
  product: ProductRow,
  key: ConceptNotPromotedAverageBidSortKey,
): number {
  const cpmTop2 = demoCpmSearchRecommendedTiers(product)[0]?.bidRub ?? 0;
  const cpmRec = demoCpmRecommendationsBidRub(product);
  const cpcTop = demoCpcSearchRecommendedTiers(product)[0]?.bidRub ?? 0;
  if (key === PRODUCTS_RECOMMENDED_BID_CPM_SEARCH_COLUMN_ID) return cpmTop2;
  if (key === PRODUCTS_RECOMMENDED_BID_CPM_REC_COLUMN_ID) return cpmRec;
  return cpcTop;
}

function ConceptNotPromotedTableSortButton({
  sortKey,
  title,
  activeSort,
  onSort,
}: {
  sortKey: ConceptNotPromotedProductSortKey;
  title: string;
  activeSort: { label: ConceptNotPromotedProductSortKey; direction: 'asc' | 'desc' } | null;
  onSort: (key: ConceptNotPromotedProductSortKey) => void;
}) {
  const isActive = activeSort?.label === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`inline-flex shrink-0 items-center justify-center rounded p-0.5 transition-colors hover:bg-gray-100 ${
        isActive ? 'text-gray-900' : 'text-gray-400'
      }`}
      aria-label={`Сортировать по «${title}»${
        isActive
          ? activeSort.direction === 'desc'
            ? ', по убыванию'
            : ', по возрастанию'
          : ''
      }`}
    >
      <ArrowUp
        className={`h-3.5 w-3.5 shrink-0 stroke-[2.5] text-current transition-transform ${
          isActive && activeSort.direction === 'asc' ? '' : 'rotate-180'
        }`}
        aria-hidden
      />
    </button>
  );
}

function defaultProductsColumnVisibility(): Record<string, boolean> {
  const next: Record<string, boolean> = {};
  for (const col of PRODUCTS_PRIMARY_COLUMN_IDS) next[col.id] = true;
  for (const col of PRODUCTS_MIDDLE_COLUMN_IDS) {
    next[col.id] = col.id !== 'tags';
  }
  for (const label of PRODUCTS_STAT_COLUMN_LABELS) next[productsStatColumnId(label)] = true;
  return next;
}

function ProductsColumnPinIcon({ className = 'h-4 w-4 text-gray-400' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16 10V7a4 4 0 1 0-8 0v3l-2 4.5V18h12v-3.5L16 10zm-6-3a2 2 0 1 1 4 0v3h-4V7z" />
    </svg>
  );
}

function ProductsColumnGripIcon() {
  return (
    <span className="inline-grid grid-cols-2 gap-[3px] px-0.5" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className="h-[3px] w-[3px] rounded-full bg-gray-400" />
      ))}
    </span>
  );
}

function ProductsColumnSettingsDropdown({
  open,
  onClose,
  visibility,
  onToggle,
  onReset,
}: {
  open: boolean;
  onClose: () => void;
  visibility: Record<string, boolean>;
  onToggle: (columnId: string, visible: boolean) => void;
  onReset: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      onClose();
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [open, onClose]);

  if (!open) return null;

  const checkboxClass =
    '[&_.ant-checkbox-inner]:rounded [&_.ant-checkbox-checked_.ant-checkbox-inner]:border-[#9a41fe] [&_.ant-checkbox-checked_.ant-checkbox-inner]:bg-[#9a41fe]';

  const renderRow = (
    columnId: string,
    label: string,
    options?: { showActions?: boolean },
  ) => {
    const checked = visibility[columnId] !== false;
    return (
      <div
        key={columnId}
        className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0"
      >
        <Checkbox
          checked={checked}
          onChange={(e) => onToggle(columnId, e.target.checked)}
          className={checkboxClass}
        />
        <span className="min-w-0 flex-1 text-sm text-gray-900">{label}</span>
        {options?.showActions ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label={`Закрепить колонку «${label}»`}
            >
              <ProductsColumnPinIcon />
            </button>
            <span className="cursor-grab text-gray-400">
              <ProductsColumnGripIcon />
            </span>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-[calc(100%+8px)] z-[200] w-[min(100vw-2rem,340px)] overflow-hidden rounded-[20px] border border-gray-100 bg-white shadow-lg"
      role="dialog"
      aria-label="Настройки колонок"
    >
      <div className="max-h-[min(70vh,520px)] overflow-y-auto">
        {PRODUCTS_PRIMARY_COLUMN_IDS.map((col) => renderRow(col.id, col.label))}
        <div className="border-t border-gray-200" />
        {PRODUCTS_MIDDLE_COLUMN_IDS.map((col) =>
          renderRow(col.id, col.label, { showActions: true }),
        )}
        {PRODUCTS_STAT_COLUMN_LABELS.map((label) =>
          renderRow(productsStatColumnId(label), label, { showActions: true }),
        )}
      </div>
      <button
        type="button"
        onClick={onReset}
        className="flex w-full items-center justify-center gap-2 border-t border-gray-100 bg-[#f7f7f8] px-4 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
      >
        <span className="text-gray-500" aria-hidden>
          ⌫
        </span>
        Сбросить настройки
      </button>
    </div>
  );
}

type ProductStatsBase = {
  spend: number;
  impressions: number;
  ctr: number;
  orders: number;
  spendShare: number;
};

type ProductStatsExtended = ProductStatsBase & {
  avgPosition: number;
  clicks: number;
  cartAdds: number;
  orderSum: number;
  cpc: number;
  cpo: number;
  cr: number;
  cpm: number;
  techCancels: number;
};

function buildExtendedProductStats(
  base: ProductStatsBase,
  avgPositionOverride?: number,
): ProductStatsExtended {
  const clicks =
    base.impressions > 0 ? Math.max(1, Math.round((base.impressions * base.ctr) / 100)) : 0;
  const cartAdds = Math.max(0, Math.round(base.orders * 2.4));
  const orderSum = Math.round(base.spend * 14.2);
  const cpc = clicks > 0 ? base.spend / clicks : 0;
  const cpo = base.orders > 0 ? base.spend / base.orders : 0;
  const cr = clicks > 0 ? (base.orders / clicks) * 100 : 0;
  const cpm = base.impressions > 0 ? (base.spend / base.impressions) * 1000 : 0;
  const avgPosition =
    avgPositionOverride ?? (base.spendShare > 0 ? Math.round(8 + base.spendShare * 0.35) : 24);
  const techCancels = Math.max(0, Math.round(base.orders * 0.04));
  return {
    ...base,
    clicks,
    cartAdds,
    orderSum,
    cpc,
    cpo,
    cr,
    cpm,
    avgPosition,
    techCancels,
  };
}

function formatProductsStatValue(
  label: (typeof PRODUCTS_STAT_COLUMN_LABELS)[number],
  stats: ProductStatsExtended,
): string {
  switch (label) {
    case 'Затраты':
      return `${formatForDisplay(stats.spend)} ₽`;
    case 'Показы':
      return formatForDisplay(stats.impressions);
    case 'CTR':
      return `${stats.ctr.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
    case 'Заказы':
      return formatForDisplay(stats.orders);
    case 'Доля затрат':
      return `${stats.spendShare.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
    case 'Средняя позиция':
      return formatForDisplay(stats.avgPosition);
    case 'Клики':
      return formatForDisplay(stats.clicks);
    case 'Добавления в корзину':
      return formatForDisplay(stats.cartAdds);
    case 'Сумма заказов':
      return `${formatForDisplay(stats.orderSum)} ₽`;
    case 'CPC':
      return `${formatForDisplay(Math.round(stats.cpc))} ₽`;
    case 'CPO':
      return `${formatForDisplay(Math.round(stats.cpo))} ₽`;
    case 'CR':
      return formatPercentage(stats.cr);
    case 'CPM':
      return `${formatForDisplay(Math.round(stats.cpm))} ₽`;
    case 'Отмены технические':
      return formatForDisplay(stats.techCancels);
    default:
      return '—';
  }
}

type ProductStatsChanges = {
  changeSpend?: number;
  changeImpressions?: number;
  changeCtr?: number;
  changeOrders?: number;
  changeShare?: number;
  changePosition?: number;
};

function productsStatPositiveIsGood(label: (typeof PRODUCTS_STAT_COLUMN_LABELS)[number]): boolean {
  switch (label) {
    case 'Затраты':
    case 'CPC':
    case 'CPO':
    case 'CPM':
    case 'Доля затрат':
    case 'Отмены технические':
      return false;
    case 'Средняя позиция':
      return false;
    default:
      return true;
  }
}

/** Стабильный % изменения для колонок без явных данных в моке. */
function derivedProductsStatChange(productId: string, label: string): number {
  let h = 0;
  const key = `${productId}|${label}`;
  for (let i = 0; i < key.length; i++) h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
  const pool = [-24.1, -9.7, -2, -1.3, 0, 1.2, 2.8, 7.3, 12.6, 18.4];
  return pool[Math.abs(h) % pool.length]!;
}

/** Демо: у части непродвигаемых товаров нет ассоциированных конверсий. */
function conceptNotPromotedHasAssociatedConversions(product: ProductRow): boolean {
  const nm = productRowNmId(product);
  const seed =
    nm > 0
      ? nm
      : [...product.id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return seed % 3 !== 0;
}

/** Демо-агрегат для товаров без кампаний на вкладке «Без продвижения». */
function organicProductStatsAgg(product: ProductRow): NonNullable<ProductRow['agg']> | null {
  if (!conceptNotPromotedHasAssociatedConversions(product)) return null;
  const nm = productRowNmId(product) || product.id.length;
  const orders = 8 + (Math.abs(nm) % 94);
  const impressions = orders * (38 + (nm % 12));
  const spend = Math.round(orders * (95 + (nm % 70)));
  return {
    spend,
    impressions,
    ctr: impressions > 0 ? Math.round((orders / impressions) * 1000 * 10) / 10 : 0,
    orders,
    spendShare: 0,
    changeOrders: derivedProductsStatChange(product.id, 'Заказы'),
    changeImpressions: derivedProductsStatChange(product.id, 'Показы'),
    changeCtr: derivedProductsStatChange(product.id, 'CTR'),
  };
}

function productRowStatsAgg(
  product: ProductRow,
  useOrganicWhenMissing: boolean,
): ProductRow['agg'] | undefined {
  if (product.agg) return product.agg;
  if (useOrganicWhenMissing) return organicProductStatsAgg(product);
  return undefined;
}

function productsStatChangeForLabel(
  label: (typeof PRODUCTS_STAT_COLUMN_LABELS)[number],
  productId: string,
  explicit?: ProductStatsChanges,
): number {
  const fromExplicit: Partial<Record<(typeof PRODUCTS_STAT_COLUMN_LABELS)[number], number | undefined>> = {
    Затраты: explicit?.changeSpend,
    Показы: explicit?.changeImpressions,
    CTR: explicit?.changeCtr,
    Заказы: explicit?.changeOrders,
    'Доля затрат': explicit?.changeShare,
    'Средняя позиция': explicit?.changePosition,
  };
  const value = fromExplicit[label];
  if (value !== undefined && value !== null) return value;
  return derivedProductsStatChange(productId, label);
}

function formatProductsStatTrendPercent(change: number): string {
  const abs = Math.abs(change);
  const body =
    abs >= 100
      ? Math.round(abs).toLocaleString('ru-RU')
      : abs.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
  return `${body} %`;
}

function ProductsStatTrendBadge({
  change,
  positiveIsGood,
  lowerIsBetter = false,
}: {
  change: number;
  positiveIsGood: boolean;
  lowerIsBetter?: boolean;
}) {
  const isZero = Math.abs(change) < 0.05;
  const isUp = change > 0;
  const favorable = isZero
    ? null
    : lowerIsBetter
      ? !isUp
      : isUp
        ? positiveIsGood
        : !positiveIsGood;
  const tone = isZero ? 'text-gray-400' : favorable ? 'text-emerald-600' : 'text-red-500';
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium leading-none ${tone}`}>
      <span aria-hidden>{isZero ? '▼' : isUp ? '▲' : '▼'}</span>
      {formatProductsStatTrendPercent(change)}
    </span>
  );
}

function ConceptJamSubscriptionHint() {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const syncAnchorRect = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    setAnchorRect(el.getBoundingClientRect());
  }, []);

  useEffect(() => {
    if (!hovered) return;
    syncAnchorRect();
    const onScrollOrResize = () => syncAnchorRect();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [hovered, syncAnchorRect]);

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60"
        aria-label={CONCEPT_JAM_SUBSCRIPTION_TOOLTIP_TITLE}
        onMouseEnter={() => {
          syncAnchorRect();
          setHovered(true);
        }}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => {
          syncAnchorRect();
          setHovered(true);
        }}
        onBlur={() => setHovered(false)}
      >
        <span className="h-2 w-2 rounded-full bg-[#FF8A00]" aria-hidden />
      </button>
      {hovered && anchorRect && typeof document !== 'undefined'
        ? ReactDOM.createPortal(
            <div
              role="tooltip"
              className="fixed z-[220] w-[min(300px,calc(100vw-24px))] rounded-xl border border-gray-200 bg-white p-4 text-left shadow-xl"
              style={{
                top: anchorRect.bottom + 8,
                left: Math.min(anchorRect.left, window.innerWidth - 316),
              }}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
            >
              <p className="text-sm font-semibold text-gray-900">
                {CONCEPT_JAM_SUBSCRIPTION_TOOLTIP_TITLE}
              </p>
              <p className="mt-1 text-sm leading-snug text-gray-600">
                {CONCEPT_JAM_SUBSCRIPTION_TOOLTIP_BODY}
              </p>
              <button
                type="button"
                className="mt-3 text-sm font-semibold text-[#9a41fe] transition-colors hover:text-[#8840e5]"
              >
                О подписке
              </button>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function ConceptJamLockedImpressionsMetricCell({
  stats,
  productId,
  changes,
}: {
  stats: ProductStatsExtended;
  productId: string;
  changes?: ProductStatsChanges;
}) {
  const change = productsStatChangeForLabel('Показы', productId, changes);
  return (
    <div className="flex w-full flex-col items-end gap-0.5 text-right leading-none tabular-nums">
      <span className="text-xs font-semibold text-gray-900 blur-[5px] select-none" aria-hidden>
        {formatProductsStatValue('Показы', stats)}
      </span>
      <span className="inline-block blur-[4px] select-none" aria-hidden>
        <ProductsStatTrendBadge
          change={change}
          positiveIsGood={productsStatPositiveIsGood('Показы')}
          lowerIsBetter={false}
        />
      </span>
      <span className="sr-only">
        {CONCEPT_JAM_SUBSCRIPTION_TOOLTIP_TITLE}. {CONCEPT_JAM_SUBSCRIPTION_TOOLTIP_BODY}
      </span>
    </div>
  );
}

function ProductsStatNotAvailableCell({
  compact = false,
  hint,
}: {
  compact?: boolean;
  hint?: string;
}) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [hovered, setHovered] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const syncAnchorRect = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    setAnchorRect(el.getBoundingClientRect());
  }, []);

  useEffect(() => {
    if (!hovered || !hint) return;
    syncAnchorRect();
    const onScrollOrResize = () => syncAnchorRect();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [hovered, hint, syncAnchorRect]);

  return (
    <>
      <span
        ref={hint ? anchorRef : undefined}
        className={`block text-right text-sm font-semibold text-gray-400 ${hint ? 'cursor-help' : ''}`}
        aria-label={hint}
        onMouseEnter={
          hint
            ? () => {
                syncAnchorRect();
                setHovered(true);
              }
            : undefined
        }
        onMouseLeave={hint ? () => setHovered(false) : undefined}
      >
        Н/Д
      </span>
      {hint && hovered && anchorRect && typeof document !== 'undefined'
        ? ReactDOM.createPortal(
            <div
              role="tooltip"
              className="fixed z-[220] w-[min(300px,calc(100vw-24px))] rounded-lg bg-gray-900 p-3 text-left text-xs leading-snug text-white shadow-lg"
              style={{
                top: anchorRect.bottom + 6,
                left: Math.min(anchorRect.left, window.innerWidth - 316),
              }}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
            >
              {hint}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function ProductsStatMetricCell({
  label,
  stats,
  productId,
  changes,
  compact = false,
  showTrend = true,
}: {
  label: (typeof PRODUCTS_STAT_COLUMN_LABELS)[number];
  stats: ProductStatsExtended;
  productId: string;
  changes?: ProductStatsChanges;
  compact?: boolean;
  showTrend?: boolean;
}) {
  const change = productsStatChangeForLabel(label, productId, changes);
  const lowerIsBetter =
    label === 'Средняя позиция' ||
    label === 'CPC' ||
    label === 'CPO' ||
    label === 'CPM' ||
    label === 'Затраты' ||
    label === 'Доля затрат' ||
    label === 'Отмены технические';

  return (
    <div
      className={`flex flex-col gap-0.5 leading-none tabular-nums ${
        compact ? 'w-full items-end text-right' : ''
      }`}
    >
      <span className="text-sm font-semibold text-gray-900">
        {formatProductsStatValue(label, stats)}
      </span>
      {showTrend ? (
        <ProductsStatTrendBadge
          change={change}
          positiveIsGood={productsStatPositiveIsGood(label)}
          lowerIsBetter={lowerIsBetter}
        />
      ) : null}
    </div>
  );
}

const PRODUCTS_STAT_TH_CLASS = 'p-4 text-left font-normal w-[130px] min-w-[120px]';
const PRODUCTS_STAT_TD_CLASS = 'p-4 align-top w-[130px] min-w-[120px]';

const CONCEPT_NOT_PROMOTED_STAT_TH_CLASS =
  'px-1.5 py-2.5 text-right align-top text-[11px] font-normal leading-tight text-[#767386] overflow-visible';
const CONCEPT_NOT_PROMOTED_STAT_TD_CLASS =
  'px-1.5 py-2.5 align-middle text-right text-sm';
const CONCEPT_NOT_PROMOTED_TAGS_TH_CLASS =
  'px-2 py-2.5 text-left text-[11px] font-normal leading-tight text-[#767386] w-[1%]';
const CONCEPT_NOT_PROMOTED_TAGS_TD_CLASS = 'px-2 py-2.5 align-middle w-[1%] max-w-[7.5rem]';
const CONCEPT_NOT_PROMOTED_BONUS_CAMPAIGN_TH_CLASS =
  'px-2 py-2.5 text-left align-top text-[11px] font-normal leading-tight text-[#767386]';
const CONCEPT_NOT_PROMOTED_BONUS_CAMPAIGN_TD_CLASS =
  'px-2 py-2.5 align-middle';
const CONCEPT_NOT_PROMOTED_STOCK_TH_CLASS =
  'px-1.5 py-2.5 text-center text-[11px] font-normal leading-tight text-[#767386] whitespace-nowrap';
const CONCEPT_NOT_PROMOTED_STOCK_TD_CLASS =
  'px-1.5 py-2.5 align-middle text-center whitespace-nowrap tabular-nums text-sm';
const CONCEPT_NOT_PROMOTED_AVERAGE_BID_TH_CLASS =
  'px-1.5 py-2.5 text-right align-top text-[11px] font-normal leading-tight text-[#767386] overflow-visible';
const CONCEPT_NOT_PROMOTED_AVERAGE_BID_TD_CLASS =
  'px-1.5 py-2.5 align-middle text-right text-sm';

const CONCEPT_RECOMMENDED_CPM_SEARCH_BID_HEADER_TOOLTIP =
  'Рекомендуемые ставки за 1000 показов в поиске';

const CONCEPT_RECOMMENDED_CPM_REC_BID_HEADER_TOOLTIP =
  'Рекомендуемые ставки за 1000 показов в рекомендациях';

const CONCEPT_RECOMMENDED_CPC_SEARCH_BID_HEADER_TOOLTIP =
  'Рекомендуемые ставки за клик в поиске';

function ConceptAverageBidColumnHeader({
  titleLines,
  sortKey,
  activeSort,
  onSort,
  tooltipText,
}: {
  titleLines: React.ReactNode;
  sortKey: ConceptNotPromotedAverageBidSortKey;
  activeSort: { label: ConceptNotPromotedProductSortKey; direction: 'asc' | 'desc' } | null;
  onSort: (key: ConceptNotPromotedProductSortKey) => void;
  tooltipText: string;
}) {
  const titleRef = useRef<HTMLSpanElement>(null);
  const [hovered, setHovered] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const syncAnchorRect = useCallback(() => {
    const el = titleRef.current;
    if (!el) return;
    setAnchorRect(el.getBoundingClientRect());
  }, []);

  useEffect(() => {
    if (!hovered) return;
    syncAnchorRect();
    const onScrollOrResize = () => syncAnchorRect();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [hovered, syncAnchorRect]);

  return (
    <>
      <div className="ml-auto grid w-max max-w-full grid-cols-[minmax(0,1fr)_auto] items-start justify-end gap-x-1 text-right">
        <span
          ref={titleRef}
          className="col-start-1 min-w-0 cursor-help leading-tight text-right"
          aria-label={tooltipText}
          onMouseEnter={() => {
            syncAnchorRect();
            setHovered(true);
          }}
          onMouseLeave={() => setHovered(false)}
        >
          {titleLines}
        </span>
        <span className="col-start-2 flex shrink-0 items-center pt-px">
          <ConceptNotPromotedTableSortButton
            sortKey={sortKey}
            title={CONCEPT_AVERAGE_BID_SORT_COLUMN_TITLES[sortKey]}
            activeSort={activeSort}
            onSort={onSort}
          />
        </span>
      </div>
      {hovered && anchorRect && typeof document !== 'undefined'
        ? ReactDOM.createPortal(
            <div
              role="tooltip"
              className="fixed z-[220] w-[min(280px,calc(100vw-24px))] rounded-lg bg-gray-900 p-3 text-left text-xs leading-snug text-white shadow-lg"
              style={{
                top: anchorRect.bottom + 6,
                left: Math.min(anchorRect.left, window.innerWidth - 296),
              }}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
            >
              {tooltipText}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

/** Колонка «Товар» на «Без продвижения» — широкая под название и «Продвигать». */
const CONCEPT_NOT_PROMOTED_PRODUCT_PIN_WIDTH_PX = 500;
const CONCEPT_NOT_PROMOTED_PRODUCT_COL_CLASS =
  'w-[500px] min-w-[500px] max-w-[500px]';
const CONCEPT_NOT_PROMOTED_SELECT_WIDTH_PX = 48;
const CONCEPT_NOT_PROMOTED_TAGS_COL_WIDTH_PX = 120;
const CONCEPT_NOT_PROMOTED_BONUS_CAMPAIGN_COL_WIDTH_PX = 168;
const CONCEPT_NOT_PROMOTED_REC_BID_CPC_SEARCH_COL_WIDTH_PX = 184;
const CONCEPT_NOT_PROMOTED_REC_BID_CPM_SEARCH_COL_WIDTH_PX = 184;
const CONCEPT_NOT_PROMOTED_REC_BID_CPM_REC_COL_WIDTH_PX = 168;
const CONCEPT_NOT_PROMOTED_STAT_COL_WIDTH_PX = 108;
const CONCEPT_NOT_PROMOTED_STOCK_COL_WIDTH_PX = 88;

function conceptNotPromotedTableMinWidthPx(
  showTagsColumn: boolean,
  showBonusCampaignColumn = false,
): number {
  let total =
    CONCEPT_NOT_PROMOTED_SELECT_WIDTH_PX + CONCEPT_NOT_PROMOTED_PRODUCT_PIN_WIDTH_PX;
  if (showTagsColumn) total += CONCEPT_NOT_PROMOTED_TAGS_COL_WIDTH_PX;
  if (showBonusCampaignColumn) total += CONCEPT_NOT_PROMOTED_BONUS_CAMPAIGN_COL_WIDTH_PX;
  total +=
    CONCEPT_NOT_PROMOTED_REC_BID_CPM_REC_COL_WIDTH_PX +
    CONCEPT_NOT_PROMOTED_REC_BID_CPC_SEARCH_COL_WIDTH_PX;
  total +=
    CONCEPT_NOT_PROMOTED_PRODUCT_STAT_LABELS.length *
    CONCEPT_NOT_PROMOTED_STAT_COL_WIDTH_PX;
  total += CONCEPT_NOT_PROMOTED_STOCK_COL_WIDTH_PX;
  return total;
}

const CONCEPT_ASSOCIATED_ORDERS_HEADER_TOOLTIP =
  'Заказы, которые оформили, перейдя через другой ваш товар, который уже продвигается. Это не все заказы карточки. Н/Д — не было таких заказов за выбранный период.';

const CONCEPT_ASSOCIATED_CART_HEADER_TOOLTIP =
  'Добавления в корзину этого товара после перехода через другой ваш товар, который уже продвигается. Н/Д — не было таких добавлений за выбранный период.';

const CONCEPT_ASSOCIATED_STAT_NA_TOOLTIP =
  'Нет ассоциированных данных за период: не было перехода через продвигаемый товар или конверсии по этой цепочке.';

function conceptNotPromotedAssociatedStatHeaderTooltip(
  label: (typeof PRODUCTS_STAT_COLUMN_LABELS)[number],
): string | null {
  switch (label) {
    case 'Заказы':
      return CONCEPT_ASSOCIATED_ORDERS_HEADER_TOOLTIP;
    case 'Добавления в корзину':
      return CONCEPT_ASSOCIATED_CART_HEADER_TOOLTIP;
    default:
      return null;
  }
}

function conceptNotPromotedAssociatedStatNaHint(
  label: (typeof PRODUCTS_STAT_COLUMN_LABELS)[number],
): string | undefined {
  if (
    label === 'Заказы' ||
    label === 'Добавления в корзину' ||
    label === 'Сумма заказов'
  ) {
    return CONCEPT_ASSOCIATED_STAT_NA_TOOLTIP;
  }
  return undefined;
}

function ConceptNotPromotedStatColumnHeader({
  label,
  activeSort,
  onSort,
}: {
  label: ConceptNotPromotedStatSortLabel;
  activeSort: { label: ConceptNotPromotedProductSortKey; direction: 'asc' | 'desc' } | null;
  onSort: (key: ConceptNotPromotedProductSortKey) => void;
}) {
  const titleRef = useRef<HTMLSpanElement>(null);
  const [hovered, setHovered] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const tooltipText = conceptNotPromotedAssociatedStatHeaderTooltip(label);
  const title = conceptNotPromotedStatColumnTitle(label);

  const syncAnchorRect = useCallback(() => {
    const el = titleRef.current;
    if (!el) return;
    setAnchorRect(el.getBoundingClientRect());
  }, []);

  useEffect(() => {
    if (!hovered || !tooltipText) return;
    syncAnchorRect();
    const onScrollOrResize = () => syncAnchorRect();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [hovered, syncAnchorRect, tooltipText]);

  return (
    <>
      <span className="inline-flex items-start justify-end gap-0.5">
        <span
          ref={tooltipText ? titleRef : undefined}
          className={`min-w-0 text-right leading-tight ${tooltipText ? 'cursor-help' : ''}`}
          aria-label={tooltipText ?? undefined}
          onMouseEnter={
            tooltipText
              ? () => {
                  syncAnchorRect();
                  setHovered(true);
                }
              : undefined
          }
          onMouseLeave={tooltipText ? () => setHovered(false) : undefined}
        >
          {title}
        </span>
        {isConceptNotPromotedStatSortLabel(label) ? (
          <ConceptNotPromotedTableSortButton
            sortKey={label}
            title={label}
            activeSort={activeSort}
            onSort={onSort}
          />
        ) : null}
      </span>
      {tooltipText && hovered && anchorRect && typeof document !== 'undefined'
        ? ReactDOM.createPortal(
            <div
              role="tooltip"
              className="fixed z-[220] w-[min(300px,calc(100vw-24px))] rounded-lg bg-gray-900 p-3 text-left text-xs leading-snug text-white shadow-lg"
              style={{
                top: anchorRect.bottom + 6,
                left: Math.min(anchorRect.left, window.innerWidth - 316),
              }}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
            >
              {tooltipText}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function conceptNotPromotedStatColumnTitle(
  label: (typeof PRODUCTS_STAT_COLUMN_LABELS)[number],
): React.ReactNode {
  switch (label) {
    case 'Заказы':
      return (
        <>
          Ассоциированные
          <br />
          заказы
        </>
      );
    case 'Добавления в корзину':
      return (
        <>
          Ассоциированные
          <br />
          корзины
        </>
      );
    case 'Сумма заказов':
      return (
        <>
          Ассоциированная
          <br />
          сумма заказов
        </>
      );
    default:
      return label;
  }
}

/** Ширина колонки «Товар» — как при раскрытых кампаниях, чтобы влезала мета-строка. */
const PRODUCTS_TABLE_PRODUCT_COL_CLASS = 'w-[520px] min-w-[520px] max-w-[520px]';

/** Закреплённые слева при горизонтальном скролле (порядок важен). */
const PRODUCTS_PINNED_COLUMNS = [
  { id: 'select' as const, width: 48, widthClass: 'w-12 min-w-[48px] max-w-[48px]' },
  { id: 'product' as const, width: 520, widthClass: PRODUCTS_TABLE_PRODUCT_COL_CLASS },
  {
    id: 'glueLeader' as const,
    width: 128,
    widthClass: 'w-[128px] min-w-[128px] max-w-[128px]',
  },
  { id: 'campaignType' as const, width: 160, widthClass: 'w-[160px] min-w-[160px] max-w-[160px]' },
  { id: 'bid' as const, width: 132, widthClass: 'w-[132px] min-w-[132px] max-w-[132px]' },
  { id: 'budgetRemainder' as const, width: 180, widthClass: 'w-[180px] min-w-[180px] max-w-[180px]' },
  {
    id: 'dailyLimit' as const,
    width: 152,
    widthClass: 'w-[152px] min-w-[152px] max-w-[152px]',
  },
];

const PRODUCTS_PINNED_HEAD_Z: Record<(typeof PRODUCTS_PINNED_COLUMNS)[number]['id'], string> = {
  select: 'z-[21]',
  product: 'z-20',
  glueLeader: 'z-[19]',
  campaignType: 'z-[18]',
  bid: 'z-[17]',
  budgetRemainder: 'z-[16]',
  dailyLimit: 'z-[15]',
};

const PRODUCTS_PINNED_BODY_Z: Record<(typeof PRODUCTS_PINNED_COLUMNS)[number]['id'], string> = {
  select: 'z-[11]',
  product: 'z-10',
  glueLeader: 'z-[9]',
  campaignType: 'z-[8]',
  bid: 'z-[7]',
  budgetRemainder: 'z-[6]',
  dailyLimit: 'z-[5]',
};

function productRowToCreationItem(product: ProductRow): {
  nmId: number;
  productName: string;
  imageUrl: string;
  category: string;
} {
  const nmId =
    Number.parseInt(product.articleWb, 10) || Number.parseInt(product.article, 10);
  return {
    nmId: Number.isFinite(nmId) ? nmId : 0,
    productName: product.name,
    imageUrl: product.image,
    category: product.category || 'Товары',
  };
}

function productRowToSingleCampaignSeed(product: ProductRow): SingleCampaignSeedProduct {
  const item = productRowToCreationItem(product);
  return { ...item, cpcCompatible: true };
}

function buildPromoteNotPromotedProductPreset(product: ProductRow): RepeatLaunchPreset {
  const seed = productRowToSingleCampaignSeed(product);
  const dateLabel = new Date().toLocaleDateString('ru-RU');
  return {
    product: seed,
    campaignName: `${product.name} CPC ${dateLabel}`,
  };
}

function productsPinnedColumnWidthPx(
  col: (typeof PRODUCTS_PINNED_COLUMNS)[number],
  compactProductColumn: boolean,
): number {
  if (compactProductColumn && col.id === 'select') {
    return CONCEPT_NOT_PROMOTED_SELECT_WIDTH_PX;
  }
  if (compactProductColumn && col.id === 'product') {
    return CONCEPT_NOT_PROMOTED_PRODUCT_PIN_WIDTH_PX;
  }
  return col.width;
}

function productsPinnedLeftPx(
  columnId: string,
  visibility: Record<string, boolean>,
  compactProductColumn = false,
): number {
  let left = 0;
  for (const col of PRODUCTS_PINNED_COLUMNS) {
    if (col.id === columnId) return left;
    if (visibility[col.id] !== false) {
      left += productsPinnedColumnWidthPx(col, compactProductColumn);
    }
  }
  return left;
}

function productsPinnedTotalPx(visibility: Record<string, boolean>): number {
  return PRODUCTS_PINNED_COLUMNS.reduce(
    (sum, col) => (visibility[col.id] !== false ? sum + col.width : sum),
    0,
  );
}

function lastVisibleProductsPinnedColumnId(
  visibility: Record<string, boolean>,
): (typeof PRODUCTS_PINNED_COLUMNS)[number]['id'] | null {
  let last: (typeof PRODUCTS_PINNED_COLUMNS)[number]['id'] | null = null;
  for (const col of PRODUCTS_PINNED_COLUMNS) {
    if (visibility[col.id] !== false) last = col.id;
  }
  return last;
}

/** Тень на правом крае последней закреплённой колонки (не поверх прокручиваемых ячеек). */
const PRODUCTS_PINNED_EDGE_SHADOW_CLASS = 'shadow-[4px_0_10px_-3px_rgba(15,23,42,0.12)]';

function productsPinnedCellProps(
  columnId: (typeof PRODUCTS_PINNED_COLUMNS)[number]['id'],
  visibility: Record<string, boolean>,
  variant: 'head' | 'body' | 'bodyNested',
  extraClass = '',
  showPinnedEdgeShadow = false,
  conceptWhiteHead = false,
  compactProductColumn = false,
): { className: string; style: React.CSSProperties } {
  const meta = PRODUCTS_PINNED_COLUMNS.find((c) => c.id === columnId)!;
  let widthClass = meta.widthClass;
  if (compactProductColumn && columnId === 'product') {
    widthClass = CONCEPT_NOT_PROMOTED_PRODUCT_COL_CLASS;
  } else if (compactProductColumn && columnId === 'select') {
    widthClass = 'w-12 min-w-[48px] max-w-[48px]';
  }
  const z = variant === 'head' ? PRODUCTS_PINNED_HEAD_Z[columnId] : PRODUCTS_PINNED_BODY_Z[columnId];
  const bg =
    variant === 'head'
      ? conceptWhiteHead
        ? 'bg-white'
        : 'bg-gray-50'
      : variant === 'bodyNested'
        ? 'bg-gray-50'
        : 'bg-white group-hover/product-row:bg-gray-50';
  const edgeShadow =
    showPinnedEdgeShadow && lastVisibleProductsPinnedColumnId(visibility) === columnId
      ? PRODUCTS_PINNED_EDGE_SHADOW_CLASS
      : '';
  const isPinned = visibility[columnId] !== false;
  return {
    className: [isPinned ? 'sticky' : '', isPinned ? z : '', widthClass, isPinned ? bg : '', edgeShadow, extraClass]
      .filter(Boolean)
      .join(' '),
    style: isPinned ? { left: productsPinnedLeftPx(columnId, visibility, compactProductColumn) } : {},
  };
}

const PRODUCTS_PINNED_TH_CLASS = 'px-4 py-4 text-left font-normal align-middle';
const PRODUCTS_PINNED_TH_PRODUCT_CLASS = 'pl-[5px] pr-5 py-4 text-left font-normal align-middle';

/** Колонка чекбокса: выравнивание к правому краю ячейки (ближе к колонке «Товар»). */
const PRODUCTS_SELECT_TH_CLASS = 'pl-2 pr-3 py-4 text-right';
const PRODUCTS_SELECT_TD_CLASS = 'pl-2 pr-3 py-4 align-middle text-right';
const PRODUCTS_SELECT_TH_CLASS_COMPACT = 'pl-1 pr-4 py-2.5 text-right';
const PRODUCTS_SELECT_TD_CLASS_COMPACT = 'align-middle pl-1 pr-4 py-2.5 text-right';

/** Мультикарточки: чекбокс ближе к колонке «Товар». */
const CONCEPT_MULTICARD_SELECT_TH_CLASS = 'flex items-center justify-end pl-1 pr-2.5 py-4';
const CONCEPT_MULTICARD_SELECT_TD_CLASS =
  'flex items-center justify-end pl-1 pr-2.5 py-4 align-middle';
const CONCEPT_MULTICARD_SELECT_TD_CLASS_NESTED =
  'flex items-center justify-start pl-1 pr-0.5 py-4 align-middle';

/** Таблицы концепта (все вкладки товаров и кампаний): 18px, обводка как на «Мультикарточках», чуть светлее. */
const CONCEPT_LIST_TABLE_CHECKBOX_INNER_CLASS =
  '[&_.ant-checkbox-inner]:!h-[18px] [&_.ant-checkbox-inner]:!w-[18px] [&_.ant-checkbox-inner]:!border-2 [&_.ant-checkbox-inner]:!border-gray-300 [&_.ant-checkbox-checked_.ant-checkbox-inner]:!border-violet-500 [&_.ant-checkbox-checked_.ant-checkbox-inner]:!bg-violet-500 [&_.ant-checkbox-indeterminate_.ant-checkbox-inner]:!border-violet-500 [&_.ant-checkbox-indeterminate_.ant-checkbox-inner]:!bg-violet-500';
const CONCEPT_LIST_TABLE_CHECKBOX_CLASSNAME = `w-[18px] shrink-0 text-purple-600 ${CONCEPT_LIST_TABLE_CHECKBOX_INNER_CLASS}`;

const PRODUCT_TABLE_THUMB_CLASS =
  'h-[38px] w-[30px] shrink-0 rounded-md border border-gray-100 bg-gray-50 object-cover';

function ProductTableThumb({
  productId,
  src,
  category,
  alt = '',
  allTabListRowIndex,
}: {
  productId: string;
  src: string;
  category?: string;
  alt?: string;
  /** Вкладка «Мультикарточки»: позиция в отсортированном списке (первые 15 — разные фото). */
  allTabListRowIndex?: number;
}) {
  const [url, setUrl] = useState(() =>
    resolveProductTableThumbSrc(productId, src, category, allTabListRowIndex),
  );
  useEffect(() => {
    setUrl(resolveProductTableThumbSrc(productId, src, category, allTabListRowIndex));
  }, [src, productId, category, allTabListRowIndex]);
  return (
    <img
      src={url}
      alt={alt}
      width={30}
      height={38}
      className={PRODUCT_TABLE_THUMB_CLASS}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => {
        const picsum = productTableThumbFallbackUrl(productId);
        const byProduct = productTableThumbUrl(productId, category);
        if (url !== picsum) {
          setUrl(picsum);
          return;
        }
        if (url !== byProduct) {
          setUrl(byProduct);
          return;
        }
        if (url !== PRODUCT_TABLE_THUMB_FALLBACK) {
          setUrl(PRODUCT_TABLE_THUMB_FALLBACK);
        }
      }}
    />
  );
}

function productHasCampaignConflict(product: ProductRow): boolean {
  const types = new Set(product.campaigns.map((c) => c.type));
  return product.campaigns.length >= 2 && types.has('CPC') && types.has('CPM');
}

function formatProductCampaignCount(count: number): string {
  return `${count} ${getPlural(count, 'кампания', 'кампании', 'кампаний')}`;
}

function pickPrimaryCpcCampaign(product: ProductRow): ProductCampaign | undefined {
  const cpcCampaigns = product.campaigns.filter((c) => c.type === 'CPC');
  if (cpcCampaigns.length === 0) return undefined;
  return (
    cpcCampaigns.find((c) => c.status === 'active') ??
    cpcCampaigns.find((c) => c.status === 'paused') ??
    cpcCampaigns[0]
  );
}

type ConceptAllTabMulticardRailPosition = 'first' | 'middle' | 'last';

type ConceptAllTabTableRow = {
  product: ProductRow;
  multicardRail: ConceptAllTabMulticardRailPosition | null;
  multicardGroupStartsSection: boolean;
  multicardGroupMembers: ProductRow[] | null;
};

const CONCEPT_ALL_TAB_MULTICARD_RAIL_WIDTH_PX = 20;

/** Визуальный зазор между группами мультикарточек (цвет фона страницы). */
const CONCEPT_MULTICARD_GROUP_SECTION_GAP_CLASS = 'border-t-[32px] border-t-[#F3F5F8]';

/** Единый сдвиг вправо для строк товаров внутри развёрнутой группы (полоса, чекбокс, «Товар»). */
const CONCEPT_MULTICARD_GROUP_MEMBER_INDENT_PX = 32;
const CONCEPT_MULTICARD_GROUP_MEMBER_CONTENT_INDENT_CLASS = 'ml-8';

/** Демо-id мультикарточки (категория + начало названия). */
function demoConceptMulticardGroupId(product: Pick<ProductRow, 'name' | 'category'>): string {
  const stem = product.name.trim().split(/\s+/).slice(0, 2).join(' ').toLowerCase();
  let h = 0;
  const key = `${product.category}|${stem}`;
  for (let i = 0; i < key.length; i++) h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
  return `mk-${Math.abs(h) % 12}`;
}

/** Название склейки по категориям и типу товаров в группе. */
function formatConceptMulticardGroupDefaultTitle(members: ProductRow[]): string {
  if (members.length === 0) return 'Склейка';

  const categories = [...new Set(members.map((m) => m.category.trim()).filter(Boolean))];
  if (categories.length === 1) {
    return categories[0]!;
  }

  const typeTokens = members.map((m) => {
    const parts = m.name.trim().split(/\s+/).filter(Boolean);
    return parts[0] ?? m.name.trim();
  });
  const uniqueTypes = [...new Set(typeTokens.map((t) => t.toLowerCase()))];
  if (uniqueTypes.length === 1 && typeTokens[0]) {
    return typeTokens[0]!;
  }

  if (categories.length === 2) {
    return `${categories[0]} и ${categories[1]}`;
  }
  if (categories.length > 2) {
    return `${categories[0]} и ещё ${categories.length - 1}`;
  }

  if (typeTokens.length <= 2) {
    return [...new Set(typeTokens)].join(' · ');
  }
  return `${typeTokens[0]} · ${typeTokens[1]} +${typeTokens.length - 2}`;
}

function buildConceptMulticardMembershipIndex(
  catalog: ProductRow[],
): Map<string, ProductRow[]> {
  const buckets = new Map<string, ProductRow[]>();
  for (const product of catalog) {
    const groupId = demoConceptMulticardGroupId(product);
    const list = buckets.get(groupId);
    if (list) list.push(product);
    else buckets.set(groupId, [product]);
  }
  const index = new Map<string, ProductRow[]>();
  for (const [groupId, members] of buckets) {
    index.set(groupId, members);
  }
  return index;
}

function productMatchesConceptSearchQuery(product: ProductRow, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return false;
  if (
    (product.name && product.name.toLowerCase().includes(q)) ||
    (product.article && product.article.toLowerCase().includes(q)) ||
    (product.articleWb && product.articleWb.toLowerCase().includes(q)) ||
    (product.articleSeller && product.articleSeller.toLowerCase().includes(q))
  ) {
    return true;
  }
  return product.campaigns.some(
    (camp) =>
      (camp.name && camp.name.toLowerCase().includes(q)) ||
      String(camp.campaignId).toLowerCase().includes(q),
  );
}

/** На «Мультикарточках» при поиске показываем всю склейку, если совпал любой её товар (в рамках вкладки). */
function expandConceptMulticardProductsForSearch(
  searchHits: ProductRow[],
  tabScopedProducts: ProductRow[],
  membershipIndex: Map<string, ProductRow[]>,
): ProductRow[] {
  const tabById = new Map(tabScopedProducts.map((p) => [p.id, p]));
  const seen = new Set<string>();
  const result: ProductRow[] = [];

  const appendId = (id: string) => {
    if (seen.has(id)) return;
    const row = tabById.get(id);
    if (!row) return;
    seen.add(id);
    result.push(row);
  };

  for (const hit of searchHits) {
    const groupId = demoConceptMulticardGroupId(hit);
    const members = membershipIndex.get(groupId);
    if (members && members.length > 1) {
      for (const member of members) {
        appendId(member.id);
      }
    } else {
      appendId(hit.id);
    }
  }

  return result;
}

function getConceptMulticardGroupIdForProduct(
  product: ProductRow,
  membershipIndex: Map<string, ProductRow[]>,
): string | null {
  const groupId = demoConceptMulticardGroupId(product);
  return membershipIndex.has(groupId) ? groupId : null;
}

function buildConceptAllTabGroupedTableRows(
  sortedProducts: ProductRow[],
  membershipIndex: Map<string, ProductRow[]>,
  productCampaignStatusOverride: Record<string, 'active' | 'paused'>,
  demoNotPromotedProductIds: Set<string>,
): ConceptAllTabTableRow[] {
  const emittedGroups = new Set<string>();
  const rows: ConceptAllTabTableRow[] = [];

  for (const product of sortedProducts) {
    const groupId = getConceptMulticardGroupIdForProduct(product, membershipIndex);
    if (!groupId) {
      rows.push({
        product,
        multicardRail: null,
        multicardGroupStartsSection: false,
        multicardGroupMembers: null,
      });
      continue;
    }
    if (emittedGroups.has(groupId)) continue;
    emittedGroups.add(groupId);

    const groupInView = sortedProducts.filter(
      (candidate) =>
        getConceptMulticardGroupIdForProduct(candidate, membershipIndex) === groupId,
    );
    const sectionStartsAfterGap = rows.length > 0;
    const groupMembers = sortMulticardGroupMembersByGlueStrength(
      groupInView,
      demoNotPromotedProductIds,
      productCampaignStatusOverride,
    );

    if (groupMembers.length === 1) {
      rows.push({
        product: groupMembers[0]!,
        multicardRail: null,
        multicardGroupStartsSection: sectionStartsAfterGap,
        multicardGroupMembers: groupMembers,
      });
      continue;
    }

    groupMembers.forEach((member, memberIndex) => {
      const multicardRail: ConceptAllTabMulticardRailPosition | null =
        groupMembers.length === 1
          ? 'first'
          : memberIndex === 0
            ? 'first'
            : memberIndex === groupMembers.length - 1
              ? 'last'
              : 'middle';

      rows.push({
        product: member,
        multicardRail,
        multicardGroupStartsSection: memberIndex === 0 && sectionStartsAfterGap,
        multicardGroupMembers: groupMembers,
      });
    });
  }
  return rows;
}

/** Демо на «Мультикарточки»: у 1-й / 2-й / 3-й группы в списке столько товаров без продвижения. */
const CONCEPT_MULTICARD_TAB_DEMO_NOT_PROMOTED_COUNTS = [1, 2, 3] as const;

function isConceptMulticardGroupLeaderRow(row: ConceptAllTabTableRow): boolean {
  const members = row.multicardGroupMembers;
  if (!members?.length) return false;
  return members[0]!.id === row.product.id;
}

function buildConceptMulticardTabDemoNotPromotedProductIds(
  rows: ConceptAllTabTableRow[],
): Set<string> {
  const ids = new Set<string>();
  let groupOrdinal = 0;
  for (const row of rows) {
    if (!isConceptMulticardGroupLeaderRow(row)) continue;
    const notPromotedCount = CONCEPT_MULTICARD_TAB_DEMO_NOT_PROMOTED_COUNTS[groupOrdinal];
    if (notPromotedCount !== undefined && notPromotedCount > 0) {
      const members = row.multicardGroupMembers;
      const start = Math.max(0, members.length - notPromotedCount);
      for (let i = start; i < members.length; i++) {
        ids.add(members[i]!.id);
      }
    }
    groupOrdinal += 1;
    if (groupOrdinal >= CONCEPT_MULTICARD_TAB_DEMO_NOT_PROMOTED_COUNTS.length) break;
  }
  return ids;
}

function conceptAllTabMulticardGroupRowSpan(
  members: ProductRow[],
  expandedProductIds: Set<string>,
): number {
  return members.reduce((rowCount, member) => {
    let rowsForProduct = 1;
    if (expandedProductIds.has(member.id)) {
      rowsForProduct += member.campaigns.length;
    }
    return rowCount + rowsForProduct;
  }, 0);
}

function conceptAllTabMemberNotPromotedForAggregate(
  product: ProductRow,
  productCampaignStatusOverride: Record<string, 'active' | 'paused'>,
  demoNotPromotedProductIds: Set<string>,
): boolean {
  return (
    productConceptIsNotPromoted(product, productCampaignStatusOverride) ||
    demoNotPromotedProductIds.has(product.id)
  );
}

function aggregateMulticardGroupStats(
  members: ProductRow[],
  demoNotPromotedProductIds: Set<string>,
  productCampaignStatusOverride: Record<string, 'active' | 'paused'>,
): { stats: ProductStatsExtended; groupKey: string } | null {
  let spend = 0;
  let impressions = 0;
  let orders = 0;
  let spendShare = 0;
  let weightedCtr = 0;
  let hasData = false;

  for (const product of members) {
    if (
      conceptAllTabMemberNotPromotedForAggregate(
        product,
        productCampaignStatusOverride,
        demoNotPromotedProductIds,
      )
    ) {
      continue;
    }
    const agg = productRowStatsAgg(product, false);
    if (!agg) continue;
    hasData = true;
    spend += agg.spend;
    impressions += agg.impressions;
    orders += agg.orders;
    spendShare += agg.spendShare;
    weightedCtr += agg.impressions * agg.ctr;
  }

  if (!hasData) return null;

  const ctr = impressions > 0 ? weightedCtr / impressions : 0;
  const stats = buildExtendedProductStats({
    spend,
    impressions,
    ctr,
    orders,
    spendShare,
  });
  return { stats, groupKey: members.map((m) => m.id).join('|') };
}

function conceptMulticardGroupPromotedCount(
  members: ProductRow[],
  productCampaignStatusOverride: Record<string, 'active' | 'paused'>,
  demoNotPromotedProductIds: Set<string>,
): number {
  return members.filter(
    (p) => !conceptAllTabMemberNotPromotedForAggregate(p, productCampaignStatusOverride, demoNotPromotedProductIds),
  ).length;
}

/** Прототип: колонка «В склейке» на вкладке «Мультикарточки». */
const MULTICARD_GLUE_LEADER_COLUMN_ID = 'glueLeader';
const MULTICARD_GLUE_LEADER_TH_CLASS =
  'px-2 py-3 text-left font-normal align-middle';
const MULTICARD_GLUE_LEADER_TD_CLASS = 'px-2 py-3 align-middle text-left';

type MulticardGlueLeaderRole = 'leader' | 'potential' | 'contributor' | 'single';

type MulticardGlueLeaderInsight = {
  role: MulticardGlueLeaderRole;
  productOrders: number;
  leaderOrders: number;
  groupTotalOrders: number;
  ordersShare: number;
  leaderProduct: ProductRow | null;
  showPotentialLabel: boolean;
  tooltip: string;
};

const MULTICARD_GLUE_LEADER_ROLE_SORT_RANK: Record<MulticardGlueLeaderRole, number> = {
  leader: 0,
  single: 0,
  potential: 1,
  contributor: 2,
};

const MULTICARD_GLUE_POTENTIAL_ORDERS_SHARE = 0.6;
/** Подпись «Потенциал» — только если заказы близки к лидеру (уже в роли potential). */
const MULTICARD_GLUE_POTENTIAL_LABEL_ORDERS_SHARE = 0.85;
const MULTICARD_GLUE_POTENTIAL_LABEL_TOOLTIP =
  'Увеличивайте общее число продаж в склейке: запустите товар с хорошим потенциалом в продвижение.';

function multicardGlueShowsPotentialLabel(
  role: MulticardGlueLeaderRole,
  productOrders: number,
  leaderOrders: number,
): boolean {
  if (role !== 'potential' || leaderOrders <= 0 || productOrders <= 0) {
    return false;
  }
  return productOrders >= leaderOrders * MULTICARD_GLUE_POTENTIAL_LABEL_ORDERS_SHARE;
}

function multicardMemberOrdersForGlueLeader(
  product: ProductRow,
  demoNotPromotedProductIds: Set<string>,
  productCampaignStatusOverride: Record<string, 'active' | 'paused'>,
): number {
  const useOrganic = conceptAllTabMemberNotPromotedForAggregate(
    product,
    productCampaignStatusOverride,
    demoNotPromotedProductIds,
  );
  return productRowStatsAgg(product, useOrganic)?.orders ?? 0;
}

function multicardGroupTotalOrdersForGlue(
  members: ProductRow[],
  demoNotPromotedProductIds: Set<string>,
  productCampaignStatusOverride: Record<string, 'active' | 'paused'>,
): number {
  return members.reduce(
    (sum, member) =>
      sum +
      multicardMemberOrdersForGlueLeader(
        member,
        demoNotPromotedProductIds,
        productCampaignStatusOverride,
      ),
    0,
  );
}

function resolveMulticardGlueLeaderProduct(
  members: ProductRow[],
  demoNotPromotedProductIds: Set<string>,
  productCampaignStatusOverride: Record<string, 'active' | 'paused'>,
): ProductRow | null {
  if (members.length === 0) return null;
  if (members.length === 1) return members[0]!;

  const ranked = members.map((m) => ({
    product: m,
    orders: multicardMemberOrdersForGlueLeader(
      m,
      demoNotPromotedProductIds,
      productCampaignStatusOverride,
    ),
    notPromoted: conceptAllTabMemberNotPromotedForAggregate(
      m,
      productCampaignStatusOverride,
      demoNotPromotedProductIds,
    ),
  }));
  const rankedPromotedWithOrders = ranked.filter((r) => !r.notPromoted && r.orders > 0);
  const maxOrders =
    rankedPromotedWithOrders.length > 0
      ? Math.max(...rankedPromotedWithOrders.map((r) => r.orders))
      : 0;
  if (maxOrders <= 0) return null;

  return (
    rankedPromotedWithOrders
      .filter((r) => r.orders === maxOrders)
      .sort((a, b) => a.product.id.localeCompare(b.product.id))[0]?.product ?? null
  );
}

function resolveMulticardGlueLeaderRole(
  product: ProductRow,
  members: ProductRow[],
  demoNotPromotedProductIds: Set<string>,
  productCampaignStatusOverride: Record<string, 'active' | 'paused'>,
): MulticardGlueLeaderRole {
  if (members.length <= 1) return 'single';

  const leader = resolveMulticardGlueLeaderProduct(
    members,
    demoNotPromotedProductIds,
    productCampaignStatusOverride,
  );
  const orders = multicardMemberOrdersForGlueLeader(
    product,
    demoNotPromotedProductIds,
    productCampaignStatusOverride,
  );
  const notPromoted = conceptAllTabMemberNotPromotedForAggregate(
    product,
    productCampaignStatusOverride,
    demoNotPromotedProductIds,
  );
  const leaderOrders = leader
    ? multicardMemberOrdersForGlueLeader(
        leader,
        demoNotPromotedProductIds,
        productCampaignStatusOverride,
      )
    : 0;

  if (leader && leader.id === product.id && !notPromoted && orders > 0) {
    return 'leader';
  }
  if (leaderOrders <= 0) {
    return 'contributor';
  }
  const potentialThreshold = leaderOrders * MULTICARD_GLUE_POTENTIAL_ORDERS_SHARE;
  return orders >= potentialThreshold ? 'potential' : 'contributor';
}

function sortMulticardGroupMembersByGlueStrength(
  members: ProductRow[],
  demoNotPromotedProductIds: Set<string>,
  productCampaignStatusOverride: Record<string, 'active' | 'paused'>,
): ProductRow[] {
  if (members.length <= 1) return members;

  return [...members].sort((a, b) => {
    const roleA = resolveMulticardGlueLeaderRole(
      a,
      members,
      demoNotPromotedProductIds,
      productCampaignStatusOverride,
    );
    const roleB = resolveMulticardGlueLeaderRole(
      b,
      members,
      demoNotPromotedProductIds,
      productCampaignStatusOverride,
    );
    const byRank =
      MULTICARD_GLUE_LEADER_ROLE_SORT_RANK[roleA] -
      MULTICARD_GLUE_LEADER_ROLE_SORT_RANK[roleB];
    if (byRank !== 0) return byRank;

    const ordersA = multicardMemberOrdersForGlueLeader(
      a,
      demoNotPromotedProductIds,
      productCampaignStatusOverride,
    );
    const ordersB = multicardMemberOrdersForGlueLeader(
      b,
      demoNotPromotedProductIds,
      productCampaignStatusOverride,
    );
    if (ordersB !== ordersA) return ordersB - ordersA;
    return a.id.localeCompare(b.id);
  });
}

function resolveMulticardGlueLeaderInsight(
  product: ProductRow,
  members: ProductRow[] | null,
  demoNotPromotedProductIds: Set<string>,
  productCampaignStatusOverride: Record<string, 'active' | 'paused'>,
): MulticardGlueLeaderInsight | null {
  if (!members || members.length === 0) return null;

  if (members.length === 1) {
    const orders = multicardMemberOrdersForGlueLeader(
      product,
      demoNotPromotedProductIds,
      productCampaignStatusOverride,
    );
    return {
      role: 'single',
      productOrders: orders,
      leaderOrders: orders,
      groupTotalOrders: orders,
      ordersShare: orders > 0 ? 1 : 0,
      leaderProduct: product,
      showPotentialLabel: false,
      tooltip: 'В склейке один товар',
    };
  }

  const groupTotalOrders = multicardGroupTotalOrdersForGlue(
    members,
    demoNotPromotedProductIds,
    productCampaignStatusOverride,
  );
  const role = resolveMulticardGlueLeaderRole(
    product,
    members,
    demoNotPromotedProductIds,
    productCampaignStatusOverride,
  );
  const leader = resolveMulticardGlueLeaderProduct(
    members,
    demoNotPromotedProductIds,
    productCampaignStatusOverride,
  );
  const productOrders = multicardMemberOrdersForGlueLeader(
    product,
    demoNotPromotedProductIds,
    productCampaignStatusOverride,
  );
  const leaderOrders = leader
    ? multicardMemberOrdersForGlueLeader(
        leader,
        demoNotPromotedProductIds,
        productCampaignStatusOverride,
      )
    : 0;
  const ordersShare =
    groupTotalOrders > 0 ? Math.min(1, productOrders / groupTotalOrders) : 0;
  const sharePct = Math.round(ordersShare * 100);

  let tooltip: string;
  if (role === 'leader') {
    tooltip = `${productOrders} из ${groupTotalOrders} зак. склейки (${sharePct}%) — лидер среди продвигаемых`;
  } else if (role === 'potential') {
    tooltip = `${productOrders} из ${groupTotalOrders} зак. склейки (${sharePct}%) — высокий спрос без продвижения`;
  } else {
    tooltip = `${productOrders} из ${groupTotalOrders} зак. склейки (${sharePct}%)`;
  }

  return {
    role,
    productOrders,
    leaderOrders,
    groupTotalOrders,
    ordersShare,
    leaderProduct: leader,
    showPotentialLabel: multicardGlueShowsPotentialLabel(role, productOrders, leaderOrders),
    tooltip,
  };
}

function MulticardGluePotentialLabel() {
  const labelRef = useRef<HTMLSpanElement>(null);
  const [hovered, setHovered] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const syncAnchorRect = useCallback(() => {
    const el = labelRef.current;
    if (!el) return;
    setAnchorRect(el.getBoundingClientRect());
  }, []);

  useEffect(() => {
    if (!hovered) return;
    syncAnchorRect();
    const onScrollOrResize = () => syncAnchorRect();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [hovered, syncAnchorRect]);

  return (
    <>
      <span
        ref={labelRef}
        className="cursor-help text-[11px] font-medium leading-none text-gray-500"
        aria-label={MULTICARD_GLUE_POTENTIAL_LABEL_TOOLTIP}
        onMouseEnter={() => {
          syncAnchorRect();
          setHovered(true);
        }}
        onMouseLeave={() => setHovered(false)}
      >
        Потенциал
      </span>
      {hovered && anchorRect && typeof document !== 'undefined'
        ? ReactDOM.createPortal(
            <div
              role="tooltip"
              className="fixed z-[220] w-[min(300px,calc(100vw-24px))] rounded-lg bg-gray-900 p-3 text-left text-xs leading-snug text-white shadow-lg"
              style={{
                top: anchorRect.bottom + 6,
                left: Math.min(anchorRect.left, window.innerWidth - 316),
              }}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
            >
              {MULTICARD_GLUE_POTENTIAL_LABEL_TOOLTIP}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function MulticardGlueLeaderCell({ insight }: { insight: MulticardGlueLeaderInsight | null }) {
  if (!insight || insight.role === 'single') {
    return <span className="text-xs text-gray-300">—</span>;
  }

  const sharePct = Math.round(insight.ordersShare * 100);
  const fillWidthPct =
    insight.productOrders > 0 ? Math.max(4, sharePct) : 0;
  const fillClass =
    insight.role === 'leader' ? 'bg-emerald-500' : 'bg-gray-300';

  return (
    <div className="flex w-full min-w-0 flex-col gap-1">
      <div
        className="flex items-center gap-1.5"
        title={insight.tooltip}
        aria-label={insight.tooltip}
      >
        <div
          className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-100"
          aria-hidden
        >
          <div
            className={`h-full rounded-full ${fillClass}`}
            style={{ width: `${fillWidthPct}%` }}
          />
        </div>
        <span className="shrink-0 text-[10px] font-semibold tabular-nums leading-none text-gray-700">
          {sharePct}%
        </span>
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        {insight.role === 'leader' ? (
          <span className="text-[11px] font-medium leading-none text-emerald-600">Лидер</span>
        ) : insight.showPotentialLabel ? (
          <MulticardGluePotentialLabel />
        ) : null}
        <span
          className="truncate text-xs tabular-nums leading-none text-gray-600"
          title={insight.tooltip}
        >
          {insight.productOrders} зак.
        </span>
      </div>
    </div>
  );
}

function ConceptMulticardGroupMemberThumbnailStack({
  members,
  listRowIndexBase,
}: {
  members: ProductRow[];
  listRowIndexBase: number;
}) {
  const shown = members.slice(0, 3);
  if (shown.length === 0) return null;

  const stackStepY = 5;
  const stackStepX = 3;
  const thumbHeight = 38;
  const thumbWidth = 28;
  const stackHeight = thumbHeight + (shown.length - 1) * stackStepY;
  const stackWidth = thumbWidth + (shown.length - 1) * stackStepX;

  return (
    <div
      className="relative shrink-0 overflow-visible"
      style={{ width: stackWidth, height: stackHeight, minWidth: stackWidth }}
      aria-hidden
    >
      {shown.map((product, index) => (
        <ConceptMulticardGroupStackThumb
          key={product.id}
          product={product}
          index={index}
          listRowIndex={listRowIndexBase + index}
          stackDepth={shown.length}
          offsetX={index * stackStepX}
          offsetY={index * stackStepY}
        />
      ))}
    </div>
  );
}

function ConceptMulticardGroupStackThumb({
  product,
  index,
  listRowIndex,
  stackDepth,
  offsetX,
  offsetY,
}: {
  product: ProductRow;
  index: number;
  listRowIndex: number;
  stackDepth: number;
  offsetX: number;
  offsetY: number;
}) {
  const [url, setUrl] = useState(() =>
    resolveProductTableThumbSrc(product.id, product.image, product.category, listRowIndex),
  );
  useEffect(() => {
    setUrl(
      resolveProductTableThumbSrc(product.id, product.image, product.category, listRowIndex),
    );
  }, [product.id, product.image, product.category, listRowIndex]);

  return (
    <img
      src={url}
      alt=""
      className="absolute h-[38px] w-7 shrink-0 rounded-[6px] bg-gray-100 object-cover ring-2 ring-white"
      style={{
        top: offsetY,
        left: offsetX,
        zIndex: stackDepth - index,
      }}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => {
        const fallback = productTableThumbFallbackUrl(product.id);
        if (url !== fallback) setUrl(fallback);
      }}
    />
  );
}

function ConceptMulticardGroupPromotedInfographic({
  promoted,
  total,
}: {
  promoted: number;
  total: number;
}) {
  const safeTotal = Math.max(total, 0);
  const clampedPromoted = Math.min(Math.max(promoted, 0), safeTotal || 0);

  if (safeTotal === 0) {
    return (
      <p className="mt-1.5 text-xs leading-none text-gray-500">Нет товаров в группе</p>
    );
  }

  return (
    <p
      className="mt-1.5 text-xs leading-none text-gray-500"
      aria-label={`Продвигаются ${clampedPromoted} из ${safeTotal}`}
    >
      Продвигаются{' '}
      <span className="font-semibold tabular-nums text-gray-800">
        {clampedPromoted}/{safeTotal}
      </span>
    </p>
  );
}

type ConceptAllTabMulticardGroupStatsRowProps = {
  groupId: string;
  groupTitleOverride?: string;
  onGroupTitleChange: (groupId: string, title: string | null) => void;
  members: ProductRow[];
  sectionGap: boolean;
  demoNotPromotedProductIds: Set<string>;
  productCampaignStatusOverride: Record<string, 'active' | 'paused'>;
  selectedProductIds: string[];
  onSelectGroup: (memberIds: string[], checked: boolean) => void;
  productsTablePinnedCellProps: (
    column:
      | 'select'
      | 'product'
      | 'glueLeader'
      | 'campaignType'
      | 'bid'
      | 'budgetRemainder'
      | 'dailyLimit',
    variant: 'head' | 'body' | 'bodyNested',
    className: string,
  ) => Record<string, unknown>;
  productsColVisible: (columnId: string) => boolean;
  showProductsCampaignTypeColumn: boolean;
  showProductsBidColumn: boolean;
  listRowIndexBase: number;
  groupExpanded: boolean;
  onToggleGroupExpanded: () => void;
};

function ConceptMulticardGroupTitleEditor({
  groupId,
  defaultTitle,
  titleOverride,
  onTitleChange,
}: {
  groupId: string;
  defaultTitle: string;
  titleOverride?: string;
  onTitleChange: (groupId: string, title: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const displayTitle = titleOverride?.trim() ? titleOverride.trim() : defaultTitle;

  useEffect(() => {
    if (!editing) return;
    setDraft(titleOverride?.trim() ? titleOverride.trim() : defaultTitle);
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing, defaultTitle, titleOverride]);

  const cancel = () => {
    setEditing(false);
  };

  const commit = () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === defaultTitle) {
      onTitleChange(groupId, null);
    } else {
      onTitleChange(groupId, trimmed);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <div
        className="relative flex min-w-0 max-w-[300px] items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          className="mb-0 w-full min-w-0 rounded-lg border border-violet-300 bg-white py-1 pl-2 pr-9 text-sm font-semibold leading-snug text-gray-900 shadow-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              cancel();
            }
          }}
          aria-label="Название группы мультикарточки"
        />
        <button
          type="button"
          onClick={commit}
          className="absolute right-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#9a41fe] transition-colors hover:bg-violet-50"
          aria-label="Сохранить название"
        >
          <Check className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="group/title -mx-1 mb-0 flex min-w-0 max-w-[300px] cursor-text items-center gap-1.5 rounded-md px-1 py-0.5 text-left text-sm font-semibold leading-none text-gray-900 transition-colors hover:bg-violet-50/70 hover:text-[#7c3aed]"
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      title="Нажмите, чтобы изменить название"
    >
      <span className="min-w-0 truncate">{displayTitle}</span>
      <Edit2 className="h-3.5 w-3.5 shrink-0 text-gray-400 opacity-0 transition-opacity group-hover/title:opacity-100 group-hover/title:text-[#9a41fe]" />
    </button>
  );
}

function ConceptAllTabMulticardGroupStatsRow({
  groupId,
  groupTitleOverride,
  onGroupTitleChange,
  members,
  sectionGap,
  demoNotPromotedProductIds,
  productCampaignStatusOverride,
  selectedProductIds,
  onSelectGroup,
  productsTablePinnedCellProps,
  productsColVisible,
  showProductsCampaignTypeColumn,
  showProductsBidColumn,
  listRowIndexBase,
  groupExpanded,
  onToggleGroupExpanded,
}: ConceptAllTabMulticardGroupStatsRowProps) {
  const memberIds = members.map((m) => m.id);
  const selectedInGroup = memberIds.filter((id) => selectedProductIds.includes(id)).length;
  const allSelected = memberIds.length > 0 && selectedInGroup === memberIds.length;
  const indeterminate = selectedInGroup > 0 && !allSelected;
  const promoted = conceptMulticardGroupPromotedCount(
    members,
    productCampaignStatusOverride,
    demoNotPromotedProductIds,
  );
  const defaultGroupTitle = formatConceptMulticardGroupDefaultTitle(members);
  const groupStats = aggregateMulticardGroupStats(
    members,
    demoNotPromotedProductIds,
    productCampaignStatusOverride,
  );
  const groupStockTotal = members.reduce((sum, m) => sum + m.stockLeft, 0);

  return (
    <tr
      className={`group/product-row bg-gray-50/40 transition-colors hover:bg-gray-50/80 ${
        sectionGap ? CONCEPT_MULTICARD_GROUP_SECTION_GAP_CLASS : ''
      }`}
    >
      <td
        className="sticky left-0 z-[22] w-5 min-w-[20px] max-w-[20px] border-0 bg-white p-0 align-top group-hover/product-row:bg-gray-50"
        aria-hidden
      />
      <td
        {...productsTablePinnedCellProps('select', 'body', PRODUCTS_SELECT_TD_CLASS)}
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={allSelected}
          indeterminate={indeterminate}
          onChange={(e) => onSelectGroup(memberIds, e.target.checked)}
          className={CONCEPT_LIST_TABLE_CHECKBOX_CLASSNAME}
          aria-label={`Выбрать все товары в группе: ${members.length} ${getPlural(members.length, 'товар', 'товара', 'товаров')}`}
        />
      </td>
      {productsColVisible('product') ? (
        <td {...productsTablePinnedCellProps('product', 'body', 'pl-0 pr-5 py-3 align-middle')}>
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              onClick={onToggleGroupExpanded}
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center border-0 bg-transparent p-0 text-gray-400 transition-colors hover:text-gray-600"
              aria-expanded={groupExpanded}
              aria-label={groupExpanded ? 'Свернуть мультикарточку' : 'Развернуть мультикарточку'}
            >
              {groupExpanded ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </button>
            <ConceptMulticardGroupMemberThumbnailStack
              members={members}
              listRowIndexBase={listRowIndexBase}
            />
            <div className="min-w-0">
              <ConceptMulticardGroupTitleEditor
                groupId={groupId}
                defaultTitle={defaultGroupTitle}
                titleOverride={groupTitleOverride}
                onTitleChange={onGroupTitleChange}
              />
              <ConceptMulticardGroupPromotedInfographic
                promoted={promoted}
                total={members.length}
              />
            </div>
          </div>
        </td>
      ) : null}
      {productsColVisible(MULTICARD_GLUE_LEADER_COLUMN_ID) ? (
        <td
          {...productsTablePinnedCellProps(
            'glueLeader',
            'body',
            `${MULTICARD_GLUE_LEADER_TD_CLASS} bg-gray-50/40 group-hover/product-row:bg-gray-50/80`,
          )}
          aria-hidden
        />
      ) : null}
      {showProductsCampaignTypeColumn ? (
        <td {...productsTablePinnedCellProps('campaignType', 'body', 'p-4 align-top')} aria-hidden />
      ) : null}
      {showProductsBidColumn ? (
        <td {...productsTablePinnedCellProps('bid', 'body', 'px-2 py-3 align-top')} aria-hidden />
      ) : null}
      {productsColVisible('budgetRemainder') ? (
        <td
          {...productsTablePinnedCellProps('budgetRemainder', 'body', 'p-4 align-top')}
          aria-hidden
        />
      ) : null}
      {productsColVisible('dailyLimit') ? (
        <td
          {...productsTablePinnedCellProps('dailyLimit', 'body', 'px-2 py-3 align-top')}
          aria-hidden
        />
      ) : null}
      {productsColVisible('tags') ? (
        <td className="p-4 align-top w-[220px] min-w-[220px] max-w-[240px]" aria-hidden />
      ) : null}
      {PRODUCTS_STAT_COLUMN_LABELS.map((label) => {
        if (!productsColVisible(productsStatColumnId(label))) return null;
        return (
          <td key={label} className={PRODUCTS_STAT_TD_CLASS}>
            {groupStats ? (
              <ProductsStatMetricCell
                label={label}
                stats={groupStats.stats}
                productId={groupStats.groupKey}
                showTrend
              />
            ) : null}
          </td>
        );
      })}
      {productsColVisible(PRODUCTS_STOCK_COLUMN_ID) ? (
        <td className={PRODUCTS_STOCK_TD_CLASS}>
          <ProductStockStaticTotal total={groupStockTotal} />
        </td>
      ) : null}
    </tr>
  );
}

function ConceptAllTabMulticardRailCell({
  rowSpan,
  memberIndentPx = 0,
}: {
  rowSpan: number;
  memberIndentPx?: number;
}) {
  const barStyle: React.CSSProperties =
    memberIndentPx > 0
      ? {
          left: CONCEPT_ALL_TAB_MULTICARD_RAIL_WIDTH_PX + Math.round(memberIndentPx / 2),
        }
      : {};
  return (
    <td
      rowSpan={rowSpan}
      className="relative sticky left-0 z-[22] h-px w-5 min-w-[20px] max-w-[20px] border-0 bg-white p-0 align-top group-hover/product-row:bg-gray-50"
    >
      <div
        className={`pointer-events-none absolute bottom-2 top-2 w-1.5 rounded-full bg-[#d8dce2] ${
          memberIndentPx > 0 ? '' : 'left-1/2 -translate-x-1/2'
        }`}
        style={barStyle}
        aria-hidden
      />
    </td>
  );
}

function ProductCollapsedRowCell({
  product,
  expanded,
  onToggleExpand,
  showExpandControl = true,
  reserveExpandGutter = false,
  showPromoteUnderPhoto = false,
  onPromote,
  onProductTitleClick,
  allTabListRowIndex,
  multicardGroupMemberNested = false,
  multicardSearchHighlight = false,
}: {
  product: ProductRow;
  expanded: boolean;
  onToggleExpand: () => void;
  showExpandControl?: boolean;
  /** Пустое место под стрелку раскрытия (выравнивание фото на вкладке «Мультикарточки»). */
  reserveExpandGutter?: boolean;
  showPromoteUnderPhoto?: boolean;
  onPromote?: (product: ProductRow) => void;
  /** Переход на внутреннюю страницу (CPC-кампания товара). */
  onProductTitleClick?: () => void;
  allTabListRowIndex?: number;
  multicardGroupMemberNested?: boolean;
  /** Подсветка товара, совпавшего с поиском на вкладке «Мультикарточки». */
  multicardSearchHighlight?: boolean;
}) {
  const campaignCount = product.campaigns.length;
  const showConflict =
    !showPromoteUnderPhoto && productHasCampaignConflict(product);
  const promoteBtnClass =
    'inline-flex h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-[10px] bg-[rgba(74,74,89,0.08)] px-3 text-sm font-medium text-gray-700 hover:bg-[rgba(74,74,89,0.12)]';

  const searchHighlightTitleClass = multicardSearchHighlight
    ? 'rounded-md bg-violet-100 px-1.5 py-0.5 ring-1 ring-violet-300/90'
    : '';

  const productMeta = (
    <div className="min-w-0 flex-1">
      {onProductTitleClick ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onProductTitleClick();
          }}
          className={`mb-0 block w-full min-w-0 truncate pb-1.5 text-left text-sm font-semibold leading-none text-gray-900 transition-colors hover:text-[#9A41FE] ${searchHighlightTitleClass}`}
          title={product.name}
        >
          {product.name}
        </button>
      ) : (
        <p
          className={`mb-0 truncate pb-1.5 text-sm font-semibold leading-none text-gray-900 ${searchHighlightTitleClass}`}
        >
          {product.name}
        </p>
      )}
      <div className="mt-0.5 flex min-w-0 flex-nowrap items-center gap-2 text-xs leading-none text-gray-500">
        <span className="shrink-0 whitespace-nowrap">Арт. {product.articleWb}</span>
        {showExpandControl && campaignCount > 0 ? (
          <span className="shrink-0 whitespace-nowrap">{formatProductCampaignCount(campaignCount)}</span>
        ) : null}
        {showConflict ? (
          <span className="inline-flex min-w-0 shrink items-center gap-1 whitespace-nowrap text-gray-600">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden />
            <span className="truncate">Конфликт кампаний</span>
          </span>
        ) : null}
      </div>
    </div>
  );

  const expandGutterClass = 'inline-flex h-5 w-5 shrink-0 items-center justify-center';

  const nestedIndentClass = multicardGroupMemberNested
    ? CONCEPT_MULTICARD_GROUP_MEMBER_CONTENT_INDENT_CLASS
    : '';

  const productThumb = (
    <div className="relative shrink-0">
      <ProductTableThumb
        productId={product.id}
        src={product.image}
        category={product.category}
        allTabListRowIndex={allTabListRowIndex}
      />
    </div>
  );

  const rowMain = (
    <div
      className={`flex min-w-0 flex-1 items-center gap-2.5 ${nestedIndentClass}`}
    >
      {showExpandControl ? (
        <button
          type="button"
          onClick={onToggleExpand}
          className={`${expandGutterClass} border-0 bg-transparent p-0 transition-colors ${
            expanded ? 'text-violet-600' : 'text-gray-400 hover:text-gray-600'
          }`}
          aria-expanded={expanded}
          aria-label={expanded ? 'Свернуть кампании' : 'Развернуть кампании'}
        >
          {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
      ) : reserveExpandGutter ? (
        <span className={expandGutterClass} aria-hidden />
      ) : null}
      {showPromoteUnderPhoto ? (
        <div className="relative flex min-w-0 flex-1 items-center gap-3 pr-28">
          {productThumb}
          {productMeta}
          <div className="absolute right-0 top-1/2 z-[1] hidden -translate-y-1/2 items-center gap-1.5 group-hover/product-row:flex">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPromote?.(product);
              }}
              className={promoteBtnClass}
            >
              Продвигать
            </button>
          </div>
        </div>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {productThumb}
          {productMeta}
        </div>
      )}
    </div>
  );

  return rowMain;
}

const MAX_TAGS_PER_PRODUCT = 15;
const MAX_TAG_LENGTH = 15;

function normalizeTagName(tag: string): string {
  return tag.trim().slice(0, MAX_TAG_LENGTH);
}

/** Строит списки кампаний и дерево товаров из источника товаров. Связь товар ↔ кампании консистентна. */
function buildCampaignsAndProductTree(sources: ProductSource[]): { campaigns: DisplayCampaign[]; productTree: ProductRow[] } {
  let campaignId = 1400000;
  const campaigns: DisplayCampaign[] = [];
  const productTree: ProductRow[] = [];

  const tagToDisplay = (tag: CampaignSpec['tag']) => {
    if (!tag) return [];
    if (tag === 'info') return [{ text: 'Сезонный тренд', icon: <Zap className="w-3 h-3" />, type: 'info' as const }];
    if (tag === 'warning') return []; // бейдж «Заканчивается бюджет» не используется
    return [{ text: 'Нарушение +1', icon: <AlertTriangle className="w-3 h-3 text-red-600" />, type: 'error' as const }];
  };

  for (const p of sources) {
    const productImage = productTableThumbUrl(p.id, p.category);
    const articleWb = p.articleWb ?? p.article;
    const articleSeller = p.articleSeller ?? String((Number(p.article) || 0) + 5000000);
    const productCampaigns: ProductCampaign[] = [];
    let aggSpend = 0, aggImpressions = 0, aggOrders = 0;
    let aggCtrSum = 0, aggShareSum = 0, aggCount = 0;

    for (let i = 0; i < p.campaigns.length; i++) {
      const spec = p.campaigns[i];
      const cid = campaignId++;
      const tag = (spec.campaignTags && spec.campaignTags[0]) || (p.tags && p.tags[0]) || '—';
      const campName = `${articleWb} / ${articleSeller} / ${p.name} / ${tag}`;
      productCampaigns.push({
        id: `pc-${p.id}-${i}`,
        campaignId: cid,
        name: campName,
        status: spec.status,
        statusText: spec.statusText,
        type: spec.type,
        typeDetails: spec.typeDetails,
        budget: spec.budget,
        remainingBudget: spec.remainingBudget,
        autoRefill: spec.autoRefill,
        dailyLimit: spec.dailyLimit ?? null,
        dailyLimitExhausted: spec.dailyLimitExhausted,
        spend: spec.spend,
        impressions: spec.impressions,
        ctr: spec.ctr,
        orders: spec.orders,
        spendShare: spec.spendShare,
        avgPosition: spec.avgPosition,
        changeImpressions: spec.changeImpressions,
        changeCtr: spec.changeCtr,
        changeOrders: spec.changeOrders,
        changeShare: spec.changeShare,
        changePosition: spec.changePosition,
      });
      if (spec.spend > 0 || spec.impressions > 0) {
        aggSpend += spec.spend;
        aggImpressions += spec.impressions;
        aggOrders += spec.orders;
        aggCtrSum += spec.ctr;
        aggShareSum += spec.spendShare;
        aggCount++;
      }

      const typeIcons = spec.type === 'CPC' ? [<Search className="w-4 h-4 text-gray-400" key="s" />] : [<Search className="w-4 h-4 text-gray-400" key="s" />, <ThumbsUp className="w-4 h-4 text-gray-400" key="t" />];
      campaigns.push({
        id: String(cid),
        image: productImage,
        name: campName,
        category: p.category,
        status: spec.status,
        statusText: spec.statusText,
        campaignId: cid,
        tags: tagToDisplay(spec.tag),
        campaignTags: spec.campaignTags,
        productTags: (p.tags ?? []).map(normalizeTagName),
        productId: p.id,
        type: spec.type,
        typeDetails: spec.typeDetails,
        typeIcons,
        autoRefill: spec.autoRefill,
        autoRefillStatus: spec.autoRefill ? 'ok' : 'error',
        budget: spec.budget,
        remainingBudget: spec.remainingBudget,
        dailyLimit: spec.dailyLimit,
        dailyLimitExhausted: spec.dailyLimitExhausted,
        ...(spec.type === 'CPC' && {
          maxCpcBidRub: demoMaxCpcBidForCampaignId(cid),
        }),
        spend: spec.spend,
        impressions: spec.impressions,
        ctr: spec.ctr,
        orders: spec.orders,
        spendShare: spec.spendShare,
      });
    }

    const agg = productCampaigns.length > 0 ? {
      spend: aggSpend,
      impressions: aggImpressions,
      ctr: aggCount ? Math.round((aggCtrSum / aggCount) * 10) / 10 : 0,
      orders: aggOrders,
      spendShare: aggCount ? Math.round((aggShareSum / aggCount) * 10) / 10 : 0,
      changeSpend: -29.5,
      changeImpressions: -9.7,
      changeCtr: -1.3,
      changeOrders: 7.3,
      changeShare: -7.1,
    } : undefined;

    productTree.push({
      id: p.id,
      image: productImage,
      name: p.name,
      article: p.article,
      articleWb: p.articleWb ?? p.article,
      articleSeller: p.articleSeller ?? String((Number(p.article) || 0) + 5000000),
      category: p.category,
      campaignCount: p.campaigns.length,
      tags: (p.tags ?? []).map(normalizeTagName),
      campaigns: productCampaigns,
      stockLeft: demoProductStockLeft(p),
      agg,
    });
  }

  return { campaigns, productTree };
}

const PROFILE_1_LIST = buildCampaignsAndProductTree(PRODUCTS_SOURCE);
const PROFILE_2_LIST = buildCampaignsAndProductTree(PRODUCTS_SOURCE_PROFILE_2);

export function getProfileListData(profileId: ProfileId): {
  campaigns: DisplayCampaign[];
  productTree: ProductRow[];
} {
  if (isNewSellerProfile(profileId)) {
    return {
      campaigns: [...NEW_SELLER_EMPTY_LIST.campaigns] as DisplayCampaign[],
      productTree: [...NEW_SELLER_EMPTY_LIST.productTree] as ProductRow[],
    };
  }
  return profileId === '2' ? PROFILE_2_LIST : PROFILE_1_LIST;
}

const { campaigns: MOCK_CAMPAIGNS, productTree: MOCK_PRODUCTS_TREE } = PROFILE_1_LIST;

// Предсобранная однотоварная CPC-кампания (вставка в таблицу «Кампании»)
const PREBUILT_SINGLE_PRODUCT_CPC_CAMPAIGN_ID = 'prebuilt-single-product-cpc';
const PREBUILT_SINGLE_PRODUCT_CPC_CAMPAIGN_BASE =
  MOCK_CAMPAIGNS.find((c) => c.type === 'CPC') ?? MOCK_CAMPAIGNS[0];

const PREBUILT_SINGLE_PRODUCT_CPC_CAMPAIGN: DisplayCampaign = {
  ...(PREBUILT_SINGLE_PRODUCT_CPC_CAMPAIGN_BASE as DisplayCampaign),
  id: PREBUILT_SINGLE_PRODUCT_CPC_CAMPAIGN_ID,
  campaignId: PREBUILT_LIST_SINGLE_PRODUCT_CPC_CAMPAIGN_ID,
  type: 'CPC',
  status: 'active',
  statusText: 'активна',
  name: 'Кампания тест летняя распродажа',
  remainingBudget: 1500,
  budget: 1500,
  autoRefill: false,
  autoRefillStatus: 'off',
  spend: 340,
  impressions: 12400,
  ctr: 2.7,
  orders: 12,
  spendShare: 4.2,
  tags: [],
  campaignTags: [],
  dailyLimit: null,
  dailyLimitExhausted: false,
  maxCpcBidRub: 30,
  productId: 'pr1',
  productIds: ['pr1'],
  category: 'Платья',
  image: productTableThumbUrl('pr1', 'Платья'),
};

/** 3-я строка в списке кампаний (после предсобранной и кампании pr1): мультитовар без длинной сетки */
const CAMPAIGN_STOCK_FIVE_PRODUCTS_DEMO_ID = '1400002';
const CAMPAIGN_STOCK_FIVE_PRODUCTS_IDS = ['pr2', 'pr3', 'pr4', 'pr5', 'pr6'] as const;

function buildAllCampaignsForProfile(profileId: ProfileId): DisplayCampaign[] {
  if (isNewSellerProfile(profileId)) return [];
  const { campaigns } = getProfileListData(profileId);
  const list =
    profileId === '2'
      ? [...campaigns]
      : [PREBUILT_SINGLE_PRODUCT_CPC_CAMPAIGN, ...campaigns];
  return list.map((c, index) => {
    // Бонусный сценарий «перезапустить кампанию» — на первой обычной строке после предсобранной
    const isBonusRepeatDemoRow = profileId !== '2' ? index === 1 : index === 1;
    let base =
      isBonusRepeatDemoRow && c.id !== PREBUILT_SINGLE_PRODUCT_CPC_CAMPAIGN_ID
        ? { ...c, isBonusCampaign: true }
        : { ...c, isBonusCampaign: false };
    if (c.id === CAMPAIGN_STOCK_FIVE_PRODUCTS_DEMO_ID) {
      const primaryId = CAMPAIGN_STOCK_FIVE_PRODUCTS_IDS[0];
      base = {
        ...base,
        productId: primaryId,
        productIds: [...CAMPAIGN_STOCK_FIVE_PRODUCTS_IDS],
        category: base.category ?? 'Платья',
        image: productTableThumbUrl(primaryId, base.category ?? 'Платья'),
      };
    }
    if (profileId !== '2') return base;
    return { ...base, status: 'paused', statusText: 'приостановлена' };
  });
}

function findProductSourceForProfile(productId: string | undefined, profileId: ProfileId): ProductSource | undefined {
  if (!productId) return undefined;
  const sources = profileId === '2' ? PRODUCTS_SOURCE_PROFILE_2 : PRODUCTS_SOURCE;
  return sources.find((p) => p.id === productId);
}

function buildRepeatPresetForDisplayCampaign(c: DisplayCampaign, profileId: ProfileId): RepeatLaunchPreset {
  const dateLabel = '26.12.2024';
  const source = findProductSourceForProfile(c.productId, profileId);
  if (source) {
    return buildRepeatLaunchPreset(source, dateLabel, c.image);
  }
  return {
    product: {
      nmId: c.campaignId,
      productName: c.name,
      imageUrl: c.image,
      category: c.category ?? 'Футболки',
      cpcCompatible: c.type === 'CPC',
    },
    campaignName: `Кампания от ${dateLabel}`,
  };
}

/** Цвета точек для ярлыков (назначаются автоматически по индексу) */
const TAG_DOT_COLORS = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500', 'bg-cyan-500'];
/** Пастельные фоны для чипов ярлыков в дропдауне */
const TAG_PASTEL_BG = ['bg-green-100', 'bg-amber-100', 'bg-blue-100', 'bg-purple-100', 'bg-rose-100', 'bg-cyan-100'];

/** Глобальная карта цветов для всех ярлыков, которые уже есть у товаров */
const INITIAL_TAG_COLORS: Record<string, number> = (() => {
  const colors: Record<string, number> = {};
  let i = 0;
  for (const p of MOCK_PRODUCTS_TREE) {
    for (const t of p.tags) {
      if (!t) continue;
      if (colors[t] === undefined) {
        colors[t] = i % TAG_PASTEL_BG.length;
        i++;
      }
    }
  }
  return colors;
})();

/** Ярлыки товара: один ярлык + «+N» при наличии ещё. Серый лейбл, цветная точка. Клик по ярлыкам открывает дропдаун. */
const ProductTagsDisplay: React.FC<{
  tags: string[];
  tagColorByTagName?: Record<string, number>;
  onClick?: () => void;
}> = ({ tags, tagColorByTagName, onClick }) => {
  const visible = tags?.length ? tags.slice(0, 1) : [];
  const restCount = tags?.length ? tags.length - 1 : 0;
  const content = (
    <>
      {visible.map((label, i) => {
        const colorIndex = (tagColorByTagName?.[label] ?? i) % TAG_DOT_COLORS.length;
        return (
          <span key={i} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs">
            {label.trim() === '' ? (
              <Plus className="w-3.5 h-3.5 text-gray-500 shrink-0" aria-hidden />
            ) : (
              <>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${TAG_DOT_COLORS[colorIndex]}`} aria-hidden />
                <span>{label}</span>
              </>
            )}
          </span>
        );
      })}
      {restCount > 0 && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs">
          <Plus className="w-3.5 h-3.5 shrink-0" aria-hidden />
          <span>{restCount}</span>
        </span>
      )}
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={(e) => { e.stopPropagation(); onClick(); }} className="flex items-center gap-1.5 text-left hover:opacity-80 transition-opacity">
        {content}
      </button>
    );
  }
  return <div className="flex items-center gap-1.5">{content}</div>;
};

/** Дропдаун добавления и редактирования ярлыков товара */
const TagDropdown: React.FC<{
  anchorRef: React.RefObject<HTMLElement | null>;
  tags: string[];
  tagColorByTagName: Record<string, number>;
  tagUsageCountByName: Record<string, number>;
  deletedTags: string[];
  onDeleteTagGlobally?: (tag: string) => void;
  onRestoreTagGlobally?: (tag: string) => void;
  onTagError?: (reason: 'max-per-product') => void;
  onClose: () => void;
  onSave: (tags: string[], tagColors: Record<string, number>) => void;
}> = ({ anchorRef, tags, tagColorByTagName, tagUsageCountByName, deletedTags, onDeleteTagGlobally, onRestoreTagGlobally, onTagError, onClose, onSave }) => {
  // localTags — ярлыки, назначенные текущему товару
  const [localTags, setLocalTags] = useState<string[]>(() => [...tags]);
  // localColors хранит цвета для всех заведённых ярлыков (по имени ярлыка)
  const [localColors, setLocalColors] = useState<Record<string, number>>(() => ({ ...tagColorByTagName }));
  const [inputValue, setInputValue] = useState('');
  const [settingsTag, setSettingsTag] = useState<string | null>(null);
  const [settingsOriginalTag, setSettingsOriginalTag] = useState<string | null>(null);
  const [settingsName, setSettingsName] = useState('');
  const [settingsColorIndex, setSettingsColorIndex] = useState(0);
  const [kebabPosition, setKebabPosition] = useState({ top: 0, left: 0 });
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const [hoveredTagForTooltip, setHoveredTagForTooltip] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  const getColorIndex = (tag: string) => localColors[tag] ?? 0;

  const handleAddTag = () => {
    const name = inputValue.trim().slice(0, MAX_TAG_LENGTH);
    if (!name) return;
    if (localTags.length >= MAX_TAGS_PER_PRODUCT) {
      onTagError?.('max-per-product');
      return;
    }

    // Если такой ярлык уже существует глобально — просто привязываем его к товару
    if (localColors[name] !== undefined) {
      // Если ярлык ранее был удалён глобально — "восстанавливаем" его при повторном добавлении
      onRestoreTagGlobally?.(name);
      if (!localTags.includes(name)) {
        setLocalTags(prev => [...prev, name]);
      }
      setInputValue('');
      return;
    }

    // Новый ярлык: создаём цвет, добавляем в список ярлыков товара и в глобальную карту цветов
    onRestoreTagGlobally?.(name);
    const colorIndex = Object.keys(localColors).length % TAG_PASTEL_BG.length;
    setLocalTags(prev => [...prev, name]);
    setLocalColors(prev => ({ ...prev, [name]: colorIndex }));
    setInputValue('');
  };

  // Убрать ярлык только у текущего товара (оставить в общем списке)
  const handleUnassignTag = (tag: string) => {
    setLocalTags(prev => prev.filter((t) => t !== tag));
  };

  const handleDeleteTag = (tagName: string) => {
    // Полное удаление ярлыка: из общего списка и из этого товара (после подтверждения)
    setTagToDelete(tagName);
    setSettingsTag(null);
  };

  const confirmDeleteTag = (tag: string) => {
    // Сообщаем наверх, что ярлык нужно удалить глобально (из всех товаров и фильтров)
    onDeleteTagGlobally?.(tag);

    setLocalTags(prev => prev.filter((t) => t !== tag));
    setLocalColors(prev => {
      const next = { ...prev };
      delete next[tag];
      return next;
    });
    setSettingsTag(null);
    setTagToDelete(null);
  };

  const applySettings = () => {
    if (!settingsTag) return;
    const oldName = settingsOriginalTag ?? settingsTag;
    const nextName = settingsName.trim().slice(0, MAX_TAG_LENGTH);
    if (!nextName) return;

    onRestoreTagGlobally?.(nextName);

    setLocalTags(prev => prev.map(t => (t === oldName ? nextName : t)));
      setLocalColors(prev => {
        const next = { ...prev };
      if (oldName !== nextName) delete next[oldName];
      next[nextName] = settingsColorIndex;
        return next;
      });
    setSettingsTag(nextName);
    setSettingsOriginalTag(nextName);
  };

  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isPositioned, setIsPositioned] = useState(false);

  const handleClickOutside = (e: MouseEvent) => {
    // Пока открыто модальное окно подтверждения удаления ярлыка – не закрываем дропдаун по клику снаружи
    if (tagToDelete) return;

    const target = e.target as Node;
    const panel = panelRef.current;
    const settings = settingsRef.current;

    // Клик по любому месту страницы, кроме самого дропдауна и его подменю, закрывает дропдаун
    const clickedInsidePanel = panel && panel.contains(target);
    const clickedInsideSettings = settings && settings.contains(target);

    if (!clickedInsidePanel && !clickedInsideSettings) {
      setSettingsTag(null);
      onSave(localTags, localColors);
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [localTags, localColors, tagToDelete]);

  // Мгновенно применяем изменения ярлыков к товару (чтобы колонка "Ярлыки" обновлялась сразу)
  useEffect(() => {
    onSave(localTags, localColors);
  }, [localTags, localColors, onSave]);

  useEffect(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPosition({ top: rect.bottom + 4, left: rect.left });
    setIsPositioned(true);
  }, []);

  const dropdownStyle = { position: 'fixed' as const, top: position.top, left: position.left, zIndex: 50, visibility: isPositioned ? 'visible' as const : 'hidden' as const };

  const allTagsMeta = useMemo(() => {
    // Убираем дубли в списке "Все": нормализуем (trim + обрезка до 15) и дедуплим без учёта регистра
    const map = new Map<string, { tag: string; colorIndex: number }>();
    for (const [rawTag, colorIndex] of Object.entries(localColors)) {
      if (!rawTag) continue;
      if (deletedTags.includes(rawTag)) continue;
      const tag = normalizeTagName(rawTag);
      if (!tag) continue;
      const key = tag.toLowerCase();
      if (!map.has(key)) map.set(key, { tag, colorIndex });
    }
    const list = [...map.values()].sort((a, b) => a.tag.localeCompare(b.tag));
    const colorByTag: Record<string, number> = {};
    list.forEach(i => { colorByTag[i.tag] = i.colorIndex; });
    return { list: list.map(i => i.tag), colorByTag };
  }, [localColors, deletedTags]);

  const allTags = allTagsMeta.list;
  const query = normalizeTagName(inputValue);
  const foundTags = query ? allTags.filter(t => t.toLowerCase().includes(query.toLowerCase())) : [];
  const canCreate = !!query && allTagsMeta.colorByTag[query] === undefined && localColors[query] === undefined;
  const isAtLimit = localTags.length >= MAX_TAGS_PER_PRODUCT;

  return (
    <div ref={panelRef} className="bg-white rounded-xl border border-gray-200 shadow-lg py-4 px-4 w-[320px]" style={dropdownStyle}>
      {/* Поле "создать или найти" */}
      <div className="mb-3">
        <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white">
          <input
            type="text"
            value={inputValue}
            maxLength={MAX_TAG_LENGTH}
            onChange={(e) => setInputValue(e.target.value.slice(0, MAX_TAG_LENGTH))}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              if (query && localColors[query] !== undefined) {
                onRestoreTagGlobally?.(query);
                if (!localTags.includes(query) && !isAtLimit) setLocalTags(prev => [...prev, query]);
                setInputValue('');
                return;
              }
              handleAddTag();
            }}
            placeholder="Создать или найти ярлык"
            className="w-full text-sm border-none focus:outline-none focus:ring-0 placeholder:text-gray-400"
          />
      </div>

        {/* Выбранные ярлыки + счётчик */}
        <div className="mt-2 flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5 min-w-0">
            {localTags.map((tag, idx) => (
              <span key={tag + idx} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-100 text-xs text-gray-700">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${TAG_DOT_COLORS[((settingsOriginalTag && tag === settingsOriginalTag) ? settingsColorIndex : getColorIndex(tag)) % TAG_DOT_COLORS.length]}`}
                />
                <span className="truncate max-w-[140px]">
                  {(settingsOriginalTag && tag === settingsOriginalTag && settingsName.trim()) ? settingsName.trim() : tag}
                </span>
                <button type="button" onClick={() => handleUnassignTag(tag)} className="ml-0.5 text-gray-500 hover:text-gray-700" aria-label="Убрать ярлык из товара">
                  <X className="w-3 h-3" />
              </button>
              </span>
            ))}
          </div>
          </div>
        </div>

      {/* Секции списка */}
      <div className="space-y-3">
        {!query ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Все</span>
              <span className="text-xs text-gray-400">{localTags.length} из {MAX_TAGS_PER_PRODUCT}</span>
            </div>
            {allTags.length === 0 ? (
              <div className="text-sm text-gray-600 font-medium py-2">Ярлыков нет</div>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto">
            {allTags.map((tag, idx) => (
                  <div key={tag + idx} className="group flex items-center justify-between gap-1.5 px-1.5 py-0.5 rounded-lg hover:bg-gray-100">
                <button
                  type="button"
                  onClick={() => {
                        if (localTags.includes(tag)) {
                          setLocalTags(prev => prev.filter(t => t !== tag));
                          return;
                        }
                        if (isAtLimit) return;
                        onRestoreTagGlobally?.(tag);
                    setLocalTags(prev => [...prev, tag]);
                  }}
                  onMouseEnter={() => {
                        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                        hoverTimeoutRef.current = setTimeout(() => setHoveredTagForTooltip(tag), 2000);
                  }}
                  onMouseLeave={() => {
                    if (hoverTimeoutRef.current) {
                      clearTimeout(hoverTimeoutRef.current);
                      hoverTimeoutRef.current = null;
                    }
                    setHoveredTagForTooltip(null);
                  }}
                      className="flex items-center min-w-0 flex-1 text-left bg-transparent"
                >
                      <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-gray-100 group-hover:bg-gray-100">
                      <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${TAG_DOT_COLORS[((settingsOriginalTag && tag === settingsOriginalTag) ? settingsColorIndex : (allTagsMeta.colorByTag[tag] ?? getColorIndex(tag))) % TAG_DOT_COLORS.length]}`}
                        />
                        <span className="truncate text-xs text-gray-700">
                          {(settingsOriginalTag && tag === settingsOriginalTag && settingsName.trim()) ? settingsName.trim() : tag}
                        </span>
                      </span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        setKebabPosition({ top: rect.bottom + 6, left: Math.max(8, rect.right + 8) });
                        setSettingsTag(tag);
                        setSettingsOriginalTag(tag);
                        setSettingsName(tag);
                        setSettingsColorIndex(allTagsMeta.colorByTag[tag] ?? getColorIndex(tag));
                      }}
                      className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 shrink-0"
                      aria-label="Настройки ярлыка"
                    >
                      <MoreVertical className="w-5 h-5 rotate-90" />
                </button>
              </div>
            ))}
          </div>
            )}
          </>
        ) : (
          <>
            <div className="text-xs font-semibold text-gray-900">Найдено</div>
            <div className="space-y-1 max-h-44 overflow-y-auto">
              {foundTags.length === 0 ? (
                <div className="text-sm text-gray-500 py-1">Нет совпадений</div>
              ) : (
                foundTags.map((tag, idx) => (
                  <div key={tag + idx} className="group flex items-center justify-between gap-1.5 px-1.5 py-0.5 rounded-lg hover:bg-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        if (localTags.includes(tag)) {
                          setLocalTags(prev => prev.filter(t => t !== tag));
                          return;
                        }
                        if (isAtLimit) return;
                        onRestoreTagGlobally?.(tag);
                        setLocalTags(prev => [...prev, tag]);
                      }}
                      className="flex items-center min-w-0 flex-1 text-left bg-transparent"
                    >
                      <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-gray-100 group-hover:bg-gray-100">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${TAG_DOT_COLORS[((settingsOriginalTag && tag === settingsOriginalTag) ? settingsColorIndex : (allTagsMeta.colorByTag[tag] ?? getColorIndex(tag))) % TAG_DOT_COLORS.length]}`}
                        />
                        <span className="truncate text-xs text-gray-700">
                          {(settingsOriginalTag && tag === settingsOriginalTag && settingsName.trim()) ? settingsName.trim() : tag}
                        </span>
                      </span>
                    </button>
              <button
                type="button"
                      onClick={(e) => {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        setKebabPosition({ top: rect.bottom + 6, left: Math.max(8, rect.right + 8) });
                        setSettingsTag(tag);
                        setSettingsOriginalTag(tag);
                        setSettingsName(tag);
                        setSettingsColorIndex(allTagsMeta.colorByTag[tag] ?? getColorIndex(tag));
                      }}
                      className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 shrink-0"
                      aria-label="Настройки ярлыка"
                    >
                      <MoreVertical className="w-5 h-5 rotate-90" />
              </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-gray-100">
              <div className="text-xs font-semibold text-gray-900 mb-1">Создать</div>
              {canCreate ? (
                <>
                  {isAtLimit ? (
                    <div className="text-xs text-gray-500">
                      Лимит на создание новых ярлыков исчерпан, удалите существующий.
                    </div>
                  ) : (
              <button
                type="button"
                      onClick={() => handleAddTag()}
                      className="w-full flex items-center gap-2 px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-left"
              >
                      <span className="text-xs text-gray-700 truncate flex-1">{query}</span>
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <Plus className="w-4 h-4" /> 
                      </span>
              </button>
                  )}
                </>
              ) : (
                <div className="text-xs text-gray-500">—</div>
              )}
            </div>
          </>
        )}
      </div>

          {/* Тултип по наведению на ярлык: через 2 секунды, чёрный фон, количество товаров */}
          {hoveredTagForTooltip && typeof document !== 'undefined' && ReactDOM.createPortal(
            <div className="fixed z-[110] bottom-8 right-8 max-w-xs px-3 py-2 rounded-md bg-black text-white text-xs shadow-lg">
              Ярлык «{hoveredTagForTooltip}» используется в{' '}
              <span className="font-semibold">
                {tagUsageCountByName[hoveredTagForTooltip] ?? 0}
              </span>{' '}
              товарах.
            </div>,
            document.body
          )}

          {/* Поповер настроек ярлыка */}
          {settingsTag && typeof document !== 'undefined' && ReactDOM.createPortal(
            <div
              ref={settingsRef}
              className="fixed bg-white border border-gray-200 rounded-xl shadow-xl z-[110] w-[320px] p-4"
              style={{ top: kebabPosition.top, left: kebabPosition.left }}
            >
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  value={settingsName}
                  maxLength={MAX_TAG_LENGTH}
                  onChange={(e) => setSettingsName(e.target.value.slice(0, MAX_TAG_LENGTH))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      applySettings();
                    }
                  }}
                  onBlur={() => applySettings()}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button type="button" onClick={() => setSettingsTag(null)} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Закрыть">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="text-xs font-semibold text-gray-900 mb-2">Цвета</div>
              <div className="flex flex-wrap gap-2 mb-3">
                {TAG_PASTEL_BG.map((bg, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setSettingsColorIndex(i);
                      // сразу применяем цвет к текущему имени
                      if (!settingsTag) return;
                      setLocalColors(prev => ({ ...prev, [settingsTag]: i }));
                    }}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${bg} ${settingsColorIndex === i ? 'border-gray-800 ring-2 ring-offset-1 ring-purple-400' : 'border-gray-200'}`}
                    title={`Цвет ${i + 1}`}
                  >
                    {settingsColorIndex === i && <Check className="w-3.5 h-3.5 text-gray-800" />}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => handleDeleteTag(settingsTag)}
                className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" /> Удалить
              </button>
            </div>,
            document.body
          )}

          {/* Модальное окно подтверждения полного удаления ярлыка из системы */}
          {tagToDelete && typeof document !== 'undefined' && ReactDOM.createPortal(
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-2">Удалить ярлык?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Ярлык «{tagToDelete}» будет удалён во всех товарах, где он используется.
                  {' '}
                  Сейчас он применяется в{' '}
                  <span className="font-semibold">
                    {tagUsageCountByName[tagToDelete] ?? 0}
                  </span>{' '}
                  кампаниях.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setTagToDelete(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmDeleteTag(tagToDelete)}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>,
            document.body
      )}
    </div>
  );
};

type CampaignListAutomationAction = 'searchPosition' | 'flexibleLimit' | 'autoRefill';

const CAMPAIGN_LIST_AUTOMATION_OPTIONS: { id: CampaignListAutomationAction; label: string }[] = [
  { id: 'searchPosition', label: 'Держать позицию в поиске' },
  { id: 'flexibleLimit', label: 'Гибкий лимит' },
  { id: 'autoRefill', label: 'Автопополнение бюджета' },
];

function getCampaignListAutomationOptions(campaignType: 'CPC' | 'CPM') {
  return CAMPAIGN_LIST_AUTOMATION_OPTIONS.filter(
    (option) => campaignType === 'CPC' || option.id !== 'flexibleLimit',
  );
}

function CampaignListAutomationCell({
  campaignType,
  onSelect,
}: {
  campaignType: 'CPC' | 'CPM';
  onSelect: (action: CampaignListAutomationAction) => void;
}) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number } | null>(null);

  const clearHideTimeout = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const scheduleHide = () => {
    clearHideTimeout();
    hideTimeoutRef.current = setTimeout(() => setIsOpen(false), 120);
  };

  const updateMenuPosition = useCallback(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setMenuPosition({ left: rect.left, top: rect.top - 6 });
  }, []);

  const openMenu = () => {
    clearHideTimeout();
    updateMenuPosition();
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;
    updateMenuPosition();
    const onLayout = () => updateMenuPosition();
    window.addEventListener('resize', onLayout);
    window.addEventListener('scroll', onLayout, true);
    return () => {
      window.removeEventListener('resize', onLayout);
      window.removeEventListener('scroll', onLayout, true);
    };
  }, [isOpen, updateMenuPosition]);

  useEffect(() => () => clearHideTimeout(), []);

  const menuOptions = getCampaignListAutomationOptions(campaignType);

  const menu =
    isOpen && menuPosition
      ? ReactDOM.createPortal(
          <div
            className="fixed z-[400] w-[17.5rem]"
            style={{ left: menuPosition.left, top: menuPosition.top }}
            onMouseEnter={openMenu}
            onMouseLeave={scheduleHide}
          >
            <div className="-translate-y-full pb-1.5">
              <div className="rounded-lg border border-gray-200 bg-white py-1 shadow-lg animate-in fade-in zoom-in-95 duration-100">
                {menuOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      onSelect(option.id);
                      setIsOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div
        ref={anchorRef}
        className="flex max-w-[10.5rem] items-center"
        onMouseEnter={openMenu}
        onMouseLeave={scheduleHide}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="inline-flex max-w-full items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-[#9a41fe] transition-colors hover:border-[#9a41fe]/40 hover:bg-[#F6F2FF]"
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="whitespace-nowrap">Добавить</span>
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
      </div>
      {menu}
    </>
  );
}

const DailyLimitTooltip: React.FC<{
  dailyLimit: number;
  scheduledDailyLimit?: number | null;
  /** true = лимит израсходован, показы остановлены до завтра */
  dailyLimitExhausted?: boolean;
  onClick?: () => void;
}> = ({ dailyLimit, dailyLimitExhausted, onClick }) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const hideTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const exhausted = !!dailyLimitExhausted;

  const clearHideTimeout = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };
  const scheduleHide = () => {
    clearHideTimeout();
    hideTimeoutRef.current = setTimeout(() => setIsTooltipVisible(false), 100);
  };
  useEffect(() => () => { clearHideTimeout(); }, []);

  const trigger = (
    <div
      className="flex items-center gap-1.5 text-xs mt-1 cursor-pointer group/limit"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick?.();
      }}
      onMouseEnter={() => { clearHideTimeout(); setIsTooltipVisible(true); }}
      onMouseLeave={scheduleHide}
    >
      {exhausted ? (
        <Clock className="w-4 h-4 text-red-500 shrink-0" aria-hidden />
      ) : (
        <CheckCircle className="w-4 h-4 text-green-600 shrink-0" aria-hidden />
      )}
      <span className="text-blue-600 group-hover/limit:text-purple-600 transition-colors">Дневной лимит</span>
    </div>
  );

  const tooltipText = exhausted
    ? `Лимит в ${formatForDisplay(dailyLimit)} ₽ на сегодня израсходован. Показы остановлены до завтра. Если хотите возобновить показы сейчас увеличьте лимит`
    : `${formatForDisplay(dailyLimit)} ₽`;

  return (
    <div className="relative inline-block">
      {trigger}
      {isTooltipVisible && (
        <>
          <div className="absolute left-0 top-full w-64 h-2" onMouseEnter={clearHideTimeout} onMouseLeave={scheduleHide} />
          <div
            className="absolute left-0 top-full mt-2 w-max max-w-[300px] p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50 text-left"
            onMouseEnter={clearHideTimeout}
            onMouseLeave={() => { clearHideTimeout(); setIsTooltipVisible(false); }}
          >
            {tooltipText}
          </div>
        </>
      )}
    </div>
  );
};

/** Общий компонент ячейки «Дневной лимит» для вкладок Кампании и Товары: сумма + прогресс-бар или «Н/Д». При onClick — кликабельно и показывается тултип. */
const DailyLimitCell: React.FC<{
  dailyLimit: number | null;
  dailyLimitExhausted?: boolean;
  /** true только для кампаний CPC — только для них можно настраивать лимит */
  isCpc?: boolean;
  maxCpcBidRub?: number;
  onClick?: () => void;
}> = ({ dailyLimit, dailyLimitExhausted, isCpc = true, maxCpcBidRub = 0, onClick }) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [isBidHintTooltipVisible, setIsBidHintTooltipVisible] = useState(false);
  const bidHintOpenRef = React.useRef(false);
  const hideTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const exhausted = !!dailyLimitExhausted;

  const clearHideTimeout = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };
  const scheduleHide = () => {
    clearHideTimeout();
    hideTimeoutRef.current = setTimeout(() => setIsTooltipVisible(false), 100);
  };
  useEffect(() => () => { clearHideTimeout(); }, []);

  const tooltipText = isCpc && dailyLimit != null && exhausted
    ? `Лимит в ${formatForDisplay(dailyLimit)} ₽ на сегодня израсходован. Показы остановлены до завтра. Если хотите возобновить показы сейчас увеличьте лимит`
    : '';

  const bidLimitMismatch =
    isCpc &&
    dailyLimit != null &&
    maxCpcBidRub > 0 &&
    isDailyLimitBelowRecommendedForMaxBid(dailyLimit, maxCpcBidRub);
  const recommendedDailyLimitRub = bidLimitMismatch
    ? minDailyLimitForMaxBid(maxCpcBidRub)
    : 0;

  // Для кампаний CPM всегда показываем прочерк
  if (!isCpc) {
    return <span className="text-gray-400">—</span>;
  }

  const content =
    dailyLimit != null ? (
      <div className="inline-flex max-w-full items-start gap-1">
        <div className="w-max max-w-full space-y-0.5">
          <span className="whitespace-nowrap text-sm font-medium tabular-nums">
            {formatForDisplay(dailyLimit)} ₽
          </span>
          <div className="h-1.5 w-[4.5rem] max-w-full rounded-full bg-gray-200 overflow-hidden">
            <div
              className={`h-full rounded-full ${exhausted ? 'bg-red-500' : 'bg-purple-600'}`}
              style={{ width: exhausted ? '100%' : '60%' }}
            />
          </div>
        </div>
        {bidLimitMismatch ? (
          <DailyLimitBidMismatchHint
            recommendedDailyLimitRub={recommendedDailyLimitRub}
            className="mt-0.5"
            onVisibilityChange={(open) => {
              bidHintOpenRef.current = open;
              setIsBidHintTooltipVisible(open);
              if (open) {
                clearHideTimeout();
                setIsTooltipVisible(false);
              }
            }}
          />
        ) : null}
      </div>
    ) : (
      <span className="text-sm font-medium text-blue-600">Настроить</span>
    );

  if (onClick != null) {
    return (
      <div
        className="relative inline-block"
        onMouseEnter={() => {
          clearHideTimeout();
          if (!bidHintOpenRef.current) setIsTooltipVisible(true);
        }}
        onMouseLeave={scheduleHide}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          onKeyDown={(e) => { e.key === 'Enter' && (e.preventDefault(), onClick()); }}
          className="cursor-pointer"
        >
          {content}
        </div>
        {isTooltipVisible && tooltipText && !isBidHintTooltipVisible && (
          <>
            <div className="absolute left-0 top-full w-64 h-2" onMouseEnter={clearHideTimeout} onMouseLeave={scheduleHide} />
            <div
              className="absolute left-0 top-full mt-2 w-max max-w-[300px] p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50 text-left"
              onMouseEnter={clearHideTimeout}
              onMouseLeave={() => { clearHideTimeout(); setIsTooltipVisible(false); }}
            >
              {tooltipText}
            </div>
          </>
        )}
      </div>
    );
  }

  return <>{content}</>;
};

const DailyLimitModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  currentBudget: number;
  dailyLimit?: number | null;
  /** Макс. CPC-ставка в кампании (для связки лимит ↔ ставка) */
  maxCpcBidRub?: number;
  onDailyLimitChange?: (limit: number | null, isScheduled?: boolean) => void;
  /** Когда пользователь пытается задать лимит выше бюджета — вызвать вместо показа ошибки в модалке (показать нотификашку на странице) */
  onLimitAboveBudget?: (requestedLimit: number, shortfall: number) => void;
}> = ({ isOpen, onClose, currentBudget, dailyLimit, maxCpcBidRub = 0, onDailyLimitChange, onLimitAboveBudget }) => {
  const [isDailyLimitEnabled, setIsDailyLimitEnabled] = useState(false);
  const [dailyLimitValue, setDailyLimitValue] = useState('');
  const [savedDailyLimit, setSavedDailyLimit] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [budgetError, setBudgetError] = useState('');
  const [isCarryoverEnabled, setIsCarryoverEnabled] = useState(false);

  const requiredMinDailyLimit = DAILY_LIMIT_ABSOLUTE_MIN;
  const recommendedDailyLimitForBid = useMemo(
    () => (maxCpcBidRub > 0 ? minDailyLimitForMaxBid(maxCpcBidRub) : DAILY_LIMIT_ABSOLUTE_MIN),
    [maxCpcBidRub],
  );

  const parsedDailyLimitInput = useMemo(
    () => parseDisplayValue(dailyLimitValue),
    [dailyLimitValue],
  );

  const showBidLimitMismatchHint =
    isDailyLimitEnabled &&
    !Number.isNaN(parsedDailyLimitInput) &&
    parsedDailyLimitInput > 0 &&
    maxCpcBidRub > 0 &&
    isDailyLimitBelowRecommendedForMaxBid(parsedDailyLimitInput, maxCpcBidRub);

  const enableWithMinLimit = useCallback(() => {
    const minLimit = DAILY_LIMIT_ABSOLUTE_MIN;
    setIsDailyLimitEnabled(true);
    setIsCarryoverEnabled(true);
    setDailyLimitValue(String(minLimit));
    setSavedDailyLimit('');
    setBudgetError('');
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (dailyLimit) {
        setIsDailyLimitEnabled(true);
        setIsCarryoverEnabled(true);
        setDailyLimitValue(String(dailyLimit));
        setSavedDailyLimit(String(dailyLimit));
      } else {
        setIsDailyLimitEnabled(false);
        setIsCarryoverEnabled(false);
        setDailyLimitValue('');
        setSavedDailyLimit('');
      }
      setShowToast(false);
      setToastMessage('');
      setBudgetError('');
    }
  }, [isOpen, dailyLimit]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-xl p-6 overflow-visible" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <ToggleSwitch 
              checked={isDailyLimitEnabled} 
              onChange={(checked) => {
                if (checked) {
                  enableWithMinLimit();
                } else {
                  setIsDailyLimitEnabled(false);
                  setIsCarryoverEnabled(false);
                  setDailyLimitValue('');
                  setSavedDailyLimit('');
                  setBudgetError('');
                  if (onDailyLimitChange) onDailyLimitChange(null);
                }
              }} 
            />
            <h3 className="font-bold text-lg text-gray-900">Дневной лимит</h3>
            <DailyLimitInfoTooltip />
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="mb-6">
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <div className="flex max-w-[280px] min-w-[220px] items-start gap-1.5">
                <div className="relative w-full min-w-0 flex-1">
                <input
                  type="text"
                  value={dailyLimitValue ? formatForDisplay(dailyLimitValue) : ''}
                  disabled={!isDailyLimitEnabled}
                  onChange={(e) => {
                    const parsed = parseDisplayValue(e.target.value);
                    if (!isNaN(parsed)) {
                      setDailyLimitValue(String(parsed));
                      setBudgetError('');
                    } else if (e.target.value === '') {
                      setDailyLimitValue('');
                      setBudgetError('');
                    }
                  }}
                  className={`w-full text-sm border shadow-sm outline-none transition-colors px-2 py-1.5 rounded-lg pr-6 ${
                    !isDailyLimitEnabled 
                      ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200' 
                      : 'bg-white border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                  }`}
                  placeholder={`Задайте от ${formatForDisplay(DAILY_LIMIT_ABSOLUTE_MIN)}`}
                />
                <span className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${!isDailyLimitEnabled ? 'text-gray-300' : 'text-gray-400'}`}>₽</span>
              </div>
              {showBidLimitMismatchHint ? (
                <DailyLimitBidMismatchHint
                  recommendedDailyLimitRub={recommendedDailyLimitForBid}
                  className="mt-1.5"
                />
              ) : null}
              </div>
            </div>
            {budgetError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{budgetError}</p>
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <label className="flex items-start gap-2 text-xs cursor-pointer">
                <Checkbox
                  className="mt-0.5 h-3 w-3 text-purple-600"
                  disabled={!isDailyLimitEnabled}
                  checked={isCarryoverEnabled}
                  onChange={(e) => {
                    if (!isDailyLimitEnabled) return;
                    setIsCarryoverEnabled(e.target.checked);
                  }}
                />
                <span className={isDailyLimitEnabled ? 'text-gray-700' : 'text-gray-400'}>
                  Переносить неистраченные деньги
                </span>
              </label>
              <div className="relative inline-block group">
                <HelpCircle className="w-4 h-4 text-gray-500 cursor-help" />
                <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50 text-left">
                  <p className="mb-1">Система старается тратить бюджет равномерно.</p>
                  <p>
                    Если сегодня потратится меньше дневного лимита, остаток будет добавлен к лимиту следующего дня.
                    Общая сумма расходов не увеличивается.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={() => {
              if (!isDailyLimitEnabled) {
                if (onDailyLimitChange) onDailyLimitChange(null);
                onClose();
                return;
              }
              const parsed = parseDisplayValue(dailyLimitValue);
              if (dailyLimitValue === '' || isNaN(parsed)) {
                setBudgetError('Введите сумму дневного лимита');
                return;
              }
              if (parsed < requiredMinDailyLimit) {
                setBudgetError(
                  `Минимальный дневной лимит — ${formatForDisplay(DAILY_LIMIT_ABSOLUTE_MIN)} ₽`,
                );
                return;
              }
              if (parsed > currentBudget) {
                if (onLimitAboveBudget) onLimitAboveBudget(parsed, parsed - currentBudget);
                return;
              }
              setSavedDailyLimit(dailyLimitValue);
              setBudgetError('');
              setToastMessage(`Новый дневной лимит установлен.\nРаспределяем ${formatForDisplay(parsed)}₽ в течении суток равномерно`);
              setShowToast(true);
              if (onDailyLimitChange) onDailyLimitChange(parsed);
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            Сохранить
          </button>
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
            Отмена
          </button>
        </div>
      </div>

      {/* Toast */}
      <Toast 
        show={showToast} 
        message={toastMessage} 
        onClose={() => setShowToast(false)} 
        isSuccess={toastMessage.includes('Новый дневной лимит установлен') || toastMessage.includes('Дневной лимит отключен')}
      />
    </div>
  );
};

function listCampaignMaxCpcBidRub(c: Pick<DisplayCampaign, 'type' | 'maxCpcBidRub' | 'campaignId'>): number {
  if (c.type !== 'CPC') return 0;
  if (c.maxCpcBidRub != null && c.maxCpcBidRub > 0) return c.maxCpcBidRub;
  return demoMaxCpcBidForCampaignId(c.campaignId);
}

function listCampaignAutomationReferenceBidRub(
  c: Pick<DisplayCampaign, 'type' | 'maxCpcBidRub' | 'campaignId'>,
): number {
  if (c.type === 'CPC') return listCampaignMaxCpcBidRub(c);
  return 150 + (c.campaignId % 351);
}

type BulkDailyLimitTarget = DisplayCampaign;

function bulkDailyLimitMinForCampaign(_c: BulkDailyLimitTarget): number {
  return DAILY_LIMIT_ABSOLUTE_MIN;
}

const BulkDailyLimitModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  targets: BulkDailyLimitTarget[];
  onApply: (payload: {
    limit: number | null;
    eligibleIds: Set<string>;
  }) => void;
}> = ({ isOpen, onClose, targets, onApply }) => {
  const cpcTargets = useMemo(() => targets.filter((c) => c.type === 'CPC'), [targets]);
  const cpmSkippedCount = targets.length - cpcTargets.length;

  const requiredMinDailyLimit = useMemo(() => {
    if (cpcTargets.length === 0) return DAILY_LIMIT_ABSOLUTE_MIN;
    return Math.max(...cpcTargets.map(bulkDailyLimitMinForCampaign));
  }, [cpcTargets]);

  const [isDailyLimitEnabled, setIsDailyLimitEnabled] = useState(false);
  const [dailyLimitValue, setDailyLimitValue] = useState('');
  const [budgetError, setBudgetError] = useState('');
  const [isCarryoverEnabled, setIsCarryoverEnabled] = useState(false);
  const [partialConfirm, setPartialConfirm] = useState<{
    limit: number;
    eligibleIds: Set<string>;
    skippedBudget: { name: string; shortfall: number }[];
  } | null>(null);

  const enableWithMinLimit = useCallback(() => {
    setIsDailyLimitEnabled(true);
    setIsCarryoverEnabled(true);
    setDailyLimitValue(String(requiredMinDailyLimit));
    setBudgetError('');
    setPartialConfirm(null);
  }, [requiredMinDailyLimit]);

  useEffect(() => {
    if (!isOpen) return;
    setPartialConfirm(null);
    setBudgetError('');
    if (cpcTargets.length === 0) {
      setIsDailyLimitEnabled(false);
      setDailyLimitValue('');
      setIsCarryoverEnabled(false);
      return;
    }
    const withLimit = cpcTargets.filter((c) => c.dailyLimit != null && c.dailyLimit > 0);
    const allHaveLimit = withLimit.length === cpcTargets.length;
    const sameLimit =
      allHaveLimit &&
      withLimit.every((c) => (c.dailyLimit ?? 0) === (withLimit[0].dailyLimit ?? 0));
    if (allHaveLimit && sameLimit && withLimit[0].dailyLimit) {
      setIsDailyLimitEnabled(true);
      setIsCarryoverEnabled(true);
      setDailyLimitValue(String(withLimit[0].dailyLimit));
    } else if (withLimit.length === 0) {
      setIsDailyLimitEnabled(false);
      setDailyLimitValue('');
      setIsCarryoverEnabled(false);
    } else {
      setIsDailyLimitEnabled(true);
      setIsCarryoverEnabled(true);
      setDailyLimitValue(String(requiredMinDailyLimit));
    }
  }, [isOpen, cpcTargets, requiredMinDailyLimit]);

  const parsedLimit = useMemo(() => parseDisplayValue(dailyLimitValue), [dailyLimitValue]);

  const recommendedDailyLimitForSelection = useMemo(() => {
    if (cpcTargets.length === 0) return DAILY_LIMIT_ABSOLUTE_MIN;
    return Math.max(
      ...cpcTargets.map((c) => minDailyLimitForMaxBid(listCampaignMaxCpcBidRub(c))),
    );
  }, [cpcTargets]);

  const showBulkBidLimitMismatchHint =
    isDailyLimitEnabled &&
    !Number.isNaN(parsedLimit) &&
    parsedLimit > 0 &&
    parsedLimit < recommendedDailyLimitForSelection;

  const evaluateApply = useCallback(
    (limit: number | null) => {
      const eligibleIds = new Set<string>();
      const skippedBudget: { name: string; shortfall: number }[] = [];

      if (limit === null) {
        cpcTargets.forEach((c) => eligibleIds.add(c.id));
        return { eligibleIds, skippedBudget };
      }

      cpcTargets.forEach((c) => {
        const minReq = bulkDailyLimitMinForCampaign(c);
        if (limit < minReq) return;
        const budget = c.remainingBudget ?? 0;
        if (limit > budget) {
          skippedBudget.push({ name: c.name, shortfall: limit - budget });
          return;
        }
        eligibleIds.add(c.id);
      });

      return { eligibleIds, skippedBudget };
    },
    [cpcTargets],
  );

  if (!isOpen) return null;

  const titleCount = cpcTargets.length;
  const title =
    titleCount === 1
      ? 'Дневной лимит для 1 CPC-кампании'
      : `Дневной лимит для ${titleCount} ${getPlural(titleCount, 'CPC-кампании', 'CPC-кампаний', 'CPC-кампаний')}`;

  const commitApply = (limit: number | null, eligibleIds: Set<string>) => {
    onApply({ limit, eligibleIds });
    onClose();
  };

  const handlePrimarySave = () => {
    if (cpcTargets.length === 0) {
      setBudgetError('Дневной лимит доступен только для CPC-кампаний');
      return;
    }
    if (!isDailyLimitEnabled) {
      commitApply(null, new Set(cpcTargets.map((c) => c.id)));
      return;
    }
    if (dailyLimitValue === '' || isNaN(parsedLimit)) {
      setBudgetError('Введите сумму дневного лимита');
      return;
    }
    if (parsedLimit < requiredMinDailyLimit) {
      setBudgetError(
        `Минимальный дневной лимит — ${formatForDisplay(DAILY_LIMIT_ABSOLUTE_MIN)} ₽`,
      );
      return;
    }

    const { eligibleIds, skippedBudget } = evaluateApply(parsedLimit);
    if (eligibleIds.size === 0 && skippedBudget.length > 0) {
      setBudgetError('Ни у одной кампании не хватает бюджета для такого лимита');
      return;
    }
    if (skippedBudget.length > 0) {
      setPartialConfirm({ limit: parsedLimit, eligibleIds, skippedBudget });
      return;
    }
    commitApply(parsedLimit, eligibleIds);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="relative bg-white rounded-xl shadow-xl w-full max-w-xl p-6 overflow-visible max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="bulk-daily-limit-title"
      >
        <div className="flex justify-between items-center mb-4 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <ToggleSwitch
              checked={isDailyLimitEnabled}
              onChange={(checked) => {
                if (checked) enableWithMinLimit();
                else {
                  setIsDailyLimitEnabled(false);
                  setIsCarryoverEnabled(false);
                  setDailyLimitValue('');
                  setBudgetError('');
                  setPartialConfirm(null);
                }
              }}
              disabled={cpcTargets.length === 0}
            />
            <h3 id="bulk-daily-limit-title" className="font-bold text-lg text-gray-900 truncate">
              {title}
            </h3>
            <DailyLimitInfoTooltip />
          </div>
          <button type="button" onClick={onClose} aria-label="Закрыть">
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        {cpmSkippedCount > 0 && (
          <p className="text-sm text-gray-600 mb-3 shrink-0">
            {cpmSkippedCount}{' '}
            {getPlural(cpmSkippedCount, 'CPM-кампания', 'CPM-кампании', 'CPM-кампаний')} не{' '}
            {cpmSkippedCount === 1 ? 'будет изменена' : 'будут изменены'} — лимит только для CPC.
          </p>
        )}

        {partialConfirm ? (
          <div className="mb-6 space-y-4 overflow-y-auto custom-scrollbar pr-1">
            <p className="text-sm text-gray-800">
              Лимит {formatForDisplay(partialConfirm.limit)} ₽ можно задать для{' '}
              <b>{partialConfirm.eligibleIds.size}</b>{' '}
              {getPlural(partialConfirm.eligibleIds.size, 'кампании', 'кампаний', 'кампаний')}. У{' '}
              {partialConfirm.skippedBudget.length}{' '}
              {getPlural(partialConfirm.skippedBudget.length, 'кампании', 'кампаний', 'кампаний')}{' '}
              не хватает бюджета:
            </p>
            <ul className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100 text-sm">
              {partialConfirm.skippedBudget.map((row) => (
                <li key={row.name} className="px-3 py-2 text-gray-700">
                  <span className="font-medium text-gray-900">{row.name}</span>
                  <span className="text-gray-500">
                    {' '}
                    — пополните ещё на {formatForDisplay(row.shortfall)} ₽
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mb-6 overflow-y-auto custom-scrollbar pr-1">
            <div className="space-y-6">
              {!isDailyLimitEnabled && cpcTargets.length > 0 && (
                <p className="text-sm text-gray-500">
                  Включите лимит — по умолчанию подставим {formatForDisplay(DAILY_LIMIT_ABSOLUTE_MIN)} ₽
                </p>
              )}
              {cpcTargets.length === 0 && (
                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  В выделении нет CPC-кампаний. Выберите кампании с оплатой за клики.
                </p>
              )}
              <div className="flex flex-col gap-2">
                <div className="flex max-w-[280px] min-w-[220px] items-start gap-1.5">
                  <div className="relative w-full min-w-0 flex-1">
                  <input
                    type="text"
                    value={dailyLimitValue ? formatForDisplay(dailyLimitValue) : ''}
                    disabled={!isDailyLimitEnabled || cpcTargets.length === 0}
                    onChange={(e) => {
                      const parsed = parseDisplayValue(e.target.value);
                      if (!isNaN(parsed)) {
                        setDailyLimitValue(String(parsed));
                        setBudgetError('');
                        setPartialConfirm(null);
                      } else if (e.target.value === '') {
                        setDailyLimitValue('');
                        setBudgetError('');
                      }
                    }}
                    className={`w-full text-sm border shadow-sm outline-none transition-colors px-2 py-1.5 rounded-lg pr-6 ${
                      !isDailyLimitEnabled || cpcTargets.length === 0
                        ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200'
                        : 'bg-white border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                    }`}
                    placeholder={`Задайте от ${formatForDisplay(DAILY_LIMIT_ABSOLUTE_MIN)}`}
                  />
                  <span
                    className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${
                      !isDailyLimitEnabled ? 'text-gray-300' : 'text-gray-400'
                    }`}
                  >
                    ₽
                  </span>
                  </div>
                  {showBulkBidLimitMismatchHint ? (
                    <DailyLimitBidMismatchHint
                      recommendedDailyLimitRub={recommendedDailyLimitForSelection}
                      className="mt-1.5"
                    />
                  ) : null}
                </div>
              </div>
              {budgetError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{budgetError}</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <label className="flex items-start gap-2 text-xs cursor-pointer">
                  <Checkbox
                    className="mt-0.5 h-3 w-3 text-purple-600"
                    disabled={!isDailyLimitEnabled}
                    checked={isCarryoverEnabled}
                    onChange={(e) => {
                      if (!isDailyLimitEnabled) return;
                      setIsCarryoverEnabled(e.target.checked);
                    }}
                  />
                  <span className={isDailyLimitEnabled ? 'text-gray-700' : 'text-gray-400'}>
                    Переносить неистраченные деньги
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 shrink-0">
          {partialConfirm ? (
            <>
              <button
                type="button"
                onClick={() => setPartialConfirm(null)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Назад
              </button>
              <button
                type="button"
                onClick={() =>
                  commitApply(partialConfirm.limit, partialConfirm.eligibleIds)
                }
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg"
              >
                Применить к {partialConfirm.eligibleIds.size}{' '}
                {getPlural(partialConfirm.eligibleIds.size, 'кампании', 'кампаниям', 'кампаниям')}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handlePrimarySave}
                disabled={cpcTargets.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Сохранить
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Отмена
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

type Widgets2Card = {
  id: 'start-promo' | 'good-sales' | 'views-drop' | 'repeat-campaign' | 'bonus-gift';
  title: string;
  /** Текст без товара или запасной подпись */
  subtitle: string;
  /** Серая подпись под названием товара */
  productCaption?: string;
  icon: 'sparkles' | 'alert' | 'wallet' | 'gift' | 'settings' | 'refresh' | 'bars';
  iconTone: 'emerald' | 'rose' | 'amber' | 'violet';
  item?: { nmId: number; name: string; image: string };
  ctaLabel: string;
  ctaAction: 'promote' | 'bid-recommendation' | 'budget' | 'bonus-campaign' | 'setup-recommendation' | 'repeat';
};

const WIDGETS2_PROFILE1_PRIMARY_IDS: Widgets2Card['id'][] = [
  'start-promo',
  'good-sales',
  'views-drop',
];
const WIDGETS2_PROFILE1_RESERVE_IDS: Widgets2Card['id'][] = ['bonus-gift', 'repeat-campaign'];

function resolveWidgets2VisibleCards(
  allCards: Widgets2Card[],
  closedIds: Set<Widgets2Card['id']>,
  profileId: ProfileId,
): Widgets2Card[] {
  if (profileId === '2') {
    return allCards.filter((card) => !closedIds.has(card.id));
  }
  const byId = new Map(allCards.map((card) => [card.id, card]));
  const visible: Widgets2Card[] = [];
  let reserveIndex = 0;
  for (const slotId of WIDGETS2_PROFILE1_PRIMARY_IDS) {
    if (!closedIds.has(slotId)) {
      const card = byId.get(slotId);
      if (card) visible.push(card);
      continue;
    }
    while (reserveIndex < WIDGETS2_PROFILE1_RESERVE_IDS.length) {
      const reserveId = WIDGETS2_PROFILE1_RESERVE_IDS[reserveIndex]!;
      reserveIndex += 1;
      if (closedIds.has(reserveId)) continue;
      const reserveCard = byId.get(reserveId);
      if (reserveCard) {
        visible.push(reserveCard);
        break;
      }
    }
  }
  return visible;
}

function Widgets2CardIcon({
  icon,
  tone,
}: {
  icon: Widgets2Card['icon'];
  tone: Widgets2Card['iconTone'];
}) {
  const shellClass =
    tone === 'emerald'
      ? 'bg-emerald-50 text-emerald-600'
      : tone === 'rose'
        ? 'bg-rose-50 text-rose-600'
        : tone === 'violet'
          ? 'bg-violet-50 text-violet-600'
          : 'bg-amber-50 text-amber-600';

  if (icon === 'sparkles') {
    return (
      <div className={`rounded-md p-1 ${shellClass}`}>
        <Sparkles className="h-4 w-4" aria-hidden />
      </div>
    );
  }
  if (icon === 'alert') {
    return (
      <div className={`rounded-md p-1 ${shellClass}`}>
        <AlertTriangle className="h-4 w-4" aria-hidden />
      </div>
    );
  }
  if (icon === 'wallet') {
    return (
      <div className={`rounded-md p-1 ${shellClass}`}>
        <Wallet className="h-4 w-4" aria-hidden />
      </div>
    );
  }
  if (icon === 'gift') {
    return (
      <div className={`rounded-md p-1 ${shellClass}`}>
        <Gift className="h-4 w-4" aria-hidden />
      </div>
    );
  }
  if (icon === 'settings') {
    return (
      <div className={`rounded-md p-1 ${shellClass}`}>
        <Settings className="h-4 w-4" aria-hidden />
      </div>
    );
  }
  if (icon === 'refresh') {
    return (
      <div className={`rounded-md p-1 ${shellClass}`}>
        <RefreshCw className="h-4 w-4" aria-hidden />
      </div>
    );
  }
  return (
    <div className={`rounded-md p-1 ${shellClass}`}>
      <div className="flex items-end gap-0.5" aria-hidden>
        <div className="h-2 w-1 rounded-sm bg-current opacity-40" />
        <div className="h-3 w-1 rounded-sm bg-current opacity-50" />
        <div className="h-4 w-1 rounded-sm bg-current opacity-70" />
        <div className="h-5 w-1 rounded-sm bg-current" />
      </div>
    </div>
  );
}

function Widgets2Strip({
  profileId,
  items,
  onCloseItem,
  onPromoteItem,
  onOpenBudgetHint,
  onChooseProducts,
  onViewBidRecommendation,
  onOpenSetupRecommendations,
}: {
  profileId: ProfileId;
  items: Widgets2Card[];
  onCloseItem: (id: Widgets2Card['id']) => void;
  onPromoteItem: (item: Widgets2Card['item']) => void;
  onOpenBudgetHint: () => void;
  onChooseProducts: () => void;
  onViewBidRecommendation: (item: Widgets2Card['item']) => void;
  onOpenSetupRecommendations: (item: Widgets2Card['item']) => void;
}) {
  return (
    <div className="flex w-full min-w-0 items-stretch gap-2 overflow-visible">
      <section className="flex min-h-0 min-w-0 flex-[0.72] flex-col rounded-xl bg-white p-4 shadow-sm">
        <div className="mt-3 grid w-full min-w-0 grid-cols-[1fr_130px] items-baseline gap-x-3 gap-y-3">
          <div className="text-[11px] leading-none text-[#767386]">Сумма заказов</div>
          <div className="flex items-baseline gap-2 leading-none justify-self-start">
            <div className="text-[14px] font-bold tabular-nums tracking-tight text-gray-900">196 000 ₽</div>
            <div
              className={`flex items-center gap-0.5 text-[11px] font-medium leading-none ${
                profileId === '2' ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              <ArrowUp className={`h-2.5 w-2.5 ${profileId === '2' ? 'rotate-180' : ''}`} aria-hidden />
              {profileId === '2' ? '-1.9%' : '1.9%'}
            </div>
          </div>

          <div className="text-[11px] leading-none text-[#767386]">Затраты</div>
          <div className="flex items-baseline gap-2 leading-none justify-self-start">
            <div className="text-[14px] font-bold tabular-nums tracking-tight text-gray-900">10 000 ₽</div>
            <div
              className={`flex items-center gap-0.5 text-[11px] font-medium leading-none ${
                profileId === '2' ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              <ArrowUp className={`h-2.5 w-2.5 ${profileId === '2' ? '' : 'rotate-180'}`} aria-hidden />
              {profileId === '2' ? '-3.1%' : '3.1%'}
            </div>
          </div>

          <div className="text-[11px] leading-none text-[#767386]">Доля затрат</div>
          <div className="flex items-baseline gap-2 leading-none justify-self-start">
            <div className="text-[14px] font-bold tabular-nums tracking-tight text-gray-900">9,7 %</div>
            <div
              className={`flex items-center gap-0.5 text-[11px] font-medium leading-none ${
                profileId === '2' ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              <ArrowUp className={`h-2.5 w-2.5 ${profileId === '2' ? 'rotate-180' : ''}`} aria-hidden />
              {profileId === '2' ? '-5.8%' : '5.8%'}
            </div>
          </div>

          <div className="text-[11px] leading-none text-[#767386]">CTR</div>
          <div className="flex items-baseline gap-2 leading-none justify-self-start">
            <div className="text-[14px] font-bold tabular-nums tracking-tight text-gray-900">4,7 %</div>
            <div
              className={`flex items-center gap-0.5 text-[11px] font-medium leading-none ${
                profileId === '2' ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              <ArrowUp className={`h-2.5 w-2.5 ${profileId === '2' ? 'rotate-180' : ''}`} aria-hidden />
              {profileId === '2' ? '-12.6%' : '12.6%'}
            </div>
          </div>
        </div>
      </section>

      {items.map((card) => (
        <section
          key={card.id}
          className="relative flex min-h-0 min-w-0 flex-[1.08] flex-col rounded-xl bg-white p-4 shadow-sm"
        >
          <button
            type="button"
            onClick={() => onCloseItem(card.id)}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            aria-label="Закрыть виджет"
            title="Закрыть"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>

          <div className="flex min-h-0 flex-1 flex-col pr-9">
            <div className="flex min-w-0 items-start gap-2">
              <Widgets2CardIcon icon={card.icon} tone={card.iconTone} />
              <div className="min-w-0 flex-1 text-sm font-bold leading-snug text-gray-900">
                {card.title}
              </div>
            </div>

            <div className="mt-2.5">
              {card.item ? (
                <div className="flex min-w-0 items-center gap-2">
                  <img
                    src={card.item.image}
                    alt=""
                    className="h-[38px] w-[30px] shrink-0 rounded-md border border-gray-100 bg-gray-50 object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (img.src !== PRODUCT_TABLE_THUMB_FALLBACK) {
                        img.src = PRODUCT_TABLE_THUMB_FALLBACK;
                      }
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-gray-900">
                      {card.item.name}
                    </div>
                    <div className="mt-0.5 text-[11px] leading-snug text-gray-500">
                      {card.productCaption ?? card.subtitle}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="min-h-[38px] text-[11px] leading-snug text-gray-500">
                  {card.subtitle}
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1" aria-hidden />

            <div className="shrink-0 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    switch (card.ctaAction) {
                      case 'budget':
                        onOpenBudgetHint();
                        break;
                      case 'bonus-campaign':
                        onChooseProducts();
                        break;
                      case 'bid-recommendation':
                        onViewBidRecommendation(card.item);
                        break;
                      case 'setup-recommendation':
                        onOpenSetupRecommendations(card.item);
                        break;
                      case 'repeat':
                        onOpenBudgetHint();
                        break;
                      case 'promote':
                      default:
                        if (card.item) onPromoteItem(card.item);
                        break;
                    }
                  }}
                  className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-[#ececef] px-3 py-1.5 text-xs font-semibold leading-none text-gray-800 transition-colors hover:bg-[#e2e2e6]"
                >
                  {card.ctaLabel}
                </button>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

const StatusBadge = ({ status, text }: { status: DisplayCampaign['status'], text: string }) => {
  // Цветные плашки статуса: закругления как у ярлыков (rounded-md)
  const baseClasses = 'px-2.5 py-0.5 text-xs font-medium rounded-md';
  const styles: Record<DisplayCampaign['status'], string> = {
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    draft: 'bg-gray-200 text-gray-600',
    error: 'bg-red-100 text-red-700',
  };

  return <span className={`${baseClasses} ${styles[status]}`}>{text}</span>;
};

const ResultBlock = ({ successCount, errorCount, onClear }: { successCount: number, errorCount: number, failedCampaigns: CampaignRecord[], onClear: () => void }) => {
    return (
        <div className="bg-white rounded-xl p-5 mb-6 shadow-sm border border-gray-100 relative animate-in fade-in duration-300">
            <button onClick={onClear} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5" />
            </button>
            <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 text-green-500 mt-1 shrink-0" />
                <div>
                    <h2 className="text-xl font-bold text-gray-900">
                        Создано {successCount} {getPlural(successCount, 'кампания', 'кампании', 'кампаний')}
                    </h2>
                    {errorCount > 0 ? (
                        <p className="text-gray-600 mt-1 text-sm">
                            {errorCount} {getPlural(errorCount, 'кампания не была запущена', 'кампании не были запущены', 'кампаний не были запущены')} из-за нехватки средств и {getPlural(errorCount, 'находится', 'находятся', 'находятся')} в статусе «Готово к запуску».{' '}
                            <a href="#" onClick={(e) => e.preventDefault()} className="text-purple-600 font-medium ml-1 hover:underline">показать в списке</a>
                        </p>
                    ) : (
                        <p className="text-gray-600 mt-1 text-sm">Все кампании были успешно запущены.</p>
                    )}
                </div>
            </div>
        </div>
    )
};

const ApplyingChangesBlock: React.FC<{ onOpenReview: () => void; onCancel: () => void; }> = ({ onOpenReview, onCancel }) => (
  <div className="bg-white rounded-xl p-8 mb-6 shadow-sm border border-gray-100 flex flex-col items-center text-center animate-in fade-in duration-300">
    <Loader className="w-12 h-12 text-purple-600 animate-spin" />
    <h2 className="text-xl font-bold text-gray-900 mt-4">
      Внесем изменения через 5 секунд
    </h2>
    <div className="mt-2 max-w-xl px-4 py-3 rounded-lg bg-purple-50 border border-purple-100 flex items-start gap-3 text-left">
      <AlertTriangle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
      <p className="text-sm text-gray-900 font-semibold">
        Мы применяем изменения. Пожалуйста, не вносите правки в эти кампании до завершения процесса.
      </p>
    </div>
    <div className="flex items-center gap-4 mt-6">
      <button onClick={onCancel} className="px-5 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
        Отменить изменения
      </button>
      <button onClick={onOpenReview} className="px-5 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg">
        Смотреть файл с изменениями
      </button>
    </div>
  </div>
);

/** Concept table toolbar controls, no border */
const conceptToolbarControlBgClass =
  'bg-[rgba(74,74,89,0.08)] hover:bg-[rgba(74,74,89,0.12)]';
const conceptToolbarTextControlClass = `inline-flex h-11 w-auto max-w-full items-center gap-2 rounded-[10px] px-4 text-sm font-medium leading-5 text-gray-900 transition-colors ${conceptToolbarControlBgClass}`;
const conceptToolbarIconControlClass = `inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] transition-colors ${conceptToolbarControlBgClass}`;

const DateFilter = ({ defaultLabel, variant = 'default' }: { defaultLabel: string; variant?: 'default' | 'toolbar' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [label, setLabel] = useState(defaultLabel);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const setPreset = (preset: 'today' | 'yesterday') => {
    const today = new Date();
    if (preset === 'today') {
        const dateStr = today.toISOString().split('T')[0];
        setStartDate(dateStr);
        setEndDate(dateStr);
        setLabel('Сегодня');
    } else {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toISOString().split('T')[0];
        setStartDate(dateStr);
        setEndDate(dateStr);
        setLabel('Вчера');
    }
    setIsOpen(false);
  };

  const applyCustomRange = () => {
    if (startDate && endDate) {
        const start = new Date(startDate).toLocaleDateString('ru-RU');
        const end = new Date(endDate).toLocaleDateString('ru-RU');
        setLabel(`${start} - ${end}`);
        setIsOpen(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={
          variant === 'toolbar'
            ? 'flex h-11 min-w-[220px] items-center gap-2 rounded-[10px] border border-[#e3e4ea] bg-white px-4 text-sm leading-5 text-gray-900 hover:bg-gray-50 transition-colors'
            : 'flex items-center gap-2 bg-white border border-gray-200 text-gray-700 font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors'
        }
      >
        {variant === 'toolbar' ? (
          <>
            <span className="flex-1 text-left tabular-nums whitespace-nowrap">{label}</span>
            <Calendar className="w-5 h-5 shrink-0 text-[#767386]" aria-hidden />
          </>
        ) : (
          <>
            <Calendar className="w-5 h-5 text-gray-500" />
            <span>{label}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </>
        )}
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border z-20 p-4 animate-in fade-in zoom-in-95 duration-100">
          <div className="space-y-2">
             <button onClick={() => setPreset('today')} className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 rounded-md transition-colors">Сегодня</button>
             <button onClick={() => setPreset('yesterday')} className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 rounded-md transition-colors">Вчера</button>
          </div>
          <div className="border-t my-3"></div>
          <p className="text-sm font-medium mb-2">Выбрать период</p>
          <div className="space-y-2">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border-gray-300 rounded-md text-sm p-2 focus:ring-purple-500 focus:border-purple-500"/>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border-gray-300 rounded-md text-sm p-2 focus:ring-purple-500 focus:border-purple-500"/>
          </div>
          <button onClick={applyCustomRange} className="w-full mt-3 bg-purple-600 text-white font-semibold py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors">Применить</button>
        </div>
      )}
    </div>
  );
}

type ReadyToRepeatBadge = { type: 'count'; value: string };

type ReadyToRepeatCpcDetail = {
  campaignId: number;
  name: string;
  remainingBudget: number | null;
  dailyLimit: number | null;
  scheduledDailyLimit: number | null;
  dailyLimitExhausted?: boolean;
  fromReadyToRepeat?: boolean;
  repeatLaunchPreset?: RepeatLaunchPreset;
};

type ReadyToRepeatItem = {
  id: string;
  image: string;
  dateLabel: string;
  isNew?: boolean;
  orders: number;
  days: number;
  badge?: ReadyToRepeatBadge;
  cpcDetail?: ReadyToRepeatCpcDetail;
  launchPreset: RepeatLaunchPreset;
};

function productSourceToSingleCampaignSeed(product: ProductSource): SingleCampaignSeedProduct {
  const nmId = Number.parseInt(product.article, 10);
  return {
    nmId: Number.isFinite(nmId) ? nmId : 0,
    productName: product.name,
    imageUrl: product.image,
    category: product.category,
    cpcCompatible: product.campaigns.length === 0 || product.campaigns.some((c) => c.type === 'CPC'),
  };
}

function buildRepeatLaunchPreset(
  product: ProductSource,
  dateLabel: string,
  imageOverride?: string,
): RepeatLaunchPreset {
  const seed = productSourceToSingleCampaignSeed(product);
  if (imageOverride && !isPlaceholderProductImage(imageOverride)) {
    seed.imageUrl = imageOverride;
  } else if (isPlaceholderProductImage(seed.imageUrl)) {
    seed.imageUrl = CLOTHING_STACK_PREVIEW_IMAGES[0];
  }
  return {
    product: seed,
    campaignName: `Кампания от ${dateLabel}`,
  };
}

/** Блок подпись + значение в строке шапки h-16: ровно 6px между строками, без margin у `<p>`. */
const LIST_HEADER_COMPACT_STAT = 'flex h-full flex-col justify-center gap-[6px]';
const LIST_HEADER_STAT_LABEL_CLASS = 'm-0 block text-[11px] leading-[11px] text-[#767386]';
const LIST_HEADER_STAT_VALUE_CLASS =
  'm-0 text-[22px] font-bold leading-none tabular-nums tracking-tight text-gray-900';

function ListHeaderCompactStatsPanel({
  className = 'h-24 flex-1',
  alignStatsCenter = false,
  variant = 'card',
  statsJustify = 'start',
}: {
  className?: string;
  alignStatsCenter?: boolean;
  variant?: 'card' | 'inline';
  statsJustify?: 'start' | 'end';
}) {
  const shellClass =
    variant === 'card'
      ? `flex min-w-0 items-stretch overflow-hidden rounded-[12px] bg-white px-5 shadow-sm ${className}`
      : `flex min-w-0 items-stretch overflow-hidden ${className}`;

  const statBlock = (
    label: string,
    value: string,
    trend?: { text: string; down?: boolean },
  ) => (
    <div key={label} className={`shrink-0 ${LIST_HEADER_COMPACT_STAT}`}>
      <p className={`${LIST_HEADER_STAT_LABEL_CLASS} text-left`}>{label}</p>
      {trend ? (
        <div className="m-0 flex items-baseline justify-end gap-2 leading-none">
          <p className={LIST_HEADER_STAT_VALUE_CLASS}>{value}</p>
          <p className="m-0 flex items-center gap-0.5 text-[11px] font-medium leading-none text-emerald-600">
            <ArrowUp
              className={`h-2.5 w-2.5 ${trend.down ? 'rotate-180' : ''}`}
              aria-hidden
            />
            {trend.text}
          </p>
        </div>
      ) : (
        <p className={`${LIST_HEADER_STAT_VALUE_CLASS} text-right`}>{value}</p>
      )}
    </div>
  );

  return (
    <div className={shellClass}>
      <div
        className={`flex w-full flex-1 items-stretch gap-6 sm:gap-8 ${
          statsJustify === 'end' ? 'justify-end' : 'justify-start'
        } ${alignStatsCenter ? 'min-h-full items-center' : ''}`}
      >
        {statBlock('Доля затрат', '9,7 %', { text: '5.8%', down: true })}
        {statBlock('Сумма заказов', '196 000 ₽', { text: '1.9%' })}
        {statBlock('Заказы', '127', { text: '12.6%' })}
        {statBlock('CTR', '2,45 %')}
      </div>
    </div>
  );
}

const CLOTHING_STACK_PREVIEW_IMAGES: [string, string, string] = [
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=96&h=96&fit=crop&q=80',
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=96&h=96&fit=crop&q=80',
  'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=96&h=96&fit=crop&q=80',
];

function isPlaceholderProductImage(url: string): boolean {
  return /placehold\.co/i.test(url);
}

function pickClothingStackImages(
  products: { category: string; image: string }[],
): [string, string, string] {
  const clothingCategories = new Set(['Платья', 'Футболки', 'Кроссовки', 'Сумки']);
  const fromCatalog = products
    .filter((p) => clothingCategories.has(p.category))
    .map((p) => p.image)
    .filter((src) => src && !isPlaceholderProductImage(src))
    .slice(0, 3);

  return [
    fromCatalog[0] ?? CLOTHING_STACK_PREVIEW_IMAGES[0],
    fromCatalog[1] ?? CLOTHING_STACK_PREVIEW_IMAGES[1],
    fromCatalog[2] ?? CLOTHING_STACK_PREVIEW_IMAGES[2],
  ];
}

function buildBonusNotificationQueue(
  products: ProductSource[],
  stackImages: [string, string, string],
): BonusCampaignNotification[] {
  const clothingCategories = new Set(['Платья', 'Футболки', 'Кроссовки', 'Сумки']);
  const clothingProducts = products.filter((p) => clothingCategories.has(p.category));
  const pickProduct = (index: number) =>
    clothingProducts[index] ?? clothingProducts[0] ?? products[0] ?? PRODUCTS_SOURCE[0];
  const dateLabel = '26.12.2024';

  const pickImage = (index: number, product: ProductSource) => {
    if (product.image && !isPlaceholderProductImage(product.image)) return product.image;
    const fromStack = stackImages[index % stackImages.length];
    if (fromStack && !isPlaceholderProductImage(fromStack)) return fromStack;
    return CLOTHING_STACK_PREVIEW_IMAGES[index % CLOTHING_STACK_PREVIEW_IMAGES.length];
  };

  const rows: Array<
    Pick<
      BonusCampaignNotification,
      'views' | 'orders' | 'ctr' | 'season' | 'campaignName' | 'productDisplayName'
    >
  > = [
    {
      views: 14230,
      orders: 14,
      ctr: 24,
      season: 130,
      campaignName: 'Кампания 123',
      productDisplayName: 'Платье 123',
    },
    {
      views: 9230,
      orders: 9,
      ctr: 10,
      season: 92,
      campaignName: 'Кампания 234',
      productDisplayName: 'Платье 234',
    },
    {
      views: 5180,
      orders: 5,
      ctr: 35,
      season: 145,
      campaignName: 'Кампания 456',
      productDisplayName: 'Платье 456',
    },
    {
      views: 2410,
      orders: 2,
      ctr: 23,
      season: 110,
      campaignName: 'Кампания 123',
      productDisplayName: 'Платье 123',
    },
  ];

  return rows.map((row, index) => {
    const product = pickProduct(index);
    const imageUrl = pickImage(index, product);
    const launchPreset = buildRepeatLaunchPreset(product, dateLabel, imageUrl);
    return {
      id: `bonus-notify-${index + 1}`,
      imageUrl,
      views: row.views,
      ctr: row.ctr,
      season: row.season,
      orders: row.orders,
      campaignName: row.campaignName,
      productDisplayName: row.productDisplayName,
      launchPreset,
    };
  });
}

function GreenGrowthChartIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden
    >
      <rect x="1" y="9" width="3" height="6" rx="0.5" fill="currentColor" opacity="0.35" />
      <rect x="6" y="6" width="3" height="9" rx="0.5" fill="currentColor" opacity="0.65" />
      <rect x="11" y="2" width="3" height="13" rx="0.5" fill="currentColor" />
      <path
        d="M2 12.5 L6 8.5 L9.5 10 L14 4"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
    </svg>
  );
}

const CreateCampaignDropdown = ({
  onNavigateToCreation,
  onOpenSingleCampaign,
  onNavigateToCuratedPick,
}: {
  onNavigateToCreation: () => void;
  onOpenSingleCampaign?: () => void;
  onNavigateToCuratedPick?: () => void;
}) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            className="relative shrink-0"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <button
                type="button"
                onClick={() => onOpenSingleCampaign?.()}
                className="flex items-center justify-center gap-1.5 shrink-0 h-11 px-4 rounded-[10px] bg-[#9a41fe] hover:bg-[#8840e5] text-white text-sm font-medium leading-5 transition-colors"
            >
                <span className="whitespace-nowrap">Создать кампанию</span>
                <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 z-[200] w-56 pt-2">
                    <div className="rounded-lg border border-gray-200 bg-white py-1 shadow-lg animate-in fade-in zoom-in-95 duration-100">
                        <button
                            type="button"
                            onClick={() => {
                                onOpenSingleCampaign?.();
                                setIsOpen(false);
                            }}
                            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                        >
                            Одну
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                onNavigateToCreation();
                                setIsOpen(false);
                            }}
                            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                        >
                            Много кампаний
                        </button>
                        <div className="my-1 border-t border-gray-200" role="separator" />
                        <button
                            type="button"
                            onClick={() => {
                                onNavigateToCuratedPick?.();
                                setIsOpen(false);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                        >
                            <GreenGrowthChartIcon className="shrink-0 text-emerald-600" />
                            Подборка недели
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const ExcelActionsDropdown = ({ onOpenUpload, onOpenHistory, showUploadHint = false, onDismissUploadHint, trigger = 'menu' }: { onOpenUpload: () => void, onOpenHistory: () => void, showUploadHint?: boolean, onDismissUploadHint?: () => void, trigger?: 'menu' | 'download' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [showHoverTooltip, setShowHoverTooltip] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
            if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node) && showUploadHint) {
                // Don't close tooltip on outside click, only on dismiss button
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            if (hoverTimerRef.current) {
                clearTimeout(hoverTimerRef.current);
            }
        };
    }, [showUploadHint]);

    const handleMouseEnter = () => {
        hoverTimerRef.current = setTimeout(() => {
            setShowHoverTooltip(true);
        }, 1500);
    };

    const handleMouseLeave = () => {
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }
        setShowHoverTooltip(false);
    };

    return (
        <div className="relative" ref={ref}>
            <button 
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className={
                  trigger === 'download'
                    ? 'flex items-center justify-center w-11 h-11 rounded-[10px] bg-[rgba(74,74,89,0.08)] text-gray-700 hover:bg-[rgba(74,74,89,0.12)] transition-colors'
                    : 'flex items-center justify-center w-11 h-11 rounded-[10px] bg-white border border-[#f0f0f3] text-gray-700 hover:bg-gray-50 transition-colors'
                }
                title={trigger === 'download' ? 'Скачать и загрузить Excel' : 'Загрузить Excel'}
                aria-label={trigger === 'download' ? 'Скачать и загрузить Excel' : 'Меню загрузки Excel'}
            >
                {trigger === 'download' ? (
                  <Download className="w-5 h-5 text-gray-700" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-700" />
                )}
            </button>
            {showHoverTooltip && (
                <div 
                    className="absolute bottom-full left-0 mb-2 bg-gray-900 text-white rounded-lg shadow-xl z-30 px-3 py-2 text-sm whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-200"
                    onMouseEnter={() => setShowHoverTooltip(true)}
                    onMouseLeave={handleMouseLeave}
                >
                    Массовая загрузка изменений по кампаниям
                    <div className="absolute top-full left-4 w-2 h-2 bg-gray-900 transform rotate-45 -mt-1"></div>
                </div>
            )}
            {isOpen && (
                <div className={`absolute top-full mt-2 w-56 bg-white rounded-lg shadow-lg border z-[200] py-1 animate-in fade-in zoom-in-95 duration-100 ${trigger === 'download' ? 'right-0' : 'left-0'}`}>
                    <a href="#" onClick={(e) => { e.preventDefault(); onOpenUpload(); setIsOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Загрузить Excel</a>
                    <a href="#" onClick={(e) => { e.preventDefault(); onOpenHistory(); setIsOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">История изменений</a>
                </div>
            )}
            {showUploadHint && (
                <div 
                    ref={tooltipRef}
                    className="absolute top-full left-0 mt-2 w-80 bg-gray-900 text-white rounded-lg shadow-xl z-30 p-4 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-white shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium mb-1">Загрузите изменённый файл</p>
                            <p className="text-xs text-gray-300 leading-relaxed">
                                Вы скачали Excel файл с параметрами кампаний. Внесите необходимые изменения в файл и загрузите его обратно через кнопку "Загрузить Excel" для применения изменений.
                            </p>
                        </div>
                        {onDismissUploadHint && (
                            <button
                                onClick={onDismissUploadHint}
                                className="shrink-0 text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <div className="absolute -top-2 left-6 w-4 h-4 bg-gray-900 transform rotate-45"></div>
                </div>
            )}
        </div>
    );
};

type FilterTab = 'status' | 'autorefill' | 'payment' | 'sort' | 'category' | 'tags';

type ProductsFilterSection =
  | 'categories'
  | 'conflicts'
  | 'status'
  | 'autorefill'
  | 'payment'
  | 'sort'
  | 'campaignTypes';

const PRODUCTS_FILTER_DEMO_CATEGORIES = [
  'Бейсболки',
  'Блузки',
  'Боди',
  'Бомберы',
  'Брелоки',
  'Брюки',
  'Ветровки',
  'Калейдоскопы',
  'Коврики комнатные',
];

const CAMPAIGN_TYPE_FILTER_OPTIONS = [
  { id: 'CPC', label: 'CPC' },
  { id: 'CPM_UNIFIED', label: 'CPM, единая ставка' },
  { id: 'CPM_MANUAL', label: 'CPM, ручная ставка' },
] as const;

const FilterDropdown = ({ 
  isOpen, 
  onClose, 
  onApply, 
  category, onCategoryChange,
  status, onStatusChange,
  autorefill, onAutorefillChange,
  payment, onPaymentChange,
  sort, onSortChange,
  filterByCategory, onFilterByCategoryChange,
  tempStatus, onTempStatusChange,
  tempAutorefill, onTempAutorefillChange,
  tempPayment, onTempPaymentChange,
  tempSort, onTempSortChange,
  tempCategory, onTempCategoryChange,
  tempFilterByCategory, onTempFilterByCategoryChange,
  tempTags, onTempTagsChange,
  tempTagsSearch, onTempTagsSearchChange,
  tempTagsCategory, onTempTagsCategoryChange,
  tempFilterPromoTagsOnly,
  onTempFilterPromoTagsOnlyChange,
  availableTags,
  variant = 'campaigns',
  productCategoryOptions = [],
  productsSection,
  onProductsSectionChange,
  tempProductCategories,
  onTempProductCategoriesChange,
  tempConflictOnly,
  onTempConflictOnlyChange,
  tempCampaignTypes,
  onTempCampaignTypesChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  variant?: 'campaigns' | 'products';
  productCategoryOptions?: string[];
  productsSection?: ProductsFilterSection;
  onProductsSectionChange?: (section: ProductsFilterSection) => void;
  tempProductCategories?: string[];
  onTempProductCategoriesChange?: (categories: string[]) => void;
  tempConflictOnly?: boolean;
  onTempConflictOnlyChange?: (value: boolean) => void;
  tempCampaignTypes?: string[];
  onTempCampaignTypesChange?: (types: string[]) => void;
  category: FilterTab;
  onCategoryChange: (cat: FilterTab) => void;
  status: string;
  onStatusChange: (val: string) => void;
  autorefill: string;
  onAutorefillChange: (val: string) => void;
  payment: string;
  onPaymentChange: (val: string) => void;
  sort: string;
  onSortChange: (val: string) => void;
  filterByCategory: string;
  onFilterByCategoryChange: (val: string) => void;
  tempStatus: string;
  onTempStatusChange: (val: string) => void;
  tempAutorefill: string;
  onTempAutorefillChange: (val: string) => void;
  tempPayment: string;
  onTempPaymentChange: (val: string) => void;
  tempSort: string;
  onTempSortChange: (val: string) => void;
  tempCategory: FilterTab;
  onTempCategoryChange: (cat: FilterTab) => void;
  tempFilterByCategory: string;
  onTempFilterByCategoryChange: (val: string) => void;
  tempTags: string[];
  onTempTagsChange: (tags: string[]) => void;
  tempTagsSearch: string;
  onTempTagsSearchChange: (search: string) => void;
  tempTagsCategory: string;
  onTempTagsCategoryChange: (category: string) => void;
  tempFilterPromoTagsOnly: boolean;
  onTempFilterPromoTagsOnlyChange: (value: boolean) => void;
  availableTags: string[];
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!isOpen) return null;

  const productsSectionTitle = (() => {
    switch (productsSection) {
      case 'categories':
        return 'Категории';
      case 'conflicts':
        return 'Конфликты кампаний';
      case 'status':
        return 'Статус кампаний';
      case 'autorefill':
        return 'Автопополнение';
      case 'payment':
        return 'Модель оплаты';
      case 'sort':
        return 'Тип сортировки кампаний';
      case 'campaignTypes':
        return 'Типы кампании';
      default:
        return 'Категории';
    }
  })();

  const allCategoriesSelected =
    productCategoryOptions.length > 0 &&
    productCategoryOptions.every((c) => tempProductCategories?.includes(c));

  const toggleAllProductCategories = () => {
    if (!onTempProductCategoriesChange) return;
    if (allCategoriesSelected) onTempProductCategoriesChange([]);
    else onTempProductCategoriesChange([...productCategoryOptions]);
  };

  const productsNavBtn = (section: ProductsFilterSection, label: string) => (
    <button
      type="button"
      onClick={() => onProductsSectionChange?.(section)}
      className={`w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-colors ${
        productsSection === section
          ? 'bg-[rgba(74,74,89,0.08)] text-gray-900'
          : 'text-gray-700 hover:bg-[rgba(74,74,89,0.05)]'
      }`}
    >
      {label}
    </button>
  );

  const filterDropdownViewportClass =
    'absolute right-0 top-full z-[100] mt-2 flex w-[min(800px,calc(100vw-2rem))] max-h-[min(560px,calc(100dvh-7rem))] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-100';

  if (variant === 'products') {
    return (
      <div ref={dropdownRef} className={filterDropdownViewportClass}>
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="flex w-56 min-h-0 shrink-0 flex-col gap-1 overflow-y-auto overscroll-contain border-r border-gray-100 p-3">
            {productsNavBtn('categories', 'Категории')}
            {productsNavBtn('conflicts', 'Конфликты кампаний')}
            <p className="px-4 pt-3 pb-1 text-xs font-medium text-gray-400">Кампании</p>
            {productsNavBtn('status', 'Статус кампаний')}
            {productsNavBtn('autorefill', 'Автопополнение')}
            {productsNavBtn('payment', 'Модель оплаты')}
            {productsNavBtn('sort', 'Тип сортировки кампаний')}
            {productsNavBtn('campaignTypes', 'Типы кампании')}
          </div>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-bold text-gray-900">Товары</h3>
              {productsSection === 'categories' && (
                <button
                  type="button"
                  onClick={toggleAllProductCategories}
                  className="text-sm font-medium text-[#5067DE] hover:underline"
                >
                  Выбрать все
                </button>
              )}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
              {productsSection === 'categories' && (
                <>
                  <h4 className="mb-4 text-base font-bold text-gray-900">{productsSectionTitle}</h4>
                  <div className="space-y-3">
                    {productCategoryOptions.map((cat) => (
                      <label key={cat} className="flex cursor-pointer items-center gap-3">
                        <Checkbox
                          checked={tempProductCategories?.includes(cat) ?? false}
                          onChange={(e) => {
                            if (!onTempProductCategoriesChange || !tempProductCategories) return;
                            if (e.target.checked) {
                              onTempProductCategoriesChange([...tempProductCategories, cat]);
                            } else {
                              onTempProductCategoriesChange(
                                tempProductCategories.filter((c) => c !== cat),
                              );
                            }
                          }}
                        />
                        <span className="text-sm text-gray-900">{cat}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}
              {productsSection === 'conflicts' && (
                <>
                  <h4 className="mb-4 text-base font-bold text-gray-900">{productsSectionTitle}</h4>
                  <label className="flex cursor-pointer items-center gap-3">
                    <Checkbox
                      checked={tempConflictOnly ?? false}
                      onChange={(e) => onTempConflictOnlyChange?.(e.target.checked)}
                    />
                    <span className="text-sm text-gray-900">
                      Только товары с конфликтом кампаний (CPC и CPM одновременно)
                    </span>
                  </label>
                </>
              )}
              {productsSection === 'campaignTypes' && (
                <>
                  <h4 className="mb-4 text-base font-bold text-gray-900">{productsSectionTitle}</h4>
                  <div className="space-y-3">
                    {CAMPAIGN_TYPE_FILTER_OPTIONS.map((opt) => (
                      <label key={opt.id} className="flex cursor-pointer items-center gap-3">
                        <Checkbox
                          checked={tempCampaignTypes?.includes(opt.id) ?? false}
                          onChange={(e) => {
                            if (!onTempCampaignTypesChange || !tempCampaignTypes) return;
                            if (e.target.checked) {
                              onTempCampaignTypesChange([...tempCampaignTypes, opt.id]);
                            } else {
                              onTempCampaignTypesChange(
                                tempCampaignTypes.filter((t) => t !== opt.id),
                              );
                            }
                          }}
                        />
                        <span className="text-sm text-gray-900">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}
              {productsSection === 'status' && (
                <div className="space-y-3">
                  <h4 className="mb-4 text-base font-bold text-gray-900">{productsSectionTitle}</h4>
                  {[
                    { value: 'all-except-archived', label: 'Все, кроме архивных' },
                    { value: 'ready-to-launch', label: 'Готовые к запуску' },
                    { value: 'active', label: 'Активные' },
                    { value: 'paused', label: 'Приостановленные' },
                    { value: 'archived', label: 'Архивные' },
                  ].map((option) => (
                    <label key={option.value} className="flex cursor-pointer items-center gap-3">
                      <Checkbox
                        checked={tempStatus === option.value}
                        onChange={() => onTempStatusChange(option.value)}
                      />
                      <span className="text-sm text-gray-900">{option.label}</span>
                    </label>
                  ))}
                </div>
              )}
              {productsSection === 'autorefill' && (
                <div className="space-y-3">
                  <h4 className="mb-4 text-base font-bold text-gray-900">{productsSectionTitle}</h4>
                  {[
                    { value: 'all', label: 'Все' },
                    { value: 'enabled', label: 'Включено' },
                    { value: 'disabled', label: 'Выключено' },
                  ].map((option) => (
                    <label key={option.value} className="flex cursor-pointer items-center gap-3">
                      <Checkbox
                        checked={tempAutorefill === option.value}
                        onChange={() => onTempAutorefillChange(option.value)}
                      />
                      <span className="text-sm text-gray-900">{option.label}</span>
                    </label>
                  ))}
                </div>
              )}
              {productsSection === 'payment' && (
                <div className="space-y-3">
                  <h4 className="mb-4 text-base font-bold text-gray-900">{productsSectionTitle}</h4>
                  {[
                    { value: 'all', label: 'Все' },
                    { value: 'CPC', label: 'CPC' },
                    { value: 'CPM', label: 'CPM' },
                  ].map((option) => (
                    <label key={option.value} className="flex cursor-pointer items-center gap-3">
                      <Checkbox
                        checked={tempPayment === option.value}
                        onChange={() => onTempPaymentChange(option.value)}
                      />
                      <span className="text-sm text-gray-900">{option.label}</span>
                    </label>
                  ))}
                </div>
              )}
              {productsSection === 'sort' && (
                <div className="space-y-3">
                  <h4 className="mb-4 text-base font-bold text-gray-900">{productsSectionTitle}</h4>
                  {[
                    { value: 'by-date', label: 'По дате создания' },
                    { value: 'by-name', label: 'По названию' },
                    { value: 'by-category', label: 'По категории' },
                  ].map((option) => (
                    <label key={option.value} className="flex cursor-pointer items-center gap-3">
                      <Checkbox
                        checked={tempSort === option.value}
                        onChange={() => onTempSortChange(option.value)}
                      />
                      <span className="text-sm text-gray-900">{option.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onApply}
            className="rounded-xl bg-[#9A41FE] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#8840e5]"
          >
            Применить
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[rgba(74,74,89,0.08)] px-6 py-2.5 text-sm font-medium text-gray-900 hover:bg-[rgba(74,74,89,0.12)]"
          >
            Отмена
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className={`${filterDropdownViewportClass} z-20`}>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left Column - Categories */}
        <div className="flex w-64 min-h-0 shrink-0 flex-col overflow-y-auto overscroll-contain border-r border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-4 shrink-0 text-sm font-semibold text-gray-700">Фильтр</h3>
          <div className="flex flex-col gap-1">
            <button 
              onClick={() => onTempCategoryChange('category')} 
              className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tempCategory === 'category' 
                  ? 'bg-purple-50 text-purple-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Категория
            </button>
            <button 
              onClick={() => onTempCategoryChange('status')} 
              className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tempCategory === 'status' 
                  ? 'bg-purple-50 text-purple-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Статус кампаний
            </button>
            <button 
              onClick={() => onTempCategoryChange('autorefill')} 
              className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tempCategory === 'autorefill' 
                  ? 'bg-purple-50 text-purple-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Автопополнение
            </button>
            <button 
              onClick={() => onTempCategoryChange('payment')} 
              className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tempCategory === 'payment' 
                  ? 'bg-purple-50 text-purple-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Модель оплаты
            </button>
            <button 
              onClick={() => onTempCategoryChange('sort')} 
              className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tempCategory === 'sort' 
                  ? 'bg-purple-50 text-purple-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Тип сортировки кампаний
            </button>
            <button 
              onClick={() => onTempCategoryChange('tags')} 
              className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tempCategory === 'tags' 
                  ? 'bg-purple-50 text-purple-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Ярлыки
            </button>
          </div>
        </div>

        {/* Right Column - Options */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6">
          {tempCategory === 'status' && (
            <>
              <div className="space-y-3">
                {[
                  { value: 'all-except-archived', label: 'Все, кроме архивных' },
                  { value: 'ready-to-launch', label: 'Готовые к запуску' },
                  { value: 'active', label: 'Активные' },
                  { value: 'paused', label: 'Приостановленные' },
                  { value: 'archived', label: 'Архивные' }
                ].map(option => (
                  <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      tempStatus === option.value 
                        ? 'border-purple-600 bg-purple-600' 
                        : 'border-gray-300 group-hover:border-purple-400'
                    }`}>
                      {tempStatus === option.value && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <span className={`text-sm ${
                      tempStatus === option.value 
                        ? 'text-gray-900 font-medium' 
                        : 'text-gray-700'
                    }`}>
                      {option.label}
                    </span>
                    <input 
                      type="radio" 
                      name="status" 
                      value={option.value} 
                      checked={tempStatus === option.value} 
                      onChange={(e) => onTempStatusChange(e.target.value)} 
                      className="sr-only" 
                    />
                  </label>
                ))}
              </div>
            </>
          )}

          {tempCategory === 'autorefill' && (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Автопополнение</h3>
              <div className="space-y-3">
                {[
                  { value: 'all', label: 'Все' },
                  { value: 'enabled', label: 'Включено' },
                  { value: 'disabled', label: 'Выключено' }
                ].map(option => (
                  <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      tempAutorefill === option.value 
                        ? 'border-purple-600 bg-purple-600' 
                        : 'border-gray-300 group-hover:border-purple-400'
                    }`}>
                      {tempAutorefill === option.value && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <span className={`text-sm ${
                      tempAutorefill === option.value 
                        ? 'text-gray-900 font-medium' 
                        : 'text-gray-700'
                    }`}>
                      {option.label}
                    </span>
                    <input 
                      type="radio" 
                      name="autorefill" 
                      value={option.value} 
                      checked={tempAutorefill === option.value} 
                      onChange={(e) => onTempAutorefillChange(e.target.value)} 
                      className="sr-only" 
                    />
                  </label>
                ))}
              </div>
            </>
          )}

          {tempCategory === 'payment' && (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Модель оплаты</h3>
              <div className="space-y-3">
                {[
                  { value: 'all', label: 'Все' },
                  { value: 'CPC', label: 'CPC' },
                  { value: 'CPM', label: 'CPM' }
                ].map(option => (
                  <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      tempPayment === option.value 
                        ? 'border-purple-600 bg-purple-600' 
                        : 'border-gray-300 group-hover:border-purple-400'
                    }`}>
                      {tempPayment === option.value && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <span className={`text-sm ${
                      tempPayment === option.value 
                        ? 'text-gray-900 font-medium' 
                        : 'text-gray-700'
                    }`}>
                      {option.label}
                    </span>
                    <input 
                      type="radio" 
                      name="payment" 
                      value={option.value} 
                      checked={tempPayment === option.value} 
                      onChange={(e) => onTempPaymentChange(e.target.value)} 
                      className="sr-only" 
                    />
                  </label>
                ))}
              </div>
            </>
          )}

          {tempCategory === 'category' && (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Категория товара</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    tempFilterByCategory === '' ? 'border-purple-600 bg-purple-600' : 'border-gray-300 group-hover:border-purple-400'
                  }`}>
                    {tempFilterByCategory === '' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                  <span className={`text-sm ${tempFilterByCategory === '' ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>Все категории</span>
                  <input type="radio" name="filterByCategory" value="" checked={tempFilterByCategory === ''} onChange={() => onTempFilterByCategoryChange('')} className="sr-only" />
                </label>
                {CATEGORIES.map(cat => (
                  <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      tempFilterByCategory === cat ? 'border-purple-600 bg-purple-600' : 'border-gray-300 group-hover:border-purple-400'
                    }`}>
                      {tempFilterByCategory === cat && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <span className={`text-sm ${tempFilterByCategory === cat ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>{cat}</span>
                    <input type="radio" name="filterByCategory" value={cat} checked={tempFilterByCategory === cat} onChange={() => onTempFilterByCategoryChange(cat)} className="sr-only" />
                  </label>
                ))}
              </div>
            </>
          )}

          {tempCategory === 'sort' && (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Тип сортировки кампаний</h3>
              <div className="space-y-3">
                {[
                  { value: 'by-date', label: 'По дате создания' },
                  { value: 'by-name', label: 'По названию' },
                  { value: 'by-category', label: 'По категории' }
                ].map(option => (
                  <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      tempSort === option.value 
                        ? 'border-purple-600 bg-purple-600' 
                        : 'border-gray-300 group-hover:border-purple-400'
                    }`}>
                      {tempSort === option.value && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <span className={`text-sm ${
                      tempSort === option.value 
                        ? 'text-gray-900 font-medium' 
                        : 'text-gray-700'
                    }`}>
                      {option.label}
                    </span>
                    <input 
                      type="radio" 
                      name="sort" 
                      value={option.value} 
                      checked={tempSort === option.value} 
                      onChange={(e) => onTempSortChange(e.target.value)} 
                      className="sr-only" 
                    />
                  </label>
                ))}
              </div>
            </>
          )}

          {tempCategory === 'tags' && (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">По ярлыкам</h3>
              
              {/* Search for tags */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Поиск ярлыков"
                    value={tempTagsSearch}
                    onChange={(e) => onTempTagsSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                  />
                </div>
              </div>

          {/* Tags list — только ярлыки, уже добавленные на страницу */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Ярлыки</h4>
            <label className="flex items-center gap-2 mb-3 cursor-pointer select-none">
              <Checkbox
                checked={tempFilterPromoTagsOnly}
                onChange={(e) => onTempFilterPromoTagsOnlyChange(e.target.checked)}
              />
              <span className="text-sm text-gray-700">Показывать только ярлыки продвижения</span>
            </label>
                {availableTags.length === 0 ? (
                  <p className="text-sm text-gray-500">Нет ярлыков на странице</p>
                ) : (
                <div className="flex flex-wrap gap-2">
                  {availableTags
                    .filter(tag => tag && tag.toLowerCase().includes(tempTagsSearch.toLowerCase()))
                    .map(tag => (
                    <label 
                      key={tag}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                        tempTags.includes(tag)
                          ? 'bg-purple-50 border-purple-600 text-purple-700'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-purple-300'
                      }`}
                    >
                    <Checkbox
                        checked={tempTags.includes(tag)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            onTempTagsChange([...tempTags, tag]);
                          } else {
                            onTempTagsChange(tempTags.filter(t => t !== tag));
                          }
                        }}
                        className="sr-only"
                      />
                      <span className="text-sm font-medium">{tag}</span>
                    </label>
                  ))}
                </div>
                )}
              </div>

              {/* Reset button */}
              {(tempTags.length > 0 || tempTagsSearch !== '') && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      onTempTagsChange([]);
                      onTempTagsCategoryChange('');
                      onTempTagsSearchChange('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Сбросить фильтр
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer with buttons */}
      <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-200 p-4">
        <button 
          onClick={onClose} 
          className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Отмена
        </button>
        <button 
          onClick={onApply} 
          className="px-6 py-2.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-all"
        >
          Применить
        </button>
      </div>
    </div>
  );
};


export const SuccessPage: React.FC<SuccessPageProps> = ({ 
    isLaunching, 
    launchTotal, 
    launchResult, 
    failedCampaigns, 
    onClearLaunchResult, 
    onNavigateToCreation,
    onNavigateToCreationWithProducts,
    onNavigateToCreationWithGrowingDemand,
    onOpenUploadEditsModal,
    selectedCampaigns,
    onSelectionChange,
    isApplyingEdits,
    onOpenReview,
    onCancelEdits,
    onOpenHistoryModal,
    showUploadHint = false,
    onDismissUploadHint,
    onOpenCpcCampaign,
    onOpenSingleCampaign,
    onRegisterUpdateFn,
    onRegisterBulkDailyLimitOpener,
    campaignListPatches,
    onPersistCampaignListPatch,
}) => {
  const { showCpmBidRoundedAlert, cpmBidRoundedAlertNode } = useCpmBidRoundedAlert();
  const {
    profileId,
    beginRepeatLaunchFlow,
    showReferralCampaignCreatedNotice,
    dismissReferralCampaignCreatedNotice,
  } = useProfile();
  const profileList = useMemo(() => getProfileListData(profileId), [profileId]);
  const profileProductTree = profileList.productTree;
  const profileCampaigns = profileList.campaigns;

  const readyToRepeatStackImages = useMemo(
    () => pickClothingStackImages(profileProductTree),
    [profileProductTree],
  );

  const readyToRepeatItems = useMemo((): ReadyToRepeatItem[] => {
    const clothingCategories = new Set(['Платья', 'Футболки', 'Кроссовки', 'Сумки']);
    const clothingProducts = profileProductTree.filter((p) => clothingCategories.has(p.category));
    const pickProduct = (index: number) =>
      clothingProducts[index] ?? clothingProducts[0] ?? profileProductTree[0] ?? PRODUCTS_SOURCE[0];
    const [img0, img1, img2] = readyToRepeatStackImages;
    const dateLabel = '26.12.2024';

    const cpcPool = buildAllCampaignsForProfile(profileId).filter((c) => c.type === 'CPC');

    const rows: Array<Omit<ReadyToRepeatItem, 'launchPreset' | 'cpcDetail'>> = [
      {
        id: 'repeat-1',
        image: img0,
        dateLabel,
        isNew: true,
        orders: 80,
        days: 12,
        badge: { type: 'count', value: '+5' },
      },
      {
        id: 'repeat-2',
        image: img1,
        dateLabel,
        isNew: true,
        orders: 234,
        days: 11,
      },
      {
        id: 'repeat-3',
        image: img2,
        dateLabel,
        orders: 127,
        days: 7,
        badge: { type: 'count', value: '+5' },
      },
    ];

    return rows.map((row, index) => {
      const product = pickProduct(index);
      const cpc = cpcPool.length > 0 ? cpcPool[index % cpcPool.length] : undefined;
      return {
        ...row,
        launchPreset: buildRepeatLaunchPreset(product, row.dateLabel, row.image),
        ...(cpc
          ? {
              cpcDetail: {
                campaignId: cpc.campaignId,
                name: `Кампания от ${row.dateLabel}`,
                remainingBudget: cpc.remainingBudget,
                dailyLimit: cpc.dailyLimit,
                scheduledDailyLimit: cpc.scheduledDailyLimit,
                dailyLimitExhausted: cpc.dailyLimitExhausted,
                fromReadyToRepeat: true,
                repeatLaunchPreset: buildRepeatLaunchPreset(product, row.dateLabel, row.image),
              },
            }
          : {}),
      };
    });
  }, [readyToRepeatStackImages, profileProductTree, profileId]);

  const initialBonusNotifications = useMemo(
    () => buildBonusNotificationQueue(profileProductTree, readyToRepeatStackImages),
    [profileProductTree, readyToRepeatStackImages],
  );

  const [bonusNotificationQueue, setBonusNotificationQueue] = useState<BonusCampaignNotification[]>(
    [],
  );

  useEffect(() => {
    if (initialBonusNotifications.length === 0) {
      setBonusNotificationQueue([]);
      return;
    }
    setBonusNotificationQueue((prev) => {
      if (prev.length === 0) return initialBonusNotifications;
      if (prev.every((item) => item.launchPreset)) return prev;
      return initialBonusNotifications;
    });
  }, [initialBonusNotifications]);

  const [allCampaigns, setAllCampaigns] = useState<DisplayCampaign[]>(() =>
    applyCampaignListPatches(buildAllCampaignsForProfile('1'), campaignListPatches),
  );

  useEffect(() => {
    if (!campaignListPatches || Object.keys(campaignListPatches).length === 0) return;
    setAllCampaigns((prev) => applyCampaignListPatches(prev, campaignListPatches));
  }, [campaignListPatches]);

  // Handle campaign data updates from edit page
  const handleUpdateCampaignData = useCallback((campaignId: number, data: CampaignListDataPatch) => {
    onPersistCampaignListPatch?.(campaignId, data);
    setAllCampaigns(prev => prev.map(c => {
      if (c.campaignId === campaignId) {
        return {
          ...c,
          ...(data.name !== undefined && { name: data.name }),
          ...(data.remainingBudget !== undefined && { remainingBudget: data.remainingBudget }),
          ...(data.dailyLimit !== undefined && { dailyLimit: data.dailyLimit }),
          ...(data.scheduledDailyLimit !== undefined && { scheduledDailyLimit: data.scheduledDailyLimit }),
          ...(data.maxCpcBidRub !== undefined && { maxCpcBidRub: data.maxCpcBidRub }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.statusText !== undefined && { statusText: data.statusText }),
        };
      }
      return c;
    }));
  }, [onPersistCampaignListPatch]);

  const [isBulkDailyLimitModalOpen, setIsBulkDailyLimitModalOpen] = useState(false);
  const [bulkDailyLimitTargets, setBulkDailyLimitTargets] = useState<DisplayCampaign[]>([]);

  // Expose update function to parent
  useEffect(() => {
    if (onRegisterUpdateFn) {
      onRegisterUpdateFn(handleUpdateCampaignData);
    }
  }, [onRegisterUpdateFn]); // Removed handleUpdateCampaignData from dependencies to avoid infinite loop

  const [currentPage, setCurrentPage] = useState(1);
  const CAMPAIGNS_PAGE_SIZE = 10;
  const PRODUCTS_PAGINATION_MIN_ITEMS = 20;
  const [isBudgetRefillModalOpen, setIsBudgetRefillModalOpen] = useState(false);
  const [selectedCampaignForRefill, setSelectedCampaignForRefill] = useState<DisplayCampaign | null>(null);
  const [isMassBudgetRefillModalOpen, setIsMassBudgetRefillModalOpen] = useState(false);
  const [massBudgetRefillTargetIds, setMassBudgetRefillTargetIds] = useState<string[]>([]);
  const [isDailyLimitModalOpen, setIsDailyLimitModalOpen] = useState(false);
  const [listAutomationModal, setListAutomationModal] = useState<{
    target: CampaignListAutomationModalTarget;
    kind: CampaignListAutomationKind;
  } | null>(null);
  const [limitShortfallNotification, setLimitShortfallNotification] = useState<{ requestedLimit: number; shortfall: number } | null>(null);

  const openDailyLimitModalForCampaign = useCallback(
    (c: DisplayCampaign) => {
      const fresh = allCampaigns.find((x) => x.id === c.id) ?? c;
      setSelectedCampaignForRefill(fresh);
      setIsDailyLimitModalOpen(true);
    },
    [allCampaigns],
  );

  const dailyLimitModalCampaign = useMemo(() => {
    if (!selectedCampaignForRefill) return null;
    return allCampaigns.find((x) => x.id === selectedCampaignForRefill.id) ?? selectedCampaignForRefill;
  }, [allCampaigns, selectedCampaignForRefill]);

  // Filter states
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<FilterTab>('status');
  const [filterStatus, setFilterStatus] = useState<string>('all-except-archived');
  const [filterAutorefill, setFilterAutorefill] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [filterSort, setFilterSort] = useState<string>('by-date');
  const [filterByCategory, setFilterByCategory] = useState<string>('');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterTagsCategory, setFilterTagsCategory] = useState<string>('');

  // Temporary filter states for dropdown
  const [tempFilterCategory, setTempFilterCategory] = useState<FilterTab>('status');
  const [tempFilterStatus, setTempFilterStatus] = useState<string>('all-except-archived');
  const [tempFilterAutorefill, setTempFilterAutorefill] = useState<string>('all');
  const [tempFilterPayment, setTempFilterPayment] = useState<string>('all');
  const [tempFilterSort, setTempFilterSort] = useState<string>('by-date');
  const [tempFilterByCategory, setTempFilterByCategory] = useState<string>('');
  const [tempTags, setTempTags] = useState<string[]>([]);
  const [tempTagsSearch, setTempTagsSearch] = useState<string>('');
  const [tempTagsCategory, setTempTagsCategory] = useState<string>('');
  const [failedFilterIds, setFailedFilterIds] = useState<number[] | null>(null);
  const [tagError, setTagError] = useState<string | null>(null);
  const [filterPromoTagsOnly, setFilterPromoTagsOnly] = useState(false);
  const [tempFilterPromoTagsOnly, setTempFilterPromoTagsOnly] = useState(false);

  const [productsFilterSection, setProductsFilterSection] =
    useState<ProductsFilterSection>('categories');
  const [tempProductsFilterSection, setTempProductsFilterSection] =
    useState<ProductsFilterSection>('categories');
  const [filterProductCategories, setFilterProductCategories] = useState<string[]>([]);
  const [tempFilterProductCategories, setTempFilterProductCategories] = useState<string[]>([]);
  const [filterConflictOnly, setFilterConflictOnly] = useState(false);
  const [tempFilterConflictOnly, setTempFilterConflictOnly] = useState(false);
  const [filterCampaignTypes, setFilterCampaignTypes] = useState<string[]>([]);
  const [tempFilterCampaignTypes, setTempFilterCampaignTypes] = useState<string[]>([]);

  // Тень у левой закреплённой части таблиц при горизонтальном скролле
  const [hasCampaignsScrollShadow, setHasCampaignsScrollShadow] = useState(false);
  const [hasProductsScrollShadow, setHasProductsScrollShadow] = useState(false);

  const [isProductsPromoModalOpen, setIsProductsPromoModalOpen] = useState(false);
  const [dismissedNotPromotedBonusBannerIds, setDismissedNotPromotedBonusBannerIds] = useState<
    Set<string>
  >(() => new Set());
  const [notPromotedBonusModalProducts, setNotPromotedBonusModalProducts] = useState<
    ProductRow[] | null
  >(null);
  const [dismissedCampaignsBonusBanner, setDismissedCampaignsBonusBanner] = useState(false);

  const [isProductsColumnSettingsOpen, setIsProductsColumnSettingsOpen] = useState(false);
  const [productsColumnVisibility, setProductsColumnVisibility] = useState<Record<string, boolean>>(
    defaultProductsColumnVisibility,
  );

  const location = useLocation();
  const isCampaignsWithWidgetsPage = location.pathname === '/campaigns-with-widgets';
  const isCampaignsWithWidgets2Page = isCampaignsWidgetsV1Layout(location.pathname);
  const isProductPromotionConceptPage =
    location.pathname === PRODUCT_PROMOTION_CONCEPT_PATH;
  const isCampaignsWidgetsV1OnlyPage =
    location.pathname === CAMPAIGNS_WITH_WIDGETS_V1_PATH;

  const [listTab, setListTab] = useState<'campaigns' | 'products'>('campaigns');
  const [productsPickTab, setProductsPickTab] = useState<ProductsPickTab>(() =>
    location.pathname === PRODUCT_PROMOTION_CONCEPT_PATH ? 'all_products' : 'promoted',
  );
  const [productsSecondaryPickTab, setProductsSecondaryPickTab] =
    useState<ProductsSecondaryPickTab>('all');

  const conceptNotPromotedProductsList =
    isProductPromotionConceptPage &&
    listTab === 'products' &&
    isNotPromotedProductsPickTab(productsPickTab);

  const conceptAllProductsPickTab =
    isProductPromotionConceptPage && listTab === 'products' && productsPickTab === 'all_products';

  const conceptAllProductsTable = conceptAllProductsPickTab;

  const conceptCompactProductsTable =
    isProductPromotionConceptPage &&
    listTab === 'products' &&
    isNotPromotedProductsPickTab(productsPickTab);

  /** «Продвигаются» + подвкладки «Все» / «Высокая конверсия» / «А/Б» — широкая таблица с шевроном. */
  const conceptPromotedProductsWideTable =
    isProductPromotionConceptPage &&
    listTab === 'products' &&
    !conceptCompactProductsTable &&
    !conceptAllProductsPickTab;

  const productsColVisible = useCallback(
    (columnId: string) => {
      if (conceptAllProductsTable) {
        if (columnId === MULTICARD_GLUE_LEADER_COLUMN_ID) {
          return true;
        }
        if (
          columnId === 'select' ||
          columnId === 'product' ||
          columnId === 'tags'
        ) {
          return productsColumnVisibility[columnId] !== false;
        }
        if (
          columnId === 'bid' ||
          columnId === 'campaignType'
        ) {
          return false;
        }
        if (columnId === PRODUCTS_STAT_SPACER_COLUMN_ID) {
          return false;
        }
        if (columnId === PRODUCTS_STOCK_COLUMN_ID) {
          return true;
        }
        if (isConceptNotPromotedRecommendedBidColumnId(columnId)) {
          return false;
        }
        if (columnId.startsWith('stat:')) {
          return productsColumnVisibility[columnId] !== false;
        }
        if (
          columnId === 'budgetRemainder' ||
          columnId === 'dailyLimit'
        ) {
          return productsColumnVisibility[columnId] !== false;
        }
        return false;
      }
      if (conceptCompactProductsTable) {
        if (
          columnId === 'select' ||
          columnId === 'product' ||
          columnId === 'tags'
        ) {
          return productsColumnVisibility[columnId] !== false;
        }
        if (
          columnId === 'bid' ||
          columnId === 'budgetRemainder' ||
          columnId === 'dailyLimit' ||
          columnId === 'campaignType'
        ) {
          return false;
        }
        if (columnId === PRODUCTS_STAT_SPACER_COLUMN_ID) {
          return false;
        }
        if (isConceptNotPromotedRecommendedBidColumnId(columnId)) {
          return columnId !== PRODUCTS_RECOMMENDED_BID_CPM_SEARCH_COLUMN_ID;
        }
        if (columnId === PRODUCTS_STOCK_COLUMN_ID) {
          return true;
        }
        if (columnId.startsWith('stat:')) {
          const label = columnId.slice('stat:'.length);
          return CONCEPT_NOT_PROMOTED_PRODUCT_STAT_LABELS.includes(
            label as (typeof PRODUCTS_STAT_COLUMN_LABELS)[number],
          );
        }
      }
      if (
        columnId === PRODUCTS_STOCK_COLUMN_ID ||
        columnId === PRODUCTS_STAT_SPACER_COLUMN_ID ||
        columnId === MULTICARD_GLUE_LEADER_COLUMN_ID ||
        isConceptNotPromotedRecommendedBidColumnId(columnId)
      ) {
        return false;
      }
      if (isProductPromotionConceptPage && columnId === 'bid') {
        return false;
      }
      return productsColumnVisibility[columnId] !== false;
    },
    [productsColumnVisibility, conceptCompactProductsTable, conceptAllProductsTable, isProductPromotionConceptPage],
  );

  const productsPinVisibility = useMemo(() => {
    if (conceptCompactProductsTable) {
      return {
        ...productsColumnVisibility,
        select: true,
        product: true,
        campaignType: false,
        bid: false,
        budgetRemainder: false,
        dailyLimit: false,
        glueLeader: false,
      };
    }
    if (conceptAllProductsTable) {
      return {
        ...productsColumnVisibility,
        glueLeader: true,
        select: true,
        product: true,
        campaignType: false,
        bid: false,
      };
    }
    return {
      ...productsColumnVisibility,
      glueLeader: false,
      bid:
        !isProductPromotionConceptPage && productsColumnVisibility.bid !== false,
      campaignType:
        !isProductPromotionConceptPage && productsColumnVisibility.campaignType !== false,
      budgetRemainder:
        !isProductPromotionConceptPage && productsColumnVisibility.budgetRemainder !== false,
      dailyLimit:
        !isProductPromotionConceptPage && productsColumnVisibility.dailyLimit !== false,
    };
  }, [
    productsColumnVisibility,
    isProductPromotionConceptPage,
    conceptCompactProductsTable,
    conceptAllProductsTable,
  ]);

  const conceptNotPromotedShowTagsColumn =
    conceptCompactProductsTable && productsColumnVisibility.tags !== false;
  const conceptBonusCampaignColumn = conceptNotPromotedProductsList && productsPickTab === 'not_promoted_v3';

  const productsTableMinWidthStyle = useMemo((): React.CSSProperties | undefined => {
    if (!conceptCompactProductsTable) return undefined;
    return {
      minWidth: conceptNotPromotedTableMinWidthPx(
        conceptNotPromotedShowTagsColumn,
        conceptBonusCampaignColumn,
      ),
    };
  }, [conceptCompactProductsTable, conceptNotPromotedShowTagsColumn, conceptBonusCampaignColumn]);

  const showProductsBidColumn = productsPinVisibility.bid === true;
  const showProductsCampaignTypeColumn = productsPinVisibility.campaignType === true;

  const productsPinnedProps = useCallback(
    (
      columnId: (typeof PRODUCTS_PINNED_COLUMNS)[number]['id'],
      variant: 'head' | 'body' | 'bodyNested',
      extraClass = '',
    ) =>
      productsPinnedCellProps(
        columnId,
        productsPinVisibility,
        variant,
        extraClass,
        hasProductsScrollShadow,
        isProductPromotionConceptPage,
        conceptCompactProductsTable,
      ),
    [
      productsPinVisibility,
      hasProductsScrollShadow,
      isProductPromotionConceptPage,
      conceptCompactProductsTable,
    ],
  );

  const productsTablePinnedCellProps = useCallback(
    (
      columnId: (typeof PRODUCTS_PINNED_COLUMNS)[number]['id'],
      variant: 'head' | 'body' | 'bodyNested',
      extraClass = '',
      memberIndentPx = 0,
    ) => {
      const props = productsPinnedProps(columnId, variant, extraClass);
      if (!conceptAllProductsPickTab) {
        return props;
      }
      let left = Number(props.style.left) || 0;
      if (columnId === 'select' || columnId === 'product' || columnId === 'glueLeader') {
        left += CONCEPT_ALL_TAB_MULTICARD_RAIL_WIDTH_PX;
      }
      if (left === (Number(props.style.left) || 0)) {
        return props;
      }
      return {
        ...props,
        style: {
          ...props.style,
          left,
        },
      };
    },
    [productsPinnedProps, conceptAllProductsPickTab],
  );

  const [notificationCardVariant, setNotificationCardVariant] =
    useState<BonusNotificationCardVariant>(1);
  const [showMoreViewsPromoCard, setShowMoreViewsPromoCard] = useState(true);
  // Поиск: по названию товара, названию кампании, артикулу товара, ID кампании
  const [searchQuery, setSearchQuery] = useState('');

  const isCampaignsPage = location.pathname === '/campaigns';
  const insightFilterCtx = useCampaignsInsightFilterOptional();
  const insightFilter =
    (isCampaignsWithWidgetsPage || isCampaignsWithWidgets2Page) && insightFilterCtx
      ? insightFilterCtx.filter
      : null;
  const clearInsightFilter = insightFilterCtx?.clearFilter;

  const [widgets2Closed, setWidgets2Closed] = useState<Set<Widgets2Card['id']>>(new Set());
  const closeWidgets2Card = useCallback((id: Widgets2Card['id']) => {
    setWidgets2Closed((prev) => new Set(prev).add(id));
  }, []);

  const widgets2DemoCards = useMemo((): Widgets2Card[] => {
    const p0 = profileProductTree[0];
    const p1 = profileProductTree[1] ?? p0;
    const c0 = profileCampaigns[0];

    const demoImages = [
      'https://images.unsplash.com/photo-1595777457583-95e059d58199?w=80&h=80&fit=crop&auto=format&q=80',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=80&h=80&fit=crop&auto=format&q=80',
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=80&h=80&fit=crop&auto=format&q=80',
    ] as const;

    if (profileId === '2') {
      const repeatOrders = profileCampaigns.find((c) => typeof c.orders === 'number')?.orders ?? 128;
      return [
        {
          id: 'repeat-campaign',
          title: `Кампания принесла ${repeatOrders} заказов`,
          subtitle: 'Запустите её снова',
          icon: 'refresh',
          iconTone: 'emerald',
          item: {
            nmId: Number.parseInt(p0?.articleWb ?? '', 10) || 1400001,
            name: p0?.name ?? 'Летнее платье «Ривьера»',
            image: p0?.image ?? demoImages[0],
          },
          ctaLabel: 'Повторить',
          ctaAction: 'repeat',
        },
        {
          id: 'good-sales',
          title: 'Товар хорошо продается',
          subtitle: 'Высокий GMV, нет продвижения',
          productCaption: 'Высокий GMV, нет продвижения',
          icon: 'bars',
          iconTone: 'emerald',
          item: {
            nmId: Number.parseInt(p1?.articleWb ?? '', 10) || 1400002,
            name: p1?.name ?? 'Вечернее платье «Грация»',
            image: p1?.image ?? demoImages[1],
          },
          ctaLabel: 'Продвигать',
          ctaAction: 'promote',
        },
        {
          id: 'bonus-gift',
          title: 'Дарим 5000 бонусов до 30 апреля',
          subtitle: 'Выберите товары и запустите продвижение с бонусами',
          icon: 'gift',
          iconTone: 'violet',
          ctaLabel: 'Выбрать товары',
          ctaAction: 'bonus-campaign',
        },
      ];
    }

    const p2 = profileProductTree[2] ?? p1;
    const treeProductItem = (
      row: (typeof profileProductTree)[number] | undefined,
      fallbackNmId: number,
      fallbackName: string,
      image: string,
    ) => ({
      nmId: Number.parseInt(row?.articleWb ?? '', 10) || fallbackNmId,
      name: row?.name ?? fallbackName,
      image: row?.image ?? image,
    });

    return [
      {
        id: 'start-promo',
        title: 'Создайте новую кампанию',
        subtitle: 'Товар с хорошей конверсией в заказ',
        productCaption: 'Товар с хорошей конверсией в заказ',
        icon: 'sparkles',
        iconTone: 'emerald',
        item: treeProductItem(p0, 1400001, 'Летнее платье «Ривьера»', demoImages[0]),
        ctaLabel: 'Продвигать',
        ctaAction: 'promote',
      },
      {
        id: 'good-sales',
        title: 'Увеличьте ставку',
        subtitle: 'Не хватает охвата из-за низкой ставки',
        productCaption: 'Не хватает охвата из-за низкой ставки',
        icon: 'alert',
        iconTone: 'rose',
        item: treeProductItem(p1, 1400002, 'Вечернее платье «Грация»', demoImages[1]),
        ctaLabel: 'Настроить',
        ctaAction: 'bid-recommendation',
      },
      {
        id: 'views-drop',
        title: 'Закончился бюджет',
        subtitle: 'Товар теряет охваты без продвижения',
        productCaption: 'Товар теряет охваты без продвижения',
        icon: 'wallet',
        iconTone: 'rose',
        item: treeProductItem(p2, 1400003, 'Платье-футляр «Офис»', demoImages[2]),
        ctaLabel: 'Пополнить бюджет',
        ctaAction: 'budget',
      },
      {
        id: 'bonus-gift',
        title: 'Скоро сгорят промобонусы',
        subtitle:
          '1 000 промобонусов скоро сгорит. Запустите кампанию за бонусы',
        icon: 'gift',
        iconTone: 'violet',
        ctaLabel: 'Кампания за бонусы',
        ctaAction: 'bonus-campaign',
      },
      {
        id: 'repeat-campaign',
        title: 'Улучшите существующую кампанию',
        subtitle: 'Кластеры настроены неэффективно',
        productCaption: 'Кластеры настроены неэффективно',
        icon: 'settings',
        iconTone: 'amber',
        item: treeProductItem(p2, 1400003, 'Платье-футляр «Офис»', demoImages[2]),
        ctaLabel: 'Рекомендации по настройке',
        ctaAction: 'setup-recommendation',
      },
    ];
  }, [profileProductTree, profileCampaigns, profileId]);

  const widgets2VisibleCards = useMemo(
    () => resolveWidgets2VisibleCards(widgets2DemoCards, widgets2Closed, profileId),
    [widgets2DemoCards, widgets2Closed, profileId],
  );

  const openWidgets2Promote = useCallback(
    (item: Widgets2Card['item']) => {
      const payload = [
        { nmId: item.nmId, productName: item.name, imageUrl: item.image, category: 'Товары' },
      ];
      if (onNavigateToCreationWithProducts) onNavigateToCreationWithProducts(payload);
      else onNavigateToCreation();
    },
    [onNavigateToCreation, onNavigateToCreationWithProducts],
  );

  const openWidgets2BudgetHint = useCallback(() => {
    const match = profileCampaigns.find((c) => c.type === 'CPC');
    if (!match) return;
    setSelectedCampaignForRefill(match);
    setIsBudgetRefillModalOpen(true);
  }, [profileCampaigns]);

  const openWidgets2ChooseProducts = useCallback(() => {
    onNavigateToCreation();
  }, [onNavigateToCreation]);

  const openWidgets2BidRecommendation = useCallback(
    (item: Widgets2Card['item']) => {
      const productMatch = item
        ? profileProductTree.find((row) => {
            const nm = Number.parseInt(row.articleWb ?? '', 10);
            return nm === item.nmId || row.name === item.name;
          })
        : undefined;
      const nestedCpc = productMatch?.campaigns?.find((c) => c.type === 'CPC');
      const listMatch =
        (nestedCpc
          ? allCampaigns.find((c) => c.campaignId === nestedCpc.campaignId)
          : undefined) ??
        profileCampaigns.find((c) => c.type === 'CPC') ??
        allCampaigns.find((c) => c.type === 'CPC');

      if (!listMatch) {
        if (item) openWidgets2Promote(item);
        else onNavigateToCreation();
        return;
      }

      onOpenCpcCampaign({
        campaignId: listMatch.campaignId,
        name: listMatch.name,
        paymentModel: listMatch.type,
        remainingBudget: listMatch.remainingBudget,
        dailyLimit: listMatch.dailyLimit ?? null,
        scheduledDailyLimit: listMatch.scheduledDailyLimit ?? null,
        dailyLimitExhausted: listMatch.dailyLimitExhausted,
        campaignStatus:
          listMatch.status === 'active' || listMatch.status === 'paused'
            ? listMatch.status
            : 'active',
        openBidRecommendations: true,
        bidRecommendationProduct: item
          ? { name: item.name, image: item.image }
          : undefined,
      });
    },
    [
      profileProductTree,
      allCampaigns,
      profileCampaigns,
      onOpenCpcCampaign,
      openWidgets2Promote,
      onNavigateToCreation,
    ],
  );

  const openWidgets2SetupRecommendations = useCallback(
    (item: Widgets2Card['item']) => {
      if (item) {
        openWidgets2Promote(item);
        return;
      }
      onNavigateToCreation();
    },
    [openWidgets2Promote, onNavigateToCreation],
  );

  useEffect(() => {
    if (!insightFilter) return;
    setListTab('campaigns');
    setCurrentPage(1);
  }, [insightFilter]);


  // Раскрытые строки товаров (вкладка Товары)
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());
  const [collapsedConceptMulticardGroupIds, setCollapsedConceptMulticardGroupIds] = useState<
    Set<string>
  >(() => new Set());
  const [conceptMulticardGroupTitleById, setConceptMulticardGroupTitleById] = useState<
    Record<string, string>
  >({});
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productStatSort, setProductStatSort] = useState<{
    label: ConceptNotPromotedProductSortKey;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [productBulkNotice, setProductBulkNotice] = useState<string | null>(null);

  const openBulkDailyLimitForSelection = useCallback(() => {
    const targets = allCampaigns.filter((c) => selectedCampaigns.includes(c.id));
    const cpcCount = targets.filter((c) => c.type === 'CPC').length;
    if (targets.length === 0) return;
    if (cpcCount === 0) {
      setProductBulkNotice('Дневной лимит доступен только для CPC-кампаний');
      return;
    }
    setBulkDailyLimitTargets(targets);
    setIsBulkDailyLimitModalOpen(true);
  }, [allCampaigns, selectedCampaigns]);

  useEffect(() => {
    if (onRegisterBulkDailyLimitOpener) {
      onRegisterBulkDailyLimitOpener(openBulkDailyLimitForSelection);
    }
  }, [onRegisterBulkDailyLimitOpener, openBulkDailyLimitForSelection]);

  const handleBulkDailyLimitApply = useCallback(
    ({ limit, eligibleIds }: { limit: number | null; eligibleIds: Set<string> }) => {
      const cpmSkipped = bulkDailyLimitTargets.filter(
        (c) => selectedCampaigns.includes(c.id) && c.type === 'CPM',
      ).length;

      setAllCampaigns((prev) =>
        prev.map((c) => {
          if (!eligibleIds.has(c.id)) return c;
          if (limit === null) {
            return { ...c, dailyLimit: null, scheduledDailyLimit: null };
          }
          return { ...c, dailyLimit: limit, scheduledDailyLimit: null };
        }),
      );

      eligibleIds.forEach((id) => {
        const camp = bulkDailyLimitTargets.find((c) => c.id === id);
        if (!camp) return;
        handleUpdateCampaignData(camp.campaignId, {
          dailyLimit: limit,
          scheduledDailyLimit: null,
        });
      });

      const applied = eligibleIds.size;
      let message: string;
      if (limit === null) {
        message = `Дневной лимит отключён для ${applied} ${getPlural(applied, 'кампании', 'кампаний', 'кампаний')}`;
      } else {
        message = `Дневной лимит ${formatForDisplay(limit)} ₽ для ${applied} ${getPlural(applied, 'CPC-кампании', 'CPC-кампаний', 'CPC-кампаний')}`;
      }
      if (cpmSkipped > 0) {
        message += `. ${cpmSkipped} CPM ${getPlural(cpmSkipped, 'пропущена', 'пропущены', 'пропущено')}`;
      }
      setProductBulkNotice(message);
      setIsBulkDailyLimitModalOpen(false);
      setBulkDailyLimitTargets([]);
    },
    [bulkDailyLimitTargets, selectedCampaigns, handleUpdateCampaignData],
  );

  const [productBidBulkModalKind, setProductBidBulkModalKind] =
    useState<ProductBidBulkModalKind | null>(null);
  // Дропдаун тегов: открыт для productId
  const [openTagProductId, setOpenTagProductId] = useState<string | null>(null);
  const tagDropdownAnchorRef = useRef<HTMLElement | null>(null);
  // Локальные теги и цвета тегов по товарам (редактирование в дропдауне)
  const [productTagsOverride, setProductTagsOverride] = useState<Record<string, string[]>>({});
  const [tagColorByTagName, setTagColorByTagName] = useState<Record<string, number>>(() => INITIAL_TAG_COLORS);
  // Глобально удалённые ярлыки (например, через «Удалить» в дропдауне) — скрываем их везде
  const [deletedTags, setDeletedTags] = useState<string[]>([]);
  // Включение/выключение кампании на вкладке «Товары» (id кампании в дереве → 'active' | 'paused')
  const [productCampaignStatusOverride, setProductCampaignStatusOverride] = useState<Record<string, 'active' | 'paused'>>({});
  const [productCampaignBidOverride, setProductCampaignBidOverride] = useState<
    Record<string, ProductCampaignBidOverride>
  >({});

  useEffect(() => {
    if (listTab !== 'products') setIsProductsColumnSettingsOpen(false);
  }, [listTab]);

  useEffect(() => {
    if (conceptCompactProductsTable) setExpandedProductIds(new Set());
  }, [conceptCompactProductsTable]);

  useEffect(() => {
    if (!conceptNotPromotedProductsList) {
      setProductStatSort(null);
    }
  }, [conceptNotPromotedProductsList]);

  const isFirstProfileMount = useRef(true);
  useEffect(() => {
    if (isFirstProfileMount.current) {
      isFirstProfileMount.current = false;
      return;
    }
    setAllCampaigns(
      applyCampaignListPatches(buildAllCampaignsForProfile(profileId), campaignListPatches),
    );
    setCurrentPage(1);
    onSelectionChange([]);
    setSelectedProductIds([]);
    setProductsPickTab(
      location.pathname === PRODUCT_PROMOTION_CONCEPT_PATH ? 'all_products' : 'promoted',
    );
    setProductsSecondaryPickTab('all');
    setExpandedProductIds(new Set());
    setProductTagsOverride({});
    setProductCampaignStatusOverride({});
    setSearchQuery('');
    setWidgets2Closed(new Set());
  }, [profileId, onSelectionChange, campaignListPatches]);

  const getProductTags = useCallback((product: { id: string; tags: string[] }) => {
    const base = productTagsOverride[product.id] ?? product.tags;
    return base
      .map(normalizeTagName)
      .filter(t => t && !deletedTags.includes(t));
  }, [productTagsOverride, deletedTags]);

  const productInitialTags = useMemo(
    () => Object.fromEntries(profileProductTree.map((p) => [p.id, p.tags])),
    [profileProductTree],
  );

  /** Ярлыки кампании: с учётом переопределений; если кампания на несколько товаров (productIds) — объединение ярлыков */
  const getCampaignProductTags = useCallback((c: DisplayCampaign): string[] => {
    if (c.productIds?.length) {
      const merged = c.productIds.flatMap(pid =>
        (productTagsOverride[pid] ?? productInitialTags[pid] ?? [])
          .map(normalizeTagName)
          .filter(t => t && !deletedTags.includes(t))
      );
      return [...new Set(merged)];
    }
    if (c.productId && productTagsOverride[c.productId] !== undefined)
      return (productTagsOverride[c.productId] ?? [])
        .map(normalizeTagName)
        .filter(t => t && !deletedTags.includes(t));
    return (c.productTags ?? [])
      .map(normalizeTagName)
      .filter(t => t && !deletedTags.includes(t));
  }, [productTagsOverride, productInitialTags, deletedTags]);

  // Сколько раз каждый ярлык используется в кампаниях (с учётом переопределений ярлыков по товарам)
  const tagUsageCountByName = useMemo(() => {
    const usage: Record<string, number> = {};
    for (const camp of profileCampaigns) {
      const tags = getCampaignProductTags(camp);
      for (const t of tags) {
        if (!t) continue;
        usage[t] = (usage[t] ?? 0) + 1;
      }
    }
    return usage;
  }, [profileCampaigns, getCampaignProductTags]);

  /** Ярлыки, уже добавленные на страницу (для фильтра «По ярлыкам») */
  const productFilterCategoryOptions = useMemo(() => {
    const set = new Set<string>(PRODUCTS_FILTER_DEMO_CATEGORIES);
    profileProductTree.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    CATEGORIES.forEach((c) => set.add(c));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'));
  }, [profileProductTree]);

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    allCampaigns.forEach(c =>
      getCampaignProductTags(c).forEach(tag => {
        const normalized = normalizeTagName(tag);
        if (!normalized) return;
        set.add(normalized);
      })
    );
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [allCampaigns, getCampaignProductTags]);

  const toggleProductExpanded = (id: string) => {
    setExpandedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Initialize temporary states when dropdown opens
  useEffect(() => {
    if (isFilterDropdownOpen) {
      setTempFilterCategory(filterCategory);
      setTempFilterStatus(filterStatus);
      setTempFilterAutorefill(filterAutorefill);
      setTempFilterPayment(filterPayment);
      setTempFilterSort(filterSort);
      setTempFilterByCategory(filterByCategory);
      setTempTags(filterTags);
      setTempTagsSearch('');
      setTempTagsCategory(filterTagsCategory);
      setTempFilterPromoTagsOnly(filterPromoTagsOnly);
      setTempProductsFilterSection(productsFilterSection);
      setTempFilterProductCategories(filterProductCategories);
      setTempFilterConflictOnly(filterConflictOnly);
      setTempFilterCampaignTypes(filterCampaignTypes);
    }
  }, [
    isFilterDropdownOpen,
    filterCategory,
    filterStatus,
    filterAutorefill,
    filterPayment,
    filterSort,
    filterByCategory,
    filterTags,
    filterTagsCategory,
    filterPromoTagsOnly,
    productsFilterSection,
    filterProductCategories,
    filterConflictOnly,
    filterCampaignTypes,
  ]);

  const handleApplyFilters = () => {
    if (listTab === 'products') {
      setProductsFilterSection(tempProductsFilterSection);
      setFilterProductCategories(tempFilterProductCategories);
      setFilterConflictOnly(tempFilterConflictOnly);
      setFilterCampaignTypes(tempFilterCampaignTypes);
    } else {
      setFilterCategory(tempFilterCategory);
      setFilterByCategory(tempFilterByCategory);
      setFilterTags(tempTags);
      setFilterTagsCategory(tempTagsCategory);
      setFilterPromoTagsOnly(tempFilterPromoTagsOnly);
    }
    setFilterStatus(tempFilterStatus);
    setFilterAutorefill(tempFilterAutorefill);
    setFilterPayment(tempFilterPayment);
    setFilterSort(tempFilterSort);
    setIsFilterDropdownOpen(false);
  };

  const handleCancelFilters = () => {
    setTempFilterCategory(filterCategory);
    setTempFilterStatus(filterStatus);
    setTempFilterAutorefill(filterAutorefill);
    setTempFilterPayment(filterPayment);
    setTempFilterSort(filterSort);
    setTempFilterByCategory(filterByCategory);
    setTempTags(filterTags);
    setTempTagsSearch('');
    setTempTagsCategory(filterTagsCategory);
    setTempFilterPromoTagsOnly(filterPromoTagsOnly);
    setTempProductsFilterSection(productsFilterSection);
    setTempFilterProductCategories(filterProductCategories);
    setTempFilterConflictOnly(filterConflictOnly);
    setTempFilterCampaignTypes(filterCampaignTypes);
    setIsFilterDropdownOpen(false);
  };

  // Filter and sort campaigns
  const campaigns = React.useMemo(() => {
    let filtered = [...allCampaigns];

    // Filter by status
    if (filterStatus !== 'all-except-archived') {
      if (filterStatus === 'ready-to-launch') {
        filtered = filtered.filter(c => c.status === 'draft');
      } else if (filterStatus === 'active') {
        filtered = filtered.filter(c => c.status === 'active');
      } else if (filterStatus === 'paused') {
        filtered = filtered.filter(c => c.status === 'paused');
      } else if (filterStatus === 'archived') {
        filtered = filtered.filter(c => c.status === 'error');
      }
    } else {
      filtered = filtered.filter(c => c.status !== 'error');
    }

    // Filter by autorefill
    if (filterAutorefill !== 'all') {
      if (filterAutorefill === 'enabled') {
        filtered = filtered.filter(c => c.autoRefill === true);
      } else if (filterAutorefill === 'disabled') {
        filtered = filtered.filter(c => c.autoRefill === false);
      }
    }

    // Filter by payment model
    if (filterPayment !== 'all') {
      filtered = filtered.filter(c => c.type === filterPayment);
    }

    // Filter by tags (ярлыки товара с учётом переопределений)
    if (filterTags.length > 0) {
      filtered = filtered.filter(c => {
        const tags = getCampaignProductTags(c);
        if (!tags.length) return false;
        return filterTags.some(tag => tags.includes(tag));
      });
    }

    // Дополнительный фильтр: показывать только теги продвижения (кампании, у которых есть ярлыки)
    if (filterPromoTagsOnly) {
      filtered = filtered.filter(c => getCampaignProductTags(c).length > 0);
    }

    // Filter by category (вкладка «Категория» в фильтре)
    if (filterByCategory && filterByCategory !== '') {
      filtered = filtered.filter(c => c.category === filterByCategory);
    }

    // Filter by failed IDs (from edit result block)
    if (failedFilterIds && failedFilterIds.length > 0) {
      const idSet = new Set(failedFilterIds);
      filtered = filtered.filter(c => idSet.has(c.campaignId));
    }

    if (insightFilter) {
      filtered = filtered.filter((c) => campaignMatchesInsightFilter(c, insightFilter.kind));
    }

    // Sort campaigns
    if (filterSort === 'by-name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filterSort === 'by-category') {
      filtered.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
    } else {
      // По умолчанию (by-date): первые две позиции — кейсы «лимит работает» (id 1) и «лимит исчерпан» (id 2)
      const case1 = filtered.find(c => c.id === '1');
      const case2 = filtered.find(c => c.id === '2');
      const rest = filtered.filter(c => c.id !== '1' && c.id !== '2');
      filtered = [...(case1 ? [case1] : []), ...(case2 ? [case2] : []), ...rest];
    }

    // Поиск на вкладке «Кампании»: только по названию кампании и ID кампании
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((c) => (c.name && c.name.toLowerCase().includes(q)) || String(c.campaignId).toLowerCase().includes(q));
    }

    const prebuiltTop = allCampaigns.filter((c) => c.id === PREBUILT_SINGLE_PRODUCT_CPC_CAMPAIGN_ID);
    if (prebuiltTop.length > 0 && !insightFilter) {
      const prebuiltIds = new Set(prebuiltTop.map((c) => c.id));
      filtered = [...prebuiltTop, ...filtered.filter((c) => !prebuiltIds.has(c.id))];
    }

    return filtered;
  }, [
    allCampaigns,
    filterStatus,
    filterAutorefill,
    filterPayment,
    filterSort,
    filterByCategory,
    filterTags,
    filterTagsCategory,
    filterPromoTagsOnly,
    failedFilterIds,
    productTagsOverride,
    searchQuery,
    insightFilter,
  ]);

  /** Товары, отфильтрованные по тем же правилам, что и кампании (на вкладке «Товары» показываем товар, если есть хотя бы одна подходящая кампания) */
  const filteredProducts = useMemo(() => {
    return profileProductTree.filter((product) => {
      if (product.campaigns.length === 0) {
        const noCampaignFilters =
          filterStatus === 'all-except-archived' &&
          filterAutorefill === 'all' &&
          filterPayment === 'all' &&
          filterTags.length === 0 &&
          filterCampaignTypes.length === 0 &&
          !filterConflictOnly &&
          !insightFilter;
        const categoryOk =
          listTab === 'products'
            ? filterProductCategories.length === 0 ||
              filterProductCategories.includes(product.category)
            : !filterByCategory || product.category === filterByCategory;
        if (noCampaignFilters && categoryOk) return true;
        return false;
      }
      const productTagsResolved = getProductTags(product);
      const hasMatchingCampaign = product.campaigns.some((camp) => {
        const effectiveStatus = (camp.status === 'draft' || camp.status === 'error' ? camp.status : (productCampaignStatusOverride[camp.id] ?? camp.status)) as 'active' | 'paused' | 'draft' | 'error';
        if (filterStatus !== 'all-except-archived') {
          if (filterStatus === 'ready-to-launch' && effectiveStatus !== 'draft') return false;
          if (filterStatus === 'active' && effectiveStatus !== 'active') return false;
          if (filterStatus === 'paused' && effectiveStatus !== 'paused') return false;
          if (filterStatus === 'archived' && effectiveStatus !== 'error') return false;
        } else if (effectiveStatus === 'error') return false;
        if (filterAutorefill !== 'all' && (filterAutorefill === 'enabled') !== camp.autoRefill) return false;
        if (filterPayment !== 'all' && camp.type !== filterPayment) return false;
        if (filterTags.length > 0 && !filterTags.some((t) => productTagsResolved.includes(t))) return false;
        if (insightFilter) {
          return campaignMatchesInsightFilter(
            {
              status: effectiveStatus,
              remainingBudget: camp.remainingBudget,
              dailyLimitExhausted: camp.dailyLimitExhausted,
              tags: [],
            },
            insightFilter.kind,
          );
        }
        return true;
      });
      if (!hasMatchingCampaign) return false;
      if (listTab === 'products' && filterProductCategories.length > 0) {
        if (!filterProductCategories.includes(product.category)) return false;
      } else if (filterByCategory && filterByCategory !== '' && product.category !== filterByCategory) {
        return false;
      }
      if (filterConflictOnly && !productHasCampaignConflict(product)) return false;
      if (filterCampaignTypes.length > 0) {
        if (product.campaigns.length === 0) return false;
        const matchesType = product.campaigns.some((camp) => {
          if (filterCampaignTypes.includes('CPC') && camp.type === 'CPC') return true;
          if (
            filterCampaignTypes.includes('CPM_UNIFIED') &&
            camp.type === 'CPM' &&
            /един/i.test(camp.typeDetails)
          ) {
            return true;
          }
          if (
            filterCampaignTypes.includes('CPM_MANUAL') &&
            camp.type === 'CPM' &&
            /ручн/i.test(camp.typeDetails)
          ) {
            return true;
          }
          return false;
        });
        if (!matchesType) return false;
      }
      if (filterPromoTagsOnly && productTagsResolved.length === 0) return false;
      return true;
    });
  }, [
    profileProductTree,
    filterStatus,
    filterAutorefill,
    filterPayment,
    filterTags,
    filterByCategory,
    filterProductCategories,
    filterConflictOnly,
    filterCampaignTypes,
    filterPromoTagsOnly,
    productCampaignStatusOverride,
    getProductTags,
    insightFilter,
    listTab,
  ]);

  // Поиск по товарам: по названию товара, артикулу, артикулу WB, артикулу продавца, названию кампании, ID кампании
  const filteredProductsBySearch = useMemo(() => {
    if (!searchQuery.trim()) return filteredProducts;
    const q = searchQuery.trim();
    return filteredProducts.filter((product) => productMatchesConceptSearchQuery(product, q));
  }, [filteredProducts, searchQuery]);

  const productsForTableWithoutSearch = useMemo(() => {
    if (isProductPromotionConceptPage && listTab === 'products') {
      return filteredProducts.filter((product) => {
        if (
          !productMatchesProductsPickTab(
            product,
            productsPickTab,
            productCampaignStatusOverride,
            'concept',
          )
        ) {
          return false;
        }
        if (productsPickTab === 'all_products') {
          return true;
        }
        return productMatchesSecondaryPickTab(product, productsSecondaryPickTab);
      });
    }
    return filteredProducts.filter((product) =>
      productMatchesProductsPickTab(product, productsPickTab, productCampaignStatusOverride),
    );
  }, [
    filteredProducts,
    productsPickTab,
    productsSecondaryPickTab,
    productCampaignStatusOverride,
    isProductPromotionConceptPage,
    listTab,
  ]);

  const productsPickTabCounts = useMemo(() => {
    const counts = {} as Record<ProductsPickTab, number>;
    for (const tab of PRODUCTS_PICK_TABS) {
      counts[tab.id] = filteredProductsBySearch.filter((product) =>
        productMatchesProductsPickTab(product, tab.id, productCampaignStatusOverride),
      ).length;
    }
    for (const tab of CONCEPT_PRODUCTS_PICK_TABS) {
      counts[tab.id] = filteredProductsBySearch.filter((product) =>
        productMatchesProductsPickTab(
          product,
          tab.id,
          productCampaignStatusOverride,
          'concept',
        ),
      ).length;
    }
    return counts;
  }, [filteredProductsBySearch, productCampaignStatusOverride]);

  const productsSecondaryPickTabCounts = useMemo(() => {
    const scopedProducts = filteredProductsBySearch.filter((product) =>
      productMatchesProductsPickTab(
        product,
        productsPickTab,
        productCampaignStatusOverride,
        isProductPromotionConceptPage ? 'concept' : 'default',
      ),
    );
    const counts = {} as Record<ProductsSecondaryPickTab, number>;
    for (const tab of PRODUCTS_PICK_SECONDARY_TABS) {
      counts[tab.id] = scopedProducts.filter((product) =>
        productMatchesSecondaryPickTab(product, tab.id),
      ).length;
    }
    return counts;
  }, [filteredProductsBySearch, productsPickTab, productCampaignStatusOverride, isProductPromotionConceptPage]);

  const productsForTable = useMemo(() => {
    if (isProductPromotionConceptPage && listTab === 'products') {
      return filteredProductsBySearch.filter((product) => {
        if (
          !productMatchesProductsPickTab(
            product,
            productsPickTab,
            productCampaignStatusOverride,
            'concept',
          )
        ) {
          return false;
        }
        if (productsPickTab === 'all_products') {
          return true;
        }
        return productMatchesSecondaryPickTab(product, productsSecondaryPickTab);
      });
    }
    return filteredProductsBySearch.filter((product) =>
      productMatchesProductsPickTab(product, productsPickTab, productCampaignStatusOverride),
    );
  }, [
    filteredProductsBySearch,
    productsPickTab,
    productsSecondaryPickTab,
    productCampaignStatusOverride,
    isProductPromotionConceptPage,
    listTab,
  ]);

  useEffect(() => {
    if (productsPickTab !== 'promoted' || listTab !== 'products') return;
    setExpandedProductIds((prev) => {
      const firstThreeIds = productsForTable.slice(0, 3).map((p) => p.id);
      if (firstThreeIds.length === 0) return prev;
      const next = new Set(prev);
      let changed = false;
      for (const id of firstThreeIds) {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [productsPickTab, listTab, productsForTable]);

  const conceptMulticardMembershipIndex = useMemo(
    () => buildConceptMulticardMembershipIndex(profileProductTree),
    [profileProductTree],
  );

  const conceptMulticardProductsForTable = useMemo(() => {
    if (!conceptAllProductsPickTab || !searchQuery.trim()) {
      return productsForTable;
    }
    return expandConceptMulticardProductsForSearch(
      productsForTable,
      productsForTableWithoutSearch,
      conceptMulticardMembershipIndex,
    );
  }, [
    conceptAllProductsPickTab,
    searchQuery,
    productsForTable,
    productsForTableWithoutSearch,
    conceptMulticardMembershipIndex,
  ]);

  const conceptMulticardSearchMatchedProductIds = useMemo(() => {
    if (!conceptAllProductsPickTab || !searchQuery.trim()) {
      return new Set<string>();
    }
    return new Set(productsForTable.map((p) => p.id));
  }, [conceptAllProductsPickTab, searchQuery, productsForTable]);

  const conceptMulticardSearchForceExpandedGroupIds = useMemo(() => {
    if (!conceptAllProductsPickTab || !searchQuery.trim()) {
      return new Set<string>();
    }
    const ids = new Set<string>();
    for (const product of productsForTable) {
      const groupId = demoConceptMulticardGroupId(product);
      const members = conceptMulticardMembershipIndex.get(groupId);
      if (members && members.length > 1) {
        ids.add(groupId);
      }
    }
    return ids;
  }, [
    conceptAllProductsPickTab,
    searchQuery,
    productsForTable,
    conceptMulticardMembershipIndex,
  ]);

  const activeProductsPickPromotionCtaTab = useMemo((): ProductsPickCtaTab | null => {
    if (listTab !== 'products') return null;
    if (isProductPromotionConceptPage) {
      return productsPickPromotionCtaTab(productsSecondaryPickTab);
    }
    return productsPickPromotionCtaTab(productsPickTab);
  }, [
    listTab,
    isProductPromotionConceptPage,
    productsSecondaryPickTab,
    productsPickTab,
  ]);

  const sortedProductsForTable = useMemo(() => {
    const organicStatsForProduct = (product: ProductRow) => conceptNotPromotedProductsList;
    let list = conceptMulticardProductsForTable;

    if (conceptNotPromotedProductsList && !productStatSort) {
      list = [...list].sort((a, b) => {
        const diff = productRecencySortKey(b) - productRecencySortKey(a);
        if (diff !== 0) return diff;
        return a.id.localeCompare(b.id);
      });
    }

    if (!productStatSort) return list;
    const { label, direction } = productStatSort;
    const sign = direction === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const valA = isConceptNotPromotedAverageBidSortKey(label)
        ? productAverageBidSortNumericValue(a, label)
        : productStatSortNumericValue(a, label, organicStatsForProduct(a));
      const valB = isConceptNotPromotedAverageBidSortKey(label)
        ? productAverageBidSortNumericValue(b, label)
        : productStatSortNumericValue(b, label, organicStatsForProduct(b));
      const diff = sign * (valA - valB);
      if (diff !== 0) return diff;
      return a.id.localeCompare(b.id);
    });
  }, [
    conceptMulticardProductsForTable,
    productStatSort,
    conceptNotPromotedProductsList,
    productCampaignStatusOverride,
  ]);

  const conceptAllTabTableRows = useMemo((): ConceptAllTabTableRow[] => {
    if (!conceptAllProductsPickTab) {
      return sortedProductsForTable.map((product) => ({
        product,
        multicardRail: null,
        multicardGroupStartsSection: false,
        multicardGroupMembers: null,
      }));
    }
    const buildRows = (demoIds: Set<string>) =>
      buildConceptAllTabGroupedTableRows(
        sortedProductsForTable,
        conceptMulticardMembershipIndex,
        productCampaignStatusOverride,
        demoIds,
      );
    let rows = buildRows(new Set());
    const demoIds = buildConceptMulticardTabDemoNotPromotedProductIds(rows);
    if (demoIds.size > 0) {
      rows = buildRows(demoIds);
    }
    return rows;
  }, [
    sortedProductsForTable,
    conceptAllProductsPickTab,
    conceptMulticardMembershipIndex,
    productCampaignStatusOverride,
  ]);

  const conceptMulticardTabDemoNotPromotedProductIds = useMemo(() => {
    if (!conceptAllProductsPickTab) return new Set<string>();
    return buildConceptMulticardTabDemoNotPromotedProductIds(conceptAllTabTableRows);
  }, [conceptAllProductsPickTab, conceptAllTabTableRows]);

  const handleProductStatColumnSort = (label: ConceptNotPromotedProductSortKey) => {
    setProductStatSort((prev) => {
      if (prev?.label === label) {
        return { label, direction: prev.direction === 'desc' ? 'asc' : 'desc' };
      }
      return { label, direction: 'desc' };
    });
  };

  const visibleProductIds = useMemo(
    () => sortedProductsForTable.map((p) => p.id),
    [sortedProductsForTable],
  );

  const isAllProductsSelected =
    visibleProductIds.length > 0 &&
    visibleProductIds.every((id) => selectedProductIds.includes(id));

  const handleSelectAllProducts = (isChecked: boolean) => {
    if (isChecked) {
      setSelectedProductIds((prev) => [...new Set([...prev, ...visibleProductIds])]);
    } else {
      setSelectedProductIds((prev) => prev.filter((id) => !visibleProductIds.includes(id)));
    }
  };

  const handleSelectSingleProduct = (id: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedProductIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    } else {
      setSelectedProductIds((prev) => prev.filter((pid) => pid !== id));
    }
  };

  const handleSelectMulticardGroup = useCallback((memberIds: string[], isChecked: boolean) => {
    if (isChecked) {
      setSelectedProductIds((prev) => [...new Set([...prev, ...memberIds])]);
    } else {
      setSelectedProductIds((prev) => prev.filter((id) => !memberIds.includes(id)));
    }
  }, []);

  const toggleConceptMulticardGroupExpanded = useCallback((groupId: string) => {
    setCollapsedConceptMulticardGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  const handleConceptMulticardGroupTitleChange = useCallback((groupId: string, title: string | null) => {
    setConceptMulticardGroupTitleById((prev) => {
      const next = { ...prev };
      if (!title) {
        delete next[groupId];
      } else {
        next[groupId] = title;
      }
      return next;
    });
  }, []);

  const handlePromoteNotPromotedProduct = useCallback(
    (product: ProductRow) => {
      beginRepeatLaunchFlow(buildPromoteNotPromotedProductPreset(product));
    },
    [beginRepeatLaunchFlow],
  );

  const handleBulkCreateCampaignFromProducts = useCallback(() => {
    const selected = sortedProductsForTable.filter((p) => selectedProductIds.includes(p.id));
    if (selected.length === 0) return;

    const toPromote = conceptCompactProductsTable
        ? selected.filter((p) =>
            productConceptIsNotPromoted(p, productCampaignStatusOverride),
          )
        : [];
    if (toPromote.length > 0) {
      const seeds = toPromote.map(productRowToSingleCampaignSeed);
      const first = seeds[0]!;
      beginRepeatLaunchFlow({
        product: first,
        products: seeds.length > 1 ? seeds : undefined,
        campaignName:
          seeds.length === 1
            ? `${first.productName} CPC ${new Date().toLocaleDateString('ru-RU')}`
            : undefined,
      });
      setSelectedProductIds([]);
      return;
    }
    const items = selected.map(productRowToCreationItem);
    if (onNavigateToCreationWithProducts) onNavigateToCreationWithProducts(items);
    else onNavigateToCreation();
    setSelectedProductIds([]);
  }, [
    sortedProductsForTable,
    selectedProductIds,
    conceptCompactProductsTable,
    productCampaignStatusOverride,
    beginRepeatLaunchFlow,
    onNavigateToCreationWithProducts,
    onNavigateToCreation,
  ]);

  const selectedProductsForBulk = useMemo(
    () => productsForTable.filter((p) => selectedProductIds.includes(p.id)),
    [productsForTable, selectedProductIds],
  );

  const selectedV3BonusProducts = useMemo(() => {
    if (productsPickTab !== 'not_promoted_v3' || selectedProductIds.length === 0) return [];
    const bonusIds = new Set(sortedProductsForTable.slice(0, 3).map((p) => p.id));
    return selectedProductsForBulk.filter((p) => bonusIds.has(p.id));
  }, [productsPickTab, selectedProductIds.length, sortedProductsForTable, selectedProductsForBulk]);

  const selectedProductsForBidBulk = useMemo(() => {
    if (!isProductPromotionConceptPage) {
      return selectedProductsForBulk;
    }
    return selectedProductsForBulk.filter((p) =>
      productEligibleForProductBidBulkActions(
        p,
        productCampaignStatusOverride,
        conceptAllProductsPickTab,
        conceptMulticardTabDemoNotPromotedProductIds,
      ),
    );
  }, [
    selectedProductsForBulk,
    isProductPromotionConceptPage,
    productCampaignStatusOverride,
    conceptAllProductsPickTab,
    conceptMulticardTabDemoNotPromotedProductIds,
  ]);

  const selectedProductsCampaignCount = useMemo(() => {
    return selectedProductsForBidBulk.reduce((sum, p) => sum + p.campaigns.length, 0);
  }, [selectedProductsForBidBulk]);

  const selectedProductCategories = useMemo(() => {
    const set = new Set(
      selectedProductsForBidBulk.map((p) => p.category).filter((c): c is string => Boolean(c)),
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'));
  }, [selectedProductsForBidBulk]);

  useEffect(() => {
    if (selectedProductIds.length === 0) {
      setProductBidBulkModalKind(null);
    }
  }, [selectedProductIds.length]);

  const openProductBidBulkModal = (kind: ProductBidBulkModalKind) => {
    if (selectedProductsCampaignCount === 0) {
      setProductBulkNotice(
        isProductPromotionConceptPage
          ? 'Изменение ставки доступно только для продвигаемых товаров'
          : 'У выбранных товаров нет кампаний для изменения ставки',
      );
      return;
    }
    setProductBidBulkModalKind(kind);
  };

  const handleProductBidBulkApply = () => {
    if (!productBidBulkModalKind) return;
    const title = PRODUCT_BID_MODAL_TITLES[productBidBulkModalKind];
    setProductBulkNotice(
      `${title}: обновлено ${selectedProductsCampaignCount} ${getPlural(
        selectedProductsCampaignCount,
        'кампания',
        'кампании',
        'кампаний',
      )}`,
    );
  };

  const paginatedCampaigns = campaigns.slice(
    (currentPage - 1) * CAMPAIGNS_PAGE_SIZE,
    currentPage * CAMPAIGNS_PAGE_SIZE
  );

  const openListCpcCampaign = useCallback(
    (c: DisplayCampaign) => {
      const payload = {
        campaignId: c.campaignId,
        name: c.name,
        paymentModel: c.type,
        remainingBudget: c.remainingBudget,
        dailyLimit: c.dailyLimit ?? null,
        scheduledDailyLimit: c.scheduledDailyLimit ?? null,
        dailyLimitExhausted: c.dailyLimitExhausted,
        campaignStatus:
          c.status === 'active' || c.status === 'paused'
            ? c.status
            : ('active' as const),
      };
      if (c.isBonusCampaign) {
        onOpenCpcCampaign({
          ...payload,
          paymentModel: 'CPC',
          fromReadyToRepeat: true,
          repeatLaunchPreset: buildRepeatPresetForDisplayCampaign(c, profileId),
        });
        return;
      }
      onOpenCpcCampaign(payload);
    },
    [onOpenCpcCampaign, profileId],
  );

  const runListCampaignAutomation = useCallback(
    (
      row: { id: string; campaignId: number; type: 'CPC' | 'CPM' },
      action: CampaignListAutomationAction,
    ) => {
      if (row.type !== 'CPC' && row.type !== 'CPM') return;
      if (action === 'flexibleLimit' && row.type !== 'CPC') return;
      const display =
        allCampaigns.find((x) => x.id === row.id) ??
        allCampaigns.find((x) => x.campaignId === row.campaignId);
      if (!display) return;
      setListAutomationModal({
        kind: action,
        target: {
          campaignId: display.campaignId,
          remainingBudget: display.remainingBudget,
          dailyLimit: display.dailyLimit ?? null,
          maxCpcBidRub: listCampaignAutomationReferenceBidRub(display),
        },
      });
    },
    [allCampaigns],
  );

  const openProductNestedCampaign = useCallback(
    (camp: ProductCampaign) => {
      const display = allCampaigns.find((c) => c.campaignId === camp.campaignId);
      if (display) {
        openListCpcCampaign(display);
        return;
      }
      onOpenCpcCampaign({
        campaignId: camp.campaignId,
        name: camp.name,
        paymentModel: camp.type,
        remainingBudget: camp.remainingBudget,
        dailyLimit: camp.dailyLimit ?? null,
        scheduledDailyLimit: null,
        dailyLimitExhausted: camp.dailyLimitExhausted,
        campaignStatus:
          camp.status === 'active' || camp.status === 'paused' ? camp.status : 'active',
      });
    },
    [allCampaigns, openListCpcCampaign, onOpenCpcCampaign],
  );

  const resolveVariant4BonusRefillCampaigns = useCallback((): DisplayCampaign[] => {
    const byName = allCampaigns.filter((c) =>
      LIST_HEADER_V4_BONUS_REFILL_CAMPAIGN_NAMES.some(
        (label) => c.name === label || c.name.includes(label),
      ),
    );
    const unique = [...new Map(byName.map((c) => [c.id, c])).values()];
    if (unique.length > 0) {
      return unique.slice(0, LIST_HEADER_V4_BONUS_REFILL_CAMPAIGN_COUNT);
    }
    return allCampaigns
      .filter((c) => c.type === 'CPC')
      .slice(0, LIST_HEADER_V4_BONUS_REFILL_CAMPAIGN_COUNT);
  }, [allCampaigns]);

  const openVariant4MassBudgetRefill = useCallback(() => {
    const targets = resolveVariant4BonusRefillCampaigns();
    setMassBudgetRefillTargetIds(targets.map((c) => c.id));
    setIsMassBudgetRefillModalOpen(true);
  }, [resolveVariant4BonusRefillCampaigns]);

  const openBonusNotificationCampaign = useCallback(
    (item: BonusCampaignNotification) => {
      const cpcPool = buildAllCampaignsForProfile(profileId).filter((c) => c.type === 'CPC');
      const bonusCampaign = cpcPool.find((c) => c.isBonusCampaign) ?? cpcPool[0];
      if (!bonusCampaign) return;

      onOpenCpcCampaign({
        campaignId: bonusCampaign.campaignId,
        name: bonusCampaign.name,
        remainingBudget: bonusCampaign.remainingBudget,
        dailyLimit: bonusCampaign.dailyLimit ?? null,
        scheduledDailyLimit: bonusCampaign.scheduledDailyLimit ?? null,
        dailyLimitExhausted: bonusCampaign.dailyLimitExhausted,
        fromReadyToRepeat: true,
        repeatLaunchPreset: item.launchPreset,
      });
    },
    [onOpenCpcCampaign, profileId],
  );

  const resolveVariant2BonusCampaignFromNotification = useCallback(
    (item: BonusCampaignNotification): DisplayCampaign | undefined => {
      const label = item.campaignName?.trim();
      if (!label) return undefined;

      const direct = allCampaigns.find((c) => c.name === label || c.name.includes(label));
      if (direct) return direct;

      const refillPool = resolveVariant4BonusRefillCampaigns();
      const nameIndex = LIST_HEADER_V4_BONUS_REFILL_CAMPAIGN_NAMES.findIndex(
        (n) => n === label || label.includes(n) || n.includes(label),
      );
      if (nameIndex >= 0 && refillPool[nameIndex]) return refillPool[nameIndex];

      return refillPool[0];
    },
    [allCampaigns, resolveVariant4BonusRefillCampaigns],
  );

  /** Заголовок на вкладке «Бонусы сработали» — экран бонусной кампании (ready to repeat), не обычный CPC. */
  const openVariant2BonusCampaign = useCallback(
    (item: BonusCampaignNotification) => {
      openBonusNotificationCampaign(item);
    },
    [openBonusNotificationCampaign],
  );

  const openVariant2BonusBudgetRefill = useCallback(
    (item: BonusCampaignNotification) => {
      const match = resolveVariant2BonusCampaignFromNotification(item);
      if (!match) return;
      setSelectedCampaignForRefill(match);
      setIsBudgetRefillModalOpen(true);
    },
    [resolveVariant2BonusCampaignFromNotification],
  );

  const openVariant2PromoteItem = useCallback(
    (item: BonusCampaignNotification) => {
      beginRepeatLaunchFlow(item.launchPreset);
    },
    [beginRepeatLaunchFlow],
  );

  const paginatedIds = paginatedCampaigns.map(c => c.id);
  const isAllOnPageSelected = paginatedIds.length > 0 && paginatedIds.every(id => selectedCampaigns.includes(id));

  const handleSelectAll = (isChecked: boolean) => {
      if(isChecked) {
          onSelectionChange([...new Set([...selectedCampaigns, ...paginatedIds])]);
      } else {
          onSelectionChange(selectedCampaigns.filter(id => !paginatedIds.includes(id)));
      }
  }
  
  const handleSelectSingle = (id: string, isChecked: boolean) => {
      if(isChecked) {
          onSelectionChange([...selectedCampaigns, id]);
      } else {
          onSelectionChange(selectedCampaigns.filter(cid => cid !== id));
      }
  }

  const handleStatusToggle = (campaignId: string, isChecked: boolean) => {
    setAllCampaigns(prevCampaigns =>
        prevCampaigns.map(campaign => {
            if (campaign.id === campaignId) {
                const newStatus = isChecked ? 'active' : 'paused';
                return {
                    ...campaign,
                    status: newStatus,
                    statusText: newStatus === 'active' ? 'активна' : 'приостановлена',
                };
            }
            return campaign;
        })
    );
  };

  const conceptCreateCampaignControls = isProductPromotionConceptPage ? (
    <div className="flex shrink-0 items-center gap-2">
      <CreateCampaignDropdown
        onNavigateToCreation={onNavigateToCreation}
        onOpenSingleCampaign={onOpenSingleCampaign}
        onNavigateToCuratedPick={onNavigateToCreationWithGrowingDemand}
      />
      <ExcelActionsDropdown
        onOpenUpload={onOpenUploadEditsModal}
        onOpenHistory={onOpenHistoryModal}
        showUploadHint={showUploadHint}
        onDismissUploadHint={onDismissUploadHint}
      />
    </div>
  ) : null;

  const conceptMainSectionTabs = isProductPromotionConceptPage ? (
    <div
      className="inline-flex shrink-0 rounded-[10px] bg-[rgba(74,74,89,0.08)] p-1"
      role="tablist"
      aria-label="Раздел списка"
    >
      {(
        [
          {
            id: 'campaigns' as const,
            label: 'Кампании',
            count: campaigns.length,
            selected: listTab === 'campaigns',
            onSelect: () => setListTab('campaigns'),
          },
          ...CONCEPT_PRODUCTS_PICK_TABS.map((pick) => ({
            id: pick.id,
            label: pick.label,
            count: productsPickTabCounts[pick.id] ?? 0,
            selected: listTab === 'products' && productsPickTab === pick.id,
            onSelect: () => {
              setListTab('products');
              setProductsPickTab(pick.id);
              setProductsSecondaryPickTab('all');
            },
          })),
        ] as const
      ).map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.selected}
          aria-label={`${tab.label}, ${tab.count}`}
          onClick={tab.onSelect}
          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-sm transition-all ${
            tab.selected
              ? 'bg-white font-semibold text-gray-900 shadow-sm'
              : 'font-medium text-[#767386] hover:text-gray-900'
          }`}
        >
          <span>{tab.label}</span>
          <span
            className={`tabular-nums text-[13px] ${
              tab.selected ? 'font-medium text-[#767386]' : 'text-[#9b9aa8]'
            }`}
          >
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  ) : null;

  return (
    <div
      className={`animate-in fade-in duration-300 mx-auto w-full max-w-[1920px] min-h-full bg-[#F3F5F8] ${
        isCampaignsPage ? 'pb-24' : ''
      }`}
    >
      {isLaunching && <CompactLaunchLoader total={launchTotal} />}
      {!isLaunching && launchResult && (
          <ResultBlock
              successCount={launchResult.success}
              errorCount={launchResult.error}
              failedCampaigns={failedCampaigns}
              onClear={onClearLaunchResult}
          />
      )}

      {isApplyingEdits && <ApplyingChangesBlock onOpenReview={onOpenReview} onCancel={onCancelEdits} />}

      {profileId === '2' && showReferralCampaignCreatedNotice && (
        <ReferralCampaignCreatedNotice onDismiss={dismissReferralCampaignCreatedNotice} />
      )}

      {limitShortfallNotification && (
        <Toast
          show={!!limitShortfallNotification}
          message={`Чтобы задать дневной лимит ${formatForDisplay(limitShortfallNotification.requestedLimit)} ₽, пополните бюджет еще на ${formatForDisplay(limitShortfallNotification.shortfall)} ₽`}
          onClose={() => setLimitShortfallNotification(null)}
          isError
          durationMs={2000}
          aboveOverlay
        />
      )}

      {tagError && (
        <Toast
          show={!!tagError}
          message={tagError}
          onClose={() => setTagError(null)}
          isError
          durationMs={2000}
          aboveOverlay
        />
      )}

      {productBulkNotice && (
        <Toast
          show={!!productBulkNotice}
          message={productBulkNotice}
          onClose={() => setProductBulkNotice(null)}
          durationMs={2500}
          aboveOverlay
        />
      )}
      {cpmBidRoundedAlertNode}

      {isProductPromotionConceptPage && productBidBulkModalKind && (
        <ProductBidBulkModal
          kind={productBidBulkModalKind}
          isOpen
          onClose={() => setProductBidBulkModalKind(null)}
          categories={selectedProductCategories}
          campaignCount={selectedProductsCampaignCount}
          productCount={selectedProductsForBidBulk.length}
          onApply={handleProductBidBulkApply}
          onCpmBidRounded={showCpmBidRoundedAlert}
        />
      )}

      {/* Шапка списка кампаний (под главной шапкой сайта) */}
      <div className="-mx-6 mb-0 px-6 pt-0 pb-4">
        <div className="flex flex-col gap-3">
          {isCampaignsWithWidgetsPage && (
            <div className="w-full min-w-0">
              <OverviewMiniWidgetsForCampaignsList listTab={listTab} />
            </div>
          )}

          {isCampaignsWithWidgets2Page || isCampaignsPage ? null : (
            <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap">
              <div className="flex shrink-0 items-center gap-2">
                <div
                  className="inline-flex shrink-0 rounded-[10px] bg-[rgba(74,74,89,0.08)] p-1"
                  role="tablist"
                  aria-label="Раздел списка"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={listTab === 'campaigns'}
                    onClick={() => setListTab('campaigns')}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                      listTab === 'campaigns'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-[#767386] hover:text-gray-900'
                    }`}
                  >
                    Кампании
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={listTab === 'products'}
                    onClick={() => setListTab('products')}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                      listTab === 'products'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-[#767386] hover:text-gray-900'
                    }`}
                  >
                    Товары
                  </button>
                </div>

                <ExcelActionsDropdown
                  onOpenUpload={onOpenUploadEditsModal}
                  onOpenHistory={onOpenHistoryModal}
                  showUploadHint={showUploadHint}
                  onDismissUploadHint={onDismissUploadHint}
                />
              </div>

              <CreateCampaignDropdown
                onNavigateToCreation={onNavigateToCreation}
                onOpenSingleCampaign={onOpenSingleCampaign}
                onNavigateToCuratedPick={onNavigateToCreationWithGrowingDemand}
              />

              <div className="relative min-w-[200px] flex-1">
                <Search
                  className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#767386] pointer-events-none shrink-0"
                  aria-hidden
                />
                <input
                  type="text"
                  placeholder={
                    listTab === 'campaigns'
                      ? 'Поиск по ID кампании или названию'
                      : 'Поиск по товару, артикулу или кампании'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 w-full rounded-[10px] border border-[#e3e4ea] bg-white pl-10 pr-3 text-sm text-gray-900 placeholder:text-[#767386] focus:border-[#9a41fe] focus:outline-none focus:ring-1 focus:ring-[#9a41fe]"
                />
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
                <DateFilter defaultLabel="22.02.2020 — 22.02.2020" variant="toolbar" />
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
                    className="flex h-11 items-center gap-2 rounded-[10px] bg-[rgba(74,74,89,0.08)] px-4 text-sm font-medium text-gray-900 hover:bg-[rgba(74,74,89,0.12)] transition-colors"
                  >
                    <Filter className="h-5 w-5 shrink-0 text-gray-700" aria-hidden />
                    <span>Фильтр</span>
                  </button>
                  {(listTab === 'campaigns' || listTab === 'products') && (
                    <FilterDropdown
                      variant={listTab === 'products' ? 'products' : 'campaigns'}
                      isOpen={isFilterDropdownOpen}
                      onClose={handleCancelFilters}
                      onApply={handleApplyFilters}
                      productCategoryOptions={productFilterCategoryOptions}
                      productsSection={tempProductsFilterSection}
                      onProductsSectionChange={setTempProductsFilterSection}
                      tempProductCategories={tempFilterProductCategories}
                      onTempProductCategoriesChange={setTempFilterProductCategories}
                      tempConflictOnly={tempFilterConflictOnly}
                      onTempConflictOnlyChange={setTempFilterConflictOnly}
                      tempCampaignTypes={tempFilterCampaignTypes}
                      onTempCampaignTypesChange={setTempFilterCampaignTypes}
                      category={filterCategory}
                      onCategoryChange={setFilterCategory}
                      status={filterStatus}
                      onStatusChange={setFilterStatus}
                      autorefill={filterAutorefill}
                      onAutorefillChange={setFilterAutorefill}
                      payment={filterPayment}
                      onPaymentChange={setFilterPayment}
                      sort={filterSort}
                      onSortChange={setFilterSort}
                      filterByCategory={filterByCategory}
                      onFilterByCategoryChange={setFilterByCategory}
                      tempCategory={tempFilterCategory}
                      onTempCategoryChange={setTempFilterCategory}
                      tempStatus={tempFilterStatus}
                      onTempStatusChange={setTempFilterStatus}
                      tempAutorefill={tempFilterAutorefill}
                      onTempAutorefillChange={setTempFilterAutorefill}
                      tempPayment={tempFilterPayment}
                      onTempPaymentChange={setTempFilterPayment}
                      tempSort={tempFilterSort}
                      onTempSortChange={setTempFilterSort}
                      tempFilterByCategory={tempFilterByCategory}
                      onTempFilterByCategoryChange={setTempFilterByCategory}
                      tempTags={tempTags}
                      onTempTagsChange={setTempTags}
                      tempTagsSearch={tempTagsSearch}
                      onTempTagsSearchChange={setTempTagsSearch}
                      tempTagsCategory={tempTagsCategory}
                      onTempTagsCategoryChange={setTempTagsCategory}
                      tempFilterPromoTagsOnly={tempFilterPromoTagsOnly}
                      onTempFilterPromoTagsOnlyChange={setTempFilterPromoTagsOnly}
                      availableTags={availableTags}
                    />
                  )}
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      if (listTab === 'products') {
                        setIsProductsColumnSettingsOpen((prev) => !prev);
                      }
                    }}
                    className={`flex h-11 w-11 items-center justify-center rounded-[10px] bg-[rgba(74,74,89,0.08)] transition-colors hover:bg-[rgba(74,74,89,0.12)] ${
                      listTab === 'products' && isProductsColumnSettingsOpen
                        ? 'ring-2 ring-[#9a41fe]/30'
                        : ''
                    }`}
                    title={listTab === 'products' ? 'Настройки колонок' : 'Настройки'}
                    aria-label={listTab === 'products' ? 'Настройки колонок' : 'Настройки'}
                    aria-expanded={listTab === 'products' ? isProductsColumnSettingsOpen : undefined}
                  >
                    <Settings className="h-5 w-5 text-gray-700" aria-hidden />
                  </button>
                  {listTab === 'products' && (
                    <ProductsColumnSettingsDropdown
                      open={isProductsColumnSettingsOpen}
                      onClose={() => setIsProductsColumnSettingsOpen(false)}
                      visibility={productsColumnVisibility}
                      onToggle={(columnId, visible) => {
                        setProductsColumnVisibility((prev) => ({ ...prev, [columnId]: visible }));
                      }}
                      onReset={() => setProductsColumnVisibility(defaultProductsColumnVisibility())}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {isCampaignsWidgetsV1OnlyPage && (
            <div className="w-full min-w-0">
              <Widgets2Strip
                profileId={profileId}
                items={widgets2VisibleCards}
                onCloseItem={closeWidgets2Card}
                onPromoteItem={openWidgets2Promote}
                onOpenBudgetHint={openWidgets2BudgetHint}
                onChooseProducts={openWidgets2ChooseProducts}
                onViewBidRecommendation={openWidgets2BidRecommendation}
                onOpenSetupRecommendations={openWidgets2SetupRecommendations}
              />
            </div>
          )}

          {isProductPromotionConceptPage && (
            <div className="w-full min-w-0">
              <ConceptPromotionInsightStrip
                onBudgetClick={openWidgets2BudgetHint}
                onPromoteClick={() => {
                  if (onNavigateToCreationWithGrowingDemand) {
                    onNavigateToCreationWithGrowingDemand();
                    return;
                  }
                  onNavigateToCreation();
                }}
                onBidClick={() => {
                  const item = widgets2DemoCards.find((c) => c.ctaAction === 'bid-recommendation')?.item;
                  if (item) openWidgets2BidRecommendation(item);
                }}
                onBonusClick={openWidgets2ChooseProducts}
              />
            </div>
          )}

          {isCampaignsWithWidgets2Page && !isProductPromotionConceptPage ? (
            <div>
            <div>
            <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap">
              <div className="flex shrink-0 items-center gap-2">
                  <div
                    className="inline-flex shrink-0 rounded-[10px] bg-[rgba(74,74,89,0.08)] p-1"
                    role="tablist"
                    aria-label="Раздел списка"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={listTab === 'campaigns'}
                      onClick={() => setListTab('campaigns')}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                        listTab === 'campaigns'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-[#767386] hover:text-gray-900'
                      }`}
                    >
                      Кампании
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={listTab === 'products'}
                      onClick={() => setListTab('products')}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                        listTab === 'products'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-[#767386] hover:text-gray-900'
                      }`}
                    >
                      Товары
                    </button>
                  </div>
                  <ExcelActionsDropdown
                    onOpenUpload={onOpenUploadEditsModal}
                    onOpenHistory={onOpenHistoryModal}
                    showUploadHint={showUploadHint}
                    onDismissUploadHint={onDismissUploadHint}
                  />
                </div>

              <div className="flex shrink-0 items-center gap-2">
                <CreateCampaignDropdown
                  onNavigateToCreation={onNavigateToCreation}
                  onOpenSingleCampaign={onOpenSingleCampaign}
                  onNavigateToCuratedPick={onNavigateToCreationWithGrowingDemand}
                />
              </div>

              <DateFilter defaultLabel="22.02.2020 — 22.02.2020" variant="toolbar" />

              <div className="relative min-w-[200px] flex-1">
                  <Search
                    className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#767386] pointer-events-none shrink-0"
                    aria-hidden
                  />
                  <input
                    type="text"
                    placeholder={
                      listTab === 'campaigns'
                        ? 'Поиск по ID кампании или названию'
                        : 'Поиск по товару, артикулу или кампании'
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-11 w-full rounded-[10px] border border-[#e3e4ea] bg-white pl-10 pr-3 text-sm text-gray-900 placeholder:text-[#767386] focus:border-[#9a41fe] focus:outline-none focus:ring-1 focus:ring-[#9a41fe]"
                  />
                </div>

              {(listTab !== 'products' || isCampaignsWidgetsV1OnlyPage) && (
                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
                      className="flex h-11 items-center gap-2 rounded-[10px] bg-[rgba(74,74,89,0.08)] px-4 text-sm font-medium text-gray-900 hover:bg-[rgba(74,74,89,0.12)] transition-colors"
                    >
                      <Filter className="h-5 w-5 shrink-0 text-gray-700" aria-hidden />
                      <span>Фильтр</span>
                    </button>
                    <FilterDropdown
                      variant={listTab === 'products' ? 'products' : 'campaigns'}
                      isOpen={isFilterDropdownOpen}
                      onClose={handleCancelFilters}
                      onApply={handleApplyFilters}
                      productCategoryOptions={productFilterCategoryOptions}
                      productsSection={tempProductsFilterSection}
                      onProductsSectionChange={setTempProductsFilterSection}
                      tempProductCategories={tempFilterProductCategories}
                      onTempProductCategoriesChange={setTempFilterProductCategories}
                      tempConflictOnly={tempFilterConflictOnly}
                      onTempConflictOnlyChange={setTempFilterConflictOnly}
                      tempCampaignTypes={tempFilterCampaignTypes}
                      onTempCampaignTypesChange={setTempFilterCampaignTypes}
                      category={filterCategory}
                      onCategoryChange={setFilterCategory}
                      status={filterStatus}
                      onStatusChange={setFilterStatus}
                      autorefill={filterAutorefill}
                      onAutorefillChange={setFilterAutorefill}
                      payment={filterPayment}
                      onPaymentChange={setFilterPayment}
                      sort={filterSort}
                      onSortChange={setFilterSort}
                      filterByCategory={filterByCategory}
                      onFilterByCategoryChange={setFilterByCategory}
                      tempCategory={tempFilterCategory}
                      onTempCategoryChange={setTempFilterCategory}
                      tempStatus={tempFilterStatus}
                      onTempStatusChange={setTempFilterStatus}
                      tempAutorefill={tempFilterAutorefill}
                      onTempAutorefillChange={setTempFilterAutorefill}
                      tempPayment={tempFilterPayment}
                      onTempPaymentChange={setTempFilterPayment}
                      tempSort={tempFilterSort}
                      onTempSortChange={setTempFilterSort}
                      tempFilterByCategory={tempFilterByCategory}
                      onTempFilterByCategoryChange={setTempFilterByCategory}
                      tempTags={tempTags}
                      onTempTagsChange={setTempTags}
                      tempTagsSearch={tempTagsSearch}
                      onTempTagsSearchChange={setTempTagsSearch}
                      tempTagsCategory={tempTagsCategory}
                      onTempTagsCategoryChange={setTempTagsCategory}
                      tempFilterPromoTagsOnly={tempFilterPromoTagsOnly}
                      onTempFilterPromoTagsOnlyChange={setTempFilterPromoTagsOnly}
                      availableTags={availableTags}
                    />
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        if (listTab === 'products') {
                          setIsProductsColumnSettingsOpen((prev) => !prev);
                        }
                      }}
                      className={`flex h-11 w-11 items-center justify-center rounded-[10px] bg-[rgba(74,74,89,0.08)] transition-colors hover:bg-[rgba(74,74,89,0.12)] ${
                        listTab === 'products' && isProductsColumnSettingsOpen
                          ? 'ring-2 ring-[#9a41fe]/30'
                          : ''
                      }`}
                      title={listTab === 'products' ? 'Настройки колонок' : 'Настройки'}
                      aria-label={listTab === 'products' ? 'Настройки колонок' : 'Настройки'}
                      aria-expanded={listTab === 'products' ? isProductsColumnSettingsOpen : undefined}
                    >
                      <Settings className="h-5 w-5 text-gray-700" aria-hidden />
                    </button>
                    {listTab === 'products' && (
                      <ProductsColumnSettingsDropdown
                        open={isProductsColumnSettingsOpen}
                        onClose={() => setIsProductsColumnSettingsOpen(false)}
                        visibility={productsColumnVisibility}
                        onToggle={(columnId, visible) => {
                          setProductsColumnVisibility((prev) => ({ ...prev, [columnId]: visible }));
                        }}
                        onReset={() => setProductsColumnVisibility(defaultProductsColumnVisibility())}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
            </div>
            </div>
          ) : null}

          {insightFilter && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex max-w-full items-center gap-2 rounded-[10px] bg-[rgba(74,74,89,0.08)] py-1.5 pl-3 pr-1.5 text-sm font-medium text-gray-900">
                <span className="truncate">{insightFilter.label}</span>
                <button
                  type="button"
                  onClick={() => clearInsightFilter?.()}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-[rgba(74,74,89,0.12)] hover:text-gray-900"
                  aria-label="Сбросить фильтр"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </span>
            </div>
          )}

          {!isCampaignsWithWidgetsPage && !isCampaignsWithWidgets2Page && (
          <div
            className={
              notificationCardVariant === 2
                ? 'flex w-full min-h-[9.75rem] items-stretch gap-3'
                : notificationCardVariant === 4
                  ? 'flex h-26 w-full min-w-0 items-stretch gap-3 overflow-visible'
                  : notificationCardVariant === 3
                    ? 'flex w-full min-h-[6.5rem] min-w-0 items-stretch gap-3 overflow-visible'
                    : 'flex h-24 w-full items-center gap-3'
            }
          >
            {notificationCardVariant === 4 ? (
              <ListHeaderVariant4Strip
                showInsightCards={profileId !== '2'}
                onRefillBudget={openVariant4MassBudgetRefill}
                onPromote={() => {
                  if (onNavigateToCreationWithGrowingDemand) {
                    onNavigateToCreationWithGrowingDemand();
                    return;
                  }
                  const item = bonusNotificationQueue[0];
                  if (item) beginRepeatLaunchFlow(item.launchPreset);
                }}
              />
            ) : notificationCardVariant === 2 ? (
              <>
                <div className="flex min-w-0 flex-1 gap-3">
                  <ListHeaderVariant3StatCard
                    label="Доля затрат"
                    value="9,7 %"
                    trend="5.8%"
                    trendUp={false}
                  />
                  <ListHeaderVariant3StatCard label="Сумма заказов" value="196 000 ₽" trend="1.9%" />
                  <ListHeaderVariant3StatCard label="Заказы" value="127" trend="12.6%" />
                </div>
                {profileId !== '2' && bonusNotificationQueue.length > 0 && (
                  <ListHeaderVariant3Panel
                    items={bonusNotificationQueue}
                    onPromoteItem={openVariant2PromoteItem}
                    onRefillBudget={openVariant2BonusBudgetRefill}
                    onOpenCampaign={openVariant2BonusCampaign}
                  />
                )}
              </>
            ) : (
              <ListHeaderCompactStatsPanel
                className={
                  notificationCardVariant === 3
                    ? 'min-w-0 flex-1 basis-0 grow self-stretch'
                    : 'h-24 flex-1'
                }
                alignStatsCenter={notificationCardVariant === 3}
                statsJustify={isProductPromotionConceptPage ? 'end' : 'start'}
              />
            )}

            {profileId !== '2' &&
              notificationCardVariant === 3 &&
              bonusNotificationQueue.length > 0 && (
                <ListHeaderVariant4Panel
                  items={bonusNotificationQueue}
                  onLaunchItem={(item) => beginRepeatLaunchFlow(item.launchPreset)}
                  onBonusItem={openBonusNotificationCampaign}
                />
              )}

            {profileId !== '2' &&
              !isCampaignsWithWidgets2Page &&
              notificationCardVariant !== 2 &&
              notificationCardVariant !== 3 &&
              notificationCardVariant !== 4 && (
              <div className="ml-auto flex shrink-0 items-center gap-3">
                {bonusNotificationQueue.length > 0 && (
                  <div className="flex h-24 shrink-0 items-center gap-3">
                    {showMoreViewsPromoCard && (
                      <BonusCampaignNotificationPeekCard
                        items={bonusNotificationQueue}
                        title="Товары с хорошей конверсией"
                        cardVariant={1}
                        onDismissItem={(id) =>
                          setBonusNotificationQueue((queue) => queue.filter((item) => item.id !== id))
                        }
                        onRepeatItem={(item) => beginRepeatLaunchFlow(item.launchPreset)}
                        onOpenItemDetail={openBonusNotificationCampaign}
                      />
                    )}
                    <BonusCampaignNotificationStack
                      items={bonusNotificationQueue}
                      cardVariant={1}
                      onDismissItem={(id) =>
                        setBonusNotificationQueue((queue) => queue.filter((item) => item.id !== id))
                      }
                      onRepeatItem={(item) => {
                        beginRepeatLaunchFlow(item.launchPreset);
                      }}
                      onOpenItemDetail={openBonusNotificationCampaign}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          )}

          {isCampaignsPage ? (
            <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap">
              <div className="flex shrink-0 items-center gap-2">
                <div
                  className="inline-flex shrink-0 rounded-[10px] bg-[rgba(74,74,89,0.08)] p-1"
                  role="tablist"
                  aria-label="Раздел списка"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={listTab === 'campaigns'}
                    onClick={() => setListTab('campaigns')}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                      listTab === 'campaigns'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-[#767386] hover:text-gray-900'
                    }`}
                  >
                    Кампании
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={listTab === 'products'}
                    onClick={() => setListTab('products')}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                      listTab === 'products'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-[#767386] hover:text-gray-900'
                    }`}
                  >
                    Товары
                  </button>
                </div>

                <ExcelActionsDropdown
                  onOpenUpload={onOpenUploadEditsModal}
                  onOpenHistory={onOpenHistoryModal}
                  showUploadHint={showUploadHint}
                  onDismissUploadHint={onDismissUploadHint}
                />
              </div>

              <CreateCampaignDropdown
                onNavigateToCreation={onNavigateToCreation}
                onOpenSingleCampaign={onOpenSingleCampaign}
                onNavigateToCuratedPick={onNavigateToCreationWithGrowingDemand}
              />

              <div className="relative min-w-[200px] flex-1">
                <Search
                  className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#767386] pointer-events-none shrink-0"
                  aria-hidden
                />
                <input
                  type="text"
                  placeholder={
                    listTab === 'campaigns'
                      ? 'Поиск по ID кампании или названию'
                      : 'Поиск по товару, артикулу или кампании'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 w-full rounded-[10px] border border-[#e3e4ea] bg-white pl-10 pr-3 text-sm text-gray-900 placeholder:text-[#767386] focus:border-[#9a41fe] focus:outline-none focus:ring-1 focus:ring-[#9a41fe]"
                />
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
                <DateFilter defaultLabel="22.02.2020 — 22.02.2020" variant="toolbar" />
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
                    className="flex h-11 items-center gap-2 rounded-[10px] bg-[rgba(74,74,89,0.08)] px-4 text-sm font-medium text-gray-900 hover:bg-[rgba(74,74,89,0.12)] transition-colors"
                  >
                    <Filter className="h-5 w-5 shrink-0 text-gray-700" aria-hidden />
                    <span>Фильтр</span>
                  </button>
                  {(listTab === 'campaigns' || listTab === 'products') && (
                    <FilterDropdown
                      variant={listTab === 'products' ? 'products' : 'campaigns'}
                      isOpen={isFilterDropdownOpen}
                      onClose={handleCancelFilters}
                      onApply={handleApplyFilters}
                      productCategoryOptions={productFilterCategoryOptions}
                      productsSection={tempProductsFilterSection}
                      onProductsSectionChange={setTempProductsFilterSection}
                      tempProductCategories={tempFilterProductCategories}
                      onTempProductCategoriesChange={setTempFilterProductCategories}
                      tempConflictOnly={tempFilterConflictOnly}
                      onTempConflictOnlyChange={setTempFilterConflictOnly}
                      tempCampaignTypes={tempFilterCampaignTypes}
                      onTempCampaignTypesChange={setTempFilterCampaignTypes}
                      category={filterCategory}
                      onCategoryChange={setFilterCategory}
                      status={filterStatus}
                      onStatusChange={setFilterStatus}
                      autorefill={filterAutorefill}
                      onAutorefillChange={setFilterAutorefill}
                      payment={filterPayment}
                      onPaymentChange={setFilterPayment}
                      sort={filterSort}
                      onSortChange={setFilterSort}
                      filterByCategory={filterByCategory}
                      onFilterByCategoryChange={setFilterByCategory}
                      tempCategory={tempFilterCategory}
                      onTempCategoryChange={setTempFilterCategory}
                      tempStatus={tempFilterStatus}
                      onTempStatusChange={setTempFilterStatus}
                      tempAutorefill={tempFilterAutorefill}
                      onTempAutorefillChange={setTempFilterAutorefill}
                      tempPayment={tempFilterPayment}
                      onTempPaymentChange={setTempFilterPayment}
                      tempSort={tempFilterSort}
                      onTempSortChange={setTempFilterSort}
                      tempFilterByCategory={tempFilterByCategory}
                      onTempFilterByCategoryChange={setTempFilterByCategory}
                      tempTags={tempTags}
                      onTempTagsChange={setTempTags}
                      tempTagsSearch={tempTagsSearch}
                      onTempTagsSearchChange={setTempTagsSearch}
                      tempTagsCategory={tempTagsCategory}
                      onTempTagsCategoryChange={setTempTagsCategory}
                      tempFilterPromoTagsOnly={tempFilterPromoTagsOnly}
                      onTempFilterPromoTagsOnlyChange={setTempFilterPromoTagsOnly}
                      availableTags={availableTags}
                    />
                  )}
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      if (listTab === 'products') {
                        setIsProductsColumnSettingsOpen((prev) => !prev);
                      }
                    }}
                    className={`flex h-11 w-11 items-center justify-center rounded-[10px] bg-[rgba(74,74,89,0.08)] transition-colors hover:bg-[rgba(74,74,89,0.12)] ${
                      listTab === 'products' && isProductsColumnSettingsOpen
                        ? 'ring-2 ring-[#9a41fe]/30'
                        : ''
                    }`}
                    title={listTab === 'products' ? 'Настройки колонок' : 'Настройки'}
                    aria-label={listTab === 'products' ? 'Настройки колонок' : 'Настройки'}
                    aria-expanded={listTab === 'products' ? isProductsColumnSettingsOpen : undefined}
                  >
                    <Settings className="h-5 w-5 text-gray-700" aria-hidden />
                  </button>
                  {listTab === 'products' && (
                    <ProductsColumnSettingsDropdown
                      open={isProductsColumnSettingsOpen}
                      onClose={() => setIsProductsColumnSettingsOpen(false)}
                      visibility={productsColumnVisibility}
                      onToggle={(columnId, visible) => {
                        setProductsColumnVisibility((prev) => ({ ...prev, [columnId]: visible }));
                      }}
                      onReset={() => setProductsColumnVisibility(defaultProductsColumnVisibility())}
                    />
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {listTab === 'campaigns' && (
      <div className="w-full max-w-[1920px]">
          <div
            className={`w-full bg-white rounded-xl shadow-sm border border-gray-100 ${
              isProductPromotionConceptPage ? 'overflow-visible' : 'overflow-hidden'
            }`}
          >
          {isProductPromotionConceptPage ? (
            <div className="relative z-40 border-b border-gray-100">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-2 px-4 py-3 sm:px-6">
                {conceptCreateCampaignControls}
                {conceptMainSectionTabs}
                <div className="ml-auto flex flex-row flex-wrap items-center justify-end gap-1.5">
                  <div className="inline-flex shrink-0 items-center gap-1.5">
                    <div className={`relative shrink-0 ${isFilterDropdownOpen ? 'z-[50]' : ''}`}>
                      <button
                        type="button"
                        onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
                        className={conceptToolbarTextControlClass}
                        aria-expanded={isFilterDropdownOpen}
                        aria-haspopup="dialog"
                      >
                        <span>Фильтры</span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-[#767386] transition-transform ${
                            isFilterDropdownOpen ? 'rotate-180' : ''
                          }`}
                          aria-hidden
                        />
                      </button>
                      <FilterDropdown
                        variant="campaigns"
                      isOpen={isFilterDropdownOpen}
                      onClose={handleCancelFilters}
                      onApply={handleApplyFilters}
                      productCategoryOptions={productFilterCategoryOptions}
                      productsSection={tempProductsFilterSection}
                      onProductsSectionChange={setTempProductsFilterSection}
                      tempProductCategories={tempFilterProductCategories}
                      onTempProductCategoriesChange={setTempFilterProductCategories}
                      tempConflictOnly={tempFilterConflictOnly}
                      onTempConflictOnlyChange={setTempFilterConflictOnly}
                      tempCampaignTypes={tempFilterCampaignTypes}
                      onTempCampaignTypesChange={setTempFilterCampaignTypes}
                      category={filterCategory}
                      onCategoryChange={setFilterCategory}
                      status={filterStatus}
                      onStatusChange={setFilterStatus}
                      autorefill={filterAutorefill}
                      onAutorefillChange={setFilterAutorefill}
                      payment={filterPayment}
                      onPaymentChange={setFilterPayment}
                      sort={filterSort}
                      onSortChange={setFilterSort}
                      filterByCategory={filterByCategory}
                      onFilterByCategoryChange={setFilterByCategory}
                      tempCategory={tempFilterCategory}
                      onTempCategoryChange={setTempFilterCategory}
                      tempStatus={tempFilterStatus}
                      onTempStatusChange={setTempFilterStatus}
                      tempAutorefill={tempFilterAutorefill}
                      onTempAutorefillChange={setTempFilterAutorefill}
                      tempPayment={tempFilterPayment}
                      onTempPaymentChange={setTempFilterPayment}
                      tempSort={tempFilterSort}
                      onTempSortChange={setTempFilterSort}
                      tempFilterByCategory={tempFilterByCategory}
                      onTempFilterByCategoryChange={setTempFilterByCategory}
                      tempTags={tempTags}
                      onTempTagsChange={setTempTags}
                      tempTagsSearch={tempTagsSearch}
                      onTempTagsSearchChange={setTempTagsSearch}
                      tempTagsCategory={tempTagsCategory}
                      onTempTagsCategoryChange={setTempTagsCategory}
                      tempFilterPromoTagsOnly={tempFilterPromoTagsOnly}
                      onTempFilterPromoTagsOnlyChange={setTempFilterPromoTagsOnly}
                        availableTags={availableTags}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          {isProductsPromoModalOpen && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40">
              <div className="relative bg-white w-[740px] h-[406px] max-w-[92vw] rounded-2xl shadow-2xl overflow-hidden">
                <button
                  type="button"
                  aria-label="Закрыть"
                  className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                  onClick={() => setIsProductsPromoModalOpen(false)}
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="px-8 pt-10 pb-6 h-full flex flex-col">
                  <div className="text-[22px] font-bold text-gray-900">Запустите CPC кампанию</div>

                  <div className="mt-5 bg-gray-50 rounded-xl p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-600/10 flex items-center justify-center shrink-0">
                      {/* Упрощенная иконка подарка */}
                      <svg
                        className="w-5 h-5 text-purple-700"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path
                          d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                        <path
                          d="M2 7h20v5H2V7Z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12 7v15"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                        <path
                          d="M12 7H9.2a2.3 2.3 0 1 1 0-4.6C10.9 2.4 12 4.2 12 7Z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12 7h2.8a2.3 2.3 0 1 0 0-4.6C13.1 2.4 12 4.2 12 7Z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <div className="text-sm font-semibold text-gray-900 leading-5">
                        Бюджет кампании пополним на 5 000 ₽ промобонусами
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Деньги с единого счета не спишутся</div>
                    </div>
                  </div>

                  <div className="mt-6 flex-1 overflow-hidden">
                    <div className="grid grid-cols-[1.6fr_0.8fr_0.8fr] gap-x-4 items-center text-xs text-gray-500">
                      <div className="font-medium text-gray-900">Товары, которые будут продаваться</div>
                      <div className="flex items-center gap-2 justify-end">
                        Конкурентная ставка
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-300 text-[10px] text-gray-500">
                          ?
                        </span>
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        Ставка за 1 клик
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-300 text-[10px] text-gray-500">
                          ?
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-[1.6fr_0.8fr_0.8fr] gap-x-4 items-center">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={profileProductTree[1]?.image ?? profileProductTree[0]?.image}
                          alt=""
                          className="w-14 h-14 rounded-md object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-gray-700 truncate">
                            ТОРТОР • 160747184
                          </div>
                          <div className="text-xs text-gray-500 truncate">Футболка хлопок мягкая приятная</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 justify-end">
                        <div className="w-7 h-7 rounded-full bg-white border border-green-200 flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-500" />
                        </div>
                        <input
                          readOnly
                          value="10"
                          className="w-[56px] text-center text-xs border border-gray-200 rounded-lg px-2 py-2 outline-none bg-white"
                        />
                      </div>

                      <div className="flex items-center gap-2 justify-end">
                        <div className="w-[44px] text-right text-xs text-gray-900">10 ₽</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 mt-2">
                    <button
                      type="button"
                      className="px-6 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700"
                      onClick={() => setIsProductsPromoModalOpen(false)}
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-sm font-semibold text-white"
                      onClick={() => setIsProductsPromoModalOpen(false)}
                    >
                      Запустить за промобонусы
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div
            className="relative overflow-x-auto [container-type:inline-size]"
            onScroll={(e) => {
              const target = e.currentTarget;
              setHasCampaignsScrollShadow(target.scrollLeft > 0);
            }}
          >
              {/* Тень между закреплёнными колонками и прокручиваемыми данными */}
              <table className="relative w-full text-sm min-w-[1680px]">
                  <thead className="bg-gray-50 text-gray-500 font-medium">
                      <tr>
                          <th className="sticky left-0 z-20 p-4 w-12 bg-gray-50">
                            <Checkbox
                              checked={isAllOnPageSelected}
                              onChange={(e) => handleSelectAll(e.target.checked)}
                              className={
                                isProductPromotionConceptPage
                                  ? CONCEPT_LIST_TABLE_CHECKBOX_CLASSNAME
                                  : 'w-4 h-4 text-purple-600'
                              }
                            />
                          </th>
                          <th className="sticky left-[52px] z-20 p-4 w-10 bg-gray-50"></th>
                          <th
                            className={`sticky left-[100px] z-20 min-w-[520px] w-[520px] max-w-[520px] overflow-hidden bg-gray-50 p-4 text-left ${
                              isProductPromotionConceptPage ? 'font-normal' : 'font-medium'
                            } ${hasCampaignsScrollShadow ? PRODUCTS_PINNED_EDGE_SHADOW_CLASS : ''}`}
                          >
                            {isProductPromotionConceptPage ? (
                              <label className="flex min-w-0 items-center gap-2 text-left font-normal text-gray-500">
                                <Search
                                  className="h-4 w-4 shrink-0 text-[#767386]"
                                  aria-hidden
                                />
                                <input
                                  type="search"
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  placeholder="Поиск"
                                  aria-label="Поиск по ID кампании или названию"
                                  className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-normal text-gray-900 placeholder:text-[#767386] focus:outline-none focus:ring-0"
                                />
                              </label>
                            ) : (
                              <div className="flex items-center gap-1 font-medium">
                                Товар/Кампания <ArrowUp className="w-4 h-4" />
                              </div>
                            )}
                            </th>
                          <th className="min-w-[9rem] bg-gray-50 p-4 text-left font-medium">
                            <div className="flex items-center gap-1 whitespace-nowrap">
                              Автоматизация <HelpCircle className="w-4 h-4 shrink-0" />
                            </div>
                          </th>
                          <th className="p-4 text-left font-medium"><div className="flex items-center gap-1">Остаток бюджета <HelpCircle className="w-4 h-4" /></div></th>
                          <th className="p-4 text-left font-medium"><div className="flex items-center gap-1">Дневной лимит <HelpCircle className="w-4 h-4" /></div></th>
                          <th className="p-4 text-left font-medium"><div className="flex items-center gap-1">Затраты <HelpCircle className="w-4 h-4" /></div></th>
                          <th className="p-4 text-left font-medium"><div className="flex items-center gap-1">Показы <HelpCircle className="w-4 h-4" /></div></th>
                          <th className="p-4 text-left font-medium"><div className="flex items-center gap-1">CTR <HelpCircle className="w-4 h-4" /></div></th>
                          <th className="p-4 text-left font-medium"><div className="flex items-center gap-1">Заказы <HelpCircle className="w-4 h-4" /></div></th>
                          <th className="p-4 text-left font-medium"><div className="flex items-center gap-1">Доля затрат <HelpCircle className="w-4 h-4" /></div></th>
                          <th className={`p-4 text-left font-medium ${PRODUCTS_STOCK_TH_CLASS}`}>Остатки</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {!dismissedCampaignsBonusBanner && profileProductTree[0] ? (
                        <tr className="hover:bg-transparent">
                          <td colSpan={32} className="p-0">
                            <div className="sticky left-0 z-[1] box-border w-[100cqw] max-w-[100cqw] px-4 py-3">
                              <CampaignsListBonusBanner
                                image={profileProductTree[0].image}
                                title={`${profileProductTree[0].articleWb} / ${profileProductTree[0].articleSeller} / ${profileProductTree[0].name}`}
                                onOpenCampaign={() =>
                                  setNotPromotedBonusModalProducts([profileProductTree[0]])
                                }
                                onDismiss={() => setDismissedCampaignsBonusBanner(true)}
                              />
                            </div>
                          </td>
                        </tr>
                      ) : null}
                      {paginatedCampaigns.map(c => {
                          const isCampaignRowSelected = selectedCampaigns.includes(c.id);
                          const campaignBidModeSubtitle = listCampaignBidModeSubtitle(c.typeDetails);
                          const campaignPinnedCellClass = isCampaignRowSelected
                            ? 'bg-purple-50 group-hover/campaign-row:bg-purple-50'
                            : 'bg-white group-hover/campaign-row:bg-gray-50';
                          return (
                          <tr
                            key={c.id}
                            onClick={(e) => {
                              if (
                                (c.type === 'CPC' || c.type === 'CPM') &&
                                !(e.target as HTMLElement).closest('button')
                              ) {
                                openListCpcCampaign(c);
                              }
                            }}
                            className={`group/campaign-row transition-colors ${
                              isCampaignRowSelected ? 'bg-purple-50' : 'hover:bg-gray-50'
                            } ${c.type === 'CPC' || c.type === 'CPM' ? 'cursor-pointer' : ''}`}
                          >
                      <td
                        className={`sticky left-0 z-10 p-4 ${campaignPinnedCellClass}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                                <Checkbox
                                  checked={selectedCampaigns.includes(c.id)}
                                  onChange={(e) => handleSelectSingle(c.id, e.target.checked)}
                                  className={
                                    isProductPromotionConceptPage
                                      ? CONCEPT_LIST_TABLE_CHECKBOX_CLASSNAME
                                      : 'w-4 h-4 text-purple-600'
                                  }
                                />
                              </td>
                              <td
                                className={`sticky left-[52px] z-10 p-4 ${campaignPinnedCellClass}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                  <ToggleSwitch
                                      checked={c.status === 'active'}
                                      onChange={(isChecked) => handleStatusToggle(c.id, isChecked)}
                                      disabled={c.status === 'draft' || c.status === 'error'}
                                  />
                              </td>
                              <td
                                className={`sticky left-[100px] z-10 min-w-[520px] w-[520px] max-w-[520px] overflow-hidden p-4 ${campaignPinnedCellClass} ${
                                  hasCampaignsScrollShadow ? PRODUCTS_PINNED_EDGE_SHADOW_CLASS : ''
                                }`}
                              >
                                  <div className="flex items-center gap-3">
                                      <ProductTableThumb
                                        productId={c.productId ?? c.productIds?.[0] ?? 'pr1'}
                                        src={c.image}
                                        category={c.category}
                                        alt={c.name}
                                      />
                                      <div className="min-w-0">
                                          <p className="mb-1 font-medium text-gray-800 truncate" title={c.name}>{c.name}</p>
                                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 flex-wrap">
                                              <StatusBadge status={c.status} text={c.statusText} />
                                              <span>ID {c.campaignId}</span>
                                              {c.tags.map(tag => (
                                                  <div key={tag.text} className={`flex items-center gap-1 ${tag.type === 'warning' ? 'text-amber-700' : tag.type === 'error' ? 'text-red-700' : ''}`}>
                                                      {tag.icon} {tag.text}
                                                  </div>
                                              ))}
                                          </div>
                                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                                            <span className="text-sm font-semibold text-gray-900">{c.type}</span>
                                            {c.typeIcons.map((icon, i) => (
                                              <span key={i} className="rounded bg-gray-100 p-1">
                                                {icon}
                                              </span>
                                            ))}
                                            {campaignBidModeSubtitle ? (
                                              <span>{campaignBidModeSubtitle}</span>
                                            ) : null}
                                          </div>
                                      </div>
                                  </div>
                              </td>
                              <td
                                className="p-4 align-middle"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <CampaignListAutomationCell
                                  campaignType={c.type}
                                  onSelect={(action) => runListCampaignAutomation(c, action)}
                                />
                              </td>
                              <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                  <div className="relative inline-flex items-center group" onClick={(e) => e.stopPropagation()}>
                                      <button
                                          type="button"
                                          onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              setSelectedCampaignForRefill(c);
                                              setIsBudgetRefillModalOpen(true);
                                          }}
                                          className="font-semibold text-blue-600 hover:text-purple-600 transition-colors cursor-pointer"
                                      >
                                          {formatCurrency(c.remainingBudget)}
                                      </button>
                                      <button
                                          type="button"
                                          onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              setSelectedCampaignForRefill(c);
                                              setIsBudgetRefillModalOpen(true);
                                          }}
                                          className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                          <Plus className="w-4 h-4 text-purple-600" />
                                      </button>
                                  </div>
                                  {c.autoRefill && (
                                      <div className="flex items-center gap-1 text-xs mt-1 text-green-600">
                                          <CheckCircle className="w-3.5 h-3.5" />
                                          Автопополнение
                                      </div>
                                  )}
                              </td>
                              <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                  <DailyLimitCell
                                      dailyLimit={c.dailyLimit ?? null}
                                      dailyLimitExhausted={c.dailyLimitExhausted}
                                      isCpc={c.type === 'CPC'}
                                      maxCpcBidRub={c.type === 'CPC' ? listCampaignMaxCpcBidRub(c) : 0}
                                      onClick={c.type === 'CPC' ? () => openDailyLimitModalForCampaign(c) : undefined}
                                  />
                              </td>
                              <td className="p-4 font-semibold text-gray-900">
                                {formatCurrency(c.spend)}
                              </td>
                              <td className="p-4 font-semibold text-gray-900">
                                {formatNumber(c.impressions)}
                              </td>
                              <td className="p-4 font-semibold text-gray-900">
                                {formatPercentage(c.ctr)}
                              </td>
                              <td className="p-4 font-semibold text-gray-900">
                                {formatNumber(c.orders)}
                              </td>
                              <td className="p-4 font-semibold text-gray-900">
                                {formatPercentage(c.spendShare)}
                              </td>
                              <td className={PRODUCTS_STOCK_TD_CLASS} onClick={(e) => e.stopPropagation()}>
                                <CampaignStockRemainderCell
                                  campaign={c}
                                  productTree={profileProductTree}
                                />
                              </td>
                          </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
          <Pagination
              total={campaigns.length}
              pageSize={CAMPAIGNS_PAGE_SIZE}
              current={currentPage}
              onChange={setCurrentPage}
          />
          </div>
      </div>
      )}

      {listTab === 'products' && (
        <>
          <div
            className={`w-full max-w-[1920px] bg-white rounded-xl shadow-sm border border-gray-100 ${
              isProductPromotionConceptPage ? 'overflow-visible' : 'overflow-hidden'
            }`}
          >
            {isProductsPromoModalOpen && (
              <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40">
                <div className="relative bg-white w-[740px] h-[406px] max-w-[92vw] rounded-2xl shadow-2xl overflow-hidden">
                  <button
                    type="button"
                    aria-label="Закрыть"
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                    onClick={() => setIsProductsPromoModalOpen(false)}
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="px-8 pt-10 pb-6 h-full flex flex-col">
                    <div className="text-[22px] font-bold text-gray-900">Запустите CPC кампанию</div>

                    {/* Инфо-карта с подарком */}
                    <div className="mt-5 bg-gray-50 rounded-xl p-5 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-purple-600/10 flex items-center justify-center shrink-0">
                      {/* Упрощенная иконка подарка */}
                      <svg
                        className="w-5 h-5 text-purple-700"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path
                          d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                        <path
                          d="M2 7h20v5H2V7Z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12 7v15"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                        <path
                          d="M12 7H9.2a2.3 2.3 0 1 1 0-4.6C10.9 2.4 12 4.2 12 7Z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12 7h2.8a2.3 2.3 0 1 0 0-4.6C13.1 2.4 12 4.2 12 7Z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                      </svg>
                      </div>
                      <div className="flex flex-col">
                        <div className="text-sm font-semibold text-gray-900 leading-5">
                          Бюджет кампании пополним на 5 000 ₽ промобонусами
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Деньги с единого счета не спишутся</div>
                      </div>
                    </div>

                    {/* Таблица-превью товаров */}
                    <div className="mt-6 flex-1 overflow-hidden">
                      <div className="grid grid-cols-[1.6fr_0.8fr_0.8fr] gap-x-4 items-center text-xs text-gray-500">
                        <div className="font-medium text-gray-900">Товары, которые будут продаваться</div>
                        <div className="flex items-center gap-2 justify-end">
                          Конкурентная ставка
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-300 text-[10px] text-gray-500">
                            ?
                          </span>
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                          Ставка за 1 клик
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-300 text-[10px] text-gray-500">
                            ?
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-[1.6fr_0.8fr_0.8fr] gap-x-4 items-center">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={profileProductTree[1]?.image ?? profileProductTree[0]?.image}
                            alt=""
                            className="w-14 h-14 rounded-md object-cover shrink-0"
                          />
                          <div className="min-w-0">
                          <div className="text-xs font-medium text-gray-700 truncate">
                            ТОРТОР • 160747184
                          </div>
                          <div className="text-xs text-gray-500 truncate">Футболка хлопок мягкая приятная</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 justify-end">
                        <div className="w-7 h-7 rounded-full bg-white border border-green-200 flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-500" />
                          </div>
                          <input
                            readOnly
                            value="10"
                          className="w-[56px] text-center text-xs border border-gray-200 rounded-lg px-2 py-2 outline-none bg-white"
                          />
                        </div>

                        <div className="flex items-center gap-2 justify-end">
                          <div className="w-[44px] text-right text-xs text-gray-900">10 ₽</div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 mt-2">
                      <button
                        type="button"
                        className="px-6 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700"
                        onClick={() => setIsProductsPromoModalOpen(false)}
                      >
                        Отмена
                      </button>
                      <button
                        type="button"
                        className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-sm font-semibold text-white"
                        onClick={() => setIsProductsPromoModalOpen(false)}
                      >
                        Запустить за промобонусы
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isProductPromotionConceptPage ? (
              <div className="relative z-40">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-2 px-4 py-3 sm:px-6">
                  {conceptCreateCampaignControls}
                  {conceptMainSectionTabs}
                  <div className="ml-auto flex flex-row flex-wrap items-center justify-end gap-1.5">
                    <div className="inline-flex shrink-0 items-center gap-1.5">
                      <div className={`relative shrink-0 ${isFilterDropdownOpen ? 'z-[50]' : ''}`}>
                        <button
                          type="button"
                          onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
                          className={conceptToolbarTextControlClass}
                          aria-expanded={isFilterDropdownOpen}
                          aria-haspopup="dialog"
                        >
                          <span>Фильтры</span>
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 text-[#767386] transition-transform ${
                              isFilterDropdownOpen ? 'rotate-180' : ''
                            }`}
                            aria-hidden
                          />
                        </button>
                        <FilterDropdown
                          variant="products"
                        isOpen={isFilterDropdownOpen}
                        onClose={handleCancelFilters}
                        onApply={handleApplyFilters}
                        productCategoryOptions={productFilterCategoryOptions}
                        productsSection={tempProductsFilterSection}
                        onProductsSectionChange={setTempProductsFilterSection}
                        tempProductCategories={tempFilterProductCategories}
                        onTempProductCategoriesChange={setTempFilterProductCategories}
                        tempConflictOnly={tempFilterConflictOnly}
                        onTempConflictOnlyChange={setTempFilterConflictOnly}
                        tempCampaignTypes={tempFilterCampaignTypes}
                        onTempCampaignTypesChange={setTempFilterCampaignTypes}
                        category={filterCategory}
                        onCategoryChange={setFilterCategory}
                        status={filterStatus}
                        onStatusChange={setFilterStatus}
                        autorefill={filterAutorefill}
                        onAutorefillChange={setFilterAutorefill}
                        payment={filterPayment}
                        onPaymentChange={setFilterPayment}
                        sort={filterSort}
                        onSortChange={setFilterSort}
                        filterByCategory={filterByCategory}
                        onFilterByCategoryChange={setFilterByCategory}
                        tempCategory={tempFilterCategory}
                        onTempCategoryChange={setTempFilterCategory}
                        tempStatus={tempFilterStatus}
                        onTempStatusChange={setTempFilterStatus}
                        tempAutorefill={tempFilterAutorefill}
                        onTempAutorefillChange={setTempFilterAutorefill}
                        tempPayment={tempFilterPayment}
                        onTempPaymentChange={setTempFilterPayment}
                        tempSort={tempFilterSort}
                        onTempSortChange={setTempFilterSort}
                        tempFilterByCategory={tempFilterByCategory}
                        onTempFilterByCategoryChange={setTempFilterByCategory}
                        tempTags={tempTags}
                        onTempTagsChange={setTempTags}
                        tempTagsSearch={tempTagsSearch}
                        onTempTagsSearchChange={setTempTagsSearch}
                        tempTagsCategory={tempTagsCategory}
                        onTempTagsCategoryChange={setTempTagsCategory}
                        tempFilterPromoTagsOnly={tempFilterPromoTagsOnly}
                        onTempFilterPromoTagsOnlyChange={setTempFilterPromoTagsOnly}
                          availableTags={availableTags}
                        />
                      </div>
                    </div>
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsProductsColumnSettingsOpen((prev) => !prev)}
                        className={`${conceptToolbarIconControlClass} ${
                          isProductsColumnSettingsOpen ? 'ring-2 ring-[#9a41fe]/30' : ''
                        }`}
                        title="Настройки колонок"
                        aria-label="Настройки колонок"
                        aria-expanded={isProductsColumnSettingsOpen}
                      >
                        <Settings className="h-4 w-4 text-gray-600" aria-hidden />
                      </button>
                      <ProductsColumnSettingsDropdown
                        open={isProductsColumnSettingsOpen}
                        onClose={() => setIsProductsColumnSettingsOpen(false)}
                        visibility={productsColumnVisibility}
                        onToggle={(columnId, visible) => {
                          setProductsColumnVisibility((prev) => ({ ...prev, [columnId]: visible }));
                        }}
                        onReset={() => setProductsColumnVisibility(defaultProductsColumnVisibility())}
                      />
                    </div>
                  </div>
                </div>
                {listTab === 'products' && !conceptAllProductsPickTab ? (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-2 bg-white px-4 py-2.5 sm:px-6">
                  <div
                    className="inline-flex min-w-0 flex-1 flex-wrap items-center gap-x-8 gap-y-2"
                    role="tablist"
                    aria-label="Подборки товаров"
                  >
                    {PRODUCTS_PICK_SECONDARY_TABS.map((tab) => {
                      const count = productsSecondaryPickTabCounts[tab.id];
                      const isSelected = productsSecondaryPickTab === tab.id;
                      const TabIcon = PRODUCTS_PICK_SECONDARY_TAB_VISUAL[tab.id].Icon;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          role="tab"
                          aria-selected={isSelected}
                          aria-label={`${tab.label}, ${count} товаров`}
                          onClick={() => setProductsSecondaryPickTab(tab.id)}
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap bg-transparent p-0 text-sm leading-5 transition-colors ${
                            isSelected
                              ? 'font-semibold text-[#9A41FE]'
                              : 'font-medium text-gray-900 hover:text-[#9A41FE]'
                          }`}
                        >
                          {TabIcon ? (
                            <TabIcon className="h-4 w-4 shrink-0" />
                          ) : null}
                          <span>{tab.label}</span>
                          <span className="tabular-nums">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                ) : null}
              </div>
            ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 sm:px-6">
                <div
                  className="inline-flex max-w-full flex-wrap rounded-[10px] bg-[rgba(74,74,89,0.08)] p-1 text-sm font-medium"
                  role="tablist"
                  aria-label="Подборки товаров"
                >
                  {PRODUCTS_PICK_TABS.map((tab) => {
                    const count = productsPickTabCounts[tab.id];
                    const isSelected = productsPickTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        aria-label={`${tab.label}, ${count} товаров`}
                        onClick={() => setProductsPickTab(tab.id)}
                        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 transition-all ${
                          isSelected
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-[#767386] hover:text-gray-900'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span
                          className={`tabular-nums ${
                            isSelected ? 'text-[#767386]' : 'text-[#9b9aa8]'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
            </div>
            )}

            {activeProductsPickPromotionCtaTab ? (
              <div className="border-b border-gray-100 px-0 pb-3 pt-2">
                <ProductsPickPromotionCtaBanner tab={activeProductsPickPromotionCtaTab} />
              </div>
            ) : null}

            <div
              className="relative z-0 overflow-x-auto [container-type:inline-size]"
              onScroll={(e) => {
                const target = e.currentTarget;
                setHasProductsScrollShadow(target.scrollLeft > 0);
              }}
            >
              {/* Тень справа от закреплённого столбца товара */}
              <table
                className={`relative w-full text-sm ${
                  conceptCompactProductsTable
                    ? ''
                    : conceptAllProductsPickTab
                      ? 'min-w-[2928px]'
                      : 'min-w-[2800px]'
                }`}
                style={productsTableMinWidthStyle}
              >
                {conceptCompactProductsTable ? (
                  <colgroup>
                    <col style={{ width: CONCEPT_NOT_PROMOTED_SELECT_WIDTH_PX }} />
                    <col style={{ width: CONCEPT_NOT_PROMOTED_PRODUCT_PIN_WIDTH_PX }} />
                    {conceptNotPromotedShowTagsColumn ? (
                      <col style={{ width: CONCEPT_NOT_PROMOTED_TAGS_COL_WIDTH_PX }} />
                    ) : null}
                    {conceptBonusCampaignColumn ? (
                      <col style={{ width: CONCEPT_NOT_PROMOTED_BONUS_CAMPAIGN_COL_WIDTH_PX }} />
                    ) : null}
                    <col style={{ width: CONCEPT_NOT_PROMOTED_REC_BID_CPC_SEARCH_COL_WIDTH_PX }} />
                    <col style={{ width: CONCEPT_NOT_PROMOTED_REC_BID_CPM_REC_COL_WIDTH_PX }} />
                    {CONCEPT_NOT_PROMOTED_PRODUCT_STAT_LABELS.map((label) => (
                      <col key={label} style={{ width: CONCEPT_NOT_PROMOTED_STAT_COL_WIDTH_PX }} />
                    ))}
                    <col style={{ width: CONCEPT_NOT_PROMOTED_STOCK_COL_WIDTH_PX }} />
                  </colgroup>
                ) : null}
                <thead
                  className={`text-gray-500 font-normal ${
                    isProductPromotionConceptPage ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <tr>
                    {conceptAllProductsPickTab ? (
                      <th
                        className="sticky left-0 z-[23] w-5 min-w-[20px] max-w-[20px] bg-white p-0"
                        aria-hidden
                      />
                    ) : null}
                    <th
                      {...productsTablePinnedCellProps(
                        'select',
                        'head',
                        conceptAllProductsPickTab
                          ? CONCEPT_MULTICARD_SELECT_TH_CLASS
                          : conceptCompactProductsTable
                            ? PRODUCTS_SELECT_TH_CLASS_COMPACT
                            : conceptPromotedProductsWideTable
                              ? PRODUCTS_SELECT_TH_CLASS
                              : PRODUCTS_SELECT_TH_CLASS,
                      )}
                    >
                      <Checkbox
                        checked={isAllProductsSelected}
                        onChange={(e) => handleSelectAllProducts(e.target.checked)}
                        className={
                          isProductPromotionConceptPage
                            ? CONCEPT_LIST_TABLE_CHECKBOX_CLASSNAME
                            : 'w-4 h-4 text-purple-600'
                        }
                      />
                    </th>
                    {productsColVisible('product') ? (
                      <th
                        {...productsTablePinnedCellProps(
                          'product',
                          'head',
                          conceptAllProductsPickTab
                            ? 'pl-0 pr-5 pt-0 pb-4 text-left font-normal align-middle'
                            : conceptCompactProductsTable
                              ? 'pl-1 pr-2 py-2.5 text-left font-normal align-middle'
                              : conceptPromotedProductsWideTable
                                ? 'pl-0 pr-5 pt-0 pb-4 text-left font-normal align-middle'
                                : PRODUCTS_PINNED_TH_PRODUCT_CLASS,
                        )}
                      >
                        {isProductPromotionConceptPage ? (
                          <label className="flex min-w-0 items-center gap-2 text-left font-normal text-gray-500">
                            <Search
                              className="h-4 w-4 shrink-0 text-[#767386]"
                              aria-hidden
                            />
                            <input
                              type="search"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Поиск"
                              aria-label="Поиск по товару, артикулу или кампании"
                              className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-normal text-gray-900 placeholder:text-[#767386] focus:outline-none focus:ring-0"
                            />
                          </label>
                        ) : (
                          <span className="block text-left">Товар</span>
                        )}
                      </th>
                    ) : null}
                    {conceptAllProductsPickTab && productsColVisible(MULTICARD_GLUE_LEADER_COLUMN_ID) ? (
                      <th
                        {...productsTablePinnedCellProps(
                          'glueLeader',
                          'head',
                          MULTICARD_GLUE_LEADER_TH_CLASS,
                        )}
                      >
                        <span
                          className="inline-flex items-center gap-0.5 text-left leading-tight"
                          title="Доля заказов товара от суммы по склейке: полоска и %"
                        >
                          <span>В склейке</span>
                          <HelpCircle className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
                        </span>
                      </th>
                    ) : null}
                    {showProductsCampaignTypeColumn ? (
                      <th
                        {...productsTablePinnedCellProps(
                          'campaignType',
                          'head',
                          PRODUCTS_PINNED_TH_CLASS,
                        )}
                      >
                        <span className="inline-flex items-center justify-start gap-1 text-left">
                          Тип кампании <HelpCircle className="w-4 h-4 text-gray-400" />
                        </span>
                      </th>
                    ) : null}
                    {showProductsBidColumn ? (
                      <th
                        {...productsTablePinnedCellProps(
                          'bid',
                          'head',
                          'px-2 py-4 text-left font-normal align-middle',
                        )}
                      >
                        <span className="inline-flex items-center justify-start gap-1 text-left leading-tight">
                          {isProductPromotionConceptPage && isNotPromotedProductsPickTab(productsPickTab)
                            ? 'Рекомендуемая ставка'
                            : 'Ставка'}{' '}
                          <HelpCircle className="w-4 h-4 shrink-0 text-gray-400" />
                        </span>
                      </th>
                    ) : null}
                    {productsColVisible('budgetRemainder') ? (
                      <th
                        {...productsTablePinnedCellProps(
                          'budgetRemainder',
                          'head',
                          PRODUCTS_PINNED_TH_CLASS,
                        )}
                      >
                        <span className="inline-flex items-center justify-start gap-1 text-left">
                          Остаток бюджета <HelpCircle className="w-4 h-4 text-gray-400" />
                        </span>
                      </th>
                    ) : null}
                    {productsColVisible('dailyLimit') ? (
                      <th
                        {...productsTablePinnedCellProps(
                          'dailyLimit',
                          'head',
                          PRODUCTS_PINNED_TH_CLASS,
                        )}
                      >
                        <span className="inline-flex items-center justify-start gap-1 whitespace-nowrap text-left">
                          Дневной лимит <HelpCircle className="w-4 h-4 shrink-0 text-gray-400" />
                        </span>
                      </th>
                    ) : null}
                    {productsColVisible('tags') ? (
                      <th
                        className={
                          conceptCompactProductsTable
                            ? CONCEPT_NOT_PROMOTED_TAGS_TH_CLASS
                            : 'p-4 text-left font-normal w-[220px] min-w-[220px] max-w-[240px]'
                        }
                      >
                        Ярлыки
                      </th>
                    ) : null}
                    {conceptBonusCampaignColumn ? (
                      <th className={CONCEPT_NOT_PROMOTED_BONUS_CAMPAIGN_TH_CLASS}>
                        <span className="block">Бонусная</span>
                        <span className="block">CPC кампания</span>
                      </th>
                    ) : null}
                    {productsColVisible(PRODUCTS_RECOMMENDED_BID_CPC_SEARCH_COLUMN_ID) ? (
                      <th className={CONCEPT_NOT_PROMOTED_AVERAGE_BID_TH_CLASS}>
                        <ConceptAverageBidColumnHeader
                          titleLines={
                            <>
                              <span className="block">Ставка CPC в поиске</span>
                              <span className="block">за 1-2 место</span>
                            </>
                          }
                          tooltipText={CONCEPT_RECOMMENDED_CPC_SEARCH_BID_HEADER_TOOLTIP}
                          sortKey={PRODUCTS_RECOMMENDED_BID_CPC_SEARCH_COLUMN_ID}
                          activeSort={productStatSort}
                          onSort={handleProductStatColumnSort}
                        />
                      </th>
                    ) : null}
                    {productsColVisible(PRODUCTS_RECOMMENDED_BID_CPM_SEARCH_COLUMN_ID) ? (
                      <th className={CONCEPT_NOT_PROMOTED_AVERAGE_BID_TH_CLASS}>
                        <ConceptAverageBidColumnHeader
                          titleLines={
                            <>
                              <span className="block">Ставка CPM в поиске</span>
                              <span className="block">за 1-2 место</span>
                            </>
                          }
                          tooltipText={CONCEPT_RECOMMENDED_CPM_SEARCH_BID_HEADER_TOOLTIP}
                          sortKey={PRODUCTS_RECOMMENDED_BID_CPM_SEARCH_COLUMN_ID}
                          activeSort={productStatSort}
                          onSort={handleProductStatColumnSort}
                        />
                      </th>
                    ) : null}
                    {productsColVisible(PRODUCTS_RECOMMENDED_BID_CPM_REC_COLUMN_ID) ? (
                      <th className={CONCEPT_NOT_PROMOTED_AVERAGE_BID_TH_CLASS}>
                        <ConceptAverageBidColumnHeader
                          titleLines={
                            <>
                              <span className="block">Min ставка CPM</span>
                              <span className="block">в рекомендациях</span>
                            </>
                          }
                          tooltipText={CONCEPT_RECOMMENDED_CPM_REC_BID_HEADER_TOOLTIP}
                          sortKey={PRODUCTS_RECOMMENDED_BID_CPM_REC_COLUMN_ID}
                          activeSort={productStatSort}
                          onSort={handleProductStatColumnSort}
                        />
                      </th>
                    ) : null}
                    {productsColVisible(PRODUCTS_STAT_SPACER_COLUMN_ID) ? (
                      <th className={PRODUCTS_STAT_SPACER_CELL_CLASS} aria-hidden />
                    ) : null}
                    {PRODUCTS_STAT_COLUMN_LABELS.map((label) =>
                      productsColVisible(productsStatColumnId(label)) ? (
                        <th
                          key={label}
                          className={
                            conceptCompactProductsTable
                              ? CONCEPT_NOT_PROMOTED_STAT_TH_CLASS
                              : PRODUCTS_STAT_TH_CLASS
                          }
                        >
                          <span className="inline-flex w-full items-start justify-end gap-0.5">
                            {conceptCompactProductsTable &&
                            isConceptNotPromotedStatSortLabel(label) ? (
                              <ConceptNotPromotedStatColumnHeader
                                label={label}
                                activeSort={productStatSort}
                                onSort={handleProductStatColumnSort}
                              />
                            ) : (
                              <>
                                <span>
                                  {conceptCompactProductsTable
                                    ? conceptNotPromotedStatColumnTitle(label)
                                    : label}
                                </span>
                                {isConceptNotPromotedStatSortLabel(label) ? (
                                  <ConceptNotPromotedTableSortButton
                                    sortKey={label}
                                    title={label}
                                    activeSort={productStatSort}
                                    onSort={handleProductStatColumnSort}
                                  />
                                ) : null}
                              </>
                            )}
                            {!conceptCompactProductsTable ? (
                              <HelpCircle className="w-4 h-4 shrink-0 text-gray-400" />
                            ) : null}
                          </span>
                        </th>
                      ) : null,
                    )}
                    {productsColVisible(PRODUCTS_STOCK_COLUMN_ID) ? (
                      <th
                        className={
                          conceptCompactProductsTable
                            ? CONCEPT_NOT_PROMOTED_STOCK_TH_CLASS
                            : PRODUCTS_STOCK_TH_CLASS
                        }
                      >
                        <span className="inline-flex items-center gap-1">
                          Остатки
                          {!conceptCompactProductsTable ? (
                            <HelpCircle className="w-4 h-4 shrink-0 text-gray-400" />
                          ) : null}
                        </span>
                      </th>
                    ) : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {conceptAllTabTableRows.map((tableRow, listRowIndex) => {
                    const {
                      product,
                      multicardRail,
                      multicardGroupStartsSection,
                      multicardGroupMembers,
                    } = tableRow;
                    const rowIsConceptNotPromoted =
                      isProductPromotionConceptPage &&
                      (productConceptIsNotPromoted(product, productCampaignStatusOverride) ||
                        (conceptAllProductsPickTab &&
                          conceptMulticardTabDemoNotPromotedProductIds.has(product.id)));
                    const rowUsesOrganicProductStats =
                      conceptNotPromotedProductsList ||
                      (conceptAllProductsPickTab && rowIsConceptNotPromoted);
                    const rowShowsPromotedProductUi = conceptAllProductsPickTab
                      ? !rowIsConceptNotPromoted
                      : !conceptNotPromotedProductsList;
                    const rowCompactNotPromotedStyle =
                      conceptCompactProductsTable ||
                      (conceptAllProductsPickTab && rowIsConceptNotPromoted);
                    const rowShowPromoteUnderPhoto =
                      conceptNotPromotedProductsList ||
                      (conceptAllProductsPickTab && rowIsConceptNotPromoted);
                    const rowReserveExpandGutter =
                      conceptAllProductsPickTab && rowIsConceptNotPromoted;
                    const rowAllTabListRowIndex = conceptAllProductsPickTab
                      ? listRowIndex
                      : undefined;
                    const rowInMulticardGroup = multicardRail !== null;
                    const productTdBaseClass = conceptAllProductsPickTab
                      ? `pl-0 ${rowShowPromoteUnderPhoto ? 'pr-2' : 'pr-5'} py-3 align-middle`
                      : rowCompactNotPromotedStyle
                        ? 'pl-0 pr-2 py-2.5 align-middle'
                        : 'pl-0 pr-5 py-4 align-middle';
                    const showMulticardGroupStatsRow =
                      conceptAllProductsPickTab &&
                      multicardRail === 'first' &&
                      multicardGroupMembers !== null &&
                      multicardGroupMembers.length > 1;
                    const multicardGroupId = rowInMulticardGroup
                      ? demoConceptMulticardGroupId(product)
                      : null;
                    const multicardGroupExpanded =
                      multicardGroupId === null ||
                      !collapsedConceptMulticardGroupIds.has(multicardGroupId) ||
                      (multicardGroupId !== null &&
                        conceptMulticardSearchForceExpandedGroupIds.has(multicardGroupId));
                    const rowMulticardSearchHighlight =
                      conceptAllProductsPickTab &&
                      conceptMulticardSearchMatchedProductIds.has(product.id);
                    const conceptStockCompactTable = conceptCompactProductsTable;
                    const multicardGroupBodyIndentPx = conceptAllProductsPickTab
                      ? CONCEPT_MULTICARD_GROUP_MEMBER_INDENT_PX
                      : 0;
                    const multicardCheckboxIndentPx =
                      conceptAllProductsPickTab &&
                      rowInMulticardGroup &&
                      multicardGroupExpanded
                        ? CONCEPT_MULTICARD_GROUP_MEMBER_INDENT_PX
                        : 0;
                    const conceptMulticardProductsSelectTdClass =
                      multicardCheckboxIndentPx > 0
                        ? CONCEPT_MULTICARD_SELECT_TD_CLASS_NESTED
                        : CONCEPT_MULTICARD_SELECT_TD_CLASS;
                    const productsSelectTdClass = conceptAllProductsPickTab
                      ? conceptMulticardProductsSelectTdClass
                      : conceptPromotedProductsWideTable
                        ? PRODUCTS_SELECT_TD_CLASS
                        : rowCompactNotPromotedStyle
                          ? PRODUCTS_SELECT_TD_CLASS_COMPACT
                          : PRODUCTS_SELECT_TD_CLASS;
                    const primaryCpcCampaign = pickPrimaryCpcCampaign(product);
                    const rowGlueLeaderMembers =
                      conceptAllProductsPickTab && multicardGroupMembers && multicardGroupMembers.length > 0
                        ? multicardGroupMembers
                        : conceptAllProductsPickTab
                          ? [product]
                          : null;
                    const rowGlueLeaderInsight =
                      rowGlueLeaderMembers && conceptAllProductsPickTab
                        ? resolveMulticardGlueLeaderInsight(
                            product,
                            rowGlueLeaderMembers,
                            conceptMulticardTabDemoNotPromotedProductIds,
                            productCampaignStatusOverride,
                          )
                        : null;

                    if (
                      conceptAllProductsPickTab &&
                      rowInMulticardGroup &&
                      !multicardGroupExpanded &&
                      multicardRail !== 'first'
                    ) {
                      return null;
                    }

                    const showMulticardRailCell =
                      conceptAllProductsPickTab &&
                      multicardRail === 'first' &&
                      multicardGroupMembers !== null &&
                      multicardGroupMembers.length > 1 &&
                      multicardGroupExpanded;
                    const multicardRailRowSpan =
                      showMulticardRailCell && multicardGroupMembers
                        ? conceptAllTabMulticardGroupRowSpan(
                            multicardGroupMembers,
                            expandedProductIds,
                          )
                        : 0;

                    if (showMulticardGroupStatsRow && !multicardGroupExpanded && multicardGroupMembers && multicardGroupId) {
                      return (
                        <ConceptAllTabMulticardGroupStatsRow
                          key={`${multicardGroupId}-header-collapsed`}
                          groupId={multicardGroupId}
                          groupTitleOverride={conceptMulticardGroupTitleById[multicardGroupId]}
                          onGroupTitleChange={handleConceptMulticardGroupTitleChange}
                          members={multicardGroupMembers}
                          sectionGap={multicardGroupStartsSection}
                          demoNotPromotedProductIds={conceptMulticardTabDemoNotPromotedProductIds}
                          productCampaignStatusOverride={productCampaignStatusOverride}
                          selectedProductIds={selectedProductIds}
                          onSelectGroup={handleSelectMulticardGroup}
                          productsTablePinnedCellProps={productsTablePinnedCellProps}
                          productsColVisible={productsColVisible}
                          showProductsCampaignTypeColumn={showProductsCampaignTypeColumn}
                          showProductsBidColumn={showProductsBidColumn}
                          listRowIndexBase={listRowIndex}
                          groupExpanded={false}
                          onToggleGroupExpanded={() =>
                            toggleConceptMulticardGroupExpanded(multicardGroupId)
                          }
                        />
                      );
                    }

                    return (
                    <React.Fragment key={product.id}>
                      {showMulticardGroupStatsRow && multicardGroupMembers ? (
                        <ConceptAllTabMulticardGroupStatsRow
                          groupId={multicardGroupId!}
                          groupTitleOverride={
                            multicardGroupId
                              ? conceptMulticardGroupTitleById[multicardGroupId]
                              : undefined
                          }
                          onGroupTitleChange={handleConceptMulticardGroupTitleChange}
                          members={multicardGroupMembers}
                          sectionGap={multicardGroupStartsSection}
                          demoNotPromotedProductIds={conceptMulticardTabDemoNotPromotedProductIds}
                          productCampaignStatusOverride={productCampaignStatusOverride}
                          selectedProductIds={selectedProductIds}
                          onSelectGroup={handleSelectMulticardGroup}
                          productsTablePinnedCellProps={productsTablePinnedCellProps}
                          productsColVisible={productsColVisible}
                          showProductsCampaignTypeColumn={showProductsCampaignTypeColumn}
                          showProductsBidColumn={showProductsBidColumn}
                          listRowIndexBase={listRowIndex}
                          groupExpanded={multicardGroupExpanded}
                          onToggleGroupExpanded={() =>
                            toggleConceptMulticardGroupExpanded(multicardGroupId!)
                          }
                        />
                      ) : null}
                      {/* Строка товара */}
                      {multicardGroupExpanded ? (
                      <>
                      <tr
                        className={`group/product-row transition-colors hover:bg-gray-50/80 ${
                          !showMulticardGroupStatsRow && multicardGroupStartsSection
                            ? CONCEPT_MULTICARD_GROUP_SECTION_GAP_CLASS
                            : ''
                        } ${
                          rowInMulticardGroup &&
                          (multicardRail !== 'first' || showMulticardGroupStatsRow)
                            ? '!border-t-0'
                            : ''
                        } ${rowInMulticardGroup && multicardRail !== 'last' ? '!border-b-0' : ''}`}
                      >
                        {conceptAllProductsPickTab ? (
                          showMulticardRailCell ? (
                            <ConceptAllTabMulticardRailCell
                              rowSpan={multicardRailRowSpan}
                              memberIndentPx={multicardGroupBodyIndentPx}
                            />
                          ) : multicardRail === null ? (
                            <td
                              className="sticky left-0 z-[22] w-5 min-w-[20px] max-w-[20px] border-0 bg-white p-0 align-top group-hover/product-row:bg-gray-50"
                              aria-hidden
                            />
                          ) : null
                        ) : null}
                        <td
                          {...(() => {
                            const pinned = productsTablePinnedCellProps(
                              'select',
                              'body',
                              productsSelectTdClass,
                              multicardCheckboxIndentPx,
                            );
                            return {
                              ...pinned,
                              className: [
                                pinned.className,
                                productsSelectTdClass === PRODUCTS_SELECT_TD_CLASS_COMPACT
                                  ? 'h-px'
                                  : '',
                              ]
                                .filter(Boolean)
                                .join(' '),
                              style: {
                                ...pinned.style,
                                ...(multicardCheckboxIndentPx > 0
                                  ? { paddingLeft: multicardCheckboxIndentPx }
                                  : {}),
                              },
                            };
                          })()}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div
                            className={`flex items-center justify-end ${
                              productsSelectTdClass === PRODUCTS_SELECT_TD_CLASS_COMPACT
                                ? 'h-full min-h-full'
                                : 'w-full'
                            }`}
                          >
                            <Checkbox
                              checked={selectedProductIds.includes(product.id)}
                              onChange={(e) =>
                                handleSelectSingleProduct(product.id, e.target.checked)
                              }
                              className={
                                isProductPromotionConceptPage
                                  ? CONCEPT_LIST_TABLE_CHECKBOX_CLASSNAME
                                  : 'w-4 h-4 text-purple-600'
                              }
                            />
                          </div>
                        </td>
                        {productsColVisible('product') ? (
                          <td
                            {...productsTablePinnedCellProps(
                              'product',
                              'body',
                              productTdBaseClass,
                              multicardGroupBodyIndentPx,
                            )}
                          >
                            <ProductCollapsedRowCell
                              product={product}
                              expanded={expandedProductIds.has(product.id)}
                              onToggleExpand={() => toggleProductExpanded(product.id)}
                              showExpandControl={rowShowsPromotedProductUi}
                              reserveExpandGutter={rowReserveExpandGutter}
                              showPromoteUnderPhoto={rowShowPromoteUnderPhoto}
                              onPromote={handlePromoteNotPromotedProduct}
                              onProductTitleClick={
                                primaryCpcCampaign
                                  ? () => openProductNestedCampaign(primaryCpcCampaign)
                                  : undefined
                              }
                              allTabListRowIndex={rowAllTabListRowIndex}
                              multicardGroupMemberNested={
                                conceptAllProductsPickTab &&
                                rowInMulticardGroup &&
                                multicardGroupExpanded
                              }
                              multicardSearchHighlight={rowMulticardSearchHighlight}
                            />
                          </td>
                        ) : null}
                        {conceptAllProductsPickTab && productsColVisible(MULTICARD_GLUE_LEADER_COLUMN_ID) ? (
                          <td
                            {...productsTablePinnedCellProps(
                              'glueLeader',
                              'body',
                              MULTICARD_GLUE_LEADER_TD_CLASS,
                              multicardGroupBodyIndentPx,
                            )}
                          >
                            <MulticardGlueLeaderCell insight={rowGlueLeaderInsight} />
                          </td>
                        ) : null}
                        {showProductsCampaignTypeColumn ? (
                          <td
                            {...productsTablePinnedCellProps(
                              'campaignType',
                              'body',
                              'p-4 align-top',
                            )}
                          />
                        ) : null}
                        {showProductsBidColumn ? (
                          <td {...productsTablePinnedCellProps('bid', 'body', 'px-2 py-3 align-top')} />
                        ) : null}
                        {productsColVisible('budgetRemainder') ? (
                          <td
                            {...productsTablePinnedCellProps(
                              'budgetRemainder',
                              'body',
                              'p-4 align-top',
                            )}
                          />
                        ) : null}
                        {productsColVisible('dailyLimit') ? (
                          <td
                            {...productsTablePinnedCellProps(
                              'dailyLimit',
                              'body',
                              'px-2 py-3 align-top',
                            )}
                          />
                        ) : null}
                        {productsColVisible('tags') ? (
                        <td
                          className={
                            rowCompactNotPromotedStyle
                              ? CONCEPT_NOT_PROMOTED_TAGS_TD_CLASS
                              : 'p-4 align-top w-[220px] min-w-[220px] max-w-[240px]'
                          }
                        >
                          <div
                            className={`flex flex-wrap items-center gap-1 ${
                              rowCompactNotPromotedStyle ? 'mt-0' : 'mt-1.5 gap-1.5'
                            }`}
                            ref={openTagProductId === product.id && getProductTags(product).length > 0 ? tagDropdownAnchorRef : undefined}
                          >
                                {getProductTags(product).length > 0 ? (
                                  <ProductTagsDisplay
                                    tags={getProductTags(product)}
                                    tagColorByTagName={tagColorByTagName}
                                    onClick={() => setOpenTagProductId(openTagProductId === product.id ? null : product.id)}
                                  />
                                ) : (
                                  <button
                                    ref={openTagProductId === product.id ? tagDropdownAnchorRef : undefined}
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setOpenTagProductId(openTagProductId === product.id ? null : product.id); }}
                                    className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                                    title="Добавить ярлыки"
                                    aria-label="Ярлыки"
                                  >
                                    <Plus className="w-2.5 h-2.5" />
                                  </button>
                                )}
                          </div>
                          {openTagProductId === product.id && (
                            <TagDropdown
                              anchorRef={tagDropdownAnchorRef}
                              tags={getProductTags(product)}
                              tagColorByTagName={tagColorByTagName}
                              tagUsageCountByName={tagUsageCountByName}
                              deletedTags={deletedTags}
                              onRestoreTagGlobally={(tagName) => {
                                setDeletedTags(prev => prev.filter(t => t !== tagName));
                              }}
                              onTagError={(reason) => {
                                if (reason === 'max-per-product') {
                                  setTagError('Нельзя добавить больше 15 ярлыков к одному товару.');
                                }
                              }}
                              onDeleteTagGlobally={(tagName) => {
                                // Удаляем ярлык из цветов
                                setTagColorByTagName(prev => {
                                  const next = { ...prev };
                                  delete next[tagName];
                                  return next;
                                });

                                // Помечаем ярлык как глобально удалённый (скрываем в товарах, кампаниях и фильтрах)
                                setDeletedTags(prev => prev.includes(tagName) ? prev : [...prev, tagName]);
                              }}
                              onClose={() => setOpenTagProductId(null)}
                              onSave={(newTags, newColors) => {
                                setProductTagsOverride(prev => ({ ...prev, [product.id]: newTags }));
                                // Важно: при переименовании ярлыка старый ключ должен исчезнуть.
                                // Поэтому не мерджим, а заменяем целиком карту цветов ярлыков.
                                setTagColorByTagName(() => newColors);
                              }}
                            />
                          )}
                        </td>
                        ) : null}
                        {conceptBonusCampaignColumn ? (
                          <td
                            className={
                              listRowIndex < 3
                                ? 'group/bonus cursor-pointer px-1.5 py-1.5 align-middle'
                                : CONCEPT_NOT_PROMOTED_BONUS_CAMPAIGN_TD_CLASS
                            }
                            role={listRowIndex < 3 ? 'button' : undefined}
                            tabIndex={listRowIndex < 3 ? 0 : undefined}
                            onClick={
                              listRowIndex < 3
                                ? (e) => {
                                    e.stopPropagation();
                                    setNotPromotedBonusModalProducts([product]);
                                  }
                                : undefined
                            }
                            onKeyDown={
                              listRowIndex < 3
                                ? (e) => {
                                    if (e.key !== 'Enter' && e.key !== ' ') return;
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setNotPromotedBonusModalProducts([product]);
                                  }
                                : undefined
                            }
                          >
                            {listRowIndex < 3 ? (
                              <div className="rounded-[10px] px-2 py-1.5 transition-colors group-hover/bonus:bg-[#F3E8FF] group-focus-visible/bonus:bg-[#F3E8FF]">
                                <div className="mb-1 text-xs text-gray-400 transition-colors group-hover/bonus:text-gray-950 group-focus-visible/bonus:text-gray-950">
                                  До 14 сентября
                                </div>
                                <div className="inline-flex items-center gap-1.5 text-sm font-medium text-[#9A41FE]">
                                  <Gift className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                  {listRowIndex === 2 ? '5 000 B' : '3 000 B'}
                                  <ChevronRight
                                    className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover/bonus:opacity-100 group-focus-visible/bonus:opacity-100"
                                    aria-hidden
                                  />
                                </div>
                              </div>
                            ) : null}
                          </td>
                        ) : null}
                        {productsColVisible(PRODUCTS_RECOMMENDED_BID_CPC_SEARCH_COLUMN_ID) ? (
                          <td className={CONCEPT_NOT_PROMOTED_AVERAGE_BID_TD_CLASS}>
                            <ProductRecommendedCpcSearchBidCell product={product} />
                          </td>
                        ) : null}
                        {productsColVisible(PRODUCTS_RECOMMENDED_BID_CPM_SEARCH_COLUMN_ID) ? (
                          <td className={CONCEPT_NOT_PROMOTED_AVERAGE_BID_TD_CLASS}>
                            <ProductRecommendedCpmSearchBidCell product={product} />
                          </td>
                        ) : null}
                        {productsColVisible(PRODUCTS_RECOMMENDED_BID_CPM_REC_COLUMN_ID) ? (
                          <td className={CONCEPT_NOT_PROMOTED_AVERAGE_BID_TD_CLASS}>
                            <ProductRecommendedCpmRecBidCell product={product} />
                          </td>
                        ) : null}
                        {productsColVisible(PRODUCTS_STAT_SPACER_COLUMN_ID) ? (
                          <td className={PRODUCTS_STAT_SPACER_CELL_CLASS} aria-hidden />
                        ) : null}
                        {PRODUCTS_STAT_COLUMN_LABELS.map((label) => {
                          if (!productsColVisible(productsStatColumnId(label))) return null;
                          if (
                            conceptAllProductsPickTab &&
                            rowIsConceptNotPromoted
                          ) {
                            return (
                              <td
                                key={label}
                                className={
                                  rowCompactNotPromotedStyle
                                    ? CONCEPT_NOT_PROMOTED_STAT_TD_CLASS
                                    : PRODUCTS_STAT_TD_CLASS
                                }
                                aria-hidden
                              />
                            );
                          }
                          const rowAgg = productRowStatsAgg(
                            product,
                            rowUsesOrganicProductStats,
                          );
                          const stats = rowAgg ? buildExtendedProductStats(rowAgg) : null;
                          return (
                            <td
                              key={label}
                              className={
                                rowCompactNotPromotedStyle
                                  ? CONCEPT_NOT_PROMOTED_STAT_TD_CLASS
                                  : PRODUCTS_STAT_TD_CLASS
                              }
                            >
                              {stats ? (
                                rowUsesOrganicProductStats && label === 'Показы' ? (
                                  <ConceptJamLockedImpressionsMetricCell
                                    stats={stats}
                                    productId={product.id}
                                    changes={rowAgg ?? undefined}
                                  />
                                ) : (
                                  <ProductsStatMetricCell
                                    label={label}
                                    stats={stats}
                                    productId={product.id}
                                    changes={rowAgg}
                                    compact={rowCompactNotPromotedStyle}
                                    showTrend={!rowUsesOrganicProductStats}
                                  />
                                )
                              ) : (
                                <ProductsStatNotAvailableCell
                                  compact={rowCompactNotPromotedStyle}
                                  hint={
                                    rowUsesOrganicProductStats
                                      ? conceptNotPromotedAssociatedStatNaHint(label)
                                      : undefined
                                  }
                                />
                              )}
                            </td>
                          );
                        })}
                        {productsColVisible(PRODUCTS_STOCK_COLUMN_ID) ? (
                          <td className={productStockTableTdClass(conceptStockCompactTable)}>
                            <ProductStockRemainderCell
                              product={product}
                              compact={conceptStockCompactTable}
                            />
                          </td>
                        ) : null}
                      </tr>
                      {productsPickTab === 'not_promoted' &&
                      listRowIndex < 4 &&
                      !dismissedNotPromotedBonusBannerIds.has(product.id) ? (
                        <tr className="!border-t-0 hover:bg-transparent">
                          <td colSpan={32} className="px-3 pb-3 pt-0">
                            <div className="pl-12">
                              <NotPromotedBonusCampaignBanner
                                onOpenCampaign={() => setNotPromotedBonusModalProducts([product])}
                                onDismiss={() =>
                                  setDismissedNotPromotedBonusBannerIds((prev) => {
                                    const next = new Set(prev);
                                    next.add(product.id);
                                    return next;
                                  })
                                }
                              />
                            </div>
                          </td>
                        </tr>
                      ) : null}
                      {/* Вложенные строки кампаний — вид как на вкладке «Кампании» */}
                      {rowShowsPromotedProductUi && expandedProductIds.has(product.id) ? (
                      <>
                      {productsPickTab === 'promoted' &&
                      listRowIndex < 3 &&
                      !dismissedNotPromotedBonusBannerIds.has(product.id) ? (
                        <tr className="relative bg-gray-50/50 hover:bg-gray-50 transition-colors">
                          {(() => {
                            const pinned = productsTablePinnedCellProps(
                              'select',
                              'bodyNested',
                              PRODUCTS_SELECT_TD_CLASS,
                            );
                            return (
                          <td
                            className={`${pinned.className} relative overflow-visible`}
                            style={pinned.style}
                          >
                            <div className="pointer-events-none absolute inset-y-0 left-0 z-[13] flex w-[100cqw] max-w-[100cqw] items-center justify-end pr-3">
                              <div className="pointer-events-auto flex items-center gap-2 rounded-xl bg-gray-50/95 py-1 pl-3">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setNotPromotedBonusModalProducts([product]);
                                  }}
                                  className="inline-flex items-center rounded-xl bg-[#2E3038] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#23252c]"
                                >
                                  К кампании
                                </button>
                                <button
                                  type="button"
                                  aria-label="Скрыть бонусную кампанию"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDismissedNotPromotedBonusBannerIds((prev) => {
                                      const next = new Set(prev);
                                      next.add(product.id);
                                      return next;
                                    });
                                  }}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-gray-500 shadow-sm ring-1 ring-black/[0.04] transition-colors hover:bg-gray-50 hover:text-gray-800"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </td>
                            );
                          })()}
                          {productsColVisible('product') ? (
                            <td
                              {...productsTablePinnedCellProps(
                                'product',
                                'bodyNested',
                                'px-4 py-3 pl-12 align-middle',
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => e.stopPropagation()}
                                >
                                  <ToggleSwitch
                                    checked={false}
                                    onChange={() => setNotPromotedBonusModalProducts([product])}
                                  />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setNotPromotedBonusModalProducts([product]);
                                    }}
                                    className="block w-full min-w-0 truncate text-left text-sm font-medium text-gray-800 transition-colors hover:text-[#9A41FE]"
                                    title="Кампания от 26.12.2024"
                                  >
                                    Кампания от 26.12.2024
                                  </button>
                                  <span className="mt-1.5 inline-flex rounded-md bg-[#F3E8FF] px-2 py-0.5 text-xs font-medium text-[#7C3AED]">
                                    Бонусная кампания
                                  </span>
                                </div>
                              </div>
                            </td>
                          ) : null}
                          {showProductsCampaignTypeColumn ? (
                            <td
                              {...productsTablePinnedCellProps(
                                'campaignType',
                                'bodyNested',
                                'p-4 align-top',
                              )}
                            >
                              <ProductCampaignTypeCell type="CPC" />
                            </td>
                          ) : null}
                          {showProductsBidColumn ? (
                            <td
                              {...productsTablePinnedCellProps('bid', 'bodyNested', 'px-2 py-3 align-top')}
                            />
                          ) : null}
                          {productsColVisible('budgetRemainder') ? (
                            <td
                              {...productsTablePinnedCellProps(
                                'budgetRemainder',
                                'bodyNested',
                                'p-4 align-middle',
                              )}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNotPromotedBonusModalProducts([product]);
                                }}
                                className="inline-flex items-center gap-1 text-sm font-semibold text-[#9A41FE] transition-colors hover:text-[#7C3AED]"
                              >
                                <Gift className="h-4 w-4 shrink-0" aria-hidden />
                                3 000 B
                              </button>
                              <div className="mt-1 text-xs text-gray-400">До 14 сентября</div>
                            </td>
                          ) : null}
                          {productsColVisible('dailyLimit') ? (
                            <td
                              {...productsTablePinnedCellProps(
                                'dailyLimit',
                                'bodyNested',
                                'px-2 py-3 align-top',
                              )}
                            />
                          ) : null}
                          {productsColVisible('tags') ? <td className="p-4 w-[220px]" /> : null}
                          {conceptBonusCampaignColumn ? (
                            <td className={CONCEPT_NOT_PROMOTED_BONUS_CAMPAIGN_TD_CLASS} />
                          ) : null}
                          {productsColVisible(PRODUCTS_RECOMMENDED_BID_CPC_SEARCH_COLUMN_ID) ? (
                            <td className={CONCEPT_NOT_PROMOTED_AVERAGE_BID_TD_CLASS} />
                          ) : null}
                          {productsColVisible(PRODUCTS_RECOMMENDED_BID_CPM_SEARCH_COLUMN_ID) ? (
                            <td className={CONCEPT_NOT_PROMOTED_AVERAGE_BID_TD_CLASS} />
                          ) : null}
                          {productsColVisible(PRODUCTS_RECOMMENDED_BID_CPM_REC_COLUMN_ID) ? (
                            <td className={CONCEPT_NOT_PROMOTED_AVERAGE_BID_TD_CLASS} />
                          ) : null}
                          {productsColVisible(PRODUCTS_STAT_SPACER_COLUMN_ID) ? (
                            <td className={PRODUCTS_STAT_SPACER_CELL_CLASS} aria-hidden />
                          ) : null}
                          {PRODUCTS_STAT_COLUMN_LABELS.map((label) =>
                            productsColVisible(productsStatColumnId(label)) ? (
                              <td key={label} className={`${PRODUCTS_STAT_TD_CLASS} !align-middle`} />
                            ) : null,
                          )}
                          {productsColVisible(PRODUCTS_STOCK_COLUMN_ID) ? (
                            <td className={PRODUCTS_STOCK_TD_CLASS} />
                          ) : null}
                        </tr>
                      ) : null}
                      {product.campaigns.map((camp) => {
                        const effectiveStatus = (camp.status === 'draft' || camp.status === 'error' ? camp.status : (productCampaignStatusOverride[camp.id] ?? camp.status)) as 'active' | 'paused' | 'draft' | 'error';
                        const effectiveStatusText = effectiveStatus === 'active' ? 'активна' : effectiveStatus === 'paused' ? 'приостановлена' : camp.statusText;
                        return (
                        <tr key={camp.id} className="bg-gray-50/50 hover:bg-gray-50 transition-colors">
                            {conceptAllProductsPickTab && multicardRail === null ? (
                              <td
                                className="sticky left-0 z-[22] w-5 min-w-[20px] max-w-[20px] border-0 bg-gray-50 p-0 align-top"
                                aria-hidden
                              />
                            ) : null}
                            <td
                              {...(() => {
                                const pinned = productsTablePinnedCellProps(
                                  'select',
                                  'bodyNested',
                                  conceptAllProductsPickTab
                                    ? conceptMulticardProductsSelectTdClass
                                    : conceptPromotedProductsWideTable
                                      ? PRODUCTS_SELECT_TD_CLASS
                                      : PRODUCTS_SELECT_TD_CLASS,
                                  multicardCheckboxIndentPx,
                                );
                                return {
                                  ...pinned,
                                  style: {
                                    ...pinned.style,
                                    ...(multicardCheckboxIndentPx > 0
                                      ? { paddingLeft: multicardCheckboxIndentPx }
                                      : {}),
                                  },
                                };
                              })()}
                            />
                            {/* Товар / кампания */}
                            {productsColVisible('product') ? (
                            <td
                              {...productsTablePinnedCellProps(
                                'product',
                                'bodyNested',
                                'px-4 py-3 pl-12 align-middle',
                                multicardGroupBodyIndentPx,
                              )}
                            >
                            <div
                              className={`flex items-center gap-3 ${
                                multicardGroupBodyIndentPx > 0
                                  ? CONCEPT_MULTICARD_GROUP_MEMBER_CONTENT_INDENT_CLASS
                                  : ''
                              }`}
                            >
                              <ToggleSwitch
                                checked={effectiveStatus === 'active'}
                                onChange={(checked) => setProductCampaignStatusOverride(prev => ({ ...prev, [camp.id]: checked ? 'active' : 'paused' }))}
                                disabled={camp.status === 'draft' || camp.status === 'error'}
                              />
                              <ProductTableThumb productId={product.id} src={product.image} category={product.category} />
                                <div className="min-w-0 flex-1">
                                {camp.type === 'CPC' || camp.type === 'CPM' ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openProductNestedCampaign(camp);
                                    }}
                                    className="block w-full min-w-0 truncate text-left text-sm font-medium text-gray-800 transition-colors hover:text-[#9A41FE]"
                                    title={camp.name}
                                  >
                                    {camp.name}
                                  </button>
                                ) : (
                                  <p
                                    className="truncate text-sm font-medium text-gray-800"
                                    title={camp.name}
                                  >
                                    {camp.name}
                                  </p>
                                )}
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs leading-none text-gray-500">
                                  <StatusBadge status={effectiveStatus} text={effectiveStatusText} />
                                  <span>ID {camp.campaignId}</span>
                                </div>
                                {!showProductsCampaignTypeColumn ? (
                                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                                    <span className="text-sm font-semibold text-gray-900">{camp.type}</span>
                                    <span className="rounded bg-gray-100 p-1">
                                      {camp.type === 'CPC' ? (
                                        <Search className="h-4 w-4 text-gray-400" />
                                      ) : (
                                        <ThumbsUp className="h-4 w-4 text-gray-400" />
                                      )}
                                    </span>
                                    {listCampaignBidModeSubtitle(camp.typeDetails) ? (
                                      <span>{listCampaignBidModeSubtitle(camp.typeDetails)}</span>
                                    ) : null}
                                  </div>
                                ) : listCampaignBidModeSubtitle(camp.typeDetails) ? (
                                  <p className="mt-1 text-xs text-gray-500">
                                    {listCampaignBidModeSubtitle(camp.typeDetails)}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </td>
                            ) : null}
                            {conceptAllProductsPickTab && productsColVisible(MULTICARD_GLUE_LEADER_COLUMN_ID) ? (
                              <td
                                {...productsTablePinnedCellProps(
                                  'glueLeader',
                                  'bodyNested',
                                  MULTICARD_GLUE_LEADER_TD_CLASS,
                                  multicardGroupBodyIndentPx,
                                )}
                                aria-hidden
                              />
                            ) : null}
                            {showProductsCampaignTypeColumn ? (
                            <td
                              {...productsTablePinnedCellProps(
                                'campaignType',
                                'bodyNested',
                                'p-4 align-top',
                              )}
                            >
                              <ProductCampaignTypeCell type={camp.type} />
                            </td>
                            ) : null}
                            {showProductsBidColumn ? (
                            <td
                              {...productsTablePinnedCellProps('bid', 'bodyNested', 'px-2 py-3 align-top')}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ProductCampaignBidCell
                                camp={camp}
                                overrides={productCampaignBidOverride[camp.id]}
                                onCpmBidRounded={showCpmBidRoundedAlert}
                                onChange={(next) =>
                                  setProductCampaignBidOverride((prev) => ({
                                    ...prev,
                                    [camp.id]: next,
                                  }))
                                }
                              />
                            </td>
                            ) : null}
                            {productsColVisible('budgetRemainder') ? (
                            <td
                              {...productsTablePinnedCellProps(
                                'budgetRemainder',
                                'bodyNested',
                                'p-4 align-top',
                              )}
                            >
                            <div className="font-semibold text-gray-900">{formatForDisplay(camp.remainingBudget)} ₽</div>
                            {camp.autoRefill && (
                              <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Автопополнение
                              </div>
                            )}
                          </td>
                            ) : null}
                            {productsColVisible('dailyLimit') ? (
                            <td
                              {...productsTablePinnedCellProps(
                                'dailyLimit',
                                'bodyNested',
                                'px-2 py-3 align-top',
                              )}
                              onClick={(e) => e.stopPropagation()}
                            >
                            <DailyLimitCell
                              dailyLimit={camp.dailyLimit ?? null}
                              dailyLimitExhausted={camp.dailyLimitExhausted}
                              isCpc={camp.type === 'CPC'}
                              maxCpcBidRub={camp.type === 'CPC' ? listCampaignMaxCpcBidRub(camp) : 0}
                              onClick={camp.type === 'CPC' ? () => openDailyLimitModalForCampaign(camp) : undefined}
                            />
                          </td>
                            ) : null}
                            {productsColVisible('tags') ? <td className="p-4 w-[220px]" /> : null}
                            {conceptBonusCampaignColumn ? (
                              <td className={CONCEPT_NOT_PROMOTED_BONUS_CAMPAIGN_TD_CLASS} />
                            ) : null}
                            {productsColVisible(PRODUCTS_RECOMMENDED_BID_CPC_SEARCH_COLUMN_ID) ? (
                              <td className={CONCEPT_NOT_PROMOTED_AVERAGE_BID_TD_CLASS} />
                            ) : null}
                            {productsColVisible(PRODUCTS_RECOMMENDED_BID_CPM_SEARCH_COLUMN_ID) ? (
                              <td className={CONCEPT_NOT_PROMOTED_AVERAGE_BID_TD_CLASS} />
                            ) : null}
                            {productsColVisible(PRODUCTS_RECOMMENDED_BID_CPM_REC_COLUMN_ID) ? (
                              <td className={CONCEPT_NOT_PROMOTED_AVERAGE_BID_TD_CLASS} />
                            ) : null}
                            {productsColVisible(PRODUCTS_STAT_SPACER_COLUMN_ID) ? (
                              <td className={PRODUCTS_STAT_SPACER_CELL_CLASS} aria-hidden />
                            ) : null}
                            {PRODUCTS_STAT_COLUMN_LABELS.map((label) => {
                              if (!productsColVisible(productsStatColumnId(label))) return null;
                              const stats = buildExtendedProductStats(
                                {
                                  spend: camp.spend,
                                  impressions: camp.impressions,
                                  ctr: camp.ctr,
                                  orders: camp.orders,
                                  spendShare: camp.spendShare,
                                },
                                camp.avgPosition,
                              );
                              return (
                                <td key={label} className={`${PRODUCTS_STAT_TD_CLASS} !align-middle`}>
                                  <ProductsStatMetricCell
                                    label={label}
                                    stats={stats}
                                    productId={product.id}
                                    changes={{
                                      changeImpressions: camp.changeImpressions,
                                      changeCtr: camp.changeCtr,
                                      changeOrders: camp.changeOrders,
                                      changeShare: camp.changeShare,
                                      changePosition: camp.changePosition,
                                    }}
                                  />
                                </td>
                              );
                            })}
                            {productsColVisible(PRODUCTS_STOCK_COLUMN_ID) ? (
                              <td className={PRODUCTS_STOCK_TD_CLASS} />
                            ) : null}
                        </tr>
                        );
                      })}
                      </>
                      ) : null}
                      </>
                      ) : null}
                    </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {productsForTable.length >= PRODUCTS_PAGINATION_MIN_ITEMS ? (
              <div className="flex items-center justify-start px-4 py-3 border-t border-gray-100">
                <div className="flex items-center gap-1">
                  <button className="px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded">‹</button>
                  <button className="px-2.5 py-1.5 text-sm bg-purple-600 text-white rounded font-medium">1</button>
                  <span className="px-1 text-gray-400">...</span>
                  <button className="px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded">5</button>
                  <button className="px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded">6</button>
                  <button className="px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded">7</button>
                  <span className="px-1 text-gray-400">...</span>
                  <button className="px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded">134</button>
                  <button className="px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded">›</button>
                </div>
              </div>
            ) : null}
          </div>

          {selectedProductIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-2 rounded-xl border border-gray-200 bg-white/90 p-2 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4 fade-in">
              <span className="whitespace-nowrap px-3 text-sm font-medium text-gray-800">
                Выбрано: {selectedProductIds.length}{' '}
                {getPlural(
                  selectedProductIds.length,
                  'товар',
                  'товара',
                  'товаров',
                )}
              </span>
              <div className="h-6 w-px bg-gray-200" />
              <button
                type="button"
                onClick={handleBulkCreateCampaignFromProducts}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
              >
                {!conceptCompactProductsTable ? (
                  <Plus className="h-4 w-4" aria-hidden />
                ) : null}
                {conceptCompactProductsTable
                  ? 'Продвигать'
                  : 'Создать кампанию'}
              </button>
              {selectedV3BonusProducts.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setNotPromotedBonusModalProducts(selectedV3BonusProducts)}
                  className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#F3E8FF] px-4 py-2 text-sm font-semibold text-[#9A41FE] transition-colors hover:bg-[#E9D5FF]"
                >
                  <Gift className="h-4 w-4 shrink-0" aria-hidden />
                  За бонусы {selectedV3BonusProducts.length}{' '}
                  {getPlural(selectedV3BonusProducts.length, 'товар', 'товара', 'товаров')}
                </button>
              ) : null}
              {isProductPromotionConceptPage && !conceptCompactProductsTable && (
                <div
                  className={`relative group/product-bid ${selectedProductsCampaignCount === 0 ? 'pointer-events-none opacity-50' : ''}`}
                >
                  <button
                    type="button"
                    disabled={selectedProductsCampaignCount === 0}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 transition-colors group-hover/product-bid:bg-gray-50 hover:bg-gray-50 disabled:cursor-not-allowed"
                    aria-haspopup="menu"
                  >
                    Работать со ставкой
                    <ChevronDown
                      className="h-4 w-4 shrink-0 text-gray-500 transition-transform group-hover/product-bid:rotate-180 group-focus-within/product-bid:rotate-180"
                      aria-hidden
                    />
                  </button>
                  {selectedProductsCampaignCount > 0 && (
                    <div className="invisible absolute bottom-full left-0 z-[90] pt-2 opacity-0 transition-all group-hover/product-bid:visible group-hover/product-bid:opacity-100 group-focus-within/product-bid:visible group-focus-within/product-bid:opacity-100">
                      <ul
                        role="menu"
                        className="min-w-[280px] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
                      >
                        {PRODUCT_BID_BULK_ACTIONS.map((action) => (
                          <li key={action.id} role="none">
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => openProductBidBulkModal(action.id)}
                              className="block w-full px-3 py-2.5 text-left text-sm text-gray-800 transition-colors hover:bg-gray-50"
                            >
                              {action.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={() => setSelectedProductIds([])}
                className="ml-1 rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                aria-label="Снять выделение"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </>
      )}

      {isMassBudgetRefillModalOpen && (
        <BudgetRefillModal
          isOpen={isMassBudgetRefillModalOpen}
          onClose={() => {
            setIsMassBudgetRefillModalOpen(false);
            setMassBudgetRefillTargetIds([]);
          }}
          onSave={(amount) => {
            const targetIds = new Set(massBudgetRefillTargetIds);
            setAllCampaigns((prev) =>
              prev.map((c) =>
                targetIds.has(c.id)
                  ? { ...c, remainingBudget: (c.remainingBudget || 0) + amount }
                  : c,
              ),
            );
            setIsMassBudgetRefillModalOpen(false);
            setMassBudgetRefillTargetIds([]);
          }}
          currentBudget={0}
          campaignCount={
            massBudgetRefillTargetIds.length > 0
              ? massBudgetRefillTargetIds.length
              : LIST_HEADER_V4_BONUS_REFILL_CAMPAIGN_COUNT
          }
        />
      )}
      {isBudgetRefillModalOpen && selectedCampaignForRefill && (
        <BudgetRefillModal
          isOpen={isBudgetRefillModalOpen}
          onClose={() => {
            setIsBudgetRefillModalOpen(false);
            setSelectedCampaignForRefill(null);
          }}
          onSave={(amount) => {
            setAllCampaigns(prev => prev.map(c => 
              c.id === selectedCampaignForRefill.id 
                ? { ...c, remainingBudget: (c.remainingBudget || 0) + amount }
                : c
            ));
            setIsBudgetRefillModalOpen(false);
            setSelectedCampaignForRefill(null);
          }}
          currentBudget={selectedCampaignForRefill.remainingBudget || 0}
        />
      )}
      {isBulkDailyLimitModalOpen && bulkDailyLimitTargets.length > 0 && (
        <BulkDailyLimitModal
          isOpen={isBulkDailyLimitModalOpen}
          onClose={() => {
            setIsBulkDailyLimitModalOpen(false);
            setBulkDailyLimitTargets([]);
          }}
          targets={bulkDailyLimitTargets}
          onApply={handleBulkDailyLimitApply}
        />
      )}
      <CampaignListAutomationModals
        target={listAutomationModal?.target ?? null}
        kind={listAutomationModal?.kind ?? null}
        onClose={() => setListAutomationModal(null)}
        onAutoRefillSaved={(campaignId) => {
          setAllCampaigns((prev) =>
            prev.map((c) => (c.campaignId === campaignId ? { ...c, autoRefill: true } : c)),
          );
          setProductBulkNotice('Автопополнение настроено');
        }}
        onFlexibleLimitSaved={() => {
          setProductBulkNotice('Настройки гибкого лимита сохранены');
        }}
        onBidChasingSaved={() => {
          setProductBulkNotice('Автобиддер настроен');
        }}
      />
      {isDailyLimitModalOpen && dailyLimitModalCampaign && (
        <DailyLimitModal
          isOpen={isDailyLimitModalOpen}
          onClose={() => {
            setIsDailyLimitModalOpen(false);
            setSelectedCampaignForRefill(null);
          }}
          currentBudget={dailyLimitModalCampaign.remainingBudget || 0}
          dailyLimit={dailyLimitModalCampaign.dailyLimit || null}
          maxCpcBidRub={listCampaignMaxCpcBidRub(dailyLimitModalCampaign)}
          onLimitAboveBudget={(requestedLimit, shortfall) => {
            setLimitShortfallNotification({ requestedLimit, shortfall });
          }}
          onDailyLimitChange={(limit, isScheduled = false) => {
            if (dailyLimitModalCampaign) {
              const patch =
                limit === null
                  ? { dailyLimit: null as null, scheduledDailyLimit: null as null }
                  : isScheduled
                    ? { scheduledDailyLimit: limit }
                    : { dailyLimit: limit, scheduledDailyLimit: null as null };
              onPersistCampaignListPatch?.(dailyLimitModalCampaign.campaignId, patch);
              setAllCampaigns(prev => prev.map(c => {
                if (c.id === dailyLimitModalCampaign.id) {
                  if (limit === null) {
                    return { ...c, dailyLimit: null, scheduledDailyLimit: null };
                  }
                  if (isScheduled) {
                    // Запланированный лимит на новый день
                    return { ...c, scheduledDailyLimit: limit };
                  }
                  // Обычное сохранение лимита (применяется сразу)
                  return { ...c, dailyLimit: limit, scheduledDailyLimit: null };
                }
                return c;
              }));
            }
          }}
        />
      )}

      {notPromotedBonusModalProducts && notPromotedBonusModalProducts.length > 0 ? (
        <NotPromotedBonusCampaignModal
          products={notPromotedBonusModalProducts.map((product) => {
            const listRowIndex = sortedProductsForTable.findIndex((row) => row.id === product.id);
            return { ...product, ...notPromotedV3BonusOffer(listRowIndex) };
          })}
          onClose={() => setNotPromotedBonusModalProducts(null)}
          onContinueWithoutBonuses={() => {
            const selected = notPromotedBonusModalProducts;
            setNotPromotedBonusModalProducts(null);
            if (!selected?.length) return;
            if (selected.length === 1) {
              handlePromoteNotPromotedProduct(selected[0]);
              return;
            }
            const seeds = selected.map(productRowToSingleCampaignSeed);
            beginRepeatLaunchFlow({
              product: seeds[0]!,
              products: seeds,
            });
          }}
        />
      ) : null}

      {isCampaignsPage && (
        <div
          className="fixed bottom-0 left-0 right-0 z-[45] border-t border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-6px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm"
          role="toolbar"
          aria-label="Вариант карточки уведомления"
        >
          <div className="mx-auto flex w-full max-w-[1920px] flex-wrap items-center justify-center gap-2 sm:gap-3">
            {([1, 2, 3, 4] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setNotificationCardVariant(v)}
                className={`min-w-[7.5rem] rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${
                  notificationCardVariant === v
                    ? 'bg-[#9a41fe] text-white shadow-sm'
                    : 'border border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100'
                }`}
              >
                Вариант {v}
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};