import React, { useState } from 'react';
import { Calendar, ChevronDown, Clock } from './Icons';
import {
  financeBalanceWeekDate,
  financeBalanceWeekRangeLabelShort,
  type FinanceBalanceSimView,
} from '../utils/financeBalanceDemo';

export type FinanceBalanceStorySpend = {
  spentRub: number;
  feePercent: number;
  feeRub: number;
  chargeRub: number;
  chargeDate: string;
  postponed: boolean;
  openPostpone: () => void;
  openSchedule: () => void;
};

export const FINANCE_BALANCE_STORY_VARIANTS = [
  { id: '2', label: 'Белая карта с обводкой' },
  { id: '3', label: 'Wise · список с иконками' },
  { id: '4', label: 'Новичку · статус недели' },
  { id: '5', label: 'Новичку · календарь: вт, чт, вс' },
] as const;

export type FinanceBalanceStoryVariant = (typeof FINANCE_BALANCE_STORY_VARIANTS)[number]['id'] | '6';

type Props = {
  variant: FinanceBalanceStoryVariant;
  view: FinanceBalanceSimView;
  weekdayIndex: number;
  spend: FinanceBalanceStorySpend;
};

const TUESDAY = 1;
const THURSDAY = 3;

const fmtRub = (n: number) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n);
const rub = (n: number) => `${fmtRub(n)} ₽`;

/** «8 ноября» → «8 нояб» */
const short = (label: string) => {
  const [day, month, ...rest] = label.split(' ');
  if (!month) return label;
  return [day, month.length > 4 ? month.slice(0, 4) : month, ...rest].join(' ');
};

function useStory(view: FinanceBalanceSimView, day: number, spend: FinanceBalanceStorySpend) {
  const offset = view.weekOffset;
  const tueDone = day >= TUESDAY;
  const thuDone = day >= THURSDAY;
  const accruedRub = (tueDone ? view.tuesdayRub : 0) + (thuDone ? view.thursdayRub : 0);
  const daysToBurn = day < TUESDAY ? TUESDAY - day : 7 - day + TUESDAY;
  return {
    range: financeBalanceWeekRangeLabelShort(undefined, offset),
    tueDate: short(financeBalanceWeekDate(TUESDAY, undefined, offset)),
    thuDate: short(financeBalanceWeekDate(THURSDAY, undefined, offset)),
    tueDone,
    thuDone,
    accruedRub,
    expectedRub: view.netRub - accruedRub,
    reserveCutRub: Math.max(0, view.grossRub - view.netRub),
    burnSoon: daysToBurn <= 2 && view.availableNowRub > 0,
    burnDate: short(financeBalanceWeekDate(TUESDAY, undefined, day < TUESDAY ? offset : offset + 1)),
    zeroWeek: view.grossRub <= 0,
    chargeShort: short(spend.chargeDate),
    feeLabel: `Комиссия ${spend.feePercent}%`,
    daysToCharge: spend.postponed ? null : Math.max(0, 6 - day),
    spentPct: view.grossRub > 0 ? Math.min(100, Math.round((spend.spentRub / view.grossRub) * 100)) : 0,
  };
}

type Story = ReturnType<typeof useStory>;
type VariantProps = Props & { story: Story };

