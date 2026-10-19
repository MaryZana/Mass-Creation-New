import React from 'react';
import type { PromoMissedBonusUxId } from './PromoMissedBonusUxContext';

type OfferProps = {
  suggestedBonus: number;
  amountWithBonuses: number;
  totalBudget: number;
  onApply: () => void;
};

function fmt(n: number) {
  return n.toLocaleString('ru-RU');
}

/** C1 — текст под итогами + outline-кнопка */
export function MissedBonusInlineOffer({ suggestedBonus, amountWithBonuses, onApply }: OfferProps) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
      <p className="mb-0 text-xs leading-snug text-gray-600">
        Можно списать до{' '}
        <span className="font-semibold tabular-nums text-[#2E7D32]">{fmt(suggestedBonus)} B</span>
        {' · '}
        с единого счёта от{' '}
        <span className="font-semibold tabular-nums text-gray-900">{fmt(amountWithBonuses)} ₽</span>
      </p>
      <button
        type="button"
        onClick={onApply}
        className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-[#9A41FE] transition-colors hover:border-[#9A41FE]/40 hover:bg-[#F9F5FF]"
      >
        Распределить бонусы
      </button>
    </div>
  );
}

/** Только инфо (без CTA) */
export function MissedBonusFooterInfo({ suggestedBonus, amountWithBonuses }: Omit<OfferProps, 'onApply' | 'totalBudget'>) {
  return (
    <p className="mb-0 mt-2 text-xs leading-snug text-gray-600">
      Можно списать до{' '}
      <span className="font-semibold tabular-nums text-[#2E7D32]">{fmt(suggestedBonus)} B</span>
      {' · '}
      с единого счёта от{' '}
      <span className="font-semibold tabular-nums text-gray-900">{fmt(amountWithBonuses)} ₽</span>
    </p>
  );
}

/** C2 — баннер на всю ширину футера */
export function MissedBonusFooterBanner({ suggestedBonus, amountWithBonuses, onApply }: OfferProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#F3E8FF] px-3 py-2.5">
      <div className="min-w-0">
        <p className="mb-0 text-sm font-semibold text-gray-900">Не использовали промобонусы</p>
        <p className="mb-0 mt-0.5 text-xs text-gray-600">
          Доступно{' '}
          <span className="font-semibold tabular-nums text-[#2E7D32]">{fmt(suggestedBonus)} B</span>
          {' — '}
          с единого счёта будет{' '}
          <span className="font-semibold tabular-nums">{fmt(amountWithBonuses)} ₽</span>
        </p>
      </div>
      <button
        type="button"
        onClick={onApply}
        className="shrink-0 rounded-lg bg-[#9A41FE] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#8A35EE]"
      >
        Распределить
      </button>
    </div>
  );
}

/** C3 — подмена колонки промобонусов */
export function MissedBonusPromoColumn({ suggestedBonus, onApply }: Pick<OfferProps, 'suggestedBonus' | 'onApply'>) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-500">Промобонусы</div>
      <div className="mt-0.5 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold tabular-nums text-[#2E7D32]">
          до –{fmt(suggestedBonus)} B
        </span>
        <button
          type="button"
          onClick={onApply}
          className="text-xs font-semibold text-[#9A41FE] hover:underline"
        >
          Применить
        </button>
      </div>
    </div>
  );
}

/** C4 — рядом с кнопкой Создать */
export function MissedBonusBesideLaunch({ suggestedBonus, onApply }: Pick<OfferProps, 'suggestedBonus' | 'onApply'>) {
  return (
    <button
      type="button"
      onClick={onApply}
      className="shrink-0 rounded-xl border border-[#9A41FE]/40 bg-white px-4 py-3 text-sm font-medium text-[#9A41FE] transition-colors hover:bg-[#F9F5FF]"
    >
      Списать {fmt(suggestedBonus)} B
    </button>
  );
}

