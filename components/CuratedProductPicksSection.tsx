import React, { useEffect, useMemo, useState } from 'react';
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
    products: items.slice(0, 3),
  });

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

  return (
    <div className={`w-full rounded-2xl bg-white p-6 shadow-sm ${className}`}>
      <div className="mb-4">
        <h3 className="font-heading text-[22px] font-[680] leading-7 text-gray-900">
          Перспективные товары
        </h3>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {curatedProductPicks.map((pick) => (
          <article
            key={pick.id}
            className="flex flex-col rounded-xl border border-gray-100 bg-[#FAFAFC] p-4"
          >
            <h4 className="text-lg font-semibold text-gray-900">{pick.title}</h4>
            <ul className="mt-4 flex flex-col gap-3">
              {pick.products.map((p) => (
                <li key={p.nmId} className="flex min-w-0 items-center gap-2">
                  <PickProductThumb
                    nmId={p.nmId}
                    imageUrl={p.imageUrl}
                    category={p.category}
                    alt={p.productName}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 truncate text-xs font-medium text-gray-900">{p.productName}</p>
                    <p className="mb-0 text-[11px] text-gray-500">{p.category}</p>
                  </div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => onAddBundle(pick.products)}
              className="mt-4 inline-flex self-start rounded-xl bg-[#2E3038] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#23252c]"
            >
              Добавить {pick.products.length}{' '}
              {pick.products.length === 1 ? 'товар' : 'товара'}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
