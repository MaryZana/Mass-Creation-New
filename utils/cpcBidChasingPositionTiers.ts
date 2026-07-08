export type BidChasingRange = '1-2' | '3-10' | '11-34';

export const BID_CHASING_POSITION_OPTIONS: {
  id: BidChasingRange;
  label: string;
  accentClass: string;
  selectedBgClass: string;
  segmentActiveClass: string;
  labelTextClass: string;
  demoBidRub: number;
  demoClicksPerDay: number;
  demoSearchCtr: number;
}[] = [
  {
    id: '1-2',
    label: '1–2 позиции',
    accentClass: 'border-l-[#9A41FE]',
    selectedBgClass: 'bg-[#F6F2FF]',
    segmentActiveClass: 'bg-[#9A41FE]',
    labelTextClass: 'text-[#9A41FE]',
    demoBidRub: 18.56,
    demoClicksPerDay: 2000,
    demoSearchCtr: 0.06,
  },
  {
    id: '3-10',
    label: '3–10 позиции',
    accentClass: 'border-l-emerald-400',
    selectedBgClass: 'bg-white',
    segmentActiveClass: 'bg-emerald-400',
    labelTextClass: 'text-emerald-600',
    demoBidRub: 10.53,
    demoClicksPerDay: 1500,
    demoSearchCtr: 0.05,
  },
  {
    id: '11-34',
    label: '11–34 позиции',
    accentClass: 'border-l-teal-300',
    selectedBgClass: 'bg-gray-50',
    segmentActiveClass: 'bg-teal-400',
    labelTextClass: 'text-teal-600',
    demoBidRub: 9.97,
    demoClicksPerDay: 500,
    demoSearchCtr: 0.04,
  },
];

export const BID_CHASING_TARGET_AVG_POSITION: Record<BidChasingRange, number> = {
  '1-2': 2,
  '3-10': 6,
  '11-34': 22,
};

export const MAX_BID_CHASING_SEARCH_POSITION = 34;

/** Диапазоны на графике «По позициям», для которых доступно удержание (автобиддер). */
export function isBidChasingHoldOfferedForChartRange(rangeLabel: string): boolean {
  return rangeLabel === '1–2 позиции' || rangeLabel === '3–10' || rangeLabel === '11–34';
}

export function isBidChasingHoldOfferedForApproxPosition(position: number): boolean {
  return Math.max(1, Math.round(position)) <= MAX_BID_CHASING_SEARCH_POSITION;
}

export function bidChasingPositionOption(id: BidChasingRange) {
  return BID_CHASING_POSITION_OPTIONS.find((o) => o.id === id) ?? BID_CHASING_POSITION_OPTIONS[0];
}
