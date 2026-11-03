import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronRight, X } from './Icons';
import {
  buildDemoBonusPackages,
  usePromoBonusDemo,
} from './PromoBonusDemoContext';

const UNIFIED_BALANCE = 105350;

export type BudgetWalletContext = {
  /** Всего промобонусов в кабинете */
  promoTotal: number;
  /** Уже распределено на кампании (B) */
  promoAllocated: number;
  /** Баланс ЕЛС */
  elsBalance: number;
  /** Уже зарезервировано с ЕЛС под кампании (₽) */
  elsReserved: number;
  /** Сколько кампаний в создании */
  campaignCount: number;
};

type BonusPackage = {
  id: string;
  amount: number;
  maxPercent: number;
  expiry: string;
  displayBurn: string;
};

const getPlural = (number: number, one: string, two: string, five: string) => {
  let n = Math.abs(number);
  n %= 100;
  if (n >= 5 && n <= 20) return five;
  n %= 10;
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return two;
  return five;
};

const parseDisplayValue = (str: string): number =>
  Number(String(str).replace(/\s/g, '').replace(/,/g, '.'));

const formatForDisplay = (num: number | string | undefined | null): string => {
  if (num === null || num === undefined || num === '') return '0';
  const numValue = typeof num === 'string' ? parseDisplayValue(num) : num;
  if (Number.isNaN(numValue)) return '0';
  return numValue.toLocaleString('ru-RU', { useGrouping: true });
};

const MONTH_SHORT_RU = [
  'янв',
  'фев',
  'мар',
  'апр',
  'мая',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
] as const;

