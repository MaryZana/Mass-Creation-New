import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Checkbox } from 'antd';
import { Search, X, ChevronDown } from './Icons';
import {
  PRODUCT_TABLE_THUMB_FALLBACK,
  resolveProductTableThumbSrc,
} from './SuccessPageTestData';

const MAX_SELECT = 50;

export type SingleCampaignSelectableProduct = {
  nmId: number;
  productName: string;
  imageUrl: string;
  category: string;
  brand?: string;
  articleSeller?: string;
  cpcCompatible?: boolean;
  /** 0..1 */
  conversionRate?: number;
  /** change vs previous period, in percent (e.g. +10 means +10%) */
  conversionChangePercent?: number;
};

function ProductThumb({
  nmId,
  imageUrl,
  category,
  alt,
}: {
  nmId: number;
  imageUrl: string;
  category: string;
  alt: string;
}) {
  const id = String(nmId);
  const [url, setUrl] = useState(() => resolveProductTableThumbSrc(id, imageUrl, category));
  useEffect(() => {
    setUrl(resolveProductTableThumbSrc(id, imageUrl, category));
  }, [id, imageUrl, category]);
  return (
    <img
      src={url}
      alt={alt}
      width={30}
      height={38}
      className="h-[38px] w-[30px] shrink-0 rounded-md border border-gray-100 bg-gray-50 object-cover"
      loading="lazy"
      onError={() => {
        if (url !== PRODUCT_TABLE_THUMB_FALLBACK) setUrl(PRODUCT_TABLE_THUMB_FALLBACK);
      }}
    />
  );
}

