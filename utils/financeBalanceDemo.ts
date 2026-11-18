/** Демо-переключатель буфера на странице финансов. Шапка читает ту же сумму. */

import {
  formatFinanceDay,
  formatFinanceDayShort,
  financeWeekdayLabels,
  getFinanceLocaleId,
} from '../components/financeI18n';

export const FINANCE_BALANCE_DEMO_STORAGE_KEY = 'finance_balance_demo_case';
export const FINANCE_BALANCE_AMOUNT_KEY = 'finance_balance_amount_rub';
export const FINANCE_BALANCE_DEMO_EVENT = 'finance-balance-demo';
export const FINANCE_BALANCE_SCHEME_LAYOUT_KEY = 'finance_balance_scheme_layout';
export const FINANCE_BALANCE_SCHEME_SCENARIO_KEY = 'finance_balance_scheme_scenario';

export const FINANCE_BALANCE_DEMO_CASES = [
  { id: 'zero', amount: 0, label: '0 ₽' },
  { id: 'funded', amount: 10_000, label: '10 000 ₽' },
] as const;

export type FinanceBalanceDemoCaseId = (typeof FINANCE_BALANCE_DEMO_CASES)[number]['id'];

export const FINANCE_BALANCE_SCHEME_LAYOUTS = [
  { id: 'current', label: 'Текущая' },
  { id: 'status', label: 'Статус' },
] as const;

export type FinanceBalanceSchemeLayoutId = (typeof FINANCE_BALANCE_SCHEME_LAYOUTS)[number]['id'];

/** Legacy-сценарии (layout «Текущая» / старые кейсы) */
export const FINANCE_BALANCE_SCHEME_SCENARIOS = [
  {
    id: 'reserved_reduces',
    label: '2 000 − 1 000',
    hint: 'Обещали 2 000 ₽, в кампаниях 1 000 ₽ → начислим 1 000 ₽',
  },
  {
    id: 'zero_avg',
    label: 'Неделя с 0 ₽',
    hint: 'Одна из 3 недель с прибылью 0 ₽ → на этой неделе не начисляем',
  },
  {
    id: 'reserved_covers',
    label: '500 − 1 000',
    hint: 'К начислению 500 ₽, в кампаниях 1 000 ₽ → доначислим 0 ₽',
  },
] as const;

export type FinanceBalanceSchemeScenarioId =
  (typeof FINANCE_BALANCE_SCHEME_SCENARIOS)[number]['id'];

export const FINANCE_BALANCE_CURRENT_CASE_KEY = 'finance_balance_current_case';
export const FINANCE_BALANCE_CURRENT_DAY_KEY = 'finance_balance_current_day';

export const FINANCE_BALANCE_CURRENT_CASES = [
  { id: 'base', label: 'Обычный' },
  { id: 'tuesday_below_reserve', label: '10 000 − 8 500' },
  { id: 'zero_week', label: 'Неделя с 0 ₽' },
  { id: 'reserve_covers', label: 'Резерв > начисления' },
] as const;

export type FinanceBalanceCurrentCaseId = (typeof FINANCE_BALANCE_CURRENT_CASES)[number]['id'];

export const FINANCE_BALANCE_CURRENT_DAYS = [
  { id: 'tuesday', label: 'Вторник' },
  { id: 'thursday', label: 'Четверг' },
] as const;

export type FinanceBalanceCurrentDayId = (typeof FINANCE_BALANCE_CURRENT_DAYS)[number]['id'];

export function financeBalancePayoutDates(now = new Date()): { tuesday: string; thursday: string } {
  const mondayOffset = (now.getDay() + 6) % 7;
  const at = (weekdayOffset: number) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset + weekdayOffset);
    return formatFinanceDay(date);
  };
  return { tuesday: at(1), thursday: at(3) };
}

export function financeBalanceWeekDate(
  weekdayIndex: number,
  now = new Date(),
  weekOffset = 0,
): string {
  const mondayOffset = (now.getDay() + 6) % 7;
  const date = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - mondayOffset + weekdayIndex + weekOffset * 7,
  );
  return formatFinanceDay(date);
}

