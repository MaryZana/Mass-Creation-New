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

export type BudgetRefillCampaignItem = {
  id: string;
  productName: string;
  imageUrl?: string;
  nmId?: number;
};

type BonusPackage = {
  id: string;
  amount: number;
  maxPercent: number;
  expiry: string;
  displayBurn: string;
};

type BonusPackageSlice = {
  packageId: string;
  amount: number;
  maxPercent: number;
  expiry: string;
};

type CampaignBonusAlloc = {
  campaignId: string;
  bonusAmount: number;
  slices: BonusPackageSlice[];
};

function packageExpiryTs(expiry: string): number {
  const [d, m, y] = expiry.split('.').map(Number);
  return new Date(2000 + (y || 0), (m || 1) - 1, d || 1).getTime();
}

/**
 * На каждую кампанию — ровно один пакет.
 * Берём тот, с которого можно списать больше (при равенстве — с ближайшим expiry).
 */
function allocateBonusForBudgets(
  packages: readonly BonusPackage[],
  budgets: readonly number[],
  promoCap: number | null = null,
  campaignIds?: readonly string[],
): CampaignBonusAlloc[] {
  const pool = packages.map((pkg) => ({ ...pkg, left: pkg.amount }));
  let promoLeft =
    promoCap != null && Number.isFinite(promoCap)
      ? Math.max(0, promoCap)
      : Number.POSITIVE_INFINITY;

  return budgets.map((budget, index) => {
    const campaignId = campaignIds?.[index] ?? String(index);
    if (!Number.isFinite(budget) || budget <= 0 || promoLeft <= 0) {
      return { campaignId, bonusAmount: 0, slices: [] };
    }

    let best: {
      pkg: (typeof pool)[number];
      amount: number;
    } | null = null;

    for (const pkg of pool) {
      if (pkg.left <= 0) continue;
      const byPercent = Math.floor((budget * pkg.maxPercent) / 100);
      const amount = Math.min(pkg.left, byPercent, budget, promoLeft);
      if (amount <= 0) continue;
      if (
        !best ||
        amount > best.amount ||
        (amount === best.amount &&
          packageExpiryTs(pkg.expiry) < packageExpiryTs(best.pkg.expiry))
      ) {
        best = { pkg, amount };
      }
    }

    if (!best) {
      return { campaignId, bonusAmount: 0, slices: [] };
    }

    best.pkg.left -= best.amount;
    promoLeft -= best.amount;

    return {
      campaignId,
      bonusAmount: Math.floor(best.amount),
      slices: [
        {
          packageId: best.pkg.id,
          amount: Math.floor(best.amount),
          maxPercent: best.pkg.maxPercent,
          expiry: best.pkg.expiry,
        },
      ],
    };
  });
}

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
  aside,
}: {
  titleId: string;
  title: string;
  subtitle?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
  overlay?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/50" onClick={onClose} role="presentation">
      <div className="flex h-full w-full justify-end" onClick={onClose}>
        <div
          className="flex h-full max-h-full min-w-0 items-stretch gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 flex-col items-end justify-start gap-3 pt-5 pl-3">
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-500 shadow-md hover:bg-gray-50 hover:text-gray-700"
              aria-label="Закрыть"
            >
              <X className="h-5 w-5" />
            </button>
            {aside}
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
  bonusPickMode: 'auto' | 'manual';
  setBonusPickMode: (mode: 'auto' | 'manual') => void;
  canSubmit: boolean;
};

export type BudgetRefillInitialValues = {
  amount?: number;
  useBonuses?: boolean;
  bonusAmount?: number;
  packageId?: string;
  /** mass: 'auto' = все пакеты вместе; иначе ручной пакет */
  bonusPickMode?: 'auto' | 'manual';
  autoRefillEnabled?: boolean;
  autoThreshold?: number;
  autoAmount?: number;
  autoUseBonuses?: boolean;
  autoTimesPerDay?: number;
  autoExpiryDate?: string | null;
  /** Открыть блок автопополнения (например клик по чипу) */
  preferAutoRefill?: boolean;
};

