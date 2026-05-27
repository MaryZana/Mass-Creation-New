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
  const catalogThumb = productTableThumbUrl(id);
  const [url, setUrl] = useState(() => catalogThumb);
  useEffect(() => {
    setUrl(catalogThumb);
  }, [catalogThumb]);
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
        const picsum = productTableThumbFallbackUrl(id);
        if (url !== picsum) {
          setUrl(picsum);
          return;
        }
        const globalIdx = productTableThumbUrl(id);
        if (url !== globalIdx) setUrl(globalIdx);
        else if (url !== PRODUCT_TABLE_THUMB_FALLBACK) setUrl(PRODUCT_TABLE_THUMB_FALLBACK);
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
      notAdded.filter((p) => p.category === 'Кроссовки').sort(byConv),
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
        <h3
          className="text-xl font-bold text-gray-900"
          style={{
            fontFamily: "'ALS Hauss VF', sans-serif",
            fontStyle: 'normal',
            fontWeight: 680,
            fontSize: '22px',
            lineHeight: '28px',
          }}
        >
          Готовые подборки
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
                    <p className="truncate text-xs font-medium text-gray-900">{p.productName}</p>
                    <p className="text-[11px] text-gray-500">{p.category}</p>
                  </div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => onAddBundle(pick.products)}
              className="mt-4 w-full rounded-xl bg-[#2E3038] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#23252c]"
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