export function financeBalanceWeekRangeLabel(now = new Date(), weekOffset = 0): string {
  const mondayOffset = (now.getDay() + 6) % 7;
  const monday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - mondayOffset + weekOffset * 7,
  );
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  if (monday.getMonth() === sunday.getMonth()) {
    const month = formatFinanceDay(monday).replace(/^\d+\s*/, '').replace(/^\d+月/, '月');
    if (getFinanceLocaleId() === 'zh-CN') {
      return `${monday.getMonth() + 1}月${monday.getDate()}日–${sunday.getDate()}日`;
    }
    return `${monday.getDate()}–${sunday.getDate()} ${month}`;
  }
  return `${formatFinanceDay(monday)} – ${formatFinanceDay(sunday)}`;
}

/** Короткий период: «26 окт – 1 нояб» / локализовано */
export function financeBalanceWeekRangeLabelShort(now = new Date(), weekOffset = 0): string {
  const mondayOffset = (now.getDay() + 6) % 7;
  const monday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - mondayOffset + weekOffset * 7,
  );
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  if (getFinanceLocaleId() === 'zh-CN') {
    if (monday.getMonth() === sunday.getMonth()) {
      return `${monday.getMonth() + 1}月${monday.getDate()}日–${sunday.getDate()}日`;
    }
    return `${monday.getMonth() + 1}月${monday.getDate()}日–${sunday.getMonth() + 1}月${sunday.getDate()}日`;
  }
  const short = (d: Date) => formatFinanceDayShort(d);
  if (monday.getMonth() === sunday.getMonth()) {
    const monthPart = short(monday).replace(/^\d+\s*/, '');
    return `${monday.getDate()}–${sunday.getDate()} ${monthPart}`;
  }
  return `${short(monday)} – ${short(sunday)}`;
}

/** Короткие дни недели по текущей локали финансов */
export const financeBalanceWeekDays = () => financeWeekdayLabels();
/** @deprecated используйте financeBalanceWeekDays() — оставлено как alias */
export const FINANCE_BALANCE_WEEK_DAYS = financeBalanceWeekDays;

/** Траты баланса в день в симуляции */
export const FINANCE_BALANCE_DAILY_SPEND_OPTIONS = [0, 5_000] as const;
export type FinanceBalanceDailySpendRub = (typeof FINANCE_BALANCE_DAILY_SPEND_OPTIONS)[number];

/** Шаг ручного добавления трат и резерва в демо */
export const FINANCE_BALANCE_SIM_STEP_RUB = 1_000;

/**
 * Ручные действия по неделям: потрачено с баланса и переведено в резерв кампаний.
 * Резерв недели N вычитается из начисления недели N+1.
 */
export type FinanceBalanceSimAction = { day: number; kind: 'spent' | 'reserve' | 'release'; rub: number };
export type FinanceBalanceSimAdjust = Partial<Record<FinanceBalanceSimWeekId, FinanceBalanceSimAction[]>>;
export const FINANCE_BALANCE_SIM_ADJUST_KEY = 'finance_balance_sim_adjust_v2';

export function readFinanceBalanceSimAdjust(): FinanceBalanceSimAdjust {
  try {
    const raw = sessionStorage.getItem(FINANCE_BALANCE_SIM_ADJUST_KEY);
    if (raw) return JSON.parse(raw) as FinanceBalanceSimAdjust;
  } catch {
    /* ignore */
  }
  return {};
}

export function writeFinanceBalanceSimAdjust(value: FinanceBalanceSimAdjust) {
  try {
    sessionStorage.setItem(FINANCE_BALANCE_SIM_ADJUST_KEY, JSON.stringify(value));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(FINANCE_BALANCE_SIM_EVENT));
}

export const FINANCE_BALANCE_SIM_WEEK_KEY = 'finance_balance_sim_week';
export const FINANCE_BALANCE_SIM_DAY_KEY = 'finance_balance_sim_day';
export const FINANCE_BALANCE_SIM_SPEND_KEY = 'finance_balance_sim_spend';
export const FINANCE_BALANCE_SIM_SCENARIO_KEY = 'finance_balance_sim_scenario';
export const FINANCE_BALANCE_SIM_POSTPONE_KEY = 'finance_balance_sim_postpone_v1';

/** Сценарии симуляции баланса */
export const FINANCE_BALANCE_SIM_SCENARIOS = [
  {
    id: 'base',
    label: '20к → 15к → 0',
    hint: 'Неделя 1: без трат баланса → 20 000. Неделя 2: придёт 15 000. Неделя 3: 0 из‑за нуля в фин. отчётах. Неделя 4: 43 000',
  },
] as const;

