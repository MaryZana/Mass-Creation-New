import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Checkbox } from 'antd';
import { ChevronDown, ChevronRight, Search } from './Icons';
import { CampaignRecord } from '../types';

type SelectableProduct = Pick<CampaignRecord, 'nmId' | 'productName' | 'imageUrl' | 'category' | 'cpcCompatible'>;

const getPlural = (number: number, one: string, two: string, five: string) => { let n = Math.abs(number); n %= 100; if (n >= 5 && n <= 20) { return five; } n %= 10; if (n === 1) { return one; } if (n >= 2 && n <= 4) { return two; } return five; };

interface ProductMultiSelectProps {
  options: SelectableProduct[];
  selected: SelectableProduct[];
  onChange: (selected: SelectableProduct[]) => void;
  isCpcMode: boolean;
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
  isCpcMode,
  disabled = false,
  placeholder = 'Выберите товары',
  className,
  submitLabel = 'Применить',
  singleSelect = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  
  const [tempSelected, setTempSelected] = useState<SelectableProduct[]>([]);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTempSelected([...selected]);
      setSearchTerm('');
      setCollapsedCategories(new Set());
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
      setMenuPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
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
    setTempSelected(prev => 
      prev.some(p => p.nmId === product.nmId)
        ? prev.filter(p => p.nmId !== product.nmId)
        : [...prev, product]
    );
    }
  };

  const handleApply = () => {
    onChange(tempSelected);
    setIsOpen(false);
  };

  const handleReset = () => {
    setTempSelected([]);
  };

  const filteredOptions = useMemo(() => {
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

  const displayValue = useMemo(() => {
    if (selected.length === 0) return null;
    
    if (selected.length > 2) {
      const first = selected[0].productName;
      const remaining = selected.length - 1;
      return `${first}, +${remaining}`;
    }
    
    return selected.map(p => p.productName).join(', ');
  }, [selected]);
  
  const selectableFilteredOptions = useMemo(() => {
      return filteredOptions.filter(p => !(isCpcMode && !p.cpcCompatible));
  }, [filteredOptions, isCpcMode]);

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
    const selectable = products.filter(p => !(isCpcMode && !p.cpcCompatible));
    return selectable.length > 0 && selectable.every(p => tempSelected.some(sp => sp.nmId === p.nmId));
  };

  const isGroupIndeterminate = (category: string) => {
    const products = groupedByCategory.find(g => g.category === category)?.products ?? [];
    const selectable = products.filter(p => !(isCpcMode && !p.cpcCompatible));
    const selectedCount = selectable.filter(p => tempSelected.some(sp => sp.nmId === p.nmId)).length;
    return selectedCount > 0 && selectedCount < selectable.length;
  };

  const handleSelectGroup = (category: string, checked: boolean) => {
    const products = groupedByCategory.find(g => g.category === category)?.products ?? [];
    const selectable = products.filter(p => !(isCpcMode && !p.cpcCompatible));
    const ids = new Set(selectable.map(p => p.nmId));
    if (singleSelect) {
      if (checked && selectable.length > 0) setTempSelected([selectable[0]]);
      else if (!checked) setTempSelected(prev => prev.filter(p => !ids.has(p.nmId)));
    } else {
      if (checked) {
        setTempSelected(prev => {
          const existing = new Set(prev.map(p => p.nmId));
          const toAdd = selectable.filter(p => !existing.has(p.nmId));
          return [...prev, ...toAdd];
        });
      } else {
        setTempSelected(prev => prev.filter(p => !ids.has(p.nmId)));
      }
    }
  };

  const areAllFilteredSelected = useMemo(() => {
      if (selectableFilteredOptions.length === 0) return false;
      return selectableFilteredOptions.every(p => tempSelected.some(sp => sp.nmId === p.nmId));
  }, [selectableFilteredOptions, tempSelected]);

  const handleSelectAll = () => {
      if (singleSelect) {
          if (areAllFilteredSelected) {
              setTempSelected([]);
          } else {
              // Выбираем только первый товар из списка
              if (selectableFilteredOptions.length > 0) {
                  setTempSelected([selectableFilteredOptions[0]]);
              }
          }
      } else {
      if (areAllFilteredSelected) {
          setTempSelected(prev => prev.filter(p => !selectableFilteredOptions.some(fo => fo.nmId === p.nmId)));
      } else {
          const newSelections = selectableFilteredOptions.filter(fo => !tempSelected.some(ts => ts.nmId === fo.nmId));
          setTempSelected(prev => [...prev, ...newSelections]);
          }
      }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full min-h-[46px] px-3 py-2.5 bg-white border rounded-lg text-sm flex items-center justify-between transition-all
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'}
          ${isOpen ? 'border-purple-500 ring-1 ring-purple-500' : 'border-gray-200 hover:border-gray-300'}
        `}
      >
        <span className={`${displayValue ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
          {/* FIX: Updated placeholder text for disabled state to be more informative. */}
          {disabled ? 'Сначала выберите категорию' : displayValue || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && menuPos
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
              <div className="p-3 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    autoFocus
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Поиск по названию или ID (через запятую)"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-colors"
                  />
                </div>
                <div
                  onClick={handleSelectAll}
                  className="flex items-center gap-3 px-2 py-2 mt-2 hover:bg-purple-50 rounded-lg cursor-pointer group transition-colors"
                >
                  <Checkbox checked={areAllFilteredSelected} className="shrink-0" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    Выбрать все
                  </span>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                {filteredOptions.length > 0 ? (
                  showGrouped ? (
                    groupedByCategory.map(({ category, products }) => {
                      const selectableInGroup = products.filter(
                        (p) => !(isCpcMode && !p.cpcCompatible),
                      );
                      const selectedInGroup = selectableInGroup.filter((p) =>
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
                                  ? `${selectedInGroup} / ${selectableInGroup.length}`
                                  : selectableInGroup.length}{' '}
                                {getPlural(selectableInGroup.length, 'товар', 'товара', 'товаров')}
                              </span>
                            </div>
                          </div>
                          {!isCollapsed && (
                            <div className="mt-0.5 ml-2 pl-1 border-l border-gray-200 space-y-0.5">
                              {products.map((p) => {
                                const isSelected = tempSelected.some((sp) => sp.nmId === p.nmId);
                                const isIncompatible = isCpcMode && !p.cpcCompatible;
                                return (
                                  <div
                                    key={p.nmId}
                                    onClick={() => !isIncompatible && toggleOption(p)}
                                    className={`flex items-center gap-3 px-2 py-2 rounded-lg transition-colors ${isIncompatible ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:bg-purple-50 cursor-pointer group'}`}
                                  >
                                    <Checkbox
                                      checked={isSelected && !isIncompatible}
                                      disabled={isIncompatible}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={() => !isIncompatible && toggleOption(p)}
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
                                        className={`text-sm truncate ${isSelected && !isIncompatible ? 'text-gray-900 font-medium' : 'text-gray-700'}`}
                                      >
                                        {p.productName}
                                      </p>
                                      <div className="flex items-center gap-2">
                                        <p className="text-xs text-gray-500">ID {p.nmId}</p>
                                        {isIncompatible && (
                                          <span className="text-xs text-red-600 font-medium">
                                            не продвигается по СPC
                                          </span>
                                        )}
                                      </div>
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
                      const isIncompatible = isCpcMode && !p.cpcCompatible;
                      return (
                        <div
                          key={p.nmId}
                          onClick={() => !isIncompatible && toggleOption(p)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isIncompatible ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:bg-purple-50 cursor-pointer group'}`}
                        >
                          <Checkbox
                            checked={isSelected && !isIncompatible}
                            disabled={isIncompatible}
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
                              className={`text-sm ${isSelected && !isIncompatible ? 'text-gray-900 font-medium' : 'text-gray-700'}`}
                            >
                              {p.productName}
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-gray-500">ID {p.nmId}</p>
                              {isIncompatible && (
                                <span className="text-xs text-red-600 font-medium">
                                  не продвигается по СPC
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )
                ) : (
                  <div className="p-4 text-center text-sm text-gray-400">Товары не найдены</div>
                )}
              </div>

              <div className="bg-[#fafafa] border-t border-gray-100 p-3 flex items-center justify-between gap-3 mt-1">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Сбросить
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-6 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-all"
                >
                  {tempSelected.length > 0
                    ? `Добавить ${tempSelected.length} ${getPlural(tempSelected.length, 'товар', 'товара', 'товаров')}`
                    : submitLabel}
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
};