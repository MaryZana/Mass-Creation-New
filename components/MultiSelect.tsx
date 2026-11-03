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
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [tempSelected, setTempSelected] = useState<string[]>([]);
  const [menuPos, setMenuPos] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight?: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isChips = variant === 'chipsAction';

  const placeCursorAtEnd = () => {
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      const len = el.value.length;
      el.focus();
      el.setSelectionRange(len, len);
    });
  };

  useEffect(() => {
    if (isOpen) {
      setTempSelected([...selected]);
      if (!isChips) placeCursorAtEnd();
    } else {
      setSearchTerm('');
      setIsSearching(false);
    }
  }, [isOpen, selected, isChips]);

  useLayoutEffect(() => {
    if (!isOpen || !containerRef.current) {
      setMenuPos(null);
      return;
    }
    const update = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(
        isChips ? Math.max(rect.width, 220) : rect.width,
        window.innerWidth - 16,
      );
      let left = rect.left;
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
      const gap = 4;
      const viewportPad = 12;
      const spaceBelow = window.innerHeight - rect.bottom - gap - viewportPad;
      const spaceAbove = rect.top - gap - viewportPad;
      const preferBelow = spaceBelow >= 220 || spaceBelow >= spaceAbove;
      const available = preferBelow ? spaceBelow : spaceAbove;
      const maxHeight = Math.min(320, Math.max(120, available));
      const top = preferBelow
        ? Math.min(rect.bottom + gap, window.innerHeight - maxHeight - viewportPad)
        : Math.max(viewportPad, rect.top - gap - maxHeight);
      setMenuPos({ top, left, width, maxHeight });
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

  const labelsForDisplay = isOpen ? tempSelected : selected;

  const displayValue = useMemo(() => {
    if (labelsForDisplay.length === 0) return null;

    if (labelsForDisplay.length > 2) {
      const firstTwo = labelsForDisplay.slice(0, 2).join(', ');
      return `${firstTwo}, +${labelsForDisplay.length - 2}`;
    }

    return labelsForDisplay.join(', ');
  }, [labelsForDisplay]);

  const filteredOptions = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return options;
    return options.filter((option) => option.toLowerCase().includes(term));
  }, [options, searchTerm]);

  const hasSelection = selected.length > 0;

  const chipsTriggerClass = disabled
    ? 'cursor-not-allowed bg-[#EFEFF3] text-gray-400'
    : 'cursor-pointer bg-white text-gray-900 hover:bg-[#F7F7F8]';

  const fieldTriggerClass = disabled
    ? 'cursor-not-allowed border-transparent bg-[#EFEFF3] text-gray-400'
    : muted
      ? `border-transparent bg-[#F2F2F7] hover:bg-[#EBEBF0] ${
          isOpen ? 'border-black bg-white ring-0' : ''
        }`
      : `border-transparent bg-white shadow-[inset_0_0_0_1px_#E3E4E9] hover:shadow-[inset_0_0_0_1px_#C8C9D0] ${
          isOpen ? 'shadow-[inset_0_0_0_1px_#000] ring-0' : ''
        }`;

  const triggerValue = isSearching ? searchTerm : displayValue || '';
  const triggerPlaceholder = placeholder;

  return (
    <div className={`relative ${className ?? ''}`} ref={containerRef}>
      {isChips ? (
        <button
          type="button"
          disabled={disabled}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`inline-flex h-9 w-full items-center justify-between gap-1.5 rounded-xl border-0 px-3 text-sm font-medium transition-colors ${chipsTriggerClass}`}
        >
          <span
            className={`min-w-0 truncate ${
              disabled
                ? 'text-gray-400'
                : displayValue
                  ? 'font-medium text-gray-900'
                  : 'font-medium text-gray-900'
            }`}
          >
            {displayValue || placeholder}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1">
            {hasSelection ? (
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
      ) : (
        <div
          className={`flex w-full min-h-[44px] items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-all ${fieldTriggerClass}`}
          onClick={() => {
            if (disabled) return;
            setIsOpen(true);
            placeCursorAtEnd();
          }}
        >
          <input
            ref={inputRef}
            type="text"
            disabled={disabled}
            value={triggerValue}
            placeholder={triggerPlaceholder}
            onChange={(e) => {
              const next = e.target.value;
              if (!isSearching) {
                if (next === (displayValue || '')) return;
                setIsSearching(true);
              }
              setSearchTerm(next);
              if (!isOpen) setIsOpen(true);
            }}
            onKeyDown={(e) => {
              if (isSearching || disabled) return;
              if (e.key === 'Backspace' || e.key === 'Delete') {
                e.preventDefault();
                setIsSearching(true);
                setSearchTerm('');
                setIsOpen(true);
                return;
              }
              if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                setIsSearching(true);
                setSearchTerm(e.key);
                setIsOpen(true);
              }
            }}
            onFocus={() => {
              if (disabled) return;
              setIsOpen(true);
              placeCursorAtEnd();
            }}
            className={`min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-500 disabled:cursor-not-allowed ${
              disabled
                ? 'text-gray-400'
                : !isSearching && displayValue
                  ? 'font-medium text-gray-900'
                  : 'text-gray-900'
            }`}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            autoComplete="off"
          />
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-gray-900 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      )}

      {isOpen && !disabled && menuPos
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed z-[300] flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-100"
              style={{
                top: menuPos.top,
                left: menuPos.left,
                width: menuPos.width,
                maxHeight: menuPos.maxHeight,
              }}
            >
              <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar p-1">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => {
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
                <div className="flex shrink-0 items-center gap-2 border-t border-gray-100 bg-gray-50 p-2">
                  <button
                    type="button"
                    onClick={handleApply}
                    className="rounded-lg bg-black px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-[#1A1A1A]"
                  >
                    Применить
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                  >
                    Сбросить
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
