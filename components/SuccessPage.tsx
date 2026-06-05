import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  CAMPAIGNS_WITH_WIDGETS_V1_PATH,
  isCampaignsWidgetsV1Layout,
  PRODUCT_PROMOTION_CONCEPT_PATH,
} from '../constants/campaignListRoutes';
import { OverviewMiniWidgetsForCampaignsList } from '../pages/OverviewPage';
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
    Package,
    Gift,
    RefreshCw,
    MoreVertical,
    Trash2,
    Edit2,
    Check
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
} from './SuccessPageTestData';
import {
  useProfile,
  type ProfileId,
  type RepeatLaunchPreset,
  type SingleCampaignSeedProduct,
} from './ProfileContext';
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

const DailyLimitInfoTooltip: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <HelpCircle className="w-4 h-4 text-gray-600 cursor-help" />
      {isVisible && (
        <>
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-80 h-2" onMouseEnter={() => setIsVisible(true)}></div>
          <div 
            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50 text-left"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
          >
            <p className="font-semibold mb-2">Как работает дневной лимит?</p>
            <p className="mb-2">Сумму, которую вы зададите в лимите мы будем расходовать в течение дня равномерно, она не сгорит за 1-2 часа. Так вы достигаете наилучших показателей по показам.</p>
            <a href="#" className="text-purple-300 hover:underline">Читать подробнее</a>
          </div>
        </>
      )}
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
  editResult: { success: number; error: number; failedIds?: number[] } | null;
  onClearEditResult: () => void;
  onOpenReview: () => void;
  onCancelEdits: () => void;
  onOpenHistoryModal: () => void;
  showUploadHint?: boolean;
  onDismissUploadHint?: () => void;
  onOpenCpcCampaign: (payload: {
    campaignId: number;
    name: string;
    remainingBudget: number | null;
    dailyLimit: number | null;
    scheduledDailyLimit: number | null;
    dailyLimitExhausted?: boolean;
    fromReadyToRepeat?: boolean;
    repeatLaunchPreset?: RepeatLaunchPreset;
  }) => void;
  onUpdateCampaignData?: (campaignId: number, data: { name?: string; remainingBudget?: number | null; dailyLimit?: number | null; scheduledDailyLimit?: number | null }) => void;
  onRegisterUpdateFn?: (fn: (campaignId: number, data: { name?: string; remainingBudget?: number | null; dailyLimit?: number | null; scheduledDailyLimit?: number | null }) => void) => void;
  onOpenSingleCampaign?: () => void;
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
  agg?: { spend: number; impressions: number; ctr: number; orders: number; spendShare: number; changeSpend?: number; changeImpressions?: number; changeCtr?: number; changeOrders?: number; changeShare?: number };
};

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

type ProductsPickTab = 'all' | 'not_promoted' | 'promoted' | 'growth' | 'ab' | 'promo';

