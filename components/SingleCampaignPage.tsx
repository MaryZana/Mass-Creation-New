import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Wallet, HelpCircle, X, Plus, Bell, MoreVertical, Edit2, Info, ChevronDown } from './Icons';
import { SingleCampaignAddProductsModal } from './SingleCampaignAddProductsModal';
import { AppHeader } from './AppHeader';
import { ReferralInviteCreationBanner } from './ReferralInviteCreationBanner';
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
import { RankingFactorsSidePanel } from './RankingFactorsSidePanel';
import {
  AdvancedDailyLimitModal,
  AutoRefillModal,
  createDefaultAdvancedDailyLimitSettings,
  type AdvancedDailyLimitSettings,
  type AutoRefillMode,
} from './CpcCampaignPage';

export const BONUS_PACKAGES = [
  {
    id: 'p1',
    amount: 115365,
    maxPercent: 10,
    expiry: '3 января',
    label: 'Пакет 1',
  },
  { id: 'p2', amount: 12233, maxPercent: 99, expiry: '12 февраля', label: 'Пакет 2' },
  { id: 'p3', amount: 20, maxPercent: 100, expiry: '28 февраля', label: 'Пакет 3' },
] as const;

type BonusPlacement = 'footer' | 'budget' | 'wallet' | 'select' | 'cards';

const BONUS_PLACEMENT_TABS: { id: BonusPlacement; label: string }[] = [
  { id: 'wallet', label: 'Как в медийке' },
  { id: 'cards', label: 'Квадраты' },
  { id: 'budget', label: 'Бонусы в бюджете' },
  { id: 'footer', label: 'Бонусы внизу' },
];

/** Сколько можно списать из пакета: не больше остатка пакета и не больше maxPercent% от бюджета кампании */
function maxSpendableBonusFromPackage(
  pkg: { amount: number; maxPercent: number },
  budgetRub: number,
): number {
  if (!Number.isFinite(budgetRub) || budgetRub <= 0) return 0;
  const byPercent = Math.floor((budgetRub * pkg.maxPercent) / 100);
  return Math.max(0, Math.min(pkg.amount, byPercent, budgetRub));
}

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
  /** Урезанный доступ «Исследования» */
  researchAccess?: 'bonuses' | null;
}

// Шапка приложения вынесена в общий компонент `AppHeader`.

const Toast = ({
  show,
  message,
  onClose,
  isError = false,
}: {
  show: boolean;
  message: string;
  onClose: () => void;
  isError?: boolean;
}) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, isError ? 4000 : 3000);
      return () => clearTimeout(timer);
    }
  }, [show, message, isError, onClose]);

  if (!show) return null;

  return (
    <div
      className={`fixed top-20 left-1/2 z-[100] flex max-w-[90vw] -translate-x-1/2 items-center gap-3 rounded-lg px-6 py-3 text-white shadow-xl animate-in fade-in slide-in-from-top-4 duration-300 ${
        isError ? 'bg-red-600' : 'bg-gray-900'
      }`}
    >
      <span className="font-medium">{message}</span>
    </div>
  );
};

function BonusAmountField({
  amountDisplay,
  onAmountChange,
  onAmountBlur,
}: {
  amountDisplay: string;
  onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAmountBlur: () => void;
}) {
  return (
    <div className="relative mt-2 w-[5.75rem]">
      <input
        type="text"
        inputMode="numeric"
        value={amountDisplay}
        onChange={onAmountChange}
        onBlur={onAmountBlur}
        onClick={(e) => e.stopPropagation()}
        className="h-7 w-full rounded-lg border border-gray-200 bg-white py-0 pl-2 pr-6 text-left text-sm font-bold tabular-nums text-gray-900 outline-none transition-colors hover:border-gray-300 focus:border-[#9A41FE] focus:ring-1 focus:ring-[#9A41FE]"
        aria-label="Сумма бонусов"
      />
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-400">
        B
      </span>
    </div>
  );
}

