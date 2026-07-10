import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Checkbox } from 'antd';
import { Wallet, HelpCircle, X, Plus, Bell, MoreVertical, Check, Edit2, Info } from './Icons';
import { SingleCampaignAddProductsModal } from './SingleCampaignAddProductsModal';
import { AppHeader } from './AppHeader';
import { ReferralInviteCreationBanner } from './ReferralInviteCreationBanner';
import { DailyLimitInfoTooltip } from './DailyLimitInfoTooltip';
import { DailyLimitBidMismatchHint } from './DailyLimitBidMismatchHint';
import {
  DAILY_LIMIT_ABSOLUTE_MIN,
  minDailyLimitForMaxBid,
  isDailyLimitBelowRecommendedForMaxBid,
} from '../utils/cpcDailyLimitBid';
import { normalizeCpmBidRub } from '../utils/cpmBidRounding';
import { useCpmBidRoundedAlert } from './CpmBidRoundedAlert';
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

const CPC_PAYMENT_BENEFITS = [
  'Аукцион второй цены',
  'дневные лимиты',
  'отсутствие шага ставки',
] as const;

function SecondPriceAuctionBenefitLabel() {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <span className="cursor-help underline decoration-dotted decoration-[#AEAEB8] underline-offset-2 hover:text-[#6B6B76]">
        Аукцион второй цены
      </span>
      {isVisible ? (
        <>
          <span
            className="absolute left-0 top-full z-50 h-2 w-[min(18rem,calc(100vw-3rem))]"
            aria-hidden
          />
          <div
            className="absolute left-0 top-full z-[60] mt-2 w-[min(18rem,calc(100vw-3rem))] rounded-lg bg-gray-900 p-3 text-left text-xs leading-snug text-white shadow-lg"
            role="tooltip"
          >
            <p className="mb-2">
              Выигрывает самая высокая ставка, а цену клика определяем по следующей за ней.
            </p>
            <button
              type="button"
              className="p-0 text-left text-xs font-medium text-[#A5B4FC] hover:underline"
            >
              Подробнее
            </button>
          </div>
        </>
      ) : null}
    </span>
  );
}

function SingleCampaignPaymentModelIcon({ model }: { model: 'CPC' | 'CPM' }) {
  const isCpc = model === 'CPC';
  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F0F0F3]"
      aria-hidden
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={isCpc ? 'text-[#9A41FE]' : 'text-[#8B8B97]'}
        aria-hidden
      >
        <path
          d="M5.05 4.05 19.95 10.55a.55.55 0 0 1-.07 1.04l-6.74 1.74a2.2 2.2 0 0 0-1.58 1.58l-1.74 6.74a.55.55 0 0 1-1.04.07L5.05 4.05Z"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

const PAYMENT_MODEL_OPTIONS = [
  { id: 'CPC' as const, label: 'Оплата за клики CPC' },
  { id: 'CPM' as const, label: 'Оплата за показы CPM' },
];