function useRefillLogic(
  isOpen: boolean,
  options?: {
    availablePromoCap?: number | null;
    availableElsCap?: number | null;
    shareCount?: number;
    initialValues?: BudgetRefillInitialValues | null;
  },
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
  const shareCount = Math.max(1, options?.shareCount ?? 1);
  const initialValues = options?.initialValues ?? null;
  const perCampaignPromoCap =
    availablePromoCap != null
      ? Math.floor(availablePromoCap / shareCount)
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
  const [bonusPickMode, setBonusPickModeState] = useState<'auto' | 'manual'>('auto');
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
    if (!isOpen) return;
    const init = initialValues;
    const amount =
      init?.amount != null && Number.isFinite(init.amount) && init.amount > 0
        ? Math.floor(init.amount)
        : 3000;
    const pkgId =
      init?.packageId && packages.some((p) => p.id === init.packageId)
        ? init.packageId
        : fallbackPkg.id;
    const useBonus = Boolean(init?.useBonuses);
    const isMass = shareCount > 1 && packages.length > 1;
    const pickMode: 'auto' | 'manual' =
      init?.bonusPickMode === 'auto' || init?.bonusPickMode === 'manual'
        ? init.bonusPickMode
        : isMass && useBonus && !init?.packageId
          ? 'auto'
          : useBonus
            ? 'manual'
            : isMass
              ? 'auto'
              : 'manual';
    const times = init?.autoTimesPerDay;
    const freqMode: '1' | '2' | '3' | 'custom' =
      times === 1 || times === 2 || times === 3
        ? (String(times) as '1' | '2' | '3')
        : times != null && times > 3
          ? 'custom'
          : '1';
    const pkgForInit = packages.find((p) => p.id === pkgId) || fallbackPkg;
    const maxForPkg = Math.min(
      pkgForInit.amount,
      Math.floor((amount * pkgForInit.maxPercent) / 100),
      Math.max(0, amount),
      perCampaignPromoCap ?? Number.POSITIVE_INFINITY,
    );
    const maxForAuto =
      pickMode === 'auto' && isMass
        ? allocateBonusForBudgets(
            packages,
            Array.from({ length: shareCount }, () => amount),
            availablePromoCap,
          )[0]?.bonusAmount ?? maxForPkg
        : maxForPkg;

    setRefillAmount(String(amount));
    setUseBonuses(useBonus);
    setSelectedPkgId(pkgId);
    setBonusValue(Math.max(0, Math.floor(maxForAuto)));
    setBonusPickModeState(pickMode);
    setBudgetError('');
    setBudgetNotice('');
    setBonusNotice('');
    setAutoRefillEnabled(
      Boolean(init?.autoRefillEnabled) || Boolean(init?.preferAutoRefill),
    );
    setAutoThreshold(String(init?.autoThreshold ?? 1000));
    setAutoAmount(String(init?.autoAmount ?? 3000));
    setAutoUseBonuses(Boolean(init?.autoUseBonuses ?? useBonus));
    setAutoFrequencyMode(freqMode);
    setAutoFrequencyTimes(
      freqMode === 'custom' ? String(Math.max(1, Math.floor(times || 4))) : '4',
    );
    setAutoExpiryDate(init?.autoExpiryDate ?? null);
    // initialValues сравниваем по содержимому — объект с родителя часто новый на каждый рендер
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, fallbackPkg.id, JSON.stringify(initialValues ?? null), packages, shareCount]);

  const selectedPkg = useMemo(
    () => packages.find((p) => p.id === selectedPkgId) || fallbackPkg,
    [packages, selectedPkgId, fallbackPkg],
  );
  const currentBudgetValue = parseDisplayValue(refillAmount);
  const numericBonusValue = parseDisplayValue(String(bonusValue));
  const autoMode = bonusPickMode === 'auto' && packages.length > 1 && shareCount > 1;
  const maxBonusFromAll = useMemo(() => {
    const budgets = Array.from({ length: shareCount }, () => currentBudgetValue);
    const allocs = allocateBonusForBudgets(packages, budgets, availablePromoCap);
    return allocs[0]?.bonusAmount ?? 0;
  }, [packages, shareCount, currentBudgetValue, availablePromoCap]);
  const maxBonusAllowed = autoMode
    ? maxBonusFromAll
    : Math.min(
        selectedPkg.amount,
        Math.floor((currentBudgetValue * selectedPkg.maxPercent) / 100),
        Math.max(0, currentBudgetValue),
        perCampaignPromoCap ?? Number.POSITIVE_INFINITY,
      );
  const cashToPay = Math.max(
    0,
    currentBudgetValue - (useBonuses ? Math.min(numericBonusValue, currentBudgetValue) : 0),
  );

  const setBonusPickMode = (mode: 'auto' | 'manual') => {
    setBonusPickModeState(mode);
    if (mode === 'auto') {
      const budgets = Array.from({ length: shareCount }, () => currentBudgetValue);
      const allocs = allocateBonusForBudgets(packages, budgets, availablePromoCap);
      setBonusValue(allocs[0]?.bonusAmount ?? 0);
      setBonusNotice('');
      return;
    }
    const maxByPercent = Math.floor(
      (currentBudgetValue * selectedPkg.maxPercent) / 100,
    );
    const next = Math.min(
      currentBudgetValue,
      maxByPercent,
      selectedPkg.amount,
      perCampaignPromoCap ?? Number.POSITIVE_INFINITY,
    );
    setBonusValue(next);
    setBonusNotice('');
  };

  useEffect(() => {
    if (!autoMode || !useBonuses) return;
    setBonusValue(maxBonusFromAll);
    setBonusNotice('');
  }, [autoMode, useBonuses, maxBonusFromAll]);

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
    setUseBonuses: (v: boolean) => {
      setUseBonuses(v);
      if (!v) {
        setBonusPickModeState(shareCount > 1 ? 'auto' : 'manual');
        return;
      }
      setBonusValue(maxBonusAllowed);
      setBonusNotice('');
    },
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
      let nextBudget = parsed;
      if (Number.isNaN(parsed) || parsed < 1000) {
        nextBudget = 1000;
        setRefillAmount('1000');
        setBudgetNotice('Скорректировали до минимума — 1 000 ₽');
      } else if (parsed > maxAmount) {
        nextBudget = maxAmount;
        setRefillAmount(String(maxAmount));
        setBudgetNotice(
          `Скорректировали до максимума — ${formatForDisplay(maxAmount)} ₽`,
        );
      }
      if (useBonuses) {
        const nextMax = autoMode
          ? allocateBonusForBudgets(
              packages,
              Array.from({ length: shareCount }, () => nextBudget),
              availablePromoCap,
            )[0]?.bonusAmount ?? 0
          : Math.min(
              selectedPkg.amount,
              Math.floor((nextBudget * selectedPkg.maxPercent) / 100),
              Math.max(0, nextBudget),
              perCampaignPromoCap ?? Number.POSITIVE_INFINITY,
            );
        setBonusValue(nextMax);
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
    bonusPickMode,
    setBonusPickMode,
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

  const clearDate = () => {
    onChange(null);
    setOpen(false);
  };

  return (
    <div ref={rootRef}>
      <div className="inline-flex h-8 items-center rounded-lg bg-[#F2F2F7] text-[13px] font-semibold text-gray-800">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`inline-flex h-8 items-center gap-1.5 rounded-lg pl-2.5 transition-colors hover:bg-[#EBEBF0] ${
            value ? 'pr-1' : 'pr-2.5'
          }`}
        >
          <Calendar className="h-3.5 w-3.5 text-gray-500" />
          {value ? `до ${formatIsoDisplay(value)}` : 'Добавить'}
        </button>
        {value ? (
          <button
            type="button"
            onClick={clearDate}
            className="mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-gray-400 hover:bg-black/[0.06] hover:text-gray-700"
            aria-label="Убрать срок действия"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
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

function HoverCap({
  label,
  text,
}: {
  label: React.ReactNode;
  text: string;
}) {
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
      className="cursor-help"
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

function chooseBonusPackage(logic: RefillLogic, pkg: BonusPackage) {
  logic.setSelectedPkgId(pkg.id);
  const maxByPercent = Math.floor((logic.currentBudgetValue * pkg.maxPercent) / 100);
  logic.setBonusValue(Math.min(logic.currentBudgetValue, maxByPercent, pkg.amount));
  logic.clearBonusNotice();
}

function BonusPackagePercentTag({
  percent,
  active,
}: {
  percent: number;
  active: boolean;
}) {
  return (
    <span className="group/tag relative inline-flex">
      <span
        className={`inline-flex h-5 items-center rounded-md px-1.5 text-[11px] font-medium tabular-nums ${
          active ? 'bg-white/15 text-white' : 'bg-white text-gray-600'
        }`}
      >
        Пакет до {percent}%
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-20 mt-1.5 hidden w-[220px] rounded-xl bg-gray-900 px-3 py-2 text-left text-[12px] font-normal normal-case leading-4 text-white shadow-lg group-hover/tag:block"
      >
        Пакет промобонусов: с него можно списать до {percent}% от пополнения с единого счёта.
      </span>
    </span>
  );
}

function BonusPackageTile({
  pkg,
  active,
  onSelect,
}: {
  pkg: BonusPackage;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full self-start rounded-2xl px-3 py-3 text-left ${
        active ? 'bg-gray-950 text-white' : 'bg-[#F2F2F7] text-gray-900 hover:bg-[#EBEBF0]'
      }`}
    >
      <BonusPackagePercentTag percent={pkg.maxPercent} active={active} />
      <div className="mt-2 text-[16px] font-semibold leading-5 tabular-nums">
        {formatForDisplay(pkg.amount)}B
      </div>
      <div className={`mt-2 text-[12px] tabular-nums ${active ? 'text-white/45' : 'text-gray-400'}`}>
        {formatExpiryShort(pkg.expiry)}
      </div>
    </button>
  );
}

function BonusSpendField({ logic }: { logic: RefillLogic }) {
  return (
    <div>
      <RitFormFieldText
        value={formatForDisplay(logic.bonusValue)}
        onChange={logic.handleBonusChange}
        onBlur={logic.handleBonusBlur}
        suffix="B"
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
  );
}

/** Массовый режим: первый тайл — все бонусы (авто), дальше отдельные пакеты. */
function BonusUnitedPackageGrid({ logic }: { logic: RefillLogic }) {
  const unitedTotal = logic.packages.reduce((sum, pkg) => sum + pkg.amount, 0);
  const autoOn = logic.bonusPickMode === 'auto';

  return (
    <div>
      <div className="grid grid-cols-2 items-start gap-2 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => logic.setBonusPickMode('auto')}
          className={`w-full self-start rounded-2xl px-3 py-3 text-left ${
            autoOn ? 'bg-gray-950 text-white' : 'bg-[#F2F2F7] text-gray-900 hover:bg-[#EBEBF0]'
          }`}
        >
          <span className="group/tag relative inline-flex">
            <span
              className={`inline-flex h-5 items-center rounded-md px-1.5 text-[11px] font-medium ${
                autoOn ? 'bg-white/15 text-white' : 'bg-white text-gray-600'
              }`}
            >
              Все пакеты вместе
            </span>
            <span
              role="tooltip"
              className="pointer-events-none absolute left-0 top-full z-20 mt-1.5 hidden w-[220px] rounded-xl bg-gray-900 px-3 py-2 text-left text-[12px] font-normal normal-case leading-4 text-white shadow-lg group-hover/tag:block"
            >
              Все бонусы распределяются на кампании автоматически: один пакет на кампанию, без
              выбора суммы.
            </span>
          </span>
          <div className="mt-2 text-[16px] font-semibold leading-5 tabular-nums">
            {formatForDisplay(unitedTotal)}B
          </div>
          <div
            className={`mt-2 text-[12px] ${autoOn ? 'text-white/45' : 'text-gray-400'}`}
          >
            Без выбора суммы
          </div>
        </button>
        {logic.packages.map((pkg) => {
          const active = !autoOn && logic.selectedPkgId === pkg.id;
          return (
            <BonusPackageTile
              key={pkg.id}
              pkg={pkg}
              active={active}
              onSelect={() => {
                logic.setBonusPickMode('manual');
                chooseBonusPackage(logic, pkg);
              }}
            />
          );
        })}
      </div>
      {!autoOn ? (
        <div className="mt-3">
          <BonusSpendField logic={logic} />
        </div>
      ) : null}
    </div>
  );
}

function BonusPackagesAccounts({
  logic,
  isMassRefill = false,
}: {
  logic: RefillLogic;
  isMassRefill?: boolean;
}) {
  if (isMassRefill && logic.packages.length > 1) {
    return <BonusUnitedPackageGrid logic={logic} />;
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {logic.packages.map((pkg) => (
          <BonusPackageTile
            key={pkg.id}
            pkg={pkg}
            active={logic.selectedPkgId === pkg.id}
            onSelect={() => chooseBonusPackage(logic, pkg)}
          />
        ))}
      </div>
      <div className="mt-3">
        <BonusSpendField logic={logic} />
      </div>
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

function BonusExpanded({
  logic,
  isMassRefill = false,
}: {
  logic: RefillLogic;
  isMassRefill?: boolean;
}) {
  return (
    <div className="pt-3.5">
      <BonusPackagesAccounts logic={logic} isMassRefill={isMassRefill} />
    </div>
  );
}

function SummaryRow({
  logic,
  shareCount = 1,
  bonusTotal,
}: {
  logic: RefillLogic;
  shareCount?: number;
  /** Сумма промобонусов по всем кампаниям; иначе bonus × shareCount */
  bonusTotal?: number;
}) {
  const shares = Math.max(1, shareCount);
  const total = Math.max(0, logic.currentBudgetValue) * shares;
  const bonusPart =
    bonusTotal != null
      ? Math.max(0, bonusTotal)
      : (logic.useBonuses ? Math.min(logic.numericBonusValue, logic.currentBudgetValue) : 0) *
        shares;
  const cash = logic.cashToPay * shares;

  return (
    <div className="flex min-w-0 flex-1 items-end gap-8">
      <div>
        <div className="text-[13px] leading-4 text-gray-500">Промобонусы</div>
        <div className="mt-1 text-[17px] font-bold leading-6 tabular-nums text-gray-900">
          {formatForDisplay(bonusPart)} B
        </div>
      </div>
      <div>
        <div className="text-[13px] leading-4 text-gray-500">С единого счёта</div>
        <div className="mt-1 flex items-baseline gap-2 text-[17px] font-bold leading-6 tabular-nums">
          {bonusPart > 0 ? (
            <span className="text-[#63616C] line-through">{formatForDisplay(total)} ₽</span>
          ) : null}
          <span className="text-gray-900">{formatForDisplay(cash)} ₽</span>
        </div>
      </div>
    </div>
  );
}

function FooterTotals({
  logic,
  shareCount = 1,
  bonusTotal,
  label,
  disabled,
  onApply,
}: {
  logic: RefillLogic;
  shareCount?: number;
  bonusTotal?: number;
  label: string;
  disabled: boolean;
  onApply: () => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        disabled={disabled}
        onClick={onApply}
        className="inline-flex h-12 shrink-0 items-center justify-center rounded-2xl bg-[#9A41FE] px-5 text-[15px] font-semibold text-white transition-colors hover:bg-[#8A35EE] disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {label}
      </button>
      <SummaryRow logic={logic} shareCount={shareCount} bonusTotal={bonusTotal} />
    </div>
  );
}

function MassCampaignShareList({
  campaigns,
  perCampaign,
  bonusPart,
  allocations,
}: {
  campaigns: readonly BudgetRefillCampaignItem[];
  perCampaign: number;
  bonusPart: number;
  allocations?: readonly CampaignBonusAlloc[] | null;
}) {
  if (campaigns.length < 2) return null;
  const allocById = new Map((allocations ?? []).map((row) => [row.campaignId, row]));

  return (
    <div className="rounded-[24px] bg-white px-4 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="text-[17px] font-semibold text-gray-900">Распределение</div>
      <ul className="mt-3 divide-y divide-gray-100">
        {campaigns.map((item) => {
          const alloc = allocById.get(item.id);
          const rowBonus = alloc ? alloc.bonusAmount : bonusPart;
          const cashPart = Math.max(0, perCampaign - rowBonus);
          return (
            <li key={item.id} className="flex items-center gap-3 py-2.5">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-lg bg-[#F2F2F7] object-cover"
                />
              ) : (
                <div className="h-10 w-10 shrink-0 rounded-lg bg-[#F2F2F7]" />
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-medium leading-5 text-gray-900">
                  {item.productName}
                </div>
                {item.nmId != null ? (
                  <div className="mt-0.5 text-[12px] tabular-nums text-gray-400">Арт. {item.nmId}</div>
                ) : null}
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[14px] font-semibold tabular-nums text-gray-900">
                  {formatForDisplay(perCampaign)} ₽
                </div>
                {rowBonus > 0 ? (
                  <div className="mt-0.5 text-[12px] leading-4 tabular-nums text-gray-400">
                    {formatForDisplay(cashPart)} ₽ + {formatForDisplay(rowBonus)} B
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SummaryBody({
  logic,
  isMassRefill,
  neededAmount,
  showDailyLimitInfo,
  dailyLimit,
  wallet,
  shareCount = 1,
  campaigns = [],
}: {
  logic: RefillLogic;
  isMassRefill: boolean;
  neededAmount: number;
  showDailyLimitInfo: boolean;
  dailyLimit: number;
  wallet?: BudgetWalletContext | null;
  /** >1 — одна и та же сумма на каждую кампанию, лимит счёта делится поровну */
  shareCount?: number;
  campaigns?: readonly BudgetRefillCampaignItem[];
}) {
  const elsBalance = wallet?.elsBalance ?? UNIFIED_BALANCE;
  const elsReserved = wallet?.elsReserved ?? 0;
  const elsPool = Math.max(0, elsBalance - elsReserved);
  const shares = Math.max(1, shareCount ?? 1);
  const elsAvailable = Math.floor(elsPool / shares);
  const promoTotal = wallet?.promoTotal ?? logic.promoBonusTotal;
  const promoAvailable =
    wallet != null
      ? Math.max(0, wallet.promoTotal - wallet.promoAllocated)
      : logic.promoBonusTotal;
  const perCampaign = Math.max(0, logic.currentBudgetValue);
  const bonusPart = logic.useBonuses
    ? Math.min(logic.numericBonusValue, perCampaign)
    : 0;
  const autoAllocations =
    logic.useBonuses && logic.bonusPickMode === 'auto' && campaigns.length > 0
      ? allocateBonusForBudgets(
          logic.packages,
          campaigns.map(() => perCampaign),
          promoAvailable,
          campaigns.map((c) => c.id),
        )
      : null;

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
        />

        <p className="mt-1.5 text-[12px] leading-4 text-gray-400 tabular-nums">
          от 1 000{' '}
          <span className="group relative inline-flex cursor-help">
            до {formatForDisplay(elsAvailable)} ₽
            <span
              role="tooltip"
              className="pointer-events-none absolute left-0 top-full z-20 mt-1.5 hidden w-[260px] rounded-xl bg-gray-900 px-3 py-2 text-left text-[12px] font-normal normal-case leading-4 text-white shadow-lg group-hover:block"
            >
              {shares > 1
                ? `На счёте ${formatForDisplay(elsPool)} ₽. Поровну на ${shares} ${getPlural(shares, 'кампанию', 'кампании', 'кампаний')} — до ${formatForDisplay(elsAvailable)} ₽ на каждую.`
                : elsReserved > 0
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
          {logic.useBonuses ? (
            <BonusExpanded logic={logic} isMassRefill={isMassRefill} />
          ) : null}
        </div>
      </div>

      <AutoRefillBlock logic={logic} />

      {isMassRefill ? (
        <MassCampaignShareList
          campaigns={campaigns}
          perCampaign={perCampaign}
          bonusPart={bonusPart}
          allocations={autoAllocations}
        />
      ) : null}
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
  /** Товары/кампании для списка распределения при массовом пополнении */
  campaigns?: readonly BudgetRefillCampaignItem[];
  /** Текущие настройки кампании/выбора — подставляются при открытии */
  initialValues?: BudgetRefillInitialValues | null;
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
  campaigns = [],
  initialValues = null,
}) => {
  const availablePromoCap = walletContext
    ? Math.max(0, walletContext.promoTotal - walletContext.promoAllocated)
    : null;
  const availableElsCap = walletContext
    ? Math.max(0, walletContext.elsBalance - walletContext.elsReserved)
    : UNIFIED_BALANCE;
  const shareCount = campaignCount != null && campaignCount > 1 ? campaignCount : 1;
  const perCampaignElsCap = Math.floor(availableElsCap / shareCount);
  const logic = useRefillLogic(isOpen, {
    availablePromoCap,
    availableElsCap: perCampaignElsCap,
    shareCount,
    initialValues: {
      amount: initialValues?.amount ?? (currentBudget > 0 ? currentBudget : undefined),
      useBonuses: initialValues?.useBonuses,
      bonusAmount: initialValues?.bonusAmount,
      packageId: initialValues?.packageId,
      bonusPickMode: initialValues?.bonusPickMode,
      autoRefillEnabled: initialValues?.autoRefillEnabled,
      autoThreshold: initialValues?.autoThreshold,
      autoAmount: initialValues?.autoAmount,
      autoUseBonuses: initialValues?.autoUseBonuses,
      autoTimesPerDay: initialValues?.autoTimesPerDay,
      autoExpiryDate: initialValues?.autoExpiryDate,
      preferAutoRefill: initialValues?.preferAutoRefill,
    },
  });

  if (!isOpen) return null;

  const isMassRefill = campaignCount != null && campaignCount > 1;
  const tagCount = campaignCount != null && campaignCount > 0 ? campaignCount : 1;
  const neededAmount = dailyLimit > currentBudget ? dailyLimit - currentBudget : 0;
  const ctaLabel = submitLabel ?? (isMassRefill ? 'Применить' : 'Пополнить');
  const footerBonusTotal =
    logic.useBonuses && logic.bonusPickMode === 'auto' && shareCount > 1
      ? allocateBonusForBudgets(
          logic.packages,
          Array.from({ length: shareCount }, () => logic.currentBudgetValue),
          availablePromoCap,
        ).reduce((sum, row) => sum + row.bonusAmount, 0)
      : undefined;

  const footerCta = (
    <FooterTotals
      logic={logic}
      shareCount={shareCount}
      bonusTotal={footerBonusTotal}
      label={ctaLabel}
      disabled={!logic.canSubmit}
      onApply={() => {
        const raw = parseDisplayValue(logic.refillAmount);
        const maxPer = Math.max(0, perCampaignElsCap);
        const amount = Math.min(Number.isNaN(raw) ? 0 : Math.max(0, raw), maxPer);
        onSave(amount, buildSaveExtras(logic));
      }}
    />
  );

  const correctionMessage = logic.budgetNotice || logic.bonusNotice;

  return (
    <RightSheetShell
      titleId="budget-refill-title"
      title="Настройка бюджета"
      subtitle={
        tagCount > 1 ? (
          <span className="inline-flex h-6 items-center rounded-lg bg-white px-2 text-[13px] font-medium leading-4 text-gray-900">
            Для {tagCount} {getPlural(tagCount, 'кампании', 'кампаний', 'кампаний')}
          </span>
        ) : undefined
      }
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
        neededAmount={neededAmount}
        showDailyLimitInfo={showDailyLimitInfo}
        dailyLimit={dailyLimit}
        wallet={walletContext}
        shareCount={shareCount}
        campaigns={campaigns}
      />
    </RightSheetShell>
  );
};
