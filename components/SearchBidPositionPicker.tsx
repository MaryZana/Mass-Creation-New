import React, { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BID_CHASING_POSITION_OPTIONS,
  type BidChasingRange,
} from '../utils/cpcBidChasingPositionTiers';

function formatRecommendedBidRub(value: number): string {
  return value.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatApproxDailyBudgetRub(bidRub: number, clicksPerDay: number): string {
  const total = bidRub * clicksPerDay;
  return total.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
}

function formatApproxClicksPerDay(clicks: number): string {
  return clicks.toLocaleString('ru-RU');
}

export function BidHistogramButton({
  onClick,
  isActive = false,
}: {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  isActive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 ${
        isActive ? 'bg-gray-100' : ''
      }`}
      aria-label="Выбор позиций в поиске"
      aria-expanded={isActive}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <rect x="1" y="8" width="3" height="7" rx="0.5" fill="currentColor" opacity="0.35" />
        <rect x="6.5" y="5" width="3" height="10" rx="0.5" fill="currentColor" opacity="0.6" />
        <rect x="12" y="2" width="3" height="13" rx="0.5" fill="currentColor" />
      </svg>
    </button>
  );
}

export function SearchBidPositionPicker({
  anchorRef,
  popoverRef,
  selectedPosition,
  onSelectPosition,
  onClose,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  popoverRef: React.RefObject<HTMLDivElement | null>;
  selectedPosition: BidChasingRange;
  onSelectPosition: (position: BidChasingRange) => void;
  onClose: () => void;
}) {
  const pick = (position: BidChasingRange) => {
    onSelectPosition(position);
    onClose();
  };

  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    visibility: 'hidden',
  });

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const updatePosition = () => {
      const rect = anchor.getBoundingClientRect();
      const width = Math.min(448, window.innerWidth - 16);
      const gap = 8;
      const viewportPad = 8;

      const spaceBelow = window.innerHeight - rect.bottom - gap - viewportPad;
      const spaceAbove = rect.top - gap - viewportPad;
      const placeBelow = spaceBelow >= spaceAbove;

      // Не перекрываем иконку: панель только строго под или над якорем + max-height со скроллом
      const maxHeight = Math.max(240, placeBelow ? spaceBelow : spaceAbove);
      const panel = popoverRef.current;
      const naturalHeight = panel?.scrollHeight ?? 420;
      const height = Math.min(naturalHeight, maxHeight);

      let top = placeBelow ? rect.bottom + gap : rect.top - gap - height;
      top = Math.max(viewportPad, Math.min(top, window.innerHeight - height - viewportPad));

      // Если после клампа всё ещё пересекаемся с якорем по вертикали — уводим влево от иконки
      const overlapsAnchorVertically =
        top < rect.bottom && top + height > rect.top;
      let left = rect.right - width;
      if (overlapsAnchorVertically) {
        left = rect.left - width - gap;
        if (left < viewportPad) {
          left = Math.min(rect.right + gap, window.innerWidth - width - viewportPad);
        }
      }
      left = Math.max(viewportPad, Math.min(left, window.innerWidth - width - viewportPad));

      setPanelStyle({
        position: 'fixed',
        top,
        left,
        width,
        maxHeight,
        overflowY: 'auto',
        zIndex: 200,
        visibility: 'visible',
      });
    };

    updatePosition();
    const raf = requestAnimationFrame(updatePosition);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorRef, popoverRef]);

  return createPortal(
    <div
      ref={popoverRef}
      style={panelStyle}
      className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xl"
      role="dialog"
      aria-label="Выбор позиций в поиске"
    >
      <h3 className="text-base font-bold leading-snug text-gray-900">
        Выберите позиции, которые хотите занимать в поиске
      </h3>
      <p className="mt-2 text-xs leading-relaxed text-gray-500">
        Чтобы удерживать их, установите рекомендованную ставку. Не во всех кластерах можем поставить
        вашу карточку именно в эти позиции — но в большинстве.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        {BID_CHASING_POSITION_OPTIONS.map((tier) => {
          const selected = selectedPosition === tier.id;
          const bidLabel = formatRecommendedBidRub(tier.demoBidRub);
          return (
            <div
              key={tier.id}
              className={`flex items-stretch gap-2 rounded-xl border border-gray-100 border-l-4 ${tier.accentClass} ${
                selected ? tier.selectedBgClass : 'bg-white'
              }`}
            >
              <button
                type="button"
                onClick={() => pick(tier.id)}
                className="min-w-0 flex-1 rounded-l-lg px-3 py-3 text-left transition-colors hover:bg-gray-50/80"
              >
                <span className="block text-sm font-semibold text-gray-900">{tier.label}</span>
                <span className="mt-1 block text-xs text-gray-500">
                  Рекомендуемая ставка: {bidLabel} ₽
                </span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  Клики: ~ {formatApproxClicksPerDay(tier.demoClicksPerDay)} в день
                </span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  Примерный дневной бюджет: ~{' '}
                  {formatApproxDailyBudgetRub(tier.demoBidRub, tier.demoClicksPerDay)} ₽
                </span>
              </button>
              <div className="flex shrink-0 items-center pr-2">
                <button
                  type="button"
                  onClick={() => pick(tier.id)}
                  className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium tabular-nums text-gray-900 transition-colors hover:bg-gray-200"
                >
                  {bidLabel} ₽
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>,
    document.body,
  );
}
