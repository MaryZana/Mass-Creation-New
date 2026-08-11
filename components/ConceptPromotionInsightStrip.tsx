import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  StatsDateRangeBar,
  type StatsRangeId,
} from '../pages/AudienceMetricsPage';
import {
  ArrowUp,
  ChevronRight,
  Clock,
  X,
} from './Icons';

/** Максимум закрываемых баннеров одновременно; блок «Скидка WB» всегда рядом. */
const MAX_VISIBLE_CLOSABLE_CARDS = 3;

type ConceptInsightCardKind =
  | 'budget'
  | 'new-product'
  | 'top-cpo'
  | 'interest'
  | 'promo-bonus'
  | 'promo-bonus-urgent'
  | 'cpc-promote';

type ConceptInsightCard = {
  id: string;
  kind: ConceptInsightCardKind;
  image: string;
  title: string;
};

const CONCEPT_INSIGHT_CARD_QUEUE: ConceptInsightCard[] = [
  {
    id: 'budget',
    kind: 'budget',
    image:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=96&h=96&fit=crop&q=80',
    title: 'Пополнить бюджет',
  },
  {
    id: 'new-product',
    kind: 'new-product',
    image:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=96&h=96&fit=crop&q=80',
    title: 'Продвигать новинку',
  },
  {
    id: 'top-cpo',
    kind: 'top-cpo',
    image:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=96&h=96&fit=crop&q=80',
    title: 'Запустить продвижение',
  },
  {
    id: 'interest',
    kind: 'interest',
    image:
      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=96&h=96&fit=crop&q=80',
    title: 'Увеличить ставку',
  },
  {
    id: 'promo-bonus',
    kind: 'promo-bonus',
    image:
      'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=96&h=96&fit=crop&q=80',
    title: 'Тратить промобонусы',
  },
  {
    id: 'promo-bonus-urgent',
    kind: 'promo-bonus-urgent',
    image:
      'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=96&h=96&fit=crop&q=80',
    title: 'Тратить промобонусы',
  },
  {
    id: 'cpc-promote',
    kind: 'cpc-promote',
    image:
      'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=96&h=96&fit=crop&q=80',
    title: 'Продвигать по CPC',
  },
];

function Trend({
  text,
  down = false,
}: {
  text: string;
  down?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium leading-none text-emerald-600">
      <ArrowUp className={`h-2.5 w-2.5 ${down ? 'rotate-180' : ''}`} aria-hidden />
      {text}
    </span>
  );
}

