import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, MoreVertical, X } from './Icons';

function formatRub(value: number) {
  return value.toLocaleString('ru-RU', { useGrouping: true });
}

function formatClicks(value: number) {
  return value.toLocaleString('ru-RU');
}

type BudgetClickPoint = {
  label: string;
  dateShort: string;
  budgetRub: number;
  clicks: number;
  spentRub: number;
  source: 'base' | 'automation';
};

/** Демо-ряд: сильный рост бюджета → ещё более сильный рост кликов. */
export const BUDGET_CLICKS_SERIES: BudgetClickPoint[] = [
  { label: '18 августа', dateShort: '18.08', budgetRub: 1000, clicks: 28, spentRub: 970, source: 'base' },
  { label: '19 августа', dateShort: '19.08', budgetRub: 1050, clicks: 31, spentRub: 1020, source: 'base' },
  { label: '20 августа', dateShort: '20.08', budgetRub: 1300, clicks: 54, spentRub: 1280, source: 'automation' },
  { label: '21 августа', dateShort: '21.08', budgetRub: 1700, clicks: 96, spentRub: 1685, source: 'automation' },
  { label: '22 августа', dateShort: '22.08', budgetRub: 1900, clicks: 124, spentRub: 1880, source: 'automation' },
  { label: '23 августа', dateShort: '23.08', budgetRub: 2100, clicks: 152, spentRub: 2090, source: 'automation' },
  { label: '24 августа', dateShort: '24.08', budgetRub: 2200, clicks: 168, spentRub: 410, source: 'automation' },
];

function relationHint(point: BudgetClickPoint, prev: BudgetClickPoint | undefined) {
  if (!prev) return 'Старт: низкий бюджет — мало кликов';
  const dBudget = point.budgetRub - prev.budgetRub;
  const dClicks = point.clicks - prev.clicks;
  if (dBudget === 0 && dClicks === 0) return 'Бюджет не менялся — клики на том же уровне';
  if (dBudget > 0 && dClicks > 0) {
    const budgetPct = Math.round((dBudget / prev.budgetRub) * 100);
    const clicksPct = Math.round((dClicks / prev.clicks) * 100);
    if (budgetPct >= 20) {
      return `Бюджет +${budgetPct}% → клики +${clicksPct}%`;
    }
    return `Подняли бюджет на ${formatRub(dBudget)} ₽ — кликов +${formatClicks(dClicks)}`;
  }
  if (dBudget < 0 && dClicks < 0) {
    return `Снизили бюджет — кликов −${formatClicks(Math.abs(dClicks))}`;
  }
  if (dBudget > 0 && dClicks < 0) {
    return 'Бюджет вырос, клики не подтянулись';
  }
  return 'Клики изменились при том же бюджете';
}

