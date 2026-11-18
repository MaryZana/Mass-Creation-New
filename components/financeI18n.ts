/** Локали кабинетов финансов: RU + CN / UZ / KZ / GE / ET */

export type FinanceLocaleId = 'ru' | 'zh-CN' | 'uz' | 'kk' | 'ka' | 'am';

export type FinanceLocaleMeta = {
  id: FinanceLocaleId;
  /** Код для Intl */
  bcp47: string;
  /** Подпись в переключателе (нативное название) */
  nativeLabel: string;
  /** Название языка по-русски (для списка в переключателе) */
  ruLabel: string;
  /** Краткий код на кнопке */
  shortLabel: string;
  /** Страна / кабинет */
  marketLabel: string;
};

export const FINANCE_LOCALES: FinanceLocaleMeta[] = [
  { id: 'ru', bcp47: 'ru-RU', nativeLabel: 'Русский', ruLabel: 'Русский', shortLabel: 'RU', marketLabel: 'Россия' },
  { id: 'zh-CN', bcp47: 'zh-CN', nativeLabel: '中文', ruLabel: 'Китайский', shortLabel: '中文', marketLabel: '中国' },
  { id: 'uz', bcp47: 'uz-UZ', nativeLabel: 'Oʻzbekcha', ruLabel: 'Узбекский', shortLabel: 'UZ', marketLabel: 'Oʻzbekiston' },
  { id: 'kk', bcp47: 'kk-KZ', nativeLabel: 'Қазақша', ruLabel: 'Казахский', shortLabel: 'KK', marketLabel: 'Қазақстан' },
  { id: 'ka', bcp47: 'ka-GE', nativeLabel: 'ქართული', ruLabel: 'Грузинский', shortLabel: 'KA', marketLabel: 'საქართველო' },
  { id: 'am', bcp47: 'am-ET', nativeLabel: 'አማርኛ', ruLabel: 'Амхарский', shortLabel: 'አማ', marketLabel: 'ኢትዮጵያ' },
];

const STORAGE_KEY = 'finance-locale';

let currentLocaleId: FinanceLocaleId = 'ru';
const listeners = new Set<() => void>();

export function getFinanceLocaleId(): FinanceLocaleId {
  return currentLocaleId;
}

export function getFinanceLocaleMeta(id: FinanceLocaleId = currentLocaleId): FinanceLocaleMeta {
  return FINANCE_LOCALES.find((l) => l.id === id) ?? FINANCE_LOCALES[0];
}

export function getFinanceBcp47(id: FinanceLocaleId = currentLocaleId): string {
  return getFinanceLocaleMeta(id).bcp47;
}

export function setFinanceLocaleId(id: FinanceLocaleId) {
  if (currentLocaleId === id) return;
  currentLocaleId = id;
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn());
}

export function subscribeFinanceLocale(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function readStoredFinanceLocale(): FinanceLocaleId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && FINANCE_LOCALES.some((l) => l.id === raw)) return raw as FinanceLocaleId;
  } catch {
    /* ignore */
  }
  return 'ru';
}

export function initFinanceLocaleFromStorage() {
  currentLocaleId = readStoredFinanceLocale();
}

/** Числа: для zh — 8,904; для ru/kk/uz — 8 904 */
export function formatFinanceNumber(n: number, locale: FinanceLocaleId = currentLocaleId): string {
  return new Intl.NumberFormat(getFinanceBcp47(locale), { maximumFractionDigits: 0 }).format(n);
}

/**
 * Явные названия месяцев — Safari/часть браузеров для am (и иногда ka)
 * отдают скелет ICU вроде «M08 11» вместо имени месяца.
 */
const FINANCE_MONTH_LONG: Record<Exclude<FinanceLocaleId, 'zh-CN'>, string[]> = {
  ru: [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря',
  ],
  uz: [
    'yanvar',
    'fevral',
    'mart',
    'aprel',
    'may',
    'iyun',
    'iyul',
    'avgust',
    'sentabr',
    'oktabr',
    'noyabr',
    'dekabr',
  ],
  kk: [
    'қаңтар',
    'ақпан',
    'наурыз',
    'сәуір',
    'мамыр',
    'маусым',
    'шілде',
    'тамыз',
    'қыркүйек',
    'қазан',
    'қараша',
    'желтоқсан',
  ],
  ka: [
    'იანვარი',
    'თებერვალი',
    'მარტი',
    'აპრილი',
    'მაისი',
    'ივნისი',
    'ივლისი',
    'აგვისტო',
    'სექტემბერი',
    'ოქტომბერი',
    'ნოემბერი',
    'დეკემბერი',
  ],
  am: [
    'ጃንዩወሪ',
    'ፌብሩወሪ',
    'ማርች',
    'ኤፕሪል',
    'ሜይ',
    'ጁን',
    'ጁላይ',
    'ኦገስት',
    'ሴፕቴምበር',
    'ኦክቶበር',
    'ኖቬምበር',
    'ዲሴምበር',
  ],
};

const FINANCE_MONTH_SHORT: Record<'ru' | 'uz' | 'kk' | 'ka' | 'am', string[]> = {
  ru: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
  uz: ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'],
  kk: ['қаң', 'ақп', 'нау', 'сәу', 'мам', 'мау', 'шіл', 'там', 'қыр', 'қаз', 'қар', 'жел'],
  ka: ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ'],
  am: ['ጃን', 'ፌብ', 'ማር', 'ኤፕ', 'ሜይ', 'ጁን', 'ጁላይ', 'ኦገ', 'ሴፕ', 'ኦክ', 'ኖቬ', 'ዲሴ'],
};

function isBrokenIntlMonthLabel(label: string): boolean {
  // ICU skeleton fallback: «M08 11», «MM 11», «08 11» без имени
  return /\bM{1,4}\d{0,2}\b/i.test(label) || /^M?\d{1,2}\s+\d{1,2}$/i.test(label.trim());
}

/**
 * Заголовок дня в ленте.
 * RU: «10 августа» / «10 августа 2025»
 * ZH: «8月10日» / «2025年8月10日» — НЕ «10 августа» (для китайцев это чужой паттерн)
 * UZ/KK/KA/AM: день + длинный месяц (свои таблицы — без «M08»)
 */
export function formatFinanceDayHeading(
  date: Date,
  showYear = false,
  locale: FinanceLocaleId = currentLocaleId,
): string {
  const bcp47 = getFinanceBcp47(locale);
  if (locale === 'zh-CN') {
    return showYear
      ? date.toLocaleDateString(bcp47, { year: 'numeric', month: 'long', day: 'numeric' })
      : date.toLocaleDateString(bcp47, { month: 'long', day: 'numeric' });
  }

  const day = date.getDate();
  const monthName = FINANCE_MONTH_LONG[locale][date.getMonth()];
  const year = date.getFullYear();

  // am: месяц перед днём (ኦገስት 11); остальные — день + месяц
  if (locale === 'am') {
    return showYear ? `${monthName} ${day} ${year}` : `${monthName} ${day}`;
  }
  if (locale === 'uz') {
    return showYear ? `${day}-${monthName}, ${year}` : `${day}-${monthName}`;
  }

  const built = showYear ? `${day} ${monthName} ${year}` : `${day} ${monthName}`;

  // страховка: если вдруг снова пойдём через Intl
  if (isBrokenIntlMonthLabel(built)) {
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return showYear ? `${d}.${m}.${year}` : `${d}.${m}`;
  }
  return built;
}

export function formatFinanceDay(date: Date, locale: FinanceLocaleId = currentLocaleId): string {
  return formatFinanceDayHeading(date, false, locale);
}

/** Короткий день+месяц для подписей («8 нояб» / «11月8日») */
export function formatFinanceDayShort(date: Date, locale: FinanceLocaleId = currentLocaleId): string {
  const bcp47 = getFinanceBcp47(locale);
  if (locale === 'zh-CN') {
    return date.toLocaleDateString(bcp47, { month: 'numeric', day: 'numeric' });
  }
  const day = date.getDate();
  const monthShort = FINANCE_MONTH_SHORT[locale][date.getMonth()];
  if (locale === 'am') return `${monthShort} ${day}`;
  if (locale === 'uz') return `${day}-${monthShort}`;
  return `${day} ${monthShort}`;
}

