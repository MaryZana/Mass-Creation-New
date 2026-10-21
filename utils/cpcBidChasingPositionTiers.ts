export type BidChasingRange = '1-2' | '3-10' | '11-34' | '35-50' | '51-100';

/** Alias for preset id used by histogram / forecast (manual search bid tiers). */
export type BidChasingPreset = BidChasingRange;

export type BidChasingPosition =
  | { kind: 'preset'; id: BidChasingPreset }
  | { kind: 'custom'; from: number; to: number };

/** Ставки как у 11–34 — для диапазонов 35–50 и 51–100. */
const BID_CHASING_TIER_11_34_BIDS = {
  demoBidRub: 9.97,
  demoBidMinRub: 6,
  demoBidMaxRub: 12,
  demoClicksPerDay: 500,
  demoSearchCtr: 0.04,
} as const;

export const BID_CHASING_POSITION_OPTIONS: {
  id: BidChasingRange;
  label: string;
  accentClass: string;
  selectedBgClass: string;
  segmentActiveClass: string;
  labelTextClass: string;
  demoBidRub: number;
  demoBidMinRub: number;
  demoBidMaxRub: number;
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
    demoBidMinRub: 14,
    demoBidMaxRub: 26,
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
    demoBidMinRub: 7,
    demoBidMaxRub: 14,
    demoClicksPerDay: 1500,
    demoSearchCtr: 0.05,
  },
  {
    id: '11-34',
    label: '11–34 позиции',
    accentClass: 'border-l-[#A7E8B5]',
    selectedBgClass: 'bg-gray-50',
    segmentActiveClass: 'bg-[#A7E8B5]',
    labelTextClass: 'text-emerald-600',
    ...BID_CHASING_TIER_11_34_BIDS,
  },
  {
    id: '35-50',
    label: '35–50 позиции',
    accentClass: 'border-l-gray-400',
    selectedBgClass: 'bg-gray-50',
    segmentActiveClass: 'bg-gray-400',
    labelTextClass: 'text-gray-600',
    ...BID_CHASING_TIER_11_34_BIDS,
  },
  {
    id: '51-100',
    label: '51–100 позиции',
    accentClass: 'border-l-gray-300',
    selectedBgClass: 'bg-gray-50',
    segmentActiveClass: 'bg-gray-300',
    labelTextClass: 'text-gray-500',
    ...BID_CHASING_TIER_11_34_BIDS,
  },
];

export const BID_CHASING_TARGET_AVG_POSITION: Record<BidChasingRange, number> = {
  '1-2': 2,
  '3-10': 6,
  '11-34': 22,
  '35-50': 42,
  '51-100': 75,
};

export const MAX_BID_CHASING_SEARCH_POSITION = 100;
export const MIN_BID_CHASING_SEARCH_POSITION = 1;
/** Upper bound for seller-defined custom position range. */
export const MAX_CUSTOM_BID_CHASING_SEARCH_POSITION = 90;
/** Custom range: upper bound must be at least this many positions above lower. */
export const MIN_CUSTOM_BID_CHASING_SPAN = 2;

export const DEFAULT_BID_CHASING_POSITION: BidChasingPosition = {
  kind: 'preset',
  id: '1-2',
};

export function formatBidChasingClusterBidRangeLabel(minRub: number, maxRub: number): string {
  const fmt = (value: number) =>
    value.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `${fmt(minRub)}–${fmt(maxRub)}`;
}

export function presetBidChasingPosition(id: BidChasingPreset): BidChasingPosition {
  return { kind: 'preset', id };
}

export function isValidCustomBidChasingRange(from: number, to: number): boolean {
  if (!Number.isInteger(from) || !Number.isInteger(to)) return false;
  if (from < MIN_BID_CHASING_SEARCH_POSITION || to > MAX_CUSTOM_BID_CHASING_SEARCH_POSITION) {
    return false;
  }
  return to >= from + MIN_CUSTOM_BID_CHASING_SPAN;
}

export function formatBidChasingPositionShortLabel(pos: BidChasingPosition): string {
  if (pos.kind === 'preset') {
    const labels: Record<BidChasingPreset, string> = {
      '1-2': '1–2',
      '3-10': '3–10',
      '11-34': '11–34',
      '35-50': '35–50',
      '51-100': '51–100',
    };
    return labels[pos.id];
  }
  return `${pos.from}–${pos.to}`;
}

export function formatBidChasingPositionLabel(pos: BidChasingPosition): string {
  return `${formatBidChasingPositionShortLabel(pos)} позиции`;
}

export function formatBidChasingPositionLinkLabel(pos: BidChasingPosition): string {
  return `${formatBidChasingPositionShortLabel(pos)} позиции в поиске`;
}

export function bidChasingPositionBounds(pos: BidChasingPosition): { from: number; to: number } {
  if (pos.kind === 'custom') return { from: pos.from, to: pos.to };
  if (pos.id === '1-2') return { from: 1, to: 2 };
  if (pos.id === '3-10') return { from: 3, to: 10 };
  if (pos.id === '11-34') return { from: 11, to: 34 };
  if (pos.id === '35-50') return { from: 35, to: 50 };
  return { from: 51, to: 100 };
}

