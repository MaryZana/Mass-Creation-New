import React, { useMemo, useState } from 'react';
import { AppHeader } from '../AppHeader';
import { Edit2, Gift, HelpCircle, Plus, ThumbsUp, Zap } from '../Icons';
import {
  SingleCampaignAddProductsModal,
  type SingleCampaignSelectableProduct,
} from '../SingleCampaignAddProductsModal';
import { MOCK_PRODUCTS } from '../SingleCampaignPage';
import {
  PRODUCT_TABLE_THUMB_FALLBACK,
  resolveProductTableThumbSrc,
} from '../SuccessPageTestData';

type PaymentModel = 'CPM' | 'CPC';
type BidType = 'unified' | 'manual';
type NewSellerTab = 'assembled' | 'create';

const NEW_SELLER_TABS: { id: NewSellerTab; label: string }[] = [
  { id: 'assembled', label: 'Собрали для вас' },
  { id: 'create', label: 'Создать свою кампанию' },
];

type AssembledCampaign = {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  paymentModel: 'CPC' | 'CPM';
  bidMode: string;
  budgetLabel: string;
  budgetUntil: string;
  extraProducts: number;
};

const ASSEMBLED_CAMPAIGNS: AssembledCampaign[] = [
  {
    id: '1',
    title: 'Кроссовки летник/CPC/22.05.2026',
    imageUrl: '',
    category: 'Кроссовки',
    paymentModel: 'CPC',
    bidMode: 'Ручная',
    budgetLabel: '5 000 B',
    budgetUntil: 'До 15 августа',
    extraProducts: 1,
  },
  {
    id: '2',
    title: 'Рюкзак городской/CPC/22.05.2026',
    imageUrl: '',
    category: 'Сумки',
    paymentModel: 'CPC',
    bidMode: 'Ручная',
    budgetLabel: '5 000 B',
    budgetUntil: 'До 1 сентября',
    extraProducts: 1,
  },
  {
    id: '3',
    title: 'Кроссовки летник/CPC/22.05.2026',
    imageUrl: '',
    category: 'Кроссовки',
    paymentModel: 'CPC',
    bidMode: 'Ручная',
    budgetLabel: '5 000 B',
    budgetUntil: 'До 15 августа',
    extraProducts: 1,
  },
];

const ToggleSwitch = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
      checked ? 'bg-purple-600' : 'bg-gray-300'
    }`}
  >
    <span
      aria-hidden
      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-0.5'
      }`}
    />
  </button>
);

