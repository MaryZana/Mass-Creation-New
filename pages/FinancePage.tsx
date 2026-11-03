import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Check,
  ChevronDown,
  Coins,
  CreditCard,
  Download,
  Gift,
  HelpCircle,
  Landmark,
  Plus,
  Search,
  Smartphone,
  Wallet,
  X,
} from '../components/Icons';
import { UnifiedAccountInstructionModal } from '../components/UnifiedAccountInstructionModal';
import { FinanceBalanceModalVariant } from '../components/FinanceBalanceModalVariants';
import {
  FinanceMoneyIconRows,
  financeUnifiedHasOwnHeader,
  readFinanceUnifiedVariant,
} from '../components/FinanceBalanceLabel';
import { useDismissibleHoverTooltip, useFeatureVideoGuide } from '../components/FeatureVideoGuide';
import { PROMOTION_ACCOUNT_BALANCE_BY_PROFILE } from '../components/AppHeader';
import { useProfile } from '../components/ProfileContext';
import { usePromoBonusDemo } from '../components/PromoBonusDemoContext';
import {
  FINANCE_BALANCE_CURRENT_CASES,
  FINANCE_BALANCE_CURRENT_DAYS,
  FINANCE_BALANCE_DEMO_CASES,
  FINANCE_BALANCE_SIM_SCENARIOS,
  FINANCE_BALANCE_SIM_WEEKS,
  FINANCE_BALANCE_WEEK_DAYS,
  FINANCE_BALANCE_SIM_EVENT,
  buildFinanceBalanceSimView,
  financeBalancePayoutDates,
  financeBalanceWeekChargeDate,
  financeBalanceWeekDate,
  financeBalanceWeekRangeLabel,
  readFinanceBalanceCurrentCase,
  readFinanceBalanceCurrentDay,
  readFinanceBalanceSimDay,
  readFinanceBalanceSimScenario,
  readFinanceBalanceSimAdjust,
  writeFinanceBalanceSimAdjust,
  FINANCE_BALANCE_SIM_STEP_RUB,
  type FinanceBalanceSimAdjust,
  readFinanceBalanceSimWeek,
  writeFinanceBalanceSimDay,
  writeFinanceBalanceSimScenario,
  writeFinanceBalanceSimWeek,
  readFinanceBalanceDemoCase,
  writeFinanceBalanceCurrentCase,
  writeFinanceBalanceCurrentDay,
  writeFinanceBalanceAmountRub,
  writeFinanceBalanceDemoCase,
  type FinanceBalanceCurrentCaseId,
  type FinanceBalanceCurrentDayId,
  type FinanceBalanceDemoCaseId,
  type FinanceBalanceSchemeLayoutId,
  type FinanceBalanceSimScenarioId,
  type FinanceBalanceSimWeekId,
} from '../utils/financeBalanceDemo';
import { financeTopUpPath } from '../utils/financeRoutes';

const UNIFIED_ACCOUNT_VIDEO_SRC = '/videos/help-instruction-demo.mp4';

const FINANCE_TITLE_GUIDE = {
  title: 'Как работает счёт и баланс продвижения',
  duration: '4:12',
  src: UNIFIED_ACCOUNT_VIDEO_SRC,
} as const;

type FinanceDropdownOption = {
  value: string;
  label: string;
  dividerBefore?: boolean;
  infoTooltip?: string;
};

