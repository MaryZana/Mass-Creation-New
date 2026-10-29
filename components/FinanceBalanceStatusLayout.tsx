import React from 'react';
import { Check } from './Icons';
import { financeBalanceWeekDate, financeBalanceWeekRangeLabelShort } from '../utils/financeBalanceDemo';

type Props = {
  titleId: string;
  /** Свободный баланс «Доступно сейчас» на выбранном шаге/дне */
  availableNowRub: number;
  /** 0 — понедельник … 6 — воскресенье */
  weekdayIndex: number;
  /** Сдвиг текущей недели симуляции (0 = эта, 1 = следующая …) */
  weekOffset?: number;
  grossRub: number;
  inCampaignsRub: number;
  netRub: number;
  tuesdayRub: number;
  thursdayRub: number;
  weekProfitRub?: [number, number, number];
  /** Сколько неиспользованного баланса обнулилось на старте недели */
  unusedWipedRub?: number;
  explain?: string;
};

type CaseKind = 'zero_week' | 'covered' | 'reduced' | 'full';

const fmtRub = (n: number) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n);

function resolveCase(props: {
  grossRub: number;
  netRub: number;
  inCampaignsRub: number;
}): CaseKind {
  if (props.grossRub <= 0) return 'zero_week';
  if (props.netRub <= 0) return 'covered';
  if (props.inCampaignsRub > 0) return 'reduced';
  return 'full';
}

function WeekTiles({ weeks }: { weeks: [number, number, number] }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {weeks.map((amount, index) => (
        <div
          key={`w-${index}`}
          className={`rounded-xl px-3 py-2.5 ${
            amount === 0 ? 'bg-red-50 ring-1 ring-red-200' : 'bg-[#F7F7F9]'
          }`}
        >
          <p className="text-xs text-gray-500">Неделя {index + 1}</p>
          <p
            className={`mt-1 text-sm font-semibold tabular-nums ${
              amount === 0 ? 'text-red-600' : 'text-gray-900'
            }`}
          >
            {fmtRub(amount)} ₽
          </p>
        </div>
      ))}
    </div>
  );
}

const STATUS_STYLE: Record<CaseKind, { bg: string; dot: string; title: string }> = {
  full: { bg: 'bg-emerald-50', dot: 'bg-emerald-500', title: 'Начислим полностью' },
  reduced: { bg: 'bg-amber-50', dot: 'bg-amber-500', title: 'Начисление уменьшено' },
  covered: { bg: 'bg-[#F7F7F9]', dot: 'bg-gray-400', title: 'На этой неделе без начисления' },
  zero_week: { bg: 'bg-red-50', dot: 'bg-red-500', title: 'На этой неделе без начисления' },
};

const TUESDAY = 1;
const THURSDAY = 3;

type DetailRow = {
  label: string;
  value: number;
  muted?: boolean;
  prefix?: string;
  done?: boolean;
};

function DetailRowView({ row }: { row: DetailRow }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <span
        className={`inline-flex min-w-0 items-center gap-2 ${
          row.muted ? 'text-gray-400' : 'text-gray-600'
        }`}
      >
        {row.done ? (
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"
            aria-hidden
          >
            <Check className="h-3 w-3" />
          </span>
        ) : null}
        {row.label}
      </span>
      <span
        className={`shrink-0 tabular-nums ${
          row.muted
            ? 'text-gray-400 line-through'
            : row.value > 0
              ? 'text-gray-900'
              : 'text-gray-400'
        }`}
      >
        {`${row.prefix ?? ''}${fmtRub(row.value)} ₽`}
      </span>
    </div>
  );
}

