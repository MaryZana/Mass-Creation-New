import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Checkbox } from 'antd';
import type { CampaignRecord } from '../types';
import { DAILY_LIMIT_ABSOLUTE_MIN } from '../utils/cpcDailyLimitBid';
import {
  AdvancedDailyLimitModal,
  createDefaultAdvancedDailyLimitSettings,
  type AdvancedDailyLimitSettings,
} from './CpcCampaignPage';
import { ChevronRight, Clock, RefreshCw, Settings, X } from './Icons';

type BonusPackage = {
  id: string;
  amount: number;
  maxPercent: number;
  expiry: string;
  displayBurn: string;
};

const BONUS_PACKAGES: BonusPackage[] = [
  { id: 'p1', amount: 209527397, maxPercent: 100, expiry: '20.03.26', displayBurn: '209.4M' },
  { id: 'p2', amount: 17133120, maxPercent: 99, expiry: '27.03.26', displayBurn: '168.3k' },
];

function maxSpendableBonus(pkg: BonusPackage, budgetRub: number): number {
  if (!Number.isFinite(budgetRub) || budgetRub <= 0) return 0;
  const byPercent = Math.floor((budgetRub * pkg.maxPercent) / 100);
  return Math.max(0, Math.min(pkg.amount, byPercent, budgetRub));
}

function resolveBonusPackage(packageId?: string): BonusPackage {
  return BONUS_PACKAGES.find((p) => p.id === packageId) ?? BONUS_PACKAGES[0];
}

const ToggleSwitch = ({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
      disabled ? 'cursor-not-allowed bg-gray-200' : 'cursor-pointer'
    } ${checked ? (disabled ? 'bg-purple-300' : 'bg-purple-600') : 'bg-gray-300'}`}
  >
    <span
      aria-hidden
      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-4' : 'translate-x-0'
      }`}
    />
  </button>
);

const BarChartIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M4 20V10" />
    <path d="M10 20V4" />
    <path d="M16 20v-7" />
    <path d="M22 20V8" />
  </svg>
);

function formatRub(value: number): string {
  return value.toLocaleString('ru-RU');
}

function parseRubInput(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, '').replace('₽', '').replace(',', '.');
  if (cleaned === '') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

const inputClass =
  'w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm font-medium text-gray-900 shadow-sm outline-none transition-colors focus:border-purple-500 focus:ring-1 focus:ring-purple-500';

const valueInputClass =
  'w-[146px] shrink-0 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm font-medium text-gray-900 shadow-sm outline-none transition-colors focus:border-purple-500 focus:ring-1 focus:ring-purple-500';

