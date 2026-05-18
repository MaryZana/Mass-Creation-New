import React from 'react';
import { ReferralHowItWorksStepRing } from './ReferralHowItWorksStepRing';

const INVITE_CREATION_STEPS = [
  {
    title: 'Пополните счёт',
    subtitle: 'Минимум 2 000 ₽ — настройте кампанию ниже',
    ringFill: 0.42,
  },
  {
    title: 'Запустите и потратьте бюджет',
    subtitle: '3 000 ₽ промобонусов после полной траты',
    ringFill: 0.28,
  },
] as const;

export function ReferralInviteCreationBanner() {
  return (
    <section className="mb-6" aria-labelledby="referral-invite-creation-title">
      <h2
        id="referral-invite-creation-title"
        className="text-center text-lg font-bold text-gray-900 sm:text-xl"
      >
        Вас пригласили в запуск продвижения
      </h2>

      <div className="relative mx-auto mt-6 max-w-3xl">
        <div
          className="pointer-events-none absolute left-[calc(25%-8px)] right-[calc(25%-8px)] top-[22px] hidden h-px bg-gray-200 sm:block"
          aria-hidden
        />

        <ol className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-6">
          {INVITE_CREATION_STEPS.map((item, index) => (
            <li key={item.title} className="flex flex-col items-center text-center">
              <ReferralHowItWorksStepRing step={index + 1} ringFill={item.ringFill} />
              <div className="mt-3 w-full rounded-2xl border border-gray-100 bg-white px-3 py-4 shadow-sm sm:px-4 sm:py-5">
                <p className="text-sm font-bold text-gray-900">{item.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-500 sm:text-sm">{item.subtitle}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