function LimitCalc({ view, dark = false }: { view: FinanceBalanceSimView; dark?: boolean }) {
  const weeks = view.weekProfitRub;
  const hasZero = weeks.includes(0);
  const average = hasZero ? 0 : Math.round((weeks[0] + weeks[1] + weeks[2]) / 3);
  return (
    <div className={`space-y-1.5 text-xs ${dark ? 'text-white/50' : 'text-gray-500'}`}>
      <p className="mb-0">Средняя прибыль по фин. отчётам за 3 недели</p>
      {weeks.map((amount, index) => (
        <div key={index} className="flex justify-between gap-3">
          <span>{financeBalanceWeekRangeLabelShort(undefined, view.weekOffset - 3 + index)}</span>
          <span
            className={`tabular-nums ${amount === 0 ? 'text-red-400' : dark ? 'text-white/80' : 'text-gray-700'}`}
          >
            {rub(amount)}
          </span>
        </div>
      ))}
      <div className={`flex justify-between gap-3 font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>
        <span>{hasZero ? 'Есть неделя с 0 ₽' : 'Среднее'}</span>
        <span className="tabular-nums">{rub(average)}</span>
      </div>
    </div>
  );
}

function Actions({ spend, tone = 'white' }: { spend: FinanceBalanceStorySpend; tone?: 'white' | 'gray' }) {
  const base = `flex h-7 w-full items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-gray-900 transition-colors ${
    tone === 'white' ? 'bg-white hover:bg-gray-50' : 'bg-[#F2F2F7] hover:bg-[#ECECF0]'
  }`;
  return (
    <div className="mt-3 flex gap-1.5">
      <button type="button" onClick={spend.openPostpone} className={base}>
        {spend.postponed ? 'Изменить дату' : 'Отложить списание'}
      </button>
      {spend.postponed ? (
        <button type="button" onClick={spend.openSchedule} className={base}>
          <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
          График списаний
        </button>
      ) : null}
    </div>
  );
}

/** Расход, комиссия, к списанию и кнопки */
function SpendDetails({
  spend,
  story,
  buttonClass,
}: {
  spend: FinanceBalanceStorySpend;
  story: Story;
  buttonClass?: string;
}) {
  const btn = buttonClass ?? 'bg-[#F2F2F7] text-gray-900 hover:bg-[#ECECF0]';
  return (
    <div>
      <div className="space-y-1.5 text-xs text-gray-500">
        <div className="flex justify-between gap-3">
          <span>Расход на {story.range}</span>
          <span className="tabular-nums text-gray-700">{rub(spend.spentRub)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>{story.feeLabel}</span>
          <span className="tabular-nums text-gray-700">{rub(spend.feeRub)}</span>
        </div>
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-3 border-t border-gray-100 pt-2">
        <span className="text-sm font-semibold text-gray-900">К списанию {story.chargeShort}</span>
        <span className="text-sm font-bold tabular-nums text-gray-900">{rub(spend.chargeRub)}</span>
      </div>
      <p className="mb-0 mt-0.5 text-[11px] text-gray-500">С баланса на портале продавца</p>
      <div className="mt-2.5 flex gap-1.5">
        <button
          type="button"
          onClick={spend.openPostpone}
          className={`flex h-7 flex-1 items-center justify-center rounded-lg px-2.5 text-xs font-medium transition-colors ${btn}`}
        >
          {spend.postponed ? 'Изменить дату' : 'Отложить списание'}
        </button>
        {spend.postponed ? (
          <button
            type="button"
            onClick={spend.openSchedule}
            className={`flex h-7 flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors ${btn}`}
          >
            <Calendar className="h-3.5 w-3.5" />
            График
          </button>
        ) : null}
      </div>
    </div>
  );
}

function BurnPill({ story }: { story: Story }) {
  if (!story.burnSoon) return null;
  return (
    <span className="inline-flex h-6 items-center gap-1 rounded-full bg-white px-2.5 text-[11px] text-gray-500">
      <Clock className="h-3 w-3" />
      Обнулится {story.burnDate}
    </span>
  );
}

/** Начисления с разбивкой как в модалке: по графику − резерв = придёт */
function AccrualBreakdown({ view, story, accent = 'text-emerald-600' }: { view: FinanceBalanceSimView; story: Story; accent?: string }) {
  if (story.zeroWeek) return <p className="mb-0 text-xs leading-snug text-gray-500">{view.explain}</p>;
  const tueReserve = Math.max(0, view.grossTuesdayRub - view.tuesdayRub);
  const thuReserve = Math.max(0, view.grossThursdayRub - view.thursdayRub);
  const rows = [
    { key: 'tue', day: `Вт, ${story.tueDate}`, share: '75%', gross: view.grossTuesdayRub, cut: tueReserve, net: view.tuesdayRub, done: story.tueDone },
    { key: 'thu', day: `Чт, ${story.thuDate}`, share: '25%', gross: view.grossThursdayRub, cut: thuReserve, net: view.thursdayRub, done: story.thuDone },
  ];
  return (
    <div className="space-y-2.5">
      {rows.map((row) => (
        <div key={row.key} className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-0 flex items-center gap-1.5 text-xs text-gray-900">
              {row.done ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> : <Clock className="h-3 w-3 text-gray-400" />}
              {row.day} · {row.share}
            </p>
            {row.cut > 0 ? (
              <p className="mb-0 mt-0.5 pl-[18px] text-[11px] tabular-nums text-gray-400">
                {rub(row.gross)} − {rub(row.cut)} резерв
              </p>
            ) : null}
          </div>
          <span className={`shrink-0 text-xs font-semibold tabular-nums ${row.done ? accent : 'text-gray-400'}`}>
            +{rub(row.net)}
          </span>
        </div>
      ))}
    </div>
  );
}

type RowSection = { key: string; title: string; value: string; body: React.ReactNode };

function detailRows(view: FinanceBalanceSimView, spend: FinanceBalanceStorySpend, story: Story): RowSection[] {
  return [
    { key: 'limit', title: `Лимит ${story.range}`, value: rub(view.grossRub), body: <LimitCalc view={view} /> },
    {
      key: 'accrual',
      title: story.accruedRub > 0 ? 'Начислено' : 'Начислим',
      value: `+${rub(story.accruedRub > 0 ? story.accruedRub : Math.max(0, story.expectedRub))}`,
      body: <AccrualBreakdown view={view} story={story} />,
    },
    {
      key: 'charge',
      title: `Списание ${story.chargeShort}`,
      value: rub(spend.chargeRub),
      body: <SpendDetails spend={spend} story={story} />,
    },
  ];
}

/** Выпадающий список подробностей (лимит, начисления, как работает) */
function NoviceSections({
  view,
  story,
  includeCharge,
  spend,
}: {
  view: FinanceBalanceSimView;
  story: Story;
  includeCharge?: boolean;
  spend: FinanceBalanceStorySpend;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const items: RowSection[] = [
    { key: 'limit', title: `Откуда лимит ${story.range}`, value: rub(view.grossRub), body: <LimitCalc view={view} /> },
    {
      key: 'accrual',
      title: story.accruedRub > 0 ? 'Как начислили' : 'Когда начислим',
      value: `+${rub(story.accruedRub > 0 ? story.accruedRub : Math.max(0, story.expectedRub))}`,
      body: <AccrualBreakdown view={view} story={story} />,
    },
    ...(includeCharge
      ? [
          {
            key: 'charge',
            title: `Списание ${story.chargeShort}`,
            value: rub(spend.chargeRub),
            body: <SpendDetails spend={spend} story={story} />,
          },
        ]
      : []),
  ];
  return (
    <div className="mt-2 divide-y divide-gray-100 border-t border-gray-100">
      {items.map((section) => {
        const isOpen = open === section.key;
        return (
          <div key={section.key}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : section.key)}
              aria-expanded={isOpen}
              className="-mx-1.5 flex w-[calc(100%+0.75rem)] items-center gap-2 rounded-lg px-1.5 py-2.5 text-left text-xs transition-colors hover:bg-black/[0.04]"
            >
              <span className="min-w-0 flex-1 text-gray-500">{section.title}</span>
              {section.value ? <span className="text-sm font-normal tabular-nums text-gray-900">{section.value}</span> : null}
              <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen ? <div className="pb-3">{section.body}</div> : null}
          </div>
        );
      })}
    </div>
  );
}

/** 2 — белая карточка с обводкой */
function LightCardVariant({ view, spend, story }: VariantProps) {
  const [open, setOpen] = useState<string | null>(null);
  const sections = [
    { key: 'limit', title: `Лимит ${story.range}`, value: rub(view.grossRub), body: <LimitCalc view={view} /> },
    {
      key: 'accrual',
      title: story.accruedRub > 0 ? 'Начислено' : 'Начислим',
      value: `+${rub(story.accruedRub > 0 ? story.accruedRub : Math.max(0, story.expectedRub))}`,
      body: <AccrualBreakdown view={view} story={story} />,
    },
  ];

  return (
    <div>
      <BurnPill story={story} />
      <div className={`divide-y divide-gray-100 ${story.burnSoon ? 'mt-2' : ''}`}>
        {sections.map((section) => {
          const isOpen = open === section.key;
          return (
            <div key={section.key}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : section.key)}
                aria-expanded={isOpen}
                className="-mx-1.5 flex w-[calc(100%+0.75rem)] items-center gap-2 rounded-lg px-1.5 py-2.5 text-left text-xs transition-colors hover:bg-black/[0.04]"
              >
                <span className="min-w-0 flex-1 text-gray-500">{section.title}</span>
                {section.value ? (
                  <span className="text-sm font-normal tabular-nums text-gray-900">{section.value}</span>
                ) : null}
                <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen ? <div className="pb-3">{section.body}</div> : null}
            </div>
          );
        })}
      </div>
      <div className="mt-2 rounded-xl bg-[#F7F7F9] p-3">
        <SpendDetails
          spend={spend}
          story={story}
          buttonClass="bg-white text-gray-900 ring-1 ring-gray-200 hover:bg-gray-50"
        />
      </div>
    </div>
  );
}

/** 3 — Wise: просторный список, у каждой строки круглая иконка */
function WiseVariant({ view, spend, story }: VariantProps) {
  const [open, setOpen] = useState<string | null>(null);
  const rows = detailRows(view, spend, story);
  return (
    <div>
      <BurnPill story={story} />
      <div className={`divide-y divide-gray-100 ${story.burnSoon ? 'mt-2 border-t border-gray-100' : ''}`}>
        {rows.map((section) => {
          const isOpen = open === section.key;
          return (
            <div key={section.key}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : section.key)}
                aria-expanded={isOpen}
                className="-mx-1.5 flex w-[calc(100%+0.75rem)] items-center gap-2 rounded-lg px-1.5 py-2.5 text-left text-xs transition-colors hover:bg-black/[0.04]"
              >
                <span className="min-w-0 flex-1 text-gray-500">{section.title}</span>
                {section.value ? <span className="text-sm font-normal tabular-nums text-gray-900">{section.value}</span> : null}
                <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen ? <div className="pb-3">{section.body}</div> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** 4 — зелёный/спокойный статус: «К оплате 0 ₽» или сумма к списанию */
function NoviceStatusVariant({ view, spend, story }: VariantProps) {
  const zero = spend.chargeRub === 0;
  return (
    <div>
      <BurnPill story={story} />
      <div className={`rounded-xl p-3 ${zero ? 'bg-[#ECFDF3]' : 'bg-[#F7F7F9]'} ${story.burnSoon ? 'mt-3' : ''}`}>
        <div className="flex items-baseline justify-between gap-3">
          <span className={`text-xs font-semibold ${zero ? 'text-[#067647]' : 'text-gray-900'}`}>
            {zero ? `К оплате ${story.chargeShort} — 0 ₽` : `К списанию ${story.chargeShort}`}
          </span>
          {zero ? null : <span className="text-sm font-normal tabular-nums text-gray-900">{rub(spend.chargeRub)}</span>}
        </div>
        <p className={`mb-0 mt-0.5 text-xs leading-snug ${zero ? 'text-[#067647]/80' : 'text-gray-500'}`}>
          {zero
            ? 'Вы ещё не тратили баланс на этой неделе. Не потратите — ничего не спишем'
            : `Потрачено ${rub(spend.spentRub)}${spend.feeRub > 0 ? ` + комиссия ${rub(spend.feeRub)}` : ''} · спишем на портале продавца`}
        </p>
        <Actions spend={spend} />
      </div>
      <NoviceSections view={view} story={story} includeCharge={!zero} spend={spend} />
    </div>
  );
}

/** 5 — три ключевых дня недели: вторник, четверг и воскресенье */
function NoviceDaysVariant({ view, spend, story }: VariantProps) {
  const days = [
    { day: `Вт, ${story.tueDate}`, label: 'Начислим 75%', value: `+${rub(view.tuesdayRub)}`, done: story.tueDone },
    { day: `Чт, ${story.thuDate}`, label: 'Начислим 25%', value: `+${rub(view.thursdayRub)}`, done: story.thuDone },
    { day: `Вс, ${story.chargeShort}`, label: 'Спишем расход', value: rub(spend.chargeRub), done: false, charge: true },
  ];
  return (
    <div>
      <BurnPill story={story} />
      <div className={`divide-y divide-gray-100 rounded-xl bg-[#F7F7F9] px-3 ${story.burnSoon ? 'mt-3' : ''}`}>
        {days.map((item) => (
          <div key={item.day} className="flex items-center justify-between gap-3 py-2.5 text-xs">
            <div>
              <p className="mb-0 font-semibold text-gray-900">{item.day}</p>
              <p className="mb-0 text-[11px] text-gray-500">{item.label}</p>
            </div>
            <span
              className={`text-sm font-normal tabular-nums ${
                item.charge ? 'text-gray-900' : item.done ? 'text-emerald-600' : 'text-gray-400'
              }`}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
      <Actions spend={spend} tone="gray" />
      <NoviceSections view={view} story={story} includeCharge spend={spend} />
    </div>
  );
}

/**
 * Как вариант 1: серая плашка под строкой «Баланс», внутри — вся инфа из варианта 3
 * (лимит, начисления, списание, как работает) без нумерации.
 */
export function FinanceBalanceWiseNestedPanel({
  view,
  weekdayIndex,
  spend,
}: {
  view: FinanceBalanceSimView;
  weekdayIndex: number;
  spend: FinanceBalanceStorySpend;
}) {
  const story = useStory(view, weekdayIndex, spend);
  const [open, setOpen] = useState<string | null>(null);
  const rows = detailRows(view, spend, story).map((section) =>
    section.key === 'charge'
      ? {
          ...section,
          body: (
            <SpendDetails
              spend={spend}
              story={story}
              buttonClass="bg-white text-gray-900 hover:bg-gray-50"
            />
          ),
        }
      : section,
  );

  return (
    <div className="relative mt-2 rounded-xl bg-[#F3F5F8] p-3">
      <span className="absolute -top-1.5 left-3 h-3 w-3 rotate-45 rounded-[2px] bg-[#F3F5F8]" aria-hidden />
      <BurnPill story={story} />
      <div className={`divide-y divide-black/[0.06] ${story.burnSoon ? 'mt-1' : ''}`}>
        {rows.map((section) => {
          const isOpen = open === section.key;
          return (
            <div key={section.key}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : section.key)}
                aria-expanded={isOpen}
                className="-mx-1.5 flex w-[calc(100%+0.75rem)] items-center gap-2 rounded-lg px-1.5 py-2.5 text-left text-xs transition-colors hover:bg-black/[0.04]"
              >
                <span className="min-w-0 flex-1 text-gray-500">{section.title}</span>
                {section.value ? (
                  <span className="text-sm font-normal tabular-nums text-gray-900">{section.value}</span>
                ) : null}
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen ? <div className="pb-3">{section.body}</div> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Всё о балансе одним блоком под строкой «Счёт» */
export function FinanceBalanceStory(props: Props) {
  const story = useStory(props.view, props.weekdayIndex, props.spend);
  const p = { ...props, story };
  switch (props.variant) {
    case '2':
      return <LightCardVariant {...p} />;
    case '3':
    case '6':
      return <WiseVariant {...p} />;
    case '4':
      return <NoviceStatusVariant {...p} />;
    case '5':
      return <NoviceDaysVariant {...p} />;
    default:
      return <LightCardVariant {...p} />;
  }
}
