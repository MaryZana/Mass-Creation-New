import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from './ProfileContext';

export type ReferralListBannerVariant = 1 | 2 | 3;

type ReferralCodeCampaignListBannerProps = {
  variant?: ReferralListBannerVariant;
};

export function ReferralCodeCampaignListBanner({
  variant = 1,
}: ReferralCodeCampaignListBannerProps) {
  const { beginReferralCreationFlow } = useProfile();
  const [referralInput, setReferralInput] = useState('');

  const handleApply = () => {
    if (!referralInput.trim()) return;
    beginReferralCreationFlow();
  };

  const inputBlock = (
    <div className="flex overflow-hidden rounded-lg border border-violet-200 bg-white focus-within:border-violet-300 focus-within:ring-1 focus-within:ring-violet-100">
      <input
        type="text"
        value={referralInput}
        onChange={(e) => setReferralInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleApply()}
        placeholder="Код или ссылка"
        className="min-w-0 flex-1 border-0 bg-transparent px-2.5 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none sm:w-44"
        aria-label="Реферальный код или ссылка"
      />
      <button
        type="button"
        disabled={!referralInput.trim()}
        onClick={handleApply}
        className="shrink-0 bg-[#9a41fe] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#8840e5] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Применить
      </button>
    </div>
  );

  const tasksLink = (
    <Link
      to="/bonuses?tab=tasks"
      className="text-center text-xs font-medium text-[#7c3aed] hover:text-[#6d28d9] sm:whitespace-nowrap"
    >
      Задания
    </Link>
  );

  if (variant === 2) {
    return (
      <div className="mb-3 overflow-hidden rounded-xl border border-violet-200 bg-white shadow-sm">
        <div className="border-l-4 border-[#9a41fe] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#7c3aed]">Реферальный код</p>
          <p className="mt-1 text-sm leading-snug text-gray-800">
            Введите код, запустите продвижение — начислим{' '}
            <span className="font-bold text-[#9a41fe]">5 000 ₽</span> бонусами на второй запуск.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            {inputBlock}
            {tasksLink}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 3) {
    return (
      <div className="mb-3 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#9a41fe] px-4 py-3 text-white shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium leading-snug">
            Есть код приглашения? <span className="font-bold">+5 000 ₽</span> на второй запуск
          </p>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="flex overflow-hidden rounded-lg border border-white/30 bg-white/95 focus-within:ring-2 focus-within:ring-white/50">
              <input
                type="text"
                value={referralInput}
                onChange={(e) => setReferralInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                placeholder="Код или ссылка"
                className="min-w-0 flex-1 border-0 bg-transparent px-2.5 py-2 text-xs text-gray-900 placeholder:text-gray-500 focus:outline-none sm:w-40"
                aria-label="Реферальный код или ссылка"
              />
              <button
                type="button"
                disabled={!referralInput.trim()}
                onClick={handleApply}
                className="shrink-0 bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Применить
              </button>
            </div>
            <Link
              to="/bonuses?tab=tasks"
              className="text-center text-xs font-semibold text-white/90 underline-offset-2 hover:text-white hover:underline sm:whitespace-nowrap"
            >
              Задания
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3 rounded-xl border border-violet-100 bg-[#faf5ff] px-4 py-3 shadow-sm">
      <div className="flex min-h-[2.75rem] flex-col items-center justify-center gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="m-0 w-full text-center text-sm leading-snug text-gray-700 sm:flex-1 sm:text-left">
          <span className="font-semibold text-gray-900">Есть реферальный код?</span> Введите его,
          запустите продвижение — начислим{' '}
          <span className="font-semibold text-[#7c3aed]">5 000 ₽</span> бонусами на второй запуск.
        </p>
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          {inputBlock}
          {tasksLink}
        </div>
      </div>
    </div>
  );
}
