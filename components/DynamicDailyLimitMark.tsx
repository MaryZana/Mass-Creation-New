import React, { useState } from 'react';
import { Sparkles } from './Icons';

export function demoDynamicDailyLimitStats(dailyLimit: number, campaignId?: number) {
  const seed = (campaignId ?? Math.round(dailyLimit)) % 7;
  const yesterdayPeak = Math.max(
    dailyLimit,
    Math.round((dailyLimit + 500 + seed * 250) / 100) * 100,
  );
  const currentFromAutomation = dailyLimit;
  return { yesterdayPeak, currentFromAutomation };
}

function formatRub(value: number) {
  return value.toLocaleString('ru-RU', { useGrouping: true });
}

export function DynamicDailyLimitStatsTooltipContent({
  yesterdayPeak,
  currentFromAutomation,
}: {
  yesterdayPeak: number;
  currentFromAutomation: number;
}) {
  return (
    <>
      <p className="mb-0 text-white/70">Автоматизация дневного лимита</p>
      <p className="mb-0 mt-2">
        Вчера максимум:{' '}
        <span className="font-semibold tabular-nums">{formatRub(yesterdayPeak)} ₽</span>
      </p>
      <p className="mb-0 mt-1">
        Сейчас из‑за автоматизации:{' '}
        <span className="font-semibold tabular-nums">{formatRub(currentFromAutomation)} ₽</span>
      </p>
      <p className="mb-0 mt-2 text-white/70">
        Лимит может вырасти по правилам — расход за день может быть выше базового значения
      </p>
    </>
  );
}

/** Метка «Динамичный» — основной тултип со статистикой автолимита. */
export function DynamicDailyLimitMark({
  dailyLimitRub,
  campaignId,
  className = '',
  compact = false,
}: {
  dailyLimitRub: number;
  campaignId?: number;
  className?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const stats = demoDynamicDailyLimitStats(dailyLimitRub, campaignId);

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <span
        className={`inline-flex cursor-help items-center gap-1 font-medium text-[#9A41FE] ${
          compact ? 'text-xs' : 'text-sm'
        }`}
      >
        <Sparkles className={compact ? 'h-3.5 w-3.5 shrink-0' : 'h-4 w-4 shrink-0'} aria-hidden />
        <span>Динамичный</span>
      </span>
      {open ? (
        <div
          role="tooltip"
          className="absolute left-0 top-full z-[60] mt-1.5 w-max max-w-[300px] rounded-lg bg-gray-900 p-3 text-left text-xs leading-snug text-white shadow-lg"
        >
          <DynamicDailyLimitStatsTooltipContent
            yesterdayPeak={stats.yesterdayPeak}
            currentFromAutomation={stats.currentFromAutomation}
          />
        </div>
      ) : null}
    </div>
  );
}
