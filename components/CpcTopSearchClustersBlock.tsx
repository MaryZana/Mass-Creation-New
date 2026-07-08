import React, { useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, Download, Search } from './Icons';
import {
  CPC_TOP_SEARCH_CLUSTERS_DATE_LABEL,
  CPC_TOP_SEARCH_CLUSTERS_ROWS,
  CPC_TOP_SEARCH_CLUSTERS_TOTAL,
  countClustersLosingPosition,
  type CpcTopSearchClusterRow,
} from '../utils/cpcTopSearchClustersDemo';

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

function formatNum(n: number): string {
  return n.toLocaleString('ru-RU');
}

function formatPosition(n: number): string {
  return n.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
}

function formatCpc(n: number): string {
  return n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ClusterQueryCell({ row }: { row: CpcTopSearchClusterRow }) {
  return (
    <div className="flex min-w-0 items-start gap-1.5">
      {row.losesPosition ? (
        <AlertTriangle
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
          aria-label="Не держит позицию"
        />
      ) : (
        <span className="w-4 shrink-0" aria-hidden />
      )}
      <span className="min-w-0 font-medium text-gray-900">{row.query}</span>
    </div>
  );
}

export function CpcTopSearchClustersBlock({
  nestedInSearchZone = false,
}: {
  /** Блок внутри карточки зоны «Поиск» — без лишнего отступа сверху */
  nestedInSearchZone?: boolean;
}) {
  const [searchDraft, setSearchDraft] = useState('');
  const [onlyLosingPosition, setOnlyLosingPosition] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);

  const losingCount = useMemo(() => countClustersLosingPosition(CPC_TOP_SEARCH_CLUSTERS_ROWS), []);

  const filteredRows = useMemo(() => {
    const q = searchDraft.trim().toLowerCase();
    return CPC_TOP_SEARCH_CLUSTERS_ROWS.filter((row) => {
      if (onlyLosingPosition && !row.losesPosition) return false;
      if (!q) return true;
      return row.query.toLowerCase().includes(q);
    });
  }, [onlyLosingPosition, searchDraft]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, pageSize, safePage]);

  const showTotalRow = !onlyLosingPosition && searchDraft.trim() === '';

  const thClass = 'whitespace-nowrap px-3 py-2 text-left text-xs font-normal text-gray-500';
  const tdClass = 'whitespace-nowrap px-3 py-2.5 text-xs tabular-nums text-gray-900';
  const tdRight = `${tdClass} text-right`;

  return (
    <div className={nestedInSearchZone ? '' : 'mt-4'}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-gray-900">Топ поисковых кластеров</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-50"
          >
            <Download className="h-3.5 w-3.5 text-gray-500" />
            Скачать
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
          >
            {CPC_TOP_SEARCH_CLUSTERS_DATE_LABEL}
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => {
            setOnlyLosingPosition((v) => !v);
            setPage(1);
          }}
          className={`w-fit rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            onlyLosingPosition
              ? 'bg-gray-900 text-white'
              : 'bg-[#F2F2F7] text-gray-800 hover:bg-[#e8e8ed]'
          }`}
        >
          Не держат позиции {losingCount}
        </button>
        <div className="relative w-full sm:max-w-[200px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={searchDraft}
            onChange={(e) => {
              setSearchDraft(e.target.value);
              setPage(1);
            }}
            placeholder="Искать"
            className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </div>
      </div>

      <div className="mt-3 overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full min-w-[720px] text-left">
          <thead className="border-b border-gray-100 bg-white">
            <tr>
              <th className={`${thClass} min-w-[11rem]`}>Кластер</th>
              <th className={`${thClass} text-right`}>Средняя позиция</th>
              <th className={`${thClass} text-right`}>Клики</th>
              <th className={`${thClass} text-right`}>Корзина</th>
              <th className={`${thClass} text-right`}>Созданные заказы</th>
              <th className={`${thClass} text-right`}>Затраты, ₽</th>
              <th className={`${thClass} text-right`}>Показы</th>
              <th className={`${thClass} text-right`}>CPC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {showTotalRow ? (
              <tr className="bg-gray-50/80 font-semibold">
                <td className="px-3 py-2.5 text-xs text-gray-900">{CPC_TOP_SEARCH_CLUSTERS_TOTAL.label}</td>
                <td className={tdRight}>{formatPosition(CPC_TOP_SEARCH_CLUSTERS_TOTAL.avgPosition)}</td>
                <td className={tdRight}>{formatNum(CPC_TOP_SEARCH_CLUSTERS_TOTAL.clicks)}</td>
                <td className={tdRight}>{formatNum(CPC_TOP_SEARCH_CLUSTERS_TOTAL.cart)}</td>
                <td className={tdRight}>{formatNum(CPC_TOP_SEARCH_CLUSTERS_TOTAL.orders)}</td>
                <td className={tdRight}>{formatNum(CPC_TOP_SEARCH_CLUSTERS_TOTAL.spendRub)}</td>
                <td className={tdRight}>{formatNum(CPC_TOP_SEARCH_CLUSTERS_TOTAL.impressions)}</td>
                <td className={tdRight}>{formatCpc(CPC_TOP_SEARCH_CLUSTERS_TOTAL.cpc)}</td>
              </tr>
            ) : null}
            {pageRows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50/50">
                <td className="max-w-[14rem] px-3 py-2.5 text-xs">
                  <ClusterQueryCell row={row} />
                </td>
                <td className={tdRight}>{formatPosition(row.avgPosition)}</td>
                <td className={tdRight}>{formatNum(row.clicks)}</td>
                <td className={tdRight}>{formatNum(row.cart)}</td>
                <td className={tdRight}>{formatNum(row.orders)}</td>
                <td className={tdRight}>{formatNum(row.spendRub)}</td>
                <td className={tdRight}>{formatNum(row.impressions)}</td>
                <td className={tdRight}>{formatCpc(row.cpc)}</td>
              </tr>
            ))}
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-xs text-gray-500">
                  Нет кластеров по выбранным фильтрам
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-col gap-3 border-t border-gray-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-700">
          <span>Показать записей</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setPageSizeOpen((o) => !o)}
              className="inline-flex min-w-[48px] items-center justify-between gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs tabular-nums hover:border-gray-300"
            >
              {pageSize}
              <ChevronDown className={`h-3.5 w-3.5 text-gray-500 ${pageSizeOpen ? 'rotate-180' : ''}`} />
            </button>
            {pageSizeOpen ? (
              <ul className="absolute bottom-full left-0 z-20 mb-1 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <li key={n}>
                    <button
                      type="button"
                      className="w-full px-3 py-1 text-left text-xs hover:bg-gray-50"
                      onClick={() => {
                        setPageSize(n);
                        setPage(1);
                        setPageSizeOpen(false);
                      }}
                    >
                      {n}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPage(n)}
              className={`min-w-[28px] rounded-md px-2 py-1 text-xs tabular-nums ${
                safePage === n
                  ? 'bg-gray-900 font-medium text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-md px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Следующая страница"
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
}