function PromoCard({
  title,
  description,
  tone,
  icon,
}: {
  title: string;
  description: string;
  tone: 'purple' | 'white';
  icon: React.ReactNode;
}) {
  const isPurple = tone === 'purple';
  return (
    <div
      className={`flex flex-1 items-start gap-2.5 rounded-2xl px-3.5 py-3 ${
        isPurple ? 'bg-[#9A41FE] text-white' : 'border border-gray-100 bg-white text-gray-900 shadow-sm'
      }`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isPurple ? 'bg-white/20' : 'bg-violet-50 text-[#9A41FE]'
        }`}
        aria-hidden
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className={`mb-0.5 text-sm font-semibold leading-snug ${isPurple ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </p>
        <p className={`mb-0 text-xs leading-snug ${isPurple ? 'text-white/90' : 'text-gray-500'}`}>
          {description}
        </p>
      </div>
    </div>
  );
}

/**
 * Экран первого запуска для кабинета «Новый селлер».
 * Не связан с списками кампаний профилей 1/2 — у селлера ещё нет кампаний.
 */
export function NewSellerFirstCampaignPage({
  onBack,
  onOpenCampaignCreation,
}: {
  onBack: () => void;
  onOpenCampaignCreation?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<NewSellerTab>('assembled');
  const [campaignName, setCampaignName] = useState('Моя первая кампания от 26.12.2024');
  const [paymentModel, setPaymentModel] = useState<PaymentModel>('CPM');
  const [budget, setBudget] = useState('1000');
  const [isAutoRefillEnabled, setIsAutoRefillEnabled] = useState(false);
  const [bidType, setBidType] = useState<BidType>('unified');
  const [isAddProductsModalOpen, setIsAddProductsModalOpen] = useState(false);
  const [products, setProducts] = useState<SingleCampaignSelectableProduct[]>([]);

  const hasCampaignProduct = products.length > 0;
  const alreadyAddedNmIds = useMemo(
    () => (hasCampaignProduct ? new Set<number>() : new Set(products.map((p) => p.nmId))),
    [products, hasCampaignProduct],
  );

  const openCreateTab = () => {
    setActiveTab('create');
    onOpenCampaignCreation?.();
  };

  return (
    <div className="relative min-h-screen bg-[#F3F5F8] font-sans text-gray-900">
      <AppHeader
        onNavigate={onBack}
        campaignCreationActive={activeTab === 'create'}
        onOpenCampaignCreation={openCreateTab}
      />

      <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-6 py-6 pb-28">
        <div
          className="inline-flex w-fit max-w-full gap-1 rounded-xl bg-[#E8E9ED] p-1"
          role="tablist"
          aria-label="Разделы создания кампании"
        >
          {NEW_SELLER_TABS.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  selected
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'assembled' ? (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center gap-3 bg-[#9A41FE] px-5 py-4">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#9A41FE]"
                aria-hidden
              >
                <Zap className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="mb-0 text-base font-semibold leading-snug text-white">
                  Кампании уже готовы к запуску за бонусы
                </p>
                <p className="mb-0 mt-0.5 text-sm leading-snug text-white/80">
                  Добавили товары с лучшим потенциалом для продвижения
                </p>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {ASSEMBLED_CAMPAIGNS.map((campaign) => {
                const thumbSrc = resolveProductTableThumbSrc(
                  campaign.id,
                  campaign.imageUrl,
                  campaign.category,
                );
                return (
                  <div
                    key={campaign.id}
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-6"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="relative shrink-0">
                        <img
                          src={thumbSrc}
                          alt=""
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-xl border border-gray-100 bg-gray-50 object-cover"
                          loading="lazy"
                          onError={(e) => {
                            if (e.currentTarget.src !== PRODUCT_TABLE_THUMB_FALLBACK) {
                              e.currentTarget.src = PRODUCT_TABLE_THUMB_FALLBACK;
                            }
                          }}
                        />
                        {campaign.extraProducts > 0 ? (
                          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-semibold text-gray-700 shadow-sm ring-1 ring-gray-100">
                            +{campaign.extraProducts}
                          </span>
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="mb-0 truncate text-sm font-semibold text-gray-900">{campaign.title}</p>
                        <span className="mt-1 inline-flex rounded-md bg-[#F3E8FF] px-2 py-0.5 text-xs font-medium text-[#9A41FE]">
                          Бонусная кампания
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-5 sm:gap-8">
                      <div className="min-w-[4.5rem]">
                        <p className="mb-0 text-sm font-semibold text-gray-900">{campaign.paymentModel}</p>
                        <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-gray-500">
                          {campaign.bidMode}
                          <ThumbsUp className="h-3.5 w-3.5 text-gray-400" aria-hidden />
                        </span>
                      </div>

                      <div className="min-w-[6.5rem]">
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#9A41FE]">
                          <Gift className="h-4 w-4 shrink-0" aria-hidden />
                          {campaign.budgetLabel}
                        </span>
                        <p className="mt-0.5 text-xs text-gray-500">{campaign.budgetUntil}</p>
                      </div>

                      <button
                        type="button"
                        className="ml-auto inline-flex shrink-0 items-center rounded-xl bg-[#2E3038] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#23252c] sm:ml-2"
                      >
                        К кампании
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <PromoCard
                tone="purple"
                title="Бесплатный старт"
                description="Вы получили бонусы на первые кампании. Деньги спишутся с промобонусного счёта"
                icon={
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                    <path
                      d="M12 7v10M9 10.5c0-1.2 1.3-2 3-2s3 .8 3 2-1.3 2-3 2-3 .8-3 2 1.3 2 3 2"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                }
              />
              <PromoCard
                tone="white"
                title="Больше продаж"
                description="Товары поднимутся в поиске и начнут приносить заказы"
                icon={
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M4 18V6M8 18v-5M12 18V9M16 18v-7M20 18V8"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                }
              />
              <PromoCard
                tone="white"
                title="Помощь с запуском"
                description={'Нажмите «Посмотреть подсказки», чтобы настроить кампанию'}
                icon={
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M5 17l4-3 3 2 7-8"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path d="M14 8h5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                }
              />
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4 px-5 pb-4 pt-5">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex items-start gap-2.5">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#9A41FE] text-white"
                      aria-hidden
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
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
                        <path d="M12 7v15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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
                    <div className="min-w-0 pt-0.5">
                      <p className="mb-0 text-sm font-semibold leading-snug text-[#9A41FE]">
                        Оплачивайте промо-бонусами
                      </p>
                      <p className="mt-0.5 text-xs leading-snug text-gray-400">
                        На последнем шаге сможете пополнить кампанию промо-бонусами, а не деньгами
                      </p>
                    </div>
                  </div>

                  <div className="inline-flex max-w-full items-center gap-2">
                    <input
                      type="text"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      size={Math.max(campaignName.length || 1, 1)}
                      className="max-w-full border-none bg-transparent p-0 text-[22px] font-bold leading-7 tracking-[-0.02em] text-gray-900 outline-none"
                    />
                    <Edit2 className="h-[18px] w-[18px] shrink-0 text-gray-400" aria-hidden />
                  </div>
                </div>

                <button
                  type="button"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#9A41FE] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#8840e5]"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M12 14a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v4a3 3 0 0 0 3 3Z"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    />
                    <path
                      d="M6 11a6 6 0 0 0 12 0M12 17v3M9 20h6"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                  </svg>
                  Посмотреть подсказки
                </button>
              </div>

              <div className="border-t border-gray-100 px-5 py-4">
                <div className="flex flex-wrap gap-3">
                  {(
                    [
                      {
                        id: 'CPM' as const,
                        label: 'Оплата за показы (CPM)',
                        subtitle: 'Вы платите за 1 000 показов',
                      },
                      {
                        id: 'CPC' as const,
                        label: 'Оплата за клики (CPC)',
                        subtitle: 'Вы платите за 1 клик',
                      },
                    ] as const
                  ).map((option) => {
                    const selected = paymentModel === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setPaymentModel(option.id)}
                        className={`flex w-fit items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                          selected
                            ? 'border-transparent bg-[#F2F2F7]'
                            : 'border-gray-200 bg-white hover:bg-gray-50'
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
                          <span className="block text-sm font-semibold text-gray-900">{option.label}</span>
                          <span className="mt-0.5 block text-xs text-gray-500">{option.subtitle}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="mb-3 text-sm font-semibold text-gray-900">Бюджет</p>
                <div className="relative max-w-[220px]">
                  <input
                    type="text"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value.replace(/[^\d]/g, ''))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 pr-8 text-sm font-medium text-gray-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    ₽
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-500">Минимальный бюджет — 1000 ₽</p>
                <div className="mt-4 flex items-center gap-2">
                  <ToggleSwitch checked={isAutoRefillEnabled} onChange={setIsAutoRefillEnabled} />
                  <span className="text-sm font-medium text-[#6366f1]">Автопополнение бюджета</span>
                  <HelpCircle className="h-4 w-4 text-gray-400" aria-hidden />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 text-sm leading-relaxed text-gray-600 shadow-sm">
                Вы указываете сумму в рублях, а промо-бонусы спишутся, если выберете их при пополнении.
                1B = 1₽
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="mb-3 text-sm font-semibold text-gray-900">Зоны показов</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                {(
                  [
                    {
                      id: 'unified' as const,
                      title: 'Единая ставка',
                      subtitle: 'Продвижение в поиске и рекомендациях',
                    },
                    {
                      id: 'manual' as const,
                      title: 'Ручная ставка',
                      subtitle: 'Выберите зоны и ставки вручную',
                    },
                  ] as const
                ).map((option) => {
                  const selected = bidType === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setBidType(option.id)}
                      className={`flex flex-1 items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                        selected
                          ? 'border-[#9A41FE] bg-[#F6F2FF]'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
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
                      <span>
                        <span className="block text-sm font-medium text-gray-900">{option.title}</span>
                        <span className="mt-0.5 block text-xs text-gray-500">{option.subtitle}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mx-auto w-full max-w-[1200px] rounded-2xl border border-gray-100 bg-white px-5 py-0 shadow-sm">
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
                <div className="py-4">
                  <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-bold text-gray-900">
                      Товары{' '}
                      <span className="font-normal text-gray-500">{products.length} шт.</span>
                    </h2>
                    <button
                      type="button"
                      onClick={() => setIsAddProductsModalOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#F2F2F7] px-4 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-[#e8e8ed]"
                    >
                      Заменить товар
                    </button>
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {products.map((product) => {
                      const thumbSrc = resolveProductTableThumbSrc(
                        String(product.nmId),
                        product.imageUrl,
                        product.category,
                      );
                      return (
                        <li key={product.nmId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                          <img
                            src={thumbSrc}
                            alt={product.productName}
                            width={30}
                            height={38}
                            className="h-[38px] w-[30px] shrink-0 rounded-md border border-gray-100 bg-gray-50 object-cover"
                            loading="lazy"
                            onError={(e) => {
                              if (e.currentTarget.src !== PRODUCT_TABLE_THUMB_FALLBACK) {
                                e.currentTarget.src = PRODUCT_TABLE_THUMB_FALLBACK;
                              }
                            }}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">{product.productName}</p>
                            <p className="mt-0.5 truncate text-xs text-gray-500">
                              {product.brand ?? '—'} · {product.articleSeller ?? '—'} · {product.nmId}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}
      </main>

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
          const next = added.slice(0, 1);
          if (next.length === 0) return false;
          setProducts(next);
          return true;
        }}
      />
    </div>
  );
}
