import React from 'react';

export const CABINETS = [
  { id: 'first', label: 'ООО «Первый»' },
  { id: 'second', label: 'ООО «Второй»' },
] as const;

export type CabinetId = (typeof CABINETS)[number]['id'];

type CabinetSwitcherProps = {
  value: CabinetId;
  onChange: (id: CabinetId) => void;
  className?: string;
};

export function CabinetSwitcher({ value, onChange, className = '' }: CabinetSwitcherProps) {
  return (
    <div
      className={`flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between ${className}`}
      aria-label="Выбор кабинета"
    >
      <p className="text-xs font-medium text-gray-500">Кабинет</p>
      <div className="inline-flex w-full max-w-full rounded-xl bg-gray-100/90 p-1 sm:w-auto" role="tablist">
        {CABINETS.map((cabinet) => {
          const active = value === cabinet.id;
          return (
            <button
              key={cabinet.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(cabinet.id)}
              className={`min-w-0 flex-1 truncate rounded-lg px-3 py-2 text-sm font-medium transition-all sm:flex-none sm:px-4 ${
                active
                  ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/80'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {cabinet.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