/** «20.03.26» → «до 20 мар» */
const formatExpiryShort = (expiry: string): string => {
  const match = expiry.trim().match(/^(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?$/);
  if (!match) return `до ${expiry}`;
  const day = Number(match[1]);
  const month = Number(match[2]);
  if (!day || month < 1 || month > 12) return `до ${expiry}`;
  return `до ${day} ${MONTH_SHORT_RU[month - 1]}`;
};

function CorrectionToast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(() => onDismissRef.current(), 2000);
    return () => window.clearTimeout(id);
  }, [message]);

  if (!message) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-5 z-30 flex justify-center px-6">
      <div className="pointer-events-auto flex max-w-[440px] items-start gap-2 rounded-2xl bg-[#FFF6E8] px-3.5 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
        <p className="text-[13px] leading-5 text-gray-800">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-black/5 hover:text-gray-800"
          aria-label="Закрыть"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function RightSheetShell({
  titleId,
  title,
  subtitle,
  onClose,
  children,
  footer,
  overlay,
}: {
  titleId: string;
  title: string;
  subtitle?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
  overlay?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/50" onClick={onClose} role="presentation">
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
            className="relative flex h-full w-[720px] max-w-[calc(100vw-3rem)] shrink-0 flex-col overflow-hidden rounded-l-[28px] bg-[#F7F7F8] shadow-2xl animate-in slide-in-from-right duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            {overlay}
            <div className="shrink-0 px-6 pb-4 pt-6 sm:px-7">
              <h2 id={titleId} className="text-[22px] font-bold tracking-tight text-gray-900">
                {title}
              </h2>
              {subtitle ? <div className="mt-1.5 text-sm leading-5 text-gray-500">{subtitle}</div> : null}
            </div>
            <div className="min-w-0 flex-1 overflow-y-auto px-6 pb-5 pt-0 sm:px-7">{children}</div>
            <div className="shrink-0 bg-[#F7F7F8] px-6 pb-4 pt-3 sm:px-7">
              {footer}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type RefillLogic = {
  refillAmount: string;
  setRefillAmount: (v: string) => void;
  useBonuses: boolean;
  setUseBonuses: (v: boolean) => void;
  selectedPkgId: string;
  setSelectedPkgId: (v: string) => void;
  bonusValue: number | string;
  setBonusValue: (v: number | string) => void;
  clearBonusNotice: () => void;
  clearBudgetNotice: () => void;
  budgetError: string;
  budgetNotice: string;
  bonusError: string;
  bonusNotice: string;
  packages: readonly BonusPackage[];
  promoBonusTotal: number;
  selectedPkg: BonusPackage;
  currentBudgetValue: number;
  numericBonusValue: number;
  maxBonusAllowed: number;
  cashToPay: number;
  handleBudgetChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBudgetBlur: () => void;
  handleBonusChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBonusBlur: () => void;
  autoRefillEnabled: boolean;
  setAutoRefillEnabled: (v: boolean) => void;
  autoThreshold: string;
  setAutoThreshold: (v: string) => void;
  autoAmount: string;
  setAutoAmount: (v: string) => void;
  autoUseBonuses: boolean;
  setAutoUseBonuses: (v: boolean) => void;
  autoFrequencyMode: '1' | '2' | '3' | 'custom';
  setAutoFrequencyMode: (v: '1' | '2' | '3' | 'custom') => void;
  autoFrequencyTimes: string;
  setAutoFrequencyTimes: (v: string) => void;
  autoExpiryDate: string | null;
  setAutoExpiryDate: (v: string | null) => void;
  handleAutoFieldChange: (
    setter: (v: string) => void,
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  canSubmit: boolean;
};

function useRefillLogic(
  isOpen: boolean,
  options?: { availablePromoCap?: number | null; availableElsCap?: number | null },
): RefillLogic {
  const { promoBonusTotal } = usePromoBonusDemo();
  const availablePromoCap =
    options?.availablePromoCap != null && Number.isFinite(options.availablePromoCap)
      ? Math.max(0, options.availablePromoCap)
      : null;
  const availableElsCap =
    options?.availableElsCap != null && Number.isFinite(options.availableElsCap)
      ? Math.max(0, options.availableElsCap)
      : UNIFIED_BALANCE;
  const packages = useMemo(
    () => buildDemoBonusPackages(promoBonusTotal).filter((pkg) => pkg.amount > 0),
    [promoBonusTotal],
  );
  const fallbackPkg = packages[0] ?? {
    id: 'p1',
    amount: 0,
    maxPercent: 50,
    expiry: '20.03.26',
    displayBurn: '0',
  };

  const [refillAmount, setRefillAmount] = useState('3000');
  const [useBonuses, setUseBonuses] = useState(false);
  const [selectedPkgId, setSelectedPkgId] = useState(fallbackPkg.id);
  const [bonusValue, setBonusValue] = useState<number | string>(3000);
  const [budgetError, setBudgetError] = useState('');
  const [budgetNotice, setBudgetNotice] = useState('');
  const [bonusError] = useState('');
  const [bonusNotice, setBonusNotice] = useState('');
  const [autoRefillEnabled, setAutoRefillEnabled] = useState(false);
  const [autoThreshold, setAutoThreshold] = useState('1000');
  const [autoAmount, setAutoAmount] = useState('3000');
  const [autoUseBonuses, setAutoUseBonuses] = useState(false);
  const [autoFrequencyMode, setAutoFrequencyMode] = useState<'1' | '2' | '3' | 'custom'>('1');
  const [autoFrequencyTimes, setAutoFrequencyTimes] = useState('4');
  const [autoExpiryDate, setAutoExpiryDate] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setRefillAmount('3000');
      setUseBonuses(false);
      setSelectedPkgId(fallbackPkg.id);
      setBonusValue(3000);
      setBudgetError('');
      setBudgetNotice('');
      setBonusNotice('');
      setAutoRefillEnabled(false);
      setAutoThreshold('1000');
      setAutoAmount('3000');
      setAutoUseBonuses(false);
      setAutoFrequencyMode('1');
      setAutoFrequencyTimes('4');
      setAutoExpiryDate(null);
    }
  }, [isOpen, fallbackPkg.id]);

  const selectedPkg = useMemo(
    () => packages.find((p) => p.id === selectedPkgId) || fallbackPkg,
    [packages, selectedPkgId, fallbackPkg],
  );
  const currentBudgetValue = parseDisplayValue(refillAmount);
  const numericBonusValue = parseDisplayValue(String(bonusValue));
  const maxBonusAllowed = Math.min(
    selectedPkg.amount,
    Math.floor((currentBudgetValue * selectedPkg.maxPercent) / 100),
    Math.max(0, currentBudgetValue),
    availablePromoCap ?? Number.POSITIVE_INFINITY,
  );
  const cashToPay = Math.max(
    0,
    currentBudgetValue - (useBonuses ? Math.min(numericBonusValue, currentBudgetValue) : 0),
  );

  const handleAutoFieldChange =
    (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = parseDisplayValue(e.target.value);
      if (!Number.isNaN(parsed)) setter(String(parsed));
      else if (e.target.value === '') setter('');
    };

  return {
    refillAmount,
    setRefillAmount,
    useBonuses,
    setUseBonuses,
    selectedPkgId,
    setSelectedPkgId,
    bonusValue,
    setBonusValue,
    clearBonusNotice: () => setBonusNotice(''),
    clearBudgetNotice: () => setBudgetNotice(''),
    budgetError,
    budgetNotice,
    bonusError,
    bonusNotice,
    packages,
    promoBonusTotal,
    selectedPkg,
    currentBudgetValue,
    numericBonusValue,
    maxBonusAllowed,
    cashToPay,
    handleBudgetChange: (e) => {
      setBudgetNotice('');
      const parsed = parseDisplayValue(e.target.value);
      if (!Number.isNaN(parsed)) setRefillAmount(String(parsed));
      else if (e.target.value === '') setRefillAmount('');
    },
    handleBudgetBlur: () => {
      const parsed = parseDisplayValue(refillAmount);
      const maxAmount = Math.max(1000, availableElsCap);
      if (Number.isNaN(parsed) || parsed < 1000) {
        setRefillAmount('1000');
        setBudgetNotice('Скорректировали до минимума — 1 000 ₽');
        return;
      }
      if (parsed > maxAmount) {
        setRefillAmount(String(maxAmount));
        setBudgetNotice(
          `Скорректировали до максимума — ${formatForDisplay(maxAmount)} ₽`,
        );
      }
    },
    handleBonusChange: (e) => {
      setBonusNotice('');
      const parsed = parseDisplayValue(e.target.value);
      if (!Number.isNaN(parsed)) setBonusValue(parsed);
      else if (e.target.value === '') setBonusValue('');
    },
    handleBonusBlur: () => {
      const numericValue = parseDisplayValue(String(bonusValue));
      if (Number.isNaN(numericValue) || numericValue < 0) {
        setBonusValue(0);
        setBonusNotice('');
        return;
      }
      if (numericValue > maxBonusAllowed) {
        setBonusValue(maxBonusAllowed);
        setBonusNotice(
          `Скорректировали до максимума — ${formatForDisplay(maxBonusAllowed)} B`,
        );
      }
    },
    autoRefillEnabled,
    setAutoRefillEnabled,
    autoThreshold,
    setAutoThreshold,
    autoAmount,
    setAutoAmount,
    autoUseBonuses,
    setAutoUseBonuses,
    autoFrequencyMode,
    setAutoFrequencyMode,
    autoFrequencyTimes,
    setAutoFrequencyTimes,
    autoExpiryDate,
    setAutoExpiryDate,
    handleAutoFieldChange,
    canSubmit: currentBudgetValue >= 1000,
  };
}

