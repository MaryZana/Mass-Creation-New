import React from 'react';

export const PRODUCT_BID_INPUT_WIDTH_CLASS = 'w-[5.75rem]';

export function ProductBidField({
  value,
  onChange,
  onBlur,
  disabled = false,
  title,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <div
      title={title}
      className={`inline-flex h-9 ${PRODUCT_BID_INPUT_WIDTH_CLASS} items-center rounded-lg border px-2 ${
        disabled
          ? 'cursor-not-allowed border-gray-200 bg-gray-50'
          : 'border-gray-200 bg-white focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500'
      }`}
    >
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        readOnly={disabled}
        title={title}
        className={`min-w-0 flex-1 bg-transparent text-right text-sm tabular-nums outline-none ${
          disabled ? 'cursor-not-allowed text-gray-500' : 'text-gray-900'
        }`}
      />
      <span className={`shrink-0 pl-0.5 text-sm ${disabled ? 'text-gray-300' : 'text-gray-400'}`}>₽</span>
    </div>
  );
}
