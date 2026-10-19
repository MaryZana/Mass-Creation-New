import React, { createContext, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMassCreationDemoChromeVisible } from './PromoBonusDemoContext';

/** Базовые механики + 10 UI-скинов для футер+CTA. */
export type PromoMissedBonusUxId =
  | 'modal'
  | 'footer-info'
  | 'cta-inline'
  | 'cta-banner'
  | 'cta-column'
  | 'cta-beside'
  | 'cta-snackbar'
  | 'cta-island'
  | 'cta-float'
  | 'cta-link'
  | 'cta-compare'
  | 'cta-toggle'
  | 'cta-alert-row'
  | 'cta-progress';

export const PROMO_MISSED_BONUS_UX_CASES: ReadonlyArray<{
  id: PromoMissedBonusUxId;
  label: string;
  title: string;
  group: 'base' | 'cta';
}> = [
  { id: 'modal', label: 'Модалка', title: 'Только в подтверждении', group: 'base' },
  { id: 'footer-info', label: 'Футер', title: 'Инфо в футере без кнопки', group: 'base' },
  {
    id: 'cta-inline',
    label: 'C1',
    title: 'CTA: текст под итогами + кнопка',
    group: 'cta',
  },
  {
    id: 'cta-banner',
    label: 'C2',
    title: 'CTA: баннер на всю ширину футера',
    group: 'cta',
  },
  {
    id: 'cta-column',
    label: 'C3',
    title: 'CTA: вместо колонки «Промобонусы 0 B»',
    group: 'cta',
  },
  {
    id: 'cta-beside',
    label: 'C4',
    title: 'CTA: кнопка рядом с «Создать»',
    group: 'cta',
  },
  {
    id: 'cta-snackbar',
    label: 'C5',
    title: 'CTA: полоска над футером',
    group: 'cta',
  },
  {
    id: 'cta-island',
    label: 'C6',
    title: 'CTA: баннер над таблицей кампаний',
    group: 'cta',
  },
  {
    id: 'cta-float',
    label: 'C7',
    title: 'CTA: плавающая карточка слева внизу',
    group: 'cta',
  },
  {
    id: 'cta-link',
    label: 'C8',
    title: 'CTA: текстовая ссылка под «С единого счёта»',
    group: 'cta',
  },
  {
    id: 'cta-compare',
    label: 'C9',
    title: 'CTA: карточка до/после списания',
    group: 'cta',
  },
  {
    id: 'cta-toggle',
    label: 'C10',
    title: 'CTA: переключатель «Списать N B»',
    group: 'cta',
  },
  {
    id: 'cta-alert-row',
    label: 'C11',
    title: 'CTA Mobbin: alert-row как OpenAI Billing (инфо слева, CTA справа)',
    group: 'cta',
  },
  {
    id: 'cta-progress',
    label: 'C12',
    title: 'CTA Mobbin: sticky progress как Instacart (0 из N B + Apply)',
    group: 'cta',
  },
];

const LEGACY_UX_MAP: Record<string, PromoMissedBonusUxId> = {
  'footer-cta': 'cta-inline',
};

export function isPromoMissedCtaUx(id: PromoMissedBonusUxId): boolean {
  return id.startsWith('cta-');
}

export function showsPromoMissedFooterInfo(id: PromoMissedBonusUxId): boolean {
  return id === 'footer-info' || id === 'cta-inline';
}

type PromoMissedBonusUxContextValue = {
  uxId: PromoMissedBonusUxId;
  setUxId: (id: PromoMissedBonusUxId) => void;
};

const PromoMissedBonusUxContext = createContext<PromoMissedBonusUxContextValue | null>(null);

const STORAGE_KEY = 'mass_creation_promo_missed_bonus_ux';

function readStoredUxId(): PromoMissedBonusUxId {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw && LEGACY_UX_MAP[raw]) return LEGACY_UX_MAP[raw];
    if (PROMO_MISSED_BONUS_UX_CASES.some((item) => item.id === raw)) {
      return raw as PromoMissedBonusUxId;
    }
  } catch {
    /* ignore */
  }
  return 'modal';
}

export function PromoMissedBonusUxProvider({ children }: { children: React.ReactNode }) {
  const [uxId, setUxIdState] = useState<PromoMissedBonusUxId>(readStoredUxId);

  const setUxId = (id: PromoMissedBonusUxId) => {
    setUxIdState(id);
    try {
      sessionStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  };

  const value = useMemo(() => ({ uxId, setUxId }), [uxId]);

  return (
    <PromoMissedBonusUxContext.Provider value={value}>
      {children}
      <PromoMissedBonusUxSwitcher />
    </PromoMissedBonusUxContext.Provider>
  );
}

export function usePromoMissedBonusUx(): PromoMissedBonusUxContextValue {
  const ctx = useContext(PromoMissedBonusUxContext);
  if (!ctx) {
    throw new Error('usePromoMissedBonusUx must be used within PromoMissedBonusUxProvider');
  }
  return ctx;
}

function PromoMissedBonusUxSwitcher() {
  const { uxId, setUxId } = usePromoMissedBonusUx();
  const visible = useMassCreationDemoChromeVisible();
  const baseCases = PROMO_MISSED_BONUS_UX_CASES.filter((item) => item.group === 'base');
  const ctaCases = PROMO_MISSED_BONUS_UX_CASES.filter((item) => item.group === 'cta');
  if (!visible) return null;

  return createPortal(
    <div className="fixed bottom-52 right-3 z-[90] flex max-w-[min(100vw-1.5rem,22rem)] flex-col items-end gap-1">
      <div
        className="inline-flex items-center gap-0.5 rounded-full border border-gray-200/80 bg-white/70 p-0.5 shadow-sm backdrop-blur-sm"
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
                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div
        className="inline-flex flex-wrap items-center justify-end gap-0.5 rounded-full border border-gray-200/80 bg-white/70 p-0.5 shadow-sm backdrop-blur-sm"
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
                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>,
    document.body,
  );
}