function BonusPackagesMenu({
  selectedPkgId,
  amountDisplay,
  onSelectPackage,
  onAmountChange,
  onAmountBlur,
  formatAmount,
}: {
  selectedPkgId: string;
  amountDisplay: string;
  onSelectPackage: (pkgId: string) => void;
  onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAmountBlur: () => void;
  formatAmount: (num: string | number) => string;
}) {
  return (
    <>
      <p className="text-xs text-gray-500">1 B = 1 ₽</p>
      <div className="mt-3 flex flex-col gap-2">
        {BONUS_PACKAGES.map((pkg) => {
          const selected = pkg.id === selectedPkgId;
          const content = (
            <>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] leading-none text-gray-500">
                  На пакете до {pkg.expiry}
                </span>
                <span className="mt-1 block text-sm font-bold tabular-nums text-gray-900">
                  {formatAmount(pkg.amount)} B
                </span>
                {selected ? (
                  <>
                    <span className="mt-2 block text-[11px] leading-none text-gray-500">
                      Списать до {pkg.maxPercent}% от пополнения 1 кампании
                    </span>
                    <BonusAmountField
                      amountDisplay={amountDisplay}
                      onAmountChange={onAmountChange}
                      onAmountBlur={onAmountBlur}
                    />
                  </>
                ) : null}
              </span>
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                  selected ? 'border-[#9A41FE]' : 'border-gray-300'
                }`}
                aria-hidden
              >
                {selected ? <span className="h-2 w-2 rounded-full bg-[#9A41FE]" /> : null}
              </span>
            </>
          );

          const itemClass = `flex w-full items-start justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
            selected
              ? 'border-[#9A41FE] bg-[#F6F0FF]'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`;

          if (selected) {
            return (
              <div key={pkg.id} className={itemClass} aria-current="true">
                {content}
              </div>
            );
          }

          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => onSelectPackage(pkg.id)}
              className={itemClass}
              aria-pressed={false}
            >
              {content}
            </button>
          );
        })}
      </div>
    </>
  );
}

function BonusPackagePicker({
  selectedPkgId,
  amountDisplay,
  maxAmountDisplay,
  bonusError,
  onSelectPackage,
  onAmountChange,
  onAmountBlur,
  formatAmount,
}: {
  selectedPkgId: string;
  amountDisplay: string;
  maxAmountDisplay: string;
  bonusError: string;
  onSelectPackage: (pkgId: string) => void;
  onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAmountBlur: () => void;
  formatAmount: (num: string | number) => string;
}) {
  return (
    <div className="duration-300 animate-in fade-in slide-in-from-top-2">
      <div className="custom-scrollbar flex snap-x gap-4 overflow-x-auto pb-0">
        {BONUS_PACKAGES.map((pkg) => {
          const selected = pkg.id === selectedPkgId;
          return (
            <div
              key={pkg.id}
              onClick={() => onSelectPackage(pkg.id)}
              className={`relative min-w-[200px] cursor-pointer snap-start rounded-xl border-2 px-4 pt-4 pb-4 transition-all ${
                selected
                  ? 'border-transparent bg-gray-100'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="mb-1 text-[11px] font-medium leading-none text-gray-500">
                    На пакете до {pkg.expiry}
                  </p>
                  <span className="block text-xl font-bold text-gray-900">
                    {formatAmount(pkg.amount)}
                  </span>
                </div>
                <div
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    selected ? 'border-[#9A41FE]' : 'border-gray-300'
                  }`}
                >
                  {selected ? <div className="h-2.5 w-2.5 rounded-full bg-[#9A41FE]" /> : null}
                </div>
              </div>
              <p className="mb-0 text-xs font-medium leading-tight text-gray-500">
                Оплата до {pkg.maxPercent}% от суммы
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-center">
        <div className="relative w-full md:w-48">
          <input
            type="text"
            inputMode="numeric"
            value={amountDisplay}
            onChange={onAmountChange}
            onBlur={onAmountBlur}
            className={`w-full rounded-xl border px-4 py-3 text-lg font-bold outline-none focus:ring-2 focus:ring-purple-500 ${
              bonusError ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-label="Сумма бонусов"
          />
          <p className="mt-1.5 text-xs text-gray-500">до {maxAmountDisplay} B (1B = 1P)</p>
        </div>
        {bonusError ? (
          <div className="text-sm leading-snug text-red-500">
            <p>{bonusError}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Вариант 2: выбранный пакет всегда виден как селект, список — в дропдауне */
function BonusPackageRichSelect({
  selectedPkgId,
  amountDisplay,
  maxAmountDisplay,
  bonusError,
  onSelectPackage,
  onAmountChange,
  onAmountBlur,
  formatAmount,
  menuOpen,
  onMenuOpenChange,
}: {
  selectedPkgId: string;
  amountDisplay: string;
  maxAmountDisplay: string;
  bonusError: string;
  onSelectPackage: (pkgId: string) => void;
  onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAmountBlur: () => void;
  formatAmount: (num: string | number) => string;
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
}) {
  const selectedPkg =
    BONUS_PACKAGES.find((pkg) => pkg.id === selectedPkgId) ?? BONUS_PACKAGES[0];

  return (
    <div className="duration-300 animate-in fade-in slide-in-from-top-2" data-bonus-menu-root>
      <div className="relative max-w-md">
        <div className="rounded-2xl bg-[#F2F2F7] px-4 py-3.5">
          <button
            type="button"
            onClick={() => onMenuOpenChange(!menuOpen)}
            className="flex w-full items-start gap-3 text-left"
            aria-expanded={menuOpen}
            aria-haspopup="listbox"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-xl font-bold leading-none tabular-nums text-gray-900">
                {formatAmount(selectedPkg.amount)} B
              </span>
              <span className="mt-1.5 block text-xs leading-snug text-gray-500">
                до {selectedPkg.expiry} · оплата до {selectedPkg.maxPercent}%
              </span>
            </span>
            <ChevronDown
              className={`mt-0.5 h-5 w-5 shrink-0 text-gray-500 transition-transform ${
                menuOpen ? 'rotate-180' : ''
              }`}
              aria-hidden
            />
          </button>

          <div className="mt-3 border-t border-black/[0.06] pt-3">
            <p className="mb-1.5 text-[11px] leading-none text-gray-500">
              Списать до {selectedPkg.maxPercent}% от пополнения 1 кампании
            </p>
            <BonusAmountField
              amountDisplay={amountDisplay}
              onAmountChange={onAmountChange}
              onAmountBlur={onAmountBlur}
            />
            <p className="mt-1.5 text-[11px] text-gray-500">
              до {maxAmountDisplay} B (1B = 1₽)
            </p>
            {bonusError ? (
              <p className="mt-1.5 text-sm leading-snug text-red-500">{bonusError}</p>
            ) : null}
          </div>
        </div>

        {menuOpen ? (
          <div
            className="absolute left-0 right-0 top-full z-20 mt-2 rounded-2xl border border-gray-100 bg-white p-2 shadow-lg"
            role="listbox"
            aria-label="Пакеты промобонусов"
          >
            {BONUS_PACKAGES.map((pkg) => {
              const selected = pkg.id === selectedPkgId;
              return (
                <button
                  key={pkg.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onSelectPackage(pkg.id);
                    onMenuOpenChange(false);
                  }}
                  className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    selected ? 'bg-[#F2F2F7]' : 'hover:bg-gray-50'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                      selected ? 'border-[#9A41FE]' : 'border-gray-300'
                    }`}
                    aria-hidden
                  >
                    {selected ? <span className="h-2 w-2 rounded-full bg-[#9A41FE]" /> : null}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold tabular-nums text-gray-900">
                      {formatAmount(pkg.amount)} B
                    </span>
                    <span className="mt-1 block text-[11px] leading-snug text-gray-500">
                      до {pkg.expiry} · оплата до {pkg.maxPercent}%
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const ToggleSwitch = ({
  checked,
  onChange,
  disabled = false,
  size = 'sm',
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}) => {
  const isMd = size === 'md';
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        isMd ? 'h-5 w-9' : 'h-4 w-7'
      } ${disabled ? 'cursor-not-allowed bg-gray-200' : 'cursor-pointer'} ${
        checked ? (disabled ? 'bg-purple-300' : 'bg-purple-600') : isMd ? 'bg-[#E5E5EA]' : 'bg-gray-300'
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          isMd ? 'h-4 w-4' : 'h-3 w-3'
        } ${checked ? (isMd ? 'translate-x-4' : 'translate-x-3') : 'translate-x-0'}`}
      />
    </button>
  );
};

const PAYMENT_MODEL_OPTIONS = [
  {
    id: 'CPC' as const,
    label: 'Оплата за клики (CPC)',
    subtitle: 'Вы платите за 1 клик',
  },
  {
    id: 'CPM' as const,
    label: 'Оплата за показы (CPM)',
    subtitle: 'Вы платите за 1000 показов',
  },
] as const;

function SecondPriceAuctionBadge() {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span
      className="absolute -top-2.5 left-3 z-10 inline-flex items-center gap-1 rounded-md bg-[#F3E8FF] px-2 py-0.5 text-[11px] font-medium text-[#7C3AED]"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      Аукцион второй цены
      <span className="relative inline-flex">
        <HelpCircle className="h-3 w-3 cursor-help text-[#9A41FE]" aria-hidden />
        {isVisible ? (
          <>
            <span
              className="absolute left-0 top-full z-50 h-2 w-[min(18rem,calc(100vw-3rem))]"
              aria-hidden
            />
            <div
              className="absolute left-0 top-full z-[60] mt-2 w-[min(18rem,calc(100vw-3rem))] rounded-lg bg-gray-900 p-3 text-left text-xs font-normal leading-snug text-white shadow-lg"
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
    </span>
  );
}

function SingleCampaignPaymentModelSelector({
  value,
  onChange,
}: {
  value: 'CPC' | 'CPM';
  onChange: (model: 'CPC' | 'CPM') => void;
}) {
  return (
    <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Модель оплаты">
      {PAYMENT_MODEL_OPTIONS.map((option) => {
        const selected = value === option.id;
        return (
          <div key={option.id} className="relative w-fit pt-1">
            {option.id === 'CPC' ? <SecondPriceAuctionBadge /> : null}
            <button
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.id)}
              className={`flex w-fit items-start gap-3 rounded-2xl px-4 py-3.5 text-left transition-colors ${
                selected
                  ? 'bg-[#F2F2F7] ring-0'
                  : 'border border-[#E5E5EA] bg-white hover:bg-gray-50'
              }`}
            >
              <span
                className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 ${
                  selected ? 'border-[#9A41FE]' : 'border-[#C7C7CC]'
                }`}
                aria-hidden
              >
                {selected ? <span className="h-2.5 w-2.5 rounded-full bg-[#9A41FE]" /> : null}
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold leading-snug text-gray-900">
                  {option.label}
                </span>
                <span className="mt-0.5 block text-sm leading-snug text-[#8E8E93]">
                  {option.subtitle}
                </span>
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

export const SingleCampaignPage: React.FC<SingleCampaignPageProps> = ({
  onBack,
  onNavigateToMassCreation,
  researchAccess = null,
}) => {
  const isBonusesResearchAccess = researchAccess === 'bonuses';
  const {
    profileId,
    showReferralInviteCreationBanner,
    singleCampaignSeed,
    clearSingleCampaignSeed,
    consumePendingPromoBonusPackageId,
    notifyReferralCampaignCreatedFromCreation,
  } = useProfile();
  const repeatSeedAppliedRef = useRef(false);
  const promoBonusSeedAppliedRef = useRef(false);
  const [campaignName, setCampaignName] = useState('Кампания от 26.12.2024');
  const [paymentModel, setPaymentModel] = useState<'CPM' | 'CPC'>('CPC');
  const [budget, setBudget] = useState('3000');

  useEffect(() => {
    if (profileId === '2' && showReferralInviteCreationBanner) {
      setBudget('2000');
    }
  }, [profileId, showReferralInviteCreationBanner]);
  const [isAutoRefillEnabled, setIsAutoRefillEnabled] = useState(false);
  const [isAutoRefillModalOpen, setIsAutoRefillModalOpen] = useState(false);
  const [wasAutoRefillToggledOn, setWasAutoRefillToggledOn] = useState(false);
  const [autoRefillMode, setAutoRefillMode] = useState<AutoRefillMode>('manual');
  const [bidType, setBidType] = useState<'unified' | 'manual'>('unified');
  const [displayZones, setDisplayZones] = useState({ search: true, recommendations: true });
  const [unifiedBid, setUnifiedBid] = useState('500');
  const [manualBid, setManualBid] = useState('500');
  const [isDailyLimitEnabled, setIsDailyLimitEnabled] = useState(false);
  const [dailyLimitValue, setDailyLimitValue] = useState(String(DAILY_LIMIT_ABSOLUTE_MIN));
  const [dailyLimitDraft, setDailyLimitDraft] = useState(String(DAILY_LIMIT_ABSOLUTE_MIN));
  const [isCarryoverEnabled, setIsCarryoverEnabled] = useState(true);
  const [isAdvancedDailyLimitModalOpen, setIsAdvancedDailyLimitModalOpen] = useState(false);
  const [advancedDailyLimitSettings, setAdvancedDailyLimitSettings] =
    useState<AdvancedDailyLimitSettings>(() => ({
      ...createDefaultAdvancedDailyLimitSettings(),
      autoIncreaseEnabled: true,
      drrMetricEnabled: true,
      increaseRules: [
        {
          id: 'creation-drr',
          enabled: true,
          metric: 'drr',
          limitIncreasePercent: 25,
          conditions: [
            {
              id: 'creation-drr-cond',
              compare: 'below',
              threshold: 15,
              budgetChangeRub: 500,
            },
          ],
          drrBelowPercent: 15,
          crAbovePercent: 2.8,
        },
      ],
    }));
  const [autoRefillOnRulesTrigger, setAutoRefillOnRulesTrigger] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastIsError, setToastIsError] = useState(false);
  const { showCpmBidRoundedAlert, cpmBidRoundedAlertNode } = useCpmBidRoundedAlert();
  const [isMultiCategoryWarningOpen, setIsMultiCategoryWarningOpen] = useState(false);
  const [products, setProducts] = useState<CampaignProductRow[]>([]);
  const [productBidsByNmId, setProductBidsByNmId] = useState<Record<number, string>>({});
  const [productBidDraftByNmId, setProductBidDraftByNmId] = useState<Record<number, string>>({});
  const [isAddProductsModalOpen, setIsAddProductsModalOpen] = useState(false);
  const [actionsMenuNmId, setActionsMenuNmId] = useState<number | null>(null);
  const [rankingFactorsProduct, setRankingFactorsProduct] = useState<CampaignProductRow | null>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const [referralCode, setReferralCode] = useState('');
  const [usePromoBonuses, setUsePromoBonuses] = useState(false);
  const [selectedBonusPkgId, setSelectedBonusPkgId] = useState<string>(BONUS_PACKAGES[0].id);
  const [bonusAmount, setBonusAmount] = useState('300');
  const [bonusPlacement, setBonusPlacement] = useState<BonusPlacement>('wallet');
  const [bonusPlacementMenuOpen, setBonusPlacementMenuOpen] = useState(false);
  const bonusPlacementMenuRef = useRef<HTMLDivElement>(null);
  const [isBonusMenuOpen, setIsBonusMenuOpen] = useState(false);

  const bonusPlacementIndex = Math.max(
    1,
    BONUS_PLACEMENT_TABS.findIndex((tab) => tab.id === bonusPlacement) + 1,
  );

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
    if (!isBonusMenuOpen) return;
    const onDocMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-bonus-menu-root]')) return;
      setIsBonusMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [isBonusMenuOpen]);

  useEffect(() => {
    setIsBonusMenuOpen(false);
  }, [bonusPlacement]);

  useEffect(() => {
    if (!bonusPlacementMenuOpen) return;
    const onDoc = (event: MouseEvent) => {
      if (bonusPlacementMenuRef.current?.contains(event.target as Node)) return;
      setBonusPlacementMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setBonusPlacementMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [bonusPlacementMenuOpen]);

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

  useEffect(() => {
    if (promoBonusSeedAppliedRef.current) return;
    const pkgId = consumePendingPromoBonusPackageId();
    if (!pkgId) return;
    promoBonusSeedAppliedRef.current = true;
    const pkg = BONUS_PACKAGES.find((item) => item.id === pkgId) ?? BONUS_PACKAGES[0];
    setBonusPlacement('budget');
    setSelectedBonusPkgId(pkg.id);
    setUsePromoBonuses(true);
    setBonusAmount(String(maxSpendableBonusFromPackage(pkg, parseDisplayValue(budget))));
  }, [consumePendingPromoBonusPackageId, budget]);

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

  const budgetRub = parseDisplayValue(budget);
  const selectedBonusPkg =
    BONUS_PACKAGES.find((pkg) => pkg.id === selectedBonusPkgId) ?? BONUS_PACKAGES[0];
  const maxPromoBonusB = maxSpendableBonusFromPackage(selectedBonusPkg, budgetRub);
  const parsedBonusAmount = parseDisplayValue(bonusAmount);
  const appliedPromoBonusB = usePromoBonuses
    ? Math.max(0, Math.min(isNaN(parsedBonusAmount) ? 0 : parsedBonusAmount, maxPromoBonusB))
    : 0;
  const totalFromElsRub = Math.max(0, budgetRub - appliedPromoBonusB);
  const promoBonusAfterLaunchB = Math.max(0, Math.floor(budgetRub * 0.1));

  // Лимит пакета = min(остаток пакета, % от бюджета). Пересчитываем сумму списания
  // при включении бонусов, смене пакета или изменении бюджета кампании.
  useEffect(() => {
    if (!usePromoBonuses) return;
    const pkg =
      BONUS_PACKAGES.find((item) => item.id === selectedBonusPkgId) ?? BONUS_PACKAGES[0];
    setBonusAmount(String(maxSpendableBonusFromPackage(pkg, budgetRub)));
  }, [usePromoBonuses, selectedBonusPkgId, budgetRub]);

  const handleBonusAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^\d]/g, '');
    if (digits === '') {
      setBonusAmount('');
      return;
    }
    const parsed = Number(digits);
    if (isNaN(parsed)) return;
    setBonusAmount(String(parsed));
    if (parsed > maxPromoBonusB) {
      setToastIsError(true);
      setToastMessage(
        `С этого пакета можно списать не больше ${formatForDisplay(maxPromoBonusB)} промобонусов`,
      );
      setShowToast(true);
    }
  };

  const handleBonusAmountBlur = () => {
    const parsed = parseDisplayValue(bonusAmount);
    if (isNaN(parsed) || parsed < 0) {
      setBonusAmount(String(maxPromoBonusB));
      return;
    }
    if (parsed > maxPromoBonusB) {
      setToastIsError(true);
      setToastMessage(
        `С этого пакета можно списать не больше ${formatForDisplay(maxPromoBonusB)} промобонусов`,
      );
      setShowToast(true);
    }
    setBonusAmount(String(Math.min(parsed, maxPromoBonusB)));
  };

  const selectBonusPackage = (pkgId: string) => {
    const pkg = BONUS_PACKAGES.find((item) => item.id === pkgId) ?? BONUS_PACKAGES[0];
    setSelectedBonusPkgId(pkg.id);
    setBonusAmount(String(maxSpendableBonusFromPackage(pkg, budgetRub)));
    if (!usePromoBonuses) setUsePromoBonuses(true);
  };

  const bonusPickerProps = {
    selectedPkgId: selectedBonusPkgId,
    amountDisplay: bonusAmount === '' ? '' : formatForDisplay(bonusAmount),
    maxAmountDisplay: formatForDisplay(maxPromoBonusB),
    bonusError:
      bonusAmount !== '' && !isNaN(parsedBonusAmount) && parsedBonusAmount > maxPromoBonusB
        ? `С этого пакета можно списать не больше ${formatForDisplay(maxPromoBonusB)} промобонусов`
        : '',
    onSelectPackage: selectBonusPackage,
    onAmountChange: handleBonusAmountChange,
    onAmountBlur: handleBonusAmountBlur,
    formatAmount: formatForDisplay,
  };

  const bonusDropdownMenu = (
    <BonusPackagesMenu
      selectedPkgId={selectedBonusPkgId}
      amountDisplay={bonusAmount === '' ? '' : formatForDisplay(bonusAmount)}
      onSelectPackage={selectBonusPackage}
      onAmountChange={handleBonusAmountChange}
      onAmountBlur={handleBonusAmountBlur}
      formatAmount={formatForDisplay}
    />
  );

  const renderBonusToggleAmount = () => (
    <div className="mt-1.5 flex items-center gap-2">
      <ToggleSwitch
        checked={usePromoBonuses}
        onChange={(checked) => {
          setUsePromoBonuses(checked);
          if (!checked) setIsBonusMenuOpen(false);
        }}
      />
      {usePromoBonuses ? (
        <button
          type="button"
          onClick={() => setIsBonusMenuOpen((open) => !open)}
          className="inline-flex items-center gap-1 text-base font-bold leading-none tabular-nums text-gray-900"
          aria-expanded={isBonusMenuOpen}
          aria-label="Выбор бонусов"
        >
          {formatForDisplay(appliedPromoBonusB)} B
          <ChevronDown
            className={`h-4 w-4 text-gray-500 transition-transform ${
              isBonusMenuOpen ? 'rotate-180' : ''
            }`}
            aria-hidden
          />
        </button>
      ) : null}
    </div>
  );

  const promoBonusSpendLabel = usePromoBonuses ? (
    <>
      Списать бонусы с пакета где{' '}
      <span className="font-medium text-gray-900">
        {formatForDisplay(selectedBonusPkg.amount)} B
      </span>
    </>
  ) : (
    'Списать бонусы'
  );

  const enableDailyLimit = useCallback(() => {
    setIsDailyLimitEnabled(true);
    setIsCarryoverEnabled(true);
    if (!dailyLimitValue) {
      setDailyLimitValue(String(DAILY_LIMIT_ABSOLUTE_MIN));
      setDailyLimitDraft(String(DAILY_LIMIT_ABSOLUTE_MIN));
    }
  }, [dailyLimitValue]);

  const disableDailyLimit = useCallback(() => {
    setIsDailyLimitEnabled(false);
    setIsCarryoverEnabled(false);
    setDailyLimitValue('');
    setDailyLimitDraft('');
    setAdvancedDailyLimitSettings(createDefaultAdvancedDailyLimitSettings());
  }, []);

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
      <AppHeader
        onNavigate={onBack}
        researchAccess={isBonusesResearchAccess ? 'bonuses' : null}
      />
      
      <main className="flex flex-col items-center gap-6 px-6 py-8 pb-24">
        {profileId === '2' && showReferralInviteCreationBanner && (
          <div className="w-full max-w-[1200px]">
            <ReferralInviteCreationBanner />
          </div>
        )}

        {/* Управление кампанией — макет карточки */}
        <div className="mx-auto w-full max-w-[1200px] overflow-visible rounded-2xl border border-[#EBEBEF] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between gap-4 px-5 pb-2 pt-5">
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="min-w-0 flex-1 border-none bg-transparent p-0 text-left text-[22px] font-bold leading-7 tracking-[-0.02em] text-gray-900 outline-none focus:outline-none"
            />
            <button
              type="button"
              className="flex shrink-0 items-center gap-1.5 text-sm font-normal text-[#6C5CE7] hover:text-[#5B4BFF]"
            >
              <Info className="h-4 w-4" aria-hidden />
              Инструкция
            </button>
          </div>

          <div className="px-5 pb-5 pt-3">
            <SingleCampaignPaymentModelSelector
              value={paymentModel}
              onChange={setPaymentModel}
            />
          </div>
        </div>

        {/* Бюджет — единый блок как в редактировании, слева ввод вместо «Остаток» */}
        <div className="mx-auto w-full max-w-[1200px]">
          <div className="flex w-full flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.03]">
            {bonusPlacement === 'cards' ? (
              <>
                <p className="mb-2 text-xl font-bold leading-none text-gray-900">Бюджет кампании</p>
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch">
                  <div
                    className="relative mb-3 flex w-full flex-col sm:mr-8 sm:w-[320px] sm:shrink-0"
                    data-bonus-menu-root
                  >
                    <div className="flex min-w-0 flex-col">
                      <div className="relative w-full">
                        <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-sm text-gray-500">
                          Пополнить на
                        </span>
                        <input
                          type="text"
                          value={formatForDisplay(budget)}
                          onChange={handleBudgetChange}
                          onBlur={handleBudgetBlur}
                          className="h-9 w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-[104px] pr-7 text-right text-base font-semibold tabular-nums text-gray-900 outline-none transition-colors hover:border-gray-300 focus:border-[#9A41FE] focus:ring-1 focus:ring-[#9A41FE]"
                          aria-label="Бюджет кампании"
                        />
                        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                          ₽
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex min-w-0 flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] leading-none text-gray-500">Тратить бонусы</span>
                        <ToggleSwitch
                          checked={usePromoBonuses}
                          onChange={(checked) => {
                            setUsePromoBonuses(checked);
                            if (!checked) setIsBonusMenuOpen(false);
                          }}
                        />
                        {usePromoBonuses ? (
                          <button
                            type="button"
                            onClick={() => setIsBonusMenuOpen((open) => !open)}
                            className="ml-auto inline-flex items-center gap-1 text-[14px] font-bold leading-none tabular-nums text-gray-900"
                            aria-expanded={isBonusMenuOpen}
                            aria-label="Выбор бонусов"
                          >
                            <ChevronDown
                              className={`h-4 w-4 text-gray-500 transition-transform ${
                                isBonusMenuOpen ? 'rotate-180' : ''
                              }`}
                              aria-hidden
                            />
                            {formatForDisplay(appliedPromoBonusB)} B
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-[14px] text-gray-500">Спишем с единого счёта</span>
                      <p className="mb-0 text-[14px] font-bold leading-none tabular-nums text-gray-900">
                        {formatForDisplay(totalFromElsRub)} ₽
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-[14px] text-gray-500">Начислим бонусов</span>
                      <p className="mb-0 text-[14px] font-bold leading-none tabular-nums text-[#722ED1]">
                        +{formatForDisplay(promoBonusAfterLaunchB)} B
                      </p>
                    </div>
                    {usePromoBonuses && isBonusMenuOpen ? (
                      <div className="absolute left-0 top-full z-10 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] rounded-xl border border-gray-100 bg-white p-3 shadow-lg">
                        {bonusDropdownMenu}
                      </div>
                    ) : null}
                  </div>

                  <div
                    className="flex w-full flex-col gap-3 sm:w-auto sm:shrink-0 sm:flex-row"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setWasAutoRefillToggledOn(!isAutoRefillEnabled);
                        setIsAutoRefillModalOpen(true);
                      }}
                      className="flex min-h-[116px] w-full flex-col gap-1.5 rounded-xl border border-gray-200 px-3 py-2.5 text-left transition-colors hover:bg-[#F5F5F7] sm:w-[220px] sm:shrink-0"
                    >
                      <span className="text-sm text-gray-500">Автопополнение</span>
                      {isAutoRefillEnabled ? (
                        <p className="mt-auto text-sm leading-snug text-gray-900">
                          {autoRefillMode === 'dailyLimit' ? (
                            <>Пополняем бюджет автоматически, если он меньше нужного дневного лимита</>
                          ) : (
                            <>
                              Если бюджет меньше {formatForDisplay(1000)} ₽, пополнять на{' '}
                              {formatForDisplay(3000)} ₽ не чаще 1 раза в день
                            </>
                          )}
                        </p>
                      ) : (
                        <span className="mt-auto w-fit rounded-lg bg-gray-100 px-2.5 py-1 text-sm font-medium text-gray-900">
                          Настроить
                        </span>
                      )}
                    </button>

                    {paymentModel === 'CPC' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setDailyLimitDraft(dailyLimitValue || String(DAILY_LIMIT_ABSOLUTE_MIN));
                          setIsAdvancedDailyLimitModalOpen(true);
                        }}
                        className="flex min-h-[116px] w-full flex-col gap-1.5 rounded-xl border border-gray-200 px-3 py-2.5 text-left transition-colors hover:bg-[#F5F5F7] sm:w-[220px] sm:shrink-0"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-gray-500">Дневной лимит</span>
                          {isDailyLimitEnabled ? (
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-700">
                              <Edit2 className="h-3.5 w-3.5" aria-hidden />
                            </span>
                          ) : null}
                        </div>
                        {isDailyLimitEnabled ? (
                          <div className="mt-auto">
                            <div className="flex items-start gap-1.5">
                              <p className="text-base font-semibold leading-none tabular-nums text-gray-900">
                                {formatForDisplay(dailyLimitValue || DAILY_LIMIT_ABSOLUTE_MIN)} ₽
                              </p>
                              {showDailyLimitBidMismatchHint ? (
                                <DailyLimitBidMismatchHint
                                  recommendedDailyLimitRub={recommendedDailyLimitForBids}
                                  className="mt-0.5"
                                />
                              ) : null}
                            </div>
                            {advancedDailyLimitSettings.autoIncreaseEnabled ? (
                              <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-gray-500">
                                Меняется от ДРР
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <span className="mt-auto w-fit rounded-lg bg-gray-100 px-2.5 py-1 text-sm font-medium text-gray-900">
                            Установить
                          </span>
                        )}
                      </button>
                    ) : null}
                  </div>
                </div>
              </>
            ) : (
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch">
              <div className="flex w-full flex-col justify-between gap-3 sm:min-h-[116px] sm:w-[240px] sm:shrink-0">
                <p className="text-xl font-bold leading-none text-gray-900">Бюджет</p>
                <div className="relative w-full">
                  <input
                    type="text"
                    value={formatForDisplay(budget)}
                    onChange={handleBudgetChange}
                    onBlur={handleBudgetBlur}
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-3 pr-8 text-[15px] font-medium tabular-nums text-gray-900 outline-none transition-colors hover:border-gray-300 focus:border-[#9A41FE] focus:ring-1 focus:ring-[#9A41FE]"
                    aria-label="Бюджет кампании"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    ₽
                  </span>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-stretch">
                <button
                  type="button"
                  onClick={() => {
                    setWasAutoRefillToggledOn(!isAutoRefillEnabled);
                    setIsAutoRefillModalOpen(true);
                  }}
                  className="flex min-h-[116px] w-full flex-col gap-1.5 rounded-xl border border-gray-200 px-3 py-2.5 text-left transition-colors hover:bg-[#F5F5F7] sm:w-[220px] sm:shrink-0"
                >
                  <span className="text-sm text-gray-500">Автопополнение</span>
                  {isAutoRefillEnabled ? (
                    <p className="mt-auto text-sm leading-snug text-gray-900">
                      {autoRefillMode === 'dailyLimit' ? (
                        <>Пополняем бюджет автоматически, если он меньше нужного дневного лимита</>
                      ) : (
                        <>
                          Если бюджет меньше {formatForDisplay(1000)} ₽, пополнять на{' '}
                          {formatForDisplay(3000)} ₽ не чаще 1 раза в день
                        </>
                      )}
                    </p>
                  ) : (
                    <span className="mt-auto w-fit rounded-lg bg-gray-100 px-2.5 py-1 text-sm font-medium text-gray-900">
                      Настроить
                    </span>
                  )}
                </button>

                {paymentModel === 'CPC' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDailyLimitDraft(dailyLimitValue || String(DAILY_LIMIT_ABSOLUTE_MIN));
                      setIsAdvancedDailyLimitModalOpen(true);
                    }}
                    className="flex min-h-[116px] w-full flex-col gap-1.5 rounded-xl border border-gray-200 px-3 py-2.5 text-left transition-colors hover:bg-[#F5F5F7] sm:w-[220px] sm:shrink-0"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-500">Дневной лимит</span>
                      {isDailyLimitEnabled ? (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-700">
                          <Edit2 className="h-3.5 w-3.5" aria-hidden />
                        </span>
                      ) : null}
                    </div>

                    {isDailyLimitEnabled ? (
                      <div className="mt-auto">
                        <div className="flex items-start gap-1.5">
                          <p className="text-base font-semibold leading-none tabular-nums text-gray-900">
                            {formatForDisplay(dailyLimitValue || DAILY_LIMIT_ABSOLUTE_MIN)} ₽
                          </p>
                          {showDailyLimitBidMismatchHint ? (
                            <DailyLimitBidMismatchHint
                              recommendedDailyLimitRub={recommendedDailyLimitForBids}
                              className="mt-0.5"
                            />
                          ) : null}
                        </div>
                        {advancedDailyLimitSettings.autoIncreaseEnabled ? (
                          <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-gray-500">
                            <svg
                              viewBox="0 0 16 16"
                              className="h-3 w-3 shrink-0 text-[#34C759]"
                              fill="none"
                              aria-hidden
                            >
                              <path
                                d="M1.5 10.5 5 7l3 3 6.5-6.5"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M11 3.5h3.5V7"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            Меняется от ДРР
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <span className="mt-auto w-fit rounded-lg bg-gray-100 px-2.5 py-1 text-sm font-medium text-gray-900">
                        Установить
                      </span>
                    )}
                  </button>
                ) : null}
              </div>
            </div>
            )}

            {bonusPlacement !== 'footer' && bonusPlacement !== 'cards' ? (
            <div className="flex w-full flex-col gap-4 border-t border-gray-100 pt-3">
              {bonusPlacement === 'budget' ? (
                <div
                  className="relative flex min-h-[52px] flex-wrap items-start gap-4 sm:gap-5"
                  data-bonus-menu-root
                >
                  <div className="min-w-0 shrink-0">
                    <p className="text-xs leading-none text-gray-400">Итого с ЕЛС</p>
                    <p className="mt-1.5 mb-0 text-base font-bold leading-none tabular-nums text-gray-900">
                      {formatForDisplay(totalFromElsRub)} ₽
                    </p>
                  </div>
                  <div className="min-w-0 shrink-0">
                    <p className="text-xs leading-none text-gray-400">{promoBonusSpendLabel}</p>
                    {renderBonusToggleAmount()}
                  </div>
                  <div className="hidden h-9 w-px shrink-0 bg-gray-200 sm:block" aria-hidden />
                  <div className="min-w-0 shrink-0">
                    <div className="flex items-center gap-1">
                      <p className="mb-0 text-xs leading-none text-gray-400">Начислим после запуска</p>
                      <span className="group relative inline-flex">
                        <button
                          type="button"
                          className="text-gray-400 transition-colors hover:text-gray-600"
                          aria-label="Когда начислим бонусы"
                        >
                          <HelpCircle className="h-3.5 w-3.5" aria-hidden />
                        </button>
                        <span
                          role="tooltip"
                          className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-64 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs font-normal leading-snug text-white group-hover:block group-focus-within:block"
                        >
                          Начислим бонусы, когда кампания завершится и потратит весь бюджет.
                        </span>
                      </span>
                    </div>
                    <p className="mt-[9px] mb-0 text-base font-bold leading-none tabular-nums text-[#722ED1]">
                      +{formatForDisplay(promoBonusAfterLaunchB)} B
                    </p>
                  </div>
                  {usePromoBonuses && isBonusMenuOpen ? (
                    <div className="absolute left-0 top-full z-10 mt-2 w-[22rem] max-w-full rounded-xl border border-gray-100 bg-white p-3 shadow-lg">
                      {bonusDropdownMenu}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {bonusPlacement === 'wallet' ? (
                <>
                  <div className="relative flex min-h-[52px] flex-col items-start gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-9 shrink-0 items-center justify-center text-gray-400">
                        <Wallet className="h-5 w-5" aria-hidden />
                      </span>
                      <p className="mb-0 text-[15px] font-medium leading-none text-gray-900">
                        Спишем со счёта:{' '}
                        <span className="tabular-nums">{formatForDisplay(totalFromElsRub)} ₽</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-9 shrink-0 items-center justify-center">
                        <ToggleSwitch
                          checked={usePromoBonuses}
                          onChange={setUsePromoBonuses}
                          size="md"
                        />
                      </span>
                      <p className="mb-0 text-[15px] font-medium leading-none text-gray-900">
                        Спишем бонусов:{' '}
                        <span className="tabular-nums">
                          {formatForDisplay(appliedPromoBonusB)} B
                        </span>
                      </p>
                    </div>
                  </div>

                  {usePromoBonuses ? <BonusPackagePicker {...bonusPickerProps} /> : null}
                </>
              ) : null}

              {bonusPlacement === 'select' ? (
                <>
                  <div className="relative flex min-h-[52px] flex-col items-start gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-9 shrink-0 items-center justify-center text-gray-400">
                        <Wallet className="h-5 w-5" aria-hidden />
                      </span>
                      <p className="mb-0 text-[15px] font-medium leading-none text-gray-900">
                        Спишем со счёта:{' '}
                        <span className="tabular-nums">{formatForDisplay(totalFromElsRub)} ₽</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-9 shrink-0 items-center justify-center">
                        <ToggleSwitch
                          checked={usePromoBonuses}
                          onChange={(checked) => {
                            setUsePromoBonuses(checked);
                            if (!checked) setIsBonusMenuOpen(false);
                          }}
                          size="md"
                        />
                      </span>
                      <p className="mb-0 text-[15px] font-medium leading-none text-gray-900">
                        Спишем бонусов:{' '}
                        <span className="tabular-nums">
                          {formatForDisplay(appliedPromoBonusB)} B
                        </span>
                      </p>
                    </div>
                  </div>

                  {usePromoBonuses ? (
                    <BonusPackageRichSelect
                      {...bonusPickerProps}
                      menuOpen={isBonusMenuOpen}
                      onMenuOpenChange={setIsBonusMenuOpen}
                    />
                  ) : null}
                </>
              ) : null}
            </div>
            ) : null}
          </div>
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
        <div className="bg-white rounded-2xl px-5 pt-0 pb-0 shadow-sm border border-gray-100 w-full max-w-[1200px] mx-auto">
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
                <h2 className="mt-[15px] text-lg font-bold text-gray-900">
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
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                              <span>· {product.nmId}</span>
                              <CopyNmIdButton nmId={product.nmId} />
                              <button
                                type="button"
                                onClick={() => setRankingFactorsProduct(product)}
                                className="font-medium text-gray-500 transition-colors hover:text-gray-700"
                              >
                                Факторы ранжирования <span className="text-[#F07167]">-2</span>
                              </button>
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
      <Toast
        show={showToast}
        message={toastMessage}
        isError={toastIsError}
        onClose={() => {
          setShowToast(false);
          setToastIsError(false);
        }}
      />
      {cpmBidRoundedAlertNode}

      <RankingFactorsSidePanel
        open={rankingFactorsProduct != null}
        onClose={() => setRankingFactorsProduct(null)}
        productName={rankingFactorsProduct?.productName}
        productImageUrl={
          rankingFactorsProduct
            ? resolveProductTableThumbSrc(
                String(rankingFactorsProduct.nmId),
                rankingFactorsProduct.imageUrl,
                rankingFactorsProduct.category,
              ) || PRODUCT_TABLE_THUMB_FALLBACK
            : undefined
        }
        productMeta={
          rankingFactorsProduct
            ? `${rankingFactorsProduct.category} • ${rankingFactorsProduct.brand ?? '—'} • ${rankingFactorsProduct.nmId}`
            : undefined
        }
      />

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
                  if (isBonusesResearchAccess) return;
                  onNavigateToMassCreation(products);
                }}
                className="rounded-xl bg-[#2E3038] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#23252c]"
              >
                {isBonusesResearchAccess ? 'Понятно' : 'Добавить товар'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed footer island */}
      {bonusPlacement === 'footer' || products.length > 0 ? (
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
          <div className="pointer-events-auto relative flex flex-wrap items-center gap-4 rounded-[20px] bg-white p-[10px] pl-4 shadow-[0_8px_28px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.06] sm:flex-nowrap sm:gap-5">
            {profileId === '2' && (
              <label className="flex items-center gap-2">
                <span className="whitespace-nowrap text-xs font-medium text-gray-500">Реф. код</span>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  className="w-[5.5rem] rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-violet-300 focus:outline-none focus:ring-1 focus:ring-violet-100"
                  aria-label="Реферальный код"
                />
              </label>
            )}

            {bonusPlacement === 'footer' ? (
              <>
                <div className="min-w-0 shrink-0">
                  <p className="text-xs leading-none text-gray-400">Итого с ЕЛС</p>
                  <p className="mt-1.5 mb-0 text-base font-bold leading-none tabular-nums text-gray-900">
                    {formatForDisplay(totalFromElsRub)} ₽
                  </p>
                </div>
                <div className="hidden h-9 w-px shrink-0 bg-gray-200 sm:block" aria-hidden />
                <div className="relative min-w-0 shrink-0" data-bonus-menu-root>
                  <p className="text-xs leading-none text-gray-400">{promoBonusSpendLabel}</p>
                  {renderBonusToggleAmount()}
                  {usePromoBonuses && isBonusMenuOpen ? (
                    <div className="absolute bottom-full left-1/2 z-10 mb-2 w-[22rem] -translate-x-1/2 rounded-xl border border-gray-100 bg-white p-3 shadow-lg">
                      {bonusDropdownMenu}
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}

            <button
              type="button"
              disabled={products.length === 0}
              className={`shrink-0 rounded-xl px-5 py-2.5 text-sm font-bold transition-colors sm:px-6 sm:py-3 sm:text-base ${
                products.length === 0
                  ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                  : 'bg-[#9A41FE] text-white hover:bg-[#8835E8]'
              }`}
              onClick={() => {
                if (products.length === 0) return;
                if (profileId === '2' && referralCode.trim()) {
                  notifyReferralCampaignCreatedFromCreation();
                }
                onNavigateToMassCreation(products);
              }}
            >
              Запустить
            </button>
          </div>
        </div>
      ) : null}

      {isAutoRefillModalOpen ? (
        <AutoRefillModal
          isOpen={isAutoRefillModalOpen}
          initialMode={autoRefillMode}
          onClose={() => {
            setIsAutoRefillModalOpen(false);
            if (wasAutoRefillToggledOn) {
              setIsAutoRefillEnabled(false);
              setWasAutoRefillToggledOn(false);
            }
          }}
          onSave={(mode) => {
            setAutoRefillMode(mode);
            setIsAutoRefillEnabled(true);
            setIsAutoRefillModalOpen(false);
            setWasAutoRefillToggledOn(false);
            setToastMessage('Автопополнение настроено');
            setShowToast(true);
          }}
        />
      ) : null}

      <AdvancedDailyLimitModal
        dailyLimitOnly
        conditionRuleBuilder
        allowLimitAboveBudget={true}
        isOpen={isAdvancedDailyLimitModalOpen}
        onClose={() => {
          setDailyLimitDraft(dailyLimitValue || String(DAILY_LIMIT_ABSOLUTE_MIN));
          setIsAdvancedDailyLimitModalOpen(false);
        }}
        isDailyLimitEnabled={isDailyLimitEnabled}
        onEnableDailyLimit={enableDailyLimit}
        onDisableDailyLimit={disableDailyLimit}
        dailyLimitValue={dailyLimitDraft}
        onDailyLimitValueChange={setDailyLimitDraft}
        onDailyLimitCommit={(parsed, options) => {
          if (isNaN(parsed) || parsed < DAILY_LIMIT_ABSOLUTE_MIN) {
            setDailyLimitDraft(String(DAILY_LIMIT_ABSOLUTE_MIN));
            setToastMessage(
              `Минимальный дневной лимит — ${formatForDisplay(DAILY_LIMIT_ABSOLUTE_MIN)} ₽`,
            );
            setShowToast(true);
            return;
          }
          setDailyLimitValue(String(parsed));
          setDailyLimitDraft(String(parsed));
          setIsDailyLimitEnabled(true);
          if (!options?.silent) {
            setToastMessage(
              `Новый дневной лимит установлен.\nРаспределяем ${formatForDisplay(parsed)}₽ в течении суток равномерно`,
            );
            setShowToast(true);
          }
        }}
        savedDailyLimit={dailyLimitValue}
        isCarryoverEnabled={isCarryoverEnabled}
        onCarryoverChange={setIsCarryoverEnabled}
        campaignBudget={budgetRub}
        initialSettings={advancedDailyLimitSettings}
        referenceCpcBidRub={maxProductBidRub > 0 ? maxProductBidRub : parseDisplayValue(unifiedBid)}
        autoRefillOnRulesTrigger={autoRefillOnRulesTrigger}
        onAutoRefillOnRulesTriggerChange={setAutoRefillOnRulesTrigger}
        onApply={(settings, options) => {
          setAdvancedDailyLimitSettings(settings);
          if (options?.reset) return;
          setIsAdvancedDailyLimitModalOpen(false);
          setToastMessage(
            settings.autoIncreaseEnabled
              ? 'Настроен динамичный лимит'
              : 'Настройки дневного лимита сохранены',
          );
          setShowToast(true);
        }}
        onAfterResetSettings={() => {
          setToastMessage('Расширенные настройки сброшены');
          setShowToast(true);
        }}
      />

      <div
        ref={bonusPlacementMenuRef}
        className="fixed bottom-5 right-4 z-[90] flex flex-col items-end gap-1.5"
      >
        {bonusPlacementMenuOpen ? (
          <div
            className="min-w-[12rem] overflow-hidden rounded-xl border border-gray-200/90 bg-white/95 py-1 shadow-lg backdrop-blur-sm"
            role="menu"
            aria-label="Расположение бонусов"
          >
            {BONUS_PLACEMENT_TABS.map((tab, index) => {
              const active = bonusPlacement === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => {
                    setBonusPlacement(tab.id);
                    setBonusPlacementMenuOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] transition-colors ${
                    active
                      ? 'bg-gray-900 font-medium text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="tabular-nums text-[11px] opacity-70">
                    {index + 1}/{BONUS_PLACEMENT_TABS.length}
                  </span>
                  <span className="min-w-0 truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => setBonusPlacementMenuOpen((open) => !open)}
          className={`inline-flex h-8 items-center justify-center rounded-full border border-gray-200/80 bg-white/85 px-2.5 text-[11px] font-medium tabular-nums text-gray-500 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-gray-800 ${
            bonusPlacementMenuOpen ? 'ring-2 ring-gray-900/10' : ''
          }`}
          aria-expanded={bonusPlacementMenuOpen}
          aria-label={`Расположение бонусов ${bonusPlacementIndex} из ${BONUS_PLACEMENT_TABS.length}`}
          title="Расположение бонусов"
        >
          {bonusPlacementIndex}/{BONUS_PLACEMENT_TABS.length}
        </button>
      </div>
    </div>
  );
};
