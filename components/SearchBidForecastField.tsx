import React from 'react';
import type { BidChasingRange } from '../utils/cpcBidChasingPositionTiers';

export const SEARCH_BID_FORECAST: Record<BidChasingRange, { label: string; filled: number }> = {
  '1-2': { label: '1-2', filled: 3 },
  '3-10': { label: '3-10', filled: 2 },
  '11-34': { label: '11-34', filled: 1 },
  '35-50': { label: '35-50', filled: 1 },
  '51-100': { label: '51-100', filled: 1 },
};

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
  const cleaned = raw.replace(/\s/g, '').replace('₽', '').replace(',', '.');
  if (cleaned === '') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
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
}: {
  value: string;
  disabled: boolean;
  readOnly: boolean;
  filled: number;
  caption: string;
  onChange: (raw: string) => void;
  onTipEnter?: (event: React.MouseEvent<HTMLInputElement>) => void;
  onTipLeave?: () => void;
  onBlur?: () => void;
  inputTitle?: string;
  onBarsClick?: () => void;
  barsActive?: boolean;
}) {
  const bars = (
    <BidBarsIcon className="h-4 w-4 shrink-0 text-[#757383]" />
  );

  return (
    <div>
      <div className="flex items-center gap-[14px]">
        <div className="w-[140px] shrink-0">
          <input
            type="text"
            disabled={disabled}
            readOnly={readOnly}
            value={disabled ? '' : value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            title={inputTitle}
            onMouseEnter={onTipEnter}
            onMouseLeave={onTipLeave}
            className={
              disabled
                ? 'box-border h-11 w-full cursor-not-allowed rounded-[10px] border border-[#D8D8D8] bg-[#F7F7F8] pr-[13px] text-right text-sm font-medium leading-[44px] tabular-nums text-gray-400 outline-none'
                : readOnly
                  ? 'box-border h-[38px] w-full cursor-default rounded-t-[10px] border border-b-0 border-[#D8D8D8] bg-[#F7F7F8] pr-[13px] text-right text-sm font-medium leading-[38px] tabular-nums text-gray-900 outline-none'
                  : 'box-border h-[38px] w-full rounded-t-[10px] border border-b-0 border-[#D8D8D8] bg-white pr-[13px] text-right text-sm font-medium leading-[38px] tabular-nums text-gray-900 outline-none focus:border-purple-500'
            }
          />
          {disabled ? null : (
            <div className="flex h-[6px] gap-px">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className={`min-w-0 flex-1 ${index === 0 ? 'rounded-bl-[10px]' : ''} ${
                    index === 2 ? 'rounded-br-[10px]' : ''
                  } ${index < filled ? 'bg-[#60A876]' : 'bg-[#E2E3E9]'}`}
                />
              ))}
            </div>
          )}
        </div>
        {onBarsClick ? (
          <button
            type="button"
            onClick={onBarsClick}
            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-gray-100 ${
              barsActive ? 'bg-gray-100' : ''
            }`}
            aria-label="Выбор позиций в поиске"
            aria-expanded={barsActive}
          >
            {bars}
          </button>
        ) : (
          bars
        )}
      </div>
      {disabled ? null : (
        <div className="mt-[3px] w-[140px] text-center text-[12px] leading-4 text-[#76757C]">
          {caption}
        </div>
      )}
    </div>
  );
}
