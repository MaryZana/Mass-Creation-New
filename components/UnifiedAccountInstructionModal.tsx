import React, { useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { X } from './Icons';
import { notifySidePanelOpen, useCloseOnOtherSidePanel } from './FeatureVideoGuide';

const fmtRub = (n: number) =>
  new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n);

export type UnifiedAccountInstructionModalProps = {
  onClose: () => void;
  videoSrc: string;
  accountRub: number;
  balanceRub: number;
  promoBonusAmount: number;
};

/**
 * Инструкция по единому счёту и промобонусам.
 * Боковая панель справа; видео — основной способ объяснить механику.
 */
export function UnifiedAccountInstructionModal({
  onClose,
  videoSrc,
  accountRub,
  balanceRub,
  promoBonusAmount,
}: UnifiedAccountInstructionModalProps) {
  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    notifySidePanelOpen('unified-account');
  }, []);

  useCloseOnOtherSidePanel('unified-account', handleClose);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [handleClose]);

  return createPortal(
    <aside
      role="dialog"
      aria-modal="false"
      aria-labelledby="unified-account-instruction-title"
      className="fixed inset-y-0 right-0 z-[120] flex w-full max-w-[480px] flex-col border-l border-gray-200 bg-white shadow-2xl"
      onMouseEnter={(event) => event.stopPropagation()}
      onMouseLeave={(event) => event.stopPropagation()}
      onMouseOver={(event) => event.stopPropagation()}
      onMouseOut={(event) => event.stopPropagation()}
    >
        <div className="relative shrink-0 border-b border-gray-100 px-5 py-4 pr-12">
          <p className="text-sm font-semibold text-[#9A41FE]">Финансы</p>
          <h2
            id="unified-account-instruction-title"
            className="mt-1 text-lg font-bold leading-snug tracking-tight text-gray-900"
          >
            Инструкция по единому счёту и промобонусам
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="overflow-hidden rounded-2xl bg-black ring-1 ring-black/[0.06]">
            <div className="aspect-video w-full">
              <video
                src={videoSrc}
                controls
                playsInline
                preload="metadata"
                className="h-full w-full object-cover"
              >
                Ваш браузер не поддерживает видео.
              </video>
            </div>
          </div>

          <div className="mt-5 space-y-4 text-sm leading-relaxed text-gray-700">
            <p>
              <span className="font-semibold text-gray-900">Единый счёт</span> — основной источник
              средств для пополнения кампаний. Он объединяет «счёт» и «баланс WB Продвижение».
              Сначала деньги списываются со счёта, а если их не хватает — с баланса.
            </p>
            <p>
              <span className="font-semibold text-gray-900">Промобонусы</span> — дополнительный источник
              пополнения. Они начисляются за разные действия и имеют срок сгорания. Следить за ними
              можно в разделе{' '}
              <Link
                to="/bonuses"
                onClick={handleClose}
              >
                «Мои бонусы»
              </Link>
              .
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3">
            <div className="rounded-2xl bg-[#F7F7F9] px-4 py-4">
              <p className="text-sm font-medium text-gray-600">Единый счёт</p>
              <p className="mt-2 text-[28px] font-bold leading-none tabular-nums tracking-tight text-gray-900">
                {fmtRub(accountRub)} ₽
              </p>
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                <p>
                  Счёт:{' '}
                  <span className="font-semibold tabular-nums text-gray-900">
                    {fmtRub(accountRub)} ₽
                  </span>
                </p>
                <p>
                  Баланс:{' '}
                  <span className="font-semibold tabular-nums text-gray-900">
                    {fmtRub(balanceRub)} ₽
                  </span>
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-[#F7F7F9] px-4 py-4">
              <p className="text-sm font-medium text-gray-600">Промобонусы</p>
              <p className="mt-2 text-[28px] font-bold leading-none tabular-nums tracking-tight text-gray-900">
                {fmtRub(promoBonusAmount)}{' '}
                <span className="text-[22px] font-bold text-gray-400">B</span>
              </p>
            </div>
          </div>

          <p className="mt-6 text-sm leading-relaxed text-gray-600">
            На счёте хранятся деньги, которые вы внесли в кабинет WB Продвижение самостоятельно — с
            карты или по реквизитам.
          </p>
        </div>
      </aside>,
    document.body,
  );
}
