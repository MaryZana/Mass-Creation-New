import React, { useEffect } from 'react';
import { HelpVideoIcon, X } from './Icons';
import { useDismissibleHoverTooltip, useFeatureVideoGuide } from './FeatureVideoGuide';

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

const RANKING_VIDEO_SRC = '/videos/help-instruction-demo.mp4';
const RANKING_VIDEO_TITLE = 'Как работает ранжирование. Почему ваша карточка внизу';

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

function RankingFactorsHelpTip() {
  const { openGuide, modal: videoModal, isOpen: guideOpen } = useFeatureVideoGuide();
  const tip = useDismissibleHoverTooltip(guideOpen);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={tip.onMouseEnter}
      onMouseLeave={tip.onMouseLeave}
    >
      {videoModal}
      <button
        type="button"
        className="inline-flex cursor-help items-center justify-center transition-opacity hover:opacity-80"
        aria-label="Информация и видеоинструкция"
      >
        <HelpVideoIcon />
      </button>
      {tip.show ? (
        <div className="absolute right-0 top-full z-[130] w-64 pt-1">
          <div className="rounded-xl bg-gray-900 px-3 py-2.5 text-left text-xs font-normal leading-snug text-white shadow-lg">
            <p>Показывают, что влияет на позицию товара в поиске без учёта продвижения.</p>
            <button
              type="button"
              onClick={() => {
                tip.dismiss();
                openGuide({
                  title: RANKING_VIDEO_TITLE,
                  videoSrc: RANKING_VIDEO_SRC,
                  description: 'Видеоинструкция · 6:38',
                });
              }}
              className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/15"
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gray-400 text-black">
                <svg viewBox="0 0 24 24" className="ml-px h-2 w-2" fill="currentColor" aria-hidden>
                  <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l10.5-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14Z" />
                </svg>
              </span>
              Видеоинструкция
            </button>
          </div>
        </div>
      ) : null}
    </div>
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
        className="ranking-factors-panel fixed inset-y-0 right-0 z-[120] flex h-full w-[720px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-l-[28px] bg-white shadow-2xl"
      >
        <div className="relative border-b border-gray-100 px-5 py-4 pr-12">
          <div className="flex items-center gap-1.5">
            <h2
              id="ranking-factors-title"
              className="mb-0 text-base font-bold leading-snug text-gray-900"
            >
              Факторы ранжирования
            </h2>
            <RankingFactorsHelpTip />
          </div>

          <p className="mt-2 pb-4 text-sm leading-relaxed text-gray-600">
            Факторы ранжирования, которые влияют на позиции вашего товара в поисковой выдаче, без учета
            продвижения. Более детальная аналитика доступна в расширенном отчете по подписке{' '}
            <button type="button" className="font-medium text-[#2563eb] hover:underline">
              Джем
            </button>
          </p>

          <div className="mt-3 flex items-start gap-3">
            <img
              src={productImageUrl}
              alt=""
              className="h-14 w-10 shrink-0 rounded-lg object-cover bg-gray-100"
            />
            <div className="min-w-0 flex-1">
              <p className="mb-0 text-sm font-medium leading-snug text-gray-900">{productName}</p>
              <p className="mt-1 mb-0 text-sm text-gray-500">{productMeta}</p>
            </div>
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
          <ul className="space-y-2">
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