export function SingleCampaignAddProductsModal({
  isOpen,
  onClose,
  options,
  alreadyAddedNmIds,
  onConfirm,
  isCpcMode,
}: {
  isOpen: boolean;
  onClose: () => void;
  options: SingleCampaignSelectableProduct[];
  alreadyAddedNmIds: Set<number>;
  onConfirm: (selected: SingleCampaignSelectableProduct[]) => void;
  isCpcMode: boolean;
}) {
  const categories = useMemo(() => {
    const set = new Set(options.map((p) => p.category));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'));
  }, [options]);

  const [category, setCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pending, setPending] = useState<SingleCampaignSelectableProduct[]>([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortKey, setSortKey] = useState<'conversion' | 'stalePromotion' | 'highSeason'>('conversion');
  const sortButtonRef = useRef<HTMLButtonElement | null>(null);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSearchTerm('');
    setPending([]);
    setCategoryOpen(false);
    setSortOpen(false);
    setSortKey('conversion');
    // Изначально категория не выбрана
    setCategory('');
  }, [isOpen, categories]);

  const categoryProducts = useMemo(() => {
    if (!category) return [];
    return options.filter((p) => p.category === category);
  }, [options, category]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return categoryProducts;
    if (term.includes(',')) {
      const ids = term.split(',').map((s) => s.trim()).filter(Boolean);
      if (ids.length > 0) {
        return categoryProducts.filter((p) => ids.includes(String(p.nmId)));
      }
    }
    return categoryProducts.filter(
      (p) =>
        p.productName.toLowerCase().includes(term) ||
        String(p.nmId).includes(term) ||
        (p.articleSeller ?? '').toLowerCase().includes(term) ||
        (p.brand ?? '').toLowerCase().includes(term),
    );
  }, [categoryProducts, searchTerm]);

  const sortedFilteredProducts = useMemo(() => {
    // Если бэкенд пришлёт дополнительные метрики (конверсия / давность / сезонность),
    // применяем сортировку; если метрик нет — оставляем исходный порядок.
    const indexed = filteredProducts.map((p, idx) => ({ p, idx }));
    if (indexed.length <= 1) return filteredProducts;

    const getNumberFromKeys = (product: SingleCampaignSelectableProduct, keys: string[]) => {
      const anyProduct = product as any;
      for (const key of keys) {
        const v = anyProduct?.[key];
        if (typeof v === 'number' && Number.isFinite(v)) return v;
        if (typeof v === 'string') {
          const n = Number.parseFloat(v.replace(',', '.'));
          if (Number.isFinite(n)) return n;
        }
      }
      return undefined;
    };

    const getMaybeTimestampMs = (product: SingleCampaignSelectableProduct, keys: string[]) => {
      const anyProduct = product as any;
      for (const key of keys) {
        const v = anyProduct?.[key];
        if (typeof v === 'number' && Number.isFinite(v)) return v;
        if (typeof v === 'string') {
          const asNum = Number.parseFloat(v.replace(',', '.'));
          if (Number.isFinite(asNum)) return asNum;
          const d = new Date(v);
          const t = d.getTime();
          if (Number.isFinite(t)) return t;
        }
      }
      return undefined;
    };

    const hasAnyMetric = (extractor: (p: SingleCampaignSelectableProduct) => number | undefined) =>
      indexed.some(({ p }) => extractor(p) !== undefined);

    const compareWithOptional = (a: number | undefined, b: number | undefined, direction: 'asc' | 'desc') => {
      if (a === undefined && b === undefined) return 0;
      if (a === undefined) return 1;
      if (b === undefined) return -1;
      return direction === 'asc' ? a - b : b - a;
    };

    if (sortKey === 'conversion') {
      const conversion = (p: SingleCampaignSelectableProduct) =>
        getNumberFromKeys(p, [
          'conversionRate',
          'conversion',
          'conv',
          'goodConversion',
          'conversionScore',
          'cr',
        ]);
      if (!hasAnyMetric(conversion)) {
        // fallback: на мок-данных без метрик всё равно меняем порядок
        return indexed
          .slice()
          .sort((a, b) => a.p.productName.localeCompare(b.p.productName, 'ru') || a.idx - b.idx)
          .map(({ p }) => p);
      }
      return indexed
        .slice()
        .sort((a, b) => compareWithOptional(conversion(a.p), conversion(b.p), 'desc') || a.idx - b.idx)
        .map(({ p }) => p);
    }

    if (sortKey === 'stalePromotion') {
      const daysSince = (p: SingleCampaignSelectableProduct) =>
        getNumberFromKeys(p, [
          'daysSincePromoted',
          'daysSinceLastPromoted',
          'lastPromotedDaysAgo',
          'promotedDaysAgo',
          'daysSincePromotion',
        ]);

      if (hasAnyMetric(daysSince)) {
        return indexed
          .slice()
          .sort((a, b) => compareWithOptional(daysSince(a.p), daysSince(b.p), 'desc') || a.idx - b.idx)
          .map(({ p }) => p);
      }

      // fallback: пытаемся считать timestamp и сортировать “старые” (давние) первыми
      const promotedAtTs = (p: SingleCampaignSelectableProduct) =>
        getMaybeTimestampMs(p, ['lastPromotedAt', 'promotedAt', 'lastPromotionAt', 'lastPromoted']);
      if (!hasAnyMetric(promotedAtTs)) {
        // fallback: на мок-данных без метрик всё равно меняем порядок
        return indexed
          .slice()
          .sort((a, b) => a.p.nmId - b.p.nmId || a.idx - b.idx)
          .map(({ p }) => p);
      }

      return indexed
        .slice()
        .sort((a, b) => {
          const av = promotedAtTs(a.p);
          const bv = promotedAtTs(b.p);
          // older first
          return compareWithOptional(av, bv, 'asc') || a.idx - b.idx;
        })
        .map(({ p }) => p);
    }

    if (sortKey === 'highSeason') {
      const season = (p: SingleCampaignSelectableProduct) =>
        getNumberFromKeys(p, [
          'seasonality',
          'season',
          'seasonScore',
          'seasonIndex',
          'highSeasonScore',
        ]);
      if (!hasAnyMetric(season)) {
        // fallback: на мок-данных без метрик всё равно меняем порядок
        return indexed
          .slice()
          .sort((a, b) => b.p.nmId - a.p.nmId || a.idx - b.idx)
          .map(({ p }) => p);
      }
      return indexed
        .slice()
        .sort((a, b) => compareWithOptional(season(a.p), season(b.p), 'desc') || a.idx - b.idx)
        .map(({ p }) => p);
    }

    return filteredProducts;
  }, [filteredProducts, sortKey]);

  useEffect(() => {
    if (!sortOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      const btn = sortButtonRef.current;
      const menu = sortMenuRef.current;
      if (btn && btn.contains(target)) return;
      if (menu && menu.contains(target)) return;
      setSortOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [sortOpen]);

  const sortLabel =
    sortKey === 'conversion'
      ? 'Сначала с высокой конверсией'
      : sortKey === 'stalePromotion'
        ? 'Сначала давно не продвигались'
        : 'Сначала с высоким сезоном';

  const selectableInView = useMemo(
    () =>
      sortedFilteredProducts.filter(
        (p) => !(isCpcMode && !p.cpcCompatible) && !alreadyAddedNmIds.has(p.nmId),
      ),
    [sortedFilteredProducts, isCpcMode, alreadyAddedNmIds],
  );

  const allInViewSelected =
    selectableInView.length > 0 &&
    selectableInView.every((p) => pending.some((s) => s.nmId === p.nmId));

  const someInViewSelected =
    selectableInView.some((p) => pending.some((s) => s.nmId === p.nmId)) && !allInViewSelected;

  const toggleProduct = (product: SingleCampaignSelectableProduct) => {
    if (isCpcMode && !product.cpcCompatible) return;
    if (alreadyAddedNmIds.has(product.nmId)) return;
    setPending((prev) => {
      if (prev.some((p) => p.nmId === product.nmId)) {
        return prev.filter((p) => p.nmId !== product.nmId);
      }
      if (prev.length >= MAX_SELECT) return prev;
      return [...prev, product];
    });
  };

  const toggleSelectAllInView = () => {
    if (allInViewSelected) {
      const viewIds = new Set(selectableInView.map((p) => p.nmId));
      setPending((prev) => prev.filter((p) => !viewIds.has(p.nmId)));
      return;
    }
    setPending((prev) => {
      const existing = new Set(prev.map((p) => p.nmId));
      const room = MAX_SELECT - prev.length;
      const toAdd = selectableInView.filter((p) => !existing.has(p.nmId)).slice(0, room);
      return [...prev, ...toAdd];
    });
  };

  const handleConfirm = () => {
    if (pending.length === 0) return;
    onConfirm(pending);
    onClose();
  };

  if (!isOpen) return null;

  const searchPlaceholder =
    categoryProducts.length > 0
      ? `Поиск среди ${categoryProducts.length} товаров`
      : 'Поиск';

  const fmtPct = (value: number, digits = 1) =>
    `${(value * 100).toLocaleString('ru-RU', { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;

  const fmtChange = (value: number) => {
    const sign = value > 0 ? '+' : value < 0 ? '−' : '';
    const abs = Math.abs(value);
    return `${sign}${abs.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}%`;
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[800px] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <h2 className="text-xl font-bold text-gray-900">Добавление товаров</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Закрыть"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-6 pt-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-[220px]">
              <button
                type="button"
                onClick={() => setCategoryOpen((o) => !o)}
                className="flex h-11 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 text-left text-sm text-gray-900 hover:border-gray-300"
              >
                <span className={category ? '' : 'text-gray-500'}>
                  {category || 'Выберите категорию'}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${categoryOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {categoryOpen && (
                <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${cat === category ? 'bg-purple-50 font-medium text-purple-700' : 'text-gray-800'}`}
                      onClick={() => {
                        setCategory(cat);
                        setCategoryOpen(false);
                        setSortOpen(false);
                        setSearchTerm('');
                        setPending([]);
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={!category}
                placeholder={category ? searchPlaceholder : 'Сначала выберите категорию'}
                className="h-11 w-full rounded-lg border border-gray-200 bg-white pr-10 pl-3 text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-400"
              />
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {category ? (
            <>
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-gray-900">{category}</p>
                <div className="relative">
                  <button
                    ref={sortButtonRef}
                    type="button"
                    onClick={() => setSortOpen((o) => !o)}
                    className="inline-flex h-8 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 hover:border-gray-300"
                    aria-label="Сортировка"
                    aria-haspopup="menu"
                    aria-expanded={sortOpen}
                  >
                    {sortLabel}
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${
                        sortOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden
                    />
                  </button>
                  {sortOpen && (
                    <div
                      ref={sortMenuRef}
                      role="menu"
                      className="absolute right-0 top-[calc(100%+4px)] z-30 w-64 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setSortKey('conversion');
                          setSortOpen(false);
                        }}
                        className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                          sortKey === 'conversion' ? 'bg-purple-50 font-medium text-purple-700' : 'text-gray-800'
                        }`}
                      >
                        Сначала с высокой конверсией
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setSortKey('stalePromotion');
                          setSortOpen(false);
                        }}
                        className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                          sortKey === 'stalePromotion' ? 'bg-purple-50 font-medium text-purple-700' : 'text-gray-800'
                        }`}
                      >
                        Сначала давно не продвигались
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setSortKey('highSeason');
                          setSortOpen(false);
                        }}
                        className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                          sortKey === 'highSeason' ? 'bg-purple-50 font-medium text-purple-700' : 'text-gray-800'
                        }`}
                      >
                        Сначала с высоким сезоном
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-normal text-gray-400">
                      <th className="w-10 px-3 py-2">
                        <Checkbox
                          checked={allInViewSelected}
                          indeterminate={someInViewSelected}
                          disabled={!category || selectableInView.length === 0}
                          onChange={toggleSelectAllInView}
                        />
                      </th>
                      <th className="w-[52px] px-2 py-2">Фото</th>
                      <th className="px-3 py-2">Бренд · Артикул · Название</th>
                      <th className="w-[112px] px-3 py-2 text-right">CTR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedFilteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-8 text-center text-sm text-gray-400">
                          Товары не найдены
                        </td>
                      </tr>
                    ) : (
                      sortedFilteredProducts.map((product, index) => {
                        const isAdded = alreadyAddedNmIds.has(product.nmId);
                        const isIncompatible = isCpcMode && !product.cpcCompatible;
                        const disabled = isAdded || isIncompatible;
                        const isChecked = pending.some((p) => p.nmId === product.nmId);
                        const atCap = pending.length >= MAX_SELECT && !isChecked;
                        const conv = product.conversionRate;
                        const convDelta = product.conversionChangePercent;
                        const showPromoteLabel = index < 5;
                        return (
                          <tr
                            key={product.nmId}
                            className={`${disabled ? 'opacity-50' : 'hover:bg-gray-50/80'} ${isChecked ? 'bg-purple-50/30' : ''}`}
                          >
                            <td className="px-3 py-3 align-middle">
                              <Checkbox
                                checked={isChecked}
                                disabled={disabled || atCap}
                                onChange={() => toggleProduct(product)}
                              />
                            </td>
                            <td className="px-2 py-3 align-middle">
                              <ProductThumb
                                nmId={product.nmId}
                                imageUrl={product.imageUrl}
                                category={product.category}
                                alt={product.productName}
                              />
                            </td>
                            <td className="px-3 py-3 align-middle">
                              <div className="flex items-center gap-1 text-sm text-gray-900">
                                <span className="text-gray-400">·</span>
                                <span className="tabular-nums text-gray-600">{product.nmId}</span>
                                {showPromoteLabel && !disabled && (
                                  <span className="ml-2 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                    Выгодно продвигать
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-sm font-medium text-gray-900">
                                {product.productName}
                              </p>
                              {isAdded && (
                                <p className="mt-0.5 text-xs text-gray-500">Уже в кампании</p>
                              )}
                              {isIncompatible && !isAdded && (
                                <p className="mt-0.5 text-xs text-red-600">Не продвигается по CPC</p>
                              )}
                            </td>
                            <td className="px-3 py-3 align-middle text-right">
                              {conv === undefined ? (
                                <span className="text-xs text-gray-400">—</span>
                              ) : (
                                <div className="flex flex-col items-end">
                                  <span className="text-sm font-medium text-gray-900 tabular-nums">
                                    {fmtPct(conv)}
                                  </span>
                                  {typeof convDelta === 'number' && Number.isFinite(convDelta) ? (
                                    <span
                                      className={`text-xs font-medium tabular-nums ${
                                        convDelta > 0
                                          ? 'text-emerald-600'
                                          : convDelta < 0
                                            ? 'text-red-600'
                                            : 'text-gray-500'
                                      }`}
                                    >
                                      {fmtChange(convDelta)}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-400"> </span>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center py-16 text-sm text-gray-400">
              Выберите категорию, чтобы увидеть товары
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 px-6 py-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending.length === 0}
              onClick={handleConfirm}
              className="rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:bg-[#E8D4FF] enabled:bg-[#9A41FE] enabled:hover:bg-[#8840e5]"
            >
              Добавить
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[#2E3038] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#23252c]"
            >
              Отменить
            </button>
          </div>
          <div className="text-sm text-gray-600">
            <span>
              Выбрано: <span className="font-medium text-gray-900">{pending.length}</span>
            </span>
            <span className="mx-2 text-gray-300">·</span>
            <span className="text-gray-500">Максимум — {MAX_SELECT}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