export function bidChasingTargetAvgPosition(pos: BidChasingPosition): number {
  if (pos.kind === 'preset') return BID_CHASING_TARGET_AVG_POSITION[pos.id];
  return Math.round((pos.from + pos.to) / 2);
}

/** Nearest preset by mid-position — for forecast bars / productSearchTier. */
export function nearestPresetForBidChasingPosition(pos: BidChasingPosition): BidChasingPreset {
  if (pos.kind === 'preset') return pos.id;
  const mid = (pos.from + pos.to) / 2;
  let best: BidChasingPreset = '3-10';
  let bestDist = Infinity;
  for (const opt of BID_CHASING_POSITION_OPTIONS) {
    const avg = BID_CHASING_TARGET_AVG_POSITION[opt.id];
    const dist = Math.abs(avg - mid);
    if (dist < bestDist) {
      bestDist = dist;
      best = opt.id;
    }
  }
  return best;
}

/** Demo bid band at one search position (1 = top, higher position = lower bids). */
function customClusterBidBandRubForPosition(pos: number): { minRub: number; maxRub: number } {
  const p = Math.max(
    MIN_BID_CHASING_SEARCH_POSITION,
    Math.min(MAX_CUSTOM_BID_CHASING_SEARCH_POSITION, pos),
  );
  const span = MAX_CUSTOM_BID_CHASING_SEARCH_POSITION - MIN_BID_CHASING_SEARCH_POSITION;
  const t = span > 0 ? (p - MIN_BID_CHASING_SEARCH_POSITION) / span : 0;
  const maxRub = 40 - t * 34;
  const minRub = 26 - t * 24;
  return {
    minRub: Math.max(2, Math.round(minRub)),
    maxRub: Math.max(2, Math.round(maxRub)),
  };
}

function resolveCustomBidChasingDemoBids(from: number, to: number): {
  demoBidRub: number;
  demoBidMinRub: number;
  demoBidMaxRub: number;
} {
  const top = customClusterBidBandRubForPosition(from);
  const bottom = customClusterBidBandRubForPosition(to);
  const demoBidMinRub = 2;
  const demoBidMaxRub = Math.max(top.maxRub, bottom.maxRub, demoBidMinRub);
  const demoBidRub = Math.round(((demoBidMinRub + demoBidMaxRub) / 2) * 100) / 100;
  return { demoBidRub, demoBidMinRub, demoBidMaxRub };
}

export function resolveBidChasingDemoBids(pos: BidChasingPosition): {
  demoBidRub: number;
  demoBidMinRub: number;
  demoBidMaxRub: number;
} {
  if (pos.kind === 'custom') {
    return resolveCustomBidChasingDemoBids(pos.from, pos.to);
  }
  const opt = bidChasingPositionOption(pos.id);
  return {
    demoBidRub: opt.demoBidRub,
    demoBidMinRub: opt.demoBidMinRub,
    demoBidMaxRub: opt.demoBidMaxRub,
  };
}

/**
 * Диапазон ставок автобиддера для конкретного товара:
 * за одно и то же место у разных товаров свои ставки.
 */
export function resolveProductBidChasingRange(
  seed: number,
  pos: BidChasingPosition,
  maxBidCap?: number,
): { minRub: number; maxRub: number } {
  const base = resolveBidChasingDemoBids(pos);
  const factor = 0.75 + ((Math.abs(seed) * 17) % 55) / 100;
  let minRub = Math.round(base.demoBidMinRub * factor * 100) / 100;
  let maxRub = Math.round(base.demoBidMaxRub * factor * 100) / 100;
  if (maxBidCap != null && Number.isFinite(maxBidCap) && maxBidCap > 0) {
    minRub = Math.min(minRub, maxBidCap);
    maxRub = Math.min(maxRub, maxBidCap);
  }
  if (maxRub < minRub) maxRub = minRub;
  return { minRub, maxRub };
}

export function searchBidForecastMetaForPosition(pos: BidChasingPosition): {
  label: string;
  filled: number;
} {
  if (pos.kind === 'preset') {
    const map: Record<BidChasingPreset, { label: string; filled: number }> = {
      '1-2': { label: '1-2', filled: 3 },
      '3-10': { label: '3-10', filled: 2 },
      '11-34': { label: '11-34', filled: 1 },
      '35-50': { label: '35-50', filled: 1 },
      '51-100': { label: '51-100', filled: 1 },
    };
    return map[pos.id];
  }
  const span = pos.to - pos.from;
  const filled = span >= 10 ? 1 : span >= 4 ? 2 : 3;
  return { label: `${pos.from}-${pos.to}`, filled };
}

/** Диапазоны на графике «По позициям», для которых доступно удержание (автобиддер). */
export function isBidChasingHoldOfferedForChartRange(rangeLabel: string): boolean {
  return (
    rangeLabel === '1–2 позиции' ||
    rangeLabel === '3–10' ||
    rangeLabel === '11–34' ||
    rangeLabel === '35–50' ||
    rangeLabel === '51–100'
  );
}

export function isBidChasingHoldOfferedForApproxPosition(position: number): boolean {
  return Math.max(1, Math.round(position)) <= MAX_BID_CHASING_SEARCH_POSITION;
}

export function bidChasingPositionOption(id: BidChasingRange) {
  return BID_CHASING_POSITION_OPTIONS.find((o) => o.id === id) ?? BID_CHASING_POSITION_OPTIONS[0];
}
