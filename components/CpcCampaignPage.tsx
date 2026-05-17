import React, { useState, useEffect, useMemo } from 'react';
import { Checkbox } from 'antd';
import { Wallet, HelpCircle, X, RefreshCw, ChevronDown, Clock, SingleAccountIcon, Plus, Settings, Bell, CheckCircle } from './Icons';
import { AppHeader } from './AppHeader';

const UNIFIED_BALANCE = 105350;
const TOTAL_PROMO_BONUS = 226660517;

const BONUS_PACKAGES = [
  { id: 'p1', amount: 209527397, maxPercent: 100, expiry: '20.03.26', displayBurn: '209.4M' },
  { id: 'p2', amount: 17133120, maxPercent: 99, expiry: '27.03.26', displayBurn: '168.3k' },
];

const formatForDisplay = (num: number | string | undefined | null): string => {
  if (num === null || num === undefined || num === '') return '0';
  const numValue = typeof num === 'string' ? parseDisplayValue(num) : num;
  if (isNaN(numValue) || numValue === null || numValue === undefined) return '0';
  return numValue.toLocaleString('ru-RU', { useGrouping: true });
};

const formatCurrency = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return 'Н/Д';
  return `${num.toLocaleString('ru-RU')} ₽`;
};

const parseDisplayValue = (str: string): number => {
  return Number(String(str).replace(/\s/g, '').replace(/,/g, '.'));
};

interface CpcCampaignPageProps {
  campaignId: number;
  name: string;
  remainingBudget: number | null;
  dailyLimit: number | null;
  scheduledDailyLimit: number | null;
  /** true = дневной лимит израсходован, показы остановлены до завтра */
  dailyLimitExhausted?: boolean;
  onBack: () => void;
  onUpdateData?: (data: { name?: string; remainingBudget?: number | null; dailyLimit?: number | null; scheduledDailyLimit?: number | null }) => void;
}

const ToggleSwitch = ({ checked, onChange, disabled = false }: { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) => (
  <button 
    role="switch" 
    aria-checked={checked} 
    onClick={() => !disabled && onChange(!checked)} 
    disabled={disabled} 
    className={`relative inline-flex h-4 w-7 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${ 
      disabled ? 'cursor-not-allowed bg-gray-200' : 'cursor-pointer' 
    } ${ 
      checked ? (disabled ? 'bg-purple-300' : 'bg-purple-600') : 'bg-gray-300' 
    }`}
  >
    <span 
      aria-hidden="true" 
      className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${ 
        checked ? 'translate-x-3' : 'translate-x-0' 
      }`} 
    />
  </button>
);

const Toast = ({ show, message, onClose, isSuccess = false, isError = false, durationMs = 3000 }: { show: boolean, message: string, onClose: () => void, isSuccess?: boolean, isError?: boolean, durationMs?: number }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, durationMs);
      return () => clearTimeout(timer);
    }
  }, [show, onClose, durationMs]);
  
  if (!show) return null;
  
  const bgClass = isError ? 'bg-red-600' : isSuccess ? 'bg-green-600' : 'bg-gray-900';
  return (
    <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 ${bgClass} text-white px-6 py-3 rounded-lg shadow-xl z-[100] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 max-w-md ${isError ? 'pointer-events-none' : ''}`}>
      <span className="font-medium whitespace-pre-line">{message}</span>
    </div>
  );
};

const DailyLimitInfoTooltip: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <HelpCircle className="w-4 h-4 text-gray-600 cursor-help" />
      {isVisible && (
        <>
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-80 h-2" onMouseEnter={() => setIsVisible(true)}></div>
          <div 
            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50 text-left"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
          >
            <p className="font-semibold mb-2">Как работает дневной лимит?</p>
            <p className="mb-2">Сумму, которую вы зададите в лимите мы будем расходовать в течение дня равномерно, она не сгорит за 1-2 часа. Так вы достигаете наилучших показателей по показам.</p>
            <a href="#" className="text-purple-300 hover:underline">Читать подробнее</a>
          </div>
        </>
      )}
    </div>
  );
};

