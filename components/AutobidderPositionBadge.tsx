import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check } from './Icons';
import {
  formatBidChasingPositionLabel,
  formatBidChasingPositionShortLabel,
  resolveBidChasingDemoBids,
  type BidChasingPosition,
} from '../utils/cpcBidChasingPositionTiers';

const TIP_DELAY_MS = 220;

export type AutobidderTooltipProduct = {
  name: string;
  imageUrl?: string;
  /** Если не задано — берётся position бейджа */
  position?: BidChasingPosition;
};

function TipProductRow({
  product,
  fallbackPosition,
}: {
  product: AutobidderTooltipProduct;
  fallbackPosition: BidChasingPosition;
}) {
  const position = product.position ?? fallbackPosition;
  const bids = resolveBidChasingDemoBids(position);
  const short = formatBidChasingPositionShortLabel(position);

  return (
    <div className="flex items-start gap-2.5">
      <div className="h-11 w-9 shrink-0 overflow-hidden rounded-md bg-white/10 ring-1 ring-white/15">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-white/40">
            фото
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold leading-snug text-white">{product.name}</p>
        <p className="mt-0.5 text-[12px] font-medium text-[#D8B4FE]">
          Держит {short} позиции в поиске
        </p>
        <p className="mt-0.5 text-[11px] leading-snug text-white/65">
          Ставка ~{bids.demoBidMinRub}–{bids.demoBidMaxRub} ₽ · регулирует алгоритм
        </p>
      </div>
    </div>
  );
}

export function AutobidderPositionBadge({
  position,
  products,
  variant = 'position',
  className = '',
  onClick,
}: {
  position: BidChasingPosition;
  /** Товары, на которых включён автобиддер (с фото и опционально своей позицией) */
  products?: AutobidderTooltipProduct[];
  /**
   * position — «1–2 позиции» (страница товаров)
   * enabled — «Автобиддер» + галочка (страница кампаний), в тултипе условия по товарам
   */
  variant?: 'position' | 'enabled';
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const [tip, setTip] = useState<{ left: number; top: number } | null>(null);
  const timerRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const hideTip = () => {
    clearTimer();
    setTip(null);
  };

  useEffect(() => () => clearTimer(), []);

  const positionLabel = formatBidChasingPositionLabel(position);
  const tipProducts = products?.filter((p) => p.name.trim()) ?? [];
  const tipWidthClass =
    tipProducts.length > 1 ? 'w-[20rem]' : tipProducts.length === 1 ? 'w-[18.5rem]' : 'w-[16.5rem]';
  const isEnabledVariant = variant === 'enabled';

  return (
    <>
      <button
        type="button"
        className={`inline-flex max-w-full items-center gap-1 rounded-md bg-[#F3E8FF] px-1.5 py-0.5 text-xs font-medium text-[#7C3AED] transition-colors hover:bg-[#E9D5FF] ${className}`}
        aria-label={
          isEnabledVariant ? 'Автобиддер включён' : `Автобиддер: ${positionLabel}`
        }
        onClick={(event) => {
          event.stopPropagation();
          onClick?.(event);
        }}
        onMouseEnter={(event) => {
          clearTimer();
          const rect = event.currentTarget.getBoundingClientRect();
          timerRef.current = window.setTimeout(() => {
            setTip({
              left: Math.min(
                Math.max(rect.left + rect.width / 2, 140),
                window.innerWidth - 140,
              ),
              top: rect.bottom + 8,
            });
          }, TIP_DELAY_MS);
        }}
        onMouseLeave={hideTip}
      >
        {isEnabledVariant ? (
          <>
            <Check className="h-3 w-3 shrink-0" aria-hidden />
            <span className="truncate">Автобиддер</span>
          </>
        ) : (
          <span className="truncate">{positionLabel}</span>
        )}
      </button>
      {tip
        ? createPortal(
            <div
              className={`pointer-events-none fixed z-[220] -translate-x-1/2 rounded-xl bg-gray-900 px-3 py-2.5 text-left shadow-lg ${tipWidthClass}`}
              style={{ left: tip.left, top: tip.top }}
              role="tooltip"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/55">
                {isEnabledVariant ? 'Условия автобиддера' : 'Автобиддер в поиске'}
              </p>
              {tipProducts.length > 0 ? (
                <div className="mt-2 space-y-2.5">
                  {tipProducts.map((product, index) => (
                    <TipProductRow
                      key={`${product.name}-${index}`}
                      product={product}
                      fallbackPosition={position}
                    />
                  ))}
                </div>
              ) : (
                <p className="mt-1.5 text-xs leading-snug text-white/90">
                  Держит позиции {formatBidChasingPositionShortLabel(position)}. Ставку регулирует
                  алгоритм.
                </p>
              )}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
