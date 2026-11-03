import React, { useState } from 'react';
import {
  bidChasingPositionOption,
  type BidChasingRange,
} from '../utils/cpcBidChasingPositionTiers';
import { AlertTriangle } from './Icons';

export const SEARCH_BID_FORECAST: Record<BidChasingRange, { label: string; filled: number }> = {
  '1-2': { label: '1-2', filled: 3 },
  '3-10': { label: '2-11', filled: 2 },
  '11-34': { label: '11-34', filled: 1 },
  '35-50': { label: '35-50', filled: 1 },
  '51-100': { label: '51-100', filled: 1 },
};

/** CPC: ниже 2 ₽ — «Ниже рекомендуемой». */
export const CPC_BELOW_RECOMMENDED_RUB = 2;

/** CPM: дефолт при создании списка — конкурентная ставка. */
export const CPM_DEFAULT_COMPETITIVE_BID_RUB = 300;

/** CPC: дефолт при создании списка — ставка за 11–34. */
export const CPC_DEFAULT_SEARCH_BID_RUB = bidChasingPositionOption('11-34').demoBidRub;

const CPC_TIER_3_10_MIN_RUB = bidChasingPositionOption('3-10').demoBidRub;

const CPC_TIER_1_2_MIN_RUB = bidChasingPositionOption('1-2').demoBidRub;

/** Три кликабельных деления CPC → тир ставки. */
export const CPC_BAR_SEGMENT_TIERS: readonly BidChasingRange[] = [
  '11-34',
  '3-10',
  '1-2',
] as const;

export type RichBidBarTone = 'green' | 'teal' | 'purple' | 'grey';
export type RichBidSegmentIndex = 0 | 1 | 2;

export type RichBidVisualStatus =
  | {
      kind: 'tier';
      caption: string;
      filled: 1 | 2 | 3;
      tone: 'green' | 'teal' | 'purple';
    }
  | { kind: 'below'; caption: string }
  | { kind: 'failed' }
  | { kind: 'autobidder'; rangeLabel: string };

/** Демо-рекомендации по позициям (для пикера / модалок). */
export function buildSearchRecommendedTiers(seed: number): Record<BidChasingRange, number> {
  const base = 150 + (Math.abs(seed) % 120);
  const tier1134 = Math.round(base * 0.55);
  return {
    '11-34': tier1134,
    '35-50': tier1134,
    '51-100': tier1134,
    '3-10': Math.round(base * 0.85),
    '1-2': Math.round(base * 1.25),
  };
}

export function bidForCpcBarSegment(segment: RichBidSegmentIndex): {
  tier: BidChasingRange;
  bid: number;
} {
  const tier = CPC_BAR_SEGMENT_TIERS[segment];
  return {
    tier,
    bid: bidChasingPositionOption(tier).demoBidRub,
  };
}

export function bidForCpmBarSegment(
  segment: RichBidSegmentIndex,
  competitiveFloor: number = CPM_DEFAULT_COMPETITIVE_BID_RUB,
): { bid: number; status: RichBidVisualStatus } {
  if (segment === 0) {
    return {
      bid: competitiveFloor,
      status: { kind: 'tier', caption: 'Конкурентная', filled: 1, tone: 'green' },
    };
  }
  if (segment === 1) {
    return {
      bid: Math.round(competitiveFloor * 1.2),
      status: { kind: 'tier', caption: 'Лидерская', filled: 2, tone: 'teal' },
    };
  }
  return {
    bid: Math.round(competitiveFloor * 1.5),
    status: { kind: 'tier', caption: 'Топ-позиция', filled: 3, tone: 'purple' },
  };
}

/** Статус по выбранному диапазону позиций (3 деления = 3 опции). */
export function statusFromCpcPositionTier(tier: BidChasingRange): RichBidVisualStatus {
  if (tier === '1-2') {
    return { kind: 'tier', caption: 'Ставка за 1-2', filled: 3, tone: 'purple' };
  }
  if (tier === '3-10') {
    return { kind: 'tier', caption: 'Ставка за 2-11', filled: 2, tone: 'teal' };
  }
  return { kind: 'tier', caption: 'Ставка за 11-34', filled: 1, tone: 'green' };
}

/**
 * CPC: 3 деления — 11-34 / 2-11 / 1-2.
 * Ниже рекомендуемой — только если ставка < 2 ₽.
 */
