import React, { useState } from 'react';
import { HelpCircle } from './Icons';

export const DailyLimitInfoTooltip: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <HelpCircle className="h-4 w-4 cursor-help text-gray-600" />
      {isVisible && (
        <>
          <div
            className="absolute left-1/2 top-full h-2 w-80 -translate-x-1/2"
            onMouseEnter={() => setIsVisible(true)}
          />
          <div
            className="absolute left-1/2 top-full z-50 mt-2 w-80 -translate-x-1/2 rounded-lg bg-gray-900 p-3 text-left text-xs text-white shadow-lg"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
          >
            <p className="mb-2 font-semibold">Как работает дневной лимит?</p>
            <p className="mb-2">Минимальная сумма лимита зависит от ставки.</p>
            <p className="mb-2">
              Обычно лимит равномерно тратится в течение дня. Он может закончиться быстрее, если
              товаром интересуется много покупателей.
            </p>
            <p className="mb-0">
              Лимит это максимальная сумма, которую спишем за 24 часа — с 00:00 до 23:59 мск.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
