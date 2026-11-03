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

/** Пакеты с остатками под выбранный демо-кейс: крупный / средний / крошечный. */
export function buildDemoBonusPackages(total: number): Array<{
  id: string;
  amount: number;
  maxPercent: number;
  expiry: string;
  displayBurn: string;
}> {
  const fmt = (n: number) => n.toLocaleString('ru-RU');
  if (total <= 0) {
    return [
      { id: 'p1', amount: 0, maxPercent: 50, expiry: '20.03.26', displayBurn: '0' },
      { id: 'p2', amount: 0, maxPercent: 99, expiry: '27.03.26', displayBurn: '0' },
      { id: 'p3', amount: 0, maxPercent: 100, expiry: '15.04.26', displayBurn: '0' },
    ];
  }

  const tinyAmount = Math.min(180, Math.max(40, Math.floor(total * 0.0007)));
  const rest = Math.max(0, total - tinyAmount);
  const largeAmount = Math.floor(rest * 0.68);
  const midAmount = Math.max(0, rest - largeAmount);

  return [
    {
      id: 'p1',
      amount: largeAmount,
      maxPercent: 50,
      expiry: '20.03.26',
      displayBurn: fmt(largeAmount),
    },
    {
      id: 'p2',
      amount: midAmount,
      maxPercent: 99,
      expiry: '27.03.26',
      displayBurn: fmt(midAmount),
    },
    {
      id: 'p3',
      amount: tinyAmount,
      maxPercent: 100,
      expiry: '15.04.26',
      displayBurn: fmt(tinyAmount),
    },
  ].filter((pkg) => pkg.amount > 0);
}
