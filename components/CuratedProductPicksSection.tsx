import React, { useEffect, useMemo, useState } from 'react';
import { TrendingUp } from './Icons';
import {
  PRODUCT_TABLE_THUMB_FALLBACK,
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

const PROMISING_PICK_COUNT = 5;

type CuratedPickBundle = {
  id: 'promising';
  title: string;
  description: string;
  products: CuratedPickProduct[];
  totalCount: number;
  Icon: React.FC<{ className?: string }>;
  iconClassName: string;
};

function fallbackThumbDataUrl(nmId: number, category: string) {
  const palette = [
    { bg: '#EEF2FF', fg: '#3730A3' },
    { bg: '#ECFEFF', fg: '#155E75' },
    { bg: '#ECFDF5', fg: '#065F46' },
    { bg: '#EFF6FF', fg: '#1E40AF' },
    { bg: '#F5F3FF', fg: '#5B21B6' },
    { bg: '#F0FDFA', fg: '#115E59' },
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

function productCountLabel(count: number) {
  if (count === 1) return 'товар';
  if (count < 5) return 'товара';
  return 'товаров';
}

export function computeCuratedProductPicks(
  catalog: CuratedPickProduct[],
  alreadyAddedNmIds: Set<number>,
): CuratedPickBundle[] {
  const notAdded = catalog.filter((p) => !alreadyAddedNmIds.has(p.nmId));
  const byConv = (a: CuratedPickProduct, b: CuratedPickProduct) =>
    (b.conversionRate ?? 0) - (a.conversionRate ?? 0) || b.nmId - a.nmId;

  const picks: CuratedPickBundle[] = [];

  const promising = notAdded.slice().sort(byConv).slice(0, PROMISING_PICK_COUNT);
  if (promising.length > 0) {
    picks.push({
      id: 'promising',
      title: 'Перспективные',
      description:
        'У этих товаров конверсия в заказ выше, чем в среднем в категории — продвигайте их, чтобы увеличить продажи',
      products: promising,
      totalCount: promising.length,
      Icon: TrendingUp,
      iconClassName: 'text-[#22C55E]',
    });
  }

  return picks;
}

function CuratedPickCard({
  pick,
  onAddBundle,
}: {
  pick: CuratedPickBundle;
  onAddBundle: (items: CuratedPickProduct[], pickId: CuratedPickBundle['id']) => void;
}) {
  const previewThumbs = pick.products.slice(0, 3);
  const extraCount = Math.max(0, pick.products.length - previewThumbs.length);
  const { Icon } = pick;

  return (
    <article className="flex w-[426px] max-w-full flex-col justify-between rounded-2xl bg-[#F3F5F8] p-5">
      <div>
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
            <Icon className={`h-4 w-4 ${pick.iconClassName}`} />
          </span>
          <h4 className="mb-0 text-base font-bold leading-none text-gray-900">{pick.title}</h4>
        </div>
        <p className="mt-3 text-sm leading-snug text-gray-500">{pick.description}</p>
      </div>

      <div className="mt-6 flex items-end justify-between gap-3">
        <div className="flex -space-x-2">
          {previewThumbs.map((p, index) => (
            <div
              key={p.nmId}
              className="relative rounded-lg bg-white p-0.5 ring-1 ring-black/[0.04]"
              title={p.productName}
            >
              <PickProductThumb
                nmId={p.nmId}
                imageUrl={p.imageUrl}
                category={p.category}
                alt={p.productName}
              />
              {index === previewThumbs.length - 1 && extraCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#4B5563] px-1 text-[10px] font-semibold leading-none text-white">
                  +{extraCount}
                </span>
              ) : null}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            onAddBundle(
              pick.products.map((p) => ({
                ...p,
                pickReason: pick.title,
              })),
              pick.id,
            );
          }}
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-[10px] bg-black px-2.5 text-sm font-medium tracking-[0.3px] text-white transition-colors hover:bg-[#1A1A1A] active:bg-black"
        >
          <span className="px-1.5">
            Продвигать {pick.totalCount} {productCountLabel(pick.totalCount)}
          </span>
        </button>
      </div>
    </article>
  );
}

export function CuratedProductPicksSection({
  products,
  alreadyAddedNmIds,
  onAddBundle,
  className = '',
}: {
  products: CuratedPickProduct[];
  alreadyAddedNmIds: Set<number>;
  onAddBundle: (items: CuratedPickProduct[], pickId: CuratedPickBundle['id']) => void;
  className?: string;
}) {
  const curatedProductPicks = useMemo(
    () => computeCuratedProductPicks(products, alreadyAddedNmIds),
    [products, alreadyAddedNmIds],
  );

  if (curatedProductPicks.length === 0) return null;

  return (
    <section className={`w-full rounded-2xl bg-white p-6 shadow-sm ${className}`}>
      <h3 className="mb-4 text-xl font-bold text-gray-900">Подобрали товары для продвижения</h3>

      <div className="flex flex-wrap gap-4">
        {curatedProductPicks.map((pick) => (
          <CuratedPickCard key={pick.id} pick={pick} onAddBundle={onAddBundle} />
        ))}
      </div>
    </section>
  );
}
