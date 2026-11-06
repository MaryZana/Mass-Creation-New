import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BalanceIntro } from './FinanceBalanceModalVariants';
import { notifySidePanelOpen, useCloseOnOtherSidePanel } from './FeatureVideoGuide';
import { ChevronRight, Coins, InfoCircleFill, Plus, Wallet, X } from './Icons';

const fmtRub = (n: number) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n);

function IconTile({ tone = 'own' }: { children?: React.ReactNode; tone?: 'own' | 'balance' }) {
  const Icon = tone === 'balance' ? Coins : Wallet;
  return <Icon className="h-5 w-5 shrink-0 text-gray-900" />;
}

function ClickableRow({
  onClick,
  ariaLabel,
  children,
}: {
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      className="-mx-2 flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-black/[0.04]"
    >
      {children}
    </div>
  );
}

export const FINANCE_UNIFIED_VARIANTS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] as const;
export type FinanceUnifiedVariant = (typeof FINANCE_UNIFIED_VARIANTS)[number];

export function readFinanceUnifiedVariant(): FinanceUnifiedVariant {
  try {
    const raw = new URLSearchParams(window.location.search).get('unified');
    const match = FINANCE_UNIFIED_VARIANTS.find((item) => item === raw);
    if (match) return match;
  } catch {
    /* ignore */
  }
  return '10';
}

type RowsProps = {
  accountRub: number;
  balanceRub: number;
  onOpen: () => void;
  onTopUp: () => void;
};

function tileButton(onClick: () => void, ariaLabel: string, className: string, children: React.ReactNode) {
  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel} className={className}>
      {children}
    </button>
  );
}

/** 1 — формула под суммой: Счёт + Баланс */
function FormulaRows({ accountRub, balanceRub, onOpen, onTopUp }: RowsProps) {
  const chip = 'flex min-w-0 flex-1 flex-col rounded-xl bg-[#F7F7F9] px-3 py-2 text-left transition-colors hover:bg-gray-100';
  return (
    <div className="text-sm">
      <p className="text-[28px] font-bold leading-none tabular-nums tracking-tight text-gray-900">
        {fmtRub(accountRub + balanceRub)} ₽
      </p>
      <div className="mt-3 flex items-center gap-1.5">
        {tileButton(
          onTopUp,
          'Пополнить счёт',
          chip,
          <>
            <span className="text-xs text-gray-500">Счёт</span>
            <span className="font-semibold tabular-nums text-gray-900">{fmtRub(accountRub)} ₽</span>
          </>,
        )}
        <span className="shrink-0 text-base font-semibold text-gray-300">+</span>
        {tileButton(
          onOpen,
          'Начисления баланса',
          chip,
          <>
            <span className="text-xs text-gray-500">Баланс</span>
            <span className="font-semibold tabular-nums text-gray-900">{fmtRub(balanceRub)} ₽</span>
          </>,
        )}
      </div>
    </div>
  );
}

