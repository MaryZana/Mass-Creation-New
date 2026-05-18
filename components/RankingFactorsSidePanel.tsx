import React, { useEffect } from 'react';
import { X } from './Icons';

export type RankingFactorStatus = 'good' | 'improve' | 'neutral';

export type RankingFactorRow = {
  label: string;
  status: RankingFactorStatus;
  statusLabel: string;
};

const DEFAULT_FACTORS: RankingFactorRow[] = [
  { label: 'Рейтинг товара по отзывам', status: 'good', statusLabel: 'Всё хорошо' },
  { label: 'Логистика', status: 'improve', statusLabel: 'Можно улучшить' },
  { label: 'Участие в акциях', status: 'improve', statusLabel: 'Можно улучшить' },
  { label: 'Конверсия в корзину', status: 'good', statusLabel: 'Всё хорошо' },
  { label: 'Рейтинг продавца', status: 'good', statusLabel: 'Всё хорошо' },
  { label: 'Объем продаж товара', status: 'neutral', statusLabel: 'Не рассчитано' },
];

const STATUS_BADGE_CLASS: Record<RankingFactorStatus, string> = {
  good: 'bg-emerald-50 text-emerald-700',
  improve: 'bg-red-50 text-red-600',
  neutral: 'bg-gray-100 text-gray-600',
};

function StatusBadge({ status, label }: { status: RankingFactorStatus; label: string }) {
  return (
    <span
      className={`shrink-0 rounded-lg px-3 py-1 text-sm font-medium ${STATUS_BADGE_CLASS[status]}`}
    >
      {label}
    </span>
  );
}

export function RankingFactorsSidePanel({
  open,
  onClose,
  productName = 'Футболка хлопок мягкая приятная',
  productImageUrl = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=160&h=160&fit=crop&q=80',
  productMeta = 'Верхняя одежда • Understore • 87654321',
  factors = DEFAULT_FACTORS,
}: {
  open: boolean;
  onClose: () => void;
  productName?: string;
  productImageUrl?: string;
  productMeta?: string;
  factors?: RankingFactorRow[];
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
  <>
      <button
        type="button"
        aria-label="Закрыть"
        className="fixed inset-0 z-[110] bg-black/40"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="ranking-factors-title"
        className="fixed inset-y-0 right-0 z-[120] flex w-full max-w-[480px] flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300"
      >
        <div className="relative flex items-start gap-3 border-b border-gray-100 px-5 py-4 pr-12">
          <img
            src={productImageUrl}
            alt=""
            className="h-14 w-10 shrink-0 rounded-lg object-cover bg-gray-100"
          />
          <div className="min-w-0 flex-1">
            <h2 id="ranking-factors-title" className="text-base font-bold leading-snug text-gray-900">
              {productName}
            </h2>
            <p className="mt-1 text-sm text-gray-500">{productMeta}</p>
          </div>
          <button
            type="button"
            aria-label="Закрыть панель"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-sm leading-relaxed text-gray-600">
            Факторы ранжирования, которые влияют на позиции вашего товара в поисковой выдаче, без учета
            продвижения. Более детальная аналитика доступна в расширенном отчете по подписке{' '}
            <button type="button" className="font-medium text-[#2563eb] hover:underline">
              Джем
            </button>
          </p>

          <ul className="mt-4 space-y-2">
            {factors.map((row) => (
              <li
                key={row.label}
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3"
              >
                <span className="text-sm font-medium text-gray-900">{row.label}</span>
                <StatusBadge status={row.status} label={row.statusLabel} />
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-gray-100 p-5 shrink-0">
          <button
            type="button"
            className="w-full rounded-xl bg-[#9a41fe] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#8840e5]"
          >
            Перейти в отчёт «Поисковые запросы: ваши товары»
          </button>
        </div>
      </aside>
    </>
  );
}
