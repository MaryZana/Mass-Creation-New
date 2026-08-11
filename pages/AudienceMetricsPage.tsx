import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowUp, Check, ChevronDown, ChevronRight, Download, HelpCircle, Search, X } from '../components/Icons';

type TabId = 'repeat' | 'acquisition' | 'value';

export type StatsRangeId =
  | 'today'
  | 'yesterday'
  | 'week'
  | 'twoWeeks'
  | 'month'
  | 'quarter'
  | 'halfYear'
  | 'year'
  | 'custom';

export type StatsGrainId = 'day' | 'week' | 'month';

export type StatsWarehouseScopeId = 'all' | 'mine' | 'wb';

const STATS_GRAIN_OPTIONS: { id: StatsGrainId; label: string }[] = [
  { id: 'day', label: 'По дням' },
  { id: 'week', label: 'По неделям' },
  { id: 'month', label: 'По месяцам' },
];

/** Все склады = сумма Мои + WB по объёмам.
 * Мои — большая доля и лучше эффективность; WB — меньше доля и слабее метрики.
 */
const WAREHOUSE_SCOPE_FX: Record<
  StatsWarehouseScopeId,
  {
    orders: number;
    spend: number;
    spendShare: number;
    roas: number;
    ctr: number;
    organic: number;
    clients: number;
    days: number;
    quality: 1 | 0 | -1;
  }
> = {
  all: {
    orders: 1,
    spend: 1,
    spendShare: 1,
    roas: 1,
    ctr: 1,
    organic: 1,
    clients: 1,
    days: 1,
    quality: 0,
  },
  // 0.58 + 0.42 = 1 по заказам/клиентам/органике; spend 0.40 + 0.60 = 1
  mine: {
    orders: 0.58,
    spend: 0.4,
    spendShare: 0.7,
    roas: 1.35,
    ctr: 1.18,
    organic: 0.64,
    clients: 0.6,
    days: 0.72,
    quality: 1,
  },
  wb: {
    orders: 0.42,
    spend: 0.6,
    spendShare: 1.45,
    roas: 0.68,
    ctr: 0.82,
    organic: 0.36,
    clients: 0.4,
    days: 1.38,
    quality: -1,
  },
};