/** 2 — дерево: от суммы отходят ветки к частям */
function TreeRows({ accountRub, balanceRub, onOpen, onTopUp }: RowsProps) {
  const branch = (last: boolean) => (
    <span className="relative w-4 shrink-0 self-stretch" aria-hidden>
      <span className={`absolute left-1 top-0 w-px bg-gray-200 ${last ? 'h-1/2' : 'h-full'}`} />
      <span className="absolute left-1 top-1/2 h-px w-3 bg-gray-200" />
    </span>
  );
  return (
    <div className="text-sm">
      <p className="text-[28px] font-bold leading-none tabular-nums tracking-tight text-gray-900">
        {fmtRub(accountRub + balanceRub)} ₽
      </p>
      <div className="mt-2">
        <div className="flex items-stretch">
          {branch(false)}
          <div className="ml-2 min-w-0 flex-1">
            <ClickableRow onClick={onTopUp} ariaLabel="Пополнить счёт">
              <span className="min-w-0 flex-1 text-gray-600">Счёт</span>
              <span className="font-medium tabular-nums text-gray-900">{fmtRub(accountRub)} ₽</span>
              <Plus className="h-4 w-4 shrink-0 text-gray-400" />
            </ClickableRow>
          </div>
        </div>
        <div className="flex items-stretch">
          {branch(true)}
          <div className="ml-2 min-w-0 flex-1">
            <ClickableRow onClick={onOpen} ariaLabel="Начисления баланса">
              <span className="min-w-0 flex-1 text-gray-600">Баланс</span>
              <span className="font-medium tabular-nums text-gray-900">{fmtRub(balanceRub)} ₽</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
            </ClickableRow>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 3 — одна плашка, разделённая на две части, сумма сверху */
function SplitRows({ accountRub, balanceRub, onOpen, onTopUp }: RowsProps) {
  const half = 'flex min-w-0 flex-1 flex-col gap-1 px-3 py-2.5 text-left transition-colors hover:bg-black/[0.03]';
  return (
    <div className="text-sm">
      <p className="text-[28px] font-bold leading-none tabular-nums tracking-tight text-gray-900">
        {fmtRub(accountRub + balanceRub)} ₽
      </p>
      <div className="mt-3 flex overflow-hidden rounded-xl border border-gray-200">
        {tileButton(
          onTopUp,
          'Пополнить счёт',
          half,
          <>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <Wallet className="h-5 w-5 shrink-0" /> Счёт
            </span>
            <span className="font-semibold tabular-nums text-gray-900">{fmtRub(accountRub)} ₽</span>
          </>,
        )}
        <span className="w-px shrink-0 bg-gray-200" aria-hidden />
        {tileButton(
          onOpen,
          'Начисления баланса',
          half,
          <>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <Coins className="h-5 w-5 shrink-0" /> Баланс
            </span>
            <span className="font-semibold tabular-nums text-gray-900">{fmtRub(balanceRub)} ₽</span>
          </>,
        )}
      </div>
    </div>
  );
}

/** 4 — как чек: части сверху, итог под чертой */
function ReceiptRows({ accountRub, balanceRub, onOpen, onTopUp }: RowsProps) {
  return (
    <div className="text-sm">
      <div className="space-y-0.5">
        <ClickableRow onClick={onTopUp} ariaLabel="Пополнить счёт">
          <span className="min-w-0 flex-1 text-gray-600">Счёт</span>
          <span className="font-medium tabular-nums text-gray-900">{fmtRub(accountRub)} ₽</span>
          <Plus className="h-4 w-4 shrink-0 text-gray-400" />
        </ClickableRow>
        <ClickableRow onClick={onOpen} ariaLabel="Начисления баланса">
          <span className="min-w-0 flex-1 text-gray-600">
            <span className="mr-1.5 text-gray-300">+</span>Баланс
          </span>
          <span className="font-medium tabular-nums text-gray-900">{fmtRub(balanceRub)} ₽</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
        </ClickableRow>
      </div>
      <div className="mt-2 flex items-baseline justify-between border-t border-gray-200 pt-3">
        <span className="text-gray-500">Итого</span>
        <span className="text-[24px] font-bold leading-none tabular-nums tracking-tight text-gray-900">
          {fmtRub(accountRub + balanceRub)} ₽
        </span>
      </div>
    </div>
  );
}

/** 5 — две карточки внутри общей рамки единого счёта */
function NestedRows({ accountRub, balanceRub, onOpen, onTopUp }: RowsProps) {
  const card =
    'flex w-full items-center gap-2.5 rounded-xl bg-white px-2.5 py-2 text-left shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_2px_6px_rgba(0,0,0,0.1)]';
  return (
    <div className="rounded-2xl bg-[#F3F4F6] p-1.5 text-sm">
      <p className="mb-0 px-2 pb-3 pt-2 text-[26px] font-bold leading-none tabular-nums tracking-tight text-gray-900">
        {fmtRub(accountRub + balanceRub)} ₽
      </p>
      <div className="space-y-1.5">
        {tileButton(
          onTopUp,
          'Пополнить счёт',
          card,
          <>
            <IconTile tone="own" />
            <span className="min-w-0 flex-1 text-gray-600">Счёт</span>
            <span className="font-medium tabular-nums text-gray-900">{fmtRub(accountRub)} ₽</span>
            <Plus className="h-4 w-4 shrink-0 text-gray-400" />
          </>,
        )}
        {tileButton(
          onOpen,
          'Начисления баланса',
          card,
          <>
            <IconTile tone="balance" />
            <span className="min-w-0 flex-1 text-gray-600">Баланс</span>
            <span className="font-medium tabular-nums text-gray-900">{fmtRub(balanceRub)} ₽</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
          </>,
        )}
      </div>
    </div>
  );
}

type LabeledRowsProps = RowsProps & { label: React.ReactNode };

const whiteRow =
  'flex w-full items-center gap-2.5 rounded-xl bg-white px-2.5 py-2 text-left shadow-[0_1px_2px_rgba(0,0,0,0.06)]';
const whiteRowHover = 'transition-shadow hover:shadow-[0_2px_6px_rgba(0,0,0,0.1)]';

function PurplePlus({ onClick, size = 'md' }: { onClick: () => void; size?: 'sm' | 'md' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Пополнить счёт"
      className={`inline-flex shrink-0 items-center justify-center rounded-lg bg-[#9A41FE] text-white transition-colors hover:bg-[#8a38e8] ${
        size === 'sm' ? 'h-7 w-7' : 'h-8 w-8'
      }`}
    >
      <Plus className="h-4 w-4" />
    </button>
  );
}

function GrayTotal({ label, totalRub }: { label: React.ReactNode; totalRub: number }) {
  return (
    <div className="px-2 pb-3 pt-2">
      {label}
      <p className="mb-0 mt-1.5 text-[26px] font-bold leading-none tabular-nums tracking-tight text-gray-900">
        {fmtRub(totalRub)} ₽
      </p>
    </div>
  );
}

function AccountLabel({ plain = false }: { plain?: boolean }) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-1.5">
      {plain ? <Wallet className="h-5 w-5 shrink-0 text-gray-900" /> : <IconTile tone="own" />}
      <span className="text-gray-600">Счёт</span>
    </span>
  );
}