function FinanceDropdown({
  value,
  onChange,
  options,
  className = '',
  menuClassName = '',
  chip = false,
  'aria-label': ariaLabel,
}: {
  value: string;
  onChange?: (value: string) => void;
  options: FinanceDropdownOption[];
  className?: string;
  menuClassName?: string;
  chip?: boolean;
  'aria-label'?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const selected = options.find((opt) => opt.value === value) ?? options[0];

  useLayoutEffect(() => {
    if (!open || !rootRef.current) {
      setMenuPos(null);
      return;
    }
    const update = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex w-max items-center justify-between whitespace-nowrap text-sm font-medium transition-colors hover:bg-[#E6E9EE] ${
          chip
            ? 'h-8 gap-1.5 rounded-full bg-[#F3F5F8] px-3 text-gray-800'
            : 'h-8 gap-1.5 rounded-xl border border-transparent bg-[#F3F5F8] px-2.5 text-gray-900'
        } ${open ? 'bg-[#E6E9EE]' : ''}`}
      >
        <span>{selected?.label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open && menuPos
        ? createPortal(
            <div
              ref={menuRef}
              style={{ top: menuPos.top, left: menuPos.left, minWidth: menuPos.width }}
              className={`fixed z-[200] w-max overflow-hidden rounded-xl border border-gray-100 bg-white py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)] ${menuClassName}`}
              role="listbox"
              aria-label={ariaLabel}
            >
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <React.Fragment key={opt.value}>
                    {opt.dividerBefore ? (
                      <div className="my-1.5 border-t border-gray-100" role="separator" />
                    ) : null}
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange?.(opt.value);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 whitespace-nowrap px-3 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${
                        isSelected ? 'font-medium text-[#9A41FE]' : 'text-gray-900'
                      }`}
                    >
                      <span className="flex w-4 shrink-0 justify-center">
                        {isSelected ? <Check className="h-4 w-4 text-[#9A41FE]" aria-hidden /> : null}
                      </span>
                      <span>{opt.label}</span>
                      {opt.infoTooltip ? (
                        <span className="tooltip shrink-0">
                          <span
                            className="inline-flex text-gray-400"
                            aria-label={opt.infoTooltip}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <HelpCircle className="h-4 w-4" aria-hidden />
                          </span>
                          <span className="tooltip-text !bottom-auto !left-auto !right-0 !top-full !mt-1.5 !w-[14rem] !max-w-[14rem] !translate-x-0 !whitespace-normal !py-2 !px-2.5 !text-left text-xs !font-normal !leading-snug">
                            {opt.infoTooltip}
                          </span>
                        </span>
                      ) : null}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function TopupStatusFilter({
  value,
  onChange,
}: {
  value: 'all' | TopupStatus;
  onChange: (value: 'all' | TopupStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const selected = TOPUP_STATUS_OPTIONS.find((opt) => opt.value === value) ?? TOPUP_STATUS_OPTIONS[0];

  useLayoutEffect(() => {
    if (!open || !rootRef.current) {
      setMenuPos(null);
      return;
    }
    const update = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuPos({ top: rect.bottom + 6, left: rect.left });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative w-max" ref={rootRef}>
      <button
        type="button"
        aria-label="Статус пополнения"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex h-8 w-max items-center justify-between gap-1.5 whitespace-nowrap rounded-xl border border-transparent bg-[#F3F5F8] px-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-[#E6E9EE] ${
          open ? 'bg-[#E6E9EE]' : ''
        }`}
      >
        <span>{selected.label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open && menuPos
        ? createPortal(
            <div
              ref={menuRef}
              style={{ top: menuPos.top, left: menuPos.left }}
              className="fixed z-[200] w-max overflow-hidden rounded-xl border border-gray-100 bg-white p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
              role="listbox"
              aria-label="Статус пополнения"
            >
              {TOPUP_STATUS_OPTIONS.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`flex w-full whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-sm text-gray-900 transition-colors hover:bg-gray-50 ${
                      isSelected ? 'bg-[#F3E8FF] font-medium' : ''
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function FinanceTitleHelp() {
  const { openGuide, modal: videoModal, isOpen: guideOpen } = useFeatureVideoGuide();
  const tip = useDismissibleHoverTooltip(guideOpen);
  const firstGuide = FINANCE_TITLE_GUIDE;

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={tip.onMouseEnter}
      onMouseLeave={tip.onMouseLeave}
    >
      {videoModal}
      <button
        type="button"
        className="inline-flex cursor-help items-center justify-center transition-opacity hover:opacity-80"
        aria-label="Информация и видеоинструкция по финансам"
      >
        <HelpCircle className="h-4 w-4 text-gray-400" />
      </button>
      {tip.show ? (
        <div className="absolute left-0 top-full z-40 pt-1.5">
          <div className="w-[17rem] rounded-xl bg-gray-900 px-3 py-2.5 text-left text-xs font-normal leading-snug text-white shadow-lg">
            <p>
              Здесь счёт и баланс продвижения, промобонусы, история операций и возвраты. Видео поможет
              разобраться, как всё устроено.
            </p>
            <button
              type="button"
              onClick={() => {
                tip.dismiss();
                openGuide({
                  title: firstGuide.title,
                  videoSrc: firstGuide.src,
                  description: `Видеоинструкция · ${firstGuide.duration}`,
                });
              }}
              className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/15"
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gray-400 text-black">
                <svg viewBox="0 0 24 24" className="ml-px h-2 w-2" fill="currentColor" aria-hidden>
                  <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l10.5-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14Z" />
                </svg>
              </span>
              Как работает
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const fmtRub = (n: number) =>
  new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n);

const BALANCE_DEMO_CASES = FINANCE_BALANCE_DEMO_CASES;
type BalanceDemoCaseId = FinanceBalanceDemoCaseId;

function balanceSchemeRow(balanceRub: number): BufferAccrualRow {
  const tuesdayRub = Math.round(balanceRub * 0.75);
  const thursdayRub = balanceRub - tuesdayRub;
  return {
    id: 'current-balance',
    periodLabel: '',
    periodStart: '',
    periodEnd: '',
    weekTotalRub: balanceRub,
    tuesdayRub,
    thursdayRub,
    weeksAvgLabel: `(${fmtRub(balanceRub)} ₽ + ${fmtRub(balanceRub)} ₽ + ${fmtRub(balanceRub)} ₽) ÷ 3`,
    weekProfitRub: [balanceRub, balanceRub, balanceRub],
    inCampaignsRub: 0,
    spentOnPromoRub: 0,
    bufferLeftRub: balanceRub,
    grossWeekAccrualRub: balanceRub,
    netWeekAccrualRub: balanceRub,
  };
}

/** Резерв в кампаниях сначала «съедает» вторник, остаток — четверг */
function accrualAfterCampaignReserve(
  tuesdayRub: number,
  thursdayRub: number,
  inCampaignsRub: number,
): { tuesdayRub: number; thursdayRub: number; netRub: number } {
  const tuesdayNet = Math.max(0, tuesdayRub - inCampaignsRub);
  const reserveLeft = Math.max(0, inCampaignsRub - tuesdayRub);
  const thursdayNet = Math.max(0, thursdayRub - reserveLeft);
  return { tuesdayRub: tuesdayNet, thursdayRub: thursdayNet, netRub: tuesdayNet + thursdayNet };
}

/** Кейсы «Текущей» модалки: начисление 75% / 25%, резерв в кампаниях вычитается из начисленного */
function balanceCurrentCaseRow(
  balanceRub: number,
  caseId: FinanceBalanceCurrentCaseId,
  day: FinanceBalanceCurrentDayId,
): BufferAccrualRow {
  if (caseId === 'base') return balanceSchemeRow(balanceRub);

  const weekProfitRub: [number, number, number] =
    caseId === 'zero_week'
      ? [1_800, 1_200, 0]
      : caseId === 'tuesday_below_reserve'
        ? [12_000, 9_000, 9_000]
        : [1_200, 900, 900];
  const grossRub = weekProfitRub.includes(0)
    ? 0
    : Math.round((weekProfitRub[0] + weekProfitRub[1] + weekProfitRub[2]) / 3);
  const tuesdayScheduledRub = Math.round(grossRub * 0.75);
  const thursdayScheduledRub = grossRub - tuesdayScheduledRub;
  const inCampaignsRub =
    caseId === 'tuesday_below_reserve' ? 8_500 : caseId === 'reserve_covers' ? 1_500 : 0;
  const payout = accrualAfterCampaignReserve(
    tuesdayScheduledRub,
    thursdayScheduledRub,
    inCampaignsRub,
  );

  return {
    id: `current-${caseId}`,
    periodLabel: '',
    periodStart: '',
    periodEnd: '',
    weekTotalRub: grossRub,
    tuesdayRub: payout.tuesdayRub,
    thursdayRub: payout.thursdayRub,
    weeksAvgLabel: '',
    weekProfitRub,
    inCampaignsRub,
    spentOnPromoRub: 0,
    // «Доступно сейчас» = баланс на карточке, не сумма начисления за день
    bufferLeftRub: balanceRub,
    grossWeekAccrualRub: grossRub,
    netWeekAccrualRub: payout.netRub,
    todayDay: day,
    showWeeks: caseId === 'zero_week',
  };
}

type FinanceChannel = 'promotion' | 'media' | 'wibes';
type FinanceChannelFilter = 'all' | FinanceChannel;

const FINANCE_CHANNELS: { id: FinanceChannelFilter; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'promotion', label: 'Продвижение' },
  { id: 'media', label: 'Медиа' },
  { id: 'wibes', label: 'Wibes' },
];

const FINANCE_CHANNEL_LABEL: Record<FinanceChannel, string> = {
  promotion: 'Продвижение',
  media: 'Медиа',
  wibes: 'Wibes',
};

type MediaExpenseTag = 'pause' | 'fraud';

const MEDIA_EXPENSE_TAG_LABEL: Record<MediaExpenseTag, string> = {
  pause: 'За приостановку кампании',
  fraud: 'Возвращение с фрода',
};

const MEDIA_EXPENSE_TAG_TONE: Record<MediaExpenseTag, string> = {
  pause: 'bg-[#F3F5F8] text-gray-600',
  fraud: 'bg-[#F3F5F8] text-gray-600',
};

type ExpenseRow = {
  id?: string;
  campaignId: number;
  campaignName: string;
  campaignType: string;
  channel: FinanceChannel;
  mediaTag?: MediaExpenseTag;
  debitDate: string;
  source: string;
  amountRub: number;
  documentNo: number | null;
  isCorrection?: boolean;
};

const EXPENSE_PAGE_SIZE = 10;

const FINANCE_TABLE_HEAD_ROW_CLASS =
  'text-sm font-medium text-black [&>th]:border-b [&>th]:border-gray-100';

const FINANCE_TABLE_BODY_CLASS = [
  '[&>tr>td]:border-b [&>tr>td]:border-gray-100',
  '[&>tr:last-child>td]:border-b-0',
  '[&>tr:not([data-month-heading])>td]:transition-colors',
  '[&>tr:not([data-month-heading]):hover>td]:bg-[#F3F5F8]',
  '[&>tr:not([data-month-heading]):hover>td:first-child]:rounded-l-xl',
  '[&>tr:not([data-month-heading]):hover>td:last-child]:rounded-r-xl',
].join(' ');

function CopyDocumentNo({ value }: { value: number | null }) {
  const [copied, setCopied] = useState(false);
  if (value == null) return <>В обработке</>;

  const copy = () => {
    const text = String(value);
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    document.body.removeChild(area);
    void navigator.clipboard?.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 tabular-nums text-gray-900"
      aria-label={copied ? 'Скопировано' : `Скопировать номер документа ${value}`}
      title={copied ? 'Скопировано' : 'Скопировать'}
    >
      {value}
      {copied ? (
        <Check className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5 text-gray-400"
          aria-hidden
        >
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}

const EXPENSE_CAMPAIGNS: Pick<
  ExpenseRow,
  'campaignId' | 'campaignName' | 'campaignType' | 'channel' | 'mediaTag'
>[] = [
  {
    campaignId: 29_310_872,
    campaignName: 'Куртка демисезонная — поиск',
    campaignType: 'CPM ручная ставка',
    channel: 'promotion',
  },
  {
    campaignId: 28_441_102,
    campaignName: 'Платье летнее — поиск',
    campaignType: 'CPC',
    channel: 'promotion',
  },
  {
    campaignId: 27_902_551,
    campaignName: 'Кроссовки Run Pro — рекомендации',
    campaignType: 'CPC',
    channel: 'promotion',
  },
  {
    campaignId: 26_118_774,
    campaignName: 'Рюкзак городской — поиск',
    campaignType: 'CPM ручная ставка',
    channel: 'promotion',
  },
  {
    campaignId: 25_667_330,
    campaignName: 'Наушники Wave — автобиддер',
    campaignType: 'CPM единая ставка',
    channel: 'promotion',
  },
  {
    campaignId: 24_880_019,
    campaignName: 'Крем для лица — рекомендации',
    campaignType: 'CPC',
    channel: 'promotion',
  },
  {
    campaignId: 23_551_408,
    campaignName: 'Чайник электрический — поиск',
    campaignType: 'CPC',
    channel: 'promotion',
  },
  {
    campaignId: 22_104_776,
    campaignName: 'Постельное бельё сатин — рекомендации',
    campaignType: 'CPM ручная ставка',
    channel: 'promotion',
  },
  {
    campaignId: 21_440_118,
    campaignName: 'РК главная · баннер · осень',
    campaignType: 'Медиа',
    channel: 'media',
  },
  {
    campaignId: 21_102_664,
    campaignName: 'ПВЗ · экран · верхняя одежда',
    campaignType: 'Медиа',
    channel: 'media',
  },
  {
    campaignId: 21_088_441,
    campaignName: 'Баннер · полка бренда',
    campaignType: 'Медиа',
    channel: 'media',
    mediaTag: 'pause',
  },
  {
    campaignId: 21_055_902,
    campaignName: 'Видео · out-stream · новинки',
    campaignType: 'Медиа',
    channel: 'media',
    mediaTag: 'fraud',
  },
];

const EXPENSE_SOURCES = ['Счёт', 'Баланс', 'Промо бонусы'] as const;
const WIBES_EXPENSE_SOURCES = ['Баланс', 'Счёт', 'Промо-бонусы', 'Бонусы'] as const;

const EXPENSE_SOURCE_ICON = {
  Счёт: { Icon: Wallet, circle: 'bg-[#E8F1FF] text-[#007AFF]' },
  Баланс: { Icon: Coins, circle: 'bg-[#E7F8EE] text-[#12A150]' },
  'Промо бонусы': { Icon: Gift, circle: 'bg-[#F3E8FF] text-[#9A41FE]' },
  'Промо-бонусы': { Icon: Gift, circle: 'bg-[#F3E8FF] text-[#9A41FE]' },
  Бонусы: { Icon: Gift, circle: 'bg-[#F3E8FF] text-[#9A41FE]' },
} as const;

const DEMO_WIBES_EXPENSES: ExpenseRow[] = [
  {
    id: 'wb1',
    campaignId: 6_735_628,
    campaignName: 'Весна 2023',
    campaignType: 'Аукцион · CPM',
    channel: 'wibes',
    debitDate: '12.03.2026',
    source: 'Баланс',
    amountRub: 29_000,
    documentNo: 12_345_678,
  },
  {
    id: 'wb2',
    campaignId: 6_735_628,
    campaignName: 'Новая коллекция 2023',
    campaignType: 'Автоматическая · CPM',
    channel: 'wibes',
    debitDate: '12.03.2026',
    source: 'Баланс',
    amountRub: 29_000,
    documentNo: 12_345_678,
    isCorrection: true,
  },
  {
    id: 'wb3',
    campaignId: 6_735_628,
    campaignName: 'Весна 2023',
    campaignType: 'Аукцион · CPM',
    channel: 'wibes',
    debitDate: '12.03.2026',
    source: 'Счёт',
    amountRub: 29_000,
    documentNo: null,
  },
  {
    id: 'wb4',
    campaignId: 6_735_628,
    campaignName: 'Когда название очень длинное и в две строки',
    campaignType: 'Аукцион · CPM',
    channel: 'wibes',
    debitDate: '12.03.2026',
    source: 'Промо-бонусы',
    amountRub: 29_000,
    documentNo: 12_345_678,
    isCorrection: true,
  },
  {
    id: 'wb5',
    campaignId: 6_735_628,
    campaignName: 'Весна 2023',
    campaignType: 'Аукцион · CPM',
    channel: 'wibes',
    debitDate: '12.03.2026',
    source: 'Баланс',
    amountRub: 29_000,
    documentNo: null,
  },
  {
    id: 'wb6',
    campaignId: 6_735_628,
    campaignName: 'Весна 2023',
    campaignType: 'Аукцион · CPM',
    channel: 'wibes',
    debitDate: '12.03.2026',
    source: 'Бонусы',
    amountRub: 29_000,
    documentNo: 12_345_678,
  },
  {
    id: 'wb7',
    campaignId: 6_735_628,
    campaignName: 'Весна 2023',
    campaignType: 'Аукцион · CPM',
    channel: 'wibes',
    debitDate: '12.03.2026',
    source: 'Баланс',
    amountRub: 29_000,
    documentNo: 12_345_678,
    isCorrection: true,
  },
  {
    id: 'wb8',
    campaignId: 6_735_628,
    campaignName: 'Весна 2023',
    campaignType: 'Аукцион · CPM',
    channel: 'wibes',
    debitDate: '12.03.2026',
    source: 'Баланс',
    amountRub: 29_000,
    documentNo: 12_345_678,
  },
];

function ExpenseSourceLabel({ source }: { source: string }) {
  const item = EXPENSE_SOURCE_ICON[source as keyof typeof EXPENSE_SOURCE_ICON];
  return (
    <span className="inline-flex items-center gap-2">
      {item ? (
        <span
          className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${item.circle}`}
        >
          <item.Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
      ) : null}
      {source}
    </span>
  );
}

function buildDemoExpenses(): ExpenseRow[] {
  const start = new Date(2026, 7, 11);
  const generated = Array.from({ length: 100 }, (_, index) => {
    const campaign = EXPENSE_CAMPAIGNS[index % EXPENSE_CAMPAIGNS.length];
    const date = new Date(start);
    date.setDate(start.getDate() - index);
    const debitDate = date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
    return {
      id: `ex${index}`,
      ...campaign,
      debitDate,
      source: EXPENSE_SOURCES[index % EXPENSE_SOURCES.length],
      amountRub: index === 0 ? 1 : 80 + ((index * 137) % 9_200),
      documentNo: 5_820_000 + index,
    };
  });
  return [...generated, ...DEMO_WIBES_EXPENSES];
}

const DEMO_EXPENSES: ExpenseRow[] = buildDemoExpenses();

type CampaignTopupRow = {
  id: string;
  campaignId: number;
  campaignName: string;
  campaignType: string;
  channel: FinanceChannel;
  date: string;
  source: (typeof EXPENSE_SOURCES)[number];
  amountRub: number;
};

const CAMPAIGN_TOPUP_WIBES: Pick<
  CampaignTopupRow,
  'campaignId' | 'campaignName' | 'campaignType' | 'channel'
>[] = [
  {
    campaignId: 6_735_628,
    campaignName: 'Весна 2023',
    campaignType: 'Аукцион · CPM',
    channel: 'wibes',
  },
  {
    campaignId: 6_735_629,
    campaignName: 'Новая коллекция 2023',
    campaignType: 'Автоматическая · CPM',
    channel: 'wibes',
  },
];

function buildDemoCampaignTopups(): CampaignTopupRow[] {
  const start = new Date(2026, 7, 10);
  return Array.from({ length: 24 }, (_, index) => {
    const campaign =
      index % 8 === 7
        ? CAMPAIGN_TOPUP_WIBES[index % CAMPAIGN_TOPUP_WIBES.length]
        : EXPENSE_CAMPAIGNS[index % EXPENSE_CAMPAIGNS.length];
    const date = new Date(start);
    date.setDate(start.getDate() - index * 2);
    return {
      id: `ct${index}`,
      campaignId: campaign.campaignId,
      campaignName: campaign.campaignName,
      campaignType: campaign.campaignType,
      channel: campaign.channel,
      date: date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      }),
      source: EXPENSE_SOURCES[index % EXPENSE_SOURCES.length],
      amountRub: 1_000 * (1 + (index % 12)),
    };
  });
}

const DEMO_CAMPAIGN_TOPUPS: CampaignTopupRow[] = buildDemoCampaignTopups();

type PendingRefundStatus = 'sent' | 'not_sent';
type PendingRefundFunds = 'balance' | 'bonuses';

type PendingRefundRow = {
  campaignId: number;
  campaignName: string;
  campaignType: string;
  channel: FinanceChannel;
  finishedAt: string;
  amountRub: number;
  status: PendingRefundStatus;
  funds: PendingRefundFunds;
};

const PENDING_REFUND_FUNDS_LABEL: Record<PendingRefundFunds, string> = {
  balance: 'С баланса',
  bonuses: 'С бонусов',
};

const DEMO_PENDING_REFUNDS: PendingRefundRow[] = [
  {
    campaignId: 28_441_102,
    campaignName: 'Шапка зимняя — CPC поиск',
    campaignType: 'CPC',
    channel: 'promotion',
    finishedAt: '02.09.26',
    amountRub: 4_850,
    status: 'not_sent',
    funds: 'balance',
  },
  {
    campaignId: 27_902_551,
    campaignName: 'Майка белая автобиддер',
    campaignType: 'CPM ручная ставка',
    channel: 'promotion',
    finishedAt: '28.08.26',
    amountRub: 12_340,
    status: 'sent',
    funds: 'bonuses',
  },
  {
    campaignId: 26_118_774,
    campaignName: 'Платье летнее — рекомендации',
    campaignType: 'CPC',
    channel: 'promotion',
    finishedAt: '15.08.26',
    amountRub: 2_190,
    status: 'not_sent',
    funds: 'balance',
  },
  {
    campaignId: 25_667_330,
    campaignName: 'Кроссовки Run Pro',
    campaignType: 'CPC',
    channel: 'promotion',
    finishedAt: '09.08.26',
    amountRub: 7_600,
    status: 'sent',
    funds: 'bonuses',
  },
  {
    campaignId: 21_440_118,
    campaignName: 'РК главная · баннер · осень',
    campaignType: 'Медиа',
    channel: 'media',
    finishedAt: '20.08.26',
    amountRub: 9_400,
    status: 'not_sent',
    funds: 'balance',
  },
  {
    campaignId: 20_883_501,
    campaignName: 'Клип · lookbook FW26',
    campaignType: 'Wibes',
    channel: 'wibes',
    finishedAt: '12.08.26',
    amountRub: 3_250,
    status: 'sent',
    funds: 'bonuses',
  },
];

type TopupStatus = 'created' | 'success' | 'processing' | 'failed';

const TOPUP_STATUS_OPTIONS: { value: 'all' | TopupStatus; label: string }[] = [
  { value: 'all', label: 'Все пополнения' },
  { value: 'created', label: 'Созданные' },
  { value: 'success', label: 'Успешно' },
  { value: 'processing', label: 'В обработке' },
  { value: 'failed', label: 'Неуспешно' },
];

const TOPUP_STATUS_LABEL: Record<TopupStatus, string> = {
  created: 'Создан',
  success: 'Успешно',
  processing: 'В обработке',
  failed: 'Неуспешно',
};

const TOPUP_PAYER_INN = '7621512371';

const TOPUP_METHODS = ['Картой', 'СБП', 'Расчётный счёт'] as const;
type TopupMethod = (typeof TOPUP_METHODS)[number];

const TOPUP_METHOD_ICON = {
  Картой: { Icon: CreditCard, circle: 'bg-[#E8F1FF] text-[#007AFF]' },
  СБП: { Icon: Smartphone, circle: 'bg-[#F3E8FF] text-[#9A41FE]' },
  'Расчётный счёт': { Icon: Landmark, circle: 'bg-[#E7F8EE] text-[#12A150]' },
} as const;

function TopupMethodLabel({ method }: { method: string }) {
  const item = TOPUP_METHOD_ICON[method as keyof typeof TOPUP_METHOD_ICON];
  return (
    <span className="inline-flex items-center gap-2">
      {item ? (
        <span
          className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${item.circle}`}
        >
          <item.Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
      ) : null}
      {method}
    </span>
  );
}

type TopupRow = {
  id: string;
  date: string;
  amountRub: number;
  inn: string;
  method: TopupMethod;
  status: TopupStatus;
};

const TOPUP_FIRST_PAGE: Omit<TopupRow, 'id'>[] = [
  { date: '14.10.26', amountRub: 26_981, inn: TOPUP_PAYER_INN, method: 'Картой', status: 'success' },
  { date: '14.10.26', amountRub: 250_000, inn: TOPUP_PAYER_INN, method: 'Картой', status: 'success' },
  { date: '14.10.26', amountRub: 15_871, inn: TOPUP_PAYER_INN, method: 'СБП', status: 'success' },
  { date: '14.10.26', amountRub: 36_980, inn: TOPUP_PAYER_INN, method: 'Картой', status: 'failed' },
  { date: '13.10.26', amountRub: 50_000, inn: TOPUP_PAYER_INN, method: 'Картой', status: 'success' },
  { date: '13.10.26', amountRub: 250_000, inn: TOPUP_PAYER_INN, method: 'Расчётный счёт', status: 'success' },
  { date: '13.10.26', amountRub: 12_500, inn: TOPUP_PAYER_INN, method: 'Картой', status: 'processing' },
  { date: '12.10.26', amountRub: 8_400, inn: TOPUP_PAYER_INN, method: 'СБП', status: 'success' },
  { date: '12.10.26', amountRub: 500, inn: TOPUP_PAYER_INN, method: 'Картой', status: 'failed' },
  { date: '12.10.26', amountRub: 75_000, inn: TOPUP_PAYER_INN, method: 'Картой', status: 'success' },
];

function buildDemoTopups(): TopupRow[] {
  const first = TOPUP_FIRST_PAGE.map((row, index) => ({ ...row, id: `tu-${index + 1}` }));
  /** Почти все успешные; редко — обработка / создан / неуспех */
  const statuses: TopupStatus[] = [
    'success',
    'success',
    'success',
    'success',
    'success',
    'success',
    'success',
    'processing',
    'success',
    'success',
    'success',
    'created',
    'success',
    'success',
    'failed',
  ];
  const methods: TopupMethod[] = ['Картой', 'Картой', 'СБП', 'Расчётный счёт'];
  const amounts = [500, 26_981, 15_871, 36_980, 250_000, 12_500, 75_000, 8_400];
  const start = new Date(2026, 9, 11);
  const rest = Array.from({ length: 340 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() - Math.floor(index / 4));
    const debitDate = date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
    return {
      id: `tu-${index + 11}`,
      date: debitDate,
      amountRub: amounts[index % amounts.length],
      inn: TOPUP_PAYER_INN,
      method: methods[index % methods.length],
      status: statuses[index % statuses.length],
    };
  });
  return [...first, ...rest];
}

const DEMO_TOPUPS: TopupRow[] = buildDemoTopups();

function TopupStatusBadge({ status }: { status: TopupStatus }) {
  const tone =
    status === 'success'
      ? 'bg-emerald-50 text-emerald-500'
      : status === 'processing'
        ? 'bg-amber-50 text-amber-500'
        : status === 'failed'
          ? 'bg-[#FDECEC] text-[#F07171]'
          : 'bg-gray-100 text-gray-500';
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-normal ${tone}`}>
      {TOPUP_STATUS_LABEL[status]}
    </span>
  );
}

function RefundStatusBadge({ status }: { status: PendingRefundStatus }) {
  if (status === 'sent') {
    return (
      <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        Отправили
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
      Не отправили
    </span>
  );
}

type BufferAccrualRow = {
  id: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  weekTotalRub: number;
  tuesdayRub: number;
  thursdayRub: number;
  weeksAvgLabel: string;
  /** Прибыль по неделям для формулы средней */
  weekProfitRub?: [number, number, number];
  inCampaignsRub: number;
  spentOnPromoRub: number;
  bufferLeftRub: number;
  /** Расчётная сумма к начислению (средняя за 3 недели), до вычета резерва */
  grossWeekAccrualRub?: number;
  /** Сколько реально доначислим на этой неделе после резерва в кампаниях */
  netWeekAccrualRub?: number;
  sellerExplain?: string;
  /** Для «Текущей»: какой сегодня день недели начислений */
  todayDay?: FinanceBalanceCurrentDayId;
  /** Для «Текущей»: показать прибыль по неделям вместо вторника/четверга */
  showWeeks?: boolean;
};

type BufferAccrualDayRow = {
  id: string;
  date: string;
  amountRub: number;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
};

type BufferSpendRow = {
  id: string;
  date: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  amountRub: number;
  /** 0% — обычное списание; >0 — отложенное */
  commissionPercent: number;
};

const DEMO_BUFFER_ACCRUALS: BufferAccrualDayRow[] = [
  {
    id: 'a1',
    date: '10.09.26',
    amountRub: 3_000,
    periodLabel: '8–14 сентября',
    periodStart: '08.09.26',
    periodEnd: '14.09.26',
  },
  {
    id: 'a2',
    date: '08.09.26',
    amountRub: 9_000,
    periodLabel: '8–14 сентября',
    periodStart: '08.09.26',
    periodEnd: '14.09.26',
  },
  {
    id: 'a3',
    date: '03.09.26',
    amountRub: 2_600,
    periodLabel: '1–7 сентября',
    periodStart: '01.09.26',
    periodEnd: '07.09.26',
  },
  {
    id: 'a4',
    date: '01.09.26',
    amountRub: 7_800,
    periodLabel: '1–7 сентября',
    periodStart: '01.09.26',
    periodEnd: '07.09.26',
  },
  {
    id: 'a5',
    date: '31.08.26',
    amountRub: 2_200,
    periodLabel: '25–31 августа',
    periodStart: '25.08.26',
    periodEnd: '31.08.26',
  },
  {
    id: 'a6',
    date: '29.08.26',
    amountRub: 6_600,
    periodLabel: '25–31 августа',
    periodStart: '25.08.26',
    periodEnd: '31.08.26',
  },
  {
    id: 'a7',
    date: '24.08.26',
    amountRub: 2_400,
    periodLabel: '18–24 августа',
    periodStart: '18.08.26',
    periodEnd: '24.08.26',
  },
  {
    id: 'a8',
    date: '22.08.26',
    amountRub: 7_200,
    periodLabel: '18–24 августа',
    periodStart: '18.08.26',
    periodEnd: '24.08.26',
  },
];

type ExpiredBonusRow = {
  id: string;
  endsAt: string;
  amountB: number;
  campaignId: number;
  campaignName?: string;
  campaignType: string;
};

const DEMO_EXPIRED_BONUSES: ExpiredBonusRow[] = [
  {
    id: 'eb1',
    endsAt: '01.10.26',
    amountB: 999,
    campaignId: 37_731_220,
    campaignName: 'Кампания от 25.06.2026 НЕ УДАЛЯТЬ',
    campaignType: 'Ручная · CPM',
  },
  {
    id: 'eb2',
    endsAt: '01.10.26',
    amountB: 3_000,
    campaignId: 40_439_061,
    campaignName: 'Кампания от 24.09.2026',
    campaignType: 'Единая · CPM',
  },
  {
    id: 'eb3',
    endsAt: '01.10.26',
    amountB: 1_000,
    campaignId: 40_439_131,
    campaignName: 'Фото CPC 24.09.2026',
    campaignType: 'Ручная · CPC',
  },
  {
    id: 'eb4',
    endsAt: '01.10.26',
    amountB: 1_000,
    campaignId: 40_439_061,
    campaignName: 'Кампания от 24.09.2026',
    campaignType: 'Единая · CPM',
  },
  {
    id: 'eb5',
    endsAt: '01.10.26',
    amountB: 1_000,
    campaignId: 40_429_045,
    campaignName: 'Фото CPC 24.09.2026',
    campaignType: 'Ручная · CPC',
  },
  {
    id: 'eb6',
    endsAt: '01.10.26',
    amountB: 3_787,
    campaignId: 304_102,
    campaignType: 'Ручная ·',
  },
  {
    id: 'eb7',
    endsAt: '07.10.26',
    amountB: 999,
    campaignId: 38_005_833,
    campaignName: 'Тест пресетов не удалять',
    campaignType: 'Ручная · CPM',
  },
  {
    id: 'eb8',
    endsAt: '07.10.26',
    amountB: 190,
    campaignId: 37_731_220,
    campaignName: 'Кампания от 25.06.2026 НЕ УДАЛЯТЬ',
    campaignType: 'Ручная · CPM',
  },
  {
    id: 'eb9',
    endsAt: '07.10.26',
    amountB: 552,
    campaignId: 284_601,
    campaignType: 'Ручная ·',
  },
];

const DEMO_BUFFER_SPENDS: BufferSpendRow[] = [
  {
    id: 'sw1',
    date: '14.09.26',
    periodLabel: '8–14 сентября',
    periodStart: '08.09.26',
    periodEnd: '14.09.26',
    amountRub: 7_300,
    commissionPercent: 0,
  },
  {
    id: 'sw2',
    date: '07.09.26',
    periodLabel: '1–7 сентября',
    periodStart: '01.09.26',
    periodEnd: '07.09.26',
    amountRub: 4_120,
    commissionPercent: 2,
  },
  {
    id: 'sw3',
    date: '31.08.26',
    periodLabel: '25–31 августа',
    periodStart: '25.08.26',
    periodEnd: '31.08.26',
    amountRub: 2_850,
    commissionPercent: 0,
  },
  {
    id: 'sw4',
    date: '24.08.26',
    periodLabel: '18–24 августа',
    periodStart: '18.08.26',
    periodEnd: '24.08.26',
    amountRub: 5_640,
    commissionPercent: 4,
  },
];

/** Остаток свободных средств на РК по месяцу. Ключ: `${year}-${monthIndex}` */
const DEMO_BUFFER_FREE_ON_CAMPAIGNS: Record<string, number> = {
  '2026-8': 644_778,
  '2026-7': 512_300,
};

function BufferMonthStatsBlock({
  monthKey,
  title,
  total,
  variant,
}: {
  monthKey: string;
  title: string;
  total: number;
  variant: 'accrued' | 'spent';
}) {
  const freeOnCampaignsRub = DEMO_BUFFER_FREE_ON_CAMPAIGNS[monthKey];
  const lines: Array<[string, number]> =
    variant === 'accrued'
      ? [
          ['Сумма начислений', total],
          ...(freeOnCampaignsRub != null
            ? [['Остаток свободных средств на РК', freeOnCampaignsRub] as [string, number]]
            : []),
        ]
      : [['Сумма списаний', total]];

  return (
    <div>
      <p className="text-base font-semibold text-gray-500">{title}</p>
      <div className="mt-3 space-y-1 text-sm text-gray-800">
        {lines.map(([label, amount]) => (
          <p key={label}>
            {label} - <span className="tabular-nums">{fmtRub(amount)} ₽</span>
          </p>
        ))}
      </div>
    </div>
  );
}

type BonusAccrualRow = {
  id: string;
  date: string;
  source: string;
  amountB: number;
  kind: 'expiring' | 'permanent';
  expiresAt?: string;
};

const DEMO_BONUS_ACCRUALS: BonusAccrualRow[] = [
  {
    id: 'ba1',
    date: '08.09.2026',
    source: 'Задание: запуск CPC-кампании',
    amountB: 3_000,
    kind: 'expiring',
    expiresAt: '08.10.2026',
  },
  {
    id: 'ba2',
    date: '02.09.2026',
    source: 'Реферальная программа',
    amountB: 1_000,
    kind: 'expiring',
    expiresAt: '02.10.2026',
  },
  {
    id: 'ba3',
    date: '28.08.2026',
    source: 'Персональная акция',
    amountB: 5_500,
    kind: 'permanent',
  },
  {
    id: 'ba4',
    date: '15.08.2026',
    source: 'Регистрация нового продавца',
    amountB: 10_000,
    kind: 'expiring',
    expiresAt: '15.09.2026',
  },
  {
    id: 'ba5',
    date: '01.08.2026',
    source: 'Удержание в продвижении 3 месяца',
    amountB: 4_000,
    kind: 'permanent',
  },
];

function CoinStackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <ellipse cx="12" cy="7" rx="7" ry="3" fill="#C4B5FD" />
      <path d="M5 7v3c0 1.7 3.1 3 7 3s7-1.3 7-3V7" fill="#A78BFA" />
      <path d="M5 10v3c0 1.7 3.1 3 7 3s7-1.3 7-3v-3" fill="#8B5CF6" />
      <path d="M5 13v3c0 1.7 3.1 3 7 3s7-1.3 7-3v-3" fill="#7C3AED" />
    </svg>
  );
}

function BufferSchemeModal({
  row,
  onClose,
  kind = 'buffer',
  layout = 'current',
  currentCaseId = 'base',
  onCurrentCaseChange,
  currentDay = 'tuesday',
  onCurrentDayChange,
  simWeekId = 'week1',
  onSimWeekChange,
  simDay = 3,
  onSimDayChange,
  simAdjust = {},
  onSimAdjustChange,
  simScenarioId = 'base',
  onSimScenarioChange,
}: {
  row: BufferAccrualRow;
  onClose: () => void;
  kind?: 'buffer' | 'balance';
  layout?: FinanceBalanceSchemeLayoutId;
  currentCaseId?: FinanceBalanceCurrentCaseId;
  onCurrentCaseChange?: (id: FinanceBalanceCurrentCaseId) => void;
  currentDay?: FinanceBalanceCurrentDayId;
  onCurrentDayChange?: (id: FinanceBalanceCurrentDayId) => void;
  simWeekId?: FinanceBalanceSimWeekId;
  onSimWeekChange?: (id: FinanceBalanceSimWeekId) => void;
  simDay?: number;
  onSimDayChange?: (index: number) => void;
  simAdjust?: FinanceBalanceSimAdjust;
  onSimAdjustChange?: (value: FinanceBalanceSimAdjust) => void;
  simScenarioId?: FinanceBalanceSimScenarioId;
  onSimScenarioChange?: (id: FinanceBalanceSimScenarioId) => void;
}) {
  const simView = buildFinanceBalanceSimView(simWeekId, simDay, simAdjust);
  const [formulaOpen, setFormulaOpen] = useState(false);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const formulaRows =
    kind === 'balance'
      ? [
          {
            value: `${fmtRub(row.tuesdayRub)} ₽`,
            label: 'Баланс, начисленный во вторник (75%)',
          },
          {
            value: `+ ${fmtRub(row.thursdayRub)} ₽`,
            label: 'Баланс, начисленный в четверг (25%)',
          },
          {
            value: `- ${fmtRub(row.inCampaignsRub)} ₽`,
            label: 'Зарезервировано на кампании',
          },
          {
            value: `= ${fmtRub(row.bufferLeftRub)} ₽`,
            label: 'Осталось на балансе',
            tone: 'good' as const,
          },
        ]
      : [
          {
            value: `${fmtRub(row.tuesdayRub)} ₽`,
            label: 'Баланс во вторник (75%)',
          },
          {
            value: `+ ${fmtRub(row.thursdayRub)} ₽`,
            label: 'Баланс в четверг (25%)',
          },
          {
            value: `− ${fmtRub(row.inCampaignsRub)} ₽`,
            label: 'В бюджетах кампаний',
          },
          {
            value: `= ${fmtRub(row.bufferLeftRub)} ₽`,
            label: 'Осталось на балансе',
            tone: 'good' as const,
          },
        ];

  const grossWeek = row.grossWeekAccrualRub ?? row.weekTotalRub;
  const netWeek = row.netWeekAccrualRub ?? Math.max(0, grossWeek - row.inCampaignsRub);
  const showStatusLayout = kind === 'balance' && layout === 'status';
  const payoutDates = financeBalancePayoutDates();

  return createPortal(
    <div className="fixed inset-0 z-[120] bg-black/50" onClick={onClose} role="presentation">
      <div className="flex h-full w-full justify-end" onClick={onClose}>
        <div
          className="flex h-full max-h-full min-w-0 items-stretch gap-2"
          onClick={(event) => event.stopPropagation()}
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
            className="flex h-full w-[720px] max-w-[calc(100vw-3rem)] shrink-0 flex-col overflow-hidden rounded-l-[28px] bg-white shadow-2xl animate-in slide-in-from-right duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="buffer-scheme-title"
          >
            <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-8 sm:p-10">
              {showStatusLayout ? (
                <FinanceBalanceModalVariant
                  variant="feed"
                  titleId="buffer-scheme-title"
                  view={simView}
                  weekdayIndex={simDay}
                />
              ) : kind === 'balance' ? (
                <>
                  <h2 id="buffer-scheme-title" className="text-2xl font-bold tracking-tight text-gray-900">
                    Баланс
                  </h2>
                  <div className="mt-6">
                    <span className="block text-sm font-medium text-gray-500">Доступно сейчас</span>
                    <span className="mt-2 block text-[32px] font-bold leading-none tabular-nums tracking-tight text-gray-900">
                      {fmtRub(row.bufferLeftRub)} ₽
                    </span>
                  </div>
                  <div className="mt-5 border-t border-gray-100">
                    <button
                      type="button"
                      aria-expanded={formulaOpen}
                      onClick={() => setFormulaOpen((open) => !open)}
                      className="-mx-2 flex w-[calc(100%+1rem)] items-center justify-between gap-4 rounded-lg border-b border-gray-100 px-2 py-3.5 text-left transition-colors hover:bg-[#F3F5F8]"
                    >
                      <span className="text-sm text-gray-500">
                        {row.todayDay
                          ? row.inCampaignsRub > 0
                            ? 'Придёт на этой неделе'
                            : 'Начисление на этой неделе'
                          : `Начислим ${payoutDates.tuesday}`}
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums text-gray-900">
                        {fmtRub(row.todayDay ? netWeek : row.tuesdayRub)} ₽
                        <ChevronDown
                          className={`h-4 w-4 text-gray-400 transition-transform ${formulaOpen ? 'rotate-180' : ''}`}
                          aria-hidden
                        />
                      </span>
                    </button>
                  </div>

                  <div>
                    {formulaOpen ? (
                      <div className="text-sm">
                        <div className="flex items-baseline justify-between gap-4 border-b border-gray-100 py-3">
                          <span className="text-gray-900">Всего к начислению на этой неделе</span>
                          <span className="shrink-0 font-semibold tabular-nums text-gray-900">
                            {fmtRub(row.weekTotalRub)} ₽
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between gap-4 border-b border-gray-100 py-3">
                          <span className="text-gray-900">Баланс на кампаниях сейчас</span>
                          <span
                            className={`shrink-0 font-semibold tabular-nums ${
                              row.inCampaignsRub > 0 ? 'text-gray-900' : 'text-gray-400'
                            }`}
                          >
                            {row.inCampaignsRub > 0 ? '− ' : ''}
                            {fmtRub(row.inCampaignsRub)} ₽
                          </span>
                        </div>
                        {row.inCampaignsRub > 0 ? (
                          <div className="flex items-baseline justify-between gap-4 border-b border-gray-100 py-3">
                            <span className="text-gray-900">Придёт на этой неделе</span>
                            <span className="shrink-0 font-semibold tabular-nums text-gray-900">
                              {fmtRub(netWeek)} ₽
                            </span>
                          </div>
                        ) : null}
                        {row.showWeeks && row.weekProfitRub ? (
                          row.weekProfitRub.map((amount, index) => (
                            <div
                              key={`current-week-${index}`}
                              className="flex items-baseline justify-between gap-4 border-b border-gray-100 py-3 pl-4"
                            >
                              <span className="text-gray-500">Неделя {index + 1}</span>
                              <span
                                className={`shrink-0 tabular-nums ${amount === 0 ? 'font-semibold text-red-600' : 'text-gray-900'}`}
                              >
                                {fmtRub(amount)} ₽
                              </span>
                            </div>
                          ))
                        ) : (
                          <>
                            <div className="flex items-baseline justify-between gap-4 border-b border-gray-100 py-3 pl-4">
                              <span className="text-gray-500">
                                {payoutDates.tuesday}
                                {row.todayDay ? (
                                  <span className="ml-2 text-xs text-gray-400">начислили</span>
                                ) : null}
                              </span>
                              <span
                                className={`shrink-0 tabular-nums ${
                                  row.tuesdayRub > 0 ? 'text-gray-900' : 'text-gray-400'
                                }`}
                              >
                                {fmtRub(row.tuesdayRub)} ₽
                              </span>
                            </div>
                            <div className="flex items-baseline justify-between gap-4 border-b border-gray-100 py-3 pl-4">
                              <span className="text-gray-500">
                                {payoutDates.thursday}
                                {row.todayDay ? (
                                  <span className="ml-2 text-xs text-gray-400">
                                    {row.todayDay === 'thursday' ? 'начислили' : 'начислим'}
                                  </span>
                                ) : null}
                              </span>
                              <span
                                className={`shrink-0 tabular-nums ${
                                  row.todayDay === 'tuesday' || row.thursdayRub === 0
                                    ? 'text-gray-400'
                                    : 'text-gray-900'
                                }`}
                              >
                                {fmtRub(row.thursdayRub)} ₽
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs font-medium text-gray-500">{row.periodLabel}</p>
                  <p id="buffer-scheme-title" className="mt-1 text-xl font-bold leading-snug text-gray-900">
                    К начислению баланса на этой неделе:
                  </p>
                  <p className="mt-4 text-[32px] font-bold leading-none tabular-nums text-gray-900">
                    {fmtRub(row.weekTotalRub)} ₽
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-gray-500">
                    Баланс равен средней сумме в графе «Итого к оплате» в{' '}
                    <button type="button" className="font-medium text-[#007AFF] hover:underline">
                      финансовых отчётах
                    </button>{' '}
                    за последние 3 недели: {row.weeksAvgLabel}
                  </p>

                  <div className="mt-6 rounded-2xl bg-[#F7F7F9] p-5">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3E8FF]">
                        <CoinStackIcon className="h-6 w-6" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-bold text-gray-900">Остаток баланса</p>
                        <p className="mt-1 text-sm leading-relaxed text-gray-500">
                          Начисляем баланс 2 раза в неделю: 75% — во вторник, и 25% — в четверг
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-gray-200/80">
                      {formulaRows.map((item) => (
                        <div
                          key={item.label}
                          className="-mx-2 flex items-baseline justify-between gap-4 rounded-lg border-b border-gray-200/80 px-2 py-3 transition-colors last:border-b-0 hover:bg-[#E6E9EE]"
                        >
                          <p className="min-w-0 text-sm leading-snug text-gray-500">{item.label}</p>
                          <p
                            className={`shrink-0 text-sm font-bold tabular-nums ${
                              item.tone === 'good' ? 'text-emerald-600' : 'text-gray-900'
                            }`}
                          >
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {kind === 'balance' ? (
        <div
          className="fixed bottom-4 left-4 z-[130] flex max-w-[min(440px,calc(100vw-2rem))] flex-col gap-2 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5"
          onClick={(event) => event.stopPropagation()}
          role="group"
          aria-label="Демо: вариант модалки баланса"
        >
          {showStatusLayout && onSimWeekChange ? (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-1">
                <span className="px-1 text-xs text-gray-500">Неделя</span>
                {FINANCE_BALANCE_SIM_WEEKS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    title={item.explain}
                    onClick={() => {
                      onSimWeekChange(item.id);
                      onSimDayChange?.(0);
                    }}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      simWeekId === item.id
                        ? 'bg-black text-white'
                        : 'bg-[rgba(74,74,89,0.08)] text-black hover:bg-[rgba(74,74,89,0.12)]'
                    }`}
                  >
                    {item.short}
                  </button>
                ))}
              </div>
              {onSimDayChange ? (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="px-1 text-xs text-gray-500">День</span>
                  {FINANCE_BALANCE_WEEK_DAYS.map((label, index) => (
                    <button
                      key={label}
                      type="button"
                      title={financeBalanceWeekDate(index, undefined, simView.weekOffset)}
                      onClick={() => onSimDayChange(index)}
                      className={`flex min-w-[2rem] flex-col items-center rounded-lg px-2 py-1 text-xs font-medium leading-tight transition-colors ${
                        simDay === index
                          ? 'bg-black text-white'
                          : 'bg-[rgba(74,74,89,0.08)] text-black hover:bg-[rgba(74,74,89,0.12)]'
                      }`}
                    >
                      {label}
                      <span
                        className={`text-[10px] font-normal tabular-nums ${simDay === index ? 'text-white/60' : 'text-gray-500'}`}
                      >
                        {financeBalanceWeekDate(index, undefined, simView.weekOffset).split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
              {onSimAdjustChange
                ? (
                    [
                      { key: 'spent', label: 'Потрачено', value: simView.spentThisWeekRub },
                      { key: 'reserve', label: 'Резерв в кампаниях', value: simView.reservedThisWeekRub },
                    ] as const
                  ).map((item) => {
                    const step = Math.min(FINANCE_BALANCE_SIM_STEP_RUB, simView.availableNowRub);
                    const actions = simAdjust[simView.weekId] ?? [];
                    const add = () =>
                      onSimAdjustChange({
                        ...simAdjust,
                        [simView.weekId]: [...actions, { day: simDay, kind: item.key, rub: step }],
                      });
                    const reset = () =>
                      onSimAdjustChange({
                        ...simAdjust,
                        [simView.weekId]: actions.filter((action) => action.kind !== item.key),
                      });
                    return (
                      <div key={item.key} className="flex flex-wrap items-center gap-1">
                        <span className="px-1 text-xs text-gray-500">{item.label}</span>
                        <span className="min-w-[4.5rem] px-1 text-xs font-semibold tabular-nums text-gray-900">
                          {fmtRub(item.value)} ₽
                        </span>
                        <button
                          type="button"
                          disabled={step <= 0}
                          title={step <= 0 ? 'На балансе больше нет денег' : undefined}
                          onClick={add}
                          className="rounded-lg bg-[rgba(74,74,89,0.08)] px-2.5 py-1.5 text-xs font-medium tabular-nums text-black transition-colors hover:bg-[rgba(74,74,89,0.12)] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          +{fmtRub(FINANCE_BALANCE_SIM_STEP_RUB)} ₽
                        </button>
                        {item.value > 0 ? (
                          <button
                            type="button"
                            onClick={reset}
                            className="rounded-lg px-2 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-[rgba(74,74,89,0.08)]"
                          >
                            Сбросить
                          </button>
                        ) : null}
                      </div>
                    );
                  })
                : null}
            </div>
          ) : null}
          {layout === 'current' && onCurrentCaseChange ? (
            <div className="flex flex-wrap gap-1 border-t border-gray-100 pt-2">
              {FINANCE_BALANCE_CURRENT_CASES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onCurrentCaseChange(item.id)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    currentCaseId === item.id
                      ? 'bg-black text-white'
                      : 'bg-[rgba(74,74,89,0.08)] text-black hover:bg-[rgba(74,74,89,0.12)]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}
          {layout === 'current' && currentCaseId !== 'base' && onCurrentDayChange ? (
            <div className="flex items-center gap-1 border-t border-gray-100 pt-2">
              <span className="px-1 text-xs text-gray-500">Сегодня</span>
              {FINANCE_BALANCE_CURRENT_DAYS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onCurrentDayChange(item.id)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    currentDay === item.id
                      ? 'bg-black text-white'
                      : 'bg-[rgba(74,74,89,0.08)] text-black hover:bg-[rgba(74,74,89,0.12)]'
                  }`}
                >
                  {payoutDates[item.id]}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>,
    document.body,
  );
}

function ArrowUpRightIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

function FinanceBalancesCard() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { profileId } = useProfile();
  const { promoBonusTotal } = usePromoBonusDemo();
  const accountRub = PROMOTION_ACCOUNT_BALANCE_BY_PROFILE[profileId];
  const [balanceCaseId] = useState<BalanceDemoCaseId>(readFinanceBalanceDemoCase);
  const [instructionOpen, setInstructionOpen] = useState(false);
  const [balanceSchemeOpen, setBalanceSchemeOpen] = useState(false);
  const schemeLayout: FinanceBalanceSchemeLayoutId = 'status';
  const [currentCase, setCurrentCase] = useState<FinanceBalanceCurrentCaseId>(
    readFinanceBalanceCurrentCase,
  );
  const [currentDay, setCurrentDay] = useState<FinanceBalanceCurrentDayId>(
    readFinanceBalanceCurrentDay,
  );
  const [simWeekId, setSimWeekId] = useState<FinanceBalanceSimWeekId>(readFinanceBalanceSimWeek);
  const [simDay, setSimDay] = useState<number>(readFinanceBalanceSimDay);
  const [simAdjust, setSimAdjust] = useState<FinanceBalanceSimAdjust>(readFinanceBalanceSimAdjust);
  const [simScenarioId, setSimScenarioId] = useState<FinanceBalanceSimScenarioId>(
    readFinanceBalanceSimScenario,
  );
  const simView = buildFinanceBalanceSimView(simWeekId, simDay, simAdjust);
  const caseBalanceRub = BALANCE_DEMO_CASES.find((item) => item.id === balanceCaseId)?.amount ?? 0;
  /** В раскладке «Статус» карточка следует симуляции недель */
  const balanceRub = schemeLayout === 'status' ? simView.availableNowRub : caseBalanceRub;
  const labelTip = useDismissibleHoverTooltip(instructionOpen);
  const balanceSchemeData = balanceCurrentCaseRow(caseBalanceRub, currentCase, currentDay);
  const openInstruction = () => {
    labelTip.dismiss();
    setInstructionOpen(true);
  };
  const unifiedVariant = readFinanceUnifiedVariant();
  const ownHeader = financeUnifiedHasOwnHeader(unifiedVariant);
  const unifiedLabel = (
    <div
      className="relative inline-flex w-fit cursor-help items-center gap-1.5"
      onMouseEnter={labelTip.onMouseEnter}
      onMouseLeave={labelTip.onMouseLeave}
    >
      <span className="text-sm font-medium text-gray-600">Единый счёт</span>
      <button
        type="button"
        className="inline-flex items-center justify-center transition-opacity hover:opacity-80"
        aria-label="Что такое счёт продвижения"
      >
        <HelpCircle className="h-4 w-4 text-gray-400" />
      </button>
      {labelTip.show ? (
        <div className="absolute left-full top-1/2 z-40 -translate-y-[19px] pl-2.5">
          <div className="relative w-[17rem] rounded-xl bg-gray-900 px-3 py-2.5 text-left text-xs font-normal leading-snug text-white shadow-lg">
            <span
              className="absolute right-full top-3 border-y-[7px] border-r-[8px] border-y-transparent border-r-gray-900"
              aria-hidden
            />
            <p>Сумма ваших денег и баланса</p>
            <p className="mt-1.5">
              Когда пополняете кампанию, деньги сначала списываются со счёта, а если суммы не хватит — с
              баланса
            </p>
            <button
              type="button"
              onClick={openInstruction}
              className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/15"
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gray-400 text-black">
                <svg viewBox="0 0 24 24" className="ml-px h-2 w-2" fill="currentColor" aria-hidden>
                  <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l10.5-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14Z" />
                </svg>
              </span>
              Видеоинструкция
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );

  useEffect(() => {
    if (schemeLayout !== 'status') return;
    writeFinanceBalanceAmountRub(simView.availableNowRub);
  }, [schemeLayout, simView.availableNowRub]);

  return (
    <div className="relative z-20 rounded-2xl bg-white p-4 sm:p-5">
      {instructionOpen && (
        <UnifiedAccountInstructionModal
          videoSrc={UNIFIED_ACCOUNT_VIDEO_SRC}
          accountRub={accountRub}
          balanceRub={balanceRub}
          promoBonusAmount={promoBonusTotal}
          onClose={() => setInstructionOpen(false)}
        />
      )}
      {balanceSchemeOpen ? (
        <BufferSchemeModal
          kind="balance"
          layout={schemeLayout}
          currentCaseId={currentCase}
          onCurrentCaseChange={(next) => {
            setCurrentCase(next);
            writeFinanceBalanceCurrentCase(next);
          }}
          currentDay={currentDay}
          onCurrentDayChange={(next) => {
            setCurrentDay(next);
            writeFinanceBalanceCurrentDay(next);
          }}
          simWeekId={simWeekId}
          onSimWeekChange={(next) => {
            const weekIds = FINANCE_BALANCE_SIM_WEEKS.map((week) => week.id);
            const from = weekIds.indexOf(simWeekId);
            const to = weekIds.indexOf(next);
            /** Новая неделя начинается без трат и резерва; более поздние недели тоже сбрасываем */
            const keepUntil = to > from ? to : to + 1;
            const nextAdjust: FinanceBalanceSimAdjust = {};
            weekIds.slice(0, keepUntil).forEach((id) => {
              if (simAdjust[id]) nextAdjust[id] = simAdjust[id];
            });
            setSimAdjust(nextAdjust);
            writeFinanceBalanceSimAdjust(nextAdjust);
            setSimWeekId(next);
            writeFinanceBalanceSimWeek(next);
          }}
          simDay={simDay}
          onSimDayChange={(next) => {
            setSimDay(next);
            writeFinanceBalanceSimDay(next);
          }}
          simAdjust={simAdjust}
          onSimAdjustChange={(next) => {
            setSimAdjust(next);
            writeFinanceBalanceSimAdjust(next);
          }}
          simScenarioId={simScenarioId}
          onSimScenarioChange={(next) => {
            setSimScenarioId(next);
            writeFinanceBalanceSimScenario(next);
          }}
          row={balanceSchemeData}
          onClose={() => setBalanceSchemeOpen(false)}
        />
      ) : null}
      <div className="flex flex-col gap-5">
        <div>
          {ownHeader ? null : (
            <div className="flex items-center justify-between gap-3">
              {unifiedLabel}
              <button
                type="button"
                onClick={() => navigate(financeTopUpPath(pathname))}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#9A41FE] text-white transition-colors hover:bg-[#8a38e8]"
                aria-label="Пополнить счёт продвижения"
              >
                <Plus className="h-5 w-5" aria-hidden />
              </button>
            </div>
          )}

          <div className={ownHeader ? '' : 'mt-3'}>
            <FinanceMoneyIconRows
              variant={unifiedVariant}
              label={ownHeader ? unifiedLabel : undefined}
              accountRub={accountRub}
              balanceRub={balanceRub}
              onOpen={() => setBalanceSchemeOpen(true)}
              onTopUp={() => navigate(financeTopUpPath(pathname))}
            />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="text-sm font-medium text-gray-600">Промобонусы</span>
              <span className="tooltip justify-start">
                <button
                  type="button"
                  className="inline-flex text-gray-400 transition-colors hover:text-gray-600"
                  aria-label="Что такое промобонусы"
                >
                  <HelpCircle className="h-4 w-4" aria-hidden />
                </button>
                <span className="tooltip-text !bottom-auto !left-0 !top-full !mt-1.5 !w-[17rem] !max-w-[17rem] !translate-x-0 !whitespace-normal !py-2.5 !px-3 !text-left text-xs !font-normal !leading-snug">
                  Дополнительный источник, с которого можно списать часть от суммы пополнения. Начисляем
                  их, например, за регистрацию нового продавца или за задания по продвижению.
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/bonuses')}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F2F2F7] text-gray-700 transition-colors hover:bg-[#ECECF0]"
              aria-label="Перейти к промобонусам"
            >
              <ArrowUpRightIcon className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-3 text-[28px] font-bold leading-none tabular-nums tracking-tight text-gray-900">
            {fmtRub(promoBonusTotal)} B
          </p>
        </div>
      </div>
    </div>
  );
}

function HistoryClockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <circle cx="8" cy="8" r="5.25" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 5.25V8l1.75 1.1"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.8 3.4c.9.7 1.55 1.7 1.8 2.85"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

const SPEND_SCHEDULE_ROWS = [
  {
    id: 's1',
    period: '26 сен – 3 окт',
    spentRub: 163_490,
    commission: '2%',
    chargeRub: 166_759,
    chargeDate: '24 октября',
  },
  {
    id: 's2',
    period: '3–10 окт',
    spentRub: 143_350,
    commission: '4%',
    chargeRub: 149_084,
    chargeDate: '28 ноября',
  },
] as const;

function SpendScheduleModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-[640px] rounded-2xl bg-white px-6 py-5 shadow-2xl sm:px-8 sm:py-7"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="spend-schedule-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="Закрыть"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>

        <h2 id="spend-schedule-title" className="pr-10 text-2xl font-bold tracking-tight text-gray-900">
          График списаний
        </h2>
        <p className="mt-3 max-w-[34rem] text-sm leading-relaxed text-gray-500">
          Показываем только прошлые периоды — расходы за эту неделю появятся в воскресенье.{' '}
          <button type="button" className="font-medium text-[#007AFF] hover:underline">
            Скачать в Excel
          </button>
        </p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="pb-3 pr-4 font-medium">Период</th>
                <th className="pb-3 pr-4 font-medium">Потрачено</th>
                <th className="pb-3 pr-4 font-medium">Комиссия</th>
                <th className="pb-3 pr-4 font-medium">Спишем</th>
                <th className="pb-3 font-medium">Дата списания</th>
              </tr>
            </thead>
            <tbody>
              {SPEND_SCHEDULE_ROWS.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-4 pr-4 text-gray-900">{row.period}</td>
                  <td className="py-4 pr-4 tabular-nums text-gray-900">{fmtRub(row.spentRub)} ₽</td>
                  <td className="py-4 pr-4 tabular-nums text-gray-900">{row.commission}</td>
                  <td className="py-4 pr-4 tabular-nums text-gray-900">{fmtRub(row.chargeRub)} ₽</td>
                  <td className="py-4 text-gray-900">{row.chargeDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function BalanceSpendCard() {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [postponed, setPostponed] = useState(false);
  const [simWeekId, setSimWeekId] = useState(readFinanceBalanceSimWeek);
  const [simDay, setSimDay] = useState(readFinanceBalanceSimDay);
  const [simAdjust, setSimAdjust] = useState(readFinanceBalanceSimAdjust);

  useEffect(() => {
    const refresh = () => {
      setSimWeekId(readFinanceBalanceSimWeek());
      setSimDay(readFinanceBalanceSimDay());
      setSimAdjust(readFinanceBalanceSimAdjust());
    };
    window.addEventListener(FINANCE_BALANCE_SIM_EVENT, refresh);
    return () => window.removeEventListener(FINANCE_BALANCE_SIM_EVENT, refresh);
  }, []);

  const simView = buildFinanceBalanceSimView(simWeekId, simDay, simAdjust);
  const periodLabel = `За ${financeBalanceWeekRangeLabel(undefined, simView.weekOffset)}`;
  const chargeDate = financeBalanceWeekChargeDate(undefined, simView.weekOffset);
  const spentRub = simView.spentThisWeekRub;

  return (
    <div className="rounded-2xl bg-white p-4 sm:p-5">
      {scheduleOpen ? <SpendScheduleModal onClose={() => setScheduleOpen(false)} /> : null}
      {postponed ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F3E8FF] px-2.5 py-1 text-xs font-medium text-[#7C3AED]">
          Списание отложено
          <HistoryClockIcon className="h-3.5 w-3.5" />
        </span>
      ) : null}

      <h2 className={`${postponed ? 'mt-3' : ''} text-xl font-bold tracking-tight text-gray-900`}>
        Расход баланса
      </h2>

      <div className="mt-4 space-y-2.5 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-gray-500">{periodLabel}</span>
          <span className="shrink-0 tabular-nums text-gray-500">{fmtRub(spentRub)} ₽</span>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-gray-500">Комиссия 0%</span>
          <span className="shrink-0 tabular-nums text-gray-500">0 ₽</span>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="whitespace-nowrap font-medium text-gray-900">Спишем {chargeDate}</span>
          <span className="tooltip shrink-0 whitespace-nowrap font-bold tabular-nums text-gray-900">
            {spentRub > 0 ? `~${fmtRub(spentRub)}` : fmtRub(spentRub)} ₽
            <span className="tooltip-text !left-auto !right-0 !translate-x-0 !w-[16rem] !max-w-[16rem] !whitespace-normal !px-3 !py-2 !text-left !font-normal !leading-snug">
              Сумма меняется, когда вы тратите баланс. Итоговую сумму рассчитаем {chargeDate}.
            </span>
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          if (!postponed) setPostponed(true);
        }}
        className="mt-5 flex w-full items-center justify-center rounded-xl bg-[#4B4B57] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#3d3d48]"
      >
        {postponed ? 'Изменить дату списания' : 'Отложить списание'}
      </button>
      {postponed ? (
        <button
          type="button"
          onClick={() => setScheduleOpen(true)}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F3F4F6] px-4 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-[#ECECF0] hover:text-gray-700"
        >
          <Calendar className="h-4 w-4 shrink-0" aria-hidden />
          График списаний
        </button>
      ) : null}
    </div>
  );
}

type FinancePeriod = { kind: 'all' } | { kind: 'range'; from: Date; to: Date };

function startOfWeek(date: Date): Date {
  const day = startOfDay(date);
  const offset = (day.getDay() + 6) % 7;
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() - offset);
}

function startOfQuarter(date: Date): Date {
  const month = Math.floor(date.getMonth() / 3) * 3;
  return new Date(date.getFullYear(), month, 1);
}

function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

type FinancePeriodPreset = 'all' | 'day' | 'week' | 'quarter' | 'year';

const FINANCE_PERIOD_PRESETS: { id: FinancePeriodPreset; label: string }[] = [
  { id: 'all', label: 'Весь период' },
  { id: 'day', label: 'День' },
  { id: 'week', label: 'Неделя' },
  { id: 'quarter', label: 'Квартал' },
  { id: 'year', label: 'Год' },
];

function financePresetRange(preset: Exclude<FinancePeriodPreset, 'all'>, today: Date): { from: Date; to: Date } {
  const to = startOfDay(today);
  const from =
    preset === 'day'
      ? to
      : preset === 'week'
        ? startOfWeek(to)
        : preset === 'quarter'
          ? startOfQuarter(to)
          : startOfYear(to);
  return { from, to };
}

function activeFinancePreset(period: FinancePeriod, today: Date): FinancePeriodPreset | null {
  if (period.kind === 'all') return 'all';
  const from = startOfDay(period.from).getTime();
  const to = startOfDay(period.to).getTime();
  if (to !== startOfDay(today).getTime()) return null;
  if (from === financePresetRange('day', today).from.getTime()) return 'day';
  if (from === financePresetRange('week', today).from.getTime()) return 'week';
  if (from === financePresetRange('quarter', today).from.getTime()) return 'quarter';
  if (from === financePresetRange('year', today).from.getTime()) return 'year';
  return null;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseFinanceDate(value: string): Date | null {
  const match = /^(\d{2})\.(\d{2})\.(\d{2}|\d{4})$/.exec(value.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]) - 1;
  const rawYear = Number(match[3]);
  const year = rawYear < 100 ? 2000 + rawYear : rawYear;
  const date = new Date(year, month, day);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null;
  return date;
}

function dateInPeriod(value: string, period: FinancePeriod): boolean {
  if (period.kind === 'all') return true;
  const date = parseFinanceDate(value);
  if (!date) return false;
  return date >= startOfDay(period.from) && date <= startOfDay(period.to);
}

function spansOverlapPeriod(start: string, end: string, period: FinancePeriod): boolean {
  if (period.kind === 'all') return true;
  const from = parseFinanceDate(start);
  const to = parseFinanceDate(end);
  if (!from || !to) return false;
  return to >= startOfDay(period.from) && from <= startOfDay(period.to);
}

function formatFinanceDay(date: Date): string {
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

function formatFinancePeriodLabel(period: FinancePeriod): string {
  if (period.kind === 'all') return 'Выбрать период';
  const from = startOfDay(period.from);
  const to = startOfDay(period.to);
  if (from.getTime() === to.getTime()) return formatFinanceDay(from);
  return `${formatFinanceDay(from)} — ${formatFinanceDay(to)}`;
}

function formatFinanceInputDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${date.getFullYear()}`;
}

const FINANCE_WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;

function buildFinanceMonthCells(year: number, month: number): Array<Date | null> {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  const cells: Array<Date | null> = Array.from({ length: lead }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function FinancePeriodPicker({
  value,
  onChange,
}: {
  value: FinancePeriod;
  onChange: (next: FinancePeriod) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const today = startOfDay(new Date());
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [viewMonth, setViewMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [draftFrom, setDraftFrom] = useState<Date | null>(null);
  const [draftTo, setDraftTo] = useState<Date | null>(null);
  const [pickingEnd, setPickingEnd] = useState(false);
  const [startInput, setStartInput] = useState('');
  const [endInput, setEndInput] = useState('');

  const syncDraft = (from: Date | null, to: Date | null) => {
    setDraftFrom(from);
    setDraftTo(to);
    setStartInput(from ? formatFinanceInputDate(from) : '');
    setEndInput(to ? formatFinanceInputDate(to) : '');
  };

  const openPicker = () => {
    if (value.kind === 'range') {
      syncDraft(startOfDay(value.from), startOfDay(value.to));
      setViewMonth(new Date(value.from.getFullYear(), value.from.getMonth(), 1));
    } else {
      syncDraft(null, null);
      setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    }
    setPickingEnd(false);
    setOpen((current) => !current);
  };

  useLayoutEffect(() => {
    if (!open || !rootRef.current) {
      setMenuPos(null);
      return;
    }
    const update = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(320, window.innerWidth - 32);
      const left = Math.min(Math.max(16, rect.left), window.innerWidth - width - 16);
      setMenuPos({ top: rect.bottom + 6, left });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (dialogRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('click', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('click', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const pickDay = (day: Date) => {
    if (day > today) return;
    if (!pickingEnd || !draftFrom) {
      syncDraft(day, day);
      setPickingEnd(true);
      return;
    }
    const [from, to] = day >= draftFrom ? [draftFrom, day] : [day, draftFrom];
    syncDraft(from, to);
    setPickingEnd(false);
  };

  const commitInputs = () => {
    const start = parseFinanceDate(startInput);
    const end = parseFinanceDate(endInput);
    if (!start || !end) {
      syncDraft(draftFrom, draftTo);
      return;
    }
    const [from, to] = start <= end ? [start, end] : [end, start];
    const clampedTo = to > today ? today : to;
    const clampedFrom = from > clampedTo ? clampedTo : from;
    syncDraft(clampedFrom, clampedTo);
    setPickingEnd(false);
    setViewMonth(new Date(clampedFrom.getFullYear(), clampedFrom.getMonth(), 1));
  };

  const applyPreset = (preset: FinancePeriodPreset) => {
    if (preset === 'all') {
      onChange({ kind: 'all' });
    } else {
      const { from, to } = financePresetRange(preset, today);
      onChange({ kind: 'range', from, to });
    }
    setOpen(false);
  };

  const applyRange = () => {
    if (!draftFrom || !draftTo) return;
    const [from, to] = draftFrom <= draftTo ? [draftFrom, draftTo] : [draftTo, draftFrom];
    onChange({ kind: 'range', from, to });
    setOpen(false);
  };

  const cells = buildFinanceMonthCells(viewMonth.getFullYear(), viewMonth.getMonth());
  const monthTitle = viewMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  const nextMonthDisabled =
    viewMonth.getFullYear() === today.getFullYear() && viewMonth.getMonth() === today.getMonth();
  const rangeFrom = draftFrom && draftTo && draftFrom > draftTo ? draftTo : draftFrom;
  const rangeTo = draftFrom && draftTo && draftFrom > draftTo ? draftFrom : draftTo;
  const selectedPreset = activeFinancePreset(value, today);

  return (
    <div className="relative w-max" ref={rootRef}>
      <button
        type="button"
        aria-label="Период"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={openPicker}
        className={`inline-flex h-8 w-max items-center justify-between gap-1.5 whitespace-nowrap rounded-xl border border-transparent bg-[#F3F5F8] px-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-[#E6E9EE] ${
          open ? 'bg-[#E6E9EE]' : ''
        }`}
      >
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-500" aria-hidden />
          <span className="truncate">{formatFinancePeriodLabel(value)}</span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open && menuPos
        ? createPortal(
        <div
          ref={dialogRef}
          role="dialog"
          aria-label="Выбрать период"
          style={{ top: menuPos.top, left: menuPos.left }}
          className="fixed z-[200] w-[min(320px,calc(100vw-2rem))] rounded-xl border border-gray-100 bg-white p-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        >
          <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Пресеты периода">
            {FINANCE_PERIOD_PRESETS.map((preset) => {
              const active = selectedPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => applyPreset(preset.id)}
                  className={`rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                    active
                      ? 'bg-[#F3F5F8] font-semibold text-gray-950'
                      : 'text-gray-600 hover:bg-[#F3F5F8] hover:text-gray-900'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-[#F3F5F8] hover:text-gray-800"
              aria-label="Предыдущий месяц"
            >
              <ChevronDown className="h-4 w-4 rotate-90" aria-hidden />
            </button>
            <p className="text-sm font-semibold capitalize text-gray-900">{monthTitle}</p>
            <button
              type="button"
              disabled={nextMonthDisabled}
              onClick={() => setViewMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-[#F3F5F8] hover:text-gray-800 disabled:cursor-default disabled:text-gray-300 disabled:hover:bg-transparent"
              aria-label="Следующий месяц"
            >
              <ChevronDown className="h-4 w-4 -rotate-90" aria-hidden />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7">
            {FINANCE_WEEKDAYS.map((label, index) => (
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
              if (!day) return <div key={`empty-${index}`} className="h-8" />;
              const disabled = day > today;
              const isStart = Boolean(rangeFrom && day.getTime() === rangeFrom.getTime());
              const isEnd = Boolean(rangeTo && day.getTime() === rangeTo.getTime());
              const inRange = Boolean(rangeFrom && rangeTo && day >= rangeFrom && day <= rangeTo);
              const alone = isStart && isEnd;
              const col = index % 7;
              const roundLeft = inRange && (isStart || col === 0);
              const roundRight = inRange && (isEnd || col === 6);
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={disabled}
                  onClick={() => pickDay(day)}
                  className={`relative flex h-8 items-center justify-center text-sm tabular-nums ${
                    disabled
                      ? 'cursor-default text-gray-300'
                      : isWeekend
                        ? 'text-[#E86B7A]'
                        : 'text-gray-900'
                  }`}
                >
                  {inRange && (
                    <span
                      aria-hidden
                      className={
                        alone
                          ? 'absolute inset-y-0.5 left-0.5 right-0.5 rounded-full bg-[#ECEEF2]'
                          : `absolute inset-y-0.5 bg-[#ECEEF2] ${
                              roundLeft ? 'left-0.5 rounded-l-full' : 'left-0'
                            } ${roundRight ? 'right-0.5 rounded-r-full' : 'right-0'}`
                      }
                    />
                  )}
                  <span className={`relative z-[1] ${isStart || isEnd ? 'font-semibold' : ''}`}>
                    {day.getDate()}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
            <input
              value={startInput}
              onChange={(event) => setStartInput(event.target.value)}
              onBlur={commitInputs}
              onKeyDown={(event) => {
                if (event.key === 'Enter') commitInputs();
              }}
              inputMode="numeric"
              placeholder="дд.мм.гггг"
              aria-label="Дата начала"
              className="h-9 min-w-0 flex-1 rounded-lg border border-transparent bg-[#F3F5F8] px-2 text-sm tabular-nums text-gray-900 outline-none transition-colors hover:bg-[#E6E9EE] focus:border-[#9A41FE] focus:ring-1 focus:ring-[#9A41FE]"
            />
            <span className="text-gray-300">—</span>
            <input
              value={endInput}
              onChange={(event) => setEndInput(event.target.value)}
              onBlur={commitInputs}
              onKeyDown={(event) => {
                if (event.key === 'Enter') commitInputs();
              }}
              inputMode="numeric"
              placeholder="дд.мм.гггг"
              aria-label="Дата конца"
              className="h-9 min-w-0 flex-1 rounded-lg border border-transparent bg-[#F3F5F8] px-2 text-sm tabular-nums text-gray-900 outline-none transition-colors hover:bg-[#E6E9EE] focus:border-[#9A41FE] focus:ring-1 focus:ring-[#9A41FE]"
            />
          </div>
          <button
            type="button"
            onClick={applyRange}
            disabled={!draftFrom || !draftTo}
            className="mt-3 h-9 w-full rounded-lg bg-[#9A41FE] text-sm font-semibold text-white transition-colors hover:bg-[#8A35E8] disabled:cursor-default disabled:bg-gray-200 disabled:text-gray-400"
          >
            Применить
          </button>
        </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function formatFinanceMonthHeading(date: Date): string {
  const month = date.toLocaleDateString('ru-RU', { month: 'long' });
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${date.getFullYear()}`;
}

function financeMonthKey(value: string): string {
  const date = parseFinanceDate(value);
  if (!date) return 'unknown';
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function FinanceMonthGroups<T>({
  rows,
  sourceRows,
  period,
  colSpan,
  amountSuffix,
  getDate,
  getAmount,
  rowKey,
  renderRow,
  groupMonths,
  renderMonthHeader,
}: {
  rows: T[];
  sourceRows: T[];
  period: FinancePeriod;
  colSpan: number;
  amountSuffix: string;
  getDate: (row: T) => string;
  getAmount: (row: T) => number;
  rowKey: (row: T) => string;
  renderRow: (row: T) => React.ReactNode;
  /** Группировать по месяцам даже при выбранном периоде */
  groupMonths?: boolean;
  renderMonthHeader?: (args: { key: string; title: string; total: number }) => React.ReactNode;
}) {
  const shouldGroup = groupMonths || period.kind === 'all';
  if (!shouldGroup) {
    return (
      <>
        {rows.map((row) => (
          <React.Fragment key={rowKey(row)}>{renderRow(row)}</React.Fragment>
        ))}
      </>
    );
  }

  const totals = new Map<string, number>();
  const titles = new Map<string, string>();
  for (const row of sourceRows) {
    const date = parseFinanceDate(getDate(row));
    const key = financeMonthKey(getDate(row));
    totals.set(key, (totals.get(key) ?? 0) + getAmount(row));
    if (date && !titles.has(key)) titles.set(key, formatFinanceMonthHeading(date));
  }

  let previousKey: string | null = null;
  return (
    <>
      {rows.map((row) => {
        const key = financeMonthKey(getDate(row));
        const showMonth = key !== previousKey;
        const separateFromPrevious = showMonth && previousKey !== null;
        previousKey = key;
        const title = titles.get(key) ?? 'Без даты';
        const total = totals.get(key) ?? 0;
        return (
          <React.Fragment key={rowKey(row)}>
            {showMonth ? (
              <tr data-month-heading className="border-b border-gray-100">
                <td colSpan={colSpan} className={separateFromPrevious ? 'px-4 pb-2 pt-6' : 'px-4 py-2'}>
                  {renderMonthHeader ? (
                    renderMonthHeader({ key, title, total })
                  ) : (
                    <div className="flex items-baseline gap-3">
                      <span className="text-base font-semibold text-gray-500">{title}</span>
                      <span className="whitespace-nowrap text-base font-semibold tabular-nums text-gray-900">
                        {fmtRub(total)} {amountSuffix}
                      </span>
                    </div>
                  )}
                </td>
              </tr>
            ) : null}
            {renderRow(row)}
          </React.Fragment>
        );
      })}
    </>
  );
}

const FinancePage: React.FC = () => {
  const [mainTab] = useState<'my_money' | 'bonuses'>('my_money');
  const [bufferSubTab, setBufferSubTab] = useState<'accrued' | 'spent'>('accrued');
  const [historyFilter, setHistoryFilter] = useState('expenses');
  const [period, setPeriod] = useState<FinancePeriod>({ kind: 'all' });
  const [channel, setChannel] = useState<FinanceChannelFilter>('all');
  const [mediaExpenseFilter, setMediaExpenseFilter] = useState<'all' | MediaExpenseTag>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | string>('all');
  const expenseSourceOptions =
    channel === 'wibes' ? WIBES_EXPENSE_SOURCES : EXPENSE_SOURCES;
  const [topupStatus, setTopupStatus] = useState<'all' | TopupStatus>('all');
  const [topupMethodFilter, setTopupMethodFilter] = useState<'all' | TopupMethod>('all');
  const [refundFundsFilter, setRefundFundsFilter] = useState<'all' | PendingRefundFunds>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleExpenseCount, setVisibleExpenseCount] = useState(EXPENSE_PAGE_SIZE);
  const expenseSentinelRef = useRef<HTMLDivElement>(null);
  const [visibleTopupCount, setVisibleTopupCount] = useState(EXPENSE_PAGE_SIZE);
  const topupSentinelRef = useRef<HTMLDivElement>(null);
  const isPendingRefunds = historyFilter === 'pending_refunds';
  const isTopups = historyFilter === 'topups';
  const isBufferHistory = historyFilter === 'buffer';
  const isExpenses = historyFilter === 'expenses';
  const isCampaignTopups = historyFilter === 'campaign_topups';
  const isExpiredBonuses = historyFilter === 'expired_bonuses';

  const setFinancePeriod = (next: FinancePeriod) => {
    setPeriod(next);
    setVisibleExpenseCount(EXPENSE_PAGE_SIZE);
    setVisibleTopupCount(EXPENSE_PAGE_SIZE);
  };

  const filteredRows = DEMO_EXPENSES.filter((row) => {
    if (channel !== 'all' && row.channel !== channel) return false;
    if (
      channel === 'media' &&
      mediaExpenseFilter !== 'all' &&
      row.mediaTag !== mediaExpenseFilter
    ) {
      return false;
    }
    if (sourceFilter !== 'all' && row.source !== sourceFilter) return false;
    if (!dateInPeriod(row.debitDate, period)) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      String(row.campaignId).includes(q) ||
      row.campaignName.toLowerCase().includes(q) ||
      row.campaignType.toLowerCase().includes(q) ||
      row.source.toLowerCase().includes(q) ||
      (row.documentNo == null ? 'в обработке'.includes(q) : String(row.documentNo).includes(q)) ||
      (row.mediaTag ? MEDIA_EXPENSE_TAG_LABEL[row.mediaTag].toLowerCase().includes(q) : false)
    );
  });

  const visibleExpenses = filteredRows.slice(0, visibleExpenseCount);
  const hasMoreExpenses = visibleExpenseCount < filteredRows.length;

  useEffect(() => {
    const node = expenseSentinelRef.current;
    if (!node || !hasMoreExpenses || isPendingRefunds || isTopups || isExpiredBonuses || isCampaignTopups) return;

    const loadIfNear = () => {
      const rect = node.getBoundingClientRect();
      if (rect.top <= window.innerHeight + 240) {
        setVisibleExpenseCount((count) => Math.min(count + EXPENSE_PAGE_SIZE, filteredRows.length));
      }
    };

    loadIfNear();
    window.addEventListener('scroll', loadIfNear, { passive: true });
    window.addEventListener('resize', loadIfNear);
    return () => {
      window.removeEventListener('scroll', loadIfNear);
      window.removeEventListener('resize', loadIfNear);
    };
  }, [filteredRows.length, hasMoreExpenses, isPendingRefunds, isTopups, isExpiredBonuses, isCampaignTopups, visibleExpenseCount]);
  const periodTotal = filteredRows.reduce((sum, row) => sum + row.amountRub, 0);

  const filteredCampaignTopups = DEMO_CAMPAIGN_TOPUPS.filter((row) => {
    if (channel !== 'all' && row.channel !== channel) return false;
    if (sourceFilter !== 'all' && row.source !== sourceFilter) return false;
    if (!dateInPeriod(row.date, period)) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      String(row.campaignId).includes(q) ||
      row.campaignName.toLowerCase().includes(q) ||
      row.campaignType.toLowerCase().includes(q) ||
      row.source.toLowerCase().includes(q) ||
      FINANCE_CHANNEL_LABEL[row.channel].toLowerCase().includes(q)
    );
  });
  const campaignTopupTotal = filteredCampaignTopups.reduce((sum, row) => sum + row.amountRub, 0);
  const visibleCampaignTopups = filteredCampaignTopups.slice(0, visibleExpenseCount);
  const hasMoreCampaignTopups = visibleExpenseCount < filteredCampaignTopups.length;

  useEffect(() => {
    const node = expenseSentinelRef.current;
    if (!node || !hasMoreCampaignTopups || !isCampaignTopups) return;

    const loadIfNear = () => {
      const rect = node.getBoundingClientRect();
      if (rect.top <= window.innerHeight + 240) {
        setVisibleExpenseCount((count) =>
          Math.min(count + EXPENSE_PAGE_SIZE, filteredCampaignTopups.length),
        );
      }
    };

    loadIfNear();
    window.addEventListener('scroll', loadIfNear, { passive: true });
    window.addEventListener('resize', loadIfNear);
    return () => {
      window.removeEventListener('scroll', loadIfNear);
      window.removeEventListener('resize', loadIfNear);
    };
  }, [filteredCampaignTopups.length, hasMoreCampaignTopups, isCampaignTopups, visibleExpenseCount]);

  const filteredTopups = DEMO_TOPUPS.filter((row) => {
    if (!dateInPeriod(row.date, period)) return false;
    if (topupStatus !== 'all' && row.status !== topupStatus) return false;
    if (topupMethodFilter !== 'all' && row.method !== topupMethodFilter) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const method = row.method.toLowerCase().includes(q);
    const status = TOPUP_STATUS_LABEL[row.status].toLowerCase().includes(q);
    const date = row.date.includes(q);
    const amount = String(row.amountRub).includes(q);
    const inn = row.inn.includes(q);
    return method || status || date || amount || inn;
  });
  const topupTotal = filteredTopups.reduce((sum, row) => sum + row.amountRub, 0);
  const visibleTopups = filteredTopups.slice(0, visibleTopupCount);
  const hasMoreTopups = visibleTopupCount < filteredTopups.length;

  useEffect(() => {
    const node = topupSentinelRef.current;
    if (!node || !hasMoreTopups || !isTopups) return;

    const loadIfNear = () => {
      const rect = node.getBoundingClientRect();
      if (rect.top <= window.innerHeight + 240) {
        setVisibleTopupCount((count) => Math.min(count + EXPENSE_PAGE_SIZE, filteredTopups.length));
      }
    };

    loadIfNear();
    window.addEventListener('scroll', loadIfNear, { passive: true });
    window.addEventListener('resize', loadIfNear);
    return () => {
      window.removeEventListener('scroll', loadIfNear);
      window.removeEventListener('resize', loadIfNear);
    };
  }, [filteredTopups.length, hasMoreTopups, isTopups, visibleTopupCount]);

  const filteredPendingRefunds = DEMO_PENDING_REFUNDS.filter((row) => {
    if (channel !== 'all' && row.channel !== channel) return false;
    if (refundFundsFilter !== 'all' && row.funds !== refundFundsFilter) return false;
    if (!dateInPeriod(row.finishedAt, period)) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      String(row.campaignId).includes(q) ||
      row.campaignName.toLowerCase().includes(q) ||
      row.campaignType.toLowerCase().includes(q) ||
      PENDING_REFUND_FUNDS_LABEL[row.funds].toLowerCase().includes(q)
    );
  });
  const pendingRefundTotal = filteredPendingRefunds.reduce((sum, row) => sum + row.amountRub, 0);

  const filteredBufferAccruals = DEMO_BUFFER_ACCRUALS.filter((row) => {
    if (!dateInPeriod(row.date, period)) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      row.date.includes(q) ||
      row.periodLabel.toLowerCase().includes(q) ||
      row.periodStart.includes(q) ||
      row.periodEnd.includes(q) ||
      String(row.amountRub).includes(q)
    );
  });

  const filteredExpiredBonuses = DEMO_EXPIRED_BONUSES.filter((row) => {
    if (!dateInPeriod(row.endsAt, period)) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      String(row.campaignId).includes(q.replace(/\s/g, '')) ||
      (row.campaignName?.toLowerCase().includes(q) ?? false) ||
      row.campaignType.toLowerCase().includes(q)
    );
  });

  const filteredBonuses = DEMO_BONUS_ACCRUALS.filter((row) => dateInPeriod(row.date, period));

  const filteredBufferSpends = DEMO_BUFFER_SPENDS.filter((row) => {
    if (!dateInPeriod(row.date, period)) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      row.date.includes(q) ||
      row.periodLabel.toLowerCase().includes(q) ||
      row.periodStart.includes(q) ||
      row.periodEnd.includes(q) ||
      String(row.amountRub).includes(q)
    );
  });

  const bufferSubTabClass = (active: boolean) =>
    `h-7 rounded-lg px-2.5 text-sm font-medium transition-colors ${
      active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
    }`;

  return (
    <main className="mx-auto w-full max-w-[1920px] px-6 py-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-6">
        <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-[320px]">
          <FinanceBalancesCard />
          <BalanceSpendCard />
        </aside>

        <section className="min-w-0 flex-1 rounded-2xl bg-white px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="mb-0 text-[28px] font-bold leading-tight tracking-tight text-gray-900">История операций</h1>
            <FinanceTitleHelp />
          </div>

          {mainTab === 'my_money' ? (
            <>
              <div className="mt-3 flex min-w-0 flex-wrap items-center gap-3">
                <div className="shrink-0">
                  <FinancePeriodPicker value={period} onChange={setFinancePeriod} />
                </div>
                <FinanceDropdown
                  aria-label="Тип истории"
                  value={historyFilter}
                  onChange={(value) => {
                    setHistoryFilter(value);
                    setSourceFilter('all');
                    setVisibleExpenseCount(EXPENSE_PAGE_SIZE);
                  }}
                  className="shrink-0"
                  options={[
                    { value: 'expenses', label: 'Списания по кампаниям' },
                    { value: 'campaign_topups', label: 'Пополнения кампаний' },
                    { value: 'topups', label: 'Пополнения счёта' },
                    { value: 'buffer', label: 'История баланса' },
                    { value: 'expired_bonuses', label: 'Истёкшие бонусы' },
                    { value: 'pending_refunds', label: 'Возвраты с кампаний' },
                  ]}
                />
                {isExpenses && channel === 'media' ? (
                  <FinanceDropdown
                    aria-label="Тип списания медиа"
                    value={mediaExpenseFilter}
                    onChange={(value) => {
                      setMediaExpenseFilter(value as 'all' | MediaExpenseTag);
                      setVisibleExpenseCount(EXPENSE_PAGE_SIZE);
                    }}
                    className="shrink-0"
                    options={[
                      { value: 'all', label: 'Тип списания' },
                      { value: 'pause', label: MEDIA_EXPENSE_TAG_LABEL.pause },
                      { value: 'fraud', label: MEDIA_EXPENSE_TAG_LABEL.fraud },
                    ]}
                  />
                ) : null}
                {isPendingRefunds ? (
                  <FinanceDropdown
                    aria-label="Тип возврата"
                    value={refundFundsFilter}
                    onChange={(value) => setRefundFundsFilter(value as 'all' | PendingRefundFunds)}
                    className="shrink-0"
                    options={[
                      { value: 'all', label: 'Тип возврата' },
                      { value: 'balance', label: PENDING_REFUND_FUNDS_LABEL.balance },
                      { value: 'bonuses', label: PENDING_REFUND_FUNDS_LABEL.bonuses },
                    ]}
                  />
                ) : isTopups ? (
                  <>
                    <div className="shrink-0">
                      <TopupStatusFilter
                        value={topupStatus}
                        onChange={(value) => {
                          setTopupStatus(value);
                          setVisibleTopupCount(EXPENSE_PAGE_SIZE);
                        }}
                      />
                    </div>
                    <FinanceDropdown
                      aria-label="Способ оплаты"
                      value={topupMethodFilter}
                      onChange={(value) => {
                        setTopupMethodFilter(value as 'all' | TopupMethod);
                        setVisibleTopupCount(EXPENSE_PAGE_SIZE);
                      }}
                      className="shrink-0"
                      options={[
                        { value: 'all', label: 'Способ оплаты' },
                        ...TOPUP_METHODS.map((method) => ({ value: method, label: method })),
                      ]}
                    />
                  </>
                ) : null}
                {isExpenses || isCampaignTopups ? (
                  <>
                    <div
                      className="inline-flex h-8 shrink-0 items-center gap-0.5 rounded-lg bg-[#F3F5F8] p-0.5"
                      role="tablist"
                      aria-label="Канал"
                    >
                      {FINANCE_CHANNELS.map((item) => {
                        const active = channel === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            className={`h-7 rounded-md px-2.5 text-sm font-medium transition-colors ${
                              active
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:bg-[#E6E9EE] hover:text-gray-900'
                            }`}
                            onClick={() => {
                              setChannel(item.id);
                              if (item.id !== 'media') setMediaExpenseFilter('all');
                              setSourceFilter('all');
                              setVisibleExpenseCount(EXPENSE_PAGE_SIZE);
                            }}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                    <div
                      className="inline-flex h-8 shrink-0 items-center gap-0.5 rounded-lg bg-[#F3F5F8] p-0.5"
                      role="tablist"
                      aria-label={isCampaignTopups ? 'Источник' : 'Источник списания'}
                    >
                      {['all', ...(isCampaignTopups ? EXPENSE_SOURCES : expenseSourceOptions)].map((source) => {
                        const active = sourceFilter === source;
                        return (
                          <button
                            key={source}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            className={`h-7 rounded-md px-2.5 text-sm font-medium transition-colors ${
                              active
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:bg-[#E6E9EE] hover:text-gray-900'
                            }`}
                            onClick={() => {
                              setSourceFilter(source);
                              setVisibleExpenseCount(EXPENSE_PAGE_SIZE);
                            }}
                          >
                            {source === 'all' ? 'Все' : source}
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : isBufferHistory ? (
                  <div
                    className="inline-flex h-8 w-fit shrink-0 items-center gap-0.5 rounded-lg bg-[#F2F2F7] p-0.5"
                    role="tablist"
                    aria-label="Операции баланса"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={bufferSubTab === 'accrued'}
                      className={bufferSubTabClass(bufferSubTab === 'accrued')}
                      onClick={() => setBufferSubTab('accrued')}
                    >
                      Начисления
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={bufferSubTab === 'spent'}
                      className={bufferSubTabClass(bufferSubTab === 'spent')}
                      onClick={() => setBufferSubTab('spent')}
                    >
                      Списания
                    </button>
                  </div>
                ) : null}
                <button
                  type="button"
                  className="tooltip ml-auto inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-transparent bg-[#F3F5F8] px-3 text-sm font-medium text-gray-900 transition-colors hover:bg-[#E6E9EE]"
                >
                  <Download className="h-3.5 w-3.5 text-gray-500" aria-hidden />
                  Excel
                  <span className="tooltip-text">Скачать</span>
                </button>
              </div>
              <div className="relative mt-3 w-full">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  aria-hidden
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setVisibleExpenseCount(EXPENSE_PAGE_SIZE);
                    setVisibleTopupCount(EXPENSE_PAGE_SIZE);
                  }}
                  placeholder="Поиск"
                  className="h-10 w-full rounded-xl border border-transparent bg-[#F3F5F8] py-2 pl-9 pr-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 hover:bg-[#E6E9EE] focus:border-[#9A41FE] focus:ring-1 focus:ring-[#9A41FE]"
                />
              </div>

              {isBufferHistory ? (
                <>
              <div className="mt-5 overflow-x-auto">
                {bufferSubTab === 'accrued' ? (
                  <table className="w-full min-w-[520px] border-separate border-spacing-0 text-left text-sm">
                    <thead>
                      <tr className={FINANCE_TABLE_HEAD_ROW_CLASS}>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">Дата начисления</th>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">Сумма</th>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">За период</th>
                      </tr>
                    </thead>
                    <tbody className={FINANCE_TABLE_BODY_CLASS}>
                      <FinanceMonthGroups
                        rows={filteredBufferAccruals}
                        sourceRows={filteredBufferAccruals}
                        period={period}
                        colSpan={3}
                        amountSuffix="₽"
                        groupMonths
                        renderMonthHeader={({ key, title, total }) => (
                          <BufferMonthStatsBlock
                            monthKey={key}
                            title={title}
                            total={total}
                            variant="accrued"
                          />
                        )}
                        getDate={(row) => row.date}
                        getAmount={(row) => row.amountRub}
                        rowKey={(row) => row.id}
                        renderRow={(row) => (
                        <tr className="border-b border-gray-50 last:border-0">
                          <td className="whitespace-nowrap px-4 py-2 tabular-nums text-gray-900">
                            {row.date}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 font-semibold tabular-nums text-gray-900">
                            {fmtRub(row.amountRub)} ₽
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 text-gray-500">
                            {row.periodLabel}
                          </td>
                        </tr>
                        )}
                      />
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full min-w-[520px] border-separate border-spacing-0 text-left text-sm">
                    <thead>
                      <tr className={FINANCE_TABLE_HEAD_ROW_CLASS}>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">Дата списания</th>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">Сумма</th>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">Комиссия</th>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">За период</th>
                      </tr>
                    </thead>
                    <tbody className={FINANCE_TABLE_BODY_CLASS}>
                      <FinanceMonthGroups
                        rows={filteredBufferSpends}
                        sourceRows={filteredBufferSpends}
                        period={period}
                        colSpan={4}
                        amountSuffix="₽"
                        groupMonths
                        renderMonthHeader={({ key, title, total }) => (
                          <BufferMonthStatsBlock
                            monthKey={key}
                            title={title}
                            total={total}
                            variant="spent"
                          />
                        )}
                        getDate={(row) => row.date}
                        getAmount={(row) => row.amountRub}
                        rowKey={(row) => row.id}
                        renderRow={(row) => (
                        <tr className="border-b border-gray-50 last:border-0">
                          <td className="whitespace-nowrap px-4 py-2 tabular-nums text-gray-900">
                            {row.date}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 font-semibold tabular-nums text-gray-900">
                            {fmtRub(row.amountRub)} ₽
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 tabular-nums text-gray-900">
                            {row.commissionPercent}%
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 text-gray-500">
                            {row.periodLabel}
                          </td>
                        </tr>
                        )}
                      />
                    </tbody>
                  </table>
                )}
              </div>
                </>
              ) : (
                <>
              {period.kind === 'range' && !isExpiredBonuses ? (
                <p className="mt-4 text-lg text-gray-600">
                  {isPendingRefunds ? (
                    <>
                      Сумма возвратных средств:{' '}
                      <span className="font-semibold tabular-nums text-gray-900">
                        {fmtRub(pendingRefundTotal)} ₽
                      </span>
                    </>
                  ) : isTopups ? (
                    <>
                      Пополнено за период:{' '}
                      <span className="font-semibold tabular-nums text-gray-900">
                        {fmtRub(topupTotal)} ₽
                      </span>
                    </>
                  ) : isCampaignTopups ? (
                    <>
                      Пополнено кампаний за период:{' '}
                      <span className="font-semibold tabular-nums text-gray-900">
                        {fmtRub(campaignTopupTotal)} ₽
                      </span>
                    </>
                  ) : (
                    <>
                      {formatFinanceDay(period.from)}
                      {startOfDay(period.from).getTime() !== startOfDay(period.to).getTime()
                        ? ` - ${formatFinanceDay(period.to)}`
                        : ''}
                      :{' '}
                      <span className="font-semibold tabular-nums text-gray-900">
                        {fmtRub(periodTotal)} ₽
                      </span>
                    </>
                  )}
                </p>
              ) : null}

              <div className={`${period.kind === 'range' ? 'mt-4' : 'mt-5'} overflow-x-auto`}>
                {isPendingRefunds ? (
                  <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm">
                    <thead>
                      <tr className={FINANCE_TABLE_HEAD_ROW_CLASS}>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">ID кампании</th>
                        <th className="min-w-[200px] px-3 py-2 text-sm font-medium">Кампания, Тип</th>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">Дата завершения</th>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">Сумма к возврату, ₽</th>
                        <th className="min-w-[160px] px-3 py-2 text-sm font-medium">
                          <span className="block">Статус</span>
                          <span className="mt-0.5 block text-[11px] font-normal leading-snug text-gray-400">
                            Возврат ≈ 5–7 дней
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className={FINANCE_TABLE_BODY_CLASS}>
                      <FinanceMonthGroups
                        rows={filteredPendingRefunds}
                        sourceRows={filteredPendingRefunds}
                        period={period}
                        colSpan={5}
                        amountSuffix="₽"
                        getDate={(row) => row.finishedAt}
                        getAmount={(row) => row.amountRub}
                        rowKey={(row) => String(row.campaignId)}
                        renderRow={(row) => (
                        <tr className="border-b border-gray-50 last:border-0">
                          <td className="whitespace-nowrap px-4 py-2 tabular-nums text-gray-900">
                            {row.campaignId}
                          </td>
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              className="text-left text-sm font-medium text-gray-900 hover:underline"
                            >
                              {row.campaignName}
                            </button>
                            <p className="mb-0 mt-0.5 text-xs leading-snug text-gray-500">{row.campaignType}</p>
                            <span className="mt-1.5 inline-flex rounded-md bg-[#F3F5F8] px-2 py-0.5 text-xs font-medium text-gray-600">
                              {PENDING_REFUND_FUNDS_LABEL[row.funds]}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 tabular-nums text-gray-900">
                            {row.finishedAt}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 font-medium tabular-nums text-gray-900">
                            {fmtRub(row.amountRub)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2">
                            <RefundStatusBadge status={row.status} />
                          </td>
                        </tr>
                        )}
                      />
                    </tbody>
                  </table>
                ) : isTopups ? (
                  <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
                    <thead>
                      <tr className={FINANCE_TABLE_HEAD_ROW_CLASS}>
                        <th className="px-3 py-2 text-sm font-medium">Дата оплаты</th>
                        <th className="px-3 py-2 text-sm font-medium">Сумма, ₽</th>
                        <th className="px-3 py-2 text-sm font-medium">ИНН плательщика</th>
                        <th className="px-3 py-2 text-sm font-medium">Способ оплаты</th>
                        <th className="px-3 py-2 text-sm font-medium">Статус</th>
                      </tr>
                    </thead>
                    <tbody className={FINANCE_TABLE_BODY_CLASS}>
                      {visibleTopups.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                            Ничего не найдено
                          </td>
                        </tr>
                      ) : (
                        <FinanceMonthGroups
                          rows={visibleTopups}
                          sourceRows={filteredTopups}
                          period={period}
                          colSpan={5}
                          amountSuffix="₽"
                          getDate={(row) => row.date}
                          getAmount={(row) => row.amountRub}
                          rowKey={(row) => row.id}
                          renderRow={(row) => (
                          <tr className="border-b border-gray-50 last:border-0">
                            <td className="whitespace-nowrap px-4 py-2 tabular-nums text-gray-900">
                              {row.date}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2 tabular-nums text-gray-900">
                              {fmtRub(row.amountRub)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2 tabular-nums text-gray-900">
                              {row.inn}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2 text-gray-900">
                              <TopupMethodLabel method={row.method} />
                            </td>
                            <td className="whitespace-nowrap px-4 py-2">
                              <TopupStatusBadge status={row.status} />
                            </td>
                          </tr>
                          )}
                        />
                      )}
                    </tbody>
                  </table>
                ) : isExpiredBonuses ? (
                  <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
                    <thead>
                      <tr className={FINANCE_TABLE_HEAD_ROW_CLASS}>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">Конец действия</th>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">Сумма, B</th>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">ID кампании</th>
                        <th className="min-w-[220px] px-3 py-2 text-sm font-medium">Кампания, тип</th>
                      </tr>
                    </thead>
                    <tbody className={FINANCE_TABLE_BODY_CLASS}>
                      {filteredExpiredBonuses.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                            Ничего не найдено
                          </td>
                        </tr>
                      ) : (
                        filteredExpiredBonuses.map((row) => (
                          <tr key={row.id} className="border-b border-gray-50 last:border-0">
                            <td className="whitespace-nowrap px-4 py-2 tabular-nums text-gray-900">
                              {row.endsAt}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2 tabular-nums text-gray-900">
                              {fmtRub(row.amountB)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2 tabular-nums text-gray-900">
                              {fmtRub(row.campaignId)}
                            </td>
                            <td className="px-4 py-2">
                              {row.campaignName ? (
                                <button
                                  type="button"
                                  className="text-left text-sm font-medium text-gray-900 hover:underline"
                                >
                                  {row.campaignName}
                                </button>
                              ) : null}
                              <p
                                className={`${row.campaignName ? 'mt-1' : ''} text-xs leading-snug text-gray-500`}
                              >
                                {row.campaignType}
                              </p>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                ) : isCampaignTopups ? (
                  <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm">
                    <thead>
                      <tr className={FINANCE_TABLE_HEAD_ROW_CLASS}>
                        <th className="min-w-[200px] px-3 py-2 text-sm font-medium">Кампания</th>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">Дата пополнения</th>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">Источник</th>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">Сумма</th>
                      </tr>
                    </thead>
                    <tbody className={FINANCE_TABLE_BODY_CLASS}>
                      {visibleCampaignTopups.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                            Ничего не найдено
                          </td>
                        </tr>
                      ) : (
                        <FinanceMonthGroups
                          rows={visibleCampaignTopups}
                          sourceRows={filteredCampaignTopups}
                          period={period}
                          colSpan={4}
                          amountSuffix="₽"
                          getDate={(row) => row.date}
                          getAmount={(row) => row.amountRub}
                          rowKey={(row) => row.id}
                          renderRow={(row) => (
                            <tr className="border-b border-gray-50 last:border-0">
                              <td className="px-4 py-2">
                                <button
                                  type="button"
                                  className="text-left text-sm font-medium text-gray-900 hover:underline"
                                >
                                  {row.campaignName}
                                </button>
                                <p className="mb-0 mt-0.5 text-xs leading-snug text-gray-500">
                                  <span className="tabular-nums">{row.campaignId}</span>
                                  {' · '}
                                  {FINANCE_CHANNEL_LABEL[row.channel]}
                                </p>
                              </td>
                              <td className="whitespace-nowrap px-4 py-2 tabular-nums text-gray-900">
                                {row.date}
                              </td>
                              <td className="whitespace-nowrap px-4 py-2 text-gray-900">
                                <ExpenseSourceLabel source={row.source} />
                              </td>
                              <td className="whitespace-nowrap px-4 py-2 tabular-nums text-gray-900">
                                {fmtRub(row.amountRub)} ₽
                              </td>
                            </tr>
                          )}
                        />
                      )}
                    </tbody>
                  </table>
                ) : channel === 'wibes' ? (
                  <table className="w-full min-w-[860px] border-separate border-spacing-0 text-left text-sm">
                    <thead>
                      <tr className={FINANCE_TABLE_HEAD_ROW_CLASS}>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">ID кампании</th>
                        <th className="min-w-[220px] px-3 py-2 text-sm font-medium">Кампания, Тип</th>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">
                          <span className="inline-flex items-center gap-1">
                            Дата списания
                            <span className="tooltip inline-flex">
                              <HelpCircle className="h-3.5 w-3.5 text-gray-400" aria-label="Подсказка" />
                              <span className="tooltip-text !bottom-auto !left-0 !top-full !mt-1.5 !w-max !max-w-[16rem] !translate-x-0 !whitespace-normal !px-2.5 !py-2 !text-left !font-normal !leading-snug">
                                Дата фактического выставления платежа
                              </span>
                            </span>
                          </span>
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">Источник списания</th>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">Сумма, ₽</th>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">№ документа</th>
                      </tr>
                    </thead>
                    <tbody className={FINANCE_TABLE_BODY_CLASS}>
                      {visibleExpenses.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                            <p className="font-medium text-gray-700">Ничего не найдено</p>
                            <p className="mt-1.5 text-gray-500">
                              Копируйте номер документа, а не номер УПД, чтобы найти документ
                            </p>
                          </td>
                        </tr>
                      ) : (
                        <FinanceMonthGroups
                          rows={visibleExpenses}
                          sourceRows={filteredRows}
                          period={period}
                          colSpan={6}
                          amountSuffix="₽"
                          getDate={(row) => row.debitDate}
                          getAmount={(row) => row.amountRub}
                          rowKey={(row) => row.id ?? `${row.campaignId}-${row.debitDate}-${row.source}-${row.amountRub}`}
                          renderRow={(row) => (
                        <tr className="border-b border-gray-50 last:border-0">
                          <td className="whitespace-nowrap px-4 py-2 tabular-nums text-gray-900">
                            {row.campaignId}
                          </td>
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              className="max-w-[280px] truncate text-left text-sm font-medium text-gray-900 hover:underline"
                              title={row.campaignName}
                            >
                              {row.campaignName}
                            </button>
                            <p className="mb-0 mt-0.5 text-xs leading-snug text-gray-500">{row.campaignType}</p>
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 tabular-nums text-gray-900">
                            {row.debitDate}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 text-gray-900">{row.source}</td>
                          <td className="whitespace-nowrap px-4 py-2 text-gray-900">
                            <span className="tabular-nums">{fmtRub(row.amountRub)}</span>
                            {row.isCorrection ? (
                              <span className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                                Корректировка
                                <span className="tooltip inline-flex">
                                  <HelpCircle className="h-3 w-3 text-gray-400" aria-label="Подсказка" />
                                  <span className="tooltip-text !bottom-auto !left-0 !top-full !mt-1.5 !w-max !max-w-[14rem] !translate-x-0 !whitespace-normal !px-2.5 !py-2 !text-left !font-normal !leading-snug">
                                    Сумма скорректирована после пересчёта
                                  </span>
                                </span>
                              </span>
                            ) : null}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 tabular-nums text-gray-900">
                            <CopyDocumentNo value={row.documentNo} />
                          </td>
                        </tr>
                          )}
                        />
                      )}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm">
                    <thead>
                      <tr className={FINANCE_TABLE_HEAD_ROW_CLASS}>
                        <th className="min-w-[200px] px-3 py-2 text-sm font-medium">Кампания</th>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">
                          <span className="tooltip text-sm font-medium text-black">
                            Дата списания
                            <span className="tooltip-text !bottom-auto !left-0 !top-full !mt-1.5 !w-max !max-w-[16rem] !translate-x-0 !whitespace-normal !px-2.5 !py-2 !text-left !font-normal !leading-snug">
                              Дата фактического выставления платежа
                            </span>
                          </span>
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">Источник списания</th>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">Сумма</th>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">Номер документа</th>
                      </tr>
                    </thead>
                    <tbody className={FINANCE_TABLE_BODY_CLASS}>
                      {visibleExpenses.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                            <p className="font-medium text-gray-700">Ничего не найдено</p>
                            <p className="mt-1.5 text-gray-500">
                              Копируйте номер документа, а не номер УПД, чтобы найти документ
                            </p>
                          </td>
                        </tr>
                      ) : (
                        <FinanceMonthGroups
                          rows={visibleExpenses}
                          sourceRows={filteredRows}
                          period={period}
                          colSpan={5}
                          amountSuffix="₽"
                          getDate={(row) => row.debitDate}
                          getAmount={(row) => row.amountRub}
                          rowKey={(row) => row.id ?? `${row.campaignId}-${row.documentNo}`}
                          renderRow={(row) => (
                        <tr className="border-b border-gray-50 last:border-0">
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              className="text-left text-sm font-medium text-gray-900 hover:underline"
                            >
                              {row.campaignName}
                            </button>
                            <p className="mb-0 mt-0.5 text-xs leading-snug text-gray-500">
                              <span className="tabular-nums">{row.campaignId}</span>
                              {' · '}
                              {FINANCE_CHANNEL_LABEL[row.channel]}
                            </p>
                            {row.mediaTag ? (
                              <span
                                className={`mt-1.5 inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${MEDIA_EXPENSE_TAG_TONE[row.mediaTag]}`}
                              >
                                {MEDIA_EXPENSE_TAG_LABEL[row.mediaTag]}
                              </span>
                            ) : null}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 tabular-nums text-gray-900">
                            {row.debitDate}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 text-gray-900">
                            <ExpenseSourceLabel source={row.source} />
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 tabular-nums text-gray-900">
                            {fmtRub(row.amountRub)} ₽
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 tabular-nums text-gray-900">
                            <CopyDocumentNo value={row.documentNo} />
                          </td>
                        </tr>
                          )}
                        />
                      )}
                    </tbody>
                  </table>
                )}
              </div>
              {!isPendingRefunds && !isTopups && !isExpiredBonuses && (isCampaignTopups ? hasMoreCampaignTopups : hasMoreExpenses) ? (
                <div ref={expenseSentinelRef} className="h-px" aria-hidden />
              ) : null}
              {isTopups && hasMoreTopups ? (
                <div ref={topupSentinelRef} className="h-px" aria-hidden />
              ) : null}
                </>
              )}
            </>
          ) : (
            <>
              <div className="mt-5 flex min-w-0 flex-nowrap items-center gap-3">
                <div className="shrink-0">
                  <FinancePeriodPicker value={period} onChange={setFinancePeriod} />
                </div>
                <button
                  type="button"
                  className="tooltip ml-auto inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-transparent bg-[#F3F5F8] px-3 text-sm font-medium text-gray-900 transition-colors hover:bg-[#E6E9EE]"
                >
                  <Download className="h-3.5 w-3.5 text-gray-500" aria-hidden />
                  Excel
                  <span className="tooltip-text">Скачать</span>
                </button>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left text-sm">
                  <thead>
                    <tr className={FINANCE_TABLE_HEAD_ROW_CLASS}>
                      <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">Дата начисления</th>
                      <th className="min-w-[220px] px-3 py-2 text-sm font-medium">Источник</th>
                      <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">Сумма, B</th>
                      <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">Тип</th>
                      <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">Сгорают до</th>
                    </tr>
                  </thead>
                  <tbody className={FINANCE_TABLE_BODY_CLASS}>
                    <FinanceMonthGroups
                      rows={filteredBonuses}
                      sourceRows={filteredBonuses}
                      period={period}
                      colSpan={5}
                      amountSuffix="B"
                      getDate={(row) => row.date}
                      getAmount={(row) => row.amountB}
                      rowKey={(row) => row.id}
                      renderRow={(row) => (
                      <tr className="border-b border-gray-50 last:border-0">
                        <td className="whitespace-nowrap px-4 py-2 tabular-nums text-gray-900">
                          {row.date}
                        </td>
                        <td className="px-4 py-2 text-gray-900">{row.source}</td>
                        <td className="whitespace-nowrap px-4 py-2 font-semibold tabular-nums text-gray-900">
                          {fmtRub(row.amountB)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 text-gray-900">
                          {row.kind === 'permanent' ? 'Несгораемые' : 'Сгораемые'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 tabular-nums text-gray-500">
                          {row.expiresAt ?? '—'}
                        </td>
                      </tr>
                      )}
                    />
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
};

export default FinancePage;
