import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw, X } from './Icons';
import {
  SearchBidForecastField,
  bidForCpcBarSegment,
  bidForCpmBarSegment,
  CPM_DEFAULT_COMPETITIVE_BID_RUB,
  normalizeCpcSearchBidRubOnBlur,
  parseSearchBidRubInput,
  resolveCpcSearchBidStatus,
  resolveCpmBidStatus,
  type RichBidSegmentIndex,
} from './SearchBidForecastField';
import { SearchBidPositionPicker } from './SearchBidPositionPicker';
import {
  BID_CHASING_POSITION_OPTIONS,
  bidChasingPositionOption,
  formatBidChasingPositionShortLabel,
  presetBidChasingPosition,
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

/** Как в списке массового создания: CPC-позиции / CPM-бары / простой инпут */
export type BulkSearchBidControls = 'cpc-positions' | 'cpm' | 'simple';

type BulkSearchBidModalProps = {
  isOpen: boolean;
  items: BulkSearchBidItem[];
  onClose: () => void;
  onApply: (bidsById: Record<string, number>) => void;
  title?: string;
  controls?: BulkSearchBidControls;
};

const MODE_CHIP_BASE =
  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all sm:text-sm';
const MODE_CHIP_SELECTED = 'bg-black text-white';
const MODE_CHIP_IDLE =
  'bg-[rgba(74,74,89,0.08)] text-black hover:bg-[rgba(74,74,89,0.12)]';

const CPM_PRESET_CHIPS: { id: 0 | 1 | 2; label: string; toneClass: string }[] = [
  { id: 0, label: 'Конкурентная', toneClass: 'bg-[#60A876]' },
  { id: 1, label: 'Лидерская', toneClass: 'bg-[#2EC4B6]' },
  { id: 2, label: 'Топ-позиция', toneClass: 'bg-[#9A41FE]' },
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

function sameBidNumberRecord(
  a: Record<string, number>,
  b: Record<string, number>,
): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => a[key] === b[key]);
}

function sharedCpcBidForItem(
  item: BulkSearchBidItem,
  range: BidChasingRange,
): number {
  const recommended = item.recommendedByTier[range];
  if (Number.isFinite(recommended) && recommended > 0) return recommended;
  return bidChasingPositionOption(range).demoBidRub;
}

type BulkSearchBidFormBaseline = {
  mode: BulkSearchBidMode;
  cpmPreset: 0 | 1 | 2 | 'manual';
  bidsById: Record<string, number>;
  globalDraft: string;
};

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

type ProductBidRowProps = {
  key?: React.Key;
  item: BulkSearchBidItem;
  bid: number;
  onBidChange: (next: number) => void;
  pickerOpen: boolean;
  onTogglePicker: () => void;
  anchorRef: React.Ref<HTMLDivElement>;
  controls: BulkSearchBidControls;
};

