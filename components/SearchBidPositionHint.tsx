import React from 'react';
import {
  BID_CHASING_POSITION_OPTIONS,
  bidChasingPositionOption,
  type BidChasingRange,
} from '../utils/cpcBidChasingPositionTiers';
import { PRODUCT_BID_INPUT_WIDTH_CLASS } from './ProductBidField';

/** Три сегмента позиций под полем ставки в поиске (когда автобиддер выключен) */
export function SearchBidPositionHint({
  selectedPosition,
  onSelectPosition,
}: {
  selectedPosition: BidChasingRange;
  onSelectPosition: (position: BidChasingRange) => void;
}) {
  const active = bidChasingPositionOption(selectedPosition);
  return (
    <div className={`mt-1.5 ${PRODUCT_BID_INPUT_WIDTH_CLASS}`}>
      <div
        className="flex h-1 gap-px overflow-hidden rounded-full"
        role="group"
        aria-label="Позиция в поиске"
      >
        {BID_CHASING_POSITION_OPTIONS.map((tier) => {
          const selected = selectedPosition === tier.id;
          return (
            <button
              key={tier.id}
              type="button"
              onClick={() => onSelectPosition(tier.id)}
              className={`h-full min-w-0 flex-1 rounded-sm transition-colors ${
                selected ? tier.segmentActiveClass : 'bg-gray-200 hover:bg-gray-300'
              }`}
              aria-label={tier.label}
              aria-pressed={selected}
            />
          );
        })}
      </div>
      <p className={`mt-1 text-[10px] leading-snug text-right font-medium ${active.labelTextClass}`}>
        {active.label}
      </p>
    </div>
  );
}
