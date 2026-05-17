import React from 'react';

export function ReferralInviteCreationBanner() {
  return (
    <section
      className="mb-6 rounded-2xl border border-violet-100 bg-gradient-to-br from-[#f3efff] via-white to-white p-5 sm:p-6 shadow-sm"
      aria-labelledby="referral-invite-creation-title"
    >
      <h2 id="referral-invite-creation-title" className="text-lg font-bold text-gray-900 sm:text-xl">
        Вас пригласили в запуск продвижения
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-700">
        Пополните и запустите эту кампанию на{' '}
        <span className="font-semibold text-gray-900">2 000 ₽</span>.{' '}
        <span className="font-semibold text-emerald-600">3 000 ₽</span> промобонусов начислим на ваш счёт, когда вы
        потратите весь бюджет этой кампании.
      </p>
    </section>
  );
}
