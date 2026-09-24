import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { resolveProductTableThumbSrc } from './SuccessPageTestData';

export type StockHoverProductItem = {
  key: string;
  name: string;
  image: string;
  category: string;
  stockLeft: number;
  stockSeed: number;
};

type ProductStockSizeRow = { label: string; qty: number };

type ProductStockBreakdown = {
  displayTotal: number;
  wb: { total: number; sizes: ProductStockSizeRow[] };
  seller: { total: number; sizes: ProductStockSizeRow[] };
};

const PRODUCT_STOCK_SIZE_PRESETS: Record<string, readonly (readonly string[])[]> = {
  Платья: [
    ['XS / 40', 'S / 44', 'M / 46', 'L / 48', 'XL / 50'],
    ['XXS / 38', 'XS / 40', 'S / 42', 'M / 44', 'L / 46', 'XL / 48'],
    ['40', '42', '44', '46', '48'],
  ],
  Футболки: [
    ['XS / 40', 'S / 44', 'M / 46', 'L / 48', 'XL / 50'],
    ['S / 44', 'M / 46', 'L / 48', 'XL / 50', 'XXL / 52'],
    ['40', '42', '44', '46'],
  ],
  Кроссовки: [
    ['36', '37', '38', '39', '40', '41', '42'],
    ['38', '39', '40', '41', '42', '43'],
    ['40', '41', '42', '43', '44'],
  ],
  Сумки: [['One size'], ['Мини', 'Средний', 'Макси']],
};

const PRODUCT_STOCK_SCROLLABLE_GRID_NM_ID = 1_001_001;

const STOCK_HOVER_THUMB_SLOTS = 5;
const STOCK_HOVER_SCROLL_BODY_MAX_PX = 400;
const STOCK_HOVER_COLUMN_HEADER_PX = 92;
const STOCK_HOVER_SIZE_ROW_PX = 26;

function buildExtendedScrollDemoSizeLabels(category: string): string[] {
  const labels: string[] = [];
  if (category === 'Платья' || category === 'Футболки') {
    for (let ru = 38; ru <= 62; ru++) {
      labels.push(`${ru} RU`);
      labels.push(`XS–${ru}`);
      if (ru % 2 === 0) labels.push(`${ru}/44`);
    }
  } else {
    for (let eu = 33; eu <= 50; eu++) {
      labels.push(`${eu}`);
      if (eu < 50) labels.push(`${eu},5`);
    }
  }
  return labels;
}

function productStockSizeLabelsForSeed(seed: number, category: string): string[] {
  if (seed === PRODUCT_STOCK_SCROLLABLE_GRID_NM_ID) {
    return buildExtendedScrollDemoSizeLabels(category);
  }
  const sized = Object.prototype.hasOwnProperty.call(PRODUCT_STOCK_SIZE_PRESETS, category);
  if (!sized) return ['Всего'];
  const presets = PRODUCT_STOCK_SIZE_PRESETS[category]!;
  return [...presets[Math.abs(seed) % presets.length]!];
}

function distributeStockAcrossSizeLabels(
  labels: string[],
  baseStock: number,
  seed: number,
): ProductStockSizeRow[] {
  if (labels.length === 1) return [{ label: labels[0]!, qty: baseStock }];
  if (baseStock === 0) return labels.map((label) => ({ label, qty: 0 }));
  const weights = labels.map((_, i) => (seed + i * 17) % 11 + 1);
  const weightSum = weights.reduce((a, b) => a + b, 0);
  let allocated = 0;
  return labels.map((label, i) => {
    const isLast = i === labels.length - 1;
    const qty = isLast
      ? Math.max(0, baseStock - allocated)
      : Math.floor((baseStock * weights[i]!) / weightSum);
    allocated += qty;
    return { label, qty };
  });
}

