import React, { useMemo, useState } from 'react';
import { Checkbox } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ChevronDown,
  Download,
  Plus,
  Search,
  Settings,
} from '../components/Icons';
import { ConceptPromotionInsightStrip } from '../components/ConceptPromotionInsightStrip';

type MediaStatus = 'completed' | 'draft' | 'rejected';

type MediaFormat = 'video' | 'banner' | 'pvz';

type MediaCampaignRow = {
  id: number;
  name: string;
  status: MediaStatus;
  format: MediaFormat;
  budget: number | null;
  remaining: number | null;
  spend: number | null;
  impressions: number | null;
  reach: number | null;
  clicks: number | null;
  ctr: number | null;
  cpc: number | null;
  carts: number | null;
  budgetWarning?: boolean;
};

type TabId = 'campaigns' | 'adGroups' | 'creatives';

const PURPLE = '#9A41FE';

/** Как на странице кампаний (SuccessPage CONCEPT_LIST_TABLE_CHECKBOX). */
const CHECKBOX_CLASS =
  'w-[18px] shrink-0 text-purple-600 [&_.ant-checkbox-inner]:!h-[18px] [&_.ant-checkbox-inner]:!w-[18px] [&_.ant-checkbox-inner]:!border-2 [&_.ant-checkbox-inner]:!border-gray-300 [&_.ant-checkbox-checked_.ant-checkbox-inner]:!border-violet-500 [&_.ant-checkbox-checked_.ant-checkbox-inner]:!bg-violet-500 [&_.ant-checkbox-indeterminate_.ant-checkbox-inner]:!border-violet-500 [&_.ant-checkbox-indeterminate_.ant-checkbox-inner]:!bg-violet-500';

const FORMAT_LABEL: Record<MediaFormat, string> = {
  video: 'Видео',
  banner: 'Баннер',
  pvz: 'Реклама в ПВЗ',
};

const STATUS_LABEL: Record<MediaStatus, string> = {
  completed: 'Завершена',
  draft: 'Черновик',
  rejected: 'Отклонена',
};

const MEDIA_TABS: Array<{ id: TabId; label: string }> = [
  { id: 'campaigns', label: 'Кампании' },
  { id: 'adGroups', label: 'Группы объявлений' },
  { id: 'creatives', label: 'Креативы' },
];

