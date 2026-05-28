import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Wallet, HelpCircle, X, ChevronDown, Plus, Bell, MoreVertical } from './Icons';
import { SingleCampaignAddProductsModal } from './SingleCampaignAddProductsModal';
import { AppHeader } from './AppHeader';
import { ReferralInviteCreationBanner } from './ReferralInviteCreationBanner';
import { useProfile } from './ProfileContext';
import {
  PRODUCT_TABLE_THUMB_FALLBACK,
  resolveProductTableThumbSrc,
} from './SuccessPageTestData';

const UNIFIED_BALANCE = 105350;

type CampaignProductRow = {
  nmId: number;
  productName: string;
  imageUrl: string;
  category: string;
  brand?: string;
  articleSeller?: string;
  cpcCompatible?: boolean;
  conversionRate?: number;
  conversionChangePercent?: number;
};

const DEMO_PRODUCT_BIDS: Record<number, string> = {
  215685549: '70',
  215685550: '160',
};

function seedBidsForProducts(
  items: CampaignProductRow[],
  prev: Record<number, string>,
  fallbackBid: string,
): Record<number, string> {
  const next = { ...prev };
  items.forEach((p, index) => {
    if (next[p.nmId] !== undefined) return;
    next[p.nmId] =
      DEMO_PRODUCT_BIDS[p.nmId] ?? (index === 0 ? '70' : index === 1 ? '160' : fallbackBid);
  });
  return next;
}

// Mock products for selection
// Требование: в каждой категории минимум 7 товаров; в одной категории — 50 товаров.
export const MOCK_PRODUCTS: CampaignProductRow[] = (() => {
  const categories = ['Платья', 'Футболки', 'Кроссовки', 'Сумки', 'Косметика', 'Товары для дома'] as const;
  const massiveCategory: (typeof categories)[number] = 'Кроссовки';

  const baseNmId = 160747000;
  let seq = 0;

  const makeProduct = (category: (typeof categories)[number], indexInCategory: number): CampaignProductRow => {
    seq += 1;
    const nmId = baseNmId + seq;
    const articleSeller = `${category.slice(0, 2).toUpperCase()}-${String(indexInCategory + 1).padStart(3, '0')}`;
    const brandsByCategory: Record<(typeof categories)[number], string[]> = {
      Платья: ['Zara', 'Mango', 'Reserved'],
      Футболки: ['H&M', 'Nike', 'Decathlon'],
      Кроссовки: ['Nike', 'Adidas', 'Decathlon'],
      Сумки: ['Adidas', 'Zara', 'Reserved'],
      Косметика: ["L'Oreal", 'Oriflame'],
      'Товары для дома': ['IKEA', 'Hoff'],
    };
    const brandPool = brandsByCategory[category] ?? ['Brand'];
    const brand = brandPool[indexInCategory % brandPool.length]!;
    const namesByCategory: Record<(typeof categories)[number], string[]> = {
      Платья: [
        'Платье-рубашка льняное',
        'Платье миди с поясом',
        'Платье вечернее с пайетками',
        'Сарафан летний на бретелях',
        'Платье-футляр офисное',
        'Платье в цветочный принт',
        'Платье трикотажное облегающее',
        'Платье с запахом',
        'Платье макси струящееся',
        'Платье-комбинация сатиновое',
      ],
      Футболки: [
        'Футболка базовая хлопковая',
        'Футболка оверсайз',
        'Футболка с принтом',
        'Футболка поло',
        'Футболка спортивная дышащая',
        'Футболка с длинным рукавом',
        'Футболка укороченная',
        'Футболка с V-образным вырезом',
        'Футболка в полоску',
        'Футболка для бега',
      ],
      Кроссовки: [
        'Кроссовки беговые AirFlow',
        'Кроссовки беговые RoadRunner',
        'Кроссовки для зала FlexTrain',
        'Кроссовки повседневные CityWalk',
        'Кроссовки трейловые TrailGrip',
        'Кроссовки баскетбольные CourtPro',
        'Кроссовки с амортизацией CloudStep',
        'Кроссовки легкие UltraLite',
        'Кроссовки зимние утепленные SnowGuard',
        'Кроссовки текстильные BreezeKnit',
      ],
      Сумки: [
        'Рюкзак городской',
        'Сумка шоппер',
        'Сумка через плечо',
        'Сумка поясная',
        'Сумка дорожная',
        'Клатч вечерний',
        'Сумка кожаная классическая',
        'Рюкзак спортивный',
        'Сумка для ноутбука',
        'Сумка кросс-боди',
      ],
      Косметика: [
        'Крем увлажняющий для лица 50 мл',
        'Сыворотка с витамином C',
        'Тушь для ресниц удлиняющая',
        'Помада матовая',
        'Пудра компактная',
        'Тональный крем',
        'Пенка для умывания',
        'Шампунь восстановление',
        'Бальзам для волос',
        'Маска для лица тканевая',
      ],
      'Товары для дома': [
        'Набор полотенец 3 шт',
        'Настольная лампа',
        'Плед декоративный',
        'Ваза керамическая',
        'Набор посуды 6 персон',
        'Органайзер для кухни',
        'Подушка декоративная',
        'Свеча ароматическая',
        'Коврик для ванной',
        'Корзина для хранения',
      ],
    };

    const sneakerModels = [
      'AirFlow',
      'RoadRunner',
      'FlexTrain',
      'CityWalk',
      'TrailGrip',
      'CourtPro',
      'CloudStep',
      'UltraLite',
      'SnowGuard',
      'BreezeKnit',
      'Pulse',
      'Sprint',
      'Core',
      'Nova',
      'Edge',
      'Prime',
    ];
    const sneakerColors = [
      'чёрные',
      'белые',
      'серые',
      'синие',
      'красные',
      'зелёные',
      'бежевые',
      'фиолетовые',
      'оранжевые',
      'розовые',
    ];
    const sneakerUse = [
      'для бега',
      'для зала',
      'повседневные',
      'трейловые',
      'баскетбольные',
      'на платформе',
      'с амортизацией',
      'легкие',
      'утепленные',
      'текстильные',
    ];

    const baseNamePool = namesByCategory[category] ?? ['Товар'];
    const baseName = baseNamePool[indexInCategory % baseNamePool.length]!;
    const productName =
      category === massiveCategory
        ? `Кроссовки ${sneakerUse[indexInCategory % sneakerUse.length]} ${sneakerModels[indexInCategory % sneakerModels.length]} ${sneakerColors[indexInCategory % sneakerColors.length]}`
        : baseName;

    // Дет. метрики для отображения/сортировки: конверсия и её динамика
    const convRaw = ((nmId % 37) + 8) / 1000; // 0.8%..4.4%
    const conversionRate = Math.max(0.003, Math.min(0.08, convRaw));
    const conversionChangePercent = ((nmId % 21) - 10) * 2; // -20..+20

    return {
      nmId,
      productName,
      brand,
      articleSeller,
      // Явный URL для превью, чтобы картинки точно отличались
      imageUrl: `https://picsum.photos/seed/wb-${nmId}/60/76`,
      category,
      // иногда несовместимы с CPC, чтобы было видно дизейбл-стейт
      cpcCompatible: indexInCategory % 8 !== 0,
      conversionRate,
      conversionChangePercent,
    };
  };

  const result: CampaignProductRow[] = [];
  for (const category of categories) {
    const count = category === massiveCategory ? 50 : 7;
    for (let i = 0; i < count; i += 1) {
      result.push(makeProduct(category, i));
    }
  }
  return result;
})();

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

