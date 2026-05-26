import React from 'react';

/** Обёртка для страницы списка кампаний с виджетами (контент — в SuccessPage). */
const CampaignsWithWidgetsPage: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export default CampaignsWithWidgetsPage;
