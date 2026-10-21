import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X } from './Icons';
import { SEARCH_BID_FORECAST } from './SearchBidForecastField';
import { BidHistogramButton, SearchBidPositionPicker } from './SearchBidPositionPicker';
import {
  BID_CHASING_POSITION_OPTIONS,
  type BidChasingRange,
} from '../utils/cpcBidChasingPositionTiers';

function getPlural(number: number, one: string, two: string, five: string) {
  let n = Math.abs(number);
  n %= 100;
  if (n >= 5 && n <= 20) return five;
  n %= 10;
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return two;
  return five;
}

export type BulkSearchBidItem = {
  id: string;
  name: string;
  imageUrl: string;
  brand?: string;
  article: string;
  bid: number;
  /** Рекомендуемые ставки по позициям — для статуса под инпутом */
  recommendedByTier: Record<BidChasingRange, number>;
};

export type BulkSearchBidMode = 'manual' | BidChasingRange;

type BulkSearchBidModalProps = {
  isOpen: boolean;
  items: BulkSearchBidItem[];
  onClose: () => void;
  onApply: (bidsById: Record<string, number>) => void;
  title?: string;
};

const MODE_OPTIONS: {
  id: BulkSearchBidMode;
  label: string;
  dotClass?: string;
}[] = [
  { id: 'manual', label: 'Ручная' },
  { id: '11-34', label: 'за 11-34 позиции', dotClass: 'bg-[#A7E8B5]' },
  { id: '3-10', label: 'за 3-10 позиции', dotClass: 'bg-emerald-400' },
  { id: '1-2', label: 'за 1-2 позиции', dotClass: 'bg-[#9A41FE]' },
];

function formatBidInput(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '';
  return String(Math.round(value * 100) / 100);
}

function parseBidInput(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, '').replace(/₽/g, '').replace(',', '.');
  if (cleaned === '') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function resolveStatus(
  bid: number,
  recommendedByTier: Record<BidChasingRange, number>,
):
  | { kind: 'below' }
  | { kind: 'tier'; tier: BidChasingRange; filled: number; label: string } {
  const minRecommended = recommendedByTier['11-34'];
  if (!Number.isFinite(bid) || bid < minRecommended) {
    return { kind: 'below' };
  }
  if (bid >= recommendedByTier['1-2']) {
    return { kind: 'tier', tier: '1-2', ...SEARCH_BID_FORECAST['1-2'] };
  }
  if (bid >= recommendedByTier['3-10']) {
    return { kind: 'tier', tier: '3-10', ...SEARCH_BID_FORECAST['3-10'] };
  }
  return { kind: 'tier', tier: '11-34', ...SEARCH_BID_FORECAST['11-34'] };
}

/** Демо-рекомендации по позициям для товара (seed от id/артикула). */
export function buildBulkSearchRecommendedTiers(seed: number): Record<BidChasingRange, number> {
  const base = 150 + (Math.abs(seed) % 120);
  const tier1134 = Math.round(base * 0.55);
  return {
    '11-34': tier1134,
    '35-50': tier1134,
    '51-100': tier1134,
    '3-10': Math.round(base * 0.85),
    '1-2': Math.round(base * 1.25),
  };
}

function CopyArticleButton({ article }: { article: string }) {
  return (
    <button
      type="button"
      aria-label="Скопировать артикул"
      className="shrink-0 text-gray-400 transition-colors hover:text-gray-700"
      onClick={() => {
        void navigator.clipboard?.writeText(article);
      }}
    >
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    </button>
  );
}

