import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type StatsRangeId } from '../pages/AudienceMetricsPage';
import {
  ArrowUp,
  Calendar,
  ChevronRight,
  Clock,
  Gift,
  X,
} from './Icons';
import { BONUS_PACKAGES } from './SingleCampaignPage';

/** Максимум закрываемых баннеров одновременно; блок «Скидка WB» всегда рядом. */
const MAX_VISIBLE_CLOSABLE_CARDS = 2;

const CARD_H = 'h-[124px]';
const SIDE_CARD_W = 'w-[160.57px]';
const WB_DISCOUNT_CARD_W = 'w-[220px]';
const WB_DISCOUNT_BARS_CARD_W = 'w-[272px]';

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
    id: 'cpc-promote',
    kind: 'cpc-promote',
    image:
      'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=96&h=96&fit=crop&q=80',
    title: 'Запустить кампанию CPC',
  },
  {
    id: 'promo-bonus',
    kind: 'promo-bonus',
    image: '',
    title: 'Потратить промобонусы',
  },
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
    id: 'promo-bonus-urgent',
    kind: 'promo-bonus-urgent',
    image: '',
    title: 'Потратить промобонусы',
  },
];

const RANGE_DATE_LABELS: Record<StatsRangeId, string> = {
  today: '17.09.26 — 17.09.26',
  yesterday: '16.09.26 — 16.09.26',
  week: '11.09.26 — 17.09.26',
  twoWeeks: '04.09.26 — 17.09.26',
  month: '2020.22.02 — 2020.22.02',
  quarter: '17.06.26 — 17.09.26',
  halfYear: '17.03.26 — 17.09.26',
  year: '17.09.25 — 17.09.26',
  custom: '07.07.26 — 05.08.26',
};

const RANGE_CYCLE: StatsRangeId[] = [
  'today',
  'yesterday',
  'week',
  'twoWeeks',
  'month',
  'quarter',
  'halfYear',
  'year',
];

