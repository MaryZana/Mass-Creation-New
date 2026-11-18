import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUp,
  Briefcase,
  Calendar,
  Check,
  ChevronDown,
  Coins,
  CreditCard,
  Download,
  Gift,
  HelpCircle,
  InfoCircleFill,
  Landmark,
  Menu,
  Monitor,
  Plus,
  Search,
  Smartphone,
  User,
  Wallet,
  X,
} from '../components/Icons';
import { UnifiedAccountInstructionModal } from '../components/UnifiedAccountInstructionModal';
import { FinanceBalanceModalVariant } from '../components/FinanceBalanceModalVariants';
import {
  FinanceBalanceChargeRow,
  formatPostponedPaymentsLabel,
} from '../components/FinanceBalanceStory';
import {
  BalanceDarkLabel,
  FinanceMoneyIconRows,
  financeUnifiedHasOwnHeader,
  readFinanceUnifiedVariant,
} from '../components/FinanceBalanceLabel';
import { useDismissibleHoverTooltip, useFeatureVideoGuide } from '../components/FeatureVideoGuide';
import { PROMOTION_ACCOUNT_BALANCE_BY_PROFILE } from '../components/AppHeader';
import { isSpecialContractorProfile, useProfile } from '../components/ProfileContext';
import {
  FinanceLocaleSwitcher,
  useFinanceLocale,
} from '../components/FinanceLocaleContext';
import {
  formatFinanceDay as formatFinanceDayLocale,
  formatFinanceDayHeading as formatFinanceDayHeadingLocale,
  formatFinanceInputDate as formatFinanceInputDateLocale,
  formatFinanceMoney,
  formatFinanceNumber,
  formatFinanceTableDate,
  getFinanceCurrencySymbol,
  localizeCampaignType,
  localizeDemoCampaignName,
  financeWeekdayLabels,
  getFinanceLocaleId,
  parseStoredFinanceDate,
  tFinance,
} from '../components/financeI18n';
import {
  ACTIVE_CONTRACTS,
  CONTRACT_BY_SOURCE,
  ContractKindTile,
  FinanceContractsPanel,
  MEDIA_BILLINGS,
  MEDIA_BILLING_LABEL,
  contractFullName,
  contractShortName,
  contractsTotals,
  type FinanceContract,
  type MediaBilling,
} from '../components/FinanceContracts';
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
  financeBalanceDuePostponedCharges,
  financeBalancePayoutDates,
  financeBalanceWeekChargeDate,
  financeBalanceWeekDate,
  financeBalanceWeekRangeLabel,
  readFinanceBalanceCurrentCase,
  readFinanceBalanceCurrentDay,
  readFinanceBalanceSimDay,
  readFinanceBalanceSimScenario,
  readFinanceBalanceSimAdjust,
  readFinanceBalanceSimPostpone,
  writeFinanceBalanceSimAdjust,
  writeFinanceBalanceSimPostpone,
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
import {
  isFinanceTopUpSheetOpen,
  openFinanceTopUp,
  subscribeFinanceTopUpSheetOpen,
} from '../utils/financeTopUpSheet';

const UNIFIED_ACCOUNT_VIDEO_SRC = '/videos/help-instruction-demo.mp4';

const FINANCE_TITLE_GUIDE = {
  title: 'Как работает счёт и баланс продвижения',
  duration: '4:12',
  src: UNIFIED_ACCOUNT_VIDEO_SRC,
} as const;

/** RITM RtChipsAction · cloudy / base / sm — без @dpa, как MultiSelect chipsAction */
const RITM_CHIPS_ACTION_CLASS =
  'inline-flex h-9 w-max items-center justify-between gap-1.5 whitespace-nowrap rounded-xl border-0 bg-[#F6F6F8] px-3 text-sm font-medium text-gray-900 transition-colors hover:bg-[#EEEEF1]';
const RITM_CHIPS_ACTION_SM_CLASS =
  'inline-flex h-7 w-max items-center justify-between gap-1 whitespace-nowrap rounded-lg border-0 bg-[#F6F6F8] px-2.5 text-xs font-medium text-gray-900';
const RITM_CHIPS_ACTION_OPEN_CLASS = 'bg-[#EEEEF1]';
const RITM_CHIPS_ACTION_SM_OPEN_CLASS = 'bg-[#EFEFF2]';
const RITM_CHIPS_CHEVRON_CLASS = 'h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200';
const RITM_CHIPS_CHEVRON_SM_CLASS = 'h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-200';
function ritmChipsActionClass(size: 'md' | 'sm' = 'md') {
  return size === 'sm' ? RITM_CHIPS_ACTION_SM_CLASS : RITM_CHIPS_ACTION_CLASS;
}
function ritmChipsActionOpenClass(size: 'md' | 'sm' = 'md') {
  return size === 'sm' ? RITM_CHIPS_ACTION_SM_OPEN_CLASS : RITM_CHIPS_ACTION_OPEN_CLASS;
}
function ritmChipsChevronClass(size: 'md' | 'sm' = 'md') {
  return size === 'sm' ? RITM_CHIPS_CHEVRON_SM_CLASS : RITM_CHIPS_CHEVRON_CLASS;
}
/** RITM RtFormFieldText · neutral / filling / sm */
const RITM_SEARCH_FIELD_CLASS =
  'h-9 w-full rounded-xl border border-transparent bg-[#F6F6F8] py-1.5 pl-9 pr-3 text-sm font-medium text-gray-900 outline-none transition-colors placeholder:text-gray-400 hover:bg-[#EEEEF1] focus:border-black focus:bg-white focus:ring-0';
/** RITM RtButton · cloudy / base / sm */
const RITM_BUTTON_CLOUDY_CLASS =
  'inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#F6F6F8] px-3 text-sm font-medium text-gray-900 transition-colors hover:bg-[#EEEEF1]';