function WeekBlock({
  weekOffset,
  netRub,
  tuesdayRub,
  thursdayRub,
  inCampaignsRub,
  unusedWipedRub,
  weekdayIndex,
  allDone,
  kind,
  explain,
  weekProfitRub,
}: {
  weekOffset: number;
  netRub: number;
  tuesdayRub: number;
  thursdayRub: number;
  inCampaignsRub: number;
  unusedWipedRub: number;
  weekdayIndex: number;
  /** Прошлая неделя — оба дня уже начислены */
  allDone?: boolean;
  kind: CaseKind;
  explain?: string;
  weekProfitRub?: [number, number, number];
}) {
  const style = STATUS_STYLE[kind];
  const tuesdayDone = allDone || weekdayIndex >= TUESDAY;
  const thursdayDone = allDone || weekdayIndex >= THURSDAY;
  const tuesdayDate = financeBalanceWeekDate(TUESDAY, undefined, weekOffset);
  const thursdayDate = financeBalanceWeekDate(THURSDAY, undefined, weekOffset);

  const reason =
    kind === 'reduced'
      ? `Придёт ${fmtRub(netRub)} ₽ вместо расчёта — ${fmtRub(inCampaignsRub)} ₽ уже в кампаниях`
      : kind === 'covered'
        ? `В кампаниях уже ${fmtRub(inCampaignsRub)} ₽ — больше, чем начисление`
        : kind === 'zero_week'
          ? explain
          : null;

  const statusTitle = allDone || tuesdayDone || thursdayDone
    ? kind === 'reduced'
      ? 'Начислили меньше расчёта'
      : kind === 'full'
        ? null
        : style.title
    : style.title;

  const prefixRows: DetailRow[] = [];
  if (inCampaignsRub > 0) {
    prefixRows.push({ label: 'В кампаниях сейчас', value: inCampaignsRub, prefix: '− ' });
  }
  if (unusedWipedRub > 0 && tuesdayDone) {
    prefixRows.push({
      label: 'Обнулили неиспользованный',
      value: unusedWipedRub,
      muted: true,
      prefix: '− ',
    });
  }

  const tuesdayRow: DetailRow = {
    label: `${tuesdayDone ? 'Начислили' : 'Начислим'} во вторник ${tuesdayDate}`,
    value: tuesdayRub,
    done: tuesdayDone,
  };
  const thursdayRow: DetailRow = {
    label: `${thursdayDone ? 'Начислили' : 'Начислим'} в четверг ${thursdayDate}`,
    value: thursdayRub,
    done: thursdayDone,
  };

  const showStatus = kind !== 'full' && statusTitle;

  return (
    <div>
      <div className="flex items-center justify-between gap-4 border-t border-gray-100 py-3.5">
        <span className="text-sm text-gray-500">
          Ваш доступный лимит на эту неделю {financeBalanceWeekRangeLabelShort(undefined, weekOffset)}
        </span>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">
          {fmtRub(netRub)} ₽
        </span>
      </div>

      <div className="text-sm">
        <div className="divide-y divide-gray-100">
          {prefixRows.map((row) => (
            <div key={row.label}>
              <DetailRowView row={row} />
            </div>
          ))}
          <DetailRowView row={tuesdayRow} />
        </div>
        {showStatus ? (
          <div className={`my-3 rounded-2xl p-4 ${style.bg}`}>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
              <span className={`h-2 w-2 rounded-full ${style.dot}`} aria-hidden />
              {statusTitle}
            </p>
            {reason ? (
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{reason}</p>
            ) : null}
            {kind === 'zero_week' && weekProfitRub ? (
              <div className="mt-3">
                <WeekTiles weeks={weekProfitRub} />
              </div>
            ) : null}
          </div>
        ) : null}
        <div
          className={`divide-y divide-gray-100 ${showStatus ? 'border-t border-gray-100' : ''}`}
        >
          <DetailRowView row={thursdayRow} />
        </div>
      </div>
    </div>
  );
}

export function FinanceBalanceStatusLayout(props: Props) {
  const weekOffset = props.weekOffset ?? 0;
  const kind = resolveCase(props);

  return (
    <>
      <h2 id={props.titleId} className="text-2xl font-bold tracking-tight text-gray-900">
        Начисления баланса
      </h2>

      {/* Только текущая неделя симуляции — прошлые в интерфейсе не показываем */}
      <div className="mt-6">
        <WeekBlock
          weekOffset={weekOffset}
          netRub={props.netRub}
          tuesdayRub={props.tuesdayRub}
          thursdayRub={props.thursdayRub}
          inCampaignsRub={props.inCampaignsRub}
          unusedWipedRub={props.unusedWipedRub ?? 0}
          weekdayIndex={props.weekdayIndex}
          kind={kind}
          explain={props.explain}
          weekProfitRub={props.weekProfitRub}
        />
      </div>

      <div className="mt-1 flex items-center justify-between gap-4 border-t border-gray-100 py-3.5 text-sm">
        <span className="text-gray-600">Остаток сейчас</span>
        <span className="shrink-0 font-semibold tabular-nums text-gray-900">
          {fmtRub(props.availableNowRub)} ₽
        </span>
      </div>
    </>
  );
}
