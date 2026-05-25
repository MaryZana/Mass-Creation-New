import React from 'react';
import { OverviewMiniWidgetsForCampaignsList } from './OverviewPage';

/** Обёртка для экспериментальной страницы списка кампаний с виджетами. */
const CampaignsWithWidgetsPage: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <div className="mx-auto max-w-[1600px] bg-[#F3F5F8] px-7 pt-4 pb-2">
        <OverviewMiniWidgetsForCampaignsList />
      </div>
      {children}
    </>
  );
};

export default CampaignsWithWidgetsPage;