export type FinanceBalanceSimScenarioId = (typeof FINANCE_BALANCE_SIM_SCENARIOS)[number]['id'];

/**
 * Три недели симуляции (базовый сценарий):
 * 1) не тратили баланс → придёт все 20 000
 * 2) придёт 15 000
 * 3) ничего — в фин. отчётах была неделя с 0 ₽
 */
export const FINANCE_BALANCE_SIM_WEEKS = [
  {
    id: 'week1',
    label: 'Неделя 1',
    short: 'Неделя 1',
    weekOffset: 0,
    grossRub: 20_000,
    inCampaignsRub: 0,
    weekProfitRub: [20_000, 20_000, 20_000] as [number, number, number],
    explain: 'Баланс не тратили — придёт вся расчётная сумма. Неиспользованное сгорит во вторник следующей недели',
  },
  {
    id: 'week2',
    label: 'Неделя 2',
    short: 'Неделя 2',
    weekOffset: 1,
    grossRub: 15_000,
    inCampaignsRub: 0,
    weekProfitRub: [18_000, 15_000, 12_000] as [number, number, number],
    explain: 'Во вторник обнуляем неиспользованный остаток прошлой недели и начисляем 15 000 ₽',
  },
  {
    id: 'week3',
    label: 'Неделя 3',
    short: 'Неделя 3',
    weekOffset: 2,
    grossRub: 0,
    inCampaignsRub: 0,
    weekProfitRub: [18_000, 12_000, 0] as [number, number, number],
    explain: 'В одной из 3 недель в фин. отчётах 0 ₽ — на этой неделе ничего не начислим',
  },
  {
    id: 'week4',
    label: 'Неделя 4',
    short: 'Неделя 4',
    weekOffset: 3,
    grossRub: 43_000,
    inCampaignsRub: 0,
    weekProfitRub: [41_000, 43_000, 45_000] as [number, number, number],
    explain: 'Прибыль выросла — по расчёту придёт 43 000 ₽',
  },
] as const;

export type FinanceBalanceSimWeekId = (typeof FINANCE_BALANCE_SIM_WEEKS)[number]['id'];

/** @deprecated алиас для совместимости со старыми id шагов */
export type FinanceBalanceSimStepId = FinanceBalanceSimWeekId | 'week1_spent' | 'zero_week';

export const FINANCE_BALANCE_SIM_STEPS = FINANCE_BALANCE_SIM_WEEKS;

/** Лимит недели: 75% во вторник, 25% в четверг — до вычета резерва */
function grossParts(grossRub: number) {
  const grossTuesdayRub = Math.round(grossRub * 0.75);
  const grossThursdayRub = grossRub - grossTuesdayRub;
  return { grossTuesdayRub, grossThursdayRub };
}

/**
 * Лимит делим 75% вт / 25% чт, затем вычитаем резерв в кампаниях
 * (сначала из вторника, остаток — из четверга). Для статичных превью без демо-действий.
 */
function splitGross(grossRub: number, inCampaignsRub: number) {
  const { grossTuesdayRub, grossThursdayRub } = grossParts(grossRub);
  const tuesdayRub = Math.max(0, grossTuesdayRub - inCampaignsRub);
  const reserveLeftRub = Math.max(0, inCampaignsRub - grossTuesdayRub);
  const thursdayRub = Math.max(0, grossThursdayRub - reserveLeftRub);
  const netRub = tuesdayRub + thursdayRub;
  return { grossRub, inCampaignsRub, netRub, tuesdayRub, thursdayRub, grossTuesdayRub, grossThursdayRub };
}

export type FinanceBalanceSimPastWeek = {
  weekOffset: number;
  grossRub: number;
  inCampaignsRub: number;
  netRub: number;
  tuesdayRub: number;
  thursdayRub: number;
  unusedWipedRub: number;
  kind: 'full' | 'reduced' | 'covered' | 'zero_week';
};

