import React, { forwardRef, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { RepeatLaunchPreset } from './ProfileContext';
import { ArrowUp, ChevronDown, ChevronRight, X, Zap } from './Icons';

const NOTIFICATION_PRODUCT_IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=160&h=160&fit=crop&q=80';

/** До измерения активной карточки (ширина по контенту через ResizeObserver) */
const FALLBACK_CARD_WIDTH_PX = 320;
const CARD_HEIGHT_PX = 96;
const PEEK_SHIFT_PX = 9;
const HEIGHT_STEP_PX = 6;
const OPACITY_STEP = 0.32;
const DISMISS_MS = 320;

export type BonusNotificationCardVariant = 1 | 2 | 3 | 4 | 5;

export type BonusCampaignNotification = {
  id: string;
  imageUrl: string;
  /** Показы (число) */
  views: number;
  ctr: number;
  season: number;
  orders: number;
  title?: string;
  campaignName?: string;
  /** Подпись под серым заголовком на карточке «Запустите продвижение» */
  productDisplayName?: string;
  launchPreset: RepeatLaunchPreset;
};

function formatMetric(value: number): string {
  const sign = value >= 0 ? '+ ' : '− ';
  const abs = Math.abs(value);
  return sign + abs.toLocaleString('ru-RU').replace(/\u00A0/g, ' ');
}

function formatCompactNum(n: number): string {
  return n.toLocaleString('ru-RU').replace(/\u00A0/g, ' ');
}

const STACK_TRANSITION =
  'transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)]';

function stackMetrics(depth: number) {
  const height = Math.max(48, CARD_HEIGHT_PX - depth * HEIGHT_STEP_PX);
  const opacity = Math.max(0.38, 1 - depth * OPACITY_STEP);
  const translateX = depth * PEEK_SHIFT_PX;
  return { height, opacity, translateX };
}

function stackRightEdge(depth: number, cardWidthPx: number) {
  const { translateX } = stackMetrics(depth);
  return translateX + cardWidthPx;
}

function NotificationProductImage({ src }: { src: string }) {
  const [resolvedSrc, setResolvedSrc] = useState(src);
  useEffect(() => {
    setResolvedSrc(src);
  }, [src]);
  return (
    <img
      src={resolvedSrc}
      alt=""
      className="h-[40px] w-[28px] shrink-0 rounded-lg object-cover bg-gray-100"
      onError={() => {
        if (resolvedSrc !== NOTIFICATION_PRODUCT_IMAGE_FALLBACK) {
          setResolvedSrc(NOTIFICATION_PRODUCT_IMAGE_FALLBACK);
        }
      }}
    />
  );
}

function NotificationCardBody({
  imageUrl,
  title,
  campaignName,
  shows,
  ctr,
  season,
  titleAboveImage = false,
  onTitleClick,
}: {
  imageUrl: string;
  title: string;
  campaignName?: string;
  shows: number;
  ctr: number;
  season: number;
  titleAboveImage?: boolean;
  onTitleClick?: () => void;
  statsAction?: React.ReactNode;
}) {
  const titleClassName = titleAboveImage
    ? 'm-0 w-full min-w-0 truncate text-left text-[11px] leading-[11px] text-[#767386]'
    : 'm-0 whitespace-nowrap text-left text-[11px] font-semibold leading-[13px] text-gray-900';

  const titleNode =
    titleAboveImage || !onTitleClick ? (
      <p className={titleClassName}>{title}</p>
    ) : (
      <button
        type="button"
        onClick={onTitleClick}
        className={`${titleClassName} cursor-pointer transition-colors hover:text-[#7c3aed] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40 rounded-sm`}
      >
        {title}
      </button>
    );

  const statsGrid = (
    <div className="grid w-max max-w-full grid-cols-[auto_auto_auto] gap-x-2 gap-y-0 leading-none">
      <div className="shrink-0">
        <p className="m-0 whitespace-nowrap text-[9px] leading-[10px] text-[#767386]">Показы</p>
        <p className="m-0 whitespace-nowrap text-[11px] font-bold leading-[12px] tabular-nums text-gray-900">
          {formatCompactNum(shows)}
        </p>
      </div>
      <div className="shrink-0">
        <p className="m-0 whitespace-nowrap text-[9px] leading-[10px] text-[#767386]">CTR</p>
        <p className="m-0 whitespace-nowrap text-[11px] font-bold leading-[12px] tabular-nums text-gray-900">
          {ctr}%
        </p>
      </div>
      <div className="shrink-0">
        <p className="m-0 whitespace-nowrap text-[9px] leading-[10px] text-[#767386]">Сезон</p>
        <p className="m-0 flex items-center gap-px whitespace-nowrap text-[11px] font-bold leading-[12px] text-emerald-600 tabular-nums">
          <ArrowUp className="h-2 w-2 shrink-0" aria-hidden />+ {season}%
        </p>
      </div>
    </div>
  );

  if (titleAboveImage) {
    return (
      <div className="flex w-max items-center overflow-visible pr-1">
        <div className="flex w-max items-center gap-2">
          <NotificationProductImage src={imageUrl} />
          <div className="flex w-max flex-col gap-1 overflow-visible">
            {campaignName ? (
              onTitleClick ? (
                <button
                  type="button"
                  onClick={onTitleClick}
                  className="m-0 w-full min-w-0 truncate text-left text-[11px] font-semibold leading-[13px] text-gray-900 cursor-pointer transition-colors hover:text-[#7c3aed] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40 rounded-sm"
                >
                  {campaignName}
                </button>
              ) : (
                <p className="m-0 truncate text-[11px] font-semibold leading-[13px] text-gray-900">
                  {campaignName}
                </p>
              )
            ) : null}
            {statsGrid}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <NotificationProductImage src={imageUrl} />
      <div className="flex min-w-0 flex-1 flex-col gap-[4px] pr-1">
        {titleNode}
        {statsGrid}
      </div>
    </>
  );
}

function notificationCardSurfaceClass(variant: BonusNotificationCardVariant): string {
  switch (variant) {
    case 3:
      return 'bg-[#f5f5f7] ring-1 ring-inset ring-gray-200';
    default:
      return 'bg-white';
  }
}

const INSIGHTS_LABEL_CLASS = 'm-0 block text-[11px] leading-[11px] text-[#767386]';

/** Товары для массового создания из карточки варианта 5 «Конверсия выше конкурентов» */
export const GROWING_DEMAND_PRODUCTS = [
  {
    id: '312883517',
    name: 'Рюкзак школьный',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=80&h=80&fit=crop',
    showsBase: 1234,
    showsPromo: 10234,
    ctr: 23,
    seasonality: 1092,
  },
  {
    id: '312883518',
    name: 'Платье женское',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d58199?w=80&h=80&fit=crop',
    showsBase: 1346,
    showsPromo: 18234,
    ctr: 10,
    seasonality: 1092,
  },
  {
    id: '312883519',
    name: 'Кроссовки',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=80&h=80&fit=crop',
    showsBase: 3234,
    showsPromo: 13234,
    ctr: 35,
    seasonality: 1092,
  },
  {
    id: '312883520',
    name: 'Рюкзак школьный',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=80&h=80&fit=crop',
    showsBase: 1234,
    showsPromo: 10234,
    ctr: 23,
    seasonality: 1092,
  },
  {
    id: '312883521',
    name: 'Платье женское',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d58199?w=80&h=80&fit=crop',
    showsBase: 1346,
    showsPromo: 18234,
    ctr: 10,
    seasonality: 1092,
  },
  {
    id: '312883522',
    name: 'Футболка хлопок',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=80&h=80&fit=crop',
    showsBase: 2100,
    showsPromo: 11500,
    ctr: 18,
    seasonality: 856,
  },
] as const;

/** Превью в колонке «Растущий спрос» (рюкзак, платье, светлое платье), 28×38 */
const GROWING_DEMAND_INSIGHTS_STACK_IMAGES = [
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=56&h=76&fit=crop&q=80',
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=56&h=76&fit=crop&q=80',
  'https://images.unsplash.com/photo-1595777457583-95e059d58199?w=56&h=76&fit=crop&q=80',
] as const;

const GROWING_DEMAND_INSIGHTS_STACK_FALLBACKS = [
  NOTIFICATION_PRODUCT_IMAGE_FALLBACK,
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=56&h=76&fit=crop&q=80',
  'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=56&h=76&fit=crop&q=80',
] as const;

/** Имена кампаний для массового пополнения из карточки варианта 5 */
export const LIST_HEADER_V5_BONUS_REFILL_CAMPAIGN_NAMES = [
  'Кампания 123',
  'Кампания 234',
  'Кампания 456',
] as const;

export const LIST_HEADER_V5_BONUS_REFILL_CAMPAIGN_COUNT = LIST_HEADER_V5_BONUS_REFILL_CAMPAIGN_NAMES.length;

const BONUSES_WORKED_CAMPAIGNS = [
  {
    id: 'campaign-123',
    name: 'Кампания 123',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=80&h=80&fit=crop',
    shows: 10234,
    orders: 2,
    ordersTrend: 12.1,
  },
  {
    id: 'campaign-234',
    name: 'Кампания 234',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d58199?w=80&h=80&fit=crop',
    shows: 12346,
    orders: 3,
    ordersTrend: 12.1,
  },
  {
    id: 'campaign-456',
    name: 'Кампания 456',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=80&h=80&fit=crop',
    shows: 33234,
    orders: 12,
    ordersTrend: 12.1,
  },
] as const;

function formatInsightNum(n: number): string {
  return n.toLocaleString('ru-RU').replace(/\u00A0/g, ' ');
}

function InsightsStackImage({
  src,
  index,
  ringClassName = 'ring-white',
}: {
  src: string;
  index: number;
  ringClassName?: string;
}) {
  const [resolvedSrc, setResolvedSrc] = useState(src);
  useEffect(() => {
    setResolvedSrc(src);
  }, [src]);

  return (
    <img
      src={resolvedSrc}
      alt=""
      className={`relative h-[38px] w-7 shrink-0 rounded-[6px] object-cover bg-gray-100 ring-2 ${ringClassName} ${
        index > 0 ? '-ml-1.5' : ''
      }`}
      style={{ zIndex: index + 1 }}
      onError={() => {
        const fallback =
          GROWING_DEMAND_INSIGHTS_STACK_FALLBACKS[index] ?? NOTIFICATION_PRODUCT_IMAGE_FALLBACK;
        if (resolvedSrc !== fallback) setResolvedSrc(fallback);
      }}
    />
  );
}

function InsightsThumbnailStack({
  imageUrls,
  ringClassName = 'ring-white',
}: {
  imageUrls: readonly string[];
  ringClassName?: string;
}) {
  const urls = imageUrls.slice(0, 3);
  if (urls.length === 0) return null;

  return (
    <div
      className="flex h-[38px] w-[4.75rem] shrink-0 items-center justify-start overflow-visible"
      aria-hidden
    >
      {urls.map((src, index) => (
        <InsightsStackImage
          key={`${src}-${index}`}
          src={src}
          index={index}
          ringClassName={ringClassName}
        />
      ))}
    </div>
  );
}

function ShowsMiniChart() {
  return (
    <div className="flex h-5 w-3.5 shrink-0 items-end justify-center gap-px" aria-hidden>
      <span className="w-1 rounded-sm bg-gray-300" style={{ height: '40%' }} />
      <span className="w-1 rounded-sm bg-[#9a41fe]" style={{ height: '100%' }} />
    </div>
  );
}

function OrdersGrowthChartIcon() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center" aria-hidden>
      <span className="flex h-5 w-4 items-end justify-center gap-px">
        <span className="w-0.5 rounded-sm bg-emerald-300" style={{ height: '42%' }} />
        <span className="w-0.5 rounded-sm bg-emerald-500" style={{ height: '68%' }} />
        <span className="w-0.5 rounded-sm bg-emerald-600" style={{ height: '100%' }} />
      </span>
    </span>
  );
}