export const CpcCampaignPage: React.FC<CpcCampaignPageProps> = ({ campaignId, name, remainingBudget, dailyLimit, scheduledDailyLimit, dailyLimitExhausted, onBack, onUpdateData }) => {
  const [isAutoRefillModalOpen, setIsAutoRefillModalOpen] = useState(false);
  const [isDailyLimitEnabled, setIsDailyLimitEnabled] = useState(dailyLimit !== null && dailyLimit !== undefined);
  const [dailyLimitValue, setDailyLimitValue] = useState(dailyLimit ? String(dailyLimit) : '');
  const [isBudgetRefillModalOpen, setIsBudgetRefillModalOpen] = useState(false);
  const [wasDailyLimitToggledOn, setWasDailyLimitToggledOn] = useState(false);
  const [wasModalOpenedFromInput, setWasModalOpenedFromInput] = useState(false);
  const [isDisableLimitModalOpen, setIsDisableLimitModalOpen] = useState(false);
  const [pendingDailyLimitToSave, setPendingDailyLimitToSave] = useState<string | null>(null);
  const [previousDailyLimitValue, setPreviousDailyLimitValue] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastIsError, setToastIsError] = useState(false);
  const [isAutoRefillEnabled, setIsAutoRefillEnabled] = useState(false);
  const [wasAutoRefillToggledOn, setWasAutoRefillToggledOn] = useState(false);
  const [campaignBudget, setCampaignBudget] = useState(remainingBudget ?? 1500);
  const [campaignName, setCampaignName] = useState(name);
  const [isDailyLimitTooltipVisible, setIsDailyLimitTooltipVisible] = useState(false);
  const [isExhaustedPlaqueTooltipVisible, setIsExhaustedPlaqueTooltipVisible] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [pendingDailyLimit, setPendingDailyLimit] = useState<string | null>(null);
  const [savedDailyLimit, setSavedDailyLimit] = useState(dailyLimit ? String(dailyLimit) : '');
  const [isCarryoverEnabled, setIsCarryoverEnabled] = useState(false);
  const [isCarryoverTooltipVisible, setIsCarryoverTooltipVisible] = useState(false);

  // Sync with props when they change
  useEffect(() => {
    setCampaignName(name);
  }, [name]);

  useEffect(() => {
    setCampaignBudget(remainingBudget ?? 1500);
  }, [remainingBudget]);

  useEffect(() => {
    const isEnabled = dailyLimit !== null && dailyLimit !== undefined;
    setIsDailyLimitEnabled(isEnabled);
    if (isEnabled && dailyLimit) {
      setDailyLimitValue(String(dailyLimit));
      setSavedDailyLimit(String(dailyLimit));
    } else {
      setDailyLimitValue('');
      setSavedDailyLimit('');
    }
  }, [dailyLimit]);

  useEffect(() => {
    if (isFirstVisit) {
      const timer = setTimeout(() => {
        setIsDailyLimitTooltipVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isFirstVisit]);

  useEffect(() => {
    if (isFirstVisit && isDailyLimitTooltipVisible) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.tooltip-container')) {
          setIsDailyLimitTooltipVisible(false);
          setIsFirstVisit(false);
        }
      };
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [isFirstVisit, isDailyLimitTooltipVisible]);

  return (
    <div className="min-h-screen bg-[#F6F6F9] font-sans text-gray-900 pb-10">
      <AppHeader onNavigate={onBack} />

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
            <div className="mt-2 flex items-center gap-3 text-sm text-gray-500 flex-wrap">
              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                Активна
              </span>
              <span>CPC</span>
              <span>ID {campaignId}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm font-medium bg-gray-800 text-white rounded-lg hover:bg-gray-900">
              Приостановить
            </button>
            <button className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200">
              Завершить
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-800 mb-3">Остаток бюджета</p>
                <div className="relative inline-flex items-center group">
                  <button
                    type="button"
                    onClick={() => {
                      setWasDailyLimitToggledOn(false);
                      setIsBudgetRefillModalOpen(true);
                    }}
                    className="font-semibold text-blue-600 hover:text-purple-600 transition-colors cursor-pointer"
                  >
                    {formatCurrency(campaignBudget)}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWasDailyLimitToggledOn(false);
                      setIsBudgetRefillModalOpen(true);
                    }}
                    className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Plus className="w-4 h-4 text-purple-600" />
                  </button>
                </div>
                {isAutoRefillEnabled && (
                  <div className="flex items-center gap-1 text-xs mt-1 text-green-600">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Автопополнение
                  </div>
                )}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <ToggleSwitch checked={isAutoRefillEnabled} onChange={(checked) => {
                    if (checked) {
                      setWasAutoRefillToggledOn(true);
                      setIsAutoRefillModalOpen(true);
                    } else {
                      setIsAutoRefillEnabled(false);
                      setWasAutoRefillToggledOn(false);
                      setToastMessage('Изменения сохранены');
                      setShowToast(true);
                    }
                  }} />
                  <p className="text-sm text-gray-800 flex items-center gap-1">
                    <span 
                      onClick={() => {
                        setWasAutoRefillToggledOn(false);
                        setIsAutoRefillModalOpen(true);
                      }}
                      className="cursor-pointer hover:text-purple-600 transition-colors"
                    >
                      Автопополнение бюджета
                    </span>
                    <button
                      onClick={() => {
                        setWasAutoRefillToggledOn(false);
                        setIsAutoRefillModalOpen(true);
                      }}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-600" />
                    </button>
                  </p>
                {isAutoRefillEnabled && (
                  <p className="text-xs text-gray-400 mt-2">
                    Если бюджет меньше {formatForDisplay(campaignBudget)} ₽, пополняем на {formatForDisplay(campaignBudget)} ₽ не чаще 1 раза в день
                  </p>
                )}
                {!isAutoRefillEnabled && (
                  <p className="text-xs text-gray-400 mt-2">
                    Включите автопополнение, чтобы кампания не останавливалась
                  </p>
                )}
              </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ToggleSwitch checked={isDailyLimitEnabled} onChange={(checked) => {
                  if (checked) {
                    setIsDailyLimitEnabled(true);
                    setDailyLimitValue('');
                    setSavedDailyLimit('');
                    setPendingDailyLimit(null);
                  } else {
                    if (savedDailyLimit) {
                      setIsDisableLimitModalOpen(true);
                    } else {
                      setIsDailyLimitEnabled(false);
                      setWasDailyLimitToggledOn(false);
                      setPendingDailyLimit(null);
                      setDailyLimitValue('');
                      setToastMessage('Изменения сохранены');
                      setShowToast(true);
                      if (onUpdateData) onUpdateData({ dailyLimit: null, scheduledDailyLimit: null });
                    }
                  }
                }} />
                <p className="m-0 text-sm text-gray-800 flex items-center gap-2 leading-none">
                  <span className="leading-snug">Дневной лимит</span>
                  <DailyLimitInfoTooltip />
                </p>
              </div>
              {dailyLimitExhausted && (
                <div
                  className="relative inline-block shrink-0"
                  onMouseEnter={() => setIsExhaustedPlaqueTooltipVisible(true)}
                  onMouseLeave={() => setIsExhaustedPlaqueTooltipVisible(false)}
                >
                  <div className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md">
                    Дневной лимит исчерпан
                  </div>
                  {isExhaustedPlaqueTooltipVisible && (
                    <>
                      <div className="absolute right-0 top-full w-48 h-2" onMouseEnter={() => setIsExhaustedPlaqueTooltipVisible(true)} />
                      <div
                        className="absolute right-0 top-full mt-2 w-max max-w-[300px] p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50 text-left"
                        onMouseEnter={() => setIsExhaustedPlaqueTooltipVisible(true)}
                        onMouseLeave={() => setIsExhaustedPlaqueTooltipVisible(false)}
                      >
                        Показы остановлены до завтра. Если хотите возобновить показы сейчас увеличьте лимит
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-1/3">
                <input
                  type="text"
                  value={dailyLimitValue ? formatForDisplay(dailyLimitValue) : ''}
                  disabled={!isDailyLimitEnabled}
                  onChange={(e) => {
                    const parsed = parseDisplayValue(e.target.value);
                    if (!isNaN(parsed)) {
                      setDailyLimitValue(String(parsed));
                    } else if (e.target.value === '') {
                      setDailyLimitValue('');
                    }
                  }}
                  onBlur={() => {
                    if (!isDailyLimitEnabled) return;
                    const parsed = parseDisplayValue(dailyLimitValue);
                    if (dailyLimitValue === '' || parseDisplayValue(dailyLimitValue) === parseDisplayValue(savedDailyLimit)) return;
                    if (isNaN(parsed) || parsed < 1000) {
                      setToastMessage(`Минимальная сумма дневного лимита: ${formatForDisplay(1000)} ₽`);
                      setShowToast(true);
                      return;
                    }
                    if (parsed > campaignBudget) {
                      // Возвращаем инпут к предыдущему сохранённому значению, если лимит выше бюджета
                      setDailyLimitValue(savedDailyLimit || '');
                      setToastMessage(`Чтобы задать дневной лимит ${formatForDisplay(parsed)} ₽, пополните бюджет еще на ${formatForDisplay(parsed - campaignBudget)} ₽`);
                      setToastIsError(true);
                      setShowToast(true);
                      return;
                    }
                    setSavedDailyLimit(dailyLimitValue);
                    setToastMessage(`Новый дневной лимит установлен.\nРаспределяем ${formatForDisplay(parsed)}₽ в течении суток равномерно`);
                    setShowToast(true);
                    if (onUpdateData) {
                      onUpdateData({ dailyLimit: parsed, scheduledDailyLimit: null });
                    }
                  }}
                  className={`w-full text-sm border shadow-sm outline-none transition-colors px-2 py-1.5 rounded-lg pr-6 ${
                    !isDailyLimitEnabled 
                      ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200' 
                      : 'bg-white border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                  }`}
                  placeholder="от 1 000₽"
                />
                <span className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${!isDailyLimitEnabled ? 'text-gray-300' : 'text-gray-400'}`}>₽</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <label className="flex items-center gap-2 text-xs cursor-pointer m-0">
                <Checkbox
                  disabled={!isDailyLimitEnabled}
                  checked={isCarryoverEnabled}
                  onChange={(e) => {
                    if (!isDailyLimitEnabled) return;
                    setIsCarryoverEnabled(e.target.checked);
                    setToastMessage('Настройка переноса лимита сохранена');
                    setShowToast(true);
                  }}
                />
                <span className={isDailyLimitEnabled ? 'text-gray-700' : 'text-gray-400'}>
                  Переносить неиспользованный лимит
                </span>
              </label>
              <div
                className="relative inline-block"
                onMouseEnter={() => setIsCarryoverTooltipVisible(true)}
                onMouseLeave={() => setIsCarryoverTooltipVisible(false)}
              >
                <HelpCircle className="w-4 h-4 text-gray-500 cursor-help" />
                {isCarryoverTooltipVisible && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50 text-left">
                    <p className="mb-1">Система старается тратить бюджет равномерно.</p>
                    <p>
                      Если сегодня потратится меньше дневного лимита, остаток будет добавлен к лимиту следующего дня.
                      Общая сумма расходов не увеличивается.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-gray-900">Статистика</h2>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50">
                <span>График</span>
              </button>
              <button className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50">
                Полная статистика
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border border-gray-200 rounded-2xl px-5 py-4">
              <p className="text-base font-semibold text-gray-900 mb-2">Показы</p>
              <p className="text-lg font-bold text-gray-900 mb-4">Нет данных</p>
              <div className="border-t border-gray-100 pt-3 text-sm text-gray-500">
                <p className="font-medium text-xs text-gray-500 mb-1">CPM</p>
                <p className="text-sm text-gray-400">Нет данных</p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-2xl px-5 py-4">
              <p className="text-base font-semibold text-gray-900 mb-2">Клики</p>
              <p className="text-lg font-bold text-gray-900 mb-4">Нет данных</p>
              <div className="border-t border-gray-100 pt-3 text-sm text-gray-500 space-y-1">
                <p className="text-xs text-gray-500">CTR</p>
                <p className="text-sm text-gray-400">Нет данных</p>
                <p className="text-xs text-gray-500 mt-2">CPC</p>
                <p className="text-sm text-gray-400">Нет данных</p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-2xl px-5 py-4">
              <p className="text-base font-semibold text-gray-900 mb-2">Заказы</p>
              <p className="text-lg font-bold text-gray-900 mb-4">Нет данных</p>
              <div className="border-t border-gray-100 pt-3 text-sm text-gray-500 space-y-1">
                <p className="text-xs text-gray-500">CR</p>
                <p className="text-sm text-gray-400">Нет данных</p>
                <p className="text-xs text-gray-500 mt-2">CPO</p>
                <p className="text-sm text-gray-400">Нет данных</p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-2xl px-5 py-4">
              <p className="text-base font-semibold text-gray-900 mb-2">Доля затрат</p>
              <p className="text-lg font-bold text-gray-900 mb-4">Нет данных</p>
              <div className="border-t border-gray-100 pt-3 text-sm text-gray-500 space-y-1">
                <p className="text-xs text-gray-500">Сумма заказов</p>
                <p className="text-sm text-gray-400">Нет данных</p>
                <p className="text-xs text-gray-500 mt-2">Расход</p>
                <p className="text-sm text-gray-400">Нет данных</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-gray-900">Показываем товар в поиске и в каталоге</h2>
            <button className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">
              Статистика
            </button>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-bold text-gray-900">Ставки по товарам</h2>
            <div className="flex flex-wrap items-center gap-3">
              <button className="px-3 py-1.5 text-sm font-medium bg-gray-800 text-white rounded-lg hover:bg-gray-900">
                Добавить товары
              </button>
              <input
                type="text"
                placeholder="Поиск по товарам"
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                  <th className="p-3 text-left">Товар</th>
                  <th className="p-3 text-left">В поиске (CPC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-gray-100" />
                      <div>
                        <p className="font-medium text-gray-800">Товар 160747184</p>
                        <p className="text-xs text-gray-500">Футболка хлопок мягкая приятная</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        defaultValue="200"
                        className="w-20 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      />
                      <span className="text-sm text-gray-500">₽</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Auto Refill Modal */}
      {isAutoRefillModalOpen && (
        <AutoRefillModal
          isOpen={isAutoRefillModalOpen}
          onClose={() => {
            setIsAutoRefillModalOpen(false);
            if (wasAutoRefillToggledOn) {
              setIsAutoRefillEnabled(false);
              setWasAutoRefillToggledOn(false);
            }
          }}
          onSave={() => {
            setIsAutoRefillEnabled(true);
            setIsAutoRefillModalOpen(false);
            setWasAutoRefillToggledOn(false);
            setToastMessage('Автопополнение настроено');
            setShowToast(true);
          }}
        />
      )}

      {/* Budget Refill Modal */}
      {isBudgetRefillModalOpen && (
        <BudgetRefillModal
          isOpen={isBudgetRefillModalOpen}
          onClose={() => {
            setIsBudgetRefillModalOpen(false);
            if (wasDailyLimitToggledOn) {
              setIsDailyLimitEnabled(false);
              setWasDailyLimitToggledOn(false);
            }
            if (wasModalOpenedFromInput) {
              setDailyLimitValue(previousDailyLimitValue);
              setWasModalOpenedFromInput(false);
            }
          }}
          onSave={(amount) => {
            const newBudget = campaignBudget + amount;
            setCampaignBudget(prev => prev + amount);
            setIsBudgetRefillModalOpen(false);
            if (onUpdateData) {
              onUpdateData({ remainingBudget: newBudget });
            }
            if (wasDailyLimitToggledOn) {
              setIsDailyLimitEnabled(true);
              setWasDailyLimitToggledOn(false);
            }
            if (wasModalOpenedFromInput && pendingDailyLimitToSave) {
              const parsed = parseDisplayValue(pendingDailyLimitToSave);
              if (parsed <= newBudget) {
                setSavedDailyLimit(pendingDailyLimitToSave);
                setDailyLimitValue(pendingDailyLimitToSave);
                setToastMessage(`Новый дневной лимит установлен.\nРаспределяем ${formatForDisplay(parsed)}₽ в течении суток равномерно`);
                setShowToast(true);
                if (onUpdateData) {
                  onUpdateData({ dailyLimit: parsed, scheduledDailyLimit: null, remainingBudget: newBudget });
                }
              }
              setPendingDailyLimitToSave(null);
              setWasModalOpenedFromInput(false);
            } else if (wasModalOpenedFromInput) {
              setWasModalOpenedFromInput(false);
            }
            if (!pendingDailyLimitToSave) {
              setToastMessage('Бюджет пополнен');
              setShowToast(true);
            }
          }}
          dailyLimit={parseDisplayValue(dailyLimitValue)}
          currentBudget={campaignBudget}
          showDailyLimitInfo={wasDailyLimitToggledOn || wasModalOpenedFromInput}
        />
      )}

      {/* Disable Limit Confirmation Modal */}
      {isDisableLimitModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setIsDisableLimitModalOpen(false)}>
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-900">Отключить дневной лимит?</h3>
              <button onClick={() => setIsDisableLimitModalOpen(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Вы уверены, что хотите отключить дневной лимит? После отключения расход бюджета не будет ограничен дневным лимитом.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDisableLimitModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  // Отключаем дневной лимит и закрываем модалку
                  setIsDailyLimitEnabled(false);
                  setWasDailyLimitToggledOn(false);
                  setPendingDailyLimit(null);
                  setDailyLimitValue('');
                  setSavedDailyLimit('');
                  setIsDisableLimitModalOpen(false);
                  setToastMessage('Дневной лимит отключен');
                  setShowToast(true);
                  if (onUpdateData) {
                    onUpdateData({ dailyLimit: null, scheduledDailyLimit: null });
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                Отключить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <Toast 
        show={showToast} 
        message={toastMessage} 
        onClose={() => { setShowToast(false); setToastIsError(false); }} 
        isSuccess={!toastIsError && (toastMessage.includes('Новый дневной лимит установлен') || toastMessage.includes('Дневной лимит отключен'))}
        isError={toastIsError}
        durationMs={toastIsError ? 2000 : 3000}
      />
    </div>
  );
};

// Auto Refill Modal Component
const AutoRefillModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}> = ({ isOpen, onClose, onSave }) => {
  const [threshold, setThreshold] = useState('1000');
  const [amount, setAmount] = useState('3000');
  const [usePromoBonuses, setUsePromoBonuses] = useState(true);
  const [showPackages, setShowPackages] = useState(true);

  const ModalToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) => (
    <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none cursor-pointer ${checked ? 'bg-purple-500' : 'bg-gray-300'}`}>
      <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
  
  const handleNumericInput = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseDisplayValue(e.target.value);
    if (!isNaN(parsed)) {
      setter(String(parsed));
    } else if (e.target.value === '') {
      setter('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Автопополнение бюджета кампании</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="bg-gray-50/70 p-6 rounded-xl border border-gray-100">
            <h3 className="text-lg font-bold mb-4">Условия пополнения</h3>
            <div className="space-y-4 max-w-lg">
              <div className="grid grid-cols-2 items-center gap-4">
                <label htmlFor="threshold" className="text-gray-600">Если бюджет меньше</label>
                <div className="relative">
                  <input id="threshold" type="text" value={formatForDisplay(threshold)} onChange={handleNumericInput(setThreshold)} className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 w-full pr-6" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">₽</span>
                </div>
              </div>
              <div className="grid grid-cols-2 items-center gap-4">
                <label htmlFor="amount" className="text-gray-600">Пополнять на</label>
                 <div className="relative">
                  <input id="amount" type="text" value={formatForDisplay(amount)} onChange={handleNumericInput(setAmount)} className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 w-full pr-6" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">₽</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">Источники списания <span className="tooltip"><HelpCircle className="w-4 h-4 text-gray-400" /><span className="tooltip-text">Деньги будут списываться с Единого счёта</span></span></h3>
                 <button className="flex items-center gap-2 text-sm text-blue-600 font-medium hover:underline">
                    <RefreshCw className="w-4 h-4" />
                    <span>Обновить счета</span>
                 </button>
             </div>
             <div className="space-y-3">
                <div className="flex items-center py-2">
                    <SingleAccountIcon className="w-6 h-6 text-gray-500 mr-4"/>
                    <p className="font-medium text-gray-800">Единый счёт: {UNIFIED_BALANCE.toLocaleString('ru-RU')} ₽</p>
                </div>
                <div className="flex items-center py-2">
                    <div className="w-6 h-6 mr-4 rounded-full bg-purple-500"></div>
                    <div className="flex-grow">
                        <p className="font-medium text-gray-800">Промо-бонусы: {TOTAL_PROMO_BONUS.toLocaleString('ru-RU')} B <span className="text-gray-500 font-normal">(до 100% от суммы пополнения)</span></p>
                    </div>
                    <ModalToggleSwitch checked={usePromoBonuses} onChange={setUsePromoBonuses} />
                </div>
             </div>
             <p className="text-sm text-gray-500 mt-4 pl-10">Спишем промо-бонусы из ваших пакетов автоматически. Сначала из тех, что сгорают быстрее, затем из остальных. Сумма списания зависит от условий пакета</p>

            <div className="mt-6 pl-10">
                <button onClick={() => setShowPackages(!showPackages)} className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200">
                    <span>Мои пакеты</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showPackages ? 'rotate-180' : ''}`} />
                </button>
                {showPackages && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-300">
                        {BONUS_PACKAGES.map(pkg => (
                            <div key={pkg.id} className="bg-white p-4 rounded-xl border-2 border-gray-200 shadow-sm hover:border-purple-400 transition-all cursor-pointer">
                                <span className="text-2xl font-bold text-gray-900">{pkg.amount.toLocaleString('ru-RU')}</span>
                                <p className="text-sm text-gray-600 mt-1 mb-3">Оплата до {pkg.maxPercent}% от суммы</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{pkg.displayBurn} сгорят {pkg.expiry}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                 <p className="text-sm text-gray-500 mt-4">Новые пакеты учтём автоматически, и доступных промо-бонусов станет больше</p>
            </div>
          </div>
        </div>

        <div className="flex justify-start items-center gap-3 p-6 bg-gray-50/70 border-t border-gray-100 rounded-b-2xl">
            <button onClick={onSave} className="px-6 py-2.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg">
                Сохранить
            </button>
            <button onClick={onClose} className="px-6 py-2.5 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                Отмена
            </button>
        </div>
      </div>
    </div>
  );
};

// Budget Refill Modal Component
const BudgetRefillModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (amount: number) => void;
  dailyLimit: number;
  currentBudget: number;
  showDailyLimitInfo?: boolean;
}> = ({ isOpen, onClose, onSave, dailyLimit, currentBudget, showDailyLimitInfo = false }) => {
  const [refillAmount, setRefillAmount] = useState('3000');
  const [useBonuses, setUseBonuses] = useState(false);
  const [selectedPkgId, setSelectedPkgId] = useState(BONUS_PACKAGES[0].id);
  const [bonusValue, setBonusValue] = useState<number | string>(3000);
  const [budgetError, setBudgetError] = useState('');
  const [bonusError, setBonusError] = useState('');
  const neededAmount = dailyLimit > currentBudget ? dailyLimit - currentBudget : 0;

  useEffect(() => {
    if (isOpen) {
      setRefillAmount('3000');
      setUseBonuses(false);
      setBonusValue(3000);
      setBudgetError('');
      setBonusError('');
    }
  }, [isOpen]);

  const selectedPkg = useMemo(() => BONUS_PACKAGES.find(p => p.id === selectedPkgId) || BONUS_PACKAGES[0], [selectedPkgId]);
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
        setBonusError(`Можно списать максимум ${formatForDisplay(Math.floor(maxBonusAllowedByPercent))} B (${selectedPkg.maxPercent}% от суммы)`);
        return;
      }
    }
  }, [refillAmount, useBonuses, bonusValue, selectedPkg, currentBudgetValue, numericBonusValue]);

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseDisplayValue(e.target.value);
    if (!isNaN(parsed)) {
      setRefillAmount(String(parsed));
    } else if (e.target.value === '') {
      setRefillAmount('');
    }
  };

  const handleBudgetBlur = () => {
    const parsed = parseDisplayValue(refillAmount);
    if (isNaN(parsed) || parsed < 1000) {
      setRefillAmount('1000');
    }
  };

  const handleBonusBlur = () => {
    const numericValue = parseDisplayValue(String(bonusValue));
    if (isNaN(numericValue) || numericValue < 0) {
      setBonusValue(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-xl p-6 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-gray-900">Пополнение бюджета</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="mb-6 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
          <div className="space-y-6">
            {showDailyLimitInfo && dailyLimit > currentBudget && neededAmount > 0 && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                <p className="text-sm text-gray-900 font-medium">
                  Чтобы задать дневной лимит {formatForDisplay(dailyLimit)} ₽, пополните бюджет еще на {formatForDisplay(neededAmount)} ₽
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Сумма пополнения</label>
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  className={`w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 pr-8 ${budgetError ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="3000"
                  value={formatForDisplay(refillAmount)}
                  onChange={handleBudgetChange}
                  onBlur={handleBudgetBlur}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">₽</span>
              </div>
              {budgetError && <p className="text-red-500 text-xs mt-1.5">{budgetError}</p>}
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-4">
              <Checkbox
                id="bonus-toggle"
                checked={useBonuses}
                onChange={e => setUseBonuses(e.target.checked)}
                className="w-5 h-5 text-purple-600 cursor-pointer"
              />
              <label htmlFor="bonus-toggle" className="text-sm font-semibold text-gray-900 cursor-pointer">
                Списать промо-бонусы <span className="text-gray-400 font-normal ml-1">({formatForDisplay(TOTAL_PROMO_BONUS)} B)</span>
              </label>
            </div>

              {useBonuses && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                    {BONUS_PACKAGES.map(pkg => (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPkgId(pkg.id)}
                        className={`min-w-[200px] p-4 rounded-xl border-2 transition-all cursor-pointer snap-start relative ${selectedPkgId === pkg.id ? 'border-purple-600 bg-purple-50/30' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xl font-bold text-gray-900">{formatForDisplay(pkg.amount)}</span>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPkgId === pkg.id ? 'border-purple-600' : 'border-gray-300'}`}>
                            {selectedPkgId === pkg.id && <div className="w-2.5 h-2.5 bg-purple-600 rounded-full"></div>}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mb-3 font-medium leading-tight">Оплата до {pkg.maxPercent}% от суммы</p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-auto pt-1">
                          <span className="text-orange-500">🔥</span>
                          <span>{pkg.displayBurn} сгорят {pkg.expiry}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-col md:flex-row md:items-center gap-6">
                    <div className="relative w-full md:w-48">
                      <input
                        type="text"
                        value={formatForDisplay(bonusValue)}
                        onChange={e => setBonusValue(e.target.value)}
                        onBlur={handleBonusBlur}
                        className={`w-full border rounded-xl px-4 py-3 text-lg font-bold outline-none focus:ring-2 focus:ring-purple-500 ${bonusError ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      <p className="text-xs text-gray-500 mt-1.5">до {formatForDisplay(numericBonusValue)} B (1B = 1P)</p>
                    </div>
                    <div className="text-sm text-gray-500 leading-snug">
                      {bonusError ? (
                        <p className="text-red-500">{bonusError}</p>
                      ) : (
                        <p>Списать можно максимум {selectedPkg.maxPercent}% от суммы пополнения</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Отмена</button>
          <button
            onClick={() => {
              const amount = parseDisplayValue(refillAmount);
              onSave(amount);
            }}
            disabled={!!budgetError || !!bonusError}
            className="px-4 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Пополнить
          </button>
        </div>
      </div>
    </div>
  );
};

