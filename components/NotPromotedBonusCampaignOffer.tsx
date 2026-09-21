import React, { useEffect, useState } from 'react';
import { Gift, HelpCircle, X, ChevronRight, ThumbsUp } from './Icons';

export type NotPromotedBonusCampaignProduct = {
  id: string;
  name: string;
  image: string;
  articleWb: string;
  articleSeller: string;
  bonusB?: number;
  chargeRub?: number;
  bonusEditable?: boolean;
};

const DEFAULT_BONUS_B = 5000;
const DEFAULT_ELS_CHARGE_RUB = 50;

export function notPromotedV3BonusOffer(listRowIndex: number): {
  bonusB: number;
  chargeRub: number;
  bonusEditable: boolean;
} {
  if (listRowIndex === 2) {
    return { bonusB: 5000, chargeRub: 0, bonusEditable: true };
  }
  if (listRowIndex >= 0 && listRowIndex < 3) {
    return { bonusB: 3000, chargeRub: DEFAULT_ELS_CHARGE_RUB, bonusEditable: false };
  }
  return { bonusB: DEFAULT_BONUS_B, chargeRub: DEFAULT_ELS_CHARGE_RUB, bonusEditable: false };
}

function formatGroupedAmount(value: number): string {
  return value.toLocaleString('ru-RU').replace(/\u00A0/g, ' ');
}

function isClutchBonusProduct(item: NotPromotedBonusCampaignProduct): boolean {
  return item.bonusEditable === true || item.id === 'pr19' || item.articleWb === '4004003';
}

function campaignPlural(count: number): string {
  const n = Math.abs(count) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return 'кампаний';
  if (n1 === 1) return 'кампанию';
  if (n1 >= 2 && n1 <= 4) return 'кампании';
  return 'кампаний';
}

const CornerDownRight = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    <polyline points="15 10 20 15 15 20" />
    <path d="M4 4v7a4 4 0 0 0 4 4h12" />
  </svg>
);

const CopyIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const BarChartIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    <path d="M4 20V10" />
    <path d="M10 20V4" />
    <path d="M16 20v-7" />
    <path d="M22 20V8" />
  </svg>
);

