import React, { useEffect, useMemo, useState } from 'react';
import {
  BookFilled,
  ExperimentFilled,
  FundFilled,
  RocketFilled,
  StarFilled,
  TagFilled,
} from '@ant-design/icons';
import {
  PRODUCT_TABLE_THUMB_FALLBACK,
  productTableThumbFallbackUrl,
  productTableThumbUrl,
} from './SuccessPageTestData';

export type CuratedPickProduct = {
  nmId: number;
  productName: string;
  imageUrl: string;
  category: string;
  conversionRate?: number;
  /** Human-readable reason / pick label for mass-creation table */
  pickReason?: string;
};

const PRODUCT_THUMB_CLASS =
  'h-[38px] w-[30px] shrink-0 rounded-md border border-gray-100 bg-gray-50 object-cover';

function fallbackThumbDataUrl(nmId: number, category: string) {
  // Guaranteed-to-load fallback (no network). Avoid red hues by using a cool palette.
  const palette = [
    { bg: '#EEF2FF', fg: '#3730A3' }, // indigo
    { bg: '#ECFEFF', fg: '#155E75' }, // cyan
    { bg: '#ECFDF5', fg: '#065F46' }, // emerald
    { bg: '#EFF6FF', fg: '#1E40AF' }, // blue
    { bg: '#F5F3FF', fg: '#5B21B6' }, // violet
    { bg: '#F0FDFA', fg: '#115E59' }, // teal
  ] as const;
  const idx = Math.abs(nmId) % palette.length;
  const { bg, fg } = palette[idx]!;
  const letter = (category?.trim()?.[0] ?? 'Т').toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="76" viewBox="0 0 60 76">
    <rect width="60" height="76" rx="10" fill="${bg}"/>
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
      font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
      font-size="28" font-weight="700" fill="${fg}">${letter}</text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function PickProductThumb({
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
  const catalogThumb = productTableThumbUrl(id, category);
  // This page should not depend on external random/image seed hosts (picsum),
  // because they occasionally fail to load. Use the same stable Unsplash sources
  // as other recommendation widgets.
  const primaryThumb = catalogThumb;
  const [url, setUrl] = useState(() => primaryThumb);
  useEffect(() => {
    setUrl(primaryThumb);
  }, [primaryThumb]);
  return (
    <img
      src={url}
      alt={alt}
      width={30}
      height={38}
      className={PRODUCT_THUMB_CLASS}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => {
        // Try multiple sources in a deterministic order:
        // 1) catalog thumb (stable by nmId/category)
        // 2) global fallback(s)
        // 4) inline SVG (guaranteed, no network)
        if (url !== catalogThumb && catalogThumb) {
          setUrl(catalogThumb);
          return;
        }
        const globalIdx = productTableThumbUrl(id);
        if (url !== globalIdx) setUrl(globalIdx);
        else if (url !== PRODUCT_TABLE_THUMB_FALLBACK) setUrl(PRODUCT_TABLE_THUMB_FALLBACK);
        else setUrl(fallbackThumbDataUrl(nmId, category));
      }}
    />
  );
}

export function computeCuratedProductPicks(
  catalog: CuratedPickProduct[],
  alreadyAddedNmIds: Set<number>,
) {
  const notAdded = catalog.filter((p) => !alreadyAddedNmIds.has(p.nmId));
  const byConv = (a: CuratedPickProduct, b: CuratedPickProduct) =>
    (b.conversionRate ?? 0) - (a.conversionRate ?? 0) || b.nmId - a.nmId;
  const ratingScore = (p: CuratedPickProduct) => ((p.nmId % 40) + 60) / 10;
  const byRating = (a: CuratedPickProduct, b: CuratedPickProduct) =>
    ratingScore(b) - ratingScore(a) || b.nmId - a.nmId;

  const pickDistinctCategories = (items: CuratedPickProduct[], count: number) => {
    const picked: CuratedPickProduct[] = [];
    const seen = new Set<string>();
    for (const it of items) {
      if (picked.length >= count) break;
      if (seen.has(it.category)) continue;
      picked.push(it);
      seen.add(it.category);
    }
    if (picked.length >= count) return picked;
    for (const it of items) {
      if (picked.length >= count) break;
      if (picked.some((p) => p.nmId === it.nmId)) continue;
      picked.push(it);
    }
    return picked;
  };

  const build = (id: string, title: string, items: CuratedPickProduct[]) => ({
    id,
    title,
    products: items,
    totalCount: items.length,
  });

  // Demo-only segments (deterministic, stable between reloads).
  const inPromo = (p: CuratedPickProduct) => p.nmId % 7 === 0;
  const inAbTest = (p: CuratedPickProduct) => p.nmId % 9 === 0;

  const picks = [
    build(
      'quick-start',
      'Конверсия выше 20%',
      notAdded.slice().sort(byConv),
    ),
    build(
      'top-rated',
      'Рейтинг выше 4.9',
      notAdded.slice().sort(byRating),
    ),
    build(
      'promo',
      'Товары в акциях',
      notAdded.filter(inPromo).slice().sort(byConv),
    ),
    build(
      'ab-test',
      'Товары с А/Б тестом',
      notAdded.filter(inAbTest).slice().sort(byConv),
    ),
    build(
      'seasonal-demand',
      'Сезонный спрос выше 100%',
      pickDistinctCategories(notAdded.slice().sort(byConv), 12),
    ),
  ];

  return picks.filter((pick) => pick.products.length > 0);
}

export function CuratedProductPicksSection({
  products,
  alreadyAddedNmIds,
  onAddBundle,
  className = '',
}: {
  products: CuratedPickProduct[];
  alreadyAddedNmIds: Set<number>;
  onAddBundle: (items: CuratedPickProduct[]) => void;
  className?: string;
}) {
  const curatedProductPicks = useMemo(
    () => computeCuratedProductPicks(products, alreadyAddedNmIds),
    [products, alreadyAddedNmIds],
  );

  if (curatedProductPicks.length === 0) return null;

  const describePick = (id: string) => {
    switch (id) {
      case 'quick-start':
        return 'Товары с конверсией выше среднего — быстро дадут заказы при старте.';
      case 'top-rated':
        return 'Высокий рейтинг и отзывы повышают доверие и улучшают кликабельность.';
      case 'promo':
        return 'Акционные товары получают больше внимания — хороший момент усилить продвижение.';
      case 'ab-test':
        return 'Продвигайте товары с A/B тестом, чтобы получить больше трафика и понять, какой креатив работает лучше.';
      case 'seasonal-demand':
        return 'Рост спроса в разных категориях — можно масштабировать без риска выгорания.';
      default:
        return 'Подборка товаров с лучшими метриками для продвижения.';
    }
  };

  const displayCount = (id: string) => {
    // Show a small, varied number (<= 15) for the card header.
    const seed = Array.from(id).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return 5 + (seed % 11); // 5..15
  };

  const pickIcon = (id: string) => {
    const iconBase = 'text-[24px]';
    const wrapBase =
      'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F2F2F7]';
    switch (id) {
      case 'quick-start':
        return (
          <span className={wrapBase}>
            <RocketFilled className={`${iconBase} text-[#F52ED1]`} />
          </span>
        );
      case 'top-rated':
        return (
          <span className={wrapBase}>
            <StarFilled className={`${iconBase} text-violet-600`} />
          </span>
        );
      case 'promo':
        return (
          <span className={wrapBase}>
            <TagFilled className={`${iconBase} text-[#0FA3FF]`} />
          </span>
        );
      case 'ab-test':
        return (
          <span className={wrapBase}>
            <ExperimentFilled className={`${iconBase} text-sky-600`} />
          </span>
        );
      case 'seasonal-demand':
        return (
          <span className={wrapBase}>
            <FundFilled className={`${iconBase} text-rose-600`} />
          </span>
        );
      default:
        return (
          <span className={wrapBase}>
            <BookFilled className={`${iconBase} text-slate-600`} />
          </span>
        );
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-4">
        <h3 className="font-heading text-[22px] font-[680] leading-7 text-gray-900">
          Перспективные товары
        </h3>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {curatedProductPicks.map((pick) => (
          <article
            key={pick.id}
            className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white"
          >
            <div className="p-4">
              <div className="rounded-2xl bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3 pb-3">
                    {pickIcon(pick.id)}
                    <h4 className="mb-0 min-w-0 text-xl font-semibold leading-none text-gray-900">
                      {pick.title}
                    </h4>
                  </div>
                </div>

                <p className="mt-2 text-sm leading-snug text-gray-500">
                  {describePick(pick.id)}
                </p>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex -space-x-2">
                    {pick.products.slice(0, 3).map((p) => (
                      <div
                        key={p.nmId}
                        className="rounded-lg bg-white p-0.5 ring-1 ring-black/[0.04]"
                        title={p.productName}
                      >
                        <PickProductThumb
                          nmId={p.nmId}
                          imageUrl={p.imageUrl}
                          category={p.category}
                          alt={p.productName}
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const count = Math.min(displayCount(pick.id), pick.products.length);
                      onAddBundle(
                        pick.products.slice(0, count).map((p) => ({
                          ...p,
                          pickReason: pick.title,
                        })),
                      );
                    }}
                    className="inline-flex items-center justify-center rounded-xl bg-[#F2F2F7] px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-[#e8e8ed]"
                  >
                    Смотреть {Math.min(displayCount(pick.id), pick.products.length)}
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