function MetricCell({
  label,
  value,
  trend,
  trendDown,
  selected,
  onSelect,
}: {
  label: string;
  value: string;
  trend: string;
  trendDown?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const content = (
    <>
      <div className="mb-0 flex items-center gap-1.5">
        <p className="mb-0 text-[11px] leading-none text-[#767386]">{label}</p>
      </div>
      <div className="mt-1.5 flex items-baseline gap-1.5 leading-none">
        <p className="mb-0 text-sm font-bold tabular-nums tracking-tight text-gray-900">{value}</p>
        <Trend text={trend} down={trendDown} />
      </div>
    </>
  );

  if (!onSelect) {
    return <div className="min-w-0 shrink-0">{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`min-w-0 shrink-0 rounded-xl px-2 py-1.5 text-left transition-colors ${
        selected
          ? 'bg-[#F2F2F7] ring-1 ring-[rgba(74,74,89,0.16)]'
          : 'hover:bg-[#F8F8FA]'
      }`}
    >
      {content}
    </button>
  );
}

function CardThumb({ src, alt = '' }: { src: string; alt?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      className="h-10 w-10 shrink-0 rounded-xl object-cover bg-gray-100"
      loading="lazy"
    />
  );
}

function CardMeta({ card }: { card: ConceptInsightCard }) {
  switch (card.kind) {
    case 'budget':
      return (
        <div className="min-w-0 text-right">
          <p className="text-[11px] leading-none text-[#767386]">Остаток</p>
          <p className="mt-1 text-sm font-bold leading-none text-[#E11D48]">0 ₽</p>
        </div>
      );
    case 'new-product':
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold leading-none text-emerald-700">
          Новое
        </span>
      );
    case 'top-cpo':
      return (
        <div className="flex items-center gap-1 text-[11px] font-medium leading-none text-[#767386]">
          <span>Топ CPO</span>
          <ArrowUp className="h-3 w-3 text-[#9A41FE]" aria-hidden />
        </div>
      );
    case 'interest':
      return (
        <div className="flex items-center gap-1 text-[11px] font-medium leading-none text-[#767386]">
          <span>Интерес</span>
          <ArrowUp className="h-3 w-3 rotate-180 text-orange-500" aria-hidden />
        </div>
      );
    case 'promo-bonus':
      return (
        <div className="min-w-0 text-right">
          <p className="text-[11px] leading-none text-[#767386]">До 10 февр</p>
          <p className="mt-1 text-sm font-bold leading-none text-gray-900">967 B</p>
        </div>
      );
    case 'promo-bonus-urgent':
      return (
        <div className="min-w-0 text-right">
          <p className="inline-flex items-center gap-1 text-[11px] leading-none text-orange-500">
            <Clock className="h-3 w-3" aria-hidden />
            До 10 февр
          </p>
          <p className="mt-1 text-sm font-bold leading-none text-orange-500">10 967 B</p>
        </div>
      );
    case 'cpc-promote':
      return (
        <div className="min-w-0 text-right">
          <p className="text-[11px] leading-none text-[#767386]">Клики в дн</p>
          <p className="mt-1 text-sm font-bold leading-none text-gray-900">~ 100</p>
        </div>
      );
    default:
      return null;
  }
}

function ClosableInsightCard({
  card,
  onClose,
  onClick,
}: {
  card: ConceptInsightCard;
  onClose: () => void;
  onClick?: () => void;
}) {
  return (
    <div className="group relative flex h-[112px] w-[168px] shrink-0 flex-col justify-between rounded-2xl bg-white p-3 shadow-sm">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-gray-500 opacity-0 shadow-sm transition-opacity hover:bg-gray-100 hover:text-gray-800 group-hover:opacity-100"
        aria-label="Закрыть"
        title="Закрыть"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>

      <button
        type="button"
        onClick={onClick}
        className="flex h-full w-full flex-col justify-between text-left"
      >
        <div className="flex items-start justify-between gap-2 pr-5">
          <CardThumb src={card.image} />
          <CardMeta card={card} />
        </div>
        <div className="flex items-end justify-between gap-2">
          <span className="text-sm font-bold leading-snug text-gray-900">{card.title}</span>
          <ChevronRight className="mb-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden />
        </div>
      </button>
    </div>
  );
}

function WbDiscountCard() {
  return (
    <div
      className="flex h-[112px] w-[168px] shrink-0 flex-col justify-between rounded-2xl bg-white p-3 shadow-sm"
      role="region"
      aria-label="Скидка WB"
    >
      <div className="flex justify-start">
        <svg width="56" height="32" viewBox="0 0 56 32" aria-hidden>
          <path
            d="M4 28 A24 24 0 0 1 52 28"
            fill="none"
            stroke="#ECECEF"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M4 28 A24 24 0 0 1 38 8"
            fill="none"
            stroke="#9A41FE"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="flex items-end gap-1">
        <p className="text-sm font-bold leading-snug text-gray-900">
          Скидка WB растёт{' '}
          <button
            type="button"
            className="font-semibold text-[#2979FF] hover:underline"
          >
            в этих категориях
          </button>
        </p>
      </div>
    </div>
  );
}

type ConceptMetricSnapshot = {
  ordersSum: string;
  ordersTrend: string;
  spend: string;
  spendTrend: string;
  spendShare: string;
  spendShareTrend: string;
  spendTrendDown?: boolean;
  spendShareTrendDown?: boolean;
  roas: string;
  roasTrend: string;
  ctr: string;
  ctrTrend: string;
};