function parseStatsMetricNumber(raw: string): number {
  const normalized = raw.replace(/\s/g, '').replace('%', '').replace('₽', '').replace(',', '.');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function formatStatsMoney(n: number): string {
  return `${new Intl.NumberFormat('ru-RU').format(Math.round(n))} ₽`;
}

function formatStatsPct(n: number, digits = 1): string {
  return `${n.toFixed(digits).replace('.', ',')} %`;
}

function formatStatsRoas(n: number): string {
  return n.toFixed(2).replace('.', ',');
}

function formatStatsTrendPct(n: number): string {
  return `${Math.abs(n).toFixed(1).replace('.', ',')}%`;
}

function warehouseTrend(
  baseTrend: string,
  quality: 1 | 0 | -1,
  opts?: { preferDown?: boolean },
): { trend: string; trendDown?: boolean } {
  const base = parseStatsMetricNumber(baseTrend);
  if (quality === 0) {
    return { trend: baseTrend, trendDown: opts?.preferDown };
  }
  if (quality === 1) {
    const boosted = Math.round(base * 1.7 * 10) / 10;
    return {
      trend: formatStatsTrendPct(boosted),
      trendDown: opts?.preferDown ? true : undefined,
    };
  }
  // WB: рост затрат / падение выручки и эффективности
  const worsened = Math.round(base * 1.55 * 10) / 10;
  if (opts?.preferDown) {
    return { trend: formatStatsTrendPct(worsened), trendDown: false };
  }
  return { trend: formatStatsTrendPct(worsened), trendDown: true };
}

function scaleSparkForWarehouse(points: number[], quality: 1 | 0 | -1): number[] {
  if (quality === 0) return points;
  return points.map((p, i) => {
    const t = i / Math.max(points.length - 1, 1);
    if (quality === 1) return Math.max(4, p * (0.92 + 0.28 * t));
    return Math.max(4, p * (1.08 - 0.42 * t));
  });
}

/** Число точек на графике органики: при «По дням» — реальные дни выбранного периода. */
function organicPointCount(range: StatsRangeId, grain: StatsGrainId): number {
  if (grain === 'month') return sparkPointCount(range, 'month');
  if (grain === 'week') return sparkPointCount(range, 'week');
  switch (range) {
    case 'today':
    case 'yesterday':
      return 8;
    case 'week':
      return 7;
    case 'twoWeeks':
      return 14;
    case 'month':
      return 30;
    case 'custom':
      return 45;
    case 'quarter':
      return 92;
    case 'halfYear':
      return 183;
    case 'year':
      return 365;
    default:
      return 30;
  }
}

function formatDayPill(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}`;
}

function formatAxisMonthLabel(date: Date): string {
  return date.toLocaleDateString('ru-RU', { month: 'long' });
}

/** Понедельник недели даты (для меток оси). */
function startOfIsoWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + delta);
  return d;
}

function sameIsoWeek(a: Date, b: Date): boolean {
  return startOfIsoWeek(a).getTime() === startOfIsoWeek(b).getTime();
}

/** Короткая метка недели на оси: «28 июл». */
function formatAxisWeekLabel(date: Date): string {
  return startOfIsoWeek(date)
    .toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    .replace('.', '');
}

/** Метка дня на оси: «пн», «вт»… */
function formatAxisDayLabel(date: Date): string {
  return date.toLocaleDateString('ru-RU', { weekday: 'short' }).replace('.', '');
}

/**
 * Крупные метки оси зависят от периода:
 * неделя → дни; месяц → недели; длиннее → месяцы.
 */
function organicAxisLabel(
  date: Date,
  prevDate: Date | null,
  range: StatsRangeId,
  grain: StatsGrainId,
): string {
  if (range === 'week' || range === 'twoWeeks') {
    return formatAxisDayLabel(date);
  }

  if (range === 'month') {
    if (grain === 'week') return formatAxisWeekLabel(date);
    if (!prevDate || !sameIsoWeek(prevDate, date)) return formatAxisWeekLabel(date);
    return '';
  }

  if (range === 'today' || range === 'yesterday') {
    if (!prevDate || date.getHours() !== prevDate.getHours()) {
      return `${String(date.getHours()).padStart(2, '0')}:00`;
    }
    return '';
  }

  if (grain === 'month') {
    return formatAxisMonthLabel(date);
  }

  // квартал / полгода / год / custom — месяцы
  if (
    !prevDate ||
    prevDate.getMonth() !== date.getMonth() ||
    prevDate.getFullYear() !== date.getFullYear()
  ) {
    return formatAxisMonthLabel(date);
  }
  return '';
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'repeat', label: 'Повторные заказы' },
  { id: 'acquisition', label: 'Привлечение' },
  { id: 'value', label: 'Ценность' },
];

const fmt = (n: number) => new Intl.NumberFormat('ru-RU').format(n);

const STATS_RANGE_PRESETS: {
  id: Exclude<StatsRangeId, 'custom' | 'today' | 'yesterday' | 'halfYear'>;
  label: string;
}[] = [
  { id: 'week', label: 'Неделя' },
  { id: 'twoWeeks', label: '2 Недели' },
  { id: 'month', label: 'Месяц' },
  { id: 'quarter', label: 'Квартал' },
  { id: 'year', label: 'Год' },
];

const STATS_RANGE_LABELS: Record<StatsRangeId, string> = {
  today: '5 августа',
  yesterday: '4 августа',
  week: '30 июля — 5 августа',
  twoWeeks: '22 июля — 5 августа',
  month: '7 июля — 5 августа',
  quarter: '5 мая — 5 августа',
  halfYear: '5 февраля — 5 августа',
  year: '5 авг 2025 — 5 авг 2026',
  custom: '3 мая — 10 июня',
};

const STATS_RANGE_PRESETS_COMPACT: {
  id: Exclude<StatsRangeId, 'custom' | 'yesterday' | 'today' | 'halfYear'>;
  label: string;
}[] = [
  { id: 'week', label: 'Неделя' },
  { id: 'twoWeeks', label: '2 Недели' },
  { id: 'month', label: 'Месяц' },
  { id: 'quarter', label: 'Квартал' },
  { id: 'year', label: 'Год' },
];

function formatStatsRangePart(d: Date): string {
  const parts = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }).split(' ');
  if (parts.length >= 2) {
    const month = parts[1];
    return `${parts[0]} ${month.charAt(0).toLowerCase()}${month.slice(1)}`;
  }
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

function formatStatsRangeLabel(start: Date, end: Date): string {
  return `${formatStatsRangePart(start)} — ${formatStatsRangePart(end)}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addMonths(d: Date, delta: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDisplayDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${d.getFullYear()}`;
}

function parseDisplayDate(value: string): Date | null {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]) - 1;
  const year = Number(match[3]);
  const date = new Date(year, month, day);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }
  return startOfDay(date);
}

function formatRangeDuration(start: Date, end: Date): string {
  const from = start <= end ? start : end;
  const to = start <= end ? end : start;
  const days = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
  if (days < 28) {
    const mod10 = days % 10;
    const mod100 = days % 100;
    const unit =
      mod10 === 1 && mod100 !== 11
        ? 'день'
        : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
          ? 'дня'
          : 'дней';
    return `${days} ${unit}`;
  }
  const months = Math.max(1, Math.round(days / 30.44));
  const mod10 = months % 10;
  const mod100 = months % 100;
  const unit =
    mod10 === 1 && mod100 !== 11
      ? 'месяц'
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? 'месяца'
        : 'месяцев';
  return `${months} ${unit}`;
}

const CALENDAR_WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;

function buildMonthCells(year: number, month: number): Array<Date | null> {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Monday-first: Sun=0 → 6, Mon=1 → 0, …
  const lead = (first.getDay() + 6) % 7;
  const cells: Array<Date | null> = Array.from({ length: lead }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function StatsRangeMonthGrid({
  year,
  month,
  rangeStart,
  rangeEnd,
  maxDate,
  onPick,
}: {
  year: number;
  month: number;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  maxDate: Date;
  onPick: (day: Date) => void;
}) {
  const cells = buildMonthCells(year, month);
  const title = new Date(year, month, 1).toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  });
  const titleCased = title.charAt(0).toUpperCase() + title.slice(1);
  const from = rangeStart && rangeEnd && rangeStart > rangeEnd ? rangeEnd : rangeStart;
  const to = rangeStart && rangeEnd && rangeStart > rangeEnd ? rangeStart : rangeEnd;

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-3 text-center text-sm font-semibold text-gray-900">{titleCased}</div>
      <div className="mb-1 grid grid-cols-7">
        {CALENDAR_WEEKDAYS.map((label, index) => (
          <div
            key={label}
            className={`py-1 text-center text-[11px] font-medium ${
              index >= 5 ? 'text-[#E86B7A]' : 'text-gray-400'
            }`}
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, index) => {
          if (!day) {
            return <div key={`empty-${year}-${month}-${index}`} className="h-9" />;
          }

          const disabled = day > maxDate;
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          const isStart = Boolean(from && sameDay(day, from));
          const isEnd = Boolean(to && sameDay(day, to));
          const inRange = Boolean(from && to && day >= from && day <= to);
          const alone = isStart && isEnd;
          const col = index % 7;
          const roundLeft = inRange && (isStart || col === 0);
          const roundRight = inRange && (isEnd || col === 6);

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => onPick(day)}
              className={`relative flex h-9 items-center justify-center text-sm tabular-nums transition-colors ${
                disabled
                  ? 'cursor-default text-gray-300'
                  : isWeekend
                    ? 'text-[#E86B7A] hover:text-[#D45666]'
                    : 'text-gray-900 hover:text-gray-950'
              }`}
            >
              {inRange && (
                <span
                  aria-hidden
                  className={
                    alone
                      ? 'absolute inset-y-1 left-1 right-1 rounded-full bg-[#ECEEF2]'
                      : `absolute inset-y-1 bg-[#ECEEF2] ${
                          roundLeft ? 'left-1 rounded-l-full' : 'left-0'
                        } ${roundRight ? 'right-1 rounded-r-full' : 'right-0'}`
                  }
                />
              )}
              <span
                className={`relative z-[1] flex h-7 w-7 items-center justify-center ${
                  isStart || isEnd ? 'font-semibold' : ''
                }`}
              >
                {day.getDate()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Календарь для стат на странице — только в этом виде */
export function StatsDateRangeBar({
  value,
  onChange,
  compact = false,
}: {
  value: StatsRangeId;
  onChange: (id: StatsRangeId) => void;
  compact?: boolean;
}) {
  const presets = compact ? STATS_RANGE_PRESETS_COMPACT : STATS_RANGE_PRESETS;
  const rootRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const today = useMemo(() => startOfDay(new Date(2026, 7, 6)), []);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [customLabel, setCustomLabel] = useState(STATS_RANGE_LABELS.custom);
  const [draftStart, setDraftStart] = useState(() => startOfDay(new Date(2026, 6, 7)));
  const [draftEnd, setDraftEnd] = useState(() => startOfDay(new Date(2026, 7, 6)));
  const [pickingEnd, setPickingEnd] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => addMonths(today, -1));
  const [startInput, setStartInput] = useState(() => formatDisplayDate(new Date(2026, 6, 7)));
  const [endInput, setEndInput] = useState(() => formatDisplayDate(new Date(2026, 7, 6)));
  const [dialogPos, setDialogPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!calendarOpen) {
      setDialogPos(null);
      return;
    }
    const updatePos = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(920, window.innerWidth - 32);
      const left = Math.min(Math.max(16, rect.left), window.innerWidth - width - 16);
      setDialogPos({ top: rect.bottom + 8, left });
    };
    updatePos();
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, true);
    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
    };
  }, [calendarOpen]);

  useEffect(() => {
    if (!calendarOpen) return;
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (dialogRef.current?.contains(target)) return;
      setCalendarOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [calendarOpen]);

  const syncInputs = (start: Date, end: Date) => {
    setStartInput(formatDisplayDate(start));
    setEndInput(formatDisplayDate(end));
  };

  const openCalendar = () => {
    const start = draftStart;
    const end = draftEnd;
    syncInputs(start, end);
    setViewMonth(addMonths(end, -1));
    setPickingEnd(false);
    setCalendarOpen((open) => !open);
  };

  const pickDay = (day: Date) => {
    if (day > today) return;
    if (!pickingEnd || !draftStart) {
      setDraftStart(day);
      setDraftEnd(day);
      setPickingEnd(true);
      syncInputs(day, day);
      return;
    }
    const [from, to] = day >= draftStart ? [draftStart, day] : [day, draftStart];
    setDraftStart(from);
    setDraftEnd(to);
    setPickingEnd(false);
    syncInputs(from, to);
  };

  const commitInputDates = () => {
    const start = parseDisplayDate(startInput);
    const end = parseDisplayDate(endInput);
    if (!start || !end) {
      syncInputs(draftStart, draftEnd);
      return;
    }
    const [from, to] = start <= end ? [start, end] : [end, start];
    const clampedTo = to > today ? today : to;
    const clampedFrom = from > clampedTo ? clampedTo : from;
    setDraftStart(clampedFrom);
    setDraftEnd(clampedTo);
    setPickingEnd(false);
    syncInputs(clampedFrom, clampedTo);
    setViewMonth(addMonths(clampedTo, -1));
  };

  const applyCustomRange = () => {
    let [from, to] = draftStart <= draftEnd ? [draftStart, draftEnd] : [draftEnd, draftStart];
    const days = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
    if (days < 7) {
      from = new Date(to);
      from.setDate(to.getDate() - 6);
    }
    setDraftStart(from);
    setDraftEnd(to);
    syncInputs(from, to);
    setCustomLabel(formatStatsRangeLabel(from, to));
    onChange('custom');
    setCalendarOpen(false);
  };

  const periodLabel = value === 'custom' ? customLabel : STATS_RANGE_LABELS[value];
  const months = [0, 1, 2].map((offset) => addMonths(viewMonth, offset));
  const durationLabel = formatRangeDuration(draftStart, draftEnd);

  return (
    <div className="relative inline-flex w-fit max-w-full" ref={rootRef}>
      <div
        className={
          compact
            ? 'inline-flex w-fit max-w-full flex-wrap items-center gap-1 rounded-xl bg-[#F3F5F8] px-1.5 py-1'
            : 'inline-flex max-w-full flex-wrap items-center gap-0.5 rounded-full bg-[#E8ECF1] px-1.5 py-1 sm:flex-nowrap sm:gap-1 sm:px-2'
        }
      >
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => {
              setCalendarOpen(false);
              onChange(preset.id);
            }}
            className={
              compact
                ? `rounded-lg px-2.5 py-2 text-sm leading-none transition-colors ${
                    value === preset.id
                      ? 'bg-white font-semibold text-gray-950 shadow-sm'
                      : 'font-normal text-gray-500 hover:text-gray-800'
                  }`
                : `rounded-full px-2 py-1.5 text-sm transition-colors sm:px-2.5 ${
                    value === preset.id
                      ? 'font-semibold text-gray-950'
                      : 'font-normal text-gray-600 hover:text-gray-900'
                  }`
            }
          >
            {preset.label}
          </button>
        ))}
        <button
          type="button"
          onClick={openCalendar}
          aria-expanded={calendarOpen}
          aria-haspopup="dialog"
          className={
            compact
              ? `ml-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm leading-none tabular-nums transition-colors ${
                  value === 'custom'
                    ? 'bg-white font-semibold text-gray-950 shadow-sm'
                    : 'font-medium text-gray-500 hover:text-gray-800'
                }`
              : 'ml-0.5 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-medium tabular-nums text-gray-900 shadow-sm'
          }
        >
          {periodLabel}
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${
              calendarOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {calendarOpen &&
        dialogPos &&
        createPortal(
          <div
            ref={dialogRef}
            role="dialog"
            aria-label="Выбрать период"
            style={{ top: dialogPos.top, left: dialogPos.left }}
            className="fixed z-[300] w-[min(920px,calc(100vw-2rem))] rounded-2xl border border-gray-200 bg-white p-4 shadow-xl animate-in fade-in zoom-in-95 duration-100 sm:p-5"
          >
            <div className="mb-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMonth((m) => addMonths(m, -1))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                aria-label="Предыдущий месяц"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
              </button>
              <div className="min-w-0 flex-1" />
              <button
                type="button"
                onClick={() => setViewMonth((m) => addMonths(m, 1))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                aria-label="Следующий месяц"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {months.map((monthDate) => (
                <StatsRangeMonthGrid
                  key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`}
                  year={monthDate.getFullYear()}
                  month={monthDate.getMonth()}
                  rangeStart={draftStart}
                  rangeEnd={draftEnd}
                  maxDate={today}
                  onPick={pickDay}
                />
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <input
                  value={startInput}
                  onChange={(e) => setStartInput(e.target.value)}
                  onBlur={commitInputDates}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitInputDates();
                  }}
                  inputMode="numeric"
                  aria-label="Дата начала"
                  className="w-[7.5rem] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm tabular-nums text-gray-900 outline-none focus:border-[#9A41FE] focus:ring-1 focus:ring-[#9A41FE]"
                />
                <span className="text-gray-300">—</span>
                <input
                  value={endInput}
                  onChange={(e) => setEndInput(e.target.value)}
                  onBlur={commitInputDates}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitInputDates();
                  }}
                  inputMode="numeric"
                  aria-label="Дата конца"
                  className="w-[7.5rem] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm tabular-nums text-gray-900 outline-none focus:border-[#9A41FE] focus:ring-1 focus:ring-[#9A41FE]"
                />
                <span className="ml-1 text-sm text-gray-500">{durationLabel}</span>
              </div>
              <button
                type="button"
                onClick={applyCustomRange}
                className="rounded-full bg-[#9A41FE] px-8 py-2.5 text-sm font-semibold text-white hover:bg-[#8A35E8]"
              >
                Применить
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function StatsGrainSelect({
  value,
  onChange,
}: {
  value: StatsGrainId;
  onChange: (id: StatsGrainId) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = STATS_GRAIN_OPTIONS.find((o) => o.id === value) ?? STATS_GRAIN_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (event: MouseEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-flex shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#F3F5F8] px-3 text-sm font-medium text-gray-900 transition-colors hover:bg-[#E8EAEE]"
      >
        <span className="whitespace-nowrap">{selected.label}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Детализация графиков"
          className="absolute left-0 top-full z-[60] mt-1.5 min-w-full overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
        >
          {STATS_GRAIN_OPTIONS.map((option) => {
            const active = option.id === value;
            return (
              <li key={option.id} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 whitespace-nowrap px-3 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${
                    active ? 'bg-violet-50/80 font-medium text-gray-900' : 'text-gray-800'
                  }`}
                >
                  <span>{option.label}</span>
                  {active && <Check className="h-4 w-4 shrink-0 text-[#9a41fe]" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const StatsRangeContext = createContext<StatsRangeId>('week');
const StatsGrainContext = createContext<StatsGrainId>('day');
const StatsWarehouseScopeContext = createContext<StatsWarehouseScopeId>('all');

function useStatsRange() {
  return useContext(StatsRangeContext);
}

function useStatsGrain() {
  return useContext(StatsGrainContext);
}

function useStatsWarehouseScope() {
  return useContext(StatsWarehouseScopeContext);
}

function monthsCountForRange(range: StatsRangeId): number {
  switch (range) {
    case 'today':
    case 'yesterday':
    case 'week':
    case 'twoWeeks':
    case 'month':
      return 1;
    case 'quarter':
      return 3;
    case 'halfYear':
      return 6;
    case 'year':
      return 12;
    case 'custom':
      return 2;
    default:
      return 12;
  }
}

function takeLastMonths<T>(rows: T[], range: StatsRangeId): T[] {
  const n = monthsCountForRange(range);
  return rows.slice(-Math.max(1, n));
}

/** Когорты: накопленная ценность покупателя (₽) после первого рекламного привлечения */
const COHORT_COLUMNS = [
  'Первый заказ',
  'Месяц 0',
  'Месяц 1',
  'Месяц 2',
  'Месяц 3',
  'Месяц 4',
  'Месяц 5',
  'Месяц 6',
] as const;

const COHORTS: Array<{ month: string; values: Array<number | null> }> = [
  { month: 'Март 2025', values: [1840, 2180, 2690, 3120, 3480, 3790, 4050, 4280] },
  { month: 'Апрель 2025', values: [1910, 2260, 2780, 3210, 3590, 3910, 4180, 4410] },
  { month: 'Май 2025', values: [1760, 2090, 2540, 2980, 3340, 3640, 3890, null] },
  { month: 'Июнь 2025', values: [2030, 2410, 2950, 3420, 3810, 4140, null, null] },
  { month: 'Июль 2025', values: [1980, 2340, 2860, 3310, 3680, null, null, null] },
  { month: 'Август 2025', values: [2110, 2490, 3040, 3520, null, null, null, null] },
  { month: 'Сентябрь 2025', values: [1890, 2230, 2710, null, null, null, null, null] },
  { month: 'Октябрь 2025', values: [2050, 2420, null, null, null, null, null, null] },
  { month: 'Ноябрь 2025', values: [2170, null, null, null, null, null, null, null] },
];

const COHORT_AVG = [1970, 2303, 2796, 3260, 3580, 3870, 4040, 4345];

function cohortCellTone(value: number | null, colIndex: number): string {
  if (value === null) return 'bg-transparent text-transparent';
  if (colIndex === 0) return 'bg-white text-gray-900';
  const min = 2090;
  const max = 4410;
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  if (t > 0.85) return 'bg-[#1D4ED8] text-white';
  if (t > 0.7) return 'bg-[#2563EB] text-white';
  if (t > 0.55) return 'bg-[#3B82F6] text-white';
  if (t > 0.4) return 'bg-[#60A5FA] text-gray-950';
  if (t > 0.25) return 'bg-[#93C5FD] text-gray-950';
  if (t > 0.1) return 'bg-[#BFDBFE] text-gray-900';
  return 'bg-[#DBEAFE] text-gray-900';
}

function fmtRubShort(value: number) {
  return `${fmt(value)} ₽`;
}

function MaximizeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

function CohortHeatmapGrid({
  spacious = false,
  cohorts = COHORTS,
}: {
  spacious?: boolean;
  cohorts?: typeof COHORTS;
}) {
  const labelCol = spacious ? '160px' : '128px';
  const cellMin = spacious ? 'minmax(104px,1fr)' : 'minmax(84px,1fr)';
  const gridClass = `grid gap-1.5 text-xs`;
  const gridStyle = {
    gridTemplateColumns: `${labelCol} repeat(8, ${cellMin})`,
  } as const;
  const cellPad = spacious ? 'py-3.5 text-sm' : 'py-2.5';

  return (
    <div className={spacious ? 'min-w-[1100px]' : 'min-w-[860px]'}>
      <div
        className={`${gridClass} text-[11px] text-gray-500 ${spacious ? 'text-xs' : ''}`}
        style={gridStyle}
      >
        <div className="px-2 py-2">Привлечение</div>
        {COHORT_COLUMNS.map((column) => (
          <div key={column} className="flex items-center justify-center gap-1 px-1 py-2 text-center">
            <span>{column}</span>
            <HelpCircle className="h-3 w-3 text-gray-300" />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        {cohorts.map((row) => (
          <div key={row.month} className={gridClass} style={gridStyle}>
            <div
              className={`flex items-center rounded-md bg-gray-50 px-2 font-medium text-gray-800 ${cellPad}`}
            >
              {row.month}
            </div>
            {row.values.map((value, index) => (
              <div
                key={`${row.month}-${index}`}
                className={`flex items-center justify-center rounded-md font-semibold tabular-nums ${cellPad} ${cohortCellTone(
                  value,
                  index,
                )}`}
              >
                {value === null ? '—' : fmtRubShort(value)}
              </div>
            ))}
          </div>
        ))}

        <div className={`mt-1 ${gridClass}`} style={gridStyle}>
          <div
            className={`flex items-center rounded-md bg-gray-100 px-2 font-semibold text-gray-900 ${cellPad}`}
          >
            Среднее
          </div>
          {COHORT_AVG.map((value, index) => (
            <div
              key={`avg-${index}`}
              className={`flex items-center justify-center rounded-md font-semibold tabular-nums ${cellPad} ${cohortCellTone(
                value,
                index,
              )}`}
            >
              {fmtRubShort(value)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CohortHeatmap() {
  const range = useStatsRange();
  const [fullscreen, setFullscreen] = useState(false);
  const cohorts = useMemo(() => {
    const n = monthsCountForRange(range);
    if (range === 'quarter') return COHORTS.slice(-4);
    if (range === 'halfYear') return COHORTS.slice(-6);
    if (range === 'year') return COHORTS;
    if (range === 'custom') return COHORTS.slice(-2);
    return COHORTS.slice(-Math.max(1, n));
  }, [range]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [fullscreen]);

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Возврат покупателей по когортам
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Накопленная сумма заказов на покупателя после первого рекламного привлечения ·{' '}
              {STATS_RANGE_LABELS[range]}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tip text="Строка — месяц первого заказа с рекламы. Столбцы — месяцы жизни когорты. Пустые ячейки: период ещё не наступил." />
            <button
              type="button"
              onClick={() => setFullscreen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              aria-label="Открыть на весь экран"
            >
              <MaximizeIcon className="h-3.5 w-3.5" />
              На весь экран
            </button>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <CohortHeatmapGrid cohorts={cohorts} />
        </div>
      </section>

      {fullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Возврат покупателей по когортам
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Накопленная сумма заказов на покупателя после первого рекламного привлечения · Esc
                — закрыть
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              aria-label="Закрыть"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <CohortHeatmapGrid spacious cohorts={cohorts} />
          </div>
        </div>
      )}
    </>
  );
}

/** Месяц трат на продвижение → повторные органические заказы этой когорты.
 * spend ≈ 10% ДРР от рекламного GMV месяца, organicSum ≈ 5%, заказы = sum / AOV.
 */
const MONTHLY_SPEND_ORGANIC = [
  {
    month: 'Март',
    promotion: 84_000,
    media: 21_000,
    organicOrders: 32,
    organicSum: 52_500,
  },
  {
    month: 'Апрель',
    promotion: 88_200,
    media: 22_000,
    organicOrders: 35,
    organicSum: 58_000,
  },
  {
    month: 'Май',
    promotion: 95_000,
    media: 23_800,
    organicOrders: 33,
    organicSum: 54_000,
  },
  {
    month: 'Июнь',
    promotion: 99_200,
    media: 24_800,
    organicOrders: 38,
    organicSum: 62_000,
  },
  {
    month: 'Июль',
    promotion: 112_600,
    media: 28_100,
    organicOrders: 41,
    organicSum: 67_000,
  },
  {
    month: 'Август',
    promotion: 96_000,
    media: 24_000,
    organicOrders: 37,
    organicSum: 60_000,
  },
];

function SpendOrganicTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string; dataKey?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const row = MONTHLY_SPEND_ORGANIC.find((m) => m.month === label);
  const spend = row ? row.promotion + row.media : 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs shadow-lg">
      <div className="font-semibold text-gray-900">{label}</div>
      <div className="mt-2 flex flex-col gap-1.5 text-gray-600">
        <div className="flex justify-between gap-6">
          <span>Затраты всего</span>
          <strong className="tabular-nums text-gray-900">{fmtRubShort(spend)}</strong>
        </div>
        {payload
          .filter((p) => p.dataKey !== 'organicOrders')
          .map((p) => (
            <div key={String(p.dataKey)} className="flex justify-between gap-6 pl-2">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                {p.name}
              </span>
              <span className="tabular-nums">{fmtRubShort(Number(p.value ?? 0))}</span>
            </div>
          ))}
        <div className="mt-1 flex justify-between gap-6 border-t border-gray-100 pt-1.5">
          <span className="text-violet-700">Повторные органические</span>
          <strong className="tabular-nums text-violet-800">
            {fmt(row?.organicOrders ?? 0)} заказов
          </strong>
        </div>
      </div>
    </div>
  );
}

function MonthlySpendOrganicBlock() {
  const range = useStatsRange();
  const chartData = useMemo(
    () =>
      getSpendOrganicForRange(range).map((m) => ({
        ...m,
        totalSpend: m.promotion + m.media,
      })),
    [range],
  );

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Затраты по месяцам → повторные органические
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Сколько потратили в каналах Продвижение и Медиа и сколько повторных органических
            заказов потом принесли привлечённые покупатели · {STATS_RANGE_LABELS[range]}
          </p>
        </div>
        <Tip text="Месяц = когда тратили на рекламу и привлекали. Повторные заказы могли случиться позже — они всё равно относятся к когорте этого месяца." />
      </div>

      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#34D399]" />
          Продвижение
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#60A5FA]" />
          Медиа
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded-full bg-violet-600" />
          Повторные органические заказы
        </span>
      </div>

      <div className="mt-5 h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <YAxis
              yAxisId="spend"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              tickFormatter={(v) => `${Math.round(v / 1000)}к`}
              width={40}
            />
            <YAxis
              yAxisId="orders"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#8B5CF6' }}
              width={36}
            />
            <Tooltip content={<SpendOrganicTooltip />} />
            <Bar
              yAxisId="spend"
              dataKey="promotion"
              name="Продвижение"
              stackId="spend"
              fill="#34D399"
              maxBarSize={48}
            />
            <Bar
              yAxisId="spend"
              dataKey="media"
              name="Медиа"
              stackId="spend"
              fill="#60A5FA"
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
            />
            <Line
              yAxisId="orders"
              type="monotone"
              dataKey="organicOrders"
              name="Повторные органические"
              stroke="#7C3AED"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#7C3AED', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-5 overflow-x-auto border-t border-gray-100 pt-4">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead>
            <tr className="text-gray-500">
              <th className="pb-2 pr-3 font-medium">Месяц</th>
              <th className="pb-2 pr-3 font-medium">Потратили</th>
              <th className="pb-2 pr-3 font-medium">По каналам</th>
              <th className="pb-2 pr-3 font-medium">Повторные орг.</th>
              <th className="pb-2 font-medium">₽ на 1 орг. заказ</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((row) => {
              const cpo = Math.round(row.totalSpend / row.organicOrders);
              return (
                <tr key={row.month} className="border-t border-gray-50">
                  <td className="py-2.5 pr-3 font-semibold text-gray-900">{row.month}</td>
                  <td className="py-2.5 pr-3 tabular-nums text-gray-900">
                    {fmtRubShort(row.totalSpend)}
                  </td>
                  <td className="py-2.5 pr-3 text-gray-500">
                    <span className="tabular-nums">Продвижение {fmtRubShort(row.promotion)}</span>
                    <span className="mx-1 text-gray-300">·</span>
                    <span className="tabular-nums">Медиа {fmtRubShort(row.media)}</span>
                  </td>
                  <td className="py-2.5 pr-3 font-semibold tabular-nums text-violet-700">
                    {fmt(row.organicOrders)}
                    <span className="ml-1 font-normal text-gray-400">
                      · {fmtRubShort(row.organicSum)}
                    </span>
                  </td>
                  <td className="py-2.5 tabular-nums text-gray-700">{fmtRubShort(cpo)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * Когортный стек: месяц = дата привлечения.
 * Синий — вложения в этом месяце.
 * Зелёный — вся органика этих покупателей позже (март/апрель тоже в столбце января).
 */
/** Когорты: adGmv ≈ KPI-год (14,2 млн), spend ≈ 10% ДРР, organic ≈ 5% (зреющие когорты меньше). */
const SPEND_ORGANIC_STACK_SERIES = [
  {
    month: 'Январь',
    spend: 80_000,
    adGmv: 800_000,
    organic: 40_000,
    avgDays: 58,
    peakMonths: 'март–апрель',
  },
  {
    month: 'Февраль',
    spend: 94_600,
    adGmv: 910_000,
    organic: 45_500,
    avgDays: 51,
    peakMonths: 'апрель–май',
  },
  {
    month: 'Март',
    spend: 105_000,
    adGmv: 1_050_000,
    organic: 52_500,
    avgDays: 47,
    peakMonths: 'май–июнь',
  },
  {
    month: 'Апрель',
    spend: 110_200,
    adGmv: 1_160_000,
    organic: 58_000,
    avgDays: 44,
    peakMonths: 'июнь–июль',
  },
  {
    month: 'Май',
    spend: 118_800,
    adGmv: 1_080_000,
    organic: 54_000,
    avgDays: 42,
    peakMonths: 'июль–август',
  },
  {
    month: 'Июнь',
    spend: 124_000,
    adGmv: 1_240_000,
    organic: 62_000,
    avgDays: 39,
    peakMonths: 'август–сентябрь',
  },
  {
    month: 'Июль',
    spend: 140_700,
    adGmv: 1_340_000,
    organic: 67_000,
    avgDays: 38,
    peakMonths: 'сентябрь–октябрь',
  },
  {
    month: 'Август',
    spend: 120_000,
    adGmv: 1_200_000,
    organic: 60_000,
    avgDays: 41,
    peakMonths: 'октябрь–ноябрь',
  },
  {
    month: 'Сентябрь',
    spend: 140_000,
    adGmv: 1_400_000,
    organic: 70_000,
    avgDays: 43,
    peakMonths: 'ноябрь–декабрь',
  },
  {
    month: 'Октябрь',
    spend: 139_700,
    adGmv: 1_470_000,
    organic: 40_400,
    avgDays: 36,
    peakMonths: 'декабрь–январь',
    maturing: true,
  },
  {
    month: 'Ноябрь',
    spend: 140_000,
    adGmv: 1_400_000,
    organic: 26_600,
    avgDays: 28,
    peakMonths: 'ещё копится',
    maturing: true,
  },
  {
    month: 'Декабрь',
    spend: 111_200,
    adGmv: 1_170_000,
    organic: 12_900,
    avgDays: 18,
    peakMonths: 'ещё копится',
    maturing: true,
  },
];

/** Лаг-матрица: строка = когорта привлечения, столбец = через N месяцев пришла органика (₽). Как у Amplitude/Mixpanel. */
const ORGANIC_LAG_COLUMNS = ['Мес. 0', 'Мес. 1', 'Мес. 2', 'Мес. 3', 'Мес. 4', 'Мес. 5+'] as const;

const ORGANIC_LAG_MATRIX: Array<{
  month: string;
  lags: Array<number | null>;
}> = [
  { month: 'Январь', lags: [1_900, 4_800, 11_300, 12_000, 6_000, 4_000] },
  { month: 'Февраль', lags: [2_800, 5_800, 13_100, 13_800, 5_800, 4_200] },
  { month: 'Март', lags: [3_200, 6_800, 15_200, 15_500, 6_800, 5_000] },
  { month: 'Апрель', lags: [3_500, 8_200, 16_900, 17_300, 7_400, 4_700] },
  { month: 'Май', lags: [3_300, 7_500, 15_700, 16_100, 7_000, 4_400] },
  { month: 'Июнь', lags: [3_800, 8_700, 18_000, 18_500, 8_000, 5_000] },
  { month: 'Июль', lags: [4_100, 9_400, 19_500, 20_100, 8_600, 5_300] },
  { month: 'Август', lags: [3_600, 8_400, 17_400, 18_000, 7_800, 4_800] },
  { month: 'Сентябрь', lags: [4_200, 9_800, 20_300, 20_900, 9_100, 5_700] },
  { month: 'Октябрь', lags: [3_200, 7_600, 13_700, 11_800, 4_100, null] },
  { month: 'Ноябрь', lags: [2_700, 8_000, 10_600, 5_300, null, null] },
  { month: 'Декабрь', lags: [3_800, 6_500, 2_600, null, null, null] },
];

function organicLagTone(value: number | null): string {
  if (value === null) return 'bg-transparent text-transparent';
  const max = 20_900;
  const t = Math.max(0, Math.min(1, value / max));
  if (t > 0.85) return 'bg-[#15803D] text-white';
  if (t > 0.65) return 'bg-[#16A34A] text-white';
  if (t > 0.45) return 'bg-[#22C55E] text-gray-950';
  if (t > 0.3) return 'bg-[#4ADE80] text-gray-950';
  if (t > 0.15) return 'bg-[#86EFAC] text-gray-900';
  if (t > 0.05) return 'bg-[#BBF7D0] text-gray-900';
  return 'bg-[#DCFCE7] text-gray-800';
}

function SpendOrganicStackTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; value?: number; payload?: (typeof SPEND_ORGANIC_STACK_SERIES)[number] }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload ?? SPEND_ORGANIC_STACK_SERIES.find((d) => d.month === label);
  if (!row) return null;
  const shareOfAd = Math.round((row.organic / row.adGmv) * 1000) / 10;

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs shadow-lg">
      <div className="font-semibold text-gray-900">Когорта: {label}</div>
      <div className="mt-0.5 text-[11px] text-gray-400">
        первое касание в {label?.toLowerCase()}
      </div>
      <div className="mt-2 flex flex-col gap-1.5 text-gray-600">
        <div className="flex justify-between gap-8">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-[#4C8BF5]" />
            Рекламный GMV
          </span>
          <strong className="tabular-nums text-gray-900">{fmtRubShort(row.adGmv)}</strong>
        </div>
        <div className="flex justify-between gap-8">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-[#7CB342]" />
            Органический возвратный GMV
          </span>
          <strong className="tabular-nums text-emerald-800">{fmtRubShort(row.organic)}</strong>
        </div>
        <div className="rounded-lg bg-gray-50 px-2 py-1.5 text-[11px] leading-4 text-gray-500">
          Заказы могли прийти позже — пик:{' '}
          <strong className="text-gray-700">{row.peakMonths}</strong>. Всё равно в столбце{' '}
          {label?.toLowerCase()}.
        </div>
        <div className="flex justify-between gap-8 border-t border-gray-100 pt-1.5">
          <span>Средний срок до органики</span>
          <strong className="tabular-nums text-violet-700">{row.avgDays} дн.</strong>
        </div>
        <div className="flex justify-between gap-8">
          <span>Органика / рекламный GMV</span>
          <strong className="tabular-nums text-gray-900">{shareOfAd}%</strong>
        </div>
        <div className="flex justify-between gap-8 text-[11px] text-gray-400">
          <span>Вложили в рекламу</span>
          <span className="tabular-nums">{fmtRubShort(row.spend)}</span>
        </div>
        {row.maturing && (
          <div className="text-[11px] text-amber-700">Когорта ещё зреет — органика дорастёт</div>
        )}
      </div>
    </div>
  );
}

function SpendOrganicStackTrendBlock() {
  const range = useStatsRange();
  const series = useMemo(() => getStackSeriesForRange(range), [range]);
  const lagRows = useMemo(() => {
    if (range === 'quarter') return ORGANIC_LAG_MATRIX.slice(4, 8);
    if (range === 'halfYear') return ORGANIC_LAG_MATRIX.slice(2, 8);
    if (range === 'year') return ORGANIC_LAG_MATRIX;
    if (range === 'custom') return ORGANIC_LAG_MATRIX.slice(4, 6);
    if (range === 'month' || range === 'week' || range === 'twoWeeks' || range === 'today' || range === 'yesterday') {
      return ORGANIC_LAG_MATRIX.slice(-1);
    }
    return takeLastMonths(ORGANIC_LAG_MATRIX, range);
  }, [range]);
  const totalAdGmv = series.reduce((s, r) => s + r.adGmv, 0);
  const totalOrganic = series.reduce((s, r) => s + r.organic, 0);
  const avgDays = Math.round(
    series.reduce((s, r) => s + r.avgDays, 0) / Math.max(series.length, 1),
  );
  const shareOfAd = totalAdGmv ? Math.round((totalOrganic / totalAdGmv) * 1000) / 10 : 0;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-wide text-gray-900">
            Рекламный GMV → органический возврат
          </h2>
          <p className="mt-1 max-w-xl text-xs text-gray-500">
            Месяц = первое касание с рекламой. Зелёный — заказы этих клиентов без продвижения
            позже. Ориентир: органика ≈ 5% от рекламного GMV · {STATS_RANGE_LABELS[range]}
          </p>
        </div>
        <Tip text="Рекламный GMV — заказы с атрибуцией на продвижение. Органический возвратный GMV — тот же покупатель заказал без продвижения. Не путать с затратами на рекламу." />
      </div>

      <div className="mt-3 rounded-xl border border-sky-100 bg-sky-50/70 px-3 py-2.5 text-xs leading-5 text-sky-900">
        <strong>Как читать:</strong> синий — рекламный GMV когорты. Зелёный сверху — органический
        возврат (~5%). Линия — через сколько дней в среднем приходит органика.
      </div>

      <div className="mt-4 flex flex-wrap gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-gray-400">Рекламный GMV</div>
          <div className="text-lg font-bold tabular-nums text-[#4C8BF5]">
            {fmtRubShort(totalAdGmv)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-gray-400">
            Органический возврат
          </div>
          <div className="text-lg font-bold tabular-nums text-[#7CB342]">
            {fmtRubShort(totalOrganic)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-gray-400">Доля от рекл. GMV</div>
          <div className="text-lg font-bold tabular-nums text-gray-900">{shareOfAd}%</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-gray-400">
            До органики в среднем
          </div>
          <div className="text-lg font-bold tabular-nums text-violet-700">{avgDays} дн.</div>
        </div>
      </div>

      <div className="mt-5 h-[320px] rounded-xl bg-[#F7F8FA] px-2 py-3">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={series}
            margin={{ top: 8, right: 12, left: 0, bottom: 28 }}
            barCategoryGap="18%"
          >
            <CartesianGrid stroke="#E5E7EB" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              interval={0}
              tick={{ fontSize: 11, fill: '#6B7280' }}
              height={40}
            />
            <YAxis
              yAxisId="rub"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              tickFormatter={(v) => `${Math.round(v / 1_000_000)} млн`}
              width={48}
            />
            <YAxis
              yAxisId="days"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#8B5CF6' }}
              domain={[0, 80]}
              tickFormatter={(v) => `${v}д`}
              width={36}
            />
            <Tooltip
              content={<SpendOrganicStackTooltip />}
              cursor={{ fill: 'rgba(76, 139, 245, 0.06)' }}
            />
            <Bar
              yAxisId="rub"
              dataKey="adGmv"
              name="Рекламный GMV"
              stackId="stack"
              fill="#4C8BF5"
              maxBarSize={48}
            />
            <Bar
              yAxisId="rub"
              dataKey="organic"
              name="Органический возврат"
              stackId="stack"
              fill="#7CB342"
              radius={[3, 3, 0, 0]}
              maxBarSize={48}
            />
            <Line
              yAxisId="days"
              type="monotone"
              dataKey="avgDays"
              name="Дней до органики"
              stroke="#7C3AED"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: '#7C3AED', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-600">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#4C8BF5]" />
          Рекламный GMV (атрибуция)
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#7CB342]" />
          Органический возвратный GMV (~5%)
        </span>
        <span className="flex items-center gap-2">
          <span className="h-0.5 w-3 rounded-full bg-violet-600" />
          Средний срок до органики
        </span>
      </div>

      <div className="mt-5 border-t border-gray-100 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Когда приходит органика (лаг-матрица)
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Строка — месяц привлечения. Столбец — через сколько месяцев после него пришёл
              органический заказ. Так видно: январь → пик в мес. 2–3 (март–апрель).
            </p>
          </div>
          <Tip text="Мировая практика когортного анализа (Amplitude, Mixpanel, GA4, Pacvue): матрица «когорта × период жизни», а не список. Пустые ячейки — период ещё не наступил." />
        </div>

        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[780px]">
            <div className="grid grid-cols-[112px_repeat(6,minmax(88px,1fr))] gap-1 text-[11px] text-gray-500">
              <div className="px-2 py-2">Привлечение</div>
              {ORGANIC_LAG_COLUMNS.map((col) => (
                <div key={col} className="px-1 py-2 text-center">
                  {col}
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1">
              {lagRows.map((row) => (
                <div
                  key={row.month}
                  className="grid grid-cols-[112px_repeat(6,minmax(88px,1fr))] gap-1 text-xs"
                >
                  <div className="flex items-center rounded-md bg-gray-50 px-2 py-2.5 font-medium text-gray-800">
                    {row.month}
                  </div>
                  {row.lags.map((value, i) => (
                    <div
                      key={`${row.month}-${i}`}
                      className={`flex items-center justify-center rounded-md py-2.5 font-semibold tabular-nums ${organicLagTone(
                        value,
                      )}`}
                      title={
                        value === null
                          ? 'Период ещё не наступил'
                          : `${row.month}: органика через ${i} мес. — ${fmt(value)} ₽`
                      }
                    >
                      {value === null ? '—' : `${Math.round(value / 1000)}к`}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
              <span>Меньше</span>
              <span className="h-3 w-5 rounded-sm bg-[#DCFCE7]" />
              <span className="h-3 w-5 rounded-sm bg-[#86EFAC]" />
              <span className="h-3 w-5 rounded-sm bg-[#22C55E]" />
              <span className="h-3 w-5 rounded-sm bg-[#15803D]" />
              <span>Больше ₽ органики</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Вложение → LTV: firstOrder ≈ adGmv (ROAS≈10), organicFree ≈ 5%, ltv = first + organic. */
const MONTHLY_SPEND_LTV = [
  { month: 'Март', spend: 105_000, ltv: 1_102_500, organicFree: 52_500 },
  { month: 'Апрель', spend: 110_200, ltv: 1_218_000, organicFree: 58_000 },
  { month: 'Май', spend: 118_800, ltv: 1_134_000, organicFree: 54_000 },
  { month: 'Июнь', spend: 124_000, ltv: 1_302_000, organicFree: 62_000 },
  { month: 'Июль', spend: 140_700, ltv: 1_407_000, organicFree: 67_000 },
  { month: 'Август', spend: 120_000, ltv: 1_260_000, organicFree: 60_000 },
].map((row) => ({
  ...row,
  ratio: Number((row.ltv / row.spend).toFixed(1)),
  firstOrder: row.ltv - row.organicFree,
  surplus: row.ltv - row.spend,
  organicOfSpend: Math.round((row.organicFree / row.spend) * 100),
}));

/** Нарастающий итог органики — видно, что «бесплатные» деньги копятся */
const MONTHLY_SPEND_LTV_TREND = (() => {
  let cumOrganic = 0;
  let cumSpend = 0;
  return MONTHLY_SPEND_LTV.map((row) => {
    cumOrganic += row.organicFree;
    cumSpend += row.spend;
    return {
      ...row,
      cumOrganic,
      cumSpend,
      organicShare: Math.round((row.organicFree / row.ltv) * 100),
    };
  });
})();

type LtvViewId = 'bars' | 'gap' | 'stack' | 'efficiency' | 'cards' | 'trend';

const LTV_VIEWS: { id: LtvViewId; label: string; hint: string }[] = [
  { id: 'bars', label: 'Столбики + коэффициент', hint: 'Классика CAC vs LTV (как у SaaS-дашбордов)' },
  { id: 'gap', label: 'Разрыв ценности', hint: 'Площадь LTV над затратами = сколько «сверх» вернула когорта' },
  { id: 'stack', label: 'Состав LTV', hint: 'Первый заказ + органика = полный LTV рядом с вложением' },
  { id: 'efficiency', label: 'Эффективность', hint: 'Сколько бесплатных рублей с органики на 1 ₽ рекламы' },
  { id: 'cards', label: 'Карточки месяцев', hint: 'Каждый месяц как отдельная история вложения' },
  {
    id: 'trend',
    label: 'Тренд органики',
    hint: 'Вложения в рекламу запускают органику — и она растёт от месяца к месяцу',
  },
];

function SpendLtvTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    dataKey?: string;
    value?: number;
    color?: string;
    name?: string;
    payload?: LtvSeriesRow;
  }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const row =
    (payload[0]?.payload as LtvSeriesRow | undefined) ??
    MONTHLY_SPEND_LTV.find((m) => m.month === label);
  if (!row) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs shadow-lg">
      <div className="font-semibold text-gray-900">{label}</div>
      <div className="mt-2 flex flex-col gap-1.5 text-gray-600">
        <div className="flex justify-between gap-8">
          <span>Вложили в рекламу</span>
          <strong className="tabular-nums text-gray-900">{fmtRubShort(row.spend)}</strong>
        </div>
        <div className="flex justify-between gap-8">
          <span>LTV привлечённых</span>
          <strong className="tabular-nums text-gray-900">{fmtRubShort(row.ltv)}</strong>
        </div>
        <div className="flex justify-between gap-8">
          <span className="text-violet-700">Бесплатно с органики</span>
          <strong className="tabular-nums text-violet-800">{fmtRubShort(row.organicFree)}</strong>
        </div>
        <div className="mt-1 flex justify-between gap-8 border-t border-gray-100 pt-1.5">
          <span>LTV / затраты</span>
          <strong className="tabular-nums text-orange-600">{row.ratio}×</strong>
        </div>
      </div>
    </div>
  );
}

function LtvViewBars() {
  const { data } = useLtvSeriesCtx();
  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#F3F4F6" vertical={false} />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
          <YAxis
            yAxisId="money"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            tickFormatter={(v) => `${Math.round(v / 1000)}к`}
            width={44}
          />
          <YAxis
            yAxisId="ratio"
            orientation="right"
            domain={[0, 5]}
            ticks={[0, 1, 2, 3, 4, 5]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#F97316' }}
            tickFormatter={(v) => `${v}×`}
            width={36}
          />
          <Tooltip content={<SpendLtvTooltip />} />
          <Bar yAxisId="money" dataKey="spend" name="Затраты" fill="#2DD4BF" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar yAxisId="money" dataKey="ltv" name="LTV" fill="#1E3A5F" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar yAxisId="money" dataKey="organicFree" name="Органика" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Line
            yAxisId="ratio"
            type="monotone"
            dataKey="ratio"
            name="LTV / затраты"
            stroke="#F97316"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#F97316', strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Площадь LTV и линия затрат — «разрыв» как лучшая практика gap charts */
function LtvViewGap() {
  const { data } = useLtvSeriesCtx();
  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="ltvFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1E3A5F" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#1E3A5F" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="orgFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#F3F4F6" vertical={false} />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            tickFormatter={(v) => `${Math.round(v / 1000)}к`}
            width={44}
          />
          <Tooltip content={<SpendLtvTooltip />} />
          <Area
            type="monotone"
            dataKey="ltv"
            name="LTV"
            stroke="#1E3A5F"
            strokeWidth={2}
            fill="url(#ltvFill)"
          />
          <Area
            type="monotone"
            dataKey="organicFree"
            name="Органика"
            stroke="#8B5CF6"
            strokeWidth={2}
            fill="url(#orgFill)"
          />
          <Line
            type="monotone"
            dataKey="spend"
            name="Затраты"
            stroke="#2DD4BF"
            strokeWidth={3}
            strokeDasharray="6 4"
            dot={{ r: 4, fill: '#2DD4BF', strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Состав: первый заказ + органика = LTV, рядом затраты */
function LtvViewStack() {
  const { data } = useLtvSeriesCtx();
  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={6}>
          <CartesianGrid stroke="#F3F4F6" vertical={false} />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            tickFormatter={(v) => `${Math.round(v / 1000)}к`}
            width={44}
          />
          <Tooltip content={<SpendLtvTooltip />} />
          <Bar dataKey="spend" name="Затраты" fill="#2DD4BF" radius={[4, 4, 0, 0]} maxBarSize={36} />
          <Bar dataKey="firstOrder" name="Первый заказ" stackId="ltv" fill="#94A3B8" maxBarSize={36} />
          <Bar
            dataKey="organicFree"
            name="Бесплатно с органики"
            stackId="ltv"
            fill="#8B5CF6"
            radius={[4, 4, 0, 0]}
            maxBarSize={36}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Горизонтальные полосы: органика на каждый рубль рекламы */
function LtvViewEfficiency() {
  const { data } = useLtvSeriesCtx();
  const max = Math.max(...data.map((r) => r.organicOfSpend), 1);
  return (
    <div className="flex flex-col gap-3 py-1">
      {data.map((row) => {
        const perRub = (row.organicFree / row.spend).toFixed(2).replace('.', ',');
        return (
          <div key={row.month} className="grid grid-cols-[64px_minmax(0,1fr)_72px] items-center gap-3">
            <span className="text-sm font-medium text-gray-800">{row.month}</span>
            <div className="min-w-0">
              <div className="mb-1 flex justify-between gap-2 text-[11px] text-gray-500">
                <span>
                  {perRub} ₽ органики на 1 ₽ рекламы
                </span>
                <span className="tabular-nums text-violet-700">{fmtRubShort(row.organicFree)}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-violet-500"
                  style={{ width: `${(row.organicOfSpend / max) * 100}%` }}
                />
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold tabular-nums text-orange-600">{row.ratio}×</div>
              <div className="text-[10px] text-gray-400">LTV/затр.</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Карточки месяцев — narrative small multiples */
function LtvViewCards() {
  const { data } = useLtvSeriesCtx();
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {data.map((row) => (
        <article key={row.month} className="rounded-xl border border-gray-200 p-4">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900">{row.month}</h3>
            <span className="rounded-md bg-orange-50 px-2 py-0.5 text-xs font-bold tabular-nums text-orange-600">
              {row.ratio}×
            </span>
          </div>
          <div className="mt-3 space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500">Вложили</span>
              <span className="font-semibold tabular-nums text-teal-700">{fmtRubShort(row.spend)}</span>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500">Вернул LTV</span>
              <span className="font-semibold tabular-nums text-slate-900">{fmtRubShort(row.ltv)}</span>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-lg bg-violet-50 px-2 py-1.5">
              <span className="font-medium text-violet-700">Из них бесплатно</span>
              <span className="font-bold tabular-nums text-violet-900">{fmtRubShort(row.organicFree)}</span>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="flex h-full">
              <div className="h-full bg-teal-400" style={{ width: `${(row.spend / row.ltv) * 100}%` }} />
              <div
                className="h-full bg-violet-500"
                style={{ width: `${(row.organicFree / row.ltv) * 100}%` }}
              />
            </div>
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-gray-400">
            <span>затраты</span>
            <span>органика в LTV</span>
          </div>
        </article>
      ))}
    </div>
  );
}

/**
 * Тренд: вложения → органика растёт.
 * Столбики затрат + линия органики за месяц + нарастающий итог «бесплатных» денег.
 */
function LtvViewTrend() {
  const { trend } = useLtvSeriesCtx();
  const first = trend[0];
  const peak = trend.reduce((best, row) => (row.organicFree > best.organicFree ? row : best), first);
  const last = trend[trend.length - 1];
  const organicGrowth =
    first && first.organicFree
      ? Math.round(((peak.organicFree - first.organicFree) / first.organicFree) * 100)
      : 0;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-violet-50 px-4 py-3 text-sm">
        <span className="font-semibold text-violet-900">Тренд:</span>
        <span className="text-violet-800">
          после вложений органика выросла на{' '}
          <strong className="tabular-nums">+{organicGrowth}%</strong> к пику в {peak.month}
        </span>
        <span className="text-violet-600">·</span>
        <span className="text-violet-800">
          накопилось{' '}
          <strong className="tabular-nums">{fmtRubShort(last.cumOrganic)}</strong> бесплатно
        </span>
      </div>

      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={trend}
            margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="cumOrgFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <YAxis
              yAxisId="money"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              tickFormatter={(v) => `${Math.round(v / 1000)}к`}
              width={44}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const row = (payload[0]?.payload as LtvTrendRow | undefined) ?? trend.find((m) => m.month === label);
                if (!row) return null;
                return (
                  <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs shadow-lg">
                    <div className="font-semibold text-gray-900">{label}</div>
                    <div className="mt-2 flex flex-col gap-1.5 text-gray-600">
                      <div className="flex justify-between gap-8">
                        <span>Вложили в этом месяце</span>
                        <strong className="tabular-nums">{fmtRubShort(row.spend)}</strong>
                      </div>
                      <div className="flex justify-between gap-8">
                        <span className="text-violet-700">Органика за месяц</span>
                        <strong className="tabular-nums text-violet-800">
                          {fmtRubShort(row.organicFree)}
                        </strong>
                      </div>
                      <div className="flex justify-between gap-8 border-t border-gray-100 pt-1.5">
                        <span>Накоплено органики</span>
                        <strong className="tabular-nums text-violet-900">
                          {fmtRubShort(row.cumOrganic)}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Area
              yAxisId="money"
              type="monotone"
              dataKey="cumOrganic"
              name="Накоплено бесплатно"
              stroke="none"
              fill="url(#cumOrgFill)"
            />
            <Bar
              yAxisId="money"
              dataKey="spend"
              name="Вложения"
              fill="#2DD4BF"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              opacity={0.85}
            />
            <Line
              yAxisId="money"
              type="monotone"
              dataKey="organicFree"
              name="Органика за месяц"
              stroke="#7C3AED"
              strokeWidth={3.5}
              dot={{ r: 5, fill: '#7C3AED', strokeWidth: 0 }}
              activeDot={{ r: 7 }}
            />
            <Line
              yAxisId="money"
              type="monotone"
              dataKey="cumOrganic"
              name="Накоплено"
              stroke="#5B21B6"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SpendLtvOrganicBlock() {
  const range = useStatsRange();
  const [view, setView] = useState<LtvViewId>('trend');
  const current = LTV_VIEWS.find((v) => v.id === view)!;
  const data = useMemo(() => getLtvForRange(range), [range]);
  const trend = useMemo(() => buildLtvTrend(data), [data]);
  const periodLabel =
    data.length === 1
      ? data[0].month
      : data.length <= 3
        ? `${data.length} мес.`
        : `${data.length} мес.`;

  return (
    <LtvSeriesContext.Provider value={{ data, trend }}>
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Вложения → LTV и бесплатные деньги с органики
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            {current.hint} · {STATS_RANGE_LABELS[range]}
          </p>
        </div>
        <Tip text="LTV — вся выручка покупателей, впервые привлечённых в этом месяце. «Бесплатно с органики» — повторные заказы этих же покупателей без рекламного контакта." />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {LTV_VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              view === v.id
                ? 'bg-gray-950 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === 'bars' && (
        <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#2DD4BF]" />
            Затраты
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#1E3A5F]" />
            LTV
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#8B5CF6]" />
            Органика
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 rounded-full bg-orange-500" />
            LTV / затраты
          </span>
        </div>
      )}
      {view === 'gap' && (
        <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 border-t-2 border-dashed border-teal-400" />
            Затраты
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-slate-700/40" />
            LTV
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-violet-500/50" />
            Органика
          </span>
        </div>
      )}
      {view === 'stack' && (
        <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#2DD4BF]" />
            Затраты
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#94A3B8]" />
            Первый заказ
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#8B5CF6]" />
            Бесплатно с органики
          </span>
        </div>
      )}
      {view === 'trend' && (
        <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#2DD4BF]" />
            Вложения в рекламу
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 rounded-full bg-violet-600" />
            Органика за месяц
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 border-t-2 border-dashed border-violet-900" />
            Накоплено бесплатно
          </span>
        </div>
      )}

      <div className="mt-5">
        {view === 'bars' && <LtvViewBars />}
        {view === 'gap' && <LtvViewGap />}
        {view === 'stack' && <LtvViewStack />}
        {view === 'efficiency' && <LtvViewEfficiency />}
        {view === 'cards' && <LtvViewCards />}
        {view === 'trend' && <LtvViewTrend />}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-gray-50 px-4 py-3">
          <div className="text-[11px] text-gray-500">Вложили за {periodLabel}</div>
          <div className="mt-1 text-lg font-bold tabular-nums text-gray-950">
            {fmtRubShort(data.reduce((s, r) => s + r.spend, 0))}
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <div className="text-[11px] text-gray-500">LTV когорт</div>
          <div className="mt-1 text-lg font-bold tabular-nums text-slate-900">
            {fmtRubShort(data.reduce((s, r) => s + r.ltv, 0))}
          </div>
        </div>
        <div className="rounded-xl bg-violet-50 px-4 py-3">
          <div className="text-[11px] text-violet-700">Бесплатно с органики</div>
          <div className="mt-1 text-lg font-bold tabular-nums text-violet-900">
            {fmtRubShort(data.reduce((s, r) => s + r.organicFree, 0))}
          </div>
        </div>
      </div>
    </section>
    </LtvSeriesContext.Provider>
  );
}

/** CAC: расходы ÷ новые покупатели */
type CacChannelId = 'all' | 'promotion' | 'media';
type CacViewId = 'classic' | 'vsFirst' | 'payback';

const CAC_CHANNELS: { id: CacChannelId; label: string }[] = [
  { id: 'all', label: 'Все каналы' },
  { id: 'promotion', label: 'Продвижение' },
  { id: 'media', label: 'Медиа' },
];

const CAC_VIEWS: { id: CacViewId; label: string; hint: string }[] = [
  {
    id: 'classic',
    label: 'CAC во времени',
    hint: 'Факт месяца, накопленный CAC с начала года и целевой уровень',
  },
  {
    id: 'vsFirst',
    label: 'CAC vs первый заказ',
    hint: 'Окупается ли привлечение уже на первой покупке',
  },
  {
    id: 'payback',
    label: 'Окупаемость LTV',
    hint: 'Во сколько раз LTV когорты больше CAC — и сколько месяцев до окупаемости',
  },
];

type CacMonthRaw = {
  month: string;
  short: string;
  spend: number;
  newBuyers: number;
  /** Средний чек первого заказа */
  firstOrder: number;
  /** Накопленный LTV на покупателя к текущему моменту (демо) */
  ltvPerBuyer: number;
};

const CAC_BY_CHANNEL: Record<CacChannelId, { budget: number; months: CacMonthRaw[] }> = {
  all: {
    budget: 200,
    months: [
      { month: 'Янв', short: 'Янв 2025', spend: 80_000, newBuyers: 435, firstOrder: 1840, ltvPerBuyer: 3183 },
      { month: 'Фев', short: 'Фев', spend: 94_600, newBuyers: 476, firstOrder: 1910, ltvPerBuyer: 3419 },
      { month: 'Мар', short: 'Мар', spend: 105_000, newBuyers: 559, firstOrder: 1880, ltvPerBuyer: 3553 },
      { month: 'Апр', short: 'Апр', spend: 110_200, newBuyers: 592, firstOrder: 1960, ltvPerBuyer: 3606 },
      { month: 'Май', short: 'Май', spend: 118_800, newBuyers: 593, firstOrder: 1820, ltvPerBuyer: 3476 },
      { month: 'Июн', short: 'Июн', spend: 124_000, newBuyers: 611, firstOrder: 2030, ltvPerBuyer: 3715 },
      { month: 'Июл', short: 'Июл', spend: 140_700, newBuyers: 677, firstOrder: 1980, ltvPerBuyer: 3643 },
      { month: 'Авг', short: 'Авг', spend: 120_000, newBuyers: 569, firstOrder: 2110, ltvPerBuyer: 3819 },
      { month: 'Сен', short: 'Сен', spend: 140_000, newBuyers: 741, firstOrder: 1890, ltvPerBuyer: 3515 },
      { month: 'Окт', short: 'Окт', spend: 139_700, newBuyers: 717, firstOrder: 2050, ltvPerBuyer: 3690 },
      { month: 'Ноя', short: 'Ноя', spend: 140_000, newBuyers: 645, firstOrder: 2170, ltvPerBuyer: 3928 },
      { month: 'Дек', short: 'Дек', spend: 111_200, newBuyers: 522, firstOrder: 2240, ltvPerBuyer: 4077 },
    ],
  },
  promotion: {
    budget: 185,
    months: [
      { month: 'Янв', short: 'Янв 2025', spend: 64_000, newBuyers: 351, firstOrder: 1822, ltvPerBuyer: 3089 },
      { month: 'Фев', short: 'Фев', spend: 75_700, newBuyers: 385, firstOrder: 1891, ltvPerBuyer: 3317 },
      { month: 'Мар', short: 'Мар', spend: 84_000, newBuyers: 451, firstOrder: 1861, ltvPerBuyer: 3447 },
      { month: 'Апр', short: 'Апр', spend: 88_200, newBuyers: 478, firstOrder: 1940, ltvPerBuyer: 3498 },
      { month: 'Май', short: 'Май', spend: 95_000, newBuyers: 479, firstOrder: 1802, ltvPerBuyer: 3373 },
      { month: 'Июн', short: 'Июн', spend: 99_200, newBuyers: 494, firstOrder: 2010, ltvPerBuyer: 3605 },
      { month: 'Июл', short: 'Июл', spend: 112_600, newBuyers: 547, firstOrder: 1960, ltvPerBuyer: 3534 },
      { month: 'Авг', short: 'Авг', spend: 96_000, newBuyers: 460, firstOrder: 2089, ltvPerBuyer: 3705 },
      { month: 'Сен', short: 'Сен', spend: 112_000, newBuyers: 599, firstOrder: 1871, ltvPerBuyer: 3410 },
      { month: 'Окт', short: 'Окт', spend: 111_800, newBuyers: 579, firstOrder: 2030, ltvPerBuyer: 3581 },
      { month: 'Ноя', short: 'Ноя', spend: 112_000, newBuyers: 521, firstOrder: 2148, ltvPerBuyer: 3810 },
      { month: 'Дек', short: 'Дек', spend: 89_000, newBuyers: 422, firstOrder: 2218, ltvPerBuyer: 3956 },
    ],
  },
  media: {
    budget: 220,
    months: [
      { month: 'Янв', short: 'Янв 2025', spend: 16_000, newBuyers: 82, firstOrder: 1950, ltvPerBuyer: 3441 },
      { month: 'Фев', short: 'Фев', spend: 18_900, newBuyers: 90, firstOrder: 2025, ltvPerBuyer: 3697 },
      { month: 'Мар', short: 'Мар', spend: 21_000, newBuyers: 105, firstOrder: 1993, ltvPerBuyer: 3842 },
      { month: 'Апр', short: 'Апр', spend: 22_000, newBuyers: 112, firstOrder: 2078, ltvPerBuyer: 3900 },
      { month: 'Май', short: 'Май', spend: 23_800, newBuyers: 112, firstOrder: 1929, ltvPerBuyer: 3758 },
      { month: 'Июн', short: 'Июн', spend: 24_800, newBuyers: 115, firstOrder: 2152, ltvPerBuyer: 4017 },
      { month: 'Июл', short: 'Июл', spend: 28_100, newBuyers: 128, firstOrder: 2099, ltvPerBuyer: 3939 },
      { month: 'Авг', short: 'Авг', spend: 24_000, newBuyers: 107, firstOrder: 2237, ltvPerBuyer: 4130 },
      { month: 'Сен', short: 'Сен', spend: 28_000, newBuyers: 140, firstOrder: 2003, ltvPerBuyer: 3800 },
      { month: 'Окт', short: 'Окт', spend: 27_900, newBuyers: 135, firstOrder: 2173, ltvPerBuyer: 3990 },
      { month: 'Ноя', short: 'Ноя', spend: 28_000, newBuyers: 122, firstOrder: 2300, ltvPerBuyer: 4246 },
      { month: 'Дек', short: 'Дек', spend: 22_200, newBuyers: 99, firstOrder: 2374, ltvPerBuyer: 4407 },
    ],
  },
};

function buildCacSeries(channel: CacChannelId) {
  const cfg = CAC_BY_CHANNEL[channel];
  let cumSpend = 0;
  let cumBuyers = 0;
  return cfg.months.map((row) => {
    cumSpend += row.spend;
    cumBuyers += row.newBuyers;
    const monthly = Math.round(row.spend / row.newBuyers);
    const ytdAvg = Math.round(cumSpend / cumBuyers);
    const ltvMultiple = Number((row.ltvPerBuyer / monthly).toFixed(1));
    const afterFirst = Math.max(row.ltvPerBuyer - row.firstOrder, 1);
    const monthlyLift = afterFirst / 5;
    const paybackMonths =
      monthly <= row.firstOrder
        ? 0
        : Number((1 + (monthly - row.firstOrder) / monthlyLift).toFixed(1));
    return {
      ...row,
      monthly,
      ytdAvg,
      budget: cfg.budget,
      coverage: Math.round((row.firstOrder / monthly) * 100),
      ltvMultiple,
      paybackMonths,
      surplus: row.firstOrder - monthly,
    };
  });
}

type CacSeriesRow = ReturnType<typeof buildCacSeries>[number];

function CacClassicTooltip({
  active,
  label,
  series,
}: {
  active?: boolean;
  label?: string;
  series: CacSeriesRow[];
}) {
  if (!active) return null;
  const row = series.find((m) => m.month === label);
  if (!row) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs shadow-lg">
      <div className="font-semibold text-gray-900">
        {row.short === 'Янв 2025' ? 'Январь 2025' : label}
      </div>
      <div className="mt-2 flex flex-col gap-1.5 text-gray-600">
        <div className="flex justify-between gap-8">
          <span>CAC за месяц</span>
          <strong className="tabular-nums text-emerald-700">{fmtRubShort(row.monthly)}</strong>
        </div>
        <div className="flex justify-between gap-8">
          <span>Накопленный CAC</span>
          <strong className="tabular-nums text-blue-700">{fmtRubShort(row.ytdAvg)}</strong>
        </div>
        <div className="text-[11px] text-gray-400">
          {fmt(row.spend)} ₽ ÷ {fmt(row.newBuyers)} покупателей
        </div>
        <div className="flex justify-between gap-8 border-t border-gray-100 pt-1.5">
          <span>Целевой</span>
          <strong className="tabular-nums text-rose-600">{fmtRubShort(row.budget)}</strong>
        </div>
      </div>
    </div>
  );
}

function CacViewClassic({ series, yMax }: { series: CacSeriesRow[]; yMax: number }) {
  const yTicks = [0, yMax / 4, yMax / 2, (yMax * 3) / 4, yMax].map(Math.round);
  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#E5E7EB" vertical={false} />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickFormatter={(v, i) => (i === 0 ? series[0].short : v)}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            domain={[0, yMax]}
            ticks={yTicks}
            tickFormatter={(v) => `${v} ₽`}
            width={52}
          />
          <Tooltip
            content={(props) => (
              <CacClassicTooltip active={props.active} label={props.label} series={series} />
            )}
            cursor={{ fill: 'rgba(37, 99, 235, 0.04)' }}
          />
          <Bar
            dataKey="ytdAvg"
            name="Накопленный CAC"
            fill="#2563EB"
            radius={[3, 3, 0, 0]}
            maxBarSize={36}
          />
          <Line
            type="monotone"
            dataKey="monthly"
            name="CAC за месяц"
            stroke="#22C55E"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#22C55E', strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="budget"
            name="Целевой"
            stroke="#F87171"
            strokeWidth={2}
            dot={{ r: 3.5, fill: '#F87171', strokeWidth: 0 }}
            activeDot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function CacViewVsFirst({ series }: { series: CacSeriesRow[] }) {
  const yMax =
    Math.ceil(Math.max(...series.map((r) => Math.max(r.monthly, r.firstOrder))) / 100) * 100 + 100;
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-4 text-[11px] text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#F87171]" />
          CAC
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#2563EB]" />
          Средний первый заказ
        </span>
      </div>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4}>
            <CartesianGrid stroke="#E5E7EB" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              domain={[0, yMax]}
              tickFormatter={(v) => `${v} ₽`}
              width={52}
            />
            <Tooltip
              content={({ active, label }) => {
                if (!active) return null;
                const row = series.find((m) => m.month === label);
                if (!row) return null;
                return (
                  <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs shadow-lg">
                    <div className="font-semibold text-gray-900">{label}</div>
                    <div className="mt-2 flex flex-col gap-1.5 text-gray-600">
                      <div className="flex justify-between gap-8">
                        <span>CAC</span>
                        <strong className="tabular-nums text-rose-600">{fmtRubShort(row.monthly)}</strong>
                      </div>
                      <div className="flex justify-between gap-8">
                        <span>Первый заказ</span>
                        <strong className="tabular-nums text-blue-700">
                          {fmtRubShort(row.firstOrder)}
                        </strong>
                      </div>
                      <div className="flex justify-between gap-8 border-t border-gray-100 pt-1.5">
                        <span>Покрытие CAC</span>
                        <strong
                          className={`tabular-nums ${
                            row.coverage >= 100 ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {row.coverage}%
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="monthly" name="CAC" fill="#F87171" radius={[3, 3, 0, 0]} maxBarSize={28} />
            <Bar
              dataKey="firstOrder"
              name="Первый заказ"
              fill="#2563EB"
              radius={[3, 3, 0, 0]}
              maxBarSize={28}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CacViewPayback({ series }: { series: CacSeriesRow[] }) {
  const yMax =
    Math.ceil(Math.max(...series.map((r) => Math.max(r.monthly, r.ltvPerBuyer))) / 200) * 200;
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-4 text-[11px] text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#F87171]" />
          CAC
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#1E3A5F]" />
          LTV на покупателя
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded-full bg-orange-500" />
          LTV / CAC
        </span>
      </div>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#E5E7EB" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <YAxis
              yAxisId="rub"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              domain={[0, yMax]}
              tickFormatter={(v) => `${Math.round(v / 1000)}к`}
              width={40}
            />
            <YAxis
              yAxisId="x"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              domain={[0, 12]}
              tickFormatter={(v) => `${v}×`}
              width={36}
            />
            <Tooltip
              content={({ active, label }) => {
                if (!active) return null;
                const row = series.find((m) => m.month === label);
                if (!row) return null;
                return (
                  <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs shadow-lg">
                    <div className="font-semibold text-gray-900">{label}</div>
                    <div className="mt-2 flex flex-col gap-1.5 text-gray-600">
                      <div className="flex justify-between gap-8">
                        <span>CAC</span>
                        <strong className="tabular-nums">{fmtRubShort(row.monthly)}</strong>
                      </div>
                      <div className="flex justify-between gap-8">
                        <span>LTV</span>
                        <strong className="tabular-nums">{fmtRubShort(row.ltvPerBuyer)}</strong>
                      </div>
                      <div className="flex justify-between gap-8 border-t border-gray-100 pt-1.5">
                        <span>LTV / CAC</span>
                        <strong className="tabular-nums text-orange-600">{row.ltvMultiple}×</strong>
                      </div>
                      <div className="flex justify-between gap-8">
                        <span>Окупаемость</span>
                        <strong className="tabular-nums">
                          {row.paybackMonths === 0
                            ? 'на 1-м заказе'
                            : `≈ ${row.paybackMonths} мес.`}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Bar
              yAxisId="rub"
              dataKey="monthly"
              name="CAC"
              fill="#F87171"
              radius={[3, 3, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              yAxisId="rub"
              dataKey="ltvPerBuyer"
              name="LTV"
              fill="#1E3A5F"
              radius={[3, 3, 0, 0]}
              maxBarSize={28}
            />
            <Line
              yAxisId="x"
              type="monotone"
              dataKey="ltvMultiple"
              name="LTV / CAC"
              stroke="#F97316"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#F97316', strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CacChartBlock() {
  const range = useStatsRange();
  const [channel, setChannel] = useState<CacChannelId>('all');
  const [view, setView] = useState<CacViewId>('classic');
  const series = useMemo(() => {
    const full = buildCacSeries(channel);
    const n = getCacMonthsForRange(range);
    return full.slice(-Math.max(1, n));
  }, [channel, range]);
  const current = series[series.length - 1];
  const prev = series.length > 1 ? series[series.length - 2] : current;
  const momPct = prev.monthly
    ? Math.round(((current.monthly - prev.monthly) / prev.monthly) * 100)
    : 0;
  const momUp = momPct > 0;
  const momBad = momUp;
  const viewMeta = CAC_VIEWS.find((v) => v.id === view)!;
  const yMax = Math.max(
    800,
    Math.ceil(Math.max(...series.map((r) => Math.max(r.monthly, r.ytdAvg, r.budget))) / 100) *
      100 +
      100,
  );

  const pillValue =
    view === 'classic'
      ? fmtRubShort(current.monthly)
      : view === 'vsFirst'
        ? `${current.coverage}%`
        : `${current.ltvMultiple}×`;

  const pillHint =
    view === 'classic' ? 'CAC за месяц' : view === 'vsFirst' ? 'покрытие 1-м заказом' : 'LTV / CAC';

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="text-base font-semibold tracking-tight text-gray-900">
            Стоимость привлечения (CAC)
          </h2>
          <span
            className={`inline-flex items-center gap-0.5 text-sm font-semibold tabular-nums ${
              momBad ? 'text-rose-500' : 'text-emerald-600'
            }`}
          >
            <ArrowUp className={`h-3.5 w-3.5 ${momUp ? '' : 'rotate-180'}`} />
            {Math.abs(momPct)}% vs прошлый месяц
          </span>
          <Tip text="CAC = расходы на рекламу ÷ новые покупатели. «Все каналы» — общий spend ÷ все новые покупатели, не среднее CAC каналов. Фильтр — по каналу первого рекламного контакта." />
        </div>
        <div className="text-right">
          <div className="rounded-full bg-sky-100 px-5 py-2 text-2xl font-bold tabular-nums tracking-tight text-sky-900">
            {pillValue}
          </div>
          <div className="mt-1 text-[10px] text-gray-400">{pillHint}</div>
        </div>
      </div>

      <p className="mt-2 text-xs text-gray-500">
        {viewMeta.hint} · {STATS_RANGE_LABELS[range]}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {CAC_CHANNELS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setChannel(c.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              channel === c.id
                ? 'bg-gray-950 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {CAC_VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              view === v.id ? 'bg-sky-600 text-white' : 'bg-sky-50 text-sky-800 hover:bg-sky-100'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === 'classic' && (
        <div className="mt-4 flex flex-wrap gap-5 text-[11px] text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#2563EB]" />
            Накопленный CAC (spend ÷ покупатели с начала года)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
            CAC за месяц
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#F87171]" />
            Целевой CAC
          </span>
        </div>
      )}

      <div className="mt-4">
        {view === 'classic' && <CacViewClassic series={series} yMax={yMax} />}
        {view === 'vsFirst' && <CacViewVsFirst series={series} />}
        {view === 'payback' && <CacViewPayback series={series} />}
      </div>
    </section>
  );
}

/**
 * Динамика органики от клиентов, которые касались продвижения.
 * По дате повторного органического заказа — видно, растёт ли эффект со временем.
 *
 * Один драйвер = рекламный GMV когорты. Органика ≈ 5% от него (вводные продакта).
 * Клиенты и заказы считаются из той же выручки — форма трёх графиков совпадает.
 * Просадки: май (после весеннего пика), август (летнее затишье) — как у спроса на WB.
 */
const ORGANIC_RETURN_AOV = 1_640; // средний чек повторного органического заказа
/** База «зак./чел.» за ~1 месяц; на длинном окне частота растёт (см. ordersPerClientForRange). */
const ORGANIC_RETURN_ORDERS_PER_CLIENT = 1.22;
const ORGANIC_RETURN_SHARE = 0.05; // органика ≈ 5% от рекламного GMV

/**
 * Заказов на человека за выбранное окно: за день/неделю ≈ 1,
 * за месяц — база, за полгода/год — выше (больше повторных касаний).
 */
function ordersPerClientForRange(range: StatsRangeId): number {
  const months = (() => {
    switch (range) {
      case 'today':
      case 'yesterday':
        return 1 / 30;
      case 'week':
        return 7 / 30;
      case 'twoWeeks':
        return 14 / 30;
      case 'month':
        return 1;
      case 'quarter':
        return 3;
      case 'halfYear':
        return 6;
      case 'year':
        return 12;
      case 'custom':
        return 2;
      default:
        return 1;
    }
  })();

  const baseline = ORGANIC_RETURN_ORDERS_PER_CLIENT;
  const asymptote = 2.45;
  const t = Math.max(months, 0.03);
  if (t < 1) {
    return Math.round((1 + (baseline - 1) * t) * 100) / 100;
  }
  const opc = asymptote - (asymptote - baseline) * Math.exp(-0.18 * (t - 1));
  return Math.round(opc * 100) / 100;
}

const ORGANIC_RETURN_AD_GMV: Array<{ month: string; adGmv: number; share: number }> = [
  { month: 'Янв', adGmv: 800_000, share: 0.048 },
  { month: 'Фев', adGmv: 910_000, share: 0.051 },
  { month: 'Мар', adGmv: 1_050_000, share: 0.053 },
  { month: 'Апр', adGmv: 1_160_000, share: 0.055 },
  { month: 'Май', adGmv: 1_080_000, share: 0.047 },
  { month: 'Июн', adGmv: 1_240_000, share: 0.052 },
  { month: 'Июл', adGmv: 1_340_000, share: 0.054 },
  { month: 'Авг', adGmv: 1_200_000, share: 0.049 },
  { month: 'Сен', adGmv: 1_400_000, share: 0.056 },
  { month: 'Окт', adGmv: 1_470_000, share: 0.053 },
  { month: 'Ноя', adGmv: 1_400_000, share: 0.051 },
  { month: 'Дек', adGmv: 1_170_000, share: 0.046 }, // текущий месяц ≈ KPI «месяц»
];

const ORGANIC_RETURN_MONTHLY = ORGANIC_RETURN_AD_GMV.map(({ month, adGmv, share }) => {
  const gmv = Math.round(adGmv * share);
  const orders = Math.max(1, Math.round(gmv / ORGANIC_RETURN_AOV));
  const clients = Math.max(1, Math.round(orders / ORGANIC_RETURN_ORDERS_PER_CLIENT));
  return { month, adGmv, share, gmv, clients, orders };
});


/**
 * Органика под календарь и детализацию (день / неделя / месяц).
 * Ось X показывает крупные метки (месяцы), точки — по выбранной детализации.
 */
function formatOrganicTooltipLabel(date: Date, grain: StatsGrainId, range: StatsRangeId): string {
  if (grain === 'month') {
    return capitalizeRu(date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }));
  }
  if (grain === 'week') {
    const from = startOfDay(date);
    const to = new Date(from);
    to.setDate(from.getDate() + 6);
    const fromPart = from.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }).replace('.', '');
    const toPart = to.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }).replace('.', '');
    return `${fromPart} – ${toPart}`;
  }
  if (range === 'today' || range === 'yesterday') {
    const base = capitalizeRu(
      date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }),
    );
    const hh = String(date.getHours()).padStart(2, '0');
    return `${base}, ${hh}:00`;
  }
  return capitalizeRu(
    date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }),
  );
}

function getOrganicReturnSeries(range: StatsRangeId, grain: StatsGrainId = 'day') {
  const base = ORGANIC_RETURN_MONTHLY;
  const last = base[base.length - 1];
  const prev = base[base.length - 2] ?? last;

  const fromPoint = (
    adGmv: number,
    key: string,
    axisLabel: string,
    dateLabel: string,
    tipLabel: string,
    share: number = ORGANIC_RETURN_SHARE,
    opc: number = ORGANIC_RETURN_ORDERS_PER_CLIENT,
  ) => {
    const gmv = Math.round(adGmv * share);
    const orders = Math.max(1, Math.round(gmv / ORGANIC_RETURN_AOV));
    const clients = Math.max(1, Math.round(orders / Math.max(opc, 0.5)));
    return {
      label: key,
      month: key,
      axisLabel,
      dateLabel,
      tipLabel,
      adGmv,
      gmv,
      clients,
      orders,
    };
  };

  const dayWave = (i: number, n: number) =>
    0.72 + 0.45 * Math.sin((i / Math.max(n - 1, 1)) * Math.PI * 1.4);

  /** Доля органики вокруг ~5%: короткие окна чуть ниже, длинные ближе к зрелой. */
  const rangeShareBias =
    range === 'today' || range === 'yesterday'
      ? 0.9
      : range === 'week'
        ? 0.92
      : range === 'twoWeeks'
        ? 0.95
        : range === 'month'
          ? 0.98
          : range === 'quarter'
            ? 1.02
            : range === 'halfYear'
              ? 1.04
              : 1.06;

  if (grain === 'month' && range !== 'week' && range !== 'twoWeeks') {
    if (range === 'today' || range === 'yesterday' || range === 'month') {
      const src = range === 'yesterday' ? prev : last;
      const label = range === 'yesterday' ? 'июль' : 'август';
      const factor =
        range === 'today' ? 1 : range === 'yesterday' ? 0.92 : 1;
      return [
        fromPoint(
          Math.round(src.adGmv * factor),
          label,
          label,
          label,
          label,
          src.share * rangeShareBias,
        ),
      ];
    }
    const slice =
      range === 'quarter'
        ? base.slice(4, 8)
        : range === 'halfYear'
          ? base.slice(2, 8)
          : range === 'custom'
            ? base.slice(4, 6)
            : base;
    return slice.map((r, i) => {
      const full = r.month.length <= 3 ? r.month : r.month.toLowerCase();
      const opc =
        ORGANIC_RETURN_ORDERS_PER_CLIENT *
        (0.94 + 0.12 * Math.sin((i / Math.max(slice.length - 1, 1)) * Math.PI * 1.1));
      return fromPoint(r.adGmv, r.month, full, r.month, r.month, r.share, opc);
    });
  }

  // Период «неделя» / «2 недели» на оси всегда по дням.
  const seriesGrain: StatsGrainId =
    range === 'week' || range === 'twoWeeks' ? 'day' : grain;
  const n = Math.max(1, organicPointCount(range, seriesGrain));
  const dates = sparkDatesForRange(range, n, seriesGrain);
  const divisor = seriesGrain === 'week' ? 4.3 : 30;
  const rangeScale =
    range === 'today' || range === 'yesterday'
      ? 0.9
      : range === 'week'
        ? 1
        : range === 'twoWeeks'
          ? 1.02
          : range === 'month'
            ? 1
            : range === 'quarter'
              ? 1.05
              : range === 'halfYear'
                ? 1.1
                : 1.15;

  return dates.map((date, i) => {
    const t = n === 1 ? 1 : i / (n - 1);
    const adBase = ((prev.adGmv * (1 - t) + last.adGmv * t) / divisor) * rangeScale;
    const adGmv = Math.round(adBase * dayWave(i, n));
    const shareBase = prev.share * (1 - t) + last.share * t;
    const share =
      shareBase *
      rangeShareBias *
      (0.94 + 0.12 * Math.sin((i / Math.max(n - 1, 1)) * Math.PI * 2.1));
    const opc =
      ORGANIC_RETURN_ORDERS_PER_CLIENT *
      (0.9 + 0.2 * Math.sin((i / Math.max(n - 1, 1)) * Math.PI * 1.6 + 0.4));
    const prevDate = i > 0 ? dates[i - 1] : null;
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
    const dateLabel =
      seriesGrain === 'day' && (range === 'today' || range === 'yesterday')
        ? `${String(date.getHours()).padStart(2, '0')}:00`
        : formatDayPill(date);
    return fromPoint(
      adGmv,
      key,
      organicAxisLabel(date, prevDate, range, seriesGrain),
      dateLabel,
      formatOrganicTooltipLabel(date, seriesGrain, range),
      share,
      opc,
    );
  });
}

function getStackSeriesForRange(range: StatsRangeId) {
  const all = SPEND_ORGANIC_STACK_SERIES;
  if (range === 'quarter') return all.slice(4, 8);
  if (range === 'halfYear') return all.slice(2, 8);
  if (range === 'year') return all;
  if (range === 'custom') return all.slice(4, 6);
  if (range === 'month' || range === 'week' || range === 'twoWeeks' || range === 'today' || range === 'yesterday') {
    return all.slice(-1);
  }
  return takeLastMonths(all, range);
}

function getSpendOrganicForRange(range: StatsRangeId) {
  const all = MONTHLY_SPEND_ORGANIC;
  if (range === 'quarter') return all.slice(-3);
  if (range === 'halfYear' || range === 'year') return all;
  if (range === 'custom') return all.length >= 4 ? all.slice(2, 4) : all.slice(-2);
  if (range === 'month' || range === 'week' || range === 'twoWeeks' || range === 'today' || range === 'yesterday') {
    return all.slice(-1);
  }
  return takeLastMonths(all, range);
}

function getLtvForRange(range: StatsRangeId) {
  const all = MONTHLY_SPEND_LTV;
  if (range === 'quarter') return all.slice(-3);
  if (range === 'halfYear' || range === 'year') return all;
  if (range === 'custom') return all.length >= 4 ? all.slice(2, 4) : all.slice(-2);
  if (range === 'month' || range === 'week' || range === 'twoWeeks' || range === 'today' || range === 'yesterday') {
    return all.slice(-1);
  }
  return takeLastMonths(all, range);
}

function getCacMonthsForRange(range: StatsRangeId) {
  if (range === 'quarter') return 4;
  if (range === 'halfYear') return 6;
  if (range === 'year') return 12;
  if (range === 'custom') return 2;
  if (range === 'month' || range === 'week' || range === 'twoWeeks' || range === 'today' || range === 'yesterday') return 1;
  return 12;
}

type LtvSeriesRow = (typeof MONTHLY_SPEND_LTV)[number];
type LtvTrendRow = {
  month: string;
  spend: number;
  ltv: number;
  organicFree: number;
  ratio: number;
  firstOrder: number;
  surplus: number;
  organicOfSpend: number;
  cumOrganic: number;
  cumSpend: number;
  organicShare: number;
};

function buildLtvTrend(rows: LtvSeriesRow[]): LtvTrendRow[] {
  let cumOrganic = 0;
  let cumSpend = 0;
  return rows.map((row) => {
    cumOrganic += row.organicFree;
    cumSpend += row.spend;
    return {
      ...row,
      cumOrganic,
      cumSpend,
      organicShare: Math.round((row.organicFree / row.ltv) * 100),
    };
  });
}

const LtvSeriesContext = createContext<{ data: LtvSeriesRow[]; trend: LtvTrendRow[] }>({
  data: MONTHLY_SPEND_LTV,
  trend: MONTHLY_SPEND_LTV_TREND,
});

function useLtvSeriesCtx() {
  return useContext(LtvSeriesContext);
}

type OrganicMetricKey = 'gmv' | 'clients' | 'orders';

const ORGANIC_METRIC_META: Record<
  OrganicMetricKey,
  { label: string; color: string; format: (n: number) => string; unit?: string }
> = {
  gmv: {
    label: 'Выручка повторных органических заказов',
    color: '#7C3AED',
    format: (n) => fmtRubShort(n),
  },
  clients: {
    label: 'Количество вернувшихся клиентов',
    color: '#2563EB',
    format: (n) => fmt(n),
    unit: 'чел.',
  },
  orders: {
    label: 'Количество повторных органических заказов',
    color: '#059669',
    format: (n) => fmt(n),
    unit: 'зак.',
  },
};

/** Доля привлечённых рекламой, вернувшихся с повторной покупкой (мок) */
const RETURNED_BUYERS_SHARE = { pct: 23, momPp: 1.4 };

/** Демо: товар с наибольшим числом повторных орг. заказов после продвижения */
const TOP_ORGANIC_REPEAT_PRODUCT = {
  name: 'Крем SPF 50, 50 мл',
  orders: 128,
  sharePct: 29,
};

function momPct(curr: number, prev: number) {
  if (!prev) return 0;
  return Math.round(((curr - prev) / prev) * 100);
}

function OrganicMetricMonthChart({
  metricKey,
  series: source,
  compact = false,
  embedded = false,
  chartHeightClass = 'h-[200px]',
  title,
  titleClassName,
  onTitleClick,
}: {
  metricKey: OrganicMetricKey;
  series: ReturnType<typeof getOrganicReturnSeries>;
  /** Только шапка: значение + тренд, без графика */
  compact?: boolean;
  /** Без собственной белой карточки — для вложения в общий блок */
  embedded?: boolean;
  chartHeightClass?: string;
  /** Переопределение подписи метрики */
  title?: string;
  titleClassName?: string;
  /** Клик по заголовку — например, переход на /stats/return?metric=… */
  onTitleClick?: () => void;
}) {
  const meta = ORGANIC_METRIC_META[metricKey];
  const areaGradId = `organic-metric-fill-${metricKey}`;
  const displayTitle = title ?? meta.label;
  const last = source[source.length - 1];
  const prev = source.length > 1 ? source[source.length - 2] : last;
  const value = last[metricKey];
  const mom = momPct(value, prev[metricKey]);
  const up = mom >= 0;
  const isGmv = metricKey === 'gmv';
  const shareOfAd = isGmv && last.adGmv ? Math.round((last.gmv / last.adGmv) * 1000) / 10 : null;

  let cum = 0;
  const series = source.map((row) => {
    cum += row[metricKey];
    return {
      ...row,
      value: row[metricKey],
      cumulative: cum,
    };
  });
  const yFmt = (v: number) => (isGmv ? `${Math.round(v / 1000)}к` : String(v));

  const tooltip = ({ active, label }: { active?: boolean; label?: string }) => {
    if (!active) return null;
    const row = series.find((m) => m.month === label);
    if (!row) return null;
    const idx = series.findIndex((m) => m.month === label);
    const prevRow = idx > 0 ? series[idx - 1] : null;
    const val = row.value;
    const delta = prevRow ? momPct(val, prevRow.value) : null;
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg">
        <div className="font-semibold text-gray-900">{label}</div>
        <div className="mt-1 flex items-center justify-between gap-6 text-gray-600">
          <span>{meta.label}</span>
          <strong className="tabular-nums text-gray-900">{meta.format(val)}</strong>
        </div>
        {delta !== null && (
          <div
            className={`mt-1 text-[11px] ${delta >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}
          >
            {delta >= 0 ? '+' : ''}
            {delta}% к прошлому месяцу
          </div>
        )}
        {isGmv && (
          <div className="mt-1 text-[11px] text-violet-600">
            {Math.round((row.gmv / row.adGmv) * 1000) / 10}% от рекл. GMV
          </div>
        )}
      </div>
    );
  };

  const axes = (
    <>
      <CartesianGrid stroke="#F3F4F6" vertical={false} />
      <XAxis
        dataKey="month"
        axisLine={false}
        tickLine={false}
        interval={series.length > 10 ? 'preserveStartEnd' : 0}
        minTickGap={series.length > 14 ? 28 : 8}
        tick={{ fontSize: 11, fill: '#6B7280' }}
      />
      <YAxis
        axisLine={false}
        tickLine={false}
        tick={{ fontSize: 10, fill: '#9CA3AF' }}
        width={isGmv ? 40 : 32}
        tickFormatter={yFmt}
      />
      <Tooltip cursor={{ stroke: '#E5E7EB', strokeWidth: 1 }} content={tooltip} />
    </>
  );

  const chart = (
    <AreaChart data={series} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id={areaGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9A41FE" stopOpacity={0.28} />
          <stop offset="100%" stopColor="#9A41FE" stopOpacity={0} />
        </linearGradient>
      </defs>
      {axes}
      <Area
        type="monotone"
        dataKey="value"
        stroke="#9A41FE"
        strokeWidth={2.5}
        fill={`url(#${areaGradId})`}
        dot={{ r: 3, fill: '#9A41FE', strokeWidth: 0 }}
        activeDot={{ r: 4, fill: '#9A41FE', stroke: '#fff', strokeWidth: 2 }}
      />
    </AreaChart>
  );

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-gray-800">
            {onTitleClick ? (
              <button
                type="button"
                onClick={onTitleClick}
                className={
                  titleClassName ??
                  'text-left transition-colors hover:text-[#9A41FE] hover:underline'
                }
              >
                {displayTitle}
              </button>
            ) : (
              <span className={titleClassName}>{displayTitle}</span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums text-gray-950">
              {meta.format(value)}
            </span>
            {meta.unit && <span className="text-xs text-gray-400">{meta.unit}</span>}
            <TrendBadge value={`${up ? '+' : '−'}${Math.abs(mom)}%`} up={up} />
          </div>
          {shareOfAd !== null && (
            <div className="mt-1 text-[11px] text-gray-500">
              {shareOfAd}% от рекламного GMV · доп. прибыль сверх рекламных заказов
            </div>
          )}
          {metricKey === 'clients' && (
            <div className="mt-1.5 text-[11px] leading-4 text-gray-600">
              <span className="font-medium text-gray-800">Доля вернувшихся покупателей</span>
              <span className="tabular-nums text-gray-700">
                {' '}
                · {RETURNED_BUYERS_SHARE.pct}%
              </span>
              <span className="text-gray-500"> от привлечённых рекламой</span>
            </div>
          )}
          {metricKey === 'orders' && (
            <div className="mt-2 rounded-lg bg-gray-50 px-2.5 py-1.5 text-[11px] leading-4 text-gray-700">
              <span className="font-medium">Больше всего повторок:</span>{' '}
              {TOP_ORGANIC_REPEAT_PRODUCT.name}
              <span className="text-gray-500">
                {' '}
                · {fmt(TOP_ORGANIC_REPEAT_PRODUCT.orders)} зак. (
                {TOP_ORGANIC_REPEAT_PRODUCT.sharePct}% от орг. заказов)
              </span>
            </div>
          )}
        </div>
      </div>

      {!compact && (
        <div className={`mt-3 ${chartHeightClass}`}>
          <ResponsiveContainer width="100%" height="100%">
            {chart}
          </ResponsiveContainer>
        </div>
      )}
    </>
  );

  if (embedded) {
    return <div className="min-w-0 h-full">{body}</div>;
  }

  return <section className="flex h-full flex-col rounded-2xl bg-white p-4">{body}</section>;
}

const MONTH_SHORT: Record<string, string> = {
  Январь: 'Янв',
  Февраль: 'Фев',
  Март: 'Мар',
  Апрель: 'Апр',
  Май: 'Май',
  Июнь: 'Июн',
  Июль: 'Июл',
  Август: 'Авг',
  Сентябрь: 'Сен',
  Октябрь: 'Окт',
  Ноябрь: 'Ноя',
  Декабрь: 'Дек',
};

function getDaysToOrganicSeries(range: StatsRangeId, grain: StatsGrainId = 'day') {
  const monthly = getStackSeriesForRange(range).map((r) => {
    const short = MONTH_SHORT[r.month] ?? r.month;
    const axis = short.toLowerCase();
    return {
      month: short,
      axisLabel: axis,
      dateLabel: axis,
      tipLabel: r.month,
      avgDays: r.avgDays,
      peakMonths: r.peakMonths,
    };
  });

  if (grain === 'month' && range !== 'week' && range !== 'twoWeeks') {
    return monthly;
  }

  const seriesGrain: StatsGrainId =
    range === 'week' || range === 'twoWeeks' ? 'day' : grain;
  const n = Math.max(1, organicPointCount(range, seriesGrain));
  const dates = sparkDatesForRange(range, n, seriesGrain);
  const baseAvg = monthly.length
    ? monthly.reduce((s, r) => s + r.avgDays, 0) / monthly.length
    : 18;

  return dates.map((date, i) => {
    const wave = 0.78 + 0.36 * Math.sin((i / Math.max(n - 1, 1)) * Math.PI * 1.35);
    const prevDate = i > 0 ? dates[i - 1] : null;
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
    const dateLabel =
      seriesGrain === 'day' && (range === 'today' || range === 'yesterday')
        ? `${String(date.getHours()).padStart(2, '0')}:00`
        : formatDayPill(date);
    return {
      month: key,
      axisLabel: organicAxisLabel(date, prevDate, range, seriesGrain),
      dateLabel,
      tipLabel: formatOrganicTooltipLabel(date, seriesGrain, range),
      avgDays: Math.max(1, Math.round(baseAvg * wave)),
      peakMonths: '',
    };
  });
}

/**
 * Главный блок: отвечает на вопросы продавца про органику после рекламы.
 * Лучший график — стек «рекламный GMV → органический возврат» (объём + доля ~5% + срок).
 */
function OrganicReturnStoryBlock() {
  const range = useStatsRange();
  const grain = useStatsGrain();
  const stack = useMemo(() => getStackSeriesForRange(range), [range]);
  const organic = useMemo(() => getOrganicReturnSeries(range, grain), [range, grain]);
  const days = useMemo(() => getDaysToOrganicSeries(range, grain), [range, grain]);

  const totalAdGmv = stack.reduce((s, r) => s + r.adGmv, 0);
  const totalOrganic = stack.reduce((s, r) => s + r.organic, 0);
  const shareOfAd = totalAdGmv ? Math.round((totalOrganic / totalAdGmv) * 1000) / 10 : 0;
  const avgDays = days.length
    ? Math.round(days.reduce((s, r) => s + r.avgDays, 0) / days.length)
    : 0;
  const totalClients = organic.reduce((s, r) => s + r.clients, 0);
  const totalOrders = organic.reduce((s, r) => s + r.orders, 0);

  const lastOrg = organic[organic.length - 1];
  const prevOrg = organic.length > 1 ? organic[organic.length - 2] : lastOrg;
  const gmvMom = lastOrg && prevOrg ? momPct(lastOrg.gmv, prevOrg.gmv) : 0;
  const lastDays = days[days.length - 1]?.avgDays ?? avgDays;
  const prevDays = days.length > 1 ? days[days.length - 2].avgDays : lastDays;
  const daysMom = momPct(lastDays, prevDays);

  const shareOk = shareOfAd >= 4 && shareOfAd <= 6;
  const daysOk = avgDays <= 45;

  const chartData = stack.map((r) => ({
    ...r,
    month: MONTH_SHORT[r.month] ?? r.month,
  }));

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <h2 className="text-base font-semibold text-gray-900">
            Органика после рекламы — главные ответы
          </h2>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            Реклама должна окупаться своими заказами. Ниже — сколько потом ещё пришло без ставки:
            это дополнительная прибыль, а не «оплата» рекламы · {STATS_RANGE_LABELS[range]}
          </p>
        </div>
        <Tip text="Рекламу оценивайте по заказам с продвижением. Органический возврат — бонус: тот же покупатель позже купил без ставки." />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-emerald-50/80 px-4 py-3">
          <div className="text-[11px] font-medium text-emerald-800">
            1. Сколько доп. выручки без ставки?
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-bold tabular-nums text-emerald-950">
              {fmtRubShort(totalOrganic)}
            </span>
            <TrendBadge
              value={`${gmvMom >= 0 ? '+' : '−'}${Math.abs(gmvMom)}%`}
              up={gmvMom >= 0}
            />
          </div>
          <p className="mt-1 text-[11px] text-emerald-700/80">
            бонус поверх окупаемости рекламы
          </p>
        </div>

        <div className="rounded-xl bg-sky-50/80 px-4 py-3">
          <div className="text-[11px] font-medium text-sky-800">2. Это много или мало?</div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-bold tabular-nums text-sky-950">{shareOfAd}%</span>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                shareOk ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {shareOk ? 'в норме' : shareOfAd < 4 ? 'ниже ориентира' : 'выше ориентира'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-sky-700/80">
            Из 100 ₽ продаж с рекламы потом ещё ≈{shareOfAd} ₽ приходит само
          </p>
        </div>

        <div className="rounded-xl bg-violet-50/80 px-4 py-3">
          <div className="text-[11px] font-medium text-violet-800">
            3. Кто и сколько раз вернулся?
          </div>
          <div className="mt-1.5 text-xl font-bold tabular-nums text-violet-950">
            {fmt(totalClients)}{' '}
            <span className="text-sm font-semibold text-violet-600">чел.</span>
            <span className="mx-1.5 text-violet-300">·</span>
            {fmt(totalOrders)}{' '}
            <span className="text-sm font-semibold text-violet-600">зак.</span>
          </div>
          <p className="mt-1 text-[11px] text-violet-700/80">
            клиенты и их повторные органические заказы
          </p>
        </div>

        <div className="rounded-xl bg-gray-50 px-4 py-3">
          <div className="text-[11px] font-medium text-gray-700">
            4. Как быстро возвращаются?
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-bold tabular-nums text-gray-950">{avgDays} дн.</span>
            <TrendBadge
              value={`${daysMom > 0 ? '+' : '−'}${Math.abs(daysMom)}%`}
              up={daysMom <= 0}
            />
          </div>
          <p className="mt-1 text-[11px] text-gray-500">
            {daysOk ? 'нормальный темп' : 'долго — можно ускорить'} · до 1-го орг. заказа
            <br />
            <span className="text-gray-400">чем короче — тем быстрее доп. прибыль без ставки</span>
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2">
          <h3 className="text-sm font-semibold text-gray-900">
            Рекламный GMV → органический возврат
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Синий — заказы с рекламы, зелёный сверху — те же покупатели без ставки (~5%)
          </p>
        </div>

        <div className="h-[280px] rounded-xl bg-[#F7F8FA] px-2 py-3">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
              barCategoryGap="18%"
            >
              <CartesianGrid stroke="#E5E7EB" vertical={false} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                interval={0}
                tick={{ fontSize: 11, fill: '#6B7280' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                tickFormatter={(v) => `${Math.round(v / 1_000_000)} млн`}
                width={44}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.[0]) return null;
                  const row = payload[0].payload as (typeof chartData)[number];
                  const share = row.adGmv
                    ? Math.round((row.organic / row.adGmv) * 1000) / 10
                    : 0;
                  return (
                    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs shadow-lg">
                      <div className="font-semibold text-gray-900">{label}</div>
                      <div className="mt-2 space-y-1 text-gray-600">
                        <div className="flex justify-between gap-8">
                          <span>Рекламный GMV</span>
                          <strong className="tabular-nums">{fmtRubShort(row.adGmv)}</strong>
                        </div>
                        <div className="flex justify-between gap-8">
                          <span className="text-emerald-700">Органический возврат</span>
                          <strong className="tabular-nums text-emerald-800">
                            {fmtRubShort(row.organic)}
                          </strong>
                        </div>
                        <div className="flex justify-between gap-8 border-t border-gray-100 pt-1">
                          <span>Доля</span>
                          <strong className="tabular-nums">{share}%</strong>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="adGmv"
                name="Рекламный GMV"
                stackId="stack"
                fill="#4C8BF5"
                maxBarSize={40}
              />
              <Bar
                dataKey="organic"
                name="Органический возврат"
                stackId="stack"
                fill="#7CB342"
                radius={[3, 3, 0, 0]}
                maxBarSize={40}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-5 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#4C8BF5]" />
            Рекламный GMV
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#7CB342]" />
            Органический возврат
          </span>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50/90 px-4 py-3.5">
        <div className="text-xs font-semibold text-gray-900">5. Что делать с этим?</div>
        <p className="mt-1 text-[11px] text-gray-500">
          Рекламу крутите по своим заказам. Органика ниже — как вырастить доп. прибыль без ставки.
        </p>
        <div className="mt-2.5 grid gap-3 sm:grid-cols-3">
          <div className="text-[11px] leading-4 text-gray-600">
            <span className="font-medium text-gray-800">Если доля &lt; 5%</span>
            <br />
            Усильте возврат: reminder 7–14 дней, бонус на второй заказ, связки SKU.
          </div>
          <div className="text-[11px] leading-4 text-gray-600">
            <span className="font-medium text-gray-800">Если срок &gt; 45 дней</span>
            <br />
            Ускорьте вторую покупку: комплекты, расходники, качество первой доставки.
          </div>
          <div className="text-[11px] leading-4 text-gray-600">
            <span className="font-medium text-gray-800">Если растёт вместе с рекламой</span>
            <br />
            Не режьте бюджет рано: пик органики часто на 2–3 месяце — это ещё плюс к прибыли.
          </div>
        </div>
      </div>
    </section>
  );
}

/** Три графика + сводные карточки (заказы на человека, срок возврата) */
function useOrganicReturnInsights() {
  const range = useStatsRange();
  const grain = useStatsGrain();
  const warehouseScope = useStatsWarehouseScope();
  const fx = WAREHOUSE_SCOPE_FX[warehouseScope];

  const source = useMemo(() => {
    const base = getOrganicReturnSeries(range, grain);
    if (fx.quality === 0) return base;
    return base.map((row) => ({
      ...row,
      adGmv: Math.round(row.adGmv * fx.orders),
      gmv: Math.round(row.gmv * fx.organic),
      clients: Math.max(1, Math.round(row.clients * fx.clients)),
      orders: Math.max(1, Math.round(row.orders * fx.organic)),
    }));
  }, [range, grain, fx]);

  const days = useMemo(() => {
    const base = getDaysToOrganicSeries(range, grain);
    if (fx.quality === 0) return base;
    return base.map((row) => ({
      ...row,
      avgDays: Math.max(1, Math.round(row.avgDays * fx.days)),
    }));
  }, [range, grain, fx]);

  // Не sum(orders)/sum(clients): в моке у каждой точки один и тот же коэффициент,
  // а уникальные клиенты на длинном окне растут медленнее заказов.
  const ordersPerClient = Math.round(ordersPerClientForRange(range) * (fx.organic / Math.max(fx.clients, 0.01)) * 100) / 100;

  const avgOpc = (rows: typeof source) => {
    const orders = rows.reduce((s, row) => s + row.orders, 0);
    const clients = rows.reduce((s, row) => s + row.clients, 0);
    return clients > 0 ? orders / clients : ordersPerClient;
  };
  const opcHalf = Math.max(1, Math.floor(source.length / 2));
  const earlierOpc = avgOpc(source.slice(0, opcHalf));
  const recentOpc = avgOpc(source.slice(opcHalf));
  let opcMom = momPct(recentOpc, earlierOpc || recentOpc);
  if (fx.quality === 1) opcMom = Math.abs(opcMom) + 4;
  if (fx.quality === -1) opcMom = -(Math.abs(opcMom) + 6);
  if (opcMom === 0 && source.length > 1) opcMom = 3;

  const avgDays = days.length
    ? Math.round(days.reduce((s, r) => s + r.avgDays, 0) / days.length)
    : 0;
  const daysHalf = Math.max(1, Math.floor(days.length / 2));
  const earlierDays =
    days.slice(0, daysHalf).reduce((s, r) => s + r.avgDays, 0) / Math.max(daysHalf, 1);
  const recentDays =
    days.slice(daysHalf).reduce((s, r) => s + r.avgDays, 0) /
    Math.max(days.length - daysHalf, 1);
  let daysMom = momPct(recentDays, earlierDays || recentDays);
  if (fx.quality === 1) daysMom = -(Math.abs(daysMom) + 5);
  if (fx.quality === -1) daysMom = Math.abs(daysMom) + 9;
  if (daysMom === 0 && days.length > 1) daysMom = -4;
  const daysOk = avgDays <= 45;
  const opcLabel = ordersPerClient.toFixed(2).replace('.', ',');

  return { source, opcLabel, opcMom, avgDays, daysMom, daysOk };
}

function OrganicReturnInsightCards({
  opcLabel,
  opcMom,
  avgDays,
  daysMom,
  daysOk,
  className = 'grid gap-3 sm:grid-cols-2 xl:grid-cols-4',
}: {
  opcLabel: string;
  opcMom: number;
  avgDays: number;
  daysMom: number;
  daysOk: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="rounded-2xl bg-white p-4">
        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
          <span className="h-2 w-2 shrink-0 rounded-full bg-violet-500" />
          Повторных органических заказов на человека
        </div>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
          <span className="text-2xl font-bold tabular-nums text-gray-950">{opcLabel}</span>
          <span className="text-xs text-gray-400">зак. / чел.</span>
          <TrendBadge
            value={`${opcMom >= 0 ? '+' : '−'}${Math.abs(opcMom)}%`}
            up={opcMom >= 0}
          />
        </div>
        <p className="mt-2 text-[11px] leading-4 text-gray-500">
          сколько раз в среднем возвращается клиент после продвижения
        </p>
      </div>

      <div className="rounded-2xl bg-white p-4">
        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
          <span className="h-2 w-2 shrink-0 rounded-full bg-gray-500" />
          От продвижения до первой органической покупки
        </div>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
          <span className="text-2xl font-bold tabular-nums text-gray-950">{avgDays}</span>
          <span className="text-xs text-gray-400">дн.</span>
          <TrendBadge
            value={`${daysMom > 0 ? '+' : '−'}${Math.abs(daysMom)}%`}
            up={daysMom <= 0}
          />
        </div>
        <p className="mt-2 text-[11px] leading-4 text-gray-500">
          {daysOk ? 'нормальный темп' : 'долго'} · до 1-го орг. заказа
          <br />
          <span className="text-gray-400">чем короче — тем быстрее доп. прибыль без ставки</span>
        </p>
      </div>
    </div>
  );
}

/**
 * Блок «Вернувшиеся покупатели»: KPI-карточки по 2 в ряд, у каждой свой график.
 */
type ReturnFocusMetricId = 'gmv' | 'clients' | 'opc' | 'orders' | 'days';

const PEOPLE_FUNNEL_COLORS = [
  '#A9A5E8',
  '#7C4DFF',
  '#E84393',
  '#2EC4B6',
  '#3B82F6',
  '#F5A623',
];

/** Воронка людей: столбцы по убыванию, как в референсе. */
function getReturnPeopleFunnel(
  range: StatsRangeId,
  scope: StatsWarehouseScopeId,
): Array<{ name: string; shortName: string; value: number; fill: string }> {
  const fx = WAREHOUSE_SCOPE_FX[scope];
  const baseByRange: Record<
    StatsRangeId,
    {
      reached: number;
      clicked: number;
      firstBuy: number;
      returned: number;
      organic: number;
      organicMulti: number;
    }
  > = {
    // firstBuy ≈ сумма заказов / AOV; returned ≈ 23%; organic ⊂ returned
    today: { reached: 105, clicked: 58, firstBuy: 23, returned: 5, organic: 4, organicMulti: 2 },
    yesterday: { reached: 98, clicked: 52, firstBuy: 21, returned: 5, organic: 3, organicMulti: 1 },
    week: { reached: 710, clicked: 405, firstBuy: 146, returned: 34, organic: 24, organicMulti: 10 },
    twoWeeks: { reached: 1320, clicked: 750, firstBuy: 278, returned: 64, organic: 44, organicMulti: 18 },
    month: { reached: 3120, clicked: 1780, firstBuy: 636, returned: 146, organic: 98, organicMulti: 42 },
    quarter: { reached: 9000, clicked: 5120, firstBuy: 1850, returned: 426, organic: 280, organicMulti: 118 },
    halfYear: { reached: 17200, clicked: 9800, firstBuy: 3550, returned: 816, organic: 540, organicMulti: 228 },
    year: { reached: 34800, clicked: 19800, firstBuy: 7137, returned: 1642, organic: 1080, organicMulti: 456 },
    custom: { reached: 1860, clicked: 1060, firstBuy: 403, returned: 93, organic: 62, organicMulti: 26 },
  };
  const b = baseByRange[range] ?? baseByRange.week;
  const steps = [
    {
      name: 'Контакт с рекламой',
      shortName: 'Контакт',
      value: Math.max(1, Math.round(b.reached * fx.clients)),
    },
    {
      name: 'Перешли по рекламе',
      shortName: 'Переход',
      value: Math.max(1, Math.round(b.clicked * fx.clients)),
    },
    {
      name: 'Первый заказ с рекламы',
      shortName: '1-й заказ',
      value: Math.max(1, Math.round(b.firstBuy * fx.clients)),
    },
    {
      name: 'Повторная покупка',
      shortName: 'Повтор',
      value: Math.max(1, Math.round(b.returned * fx.clients)),
    },
    {
      name: 'Повтор без ставки',
      shortName: 'Без ставки',
      value: Math.max(1, Math.round(b.organic * fx.organic)),
    },
    {
      name: '2+ орг. заказа',
      shortName: '2+ орг.',
      value: Math.max(1, Math.round(b.organicMulti * fx.organic)),
    },
  ];
  return steps.map((step, i) => ({
    ...step,
    fill: PEOPLE_FUNNEL_COLORS[i] ?? PEOPLE_FUNNEL_COLORS[PEOPLE_FUNNEL_COLORS.length - 1],
  }));
}

function OrganicReturnPeopleFunnel() {
  const range = useStatsRange();
  const warehouseScope = useStatsWarehouseScope();
  const data = useMemo(
    () => getReturnPeopleFunnel(range, warehouseScope),
    [range, warehouseScope],
  );

  const conversions = data.slice(1).map((step, i) => {
    const prev = data[i].value;
    const pct = prev > 0 ? Math.round((step.value / prev) * 1000) / 10 : 0;
    return { from: data[i].name, to: step.name, pct, count: step.value };
  });

  return (
    <section className="rounded-2xl border border-gray-200 bg-white px-5 py-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Воронка по людям</h2>
          <p className="mt-1 text-sm text-gray-500">
            Сколько человек доходит от рекламы до органического возврата ·{' '}
            {STATS_RANGE_LABELS[range]}
          </p>
        </div>
        <div className="text-right text-xs text-gray-500">
          <div className="font-medium tabular-nums text-gray-900">
            {fmt(data[data.length - 1]?.value ?? 0)} чел. с 2+ орг. заказами
          </div>
          <div>
            из {fmt(data[0]?.value ?? 0)} с контактом (
            {data[0]?.value
              ? Math.round(((data[data.length - 1]?.value ?? 0) / data[0].value) * 1000) / 10
              : 0}
            %)
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(220px,0.65fr)]">
        <div className="h-[300px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 12, right: 8, left: 4, bottom: 8 }} barCategoryGap="18%">
              <CartesianGrid stroke="#E8EAEE" vertical={false} />
              <XAxis
                dataKey="shortName"
                axisLine={false}
                tickLine={false}
                interval={0}
                tick={{ fontSize: 11, fill: '#6B7280' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={40}
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                tickFormatter={(v: number) => fmt(v)}
              />
              <Tooltip
                cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }}
                formatter={(value: number) => [`${fmt(value)} чел.`, 'Люди']}
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as { name?: string } | undefined;
                  return row?.name ?? '';
                }}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #E5E7EB',
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" radius={[10, 10, 0, 0]} maxBarSize={88} isAnimationActive={false}>
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col justify-center gap-2">
          {conversions.map((c) => (
            <div key={c.to} className="rounded-xl bg-[#F3F5F8] px-3.5 py-2">
              <div className="text-[11px] leading-4 text-gray-500">
                {c.from} → {c.to}
              </div>
              <div className="mt-0.5 flex items-baseline gap-2">
                <span className="text-base font-bold tabular-nums text-gray-950">
                  {String(c.pct).replace('.', ',')}%
                </span>
                <span className="text-xs tabular-nums text-gray-500">{fmt(c.count)} чел.</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

type ReturnFocusChartVariant = 'area' | 'bar' | 'line' | 'line-step';

type ReturnFocusSeriesPoint = {
  month: string;
  value: number;
  /** Покупатели — вторая серия на графике заказов */
  clientsValue?: number;
  tipLabel?: string;
  axisLabel?: string;
  dateLabel?: string;
};

function OrganicReturnFocusMiniChart({
  variant,
  series,
  valueFormat,
  axisFormat,
  unit,
}: {
  variant: ReturnFocusChartVariant;
  series: ReturnFocusSeriesPoint[];
  valueFormat: (n: number) => string;
  axisFormat?: (n: number) => string;
  unit?: string;
}) {
  const tickFormat = axisFormat ?? valueFormat;
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showOrders, setShowOrders] = useState(true);
  const [showClients, setShowClients] = useState(true);
  const hoverRow = hoverIndex != null ? series[hoverIndex] : null;
  const datePill = hoverRow?.dateLabel ?? null;
  const hasClientsSeries = variant === 'bar' && series.some((row) => row.clientsValue != null);
  const organicTotal = useMemo(
    () => series.reduce((s, row) => s + row.value, 0),
    [series],
  );
  const clientsTotal = useMemo(
    () => series.reduce((s, row) => s + (row.clientsValue ?? 0), 0),
    [series],
  );
  const monthTicks = useMemo(
    () => series.filter((row) => row.axisLabel).map((row) => row.month),
    [series],
  );
  const axisByKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of series) {
      if (row.axisLabel) map.set(row.month, row.axisLabel);
    }
    return map;
  }, [series]);

  const toggleOrders = () => {
    setShowOrders((prev) => {
      if (prev && !showClients) return prev;
      return !prev;
    });
  };
  const toggleClients = () => {
    setShowClients((prev) => {
      if (prev && !showOrders) return prev;
      return !prev;
    });
  };

  const onMouseMove = (state: {
    activeTooltipIndex?: number | string | null;
    activeCoordinate?: { x?: number; y?: number } | null;
  }) => {
    if (state?.activeTooltipIndex == null || state.activeCoordinate?.x == null) {
      setHoverX(null);
      setHoverIndex(null);
      return;
    }
    setHoverIndex(Number(state.activeTooltipIndex));
    setHoverX(state.activeCoordinate.x);
  };

  const onMouseLeave = () => {
    setHoverX(null);
    setHoverIndex(null);
  };

  const xAxis = (
    <XAxis
      dataKey="month"
      axisLine={false}
      tickLine={false}
      ticks={monthTicks}
      height={22}
      tick={{ fontSize: 11, fill: '#9CA3AF' }}
      tickFormatter={(value: string) => axisByKey.get(value) ?? ''}
    />
  );

  const yAxis = (
    <YAxis
      axisLine={false}
      tickLine={false}
      width={36}
      allowDecimals={variant === 'line' || variant === 'line-step' || variant === 'area'}
      tick={{ fontSize: 10, fill: '#9CA3AF' }}
      tickFormatter={tickFormat}
    />
  );

  const tip = (
    <Tooltip
      cursor={
        variant === 'bar'
          ? { fill: 'rgba(15, 23, 42, 0.04)' }
          : { stroke: '#E5E7EB', strokeWidth: 1 }
      }
      content={({ active, label }) => {
        if (!active) return null;
        const row = series.find((m) => m.month === label);
        if (!row) return null;
        return (
          <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg">
            <div className="font-semibold text-gray-900">{row.tipLabel ?? label}</div>
            {hasClientsSeries && row.clientsValue != null ? (
              <div className="mt-1.5 flex flex-col gap-1 text-gray-600">
                {showOrders && (
                  <div className="flex items-center justify-between gap-6">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-sm bg-[#9A41FE]" />
                      Заказы
                    </span>
                    <strong className="tabular-nums text-gray-900">
                      {valueFormat(row.value)} зак.
                    </strong>
                  </div>
                )}
                {showClients && (
                  <div className="flex items-center justify-between gap-6">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-sm bg-[#2563EB]" />
                      Покупатели
                    </span>
                    <strong className="tabular-nums text-gray-900">
                      {ORGANIC_METRIC_META.clients.format(row.clientsValue)} чел.
                    </strong>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-1 tabular-nums text-gray-900">
                {valueFormat(row.value)}
                {unit ? ` ${unit}` : ''}
              </div>
            )}
          </div>
        );
      }}
    />
  );

  const chart =
    variant === 'area' ? (
      <AreaChart
        data={series}
        margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        <defs>
          <linearGradient id="organic-gmv-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9A41FE" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#9A41FE" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#F3F4F6" vertical={false} />
        {xAxis}
        {yAxis}
        {tip}
        <Area
          type="linear"
          dataKey="value"
          stroke="#9A41FE"
          strokeWidth={2}
          fill="url(#organic-gmv-fill)"
          dot={false}
          activeDot={{ r: 4, fill: '#9A41FE', stroke: '#fff', strokeWidth: 2 }}
        />
      </AreaChart>
    ) : variant === 'bar' ? (
      hasClientsSeries ? (
        <BarChart
          data={series}
          margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          barCategoryGap="28%"
          barGap={3}
        >
          <CartesianGrid stroke="#F3F4F6" vertical={false} />
          {xAxis}
          {yAxis}
          {tip}
          {showOrders && (
            <Bar
              dataKey="value"
              name="Заказы"
              fill="#9A41FE"
              radius={[5, 5, 0, 0]}
              maxBarSize={28}
              isAnimationActive={false}
            >
              {series.map((row, i) => (
                <Cell
                  key={`orders-${row.month}`}
                  fill="#9A41FE"
                  fillOpacity={hoverIndex == null || hoverIndex === i ? 1 : 0.28}
                />
              ))}
            </Bar>
          )}
          {showClients && (
            <Bar
              dataKey="clientsValue"
              name="Покупатели"
              fill="#2563EB"
              radius={[5, 5, 0, 0]}
              maxBarSize={28}
              isAnimationActive={false}
            >
              {series.map((row, i) => (
                <Cell
                  key={`clients-${row.month}`}
                  fill="#2563EB"
                  fillOpacity={hoverIndex == null || hoverIndex === i ? 1 : 0.28}
                />
              ))}
            </Bar>
          )}
        </BarChart>
      ) : (
        <BarChart
          data={series}
          margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          barCategoryGap="22%"
        >
          <CartesianGrid stroke="#F3F4F6" vertical={false} />
          {xAxis}
          {yAxis}
          {tip}
          <Bar
            dataKey="value"
            fill="#9A41FE"
            radius={[6, 6, 0, 0]}
            maxBarSize={36}
            isAnimationActive={false}
          >
            {series.map((row, i) => (
              <Cell
                key={`bar-${row.month}`}
                fill="#9A41FE"
                fillOpacity={hoverIndex == null || hoverIndex === i ? 1 : 0.28}
              />
            ))}
          </Bar>
        </BarChart>
      )
    ) : (
      <LineChart
        data={series}
        margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        <CartesianGrid stroke="#F3F4F6" vertical={false} />
        {xAxis}
        {yAxis}
        {tip}
        <Line
          type={variant === 'line-step' ? 'stepAfter' : 'linear'}
          dataKey="value"
          stroke="#9A41FE"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#9A41FE', stroke: '#fff', strokeWidth: 2 }}
        />
      </LineChart>
    );

  return (
    <div className="mt-3 w-full">
      <div className="relative h-[168px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chart}
        </ResponsiveContainer>
        {hoverX != null && datePill && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-md bg-[#2C2C2E] px-1.5 py-[3px] text-[11px] font-medium leading-none text-white tabular-nums shadow-sm"
            style={{ left: hoverX, bottom: 2 }}
          >
            {datePill}
          </div>
        )}
      </div>
      {hasClientsSeries && (
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px] text-gray-600">
          <button
            type="button"
            onClick={toggleOrders}
            className={`inline-flex items-center gap-1.5 rounded-md transition-opacity ${
              showOrders ? 'opacity-100' : 'opacity-45'
            }`}
          >
            <span
              className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded-[3px] ${
                showOrders ? 'bg-[#9A41FE] text-white' : 'border border-gray-300 bg-white text-transparent'
              }`}
            >
              <Check className="h-2.5 w-2.5" />
            </span>
            <span>Заказы</span>
            <span className="font-semibold tabular-nums text-gray-900">
              {valueFormat(organicTotal)} зак.
            </span>
          </button>
          <button
            type="button"
            onClick={toggleClients}
            className={`inline-flex items-center gap-1.5 rounded-md transition-opacity ${
              showClients ? 'opacity-100' : 'opacity-45'
            }`}
          >
            <span
              className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded-[3px] ${
                showClients ? 'bg-[#2563EB] text-white' : 'border border-gray-300 bg-white text-transparent'
              }`}
            >
              <Check className="h-2.5 w-2.5" />
            </span>
            <span>Покупатели</span>
            <span className="font-semibold tabular-nums text-gray-900">
              {ORGANIC_METRIC_META.clients.format(clientsTotal)} чел.
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

function OrganicReturnDynamicsBlockV2({
  showVariantLabel = true,
  layout = 'grid',
}: {
  showVariantLabel?: boolean;
  layout?: 'grid' | 'stack';
} = {}) {
  const navigate = useNavigate();
  const range = useStatsRange();
  const grain = useStatsGrain();
  const { source, opcLabel, opcMom, avgDays, daysMom } = useOrganicReturnInsights();
  const daysSeries = useMemo(() => getDaysToOrganicSeries(range, grain), [range, grain]);

  const opcChartSeries = useMemo(
    () =>
      source.map((row) => ({
        month: row.month,
        tipLabel: row.tipLabel,
        axisLabel: row.axisLabel,
        dateLabel: row.dateLabel,
        value:
          row.clients > 0 ? Math.round((row.orders / row.clients) * 100) / 100 : 0,
      })),
    [source],
  );

  const daysChartSeries = useMemo(
    () =>
      daysSeries.map((row) => ({
        month: row.month,
        tipLabel: row.tipLabel,
        axisLabel: row.axisLabel,
        dateLabel: row.dateLabel,
        value: row.avgDays,
      })),
    [daysSeries],
  );

  const showSectionTitle = layout === 'grid';
  const metricsFilter = layout === 'grid' ? 'gmv' : 'all';

  return (
    <OrganicReturnFocusBlock
      showVariantLabel={showVariantLabel}
      showSectionTitle={showSectionTitle}
      metricsFilter={metricsFilter}
      range={range}
      grain={grain}
      source={source}
      opcLabel={opcLabel}
      opcMom={opcMom}
      avgDays={avgDays}
      daysMom={daysMom}
      opcChartSeries={opcChartSeries}
      daysChartSeries={daysChartSeries}
      onOpenAllMetrics={() => navigate('/stats/return')}
    />
  );
}

function OrganicReturnFocusBlock({
  showVariantLabel,
  showSectionTitle = false,
  metricsFilter = 'all',
  range,
  grain,
  source,
  opcLabel,
  opcMom,
  avgDays,
  daysMom,
  opcChartSeries,
  daysChartSeries,
  onOpenAllMetrics,
}: {
  showVariantLabel: boolean;
  showSectionTitle?: boolean;
  metricsFilter?: 'gmv' | 'all';
  range: StatsRangeId;
  grain: StatsGrainId;
  source: ReturnType<typeof getOrganicReturnSeries>;
  opcLabel: string;
  opcMom: number;
  avgDays: number;
  daysMom: number;
  opcChartSeries: Array<{
    month: string;
    value: number;
    tipLabel?: string;
    axisLabel?: string;
    dateLabel?: string;
  }>;
  daysChartSeries: Array<{
    month: string;
    value: number;
    tipLabel?: string;
    axisLabel?: string;
    dateLabel?: string;
  }>;
  onOpenAllMetrics?: () => void;
}) {
  const warehouseScope = useStatsWarehouseScope();
  const fx = WAREHOUSE_SCOPE_FX[warehouseScope];

  /** Сумма за выбранный период (не последняя точка графика). */
  const periodAdGmv = source.reduce((s, row) => s + row.adGmv, 0);
  const periodGmv = source.reduce((s, row) => s + row.gmv, 0);
  const periodOrders = source.reduce((s, row) => s + row.orders, 0);
  // Уникальные клиенты ≠ сумма дневных; оценка из заказов и частоты за окно.
  const opcForRange = ordersPerClientForRange(range);
  const periodClients = Math.max(1, Math.round(periodOrders / Math.max(opcForRange, 0.01)));

  const half = Math.max(1, Math.floor(source.length / 2));
  const earlierGmv = source.slice(0, half).reduce((s, row) => s + row.gmv, 0);
  const recentGmv = source.slice(half).reduce((s, row) => s + row.gmv, 0);
  const earlierOrders = source.slice(0, half).reduce((s, row) => s + row.orders, 0);
  const recentOrders = source.slice(half).reduce((s, row) => s + row.orders, 0);
  const earlierClients = Math.max(1, Math.round(earlierOrders / Math.max(opcForRange, 0.01)));
  const recentClients = Math.max(1, Math.round(recentOrders / Math.max(opcForRange, 0.01)));

  let gmvMom = momPct(recentGmv, earlierGmv || recentGmv);
  let clientsMom = momPct(recentClients, earlierClients || recentClients);
  if (fx.quality === 1) {
    gmvMom = Math.abs(gmvMom) + 9;
    clientsMom = Math.abs(clientsMom) + 7;
  } else if (fx.quality === -1) {
    gmvMom = -(Math.abs(gmvMom) + 14);
    clientsMom = -(Math.abs(clientsMom) + 11);
  }
  const shareOfAd = periodAdGmv ? Math.round((periodGmv / periodAdGmv) * 1000) / 10 : 5;
  /** Доля вернувшихся = вернувшиеся / привлечённые с рекламы (AOV ≈ средний чек). */
  const acquiredBuyers = Math.max(1, Math.round(periodAdGmv / ORGANIC_RETURN_AOV));
  const returnedBuyers = Math.max(
    1,
    Math.round(
      acquiredBuyers *
        (RETURNED_BUYERS_SHARE.pct / 100) *
        (fx.clients / Math.max(fx.orders, 0.01)) *
        (fx.quality === -1 ? 0.7 : fx.quality === 1 ? 1.25 : 1),
    ),
  );
  const returnedSharePct = Math.round((returnedBuyers / acquiredBuyers) * 1000) / 10;

  const gmvSeries = useMemo(
    () =>
      source.map((row) => ({
        month: row.month,
        value: row.gmv,
        tipLabel: row.tipLabel,
        axisLabel: row.axisLabel,
        dateLabel: row.dateLabel,
      })),
    [source],
  );
  const ordersSeries = useMemo(
    () =>
      source.map((row) => ({
        month: row.month,
        value: row.orders,
        clientsValue: row.clients,
        tipLabel: row.tipLabel,
        axisLabel: row.axisLabel,
        dateLabel: row.dateLabel,
      })),
    [source],
  );

  let ordersMom = momPct(recentOrders, earlierOrders || recentOrders);
  if (fx.quality === 1) {
    ordersMom = Math.abs(ordersMom) + 8;
  } else if (fx.quality === -1) {
    ordersMom = -(Math.abs(ordersMom) + 12);
  }

  const kpis: Array<{
    id: ReturnFocusMetricId;
    label: string;
    tip?: string;
    value: string;
    unit?: string;
    trend: string;
    trendUp: boolean;
    caption?: string;
    secondary?: { label: string; value: string };
    pair?: {
      label: string;
      tip?: string;
      value: string;
      unit?: string;
      trend: string;
      trendUp: boolean;
      caption?: string;
    };
    chartVariant: ReturnFocusChartVariant;
    series: ReturnFocusSeriesPoint[];
    valueFormat: (n: number) => string;
    axisFormat?: (n: number) => string;
  }> = [
    {
      id: 'gmv',
      label: 'Сумма повторных заказов',
      tip: 'Сумма повторных заказов от людей, которые сначала купили товар, который продвигался, а потом купили же этот товар повторно.',
      value: ORGANIC_METRIC_META.gmv.format(periodGmv),
      trend: `${gmvMom >= 0 ? '+' : '−'}${Math.abs(gmvMom)}%`,
      trendUp: gmvMom >= 0,
      caption: `${String(shareOfAd).replace('.', ',')}% от рекламного GMV`,
      chartVariant: 'area',
      series: gmvSeries,
      valueFormat: (n) => ORGANIC_METRIC_META.gmv.format(n),
      axisFormat: (n) => `${Math.round(n / 1000)}к`,
    },
    {
      id: 'orders',
      label: 'Повторные заказы и покупатели',
      value: ORGANIC_METRIC_META.orders.format(periodOrders),
      unit: 'зак.',
      trend: `${ordersMom >= 0 ? '+' : '−'}${Math.abs(ordersMom)}%`,
      trendUp: ordersMom >= 0,
      caption: `${String(returnedSharePct).replace('.', ',')}% покупателей вернулось`,
      chartVariant: 'bar',
      series: ordersSeries,
      valueFormat: (n) => ORGANIC_METRIC_META.orders.format(n),
      axisFormat: (n) => String(Math.round(n)),
    },
    {
      id: 'opc',
      label: 'Органических повторных покупок на человека',
      tip: 'В среднем сколько раз один вернувшийся покупатель заказал снова без рекламы. Чем выше — тем чаще люди возвращаются сами.',
      value: opcLabel,
      unit: 'зак. / чел.',
      trend: `${opcMom >= 0 ? '+' : '−'}${Math.abs(opcMom)}%`,
      trendUp: opcMom >= 0,
      chartVariant: 'line-step',
      series: opcChartSeries,
      valueFormat: (n) => n.toFixed(2).replace('.', ','),
    },
    {
      id: 'days',
      label: 'Время до повторной покупки',
      tip: 'Сколько дней в среднем проходит от первого заказа с рекламы до следующей покупки. Чем меньше — тем быстрее люди возвращаются.',
      value: String(avgDays),
      unit: 'дн.',
      trend: `${daysMom > 0 ? '+' : '−'}${Math.abs(daysMom)}%`,
      trendUp: daysMom <= 0,
      chartVariant: 'line',
      series: daysChartSeries,
      valueFormat: (n) => String(Math.round(n)),
    },
  ];

  const visibleKpis =
    metricsFilter === 'gmv' ? kpis.filter((kpi) => kpi.id === 'gmv') : kpis;

  return (
    <section id="organic-return" className="scroll-mt-6 flex flex-col gap-3">
      {showVariantLabel && (
        <div className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-400">
          Вариант B · выручка слева
        </div>
      )}

      {showSectionTitle && (
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="mt-[5px] text-xl font-bold text-gray-900">Вернувшиеся покупатели</h2>
          {onOpenAllMetrics && (
            <button
              type="button"
              onClick={onOpenAllMetrics}
              className="inline-flex shrink-0 items-center gap-1 pb-[3px] text-sm font-medium text-gray-600 transition-colors hover:text-[#9A41FE]"
            >
              Все метрики
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      <div
        className={
          visibleKpis.length === 1
            ? 'grid grid-cols-1 gap-3'
            : 'grid grid-cols-1 gap-3 md:grid-cols-2'
        }
      >
        {visibleKpis.map((kpi) => (
          <article
            key={`${kpi.id}-${range}-${grain}`}
            className={`flex h-full flex-col rounded-2xl bg-white px-4 py-4 ${
              kpi.id === 'gmv' || kpi.id === 'orders' ? 'md:col-span-2' : ''
            }`}
          >
            {kpi.pair ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="flex items-start gap-1.5 text-[13px] font-medium leading-snug text-gray-500">
                    <span>{kpi.label}</span>
                    {kpi.tip && <Tip text={kpi.tip} />}
                  </div>
                  <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
                    <span className="text-2xl font-bold tabular-nums leading-none text-gray-950">
                      {kpi.value}
                    </span>
                    {kpi.unit && <span className="text-[13px] text-gray-900">{kpi.unit}</span>}
                    <TrendBadge value={kpi.trend} up={kpi.trendUp} />
                  </div>
                </div>
                <div>
                  <div className="flex items-start gap-1.5 text-[13px] font-medium leading-snug text-gray-500">
                    <span>{kpi.pair.label}</span>
                    {kpi.pair.tip && <Tip text={kpi.pair.tip} />}
                  </div>
                  <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
                    <span className="text-2xl font-bold tabular-nums leading-none text-gray-950">
                      {kpi.pair.value}
                    </span>
                    {kpi.pair.unit && (
                      <span className="text-[13px] text-gray-900">{kpi.pair.unit}</span>
                    )}
                    <TrendBadge value={kpi.pair.trend} up={kpi.pair.trendUp} />
                  </div>
                  {kpi.pair.caption && (
                    <div className="mt-1 text-[11px] text-gray-500">{kpi.pair.caption}</div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-1.5 text-[13px] font-medium leading-snug text-gray-500">
                  <span>{kpi.label}</span>
                  {kpi.tip && <Tip text={kpi.tip} />}
                </div>
                <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
                  <span className="text-2xl font-bold tabular-nums leading-none text-gray-950">
                    {kpi.value}
                  </span>
                  {kpi.unit && <span className="text-[13px] text-gray-900">{kpi.unit}</span>}
                  <TrendBadge value={kpi.trend} up={kpi.trendUp} />
                </div>
                {kpi.caption && (
                  <div
                    className={
                      kpi.id === 'gmv' || kpi.id === 'orders'
                        ? 'mt-2 inline-flex w-fit items-center rounded-lg bg-[#F3E8FF] px-2.5 py-1 text-[12px] font-semibold tabular-nums text-[#7C3AED]'
                        : 'mt-1 text-[11px] text-gray-500'
                    }
                  >
                    {kpi.caption}
                  </div>
                )}
                {kpi.secondary && (
                  <div className="mt-2 text-[11px] leading-4 text-gray-600">
                    <span className="font-medium text-gray-800">{kpi.secondary.label}</span>
                    <span className="tabular-nums text-gray-700"> · {kpi.secondary.value}</span>
                  </div>
                )}
              </>
            )}
            {kpi.id !== 'opc' && kpi.id !== 'days' && (
              <OrganicReturnFocusMiniChart
                variant={kpi.chartVariant}
                series={kpi.series}
                valueFormat={kpi.valueFormat}
                axisFormat={kpi.axisFormat}
                unit={kpi.unit}
              />
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function OrganicKpiChartCard({
  title,
  valueLabel,
  unit,
  trend,
  trendUp,
  series,
  color,
  valueFormat,
  embedded = false,
}: {
  title: string;
  valueLabel: string;
  unit: string;
  trend: string;
  trendUp: boolean;
  series: Array<{ month: string; value: number }>;
  color: string;
  valueFormat: (n: number) => string;
  embedded?: boolean;
}) {
  const body = (
    <>
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-800">{title}</div>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
          <span className="text-2xl font-bold tabular-nums text-gray-950">{valueLabel}</span>
          <span className="text-xs text-gray-400">{unit}</span>
          <TrendBadge value={trend} up={trendUp} />
        </div>
      </div>
      <div className="mt-3 h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={series} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              interval={series.length > 10 ? 'preserveStartEnd' : 0}
              minTickGap={series.length > 14 ? 28 : 8}
              tick={{ fontSize: 11, fill: '#6B7280' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              width={36}
              tickFormatter={valueFormat}
            />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.03)' }}
              content={({ active, label }) => {
                if (!active) return null;
                const row = series.find((m) => m.month === label);
                if (!row) return null;
                return (
                  <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg">
                    <div className="font-semibold text-gray-900">{label}</div>
                    <div className="mt-1 flex items-center justify-between gap-6 text-gray-600">
                      <span>{title}</span>
                      <strong className="tabular-nums text-gray-900">
                        {valueFormat(row.value)} {unit}
                      </strong>
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );

  if (embedded) {
    return <div className="min-w-0">{body}</div>;
  }

  return <section className="flex flex-col rounded-2xl bg-white p-4">{body}</section>;
}

function Tip({ text }: { text: string }) {
  return (
    <span className="group/tip relative inline-flex shrink-0">
      <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
      <span className="pointer-events-none invisible absolute left-0 top-full z-50 mt-1.5 w-64 rounded-lg bg-gray-900 px-3 py-2 text-left text-[11px] font-normal leading-4 text-white opacity-0 shadow-lg transition group-hover/tip:visible group-hover/tip:opacity-100">
        {text}
      </span>
    </span>
  );
}

function TrendBadge({ value, up = true }: { value: string; up?: boolean }) {
  const looksDown = value.trim().startsWith('−') || value.trim().startsWith('-');
  const looksUp = value.trim().startsWith('+');
  const numeric = Number.parseFloat(
    value.replace(/[^\d.,-]/g, '').replace(',', '.'),
  );
  const isZero = Number.isFinite(numeric) && numeric === 0;
  // Цвет = направление стрелки: вниз красная, вверх зелёная
  const isDown = looksDown || (!looksUp && !up);

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-sm font-semibold tabular-nums ${
        isZero ? 'text-gray-400' : isDown ? 'text-red-600' : 'text-emerald-600'
      }`}
    >
      <ArrowUp className={`h-3.5 w-3.5 ${isDown ? 'rotate-180' : ''}`} />
      {value.replace(/^[−+-]/, '')}
    </span>
  );
}

type GroupMetric = {
  title: string;
  value: string;
  trend: string;
  trendUp?: boolean;
  caption: string;
  tip: string;
  points: number[];
  barColor: string;
};

function GroupMetricCard({ metric }: { metric: GroupMetric }) {
  const range = useStatsRange();
  const points = useMemo(() => {
    const n = monthsCountForRange(range);
    if (range === 'today' || range === 'yesterday') return metric.points.slice(-3);
    if (range === 'week' || range === 'twoWeeks') return metric.points.slice(-5);
    if (range === 'month') return metric.points.slice(-7);
    if (range === 'quarter' || range === 'custom') return metric.points.slice(-Math.max(4, n + 1));
    if (range === 'halfYear') return metric.points.slice(-8);
    return metric.points;
  }, [metric.points, range]);
  const max = Math.max(...points, 1);
  return (
    <article className="min-w-0 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-gray-500">{metric.title}</span>
        <Tip text={metric.tip} />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold tabular-nums leading-none text-gray-950">
          {metric.value}
        </span>
        <TrendBadge value={metric.trend} up={metric.trendUp !== false} />
      </div>
      <p className="mt-2 text-[11px] leading-4 text-gray-400">{metric.caption}</p>
      <div className="mt-3 flex h-10 items-end gap-0.5">
        {points.map((p, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm"
            style={{
              height: `${Math.max(8, (p / max) * 100)}%`,
              backgroundColor: metric.barColor,
              opacity: 0.45 + (i / points.length) * 0.55,
            }}
          />
        ))}
      </div>
    </article>
  );
}

function MetricsGroupBlock({
  id,
  title,
  subtitle,
  metrics,
  accent,
}: {
  id: string;
  title: string;
  subtitle: string;
  metrics: GroupMetric[];
  accent: string;
}) {
  return (
    <section id={id} className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((m) => (
          <GroupMetricCard key={m.title} metric={m} />
        ))}
      </div>
    </section>
  );
}

const ACQUISITION_METRICS: GroupMetric[] = [
  {
    title: 'Новые покупатели',
    value: '7 137',
    trend: '+6,4%',
    caption: 'Впервые заказали после контакта с рекламой',
    tip: 'Покупатели без прошлых заказов у продавца, чей первый заказ связан с рекламным контактом. За год ≈ рекламный GMV / средний чек.',
    points: [62, 68, 71, 74, 78, 82, 85, 88, 91, 94, 97, 100],
    barColor: '#16A34A',
  },
  {
    title: 'Стоимость привлечения',
    value: '200 ₽',
    trend: '−4,1%',
    trendUp: true,
    caption: 'Расходы на рекламу ÷ новые покупатели',
    tip: 'Средние затраты на одного нового покупателя за период. За год: 1 422 000 ₽ / 7 137 ≈ 200 ₽.',
    points: [100, 96, 94, 92, 90, 88, 87, 85, 84, 83, 82, 80],
    barColor: '#D97706',
  },
  {
    title: 'Доля новых покупателей',
    value: '61%',
    trend: '+2,1 п.п.',
    caption: 'Среди всех покупателей с рекламным заказом',
    tip: 'Какая часть покупателей, пришедших с рекламы, новые для продавца.',
    points: [54, 55, 56, 57, 58, 58, 59, 59, 60, 60, 61, 61],
    barColor: '#2563EB',
  },
];

const RETURN_METRICS: GroupMetric[] = [
  {
    title: 'С повторной покупкой',
    value: '1 642',
    trend: '+9,2%',
    caption: '23% от привлечённых рекламой',
    tip: 'Покупатели, которые после первого рекламного заказа сделали хотя бы одну повторную покупку. 7 137 × 0,23 ≈ 1 642.',
    points: [40, 44, 48, 52, 55, 58, 62, 66, 70, 74, 78, 82],
    barColor: '#7C3AED',
  },
  {
    title: 'Повторные заказы',
    value: '2 003',
    trend: '+14,8%',
    caption: 'В т.ч. органические без рекламы — основная метрика',
    tip: 'Все повторные заказы привлечённой аудитории. Органические без рекламы — подмножество. ≈ 1 642 × 1,22.',
    points: [45, 50, 52, 58, 60, 68, 72, 70, 78, 74, 85, 90],
    barColor: '#8B5CF6',
  },
  {
    title: 'Срок до повторной покупки',
    value: '38 дн.',
    trend: '−3 дн.',
    trendUp: true,
    caption: 'Медиана от первого рекламного заказа',
    tip: 'Сколько обычно проходит до второй покупки у вернувшихся.',
    points: [48, 46, 45, 44, 43, 42, 41, 40, 40, 39, 39, 38],
    barColor: '#EC4899',
  },
];

const VALUE_METRICS: GroupMetric[] = [
  {
    title: 'Выручка после привлечения',
    value: '14,9 млн ₽',
    trend: '+16,2%',
    caption: 'Рекламный GMV + органика (~5%) за год',
    tip: 'Сумма заказов покупателей после первого рекламного привлечения: повторные рекламные и органические. 14,22 млн + 0,71 млн ≈ 14,9 млн.',
    points: [50, 55, 58, 62, 66, 70, 74, 78, 82, 86, 92, 100],
    barColor: '#DB2777',
  },
  {
    title: 'Выручка повторных органических',
    value: '711 000 ₽',
    trend: '+6,2%',
    caption: '5% от рекламного GMV 14,22 млн ₽',
    tip: 'Органический возвратный GMV: заказы без продвижения от клиентов, которые раньше соприкасались с рекламой. 14 220 000 × 0,05 = 711 000 ₽.',
    points: [40, 44, 48, 52, 56, 60, 65, 70, 76, 82, 90, 98],
    barColor: '#A855F7',
  },
  {
    title: 'Удержание на 90 дней',
    value: '23%',
    trend: '+1,4 п.п.',
    caption: 'Доля с повторным заказом за 90 дней',
    tip: 'Какая доля привлечённых в периоде покупателей вернулась с заказом в горизонте 90 дней.',
    points: [18, 19, 19, 20, 20, 21, 21, 22, 22, 22, 23, 23],
    barColor: '#0EA5E9',
  },
];

function metricSparklinePath(points: number[], w: number, h: number) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const padY = 2;
  return points
    .map((p, i) => {
      const x = points.length === 1 ? 0 : (i / (points.length - 1)) * w;
      const y = h - padY - ((p - min) / range) * (h - padY * 2);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

function metricSparklineCoords(points: number[], w: number, h: number) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const padY = 2;
  return points.map((p, i) => ({
    x: points.length === 1 ? 0 : (i / (points.length - 1)) * w,
    y: h - padY - ((p - min) / span) * (h - padY * 2),
  }));
}

type KpiSparkMetric = 'orders' | 'spend' | 'spendShare' | 'roas' | 'ctr';

/** Число точек спарклайна: период × детализация (день / неделя / месяц). */
function sparkPointCount(range: StatsRangeId, grain: StatsGrainId): number {
  if (grain === 'month') {
    switch (range) {
      case 'today':
      case 'yesterday':
      case 'week':
      case 'twoWeeks':
      case 'month':
      case 'custom':
        return 1;
      case 'quarter':
        return 3;
      case 'halfYear':
        return 6;
      case 'year':
        return 12;
      default:
        return 6;
    }
  }
  if (grain === 'week') {
    switch (range) {
      case 'today':
      case 'yesterday':
      case 'week':
        return 1;
      case 'twoWeeks':
        return 2;
      case 'month':
      case 'custom':
        return 5;
      case 'quarter':
        return 12;
      case 'halfYear':
        return 14;
      case 'year':
        return 16;
      default:
        return 8;
    }
  }
  // day
  switch (range) {
    case 'today':
    case 'yesterday':
      return 8;
    case 'week':
      return 7;
    case 'twoWeeks':
      return 14;
    case 'month':
      return 30;
    case 'custom':
      return 14;
    case 'quarter':
      return 20;
    case 'halfYear':
      return 24;
    case 'year':
      return 24;
    default:
      return 14;
  }
}

/** Форма и длина спарклайна зависят от периода и детализации. */
function kpiSparklinePointsForRange(
  range: StatsRangeId,
  metric: KpiSparkMetric,
  grain: StatsGrainId,
): number[] {
  const len = Math.max(1, sparkPointCount(range, grain));

  const presets: Record<
    KpiSparkMetric,
    { base: number; amp: number; drift: number; phase: number }
  > = {
    orders: { base: 62, amp: 14, drift: 18, phase: 0.2 },
    spend: { base: 58, amp: 10, drift: -12, phase: 1.1 },
    spendShare: { base: 55, amp: 8, drift: -14, phase: 0.6 },
    roas: { base: 52, amp: 11, drift: 16, phase: 1.7 },
    ctr: { base: 50, amp: 13, drift: 20, phase: 2.3 },
  };

  const rangeScale =
    range === 'today' || range === 'yesterday'
      ? 0.55
      : range === 'week'
        ? 0.7
        : range === 'twoWeeks'
          ? 0.82
          : range === 'month'
            ? 1
            : range === 'quarter'
              ? 1.15
              : range === 'halfYear'
                ? 1.25
                : range === 'year'
                  ? 1.35
                  : 0.9;

  const grainScale = grain === 'day' ? 1 : grain === 'week' ? 1.08 : 1.16;
  const wobbleFreq =
    grain === 'month' ? 2 : grain === 'week' ? 2.6 : range === 'year' ? 4 : 3.2;

  const { base, amp, drift, phase } = presets[metric];
  const points: number[] = [];
  for (let i = 0; i < len; i++) {
    const t = len === 1 ? 0.5 : i / (len - 1);
    const v =
      base * rangeScale * grainScale +
      amp * rangeScale * Math.sin(t * Math.PI * 2 + phase) +
      drift * t * rangeScale * 0.5 +
      7 * Math.sin(t * Math.PI * wobbleFreq + phase);
    points.push(Math.round(Math.max(18, Math.min(96, v))));
  }
  return points;
}

function parseKpiDisplayNumber(value: string): number {
  const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.');
  return Number.parseFloat(cleaned) || 0;
}

function formatKpiSparkValue(metric: KpiSparkMetric, n: number): string {
  if (metric === 'orders' || metric === 'spend') {
    return `${fmt(Math.round(n))} ₽`;
  }
  if (metric === 'spendShare' || metric === 'ctr') {
    return `${n.toFixed(1).replace('.', ',')} %`;
  }
  return n.toFixed(2).replace('.', ',');
}

function kpiSparkPointValues(
  points: number[],
  summaryValue: string,
  metric: KpiSparkMetric,
): number[] {
  const summary = parseKpiDisplayNumber(summaryValue);
  if (metric === 'orders' || metric === 'spend') {
    const weightSum = points.reduce((s, p) => s + p, 0) || 1;
    return points.map((p) => (p / weightSum) * summary);
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const variance = Math.max(summary * 0.1, metric === 'roas' ? 0.08 : 0.2);
  return points.map((p) => summary - variance + ((p - min) / span) * variance * 2);
}

function capitalizeRu(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function sparkDatesForRange(
  range: StatsRangeId,
  count: number,
  grain: StatsGrainId,
): Date[] {
  const end = startOfDay(new Date(2026, 7, 5)); // 5 авг 2026 — как в лейблах периода
  const dates: Date[] = [];

  if (grain === 'month') {
    for (let i = 0; i < count; i++) {
      const offset = count - 1 - i;
      dates.push(new Date(2026, 7 - offset, 1));
    }
    return dates;
  }

  if (grain === 'week') {
    for (let i = 0; i < count; i++) {
      const d = new Date(end);
      d.setDate(end.getDate() - (count - 1 - i) * 7);
      dates.push(startOfDay(d));
    }
    return dates;
  }

  // day
  if (range === 'today' || range === 'yesterday') {
    const day = range === 'yesterday' ? new Date(2026, 7, 4) : end;
    for (let i = 0; i < count; i++) {
      const d = new Date(day);
      d.setHours(8 + i * Math.max(1, Math.floor(12 / Math.max(count - 1, 1))), 0, 0, 0);
      dates.push(d);
    }
    return dates;
  }

  for (let i = 0; i < count; i++) {
    const d = new Date(end);
    d.setDate(end.getDate() - (count - 1 - i));
    dates.push(startOfDay(d));
  }
  return dates;
}

function formatSparkTooltipDate(grain: StatsGrainId, date: Date, range: StatsRangeId): string {
  if (grain === 'month') {
    return capitalizeRu(
      date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }),
    );
  }

  if (grain === 'week') {
    const from = startOfDay(date);
    const to = new Date(from);
    to.setDate(from.getDate() + 6);
    const sameMonth = from.getMonth() === to.getMonth();
    if (sameMonth) {
      const monthYear = capitalizeRu(
        from.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }),
      );
      return `${from.getDate()}–${to.getDate()} ${monthYear}`;
    }
    const fromPart = from.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    const toPart = to.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return `${fromPart} – ${toPart}`;
  }

  if (range === 'today' || range === 'yesterday') {
    const base = capitalizeRu(
      date.toLocaleDateString('ru-RU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    );
    const hh = String(date.getHours()).padStart(2, '0');
    return `${base}, ${hh}:00`;
  }

  return capitalizeRu(
    date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  );
}

function MetricMiniSparkline({
  points,
  label,
  metric,
  summaryValue,
  range,
  grain,
}: {
  points: number[];
  label: string;
  metric: KpiSparkMetric;
  summaryValue: string;
  range: StatsRangeId;
  grain: StatsGrainId;
}) {
  const w = 160;
  const h = 32;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const gradId = React.useId().replace(/:/g, '');

  const coords = useMemo(() => metricSparklineCoords(points, w, h), [points]);
  const line = metricSparklinePath(points, w, h);
  const area = `${line} L${w},${h} L0,${h} Z`;
  const values = useMemo(
    () => kpiSparkPointValues(points, summaryValue, metric),
    [points, summaryValue, metric],
  );
  const dates = useMemo(
    () => sparkDatesForRange(range, points.length, grain),
    [range, points.length, grain],
  );

  const onMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect || points.length === 0) return;
    const x = ((event.clientX - rect.left) / rect.width) * w;
    let best = 0;
    let bestDist = Infinity;
    coords.forEach((c, i) => {
      const dist = Math.abs(c.x - x);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    setActiveIdx(best);
  };

  const active = activeIdx !== null ? coords[activeIdx] : null;

  return (
    <div
      ref={wrapRef}
      className="relative h-8 w-full cursor-crosshair"
      onMouseMove={onMove}
      onMouseLeave={() => setActiveIdx(null)}
    >
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-8 w-full"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9A41FE" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#9A41FE" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradId})`} />
        <path
          d={line}
          fill="none"
          stroke="#9A41FE"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {activeIdx !== null && active && (
        <>
          <div
            className="pointer-events-none absolute inset-y-0 w-px bg-gray-300"
            style={{ left: `${(active.x / w) * 100}%` }}
          />
          <div
            className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#9A41FE] shadow-sm"
            style={{
              left: `${(active.x / w) * 100}%`,
              top: `${(active.y / h) * 100}%`,
            }}
          />
          <div
            className="pointer-events-none absolute bottom-full z-30 mb-1 -translate-x-1/2"
            style={{
              left: `${(active.x / w) * 100}%`,
            }}
          >
            <div className="relative min-w-[200px] max-w-[260px] rounded-xl bg-[#2C2C2E] px-3 py-2 shadow-lg">
              <div className="text-[11px] leading-4 text-white/55">
                {formatSparkTooltipDate(
                  grain,
                  dates[activeIdx] ?? dates[dates.length - 1],
                  range,
                )}
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#9A41FE]" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-[12px] font-medium leading-4 text-white">
                  {label}
                </span>
                <span className="shrink-0 text-[12px] font-semibold tabular-nums leading-4 text-white">
                  {formatKpiSparkValue(metric, values[activeIdx] ?? 0)}
                </span>
              </div>
              <span
                className="absolute left-1/2 top-full -mt-px h-0 w-0 -translate-x-1/2 border-x-[6px] border-t-[6px] border-x-transparent border-t-[#2C2C2E]"
                aria-hidden
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

type StatsKpiCard = {
  label: string;
  value: string;
  trend: string;
  trendDown?: boolean;
  points: number[];
  metric: KpiSparkMetric;
};

function StatsKpiIsland({
  card,
  range,
  grain,
}: {
  card: StatsKpiCard;
  range: StatsRangeId;
  grain: StatsGrainId;
}) {
  const trendPct = card.trend.replace(/^[−+-]/, '').replace(/\s*%\s*$/, '').trim();
  const trendText = `${card.trendDown ? '−' : ''}${trendPct} %`;

  return (
    <section className="relative z-0 rounded-2xl bg-white px-4 py-3 hover:z-20">
      <h3 className="text-sm font-medium text-gray-700">{card.label}</h3>

      <div className="mt-2 flex flex-wrap items-baseline gap-2">
        <span className="text-2xl font-bold tabular-nums leading-none text-gray-900">{card.value}</span>
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium tabular-nums ${
            card.trendDown ? 'text-red-600' : 'text-emerald-600'
          }`}
        >
          <ArrowUp
            className={`h-3 w-3 ${card.trendDown ? 'rotate-180' : ''}`}
            aria-hidden
          />
          {trendText}
        </span>
      </div>

      <div className="mt-2">
        <MetricMiniSparkline
          points={card.points}
          label={card.label}
          metric={card.metric}
          summaryValue={card.value}
          range={range}
          grain={grain}
        />
      </div>
    </section>
  );
}

function StatsKpiIslands() {
  const range = useStatsRange();
  const grain = useStatsGrain();
  const warehouseScope = useStatsWarehouseScope();
  const fx = WAREHOUSE_SCOPE_FX[warehouseScope];

  const cards = useMemo<StatsKpiCard[]>(() => {
    /**
     * База периода → производные:
     * доля затрат = spend / orders × 100
     * ROAS = orders / spend
     * органика ≈ 5% от суммы заказов
     */
    type KpiBase = {
      orders: number;
      spend: number;
      ctr: number;
      ordersTrend: string;
      spendTrend: string;
      spendTrendDown?: boolean;
      spendShareTrend: string;
      spendShareTrendDown?: boolean;
      roasTrend: string;
      ctrTrend: string;
      organicTrend: string;
    };

    const byRange: Record<StatsRangeId, KpiBase> = {
      today: {
        orders: 42_500,
        spend: 4_250, // 10% ДРР → ROAS 10
        ctr: 5.1,
        ordersTrend: '1,4%',
        spendTrend: '0,9%',
        spendTrendDown: true,
        spendShareTrend: '1,2%',
        spendShareTrendDown: true,
        roasTrend: '0,6%',
        ctrTrend: '3,4%',
        organicTrend: '2,8%',
      },
      yesterday: {
        orders: 38_900,
        spend: 4_050,
        ctr: 4.9,
        ordersTrend: '2,1%',
        spendTrend: '1,5%',
        spendTrendDown: true,
        spendShareTrend: '0,8%',
        spendShareTrendDown: true,
        roasTrend: '0,4%',
        ctrTrend: '2,1%',
        organicTrend: '1,9%',
      },
      week: {
        orders: 268_000,
        spend: 26_800, // 10% → ROAS 10; органика 5% = 13 400
        ctr: 4.8,
        ordersTrend: '4,2%',
        spendTrend: '2,4%',
        spendTrendDown: true,
        spendShareTrend: '3,6%',
        spendShareTrendDown: true,
        roasTrend: '1,2%',
        ctrTrend: '7,3%',
        organicTrend: '5,1%',
      },
      twoWeeks: {
        orders: 512_000,
        spend: 51_200,
        ctr: 4.75,
        ordersTrend: '3,8%',
        spendTrend: '2,7%',
        spendTrendDown: true,
        spendShareTrend: '3,2%',
        spendShareTrendDown: true,
        roasTrend: '1,4%',
        ctrTrend: '6,8%',
        organicTrend: '5,6%',
      },
      month: {
        orders: 1_170_000,
        spend: 117_000, // 10% — как «Дек» в месячном ряде
        ctr: 4.7,
        ordersTrend: '3,1%',
        spendTrend: '3,1%',
        spendTrendDown: true,
        spendShareTrend: '5,8%',
        spendShareTrendDown: true,
        roasTrend: '1,9%',
        ctrTrend: '12,6%',
        organicTrend: '6,2%',
      },
      quarter: {
        orders: 4_040_000, // Окт–Дек
        spend: 390_900, // ~9,7%
        ctr: 4.5,
        ordersTrend: '5,4%',
        spendTrend: '4,1%',
        spendTrendDown: true,
        spendShareTrend: '2,9%',
        spendShareTrendDown: true,
        roasTrend: '2,6%',
        ctrTrend: '8,1%',
        organicTrend: '7,8%',
      },
      halfYear: {
        orders: 7_070_000, // Мар–Авг
        spend: 718_700, // ~10,2%
        ctr: 4.3,
        ordersTrend: '6,8%',
        spendTrend: '5,2%',
        spendTrendDown: true,
        spendShareTrend: '4,4%',
        spendShareTrendDown: true,
        roasTrend: '3,2%',
        ctrTrend: '6,5%',
        organicTrend: '9,1%',
      },
      year: {
        orders: 14_220_000,
        spend: 1_422_000, // 10%
        ctr: 4.2,
        ordersTrend: '8,2%',
        spendTrend: '6,7%',
        spendTrendDown: true,
        spendShareTrend: '3,8%',
        spendShareTrendDown: true,
        roasTrend: '4,1%',
        ctrTrend: '5,9%',
        organicTrend: '11,4%',
      },
      custom: {
        orders: 742_000,
        spend: 81_620, // 11%
        ctr: 4.6,
        ordersTrend: '2,7%',
        spendTrend: '1,8%',
        spendTrendDown: true,
        spendShareTrend: '2,2%',
        spendShareTrendDown: true,
        roasTrend: '1,1%',
        ctrTrend: '4,8%',
        organicTrend: '4,6%',
      },
    };

    const base = byRange[range];
    const orders = Math.round(base.orders * fx.orders);
    const spend = Math.max(1, Math.round(base.spend * fx.spend));
    const spendShare = (spend / orders) * 100;
    const roas = orders / spend;
    const ctr = Math.round(base.ctr * fx.ctr * 100) / 100;

    const ordersTrend = warehouseTrend(base.ordersTrend, fx.quality);
    const spendTrend = warehouseTrend(base.spendTrend, fx.quality, { preferDown: true });
    const spendShareTrend = warehouseTrend(base.spendShareTrend, fx.quality, {
      preferDown: true,
    });
    const roasTrend = warehouseTrend(base.roasTrend, fx.quality);
    const ctrTrend = warehouseTrend(base.ctrTrend, fx.quality);

    return [
      {
        label: 'Сумма заказов',
        value: formatStatsMoney(orders),
        trend: ordersTrend.trend,
        trendDown: ordersTrend.trendDown,
        points: scaleSparkForWarehouse(kpiSparklinePointsForRange(range, 'orders', grain), fx.quality),
        metric: 'orders' as const,
      },
      {
        label: 'Затраты',
        value: formatStatsMoney(spend),
        trend: spendTrend.trend,
        trendDown: spendTrend.trendDown ?? base.spendTrendDown,
        points: scaleSparkForWarehouse(kpiSparklinePointsForRange(range, 'spend', grain), fx.quality),
        metric: 'spend' as const,
      },
      {
        label: 'Доля затрат',
        value: formatStatsPct(spendShare),
        trend: spendShareTrend.trend,
        trendDown: spendShareTrend.trendDown ?? base.spendShareTrendDown,
        points: scaleSparkForWarehouse(
          kpiSparklinePointsForRange(range, 'spendShare', grain),
          fx.quality,
        ),
        metric: 'spendShare' as const,
      },
      {
        label: 'ROAS',
        value: formatStatsRoas(roas),
        trend: roasTrend.trend,
        trendDown: roasTrend.trendDown,
        points: scaleSparkForWarehouse(kpiSparklinePointsForRange(range, 'roas', grain), fx.quality),
        metric: 'roas' as const,
      },
      {
        label: 'CTR',
        value: formatStatsPct(ctr),
        trend: ctrTrend.trend,
        trendDown: ctrTrend.trendDown,
        points: scaleSparkForWarehouse(kpiSparklinePointsForRange(range, 'ctr', grain), fx.quality),
        metric: 'ctr' as const,
      },
    ];
  }, [range, grain, fx]);

  return (
    <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => (
        <StatsKpiIsland
          key={`${range}-${grain}-${warehouseScope}-${card.label}`}
          card={card}
          range={range}
          grain={grain}
        />
      ))}
    </div>
  );
}

export type StatsSectionId = 'overview' | 'acquisition' | 'return' | 'value';

type StatsOverviewTabId = 'summary' | 'campaigns';

const STATS_OVERVIEW_TABS: { id: StatsOverviewTabId; label: string }[] = [
  { id: 'summary', label: 'Сводка' },
  { id: 'campaigns', label: 'По кампаниям' },
];

const STATS_WAREHOUSE_SCOPE_TABS: { id: StatsWarehouseScopeId; label: string }[] = [
  { id: 'all', label: 'Все склады' },
  { id: 'mine', label: 'Мои' },
  { id: 'wb', label: 'WB' },
];

const STATS_SECTION_TITLES: Record<StatsSectionId, string> = {
  overview: 'Статистика',
  acquisition: 'Привлечение',
  return: 'Вернувшиеся покупатели',
  value: 'Ценность',
};

type CampaignStatsStatus = 'active' | 'paused' | 'finished';

type CampaignStatsRow = {
  id: number;
  name: string;
  type: string;
  status: CampaignStatsStatus;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cr: number;
  addToCart: number;
  orderedItems: number;
  spend: number;
  spendShare: number;
  cancellations: number;
};

const CAMPAIGN_STATS_STATUS_META: Record<
  CampaignStatsStatus,
  { label: string; className: string }
> = {
  active: { label: 'Активна', className: 'bg-emerald-50 text-emerald-700' },
  paused: { label: 'На паузе', className: 'bg-amber-50 text-amber-700' },
  finished: { label: 'Завершена', className: 'bg-gray-100 text-gray-600' },
};

const CAMPAIGN_STATS_MOCK: CampaignStatsRow[] = [
  {
    id: 37121644,
    name: 'Кампания АБ-теста 484516 портала от 2026-06-03',
    type: 'Единая ставка',
    status: 'active',
    impressions: 18420,
    clicks: 612,
    ctr: 3.32,
    cpc: 18.4,
    cr: 4.1,
    addToCart: 96,
    orderedItems: 38,
    spend: 11260.8,
    spendShare: 6.8, // spend / Σ spend
    cancellations: 3,
  },
  {
    id: 37120891,
    name: 'Крем SPF 50 — поиск и рекомендации',
    type: 'Ручная ставка',
    status: 'active',
    impressions: 42680,
    clicks: 1540,
    ctr: 3.61,
    cpc: 22.1,
    cr: 5.2,
    addToCart: 248,
    orderedItems: 112,
    spend: 34034,
    spendShare: 20.6,
    cancellations: 9,
  },
  {
    id: 37119402,
    name: 'Шампунь без сульфатов · каталог',
    type: 'Единая ставка',
    status: 'paused',
    impressions: 9800,
    clicks: 210,
    ctr: 2.14,
    cpc: 15.6,
    cr: 2.8,
    addToCart: 41,
    orderedItems: 12,
    spend: 3276,
    spendShare: 2.0,
    cancellations: 2,
  },
  {
    id: 37118055,
    name: 'Набор для ухода за лицом 3 в 1',
    type: 'Ручная ставка',
    status: 'active',
    impressions: 27340,
    clicks: 890,
    ctr: 3.25,
    cpc: 19.8,
    cr: 4.6,
    addToCart: 156,
    orderedItems: 64,
    spend: 17622,
    spendShare: 10.7,
    cancellations: 5,
  },
  {
    id: 37116512,
    name: 'Маска ночная увлажняющая · ретаргет',
    type: 'Единая ставка',
    status: 'active',
    impressions: 15220,
    clicks: 480,
    ctr: 3.15,
    cpc: 17.2,
    cr: 3.9,
    addToCart: 72,
    orderedItems: 28,
    spend: 8256,
    spendShare: 5.0,
    cancellations: 1,
  },
  {
    id: 37115108,
    name: 'Сыворотка с витамином C — топ поиск',
    type: 'Ручная ставка',
    status: 'finished',
    impressions: 51020,
    clicks: 2010,
    ctr: 3.94,
    cpc: 24.5,
    cr: 6.1,
    addToCart: 310,
    orderedItems: 148,
    spend: 49245,
    spendShare: 29.8,
    cancellations: 14,
  },
  {
    id: 37114077,
    name: 'Бальзам для губ SPF · рекомендации',
    type: 'Единая ставка',
    status: 'active',
    impressions: 8640,
    clicks: 198,
    ctr: 2.29,
    cpc: 12.8,
    cr: 2.1,
    addToCart: 28,
    orderedItems: 8,
    spend: 2534.4,
    spendShare: 1.5,
    cancellations: 0,
  },
  {
    id: 37112840,
    name: 'Гель для умывания 200 мл',
    type: 'Ручная ставка',
    status: 'paused',
    impressions: 12100,
    clicks: 305,
    ctr: 2.52,
    cpc: 14.9,
    cr: 3.0,
    addToCart: 54,
    orderedItems: 18,
    spend: 4544.5,
    spendShare: 2.8,
    cancellations: 2,
  },
  {
    id: 37111209,
    name: 'Тоник с кислотами · автостратегия',
    type: 'Единая ставка',
    status: 'active',
    impressions: 19880,
    clicks: 720,
    ctr: 3.62,
    cpc: 20.3,
    cr: 4.8,
    addToCart: 134,
    orderedItems: 55,
    spend: 14616,
    spendShare: 8.9,
    cancellations: 4,
  },
  {
    id: 37109961,
    name: 'Патчи под глаза гидрогелевые',
    type: 'Ручная ставка',
    status: 'active',
    impressions: 33450,
    clicks: 1180,
    ctr: 3.53,
    cpc: 16.7,
    cr: 5.0,
    addToCart: 210,
    orderedItems: 92,
    spend: 19706,
    spendShare: 11.9,
    cancellations: 7,
  },
];

function fmtRubExact(value: number) {
  return `${new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)} ₽`;
}

function CampaignStatsSortHint() {
  return <ArrowUp className="h-3 w-3 shrink-0 text-gray-400" />;
}

function CampaignStatsHelpHint({ text }: { text: string }) {
  return (
    <span title={text} className="inline-flex text-gray-400" aria-label={text}>
      <HelpCircle className="h-3.5 w-3.5" />
    </span>
  );
}

const CAMPAIGN_STATS_TYPE_OPTIONS = [
  { id: 'all', label: 'Все' },
  { id: 'Единая ставка', label: 'Единая ставка' },
  { id: 'Ручная ставка', label: 'Ручная ставка' },
] as const;

const CAMPAIGN_STATS_STATUS_OPTIONS = [
  { id: 'all-except-archived', label: 'Все, кроме архивных' },
  { id: 'all', label: 'Все' },
  { id: 'active', label: 'Активные' },
  { id: 'paused', label: 'На паузе' },
  { id: 'finished', label: 'Завершённые' },
] as const;

type CampaignStatsTypeFilter = (typeof CAMPAIGN_STATS_TYPE_OPTIONS)[number]['id'];
type CampaignStatsStatusFilter = (typeof CAMPAIGN_STATS_STATUS_OPTIONS)[number]['id'];

function CampaignStatsToolbarSelect<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: readonly { id: T; label: string }[];
  onChange: (id: T) => void;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (event: MouseEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-flex shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-[#e3e4ea] bg-white px-4 text-sm leading-5 text-gray-900 transition-colors hover:bg-gray-50"
      >
        <span className="whitespace-nowrap">{selected.label}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#767386] transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 top-full z-[60] mt-1.5 min-w-full overflow-hidden rounded-[10px] border border-[#e3e4ea] bg-white py-1 shadow-lg"
        >
          {options.map((option) => {
            const active = option.id === value;
            return (
              <li key={option.id} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 whitespace-nowrap px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? 'bg-gray-50 font-medium text-gray-950'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex-1">{option.label}</span>
                  {active && <Check className="h-4 w-4 text-gray-800" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function StatsCampaignsTable() {
  const idColWidth = 120;
  const nameColWidth = 300;
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<CampaignStatsTypeFilter>('all');
  const [statusFilter, setStatusFilter] =
    useState<CampaignStatsStatusFilter>('all-except-archived');
  const warehouseScope = useStatsWarehouseScope();
  const fx = WAREHOUSE_SCOPE_FX[warehouseScope];

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return CAMPAIGN_STATS_MOCK.filter((row) => {
      if (typeFilter !== 'all' && row.type !== typeFilter) return false;
      if (statusFilter === 'all-except-archived') {
        // В моке нет архивных — показываем все статусы
      } else if (statusFilter !== 'all' && row.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return String(row.id).includes(q) || row.name.toLowerCase().includes(q);
    }).map((row) => ({
      ...row,
      impressions: Math.round(row.impressions * (fx.quality === -1 ? 1.15 : fx.quality === 1 ? 0.95 : 1)),
      clicks: Math.max(1, Math.round(row.clicks * fx.ctr)),
      ctr: Math.round(row.ctr * fx.ctr * 100) / 100,
      cpc: Math.round(row.cpc * (fx.spend / Math.max(fx.ctr, 0.01)) * 10) / 10,
      cr: Math.round(row.cr * fx.roas * 100) / 100,
      addToCart: Math.max(0, Math.round(row.addToCart * fx.orders)),
      orderedItems: Math.max(0, Math.round(row.orderedItems * fx.orders)),
      spend: Math.round(row.spend * fx.spend * 10) / 10,
      spendShare: Math.round(row.spendShare * fx.spendShare * 10) / 10,
      cancellations: Math.max(
        0,
        Math.round(row.cancellations * (fx.quality === -1 ? 2.2 : fx.quality === 1 ? 0.45 : 1)),
      ),
    }));
  }, [searchQuery, typeFilter, statusFilter, fx]);

  return (
    <section className="rounded-2xl bg-white">
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-xl font-bold text-gray-900">Статистика по кампаниям</h2>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="relative w-full min-w-[240px] max-w-[420px] flex-1 sm:w-[360px] sm:flex-none">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по ID кампании или названию"
              aria-label="Поиск по ID кампании или названию"
              className="h-11 w-full rounded-[10px] border border-[#e3e4ea] bg-white py-2.5 pl-4 pr-11 text-sm leading-5 text-gray-900 placeholder:text-[#767386] outline-none focus:border-[#9a41fe] focus:ring-1 focus:ring-[#9a41fe]"
            />
            <Search
              className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#767386]"
              aria-hidden
            />
          </div>

          <CampaignStatsToolbarSelect
            value={typeFilter}
            options={CAMPAIGN_STATS_TYPE_OPTIONS}
            onChange={setTypeFilter}
            ariaLabel="Тип кампании"
          />
          <CampaignStatsToolbarSelect
            value={statusFilter}
            options={CAMPAIGN_STATS_STATUS_OPTIONS}
            onChange={setStatusFilter}
            ariaLabel="Статус кампании"
          />

          <button
            type="button"
            className="ml-auto inline-flex h-11 shrink-0 items-center gap-2 rounded-[10px] border border-[#e3e4ea] bg-white px-4 text-sm leading-5 text-gray-900 transition-colors hover:bg-gray-50"
          >
            <Download className="h-5 w-5 text-[#767386]" aria-hidden />
            Расширенная статистика
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-max min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-[13px] font-semibold text-gray-900">
              <th
                className="sticky left-0 z-20 bg-white px-4 py-3"
                style={{ width: idColWidth, minWidth: idColWidth }}
              >
                ID кампании
              </th>
              <th
                className="sticky z-20 border-r border-gray-200 bg-white px-4 py-3 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.08)]"
                style={{ left: idColWidth, width: nameColWidth, minWidth: nameColWidth }}
              >
                Кампания, Тип
              </th>
              <th className="whitespace-nowrap px-4 py-3">Статус</th>
              <th className="whitespace-nowrap px-4 py-3">
                <span className="inline-flex items-center gap-1">
                  Показы
                  <CampaignStatsSortHint />
                </span>
              </th>
              <th className="whitespace-nowrap px-4 py-3">
                <span className="inline-flex items-center gap-1">
                  Клики
                  <CampaignStatsSortHint />
                </span>
              </th>
              <th className="whitespace-nowrap px-4 py-3">
                <span className="inline-flex items-center gap-1">
                  CTR %
                  <CampaignStatsSortHint />
                </span>
              </th>
              <th className="whitespace-nowrap px-4 py-3">
                <span className="inline-flex items-center gap-1">
                  CPC
                  <CampaignStatsSortHint />
                </span>
              </th>
              <th className="whitespace-nowrap px-4 py-3">
                <span className="inline-flex items-center gap-1">
                  CR (%)
                  <CampaignStatsSortHint />
                </span>
              </th>
              <th className="whitespace-nowrap px-4 py-3">
                <span className="inline-flex items-center gap-1">
                  Все добавления в корзину
                  <CampaignStatsHelpHint text="Сумма добавлений товара в корзину по кампании за период" />
                  <CampaignStatsSortHint />
                </span>
              </th>
              <th className="whitespace-nowrap px-4 py-3">
                <span className="inline-flex items-center gap-1">
                  Все заказанные товары, шт
                  <CampaignStatsHelpHint text="Количество заказанных единиц товара по кампании" />
                  <CampaignStatsSortHint />
                </span>
              </th>
              <th className="whitespace-nowrap px-4 py-3">
                <span className="inline-flex items-center gap-1">
                  Затраты
                  <CampaignStatsSortHint />
                </span>
              </th>
              <th className="whitespace-nowrap px-4 py-3">
                <span className="inline-flex items-center gap-1">
                  Доля затрат (%)
                  <CampaignStatsHelpHint text="Доля расходов кампании в общих затратах за период" />
                  <CampaignStatsSortHint />
                </span>
              </th>
              <th className="whitespace-nowrap px-4 py-3">
                <span className="inline-flex items-center gap-1">
                  Отмены, шт
                  <CampaignStatsHelpHint text="Количество отменённых заказов, связанных с кампанией" />
                  <CampaignStatsSortHint />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => {
              const status = CAMPAIGN_STATS_STATUS_META[row.status];
              return (
                <tr key={row.id} className="border-b border-gray-100 text-gray-800 last:border-b-0">
                  <td
                    className="sticky left-0 z-10 bg-white px-4 py-3 tabular-nums text-gray-700"
                    style={{ width: idColWidth, minWidth: idColWidth }}
                  >
                    {row.id}
                  </td>
                  <td
                    className="sticky z-10 border-r border-gray-200 bg-white px-4 py-3 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.08)]"
                    style={{ left: idColWidth, width: nameColWidth, minWidth: nameColWidth }}
                  >
                    <div className="min-w-0">
                      <a
                        href="/product-promotion-concept"
                        className="line-clamp-2 font-medium text-[#2563EB] hover:underline"
                      >
                        {row.name}
                      </a>
                      <div className="mt-0.5 text-xs text-gray-500">{row.type}</div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold leading-none ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums">{fmt(row.impressions)}</td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums">{fmt(row.clicks)}</td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                    {row.ctr.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums">{fmtRubExact(row.cpc)}</td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                    {row.cr.toFixed(1).replace('.', ',')}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums">{fmt(row.addToCart)}</td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums">{fmt(row.orderedItems)}</td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums">{fmtRubExact(row.spend)}</td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                    {row.spendShare.toFixed(1).replace('.', ',')}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums">{fmt(row.cancellations)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Компактный экран «Статистика» (/stats и разделы). */
export function StatsDashboardPage({
  section = 'overview',
}: {
  section?: StatsSectionId;
} = {}) {
  const [range, setRange] = useState<StatsRangeId>('week');
  const [grain, setGrain] = useState<StatsGrainId>('day');
  const [overviewTab, setOverviewTab] = useState<StatsOverviewTabId>('summary');
  const [warehouseScope, setWarehouseScope] = useState<StatsWarehouseScopeId>('all');

  const handleRangeChange = (next: StatsRangeId) => {
    setRange(next);
  };

  const handleGrainChange = (next: StatsGrainId) => {
    setGrain(next);
  };

  useEffect(() => {
    if (section !== 'overview' && section !== 'return') return;
    const scrollToOrganic = () => {
      if (window.location.hash !== '#organic-return') return;
      document.getElementById('organic-return')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    const t = window.setTimeout(scrollToOrganic, 50);
    return () => window.clearTimeout(t);
  }, [section]);

  const pageTitle = STATS_SECTION_TITLES[section];
  const showOverviewTabs = section === 'overview';

  return (
    <StatsRangeContext.Provider value={range}>
      <StatsGrainContext.Provider value={grain}>
        <StatsWarehouseScopeContext.Provider value={warehouseScope}>
        <main className="mx-auto w-full max-w-[1600px] px-6 py-6">
          <div className="flex flex-col gap-4">
            <section className="sticky top-14 z-40 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-black/[0.03]">
              <h1 className="text-2xl font-bold leading-none text-gray-900">{pageTitle}</h1>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {showOverviewTabs && (
                  <div className="flex rounded-lg bg-gray-100 p-0.5 text-sm font-medium">
                    {STATS_OVERVIEW_TABS.map((tab) => {
                      const active = overviewTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setOverviewTab(tab.id)}
                          className={`rounded-md px-3 py-1.5 transition-colors ${
                            active
                              ? 'bg-white text-gray-950 shadow-sm'
                              : 'text-gray-500 hover:text-gray-800'
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                )}
                <StatsDateRangeBar value={range} onChange={handleRangeChange} compact />
                {(section === 'overview' || section === 'return') &&
                  !(showOverviewTabs && overviewTab === 'campaigns') && (
                    <StatsGrainSelect value={grain} onChange={handleGrainChange} />
                  )}
                <div className="ml-auto flex rounded-lg bg-gray-100 p-0.5 text-sm font-medium">
                  {STATS_WAREHOUSE_SCOPE_TABS.map((tab) => {
                    const active = warehouseScope === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setWarehouseScope(tab.id)}
                        className={`rounded-md px-3 py-1.5 transition-colors ${
                          active
                            ? 'bg-white text-gray-950 shadow-sm'
                            : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {section === 'overview' && overviewTab === 'summary' && (
              <>
                <StatsKpiIslands />

                <OrganicReturnDynamicsBlockV2 showVariantLabel={false} />
              </>
            )}

            {section === 'overview' && overviewTab === 'campaigns' && <StatsCampaignsTable />}

            {section === 'acquisition' && (
              <section className="rounded-2xl bg-white p-5">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-gray-900">Привлечение</h2>
                  <span className="shrink-0 rounded-md bg-[#F6F2FF] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[#9A41FE]">
                    Скоро появится
                  </span>
                </div>
              </section>
            )}

            {section === 'return' && (
              <OrganicReturnDynamicsBlockV2 showVariantLabel={false} layout="stack" />
            )}

            {section === 'value' && (
              <section className="rounded-2xl bg-white p-5">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-gray-900">Ценность</h2>
                  <span className="shrink-0 rounded-md bg-[#F6F2FF] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[#9A41FE]">
                    Скоро появится
                  </span>
                </div>
              </section>
            )}
          </div>
        </main>
        </StatsWarehouseScopeContext.Provider>
      </StatsGrainContext.Provider>
    </StatsRangeContext.Provider>
  );
}

/** Полный экран «Аудитория» (/audience-metrics). */
const AudienceMetricsPage: React.FC = () => {
  const [tab, setTab] = useState<TabId>('repeat');
  const [range, setRange] = useState<StatsRangeId>('week');

  useEffect(() => {
    if (window.location.hash !== '#organic-return') return;
    requestAnimationFrame(() => {
      document.getElementById('organic-return')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const selectTab = (id: TabId) => {
    setTab(id);
    const anchor =
      id === 'acquisition' ? 'metrics-acquisition' : id === 'value' ? 'metrics-value' : 'metrics-return';
    requestAnimationFrame(() => {
      document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <StatsRangeContext.Provider value={range}>
      <main className="mx-auto max-w-[1600px] px-6 py-6">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-2.5 sm:py-0">
            <nav className="flex gap-6">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectTab(t.id)}
                  className={`relative py-4 text-sm transition-colors ${
                    tab === t.id
                      ? 'font-semibold text-gray-950'
                      : 'font-medium text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {t.label}
                  {tab === t.id && (
                    <span className="absolute inset-x-0 -bottom-px h-0.5 bg-gray-950" />
                  )}
                </button>
              ))}
            </nav>
            <div className="pb-2 sm:pb-0">
              <StatsDateRangeBar value={range} onChange={setRange} />
            </div>
          </div>

          <div className="space-y-6 p-5">
            <div className="flex flex-col gap-4">
              <OrganicReturnPeopleFunnel />

              <OrganicReturnStoryBlock />

              <OrganicReturnDynamicsBlockV2 showVariantLabel={false} />

              <CohortHeatmap />

              <MonthlySpendOrganicBlock />

              <SpendOrganicStackTrendBlock />

              <SpendLtvOrganicBlock />

              <CacChartBlock />

              <MetricsGroupBlock
                id="metrics-acquisition"
                title="Привлечение"
                subtitle="Новые покупатели и стоимость их привлечения"
                accent="#16A34A"
                metrics={ACQUISITION_METRICS}
              />

              <MetricsGroupBlock
                id="metrics-return"
                title="Возврат"
                subtitle="Повторные покупки и удержание привлечённой аудитории"
                accent="#7C3AED"
                metrics={RETURN_METRICS}
              />

              <MetricsGroupBlock
                id="metrics-value"
                title="Ценность"
                subtitle="Выручка и удержание после первого рекламного привлечения"
                accent="#DB2777"
                metrics={VALUE_METRICS}
              />
            </div>

            <p className="px-1 text-[11px] text-gray-400">
              Данные по всем кампаниям · не для оценки одной РК
            </p>
          </div>
        </div>
      </main>
    </StatsRangeContext.Provider>
  );
};

export default AudienceMetricsPage;
