import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, ThumbsUp, X } from './Icons';

export type BulkPaymentModelProduct = {
  id: string;
  name: string;
  nmId: number;
  imageUrl: string;
  category: string;
  cpcCompatible?: boolean;
  /** true — остатки 0 */
  zeroStock: boolean;
};

type PaymentModel = 'CPC' | 'CPM';

function productSummaryLabel(products: BulkPaymentModelProduct[]): string {
  if (products.length === 0) return 'Выберите товары';
  if (products.length === 1) return products[0]!.name;
  if (products.length === 2) return `${products[0]!.name}, ${products[1]!.name}`;
  return `${products[0]!.name}, ${products[1]!.name}, +${products.length - 2}`;
}

function categorySummaryLabel(categories: string[]): string {
  if (categories.length === 0) return 'Выберите категорию';
  if (categories.length === 1) return categories[0]!;
  if (categories.length === 2) return `${categories[0]}, ${categories[1]}`;
  return `${categories[0]}, ${categories[1]}, +${categories.length - 2}`;
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-purple-600' : 'bg-[#E5E5EA]'
      }`}
    >
      <span
        aria-hidden
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export function BulkPaymentModelModal({
  isOpen,
  products,
  onClose,
  onConfirm,
  title = 'Выберите модель оплаты',
  subtitle,
  withCategorySelect = false,
}: {
  isOpen: boolean;
  products: BulkPaymentModelProduct[];
  onClose: () => void;
  onConfirm: (payload: {
    products: BulkPaymentModelProduct[];
    paymentModel: PaymentModel;
    zones: { search: boolean; recommendations: boolean };
  }) => void;
  title?: string;
  subtitle?: string;
  /** Первый селект — категории, второй — товары */
  withCategorySelect?: boolean;
}) {
  const categories = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const p of products) {
      const cat = p.category?.trim() || 'Без категории';
      if (seen.has(cat)) continue;
      seen.add(cat);
      list.push(cat);
    }
    return list;
  }, [products]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>(categories);
  const [selected, setSelected] = useState<BulkPaymentModelProduct[]>(products);
  const [paymentModel, setPaymentModel] = useState<PaymentModel>('CPC');
  const [zones, setZones] = useState({ search: true, recommendations: true });
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const productsInCategories = useMemo(() => {
    if (!withCategorySelect) return products;
    if (selectedCategories.length === 0) return [];
    const allowed = new Set(selectedCategories);
    return products.filter((p) => allowed.has(p.category?.trim() || 'Без категории'));
  }, [withCategorySelect, products, selectedCategories]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedCategories(categories);
    setSelected(products);
    setPaymentModel('CPC');
    setZones({ search: true, recommendations: true });
    setCategoryOpen(false);
    setListOpen(false);
  }, [isOpen, products, categories]);

  useEffect(() => {
    if (!withCategorySelect) return;
    setSelected((prev) => {
      const allowedIds = new Set(productsInCategories.map((p) => p.id));
      const kept = prev.filter((p) => allowedIds.has(p.id));
      if (kept.length > 0) return kept;
      return productsInCategories;
    });
  }, [withCategorySelect, productsInCategories]);

  useEffect(() => {
    if (!categoryOpen && !listOpen) return;
    const onDocMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (categoryOpen && !categoryRef.current?.contains(target)) {
        setCategoryOpen(false);
      }
      if (listOpen && !listRef.current?.contains(target)) {
        setListOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [categoryOpen, listOpen]);

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        if (prev.length === 1) return prev;
        return prev.filter((c) => c !== category);
      }
      return [...prev, category];
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative m-auto flex w-full max-w-xl flex-col rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-payment-model-title"
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div className="min-w-0 flex-1">
            <h2
              id="bulk-payment-model-title"
              className="text-xl font-bold text-gray-900"
            >
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-2 mb-0 text-sm font-normal leading-snug text-gray-500">
                {subtitle}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1 text-gray-400 hover:text-gray-600"
            aria-label="Закрыть"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-5 px-6 pb-6 pt-4">
          {withCategorySelect ? (
            <div className="relative" ref={categoryRef}>
              <button
                type="button"
                onClick={() => {
                  setCategoryOpen((v) => !v);
                  setListOpen(false);
                }}
                className={`flex w-full min-h-[46px] items-center justify-between rounded-xl border bg-white px-3 py-2.5 text-left text-sm transition-colors ${
                  categoryOpen
                    ? 'border-purple-500 ring-1 ring-purple-500'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="truncate font-medium text-gray-900">
                  {categorySummaryLabel(selectedCategories)}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${
                    categoryOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {categoryOpen ? (
                <div className="absolute left-0 right-0 z-30 mt-1 max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                  {categories.map((category) => {
                    const checked = selectedCategories.includes(category);
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => toggleCategory(category)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-gray-50"
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                            checked
                              ? 'border-purple-600 bg-purple-600 text-white'
                              : 'border-gray-300 bg-white'
                          }`}
                          aria-hidden
                        >
                          {checked ? (
                            <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none">
                              <path
                                d="M2.5 6.2L4.8 8.5L9.5 3.5"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          ) : null}
                        </span>
                        <span className="truncate text-gray-900">{category}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="relative" ref={listRef}>
            <button
              type="button"
              onClick={() => {
                setListOpen((v) => !v);
                setCategoryOpen(false);
              }}
              className={`flex w-full min-h-[46px] items-center justify-between rounded-xl border bg-white px-3 py-2.5 text-left text-sm transition-colors ${
                listOpen
                  ? 'border-purple-500 ring-1 ring-purple-500'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="truncate font-medium text-gray-900">
                {productSummaryLabel(selected)}
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${
                  listOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {listOpen ? (
              <div className="absolute left-0 right-0 z-20 mt-1 max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                {productsInCategories.length === 0 ? (
                  <div className="px-3 py-3 text-sm text-gray-500">
                    Нет товаров в выбранных категориях
                  </div>
                ) : (
                  productsInCategories.map((product) => {
                    const isSelected = selected.some((p) => p.id === product.id);
                    return (
                      <div
                        key={product.id}
                        className="flex items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        <button
                          type="button"
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                          onClick={() => {
                            setSelected((prev) => {
                              if (isSelected) {
                                if (prev.length <= 1) return prev;
                                return prev.filter((p) => p.id !== product.id);
                              }
                              return [...prev, product];
                            });
                          }}
                        >
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                              isSelected
                                ? 'border-purple-600 bg-purple-600 text-white'
                                : 'border-gray-300 bg-white'
                            }`}
                            aria-hidden
                          >
                            {isSelected ? (
                              <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none">
                                <path
                                  d="M2.5 6.2L4.8 8.5L9.5 3.5"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            ) : null}
                          </span>
                          <img
                            src={product.imageUrl}
                            alt=""
                            className="h-8 w-7 shrink-0 rounded-md border border-gray-100 object-cover"
                          />
                          <span className="truncate text-gray-900">{product.name}</span>
                          {product.zeroStock ? (
                            <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700">
                              остатки 0
                            </span>
                          ) : null}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            ) : null}
          </div>

          <section>
            <h3 className="mb-3 text-base font-bold text-gray-900">Модель оплаты</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(
                [
                  {
                    id: 'CPC' as const,
                    label: 'Оплата за клики (CPC)',
                    subtitle: 'Вы платите за 1 клик',
                  },
                  {
                    id: 'CPM' as const,
                    label: 'Оплата за показы (CPM)',
                    subtitle: 'Вы платите за 1 000 показов',
                  },
                ] as const
              ).map((option) => {
                const selectedModel = paymentModel === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setPaymentModel(option.id)}
                    className={`flex items-start gap-3 rounded-2xl px-4 py-3.5 text-left transition-colors ${
                      selectedModel
                        ? 'bg-[#F3E8FF] ring-0'
                        : 'border border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 ${
                        selectedModel ? 'border-[#9A41FE]' : 'border-gray-300'
                      }`}
                      aria-hidden
                    >
                      {selectedModel ? (
                        <span className="h-2.5 w-2.5 rounded-full bg-[#9A41FE]" />
                      ) : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold leading-snug text-gray-900">
                        {option.label}
                      </span>
                      <span className="mt-0.5 block text-sm leading-snug text-gray-500">
                        {option.subtitle}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-base font-bold text-gray-900">Зоны показа</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <ToggleSwitch
                    checked={zones.search}
                    onChange={(checked) => {
                      setZones((prev) => {
                        const next = { ...prev, search: checked };
                        if (!next.search && !next.recommendations) {
                          return { ...prev, search: true };
                        }
                        return next;
                      });
                    }}
                  />
                  <span className="text-sm font-medium text-gray-900">Поиск</span>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-gray-400">
                  <Search className="h-4 w-4" />
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <ToggleSwitch
                    checked={zones.recommendations}
                    onChange={(checked) => {
                      setZones((prev) => {
                        const next = { ...prev, recommendations: checked };
                        if (!next.search && !next.recommendations) {
                          return { ...prev, recommendations: true };
                        }
                        return next;
                      });
                    }}
                  />
                  <span className="text-sm font-medium text-gray-900">Рекомендации</span>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-gray-400">
                  <ThumbsUp className="h-4 w-4" />
                </span>
              </div>
            </div>
          </section>
        </div>

        <div className="flex items-center gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            disabled={selected.length === 0}
            onClick={() =>
              onConfirm({
                products: selected,
                paymentModel,
                zones,
              })
            }
            className="rounded-lg bg-[#9A41FE] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#8A35EE] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Добавить
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-200"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
