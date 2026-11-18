import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search, X } from './Icons';
import { useFinanceLocale } from './FinanceLocaleContext';
import { formatFinanceMoney, formatFinanceNumber, tFinance } from './financeI18n';

export type ContractKind = 'КН' | 'ДС' | 'ТП';
export type ContractChannel = 'promotion' | 'media';
/** Тип медиаконтракта: оплата по показам / по дням / пуши */
export type MediaBilling = 'impressions' | 'days' | 'pushes';

export type FinanceContract = {
  id: number;
  kind: ContractKind;
  channel: ContractChannel;
  mediaBilling?: MediaBilling;
  signedAt: string;
  startsAt: string;
  counterparty: string;
  expiresAt: string;
  balanceRub: number;
};

export type ContractStatus = 'active' | 'low' | 'expired';

/** Минимальный остаток, с которым можно запустить кампанию */
export const CONTRACT_MIN_LAUNCH_RUB = 1_000;
/** Красная подпись «ещё N дн.» — только за неделю до конца */
const CONTRACT_URGENT_DAYS = 7;
/** Сколько контрактов в группе видно до «Показать все» */
const CONTRACTS_PREVIEW_COUNT = 5;
/** С какого количества контрактов показываем поиск */
const CONTRACTS_SEARCH_FROM = 8;

export const CONTRACT_KINDS: ContractKind[] = ['КН', 'ДС', 'ТП'];

export const MEDIA_BILLINGS: MediaBilling[] = ['impressions', 'days', 'pushes'];

export const CONTRACT_CHANNEL_LABEL: Record<ContractChannel, string> = {
  get promotion() {
    return tFinance('promotion');
  },
  get media() {
    return tFinance('media');
  },
};

export const MEDIA_BILLING_LABEL: Record<MediaBilling, string> = {
  get impressions() {
    return tFinance('byImpressions');
  },
  get days() {
    return tFinance('byDays');
  },
  get pushes() {
    return tFinance('pushes');
  },
};