type ProductRecommendationsTab = 'growth' | 'ab' | 'promo';

const PRODUCT_RECOMMENDATIONS_TAB_COUNTS: Record<ProductRecommendationsTab, number> = {
  growth: 5,
  ab: 3,
  promo: 3,
};

function computeProspectsPickNmIds(params: {
  products: CampaignProductRow[];
  selectedRecommendationCategory: string | null;
  recommendationsTab: ProductRecommendationsTab;
}): number[] {
  const { products, selectedRecommendationCategory, recommendationsTab } = params;
  const alreadyAdded = new Set(products.map((p) => p.nmId));
  const inCategory = MOCK_PRODUCTS.filter(
    (p) => (selectedRecommendationCategory ? p.category === selectedRecommendationCategory : true),
  );

  const notAdded = inCategory.filter((p) => !alreadyAdded.has(p.nmId));
  const byNmDesc = (a: CampaignProductRow, b: CampaignProductRow) => b.nmId - a.nmId;
  const inPromo = (p: CampaignProductRow) => p.nmId % 7 === 0;
  const inAbTest = (p: CampaignProductRow) => p.nmId % 9 === 0;
  const orders = (p: CampaignProductRow) => ((p.nmId % 180) + 40) | 0; // deterministic demo

  const sorted = (() => {
    switch (recommendationsTab) {
      case 'promo':
        return notAdded.filter(inPromo).slice().sort(byNmDesc);
      case 'ab':
        return notAdded.filter(inAbTest).slice().sort(byNmDesc);
      case 'growth':
      default:
        return notAdded.slice().sort((a, b) => orders(b) - orders(a) || byNmDesc(a, b));
    }
  })();

  const limit = PRODUCT_RECOMMENDATIONS_TAB_COUNTS[recommendationsTab] ?? 3;
  return sorted.slice(0, limit).map((p) => p.nmId);
}

function ProductRecommendationsTabToggle({
  value,
  onChange,
  items,
  ariaLabel = 'Подборки товаров',
  className = '',
}: {
  value: ProductRecommendationsTab;
  onChange: (tab: ProductRecommendationsTab) => void;
  items: { id: ProductRecommendationsTab; label: string; count: number }[];
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex max-w-full flex-wrap rounded-xl bg-[#F2F2F7] p-0.5 text-xs font-semibold text-[#4A4D57] ${className}`}
      role="tablist"
      aria-label={ariaLabel}
    >
      {items.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={`whitespace-nowrap rounded-[10px] px-2.5 py-1.5 transition-colors ${
            value === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'hover:text-gray-900'
          }`}
        >
          {tab.label}{' '}
          <span className="font-semibold tabular-nums text-gray-400">{tab.count}</span>
        </button>
      ))}
    </div>
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

function HeaderHint({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-normal text-gray-400">
      {label}
      <HelpCircle className="h-3.5 w-3.5 text-gray-300" aria-hidden />
    </span>
  );
}

interface SingleCampaignPageProps {
  onBack: () => void;
  onNavigateToMassCreation: (items: CampaignProductRow[]) => void;
}

// Шапка приложения вынесена в общий компонент `AppHeader`.

const Toast = ({ show, message, onClose }: { show: boolean, message: string, onClose: () => void }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);
  
  if (!show) return null;
  
  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-xl z-[100] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
      <span className="font-medium">{message}</span>
    </div>
  );
};

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

