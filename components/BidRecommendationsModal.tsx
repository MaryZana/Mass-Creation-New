import React, { useEffect, useMemo, useState } from 'react';
import { X } from './Icons';
import { PRODUCT_TABLE_THUMB_FALLBACK } from './SuccessPageTestData';

export type BidRecommendationZone = 'search' | 'recommendations';

export type BidRecommendationItem = {
  id: string;
  zone: BidRecommendationZone;
  title: string;
  description: string;
  suggestedBidRub: number;
  previousPerDay: number;
  currentPerDay: number;
  previousLabel?: string;
  currentLabel?: string;
};

const DEFAULT_ITEMS: BidRecommendationItem[] = [
  {
    id: 'search',
    zone: 'search',
    title: 'Увеличьте ставку в поиске',
    description: 'Кликов стало меньше на 10% за последние 2 недели',
    suggestedBidRub: 12,
    previousPerDay: 105,
    currentPerDay: 98,
  },
  {
    id: 'recommendations',
    zone: 'recommendations',
    title: 'Увеличьте ставку в рекомендациях',
    description: 'Кликов стало меньше на 10% за последние 2 недели',
    suggestedBidRub: 10,
    previousPerDay: 105,
    currentPerDay: 98,
  },
];

function formatRub(value: number) {
  return `${value.toLocaleString('ru-RU')} ₽`;
}

function SparkBars({ previous, current }: { previous: number; current: number }) {
  const max = Math.max(previous, current, 1);
  const prevH = Math.max(28, Math.round((previous / max) * 56));
  const currH = Math.max(20, Math.round((current / max) * 56));
  return (
    <div className="mt-3 flex h-14 items-end gap-2" aria-hidden>
      <div
        className="w-7 rounded-t-md bg-[#D9D0FF]"
        style={{ height: prevH }}
      />
      <div
        className="w-7 rounded-t-md bg-[#D9D0FF]"
        style={{ height: currH }}
      />
    </div>
  );
}

function RecommendationCard({
  item,
  productImage,
  productName,
  onApply,
  onHide,
}: {
  item: BidRecommendationItem;
  productImage: string;
  productName: string;
  onApply: (item: BidRecommendationItem) => void;
  onHide: (id: string) => void;
}) {
  const previousLabel = item.previousLabel ?? '2 недели назад';
  const currentLabel = item.currentLabel ?? 'Сейчас';

  return (
    <article className="rounded-2xl border border-gray-100 bg-[#F7F7F8] p-4">
      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex gap-3">
            <img
              src={productImage}
              alt=""
              className="h-[52px] w-[40px] shrink-0 rounded-lg border border-gray-100 bg-white object-cover"
              onError={(e) => {
                const img = e.currentTarget;
                if (img.src !== PRODUCT_TABLE_THUMB_FALLBACK) {
                  img.src = PRODUCT_TABLE_THUMB_FALLBACK;
                }
              }}
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold leading-snug text-gray-900">{item.title}</h3>
              <p className="mt-1 text-sm leading-snug text-gray-500">{item.description}</p>
              <span className="sr-only">{productName}</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => onApply(item)}
              className="inline-flex items-center justify-center rounded-xl bg-[#ECECEF] px-4 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-[#e2e2e6]"
            >
              Поставить {formatRub(item.suggestedBidRub)}
            </button>
            <button
              type="button"
              onClick={() => onHide(item.id)}
              className="text-sm font-semibold text-gray-700 transition-colors hover:text-gray-900"
            >
              Скрыть
            </button>
          </div>
        </div>

        <div className="hidden w-[148px] shrink-0 rounded-xl bg-white/80 px-3 py-3 sm:block">
          <div className="space-y-2">
            <div>
              <p className="text-[11px] leading-none text-gray-500">{previousLabel}</p>
              <p className="mt-1 text-sm font-semibold tabular-nums text-gray-900">
                {item.previousPerDay} в дн
              </p>
            </div>
            <div>
              <p className="text-[11px] leading-none text-gray-500">{currentLabel}</p>
              <p className="mt-1 text-sm font-semibold tabular-nums text-gray-900">
                {item.currentPerDay} в дн
              </p>
            </div>
          </div>
          <SparkBars previous={item.previousPerDay} current={item.currentPerDay} />
        </div>
      </div>
    </article>
  );
}

export function BidRecommendationsModal({
  isOpen,
  onClose,
  productName,
  productImage,
  items = DEFAULT_ITEMS,
  onApplyBid,
}: {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  productImage: string;
  items?: BidRecommendationItem[];
  onApplyBid: (item: BidRecommendationItem) => void;
}) {
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen) return;
    setHiddenIds(new Set());
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  const visibleItems = useMemo(
    () => items.filter((item) => !hiddenIds.has(item.id)),
    [items, hiddenIds],
  );

  useEffect(() => {
    if (!isOpen) return;
    if (visibleItems.length === 0) onClose();
  }, [isOpen, visibleItems.length, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-black/50" onClick={onClose} role="presentation">
      <div className="flex h-full w-full justify-end" onClick={onClose}>
        <div
          className="flex h-full max-h-full min-w-0 items-stretch gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 flex-col justify-start pt-5 pl-3">
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-500 shadow-md hover:bg-gray-50 hover:text-gray-700"
              aria-label="Закрыть"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            className="flex h-full w-[720px] max-w-[calc(100vw-3rem)] shrink-0 flex-col overflow-hidden rounded-l-[28px] bg-white shadow-2xl animate-in slide-in-from-right duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bid-recommendations-title"
          >
            <div className="shrink-0 px-6 pt-7 pb-4 sm:px-8">
              <h2
                id="bid-recommendations-title"
                className="text-2xl font-bold leading-snug text-gray-900"
              >
                Рекомендации
              </h2>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8 sm:px-8">
              <div className="flex flex-col gap-4">
                {visibleItems.map((item) => (
                  <RecommendationCard
                    key={item.id}
                    item={item}
                    productImage={productImage}
                    productName={productName}
                    onApply={(applied) => {
                      onApplyBid(applied);
                      setHiddenIds((prev) => {
                        const next = new Set(prev);
                        next.add(applied.id);
                        return next;
                      });
                    }}
                    onHide={(id) =>
                      setHiddenIds((prev) => {
                        const next = new Set(prev);
                        next.add(id);
                        return next;
                      })
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