const BONUSES_INSIGHT_STACK_IMAGES = BONUSES_WORKED_CAMPAIGNS.map((c) => c.image);

const VARIANT5_INSIGHT_CTA_CLASS =
  'shrink-0 whitespace-nowrap rounded-lg bg-[#f3e8ff] px-4 py-2.5 text-[13px] font-semibold leading-none text-[#7c3aed] transition-colors hover:bg-[#ede9fe]';

const VARIANT5_INSIGHT_CARD_SHELL_CLASS =
  'relative flex h-26 min-w-0 flex-1 flex-col justify-between overflow-visible rounded-[12px] bg-white px-3 pt-3 pb-3 shadow-sm';

const VARIANT5_INSIGHT_ACTION_BAR_CLASS =
  'flex min-w-0 w-full items-center gap-2 rounded-lg bg-[#f5f5f7] px-2 py-1.5';

const VARIANT5_STAT_COL = 'flex h-full flex-col justify-center gap-[6px]';
const VARIANT5_STAT_LABEL = 'm-0 block text-[11px] leading-[11px] text-[#767386]';
const VARIANT5_STAT_VALUE =
  'm-0 text-[22px] font-bold leading-none tabular-nums tracking-tight text-gray-900';

function ConversionBagIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function Variant4PromotionFitDropdown({
  item,
  kind,
}: {
  item: BonusCampaignNotification;
  kind: 'launch' | 'bonus';
}) {
  const showsPromo = item.views > 1000 ? item.views : 10234;
  const showsValue = `+ ${formatCompactNum(showsPromo)}`;
  const demandValue =
    item.season >= 100 ? `${formatCompactNum(item.season)} %` : `${formatCompactNum(1092)} %`;
  const ctrValue = `${item.ctr}%`;

  const rows =
    kind === 'launch'
      ? [
          {
            icon: <ShowsMiniChart />,
            label: 'Показов выше обычного',
            value: showsValue,
            valueClass: 'text-gray-900',
          },
          {
            icon: <ArrowUp className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />,
            label: 'Спрос выше обычного',
            value: demandValue,
            valueClass: 'text-emerald-600',
          },
          {
            icon: <ConversionBagIcon className="h-5 w-5 shrink-0 text-[#9a41fe]" />,
            label: 'Конверсия выше обычного',
            value: ctrValue,
            valueClass: 'text-gray-900',
          },
        ]
      : [
          {
            icon: <ShowsMiniChart />,
            label: 'Показы',
            value: formatCompactNum(item.views),
            valueClass: 'text-gray-900',
          },
          {
            icon: <ArrowUp className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />,
            label: 'Заказы',
            value: formatCompactNum(item.orders),
            valueClass: 'text-emerald-600',
          },
          {
            icon: <ConversionBagIcon className="h-5 w-5 shrink-0 text-[#9a41fe]" />,
            label: 'CTR',
            value: ctrValue,
            valueClass: 'text-gray-900',
          },
        ];

  return (
    <div className="w-[17.5rem] rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
      <h3 className="m-0 text-sm font-bold leading-snug text-gray-900">
        {kind === 'launch' ? 'Подходит для продвижения' : 'Бонусы сработали'}
      </h3>
      <ul className="m-0 mt-3 flex list-none flex-col gap-3 p-0">
        {rows.map((row) => (
          <li key={row.label} className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">{row.icon}</span>
            <div className="min-w-0">
              <p className="m-0 text-xs leading-snug text-[#767386]">{row.label}</p>
              <p className={`m-0 mt-0.5 text-sm font-bold leading-tight tabular-nums ${row.valueClass}`}>
                {row.value}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PromoShowsValueWithTooltip({ formattedValue }: { formattedValue: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="relative inline-block cursor-help"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      tabIndex={0}
      aria-describedby={visible ? 'promo-shows-tip' : undefined}
    >
      <span className="text-xs font-semibold leading-none text-[#9a41fe]">{formattedValue}</span>
      {visible && (
        <span
          id="promo-shows-tip"
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-[90] mb-1.5 w-max max-w-[240px] -translate-x-1/2 rounded-lg bg-gray-900 px-2.5 py-1.5 text-[11px] font-normal leading-snug text-white shadow-lg"
        >
          Возможные показы с продвижением
        </span>
      )}
    </span>
  );
}

function GrowingDemandDropdownPanel() {
  return (
    <div className="flex h-[420px] w-[min(92vw,720px)] flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
      <h3 className="shrink-0 text-base font-bold leading-snug text-gray-900">
        Запустите продвижение для товаров с растущей конверсией
      </h3>
      <p className="mt-1 shrink-0 text-xs leading-relaxed text-gray-500">
        ДРР может быть меньше чем обычно за счет хорошей органики и высокого спроса
      </p>
      <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="text-[10px] leading-none text-gray-500">
              <th className="px-2 py-1 text-left font-medium">Товар</th>
              <th className="px-2 py-1 text-left font-medium">Показы</th>
              <th className="px-2 py-1 text-left font-medium">CTR</th>
              <th className="px-2 py-1 text-left font-medium">Сезонность</th>
              <th className="w-[88px] px-2 py-1" />
            </tr>
          </thead>
          <tbody className="[&_td]:align-middle">
            {GROWING_DEMAND_PRODUCTS.map((row, index) => (
              <tr key={`${row.id}-${index}`} className="hover:bg-gray-50/60">
                <td className="px-2 py-3">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <img
                      src={row.image}
                      alt=""
                      className="h-7 w-7 shrink-0 rounded-md object-cover bg-gray-100"
                    />
                    <div className="flex min-w-0 flex-col gap-0 leading-none">
                      <p className="m-0 truncate text-xs font-medium leading-none text-gray-900">{row.name}</p>
                      <p className="-mt-px m-0 text-[10px] leading-none text-gray-400 tabular-nums">{row.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-2 py-3">
                  <div className="flex items-center gap-1">
                    <ShowsMiniChart />
                    <div className="flex flex-col gap-0 leading-none tabular-nums">
                      <span className="text-xs font-semibold text-gray-900">
                        {formatInsightNum(row.showsBase)}
                      </span>
                      <PromoShowsValueWithTooltip formattedValue={formatInsightNum(row.showsPromo)} />
                    </div>
                  </div>
                </td>
                <td className="px-2 py-3 text-xs font-semibold leading-none tabular-nums text-gray-900">
                  {row.ctr}%
                </td>
                <td className="px-2 py-3 leading-none">
                  <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 tabular-nums">
                    <ArrowUp className="h-2.5 w-2.5" aria-hidden />
                    {formatInsightNum(row.seasonality)} %
                  </span>
                </td>
                <td className="px-2 py-3 text-right leading-none">
                  <button
                    type="button"
                    className="rounded-lg border border-transparent bg-[#ececef] px-3 py-1.5 text-xs font-medium leading-snug text-gray-700 transition-colors hover:bg-[#e2e2e6]"
                  >
                    Продвигать
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BonusesWorkedDropdownPanel() {
  return (
    <div className="flex w-[min(92vw,560px)] min-w-[520px] max-w-[560px] flex-col rounded-2xl border border-gray-100 bg-white p-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
      <h3 className="shrink-0 text-base font-bold leading-snug text-gray-900">Бонусы принесли заказы</h3>
      <p className="mt-1 shrink-0 text-xs leading-relaxed text-gray-500">
        Пополните бюджет что бы получить еще заказы
      </p>
      <div className="mt-3">
        <table className="w-full border-collapse text-left text-xs">
          <colgroup>
            <col />
            <col className="w-[4.75rem]" />
            <col className="w-[5.5rem]" />
            <col className="w-[9.5rem]" />
          </colgroup>
          <thead>
            <tr className="text-[10px] leading-none text-gray-500">
              <th className="px-2 py-1 text-left font-medium">Товар</th>
              <th className="px-2 py-1 text-left font-medium">Показы</th>
              <th className="px-2 py-1 text-left font-medium">Заказы</th>
              <th className="px-2 py-1 text-right font-medium" />
            </tr>
          </thead>
          <tbody className="[&_td]:align-middle">
            {BONUSES_WORKED_CAMPAIGNS.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50/60">
                <td className="px-2 py-3">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <img
                      src={row.image}
                      alt=""
                      className="h-7 w-7 shrink-0 rounded-md object-cover bg-gray-100"
                    />
                    <p className="m-0 truncate text-xs font-medium leading-none text-gray-900">{row.name}</p>
                  </div>
                </td>
                <td className="px-2 py-3 text-xs font-semibold leading-none tabular-nums text-gray-900">
                  {formatInsightNum(row.shows)}
                </td>
                <td className="px-2 py-3 leading-none">
                  <span className="inline-flex items-center gap-1 whitespace-nowrap tabular-nums">
                    <span className="text-xs font-semibold text-gray-900">{row.orders}</span>
                    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
                      <ArrowUp className="h-2.5 w-2.5" aria-hidden />
                      {row.ordersTrend}%
                    </span>
                  </span>
                </td>
                <td className="px-2 py-3 text-right leading-none">
                  <button
                    type="button"
                    className="inline-flex shrink-0 whitespace-nowrap rounded-lg border border-transparent bg-[#ececef] px-3 py-1.5 text-xs font-medium leading-none text-gray-700 transition-colors hover:bg-[#e2e2e6]"
                  >
                    Пополнить бюджет
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BonusesWorkedInsightsColumn() {
  return (
    <div className="group/bonuses relative flex h-full min-w-[8.75rem] w-auto shrink-0 items-center overflow-visible">
      <button
        type="button"
        className="flex w-full min-w-0 items-center rounded-[8px] py-0 pl-2.5 pr-2 text-left hover:bg-gray-50/90 transition-colors"
      >
        <div className="flex min-w-0 w-full flex-col justify-center gap-[4px]">
          <span className={`${INSIGHTS_LABEL_CLASS} whitespace-nowrap`}>Продолжите продвижение</span>
          <span className="flex items-center gap-1">
            <Zap className="h-3.5 w-3.5 shrink-0 text-[#9a41fe]" aria-hidden />
            <span className="whitespace-nowrap text-sm font-bold leading-tight text-gray-900">3 кампании</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
          </span>
          <span className="m-0 whitespace-nowrap text-[11px] font-medium leading-none text-emerald-600">
            + 14 заказов
          </span>
        </div>
      </button>
      <div className="pointer-events-none invisible absolute right-0 top-[calc(100%-6px)] z-[80] pt-3 opacity-0 transition-all duration-200 group-hover/bonuses:pointer-events-auto group-hover/bonuses:visible group-hover/bonuses:opacity-100 group-focus-within/bonuses:pointer-events-auto group-focus-within/bonuses:visible group-focus-within/bonuses:opacity-100">
        <BonusesWorkedDropdownPanel />
      </div>
    </div>
  );
}

function GrowingDemandInsightsColumn() {
  const previewImages = GROWING_DEMAND_INSIGHTS_STACK_IMAGES;

  return (
    <div className="group/growing relative flex h-full min-w-[200px] flex-1 items-center overflow-visible">
      <button
        type="button"
        className="flex w-full min-w-0 items-center justify-between gap-1 rounded-[8px] px-2 py-0 text-left hover:bg-gray-50/90 transition-colors"
      >
        <InsightsThumbnailStack imageUrls={previewImages} />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-[4px] pl-0.5">
          <span className={`${INSIGHTS_LABEL_CLASS} whitespace-nowrap`}>Хорошая конверсия</span>
          <span className="flex items-center gap-1">
            <ArrowUp className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
            <span className="whitespace-nowrap text-sm font-bold leading-tight text-gray-900">6 товаров</span>
          </span>
        </div>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
      </button>
      <div className="pointer-events-none invisible absolute right-0 top-[calc(100%-6px)] z-[80] pt-3 opacity-0 transition-all duration-200 group-hover/growing:pointer-events-auto group-hover/growing:visible group-hover/growing:opacity-100 group-focus-within/growing:pointer-events-auto group-focus-within/growing:visible group-focus-within/growing:opacity-100">
        <GrowingDemandDropdownPanel />
      </div>
    </div>
  );
}

function padNotificationItems(
  items: BonusCampaignNotification[],
  count: number,
): BonusCampaignNotification[] {
  if (items.length === 0) return [];
  return Array.from({ length: count }, (_, i) => items[i % items.length]);
}

const VARIANT3_CHIP_CTR = [24, 10, 35, 23, 18] as const;
const VARIANT3_CHIP_SEASON = [130, 92, 145, 130, 110] as const;

function Variant3ProductChip({
  item,
  chipIndex,
  chipTab,
  actionLinkLabel,
  onOpen,
}: {
  item: BonusCampaignNotification;
  chipIndex: number;
  chipTab: 'organic' | 'bonuses';
  actionLinkLabel: string;
  onOpen?: () => void;
}) {
  const ctr = VARIANT3_CHIP_CTR[chipIndex % VARIANT3_CHIP_CTR.length];
  const season = VARIANT3_CHIP_SEASON[chipIndex % VARIANT3_CHIP_SEASON.length];
  const showsPromo = item.views > 1000 ? item.views : 10234;
  const statLabelClass = 'm-0 whitespace-nowrap text-[9px] leading-[10px] text-[#767386]';
  const statValueClass =
    'm-0 mt-0.5 whitespace-nowrap text-[10px] font-bold leading-none tabular-nums text-gray-900';

  return (
    <article className="group flex h-auto w-[228px] shrink-0 self-center overflow-hidden rounded-[12px] bg-[#f5f5f7] p-2.5 transition-colors hover:bg-[#efeff2]">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-start gap-2 border-0 bg-transparent p-0 text-left"
      >
        <img
          src={item.imageUrl}
          alt=""
          className="h-10 w-10 shrink-0 rounded-[10px] object-cover bg-gray-100"
          onError={(e) => {
            const el = e.currentTarget;
            if (el.src !== NOTIFICATION_PRODUCT_IMAGE_FALLBACK) {
              el.src = NOTIFICATION_PRODUCT_IMAGE_FALLBACK;
            }
          }}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="m-0 line-clamp-2 text-[11px] font-semibold leading-[13px] text-gray-900">
            {chipTab === 'bonuses'
              ? item.campaignName ?? item.launchPreset.product.productName
              : item.launchPreset.product.productName}
          </p>
          {chipTab === 'bonuses' ? (
            <div className="grid w-full grid-cols-2 gap-x-3 leading-none">
              <div>
                <p className={statLabelClass}>Показы</p>
                <p className={statValueClass}>{formatCompactNum(showsPromo)}</p>
              </div>
              <div>
                <p className={statLabelClass}>Заказы</p>
                <p className={statValueClass}>{formatCompactNum(item.orders)}</p>
              </div>
            </div>
          ) : (
            <div className="grid w-full grid-cols-3 gap-x-2 leading-none">
              <div>
                <p className={statLabelClass}>Показы</p>
                <p className={statValueClass}>{formatCompactNum(showsPromo)}</p>
              </div>
              <div>
                <p className={statLabelClass}>CTR</p>
                <p className={statValueClass}>{ctr}%</p>
              </div>
              <div>
                <p className={statLabelClass}>Сезон</p>
                <p className="m-0 mt-0.5 flex items-center gap-px whitespace-nowrap text-[10px] font-bold leading-none text-emerald-600 tabular-nums">
                  <ArrowUp className="h-2 w-2 shrink-0" aria-hidden />+ {season}%
                </p>
              </div>
            </div>
          )}
          <span className="pt-0.5 text-[11px] font-semibold leading-none text-[#2563eb] group-hover:underline">
            {actionLinkLabel}
          </span>
        </div>
      </button>
    </article>
  );
}

export const VARIANT3_STAT_CARD_H = '9.75rem';
const VARIANT3_LAUNCH_PRODUCT_COUNT = 6;
const VARIANT3_BONUS_CAMPAIGN_COUNT = 3;

/** Карточка метрики в шапке (вариант 3) */
export function ListHeaderVariant3StatCard({
  label,
  value,
  trend,
  trendUp = true,
  className = '',
}: {
  label: string;
  value: string;
  trend: string;
  trendUp?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex min-h-0 min-w-[7.5rem] flex-1 flex-col rounded-2xl bg-white px-4 py-3 shadow-sm ${className}`}
      style={{ height: VARIANT3_STAT_CARD_H }}
    >
      <p className="m-0 text-[11px] leading-none text-[#767386]">{label}</p>
      <p className="m-0 flex flex-1 items-center text-[22px] font-bold leading-none tabular-nums tracking-tight text-gray-900">
        {value}
      </p>
      <p className="m-0 flex items-center gap-0.5 text-[11px] font-medium leading-none text-emerald-600">
        <ArrowUp
          className={`h-2.5 w-2.5 shrink-0 ${trendUp ? '' : 'rotate-180'}`}
          aria-hidden
        />
        {trend}
      </p>
    </div>
  );
}

function HorizontalDragScrollRow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    active: false,
    startX: 0,
    startScrollLeft: 0,
    moved: false,
    pointerId: -1,
  });
  const suppressClickRef = useRef(false);

  const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    const drag = dragRef.current;
    if (!drag.active || !el) return;
    if (drag.pointerId === e.pointerId) {
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    }
    if (drag.moved) suppressClickRef.current = true;
    drag.active = false;
    drag.moved = false;
    drag.pointerId = -1;
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const el = scrollRef.current;
    if (!el) return;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startScrollLeft: el.scrollLeft,
      moved: false,
      pointerId: e.pointerId,
    };
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    const drag = dragRef.current;
    if (!drag.active || !el || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    if (Math.abs(dx) > 4) drag.moved = true;
    el.scrollLeft = drag.startScrollLeft - dx;
  };

  return (
    <div
      ref={scrollRef}
      className={`touch-pan-x cursor-grab select-none active:cursor-grabbing ${className ?? ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={(e) => {
        if (!suppressClickRef.current) return;
        e.preventDefault();
        e.stopPropagation();
        suppressClickRef.current = false;
      }}
    >
      {children}
    </div>
  );
}

/** Вариант 3: вкладки «Запустите продвижение» / «Бонусы сработали» и карусель карточек товаров */
export function ListHeaderVariant3Panel({
  items,
  onOpenItem,
}: {
  items: BonusCampaignNotification[];
  onOpenItem?: (item: BonusCampaignNotification) => void;
}) {
  const [tab, setTab] = useState<'organic' | 'bonuses'>('organic');

  if (items.length === 0) return null;

  const organicItems = padNotificationItems(items, VARIANT3_LAUNCH_PRODUCT_COUNT);
  const bonusItems = padNotificationItems(items, VARIANT3_BONUS_CAMPAIGN_COUNT);
  const visibleItems = tab === 'organic' ? organicItems : bonusItems;
  const chipActionLabel = tab === 'bonuses' ? 'Пополнить бюджет' : 'Продвигать';

  const tabBtn = (active: boolean) =>
    active
      ? 'rounded-md bg-white px-3 py-1.5 text-[13px] font-semibold leading-none text-gray-900 shadow-sm'
      : 'rounded-md px-3 py-1.5 text-[13px] font-medium leading-none text-[#767386] transition-colors hover:text-gray-700';

  return (
    <div
      className="ml-auto flex w-[min(100%,720px)] max-w-[720px] shrink-0 flex-col gap-2 overflow-visible rounded-2xl bg-white py-3 pl-4 pr-0 shadow-sm"
      style={{ height: VARIANT3_STAT_CARD_H, minHeight: VARIANT3_STAT_CARD_H }}
      role="region"
      aria-label="Рекомендации по товарам"
    >
      <div
        className="flex w-full shrink-0 items-center pr-4"
        role="tablist"
        aria-label="Разделы рекомендаций"
      >
        <div className="inline-flex items-center gap-0.5 rounded-lg bg-[#ececef] p-0.5">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'organic'}
            onClick={() => setTab('organic')}
            className={tabBtn(tab === 'organic')}
          >
            Хорошая конверсия
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'bonuses'}
            onClick={() => setTab('bonuses')}
            className={tabBtn(tab === 'bonuses')}
          >
            Бонусы сработали
          </button>
        </div>
      </div>
      <HorizontalDragScrollRow className="flex min-h-0 w-full min-w-0 flex-1 items-center gap-2.5 overflow-x-auto overflow-y-visible overscroll-x-contain py-1 pr-3 pl-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visibleItems.map((item, index) => (
          <Variant3ProductChip
            key={`${item.id}-v3-${tab}-${index}`}
            item={item}
            chipIndex={index}
            chipTab={tab}
            actionLinkLabel={chipActionLabel}
            onOpen={onOpenItem ? () => onOpenItem(item) : undefined}
          />
        ))}
      </HorizontalDragScrollRow>
    </div>
  );
}

export type ListHeaderRecommendationRow = {
  id: string;
  imageUrl: string;
  title: string;
  hint: string;
  actionLabel: string;
  kind: 'launch' | 'bonus';
  item: BonusCampaignNotification;
};

const VARIANT4_CHIP_CTR = VARIANT3_CHIP_CTR;
const VARIANT4_CHIP_SEASON = VARIANT3_CHIP_SEASON;

function Variant4RecommendationPill({
  row,
  chipIndex,
  onAction,
  onOpen,
}: {
  row: ListHeaderRecommendationRow;
  chipIndex: number;
  onAction: () => void;
  onOpen?: () => void;
}) {
  const ctr = VARIANT4_CHIP_CTR[chipIndex % VARIANT4_CHIP_CTR.length];
  const season = VARIANT4_CHIP_SEASON[chipIndex % VARIANT4_CHIP_SEASON.length];
  const statLabelClass = 'text-[#767386]';
  const statValueClass = 'font-bold tabular-nums text-gray-900';
  const anchorRef = useRef<HTMLDivElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  const syncDropdownPosition = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom, left: rect.left });
  }, []);

  const openDropdown = useCallback(() => {
    syncDropdownPosition();
    setDropdownOpen(true);
  }, [syncDropdownPosition]);

  const closeDropdown = useCallback(() => {
    setDropdownOpen(false);
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    const onScrollOrResize = () => syncDropdownPosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [dropdownOpen, syncDropdownPosition]);

  const dropdown =
    dropdownOpen &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        className="fixed z-[500] pt-2"
        style={{ top: dropdownPos.top, left: dropdownPos.left }}
        onMouseEnter={openDropdown}
        onMouseLeave={closeDropdown}
      >
        <Variant4PromotionFitDropdown item={row.item} kind={row.kind} />
      </div>,
      document.body,
    );

  return (
    <>
      <div
        ref={anchorRef}
        className="relative flex w-max max-w-[18rem] shrink-0 flex-col gap-1.5 overflow-visible py-0.5"
        onMouseEnter={openDropdown}
        onMouseLeave={closeDropdown}
      >
        <span className="inline-flex w-max items-center rounded-md bg-[#ececef] px-2 py-0.5 text-[10px] font-medium leading-none text-[#4a4a59]">
          {row.hint}
        </span>
        <div className="flex min-w-0 flex-col gap-2">
          <button
            type="button"
            onClick={onOpen}
            className="flex min-w-0 items-start gap-2 border-0 bg-transparent p-0 text-left"
          >
            <img
              src={row.imageUrl}
              alt=""
              className="h-[40px] w-[28px] shrink-0 rounded-lg object-cover bg-gray-100"
              onError={(e) => {
                const el = e.currentTarget;
                if (el.src !== NOTIFICATION_PRODUCT_IMAGE_FALLBACK) {
                  el.src = NOTIFICATION_PRODUCT_IMAGE_FALLBACK;
                }
              }}
            />
            <div className="min-w-0 flex-1">
              <p className="m-0 line-clamp-2 text-[11px] font-semibold leading-[13px] text-gray-900">
                {row.title}
              </p>
              {row.kind === 'bonus' ? (
                <div className="m-0 mt-1.5 flex flex-col gap-1.5 text-[10px] leading-none">
                  <span>
                    <span className={statLabelClass}>Показы </span>
                    <span className={statValueClass}>{formatCompactNum(row.item.views)}</span>
                  </span>
                  <span>
                    <span className={statLabelClass}>Заказы </span>
                    <span className={`${statValueClass} text-emerald-600`}>
                      {formatCompactNum(row.item.orders)}
                    </span>
                  </span>
                </div>
              ) : (
                <div className="m-0 mt-1.5 flex flex-col gap-1.5 text-[10px] leading-none">
                  <span>
                    <span className={statLabelClass}>CTR </span>
                    <span className={statValueClass}>{ctr}%</span>
                  </span>
                  <span className="inline-flex items-center gap-px">
                    <span className={statLabelClass}>Сезон </span>
                    <span className="inline-flex items-center gap-px font-bold tabular-nums text-emerald-600">
                      <ArrowUp className="h-2 w-2 shrink-0" aria-hidden />+ {season}%
                    </span>
                  </span>
                </div>
              )}
            </div>
          </button>
          <button
            type="button"
            onClick={onAction}
            className="self-start whitespace-nowrap rounded-lg bg-[#f3e8ff] px-2.5 py-1.5 text-[11px] font-semibold leading-none text-[#7c3aed] transition-colors hover:bg-[#ede9fe]"
          >
            {row.actionLabel}
          </button>
        </div>
      </div>
      {dropdown}
    </>
  );
}

const VARIANT4_LAUNCH_COUNT = 3;
const VARIANT4_BONUS_COUNT = 2;

/** Вариант 4: одна полоса — горизонтальная лента всех советов (конверсия + бонусы) */
export function ListHeaderVariant4Panel({
  items,
  onLaunchItem,
  onBonusItem,
}: {
  items: BonusCampaignNotification[];
  onLaunchItem: (item: BonusCampaignNotification) => void;
  onBonusItem?: (item: BonusCampaignNotification) => void;
}) {
  const rows = useMemo((): ListHeaderRecommendationRow[] => {
    if (items.length === 0) return [];

    const launchItems = padNotificationItems(items, VARIANT4_LAUNCH_COUNT);
    const bonusItems = padNotificationItems(items, VARIANT4_BONUS_COUNT);

    const launchRows: ListHeaderRecommendationRow[] = launchItems.map((item, index) => ({
      id: `launch-${item.id}-${index}`,
      imageUrl: item.imageUrl,
      title: item.productDisplayName ?? item.launchPreset.product.productName,
      hint: 'Хорошая конверсия',
      actionLabel: 'Продвигать',
      kind: 'launch',
      item,
    }));

    const bonusRows: ListHeaderRecommendationRow[] = bonusItems.map((item, index) => ({
      id: `bonus-${item.id}-${index}`,
      imageUrl: item.imageUrl,
      title: item.campaignName ?? 'Кампания',
      hint: 'Бонусы сработали',
      actionLabel: 'Пополнить бюджет',
      kind: 'bonus',
      item,
    }));

    return [...launchRows, ...bonusRows];
  }, [items]);

  if (rows.length === 0) return null;

  return (
    <div
      className="flex min-h-[6.5rem] w-max max-w-[min(100%,42rem)] flex-none shrink-0 items-stretch overflow-visible rounded-[12px] bg-white py-3 pl-4 pr-3 shadow-sm"
      role="region"
      aria-label="Рекомендации"
    >
      <HorizontalDragScrollRow className="flex h-full w-full min-w-0 items-center gap-5 overflow-x-auto overflow-y-visible overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {rows.map((row, index) => (
            <React.Fragment key={row.id}>
              {index > 0 ? (
                <div className="h-[4.5rem] w-px shrink-0 bg-gray-200" aria-hidden />
              ) : null}
              <Variant4RecommendationPill
                row={row}
                chipIndex={index}
                onAction={() =>
                  row.kind === 'launch' ? onLaunchItem(row.item) : onBonusItem?.(row.item)
                }
                onOpen={row.kind === 'bonus' && onBonusItem ? () => onBonusItem(row.item) : undefined}
              />
            </React.Fragment>
        ))}
      </HorizontalDragScrollRow>
    </div>
  );
}

function Variant5BudgetInsightCard({ onRefillBudget }: { onRefillBudget?: () => void }) {
  return (
    <div className={`group/v5budget ${VARIANT5_INSIGHT_CARD_SHELL_CLASS}`}>
      <div className="flex items-center gap-2">
        <OrdersGrowthChartIcon />
        <p className="m-0 text-[13px] font-normal leading-snug text-[#767386]">
          Заказы растут, пополните кампании
        </p>
      </div>
      <div className={VARIANT5_INSIGHT_ACTION_BAR_CLASS}>
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md border-0 bg-transparent p-0 text-left transition-colors hover:bg-[#ececef]/80"
        >
          <InsightsThumbnailStack
            imageUrls={BONUSES_INSIGHT_STACK_IMAGES}
            ringClassName="ring-[#f5f5f7]"
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="flex items-center gap-1">
              <span className="whitespace-nowrap text-sm font-bold leading-tight text-gray-900">
                3 кампании
              </span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
            </span>
            <span className="whitespace-nowrap text-[11px] font-medium leading-none text-emerald-600">
              + 12 заказов
            </span>
          </div>
        </button>
        <button type="button" onClick={onRefillBudget} className={VARIANT5_INSIGHT_CTA_CLASS}>
          Пополнить бюджет
        </button>
      </div>
      <div className="pointer-events-none invisible absolute left-0 top-[calc(100%-6px)] z-[80] w-full pt-3 opacity-0 transition-all duration-200 group-hover/v5budget:pointer-events-auto group-hover/v5budget:visible group-hover/v5budget:opacity-100 group-focus-within/v5budget:pointer-events-auto group-focus-within/v5budget:visible group-focus-within/v5budget:opacity-100">
        <BonusesWorkedDropdownPanel />
      </div>
    </div>
  );
}

function Variant5ConversionInsightCard({ onPromote }: { onPromote?: () => void }) {
  return (
    <div className={`group/v5conv ${VARIANT5_INSIGHT_CARD_SHELL_CLASS}`}>
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center text-[#9a41fe]">
          <ConversionBagIcon className="h-5 w-5" />
        </span>
        <p className="m-0 text-[13px] font-normal leading-snug text-[#767386]">
          Конверсия выше конкурентов
        </p>
      </div>
      <div className={VARIANT5_INSIGHT_ACTION_BAR_CLASS}>
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md border-0 bg-transparent p-0 text-left transition-colors hover:bg-[#ececef]/80"
        >
          <InsightsThumbnailStack
            imageUrls={GROWING_DEMAND_INSIGHTS_STACK_IMAGES}
            ringClassName="ring-[#f5f5f7]"
          />
          <span className="flex items-center gap-1">
            <span className="whitespace-nowrap text-sm font-bold leading-tight text-gray-900">
              6 товаров
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
          </span>
        </button>
        <button type="button" onClick={onPromote} className={VARIANT5_INSIGHT_CTA_CLASS}>
          Продвигать
        </button>
      </div>
      <div className="pointer-events-none invisible absolute right-0 top-[calc(100%-6px)] z-[80] pt-3 opacity-0 transition-all duration-200 group-hover/v5conv:pointer-events-auto group-hover/v5conv:visible group-hover/v5conv:opacity-100 group-focus-within/v5conv:pointer-events-auto group-focus-within/v5conv:visible group-focus-within/v5conv:opacity-100">
        <GrowingDemandDropdownPanel />
      </div>
    </div>
  );
}

/** Вариант 5: три карточки в ряд — KPI, пополнение бюджета, продвижение (как в макете списка). */
export function ListHeaderVariant5Strip({
  showInsightCards = true,
  onRefillBudget,
  onPromote,
}: {
  showInsightCards?: boolean;
  onRefillBudget?: () => void;
  onPromote?: () => void;
}) {
  return (
    <div className="flex h-26 w-full min-w-0 items-stretch gap-3 overflow-visible">
      <div
        className="flex min-w-0 flex-1 items-stretch overflow-hidden rounded-[12px] bg-white px-5 shadow-sm"
        role="region"
        aria-label="Сводка по кабинету"
      >
        <div className="flex w-full flex-1 items-stretch justify-start gap-6 sm:gap-8">
          <div className={`shrink-0 ${VARIANT5_STAT_COL}`}>
            <p className={VARIANT5_STAT_LABEL}>Доля затрат</p>
            <div className="m-0 flex items-baseline gap-2 leading-none">
              <p className={VARIANT5_STAT_VALUE}>9,7 %</p>
              <p className="m-0 flex items-center gap-0.5 text-[11px] font-medium leading-none text-emerald-600">
                <ArrowUp className="h-2.5 w-2.5 rotate-180" aria-hidden />
                5.8%
              </p>
            </div>
          </div>
          <div className={`shrink-0 ${VARIANT5_STAT_COL}`}>
            <p className={VARIANT5_STAT_LABEL}>Сумма заказов</p>
            <div className="m-0 flex items-baseline gap-2 leading-none">
              <p className={VARIANT5_STAT_VALUE}>196 000 ₽</p>
              <p className="m-0 flex items-center gap-0.5 text-[11px] font-medium leading-none text-emerald-600">
                <ArrowUp className="h-2.5 w-2.5" aria-hidden />
                1.9%
              </p>
            </div>
          </div>
          <div className={`shrink-0 ${VARIANT5_STAT_COL}`}>
            <p className={VARIANT5_STAT_LABEL}>Заказы</p>
            <div className="m-0 flex items-baseline gap-2 leading-none">
              <p className={VARIANT5_STAT_VALUE}>127</p>
              <p className="m-0 flex items-center gap-0.5 text-[11px] font-medium leading-none text-emerald-600">
                <ArrowUp className="h-2.5 w-2.5" aria-hidden />
                12.6%
              </p>
            </div>
          </div>
        </div>
      </div>
      {showInsightCards ? (
        <>
          <Variant5BudgetInsightCard onRefillBudget={onRefillBudget} />
          <Variant5ConversionInsightCard onPromote={onPromote} />
        </>
      ) : null}
    </div>
  );
}

/** Вариант 2: три колонки «потенциал / спрос / новинки» в шапке списка кампаний */
export function ListHeaderInsightsStrip() {
  return (
    <div
      className="flex h-24 w-max max-w-[min(100%,520px)] shrink-0 items-center overflow-visible rounded-[12px] bg-white px-3 shadow-sm"
      role="region"
      aria-label="Подсказки по кампаниям и товарам"
    >
      <div className="flex h-full items-center gap-0.5">
        <BonusesWorkedInsightsColumn />
        <div className="mx-1.5 h-14 w-px shrink-0 bg-gray-200" aria-hidden />
        <GrowingDemandInsightsColumn />
      </div>
    </div>
  );
}

type NotificationCardProps = {
  item: BonusCampaignNotification;
  depth: number;
  isActive: boolean;
  isExiting: boolean;
  cardVariant?: BonusNotificationCardVariant;
  titleOverride?: string;
  titleAboveImage?: boolean;
  cardHeadline?: 'campaign' | 'product';
  actionButtonLabel?: string;
  onDismiss?: () => void;
  onRepeat?: () => void;
  onOpenDetail?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  canNavigate?: boolean;
  stackPageCount?: number;
  stackActiveIndex?: number;
  slideDirection?: 'next' | 'prev' | null;
  /** Единая ширина карточек в стопке (чтобы задние «хвосты» были видны) */
  stackLayoutWidth?: number;
};

const NotificationCard = forwardRef<HTMLDivElement, NotificationCardProps>(function NotificationCard(
  {
  item,
  depth,
  isActive,
  isExiting,
  cardVariant = 1,
  titleOverride,
  titleAboveImage = false,
  cardHeadline = 'campaign',
  actionButtonLabel = 'Продвигать',
  onDismiss,
  onRepeat,
  onOpenDetail,
  onPrev,
  onNext,
  canNavigate = false,
  stackPageCount = 0,
  stackActiveIndex = 0,
  slideDirection = null,
  stackLayoutWidth,
  },
  ref,
) {
  const title = titleOverride ?? item.title ?? 'Кампания потратила бонусы';
  const headlineText =
    cardHeadline === 'product'
      ? item.productDisplayName ?? item.launchPreset.product.productName
      : item.campaignName;
  const { height, opacity, translateX } = stackMetrics(depth);

  const transform = isExiting
    ? 'translate(-10px, -50%) scale(0.98)'
    : `translate(${translateX}px, -50%)`;

  const slideInClass =
    isActive && slideDirection === 'next'
      ? 'animate-in fade-in slide-in-from-right-3 duration-300 ease-out'
      : isActive && slideDirection === 'prev'
        ? 'animate-in fade-in slide-in-from-left-3 duration-300 ease-out'
        : '';

  const backStackWidth =
    !isActive && stackLayoutWidth != null && stackLayoutWidth > 0 ? stackLayoutWidth : undefined;

  return (
    <div
      ref={ref}
      className={`pointer-events-none absolute left-0 top-1/2 max-w-full ${backStackWidth ? '' : 'w-max'} ${STACK_TRANSITION}`}
      style={{
        zIndex: 40 - depth,
        height,
        transform,
        opacity: isExiting ? 0 : opacity,
        ...(backStackWidth ? { width: backStackWidth } : undefined),
      }}
    >
      <div
        key={isActive ? item.id : undefined}
        className={`relative flex h-full rounded-[12px] pl-2 pr-2 ${backStackWidth ? 'w-full' : 'w-max max-w-full'} ${notificationCardSurfaceClass(cardVariant)} ${
          titleAboveImage ? 'flex-col gap-1 py-1.5' : 'items-center gap-1.5 py-0'
        } ${isActive ? 'pointer-events-auto' : 'pointer-events-none'} ${slideInClass}`}
      >
        {titleAboveImage ? (
          <p
            className={`pointer-events-none z-10 m-0 shrink-0 truncate pt-1 text-left text-[11px] leading-[11px] text-[#767386] ${
              isActive && canNavigate ? 'pl-5 pr-7' : 'pl-0 pr-7'
            }`}
          >
            {title}
          </p>
        ) : null}

        {isActive && !isExiting && (
          <button
            type="button"
            aria-label="Закрыть уведомление"
            onClick={onDismiss}
            className="absolute right-1.5 top-1.5 z-20 flex h-5 w-5 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-3 w-3" aria-hidden />
          </button>
        )}

        <div
          className={`flex w-max items-center gap-1.5 ${
            titleAboveImage ? 'pb-4 pt-1' : ''
          }`}
        >
          {isActive && !isExiting && canNavigate && onPrev ? (
            <button
              type="button"
              aria-label="Предыдущее уведомление"
              onClick={onPrev}
              className="flex h-6 w-5 shrink-0 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <ChevronRight className="h-3.5 w-3.5 rotate-180" aria-hidden />
            </button>
          ) : titleAboveImage ? (
            <span className="w-5 shrink-0" aria-hidden />
          ) : (
            <span className="w-0 shrink-0" aria-hidden />
          )}

          <div className="flex shrink-0 overflow-visible pl-0.5 pr-0.5">
          <NotificationCardBody
            imageUrl={item.imageUrl}
            title={title}
            campaignName={headlineText}
            shows={item.views}
            ctr={item.ctr}
            season={item.season}
            titleAboveImage={titleAboveImage}
            onTitleClick={isActive && !isExiting ? onOpenDetail : undefined}
          />
          </div>

        {isActive && !isExiting && (
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={onRepeat}
              className="ml-5 whitespace-nowrap rounded-lg bg-[#f3e8ff] px-2.5 py-1.5 text-[11px] font-semibold leading-none text-[#7c3aed] transition-colors hover:bg-[#ede9fe]"
            >
              {actionButtonLabel}
            </button>
            {canNavigate && onNext ? (
              <button
                type="button"
                aria-label="Следующее уведомление"
                onClick={onNext}
                className="flex h-6 w-5 shrink-0 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </button>
            ) : null}
          </div>
        )}
        </div>

        {isActive && !isExiting && stackPageCount > 1 && (
          <div
            className="pointer-events-none absolute bottom-1.5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 pb-[5px]"
            aria-hidden
          >
            {Array.from({ length: stackPageCount }, (_, i) => (
              <span
                key={i}
                className={`h-1 w-1 rounded-full ${
                  i === stackActiveIndex ? 'bg-[#9a41fe]' : 'bg-gray-300/90'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

function BonusCampaignNotificationCardStack({
  items,
  cardVariant = 1,
  titleOverride,
  titleAboveImage = false,
  cardHeadline = 'campaign',
  actionButtonLabel = 'Продвигать',
  onDismissItem,
  onRepeatItem,
  onOpenItemDetail,
}: {
  items: BonusCampaignNotification[];
  cardVariant?: BonusNotificationCardVariant;
  titleOverride?: string;
  titleAboveImage?: boolean;
  cardHeadline?: 'campaign' | 'product';
  actionButtonLabel?: string;
  onDismissItem: (id: string) => void;
  onRepeatItem: (item: BonusCampaignNotification) => void;
  onOpenItemDetail?: (item: BonusCampaignNotification) => void;
}) {
  const [exitingId, setExitingId] = useState<string | null>(null);
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev' | null>(null);
  const [order, setOrder] = useState<string[]>(() => items.map((item) => item.id));
  const activeCardRef = useRef<HTMLDivElement>(null);
  const [activeCardWidth, setActiveCardWidth] = useState(FALLBACK_CARD_WIDTH_PX);

  const remeasureActiveCard = useCallback(() => {
    const el = activeCardRef.current;
    if (el) setActiveCardWidth(el.offsetWidth);
  }, []);

  useEffect(() => {
    const ids = items.map((item) => item.id);
    setOrder((prev) => {
      const kept = prev.filter((id) => ids.includes(id));
      const added = ids.filter((id) => !kept.includes(id));
      return [...kept, ...added];
    });
  }, [items]);

  const orderedItems = useMemo(() => {
    const byId = new Map(items.map((item) => [item.id, item]));
    return order.map((id) => byId.get(id)).filter((item): item is BonusCampaignNotification => !!item);
  }, [items, order]);

  const visible = orderedItems.slice(0, 3);
  const canNavigate = orderedItems.length > 1;

  const rotateNext = useCallback(() => {
    setSlideDirection('next');
    setOrder((prev) => (prev.length > 1 ? [...prev.slice(1), prev[0]!] : prev));
    window.setTimeout(() => setSlideDirection(null), 320);
  }, []);

  const rotatePrev = useCallback(() => {
    setSlideDirection('prev');
    setOrder((prev) => (prev.length > 1 ? [prev[prev.length - 1]!, ...prev.slice(0, -1)] : prev));
    window.setTimeout(() => setSlideDirection(null), 320);
  }, []);

  const stackPageCount = orderedItems.length;
  const stackActiveIndex = useMemo(() => {
    const frontId = orderedItems[0]?.id;
    if (!frontId) return 0;
    const idx = items.findIndex((item) => item.id === frontId);
    return idx >= 0 ? idx : 0;
  }, [orderedItems, items]);

  const peekCount = Math.min(2, Math.max(0, visible.length - 1));
  const activeItem = orderedItems[0];
  const containerWidth = Math.ceil(stackRightEdge(peekCount, activeCardWidth)) + 4;

  useLayoutEffect(() => {
    remeasureActiveCard();
  }, [
    remeasureActiveCard,
    activeItem?.id,
    titleOverride,
    titleAboveImage,
    cardHeadline,
    actionButtonLabel,
    exitingId,
    slideDirection,
  ]);

  useEffect(() => {
    const el = activeCardRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => remeasureActiveCard());
    observer.observe(el);
    return () => observer.disconnect();
  }, [remeasureActiveCard, activeItem?.id]);

  const handleDismissActive = useCallback(() => {
    const active = orderedItems[0];
    if (!active || exitingId) return;
    setExitingId(active.id);
    window.setTimeout(() => {
      onDismissItem(active.id);
      setExitingId(null);
    }, DISMISS_MS);
  }, [orderedItems, exitingId, onDismissItem]);

  if (orderedItems.length === 0) return null;

  return (
    <div
      className="relative h-24 shrink-0 overflow-hidden transition-[width] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)]"
      style={{ width: containerWidth, maxWidth: '100%' }}
      aria-live="polite"
    >
      {[...visible].reverse().map((item, reverseIndex) => {
        const index = visible.length - 1 - reverseIndex;
        const depth = exitingId && index > 0 ? index - 1 : index;
        const isActive = index === 0;
        return (
          <NotificationCard
            key={`stack-slot-${index}`}
            ref={isActive ? activeCardRef : undefined}
            item={item}
            depth={depth}
            isActive={isActive}
            isExiting={isActive && exitingId === item.id}
            cardVariant={cardVariant}
            titleOverride={titleOverride}
            titleAboveImage={titleAboveImage}
            cardHeadline={cardHeadline}
            actionButtonLabel={actionButtonLabel}
            onDismiss={isActive ? handleDismissActive : undefined}
            onRepeat={isActive ? () => onRepeatItem(item) : undefined}
            onOpenDetail={isActive && onOpenItemDetail ? () => onOpenItemDetail(item) : undefined}
            onPrev={isActive && canNavigate ? rotatePrev : undefined}
            onNext={isActive && canNavigate ? rotateNext : undefined}
            canNavigate={canNavigate}
            stackPageCount={isActive ? stackPageCount : 0}
            stackActiveIndex={isActive ? stackActiveIndex : 0}
            slideDirection={isActive ? slideDirection : null}
            stackLayoutWidth={activeCardWidth}
          />
        );
      })}
    </div>
  );
}

/** Блок слева: тот же стек карточек, что и «Кампания потратила бонусы» */
export function BonusCampaignNotificationPeekCard({
  items,
  title,
  cardVariant = 1,
  onDismissItem,
  onRepeatItem,
  onOpenItemDetail,
}: {
  items: BonusCampaignNotification[];
  title: string;
  cardVariant?: BonusNotificationCardVariant;
  onDismissItem: (id: string) => void;
  onRepeatItem: (item: BonusCampaignNotification) => void;
  onOpenItemDetail?: (item: BonusCampaignNotification) => void;
}) {
  return (
    <BonusCampaignNotificationCardStack
      items={items}
      cardVariant={cardVariant}
      titleOverride={title}
      titleAboveImage
      cardHeadline="product"
      onDismissItem={onDismissItem}
      onRepeatItem={onRepeatItem}
      onOpenItemDetail={onOpenItemDetail}
    />
  );
}

export function BonusCampaignNotificationStack({
  items,
  cardVariant = 1,
  onDismissItem,
  onRepeatItem,
  onOpenItemDetail,
}: {
  items: BonusCampaignNotification[];
  cardVariant?: BonusNotificationCardVariant;
  onDismissItem: (id: string) => void;
  onRepeatItem: (item: BonusCampaignNotification) => void;
  onOpenItemDetail?: (item: BonusCampaignNotification) => void;
}) {
  return (
    <BonusCampaignNotificationCardStack
      items={items}
      cardVariant={cardVariant}
      titleOverride="Бонусы сработали"
      titleAboveImage
      actionButtonLabel="Пополнить бюджет"
      onDismissItem={onDismissItem}
      onRepeatItem={onRepeatItem}
      onOpenItemDetail={onOpenItemDetail}
    />
  );
}