const RITM_DROPDOWN_MENU_CLASS =
  'fixed z-[200] w-max overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-xl';

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
  size = 'md',
  presentation = 'menu',
  sheetContainer = null,
  clearValue,
  'aria-label': ariaLabel,
}: {
  value: string;
  onChange?: (value: string) => void;
  options: FinanceDropdownOption[];
  className?: string;
  menuClassName?: string;
  chip?: boolean;
  size?: 'md' | 'sm';
  presentation?: 'menu' | 'sheet';
  sheetContainer?: HTMLElement | null;
  /** Если задано и value !== clearValue — чип со сбросом (чёрный крестик) */
  clearValue?: string;
  'aria-label'?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const selected = options.find((opt) => opt.value === value) ?? options[0];
  const useSheet = presentation === 'sheet';
  const isFiltered = clearValue != null && value !== clearValue;

  useLayoutEffect(() => {
    if (useSheet || !open || !rootRef.current) {
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
  }, [open, useSheet]);

  useEffect(() => {
    if (!open || useSheet) return;
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
  }, [open, useSheet]);

  const pick = (next: string) => {
    onChange?.(next);
    setOpen(false);
  };

  const triggerClass = `${
    chip
      ? size === 'sm'
        ? 'inline-flex h-7 w-max items-center justify-between gap-1 whitespace-nowrap rounded-full bg-[#F6F6F8] px-2.5 text-xs font-medium text-gray-800'
        : 'inline-flex h-9 w-max items-center justify-between gap-1.5 whitespace-nowrap rounded-full bg-white px-3 text-sm font-medium text-gray-800 transition-colors hover:bg-[#F7F7F8]'
      : ritmChipsActionClass(size)
  } ${open ? ritmChipsActionOpenClass(size) : ''} ${
    isFiltered ? (size === 'sm' ? '!pr-1' : '!pr-1.5') : ''
  }`;

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      <div className={triggerClass}>
        <button
          type="button"
          aria-label={ariaLabel}
          aria-haspopup={useSheet ? 'dialog' : 'listbox'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={`inline-flex min-w-0 items-center gap-1 text-left ${
            isFiltered ? 'pr-1' : 'w-full justify-between'
          }`}
        >
          <span className="truncate">{selected?.label}</span>
          {!isFiltered ? (
            <ChevronDown
              className={`${ritmChipsChevronClass(size)} ${open ? 'rotate-180' : ''}`}
              aria-hidden
            />
          ) : null}
        </button>
        {isFiltered ? (
          <button
            type="button"
            aria-label="Сбросить"
            onClick={() => {
              onChange?.(clearValue);
              setOpen(false);
            }}
            className={`inline-flex shrink-0 items-center justify-center rounded-full bg-black text-white transition-opacity hover:opacity-80 ${
              size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
            }`}
          >
            <X className={size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'} aria-hidden />
          </button>
        ) : null}
      </div>

      {useSheet ? (
        <MobileSheet
          open={open}
          onClose={() => setOpen(false)}
          title={ariaLabel ?? 'Выбор'}
          container={sheetContainer}
        >
          <div className="overflow-hidden rounded-2xl bg-white" role="listbox" aria-label={ariaLabel}>
            {options.map((opt, index) => {
              const isSelected = opt.value === value;
              return (
                <React.Fragment key={opt.value}>
                  {opt.dividerBefore ? (
                    <div className="border-t border-gray-100" role="separator" />
                  ) : null}
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => pick(opt.value)}
                    className={`flex w-full items-center gap-3 px-4 py-3.5 text-left text-[15px] transition-colors active:bg-[#F2F2F7] ${
                      index > 0 && !opt.dividerBefore ? 'border-t border-gray-100' : ''
                    } ${isSelected ? 'font-semibold text-gray-900' : 'font-medium text-gray-900'}`}
                  >
                    <span className="min-w-0 flex-1">{opt.label}</span>
                    {isSelected ? <Check className="h-5 w-5 shrink-0 text-[#9A41FE]" aria-hidden /> : null}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </MobileSheet>
      ) : open && menuPos
        ? createPortal(
            <div
              ref={menuRef}
              style={{ top: menuPos.top, left: menuPos.left, minWidth: menuPos.width }}
              className={`${RITM_DROPDOWN_MENU_CLASS} ${menuClassName}`}
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
                      onClick={() => pick(opt.value)}
                      className={`flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${
                        isSelected ? 'bg-[#F3E8FF] font-medium text-gray-900' : 'text-gray-900'
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
                            <InfoCircleFill className="h-4 w-4" aria-hidden />
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

export type FinanceMultiQuickGroup = {
  label: string;
  items: { id: string; label: string; values: string[] }[];
};

/** Мультивыбор: пустой values = «все»; выбранные — чип «A + B» с крестиком */
function FinanceMultiDropdown({
  values,
  onChange,
  options,
  placeholder,
  className = '',
  size = 'md',
  presentation = 'menu',
  sheetContainer = null,
  searchable,
  quickGroups,
  'aria-label': ariaLabel,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  options: FinanceDropdownOption[];
  placeholder: string;
  className?: string;
  size?: 'md' | 'sm';
  presentation?: 'menu' | 'sheet';
  sheetContainer?: HTMLElement | null;
  /** Поиск в списке; по умолчанию включается от 8 опций */
  searchable?: boolean;
  /** Быстрый выбор группы опций чипом (например, все контракты типа КН) */
  quickGroups?: FinanceMultiQuickGroup[];
  'aria-label'?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(values);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const useSheet = presentation === 'sheet';
  const showSearch = searchable ?? options.length >= 8;
  const isFiltered = values.length > 0;
  const selectedLabels = options.filter((opt) => values.includes(opt.value)).map((opt) => opt.label);
  const q = query.trim().toLowerCase();
  const visibleOptions =
    showSearch && q
      ? options.filter(
          (opt) => opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q),
        )
      : options;

  useEffect(() => {
    if (open) {
      setDraft([...values]);
      setQuery('');
    }
  }, [open, values]);

  useEffect(() => {
    if (!open || !showSearch || useSheet) return;
    const id = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open, showSearch, useSheet]);

  useLayoutEffect(() => {
    if (useSheet || !open || !rootRef.current) {
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
  }, [open, useSheet]);

  useEffect(() => {
    if (!open || useSheet) return;
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
  }, [open, useSheet]);

  const toggle = (value: string) => {
    setDraft((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  };

  const apply = () => {
    onChange([...draft]);
    setOpen(false);
  };

  const resetDraft = () => {
    setDraft([]);
  };

  const cancel = () => {
    setDraft([...values]);
    setOpen(false);
  };

  const clear = () => {
    onChange([]);
    setDraft([]);
    setOpen(false);
  };

  const triggerClass = `${ritmChipsActionClass(size)} ${open ? ritmChipsActionOpenClass(size) : ''} ${
    isFiltered ? (size === 'sm' ? '!pr-1' : '!pr-1.5') : ''
  }`;

  const actions = (
    <div className={`flex items-center gap-2 ${useSheet ? '' : 'border-t border-gray-100 bg-gray-50 p-2'}`}>
      <button
        type="button"
        onClick={apply}
        className={
          useSheet
            ? 'h-11 flex-1 rounded-xl bg-black text-[15px] font-semibold text-white transition-colors active:bg-[#1A1A1A]'
            : 'rounded-lg bg-black px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-[#1A1A1A]'
        }
      >
        Применить
      </button>
      <button
        type="button"
        onClick={resetDraft}
        className={
          useSheet
            ? 'h-11 flex-1 rounded-xl bg-[#E9E9EE] text-[15px] font-semibold text-gray-900 transition-colors active:bg-[#DEDEE3]'
            : 'rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700'
        }
      >
        Сбросить
      </button>
    </div>
  );

  const optionsList = (sheet: boolean) =>
    visibleOptions.length === 0 ? (
      <p className={`mb-0 text-sm text-gray-400 ${sheet ? 'px-4 py-6 text-center' : 'px-3 py-4 text-center'}`}>
        Ничего не нашли
      </p>
    ) : (
      visibleOptions.map((opt, index) => {
        const isSelected = draft.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => toggle(opt.value)}
            className={
              sheet
                ? `flex w-full items-center gap-3 px-4 py-3.5 text-left text-[15px] transition-colors active:bg-[#F2F2F7] ${
                    index > 0 ? 'border-t border-gray-100' : ''
                  } ${isSelected ? 'font-semibold text-gray-900' : 'font-medium text-gray-900'}`
                : `flex w-full items-start gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${
                    isSelected ? 'bg-[#F3E8FF] font-medium text-gray-900' : 'text-gray-900'
                  }`
            }
          >
            {sheet ? (
              <>
                <span className="min-w-0 flex-1 whitespace-normal leading-snug">{opt.label}</span>
                {isSelected ? <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#9A41FE]" aria-hidden /> : null}
              </>
            ) : (
              <>
                <span className="mt-0.5 flex w-4 shrink-0 justify-center">
                  {isSelected ? <Check className="h-4 w-4 text-[#9A41FE]" aria-hidden /> : null}
                </span>
                <span className="min-w-0 flex-1 whitespace-normal leading-snug">{opt.label}</span>
              </>
            )}
          </button>
        );
      })
    );

  const searchField = showSearch ? (
    <div className={`shrink-0 ${useSheet ? 'mb-3' : 'border-b border-gray-100 p-2'}`}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          aria-hidden
        />
        <input
          ref={useSheet ? undefined : searchRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          placeholder="Поиск"
          aria-label="Поиск"
          className={`h-9 w-full border border-transparent bg-[#F6F6F8] py-1.5 pl-9 pr-8 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-black focus:bg-white [&::-webkit-search-cancel-button]:hidden ${
            useSheet ? 'rounded-xl' : 'rounded-lg'
          }`}
        />
        {query ? (
          <button
            type="button"
            aria-label="Очистить поиск"
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-gray-400 text-white"
          >
            <X className="h-3 w-3" />
          </button>
        ) : null}
      </div>
    </div>
  ) : null;

  const visibleGroups = (quickGroups ?? [])
    .map((group) => ({ ...group, items: group.items.filter((item) => item.values.length > 0) }))
    .filter((group) => group.items.length > 0);

  const quickGroupsBlock =
    visibleGroups.length > 0 ? (
      <div className={`shrink-0 space-y-2 ${useSheet ? 'mb-3' : 'border-b border-gray-100 px-3 py-2.5'}`}>
        {visibleGroups.map((group, index) => (
          <div key={group.label || `group-${index}`}>
            {group.label ? (
              <p className="mb-1 text-xs font-medium text-gray-500">{group.label}</p>
            ) : null}
            <div
              className="inline-flex h-8 w-full items-center gap-0.5 rounded-lg bg-[#F2F2F7] p-0.5"
              role="tablist"
              aria-label={group.label || ariaLabel}
            >
              {(() => {
                const siblingValues = group.items.flatMap((g) => g.values);
                const siblingSet = new Set(siblingValues);
                const selectedItem = group.items.find(
                  (item) =>
                    item.values.length > 0 && item.values.every((v) => draft.includes(v)),
                );
                const allActive = !selectedItem;
                const pickAll = () => {
                  setDraft((current) => current.filter((v) => !siblingSet.has(v)));
                };
                const pickItem = (item: (typeof group.items)[number]) => {
                  setDraft((current) => {
                    const withoutSiblings = current.filter((v) => !siblingSet.has(v));
                    return [...withoutSiblings, ...item.values];
                  });
                };
                return (
                  <>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={allActive}
                      onClick={(e) => {
                        e.stopPropagation();
                        pickAll();
                      }}
                      className={`h-7 min-w-0 flex-1 truncate rounded-md px-2 text-xs font-medium transition-colors ${
                        allActive
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      Все
                    </button>
                    {group.items.map((item) => {
                      const active = selectedItem?.id === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          onClick={(e) => {
                            e.stopPropagation();
                            pickItem(item);
                          }}
                          className={`h-7 min-w-0 flex-1 truncate rounded-md px-2 text-xs font-medium transition-colors ${
                            active
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-500 hover:text-gray-800'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </>
                );
              })()}
            </div>
          </div>
        ))}
      </div>
    ) : null;

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      <div className={triggerClass}>
        <button
          type="button"
          aria-label={ariaLabel}
          aria-haspopup={useSheet ? 'dialog' : 'listbox'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={`inline-flex min-w-0 items-center gap-1 text-left ${
            isFiltered ? 'pr-1' : 'w-full justify-between'
          }`}
        >
          <span className="truncate">
            {isFiltered ? formatMultiChipLabel(selectedLabels) : placeholder}
          </span>
          {!isFiltered ? (
            <ChevronDown
              className={`${ritmChipsChevronClass(size)} ${open ? 'rotate-180' : ''}`}
              aria-hidden
            />
          ) : null}
        </button>
        {isFiltered ? (
          <button
            type="button"
            aria-label="Сбросить"
            onClick={clear}
            className={`inline-flex shrink-0 items-center justify-center rounded-full bg-black text-white transition-opacity hover:opacity-80 ${
              size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
            }`}
          >
            <X className={size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'} aria-hidden />
          </button>
        ) : null}
      </div>

      {useSheet ? (
        <MobileSheet
          open={open}
          onClose={cancel}
          title={ariaLabel ?? placeholder}
          container={sheetContainer}
          footer={actions}
        >
          {searchField}
          {quickGroupsBlock}
          <div className="overflow-hidden rounded-2xl bg-white" role="listbox" aria-label={ariaLabel}>
            {optionsList(true)}
          </div>
        </MobileSheet>
      ) : open && menuPos
        ? createPortal(
            <div
              ref={menuRef}
              style={{
                top: menuPos.top,
                left: menuPos.left,
                minWidth: Math.max(menuPos.width, 280),
                maxWidth: 'min(420px, calc(100vw - 24px))',
              }}
              className={`${RITM_DROPDOWN_MENU_CLASS} !flex ${
                visibleGroups.length > 0
                  ? '!max-h-[min(460px,calc(100vh-24px))]'
                  : '!max-h-[min(320px,calc(100vh-24px))]'
              } !flex-col !overflow-hidden !p-0`}
              role="listbox"
              aria-label={ariaLabel}
              aria-multiselectable="true"
            >
              {searchField}
              {quickGroupsBlock}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1">{optionsList(false)}</div>
              {actions}
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
  size = 'md',
  presentation = 'menu',
  sheetContainer = null,
  clearValue,
}: {
  value: 'all' | TopupStatus;
  onChange: (value: 'all' | TopupStatus) => void;
  size?: 'md' | 'sm';
  presentation?: 'menu' | 'sheet';
  sheetContainer?: HTMLElement | null;
  clearValue?: 'all' | TopupStatus;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const selected = TOPUP_STATUS_OPTIONS.find((opt) => opt.value === value) ?? TOPUP_STATUS_OPTIONS[0];
  const useSheet = presentation === 'sheet';
  const isFiltered = clearValue != null && value !== clearValue;

  useLayoutEffect(() => {
    if (useSheet || !open || !rootRef.current) {
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
  }, [open, useSheet]);

  useEffect(() => {
    if (!open || useSheet) return;
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
  }, [open, useSheet]);

  const pick = (next: 'all' | TopupStatus) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <div className="relative w-max" ref={rootRef}>
      <div
        className={`${ritmChipsActionClass(size)} ${open ? ritmChipsActionOpenClass(size) : ''} ${
          isFiltered ? (size === 'sm' ? '!pr-1' : '!pr-1.5') : ''
        }`}
      >
        <button
          type="button"
          aria-label="Статус пополнения"
          aria-haspopup={useSheet ? 'dialog' : 'listbox'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={`inline-flex min-w-0 items-center gap-1 text-left ${
            isFiltered ? 'pr-1' : 'w-full justify-between'
          }`}
        >
          <span className="truncate">{selected.label}</span>
          {!isFiltered ? (
            <ChevronDown
              className={`${ritmChipsChevronClass(size)} ${open ? 'rotate-180' : ''}`}
              aria-hidden
            />
          ) : null}
        </button>
        {isFiltered ? (
          <button
            type="button"
            aria-label="Сбросить"
            onClick={() => {
              onChange(clearValue);
              setOpen(false);
            }}
            className={`inline-flex shrink-0 items-center justify-center rounded-full bg-black text-white transition-opacity hover:opacity-80 ${
              size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
            }`}
          >
            <X className={size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'} aria-hidden />
          </button>
        ) : null}
      </div>
      {useSheet ? (
        <MobileSheet
          open={open}
          onClose={() => setOpen(false)}
          title="Статус пополнения"
          container={sheetContainer}
        >
          <div className="overflow-hidden rounded-2xl bg-white" role="listbox" aria-label="Статус пополнения">
            {TOPUP_STATUS_OPTIONS.map((opt, index) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => pick(opt.value)}
                  className={`flex w-full items-center gap-3 px-4 py-3.5 text-left text-[15px] transition-colors active:bg-[#F2F2F7] ${
                    index > 0 ? 'border-t border-gray-100' : ''
                  } ${isSelected ? 'font-semibold text-gray-900' : 'font-medium text-gray-900'}`}
                >
                  <span className="min-w-0 flex-1">{opt.label}</span>
                  {isSelected ? <Check className="h-5 w-5 shrink-0 text-[#9A41FE]" aria-hidden /> : null}
                </button>
              );
            })}
          </div>
        </MobileSheet>
      ) : open && menuPos
        ? createPortal(
            <div
              ref={menuRef}
              style={{ top: menuPos.top, left: menuPos.left }}
              className={RITM_DROPDOWN_MENU_CLASS}
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
                    onClick={() => pick(opt.value)}
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

function FinanceTitleHelp({
  presentation = 'tooltip',
  sheetContainer = null,
}: {
  presentation?: 'tooltip' | 'sheet';
  sheetContainer?: HTMLElement | null;
}) {
  const { openGuide, modal: videoModal, isOpen: guideOpen } = useFeatureVideoGuide();
  const tip = useDismissibleHoverTooltip(guideOpen);
  const [sheetOpen, setSheetOpen] = useState(false);
  const firstGuide = FINANCE_TITLE_GUIDE;
  const useSheet = presentation === 'sheet';

  const openVideo = () => {
    if (useSheet) setSheetOpen(false);
    else tip.dismiss();
    openGuide({
      title: firstGuide.title,
      videoSrc: firstGuide.src,
      description: `Видеоинструкция · ${firstGuide.duration}`,
    });
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={useSheet ? undefined : tip.onMouseEnter}
      onMouseLeave={useSheet ? undefined : tip.onMouseLeave}
    >
      {videoModal}
      <button
        type="button"
        onClick={useSheet ? () => setSheetOpen(true) : undefined}
        className="inline-flex cursor-help items-center justify-center text-gray-400 transition-colors hover:text-gray-600"
        aria-label="Информация и видеоинструкция по финансам"
        aria-expanded={useSheet ? sheetOpen : tip.show}
        aria-haspopup={useSheet ? 'dialog' : undefined}
      >
        <HelpCircle className="h-4 w-4" />
      </button>
      {useSheet ? (
        <MobileSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title="История операций"
          container={sheetContainer}
        >
          <div className="rounded-2xl bg-white px-4 py-4">
            <p className="mb-0 text-[15px] leading-snug text-gray-900">
              Здесь счёт и баланс продвижения, промобонусы, история операций и возвраты. Видео поможет
              разобраться, как всё устроено.
            </p>
            <button
              type="button"
              onClick={openVideo}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F2F2F7] px-3 py-3 text-[15px] font-semibold text-gray-900 transition-colors active:bg-[#E8E8ED]"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white">
                <svg viewBox="0 0 24 24" className="ml-px h-2.5 w-2.5" fill="currentColor" aria-hidden>
                  <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l10.5-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14Z" />
                </svg>
              </span>
              Как работает
            </button>
          </div>
        </MobileSheet>
      ) : tip.show ? (
        <div className="absolute left-0 top-full z-40 pt-1.5">
          <div className="w-[17rem] rounded-xl bg-gray-900 px-3 py-2.5 text-left text-xs font-normal leading-snug text-white shadow-lg">
            <p>
              Здесь счёт и баланс продвижения, промобонусы, история операций и возвраты. Видео поможет
              разобраться, как всё устроено.
            </p>
            <button
              type="button"
              onClick={openVideo}
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

function FinanceMobileHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white">
      <div className="flex h-14 items-center justify-between gap-3 px-3">
        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F2F2F7] text-gray-900 transition-colors active:bg-[#E8E8ED]"
          aria-label="Открыть меню"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>

        <button
          type="button"
          className="inline-flex min-w-0 items-center gap-1.5 rounded-xl px-1.5 py-1.5 transition-colors active:bg-gray-50"
          aria-label="Раздел: продвижение"
          aria-haspopup="menu"
        >
          <span className="text-[17px] font-bold leading-none tracking-tight text-[#9A41FE]">wb</span>
          <span className="truncate text-[17px] font-bold leading-none tracking-tight text-gray-900">
            продвижение
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-900" aria-hidden />
        </button>

        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F2F2F7] text-gray-900 transition-colors active:bg-[#E8E8ED]"
          aria-label="Профиль"
        >
          <User className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </header>
  );
}

function FinanceHistoryMoreMenu() {
  return (
    <button
      type="button"
      className="ml-auto inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-black/[0.04] hover:text-gray-600"
      aria-label="Скачать Excel"
    >
      <Download className="h-4 w-4" aria-hidden />
    </button>
  );
}

const fmtRub = (n: number) => formatFinanceNumber(n);

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
    weeksAvgLabel: `(${formatFinanceMoney(balanceRub)} + ${formatFinanceMoney(balanceRub)} + ${formatFinanceMoney(balanceRub)}) ÷ 3`,
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

const FINANCE_CHANNEL_OPTIONS = (): { id: FinanceChannel; label: string }[] => [
  { id: 'promotion', label: tFinance('promotion') },
  { id: 'media', label: tFinance('media') },
  { id: 'wibes', label: tFinance('influence') },
];

const FINANCE_CHANNEL_LABEL: Record<FinanceChannel, string> = {
  get promotion() { return tFinance('promotion'); },
  get media() { return tFinance('media'); },
  get wibes() { return tFinance('influence'); },
};

function formatMultiChipLabel(labels: string[]): React.ReactNode {
  if (labels.length === 0) return null;
  return labels.map((label, index) => (
    <React.Fragment key={`${label}-${index}`}>
      {index > 0 ? <span className="font-medium text-gray-400"> + </span> : null}
      <span>{label}</span>
    </React.Fragment>
  ));
}

type MediaExpenseTag = 'pause' | 'fraud';

const MEDIA_EXPENSE_TAG_LABEL: Record<MediaExpenseTag, string> = {
  get pause() { return tFinance('pauseCharge'); },
  get fraud() { return tFinance('fraudCharge'); },
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

const FINANCE_TABLE_HEAD_ROW_CLASS = 'text-sm font-medium text-black';
/**
 * Липкая шапка: sticky только на th.
 * Отступ сверху — в padding самих th, иначе при «прилипании» шапка прыгает вверх.
 */
const FINANCE_TABLE_STICKY_HEAD_CLASS =
  '[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-white [&_th]:!pt-4 [&_th]:!pb-2.5 [&_th]:shadow-[inset_0_-1px_0_0_#E5E7EB]';
/** Белый блок таблицы: занимает оставшуюся высоту секции, скролл внутри; без pt — иначе sticky прыгает */
const FINANCE_TABLE_SCROLL_CLASS =
  'mt-3 min-h-0 flex-1 overflow-auto rounded-xl bg-white px-4 pb-4 sm:px-7 sm:pb-5';

const FINANCE_TABLE_BODY_CLASS = [
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
  Счёт: { Icon: Wallet, circle: 'bg-[#E8E8EA] text-black' },
  Баланс: { Icon: Coins, circle: 'bg-[#63616C] text-white' },
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

function localizeExpenseSource(source: string): string {
  if (source === 'Счёт') return tFinance('account');
  if (source === 'Баланс') return tFinance('balance');
  if (source === 'Промо бонусы' || source === 'Промо-бонусы') return tFinance('promoBonuses');
  if (source === 'Бонусы') return tFinance('bonuses');
  return source;
}

function expenseSourceOptionLabel(source: string) {
  const contract = CONTRACT_BY_SOURCE[source];
  return contract ? contractFullName(contract) : localizeExpenseSource(source);
}

function ExpenseSourceLabel({ source }: { source: string }) {
  const { locale } = useFinanceLocale();
  void locale;
  const item = EXPENSE_SOURCE_ICON[source as keyof typeof EXPENSE_SOURCE_ICON];
  const contract = CONTRACT_BY_SOURCE[source];
  const label = expenseSourceOptionLabel(source);
  return (
    <span className="inline-flex max-w-[22rem] items-start gap-2" title={label}>
      {contract ? (
        <span className="mt-0.5 shrink-0">
          <ContractKindTile contract={contract} size="sm" />
        </span>
      ) : item ? (
        <span
          className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${item.circle}`}
        >
          <item.Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
      ) : null}
      <span className={contract ? 'line-clamp-2 text-left leading-snug' : undefined}>{label}</span>
    </span>
  );
}

function buildDemoExpenses(): ExpenseRow[] {
  const start = new Date(2026, 7, 11);
  const dayCount = 36;
  const generated: ExpenseRow[] = [];
  let index = 0;

  for (let day = 0; day < dayCount; day += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() - day);
    const debitDate = date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
    // Обычно 5–6 списаний в день, иногда 7
    const perDay = 5 + (day % 3 === 0 ? 2 : day % 2);
    for (let slot = 0; slot < perDay; slot += 1) {
      const campaign = EXPENSE_CAMPAIGNS[(day * 5 + slot * 2) % EXPENSE_CAMPAIGNS.length];
      generated.push({
        id: `ex${index}`,
        ...campaign,
        debitDate,
        source: EXPENSE_SOURCES[(index + slot) % EXPENSE_SOURCES.length],
        amountRub: index === 0 ? 1 : 80 + ((index * 137 + slot * 41) % 9_200),
        documentNo: slot === 4 && day % 4 === 1 ? null : 5_820_000 + index,
        ...(slot === 3 && day % 6 === 2 ? { isCorrection: true } : {}),
      });
      index += 1;
    }
  }

  return [...generated, ...DEMO_WIBES_EXPENSES];
}

const DEMO_EXPENSES: ExpenseRow[] = buildDemoExpenses();

const PROMO_BONUS_SOURCE = 'Промо бонусы';

/** Списания спецконтрактника: с конкретного контракта своего канала или с промобонусов */
const SPECIAL_CONTRACTOR_EXPENSES: ExpenseRow[] = (() => {
  const byChannel = {
    promotion: ACTIVE_CONTRACTS.filter((c) => c.channel === 'promotion').map(contractShortName),
    media: ACTIVE_CONTRACTS.filter((c) => c.channel === 'media').map(contractShortName),
  };
  return DEMO_EXPENSES.filter((row) => row.channel !== 'wibes').map((row, index) => {
    const pool = byChannel[row.channel === 'media' ? 'media' : 'promotion'];
    const source =
      row.channel === 'promotion' && index % 5 === 2 ? PROMO_BONUS_SOURCE : pool[index % pool.length];
    return { ...row, source };
  });
})();

const SPECIAL_CONTRACTOR_EXPENSE_SOURCES: string[] = [
  PROMO_BONUS_SOURCE,
  ...ACTIVE_CONTRACTS.map(contractShortName),
];

const SPECIAL_CONTRACTOR_CHANNEL_OPTIONS = (): { id: FinanceChannel; label: string }[] => [
  { id: 'promotion', label: tFinance('promotion') },
  { id: 'media', label: tFinance('media') },
];

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
  get balance() {
    return tFinance('refundToBalance');
  },
  get bonuses() {
    return tFinance('refundToBonuses');
  },
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
  showFreeOnCampaigns = true,
}: {
  monthKey: string;
  title: string;
  total: number;
  variant: 'accrued' | 'spent';
  /** Месячный остаток на РК — один раз на месяц при дневной группировке */
  showFreeOnCampaigns?: boolean;
}) {
  const freeOnCampaignsRub = showFreeOnCampaigns ? DEMO_BUFFER_FREE_ON_CAMPAIGNS[monthKey] : undefined;
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
            {label} - <span className="tabular-nums">{formatFinanceMoney(amount)}</span>
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

/** Демо-сценарий баланса: неделя, день, потрачено и резерв */
function FinanceBalanceSimControls({
  simWeekId,
  onSimWeekChange,
  simDay,
  onSimDayChange,
  simAdjust,
  onSimAdjustChange,
}: {
  simWeekId: FinanceBalanceSimWeekId;
  onSimWeekChange: (id: FinanceBalanceSimWeekId) => void;
  simDay: number;
  onSimDayChange: (index: number) => void;
  simAdjust: FinanceBalanceSimAdjust;
  onSimAdjustChange: (value: FinanceBalanceSimAdjust) => void;
}) {
  const simView = buildFinanceBalanceSimView(simWeekId, simDay, simAdjust);
  return (
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
              onSimDayChange(0);
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
      <div className="flex flex-wrap items-center gap-1">
        <span className="px-1 text-xs text-gray-500">День</span>
        {FINANCE_BALANCE_WEEK_DAYS().map((label, index) => (
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
            <span className={`text-[10px] font-normal tabular-nums ${simDay === index ? 'text-white/60' : 'text-gray-500'}`}>
              {financeBalanceWeekDate(index, undefined, simView.weekOffset).split(' ')[0]}
            </span>
          </button>
        ))}
      </div>
      {(
        [
          { key: 'spent' as const, label: 'Потрачено', value: simView.spentThisWeekRub },
          { key: 'reserve' as const, label: 'Резерв в кампаниях', value: simView.reservePendingRub },
        ]
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
            [simView.weekId]: actions.filter((action) => action.kind !== item.key && action.kind !== 'release'),
          });
        const completeCampaigns = () => {
          if (simView.reservePendingRub <= 0) return;
          onSimAdjustChange({
            ...simAdjust,
            [simView.weekId]: [
              ...actions,
              { day: simDay, kind: 'release', rub: simView.reservePendingRub },
            ],
          });
        };
        return (
          <div key={item.key} className="flex flex-wrap items-center gap-1">
            <span className="px-1 text-xs text-gray-500">{item.label}</span>
            <span className="min-w-[4.5rem] px-1 text-xs font-semibold tabular-nums text-gray-900">
              {formatFinanceMoney(item.value)}
            </span>
            {item.key === 'reserve' ? (
              <>
                <button
                  type="button"
                  disabled={step <= 0}
                  title={step <= 0 ? 'На балансе больше нет денег' : 'Перевести с баланса в кампании'}
                  onClick={add}
                  className="rounded-lg bg-[rgba(74,74,89,0.08)] px-2.5 py-1.5 text-xs font-medium tabular-nums text-black transition-colors hover:bg-[rgba(74,74,89,0.12)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  +{formatFinanceMoney(FINANCE_BALANCE_SIM_STEP_RUB)}
                </button>
                {item.value > 0 ? (
                  <button
                    type="button"
                    title="Завершить кампании — резерв вернётся на баланс"
                    onClick={completeCampaigns}
                    className="rounded-lg bg-[rgba(74,74,89,0.08)] px-2.5 py-1.5 text-xs font-medium text-black transition-colors hover:bg-[rgba(74,74,89,0.12)]"
                  >
                    Завершить кампании
                  </button>
                ) : null}
                {item.value > 0 ? (
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-lg px-2 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-[rgba(74,74,89,0.08)]"
                  >
                    Сбросить
                  </button>
                ) : null}
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={step <= 0}
                  title={step <= 0 ? 'На балансе больше нет денег' : undefined}
                  onClick={add}
                  className="rounded-lg bg-[rgba(74,74,89,0.08)] px-2.5 py-1.5 text-xs font-medium tabular-nums text-black transition-colors hover:bg-[rgba(74,74,89,0.12)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  +{formatFinanceMoney(FINANCE_BALANCE_SIM_STEP_RUB)}
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
              </>
            )}
          </div>
        );
      })}
    </div>
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
            value: `${formatFinanceMoney(row.tuesdayRub)}`,
            label: 'Баланс, начисленный во вторник (75%)',
          },
          {
            value: `+ ${formatFinanceMoney(row.thursdayRub)}`,
            label: 'Баланс, начисленный в четверг (25%)',
          },
          {
            value: `- ${formatFinanceMoney(row.inCampaignsRub)}`,
            label: 'Зарезервировано на кампании',
          },
          {
            value: `= ${formatFinanceMoney(row.bufferLeftRub)}`,
            label: 'Осталось на балансе',
            tone: 'good' as const,
          },
        ]
      : [
          {
            value: `${formatFinanceMoney(row.tuesdayRub)}`,
            label: 'Баланс во вторник (75%)',
          },
          {
            value: `+ ${formatFinanceMoney(row.thursdayRub)}`,
            label: 'Баланс в четверг (25%)',
          },
          {
            value: `− ${formatFinanceMoney(row.inCampaignsRub)}`,
            label: 'В бюджетах кампаний',
          },
          {
            value: `= ${formatFinanceMoney(row.bufferLeftRub)}`,
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
                      {formatFinanceMoney(row.bufferLeftRub)}
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
                        {formatFinanceMoney(row.todayDay ? netWeek : row.tuesdayRub)}
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
                            {formatFinanceMoney(row.weekTotalRub)}
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
                            {formatFinanceMoney(row.inCampaignsRub)}
                          </span>
                        </div>
                        {row.inCampaignsRub > 0 ? (
                          <div className="flex items-baseline justify-between gap-4 border-b border-gray-100 py-3">
                            <span className="text-gray-900">Придёт на этой неделе</span>
                            <span className="shrink-0 font-semibold tabular-nums text-gray-900">
                              {formatFinanceMoney(netWeek)}
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
                                {formatFinanceMoney(amount)}
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
                                {formatFinanceMoney(row.tuesdayRub)}
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
                                {formatFinanceMoney(row.thursdayRub)}
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
                    {formatFinanceMoney(row.weekTotalRub)}
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
          {showStatusLayout && onSimWeekChange && onSimDayChange && onSimAdjustChange ? (
            <FinanceBalanceSimControls
              simWeekId={simWeekId}
              onSimWeekChange={onSimWeekChange}
              simDay={simDay}
              onSimDayChange={onSimDayChange}
              simAdjust={simAdjust}
              onSimAdjustChange={onSimAdjustChange}
            />
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

function FinanceBalancesCard({
  spend,
  simDemoOpen,
  mobile,
  sheetContainer,
}: {
  spend: BalanceSpend;
  simDemoOpen: boolean;
  mobile: boolean;
  sheetContainer: HTMLElement | null;
}) {
  const { t, locale, formatMoney } = useFinanceLocale();
  void locale;
  const navigate = useNavigate();
  const { profileId } = useProfile();
  const { promoBonusTotal } = usePromoBonusDemo();
  const accountRub = PROMOTION_ACCOUNT_BALANCE_BY_PROFILE[profileId];
  const [balanceCaseId] = useState<BalanceDemoCaseId>(readFinanceBalanceDemoCase);
  const [instructionOpen, setInstructionOpen] = useState(false);
  const [balanceSchemeOpen, setBalanceSchemeOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
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
  const changeSimWeek = (next: FinanceBalanceSimWeekId) => {
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
  };
  const changeSimDay = (next: number) => {
    setSimDay(next);
    writeFinanceBalanceSimDay(next);
  };
  const changeSimAdjust = (next: FinanceBalanceSimAdjust) => {
    setSimAdjust(next);
    writeFinanceBalanceSimAdjust(next);
  };
  const caseBalanceRub = BALANCE_DEMO_CASES.find((item) => item.id === balanceCaseId)?.amount ?? 0;
  /** В раскладке «Статус» карточка следует симуляции недель */
  const balanceRub = schemeLayout === 'status' ? simView.availableNowRub : caseBalanceRub;
  const labelTip = useDismissibleHoverTooltip(instructionOpen);
  const [helpSheetOpen, setHelpSheetOpen] = useState(false);
  const balanceSchemeData = balanceCurrentCaseRow(caseBalanceRub, currentCase, currentDay);
  const openInstruction = () => {
    labelTip.dismiss();
    setHelpSheetOpen(false);
    setInstructionOpen(true);
  };
  const unifiedVariant = readFinanceUnifiedVariant();
  const ownHeader = financeUnifiedHasOwnHeader(unifiedVariant);
  const unifiedLabel = (
    <div
      className="relative inline-flex w-fit cursor-help items-center gap-1.5"
      onMouseEnter={mobile ? undefined : labelTip.onMouseEnter}
      onMouseLeave={mobile ? undefined : labelTip.onMouseLeave}
    >
      <span className="text-sm font-medium text-gray-600">{t('unifiedAccount')}</span>
      <button
        type="button"
        onClick={
          mobile
            ? (event) => {
                event.stopPropagation();
                setHelpSheetOpen(true);
              }
            : undefined
        }
        className="inline-flex items-center justify-center text-gray-400 transition-colors hover:text-gray-600"
        aria-label={t('whatIsPromoAccount')}
        aria-expanded={mobile ? helpSheetOpen : labelTip.show}
        aria-haspopup={mobile ? 'dialog' : undefined}
      >
        <InfoCircleFill className="h-4 w-4" />
      </button>
      {mobile ? (
        <MobileSheet
          open={helpSheetOpen}
          onClose={() => setHelpSheetOpen(false)}
          title={t('unifiedAccount')}
          container={sheetContainer}
        >
          <div className="rounded-2xl bg-white px-4 py-4">
            <p className="mb-0 text-[15px] leading-snug text-gray-900">{t('unifiedHelp1')}</p>
            <p className="mb-0 mt-2 text-[15px] leading-snug text-gray-900">
              {t('unifiedHelp2')}
            </p>
            <button
              type="button"
              onClick={openInstruction}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F2F2F7] px-3 py-3 text-[15px] font-semibold text-gray-900 transition-colors active:bg-[#E8E8ED]"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white">
                <svg viewBox="0 0 24 24" className="ml-px h-2.5 w-2.5" fill="currentColor" aria-hidden>
                  <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l10.5-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14Z" />
                </svg>
              </span>
              {t('videoGuide')}
            </button>
          </div>
        </MobileSheet>
      ) : labelTip.show ? (
        <div className="absolute left-0 top-full z-50 pt-1.5">
          <div className="relative w-[17rem] rounded-xl bg-gray-900 px-3 py-2.5 text-left text-xs font-normal leading-snug text-white shadow-lg">
            <span
              className="absolute bottom-full left-4 border-x-[7px] border-b-[8px] border-x-transparent border-b-gray-900"
              aria-hidden
            />
            <p>{t('unifiedHelp1')}</p>
            <p className="mt-1.5">
              {t('unifiedHelp2')}
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
              {t('videoGuide')}
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

  useEffect(() => {
    setAccountOpen(false);
  }, [mobile]);

  const totalRub = accountRub + balanceRub;
  const modals = (
    <>
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
          onSimWeekChange={changeSimWeek}
          simDay={simDay}
          onSimDayChange={changeSimDay}
          simAdjust={simAdjust}
          onSimAdjustChange={changeSimAdjust}
          simScenarioId={simScenarioId}
          onSimScenarioChange={(next) => {
            setSimScenarioId(next);
            writeFinanceBalanceSimScenario(next);
          }}
          row={balanceSchemeData}
          onClose={() => setBalanceSchemeOpen(false)}
        />
      ) : null}
    </>
  );

  const accountBody = (
    <div className="flex flex-col">
      {ownHeader ? null : (
        <div className="flex shrink-0 items-center justify-between gap-3 px-0.5">
          {unifiedLabel}
          <button
            type="button"
            onClick={() => openFinanceTopUp()}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#9A41FE] text-white transition-colors hover:bg-[#8a38e8]"
            aria-label={t('topUpAccount')}
          >
            <Plus className="h-5 w-5" aria-hidden />
          </button>
        </div>
      )}

      <div className={ownHeader ? 'flex flex-col' : 'mt-3 flex flex-col'}>
        <FinanceMoneyIconRows
          variant={unifiedVariant}
          label={ownHeader ? unifiedLabel : undefined}
          accountRub={accountRub}
          balanceRub={balanceRub}
          onOpen={() => setBalanceSchemeOpen(true)}
          onTopUp={() => openFinanceTopUp()}
          balanceInSlot
          balanceSlot={
            <div className="rounded-xl bg-white">
              <FinanceBalanceModalVariant
                variant="feed"
                titleId="finance-balance-inline-title"
                view={simView}
                weekdayIndex={simDay}
                embedded
                compact
                cardLabel={<BalanceDarkLabel />}
                afterExpected={
                  <div className="mt-3">
                    <FinanceBalanceChargeRow view={simView} weekdayIndex={simDay} spend={spend} />
                  </div>
                }
              />
            </div>
          }
        />
      </div>
    </div>
  );

  const accountCard = (
    <div className="relative z-20 shrink-0 rounded-2xl bg-white p-1">
      {accountBody}
    </div>
  );

  const openAccount = () => setAccountOpen(true);
  const goBonuses = () => navigate('/bonuses');

  const compactStrip = (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={openAccount}
        className="flex min-w-0 items-center gap-2 rounded-2xl bg-white px-3 py-2.5 text-left transition-colors hover:bg-[#F7F7F8]"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[12px] font-medium text-gray-500">{t('unifiedAccount')}</span>
          <span className="mt-1 block text-[16px] font-bold leading-none tabular-nums text-gray-900">
            {formatFinanceMoney(totalRub)}
          </span>
          <span className="mt-1.5 space-y-0.5 text-[11px] leading-snug text-gray-500">
            <span className="block">{t('account')} {formatMoney(accountRub)}</span>
            <span className="block">{t('balance')} {formatMoney(balanceRub)}</span>
          </span>
        </span>
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-lg bg-[#F2F2F7] text-gray-900">
          <ChevronDown className="h-5 w-5" aria-hidden />
        </span>
      </button>
      <button
        type="button"
        onClick={goBonuses}
        className="flex min-w-0 items-center gap-2 rounded-2xl bg-white px-3 py-2.5 text-left transition-colors hover:bg-[#F7F7F8] active:bg-[#F2F2F7]"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[12px] font-medium text-gray-500">{t('promoBonuses')}</span>
          <span className="mt-1 block text-[16px] font-bold leading-none tabular-nums tracking-tight text-gray-900">
            {fmtRub(promoBonusTotal)} B
          </span>
        </span>
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-lg bg-[#F2F2F7] text-gray-900">
          <ArrowUpRightIcon className="h-4 w-4" />
        </span>
      </button>
    </div>
  );

  const simPanel =
    simDemoOpen && !balanceSchemeOpen ? (
      <div
        className="fixed bottom-[4.75rem] right-5 z-[240] w-[min(380px,calc(100vw-2rem))] rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5"
        role="group"
        aria-label="Демо: сценарий баланса"
      >
        <FinanceBalanceSimControls
          simWeekId={simWeekId}
          onSimWeekChange={changeSimWeek}
          simDay={simDay}
          onSimDayChange={changeSimDay}
          simAdjust={simAdjust}
          onSimAdjustChange={changeSimAdjust}
        />
      </div>
    ) : null;

  if (!mobile) {
    return (
      <>
        {modals}
        {accountCard}
        <div className="shrink-0">
          <FinancePromoBonusesCard />
        </div>
        {simPanel}
      </>
    );
  }

  return (
    <>
      {modals}
      {compactStrip}
      <MobileSheet
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        title={t('unifiedAccount')}
        container={sheetContainer}
      >
        {accountBody}
      </MobileSheet>
      {simPanel}
    </>
  );
}

function FinanceContractsCard({
  mobile,
  sheetContainer,
}: {
  mobile: boolean;
  sheetContainer: HTMLElement | null;
}) {
  const { t, formatContractCount, formatMoney } = useFinanceLocale();
  const navigate = useNavigate();
  const { promoBonusTotal } = usePromoBonusDemo();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [extendNotice, setExtendNotice] = useState<FinanceContract | null>(null);
  const totals = contractsTotals();

  useEffect(() => {
    setSheetOpen(false);
  }, [mobile]);

  const panel = (
    <FinanceContractsPanel
      showTitle
      presentation={mobile ? 'sheet' : 'menu'}
      sheetContainer={sheetContainer}
      onExtend={(contract) => setExtendNotice(contract)}
    />
  );

  const extendBody = extendNotice ? (
    <div className="rounded-2xl bg-white px-4 py-4">
      <p className="mb-0 text-[15px] font-medium leading-snug text-gray-900">{contractFullName(extendNotice)}</p>
      <p className="mb-0 mt-2 text-[15px] leading-snug text-gray-600">
        Чтобы продлить контракт и вернуть остаток {formatFinanceMoney(extendNotice.balanceRub)} в работу, напишите своему
        менеджеру.
      </p>
      <button
        type="button"
        onClick={() => setExtendNotice(null)}
        className="mt-4 h-11 w-full rounded-xl bg-black text-[15px] font-semibold text-white"
      >
        Понятно
      </button>
    </div>
  ) : null;

  const extendSheet = mobile ? (
    <MobileSheet
      open={extendNotice != null}
      onClose={() => setExtendNotice(null)}
      title={t('extendContract')}
      container={sheetContainer}
    >
      {extendBody}
    </MobileSheet>
  ) : extendNotice ? (
    createPortal(
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        <button
          type="button"
          aria-label={t('close')}
          onClick={() => setExtendNotice(null)}
          className="absolute inset-0 bg-black/40"
        />
        <div role="dialog" aria-label={t('extendContract')} className="relative w-full max-w-[420px] rounded-3xl bg-[#F6F6F8] p-2">
          <p className="mb-0 px-3 pb-2 pt-2 text-[17px] font-semibold text-gray-900">{t('extendContract')}</p>
          {extendBody}
        </div>
      </div>,
      document.body,
    )
  ) : null;

  if (!mobile) {
    return (
      <>
        <div className="relative z-20 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white p-1 pt-3.5 text-sm">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{panel}</div>
        </div>
        <div className="shrink-0">
          <FinancePromoBonusesCard />
        </div>
        {extendSheet}
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-[1.45fr_1fr] gap-2">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex min-w-0 items-center gap-2 rounded-2xl bg-white px-3 py-2.5 text-left transition-colors hover:bg-[#F7F7F8]"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] font-medium text-gray-500">{t('contractsSum')}</span>
            <span className="mt-1 block text-[16px] font-bold leading-none tabular-nums text-gray-900">
              {formatMoney(totals.totalRub)}
            </span>
            <span className="mt-1.5 block text-[11px] leading-snug text-gray-500">
              {formatContractCount(totals.activeCount)}
            </span>
          </span>
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-lg bg-[#F2F2F7] text-gray-900">
            <ChevronDown className="h-5 w-5" aria-hidden />
          </span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/bonuses')}
          className="flex min-w-0 items-center gap-2 rounded-2xl bg-white px-3 py-2.5 text-left transition-colors hover:bg-[#F7F7F8] active:bg-[#F2F2F7]"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] font-medium text-gray-500">{t('promoBonuses')}</span>
            <span className="mt-1 block text-[16px] font-bold leading-none tabular-nums tracking-tight text-gray-900">
              {fmtRub(promoBonusTotal)} B
            </span>
          </span>
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-lg bg-[#F2F2F7] text-gray-900">
            <ArrowUpRightIcon className="h-4 w-4" />
          </span>
        </button>
      </div>
      <MobileSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={`${t('contracts')} · ${formatMoney(totals.totalRub)}`}
        container={sheetContainer}
      >
        {panel}
      </MobileSheet>
      {extendSheet}
    </>
  );
}

function FinancePromoBonusesCard() {
  const navigate = useNavigate();
  const { t, locale, formatNumber } = useFinanceLocale();
  void locale;
  const { promoBonusTotal } = usePromoBonusDemo();
  return (
    <button
      type="button"
      onClick={() => navigate('/bonuses')}
      aria-label={t('goToPromoBonuses')}
      className="relative z-10 w-full rounded-2xl bg-white p-1 text-left transition-colors hover:bg-white"
    >
      <div className="rounded-xl bg-white px-3.5 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="relative z-20 flex min-w-0 items-center gap-1.5">
            <span className="text-sm font-medium text-gray-600">{t('promoBonuses')}</span>
            <span className="tooltip justify-start">
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                className="inline-flex text-gray-400 transition-colors hover:text-gray-600"
                aria-label={t('promoBonuses')}
              >
                <InfoCircleFill className="h-4 w-4" aria-hidden />
              </span>
              <span className="tooltip-text !bottom-auto !left-0 !top-full !z-50 !mt-1.5 !w-[17rem] !max-w-[17rem] !translate-x-0 !whitespace-normal !py-2.5 !px-3 !text-left text-xs !font-normal !leading-snug">
                {t('promoBonusesHelp')}
              </span>
            </span>
          </div>
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-gray-700 ring-1 ring-black/[0.06]">
            <ArrowUpRightIcon className="h-4 w-4" />
          </span>
        </div>
        <p className="mb-0 mt-3 text-[28px] font-bold leading-none tabular-nums tracking-tight text-gray-900">
          {formatNumber(promoBonusTotal)} B
        </p>
      </div>
    </button>
  );
}

type SpendScheduleRow = {
  id: string;
  period: string;
  spentRub: number;
  commission: string;
  chargeRub: number;
  chargeDate: string;
};

function SpendScheduleModal({
  onClose,
  rows,
}: {
  onClose: () => void;
  rows: readonly SpendScheduleRow[];
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
          {formatPostponedPaymentsLabel(rows.length)}
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
                <th className="pb-3 pr-4 text-right font-medium">Потрачено</th>
                <th className="pb-3 pr-4 font-medium">Комиссия</th>
                <th className="pb-3 pr-4 text-right font-medium">Спишем</th>
                <th className="pb-3 font-medium">Дата списания</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-4 pr-4 text-gray-900">{row.period}</td>
                  <td className="py-4 pr-4 text-right tabular-nums text-gray-900">{formatFinanceMoney(row.spentRub)}</td>
                  <td className="py-4 pr-4 tabular-nums text-gray-900">{row.commission}</td>
                  <td className="py-4 pr-4 text-right tabular-nums text-gray-900">{formatFinanceMoney(row.chargeRub)}</td>
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

type PostponeOptionId = 'w0' | 'w1' | 'w2' | 'w3' | 'w7';

type PostponeOption = {
  id: PostponeOptionId;
  weeksLater: number;
  feePercent: number;
  dateLabel: string;
  subLabel: string;
};

function buildPostponeOptions(weekOffset: number): PostponeOption[] {
  const defs: { id: PostponeOptionId; weeksLater: number; feePercent: number; subLabel: string }[] = [
    { id: 'w0', weeksLater: 0, feePercent: 0, subLabel: 'Воскресенье' },
    { id: 'w1', weeksLater: 1, feePercent: 1, subLabel: 'Через 1 неделю' },
    { id: 'w2', weeksLater: 2, feePercent: 1.5, subLabel: 'Через 2 недели' },
    { id: 'w3', weeksLater: 3, feePercent: 2, subLabel: 'Через 3 недели' },
    { id: 'w7', weeksLater: 7, feePercent: 4, subLabel: 'Через 7 недель' },
  ];
  return defs.map((item) => ({
    ...item,
    dateLabel: financeBalanceWeekDate(6, undefined, weekOffset + item.weeksLater),
  }));
}

function formatFeePercent(feePercent: number): string {
  return Number.isInteger(feePercent) ? String(feePercent) : feePercent.toLocaleString('ru-RU');
}

function PostponeChargeModal({
  spentRub,
  periodLabel,
  weekOffset,
  initialOptionId,
  onClose,
  onApply,
}: {
  spentRub: number;
  periodLabel: string;
  weekOffset: number;
  initialOptionId: PostponeOptionId;
  onClose: () => void;
  onApply: (option: PostponeOption) => void;
}) {
  const options = useMemo(() => buildPostponeOptions(weekOffset), [weekOffset]);
  const [selectedId, setSelectedId] = useState<PostponeOptionId>(initialOptionId);
  const [howOpen, setHowOpen] = useState(false);
  const selected = options.find((item) => item.id === selectedId) ?? options[0];
  const feeRub = Math.round((spentRub * selected.feePercent) / 100);
  const totalRub = spentRub + feeRub;

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
        className="relative w-full max-w-[720px] rounded-2xl bg-white px-5 py-5 shadow-2xl sm:px-7 sm:py-7"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="postpone-charge-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="Закрыть"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>

        <h2
          id="postpone-charge-title"
          className="max-w-[34rem] pr-10 text-[22px] font-bold leading-snug tracking-tight text-gray-900 sm:text-2xl"
        >
          Когда списать баланс, израсходованный на этой неделе
        </h2>

        <div className="mt-5 -mx-1 overflow-x-auto px-1 pb-1 pt-3">
          <div className="flex min-w-max gap-2.5">
            {options.map((option) => {
              const active = option.id === selected.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedId(option.id)}
                  className={`relative flex w-[124px] shrink-0 flex-col items-start rounded-2xl border px-3.5 py-3.5 text-left transition-colors ${
                    active
                      ? 'border-[#9A41FE] bg-[#F7F2FF]'
                      : 'border-transparent bg-[#F3F5F8] hover:bg-[#EBEDF1]'
                  }`}
                >
                  {active ? (
                    <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#9A41FE] px-2.5 py-1 text-[11px] font-medium leading-none text-white">
                      Выбрано
                    </span>
                  ) : null}
                  <span className="text-sm font-semibold text-gray-900">{option.dateLabel}</span>
                  <span className="mt-1 text-xs text-gray-500">{option.subLabel}</span>
                  <span
                    className={`mt-3 text-sm font-medium ${
                      option.feePercent === 0 ? 'text-[#16A34A]' : 'text-gray-900'
                    }`}
                  >
                    {option.feePercent === 0
                      ? 'Без комиссии'
                      : `${formatFeePercent(option.feePercent)}%`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5">
          <button
            type="button"
            onClick={() => setHowOpen((open) => !open)}
            className="flex w-full items-center justify-between gap-3 rounded-xl bg-[#F3F5F8] px-4 py-3 text-left text-sm text-gray-700 transition-colors hover:bg-[#EBEDF1]"
            aria-expanded={howOpen}
          >
            <span>
              Дату списания можно изменить в любой момент.{' '}
              <span className="font-medium text-gray-900">Как это работает?</span>
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${howOpen ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>
          {howOpen ? (
            <p className="mt-2 px-1 text-sm leading-relaxed text-gray-500">
              Расход за неделю списывается в выбранную дату. Чем позже дата, тем выше комиссия. Без
              комиссии — в ближайшее воскресенье. После применения дату можно сменить снова.
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <button
            type="button"
            onClick={() => onApply(selected)}
            className="inline-flex h-12 shrink-0 items-center justify-center rounded-xl bg-[#9A41FE] px-8 text-sm font-semibold text-white transition-colors hover:bg-[#8a38e8]"
          >
            Применить
          </button>
          <div className="min-w-0 text-sm sm:text-right">
            <p className="mb-0 text-gray-500">
              Расход за {periodLabel}:{' '}
              <span className="tabular-nums">{formatFinanceMoney(spentRub)}</span>
            </p>
            <p className="mb-0 mt-1 text-gray-500">
              {selected.feePercent === 0
                ? `${tFinance('commission')}: ${formatFinanceMoney(0)}`
                : `${tFinance('commission')} ${formatFeePercent(selected.feePercent)}%: ${formatFinanceMoney(feeRub)}`}
            </p>
            <p className="mb-0 mt-1.5 font-bold text-gray-900">
              Спишем {selected.dateLabel}:{' '}
              <span className="border-b border-dotted border-gray-400 tabular-nums">
                ~ {formatFinanceMoney(totalRub)}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function useBalanceSpend() {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [postponeOpen, setPostponeOpen] = useState(false);
  const [simWeekId, setSimWeekId] = useState(readFinanceBalanceSimWeek);
  const [simDay, setSimDay] = useState(readFinanceBalanceSimDay);
  const [simAdjust, setSimAdjust] = useState(readFinanceBalanceSimAdjust);
  const [postponeMap, setPostponeMap] = useState(readFinanceBalanceSimPostpone);

  useEffect(() => {
    const refresh = () => {
      setSimWeekId(readFinanceBalanceSimWeek());
      setSimDay(readFinanceBalanceSimDay());
      setSimAdjust(readFinanceBalanceSimAdjust());
      setPostponeMap(readFinanceBalanceSimPostpone());
    };
    window.addEventListener(FINANCE_BALANCE_SIM_EVENT, refresh);
    return () => window.removeEventListener(FINANCE_BALANCE_SIM_EVENT, refresh);
  }, []);

  const simView = buildFinanceBalanceSimView(simWeekId, simDay, simAdjust);
  const weekRange = financeBalanceWeekRangeLabel(undefined, simView.weekOffset);
  const periodLabel = `Расход на ${shortDayMonth(weekRange)}`;
  const spentRub = simView.spentThisWeekRub;
  const postponeOptions = useMemo(
    () => buildPostponeOptions(simView.weekOffset),
    [simView.weekOffset],
  );
  const savedPostpone = postponeMap[simWeekId];
  const postponed = Boolean(savedPostpone && savedPostpone.weeksLater > 0);
  const postponeOptionId = (savedPostpone?.optionId as PostponeOptionId | undefined) ?? 'w0';
  const activePostpone =
    postponeOptions.find((item) => item.id === postponeOptionId) ?? postponeOptions[0];
  const chargeDate = postponed
    ? activePostpone.dateLabel
    : financeBalanceWeekChargeDate(undefined, simView.weekOffset);
  const feePercent = postponed ? activePostpone.feePercent : 0;
  const feeRub = Math.round((spentRub * feePercent) / 100);
  const chargeRub = spentRub + feeRub;
  const dueFromEarlier = financeBalanceDuePostponedCharges(simWeekId, simAdjust, postponeMap);
  const dueFromEarlierRub = dueFromEarlier.reduce((sum, item) => sum + item.chargeRub, 0);
  const weekChargeDate = financeBalanceWeekChargeDate(undefined, simView.weekOffset);
  /** К оплате в воскресенье этой недели: свой расход (если не перенесён) + долги с прошлых недель */
  const weekChargeRub = (postponed ? 0 : chargeRub) + dueFromEarlierRub;

  const postponedScheduleRows: SpendScheduleRow[] = FINANCE_BALANCE_SIM_WEEKS.flatMap((week) => {
    const entry = postponeMap[week.id];
    if (!entry || entry.weeksLater <= 0) return [];
    const spent =
      week.id === simWeekId
        ? spentRub
        : buildFinanceBalanceSimView(week.id, 6, simAdjust).spentThisWeekRub;
    if (spent <= 0) return [];
    const fee = Math.round((spent * entry.feePercent) / 100);
    return [
      {
        id: `postpone-${week.id}`,
        period: financeBalanceWeekRangeLabel(undefined, week.weekOffset),
        spentRub: spent,
        commission: entry.feePercent > 0 ? `${entry.feePercent}%` : '—',
        chargeRub: spent + fee,
        chargeDate: financeBalanceWeekDate(6, undefined, week.weekOffset + entry.weeksLater),
      },
    ];
  });
  /** Только реально отложенные пользователем — без демо-строк графика */
  const scheduleRows: SpendScheduleRow[] = postponedScheduleRows;
  const postponedCount = postponedScheduleRows.length;

  const modals = (
    <>
      {scheduleOpen ? (
        <SpendScheduleModal onClose={() => setScheduleOpen(false)} rows={scheduleRows} />
      ) : null}
      {postponeOpen ? (
        <PostponeChargeModal
          spentRub={spentRub}
          periodLabel={weekRange}
          weekOffset={simView.weekOffset}
          initialOptionId={postponeOptionId}
          onClose={() => setPostponeOpen(false)}
          onApply={(option) => {
            const next = { ...readFinanceBalanceSimPostpone() };
            if (option.weeksLater > 0) {
              next[simWeekId] = {
                optionId: option.id,
                weeksLater: option.weeksLater,
                feePercent: option.feePercent,
              };
            } else {
              delete next[simWeekId];
            }
            writeFinanceBalanceSimPostpone(next);
            setPostponeOpen(false);
          }}
        />
      ) : null}
    </>
  );

  return {
    modals,
    periodLabel,
    spentRub,
    feePercent,
    feeRub,
    chargeRub,
    chargeDate,
    postponed,
    postponedCount,
    weekChargeRub,
    weekChargeDate,
    dueFromEarlier,
    openPostpone: () => setPostponeOpen(true),
    openSchedule: () => setScheduleOpen(true),
  };
}

type BalanceSpend = ReturnType<typeof useBalanceSpend>;

/** «8 ноября» → «8 нояб»; для zh/др. локалей не режем строку по-русски */
const shortDayMonth = (label: string) => {
  if (getFinanceLocaleId() !== 'ru') return label;
  const [day, month, ...rest] = label.split(' ');
  if (!month) return label;
  return [day, month.length > 4 ? month.slice(0, 4) : month, ...rest].join(' ');
};

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

const FINANCE_PERIOD_PRESETS = (): { id: FinancePeriodPreset; label: string }[] => [
  { id: 'all', label: tFinance('allPeriod') },
  { id: 'day', label: tFinance('day') },
  { id: 'week', label: tFinance('week') },
  { id: 'quarter', label: tFinance('quarter') },
  { id: 'year', label: tFinance('year') },
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
  return parseStoredFinanceDate(value);
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
  return formatFinanceDayLocale(date);
}

function formatFinancePeriodLabel(period: FinancePeriod): string {
  if (period.kind === 'all') return tFinance('selectPeriod');
  const from = startOfDay(period.from);
  const to = startOfDay(period.to);
  if (from.getTime() === to.getTime()) return formatFinanceDay(from);
  return `${formatFinanceDay(from)} — ${formatFinanceDay(to)}`;
}

function formatFinanceInputDate(date: Date): string {
  return formatFinanceInputDateLocale(date);
}

const FINANCE_WEEKDAYS = () => financeWeekdayLabels();

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
  size = 'md',
  presentation = 'menu',
  sheetContainer = null,
}: {
  value: FinancePeriod;
  onChange: (next: FinancePeriod) => void;
  size?: 'md' | 'sm';
  presentation?: 'menu' | 'sheet';
  sheetContainer?: HTMLElement | null;
}) {
  const { t, bcp47, locale } = useFinanceLocale();
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
  const useSheet = presentation === 'sheet';

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
    if (useSheet || !open || !rootRef.current) {
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
  }, [open, useSheet]);

  useEffect(() => {
    if (!open || useSheet) return;
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
  }, [open, useSheet]);

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
  const monthTitle = viewMonth.toLocaleDateString(bcp47, { month: 'long', year: 'numeric' });
  void locale; // re-render calendar labels when locale changes
  const nextMonthDisabled =
    viewMonth.getFullYear() === today.getFullYear() && viewMonth.getMonth() === today.getMonth();
  const rangeFrom = draftFrom && draftTo && draftFrom > draftTo ? draftTo : draftFrom;
  const rangeTo = draftFrom && draftTo && draftFrom > draftTo ? draftFrom : draftTo;
  const selectedPreset = activeFinancePreset(value, today);

  const pickerBody = (
    <>
      <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label={t('selectPeriod')}>
        {FINANCE_PERIOD_PRESETS().map((preset) => {
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
          aria-label={t('previousMonth')}
        >
          <ChevronDown className="h-4 w-4 rotate-90" aria-hidden />
        </button>
        <p className="text-sm font-semibold capitalize text-gray-900">{monthTitle}</p>
        <button
          type="button"
          disabled={nextMonthDisabled}
          onClick={() => setViewMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-[#F3F5F8] hover:text-gray-800 disabled:cursor-default disabled:text-gray-300 disabled:hover:bg-transparent"
          aria-label={t('nextMonth')}
        >
          <ChevronDown className="h-4 w-4 -rotate-90" aria-hidden />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7">
        {FINANCE_WEEKDAYS().map((label, index) => (
          <div
            key={`${label}-${index}`}
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
    </>
  );

  const isFiltered = value.kind !== 'all';

  return (
    <div className="relative w-max" ref={rootRef}>
      <div
        className={`${ritmChipsActionClass(size)} ${open ? ritmChipsActionOpenClass(size) : ''} ${
          isFiltered ? (size === 'sm' ? '!pr-1' : '!pr-1.5') : ''
        }`}
      >
        <button
          type="button"
          aria-label="Период"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={openPicker}
          className={`inline-flex min-w-0 items-center gap-1 text-left ${
            isFiltered ? 'pr-1' : 'w-full justify-between'
          }`}
        >
          <span className={`inline-flex min-w-0 items-center ${size === 'sm' ? 'gap-1' : 'gap-1.5'}`}>
            <Calendar
              className={`${size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} shrink-0 text-gray-400`}
              aria-hidden
            />
            <span className="truncate">{formatFinancePeriodLabel(value)}</span>
          </span>
          {!isFiltered ? (
            <ChevronDown
              className={`${ritmChipsChevronClass(size)} ${open ? 'rotate-180' : ''}`}
              aria-hidden
            />
          ) : null}
        </button>
        {isFiltered ? (
          <button
            type="button"
            aria-label="Сбросить период"
            onClick={() => {
              onChange({ kind: 'all' });
              setOpen(false);
            }}
            className={`inline-flex shrink-0 items-center justify-center rounded-full bg-black text-white transition-opacity hover:opacity-80 ${
              size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
            }`}
          >
            <X className={size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'} aria-hidden />
          </button>
        ) : null}
      </div>

      {useSheet ? (
        <MobileSheet
          open={open}
          onClose={() => setOpen(false)}
          title="Период"
          container={sheetContainer}
        >
          <div className="rounded-2xl bg-white p-3">{pickerBody}</div>
        </MobileSheet>
      ) : open && menuPos
        ? createPortal(
            <div
              ref={dialogRef}
              role="dialog"
              aria-label="Выбрать период"
              style={{ top: menuPos.top, left: menuPos.left }}
              className="fixed z-[200] w-[min(320px,calc(100vw-2rem))] rounded-xl border border-gray-100 bg-white p-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
            >
              {pickerBody}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function formatFinanceDayHeading(date: Date, showYear = false): string {
  return formatFinanceDayHeadingLocale(date, showYear);
}

function financeDayKey(value: string): string {
  const date = parseFinanceDate(value);
  if (!date) return 'unknown';
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function financeMonthKeyFromDayKey(dayKey: string): string {
  const parts = dayKey.split('-');
  if (parts.length < 2) return dayKey;
  return `${parts[0]}-${parts[1]}`;
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
  /** Группировать по дням даже при выбранном периоде */
  groupMonths?: boolean;
  renderMonthHeader?: (args: { key: string; title: string; total: number }) => React.ReactNode;
}) {
  const { t, locale } = useFinanceLocale();
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
  for (const row of sourceRows) {
    const key = financeDayKey(getDate(row));
    totals.set(key, (totals.get(key) ?? 0) + getAmount(row));
  }

  const titles = new Map<string, string>();
  let previousYear: number | null = null;
  for (const row of rows) {
    const key = financeDayKey(getDate(row));
    if (titles.has(key)) continue;
    const date = parseFinanceDate(getDate(row));
    if (!date) {
      titles.set(key, t('noDate'));
      continue;
    }
    const year = date.getFullYear();
    const showYear = previousYear != null && year !== previousYear;
    titles.set(key, formatFinanceDayHeading(date, showYear));
    previousYear = year;
  }
  void locale;

  let previousKey: string | null = null;
  return (
    <>
      {rows.map((row) => {
        const key = financeDayKey(getDate(row));
        const showDay = key !== previousKey;
        const separateFromPrevious = showDay && previousKey !== null;
        previousKey = key;
        const title = titles.get(key) ?? t('noDate');
        const total = totals.get(key) ?? 0;
        return (
          <React.Fragment key={rowKey(row)}>
            {showDay ? (
              <tr data-month-heading>
                <td colSpan={colSpan} className={separateFromPrevious ? 'px-4 pb-2 pt-6' : 'px-4 py-2'}>
                  {renderMonthHeader ? (
                    renderMonthHeader({ key, title, total })
                  ) : (
                    <div className="flex items-baseline gap-3">
                      <span className="text-base font-semibold text-gray-500">{title}</span>
                      <span className="whitespace-nowrap text-base font-semibold tabular-nums text-gray-900">
                        {formatFinanceMoney(total)}
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

type MobileOp = {
  key: string;
  date: string;
  amount: number;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  amountLabel: string;
  /** Серая подпись под суммой — откуда списание */
  amountCaption?: string;
  amountTone?: 'default' | 'positive' | 'muted';
  badge?: React.ReactNode;
  details: { label: string; value: React.ReactNode }[];
};

function MobileOpIcon({
  Icon,
  circle = 'bg-[#F2F2F7] text-gray-600',
}: {
  Icon: React.ComponentType<{ className?: string }>;
  circle?: string;
}) {
  return (
    <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${circle}`}>
      <Icon className="h-[18px] w-[18px]" aria-hidden />
    </span>
  );
}

const MOBILE_AMOUNT_TONE: Record<NonNullable<MobileOp['amountTone']>, string> = {
  default: 'text-gray-900',
  positive: 'text-[#12A150]',
  muted: 'text-gray-400',
};

/** Банковская лента: дни с итогом, белый список; тап — детали */
function FinanceMobileOpsList({
  ops,
  amountSuffix,
  onOpen,
  emptyHint,
}: {
  ops: MobileOp[];
  amountSuffix: string;
  onOpen: (op: MobileOp) => void;
  emptyHint?: string;
}) {
  const { t, locale } = useFinanceLocale();
  void locale;
  if (ops.length === 0) {
    return (
      <div className="rounded-2xl bg-white px-4 py-10 text-center">
        <p className="mb-0 text-[15px] font-medium text-gray-900">{t('nothingFound')}</p>
        <p className="mb-0 mt-1 text-[13px] text-gray-500">
          {emptyHint ?? t('emptyOps')}
        </p>
      </div>
    );
  }

  const groups: { key: string; title: string; total: number; ops: MobileOp[] }[] = [];
  let previousYear: number | null = null;
  const currentYear = new Date().getFullYear();
  for (const op of ops) {
    const key = financeDayKey(op.date);
    let group = groups[groups.length - 1];
    if (!group || group.key !== key) {
      const date = parseFinanceDate(op.date);
      let title = t('noDate');
      if (date) {
        const year = date.getFullYear();
        // Без года внутри текущего года. Год — на первом дне прошлого года
        // (в начале ленты или при переходе через границу лет).
        const showYear =
          (previousYear == null && year !== currentYear) ||
          (previousYear != null && year !== previousYear);
        title = formatFinanceDayHeading(date, showYear);
        previousYear = year;
      }
      group = { key, title, total: 0, ops: [] };
      groups.push(group);
    }
    group.total += op.amount;
    group.ops.push(op);
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section key={group.key}>
          <div className="mb-1.5 flex items-baseline justify-between">
            <h3 className="mb-0 text-[15px] font-semibold text-gray-900">{group.title}</h3>
            <span className="text-[13px] tabular-nums text-gray-500">
              {formatFinanceMoney(group.total)}
            </span>
          </div>
          <div className="-mx-3 overflow-hidden">
            {group.ops.map((op, index) => (
              <button
                key={op.key}
                type="button"
                onClick={() => onOpen(op)}
                className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors active:bg-[#F2F2F7] ${
                  index > 0 ? 'border-t border-gray-100' : ''
                }`}
              >
                {op.icon}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium leading-5 text-gray-900">{op.title}</span>
                  {op.subtitle ? (
                    <span className="mt-0.5 block truncate text-[13px] leading-[18px] text-gray-500">
                      {op.subtitle}
                    </span>
                  ) : null}
                </span>
                <span className="flex shrink-0 flex-col items-end gap-0.5">
                  <span
                    className={`text-[15px] font-semibold tabular-nums leading-5 ${
                      MOBILE_AMOUNT_TONE[op.amountTone ?? 'default']
                    }`}
                  >
                    {op.amountLabel}
                  </span>
                  {op.amountCaption ? (
                    <span className="max-w-[7.5rem] truncate text-[12px] leading-4 text-gray-500">
                      {op.amountCaption}
                    </span>
                  ) : null}
                  {op.badge}
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/** Шторка снизу внутри экрана телефона */
function MobileSheet({
  open,
  onClose,
  title,
  container,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  container: HTMLElement | null;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!open) return null;
  const sheet = (
    <div className={`${container ? 'absolute' : 'fixed'} inset-0 z-[150] flex flex-col justify-end`}>
      <button
        type="button"
        aria-label="Закрыть"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div
        role="dialog"
        aria-label={title}
        className="relative flex max-h-[88%] flex-col rounded-t-[28px] bg-[#F6F6F8] shadow-[0_-8px_32px_rgba(0,0,0,0.18)]"
      >
        <div className="flex justify-center pt-2">
          <span className="h-1 w-9 rounded-full bg-gray-300" aria-hidden />
        </div>
        <div className="flex items-center justify-between px-4 pb-2 pt-2">
          <h2 className="mb-0 text-[17px] font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#E9E9EE] text-gray-600"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>
        {footer ? <div className="border-t border-gray-200/70 bg-[#F6F6F8] px-4 pb-6 pt-3">{footer}</div> : null}
      </div>
    </div>
  );
  return createPortal(sheet, container ?? document.body);
}

const FINANCE_IPHONE_PREVIEW_KEY = 'finance_iphone_preview_v1';
/** iPhone 14 / 15 — CSS-пиксели */
const IPHONE_PREVIEW = { label: 'iPhone 14', width: 390, height: 844 } as const;

function readFinanceIphonePreview(): boolean {
  try {
    return sessionStorage.getItem(FINANCE_IPHONE_PREVIEW_KEY) === '1';
  } catch {
    return false;
  }
}

function writeFinanceIphonePreview(on: boolean) {
  try {
    sessionStorage.setItem(FINANCE_IPHONE_PREVIEW_KEY, on ? '1' : '0');
  } catch {
    /* ignore */
  }
}

const FinancePage: React.FC = () => {
  const { t, locale } = useFinanceLocale();
  void locale;
  const [mainTab] = useState<'my_money' | 'bonuses'>('my_money');
  const [iphonePreview, setIphonePreview] = useState(readFinanceIphonePreview);
  const [simDemoOpen, setSimDemoOpen] = useState(false);
  const [topUpSheetOpen, setTopUpSheetOpen] = useState(isFinanceTopUpSheetOpen);
  const mobile = iphonePreview;

  useEffect(() => subscribeFinanceTopUpSheetOpen(setTopUpSheetOpen), []);
  const [phoneScreenEl, setPhoneScreenEl] = useState<HTMLDivElement | null>(null);
  const [phoneScrollEl, setPhoneScrollEl] = useState<HTMLDivElement | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mobileOp, setMobileOp] = useState<MobileOp | null>(null);
  const balanceSpend = useBalanceSpend();
  const asideWidthClass = 'lg:w-[380px]';
  const [bufferSubTab, setBufferSubTab] = useState<'accrued' | 'spent'>('accrued');
  const [historySection, setHistorySection] = useState<'campaigns' | 'account' | 'balance' | 'bonuses'>(
    'campaigns',
  );
  const [campaignSubTab, setCampaignSubTab] = useState<'expenses' | 'campaign_topups' | 'pending_refunds'>(
    'expenses',
  );
  const [period, setPeriod] = useState<FinancePeriod>({ kind: 'all' });
  const [channels, setChannels] = useState<FinanceChannel[]>([]);
  const [mediaExpenseFilter, setMediaExpenseFilter] = useState<'all' | MediaExpenseTag>('all');
  const [mediaBillings, setMediaBillings] = useState<MediaBilling[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const { profileId } = useProfile();
  const specialContractor = isSpecialContractorProfile(profileId);
  const expenseSourceOptions = useMemo(() => {
    if (specialContractor) {
      if (channels.length === 0) return SPECIAL_CONTRACTOR_EXPENSE_SOURCES;
      return SPECIAL_CONTRACTOR_EXPENSE_SOURCES.filter((source) => {
        const contract = CONTRACT_BY_SOURCE[source];
        return contract ? channels.includes(contract.channel) : channels.includes('promotion');
      });
    }
    const onlyWibes = channels.length === 1 && channels[0] === 'wibes';
    if (onlyWibes) return [...WIBES_EXPENSE_SOURCES];
    if (channels.length === 0 || channels.includes('wibes')) {
      return Array.from(new Set([...EXPENSE_SOURCES, ...WIBES_EXPENSE_SOURCES]));
    }
    return [...EXPENSE_SOURCES];
  }, [channels, specialContractor]);
  const channelOptions = specialContractor
    ? SPECIAL_CONTRACTOR_CHANNEL_OPTIONS()
    : FINANCE_CHANNEL_OPTIONS();
  const historySectionOptions = (labels: { campaigns: string; account: string; bonuses: string }) => [
    { value: 'campaigns', label: labels.campaigns },
    ...(specialContractor ? [] : [{ value: 'account', label: labels.account }]),
    { value: 'bonuses', label: specialContractor ? 'Истёкшие бонусы' : labels.bonuses },
  ];
  const showMediaExpenseFilter = !specialContractor && channels.includes('media');
  const onlyWibesChannel = channels.length === 1 && channels[0] === 'wibes';
  const [topupStatus, setTopupStatus] = useState<'all' | TopupStatus>('all');
  const [topupMethodFilter, setTopupMethodFilter] = useState<'all' | TopupMethod>('all');
  const [refundFundsFilter, setRefundFundsFilter] = useState<'all' | PendingRefundFunds>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleExpenseCount, setVisibleExpenseCount] = useState(EXPENSE_PAGE_SIZE);
  const expenseSentinelRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [tableScrollEl, setTableScrollEl] = useState<HTMLDivElement | null>(null);
  const tableScrollRefCb = (node: HTMLDivElement | null) => {
    tableScrollRef.current = node;
    setTableScrollEl(node);
  };
  const observerRoot = mobile ? phoneScrollEl : tableScrollEl;
  const [visibleTopupCount, setVisibleTopupCount] = useState(EXPENSE_PAGE_SIZE);
  const topupSentinelRef = useRef<HTMLDivElement>(null);
  const isPendingRefunds = historySection === 'campaigns' && campaignSubTab === 'pending_refunds';
  const isTopups = historySection === 'account';
  const isBufferHistory = historySection === 'balance';
  const isExpenses = historySection === 'campaigns' && campaignSubTab === 'expenses';
  const isCampaignTopups = historySection === 'campaigns' && campaignSubTab === 'campaign_topups';
  const isExpiredBonuses = historySection === 'bonuses';
  const isCampaigns = historySection === 'campaigns';
  const showMediaBillingFilter = specialContractor && isExpenses && channels.includes('media');

  const setFinancePeriod = (next: FinancePeriod) => {
    setPeriod(next);
    setVisibleExpenseCount(EXPENSE_PAGE_SIZE);
    setVisibleTopupCount(EXPENSE_PAGE_SIZE);
  };

  useEffect(() => {
    setChannels([]);
    setSources([]);
    setMediaExpenseFilter('all');
    setMediaBillings([]);
    setVisibleExpenseCount(EXPENSE_PAGE_SIZE);
    setVisibleTopupCount(EXPENSE_PAGE_SIZE);
    if (specialContractor) {
      setHistorySection((section) => (section === 'account' || section === 'balance' ? 'campaigns' : section));
      setCampaignSubTab('expenses');
    }
  }, [specialContractor]);

  const filteredRows = (specialContractor ? SPECIAL_CONTRACTOR_EXPENSES : DEMO_EXPENSES).filter((row) => {
    if (channels.length > 0 && !channels.includes(row.channel)) return false;
    if (
      showMediaExpenseFilter &&
      mediaExpenseFilter !== 'all' &&
      row.channel === 'media' &&
      row.mediaTag !== mediaExpenseFilter
    ) {
      return false;
    }
    if (specialContractor && mediaBillings.length > 0 && row.channel === 'media') {
      const contract = CONTRACT_BY_SOURCE[row.source];
      if (!contract?.mediaBilling || !mediaBillings.includes(contract.mediaBilling)) return false;
    }
    if (sources.length > 0 && !sources.includes(row.source)) return false;
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
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setVisibleExpenseCount((count) => Math.min(count + EXPENSE_PAGE_SIZE, filteredRows.length));
      },
      { root: observerRoot, rootMargin: '280px 0px', threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [
    filteredRows.length,
    hasMoreExpenses,
    isPendingRefunds,
    isTopups,
    isExpiredBonuses,
    isCampaignTopups,
    visibleExpenseCount,
    observerRoot,
  ]);
  const periodTotal = filteredRows.reduce((sum, row) => sum + row.amountRub, 0);

  const filteredCampaignTopups = DEMO_CAMPAIGN_TOPUPS.filter((row) => {
    if (channels.length > 0 && !channels.includes(row.channel)) return false;
    if (sources.length > 0 && !sources.includes(row.source)) return false;
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
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setVisibleExpenseCount((count) =>
          Math.min(count + EXPENSE_PAGE_SIZE, filteredCampaignTopups.length),
        );
      },
      { root: observerRoot, rootMargin: '280px 0px', threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [
    filteredCampaignTopups.length,
    hasMoreCampaignTopups,
    isCampaignTopups,
    visibleExpenseCount,
    observerRoot,
  ]);

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
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setVisibleTopupCount((count) => Math.min(count + EXPENSE_PAGE_SIZE, filteredTopups.length));
      },
      { root: observerRoot, rootMargin: '280px 0px', threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [filteredTopups.length, hasMoreTopups, isTopups, visibleTopupCount, observerRoot]);

  const filteredPendingRefunds = DEMO_PENDING_REFUNDS.filter((row) => {
    if (channels.length > 0 && !channels.includes(row.channel)) return false;
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
      active ? 'bg-[#F0F0F2] text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
    }`;

  const resetPaging = () => {
    setVisibleExpenseCount(EXPENSE_PAGE_SIZE);
    setVisibleTopupCount(EXPENSE_PAGE_SIZE);
  };

  const changeHistorySection = (value: 'campaigns' | 'account' | 'balance' | 'bonuses') => {
    setHistorySection(value);
    setSources([]);
    resetPaging();
    if (value === 'campaigns') setCampaignSubTab('expenses');
    if (value === 'balance') setBufferSubTab('accrued');
  };

  const changeChannels = (next: string[]) => {
    const typed = next as FinanceChannel[];
    setChannels(typed);
    if (!typed.includes('media')) {
      setMediaExpenseFilter('all');
      setMediaBillings([]);
    }
    setSources([]);
    resetPaging();
  };

  const sourceQuickGroups: FinanceMultiQuickGroup[] | undefined =
    showMediaBillingFilter
      ? [
          {
            label: '',
            items: MEDIA_BILLINGS.map((id) => ({
              id,
              label: MEDIA_BILLING_LABEL[id],
              values: expenseSourceOptions.filter((s) => CONTRACT_BY_SOURCE[s]?.mediaBilling === id),
            })),
          },
        ]
      : undefined;

  const expenseOp = (row: ExpenseRow): MobileOp => {
    const icon = EXPENSE_SOURCE_ICON[row.source as keyof typeof EXPENSE_SOURCE_ICON];
    const contract = CONTRACT_BY_SOURCE[row.source];
    return {
      key: row.id ?? `${row.campaignId}-${row.debitDate}-${row.source}-${row.amountRub}`,
      date: row.debitDate,
      amount: row.amountRub,
      icon: contract ? (
        <MobileOpIcon
          Icon={Briefcase}
          circle={contract.channel === 'media' ? 'bg-[#F3E8FF] text-[#9A41FE]' : 'bg-[#E8F1FF] text-[#007AFF]'}
        />
      ) : (
        <MobileOpIcon Icon={icon?.Icon ?? Wallet} circle={icon?.circle} />
      ),
      title: localizeDemoCampaignName(row.campaignName),
      subtitle: `ID ${row.campaignId} · ${FINANCE_CHANNEL_LABEL[row.channel]}`,
      amountLabel: `−${formatFinanceMoney(row.amountRub)}`,
      amountCaption: CONTRACT_BY_SOURCE[row.source]
        ? contractFullName(CONTRACT_BY_SOURCE[row.source])
        : row.source,
      badge: row.mediaTag ? (
        <span className="rounded-md bg-[#F2F2F7] px-1.5 py-0.5 text-[11px] text-gray-600">
          {row.mediaTag === 'pause' ? 'Приостановка' : 'Фрод'}
        </span>
      ) : row.isCorrection ? (
        <span className="text-[11px] text-gray-400">Корректировка</span>
      ) : undefined,
      details: [
        { label: 'Кампания', value: row.campaignName },
        { label: 'ID кампании', value: <span className="tabular-nums">{row.campaignId}</span> },
        { label: 'Тип', value: row.campaignType },
        { label: 'Канал', value: FINANCE_CHANNEL_LABEL[row.channel] },
        ...(row.mediaTag ? [{ label: 'Тип списания', value: MEDIA_EXPENSE_TAG_LABEL[row.mediaTag] }] : []),
        { label: 'Дата списания', value: row.debitDate },
        { label: 'Источник', value: <ExpenseSourceLabel source={row.source} /> },
        { label: 'Номер документа', value: <CopyDocumentNo value={row.documentNo} /> },
      ],
    };
  };

  const mobileView: { ops: MobileOp[]; suffix: string; hasMore: boolean; sentinel: 'expense' | 'topup' | null } =
    (() => {
      if (isBufferHistory) {
        const rows = bufferSubTab === 'accrued' ? filteredBufferAccruals : filteredBufferSpends;
        return {
          suffix: getFinanceCurrencySymbol(),
          hasMore: false,
          sentinel: null,
          ops: rows.map((row) => {
            const spent = 'commissionPercent' in row;
            return {
              key: row.id,
              date: row.date,
              amount: row.amountRub,
              icon: <MobileOpIcon Icon={Coins} circle="bg-[#63616C] text-white" />,
              title: spent ? 'Списание с баланса' : 'Начисление на баланс',
              subtitle: `За ${row.periodLabel}`,
              amountLabel: `${spent ? '−' : '+'}${formatFinanceMoney(row.amountRub)}`,
              amountTone: spent ? 'default' : 'positive',
              details: [
                { label: spent ? 'Дата списания' : 'Дата начисления', value: row.date },
                { label: 'За период', value: row.periodLabel },
                ...(spent
                  ? [{ label: 'Комиссия', value: `${(row as { commissionPercent: number }).commissionPercent}%` }]
                  : []),
              ],
            } satisfies MobileOp;
          }),
        };
      }
      if (isTopups) {
        return {
          suffix: getFinanceCurrencySymbol(),
          hasMore: hasMoreTopups,
          sentinel: 'topup' as const,
          ops: visibleTopups.map((row) => {
            const icon = TOPUP_METHOD_ICON[row.method];
            const failed = row.status === 'failed';
            return {
              key: row.id,
              date: row.date,
              amount: failed ? 0 : row.amountRub,
              icon: <MobileOpIcon Icon={icon.Icon} circle={icon.circle} />,
              title: 'Пополнение счёта',
              subtitle: row.method,
              amountLabel: `+${formatFinanceMoney(row.amountRub)}`,
              amountTone: failed ? 'muted' : row.status === 'success' ? 'positive' : 'default',
              badge: row.status === 'success' ? undefined : <TopupStatusBadge status={row.status} />,
              details: [
                { label: 'Дата оплаты', value: row.date },
                { label: 'Статус', value: <TopupStatusBadge status={row.status} /> },
                { label: 'Способ оплаты', value: <TopupMethodLabel method={row.method} /> },
                { label: 'ИНН плательщика', value: <span className="tabular-nums">{row.inn}</span> },
              ],
            } satisfies MobileOp;
          }),
        };
      }
      if (isExpiredBonuses) {
        return {
          suffix: 'B',
          hasMore: false,
          sentinel: null,
          ops: filteredExpiredBonuses.map((row) => ({
            key: row.id,
            date: row.endsAt,
            amount: row.amountB,
            icon: <MobileOpIcon Icon={Gift} circle="bg-[#F3E8FF] text-[#9A41FE]" />,
            title: localizeDemoCampaignName(row.campaignName) ?? row.campaignType,
            subtitle: `ID ${fmtRub(row.campaignId)}${row.campaignName ? ` · ${localizeCampaignType(row.campaignType)}` : ''}`,
            amountLabel: `${fmtRub(row.amountB)} B`,
            details: [
              { label: 'Конец действия', value: row.endsAt },
              ...(row.campaignName ? [{ label: 'Кампания', value: row.campaignName }] : []),
              { label: 'ID кампании', value: <span className="tabular-nums">{fmtRub(row.campaignId)}</span> },
              { label: 'Тип', value: row.campaignType },
            ],
          })),
        };
      }
      if (isPendingRefunds) {
        return {
          suffix: getFinanceCurrencySymbol(),
          hasMore: false,
          sentinel: null,
          ops: filteredPendingRefunds.map((row) => ({
            key: String(row.campaignId),
            date: row.finishedAt,
            amount: row.amountRub,
            icon: <MobileOpIcon Icon={Coins} />,
            title: localizeDemoCampaignName(row.campaignName),
            subtitle: `${localizeCampaignType(row.campaignType)} · ${PENDING_REFUND_FUNDS_LABEL[row.funds]}`,
            amountLabel: `+${formatFinanceMoney(row.amountRub)}`,
            badge: <RefundStatusBadge status={row.status} />,
            details: [
              { label: 'Кампания', value: row.campaignName },
              { label: 'ID кампании', value: <span className="tabular-nums">{row.campaignId}</span> },
              { label: 'Тип', value: row.campaignType },
              { label: 'Куда вернём', value: PENDING_REFUND_FUNDS_LABEL[row.funds] },
              { label: 'Дата завершения', value: row.finishedAt },
              { label: 'Статус', value: <RefundStatusBadge status={row.status} /> },
              { label: 'Срок возврата', value: '≈ 5–7 дней' },
            ],
          })),
        };
      }
      if (isCampaignTopups) {
        return {
          suffix: getFinanceCurrencySymbol(),
          hasMore: hasMoreCampaignTopups,
          sentinel: 'expense' as const,
          ops: visibleCampaignTopups.map((row) => {
            const icon = EXPENSE_SOURCE_ICON[row.source as keyof typeof EXPENSE_SOURCE_ICON];
            return {
              key: row.id,
              date: row.date,
              amount: row.amountRub,
              icon: <MobileOpIcon Icon={icon?.Icon ?? Wallet} circle={icon?.circle} />,
              title: localizeDemoCampaignName(row.campaignName),
              subtitle: `ID ${row.campaignId} · ${FINANCE_CHANNEL_LABEL[row.channel]}`,
              amountLabel: `${formatFinanceMoney(row.amountRub)}`,
              amountCaption: row.source,
              details: [
                { label: 'Кампания', value: row.campaignName },
                { label: 'ID кампании', value: <span className="tabular-nums">{row.campaignId}</span> },
                { label: 'Канал', value: FINANCE_CHANNEL_LABEL[row.channel] },
                { label: 'Дата пополнения', value: row.date },
                { label: 'Источник', value: <ExpenseSourceLabel source={row.source} /> },
              ],
            } satisfies MobileOp;
          }),
        };
      }
      return {
        suffix: getFinanceCurrencySymbol(),
        hasMore: hasMoreExpenses,
        sentinel: 'expense' as const,
        ops: visibleExpenses.map(expenseOp),
      };
    })();

  const mobileToolbar = (
    <div className="mt-3 space-y-3">
      <div className="relative w-full">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          aria-hidden
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            resetPaging();
          }}
          placeholder={t('search')}
          aria-label={t('search')}
          className="h-9 w-full rounded-xl border border-transparent bg-[#F6F6F8] py-2 pl-9 pr-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-black"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="shrink-0">
          <FinancePeriodPicker
            value={period}
            onChange={setFinancePeriod}
            size="sm"
            presentation="sheet"
            sheetContainer={phoneScreenEl}
          />
        </div>
        <FinanceDropdown
          size="sm"
          presentation="sheet"
          sheetContainer={phoneScreenEl}
          aria-label={t('historyType')}
          value={
            historySection === 'account'
              ? 'account'
              : historySection === 'bonuses'
                ? 'bonuses'
                : 'campaigns'
          }
          onChange={(value) => {
            const next = value as 'campaigns' | 'account' | 'bonuses';
            changeHistorySection(next);
            if (next === 'campaigns') setCampaignSubTab('expenses');
          }}
          className="shrink-0"
          options={historySectionOptions({
            campaigns: t('campaignCharges'),
            account: t('account'),
            bonuses: t('expiredBonuses'),
          })}
        />
        {isExpenses && showMediaExpenseFilter ? (
          <FinanceDropdown
            size="sm"
            presentation="sheet"
            sheetContainer={phoneScreenEl}
            clearValue="all"
            aria-label={t('mediaChargeType')}
            value={mediaExpenseFilter}
            onChange={(value) => {
              setMediaExpenseFilter(value as 'all' | MediaExpenseTag);
              resetPaging();
            }}
            className="shrink-0"
            options={[
              { value: 'all', label: t('chargeType') },
              { value: 'pause', label: MEDIA_EXPENSE_TAG_LABEL.pause },
              { value: 'fraud', label: MEDIA_EXPENSE_TAG_LABEL.fraud },
            ]}
          />
        ) : null}
        {isPendingRefunds ? (
          <FinanceDropdown
            size="sm"
            presentation="sheet"
            sheetContainer={phoneScreenEl}
            clearValue="all"
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
                size="sm"
                presentation="sheet"
                sheetContainer={phoneScreenEl}
                clearValue="all"
                value={topupStatus}
                onChange={(value) => {
                  setTopupStatus(value);
                  resetPaging();
                }}
              />
            </div>
            <FinanceDropdown
              size="sm"
              presentation="sheet"
              sheetContainer={phoneScreenEl}
              clearValue="all"
              aria-label={t('paymentMethod')}
              value={topupMethodFilter}
              onChange={(value) => {
                setTopupMethodFilter(value as 'all' | TopupMethod);
                resetPaging();
              }}
              className="shrink-0"
              options={[
                { value: 'all', label: t('paymentMethod') },
                ...TOPUP_METHODS.map((method) => ({ value: method, label: method })),
              ]}
            />
          </>
        ) : null}
        {isExpenses || isCampaignTopups ? (
          <>
            <FinanceMultiDropdown
              size="sm"
              presentation="sheet"
              sheetContainer={phoneScreenEl}
              aria-label={t('channel')}
              placeholder={t('allChannels')}
              values={channels}
              onChange={changeChannels}
              className="shrink-0"
              options={channelOptions.map((item) => ({
                value: item.id,
                label: item.label,
              }))}
            />
            <FinanceMultiDropdown
              size="sm"
              presentation="sheet"
              sheetContainer={phoneScreenEl}
              aria-label={isCampaignTopups ? t('source') : t('chargeSource')}
              placeholder={t('allSources')}
              quickGroups={sourceQuickGroups}
              values={sources}
              onChange={(next) => {
                setSources(next);
                resetPaging();
              }}
              className="shrink-0"
              options={(isCampaignTopups ? EXPENSE_SOURCES : expenseSourceOptions).map((source) => ({
                value: source,
                label: expenseSourceOptionLabel(source),
              }))}
            />
          </>
        ) : isBufferHistory ? (
          <div
            className="inline-flex h-8 w-fit shrink-0 items-center gap-0.5 rounded-lg bg-white p-0.5"
            role="tablist"
            aria-label={t('balance')}
          >
            <button
              type="button"
              role="tab"
              aria-selected={bufferSubTab === 'accrued'}
              className={bufferSubTabClass(bufferSubTab === 'accrued')}
              onClick={() => setBufferSubTab('accrued')}
            >
              {t('accruals')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={bufferSubTab === 'spent'}
              className={bufferSubTabClass(bufferSubTab === 'spent')}
              onClick={() => setBufferSubTab('spent')}
            >
              {t('charges')}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );

  const mobileContent = (
    <div className="mt-3 pb-3">
      <FinanceMobileOpsList
        ops={mobileView.ops}
        amountSuffix={mobileView.suffix}
        onOpen={setMobileOp}
        emptyHint={
          isExpenses ? 'Ищите по номеру документа, а не по номеру УПД' : undefined
        }
      />
      {mobileView.hasMore ? (
        <div
          ref={mobileView.sentinel === 'topup' ? topupSentinelRef : expenseSentinelRef}
          className="h-8"
          aria-hidden
        />
      ) : null}
    </div>
  );

  const mobileSheets = mobile ? (
    <>
      <MobileSheet
        open={mobileOp != null}
        onClose={() => setMobileOp(null)}
        title="Операция"
        container={phoneScreenEl}
      >
        {mobileOp ? (
          <>
            <div className="flex flex-col items-center pb-5 pt-2 text-center">
              <div className="scale-125">{mobileOp.icon}</div>
              <p className="mb-0 mt-4 line-clamp-2 text-[15px] font-medium text-gray-600">{mobileOp.title}</p>
              <p
                className={`mb-0 mt-1 text-[30px] font-bold tabular-nums leading-tight ${
                  MOBILE_AMOUNT_TONE[mobileOp.amountTone ?? 'default']
                }`}
              >
                {mobileOp.amountLabel}
              </p>
              {mobileOp.badge ? <div className="mt-2">{mobileOp.badge}</div> : null}
            </div>
            <div className="overflow-hidden rounded-2xl bg-white">
              {mobileOp.details.map((item, index) => (
                <div
                  key={item.label}
                  className={`flex items-start justify-between gap-4 px-4 py-3 text-[15px] ${
                    index > 0 ? 'border-t border-gray-100' : ''
                  }`}
                >
                  <span className="shrink-0 text-gray-500">{item.label}</span>
                  <span className="min-w-0 text-right text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </MobileSheet>
    </>
  ) : null;

  const toggleIphonePreview = () => {
    setIphonePreview((prev) => {
      const next = !prev;
      writeFinanceIphonePreview(next);
      return next;
    });
  };

  useEffect(() => {
    const scrollRoot = mobile ? phoneScrollEl : null;
    const readTop = () => (scrollRoot ? scrollRoot.scrollTop : window.scrollY || document.documentElement.scrollTop);
    const onScroll = () => setShowScrollTop(readTop() > 280);
    onScroll();
    if (scrollRoot) {
      scrollRoot.addEventListener('scroll', onScroll, { passive: true });
      return () => scrollRoot.removeEventListener('scroll', onScroll);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [mobile, phoneScrollEl]);

  const scrollToTop = () => {
    if (mobile && phoneScrollEl) {
      phoneScrollEl.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const page = (
    <>
      {mobile ? <FinanceMobileHeader /> : null}
      <main
        className={
          mobile
            ? 'mx-auto w-full bg-[#F6F6F8] px-3 py-4'
            : 'mx-auto flex h-[calc(100vh-3.5rem)] w-full max-w-[1920px] flex-col overflow-hidden px-6 py-3'
        }
      >
      <div
        className={
          mobile
            ? 'flex flex-col gap-4'
            : 'flex min-h-0 flex-1 flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-6'
        }
      >
        <aside
          className={
            mobile
              ? 'flex w-full shrink-0 flex-col gap-3'
              : `flex h-full w-full shrink-0 flex-col gap-4 overflow-y-auto overflow-x-hidden ${asideWidthClass}`
          }
        >
          {balanceSpend.modals}
          {specialContractor ? (
            <FinanceContractsCard mobile={mobile} sheetContainer={phoneScreenEl} />
          ) : (
            <FinanceBalancesCard
              spend={balanceSpend}
              simDemoOpen={simDemoOpen}
              mobile={mobile}
              sheetContainer={phoneScreenEl}
            />
          )}
        </aside>

        <section
          className={
            mobile
              ? 'min-w-0 flex-1 overflow-hidden rounded-t-[20px] bg-white px-3 pt-4 pb-3'
              : 'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white p-1'
          }
        >
          <div className={mobile ? 'px-0 pt-0' : 'shrink-0 px-4 pt-4 sm:px-7 sm:pt-5'}>
            <div className="flex min-w-0 items-center gap-2">
              <h1
                className={`mb-0 font-bold leading-tight tracking-tight text-gray-900 ${
                  mobile ? 'text-[22px]' : 'text-[28px]'
                }`}
              >
                {t('operationsHistory')}
              </h1>
              <FinanceTitleHelp
                presentation={mobile ? 'sheet' : 'tooltip'}
                sheetContainer={phoneScreenEl}
              />
              <FinanceHistoryMoreMenu />
            </div>
          </div>

          {mobile && mainTab === 'my_money' ? (
            <>
              {mobileToolbar}
              {mobileContent}
            </>
          ) : mainTab === 'my_money' ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="mt-3 flex min-w-0 shrink-0 flex-wrap items-center gap-3 border-b border-gray-200 px-4 pb-4 sm:px-7">
                <div className="relative w-[16rem] shrink-0">
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
                    placeholder={t('search')}
                    aria-label={t('search')}
                    className={RITM_SEARCH_FIELD_CLASS}
                  />
                </div>
                <div className="shrink-0">
                  <FinancePeriodPicker value={period} onChange={setFinancePeriod} />
                </div>
                <FinanceDropdown
                  aria-label={t('historyType')}
                  value={historySection}
                  onChange={(value) => {
                    setHistorySection(value as 'campaigns' | 'account' | 'balance' | 'bonuses');
                    setSources([]);
                    setVisibleExpenseCount(EXPENSE_PAGE_SIZE);
                    setVisibleTopupCount(EXPENSE_PAGE_SIZE);
                    if (value === 'campaigns') setCampaignSubTab('expenses');
                    if (value === 'balance') setBufferSubTab('accrued');
                  }}
                  className="shrink-0"
                  options={historySectionOptions({
                    campaigns: t('campaignCharges'),
                    account: t('account'),
                    bonuses: t('bonusReturns'),
                  })}
                />
                {isExpenses && showMediaExpenseFilter ? (
                  <FinanceDropdown
                    aria-label={t('mediaChargeType')}
                    value={mediaExpenseFilter}
                    clearValue="all"
                    onChange={(value) => {
                      setMediaExpenseFilter(value as 'all' | MediaExpenseTag);
                      setVisibleExpenseCount(EXPENSE_PAGE_SIZE);
                    }}
                    className="shrink-0"
                    options={[
                      { value: 'all', label: t('chargeType') },
                      { value: 'pause', label: MEDIA_EXPENSE_TAG_LABEL.pause },
                      { value: 'fraud', label: MEDIA_EXPENSE_TAG_LABEL.fraud },
                    ]}
                  />
                ) : null}
                {isPendingRefunds ? (
                  <FinanceDropdown
                    aria-label={t('refundType')}
                    value={refundFundsFilter}
                    onChange={(value) => setRefundFundsFilter(value as 'all' | PendingRefundFunds)}
                    className="shrink-0"
                    options={[
                      { value: 'all', label: t('refundType') },
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
                      aria-label={t('paymentMethod')}
                      value={topupMethodFilter}
                      onChange={(value) => {
                        setTopupMethodFilter(value as 'all' | TopupMethod);
                        setVisibleTopupCount(EXPENSE_PAGE_SIZE);
                      }}
                      className="shrink-0"
                      options={[
                        { value: 'all', label: t('paymentMethod') },
                        ...TOPUP_METHODS.map((method) => ({ value: method, label: method })),
                      ]}
                    />
                  </>
                ) : null}
                {isExpenses || isCampaignTopups ? (
                  <>
                    <FinanceMultiDropdown
                      aria-label={t('channel')}
                      placeholder={t('allChannels')}
                      values={channels}
                      onChange={changeChannels}
                      className="shrink-0"
                      options={channelOptions.map((item) => ({
                        value: item.id,
                        label: item.label,
                      }))}
                    />
                    <FinanceMultiDropdown
                      aria-label={isCampaignTopups ? t('source') : t('chargeSource')}
                      placeholder={t('allSources')}
                      quickGroups={sourceQuickGroups}
                      values={sources}
                      onChange={(next) => {
                        setSources(next);
                        setVisibleExpenseCount(EXPENSE_PAGE_SIZE);
                      }}
                      className="shrink-0"
                      options={(isCampaignTopups ? [...EXPENSE_SOURCES] : expenseSourceOptions).map(
                        (source) => ({
                          value: source,
                          label: expenseSourceOptionLabel(source),
                        }),
                      )}
                    />
                  </>
                ) : isBufferHistory ? (
                  <div
                    className="inline-flex h-8 w-fit shrink-0 items-center gap-0.5 rounded-lg bg-white p-0.5"
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
                      {t('accruals')}
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={bufferSubTab === 'spent'}
                      className={bufferSubTabClass(bufferSubTab === 'spent')}
                      onClick={() => setBufferSubTab('spent')}
                    >
                      {t('charges')}
                    </button>
                  </div>
                ) : null}
              </div>

              <div ref={tableScrollRefCb} className={FINANCE_TABLE_SCROLL_CLASS}>
              {isBufferHistory ? (
                <>
              <div>
                {bufferSubTab === 'accrued' ? (
                  <table className="w-full min-w-[520px] border-separate border-spacing-0 text-left text-sm">
                    <thead className={FINANCE_TABLE_STICKY_HEAD_CLASS}>
                      <tr className={FINANCE_TABLE_HEAD_ROW_CLASS}>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">{t('dateAccrual')}</th>
                        <th className="whitespace-nowrap px-3 py-2 text-right text-sm font-medium">{t('amount')}</th>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">{t('forPeriod')}</th>
                      </tr>
                    </thead>
                    <tbody className={FINANCE_TABLE_BODY_CLASS}>
                      {(() => {
                        const freeShownForMonth = new Set<string>();
                        return (
                      <FinanceMonthGroups
                        rows={filteredBufferAccruals}
                        sourceRows={filteredBufferAccruals}
                        period={period}
                        colSpan={3}
                        amountSuffix={getFinanceCurrencySymbol()}
                        groupMonths
                        renderMonthHeader={({ key, title, total }) => {
                          const monthKey = financeMonthKeyFromDayKey(key);
                          const showFree = !freeShownForMonth.has(monthKey);
                          if (showFree) freeShownForMonth.add(monthKey);
                          return (
                          <BufferMonthStatsBlock
                            monthKey={monthKey}
                            title={title}
                            total={total}
                            variant="accrued"
                            showFreeOnCampaigns={showFree}
                          />
                          );
                        }}
                        getDate={(row) => row.date}
                        getAmount={(row) => row.amountRub}
                        rowKey={(row) => row.id}
                        renderRow={(row) => (
                        <tr>
                          <td className="whitespace-nowrap px-4 py-2 tabular-nums text-gray-900">
                            {formatFinanceTableDate(row.date)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 text-right font-semibold tabular-nums text-gray-900">
                            {formatFinanceMoney(row.amountRub)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 text-gray-500">
                            {row.periodLabel}
                          </td>
                        </tr>
                        )}
                      />
                        );
                      })()}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full min-w-[520px] border-separate border-spacing-0 text-left text-sm">
                    <thead className={FINANCE_TABLE_STICKY_HEAD_CLASS}>
                      <tr className={FINANCE_TABLE_HEAD_ROW_CLASS}>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">{t('dateCharge')}</th>
                        <th className="whitespace-nowrap px-3 py-2 text-right text-sm font-medium">{t('amount')}</th>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">{t('commission')}</th>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">{t('forPeriod')}</th>
                      </tr>
                    </thead>
                    <tbody className={FINANCE_TABLE_BODY_CLASS}>
                      <FinanceMonthGroups
                        rows={filteredBufferSpends}
                        sourceRows={filteredBufferSpends}
                        period={period}
                        colSpan={4}
                        amountSuffix={getFinanceCurrencySymbol()}
                        groupMonths
                        renderMonthHeader={({ key, title, total }) => (
                          <BufferMonthStatsBlock
                            monthKey={financeMonthKeyFromDayKey(key)}
                            title={title}
                            total={total}
                            variant="spent"
                          />
                        )}
                        getDate={(row) => row.date}
                        getAmount={(row) => row.amountRub}
                        rowKey={(row) => row.id}
                        renderRow={(row) => (
                        <tr>
                          <td className="whitespace-nowrap px-4 py-2 tabular-nums text-gray-900">
                            {formatFinanceTableDate(row.date)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 text-right font-semibold tabular-nums text-gray-900">
                            {formatFinanceMoney(row.amountRub)}
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
                <p className="pt-4 text-lg text-gray-600">
                  {isPendingRefunds ? (
                    <>
                      Сумма возвратных средств:{' '}
                      <span className="font-semibold tabular-nums text-gray-900">
                        {formatFinanceMoney(pendingRefundTotal)}
                      </span>
                    </>
                  ) : isTopups ? (
                    <>
                      Пополнено за период:{' '}
                      <span className="font-semibold tabular-nums text-gray-900">
                        {formatFinanceMoney(topupTotal)}
                      </span>
                    </>
                  ) : isCampaignTopups ? (
                    <>
                      Пополнено кампаний за период:{' '}
                      <span className="font-semibold tabular-nums text-gray-900">
                        {formatFinanceMoney(campaignTopupTotal)}
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
                        {formatFinanceMoney(periodTotal)}
                      </span>
                    </>
                  )}
                </p>
              ) : null}

              <div>
                {isPendingRefunds ? (
                  <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm">
                    <thead className={FINANCE_TABLE_STICKY_HEAD_CLASS}>
                      <tr className={FINANCE_TABLE_HEAD_ROW_CLASS}>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">{t('campaignId')}</th>
                        <th className="min-w-[200px] px-3 py-2 text-sm font-medium">{t('campaignNameType')}</th>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">{t('finishDate')}</th>
                        <th className="whitespace-nowrap px-3 py-2 text-right text-sm font-medium">{`${t('amount')}, ${getFinanceCurrencySymbol()}`}</th>
                        <th className="min-w-[160px] px-3 py-2 text-sm font-medium">
                          <span className="block">{t('status')}</span>
                          <span className="mt-0.5 block text-[11px] font-normal leading-snug text-gray-400">
                            {t('refundEta')}
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
                        amountSuffix={getFinanceCurrencySymbol()}
                        getDate={(row) => row.finishedAt}
                        getAmount={(row) => row.amountRub}
                        rowKey={(row) => String(row.campaignId)}
                        renderRow={(row) => (
                        <tr>
                          <td className="whitespace-nowrap px-4 py-2 tabular-nums text-gray-900">
                            {row.campaignId}
                          </td>
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              className="text-left text-sm font-medium text-gray-900 hover:underline"
                            >
                              {localizeDemoCampaignName(row.campaignName)}
                            </button>
                            <p className="mb-0 mt-0.5 text-xs leading-snug text-gray-500">{localizeCampaignType(row.campaignType)}</p>
                            <span className="mt-1.5 inline-flex rounded-md bg-[#F3F5F8] px-2 py-0.5 text-xs font-medium text-gray-600">
                              {PENDING_REFUND_FUNDS_LABEL[row.funds]}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 tabular-nums text-gray-900">
                            {row.finishedAt}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 text-right font-medium tabular-nums text-gray-900">
                            {formatFinanceMoney(row.amountRub)}
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
                    <thead className={FINANCE_TABLE_STICKY_HEAD_CLASS}>
                      <tr className={FINANCE_TABLE_HEAD_ROW_CLASS}>
                        <th className="px-3 py-2 text-sm font-medium">{t('paymentDate')}</th>
                        <th className="px-3 py-2 text-right text-sm font-medium">{`${t('amount')}, ${getFinanceCurrencySymbol()}`}</th>
                        <th className="px-3 py-2 text-sm font-medium">{t('status')}</th>
                        <th className="px-3 py-2 text-sm font-medium">{t('paymentMethod')}</th>
                        <th className="px-3 py-2 text-sm font-medium">{t('payerInn')}</th>
                      </tr>
                    </thead>
                    <tbody className={FINANCE_TABLE_BODY_CLASS}>
                      {visibleTopups.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                            {t('nothingFound')}
                          </td>
                        </tr>
                      ) : (
                        <FinanceMonthGroups
                          rows={visibleTopups}
                          sourceRows={filteredTopups}
                          period={period}
                          colSpan={5}
                          amountSuffix={getFinanceCurrencySymbol()}
                          getDate={(row) => row.date}
                          getAmount={(row) => row.amountRub}
                          rowKey={(row) => row.id}
                          renderRow={(row) => (
                          <tr>
                            <td className="whitespace-nowrap px-4 py-2 tabular-nums text-gray-900">
                              {row.date}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums text-gray-900">
                              {formatFinanceMoney(row.amountRub)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2">
                              <TopupStatusBadge status={row.status} />
                            </td>
                            <td className="whitespace-nowrap px-4 py-2 text-gray-900">
                              <TopupMethodLabel method={row.method} />
                            </td>
                            <td className="whitespace-nowrap px-4 py-2 tabular-nums text-gray-900">
                              {row.inn}
                            </td>
                          </tr>
                          )}
                        />
                      )}
                    </tbody>
                  </table>
                ) : isExpiredBonuses ? (
                  <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
                    <thead className={FINANCE_TABLE_STICKY_HEAD_CLASS}>
                      <tr className={FINANCE_TABLE_HEAD_ROW_CLASS}>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">{t('endsAt')}</th>
                        <th className="whitespace-nowrap px-3 py-2 text-right text-sm font-medium">{t('amount')} B</th>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">{t('campaignId')}</th>
                        <th className="min-w-[220px] px-3 py-2 text-sm font-medium">{t('campaignNameType')}</th>
                      </tr>
                    </thead>
                    <tbody className={FINANCE_TABLE_BODY_CLASS}>
                      {filteredExpiredBonuses.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                            {t('nothingFound')}
                          </td>
                        </tr>
                      ) : (
                        filteredExpiredBonuses.map((row) => (
                          <tr key={row.id}>
                            <td className="whitespace-nowrap px-4 py-2 tabular-nums text-gray-900">
                              {row.endsAt}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums text-gray-900">
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
                                  {localizeDemoCampaignName(row.campaignName)}
                                </button>
                              ) : null}
                              <p
                                className={`${row.campaignName ? 'mt-1' : ''} text-xs leading-snug text-gray-500`}
                              >
                                {localizeCampaignType(row.campaignType)}
                              </p>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                ) : isCampaignTopups ? (
                  <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm">
                    <thead className={FINANCE_TABLE_STICKY_HEAD_CLASS}>
                      <tr className={FINANCE_TABLE_HEAD_ROW_CLASS}>
                        <th className="min-w-[200px] px-3 py-2 text-sm font-medium">{t('campaign')}</th>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">{t('topupDate')}</th>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">{t('source')}</th>
                        <th className="whitespace-nowrap px-3 py-2 text-right text-sm font-medium">{t('amount')}</th>
                      </tr>
                    </thead>
                    <tbody className={FINANCE_TABLE_BODY_CLASS}>
                      {visibleCampaignTopups.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                            {t('nothingFound')}
                          </td>
                        </tr>
                      ) : (
                        <FinanceMonthGroups
                          rows={visibleCampaignTopups}
                          sourceRows={filteredCampaignTopups}
                          period={period}
                          colSpan={4}
                          amountSuffix={getFinanceCurrencySymbol()}
                          getDate={(row) => row.date}
                          getAmount={(row) => row.amountRub}
                          rowKey={(row) => row.id}
                          renderRow={(row) => (
                            <tr>
                              <td className="px-4 py-2">
                                <button
                                  type="button"
                                  className="text-left text-sm font-medium text-gray-900 hover:underline"
                                >
                                  {localizeDemoCampaignName(row.campaignName)}
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
                              <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums text-gray-900">
                                {formatFinanceMoney(row.amountRub)}
                              </td>
                            </tr>
                          )}
                        />
                      )}
                    </tbody>
                  </table>
                ) : onlyWibesChannel ? (
                  <table className="w-full min-w-[860px] border-separate border-spacing-0 text-left text-sm">
                    <thead className={FINANCE_TABLE_STICKY_HEAD_CLASS}>
                      <tr className={FINANCE_TABLE_HEAD_ROW_CLASS}>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">{t('campaignId')}</th>
                        <th className="min-w-[220px] px-3 py-2 text-sm font-medium">{t('campaignNameType')}</th>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">{t('chargeSource')}</th>
                        <th className="whitespace-nowrap px-3 py-2 text-right text-sm font-medium">{`${t('amount')}, ${getFinanceCurrencySymbol()}`}</th>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">{t('documentNo')}</th>
                      </tr>
                    </thead>
                    <tbody className={FINANCE_TABLE_BODY_CLASS}>
                      {visibleExpenses.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                            <p className="font-medium text-gray-700">{t('nothingFound')}</p>
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
                          amountSuffix={getFinanceCurrencySymbol()}
                          getDate={(row) => row.debitDate}
                          getAmount={(row) => row.amountRub}
                          rowKey={(row) => row.id ?? `${row.campaignId}-${row.debitDate}-${row.source}-${row.amountRub}`}
                          renderRow={(row) => (
                        <tr>
                          <td className="whitespace-nowrap px-4 py-2 tabular-nums text-gray-900">
                            {row.campaignId}
                          </td>
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              className="max-w-[280px] truncate text-left text-sm font-medium text-gray-900 hover:underline"
                              title={localizeDemoCampaignName(row.campaignName)}
                            >
                              {localizeDemoCampaignName(row.campaignName)}
                            </button>
                            <p className="mb-0 mt-0.5 text-xs leading-snug text-gray-500">{localizeCampaignType(row.campaignType)}</p>
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 text-gray-900">
                            <ExpenseSourceLabel source={row.source} />
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 text-right text-gray-900">
                            <span className="tabular-nums">{formatFinanceMoney(row.amountRub)}</span>
                            {row.isCorrection ? (
                              <span className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                                Корректировка
                                <span className="tooltip inline-flex">
                                  <InfoCircleFill className="h-3 w-3 text-gray-400" aria-label="Подсказка" />
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
                    <thead className={FINANCE_TABLE_STICKY_HEAD_CLASS}>
                      <tr className={FINANCE_TABLE_HEAD_ROW_CLASS}>
                        <th className="min-w-[200px] px-3 py-2 text-sm font-medium">{t('campaign')}</th>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">{t('chargeSource')}</th>
                        <th className="whitespace-nowrap px-3 py-2 text-right text-sm font-medium">{t('amount')}</th>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">{t('documentNo')}</th>
                      </tr>
                    </thead>
                    <tbody className={FINANCE_TABLE_BODY_CLASS}>
                      {visibleExpenses.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                            <p className="font-medium text-gray-700">{t('nothingFound')}</p>
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
                          colSpan={4}
                          amountSuffix={getFinanceCurrencySymbol()}
                          getDate={(row) => row.debitDate}
                          getAmount={(row) => row.amountRub}
                          rowKey={(row) => row.id ?? `${row.campaignId}-${row.documentNo}`}
                          renderRow={(row) => (
                        <tr>
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              className="text-left text-sm font-medium text-gray-900 hover:underline"
                            >
                              {localizeDemoCampaignName(row.campaignName)}
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
                          <td className="whitespace-nowrap px-4 py-2 text-gray-900">
                            <ExpenseSourceLabel source={row.source} />
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums text-gray-900">
                            {formatFinanceMoney(row.amountRub)}
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
              </div>
            </div>
          ) : (
            <>
              <div
                className={
                  mobile
                    ? 'mt-3 flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto px-3 pb-1'
                    : 'mt-3 flex min-w-0 flex-nowrap items-center gap-3 px-4 sm:px-7'
                }
              >
                <div className="shrink-0">
                  <FinancePeriodPicker value={period} onChange={setFinancePeriod} />
                </div>
              </div>

              <div
                ref={mobile ? undefined : tableScrollRefCb}
                className={
                  mobile
                    ? 'mt-3 rounded-xl bg-white px-3 py-3'
                    : FINANCE_TABLE_SCROLL_CLASS
                }
              >
                <div>
                  <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left text-sm">
                    <thead className={mobile ? undefined : FINANCE_TABLE_STICKY_HEAD_CLASS}>
                      <tr className={FINANCE_TABLE_HEAD_ROW_CLASS}>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">{t('dateAccrual')}</th>
                        <th className="min-w-[220px] px-3 py-2 text-sm font-medium">{t('source')}</th>
                        <th className="whitespace-nowrap px-3 py-2 text-right text-sm font-medium">{t('amount')} B</th>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">{t('type')}</th>
                        <th className="whitespace-nowrap px-3 py-2 text-sm font-medium">{t('burnsUntil')}</th>
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
                        <tr>
                          <td className="whitespace-nowrap px-4 py-2 tabular-nums text-gray-900">
                            {row.date}
                          </td>
                          <td className="px-4 py-2 text-gray-900">{row.source}</td>
                          <td className="whitespace-nowrap px-4 py-2 text-right font-semibold tabular-nums text-gray-900">
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
              </div>
            </>
          )}
        </section>
      </div>
      {mobileSheets}
    </main>
    </>
  );

  const previewControls = (
    <div className="fixed bottom-5 right-5 z-[300] flex items-center gap-2">
      {specialContractor ? null : (
        <button
          type="button"
          onClick={() => setSimDemoOpen((open) => !open)}
          className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2.5 text-sm font-medium shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-colors ${
            simDemoOpen
              ? 'border-gray-900 bg-gray-900 text-white hover:bg-black'
              : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50'
          }`}
          aria-pressed={simDemoOpen}
          aria-expanded={simDemoOpen}
          aria-label={simDemoOpen ? 'Скрыть сценарий баланса' : 'Открыть сценарий баланса'}
        >
          {t('scenario')}
        </button>
      )}
      <button
        type="button"
        onClick={toggleIphonePreview}
        className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-900 shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-colors hover:bg-gray-50"
        aria-pressed={iphonePreview}
        aria-label={iphonePreview ? t('desktop') : t('iphone')}
      >
        {iphonePreview ? (
          <Monitor className="h-4 w-4 text-gray-600" aria-hidden />
        ) : (
          <Smartphone className="h-4 w-4 text-gray-600" aria-hidden />
        )}
        {iphonePreview ? t('desktop') : t('iphone')}
      </button>
      <FinanceLocaleSwitcher presentation="pill" />
    </div>
  );

  return (
    <>
      {topUpSheetOpen ? null : createPortal(previewControls, document.body)}

      {iphonePreview ? (
        <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-start bg-[#E8E8EC] px-4 py-8">
          <p className="mb-3 text-sm font-medium tabular-nums text-gray-600">
            {IPHONE_PREVIEW.label} · {IPHONE_PREVIEW.width} × {IPHONE_PREVIEW.height}
          </p>
          <div
            className="relative shrink-0 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
            style={{
              width: IPHONE_PREVIEW.width + 24,
              height: IPHONE_PREVIEW.height + 24,
              borderRadius: 44,
              padding: 12,
            }}
          >
            <div
              className="pointer-events-none absolute left-1/2 top-3 z-20 h-[28px] w-[100px] -translate-x-1/2 rounded-full bg-black"
              aria-hidden
            />
            <div
              ref={setPhoneScreenEl}
              className="relative overflow-hidden bg-[#F6F6F8]"
              style={{
                width: IPHONE_PREVIEW.width,
                height: IPHONE_PREVIEW.height,
                borderRadius: 34,
              }}
            >
              <div
                ref={setPhoneScrollEl}
                className="h-full overflow-y-auto overflow-x-hidden overscroll-y-contain"
              >
                {page}
              </div>
              {showScrollTop ? (
                <button
                  type="button"
                  onClick={scrollToTop}
                  className="absolute bottom-8 right-3 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-900 shadow-[0_8px_24px_rgba(0,0,0,0.16)] ring-1 ring-black/5 transition-transform active:scale-95"
                  aria-label="Наверх"
                >
                  <ArrowUp className="h-5 w-5" aria-hidden />
                </button>
              ) : null}
              <div
                className="pointer-events-none absolute bottom-2 left-1/2 h-1 w-[108px] -translate-x-1/2 rounded-full bg-black/25"
                aria-hidden
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          {page}
          {showScrollTop ? (
            <button
              type="button"
              onClick={scrollToTop}
              className="fixed bottom-24 right-5 z-[230] inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-900 shadow-[0_8px_24px_rgba(0,0,0,0.16)] ring-1 ring-black/5 transition-transform hover:bg-[#F7F7F8] active:scale-95"
              aria-label="Наверх"
            >
              <ArrowUp className="h-5 w-5" aria-hidden />
            </button>
          ) : null}
        </>
      )}
    </>
  );
};

export default FinancePage;
