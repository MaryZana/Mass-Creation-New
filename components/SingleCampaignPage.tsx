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
const MOCK_PRODUCTS: CampaignProductRow[] = [
  {
    nmId: 215685549,
    productName: 'Фото',
    brand: 'PhotoBrand',
    articleSeller: 'PH-001',
    imageUrl: '',
    category: 'Фоторамки',
    cpcCompatible: true,
  },
  {
    nmId: 215685550,
    productName: 'фото',
    brand: 'PhotoBrand',
    articleSeller: 'PH-002',
    imageUrl: '',
    category: 'Фоторамки',
    cpcCompatible: true,
  },
  {
    nmId: 216362914,
    productName: 'фото',
    brand: 'PhotoBrand',
    articleSeller: 'PH-003',
    imageUrl: '',
    category: 'Фоторамки',
    cpcCompatible: true,
  },
  {
    nmId: 160747186,
    productName: 'Кроссовки спортивные',
    brand: 'Nike',
    articleSeller: 'NK-8842',
    imageUrl: '',
    category: 'Кроссовки',
    cpcCompatible: true,
  },
  {
    nmId: 160747187,
    productName: 'Рюкзак городской',
    brand: 'Adidas',
    articleSeller: 'AD-120',
    imageUrl: '',
    category: 'Сумки',
    cpcCompatible: false,
  },
  {
    nmId: 160747188,
    productName: 'Куртка зимняя',
    brand: 'Reserved',
    articleSeller: 'RS-991',
    imageUrl: '',
    category: 'Футболки',
    cpcCompatible: true,
  },
];

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

export const SingleCampaignPage: React.FC<SingleCampaignPageProps> = ({ onBack }) => {
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
  const [products, setProducts] = useState<CampaignProductRow[]>([]);
  const [productBidsByNmId, setProductBidsByNmId] = useState<Record<number, string>>({});
  const [isAddProductsModalOpen, setIsAddProductsModalOpen] = useState(false);
  const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false);
  const uploadMenuRef = useRef<HTMLDivElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
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
                className="text-2xl font-bold text-gray-900 bg-transparent border-none outline-none focus:outline-none text-left flex-1 min-w-0"
                style={{ fontFamily: "'ALS Hauss VF', sans-serif", fontStyle: 'normal', fontWeight: 680, fontSize: '28px', lineHeight: '36px' }}
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
                  <span className="text-base font-normal text-gray-900" style={{ fontFamily: "'ALS Hauss VF', sans-serif", fontStyle: 'normal', fontWeight: 440, fontSize: '16px', lineHeight: '20px' }}>
                    CPM
                  </span>
                  <span className="text-xs text-[#77767E]" style={{ fontFamily: "'ALS Hauss VF', sans-serif", fontSize: '13px', lineHeight: '120%' }}>
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
                  <span className="text-base font-normal text-[#4A4A59]" style={{ fontFamily: "'ALS Hauss VF', sans-serif", fontStyle: 'normal', fontWeight: 440, fontSize: '16px', lineHeight: '20px' }}>
                    CPC
                  </span>
                  <span className="text-xs text-[#77767E]" style={{ fontFamily: "'ALS Hauss VF', sans-serif", fontSize: '13px', lineHeight: '120%' }}>
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
            <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'ALS Hauss VF', sans-serif", fontStyle: 'normal', fontWeight: 680, fontSize: '22px', lineHeight: '28px' }}>
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
                <label className="text-base text-[#4E4E53]" style={{ fontFamily: "'ALS Hauss VF', sans-serif", fontStyle: 'normal', fontWeight: 440, fontSize: '16px', lineHeight: '20px' }}>
                  Бюджет кампании
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formatForDisplay(budget)}
                    onChange={handleBudgetChange}
                    onBlur={handleBudgetBlur}
                    className="w-full px-3 py-3 bg-white border border-[#E3E4EA] rounded-lg outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                    style={{ fontFamily: "'ALS Hauss VF', sans-serif", fontStyle: 'normal', fontWeight: 440, fontSize: '16px', lineHeight: '20px' }}
                  />
                </div>
                <p className="text-xs text-[#767386] font-semibold" style={{ fontFamily: "'ALS Hauss VF', sans-serif", fontStyle: 'normal', fontWeight: 560, fontSize: '13px', lineHeight: '16px' }}>
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
                  <span className="text-base text-[#5067DE]" style={{ fontFamily: "'ALS Hauss VF', sans-serif", fontStyle: 'normal', fontWeight: 440, fontSize: '16px', lineHeight: '20px' }}>
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
                <p className="text-sm text-gray-800 flex items-center gap-1" style={{ fontFamily: "'ALS Hauss VF', sans-serif", fontStyle: 'normal', fontWeight: 440, fontSize: '16px', lineHeight: '20px' }}>
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
              <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'ALS Hauss VF', sans-serif", fontStyle: 'normal', fontWeight: 680, fontSize: '22px', lineHeight: '28px' }}>
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
                  className="text-base text-gray-900"
                  style={{
                    fontFamily: "'ALS Hauss VF', sans-serif",
                    fontStyle: 'normal',
                    fontWeight: 440,
                    fontSize: '16px',
                    lineHeight: '20px',
                  }}
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
                  className="text-base text-[#4A4A59]"
                  style={{
                    fontFamily: "'ALS Hauss VF', sans-serif",
                    fontStyle: 'normal',
                    fontWeight: 440,
                    fontSize: '16px',
                    lineHeight: '20px',
                  }}
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
                            <button
                              type="button"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                              aria-label="Действия"
                            >
                              <MoreVertical className="h-5 w-5" />
                            </button>
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

      {/* Modal for adding products */}
      <SingleCampaignAddProductsModal
        isOpen={isAddProductsModalOpen}
        onClose={() => setIsAddProductsModalOpen(false)}
        options={MOCK_PRODUCTS}
        alreadyAddedNmIds={alreadyAddedNmIds}
        isCpcMode={paymentModel === 'CPC'}
        onConfirm={(added) => {
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
        }}
      />

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
                  onBack();
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
