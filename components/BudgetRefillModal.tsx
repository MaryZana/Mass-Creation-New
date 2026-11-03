import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from './Icons';
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

export const WALLET_CONTEXT_VARIANTS = [
  { id: 'progress', label: '1', title: 'Прогресс занятости (нравится)' },
  { id: 'progressRemain', label: '2', title: 'Акцент на остатке + тонкий прогресс' },
  { id: 'progressCols', label: '3', title: 'Две колонки с прогрессом' },
  { id: 'progressPct', label: '4', title: 'Крупный % занятости' },
  { id: 'progressStack', label: '5', title: 'Двухцветный бар: занято / свободно' },
  { id: 'progressDraft', label: '6', title: 'Прогресс + черновик этой модалки' },
] as const;

export type WalletContextVariantId = (typeof WALLET_CONTEXT_VARIANTS)[number]['id'];

const WALLET_VARIANT_KEY = 'budget_refill_wallet_context_variant_v2';

function readWalletVariant(): WalletContextVariantId {
  try {
    const raw = sessionStorage.getItem(WALLET_VARIANT_KEY);
    if (WALLET_CONTEXT_VARIANTS.some((item) => item.id === raw)) {
      return raw as WalletContextVariantId;
    }
  } catch {
    /* ignore */
  }
  return 'progress';
}

function writeWalletVariant(id: WalletContextVariantId) {
  try {
    sessionStorage.setItem(WALLET_VARIANT_KEY, id);
  } catch {
    /* ignore */
  }
}

type BonusPackage = {
  id: string;
  amount: number;
  maxPercent: number;
  expiry: string;
  displayBurn: string;
};

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
  packages: readonly BonusPackage[];
  promoBonusTotal: number;
  selectedPkg: BonusPackage;
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