export function resolveCpcSearchBidStatus(bid: number): RichBidVisualStatus {
  if (!Number.isFinite(bid)) return { kind: 'failed' };
  if (bid < CPC_BELOW_RECOMMENDED_RUB) {
    return { kind: 'below', caption: 'Ниже рекомендуемой' };
  }
  if (bid >= CPC_TIER_1_2_MIN_RUB) {
    return { kind: 'tier', caption: 'Ставка за 1-2', filled: 3, tone: 'purple' };
  }
  if (bid >= CPC_TIER_3_10_MIN_RUB) {
    return { kind: 'tier', caption: 'Ставка за 2-11', filled: 2, tone: 'teal' };
  }
  return { kind: 'tier', caption: 'Ставка за 11-34', filled: 1, tone: 'green' };
}

/**
 * CPM: 3 деления — конкурентная / лидерская / топ-позиция.
 * Ниже конкурентной — ставка ниже конкурентного порога.
 */
export function resolveCpmBidStatus(
  bid: number,
  competitiveFloor: number = CPM_DEFAULT_COMPETITIVE_BID_RUB,
): RichBidVisualStatus {
  if (!Number.isFinite(bid) || competitiveFloor <= 0) {
    return { kind: 'failed' };
  }
  if (bid < competitiveFloor) {
    return { kind: 'below', caption: 'Ниже конкурентной' };
  }
  if (bid >= competitiveFloor * 1.5) {
    return { kind: 'tier', caption: 'Топ-позиция', filled: 3, tone: 'purple' };
  }
  if (bid >= competitiveFloor * 1.2) {
    return { kind: 'tier', caption: 'Лидерская', filled: 2, tone: 'teal' };
  }
  return { kind: 'tier', caption: 'Конкурентная', filled: 1, tone: 'green' };
}

export function BidBarsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <rect x="0" y="6" width="4" height="10" rx="1" />
      <rect x="6" y="0" width="4" height="16" rx="1" />
      <rect x="12" y="3" width="4" height="13" rx="1" />
    </svg>
  );
}

export function parseSearchBidRubInput(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, '').replace(/₽/g, '').replace(',', '.');
  if (cleaned === '') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

const TONE_ACTIVE: Record<'green' | 'teal' | 'purple' | 'grey', string> = {
  green: 'bg-[#60A876]',
  teal: 'bg-[#2EC4B6]',
  purple: 'bg-[#9A41FE]',
  grey: 'bg-[#C8C9D0]',
};

const CPC_SEGMENT_LABELS = [
  'Ставка за 11-34',
  'Ставка за 2-11',
  'Ставка за 1-2',
] as const;

const CPM_SEGMENT_LABELS = ['Конкурентная', 'Лидерская', 'Топ-позиция'] as const;

/** Всегда 3 деления; при onSegmentSelect — кликабельные. */
function RichBidBar({
  filled,
  tone,
  interactive,
  segmentLabels,
  onSegmentSelect,
}: {
  filled: number;
  tone: 'green' | 'teal' | 'purple' | 'grey';
  interactive?: boolean;
  segmentLabels: readonly [string, string, string];
  onSegmentSelect?: (segment: RichBidSegmentIndex) => void;
}) {
  return (
    <div
      className={`relative flex h-2 gap-px overflow-hidden rounded-b-[10px] ${
        interactive ? 'cursor-pointer' : ''
      }`}
      role={interactive ? 'group' : undefined}
      aria-label={interactive ? 'Выбор уровня ставки' : undefined}
    >
      {([0, 1, 2] as const).map((index) => {
        const active = index < filled;
        const fillClass = active ? TONE_ACTIVE[tone] : 'bg-[#E2E3E9]';

        if (!interactive || !onSegmentSelect) {
          return <div key={index} className={`min-w-0 flex-1 ${fillClass}`} />;
        }

        return (
          <button
            key={index}
            type="button"
            title={segmentLabels[index]}
            aria-label={segmentLabels[index]}
            aria-pressed={filled === index + 1}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSegmentSelect(index);
            }}
            className={`min-w-0 flex-1 border-0 p-0 ${fillClass} transition-[filter] hover:brightness-90`}
          />
        );
      })}
    </div>
  );
}

