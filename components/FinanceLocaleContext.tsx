import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  FINANCE_LOCALES,
  type FinanceLocaleId,
  type FinanceMessageKey,
  formatContractCountLabel,
  formatFinanceDay,
  formatFinanceDayHeading,
  formatFinanceDayShort,
  formatFinanceInputDate,
  formatFinanceMoney,
  formatFinanceNumber,
  formatFinanceTableDate,
  getFinanceBcp47,
  getFinanceLocaleMeta,
  initFinanceLocaleFromStorage,
  readStoredFinanceLocale,
  setFinanceLocaleId,
  subscribeFinanceLocale,
  tFinance,
} from './financeI18n';

type FinanceLocaleApi = {
  locale: FinanceLocaleId;
  setLocale: (id: FinanceLocaleId) => void;
  t: (key: FinanceMessageKey) => string;
  bcp47: string;
  formatNumber: (n: number) => string;
  formatMoney: (n: number) => string;
  formatDayHeading: (date: Date, showYear?: boolean) => string;
  formatDay: (date: Date) => string;
  formatDayShort: (date: Date) => string;
  formatTableDate: (value: string) => string;
  formatInputDate: (date: Date) => string;
  formatContractCount: (count: number) => string;
};

const FinanceLocaleContext = createContext<FinanceLocaleApi | null>(null);

export function FinanceLocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<FinanceLocaleId>(() => {
    initFinanceLocaleFromStorage();
    return readStoredFinanceLocale();
  });

  useEffect(() => {
    return subscribeFinanceLocale(() => {
      setLocaleState(readStoredFinanceLocale());
    });
  }, []);

  const api = useMemo<FinanceLocaleApi>(() => {
    const setLocale = (id: FinanceLocaleId) => {
      setFinanceLocaleId(id);
      setLocaleState(id);
    };
    return {
      locale,
      setLocale,
      t: (key) => tFinance(key, locale),
      bcp47: getFinanceBcp47(locale),
      formatNumber: (n) => formatFinanceNumber(n, locale),
      formatMoney: (n) => formatFinanceMoney(n, locale),
      formatDayHeading: (date, showYear) => formatFinanceDayHeading(date, showYear, locale),
      formatDay: (date) => formatFinanceDay(date, locale),
      formatDayShort: (date) => formatFinanceDayShort(date, locale),
      formatTableDate: (value) => formatFinanceTableDate(value, locale),
      formatInputDate: (date) => formatFinanceInputDate(date, locale),
      formatContractCount: (count) => formatContractCountLabel(count, locale),
    };
  }, [locale]);

  return <FinanceLocaleContext.Provider value={api}>{children}</FinanceLocaleContext.Provider>;
}

export function useFinanceLocale(): FinanceLocaleApi {
  const ctx = useContext(FinanceLocaleContext);
  if (!ctx) {
    return {
      locale: 'ru',
      setLocale: setFinanceLocaleId,
      t: (key) => tFinance(key, 'ru'),
      bcp47: 'ru-RU',
      formatNumber: (n) => formatFinanceNumber(n, 'ru'),
      formatMoney: (n) => formatFinanceMoney(n, 'ru'),
      formatDayHeading: (date, showYear) => formatFinanceDayHeading(date, !!showYear, 'ru'),
      formatDay: (date) => formatFinanceDay(date, 'ru'),
      formatDayShort: (date) => formatFinanceDayShort(date, 'ru'),
      formatTableDate: (value) => formatFinanceTableDate(value, 'ru'),
      formatInputDate: (date) => formatFinanceInputDate(date, 'ru'),
      formatContractCount: (count) => formatContractCountLabel(count, 'ru'),
    };
  }
  return ctx;
}

/** Переключатель в формате нижней панели (как «Сценарий» / «iPhone») */
export function FinanceLocaleSwitcher({
  className = '',
  presentation = 'select',
}: {
  className?: string;
  /** select — компактный select в pill; pill — тот же стиль, что у iPhone */
  presentation?: 'select' | 'pill';
}) {
  const { locale, setLocale, t } = useFinanceLocale();
  const meta = getFinanceLocaleMeta(locale);

  if (presentation === 'pill') {
    return (
      <label
        className={`inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-900 shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-colors hover:bg-gray-50 ${className}`}
        title={t('language')}
      >
        <span className="text-gray-500">{t('language')}</span>
        <select
          value={locale}
          aria-label={t('language')}
          onChange={(e) => setLocale(e.target.value as FinanceLocaleId)}
          className="max-w-[14rem] cursor-pointer truncate border-0 bg-transparent p-0 text-sm font-medium text-gray-900 outline-none"
        >
          {FINANCE_LOCALES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.shortLabel} · {item.ruLabel}
            </option>
          ))}
        </select>
        <span className="sr-only">{meta.marketLabel}</span>
      </label>
    );
  }

  return (
    <label className={`inline-flex min-w-0 items-center gap-1.5 ${className}`} title={t('language')}>
      <select
        value={locale}
        aria-label={t('language')}
        onChange={(e) => setLocale(e.target.value as FinanceLocaleId)}
        className="h-8 max-w-[14rem] cursor-pointer truncate rounded-lg border border-gray-200 bg-white px-2 text-[12px] font-medium text-gray-800 outline-none transition-colors hover:border-gray-300 focus:border-gray-400"
      >
        {FINANCE_LOCALES.map((item) => (
          <option key={item.id} value={item.id}>
            {item.shortLabel} · {item.ruLabel}
          </option>
        ))}
      </select>
      <span className="sr-only">{meta.marketLabel}</span>
    </label>
  );
}