export function buildProductStockBreakdownValues(
  seed: number,
  category: string,
  baseStock: number,
): ProductStockBreakdown {
  const sizeLabels = productStockSizeLabelsForSeed(seed, category);
  const sized = sizeLabels.length > 1 || sizeLabels[0] !== 'Всего';

  if (baseStock <= 0) {
    const emptySizes = sized
      ? sizeLabels.map((label) => ({ label, qty: 0 }))
      : [{ label: 'Всего', qty: 0 }];
    return {
      displayTotal: 0,
      wb: { total: 0, sizes: emptySizes },
      seller: { total: 0, sizes: emptySizes },
    };
  }

  const richSizedDemo = sized && seed % 3 === 1 && sizeLabels.length >= 5;

  let wbSizes: ProductStockSizeRow[];
  if (!sized) {
    wbSizes = [{ label: 'Всего', qty: baseStock }];
  } else if (richSizedDemo) {
    const demoQtyPattern = [100_000, 0, 100, 20, 1_240, 55, 12];
    wbSizes = sizeLabels.map((label, i) => ({
      label,
      qty: demoQtyPattern[i] ?? Math.max(0, (seed + i * 13) % 400),
    }));
  } else {
    wbSizes = distributeStockAcrossSizeLabels(sizeLabels, baseStock, seed);
  }

  const wbTotal = wbSizes.reduce((sum, row) => sum + row.qty, 0);
  const sellerTotal = sized && seed % 11 === 0 ? (seed % 90) + 5 : 0;
  const sellerSizes: ProductStockSizeRow[] = sized
    ? sizeLabels.map((label, i) => ({
        label,
        qty:
          sellerTotal === 0
            ? 0
            : Math.floor((sellerTotal * ((seed + i * 3) % 7)) / Math.max(1, sizeLabels.length * 2)),
      }))
    : [{ label: 'Всего', qty: sellerTotal }];
  const sellerSum = sellerSizes.reduce((sum, row) => sum + row.qty, 0);

  return {
    displayTotal: wbTotal + sellerSum,
    wb: { total: wbTotal, sizes: wbSizes },
    seller: { total: sellerSum, sizes: sellerSizes },
  };
}

function buildBreakdownForStockItem(item: StockHoverProductItem): ProductStockBreakdown {
  return buildProductStockBreakdownValues(item.stockSeed, item.category, item.stockLeft);
}

function stockHoverScrollBodyHeightPx(items: StockHoverProductItem[]): number | null {
  if (items.length <= 1) return null;
  let maxRows = 0;
  for (const item of items) {
    const breakdown = buildBreakdownForStockItem(item);
    maxRows = Math.max(maxRows, breakdown.wb.sizes.length);
  }
  const content = STOCK_HOVER_COLUMN_HEADER_PX + maxRows * STOCK_HOVER_SIZE_ROW_PX;
  return Math.min(STOCK_HOVER_SCROLL_BODY_MAX_PX, content);
}

