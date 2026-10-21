import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type PromoBonusDemoCaseId = '100' | '250000' | '1600';

export const PROMO_BONUS_DEMO_CASES: ReadonlyArray<{
  id: PromoBonusDemoCaseId;
  total: number;
  label: string;
}> = [
  { id: '100', total: 100, label: '100 B' },
  { id: '250000', total: 250_000, label: '250 000 B' },
  { id: '1600', total: 1_600, label: '1 600 B' },
];

type PromoBonusDemoContextValue = {
  caseId: PromoBonusDemoCaseId;
  setCaseId: (id: PromoBonusDemoCaseId) => void;
  promoBonusTotal: number;
};

const PromoBonusDemoContext = createContext<PromoBonusDemoContextValue | null>(null);

type MassCreationDemoChromeValue = {
  visible: boolean;
  setVisible: (visible: boolean) => void;
};

const MassCreationDemoChromeContext = createContext<MassCreationDemoChromeValue | null>(null);

const STORAGE_KEY = 'mass_creation_promo_bonus_demo_case';

function readStoredCaseId(): PromoBonusDemoCaseId {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw === '100' || raw === '250000' || raw === '1600') return raw;
  } catch {
    /* ignore */
  }
  return '250000';
}

export function PromoBonusDemoProvider({ children }: { children: React.ReactNode }) {
  const [caseId, setCaseIdState] = useState<PromoBonusDemoCaseId>(readStoredCaseId);
  const [demoChromeVisible, setDemoChromeVisible] = useState(false);

  const setCaseId = (id: PromoBonusDemoCaseId) => {
    setCaseIdState(id);
    try {
      sessionStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  };

  const promoBonusTotal =
    PROMO_BONUS_DEMO_CASES.find((item) => item.id === caseId)?.total ?? 250_000;

  const value = useMemo(
    () => ({ caseId, setCaseId, promoBonusTotal }),
    [caseId, promoBonusTotal],
  );
  const setVisible = useCallback((visible: boolean) => {
    setDemoChromeVisible(visible);
  }, []);
  const chromeValue = useMemo(
    () => ({ visible: demoChromeVisible, setVisible }),
    [demoChromeVisible, setVisible],
  );

  return (
    <PromoBonusDemoContext.Provider value={value}>
      <MassCreationDemoChromeContext.Provider value={chromeValue}>
        {children}
      </MassCreationDemoChromeContext.Provider>
    </PromoBonusDemoContext.Provider>
  );
}

/** Пилюли демо показываем только на экране массового создания. */
export function useSetMassCreationDemoChrome(): (visible: boolean) => void {
  const ctx = useContext(MassCreationDemoChromeContext);
  if (!ctx) {
    throw new Error('useSetMassCreationDemoChrome must be used within PromoBonusDemoProvider');
  }
  return ctx.setVisible;
}

export function useMassCreationDemoChromeVisible(): boolean {
  const ctx = useContext(MassCreationDemoChromeContext);
  return ctx?.visible ?? false;
}

export function usePromoBonusDemo(): PromoBonusDemoContextValue {
  const ctx = useContext(PromoBonusDemoContext);
  if (!ctx) {
    throw new Error('usePromoBonusDemo must be used within PromoBonusDemoProvider');
  }
  return ctx;
}

/** Пакеты с остатками под выбранный демо-кейс (50% / 99%). */
export function buildDemoBonusPackages(total: number): Array<{
  id: string;
  amount: number;
  maxPercent: number;
  expiry: string;
  displayBurn: string;
}> {
  const p1Amount = Math.floor(total / 2);
  const p2Amount = Math.max(0, total - p1Amount);
  const fmt = (n: number) => n.toLocaleString('ru-RU');
  return [
    {
      id: 'p1',
      amount: p1Amount > 0 ? p1Amount : total > 0 ? total : 0,
      maxPercent: 50,
      expiry: '20.03.26',
      displayBurn: fmt(p1Amount > 0 ? p1Amount : total),
    },
    {
      id: 'p2',
      amount: p1Amount > 0 ? p2Amount : 0,
      maxPercent: 99,
      expiry: '27.03.26',
      displayBurn: fmt(p2Amount),
    },
  ];
}
