import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, X } from './Icons';

type ReferralCampaignCreatedNoticeProps = {
  onDismiss: () => void;
};

export function ReferralCampaignCreatedNotice({ onDismiss }: ReferralCampaignCreatedNoticeProps) {
  return (
    <div className="relative mb-6 animate-in fade-in rounded-xl border border-emerald-100 bg-white p-5 shadow-sm duration-300">
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        aria-label="Закрыть"
      >
        <X className="h-5 w-5" />
      </button>
      <div className="flex items-start gap-4 pr-8">
        <CheckCircle className="mt-0.5 h-8 w-8 shrink-0 text-emerald-500" aria-hidden />
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-gray-900">Кампания создана</h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">
            После того как на кампании будет потрачено 2&nbsp;000&nbsp;₽, пришлём 5&nbsp;000&nbsp;₽
            бонусами.
          </p>
          <Link
            to="/bonuses?tab=tasks"
            className="mt-2 inline-block text-sm font-semibold text-[#9a41fe] hover:text-[#8840e5] hover:underline"
          >
            Читать правила задания
          </Link>
        </div>
      </div>
    </div>
  );
}
