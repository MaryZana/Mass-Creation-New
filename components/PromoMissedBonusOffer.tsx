import React from 'react';
import { createPortal } from 'react-dom';
import { X } from './Icons';
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

type InlineOfferProps = {
  suggestedBonus: number;
  amountWithBonuses: number;
  alreadyDistributed: number;
  balance: number;
  maxDistributable: number;
  maxAdditional: number;
  onApply: (amount: number) => void;
};

const BALANCE_UX_IDS: ReadonlyArray<PromoMissedBonusUxId> = [
  'bal-columns',
  'bal-progress',
  'bal-chips',
  'bal-stepper',
  'bal-dual',
];

export function isBalanceOfferUx(uxId: PromoMissedBonusUxId): boolean {
  return BALANCE_UX_IDS.includes(uxId);
}

/** Должен совпадать с порогом в блоке промобонусов ниже по файлу. */
const INLINE_PARTIAL_MIN = 1000;

function defaultPartAmount(alreadyDistributed: number, maxAdditional: number, maxDistributable: number) {
  if (alreadyDistributed > 0) {
    return Math.min(maxDistributable, alreadyDistributed + Math.floor(maxAdditional / 2));
  }
  return Math.floor(maxDistributable / 2) || maxDistributable;
}

function usePartAmount(
  alreadyDistributed: number,
  maxAdditional: number,
  maxDistributable: number,
) {
  const [partOpen, setPartOpen] = React.useState(false);
  const [part, setPart] = React.useState(() =>
    defaultPartAmount(alreadyDistributed, maxAdditional, maxDistributable),
  );

  React.useEffect(() => {
    setPart(defaultPartAmount(alreadyDistributed, maxAdditional, maxDistributable));
    setPartOpen(false);
  }, [alreadyDistributed, maxAdditional, maxDistributable]);

  return { partOpen, setPartOpen, part, setPart };
}

function OutlineAllPartButtons({
  alreadyDistributed,
  maxDistributable,
  maxAdditional,
  onApply,
}: Pick<InlineOfferProps, 'alreadyDistributed' | 'maxDistributable' | 'maxAdditional' | 'onApply'>) {
  const { partOpen, setPartOpen, part, setPart } = usePartAmount(
    alreadyDistributed,
    maxAdditional,
    maxDistributable,
  );
  const canSplit = maxAdditional >= INLINE_PARTIAL_MIN;
  const allLabel =
    alreadyDistributed > 0
      ? `Всё оставшееся · ${fmt(maxAdditional)} B`
      : `Распределить всё · ${fmt(maxDistributable)} B`;

  if (partOpen) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <BonusAmountInput value={part} max={maxDistributable} onChange={setPart} autoFocus />
        <span className="text-[11px] tabular-nums text-[#9191A0]">
          из {fmt(maxDistributable)}
          {alreadyDistributed > 0 ? `, уже ${fmt(alreadyDistributed)}` : ''}
        </span>
        <button
          type="button"
          disabled={part <= 0 || (alreadyDistributed > 0 && part <= alreadyDistributed)}
          onClick={() => {
            onApply(part);
            setPartOpen(false);
          }}
          className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-[#9A41FE] transition-colors hover:border-[#9A41FE]/40 hover:bg-[#F9F5FF] disabled:opacity-40"
        >
          Распределить
        </button>
        <button
          type="button"
          onClick={() => setPartOpen(false)}
          className="text-xs font-medium text-[#63616C] hover:text-gray-900"
        >
          Отмена
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => onApply(maxDistributable)}
        className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-[#9A41FE] transition-colors hover:border-[#9A41FE]/40 hover:bg-[#F9F5FF]"
      >
        {allLabel}
      </button>
      {canSplit ? (
        <button
          type="button"
          onClick={() => setPartOpen(true)}
          className="rounded-lg border border-transparent bg-[#F0F0F2] px-2.5 py-1 text-xs font-semibold text-gray-900 transition-colors hover:bg-[#E6E6EA]"
        >
          Часть…
        </button>
      ) : null}
    </div>
  );
}

function InlineStatusLine({
  suggestedBonus,
  amountWithBonuses,
  alreadyDistributed,
  balance,
  maxAdditional,
}: Omit<InlineOfferProps, 'maxDistributable' | 'onApply'>) {
  const canAct = maxAdditional > 0;
  if (alreadyDistributed > 0) {
    return (
      <p className="mb-0 text-xs leading-snug text-gray-600">
        Распределено{' '}
        <span className="font-semibold tabular-nums text-gray-900">{fmt(alreadyDistributed)} B</span>
        {' · '}
        на счету ещё{' '}
        <span className="font-semibold tabular-nums text-[#2E7D32]">{fmt(balance)} B</span>
        {canAct ? (
          <>
            {' · '}
            можно ещё{' '}
            <span className="font-semibold tabular-nums text-[#2E7D32]">{fmt(maxAdditional)} B</span>
          </>
        ) : (
          <span className="text-[#9191A0]"> · на эти кампании больше не списать</span>
        )}
      </p>
    );
  }
  return (
    <p className="mb-0 text-xs leading-snug text-gray-600">
      На счету <span className="font-semibold tabular-nums text-[#2E7D32]">{fmt(balance)} B</span>
      {' · '}
      можно списать до{' '}
      <span className="font-semibold tabular-nums text-[#2E7D32]">{fmt(suggestedBonus)} B</span>
      {' · '}
      с единого счёта от{' '}
      <span className="font-semibold tabular-nums text-gray-900">{fmt(amountWithBonuses)} ₽</span>
    </p>
  );
}

/** C1 — статус остатка + «всё / часть» */
export function MissedBonusInlineOffer(props: InlineOfferProps) {
  const { maxAdditional, alreadyDistributed, maxDistributable, onApply } = props;
  const canAct = maxAdditional > 0;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
      <InlineStatusLine {...props} />
      {canAct ? (
        <OutlineAllPartButtons
          alreadyDistributed={alreadyDistributed}
          maxDistributable={maxDistributable}
          maxAdditional={maxAdditional}
          onApply={onApply}
        />
      ) : null}
    </div>
  );
}