/** Демо-цифры сводки по периоду (меняются вместе с табами календаря).
 * Согласованы: доля затрат = spend/orders, ROAS = orders/spend.
 */
const CONCEPT_METRICS_BY_RANGE: Record<StatsRangeId, ConceptMetricSnapshot> = {
  today: {
    ordersSum: '42 500 ₽',
    ordersTrend: '1,4%',
    spend: '4 250 ₽',
    spendTrend: '0,9%',
    spendTrendDown: true,
    spendShare: '10,0 %',
    spendShareTrend: '1,2%',
    spendShareTrendDown: true,
    roas: '10,00',
    roasTrend: '0,6%',
    ctr: '5,1 %',
    ctrTrend: '3,4%',
  },
  yesterday: {
    ordersSum: '38 900 ₽',
    ordersTrend: '2,1%',
    spend: '4 050 ₽',
    spendTrend: '1,5%',
    spendTrendDown: true,
    spendShare: '10,4 %',
    spendShareTrend: '0,8%',
    spendShareTrendDown: true,
    roas: '9,60',
    roasTrend: '0,4%',
    ctr: '4,9 %',
    ctrTrend: '2,1%',
  },
  week: {
    ordersSum: '268 000 ₽',
    ordersTrend: '4,2%',
    spend: '26 800 ₽',
    spendTrend: '2,4%',
    spendTrendDown: true,
    spendShare: '10,0 %',
    spendShareTrend: '3,6%',
    spendShareTrendDown: true,
    roas: '10,00',
    roasTrend: '1,2%',
    ctr: '4,8 %',
    ctrTrend: '7,3%',
  },
  twoWeeks: {
    ordersSum: '512 000 ₽',
    ordersTrend: '3,8%',
    spend: '51 200 ₽',
    spendTrend: '2,7%',
    spendTrendDown: true,
    spendShare: '10,0 %',
    spendShareTrend: '3,2%',
    spendShareTrendDown: true,
    roas: '10,00',
    roasTrend: '1,4%',
    ctr: '4,75 %',
    ctrTrend: '6,8%',
  },
  month: {
    ordersSum: '1 170 000 ₽',
    ordersTrend: '3,1%',
    spend: '117 000 ₽',
    spendTrend: '3,1%',
    spendTrendDown: true,
    spendShare: '10,0 %',
    spendShareTrend: '5,8%',
    spendShareTrendDown: true,
    roas: '10,00',
    roasTrend: '1,9%',
    ctr: '4,7 %',
    ctrTrend: '12,6%',
  },
  quarter: {
    ordersSum: '4 040 000 ₽',
    ordersTrend: '5,4%',
    spend: '390 900 ₽',
    spendTrend: '4,1%',
    spendTrendDown: true,
    spendShare: '9,7 %',
    spendShareTrend: '2,9%',
    spendShareTrendDown: true,
    roas: '10,34',
    roasTrend: '2,6%',
    ctr: '4,5 %',
    ctrTrend: '8,1%',
  },
  halfYear: {
    ordersSum: '7 070 000 ₽',
    ordersTrend: '6,8%',
    spend: '718 700 ₽',
    spendTrend: '5,2%',
    spendTrendDown: true,
    spendShare: '10,2 %',
    spendShareTrend: '4,4%',
    spendShareTrendDown: true,
    roas: '9,84',
    roasTrend: '3,2%',
    ctr: '4,3 %',
    ctrTrend: '6,5%',
  },
  year: {
    ordersSum: '14 220 000 ₽',
    ordersTrend: '8,2%',
    spend: '1 422 000 ₽',
    spendTrend: '6,7%',
    spendTrendDown: true,
    spendShare: '10,0 %',
    spendShareTrend: '3,8%',
    spendShareTrendDown: true,
    roas: '10,00',
    roasTrend: '4,1%',
    ctr: '4,2 %',
    ctrTrend: '5,9%',
  },
  custom: {
    ordersSum: '742 000 ₽',
    ordersTrend: '2,7%',
    spend: '81 620 ₽',
    spendTrend: '1,8%',
    spendTrendDown: true,
    spendShare: '11,0 %',
    spendShareTrend: '2,2%',
    spendShareTrendDown: true,
    roas: '9,09',
    roasTrend: '1,1%',
    ctr: '4,6 %',
    ctrTrend: '4,8%',
  },
};

