import React, { useEffect, useMemo, useState } from 'react';
import { Checkbox } from 'antd';
import { X } from './Icons';

const TOTAL_PROMO_BONUS = 226660517;
const BONUS_PACKAGES = [
  { id: 'p1', amount: 209527397, maxPercent: 100, expiry: '20.03.26', displayBurn: '209.4M' },
  { id: 'p2', amount: 17133120, maxPercent: 99, expiry: '27.03.26', displayBurn: '168.3k' },
] as const;

const getPlural = (number: number, one: string, two: string, five: string) => {
  let n = Math.abs(number);
  n %= 100;
  if (n >= 5 && n <= 20) return five;
  n %= 10;
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return two;
  return five;
};

const parseDisplayValue = (str: string): number =>
  Number(String(str).replace(/\s/g, '').replace(/,/g, '.'));

const formatForDisplay = (num: number | string | undefined | null): string => {
  if (num === null || num === undefined || num === '') return '0';
  const numValue = typeof num === 'string' ? parseDisplayValue(num) : num;
  if (Number.isNaN(numValue)) return '0';
  return numValue.toLocaleString('ru-RU', { useGrouping: true });
};

export const BudgetRefillModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (amount: number) => void;
  currentBudget: number;
  /** >1 — массовое пополнение (одна сумма на каждую кампанию) */
  campaignCount?: number;
}> = ({ isOpen, onClose, onSave, currentBudget: _currentBudget, campaignCount }) => {
  const [refillAmount, setRefillAmount] = useState('3000');
  const [useBonuses, setUseBonuses] = useState(false);
  const [selectedPkgId, setSelectedPkgId] = useState(BONUS_PACKAGES[0].id);
  const [bonusValue, setBonusValue] = useState<number | string>(3000);
  const [budgetError, setBudgetError] = useState('');
  const [bonusError, setBonusError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRefillAmount('3000');
      setUseBonuses(false);
      setBonusValue(3000);
      setBudgetError('');
      setBonusError('');
    }
  }, [isOpen]);

  const selectedPkg = useMemo(
    () => BONUS_PACKAGES.find((p) => p.id === selectedPkgId) || BONUS_PACKAGES[0],
    [selectedPkgId],
  );
  const currentBudgetValue = parseDisplayValue(refillAmount);
  const numericBonusValue = parseDisplayValue(String(bonusValue));

  useEffect(() => {
    setBudgetError('');
    setBonusError('');

    if (currentBudgetValue < 1000 && refillAmount !== '') {
      setBudgetError('Минимальный бюджет 1000 ₽');
    }

    if (useBonuses) {
      if (numericBonusValue > currentBudgetValue) {
        setBonusError('Сумма бонусов не может превышать общий бюджет');
        return;
      }

      const maxBonusFromPackage = selectedPkg.amount;
      if (numericBonusValue > maxBonusFromPackage) {
        setBonusError(`В пакете доступно только ${formatForDisplay(maxBonusFromPackage)} B`);
        return;
      }

      const maxPercent = selectedPkg.maxPercent / 100;
      const maxBonusAllowedByPercent = currentBudgetValue * maxPercent;

      if (numericBonusValue > maxBonusAllowedByPercent) {
        setBonusError(
          `Можно списать максимум ${formatForDisplay(Math.floor(maxBonusAllowedByPercent))} B (${selectedPkg.maxPercent}% от суммы)`,
        );
        return;
      }
    }
  }, [refillAmount, useBonuses, bonusValue, selectedPkg, currentBudgetValue, numericBonusValue]);

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseDisplayValue(e.target.value);
    if (!Number.isNaN(parsed)) {
      setRefillAmount(String(parsed));
    } else if (e.target.value === '') {
      setRefillAmount('');
    }
  };

  const handleBudgetBlur = () => {
    const parsed = parseDisplayValue(refillAmount);
    if (Number.isNaN(parsed) || parsed < 1000) {
      setRefillAmount('1000');
    }
  };

  const handleBonusBlur = () => {
    const numericValue = parseDisplayValue(String(bonusValue));
    if (Number.isNaN(numericValue) || numericValue < 0) {
      setBonusValue(0);
    }
  };

  if (!isOpen) return null;

  const massCount = campaignCount != null && campaignCount > 1 ? campaignCount : 0;
  const isMassRefill = massCount > 1;
  const modalTitle = isMassRefill
    ? `Пополнение бюджета для ${massCount} ${getPlural(massCount, 'кампании', 'кампаний', 'кампаний')}`
    : 'Пополнение бюджета';
  const amountLabel = isMassRefill ? 'Сумма пополнения для 1 кампании' : 'Сумма пополнения';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">{modalTitle}</h3>
          <button type="button" onClick={onClose} aria-label="Закрыть">
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <div className="custom-scrollbar mb-6 max-h-[70vh] overflow-y-auto pr-2">
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">{amountLabel}</label>
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  className={`w-full rounded-lg border px-3 py-2 pr-8 outline-none focus:ring-2 focus:ring-purple-500 ${budgetError ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="3000"
                  value={formatForDisplay(refillAmount)}
                  onChange={handleBudgetChange}
                  onBlur={handleBudgetBlur}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  ₽
                </span>
              </div>
              {budgetError ? <p className="mt-1.5 text-xs text-red-500">{budgetError}</p> : null}
              {isMassRefill && !budgetError ? (
                <p className="mt-2 text-xs text-gray-500">
                  Применится ко всем {massCount}{' '}
                  {getPlural(massCount, 'выбранной кампании', 'выбранным кампаниям', 'выбранным кампаниям')}.
                </p>
              ) : null}
            </div>

            <div className="border-t border-gray-100 pt-4">
              <div className="mb-4 flex items-center gap-2">
                <Checkbox
                  id={isMassRefill ? 'bonus-toggle-mass' : 'bonus-toggle'}
                  checked={useBonuses}
                  onChange={(e) => setUseBonuses(e.target.checked)}
                  className="h-5 w-5 cursor-pointer text-purple-600"
                />
                <label
                  htmlFor={isMassRefill ? 'bonus-toggle-mass' : 'bonus-toggle'}
                  className="cursor-pointer text-sm font-semibold text-gray-900"
                >
                  Списать промо-бонусы{' '}
                  <span className="ml-1 font-normal text-gray-400">
                    ({formatForDisplay(TOTAL_PROMO_BONUS)} B)
                  </span>
                </label>
              </div>

              {useBonuses ? (
                <div className="duration-300 animate-in fade-in slide-in-from-top-2">
                  <div className="custom-scrollbar flex snap-x gap-4 overflow-x-auto pb-4">
                    {BONUS_PACKAGES.map((pkg) => (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPkgId(pkg.id)}
                        className={`relative min-w-[200px] cursor-pointer snap-start rounded-xl border-2 p-4 transition-all ${selectedPkgId === pkg.id ? 'border-purple-600 bg-purple-50/30' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                      >
                        <div className="mb-1 flex items-start justify-between">
                          <span className="text-xl font-bold text-gray-900">
                            {formatForDisplay(pkg.amount)}
                          </span>
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${selectedPkgId === pkg.id ? 'border-purple-600' : 'border-gray-300'}`}
                          >
                            {selectedPkgId === pkg.id ? (
                              <div className="h-2.5 w-2.5 rounded-full bg-purple-600" />
                            ) : null}
                          </div>
                        </div>
                        <p className="mb-3 text-xs font-medium leading-tight text-gray-500">
                          Оплата до {pkg.maxPercent}% от суммы
                        </p>
                        <div className="mt-auto flex items-center gap-1.5 pt-1 text-xs text-gray-500">
                          <span className="text-orange-500">🔥</span>
                          <span>
                            {pkg.displayBurn} сгорят {pkg.expiry}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-center">
                    <div className="relative w-full md:w-48">
                      <input
                        type="text"
                        value={formatForDisplay(bonusValue)}
                        onChange={(e) => setBonusValue(e.target.value)}
                        onBlur={handleBonusBlur}
                        className={`w-full rounded-xl border px-4 py-3 text-lg font-bold outline-none focus:ring-2 focus:ring-purple-500 ${bonusError ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      <p className="mt-1.5 text-xs text-gray-500">
                        до {formatForDisplay(numericBonusValue)} B (1B = 1P)
                      </p>
                    </div>
                    <div className="text-sm leading-snug text-gray-500">
                      {bonusError ? (
                        <p className="text-red-500">{bonusError}</p>
                      ) : (
                        <p>Списать можно максимум {selectedPkg.maxPercent}% от суммы пополнения</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={() => {
              const amount = parseDisplayValue(refillAmount);
              onSave(amount);
            }}
            disabled={!!budgetError || !!bonusError}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
};