function BonusConfigModal({
  isOpen,
  campaign,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  campaign: CampaignRecord | null;
  onClose: () => void;
  onSave: (patch: { bonusPackageId: string; bonusAmount: number; usePromoBonuses: true }) => void;
}) {
  const [selectedPkgId, setSelectedPkgId] = useState(BONUS_PACKAGES[0].id);
  const [bonusValue, setBonusValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !campaign) return;
    const pkg = resolveBonusPackage(campaign.bonusPackageId);
    setSelectedPkgId(pkg.id);
    const current =
      campaign.bonusAmount != null && campaign.bonusAmount > 0
        ? campaign.bonusAmount
        : maxSpendableBonus(pkg, campaign.budget);
    setBonusValue(String(current));
    setError('');
  }, [isOpen, campaign]);

  const selectedPkg = useMemo(() => resolveBonusPackage(selectedPkgId), [selectedPkgId]);
  const budget = campaign?.budget ?? 0;
  const parsed = parseRubInput(bonusValue) ?? 0;
  const maxAllowed = maxSpendableBonus(selectedPkg, budget);

  if (!isOpen || !campaign) return null;

  const handleSave = () => {
    if (parsed <= 0) {
      setError('Укажите сумму бонусов');
      return;
    }
    if (parsed > maxAllowed) {
      setError(
        `Максимум ${formatRub(maxAllowed)} B (до ${selectedPkg.maxPercent}% от бюджета и остаток пакета)`,
      );
      return;
    }
    onSave({
      bonusPackageId: selectedPkg.id,
      bonusAmount: parsed,
      usePromoBonuses: true,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Промо-бонусы</h3>
            <p className="mt-1 line-clamp-1 text-sm text-gray-500">{campaign.productName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-3 text-sm text-gray-600">
          Бюджет кампании {formatRub(budget)} ₽ · выберите пакет и сумму списания
        </p>

        <div className="mb-5 flex gap-3 overflow-x-auto pb-1">
          {BONUS_PACKAGES.map((pkg) => {
            const selected = pkg.id === selectedPkgId;
            return (
              <button
                key={pkg.id}
                type="button"
                onClick={() => {
                  setSelectedPkgId(pkg.id);
                  const nextMax = maxSpendableBonus(pkg, budget);
                  setBonusValue(String(Math.min(parsed || nextMax, nextMax)));
                  setError('');
                }}
                className={`min-w-[200px] rounded-xl border-2 p-4 text-left transition-all ${
                  selected
                    ? 'border-purple-600 bg-purple-50/40'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  <span className="text-xl font-bold tabular-nums text-gray-900">
                    {formatRub(pkg.amount)}
                  </span>
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      selected ? 'border-purple-600' : 'border-gray-300'
                    }`}
                  >
                    {selected ? <span className="h-2.5 w-2.5 rounded-full bg-purple-600" /> : null}
                  </span>
                </div>
                <p className="mb-3 text-xs font-medium leading-tight text-gray-500">
                  Оплата до {pkg.maxPercent}% от суммы
                </p>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {pkg.displayBurn} сгорят {pkg.expiry}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Сумма списания</label>
          <div className="relative max-w-[220px]">
            <input
              type="text"
              value={bonusValue ? formatRub(parsed) : ''}
              onChange={(e) => {
                const next = parseRubInput(e.target.value);
                setBonusValue(next == null ? '' : String(next));
                setError('');
              }}
              className={`w-full rounded-xl border px-3 py-2.5 pr-10 text-sm font-bold outline-none focus:ring-1 focus:ring-purple-500 ${
                error ? 'border-red-400' : 'border-gray-200 focus:border-purple-500'
              }`}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
              B
            </span>
          </div>
          {error ? (
            <p className="mt-1.5 text-xs text-red-500">{error}</p>
          ) : (
            <p className="mt-1.5 text-xs text-gray-400">
              Максимум {formatRub(maxAllowed)} B · 1 B = 1 ₽
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

export type MassCreationIslandProps = {
  title: string;
  zonesPill: string;
  /** CPC: бюджет + дневной лимит. CPM: только бюджет. */
  showDailyLimit?: boolean;
  /** zones = Поиск + Рекомендации; unified = одна ставка */
  bidMode?: 'zones' | 'unified';
  defaultZoneBid?: number;
  defaultRecsBid?: number;
  campaigns: CampaignRecord[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (ids: string[], checked: boolean) => void;
  onUpdate: (id: string, patch: Partial<CampaignRecord>) => void;
  onOpenAutoRefill: (row: CampaignRecord) => void;
  unifiedAccountTotal: number;
  promoBonusesTotal: number;
};

export function MassCreationIsland({
  title,
  zonesPill,
  showDailyLimit = false,
  bidMode = 'zones',
  defaultZoneBid = 30,
  defaultRecsBid = 200,
  campaigns,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onUpdate,
  onOpenAutoRefill,
  unifiedAccountTotal,
  promoBonusesTotal,
}: MassCreationIslandProps) {
  const [dailyLimitCampaign, setDailyLimitCampaign] = useState<CampaignRecord | null>(null);
  const [bonusCampaign, setBonusCampaign] = useState<CampaignRecord | null>(null);
  const [isDailyLimitEnabled, setIsDailyLimitEnabled] = useState(false);
  const [dailyLimitValue, setDailyLimitValue] = useState('');
  const [savedDailyLimit, setSavedDailyLimit] = useState('');
  const [isCarryoverEnabled, setIsCarryoverEnabled] = useState(false);
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedDailyLimitSettings>(() =>
    createDefaultAdvancedDailyLimitSettings(),
  );
  const [autoRefillOnRulesTrigger, setAutoRefillOnRulesTrigger] = useState(true);

  useEffect(() => {
    if (!dailyLimitCampaign) return;
    const limit = dailyLimitCampaign.dailyLimit;
    const limitStr = limit != null && limit > 0 ? String(limit) : '';
    setIsDailyLimitEnabled(limit != null && limit > 0);
    setDailyLimitValue(limitStr);
    setSavedDailyLimit(limitStr);
    setAdvancedSettings(createDefaultAdvancedDailyLimitSettings());
    setIsCarryoverEnabled(false);
    setAutoRefillOnRulesTrigger(true);
  }, [dailyLimitCampaign]);

  const maxBidForLimit = Math.max(
    dailyLimitCampaign?.bid ?? 0,
    dailyLimitCampaign?.searchBid ?? 0,
    dailyLimitCampaign?.recommendationsBid ?? 0,
    DAILY_LIMIT_ABSOLUTE_MIN,
  );

  const enableDailyLimit = useCallback(() => {
    const next = String(Math.max(DAILY_LIMIT_ABSOLUTE_MIN, maxBidForLimit));
    setDailyLimitValue(next);
    setSavedDailyLimit(next);
    setIsDailyLimitEnabled(true);
  }, [maxBidForLimit]);

  const disableDailyLimit = useCallback(() => {
    setIsDailyLimitEnabled(false);
    setDailyLimitValue('');
    setSavedDailyLimit('');
  }, []);

  const handleDailyLimitCommit = useCallback(
    (parsed: number) => {
      if (!dailyLimitCampaign || Number.isNaN(parsed)) return;
      setDailyLimitValue(String(parsed));
      setSavedDailyLimit(String(parsed));
      setIsDailyLimitEnabled(true);
      onUpdate(dailyLimitCampaign.id, { dailyLimit: parsed });
    },
    [dailyLimitCampaign, onUpdate],
  );

  const pageIds = campaigns.map((c) => c.id);
  const selectedOnPage = pageIds.filter((id) => selectedIds.includes(id)).length;
  const allSelected = selectedOnPage === pageIds.length && pageIds.length > 0;
  const indeterminate = !allSelected && selectedOnPage > 0;
  const countLabel = `${campaigns.length} ${
    campaigns.length === 1
      ? 'кампания'
      : campaigns.length >= 2 && campaigns.length <= 4
        ? 'кампании'
        : 'кампаний'
  }`;
  const isZones = bidMode === 'zones';

  return (
    <section className="space-y-4 rounded-2xl bg-white px-6 pb-6 pt-5 shadow-sm animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h2>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-medium text-gray-600">
            {countLabel}
          </span>
          <span className="inline-flex items-center rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-medium text-gray-600">
            {zonesPill}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1240px] table-fixed text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-[13px] font-semibold text-gray-700">
              <th className={`${isZones ? 'w-[20%]' : 'w-[22%]'} px-2 py-3 font-semibold`}>
                <div className="flex items-center gap-2.5">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={indeterminate}
                    onChange={(e) => onToggleSelectAll(pageIds, e.target.checked)}
                    className="h-4 w-4 text-purple-600"
                  />
                  <span>Товар</span>
                </div>
              </th>
              <th className={`${isZones ? 'w-[18%]' : 'w-[22%]'} px-2 py-3 font-semibold`}>
                Название кампании
              </th>
              <th className="w-[9%] px-2 py-3 text-right font-semibold">Автопополнение</th>
              <th className="w-[12%] px-2 py-3 text-right font-semibold">Тратить бонусы</th>
              <th className="w-[13%] px-2 py-3 font-semibold">
                <span className="block w-[146px] text-right">
                  {showDailyLimit ? 'Бюджет и лимит' : 'Бюджет'}
                </span>
              </th>
              {isZones ? (
                <>
                  <th className="w-[14%] px-2 py-3 font-semibold">Поиск</th>
                  <th className="w-[14%] px-2 py-3 font-semibold">Рекомендации</th>
                </>
              ) : (
                <th className="w-[22%] px-2 py-3 font-semibold">Ставка</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {campaigns.map((row) => {
              const searchOn = row.searchBid != null;
              const recsOn = row.recommendationsBid != null;
              return (
                <tr key={row.id} className="align-top">
                  <td className="px-2 py-3.5">
                    <div className="flex items-start gap-2.5">
                      <Checkbox
                        checked={selectedIds.includes(row.id)}
                        onChange={() => onToggleSelect(row.id)}
                        className="mt-1 h-4 w-4 text-purple-600"
                      />
                      <img
                        src={row.imageUrl}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-lg object-cover bg-gray-100"
                      />
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-semibold leading-snug text-gray-900">
                          {row.productName}
                        </div>
                        <div className="mt-0.5 text-xs text-gray-400">
                          Артикул: {row.nmId}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-2 py-3.5">
                    <input
                      type="text"
                      value={row.campaignName}
                      onChange={(e) => onUpdate(row.id, { campaignName: e.target.value })}
                      className={inputClass}
                    />
                  </td>

                  <td className="px-2 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <ToggleSwitch
                        checked={row.autoReplenishment}
                        onChange={(checked) =>
                          onUpdate(row.id, { autoReplenishment: checked })
                        }
                      />
                      <button
                        type="button"
                        onClick={() => onOpenAutoRefill(row)}
                        className="text-gray-400 transition-colors hover:text-purple-600"
                        aria-label="Настройки автопополнения"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                    </div>
                  </td>

                  <td className="px-2 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <div className="flex h-8 min-w-[108px] items-center justify-end">
                        {row.usePromoBonuses ? (
                          <button
                            type="button"
                            onClick={() => setBonusCampaign(row)}
                            className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-sm font-medium tabular-nums text-gray-900 transition-colors hover:bg-gray-50"
                          >
                            <span>
                              {formatRub(
                                row.bonusAmount != null && row.bonusAmount > 0
                                  ? row.bonusAmount
                                  : maxSpendableBonus(
                                      resolveBonusPackage(row.bonusPackageId),
                                      row.budget,
                                    ),
                              )}{' '}
                              B
                            </span>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </button>
                        ) : null}
                      </div>
                      <ToggleSwitch
                        checked={row.usePromoBonuses}
                        onChange={(checked) => {
                          if (!checked) {
                            onUpdate(row.id, {
                              usePromoBonuses: false,
                              bonusAmount: 0,
                            });
                            return;
                          }
                          const pkg = resolveBonusPackage(row.bonusPackageId);
                          const amount =
                            row.bonusAmount != null && row.bonusAmount > 0
                              ? row.bonusAmount
                              : maxSpendableBonus(pkg, row.budget);
                          onUpdate(row.id, {
                            usePromoBonuses: true,
                            bonusPackageId: pkg.id,
                            bonusAmount: amount,
                          });
                        }}
                      />
                    </div>
                  </td>

                  <td className="px-2 py-3.5">
                    <div className="relative w-[146px]">
                      <input
                        type="text"
                        value={`${formatRub(row.budget)} ₽`}
                        onChange={(e) => {
                          const parsed = parseRubInput(e.target.value);
                          if (parsed != null) onUpdate(row.id, { budget: parsed });
                        }}
                        onBlur={() => {
                          if (row.budget < 1000) onUpdate(row.id, { budget: 1000 });
                        }}
                        className={valueInputClass}
                      />
                    </div>
                    {showDailyLimit ? (
                      row.dailyLimit != null && row.dailyLimit > 0 ? (
                        <button
                          type="button"
                          className="mt-1.5 flex w-[146px] items-center justify-end gap-1 text-xs font-medium text-[#3B82F6] hover:underline"
                          onClick={() => setDailyLimitCampaign(row)}
                        >
                          <RefreshCw className="h-3 w-3" aria-hidden />
                          в день {formatRub(row.dailyLimit)} ₽
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="mt-1.5 block w-[146px] text-right text-xs font-medium text-[#3B82F6] hover:underline"
                          onClick={() => setDailyLimitCampaign(row)}
                        >
                          Настроить лимит
                        </button>
                      )
                    ) : null}
                  </td>

                  {isZones ? (
                    <>
                      <td className="px-2 py-3.5">
                        <div className="flex items-center gap-2">
                          <ToggleSwitch
                            checked={searchOn}
                            onChange={(checked) =>
                              onUpdate(row.id, {
                                searchBid: checked
                                  ? row.searchBid ?? defaultZoneBid
                                  : undefined,
                              })
                            }
                          />
                          <div className="relative w-[146px] shrink-0">
                            <input
                              type="text"
                              disabled={!searchOn}
                              value={
                                searchOn && row.searchBid != null
                                  ? `${formatRub(row.searchBid)} ₽`
                                  : ''
                              }
                              onChange={(e) => {
                                const parsed = parseRubInput(e.target.value);
                                if (parsed != null) onUpdate(row.id, { searchBid: parsed });
                              }}
                              className={`${valueInputClass} pr-8 ${
                                !searchOn
                                  ? 'cursor-not-allowed bg-gray-50 text-gray-400'
                                  : ''
                              }`}
                            />
                            <BarChartIcon className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                          </div>
                        </div>
                      </td>

                      <td className="px-2 py-3.5">
                        <div className="flex items-center gap-2">
                          <ToggleSwitch
                            checked={recsOn}
                            onChange={(checked) =>
                              onUpdate(row.id, {
                                recommendationsBid: checked
                                  ? row.recommendationsBid ?? defaultRecsBid
                                  : undefined,
                              })
                            }
                          />
                          <input
                            type="text"
                            disabled={!recsOn}
                            value={
                              recsOn && row.recommendationsBid != null
                                ? `${formatRub(row.recommendationsBid)} ₽`
                                : ''
                            }
                            onChange={(e) => {
                              const parsed = parseRubInput(e.target.value);
                              if (parsed != null)
                                onUpdate(row.id, { recommendationsBid: parsed });
                            }}
                            className={`${valueInputClass} ${
                              !recsOn
                                ? 'cursor-not-allowed bg-gray-50 text-gray-400'
                                : ''
                            }`}
                          />
                        </div>
                      </td>
                    </>
                  ) : (
                    <td className="px-2 py-3.5">
                      <input
                        type="text"
                        value={`${formatRub(row.bid ?? defaultZoneBid)} ₽`}
                        onChange={(e) => {
                          const parsed = parseRubInput(e.target.value);
                          if (parsed != null) onUpdate(row.id, { bid: parsed });
                        }}
                        className={valueInputClass}
                      />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-end gap-10 pt-2">
        <div>
          <div className="text-sm font-medium text-gray-900">Единый счет</div>
          <div className="mt-0.5 text-xl font-bold tabular-nums text-gray-900">
            {formatRub(unifiedAccountTotal)} ₽
          </div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-400">Промобонусы</div>
          <div className="mt-0.5 text-xl font-bold tabular-nums text-gray-400">
            {formatRub(promoBonusesTotal)} ₽
          </div>
        </div>
      </div>

      {bonusCampaign ? (
        <BonusConfigModal
          isOpen
          campaign={bonusCampaign}
          onClose={() => setBonusCampaign(null)}
          onSave={(patch) => {
            onUpdate(bonusCampaign.id, patch);
          }}
        />
      ) : null}

      {dailyLimitCampaign ? (
        <AdvancedDailyLimitModal
          dailyLimitOnly
          conditionRuleBuilder
          allowLimitAboveBudget
          isOpen
          onClose={() => setDailyLimitCampaign(null)}
          isDailyLimitEnabled={isDailyLimitEnabled}
          onEnableDailyLimit={enableDailyLimit}
          onDisableDailyLimit={disableDailyLimit}
          dailyLimitValue={dailyLimitValue}
          onDailyLimitValueChange={setDailyLimitValue}
          onDailyLimitCommit={handleDailyLimitCommit}
          savedDailyLimit={savedDailyLimit}
          isCarryoverEnabled={isCarryoverEnabled}
          onCarryoverChange={setIsCarryoverEnabled}
          campaignBudget={dailyLimitCampaign.budget}
          initialSettings={advancedSettings}
          referenceCpcBidRub={maxBidForLimit}
          autoRefillOnRulesTrigger={autoRefillOnRulesTrigger}
          onAutoRefillOnRulesTriggerChange={(enabled) => {
            setAutoRefillOnRulesTrigger(enabled);
            if (enabled) {
              onUpdate(dailyLimitCampaign.id, { autoReplenishment: true });
            }
          }}
          onApply={(settings, options) => {
            setAdvancedSettings(settings);
            if (options?.reset) {
              onUpdate(dailyLimitCampaign.id, { dailyLimit: null });
              setDailyLimitCampaign(null);
              return;
            }
            const limitFromSettings =
              settings.strategyId === 'maxSpend' &&
              settings.maxSpendLimitRub != null &&
              settings.maxSpendLimitRub > 0
                ? settings.maxSpendLimitRub
                : Number.parseFloat(savedDailyLimit) ||
                  Number.parseFloat(dailyLimitValue) ||
                  null;
            onUpdate(dailyLimitCampaign.id, {
              dailyLimit:
                limitFromSettings != null && limitFromSettings > 0 ? limitFromSettings : null,
            });
            setDailyLimitCampaign(null);
          }}
        />
      ) : null}
    </section>
  );
}

/** @deprecated используйте MassCreationIsland */
export function CpcMassCreationIsland(
  props: Omit<MassCreationIslandProps, 'title' | 'zonesPill' | 'showDailyLimit'> & {
    title?: string;
    zonesPill?: string;
  },
) {
  return (
    <MassCreationIsland
      title={props.title ?? 'CPC'}
      zonesPill={props.zonesPill ?? 'Покажем в поиске и рекомендациях'}
      showDailyLimit
      bidMode="zones"
      defaultZoneBid={30}
      defaultRecsBid={200}
      {...props}
    />
  );
}