export function SearchBidForecastField({
  value,
  disabled,
  readOnly,
  filled,
  caption,
  onChange,
  onTipEnter,
  onTipLeave,
  onBlur,
  inputTitle,
  onBarsClick,
  barsActive = false,
  status,
  showBarsButton = true,
  onSegmentSelect,
  segmentMode = 'cpc',
}: {
  value: string;
  disabled: boolean;
  readOnly: boolean;
  /** @deprecated prefer `status` */
  filled?: number;
  /** @deprecated prefer `status` */
  caption?: string;
  onChange: (raw: string) => void;
  onTipEnter?: (event: React.MouseEvent<HTMLInputElement>) => void;
  onTipLeave?: () => void;
  onBlur?: () => void;
  inputTitle?: string;
  onBarsClick?: () => void;
  barsActive?: boolean;
  status?: RichBidVisualStatus;
  showBarsButton?: boolean;
  /** Клик по делению бара: 0 → 11-34 / конкурентная, 1 → mid, 2 → top */
  onSegmentSelect?: (segment: RichBidSegmentIndex) => void;
  segmentMode?: 'cpc' | 'cpm';
}) {
  const [focused, setFocused] = useState(false);
  const segmentLabels = segmentMode === 'cpm' ? CPM_SEGMENT_LABELS : CPC_SEGMENT_LABELS;

  if (status?.kind === 'autobidder') {
    return (
      <div className="flex h-9 items-center text-sm font-medium tabular-nums text-[#8B8A94]">
        {status.rangeLabel}
      </div>
    );
  }

  const resolved: RichBidVisualStatus =
    status ??
    (disabled
      ? { kind: 'failed' }
      : {
          kind: 'tier',
          caption: caption ?? '',
          filled: (filled === 2 || filled === 3 ? filled : 1) as 1 | 2 | 3,
          tone: 'green',
        });

  const showWarning = resolved.kind === 'below';
  const showBar = resolved.kind === 'tier' || resolved.kind === 'below';
  const showCaption =
    resolved.kind === 'tier' || resolved.kind === 'below' ? resolved.caption : '';

  const numericDisplay = disabled
    ? ''
    : value.replace(/\s*₽\s*$/u, '').trim();

  const canSelectSegments =
    Boolean(onSegmentSelect) && !disabled && !readOnly && showBar;

  const barsButton =
    showBarsButton && onBarsClick ? (
      <button
        type="button"
        onClick={onBarsClick}
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#757383] hover:bg-gray-100 ${
          barsActive ? 'bg-gray-100' : ''
        }`}
        aria-label="Выбор позиций в поиске"
        aria-expanded={barsActive}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <rect x="1" y="8" width="3" height="7" rx="0.5" fill="currentColor" opacity="0.35" />
          <rect x="6.5" y="5" width="3" height="10" rx="0.5" fill="currentColor" opacity="0.6" />
          <rect x="12" y="2" width="3" height="13" rx="0.5" fill="currentColor" />
        </svg>
      </button>
    ) : showBarsButton ? (
      <span
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center text-[#757383]"
        aria-hidden
      >
        <BidBarsIcon className="h-4 w-4" />
      </span>
    ) : null;

  return (
    <div>
      <div className="flex items-start gap-2">
        <div className="w-[140px] shrink-0">
          <div
            className={`overflow-hidden rounded-[10px] border transition-colors ${
              disabled
                ? 'cursor-not-allowed border-transparent bg-[#EFEFF3]'
                : focused
                  ? 'border-black bg-white'
                  : 'border-transparent bg-[#F2F2F7] hover:bg-[#EBEBF0]'
            }`}
          >
            <div className="relative flex h-9 items-center">
              {showWarning ? (
                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[#F5A623]">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </span>
              ) : null}
              <input
                type="text"
                inputMode="decimal"
                disabled={disabled}
                readOnly={readOnly}
                value={numericDisplay}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => {
                  setFocused(false);
                  onBlur?.();
                }}
                title={inputTitle}
                onMouseEnter={onTipEnter}
                onMouseLeave={onTipLeave}
                className={`box-border h-9 w-full bg-transparent text-sm font-medium tabular-nums outline-none ${
                  showWarning
                    ? 'pl-7 pr-7 text-[#F97316] line-through'
                    : 'px-2.5 pr-7 text-gray-900'
                } ${
                  disabled
                    ? 'cursor-not-allowed text-gray-400'
                    : readOnly
                      ? 'cursor-default'
                      : ''
                }`}
              />
              {!disabled ? (
                <span
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm font-medium text-[#A0A0AB]"
                  aria-hidden
                >
                  ₽
                </span>
              ) : null}
            </div>
            {showBar ? (
              resolved.kind === 'below' ? (
                <RichBidBar
                  filled={3}
                  tone="grey"
                  interactive={canSelectSegments}
                  segmentLabels={segmentLabels}
                  onSegmentSelect={onSegmentSelect}
                />
              ) : (
                <RichBidBar
                  filled={resolved.filled}
                  tone={resolved.tone}
                  interactive={canSelectSegments}
                  segmentLabels={segmentLabels}
                  onSegmentSelect={onSegmentSelect}
                />
              )
            ) : null}
          </div>
          {showCaption ? (
            <div
              className={`mt-1 w-full text-center text-[11px] font-bold leading-4 tracking-[0.2px] ${
                showWarning ? 'text-[#F97316]' : 'text-[#9191A0]'
              }`}
            >
              {showCaption}
            </div>
          ) : null}
        </div>
        {barsButton}
      </div>
    </div>
  );
}
