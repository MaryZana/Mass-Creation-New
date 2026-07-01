import React, { useState } from 'react';
import { AlertCircle } from './Icons';

function formatLimitRub(value: number): string {
  return `${Math.round(value).toLocaleString('ru-RU')} ₽`;
}

export const DailyLimitBidMismatchHint: React.FC<{
  recommendedDailyLimitRub: number;
  className?: string;
}> = ({ recommendedDailyLimitRub, className = '' }) => {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className={`relative inline-flex shrink-0 ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <AlertCircle
        className="h-4 w-4 cursor-help text-red-500"
        aria-label="Дневной лимит может быть недостаточен для текущей ставки"
      />
      {visible ? (
        <>
          <span className="absolute left-1/2 top-full h-2 w-64 -translate-x-1/2" aria-hidden />
          <span
            role="tooltip"
            className="absolute left-1/2 top-full z-50 mt-2 w-[min(280px,calc(100vw-24px))] -translate-x-1/2 rounded-lg bg-gray-900 p-3 text-left text-xs leading-snug text-white shadow-lg"
          >
            При текущей ставке кампания может работать некорректно или возможны перекруты. Чтобы
            этого не было, установите дневной лимит не ниже {formatLimitRub(recommendedDailyLimitRub)}.
          </span>
        </>
      ) : null}
    </span>
  );
};