function ToggleSwitch({
  on,
  size = 'md',
  className = '',
}: {
  on: boolean;
  size?: 'md' | 'sm';
  className?: string;
}) {
  const track =
    size === 'sm' ? 'h-5 w-9' : 'h-7 w-12';
  const thumb =
    size === 'sm'
      ? `absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
          on ? 'translate-x-4' : 'translate-x-0.5'
        }`
      : `absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
          on ? 'translate-x-5' : 'translate-x-0.5'
        }`;

  return (
    <span
      className={`relative inline-flex shrink-0 rounded-full transition-colors ${track} ${
        on ? 'bg-[#B45AFF]' : 'bg-[#E5E5EA]'
      } ${className}`}
    >
      <span className={thumb} />
    </span>
  );
}

/** RITM FormFieldText: primary fill; label опционален */
function RitFormFieldText({
  label,
  value,
  onChange,
  onBlur,
  suffix,
  autoFocus,
  error,
  notice,
  hint,
  surface = 'primary',
  ariaLabel,
}: {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  suffix?: string;
  autoFocus?: boolean;
  error?: string;
  notice?: string;
  hint?: string;
  /** primary — серый fill; white — на сером фоне пакета */
  surface?: 'primary' | 'white';
  ariaLabel?: string;
}) {
  const surfaceClass =
    surface === 'white'
      ? 'border border-black/[0.06] bg-white hover:bg-white focus-within:border-black'
      : 'border border-transparent bg-[#F2F2F7] hover:bg-[#EBEBF0] focus-within:border-black focus-within:bg-white';
  const hasLabel = Boolean(label);

  return (
    <div>
      <label
        className={`flex cursor-text rounded-[10px] px-3 transition-colors ${
          hasLabel
            ? 'min-h-[52px] flex-col justify-center gap-0.5 py-2'
            : 'h-12 items-center'
        } ${surfaceClass}`}
      >
        {hasLabel ? (
          <span className="text-[12px] font-medium leading-4 text-gray-900">{label}</span>
        ) : null}
        <span className="flex min-w-0 w-full items-center gap-1">
          <input
            type="text"
            inputMode="numeric"
            autoFocus={autoFocus}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold tabular-nums leading-5 text-gray-900 outline-none"
            aria-label={ariaLabel || label}
          />
          {suffix ? (
            <span className="shrink-0 text-[14px] font-medium text-[#A0A0AB]">{suffix}</span>
          ) : null}
        </span>
      </label>
      {error ? (
        <p className="mt-1.5 text-[12px] text-red-500">{error}</p>
      ) : notice ? (
        <p className="mt-1.5 rounded-lg bg-[#FFF6E8] px-2.5 py-1.5 text-[12px] leading-4 text-gray-800">
          {notice}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[12px] text-gray-400">{hint}</p>
      ) : null}
    </div>
  );
}