function Trend({
  text,
  down = false,
}: {
  text: string;
  down?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[12px] font-medium leading-none text-[#22C55E]">
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
      <p className="mb-0 text-[12px] leading-none text-[#8B8B9A]">{label}</p>
      <div className="mt-2 flex items-baseline gap-1.5 leading-none">
        <p className="mb-0 text-[17px] font-bold tabular-nums tracking-tight text-gray-900">
          {value}
        </p>
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
      className={`min-w-0 shrink-0 rounded-xl px-1.5 py-1 text-left transition-colors ${
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
      className="h-9 w-9 shrink-0 rounded-[10px] object-cover bg-[#F3F5F8]"
      loading="lazy"
    />
  );
}

function PromoBonusThumb() {
  return (
    <div
      className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-gradient-to-br from-[#F3E8FF] to-[#E9D5FF]"
      aria-hidden
    >
      <Gift className="h-[18px] w-[18px] text-[#9A41FE]" />
    </div>
  );
}

function CardMeta({ card }: { card: ConceptInsightCard }) {
  switch (card.kind) {
    case 'budget':
      return (
        <div className="min-w-0 text-right">
          <p className="text-[11px] leading-none text-[#8B8B9A]">Остаток</p>
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
        <div className="flex items-center gap-1 text-[11px] font-medium leading-none text-[#8B8B9A]">
          <span>Топ CPO</span>
          <ArrowUp className="h-3 w-3 text-[#9A41FE]" aria-hidden />
        </div>
      );
    case 'interest':
      return (
        <div className="flex items-center gap-1 text-[11px] font-medium leading-none text-[#8B8B9A]">
          <span>Интерес</span>
          <ArrowUp className="h-3 w-3 rotate-180 text-orange-500" aria-hidden />
        </div>
      );
    case 'promo-bonus':
      return (
        <div className="min-w-0 text-right">
          <p className="text-[11px] leading-none text-[#8B8B9A]">До 10 фев</p>
          <p className="mt-1 text-sm font-bold leading-none text-gray-900">967 B</p>
        </div>
      );
    case 'promo-bonus-urgent': {
      const urgentPkg = BONUS_PACKAGES[1];
      return (
        <div className="min-w-0 text-right">
          <p className="inline-flex items-center gap-1 text-[11px] leading-none text-orange-500">
            <Clock className="h-3 w-3" aria-hidden />
            До {urgentPkg.expiry}
          </p>
          <p className="mt-1 text-sm font-bold leading-none text-orange-500">
            {urgentPkg.amount.toLocaleString('ru-RU')} B
          </p>
        </div>
      );
    }
    case 'cpc-promote':
      return (
        <div className="min-w-0 text-right">
          <p className="text-[11px] leading-none text-[#8B8B9A]">Клики в день</p>
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
    <div
      className={`group relative flex ${CARD_H} ${SIDE_CARD_W} max-h-[124px] shrink-0 flex-col justify-between rounded-[24px] bg-white p-3 shadow-[0_1px_3px_rgba(16,24,40,0.06)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(16,24,40,0.12)]`}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute right-2.5 top-2.5 z-10 flex h-5 w-5 items-center justify-center rounded-full text-[#B0B0BD] opacity-0 transition-[opacity,colors] hover:bg-gray-100 hover:text-gray-700 group-hover:opacity-100"
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
        <div className="flex items-start justify-between gap-2 pr-4">
          {card.kind === 'promo-bonus' || card.kind === 'promo-bonus-urgent' ? (
            <PromoBonusThumb />
          ) : (
            <CardThumb src={card.image} />
          )}
          <CardMeta card={card} />
        </div>
        <div className="flex items-end justify-between gap-1.5">
          <span className="text-[13px] font-bold leading-snug text-gray-900">{card.title}</span>
          <ChevronRight className="mb-0.5 h-3.5 w-3.5 shrink-0 text-[#C4C4D0]" aria-hidden />
        </div>
      </button>
    </div>
  );
}

type WbDiscountVariant = 'progress' | 'maxbonus' | 'bars';
type WbDiscountTheme = 'light' | 'dark';
type WbDiscountLevel = 'zero' | 'full';

const WB_DISCOUNT_VARIANT_TABS: { id: WbDiscountVariant; label: string }[] = [
  { id: 'progress', label: '8%' },
  { id: 'bars', label: 'Столбики' },
  { id: 'maxbonus', label: 'Бонус' },
];

const WB_DISCOUNT_LEVEL_TABS: { id: WbDiscountLevel; label: string }[] = [
  { id: 'zero', label: '0%' },
  { id: 'full', label: '8%' },
];

const WB_DISCOUNT_THEME_TABS: { id: WbDiscountTheme; label: string }[] = [
  { id: 'light', label: 'Светлая' },
  { id: 'dark', label: 'Тёмная' },
];

const WB_DISCOUNT_MAX_PERCENT = 10;

const WB_DISCOUNT_ZERO_PRESET = {
  target: 0,
  barFill: 8,
  barStripe: 48,
  animate: false as boolean,
  tooltipTitle: 'Сегодня у вас нет прироста к скидке WB',
  tooltipBody:
    'Продолжайте продвигать товары и запускать медиа кампании, чтобы заработать до +10% и увеличить скидку завтра',
};

type WbDiscountPreset = {
  target: number;
  animateFrom?: number;
  barFill: number;
  barStripe: number;
  animate: boolean;
  tooltipTitle: string;
  tooltipBody: string;
  tooltipBodySecondary?: string;
};

const WB_DISCOUNT_FULL_BASE: WbDiscountPreset = {
  target: 8,
  barFill: 80,
  barStripe: 100,
  animate: true,
  tooltipTitle: 'Сегодня у вас есть до +8% к скидке WB',
  tooltipBody:
    'Продолжайте продвигать товары и запускать медиа кампании, чтобы заработать до +10% и увеличить скидку завтра',
};

const WB_DISCOUNT_PRESETS: Record<WbDiscountVariant, WbDiscountPreset> = {
  progress: { ...WB_DISCOUNT_FULL_BASE },
  maxbonus: { ...WB_DISCOUNT_FULL_BASE },
  bars: { ...WB_DISCOUNT_FULL_BASE },
};

const WB_DISCOUNT_DURATION_MS = 1000;
/** Подвижный градиент после перезагрузки. */
const WB_DISCOUNT_MOTION_MS = 3000;

function WbDiscountCaptionLabel({ isDark }: { isDark: boolean }) {
  const accent = isDark ? 'text-white' : 'text-gray-900';
  return (
    <>
      Увеличить до{' '}
      <span className={`font-semibold tabular-nums ${accent}`}>10%</span>
    </>
  );
}

/** Последние 7 дней: справа — сегодня. */
const WB_DISCOUNT_WEEKDAY_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'] as const;
/** Бонус за 6 дней до сегодня (плавно), сегодня берётся из карточки. */
const WB_DISCOUNT_WEEK_BONUS_HISTORY = [6, 7, 8, 10, 9, 8] as const;

function buildWbDiscountWeekBonusDays(todayPercent: number) {
  const today = new Date();
  const days: { label: string; percent: number }[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const percent =
      todayPercent === 0
        ? 0
        : offset === 0
          ? todayPercent
          : WB_DISCOUNT_WEEK_BONUS_HISTORY[6 - offset];
    days.push({
      label: WB_DISCOUNT_WEEKDAY_SHORT[date.getDay()],
      percent,
    });
  }
  return days;
}

function wbDiscountWeekBonusColor(percent: number): string {
  if (percent >= 7) return '#22C55E';
  if (percent >= 4) return '#F4A261';
  return '#F87171';
}

function WbDiscountWeekBonusStrip({
  days,
}: {
  days: readonly { label: string; percent: number }[];
}) {
  return (
    <div className="mt-3" aria-label="Бонус за последние 7 дней">
      <div className="flex gap-1">
        {days.map((item, index) => {
          const isFirst = index === 0;
          const isLast = index === days.length - 1;
          return (
            <div
              key={`${item.label}-${index}`}
              className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
            >
              <div
                className={`flex h-7 w-full items-center justify-center px-0.5 text-[10px] font-bold tabular-nums leading-none text-white ${
                  isFirst ? 'rounded-l-md' : ''
                } ${isLast ? 'rounded-r-md' : ''} ${
                  !isFirst && !isLast ? 'rounded-sm' : ''
                }`}
                style={{ backgroundColor: wbDiscountWeekBonusColor(item.percent) }}
              >
                {item.percent}%
              </div>
              <span
                className={`text-[11px] font-medium leading-none ${
                  isLast ? 'text-white' : 'text-white/70'
                }`}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Быстрый старт, плавное замедление к концу — без выхода за 1. */
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function WbDiscountCard({
  variant,
  level = 'full',
  theme = 'light',
  onWbDiscountCardClick,
  tooltipSide = 'right',
}: {
  variant: WbDiscountVariant;
  level?: WbDiscountLevel;
  theme?: WbDiscountTheme;
  onWbDiscountCardClick?: () => void;
  /** Сторона тултипа относительно карточки: на правом краю экрана — left */
  tooltipSide?: 'left' | 'right';
}) {
  const preset = useMemo(
    () =>
      level === 'zero'
        ? { ...WB_DISCOUNT_PRESETS[variant], ...WB_DISCOUNT_ZERO_PRESET }
        : WB_DISCOUNT_PRESETS[variant],
    [variant, level],
  );
  const isDark = theme === 'dark';
  const isMaxBonus = variant === 'maxbonus';
  const isBars = variant === 'bars';
  const [percent, setPercent] = useState(0);
  const [barFill, setBarFill] = useState(0);
  const [barStripe, setBarStripe] = useState(0);
  const [stripesAnimating, setStripesAnimating] = useState(true);
  const [fillRunning, setFillRunning] = useState(true);
  const [fillBgPos, setFillBgPos] = useState<string | undefined>(undefined);
  const [fillAnimKey, setFillAnimKey] = useState(0);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    setStripesAnimating(true);
    setFillRunning(true);
    setFillBgPos(undefined);
    setFillAnimKey((k) => k + 1);

    const percentFrom = preset.animate ? (preset.animateFrom ?? 0) : preset.target;
    setPercent(percentFrom);
    setBarFill(0);
    setBarStripe(0);
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / WB_DISCOUNT_DURATION_MS);
      const eased = easeOutCubic(progress);
      if (preset.animate) {
        const from = preset.animateFrom ?? 0;
        const to = preset.target;
        setPercent(Math.round(from + (to - from) * eased));
      }
      setBarFill(Math.min(preset.barFill, Math.max(0, preset.barFill * eased)));
      setBarStripe(Math.min(preset.barStripe, Math.max(0, preset.barStripe * eased)));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setPercent(preset.target);
        setBarFill(preset.barFill);
        setBarStripe(preset.barStripe);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    const pauseTimeout = window.setTimeout(() => {
      const el = fillRef.current;
      if (el) {
        const pos = window.getComputedStyle(el).backgroundPosition;
        el.style.animation = 'none';
        el.style.backgroundPosition = pos;
        setFillBgPos(pos);
      }
      setFillRunning(false);
      setStripesAnimating(false);
    }, WB_DISCOUNT_MOTION_MS);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      window.clearTimeout(pauseTimeout);
    };
  }, [variant, preset]);

  const [tooltipOpen, setTooltipOpen] = useState(false);
  const tooltipCloseTimerRef = useRef<number | null>(null);

  const openTooltip = () => {
    if (tooltipCloseTimerRef.current != null) {
      window.clearTimeout(tooltipCloseTimerRef.current);
      tooltipCloseTimerRef.current = null;
    }
    setTooltipOpen(true);
  };

  const scheduleCloseTooltip = () => {
    if (tooltipCloseTimerRef.current != null) {
      window.clearTimeout(tooltipCloseTimerRef.current);
    }
    tooltipCloseTimerRef.current = window.setTimeout(() => {
      setTooltipOpen(false);
      tooltipCloseTimerRef.current = null;
    }, 400);
  };

  useEffect(() => {
    return () => {
      if (tooltipCloseTimerRef.current != null) {
        window.clearTimeout(tooltipCloseTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="group/wb relative shrink-0">
      <div
        className={`relative flex ${CARD_H} ${
          isBars ? WB_DISCOUNT_BARS_CARD_W : WB_DISCOUNT_CARD_W
        } max-h-[124px] flex-col justify-between overflow-hidden rounded-[24px] shadow-[0_1px_3px_rgba(16,24,40,0.06)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(16,24,40,0.12)] ${
          isMaxBonus || isBars ? 'px-4 pt-4 pb-3' : 'px-3.5 pt-3.5 pb-0.5'
        } ${
          onWbDiscountCardClick ? 'cursor-pointer' : ''
        } ${isDark ? 'bg-[#1A1B1F]' : 'bg-white'}`}
        role={onWbDiscountCardClick ? 'button' : 'region'}
        tabIndex={onWbDiscountCardClick ? 0 : undefined}
        aria-label="Скидка WB"
        aria-describedby="wb-discount-tooltip"
        aria-expanded={tooltipOpen}
        onClick={() => onWbDiscountCardClick?.()}
        onMouseEnter={openTooltip}
        onMouseLeave={scheduleCloseTooltip}
        onKeyDown={(e) => {
          if (!onWbDiscountCardClick) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onWbDiscountCardClick();
          }
        }}
      >
        {isBars ? (
          <div className="relative z-[1] flex h-full min-h-0 flex-1 flex-col justify-between py-0.5">
            <div>
              <p
                className={`mb-0 text-[13px] font-medium leading-[1.25] ${
                  isDark ? 'text-white/45' : 'text-[#9CA3AF]'
                }`}
              >
                Уровень бонуса
              </p>
              <p
                className={`mb-0 mt-0.5 text-[17px] font-bold leading-[1.15] tracking-tight tabular-nums ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
                aria-live="polite"
              >
                до +{percent}% к скидке WB
              </p>
            </div>

            <div className="flex items-end justify-between gap-3">
              <p
                className={`mb-0 flex items-center gap-0.5 text-[13px] font-medium leading-none ${
                  isDark ? 'text-white/45' : 'text-[#6B7280]'
                }`}
              >
                <span className="truncate">
                  <WbDiscountCaptionLabel isDark={isDark} />
                </span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
              </p>

              <div
                className="wb-discount-bars flex h-[48px] w-[92px] shrink-0 items-end justify-between gap-[3px]"
                aria-hidden
              >
                {Array.from({ length: WB_DISCOUNT_MAX_PERCENT }, (_, index) => {
                  const active = index < percent;
                  const zeroHint = percent === 0 && index === 0;
                  const heightPct = 28 + (index / (WB_DISCOUNT_MAX_PERCENT - 1)) * 72;
                  return (
                    <span
                      key={index}
                      className={`wb-discount-bars-item relative block w-[7px] overflow-hidden rounded-full ${
                        active
                          ? 'wb-discount-bars-item--active'
                          : isDark
                            ? 'bg-white/20'
                            : 'bg-[#E5E7EB]'
                      }`}
                      style={{
                        height: `${heightPct}%`,
                        animationDelay: `${index * 45}ms`,
                      }}
                    >
                      {zeroHint ? (
                        <span
                          className="wb-discount-bars-item--active absolute inset-x-0 bottom-0 rounded-full"
                          style={{ height: '28%' }}
                        />
                      ) : null}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        ) : isMaxBonus ? (
          <>
            <div className="relative z-[1] flex min-h-0 flex-1 flex-col justify-between gap-2">
              <p
                className={`mb-0 text-[12px] font-medium leading-[1.25] ${
                  isDark ? 'text-white/45' : 'text-[#9CA3AF]'
                }`}
              >
                Максимальный бонус к скидке WB на сегодня
              </p>
              <p
                className="mb-0 flex items-baseline gap-1 leading-none"
                aria-live="polite"
              >
                <span
                  className={`text-[28px] font-bold tracking-tight tabular-nums ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  +{percent}%
                </span>
                <span
                  className={`text-[28px] font-bold tracking-tight tabular-nums ${
                    isDark ? 'text-white/35' : 'text-[#D1D5DB]'
                  }`}
                >
                  /{WB_DISCOUNT_MAX_PERCENT}%
                </span>
              </p>
              <div
                className={`relative h-[14px] w-full overflow-hidden rounded-full ${
                  isDark ? 'bg-white/15' : 'bg-[#EEF0F4]'
                }`}
                aria-hidden
              >
                <div
                  className={`wb-discount-stripes absolute inset-y-0 left-0 rounded-full${
                    isDark ? ' is-dark' : ''
                  }${stripesAnimating ? ' is-animating' : ''}`}
                  style={{ width: `${barStripe}%` }}
                />
                <div
                  key={fillAnimKey}
                  ref={fillRef}
                  className={`wb-discount-fill absolute inset-y-0 left-0 rounded-full${
                    fillRunning ? ' is-running' : ''
                  }`}
                  style={{
                    width: `${barFill}%`,
                    ...(fillBgPos ? { backgroundPosition: fillBgPos } : null),
                  }}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="w-fit">
              <p
                className={`mb-0 text-[17px] font-bold leading-[1.15] tracking-tight ${
                  isDark ? 'text-white/90' : 'text-gray-900'
                }`}
                aria-live="polite"
              >
                <span className="block">
                  <span className={isDark ? 'text-white/35' : 'text-[#9CA3AF]'}>
                    У вас
                  </span>{' '}
                  <span className={isDark ? 'text-white' : 'text-gray-900'}>
                    до{' '}
                    <span className="tabular-nums">+{percent}%</span>
                  </span>
                </span>
                <span
                  className={`block ${
                    isDark ? 'text-white/35' : 'text-[#9CA3AF]'
                  }`}
                >
                  к скидке WB
                </span>
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div
                className={`relative h-[14px] w-full overflow-hidden rounded-full ${
                  isDark ? 'bg-white/15' : 'bg-[#EEF0F4]'
                }`}
                aria-hidden
              >
                <div
                  className={`wb-discount-stripes absolute inset-y-0 left-0 rounded-full${
                    isDark ? ' is-dark' : ''
                  }${stripesAnimating ? ' is-animating' : ''}`}
                  style={{ width: `${barStripe}%` }}
                />
                <div
                  key={fillAnimKey}
                  ref={fillRef}
                  className={`wb-discount-fill absolute inset-y-0 left-0 rounded-full${
                    fillRunning ? ' is-running' : ''
                  }`}
                  style={{
                    width: `${barFill}%`,
                    ...(fillBgPos ? { backgroundPosition: fillBgPos } : null),
                  }}
                />
              </div>
              <p
                className={`flex items-center gap-0.5 text-[11px] font-medium leading-none ${
                  isDark ? 'text-white/45' : 'text-[#6B7280]'
                }`}
              >
                <span className="truncate">
                  <WbDiscountCaptionLabel isDark={isDark} />
                </span>
                <ChevronRight className="h-3 w-3 shrink-0" aria-hidden />
              </p>
            </div>
          </>
        )}
      </div>

      <div
        id="wb-discount-tooltip"
        role="tooltip"
        className={`absolute top-0 z-[90] w-[320px] transition-[opacity,transform] duration-200 ease-out ${
          tooltipSide === 'left' ? 'right-full pr-2' : 'left-full pl-2'
        } ${
          tooltipOpen
            ? 'pointer-events-auto translate-x-0 opacity-100'
            : tooltipSide === 'left'
              ? 'pointer-events-none -translate-x-2 opacity-0'
              : 'pointer-events-none translate-x-2 opacity-0'
        }`}
        onMouseEnter={openTooltip}
        onMouseLeave={scheduleCloseTooltip}
      >
        <div className="relative rounded-[24px] bg-black px-5 py-5 text-white shadow-xl">
          <span
            className={`absolute top-8 h-2.5 w-2.5 rotate-45 bg-black ${
              tooltipSide === 'left'
                ? 'right-0 translate-x-1/2'
                : 'left-0 -translate-x-1/2'
            }`}
            aria-hidden
          />
          <p className="text-[15px] font-bold leading-snug">
            {preset.tooltipTitle}
          </p>
          {preset.tooltipBodySecondary ? (
            <p className="mt-2 mb-0 text-[13px] font-normal leading-snug text-white/85">
              {preset.tooltipBodySecondary}
            </p>
          ) : null}
          <p
            className={`mb-0 text-[13px] font-normal leading-snug text-white/85 ${
              preset.tooltipBodySecondary ? 'mt-1.5' : 'mt-2'
            }`}
          >
            {preset.tooltipBody}
          </p>
          <WbDiscountWeekBonusStrip
            days={buildWbDiscountWeekBonusDays(level === 'zero' ? 0 : percent)}
          />
          <div className="mt-4 flex flex-nowrap items-center gap-2">
            <button
              type="button"
              className="inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-xl bg-white px-3 text-[13px] font-medium text-gray-900 transition-colors hover:bg-white/90"
              onClick={(e) => {
                e.stopPropagation();
                onWbDiscountCardClick?.();
              }}
            >
              Увеличить до <span className="font-bold tabular-nums">10%</span>
            </button>
            <button
              type="button"
              className="inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-xl bg-[#333333] px-3 text-[13px] font-medium text-white transition-colors hover:bg-[#444444]"
              onClick={(e) => e.stopPropagation()}
            >
              Условия
            </button>
          </div>
        </div>
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
  ordersTrendDown?: boolean;
  roas: string;
  roasTrend: string;
  ctr: string;
  ctrTrend: string;
};

/** Демо-цифры сводки по периоду (меняются вместе с датой). */
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
    ordersSum: '1 000 000 ₽',
    ordersTrend: '3,1%',
    ordersTrendDown: true,
    spend: '10 000 ₽',
    spendTrend: '3,1%',
    spendTrendDown: true,
    spendShare: '9.7 %',
    spendShareTrend: '5.8%',
    spendShareTrendDown: true,
    roas: '2,13',
    roasTrend: '1.9%',
    ctr: '4.7 %',
    ctrTrend: '12.6%',
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

function InsightDateField({
  range,
  onCycle,
}: {
  range: StatsRangeId;
  onCycle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onCycle}
      className="inline-flex h-9 w-fit max-w-full shrink-0 items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-3 text-left transition-colors hover:border-gray-300"
      aria-label="Период статистики"
      title="Сменить период"
    >
      <span className="whitespace-nowrap text-[14px] font-medium tabular-nums leading-none text-gray-900">
        {RANGE_DATE_LABELS[range]}
      </span>
      <Calendar className="h-4 w-4 shrink-0 text-[#9CA3AF]" aria-hidden />
    </button>
  );
}

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

  const cycleRange = () => {
    const idx = RANGE_CYCLE.indexOf(range);
    const next = RANGE_CYCLE[(idx + 1) % RANGE_CYCLE.length];
    onRangeChange(next);
  };

  return (
    <section
      className={`flex ${CARD_H} min-w-0 flex-col justify-between rounded-[24px] bg-white px-4 py-3 shadow-[0_1px_3px_rgba(16,24,40,0.06)] ${
        expand ? 'flex-1 w-full' : 'flex-1'
      }`}
      aria-label="Сводка"
    >
      <div className="w-fit">
        <InsightDateField range={range} onCycle={cycleRange} />
      </div>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-2 justify-start">
        <MetricCell
          label="Сумма заказов"
          value={metrics.ordersSum}
          trend={metrics.ordersTrend}
          trendDown={metrics.ordersTrendDown}
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
  onWbDiscountCardClick,
  wbDiscountOnly = false,
  withMetrics = false,
  wbDiscountTooltipSide = 'right',
}: {
  onBudgetClick?: () => void;
  onPromoteClick?: () => void;
  onBidClick?: () => void;
  onBonusClick?: (packageId: string) => void;
  onWbDiscountCardClick?: () => void;
  /** Только баннер «Скидка WB» (без метрик и insight-карточек) */
  wbDiscountOnly?: boolean;
  /** Вместе с wbDiscountOnly: баннер + блок метрик справа (без insight-карточек) */
  withMetrics?: boolean;
  /** Сторона тултипа у баннера скидки WB */
  wbDiscountTooltipSide?: 'left' | 'right';
}) {
  const navigate = useNavigate();
  const [closedIds, setClosedIds] = useState<Set<string>>(new Set());
  const [range, setRange] = useState<StatsRangeId>('month');
  const [wbDiscountVariant, setWbDiscountVariant] = useState<WbDiscountVariant>('bars');
  const [wbDiscountLevel, setWbDiscountLevel] = useState<WbDiscountLevel>('full');
  const [wbDiscountTheme, setWbDiscountTheme] = useState<WbDiscountTheme>('light');

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
        onBonusClick?.(BONUS_PACKAGES[0].id);
        break;
      case 'promo-bonus-urgent':
        onBonusClick?.(BONUS_PACKAGES[1].id);
        break;
      default:
        break;
    }
  };

  if (wbDiscountOnly) {
    if (withMetrics) {
      return (
        <div className="flex w-full min-w-0 items-stretch gap-3">
          <WbDiscountCard
            variant="bars"
            level="full"
            theme="light"
            onWbDiscountCardClick={onWbDiscountCardClick}
            tooltipSide={wbDiscountTooltipSide}
          />
          <ConceptMetricsBlock
            expand
            range={range}
            onRangeChange={setRange}
            onStatsClick={() => {
              navigate('/stats');
            }}
          />
        </div>
      );
    }

    return (
      <WbDiscountCard
        variant="bars"
        level="full"
        theme="light"
        onWbDiscountCardClick={onWbDiscountCardClick}
        tooltipSide={wbDiscountTooltipSide}
      />
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      <div className="flex w-full min-w-0 items-stretch gap-3">
        <WbDiscountCard
          key={`${wbDiscountVariant}-${wbDiscountLevel}-${wbDiscountTheme}`}
          variant={wbDiscountVariant}
          level={wbDiscountLevel}
          theme={wbDiscountTheme}
          onWbDiscountCardClick={onWbDiscountCardClick}
          tooltipSide={wbDiscountTooltipSide}
        />

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
        </div>
      </div>

      <div className="pointer-events-none fixed bottom-6 left-1/2 z-[80] max-w-[calc(100vw-2rem)] -translate-x-1/2">
        <div className="pointer-events-auto inline-flex max-w-full items-center gap-2 overflow-x-auto rounded-xl border border-gray-200 bg-white/90 p-1 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4">
          <div
            className="inline-flex shrink-0 gap-1"
            role="tablist"
            aria-label="Вариант виджета скидки WB"
          >
            {WB_DISCOUNT_VARIANT_TABS.map((tab) => {
              const selected = wbDiscountVariant === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setWbDiscountVariant(tab.id)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    selected
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="h-6 w-px shrink-0 bg-gray-200" aria-hidden />
          <div
            className="inline-flex shrink-0 gap-1"
            role="tablist"
            aria-label="Уровень скидки WB"
          >
            {WB_DISCOUNT_LEVEL_TABS.map((tab) => {
              const selected = wbDiscountLevel === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setWbDiscountLevel(tab.id)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    selected
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="h-6 w-px shrink-0 bg-gray-200" aria-hidden />
          <div
            className="inline-flex gap-1"
            role="tablist"
            aria-label="Тема виджета скидки WB"
          >
            {WB_DISCOUNT_THEME_TABS.map((tab) => {
              const selected = wbDiscountTheme === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setWbDiscountTheme(tab.id)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    selected
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