export type FinanceBalanceSimView = {
  weekId: FinanceBalanceSimWeekId;
  /** @deprecated */
  stepId: FinanceBalanceSimWeekId;
  label: string;
  mode: 'accrual';
  weekOffset: number;
  startAvailableRub: number;
  unusedWipedRub: number;
  freeOverrideRub: null;
  inCampaignsRub: number;
  grossRub: number;
  netRub: number;
  tuesdayRub: number;
  thursdayRub: number;
  /** Начисления по графику до вычета резерва */
  grossTuesdayRub: number;
  grossThursdayRub: number;
  /** Переведено в резерв кампаний на этой неделе — вычтем из следующего начисления */
  reservedThisWeekRub: number;
  /** Резерв в кампаниях, который нужно вычесть из начисления этой недели */
  reservePendingRub: number;
  /** Из каких недель сложился резерв к вычету */
  reserveSources: { weekOffset: number; rub: number }[];
  /** Траты и резерв текущего периода начислений (до вторника — вместе с прошлой неделей) */
  periodSpentRub: number;
  periodReserveRub: number;
  /** Ручные действия демо, из которых собран вид */
  adjust: FinanceBalanceSimAdjust;
  weekProfitRub: [number, number, number];
  explain: string;
  showSpendAction: false;
  availableNowRub: number;
  /** Фактически потрачено с баланса с пн по выбранный день этой недели */
  spentThisWeekRub: number;
  dailySpendRub: number;
  pastWeeks: FinanceBalanceSimPastWeek[];
  /** @deprecated одно прошлое */
  pastWeek: FinanceBalanceSimPastWeek | null;
};

function weekKind(grossRub: number, netRub: number, inCampaignsRub: number): FinanceBalanceSimPastWeek['kind'] {
  if (grossRub <= 0) return 'zero_week';
  if (netRub <= 0) return 'covered';
  if (inCampaignsRub > 0) return 'reduced';
  return 'full';
}

function pastFromWeek(week: (typeof FINANCE_BALANCE_SIM_WEEKS)[number]): FinanceBalanceSimPastWeek {
  const split = splitGross(week.grossRub, week.inCampaignsRub);
  return {
    weekOffset: week.weekOffset,
    grossRub: split.grossRub,
    inCampaignsRub: split.inCampaignsRub,
    netRub: split.netRub,
    tuesdayRub: split.tuesdayRub,
    thursdayRub: split.thursdayRub,
    unusedWipedRub: 0,
    kind: weekKind(split.grossRub, split.netRub, split.inCampaignsRub),
  };
}

/**
 * Прогон одной недели до выбранного дня.
 * Во вторник / четверг начисляем 75% / 25% лимита минус резерв в кампаниях
 * на этот момент — если в среду завершили кампании, четверг пересчитается без вычета.
 * release — завершение кампаний: деньги из резерва возвращаются на баланс.
 */
function runWeekBalance(
  startRub: number,
  grossTuesdayRub: number,
  grossThursdayRub: number,
  untilDay: number,
  actions: FinanceBalanceSimAction[],
  startReserveStockRub = 0,
): {
  balance: number;
  spentRub: number;
  reserveRub: number;
  unusedWipedRub: number;
  reserveStockRub: number;
  tuesdayRub: number;
  thursdayRub: number;
  tuesdayCutRub: number;
  thursdayCutRub: number;
} {
  let balance = startRub;
  let unusedWipedRub = 0;
  let spentRub = 0;
  let reserveRub = 0;
  let reserveStockRub = startReserveStockRub;
  let tuesdayRub = 0;
  let thursdayRub = 0;
  let tuesdayCutRub = 0;
  let thursdayCutRub = 0;
  for (let day = 0; day <= Math.min(6, untilDay); day += 1) {
    if (day === 1) {
      unusedWipedRub = balance;
      tuesdayCutRub = Math.min(reserveStockRub, grossTuesdayRub);
      tuesdayRub = grossTuesdayRub - tuesdayCutRub;
      balance = tuesdayRub;
    }
    if (day === 3) {
      thursdayCutRub = Math.min(reserveStockRub, grossThursdayRub);
      thursdayRub = grossThursdayRub - thursdayCutRub;
      balance += thursdayRub;
    }
    actions
      .filter((action) => action.day === day)
      .forEach((action) => {
        if (action.kind === 'release') {
          const rub = Math.min(action.rub, reserveStockRub);
          reserveStockRub -= rub;
          balance += rub;
          return;
        }
        const rub = Math.min(action.rub, balance);
        balance -= rub;
        if (action.kind === 'spent') spentRub += rub;
        else {
          reserveRub += rub;
          reserveStockRub += rub;
        }
      });
  }
  return {
    balance,
    spentRub,
    reserveRub,
    unusedWipedRub,
    reserveStockRub,
    tuesdayRub,
    thursdayRub,
    tuesdayCutRub,
    thursdayCutRub,
  };
}

