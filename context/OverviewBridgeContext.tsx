import React, { createContext, useContext } from 'react';

export type OverviewInsightMassCreationItem = {
  nmId: number;
  productName: string;
  imageUrl: string;
  category: string;
};

type OverviewBridgeValue = {
  openMassCreationWithProducts: (items: OverviewInsightMassCreationItem[]) => void;
};

const OverviewBridgeContext = createContext<OverviewBridgeValue | null>(null);

export function OverviewBridgeProvider({
  value,
  children,
}: {
  value: OverviewBridgeValue;
  children: React.ReactNode;
}) {
  return <OverviewBridgeContext.Provider value={value}>{children}</OverviewBridgeContext.Provider>;
}

export function useOverviewBridge() {
  return useContext(OverviewBridgeContext);
}
