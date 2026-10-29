import React, { useState } from 'react';
import { Calendar, Check, ChevronDown, Clock, Coins, Info, Wallet } from './Icons';
import {
  FINANCE_BALANCE_WEEK_DAYS,
  buildFinanceBalanceSimView,
  financeBalanceWeekDate,
  financeBalanceWeekRangeLabelShort,
  type FinanceBalanceSimView,
} from '../utils/financeBalanceDemo';

export const FINANCE_BALANCE_MODAL_VARIANTS = [
  { id: 'current', label: '1' },
  { id: 'timeline', label: '2' },
  { id: 'calendar', label: '3' },
  { id: 'limit', label: '4' },
  { id: 'qa', label: '5' },
  { id: 'statement', label: '6' },
  { id: 'feed', label: '7' },
  { id: 'turnover', label: '8' },
  { id: 'chart', label: '9' },
  { id: 'schedule', label: '10' },
] as const;

/** Поступление: стрелка вниз-влево */
function ArrowInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M17 7 7 17" />
      <path d="M17 17H7V7" />
    </svg>
  );
}

/** Списание: стрелка вверх-вправо */
function ArrowOutIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

/** Обнуление остатка: перечёркнутый круг */
function ResetIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path d="m6.5 17.5 11-11" />
    </svg>
  );
}

type LedgerDay = {
  index: number;
  date: string;
  openRub: number;
  wipedRub: number;
  accrualRub: number;
  spentRub: number;
  closeRub: number;
  /** День ещё не наступил — показываем как план */
  planned: boolean;
};

/** Раскладка недели по дням: входящий остаток, обнуление, начисление, траты, исходящий */
function buildLedger(view: FinanceBalanceSimView, today: number): LedgerDay[] {
  const days: LedgerDay[] = [];
  let open = view.startAvailableRub;
  for (let index = 0; index < 7; index += 1) {
    const wiped = index === TUESDAY ? open : 0;
    const accrual = index === TUESDAY ? view.tuesdayRub : index === THURSDAY ? view.thursdayRub : 0;
    const dayView = buildFinanceBalanceSimView(view.weekId, index, view.adjust);
    const prevView = index > 0 ? buildFinanceBalanceSimView(view.weekId, index - 1, view.adjust) : null;
    const spent = dayView.spentThisWeekRub - (prevView?.spentThisWeekRub ?? 0);
    const close = dayView.availableNowRub;
    days.push({
      index,
      date: financeBalanceWeekDate(index, undefined, view.weekOffset),
      openRub: open,
      wipedRub: wiped,
      accrualRub: accrual,
      spentRub: spent,
      closeRub: close,
      planned: index > today,
    });
    open = close;
  }
  return days;
}

function sumBy(days: LedgerDay[], pick: (day: LedgerDay) => number) {
  return days.reduce((total, day) => total + pick(day), 0);
}

export type FinanceBalanceModalVariantId = (typeof FINANCE_BALANCE_MODAL_VARIANTS)[number]['id'];

const MODAL_VARIANT_KEY = 'finance_balance_modal_variant';

export function readFinanceBalanceModalVariant(): FinanceBalanceModalVariantId {
  try {
    const raw = sessionStorage.getItem(MODAL_VARIANT_KEY);
    const match = FINANCE_BALANCE_MODAL_VARIANTS.find((item) => item.id === raw);
    if (match) return match.id;
  } catch {
    /* ignore */
  }
  return 'current';
}

export function writeFinanceBalanceModalVariant(id: FinanceBalanceModalVariantId) {
  try {
    sessionStorage.setItem(MODAL_VARIANT_KEY, id);
  } catch {
    /* ignore */
  }
}

const fmtRub = (n: number) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n);

const TUESDAY = 1;
const THURSDAY = 3;
const DAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

function daysWord(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'день';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня';
  return 'дней';
}

export const FINANCE_BALANCE_SPEND_VIEWS = [
  { id: 'row', label: '1' },
  { id: 'card', label: '2' },
  { id: 'tiles', label: '3' },
  { id: 'expand', label: '4' },
  { id: 'bars', label: '5' },
  { id: 'split', label: '6' },
  { id: 'pending', label: '7' },
  { id: 'summary', label: '8' },
  { id: 'chip', label: '9' },
  { id: 'ring', label: '10' },
  { id: 'buckets', label: '11' },
  { id: 'rules', label: '12' },
  { id: 'stack', label: '13' },
  { id: 'portal', label: '14' },
  { id: 'weekline', label: '15' },
] as const;

export type FinanceBalanceSpendViewId = (typeof FINANCE_BALANCE_SPEND_VIEWS)[number]['id'];

const SPEND_VIEW_KEY = 'finance_balance_spend_view';

export function readFinanceBalanceSpendView(): FinanceBalanceSpendViewId {
  try {
    const raw = sessionStorage.getItem(SPEND_VIEW_KEY);
    const match = FINANCE_BALANCE_SPEND_VIEWS.find((item) => item.id === raw);
    if (match) return match.id;
  } catch {
    /* ignore */
  }
  return 'row';
}

export function writeFinanceBalanceSpendView(id: FinanceBalanceSpendViewId) {
  try {
    sessionStorage.setItem(SPEND_VIEW_KEY, id);
  } catch {
    /* ignore */
  }
}

type Props = {
  variant: Exclude<FinanceBalanceModalVariantId, 'current'>;
  titleId: string;
  view: FinanceBalanceSimView;
  weekdayIndex: number;
  spendView?: FinanceBalanceSpendViewId;
};

function useDerived(view: FinanceBalanceSimView, day: number) {
  const offset = view.weekOffset;
  return {
    range: financeBalanceWeekRangeLabelShort(undefined, offset),
    tuesdayDate: financeBalanceWeekDate(TUESDAY, undefined, offset),
    thursdayDate: financeBalanceWeekDate(THURSDAY, undefined, offset),
    burnDate: financeBalanceWeekDate(TUESDAY, undefined, day < TUESDAY ? offset : offset + 1),
    daysToBurn: day < TUESDAY ? TUESDAY - day : 7 - day + TUESDAY,
    tuesdayDone: day >= TUESDAY,
    thursdayDone: day >= THURSDAY,
    accruedRub: (day >= TUESDAY ? view.tuesdayRub : 0) + (day >= THURSDAY ? view.thursdayRub : 0),
    zeroWeek: view.grossRub <= 0,
  };
}

/** Из чего сложился лимит недели: прибыль 3 недель → среднее → минус уже в кампаниях */
function LimitCalculation({ view }: { view: FinanceBalanceSimView }) {
  const weeks = view.weekProfitRub;
  const hasZero = weeks.includes(0);
  const average = hasZero ? 0 : Math.round((weeks[0] + weeks[1] + weeks[2]) / 3);
  const row = 'flex items-baseline justify-between gap-4 py-1.5';

  return (
    <div className="mt-3 rounded-xl bg-white/5 p-3.5 text-xs text-white/60">
      <p className="mb-2 leading-snug text-white/80">Лимит считается как средняя прибыль за 3 недели</p>
      <p className="mb-1 text-white/80">Прибыль по фин. отчётам</p>
      {weeks.map((amount, index) => (
        <div key={index} className={row}>
          <span>{financeBalanceWeekRangeLabelShort(undefined, view.weekOffset - 3 + index)}</span>
          <span className={`tabular-nums ${amount === 0 ? 'text-red-300' : 'text-white/80'}`}>
            {fmtRub(amount)} ₽
          </span>
        </div>
      ))}
      <div className={`${row} mt-1 border-t border-white/10 pt-2.5`}>
        <span>{hasZero ? 'Есть неделя с 0 ₽ — начисления нет' : 'Среднее за 3 недели'}</span>
        <span className="tabular-nums text-white/80">{fmtRub(average)} ₽</span>
      </div>
      <div className={`${row} font-semibold text-white`}>
        <span>Лимит недели</span>
        <span className="tabular-nums">{fmtRub(view.grossRub)} ₽</span>
      </div>
      {view.inCampaignsRub > 0 && view.grossRub > 0 ? (
        <>
          <div className={`${row} mt-1 border-t border-white/10 pt-2.5`}>
            <span>Резерв на кампаниях</span>
            <span className="tabular-nums text-white/80">−{fmtRub(view.reservePendingRub)} ₽</span>
          </div>
          <div className={`${row} font-semibold text-white`}>
            <span>Придёт на баланс</span>
            <span className="tabular-nums">{fmtRub(view.netRub)} ₽</span>
          </div>
        </>
      ) : null}
    </div>
  );
}

