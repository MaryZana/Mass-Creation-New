import React, { useState } from 'react';
import { AlertCircle } from './Icons';

function formatLimitRub(value: number): string {
  return `${Math.round(value).toLocaleString('ru-RU')} ₽`;
}

export const DailyLimitBidMismatchHint: React.FC<{
  recommendedDailyLimitRub: number;
  className?: string;
  tooltipAlign?: 'center' | 'start';
  onVisibilityChange?: (visible: boolean) => void;
}> = ({
  recommendedDailyLimitRub,
  className = '',
  tooltipAlign = 'center',
  onVisibilityChange,
}) => {
  const [visible, setVisible] = useState(false);
  const tooltipPositionClass =
    tooltipAlign === 'start'
      ? 'left-0 translate-x-0'
      : 'left-1/2 -translate-x-1/2';
  const bridgePositionClass =
    tooltipAlign === 'start' ? 'left-0 w-64' : 'left-1/2 w-64 -translate-x-1/2';

  const show = (next: boolean) => {
    setVisible(next);
    onVisibilityChange?.(next);
  };

  return (
    <span
      className={`relative inline-flex shrink-0 ${className}`}
      onMouseEnter={(e) => {
        e.stopPropagation();
        show(true);
      }}
      onMouseLeave={(e) => {
        e.stopPropagation();
        show(false);
      }}
    >
      <AlertCircle
        className="h-4 w-4 cursor-help text-red-500"
        aria-label="Дневной лимит может быть недостаточен для текущей ставки"
      />
      {visible ? (
        <>
          <span className={`absolute top-full h-2 ${bridgePositionClass}`} aria-hidden />
          <span
            role="tooltip"
            className={`absolute top-full z-50 mt-2 w-[min(280px,calc(100vw-24px))] rounded-lg bg-gray-900 p-3 text-left text-xs leading-snug text-white shadow-lg ${tooltipPositionClass}`}
          >
            При текущей ставке кампания может работать некорректно или возможны перекруты. Чтобы
            этого не было, установите дневной лимит не ниже {formatLimitRub(recommendedDailyLimitRub)}.
          </span>
        </>
      ) : null}
    </span>
  );
};