function ProductStockBreakdownColumn({
  title,
  total,
  sizes,
  totalClassName,
  emphasizeQty = false,
}: {
  title: string;
  total: number;
  sizes: ProductStockSizeRow[];
  totalClassName: string;
  emphasizeQty?: boolean;
}) {
  return (
    <div className="min-w-[168px] flex-1">
      <div className="text-sm leading-snug text-gray-500">{title}</div>
      <div className={`mt-1 text-[28px] font-bold leading-none tabular-nums tracking-tight ${totalClassName}`}>
        {total.toLocaleString('ru-RU')} шт
      </div>
      <div className="mt-4 flex flex-col gap-2.5">
        {sizes.map((row) => (
          <div key={row.label} className="flex items-baseline gap-2 text-sm leading-none">
            <span className="shrink-0 text-gray-600">{row.label}</span>
            <span
              className="min-h-[1px] min-w-[12px] flex-1 border-b border-dotted border-gray-300"
              aria-hidden
            />
            <span
              className={`shrink-0 tabular-nums ${
                row.qty === 0
                  ? 'text-gray-400'
                  : emphasizeQty
                    ? 'font-bold text-gray-900'
                    : 'font-medium text-gray-900'
              }`}
            >
              {row.qty.toLocaleString('ru-RU')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductStockDetailHoverCard({
  items,
  anchorRect,
  onPointerEnterCard,
  onPointerLeaveCard,
  placement = 'left',
}: {
  items: StockHoverProductItem[];
  anchorRect: DOMRect;
  onPointerEnterCard: () => void;
  onPointerLeaveCard: () => void;
  /** left — карточка слева от якоря; right — справа (для колонки товара слева) */
  placement?: 'left' | 'right';
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollPanelRef = useRef<HTMLDivElement>(null);
  const safeActiveIndex = Math.min(activeIndex, Math.max(0, items.length - 1));
  const activeItem = items[safeActiveIndex] ?? items[0];
  const breakdown = useMemo(
    () => (activeItem ? buildBreakdownForStockItem(activeItem) : null),
    [activeItem],
  );

  const multiScrollBodyHeightPx = useMemo(
    () => stockHoverScrollBodyHeightPx(items),
    [items],
  );

  useEffect(() => {
    scrollPanelRef.current?.scrollTo({ top: 0 });
  }, [safeActiveIndex]);

  const showOverflowTail = items.length > STOCK_HOVER_THUMB_SLOTS;
  const thumbSlotCount = showOverflowTail ? STOCK_HOVER_THUMB_SLOTS : items.length;
  const overflowBadge =
    showOverflowTail && items.length > STOCK_HOVER_THUMB_SLOTS
      ? items.length - STOCK_HOVER_THUMB_SLOTS
      : 0;

  const cardWidth = 440;
  const gap = 14;
  const top = anchorRect.top + anchorRect.height / 2;
  const left =
    placement === 'right' ? anchorRect.right + gap : anchorRect.left - gap;

  if (!activeItem || !breakdown) return null;

  return (
    <div
      className="pointer-events-auto fixed z-[220]"
      style={{
        top,
        left,
        transform: placement === 'right' ? 'translateY(-50%)' : 'translate(-100%, -50%)',
        width: cardWidth,
      }}
      onMouseEnter={onPointerEnterCard}
      onMouseLeave={onPointerLeaveCard}
    >
      <div className="relative" style={{ width: cardWidth }}>
        <div
          className={`pointer-events-none absolute top-1/2 z-10 h-3 w-3 -translate-y-1/2 rotate-45 border-gray-100 bg-white ${
            placement === 'right'
              ? 'left-0 -translate-x-1/2 border-b border-l'
              : 'right-0 translate-x-1/2 border-r border-t'
          }`}
          aria-hidden
        />
        <div className="overflow-hidden rounded-[20px] border border-gray-100 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.14)]">
          <div className="shrink-0 px-5 pt-4">
            <div className="mb-3 flex h-11 flex-wrap items-center gap-2">
              {Array.from({ length: thumbSlotCount }).map((_, slotIndex) => {
                const isOverflowSlot =
                  showOverflowTail && slotIndex === STOCK_HOVER_THUMB_SLOTS - 1;
                const itemIndex = slotIndex;
                const item = items[itemIndex];
                if (!item) return null;
                const thumbSrc = resolveProductTableThumbSrc(item.key, item.image, item.category);
                const selected = safeActiveIndex === itemIndex;
                return (
                  <button
                    key={`${item.key}-${slotIndex}`}
                    type="button"
                    className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border bg-gray-50 transition-shadow ${
                      selected
                        ? 'border-[#9A41FE] ring-2 ring-[#9A41FE]/35'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onMouseEnter={() => setActiveIndex(itemIndex)}
                    aria-label={item.name}
                  >
                    <img src={thumbSrc} alt="" className="h-full w-full object-cover" />
                    {isOverflowSlot && overflowBadge > 0 ? (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-semibold text-white">
                        +{overflowBadge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <p
              className="mb-0 min-h-5 truncate pb-3 text-sm font-medium leading-5 text-gray-600"
              title={activeItem.name}
            >
              {activeItem.name}
            </p>
          </div>
          <div
            ref={scrollPanelRef}
            className="overflow-y-auto overflow-x-hidden custom-scrollbar px-5 pb-4"
            style={
              multiScrollBodyHeightPx != null
                ? {
                    height: multiScrollBodyHeightPx,
                    maxHeight: STOCK_HOVER_SCROLL_BODY_MAX_PX,
                  }
                : { maxHeight: STOCK_HOVER_SCROLL_BODY_MAX_PX }
            }
          >
            <div className="flex gap-6">
              <ProductStockBreakdownColumn
                title="На складах WB"
                total={breakdown.wb.total}
                sizes={breakdown.wb.sizes}
                totalClassName="text-gray-900"
                emphasizeQty
              />
              <ProductStockBreakdownColumn
                title="На ваших складах"
                total={breakdown.seller.total}
                sizes={breakdown.seller.sizes}
                totalClassName={breakdown.seller.total === 0 ? 'text-red-500' : 'text-gray-900'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useStockRemainderHoverPortal(
  items: StockHoverProductItem[],
  placement: 'left' | 'right' = 'left',
) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncAnchorRect = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    setAnchorRect(el.getBoundingClientRect());
  }, []);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), 120);
  }, [clearCloseTimer]);

  const openHover = useCallback(() => {
    clearCloseTimer();
    syncAnchorRect();
    setOpen(true);
  }, [clearCloseTimer, syncAnchorRect]);

  useEffect(() => {
    if (!open) return;
    syncAnchorRect();
    const onScrollOrResize = () => syncAnchorRect();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open, syncAnchorRect]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  const portal =
    open && anchorRect && items.length > 0 && typeof document !== 'undefined'
      ? ReactDOM.createPortal(
          <ProductStockDetailHoverCard
            items={items}
            anchorRect={anchorRect}
            placement={placement}
            onPointerEnterCard={clearCloseTimer}
            onPointerLeaveCard={scheduleClose}
          />,
          document.body,
        )
      : null;

  return {
    anchorRef,
    openHover,
    scheduleClose,
    portal,
  };
}