export function buildFinanceBalanceSimView(
  weekId: FinanceBalanceSimWeekId | FinanceBalanceSimStepId,
  weekdayIndex: number,
  adjust: FinanceBalanceSimAdjust = {},
): FinanceBalanceSimView {
  const normalizedId: FinanceBalanceSimWeekId =
    weekId === 'week1_spent'
      ? 'week1'
      : weekId === 'zero_week'
        ? 'week3'
        : FINANCE_BALANCE_SIM_WEEKS.some((w) => w.id === weekId)
          ? (weekId as FinanceBalanceSimWeekId)
          : 'week1';

  const weekIndex = FINANCE_BALANCE_SIM_WEEKS.findIndex((item) => item.id === normalizedId);
  const week = FINANCE_BALANCE_SIM_WEEKS[weekIndex] ?? FINANCE_BALANCE_SIM_WEEKS[0];
  const adjustOf = (id: FinanceBalanceSimWeekId) => {
    const actions = adjust[id];
    return Array.isArray(actions) ? actions : [];
  };

  /**
   * Резерв на кампаниях уменьшает начисление в день начисления по остатку на этот день.
   * Завершение кампаний в среду возвращает деньги на баланс и убирает вычет из четверга.
   */
  let carryRub = 0;
  let prevReserveRub = 0;
  let prevSpentRub = 0;
  let reserveStockRub = 0;
  let reserveSources: { weekOffset: number; rub: number }[] = [];

  const pastWeeks: FinanceBalanceSimPastWeek[] = [];
  for (let i = 0; i < weekIndex; i += 1) {
    const prev = FINANCE_BALANCE_SIM_WEEKS[i];
    const actions = adjustOf(prev.id);
    const parts = grossParts(prev.grossRub);
    pastWeeks.push(pastFromWeek(prev));
    const prevRun = runWeekBalance(
      carryRub,
      parts.grossTuesdayRub,
      parts.grossThursdayRub,
      6,
      actions,
      reserveStockRub + prev.inCampaignsRub,
    );
    carryRub = prevRun.balance;
    prevReserveRub = prevRun.reserveRub;
    prevSpentRub = prevRun.spentRub;
    reserveStockRub = prevRun.reserveStockRub;
    if (prevRun.reserveRub > 0) {
      reserveSources = [...reserveSources, { weekOffset: prev.weekOffset, rub: prevRun.reserveRub }];
    }
  }

  /** До вторника период ещё прошлый: траты и резерв прошлой недели остаются в сводке */
  const inPrevPeriod = weekIndex > 0 && weekdayIndex < 1;

  const actions = adjustOf(week.id);
  const parts = grossParts(week.grossRub);
  const startStock = reserveStockRub + week.inCampaignsRub;
  const fullRun = runWeekBalance(
    carryRub,
    parts.grossTuesdayRub,
    parts.grossThursdayRub,
    6,
    actions,
    startStock,
  );
  const weekRun =
    weekdayIndex >= 6
      ? fullRun
      : runWeekBalance(
          carryRub,
          parts.grossTuesdayRub,
          parts.grossThursdayRub,
          weekdayIndex,
          actions,
          startStock,
        );
  /** Остаток в кампаниях после резервов и завершений к сегодня */
  const reservePendingRub = weekRun.reserveStockRub;
  const currentSources =
    weekRun.reserveRub > 0
      ? [...reserveSources, { weekOffset: week.weekOffset, rub: weekRun.reserveRub }]
      : reserveSources;
  const netRub = fullRun.tuesdayRub + fullRun.thursdayRub;
  const cutRub = fullRun.tuesdayCutRub + fullRun.thursdayCutRub;

  return {
    weekId: week.id,
    stepId: week.id,
    label: week.label,
    mode: 'accrual',
    weekOffset: week.weekOffset,
    startAvailableRub: carryRub,
    unusedWipedRub: weekRun.unusedWipedRub,
    freeOverrideRub: null,
    inCampaignsRub: cutRub,
    grossRub: week.grossRub,
    netRub,
    tuesdayRub: fullRun.tuesdayRub,
    thursdayRub: fullRun.thursdayRub,
    grossTuesdayRub: parts.grossTuesdayRub,
    grossThursdayRub: parts.grossThursdayRub,
    reservedThisWeekRub: weekRun.reserveRub,
    reservePendingRub,
    reserveSources: currentSources,
    periodSpentRub: weekRun.spentRub + (inPrevPeriod ? prevSpentRub : 0),
    periodReserveRub: weekRun.reserveRub + (inPrevPeriod ? prevReserveRub : 0),
    adjust,
    weekProfitRub: week.weekProfitRub,
    explain: week.explain,
    showSpendAction: false,
    availableNowRub: weekRun.balance,
    spentThisWeekRub: weekRun.spentRub,
    dailySpendRub: 0,
    pastWeeks,
    pastWeek: pastWeeks.length ? pastWeeks[pastWeeks.length - 1] : null,
  };
}

