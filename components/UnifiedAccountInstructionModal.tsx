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
            aria-labelledby="unified-account-instruction-title"
          >
        <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-8 sm:p-10">
          <h2
            id="unified-account-instruction-title"
            className="text-2xl font-bold tracking-tight text-gray-900"
          >
            Инструкция по единому счёту и промобонусам
          </h2>
          <div className="mt-6 overflow-hidden rounded-2xl bg-black ring-1 ring-black/[0.06]">
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
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