/** C5 — snackbar над футером */
export function MissedBonusSnackbar({ suggestedBonus, amountWithBonuses, onApply }: OfferProps) {
  return (
    <div className="fixed bottom-[80px] left-0 right-0 z-[39] border-t border-[#E9D5FF] bg-[#FAF5FF] px-6 py-2.5">
      <div className="mx-auto flex w-full max-w-[1968px] flex-wrap items-center justify-between gap-3">
        <p className="mb-0 text-sm text-gray-800">
          Можно уменьшить списание с единого счёта до{' '}
          <span className="font-bold tabular-nums">{fmt(amountWithBonuses)} ₽</span>
          {' '}за счёт{' '}
          <span className="font-bold tabular-nums text-[#2E7D32]">{fmt(suggestedBonus)} B</span>
        </p>
        <button
          type="button"
          onClick={onApply}
          className="shrink-0 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
        >
          Распределить бонусы
        </button>
      </div>
    </div>
  );
}

/** C6 — баннер над островом */
export function MissedBonusIslandBanner({ suggestedBonus, amountWithBonuses, onApply }: OfferProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3">
      <div className="min-w-0">
        <p className="mb-0 text-sm font-semibold text-gray-900">Упускаете промобонусы</p>
        <p className="mb-0 mt-0.5 text-xs text-gray-600">
          Распределим до {fmt(suggestedBonus)} B по кампаниям — с единого счёта{' '}
          {fmt(amountWithBonuses)} ₽ вместо полной суммы
        </p>
      </div>
      <button
        type="button"
        onClick={onApply}
        className="shrink-0 rounded-xl bg-[#16A34A] px-3 py-2 text-xs font-semibold text-white hover:bg-[#15803D]"
      >
        Распределить по всем
      </button>
    </div>
  );
}

/** C7 — плавающая карточка */
export function MissedBonusFloatingCard({
  suggestedBonus,
  amountWithBonuses,
  totalBudget,
  onApply,
}: OfferProps) {
  return (
    <div className="fixed bottom-24 left-4 z-[45] w-[min(100vw-2rem,20rem)] rounded-2xl border border-gray-200 bg-white p-4 shadow-xl">
      <p className="mb-0 text-xs font-medium uppercase tracking-wide text-gray-400">Промобонусы</p>
      <p className="mb-0 mt-1 text-base font-bold text-gray-900">
        Сэкономьте до {fmt(suggestedBonus)} ₽
      </p>
      <p className="mb-0 mt-1 text-xs text-gray-500">
        <span className="tabular-nums line-through">{fmt(totalBudget)} ₽</span>
        {' → '}
        <span className="font-semibold tabular-nums text-gray-900">{fmt(amountWithBonuses)} ₽</span>
        {' '}с единого счёта
      </p>
      <button
        type="button"
        onClick={onApply}
        className="mt-3 w-full rounded-xl bg-[#9A41FE] px-3 py-2 text-sm font-semibold text-white hover:bg-[#8A35EE]"
      >
        Распределить бонусы
      </button>
    </div>
  );
}

/** C8 — ссылка под колонкой единого счёта */
export function MissedBonusAccountLink({ suggestedBonus, onApply }: Pick<OfferProps, 'suggestedBonus' | 'onApply'>) {
  return (
    <button
      type="button"
      onClick={onApply}
      className="mt-1 text-left text-[11px] font-medium leading-snug text-[#9A41FE] hover:underline"
    >
      Применить до {fmt(suggestedBonus)} B →
    </button>
  );
}

/** C9 — карточка сравнения до/после */
export function MissedBonusCompareCard({
  suggestedBonus,
  amountWithBonuses,
  totalBudget,
  onApply,
}: OfferProps) {
  return (
    <div className="mt-2 flex max-w-md items-stretch gap-2 rounded-xl border border-gray-200 bg-[#FAFAFB] p-2">
      <div className="min-w-0 flex-1 px-2 py-1">
        <p className="mb-0 text-[10px] font-medium uppercase text-gray-400">Сейчас</p>
        <p className="mb-0 text-sm font-bold tabular-nums text-gray-400 line-through">
          {fmt(totalBudget)} ₽
        </p>
      </div>
      <div className="min-w-0 flex-1 px-2 py-1">
        <p className="mb-0 text-[10px] font-medium uppercase text-[#2E7D32]">С бонусами</p>
        <p className="mb-0 text-sm font-bold tabular-nums text-gray-900">
          {fmt(amountWithBonuses)} ₽
        </p>
        <p className="mb-0 text-[11px] tabular-nums text-[#2E7D32]">–{fmt(suggestedBonus)} B</p>
      </div>
      <button
        type="button"
        onClick={onApply}
        className="shrink-0 self-center rounded-lg bg-[#9A41FE] px-2.5 py-2 text-[11px] font-semibold text-white hover:bg-[#8A35EE]"
      >
        Применить
      </button>
    </div>
  );
}

