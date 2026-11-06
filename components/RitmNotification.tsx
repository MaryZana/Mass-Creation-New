import React, { useEffect } from 'react';
import { Check, X } from './Icons';

type RitmNotificationTone = 'success' | 'error';

type RitmNotificationProps = {
  message: string;
  onClose: () => void;
  tone?: RitmNotificationTone;
  /** Автозакрытие, мс; 0 — без автозакрытия */
  durationMs?: number;
};

/**
 * RITM-like snackbar/notification: белая карточка, цветная обводка и иконка.
 * По умолчанию справа сверху.
 */
export function RitmNotification({
  message,
  onClose,
  tone = 'success',
  durationMs = 4000,
}: RitmNotificationProps) {
  useEffect(() => {
    if (!durationMs) return;
    const timer = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, message, onClose]);

  const isError = tone === 'error';
  const borderClass = isError ? 'border-red-500' : 'border-green-500';
  const iconBgClass = isError ? 'bg-red-500' : 'bg-green-500';

  return (
    <div
      role="status"
      className="fixed right-8 top-20 z-[120] w-[min(100vw-2rem,22rem)] animate-in fade-in slide-in-from-right-4 duration-300"
    >
      <div className={`relative rounded-xl border bg-white p-4 shadow-lg ${borderClass}`}>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-0.5 text-gray-900 hover:bg-gray-100"
          aria-label="Закрыть"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3 pr-6">
          <div
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconBgClass}`}
            aria-hidden
          >
            {isError ? <X className="h-4 w-4 text-white" /> : <Check className="h-4 w-4 text-white" />}
          </div>
          <p className="mb-0 min-w-0 pt-1 text-sm font-medium leading-snug text-gray-900">{message}</p>
        </div>
      </div>
    </div>
  );
}