/** Воскресенье выбранной недели симуляции — дата списания расхода */
export function financeBalanceWeekChargeDate(now = new Date(), weekOffset = 0): string {
  return financeBalanceWeekDate(6, now, weekOffset);
}

/** Перенос списания расхода конкретной недели на воскресенье через N недель */
export type FinanceBalancePostponeEntry = {
  optionId: string;
  weeksLater: number;
  feePercent: number;
};
export type FinanceBalancePostponeMap = Partial<Record<FinanceBalanceSimWeekId, FinanceBalancePostponeEntry>>;

export function readFinanceBalanceSimPostpone(): FinanceBalancePostponeMap {
  try {
    const raw = sessionStorage.getItem(FINANCE_BALANCE_SIM_POSTPONE_KEY);
    if (raw) return JSON.parse(raw) as FinanceBalancePostponeMap;
  } catch {
    /* ignore */
  }
  return {};
}

export function writeFinanceBalanceSimPostpone(value: FinanceBalancePostponeMap) {
  try {
    sessionStorage.setItem(FINANCE_BALANCE_SIM_POSTPONE_KEY, JSON.stringify(value));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(FINANCE_BALANCE_SIM_EVENT));
}

/** Платежи прошлых недель, которые должны списаться в воскресенье текущей недели */
export function financeBalanceDuePostponedCharges(
  weekId: FinanceBalanceSimWeekId,
  adjust: FinanceBalanceSimAdjust = {},
  postponeMap: FinanceBalancePostponeMap = readFinanceBalanceSimPostpone(),
): {
  period: string;
  spentRub: number;
  feePercent: number;
  feeRub: number;
  chargeRub: number;
  sourceWeekId: FinanceBalanceSimWeekId;
}[] {
  const current = FINANCE_BALANCE_SIM_WEEKS.find((week) => week.id === weekId);
  if (!current) return [];
  const due: {
    period: string;
    spentRub: number;
    feePercent: number;
    feeRub: number;
    chargeRub: number;
    sourceWeekId: FinanceBalanceSimWeekId;
  }[] = [];
  for (const week of FINANCE_BALANCE_SIM_WEEKS) {
    if (week.weekOffset >= current.weekOffset) continue;
    const entry = postponeMap[week.id];
    if (!entry || entry.weeksLater <= 0) continue;
    if (week.weekOffset + entry.weeksLater !== current.weekOffset) continue;
    const spentRub = buildFinanceBalanceSimView(week.id, 6, adjust).spentThisWeekRub;
    if (spentRub <= 0) continue;
    const feeRub = Math.round((spentRub * entry.feePercent) / 100);
    due.push({
      period: financeBalanceWeekRangeLabel(undefined, week.weekOffset),
      spentRub,
      feePercent: entry.feePercent,
      feeRub,
      chargeRub: spentRub + feeRub,
      sourceWeekId: week.id,
    });
  }
  return due;
}

export const FINANCE_BALANCE_SIM_EVENT = 'finance-balance-sim';

function dispatchFinanceBalanceSimEvent() {
  window.dispatchEvent(new Event(FINANCE_BALANCE_SIM_EVENT));
}

