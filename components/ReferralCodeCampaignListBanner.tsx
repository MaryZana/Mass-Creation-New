import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from './ProfileContext';

export function ReferralCodeCampaignListBanner() {
  const { beginReferralCreationFlow } = useProfile();
  const [referralInput, setReferralInput] = useState('');

  const handleApply = () => {
    if (!referralInput.trim()) return;
    beginReferralCreationFlow();
  };

  return (
    <div className="mb-3 rounded-xl border border-violet-100 bg-[#faf5ff] px-4 py-3 shadow-sm">
      <div className="flex min-h-[2.75rem] flex-col items-center justify-center gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="m-0 w-full text-center text-sm leading-snug text-gray-700 sm:flex-1 sm:text-left">
          <span className="font-semibold text-gray-900">Есть реферальный код?</span> Введите его,
          запустите продвижение — начислим{' '}
          <span className="font-semibold text-[#7c3aed]">5 000 ₽</span> бонусами на второй запуск.
        </p>
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
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
          <Link
            to="/bonuses?tab=tasks"
            className="text-center text-xs font-medium text-[#7c3aed] hover:text-[#6d28d9] sm:whitespace-nowrap"
          >
            Задания
          </Link>
        </div>
      </div>
    </div>
  );
}