function SingleCampaignPaymentModelDropdown({
  value,
  onChange,
}: {
  value: 'CPC' | 'CPM';
  onChange: (model: 'CPC' | 'CPM') => void;
}) {
  const [isChangeMenuOpen, setIsChangeMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isCpc = value === 'CPC';
  const title = PAYMENT_MODEL_OPTIONS.find((o) => o.id === value)?.label ?? 'Оплата за клики CPC';
  const switchToLabel = isCpc
    ? 'Переключиться на оплату за показы CPM'
    : 'Переключиться на оплату за клики CPC';

  useEffect(() => {
    if (!isChangeMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsChangeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isChangeMenuOpen]);

  return (
    <div ref={ref} className="relative inline-block max-w-full">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-base font-bold leading-snug text-gray-900">{title}</span>
        <button
          type="button"
          onClick={() => setIsChangeMenuOpen((open) => !open)}
          className="rounded-md px-2 py-0.5 text-[13px] font-normal text-[#6366f1] transition-colors hover:bg-indigo-50 hover:text-purple-700"
          aria-expanded={isChangeMenuOpen}
        >
          Изменить
        </button>
      </div>
      {isChangeMenuOpen ? (
        <div className="absolute left-0 top-full z-50 mt-2 min-w-[min(20rem,calc(100vw-3rem))] rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
          <button
            type="button"
            className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50"
            onClick={() => {
              onChange(isCpc ? 'CPM' : 'CPC');
              setIsChangeMenuOpen(false);
            }}
          >
            {switchToLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}

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
  const [paymentModel, setPaymentModel] = useState<'CPM' | 'CPC'>('CPC');
  const [budget, setBudget] = useState('3000');

  useEffect(() => {
    if (profileId === '2' && showReferralInviteCreationBanner) {
      setBudget('2000');
    }
  }, [profileId, showReferralInviteCreationBanner]);
  const [isAutoRefillEnabled, setIsAutoRefillEnabled] = useState(false);
  const [bidType, setBidType] = useState<'unified' | 'manual'>('unified');
  const [displayZones, setDisplayZones] = useState({ search: true, recommendations: true });
  const [unifiedBid, setUnifiedBid] = useState('500');
  const [manualBid, setManualBid] = useState('500');
  const [isDailyLimitEnabled, setIsDailyLimitEnabled] = useState(false);
  const [dailyLimitValue, setDailyLimitValue] = useState('');
  const [isCarryoverEnabled, setIsCarryoverEnabled] = useState(false);
  const [isBudgetMinTooltipVisible, setIsBudgetMinTooltipVisible] = useState(false);
  const [isAutoRefillTooltipVisible, setIsAutoRefillTooltipVisible] = useState(false);
  const [isCarryoverTooltipVisible, setIsCarryoverTooltipVisible] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const { showCpmBidRoundedAlert, cpmBidRoundedAlertNode } = useCpmBidRoundedAlert();
  const [isMultiCategoryWarningOpen, setIsMultiCategoryWarningOpen] = useState(false);
  const [products, setProducts] = useState<CampaignProductRow[]>([]);
  const [productBidsByNmId, setProductBidsByNmId] = useState<Record<number, string>>({});
  const [productBidDraftByNmId, setProductBidDraftByNmId] = useState<Record<number, string>>({});
  const [isAddProductsModalOpen, setIsAddProductsModalOpen] = useState(false);
  const [actionsMenuNmId, setActionsMenuNmId] = useState<number | null>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const [referralCode, setReferralCode] = useState('');

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
    const seeded =
      singleCampaignSeed.products && singleCampaignSeed.products.length > 0
        ? singleCampaignSeed.products
        : [singleCampaignSeed.product];
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

  const getProductBidDisplay = (nmId: number) =>
    productBidDraftByNmId[nmId] ?? getProductBid(nmId);

  const maxProductBidRub = useMemo(() => {
    const values = products.map((p) => parseDisplayValue(getProductBid(p.nmId))).filter((n) => n > 0);
    return values.length ? Math.max(...values) : 0;
  }, [products, productBidsByNmId, bidFallback]);

  const savedDailyLimitRub = useMemo(() => {
    if (!isDailyLimitEnabled) return 0;
    const parsed = parseDisplayValue(dailyLimitValue);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [isDailyLimitEnabled, dailyLimitValue]);

  const recommendedDailyLimitForBids = useMemo(
    () => minDailyLimitForMaxBid(maxProductBidRub),
    [maxProductBidRub],
  );

  const showDailyLimitBidMismatchHint =
    isDailyLimitEnabled &&
    savedDailyLimitRub > 0 &&
    maxProductBidRub > 0 &&
    isDailyLimitBelowRecommendedForMaxBid(savedDailyLimitRub, maxProductBidRub);

  const commitProductBidCpc = useCallback((nmId: number, parsed: number) => {
    setProductBidsByNmId((prev) => ({ ...prev, [nmId]: String(parsed) }));
    setProductBidDraftByNmId((prev) => {
      const next = { ...prev };
      delete next[nmId];
      return next;
    });
    setToastMessage('Ставка изменена');
    setShowToast(true);
  }, []);

  const handleProductBidChange = (nmId: number, value: string) => {
    const parsed = parseDisplayValue(value);
    if (!isNaN(parsed)) {
      if (paymentModel === 'CPC') {
        setProductBidDraftByNmId((prev) => ({ ...prev, [nmId]: String(parsed) }));
      } else {
        setProductBidsByNmId((prev) => ({ ...prev, [nmId]: String(parsed) }));
      }
    } else if (value === '') {
      if (paymentModel === 'CPC') {
        setProductBidDraftByNmId((prev) => ({ ...prev, [nmId]: '' }));
      } else {
        setProductBidsByNmId((prev) => ({ ...prev, [nmId]: '' }));
      }
    }
  };

  const handleProductBidBlur = (nmId: number) => {
    if (paymentModel === 'CPM') {
      const raw = getProductBidDisplay(nmId);
      const parsed = parseDisplayValue(raw);
      if (raw === '' || isNaN(parsed) || parsed <= 0) return;
      const { value: stepped, didRoundFromInput } = normalizeCpmBidRub(parsed, 150);
      setProductBidsByNmId((prev) => ({ ...prev, [nmId]: String(stepped) }));
      setProductBidDraftByNmId((prev) => {
        const next = { ...prev };
        delete next[nmId];
        return next;
      });
      if (didRoundFromInput) showCpmBidRoundedAlert(stepped);
      return;
    }
    const raw = getProductBidDisplay(nmId);
    const parsed = parseDisplayValue(raw);
    const saved = parseDisplayValue(getProductBid(nmId));
    if (raw === '' || isNaN(parsed) || parsed <= 0) {
      setProductBidDraftByNmId((prev) => {
        const next = { ...prev };
        delete next[nmId];
        return next;
      });
      return;
    }
    if (parsed === saved) {
      setProductBidDraftByNmId((prev) => {
        const next = { ...prev };
        delete next[nmId];
        return next;
      });
      return;
    }
    commitProductBidCpc(nmId, parsed);
  };

  const bidColumnTitle =
    paymentModel === 'CPC' ? 'Ставка (CPC)' : 'Ставка (CPM)';

  const hasCampaignProduct = products.length > 0;

  const alreadyAddedNmIds = useMemo(
    () => (hasCampaignProduct ? new Set<number>() : new Set(products.map((p) => p.nmId))),
    [products, hasCampaignProduct],
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

  const renderProductBidCell = (nmId: number) => {
    const raw = getProductBidDisplay(nmId);
    return (
      <div className="flex items-center justify-end gap-1">
        <div className="inline-flex h-9 min-w-[5.5rem] items-center rounded-lg border border-gray-200 bg-white px-2.5 text-sm text-gray-900">
          <input
            type="text"
            value={formatForDisplay(raw)}
            onChange={(e) => handleProductBidChange(nmId, e.target.value)}
            onBlur={() => handleProductBidBlur(nmId)}
            className="w-full min-w-0 border-0 bg-transparent p-0 text-sm outline-none focus:ring-0"
          />
          <span className="shrink-0 text-gray-500">₽</span>
        </div>
        <BidHistogramButton />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F7F7FA] font-sans text-gray-900" style={{ background: '#F7F7FA' }}>
      <AppHeader onNavigate={onBack} />
      
      <main className={`flex flex-col items-center px-6 py-8 gap-6 ${products.length > 0 ? 'pb-24' : ''}`}>
        {profileId === '2' && showReferralInviteCreationBanner && (
          <div className="w-full max-w-[1200px]">
            <ReferralInviteCreationBanner />
          </div>
        )}
        {/* Управление кампанией — макет карточки */}
        <div className="mx-auto w-full max-w-[1200px] overflow-visible rounded-2xl border border-[#EBEBEF] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between gap-4 px-5 pb-4 pt-5">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="min-w-0 flex-1 border-none bg-transparent p-0 text-left text-[22px] font-bold leading-7 tracking-[-0.02em] text-gray-900 outline-none focus:outline-none"
              />
              <Edit2 className="h-[18px] w-[18px] shrink-0 text-[#AEAEB8]" aria-hidden />
            </div>
            <button
              type="button"
              className="flex shrink-0 items-center gap-1.5 text-sm font-normal text-[#6C5CE7] hover:text-[#5B4BFF]"
            >
              <Info className="h-4 w-4" aria-hidden />
              Инструкция
            </button>
          </div>

          <div className="border-t border-[#EBEBEF]" />

          <div className="flex items-start gap-4 px-5 py-4">
            <SingleCampaignPaymentModelIcon model={paymentModel} />
            <div className="min-w-0 flex-1 pt-0.5">
              <SingleCampaignPaymentModelDropdown
                value={paymentModel}
                onChange={setPaymentModel}
              />

              {paymentModel === 'CPC' ? (
                <p className="mb-0 flex items-center gap-1.5 text-sm text-[#8E8E93]">
                  <Check className="h-4 w-4 shrink-0 text-[#34C759]" aria-hidden />
                  <span>
                    <SecondPriceAuctionBenefitLabel />
                    {CPC_PAYMENT_BENEFITS.slice(1).map((text) => (
                      <span key={text}>, {text}</span>
                    ))}
                  </span>
                </p>
              ) : (
                <p className="mb-0 mt-0 text-sm text-[#8E8E93]">Минимальный шаг ставки 100 ₽</p>
              )}
            </div>
          </div>
        </div>

        {/* Бюджет и дневной лимит (CPC — две карточки как в макете) */}
        <div className="mx-auto w-full max-w-[1200px]">
          {paymentModel === 'CPC' &&
            isDailyLimitEnabled &&
            parseDisplayValue(dailyLimitValue) > parseDisplayValue(budget) && (
              <div className="mb-4 rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-gray-900">
                  Чтобы задать дневной лимит {formatForDisplay(dailyLimitValue)} ₽, пополните бюджет
                  еще на{' '}
                  {formatForDisplay(parseDisplayValue(dailyLimitValue) - parseDisplayValue(budget))} ₽
                </p>
              </div>
            )}

          {paymentModel === 'CPC' ? (
            <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
              <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="mb-3 text-sm font-semibold text-gray-900">Бюджет кампании</p>
                <div className="flex flex-1 flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="relative w-full min-w-[120px] max-w-[200px] flex-1">
                      <input
                        type="text"
                        value={formatForDisplay(budget)}
                        onChange={handleBudgetChange}
                        onBlur={handleBudgetBlur}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                    <div className="flex min-w-[220px] flex-1 items-center gap-2">
                      <ToggleSwitch
                        checked={isAutoRefillEnabled}
                        onChange={setIsAutoRefillEnabled}
                      />
                      <span className="text-sm font-medium text-[#6366f1]">Автопополнение бюджета</span>
                      <div
                        className="relative inline-block"
                        onMouseEnter={() => setIsAutoRefillTooltipVisible(true)}
                        onMouseLeave={() => setIsAutoRefillTooltipVisible(false)}
                      >
                        <HelpCircle className="h-4 w-4 cursor-help text-gray-400" />
                        {isAutoRefillTooltipVisible && (
                          <div className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-lg bg-gray-900 p-3 text-left text-xs text-white shadow-lg">
                            Пополняем бюджет автоматически по заданным условиям, не чаще одного раза в
                            день.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="flex items-center gap-1.5 text-xs text-gray-500">
                    Минимальный бюджет — 1 000 ₽
                    <span
                      className="relative inline-block"
                      onMouseEnter={() => setIsBudgetMinTooltipVisible(true)}
                      onMouseLeave={() => setIsBudgetMinTooltipVisible(false)}
                    >
                      <HelpCircle className="h-3.5 w-3.5 cursor-help text-gray-400" />
                      {isBudgetMinTooltipVisible && (
                        <div className="absolute left-1/2 top-full z-50 mt-2 w-56 -translate-x-1/2 rounded-lg bg-gray-900 p-3 text-left text-xs text-white shadow-lg">
                          Кампания не запустится, если бюджет ниже 1 000 ₽.
                        </div>
                      )}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <ToggleSwitch
                    checked={isDailyLimitEnabled}
                    onChange={(checked) => {
                      setIsDailyLimitEnabled(checked);
                      if (checked) {
                        setIsCarryoverEnabled(true);
                        if (!dailyLimitValue) setDailyLimitValue(String(DAILY_LIMIT_ABSOLUTE_MIN));
                      } else {
                        setIsCarryoverEnabled(false);
                      }
                    }}
                  />
                  <span className="text-sm font-semibold text-gray-900">Дневной лимит</span>
                  <DailyLimitInfoTooltip />
                </div>
                <div className="relative mb-3 flex w-full max-w-[260px] items-start gap-1.5">
                  <div className="relative min-w-0 flex-1">
                  <input
                    type="text"
                    value={dailyLimitValue ? formatForDisplay(dailyLimitValue) : ''}
                    disabled={!isDailyLimitEnabled}
                    onChange={(e) => {
                      const parsed = parseDisplayValue(e.target.value);
                      if (!isNaN(parsed)) {
                        setDailyLimitValue(String(parsed));
                      } else if (e.target.value === '') {
                        setDailyLimitValue('');
                      }
                    }}
                    onBlur={() => {
                      if (!isDailyLimitEnabled) return;
                      const parsed = parseDisplayValue(dailyLimitValue);
                      if (dailyLimitValue === '' || isNaN(parsed) || parsed < 1000) {
                        setDailyLimitValue('1000');
                      }
                    }}
                    className={`w-full rounded-lg border py-2.5 pl-3 pr-8 text-sm font-medium shadow-sm outline-none transition-colors ${
                      !isDailyLimitEnabled
                        ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
                        : 'border-gray-200 bg-white text-gray-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                    }`}
                    placeholder="Задайте от 1000"
                  />
                  <span
                    className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm ${
                      !isDailyLimitEnabled ? 'text-gray-300' : 'text-gray-400'
                    }`}
                  >
                    ₽
                  </span>
                  </div>
                  {showDailyLimitBidMismatchHint ? (
                    <DailyLimitBidMismatchHint
                      recommendedDailyLimitRub={recommendedDailyLimitForBids}
                      className="mt-2.5"
                    />
                  ) : null}
                </div>
                <label className="m-0 flex cursor-pointer items-center gap-2">
                  <Checkbox
                    disabled={!isDailyLimitEnabled}
                    checked={isCarryoverEnabled}
                    onChange={(e) => {
                      if (!isDailyLimitEnabled) return;
                      setIsCarryoverEnabled(e.target.checked);
                    }}
                  />
                  <span
                    className={`text-xs ${isDailyLimitEnabled ? 'text-gray-700' : 'text-gray-400'}`}
                  >
                    Переносить неистраченные деньги
                  </span>
                  <div
                    className="relative inline-block"
                    onMouseEnter={() => setIsCarryoverTooltipVisible(true)}
                    onMouseLeave={() => setIsCarryoverTooltipVisible(false)}
                  >
                    <HelpCircle className="h-4 w-4 cursor-help text-gray-400" />
                    {isCarryoverTooltipVisible && (
                      <div className="absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2 rounded-lg bg-gray-900 p-3 text-left text-xs text-white shadow-lg">
                        <p className="mb-1">Система старается тратить бюджет равномерно.</p>
                        <p>
                          Если сегодня потратится меньше дневного лимита, остаток будет добавлен к
                          лимиту следующего дня.
                        </p>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="mb-3 text-sm font-semibold text-gray-900">Бюджет кампании</p>
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="relative w-full min-w-[120px] max-w-[200px]">
                    <input
                      type="text"
                      value={formatForDisplay(budget)}
                      onChange={handleBudgetChange}
                      onBlur={handleBudgetBlur}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex min-w-[220px] flex-1 items-center gap-2">
                    <ToggleSwitch checked={isAutoRefillEnabled} onChange={setIsAutoRefillEnabled} />
                    <span className="text-sm font-medium text-[#6366f1]">Автопополнение бюджета</span>
                    <div
                      className="relative inline-block"
                      onMouseEnter={() => setIsAutoRefillTooltipVisible(true)}
                      onMouseLeave={() => setIsAutoRefillTooltipVisible(false)}
                    >
                      <HelpCircle className="h-4 w-4 cursor-help text-gray-400" />
                      {isAutoRefillTooltipVisible && (
                        <div className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-lg bg-gray-900 p-3 text-left text-xs text-white shadow-lg">
                          Пополняем бюджет автоматически по заданным условиям, не чаще одного раза в
                          день.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <p className="flex items-center gap-1.5 text-xs text-gray-500">
                  Минимальный бюджет — 1 000 ₽
                  <span
                    className="relative inline-block"
                    onMouseEnter={() => setIsBudgetMinTooltipVisible(true)}
                    onMouseLeave={() => setIsBudgetMinTooltipVisible(false)}
                  >
                    <HelpCircle className="h-3.5 w-3.5 cursor-help text-gray-400" />
                    {isBudgetMinTooltipVisible && (
                      <div className="absolute left-1/2 top-full z-50 mt-2 w-56 -translate-x-1/2 rounded-lg bg-gray-900 p-3 text-left text-xs text-white shadow-lg">
                        Кампания не запустится, если бюджет ниже 1 000 ₽.
                      </div>
                    )}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Зоны показов */}
        {paymentModel === 'CPC' ? (
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 w-full max-w-[1200px] mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Зоны показов</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 min-h-[4.5rem]">
                <div className="flex items-center gap-2 min-w-0">
                  <ToggleSwitch
                    checked={displayZones.search}
                    onChange={(checked) => {
                      setDisplayZones((prev) => {
                        const next = { ...prev, search: checked };
                        if (!next.search && !next.recommendations) return { ...prev, search: true };
                        return next;
                      });
                    }}
                  />
                  <span className="text-sm font-medium text-gray-900">Поиск</span>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 min-h-[4.5rem]">
                <div className="flex items-center gap-2 min-w-0">
                  <ToggleSwitch
                    checked={displayZones.recommendations}
                    onChange={(checked) => {
                      setDisplayZones((prev) => {
                        const next = { ...prev, recommendations: checked };
                        if (!next.search && !next.recommendations) return { ...prev, recommendations: true };
                        return next;
                      });
                    }}
                  />
                  <span className="text-sm font-medium text-gray-900">Рекомендации</span>
                </div>
              </div>
            </div>
          </section>
        ) : (
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
        )}

        {/* Товары */}
        <div className="bg-white rounded-2xl px-5 py-0 shadow-sm border border-gray-100 w-full max-w-[1200px] mx-auto">
          {products.length === 0 ? (
            <div className="py-4">
              <button
                type="button"
                onClick={() => setIsAddProductsModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2E3038] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#23252c]"
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden />
                Добавить товары
              </button>
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
                    {!hasCampaignProduct ? (
                      <Plus className="h-4 w-4 shrink-0" aria-hidden />
                    ) : null}
                    {hasCampaignProduct ? 'Заменить товар' : 'Добавить товары'}
                  </button>
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

      </main>

      {/* Toast */}
      <Toast show={showToast} message={toastMessage} onClose={() => setShowToast(false)} />
      {cpmBidRoundedAlertNode}

      {/* Modal for adding products */}
      <SingleCampaignAddProductsModal
        isOpen={isAddProductsModalOpen}
        onClose={() => setIsAddProductsModalOpen(false)}
        options={MOCK_PRODUCTS}
        alreadyAddedNmIds={alreadyAddedNmIds}
        isCpcMode={paymentModel === 'CPC'}
        maxSelect={1}
        title={hasCampaignProduct ? 'Заменить товар' : 'Добавление товаров'}
        confirmLabel={hasCampaignProduct ? 'Заменить' : 'Добавить'}
        onConfirm={(added) => {
          if (hasCampaignProduct) {
            const next = added.slice(0, 1);
            if (next.length === 0) return false;
            replaceProducts(next);
            setToastMessage('Товар заменён');
            setShowToast(true);
            return true;
          }
          if (!isSingleCategoryAdditionAllowed(products, added)) {
            setIsMultiCategoryWarningOpen(true);
            return false;
          }
          const merged = [...products];
          for (const p of added) {
            if (!merged.some((m) => m.nmId === p.nmId)) merged.push(p);
          }
          replaceProducts(merged.slice(0, 1));
          const n = Math.min(added.length, 1);
          setToastMessage(n === 1 ? 'Товар добавлен' : `Добавлено ${n} товаров`);
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