const fmtRuDate = (date: Date) =>
  `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

/** Дополнительные контракты, чтобы проверить длинный список */
const GENERATED_CONTRACTS: FinanceContract[] = Array.from({ length: 26 }, (_, i) => {
  const signed = addDays(new Date(2025, 0, 10), i * 23);
  const channel: ContractChannel = i % 4 === 3 ? 'media' : 'promotion';
  const expires = addDays(signed, channel === 'media' ? 200 : 380);
  const expired = expires.getTime() < Date.now();
  return {
    id: 1_400_000 + i * 1_373,
    kind: CONTRACT_KINDS[i % 3],
    channel,
    ...(channel === 'media' ? { mediaBilling: MEDIA_BILLINGS[i % 3] } : {}),
    signedAt: fmtRuDate(signed),
    startsAt: fmtRuDate(addDays(signed, 14)),
    counterparty: 'Рога и копыта',
    expiresAt: fmtRuDate(expires),
    balanceRub: expired
      ? 120 + ((i * 337) % 2_400)
      : i % 5 === 0
        ? 380 + i * 23
        : 3_000 + ((i * 7_919) % 118_000),
  };
});

export const DEMO_CONTRACTS: FinanceContract[] = [
  { id: 1_245_708, kind: 'КН', channel: 'promotion', signedAt: '09.04.2026', startsAt: '30.04.2026', counterparty: 'Рога и копыта', expiresAt: '15.05.2027', balanceRub: 184_500 },
  { id: 1_302_115, kind: 'ТП', channel: 'promotion', signedAt: '12.08.2026', startsAt: '01.09.2026', counterparty: 'Рога и копыта', expiresAt: '31.08.2027', balanceRub: 96_200 },
  { id: 1_198_442, kind: 'ДС', channel: 'promotion', signedAt: '03.02.2026', startsAt: '15.02.2026', counterparty: 'Рога и копыта', expiresAt: '30.11.2026', balanceRub: 42_700 },
  { id: 1_261_930, kind: 'ТП', channel: 'promotion', signedAt: '20.05.2026', startsAt: '01.06.2026', counterparty: 'Рога и копыта', expiresAt: '01.06.2027', balanceRub: 31_000 },
  { id: 1_104_528, kind: 'КН', channel: 'promotion', signedAt: '15.10.2025', startsAt: '01.11.2025', counterparty: 'Рога и копыта', expiresAt: '05.12.2026', balanceRub: 12_350 },
  { id: 1_310_077, kind: 'ДС', channel: 'promotion', signedAt: '01.09.2026', startsAt: '10.09.2026', counterparty: 'Рога и копыта', expiresAt: '10.09.2027', balanceRub: 7_800 },
  { id: 1_012_334, kind: 'ТП', channel: 'promotion', signedAt: '11.03.2025', startsAt: '01.04.2025', counterparty: 'Рога и копыта', expiresAt: '31.03.2026', balanceRub: 25_400 },
  { id: 1_056_780, kind: 'КН', channel: 'promotion', signedAt: '18.06.2025', startsAt: '01.07.2025', counterparty: 'Рога и копыта', expiresAt: '18.06.2026', balanceRub: 640 },
  { id: 1_132_905, kind: 'ДС', channel: 'promotion', signedAt: '27.11.2025', startsAt: '01.12.2025', counterparty: 'Рога и копыта', expiresAt: '27.11.2026', balanceRub: 870 },
  { id: 1_160_214, kind: 'ТП', channel: 'promotion', signedAt: '05.01.2026', startsAt: '15.01.2026', counterparty: 'Рога и копыта', expiresAt: '31.12.2026', balanceRub: 310 },
  { id: 1_284_401, kind: 'КН', channel: 'promotion', signedAt: '02.07.2026', startsAt: '15.07.2026', counterparty: 'Рога и копыта', expiresAt: '02.07.2027', balanceRub: 950 },
  { id: 1_290_553, kind: 'ТП', channel: 'media', mediaBilling: 'impressions', signedAt: '14.07.2026', startsAt: '01.08.2026', counterparty: 'Рога и копыта', expiresAt: '31.12.2026', balanceRub: 150_000 },
  { id: 1_318_820, kind: 'КН', channel: 'media', mediaBilling: 'days', signedAt: '25.09.2026', startsAt: '01.10.2026', counterparty: 'Рога и копыта', expiresAt: '25.03.2027', balanceRub: 60_000 },
  { id: 1_201_117, kind: 'ДС', channel: 'media', mediaBilling: 'pushes', signedAt: '10.02.2026', startsAt: '01.03.2026', counterparty: 'Рога и копыта', expiresAt: '10.08.2026', balanceRub: 18_900 },
  { id: 1_140_023, kind: 'ТП', channel: 'media', mediaBilling: 'impressions', signedAt: '01.12.2025', startsAt: '15.12.2025', counterparty: 'Рога и копыта', expiresAt: '01.06.2026', balanceRub: 420 },
  ...GENERATED_CONTRACTS,
];

const fmtRub = (n: number) => formatFinanceNumber(n);

const parseRuDate = (value: string) => {
  const [d, m, y] = value.split('.').map(Number);
  return new Date(y, m - 1, d);
};

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

export const contractDaysLeft = (contract: FinanceContract) =>
  Math.round((parseRuDate(contract.expiresAt).getTime() - startOfToday().getTime()) / 86_400_000);

export function contractStatus(contract: FinanceContract): ContractStatus {
  if (contractDaysLeft(contract) < 0) return 'expired';
  if (contract.balanceRub < CONTRACT_MIN_LAUNCH_RUB) return 'low';
  return 'active';
}

/** Название, как в документах WB */
export const contractFullName = (c: FinanceContract) =>
  `${c.kind} от ${c.signedAt}(${c.startsAt}) / ${c.counterparty} / iD ${c.id} до ${c.expiresAt}`;

/** Короткое название — используется как источник списания в истории */
export const contractShortName = (c: FinanceContract) => `${c.kind} от ${c.signedAt}`;

export const CONTRACT_BY_SOURCE: Record<string, FinanceContract> = Object.fromEntries(
  DEMO_CONTRACTS.map((c) => [contractShortName(c), c]),
);

/** Не истёкшие: и с нормальным, и с малым остатком */
export const ACTIVE_CONTRACTS = DEMO_CONTRACTS.filter((c) => contractStatus(c) !== 'expired');

const shortDate = (value: string) => value.replace(/\.(\d{2})(\d{2})$/, '.$2');

export function ContractKindTile({
  contract,
  size = 'md',
}: {
  contract: Pick<FinanceContract, 'kind' | 'channel'>;
  size?: 'sm' | 'md';
}) {
  const tone =
    contract.channel === 'media' ? 'bg-[#F3E8FF] text-[#9A41FE]' : 'bg-[#E8F1FF] text-[#007AFF]';
  const dims = size === 'sm' ? 'h-6 w-6 rounded-full text-[9px]' : 'h-9 w-9 rounded-xl text-[11px]';
  return (
    <span className={`inline-flex shrink-0 items-center justify-center font-bold ${dims} ${tone}`} aria-hidden>
      {contract.kind}
    </span>
  );
}

type ChannelFilter = 'all' | ContractChannel;

const ContractRow: React.FC<{ contract: FinanceContract; onExtend?: () => void }> = ({ contract, onExtend }) => {
  const status = contractStatus(contract);
  const days = contractDaysLeft(contract);
  const activeLike = status !== 'expired';
  const expiringSoon = activeLike && days <= CONTRACT_URGENT_DAYS;
  const extendable = status === 'expired' && contract.channel === 'promotion';

  const reason =
    status === 'expired'
      ? contract.channel === 'media'
        ? `Истёк ${shortDate(contract.expiresAt)} · медиа не продлевается`
        : `Истёк ${shortDate(contract.expiresAt)}`
      : status === 'low'
        ? `Меньше ${fmtRub(CONTRACT_MIN_LAUNCH_RUB)} ₽ — не хватит на запуск`
        : null;

  const fullName = contractFullName(contract);
  return (
    <div className="flex items-center gap-3 py-2.5" title={fullName}>
      <span className={activeLike ? '' : 'opacity-50'}>
        <ContractKindTile contract={contract} />
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={`mb-0 line-clamp-2 text-sm leading-snug ${
            activeLike ? 'text-gray-900' : 'text-gray-500'
          }`}
        >
          {fullName}
        </p>
        {reason ? (
          <p className="mb-0 mt-0.5 truncate text-xs leading-tight text-gray-500">{reason}</p>
        ) : null}
      </div>
      <div className="shrink-0 text-right">
        <p
          className={`mb-0 text-sm font-semibold leading-tight tabular-nums ${
            activeLike ? 'text-gray-900' : 'text-gray-400'
          }`}
        >
          {formatFinanceMoney(contract.balanceRub)}
        </p>
        {extendable ? (
          <button
            type="button"
            onClick={onExtend}
            className="mt-0.5 text-xs font-medium text-[#9A41FE] transition-colors hover:text-[#8a38e8]"
          >
            Можно продлить
          </button>
        ) : (
          <p
            className={`mb-0 mt-0.5 text-xs leading-tight ${
              expiringSoon ? 'font-medium text-[#E5484D]' : 'text-gray-500'
            }`}
          >
            {expiringSoon
              ? `+${days}d`
              : status === 'expired'
                ? tFinance('inactive')
                : shortDate(contract.expiresAt)}
          </p>
        )}
      </div>
    </div>
  );
};

/** Первые N строк и кнопка «Показать все» (если не scrollable — весь список в скролле) */
function ContractsList({
  contracts,
  expanded,
  onToggle,
  onExtend,
  scrollable = false,
}: {
  contracts: FinanceContract[];
  expanded: boolean;
  onToggle: () => void;
  onExtend?: (contract: FinanceContract) => void;
  scrollable?: boolean;
}) {
  const { t } = useFinanceLocale();
  const visible = scrollable || expanded ? contracts : contracts.slice(0, CONTRACTS_PREVIEW_COUNT);
  const hidden = contracts.length - visible.length;
  return (
    <>
      <div className="divide-y divide-gray-100">
        {visible.map((c) => (
          <ContractRow key={c.id} contract={c} onExtend={onExtend ? () => onExtend(c) : undefined} />
        ))}
      </div>
      {!scrollable && contracts.length > CONTRACTS_PREVIEW_COUNT ? (
        <button
          type="button"
          onClick={onToggle}
          className="mt-1 flex h-9 w-full items-center justify-center gap-1 rounded-xl bg-[#F6F6F8] text-xs font-medium text-gray-700 transition-colors hover:bg-[#EEEEF1]"
        >
          {expanded ? t('collapse') : `${t('showAll')} · +${hidden}`}
          <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      ) : null}
    </>
  );
}

type StatusTab = 'active' | 'expired';

const sumRub = (list: FinanceContract[]) => list.reduce((acc, c) => acc + c.balanceRub, 0);

function useDismissable<T extends HTMLElement>() {
  const [open, setOpen] = useState(false);
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
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
  return { open, setOpen, ref };
}

type SelectOption<T extends string> = { value: T; label: string; hint?: string };

function MiniSelect<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  presentation = 'menu',
  sheetContainer = null,
}: {
  value: T;
  options: SelectOption<T>[];
  onChange: (next: T) => void;
  ariaLabel: string;
  presentation?: 'menu' | 'sheet';
  sheetContainer?: HTMLElement | null;
}) {
  const useSheet = presentation === 'sheet';
  const menu = useDismissable<HTMLDivElement>();
  const [sheetOpen, setSheetOpen] = useState(false);
  const open = useSheet ? sheetOpen : menu.open;
  const setOpen = useSheet ? setSheetOpen : menu.setOpen;
  const ref = menu.ref;
  const selected = options.find((o) => o.value === value) ?? options[0];

  const pick = (next: T) => {
    onChange(next);
    setOpen(false);
  };

  const optionsList = (sheet: boolean) =>
    options.map((opt, index) => {
      const active = opt.value === value;
      return (
        <button
          key={opt.value}
          type="button"
          role="option"
          aria-selected={active}
          onClick={() => pick(opt.value)}
          className={
            sheet
              ? `flex w-full items-center gap-3 px-4 py-3.5 text-left text-[15px] transition-colors active:bg-[#F2F2F7] ${
                  index > 0 ? 'border-t border-gray-100' : ''
                } ${active ? 'font-semibold text-gray-900' : 'font-medium text-gray-900'}`
              : 'flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[12px] text-gray-900 hover:bg-[#F6F6F8]'
          }
        >
          {sheet ? (
            <>
              <span className="min-w-0 flex-1">
                <span className="block leading-snug">{opt.label}</span>
                {opt.hint ? (
                  <span className="mt-0.5 block text-[13px] tabular-nums text-gray-400">{opt.hint}</span>
                ) : null}
              </span>
              {active ? <Check className="h-5 w-5 shrink-0 text-[#9A41FE]" aria-hidden /> : null}
            </>
          ) : (
            <>
              <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                {active ? <Check className="h-3.5 w-3.5 text-gray-900" /> : null}
              </span>
              <span className="min-w-0 flex-1 truncate">{opt.label}</span>
              {opt.hint ? (
                <span className="shrink-0 text-[11px] tabular-nums text-gray-400">{opt.hint}</span>
              ) : null}
            </>
          )}
        </button>
      );
    });

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup={useSheet ? 'dialog' : 'listbox'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex h-6 items-center gap-0.5 rounded-md px-1.5 text-[11px] font-medium leading-none transition-colors ${
          open ? 'bg-[#E9E9EE] text-gray-900' : 'bg-[#F2F2F7] text-gray-800 hover:bg-[#E9E9EE]'
        }`}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown
          className={`h-3 w-3 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {useSheet && open
        ? createPortal(
            <div
              className={`${sheetContainer ? 'absolute' : 'fixed'} inset-0 z-[160] flex flex-col justify-end`}
            >
              <button
                type="button"
                aria-label="Закрыть"
                onClick={() => setOpen(false)}
                className="absolute inset-0 bg-black/40"
              />
              <div
                role="dialog"
                aria-label={ariaLabel}
                className="relative flex max-h-[70%] flex-col rounded-t-[28px] bg-[#F6F6F8] shadow-[0_-8px_32px_rgba(0,0,0,0.18)]"
              >
                <div className="flex justify-center pt-2">
                  <span className="h-1 w-9 rounded-full bg-gray-300" aria-hidden />
                </div>
                <div className="flex items-center justify-between px-4 pb-2 pt-2">
                  <h2 className="mb-0 text-[17px] font-semibold text-gray-900">{ariaLabel}</h2>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Закрыть"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#E9E9EE] text-gray-600"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
                  <div className="overflow-hidden rounded-2xl bg-white" role="listbox" aria-label={ariaLabel}>
                    {optionsList(true)}
                  </div>
                </div>
              </div>
            </div>,
            sheetContainer ?? document.body,
          )
        : null}
      {!useSheet && open ? (
        <div
          role="listbox"
          className="absolute left-0 top-full z-30 mt-1 min-w-[180px] rounded-lg bg-white p-0.5 shadow-lg ring-1 ring-black/5"
        >
          {optionsList(false)}
        </div>
      ) : null}
    </div>
  );
}

/** Раньше заключённые — выше */
const listSort = (a: FinanceContract, b: FinanceContract) =>
  parseRuDate(a.signedAt).getTime() - parseRuDate(b.signedAt).getTime();

/**
 * Контракты спецконтрактника: сумма сверху, ниже три селекта
 * (статус / канал / тип).
 */
export function FinanceContractsPanel({
  onExtend,
  showTitle,
  presentation = 'menu',
  sheetContainer = null,
}: {
  onExtend?: (contract: FinanceContract) => void;
  showTitle?: boolean;
  presentation?: 'menu' | 'sheet';
  sheetContainer?: HTMLElement | null;
}) {
  const { t, locale, formatMoney } = useFinanceLocale();
  void locale;
  const [channel, setChannel] = useState<ChannelFilter>('all');
  const [mediaBilling, setMediaBilling] = useState<'all' | MediaBilling>('all');
  const [statusTab, setStatusTab] = useState<StatusTab>('active');
  const [query, setQuery] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const [fadeTop, setFadeTop] = useState(false);
  const [fadeBottom, setFadeBottom] = useState(false);
  const mediaMode = channel === 'media';
  const statusTabs: { id: StatusTab; label: string }[] = [
    { id: 'active', label: t('active') },
    { id: 'expired', label: t('expired') },
  ];

  const changeChannel = (next: ChannelFilter) => {
    setChannel(next);
    setMediaBilling('all');
  };

  const inChannel = useMemo(
    () =>
      DEMO_CONTRACTS.filter((c) => {
        if (channel !== 'all' && c.channel !== channel) return false;
        if (
          mediaMode &&
          mediaBilling !== 'all' &&
          (c.mediaBilling == null || c.mediaBilling !== mediaBilling)
        ) {
          return false;
        }
        return true;
      }).sort(listSort),
    [channel, mediaBilling, mediaMode],
  );

  const activeContracts = useMemo(
    () => inChannel.filter((c) => contractStatus(c) !== 'expired'),
    [inChannel],
  );
  const expiredContracts = useMemo(
    () => inChannel.filter((c) => contractStatus(c) === 'expired'),
    [inChannel],
  );

  const byGroup = statusTab === 'active' ? activeContracts : expiredContracts;
  const headerRub = sumRub(byGroup);

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;
  const list = searching
    ? byGroup.filter(
        (c) => contractFullName(c).toLowerCase().includes(q) || String(c.id).includes(q),
      )
    : byGroup;

  const statusRub: Record<StatusTab, number> = {
    active: sumRub(activeContracts),
    expired: sumRub(expiredContracts),
  };

  const channelOptions: SelectOption<ChannelFilter>[] = [
    { value: 'all', label: t('allChannels') },
    { value: 'promotion', label: CONTRACT_CHANNEL_LABEL.promotion },
    { value: 'media', label: CONTRACT_CHANNEL_LABEL.media },
  ];
  const mediaBillingOptions: SelectOption<'all' | MediaBilling>[] = [
    { value: 'all', label: t('media') },
    ...MEDIA_BILLINGS.map((id) => ({ value: id, label: MEDIA_BILLING_LABEL[id] })),
  ];
  const statusOptions: SelectOption<StatusTab>[] = statusTabs.map(({ id, label }) => ({
    value: id,
    label,
    hint: formatMoney(statusRub[id]),
  }));

  const showSearch = byGroup.length >= CONTRACTS_SEARCH_FROM || searching;

  const syncListFades = () => {
    const el = listRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setFadeTop(scrollTop > 2);
    setFadeBottom(scrollTop + clientHeight < scrollHeight - 2);
  };

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    syncListFades();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncListFades) : null;
    ro?.observe(el);
    el.addEventListener('scroll', syncListFades, { passive: true });
    return () => {
      ro?.disconnect();
      el.removeEventListener('scroll', syncListFades);
    };
  }, [list, byGroup.length]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-white pb-2 text-sm">
      <div className={`relative z-20 shrink-0 space-y-3 px-4 ${showTitle ? 'pt-1' : 'pt-3'}`}>
        <div className="min-w-0">
          <span className={`block text-sm font-medium text-gray-600 ${showTitle ? 'relative z-20' : ''}`}>
            {t('contractsSum')}
          </span>
          <p className="mb-0 mt-1.5 text-[26px] font-bold leading-none tabular-nums tracking-tight text-gray-900">
            {formatMoney(headerRub)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <MiniSelect
            ariaLabel={t('active')}
            value={statusTab}
            options={statusOptions}
            onChange={setStatusTab}
            presentation={presentation}
            sheetContainer={sheetContainer}
          />
          <MiniSelect
            ariaLabel={t('channel')}
            value={channel}
            options={channelOptions}
            onChange={changeChannel}
            presentation={presentation}
            sheetContainer={sheetContainer}
          />
          {mediaMode ? (
            <MiniSelect
              ariaLabel={t('media')}
              value={mediaBilling}
              options={mediaBillingOptions}
              onChange={setMediaBilling}
              presentation={presentation}
              sheetContainer={sheetContainer}
            />
          ) : null}
        </div>
      </div>

      <div className="relative mt-1 min-h-0 flex-1">
        <div
          ref={listRef}
          className="h-full overflow-y-auto overscroll-contain px-4"
          onScroll={syncListFades}
        >
          {showSearch ? (
            <div className="sticky top-0 z-[3] bg-white pb-1 pt-2">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  aria-hidden
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('search')}
                  aria-label={t('search')}
                  className="h-9 w-full rounded-xl border border-transparent bg-[#F6F6F8] py-2 pl-9 pr-8 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-black [&::-webkit-search-cancel-button]:hidden"
                />
                {searching ? (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label={t('close')}
                    className="absolute right-2 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-gray-400 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {list.length > 0 ? (
            <div className={showSearch ? 'mt-1' : 'mt-3'}>
              <ContractsList
                contracts={list}
                expanded
                scrollable
                onToggle={() => undefined}
                onExtend={onExtend}
              />
            </div>
          ) : (
            <p className="mb-0 mt-3 text-xs text-gray-400">
              {searching
                ? t('nothingFound')
                : statusTab === 'active'
                  ? t('noActiveContracts')
                  : t('noExpiredContracts')}
            </p>
          )}
        </div>
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 top-0 z-[2] h-6 bg-gradient-to-b from-white to-transparent transition-opacity ${
            fadeTop ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-8 bg-gradient-to-t from-white to-transparent transition-opacity ${
            fadeBottom ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>
    </div>
  );
}

export function contractsTotals() {
  const active = ACTIVE_CONTRACTS;
  const expired = DEMO_CONTRACTS.filter((c) => contractStatus(c) === 'expired');
  return {
    totalRub: sumRub(active),
    promotionRub: sumRub(active.filter((c) => c.channel === 'promotion')),
    mediaRub: sumRub(active.filter((c) => c.channel === 'media')),
    activeCount: active.length,
    expiredRub: sumRub(expired),
    expiredCount: expired.length,
  };
}