const PRODUCTS_PICK_TABS: { id: ProductsPickTab; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'not_promoted', label: 'Не продвигаются' },
  { id: 'promoted', label: 'Продвигаются' },
  { id: 'growth', label: 'Рост заказов' },
  { id: 'ab', label: 'А/Б тест' },
  { id: 'promo', label: 'В акциях' },
];

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
}: {
  value: number;
  onChange: (value: number) => void;
  presets: number[];
  min: number;
}) {
  const [inputValue, setInputValue] = useState(String(value || ''));
  useEffect(() => {
    setInputValue(String(value || ''));
  }, [value]);

  const commit = (raw: string) => {
    let numericValue = parseDisplayValue(raw);
    if (Number.isNaN(numericValue) || numericValue < min) numericValue = min;
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
}: {
  camp: ProductCampaign;
  value: number;
  onChange: (value: number) => void;
  compact?: boolean;
}) {
  const min = productCampaignBidMin(camp);
  const [inputValue, setInputValue] = useState(String(value || ''));
  useEffect(() => {
    setInputValue(String(value || ''));
  }, [value]);

  const commit = (raw: string) => {
    let numericValue = parseDisplayValue(raw);
    if (Number.isNaN(numericValue) || numericValue < min) numericValue = min;
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
}: {
  camp: ProductCampaign;
  overrides?: ProductCampaignBidOverride;
  onChange: (next: ProductCampaignBidOverride) => void;
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
}: {
  kind: ProductBidBulkModalKind;
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  campaignCount: number;
  productCount: number;
  onApply: () => void;
}) {
  const presets = productBidPresets(kind);
  const min = productBidMin(kind);
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

function productsStatColumnId(label: (typeof PRODUCTS_STAT_COLUMN_LABELS)[number]): string {
  return `stat:${label}`;
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

function ProductsStatMetricCell({
  label,
  stats,
  productId,
  changes,
}: {
  label: (typeof PRODUCTS_STAT_COLUMN_LABELS)[number];
  stats: ProductStatsExtended;
  productId: string;
  changes?: ProductStatsChanges;
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
    <div className="flex flex-col gap-0.5 leading-none tabular-nums">
      <span className="text-sm font-semibold text-gray-900">{formatProductsStatValue(label, stats)}</span>
      <ProductsStatTrendBadge
        change={change}
        positiveIsGood={productsStatPositiveIsGood(label)}
        lowerIsBetter={lowerIsBetter}
      />
    </div>
  );
}

const PRODUCTS_STAT_TH_CLASS = 'p-4 text-left font-normal w-[130px] min-w-[120px]';
const PRODUCTS_STAT_TD_CLASS = 'p-4 align-top w-[130px] min-w-[120px]';

/** Ширина колонки «Товар» — как при раскрытых кампаниях, чтобы влезала мета-строка. */
const PRODUCTS_TABLE_PRODUCT_COL_CLASS = 'w-[520px] min-w-[520px] max-w-[520px]';

/** Закреплённые слева при горизонтальном скролле (порядок важен). */
const PRODUCTS_PINNED_COLUMNS = [
  { id: 'select' as const, width: 48, widthClass: 'w-12 min-w-[48px] max-w-[48px]' },
  { id: 'product' as const, width: 520, widthClass: PRODUCTS_TABLE_PRODUCT_COL_CLASS },
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
  campaignType: 'z-[19]',
  bid: 'z-[18]',
  budgetRemainder: 'z-[17]',
  dailyLimit: 'z-[16]',
};

const PRODUCTS_PINNED_BODY_Z: Record<(typeof PRODUCTS_PINNED_COLUMNS)[number]['id'], string> = {
  select: 'z-[11]',
  product: 'z-10',
  campaignType: 'z-[9]',
  bid: 'z-[8]',
  budgetRemainder: 'z-[7]',
  dailyLimit: 'z-[6]',
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

function productsPinnedLeftPx(columnId: string, visibility: Record<string, boolean>): number {
  let left = 0;
  for (const col of PRODUCTS_PINNED_COLUMNS) {
    if (col.id === columnId) return left;
    if (visibility[col.id] !== false) left += col.width;
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
): { className: string; style: React.CSSProperties } {
  const meta = PRODUCTS_PINNED_COLUMNS.find((c) => c.id === columnId)!;
  const z = variant === 'head' ? PRODUCTS_PINNED_HEAD_Z[columnId] : PRODUCTS_PINNED_BODY_Z[columnId];
  const bg =
    variant === 'head' ? 'bg-gray-50' : variant === 'bodyNested' ? 'bg-gray-50/80' : 'bg-white';
  const edgeShadow =
    showPinnedEdgeShadow && lastVisibleProductsPinnedColumnId(visibility) === columnId
      ? PRODUCTS_PINNED_EDGE_SHADOW_CLASS
      : '';
  return {
    className: [`sticky`, z, meta.widthClass, bg, edgeShadow, extraClass].filter(Boolean).join(' '),
    style: { left: productsPinnedLeftPx(columnId, visibility) },
  };
}

const PRODUCTS_PINNED_TH_CLASS = 'px-4 py-4 text-left font-normal align-middle';
const PRODUCTS_PINNED_TH_PRODUCT_CLASS = 'pl-[5px] pr-5 py-4 text-left font-normal align-middle';

const PRODUCT_TABLE_THUMB_CLASS =
  'h-[38px] w-[30px] shrink-0 rounded-md border border-gray-100 bg-gray-50 object-cover';

function ProductTableThumb({
  productId,
  src,
  category,
  alt = '',
}: {
  productId: string;
  src: string;
  category?: string;
  alt?: string;
}) {
  const [url, setUrl] = useState(() => resolveProductTableThumbSrc(productId, src, category));
  useEffect(() => {
    setUrl(resolveProductTableThumbSrc(productId, src, category));
  }, [src, productId, category]);
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
        if (url !== PRODUCT_TABLE_THUMB_FALLBACK) {
          setUrl(PRODUCT_TABLE_THUMB_FALLBACK);
          return;
        }
        if (url !== picsum) {
          setUrl(picsum);
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

function ProductCollapsedRowCell({
  product,
  expanded,
  onToggleExpand,
}: {
  product: ProductRow;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const campaignCount = product.campaigns.length;
  const showConflict = productHasCampaignConflict(product);

  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        onClick={onToggleExpand}
        className={`inline-flex shrink-0 items-center justify-center border-0 bg-transparent p-0 transition-colors ${
          expanded ? 'text-violet-600' : 'text-gray-400 hover:text-gray-600'
        }`}
        aria-expanded={expanded}
        aria-label={expanded ? 'Свернуть кампании' : 'Развернуть кампании'}
      >
        {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
      </button>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <ProductTableThumb productId={product.id} src={product.image} category={product.category} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-none text-gray-900">{product.name}</p>
          <div className="mt-0.5 flex min-w-0 flex-nowrap items-center gap-2 overflow-hidden text-xs leading-none text-gray-500">
            <span className="shrink-0 whitespace-nowrap">Арт. {product.articleWb}</span>
            {campaignCount > 0 ? (
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
      </div>
    </div>
  );
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
      agg,
    });
  }

  return { campaigns, productTree };
}

const PROFILE_1_LIST = buildCampaignsAndProductTree(PRODUCTS_SOURCE);
const PROFILE_2_LIST = buildCampaignsAndProductTree(PRODUCTS_SOURCE_PROFILE_2);

export function getProfileListData(profileId: ProfileId) {
  return profileId === '2' ? PROFILE_2_LIST : PROFILE_1_LIST;
}

const { campaigns: MOCK_CAMPAIGNS, productTree: MOCK_PRODUCTS_TREE } = PROFILE_1_LIST;

// Предсобранная CPC-кампания (вставка в таблицу «Кампании»)
const PREBUILT_CPC_CAMPAIGN_ID = 'prebuilt-cpc';
const PREBUILT_CPC_CAMPAIGN_CAMPAIGN_ID = 999999;
const PREBUILT_CPC_CAMPAIGN_BASE =
  MOCK_CAMPAIGNS.find((c) => c.type === 'CPC') ?? MOCK_CAMPAIGNS[0];

const PREBUILT_CPC_CAMPAIGN: DisplayCampaign = {
  ...(PREBUILT_CPC_CAMPAIGN_BASE as DisplayCampaign),
  id: PREBUILT_CPC_CAMPAIGN_ID,
  campaignId: PREBUILT_CPC_CAMPAIGN_CAMPAIGN_ID,
  status: 'paused',
  statusText: 'приостановлена',
  // На скрине в этой строке рядом с бюджетом стоит подарок и сумма 5000 ₽
  remainingBudget: 5000,
  budget: 5000,
  autoRefill: true,
  autoRefillStatus: 'ok',
  // В скрине по метрикам — нет данных
  spend: null,
  impressions: null,
  ctr: null,
  orders: null,
  spendShare: null,
  // Без бейджей/ошибок в этой вставной кампании
  tags: [],
  campaignTags: [],
  // Чтоб в «Дневном лимите» не показывать прогресс
  dailyLimit: null,
  dailyLimitExhausted: false,
  // Подменим заголовок под «предсобранную» логику
  name: 'Футболка хлопок мягкая приятная / CPC-кампания за 0 ₽',
  productId: 'pr7',
  category: 'Футболки',
  image: productTableThumbUrl('pr7', 'Футболки'),
};

function buildAllCampaignsForProfile(profileId: ProfileId): DisplayCampaign[] {
  const { campaigns } = getProfileListData(profileId);
  const list = profileId === '2' ? [...campaigns] : [PREBUILT_CPC_CAMPAIGN, ...campaigns];
  return list.map((c, index) => {
    const base = index === 1 ? { ...c, isBonusCampaign: true } : c;
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
  onClick?: () => void;
}> = ({ dailyLimit, dailyLimitExhausted, isCpc = true, onClick }) => {
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

  const tooltipText = isCpc && dailyLimit != null && exhausted
    ? `Лимит в ${formatForDisplay(dailyLimit)} ₽ на сегодня израсходован. Показы остановлены до завтра. Если хотите возобновить показы сейчас увеличьте лимит`
    : '';

  // Для кампаний CPM всегда показываем прочерк
  if (!isCpc) {
    return <span className="text-gray-400">—</span>;
  }

  const content =
    dailyLimit != null ? (
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
    ) : (
      <span className="text-sm font-medium text-blue-600">Настроить</span>
    );

  if (onClick != null) {
    return (
      <div
        className="relative inline-block"
        onMouseEnter={() => { clearHideTimeout(); setIsTooltipVisible(true); }}
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
        {isTooltipVisible && tooltipText && (
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
  onDailyLimitChange?: (limit: number | null, isScheduled?: boolean) => void;
  /** Когда пользователь пытается задать лимит выше бюджета — вызвать вместо показа ошибки в модалке (показать нотификашку на странице) */
  onLimitAboveBudget?: (requestedLimit: number, shortfall: number) => void;
}> = ({ isOpen, onClose, currentBudget, dailyLimit, onDailyLimitChange, onLimitAboveBudget }) => {
  const [isDailyLimitEnabled, setIsDailyLimitEnabled] = useState(false);
  const [dailyLimitValue, setDailyLimitValue] = useState('');
  const [savedDailyLimit, setSavedDailyLimit] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [budgetError, setBudgetError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (dailyLimit) {
        setIsDailyLimitEnabled(true);
        setDailyLimitValue(String(dailyLimit));
        setSavedDailyLimit(String(dailyLimit));
      } else {
        setIsDailyLimitEnabled(false);
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
                  setIsDailyLimitEnabled(true);
                  setDailyLimitValue('');
                  setSavedDailyLimit('');
                  setBudgetError('');
                } else {
                  setIsDailyLimitEnabled(false);
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
            {!isDailyLimitEnabled && (
              <p className="text-sm text-gray-500">Включите автопополнение, чтобы кампания не останавливалась</p>
            )}
            <div className="flex items-center gap-4">
              <div className="relative w-1/3">
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
                  placeholder="от 1 000₽"
                />
                <span className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${!isDailyLimitEnabled ? 'text-gray-300' : 'text-gray-400'}`}>₽</span>
              </div>
            </div>
            {budgetError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{budgetError}</p>
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <label className="flex items-start gap-2 text-xs">
                <Checkbox
                  className="mt-0.5 h-3 w-3 text-purple-600"
                  disabled={!isDailyLimitEnabled}
                />
                <span className={isDailyLimitEnabled ? 'text-gray-700' : 'text-gray-400'}>
                  Переносить неиспользованный лимит
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
              if (parsed < 1000) {
                setBudgetError(`Минимальная сумма дневного лимита: ${formatForDisplay(1000)} ₽`);
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

export const BudgetRefillModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (amount: number) => void;
  currentBudget: number;
  /** >1 — массовое пополнение (одна сумма на каждую кампанию) */
  campaignCount?: number;
}> = ({ isOpen, onClose, onSave, currentBudget, campaignCount }) => {
  const [refillAmount, setRefillAmount] = useState('3000');
  const [useBonuses, setUseBonuses] = useState(false);
  const [selectedPkgId, setSelectedPkgId] = useState(BONUS_PACKAGES[0].id);
  const [bonusValue, setBonusValue] = useState<number | string>(3000);
  const [budgetError, setBudgetError] = useState('');
  const [bonusError, setBonusError] = useState('');

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

  const massCount = campaignCount != null && campaignCount > 1 ? campaignCount : 0;
  const isMassRefill = massCount > 1;
  const modalTitle = isMassRefill
    ? `Пополнение бюджета для ${massCount} ${getPlural(massCount, 'кампании', 'кампаний', 'кампаний')}`
    : 'Пополнение бюджета';
  const amountLabel = isMassRefill ? 'Сумма пополнения для 1 кампании' : 'Сумма пополнения';

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-xl p-6 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-gray-900">{modalTitle}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="mb-6 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{amountLabel}</label>
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
              {isMassRefill && !budgetError ? (
                <p className="text-xs text-gray-500 mt-2">
                  Применится ко всем {massCount}{' '}
                  {getPlural(massCount, 'выбранной кампании', 'выбранным кампаниям', 'выбранным кампаниям')}.
                </p>
              ) : null}
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Checkbox
                  id={isMassRefill ? 'bonus-toggle-mass' : 'bonus-toggle'}
                  checked={useBonuses}
                  onChange={e => setUseBonuses(e.target.checked)}
                  className="w-5 h-5 text-purple-600 cursor-pointer"
                />
                <label
                  htmlFor={isMassRefill ? 'bonus-toggle-mass' : 'bonus-toggle'}
                  className="text-sm font-semibold text-gray-900 cursor-pointer"
                >
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
            Применить
          </button>
        </div>
      </div>
    </div>
  );
};

type Widgets2Card = {
  id: 'start-promo' | 'good-sales' | 'views-drop' | 'repeat-campaign' | 'bonus-gift';
  title: string;
  subtitle: string;
  tone: 'rose' | 'emerald' | 'amber';
  item?: { nmId: number; name: string; image: string };
  ctaLabel: string;
};

function Widgets2Strip({
  profileId,
  items,
  onCloseItem,
  onPromoteItem,
  onOpenBudgetHint,
  onChooseProducts,
}: {
  profileId: ProfileId;
  items: Widgets2Card[];
  onCloseItem: (id: Widgets2Card['id']) => void;
  onPromoteItem: (item: Widgets2Card['item']) => void;
  onOpenBudgetHint: () => void;
  onChooseProducts: () => void;
}) {
  const promotionHealth = useMemo(() => {
    // Demo: fixed values for preview iterations.
    if (profileId === '2') {
      return {
        score: 50,
        stageIndex: 2,
        stageLabel: 'Требует внимания' as const,
        stageTone: 'bg-amber-400' as const,
      };
    }

    const score = 74;
    const stageIndex = score >= 75 ? 3 : score >= 50 ? 2 : score >= 25 ? 1 : 0;
    const stageLabel = (['Плохо', 'Нормально', 'Хорошо', 'Отлично'] as const)[stageIndex];
    const stageTone = (['bg-rose-500', 'bg-amber-400', 'bg-lime-500', 'bg-emerald-500'] as const)[stageIndex];

    return { score, stageIndex, stageLabel, stageTone };
  }, [profileId]);

  const healthImproveItems = useMemo(() => {
    // Demo factors: replace with real inputs later (coverage/profit/roas/etc).
    const coveragePromoted = 100;
    const coverageTotal = 500;
    const roasPct = 292;
    const roasTargetPct = 320;

    const items = [
      {
        title: 'Покрытие ассортимента',
        subtitle: `Продвигаются ${coveragePromoted}/${coverageTotal} товаров`,
        weight: -(coverageTotal - coveragePromoted >= 250 ? 10 : coverageTotal - coveragePromoted >= 150 ? 8 : 5),
      },
      {
        title: 'Работа с кластерами',
        subtitle: 'Проверьте неэффективные кластера',
        weight: -(roasPct < roasTargetPct * 0.85 ? 8 : roasPct < roasTargetPct ? 5 : 1),
      },
      {
        title: 'Нехватка бюджета',
        subtitle: '3 кампании остановились из‑за бюджета',
        weight: -6,
      },
      {
        title: 'Остатки',
        subtitle: '2 товара с низкими остатками в рекламе',
        weight: -4,
      },
    ] as const;

    return items.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));
  }, []);

  const healthImproveHint = useMemo(() => {
    const top = healthImproveItems.slice(0, 2);
    if (top.length === 0) return '';
    const t0 = top[0]!.title;
    const t1 = top[1]?.title;
    if (!t1) return `В первую очередь улучшите: ${t0}`;
    return `Улучшите в первую очередь: ${t0}, ${t1}`;
  }, [healthImproveItems]);

  return (
    <div className="flex w-full min-w-0 items-stretch gap-2 overflow-visible">
      <section className="group flex min-h-0 min-w-0 flex-[0.85] flex-col rounded-[20px] bg-white p-3 shadow-sm">
        <div className="flex items-start justify-between gap-3 pb-3">
          <h2 className="text-sm font-bold leading-none text-gray-900">Здоровье кабинета</h2>
          <div className="shrink-0 text-right">
            <div
              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold leading-none ${
                profileId === '2' ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {promotionHealth.stageLabel}
            </div>
          </div>
        </div>

        <div className="mt-0">
          <div className="relative">
            <div className="relative h-2 w-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500">
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                style={{ left: `${promotionHealth.score}%` }}
              >
                <div className="h-5 w-[4px] rounded-full bg-gray-900/80 shadow-sm ring-2 ring-white/90" />
              </div>
            </div>
            <div className="pointer-events-none absolute left-0 top-full z-50 pt-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
              <div className="w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_16px_48px_rgba(0,0,0,0.14)]">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="text-sm font-semibold text-gray-900">Что улучшить</div>
                </div>
                <div className="h-px bg-gray-100" />
                <div className="p-2">
                  <div className="flex flex-col gap-2">
                    {healthImproveItems.map((row) => (
                      <div
                        key={row.title}
                        className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 hover:bg-gray-50"
                      >
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">{row.title}</span>
                          </div>
                          <div className="mt-0.5 truncate text-xs text-gray-500">{row.subtitle}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs leading-snug text-gray-600">
            {healthImproveHint}
          </p>
        </div>
      </section>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col rounded-xl bg-white p-4 shadow-sm">
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
          className="relative flex min-h-0 min-w-0 flex-1 flex-col rounded-xl bg-white p-4 pb-2 shadow-sm"
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

          <div className="min-w-0 pr-9">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2 pb-1">
                <div className="shrink-0" aria-hidden>
                  {card.id === 'good-sales' ? (
                    <div className="flex items-end gap-0.5">
                      <div className="h-2 w-1 rounded-sm bg-emerald-200" />
                      <div className="h-3 w-1 rounded-sm bg-emerald-200" />
                      <div className="h-4 w-1 rounded-sm bg-emerald-200" />
                      <div className="h-3 w-1 rounded-sm bg-emerald-300" />
                      <div className="h-5 w-1 rounded-sm bg-emerald-500" />
                    </div>
                  ) : card.id === 'repeat-campaign' ? (
                    <div className="rounded-md bg-emerald-50 p-1 text-emerald-700">
                      <RefreshCw className="h-4 w-4" aria-hidden />
                    </div>
                  ) : card.id === 'bonus-gift' ? (
                    <div className="rounded-md bg-purple-50 p-1 text-purple-700">
                      <Gift className="h-4 w-4" aria-hidden />
                    </div>
                  ) : (
                    <div className="rounded-md bg-rose-50 p-1">
                      <div className="flex items-center gap-0.5">
                        <div className="h-2.5 w-1.5 rounded-sm bg-rose-500" />
                        <div className="h-2.5 w-1.5 rounded-sm bg-rose-500" />
                        <div className="h-2.5 w-1.5 rounded-sm bg-rose-200" />
                        <div className="h-2.5 w-1.5 rounded-sm bg-rose-200" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="min-w-0 text-sm font-bold leading-none text-gray-900">{card.title}</div>
              </div>
            </div>

            <div className="mt-3 flex min-w-0 flex-1 flex-col rounded-lg px-0 py-0">
              {card.item ? (
                <div className="flex min-w-0 items-center gap-2 pb-2">
                  <img
                    src={card.item.image}
                    alt=""
                    className="h-[38px] w-[30px] shrink-0 rounded-md border border-gray-100 bg-gray-50 object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (img.src !== PRODUCT_TABLE_THUMB_FALLBACK) img.src = PRODUCT_TABLE_THUMB_FALLBACK;
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-gray-900">{card.item.name}</div>
                    <div className="mt-0.5 text-[11px] leading-none text-gray-500">
                      {card.id === 'repeat-campaign'
                        ? card.subtitle
                        : card.id === 'good-sales'
                        ? 'Увеличьте продажи с продвижением'
                        : card.id === 'start-promo'
                          ? 'Недобор показов без продвижения'
                          : card.id === 'views-drop'
                            ? 'Недобор показов из-за низкого бюджета'
                            : card.item.nmId}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pb-2 text-xs leading-snug text-gray-600">{card.subtitle}</div>
              )}
              <div className="mt-auto pt-2">
                {card.id === 'repeat-campaign' ? (
                  <div className="flex flex-col items-start gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onOpenBudgetHint();
                      }}
                      className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-[#ececef] px-3 py-1.5 text-xs font-semibold leading-none text-gray-800 transition-colors hover:bg-[#e2e2e6]"
                    >
                      {card.ctaLabel}
                    </button>
                  </div>
                ) : card.id === 'bonus-gift' ? (
                  <div className="flex flex-col items-start gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onChooseProducts();
                      }}
                      className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-[#ececef] px-3 py-1.5 text-xs font-semibold leading-none text-gray-800 transition-colors hover:bg-[#e2e2e6]"
                    >
                      {card.ctaLabel}
                    </button>
                  </div>
                ) : card.id === 'good-sales' ? (
                  <div className="flex flex-col items-start gap-2">
                    <button
                      type="button"
                      onClick={() => onPromoteItem(card.item)}
                      className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-[#ececef] px-3 py-1.5 text-xs font-semibold leading-none text-gray-800 transition-colors hover:bg-[#e2e2e6]"
                    >
                      {card.ctaLabel}
                    </button>
                  </div>
                ) : card.id === 'start-promo' ? (
                  <div className="flex flex-col items-start gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (card.id === 'views-drop') {
                          onOpenBudgetHint();
                          return;
                        }
                        onPromoteItem(card.item);
                      }}
                      className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-[#ececef] px-3 py-1.5 text-xs font-semibold leading-none text-gray-800 transition-colors hover:bg-[#e2e2e6]"
                    >
                      {card.ctaLabel}
                    </button>
                  </div>
                ) : card.id === 'views-drop' ? (
                  <div className="flex flex-col items-start gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onOpenBudgetHint();
                      }}
                      className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-[#ececef] px-3 py-1.5 text-xs font-semibold leading-none text-gray-800 transition-colors hover:bg-[#e2e2e6]"
                    >
                      {card.ctaLabel}
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-start">
                    <button
                      type="button"
                      onClick={() => {
                        if (card.item) onPromoteItem(card.item);
                      }}
                      className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-[#ececef] px-3 py-1.5 text-xs font-semibold leading-none text-gray-800 transition-colors hover:bg-[#e2e2e6]"
                    >
                      {card.ctaLabel}
                    </button>
                  </div>
                )}
              </div>
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

const EditResultBlock = ({ successCount, errorCount, onClear, failedIds = [], onShowFailed }: { successCount: number, errorCount: number, onClear: () => void, failedIds?: number[], onShowFailed: (ids: number[]) => void }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        if (!failedIds || failedIds.length === 0) return;
        navigator.clipboard.writeText(failedIds.join('\n')).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2500);
        });
    };

    const handleDownload = () => {
        if (!failedIds || failedIds.length === 0) return;
        const csvContent = "data:text/csv;charset=utf-8,campaign_id\n" + failedIds.map(id => `${id}`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "failed_campaign_ids.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white rounded-xl p-5 mb-6 shadow-sm border border-gray-100 relative animate-in fade-in duration-300">
            <button onClick={onClear} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5" />
            </button>
            <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 text-green-500 mt-1 shrink-0" />
                <div>
                    <h2 className="text-xl font-bold text-gray-900">
                        Изменения применены
                    </h2>
                    <div className="flex flex-col gap-1 mt-1 text-sm">
                       <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500"/>
                          <span className="text-gray-800 font-medium">Успешно: {successCount} {getPlural(successCount, 'кампания', 'кампании', 'кампаний')}</span>
                       </div>
                       {errorCount > 0 && (
                          <div className="flex items-start gap-2 text-sm">
                             <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5"/>
                             <div className="text-gray-800">
                               <div className="font-medium">
                                 Не хватило денег для пополнения {errorCount} {getPlural(errorCount, 'кампании', 'кампаний', 'кампаний')}.
                               </div>
                               <div className="text-gray-700">
                                 Эти кампании были изменены и находятся в статусе «Готово к запуску». Пополните бюджет и запустите их.
                               </div>
                               {failedIds && failedIds.length > 0 && (
                                 <button
                                   type="button"
                                   onClick={() => onShowFailed(failedIds)}
                                   className="mt-1 text-sm font-medium text-purple-600 hover:text-purple-700 hover:underline"
                                 >
                                   Показать в списке
                                 </button>
                               )}
                             </div>
                          </div>
                       )}
                    </div>
                     {errorCount > 0 && failedIds && failedIds.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
                            <button onClick={handleCopy} disabled={isCopied} className="flex items-center gap-2 text-sm font-medium bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-70 disabled:cursor-wait">
                               <ClipboardCheck className="w-4 h-4" />
                               <span>{isCopied ? 'ID скопированы!' : 'Скопировать ID с ошибками'}</span>
                           </button>
                           <button onClick={handleDownload} className="flex items-center gap-2 text-sm font-medium bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-all">
                               <Download className="w-4 h-4" />
                               <span>Скачать список с ошибками</span>
                           </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ApplyingChangesBlock: React.FC<{ onOpenReview: () => void; onCancel: () => void; }> = ({ onOpenReview, onCancel }) => (
  <div className="bg-white rounded-xl p-8 mb-6 shadow-sm border border-gray-100 flex flex-col items-center text-center animate-in fade-in duration-300">
    <Loader className="w-12 h-12 text-purple-600 animate-spin" />
    <h2 className="text-xl font-bold text-gray-900 mt-4">
      Внесем изменения через 1 минуту
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


type DateFilterPreset = 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'custom';

function formatDateFilterRangePart(d: Date): string {
  const parts = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }).split(' ');
  if (parts.length >= 2) {
    const month = parts[1];
    return `${parts[0]} ${month.charAt(0).toLowerCase()}${month.slice(1)}`;
  }
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

function formatDateFilterRangeLabel(start: Date, end: Date): string {
  return `${formatDateFilterRangePart(start)} — ${formatDateFilterRangePart(end)}`;
}

function dateToInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function rangeForDateFilterPreset(preset: Exclude<DateFilterPreset, 'custom'>): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  if (preset === 'today') return { start, end };
  if (preset === 'yesterday') {
    start.setDate(start.getDate() - 1);
    const yesterday = new Date(start);
    return { start: yesterday, end: yesterday };
  }
  if (preset === 'week') {
    start.setDate(start.getDate() - 6);
    return { start, end };
  }
  if (preset === 'month') {
    start.setDate(start.getDate() - 29);
    return { start, end };
  }
  const month = end.getMonth();
  const quarterStartMonth = Math.floor(month / 3) * 3;
  start.setMonth(quarterStartMonth, 1);
  return { start, end };
}

const DATE_FILTER_SEGMENT_PRESETS: { id: Exclude<DateFilterPreset, 'custom'>; label: string }[] = [
  { id: 'today', label: 'Сегодня' },
  { id: 'yesterday', label: 'Вчера' },
  { id: 'week', label: 'Неделя' },
  { id: 'month', label: 'Месяц' },
  { id: 'quarter', label: 'Квартал' },
];

const DateFilterSegmentedToolbar = () => {
  const [activePreset, setActivePreset] = useState<DateFilterPreset>('month');
  const [rangeStart, setRangeStart] = useState(() => rangeForDateFilterPreset('month').start);
  const [rangeEnd, setRangeEnd] = useState(() => rangeForDateFilterPreset('month').end);
  const [customOpen, setCustomOpen] = useState(false);
  const [draftStart, setDraftStart] = useState('');
  const [draftEnd, setDraftEnd] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!customOpen) return;
    const onMouseDown = (event: MouseEvent) => {
      if (ref.current?.contains(event.target as Node)) return;
      setCustomOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [customOpen]);

  const applyPreset = (preset: Exclude<DateFilterPreset, 'custom'>) => {
    const { start, end } = rangeForDateFilterPreset(preset);
    setActivePreset(preset);
    setRangeStart(start);
    setRangeEnd(end);
    setCustomOpen(false);
  };

  const openCustomPicker = () => {
    setDraftStart(dateToInputValue(rangeStart));
    setDraftEnd(dateToInputValue(rangeEnd));
    setCustomOpen((o) => !o);
  };

  const applyCustomRange = () => {
    if (!draftStart || !draftEnd) return;
    const start = new Date(draftStart);
    const end = new Date(draftEnd);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;
    setRangeStart(start);
    setRangeEnd(end);
    setActivePreset('custom');
    setCustomOpen(false);
  };

  const rangeLabel = formatDateFilterRangeLabel(rangeStart, rangeEnd);

  return (
    <div
      className="inline-flex max-w-full flex-wrap items-center gap-0.5 rounded-[10px] bg-[rgba(74,74,89,0.08)] p-1 text-sm font-medium"
      role="group"
      aria-label="Период статистики"
    >
      {DATE_FILTER_SEGMENT_PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          onClick={() => applyPreset(preset.id)}
          className={`whitespace-nowrap rounded-lg px-3 py-2 transition-all ${
            activePreset === preset.id
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-[#767386] hover:text-gray-900'
          }`}
        >
          {preset.label}
        </button>
      ))}
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={openCustomPicker}
          className={`inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 transition-all ${
            activePreset === 'custom'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-900 hover:text-gray-900'
          }`}
        >
          <span className="tabular-nums">{rangeLabel}</span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-[#767386] transition-transform ${customOpen ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
        {customOpen && (
          <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-lg animate-in fade-in zoom-in-95 duration-100">
            <p className="mb-2 text-sm font-medium text-gray-900">Выбрать период</p>
            <div className="space-y-2">
              <input
                type="date"
                value={draftStart}
                onChange={(e) => setDraftStart(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-purple-500 focus:ring-purple-500"
              />
              <input
                type="date"
                value={draftEnd}
                onChange={(e) => setDraftEnd(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <button
              type="button"
              onClick={applyCustomRange}
              className="mt-3 w-full rounded-lg bg-purple-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
            >
              Применить
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

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
                <Plus className="w-5 h-5 shrink-0" aria-hidden />
                <span>Создать</span>
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
                            Одну кампанию
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

  if (variant === 'products') {
    return (
      <div
        ref={dropdownRef}
        className="absolute left-0 top-full z-[100] mt-2 flex max-h-[min(600px,calc(100vh-12rem))] w-[min(800px,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-100"
      >
        <div className="flex flex-1 overflow-hidden">
          <div className="flex w-56 shrink-0 flex-col gap-1 border-r border-gray-100 p-3">
            {productsNavBtn('categories', 'Категории')}
            {productsNavBtn('conflicts', 'Конфликты кампаний')}
            <p className="px-4 pt-3 pb-1 text-xs font-medium text-gray-400">Кампании</p>
            {productsNavBtn('status', 'Статус кампаний')}
            {productsNavBtn('autorefill', 'Автопополнение')}
            {productsNavBtn('payment', 'Модель оплаты')}
            {productsNavBtn('sort', 'Тип сортировки кампаний')}
            {productsNavBtn('campaignTypes', 'Типы кампании')}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
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
            <div className="flex-1 overflow-y-auto px-6 py-4">
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
        <div className="flex items-center gap-3 border-t border-gray-100 px-6 py-4">
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
    <div 
      ref={dropdownRef}
      className="absolute top-full right-0 mt-2 w-[800px] bg-white rounded-2xl shadow-2xl max-h-[600px] overflow-hidden flex flex-col z-20 animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column - Categories */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 flex flex-col">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Фильтр</h3>
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
        <div className="flex-1 p-6 overflow-y-auto">
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
      <div className="border-t border-gray-200 p-4 flex items-center justify-end gap-3">
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
    editResult,
    onClearEditResult,
    onOpenReview,
    onCancelEdits,
    onOpenHistoryModal,
    showUploadHint = false,
    onDismissUploadHint,
    onOpenCpcCampaign,
    onOpenSingleCampaign,
    onRegisterUpdateFn,
}) => {
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

  const [allCampaigns, setAllCampaigns] = useState<DisplayCampaign[]>(() => buildAllCampaignsForProfile('1'));

  // Handle campaign data updates from edit page
  const handleUpdateCampaignData = useCallback((campaignId: number, data: { name?: string; remainingBudget?: number | null; dailyLimit?: number | null; scheduledDailyLimit?: number | null }) => {
    setAllCampaigns(prev => prev.map(c => {
      if (c.campaignId === campaignId) {
        return {
          ...c,
          ...(data.name !== undefined && { name: data.name }),
          ...(data.remainingBudget !== undefined && { remainingBudget: data.remainingBudget }),
          ...(data.dailyLimit !== undefined && { dailyLimit: data.dailyLimit }),
          ...(data.scheduledDailyLimit !== undefined && { scheduledDailyLimit: data.scheduledDailyLimit }),
        };
      }
      return c;
    }));
  }, []);

  // Expose update function to parent
  useEffect(() => {
    if (onRegisterUpdateFn) {
      onRegisterUpdateFn(handleUpdateCampaignData);
    }
  }, [onRegisterUpdateFn]); // Removed handleUpdateCampaignData from dependencies to avoid infinite loop
  const [currentPage, setCurrentPage] = useState(1);
  const CAMPAIGNS_PAGE_SIZE = 10;
  const [isBudgetRefillModalOpen, setIsBudgetRefillModalOpen] = useState(false);
  const [selectedCampaignForRefill, setSelectedCampaignForRefill] = useState<DisplayCampaign | null>(null);
  const [isMassBudgetRefillModalOpen, setIsMassBudgetRefillModalOpen] = useState(false);
  const [massBudgetRefillTargetIds, setMassBudgetRefillTargetIds] = useState<string[]>([]);
  const [isDailyLimitModalOpen, setIsDailyLimitModalOpen] = useState(false);
  const [limitShortfallNotification, setLimitShortfallNotification] = useState<{ requestedLimit: number; shortfall: number } | null>(null);

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

  const [isProductsColumnSettingsOpen, setIsProductsColumnSettingsOpen] = useState(false);
  const [productsColumnVisibility, setProductsColumnVisibility] = useState<Record<string, boolean>>(
    defaultProductsColumnVisibility,
  );
  const productsColVisible = useCallback(
    (columnId: string) => productsColumnVisibility[columnId] !== false,
    [productsColumnVisibility],
  );

  const location = useLocation();
  const isCampaignsWithWidgetsPage = location.pathname === '/campaigns-with-widgets';
  const isCampaignsWithWidgets2Page = isCampaignsWidgetsV1Layout(location.pathname);
  const isProductPromotionConceptPage =
    location.pathname === PRODUCT_PROMOTION_CONCEPT_PATH;
  const isCampaignsWidgetsV1OnlyPage =
    location.pathname === CAMPAIGNS_WITH_WIDGETS_V1_PATH;

  const productsPinVisibility = useMemo(
    () => ({
      ...productsColumnVisibility,
      bid: isProductPromotionConceptPage && productsColumnVisibility.bid !== false,
      campaignType:
        !isProductPromotionConceptPage && productsColumnVisibility.campaignType !== false,
    }),
    [productsColumnVisibility, isProductPromotionConceptPage],
  );
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
      ),
    [productsPinVisibility, hasProductsScrollShadow],
  );

  // Вкладки списка: Кампании | Товары
  const [listTab, setListTab] = useState<'campaigns' | 'products'>('products');

  useEffect(() => {
    if (listTab !== 'products') setIsProductsColumnSettingsOpen(false);
  }, [listTab]);
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
          tone: 'amber',
          item: {
            nmId: p0?.nmId ?? 1400001,
            name: p0?.productName ?? 'Летнее платье «Ривьера»',
            image: p0?.imageUrl ?? demoImages[0],
          },
          ctaLabel: 'Повторить',
        },
        {
          id: 'good-sales',
          title: 'Товар хорошо продается',
          subtitle: 'Высокий GMV, нет продвижения',
          tone: 'emerald',
          item: {
            nmId: p1?.nmId ?? 1400002,
            name: p1?.productName ?? 'Вечернее платье «Грация»',
            image: p1?.imageUrl ?? demoImages[1],
          },
          ctaLabel: 'Продвигать',
        },
        {
          id: 'bonus-gift',
          title: 'Дарим 5000 бонусов до 30 апреля',
          subtitle: 'Выберите товары и запустите продвижение с бонусами',
          tone: 'emerald',
          ctaLabel: 'Выбрать товары',
        },
      ];
    }

    return [
      {
        id: 'start-promo',
        title: 'Товар без продвижения',
        subtitle: 'Вы теряете продажи',
        tone: 'rose',
        item: {
          nmId: p0?.nmId ?? 1400001,
          name: p0?.productName ?? 'Летнее платье «Ривьера»',
          image: p0?.imageUrl ?? demoImages[0],
        },
        ctaLabel: 'Продвигать',
      },
      {
        id: 'good-sales',
        title: 'Товар хорошо продается',
        subtitle: 'Высокий GMV, нет продвижения',
        tone: 'emerald',
        item: {
          nmId: p1?.nmId ?? 1400002,
          name: p1?.productName ?? 'Вечернее платье «Грация»',
          image: p1?.imageUrl ?? demoImages[1],
        },
        ctaLabel: 'Продвигать',
      },
      {
        id: 'views-drop',
        title: 'Кампания теряет показы',
        subtitle: 'Рекомендуем увеличить бюджет',
        tone: 'amber',
        item: {
          nmId: c0?.nmId ?? p0?.nmId ?? 1400003,
          name: c0?.productName ?? 'Платье-футляр «Офис»',
          image: c0?.imageUrl ?? p0?.imageUrl ?? demoImages[2],
        },
        ctaLabel: 'Увеличить бюджет',
      },
    ];
  }, [profileProductTree, profileCampaigns, profileId]);

  const widgets2VisibleCards = useMemo(
    () => widgets2DemoCards.filter((c) => !widgets2Closed.has(c.id)),
    [widgets2DemoCards, widgets2Closed],
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

  useEffect(() => {
    if (!insightFilter) return;
    setListTab('campaigns');
    setCurrentPage(1);
  }, [insightFilter]);

  // Раскрытые строки товаров (вкладка Товары)
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productsPickTab, setProductsPickTab] = useState<ProductsPickTab>('all');
  const [productBulkNotice, setProductBulkNotice] = useState<string | null>(null);
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

  const isFirstProfileMount = useRef(true);
  useEffect(() => {
    if (isFirstProfileMount.current) {
      isFirstProfileMount.current = false;
      return;
    }
    setAllCampaigns(buildAllCampaignsForProfile(profileId));
    setCurrentPage(1);
    onSelectionChange([]);
    setSelectedProductIds([]);
    setProductsPickTab('all');
    setExpandedProductIds(new Set());
    setProductTagsOverride({});
    setProductCampaignStatusOverride({});
    setSearchQuery('');
  }, [profileId, onSelectionChange]);

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

    const prebuilt = allCampaigns.find((c) => c.id === PREBUILT_CPC_CAMPAIGN_ID);
    if (prebuilt && !insightFilter) {
      filtered = [prebuilt, ...filtered.filter((c) => c.id !== PREBUILT_CPC_CAMPAIGN_ID)];
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
    const q = searchQuery.trim().toLowerCase();
    return filteredProducts.filter((product) => {
      if ((product.name && product.name.toLowerCase().includes(q)) || (product.article && product.article.toLowerCase().includes(q)) || (product.articleWb && product.articleWb.toLowerCase().includes(q)) || (product.articleSeller && product.articleSeller.toLowerCase().includes(q))) return true;
      return product.campaigns.some((camp) => (camp.name && camp.name.toLowerCase().includes(q)) || String(camp.campaignId).toLowerCase().includes(q));
    });
  }, [filteredProducts, searchQuery]);

  const productsForTable = useMemo(() => {
    if (productsPickTab === 'all') return filteredProductsBySearch;
    return filteredProductsBySearch.filter((product) => {
      const nmId = productRowNmId(product);
      const hasActiveCampaign = product.campaigns.some((camp) => {
        const effectiveStatus =
          camp.status === 'draft' || camp.status === 'error'
            ? camp.status
            : (productCampaignStatusOverride[camp.id] ?? camp.status);
        return effectiveStatus === 'active';
      });
      if (productsPickTab === 'not_promoted') {
        if (product.campaigns.length === 0) return true;
        return !hasActiveCampaign;
      }
      if (productsPickTab === 'promoted') {
        return hasActiveCampaign;
      }
      if (productsPickTab === 'growth') return nmId > 0 && nmId % 5 === 0;
      if (productsPickTab === 'ab') return nmId > 0 && nmId % 9 === 0;
      if (productsPickTab === 'promo') return nmId > 0 && nmId % 7 === 0;
      return true;
    });
  }, [filteredProductsBySearch, productsPickTab, productCampaignStatusOverride]);

  const visibleProductIds = useMemo(
    () => productsForTable.map((p) => p.id),
    [productsForTable],
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

  const handleBulkCreateCampaignFromProducts = useCallback(() => {
    const items = productsForTable
      .filter((p) => selectedProductIds.includes(p.id))
      .map(productRowToCreationItem);
    if (items.length === 0) return;
    if (onNavigateToCreationWithProducts) onNavigateToCreationWithProducts(items);
    else onNavigateToCreation();
    setSelectedProductIds([]);
  }, [
    productsForTable,
    selectedProductIds,
    onNavigateToCreationWithProducts,
    onNavigateToCreation,
  ]);

  const selectedProductsForBulk = useMemo(
    () => productsForTable.filter((p) => selectedProductIds.includes(p.id)),
    [productsForTable, selectedProductIds],
  );

  const selectedProductsCampaignCount = useMemo(() => {
    return selectedProductsForBulk.reduce((sum, p) => sum + p.campaigns.length, 0);
  }, [selectedProductsForBulk]);

  const selectedProductCategories = useMemo(() => {
    const set = new Set(
      selectedProductsForBulk.map((p) => p.category).filter((c): c is string => Boolean(c)),
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'));
  }, [selectedProductsForBulk]);

  useEffect(() => {
    if (selectedProductIds.length === 0) {
      setProductBidBulkModalKind(null);
    }
  }, [selectedProductIds.length]);

  const openProductBidBulkModal = (kind: ProductBidBulkModalKind) => {
    if (selectedProductsCampaignCount === 0) {
      setProductBulkNotice('У выбранных товаров нет кампаний для изменения ставки');
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
        remainingBudget: c.remainingBudget,
        dailyLimit: c.dailyLimit ?? null,
        scheduledDailyLimit: c.scheduledDailyLimit ?? null,
        dailyLimitExhausted: c.dailyLimitExhausted,
      };
      if (c.isBonusCampaign) {
        onOpenCpcCampaign({
          ...payload,
          fromReadyToRepeat: true,
          repeatLaunchPreset: buildRepeatPresetForDisplayCampaign(c, profileId),
        });
        return;
      }
      onOpenCpcCampaign(payload);
    },
    [onOpenCpcCampaign, profileId],
  );

  const openProductNestedCampaign = useCallback(
    (camp: ProductCampaign) => {
      if (camp.type !== 'CPC') return;
      const display = allCampaigns.find((c) => c.campaignId === camp.campaignId);
      if (display) {
        openListCpcCampaign(display);
        return;
      }
      onOpenCpcCampaign({
        campaignId: camp.campaignId,
        name: camp.name,
        remainingBudget: camp.remainingBudget,
        dailyLimit: camp.dailyLimit ?? null,
        scheduledDailyLimit: null,
        dailyLimitExhausted: camp.dailyLimitExhausted,
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
      {!isLaunching && !isApplyingEdits && editResult && (
        <EditResultBlock 
          successCount={editResult.success}
          errorCount={editResult.error}
          onClear={() => {
            onClearEditResult();
            setFailedFilterIds(null);
          }}
          failedIds={editResult.failedIds}
          onShowFailed={(ids) => {
            if (ids && ids.length > 0) {
              setFailedFilterIds(ids);
              // Сбрасываем пагинацию на первую страницу, чтобы точно увидеть отфильтрованные кампании
              setCurrentPage(1);
            }
          }}
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

      {isProductPromotionConceptPage && productBidBulkModalKind && (
        <ProductBidBulkModal
          kind={productBidBulkModalKind}
          isOpen
          onClose={() => setProductBidBulkModalKind(null)}
          categories={selectedProductCategories}
          campaignCount={selectedProductsCampaignCount}
          productCount={selectedProductIds.length}
          onApply={handleProductBidBulkApply}
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
              />
            </div>
          )}

          {isCampaignsWithWidgets2Page ? (
            <div
              className={
                isProductPromotionConceptPage
                  ? 'w-full rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm'
                  : undefined
              }
            >
            <div
              className={`flex flex-wrap items-center gap-3 lg:flex-nowrap ${
                isProductPromotionConceptPage ? 'w-full' : ''
              }`}
            >
              <div className="flex shrink-0 items-center gap-2">
                <div
                  className="inline-flex shrink-0 rounded-[10px] bg-[rgba(74,74,89,0.08)] p-1"
                  role="tablist"
                  aria-label="Раздел списка"
                >
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

              {!isProductPromotionConceptPage && (
                <DateFilter defaultLabel="22.02.2020 — 22.02.2020" variant="toolbar" />
              )}

              {!(isProductPromotionConceptPage && listTab === 'products') && (
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
              )}

              {isProductPromotionConceptPage ? (
                <div className="ml-auto shrink-0">
                  <DateFilterSegmentedToolbar />
                </div>
              ) : null}

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
              <div
                className={`flex min-w-0 items-stretch overflow-hidden rounded-[12px] bg-white px-5 shadow-sm ${
                  notificationCardVariant === 3
                    ? 'min-w-0 flex-1 basis-0 grow self-stretch'
                    : 'h-24 flex-1'
                }`}
              >
                <div
                  className={`flex w-full flex-1 items-stretch justify-start gap-6 sm:gap-8 ${
                    notificationCardVariant === 3 ? 'min-h-full items-center' : ''
                  }`}
                >
                  <div className={`shrink-0 ${LIST_HEADER_COMPACT_STAT}`}>
                    <p className={LIST_HEADER_STAT_LABEL_CLASS}>Доля затрат</p>
                    <div className="m-0 flex items-baseline gap-2 leading-none">
                      <p className={LIST_HEADER_STAT_VALUE_CLASS}>9,7 %</p>
                      <p className="m-0 flex items-center gap-0.5 text-[11px] font-medium leading-none text-emerald-600">
                        <ArrowUp className="h-2.5 w-2.5 rotate-180" aria-hidden />
                        5.8%
                      </p>
                    </div>
                  </div>
                  <div className={`shrink-0 ${LIST_HEADER_COMPACT_STAT}`}>
                    <p className={LIST_HEADER_STAT_LABEL_CLASS}>Сумма заказов</p>
                    <div className="m-0 flex items-baseline gap-2 leading-none">
                      <p className={LIST_HEADER_STAT_VALUE_CLASS}>196 000 ₽</p>
                      <p className="m-0 flex items-center gap-0.5 text-[11px] font-medium leading-none text-emerald-600">
                        <ArrowUp className="h-2.5 w-2.5" aria-hidden />
                        1.9%
                      </p>
                    </div>
                  </div>
                  <div className={`shrink-0 ${LIST_HEADER_COMPACT_STAT}`}>
                    <p className={LIST_HEADER_STAT_LABEL_CLASS}>Заказы</p>
                    <div className="m-0 flex items-baseline gap-2 leading-none">
                      <p className={LIST_HEADER_STAT_VALUE_CLASS}>127</p>
                      <p className="m-0 flex items-center gap-0.5 text-[11px] font-medium leading-none text-emerald-600">
                        <ArrowUp className="h-2.5 w-2.5" aria-hidden />
                        12.6%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
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
          <div className="w-full bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
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
            className="relative overflow-x-auto"
            onScroll={(e) => {
              const target = e.currentTarget;
              setHasCampaignsScrollShadow(target.scrollLeft > 0);
            }}
          >
              {/* Тень между закреплёнными колонками и прокручиваемыми данными */}
              <table className="relative w-full text-sm min-w-[1600px]">
                  <thead className="bg-gray-50 text-gray-500 font-medium">
                      <tr>
                          <th className="sticky left-0 z-20 p-4 w-12 bg-gray-50">
                            <Checkbox
                              checked={isAllOnPageSelected}
                              onChange={(e) => handleSelectAll(e.target.checked)}
                              className="w-4 h-4 text-purple-600"
                            />
                          </th>
                          <th className="sticky left-[52px] z-20 p-4 w-10 bg-gray-50"></th>
                          <th
                            className={`sticky left-[100px] z-20 p-4 text-left font-medium min-w-[300px] bg-gray-50 ${
                              hasCampaignsScrollShadow ? PRODUCTS_PINNED_EDGE_SHADOW_CLASS : ''
                            }`}
                          >
                                <div className="flex items-center gap-1">
                                    Товар/Кампания <ArrowUp className="w-4 h-4" />
                                </div>
                            </th>
                          <th className="p-4 text-left font-medium"><div className="flex items-center gap-1">Тип кампании <HelpCircle className="w-4 h-4" /></div></th>
                          <th className="p-4 text-left font-medium"><div className="flex items-center gap-1">Остаток бюджета <HelpCircle className="w-4 h-4" /></div></th>
                          <th className="p-4 text-left font-medium"><div className="flex items-center gap-1">Дневной лимит <HelpCircle className="w-4 h-4" /></div></th>
                          <th className="p-4 text-left font-medium"><div className="flex items-center gap-1">Затраты <HelpCircle className="w-4 h-4" /></div></th>
                          <th className="p-4 text-left font-medium"><div className="flex items-center gap-1">Показы <HelpCircle className="w-4 h-4" /></div></th>
                          <th className="p-4 text-left font-medium"><div className="flex items-center gap-1">CTR <HelpCircle className="w-4 h-4" /></div></th>
                          <th className="p-4 text-left font-medium"><div className="flex items-center gap-1">Заказы <HelpCircle className="w-4 h-4" /></div></th>
                          <th className="p-4 text-left font-medium"><div className="flex items-center gap-1">Доля затрат <HelpCircle className="w-4 h-4" /></div></th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {paginatedCampaigns.map(c => (
                          <tr
                            key={c.id}
                            onClick={(e) => {
                              if (c.type === 'CPC' && !(e.target as HTMLElement).closest('button')) {
                                openListCpcCampaign(c);
                              }
                            }}
                            className={`transition-colors ${selectedCampaigns.includes(c.id) ? 'bg-purple-50' : 'hover:bg-gray-50'} ${c.type === 'CPC' ? 'cursor-pointer' : ''}`}
                          >
                      <td className="sticky left-0 z-10 p-4 bg-white" onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={selectedCampaigns.includes(c.id)}
                                  onChange={(e) => handleSelectSingle(c.id, e.target.checked)}
                                  className="w-4 h-4 text-purple-600"
                                />
                              </td>
                              <td className="sticky left-[52px] z-10 p-4 bg-white" onClick={(e) => e.stopPropagation()}>
                                  <ToggleSwitch
                                      checked={c.status === 'active'}
                                      onChange={(isChecked) => handleStatusToggle(c.id, isChecked)}
                                      disabled={c.status === 'draft' || c.status === 'error'}
                                  />
                              </td>
                              <td
                                className={`sticky left-[100px] z-10 p-4 bg-white ${
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
                                      <div>
                                          <p className="font-medium text-gray-800 truncate" title={c.name}>{c.name}</p>
                                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 flex-wrap">
                                              <StatusBadge status={c.status} text={c.statusText} />
                                              <span>ID {c.campaignId}</span>
                                              {c.tags.map(tag => (
                                                  <div key={tag.text} className={`flex items-center gap-1 ${tag.type === 'warning' ? 'text-amber-700' : tag.type === 'error' ? 'text-red-700' : ''}`}>
                                                      {tag.icon} {tag.text}
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  </div>
                              </td>
                              <td className="p-4">
                                  <div className="font-semibold">{c.type}</div>
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                                      {c.typeDetails && <span>{c.typeDetails}</span>}
                                      {c.typeIcons.map((icon, i) => <span key={i} className="p-1 bg-gray-100 rounded">{icon}</span>)}
                                  </div>
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
                                      onClick={c.type === 'CPC' ? () => { setSelectedCampaignForRefill(c); setIsDailyLimitModalOpen(true); } : undefined}
                                  />
                              </td>
                              <td className="p-4 font-semibold text-gray-900">
                                {c.id === PREBUILT_CPC_CAMPAIGN_ID ? <span className="text-gray-400 font-semibold">Н/Д</span> : formatCurrency(c.spend)}
                              </td>
                              <td className="p-4 font-semibold text-gray-900">
                                {c.id === PREBUILT_CPC_CAMPAIGN_ID ? <span className="text-gray-400 font-semibold">Н/Д</span> : formatNumber(c.impressions)}
                              </td>
                              <td className="p-4 font-semibold text-gray-900">
                                {c.id === PREBUILT_CPC_CAMPAIGN_ID ? <span className="text-gray-400 font-semibold">Н/Д</span> : formatPercentage(c.ctr)}
                              </td>
                              <td className="p-4 font-semibold text-gray-900">
                                {c.id === PREBUILT_CPC_CAMPAIGN_ID ? <span className="text-gray-400 font-semibold">Н/Д</span> : formatNumber(c.orders)}
                              </td>
                              <td className="p-4 font-semibold text-gray-900">
                                {c.id === PREBUILT_CPC_CAMPAIGN_ID ? <span className="text-gray-400 font-semibold">Н/Д</span> : formatPercentage(c.spendShare)}
                              </td>
                          </tr>
                      ))}
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

            <div
              className={`flex flex-wrap items-center gap-3 border-b border-gray-100 px-4 py-3 sm:px-6 ${
                isProductPromotionConceptPage ? 'relative z-40 w-full' : 'justify-between'
              }`}
            >
              <div
                className="inline-flex max-w-full flex-wrap rounded-[10px] bg-[rgba(74,74,89,0.08)] p-1 text-sm font-medium"
                role="tablist"
                aria-label="Подборки товаров"
              >
                {PRODUCTS_PICK_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={productsPickTab === tab.id}
                    onClick={() => setProductsPickTab(tab.id)}
                    className={`whitespace-nowrap rounded-lg px-4 py-2 transition-all ${
                      productsPickTab === tab.id
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-[#767386] hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {isProductPromotionConceptPage ? (
                <div className={`relative shrink-0 ${isFilterDropdownOpen ? 'z-[50]' : ''}`}>
                  <button
                    type="button"
                    onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
                    className="flex h-11 items-center gap-2 rounded-[10px] bg-[rgba(74,74,89,0.08)] px-4 text-sm font-medium text-gray-900 hover:bg-[rgba(74,74,89,0.12)] transition-colors"
                    aria-expanded={isFilterDropdownOpen}
                    aria-haspopup="dialog"
                  >
                    <span>Все фильтры</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-gray-600 transition-transform ${
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
              ) : null}
              {isProductPromotionConceptPage ? (
                <div className="relative ml-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsProductsColumnSettingsOpen((prev) => !prev)}
                    className={`flex h-11 w-11 items-center justify-center rounded-[10px] bg-[rgba(74,74,89,0.08)] transition-colors hover:bg-[rgba(74,74,89,0.12)] ${
                      isProductsColumnSettingsOpen ? 'ring-2 ring-[#9a41fe]/30' : ''
                    }`}
                    title="Настройки колонок"
                    aria-label="Настройки колонок"
                    aria-expanded={isProductsColumnSettingsOpen}
                  >
                    <Settings className="h-5 w-5 text-gray-700" aria-hidden />
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
              ) : null}
            </div>

            <div
              className="relative z-0 overflow-x-auto"
              onScroll={(e) => {
                const target = e.currentTarget;
                setHasProductsScrollShadow(target.scrollLeft > 0);
              }}
            >
              {/* Тень справа от закреплённого столбца товара */}
              <table className="relative w-full text-sm min-w-[2800px]">
                <thead className="bg-gray-50 text-gray-500 font-normal">
                  <tr>
                    <th
                      {...productsPinnedProps('select', 'head', 'px-3 py-4 text-center')}
                    >
                      <Checkbox
                        checked={isAllProductsSelected}
                        onChange={(e) => handleSelectAllProducts(e.target.checked)}
                        className="w-4 h-4 text-purple-600"
                      />
                    </th>
                    {productsColVisible('product') ? (
                      <th
                        {...productsPinnedProps(
                          'product',
                          'head',
                          PRODUCTS_PINNED_TH_PRODUCT_CLASS,
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
                    {showProductsCampaignTypeColumn ? (
                      <th
                        {...productsPinnedProps(
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
                        {...productsPinnedProps(
                          'bid',
                          'head',
                          'px-2 py-4 text-left font-normal align-middle',
                        )}
                      >
                        <span className="inline-flex items-center justify-start gap-1 text-left">
                          Ставка <HelpCircle className="w-4 h-4 text-gray-400" />
                        </span>
                      </th>
                    ) : null}
                    {productsColVisible('budgetRemainder') ? (
                      <th
                        {...productsPinnedProps(
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
                        {...productsPinnedProps(
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
                      <th className="p-4 text-left font-normal w-[220px] min-w-[220px] max-w-[240px]">
                        Ярлыки
                      </th>
                    ) : null}
                    {PRODUCTS_STAT_COLUMN_LABELS.map((label) =>
                      productsColVisible(productsStatColumnId(label)) ? (
                        <th key={label} className={PRODUCTS_STAT_TH_CLASS}>
                          <span className="inline-flex items-center gap-1">
                            {label} <HelpCircle className="w-4 h-4 shrink-0 text-gray-400" />
                          </span>
                        </th>
                      ) : null,
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productsForTable.map((product) => (
                    <React.Fragment key={product.id}>
                      {/* Строка товара */}
                      <tr
                        className={`transition-colors ${
                          selectedProductIds.includes(product.id)
                            ? 'bg-purple-50/80'
                            : 'hover:bg-gray-50/80'
                        }`}
                      >
                        <td
                          {...productsPinnedProps('select', 'body', 'px-3 py-4 align-middle')}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={selectedProductIds.includes(product.id)}
                            onChange={(e) =>
                              handleSelectSingleProduct(product.id, e.target.checked)
                            }
                            className="w-4 h-4 text-purple-600"
                          />
                        </td>
                        {productsColVisible('product') ? (
                          <td
                            {...productsPinnedProps(
                              'product',
                              'body',
                              'pl-0 pr-5 py-4 align-middle',
                            )}
                          >
                            <ProductCollapsedRowCell
                              product={product}
                              expanded={expandedProductIds.has(product.id)}
                              onToggleExpand={() => toggleProductExpanded(product.id)}
                            />
                          </td>
                        ) : null}
                        {showProductsCampaignTypeColumn ? (
                          <td
                            {...productsPinnedProps(
                              'campaignType',
                              'body',
                              'p-4 align-top',
                            )}
                          />
                        ) : null}
                        {showProductsBidColumn ? (
                          <td {...productsPinnedProps('bid', 'body', 'px-2 py-3 align-top')} />
                        ) : null}
                        {productsColVisible('budgetRemainder') ? (
                          <td
                            {...productsPinnedProps(
                              'budgetRemainder',
                              'body',
                              'p-4 align-top',
                            )}
                          />
                        ) : null}
                        {productsColVisible('dailyLimit') ? (
                          <td
                            {...productsPinnedProps(
                              'dailyLimit',
                              'body',
                              'px-2 py-3 align-top',
                            )}
                          />
                        ) : null}
                        {productsColVisible('tags') ? (
                        <td className="p-4 align-top w-[220px] min-w-[220px] max-w-[240px]">
                          <div
                            className="flex items-center gap-1.5 mt-1.5 flex-wrap"
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
                        {PRODUCTS_STAT_COLUMN_LABELS.map((label) => {
                          if (!productsColVisible(productsStatColumnId(label))) return null;
                          const stats = product.agg
                            ? buildExtendedProductStats(product.agg)
                            : null;
                          return (
                            <td key={label} className={PRODUCTS_STAT_TD_CLASS}>
                              {stats ? (
                                <ProductsStatMetricCell
                                  label={label}
                                  stats={stats}
                                  productId={product.id}
                                  changes={product.agg}
                                />
                              ) : (
                                <span className="text-sm font-semibold text-gray-400">Н/Д</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                      {/* Вложенные строки кампаний — вид как на вкладке «Кампании» */}
                      {expandedProductIds.has(product.id) && product.campaigns.map((camp) => {
                        const effectiveStatus = (camp.status === 'draft' || camp.status === 'error' ? camp.status : (productCampaignStatusOverride[camp.id] ?? camp.status)) as 'active' | 'paused' | 'draft' | 'error';
                        const effectiveStatusText = effectiveStatus === 'active' ? 'активна' : effectiveStatus === 'paused' ? 'приостановлена' : camp.statusText;
                        return (
                        <tr key={camp.id} className="bg-gray-50/50 hover:bg-gray-50 transition-colors">
                            <td {...productsPinnedProps('select', 'bodyNested', 'px-3 py-3')} />
                            {/* Товар / кампания */}
                            {productsColVisible('product') ? (
                            <td
                              {...productsPinnedProps(
                                'product',
                                'bodyNested',
                                'px-4 py-3 pl-12 align-middle',
                              )}
                            >
                            <div className="flex items-center gap-3">
                              <ToggleSwitch
                                checked={effectiveStatus === 'active'}
                                onChange={(checked) => setProductCampaignStatusOverride(prev => ({ ...prev, [camp.id]: checked ? 'active' : 'paused' }))}
                                disabled={camp.status === 'draft' || camp.status === 'error'}
                              />
                              <ProductTableThumb productId={product.id} src={product.image} category={product.category} />
                                <div className="min-w-0 flex-1">
                                {camp.type === 'CPC' ? (
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
                                  {isProductPromotionConceptPage ? (
                                    <span>{formatProductCampaignTypeLabel(camp)}</span>
                                  ) : null}
                                  <span>ID {camp.campaignId}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                            ) : null}
                            {showProductsCampaignTypeColumn ? (
                            <td
                              {...productsPinnedProps(
                                'campaignType',
                                'bodyNested',
                                'p-4 align-top',
                              )}
                            >
                            <div className="font-semibold text-gray-900">{camp.type}</div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1 flex-wrap">
                              {camp.typeDetails && <span>{camp.typeDetails}</span>}
                                <span className="p-1 bg-gray-100 rounded">
                                  {camp.type === 'CPC' ? (
                                    <Search className="w-4 h-4 text-gray-400" />
                                  ) : (
                                    <ThumbsUp className="w-4 h-4 text-gray-400" />
                                  )}
                                </span>
                            </div>
                          </td>
                            ) : null}
                            {showProductsBidColumn ? (
                            <td
                              {...productsPinnedProps('bid', 'bodyNested', 'px-2 py-3 align-top')}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ProductCampaignBidCell
                                camp={camp}
                                overrides={productCampaignBidOverride[camp.id]}
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
                              {...productsPinnedProps(
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
                              {...productsPinnedProps(
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
                              onClick={camp.type === 'CPC' ? () => { setSelectedCampaignForRefill(camp); setIsDailyLimitModalOpen(true); } : undefined}
                            />
                          </td>
                            ) : null}
                            {productsColVisible('tags') ? <td className="p-4 w-[220px]" /> : null}
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
                        </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">Показать записей</span>
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
                <Plus className="h-4 w-4" />
                Создать кампанию
              </button>
              {isProductPromotionConceptPage && (
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
      {isDailyLimitModalOpen && selectedCampaignForRefill && (
        <DailyLimitModal
          isOpen={isDailyLimitModalOpen}
          onClose={() => {
            setIsDailyLimitModalOpen(false);
            setSelectedCampaignForRefill(null);
          }}
          currentBudget={selectedCampaignForRefill.remainingBudget || 0}
          dailyLimit={selectedCampaignForRefill.dailyLimit || null}
          onLimitAboveBudget={(requestedLimit, shortfall) => {
            setLimitShortfallNotification({ requestedLimit, shortfall });
          }}
          onDailyLimitChange={(limit, isScheduled = false) => {
            if (selectedCampaignForRefill) {
              setAllCampaigns(prev => prev.map(c => {
                if (c.id === selectedCampaignForRefill.id) {
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