const MOCK_ROWS: MediaCampaignRow[] = [
  {
    id: 317641,
    name: 'Тест Света от 21.09.2026',
    status: 'completed',
    format: 'video',
    budget: null,
    remaining: null,
    spend: null,
    impressions: null,
    reach: null,
    clicks: null,
    ctr: null,
    cpc: null,
    carts: null,
  },
  {
    id: 317640,
    name: 'Тест Света от 21.09.2026',
    status: 'completed',
    format: 'banner',
    budget: null,
    remaining: null,
    spend: null,
    impressions: null,
    reach: null,
    clicks: null,
    ctr: null,
    cpc: null,
    carts: null,
  },
  {
    id: 317639,
    name: 'Тест Света от 21.09.2026',
    status: 'completed',
    format: 'pvz',
    budget: null,
    remaining: null,
    spend: null,
    impressions: null,
    reach: null,
    clicks: null,
    ctr: null,
    cpc: null,
    carts: null,
  },
  {
    id: 317638,
    name: 'Тест Света от 21.09.2026',
    status: 'completed',
    format: 'banner',
    budget: null,
    remaining: null,
    spend: null,
    impressions: null,
    reach: null,
    clicks: null,
    ctr: null,
    cpc: null,
    carts: null,
  },
  {
    id: 317637,
    name: 'Тест Света от 21.09.2026',
    status: 'draft',
    format: 'banner',
    budget: 0,
    remaining: 0,
    spend: 0,
    impressions: 0,
    reach: 0,
    clicks: 0,
    ctr: 0,
    cpc: 0,
    carts: 0,
    budgetWarning: true,
  },
  {
    id: 317636,
    name: 'Тест Света от 21.09.2026',
    status: 'draft',
    format: 'banner',
    budget: 0,
    remaining: 0,
    spend: 0,
    impressions: 0,
    reach: 0,
    clicks: 0,
    ctr: 0,
    cpc: 0,
    carts: 0,
    budgetWarning: true,
  },
  {
    id: 317635,
    name: 'Тест Света от 21.09.2026',
    status: 'rejected',
    format: 'banner',
    budget: 0,
    remaining: 0,
    spend: 0,
    impressions: 0,
    reach: 0,
    clicks: 0,
    ctr: 0,
    cpc: 0,
    carts: 0,
    budgetWarning: true,
  },
  {
    id: 317634,
    name: 'Тест Света от 21.09.2026',
    status: 'draft',
    format: 'banner',
    budget: 0,
    remaining: 0,
    spend: 0,
    impressions: 0,
    reach: 0,
    clicks: 0,
    ctr: 0,
    cpc: 0,
    carts: 0,
    budgetWarning: true,
  },
  {
    id: 317633,
    name: 'Тест Света от 21.09.2026',
    status: 'draft',
    format: 'banner',
    budget: 0,
    remaining: 0,
    spend: 0,
    impressions: 0,
    reach: 0,
    clicks: 0,
    ctr: 0,
    cpc: 0,
    carts: 0,
    budgetWarning: true,
  },
  {
    id: 317632,
    name: 'Тест Света от 21.09.2026',
    status: 'completed',
    format: 'banner',
    budget: 10000,
    remaining: -0.64,
    spend: 128.64,
    impressions: 1,
    reach: null,
    clicks: 0,
    ctr: 0,
    cpc: 0,
    carts: 0,
  },
];

const TOTAL_PAGES = 48;
const PAGE_SIZE = 10;

const SortArrow = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 10 10"
    fill="none"
    className={className}
    aria-hidden
  >
    <path
      d="M5 2.2 8.2 6.4H1.8L5 2.2Z"
      fill="currentColor"
    />
  </svg>
);

const SlidersIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    className={className}
    aria-hidden
  >
    <path d="M3.5 5.5h13" />
    <path d="M3.5 10h13" />
    <path d="M3.5 14.5h13" />
    <circle cx="7" cy="5.5" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="13" cy="10" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="9" cy="14.5" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);