export function readFinanceBalanceSimWeek(): FinanceBalanceSimWeekId {
  try {
    const raw = sessionStorage.getItem(FINANCE_BALANCE_SIM_WEEK_KEY);
    const match = FINANCE_BALANCE_SIM_WEEKS.find((item) => item.id === raw);
    if (match) return match.id;
    // миграция со старых ключей
    const legacy = sessionStorage.getItem('finance_balance_sim_step');
    if (legacy === 'week1' || legacy === 'week1_spent') return 'week1';
    if (legacy === 'week2') return 'week2';
    if (legacy === 'week3' || legacy === 'zero_week') return 'week3';
  } catch {
    /* ignore */
  }
  return 'week1';
}

/** @deprecated */
export function readFinanceBalanceSimStep(): FinanceBalanceSimWeekId {
  return readFinanceBalanceSimWeek();
}

export function writeFinanceBalanceSimWeek(id: FinanceBalanceSimWeekId) {
  try {
    sessionStorage.setItem(FINANCE_BALANCE_SIM_WEEK_KEY, id);
  } catch {
    /* ignore */
  }
  dispatchFinanceBalanceSimEvent();
}

/** @deprecated */
export function writeFinanceBalanceSimStep(id: FinanceBalanceSimStepId) {
  const weekId: FinanceBalanceSimWeekId =
    id === 'week1_spent' ? 'week1' : id === 'zero_week' ? 'week3' : (id as FinanceBalanceSimWeekId);
  writeFinanceBalanceSimWeek(weekId);
}

export function readFinanceBalanceSimDay(): number {
  try {
    const raw = sessionStorage.getItem(FINANCE_BALANCE_SIM_DAY_KEY);
    const index = Number(raw);
    if (raw !== null && Number.isInteger(index) && index >= 0 && index <= 6) return index;
  } catch {
    /* ignore */
  }
  return 0;
}

export function writeFinanceBalanceSimDay(index: number) {
  try {
    sessionStorage.setItem(FINANCE_BALANCE_SIM_DAY_KEY, String(index));
  } catch {
    /* ignore */
  }
  dispatchFinanceBalanceSimEvent();
}

export function readFinanceBalanceSimSpend(): FinanceBalanceDailySpendRub {
  try {
    const raw = Number(sessionStorage.getItem(FINANCE_BALANCE_SIM_SPEND_KEY));
    const match = FINANCE_BALANCE_DAILY_SPEND_OPTIONS.find((value) => value === raw);
    if (match !== undefined) return match;
  } catch {
    /* ignore */
  }
  return 0;
}

export function writeFinanceBalanceSimSpend(value: FinanceBalanceDailySpendRub) {
  try {
    sessionStorage.setItem(FINANCE_BALANCE_SIM_SPEND_KEY, String(value));
  } catch {
    /* ignore */
  }
  dispatchFinanceBalanceSimEvent();
}

export function readFinanceBalanceSimScenario(): FinanceBalanceSimScenarioId {
  try {
    const raw = sessionStorage.getItem(FINANCE_BALANCE_SIM_SCENARIO_KEY);
    const match = FINANCE_BALANCE_SIM_SCENARIOS.find((item) => item.id === raw);
    if (match) return match.id;
  } catch {
    /* ignore */
  }
  return 'base';
}

export function writeFinanceBalanceSimScenario(id: FinanceBalanceSimScenarioId) {
  try {
    sessionStorage.setItem(FINANCE_BALANCE_SIM_SCENARIO_KEY, id);
  } catch {
    /* ignore */
  }
}

export function readFinanceBalanceCurrentCase(): FinanceBalanceCurrentCaseId {
  try {
    const raw = sessionStorage.getItem(FINANCE_BALANCE_CURRENT_CASE_KEY);
    const match = FINANCE_BALANCE_CURRENT_CASES.find((item) => item.id === raw);
    if (match) return match.id;
  } catch {
    /* ignore */
  }
  return 'base';
}

export function writeFinanceBalanceCurrentCase(id: FinanceBalanceCurrentCaseId) {
  try {
    sessionStorage.setItem(FINANCE_BALANCE_CURRENT_CASE_KEY, id);
  } catch {
    /* ignore */
  }
}

