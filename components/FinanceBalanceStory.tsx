import React, { useState } from 'react';
import { useFinanceLocale } from './FinanceLocaleContext';
import {
  formatFinanceMoney,
  formatPostponedPaymentsLabelI18n,
  tFinance,
  tFinanceTemplate,
} from './financeI18n';
import { Calendar, ChevronDown, Clock, InfoCircleFill } from './Icons';
import {
  financeBalanceWeekChargeDate,
  financeBalanceWeekDate,
  financeBalanceWeekRangeLabel,
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
  /** Сколько платежей уже отложено (включая текущий, если перенесён) */
  postponedCount: number;
  /** Сумма к оплате в воскресенье этой недели (свой расход, если не перенесён, + долги с прошлых) */
  weekChargeRub: number;
  weekChargeDate: string;
  /** Перенесённые с прошлых недель платежи, которые списываются в это воскресенье */
  dueFromEarlier: {
    period: string;
    spentRub: number;
    feePercent: number;
    feeRub: number;
    chargeRub: number;
  }[];
  openPostpone: () => void;
  openSchedule: () => void;
};

export function formatPostponedPaymentsLabel(count: number) {
  return formatPostponedPaymentsLabelI18n(count);
}

export const FINANCE_BALANCE_STORY_VARIANTS = [
  { id: '2', label: 'Белая карта с обводкой' },
  { id: '3', label: 'Wise · список с иконками' },
  { id: '4', label: 'Новичку · статус недели' },
  { id: '5', label: 'Новичку · календарь: вт, чт, вс' },
] as const;

export type FinanceBalanceStoryVariant = (typeof FINANCE_BALANCE_STORY_VARIANTS)[number]['id'] | '6' | '7' | '8';

type Props = {
  variant: FinanceBalanceStoryVariant;
  view: FinanceBalanceSimView;
  weekdayIndex: number;
  spend: FinanceBalanceStorySpend;
};

const TUESDAY = 1;
const THURSDAY = 3;

const fmtRub = (n: number) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n);
const rub = (n: number) => formatFinanceMoney(n);

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
    feeLabel: `${tFinance('commission')} ${spend.feePercent}%`,
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
  const { t, locale } = useFinanceLocale();
  void locale;
  const base = `flex h-7 w-full items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-gray-900 transition-colors ${
    tone === 'white' ? 'bg-white hover:bg-gray-50' : 'bg-[#F2F2F7] hover:bg-[#ECECF0]'
  }`;
  return (
    <div className="mt-3 flex gap-1.5">
      <button type="button" onClick={spend.openPostpone} className={base}>
        {spend.postponed ? t('changeDate') : t('postponeCharge')}
      </button>
      {spend.postponedCount > 0 ? (
        <button type="button" onClick={spend.openSchedule} className={base}>
          <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {formatPostponedPaymentsLabel(spend.postponedCount)}
        </button>
      ) : null}
    </div>
  );
}

function SpendRow({ label, value }: { label: React.ReactNode; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-[13px] leading-5 text-gray-500">
      <span className="min-w-0">{label}</span>
      <span className="shrink-0 tabular-nums">{value}</span>
    </div>
  );
}

function SpendSectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[13px] font-medium text-gray-500">{children}</p>;
}

