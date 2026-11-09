import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Checkbox } from 'antd';
import { ChevronDown, ChevronRight } from './Icons';
import { CampaignRecord } from '../types';

type SelectableProduct = Pick<CampaignRecord, 'nmId' | 'productName' | 'imageUrl' | 'category' | 'cpcCompatible'>;

const MAX_PRODUCTS = 100;

const getPlural = (number: number, one: string, two: string, five: string) => { let n = Math.abs(number); n %= 100; if (n >= 5 && n <= 20) { return five; } n %= 10; if (n === 1) { return one; } if (n >= 2 && n <= 4) { return two; } return five; };

interface ProductMultiSelectProps {
  options: SelectableProduct[];
  selected: SelectableProduct[];
  onChange: (selected: SelectableProduct[]) => void;
  /** @deprecated все товары доступны в CPC */
  isCpcMode?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  submitLabel?: string;
  singleSelect?: boolean;
}

export const ProductMultiSelect: React.FC<ProductMultiSelectProps> = ({
  options,
  selected,
  onChange,
  disabled = false,
  placeholder = 'Выберите товары',
  className,
  submitLabel = 'Применить',
  singleSelect = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [pickTab, setPickTab] = useState<'all' | 'promising'>('all');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  
  const [tempSelected, setTempSelected] = useState<SelectableProduct[]>([]);
  const [menuPos, setMenuPos] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      setPickTab('all');
      setCollapsedCategories(new Set());
      placeCursorAtEnd();
    } else {
      setSearchTerm('');
      setIsSearching(false);
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
      const gap = 4;
      const viewportPad = 12;
      const spaceBelow = window.innerHeight - rect.bottom - gap - viewportPad;
      const spaceAbove = rect.top - gap - viewportPad;
      const preferBelow = spaceBelow >= 280 || spaceBelow >= spaceAbove;
      const maxHeight = Math.max(220, Math.min(480, preferBelow ? spaceBelow : spaceAbove));
      const top = preferBelow
        ? rect.bottom + gap
        : Math.max(viewportPad, rect.top - gap - maxHeight);
      setMenuPos({ top, left: rect.left, width: rect.width, maxHeight });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [isOpen]);

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

  const toggleOption = (product: SelectableProduct) => {
    if (singleSelect) {
      setTempSelected(prev => {
        // Если товар уже выбран, снимаем выбор
        if (prev.some(p => p.nmId === product.nmId)) {
          return prev.filter(p => p.nmId !== product.nmId);
        }
        // Иначе выбираем только этот товар (заменяем предыдущий выбор)
        return [product];
      });
    } else {
    setTempSelected(prev => {
      if (prev.some(p => p.nmId === product.nmId)) {
        return prev.filter(p => p.nmId !== product.nmId);
      }
      if (prev.length >= MAX_PRODUCTS) return prev;
      return [...prev, product];
    });
    }
  };

  const handleApply = () => {
    onChange(tempSelected);
    setIsOpen(false);
  };

  const handleReset = () => {
    setTempSelected([]);
  };

  const searchedOptions = useMemo(() => {
      const term = searchTerm.toLowerCase().trim();
      if (!term) return options;

      // Check for comma-separated IDs
      if (term.includes(',')) {
        const ids = term.split(',').map(s => s.trim()).filter(s => s);
        if (ids.length > 0) {
           return options.filter(opt => ids.includes(String(opt.nmId)));
        }
      }

      // Default search: Name or ID
      return options.filter(opt => 
          opt.productName.toLowerCase().includes(term) ||
          opt.nmId.toString().includes(term)
      );
  }, [options, searchTerm]);

  const isPromisingProduct = (p: SelectableProduct) => p.nmId % 5 === 0;

  const allTabCount = searchedOptions.length;
  const promisingTabCount = useMemo(
    () => searchedOptions.filter(isPromisingProduct).length,
    [searchedOptions],
  );

  const filteredOptions = useMemo(() => {
    if (pickTab === 'promising') {
      return searchedOptions.filter(isPromisingProduct);
    }
    return searchedOptions;
  }, [searchedOptions, pickTab]);

  const labelsForDisplay = isOpen ? tempSelected : selected;

  const displayValue = useMemo(() => {
    if (labelsForDisplay.length === 0) return null;

    if (labelsForDisplay.length > 2) {
      const firstTwo = labelsForDisplay
        .slice(0, 2)
        .map((p) => p.productName)
        .join(', ');
      return `${firstTwo}, +${labelsForDisplay.length - 2}`;
    }

    return labelsForDisplay.map((p) => p.productName).join(', ');
  }, [labelsForDisplay]);
  
  const groupedByCategory = useMemo(() => {
    const groups: { category: string; products: SelectableProduct[] }[] = [];
    const byCat = new Map<string, SelectableProduct[]>();
    for (const p of filteredOptions) {
      const list = byCat.get(p.category) || [];
      list.push(p);
      byCat.set(p.category, list);
    }
    byCat.forEach((products, category) => groups.push({ category, products }));
    return groups.sort((a, b) => a.category.localeCompare(b.category));
  }, [filteredOptions]);

  const showGrouped = groupedByCategory.length >= 2;

  const toggleCategoryCollapsed = (category: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const isGroupAllSelected = (category: string) => {
    const products = groupedByCategory.find(g => g.category === category)?.products ?? [];
    return products.length > 0 && products.every(p => tempSelected.some(sp => sp.nmId === p.nmId));
  };

  const isGroupIndeterminate = (category: string) => {
    const products = groupedByCategory.find(g => g.category === category)?.products ?? [];
    const selectedCount = products.filter(p => tempSelected.some(sp => sp.nmId === p.nmId)).length;
    return selectedCount > 0 && selectedCount < products.length;
  };

  const handleSelectGroup = (category: string, checked: boolean) => {
    const products = groupedByCategory.find(g => g.category === category)?.products ?? [];
    const ids = new Set(products.map(p => p.nmId));
    if (singleSelect) {
      if (checked && products.length > 0) setTempSelected([products[0]]);
      else if (!checked) setTempSelected(prev => prev.filter(p => !ids.has(p.nmId)));
    } else {
      if (checked) {
        setTempSelected(prev => {
          const existing = new Set(prev.map(p => p.nmId));
          const room = Math.max(0, MAX_PRODUCTS - prev.length);
          const toAdd = products.filter(p => !existing.has(p.nmId)).slice(0, room);
          return [...prev, ...toAdd];
        });
      } else {
        setTempSelected(prev => prev.filter(p => !ids.has(p.nmId)));
      }
    }
  };

  const triggerValue = isSearching ? searchTerm : displayValue || '';
  const triggerPlaceholder = disabled
    ? 'Сначала выберите категорию'
    : placeholder;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div
        className={`flex w-full min-h-[44px] items-center gap-2 rounded-xl border bg-white px-3 py-2.5 text-sm transition-all ${
          disabled ? 'cursor-not-allowed bg-gray-100' : ''
        } ${
          isOpen
            ? 'border-black ring-0'
            : 'border-transparent shadow-[inset_0_0_0_1px_#E3E4E9] hover:shadow-[inset_0_0_0_1px_#C8C9D0]'
        }`}
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
            !isSearching && displayValue ? 'font-medium text-gray-900' : 'text-gray-900'
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

      {isOpen && menuPos
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
              <div className="shrink-0 border-b border-gray-100 p-3">
                <div
                  className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-lg bg-gray-100 p-1"
                  role="tablist"
                  aria-label="Подборки товаров"
                >
                  {(
                    [
                      { id: 'all' as const, label: 'Все', count: allTabCount },
                      {
                        id: 'promising' as const,
                        label: 'Перспективные',
                        count: promisingTabCount,
                      },
                    ] as const
                  ).map((tab) => {
                    const active = pickTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setPickTab(tab.id)}
                        className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                          active
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {tab.label}{' '}
                        <span className="tabular-nums text-gray-500">{tab.count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar p-1">
                {filteredOptions.length > 0 ? (
                  showGrouped ? (
                    groupedByCategory.map(({ category, products }) => {
                      const selectedInGroup = products.filter((p) =>
                        tempSelected.some((sp) => sp.nmId === p.nmId),
                      ).length;
                      const isCollapsed = collapsedCategories.has(category);
                      const groupChecked = isGroupAllSelected(category);
                      const groupIndeterminate = isGroupIndeterminate(category);
                      return (
                        <div key={category} className="mb-2 last:mb-0">
                          <div
                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50/80 hover:bg-gray-100/80 border border-gray-100"
                            onClick={(e) => {
                              if ((e.target as HTMLElement).closest('button, [role="checkbox"]'))
                                return;
                              toggleCategoryCollapsed(category);
                            }}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCategoryCollapsed(category);
                              }}
                              className="p-0.5 -ml-0.5 text-gray-500 hover:text-gray-700 shrink-0"
                              aria-label={isCollapsed ? 'Развернуть' : 'Свернуть'}
                            >
                              {isCollapsed ? (
                                <ChevronRight className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectGroup(category, !groupChecked);
                              }}
                              className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                            >
                              <Checkbox
                                checked={groupChecked}
                                indeterminate={groupIndeterminate}
                                onClick={(e) => e.stopPropagation()}
                                onChange={() => handleSelectGroup(category, !groupChecked)}
                                className="shrink-0"
                              />
                              <span className="text-sm font-medium text-gray-800 truncate">
                                {category}
                              </span>
                              <span className="text-xs text-gray-500 shrink-0">
                                {selectedInGroup > 0
                                  ? `${selectedInGroup} / ${products.length}`
                                  : products.length}{' '}
                                {getPlural(products.length, 'товар', 'товара', 'товаров')}
                              </span>
                            </div>
                          </div>
                          {!isCollapsed && (
                            <div className="mt-0.5 ml-2 pl-1 border-l border-gray-200 space-y-0.5">
                              {products.map((p) => {
                                const isSelected = tempSelected.some((sp) => sp.nmId === p.nmId);
                                return (
                                  <div
                                    key={p.nmId}
                                    onClick={() => toggleOption(p)}
                                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-purple-50 group"
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={() => toggleOption(p)}
                                      className="shrink-0"
                                    />
                                    <div className="relative group/image">
                                      <img
                                        src={p.imageUrl}
                                        alt={p.productName}
                                        className="w-8 h-8 rounded-md shrink-0 object-cover"
                                      />
                                      <div className="hidden group-hover/image:block absolute left-full top-0 ml-2 z-[120] w-20 aspect-[3/4] bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden pointer-events-none">
                                        <img
                                          src={p.imageUrl}
                                          alt={p.productName}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    </div>
                                    <div className="min-w-0">
                                      <p
                                        className={`text-sm truncate ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-700'}`}
                                      >
                                        {p.productName}
                                      </p>
                                      <p className="text-xs text-gray-500">ID {p.nmId}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    filteredOptions.map((p) => {
                      const isSelected = tempSelected.some((sp) => sp.nmId === p.nmId);
                      return (
                        <div
                          key={p.nmId}
                          onClick={() => toggleOption(p)}
                          className="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-purple-50"
                        >
                          <Checkbox
                            checked={isSelected}
                            className="shrink-0"
                          />
                          <div className="relative group/image">
                            <img
                              src={p.imageUrl}
                              alt={p.productName}
                              className="w-8 h-8 rounded-md shrink-0 object-cover"
                            />
                            <div className="hidden group-hover/image:block absolute left-full top-0 ml-2 z-[120] w-20 aspect-[3/4] bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden pointer-events-none">
                              <img
                                src={p.imageUrl}
                                alt={p.productName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                          <div>
                            <p
                              className={`text-sm ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-700'}`}
                            >
                              {p.productName}
                            </p>
                            <p className="text-xs text-gray-500">ID {p.nmId}</p>
                          </div>
                        </div>
                      );
                    })
                  )
                ) : (
                  <div className="p-4 text-center text-sm text-gray-400">Товары не найдены</div>
                )}
              </div>

              <div className="mt-auto flex shrink-0 items-center gap-2 border-t border-gray-100 bg-[#fafafa] p-3">
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={tempSelected.length === 0}
                  className="rounded-lg bg-black px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-[#1A1A1A] disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {submitLabel}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Сбросить
                </button>
                <span className="ml-auto text-sm tabular-nums text-gray-500">
                  {tempSelected.length} / {MAX_PRODUCTS}
                </span>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
};