/**
 * Даты в ячейках таблицы.
 * ZH: YYYY/MM/DD; остальные кабинеты: DD.MM.YYYY (привычно для UZ/KZ/GE/ET в B2B)
 */
export function formatFinanceTableDate(
  value: string,
  locale: FinanceLocaleId = currentLocaleId,
): string {
  const date = parseStoredFinanceDate(value);
  if (!date) return value;
  if (locale === 'zh-CN') {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}/${m}/${d}`;
  }
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}.${m}.${date.getFullYear()}`;
}

export function formatFinanceInputDate(
  date: Date,
  locale: FinanceLocaleId = currentLocaleId,
): string {
  if (locale === 'zh-CN') {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}.${m}.${date.getFullYear()}`;
}

export function parseStoredFinanceDate(value: string): Date | null {
  const trimmed = value.trim();
  const dmy = /^(\d{2})\.(\d{2})\.(\d{2}|\d{4})$/.exec(trimmed);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]) - 1;
    const rawYear = Number(dmy[3]);
    const year = rawYear < 100 ? 2000 + rawYear : rawYear;
    const date = new Date(year, month, day);
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null;
    return date;
  }
  const ymd = /^(\d{4})[-/](\d{2})[-/](\d{2})$/.exec(trimmed);
  if (ymd) {
    const year = Number(ymd[1]);
    const month = Number(ymd[2]) - 1;
    const day = Number(ymd[3]);
    const date = new Date(year, month, day);
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null;
    return date;
  }
  return null;
}

export function financeWeekdayLabels(locale: FinanceLocaleId = currentLocaleId): string[] {
  // Пн…Вс в порядке ISO (пн = 0)
  const monday = new Date(2024, 0, 1); // Monday
  const bcp47 = getFinanceBcp47(locale);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toLocaleDateString(bcp47, { weekday: 'short' });
  });
}

export function financeWeekdayLongLabels(locale: FinanceLocaleId = currentLocaleId): string[] {
  const monday = new Date(2024, 0, 1);
  const bcp47 = getFinanceBcp47(locale);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toLocaleDateString(bcp47, { weekday: 'long' });
  });
}

export type FinanceMessageKey =
  | 'operationsHistory'
  | 'search'
  | 'selectPeriod'
  | 'allPeriod'
  | 'day'
  | 'week'
  | 'quarter'
  | 'year'
  | 'noDate'
  | 'allSources'
  | 'allChannels'
  | 'campaignCharges'
  | 'account'
  | 'balance'
  | 'bonusReturns'
  | 'expiredBonuses'
  | 'charges'
  | 'accruals'
  | 'paymentMethod'
  | 'refundType'
  | 'chargeType'
  | 'mediaChargeType'
  | 'historyType'
  | 'channel'
  | 'source'
  | 'chargeSource'
  | 'contractsSum'
  | 'contracts'
  | 'promoBonuses'
  | 'active'
  | 'expired'
  | 'promotion'
  | 'media'
  | 'byImpressions'
  | 'byDays'
  | 'pushes'
  | 'showAll'
  | 'collapse'
  | 'nothingFound'
  | 'noActiveContracts'
  | 'noExpiredContracts'
  | 'inactive'
  | 'extendContract'
  | 'close'
  | 'downloadExcel'
  | 'language'
  | 'contractOne'
  | 'contractFew'
  | 'contractMany'
  | 'emptyOps'
  | 'dateAccrual'
  | 'dateCharge'
  | 'amount'
  | 'forPeriod'
  | 'commission'
  | 'topUp'
  | 'previousMonth'
  | 'nextMonth'
  | 'unifiedAccount'
  | 'resetsOnTuesday'
  | 'weekLimit'
  | 'expected'
  | 'accrued'
  | 'firstBalancePart'
  | 'secondBalancePart'
  | 'bySchedule'
  | 'ofLimit'
  | 'balanceInCampaigns'
  | 'willArrive'
  | 'arrived'
  | 'promoPayment'
  | 'onSellerPortal'
  | 'videoGuide'
  | 'unifiedHelp1'
  | 'unifiedHelp2'
  | 'campaignId'
  | 'campaignNameType'
  | 'finishDate'
  | 'refundAmount'
  | 'status'
  | 'refundEta'
  | 'paymentDate'
  | 'amountRub'
  | 'payerInn'
  | 'endsAt'
  | 'topupDate'
  | 'documentNo'
  | 'campaign'
  | 'type'
  | 'burnsUntil'
  | 'scenario'
  | 'desktop'
  | 'iphone'
  | 'spent'
  | 'remaining'
  | 'inCampaigns'
  | 'noAccrualThisWeek'
  | 'today'
  | 'yesterday'
  | 'topUpAccount'
  | 'balanceAccruals'
  | 'whatIsPromoAccount'
  | 'influence'
  | 'dueToPay'
  | 'fromBalanceOnPortal'
  | 'bonuses'
  | 'promoBonusesHelp'
  | 'goToPromoBonuses'
  | 'pauseCharge'
  | 'fraudCharge'
  | 'refundToBalance'
  | 'refundToBonuses'
  | 'thisWeek'
  | 'spendFor'
  | 'spendOn'
  | 'deferredFromEarlier'
  | 'totalDue'
  | 'toCharge'
  | 'postponeCharge'
  | 'changeChargeDate'
  | 'changeDate'
  | 'postponedPaymentOne'
  | 'postponedPaymentFew'
  | 'postponedPaymentMany'
  | 'paymentMovedNote'
  | 'campaignTypeCpmManual'
  | 'campaignTypeCpc'
  | 'campaignTypeCpmUnified'
  | 'searchSuffix'
  | 'recsSuffix'
  | 'autobidderSuffix'

type Messages = Record<FinanceMessageKey, string>;

const RU: Messages = {
  operationsHistory: 'История операций',
  search: 'Поиск',
  selectPeriod: 'Выбрать период',
  allPeriod: 'Весь период',
  day: 'День',
  week: 'Неделя',
  quarter: 'Квартал',
  year: 'Год',
  noDate: 'Без даты',
  allSources: 'Все источники',
  allChannels: 'Все каналы',
  campaignCharges: 'Списания по кампаниям',
  account: 'Счёт',
  balance: 'Баланс',
  bonusReturns: 'Возвраты бонусов',
  expiredBonuses: 'Истёкшие бонусы',
  charges: 'Списания',
  accruals: 'Начисления',
  paymentMethod: 'Способ оплаты',
  refundType: 'Тип возврата',
  chargeType: 'Тип списания',
  mediaChargeType: 'Тип списания медиа',
  historyType: 'Тип истории',
  channel: 'Канал',
  source: 'Источник',
  chargeSource: 'Источник списания',
  contractsSum: 'Сумма на контрактах',
  contracts: 'Контракты',
  promoBonuses: 'Промобонусы',
  active: 'Активные',
  expired: 'Истёкшие',
  promotion: 'Продвижение',
  media: 'Медиа',
  byImpressions: 'По показам',
  byDays: 'По дням',
  pushes: 'Пуши',
  showAll: 'Показать все',
  collapse: 'Свернуть',
  nothingFound: 'Ничего не нашли',
  noActiveContracts: 'Нет активных контрактов',
  noExpiredContracts: 'Нет истёкших контрактов',
  inactive: 'неактивен',
  extendContract: 'Продление контракта',
  close: 'Закрыть',
  downloadExcel: 'Скачать Excel',
  language: 'Язык',
  contractOne: 'контракт',
  contractFew: 'контракта',
  contractMany: 'контрактов',
  emptyOps: 'Пока нет операций',
  dateAccrual: 'Дата начисления',
  dateCharge: 'Дата списания',
  amount: 'Сумма',
  forPeriod: 'За период',
  commission: 'Комиссия',
  topUp: 'Пополнить',
  previousMonth: 'Предыдущий месяц',
  nextMonth: 'Следующий месяц',
  unifiedAccount: "Единый счёт",
  resetsOnTuesday: "Обнулится во вторник",
  weekLimit: "Лимит недели",
  expected: "Ожидается",
  accrued: "Начислено",
  firstBalancePart: "Первая часть баланса",
  secondBalancePart: "Вторая часть баланса",
  bySchedule: "По графику",
  ofLimit: "лимита",
  balanceInCampaigns: "Баланс в кампаниях",
  willArrive: "Придёт на баланс",
  arrived: "Пришло на баланс",
  promoPayment: "Оплата продвижения",
  onSellerPortal: "на портале продавца",
  videoGuide: "Видеоинструкция",
  unifiedHelp1: "Сумма ваших денег и баланса",
  unifiedHelp2: "Когда пополняете кампанию, деньги сначала списываются со счёта, а если суммы не хватит — с баланса",
  campaignId: "ID кампании",
  campaignNameType: "Кампания, Тип",
  finishDate: "Дата завершения",
  refundAmount: "Сумма к возврату, ₽",
  status: "Статус",
  refundEta: "Возврат ≈ 5–7 дней",
  paymentDate: "Дата оплаты",
  amountRub: "Сумма, ₽",
  payerInn: "ИНН плательщика",
  endsAt: "Конец действия",
  topupDate: "Дата пополнения",
  documentNo: "№ документа",
  campaign: "Кампания",
  type: "Тип",
  burnsUntil: "Сгорают до",
  scenario: "Сценарий",
  desktop: "Десктоп",
  iphone: "iPhone",
  spent: "Потрачено",
  remaining: "Осталось",
  inCampaigns: "В кампаниях",
  noAccrualThisWeek: "На этой неделе без начисления",
  today: "Сегодня",
  yesterday: "Вчера",
  topUpAccount: "Пополнить счёт",
  balanceAccruals: "Начисления баланса",
  whatIsPromoAccount: "Что такое счёт продвижения",
  influence: "Инфлюенс",
  dueToPay: "К оплате",
  fromBalanceOnPortal: "С баланса на портале продавца",
  bonuses: "Бонусы",
  promoBonusesHelp: "Дополнительный источник, с которого можно списать часть от суммы пополнения. Начисляем их, например, за регистрацию нового продавца или за задания по продвижению.",
  goToPromoBonuses: "Перейти к промобонусам",
  pauseCharge: "За приостановку кампании",
  fraudCharge: "Возвращение с фрода",
  refundToBalance: "С баланса",
  refundToBonuses: "С бонусов",
  thisWeek: "Эта неделя",
  spendFor: "Расход за",
  spendOn: "Расход на",
  deferredFromEarlier: "Отложенные с прошлых недель",
  totalDue: "Итого к оплате",
  toCharge: "К списанию",
  postponeCharge: "Отложить списание",
  changeChargeDate: "Изменить дату списания",
  changeDate: "Изменить дату",
  postponedPaymentOne: "Отложенный платёж",
  postponedPaymentFew: "Отложенных платежа",
  postponedPaymentMany: "Отложенных платежей",
  paymentMovedNote: "Оплата перенесена на {date} — на этой неделе не спишем",
  campaignTypeCpmManual: "CPM ручная ставка",
  campaignTypeCpc: "CPC",
  campaignTypeCpmUnified: "CPM единая ставка",
  searchSuffix: "поиск",
  recsSuffix: "рекомендации",
  autobidderSuffix: "автобиддер",
};

const ZH: Messages = {
  operationsHistory: '交易记录',
  search: '搜索',
  selectPeriod: '选择周期',
  allPeriod: '全部时间',
  day: '日',
  week: '周',
  quarter: '季度',
  year: '年',
  noDate: '无日期',
  allSources: '全部来源',
  allChannels: '全部渠道',
  campaignCharges: '广告活动扣款',
  account: '账户',
  balance: '余额',
  bonusReturns: '奖金退回',
  expiredBonuses: '已过期奖金',
  charges: '扣款',
  accruals: '入账',
  paymentMethod: '支付方式',
  refundType: '退款类型',
  chargeType: '扣款类型',
  mediaChargeType: '媒体扣款类型',
  historyType: '记录类型',
  channel: '渠道',
  source: '来源',
  chargeSource: '扣款来源',
  contractsSum: '合同余额合计',
  contracts: '合同',
  promoBonuses: '促销奖金',
  active: '生效中',
  expired: '已过期',
  promotion: '推广',
  media: '媒体',
  byImpressions: '按展示',
  byDays: '按天',
  pushes: '推送',
  showAll: '显示全部',
  collapse: '收起',
  nothingFound: '未找到结果',
  noActiveContracts: '暂无生效合同',
  noExpiredContracts: '暂无过期合同',
  inactive: '未激活',
  extendContract: '延长合同',
  close: '关闭',
  downloadExcel: '下载 Excel',
  language: '语言',
  contractOne: '份合同',
  contractFew: '份合同',
  contractMany: '份合同',
  emptyOps: '暂无交易',
  dateAccrual: '入账日期',
  dateCharge: '扣款日期',
  amount: '金额',
  forPeriod: '所属周期',
  commission: '佣金',
  topUp: '充值',
  previousMonth: '上个月',
  nextMonth: '下个月',
  unifiedAccount: "统一账户",
  resetsOnTuesday: "将于周二清零",
  weekLimit: "本周限额",
  expected: "待入账",
  accrued: "已入账",
  firstBalancePart: "余额第一部分",
  secondBalancePart: "余额第二部分",
  bySchedule: "按计划",
  ofLimit: "限额",
  balanceInCampaigns: "活动中的余额",
  willArrive: "将入账余额",
  arrived: "已入账余额",
  promoPayment: "推广付款",
  onSellerPortal: "在卖家门户",
  videoGuide: "视频说明",
  unifiedHelp1: "您的资金与余额合计",
  unifiedHelp2: "为活动充值时，优先从账户扣款；不足部分再从余额扣除",
  campaignId: "活动 ID",
  campaignNameType: "活动、类型",
  finishDate: "结束日期",
  refundAmount: "应退金额，₽",
  status: "状态",
  refundEta: "退款约需 5–7 天",
  paymentDate: "付款日期",
  amountRub: "金额，₽",
  payerInn: "付款人税号",
  endsAt: "有效期至",
  topupDate: "充值日期",
  documentNo: "单据编号",
  campaign: "活动",
  type: "类型",
  burnsUntil: "失效日期",
  scenario: "场景",
  desktop: "桌面",
  iphone: "iPhone",
  spent: "已花费",
  remaining: "剩余",
  inCampaigns: "活动中",
  noAccrualThisWeek: "本周无入账",
  today: "今天",
  yesterday: "昨天",
  topUpAccount: "充值账户",
  balanceAccruals: "余额入账",
  whatIsPromoAccount: "什么是推广账户",
  influence: "达人",
  dueToPay: "应付",
  fromBalanceOnPortal: "从余额扣至卖家门户",
  bonuses: "奖金",
  promoBonusesHelp: "可用于支付部分充值金额的额外来源。例如新卖家注册或推广任务会发放。",
  goToPromoBonuses: "前往促销奖金",
  pauseCharge: "因暂停活动",
  fraudCharge: "欺诈退回",
  refundToBalance: "退回余额",
  refundToBonuses: "退回奖金",
  thisWeek: "本周",
  spendFor: "支出期间",
  spendOn: "支出",
  deferredFromEarlier: "往期延期",
  totalDue: "应付合计",
  toCharge: "待扣款",
  postponeCharge: "延期扣款",
  changeChargeDate: "修改扣款日期",
  changeDate: "修改日期",
  postponedPaymentOne: "笔延期付款",
  postponedPaymentFew: "笔延期付款",
  postponedPaymentMany: "笔延期付款",
  paymentMovedNote: "付款已延期至 {date} — 本周不扣款",
  campaignTypeCpmManual: "CPM 手动出价",
  campaignTypeCpc: "CPC",
  campaignTypeCpmUnified: "CPM 统一出价",
  searchSuffix: "搜索",
  recsSuffix: "推荐",
  autobidderSuffix: "自动出价",
};

const UZ: Messages = {
  operationsHistory: 'Operatsiyalar tarixi',
  search: 'Qidirish',
  selectPeriod: 'Davrni tanlash',
  allPeriod: 'Butun davr',
  day: 'Kun',
  week: 'Hafta',
  quarter: 'Chorak',
  year: 'Yil',
  noDate: 'Sanasiz',
  allSources: 'Barcha manbalar',
  allChannels: 'Barcha kanallar',
  campaignCharges: 'Kampaniyalar bo‘yicha yechib olish',
  account: 'Hisob',
  balance: 'Balans',
  bonusReturns: 'Bonus qaytarishlari',
  expiredBonuses: 'Muddati o‘tgan bonuslar',
  charges: 'Yechib olishlar',
  accruals: 'Hisoblanishlar',
  paymentMethod: "To‘lov usuli",
  refundType: 'Qaytarish turi',
  chargeType: 'Yechib olish turi',
  mediaChargeType: 'Media yechib olish turi',
  historyType: 'Tarix turi',
  channel: 'Kanal',
  source: 'Manba',
  chargeSource: 'Yechib olish manbasi',
  contractsSum: 'Shartnomalar summasi',
  contracts: 'Shartnomalar',
  promoBonuses: 'Promo-bonuslar',
  active: 'Faol',
  expired: 'Muddati o‘tgan',
  promotion: 'Promotion',
  media: 'Media',
  byImpressions: "Ko‘rsatishlar bo‘yicha",
  byDays: 'Kunlar bo‘yicha',
  pushes: 'Pushlar',
  showAll: "Hammasini ko‘rsatish",
  collapse: 'Yig‘ish',
  nothingFound: 'Hech narsa topilmadi',
  noActiveContracts: 'Faol shartnomalar yo‘q',
  noExpiredContracts: "Muddati o‘tgan shartnomalar yo‘q",
  inactive: 'nofaol',
  extendContract: 'Shartnomani uzaytirish',
  close: 'Yopish',
  downloadExcel: 'Excel yuklab olish',
  language: 'Til',
  contractOne: 'shartnoma',
  contractFew: 'shartnoma',
  contractMany: 'shartnoma',
  emptyOps: "Hali operatsiyalar yo‘q",
  dateAccrual: 'Hisoblanish sanasi',
  dateCharge: 'Yechib olish sanasi',
  amount: 'Summa',
  forPeriod: 'Davr uchun',
  commission: 'Komissiya',
  topUp: "To‘ldirish",
  previousMonth: 'Oldingi oy',
  nextMonth: 'Keyingi oy',
  unifiedAccount: "Yagona hisob",
  resetsOnTuesday: "Seshanba kuni nollanadi",
  weekLimit: "Hafta limiti",
  expected: "Kutilmoqda",
  accrued: "Hisoblandi",
  firstBalancePart: "Balansning birinchi qismi",
  secondBalancePart: "Balansning ikkinchi qismi",
  bySchedule: "Jadval bo‘yicha",
  ofLimit: "limitdan",
  balanceInCampaigns: "Kampaniyalardagi balans",
  willArrive: "Balansga keladi",
  arrived: "Balansga keldi",
  promoPayment: "Promotion to‘lovi",
  onSellerPortal: "sotuvchi portalida",
  videoGuide: "Video qo‘llanma",
  unifiedHelp1: "Pul va balansingiz summasi",
  unifiedHelp2: "Kampaniyani to‘ldirganda avval hisobdan, yetmasa balansdan yechiladi",
  campaignId: "Kampaniya ID",
  campaignNameType: "Kampaniya, turi",
  finishDate: "Tugash sanasi",
  refundAmount: "Qaytariladigan summa, ₽",
  status: "Holat",
  refundEta: "Qaytarish ≈ 5–7 kun",
  paymentDate: "To‘lov sanasi",
  amountRub: "Summa, ₽",
  payerInn: "To‘lovchi STIRi",
  endsAt: "Amal qilish muddati",
  topupDate: "To‘ldirish sanasi",
  documentNo: "Hujjat №",
  campaign: "Kampaniya",
  type: "Tur",
  burnsUntil: "Yonib ketadi",
  scenario: "Stsenariy",
  desktop: "Desktop",
  iphone: "iPhone",
  spent: "Sarflangan",
  remaining: "Qoldi",
  inCampaigns: "Kampaniyalarda",
  noAccrualThisWeek: "Bu hafta hisoblanmaydi",
  today: "Bugun",
  yesterday: "Kecha",
  topUpAccount: "Hisobni to‘ldirish",
  balanceAccruals: "Balans hisoblanishi",
  whatIsPromoAccount: "Promotion hisobi nima",
  influence: "Influence",
  dueToPay: "To‘lovga",
  fromBalanceOnPortal: "Balansdan sotuvchi portaliga",
  bonuses: "Bonuslar",
  promoBonusesHelp: "To‘ldirish summasining bir qismini yechib olish mumkin bo‘lgan qo‘shimcha manba.",
  goToPromoBonuses: "Promo-bonuslarga o‘tish",
  pauseCharge: "Kampaniya to‘xtatilgani uchun",
  fraudCharge: "Firoddan qaytarish",
  refundToBalance: "Balansdan",
  refundToBonuses: "Bonuslarga",
  thisWeek: "Shu hafta",
  spendFor: "Davr uchun xarajat",
  spendOn: "Xarajat",
  deferredFromEarlier: "Oldingi haftalardan kechiktirilgan",
  totalDue: "Jami to‘lov",
  toCharge: "Yechib olishga",
  postponeCharge: "Yechib olishni kechiktirish",
  changeChargeDate: "Yechib olish sanasini o‘zgartirish",
  changeDate: "Sanani o‘zgartirish",
  postponedPaymentOne: "kechiktirilgan to‘lov",
  postponedPaymentFew: "kechiktirilgan to‘lov",
  postponedPaymentMany: "kechiktirilgan to‘lov",
  paymentMovedNote: "To‘lov {date} ga ko‘chirildi — bu hafta yechib olinmaydi",
  campaignTypeCpmManual: "CPM qo‘lda stavka",
  campaignTypeCpc: "CPC",
  campaignTypeCpmUnified: "CPM yagona stavka",
  searchSuffix: "qidiruv",
  recsSuffix: "tavsiyalar",
  autobidderSuffix: "avtobidder",
};

const KK: Messages = {
  operationsHistory: 'Операциялар тарихы',
  search: 'Іздеу',
  selectPeriod: 'Кезеңді таңдау',
  allPeriod: 'Бүкіл кезең',
  day: 'Күн',
  week: 'Апта',
  quarter: 'Тоқсан',
  year: 'Жыл',
  noDate: 'Күнсіз',
  allSources: 'Барлық көздер',
  allChannels: 'Барлық арналар',
  campaignCharges: 'Науқандар бойынша есептен шығару',
  account: 'Шот',
  balance: 'Баланс',
  bonusReturns: 'Бонус қайтарулары',
  expiredBonuses: 'Мерзімі өткен бонустар',
  charges: 'Есептен шығарулар',
  accruals: 'Есептеулер',
  paymentMethod: 'Төлем әдісі',
  refundType: 'Қайтару түрі',
  chargeType: 'Есептен шығару түрі',
  mediaChargeType: 'Медиа есептен шығару түрі',
  historyType: 'Тарих түрі',
  channel: 'Арна',
  source: 'Көз',
  chargeSource: 'Есептен шығару көзі',
  contractsSum: 'Келісімшарттар сомасы',
  contracts: 'Келісімшарттар',
  promoBonuses: 'Промобонустар',
  active: 'Белсенді',
  expired: 'Мерзімі өткен',
  promotion: 'Жарнама',
  media: 'Медиа',
  byImpressions: 'Көрсетілімдер бойынша',
  byDays: 'Күндер бойынша',
  pushes: 'Пуштар',
  showAll: 'Барлығын көрсету',
  collapse: 'Жию',
  nothingFound: 'Ештеңе табылмады',
  noActiveContracts: 'Белсенді келісімшарттар жоқ',
  noExpiredContracts: 'Мерзімі өткен келісімшарттар жоқ',
  inactive: 'белсенді емес',
  extendContract: 'Келісімшартты ұзарту',
  close: 'Жабу',
  downloadExcel: 'Excel жүктеу',
  language: 'Тіл',
  contractOne: 'келісімшарт',
  contractFew: 'келісімшарт',
  contractMany: 'келісімшарт',
  emptyOps: 'Әзірге операциялар жоқ',
  dateAccrual: 'Есептеу күні',
  dateCharge: 'Есептен шығару күні',
  amount: 'Сома',
  forPeriod: 'Кезең үшін',
  commission: 'Комиссия',
  topUp: 'Толықтыру',
  previousMonth: 'Алдыңғы ай',
  nextMonth: 'Келесі ай',
  unifiedAccount: "Бірыңғай шот",
  resetsOnTuesday: "Сейсенбіде нөлденеді",
  weekLimit: "Апта лимиті",
  expected: "Күтілуде",
  accrued: "Есептелді",
  firstBalancePart: "Баланстың бірінші бөлігі",
  secondBalancePart: "Баланстың екінші бөлігі",
  bySchedule: "Кесте бойынша",
  ofLimit: "лимиттен",
  balanceInCampaigns: "Науқандардағы баланс",
  willArrive: "Балансқа келеді",
  arrived: "Балансқа келді",
  promoPayment: "Жарнама төлемі",
  onSellerPortal: "сатушы порталында",
  videoGuide: "Бейне нұсқаулық",
  unifiedHelp1: "Ақшаңыз бен балансыңыздың сомасы",
  unifiedHelp2: "Науқанды толықтырғанда алдымен шоттан, жетпесе баланстан шешіледі",
  campaignId: "Науқан ID",
  campaignNameType: "Науқан, түрі",
  finishDate: "Аяқталу күні",
  refundAmount: "Қайтару сомасы, ₽",
  status: "Мәртебе",
  refundEta: "Қайтару ≈ 5–7 күн",
  paymentDate: "Төлем күні",
  amountRub: "Сома, ₽",
  payerInn: "Төлеуші ЖСН",
  endsAt: "Жарамдылық мерзімі",
  topupDate: "Толықтыру күні",
  documentNo: "Құжат №",
  campaign: "Науқан",
  type: "Түрі",
  burnsUntil: "Жану мерзімі",
  scenario: "Сценарий",
  desktop: "Desktop",
  iphone: "iPhone",
  spent: "Жұмсалды",
  remaining: "Қалды",
  inCampaigns: "Науқандарда",
  noAccrualThisWeek: "Осы аптада есептеу жоқ",
  today: "Бүгін",
  yesterday: "Кеше",
  topUpAccount: "Шотты толықтыру",
  balanceAccruals: "Баланс есептеулері",
  whatIsPromoAccount: "Жарнама шоты дегеніміз не",
  influence: "Инфлюенс",
  dueToPay: "Төлемге",
  fromBalanceOnPortal: "Баланстан сатушы порталына",
  bonuses: "Бонустар",
  promoBonusesHelp: "Толықтыру сомасының бір бөлігін есептен шығаруға болатын қосымша көз.",
  goToPromoBonuses: "Промобонустарға өту",
  pauseCharge: "Науқанды тоқтатқаны үшін",
  fraudCharge: "Алаяқтықтан қайтару",
  refundToBalance: "Баланстан",
  refundToBonuses: "Бонустарға",
  thisWeek: "Осы апта",
  spendFor: "Кезеңге шығын",
  spendOn: "Шығын",
  deferredFromEarlier: "Алдыңғы апталардан кейінге қалдырылған",
  totalDue: "Жалпы төлем",
  toCharge: "Есептен шығаруға",
  postponeCharge: "Есептен шығаруды кейінге қалдыру",
  changeChargeDate: "Есептен шығару күнін өзгерту",
  changeDate: "Күнді өзгерту",
  postponedPaymentOne: "кейінге қалдырылған төлем",
  postponedPaymentFew: "кейінге қалдырылған төлем",
  postponedPaymentMany: "кейінге қалдырылған төлем",
  paymentMovedNote: "Төлем {date} күніне ауыстырылды — осы аптада шешілмейді",
  campaignTypeCpmManual: "CPM қолмен ставка",
  campaignTypeCpc: "CPC",
  campaignTypeCpmUnified: "CPM бірыңғай ставка",
  searchSuffix: "іздеу",
  recsSuffix: "ұсыныстар",
  autobidderSuffix: "автобиддер",
};

const KA: Messages = {
  operationsHistory: 'ოპერაციების ისტორია',
  search: 'ძიება',
  selectPeriod: 'პერიოდის არჩევა',
  allPeriod: 'მთელი პერიოდი',
  day: 'დღე',
  week: 'კვირა',
  quarter: 'კვარტალი',
  year: 'წელი',
  noDate: 'თარიღის გარეშე',
  allSources: 'ყველა წყარო',
  allChannels: 'ყველა არხი',
  campaignCharges: 'კამპანიების ჩამოწერები',
  account: 'ანგარიში',
  balance: 'ბალანსი',
  bonusReturns: 'ბონუსების დაბრუნება',
  expiredBonuses: 'ვადაგასული ბონუსები',
  charges: 'ჩამოწერები',
  accruals: 'დარიცხვები',
  paymentMethod: 'გადახდის მეთოდი',
  refundType: 'დაბრუნების ტიპი',
  chargeType: 'ჩამოწერის ტიპი',
  mediaChargeType: 'მედია ჩამოწერის ტიპი',
  historyType: 'ისტორიის ტიპი',
  channel: 'არხი',
  source: 'წყარო',
  chargeSource: 'ჩამოწერის წყარო',
  contractsSum: 'ხელშეკრულებების ჯამი',
  contracts: 'ხელშეკრულებები',
  promoBonuses: 'პრომობონუსები',
  active: 'აქტიური',
  expired: 'ვადაგასული',
  promotion: 'პრომოუშენი',
  media: 'მედია',
  byImpressions: 'ჩვენებებით',
  byDays: 'დღეებით',
  pushes: 'პუშები',
  showAll: 'ყველას ჩვენება',
  collapse: 'ჩაკეცვა',
  nothingFound: 'ვერაფერი მოიძებნა',
  noActiveContracts: 'აქტიური ხელშეკრულებები არ არის',
  noExpiredContracts: 'ვადაგასული ხელშეკრულებები არ არის',
  inactive: 'არააქტიური',
  extendContract: 'ხელშეკრულების გაგრძელება',
  close: 'დახურვა',
  downloadExcel: 'Excel-ის ჩამოტვირთვა',
  language: 'ენა',
  contractOne: 'ხელშეკრულება',
  contractFew: 'ხელშეკრულება',
  contractMany: 'ხელშეკრულება',
  emptyOps: 'ოპერაციები ჯერ არ არის',
  dateAccrual: 'დარიცხვის თარიღი',
  dateCharge: 'ჩამოწერის თარიღი',
  amount: 'თანხა',
  forPeriod: 'პერიოდისთვის',
  commission: 'საკომისიო',
  topUp: 'შევსება',
  previousMonth: 'წინა თვე',
  nextMonth: 'შემდეგი თვე',
  unifiedAccount: "ერთიანი ანგარიში",
  resetsOnTuesday: "განულდება სამშაბათს",
  weekLimit: "კვირის ლიმიტი",
  expected: "მოსალოდნელია",
  accrued: "დარიცხულია",
  firstBalancePart: "ბალანსის პირველი ნაწილი",
  secondBalancePart: "ბალანსის მეორე ნაწილი",
  bySchedule: "გრაფიკით",
  ofLimit: "ლიმიტიდან",
  balanceInCampaigns: "ბალანსი კამპანიებში",
  willArrive: "შევა ბალანსზე",
  arrived: "შევიდა ბალანსზე",
  promoPayment: "პრომოუშენის გადახდა",
  onSellerPortal: "გამყიდველის პორტალზე",
  videoGuide: "ვიდეოინსტრუქცია",
  unifiedHelp1: "თქვენი ფულისა და ბალანსის ჯამი",
  unifiedHelp2: "კამპანიის შევსებისას თანხა ჯერ ანგარიშიდან იწერება, ხოლო თუ არ ეყოფა — ბალანსიდან",
  campaignId: "კამპანიის ID",
  campaignNameType: "კამპანია, ტიპი",
  finishDate: "დასრულების თარიღი",
  refundAmount: "დასაბრუნებელი თანხა, ₽",
  status: "სტატუსი",
  refundEta: "დაბრუნება ≈ 5–7 დღე",
  paymentDate: "გადახდის თარიღი",
  amountRub: "თანხა, ₽",
  payerInn: "გადამხდელის საიდენტიფიკაციო",
  endsAt: "მოქმედების დასასრული",
  topupDate: "შევსების თარიღი",
  documentNo: "დოკუმენტის №",
  campaign: "კამპანია",
  type: "ტიპი",
  burnsUntil: "იწვის მდე",
  scenario: "სცენარი",
  desktop: "დესკტოპი",
  iphone: "iPhone",
  spent: "დახარჯული",
  remaining: "დარჩა",
  inCampaigns: "კამპანიებში",
  noAccrualThisWeek: "ამ კვირაში დარიცხვა არ არის",
  today: "დღეს",
  yesterday: "გუშინ",
  topUpAccount: "ანგარიშის შევსება",
  balanceAccruals: "ბალანსის დარიცხვები",
  whatIsPromoAccount: "რა არის პრომოუშენის ანგარიში",
  influence: "ინფლუენსი",
  dueToPay: "გადასახდელი",
  fromBalanceOnPortal: "ბალანსიდან გამყიდველის პორტალზე",
  bonuses: "ბონუსები",
  promoBonusesHelp: "დამატებითი წყარო, საიდანაც შეგიძლიათ შევსების თანხის ნაწილის ჩამოწერა.",
  goToPromoBonuses: "პრომობონუსებზე გადასვლა",
  pauseCharge: "კამპანიის შეჩერებისთვის",
  fraudCharge: "თაღლითობიდან დაბრუნება",
  refundToBalance: "ბალანსიდან",
  refundToBonuses: "ბონუსებში",
  thisWeek: "ეს კვირა",
  spendFor: "ხარჯი პერიოდზე",
  spendOn: "ხარჯი",
  deferredFromEarlier: "გადადებული წინა კვირებიდან",
  totalDue: "სულ გადასახდელი",
  toCharge: "ჩამოსაწერი",
  postponeCharge: "ჩამოწერის გადადება",
  changeChargeDate: "ჩამოწერის თარიღის შეცვლა",
  changeDate: "თარიღის შეცვლა",
  postponedPaymentOne: "გადადებული გადახდა",
  postponedPaymentFew: "გადადებული გადახდა",
  postponedPaymentMany: "გადადებული გადახდა",
  paymentMovedNote: "გადახდა გადატანილია {date}-ზე — ამ კვირაში არ ჩამოიწერება",
  campaignTypeCpmManual: "CPM ხელით განაკვეთი",
  campaignTypeCpc: "CPC",
  campaignTypeCpmUnified: "CPM ერთიანი განაკვეთი",
  searchSuffix: "ძიება",
  recsSuffix: "რეკომენდაციები",
  autobidderSuffix: "ავტობიდერი",
};

const AM: Messages = {
  operationsHistory: 'የግብይት ታሪክ',
  search: 'ፈልግ',
  selectPeriod: 'ጊዜ ይምረጡ',
  allPeriod: 'ሙሉ ጊዜ',
  day: 'ቀን',
  week: 'ሳምንት',
  quarter: 'ሩብ ዓመት',
  year: 'ዓመት',
  noDate: 'ቀን የለም',
  allSources: 'ሁሉም ምንጮች',
  allChannels: 'ሁሉም ቻናሎች',
  campaignCharges: 'ከዘመቻዎች ቅናሾች',
  account: 'መለያ',
  balance: 'ቀሪ ሂሳብ',
  bonusReturns: 'የቦነስ መመለሶች',
  expiredBonuses: 'ያለፉ ቦነሶች',
  charges: 'ቅናሾች',
  accruals: 'ተጨማሪዎች',
  paymentMethod: 'የክፍያ ዘዴ',
  refundType: 'የመመለስ አይነት',
  chargeType: 'የቅናሽ አይነት',
  mediaChargeType: 'የሚዲያ ቅናሽ አይነት',
  historyType: 'የታሪክ አይነት',
  channel: 'ቻናል',
  source: 'ምንጭ',
  chargeSource: 'የቅናሽ ምንጭ',
  contractsSum: 'በኮንትራቶች ላይ ድምር',
  contracts: 'ኮንትራቶች',
  promoBonuses: 'የማስተዋወቂያ ቦነሶች',
  active: 'ንቁ',
  expired: 'ያለፉ',
  promotion: 'ማስተዋወቅ',
  media: 'ሚዲያ',
  byImpressions: 'በእይታዎች',
  byDays: 'በቀናት',
  pushes: 'ፑሾች',
  showAll: 'ሁሉን አሳይ',
  collapse: 'ሰብስብ',
  nothingFound: 'ምንም አልተገኘም',
  noActiveContracts: 'ንቁ ኮንትራቶች የሉም',
  noExpiredContracts: 'ያለፉ ኮንትራቶች የሉም',
  inactive: 'ንቁ አይደለም',
  extendContract: 'ኮንትራት ማራዘም',
  close: 'ዝጋ',
  downloadExcel: 'Excel አውርድ',
  language: 'ቋንቋ',
  contractOne: 'ኮንትራት',
  contractFew: 'ኮንትራቶች',
  contractMany: 'ኮንትራቶች',
  emptyOps: 'ገና ግብይቶች የሉም',
  dateAccrual: 'የተጨማሪ ቀን',
  dateCharge: 'የቅናሽ ቀን',
  amount: 'መጠን',
  forPeriod: 'ለጊዜው',
  commission: 'ኮሚሽን',
  topUp: 'ሙላ',
  previousMonth: 'ያለፈው ወር',
  nextMonth: 'ቀጣዩ ወር',
  unifiedAccount: "አንድነት መለያ",
  resetsOnTuesday: "ማክሰኞ ይጠፋል",
  weekLimit: "የሳምንት ገደብ",
  expected: "ይጠበቃል",
  accrued: "ተጨመረ",
  firstBalancePart: "የቀሪ ሂሳብ የመጀመሪያ ክፍል",
  secondBalancePart: "የቀሪ ሂሳብ ሁለተኛ ክፍል",
  bySchedule: "በመርሐግብር",
  ofLimit: "ከገደብ",
  balanceInCampaigns: "በዘመቻዎች ላይ ቀሪ ሂሳብ",
  willArrive: "ወደ ቀሪ ሂሳብ ይገባል",
  arrived: "ወደ ቀሪ ሂሳብ ገብቷል",
  promoPayment: "የማስተዋወቂያ ክፍያ",
  onSellerPortal: "በሻጭ ፖርታል",
  videoGuide: "የቪዲዮ መመሪያ",
  unifiedHelp1: "የገንዘብዎ እና የቀሪ ሂሳብዎ ድምር",
  unifiedHelp2: "ዘመቻ ሲሞሉ መጀመሪያ ከመለያ ይቀንሳል፤ ካልበቃ ከቀሪ ሂሳብ",
  campaignId: "የዘመቻ መታወቂያ",
  campaignNameType: "ዘመቻ፣ አይነት",
  finishDate: "የመጨረሻ ቀን",
  refundAmount: "የሚመለስ መጠን፣ ₽",
  status: "ሁኔታ",
  refundEta: "መመለስ ≈ 5–7 ቀናት",
  paymentDate: "የክፍያ ቀን",
  amountRub: "መጠን፣ ₽",
  payerInn: "የከፋይ ቁጥር",
  endsAt: "የሚያልቅበት",
  topupDate: "የመሙያ ቀን",
  documentNo: "ሰነድ ቁ.",
  campaign: "ዘመቻ",
  type: "አይነት",
  burnsUntil: "እስከሚያልቅ",
  scenario: "ሁኔታ",
  desktop: "ዴስክቶፕ",
  iphone: "iPhone",
  spent: "የወጣ",
  remaining: "ቀሪ",
  inCampaigns: "በዘመቻዎች",
  noAccrualThisWeek: "በዚህ ሳምንት ተጨማሪ የለም",
  today: "ዛሬ",
  yesterday: "ትናንት",
  topUpAccount: "መለያ ሙላ",
  balanceAccruals: "የቀሪ ሂሳብ ተጨማሪዎች",
  whatIsPromoAccount: "የማስተዋወቂያ መለያ ምንድን ነው",
  influence: "ተፅዕኖ ፈጣሪ",
  dueToPay: "ለመክፈል",
  fromBalanceOnPortal: "ከቀሪ ሂሳብ ወደ ሻጭ ፖርታል",
  bonuses: "ቦነሶች",
  promoBonusesHelp: "ከመሙያ መጠን ክፍል ለመቀነስ የሚያገለግል ተጨማሪ ምንጭ።",
  goToPromoBonuses: "ወደ ማስተዋወቂያ ቦነሶች ሂድ",
  pauseCharge: "ዘመቻ በማቆም",
  fraudCharge: "ከማጭበርበር መመለስ",
  refundToBalance: "ከቀሪ ሂሳብ",
  refundToBonuses: "ወደ ቦነሶች",
  thisWeek: "ይህ ሳምንት",
  spendFor: "ወጪ ለ",
  spendOn: "ወጪ",
  deferredFromEarlier: "ከያለፉ ሳምንታት የተራዘሙ",
  totalDue: "ጠቅላላ ለመክፈል",
  toCharge: "ለመቀነስ",
  postponeCharge: "ቅናሽ አራዝም",
  changeChargeDate: "የቅናሽ ቀን ቀይር",
  changeDate: "ቀን ቀይር",
  postponedPaymentOne: "የተራዘመ ክፍያ",
  postponedPaymentFew: "የተራዘሙ ክፍያዎች",
  postponedPaymentMany: "የተራዘሙ ክፍያዎች",
  paymentMovedNote: "ክፍያ ወደ {date} ተዘዋውሯል — በዚህ ሳምንት አይቀንስም",
  campaignTypeCpmManual: "CPM በእጅ ዋጋ",
  campaignTypeCpc: "CPC",
  campaignTypeCpmUnified: "CPM አንድ ዋጋ",
  searchSuffix: "ፍለጋ",
  recsSuffix: "ምክሮች",
  autobidderSuffix: "ራስ-ሰር ዋጋ",
};

const MESSAGES: Record<FinanceLocaleId, Messages> = {
  ru: RU,
  'zh-CN': ZH,
  uz: UZ,
  kk: KK,
  ka: KA,
  am: AM,
};

export function tFinance(
  key: FinanceMessageKey,
  locale: FinanceLocaleId = currentLocaleId,
): string {
  return MESSAGES[locale][key] ?? MESSAGES.ru[key] ?? key;
}

/** Склонение «N контракт(а/ов)» — для не-RU обычно одна форма */
export function formatContractCountLabel(
  count: number,
  locale: FinanceLocaleId = currentLocaleId,
): string {
  if (locale !== 'ru') {
    const form = count === 1 ? tFinance('contractOne', locale) : tFinance('contractMany', locale);
    return `${formatFinanceNumber(count, locale)} ${form}`;
  }
  const mod10 = count % 10;
  const mod100 = count % 100;
  const form =
    mod10 === 1 && mod100 !== 11
      ? tFinance('contractOne', locale)
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)
        ? tFinance('contractFew', locale)
        : tFinance('contractMany', locale);
  return `${formatFinanceNumber(count, locale)} ${form}`;
}

/** Валюта кабинета по рынку */
export type FinanceCurrency = {
  code: string;
  symbol: string;
  position: 'before' | 'after';
};

export const FINANCE_CURRENCY_BY_LOCALE: Record<FinanceLocaleId, FinanceCurrency> = {
  ru: { code: 'RUB', symbol: '₽', position: 'after' },
  'zh-CN': { code: 'CNY', symbol: '¥', position: 'before' },
  uz: { code: 'UZS', symbol: 'UZS', position: 'after' },
  kk: { code: 'KZT', symbol: '₸', position: 'after' },
  ka: { code: 'GEL', symbol: '₾', position: 'after' },
  am: { code: 'ETB', symbol: 'Br', position: 'after' },
};

export function getFinanceCurrency(locale: FinanceLocaleId = currentLocaleId): FinanceCurrency {
  return FINANCE_CURRENCY_BY_LOCALE[locale];
}

/** @deprecated — используйте getFinanceCurrency().symbol */
export const FINANCE_CURRENCY_SUFFIX = '₽';

export function getFinanceCurrencySymbol(locale: FinanceLocaleId = currentLocaleId): string {
  return getFinanceCurrency(locale).symbol;
}

export function formatFinanceMoney(
  n: number,
  locale: FinanceLocaleId = currentLocaleId,
): string {
  const cur = getFinanceCurrency(locale);
  const num = formatFinanceNumber(n, locale);
  return cur.position === 'before' ? `${cur.symbol}${num}` : `${num} ${cur.symbol}`;
}


const DEMO_CAMPAIGN_NAME_I18N: Partial<Record<FinanceLocaleId, Record<string, string>>> = {
  'zh-CN': {
    'Куртка демисезонная — поиск': '春秋夹克 — 搜索',
    'Платье летнее — поиск': '夏季连衣裙 — 搜索',
    'Кроссовки Run Pro — рекомендации': 'Run Pro 运动鞋 — 推荐',
    'Рюкзак городской — поиск': '城市背包 — 搜索',
    'Наушники Wave — автобиддер': 'Wave 耳机 — 自动出价',
    'Крем для лица — рекомендации': '面部乳霜 — 推荐',
    'Чайник электрический — поиск': '电热水壶 — 搜索',
    'Постельное бельё сатин — рекомендации': '缎面床品 — 推荐',
    'РК главная · баннер · осень': '主页 RK · 横幅 · 秋季',
    'ПВЗ · экран · верхняя одежда': '取货点 · 屏幕 · 外套',
    'Баннер · полка бренда': '横幅 · 品牌货架',
    'Видео · out-stream · новинки': '视频 · out-stream · 新品',
    'Весна 2023': '2023 春',
    'Новая коллекция 2023': '2023 新系列',
    'Когда название очень длинное и в две строки': '名称很长、需要两行显示时',
    'Шапка зимняя — CPC поиск': '冬帽 — CPC 搜索',
    'Майка белая автобиддер': '白色背心 自动出价',
    'Платье летнее — рекомендации': '夏季连衣裙 — 推荐',
    'Кроссовки Run Pro': 'Run Pro 运动鞋',
    'Клип · lookbook FW26': '短视频 · lookbook FW26',
    'Кампания от 25.06.2026 НЕ УДАЛЯТЬ': '活动 25.06.2026 请勿删除',
    'Кампания от 24.09.2026': '活动 24.09.2026',
    'Фото CPC 24.09.2026': '图片 CPC 24.09.2026',
    'Тест пресетов не удалять': '预设测试 请勿删除',
  },
  uz: {
    'Куртка демисезонная — поиск': 'Demisezon kurtka — qidiruv',
    'Платье летнее — поиск': "Yozgi ko‘ylak — qidiruv",
    'Кроссовки Run Pro — рекомендации': 'Run Pro krossovkalar — tavsiyalar',
    'Рюкзак городской — поиск': 'Shahar ryukzagi — qidiruv',
    'Наушники Wave — автобиддер': 'Wave quloqchinlar — avtobidder',
    'Крем для лица — рекомендации': 'Yuz kremi — tavsiyalar',
    'Чайник электрический — поиск': 'Elektr choynak — qidiruv',
    'Постельное бельё сатин — рекомендации': 'Satin choyshablar — tavsiyalar',
    'РК главная · баннер · осень': 'Bosh sahifa RK · banner · kuz',
    'ПВЗ · экран · верхняя одежда': 'PVZ · ekran · ustki kiyim',
    'Баннер · полка бренда': 'Banner · brend javoni',
    'Видео · out-stream · новинки': 'Video · out-stream · yangiliklar',
    'Весна 2023': 'Bahor 2023',
    'Новая коллекция 2023': 'Yangi kolleksiya 2023',
    'Когда название очень длинное и в две строки': 'Nom juda uzun va ikki qatorda',
    'Шапка зимняя — CPC поиск': 'Qishki shapka — CPC qidiruv',
    'Майка белая автобиддер': 'Oq mayka avtobidder',
    'Платье летнее — рекомендации': "Yozgi ko‘ylak — tavsiyalar",
    'Кроссовки Run Pro': 'Run Pro krossovkalar',
    'Клип · lookbook FW26': 'Klip · lookbook FW26',
    'Кампания от 25.06.2026 НЕ УДАЛЯТЬ': "Kampaniya 25.06.2026 O‘CHIRILMASIN",
    'Кампания от 24.09.2026': 'Kampaniya 24.09.2026',
    'Фото CPC 24.09.2026': 'Foto CPC 24.09.2026',
    'Тест пресетов не удалять': "Preset testi o‘chirilmasin",
  },
  kk: {
    'Куртка демисезонная — поиск': 'Демисезонды куртка — іздеу',
    'Платье летнее — поиск': 'Жазғы көйлек — іздеу',
    'Кроссовки Run Pro — рекомендации': 'Run Pro кроссовкелер — ұсыныстар',
    'Рюкзак городской — поиск': 'Қалалық рюкзак — іздеу',
    'Наушники Wave — автобиддер': 'Wave құлаққаптар — автобиддер',
    'Крем для лица — рекомендации': 'Бет кремі — ұсыныстар',
    'Чайник электрический — поиск': 'Электр шәйнек — іздеу',
    'Постельное бельё сатин — рекомендации': 'Сатин төсек-орын — ұсыныстар',
    'РК главная · баннер · осень': 'Басты бет РК · баннер · күз',
    'ПВЗ · экран · верхняя одежда': 'ПВЗ · экран · сыртқы киім',
    'Баннер · полка бренда': 'Баннер · бренд сөресі',
    'Видео · out-stream · новинки': 'Бейне · out-stream · жаңалықтар',
    'Весна 2023': 'Көктем 2023',
    'Новая коллекция 2023': 'Жаңа топтама 2023',
    'Когда название очень длинное и в две строки': 'Атауы өте ұзын және екі жолда',
    'Шапка зимняя — CPC поиск': 'Қысқы бас киім — CPC іздеу',
    'Майка белая автобиддер': 'Ақ майка автобиддер',
    'Платье летнее — рекомендации': 'Жазғы көйлек — ұсыныстар',
    'Кроссовки Run Pro': 'Run Pro кроссовкелер',
    'Клип · lookbook FW26': 'Клип · lookbook FW26',
    'Кампания от 25.06.2026 НЕ УДАЛЯТЬ': 'Науқан 25.06.2026 ЖОЙМАҢЫЗ',
    'Кампания от 24.09.2026': 'Науқан 24.09.2026',
    'Фото CPC 24.09.2026': 'Фото CPC 24.09.2026',
    'Тест пресетов не удалять': 'Пресет сынағы жоймаңыз',
  },
  ka: {
    'Куртка демисезонная — поиск': 'დემისეზონური ქურთუკი — ძიება',
    'Платье летнее — поиск': 'საზაფხულო კაბა — ძიება',
    'Кроссовки Run Pro — рекомендации': 'Run Pro კროსოვკები — რეკომენდაციები',
    'Рюкзак городской — поиск': 'საქალაქო ზურგჩანთა — ძიება',
    'Наушники Wave — автобиддер': 'Wave ყურსასმენები — ავტობიდერი',
    'Крем для лица — рекомендации': 'სახის კრემი — რეკომენდაციები',
    'Чайник электрический — поиск': 'ელექტრო ჩაიდანი — ძიება',
    'Постельное бельё сатин — рекомендации': 'სატინის თეთრეული — რეკომენდაციები',
    'РК главная · баннер · осень': 'მთავარი RK · ბანერი · შემოდგომა',
    'ПВЗ · экран · верхняя одежда': 'PVZ · ეკრანი · ზედა ტანსაცმელი',
    'Баннер · полка бренда': 'ბანერი · ბრენდის თარო',
    'Видео · out-stream · новинки': 'ვიდეო · out-stream · სიახლეები',
    'Весна 2023': 'გაზაფხული 2023',
    'Новая коллекция 2023': 'ახალი კოლექცია 2023',
    'Когда название очень длинное и в две строки': 'როცა სახელი ძალიან გრძელია და ორ სტრიქონშია',
    'Шапка зимняя — CPC поиск': 'ზამთრის ქუდი — CPC ძიება',
    'Майка белая автобиддер': 'თეთრი მაიკა ავტობიდერი',
    'Платье летнее — рекомендации': 'საზაფხულო კაბა — რეკომენდაციები',
    'Кроссовки Run Pro': 'Run Pro კროსოვკები',
    'Клип · lookbook FW26': 'კლიპი · lookbook FW26',
    'Кампания от 25.06.2026 НЕ УДАЛЯТЬ': 'კამპანია 25.06.2026 ნუ წაშლით',
    'Кампания от 24.09.2026': 'კამპანია 24.09.2026',
    'Фото CPC 24.09.2026': 'ფოტო CPC 24.09.2026',
    'Тест пресетов не удалять': 'პრესეტების ტესტი ნუ წაშლით',
  },
  am: {
    'Куртка демисезонная — поиск': 'የየፋት ጃኬት — ፍለጋ',
    'Платье летнее — поиск': 'የበጋ ቀሚስ — ፍለጋ',
    'Кроссовки Run Pro — рекомендации': 'Run Pro ስፖርት ጫማ — ምክሮች',
    'Рюкзак городской — поиск': 'የከተማ ቦርሳ — ፍለጋ',
    'Наушники Wave — автобиддер': 'Wave የጆሮ ማዳመጫ — ራስ-ሰር',
    'Крем для лица — рекомендации': 'የፊት ክሬም — ምክሮች',
    'Чайник электрический — поиск': 'ኤሌክትሪክ ማንቆርቆሪያ — ፍለጋ',
    'Постельное бельё сатин — рекомендации': 'ሳቲን አልጋ ልብስ — ምክሮች',
    'РК главная · баннер · осень': 'ዋና RK · ባነር · መኸር',
    'ПВЗ · экран · верхняя одежда': 'PVZ · ማያ · የላይ ልብስ',
    'Баннер · полка бренда': 'ባነር · የብራንድ መደብር',
    'Видео · out-stream · новинки': 'ቪዲዮ · out-stream · አዲስ',
    'Весна 2023': 'ጸደይ 2023',
    'Новая коллекция 2023': 'አዲስ ስብስብ 2023',
    'Когда название очень длинное и в две строки': 'ስሙ በጣም ረጅም እና በሁለት መስመር ሲሆን',
    'Шапка зимняя — CPC поиск': 'የክረምት ቆብ — CPC ፍለጋ',
    'Майка белая автобиддер': 'ነጭ ማይካ ራስ-ሰር',
    'Платье летнее — рекомендации': 'የበጋ ቀሚስ — ምክሮች',
    'Кроссовки Run Pro': 'Run Pro ስፖርት ጫማ',
    'Клип · lookbook FW26': 'ክሊፕ · lookbook FW26',
    'Кампания от 25.06.2026 НЕ УДАЛЯТЬ': 'ዘመቻ 25.06.2026 አትሰርዙ',
    'Кампания от 24.09.2026': 'ዘመቻ 24.09.2026',
    'Фото CPC 24.09.2026': 'ፎቶ CPC 24.09.2026',
    'Тест пресетов не удалять': 'የፕሪሴት ሙከራ አትሰርዙ',
  },
};

export function localizeDemoCampaignName(
  name: string,
  locale: FinanceLocaleId = currentLocaleId,
): string {
  if (locale === 'ru') return name;
  return DEMO_CAMPAIGN_NAME_I18N[locale]?.[name] ?? name;
}

export function localizeCampaignType(
  type: string,
  locale: FinanceLocaleId = currentLocaleId,
): string {
  if (type === 'CPM ручная ставка') return tFinance('campaignTypeCpmManual', locale);
  if (type === 'CPC') return tFinance('campaignTypeCpc', locale);
  if (type === 'CPM единая ставка') return tFinance('campaignTypeCpmUnified', locale);
  if (type === 'Медиа') return tFinance('media', locale);
  return type;
}

export function formatPostponedPaymentsLabelI18n(
  count: number,
  locale: FinanceLocaleId = currentLocaleId,
): string {
  const n = formatFinanceNumber(count, locale);
  if (locale !== 'ru') {
    const form =
      count === 1 ? tFinance('postponedPaymentOne', locale) : tFinance('postponedPaymentMany', locale);
    return `${n} ${form}`;
  }
  const mod10 = count % 10;
  const mod100 = count % 100;
  const form =
    mod10 === 1 && mod100 !== 11
      ? tFinance('postponedPaymentOne', locale)
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)
        ? tFinance('postponedPaymentFew', locale)
        : tFinance('postponedPaymentMany', locale);
  return `${n} ${form}`;
}

export function tFinanceTemplate(
  key: FinanceMessageKey,
  vars: Record<string, string | number>,
  locale: FinanceLocaleId = currentLocaleId,
): string {
  return Object.entries(vars).reduce(
    (text, [k, v]) => text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
    tFinance(key, locale),
  );
}