function ProductBidRow({
  item,
  bid,
  onBidChange,
  pickerOpen,
  onTogglePicker,
  anchorRef,
  controls,
}: ProductBidRowProps): React.ReactElement {
  const brandLine = [item.brand, item.article].filter(Boolean).join(' • ');
  const bidStatus =
    controls === 'cpm'
      ? resolveCpmBidStatus(bid, CPM_DEFAULT_COMPETITIVE_BID_RUB)
      : resolveCpcSearchBidStatus(bid);
  const [simpleDraft, setSimpleDraft] = useState(String(bid));
  const [simpleFocused, setSimpleFocused] = useState(false);

  useEffect(() => {
    if (simpleFocused) return;
    setSimpleDraft(String(bid));
  }, [bid, simpleFocused]);

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

      <div className="shrink-0" ref={anchorRef}>
        {controls === 'simple' ? (
          <div className="relative w-[140px] overflow-hidden rounded-[10px] border border-transparent bg-[#F2F2F7] transition-colors hover:bg-[#EBEBF0] focus-within:border-black focus-within:bg-white">
            <input
              type="text"
              inputMode="decimal"
              value={simpleDraft}
              onChange={(e) => setSimpleDraft(e.target.value)}
              onFocus={() => setSimpleFocused(true)}
              onBlur={() => {
                setSimpleFocused(false);
                const next = normalizeCpcSearchBidRubOnBlur(simpleDraft);
                setSimpleDraft(String(next));
                onBidChange(next);
              }}
              className="box-border h-9 w-full bg-transparent px-2.5 pr-7 text-sm font-medium tabular-nums text-gray-900 outline-none"
              aria-label={`Ставка для ${item.name}`}
            />
            <span
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm font-medium text-[#A0A0AB]"
              aria-hidden
            >
              ₽
            </span>
          </div>
        ) : (
          <SearchBidForecastField
            value={String(bid)}
            disabled={false}
            readOnly={false}
            status={bidStatus}
            segmentMode={controls === 'cpm' ? 'cpm' : 'cpc'}
            showBarsButton={controls === 'cpc-positions'}
            barsActive={pickerOpen}
            onBarsClick={controls === 'cpc-positions' ? onTogglePicker : undefined}
            onSegmentSelect={(segment: RichBidSegmentIndex) => {
              if (controls === 'cpm') {
                onBidChange(bidForCpmBarSegment(segment).bid);
                return;
              }
              onBidChange(bidForCpcBarSegment(segment).bid);
            }}
            onChange={(raw) => {
              const parsed = parseSearchBidRubInput(raw);
              if (parsed != null) onBidChange(parsed);
            }}
          />
        )}
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
  controls = 'cpc-positions',
}: BulkSearchBidModalProps) {
  const showCpcPositionChips = controls === 'cpc-positions';
  const showCpmPresetChips = controls === 'cpm';
  const [mode, setMode] = useState<BulkSearchBidMode>('manual');
  const [cpmPreset, setCpmPreset] = useState<0 | 1 | 2 | 'manual'>('manual');
  const [globalDraft, setGlobalDraft] = useState('');
  const [bidsById, setBidsById] = useState<Record<string, number>>({});
  const [pickerItemId, setPickerItemId] = useState<string | null>(null);
  const [formBaseline, setFormBaseline] = useState<BulkSearchBidFormBaseline | null>(
    null,
  );
  const searchBidPickerRef = useRef<HTMLDivElement | null>(null);
  const searchBidPickerPopoverRef = useRef<HTMLDivElement | null>(null);
  /** Ручные ставки — не затираем при переключении на общую позицию / CPM-пресет */
  const manualSnapshotRef = useRef<{
    bidsById: Record<string, number>;
    globalDraft: string;
  } | null>(null);
  const itemsKey = items.map((item) => item.id).join('|');

  // Подтягиваем актуальное состояние из списка при открытии
  useEffect(() => {
    if (!isOpen) return;
    const next: Record<string, number> = {};
    for (const item of items) {
      next[item.id] = item.bid;
    }
    setBidsById(next);
    setMode('manual');
    setCpmPreset('manual');
    const firstBid = items[0]?.bid;
    const allSame =
      items.length > 0 &&
      firstBid != null &&
      items.every((item) => item.bid === firstBid);
    const nextGlobalDraft = allSame ? formatBidInput(firstBid) : '';
    setGlobalDraft(nextGlobalDraft);
    setPickerItemId(null);
    manualSnapshotRef.current = {
      bidsById: { ...next },
      globalDraft: nextGlobalDraft,
    };
    setFormBaseline({
      mode: 'manual',
      cpmPreset: 'manual',
      bidsById: { ...next },
      globalDraft: nextGlobalDraft,
    });
    // items — снимок на открытие / смену состава
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, controls, title, itemsKey]);

  useEffect(() => {
    if (!isOpen) return;
    if (mode !== 'manual' || cpmPreset !== 'manual') return;
    manualSnapshotRef.current = {
      bidsById: { ...bidsById },
      globalDraft,
    };
  }, [isOpen, mode, cpmPreset, bidsById, globalDraft]);

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
  const isSharedCpc = showCpcPositionChips && mode !== 'manual';
  const isSharedCpm = showCpmPresetChips && cpmPreset !== 'manual';
  const isSharedAssignment = isSharedCpc || isSharedCpm;

  const displayBidForItem = (item: BulkSearchBidItem): number => {
    if (isSharedCpc) {
      return sharedCpcBidForItem(item, mode);
    }
    if (isSharedCpm && cpmPreset !== 'manual') {
      return bidForCpmBarSegment(cpmPreset).bid;
    }
    return bidsById[item.id] ?? item.bid;
  };

  const captureManualSnapshot = () => {
    manualSnapshotRef.current = {
      bidsById: { ...bidsById },
      globalDraft,
    };
  };

  const restoreManualSnapshot = () => {
    const snapshot = manualSnapshotRef.current;
    if (!snapshot) return;
    setBidsById({ ...snapshot.bidsById });
    setGlobalDraft(snapshot.globalDraft);
  };

  const freezeSharedIntoManual = (override?: {
    itemId: string;
    bid: number;
  }) => {
    const frozen: Record<string, number> = {};
    for (const item of items) {
      frozen[item.id] = displayBidForItem(item);
    }
    if (override) {
      frozen[override.itemId] = override.bid;
    }
    setBidsById(frozen);
    const first = frozen[items[0]?.id ?? ''];
    const allSame =
      items.length > 0 &&
      first != null &&
      items.every((item) => frozen[item.id] === first);
    const nextGlobal = allSame && first != null ? formatBidInput(first) : '';
    setGlobalDraft(nextGlobal);
    manualSnapshotRef.current = {
      bidsById: { ...frozen },
      globalDraft: nextGlobal,
    };
    setMode('manual');
    setCpmPreset('manual');
  };

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
    if (nextMode === 'manual') {
      setMode('manual');
      setCpmPreset('manual');
      restoreManualSnapshot();
      return;
    }
    if (mode === 'manual' && cpmPreset === 'manual') {
      captureManualSnapshot();
    }
    setMode(nextMode);
    setCpmPreset('manual');
    const firstShared = items[0]
      ? sharedCpcBidForItem(items[0], nextMode)
      : bidChasingPositionOption(nextMode).demoBidRub;
    const allSame =
      items.length > 0 &&
      items.every((item) => sharedCpcBidForItem(item, nextMode) === firstShared);
    setGlobalDraft(allSame ? formatBidInput(firstShared) : '');
  };

  const applyCpmPresetToAll = (segment: 0 | 1 | 2) => {
    if (mode === 'manual' && cpmPreset === 'manual') {
      captureManualSnapshot();
    }
    setCpmPreset(segment);
    setMode('manual');
    const demoBid = bidForCpmBarSegment(segment).bid;
    setGlobalDraft(formatBidInput(demoBid));
  };

  const selectCpmManual = () => {
    setCpmPreset('manual');
    setMode('manual');
    restoreManualSnapshot();
  };

  const parsedGlobalBid = parseBidInput(globalDraft);
  const showGlobalBidActions =
    globalDraft.trim() !== '' &&
    parsedGlobalBid != null &&
    parsedGlobalBid > 0;

  /** Только нормализует черновик — ставки в строках меняются только по ссылкам ниже. */
  const normalizeGlobalDraft = () => {
    if (globalDraft.trim() === '') return;
    if (showCpcPositionChips || controls === 'simple') {
      setGlobalDraft(formatBidInput(normalizeCpcSearchBidRubOnBlur(globalDraft)));
      return;
    }
    const parsed = parseBidInput(globalDraft);
    if (parsed == null) return;
    setGlobalDraft(formatBidInput(parsed));
  };

  const ensureManualBeforeGlobalEdit = () => {
    if (!isSharedAssignment) {
      setMode('manual');
      setCpmPreset('manual');
      return;
    }
    freezeSharedIntoManual();
  };

  const replaceAllBids = () => {
    if (!showGlobalBidActions || parsedGlobalBid == null) return;
    if (isSharedAssignment) {
      freezeSharedIntoManual();
    }
    setMode('manual');
    setCpmPreset('manual');
    const nextBid =
      showCpcPositionChips || controls === 'simple'
        ? normalizeCpcSearchBidRubOnBlur(parsedGlobalBid)
        : parsedGlobalBid;
    applyGlobalValue(nextBid);
    setGlobalDraft(formatBidInput(nextBid));
  };

  const addGlobalBidToAll = () => {
    if (!showGlobalBidActions || parsedGlobalBid == null) return;
    const baseBids: Record<string, number> = {};
    for (const item of items) {
      baseBids[item.id] = displayBidForItem(item);
    }
    const next: Record<string, number> = {};
    for (const item of items) {
      const current = baseBids[item.id] ?? item.bid;
      const base = Number.isFinite(current) ? current : 0;
      next[item.id] = Math.round((base + parsedGlobalBid) * 100) / 100;
    }
    setBidsById(next);
    setMode('manual');
    setCpmPreset('manual');
    manualSnapshotRef.current = {
      bidsById: { ...next },
      globalDraft,
    };
  };

  const handleRowBidChange = (itemId: string, nextBid: number) => {
    if (isSharedAssignment) {
      freezeSharedIntoManual({ itemId, bid: nextBid });
      return;
    }
    setMode('manual');
    setCpmPreset('manual');
    setBidsById((prev) => ({ ...prev, [itemId]: nextBid }));
  };

  const restoreOriginalSettings = () => {
    if (!formBaseline) return;
    setMode(formBaseline.mode);
    setCpmPreset(formBaseline.cpmPreset);
    setBidsById({ ...formBaseline.bidsById });
    setGlobalDraft(formBaseline.globalDraft);
    setPickerItemId(null);
    manualSnapshotRef.current = {
      bidsById: { ...formBaseline.bidsById },
      globalDraft: formBaseline.globalDraft,
    };
  };

  const formIsDirty =
    formBaseline != null &&
    (mode !== formBaseline.mode ||
      cpmPreset !== formBaseline.cpmPreset ||
      globalDraft !== formBaseline.globalDraft ||
      !sameBidNumberRecord(bidsById, formBaseline.bidsById));
  const showRestoreOriginalSettings = formIsDirty;

  const handleApply = () => {
    if (isSharedAssignment) {
      const next: Record<string, number> = {};
      for (const item of items) {
        next[item.id] = displayBidForItem(item);
      }
      onApply(next);
    } else {
      onApply(bidsById);
    }
    onClose();
  };

  const modeHint = useMemo(() => {
    if (mode === 'manual') return null;
    return formatBidChasingPositionShortLabel(presetBidChasingPosition(mode));
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
            className="flex h-full w-[720px] max-w-[calc(100vw-3rem)] shrink-0 flex-col overflow-hidden rounded-l-[28px] bg-white shadow-2xl animate-in slide-in-from-right duration-300"
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

              <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5">
                <h3 className="text-base font-semibold text-gray-900">Общая ставка</h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">
                  {showCpcPositionChips && modeHint
                    ? `Для всех товаров подставлена рекомендуемая ставка за ${modeHint}`
                    : 'Чтобы применить значение ко всем товарам, нажмите действие ниже'}
                </p>

                {showCpcPositionChips ? (
                  <div
                    className="mt-4 flex flex-wrap gap-1 rounded-[10px] bg-white p-1"
                    role="tablist"
                    aria-label="Позиции в поиске"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={mode === 'manual'}
                      onClick={() => applyModeToAll('manual')}
                      className={`${MODE_CHIP_BASE} ${
                        mode === 'manual' ? MODE_CHIP_SELECTED : MODE_CHIP_IDLE
                      }`}
                    >
                      Ручная
                    </button>
                    {BID_CHASING_POSITION_OPTIONS.map((opt) => {
                      const selected = mode === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          role="tab"
                          aria-selected={selected}
                          onClick={() => applyModeToAll(opt.id)}
                          className={`${MODE_CHIP_BASE} ${
                            selected ? MODE_CHIP_SELECTED : MODE_CHIP_IDLE
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${opt.segmentActiveClass}`}
                            aria-hidden
                          />
                          {formatBidChasingPositionShortLabel(
                            presetBidChasingPosition(opt.id),
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {showCpmPresetChips ? (
                  <div
                    className="mt-4 flex flex-wrap gap-1 rounded-[10px] bg-white p-1"
                    role="tablist"
                    aria-label="Уровень ставки CPM"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={cpmPreset === 'manual'}
                      onClick={selectCpmManual}
                      className={`${MODE_CHIP_BASE} ${
                        cpmPreset === 'manual' ? MODE_CHIP_SELECTED : MODE_CHIP_IDLE
                      }`}
                    >
                      Ручная
                    </button>
                    {CPM_PRESET_CHIPS.map((opt) => {
                      const selected = cpmPreset === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          role="tab"
                          aria-selected={selected}
                          onClick={() => applyCpmPresetToAll(opt.id)}
                          className={`${MODE_CHIP_BASE} ${
                            selected ? MODE_CHIP_SELECTED : MODE_CHIP_IDLE
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${opt.toneClass}`}
                            aria-hidden
                          />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                <div
                  className={`relative ${
                    showCpcPositionChips || showCpmPresetChips ? 'mt-5' : 'mt-4'
                  }`}
                >
                  <input
                    type="text"
                    inputMode="decimal"
                    value={globalDraft}
                    placeholder="0"
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^\d.,]/g, '');
                      ensureManualBeforeGlobalEdit();
                      setGlobalDraft(raw);
                    }}
                    onBlur={normalizeGlobalDraft}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        normalizeGlobalDraft();
                      }
                    }}
                    className="w-full rounded-full bg-[#F3F4F6] px-4 py-3 pr-[4.25rem] text-base tabular-nums text-gray-900 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500/30"
                    aria-label="Общая ставка"
                  />
                  <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
                    <span className="pointer-events-none text-gray-400" aria-hidden>
                      ₽
                    </span>
                    {globalDraft !== '' ? (
                      <button
                        type="button"
                        aria-label="Очистить"
                        onClick={() => {
                          ensureManualBeforeGlobalEdit();
                          setGlobalDraft('');
                        }}
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black text-white transition-opacity hover:opacity-80"
                      >
                        <X className="h-3 w-3" aria-hidden />
                      </button>
                    ) : null}
                  </div>
                </div>
                {showGlobalBidActions ? (
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1">
                    <button
                      type="button"
                      onClick={replaceAllBids}
                      className="text-sm font-medium text-gray-900 transition-colors hover:text-black"
                    >
                      Заменить все ставки
                    </button>
                    <button
                      type="button"
                      onClick={addGlobalBidToAll}
                      className="text-sm font-medium text-gray-900 transition-colors hover:text-black"
                    >
                      Прибавить ко всем
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="mt-6">
                {items.map((item) => {
                  const rowBid = displayBidForItem(item);
                  return (
                    <ProductBidRow
                      key={item.id}
                      item={item}
                      bid={rowBid}
                      controls={controls}
                      onBidChange={(next) => handleRowBidChange(item.id, next)}
                      pickerOpen={showCpcPositionChips && pickerItemId === item.id}
                      onTogglePicker={() => {
                        if (!showCpcPositionChips) return;
                        setPickerItemId((current) =>
                          current === item.id ? null : item.id,
                        );
                      }}
                      anchorRef={(node: HTMLDivElement | null) => {
                        if (pickerItemId === item.id) {
                          searchBidPickerRef.current = node;
                        }
                      }}
                    />
                  );
                })}
              </div>
              {showCpcPositionChips && pickerItemId
                ? (() => {
                    const pickerItem = items.find((i) => i.id === pickerItemId);
                    if (!pickerItem) return null;
                    const bid = displayBidForItem(pickerItem);
                    const visual = resolveCpcSearchBidStatus(bid);
                    const selectedPosition: BidChasingRange =
                      visual.kind === 'tier'
                        ? visual.filled === 3
                          ? '1-2'
                          : visual.filled === 2
                            ? '3-10'
                            : '11-34'
                        : '11-34';
                    return (
                      <SearchBidPositionPicker
                        anchorRef={searchBidPickerRef}
                        popoverRef={searchBidPickerPopoverRef}
                        selectedPosition={selectedPosition}
                        onSelectPosition={(position) => {
                          const nextBid =
                            pickerItem.recommendedByTier[position] ??
                            bidChasingPositionOption(position).demoBidRub;
                          handleRowBidChange(pickerItem.id, nextBid);
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
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl bg-[#F2F2F7] px-6 py-2.5 text-sm font-medium text-gray-900 hover:bg-[#e8e8ed]"
                  >
                    Отмена
                  </button>
                  {showRestoreOriginalSettings ? (
                    <button
                      type="button"
                      onClick={restoreOriginalSettings}
                      className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-[#F2F2F7] hover:text-gray-700"
                    >
                      <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
                      Вернуть исходные настройки
                    </button>
                  ) : null}
                </div>
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