function BalanceLabel({ plain = false }: { plain?: boolean }) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-1.5">
      {plain ? <Coins className="h-5 w-5 shrink-0 text-gray-900" /> : <IconTile tone="balance" />}
      <span className="text-gray-600">Баланс</span>
    </span>
  );
}

function BalanceFaqSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!open) return;
    notifySidePanelOpen('balance-faq');
  }, [open]);

  useCloseOnOtherSidePanel('balance-faq', handleClose);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, handleClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[120] bg-black/50" onClick={handleClose} role="presentation">
      <div className="flex h-full w-full justify-end" onClick={handleClose}>
        <div
          className="flex h-full max-h-full min-w-0 items-stretch gap-2"
          onClick={(event) => event.stopPropagation()}
          onMouseEnter={(event) => event.stopPropagation()}
          onMouseLeave={(event) => event.stopPropagation()}
          onMouseOver={(event) => event.stopPropagation()}
          onMouseOut={(event) => event.stopPropagation()}
        >
          <div className="flex shrink-0 flex-col justify-start pt-5 pl-3">
            <button
              type="button"
              onClick={handleClose}
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
            aria-labelledby="balance-faq-title"
          >
            <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-8 sm:p-10">
              <h2 id="balance-faq-title" className="text-2xl font-bold tracking-tight text-gray-900">
                Частые вопросы по балансу
              </h2>
              <div className="mt-6">
                <BalanceIntro />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Информер у «Баланс»: тултип + кнопка открывает боковую шторку FAQ */
function BalanceHowInformer() {
  const [tipOpen, setTipOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);

  return (
    <>
      <span
        className="relative inline-flex"
        onMouseEnter={() => setTipOpen(true)}
        onMouseLeave={() => setTipOpen(false)}
      >
        <button
          type="button"
          className="inline-flex items-center justify-center text-gray-400 transition-colors hover:text-gray-600"
          aria-label="Как работает баланс"
          onClick={(event) => {
            event.stopPropagation();
            setTipOpen((value) => !value);
          }}
        >
          <InfoCircleFill className="h-4 w-4" />
        </button>
        {tipOpen ? (
          <div className="absolute left-0 top-full z-50 pt-1.5">
            <div className="relative w-[16rem] rounded-xl bg-gray-900 px-3 py-2.5 text-left text-xs font-normal leading-snug text-white shadow-lg">
              <span
                className="absolute bottom-full left-3 border-x-[7px] border-b-[8px] border-x-transparent border-b-gray-900"
                aria-hidden
              />
              <p className="mb-0">Деньги WB на рекламу. Не потратите — ничего не заплатите.</p>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setTipOpen(false);
                  setFaqOpen(true);
                }}
                className="mt-2.5 flex w-full items-center justify-center rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/15"
              >
                Частые вопросы
              </button>
            </div>
          </div>
        ) : null}
      </span>
      <BalanceFaqSheet open={faqOpen} onClose={() => setFaqOpen(false)} />
    </>
  );
}