export const SingleCampaignPage: React.FC<SingleCampaignPageProps> = ({
  onBack,
  onNavigateToMassCreation,
}) => {
  const {
    profileId,
    showReferralInviteCreationBanner,
    singleCampaignSeed,
    clearSingleCampaignSeed,
    notifyReferralCampaignCreatedFromCreation,
  } = useProfile();
  const repeatSeedAppliedRef = useRef(false);
  const [campaignName, setCampaignName] = useState('Кампания от 26.12.2024');
  const [paymentModel, setPaymentModel] = useState<'CPM' | 'CPC'>('CPM');
  const [budget, setBudget] = useState('3000');

  useEffect(() => {
    if (profileId === '2' && showReferralInviteCreationBanner) {
      setBudget('2000');
    }
  }, [profileId, showReferralInviteCreationBanner]);
  const [isAutoRefillEnabled, setIsAutoRefillEnabled] = useState(false);
  const [bidType, setBidType] = useState<'unified' | 'manual'>('unified');
  const [unifiedBid, setUnifiedBid] = useState('500');
  const [manualBid, setManualBid] = useState('500');
  const [isDailyLimitEnabled, setIsDailyLimitEnabled] = useState(false);
  const [dailyLimitValue, setDailyLimitValue] = useState('2000');
  const [isDailyLimitTooltipVisible, setIsDailyLimitTooltipVisible] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isMultiCategoryWarningOpen, setIsMultiCategoryWarningOpen] = useState(false);
  const [products, setProducts] = useState<CampaignProductRow[]>([]);
  const [productBidsByNmId, setProductBidsByNmId] = useState<Record<number, string>>({});
  const [isAddProductsModalOpen, setIsAddProductsModalOpen] = useState(false);
  const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false);
  const [actionsMenuNmId, setActionsMenuNmId] = useState<number | null>(null);
  const [recommendationsTab, setRecommendationsTab] = useState<ProductRecommendationsTab>('growth');
  const [recommendationsCategoryOpen, setRecommendationsCategoryOpen] = useState(false);
  const [prospectsPickNmIds, setProspectsPickNmIds] = useState<number[]>(() =>
    computeProspectsPickNmIds({
      products: [],
      selectedRecommendationCategory: null,
      recommendationsTab: 'growth',
    }),
  );
  const recommendationsCategoryRef = useRef<HTMLDivElement>(null);
  const recommendationCategories = useMemo(
    () => Array.from(new Set(MOCK_PRODUCTS.map((p) => p.category))).sort((a, b) => a.localeCompare(b, 'ru')),
    [],
  );
  const [selectedRecommendationCategory, setSelectedRecommendationCategory] = useState<string | null>(null);
  const uploadMenuRef = useRef<HTMLDivElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    if (!isUploadMenuOpen) return;
    const onDocMouseDown = (event: MouseEvent) => {
      if (uploadMenuRef.current?.contains(event.target as Node)) return;
      setIsUploadMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [isUploadMenuOpen]);

  useEffect(() => {
    if (!recommendationsCategoryOpen) return;
    const onDocMouseDown = (event: MouseEvent) => {
      if (recommendationsCategoryRef.current?.contains(event.target as Node)) return;
      setRecommendationsCategoryOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [recommendationsCategoryOpen]);

  useEffect(() => {
    if (actionsMenuNmId === null) return;
    const onDocMouseDown = (event: MouseEvent) => {
      if (actionsMenuRef.current?.contains(event.target as Node)) return;
      setActionsMenuNmId(null);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [actionsMenuNmId]);

  useEffect(() => {
    if (!singleCampaignSeed || repeatSeedAppliedRef.current) return;
    repeatSeedAppliedRef.current = true;
    const seeded = [singleCampaignSeed.product];
    setProducts(seeded);
    setProductBidsByNmId((prev) =>
      seedBidsForProducts(seeded, prev, paymentModel === 'CPM' ? unifiedBid : unifiedBid),
    );
    if (singleCampaignSeed.campaignName) {
      setCampaignName(singleCampaignSeed.campaignName);
    }
    clearSingleCampaignSeed();
  }, [singleCampaignSeed, clearSingleCampaignSeed]);

  const formatForDisplay = (num: string | number): string => {
    if (typeof num === 'string') {
      const parsed = Number(num.replace(/\s/g, '').replace(/,/g, '.'));
      if (isNaN(parsed)) return num;
      return parsed.toLocaleString('ru-RU', { useGrouping: true });
    }
    return num.toLocaleString('ru-RU', { useGrouping: true });
  };

  const parseDisplayValue = (str: string): number => {
    return Number(String(str).replace(/\s/g, '').replace(/,/g, '.'));
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseDisplayValue(e.target.value);
    if (!isNaN(parsed)) {
      setBudget(String(parsed));
    } else if (e.target.value === '') {
      setBudget('');
    }
  };

  const handleBudgetBlur = () => {
    const parsed = parseDisplayValue(budget);
    if (isNaN(parsed) || parsed < 1000) {
      setBudget('1000');
      setToastMessage('Минимальный бюджет 1000 ₽');
      setShowToast(true);
    }
  };

  const handleBidChange = (value: string, type: 'unified' | 'manual') => {
    const parsed = parseDisplayValue(value);
    if (!isNaN(parsed)) {
      if (type === 'unified') {
        setUnifiedBid(String(parsed));
      } else {
        setManualBid(String(parsed));
      }
    } else if (value === '') {
      if (type === 'unified') {
        setUnifiedBid('');
      } else {
        setManualBid('');
      }
    }
  };

  const bidFallback = paymentModel === 'CPM' ? unifiedBid : unifiedBid;

  const replaceProducts = (next: CampaignProductRow[]) => {
    setProducts(next);
    setProductBidsByNmId((prev) => seedBidsForProducts(next, prev, bidFallback));
  };

  const removeProduct = (nmId: number) => {
    replaceProducts(products.filter((p) => p.nmId !== nmId));
    setActionsMenuNmId(null);
    setToastMessage('Товар удалён');
    setShowToast(true);
  };

  const getProductBid = (nmId: number) => productBidsByNmId[nmId] ?? bidFallback;

  const handleProductBidChange = (nmId: number, value: string) => {
    const parsed = parseDisplayValue(value);
    if (!isNaN(parsed)) {
      setProductBidsByNmId((prev) => ({ ...prev, [nmId]: String(parsed) }));
    } else if (value === '') {
      setProductBidsByNmId((prev) => ({ ...prev, [nmId]: '' }));
    }
  };

  const bidColumnTitle =
    paymentModel === 'CPC' ? 'Ставка (CPC)' : 'Ставка (CPM)';

  const alreadyAddedNmIds = useMemo(
    () => new Set(products.map((p) => p.nmId)),
    [products],
  );

  const isSingleCategoryAdditionAllowed = (
    existing: CampaignProductRow[],
    incoming: CampaignProductRow[],
  ) => {
    const existingCategory = existing[0]?.category;
    const categories = new Set(
      [
        ...(existingCategory ? [existingCategory] : []),
        ...incoming.map((p) => p.category),
      ].filter(Boolean),
    );
    return categories.size <= 1;
  };

  const recommendationItems = useMemo(
    () => [
      {
        id: 'growth' as const,
        label: 'Рост заказов',
        count: PRODUCT_RECOMMENDATIONS_TAB_COUNTS.growth,
      },
      { id: 'ab' as const, label: 'А/Б тест', count: PRODUCT_RECOMMENDATIONS_TAB_COUNTS.ab },
      { id: 'promo' as const, label: 'В акциях', count: PRODUCT_RECOMMENDATIONS_TAB_COUNTS.promo },
    ],
    [],
  );

  useEffect(() => {
    // When category/sort changes, rebuild the pick (3 items max).
    setProspectsPickNmIds(
      computeProspectsPickNmIds({
        products,
        selectedRecommendationCategory,
        recommendationsTab,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRecommendationCategory, recommendationsTab]);

  useEffect(() => {
    // If products are added via other paths (modal), keep pick in sync (remove added).
    setProspectsPickNmIds((prev) => prev.filter((id) => !alreadyAddedNmIds.has(id)));
  }, [alreadyAddedNmIds]);

  const recommendedProducts = useMemo(() => {
    if (prospectsPickNmIds.length === 0) return [];
    const byId = new Map(MOCK_PRODUCTS.map((p) => [p.nmId, p] as const));
    return prospectsPickNmIds.map((id) => byId.get(id)).filter(Boolean) as CampaignProductRow[];
  }, [prospectsPickNmIds]);

  const addFromRecommendations = (p: CampaignProductRow) => {
    if (alreadyAddedNmIds.has(p.nmId)) return;
    if (!isSingleCategoryAdditionAllowed(products, [p])) {
      setIsMultiCategoryWarningOpen(true);
      return;
    }
    replaceProducts([...products, p]);
    // Remove from current pick without refilling.
    setProspectsPickNmIds((prev) => prev.filter((id) => id !== p.nmId));
    setToastMessage('Товар добавлен');
    setShowToast(true);
  };

  const renderProductBidCell = (nmId: number) => {
    const raw = getProductBid(nmId);
    return (
      <div className="flex items-center justify-end gap-1">
        <div className="inline-flex h-9 min-w-[5.5rem] items-center rounded-lg border border-gray-200 bg-white px-2.5 text-sm text-gray-900">
          <input
            type="text"
            value={formatForDisplay(raw)}
            onChange={(e) => handleProductBidChange(nmId, e.target.value)}
            className="w-full min-w-0 border-0 bg-transparent p-0 text-sm outline-none focus:ring-0"
          />
          <span className="shrink-0 text-gray-500">₽</span>
        </div>
        <BidHistogramButton />
      </div>
    );
  };

  const uploadMenu = (
    <div className="relative" ref={uploadMenuRef}>
      <button
        type="button"
        onClick={() => setIsUploadMenuOpen((open) => !open)}
        className="inline-flex items-center gap-2 rounded-xl bg-[#F2F2F7] px-4 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-[#e8e8ed]"
      >
        Загрузить
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-600 transition-transform ${isUploadMenuOpen ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {isUploadMenuOpen && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-20 min-w-[12rem] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => {
              setIsUploadMenuOpen(false);
              excelInputRef.current?.click();
            }}
          >
            Загрузить Excel
          </button>
        </div>
      )}
      <input
        ref={excelInputRef}
        type="file"
        accept=".xlsx,.csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          replaceProducts(MOCK_PRODUCTS.slice(0, 2));
          setToastMessage('Товары загружены из файла');
          setShowToast(true);
        }}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F7FA] font-sans text-gray-900" style={{ background: '#F7F7FA' }}>
      <AppHeader onNavigate={onBack} />
      
      <main className={`flex flex-col items-center px-6 py-8 gap-6 ${products.length > 0 ? 'pb-24' : ''}`}>
        {profileId === '2' && showReferralInviteCreationBanner && (
          <div className="w-full max-w-[1200px]">
            <ReferralInviteCreationBanner />
          </div>
        )}
        {/* Управление кампанией */}
        <div className="bg-white rounded-2xl p-6 w-full max-w-[1200px] mx-auto">
          <div className="flex flex-col gap-6">
            {/* Заголовок */}
            <div className="flex justify-between items-start gap-4">
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="font-heading text-[28px] font-[680] leading-9 text-gray-900 bg-transparent border-none outline-none focus:outline-none text-left flex-1 min-w-0"
              />
              <button className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm flex-shrink-0">
                <span>Информация</span>
              </button>
            </div>

            {/* Модель оплаты */}
            <div className="flex items-start gap-6">
              <div
                onClick={() => setPaymentModel('CPM')}
                className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentModel === 'CPM'
                    ? 'bg-[#F0F0F3] border-[#F0F0F3]'
                    : 'bg-white border-[#F0F0F3] hover:border-purple-300'
                }`}
                style={{ width: '240px', height: '65px' }}
              >
                <div className="flex items-center justify-center w-6 h-6 mt-0.5">
                  {paymentModel === 'CPM' ? (
                    <div className="w-[18px] h-[18px] bg-[#9A41FE] rounded-full"></div>
                  ) : (
                    <div className="w-[18px] h-[18px] bg-white border-2 border-[#BBB7C9] rounded-full"></div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-body text-base font-normal text-gray-900">
                    CPM
                  </span>
                  <span className="font-body text-xs text-[#77767E]">
                    Оплата за показы
                  </span>
                </div>
              </div>

              <div
                onClick={() => setPaymentModel('CPC')}
                className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentModel === 'CPC'
                    ? 'bg-[#F0F0F3] border-[#F0F0F3]'
                    : 'bg-white border-[#F0F0F3] hover:border-purple-300'
                }`}
                style={{ width: '240px', height: '65px' }}
              >
                <div className="flex items-center justify-center w-6 h-6 mt-0.5">
                  {paymentModel === 'CPC' ? (
                    <div className="w-[18px] h-[18px] bg-[#9A41FE] rounded-full"></div>
                  ) : (
                    <div className="w-[18px] h-[18px] bg-white border-2 border-[#BBB7C9] rounded-full"></div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-body text-base font-normal text-[#4A4A59]">
                    CPC
                  </span>
                  <span className="font-body text-xs text-[#77767E]">
                    Оплата за клики
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Плавающий остров — бюджет */}
        <div className="bg-white rounded-2xl p-6 w-full max-w-[1200px] mx-auto">
          <div className="flex flex-col gap-4">
            <h2 className="font-heading text-[22px] font-[680] leading-7 text-gray-900">
              Бюджет
            </h2>
            
            {paymentModel === 'CPC' && isDailyLimitEnabled && parseDisplayValue(dailyLimitValue) > parseDisplayValue(budget) && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-900 font-medium">
                  Чтобы задать дневной лимит {formatForDisplay(dailyLimitValue)} ₽, пополните бюджет еще на {formatForDisplay(parseDisplayValue(dailyLimitValue) - parseDisplayValue(budget))} ₽
                </p>
              </div>
            )}
            
            <div className="flex flex-wrap items-start gap-6">
              {/* Бюджет кампании */}
              <div className="flex flex-col gap-2" style={{ width: '240px' }}>
                <label className="font-body text-base text-[#4E4E53]">
                  Бюджет кампании
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formatForDisplay(budget)}
                    onChange={handleBudgetChange}
                    onBlur={handleBudgetBlur}
                    className="w-full px-3 py-3 bg-white border border-[#E3E4EA] rounded-lg outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <p className="font-body text-xs font-semibold text-[#767386]">
                  Минимальный бюджет 1000 ₽
                </p>
              </div>

              {/* Автопополнение */}
              <div className="flex flex-col gap-1 pt-6" style={{ minWidth: '300px', flex: 1 }}>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAutoRefillEnabled(!isAutoRefillEnabled)}
                    className={`relative inline-flex items-center rounded-full transition-colors duration-200 ${
                      isAutoRefillEnabled ? 'bg-[#9A41FE]' : 'bg-[#767386]'
                    }`}
                    style={{ width: '30px', height: '18px' }}
                  >
                    <span
                      className={`inline-block rounded-full bg-white transition-transform duration-200 ${
                        isAutoRefillEnabled ? 'translate-x-[14px]' : 'translate-x-[3px]'
                      }`}
                      style={{ width: '12px', height: '12px' }}
                    />
                  </button>
                  <span className="font-body text-base text-[#5067DE]">
                    Автопополнение бюджета
                  </span>
                  <div className="relative">
                    <HelpCircle className="w-4 h-4 text-[#4E4E53] cursor-help" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Дневной лимит - только для CPC */}
        {paymentModel === 'CPC' && (
          <div className="bg-white rounded-2xl p-5 w-full max-w-[1200px] shadow-sm border border-gray-100 mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ToggleSwitch 
                  checked={isDailyLimitEnabled} 
                  onChange={(checked) => {
                    setIsDailyLimitEnabled(checked);
                  }} 
                />
                <p className="font-body text-sm text-gray-800 flex items-center gap-1">
                  Дневной лимит
                  <div 
                    className="relative inline-block"
                    onMouseEnter={() => setIsDailyLimitTooltipVisible(true)}
                    onMouseLeave={() => setIsDailyLimitTooltipVisible(false)}
                  >
                    <HelpCircle className="w-4 h-4 text-gray-600 cursor-help" />
                    {isDailyLimitTooltipVisible && (
                      <>
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-80 h-2" onMouseEnter={() => setIsDailyLimitTooltipVisible(true)}></div>
                        <div 
                          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50 text-left"
                          onMouseEnter={() => setIsDailyLimitTooltipVisible(true)}
                          onMouseLeave={() => setIsDailyLimitTooltipVisible(false)}
                        >
                          <p className="font-semibold mb-2">Как работает равномерная открутка лимита?</p>
                          <p className="mb-2">Сумму, которую вы зададите в лимите мы будем расходовать в течение дня равномерно, она не сгорит за 1-2 часа. Так вы достигаете наилучших показателей по показам.</p>
                          <a href="#" className="text-purple-300 hover:underline">Читать подробнее</a>
                        </div>
                      </>
                    )}
                  </div>
                </p>
              </div>
            </div>
            {isDailyLimitEnabled && (
              <>
                <div className="flex items-center gap-4">
                  <div className="relative w-1/3">
                    <input
                      type="text"
                      value={formatForDisplay(dailyLimitValue)}
                      onChange={(e) => {
                        const parsed = parseDisplayValue(e.target.value);
                        if (!isNaN(parsed)) {
                          setDailyLimitValue(String(parsed));
                        } else if (e.target.value === '') {
                          setDailyLimitValue('');
                        }
                      }}
                      onBlur={() => {
                        const parsed = parseDisplayValue(dailyLimitValue);
                        if (isNaN(parsed) || parsed < 2000) {
                          setDailyLimitValue('2000');
                        }
                      }}
                      className="w-full text-sm bg-white border shadow-sm outline-none transition-colors focus:border-purple-500 focus:ring-1 focus:ring-purple-500 px-2 py-1.5 rounded-lg pr-6 border-gray-300"
                      placeholder="2000"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">₽</span>
                  </div>
                  <p className="text-xs text-gray-500 flex-1">
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const current = parseDisplayValue(dailyLimitValue) || 0;
                      setDailyLimitValue(String(current + 1000));
                    }}
                    className="px-2 py-1 text-xs font-medium rounded-md transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
                  >
                    +1000₽
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const current = parseDisplayValue(dailyLimitValue) || 0;
                      setDailyLimitValue(String(current + 3000));
                    }}
                    className="px-2 py-1 text-xs font-medium rounded-md transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
                  >
                    +3000₽
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const current = parseDisplayValue(dailyLimitValue) || 0;
                      setDailyLimitValue(String(current + 5000));
                    }}
                    className="px-2 py-1 text-xs font-medium rounded-md transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
                  >
                    +5000₽
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Зоны показов */}
        <div className="bg-white rounded-2xl p-6 w-full max-w-[1200px] mx-auto">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-1">
              <h2 className="font-heading text-[22px] font-[680] leading-7 text-gray-900">
                Зона показа
              </h2>
            </div>

            <div className="flex flex-col gap-3">
              {/* Единая ставка */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBidType('unified')}
                  className="flex items-center justify-center w-6 h-6 flex-shrink-0"
                >
                  {bidType === 'unified' ? (
                    <div className="w-[18px] h-[18px] bg-[#9A41FE] rounded-full"></div>
                  ) : (
                    <div className="w-[18px] h-[18px] bg-white border-2 border-[#BBB7C9] rounded-full"></div>
                  )}
                </button>
                <span
                  className="font-body text-base text-gray-900"
                >
                  Единая ставка: продвижение сразу в поиске, каталоге и рекомендациях
                </span>
              </div>

              {/* Ручное управление */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBidType('manual')}
                  className="flex items-center justify-center w-6 h-6 flex-shrink-0"
                >
                  {bidType === 'manual' ? (
                    <div className="w-[18px] h-[18px] bg-[#9A41FE] rounded-full"></div>
                  ) : (
                    <div className="w-[18px] h-[18px] bg-white border-2 border-[#BBB7C9] rounded-full"></div>
                  )}
                </button>
                <span
                  className="font-body text-base text-[#4A4A59]"
                >
                  Ручная ставка: выбирайте зоны показов и ставку для них
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Товары */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 w-full max-w-[1200px] mx-auto">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
              <p className="mb-6 max-w-lg text-sm leading-relaxed text-gray-500">
                Выберите товары для продвижения или загрузите с помощью Excel
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddProductsModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#2E3038] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#23252c]"
                >
                  <Plus className="h-4 w-4 shrink-0" aria-hidden />
                  Добавить товары
                </button>
                <div className="relative" ref={uploadMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsUploadMenuOpen((open) => !open)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#F2F2F7] px-5 py-3 text-sm font-medium text-gray-900 transition-colors hover:bg-[#e8e8ed]"
                  >
                    Загрузить
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-gray-600 transition-transform ${isUploadMenuOpen ? 'rotate-180' : ''}`}
                      aria-hidden
                    />
                  </button>
                  {isUploadMenuOpen && (
                    <div className="absolute left-0 top-[calc(100%+8px)] z-20 min-w-[12rem] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                      <button
                        type="button"
                        className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => {
                          setIsUploadMenuOpen(false);
                          excelInputRef.current?.click();
                        }}
                      >
                        Загрузить Excel
                      </button>
                    </div>
                  )}
                  <input
                    ref={excelInputRef}
                    type="file"
                    accept=".xlsx,.csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (!file) return;
                      replaceProducts(MOCK_PRODUCTS.slice(0, 2));
                      setToastMessage('Товары загружены из файла');
                      setShowToast(true);
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-bold text-gray-900">
                  Товары{' '}
                  <span className="font-normal text-gray-500">
                    {products.length} шт.
                  </span>
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddProductsModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#F2F2F7] px-4 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-[#e8e8ed]"
                  >
                    <Plus className="h-4 w-4 shrink-0" aria-hidden />
                    Добавить товары
                  </button>
                  {uploadMenu}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left">
                      <th className="pb-3 pr-3 font-normal">
                        <HeaderHint label="Фото" />
                      </th>
                      <th className="pb-3 pr-4 font-normal">
                        <HeaderHint label="Бренд · Артикул · Название" />
                      </th>
                      <th className="pb-3 pr-4 font-normal text-right">
                        <span className="inline-flex justify-end">
                          <HeaderHint label={bidColumnTitle} />
                        </span>
                      </th>
                      {paymentModel === 'CPM' && bidType === 'manual' && (
                        <th className="pb-3 pr-4 font-normal text-right">
                          <span className="inline-flex justify-end">
                            <HeaderHint label="В рекомендациях (CPM)" />
                          </span>
                        </th>
                      )}
                      <th className="pb-3 pr-2 font-normal">
                        <HeaderHint label="Преследование ставки" />
                      </th>
                      <th className="pb-3 w-10" aria-hidden />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map((product) => {
                      const brand = product.brand ?? '—';
                      const article = product.articleSeller ?? '—';
                      return (
                        <tr key={product.nmId} className="align-middle">
                          <td className="py-3 pr-3">
                            <CampaignProductThumb
                              nmId={product.nmId}
                              imageUrl={product.imageUrl}
                              category={product.category}
                              alt={product.productName}
                            />
                          </td>
                          <td className="py-3 pr-4">
                            <p className="text-sm font-semibold leading-tight text-gray-900">
                              {product.productName}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-gray-500">
                              {brand} · {article}
                            </p>
                            <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                              <span>· {product.nmId}</span>
                              <CopyNmIdButton nmId={product.nmId} />
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-right">
                            {renderProductBidCell(product.nmId)}
                          </td>
                          {paymentModel === 'CPM' && bidType === 'manual' && (
                            <td className="py-3 pr-4 text-right">
                              {renderProductBidCell(product.nmId)}
                            </td>
                          )}
                          <td className="py-3 pr-2">
                            <button
                              type="button"
                              className="rounded-lg bg-[#F2F2F7] px-4 py-2 text-sm font-medium text-gray-800 hover:bg-[#e8e8ed]"
                              onClick={() => {
                                setToastMessage('Настройка преследования ставки');
                                setShowToast(true);
                              }}
                            >
                              Настроить
                            </button>
                          </td>
                          <td className="py-3 text-right">
                            <div className="relative inline-flex" ref={actionsMenuNmId === product.nmId ? actionsMenuRef : null}>
                              <button
                                type="button"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                                aria-label="Действия"
                                aria-haspopup="menu"
                                aria-expanded={actionsMenuNmId === product.nmId}
                                onClick={() =>
                                  setActionsMenuNmId((prev) => (prev === product.nmId ? null : product.nmId))
                                }
                              >
                                <MoreVertical className="h-5 w-5" />
                              </button>
                              {actionsMenuNmId === product.nmId && (
                                <div
                                  role="menu"
                                  className="absolute right-0 bottom-[calc(100%+6px)] z-50 min-w-[10rem] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
                                >
                                  <button
                                    type="button"
                                    role="menuitem"
                                    className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                    onClick={() => removeProduct(product.nmId)}
                                  >
                                    Удалить
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Рекомендации / перспективные товары */}
        {(
          <section className="flex w-full max-w-[1200px] flex-col gap-6 mx-auto">
            <div className="bg-white rounded-2xl p-6 w-full">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex min-w-0 items-center gap-3">
                  <h3 className="font-heading min-w-0 text-[22px] font-[680] leading-7 text-gray-900">
                    Рекомендуем перспективные
                  </h3>
                  <ProductRecommendationsTabToggle
                    value={recommendationsTab}
                    onChange={setRecommendationsTab}
                    items={recommendationItems}
                    className="scale-[0.92] origin-left"
                    ariaLabel="Подборки товаров"
                  />
                </div>
                <div className="relative" ref={recommendationsCategoryRef}>
                  <button
                    type="button"
                    onClick={() => setRecommendationsCategoryOpen((o) => !o)}
                    className="inline-flex h-8 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 hover:border-gray-300"
                    aria-label="Категории"
                    aria-haspopup="menu"
                    aria-expanded={recommendationsCategoryOpen}
                  >
                    {selectedRecommendationCategory ?? 'Все категории'}
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${
                        recommendationsCategoryOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden
                    />
                  </button>
                  {recommendationsCategoryOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-[calc(100%+6px)] z-30 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                          selectedRecommendationCategory === null
                            ? 'bg-purple-50 font-medium text-purple-700'
                            : 'text-gray-800'
                        }`}
                        onClick={() => {
                          setSelectedRecommendationCategory(null);
                          setRecommendationsCategoryOpen(false);
                        }}
                      >
                        Все категории
                      </button>
                      <div className="my-1 h-px bg-gray-100" />
                      <div className="max-h-56 overflow-y-auto">
                        {recommendationCategories.map((cat) => {
                          const selected = selectedRecommendationCategory === cat;
                          return (
                            <button
                              key={cat}
                              type="button"
                              role="menuitem"
                              className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                                selected ? 'bg-purple-50 font-medium text-purple-700' : 'text-gray-800'
                              }`}
                              onClick={() => {
                                setSelectedRecommendationCategory(cat);
                                setRecommendationsCategoryOpen(false);
                              }}
                            >
                              {cat}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain">
                <div className="mb-3 rounded-lg bg-emerald-50 px-3 py-2">
                  <span className="text-sm font-semibold text-emerald-800">
                    Лучшие для продвижения
                  </span>
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-100">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-xs font-normal text-gray-400">
                        <th className="w-[52px] px-2 py-2">Фото</th>
                        <th className="px-3 py-2">Товар</th>
                        <th className="w-[160px] px-3 py-2">Категория</th>
                        <th className="w-[120px] px-3 py-2 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {recommendedProducts.map((p) => (
                        <tr key={p.nmId} className="transition-colors hover:bg-gray-50/70">
                          <td className="px-2 py-2 align-middle">
                            <CampaignProductThumb
                              nmId={p.nmId}
                              imageUrl={p.imageUrl}
                              category={p.category}
                              alt={p.productName}
                            />
                          </td>
                          <td className="px-3 py-2 align-middle">
                            <p className="mb-0 text-sm font-medium text-gray-900">{p.productName}</p>
                            <p className="mt-[2px] text-xs text-gray-500">
                              {p.brand} · {p.nmId}
                            </p>
                          </td>
                          <td className="px-3 py-2 align-middle text-sm text-gray-500">
                            {p.category}
                          </td>
                          <td className="px-3 py-2 align-middle text-right">
                            <button
                              type="button"
                              onClick={() => addFromRecommendations(p)}
                              className="rounded-lg bg-[#F2F2F7] px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-[#e8e8ed]"
                            >
                              Добавить
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </section>
        )}
      </main>

      {/* Toast */}
      <Toast show={showToast} message={toastMessage} onClose={() => setShowToast(false)} />

      {/* Modal for adding products */}
      <SingleCampaignAddProductsModal
        isOpen={isAddProductsModalOpen}
        onClose={() => setIsAddProductsModalOpen(false)}
        options={MOCK_PRODUCTS}
        alreadyAddedNmIds={alreadyAddedNmIds}
        isCpcMode={paymentModel === 'CPC'}
        onConfirm={(added) => {
          if (!isSingleCategoryAdditionAllowed(products, added)) {
            setIsMultiCategoryWarningOpen(true);
            return false;
          }
          const merged = [...products];
          for (const p of added) {
            if (!merged.some((m) => m.nmId === p.nmId)) merged.push(p);
          }
          replaceProducts(merged);
          const n = added.length;
          setToastMessage(
            n === 1 ? 'Товар добавлен' : `Добавлено ${n} товаров`,
          );
          setShowToast(true);
          return true;
        }}
      />

      {isMultiCategoryWarningOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsMultiCategoryWarningOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-bold text-gray-900">
              Добавляйте товары из разных категорий в массовом создании кампании
            </h3>
              <button
                type="button"
                onClick={() => setIsMultiCategoryWarningOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Закрыть"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-sm leading-snug text-gray-600">
              В одной кампании можно добавлять товары только из одной категории. Если хотите
              добавлять товары из разных категорий — создайте отдельную кампанию для каждого товара
              (или для каждой категории).
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsMultiCategoryWarningOpen(false)}
                className="rounded-xl bg-[#F2F2F7] px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-[#e8e8ed]"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMultiCategoryWarningOpen(false);
                  onNavigateToMassCreation(products);
                }}
                className="rounded-xl bg-[#2E3038] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#23252c]"
              >
                Добавить товар
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed footer with launch button */}
      {products.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 p-4">
          <div className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-end gap-3">
            {profileId === '2' && (
              <label className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600 whitespace-nowrap">Реферальный код</span>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  className="w-[7.5rem] rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-violet-300 focus:outline-none focus:ring-1 focus:ring-violet-100 sm:w-32"
                  aria-label="Реферальный код"
                />
              </label>
            )}
            <button
              disabled={paymentModel === 'CPC' && isDailyLimitEnabled && parseDisplayValue(dailyLimitValue) > parseDisplayValue(budget)}
              className={`px-6 py-3 text-base font-bold rounded-lg transition-colors ${
                paymentModel === 'CPC' && isDailyLimitEnabled && parseDisplayValue(dailyLimitValue) > parseDisplayValue(budget)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
              onClick={() => {
                // Проверяем условия: нет ошибок в бюджете
                const hasBudgetError = paymentModel === 'CPC' && isDailyLimitEnabled && parseDisplayValue(dailyLimitValue) > parseDisplayValue(budget);
                
                if (!hasBudgetError) {
                  if (profileId === '2' && referralCode.trim()) {
                    notifyReferralCampaignCreatedFromCreation();
                  }
                  onNavigateToMassCreation(products);
                }
              }}
            >
              Запустить кампанию
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