export function SpendHistoryModal({
  isOpen,
  onClose,
  series,
}: {
  isOpen: boolean;
  onClose: () => void;
  series: BudgetClickPoint[];
}) {
  if (!isOpen) return null;

  const rows = [...series].reverse();
  const totalSpent = series.reduce((sum, p) => sum + p.spentRub, 0);

  return (
    <div className="fixed inset-0 z-[110] bg-black/50" onClick={onClose} role="presentation">
      <div className="flex h-full w-full justify-end" onClick={onClose}>
        <div
          className="flex h-full max-h-full min-w-0 items-stretch gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 flex-col justify-start pt-5 pl-3">
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-500 shadow-md hover:bg-gray-50 hover:text-gray-700"
              aria-label="Закрыть"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            className="flex h-full w-[560px] max-w-[calc(100vw-3rem)] shrink-0 flex-col overflow-hidden bg-white shadow-2xl animate-in slide-in-from-right duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="spend-history-title"
          >
            <div className="shrink-0 px-6 pt-6 pb-4 sm:px-8">
              <h2 id="spend-history-title" className="text-xl font-bold leading-snug text-gray-900">
                История списаний
              </h2>
              <p className="mb-0 mt-2 text-sm text-gray-500">
                Сколько списали с дневного лимита за каждый день
              </p>
            </div>

            <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-6 pb-8 sm:px-8">
              <div className="mb-4 rounded-xl bg-[#F6F6F9] px-4 py-3">
                <p className="mb-0 text-xs text-gray-500">За 7 дней</p>
                <p className="mb-0 mt-1 text-lg font-semibold tabular-nums text-gray-900">
                  {formatRub(totalSpent)} ₽
                </p>
              </div>

              <ul className="m-0 divide-y divide-gray-100 p-0">
                {rows.map((row, index) => {
                  const isToday = index === 0;
                  const progress = row.budgetRub > 0 ? Math.min(100, (row.spentRub / row.budgetRub) * 100) : 0;
                  return (
                    <li key={row.dateShort} className="list-none py-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="mb-0 text-sm font-medium text-gray-900">
                            {row.label}
                            {isToday ? (
                              <span className="ml-2 text-xs font-normal text-gray-400">сегодня</span>
                            ) : null}
                          </p>
                          <p className="mb-0 mt-1 text-xs text-gray-500">
                            {row.source === 'automation'
                              ? 'Лимит подняли по правилам'
                              : 'Базовый дневной лимит'}
                          </p>
                        </div>
                        <p className="mb-0 shrink-0 text-right text-sm tabular-nums text-gray-900">
                          <span className="font-semibold">{formatRub(row.spentRub)} ₽</span>
                          <span className="text-gray-400"> из {formatRub(row.budgetRub)} ₽</span>
                        </p>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-[#9A41FE]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function smoothPath(xs: number[], ys: number[]) {
  if (xs.length === 0) return '';
  if (xs.length === 1) return `M ${xs[0].toFixed(1)} ${ys[0].toFixed(1)}`;
  let d = `M ${xs[0].toFixed(1)} ${ys[0].toFixed(1)}`;
  for (let i = 0; i < xs.length - 1; i++) {
    const x0 = xs[Math.max(0, i - 1)];
    const y0 = ys[Math.max(0, i - 1)];
    const x1 = xs[i];
    const y1 = ys[i];
    const x2 = xs[i + 1];
    const y2 = ys[i + 1];
    const x3 = xs[Math.min(xs.length - 1, i + 2)];
    const y3 = ys[Math.min(ys.length - 1, i + 2)];
    const cp1x = x1 + (x2 - x0) / 6;
    const cp1y = y1 + (y2 - y0) / 6;
    const cp2x = x2 - (x3 - x1) / 6;
    const cp2y = y2 - (y3 - y1) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }
  return d;
}

function BudgetClicksChart({
  series,
  activeIndex,
  onHoverIndex,
  onSelectIndex,
}: {
  series: BudgetClickPoint[];
  activeIndex: number | null;
  onHoverIndex: (index: number | null) => void;
  onSelectIndex: (index: number) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const width = 280;
  const height = 80;
  const padX = 12;
  const padY = 10;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const budgets = series.map((p) => p.budgetRub);
  const clicks = series.map((p) => p.clicks);
  const minB = Math.min(...budgets);
  const maxB = Math.max(...budgets);
  const minC = Math.min(...clicks);
  const maxC = Math.max(...clicks);

  const xs = series.map((_, i) => padX + (i / Math.max(1, series.length - 1)) * innerW);
  const budgetYs = budgets.map(
    (v) => padY + innerH - ((v - minB) / Math.max(1, maxB - minB)) * innerH,
  );
  const clickYs = clicks.map(
    (v) => padY + innerH - ((v - minC) / Math.max(1, maxC - minC)) * innerH,
  );

  const clicksLine = smoothPath(xs, clickYs);
  const budgetLine = smoothPath(xs, budgetYs);
  const clicksArea =
    clicksLine &&
    `${clicksLine} L ${xs[xs.length - 1].toFixed(1)} ${(padY + innerH).toFixed(1)} L ${xs[0].toFixed(1)} ${(padY + innerH).toFixed(1)} Z`;

  const indexFromClientX = (clientX: number) => {
    const el = wrapRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round(ratio * (series.length - 1));
  };

  const active = activeIndex != null ? series[activeIndex] : null;
  const activePrev = activeIndex != null && activeIndex > 0 ? series[activeIndex - 1] : undefined;

  return (
    <div
      ref={wrapRef}
      className="relative h-20 w-[280px] max-w-full cursor-pointer select-none"
      onMouseLeave={() => onHoverIndex(null)}
      onMouseMove={(e) => onHoverIndex(indexFromClientX(e.clientX))}
      onClick={(e) => onSelectIndex(indexFromClientX(e.clientX))}
      role="img"
      aria-label="Чем выше дневной бюджет, тем сильнее растут клики"
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="h-20 w-[280px] max-w-full overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="clicksGrowthFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22C55E" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#22C55E" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {activeIndex != null ? (
          <line
            x1={xs[activeIndex]}
            y1={padY}
            x2={xs[activeIndex]}
            y2={height - padY}
            stroke="#E5E7EB"
            strokeWidth="1.5"
          />
        ) : null}
        {clicksArea ? <path d={clicksArea} fill="url(#clicksGrowthFill)" stroke="none" /> : null}
        <path
          d={budgetLine}
          fill="none"
          stroke="#9A41FE"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
        />
        <path
          d={clicksLine}
          fill="none"
          stroke="#16A34A"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {series.map((_, i) => (
          <g key={i}>
            <circle
              cx={xs[i]}
              cy={budgetYs[i]}
              r={activeIndex === i ? 3.5 : 2}
              fill="#9A41FE"
            />
            <circle
              cx={xs[i]}
              cy={clickYs[i]}
              r={activeIndex === i ? 4.5 : 2.8}
              fill="#16A34A"
            />
          </g>
        ))}
      </svg>

      {active && activeIndex != null ? (
        <div
          className="pointer-events-none absolute z-20 w-[220px] rounded-lg bg-gray-900 px-3 py-2 text-left text-[11px] leading-snug text-white shadow-lg"
          style={{
            left: `${(xs[activeIndex] / width) * 100}%`,
            top: 0,
            transform: `translate(${xs[activeIndex] / width > 0.62 ? '-108%' : '8%'}, -8px)`,
          }}
        >
          <p className="mb-1 font-medium text-white/90">{active.label}</p>
          <p className="mb-0.5">
            Бюджет:{' '}
            <span className="font-semibold tabular-nums">{formatRub(active.budgetRub)} ₽</span>
          </p>
          <p className="mb-1">
            Клики: <span className="font-semibold tabular-nums">{formatClicks(active.clicks)}</span>
          </p>
          <p className="mb-0 text-white/65">{relationHint(active, activePrev)}</p>
        </div>
      ) : null}
    </div>
  );
}

/** Концепт единого блока «Бюджет» (4-я кампания): диапазон + график клики/бюджет. */
export function BudgetRangeConceptBlock({
  minDailyLimitRub = 1000,
  maxDailyLimitRub = 1500,
  strategyLabel = 'Оптимизация от ДРР',
  displayMode = 'range',
  maxSpendPeriod = 'day',
  onOpenSettings,
}: {
  minDailyLimitRub?: number;
  maxDailyLimitRub?: number;
  strategyLabel?: string;
  /** range — диапазон; maxOnly — одна сумма максимума (стратегия «Фиксированный») */
  displayMode?: 'range' | 'maxOnly';
  /** Период лимита для maxOnly */
  maxSpendPeriod?: 'day' | 'week';
  onOpenSettings?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSpendHistoryOpen, setIsSpendHistoryOpen] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [pinnedIndex, setPinnedIndex] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const series = useMemo(() => BUDGET_CLICKS_SERIES, []);
  const activeIndex = hoverIndex ?? pinnedIndex;
  const isMaxSpend = displayMode === 'maxOnly';
  const periodSuffix = !isMaxSpend
    ? 'в день'
    : maxSpendPeriod === 'week'
      ? 'в неделю'
      : 'в день';

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  return (
    <div className="mb-8 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-900">Бюджет и эффективность</h2>
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
            aria-label="Действия с бюджетом"
            aria-expanded={menuOpen}
            aria-haspopup="true"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <MoreVertical className="h-5 w-5" aria-hidden />
          </button>
          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-full z-50 mt-1.5 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                className="w-full px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                onClick={() => {
                  setMenuOpen(false);
                  setIsSpendHistoryOpen(true);
                }}
              >
                История списаний
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-5">
        <div className="min-w-0 shrink-0 lg:max-w-[420px]">
          <button
            type="button"
            onClick={() => onOpenSettings?.()}
            className="group inline-flex max-w-full flex-wrap items-baseline gap-x-1.5 text-left"
            aria-label="Изменить лимит бюджета"
          >
            <span className="text-[22px] font-semibold leading-none tracking-tight text-gray-900 tabular-nums">
              {isMaxSpend
                ? `до ${formatRub(maxDailyLimitRub)} ₽`
                : `${formatRub(minDailyLimitRub)} – ${formatRub(maxDailyLimitRub)} ₽`}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[22px] font-semibold leading-none text-gray-900">
              {periodSuffix}
              <ChevronDown
                className="h-4 w-4 shrink-0 text-gray-400 transition-colors group-hover:text-gray-600"
                aria-hidden
              />
            </span>
          </button>
          {!isMaxSpend && strategyLabel ? (
            <p className="mb-0 mt-2 text-xs leading-snug text-gray-400">{strategyLabel}</p>
          ) : null}
        </div>

        <div className="hidden h-14 w-px shrink-0 bg-gray-100 lg:block" aria-hidden />

        <div className="flex min-w-0 shrink-0 justify-start">
          <div className="w-[280px] max-w-full shrink-0">
          <BudgetClicksChart
            series={series}
            activeIndex={activeIndex}
            onHoverIndex={setHoverIndex}
            onSelectIndex={(index) => setPinnedIndex((prev) => (prev === index ? null : index))}
          />
          <div className="mt-1.5 flex items-center gap-4 text-[11px] text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" aria-hidden />
              Клики
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#9A41FE]" aria-hidden />
              Бюджет
            </span>
          </div>
          </div>
        </div>
      </div>

      <SpendHistoryModal
        isOpen={isSpendHistoryOpen}
        onClose={() => setIsSpendHistoryOpen(false)}
        series={series}
      />
    </div>
  );
}