/** 6 — заголовок над суммой в сером блоке, фиолетовый плюс в строке счёта */
function GrayPlusRows({ label, accountRub, balanceRub, onOpen, onTopUp }: LabeledRowsProps) {
  return (
    <div className="rounded-2xl bg-[#F3F4F6] p-1.5 text-sm">
      <GrayTotal label={label} totalRub={accountRub + balanceRub} />
      <div className="space-y-1.5">
        <div className={`${whiteRow} py-1.5 pr-1.5`}>
          <AccountLabel />
          <span className="font-medium tabular-nums text-gray-900">{fmtRub(accountRub)} ₽</span>
          <PurplePlus onClick={onTopUp} />
        </div>
        <button type="button" onClick={onOpen} aria-label="Начисления баланса" className={`${whiteRow} ${whiteRowHover}`}>
          <BalanceLabel />
          <span className="font-medium tabular-nums text-gray-900">{fmtRub(balanceRub)} ₽</span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center">
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </span>
        </button>
      </div>
    </div>
  );
}

/** 7 — подписанные действия: «Пополнить» и «Смотреть» */
function GrayActionsRows({ label, accountRub, balanceRub, onOpen, onTopUp }: LabeledRowsProps) {
  return (
    <div className="rounded-2xl bg-[#F3F4F6] p-1.5 text-sm">
      <GrayTotal label={label} totalRub={accountRub + balanceRub} />
      <div className="space-y-1.5">
        <div className={`${whiteRow} py-1.5 pr-1.5`}>
          <IconTile tone="own" />
          <span className="min-w-0 flex-1">
            <span className="block text-xs leading-tight text-gray-500">Счёт</span>
            <span className="font-medium tabular-nums text-gray-900">{fmtRub(accountRub)} ₽</span>
          </span>
          <button
            type="button"
            onClick={onTopUp}
            className="shrink-0 rounded-lg bg-[#9A41FE] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#8a38e8]"
          >
            Пополнить
          </button>
        </div>
        <div className={`${whiteRow} py-1.5 pr-1.5`}>
          <IconTile tone="balance" />
          <span className="min-w-0 flex-1">
            <span className="block text-xs leading-tight text-gray-500">Баланс</span>
            <span className="font-medium tabular-nums text-gray-900">{fmtRub(balanceRub)} ₽</span>
          </span>
          <button
            type="button"
            onClick={onOpen}
            className="shrink-0 rounded-lg bg-[rgba(74,74,89,0.08)] px-3 py-1.5 text-xs font-semibold text-gray-900 transition-colors hover:bg-[rgba(74,74,89,0.12)]"
          >
            Смотреть
          </button>
        </div>
      </div>
    </div>
  );
}

/** 8 — фиолетовая кнопка снаружи строки счёта, рядом с ней */
function GraySideButtonRows({ label, accountRub, balanceRub, onOpen, onTopUp }: LabeledRowsProps) {
  return (
    <div className="rounded-2xl bg-[#F3F4F6] p-1.5 text-sm">
      <GrayTotal label={label} totalRub={accountRub + balanceRub} />
      <div className="space-y-1.5">
        <div className="flex gap-1.5">
          <div className={`${whiteRow} min-w-0 flex-1`}>
            <AccountLabel />
            <span className="font-medium tabular-nums text-gray-900">{fmtRub(accountRub)} ₽</span>
          </div>
          <button
            type="button"
            onClick={onTopUp}
            aria-label="Пополнить счёт"
            className="inline-flex w-11 shrink-0 items-center justify-center rounded-xl bg-[#9A41FE] text-white transition-colors hover:bg-[#8a38e8]"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <button type="button" onClick={onOpen} aria-label="Начисления баланса" className={`${whiteRow} ${whiteRowHover}`}>
          <BalanceLabel />
          <span className="font-medium tabular-nums text-gray-900">{fmtRub(balanceRub)} ₽</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
        </button>
      </div>
    </div>
  );
}