const MONTH_TITLE_RU = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
] as const;

const WEEKDAY_SHORT_RU = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'] as const;

const toIsoDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatIsoDisplay = (iso: string): string => {
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
};

const parseIsoDate = (iso: string): Date | null => {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
};

function AutoExpiryDateField({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const initialMonth = value ? parseIsoDate(value) ?? new Date() : new Date();
  const [viewMonth, setViewMonth] = useState(
    () => new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1),
  );

  useLayoutEffect(() => {
    if (!open) {
      setPopoverPos(null);
      return;
    }
    const update = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = 280;
      const height = 320;
      const left = Math.min(
        Math.max(8, rect.right - width),
        window.innerWidth - width - 8,
      );
      const below = rect.bottom + 8;
      const top =
        below + height > window.innerHeight - 8
          ? Math.max(8, rect.top - height - 8)
          : below;
      setPopoverPos({ top, left });
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
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const base = value ? parseIsoDate(value) ?? new Date() : new Date();
    setViewMonth(new Date(base.getFullYear(), base.getMonth(), 1));
  }, [open, value]);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayIso = toIsoDate(new Date());
  const cells: Array<{ day: number; iso: string } | null> = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, iso: toIsoDate(new Date(year, month, day)) });
  }

  const popover =
    open && popoverPos
      ? createPortal(
          <div
            ref={popoverRef}
            className="fixed z-[300] w-[280px] rounded-2xl border border-black/[0.06] bg-white p-3 shadow-xl"
            style={{ top: popoverPos.top, left: popoverPos.left }}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setViewMonth(new Date(year, month - 1, 1))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
                aria-label="Предыдущий месяц"
              >
                <ChevronRight className="h-4 w-4 rotate-180 text-gray-500" />
              </button>
              <div className="text-[13px] font-semibold text-gray-900">
                {MONTH_TITLE_RU[month]} {year}
              </div>
              <button
                type="button"
                onClick={() => setViewMonth(new Date(year, month + 1, 1))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
                aria-label="Следующий месяц"
              >
                <ChevronRight className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7 gap-0.5">
              {WEEKDAY_SHORT_RU.map((label) => (
                <div
                  key={label}
                  className="py-1 text-center text-[11px] font-medium uppercase text-gray-400"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((cell, index) => {
                if (!cell) return <div key={`e-${index}`} className="h-9" />;
                const selected = value === cell.iso;
                const isToday = cell.iso === todayIso;
                const isPast = cell.iso < todayIso;
                return (
                  <button
                    key={cell.iso}
                    type="button"
                    disabled={isPast}
                    onClick={() => {
                      onChange(cell.iso);
                      setOpen(false);
                    }}
                    className={`h-9 rounded-full text-[13px] tabular-nums transition-colors ${
                      selected
                        ? 'bg-gray-900 font-semibold text-white'
                        : isPast
                          ? 'cursor-not-allowed text-gray-300'
                          : isToday
                            ? 'font-semibold text-[#9A41FE] hover:bg-[#F2F2F7]'
                            : 'text-gray-800 hover:bg-[#F2F2F7]'
                    }`}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef}>
      <div className="flex items-center gap-1">
        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Убрать срок действия"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#F2F2F7] px-2.5 text-[13px] font-semibold text-gray-800 transition-colors hover:bg-[#EBEBF0]"
        >
          <Calendar className="h-3.5 w-3.5 text-gray-500" />
          {value ? `до ${formatIsoDisplay(value)}` : 'Добавить'}
        </button>
      </div>
      {popover}
    </div>
  );
}

function AutoRefillBlock({ logic }: { logic: RefillLogic }) {
  return (
    <div className="rounded-[24px] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <button
        type="button"
        onClick={() => logic.setAutoRefillEnabled(!logic.autoRefillEnabled)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="text-[17px] font-semibold text-gray-900">Автопополнение</div>
        <ToggleSwitch on={logic.autoRefillEnabled} />
      </button>

      {logic.autoRefillEnabled ? (
        <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
          <div className="grid grid-cols-2 gap-2.5">
            <RitFormFieldText
              label="Если бюджет меньше"
              value={formatForDisplay(logic.autoThreshold)}
              onChange={logic.handleAutoFieldChange(logic.setAutoThreshold)}
              suffix="₽"
            />
            <RitFormFieldText
              label="Пополнять на"
              value={formatForDisplay(logic.autoAmount)}
              onChange={logic.handleAutoFieldChange(logic.setAutoAmount)}
              suffix="₽"
            />
          </div>

          <div className="divide-y divide-gray-100">
            <div className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-[13px] font-medium text-gray-900">Максимум раз в день</span>
              <div className="flex items-center gap-1.5">
                <div className="inline-flex rounded-lg bg-[#F2F2F7] p-0.5">
                  {(
                    [
                      { id: '1' as const, label: '1' },
                      { id: '2' as const, label: '2' },
                      { id: '3' as const, label: '3' },
                      { id: 'custom' as const, label: 'Своё' },
                    ] as const
                  ).map((opt) => {
                    const active = logic.autoFrequencyMode === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => logic.setAutoFrequencyMode(opt.id)}
                        className={`h-7 min-w-[32px] rounded-md px-2 text-[13px] font-semibold tabular-nums transition-colors ${
                          active
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                {logic.autoFrequencyMode === 'custom' ? (
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    value={logic.autoFrequencyTimes}
                    onChange={logic.handleAutoFieldChange(logic.setAutoFrequencyTimes)}
                    onBlur={() => {
                      const parsed = parseDisplayValue(logic.autoFrequencyTimes);
                      logic.setAutoFrequencyTimes(
                        Number.isNaN(parsed) || parsed < 1
                          ? '4'
                          : String(Math.min(99, Math.floor(parsed))),
                      );
                    }}
                    className="h-8 w-12 rounded-lg bg-[#F2F2F7] text-center text-[13px] font-semibold tabular-nums text-gray-900 outline-none focus:bg-white focus:ring-1 focus:ring-black"
                    aria-label="Своя частота пополнений в день"
                  />
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-[13px] font-medium text-gray-900">Срок действия</span>
              <AutoExpiryDateField
                value={logic.autoExpiryDate}
                onChange={logic.setAutoExpiryDate}
              />
            </div>

            <button
              type="button"
              onClick={() => logic.setAutoUseBonuses(!logic.autoUseBonuses)}
              className="flex w-full items-center justify-between gap-3 py-2.5 text-left"
            >
              <span className="text-[13px] font-medium text-gray-900">
                Использовать промобонусы
              </span>
              <ToggleSwitch on={logic.autoUseBonuses} size="sm" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function bonusLimitReason(logic: RefillLogic): string {
  const budget = Math.max(0, logic.currentBudgetValue);
  const byPercent = Math.floor((budget * logic.selectedPkg.maxPercent) / 100);
  const packageAmount = logic.selectedPkg.amount;
  const max = logic.maxBonusAllowed;

  if (packageAmount <= byPercent && packageAmount <= budget && max === packageAmount) {
    return `На пакете ${formatForDisplay(packageAmount)} B — это весь остаток.`;
  }
  if (byPercent <= packageAmount && byPercent <= budget && max === byPercent) {
    return `С пакета можно списать до ${logic.selectedPkg.maxPercent}% от пополнения — ${formatForDisplay(byPercent)} B.`;
  }
  if (max === budget) {
    return `Не больше суммы пополнения — ${formatForDisplay(budget)} B.`;
  }
  return `Часть бонусов уже занята на кампаниях в создании, поэтому можно ещё ${formatForDisplay(max)} B.`;
}

function HoverCap({ label, text }: { label: string; text: string }) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const show = () => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = 260;
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
    const top = rect.bottom + 6;
    setPos({ top, left });
  };

  return (
    <span
      ref={anchorRef}
      className="cursor-help border-b border-dashed border-gray-300"
      onMouseEnter={show}
      onMouseLeave={() => setPos(null)}
      onFocus={show}
      onBlur={() => setPos(null)}
      tabIndex={0}
    >
      {label}
      {pos
        ? createPortal(
            <span
              role="tooltip"
              className="pointer-events-none fixed z-[300] w-[260px] rounded-xl bg-gray-900 px-3 py-2 text-left text-[12px] font-normal normal-case leading-4 text-white shadow-lg"
              style={{ top: pos.top, left: pos.left }}
            >
              {text}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}

function BonusPackagePicker({ logic }: { logic: RefillLogic }) {
  return (
    <div className="space-y-2">
      {logic.packages.map((pkg) => {
        const active = logic.selectedPkgId === pkg.id;
        return (
          <div
            key={pkg.id}
            className={`overflow-hidden rounded-[12px] transition-colors ${
              active
                ? 'bg-[#F2F2F7] shadow-[0_0_0_2px_#111827]'
                : 'bg-[#F2F2F7]/70 hover:bg-[#F2F2F7]'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                logic.setSelectedPkgId(pkg.id);
                const maxByPercent = Math.floor(
                  (logic.currentBudgetValue * pkg.maxPercent) / 100,
                );
                logic.setBonusValue(
                  Math.min(logic.currentBudgetValue, maxByPercent, pkg.amount),
                );
                logic.clearBonusNotice();
              }}
              className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left"
            >
              <div className="min-w-0">
                <div className="text-[14px] font-bold tabular-nums text-gray-900">
                  {formatForDisplay(pkg.amount)} B
                </div>
                <div className="mt-0.5 text-[12px] leading-4 text-gray-500">
                  До {pkg.maxPercent}% от пополнения с единого счёта
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-[12px] text-gray-500 tabular-nums">
                  {formatExpiryShort(pkg.expiry)}
                </span>
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    active ? 'border-gray-900' : 'border-gray-300'
                  }`}
                >
                  {active ? <span className="h-2.5 w-2.5 rounded-full bg-gray-900" /> : null}
                </span>
              </div>
            </button>

            {active ? (
              <div className="px-2.5 pb-2.5 pt-1">
                <RitFormFieldText
                  value={formatForDisplay(logic.bonusValue)}
                  onChange={logic.handleBonusChange}
                  onBlur={logic.handleBonusBlur}
                  suffix="B"
                  surface="white"
                  ariaLabel="Списать с этого пакета"
                />
                <p className="mt-1.5 text-[12px] leading-4 text-gray-400 tabular-nums">
                  от 0{' '}
                  <HoverCap
                    label={`до ${formatForDisplay(logic.maxBonusAllowed)} B`}
                    text={bonusLimitReason(logic)}
                  />
                </p>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function DailyLimitHint({
  show,
  neededAmount,
  dailyLimit,
}: {
  show: boolean;
  neededAmount: number;
  dailyLimit: number;
}) {
  if (!show || neededAmount <= 0) return null;
  return (
    <div className="rounded-2xl bg-[#FFF6E8] px-4 py-3 text-[13px] leading-5 text-gray-800">
      Для дневного лимита {formatForDisplay(dailyLimit)} ₽ нужно ещё{' '}
      <span className="font-semibold tabular-nums">{formatForDisplay(neededAmount)} ₽</span>
    </div>
  );
}

function BonusExpanded({ logic }: { logic: RefillLogic }) {
  return (
    <div className="pt-3.5">
      <BonusPackagePicker logic={logic} />
    </div>
  );
}

function SummaryPinned({
  logic,
  isMassRefill,
  massCount,
}: {
  logic: RefillLogic;
  isMassRefill: boolean;
  massCount: number;
}) {
  const bonusPart = logic.useBonuses
    ? Math.min(logic.numericBonusValue, logic.currentBudgetValue)
    : 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
      <div className="px-4 pt-3.5 pb-2">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[13px] text-gray-500">Итого бюджет</span>
          <span className="text-[17px] font-bold leading-none tabular-nums tracking-tight text-gray-900">
            {formatForDisplay(logic.currentBudgetValue)} ₽
          </span>
        </div>
      </div>
      <div className="mx-4 border-t border-dashed border-gray-200" />
      <div className="space-y-1.5 px-4 py-3 text-[13px]">
        <div className="flex items-center justify-between gap-3">
          <span className="text-gray-500">Единый счёт</span>
          <span className="font-semibold tabular-nums text-gray-900">
            −{formatForDisplay(logic.cashToPay)} ₽
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-gray-500">Промобонусы</span>
          <span className="font-semibold tabular-nums text-gray-900">
            {bonusPart > 0 ? `−${formatForDisplay(bonusPart)} B` : '—'}
          </span>
        </div>
        {isMassRefill ? (
          <p className="pt-0.5 text-[11px] text-gray-400">
            ×{massCount} {getPlural(massCount, 'кампания', 'кампании', 'кампаний')}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SummaryBody({
  logic,
  isMassRefill,
  massCount,
  neededAmount,
  showDailyLimitInfo,
  dailyLimit,
  wallet,
}: {
  logic: RefillLogic;
  isMassRefill: boolean;
  massCount: number;
  neededAmount: number;
  showDailyLimitInfo: boolean;
  dailyLimit: number;
  wallet?: BudgetWalletContext | null;
}) {
  const elsBalance = wallet?.elsBalance ?? UNIFIED_BALANCE;
  const elsReserved = wallet?.elsReserved ?? 0;
  const elsAvailable = Math.max(0, elsBalance - elsReserved);
  const promoTotal = wallet?.promoTotal ?? logic.promoBonusTotal;

  return (
    <div className="space-y-5">
      <DailyLimitHint
        show={showDailyLimitInfo}
        neededAmount={neededAmount}
        dailyLimit={dailyLimit}
      />

      <div className="rounded-[24px] bg-white px-4 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="mb-2.5 flex items-baseline gap-2 text-[17px] font-semibold text-gray-900">
          <span>Единый счёт</span>
          <span className="tabular-nums text-gray-400">{formatForDisplay(elsBalance)} ₽</span>
        </div>
        <RitFormFieldText
          value={formatForDisplay(logic.refillAmount)}
          onChange={logic.handleBudgetChange}
          onBlur={logic.handleBudgetBlur}
          suffix="₽"
          autoFocus
          ariaLabel={isMassRefill ? 'Сумма на 1 кампанию' : 'Сумма пополнения'}
          hint={
            isMassRefill
              ? `На каждую из ${massCount} ${getPlural(massCount, 'кампании', 'кампаний', 'кампаний')}`
              : undefined
          }
        />

        <p className="mt-1.5 text-[12px] leading-4 text-gray-400 tabular-nums">
          от 1 000{' '}
          <span className="group relative inline-flex cursor-help">
            <span className="border-b border-dashed border-gray-300">
              до {formatForDisplay(elsAvailable)} ₽
            </span>
            <span
              role="tooltip"
              className="pointer-events-none absolute left-0 top-full z-20 mt-1.5 hidden w-[260px] rounded-xl bg-gray-900 px-3 py-2 text-left text-[12px] font-normal normal-case leading-4 text-white shadow-lg group-hover:block"
            >
              {elsReserved > 0
                ? `На счёте ${formatForDisplay(elsBalance)} ₽. На кампаниях в создании уже занято ${formatForDisplay(elsReserved)} ₽, поэтому можно ещё ${formatForDisplay(elsAvailable)} ₽.`
                : `Это весь остаток единого счёта — ${formatForDisplay(elsAvailable)} ₽.`}
            </span>
          </span>
        </p>

        <div className="mt-4 border-t border-gray-100 pt-3.5">
          <button
            type="button"
            onClick={() => logic.setUseBonuses(!logic.useBonuses)}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <div className="flex min-w-0 items-baseline gap-2 text-[17px] font-semibold text-gray-900">
              <span>Промобонусы</span>
              <span className="tabular-nums text-gray-400">{formatForDisplay(promoTotal)} B</span>
            </div>
            <ToggleSwitch on={logic.useBonuses} />
          </button>
          {logic.useBonuses ? <BonusExpanded logic={logic} /> : null}
        </div>
      </div>

      <AutoRefillBlock logic={logic} />
    </div>
  );
}

export type BudgetRefillAutoRefillExtras = {
  enabled: boolean;
  threshold: number;
  amount: number;
  useBonuses: boolean;
  timesPerDay?: number;
  expiryDate?: string | null;
};

export type BudgetRefillSaveExtras = {
  useBonuses: boolean;
  bonusAmount: number;
  packageId: string;
  autoRefill?: BudgetRefillAutoRefillExtras;
};

function buildSaveExtras(logic: RefillLogic): BudgetRefillSaveExtras {
  return {
    useBonuses: logic.useBonuses,
    bonusAmount: logic.useBonuses ? logic.numericBonusValue : 0,
    packageId: logic.selectedPkgId,
    ...(logic.autoRefillEnabled
      ? {
          autoRefill: {
            enabled: true,
            threshold: parseDisplayValue(logic.autoThreshold) || 1000,
            amount: parseDisplayValue(logic.autoAmount) || 3000,
            useBonuses: logic.autoUseBonuses,
            timesPerDay:
              logic.autoFrequencyMode === 'custom'
                ? Math.max(
                    1,
                    Math.floor(parseDisplayValue(logic.autoFrequencyTimes) || 1),
                  )
                : Number(logic.autoFrequencyMode),
            expiryDate: logic.autoExpiryDate,
          },
        }
      : null),
  };
}

export const BudgetRefillModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (amount: number, extras?: BudgetRefillSaveExtras) => void;
  currentBudget: number;
  /** >1 — массовое пополнение (одна сумма на каждую кампанию) */
  campaignCount?: number;
  dailyLimit?: number;
  showDailyLimitInfo?: boolean;
  /** Подпись основной кнопки; по умолчанию «Пополнить» / «Применить» */
  submitLabel?: string;
  /** Уже распределённые бонусы / ЕЛС по кампаниям создания */
  walletContext?: BudgetWalletContext | null;
}> = ({
  isOpen,
  onClose,
  onSave,
  currentBudget,
  campaignCount,
  dailyLimit = 0,
  showDailyLimitInfo = false,
  submitLabel,
  walletContext = null,
}) => {
  const availablePromoCap = walletContext
    ? Math.max(0, walletContext.promoTotal - walletContext.promoAllocated)
    : null;
  const availableElsCap = walletContext
    ? Math.max(0, walletContext.elsBalance - walletContext.elsReserved)
    : UNIFIED_BALANCE;
  const logic = useRefillLogic(isOpen, { availablePromoCap, availableElsCap });

  if (!isOpen) return null;

  const massCount = campaignCount != null && campaignCount > 1 ? campaignCount : 0;
  const isMassRefill = massCount > 1;
  const neededAmount = dailyLimit > currentBudget ? dailyLimit - currentBudget : 0;
  const ctaLabel = submitLabel ?? (isMassRefill ? 'Применить' : 'Пополнить');

  const footerCta = (
    <div className="space-y-3">
      <SummaryPinned logic={logic} isMassRefill={isMassRefill} massCount={massCount} />
      <button
        type="button"
        disabled={!logic.canSubmit}
        onClick={() => onSave(parseDisplayValue(logic.refillAmount), buildSaveExtras(logic))}
        className="inline-flex h-12 items-center justify-center rounded-2xl bg-gray-900 px-5 text-[15px] font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {ctaLabel}
      </button>
    </div>
  );

  const correctionMessage = logic.budgetNotice || logic.bonusNotice;

  return (
    <RightSheetShell
      titleId="budget-refill-title"
      title="Настройка бюджета"
      onClose={onClose}
      footer={footerCta}
      overlay={
        <CorrectionToast
          message={correctionMessage}
          onDismiss={() => {
            logic.clearBudgetNotice();
            logic.clearBonusNotice();
          }}
        />
      }
    >
      <SummaryBody
        logic={logic}
        isMassRefill={isMassRefill}
        massCount={massCount}
        neededAmount={neededAmount}
        showDailyLimitInfo={showDailyLimitInfo}
        dailyLimit={dailyLimit}
        wallet={walletContext}
      />
    </RightSheetShell>
  );
};