export function readFinanceBalanceCurrentDay(): FinanceBalanceCurrentDayId {
  try {
    const raw = sessionStorage.getItem(FINANCE_BALANCE_CURRENT_DAY_KEY);
    if (raw === 'tuesday' || raw === 'thursday') return raw;
  } catch {
    /* ignore */
  }
  return 'tuesday';
}

export function writeFinanceBalanceCurrentDay(id: FinanceBalanceCurrentDayId) {
  try {
    sessionStorage.setItem(FINANCE_BALANCE_CURRENT_DAY_KEY, id);
  } catch {
    /* ignore */
  }
}

export function readFinanceBalanceDemoCase(): FinanceBalanceDemoCaseId {
  try {
    const raw = sessionStorage.getItem(FINANCE_BALANCE_DEMO_STORAGE_KEY);
    if (raw === 'zero' || raw === 'funded') return raw;
  } catch {
    /* ignore */
  }
  return 'funded';
}

export function readFinanceBufferRub(): number {
  try {
    const raw = sessionStorage.getItem(FINANCE_BALANCE_AMOUNT_KEY);
    if (raw !== null) {
      const amount = Number(raw);
      if (Number.isFinite(amount) && amount >= 0) return amount;
    }
  } catch {
    /* ignore */
  }
  const id = readFinanceBalanceDemoCase();
  return FINANCE_BALANCE_DEMO_CASES.find((item) => item.id === id)?.amount ?? 0;
}

export function writeFinanceBalanceAmountRub(amount: number) {
  const next = Math.max(0, Math.round(amount));
  try {
    sessionStorage.setItem(FINANCE_BALANCE_AMOUNT_KEY, String(next));
    const nearest = FINANCE_BALANCE_DEMO_CASES.find((item) => item.amount === next);
    if (nearest) sessionStorage.setItem(FINANCE_BALANCE_DEMO_STORAGE_KEY, nearest.id);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(FINANCE_BALANCE_DEMO_EVENT));
}

export function writeFinanceBalanceDemoCase(id: FinanceBalanceDemoCaseId) {
  const amount = FINANCE_BALANCE_DEMO_CASES.find((item) => item.id === id)?.amount ?? 0;
  try {
    sessionStorage.setItem(FINANCE_BALANCE_DEMO_STORAGE_KEY, id);
    sessionStorage.setItem(FINANCE_BALANCE_AMOUNT_KEY, String(amount));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(FINANCE_BALANCE_DEMO_EVENT));
}

export function readFinanceBalanceSchemeLayout(): FinanceBalanceSchemeLayoutId {
  try {
    const raw = sessionStorage.getItem(FINANCE_BALANCE_SCHEME_LAYOUT_KEY);
    const match = FINANCE_BALANCE_SCHEME_LAYOUTS.find((item) => item.id === raw);
    if (match) return match.id;
  } catch {
    /* ignore */
  }
  return 'status';
}

export function writeFinanceBalanceSchemeLayout(id: FinanceBalanceSchemeLayoutId) {
  try {
    sessionStorage.setItem(FINANCE_BALANCE_SCHEME_LAYOUT_KEY, id);
  } catch {
    /* ignore */
  }
}

export function readFinanceBalanceSchemeScenario(): FinanceBalanceSchemeScenarioId {
  try {
    const raw = sessionStorage.getItem(FINANCE_BALANCE_SCHEME_SCENARIO_KEY);
    if (raw === 'reserved_reduces' || raw === 'zero_avg' || raw === 'reserved_covers') {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return 'reserved_reduces';
}

export function writeFinanceBalanceSchemeScenario(id: FinanceBalanceSchemeScenarioId) {
  try {
    sessionStorage.setItem(FINANCE_BALANCE_SCHEME_SCENARIO_KEY, id);
  } catch {
    /* ignore */
  }
}

/** Legacy stubs — status day/spend больше не используются отдельно */
export function readFinanceBalanceStatusDay(): number {
  return readFinanceBalanceSimDay();
}
export function writeFinanceBalanceStatusDay(index: number) {
  writeFinanceBalanceSimDay(index);
}
export function readFinanceBalanceStatusSpend(): FinanceBalanceDailySpendRub {
  return readFinanceBalanceSimSpend();
}
export function writeFinanceBalanceStatusSpend(value: FinanceBalanceDailySpendRub) {
  writeFinanceBalanceSimSpend(value);
}