/** 9 — заголовок и сумма в одну строку, строки с подписями «пополняете вы» / «начисляет WB» */
function GrayCaptionRows({ label, accountRub, balanceRub, onOpen, onTopUp }: LabeledRowsProps) {
  return (
    <div className="rounded-2xl bg-[#F3F4F6] p-1.5 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-2 pb-3 pt-2.5">
        <p className="mb-0 text-[26px] font-bold leading-none tabular-nums tracking-tight text-gray-900">
          {fmtRub(accountRub + balanceRub)} ₽
        </p>
        {label}
      </div>
      <div className="space-y-1.5">
        <div className={`${whiteRow} py-1.5 pr-1.5`}>
          <IconTile tone="own" />
          <span className="min-w-0 flex-1">
            <span className="block leading-tight text-gray-900">Счёт</span>
            <span className="text-xs leading-tight text-gray-500">Пополняете вы</span>
          </span>
          <span className="font-medium tabular-nums text-gray-900">{fmtRub(accountRub)} ₽</span>
          <PurplePlus onClick={onTopUp} />
        </div>
        <button type="button" onClick={onOpen} aria-label="Начисления баланса" className={`${whiteRow} ${whiteRowHover} py-1.5 pr-1.5`}>
          <IconTile tone="balance" />
          <span className="min-w-0 flex-1">
            <span className="block leading-tight text-gray-900">Баланс</span>
            <span className="text-xs leading-tight text-gray-500">Начисляет WB</span>
          </span>
          <span className="font-medium tabular-nums text-gray-900">{fmtRub(balanceRub)} ₽</span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center">
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </span>
        </button>
      </div>
    </div>
  );
}

/** 10 — счёт на белой строке с кнопкой, баланс — текстовой строкой прямо на сером */
function GrayLightBalanceRows({
  label,
  accountRub,
  balanceRub,
  onOpen,
  onTopUp,
  balanceExtra,
  balanceSlot,
  hideBalanceChevron,
}: LabeledRowsProps & {
  balanceExtra?: React.ReactNode;
  balanceSlot?: React.ReactNode;
  hideBalanceChevron?: boolean;
}) {
  const accountRow = (framed: boolean) =>
    framed ? (
      <div className="flex w-full items-center gap-2 px-4 py-3">
        <AccountLabel />
        <button
          type="button"
          onClick={onTopUp}
          aria-label="Пополнить счёт"
          className="group -mr-1.5 inline-flex items-center gap-2 rounded-xl py-1 pl-1 pr-1.5 transition-colors hover:bg-black/[0.04]"
        >
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#9A41FE] text-white transition-colors group-hover:bg-[#8a38e8]">
            <Plus className="h-4 w-4" />
          </span>
          <span className="text-lg font-bold tabular-nums text-gray-900">{fmtRub(accountRub)} ₽</span>
        </button>
      </div>
    ) : (
      <button
        type="button"
        onClick={onTopUp}
        aria-label="Пополнить счёт"
        className="group flex items-center gap-2.5 -mx-1.5 w-[calc(100%+0.75rem)] rounded-xl px-1.5 py-1 text-left transition-colors hover:bg-black/[0.04]"
      >
        <AccountLabel />
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#9A41FE] text-white transition-colors group-hover:bg-[#8a38e8]">
          <Plus className="h-4 w-4" />
        </span>
        <span className="text-lg font-bold tabular-nums text-gray-900">{fmtRub(accountRub)} ₽</span>
      </button>
    );

  return (
    <div className="text-sm">
      {balanceSlot ? (
        <>
          <div className="px-3.5 pt-3.5">
            {label}
            <p className="mb-0 mt-1.5 pb-3 text-[26px] font-bold leading-none tabular-nums tracking-tight text-gray-900">
              {fmtRub(accountRub + balanceRub)} ₽
            </p>
          </div>
          <div className="rounded-xl bg-white">
            {accountRow(true)}
            <div className="flex w-full items-center gap-2 border-t border-gray-200 px-4 pt-3 pb-1">
              <span className="relative z-10 flex min-w-0 flex-1 items-center gap-1.5">
                <IconTile tone="balance" />
                <span className="text-gray-600">Баланс</span>
                <BalanceHowInformer />
              </span>
              <span className="text-lg font-bold tabular-nums text-gray-900">{fmtRub(balanceRub)} ₽</span>
            </div>
            <div className="px-4 pb-4 pt-1">{balanceSlot}</div>
          </div>
        </>
      ) : (
        <>
          {label}
          <p className="mb-0 mt-1.5 pb-3 text-[26px] font-bold leading-none tabular-nums tracking-tight text-gray-900">
            {fmtRub(accountRub + balanceRub)} ₽
          </p>
          {accountRow(false)}
          {hideBalanceChevron ? (
            <div className="mt-0.5 flex items-center gap-2.5 -mx-1.5 w-[calc(100%+0.75rem)] px-1.5 py-1">
              <BalanceLabel />
              <span className="text-lg font-bold tabular-nums text-gray-900">{fmtRub(balanceRub)} ₽</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpen}
              aria-label="Начисления баланса"
              className="group mt-0.5 flex items-center gap-2.5 -mx-1.5 w-[calc(100%+0.75rem)] rounded-xl px-1.5 py-1 text-left transition-colors hover:bg-black/[0.04]"
            >
              <BalanceLabel />
              <span className="text-lg font-bold tabular-nums text-gray-900">{fmtRub(balanceRub)} ₽</span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F2F2F7] text-gray-700 transition-colors group-hover:bg-[#ECECF0]">
                <ChevronRight className="h-4 w-4" />
              </span>
            </button>
          )}
          {balanceExtra}
        </>
      )}
    </div>
  );
}

