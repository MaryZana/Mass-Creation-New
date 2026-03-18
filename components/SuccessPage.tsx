import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
    MoreVertical,
    Trash2,
    Edit2,
    Check
} from './Icons';
import { CampaignRecord } from '../types';
import { PRODUCTS_SOURCE, CATEGORIES, type CampaignSpec } from './SuccessPageTestData';

// --- Constants ---
const TOTAL_PROMO_BONUS = 226660517;
const BONUS_PACKAGES = [
  { id: 'p1', amount: 209527397, maxPercent: 100, expiry: '20.03.26', displayBurn: '209.4M' },
  { id: 'p2', amount: 17133120, maxPercent: 99, expiry: '27.03.26', displayBurn: '168.3k' },
];

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
  onOpenCpcCampaign: (payload: { campaignId: number; name: string; remainingBudget: number | null; dailyLimit: number | null; scheduledDailyLimit: number | null; dailyLimitExhausted?: boolean }) => void;
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

const MAX_TAGS_PER_PRODUCT = 15;
const MAX_TAG_LENGTH = 15;

function normalizeTagName(tag: string): string {
  return tag.trim().slice(0, MAX_TAG_LENGTH);
}

/** Строит списки кампаний и дерево товаров из единого источника (PRODUCTS_SOURCE). Связь товар ↔ кампании консистентна. */
function buildCampaignsAndProductTree(): { campaigns: DisplayCampaign[]; productTree: ProductRow[] } {
  let campaignId = 1400000;
  const campaigns: DisplayCampaign[] = [];
  const productTree: ProductRow[] = [];

  const tagToDisplay = (tag: CampaignSpec['tag']) => {
    if (!tag) return [];
    if (tag === 'info') return [{ text: 'Сезонный тренд', icon: <Zap className="w-3 h-3" />, type: 'info' as const }];
    if (tag === 'warning') return []; // бейдж «Заканчивается бюджет» не используется
    return [{ text: 'Нарушение +1', icon: <AlertTriangle className="w-3 h-3 text-red-600" />, type: 'error' as const }];
  };

  for (const p of PRODUCTS_SOURCE) {
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
        image: p.image,
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
      image: p.image,
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

const { campaigns: MOCK_CAMPAIGNS, productTree: MOCK_PRODUCTS_TREE } = buildCampaignsAndProductTree();

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
      <div className="space-y-1">
        <span className="font-medium">{formatForDisplay(dailyLimit)} ₽</span>
        <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
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

const BudgetRefillModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (amount: number) => void;
  currentBudget: number;
}> = ({ isOpen, onClose, onSave, currentBudget }) => {
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

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-xl p-6 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-gray-900">Пополнение бюджета</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="mb-6 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
          <div className="space-y-6">
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
            Применить
          </button>
        </div>
      </div>
    </div>
  );
};

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