function useRefillLogic(
  isOpen: boolean,
  options?: { availablePromoCap?: number | null },
): RefillLogic {
  const { promoBonusTotal } = usePromoBonusDemo();
  const availablePromoCap =
    options?.availablePromoCap != null && Number.isFinite(options.availablePromoCap)
      ? Math.max(0, options.availablePromoCap)
      : null;
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

  const setQuickAmount = (amount: number) => {
    setRefillAmount(String(amount));
    if (useBonuses) {
      const maxByPercent = Math.floor((amount * selectedPkg.maxPercent) / 100);
      setBonusValue(
        Math.min(
          amount,
          maxByPercent,
          selectedPkg.amount,
          availablePromoCap ?? Number.POSITIVE_INFINITY,
        ),
      );
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
    packages,
    promoBonusTotal,
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
                  Списать можно до {pkg.maxPercent}% от суммы пополнения
                </div>
                <div className="mt-0.5 text-[12px] text-gray-500">
                  Доступно до {pkg.expiry}
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

function WalletVariantSwitcher({
  variant,
  onChange,
}: {
  variant: WalletContextVariantId;
  onChange: (id: WalletContextVariantId) => void;
}) {
  return createPortal(
    <div className="fixed bottom-5 left-1/2 z-[200] flex -translate-x-1/2 flex-col items-center gap-1.5">
      <span className="rounded-full bg-black/70 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
        Варианты: прогресс · 1 = выбранный
      </span>
      <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-white p-1 shadow-[0_8px_28px_rgba(0,0,0,0.18)]">
        {WALLET_CONTEXT_VARIANTS.map((item) => {
          const active = item.id === variant;
          return (
            <button
              key={item.id}
              type="button"
              title={item.title}
              onClick={() => onChange(item.id)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                active
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>,
    document.body,
  );
}

function WalletContextView({
  variant,
  wallet,
  thisBonus,
  thisCash,
}: {
  variant: WalletContextVariantId;
  wallet: BudgetWalletContext;
  thisBonus: number;
  thisCash: number;
}) {
  const promoLeft = Math.max(0, wallet.promoTotal - wallet.promoAllocated);
  const elsLeft = Math.max(0, wallet.elsBalance - wallet.elsReserved);
  const promoPct =
    wallet.promoTotal > 0
      ? Math.min(100, Math.round((wallet.promoAllocated / wallet.promoTotal) * 100))
      : 0;
  const elsPct =
    wallet.elsBalance > 0
      ? Math.min(100, Math.round((wallet.elsReserved / wallet.elsBalance) * 100))
      : 0;
  const promoDraftPct =
    wallet.promoTotal > 0
      ? Math.min(
          100 - promoPct,
          Math.round((Math.max(0, thisBonus) / wallet.promoTotal) * 100),
        )
      : 0;
  const elsDraftPct =
    wallet.elsBalance > 0
      ? Math.min(100 - elsPct, Math.round((Math.max(0, thisCash) / wallet.elsBalance) * 100))
      : 0;
  const promoFreePct = Math.max(0, 100 - promoPct);
  const elsFreePct = Math.max(0, 100 - elsPct);

  if (variant === 'progress') {
    return (
      <div className="space-y-3 rounded-[16px] bg-[#F7F7F8] px-3.5 py-3">
        <div>
          <div className="flex justify-between text-[12px]">
            <span className="text-gray-500">Промобонусы на кампаниях</span>
            <span className="font-semibold tabular-nums text-gray-900">
              {formatForDisplay(wallet.promoAllocated)} / {formatForDisplay(wallet.promoTotal)} B
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-[#B45AFF]" style={{ width: `${promoPct}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[12px]">
            <span className="text-gray-500">ЕЛС в резерве</span>
            <span className="font-semibold tabular-nums text-gray-900">
              {formatForDisplay(wallet.elsReserved)} / {formatForDisplay(wallet.elsBalance)} ₽
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-gray-900" style={{ width: `${elsPct}%` }} />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'progressRemain') {
    return (
      <div className="space-y-3 rounded-[16px] bg-[#F7F7F8] px-3.5 py-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-medium text-gray-500">Ещё доступно</div>
            <div className="mt-0.5 text-[18px] font-bold tabular-nums text-gray-900">
              {formatForDisplay(promoLeft)} B
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-medium text-gray-500">ЕЛС свободно</div>
            <div className="mt-0.5 text-[18px] font-bold tabular-nums text-gray-900">
              {formatForDisplay(elsLeft)} ₽
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div>
            <div className="mb-1 flex justify-between text-[11px] text-gray-400">
              <span>Занято бонусами</span>
              <span className="tabular-nums">{promoPct}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-[#B45AFF]" style={{ width: `${promoPct}%` }} />
            </div>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-[11px] text-gray-400">
              <span>Занято с ЕЛС</span>
              <span className="tabular-nums">{elsPct}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-gray-900" style={{ width: `${elsPct}%` }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'progressCols') {
    return (
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-[16px] bg-[#F7F7F8] px-3 py-3">
          <div className="text-[11px] font-medium text-gray-500">Промобонусы</div>
          <div className="mt-1 text-[14px] font-bold tabular-nums text-gray-900">
            {formatForDisplay(wallet.promoAllocated)} B
          </div>
          <div className="mt-0.5 text-[11px] tabular-nums text-gray-400">
            из {formatForDisplay(wallet.promoTotal)}
          </div>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-[#B45AFF]" style={{ width: `${promoPct}%` }} />
          </div>
          <div className="mt-1.5 text-[11px] tabular-nums text-gray-500">
            свободно {formatForDisplay(promoLeft)} B
          </div>
        </div>
        <div className="rounded-[16px] bg-[#F7F7F8] px-3 py-3">
          <div className="text-[11px] font-medium text-gray-500">Единый счёт</div>
          <div className="mt-1 text-[14px] font-bold tabular-nums text-gray-900">
            {formatForDisplay(wallet.elsReserved)} ₽
          </div>
          <div className="mt-0.5 text-[11px] tabular-nums text-gray-400">
            из {formatForDisplay(wallet.elsBalance)}
          </div>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-gray-900" style={{ width: `${elsPct}%` }} />
          </div>
          <div className="mt-1.5 text-[11px] tabular-nums text-gray-500">
            свободно {formatForDisplay(elsLeft)} ₽
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'progressPct') {
    return (
      <div className="rounded-[16px] bg-[#F7F7F8] px-3.5 py-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[11px] font-medium text-gray-500">Бонусы заняты</div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-[22px] font-bold tabular-nums leading-none text-gray-900">
                {promoPct}%
              </span>
              <span className="text-[11px] tabular-nums text-gray-400">
                {formatForDisplay(wallet.promoAllocated)} B
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-[#B45AFF]" style={{ width: `${promoPct}%` }} />
            </div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-gray-500">ЕЛС занят</div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-[22px] font-bold tabular-nums leading-none text-gray-900">
                {elsPct}%
              </span>
              <span className="text-[11px] tabular-nums text-gray-400">
                {formatForDisplay(wallet.elsReserved)} ₽
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-gray-900" style={{ width: `${elsPct}%` }} />
            </div>
          </div>
        </div>
        <div className="mt-3 flex justify-between border-t border-black/[0.04] pt-2 text-[11px] tabular-nums text-gray-500">
          <span>Свободно {formatForDisplay(promoLeft)} B</span>
          <span>Свободно {formatForDisplay(elsLeft)} ₽</span>
        </div>
      </div>
    );
  }

  if (variant === 'progressStack') {
    return (
      <div className="space-y-3 rounded-[16px] bg-[#F7F7F8] px-3.5 py-3">
        <div>
          <div className="flex justify-between text-[12px]">
            <span className="text-gray-500">Промобонусы</span>
            <span className="font-semibold tabular-nums text-gray-900">
              {formatForDisplay(wallet.promoAllocated)} · {formatForDisplay(promoLeft)} B
            </span>
          </div>
          <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-white">
            <div className="h-full bg-[#B45AFF]" style={{ width: `${promoPct}%` }} />
            <div className="h-full bg-[#D8D8DE]" style={{ width: `${promoFreePct}%` }} />
          </div>
          <div className="mt-1.5 flex gap-3 text-[11px] text-gray-400">
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B45AFF]" />
              на кампаниях
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D8D8DE]" />
              свободно
            </span>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[12px]">
            <span className="text-gray-500">Единый счёт</span>
            <span className="font-semibold tabular-nums text-gray-900">
              {formatForDisplay(wallet.elsReserved)} · {formatForDisplay(elsLeft)} ₽
            </span>
          </div>
          <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-white">
            <div className="h-full bg-gray-900" style={{ width: `${elsPct}%` }} />
            <div className="h-full bg-[#D8D8DE]" style={{ width: `${elsFreePct}%` }} />
          </div>
          <div className="mt-1.5 flex gap-3 text-[11px] text-gray-400">
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-900" />
              резерв
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D8D8DE]" />
              свободно
            </span>
          </div>
        </div>
      </div>
    );
  }

  // progressDraft
  return (
    <div className="space-y-3 rounded-[16px] bg-[#F7F7F8] px-3.5 py-3">
      <div>
        <div className="flex justify-between text-[12px]">
          <span className="text-gray-500">Промобонусы</span>
          <span className="font-semibold tabular-nums text-gray-900">
            {formatForDisplay(wallet.promoAllocated + Math.max(0, thisBonus))} /{' '}
            {formatForDisplay(wallet.promoTotal)} B
          </span>
        </div>
        <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-white">
          <div className="h-full bg-[#B45AFF]" style={{ width: `${promoPct}%` }} />
          <div className="h-full bg-[#D4A8FF]" style={{ width: `${promoDraftPct}%` }} />
        </div>
      </div>
      <div>
        <div className="flex justify-between text-[12px]">
          <span className="text-gray-500">ЕЛС</span>
          <span className="font-semibold tabular-nums text-gray-900">
            {formatForDisplay(wallet.elsReserved + Math.max(0, thisCash))} /{' '}
            {formatForDisplay(wallet.elsBalance)} ₽
          </span>
        </div>
        <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-white">
          <div className="h-full bg-gray-900" style={{ width: `${elsPct}%` }} />
          <div className="h-full bg-gray-400" style={{ width: `${elsDraftPct}%` }} />
        </div>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-400">
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[#B45AFF]" />
          уже на кампаниях
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[#D4A8FF]" />
          в этой модалке
        </span>
      </div>
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
  wallet,
  walletVariant,
}: {
  logic: RefillLogic;
  isMassRefill: boolean;
  massCount: number;
  neededAmount: number;
  showDailyLimitInfo: boolean;
  dailyLimit: number;
  wallet?: BudgetWalletContext | null;
  walletVariant: WalletContextVariantId;
}) {
  const thisBonus = logic.useBonuses
    ? Math.min(logic.numericBonusValue, logic.currentBudgetValue)
    : 0;
  const promoAvailable = wallet
    ? Math.max(0, wallet.promoTotal - wallet.promoAllocated)
    : logic.promoBonusTotal;

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
        {wallet ? (
          <div className="mt-4">
            <WalletContextView
              variant={walletVariant}
              wallet={wallet}
              thisBonus={thisBonus}
              thisCash={logic.cashToPay}
            />
          </div>
        ) : null}
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
              {formatForDisplay(promoAvailable)} B
              {wallet && wallet.promoAllocated > 0 ? (
                <span className="text-gray-400">
                  {' '}
                  · на кампаниях {formatForDisplay(wallet.promoAllocated)} B
                </span>
              ) : null}
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
  const logic = useRefillLogic(isOpen, { availablePromoCap });
  const [walletVariant, setWalletVariant] = useState<WalletContextVariantId>(readWalletVariant);

  if (!isOpen) return null;

  const massCount = campaignCount != null && campaignCount > 1 ? campaignCount : 0;
  const isMassRefill = massCount > 1;
  const neededAmount = dailyLimit > currentBudget ? dailyLimit - currentBudget : 0;
  const ctaLabel = submitLabel ?? (isMassRefill ? 'Применить' : 'Пополнить');
  const showWalletSwitcher = Boolean(walletContext);

  const changeWalletVariant = (id: WalletContextVariantId) => {
    writeWalletVariant(id);
    setWalletVariant(id);
  };

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
    <>
      {showWalletSwitcher ? (
        <WalletVariantSwitcher variant={walletVariant} onChange={changeWalletVariant} />
      ) : null}
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
          wallet={walletContext}
          walletVariant={walletVariant}
        />
      </RightSheetShell>
    </>
  );
};
