import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Checkbox } from 'antd';
import { ChevronDown } from './Icons';

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  autoApply?: boolean;
  /** Серый fill-триггер field-варианта */
  muted?: boolean;
  /**
   * field — RITM select (высота 44)
   * chipsAction — RITM Chips Action (компактный чип-фильтр)
   */
  variant?: 'field' | 'chipsAction';
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selected,
  onChange,
  placeholder = 'Выберите категории',
  className,
  disabled = false,
  autoApply = false,
  muted = false,
  variant = 'field',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempSelected, setTempSelected] = useState<string[]>([]);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isChips = variant === 'chipsAction';

  useEffect(() => {
    if (isOpen) {
      setTempSelected([...selected]);
    }
  }, [isOpen, selected]);

  useLayoutEffect(() => {
    if (!isOpen || !containerRef.current) {
      setMenuPos(null);
      return;
    }
    const update = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = isChips ? Math.max(rect.width, 220) : rect.width;
      let left = rect.left;
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
      setMenuPos({ top: rect.bottom + 4, left, width });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [isOpen, isChips]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleOption = (option: string) => {
    const newSelection = tempSelected.includes(option)
      ? tempSelected.filter((item) => item !== option)
      : [...tempSelected, option];
    setTempSelected(newSelection);
    if (autoApply) {
      onChange(newSelection);
    }
  };

  const handleApply = () => {
    onChange(tempSelected);
    setIsOpen(false);
  };

  const handleReset = () => {
    setTempSelected([]);
    if (autoApply) onChange([]);
  };

  const displayValue = useMemo(() => {
    if (selected.length === 0) return null;

    if (selected.length > 2) {
      const firstTwo = selected.slice(0, 2).join(', ');
      const remaining = selected.length - 2;
      return `${firstTwo}, +${remaining}`;
    }

    return selected.join(', ');
  }, [selected]);

  const hasSelection = selected.length > 0;

  const chipsTriggerClass = disabled
    ? 'cursor-not-allowed bg-[#EFEFF3] text-gray-400'
    : 'cursor-pointer bg-white text-gray-900 hover:bg-[#F7F7F8]';

  const fieldTriggerClass = disabled
    ? 'cursor-not-allowed border-transparent bg-[#EFEFF3] text-gray-400'
    : muted
      ? `cursor-pointer border-transparent bg-[#F2F2F7] hover:bg-[#EBEBF0] ${
          isOpen ? 'border-black bg-white ring-0' : ''
        }`
      : `cursor-pointer border-transparent bg-white shadow-[inset_0_0_0_1px_#E3E4E9] hover:shadow-[inset_0_0_0_1px_#C8C9D0] ${
          isOpen ? 'shadow-[inset_0_0_0_1px_#000] ring-0' : ''
        }`;

  return (
    <div className={`relative ${className ?? ''}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={
          isChips
            ? `inline-flex h-9 w-full items-center justify-between gap-1.5 rounded-xl border-0 px-3 text-sm font-medium transition-colors ${chipsTriggerClass}`
            : `flex w-full min-h-[44px] items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-all ${fieldTriggerClass}`
        }
      >
        <span
          className={`min-w-0 truncate ${
            disabled
              ? 'text-gray-400'
              : displayValue
                ? 'font-medium text-gray-900'
                : isChips
                  ? 'font-medium text-gray-900'
                  : 'text-gray-500'
          }`}
        >
          {displayValue || placeholder}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1">
          {isChips && hasSelection ? (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-[#F2F2F7] px-1.5 text-[11px] font-semibold tabular-nums text-gray-700">
              {selected.length}
            </span>
          ) : null}
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </span>
      </button>

      {isOpen && !disabled && menuPos
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed z-[300] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-100"
              style={{
                top: menuPos.top,
                left: menuPos.left,
                width: menuPos.width,
              }}
            >
              <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                {options.length > 0 ? (
                  options.map((option) => {
                    const isSelected = tempSelected.includes(option);
                    return (
                      <div
                        key={option}
                        onClick={() => toggleOption(option)}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50"
                      >
                        <Checkbox
                          checked={isSelected}
                          className="flex items-center justify-center"
                        />
                        <span
                          className={`text-sm ${
                            isSelected ? 'font-medium text-gray-900' : 'text-gray-700'
                          }`}
                        >
                          {option}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-sm text-gray-400">Ничего не найдено</div>
                )}
              </div>

              {!autoApply && (
                <div className="flex items-center justify-between gap-2 border-t border-gray-100 bg-gray-50 p-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                  >
                    Сбросить
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    className="rounded-lg bg-black px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-[#1A1A1A]"
                  >
                    Применить
                  </button>
                </div>
              )}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
};