function ConceptMetricsBlock({
  expand,
  range,
  onRangeChange,
  onStatsClick,
}: {
  expand: boolean;
  range: StatsRangeId;
  onRangeChange: (id: StatsRangeId) => void;
  onStatsClick: () => void;
}) {
  const metrics = CONCEPT_METRICS_BY_RANGE[range];

  return (
    <section
      className={`flex min-h-[112px] min-w-0 flex-col justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ${
        expand ? 'flex-1 w-full' : 'flex-1'
      }`}
      aria-label="Сводка"
    >
      <StatsDateRangeBar value={range} onChange={onRangeChange} compact />

      <div
        className={`flex flex-wrap items-end gap-x-6 gap-y-3 sm:gap-x-8 ${
          expand ? 'justify-start lg:justify-between' : 'justify-start'
        }`}
      >
        <MetricCell
          label="Сумма заказов"
          value={metrics.ordersSum}
          trend={metrics.ordersTrend}
          onSelect={onStatsClick}
        />
        <MetricCell
          label="Затраты"
          value={metrics.spend}
          trend={metrics.spendTrend}
          trendDown={metrics.spendTrendDown}
          onSelect={onStatsClick}
        />
        <MetricCell
          label="Доля затрат"
          value={metrics.spendShare}
          trend={metrics.spendShareTrend}
          trendDown={metrics.spendShareTrendDown}
          onSelect={onStatsClick}
        />
        <MetricCell
          label="ROAS"
          value={metrics.roas}
          trend={metrics.roasTrend}
          onSelect={onStatsClick}
        />
        <MetricCell
          label="CTR"
          value={metrics.ctr}
          trend={metrics.ctrTrend}
          onSelect={onStatsClick}
        />
      </div>
    </section>
  );
}


export function ConceptPromotionInsightStrip({
  onBudgetClick,
  onPromoteClick,
  onBidClick,
  onBonusClick,
}: {
  onBudgetClick?: () => void;
  onPromoteClick?: () => void;
  onBidClick?: () => void;
  onBonusClick?: () => void;
}) {
  const navigate = useNavigate();
  const [closedIds, setClosedIds] = useState<Set<string>>(new Set());
  const [range, setRange] = useState<StatsRangeId>('month');

  const remainingCards = useMemo(
    () => CONCEPT_INSIGHT_CARD_QUEUE.filter((card) => !closedIds.has(card.id)),
    [closedIds],
  );

  const visibleCards = remainingCards.slice(0, MAX_VISIBLE_CLOSABLE_CARDS);
  const allClosableClosed = remainingCards.length === 0;

  const handleCardClick = (card: ConceptInsightCard) => {
    switch (card.kind) {
      case 'budget':
        onBudgetClick?.();
        break;
      case 'new-product':
      case 'top-cpo':
      case 'cpc-promote':
        onPromoteClick?.();
        break;
      case 'interest':
        onBidClick?.();
        break;
      case 'promo-bonus':
      case 'promo-bonus-urgent':
        onBonusClick?.();
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      <div className="flex w-full min-w-0 items-stretch gap-3">
        <ConceptMetricsBlock
          expand={allClosableClosed}
          range={range}
          onRangeChange={setRange}
          onStatsClick={() => {
            navigate('/stats');
          }}
        />

        <div className="flex shrink-0 items-stretch gap-3">
          {visibleCards.map((card) => (
            <ClosableInsightCard
              key={card.id}
              card={card}
              onClose={() =>
                setClosedIds((prev) => {
                  const next = new Set(prev);
                  next.add(card.id);
                  return next;
                })
              }
              onClick={() => handleCardClick(card)}
            />
          ))}
          <WbDiscountCard />
        </div>
      </div>
    </div>
  );
}