/** C48–C52 — лаконичные варианты: уже / ещё + всё или часть */
export function MissedBonusBalanceOffer({
  uxId,
  ...props
}: InlineOfferProps & { uxId: PromoMissedBonusUxId }) {
  const {
    alreadyDistributed,
    balance,
    maxDistributable,
    maxAdditional,
    amountWithBonuses,
    onApply,
  } = props;
  const canAct = maxAdditional > 0;
  const canSplit = maxAdditional >= INLINE_PARTIAL_MIN;
  const halfTotal = Math.min(
    maxDistributable,
    alreadyDistributed + Math.floor(maxAdditional / 2),
  );
  const { part, setPart } = usePartAmount(alreadyDistributed, maxAdditional, maxDistributable);
  const usedPercent =
    maxDistributable > 0 ? Math.min(100, (alreadyDistributed / maxDistributable) * 100) : 0;

  if (uxId === 'bal-columns') {
    return (
      <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-2">
        <div className="min-w-0">
          <div className="text-[11px] font-bold leading-4 text-[#63616C]">Распределено</div>
          <div className="mt-0.5 text-[15px] font-bold leading-5 tabular-nums text-gray-900">
            {fmt(alreadyDistributed)} B
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-bold leading-4 text-[#166533]">Ещё можно</div>
          <div className="mt-0.5 text-[15px] font-bold leading-5 tabular-nums text-[#166533]">
            {fmt(maxAdditional)} B
          </div>
        </div>
        <div className="min-w-0 text-[11px] leading-4 text-[#9191A0]">
          на счету {fmt(balance)} B
        </div>
        {canAct ? (
          <OutlineAllPartButtons
            alreadyDistributed={alreadyDistributed}
            maxDistributable={maxDistributable}
            maxAdditional={maxAdditional}
            onApply={onApply}
          />
        ) : (
          <span className="text-xs text-[#9191A0]">лимит кампаний исчерпан</span>
        )}
      </div>
    );
  }

  if (uxId === 'bal-progress') {
    return (
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="min-w-[200px] flex-1">
          <div className="flex items-center justify-between text-[11px] font-bold leading-4">
            <span className="text-[#63616C]">
              Распределено {fmt(alreadyDistributed)} из {fmt(maxDistributable)} B
            </span>
            <span className="tabular-nums text-[#166533]">ещё {fmt(maxAdditional)} B</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#E3E4E9]">
            <div
              className="h-full rounded-full bg-[#22C55E] transition-[width]"
              style={{ width: `${usedPercent}%` }}
            />
          </div>
          <div className="mt-1 text-[11px] leading-4 text-[#9191A0]">
            на счету {fmt(balance)} B
            {!canAct ? ' · больше не списать' : ''}
          </div>
        </div>
        {canAct ? (
          <OutlineAllPartButtons
            alreadyDistributed={alreadyDistributed}
            maxDistributable={maxDistributable}
            maxAdditional={maxAdditional}
            onApply={onApply}
          />
        ) : null}
      </div>
    );
  }

  if (uxId === 'bal-chips') {
    return (
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-2">
        <span className="inline-flex h-7 items-center rounded-full bg-[#F0F0F2] px-2.5 text-xs font-semibold tabular-nums text-gray-900">
          уже {fmt(alreadyDistributed)} B
        </span>
        <span className="inline-flex h-7 items-center rounded-full bg-[#E7FCDE] px-2.5 text-xs font-semibold tabular-nums text-[#166533]">
          ещё {fmt(maxAdditional)} B
        </span>
        <span className="text-[11px] tabular-nums text-[#9191A0]">счёт {fmt(balance)} B</span>
        {canAct ? (
          <OutlineAllPartButtons
            alreadyDistributed={alreadyDistributed}
            maxDistributable={maxDistributable}
            maxAdditional={maxAdditional}
            onApply={onApply}
          />
        ) : null}
      </div>
    );
  }

  if (uxId === 'bal-stepper') {
    const step = maxDistributable >= 10000 ? 500 : maxDistributable >= 1000 ? 100 : 50;
    const minPart = alreadyDistributed > 0 ? alreadyDistributed + step : step;
    return (
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        <InlineStatusLine {...props} />
        {canAct ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="inline-flex h-7 items-center overflow-hidden rounded-lg border border-gray-200 bg-white">
              <button
                type="button"
                aria-label="Меньше"
                disabled={part <= minPart}
                onClick={() => setPart(Math.max(minPart, part - step))}
                className="inline-flex h-7 w-7 items-center justify-center text-gray-700 hover:bg-[#F6F6F9] disabled:opacity-30"
              >
                −
              </button>
              <span className="min-w-[72px] px-1 text-center text-xs font-semibold tabular-nums text-gray-900">
                {fmt(part)} B
              </span>
              <button
                type="button"
                aria-label="Больше"
                disabled={part >= maxDistributable}
                onClick={() => setPart(Math.min(maxDistributable, part + step))}
                className="inline-flex h-7 w-7 items-center justify-center text-gray-700 hover:bg-[#F6F6F9] disabled:opacity-30"
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={() => onApply(part)}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-[#9A41FE] transition-colors hover:border-[#9A41FE]/40 hover:bg-[#F9F5FF]"
            >
              Распределить
            </button>
            {part < maxDistributable ? (
              <button
                type="button"
                onClick={() => onApply(maxDistributable)}
                className="text-xs font-medium text-[#63616C] hover:text-gray-900"
              >
                или всё · {fmt(maxAdditional)} B
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  // bal-dual
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
      <p className="mb-0 text-xs leading-snug text-gray-600">
        {alreadyDistributed > 0 ? (
          <>
            Уже {fmt(alreadyDistributed)} B · на счету {fmt(balance)} B · можно ещё{' '}
            <span className="font-semibold tabular-nums text-[#2E7D32]">{fmt(maxAdditional)} B</span>
          </>
        ) : (
          <>
            На счету {fmt(balance)} B · до{' '}
            <span className="font-semibold tabular-nums text-[#2E7D32]">{fmt(maxDistributable)} B</span>
            {' · '}
            к оплате от {fmt(amountWithBonuses)} ₽
          </>
        )}
      </p>
      {canAct ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onApply(maxDistributable)}
            className="rounded-lg bg-[#9A41FE] px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#8A35EE]"
          >
            {alreadyDistributed > 0 ? `Всё оставшееся · ${fmt(maxAdditional)} B` : `Всё · ${fmt(maxDistributable)} B`}
          </button>
          {canSplit ? (
            <button
              type="button"
              onClick={() => onApply(halfTotal)}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-900 transition-colors hover:bg-[#F6F6F9]"
            >
              Половину · {fmt(Math.max(0, halfTotal - alreadyDistributed))} B
            </button>
          ) : null}
        </div>
      ) : null}
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

const NEAR_UX_IDS: ReadonlyArray<PromoMissedBonusUxId> = [
  'near-pill',
  'near-chip',
  'near-warning',
  'near-split',
  'near-ghost',
  'save-big',
  'save-badge',
  'save-button',
  'save-columns',
  'save-percent',
  'lat-coupon',
  'lat-overpay',
  'lat-segmented',
  'lat-paybar',
  'lat-per-campaign',
  'pro-receipt',
  'pro-split-pill',
  'pro-switch',
  'pro-popover',
  'pro-boost',
  'x-sparkle',
  'x-bars',
  'x-question',
  'x-compare-bars',
  'x-assistant',
  'hv-info',
  'hv-underline',
  'hv-chip',
  'hv-segments',
  'hv-button',
];

const PROMO_BLOCK_UX_IDS: ReadonlyArray<PromoMissedBonusUxId> = [
  'pb-presets',
  'pb-menu',
  'pb-input',
  'pb-slider',
  'pb-meter',
];

export function isPromoBlockOfferUx(uxId: PromoMissedBonusUxId): boolean {
  return PROMO_BLOCK_UX_IDS.includes(uxId);
}

export function isPromoPillOfferUx(uxId: PromoMissedBonusUxId): boolean {
  return uxId === 'pb-pill';
}

/** C53 — сумма + «Используйте ещё»: правый шит с распределением по кампаниям */
export function MissedBonusPromoPill({
  alreadyDistributed,
  maxDistributable,
  maxAdditional,
  balance,
  distribution = [],
  onApply,
}: {
  alreadyDistributed: number;
  maxDistributable: number;
  maxAdditional: number;
  balance: number;
  distribution?: readonly BonusDistributionRow[];
  /** Итоговое назначение по id кампании (абсолют, не «добавка»). */
  onApply: (byCampaign: Record<string, number>) => void;
  /** @deprecated попап заменён на правый шит */
  menuPlacement?: 'top' | 'bottom';
}) {
  const spendable = alreadyDistributed > 0 ? maxAdditional : maxDistributable;
  const [open, setOpen] = React.useState(false);
  const [amount, setAmount] = React.useState(spendable);
  const [draftById, setDraftById] = React.useState<Record<string, number>>({});
  const [manual, setManual] = React.useState(false);
  const canAct = maxAdditional > 0;
  const pool = maxDistributable > 0 ? maxDistributable : balance;

  const rows = React.useMemo(
    () =>
      distribution.filter((row) => (row.maxBonus ?? row.bonus) > 0 || (row.currentBonus ?? 0) > 0),
    [distribution],
  );
  const caps = React.useMemo(
    () => rows.map((row) => row.maxBonus ?? row.bonus),
    [rows],
  );

  const targetTotal = React.useMemo(() => {
    const add = clampBonus(amount, spendable);
    return Math.min(maxDistributable, alreadyDistributed > 0 ? alreadyDistributed + add : add);
  }, [amount, spendable, alreadyDistributed, maxDistributable]);

  const redistributeByLimits = React.useCallback(
    (total: number) => {
      const shares = allocateByCaps(caps, total);
      const next: Record<string, number> = {};
      rows.forEach((row, i) => {
        next[row.id] = shares[i] ?? 0;
      });
      setDraftById(next);
      setManual(false);
    },
    [caps, rows],
  );

  React.useEffect(() => {
    if (!open) return;
    setAmount(spendable);
    setManual(false);
  }, [open, spendable]);

  React.useEffect(() => {
    if (!open || manual) return;
    redistributeByLimits(targetTotal);
  }, [open, targetTotal, manual, redistributeByLimits]);

  const draftTotal = rows.reduce((sum, row) => sum + (draftById[row.id] ?? 0), 0);

  const setRowBonus = (id: string, value: number) => {
    const row = rows.find((item) => item.id === id);
    if (!row) return;
    const max = row.maxBonus ?? row.bonus;
    setManual(true);
    setDraftById((prev) => ({ ...prev, [id]: clampBonus(value, max) }));
  };

  const close = () => setOpen(false);

  const apply = () => {
    if (draftTotal <= 0) return;
    const payload: Record<string, number> = {};
    for (const row of rows) {
      const value = draftById[row.id] ?? 0;
      if (value > 0) payload[row.id] = value;
    }
    onApply(payload);
    close();
  };

  return (
    <div className="min-w-0">
      <div className="text-[11px] font-bold leading-4 text-[#63616C]">Промобонусы</div>
      <div className="mt-1 flex items-center gap-2">
        <span
          className={`text-[17px] font-bold leading-6 tabular-nums ${
            alreadyDistributed > 0 ? 'text-gray-900' : 'text-[#9191A0]'
          }`}
        >
          {fmt(alreadyDistributed)}
          {alreadyDistributed > 0 ? ' B' : ''}
        </span>
        {canAct ? (
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="inline-flex h-7 items-center gap-1 rounded-full bg-[#F0F0F2] px-2.5 text-[13px] font-semibold tabular-nums text-gray-900 transition-colors hover:bg-[#E6E6EA]"
          >
            Используйте ещё {fmt(maxAdditional > 0 ? maxAdditional : pool)} B
            <svg
              viewBox="0 0 12 12"
              className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden
            >
              <path d="M2.5 4.5L6 8l3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : null}
      </div>

      {open
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] bg-black/50"
              onClick={close}
              role="presentation"
            >
              <div className="flex h-full w-full justify-end" onClick={close}>
                <div
                  className="flex h-full max-h-full min-w-0 items-stretch gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex shrink-0 flex-col justify-start pt-5 pl-3">
                    <button
                      type="button"
                      onClick={close}
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
                    aria-labelledby="promo-bonus-distribute-title"
                  >
                    <div className="shrink-0 border-b border-black/[0.04] bg-white px-6 pb-4 pt-6 sm:px-7">
                      <h2
                        id="promo-bonus-distribute-title"
                        className="text-[22px] font-bold tracking-tight text-gray-900"
                      >
                        Использовать промобонусы
                      </h2>
                    </div>

                    <div className="min-w-0 flex-1 space-y-5 overflow-y-auto px-6 py-5 sm:px-7">
                      <div className="rounded-[24px] bg-white px-4 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                        <label className="flex min-h-[52px] cursor-text flex-col justify-center gap-0.5 rounded-[10px] border border-transparent bg-[#F2F2F7] px-3 py-2 transition-colors hover:bg-[#EBEBF0] focus-within:border-black focus-within:bg-white">
                          <span className="text-[12px] font-medium leading-4 text-gray-900">
                            Сумма
                          </span>
                          <span className="flex min-w-0 items-center gap-1">
                            <input
                              type="text"
                              inputMode="numeric"
                              autoFocus
                              value={amount ? fmt(amount) : ''}
                              placeholder="0"
                              onChange={(e) => {
                                setManual(false);
                                setAmount(
                                  clampBonus(Number(e.target.value.replace(/\D/g, '')), spendable),
                                );
                              }}
                              className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold tabular-nums leading-5 text-gray-900 outline-none"
                              aria-label="Сумма промобонусов"
                            />
                            <span className="shrink-0 text-[14px] font-medium text-[#A0A0AB]">B</span>
                          </span>
                        </label>
                      </div>

                      <div className="rounded-[24px] bg-white px-4 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                        <div className="px-1 pb-1 pt-3 text-[13px] font-semibold text-gray-900">
                          На кампании
                        </div>
                        <div>
                          {rows.map((row) => {
                            const max = row.maxBonus ?? row.bonus;
                            const value = draftById[row.id] ?? 0;
                            const current = row.currentBonus ?? 0;
                            return (
                              <div
                                key={row.id}
                                className="flex items-start justify-between gap-4 border-b border-gray-100 py-3.5 last:border-b-0"
                              >
                                <div className="flex min-w-0 items-start gap-3">
                                  {row.imageUrl ? (
                                    <img
                                      src={row.imageUrl}
                                      alt=""
                                      className="h-12 w-12 shrink-0 rounded-lg bg-gray-50 object-cover"
                                    />
                                  ) : (
                                    <div className="h-12 w-12 shrink-0 rounded-lg bg-gray-100" />
                                  )}
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-gray-950">
                                      {row.name}
                                    </p>
                                    <div className="mt-0.5 text-xs tabular-nums text-gray-500">
                                      макс {fmt(max)} B
                                      {row.packageLabel ? ` · ${row.packageLabel}` : ''}
                                      {current > 0 ? ` · сейчас ${fmt(current)} B` : ''}
                                    </div>
                                  </div>
                                </div>
                                <label className="relative inline-flex h-9 w-[140px] shrink-0 items-center overflow-hidden rounded-[10px] border border-transparent bg-[#F2F2F7] px-2.5 transition-colors hover:bg-[#EBEBF0] focus-within:border-black focus-within:bg-white">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={value ? fmt(value) : ''}
                                    placeholder="0"
                                    onChange={(e) =>
                                      setRowBonus(row.id, Number(e.target.value.replace(/\D/g, '')))
                                    }
                                    className="min-w-0 flex-1 bg-transparent pr-6 text-sm font-medium tabular-nums text-gray-900 outline-none"
                                    aria-label={`Бонусы для ${row.name}`}
                                  />
                                  <span className="pointer-events-none absolute right-2.5 text-sm font-medium text-[#A0A0AB]">
                                    B
                                  </span>
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 border-t border-black/[0.04] bg-white px-6 py-4 sm:px-7">
                      <button
                        type="button"
                        disabled={draftTotal <= 0}
                        onClick={apply}
                        className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gray-900 text-[15px] font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                      >
                        Применить
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

/** Ниже этого порога предлагаем только «Распределить всё» — делить на части нет смысла. */
const PARTIAL_MIN_BONUS = 1000;

type PromoBlockProps = {
  uxId: PromoMissedBonusUxId;
  /** Остаток промобонусов на счету */
  balance: number;
  /** Сколько можно списать на текущие кампании с учётом лимитов */
  maxDistributable: number;
  onApply: (amount: number) => void;
};

function clampBonus(value: number, max: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(max, Math.floor(value)));
}

function PromoBlockHeader({ balance }: { balance: number }) {
  return (
    <div className="text-[11px] font-bold leading-4 text-[#63616C]">
      Промобонусы · <span className="tabular-nums text-[#166533]">на счету {fmt(balance)} B</span>
    </div>
  );
}

function BonusAmountInput({
  value,
  max,
  onChange,
  autoFocus,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
  autoFocus?: boolean;
}) {
  return (
    <label className="inline-flex h-7 items-center gap-1 rounded-lg bg-[#F0F0F2] px-2 text-xs font-semibold tabular-nums text-gray-900 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#9C45FD]/40">
      <input
        type="text"
        inputMode="numeric"
        autoFocus={autoFocus}
        value={value ? fmt(value) : ''}
        placeholder="0"
        onChange={(e) => onChange(clampBonus(Number(e.target.value.replace(/\D/g, '')), max))}
        className="w-[56px] bg-transparent text-right outline-none"
      />
      <span className="text-[#9191A0]">B</span>
    </label>
  );
}

function PromoMenuOffer({ maxDistributable, onApply }: Omit<PromoBlockProps, 'uxId' | 'balance'>) {
  const [open, setOpen] = React.useState(false);
  const [custom, setCustom] = React.useState(Math.floor(maxDistributable / 2));
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const apply = (amount: number) => {
    onApply(amount);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => apply(maxDistributable)}
        className="inline-flex h-7 items-center rounded-l-lg bg-[#9C45FD] px-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#8A35EE]"
      >
        Распределить {fmt(maxDistributable)} B
      </button>
      <button
        type="button"
        aria-label="Распределить часть"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-7 items-center rounded-r-lg border-l border-white/30 bg-[#9C45FD] px-1.5 text-white transition-colors hover:bg-[#8A35EE]"
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>
      {open ? (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-[220px] rounded-xl bg-white p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.16)]">
          <button
            type="button"
            onClick={() => apply(maxDistributable)}
            className="flex w-full justify-between rounded-lg px-2 py-1.5 text-xs text-gray-900 hover:bg-[#F6F6F9]"
          >
            Всё <span className="tabular-nums text-[#63616C]">{fmt(maxDistributable)} B</span>
          </button>
          <button
            type="button"
            onClick={() => apply(Math.floor(maxDistributable / 2))}
            className="flex w-full justify-between rounded-lg px-2 py-1.5 text-xs text-gray-900 hover:bg-[#F6F6F9]"
          >
            Половину{' '}
            <span className="tabular-nums text-[#63616C]">{fmt(Math.floor(maxDistributable / 2))} B</span>
          </button>
          <div className="mt-1 flex items-center gap-1.5 border-t border-[#E3E4E9] px-1 pt-1.5">
            <BonusAmountInput value={custom} max={maxDistributable} onChange={setCustom} />
            <button
              type="button"
              disabled={custom <= 0}
              onClick={() => apply(custom)}
              className="inline-flex h-7 flex-1 items-center justify-center rounded-lg bg-gray-900 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-40"
            >
              Своя сумма
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PromoMeterOffer({ balance, maxDistributable, onApply }: Omit<PromoBlockProps, 'uxId'>) {
  const [partOpen, setPartOpen] = React.useState(false);
  const [part, setPart] = React.useState(Math.floor(maxDistributable / 2));
  const usablePercent = balance > 0 ? Math.max(4, Math.min(100, (maxDistributable / balance) * 100)) : 0;
  const canSplit = maxDistributable >= PARTIAL_MIN_BONUS;

  return (
    <div className="w-[220px]">
      <div className="flex items-center justify-between text-[11px] font-bold leading-4">
        <span className="text-[#63616C]">Промобонусы</span>
        <span className="tabular-nums text-[#63616C]">на счету {fmt(balance)} B</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#E3E4E9]">
        <div className="h-full rounded-full bg-[#22C55E]" style={{ width: `${usablePercent}%` }} />
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        {partOpen ? (
          <>
            <BonusAmountInput value={part} max={maxDistributable} onChange={setPart} autoFocus />
            <NearPrimaryButton onClick={() => onApply(part)}>Распределить</NearPrimaryButton>
            <button
              type="button"
              onClick={() => setPartOpen(false)}
              className="text-xs font-medium text-[#63616C] hover:text-gray-900"
            >
              Отмена
            </button>
          </>
        ) : (
          <>
            <NearPrimaryButton onClick={() => onApply(maxDistributable)}>
              Всё · {fmt(maxDistributable)} B
            </NearPrimaryButton>
            {canSplit ? (
              <button
                type="button"
                onClick={() => setPartOpen(true)}
                className="inline-flex h-7 items-center rounded-lg bg-[#F0F0F2] px-2.5 text-xs font-semibold text-gray-900 hover:bg-[#E6E6EA]"
              >
                Часть…
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

/** C43–C47 — замена колонки «Промобонусы»: остаток на счету + распределить всё или часть */
export function MissedBonusPromoBlock({ uxId, balance, maxDistributable, onApply }: PromoBlockProps) {
  const [amount, setAmount] = React.useState(maxDistributable);
  React.useEffect(() => setAmount(maxDistributable), [maxDistributable]);
  const canSplit = maxDistributable >= PARTIAL_MIN_BONUS;
  const limitedByCampaigns = balance > maxDistributable;

  if (uxId === 'pb-presets') {
    const presets = canSplit
      ? [
          { label: '25%', value: Math.floor(maxDistributable * 0.25) },
          { label: '50%', value: Math.floor(maxDistributable * 0.5) },
          { label: `Всё ${fmt(maxDistributable)}`, value: maxDistributable },
        ]
      : [{ label: `Распределить ${fmt(maxDistributable)}`, value: maxDistributable }];
    return (
      <div className="min-w-0">
        <PromoBlockHeader balance={balance} />
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[17px] font-bold leading-6 tabular-nums text-gray-900">0 B</span>
          <div className="inline-flex rounded-lg bg-[#F0F0F2] p-0.5">
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => onApply(preset.value)}
                className="inline-flex h-6 items-center rounded-md px-2 text-xs font-semibold tabular-nums text-gray-900 transition-colors hover:bg-white hover:text-[#9C45FD]"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (uxId === 'pb-menu') {
    return (
      <div className="min-w-0">
        <PromoBlockHeader balance={balance} />
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[17px] font-bold leading-6 tabular-nums text-gray-900">0 B</span>
          {canSplit ? (
            <PromoMenuOffer maxDistributable={maxDistributable} onApply={onApply} />
          ) : (
            <NearPrimaryButton onClick={() => onApply(maxDistributable)}>
              Распределить {fmt(maxDistributable)} B
            </NearPrimaryButton>
          )}
        </div>
      </div>
    );
  }

  if (uxId === 'pb-input') {
    return (
      <div className="min-w-0">
        <PromoBlockHeader balance={balance} />
        <div className="mt-1 flex items-center gap-1.5">
          <BonusAmountInput value={amount} max={maxDistributable} onChange={setAmount} />
          <span className="text-xs tabular-nums text-[#9191A0]">из {fmt(maxDistributable)}</span>
          <NearPrimaryButton onClick={() => onApply(amount)}>Распределить</NearPrimaryButton>
        </div>
      </div>
    );
  }

  if (uxId === 'pb-slider') {
    const step = maxDistributable >= 10000 ? 500 : maxDistributable >= 1000 ? 100 : 10;
    return (
      <div className="w-[240px]">
        <PromoBlockHeader balance={balance} />
        <div className="mt-1 flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={maxDistributable}
            step={step}
            value={amount}
            onChange={(e) => setAmount(clampBonus(Number(e.target.value), maxDistributable))}
            className="h-1 min-w-0 flex-1 cursor-pointer accent-[#9C45FD]"
            aria-label="Сколько бонусов распределить"
          />
          <NearPrimaryButton onClick={() => onApply(amount)}>
            {amount >= maxDistributable ? 'Всё' : fmt(amount)} B
          </NearPrimaryButton>
        </div>
        {limitedByCampaigns ? (
          <div className="text-[11px] leading-4 text-[#9191A0]">
            На эти кампании — до {fmt(maxDistributable)} B
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <PromoMeterOffer balance={balance} maxDistributable={maxDistributable} onApply={onApply} />
  );
}

function pluralCampaigns(n: number, one = 'кампания') {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'кампании';
  return 'кампаний';
}

export type BonusDistributionRow = {
  id: string;
  name: string;
  budget: number;
  imageUrl?: string;
  /** Макс. / предлагаемая сумма для превью */
  bonus: number;
  /** Потолок списания с кампании (для ручного перераспределения) */
  maxBonus?: number;
  /** Уже назначено на кампанию */
  currentBonus?: number;
  packageId?: string;
  /** Например: «до 50% · до 20.03» */
  packageLabel?: string;
};

/**
 * Делит target пропорционально потолкам кампаний (пакеты/max% разные → суммы разные).
 * Не «поровну»: у кого выше лимит — тому больше, но не больше max.
 */
function allocateByCaps(caps: readonly number[], target: number): number[] {
  const shares = caps.map(() => 0);
  const sumCaps = caps.reduce((sum, cap) => sum + Math.max(0, cap), 0);
  if (caps.length === 0 || target <= 0 || sumCaps <= 0) return shares;
  const cappedTarget = Math.min(Math.floor(target), sumCaps);

  caps.forEach((cap, i) => {
    shares[i] = Math.floor((cappedTarget * Math.max(0, cap)) / sumCaps);
  });
  let remaining = cappedTarget - shares.reduce((sum, value) => sum + value, 0);

  const order = caps
    .map((cap, i) => ({ i, room: Math.max(0, cap) - shares[i], cap: Math.max(0, cap) }))
    .filter((item) => item.room > 0)
    .sort((a, b) => b.room - a.room || b.cap - a.cap);

  let guard = 0;
  while (remaining > 0 && order.length > 0 && guard < cappedTarget + order.length) {
    const item = order[guard % order.length];
    if (shares[item.i] < caps[item.i]) {
      shares[item.i] += 1;
      remaining -= 1;
      item.room -= 1;
    }
    guard += 1;
  }
  return shares;
}

const DISTRIBUTION_VISIBLE_ROWS = 5;

function DistributionCard({
  rows,
  savings,
  totalBudget,
  amountWithBonuses,
  highlightId,
}: {
  rows: readonly BonusDistributionRow[];
  savings: number;
  totalBudget: number;
  amountWithBonuses: number;
  highlightId?: string | null;
}) {
  const highlightedIndex = highlightId ? rows.findIndex((r) => r.id === highlightId) : -1;
  const visible =
    highlightedIndex >= DISTRIBUTION_VISIBLE_ROWS
      ? [...rows.slice(0, DISTRIBUTION_VISIBLE_ROWS - 1), rows[highlightedIndex]]
      : rows.slice(0, DISTRIBUTION_VISIBLE_ROWS);
  const hiddenCount = rows.length - visible.length;
  const hiddenBonus = rows
    .filter((r) => !visible.includes(r))
    .reduce((sum, r) => sum + r.bonus, 0);

  return (
    <div className="w-[340px] rounded-xl bg-white p-3 text-left shadow-[0_8px_24px_rgba(0,0,0,0.16)]">
      <p className="mb-0 text-[13px] font-semibold leading-5 text-gray-900">
        Как распределим бонусы
      </p>
      <p className="mb-2 mt-0.5 text-[11px] leading-4 text-[#63616C]">
        {rows.length === 1
          ? 'Бонусы спишутся с одной кампании — по лимиту её пакета'
          : `По лимитам пакетов на ${rows.length} кампаниях — у каждой свой максимум, не поровну`}
      </p>
      <div className="space-y-1">
        {visible.map((row) => (
          <div
            key={row.id}
            className={`flex items-center gap-2 rounded-md px-1.5 py-1 text-xs leading-4 tabular-nums transition-colors ${
              row.id === highlightId ? 'bg-[#F6EEFF]' : ''
            }`}
          >
            <span className="min-w-0 flex-1 truncate text-gray-900">{row.name}</span>
            <span className="shrink-0 text-[#9191A0] line-through">{fmt(row.budget)}</span>
            <span className="shrink-0 font-semibold text-gray-900">{fmt(row.budget - row.bonus)} ₽</span>
            <span className="w-[64px] shrink-0 text-right font-semibold text-[#166533]">
              +{fmt(row.bonus)} B
            </span>
          </div>
        ))}
        {hiddenCount > 0 ? (
          <div className="flex items-center justify-between px-1.5 text-[11px] leading-4 text-[#63616C]">
            <span>и ещё {hiddenCount}</span>
            <span className="tabular-nums text-[#166533]">+{fmt(hiddenBonus)} B</span>
          </div>
        ) : null}
      </div>
      <div className="mt-2 space-y-0.5 border-t border-[#E3E4E9] pt-2 text-xs leading-4 tabular-nums">
        <div className="flex justify-between text-[#63616C]">
          <span>Без бонусов</span>
          <span>{fmt(totalBudget)} ₽</span>
        </div>
        <div className="flex justify-between font-semibold text-gray-900">
          <span>С бонусами спишется со счёта</span>
          <span>{fmt(amountWithBonuses)} ₽</span>
        </div>
        <div className="flex justify-between text-[13px] font-bold text-[#166533]">
          <span>Экономия</span>
          <span>{fmt(savings)} ₽</span>
        </div>
      </div>
    </div>
  );
}

function HoverDistribution({
  trigger,
  className,
  ...card
}: React.ComponentProps<typeof DistributionCard> & {
  trigger: (open: boolean) => React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const closeTimer = React.useRef<number | null>(null);

  const show = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hide = () => {
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  };

  return (
    <div
      className={`relative ${className ?? ''}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {trigger(open)}
      {open ? (
        <div className="absolute bottom-full left-0 z-50 pb-2">
          <DistributionCard {...card} />
        </div>
      ) : null}
    </div>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 7.2V11M8 5v.01" strokeLinecap="round" />
    </svg>
  );
}

const SEGMENT_COLORS = ['#22C55E', '#16A34A', '#4ADE80', '#15803D', '#86EFAC'];

function SegmentsOffer({
  rows,
  savings,
  totalBudget,
  amountWithBonuses,
  onApply,
}: {
  rows: readonly BonusDistributionRow[];
  savings: number;
  totalBudget: number;
  amountWithBonuses: number;
  onApply: () => void;
}) {
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const total = rows.reduce((sum, r) => sum + r.bonus, 0) || 1;

  return (
    <div className="flex min-w-0 items-end gap-3">
      <HoverDistribution
        rows={rows}
        savings={savings}
        totalBudget={totalBudget}
        amountWithBonuses={amountWithBonuses}
        highlightId={hoveredId}
        trigger={() => (
          <div className="w-[220px]">
            <div className="flex items-center justify-between text-[11px] font-bold leading-4">
              <span className="text-[#63616C]">Бонусы по {rows.length} кампаниям</span>
              <span className="tabular-nums text-[#166533]">−{fmt(savings)} ₽</span>
            </div>
            <div className="mt-1.5 flex h-3 gap-[2px]" onMouseLeave={() => setHoveredId(null)}>
              {rows.map((row, i) => (
                <span
                  key={row.id}
                  onMouseEnter={() => setHoveredId(row.id)}
                  className={`h-full cursor-default rounded-sm transition-opacity ${
                    hoveredId && hoveredId !== row.id ? 'opacity-40' : ''
                  }`}
                  style={{
                    width: `${(row.bonus / total) * 100}%`,
                    backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
                  }}
                />
              ))}
            </div>
            <div className="mt-1 text-[11px] leading-4 text-[#63616C]">
              Наведите на сегмент — покажем кампанию
            </div>
          </div>
        )}
      />
      <NearPrimaryButton onClick={onApply}>Распределить поровну</NearPrimaryButton>
    </div>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden>
      <path d="M8 0l1.6 4.8L14.4 6.4 9.6 8 8 12.8 6.4 8 1.6 6.4l4.8-1.6L8 0zm5 10l.7 2.3L16 13l-2.3.7L13 16l-.7-2.3L10 13l2.3-.7L13 10z" />
    </svg>
  );
}

function NearAssistantOffer({
  savings,
  onApply,
}: {
  savings: number;
  onApply: () => void;
}) {
  const [dismissed, setDismissed] = React.useState(false);
  if (dismissed) return null;
  return (
    <div className="flex items-center gap-2 self-end">
      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#9C45FD] to-[#D946EF] text-white">
        <SparkleIcon className="h-3.5 w-3.5" />
      </span>
      <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-[#F6EEFF] py-1 pl-3 pr-1">
        <span className="text-[13px] leading-5 text-gray-900">
          Могу сэкономить вам{' '}
          <span className="font-bold tabular-nums text-[#166533]">{fmt(savings)} ₽</span> — раздать
          бонусы?
        </span>
        <button
          type="button"
          onClick={onApply}
          className="inline-flex h-7 items-center rounded-full bg-[#9C45FD] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#8A35EE]"
        >
          Да
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="inline-flex h-7 items-center rounded-full px-2 text-xs font-medium text-[#63616C] transition-colors hover:bg-white/70"
        >
          Не сейчас
        </button>
      </div>
    </div>
  );
}

function NearPopoverOffer({
  savings,
  suggestedBonus,
  amountWithBonuses,
  totalBudget,
  campaignsCount,
  onApply,
}: {
  savings: number;
  suggestedBonus: number;
  amountWithBonuses: number;
  totalBudget: number;
  campaignsCount: number;
  onApply: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative min-w-0">
      <div className="text-[11px] font-bold leading-4 text-[#166533]">Можно дешевле</div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-1 text-[17px] font-bold leading-6 tabular-nums text-[#166533] underline decoration-dotted decoration-2 underline-offset-4 hover:decoration-solid"
      >
        −{fmt(savings)} ₽
      </button>
      {open ? (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-[280px] rounded-xl bg-white p-3 shadow-[0_8px_24px_rgba(0,0,0,0.16)]">
          <p className="mb-2 text-[13px] font-semibold leading-5 text-gray-900">
            {fmt(suggestedBonus)} B промобонусов не потрачены
          </p>
          <div className="space-y-1 text-xs leading-4 text-[#63616C]">
            <div className="flex justify-between">
              <span>Сейчас</span>
              <span className="tabular-nums">{fmt(totalBudget)} ₽</span>
            </div>
            <div className="flex justify-between">
              <span>С бонусами</span>
              <span className="font-semibold tabular-nums text-gray-900">{fmt(amountWithBonuses)} ₽</span>
            </div>
            {campaignsCount > 0 ? (
              <div className="flex justify-between">
                <span>Кампаний получат бонусы</span>
                <span className="tabular-nums">{campaignsCount}</span>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => {
              onApply();
              setOpen(false);
            }}
            className="mt-3 inline-flex h-8 w-full items-center justify-center rounded-lg bg-[#9C45FD] text-xs font-semibold text-white transition-colors hover:bg-[#8A35EE]"
          >
            Распределить поровну · −{fmt(savings)} ₽
          </button>
        </div>
      ) : null}
    </div>
  );
}

function NearPrimaryButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-7 shrink-0 items-center rounded-lg bg-[#9C45FD] px-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#8A35EE]"
    >
      {children}
    </button>
  );
}

export function isNearAccountOfferUx(uxId: PromoMissedBonusUxId): boolean {
  return NEAR_UX_IDS.includes(uxId);
}

/** C13–C17 — блок справа от «С единого счёта», в одной строке с итогами */
export function MissedBonusNearAccount({
  uxId,
  suggestedBonus,
  amountWithBonuses,
  totalBudget,
  onApply,
  campaignsCount = 0,
  distribution = [],
}: OfferProps & {
  uxId: PromoMissedBonusUxId;
  campaignsCount?: number;
  distribution?: readonly BonusDistributionRow[];
}) {
  const savings = Math.max(0, totalBudget - amountWithBonuses);
  const savingsPercent = totalBudget > 0 ? Math.round((savings / totalBudget) * 100) : 0;
  const cardProps = { rows: distribution, savings, totalBudget, amountWithBonuses };

  if (uxId === 'hv-info') {
    return (
      <HoverDistribution
        {...cardProps}
        className="min-w-0"
        trigger={(open) => (
          <>
            <div className="flex items-center gap-1 text-[11px] font-bold leading-4 text-[#63616C]">
              С бонусами
              <InfoIcon className={`h-3.5 w-3.5 ${open ? 'text-[#9C45FD]' : 'text-[#9191A0]'}`} />
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[17px] font-bold leading-6 text-[#9191A0]" aria-hidden>
                →
              </span>
              <span className="text-[17px] font-bold leading-6 tabular-nums text-gray-900">
                {fmt(amountWithBonuses)} ₽
              </span>
              <span className="text-[13px] font-bold tabular-nums text-[#166533]">
                экономия {fmt(savings)} ₽
              </span>
              <NearPrimaryButton onClick={onApply}>Распределить</NearPrimaryButton>
            </div>
          </>
        )}
      />
    );
  }

  if (uxId === 'hv-underline') {
    return (
      <div className="min-w-0">
        <div className="text-[11px] font-bold leading-4 text-[#63616C]">
          {fmt(suggestedBonus)} B не потрачены
        </div>
        <div className="mt-1 flex items-center gap-2">
          <HoverDistribution
            {...cardProps}
            trigger={(open) => (
              <span
                tabIndex={0}
                className={`cursor-help text-[17px] font-bold leading-6 tabular-nums text-[#166533] underline decoration-dotted decoration-2 underline-offset-4 ${
                  open ? 'decoration-solid' : ''
                }`}
              >
                Сэкономите {fmt(savings)} ₽
              </span>
            )}
          />
          <NearPrimaryButton onClick={onApply}>Распределить</NearPrimaryButton>
        </div>
      </div>
    );
  }

  if (uxId === 'hv-chip') {
    return (
      <div className="flex items-center gap-2 self-end pb-0.5">
        <HoverDistribution
          {...cardProps}
          trigger={(open) => (
            <span
              tabIndex={0}
              className={`inline-flex h-8 cursor-help items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold tabular-nums text-[#166533] transition-colors ${
                open ? 'bg-[#D8F5CC]' : 'bg-[#E7FCDE]'
              }`}
            >
              −{fmt(savings)} ₽
              <span className="font-medium text-[#3F7A4F]">
                · {distribution.length} {pluralCampaigns(distribution.length)}
              </span>
              <InfoIcon className="h-3.5 w-3.5" />
            </span>
          )}
        />
        <NearPrimaryButton onClick={onApply}>Распределить поровну</NearPrimaryButton>
      </div>
    );
  }

  if (uxId === 'hv-segments') {
    return <SegmentsOffer {...cardProps} onApply={onApply} />;
  }

  if (uxId === 'hv-button') {
    return (
      <div className="min-w-0">
        <div className="text-[11px] font-bold leading-4 text-[#63616C]">
          Бонусы не потрачены · было{' '}
          <span className="tabular-nums line-through">{fmt(totalBudget)} ₽</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[17px] font-bold leading-6 tabular-nums text-gray-900">
            {fmt(amountWithBonuses)} ₽
          </span>
          <HoverDistribution
            {...cardProps}
            trigger={() => (
              <NearPrimaryButton onClick={onApply}>Сэкономить {fmt(savings)} ₽</NearPrimaryButton>
            )}
          />
        </div>
      </div>
    );
  }

  if (uxId === 'x-sparkle') {
    return (
      <div className="min-w-0">
        <div className="flex items-center gap-1 text-[11px] font-bold leading-4 text-[#9C45FD]">
          <span className="relative inline-flex h-3 w-3">
            <span className="absolute inset-0 animate-ping rounded-full bg-[#9C45FD]/40" />
            <SparkleIcon className="relative h-3 w-3" />
          </span>
          {fmt(suggestedBonus)} B ждут распределения
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="bg-gradient-to-r from-[#16A34A] to-[#9C45FD] bg-clip-text text-[17px] font-bold leading-6 tabular-nums text-transparent">
            −{fmt(savings)} ₽
          </span>
          <NearPrimaryButton onClick={onApply}>Забрать выгоду</NearPrimaryButton>
        </div>
      </div>
    );
  }

  if (uxId === 'x-bars') {
    const bars = Math.min(8, Math.max(3, campaignsCount || 5));
    return (
      <div className="flex min-w-0 items-end gap-3">
        <div className="flex h-10 items-end gap-[3px]" aria-hidden>
          {Array.from({ length: bars }).map((_, i) => (
            <span key={i} className="flex w-2 flex-col justify-end overflow-hidden rounded-sm bg-[#E3E4E9]" style={{ height: `${60 + ((i * 37) % 40)}%` }}>
              <span className="h-[35%] bg-[#22C55E]" />
            </span>
          ))}
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-bold leading-4 text-[#63616C]">
            {campaignsCount
              ? `Поровну на ${campaignsCount} ${pluralCampaigns(campaignsCount, 'кампанию')}`
              : 'Поровну на все кампании'}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[17px] font-bold leading-6 tabular-nums text-[#166533]">
              −{fmt(savings)} ₽
            </span>
            <NearPrimaryButton onClick={onApply}>Распределить</NearPrimaryButton>
          </div>
        </div>
      </div>
    );
  }

  if (uxId === 'x-question') {
    return (
      <div className="min-w-0">
        <div className="text-[11px] font-bold leading-4 text-[#63616C]">
          Бонусы не потрачены
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[15px] font-semibold leading-6 text-gray-900">
            Платить{' '}
            <span className="tabular-nums text-[#166533]">{fmt(amountWithBonuses)} ₽</span> вместо{' '}
            <span className="tabular-nums text-[#9191A0] line-through">{fmt(totalBudget)} ₽</span>?
          </span>
          <NearPrimaryButton onClick={onApply}>Да, распределить</NearPrimaryButton>
        </div>
      </div>
    );
  }

  if (uxId === 'x-compare-bars') {
    const withShare = totalBudget > 0 ? Math.max(8, (amountWithBonuses / totalBudget) * 100) : 100;
    return (
      <div className="flex min-w-0 items-end gap-3">
        <div className="w-[200px] space-y-1 text-[11px] font-semibold leading-4 tabular-nums">
          <div className="flex items-center gap-2">
            <span className="h-2 flex-1 rounded-full bg-[#C9CAD3]" />
            <span className="w-[64px] text-right text-[#63616C]">{fmt(totalBudget)} ₽</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 flex-1">
              <span className="h-full rounded-full bg-[#22C55E]" style={{ width: `${withShare}%` }} />
            </span>
            <span className="w-[64px] text-right text-[#166533]">{fmt(amountWithBonuses)} ₽</span>
          </div>
          <div className="text-[#166533]">Выгода {fmt(savings)} ₽ с бонусами</div>
        </div>
        <NearPrimaryButton onClick={onApply}>Распределить</NearPrimaryButton>
      </div>
    );
  }

  if (uxId === 'x-assistant') {
    return <NearAssistantOffer savings={savings} onApply={onApply} />;
  }

  if (uxId === 'pro-receipt') {
    return (
      <div className="flex items-end gap-2">
        <div className="w-[170px] rounded-lg bg-[#F6F6F9] px-2.5 py-1.5 text-[11px] leading-4 tabular-nums">
          <div className="flex justify-between text-[#63616C]">
            <span>Бюджет</span>
            <span>{fmt(totalBudget)} ₽</span>
          </div>
          <div className="flex justify-between text-[#166533]">
            <span>Бонусы</span>
            <span>−{fmt(savings)} ₽</span>
          </div>
          <div className="mt-0.5 flex justify-between border-t border-dashed border-[#C9CAD3] pt-0.5 font-bold text-gray-900">
            <span>К оплате</span>
            <span>{fmt(amountWithBonuses)} ₽</span>
          </div>
        </div>
        <NearPrimaryButton onClick={onApply}>Распределить</NearPrimaryButton>
      </div>
    );
  }

  if (uxId === 'pro-split-pill') {
    return (
      <button
        type="button"
        onClick={onApply}
        className="group inline-flex h-9 items-stretch self-end overflow-hidden rounded-full text-[13px] font-semibold"
      >
        <span className="inline-flex items-center gap-1 bg-[#E7FCDE] px-3 tabular-nums text-[#166533]">
          Выгода {fmt(savings)} ₽
        </span>
        <span className="inline-flex items-center gap-1 bg-[#9C45FD] px-3 text-white transition-colors group-hover:bg-[#8A35EE]">
          Распределить {fmt(suggestedBonus)} B
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M6 3l5 5-5 5" />
          </svg>
        </span>
      </button>
    );
  }

  if (uxId === 'pro-switch') {
    return (
      <div className="min-w-0">
        <div className="text-[11px] font-bold leading-4 text-[#63616C]">
          {fmt(suggestedBonus)} B не потрачены
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={false}
          onClick={onApply}
          className="mt-1 flex h-6 items-center gap-2"
        >
          <span className="relative inline-flex h-5 w-9 shrink-0 rounded-full bg-[#C9CAD3] transition-colors hover:bg-[#B5B6C2]">
            <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow" />
          </span>
          <span className="text-[13px] font-semibold text-gray-900">Списать бонусы</span>
          <span className="text-[13px] font-bold tabular-nums text-[#166533]">−{fmt(savings)} ₽</span>
        </button>
      </div>
    );
  }

  if (uxId === 'pro-popover') {
    return (
      <NearPopoverOffer
        savings={savings}
        suggestedBonus={suggestedBonus}
        amountWithBonuses={amountWithBonuses}
        totalBudget={totalBudget}
        campaignsCount={campaignsCount}
        onApply={onApply}
      />
    );
  }

  if (uxId === 'pro-boost') {
    const boostPercent =
      amountWithBonuses > 0 ? Math.round((totalBudget / amountWithBonuses - 1) * 100) : 0;
    return (
      <div className="min-w-0">
        <div className="text-[11px] font-bold leading-4 text-[#63616C]">
          Бюджет кампаний за те же деньги
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[17px] font-bold leading-6 tabular-nums text-[#9C45FD]">
            +{boostPercent}%
          </span>
          <span className="text-xs text-[#63616C]">
            или экономия{' '}
            <span className="font-semibold tabular-nums text-[#166533]">{fmt(savings)} ₽</span>
          </span>
          <NearPrimaryButton onClick={onApply}>Добавить бонусы</NearPrimaryButton>
        </div>
      </div>
    );
  }

  if (uxId === 'lat-coupon') {
    return (
      <button
        type="button"
        onClick={onApply}
        className="group relative flex items-center gap-3 self-end rounded-xl border-2 border-dashed border-[#9C45FD]/50 bg-[#F6EEFF] py-1 pl-3 pr-1 text-left transition-colors hover:border-[#9C45FD]"
      >
        <span className="flex flex-col">
          <span className="text-[11px] font-bold leading-4 text-[#7A2FD6]">Купон на запуск</span>
          <span className="text-[17px] font-bold leading-6 tabular-nums text-[#7A2FD6]">
            −{fmt(savings)} ₽
          </span>
        </span>
        <span className="inline-flex h-8 items-center rounded-lg bg-[#9C45FD] px-3 text-xs font-semibold text-white transition-colors group-hover:bg-[#8A35EE]">
          Применить
        </span>
      </button>
    );
  }

  if (uxId === 'lat-overpay') {
    return (
      <div className="min-w-0">
        <div className="text-[11px] font-bold leading-4 text-[#F97316]">Переплата</div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[17px] font-bold leading-6 tabular-nums text-[#F97316]">
            {fmt(savings)} ₽
          </span>
          <span className="text-xs text-[#63616C]">
            — {fmt(suggestedBonus)} B лежат без дела
          </span>
          <NearPrimaryButton onClick={onApply}>Не переплачивать</NearPrimaryButton>
        </div>
      </div>
    );
  }

  if (uxId === 'lat-segmented') {
    return (
      <div className="min-w-0">
        <div className="text-[11px] font-bold leading-4 text-[#63616C]">Как запустить</div>
        <div className="mt-1 inline-flex rounded-lg bg-[#F0F0F2] p-0.5">
          <span className="inline-flex h-7 items-center gap-1.5 rounded-md bg-white px-2.5 text-xs font-semibold text-gray-900 shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
            Без бонусов
            <span className="tabular-nums text-[#63616C]">{fmt(totalBudget)} ₽</span>
          </span>
          <button
            type="button"
            onClick={onApply}
            className="inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold text-[#166533] transition-colors hover:bg-white/70"
          >
            С бонусами
            <span className="tabular-nums">{fmt(amountWithBonuses)} ₽</span>
            <span className="rounded bg-[#E7FCDE] px-1 tabular-nums">−{fmt(savings)}</span>
          </button>
        </div>
      </div>
    );
  }

  if (uxId === 'lat-paybar') {
    const bonusShare = totalBudget > 0 ? Math.min(100, (savings / totalBudget) * 100) : 0;
    return (
      <div className="flex min-w-0 items-end gap-3">
        <div className="w-[180px]">
          <div className="flex items-center justify-between text-[11px] font-bold leading-4">
            <span className="text-[#63616C]">Кто платит</span>
            <span className="tabular-nums text-[#166533]">бонусы −{fmt(savings)} ₽</span>
          </div>
          <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-[#E3E4E9]">
            <div className="h-full bg-[#9191A0]" style={{ width: `${100 - bonusShare}%` }} />
            <div
              className="h-full bg-[repeating-linear-gradient(135deg,#22C55E_0_4px,#86EFAC_4px_8px)]"
              style={{ width: `${bonusShare}%` }}
            />
          </div>
          <div className="mt-1 text-[11px] leading-4 text-[#63616C]">
            Вы — <span className="tabular-nums">{fmt(amountWithBonuses)} ₽</span>, остальное
            оплатят бонусы
          </div>
        </div>
        <NearPrimaryButton onClick={onApply}>Подключить бонусы</NearPrimaryButton>
      </div>
    );
  }

  if (uxId === 'lat-per-campaign') {
    const perCampaign = campaignsCount > 0 ? Math.floor(suggestedBonus / campaignsCount) : 0;
    return (
      <div className="min-w-0">
        <div className="text-[11px] font-bold leading-4 text-[#63616C]">
          {campaignsCount > 0
            ? `≈ ${fmt(perCampaign)} B на каждую из ${campaignsCount} кампаний`
            : `${fmt(suggestedBonus)} B по кампаниям`}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="flex -space-x-1.5" aria-hidden>
            {Array.from({ length: Math.min(4, Math.max(1, campaignsCount)) }).map((_, i) => (
              <span
                key={i}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#E7FCDE] text-[10px] font-bold text-[#166533]"
              >
                B
              </span>
            ))}
          </span>
          <span className="text-[17px] font-bold leading-6 tabular-nums text-[#166533]">
            −{fmt(savings)} ₽
          </span>
          <NearPrimaryButton onClick={onApply}>Раздать поровну</NearPrimaryButton>
        </div>
      </div>
    );
  }

  if (uxId === 'save-big') {
    return (
      <div className="min-w-0">
        <div className="text-[11px] font-bold leading-4 text-[#166533]">Сэкономите с бонусами</div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[17px] font-bold leading-6 tabular-nums text-[#166533]">
            −{fmt(savings)} ₽
          </span>
          <NearPrimaryButton onClick={onApply}>Распределить {fmt(suggestedBonus)} B</NearPrimaryButton>
        </div>
      </div>
    );
  }

  if (uxId === 'save-badge') {
    return (
      <div className="min-w-0">
        <div className="text-[11px] font-bold leading-4 text-[#63616C]">С бонусами</div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[17px] font-bold leading-6 text-[#9191A0]" aria-hidden>
            →
          </span>
          <span className="text-[17px] font-bold leading-6 tabular-nums text-gray-900">
            {fmt(amountWithBonuses)} ₽
          </span>
          <span className="inline-flex h-6 items-center rounded-full bg-[#E7FCDE] px-2 text-xs font-semibold tabular-nums text-[#166533]">
            Выгода {fmt(savings)} ₽
          </span>
          <NearPrimaryButton onClick={onApply}>Распределить</NearPrimaryButton>
        </div>
      </div>
    );
  }

  if (uxId === 'save-button') {
    return (
      <div className="min-w-0">
        <div className="text-[11px] font-bold leading-4 text-[#63616C]">
          {fmt(suggestedBonus)} B бонусов не потрачены
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[17px] font-bold leading-6 text-[#9191A0]" aria-hidden>
            →
          </span>
          <span className="text-[17px] font-bold leading-6 tabular-nums text-gray-900">
            {fmt(amountWithBonuses)} ₽
          </span>
          <NearPrimaryButton onClick={onApply}>Сэкономить {fmt(savings)} ₽</NearPrimaryButton>
        </div>
      </div>
    );
  }

  if (uxId === 'save-columns') {
    return (
      <>
        <div className="min-w-0">
          <div className="text-[11px] font-bold leading-4 text-[#63616C]">С бонусами</div>
          <div className="mt-1 text-[17px] font-bold leading-6 tabular-nums text-gray-900">
            {fmt(amountWithBonuses)} ₽
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-bold leading-4 text-[#166533]">Выгода</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[17px] font-bold leading-6 tabular-nums text-[#166533]">
              {fmt(savings)} ₽
            </span>
            <NearPrimaryButton onClick={onApply}>Распределить</NearPrimaryButton>
          </div>
        </div>
      </>
    );
  }

  if (uxId === 'save-percent') {
    return (
      <div className="min-w-0">
        <div className="text-[11px] font-bold leading-4 text-[#63616C]">С бонусами</div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[17px] font-bold leading-6 text-[#9191A0]" aria-hidden>
            →
          </span>
          <span className="text-[17px] font-bold leading-6 tabular-nums text-gray-900">
            {fmt(amountWithBonuses)} ₽
          </span>
          <span className="flex flex-col text-[11px] font-semibold leading-[13px] tabular-nums text-[#166533]">
            <span>−{fmt(savings)} ₽</span>
            <span>−{savingsPercent}% бюджета</span>
          </span>
          <NearPrimaryButton onClick={onApply}>Распределить</NearPrimaryButton>
        </div>
      </div>
    );
  }

  if (uxId === 'near-pill') {
    return (
      <div className="flex items-center gap-2 self-end pb-0.5">
        <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#E7FCDE] px-3 text-[13px] font-medium text-[#166533]">
          <span className="tabular-nums font-bold">{fmt(suggestedBonus)} B</span>
          не потрачены
        </span>
        <button
          type="button"
          onClick={onApply}
          className="inline-flex h-8 items-center rounded-full bg-gray-900 px-3 text-[13px] font-medium text-white transition-colors hover:bg-gray-800"
        >
          Распределить
        </button>
      </div>
    );
  }

  if (uxId === 'near-chip') {
    return (
      <div className="min-w-0">
        <div className="text-[11px] font-bold leading-4 text-[#166533]">Можно сэкономить</div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[17px] font-bold leading-6 tabular-nums text-[#166533]">
            {fmt(amountWithBonuses)} ₽
          </span>
          <button
            type="button"
            onClick={onApply}
            className="inline-flex h-7 items-center rounded-lg bg-[#E7FCDE] px-2.5 text-xs font-semibold text-[#166533] transition-colors hover:bg-[#D8F5CC]"
          >
            Применить {fmt(suggestedBonus)} B
          </button>
        </div>
      </div>
    );
  }

  if (uxId === 'near-warning') {
    return (
      <div className="min-w-0 self-end pb-0.5">
        <p className="mb-0 flex items-center gap-1 text-[13px] font-medium leading-5 text-[#F97316]">
          <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="currentColor" aria-hidden>
            <path d="M8 1.5 15 14H1L8 1.5Zm-.75 4.5v4h1.5V6h-1.5Zm0 5.25v1.5h1.5v-1.5h-1.5Z" />
          </svg>
          {fmt(suggestedBonus)} B промобонусов не используются
        </p>
        <button
          type="button"
          onClick={onApply}
          className="mt-0.5 text-[13px] font-medium text-[#9C45FD] hover:underline"
        >
          Распределить по кампаниям
        </button>
      </div>
    );
  }

  if (uxId === 'near-split') {
    return (
      <div className="min-w-0">
        <div className="text-[11px] font-bold leading-4 text-[#63616C]">С бонусами</div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[17px] font-bold leading-6 text-[#9191A0]" aria-hidden>
            →
          </span>
          <span className="text-[17px] font-bold leading-6 tabular-nums text-gray-900">
            {fmt(amountWithBonuses)} ₽
          </span>
          <span className="text-xs font-semibold tabular-nums text-[#166533]">
            –{fmt(savings)} ₽
          </span>
          <button
            type="button"
            onClick={onApply}
            className="inline-flex h-7 items-center rounded-lg bg-[#9C45FD] px-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#8A35EE]"
          >
            Распределить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex max-w-[360px] items-center gap-3 self-end rounded-xl bg-[#F6F6F9] py-1.5 pl-3 pr-1.5">
      <p className="mb-0 min-w-0 text-xs leading-4 text-gray-700">
        Промобонусы не потрачены — распределим{' '}
        <span className="font-bold tabular-nums text-[#166533]">{fmt(suggestedBonus)} B</span> по
        всем кампаниям равномерно
      </p>
      <button
        type="button"
        onClick={onApply}
        className="inline-flex h-8 shrink-0 items-center rounded-lg bg-white px-3 text-xs font-semibold text-gray-900 shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition-colors hover:bg-gray-50"
      >
        Распределить
      </button>
    </div>
  );
}

export function shouldReplacePromoColumn(uxId: PromoMissedBonusUxId): boolean {
  return uxId === 'cta-column';
}

export function shouldShowAccountLink(uxId: PromoMissedBonusUxId): boolean {
  return uxId === 'cta-link';
}