/** Варианты, где заголовок «Единый счёт» и кнопка пополнения внутри блока */
export function financeUnifiedHasOwnHeader(variant: FinanceUnifiedVariant) {
  return Number(variant) >= 6;
}

/** Сумма единого счёта и кликабельные строки «Счёт» / «Баланс» */
export function FinanceMoneyIconRows(
  props: RowsProps & {
    variant?: FinanceUnifiedVariant;
    label?: React.ReactNode;
    /** Контент сразу под строкой «Баланс» (только вариант 10) */
    balanceExtra?: React.ReactNode;
    /** Заменяет строку «Баланс» целиком (только вариант 10) */
    balanceSlot?: React.ReactNode;
    /** Без шеврона у строки «Баланс» (когда подробности уже на странице) */
    hideBalanceChevron?: boolean;
  },
) {
  const { variant = '0', label = null, balanceExtra, balanceSlot, hideBalanceChevron, ...rows } = props;
  if (variant === '6') return <GrayPlusRows label={label} {...rows} />;
  if (variant === '7') return <GrayActionsRows label={label} {...rows} />;
  if (variant === '8') return <GraySideButtonRows label={label} {...rows} />;
  if (variant === '9') return <GrayCaptionRows label={label} {...rows} />;
  if (variant === '10')
    return (
      <GrayLightBalanceRows
        label={label}
        balanceExtra={balanceExtra}
        balanceSlot={balanceSlot}
        hideBalanceChevron={hideBalanceChevron}
        {...rows}
      />
    );
  if (variant === '1') return <FormulaRows {...rows} />;
  if (variant === '2') return <TreeRows {...rows} />;
  if (variant === '3') return <SplitRows {...rows} />;
  if (variant === '4') return <ReceiptRows {...rows} />;
  if (variant === '5') return <NestedRows {...rows} />;
  return <CurrentRows {...rows} />;
}

function CurrentRows({ accountRub, balanceRub, onOpen, onTopUp }: RowsProps) {
  return (
    <div className="text-sm">
      <p className="cursor-default text-[28px] font-bold leading-none tabular-nums tracking-tight text-gray-900">
        {fmtRub(accountRub + balanceRub)} ₽
      </p>
      <div className="mt-2 space-y-0.5">
        <ClickableRow onClick={onTopUp} ariaLabel="Пополнить счёт">
          <span className="flex min-w-0 flex-1 items-center gap-2.5">
            <IconTile tone="own" />
            <span className="min-w-0 whitespace-nowrap text-gray-600">Счёт</span>
          </span>
          <span className="shrink-0 whitespace-nowrap font-medium tabular-nums text-gray-900">
            {fmtRub(accountRub)} ₽
          </span>
          <Plus className="h-4 w-4 shrink-0 text-gray-400" />
        </ClickableRow>
        <ClickableRow onClick={onOpen} ariaLabel="Начисления баланса">
          <span className="flex min-w-0 flex-1 items-center gap-2.5">
            <IconTile tone="balance" />
            <span className="min-w-0 whitespace-nowrap text-gray-600">Баланс</span>
          </span>
          <span className="shrink-0 whitespace-nowrap font-medium tabular-nums text-gray-900">
            {fmtRub(balanceRub)} ₽
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
        </ClickableRow>
      </div>
    </div>
  );
}
