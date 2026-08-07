import React from 'react';
import { useLocation } from 'react-router-dom';
import { StatsDashboardPage, type StatsSectionId } from './AudienceMetricsPage';

function sectionFromPath(pathname: string): StatsSectionId {
  if (pathname.endsWith('/acquisition')) return 'acquisition';
  if (pathname.endsWith('/return')) return 'return';
  if (pathname.endsWith('/value')) return 'value';
  return 'overview';
}

/** Пункт «Статистика» в шапке (/stats и разделы). */
const StatsPage: React.FC = () => {
  const { pathname } = useLocation();
  return <StatsDashboardPage section={sectionFromPath(pathname)} />;
};

export default StatsPage;
