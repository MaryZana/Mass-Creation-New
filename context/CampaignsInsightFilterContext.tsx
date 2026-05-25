import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type CampaignsInsightFilterKind = 'budget' | 'stock' | 'launch';

export type CampaignsInsightFilter = {
  kind: CampaignsInsightFilterKind;
  label: string;
};

type CampaignsInsightFilterContextValue = {
  filter: CampaignsInsightFilter | null;
  applyFilter: (kind: CampaignsInsightFilterKind, label: string) => void;
  clearFilter: () => void;
};

const CampaignsInsightFilterContext = createContext<CampaignsInsightFilterContextValue | null>(
  null,
);

export function campaignMatchesInsightFilter(
  campaign: {
    status: string;
    remainingBudget: number | null;
    dailyLimitExhausted?: boolean;
    tags: { text: string }[];
  },
  kind: CampaignsInsightFilterKind,
): boolean {
  switch (kind) {
    case 'budget':
      return campaign.status !== 'error' && (campaign.remainingBudget ?? 0) < 1000;
    case 'stock':
      return (
        campaign.dailyLimitExhausted === true ||
        campaign.tags.some((t) => /остат/i.test(t.text))
      );
    case 'launch':
      return campaign.status === 'draft';
    default:
      return true;
  }
}

export function CampaignsInsightFilterProvider({ children }: { children: React.ReactNode }) {
  const [filter, setFilter] = useState<CampaignsInsightFilter | null>(null);

  const applyFilter = useCallback((kind: CampaignsInsightFilterKind, label: string) => {
    setFilter({ kind, label });
  }, []);

  const clearFilter = useCallback(() => setFilter(null), []);

  const value = useMemo(
    () => ({ filter, applyFilter, clearFilter }),
    [filter, applyFilter, clearFilter],
  );

  return (
    <CampaignsInsightFilterContext.Provider value={value}>
      {children}
    </CampaignsInsightFilterContext.Provider>
  );
}

export function useCampaignsInsightFilter() {
  const ctx = useContext(CampaignsInsightFilterContext);
  if (!ctx) {
    throw new Error('useCampaignsInsightFilter must be used within CampaignsInsightFilterProvider');
  }
  return ctx;
}

export function useCampaignsInsightFilterOptional() {
  return useContext(CampaignsInsightFilterContext);
}
