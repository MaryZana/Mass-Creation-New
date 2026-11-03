import React, { useEffect, useMemo, useState } from 'react';
import { X } from './Icons';

const UNIFIED_BALANCE = 105350;
const TOTAL_PROMO_BONUS = 226660517;
const BONUS_PACKAGES = [
  { id: 'p1', amount: 209527397, maxPercent: 100, expiry: '20.03.26', displayBurn: '209.4M' },
  { id: 'p2', amount: 17133120, maxPercent: 99, expiry: '27.03.26', displayBurn: '168.3k' },
] as const;

const QUICK_AMOUNTS = [1000, 3000, 5000, 10000] as const;

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

function RightSheetShell({
  titleId,
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  titleId: string;
  title: string;
  subtitle?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
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
            className="flex h-full w-[720px] max-w-[calc(100vw-3rem)] shrink-0 flex-col overflow-hidden rounded-l-[28px] bg-[#F7F7F8] shadow-2xl animate-in slide-in-from-right duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <div className="shrink-0 border-b border-black/[0.04] bg-white px-6 pb-4 pt-6 sm:px-7">
              <h2 id={titleId} className="text-[22px] font-bold tracking-tight text-gray-900">
                {title}
              </h2>
              {subtitle ? <div className="mt-1.5 text-sm leading-5 text-gray-500">{subtitle}</div> : null}
            </div>
            <div className="min-w-0 flex-1 overflow-y-auto px-6 py-5 sm:px-7">{children}</div>
            <div className="shrink-0 border-t border-black/[0.04] bg-[#F7F7F8] px-6 pb-4 pt-3 sm:px-7">
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
  budgetError: string;
  budgetNotice: string;
  bonusError: string;
  bonusNotice: string;
  selectedPkg: (typeof BONUS_PACKAGES)[number];
  currentBudgetValue: number;
  numericBonusValue: number;
  cashToPay: number;
  handleBudgetChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBudgetBlur: () => void;
  handleBonusChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBonusBlur: () => void;
  setQuickAmount: (amount: number) => void;
  autoRefillEnabled: boolean;
  setAutoRefillEnabled: (v: boolean) => void;
  autoThreshold: string;
  setAutoThreshold: (v: string) => void;
  autoAmount: string;
  setAutoAmount: (v: string) => void;
  autoUseBonuses: boolean;
  setAutoUseBonuses: (v: boolean) => void;
  handleAutoFieldChange: (
    setter: (v: string) => void,
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  canSubmit: boolean;
};

function useRefillLogic(isOpen: boolean): RefillLogic {
  const [refillAmount, setRefillAmount] = useState('3000');
  const [useBonuses, setUseBonuses] = useState(false);
  const [selectedPkgId, setSelectedPkgId] = useState(BONUS_PACKAGES[0].id);
  const [bonusValue, setBonusValue] = useState<number | string>(3000);
  const [budgetError, setBudgetError] = useState('');
  const [budgetNotice, setBudgetNotice] = useState('');
  const [bonusError] = useState('');
  const [bonusNotice, setBonusNotice] = useState('');
  const [autoRefillEnabled, setAutoRefillEnabled] = useState(false);
  const [autoThreshold, setAutoThreshold] = useState('1000');
  const [autoAmount, setAutoAmount] = useState('3000');
  const [autoUseBonuses, setAutoUseBonuses] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRefillAmount('3000');
      setUseBonuses(false);
      setBonusValue(3000);
      setBudgetError('');
      setBudgetNotice('');
      setBonusNotice('');
      setAutoRefillEnabled(false);
      setAutoThreshold('1000');
      setAutoAmount('3000');
      setAutoUseBonuses(false);
    }
  }, [isOpen]);

  const selectedPkg = useMemo(
    () => BONUS_PACKAGES.find((p) => p.id === selectedPkgId) || BONUS_PACKAGES[0],
    [selectedPkgId],
  );
  const currentBudgetValue = parseDisplayValue(refillAmount);
  const numericBonusValue = parseDisplayValue(String(bonusValue));
  const maxBonusAllowed = Math.min(
    selectedPkg.amount,
    Math.floor((currentBudgetValue * selectedPkg.maxPercent) / 100),
    Math.max(0, currentBudgetValue),
  );
  const cashToPay = Math.max(
    0,
    currentBudgetValue - (useBonuses ? Math.min(numericBonusValue, currentBudgetValue) : 0),
  );

  const setQuickAmount = (amount: number) => {
    setRefillAmount(String(amount));
    if (useBonuses) {
      const maxByPercent = Math.floor((amount * selectedPkg.maxPercent) / 100);
      setBonusValue(Math.min(amount, maxByPercent, selectedPkg.amount));
      setBonusNotice('');
    }
  };

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
    budgetError,
    budgetNotice,
    bonusError,
    bonusNotice,
    selectedPkg,
    currentBudgetValue,
    numericBonusValue,
    cashToPay,
    handleBudgetChange: (e) => {
      setBudgetNotice('');
      const parsed = parseDisplayValue(e.target.value);
      if (!Number.isNaN(parsed)) setRefillAmount(String(parsed));
      else if (e.target.value === '') setRefillAmount('');
    },
    handleBudgetBlur: () => {
      const parsed = parseDisplayValue(refillAmount);
      if (Number.isNaN(parsed) || parsed < 1000) {
        setRefillAmount('1000');
        setBudgetNotice('Скорректировали до минимума — 1 000 ₽');
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
    setQuickAmount: (amount: number) => {
      setBudgetNotice('');
      setQuickAmount(amount);
    },
    autoRefillEnabled,
    setAutoRefillEnabled,
    autoThreshold,
    setAutoThreshold,
    autoAmount,
    setAutoAmount,
    autoUseBonuses,
    setAutoUseBonuses,
    handleAutoFieldChange,
    canSubmit: currentBudgetValue >= 1000,
  };
}

