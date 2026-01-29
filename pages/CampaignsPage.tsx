import React from 'react';

// Обёртка-страница для кампаний.
// Сейчас просто прокидывает детей, чтобы не менять существующую логику.

const CampaignsPage: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export default CampaignsPage;