/** 15 — Revolut: ответы на частые вопросы, раскрываются по клику */
function HowFaq() {
  const [open, setOpen] = useState<number | null>(0);
  const items: { q: string; a: string[] }[] = [
    {
      q: 'Что такое баланс?',
      a: [
        'Это деньги на рекламу и продвижение, которые мы начисляем вам каждую неделю как деньги в долг. Их можно тратить так же, как деньги на счёте.',
        'Платить нужно только за то, что вы потратили, — и только в конце недели.',
      ],
    },
    {
      q: 'Откуда он берётся?',
      a: [
        'Мы сами считаем лимит недели по вашей прибыли из финансовых отчётов за последние 3 недели. Ничего подключать или пополнять не нужно.',
        'Лимит приходит в два этапа: 75% во вторник и 25% в четверг. Если в одной из трёх недель прибыль 0 ₽, на этой неделе начисления не будет.',
      ],
    },
    {
      q: 'Нужно ли его тратить?',
      a: [
        'Нет. Баланс — это возможность, а не обязательство. Тратьте его, когда нужно запустить продвижение или рекламу.',
        'Не потратили — ничего не платите и ничего не теряете.',
      ],
    },
    {
      q: 'Как списываются деньги?',
      a: [
        'Когда вы пополняете кампанию, деньги сначала списываются со счёта. Если на счёте не хватает, остальное берём с баланса.',
      ],
    },
    {
      q: 'Сколько я заплачу?',
      a: [
        'Ровно столько, сколько потратили с баланса за неделю. Ничего сверху не берём.',
        'В воскресенье выставим эту сумму на портале продавца. Например, из 20 000 ₽ потратили 12 000 ₽ — заплатите 12 000 ₽.',
      ],
    },
    {
      q: 'Что будет с остатком?',
      a: [
        'Неиспользованный остаток не переносится на следующую неделю. Во вторник он обнулится, и мы начислим новый лимит.',
        'Копить баланс не получится, но и платить за остаток не нужно.',
      ],
    },
    {
      q: 'Это баланс на портале продавца?',
      a: [
        'Нет. На портале продавца — ваши деньги от продаж. Баланс — отдельная сумма на продвижение, которую начисляем мы.',
        'Ваши деньги на портале не меняются, пока вы не потратите баланс. Там появится только сумма потраченного.',
      ],
    },
    {
      q: 'Почему пришло меньше лимита?',
      a: [
        'Если на кампаниях лежат деньги, которые ещё не потрачены, мы вычитаем их из начисления. Лимит недели при этом не меняется — просто на баланс придёт меньше.',
        'Например, лимит 15 000 ₽, в кампаниях 5 000 ₽ — придёт 10 000 ₽. Если в кампаниях больше лимита, начисление будет 0 ₽.',
      ],
    },
  ];
  return (
    <div>
      <div className="-mx-3 space-y-1">
        {items.map((item, index) => {
          const isOpen = open === index;
          return (
            <div key={item.q} className="rounded-xl transition-colors hover:bg-[#F7F7F9]">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : index)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-3 px-3 py-4 text-left"
              >
                <span className="text-[15px] font-semibold text-gray-900">{item.q}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen ? (
                <div className="space-y-3 px-3 pb-5 text-sm leading-relaxed text-gray-500">
                  {item.a.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BalanceIntro() {
  return (
    <div className="[&_p]:mb-0">
      <HowFaq />
    </div>
  );
}

function Title({ id }: { id: string }) {
  return (
    <>
      <h2 id={id} className="text-2xl font-bold tracking-tight text-gray-900">
        Баланс
      </h2>
      <BalanceIntro />
    </>
  );
}

function ZeroWeekNote({
  title = 'На этой неделе без начисления',
  explain,
  calcOpen,
  onToggleCalc,
}: {
  title?: string;
  explain: string;
  calcOpen?: boolean;
  onToggleCalc?: () => void;
}) {
  return (
    <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm">
      <p className="font-semibold text-gray-900">{title}</p>
      <p className="mt-1 leading-relaxed text-gray-600">{explain}</p>
      {onToggleCalc ? (
        <button
          type="button"
          onClick={onToggleCalc}
          aria-expanded={calcOpen}
          className="mt-3 inline-flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          {calcOpen ? 'Скрыть расчёт' : 'Показать расчёт'}
        </button>
      ) : null}
    </div>
  );
}

/** 2 — крупный остаток + вертикальная лента событий недели */
function TimelineVariant({ titleId, view, weekdayIndex }: Omit<Props, 'variant'>) {
  const d = useDerived(view, weekdayIndex);
  const events = [
    {
      key: 'tue',
      date: `Вторник, ${d.tuesdayDate}`,
      title: d.tuesdayDone ? 'Начислили' : 'Начислим',
      amount: `+${fmtRub(view.tuesdayRub)} ₽`,
      done: d.tuesdayDone,
      note:
        view.unusedWipedRub > 0 && d.tuesdayDone
          ? `Перед этим сгорел остаток прошлой недели — ${fmtRub(view.unusedWipedRub)} ₽`
          : null,
      tone: 'accrual' as const,
    },
    {
      key: 'thu',
      date: `Четверг, ${d.thursdayDate}`,
      title: d.thursdayDone ? 'Начислили' : 'Начислим',
      amount: `+${fmtRub(view.thursdayRub)} ₽`,
      done: d.thursdayDone,
      note: null,
      tone: 'accrual' as const,
    },
    {
      key: 'burn',
      date: `Вторник, ${d.burnDate}`,
      title: 'Остаток сгорит',
      amount: view.availableNowRub > 0 ? `−${fmtRub(view.availableNowRub)} ₽` : '0 ₽',
      done: false,
      note: 'Сразу после этого придёт начисление на следующую неделю',
      tone: 'burn' as const,
    },
  ];

  return (
    <>
      <Title id={titleId} />
      <div className="mt-6 rounded-2xl bg-[#F7F7F9] p-5">
        <p className="text-sm text-gray-500">Сейчас на балансе</p>
        <p className="mt-1 text-[36px] font-bold leading-none tabular-nums tracking-tight text-gray-900">
          {fmtRub(view.availableNowRub)} ₽
        </p>
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
          <Clock className="h-3.5 w-3.5" />
          Можно тратить ещё {d.daysToBurn} {daysWord(d.daysToBurn)}
        </p>
      </div>

      {d.zeroWeek ? <ZeroWeekNote explain={view.explain} /> : null}

      <p className="mt-7 text-sm font-semibold text-gray-900">Неделя {d.range}</p>
      <ol className="mt-3">
        {events.map((event, index) => (
          <li key={event.key} className="relative flex gap-3 pb-5 last:pb-0">
            {index < events.length - 1 ? (
              <span className="absolute left-[13px] top-8 h-[calc(100%-2rem)] w-0.5 bg-gray-100" aria-hidden />
            ) : null}
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                event.tone === 'burn'
                  ? 'bg-amber-100 text-amber-700'
                  : event.done
                    ? 'bg-emerald-500 text-white'
                    : 'bg-[#F3E8FF] text-[#7C3AED]'
              }`}
              aria-hidden
            >
              {event.tone === 'burn' ? (
                <Clock className="h-3.5 w-3.5" />
              ) : event.done ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <ArrowInIcon className="h-3.5 w-3.5" />
              )}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium text-gray-900">{event.title}</p>
                <p
                  className={`shrink-0 text-sm font-semibold tabular-nums ${
                    event.tone === 'burn' ? 'text-amber-700' : 'text-gray-900'
                  }`}
                >
                  {event.amount}
                </p>
              </div>
              <p className="mt-0.5 text-xs text-gray-500">{event.date}</p>
              {event.note ? <p className="mt-1.5 text-xs leading-relaxed text-gray-500">{event.note}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

/** 3 — календарь недели с выбором дня и сводкой */
function CalendarVariant({
  titleId,
  view,
  weekdayIndex,
}: Omit<Props, 'variant'>) {
  const d = useDerived(view, weekdayIndex);
  const [selected, setSelected] = useState(weekdayIndex);
  const dayView = buildFinanceBalanceSimView(
    view.weekId,
    selected,
    view.adjust,
  );

  let headline: string;
  let detail: string;
  if (selected === TUESDAY) {
    headline = `+${fmtRub(view.tuesdayRub)} ₽ на баланс`;
    detail =
      dayView.unusedWipedRub > 0
        ? `Сначала сгорает остаток прошлой недели — ${fmtRub(dayView.unusedWipedRub)} ₽, потом приходит начисление`
        : 'Основная часть недельного начисления — 75%';
  } else if (selected === THURSDAY) {
    headline = `+${fmtRub(view.thursdayRub)} ₽ на баланс`;
    detail = 'Оставшиеся 25% недельного начисления';
  } else {
    headline = 'Без начислений';
    detail = 'Тратьте баланс на продвижение и рекламу, если нужно';
  }

  return (
    <>
      <Title id={titleId} />
      <p className="mt-1 text-sm text-gray-500">Неделя {d.range}</p>

      <div className="mt-6 grid grid-cols-3 gap-2">
        {[
          { label: 'Лимит на неделю', value: view.netRub },
          { label: 'Уже пришло', value: d.accruedRub },
          { label: 'Остаток сейчас', value: view.availableNowRub },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl bg-[#F7F7F9] p-3">
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="mt-1 text-base font-semibold tabular-nums text-gray-900">{fmtRub(stat.value)} ₽</p>
          </div>
        ))}
      </div>

      {d.zeroWeek ? <ZeroWeekNote explain={view.explain} /> : null}

      <div className="mt-6 grid grid-cols-7 gap-1.5" role="tablist" aria-label="Дни недели">
        {FINANCE_BALANCE_WEEK_DAYS.map((label, index) => {
          const accrual = index === TUESDAY || index === THURSDAY;
          const active = index === selected;
          const date = financeBalanceWeekDate(index, undefined, view.weekOffset).split(' ')[0];
          return (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelected(index)}
              className={`relative flex h-16 flex-col items-center justify-center gap-0.5 rounded-xl text-xs transition-colors ${
                active
                  ? 'bg-gray-900 text-white'
                  : index < weekdayIndex
                    ? 'bg-[#F7F7F9] text-gray-400 hover:bg-gray-100'
                    : 'bg-[#F7F7F9] text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-[11px]">{label}</span>
              <span className="text-base font-semibold tabular-nums">{date}</span>
              {accrual ? (
                <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-[#C9A2FF]' : 'bg-[#9A41FE]'}`} aria-hidden />
              ) : (
                <span className="h-1.5 w-1.5" aria-hidden />
              )}
              {index === weekdayIndex ? (
                <span className="absolute -top-1.5 rounded-full bg-amber-400 px-1.5 text-[9px] font-semibold text-white">
                  сегодня
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-3 rounded-2xl border border-gray-100 p-4">
        <p className="text-xs text-gray-500">
          {DAY_NAMES[selected]}, {financeBalanceWeekDate(selected, undefined, view.weekOffset)}
        </p>
        <p className="mt-1 text-lg font-semibold text-gray-900">{headline}</p>
        <p className="mt-1 text-sm leading-relaxed text-gray-500">{detail}</p>
        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
          <span className="text-gray-500">Баланс в конце дня</span>
          <span className="font-semibold tabular-nums text-gray-900">{fmtRub(dayView.availableNowRub)} ₽</span>
        </div>
      </div>
    </>
  );
}

/** 4 — «лимит» как в банковских приложениях: шкала и список операций */
function LimitVariant({ titleId, view, weekdayIndex }: Omit<Props, 'variant'>) {
  const d = useDerived(view, weekdayIndex);
  const total = Math.max(view.netRub, 1);
  const spent = view.spentThisWeekRub;
  const pending = view.netRub - d.accruedRub;
  const pct = (n: number) => `${Math.max(0, Math.min(100, (n / total) * 100))}%`;

  const ops = [
    {
      key: 'tue',
      icon: <ArrowInIcon className="h-4 w-4" />,
      title: 'Начисление от WB',
      sub: `${d.tuesdayDone ? 'Пришло' : 'Придёт'} во вторник, ${d.tuesdayDate}`,
      amount: `+${fmtRub(view.tuesdayRub)} ₽`,
      muted: !d.tuesdayDone,
    },
    {
      key: 'thu',
      icon: <ArrowInIcon className="h-4 w-4" />,
      title: 'Начисление от WB',
      sub: `${d.thursdayDone ? 'Пришло' : 'Придёт'} в четверг, ${d.thursdayDate}`,
      amount: `+${fmtRub(view.thursdayRub)} ₽`,
      muted: !d.thursdayDone,
    },
    ...(spent > 0
      ? [
          {
            key: 'spent',
            icon: <Wallet className="h-4 w-4" />,
            title: 'Потратили на продвижение',
            sub: 'С начала недели',
            amount: `−${fmtRub(spent)} ₽`,
            muted: false,
          },
        ]
      : []),
  ];

  return (
    <>
      <Title id={titleId} />

      <div className="mt-6">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm text-gray-500">Можно потратить сейчас</p>
          <p className="text-sm text-gray-500">лимит {fmtRub(view.netRub)} ₽</p>
        </div>
        <p className="mt-1 text-[36px] font-bold leading-none tabular-nums tracking-tight text-gray-900">
          {fmtRub(view.availableNowRub)} ₽
        </p>
        <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-gray-100" aria-hidden>
          <span className="h-full bg-gray-300" style={{ width: pct(Math.min(spent, view.netRub)) }} />
          <span className="h-full bg-[#9A41FE]" style={{ width: pct(view.availableNowRub) }} />
          <span
            className="h-full bg-[repeating-linear-gradient(135deg,#E9D5FF_0_6px,#F3E8FF_6px_12px)]"
            style={{ width: pct(pending) }}
          />
        </div>
        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-gray-300" /> Потрачено {fmtRub(spent)} ₽
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#9A41FE]" /> Доступно {fmtRub(view.availableNowRub)} ₽
          </span>
          {pending > 0 ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#E9D5FF]" /> Ещё придёт {fmtRub(pending)} ₽
            </span>
          ) : null}
        </div>
      </div>

      {d.zeroWeek ? <ZeroWeekNote explain={view.explain} /> : null}

      <div className="mt-6 flex items-center gap-3 rounded-2xl bg-amber-50 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <Clock className="h-4 w-4" />
        </span>
        <p className="text-sm leading-snug text-gray-700">
          Неиспользованный остаток сгорит во вторник, {d.burnDate}. Тогда же придёт новый лимит
        </p>
      </div>

      <p className="mt-7 text-sm font-semibold text-gray-900">Операции за неделю {d.range}</p>
      <ul className="mt-2 divide-y divide-gray-100">
        {ops.map((op) => (
          <li key={op.key} className="flex items-center gap-3 py-3">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                op.key === 'spent' ? 'bg-gray-100 text-gray-600' : 'bg-[#F3E8FF] text-[#7C3AED]'
              }`}
            >
              {op.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-sm ${op.muted ? 'text-gray-400' : 'text-gray-900'}`}>{op.title}</p>
              <p className="text-xs text-gray-500">{op.sub}</p>
            </div>
            <span
              className={`shrink-0 text-sm font-semibold tabular-nums ${
                op.muted ? 'text-gray-400' : op.key === 'spent' ? 'text-gray-900' : 'text-emerald-600'
              }`}
            >
              {op.amount}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

/** 5 — три ответа на главные вопросы продавца */
function QaVariant({ titleId, view, weekdayIndex }: Omit<Props, 'variant'>) {
  const d = useDerived(view, weekdayIndex);
  const cards = [
    {
      key: 'how-much',
      icon: <Coins className="h-5 w-5" />,
      tone: 'bg-[#F3E8FF] text-[#7C3AED]',
      question: 'Сколько дадим на этой неделе?',
      answer: `${fmtRub(view.netRub)} ₽`,
      text: d.zeroWeek ? view.explain : `На неделю ${d.range}. Можно тратить на продвижение и рекламу`,
    },
    {
      key: 'when',
      icon: <Calendar className="h-5 w-5" />,
      tone: 'bg-emerald-50 text-emerald-600',
      question: 'Когда придут деньги?',
      answer: null,
      text: null,
      rows: [
        { label: `Вторник, ${d.tuesdayDate}`, value: view.tuesdayRub, done: d.tuesdayDone },
        { label: `Четверг, ${d.thursdayDate}`, value: view.thursdayRub, done: d.thursdayDone },
      ],
    },
    {
      key: 'left',
      icon: <Clock className="h-5 w-5" />,
      tone: 'bg-amber-50 text-amber-700',
      question: 'Что будет, если не потрачу?',
      answer: `${fmtRub(view.availableNowRub)} ₽ сгорит`,
      text: `Во вторник, ${d.burnDate}, остаток обнулится, и придёт новое начисление. Осталось ${d.daysToBurn} ${daysWord(d.daysToBurn)}`,
    },
  ];

  return (
    <>
      <Title id={titleId} />
      <p className="mt-1 text-sm text-gray-500">Деньги от WB, которые можно тратить, а можно и нет</p>

      <div className="mt-6 space-y-3">
        {cards.map((card, index) => (
          <section key={card.key} className="rounded-2xl border border-gray-100 p-4">
            <div className="flex items-start gap-3">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.tone}`}>
                {card.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-400">{index + 1} из 3</p>
                <p className="text-sm font-semibold text-gray-900">{card.question}</p>
                {card.answer ? (
                  <p className="mt-2 text-xl font-bold tabular-nums text-gray-900">{card.answer}</p>
                ) : null}
                {'rows' in card && card.rows ? (
                  <div className="mt-2 space-y-1.5">
                    {card.rows.map((row) => (
                      <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
                        <span className="inline-flex items-center gap-2 text-gray-600">
                          {row.done ? (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                              <Check className="h-2.5 w-2.5" />
                            </span>
                          ) : (
                            <span className="h-4 w-4 rounded-full border-2 border-gray-200" />
                          )}
                          {row.label}
                        </span>
                        <span
                          className={`font-semibold tabular-nums ${row.done ? 'text-gray-900' : 'text-gray-400'}`}
                        >
                          {fmtRub(row.value)} ₽
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
                {card.text ? <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{card.text}</p> : null}
              </div>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

const DAY_SHORT = FINANCE_BALANCE_WEEK_DAYS;

/** 6 — банковская выписка: дата, операция, сумма, остаток */
function StatementVariant({ titleId, view, weekdayIndex }: Omit<Props, 'variant'>) {
  const d = useDerived(view, weekdayIndex);
  const ledger = buildLedger(view, weekdayIndex);
  type Line = { key: string; date: string; label: string; amount: number; after: number; planned: boolean };
  const lines: Line[] = [];
  for (const day of ledger) {
    let running = day.openRub;
    if (day.wipedRub > 0) {
      running -= day.wipedRub;
      lines.push({ key: `w${day.index}`, date: day.date, label: 'Обнуление остатка прошлой недели', amount: -day.wipedRub, after: running, planned: day.planned });
    }
    if (day.accrualRub > 0) {
      running += day.accrualRub;
      lines.push({
        key: `a${day.index}`,
        date: day.date,
        label: day.index === TUESDAY ? 'Зачисление от WB · 75%' : 'Зачисление от WB · 25%',
        amount: day.accrualRub,
        after: running,
        planned: day.planned,
      });
    }
    if (day.spentRub > 0) {
      running -= day.spentRub;
      lines.push({ key: `s${day.index}`, date: day.date, label: 'Списание на продвижение', amount: -day.spentRub, after: running, planned: day.planned });
    }
  }

  return (
    <>
      <Title id={titleId} />
      <p className="mt-1 text-sm text-gray-500">Выписка за неделю {d.range}</p>

      <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-gray-100 text-sm">
        <div className="bg-white p-3">
          <p className="text-xs text-gray-500">Входящий остаток</p>
          <p className="mt-1 font-semibold tabular-nums text-gray-900">{fmtRub(view.startAvailableRub)} ₽</p>
        </div>
        <div className="bg-white p-3">
          <p className="text-xs text-gray-500">Остаток на {financeBalanceWeekDate(weekdayIndex, undefined, view.weekOffset)}</p>
          <p className="mt-1 font-semibold tabular-nums text-gray-900">{fmtRub(view.availableNowRub)} ₽</p>
        </div>
      </div>

      {d.zeroWeek ? <ZeroWeekNote explain={view.explain} /> : null}

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
            <th className="pb-2 pr-3 font-medium">Дата</th>
            <th className="pb-2 pr-3 font-medium">Операция</th>
            <th className="pb-2 pr-3 text-right font-medium">Сумма</th>
            <th className="pb-2 text-right font-medium">Остаток</th>
          </tr>
        </thead>
        <tbody>
          {lines.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-6 text-center text-gray-400">
                Операций на этой неделе нет
              </td>
            </tr>
          ) : (
            lines.map((line) => (
              <tr key={line.key} className={`border-b border-gray-100 ${line.planned ? 'text-gray-400' : 'text-gray-900'}`}>
                <td className="whitespace-nowrap py-2.5 pr-3 align-top tabular-nums">{line.date.replace(/ (\S+)$/, (m) => m.slice(0, 4))}</td>
                <td className="py-2.5 pr-3 align-top">
                  {line.label}
                  {line.planned ? <span className="ml-1.5 rounded bg-gray-100 px-1 py-px text-[10px] text-gray-500">план</span> : null}
                </td>
                <td
                  className={`whitespace-nowrap py-2.5 pr-3 text-right align-top font-medium tabular-nums ${
                    line.planned ? '' : line.amount > 0 ? 'text-emerald-600' : 'text-gray-900'
                  }`}
                >
                  {line.amount > 0 ? '+' : '−'}
                  {fmtRub(Math.abs(line.amount))} ₽
                </td>
                <td className="whitespace-nowrap py-2.5 text-right align-top tabular-nums">{fmtRub(line.after)} ₽</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <p className="mt-3 text-xs leading-relaxed text-gray-500">
        Во вторник, {d.burnDate}, неиспользованный остаток обнулится перед новым зачислением
      </p>
    </>
  );
}

/** 7 — счёт как карта + лента операций по дням, как в банковском приложении */
/** Строка операции в стиле ленты */
function OpRow({
  kind,
  title,
  caption,
  amount,
  trailing,
}: {
  kind: 'in' | 'out';
  title: string;
  caption?: React.ReactNode;
  amount: number;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          kind === 'in' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-600'
        }`}
      >
        {kind === 'in' ? <ArrowInIcon className="h-4 w-4" /> : <ArrowOutIcon className="h-4 w-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-tight text-gray-900">{title}</p>
        {caption ? <p className="mt-0.5 text-xs leading-tight text-gray-500">{caption}</p> : null}
      </div>
      <span className={`text-sm font-semibold tabular-nums ${kind === 'in' ? 'text-emerald-600' : 'text-gray-900'}`}>
        {kind === 'in' ? '+' : '−'}
        {fmtRub(amount)} ₽
      </span>
      {trailing}
    </div>
  );
}

function FeedVariant({ titleId, view, weekdayIndex, spendView }: Omit<Props, 'variant'>) {
  const d = useDerived(view, weekdayIndex);
  const [calcOpen, setCalcOpen] = useState(false);
  const [spendOpen, setSpendOpen] = useState(false);
  const [tab, setTab] = useState<'balance' | 'how'>('balance');
  const ledger = buildLedger(view, weekdayIndex);
  const groupTitle = (day: LedgerDay) =>
    day.index === weekdayIndex ? 'Сегодня' : day.index === weekdayIndex - 1 ? 'Вчера' : `${DAY_NAMES[day.index]}, ${day.date}`;

  const past = ledger.filter((day) => !day.planned);
  /** День начисления по графику — показываем, даже если резерв съел всю сумму */
  const isAccrualDay = (day: LedgerDay) =>
    (day.index === TUESDAY ? view.grossTuesdayRub : day.index === THURSDAY ? view.grossThursdayRub : 0) > 0;
  const accrualGroups = past.filter(isAccrualDay);
  const spentDays = past.filter((day) => day.spentRub > 0);
  const spentRub = sumBy(past, (day) => day.spentRub);
  const accruedRub = sumBy(past, (day) => day.accrualRub);
  const chargeDate = financeBalanceWeekDate(6, undefined, view.weekOffset);
  const chargeCaption = `Выставим на портале продавца ${chargeDate}`;
  const spendTotalRub = spentRub + view.availableNowRub;
  const spentPct = spendTotalRub > 0 ? Math.round((spentRub / spendTotalRub) * 100) : 0;
  const maxDaySpend = Math.max(1, ...ledger.map((day) => day.spentRub));

  const upcoming = ledger.filter((day) => day.planned && isAccrualDay(day));
  const showPendingCharge = spendView === 'pending' && spentRub > 0;

  /** Сколько вычли из начисления этого дня в счёт резерва в кампаниях */
  const grossFor = (day: LedgerDay) =>
    day.index === TUESDAY ? view.grossTuesdayRub : day.index === THURSDAY ? view.grossThursdayRub : 0;
  const reserveCutFor = (day: LedgerDay) => Math.max(0, grossFor(day) - day.accrualRub);
  /** Расчёт зачисления: по графику − резерв в кампаниях = придёт */
  /** Резерв, который ещё не вычли к моменту этого начисления (во вторник — весь) */
  const reserveLeftFor = (day: LedgerDay) =>
    day.index === TUESDAY
      ? view.reservePendingRub
      : Math.max(0, view.reservePendingRub - view.grossTuesdayRub);
  const accrualBreakdown = (day: LedgerDay) => {
    if (reserveCutFor(day) <= 0) return null;
    const share = day.index === TUESDAY ? '75%' : '25%';
    return (
      <div className="ml-12 mt-1.5 space-y-1 border-t border-dashed border-gray-200 pt-2 text-xs text-gray-500">
        <div className="flex justify-between gap-3">
          <span>По графику · {share} лимита</span>
          <span className="tabular-nums text-gray-700">{fmtRub(grossFor(day))} ₽</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>Резерв на кампаниях</span>
          <span className="tabular-nums text-gray-700">−{fmtRub(reserveLeftFor(day))} ₽</span>
        </div>
        <div className="flex justify-between gap-3 font-semibold text-gray-900">
          <span>Придёт на баланс</span>
          <span className="tabular-nums">{fmtRub(day.accrualRub)} ₽</span>
        </div>
      </div>
    );
  };
  const reserveDeductedRub = Math.max(0, view.grossRub - view.netRub);
  const reserveCoversLimit = view.grossRub > 0 && view.reservePendingRub >= view.grossRub;
  const reserveDay = ledger.find((day) => reserveCutFor(day) > 0);

  const spendBlock = (() => {
    if (spendView === 'buckets') {
      const tiles = [
        {
          label: 'В кампаниях',
          value: `${fmtRub(view.periodReserveRub)} ₽`,
          tone: 'text-gray-900',
          hint: view.periodReserveRub > 0 ? 'Вычтем из следующего начисления' : '',
        },
        {
          label: 'Потрачено',
          value: `${view.periodSpentRub > 0 ? '−' : ''}${fmtRub(view.periodSpentRub)} ₽`,
          tone: 'text-gray-900',
          hint: '',
        },
      ];
      return (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {tiles.map((tile) => (
            <div key={tile.label} className="rounded-xl bg-[#F7F7F9] px-3 py-2.5">
              <p className="text-[11px] leading-tight text-gray-500">{tile.label}</p>
              <p className={`mt-1 text-lg font-semibold leading-tight tabular-nums ${tile.tone}`}>{tile.value}</p>
              {tile.hint ? <p className="mt-0.5 text-[11px] leading-tight text-gray-400">{tile.hint}</p> : null}
            </div>
          ))}
        </div>
      );
    }
    if (spendView === 'rules') {
      const rules = [
        spentRub > 0
          ? {
              key: 'spent',
              icon: <ArrowOutIcon className="h-4 w-4" />,
              title: 'Потрачено на продвижение',
              amount: `${fmtRub(spentRub)} ₽`,
              text: `Выставим на портале продавца ${chargeDate}. На начисление не влияет`,
            }
          : null,
        reserveDeductedRub > 0
          ? {
              key: 'reserve',
              icon: <Wallet className="h-4 w-4" />,
              title: 'Резерв в кампаниях',
              amount: `${fmtRub(reserveDeductedRub)} ₽`,
              text: `Вычли из начисления${reserveDay ? ` ${reserveDay.date}` : ''}. Лимит недели не изменился`,
            }
          : null,
      ].filter((item): item is NonNullable<typeof item> => item !== null);
      return rules.length > 0 ? (
        <div className="mt-6 divide-y divide-gray-100">
          {rules.map((rule) => (
            <div key={rule.key} className="flex gap-3 py-3 first:pt-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                {rule.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm text-gray-900">{rule.title}</p>
                  <p className="text-sm font-semibold tabular-nums text-gray-900">{rule.amount}</p>
                </div>
                <p className="mt-0.5 text-xs leading-snug text-gray-500">{rule.text}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null;
    }
    if (spendView === 'portal') {
      return spentRub > 0 ? (
        <div className="mt-6">
          <p className="text-xs font-medium text-gray-500">Портал продавца</p>
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-gray-100 p-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white">
              <Wallet className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-tight text-gray-900">Продвижение и реклама</p>
              <p className="mt-0.5 text-xs leading-tight text-gray-500">
                К оплате {chargeDate} · не уменьшает начисления
              </p>
            </div>
            <span className="text-sm font-semibold tabular-nums text-gray-900">{fmtRub(spentRub)} ₽</span>
          </div>
        </div>
      ) : null;
    }
    if (spendView === 'weekline') {
      const steps = [
        {
          key: 'tue',
          day: `Вт, ${d.tuesdayDate}`,
          value: `+${fmtRub(view.tuesdayRub)} ₽`,
          note: view.grossTuesdayRub > view.tuesdayRub ? `−${fmtRub(view.grossTuesdayRub - view.tuesdayRub)} ₽ резерв` : 'на баланс',
          done: d.tuesdayDone,
          tone: 'text-emerald-600',
        },
        {
          key: 'thu',
          day: `Чт, ${d.thursdayDate}`,
          value: `+${fmtRub(view.thursdayRub)} ₽`,
          note: view.grossThursdayRub > view.thursdayRub ? `−${fmtRub(view.grossThursdayRub - view.thursdayRub)} ₽ резерв` : 'на баланс',
          done: d.thursdayDone,
          tone: 'text-emerald-600',
        },
        {
          key: 'sun',
          day: `Вс, ${chargeDate}`,
          value: `${spentRub > 0 ? '−' : ''}${fmtRub(spentRub)} ₽`,
          note: 'на портале',
          done: false,
          tone: 'text-gray-900',
        },
      ];
      return view.grossRub > 0 ? (
        <div className="mt-6 grid grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.key} className="relative pr-3">
              <div className="flex items-center">
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${step.done ? 'bg-gray-900' : 'border-2 border-gray-300 bg-white'}`}
                />
                {index < steps.length - 1 ? <span className="ml-1 h-px flex-1 bg-gray-200" /> : null}
              </div>
              <p className="mt-2 text-xs text-gray-500">{step.day}</p>
              <p
                className={`mt-0.5 text-sm font-semibold tabular-nums ${
                  step.done || (step.key === 'sun' && spentRub > 0) ? step.tone : 'text-gray-400'
                }`}
              >
                {step.value}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-400">{step.note}</p>
            </div>
          ))}
        </div>
      ) : null;
    }
    if (spendView === 'row') {
      return spentRub > 0 ? (
        <div className="mt-6">
          <p className="text-xs font-medium text-gray-500">За неделю</p>
          <div className="mt-1">
            <OpRow kind="out" title="Продвижение и реклама" caption={chargeCaption} amount={spentRub} />
          </div>
        </div>
      ) : null;
    }
    if (spendView === 'tiles') {
      return (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-[#F7F7F9] p-4">
            <p className="text-xs text-gray-500">Зачислено</p>
            <p className="mt-1.5 text-lg font-semibold tabular-nums text-emerald-600">+{fmtRub(accruedRub)} ₽</p>
          </div>
          <div className="rounded-2xl bg-[#F7F7F9] p-4">
            <p className="text-xs text-gray-500">Потрачено</p>
            <p className="mt-1.5 text-lg font-semibold tabular-nums text-gray-900">
              {spentRub > 0 ? '−' : ''}
              {fmtRub(spentRub)} ₽
            </p>
            {spentRub > 0 ? <p className="mt-1 text-[11px] leading-tight text-gray-500">на портале {chargeDate}</p> : null}
          </div>
        </div>
      );
    }
    if (spendView === 'expand') {
      return spentRub > 0 ? (
        <div className="mt-6">
          <p className="text-xs font-medium text-gray-500">За неделю</p>
          <button
            type="button"
            onClick={() => setSpendOpen((open) => !open)}
            aria-expanded={spendOpen}
            className="mt-1 block w-full text-left"
          >
            <OpRow
              kind="out"
              title="Продвижение и реклама"
              caption={`${spentDays.length} ${daysWord(spentDays.length)} · на портале ${chargeDate}`}
              amount={spentRub}
              trailing={
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${spendOpen ? 'rotate-180' : ''}`}
                />
              }
            />
          </button>
          {spendOpen ? (
            <ul className="ml-12 border-l border-gray-100 pl-3">
              {spentDays.map((day) => (
                <li key={day.index} className="flex justify-between py-1.5 text-xs text-gray-500">
                  <span>{groupTitle(day)}</span>
                  <span className="tabular-nums text-gray-700">−{fmtRub(day.spentRub)} ₽</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null;
    }
    if (spendView === 'bars') {
      return spentRub > 0 ? (
        <div className="mt-6 rounded-2xl bg-[#F7F7F9] p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-sm text-gray-900">Продвижение и реклама</p>
            <p className="text-sm font-semibold tabular-nums text-gray-900">−{fmtRub(spentRub)} ₽</p>
          </div>
          <div className="mt-4 flex h-12 items-end gap-1.5" aria-hidden>
            {ledger.map((day) => (
              <div key={day.index} className="flex h-full flex-1 flex-col justify-end gap-1">
                <span
                  className={`w-full rounded-sm ${day.planned ? 'bg-gray-200' : day.spentRub > 0 ? 'bg-gray-900' : 'bg-gray-200'}`}
                  style={{ height: day.spentRub > 0 ? `${Math.max(12, (day.spentRub / maxDaySpend) * 100)}%` : '3px' }}
                />
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex gap-1.5 text-center text-[10px] text-gray-400">
            {FINANCE_BALANCE_WEEK_DAYS.map((label, index) => (
              <span key={label} className={`flex-1 ${index === weekdayIndex ? 'font-semibold text-gray-900' : ''}`}>
                {label}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-500">{chargeCaption}</p>
        </div>
      ) : null;
    }
    if (spendView === 'summary') {
      const rows = [
        { label: 'Остаток с прошлой недели', value: view.startAvailableRub - sumBy(past, (day) => day.wipedRub), sign: '' },
        { label: 'Зачислено от WB', value: accruedRub, sign: '+' },
        { label: 'Продвижение и реклама', value: spentRub, sign: '−' },
      ].filter((row) => row.value > 0);
      return (
        <div className="mt-4 rounded-2xl bg-[#F7F7F9] px-4 py-1 text-sm">
          {rows.map((row) => (
            <div key={row.label} className="flex justify-between border-b border-gray-200/70 py-2.5 text-gray-600">
              <span>{row.label}</span>
              <span className={`tabular-nums ${row.sign === '+' ? 'text-emerald-600' : 'text-gray-900'}`}>
                {row.sign}
                {fmtRub(row.value)} ₽
              </span>
            </div>
          ))}
          <div className="flex justify-between py-2.5 font-semibold text-gray-900">
            <span>Доступно</span>
            <span className="tabular-nums">{fmtRub(view.availableNowRub)} ₽</span>
          </div>
        </div>
      );
    }
    if (spendView === 'chip') {
      return spentRub > 0 ? (
        <div className="mt-4 flex">
          <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 py-1.5 pl-1.5 pr-3 text-xs text-gray-600">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-gray-600">
              <ArrowOutIcon className="h-3 w-3" />
            </span>
            Потрачено <span className="font-semibold tabular-nums text-gray-900">{fmtRub(spentRub)} ₽</span>
            <span className="text-gray-300">·</span>
            на портале {chargeDate}
          </span>
        </div>
      ) : null;
    }
    if (spendView === 'ring') {
      const radius = 30;
      const circumference = 2 * Math.PI * radius;
      return spendTotalRub > 0 ? (
        <div className="mt-4 flex items-center gap-5 rounded-2xl bg-[#F7F7F9] p-4">
          <svg viewBox="0 0 76 76" className="h-[76px] w-[76px] shrink-0 -rotate-90" aria-hidden>
            <circle cx="38" cy="38" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="8" />
            <circle
              cx="38"
              cy="38"
              r={radius}
              fill="none"
              stroke="#111827"
              strokeWidth="8"
              strokeLinecap={spentPct > 0 ? 'round' : 'butt'}
              strokeDasharray={`${(spentPct / 100) * circumference} ${circumference}`}
            />
          </svg>
          <div className="min-w-0 flex-1 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-gray-600">
                <span className="h-2 w-2 rounded-full bg-gray-900" />
                Потрачено
              </span>
              <span className="font-semibold tabular-nums text-gray-900">{fmtRub(spentRub)} ₽</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-gray-600">
                <span className="h-2 w-2 rounded-full bg-gray-200" />
                Осталось
              </span>
              <span className="font-semibold tabular-nums text-gray-900">{fmtRub(view.availableNowRub)} ₽</span>
            </div>
            {spentRub > 0 ? <p className="text-xs text-gray-500">{chargeCaption}</p> : null}
          </div>
        </div>
      ) : null;
    }
    return null;
  })();

  return (
    <>
      <h2 id={titleId} className="text-2xl font-bold tracking-tight text-gray-900">
        Баланс
      </h2>
      <div role="tablist" className="mt-6 flex rounded-xl bg-[rgba(74,74,89,0.08)] p-1">
        {(
          [
            ['balance', 'Мой баланс'],
            ['how', 'Как это работает'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'how' ? (
        <div className="mt-5">
          <BalanceIntro />
        </div>
      ) : (
      <>
      <div className="mt-6 rounded-2xl bg-gray-900 p-5 text-white">
        {spendView === 'split' ? (
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-white/60">Остаток</p>
              <p className="mt-3 text-[34px] font-bold leading-none tabular-nums tracking-tight">
                {fmtRub(view.availableNowRub)} ₽
              </p>
            </div>
            <div className="border-l border-white/10 pl-4 text-right">
              <p className="text-xs text-white/60">Потрачено</p>
              <p className="mt-1.5 text-lg font-semibold leading-none tabular-nums text-white/80">
                {fmtRub(spentRub)} ₽
              </p>
              {spentRub > 0 ? <p className="mt-1.5 text-[11px] text-white/40">на портале {chargeDate}</p> : null}
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-white/60">Остаток</p>
            <p className="mt-3 text-[34px] font-bold leading-none tabular-nums tracking-tight">
              {fmtRub(view.availableNowRub)} ₽
            </p>
          </>
        )}
        {d.daysToBurn <= 2 && view.availableNowRub > 0 ? (
          <p className="mt-3 flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/70">
            <Info className="h-3.5 w-3.5 shrink-0 text-white/50" />
            Остаток обнулится во вторник, {d.burnDate}
          </p>
        ) : null}
        {spendView === 'stack' && view.grossRub > 0 ? (
          (() => {
            const parts = [
              { key: 'spent', label: 'Потрачено', value: spentRub, bar: 'bg-white/40', dot: 'bg-white/40' },
              { key: 'reserve', label: 'В кампаниях', value: reserveDeductedRub, bar: 'bg-white/15', dot: 'bg-white/15' },
              { key: 'left', label: 'Осталось', value: view.availableNowRub, bar: 'bg-white', dot: 'bg-white' },
            ];
            const total = Math.max(1, parts.reduce((sum, part) => sum + part.value, 0));
            return (
              <div className="mt-5">
                <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
                  {parts
                    .filter((part) => part.value > 0)
                    .map((part) => (
                      <span key={part.key} className={`h-full ${part.bar}`} style={{ width: `${(part.value / total) * 100}%` }} />
                    ))}
                </div>
                <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/60">
                  {parts.map((part) => (
                    <span key={part.key} className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${part.dot}`} />
                      {part.label}
                      <span className="tabular-nums text-white">{fmtRub(part.value)} ₽</span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })()
        ) : null}
        {spendView === 'card' && spendTotalRub > 0 ? (
          <div className="mt-5">
            <div className="flex h-1.5 overflow-hidden rounded-full bg-white/15">
              <span className="h-full rounded-full bg-white/50" style={{ width: `${spentPct}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-xs text-white/60">
              <span>
                Потрачено <span className="font-semibold tabular-nums text-white">{fmtRub(spentRub)} ₽</span>
              </span>
              {spentRub > 0 ? <span>на портале {chargeDate}</span> : null}
            </div>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => setCalcOpen((open) => !open)}
          aria-expanded={calcOpen}
          className="mt-4 flex w-full items-center justify-between border-t border-white/10 pt-3 text-left text-xs text-white/60"
        >
          <span>Лимит недели {d.range}</span>
          <span className="flex items-center gap-1.5 text-base font-semibold tabular-nums leading-none text-white">
            {fmtRub(view.grossRub)} ₽
            <ChevronDown
              className={`h-4 w-4 text-white/50 transition-transform ${calcOpen ? 'rotate-180' : ''}`}
            />
          </span>
        </button>
        {calcOpen ? <LimitCalculation view={view} /> : null}
      </div>

      {d.zeroWeek ? (
        <ZeroWeekNote
          explain={view.explain}
          calcOpen={calcOpen}
          onToggleCalc={() => setCalcOpen((open) => !open)}
        />
      ) : reserveCoversLimit ? (
        <ZeroWeekNote
          title="Резерв в кампаниях больше лимита"
          explain={`В кампаниях ${fmtRub(view.reservePendingRub)} ₽ — это больше лимита недели ${fmtRub(view.grossRub)} ₽, поэтому на баланс ничего не придёт`}
        />
      ) : null}

      {spendBlock}

      {accrualGroups.map((day) => (
        <div key={day.index} className="mt-6">
          <p className="text-xs font-medium text-gray-500">{groupTitle(day)}</p>
          <div className="mt-1">
            <OpRow
              kind="in"
              title={day.index === TUESDAY ? 'Первая часть баланса' : 'Вторая часть баланса'}
              amount={day.accrualRub}
            />
            {accrualBreakdown(day)}
          </div>
        </div>
      ))}

      {upcoming.length > 0 || showPendingCharge ? (
        <div className="mt-6">
          <p className="text-sm font-medium text-gray-500">Ожидается</p>
          {upcoming.map((day) => (
            <div key={day.index} className="mt-2 rounded-xl border border-dashed border-gray-200 px-3 py-2.5">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400">
                  <ArrowInIcon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-tight text-gray-700">
                    {day.index === TUESDAY ? 'Первая часть баланса' : 'Вторая часть баланса'}
                  </p>
                  <p className="mt-0.5 text-xs leading-tight text-gray-500">
                    {DAY_NAMES[day.index]}, {day.date}
                  </p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-gray-400">+{fmtRub(day.accrualRub)} ₽</span>
              </div>
              {accrualBreakdown(day)}
            </div>
          ))}
          {showPendingCharge ? (
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-dashed border-gray-200 px-3 py-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400">
                <ArrowOutIcon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-tight text-gray-700">Оплата продвижения</p>
                <p className="mt-0.5 text-xs leading-tight text-gray-500">
                  {DAY_NAMES[6]}, {chargeDate} · на портале продавца
                </p>
              </div>
              <span className="text-sm font-semibold tabular-nums text-gray-400">−{fmtRub(spentRub)} ₽</span>
            </div>
          ) : null}
        </div>
      ) : null}
      </>
      )}
    </>
  );
}

/** 8 — оборот: входящий остаток ± движения = исходящий, плюс столбики по дням */
function TurnoverVariant({ titleId, view, weekdayIndex }: Omit<Props, 'variant'>) {
  const d = useDerived(view, weekdayIndex);
  const ledger = buildLedger(view, weekdayIndex);
  const past = ledger.filter((day) => !day.planned);
  const rows = [
    { label: 'Входящий остаток', value: view.startAvailableRub, sign: '' },
    { label: 'Обнулено', value: sumBy(past, (day) => day.wipedRub), sign: '−' },
    { label: 'Зачислено от WB', value: sumBy(past, (day) => day.accrualRub), sign: '+' },
    { label: 'Потрачено на продвижение', value: sumBy(past, (day) => day.spentRub), sign: '−' },
  ];
  const max = Math.max(1, ...ledger.map((day) => day.closeRub), view.netRub);

  return (
    <>
      <Title id={titleId} />
      <p className="mt-1 text-sm text-gray-500">
        Оборот с {ledger[0].date} по {financeBalanceWeekDate(weekdayIndex, undefined, view.weekOffset)}
      </p>

      <div className="mt-6 rounded-2xl border border-gray-100">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-3 border-b border-gray-100 px-4 py-3 text-sm">
            <span className="text-gray-600">{row.label}</span>
            <span className={`tabular-nums ${row.value === 0 ? 'text-gray-400' : 'text-gray-900'}`}>
              {row.sign && row.value > 0 ? `${row.sign} ` : ''}
              {fmtRub(row.value)} ₽
            </span>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-3 bg-[#F7F7F9] px-4 py-3.5">
          <span className="text-sm font-semibold text-gray-900">Остаток сейчас</span>
          <span className="text-lg font-bold tabular-nums text-gray-900">{fmtRub(view.availableNowRub)} ₽</span>
        </div>
      </div>

      {d.zeroWeek ? <ZeroWeekNote explain={view.explain} /> : null}

      <p className="mt-7 text-sm font-semibold text-gray-900">Остаток на конец дня</p>
      <div className="mt-3 flex h-36 items-end gap-2" role="img" aria-label="Остаток баланса на конец каждого дня недели">
        {ledger.map((day) => (
          <div key={day.index} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <span className={`text-[10px] tabular-nums ${day.planned ? 'text-gray-300' : 'text-gray-500'}`}>
              {day.closeRub > 0 ? `${Math.round(day.closeRub / 1000)}к` : '0'}
            </span>
            <div
              className={`w-full rounded-t-md ${
                day.planned
                  ? 'bg-[repeating-linear-gradient(135deg,#E5E7EB_0_4px,#F3F4F6_4px_8px)]'
                  : day.index === weekdayIndex
                    ? 'bg-gray-900'
                    : 'bg-gray-300'
              }`}
              style={{ height: `${Math.max(3, (day.closeRub / max) * 100)}%` }}
            />
            <span className={`text-[11px] ${day.index === weekdayIndex ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
              {DAY_SHORT[day.index]}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-gray-500">
        Зачисления — во вторник и четверг. Остаток обнулится во вторник, {d.burnDate}
      </p>
    </>
  );
}

/** 9 — график остатка за неделю, как динамика счёта */
function ChartVariant({ titleId, view, weekdayIndex }: Omit<Props, 'variant'>) {
  const d = useDerived(view, weekdayIndex);
  const ledger = buildLedger(view, weekdayIndex);
  const W = 480;
  const H = 160;
  const max = Math.max(1, view.startAvailableRub, ...ledger.map((day) => Math.max(day.closeRub, day.openRub - day.wipedRub + day.accrualRub)));
  const x = (i: number) => (i / 7) * W;
  const y = (v: number) => H - (v / max) * (H - 16) - 4;

  const points: [number, number][] = [[x(0), y(view.startAvailableRub)]];
  ledger.forEach((day) => {
    const afterMoves = day.openRub - day.wipedRub + day.accrualRub;
    if (day.wipedRub > 0) points.push([x(day.index) + 1, y(day.openRub - day.wipedRub)]);
    if (day.accrualRub > 0) points.push([x(day.index) + 2, y(afterMoves)]);
    points.push([x(day.index + 1), y(day.closeRub)]);
  });
  const splitAt = points.findIndex(([px]) => px > x(weekdayIndex + 1));
  const factPts = splitAt === -1 ? points : points.slice(0, splitAt);
  const planPts = splitAt === -1 ? [] : points.slice(Math.max(0, splitAt - 1));
  const toPath = (pts: [number, number][]) => pts.map(([px, py], i) => `${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ');

  return (
    <>
      <Title id={titleId} />

      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Остаток сейчас</p>
          <p className="mt-1 text-[34px] font-bold leading-none tabular-nums tracking-tight text-gray-900">
            {fmtRub(view.availableNowRub)} ₽
          </p>
        </div>
        <div className="text-right text-sm">
          <p className="text-gray-500">Лимит недели</p>
          <p className="mt-1 font-semibold tabular-nums text-gray-900">{fmtRub(view.netRub)} ₽</p>
        </div>
      </div>

      <div className="mt-6">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-40 w-full" preserveAspectRatio="none" role="img" aria-label="Динамика остатка баланса за неделю">
          <line x1="0" x2={W} y1={H - 4} y2={H - 4} stroke="#E5E7EB" />
          <rect x={x(weekdayIndex)} y="0" width={W / 7} height={H} fill="#F7F7F9" />
          <path d={toPath(factPts)} fill="none" stroke="#111827" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          {planPts.length > 1 ? (
            <path d={toPath(planPts)} fill="none" stroke="#9CA3AF" strokeWidth="2" strokeDasharray="5 5" vectorEffect="non-scaling-stroke" />
          ) : null}
        </svg>
        <div className="mt-1.5 grid grid-cols-7 text-center text-[11px]">
          {DAY_SHORT.map((label, index) => (
            <span key={label} className={index === weekdayIndex ? 'font-semibold text-gray-900' : 'text-gray-400'}>
              {label}
            </span>
          ))}
        </div>
      </div>

      {d.zeroWeek ? <ZeroWeekNote explain={view.explain} /> : null}

      <div className="mt-6 divide-y divide-gray-100 border-y border-gray-100 text-sm">
        {[
          { label: `Зачисление · вт ${d.tuesdayDate}`, value: `+${fmtRub(view.tuesdayRub)} ₽`, done: d.tuesdayDone },
          { label: `Зачисление · чт ${d.thursdayDate}`, value: `+${fmtRub(view.thursdayRub)} ₽`, done: d.thursdayDone },
          { label: `Обнуление остатка · вт ${d.burnDate}`, value: 'весь остаток', done: false },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 py-3">
            <span className={row.done ? 'text-gray-900' : 'text-gray-500'}>{row.label}</span>
            <span className={`tabular-nums ${row.done ? 'font-semibold text-emerald-600' : 'text-gray-400'}`}>{row.value}</span>
          </div>
        ))}
      </div>
    </>
  );
}

/** 10 — график зачислений со статусами, как расписание выплат */
function ScheduleVariant({ titleId, view, weekdayIndex }: Omit<Props, 'variant'>) {
  const d = useDerived(view, weekdayIndex);
  const rows = [
    {
      key: 'tue',
      date: d.tuesdayDate,
      label: 'Зачисление 75%',
      amount: `+${fmtRub(view.tuesdayRub)} ₽`,
      status: d.tuesdayDone ? 'done' : 'pending',
    },
    {
      key: 'thu',
      date: d.thursdayDate,
      label: 'Зачисление 25%',
      amount: `+${fmtRub(view.thursdayRub)} ₽`,
      status: d.thursdayDone ? 'done' : 'pending',
    },
    {
      key: 'reset',
      date: d.burnDate,
      label: 'Обнуление остатка',
      amount: view.availableNowRub > 0 ? `до −${fmtRub(view.availableNowRub)} ₽` : '0 ₽',
      status: 'reset',
    },
  ] as const;

  const badge = {
    done: 'bg-emerald-50 text-emerald-700',
    pending: 'bg-gray-100 text-gray-600',
    reset: 'bg-amber-50 text-amber-700',
  } as const;
  const badgeText = { done: 'Зачислено', pending: 'Ожидается', reset: 'Запланировано' } as const;

  return (
    <>
      <Title id={titleId} />
      <p className="mt-1 text-sm text-gray-500">Неделя {d.range}</p>

      <div className="mt-6 flex items-center gap-4 rounded-2xl bg-[#F7F7F9] p-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-500">Доступно сейчас</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{fmtRub(view.availableNowRub)} ₽</p>
        </div>
        <div className="h-10 w-px bg-gray-200" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-500">Всего за неделю</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{fmtRub(view.netRub)} ₽</p>
        </div>
      </div>

      {d.zeroWeek ? <ZeroWeekNote explain={view.explain} /> : null}

      <p className="mt-7 text-sm font-semibold text-gray-900">График операций</p>
      <div className="mt-3 overflow-hidden rounded-xl border border-gray-100">
        <div className="grid grid-cols-[5.5rem_1fr_auto] gap-3 bg-[#F7F7F9] px-4 py-2 text-xs text-gray-500">
          <span>Дата</span>
          <span>Операция</span>
          <span className="text-right">Сумма</span>
        </div>
        {rows.map((row) => (
          <div key={row.key} className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3 border-t border-gray-100 px-4 py-3 text-sm">
            <span className="tabular-nums text-gray-600">{row.date}</span>
            <span className="min-w-0">
              <span className="block text-gray-900">{row.label}</span>
              <span className={`mt-1 inline-block rounded-md px-1.5 py-0.5 text-[11px] font-medium ${badge[row.status]}`}>
                {badgeText[row.status]}
              </span>
            </span>
            <span className={`text-right font-semibold tabular-nums ${row.status === 'done' ? 'text-emerald-600' : row.status === 'reset' ? 'text-amber-700' : 'text-gray-400'}`}>
              {row.amount}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-gray-500">
        Сначала списываем ваши деньги, баланс — если их не хватит. Тратить баланс не обязательно
      </p>
    </>
  );
}

export function FinanceBalanceModalVariant(props: Props) {
  const { variant, ...rest } = props;
  switch (variant) {
    case 'statement':
      return <StatementVariant {...rest} />;
    case 'feed':
      return <FeedVariant {...rest} />;
    case 'turnover':
      return <TurnoverVariant {...rest} />;
    case 'chart':
      return <ChartVariant {...rest} />;
    case 'schedule':
      return <ScheduleVariant {...rest} />;
    case 'calendar':
      return (
        <div key={`${rest.view.weekId}-${rest.weekdayIndex}`}>
          <CalendarVariant {...rest} />
        </div>
      );
    case 'limit':
      return <LimitVariant {...rest} />;
    case 'qa':
      return <QaVariant {...rest} />;
    default:
      return <TimelineVariant {...rest} />;
  }
}
