import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Settings, X } from './Icons';
import {
  PROMO_BONUS_DEMO_CASES,
  useMassCreationDemoChromeVisible,
  usePromoBonusDemo,
} from './PromoBonusDemoContext';
import {
  PROMO_MISSED_BONUS_UX_CASES,
  usePromoMissedBonusUx,
} from './PromoMissedBonusUxContext';

/** Все демо-пилюли массового создания — под одной кнопкой. */
export function MassCreationDemoChromePanel() {
  const visible = useMassCreationDemoChromeVisible();
  const { caseId, setCaseId } = usePromoBonusDemo();
  const { uxId, setUxId } = usePromoMissedBonusUx();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const baseCases = PROMO_MISSED_BONUS_UX_CASES.filter((item) => item.group === 'base');
  const ctaCases = PROMO_MISSED_BONUS_UX_CASES.filter((item) => item.group === 'cta');

  useEffect(() => {
    if (!visible) setOpen(false);
  }, [visible]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (panelRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!visible) return null;

  return createPortal(
    <div ref={panelRef} className="fixed bottom-6 right-3 z-[90] flex flex-col items-end gap-2">
      {open ? (
        <div className="flex w-[min(100vw-1.5rem,22rem)] flex-col gap-2 rounded-2xl border border-gray-200/80 bg-white/95 p-3 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Демо-настройки
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Свернуть демо-настройки"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div>
            <p className="mb-1 text-[11px] font-medium text-gray-500">Баланс промобонусов</p>
            <div
              className="inline-flex flex-wrap items-center gap-0.5 rounded-full border border-gray-200 bg-gray-50 p-0.5"
              role="group"
              aria-label="Демо: баланс промобонусов"
            >
              {PROMO_BONUS_DEMO_CASES.map((item) => {
                const active = item.id === caseId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCaseId(item.id)}
                    title={`Промобонусы: ${item.label}`}
                    className={`rounded-full px-2 py-1 text-[11px] font-medium tabular-nums transition-colors ${
                      active
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-400 hover:bg-white hover:text-gray-600'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-1 text-[11px] font-medium text-gray-500">Упущенная выгода — база</p>
            <div
              className="inline-flex items-center gap-0.5 rounded-full border border-gray-200 bg-gray-50 p-0.5"
              role="group"
              aria-label="Демо: упущенная выгода — база"
            >
              {baseCases.map((item) => {
                const active = item.id === uxId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setUxId(item.id)}
                    title={item.title}
                    className={`rounded-full px-2 py-1 text-[11px] font-medium transition-colors ${
                      active
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-400 hover:bg-white hover:text-gray-600'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-1 text-[11px] font-medium text-gray-500">Упущенная выгода — CTA UI</p>
            <div
              className="inline-flex flex-wrap items-center gap-0.5 rounded-full border border-gray-200 bg-gray-50 p-0.5"
              role="group"
              aria-label="Демо: упущенная выгода — CTA UI"
            >
              {ctaCases.map((item) => {
                const active = item.id === uxId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setUxId(item.id)}
                    title={item.title}
                    className={`rounded-full px-1.5 py-1 text-[10px] font-semibold tabular-nums transition-colors ${
                      active
                        ? 'bg-[#9A41FE] text-white'
                        : 'text-gray-400 hover:bg-white hover:text-gray-600'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200/80 bg-white/90 text-gray-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-gray-900 ${
          open ? 'ring-2 ring-gray-900/10' : ''
        }`}
        aria-expanded={open}
        aria-label={open ? 'Свернуть демо-настройки' : 'Открыть демо-настройки'}
        title="Демо-настройки"
      >
        <Settings className="h-4 w-4" />
      </button>
    </div>,
    document.body,
  );
}
