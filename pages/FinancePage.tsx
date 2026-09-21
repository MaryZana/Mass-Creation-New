import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  Download,
  HelpCircle,
  HelpVideoIcon,
  Plus,
  Search,
  X,
} from '../components/Icons';
import { UnifiedAccountInstructionModal } from '../components/UnifiedAccountInstructionModal';
import { useDismissibleHoverTooltip, useFeatureVideoGuide } from '../components/FeatureVideoGuide';

const UNIFIED_ACCOUNT_VIDEO_SRC = '/videos/help-instruction-demo.mp4';

const FINANCE_INSTRUCTION_ITEMS = [
  {
    id: 'unified-account',
    title: 'Как работает счёт и баланс продвижения',
    duration: '4:12',
    src: UNIFIED_ACCOUNT_VIDEO_SRC,
    previewClass: 'from-[#E0D4FF] to-[#9A41FE]',
  },
  {
    id: 'refunds',
    title: 'Пополнение счёта и возврат средств',
    duration: '5:05',
    src: UNIFIED_ACCOUNT_VIDEO_SRC,
    previewClass: 'from-[#CFE4FF] to-[#3D7AE8]',
  },
] as const;

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
  'aria-label': ariaLabel,
}: {
  value: string;
  onChange?: (value: string) => void;
  options: FinanceDropdownOption[];
  className?: string;
  menuClassName?: string;
  'aria-label'?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((opt) => opt.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
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
        className={`inline-flex h-10 w-full items-center justify-between gap-2 rounded-xl border bg-white px-3 text-sm font-medium text-gray-900 transition-colors hover:border-gray-300 ${
          open ? 'border-gray-400' : 'border-gray-200'
        }`}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          className={`absolute left-0 top-full z-40 mt-1.5 min-w-full overflow-hidden rounded-xl border border-gray-100 bg-white py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)] ${menuClassName}`}
          role="listbox"
          aria-label={ariaLabel}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <React.Fragment key={opt.value}>
                {opt.dividerBefore ? <div className="my-1.5 border-t border-gray-100" role="separator" /> : null}
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange?.(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${
                    isSelected ? 'font-medium text-[#9A41FE]' : 'text-gray-900'
                  }`}
                >
                  <span className="flex w-4 shrink-0 justify-center">
                    {isSelected ? <Check className="h-4 w-4 text-[#9A41FE]" aria-hidden /> : null}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{opt.label}</span>
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
        </div>
      ) : null}
    </div>
  );
}

function FinanceTitleHelp() {
  const { openGuide, modal: videoModal, isOpen: guideOpen } = useFeatureVideoGuide();
  const tip = useDismissibleHoverTooltip(guideOpen);
  const firstGuide = FINANCE_INSTRUCTION_ITEMS[0];

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
        <HelpVideoIcon />
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

function FinanceInstructionsMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { openGuide, modal: videoModal } = useFeatureVideoGuide();

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {videoModal}
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#F2F2F7] px-3 text-sm font-medium text-gray-900 transition-colors hover:bg-[#E8E8ED]"
      >
        <BookOpen className="h-4 w-4 shrink-0 text-gray-900" aria-hidden />
        Инструкции
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-[70] pt-1.5">
          <div
            className="w-[280px] overflow-hidden rounded-xl border border-gray-100 bg-white py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
            role="menu"
            aria-label="Видеоинструкции"
          >
            {FINANCE_INSTRUCTION_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  openGuide({
                    title: item.title,
                    videoSrc: item.src,
                    description: `Видеоинструкция · ${item.duration}`,
                  });
                }}
                className="flex w-full items-center gap-2.5 px-2.5 py-1.5 text-left transition-colors hover:bg-gray-50"
              >
                <span
                  className={`relative flex h-9 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br ${item.previewClass}`}
                  aria-hidden
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-black/35">
                    <svg viewBox="0 0 24 24" className="ml-px h-2 w-2 text-white" fill="currentColor">
                      <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l10.5-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14Z" />
                    </svg>
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-[12px] font-medium leading-snug text-gray-900">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block text-[10px] tabular-nums text-gray-400">{item.duration}</span>
                </span>
              </button>
            ))}
            <div className="mt-1 border-t border-gray-100 px-2.5 pt-1.5 pb-0.5">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  navigate('/help#help-video-heading');
                }}
                className="w-full rounded-lg px-2 py-1.5 text-left text-[12px] font-semibold text-[#007AFF] transition-colors hover:bg-[#F0F7FF]"
              >
                Все инструкции
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const fmtRub = (n: number) =>
  new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n);

const UNIFIED_ACCOUNT_RUB = 124_913;
const UNIFIED_BALANCE_RUB = 0;
const PROMO_BONUS_AMOUNT = 18_446;

type ExpenseRow = {
  campaignId: number;
  campaignName: string;
  campaignType: string;
  debitDate: string;
  source: string;
  amountRub: number;
  documentNo: number;
};

const DEMO_EXPENSES: ExpenseRow[] = [
  {
    campaignId: 29_310_872,
    campaignName: '!!mCPM jivaya не удалять',
    campaignType: 'Ручная ставка • За показы (CPM)',
    debitDate: '11.08.26',
    source: 'Промо бонусы',
    amountRub: 1,
    documentNo: 0,
  },
];

type PendingRefundStatus = 'sent' | 'not_sent';

type PendingRefundRow = {
  campaignId: number;
  campaignName: string;
  campaignType: string;
  finishedAt: string;
  amountRub: number;
  status: PendingRefundStatus;
};

const DEMO_PENDING_REFUNDS: PendingRefundRow[] = [
  {
    campaignId: 28_441_102,
    campaignName: 'Шапка зимняя — CPC поиск',
    campaignType: 'Единая ставка • За клики (CPC)',
    finishedAt: '02.09.26',
    amountRub: 4_850,
    status: 'not_sent',
  },
  {
    campaignId: 27_902_551,
    campaignName: 'Майка белая автобиддер',
    campaignType: 'Ручная ставка • За показы (CPM)',
    finishedAt: '28.08.26',
    amountRub: 12_340,
    status: 'sent',
  },
  {
    campaignId: 26_118_774,
    campaignName: 'Платье летнее — рекомендации',
    campaignType: 'Единая ставка • За клики (CPC)',
    finishedAt: '15.08.26',
    amountRub: 2_190,
    status: 'not_sent',
  },
  {
    campaignId: 25_667_330,
    campaignName: 'Кроссовки Run Pro',
    campaignType: 'Ручная ставка • За клики (CPC)',
    finishedAt: '09.08.26',
    amountRub: 7_600,
    status: 'sent',
  },
];

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
  inCampaignsRub: number;
  spentOnPromoRub: number;
  bufferLeftRub: number;
};

type BufferSpendRow = {
  id: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  amountRub: number;
  deductedFromWbPartner: boolean;
  deductOnLabel?: string;
};

const DEMO_BUFFER_ACCRUALS: BufferAccrualRow[] = [
  {
    id: 'w1',
    periodLabel: '8–14 сентября',
    periodStart: '08.09.26',
    periodEnd: '14.09.26',
    weekTotalRub: 12_000,
    tuesdayRub: 9_000,
    thursdayRub: 3_000,
    weeksAvgLabel: '(−8 400 + −15 200 + −12 400) ÷ 3',
    inCampaignsRub: 4_500,
    spentOnPromoRub: 2_800,
    bufferLeftRub: 4_700,
  },
  {
    id: 'w2',
    periodLabel: '1–7 сентября',
    periodStart: '01.09.26',
    periodEnd: '07.09.26',
    weekTotalRub: 10_400,
    tuesdayRub: 7_800,
    thursdayRub: 2_600,
    weeksAvgLabel: '(−6 100 + −11 900 + −13 200) ÷ 3',
    inCampaignsRub: 3_900,
    spentOnPromoRub: 2_200,
    bufferLeftRub: 4_300,
  },
  {
    id: 'w3',
    periodLabel: '25–31 августа',
    periodStart: '25.08.26',
    periodEnd: '31.08.26',
    weekTotalRub: 8_800,
    tuesdayRub: 6_600,
    thursdayRub: 2_200,
    weeksAvgLabel: '(−4 200 + −9 800 + −12 400) ÷ 3',
    inCampaignsRub: 3_200,
    spentOnPromoRub: 1_900,
    bufferLeftRub: 3_700,
  },
  {
    id: 'w4',
    periodLabel: '18–24 августа',
    periodStart: '18.08.26',
    periodEnd: '24.08.26',
    weekTotalRub: 9_600,
    tuesdayRub: 7_200,
    thursdayRub: 2_400,
    weeksAvgLabel: '(−5 100 + −10 200 + −13 500) ÷ 3',
    inCampaignsRub: 3_600,
    spentOnPromoRub: 2_100,
    bufferLeftRub: 3_900,
  },
];

const DEMO_BUFFER_SPENDS: BufferSpendRow[] = [
  {
    id: 'sw1',
    periodLabel: '8–14 сентября',
    periodStart: '08.09.26',
    periodEnd: '14.09.26',
    amountRub: 7_300,
    deductedFromWbPartner: true,
  },
  {
    id: 'sw2',
    periodLabel: '1–7 сентября',
    periodStart: '01.09.26',
    periodEnd: '07.09.26',
    amountRub: 4_120,
    deductedFromWbPartner: true,
  },
  {
    id: 'sw3',
    periodLabel: '25–31 августа',
    periodStart: '25.08.26',
    periodEnd: '31.08.26',
    amountRub: 2_850,
    deductedFromWbPartner: false,
    deductOnLabel: '5 сентября',
  },
  {
    id: 'sw4',
    periodLabel: '18–24 августа',
    periodStart: '18.08.26',
    periodEnd: '24.08.26',
    amountRub: 5_640,
    deductedFromWbPartner: true,
  },
];

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
}: {
  row: BufferAccrualRow;
  onClose: () => void;
}) {
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
        className="relative max-h-[min(92vh,900px)] w-full max-w-[720px] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="buffer-scheme-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="Закрыть"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>

        <p className="text-xs font-medium text-gray-500">{row.periodLabel}</p>
        <p id="buffer-scheme-title" className="mt-1 pr-10 text-sm font-semibold text-gray-900">
          К начислению буфера на этой неделе:
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
          {fmtRub(row.weekTotalRub)} ₽
        </p>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          Буфер равен средней сумме в графе «Итого к оплате» в{' '}
          <button type="button" className="font-medium text-[#007AFF] hover:underline">
            финансовых отчётах
          </button>{' '}
          за последние 3 недели.
        </p>
        <p className="mt-1 font-mono text-xs tabular-nums text-gray-500">{row.weeksAvgLabel}</p>

        <div className="mt-5 rounded-xl bg-[#F8F8FB] p-4 ring-1 ring-black/[0.04]">
          <div className="flex items-start gap-3">
            <CoinStackIcon className="mt-0.5 h-8 w-8 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">Остаток буфера</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">
                Начисляем буфер 2 раза в неделю: <span className="font-medium text-gray-900">75%</span> — во
                вторник, и <span className="font-medium text-gray-900">25%</span> — в четверг
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              {
                value: `${fmtRub(row.tuesdayRub)} ₽`,
                label: 'Буфер во вторник (75%)',
                tone: 'neutral' as const,
              },
              {
                value: `+ ${fmtRub(row.thursdayRub)} ₽`,
                label: 'Буфер в четверг (25%)',
                tone: 'neutral' as const,
              },
              {
                value: `− ${fmtRub(row.inCampaignsRub)} ₽`,
                label: 'В бюджетах кампаний',
                tone: 'neutral' as const,
              },
              {
                value: `− ${fmtRub(row.spentOnPromoRub)} ₽`,
                label: 'Потрачено на продвижение',
                tone: 'neutral' as const,
              },
              {
                value: `= ${fmtRub(row.bufferLeftRub)} ₽`,
                label: 'Осталось на буфере',
                tone: 'good' as const,
              },
            ].map((item) => (
              <div key={item.label} className="min-w-0">
                <p
                  className={`text-sm font-bold tabular-nums ${
                    item.tone === 'good' ? 'text-emerald-600' : 'text-gray-900'
                  }`}
                >
                  {item.value}
                </p>
                <p className="mt-1 text-[11px] leading-snug text-gray-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
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

function UnifiedAccountBalancePopover({
  accountRub,
  balanceRub,
  onOpenInstruction,
  onOpenBufferCalc,
}: {
  accountRub: number;
  balanceRub: number;
  onOpenInstruction: () => void;
  onOpenBufferCalc: () => void;
}) {
  return (
    <div className="absolute left-0 top-full z-30 pt-1" role="tooltip">
      <div className="w-[340px] rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
        <p className="text-sm text-gray-600">
          Мои деньги:{' '}
          <span className="font-bold tabular-nums text-gray-900">{fmtRub(accountRub)} ₽</span>
        </p>
        <p className="mt-1 text-sm text-gray-600">
          Буфер:{' '}
          <span className="font-bold tabular-nums text-gray-900">{fmtRub(balanceRub)} ₽</span>
        </p>
        <button
          type="button"
          onClick={onOpenBufferCalc}
          className="mt-4 flex w-full items-center justify-center whitespace-nowrap rounded-xl bg-[#4B4B57] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#3d3d48]"
        >
          Расчёт буфера
        </button>
        <button
          type="button"
          onClick={onOpenInstruction}
          className="mt-2 flex w-full items-center justify-center whitespace-nowrap rounded-xl bg-[#F3F4F6] px-4 py-2.5 text-sm font-medium text-gray-800 transition-colors hover:bg-[#ECECF0]"
        >
          Инструкция по счёту продвижения
        </button>
      </div>
    </div>
  );
}

function FinanceBalancesCard() {
  const navigate = useNavigate();
  const [balanceHovered, setBalanceHovered] = useState(false);
  const [instructionOpen, setInstructionOpen] = useState(false);
  const [bufferCalcOpen, setBufferCalcOpen] = useState(false);
  const labelTip = useDismissibleHoverTooltip(instructionOpen);

  const openInstruction = () => {
    setBalanceHovered(false);
    labelTip.dismiss();
    setInstructionOpen(true);
  };

  const openBufferCalc = () => {
    setBalanceHovered(false);
    labelTip.dismiss();
    setBufferCalcOpen(true);
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.03] sm:p-5">
      {instructionOpen && (
        <UnifiedAccountInstructionModal
          videoSrc={UNIFIED_ACCOUNT_VIDEO_SRC}
          accountRub={UNIFIED_ACCOUNT_RUB}
          balanceRub={UNIFIED_BALANCE_RUB}
          promoBonusAmount={PROMO_BONUS_AMOUNT}
          onClose={() => setInstructionOpen(false)}
        />
      )}
      {bufferCalcOpen ? (
        <BufferSchemeModal row={DEMO_BUFFER_ACCRUALS[0]} onClose={() => setBufferCalcOpen(false)} />
      ) : null}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="text-sm font-medium text-gray-600">Счёт продвижения</span>
            <div
              className="relative inline-flex"
              onMouseEnter={labelTip.onMouseEnter}
              onMouseLeave={labelTip.onMouseLeave}
            >
              <button
                type="button"
                className="inline-flex cursor-help items-center justify-center transition-opacity hover:opacity-80"
                aria-label="Что такое счёт продвижения"
              >
                <HelpVideoIcon />
              </button>
              {labelTip.show ? (
                <div className="absolute left-0 top-full z-40 pt-1.5">
                  <div className="w-[17rem] rounded-xl bg-gray-900 px-3 py-2.5 text-left text-xs font-normal leading-snug text-white shadow-lg">
                    <p>
                      Основной источник, с которого вы можете пополнить кампанию. Объединяет деньги на
                      счёте и балансе. Когда пополняете кампанию, деньги сначала списываются со счёта, а
                      если суммы не хватит — с баланса.
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
                      Как работает
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/finance/top-up')}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#9A41FE] text-white transition-colors hover:bg-[#8a38e8]"
            aria-label="Пополнить счёт продвижения"
          >
            <Plus className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div
          className="relative mt-3 inline-block"
          onMouseEnter={() => setBalanceHovered(true)}
          onMouseLeave={() => setBalanceHovered(false)}
        >
          <p className="cursor-default text-[28px] font-bold leading-none tabular-nums tracking-tight text-gray-900 sm:text-[32px]">
            {fmtRub(UNIFIED_ACCOUNT_RUB)} ₽
          </p>
          {balanceHovered && (
            <UnifiedAccountBalancePopover
              accountRub={UNIFIED_ACCOUNT_RUB}
              balanceRub={UNIFIED_BALANCE_RUB}
              onOpenInstruction={openInstruction}
              onOpenBufferCalc={openBufferCalc}
            />
          )}
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-start justify-between gap-3">
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
        <p className="mt-3 text-[28px] font-bold leading-none tabular-nums tracking-tight text-gray-900 sm:text-[32px]">
          {fmtRub(PROMO_BONUS_AMOUNT)} B
        </p>
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

function BalanceSpendCard() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.03] sm:p-5">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F3E8FF] px-2.5 py-1 text-xs font-medium text-[#7C3AED]">
        Списание отложено
        <HistoryClockIcon className="h-3.5 w-3.5" />
      </span>

      <h2 className="mt-3 text-xl font-bold tracking-tight text-gray-900">Расход буфера</h2>

      <div className="mt-4 space-y-2.5 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-gray-500">За 6–13 сентября</span>
          <span className="shrink-0 tabular-nums text-gray-500">0 ₽</span>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-gray-500">Комиссия 0.001%</span>
          <span className="shrink-0 tabular-nums text-gray-500">0 ₽</span>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-medium text-gray-900">Спишем 20 сентября</span>
          <span className="shrink-0 border-b border-dotted border-gray-400 font-semibold tabular-nums text-gray-900">
            ~ 0 ₽
          </span>
        </div>
      </div>

      <button
        type="button"
        className="mt-5 flex w-full items-center justify-center rounded-xl bg-[#4B4B57] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#3d3d48]"
      >
        Изменить дату списания
      </button>
      <button
        type="button"
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F3F4F6] px-4 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-[#ECECF0] hover:text-gray-700"
      >
        <Calendar className="h-4 w-4 shrink-0" aria-hidden />
        График списаний
      </button>
    </div>
  );
}

const FinancePage: React.FC = () => {
  const [mainTab, setMainTab] = useState<'my_money' | 'buffer' | 'bonuses'>('my_money');
  const [bufferSubTab, setBufferSubTab] = useState<'accrued' | 'spent'>('spent');
  const [historyFilter, setHistoryFilter] = useState('expenses');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [paramFilter, setParamFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [bufferSearchQuery, setBufferSearchQuery] = useState('');
  const [accrualFormulaRow, setAccrualFormulaRow] = useState<BufferAccrualRow | null>(null);

  const isPendingRefunds = historyFilter === 'pending_refunds';

  const periodTotal = DEMO_EXPENSES.reduce((sum, row) => sum + row.amountRub, 0);
  const pendingRefundTotal = DEMO_PENDING_REFUNDS.reduce((sum, row) => sum + row.amountRub, 0);

  const filteredRows = DEMO_EXPENSES.filter((row) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      String(row.campaignId).includes(q) ||
      row.campaignName.toLowerCase().includes(q) ||
      row.source.toLowerCase().includes(q)
    );
  });

  const filteredPendingRefunds = DEMO_PENDING_REFUNDS.filter((row) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      String(row.campaignId).includes(q) ||
      row.campaignName.toLowerCase().includes(q) ||
      row.campaignType.toLowerCase().includes(q)
    );
  });

  const filteredBufferAccruals = DEMO_BUFFER_ACCRUALS.filter((row) => {
    if (!bufferSearchQuery.trim()) return true;
    const q = bufferSearchQuery.trim().toLowerCase();
    return (
      row.periodLabel.toLowerCase().includes(q) ||
      row.periodStart.includes(q) ||
      row.periodEnd.includes(q) ||
      row.weeksAvgLabel.toLowerCase().includes(q) ||
      String(row.weekTotalRub).includes(q)
    );
  });

  const filteredBufferSpends = DEMO_BUFFER_SPENDS.filter((row) => {
    if (!bufferSearchQuery.trim()) return true;
    const q = bufferSearchQuery.trim().toLowerCase();
    return (
      row.periodLabel.toLowerCase().includes(q) ||
      row.periodStart.includes(q) ||
      row.periodEnd.includes(q) ||
      String(row.amountRub).includes(q)
    );
  });

  const mainTabClass = (active: boolean) =>
    `rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
      active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
    }`;

  const bufferSubTabClass = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
      active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
    }`;

  return (
    <main className="mx-auto w-full max-w-[1920px] px-6 py-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-6">
        <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-[280px]">
          <FinanceBalancesCard />
          <BalanceSpendCard />
        </aside>

        <section className="min-w-0 flex-1 rounded-2xl bg-white px-5 py-6 shadow-sm ring-1 ring-black/[0.03] sm:px-8 sm:py-8">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="text-[28px] font-bold leading-tight tracking-tight text-gray-900">Финансы</h1>
              <FinanceTitleHelp />
            </div>
            <FinanceInstructionsMenu />
          </div>

          <div
            className="mt-5 inline-flex w-fit max-w-full gap-1 rounded-xl bg-[#F2F2F7] p-1"
            role="tablist"
            aria-label="Разделы финансов"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mainTab === 'my_money'}
              className={mainTabClass(mainTab === 'my_money')}
              onClick={() => setMainTab('my_money')}
            >
              Мои деньги
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mainTab === 'buffer'}
              className={mainTabClass(mainTab === 'buffer')}
              onClick={() => setMainTab('buffer')}
            >
              Буфер
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mainTab === 'bonuses'}
              className={mainTabClass(mainTab === 'bonuses')}
              onClick={() => setMainTab('bonuses')}
            >
              Бонусы
            </button>
          </div>

          {mainTab === 'my_money' ? (
            <>
              <div className="mt-6 flex flex-col gap-4 xl:flex-row xl:flex-wrap xl:items-center xl:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <FinanceDropdown
                    aria-label="Тип истории"
                    value={historyFilter}
                    onChange={setHistoryFilter}
                    className="w-full sm:w-[200px]"
                    menuClassName="w-[240px]"
                    options={[
                      { value: 'expenses', label: 'История затрат' },
                      { value: 'topups', label: 'История пополнений' },
                      { value: 'expired_bonuses', label: 'Истёкшие бонусы' },
                      { value: 'pending_refunds', label: 'Ожидают возврата' },
                    ]}
                  />
                  <button
                    type="button"
                    className="inline-flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 transition-colors hover:border-gray-300 sm:w-auto sm:min-w-[240px]"
                  >
                    <span className="tabular-nums">10.08.2026 — 09.09.2026</span>
                    <Calendar className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                  </button>
                  <FinanceDropdown
                    aria-label="Фильтр"
                    value={scopeFilter}
                    onChange={setScopeFilter}
                    className="w-full sm:w-[120px]"
                    menuClassName="w-[220px]"
                    options={[
                      { value: 'all', label: 'Все' },
                      { value: 'manual', label: 'Ручная ставка' },
                      { value: 'unified', label: 'Единая ставка' },
                      {
                        value: 'wibes',
                        label: 'Продвижение в Wibes',
                        dividerBefore: true,
                        infoTooltip:
                          'Кампании продвижения в Wibes. Показываются отдельно от остальных типов ставок.',
                      },
                    ]}
                  />
                </div>
                <button
                  type="button"
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50 sm:w-auto"
                >
                  <Download className="h-4 w-4 text-gray-500" aria-hidden />
                  Скачать в Excel
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск"
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 hover:border-gray-300 focus:border-[#9A41FE] focus:ring-1 focus:ring-[#9A41FE]"
                  />
                </div>
                <FinanceDropdown
                  aria-label="Параметры поиска"
                  value={paramFilter}
                  onChange={setParamFilter}
                  className="w-full sm:w-[200px]"
                  menuClassName="w-[220px]"
                  options={
                    isPendingRefunds
                      ? [
                          { value: 'all', label: 'Все параметры' },
                          { value: 'campaign_id', label: 'ID кампании' },
                          { value: 'campaign_name', label: 'Название кампании' },
                          { value: 'status', label: 'Статус возврата' },
                        ]
                      : [
                          { value: 'all', label: 'Все параметры' },
                          { value: 'campaign_id', label: 'ID кампании' },
                          { value: 'campaign_name', label: 'Название кампании' },
                          { value: 'source', label: 'Источник списания' },
                        ]
                  }
                />
              </div>

              <p className="mt-4 text-sm text-gray-600">
                {isPendingRefunds ? (
                  <>
                    Сумма возвратных средств:{' '}
                    <span className="font-semibold tabular-nums text-gray-900">
                      {fmtRub(pendingRefundTotal)} ₽
                    </span>
                  </>
                ) : (
                  <>
                    Затраты за период:{' '}
                    <span className="font-semibold tabular-nums text-gray-900">
                      {fmtRub(periodTotal)} ₽
                    </span>
                  </>
                )}
              </p>

              <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100">
                {isPendingRefunds ? (
                  <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-[#FAFAFA] text-xs font-medium text-gray-500">
                        <th className="whitespace-nowrap px-4 py-3 font-medium">ID кампании</th>
                        <th className="min-w-[200px] px-4 py-3 font-medium">Кампания, Тип</th>
                        <th className="whitespace-nowrap px-4 py-3 font-medium">Дата завершения</th>
                        <th className="whitespace-nowrap px-4 py-3 font-medium">Сумма к возврату, ₽</th>
                        <th className="min-w-[160px] px-4 py-3 font-medium">
                          <span className="block">Статус</span>
                          <span className="mt-0.5 block text-[11px] font-normal leading-snug text-gray-400">
                            Возврат ≈ 5–7 дней
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPendingRefunds.map((row) => (
                        <tr key={row.campaignId} className="border-b border-gray-50 last:border-0">
                          <td className="whitespace-nowrap px-4 py-4 tabular-nums text-gray-900">
                            {row.campaignId}
                          </td>
                          <td className="px-4 py-4">
                            <button
                              type="button"
                              className="text-left text-sm font-medium text-[#007AFF] hover:underline"
                            >
                              {row.campaignName}
                            </button>
                            <p className="mt-1 text-xs leading-snug text-gray-500">{row.campaignType}</p>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 tabular-nums text-gray-900">
                            {row.finishedAt}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 font-medium tabular-nums text-gray-900">
                            {fmtRub(row.amountRub)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            <RefundStatusBadge status={row.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-[#FAFAFA] text-xs font-medium text-gray-500">
                        <th className="whitespace-nowrap px-4 py-3 font-medium">ID кампании</th>
                        <th className="min-w-[200px] px-4 py-3 font-medium">Кампания, Тип</th>
                        <th className="whitespace-nowrap px-4 py-3 font-medium">
                          <span className="inline-flex items-center gap-1">
                            Дата списания
                            <HelpCircle className="h-3.5 w-3.5 text-gray-400" aria-hidden />
                          </span>
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 font-medium">Источник списания</th>
                        <th className="whitespace-nowrap px-4 py-3 font-medium">Сумма, ₽</th>
                        <th className="whitespace-nowrap px-4 py-3 font-medium">№ документа</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row) => (
                        <tr key={row.campaignId} className="border-b border-gray-50 last:border-0">
                          <td className="whitespace-nowrap px-4 py-4 tabular-nums text-gray-900">
                            {row.campaignId}
                          </td>
                          <td className="px-4 py-4">
                            <button
                              type="button"
                              className="text-left text-sm font-medium text-[#007AFF] hover:underline"
                            >
                              {row.campaignName}
                            </button>
                            <p className="mt-1 text-xs leading-snug text-gray-500">{row.campaignType}</p>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 tabular-nums text-gray-900">
                            {row.debitDate}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-gray-900">{row.source}</td>
                          <td className="whitespace-nowrap px-4 py-4 tabular-nums text-gray-900">
                            {row.amountRub}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 tabular-nums text-gray-900">
                            {row.documentNo}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : mainTab === 'buffer' ? (
            <>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div
                  className="inline-flex w-fit gap-1 rounded-xl bg-[#F2F2F7] p-1"
                  role="tablist"
                  aria-label="Операции буфера"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={bufferSubTab === 'spent'}
                    className={bufferSubTabClass(bufferSubTab === 'spent')}
                    onClick={() => setBufferSubTab('spent')}
                  >
                    Потратили
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={bufferSubTab === 'accrued'}
                    className={bufferSubTabClass(bufferSubTab === 'accrued')}
                    onClick={() => setBufferSubTab('accrued')}
                  >
                    Было доступно
                  </button>
                </div>
                <button
                  type="button"
                  className="inline-flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 transition-colors hover:border-gray-300 sm:w-auto sm:min-w-[240px]"
                >
                  <span className="tabular-nums">10.08.2026 — 09.09.2026</span>
                  <Calendar className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                </button>
                <div className="relative min-w-0 sm:w-[280px]">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={bufferSearchQuery}
                    onChange={(e) => setBufferSearchQuery(e.target.value)}
                    placeholder="Поиск"
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 hover:border-gray-300 focus:border-[#9A41FE] focus:ring-1 focus:ring-[#9A41FE]"
                  />
                </div>
              </div>

              <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100">
                {bufferSubTab === 'accrued' ? (
                  <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-[#FAFAFA] text-xs font-medium text-gray-500">
                        <th className="whitespace-nowrap px-4 py-3 font-medium">Неделя</th>
                        <th className="whitespace-nowrap px-4 py-3 font-medium">Вт · 75%, ₽</th>
                        <th className="whitespace-nowrap px-4 py-3 font-medium">Чт · 25%, ₽</th>
                        <th className="whitespace-nowrap px-4 py-3 font-medium">Было доступно</th>
                        <th className="whitespace-nowrap px-4 py-3 font-medium">Формула расчёта</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBufferAccruals.map((row) => (
                        <tr key={row.id} className="border-b border-gray-50 last:border-0">
                          <td className="whitespace-nowrap px-4 py-4 font-medium text-gray-900">
                            {row.periodLabel}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 tabular-nums text-gray-900">
                            {fmtRub(row.tuesdayRub)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 tabular-nums text-gray-900">
                            {fmtRub(row.thursdayRub)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 font-semibold tabular-nums text-gray-900">
                            {fmtRub(row.weekTotalRub)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            <button
                              type="button"
                              onClick={() => setAccrualFormulaRow(row)}
                              className="text-sm font-medium text-[#007AFF] transition-colors hover:underline"
                            >
                              Посмотреть
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-[#FAFAFA] text-xs font-medium text-gray-500">
                        <th className="whitespace-nowrap px-4 py-3 font-medium">Неделя</th>
                        <th className="whitespace-nowrap px-4 py-3 font-medium">Сумма, ₽</th>
                        <th className="whitespace-nowrap px-4 py-3 font-medium">
                          Вычли из баланса WBPartner
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBufferSpends.map((row) => (
                        <tr key={row.id} className="border-b border-gray-50 last:border-0">
                          <td className="whitespace-nowrap px-4 py-4 font-medium text-gray-900">
                            {row.periodLabel}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 font-semibold tabular-nums text-gray-900">
                            {fmtRub(row.amountRub)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            {row.deductedFromWbPartner ? (
                              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                                <Check className="h-4 w-4" aria-hidden />
                                Вычли
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">
                                Вычтем {row.deductOnLabel ?? 'позже'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <button
                  type="button"
                  className="inline-flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 transition-colors hover:border-gray-300 sm:w-auto sm:min-w-[240px]"
                >
                  <span className="tabular-nums">10.08.2026 — 09.09.2026</span>
                  <Calendar className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                </button>
                <button
                  type="button"
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50 sm:w-auto"
                >
                  <Download className="h-4 w-4 text-gray-500" aria-hidden />
                  Скачать в Excel
                </button>
              </div>

              <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-[#FAFAFA] text-xs font-medium text-gray-500">
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Дата начисления</th>
                      <th className="min-w-[220px] px-4 py-3 font-medium">Источник</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Сумма, B</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Тип</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Сгорают до</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_BONUS_ACCRUALS.map((row) => (
                      <tr key={row.id} className="border-b border-gray-50 last:border-0">
                        <td className="whitespace-nowrap px-4 py-4 tabular-nums text-gray-900">
                          {row.date}
                        </td>
                        <td className="px-4 py-4 text-gray-900">{row.source}</td>
                        <td className="whitespace-nowrap px-4 py-4 font-semibold tabular-nums text-gray-900">
                          {fmtRub(row.amountB)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-gray-900">
                          {row.kind === 'permanent' ? 'Несгораемые' : 'Сгораемые'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 tabular-nums text-gray-500">
                          {row.expiresAt ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
      {accrualFormulaRow ? (
        <BufferSchemeModal row={accrualFormulaRow} onClose={() => setAccrualFormulaRow(null)} />
      ) : null}
    </main>
  );
};

export default FinancePage;