function formatRub(value: number | null): string {
  if (value == null) return '—';
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString('ru-RU', {
    minimumFractionDigits: Number.isInteger(abs) ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${value < 0 ? '−' : ''}${formatted} ₽`;
}

function formatNum(value: number | null): string {
  if (value == null) return '—';
  return value.toLocaleString('ru-RU');
}

function formatPct(value: number | null): string {
  if (value == null) return '—';
  return `${value.toLocaleString('ru-RU')}%`;
}

function StatusMeta({ status, id }: { status: MediaStatus; id: number }) {
  if (status === 'rejected') {
    return (
      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] leading-none text-[#8C8C8C]">
        <span className="inline-flex items-center rounded px-1.5 py-[3px] text-[12px] font-medium leading-none text-[#C9372C] bg-[#FCEBEA]">
          {STATUS_LABEL[status]}
        </span>
        <span>id: {id}</span>
      </div>
    );
  }

  return (
    <div className="mt-1 text-[12px] leading-none text-[#8C8C8C]">
      {STATUS_LABEL[status]}{' '}
      <span className="text-[#8C8C8C]">id: {id}</span>
    </div>
  );
}

const toolbarBtnClass =
  'inline-flex h-11 items-center gap-2 rounded-[10px] border-0 bg-[#E6E8EC] px-4 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#DCDEE3]';

const toolbarIconBtnClass =
  'inline-flex h-11 w-11 items-center justify-center rounded-[10px] border-0 bg-[#E6E8EC] text-[#4A4A4A] transition-colors hover:bg-[#DCDEE3]';

const softToolbarBtnClass =
  'inline-flex h-11 items-center gap-2 rounded-[10px] border-0 bg-[rgba(74,74,89,0.08)] px-4 text-sm font-medium text-gray-900 transition-colors hover:bg-[rgba(74,74,89,0.12)]';

const softToolbarIconBtnClass =
  'inline-flex h-11 w-11 items-center justify-center rounded-[10px] border-0 bg-[rgba(74,74,89,0.08)] text-gray-700 transition-colors hover:bg-[rgba(74,74,89,0.12)]';

const MediaPage: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>('campaigns');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const openMediaCampaignCreate = () => {
    navigate('/media/create');
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return MOCK_ROWS;
    return MOCK_ROWS.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        String(row.id).includes(q),
    );
  }, [search]);

  const allSelected =
    filtered.length > 0 && filtered.every((row) => selectedIds.includes(row.id));
  const indeterminate =
    !allSelected && filtered.some((row) => selectedIds.includes(row.id));

  const pageButtons = useMemo(() => {
    const items: Array<number | 'ellipsis'> = [1, 2, 3, 4, 5, 'ellipsis', TOTAL_PAGES];
    return items;
  }, []);

  const underlineTabs = (
    <div className="inline-flex items-end gap-6 border-b border-[#E8E8ED]">
      {MEDIA_TABS.map((item) => {
        const active = tab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`relative -mb-px pb-3 text-[18px] transition-colors ${
              active
                ? 'font-semibold text-[#1A1A1A]'
                : 'font-medium text-[#1A1A1A] hover:text-black'
            }`}
          >
            {item.label}
            {active ? (
              <span
                className="absolute inset-x-0 bottom-0 h-[3px] rounded-t-full"
                style={{ backgroundColor: PURPLE }}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );

  const mediaToolbarActions = (tone: 'default' | 'soft' = 'default') => {
    const btn = tone === 'soft' ? softToolbarBtnClass : toolbarBtnClass;
    const iconBtn = tone === 'soft' ? softToolbarIconBtnClass : toolbarIconBtnClass;
    return (
      <div className="mb-0.5 flex flex-wrap items-center gap-2">
        <button type="button" className={btn}>
          <span className="font-normal text-[#8C8C8C]">Статистика за:</span>
          Весь период
          <ChevronDown className="h-4 w-4 text-[#6B6B6B]" />
        </button>
        <button type="button" className={btn}>
          <SlidersIcon className="h-4 w-4 text-[#4A4A4A]" />
          Фильтр
        </button>
        <button type="button" className={btn}>
          <Download className="h-4 w-4 text-[#4A4A4A]" />
          Скачать в Excel
        </button>
        <button type="button" className={iconBtn} aria-label="Настройки">
          <Settings className="h-4 w-4" />
        </button>
      </div>
    );
  };

  const mediaCreateButton = (
    <button
      type="button"
      onClick={openMediaCampaignCreate}
      className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-[10px] bg-[#9a41fe] px-4 text-sm font-medium leading-5 text-white transition-colors hover:bg-[#8840e5]"
    >
      <Plus className="h-4 w-4" />
      Создать кампанию
    </button>
  );

  const mediaIslandBody = (showTitle: boolean, wbAboveToolbar = false) => {
    if (wbAboveToolbar) {
      return (
        <div className="flex w-full min-w-0 flex-col gap-3">
          <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="mb-0 pr-5 text-[28px] font-bold leading-none tracking-tight text-[#1A1A1A]">
                Кампании
              </h1>
              {mediaCreateButton}
            </div>
            <div className="ml-auto w-max max-w-full shrink-0">
              <ConceptPromotionInsightStrip
                wbDiscountOnly
                wbDiscountLayout="horizontal"
                wbDiscountTooltipSide="left"
                onWbDiscountCardClick={openMediaCampaignCreate}
              />
            </div>
          </div>
          <div className="flex w-full min-w-0 flex-wrap items-end justify-between gap-x-6 gap-y-3">
            {underlineTabs}
            {mediaToolbarActions()}
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="flex flex-wrap items-center gap-3">
          {showTitle ? (
            <h1 className="mb-0 pr-5 text-[28px] font-bold leading-none tracking-tight text-[#1A1A1A]">
              Кампании
            </h1>
          ) : null}
          {mediaCreateButton}
        </div>
        <div className="flex w-full flex-wrap items-end justify-between gap-x-6 gap-y-3">
          {underlineTabs}
          {mediaToolbarActions()}
        </div>
      </>
    );
  };


  const classicIsland = ({
    bare,
    showTitle,
    wbAboveToolbar = false,
  }: {
    bare: boolean;
    showTitle: boolean;
    wbAboveToolbar?: boolean;
  }) => (
    <div
      className={
        bare
          ? 'flex min-h-[124px] min-w-0 flex-1 flex-col justify-end gap-3'
          : 'flex min-h-[124px] min-w-0 flex-1 flex-col justify-end gap-3 rounded-[24px] bg-white px-5 py-3 shadow-[0_1px_3px_rgba(16,24,40,0.06)]'
      }
    >
      {mediaIslandBody(showTitle, wbAboveToolbar)}
    </div>
  );


  const listTable = (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1280px] border-collapse text-left">
        <thead>
          <tr className="border-b border-[#ECECF0] text-[12px] font-medium text-[#8C8C8C]">
            <th className="w-12 px-4 py-3">
              <Checkbox
                checked={allSelected}
                indeterminate={indeterminate}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedIds(filtered.map((r) => r.id));
                  } else {
                    setSelectedIds([]);
                  }
                }}
                className={CHECKBOX_CLASS}
              />
            </th>
            <th className="min-w-[360px] px-2 py-3">
              <div className="relative max-w-[280px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A0A0A8]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Поиск по ID или названию"
                  className="h-9 w-full rounded-lg border border-[#E3E5EB] bg-white pl-9 pr-3 text-sm text-[#1A1A1A] outline-none placeholder:text-[#A0A0A8] focus:border-[#C4B5FD] focus:ring-1 focus:ring-[#C4B5FD]"
                />
              </div>
            </th>
            {(
              [
                'Бюджет',
                'Остаток',
                'Расход',
                'Показы',
                'Охват',
                'Клики',
                'CTR',
                'CPC',
                'Корзины Post-click',
              ] as const
            ).map((label) => (
              <th
                key={label}
                className="whitespace-nowrap px-3 py-3 text-right font-medium"
              >
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-[#8C8C8C] hover:text-[#4A4A4A]"
                >
                  {label}
                  <SortArrow className="h-2.5 w-2.5 text-[#B0B0B8]" />
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((row) => {
            const selected = selectedIds.includes(row.id);
            return (
              <tr
                key={row.id}
                className="border-b border-[#F0F0F3] last:border-b-0 hover:bg-[#FAFAFB]"
              >
                <td className="px-4 py-3.5 align-middle">
                  <Checkbox
                    checked={selected}
                    onChange={() => {
                      setSelectedIds((prev) =>
                        prev.includes(row.id)
                          ? prev.filter((id) => id !== row.id)
                          : [...prev, row.id],
                      );
                    }}
                    className={CHECKBOX_CLASS}
                  />
                </td>
                <td className="px-2 py-3.5 align-middle">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <button
                        type="button"
                        className="text-left text-sm font-medium leading-snug text-[#3B82F6] hover:underline"
                      >
                        {row.name}
                      </button>
                      <StatusMeta status={row.status} id={row.id} />
                    </div>
                    <div className="shrink-0 pt-0.5 text-right">
                      <div className="text-sm font-medium leading-snug text-[#1A1A1A]">
                        {FORMAT_LABEL[row.format]}
                      </div>
                      <div className="mt-0.5 text-[12px] leading-none text-[#8C8C8C]">CPM</div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-3.5 text-right align-middle text-sm tabular-nums text-[#1A1A1A]">
                  <span className="inline-flex items-center justify-end gap-1">
                    {formatRub(row.budget)}
                    {row.budgetWarning ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-[#F5A524]" aria-hidden />
                    ) : null}
                  </span>
                </td>
                <td
                  className={`whitespace-nowrap px-3 py-3.5 text-right align-middle text-sm tabular-nums ${
                    row.remaining != null && row.remaining < 0
                      ? 'text-[#E5484D]'
                      : 'text-[#1A1A1A]'
                  }`}
                >
                  {formatRub(row.remaining)}
                </td>
                <td className="whitespace-nowrap px-3 py-3.5 text-right align-middle text-sm tabular-nums text-[#1A1A1A]">
                  {formatRub(row.spend)}
                </td>
                <td className="whitespace-nowrap px-3 py-3.5 text-right align-middle text-sm tabular-nums text-[#1A1A1A]">
                  {formatNum(row.impressions)}
                </td>
                <td className="whitespace-nowrap px-3 py-3.5 text-right align-middle text-sm tabular-nums text-[#1A1A1A]">
                  {formatNum(row.reach)}
                </td>
                <td className="whitespace-nowrap px-3 py-3.5 text-right align-middle text-sm tabular-nums text-[#1A1A1A]">
                  {formatNum(row.clicks)}
                </td>
                <td className="whitespace-nowrap px-3 py-3.5 text-right align-middle text-sm tabular-nums text-[#1A1A1A]">
                  {formatPct(row.ctr)}
                </td>
                <td className="whitespace-nowrap px-3 py-3.5 text-right align-middle text-sm tabular-nums text-[#1A1A1A]">
                  {formatRub(row.cpc)}
                </td>
                <td className="whitespace-nowrap px-3 py-3.5 text-right align-middle text-sm tabular-nums text-[#1A1A1A]">
                  {formatNum(row.carts)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const listPagination = (
    <div className="relative flex items-center justify-center border-t border-[#ECECF0] px-4 py-3">
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-md text-[#6B6B6B] transition-colors hover:bg-[#F3F4F6] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Предыдущая страница"
        >
          ‹
        </button>
        {pageButtons.map((item, index) =>
          item === 'ellipsis' ? (
            <span
              key={`e-${index}`}
              className="flex h-8 w-8 items-center justify-center text-sm text-[#8C8C8C]"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => setPage(item)}
              className={`flex h-8 min-w-[32px] items-center justify-center rounded-md px-1.5 text-sm font-medium transition-colors ${
                page === item
                  ? 'border'
                  : 'text-[#4A4A4A] hover:bg-[#F3F4F6]'
              }`}
              style={
                page === item
                  ? { borderColor: PURPLE, color: PURPLE }
                  : undefined
              }
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={page >= TOTAL_PAGES}
          onClick={() => setPage((p) => Math.min(TOTAL_PAGES, p + 1))}
          className="flex h-8 w-8 items-center justify-center rounded-md text-[#6B6B6B] transition-colors hover:bg-[#F3F4F6] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Следующая страница"
        >
          ›
        </button>
      </div>

      <button
        type="button"
        className="absolute right-4 inline-flex h-8 items-center gap-1.5 rounded-md border border-[#E3E5EB] bg-white px-2.5 text-sm text-[#4A4A4A] hover:bg-[#F7F7F9]"
      >
        {PAGE_SIZE} / стр.
        <ChevronDown className="h-3.5 w-3.5 text-[#8C8C8C]" />
      </button>
    </div>
  );

  return (
    <main className="relative mx-auto w-full min-h-[calc(100vh-3.5rem)] max-w-[1920px] bg-[#F3F5F8] px-7 pt-4 pb-8">
      <div className="flex w-full min-w-0 items-stretch gap-4">
        {classicIsland({
          bare: true,
          showTitle: false,
          wbAboveToolbar: true,
        })}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(16,24,40,0.06)] ring-1 ring-black/[0.04]">
        {listTable}
        {listPagination}
      </div>
    </main>
  );
};

export default MediaPage;