/** Расход, комиссия, к списанию и кнопки */
function SpendDetails({
  spend,
  story,
  buttonClass,
  spentLabel,
  chargeLabel,
  chargeRub,
}: {
  spend: FinanceBalanceStorySpend;
  story: Story;
  buttonClass?: string;
  spentLabel?: string;
  chargeLabel?: string;
  /** Сумма в итоговой строке; по умолчанию spend.weekChargeRub */
  chargeRub?: number;
}) {
  const { t, locale } = useFinanceLocale();
  void locale;
  const btn = buttonClass ?? 'bg-[#F2F2F7] text-gray-900 hover:bg-[#ECECF0]';
  const totalRub = chargeRub ?? spend.weekChargeRub;
  const hasDueFromEarlier = spend.dueFromEarlier.length > 0;
  const sectioned = spend.postponed || hasDueFromEarlier;

  const thisWeekRows = (
    <div className="space-y-1.5">
      <SpendRow label={spentLabel ?? `${t('spendOn')} ${story.range}`} value={rub(spend.spentRub)} />
      <SpendRow label={story.feeLabel} value={rub(spend.feeRub)} />
    </div>
  );

  const postponeNote = spend.postponed ? (
    <div className="mt-2.5 flex items-start gap-2 rounded-xl bg-white px-3 py-2.5">
      <InfoCircleFill className="mt-0.5 h-4 w-4 shrink-0 text-[#3B82F6]" />
      <p className="mb-0 text-[12px] leading-snug text-gray-600">
        {tFinanceTemplate('paymentMovedNote', { date: spend.chargeDate })}
      </p>
    </div>
  ) : null;

  return (
    <div>
      {sectioned ? (
        <div className="space-y-3">
          <div>
            <SpendSectionTitle>{t('thisWeek')}</SpendSectionTitle>
            {thisWeekRows}
            {postponeNote}
          </div>
          {hasDueFromEarlier ? (
            <div className="border-t border-gray-200/80 pt-3">
              <SpendSectionTitle>{t('deferredFromEarlier')}</SpendSectionTitle>
              <div className="space-y-3">
                {spend.dueFromEarlier.map((item) => (
                  <div key={item.period} className="space-y-1.5">
                    <SpendRow label={`${t('spendFor')} ${item.period}`} value={rub(item.spentRub)} />
                    <SpendRow label={`${t('commission')} ${item.feePercent}%`} value={rub(item.feeRub)} />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        thisWeekRows
      )}
      <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-gray-200/80 pt-3">
        <span className="text-[13px] font-semibold text-gray-900">
          {chargeLabel ?? `${t('toCharge')} ${story.chargeShort}`}
        </span>
        <span className="text-[13px] font-semibold tabular-nums text-gray-900">{rub(totalRub)}</span>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <button
          type="button"
          onClick={spend.openPostpone}
          className={`flex h-9 w-full items-center justify-center rounded-xl px-3 text-[13px] font-medium transition-colors ${btn}`}
        >
          {spend.postponed ? t('changeChargeDate') : t('postponeCharge')}
        </button>
        {spend.postponedCount > 0 ? (
          <button
            type="button"
            onClick={spend.openSchedule}
            className={`flex h-9 w-full items-center justify-center gap-1.5 rounded-xl px-3 text-[13px] font-medium transition-colors ${btn}`}
          >
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            {formatPostponedPaymentsLabel(spend.postponedCount)}
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

type RowSection = {
  key: string;
  title: string;
  value: string;
  body: React.ReactNode;
  status?: 'done' | 'pending';
};

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

function AccrualDayCalc({ share, gross, net }: { share: string; gross: number; net: number }) {
  const cut = Math.max(0, gross - net);
  return (
    <div className="space-y-1.5 text-xs text-gray-500">
      <div className="flex justify-between gap-3">
        <span>{share} лимита</span>
        <span className="tabular-nums text-gray-700">{rub(gross)}</span>
      </div>
      {cut > 0 ? (
        <div className="flex justify-between gap-3">
          <span>Баланс в кампаниях</span>
          <span className="tabular-nums text-gray-700">−{rub(cut)}</span>
        </div>
      ) : null}
      <div className="flex justify-between gap-3 font-medium text-gray-900">
        <span>Придёт на баланс</span>
        <span className="tabular-nums">+{rub(net)}</span>
      </div>
    </div>
  );
}

/** Как detailRows, но начисление разбито на вторник и четверг */
function splitDetailRows(view: FinanceBalanceSimView, spend: FinanceBalanceStorySpend, story: Story): RowSection[] {
  const tueDate = financeBalanceWeekDate(TUESDAY, undefined, view.weekOffset);
  const thuDate = financeBalanceWeekDate(THURSDAY, undefined, view.weekOffset);
  return [
    { key: 'limit', title: `Лимит ${story.range}`, value: rub(view.grossRub), body: <LimitCalc view={view} /> },
    {
      key: 'tue',
      title: `${story.tueDone ? 'Начислено' : 'Начислим'} · Вторник, ${tueDate}`,
      value: `+${rub(view.tuesdayRub)}`,
      body: <AccrualDayCalc share="75%" gross={view.grossTuesdayRub} net={view.tuesdayRub} />,
      status: story.tueDone ? 'done' : 'pending',
    },
    {
      key: 'thu',
      title: `${story.thuDone ? 'Начислено' : 'Начислим'} · Четверг, ${thuDate}`,
      value: `+${rub(view.thursdayRub)}`,
      body: <AccrualDayCalc share="25%" gross={view.grossThursdayRub} net={view.thursdayRub} />,
      status: story.thuDone ? 'done' : 'pending',
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

function ArrowInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M17 7 7 17" />
      <path d="M17 17H7V7" />
    </svg>
  );
}

function ArrowOutIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

function PaymentCard({
  kind,
  title,
  date,
  amount,
  done,
  note,
}: {
  kind: 'in' | 'out';
  title: string;
  date: string;
  amount: string;
  done: boolean;
  note?: string;
}) {
  return (
    <div
      className={`rounded-xl px-3 py-2.5 ${
        done ? 'bg-[#F7F7F9]' : 'border border-dashed border-gray-200'
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            done ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'
          }`}
        >
          {kind === 'in' ? <ArrowInIcon className="h-4 w-4" /> : <ArrowOutIcon className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="mb-0 text-sm leading-tight text-gray-700">{title}</p>
          <p className="mb-0 mt-0.5 text-xs leading-tight text-gray-500">{date}</p>
        </div>
        <span
          className={`text-sm tabular-nums ${
            done ? 'font-semibold text-emerald-600' : 'text-gray-400'
          }`}
        >
          {amount}
        </span>
      </div>
      {note ? <p className="mb-0 mt-1.5 pl-12 text-[11px] tabular-nums text-gray-400">{note}</p> : null}
    </div>
  );
}

/** 7 — как 2, но начисления карточками будущих платежей */
function PaymentsVariant({ view, spend, story }: VariantProps) {
  const [limitOpen, setLimitOpen] = useState(false);
  const tueReserve = Math.max(0, view.grossTuesdayRub - view.tuesdayRub);
  const thuReserve = Math.max(0, view.grossThursdayRub - view.thursdayRub);
  const payments = [
    {
      key: 'tue',
      title: 'Первая часть баланса',
      date: `Вторник, ${financeBalanceWeekDate(TUESDAY, undefined, view.weekOffset)}`,
      amount: view.tuesdayRub,
      done: story.tueDone,
      note: tueReserve > 0 ? `${rub(view.grossTuesdayRub)} − ${rub(tueReserve)} резерв` : undefined,
    },
    {
      key: 'thu',
      title: 'Вторая часть баланса',
      date: `Четверг, ${financeBalanceWeekDate(THURSDAY, undefined, view.weekOffset)}`,
      amount: view.thursdayRub,
      done: story.thuDone,
      note: thuReserve > 0 ? `${rub(view.grossThursdayRub)} − ${rub(thuReserve)} резерв` : undefined,
    },
  ];

  return (
    <div>
      <BurnPill story={story} />
      <div className={story.burnSoon ? 'mt-2' : ''}>
        <button
          type="button"
          onClick={() => setLimitOpen((value) => !value)}
          aria-expanded={limitOpen}
          className="-mx-1.5 flex w-[calc(100%+0.75rem)] items-center gap-2 rounded-lg px-1.5 py-2.5 text-left text-xs transition-colors hover:bg-black/[0.04]"
        >
          <span className="min-w-0 flex-1 text-gray-500">Лимит {story.range}</span>
          <span className="text-sm font-normal tabular-nums text-gray-900">{rub(view.grossRub)}</span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${limitOpen ? 'rotate-180' : ''}`} />
        </button>
        {limitOpen ? <div className="pb-3">{<LimitCalc view={view} />}</div> : null}
      </div>
      {story.zeroWeek ? (
        <p className="mb-0 mt-1 text-xs leading-snug text-gray-500">{view.explain}</p>
      ) : (
        <div className="mt-1 space-y-2">
          {payments.map((payment) => (
            <React.Fragment key={payment.key}>
              <PaymentCard
                kind="in"
                title={payment.title}
                date={payment.date}
                amount={`+${rub(payment.amount)}`}
                done={payment.done}
                note={payment.note}
              />
            </React.Fragment>
          ))}
          {spend.chargeRub > 0 ? (
            <PaymentCard
              kind="out"
              title="Оплата продвижения"
              date={`Воскресенье, ${spend.chargeDate} · на портале продавца`}
              amount={`−${rub(spend.chargeRub)}`}
              done={false}
            />
          ) : null}
        </div>
      )}
      <Actions spend={spend} tone="gray" />
    </div>
  );
}

/** 3 — Wise: просторный список, у каждой строки круглая иконка */
function WiseVariant({ view, spend, story, split = false }: VariantProps & { split?: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  const rows = split ? splitDetailRows(view, spend, story) : detailRows(view, spend, story);
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
                <span className="flex min-w-0 flex-1 items-center gap-1.5 text-gray-500">
                  {section.status === 'done' ? (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                  ) : section.status === 'pending' ? (
                    <Clock className="h-3 w-3 shrink-0 text-gray-400" aria-hidden />
                  ) : null}
                  {section.title}
                </span>
                {section.value ? (
                  <span
                    className={`text-sm font-normal tabular-nums ${
                      section.status === 'done'
                        ? 'text-emerald-600'
                        : section.status === 'pending'
                          ? 'text-gray-400'
                          : 'text-gray-900'
                    }`}
                  >
                    {section.value}
                  </span>
                ) : null}
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

/** Раскрывающаяся строка «Списание …» с расходом, комиссией и кнопками */
export function FinanceBalanceChargeRow({
  view,
  weekdayIndex,
  spend,
}: {
  view: FinanceBalanceSimView;
  weekdayIndex: number;
  spend: FinanceBalanceStorySpend;
}) {
  const { t, locale } = useFinanceLocale();
  void locale;
  const story = useStory(view, weekdayIndex, spend);
  const [open, setOpen] = useState(false);
  const weekChargeDate = spend.weekChargeDate;
  const weekChargeRub = spend.weekChargeRub;
  return (
    <div className="border-t border-gray-100">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="-mx-1.5 flex w-[calc(100%+0.75rem)] items-center gap-2 rounded-lg px-1.5 py-2.5 text-left text-xs"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-gray-500">{t('dueToPay')} {weekChargeDate}</span>
          <span className="mt-0.5 block text-[11px] font-normal text-gray-400">
            {t('fromBalanceOnPortal')}
          </span>
        </span>
        <span className="text-sm font-normal tabular-nums text-gray-900">{rub(weekChargeRub)}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? (
        <div className="mt-1 rounded-2xl bg-[#F0F0F2] p-4">
          <SpendDetails
            spend={spend}
            story={story}
            buttonClass="bg-white text-gray-900 hover:bg-gray-50"
            spentLabel={`${t('spendFor')} ${financeBalanceWeekRangeLabel(undefined, view.weekOffset)}`}
            chargeLabel={`${t('totalDue')} ${weekChargeDate}`}
            chargeRub={weekChargeRub}
          />
        </div>
      ) : null}
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
    case '7':
      return <PaymentsVariant {...p} />;
    case '8':
      return <WiseVariant {...p} split />;
    default:
      return <LightCardVariant {...p} />;
  }
}
