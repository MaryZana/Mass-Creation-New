import React, { useCallback, useEffect, useState } from 'react';
import { Check, X } from './Icons';
import { CPM_BID_STEP_RUB, formatCpmBidRoundedRub } from '../utils/cpmBidRounding';

export function CpmBidRoundedAlert({
  roundedRub,
  onClose,
}: {
  roundedRub: number;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 6000);
    return () => window.clearTimeout(timer);
  }, [onClose, roundedRub]);

  const formatted = formatCpmBidRoundedRub(roundedRub);

  return (
    <div
      role="status"
      className="fixed left-1/2 top-20 z-[120] w-[min(100vw-2rem,22rem)] -translate-x-1/2 animate-in fade-in slide-in-from-top-4 duration-300"
    >
      <div className="relative rounded-xl border border-green-500 bg-white p-4 shadow-lg">
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
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500"
            aria-hidden
          >
            <Check className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0 text-sm font-medium leading-snug text-gray-900">
            <p className="mb-0">Округлили ставку до {formatted} ₽.</p>
            <p className="mb-0">
              Она должна быть кратна {CPM_BID_STEP_RUB.toLocaleString('ru-RU')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useCpmBidRoundedAlert() {
  const [roundedRub, setRoundedRub] = useState<number | null>(null);

  const showCpmBidRoundedAlert = useCallback((rub: number) => {
    setRoundedRub(rub);
  }, []);

  const closeCpmBidRoundedAlert = useCallback(() => {
    setRoundedRub(null);
  }, []);

  const cpmBidRoundedAlertNode =
    roundedRub != null ? (
      <CpmBidRoundedAlert roundedRub={roundedRub} onClose={closeCpmBidRoundedAlert} />
    ) : null;

  return { showCpmBidRoundedAlert, cpmBidRoundedAlertNode };
}