/** C10 — тогл */
export function MissedBonusToggleOffer({ suggestedBonus, onApply }: Pick<OfferProps, 'suggestedBonus' | 'onApply'>) {
  return (
    <div className="mt-2 flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={false}
        onClick={onApply}
        className="relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full bg-gray-300 transition-colors hover:bg-[#C4B5FD]"
        aria-label={`Списать ${fmt(suggestedBonus)} B`}
      >
        <span className="pointer-events-none inline-block h-5 w-5 translate-x-1 rounded-full bg-white shadow" />
      </button>
      <p className="mb-0 text-xs text-gray-700">
        Списать до{' '}
        <span className="font-semibold tabular-nums text-[#2E7D32]">{fmt(suggestedBonus)} B</span>
        {' '}промобонусами
      </p>
    </div>
  );
}

/**
 * C11 — Mobbin: OpenAI / Hume billing alert-row
 * https://mobbin.com/screens/7a177d91-cb3d-4f34-97ef-7bc710cb4bac
 * https://mobbin.com/screens/2863076b-5a75-441b-93b5-1dbce3f4b788
 */
export function MissedBonusAlertRow({ suggestedBonus, amountWithBonuses, onApply }: OfferProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-[#F7F7F8] px-4 py-3">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[11px] font-bold text-white"
          aria-hidden
        >
          i
        </span>
        <div className="min-w-0">
          <p className="mb-0 text-sm font-semibold text-gray-900">Промобонусы не списаны</p>
          <p className="mb-0 mt-0.5 text-xs leading-snug text-gray-600">
            На балансе есть{' '}
            <span className="font-semibold tabular-nums text-[#2E7D32]">{fmt(suggestedBonus)} B</span>
            . Без них с единого счёта уйдёт больше — можно снизить до{' '}
            <span className="font-semibold tabular-nums text-gray-900">{fmt(amountWithBonuses)} ₽</span>.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onApply}
        className="shrink-0 rounded-lg bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-gray-800"
      >
        Списать бонусы
      </button>
    </div>
  );
}

/**
 * C12 — Mobbin: Instacart sticky progress / threshold bar
 * https://mobbin.com/screens/d348ad45-becf-4175-bac1-2ebaebd3263b
 */
export function MissedBonusProgressBar({ suggestedBonus, amountWithBonuses, totalBudget, onApply }: OfferProps) {
  const savings = Math.max(0, totalBudget - amountWithBonuses);
  return (
    <div className="fixed bottom-[80px] left-0 right-0 z-[39] border-t border-gray-200 bg-[#1F1F1F] px-6 py-2.5 text-white">
      <div className="mx-auto flex w-full max-w-[1968px] flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="mb-0 text-sm font-medium">
              Сэкономьте до{' '}
              <span className="tabular-nums text-[#86EFAC]">{fmt(savings)} ₽</span>
              {' · '}
              применено{' '}
              <span className="tabular-nums">0 из {fmt(suggestedBonus)} B</span>
            </p>
            <button
              type="button"
              onClick={onApply}
              className="shrink-0 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 hover:bg-gray-100"
            >
              Применить
            </button>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
            <div className="h-full w-[4%] rounded-full bg-[#86EFAC]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function shouldReplacePromoColumn(uxId: PromoMissedBonusUxId): boolean {
  return uxId === 'cta-column';
}

export function shouldShowAccountLink(uxId: PromoMissedBonusUxId): boolean {
  return uxId === 'cta-link';
}