function BonusCampaignProductBidRow({
  item,
  bid,
  onBidChange,
}: {
  item: NotPromotedBonusCampaignProduct;
  bid: string;
  onBidChange: (next: string) => void;
}) {
  const sellerCode = item.articleSeller || item.articleWb;
  return (
    <div className="flex items-center justify-between gap-4 border-y border-gray-100 py-4 -mt-px first:mt-0">
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={item.image}
          alt=""
          className="h-12 w-12 shrink-0 rounded-lg bg-gray-50 object-cover"
        />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-gray-950">{item.name}</div>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
            <span className="truncate">TOPTOP • {sellerCode}</span>
            <button
              type="button"
              aria-label="Скопировать артикул"
              className="shrink-0 text-gray-400 hover:text-gray-700"
              onClick={() => {
                void navigator.clipboard?.writeText(sellerCode);
              }}
            >
              <CopyIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="inline-flex items-center justify-end gap-2">
          <input
            value={`${bid} ₽`}
            onChange={(event) => {
              onBidChange(event.target.value.replace(/[^\d]/g, ''));
            }}
            className="w-[72px] rounded-lg border border-gray-200 px-2 py-1.5 text-center text-sm text-gray-900 outline-none focus:border-purple-400"
          />
          <BarChartIcon className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
}

export function NotPromotedBonusCampaignBanner({
  onOpenCampaign,
  onDismiss,
}: {
  onOpenCampaign: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#F5F6F8] px-4 py-3">
      <div className="flex min-w-0 items-start gap-3">
        <CornerDownRight className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-950">Кампания от 26.12.2024</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-md bg-[#F3E8FF] px-2 py-0.5 text-xs font-medium text-[#7C3AED]">
              Бонусная кампания
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#9A41FE]">
              <Gift className="h-4 w-4 shrink-0" />
              5 000 B
            </span>
            <span className="text-sm text-gray-400">До 22 марта</span>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onOpenCampaign}
          className="inline-flex items-center rounded-xl bg-[#2E3038] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#23252c]"
        >
          К кампании
        </button>
        <button
          type="button"
          aria-label="Скрыть баннер"
          onClick={onDismiss}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-gray-500 shadow-sm ring-1 ring-black/[0.04] transition-colors hover:bg-gray-50 hover:text-gray-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function CampaignsListBonusBanner({
  image,
  title,
  onOpenCampaign,
  onDismiss,
}: {
  image: string;
  title: string;
  onOpenCampaign: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#F5F6F8] px-4 py-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <ChevronRight className="h-5 w-5 shrink-0 text-gray-500" />
        <div className="relative shrink-0">
          <img
            src={image}
            alt=""
            className="h-11 w-11 rounded-lg bg-gray-50 object-cover"
          />
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gray-200 px-0.5 text-[9px] font-semibold leading-none text-gray-700 ring-2 ring-[#F5F6F8]">
            +5
          </span>
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-gray-950" title={title}>
            {title}
          </div>
          <div className="mt-1.5 flex items-center gap-3">
            <span className="inline-flex rounded-md bg-[#F3E8FF] px-2 py-0.5 text-xs font-medium text-[#7C3AED]">
              Бонусная кампания
            </span>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="text-sm font-semibold leading-none text-gray-950">CPC</span>
              <span className="text-xs text-gray-500">Ручная</span>
              <ThumbsUp className="h-3.5 w-3.5 text-gray-500" />
            </div>
          </div>
        </div>
        <div className="ml-auto hidden shrink-0 pr-8 md:block">
          <div className="inline-flex items-center gap-1 text-sm font-semibold text-[#9A41FE]">
            <Gift className="h-4 w-4 shrink-0" />
            5 000 B
          </div>
          <div className="mt-1 text-xs text-gray-400">До 22 марта</div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onOpenCampaign}
          className="inline-flex items-center rounded-xl bg-[#2E3038] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#23252c]"
        >
          К кампании
        </button>
        <button
          type="button"
          aria-label="Скрыть баннер"
          onClick={onDismiss}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-gray-500 shadow-sm ring-1 ring-black/[0.04] transition-colors hover:bg-gray-50 hover:text-gray-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function NotPromotedBonusCampaignModal({
  product,
  products,
  onClose,
  onLaunch,
  showCampaignTypeTabs = false,
  onContinueWithoutBonuses,
}: {
  product?: NotPromotedBonusCampaignProduct;
  products?: NotPromotedBonusCampaignProduct[];
  onClose: () => void;
  onLaunch?: () => void;
  showCampaignTypeTabs?: boolean;
  onContinueWithoutBonuses?: () => void;
}) {
  const items =
    products && products.length > 0 ? products : product ? [product] : [];
  const [bids, setBids] = useState<Record<string, string>>(() =>
    Object.fromEntries(items.map((item) => [item.id, '10'])),
  );
  const [bonusAmounts, setBonusAmounts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      items.map((item) => [item.id, String(item.bonusB ?? DEFAULT_BONUS_B)]),
    ),
  );
  const [campaignType, setCampaignType] = useState<'CPC' | 'CPM'>('CPC');
  const [lockedBonusTipId, setLockedBonusTipId] = useState<string | null>(null);
  const isCpmBlocked = showCampaignTypeTabs && campaignType === 'CPM';

  useEffect(() => {
    if (!lockedBonusTipId) return;
    const onDoc = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-locked-bonus-tip]')) return;
      setLockedBonusTipId(null);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [lockedBonusTipId]);

  if (items.length === 0) return null;

  const isMassBonus = items.length > 1;
  const isClutchSpendLayout = items.length === 1 && isClutchBonusProduct(items[0]!);
  const clutchItem = items[0];
  const clutchBonusKey = clutchItem?.id ?? '';
  const totalChargeRub = items.reduce(
    (sum, item) => sum + (item.chargeRub ?? DEFAULT_ELS_CHARGE_RUB),
    0,
  );

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4">
      <div className="flex w-full max-w-[640px] flex-col items-center">
      <div
        className="relative w-full rounded-3xl bg-white p-8 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bonus-cpc-modal-title"
      >
        <button
          type="button"
          aria-label="Закрыть"
          className="absolute right-5 top-5 text-gray-400 transition-colors hover:text-gray-700"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </button>

        <h2 id="bonus-cpc-modal-title" className="pr-8 text-[22px] font-bold leading-snug text-gray-950">
          {isCpmBlocked ? 'Запустите кампанию' : 'Запустите бонусную кампанию CPC'}
        </h2>

        {showCampaignTypeTabs ? (
          <div
            className="mt-4 inline-flex rounded-[10px] bg-[rgba(74,74,89,0.08)] p-1 text-sm font-medium"
            role="tablist"
            aria-label="Тип кампании"
          >
            {(['CPC', 'CPM'] as const).map((type) => {
              const selected = campaignType === type;
              return (
                <button
                  key={type}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setCampaignType(type)}
                  className={`rounded-lg px-4 py-1.5 transition-all ${
                    selected
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-[#767386] hover:text-gray-900'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        ) : null}

        {isCpmBlocked ? (
          <>
            <p className="mt-6 text-sm leading-6 text-gray-700">
              Бонусы недоступны для CPM кампании
            </p>
            <div className="mt-8 flex items-center justify-end gap-3">
              <button
                type="button"
                className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-200"
                onClick={onClose}
              >
                Отмена
              </button>
              <button
                type="button"
                className="rounded-xl bg-[#9A41FE] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#8A35EE]"
                onClick={() => {
                  onContinueWithoutBonuses?.();
                  onClose();
                }}
              >
                Продолжить без бонусов
              </button>
            </div>
          </>
        ) : isClutchSpendLayout && clutchItem ? (
          <>
            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-[#F5F6F8] px-4 py-4">
              <Gift className="h-6 w-6 shrink-0 text-[#9A41FE]" />
              <p className="mb-0 min-w-0 flex-1 text-sm font-semibold leading-5 text-gray-950">
                Можно потратить до 5 000 промобонусов
              </p>
              <label className="relative w-[148px] shrink-0">
                <span className="sr-only">Сумма промобонусов</span>
                <input
                  value={formatGroupedAmount(Number(bonusAmounts[clutchBonusKey] || '0'))}
                  onChange={(event) => {
                    const digits = event.target.value.replace(/[^\d]/g, '');
                    const next = Math.min(DEFAULT_BONUS_B, Number(digits || '0'));
                    setBonusAmounts((prev) => ({ ...prev, [clutchBonusKey]: String(next) }));
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-3 pr-[72px] text-sm font-semibold tabular-nums text-gray-950 outline-none focus:border-purple-400"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                  бонусов
                </span>
              </label>
            </div>

            <div className="mt-6">
              <div className="flex items-start justify-between gap-4 text-xs text-gray-500">
                <span>Товары в кампании</span>
                <span className="inline-flex items-center gap-1">
                  Ставка за 1 клик в поиске
                  <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
                </span>
              </div>

              <div className="mt-3">
                <BonusCampaignProductBidRow
                  item={clutchItem}
                  bid={bids[clutchItem.id] ?? '10'}
                  onBidChange={(next) => {
                    setBids((prev) => ({ ...prev, [clutchItem.id]: next }));
                  }}
                />
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-3">
              <button
                type="button"
                className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-200"
                onClick={onClose}
              >
                Отмена
              </button>
              <button
                type="button"
                className="rounded-xl bg-[#9A41FE] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#8A35EE]"
                onClick={() => {
                  onLaunch?.();
                  onClose();
                }}
              >
                Запустить
              </button>
            </div>
          </>
        ) : isMassBonus ? (
          <>
        <div className="mt-5">
          <div className="grid grid-cols-[minmax(0,1fr)_9rem_6.5rem] items-start gap-4 text-xs text-gray-500">
            <span>1 товар = 1 кампания</span>
            <span className="whitespace-nowrap text-right">Пополним бонусами</span>
            <span className="inline-flex items-center justify-end gap-1 text-right">
              Ставка
              <HelpCircle className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            </span>
          </div>

          <div className="mt-3 overflow-visible">
            {items.map((item) => {
              const sellerCode = item.articleSeller || item.articleWb;
              const bid = bids[item.id] ?? '10';
              const bonusB = Number(bonusAmounts[item.id] ?? item.bonusB ?? DEFAULT_BONUS_B);
              const canEditBonus =
                item.bonusEditable === true ||
                item.id === 'pr19' ||
                item.articleWb === '4004003';
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[minmax(0,1fr)_9rem_6.5rem] items-center gap-4 border-y border-gray-100 py-4 -mt-px first:mt-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={item.image}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg bg-gray-50 object-cover"
                    />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-gray-950">{item.name}</div>
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                        <span className="truncate">TOPTOP • {sellerCode}</span>
                        <button
                          type="button"
                          aria-label="Скопировать артикул"
                          className="shrink-0 text-gray-400 hover:text-gray-700"
                          onClick={() => {
                            void navigator.clipboard?.writeText(sellerCode);
                          }}
                        >
                          <CopyIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {canEditBonus ? (
                    <div className="text-right">
                      <input
                        value={`${formatGroupedAmount(Number(bonusAmounts[item.id] || '0'))} B`}
                        onChange={(event) => {
                          const next = event.target.value.replace(/[^\d]/g, '');
                          setBonusAmounts((prev) => ({ ...prev, [item.id]: next }));
                        }}
                        className="w-[72px] rounded-lg border border-gray-200 px-2 py-1.5 text-center text-sm font-semibold text-gray-950 outline-none focus:border-purple-400"
                        aria-label="Сумма бонусов для пополнения"
                      />
                    </div>
                  ) : (
                    <div className="relative text-right" data-locked-bonus-tip>
                      <button
                        type="button"
                        className="text-sm font-semibold tabular-nums text-gray-950"
                        aria-expanded={lockedBonusTipId === item.id}
                        aria-describedby={
                          lockedBonusTipId === item.id
                            ? `locked-bonus-tip-${item.id}`
                            : undefined
                        }
                        onClick={() => {
                          setLockedBonusTipId((current) =>
                            current === item.id ? null : item.id,
                          );
                        }}
                      >
                        {formatGroupedAmount(bonusB)} B
                      </button>
                      {lockedBonusTipId === item.id ? (
                        <div
                          id={`locked-bonus-tip-${item.id}`}
                          role="tooltip"
                          className="absolute right-0 bottom-full z-20 mb-2 w-[240px] rounded-lg bg-gray-900 px-3 py-2 text-left text-xs font-normal leading-snug text-white shadow-lg"
                        >
                          В этой кампании нельзя менять кол-во бонусов, на которые
                          пополним кампанию
                        </div>
                      ) : null}
                    </div>
                  )}

                  <div className="shrink-0 text-right">
                    <div className="inline-flex items-center justify-end gap-2">
                      <input
                        value={`${bid} ₽`}
                        onChange={(event) => {
                          const next = event.target.value.replace(/[^\d]/g, '');
                          setBids((prev) => ({ ...prev, [item.id]: next }));
                        }}
                        className="w-[72px] rounded-lg border border-gray-200 px-2 py-1.5 text-center text-sm text-gray-900 outline-none focus:border-purple-400"
                      />
                      <BarChartIcon className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <p className="mb-0 text-sm text-gray-500">
            С единого счёта спишем {formatGroupedAmount(totalChargeRub)} ₽
          </p>
          <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-200"
            onClick={onClose}
          >
            Отмена
          </button>
          <button
            type="button"
            className="rounded-xl bg-[#9A41FE] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#8A35EE]"
            onClick={() => {
              onLaunch?.();
              onClose();
            }}
          >
            Запустить {items.length} {campaignPlural(items.length)}
          </button>
          </div>
        </div>
          </>
        ) : (
          <>
            <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#F5F6F8] px-4 py-4">
              <Gift className="mt-0.5 h-6 w-6 shrink-0 text-[#9A41FE]" />
              <div className="min-w-0">
                <p className="mb-0 text-sm font-semibold leading-5 text-gray-950">
                  Пополним её бюджет промобонусами на{' '}
                  {formatGroupedAmount(items[0]?.bonusB ?? DEFAULT_BONUS_B)} ₽
                </p>
                <p className="mb-0 mt-1 text-sm leading-5 text-gray-500">
                  С единого счёта спишем только{' '}
                  {formatGroupedAmount(items[0]?.chargeRub ?? DEFAULT_ELS_CHARGE_RUB)} ₽
                </p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-start justify-between gap-4 text-xs text-gray-500">
                <span>Товары в кампании</span>
                <span className="inline-flex items-center gap-1">
                  Ставка за 1 клик в поиске
                  <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
                </span>
              </div>

              <div className="mt-3">
                {items.map((item) => (
                  <BonusCampaignProductBidRow
                    key={item.id}
                    item={item}
                    bid={bids[item.id] ?? '10'}
                    onBidChange={(next) => {
                      setBids((prev) => ({ ...prev, [item.id]: next }));
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-3">
              <button
                type="button"
                className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-200"
                onClick={onClose}
              >
                Отмена
              </button>
              <button
                type="button"
                className="rounded-xl bg-[#9A41FE] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#8A35EE]"
                onClick={() => {
                  onLaunch?.();
                  onClose();
                }}
              >
                Запустить
              </button>
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
}