const DateFilter = ({ defaultLabel }: { defaultLabel: string }) => {
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
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
        <Calendar className="w-5 h-5 text-gray-500" />
        <span>{label}</span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
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

const CreateCampaignDropdown = ({ onNavigateToCreation, onOpenSingleCampaign }: { onNavigateToCreation: () => void; onOpenSingleCampaign?: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);
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

    return (
        <div className="relative shrink-0" ref={ref}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center gap-1.5 shrink-0 px-4 py-3 rounded-[10px] bg-[#9a41fe] hover:bg-[#8840e5] text-white text-base leading-5 transition-colors"
            >
                <Plus className="w-5 h-5 shrink-0" aria-hidden />
                <span>Создать кампанию</span>
                <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1 animate-in fade-in zoom-in-95 duration-100">
                    <button type="button" onClick={() => { onOpenSingleCampaign?.(); setIsOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Создать одну кампанию
                    </button>
                    <button type="button" onClick={() => { onNavigateToCreation(); setIsOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Много кампаний
                    </button>
                </div>
            )}
        </div>
    );
};

const ExcelActionsDropdown = ({ onOpenUpload, onOpenHistory, showUploadHint = false, onDismissUploadHint }: { onOpenUpload: () => void, onOpenHistory: () => void, showUploadHint?: boolean, onDismissUploadHint?: () => void }) => {
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
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="flex items-center justify-center w-11 h-11 rounded-[10px] bg-white border border-[#f0f0f3] text-gray-700 hover:bg-gray-50 transition-colors"
                title="Загрузить Excel"
                aria-label="Меню загрузки Excel"
            >
                <Menu className="w-5 h-5 text-gray-700" />
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
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border z-20 py-1 animate-in fade-in zoom-in-95 duration-100">
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
}: {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
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
  const [allCampaigns, setAllCampaigns] = useState<DisplayCampaign[]>(MOCK_CAMPAIGNS);

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

  // Тень у левой закреплённой части таблиц при горизонтальном скролле
  const [hasCampaignsScrollShadow, setHasCampaignsScrollShadow] = useState(false);
  const [hasProductsScrollShadow, setHasProductsScrollShadow] = useState(false);

  // Вкладки списка: Кампании | Товары
  const [listTab, setListTab] = useState<'campaigns' | 'products'>('campaigns');
  // Поиск: по названию товара, названию кампании, артикулу товара, ID кампании
  const [searchQuery, setSearchQuery] = useState('');
  // Раскрытые строки товаров (вкладка Товары)
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());
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

  const getProductTags = useCallback((product: { id: string; tags: string[] }) => {
    const base = productTagsOverride[product.id] ?? product.tags;
    return base
      .map(normalizeTagName)
      .filter(t => t && !deletedTags.includes(t));
  }, [productTagsOverride, deletedTags]);

  const productInitialTags = useMemo(() =>
    Object.fromEntries(MOCK_PRODUCTS_TREE.map(p => [p.id, p.tags])),
    []);

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
    for (const camp of MOCK_CAMPAIGNS) {
      const tags = getCampaignProductTags(camp);
      for (const t of tags) {
        if (!t) continue;
        usage[t] = (usage[t] ?? 0) + 1;
      }
    }
    return usage;
  }, [getCampaignProductTags]);

  /** Ярлыки, уже добавленные на страницу (для фильтра «По ярлыкам») */
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
      setTempTags(filterTags);
      setTempTagsSearch('');
      setTempTagsCategory(filterTagsCategory);
      setTempFilterPromoTagsOnly(filterPromoTagsOnly);
    }
  }, [isFilterDropdownOpen, filterCategory, filterStatus, filterAutorefill, filterPayment, filterSort, filterByCategory, filterTags, filterTagsCategory, filterPromoTagsOnly]);

  const handleApplyFilters = () => {
    setFilterCategory(tempFilterCategory);
    setFilterStatus(tempFilterStatus);
    setFilterAutorefill(tempFilterAutorefill);
    setFilterPayment(tempFilterPayment);
    setFilterSort(tempFilterSort);
    setFilterByCategory(tempFilterByCategory);
    setFilterTags(tempTags);
    setFilterTagsCategory(tempTagsCategory);
    setFilterPromoTagsOnly(tempFilterPromoTagsOnly);
    setIsFilterDropdownOpen(false);
  };

  const handleCancelFilters = () => {
    // Reset temporary states to current applied states
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

    return filtered;
  }, [allCampaigns, filterStatus, filterAutorefill, filterPayment, filterSort, filterByCategory, filterTags, filterTagsCategory, filterPromoTagsOnly, failedFilterIds, productTagsOverride, searchQuery]);

  /** Товары, отфильтрованные по тем же правилам, что и кампании (на вкладке «Товары» показываем товар, если есть хотя бы одна подходящая кампания) */
  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS_TREE.filter((product) => {
      if (product.campaigns.length === 0) {
        if (filterStatus === 'all-except-archived' && !filterByCategory && filterTags.length === 0 && filterAutorefill === 'all' && filterPayment === 'all') return true;
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
        return true;
      });
      if (!hasMatchingCampaign) return false;
      if (filterByCategory && filterByCategory !== '' && product.category !== filterByCategory) return false;
      if (filterPromoTagsOnly && productTagsResolved.length === 0) return false;
      return true;
    });
  }, [filterStatus, filterAutorefill, filterPayment, filterTags, filterByCategory, filterPromoTagsOnly, productCampaignStatusOverride, getProductTags]);

  // Поиск по товарам: по названию товара, артикулу, артикулу WB, артикулу продавца, названию кампании, ID кампании
  const filteredProductsBySearch = useMemo(() => {
    if (!searchQuery.trim()) return filteredProducts;
    const q = searchQuery.trim().toLowerCase();
    return filteredProducts.filter((product) => {
      if ((product.name && product.name.toLowerCase().includes(q)) || (product.article && product.article.toLowerCase().includes(q)) || (product.articleWb && product.articleWb.toLowerCase().includes(q)) || (product.articleSeller && product.articleSeller.toLowerCase().includes(q))) return true;
      return product.campaigns.some((camp) => (camp.name && camp.name.toLowerCase().includes(q)) || String(camp.campaignId).toLowerCase().includes(q));
    });
  }, [filteredProducts, searchQuery]);

  const paginatedCampaigns = campaigns.slice(
    (currentPage - 1) * CAMPAIGNS_PAGE_SIZE,
    currentPage * CAMPAIGNS_PAGE_SIZE
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
    <div className="animate-in fade-in duration-300 w-full max-w-[1600px] mx-auto">
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

      {/* Шапка как в макете Figma: одна строка, отступы и стили из макета */}
      <div className="flex flex-col gap-1 mb-6">
        <div className="flex items-center gap-3 w-full">
          {/* Левая часть: вкладки (24px) + кнопка и поиск (12px) — по макету */}
          <div className="flex flex-1 gap-6 items-center min-w-0">
            {/* Вкладки: border-b-2, h-44, шрифт 18px, отступ между вкладками 24px */}
            <div className="flex gap-6 border-b-2 border-[#f0f0f3] h-11 items-end shrink-0">
              <button
                onClick={() => setListTab('campaigns')}
                className="flex flex-col items-center pb-0.5 -mb-0.5"
              >
                <span className={`text-lg leading-6 whitespace-nowrap ${listTab === 'campaigns' ? 'text-black font-medium' : 'text-[#767386]'}`}>
                  Кампании
                </span>
                <div className={`h-0.5 w-full rounded-full mt-1 ${listTab === 'campaigns' ? 'bg-[#9a41fe]' : 'bg-transparent'}`} />
              </button>
              <button
                onClick={() => setListTab('products')}
                className="flex flex-col items-center pb-0.5 -mb-0.5"
              >
                <span className={`text-lg leading-6 whitespace-nowrap ${listTab === 'products' ? 'text-black font-medium' : 'text-[#767386]'}`}>
                  Товары
                </span>
                <div className={`h-0.5 w-full rounded-full mt-1 ${listTab === 'products' ? 'bg-[#9a41fe]' : 'bg-transparent'}`} />
              </button>
            </div>
            {/* Кнопка «Создать кампанию» со стрелкой вниз и дропдауном: одна / много */}
            <CreateCampaignDropdown onNavigateToCreation={onNavigateToCreation} onOpenSingleCampaign={onOpenSingleCampaign} />
            {/* Бургер-меню (Excel) — отображаем и на вкладке «Кампании», и на вкладке «Товары» */}
            <ExcelActionsDropdown
              onOpenUpload={onOpenUploadEditsModal}
              onOpenHistory={onOpenHistoryModal}
              showUploadHint={showUploadHint}
              onDismissUploadHint={onDismissUploadHint}
            />
            <div className="flex flex-1 gap-3 items-center min-w-0">
              <div className="relative flex-1 min-w-0 max-w-[600px] h-11">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#767386] shrink-0 pointer-events-none" aria-hidden />
                <input
                  type="text"
                  placeholder="Поиск"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-full pl-10 pr-3 py-0 bg-white text-base leading-5 text-black placeholder:text-[#767386] rounded-lg border border-[#e3e4ea] focus:outline-none focus:ring-1 focus:ring-[#9a41fe] focus:border-[#9a41fe] transition"
                />
              </div>
            </div>
          </div>
          {/* Правая часть: дата, фильтр, настройки — gap-12px, кнопки rounded-[10px] */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 px-4 py-3 rounded-[10px] bg-white border border-[#f0f0f3] text-base leading-5 text-black">
              <Calendar className="w-5 h-5 text-[#767386] shrink-0" aria-hidden />
              <span>09.11.23 - 09.12.23</span>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFilterDropdownOpen(prev => !prev)}
                className="flex items-center gap-1.5 px-4 py-3 rounded-[10px] bg-white border border-[#f0f0f3] text-base leading-5 text-black hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-5 h-5 shrink-0" aria-hidden />
                <span>Фильтр</span>
              </button>
              {(listTab === 'campaigns' || listTab === 'products') && (
                <FilterDropdown
                  isOpen={isFilterDropdownOpen}
                  onClose={handleCancelFilters}
                  onApply={handleApplyFilters}
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
            <button
              type="button"
              className="flex items-center justify-center p-3 rounded-[10px] bg-[rgba(74,74,89,0.08)] hover:bg-[rgba(74,74,89,0.12)] transition-colors"
              title="Настройки"
              aria-label="Настройки"
            >
              <Settings className="w-5 h-5 text-gray-700" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      {listTab === 'campaigns' && (
      <div className="w-full max-w-[1600px]">
          <div className="w-full bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div
            className="relative overflow-x-auto"
            onScroll={(e) => {
              const target = e.currentTarget;
              setHasCampaignsScrollShadow(target.scrollLeft > 0);
            }}
          >
              {/* Тень между закреплёнными колонками и прокручиваемыми данными */}
              {hasCampaignsScrollShadow && (
                <div className="pointer-events-none absolute inset-y-0 left-[100px] w-4 bg-gradient-to-r from-black/10 to-transparent z-10" />
              )}
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
                          <th className="sticky left-[100px] z-20 p-4 text-left font-medium min-w-[300px] bg-gray-50">
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
                                onOpenCpcCampaign({ 
                                  campaignId: c.campaignId, 
                                  name: c.name,
                                  remainingBudget: c.remainingBudget,
                                  dailyLimit: c.dailyLimit,
                                  scheduledDailyLimit: c.scheduledDailyLimit,
                                  dailyLimitExhausted: c.dailyLimitExhausted
                                });
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
                              <td className="sticky left-[100px] z-10 p-4 bg-white">
                                  <div className="flex items-center gap-3">
                                      <img src={c.image} alt={c.name} className="w-10 h-10 rounded-md shrink-0"/>
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
                              <td className="p-4 font-semibold text-gray-900">{formatCurrency(c.spend)}</td>
                              <td className="p-4 font-semibold text-gray-900">{formatNumber(c.impressions)}</td>
                              <td className="p-4 font-semibold text-gray-900">{formatPercentage(c.ctr)}</td>
                              <td className="p-4 font-semibold text-gray-900">{formatNumber(c.orders)}</td>
                              <td className="p-4 font-semibold text-gray-900">{formatPercentage(c.spendShare)}</td>
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
          <div className="w-full max-w-[1600px] bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div
              className="relative overflow-x-auto"
              onScroll={(e) => {
                const target = e.currentTarget;
                setHasProductsScrollShadow(target.scrollLeft > 0);
              }}
            >
              {/* Тень справа от закреплённого столбца товара */}
              {hasProductsScrollShadow && (
                <div className="pointer-events-none absolute inset-y-0 left-[280px] w-4 bg-gradient-to-r from-black/10 to-transparent z-10" />
              )}
              <table className="relative w-full text-sm min-w-[1600px]">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                  <tr>
                    <th className="sticky left-0 z-20 p-4 text-left font-medium w-[444px] min-w-[444px] bg-gray-50">Товар</th>
                    <th className="p-4 text-left font-medium w-[160px]">
                      <span className="inline-flex items-center gap-1">Тип кампании <HelpCircle className="w-4 h-4 text-gray-400" /></span>
                    </th>
                    <th className="p-4 text-left font-medium w-[180px]">
                      <span className="inline-flex items-center gap-1">Остаток бюджета <HelpCircle className="w-4 h-4 text-gray-400" /></span>
                    </th>
                    <th className="p-4 text-left font-medium w-[180px]">
                      <span className="inline-flex items-center gap-1">Дневной лимит <HelpCircle className="w-4 h-4 text-gray-400" /></span>
                    </th>
                    <th className="p-4 text-left font-medium w-[220px] min-w-[220px] max-w-[240px]">
                      Ярлыки
                    </th>
                    <th className="p-4 text-left font-medium w-[140px]">
                      <span className="inline-flex items-center gap-1">Затраты <HelpCircle className="w-4 h-4 text-gray-400" /></span>
                    </th>
                    <th className="p-4 text-left font-medium w-[140px]">
                      <span className="inline-flex items-center gap-1">Показы <HelpCircle className="w-4 h-4 text-gray-400" /></span>
                    </th>
                    <th className="p-4 text-left font-medium w-[100px]">
                      <span className="inline-flex items-center gap-1">CTR <HelpCircle className="w-4 h-4 text-gray-400" /></span>
                    </th>
                    <th className="p-4 text-left font-medium w-[120px]">
                      <span className="inline-flex items-center gap-1">Заказы <HelpCircle className="w-4 h-4 text-gray-400" /></span>
                    </th>
                    <th className="p-4 text-left font-medium w-[140px]">
                      <span className="inline-flex items-center gap-1">Доля затрат <HelpCircle className="w-4 h-4 text-gray-400" /></span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProductsBySearch.map((product) => (
                    <React.Fragment key={product.id}>
                      {/* Строка товара */}
                      <tr className="hover:bg-gray-50/80 transition-colors">
                        <td className="sticky left-0 z-10 p-4 align-top bg-white w-[444px] min-w-[444px]">
                          <div className="flex items-start gap-3">
                            <button type="button" onClick={() => toggleProductExpanded(product.id)} className="shrink-0 mt-0.5 text-gray-400 hover:text-gray-600">
                              {expandedProductIds.has(product.id) ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                            </button>
                            <img src={product.image} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                              <div className="flex-1 min-w-0 max-w-[280px]">
                              <p className="font-medium text-gray-900">{product.name}</p>
                              <p className="text-xs text-gray-500 mt-1">Артикул WB: {product.articleWb} · Артикул продавца: {product.articleSeller}</p>
                            </div>
                          </div>
                        </td>
                        {/* Тип кампании (агрегировано по товару — сейчас пусто) */}
                        <td className="p-4 align-top w-[160px]"></td>
                        {/* Остаток бюджета (агрегировано по товару — сейчас в колонке "Затраты" ниже) */}
                        <td className="p-4 align-top w-[180px]"></td>
                        {/* Дневной лимит (агрегировано по товару — пока Н/Д) */}
                        <td className="p-4 align-top w-[180px]"></td>
                        {/* Колонка с ярлыками товара — помещается тег (до 15 символов) и "+1" */}
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
                        <td className="p-4 align-top font-semibold text-gray-900 w-[140px]">
                          {product.agg ? `${formatForDisplay(product.agg.spend)} ₽` : 'Н/Д'}
                        </td>
                        <td className="p-4 align-top font-semibold text-gray-900 w-[140px]">
                          {product.agg ? formatForDisplay(product.agg.impressions) : 'Н/Д'}
                        </td>
                        <td className="p-4 align-top font-semibold text-gray-900 w-[100px]">
                          {product.agg ? `${product.agg.ctr}%` : 'Н/Д'}
                        </td>
                        <td className="p-4 align-top font-semibold text-gray-900 w-[120px]">
                          {product.agg ? formatForDisplay(product.agg.orders) : 'Н/Д'}
                        </td>
                        <td className="p-4 align-top font-semibold text-gray-900 w-[140px]">
                          {product.agg ? `${product.agg.spendShare}%` : 'Н/Д'}
                        </td>
                      </tr>
                      {/* Вложенные строки кампаний — вид как на вкладке «Кампании» */}
                      {expandedProductIds.has(product.id) && product.campaigns.map((camp) => {
                        const effectiveStatus = (camp.status === 'draft' || camp.status === 'error' ? camp.status : (productCampaignStatusOverride[camp.id] ?? camp.status)) as 'active' | 'paused' | 'draft' | 'error';
                        const effectiveStatusText = effectiveStatus === 'active' ? 'активна' : effectiveStatus === 'paused' ? 'приостановлена' : camp.statusText;
                        return (
                          <tr key={camp.id} className="bg-gray-50/50 hover:bg-gray-50 transition-colors">
                            {/* Товар / кампания */}
                            <td className="sticky left-0 z-10 p-4 pl-14 bg-gray-50 w-[444px] min-w-[444px]">
                              <div className="flex items-center gap-3">
                                <ToggleSwitch
                                  checked={effectiveStatus === 'active'}
                                  onChange={(checked) => setProductCampaignStatusOverride(prev => ({ ...prev, [camp.id]: checked ? 'active' : 'paused' }))}
                                  disabled={camp.status === 'draft' || camp.status === 'error'}
                                />
                                <img src={product.image} alt="" className="w-10 h-10 rounded-md shrink-0 object-cover" />
                                <div className="min-w-0 flex-1 max-w-[280px]">
                                  <p className="font-medium text-gray-800 truncate" title={camp.name}>{camp.name}</p>
                                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 flex-wrap">
                                    <StatusBadge status={effectiveStatus} text={effectiveStatusText} />
                                    <span>ID {camp.campaignId}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            {/* Тип кампании */}
                            <td className="p-4 w-[160px]">
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
                            {/* Остаток бюджета */}
                            <td className="p-4 w-[180px]">
                              <div className="font-semibold text-gray-900">{formatForDisplay(camp.remainingBudget)} ₽</div>
                              {camp.autoRefill && (
                                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                                  <CheckCircle className="w-3.5 h-3.5" /> Автопополнение
                                </div>
                              )}
                            </td>
                            {/* Дневной лимит */}
                            <td className="p-4 w-[180px]" onClick={(e) => e.stopPropagation()}>
                              <DailyLimitCell
                                dailyLimit={camp.dailyLimit ?? null}
                                dailyLimitExhausted={camp.dailyLimitExhausted}
                                isCpc={camp.type === 'CPC'}
                                onClick={camp.type === 'CPC' ? () => { setSelectedCampaignForRefill(camp); setIsDailyLimitModalOpen(true); } : undefined}
                              />
                            </td>
                            {/* Пустая колонка "Ярлыки" для строк кампаний */}
                            <td className="p-4 w-[220px]" />
                            {/* Затраты и метрики */}
                            <td className="p-4 font-semibold text-gray-900 w-[140px]">{formatCurrency(camp.spend)}</td>
                            <td className="p-4 font-semibold text-gray-900 w-[140px]">{formatForDisplay(camp.impressions)}</td>
                            <td className="p-4 font-semibold text-gray-900 w-[100px]">{camp.ctr}%</td>
                            <td className="p-4 font-semibold text-gray-900 w-[120px]">{formatForDisplay(camp.orders)}</td>
                            <td className="p-4 font-semibold text-gray-900 w-[140px]">{camp.spendShare}%</td>
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
        </>
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
    </div>
  );
};