function ProductBidRow({
  item,
  bid,
  onBidChange,
  pickerOpen,
  onTogglePicker,
  anchorRef,
}: {
  item: BulkSearchBidItem;
  bid: number;
  onBidChange: (next: number) => void;
  pickerOpen: boolean;
  onTogglePicker: () => void;
  anchorRef: (node: HTMLDivElement | null) => void;
}) {
  const [draft, setDraft] = useState(formatBidInput(bid));
  useEffect(() => {
    setDraft(formatBidInput(bid));
  }, [bid]);

  const status = resolveStatus(bid, item.recommendedByTier);
  const brandLine = [item.brand, item.article].filter(Boolean).join(' • ');

  const commit = () => {
    const parsed = parseBidInput(draft);
    if (parsed == null) {
      setDraft(formatBidInput(bid));
      return;
    }
    onBidChange(parsed);
    setDraft(formatBidInput(parsed));
  };

  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3.5 last:border-b-0">
      <div className="flex min-w-0 items-start gap-3">
        <img
          src={item.imageUrl}
          alt=""
          className="h-12 w-12 shrink-0 rounded-lg bg-gray-50 object-cover"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-950">{item.name}</p>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
            <span className="truncate">{brandLine}</span>
            <CopyArticleButton article={item.article} />
          </div>
        </div>
      </div>

      <div className="shrink-0">
        <div className="flex items-start gap-2">
          <div className="w-[140px]">
            <div className="overflow-hidden rounded-[10px] border border-[#D8D8D8] bg-white">
              <input
                type="text"
                inputMode="decimal"
                value={draft ? `${draft} ₽` : ''}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^\d.,]/g, '');
                  setDraft(raw);
                }}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
                className="box-border h-[36px] w-full bg-transparent px-2 text-center text-sm font-medium tabular-nums text-gray-900 outline-none"
              />
              {status.kind === 'tier' ? (
                <div className="flex h-[5px] gap-px">
                  {[0, 1, 2].map((index) => {
                    const active =
                      index < status.filled
                        ? status.tier === '1-2'
                          ? 'bg-[#9A41FE]'
                          : 'bg-[#60A876]'
                        : 'bg-[#E2E3E9]';
                    return <div key={index} className={`min-w-0 flex-1 ${active}`} />;
                  })}
                </div>
              ) : (
                <div className="h-[5px] bg-[#E2E3E9]" />
              )}
            </div>
            {status.kind === 'below' ? (
              <p className="mt-1 whitespace-nowrap text-center text-[11px] leading-4 text-[#76757C]">
                Ниже рекомендованной
              </p>
            ) : (
              <p className="mt-1 whitespace-nowrap text-center text-[11px] leading-4 text-[#76757C]">
                Ставка за {status.label}
              </p>
            )}
          </div>
          <div className="mt-0.5" ref={anchorRef}>
            <BidHistogramButton
              isActive={pickerOpen}
              onClick={(e) => {
                e.stopPropagation();
                onTogglePicker();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function BulkSearchBidModal({
  isOpen,
  items,
  onClose,
  onApply,
  title = 'Настройте CPC в поиске',
}: BulkSearchBidModalProps) {
  const [mode, setMode] = useState<BulkSearchBidMode>('manual');
  const [globalDraft, setGlobalDraft] = useState('');
  const [bidsById, setBidsById] = useState<Record<string, number>>({});
  const [pickerItemId, setPickerItemId] = useState<string | null>(null);
  const searchBidPickerRef = useRef<HTMLDivElement | null>(null);
  const searchBidPickerPopoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const next: Record<string, number> = {};
    for (const item of items) {
      next[item.id] = item.bid;
    }
    setBidsById(next);
    setMode('manual');
    setGlobalDraft('');
    setPickerItemId(null);
  }, [isOpen, items]);

  useEffect(() => {
    if (!pickerItemId) return;
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        searchBidPickerRef.current?.contains(target) ||
        searchBidPickerPopoverRef.current?.contains(target)
      ) {
        return;
      }
      setPickerItemId(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPickerItemId(null);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [pickerItemId]);

  const count = items.length;

  const applyGlobalValue = (value: number) => {
    setBidsById((prev) => {
      const next = { ...prev };
      for (const item of items) {
        next[item.id] = value;
      }
      return next;
    });
  };

  const applyModeToAll = (nextMode: BulkSearchBidMode) => {
    setMode(nextMode);
    if (nextMode === 'manual') return;
    setBidsById((prev) => {
      const next = { ...prev };
      for (const item of items) {
        next[item.id] = item.recommendedByTier[nextMode];
      }
      return next;
    });
    const sample = items[0]?.recommendedByTier[nextMode];
    setGlobalDraft(sample != null ? formatBidInput(sample) : '');
  };

  const commitGlobal = () => {
    const parsed = parseBidInput(globalDraft);
    if (parsed == null) return;
    setMode('manual');
    applyGlobalValue(parsed);
    setGlobalDraft(formatBidInput(parsed));
  };

  const handleApply = () => {
    onApply(bidsById);
    onClose();
  };

  const modeHint = useMemo(() => {
    if (mode === 'manual') return null;
    const opt = BID_CHASING_POSITION_OPTIONS.find((o) => o.id === mode);
    return opt?.label ?? null;
  }, [mode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/50" onClick={onClose} role="presentation">
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
            className="flex h-full w-[560px] max-w-[calc(100vw-3rem)] shrink-0 flex-col overflow-hidden bg-white shadow-2xl animate-in slide-in-from-right duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-search-bid-modal-title"
          >
            <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-6 sm:p-8">
              <h2
                id="bulk-search-bid-modal-title"
                className="text-xl font-bold leading-snug text-gray-900"
              >
                {title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Выбрано {count}{' '}
                {getPlural(count, 'товар', 'товара', 'товаров')}
              </p>

              <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
                <h3 className="text-base font-semibold text-gray-900">Общая ставка</h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">
                  {modeHint
                    ? `Для всех товаров подставлена рекомендуемая ставка за ${modeHint}`
                    : 'Значение применится ко всем выбранным товарам'}
                </p>

                <div
                  className="mt-4 flex flex-wrap gap-1 rounded-[10px] bg-white p-1"
                  role="radiogroup"
                  aria-label="Режим общей ставки"
                >
                  {MODE_OPTIONS.map((opt) => {
                    const selected = mode === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => applyModeToAll(opt.id)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all sm:text-sm ${
                          selected
                            ? 'bg-[rgba(74,74,89,0.08)] text-gray-900'
                            : 'text-[#767386] hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        {opt.dotClass ? (
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${opt.dotClass}`}
                            aria-hidden
                          />
                        ) : null}
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                <div className="relative mt-4">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={globalDraft}
                    placeholder="0"
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^\d.,]/g, '');
                      setGlobalDraft(raw);
                      setMode('manual');
                    }}
                    onBlur={commitGlobal}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitGlobal();
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-10 text-base font-medium text-gray-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    aria-label="Общая ставка"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    ₽
                  </span>
                </div>
              </div>

              <div className="mt-6">
                {items.map((item) => (
                  <ProductBidRow
                    key={item.id}
                    item={item}
                    bid={bidsById[item.id] ?? item.bid}
                    onBidChange={(next) => {
                      setMode('manual');
                      setBidsById((prev) => ({ ...prev, [item.id]: next }));
                    }}
                    pickerOpen={pickerItemId === item.id}
                    onTogglePicker={() =>
                      setPickerItemId((current) =>
                        current === item.id ? null : item.id,
                      )
                    }
                    anchorRef={(node) => {
                      if (pickerItemId === item.id) {
                        searchBidPickerRef.current = node;
                      }
                    }}
                  />
                ))}
              </div>
              {pickerItemId
                ? (() => {
                    const pickerItem = items.find((i) => i.id === pickerItemId);
                    if (!pickerItem) return null;
                    const bid = bidsById[pickerItem.id] ?? pickerItem.bid;
                    const status = resolveStatus(bid, pickerItem.recommendedByTier);
                    const selectedPosition: BidChasingRange =
                      status.kind === 'tier' ? status.tier : '3-10';
                    return (
                      <SearchBidPositionPicker
                        anchorRef={searchBidPickerRef}
                        popoverRef={searchBidPickerPopoverRef}
                        selectedPosition={selectedPosition}
                        onSelectPosition={(position) => {
                          setMode('manual');
                          setBidsById((prev) => ({
                            ...prev,
                            [pickerItem.id]:
                              pickerItem.recommendedByTier[position],
                          }));
                          setPickerItemId(null);
                        }}
                        onClose={() => setPickerItemId(null)}
                      />
                    );
                  })()
                : null}
            </div>

            <div className="flex shrink-0 flex-col gap-3 border-t border-gray-100 bg-gray-50/60 px-6 py-4 sm:px-8">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-[#F2F2F7] px-6 py-2.5 text-sm font-medium text-gray-900 hover:bg-[#e8e8ed]"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-purple-700"
                >
                  Применить
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
