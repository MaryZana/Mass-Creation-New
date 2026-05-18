import React from 'react';

export function ReferralHowItWorksStepRing({ step, ringFill }: { step: number; ringFill: number }) {
  const r = 17;
  const circumference = 2 * Math.PI * r;
  const accentLength = circumference * ringFill;

  return (
    <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white">
      <svg className="absolute h-11 w-11 -rotate-90" viewBox="0 0 44 44" aria-hidden>
        <circle cx="22" cy="22" r={r} fill="none" stroke="#e5e7eb" strokeWidth="2" strokeDasharray="4 5" />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke="#9a41fe"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={`${accentLength} ${circumference - accentLength}`}
        />
      </svg>
      <span className="relative text-sm font-semibold text-gray-800">{step}</span>
    </div>
  );
}
