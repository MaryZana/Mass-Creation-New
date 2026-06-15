import React, { useMemo, useState } from 'react';

export type ChannelBudgetOrdersSkewRow = {
  id: string;
  name: string;
  color: string;
  spend: number;
  orders: number;
};

type SkewChannel = ChannelBudgetOrdersSkewRow & {
  spendPct: number;
  ordersPct: number;
  deltaPp: number;
};

const PERIOD_CAPTION: Record<string, string> = {
  d: 'день',
  w: 'неделю',
  '2w': '2 недели',
  m: 'месяц',
};

function buildSkewChannels(rows: ChannelBudgetOrdersSkewRow[]): {
  channels: SkewChannel[];
  totalSpend: number;
  totalOrders: number;
} {
  const totalSpend = rows.reduce((sum, row) => sum + row.spend, 0);
  const totalOrders = rows.reduce((sum, row) => sum + row.orders, 0);
  const channels = rows.map((row) => {
    const spendPct = totalSpend > 0 ? Math.round((row.spend / totalSpend) * 100) : 0;
    const ordersPct = totalOrders > 0 ? Math.round((row.orders / totalOrders) * 100) : 0;
    return {
      ...row,
      spendPct,
      ordersPct,
      deltaPp: ordersPct - spendPct,
    };
  });
  return { channels, totalSpend, totalOrders };
}

function skewInsight(ch: SkewChannel, totalSpend: number, totalOrders: number): string {
  const d = ch.deltaPp;
  if (d > 0) {
    return `${ch.name}: на ${ch.spendPct}% бюджета приходится ${ch.ordersPct}% заказов (+${d} п.п.) — канал эффективнее перекоса. Заказов ${ch.orders} из ${totalOrders}.`;
  }
  if (d < 0) {
    return `${ch.name}: ${ch.spendPct}% бюджета, но только ${ch.ordersPct}% заказов (${d} п.п.) — переплата относительно доли заказов.`;
  }
  return `${ch.name}: доли затрат и заказов совпадают — держать и точечно оптимизировать.`;
}

function SkewBarTrack({ pct, fill }: { pct: number; fill: string }) {
  return (
    <div className="h-2.5 flex-1 overflow-hidden rounded bg-gray-100">
      <div className="h-full rounded-sm transition-[width] duration-300" style={{ width: `${pct}%`, backgroundColor: fill }} />
    </div>
  );
}

export function ChannelBudgetOrdersSkew({
  rows,
  period = '2w',
  className = '',
}: {
  rows: ChannelBudgetOrdersSkewRow[];
  period?: string;
  className?: string;
}) {
  const { channels, totalSpend, totalOrders } = useMemo(() => buildSkewChannels(rows), [rows]);
  const defaultId = useMemo(() => {
    const best = [...channels].sort((a, b) => b.deltaPp - a.deltaPp)[0];
    return best?.id ?? null;
  }, [channels]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeId = selectedId ?? defaultId;
  const selected = channels.find((c) => c.id === activeId);

  const periodCaption = PERIOD_CAPTION[period] ?? 'период';

  return (
    <div className={`rounded-xl border border-gray-100 bg-[#FAFAFC] p-4 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Перекос: бюджет и заказы</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Период: {periodCaption} · заказы last touch, 14 дней
          </p>
        </div>
        <button
          type="button"
          className="text-xs font-medium text-[#9a41fe] hover:underline"
          title="Доля затрат — от суммы расходов по трём каналам. Доля заказов — от заказов, приписанных last touch этим каналам (не все заказы магазина)."
        >
          Как считается
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {channels.map((ch) => {
          const selectedRow = ch.id === activeId;
          const d = ch.deltaPp;
          const weaker = d < 0;
          const stronger = d > 0;
          return (
            <button
              key={ch.id}
              type="button"
              onClick={() => setSelectedId(ch.id)}
              className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                selectedRow ? 'border-[#9a41fe]/40 bg-white shadow-sm' : 'border-transparent bg-white/60 hover:bg-white'
              }`}
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: ch.color }} />
                <span className="text-sm font-semibold text-gray-900">{ch.name}</span>
                <span
                  className={`text-xs font-medium ${
                    stronger ? 'text-emerald-700' : weaker ? 'text-amber-800' : 'text-gray-500'
                  }`}
                >
                  {stronger ? '▲' : weaker ? '▼' : '—'} {d > 0 ? '+' : ''}
                  {d} п.п. {stronger ? 'сильнее' : weaker ? 'слабее' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="w-[72px] shrink-0">Затраты</span>
                <SkewBarTrack pct={ch.spendPct} fill="#C4C4CC" />
                <span className="w-9 shrink-0 text-right tabular-nums text-gray-800">{ch.spendPct}%</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500">
                <span className="w-[72px] shrink-0">Заказы</span>
                <SkewBarTrack pct={ch.ordersPct} fill={ch.color} />
                <span className="w-9 shrink-0 text-right tabular-nums text-gray-800">{ch.ordersPct}%</span>
              </div>
            </button>
          );
        })}
      </div>

      {selected ? (
        <p className="mt-3 rounded-lg bg-white px-3 py-2 text-xs leading-snug text-gray-700">
          {skewInsight(selected, totalSpend, totalOrders)}
        </p>
      ) : null}

      <p className="mt-3 text-[10px] leading-snug text-gray-400">
        100% затрат — сумма расходов по трём каналам ({totalSpend.toLocaleString('ru-RU')} ₽). 100% заказов —{' '}
        {totalOrders.toLocaleString('ru-RU')} шт., приписанных last touch этим каналам.
      </p>
    </div>
  );
}