function ToggleSwitch({ on, className = '' }: { on: boolean; className?: string }) {
  return (
    <span
      className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors ${
        on ? 'bg-[#B45AFF]' : 'bg-[#E5E5EA]'
      } ${className}`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
          on ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </span>
  );
}

/** RITM FormFieldText: primary fill, label inside, не pill */
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
}: {
  label: string;
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
}) {
  const surfaceClass =
    surface === 'white'
      ? 'border border-black/[0.06] bg-white hover:bg-white focus-within:border-black'
      : 'border border-transparent bg-[#F2F2F7] hover:bg-[#EBEBF0] focus-within:border-black focus-within:bg-white';

  return (
    <div>
      <label
        className={`flex min-h-[52px] cursor-text flex-col justify-center gap-0.5 rounded-[10px] px-3 py-2 transition-colors ${surfaceClass}`}
      >
        <span className="text-[12px] font-medium leading-4 text-gray-900">{label}</span>
        <span className="flex min-w-0 items-center gap-1">
          <input
            type="text"
            inputMode="numeric"
            autoFocus={autoFocus}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold tabular-nums leading-5 text-gray-900 outline-none"
            aria-label={label}
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

function AutoRefillBlock({ logic }: { logic: RefillLogic }) {
  return (
    <div className="rounded-[24px] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <button
        type="button"
        onClick={() => logic.setAutoRefillEnabled(!logic.autoRefillEnabled)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="text-[13px] font-semibold text-gray-900">Автопополнение</div>
        <ToggleSwitch on={logic.autoRefillEnabled} />
      </button>

      {logic.autoRefillEnabled ? (
        <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
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

          <button
            type="button"
            onClick={() => logic.setAutoUseBonuses(!logic.autoUseBonuses)}
            className="flex w-full items-center justify-between gap-3 rounded-[10px] bg-[#F2F2F7] px-3 py-2.5 text-left"
          >
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-gray-900">Промобонусы</div>
              <div className="mt-0.5 text-[12px] text-gray-500">
                Пакет спишется автоматически
              </div>
            </div>
            <ToggleSwitch on={logic.autoUseBonuses} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function QuickAmountRow({
  value,
  onPick,
}: {
  value: number;
  onPick: (amount: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_AMOUNTS.map((amount) => {
        const active = value === amount;
        return (
          <button
            key={amount}
            type="button"
            onClick={() => onPick(amount)}
            className={`inline-flex h-8 items-center rounded-full px-3 text-[13px] font-semibold tabular-nums transition-colors ${
              active
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-800 shadow-[0_0_0_1px_rgba(0,0,0,0.06)] hover:bg-gray-50'
            }`}
          >
            {formatForDisplay(amount)} ₽
          </button>
        );
      })}
    </div>
  );
}

function BonusPackagePicker({ logic }: { logic: RefillLogic }) {
  return (
    <div className="space-y-2">
      {BONUS_PACKAGES.map((pkg) => {
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
                <div className="mt-0.5 text-[12px] text-gray-500">
                  до {pkg.maxPercent}% · сгорят {pkg.expiry}
                </div>
              </div>
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  active ? 'border-gray-900' : 'border-gray-300'
                }`}
              >
                {active ? <span className="h-2.5 w-2.5 rounded-full bg-gray-900" /> : null}
              </span>
            </button>

            {active ? (
              <div className="border-t border-black/[0.06] px-2.5 pb-2.5 pt-2">
                <RitFormFieldText
                  label="Списать с этого пакета"
                  value={formatForDisplay(logic.bonusValue)}
                  onChange={logic.handleBonusChange}
                  onBlur={logic.handleBonusBlur}
                  suffix="B"
                  surface="white"
                  notice={logic.bonusNotice || undefined}
                />
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
    <div className="border-t border-gray-100 pt-4">
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
        <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-gray-400">
          Итог
        </div>
        <div className="mt-1.5 flex items-baseline justify-between gap-3">
          <span className="text-[13px] text-gray-500">В бюджет</span>
          <span className="text-[22px] font-bold leading-none tabular-nums tracking-tight text-gray-900">
            +{formatForDisplay(logic.currentBudgetValue)} ₽
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
}: {
  logic: RefillLogic;
  isMassRefill: boolean;
  massCount: number;
  neededAmount: number;
  showDailyLimitInfo: boolean;
  dailyLimit: number;
}) {
  return (
    <div className="space-y-5">
      <DailyLimitHint
        show={showDailyLimitInfo}
        neededAmount={neededAmount}
        dailyLimit={dailyLimit}
      />

      <div className="rounded-[24px] bg-white px-4 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <RitFormFieldText
          label={isMassRefill ? 'Сумма на 1 кампанию' : 'Сумма пополнения'}
          value={formatForDisplay(logic.refillAmount)}
          onChange={logic.handleBudgetChange}
          onBlur={logic.handleBudgetBlur}
          suffix="₽"
          autoFocus
          notice={logic.budgetNotice || undefined}
          hint={
            !logic.budgetNotice && isMassRefill
              ? `На каждую из ${massCount} ${getPlural(massCount, 'кампании', 'кампаний', 'кампаний')}`
              : undefined
          }
        />
        <div className="mt-3">
          <QuickAmountRow value={logic.currentBudgetValue} onPick={logic.setQuickAmount} />
        </div>
      </div>

      <div className="rounded-[24px] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <button
          type="button"
          onClick={() => logic.setUseBonuses(!logic.useBonuses)}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <div>
            <div className="text-[13px] font-semibold text-gray-900">Промобонусы</div>
            <div className="mt-0.5 text-[12px] tabular-nums text-gray-500">
              {formatForDisplay(TOTAL_PROMO_BONUS)} B на счету
            </div>
          </div>
          <span
            className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors ${
              logic.useBonuses ? 'bg-[#B45AFF]' : 'bg-[#E5E5EA]'
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                logic.useBonuses ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </span>
        </button>
        {logic.useBonuses ? <BonusExpanded logic={logic} /> : null}
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
}> = ({
  isOpen,
  onClose,
  onSave,
  currentBudget,
  campaignCount,
  dailyLimit = 0,
  showDailyLimitInfo = false,
  submitLabel,
}) => {
  const logic = useRefillLogic(isOpen);

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
        className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gray-900 text-[15px] font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {ctaLabel}
      </button>
    </div>
  );

  return (
    <RightSheetShell
      titleId="budget-refill-title"
      title="Пополнить"
      onClose={onClose}
      footer={footerCta}
    >
      <SummaryBody
        logic={logic}
        isMassRefill={isMassRefill}
        massCount={massCount}
        neededAmount={neededAmount}
        showDailyLimitInfo={showDailyLimitInfo}
        dailyLimit={dailyLimit}
      />
    </RightSheetShell>
  );
};
