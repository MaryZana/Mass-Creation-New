import React, { useState } from 'react';
import { Gift, HelpCircle, X, ChevronRight, ThumbsUp } from './Icons';

export type NotPromotedBonusCampaignProduct = {
  id: string;
  name: string;
  image: string;
  articleWb: string;
  articleSeller: string;
};

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
  const [campaignType, setCampaignType] = useState<'CPC' | 'CPM'>('CPC');
  const isCpmBlocked = showCampaignTypeTabs && campaignType === 'CPM';

  if (items.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4">
      <div
        className="relative w-full max-w-[640px] rounded-3xl bg-white p-8 shadow-2xl"
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
        ) : (
          <>
        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#F5F6F8] px-4 py-4">
          <Gift className="mt-0.5 h-6 w-6 shrink-0 text-[#9A41FE]" />
          <div>
            <p className="text-sm font-semibold leading-5 text-gray-950">
              Пополним её бюджет промобонусами на 5 000 ₽
            </p>
            <p className="mt-1 text-sm text-gray-500">С единого счёта спишем только 50 ₽</p>
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

          <div className="mt-3 max-h-[40vh] overflow-y-auto">
            {items.map((item) => {
              const sellerCode = item.articleSeller || item.articleWb;
              const bid = bids[item.id] ?? '10';
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 border-y border-gray-100 py-4 -mt-px first:mt-0"
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

                  <div className="shrink-0 text-right">
                    <div className="inline-flex items-center gap-2">
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
                    <div className="mt-2 flex items-center justify-end gap-2">
                      <div className="h-1.5 w-[72px] overflow-hidden rounded-full bg-gray-200">
                        <div className="h-full w-[28%] rounded-full bg-emerald-400" />
                      </div>
                      <span className="text-[11px] text-gray-500">Ставка за 11-34</span>
                    </div>
                  </div>
                </div>
              );
            })}
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
  );
}
