import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, Navigate, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Checkbox } from 'antd';
import { CampaignConfig, PaymentModel, BidType, CampaignRecord, CampaignStatus } from './types';
import { 
  FileSpreadsheet, UploadCloud, Info, Download, Trash2, CheckCircle, Bell, HelpCircle, Wallet, ChevronDown, ChevronRight, X, FileIcon, Loader, Edit2, Plus, RefreshCw, DollarSign, Briefcase, Zap, Search, Wand, Settings, SingleAccountIcon, Clock, ThumbsUp, ClipboardCheck, Check, AlertTriangle, AlertCircle, ArrowUp, Calendar, Coins, Columns2, Rocket, TrendingUp, Crosshair, Lock
} from './components/Icons';
import { getMockProductsForCategory, validateUploadedFile } from './services/geminiService';
import { MultiSelect } from './components/MultiSelect';
import { ProductMultiSelect } from './components/ProductMultiSelect';
import { SuccessPage } from './components/SuccessPage';
import { GROWING_DEMAND_PRODUCTS } from './components/BonusCampaignRepeatBanner';
import { ReviewEditsModal } from './components/ReviewEditsModal';
import { ChangesHistoryModal } from './components/ChangesHistoryModal';
import {
  AdvancedDailyLimitModal,
  AutoStrategiesModal,
  CpcCampaignPage,
  createDefaultAdvancedDailyLimitSettings,
  isDynamicDailyLimitConfigured,
  type AdvancedDailyLimitSettings,
  type BidChasingModalProduct,
} from './components/CpcCampaignPage';
import {
  MassCreationIsland,
  type MassCreationAutobidderSetup,
} from './components/CpcMassCreationIsland';
import { useCpmBidRoundedAlert } from './components/CpmBidRoundedAlert';
import { CPM_BID_STEP_RUB, normalizeCpmBidRub } from './utils/cpmBidRounding';
import { DAILY_LIMIT_ABSOLUTE_MIN } from './utils/cpcDailyLimitBid';
import {
  DEFAULT_BID_CHASING_MAX_BID_RUB,
  DEFAULT_BID_CHASING_POSITION,
  formatBidChasingPositionLabel,
  type BidChasingPosition,
} from './utils/cpcBidChasingPositionTiers';
import {
  BulkSearchBidModal,
  buildBulkSearchRecommendedTiers,
  type BulkSearchBidItem,
} from './components/BulkSearchBidModal';
import {
  CPC_DEFAULT_SEARCH_BID_RUB,
  CPM_DEFAULT_COMPETITIVE_BID_RUB,
} from './components/SearchBidForecastField';
import {
  clampCampaignsToPromoPackageBalances,
  effectivePromoBonusAmount,
  packageBalanceAfterCampaigns,
  setRuntimePromoPackageAmounts,
} from './utils/promoBonus';
import { MassEditPage } from './components/MassEditPage';
import { SingleCampaignPage, MOCK_PRODUCTS as SINGLE_CAMPAIGN_CURATED_CATALOG } from './components/SingleCampaignPage';
import {
  CuratedProductPicksSection,
  type CuratedPickProduct,
} from './components/CuratedProductPicksSection';
import {
  BulkPaymentModelModal,
  type BulkPaymentModelProduct,
} from './components/BulkPaymentModelModal';
import { AppHeader } from './components/AppHeader';
import {
  buildDemoBonusPackages,
  usePromoBonusDemo,
  useSetMassCreationDemoChrome,
} from './components/PromoBonusDemoContext';
import {
  MissedBonusPromoPill,
  type BonusDistributionRow,
} from './components/PromoMissedBonusOffer';
import { BudgetRefillModal } from './components/BudgetRefillModal';
import {
  isNewSellerProfile,
  useProfile,
  type RepeatLaunchPreset,
} from './components/ProfileContext';
import { NewSellerFirstCampaignPage } from './components/newSeller/NewSellerFirstCampaignPage';
import { NEW_SELLER_CREATE_CAMPAIGN_PATH } from './components/AppHeader';
import { PRODUCT_PROMOTION_CONCEPT_PATH } from './constants/campaignListRoutes';
import { MEDIA_FINANCE_PATH } from './utils/financeRoutes';
import CampaignsPage from './pages/CampaignsPage';
import CampaignsWithWidgetsPage from './pages/CampaignsWithWidgetsPage';
import CampaignsWithWidgets2Page from './pages/CampaignsWithWidgets2Page';
import ProductPromotionConceptPage from './pages/ProductPromotionConceptPage';
import StatsPage from './pages/StatsPage';
import AudienceMetricsPage from './pages/AudienceMetricsPage';
import FinancePage from './pages/FinancePage';
import FinanceTopUpPage from './pages/FinanceTopUpPage';
import BonusesPage from './pages/BonusesPage';
import OverviewPage from './pages/OverviewPage';
import HelpPage from './pages/HelpPage';
import MediaPage from './pages/MediaPage';
import MediaCampaignCreatePage from './pages/MediaCampaignCreatePage';
import { CampaignsInsightFilterProvider } from './context/CampaignsInsightFilterContext';
import { OverviewBridgeProvider } from './context/OverviewBridgeContext';

// --- Types ---
interface TemplateGroup {
  id: string; // e.g., "CPC-Manual"
  config: Pick<CampaignConfig, 'paymentModel' | 'bidType'>;
  campaigns: CampaignRecord[];
  duplicateNmIds: Set<number>;
  correctedNmIds: Set<number>;
  currentPage: number;
  sourceFiles: Set<string>;
}

type SelectableProduct = Pick<CampaignRecord, 'nmId' | 'productName' | 'imageUrl' | 'category' | 'cpcCompatible'>;
type BulkActionType = 'bid' | 'budget' | 'funding' | 'autorefill' | 'delete' | 'autobidder' | null;

interface BonusPackage {
  id: string;
  amount: number;
  maxPercent: number;
  expiry: string;
  displayBurn: string;
}

// --- Constants ---
const CATEGORIES = ['Брюки', 'Платья', 'Футболки', 'Аксессуары', 'Обувь', 'Электроника', 'Дом', 'Кольца', 'Фоторамки', 'Спортивная одежда', 'Косметика', 'Игрушки'];
const UNIFIED_BALANCE = 105350;
const TOTAL_PROMO_BONUS = 30000;
const PAGE_SIZE = 50;
const MASTER_PASSWORD = '01020808';
const RESEARCH_PASSWORDS = {
  bonuses: '93876',
  'mass-creation': '38462',
} as const;
const AUTH_SESSION_KEY = 'mass_creation_authed_v1';
const AUTH_DESTINATION_KEY = 'mass_creation_auth_dest_v1';

type AuthDestination = 'default' | 'bonuses' | 'mass-creation';

const RESEARCH_DESTINATIONS = [
  { id: 'bonuses' as const, label: 'Промобонусы' },
  { id: 'mass-creation' as const, label: 'Массовое создание' },
];

function readAuthDestination(): AuthDestination {
  try {
    const value = sessionStorage.getItem(AUTH_DESTINATION_KEY);
    if (value === 'bonuses' || value === 'mass-creation' || value === 'default') {
      return value;
    }
  } catch {
    /* ignore */
  }
  return 'default';
}

function writeAuthDestination(destination: AuthDestination) {
  try {
    sessionStorage.setItem(AUTH_DESTINATION_KEY, destination);
  } catch {
    /* ignore */
  }
}

const SHELL_APP_PATHS = new Set([
  '/campaigns',
  '/campaigns-with-widgets',
  '/campaigns-with-widgets-2',
  '/product-promotion-concept',
  '/media',
  '/overview',
  '/stats',
  '/stats/acquisition',
  '/stats/return',
  '/stats/value',
  '/audience-metrics',
  '/finance',
  '/bonuses',
  '/help',
  NEW_SELLER_CREATE_CAMPAIGN_PATH,
]);

function isShellAppPath(pathname: string): boolean {
  return (
    SHELL_APP_PATHS.has(pathname) ||
    pathname.startsWith('/stats/') ||
    pathname.startsWith('/finance/') ||
    pathname.startsWith('/media/')
  );
}
function isNewSellerSecondaryShellPath(pathname: string): boolean {
  return pathname === '/finance' || pathname.startsWith('/finance/') || pathname.startsWith('/bonuses');
}

const BONUS_PACKAGES: BonusPackage[] = [
  { id: 'p1', amount: 15000, maxPercent: 50, expiry: '20.03.26', displayBurn: '15 000' },
  { id: 'p2', amount: 15000, maxPercent: 99, expiry: '27.03.26', displayBurn: '15 000' },
];

/** Сколько можно списать: не больше остатка пакета, бюджета и maxPercent% от суммы. */
function maxBonusForBudget(pkg: BonusPackage, budget: number, available = pkg.amount): number {
  if (!Number.isFinite(budget) || budget <= 0) return 0;
  const byPercent = Math.floor((budget * pkg.maxPercent) / 100);
  const pool = Math.max(0, Math.min(pkg.amount, available));
  return Math.max(0, Math.min(pool, byPercent, Math.floor(budget)));
}

type SuggestedBonusAllocation = {
  totalBonus: number;
  perCampaign: Map<string, { bonusAmount: number; packageId: string }>;
};

function remainingDemoPackageBalance(
  pkg: BonusPackage,
  campaigns: readonly CampaignRecord[],
): number {
  let used = 0;
  for (const campaign of campaigns) {
    if (!campaign.usePromoBonuses) continue;
    const assignedPackageId = campaign.bonusPackageId ?? 'p1';
    if (assignedPackageId !== pkg.id) continue;
    const want =
      campaign.bonusAmount != null && campaign.bonusAmount > 0
        ? Math.min(campaign.bonusAmount, maxBonusForBudget(pkg, campaign.budget))
        : maxBonusForBudget(pkg, campaign.budget);
    used += Math.min(want, Math.max(0, pkg.amount - used));
  }
  return Math.max(0, pkg.amount - used);
}

/** Автораспределение доступных промобонусов: сначала кампании с меньшим бюджетом. */
function suggestPromoBonusAllocation(
  campaigns: readonly CampaignRecord[],
  packages: readonly BonusPackage[] = BONUS_PACKAGES,
): SuggestedBonusAllocation {
  const remaining = new Map<string, number>();
  for (const pkg of packages) {
    remaining.set(pkg.id, remainingDemoPackageBalance(pkg, campaigns));
  }

  const perCampaign = new Map<string, { bonusAmount: number; packageId: string }>();
  let totalBonus = 0;
  const sorted = [...campaigns].sort((a, b) => a.budget - b.budget);

  for (const campaign of sorted) {
    let best: { packageId: string; bonusAmount: number } | null = null;
    for (const pkg of packages) {
      const available = remaining.get(pkg.id) ?? 0;
      if (available <= 0) continue;
      const bonusAmount = maxBonusForBudget(pkg, campaign.budget, available);
      if (bonusAmount <= 0) continue;
      if (!best || bonusAmount > best.bonusAmount) {
        best = { packageId: pkg.id, bonusAmount };
      }
    }
    if (!best) continue;
    perCampaign.set(campaign.id, best);
    remaining.set(best.packageId, (remaining.get(best.packageId) ?? 0) - best.bonusAmount);
    totalBonus += best.bonusAmount;
  }

  return { totalBonus, perCampaign };
}

/** Равномерно делит `target` между кампаниями, не превышая лимит списания каждой (`caps`). */
function evenBonusShares(caps: readonly number[], target: number): number[] {
  const shares = caps.map(() => 0);
  const order = caps.map((_, i) => i).sort((a, b) => caps[a] - caps[b]);
  let remaining = Math.floor(target);
  order.forEach((index, position) => {
    const share = Math.floor(remaining / (order.length - position));
    shares[index] = Math.min(caps[index], share);
    remaining -= shares[index];
  });
  for (let i = order.length - 1; i >= 0 && remaining > 0; i -= 1) {
    const index = order[i];
    const extra = Math.min(caps[index] - shares[index], remaining);
    shares[index] += extra;
    remaining -= extra;
  }
  return shares;
}

function computeLaunchAffordability(
  campaigns: readonly CampaignRecord[],
  bonusByCampaignId?: ReadonlyMap<string, number>,
) {
  let amountToDebit = 0;
  let bonusToDebit = 0;
  let affordableCount = 0;
  let runningBalance = UNIFIED_BALANCE;
  const sorted = [...campaigns].sort((a, b) => {
    const bonusA = bonusByCampaignId?.get(a.id) ?? effectivePromoBonusAmount(a);
    const bonusB = bonusByCampaignId?.get(b.id) ?? effectivePromoBonusAmount(b);
    return a.budget - bonusA - (b.budget - bonusB);
  });

  for (const campaign of sorted) {
    const bonus = bonusByCampaignId?.get(campaign.id) ?? effectivePromoBonusAmount(campaign);
    const realCost = campaign.budget - bonus;
    if (runningBalance >= realCost) {
      runningBalance -= realCost;
      amountToDebit += realCost;
      bonusToDebit += bonus;
      affordableCount++;
    }
  }

  return {
    successfulCount: affordableCount,
    readyToLaunchCount: campaigns.length - affordableCount,
    amountToDebit,
    bonusToDebit,
  };
}

// --- Helpers ---
export const getPlural = (number: number, one: string, two: string, five: string) => { let n = Math.abs(number); n %= 100; if (n >= 5 && n <= 20) { return five; } n %= 10; if (n === 1) { return one; } if (n >= 2 && n <= 4) { return two; } return five; };

function formatCtrPercent(value: number): string {
  const s = value.toFixed(1).replace('.', ',');
  return `${s}%`;
}

function ProspectGrowthCell({ ctr, change }: { ctr: number; change: number }) {
  const up = change >= 0;
  const changeLabel = `${up ? '+' : ''}${change}%`;
  return (
    <div className="tooltip relative inline-flex cursor-help flex-col items-start justify-start">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium tabular-nums text-gray-900">
          {formatCtrPercent(ctr)}
        </span>
        <span
          className={`inline-flex items-center gap-0.5 text-xs font-medium tabular-nums ${
            up ? 'text-emerald-600' : 'text-red-600'
          }`}
        >
          {up ? (
            <ArrowUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
          )}
          {changeLabel}
        </span>
      </div>
      <span
        className="tooltip-text !bottom-auto !left-0 !top-full !mt-2 !w-[17rem] !max-w-[17rem] !translate-x-0 !whitespace-normal !py-2.5 !px-3 !text-left !text-xs !font-normal !leading-snug z-[120]"
        role="tooltip"
      >
        CTR выше на {change}%, чем у конкурентов в категории.
        <br />
        Спрос растёт (125%)
      </span>
    </div>
  );
}
const formatForDisplay = (num: number | string | undefined | null): string => {
  if (num === null || num === undefined || num === '') return '';
  const numValue = typeof num === 'string' ? parseDisplayValue(num) : num;
  return numValue.toLocaleString('ru-RU', { useGrouping: true });
};
const parseDisplayValue = (str: string): number => {
  return Number(String(str).replace(/\s/g, '').replace(/,/g, '.'));
};

const getTemplateGroupLabel = (config: Pick<CampaignConfig, 'paymentModel' | 'bidType'>) => {
  const model = config.paymentModel === PaymentModel.CPM ? 'CPM' : 'CPC';
  const bid =
    config.bidType === BidType.MANUAL
      ? 'ручная ставка'
      : 'единая ставка';
  return `${model} • ${bid}`;
};

// --- Sub-Components ---

const PROSPECT_PICK_REASONS = [
  'Конверсия выше 20%',
  'Рейтинг выше 4.9',
  'Товары в акциях',
  'Товары с А/Б тестом',
  'Сезонный спрос выше 100%',
] as const;

// FirstListCpcTooltip removed per UX request.

const AuthScreen = ({
  onAuth,
}: {
  onAuth: (destination: AuthDestination) => void;
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<'team' | 'research'>('research');
  const [researchPick, setResearchPick] = useState<'bonuses' | 'mass-creation'>('bonuses');
  const [researchMenuOpen, setResearchMenuOpen] = useState(false);
  const researchMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!researchMenuOpen) return;
    const onDoc = (event: MouseEvent) => {
      if (researchMenuRef.current?.contains(event.target as Node)) return;
      setResearchMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setResearchMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [researchMenuOpen]);

  const researchLabel =
    RESEARCH_DESTINATIONS.find((item) => item.id === researchPick)?.label ??
    'Промобонусы';

  const handleLogin = (e?: React.FormEvent) => {
    e?.preventDefault();
    const expectedPassword =
      activeTab === 'research'
        ? RESEARCH_PASSWORDS[researchPick]
        : MASTER_PASSWORD;
    if (password !== expectedPassword) {
      setError(true);
      setPassword('');
      setTimeout(() => setError(false), 2000);
      return;
    }
    onAuth(activeTab === 'research' ? researchPick : 'default');
  };

  return (
    <div className="fixed inset-0 bg-[#F6F6F9] flex items-center justify-center z-[200]">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <h1 className="text-xl font-bold text-center mb-6">Вход в систему</h1>
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-gray-50 p-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('research');
              setPassword('');
              setError(false);
            }}
            className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'research'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-transparent text-gray-700 hover:bg-white'
            }`}
          >
            Исследования
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('team');
              setPassword('');
              setError(false);
              setResearchMenuOpen(false);
            }}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'team'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-transparent text-gray-700 hover:bg-white'
            }`}
          >
            <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Команда
          </button>
        </div>

        {activeTab === 'research' ? (
          <div className="relative mb-4" ref={researchMenuRef}>
            <p className="mb-1.5 text-sm font-medium text-gray-700">Раздел</p>
            <button
              type="button"
              onClick={() => setResearchMenuOpen((open) => !open)}
              aria-expanded={researchMenuOpen}
              aria-haspopup="listbox"
              className="flex w-full items-center justify-between rounded-xl border border-gray-300 bg-white px-4 py-3 text-left text-sm font-medium text-gray-900 outline-none transition-colors hover:border-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            >
              <span>{researchLabel}</span>
              <ChevronDown
                className={`h-4 w-4 text-gray-500 transition-transform ${
                  researchMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {researchMenuOpen ? (
              <ul
                role="listbox"
                className="absolute left-0 right-0 z-10 mt-1.5 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
              >
                {RESEARCH_DESTINATIONS.map((item) => {
                  const selected = item.id === researchPick;
                  return (
                    <li key={item.id} role="option" aria-selected={selected}>
                      <button
                        type="button"
                        className={`flex w-full px-4 py-2.5 text-left text-sm transition-colors ${
                          selected
                            ? 'bg-[#F6F2FF] font-medium text-gray-900'
                            : 'text-gray-800 hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          setResearchPick(item.id);
                          setPassword('');
                          setError(false);
                          setResearchMenuOpen(false);
                        }}
                      >
                        {item.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        ) : null}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Введите пароль
            </label>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full rounded-xl border px-4 py-3 text-center text-lg tracking-widest outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-purple-500 ${
                error ? 'animate-shake border-red-500' : 'border-gray-300'
              }`}
              placeholder="••••••••"
            />
            {error ? (
              <p className="mt-2 text-center text-xs text-red-500">Неверный пароль</p>
            ) : null}
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-purple-600 py-3.5 font-bold text-white shadow-lg shadow-purple-200 transition-all hover:bg-purple-700 active:scale-[0.98]"
          >
            Войти
          </button>
        </form>
      </div>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
};

const Toast = ({ show, message, onClose }: { show: boolean, message: string, onClose: () => void }) => { useEffect(() => { if (show) { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); } }, [show, onClose]); if (!show) return null; return ( <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-xl z-[100] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300"> <CheckCircle className="w-5 h-5 text-green-400" /> <span className="font-medium">{message}</span> </div> ); };

const UndoToast: React.FC<{
  campaign: CampaignRecord | null;
  onUndo: () => void;
}> = ({ campaign, onUndo }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (campaign) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [campaign]);

  if (!isVisible || !campaign) {
    return null;
  }

  return (
    <div
      key={campaign.id} 
      className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-lg shadow-xl z-[100] flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <Trash2 className="w-5 h-5 text-gray-400 shrink-0" />
      <div className="flex-grow relative overflow-hidden">
        <p className="font-medium">Кампания "{campaign.productName}" удалена.</p>
        <div className="absolute bottom-[-8px] left-0 right-0 h-1 bg-gray-700">
            <div className="h-1 bg-purple-500 animate-shrink-width"></div>
        </div>
      </div>
      <button onClick={onUndo} className="font-bold text-purple-400 hover:text-purple-300 ml-4 shrink-0">
        Отменить
      </button>
      <style>{`
        @keyframes shrink-width {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-shrink-width {
          animation: shrink-width 5s linear forwards;
        }
      `}</style>
    </div>
  );
};

const ToggleSwitch = ({ id, checked, onChange, disabled = false }: { id?: string; checked: boolean; onChange: (checked: boolean) => void, disabled?: boolean }) => ( <button id={id} role="switch" aria-checked={checked} onClick={() => !disabled && onChange(!checked)} disabled={disabled} className={`relative inline-flex h-4 w-7 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${ disabled ? 'cursor-not-allowed bg-gray-200' : 'cursor-pointer' } ${ checked ? (disabled ? 'bg-purple-300' : 'bg-purple-600') : 'bg-gray-300' }`} > <span aria-hidden="true" className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${ checked ? 'translate-x-3' : 'translate-x-0' }`} /> </button> );

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = 'Удалить',
  confirmColor = 'red',
  secondaryConfirmText,
  onSecondaryConfirm,
  cancelText = "Отмена"
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  confirmColor?: 'red' | 'purple';
  secondaryConfirmText?: string;
  onSecondaryConfirm?: () => void;
  cancelText?: string;
}) => {
    if (!isOpen) return null;

    const colorClasses = {
        red: 'bg-red-600 hover:bg-red-700',
        purple: 'bg-purple-600 hover:bg-purple-700',
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg text-gray-900">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100"><X className="w-5 h-5" /></button>
                </div>
                <div className="text-sm text-gray-600 mb-6">
                    {children}
                </div>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                        {cancelText}
                    </button>
                     {onSecondaryConfirm && secondaryConfirmText && (
                        <button onClick={onSecondaryConfirm} className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors ${colorClasses.purple}`}>
                           {secondaryConfirmText}
                        </button>
                    )}
                    <button onClick={onConfirm} className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors ${colorClasses[confirmColor]}`}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AddItemModal = ({ isOpen, onClose, onSubmit, onTemplateDownload, initialConfig, showToast, setToastMessage }: { isOpen: boolean, onClose: () => void, onSubmit: (config: Pick<CampaignConfig, 'paymentModel' | 'bidType'>, items: CampaignRecord[]) => void, onTemplateDownload: (config: CampaignConfig) => void, initialConfig: CampaignConfig, showToast: (show: boolean) => void, setToastMessage: (message: string) => void }) => {
    const [tempConfig, setTempConfig] = useState(initialConfig);
    const [selectedProducts, setSelectedProducts] = useState<SelectableProduct[]>([]);
    const excelFileInputRef = useRef<HTMLInputElement>(null);
    const [uploadedFiles, setUploadedFiles] = useState<{ id: string; fileName: string; loaded: number; total: number }[]>([]);
    const [isProcessingExcel, setIsProcessingExcel] = useState(false);
    const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'select' | 'upload'>('select');
    const [isDragOver, setIsDragOver] = useState(false);
    const [manualZones, setManualZones] = useState<{ search: boolean; recommendations: boolean }>({
        search: true,
        recommendations: true,
    });

    useEffect(() => {
        if (isOpen) {
            setTempConfig(initialConfig);
            setSelectedProducts([]);
            setUploadedFiles([]);
            setIsProcessingExcel(false);
            setActiveTab('select');
            setIsDragOver(false);
            setManualZones({ search: true, recommendations: true });
        }
    }, [isOpen, initialConfig]);

    const mockProducts = useMemo(() => {
        if (tempConfig.categories.length === 0) {
            return getMockProductsForCategory('Все товары');
        }
        return tempConfig.categories.flatMap(category => getMockProductsForCategory(category));
    }, [tempConfig.categories]);

    const validSelectedProducts = useMemo(() => {
        return selectedProducts.filter(p => tempConfig.paymentModel === PaymentModel.CPC ? p.cpcCompatible : true);
    }, [selectedProducts, tempConfig.paymentModel]);

    const cpcIncompatibleInSelection = useMemo(() => {
        if (tempConfig.paymentModel !== PaymentModel.CPC) return [];
        return selectedProducts.filter(p => !p.cpcCompatible);
    }, [selectedProducts, tempConfig.paymentModel]);

    const handleDownloadTemplateFile = (fileType: 'xlsx' | 'csv') => {
        const content = "nmId\n12345678\n87654321\n11223344";
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `upload_template.${fileType}`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        setToastMessage(`Шаблон ${fileType.toUpperCase()} скачан`);
        showToast(true);
    };

    const processExcelFiles = (files: File[]) => {
        if (files.length === 0) return;

        setIsProcessingExcel(true);
        setTempConfig(p => ({ ...p, categories: p.categories.length ? p.categories : ['Одежда'] }));

        setTimeout(() => {
            const allPossibleProducts = getMockProductsForCategory('Одежда');

            const newEntries: { id: string; fileName: string; loaded: number; total: number; products: SelectableProduct[] }[] = [];

            files.forEach((file) => {
                const totalInFile = Math.floor(Math.random() * 10) + 20;
                const foundCount = Math.floor(totalInFile * (Math.random() * 0.2 + 0.8));

                const foundProducts = allPossibleProducts.slice(0, foundCount);

                newEntries.push({
                    id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    fileName: file.name,
                    loaded: foundCount,
                    total: totalInFile,
                    products: foundProducts,
                });
            });

            setUploadedFiles(prev => [
                ...prev,
                ...newEntries.map(({ id, fileName, loaded, total }) => ({ id, fileName, loaded, total })),
            ]);

            const allNewProducts = newEntries.flatMap(e => e.products);
            setSelectedProducts(prev => {
                const existingIds = new Set(prev.map(p => p.nmId));
                const merged = [...prev];
                for (const p of allNewProducts) {
                    if (!existingIds.has(p.nmId)) {
                        merged.push(p);
                        existingIds.add(p.nmId);
                    }
                }
                return merged;
            });

            setIsProcessingExcel(false);
        }, 2500);
    };

    const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;
        const files = Array.from(event.target.files);
        processExcelFiles(files);
        if (excelFileInputRef.current) {
            excelFileInputRef.current.value = "";
        }
    };

    const handleDropExcel = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragOver(false);
        const files = Array.from(event.dataTransfer.files).filter(f =>
            f.name.toLowerCase().endsWith('.xlsx') || f.name.toLowerCase().endsWith('.csv')
        );
        if (files.length === 0) return;
        processExcelFiles(files);
    };

    const handleDeleteUpload = (fileId?: string) => {
        if (!fileId) {
            setUploadedFiles([]);
            setSelectedProducts([]);
            setTempConfig(p => ({ ...p, categories: [] }));
            setToastMessage("Загруженные файлы удалены.");
            showToast(true);
            return;
        }

        setUploadedFiles(prev => {
            const next = prev.filter(f => f.id !== fileId);
            if (next.length === 0) {
                setSelectedProducts([]);
                setTempConfig(p => ({ ...p, categories: [] }));
            }
            setToastMessage("Файл удален из списка.");
            showToast(true);
            return next;
        });
    };
    
    const handleSubmit = () => {
        const currentDate = new Date().toLocaleDateString('ru-RU');
        const excelSource = uploadedFiles.length
            ? uploadedFiles.map(f => f.fileName).join(', ')
            : 'Ручное добавление';
        const finalCampaigns = validSelectedProducts.map(p => {
            const campaignBase: Omit<CampaignRecord, 'bid' | 'searchBid' | 'recommendationsBid'> = {
                id: `${p.nmId}-${Date.now()}`,
                nmId: p.nmId,
                productName: p.productName,
                campaignName: `${p.productName} ${tempConfig.paymentModel} ${currentDate}`,
                imageUrl: p.imageUrl,
                category: p.category,
                budget: 3000,
                autoReplenishment: false,
                fundingSource: 'Единый счёт',
                status: CampaignStatus.VALID,
                usePromoBonuses: false,
                source: excelSource,
                cpcCompatible: p.cpcCompatible,
                bonusAmount: 0,
                bonusPackageId: 'p1',
            };
    
            if (tempConfig.paymentModel === PaymentModel.CPM) {
                if (tempConfig.bidType === BidType.MANUAL) {
                    // дефолт CPM — конкурентная ставка
                    const withSearch = manualZones.search
                      ? { searchBid: CPM_DEFAULT_COMPETITIVE_BID_RUB }
                      : {};
                    const withRecs = manualZones.recommendations
                      ? { recommendationsBid: CPM_DEFAULT_COMPETITIVE_BID_RUB }
                      : {};

                    // если обе зоны выключены, по умолчанию включаем поиск
                    if (!manualZones.search && !manualZones.recommendations) {
                        return {
                          ...campaignBase,
                          searchBid: CPM_DEFAULT_COMPETITIVE_BID_RUB,
                        } as CampaignRecord;
                    }

                    return { ...campaignBase, ...withSearch, ...withRecs } as CampaignRecord;
                }
                return {
                  ...campaignBase,
                  bid: CPM_DEFAULT_COMPETITIVE_BID_RUB,
                } as CampaignRecord;
            } else {
                // CPC: дефолт — ставка за 11–34
                const withSearch = manualZones.search
                  ? { searchBid: CPC_DEFAULT_SEARCH_BID_RUB }
                  : {};
                const withRecs = manualZones.recommendations
                  ? { recommendationsBid: CPC_DEFAULT_SEARCH_BID_RUB }
                  : {};
                if (!manualZones.search && !manualZones.recommendations) {
                    return {
                      ...campaignBase,
                      searchBid: CPC_DEFAULT_SEARCH_BID_RUB,
                      recommendationsBid: CPC_DEFAULT_SEARCH_BID_RUB,
                      dailyLimit: 1000,
                      autoReplenishment: true,
                    } as CampaignRecord;
                }
                return {
                  ...campaignBase,
                  ...withSearch,
                  ...withRecs,
                  dailyLimit: 1000,
                  autoReplenishment: true,
                } as CampaignRecord;
            }
        });
        onSubmit({paymentModel: tempConfig.paymentModel, bidType: tempConfig.bidType}, finalCampaigns);
        onClose();
    };

    const hasChanges = selectedProducts.length > 0 || uploadedFiles.length > 0;

    const handleCloseRequest = () => {
        if (hasChanges) {
            setIsConfirmCloseOpen(true);
        } else {
            onClose();
        }
    };

    const handleConfirmClose = () => {
        setIsConfirmCloseOpen(false);
        onClose();
    };
    
    if (isConfirmCloseOpen) {
      return (
          <ConfirmationModal
              isOpen={true}
              onClose={() => setIsConfirmCloseOpen(false)}
              onConfirm={handleConfirmClose}
              title="Подтвердите закрытие"
              confirmText="Закрыть"
              confirmColor="red"
              children={<p>У вас есть несохраненные изменения. Вы уверены, что хотите закрыть окно? Все настроенные товары будут сброшены.</p>}
          />
      );
    }
    
    if (!isOpen) {
        return null;
    }

    return ( 
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={handleCloseRequest}> 
            <div
              className="relative m-auto flex w-full max-w-xl flex-col rounded-2xl bg-white shadow-xl max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-item-modal-title"
            > 
                <div className="flex shrink-0 items-start justify-between gap-4 px-6 pt-6"> 
                    <div className="min-w-0 flex-1">
                        <h2 id="add-item-modal-title" className="text-xl font-bold text-gray-900">Добавление товаров</h2>
                    </div>
                    <button
                      type="button"
                      onClick={handleCloseRequest}
                      className="shrink-0 rounded-full p-1 text-gray-400 hover:text-gray-600"
                      aria-label="Закрыть"
                    >
                      <X className="h-6 w-6" />
                    </button> 
                </div> 
                <div className="flex min-h-0 flex-grow flex-col space-y-5 overflow-y-auto px-6 pb-6 pt-4 custom-scrollbar">
                    <section className="relative z-20 shrink-0 overflow-visible">
                        <div className="inline-flex items-center space-x-1 rounded-lg bg-gray-100 p-1">
                            <button
                                type="button"
                                onClick={() => setActiveTab('select')}
                                className={`rounded-md px-5 py-1.5 text-sm font-semibold transition-colors ${activeTab === 'select' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                            >
                                Выбрать из списка
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('upload')}
                                className={`rounded-md px-5 py-1.5 text-sm font-semibold transition-colors ${activeTab === 'upload' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                            >
                                Загрузить из файла
                            </button>
                        </div>

                        {activeTab === 'upload' && (
                            <div
                              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                              onDragLeave={(e) => {
                                  if ((e.currentTarget as HTMLDivElement).contains(e.relatedTarget as Node)) return;
                                  setIsDragOver(false);
                              }}
                              onDrop={handleDropExcel}
                              className={`mt-4 ${isDragOver ? 'rounded-xl border-2 border-dashed border-purple-400 bg-purple-50/40 p-2 -m-2 transition-colors' : ''}`}
                            >
                                {/* скрытый инпут всегда доступен, чтобы кнопка \"Добавить файл\" работала при любом количестве файлов */}
                                <input
                                  type="file"
                                  ref={excelFileInputRef}
                                  className="hidden"
                                  onChange={handleExcelUpload}
                                  accept=".xlsx,.csv"
                                  multiple
                                />
                                {activeTab === 'upload' && (
                                    <p className="text-sm text-gray-500 mb-4">
                                        Загрузите Excel-файл со списком ID товаров.{' '}
                                        <button
                                            onClick={() => handleDownloadTemplateFile('xlsx')}
                                            className="text-gray-500 underline hover:text-purple-600 focus:outline-none"
                                        >
                                            Шаблон скачать
                                        </button>
                                    </p>
                                )}
                                {isProcessingExcel && (
                                    <div className="my-3 p-4 bg-gray-50 rounded-lg flex items-center gap-3 text-sm text-gray-600">
                                    <Loader className="w-4 h-4 animate-spin" />
                                    <span>Обрабатываем ваш файл...</span>
                                    </div>
                                )}

                                {!isProcessingExcel && uploadedFiles.length > 0 && (
                                    <div className="my-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                        <div className="space-y-2">
                                            {uploadedFiles.map(file => (
                                              <div key={file.id} className="flex justify-between items-center">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <FileIcon className="w-5 h-5 text-gray-400 shrink-0" />
                                                <div className="overflow-visible relative">
                                                        <p className="font-medium text-gray-800 truncate" title={file.fileName}>{file.fileName}</p>
                                                        <p className="text-xs text-gray-500">
                                                          Найдено {file.loaded} из {file.total} товаров
                                                          <span className="ml-1 inline-flex items-center gap-1 cursor-help underline decoration-dotted tooltip">
                                                            <span className="text-gray-500 hover:text-gray-700">почему?</span>
                                                            <span className="tooltip-text !max-w-xs text-left z-[200]">
                                                              <span className="font-semibold block mb-1">Почему не все товары найдены?</span>
                                                              <span className="block mb-1">
                                                                Мы не нашли часть ID из файла в демонстрационных данных. В реальном кабинете здесь будет указан список отсутствующих ID.
                                                              </span>
                                                              <span className="text-[11px] text-gray-300">
                                                                Пример: 12345678, 87654321, 11223344
                                                              </span>
                                                            </span>
                                                          </span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center shrink-0">
                                                    <button onClick={() => handleDeleteUpload(file.id)} className="ml-2 text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-100">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                              </div>
                                            ))}
                                            <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200 mt-2">
                                                <button
                                                  onClick={() => excelFileInputRef.current?.click()}
                                                  className="px-3 py-1.5 text-xs font-medium text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
                                                >
                                                  Добавить файл
                                                </button>
                                                <button
                                                  onClick={() => handleDeleteUpload()}
                                                  className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                  Очистить все
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {!isProcessingExcel && uploadedFiles.length === 0 && (
                                  <div>
                                    <button 
                                        onClick={() => excelFileInputRef.current?.click()}
                                        className="w-full justify-center text-sm font-medium text-purple-600 hover:text-purple-800 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-1.5 p-4 border-2 border-dashed border-gray-300 hover:border-purple-400 rounded-xl transition-colors"
                                    >
                                        <UploadCloud className="w-4 h-4" />
                                        <span>Перетащите файлы сюда или нажмите, чтобы выбрать Excel с ID товаров</span>
                                    </button>
                                  </div>
                                )}
                            </div>
                        )}
                        
                        {activeTab === 'select' && (
                             <div className="relative mt-4">
                                <div className="space-y-4">
                                    <div>
                                        <MultiSelect options={CATEGORIES} selected={tempConfig.categories} onChange={(c) => { setTempConfig(p => ({...p, categories: c})); setSelectedProducts([]); }} placeholder="Выберите категории" disabled={uploadedFiles.length > 0}/>
                                    </div>
                                    <div>
                                        <ProductMultiSelect
                                            options={mockProducts}
                                            selected={selectedProducts}
                                            onChange={setSelectedProducts}
                                            isCpcMode={tempConfig.paymentModel === PaymentModel.CPC}
                                            disabled={uploadedFiles.length > 0 || tempConfig.categories.length === 0 || isProcessingExcel}
                                            submitLabel="Применить товары"
                                        />
                                        {cpcIncompatibleInSelection.length > 0 && (
                                            <div className="mt-3 text-sm text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
                                                Часть товаров&nbsp;
                                                <span className="tooltip underline decoration-dotted cursor-help">
                                                    ({cpcIncompatibleInSelection.length})
                                                    <span className="tooltip-text !w-64 text-left">
                                                        <span className="font-bold block mb-1 text-white">Несовместимые ID товаров:</span>
                                                        <span className="font-normal text-gray-200 break-all">
                                                            {cpcIncompatibleInSelection.map(p => p.nmId).join(', ')}
                                                        </span>
                                                    </span>
                                                </span>
                                                &nbsp;не может продвигаться по CPC, они не будут добавлены в кампанию.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                    
                    {hasChanges && (
                        <div className="min-h-0 space-y-5 border-t border-gray-100 pt-5 animate-in fade-in duration-500">
                            <section>
                            <h3 className="mb-3 text-base font-bold text-gray-900">Модель оплаты</h3>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <button
                                  type="button"
                                  onClick={() => setTempConfig(p => ({...p, paymentModel: PaymentModel.CPC, bidType: BidType.UNIFIED}))}
                                  className={`flex items-start gap-3 rounded-2xl px-4 py-3.5 text-left transition-colors ${
                                    tempConfig.paymentModel === PaymentModel.CPC
                                      ? 'bg-[#F3E8FF] ring-0'
                                      : 'border border-gray-200 bg-white hover:bg-gray-50'
                                  }`}
                                >
                                  <span
                                    className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 ${
                                      tempConfig.paymentModel === PaymentModel.CPC ? 'border-[#9A41FE]' : 'border-gray-300'
                                    }`}
                                    aria-hidden
                                  >
                                    {tempConfig.paymentModel === PaymentModel.CPC ? (
                                      <span className="h-2.5 w-2.5 rounded-full bg-[#9A41FE]" />
                                    ) : null}
                                  </span>
                                  <span className="min-w-0">
                                    <span className="block text-[15px] font-semibold leading-snug text-gray-900">Оплата за клики (CPC)</span>
                                    <span className="mt-0.5 block text-sm leading-snug text-gray-500">Вы платите за 1 клик</span>
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTempConfig(p => ({...p, paymentModel: PaymentModel.CPM}))}
                                  className={`flex items-start gap-3 rounded-2xl px-4 py-3.5 text-left transition-colors ${
                                    tempConfig.paymentModel === PaymentModel.CPM
                                      ? 'bg-[#F3E8FF] ring-0'
                                      : 'border border-gray-200 bg-white hover:bg-gray-50'
                                  }`}
                                >
                                  <span
                                    className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 ${
                                      tempConfig.paymentModel === PaymentModel.CPM ? 'border-[#9A41FE]' : 'border-gray-300'
                                    }`}
                                    aria-hidden
                                  >
                                    {tempConfig.paymentModel === PaymentModel.CPM ? (
                                      <span className="h-2.5 w-2.5 rounded-full bg-[#9A41FE]" />
                                    ) : null}
                                  </span>
                                  <span className="min-w-0">
                                    <span className="block text-[15px] font-semibold leading-snug text-gray-900">Оплата за показы (CPM)</span>
                                    <span className="mt-0.5 block text-sm leading-snug text-gray-500">Вы платите за 1 000 показов</span>
                                  </span>
                                </button>
                            </div>
                            </section>
                            {tempConfig.paymentModel === PaymentModel.CPM && (
                            <section>
                            <h3 className="mb-3 text-base font-bold text-gray-900">Зоны показа</h3>
                            <div className="space-y-4">
                                <label className="flex items-start gap-3 cursor-pointer" onClick={() => setTempConfig(p => ({...p, bidType: BidType.UNIFIED}))}>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${tempConfig.bidType === BidType.UNIFIED ? 'border-purple-600 bg-purple-600' : 'border-gray-300'}`}>
                                        {tempConfig.bidType === BidType.UNIFIED && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">Единая ставка: продвижение сразу в поиске и рекомендациях</span>
                                        <p className="text-sm text-gray-500 mt-1">
                                            мин. ставка <span className="font-bold text-purple-600">94–155 ₽</span> в зависимости от категории товаров
                                        </p>
                                    </div>
                                </label>
                                <label className="flex items-start gap-3 cursor-pointer" onClick={() => setTempConfig(p => ({...p, bidType: BidType.MANUAL}))}>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${tempConfig.bidType === BidType.MANUAL ? 'border-purple-600 bg-purple-600' : 'border-gray-300'}`}>
                                        {tempConfig.bidType === BidType.MANUAL && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">Ручная ставка: выбирайте зоны показов и ставку для них</span>
                                        <p className="text-sm text-gray-500 mt-1">
                                            мин. ставка <span className="font-bold text-purple-600">190–240 ₽</span> в зависимости от категории товаров
                                        </p>
                                    </div>
                                </label>
                            </div>
                            {tempConfig.bidType === BidType.MANUAL && (
                              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3">
                                  <div className="flex min-w-0 items-center gap-2">
                                    <button
                                      type="button"
                                      role="switch"
                                      aria-checked={manualZones.search}
                                      onClick={() =>
                                        setManualZones(prev => {
                                          const next = { ...prev, search: !prev.search };
                                          if (!next.search && !next.recommendations) {
                                            return { ...prev, search: true };
                                          }
                                          return next;
                                        })
                                      }
                                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${manualZones.search ? 'bg-purple-600' : 'bg-[#E5E5EA]'}`}
                                    >
                                      <span
                                        aria-hidden
                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${manualZones.search ? 'translate-x-4' : 'translate-x-0'}`}
                                      />
                                    </button>
                                    <span className="text-sm font-medium text-gray-900">Поиск</span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3">
                                  <div className="flex min-w-0 items-center gap-2">
                                    <button
                                      type="button"
                                      role="switch"
                                      aria-checked={manualZones.recommendations}
                                      onClick={() =>
                                        setManualZones(prev => {
                                          const next = { ...prev, recommendations: !prev.recommendations };
                                          if (!next.search && !next.recommendations) {
                                            return { ...prev, recommendations: true };
                                          }
                                          return next;
                                        })
                                      }
                                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${manualZones.recommendations ? 'bg-purple-600' : 'bg-[#E5E5EA]'}`}
                                    >
                                      <span
                                        aria-hidden
                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${manualZones.recommendations ? 'translate-x-4' : 'translate-x-0'}`}
                                      />
                                    </button>
                                    <span className="text-sm font-medium text-gray-900">Рекомендации</span>
                                  </div>
                                </div>
                              </div>
                            )}
                            </section>
                            )}
                            {tempConfig.paymentModel === PaymentModel.CPC && (
                            <section>
                            <h3 className="mb-3 text-base font-bold text-gray-900">Зоны показа</h3>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3">
                                  <div className="flex min-w-0 items-center gap-2">
                                    <button
                                      type="button"
                                      role="switch"
                                      aria-checked={manualZones.search}
                                      onClick={() =>
                                        setManualZones(prev => {
                                          const next = { ...prev, search: !prev.search };
                                          if (!next.search && !next.recommendations) {
                                            return { ...prev, search: true };
                                          }
                                          return next;
                                        })
                                      }
                                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${manualZones.search ? 'bg-purple-600' : 'bg-[#E5E5EA]'}`}
                                    >
                                      <span
                                        aria-hidden
                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${manualZones.search ? 'translate-x-4' : 'translate-x-0'}`}
                                      />
                                    </button>
                                    <span className="text-sm font-medium text-gray-900">Поиск</span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3">
                                  <div className="flex min-w-0 items-center gap-2">
                                    <button
                                      type="button"
                                      role="switch"
                                      aria-checked={manualZones.recommendations}
                                      onClick={() =>
                                        setManualZones(prev => {
                                          const next = { ...prev, recommendations: !prev.recommendations };
                                          if (!next.search && !next.recommendations) {
                                            return { ...prev, recommendations: true };
                                          }
                                          return next;
                                        })
                                      }
                                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${manualZones.recommendations ? 'bg-purple-600' : 'bg-[#E5E5EA]'}`}
                                    >
                                      <span
                                        aria-hidden
                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${manualZones.recommendations ? 'translate-x-4' : 'translate-x-0'}`}
                                      />
                                    </button>
                                    <span className="text-sm font-medium text-gray-900">Рекомендации</span>
                                  </div>
                                </div>
                            </div>
                            </section>
                            )}
                        </div>
                    )}
                </div> 
                <div className="flex shrink-0 items-center gap-3 border-t border-gray-100 px-6 py-4"> 
                    <button
                      type="button"
                      onClick={handleSubmit} 
                      disabled={validSelectedProducts.length === 0} 
                      className="rounded-lg bg-[#9A41FE] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#8A35EE] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                    {validSelectedProducts.length > 0 
                        ? `Добавить ${validSelectedProducts.length} ${getPlural(validSelectedProducts.length, 'товар', 'товара', 'товаров')}` 
                        : 'Добавить'
                    }
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseRequest}
                      className="rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-200"
                    >
                      Отмена
                    </button>
                </div> 
            </div> 
        </div> 
    );
};

const AutoRefillModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: { threshold: number; amount: number; usePromoBonuses: boolean }) => void;
  campaign: CampaignRecord | null;
}> = ({ isOpen, onClose, onSave, campaign }) => {
  const [threshold, setThreshold] = useState('1000');
  const [amount, setAmount] = useState('3000');
  const [usePromoBonuses, setUsePromoBonuses] = useState(true);
  const [showPackages, setShowPackages] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setThreshold(String(campaign?.autoRefillThreshold ?? 1000));
    setAmount(String(campaign?.autoRefillAmount ?? 3000));
    setUsePromoBonuses(campaign?.usePromoBonuses ?? true);
    setShowPackages(true);
  }, [isOpen, campaign]);

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
                    <p className="mb-0 font-medium text-gray-800">Единый счёт: {UNIFIED_BALANCE.toLocaleString('ru-RU')} ₽</p>
                </div>
                <div className="flex items-center py-2">
                    <ModalToggleSwitch checked={usePromoBonuses} onChange={setUsePromoBonuses} />
                    <p className="ml-4 font-medium text-gray-800">Промо-бонусы: {TOTAL_PROMO_BONUS.toLocaleString('ru-RU')} B <span className="text-gray-500 font-normal">(до 100% от суммы пополнения)</span></p>
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
                                <p className="text-xs font-medium text-gray-500 mt-1">Остаток пакета</p>
                                <p className="text-sm text-gray-600 mt-1 mb-3">Оплата до {pkg.maxPercent}% от суммы</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>сгорят {pkg.expiry}</span>
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
            <button
              onClick={() =>
                onSave({
                  threshold: parseDisplayValue(threshold) || 1000,
                  amount: parseDisplayValue(amount) || 3000,
                  usePromoBonuses,
                })
              }
              className="px-6 py-2.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg"
            >
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

const BulkEditModal = ({
    isOpen,
    onClose,
    action,
    onSave,
    categories = [],
    onOpenAutoRefill,
    selectedCampaignsCount = 0,
    prefillData,
    isSingleCampaignMode = false,
    campaignData,
    editingGroupId,
    editedCampaigns,
    allValidCampaigns,
    selectedCampaignIds,
}: {
    isOpen: boolean,
    onClose: () => void,
    action: BulkActionType,
    onSave: (val: any) => void,
    categories?: string[],
    onOpenAutoRefill: () => void,
    selectedCampaignsCount?: number,
    prefillData?: { budget: number, bonusAmount: number, useBonuses: boolean } | null,
    isSingleCampaignMode?: boolean;
    campaignData?: CampaignRecord | null;
    editingGroupId: string | null;
    editedCampaigns: CampaignRecord[];
    allValidCampaigns: CampaignRecord[];
    selectedCampaignIds: string[];
}) => {
    const [value, setValue] = useState<string>('3000');
    const [useBonuses, setUseBonuses] = useState(false);
    const [selectedPkgId, setSelectedPkgId] = useState(BONUS_PACKAGES[0].id);
    const [bonusValue, setBonusValue] = useState<number | string>(3000);
    const [budgetTab, setBudgetTab] = useState<'auto' | 'one-time'>('one-time');
    const [autoThreshold, setAutoThreshold] = useState('1000');
    const [autoAmount, setAutoAmount] = useState('3000');
    const [autoUsePromoBonuses, setAutoUsePromoBonuses] = useState(true);
    const [showAutoPackages, setShowAutoPackages] = useState(false);

    const [budgetError, setBudgetError] = useState('');
    const [bonusError, setBonusError] = useState('');
    /** Черновик сброса: освобождает бонусы выбранных кампаний до «Применить», тогл не выключает. */
    const [bonusesDraftReset, setBonusesDraftReset] = useState(false);

    const budgetForSingleMode = campaignData?.budget ?? 3000;
    const isReplenishAction = action === 'budget' || action === 'autorefill';
    const campaignCount = Math.max(1, selectedCampaignsCount || (campaignData ? 1 : 0));

    useEffect(() => {
        if (!isOpen) return;

        if (action === 'autorefill') {
            setBudgetTab('auto');
        } else if (action === 'budget') {
            setBudgetTab('one-time');
        }

        if (action === 'funding') setValue('Единый счёт');
        else if (action === 'bid' && categories.length > 1) {
            setValue(categories.reduce((acc, cat) => ({ ...acc, [cat]: '' }), {}) as any);
        } else if (isSingleCampaignMode && campaignData) {
            setValue(String(campaignData.budget));
            setUseBonuses(campaignData.usePromoBonuses);
            setBonusValue(
              Math.min(
                campaignData.bonusAmount || campaignData.budget || 0,
                maxBonusForBudget(
                  BONUS_PACKAGES.find((pkg) => pkg.id === campaignData.bonusPackageId) ?? BONUS_PACKAGES[0],
                  campaignData.budget,
                ),
              ),
            );
            setAutoAmount(String(campaignData.budget || 3000));
            setAutoUsePromoBonuses(campaignData.usePromoBonuses);
            if (campaignData.bonusPackageId) setSelectedPkgId(campaignData.bonusPackageId);
        } else if (prefillData) {
            setValue(String(prefillData.budget));
            setUseBonuses(prefillData.useBonuses);
            setBonusValue(
              Math.min(
                prefillData.bonusAmount || prefillData.budget,
                maxBonusForBudget(BONUS_PACKAGES[0], prefillData.budget),
              ),
            );
            setAutoAmount(String(prefillData.budget || 3000));
            setAutoUsePromoBonuses(prefillData.useBonuses);
        } else if (action === 'budget' || action === 'autorefill') {
            setValue('3000');
            setUseBonuses(false);
            setBonusValue(3000);
            setSelectedPkgId(BONUS_PACKAGES[0].id);
            setAutoAmount('3000');
            setAutoThreshold('1000');
            setAutoUsePromoBonuses(true);
            setShowAutoPackages(false);
        }
        if (action === 'autorefill' && campaignData) {
            setAutoThreshold(String(campaignData.autoRefillThreshold ?? 1000));
            setAutoAmount(String(campaignData.autoRefillAmount ?? 3000));
            setAutoUsePromoBonuses(campaignData.usePromoBonuses);
        }
        setBudgetError('');
        setBonusError('');
        setBonusesDraftReset(false);
        // Only re-init when the modal opens or the action changes — not on every
        // parent list/prefill identity change (that was resetting the tab).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, action]);

    const selectedPkg = useMemo(() => BONUS_PACKAGES.find(p => p.id === selectedPkgId) || BONUS_PACKAGES[0], [selectedPkgId]);

    const allocationCampaigns = editingGroupId ? editedCampaigns : allValidCampaigns;
    const bonusResetCampaignIds = useMemo(() => {
        const ids = new Set(selectedCampaignIds);
        if (campaignData?.id) ids.add(campaignData.id);
        return [...ids];
    }, [selectedCampaignIds, campaignData?.id]);
    const hasAppliedBonuses = allocationCampaigns.some(
        (campaign) =>
            bonusResetCampaignIds.includes(campaign.id) &&
            (campaign.usePromoBonuses || (campaign.bonusAmount ?? 0) > 0),
    );
    const canResetBonuses = hasAppliedBonuses && !bonusesDraftReset;
    const excludedBonusCampaignIds = useMemo(() => {
        const ids = new Set(selectedCampaignIds);
        if (campaignData?.id) ids.add(campaignData.id);
        return ids;
    }, [selectedCampaignIds, campaignData?.id]);
    const packageBalances = useMemo(() => {
        const balances = new Map<string, number>();
        for (const pkg of BONUS_PACKAGES) {
            balances.set(
                pkg.id,
                packageBalanceAfterCampaigns(pkg.id, allocationCampaigns, excludedBonusCampaignIds),
            );
        }
        return balances;
    }, [allocationCampaigns, excludedBonusCampaignIds]);
    /** Остаток по уже применённым кампаниям. Черновик суммы его не меняет. */
    const committedPackageBalances = useMemo(() => {
        const balances = new Map<string, number>();
        for (const pkg of BONUS_PACKAGES) {
            balances.set(pkg.id, packageBalanceAfterCampaigns(pkg.id, allocationCampaigns));
        }
        return balances;
    }, [allocationCampaigns]);

    const currentBudget = isSingleCampaignMode ? budgetForSingleMode : parseDisplayValue(value);
    const numericBonusValue = parseDisplayValue(String(bonusValue));
    const selectedPackageBalance = packageBalances.get(selectedPkg.id) ?? selectedPkg.amount;
    /** После черновика сброса показываем остаток без бонусов выбранных кампаний. */
    const visiblePackageAmount = (pkgId: string) =>
        (bonusesDraftReset ? packageBalances : committedPackageBalances).get(pkgId) ?? 0;
    const availableBonusPackages = BONUS_PACKAGES.filter((pkg) => visiblePackageAmount(pkg.id) > 0);
    const hasPromoPackages = availableBonusPackages.length > 0;
    const promoBonusLeft = availableBonusPackages.reduce((sum, pkg) => sum + visiblePackageAmount(pkg.id), 0);

    useEffect(() => {
        if (!hasPromoPackages) {
            setUseBonuses(false);
            setAutoUsePromoBonuses(false);
            return;
        }
        if ((committedPackageBalances.get(selectedPkgId) ?? 0) <= 0) {
            const nextId = BONUS_PACKAGES.find((pkg) => (committedPackageBalances.get(pkg.id) ?? 0) > 0)?.id;
            if (nextId) setSelectedPkgId(nextId);
        }
    }, [hasPromoPackages, selectedPkgId, committedPackageBalances]);

    useEffect(() => {
        setBudgetError('');
        setBonusError('');

        if (currentBudget < 1000 && (isSingleCampaignMode || value !== '')) {
            setBudgetError('Минимальный бюджет 1000 ₽');
        }
        // Сумму бонусов выше лимита не режем при вводе — ужимаем при «Применить».
    }, [value, useBonuses, bonusValue, numericBonusValue, selectedPkg, selectedPackageBalance, isSingleCampaignMode, currentBudget, budgetTab]);


    if (!isOpen || !action) return null;

    const getTitle = () => {
        if (isReplenishAction) {
            return `Пополнение бюджета для ${campaignCount} ${getPlural(campaignCount, 'кампании', 'кампаний', 'кампаний')}`;
        }
        switch (action) {
            case 'bid': return 'Задать ставки';
            default: return '';
        }
    }

    const handleSave = () => {
        if (isReplenishAction) {
            if (budgetTab === 'one-time') {
                onSave({
                    __mode: 'budget',
                    total: currentBudget,
                    bonus: useBonuses ? numericBonusValue : 0,
                    isBonusActive: useBonuses,
                    selectedPkg: { ...selectedPkg, amount: selectedPackageBalance },
                });
            } else {
                onSave({
                    __mode: 'autorefill',
                    enabled: true,
                    threshold: parseDisplayValue(autoThreshold),
                    amount: parseDisplayValue(autoAmount),
                    useBonuses: autoUsePromoBonuses,
                });
            }
            return;
        }
        if (action === 'budget') {
            onSave({
                total: currentBudget,
                bonus: useBonuses ? numericBonusValue : 0,
                isBonusActive: useBonuses,
                selectedPkg: { ...selectedPkg, amount: selectedPackageBalance },
            });
        } else {
            onSave(value);
        }
    }
    
    const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const parsed = parseDisplayValue(e.target.value);
        if (!isNaN(parsed)) {
            setValue(String(parsed));
        } else if (e.target.value === '') {
            setValue('');
        }
    };
    
    const handleBudgetBlur = () => {
        const numericValue = parseDisplayValue(value);
        if (isNaN(numericValue) || numericValue < 1000) {
            setValue('1000');
        }
    };

    const handleBonusBlur = () => {
        const numericValue = parseDisplayValue(String(bonusValue));
        if (String(bonusValue).trim() === '' || isNaN(numericValue)) {
            setBonusValue(0);
        }
    };

    const handleNumericField =
      (setter: React.Dispatch<React.SetStateAction<string>>) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const parsed = parseDisplayValue(e.target.value);
        if (!isNaN(parsed)) setter(String(parsed));
        else if (e.target.value === '') setter('');
      };

    const totalAllCampaigns = currentBudget * campaignCount;
    const saveLabel = 'Применить';
    const scopeCampaigns = (editingGroupId ? editedCampaigns : allValidCampaigns).filter((c) =>
      selectedCampaignIds.includes(c.id),
    );
    const autoRefillEnabled = campaignData
      ? Boolean(campaignData.autoReplenishment)
      : scopeCampaigns.some((c) => c.autoReplenishment);

    const handleDisableAuto = () => {
      onSave({
        __mode: 'autorefill',
        enabled: false,
      });
    };

    const ModalToggleSwitch = ({
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
        aria-disabled={disabled}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          onChange(!checked);
        }}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
          disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
        } ${checked ? 'bg-purple-500' : 'bg-gray-300'}`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    );

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div
              className={`relative bg-white rounded-2xl shadow-xl w-full ${isReplenishAction ? 'max-w-4xl' : action === 'budget' ? 'max-w-xl' : 'max-w-sm'} p-6 overflow-hidden`}
              onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-start mb-5">
                    <h3 className="font-bold text-xl text-gray-900 pr-4">{getTitle()}</h3>
                    <button type="button" onClick={onClose} className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="mb-6 max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
                    {isReplenishAction && (
                        <div className="space-y-4">
                            <div className="flex rounded-xl bg-gray-100 p-1">
                              <button
                                type="button"
                                onClick={() => setBudgetTab('auto')}
                                className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                                  budgetTab === 'auto'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                              >
                                Автопополнение
                              </button>
                              <button
                                type="button"
                                onClick={() => setBudgetTab('one-time')}
                                className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                                  budgetTab === 'one-time'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                              >
                                Разовое пополнение
                              </button>
                            </div>

                            {budgetTab === 'one-time' ? (
                              <>
                                <div className="space-y-5 rounded-2xl bg-gray-50 p-5">
                                  <div>
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                      <label className="text-sm font-medium text-gray-900">
                                        Сумма пополнения (₽)
                                      </label>
                                      <button
                                        type="button"
                                        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#3B82F6] hover:text-[#2563EB]"
                                      >
                                        <RefreshCw className="h-3.5 w-3.5" />
                                        Обновить счета
                                      </button>
                                    </div>
                                    <input
                                      type="text"
                                      autoFocus={!isSingleCampaignMode}
                                      readOnly={isSingleCampaignMode}
                                      className={`w-full rounded-xl border bg-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-purple-500 ${
                                        budgetError ? 'border-red-500' : 'border-gray-200'
                                      } ${isSingleCampaignMode ? 'bg-gray-100' : ''}`}
                                      placeholder="3000"
                                      value={formatForDisplay(isSingleCampaignMode ? currentBudget : value)}
                                      onChange={e => !isSingleCampaignMode && handleBudgetChange(e)}
                                      onBlur={handleBudgetBlur}
                                    />
                                    <p className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                                      {budgetError ? (
                                        <span className="text-red-500">{budgetError}</span>
                                      ) : (
                                        <>
                                          Минимальный бюджет — 1000 ₽
                                          <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
                                        </>
                                      )}
                                    </p>
                                  </div>

                                  <div className="space-y-3">
                                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                                      <span>Источники списания</span>
                                      <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
                                    </div>
                                    <div className="flex items-center gap-3 py-1">
                                      <SingleAccountIcon className="h-5 w-5 shrink-0 text-gray-500" />
                                      <p className="mb-0 text-sm font-medium text-gray-800">
                                        Единый счет: {UNIFIED_BALANCE.toLocaleString('ru-RU')}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-3 py-1">
                                      <ModalToggleSwitch
                                        checked={useBonuses}
                                        onChange={setUseBonuses}
                                        disabled={!hasPromoPackages}
                                      />
                                      <p className="mb-0 text-sm font-medium text-gray-800">
                                        Промобонусы: {promoBonusLeft.toLocaleString('ru-RU')}
                                      </p>
                                      <button
                                        type="button"
                                        disabled={!canResetBonuses}
                                        onClick={() => {
                                          if (!canResetBonuses) return;
                                          setBonusesDraftReset(true);
                                          setUseBonuses(true);
                                          setBonusValue('');
                                        }}
                                        className="ml-auto shrink-0 text-sm font-medium text-[#3B82F6] hover:text-[#2563EB] disabled:cursor-not-allowed disabled:text-gray-300"
                                      >
                                        Сбросить бонусы
                                      </button>
                                    </div>

                                    {useBonuses && hasPromoPackages && (
                                      <div className="animate-in fade-in slide-in-from-top-2 duration-300 pt-2">
                                        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                                          {availableBonusPackages.map((pkg) => (
                                            <div
                                              key={pkg.id}
                                              onClick={() => setSelectedPkgId(pkg.id)}
                                              className={`min-w-[200px] cursor-pointer snap-start rounded-xl border-2 bg-white p-4 transition-all ${
                                                selectedPkgId === pkg.id
                                                  ? 'border-purple-600 bg-purple-50/30'
                                                  : 'border-gray-100 hover:border-gray-200'
                                              }`}
                                            >
                                              <div className="mb-1 flex items-start justify-between">
                                                <span className="text-xl font-bold text-gray-900">
                                                  {formatForDisplay(visiblePackageAmount(pkg.id))}
                                                </span>
                                                <div
                                                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                                                    selectedPkgId === pkg.id
                                                      ? 'border-purple-600'
                                                      : 'border-gray-300'
                                                  }`}
                                                >
                                                  {selectedPkgId === pkg.id && (
                                                    <div className="h-2.5 w-2.5 rounded-full bg-purple-600" />
                                                  )}
                                                </div>
                                              </div>
                                              <p className="mb-1 text-xs font-medium text-gray-500">
                                                Остаток пакета
                                              </p>
                                              <p className="mb-3 text-xs font-medium leading-tight text-gray-500">
                                                Оплата до {pkg.maxPercent}% от суммы
                                              </p>
                                              <div className="mt-auto pt-1 text-xs text-gray-500">
                                                сгорят {pkg.expiry}
                                              </div>
                                            </div>
                                          ))}
                                        </div>

                                        <div className="mt-2 flex flex-col gap-6 md:flex-row md:items-center">
                                          <div className="relative w-full md:w-48">
                                            <input
                                              type="text"
                                              value={formatForDisplay(bonusValue)}
                                              onChange={(e) => setBonusValue(e.target.value)}
                                              onBlur={handleBonusBlur}
                                              className={`w-full rounded-xl border px-4 py-3 text-lg font-bold outline-none focus:ring-2 focus:ring-purple-500 ${
                                                bonusError ? 'border-red-500' : 'border-gray-300'
                                              }`}
                                            />
                                            <p className="mt-1.5 text-xs text-gray-500">
                                              до {formatForDisplay(maxBonusForBudget(selectedPkg, currentBudget, selectedPackageBalance))} B (1B = 1P)
                                            </p>
                                          </div>
                                          <div className="text-sm leading-snug text-gray-500">
                                            {bonusError ? (
                                              <p className="text-red-500">{bonusError}</p>
                                            ) : (
                                              <p>
                                                Списать можно максимум {selectedPkg.maxPercent}% от суммы
                                                пополнения
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-500">
                                  Весь бюджет на {campaignCount}{' '}
                                  {getPlural(campaignCount, 'кампанию', 'кампании', 'кампаний')} составит{' '}
                                  {totalAllCampaigns.toLocaleString('ru-RU')} ₽ ({currentBudget.toLocaleString('ru-RU')} ₽
                                  на одну кампанию)
                                </p>
                                {useBonuses && (
                                  <p className="text-sm text-gray-500">
                                    Бонусы на {campaignCount}{' '}
                                    {getPlural(campaignCount, 'кампанию', 'кампании', 'кампаний')} составят{' '}
                                    {(
                                      (Number.isFinite(numericBonusValue) ? numericBonusValue : 0) * campaignCount
                                    ).toLocaleString('ru-RU')}{' '}
                                    B (
                                    {(Number.isFinite(numericBonusValue) ? numericBonusValue : 0).toLocaleString('ru-RU')}{' '}
                                    B на одну кампанию)
                                  </p>
                                )}
                              </>
                            ) : (
                              <div className="space-y-6">
                                <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-6">
                                  <h4 className="mb-4 text-lg font-bold text-gray-900">Условия пополнения</h4>
                                  <div className="max-w-lg space-y-4">
                                    <div className="grid grid-cols-2 items-center gap-4">
                                      <label className="text-gray-600">Если бюджет меньше</label>
                                      <div className="relative">
                                        <input
                                          type="text"
                                          value={formatForDisplay(autoThreshold)}
                                          onChange={handleNumericField(setAutoThreshold)}
                                          className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-6 outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                          ₽
                                        </span>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 items-center gap-4">
                                      <label className="text-gray-600">Пополнять на</label>
                                      <div className="relative">
                                        <input
                                          type="text"
                                          value={formatForDisplay(autoAmount)}
                                          onChange={handleNumericField(setAutoAmount)}
                                          className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-6 outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                          ₽
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                                  <div className="mb-4 flex items-center justify-between">
                                    <h4 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                                      Источники списания
                                      <span className="tooltip">
                                        <HelpCircle className="h-4 w-4 text-gray-400" />
                                        <span className="tooltip-text">
                                          Деньги будут списываться с Единого счёта
                                        </span>
                                      </span>
                                    </h4>
                                    <button
                                      type="button"
                                      className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
                                    >
                                      <RefreshCw className="h-4 w-4" />
                                      <span>Обновить счета</span>
                                    </button>
                                  </div>
                                  <div className="space-y-3">
                                    <div className="flex items-center py-2">
                                      <SingleAccountIcon className="mr-4 h-6 w-6 text-gray-500" />
                                      <p className="mb-0 font-medium text-gray-800">
                                        Единый счёт: {UNIFIED_BALANCE.toLocaleString('ru-RU')} ₽
                                      </p>
                                    </div>
                                    <div className="flex items-center py-2">
                                      <ModalToggleSwitch
                                        checked={autoUsePromoBonuses}
                                        onChange={setAutoUsePromoBonuses}
                                        disabled={!hasPromoPackages}
                                      />
                                      <p className="mb-0 ml-4 font-medium text-gray-800">
                                        Промо-бонусы: {promoBonusLeft.toLocaleString('ru-RU')} B{' '}
                                        <span className="font-normal text-gray-500">
                                          (до 100% от суммы пополнения)
                                        </span>
                                      </p>
                                    </div>
                                  </div>
                                  <p className="mt-4 pl-10 text-sm text-gray-500">
                                    Спишем промо-бонусы из ваших пакетов автоматически. Сначала из тех, что
                                    сгорают быстрее, затем из остальных. Сумма списания зависит от условий
                                    пакета
                                  </p>

                                  <div className="mt-6 pl-10">
                                    <button
                                      type="button"
                                      onClick={() => setShowAutoPackages(!showAutoPackages)}
                                      className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
                                    >
                                      <span>Мои пакеты</span>
                                      <ChevronDown
                                        className={`h-4 w-4 transition-transform ${
                                          showAutoPackages ? 'rotate-180' : ''
                                        }`}
                                      />
                                    </button>
                                    {showAutoPackages && (
                                      <div className="mt-4 grid animate-in fade-in grid-cols-1 gap-4 duration-300 md:grid-cols-2 lg:grid-cols-3">
                                        {availableBonusPackages.map((pkg) => (
                                          <div
                                            key={pkg.id}
                                            className="cursor-pointer rounded-xl border-2 border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-purple-400"
                                          >
                                            <span className="text-2xl font-bold text-gray-900">
                                              {visiblePackageAmount(pkg.id).toLocaleString('ru-RU')}
                                            </span>
                                            <p className="mt-1 text-xs font-medium text-gray-500">
                                              Остаток пакета
                                            </p>
                                            <p className="mb-3 mt-1 text-sm text-gray-600">
                                              Оплата до {pkg.maxPercent}% от суммы
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                              <Clock className="h-3.5 w-3.5" />
                                              <span>сгорят {pkg.expiry}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                        </div>
                    )}
                    {action === 'bid' && (
                        (categories.length > 1) ? (
                            <div className="space-y-4">
                                {categories.map(cat => (
                                    <div key={cat}>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{cat}</label>
                                        <BidInput value={parseDisplayValue((value as any)[cat])} onChange={(val) => setValue((prev: any) => ({ ...prev, [cat]: val }))} presets={[150, 300, 500]} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Новая ставка (₽)</label>
                                <div className="w-1/2">
                                    <BidInput value={parseDisplayValue(value)} onChange={(val) => setValue(String(val))} presets={[150, 300, 500]} />
                                </div>
                            </div>
                        )
                    )}
                </div>

                {isReplenishAction ? (
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={budgetTab === 'one-time' && (!!budgetError || !!bonusError)}
                        className="rounded-xl bg-[#9A41FE] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#8A35EE] disabled:cursor-not-allowed disabled:bg-gray-300"
                      >
                        {saveLabel}
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-200"
                      >
                        Отмена
                      </button>
                    </div>
                    {budgetTab === 'auto' && autoRefillEnabled ? (
                      <button
                        type="button"
                        onClick={handleDisableAuto}
                        className="rounded-xl border border-red-500 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        Отключить
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                      <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Отмена</button>
                      <button
                          onClick={handleSave}
                          disabled={!!budgetError || !!bonusError}
                          className="px-4 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                          Применить
                      </button>
                  </div>
                )}
            </div>
        </div>
    )
}

const Pagination = ({ total, pageSize, current, onChange }: { total: number, pageSize: number, current: number, onChange: (page: number) => void }) => {
    const totalPages = Math.ceil(total / pageSize);
    if (totalPages <= 1) return null;
    const handlePrev = () => { if (current > 1) onChange(current - 1); };
    const handleNext = () => { if (current < totalPages) onChange(current + 1); };

    let items = [];
    if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) items.push(i);
    } else {
        items.push(1);
        if (current > 3) items.push('...');
        if (current > 2) items.push(current - 1);
        if (current > 1 && current < totalPages) items.push(current);
        if (current < totalPages - 1) items.push(current + 1);
        if (current < totalPages - 2) items.push('...');
        items.push(totalPages);
    }
    const uniqueItems = [...new Set(items)];

    return ( <div className="pagination-container"> <button onClick={handlePrev} className={`pagination-item ${current === 1 ? 'disabled' : ''}`} disabled={current === 1}>&lt;</button> {uniqueItems.map((item, index) => ( <button key={index} onClick={() => typeof item === 'number' && onChange(item)} className={`pagination-item ${current === item ? 'active' : ''} ${typeof item !== 'number' ? 'disabled' : ''}`} disabled={typeof item !== 'number'}> {item} </button> ))} <button onClick={handleNext} className={`pagination-item ${current === totalPages ? 'disabled' : ''}`} disabled={current === totalPages}>&gt;</button> </div> );
};

const BidInput = ({
    value,
    onChange,
    presets = [150, 200, 250],
    showApplyToAllTooltip = false,
    onApplyToAll,
    min = 300,
    bidStepRub,
    onBidRounded,
}: {
    value: number;
    onChange: (value: number) => void;
    presets?: number[];
    showApplyToAllTooltip?: boolean;
    onApplyToAll?: (value: number) => void;
    min?: number;
    bidStepRub?: number;
    onBidRounded?: (roundedRub: number) => void;
}) => {
    const [inputValue, setInputValue] = useState(String(value || ''));
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        setInputValue(String(value || ''));
    }, [value]);

    const applyBidValue = (raw: string | number) => {
        let numericValue = typeof raw === 'number' ? raw : parseDisplayValue(raw);
        if (isNaN(numericValue)) {
            numericValue = min;
        }
        if (bidStepRub != null) {
            const { value: stepped, didRoundFromInput } = normalizeCpmBidRub(numericValue, min);
            if (didRoundFromInput) onBidRounded?.(stepped);
            return stepped;
        }
        if (numericValue < min) {
            numericValue = min;
        }
        return numericValue;
    };

    const handleBlur = () => {
        const numericValue = applyBidValue(inputValue);
        onChange(numericValue);
        setInputValue(String(numericValue));
        setIsFocused(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handlePresetClick = (p: number) => {
        setInputValue(String(p));
        onChange(p);
    };

    return (
        <div className="w-full border border-gray-300 rounded-lg shadow-sm overflow-hidden relative">
            <div className="relative bg-white">
                 <input
                    type="text"
                    value={inputValue}
                    placeholder="Ставка"
                    onChange={handleChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={handleBlur}
                    className="w-full text-sm text-left font-medium bg-transparent outline-none px-2 py-1.5 hide-arrows"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">₽</span>
            </div>
            <div className="flex w-full h-2 border-t border-gray-200">
                {presets.map((p, index) => (
                    <button
                        key={p}
                        onClick={() => handlePresetClick(p)}
                        title={`Установить ставку ${p} ₽`}
                        className={`flex-1 h-full transition-colors relative
                            ${Number(value) === p ? 'bg-green-300' : 'bg-gray-100 hover:bg-gray-200'}
                        `}
                        aria-label={`Установить ставку ${p}`}
                    >
                      {index > 0 && <div className="absolute left-0 top-0 bottom-0 w-px bg-white"></div>}
                    </button>
                ))}
            </div>
            {isFocused && showApplyToAllTooltip && onApplyToAll && (
              <div className="absolute left-0 top-full mt-1 z-40 w-64 bg-gray-900 text-white text-xs rounded-lg shadow-xl p-3">
                <p className="mb-2">Применить эту ставку для всех выбранных кампаний?</p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="px-2 py-1 rounded-md bg-gray-700 hover:bg-gray-600 text-xs"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      let numericValue = applyBidValue(inputValue);
                      onChange(numericValue);
                      onApplyToAll(numericValue);
                      setInputValue(String(numericValue));
                      setIsFocused(false);
                    }}
                  >
                    Применить
                  </button>
                  <button
                    type="button"
                    className="px-2 py-1 rounded-md bg-transparent border border-gray-500 hover:bg-gray-800 text-xs"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setIsFocused(false)}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
        </div>
    )
};


type UploadEditsTab = 'bids' | 'clusters';
type UploadEditsPhase = 'upload' | 'processing' | 'success';

type UploadSuccessRow = {
  variant: 'success' | 'adjust' | 'error';
  title: string;
  description: string;
};

function uploadSuccessRowsForTab(tab: UploadEditsTab): UploadSuccessRow[] {
  if (tab === 'clusters') {
    return [
      {
        variant: 'success',
        title: '1 кампания, 1 товар, 3 кластера',
        description: 'Применили изменения',
      },
    ];
  }
  return [
    {
      variant: 'success',
      title: '12 кампаний, 24 товара',
      description: 'Применили изменения',
    },
    {
      variant: 'adjust',
      title: '5 кампаний',
      description: 'Скорректировали ставки',
    },
    {
      variant: 'adjust',
      title: '3 товара',
      description: 'Ставки применены — проверьте дневной лимит, если он ниже рекомендуемого',
    },
    {
      variant: 'error',
      title: '3 товара',
      description: 'Не распознали',
    },
  ];
}

const PaperclipIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

const UploadSuccessRowIcon: React.FC<{ variant: UploadSuccessRow['variant'] }> = ({ variant }) => {
  if (variant === 'success') {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
        <Check className="h-4 w-4" />
      </span>
    );
  }
  if (variant === 'adjust') {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600">
        <Edit2 className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
      <AlertCircle className="h-4 w-4" />
    </span>
  );
};

const UploadEditsModal = ({
  isOpen,
  onClose,
  onApply,
}: {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
}) => {
  const [uploadTab, setUploadTab] = useState<UploadEditsTab>('bids');
  const [phase, setPhase] = useState<UploadEditsPhase>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUploadTab('bids');
      setPhase('upload');
      setFile(null);
      setIsDragging(false);
    }
  }, [isOpen]);

  const handleFile = (selectedFile: File) => {
    if (
      selectedFile &&
      (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        selectedFile.type === 'text/csv' ||
        selectedFile.name.endsWith('.xlsx'))
    ) {
      setFile(selectedFile);
    } else {
      alert('Пожалуйста, выберите файл Excel (.xlsx) или CSV.');
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      handleFile(e.dataTransfer.files[0]);
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleFile(e.target.files[0]);
    }
  };

  const handleApplyClick = () => {
    const canApply = Boolean(file) || uploadTab === 'clusters';
    if (!canApply) return;
    setPhase('processing');
    onApply();
    window.setTimeout(() => setPhase('success'), 2000);
  };

  const handleClose = () => {
    onClose();
  };

  const fileLabel =
    file?.name ??
    (uploadTab === 'clusters' ? 'Редактирование поисковых кластеров. Шаблон актуален на …' : '');

  const hasAttachedFile = Boolean(file) || uploadTab === 'clusters';

  if (!isOpen) return null;

  const successRows = uploadSuccessRowsForTab(uploadTab);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-[560px] rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="upload-edits-modal-title"
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          aria-label="Закрыть"
        >
          <X className="h-5 w-5" />
        </button>

        {phase === 'success' ? (
          <div className="p-6">
            <h2 id="upload-edits-modal-title" className="pr-8 text-xl font-bold text-gray-900">
              Файл загружен
            </h2>
            <ul className="mt-5 divide-y divide-gray-100 border-y border-gray-100">
              {successRows.map((row) => (
                <li key={row.title} className="flex gap-3 py-4 first:pt-4 last:pb-4">
                  <UploadSuccessRowIcon variant={row.variant} />
                  <div className="min-w-0">
                    <p className="mb-0 text-sm font-semibold text-gray-900">{row.title}</p>
                    <p className="mt-0.5 text-sm text-gray-500">{row.description}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                Закрыть
              </button>
              <button
                type="button"
                onClick={() => {
                  /* демо: скачивание отчёта */
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200"
              >
                <Download className="h-4 w-4 shrink-0" />
                Скачать файл с пояснениями ошибок
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <h2 id="upload-edits-modal-title" className="pr-8 text-xl font-bold text-gray-900">
              Измените кампании через Excel
            </h2>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-600">
              <span>Скачать файл можно в списке кампаний</span>
              <span
                className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-500"
                title="В списке кампаний выберите нужные, нажмите «Скачать Excel для правок», внесите изменения и загрузите файл здесь"
              >
                ?
              </span>
            </p>

            <div className="mt-4 flex rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setUploadTab('bids');
                  handleRemoveFile();
                }}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  uploadTab === 'bids'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Загрузка ставок
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadTab('clusters');
                }}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  uploadTab === 'clusters'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Загрузка кластеров
              </button>
            </div>

            {phase === 'processing' ? (
              <div className="mt-4 flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 py-12">
                <Loader className="h-10 w-10 animate-spin text-purple-600" />
                <p className="text-sm font-medium text-gray-700">Обработка файла…</p>
              </div>
            ) : hasAttachedFile ? (
              <div className="mt-4 flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
                <PaperclipIcon className="h-5 w-5 shrink-0 text-gray-500" />
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-purple-600" title={fileLabel}>
                  {fileLabel}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    handleRemoveFile();
                    if (uploadTab === 'clusters') {
                      setUploadTab('bids');
                    }
                  }}
                  className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                  aria-label="Удалить файл"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`mt-4 flex min-h-[200px] flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
                  isDragging ? 'border-purple-400 bg-purple-50/50' : 'border-gray-200'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx,.csv"
                  className="hidden"
                />
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                  <FileSpreadsheet className="h-7 w-7" />
                </span>
                <p className="text-base font-semibold text-gray-900">Загрузите файл в формате XLSX</p>
                <p className="mt-2 text-sm text-gray-500">Максимум 50 кампаний в таблице</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 text-sm font-medium text-purple-600 hover:text-purple-700 hover:underline"
                >
                  Выберите файл на компьютере
                </button>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleApplyClick}
                disabled={!hasAttachedFile || phase === 'processing'}
                className="rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-purple-100 disabled:text-purple-400"
              >
                Применить изменения
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const creationBarShellClass =
  'fixed bottom-6 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-2.5 rounded-full bg-black py-2 pl-5 pr-3 shadow-[0_12px_40px_rgba(0,0,0,0.35)] animate-in slide-in-from-bottom-4 fade-in';
const creationBarBtnClass =
  'inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-[#2C2C2C] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3A3A3A]';
const creationBarCloseClass =
  'rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white';

type CreationBulkBidTarget =
  | 'cpc-search'
  | 'cpc-recs'
  | 'cpm-search'
  | 'cpm-recs'
  | 'cpm-unified';

const CREATION_BULK_BID_OPTIONS: {
  id: CreationBulkBidTarget;
  label: string;
}[] = [
  { id: 'cpc-search', label: 'CPC Поиск' },
  { id: 'cpc-recs', label: 'CPC Рекомендации' },
  { id: 'cpm-search', label: 'CPM Поиск' },
  { id: 'cpm-recs', label: 'CPM Рекомендации' },
  { id: 'cpm-unified', label: 'CPM Единая' },
];

const CREATION_BULK_BID_TITLES: Record<CreationBulkBidTarget, string> = {
  'cpc-search': 'Настройте CPC в поиске',
  'cpc-recs': 'Настройте CPC в рекомендациях',
  'cpm-search': 'Настройте CPM в поиске',
  'cpm-recs': 'Настройте CPM в рекомендациях',
  'cpm-unified': 'Настройте единую ставку CPM',
};

const CreationSelectionBar = ({
  count,
  total,
  showAutobidder = false,
  showDailyLimit = false,
  bidTargets,
  onBudget,
  onDailyLimit,
  onBidTarget,
  onZones,
  onAutobidder,
  onDelete,
  onClear,
}: {
  count: number;
  total: number;
  showAutobidder?: boolean;
  showDailyLimit?: boolean;
  bidTargets: CreationBulkBidTarget[];
  onBudget: () => void;
  onDailyLimit: () => void;
  onBidTarget: (target: CreationBulkBidTarget) => void;
  onZones: () => void;
  /** Автобиддер только для CPC */
  onAutobidder: () => void;
  onDelete: () => void;
  onClear: () => void;
}) => {
  const [bidMenuOpen, setBidMenuOpen] = useState(false);
  const bidMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!bidMenuOpen) return;
    const onDoc = (event: MouseEvent) => {
      if (bidMenuRef.current?.contains(event.target as Node)) return;
      setBidMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setBidMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [bidMenuOpen]);

  const visibleBidOptions = CREATION_BULK_BID_OPTIONS.filter((opt) =>
    bidTargets.includes(opt.id),
  );

  return (
    <div className={creationBarShellClass}>
      <span className="whitespace-nowrap text-sm font-medium text-white">
        Выбрано {count} из {total}
      </span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onBudget} className={creationBarBtnClass}>
          <Coins className="h-4 w-4 text-white" />
          <span>Бюджет</span>
        </button>
        {showDailyLimit ? (
          <button type="button" onClick={onDailyLimit} className={creationBarBtnClass}>
            <Calendar className="h-4 w-4 text-white" />
            <span>Дневной лимит</span>
          </button>
        ) : null}
        {showAutobidder ? (
          <button type="button" onClick={onAutobidder} className={creationBarBtnClass}>
            <Crosshair className="h-4 w-4 text-white" />
            <span>Автобиддер</span>
          </button>
        ) : null}
        <div className="relative" ref={bidMenuRef}>
          <button
            type="button"
            onClick={() => setBidMenuOpen((open) => !open)}
            className={creationBarBtnClass}
            aria-haspopup="menu"
            aria-expanded={bidMenuOpen}
          >
            <Zap className="h-4 w-4 text-white" />
            <span>Ставка</span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-white/80 transition-transform ${
                bidMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
          {bidMenuOpen && visibleBidOptions.length > 0 ? (
            <div
              role="menu"
              className="absolute bottom-[calc(100%+10px)] left-1/2 z-[90] w-[240px] -translate-x-1/2 overflow-hidden rounded-2xl bg-white py-3 shadow-[0_12px_40px_rgba(0,0,0,0.18)] animate-in fade-in zoom-in-95 duration-150"
            >
              <p className="px-4 pb-2 text-[12px] leading-4 text-gray-500">
                Ставки изменятся только в активных кампаниях
              </p>
              <div className="flex flex-col">
                {visibleBidOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setBidMenuOpen(false);
                      onBidTarget(opt.id);
                    }}
                    className="px-4 py-2.5 text-left text-[15px] font-semibold text-gray-950 transition-colors hover:bg-gray-50"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <button type="button" onClick={onZones} className={creationBarBtnClass}>
          <Columns2 className="h-4 w-4 text-white" />
          <span>Зоны показа</span>
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2C2C2C] text-[#FF5A5A] transition-colors hover:bg-[#3A3A3A] hover:text-[#FF7A7A]"
          aria-label="Удалить"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <button
        type="button"
        onClick={onClear}
        className={creationBarCloseClass}
        aria-label="Снять выделение"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

const DownloadNotification = ({ count }: { count: number }) => (
    <div className="fixed bottom-6 right-6 bg-gray-800 text-white rounded-lg shadow-lg p-4 flex items-center gap-3 z-[90] animate-in slide-in-from-bottom-4 fade-in">
        <Loader className="w-5 h-5 animate-spin" />
        <span className="text-sm font-medium">
            Скачивание данных для {count} {getPlural(count, 'кампании', 'кампаний', 'кампаний')}...
        </span>
    </div>
);


export default function App() {
  const {
    profileId,
    pendingReferralCreationNav,
    consumeReferralCreationNav,
    dismissReferralInviteCreationBanner,
    pendingSingleCampaignNav,
    consumeSingleCampaignNav,
  } = useProfile();
  const { promoBonusTotal } = usePromoBonusDemo();
  const setMassCreationDemoChrome = useSetMassCreationDemoChrome();
  const demoBonusPackages = useMemo(
    () => buildDemoBonusPackages(promoBonusTotal) as BonusPackage[],
    [promoBonusTotal],
  );
  // Держим лимиты пакетов в sync с демо-кейсом до отрисовки карточек бюджета.
  setRuntimePromoPackageAmounts(demoBonusPackages);
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(AUTH_SESSION_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [authDestination, setAuthDestination] = useState<AuthDestination>(() =>
    readAuthDestination(),
  );
  const isMassCreationResearchAccess = authDestination === 'mass-creation';
  const isBonusesResearchAccess = authDestination === 'bonuses';
  const [appState, setAppState] = useState<
    'creation' | 'list' | 'editing' | 'single-campaign' | 'new-seller-first-campaign'
  >(() => (readAuthDestination() === 'mass-creation' ? 'creation' : 'list'));

  const showMassCreationDemoChrome =
    isAuthenticated &&
    !isMassCreationResearchAccess &&
    !isBonusesResearchAccess &&
    appState === 'creation' &&
    !(isNewSellerProfile(profileId) && !isNewSellerSecondaryShellPath(location.pathname));

  useEffect(() => {
    setMassCreationDemoChrome(showMassCreationDemoChrome);
  }, [setMassCreationDemoChrome, showMassCreationDemoChrome]);

  // Исследования → «Массовое создание»: только экран массового создания
  useEffect(() => {
    if (!isMassCreationResearchAccess) return;
    setAppState('creation');
  }, [isMassCreationResearchAccess]);

  // Исследования → «Промобонусы»: только главная (+ запуск одной кампании)
  useEffect(() => {
    if (!isBonusesResearchAccess) return;
    if (appState === 'single-campaign') return;
    if (appState !== 'list') setAppState('list');
    if (location.pathname !== PRODUCT_PROMOTION_CONCEPT_PATH) {
      navigate(PRODUCT_PROMOTION_CONCEPT_PATH, { replace: true });
    }
  }, [isBonusesResearchAccess, appState, location.pathname, navigate]);

  const openSingleCampaign = useCallback(() => {
    if (isMassCreationResearchAccess) return;
    setAppState('single-campaign');
  }, [isMassCreationResearchAccess]);

  const openNewSellerCampaignCreation = useCallback(() => {
    if (isMassCreationResearchAccess || isBonusesResearchAccess) return;
    setAppState('new-seller-first-campaign');
    if (location.pathname !== NEW_SELLER_CREATE_CAMPAIGN_PATH) {
      navigate(NEW_SELLER_CREATE_CAMPAIGN_PATH, { replace: true });
    }
  }, [
    isMassCreationResearchAccess,
    isBonusesResearchAccess,
    location.pathname,
    navigate,
  ]);

  useEffect(() => {
    if (isMassCreationResearchAccess || isBonusesResearchAccess) return;
    if (!isNewSellerProfile(profileId)) {
      setAppState((prev) => (prev === 'new-seller-first-campaign' ? 'list' : prev));
      if (location.pathname === NEW_SELLER_CREATE_CAMPAIGN_PATH) {
        navigate('/product-promotion-concept', { replace: true });
      }
      return;
    }

    // Финансы / бонусы — обычный shell; всё остальное — экран создания кампании
    if (isNewSellerSecondaryShellPath(location.pathname)) {
      setAppState('list');
      return;
    }

    setAppState('new-seller-first-campaign');
    if (location.pathname !== NEW_SELLER_CREATE_CAMPAIGN_PATH) {
      navigate(NEW_SELLER_CREATE_CAMPAIGN_PATH, { replace: true });
    }
  }, [
    isMassCreationResearchAccess,
    isBonusesResearchAccess,
    profileId,
    location.pathname,
    navigate,
  ]);

  useEffect(() => {
    if (isMassCreationResearchAccess || isBonusesResearchAccess) return;
    if (!isShellAppPath(location.pathname)) return;
    if (isNewSellerProfile(profileId)) return;
    setAppState((prev) => (prev === 'cpc-detail' ? prev : 'list'));
  }, [
    isMassCreationResearchAccess,
    isBonusesResearchAccess,
    location.pathname,
    profileId,
  ]);
  const [globalConfig, setGlobalConfig] = useState<CampaignConfig>({ paymentModel: PaymentModel.CPM, bidType: BidType.UNIFIED, categories: [] });
  const [showToast, setShowToast] = useState(false);
  const { showCpmBidRoundedAlert, cpmBidRoundedAlertNode } = useCpmBidRoundedAlert();
  const [toastMessage, setToastMessage] = useState('');
  const [templateGroups, setTemplateGroups] = useState<TemplateGroup[]>([]);

  useEffect(() => {
    setTemplateGroups((prev) => {
      let changed = false;
      const next = prev.map((group) => {
        const campaigns = clampCampaignsToPromoPackageBalances(group.campaigns);
        if (campaigns.some((campaign, index) => campaign !== group.campaigns[index])) {
          changed = true;
          return { ...group, campaigns };
        }
        return group;
      });
      return changed ? next : prev;
    });
  }, [demoBonusPackages]);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editedCampaigns, setEditedCampaigns] = useState<CampaignRecord[]>([]);
  const [originalCampaignsWhileEditing, setOriginalCampaignsWhileEditing] = useState<CampaignRecord[] | null>(null);
  const [lastDeleted, setLastDeleted] = useState<{ campaign: CampaignRecord, index: number, groupId: string | null } | null>(null);
  const deleteUndoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [currentSearchInput, setCurrentSearchInput] = useState('');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [isLaunching, setIsLaunching] = useState(false);
  const [creationResult, setCreationResult] = useState<{success: number, error: number} | null>(null);
  const [failedCampaigns, setFailedCampaigns] = useState<CampaignRecord[]>([]);

  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [selectedListedCampaignIds, setSelectedListedCampaignIds] = useState<string[]>([]);
  const [isBulkActionModalOpen, setIsBulkActionModalOpen] = useState(false);
  const [clearSelectionOnBulkClose, setClearSelectionOnBulkClose] = useState(false);
  const [currentBulkAction, setCurrentBulkAction] = useState<BulkActionType>(null);
  const [creationBulkBidTarget, setCreationBulkBidTarget] =
    useState<CreationBulkBidTarget>('cpc-search');
  const [bulkEditPrefillData, setBulkEditPrefillData] = useState<{ budget: number; bonusAmount: number; useBonuses: boolean; } | null>(null);
  
  const [isConfirmDeleteGroupOpen, setIsConfirmDeleteGroupOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<TemplateGroup | null>(null);
  const [isConfirmBulkDeleteOpen, setIsConfirmBulkDeleteOpen] = useState(false);
  const [isConfirmCancelEditOpen, setIsConfirmCancelEditOpen] = useState(false);
  const [isConfirmSwitchEditOpen, setIsConfirmSwitchEditOpen] = useState(false);
  const [nextGroupToEdit, setNextGroupToEdit] = useState<TemplateGroup | null>(null);
  const [isConfirmLaunchOpen, setIsConfirmLaunchOpen] = useState(false);
  const [isConfirmLaunchWithFiltersOpen, setIsConfirmLaunchWithFiltersOpen] = useState(false);
  const [showAddMoreHint, setShowAddMoreHint] = useState(true);
  // Removed: hasShownFirstListCpcTooltip (tooltip UI removed)
  const [isLaunchSummaryModalOpen, setIsLaunchSummaryModalOpen] = useState(false);
  /** В окне подтверждения: тратить ли промобонусы, если в таблице они ещё не назначены. */
  const [isAutoRefillModalOpen, setIsAutoRefillModalOpen] = useState(false);
  const [campaignForAutoRefill, setCampaignForAutoRefill] = useState<CampaignRecord | null>(null);
  const [isCreationBulkDailyLimitOpen, setIsCreationBulkDailyLimitOpen] = useState(false);
  const [creationBulkDailyLimitEnabled, setCreationBulkDailyLimitEnabled] = useState(false);
  const [creationBulkDailyLimitValue, setCreationBulkDailyLimitValue] = useState('');
  const [creationBulkSavedDailyLimit, setCreationBulkSavedDailyLimit] = useState('');
  const [creationBulkCarryover, setCreationBulkCarryover] = useState(false);
  const [creationBulkDailyLimitSettings, setCreationBulkDailyLimitSettings] =
    useState<AdvancedDailyLimitSettings>(() => createDefaultAdvancedDailyLimitSettings());
  const [creationBulkAutoRefillOnRules, setCreationBulkAutoRefillOnRules] = useState(true);
  const [isCreationZonesModalOpen, setIsCreationZonesModalOpen] = useState(false);
  const [creationZonesDraft, setCreationZonesDraft] = useState({ search: true, recommendations: true });
  /** Скоуп автобиддера из дропдауна CPC/CPM в массовых действиях */
  const [autobidderBulkPaymentModel, setAutobidderBulkPaymentModel] =
    useState<PaymentModel | null>(null);
  /** Включённый автобиддер в таблице массового создания (по id кампании) */
  const [creationAutobidderSetup, setCreationAutobidderSetup] = useState<
    Record<string, MassCreationAutobidderSetup>
  >({});
  const [campaignForBonusEdit, setCampaignForBonusEdit] = useState<CampaignRecord | null>(null);
  const [singleReplenishAction, setSingleReplenishAction] = useState<'budget' | 'autorefill'>('budget');
  const [isUploadEditsModalOpen, setIsUploadEditsModalOpen] = useState(false);
  const [isReviewEditsModalOpen, setIsReviewEditsModalOpen] = useState(false);
  const [isConfirmExitOpen, setIsConfirmExitOpen] = useState(false);
  const [pendingNavigationAction, setPendingNavigationAction] = useState<(() => void) | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'loading'>('idle');
  const [downloadCount, setDownloadCount] = useState(0);
  const [isEditDownloadModalOpen, setIsEditDownloadModalOpen] = useState(false);
  const [showUploadHint, setShowUploadHint] = useState(false);
  const [isApplyingEdits, setIsApplyingEdits] = useState(false);
  const handleApplyEdits = () => {
    if (applyEditsTimeoutRef.current) {
      clearTimeout(applyEditsTimeoutRef.current);
    }

    applyEditsTimeoutRef.current = setTimeout(() => {
      setIsApplyingEdits(false);
      setToastMessage('Изменения применены');
      applyEditsTimeoutRef.current = null;
    }, 5000);
  };

  const handleCancelEdits = () => {
    if (applyEditsTimeoutRef.current) {
        clearTimeout(applyEditsTimeoutRef.current);
        applyEditsTimeoutRef.current = null;
    }
    setIsApplyingEdits(false);
    setToastMessage("Применение изменений отменено");
    setShowToast(true);
  };
  const [isFromExcelModal, setIsFromExcelModal] = useState(false);
  const applyEditsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedCpcCampaign, setSelectedCpcCampaign] = useState<{
    id: number;
    name: string;
    paymentModel?: 'CPC' | 'CPM';
    remainingBudget: number | null;
    dailyLimit: number | null;
    scheduledDailyLimit: number | null;
    dailyLimitExhausted?: boolean;
    autoRefill?: boolean;
    dynamicDailyLimit?: boolean;
    fromReadyToRepeat?: boolean;
    repeatLaunchPreset?: RepeatLaunchPreset;
    campaignStatus?: 'active' | 'paused';
    openBidRecommendations?: boolean;
    bidRecommendationProduct?: { name: string; image: string };
    budgetConceptDemo?: boolean;
    budgetRangeConceptDemo?: boolean;
  } | null>(null);
  const updateCampaignDataRef = useRef<((campaignId: number, data: { name?: string; remainingBudget?: number | null; dailyLimit?: number | null; scheduledDailyLimit?: number | null; maxCpcBidRub?: number; autoRefill?: boolean; dynamicDailyLimit?: boolean; status?: 'active' | 'paused'; statusText?: string }) => void) | null>(null);
  const bulkDailyLimitOpenerRef = useRef<(() => void) | null>(null);
  const bulkSearchBidOpenerRef = useRef<(() => void) | null>(null);
  /** Массовый бюджет/автопополнение из списка кампаний (SuccessPage) */
  const [listBudgetTargetIds, setListBudgetTargetIds] = useState<string[] | null>(null);
  const listBudgetApplierRef = useRef<
    ((campaignIds: string[], value: Record<string, unknown>) => void) | null
  >(null);

  type CampaignListDataPatch = {
    name?: string;
    remainingBudget?: number | null;
    dailyLimit?: number | null;
    scheduledDailyLimit?: number | null;
    maxCpcBidRub?: number;
    autoRefill?: boolean;
    /** Правила автоувеличения дневного лимита включены */
    dynamicDailyLimit?: boolean;
    status?: 'active' | 'paused';
    statusText?: string;
  };
  const CAMPAIGN_LIST_PATCHES_STORAGE_KEY = 'massCreation.campaignListPatches.v1';
  const readStoredCampaignListPatches = (): Record<number, CampaignListDataPatch> => {
    try {
      const raw = window.localStorage.getItem(CAMPAIGN_LIST_PATCHES_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<string, CampaignListDataPatch>;
      if (!parsed || typeof parsed !== 'object') return {};
      return Object.fromEntries(
        Object.entries(parsed)
          .map(([id, patch]) => [Number(id), patch] as const)
          .filter(([id]) => Number.isFinite(id)),
      );
    } catch {
      return {};
    }
  };
  const [campaignListPatches, setCampaignListPatches] = useState<Record<number, CampaignListDataPatch>>(
    () => readStoredCampaignListPatches(),
  );
  const persistCampaignListPatch = useCallback((campaignId: number, data: CampaignListDataPatch) => {
    setCampaignListPatches((prev) => {
      const next = {
        ...prev,
        [campaignId]: { ...prev[campaignId], ...data },
      };
      try {
        window.localStorage.setItem(CAMPAIGN_LIST_PATCHES_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore quota / private mode */
      }
      return next;
    });
  }, []);

  const [inlineErrors, setInlineErrors] = useState<Record<string, string>>({});

  const [isBonusInsufficiencyModalOpen, setIsBonusInsufficiencyModalOpen] = useState(false);
  const [bonusAppContext, setBonusAppContext] = useState<{ value: any, fullCoverageCount: number, remainingBonuses: number } | null>(null);

  const handleNavigateToList = () => {
    if (isMassCreationResearchAccess) {
      setAppState('creation');
      return;
    }
    setWbDiscountPromoteProducts(null);
    setAppState('list');
    if (isBonusesResearchAccess) {
      navigate(PRODUCT_PROMOTION_CONCEPT_PATH, { replace: true });
    }
  };
  const handleNavigateToCreation = () => {
    if (isBonusesResearchAccess) return;
    setAppState('creation');
  };
  const handleNavigateToEditing = () => {
    if (isMassCreationResearchAccess || isBonusesResearchAccess) return;
    setAppState('editing');
  };

  const buildGrowingDemandMassCreationCampaigns = useCallback((): CampaignRecord[] => {
    const currentDate = new Date().toLocaleDateString('ru-RU');
    const seenNmIds = new Set<number>();

    return GROWING_DEMAND_PRODUCTS.filter((p) => {
      const nmId = Number(p.id);
      if (Number.isNaN(nmId) || seenNmIds.has(nmId)) return false;
      seenNmIds.add(nmId);
      return true;
    })
      .slice(0, 5)
      .map((p, index) => {
      const nmId = Number(p.id);
      const searchPresets = [
        undefined,
        CPC_DEFAULT_SEARCH_BID_RUB,
        CPC_DEFAULT_SEARCH_BID_RUB,
        undefined,
        CPC_DEFAULT_SEARCH_BID_RUB,
      ] as const;
      const recsPresets = [
        CPC_DEFAULT_SEARCH_BID_RUB,
        CPC_DEFAULT_SEARCH_BID_RUB,
        undefined,
        CPC_DEFAULT_SEARCH_BID_RUB,
        CPC_DEFAULT_SEARCH_BID_RUB,
      ] as const;
      const dailyPresets = [1000, 1000, 1000, 1000, null] as const;
      const apPresets = [true, true, false, true, false] as const;
      return {
        id: `growing-demand-v6-${p.id}-${index}`,
        nmId,
        productName: p.name,
        campaignName: `${p.name} CPC ${currentDate}`,
        imageUrl: p.image,
        category: 'Товары',
        budget: 3000,
        dailyLimit: dailyPresets[index] ?? 1000,
        autoReplenishment: apPresets[index] ?? false,
        fundingSource: 'Единый счёт' as const,
        status: CampaignStatus.VALID,
        usePromoBonuses: false,
        searchBid: searchPresets[index],
        recommendationsBid: recsPresets[index],
      };
    });
  }, []);

  const handleNavigateToCreationWithGrowingDemand = useCallback(() => {
    if (isBonusesResearchAccess) {
      openSingleCampaign();
      return;
    }
    const config: Pick<CampaignConfig, 'paymentModel' | 'bidType'> = {
      paymentModel: PaymentModel.CPC,
      bidType: BidType.UNIFIED,
    };
    const items = buildGrowingDemandMassCreationCampaigns();
    const label = getTemplateGroupLabel(config);
    const groupId = `group-${config.paymentModel}-${config.bidType}`;

    setGlobalConfig((prev) => ({
      ...prev,
      paymentModel: config.paymentModel,
      bidType: config.bidType,
    }));
    setTemplateGroups([
      {
        id: groupId,
        config,
        campaigns: items,
        duplicateNmIds: new Set(),
        correctedNmIds: new Set(),
        currentPage: 1,
        sourceFiles: new Set(['Подборка недели']),
      },
    ]);
    setToastMessage(
      `Подборка: ${items.length} ${getPlural(items.length, 'товар', 'товара', 'товаров')} с CTR выше подкатегории`,
    );
    setShowToast(true);
    setAppState('creation');
  }, [buildGrowingDemandMassCreationCampaigns, isBonusesResearchAccess, openSingleCampaign]);

  useEffect(() => {
    if (!pendingReferralCreationNav || profileId !== '2') return;
    consumeReferralCreationNav();
    openSingleCampaign();
  }, [pendingReferralCreationNav, profileId, consumeReferralCreationNav, openSingleCampaign]);

  useEffect(() => {
    if (!pendingSingleCampaignNav) return;
    consumeSingleCampaignNav();
    openSingleCampaign();
  }, [pendingSingleCampaignNav, consumeSingleCampaignNav, openSingleCampaign]);

  useEffect(() => {
    if (appState !== 'single-campaign' && !pendingReferralCreationNav && !pendingSingleCampaignNav) {
      dismissReferralInviteCreationBanner();
    }
  }, [appState, pendingReferralCreationNav, pendingSingleCampaignNav, dismissReferralInviteCreationBanner]);

  const handleNavigationAttempt = (action: () => void) => {
    const hasUnsavedChanges = appState === 'creation' && templateGroups.length > 0;
    if (hasUnsavedChanges) {
      setPendingNavigationAction(() => action);
      setIsConfirmExitOpen(true);
    } else {
      action();
    }
  };

  const handleDownloadForEdit = () => {
    setDownloadCount(selectedListedCampaignIds.length);
    setSelectedListedCampaignIds([]); // Hide island immediately
    setDownloadStatus('loading');

    setTimeout(() => {
        setDownloadStatus('idle');
        setToastMessage("Загрузка завершена");
        setShowToast(true);
        setShowUploadHint(true); // Show hint after download
    }, 2000);
  };

  const handleOpenEditDownloadModal = () => {
    setIsEditDownloadModalOpen(true);
  };

  useEffect(() => {
    if (editingGroupId === null && nextGroupToEdit) {
        handleStartEditing(nextGroupToEdit);
        setNextGroupToEdit(null); 
    }
  }, [editingGroupId, nextGroupToEdit]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', ' ', ','].includes(e.key) && currentSearchInput.trim()) {
        e.preventDefault();
        const newTags = currentSearchInput.trim().split(/[\s,]+/).filter(Boolean);
        setSearchTags(prev => [...new Set([...prev, ...newTags])]);
        setCurrentSearchInput('');
    } else if (e.key === 'Backspace' && !currentSearchInput && searchTags.length > 0) {
        e.preventDefault();
        setSearchTags(prev => prev.slice(0, -1));
    }
  };

  const removeSearchTag = (tagToRemove: string) => {
    setSearchTags(prev => prev.filter(tag => tag !== tagToRemove));
  };
  
  const allValidCampaigns = useMemo(() => 
      templateGroups.flatMap(g => g.campaigns.filter(c => c.status !== CampaignStatus.ERROR)),
      [templateGroups]
  );
  
  const uniqueSources = useMemo(() => Array.from(new Set(allValidCampaigns.map(c => c.source))), [allValidCampaigns]);
  /** Фильтр «Источник» — только если товары загружены из файла (.xlsx / .csv). */
  const uniqueFileSources = useMemo(
    () =>
      uniqueSources.filter((source) =>
        /(^|,\s*)[^,]+?\.(xlsx|xls|csv)(\s*,|$)/i.test(source),
      ),
    [uniqueSources],
  );
  const canFilterBySource = uniqueFileSources.length > 0;
  const uniqueCategories = useMemo(() => Array.from(new Set(allValidCampaigns.map(c => c.category))), [allValidCampaigns]);

  useEffect(() => {
    if (canFilterBySource) return;
    setSelectedSources((prev) => (prev.length === 0 ? prev : []));
  }, [canFilterBySource]);
  
  const areFiltersActive = useMemo(() => {
    return searchTags.length > 0 || currentSearchInput.trim() !== '' || selectedSources.length > 0 || selectedCategories.length > 0;
  }, [searchTags, currentSearchInput, selectedSources, selectedCategories]);

  const filteredCampaigns = useMemo(() => {
    if (!areFiltersActive) return allValidCampaigns;

    return allValidCampaigns.filter(campaign => {
        if (selectedSources.length > 0 && !selectedSources.includes(campaign.source)) return false;
        if (selectedCategories.length > 0 && !selectedCategories.includes(campaign.category)) return false;

        const hasSearchQuery = searchTags.length > 0 || currentSearchInput.trim() !== '';
        if (hasSearchQuery) {
            const allSearchTerms = [...searchTags, ...currentSearchInput.trim().split(/[\s,]+/)].filter(Boolean).map(s => s.toLowerCase());
            const idsToSearch = allSearchTerms.filter(s => !isNaN(Number(s)));
            const textToSearch = allSearchTerms.filter(s => isNaN(Number(s)));
            const campaignText = `${campaign.productName.toLowerCase()} ${campaign.campaignName.toLowerCase()}`;
            const idMatch = idsToSearch.length > 0 ? idsToSearch.includes(String(campaign.nmId)) : true;
            const textMatch = textToSearch.length > 0 ? textToSearch.every(term => campaignText.includes(term)) : true;
            if (idsToSearch.length > 0 && textToSearch.length > 0) {
                if (!idMatch || !textMatch) return false;
            } else if (idsToSearch.length > 0) {
                if (!idMatch) return false;
            } else if (textToSearch.length > 0) {
                if (!textMatch) return false;
            }
        }
        return true;
    });
  }, [allValidCampaigns, selectedSources, selectedCategories, searchTags, currentSearchInput, areFiltersActive]);


  const totalAllValidCount = allValidCampaigns.length;

  const globalTotals = allValidCampaigns.reduce(
    (acc, campaign) => {
        const bonus = effectivePromoBonusAmount(campaign);
        const realSpend = campaign.budget - bonus;
        acc.real += realSpend;
        acc.bonus += bonus;
        acc.total += campaign.budget;
        return acc;
    },
    { real: 0, bonus: 0, total: 0 }
  );

  const globalDeficit = Math.max(0, globalTotals.real - UNIFIED_BALANCE);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);

  const refreshUnifiedBalance = () => {
    if (isRefreshingBalance) return;
    setIsRefreshingBalance(true);
    window.setTimeout(() => setIsRefreshingBalance(false), 700);
  };

  const handleTemplateDownload = (finalConfig: CampaignConfig) => { setGlobalConfig(finalConfig); setToastMessage("Шаблон успешно сформирован и скачан"); setShowToast(true); };

  const handleAddItemSubmit = (config: Pick<CampaignConfig, 'paymentModel' | 'bidType'>, items: CampaignRecord[]) => {
      const sourceFile = items[0]?.source || "Ручное добавление";
      const label = getTemplateGroupLabel(config);

      setTemplateGroups(prev => {
        const existingIndex = prev.findIndex(g =>
          g.config.paymentModel === config.paymentModel && g.config.bidType === config.bidType
        );

        // Если уже есть группа с таким CPM/CPC + типом ставки — добавляем в неё (без дублей по nmId)
        if (existingIndex !== -1) {
          const existing = prev[existingIndex];
          const existingNmIds = new Set(existing.campaigns.map(c => c.nmId));
          const itemsToAdd = items.filter(c => !existingNmIds.has(c.nmId));

          const nextGroup: TemplateGroup = {
            ...existing,
            campaigns: [...existing.campaigns, ...itemsToAdd],
            sourceFiles: new Set([...Array.from(existing.sourceFiles), sourceFile]),
          };

          const next = [...prev];
          next[existingIndex] = nextGroup;

          const skipped = items.length - itemsToAdd.length;
          if (itemsToAdd.length === 0) {
            setToastMessage(`Все выбранные товары уже есть в группе «${label}»`);
          } else if (skipped > 0) {
            setToastMessage(`Добавлено ${itemsToAdd.length} ${getPlural(itemsToAdd.length, 'товар', 'товара', 'товаров')} в группу «${label}», пропущено ${skipped} дубл.`);
          } else {
            setToastMessage(`Добавлено ${itemsToAdd.length} ${getPlural(itemsToAdd.length, 'товар', 'товара', 'товаров')} в группу «${label}»`);
          }
          return next;
        }

        // Иначе создаём новую группу по принципу "объединения в группы"
        const groupId = `group-${config.paymentModel}-${config.bidType}`;
        const newGroup: TemplateGroup = {
          id: groupId,
          config,
          campaigns: items,
          duplicateNmIds: new Set(),
          correctedNmIds: new Set(),
          currentPage: 1,
          sourceFiles: new Set([sourceFile]),
        };

        setToastMessage(`Создана группа «${label}» с ${items.length} ${getPlural(items.length, 'товаром', 'товарами', 'товарами')}`);
        return [...prev, newGroup];
      });
      setShowToast(true);
  };

  const handleNavigateToCreationWithSingleCampaignProducts = useCallback(
    (items: { nmId: number; productName: string; imageUrl: string; category: string }[]) => {
      if (isBonusesResearchAccess) {
        openSingleCampaign();
        return;
      }
      if (!items || items.length === 0) {
        setAppState('creation');
        return;
      }
      const currentDate = new Date().toLocaleDateString('ru-RU');
      const campaigns: CampaignRecord[] = items.map((p, index) => ({
        id: `single-campaign-pick-${p.nmId}-${index}-${Date.now()}`,
        nmId: p.nmId,
        productName: p.productName,
        campaignName: `${p.productName} CPC ${currentDate}`,
        imageUrl: p.imageUrl,
        category: p.category,
        budget: 3000,
        dailyLimit: 1000,
        autoReplenishment: true,
        fundingSource: 'Единый счёт',
        status: CampaignStatus.VALID,
        usePromoBonuses: false,
        source: 'Ручной подбор (одна кампания)',
        prospectCtr: typeof (p as any).conversionRate === 'number' ? (p as any).conversionRate * 100 : 2.5,
        prospectCtrChange: Math.max(0, (p.nmId % 21) - 10) * 2,
        cpcCompatible: true,
        bonusAmount: 0,
        searchBid: CPC_DEFAULT_SEARCH_BID_RUB,
        recommendationsBid: CPC_DEFAULT_SEARCH_BID_RUB,
      }));

      handleAddItemSubmit(
        { paymentModel: PaymentModel.CPC, bidType: BidType.UNIFIED },
        campaigns,
      );
      setAppState('creation');
    },
    [handleAddItemSubmit, isBonusesResearchAccess, openSingleCampaign],
  );

  const massCreationCuratedCatalog = useMemo((): CuratedPickProduct[] => {
    return SINGLE_CAMPAIGN_CURATED_CATALOG.map((p) => ({
      nmId: p.nmId,
      productName: p.productName,
      imageUrl: p.imageUrl,
      category: p.category,
      conversionRate: p.conversionRate,
    }));
  }, []);

  const curatedCatalogAlreadyAddedNmIds = useMemo(
    () => new Set(templateGroups.flatMap((g) => g.campaigns.map((c) => c.nmId))),
    [templateGroups],
  );

  const [wbDiscountPromoteProducts, setWbDiscountPromoteProducts] = useState<
    BulkPaymentModelProduct[] | null
  >(null);

  const handleAddCuratedBundle = (
    items: CuratedPickProduct[],
    _pickId: 'promising',
  ) => {
    const currentDate = new Date().toLocaleDateString('ru-RU');
    const campaigns: CampaignRecord[] = items.map((p, index) => ({
      id: `curated-pick-${p.nmId}-${index}-${Date.now()}`,
      nmId: p.nmId,
      productName: p.productName,
      campaignName: `${p.productName} CPC ${currentDate}`,
      imageUrl: p.imageUrl,
      category: p.category,
      budget: 3000,
      autoReplenishment: false,
      fundingSource: 'Единый счёт',
      status: CampaignStatus.VALID,
      usePromoBonuses: false,
      // Each row should have its own human-readable reason.
      source: PROSPECT_PICK_REASONS[index % PROSPECT_PICK_REASONS.length],
      prospectCtr: typeof p.conversionRate === 'number' ? p.conversionRate * 100 : 2.5,
      prospectCtrChange: Math.max(0, (p.nmId % 21) - 10) * 2,
      cpcCompatible: true,
      bonusAmount: 0,
      searchBid: CPC_DEFAULT_SEARCH_BID_RUB,
      recommendationsBid: CPC_DEFAULT_SEARCH_BID_RUB,
    }));
    handleAddItemSubmit(
      { paymentModel: PaymentModel.CPC, bidType: BidType.UNIFIED },
      campaigns,
    );
  };

  const handleConfirmWbDiscountPromote = (payload: {
    products: BulkPaymentModelProduct[];
    paymentModel: 'CPC' | 'CPM';
    zones: { search: boolean; recommendations: boolean };
  }) => {
    const currentDate = new Date().toLocaleDateString('ru-RU');
    const isCpc = payload.paymentModel === 'CPC';
    const defaultBid = isCpc
      ? CPC_DEFAULT_SEARCH_BID_RUB
      : CPM_DEFAULT_COMPETITIVE_BID_RUB;
    const campaigns: CampaignRecord[] = payload.products.map((p, index) => ({
      id: `wb-discount-pick-${p.nmId}-${index}-${Date.now()}`,
      nmId: p.nmId,
      productName: p.name,
      campaignName: `${p.name} ${payload.paymentModel} ${currentDate}`,
      imageUrl: p.imageUrl,
      category: p.category,
      budget: 3000,
      autoReplenishment: false,
      fundingSource: 'Единый счёт',
      status: CampaignStatus.VALID,
      usePromoBonuses: false,
      source: 'Для скидки WB',
      prospectCtr: 2.5,
      prospectCtrChange: 0,
      cpcCompatible: true,
      bonusAmount: 0,
      searchBid: payload.zones.search ? defaultBid : undefined,
      recommendationsBid: payload.zones.recommendations ? defaultBid : undefined,
    }));
    setWbDiscountPromoteProducts(null);
    setAppState('creation');
    handleAddItemSubmit(
      {
        paymentModel: isCpc ? PaymentModel.CPC : PaymentModel.CPM,
        bidType: BidType.UNIFIED,
      },
      campaigns,
    );
  };

  const handlePageChange = (groupId: string, page: number) => { setTemplateGroups(prev => prev.map(g => g.id === groupId ? { ...g, currentPage: page } : g)); };
    
  const handleUpdateCampaign = (groupId: string, campaignId: string, updates: Partial<CampaignRecord>) => {
      const field = Object.keys(updates)[0] as keyof CampaignRecord;
      const value = Object.values(updates)[0];

      if (field === 'budget') {
          const errorKey = `${campaignId}-${field}`;
          if (Number(value) < 1000) {
              setInlineErrors(prev => ({ ...prev, [errorKey]: 'Мин. 1000 ₽' }));
          } else {
              setInlineErrors(prev => {
                  const newErrors = { ...prev };
                  delete newErrors[errorKey];
                  return newErrors;
              });
          }
      }
      
      const updater = (campaigns: CampaignRecord[]) => campaigns.map(c => c.id === campaignId ? { ...c, ...updates } : c);
      
      // Автосохранение: всегда обновляем данные группы
      setTemplateGroups(prev => prev.map(g => g.id === groupId ? { ...g, campaigns: updater(g.campaigns) } : g));

      // Если сейчас включен режим правок для этой группы — поддерживаем локальное состояние редактируемых кампаний в синхроне
      if (editingGroupId === groupId) {
          setEditedCampaigns(updater);
      }

      // Короткая зелёная нотификация "Сохранено" для любых изменений
      if (editingGroupId === groupId) {
        if (quickSaveTimeoutRef.current) {
          clearTimeout(quickSaveTimeoutRef.current);
        }
        setShowQuickSave(true);
        quickSaveTimeoutRef.current = setTimeout(() => {
          setShowQuickSave(false);
        }, 1500);
      }
  };

  const handleStartEditing = (group: TemplateGroup) => {
    if (editingGroupId && editingGroupId !== group.id) {
        setNextGroupToEdit(group);
        setIsConfirmSwitchEditOpen(true);
    } else if (editingGroupId !== group.id) {
        setEditingGroupId(group.id);
        const campaignsToEdit = group.campaigns.filter(c => c.status !== CampaignStatus.ERROR);
        setEditedCampaigns(campaignsToEdit);
        setOriginalCampaignsWhileEditing(JSON.parse(JSON.stringify(campaignsToEdit)));
    }
  };
  
  const handleSaveEditing = () => {
    if (Object.keys(inlineErrors).length > 0) {
        setToastMessage("Исправьте ошибки в полях перед сохранением");
        setShowToast(true);
        return;
    }
    if (editingGroupId === null) return;

    setTemplateGroups(prev => prev.map(g => (g.id === editingGroupId ? { ...g, campaigns: editedCampaigns } : g)));
    setEditingGroupId(null);
    setEditedCampaigns([]);
    setOriginalCampaignsWhileEditing(null);
    setSelectedCampaignIds([]);
    setInlineErrors({});
    setToastMessage("Изменения сохранены");
    setShowToast(true);
  };
  
  const handleCancelEditing = () => {
    const hasChanges = JSON.stringify(editedCampaigns) !== JSON.stringify(originalCampaignsWhileEditing);
    if (hasChanges) setIsConfirmCancelEditOpen(true);
    else performCancelEditing();
  };

  const performCancelEditing = () => {
      setEditingGroupId(null);
      setEditedCampaigns([]);
      setOriginalCampaignsWhileEditing(null);
      setSelectedCampaignIds([]);
      setIsConfirmCancelEditOpen(false);
      setInlineErrors({});
  }
  
  const openDeleteGroupModal = (group: TemplateGroup) => {
    setGroupToDelete(group);
    setIsConfirmDeleteGroupOpen(true);
  };
  
  const handleConfirmDeleteGroup = () => {
    if (groupToDelete) {
      setTemplateGroups(prev => prev.filter(g => g.id !== groupToDelete.id));
      setToastMessage("Группа кампаний удалена");
      setShowToast(true);
    }
    setIsConfirmDeleteGroupOpen(false);
    setGroupToDelete(null);
  };

  const handleDeleteCampaign = (campaignId: string) => {
      if (deleteUndoTimer.current) clearTimeout(deleteUndoTimer.current);
      if (editingGroupId) {
          const index = editedCampaigns.findIndex(c => c.id === campaignId);
          if (index === -1) return;
          const campaign = editedCampaigns[index];
          setLastDeleted({ campaign, index, groupId: editingGroupId });
          setEditedCampaigns(prev => prev.filter(c => c.id !== campaignId));
      } else {
         let campaignToDelete: CampaignRecord | undefined;
         let groupIndex = -1;
         let campIndex = -1;
         for(let i=0; i<templateGroups.length; i++) {
             const idx = templateGroups[i].campaigns.findIndex(c => c.id === campaignId);
             if (idx !== -1) {
                 campaignToDelete = templateGroups[i].campaigns[idx];
                 groupIndex = i;
                 campIndex = idx;
                 break;
             }
         }
         if (campaignToDelete && groupIndex !== -1) {
             setLastDeleted({ campaign: campaignToDelete, index: campIndex, groupId: templateGroups[groupIndex].id });
             setTemplateGroups(prev => {
                 const newGroups = [...prev];
                 newGroups[groupIndex] = { ...newGroups[groupIndex], campaigns: newGroups[groupIndex].campaigns.filter(c => c.id !== campaignId) };
                 return newGroups;
             });
         }
      }
      setSelectedCampaignIds(prev => prev.filter(id => id !== campaignId));
      deleteUndoTimer.current = setTimeout(() => setLastDeleted(null), 5000);
  };

  const handleUndoDelete = () => {
    if (!lastDeleted) return;
    if (deleteUndoTimer.current) clearTimeout(deleteUndoTimer.current);
    const { campaign, index, groupId } = lastDeleted;
    if (groupId === editingGroupId) {
        setEditedCampaigns(prev => {
            const newCampaigns = [...prev];
            newCampaigns.splice(index, 0, campaign);
            return newCampaigns;
        });
    } else {
        setTemplateGroups(prev => prev.map(g => {
            if (g.id === groupId) {
                const newCampaigns = [...g.campaigns];
                newCampaigns.splice(index, 0, campaign);
                return { ...g, campaigns: newCampaigns };
            }
            return g;
        }));
    }
    setToastMessage(`Кампанию с номером ID ${campaign.nmId} вернули`);
    setShowToast(true);
    setLastDeleted(null);
  };
  
  const launchCampaigns = () => {
    setIsLaunchSummaryModalOpen(true);
  };

  const handleProceedToLaunch = () => {
    setIsLaunchSummaryModalOpen(false);
    if (areFiltersActive) {
      setIsConfirmLaunchWithFiltersOpen(true);
      return;
    }
    if (editingGroupId) {
      setIsConfirmLaunchOpen(true);
      return;
    }
    performLaunch();
  };

  const performLaunch = () => {
    setCreationResult(null);
    setFailedCampaigns([]);
    setIsLaunching(true);
    if (isMassCreationResearchAccess) {
      setAppState('creation');
    } else {
      setAppState('list');
    }
    setIsConfirmLaunchOpen(false);
    setIsConfirmLaunchWithFiltersOpen(false);
  };

  const handleSelectCampaign = (id: string) => {
    setSelectedCampaignIds(prev => prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]);
  };

  const handleSelectAllOnPage = (idsOnPage: string[], checked: boolean) => {
    if (checked) setSelectedCampaignIds(prev => [...new Set([...prev, ...idsOnPage])]);
    else setSelectedCampaignIds(prev => prev.filter(id => !idsOnPage.includes(id)));
  };

  const uniqueCategoriesForSelection = useMemo(() => {
      if (currentBulkAction !== 'bid' || selectedCampaignIds.length === 0) return [];
      const allCampaigns = templateGroups.flatMap(g => g.campaigns);
      const selectedCampaigns = allCampaigns.filter(c => selectedCampaignIds.includes(c.id));
      return [...new Set(selectedCampaigns.map(c => c.category))];
  }, [selectedCampaignIds, currentBulkAction, templateGroups]);

    const openBulkActionModal = (
      action: BulkActionType,
      paymentModelFilter?: PaymentModel,
    ) => {
        setClearSelectionOnBulkClose(false);
        setListBudgetTargetIds(null);
        if (action === 'delete') {
            setIsConfirmBulkDeleteOpen(true);
            return;
        }
        
        if (action === 'autobidder') {
            // Автобиддер только для CPC
            const selectedIds = new Set(selectedCampaignIds);
            let scopedCount = 0;

            for (const g of templateGroups) {
                if (g.config.paymentModel !== PaymentModel.CPC) continue;
                for (const c of g.campaigns) {
                    if (selectedIds.has(c.id)) scopedCount += 1;
                }
            }

            if (scopedCount === 0) {
                setToastMessage('Автобиддер доступен только для CPC-кампаний');
                setShowToast(true);
                return;
            }

            setAutobidderBulkPaymentModel(PaymentModel.CPC);
        } else {
            setAutobidderBulkPaymentModel(null);
        }

        const campaignsToInspect = editingGroupId ? editedCampaigns : allValidCampaigns;

        if (action === 'budget') {
            const selected = campaignsToInspect.filter(c => selectedCampaignIds.includes(c.id));
            if (selected.length > 0) {
                const first = selected[0];
                const allSame = selected.every(c =>
                    c.budget === first.budget &&
                    (c.bonusAmount || 0) === (first.bonusAmount || 0) &&
                    c.usePromoBonuses === first.usePromoBonuses
                );
                if (allSame) {
                    setBulkEditPrefillData({
                        budget: first.budget,
                        bonusAmount: first.bonusAmount || 0,
                        useBonuses: first.usePromoBonuses,
                    });
                } else {
                    setBulkEditPrefillData(null);
                }
            } else {
                setBulkEditPrefillData(null);
            }
        }
        setCurrentBulkAction(action);
        setIsBulkActionModalOpen(true);
    };

    const closeBulkActionModal = () => {
    setIsBulkActionModalOpen(false);
    setAutobidderBulkPaymentModel(null);
    setListBudgetTargetIds(null);
    if (clearSelectionOnBulkClose) {
      setSelectedCampaignIds([]);
      setClearSelectionOnBulkClose(false);
    }
  };

  const handleBulkDelete = () => {
      setTemplateGroups(prev => prev.map(group => ({ ...group, campaigns: group.campaigns.filter(c => !selectedCampaignIds.includes(c.id)) })).filter(g => g.campaigns.length > 0)); 
      if (editingGroupId) setEditedCampaigns(prev => prev.filter(c => !selectedCampaignIds.includes(c.id)));
      setToastMessage(`Удалено ${selectedCampaignIds.length} ${getPlural(selectedCampaignIds.length, 'кампания', 'кампании', 'кампаний')}`);
      setShowToast(true);
  };

    const applyBulkChanges = (
      value: any,
      idsToUpdate: string[],
      actionOverride?: BulkActionType,
      options?: { skipClose?: boolean; toastMessage?: string },
    ) => {
        const action = actionOverride ?? currentBulkAction;
        const updateLogic = (campaign: CampaignRecord): CampaignRecord => {
            if (!idsToUpdate.includes(campaign.id)) return campaign;
            const newCamp = { ...campaign };
            if (action === 'budget') {
                newCamp.budget = Number(value.total);
                newCamp.bonusAmount = value.isBonusActive ? value.bonus : 0;
                newCamp.usePromoBonuses = value.isBonusActive;
                if (value.selectedPkg?.id) newCamp.bonusPackageId = value.selectedPkg.id;
            }
            if (action === 'autorefill') {
                newCamp.autoReplenishment =
                  typeof value === 'object' && value !== null && 'enabled' in value
                    ? Boolean(value.enabled)
                    : Boolean(value);
                if (typeof value === 'object' && value !== null && 'useBonuses' in value) {
                  newCamp.usePromoBonuses = Boolean(value.useBonuses);
                }
                if (typeof value === 'object' && value !== null) {
                  if (typeof value.threshold === 'number' && value.threshold > 0) {
                    newCamp.autoRefillThreshold = value.threshold;
                  }
                  if (typeof value.amount === 'number' && value.amount > 0) {
                    newCamp.autoRefillAmount = value.amount;
                  }
                }
            }
            if (action === 'bid') {
                const isMultiCategory = typeof value === 'object' && value !== null && !Array.isArray(value);
                const newBid = isMultiCategory ? value[campaign.category] : value;
                if (newBid !== undefined && newBid !== '') {
                    if (newCamp.bid !== undefined) newCamp.bid = Number(newBid);
                    if (newCamp.searchBid !== undefined) newCamp.searchBid = Number(newBid);
                    if (newCamp.recommendationsBid !== undefined) newCamp.recommendationsBid = Number(newBid);
                }
            }
            return newCamp;
        };
        
        if (editingGroupId) {
            setEditedCampaigns(prev => prev.map(updateLogic));
        }
        
        // Always update the base groups so changes persist after editing
        setTemplateGroups(prev => prev.map(group => ({ ...group, campaigns: group.campaigns.map(updateLogic) })));

        if (!options?.skipClose) {
          setToastMessage(
            options?.toastMessage ??
              `Обновлено ${idsToUpdate.length} ${getPlural(idsToUpdate.length, 'кампания', 'кампании', 'кампаний')}`,
          );
          setShowToast(true);
          closeBulkActionModal();
        }
    };

    const applyBudgetRefillFromModal = (
      amount: number,
      extras:
        | {
            useBonuses?: boolean;
            bonusAmount?: number;
            packageId?: string;
            autoRefill?: { enabled: boolean; threshold: number; amount: number };
          }
        | undefined,
      ids: string[],
    ) => {
      const pkg =
        BONUS_PACKAGES.find((item) => item.id === extras?.packageId) ?? BONUS_PACKAGES[0];
      const budgetValue = {
        __mode: 'budget' as const,
        total: amount,
        isBonusActive: Boolean(extras?.useBonuses && (extras.bonusAmount ?? 0) > 0),
        bonus: extras?.bonusAmount ?? 0,
        selectedPkg: pkg,
      };

      if (listBudgetTargetIds && listBudgetTargetIds.length > 0) {
        listBudgetApplierRef.current?.(ids, budgetValue as unknown as Record<string, unknown>);
        if (extras?.autoRefill?.enabled) {
          listBudgetApplierRef.current?.(ids, {
            __mode: 'autorefill',
            enabled: true,
            threshold: extras.autoRefill.threshold,
            amount: extras.autoRefill.amount,
            useBonuses: Boolean(extras.useBonuses),
          });
        }
        const count = ids.length;
        setToastMessage(
          extras?.autoRefill?.enabled
            ? `Бюджет и автопополнение обновлены для ${count} ${getPlural(count, 'кампании', 'кампаний', 'кампаний')}`
            : `Бюджет обновлён для ${count} ${getPlural(count, 'кампании', 'кампаний', 'кампаний')}`,
        );
        setShowToast(true);
        closeBulkActionModal();
        return;
      }

      const withAuto = Boolean(extras?.autoRefill?.enabled);
      applyBulkChanges(budgetValue, ids, 'budget', {
        skipClose: withAuto,
      });
      if (withAuto && extras?.autoRefill) {
        applyBulkChanges(
          {
            enabled: true,
            threshold: extras.autoRefill.threshold,
            amount: extras.autoRefill.amount,
            useBonuses: Boolean(extras.useBonuses),
          },
          ids,
          'autorefill',
          {
            toastMessage: `Бюджет и автопополнение обновлены для ${ids.length} ${getPlural(
              ids.length,
              'кампании',
              'кампаний',
              'кампаний',
            )}`,
          },
        );
      }
    };

    const handleBulkSave = (value: any) => {
        const mode = value?.__mode as string | undefined;
        const action =
          mode === 'budget'
            ? 'budget'
            : mode === 'autorefill'
              ? 'autorefill'
              : mode === 'autobidder'
                ? 'autobidder'
                : currentBulkAction;

        if (listBudgetTargetIds && listBudgetTargetIds.length > 0) {
          listBudgetApplierRef.current?.(listBudgetTargetIds, value as Record<string, unknown>);
          const count = listBudgetTargetIds.length;
          setToastMessage(
            action === 'autorefill'
              ? value?.enabled === false
                ? `Автопополнение отключено для ${count} ${getPlural(count, 'кампании', 'кампаний', 'кампаний')}`
                : `Автопополнение настроено для ${count} ${getPlural(count, 'кампании', 'кампаний', 'кампаний')}`
              : `Бюджет обновлён для ${count} ${getPlural(count, 'кампании', 'кампаний', 'кампаний')}`,
          );
          setShowToast(true);
          closeBulkActionModal();
          return;
        }

        if (action === 'autobidder') {
            const position = (value?.position ?? DEFAULT_BID_CHASING_POSITION) as BidChasingPosition;
            const maxBid = Number(value?.maxBid);
            const maxBidsById = (value?.maxBidsById ?? {}) as Record<string, number>;
            const positionsById = (value?.positionsById ?? {}) as Record<
              string,
              BidChasingPosition
            >;
            const modelFilter = autobidderBulkPaymentModel;
            const scopedIds = selectedCampaignIds.filter((id) =>
              modelFilter == null
                ? true
                : templateGroups.some(
                    (g) =>
                      g.config.paymentModel === modelFilter &&
                      g.campaigns.some((c) => c.id === id),
                  ),
            );
            const scopedCampaigns = selectedCreationCampaigns.filter((c) =>
              scopedIds.includes(c.id),
            );
            const fallbackMaxBid =
              Number.isFinite(maxBid) && maxBid > 0
                ? maxBid
                : scopedCampaigns.length > 0
                  ? Math.max(
                      15,
                      ...scopedCampaigns.map((c) =>
                        Math.max(c.bid ?? 0, c.searchBid ?? 0, 15),
                      ),
                    )
                  : 15;
            const hasPerRowPositions = scopedIds.some((id) => positionsById[id] != null);
            setCreationAutobidderSetup((prev) => {
              const next = { ...prev };
              for (const id of scopedIds) {
                const rowMax =
                  Number.isFinite(maxBidsById[id]) && maxBidsById[id] > 0
                    ? maxBidsById[id]
                    : fallbackMaxBid;
                next[id] = {
                  mode: 'positions',
                  settings:
                    prev[id]?.settings ?? createDefaultAdvancedDailyLimitSettings(),
                  position: positionsById[id] ?? position,
                  maxBid: rowMax,
                };
              }
              return next;
            });
            closeBulkActionModal();
            const modelLabel = modelFilter ? ` ${modelFilter}` : '';
            const positionLabel = hasPerRowPositions
              ? 'ручная настройка'
              : formatBidChasingPositionLabel(position);
            setToastMessage(
              `Автобиддер${modelLabel} (${positionLabel}) настроен для ${scopedIds.length} ${getPlural(scopedIds.length, 'кампании', 'кампаний', 'кампаний')}`,
            );
            setShowToast(true);
            return;
        }

        if (action === 'autorefill') {
            applyBulkChanges(value, selectedCampaignIds, 'autorefill');
            return;
        }

        if (action === 'budget' && value.isBonusActive) {
            const selectedPkg = value.selectedPkg as BonusPackage;
            const requested = Number(value.bonus);
            const cap = maxBonusForBudget(
              selectedPkg,
              Number(value.total),
              selectedPkg.amount,
            );
            const bonusPerCampaign = Math.min(Math.max(0, requested), cap);
            const bonusClamped = Number.isFinite(requested) && requested > bonusPerCampaign;
            const nextValue = {
              ...value,
              bonus: bonusPerCampaign,
              isBonusActive: bonusPerCampaign > 0,
            };

            if (bonusPerCampaign <= 0) {
                applyBulkChanges(
                  { ...nextValue, isBonusActive: false, bonus: 0 },
                  selectedCampaignIds,
                  'budget',
                );
                if (bonusClamped || (Number.isFinite(requested) && requested > 0)) {
                  setToastMessage('Пополнили промобонусами только на доступное количество');
                  setShowToast(true);
                }
                return;
            }

            const fullCoverageCount = Math.floor(selectedPkg.amount / bonusPerCampaign);
            
            if (fullCoverageCount >= selectedCampaignIds.length) {
                applyBulkChanges(nextValue, selectedCampaignIds, 'budget');
                if (bonusClamped) {
                  setToastMessage('Пополнили промобонусами только на доступное количество');
                  setShowToast(true);
                }
            } else {
                const remainingBonuses = selectedPkg.amount % bonusPerCampaign;
                setBonusAppContext({ value: nextValue, fullCoverageCount, remainingBonuses });
                setIsBonusInsufficiencyModalOpen(true);
            }
            return;
        }
        applyBulkChanges(value, selectedCampaignIds, action);
    };
    
    const handleConfirmPartialBonusApplication = () => {
        if (!bonusAppContext) return;
    
        const { value, fullCoverageCount, remainingBonuses } = bonusAppContext;
        const bonusPerCampaign = Number(value.bonus);
        
        const fullCoverageIds = selectedCampaignIds.slice(0, fullCoverageCount);
        const partialCoverageId = remainingBonuses > 0 && selectedCampaignIds.length > fullCoverageCount 
            ? selectedCampaignIds[fullCoverageCount] 
            : null;
    
        const partialUpdateLogic = (campaign: CampaignRecord): CampaignRecord => {
            if (!selectedCampaignIds.includes(campaign.id)) {
                return campaign;
            }
    
            const newCamp = { ...campaign };
            newCamp.budget = Number(value.total);
            newCamp.usePromoBonuses = true;
    
            if (fullCoverageIds.includes(campaign.id)) {
                newCamp.bonusAmount = bonusPerCampaign;
            } else if (partialCoverageId && campaign.id === partialCoverageId) {
                newCamp.bonusAmount = remainingBonuses;
            } else {
                newCamp.bonusAmount = 0;
            }
            return newCamp;
        };
    
        if (editingGroupId) {
            setEditedCampaigns(prev => prev.map(partialUpdateLogic));
        }
        setTemplateGroups(prev => prev.map(group => ({ ...group, campaigns: group.campaigns.map(partialUpdateLogic) })));

        const appliedCount = fullCoverageCount + (partialCoverageId ? 1 : 0);
        setToastMessage(`Бонусы применены к ${appliedCount} ${getPlural(appliedCount, 'кампании', 'кампаниям', 'кампаниям')}`);
        setShowToast(true);
    
        setIsBonusInsufficiencyModalOpen(false);
        closeBulkActionModal();
        setBonusAppContext(null);
    };

    const handleSaveBonusForCampaign = (value: any) => {
        if (!campaignForBonusEdit) return;

        if (value?.__mode === 'autorefill' && value.total == null) {
          const patch: Partial<CampaignRecord> = {
            autoReplenishment: Boolean(value.enabled),
            ...(typeof value.useBonuses === 'boolean'
              ? { usePromoBonuses: value.useBonuses }
              : null),
            ...(typeof value.threshold === 'number' && value.threshold > 0
              ? { autoRefillThreshold: value.threshold }
              : null),
            ...(typeof value.amount === 'number' && value.amount > 0
              ? { autoRefillAmount: value.amount }
              : null),
          };
          const group = templateGroups.find((g) =>
            g.campaigns.some((c) => c.id === campaignForBonusEdit.id),
          );
          if (group) {
            handleUpdateCampaign(group.id, campaignForBonusEdit.id, patch);
          }
          if (editingGroupId) {
            setEditedCampaigns((prev) =>
              prev.map((c) => (c.id === campaignForBonusEdit.id ? { ...c, ...patch } : c)),
            );
          }
          setCampaignForBonusEdit(null);
          setToastMessage('Настройки автопополнения сохранены');
          setShowToast(true);
          return;
        }

        const selectedPkg = (value.selectedPkg as BonusPackage | undefined) ?? BONUS_PACKAGES[0];
        const requested = value.isBonusActive ? Number(value.bonus) : 0;
        const packageBalance =
          typeof selectedPkg.amount === 'number'
            ? selectedPkg.amount
            : packageBalanceAfterCampaigns(
                selectedPkg.id,
                editingGroupId ? editedCampaigns : allValidCampaigns,
                new Set([campaignForBonusEdit.id]),
              );
        const cap = maxBonusForBudget(selectedPkg, Number(value.total), packageBalance);
        const appliedBonus = value.isBonusActive
          ? Math.min(Math.max(0, requested), cap)
          : 0;
        const bonusClamped = Boolean(value.isBonusActive) && Number.isFinite(requested) && requested > appliedBonus;
        const auto = value.autoRefill as
          | { enabled: boolean; threshold: number; amount: number }
          | undefined;

        const patch: Partial<CampaignRecord> = {
            budget: Number(value.total),
            bonusAmount: appliedBonus,
            usePromoBonuses: appliedBonus > 0,
            ...(selectedPkg.id ? { bonusPackageId: selectedPkg.id } : null),
            ...(auto?.enabled
              ? {
                  autoReplenishment: true,
                  autoRefillThreshold: auto.threshold,
                  autoRefillAmount: auto.amount,
                }
              : null),
        };

        const group = templateGroups.find((g) =>
          g.campaigns.some((c) => c.id === campaignForBonusEdit.id),
        );
        if (group) {
          handleUpdateCampaign(group.id, campaignForBonusEdit.id, patch);
        }
        if (editingGroupId) {
          setEditedCampaigns((prev) =>
            prev.map((c) => (c.id === campaignForBonusEdit.id ? { ...c, ...patch } : c)),
          );
        }

        setCampaignForBonusEdit(null);
        if (bonusClamped) {
          setToastMessage('Пополнили промобонусами только на доступное количество');
          setShowToast(true);
        } else if (auto?.enabled) {
          setToastMessage('Бюджет и автопополнение сохранены');
          setShowToast(true);
        }
    };

  const openSingleBudgetModal = (
    campaign: CampaignRecord,
    tab: 'budget' | 'autorefill' = 'budget',
  ) => {
    setSingleReplenishAction(tab);
    setCampaignForBonusEdit(campaign);
  };
  const handleSaveAutoRefill = (settings: {
    threshold: number;
    amount: number;
    usePromoBonuses: boolean;
  }) => {
    if (campaignForAutoRefill) {
      const patch: Partial<CampaignRecord> = {
        autoReplenishment: true,
        autoRefillThreshold: settings.threshold,
        autoRefillAmount: settings.amount,
        usePromoBonuses: settings.usePromoBonuses,
      };
      const group = templateGroups.find((g) =>
        g.campaigns.some((c) => c.id === campaignForAutoRefill.id),
      );
      if (group) {
        handleUpdateCampaign(group.id, campaignForAutoRefill.id, patch);
      }
      if (editingGroupId) {
        setEditedCampaigns((prev) =>
          prev.map((c) =>
            c.id === campaignForAutoRefill.id ? { ...c, ...patch } : c,
          ),
        );
      }
    }
    setIsAutoRefillModalOpen(false);
    setCampaignForAutoRefill(null);
    setToastMessage('Настройки автопополнения сохранены');
    setShowToast(true);
  };

  const selectedCreationCampaigns = useMemo(() => {
    const ids = new Set(selectedCampaignIds);
    return templateGroups.flatMap((g) => g.campaigns.filter((c) => ids.has(c.id)));
  }, [selectedCampaignIds, templateGroups]);

  const creationBulkBidTargetsAvailable = useMemo((): CreationBulkBidTarget[] => {
    const ids = new Set(selectedCampaignIds);
    const targets = new Set<CreationBulkBidTarget>();
    for (const group of templateGroups) {
      const selectedInGroup = group.campaigns.some((c) => ids.has(c.id));
      if (!selectedInGroup) continue;
      if (group.config.paymentModel === PaymentModel.CPC) {
        targets.add('cpc-search');
        targets.add('cpc-recs');
      } else if (group.config.bidType === BidType.MANUAL) {
        targets.add('cpm-search');
        targets.add('cpm-recs');
      } else {
        targets.add('cpm-unified');
      }
    }
    return CREATION_BULK_BID_OPTIONS.map((o) => o.id).filter((id) => targets.has(id));
  }, [selectedCampaignIds, templateGroups]);

  const selectedCreationBulkBidItems = useMemo((): BulkSearchBidItem[] => {
    const source = editingGroupId ? editedCampaigns : allValidCampaigns;
    const ids = new Set(selectedCampaignIds);
    const defaultBid =
      creationBulkBidTarget.startsWith('cpm')
        ? CPM_DEFAULT_COMPETITIVE_BID_RUB
        : CPC_DEFAULT_SEARCH_BID_RUB;

    return source
      .filter((c) => {
        if (!ids.has(c.id)) return false;
        const group = templateGroups.find((g) => g.campaigns.some((gc) => gc.id === c.id));
        if (!group) return false;
        if (creationBulkBidTarget === 'cpc-search') {
          return group.config.paymentModel === PaymentModel.CPC && c.searchBid != null;
        }
        if (creationBulkBidTarget === 'cpc-recs') {
          return (
            group.config.paymentModel === PaymentModel.CPC && c.recommendationsBid != null
          );
        }
        if (creationBulkBidTarget === 'cpm-search') {
          return (
            group.config.paymentModel === PaymentModel.CPM &&
            group.config.bidType === BidType.MANUAL &&
            c.searchBid != null
          );
        }
        if (creationBulkBidTarget === 'cpm-recs') {
          return (
            group.config.paymentModel === PaymentModel.CPM &&
            group.config.bidType === BidType.MANUAL &&
            c.recommendationsBid != null
          );
        }
        return (
          group.config.paymentModel === PaymentModel.CPM &&
          group.config.bidType !== BidType.MANUAL
        );
      })
      .map((c) => {
        const bid =
          creationBulkBidTarget === 'cpc-search' || creationBulkBidTarget === 'cpm-search'
            ? c.searchBid ?? defaultBid
            : creationBulkBidTarget === 'cpc-recs' || creationBulkBidTarget === 'cpm-recs'
              ? c.recommendationsBid ?? defaultBid
              : c.bid ?? c.searchBid ?? defaultBid;
        return {
          id: c.id,
          name: c.productName,
          imageUrl: c.imageUrl,
          brand: c.category,
          article: String(c.nmId),
          bid,
          recommendedByTier: buildBulkSearchRecommendedTiers(c.nmId || c.id.length),
        };
      });
  }, [
    editingGroupId,
    editedCampaigns,
    allValidCampaigns,
    selectedCampaignIds,
    templateGroups,
    creationBulkBidTarget,
  ]);

  const selectedCreationBulkAutobidderProducts = useMemo((): BidChasingModalProduct[] => {
    const source = editingGroupId ? editedCampaigns : allValidCampaigns;
    const ids = new Set(selectedCampaignIds);
    return source
      .filter((c) => {
        if (!ids.has(c.id)) return false;
        if (autobidderBulkPaymentModel == null) return true;
        return templateGroups.some(
          (g) =>
            g.config.paymentModel === autobidderBulkPaymentModel &&
            g.campaigns.some((gc) => gc.id === c.id),
        );
      })
      .map((c) => ({
        id: c.id,
        name: c.productName,
        imageUrl: c.imageUrl,
        brand: c.category,
        article: String(c.nmId),
        seed: c.nmId || c.id.length,
      }));
  }, [
    editingGroupId,
    editedCampaigns,
    allValidCampaigns,
    selectedCampaignIds,
    autobidderBulkPaymentModel,
    templateGroups,
  ]);

  const creationBulkCampaignBudget = useMemo(() => {
    if (selectedCreationCampaigns.length === 0) return 0;
    return Math.min(...selectedCreationCampaigns.map((c) => c.budget || 0));
  }, [selectedCreationCampaigns]);

  const creationBulkMaxBid = useMemo(() => {
    if (selectedCreationCampaigns.length === 0) return DAILY_LIMIT_ABSOLUTE_MIN;
    return Math.max(
      DAILY_LIMIT_ABSOLUTE_MIN,
      ...selectedCreationCampaigns.map((c) =>
        Math.max(c.bid ?? 0, c.searchBid ?? 0, c.recommendationsBid ?? 0),
      ),
    );
  }, [selectedCreationCampaigns]);

  const applyPatchToSelectedCreationCampaigns = useCallback(
    (patch: Partial<CampaignRecord> | ((c: CampaignRecord) => Partial<CampaignRecord>)) => {
      const ids = new Set(selectedCampaignIds);
      const resolve = typeof patch === 'function' ? patch : () => patch;
      setTemplateGroups((prev) =>
        prev.map((group) => ({
          ...group,
          campaigns: group.campaigns.map((c) => (ids.has(c.id) ? { ...c, ...resolve(c) } : c)),
        })),
      );
      if (editingGroupId) {
        setEditedCampaigns((prev) =>
          prev.map((c) => (ids.has(c.id) ? { ...c, ...resolve(c) } : c)),
        );
      }
    },
    [selectedCampaignIds, editingGroupId],
  );

  const openCreationBulkDailyLimit = () => {
    const withLimit = selectedCreationCampaigns.find((c) => c.dailyLimit != null && c.dailyLimit > 0);
    const hasExisting = withLimit?.dailyLimit != null && withLimit.dailyLimit > 0;
    const limitStr = hasExisting
      ? String(withLimit!.dailyLimit)
      : String(DAILY_LIMIT_ABSOLUTE_MIN);
    setCreationBulkDailyLimitEnabled(hasExisting);
    setCreationBulkDailyLimitValue(limitStr);
    setCreationBulkSavedDailyLimit(limitStr);
    setCreationBulkDailyLimitSettings(createDefaultAdvancedDailyLimitSettings());
    setCreationBulkCarryover(true);
    setCreationBulkAutoRefillOnRules(true);
    setIsCreationBulkDailyLimitOpen(true);
  };

  const openCreationZonesModal = () => {
    const allSearchOn = selectedCreationCampaigns.every((c) => c.searchBid != null || c.bid != null);
    const allRecsOn = selectedCreationCampaigns.every(
      (c) => c.recommendationsBid != null || c.bid != null,
    );
    const anyZones = selectedCreationCampaigns.some(
      (c) => c.searchBid != null || c.recommendationsBid != null,
    );
    setCreationZonesDraft({
      search: anyZones ? selectedCreationCampaigns.some((c) => c.searchBid != null) || allSearchOn : true,
      recommendations: anyZones
        ? selectedCreationCampaigns.some((c) => c.recommendationsBid != null)
        : true,
    });
    setIsCreationZonesModalOpen(true);
  };

  const launchPreview = useMemo(() => {
    const configured = computeLaunchAffordability(allValidCampaigns);
    const hasConfiguredBonuses = configured.bonusToDebit > 0;
    const alreadyDistributed = configured.bonusToDebit;
    const zeroedCampaigns = allValidCampaigns.map((campaign) => ({
      ...campaign,
      usePromoBonuses: false,
      bonusAmount: 0,
      bonusPackageId: undefined,
    }));
    const potentialAllocation = suggestPromoBonusAllocation(zeroedCampaigns, demoBonusPackages);
    const suggestedAllocation = hasConfiguredBonuses
      ? potentialAllocation
      : suggestPromoBonusAllocation(allValidCampaigns, demoBonusPackages);
    const maxDistributable = potentialAllocation.totalBonus;
    const maxAdditional = Math.max(0, maxDistributable - alreadyDistributed);
    const canOfferBonuses = !hasConfiguredBonuses && suggestedAllocation.totalBonus > 0;
    const canOfferMoreBonuses = maxAdditional > 0;
    const bonusById = new Map(
      [...potentialAllocation.perCampaign.entries()].map(([id, value]) => [
        id,
        value.bonusAmount,
      ]),
    );
    const withSuggestedBonuses = computeLaunchAffordability(allValidCampaigns, bonusById);
    const distribution: BonusDistributionRow[] = allValidCampaigns
      .filter((c) => bonusById.has(c.id))
      .map((c) => ({
        id: c.id,
        name: c.campaignName || c.productName,
        budget: c.budget,
        bonus: bonusById.get(c.id) ?? 0,
      }));

    const promoAccountBalance = demoBonusPackages.reduce(
      (sum, pkg) => sum + remainingDemoPackageBalance(pkg, allValidCampaigns),
      0,
    );

    return {
      ...configured,
      hasConfiguredBonuses,
      alreadyDistributed,
      canOfferBonuses,
      canOfferMoreBonuses,
      maxDistributable,
      maxAdditional,
      suggestedAllocation,
      potentialAllocation,
      withSuggestedBonuses,
      distribution,
      promoAccountBalance,
    };
  }, [allValidCampaigns, demoBonusPackages]);

  /** `amount` — итоговая сумма бонусов по всем кампаниям (абсолют), не «добавка». */
  const applyPromoBonusesAmount = useCallback((amount: number) => {
    const allocation = launchPreview.potentialAllocation;
    if (!allocation || allocation.totalBonus <= 0 || amount <= 0) return;

    const entries = [...allocation.perCampaign.entries()];
    const shares = evenBonusShares(
      entries.map(([, value]) => value.bonusAmount),
      Math.min(amount, allocation.totalBonus),
    );
    const assignedById = new Map(
      entries.map(([id, value], i) => [id, { ...value, bonusAmount: shares[i] }]),
    );

    const applyToCampaign = (campaign: CampaignRecord): CampaignRecord => {
      const assigned = assignedById.get(campaign.id);
      if (!assigned || assigned.bonusAmount <= 0) {
        return {
          ...campaign,
          usePromoBonuses: false,
          bonusAmount: 0,
          bonusPackageId: undefined,
        };
      }
      return {
        ...campaign,
        usePromoBonuses: true,
        bonusAmount: assigned.bonusAmount,
        bonusPackageId: assigned.packageId,
      };
    };

    setTemplateGroups((prev) =>
      prev.map((group) => ({
        ...group,
        campaigns: group.campaigns.map(applyToCampaign),
      })),
    );
    if (editingGroupId) {
      setEditedCampaigns((prev) => prev.map(applyToCampaign));
    }
    setToastMessage('Промобонусы распределены');
    setShowToast(true);
  }, [launchPreview.potentialAllocation, editingGroupId]);

  useEffect(() => {
    if (isLaunching) {
      const timer = setTimeout(() => {
        let currentBalance = UNIFIED_BALANCE;
        const successful = [];
        const failed = [];

        for (const campaign of allValidCampaigns) {
          const bonus = effectivePromoBonusAmount(campaign);
          const realCost = campaign.budget - bonus;
          if (currentBalance >= realCost) {
            currentBalance -= realCost;
            successful.push(campaign);
          } else {
            failed.push({
              ...campaign,
              errorMessage: 'Недостаточно средств на Едином счёте',
            });
          }
        }

        setCreationResult({ success: successful.length, error: failed.length });
        setFailedCampaigns(failed);
        setIsLaunching(false);
        if (isMassCreationResearchAccess) {
          setTemplateGroups([]);
          setEditingGroupId(null);
          setEditedCampaigns([]);
          setSelectedCampaignIds([]);
          setInlineErrors({});
          setToastMessage(
            successful.length > 0
              ? `Запущено: ${successful.length}`
              : 'Запуск завершён',
          );
          setShowToast(true);
        }
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isLaunching, allValidCampaigns, isMassCreationResearchAccess]);

  const editableInputClass = "w-full text-sm bg-white border shadow-sm outline-none transition-colors focus:border-purple-500 focus:ring-1 focus:ring-purple-500 px-2 py-1.5 rounded-lg";
  const [showQuickSave, setShowQuickSave] = useState(false);
  const quickSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showApplyToAllTooltipFor, setShowApplyToAllTooltipFor] = useState<string | null>(null);
  const hasActiveFilterTags = selectedSources.length > 0 || selectedCategories.length > 0;

  if (!isAuthenticated) {
    return (
      <AuthScreen
        onAuth={(destination) => {
          try {
            sessionStorage.setItem(AUTH_SESSION_KEY, '1');
          } catch {
            /* ignore */
          }
          writeAuthDestination(destination);
          setAuthDestination(destination);
          setIsAuthenticated(true);
          if (destination === 'bonuses') {
            setAppState('list');
            navigate(PRODUCT_PROMOTION_CONCEPT_PATH, { replace: true });
            return;
          }
          if (destination === 'mass-creation') {
            setAppState('creation');
            return;
          }
        }}
      />
    );
  }

  if (!isMassCreationResearchAccess && !isBonusesResearchAccess && appState === 'editing') {
    return (
      <MassEditPage 
        onNavigateToList={() => {
          setIsFromExcelModal(false);
          handleNavigationAttempt(handleNavigateToList);
        }} 
        onStartApplyingEdits={handleApplyEdits}
        fromExcelModal={isFromExcelModal}
      />
    );
  }

  if (!isMassCreationResearchAccess && appState === 'single-campaign') {
    return (
      <SingleCampaignPage 
        onBack={() => handleNavigationAttempt(handleNavigateToList)}
        onNavigateToMassCreation={(items) => {
          if (isBonusesResearchAccess) {
            setToastMessage('Кампания запущена');
            setShowToast(true);
            handleNavigateToList();
            return;
          }
          handleNavigationAttempt(() =>
            handleNavigateToCreationWithSingleCampaignProducts(items),
          );
        }}
        researchAccess={isBonusesResearchAccess ? 'bonuses' : null}
      />
    );
  }

  // Новый селлер: сразу экран создания (не ждём appState — иначе ломается на гонке с Routes)
  if (
    !isMassCreationResearchAccess &&
    !isBonusesResearchAccess &&
    isNewSellerProfile(profileId) &&
    !isNewSellerSecondaryShellPath(location.pathname)
  ) {
    return (
      <NewSellerFirstCampaignPage
        onBack={openNewSellerCampaignCreation}
        onOpenCampaignCreation={openNewSellerCampaignCreation}
      />
    );
  }

  if (!isMassCreationResearchAccess && appState === 'list') {
    const campaignsListContent = (
      <>
                <main className="mx-auto w-full min-h-[calc(100vh-3.5rem)] max-w-[1920px] bg-[#F3F5F8] px-7 pt-4 pb-10">
                  <SuccessPage
                    isLaunching={isLaunching}
                    launchTotal={totalAllValidCount}
                    launchResult={creationResult}
                    failedCampaigns={failedCampaigns}
                    onClearLaunchResult={() => setCreationResult(null)}
                    onNavigateToCreation={() => {
                      if (isBonusesResearchAccess) {
                        openSingleCampaign();
                        return;
                      }
                      handleNavigationAttempt(handleNavigateToCreation);
                    }}
                    onNavigateToCreationWithProducts={(items) => {
                      if (isBonusesResearchAccess) {
                        openSingleCampaign();
                        return;
                      }
                      handleNavigationAttempt(() =>
                        handleNavigateToCreationWithSingleCampaignProducts(items),
                      );
                    }}
                    onNavigateToCreationWithGrowingDemand={() => {
                      if (isBonusesResearchAccess) {
                        openSingleCampaign();
                        return;
                      }
                      handleNavigationAttempt(handleNavigateToCreationWithGrowingDemand);
                    }}
                    onConfirmWbDiscountPromote={handleConfirmWbDiscountPromote}
                    onOpenUploadEditsModal={() => {
                      if (isBonusesResearchAccess) return;
                      setIsUploadEditsModalOpen(true);
                    }}
                    selectedCampaigns={selectedListedCampaignIds}
                    onSelectionChange={setSelectedListedCampaignIds}
                    isApplyingEdits={isApplyingEdits}
                    onCancelEdits={handleCancelEdits}
                    onOpenReview={() => setIsReviewEditsModalOpen(true)}
                    onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
                    showUploadHint={showUploadHint}
                    onDismissUploadHint={() => setShowUploadHint(false)}
                    onOpenCpcCampaign={({
                      campaignId,
                      name,
                      paymentModel,
                      remainingBudget,
                      dailyLimit,
                      scheduledDailyLimit,
                      dailyLimitExhausted,
                      autoRefill,
                      dynamicDailyLimit,
                      fromReadyToRepeat,
                      repeatLaunchPreset,
                      campaignStatus,
                      openBidRecommendations,
                      bidRecommendationProduct,
                      budgetConceptDemo,
                      budgetRangeConceptDemo,
                    }) => {
                      if (isBonusesResearchAccess) return;
                      const patch = campaignListPatches[campaignId];
                      setSelectedCpcCampaign({
                        id: campaignId,
                        name: patch?.name ?? name,
                        paymentModel: paymentModel ?? 'CPC',
                        remainingBudget:
                          patch?.remainingBudget !== undefined ? patch.remainingBudget : remainingBudget,
                        dailyLimit: patch?.dailyLimit !== undefined ? patch.dailyLimit : dailyLimit,
                        scheduledDailyLimit:
                          patch?.scheduledDailyLimit !== undefined
                            ? patch.scheduledDailyLimit
                            : scheduledDailyLimit,
                        dailyLimitExhausted,
                        autoRefill: patch?.autoRefill !== undefined ? patch.autoRefill : autoRefill,
                        dynamicDailyLimit:
                          patch?.dynamicDailyLimit !== undefined
                            ? patch.dynamicDailyLimit
                            : dynamicDailyLimit,
                        fromReadyToRepeat,
                        repeatLaunchPreset,
                        campaignStatus:
                          patch?.status === 'active' || patch?.status === 'paused'
                            ? patch.status
                            : campaignStatus,
                        openBidRecommendations,
                        bidRecommendationProduct,
                        budgetConceptDemo,
                        budgetRangeConceptDemo,
                      });
                      setAppState('cpc-detail' as any);
                    }}
                    onUpdateCampaignData={(campaignId, data) => {
                      if (updateCampaignDataRef.current) {
                        updateCampaignDataRef.current(campaignId, data);
                      }
                    }}
                    onRegisterUpdateFn={(fn) => {
                      updateCampaignDataRef.current = fn;
                    }}
                    onRegisterBulkDailyLimitOpener={(open) => {
                      bulkDailyLimitOpenerRef.current = open;
                    }}
                    onRegisterBulkSearchBidOpener={(open) => {
                      bulkSearchBidOpenerRef.current = open;
                    }}
                    onOpenListBudgetModal={(campaignIds) => {
                      setListBudgetTargetIds(campaignIds);
                      setBulkEditPrefillData(null);
                      setCurrentBulkAction('budget');
                      setIsBulkActionModalOpen(true);
                    }}
                    onRegisterListBudgetApplier={(apply) => {
                      listBudgetApplierRef.current = apply;
                    }}
                    onBulkDownloadExcel={handleOpenEditDownloadModal}
                    campaignListPatches={campaignListPatches}
                    onPersistCampaignListPatch={persistCampaignListPatch}
                    onOpenSingleCampaign={openSingleCampaign}
                    researchAccess={isBonusesResearchAccess ? 'bonuses' : null}
                  />
                </main>
                <UploadEditsModal
                  isOpen={isUploadEditsModalOpen}
                  onClose={() => setIsUploadEditsModalOpen(false)}
                  onApply={handleApplyEdits}
                />
                <ReviewEditsModal 
                  isOpen={isReviewEditsModalOpen}
                  onClose={() => setIsReviewEditsModalOpen(false)}
                  onEdit={() => {
                    setIsReviewEditsModalOpen(false);
                    setIsFromExcelModal(false);
                    handleNavigationAttempt(handleNavigateToEditing);
                  }}
                />
                <ChangesHistoryModal
                    isOpen={isHistoryModalOpen}
                    onClose={() => setIsHistoryModalOpen(false)}
                    showToast={setShowToast}
                    setToastMessage={setToastMessage}
                />

                {isEditDownloadModalOpen && (
                  <div
                    className="fixed inset-0 z-[96] bg-black/50 flex items-center justify-center p-4"
                    onClick={() => setIsEditDownloadModalOpen(false)}
                  >
                    <div
                      className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h2 className="text-lg font-bold text-gray-900">Скачать Excel для правок</h2>
                          <p className="mt-1 text-sm text-gray-600">Какие параметры будете менять?</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsEditDownloadModalOpen(false)}
                          className="p-1 rounded-full text-gray-400 hover:bg-gray-100"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-3 mb-6">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <Checkbox
                            className="mt-1 h-4 w-4 text-purple-600"
                            defaultChecked
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">Базовые настройки</div>
                            <div className="text-xs text-gray-500 mt-0.5">Бюджет, автопополнение</div>
                          </div>
                        </label>
                        <label className="flex items-start gap-3 cursor-pointer">
                          <Checkbox
                            className="mt-1 h-4 w-4 text-purple-600"
                            defaultChecked
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">Ставки</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              Ставки и настройка преследования ставок
                            </div>
                          </div>
                        </label>
                        <label className="flex items-start gap-3 cursor-pointer">
                          <Checkbox
                            className="mt-1 h-4 w-4 text-purple-600"
                            defaultChecked
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">Кластера</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              Настройка ставок по кластерам
                            </div>
                          </div>
                        </label>
                      </div>

                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setIsEditDownloadModalOpen(false)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                        >
                          Отмена
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditDownloadModalOpen(false);
                            handleDownloadForEdit();
                          }}
                          className="px-5 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg"
                        >
                          Скачать
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {downloadStatus === 'loading' && <DownloadNotification count={downloadCount} />}
                <Toast show={showToast} message={toastMessage} onClose={() => setShowToast(false)} />
                {cpmBidRoundedAlertNode}
      </>
    );

    return (
      <div className="min-h-screen bg-[#F3F5F8] font-sans text-gray-900 relative">
        <AppHeader
          onNavigate={() => handleNavigationAttempt(handleNavigateToList)}
          onLaunchPromotion={() =>
            handleNavigationAttempt(() => openSingleCampaign())
          }
          onOpenCampaignCreation={
            isNewSellerProfile(profileId) ? openNewSellerCampaignCreation : undefined
          }
          campaignCreationActive={false}
          researchAccess={isBonusesResearchAccess ? 'bonuses' : null}
        />
        <CampaignsInsightFilterProvider>
          <OverviewBridgeProvider
            value={{
              openMassCreationWithProducts: (items) => {
                if (isBonusesResearchAccess) {
                  openSingleCampaign();
                  return;
                }
                handleNavigationAttempt(() =>
                  handleNavigateToCreationWithSingleCampaignProducts(items),
                );
              },
            }}
          >
            <Routes>
              {isBonusesResearchAccess ? (
                <>
                  <Route
                    path={PRODUCT_PROMOTION_CONCEPT_PATH}
                    element={
                      <ProductPromotionConceptPage>
                        <CampaignsPage>{campaignsListContent}</CampaignsPage>
                      </ProductPromotionConceptPage>
                    }
                  />
                  <Route
                    path="*"
                    element={<Navigate to={PRODUCT_PROMOTION_CONCEPT_PATH} replace />}
                  />
                </>
              ) : isNewSellerProfile(profileId) ? (
                <>
                  <Route path="/finance" element={<FinancePage />} />
                  <Route path="/finance/top-up" element={<FinanceTopUpPage />} />
                  <Route path="/bonuses" element={<BonusesPage />} />
                  {/* Создание кампании рендерится выше Routes; * только с чужих URL */}
                  <Route
                    path="*"
                    element={<Navigate to={NEW_SELLER_CREATE_CAMPAIGN_PATH} replace />}
                  />
                </>
              ) : (
                <>
                  <Route
                    path="/campaigns"
                    element={<CampaignsPage>{campaignsListContent}</CampaignsPage>}
                  />
                  <Route
                    path="/campaigns-with-widgets"
                    element={
                      <CampaignsWithWidgetsPage>
                        <CampaignsPage>{campaignsListContent}</CampaignsPage>
                      </CampaignsWithWidgetsPage>
                    }
                  />
                  <Route
                    path="/campaigns-with-widgets-2"
                    element={
                      <CampaignsWithWidgets2Page>
                        <CampaignsPage>{campaignsListContent}</CampaignsPage>
                      </CampaignsWithWidgets2Page>
                    }
                  />
                  <Route path="/product-promotion-concept"
                    element={
                      <ProductPromotionConceptPage>
                        <CampaignsPage>{campaignsListContent}</CampaignsPage>
                      </ProductPromotionConceptPage>
                    }
                  />
                  <Route path="/media" element={<MediaPage />} />
                  <Route path="/media/create" element={<MediaCampaignCreatePage />} />
                  <Route path={MEDIA_FINANCE_PATH} element={<FinancePage />} />
                  <Route path={`${MEDIA_FINANCE_PATH}/top-up`} element={<FinanceTopUpPage />} />
                  <Route path="/overview" element={<OverviewPage />} />
                  <Route path="/stats" element={<StatsPage />} />
                  <Route path="/stats/acquisition" element={<StatsPage />} />
                  <Route path="/stats/return" element={<StatsPage />} />
                  <Route path="/stats/value" element={<StatsPage />} />
                  <Route path="/audience-metrics" element={<AudienceMetricsPage />} />
                  <Route path="/finance" element={<FinancePage />} />
                  <Route path="/finance/top-up" element={<FinanceTopUpPage />} />
                  <Route path="/bonuses" element={<BonusesPage />} />
                  <Route path="/help" element={<HelpPage />} />
                  <Route path="/" element={<Navigate to="/product-promotion-concept" replace />} />
                </>
              )}
            </Routes>
          </OverviewBridgeProvider>
        </CampaignsInsightFilterProvider>
        {isBulkActionModalOpen &&
        (currentBulkAction === 'budget' ||
          (listBudgetTargetIds != null && listBudgetTargetIds.length > 0)) ? (
          <BudgetRefillModal
            isOpen={isBulkActionModalOpen}
            onClose={closeBulkActionModal}
            currentBudget={bulkEditPrefillData?.budget ?? 0}
            campaignCount={
              listBudgetTargetIds && listBudgetTargetIds.length > 0
                ? listBudgetTargetIds.length
                : selectedCampaignIds.length
            }
            submitLabel="Применить"
            onSave={(amount, extras) => {
              applyBudgetRefillFromModal(
                amount,
                extras,
                listBudgetTargetIds && listBudgetTargetIds.length > 0
                  ? listBudgetTargetIds
                  : selectedCampaignIds,
              );
            }}
          />
        ) : null}
      </div>
    );
  }

  if (
    !isMassCreationResearchAccess &&
    !isBonusesResearchAccess &&
    appState === 'cpc-detail' &&
    selectedCpcCampaign
  ) {
    return (
      <CpcCampaignPage
        campaignId={selectedCpcCampaign.id}
        name={selectedCpcCampaign.name}
        paymentModel={selectedCpcCampaign.paymentModel ?? 'CPC'}
        remainingBudget={selectedCpcCampaign.remainingBudget}
        dailyLimit={selectedCpcCampaign.dailyLimit}
        scheduledDailyLimit={selectedCpcCampaign.scheduledDailyLimit}
        dailyLimitExhausted={selectedCpcCampaign.dailyLimitExhausted}
        autoRefill={selectedCpcCampaign.autoRefill}
        dynamicDailyLimit={selectedCpcCampaign.dynamicDailyLimit}
        fromReadyToRepeat={selectedCpcCampaign.fromReadyToRepeat}
        repeatLaunchPreset={selectedCpcCampaign.repeatLaunchPreset}
        campaignStatus={selectedCpcCampaign.campaignStatus}
        initialOpenBidRecommendations={selectedCpcCampaign.openBidRecommendations}
        bidRecommendationProduct={selectedCpcCampaign.bidRecommendationProduct}
        budgetConceptDemo={selectedCpcCampaign.budgetConceptDemo}
        budgetRangeConceptDemo={selectedCpcCampaign.budgetRangeConceptDemo}
        onBack={() => {
          // Update campaign data in SuccessPage before going back
          if (selectedCpcCampaign) {
            // Data will be synced when component remounts or via callback
          }
          setAppState('list' as any);
          setSelectedCpcCampaign(null);
        }}
        onUpdateData={(data) => {
          if (!selectedCpcCampaign) return;
          const campaignId = selectedCpcCampaign.id;
          persistCampaignListPatch(campaignId, data);
          setSelectedCpcCampaign((prev) => {
            if (!prev || prev.id !== campaignId) return prev;
            return {
              ...prev,
              ...(data.name !== undefined && { name: data.name }),
              ...(data.remainingBudget !== undefined && { remainingBudget: data.remainingBudget }),
              ...(data.dailyLimit !== undefined && { dailyLimit: data.dailyLimit }),
              ...(data.scheduledDailyLimit !== undefined && {
                scheduledDailyLimit: data.scheduledDailyLimit,
              }),
              ...(data.maxCpcBidRub !== undefined && { maxCpcBidRub: data.maxCpcBidRub }),
              ...(data.autoRefill !== undefined && { autoRefill: data.autoRefill }),
              ...(data.dynamicDailyLimit !== undefined && {
                dynamicDailyLimit: data.dynamicDailyLimit,
              }),
              ...(data.status !== undefined && { campaignStatus: data.status }),
            };
          });
          if (updateCampaignDataRef.current) {
            updateCampaignDataRef.current(campaignId, data);
          }
        }}
      />
    );
  }

  return ( <div className="min-h-screen bg-[#F6F6F9] font-sans text-gray-900 pb-40 relative">
    <AppHeader
      onNavigate={() => handleNavigationAttempt(handleNavigateToList)}
      onLaunchPromotion={() => handleNavigationAttempt(() => openSingleCampaign())}
      researchAccess={
        isMassCreationResearchAccess
          ? 'mass-creation'
          : isBonusesResearchAccess
            ? 'bonuses'
            : null
      }
    />
    <Toast show={showToast} message={toastMessage} onClose={() => setShowToast(false)} />
    {cpmBidRoundedAlertNode}
    <UndoToast campaign={lastDeleted?.campaign} onUndo={handleUndoDelete} />
    <AddItemModal isOpen={isAddItemModalOpen} onClose={() => setIsAddItemModalOpen(false)} onSubmit={handleAddItemSubmit} onTemplateDownload={handleTemplateDownload} initialConfig={globalConfig} showToast={setShowToast} setToastMessage={setToastMessage} /> 
    <AutoRefillModal isOpen={isAutoRefillModalOpen} onClose={() => setIsAutoRefillModalOpen(false)} onSave={handleSaveAutoRefill} campaign={campaignForAutoRefill} />
    <ConfirmationModal
        isOpen={isConfirmExitOpen}
        onClose={() => {
            setIsConfirmExitOpen(false);
            setPendingNavigationAction(null);
        }}
        onConfirm={() => {
            if (pendingNavigationAction) {
                setTemplateGroups([]);
                setEditingGroupId(null);
                setEditedCampaigns([]);
                setSelectedCampaignIds([]);
                setInlineErrors({});
                pendingNavigationAction();
            }
            setIsConfirmExitOpen(false);
            setPendingNavigationAction(null);
        }}
        title="Изменения не сохранены"
        confirmText="Выйти без сохранения"
        confirmColor="red"
        cancelText="Остаться"
        children={<p>Вы уверены, что хотите выйти? Все данные будут потеряны.</p>}
    />
  {isBulkActionModalOpen && currentBulkAction === 'bid' ? (
    <BulkSearchBidModal
      key={`bulk-bid-${creationBulkBidTarget}`}
      isOpen
      title={CREATION_BULK_BID_TITLES[creationBulkBidTarget]}
      controls={
        creationBulkBidTarget === 'cpc-recs' || creationBulkBidTarget === 'cpm-recs'
          ? 'simple'
          : creationBulkBidTarget.startsWith('cpm')
            ? 'cpm'
            : 'cpc-positions'
      }
      items={selectedCreationBulkBidItems}
      onClose={closeBulkActionModal}
      onApply={(bidsById) => {
        const ids = Object.keys(bidsById);
        const updateLogic = (campaign: CampaignRecord): CampaignRecord => {
          if (!(campaign.id in bidsById)) return campaign;
          const nextBid = bidsById[campaign.id]!;
          if (
            creationBulkBidTarget === 'cpc-search' ||
            creationBulkBidTarget === 'cpm-search'
          ) {
            return { ...campaign, searchBid: nextBid };
          }
          if (
            creationBulkBidTarget === 'cpc-recs' ||
            creationBulkBidTarget === 'cpm-recs'
          ) {
            return { ...campaign, recommendationsBid: nextBid };
          }
          return { ...campaign, bid: nextBid, searchBid: nextBid };
        };
        if (editingGroupId) {
          setEditedCampaigns((prev) => prev.map(updateLogic));
        }
        setTemplateGroups((prev) =>
          prev.map((group) => ({
            ...group,
            campaigns: group.campaigns.map(updateLogic),
          })),
        );
        setToastMessage(
          `Ставки обновлены для ${ids.length} ${getPlural(ids.length, 'товара', 'товаров', 'товаров')}`,
        );
        setShowToast(true);
        closeBulkActionModal();
      }}
    />
  ) : isBulkActionModalOpen && currentBulkAction === 'autobidder' ? (
    <AutoStrategiesModal
      isOpen
      onClose={closeBulkActionModal}
      bidChasing={{
        isOpen: true,
        onClose: closeBulkActionModal,
        initialPosition:
          selectedCreationBulkAutobidderProducts
            .map((p) => creationAutobidderSetup[p.id]?.position)
            .find((p) => p != null) ?? DEFAULT_BID_CHASING_POSITION,
        initialMaxBid: (() => {
          const saved = selectedCreationBulkAutobidderProducts
            .map((p) => creationAutobidderSetup[p.id]?.maxBid)
            .find((v) => v != null && v > 0);
          return saved ?? DEFAULT_BID_CHASING_MAX_BID_RUB;
        })(),
        isDailyLimitEnabled: false,
        savedDailyLimitRub: 0,
        otherMaxProductBidRub: 0,
        isBidChasingEnabled:
          selectedCreationBulkAutobidderProducts.length > 0 &&
          selectedCreationBulkAutobidderProducts.every(
            (p) => creationAutobidderSetup[p.id]?.mode === 'positions',
          ),
        onDisable: () => {
          const scopedIds = new Set(
            selectedCreationBulkAutobidderProducts.map((p) => p.id),
          );
          setCreationAutobidderSetup((prev) => {
            const next = { ...prev };
            for (const id of scopedIds) delete next[id];
            return next;
          });
          closeBulkActionModal();
          setToastMessage(
            `Автобиддер отключён для ${scopedIds.size} ${getPlural(
              scopedIds.size,
              'кампании',
              'кампаний',
              'кампаний',
            )}`,
          );
          setShowToast(true);
        },
        products: selectedCreationBulkAutobidderProducts,
        initialPositionsById: Object.fromEntries(
          selectedCreationBulkAutobidderProducts
            .map((p) => {
              const setup = creationAutobidderSetup[p.id];
              return setup?.mode === 'positions' && setup.position
                ? ([p.id, setup.position] as const)
                : null;
            })
            .filter((entry): entry is readonly [string, BidChasingPosition] => entry != null),
        ),
        onApply: ({ position, maxBid, maxBidsById, positionsById }) => {
          handleBulkSave({
            __mode: 'autobidder',
            position,
            maxBid,
            maxBidsById,
            positionsById,
          });
        },
      }}
    />
  ) : isBulkActionModalOpen && currentBulkAction === 'budget' ? (
    <BudgetRefillModal
      isOpen
      onClose={closeBulkActionModal}
      currentBudget={bulkEditPrefillData?.budget ?? 0}
      campaignCount={
        listBudgetTargetIds && listBudgetTargetIds.length > 0
          ? listBudgetTargetIds.length
          : selectedCampaignIds.length
      }
      submitLabel="Применить"
      onSave={(amount, extras) => {
        applyBudgetRefillFromModal(
          amount,
          extras,
          listBudgetTargetIds && listBudgetTargetIds.length > 0
            ? listBudgetTargetIds
            : selectedCampaignIds,
        );
      }}
    />
  ) : (
    <BulkEditModal
      isOpen={isBulkActionModalOpen}
      onClose={closeBulkActionModal}
      action={currentBulkAction}
      onSave={handleBulkSave}
      categories={uniqueCategoriesForSelection}
      selectedCampaignsCount={selectedCampaignIds.length}
      onOpenAutoRefill={() => {
        openBulkActionModal('budget');
      }}
      prefillData={bulkEditPrefillData}
      editingGroupId={editingGroupId}
      editedCampaigns={editedCampaigns}
      allValidCampaigns={allValidCampaigns}
      selectedCampaignIds={selectedCampaignIds}
    />
  )}
  {campaignForBonusEdit ? (
    <BudgetRefillModal
      isOpen
      currentBudget={campaignForBonusEdit.budget}
      submitLabel="Применить"
      onClose={() => setCampaignForBonusEdit(null)}
      onSave={(amount, extras) => {
        const pkg =
          BONUS_PACKAGES.find((item) => item.id === extras?.packageId) ?? BONUS_PACKAGES[0];
        handleSaveBonusForCampaign({
          total: amount,
          isBonusActive: Boolean(extras?.useBonuses && (extras.bonusAmount ?? 0) > 0),
          bonus: extras?.bonusAmount ?? 0,
          selectedPkg: pkg,
          autoRefill: extras?.autoRefill,
        });
      }}
    />
  ) : null}
  
  {bonusAppContext && (
    <ConfirmationModal
        isOpen={isBonusInsufficiencyModalOpen}
        onClose={() => setIsBonusInsufficiencyModalOpen(false)}
        onConfirm={handleConfirmPartialBonusApplication}
        title="Недостаточно бонусов"
        confirmText={`Применить к ${bonusAppContext.fullCoverageCount + (bonusAppContext.remainingBonuses > 0 ? 1 : 0)} ${getPlural(bonusAppContext.fullCoverageCount + (bonusAppContext.remainingBonuses > 0 ? 1 : 0), 'кампании', 'кампаниям', 'кампаниям')}`}
        confirmColor="purple"
        cancelText="Отмена"
        children={
            <div className="space-y-2 text-left">
                <p>
                    В выбранном пакете недостаточно бонусов для пополнения всех <b>{selectedCampaignIds.length} {getPlural(selectedCampaignIds.length, 'кампании', 'кампаний', 'кампаний')}</b> на сумму {bonusAppContext.value.bonus} B.
                </p>
                <p>
                    Будет пополнено <b>{bonusAppContext.fullCoverageCount} {getPlural(bonusAppContext.fullCoverageCount, 'кампания', 'кампании', 'кампаний')}</b> на полную сумму <b>{bonusAppContext.value.bonus} B</b>.
                </p>
                {bonusAppContext.remainingBonuses > 0 && (
                    <p>
                        Остаток в <b>{bonusAppContext.remainingBonuses.toLocaleString('ru-RU')} B</b> будет применен к следующей кампании.
                    </p>
                )}
            </div>
        }
    />
  )}

  <ConfirmationModal isOpen={isConfirmDeleteGroupOpen} onClose={() => setIsConfirmDeleteGroupOpen(false)} onConfirm={handleConfirmDeleteGroup} title="Подтвердите удаление" children={groupToDelete && ( <p> Вы уверены, что хотите удалить всю группу? Это действие удалит{' '} <b> {groupToDelete.campaigns.length} {getPlural(groupToDelete.campaigns.length, 'кампанию', 'кампании', 'кампаний')} </b> . Отменить это действие будет невозможно. </p> )} />
  <ConfirmationModal isOpen={isConfirmBulkDeleteOpen} onClose={() => setIsConfirmBulkDeleteOpen(false)} onConfirm={() => { handleBulkDelete(); setIsConfirmBulkDeleteOpen(false); }} title="Подтвердите удаление" confirmText="Да, удалить" confirmColor="red" children={<p> Вы уверены, что хотите удалить{' '} <b> {selectedCampaignIds.length} {getPlural(selectedCampaignIds.length, 'кампанию', 'кампании', 'кампаний')} </b> ? Это действие необратимо. </p>} />
  <ConfirmationModal isOpen={isConfirmCancelEditOpen} onClose={() => setIsConfirmCancelEditOpen(false)} onConfirm={performCancelEditing} title="Выйти без сохранения?" confirmText="Выйти без сохранения" confirmColor="red" secondaryConfirmText="Сохранить и выйти" onSecondaryConfirm={() => { handleSaveEditing(); setIsConfirmCancelEditOpen(false); }} cancelText="Продолжить редактирование" children={<p>У вас есть несохраненные изменения. Что вы хотите сделать?</p>} />
  <ConfirmationModal isOpen={isConfirmSwitchEditOpen} onClose={() => setIsConfirmSwitchEditOpen(false)} title="Сохраните изменения" confirmText="Выйти без сохранения" confirmColor="red" onConfirm={() => { setIsConfirmSwitchEditOpen(false); performCancelEditing(); }} secondaryConfirmText="Сохранить" onSecondaryConfirm={() => { setIsConfirmSwitchEditOpen(false); handleSaveEditing(); }} cancelText="Отмена" children={<p>У вас есть несохраненные изменения. Что вы хотите сделать?</p>} />
  <ConfirmationModal isOpen={isConfirmLaunchOpen} onClose={() => setIsConfirmLaunchOpen(false)} onConfirm={() => { handleSaveEditing(); performLaunch(); }} title="Сохранить изменения?" confirmText="Сохранить и запустить" confirmColor="purple" cancelText="Отмена" children={<p>У вас есть несохраненные изменения в одной из групп. Сохранить их и продолжить запуск?</p>} />
  <ConfirmationModal isOpen={isConfirmLaunchWithFiltersOpen} onClose={() => setIsConfirmLaunchWithFiltersOpen(false)} onConfirm={() => { setIsConfirmLaunchWithFiltersOpen(false); if (editingGroupId) setIsConfirmLaunchOpen(true); else performLaunch(); }} title="Запуск кампаний с активным фильтром" confirmText={`Запустить все ${totalAllValidCount}`} confirmColor="purple" cancelText="Отмена" children={ <p> Применены фильтры для просмотра, но будут запущены <b>все {totalAllValidCount} {getPlural(totalAllValidCount, 'готовая кампания', 'готовые кампании', 'готовых кампаний')}</b>. Вы уверены, что хотите продолжить? </p> } />
  {isLaunchSummaryModalOpen ? (() => {
    const preview = launchPreview;

    return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={() => setIsLaunchSummaryModalOpen(false)}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="m-0 text-lg font-bold leading-snug text-gray-900 sm:text-xl">
            Подтвердите создание кампаний
          </h3>
          <button
            type="button"
            onClick={() => setIsLaunchSummaryModalOpen(false)}
            className="-mr-1 -mt-1 shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-0 [&_p]:m-0">
          {preview.successfulCount > 0 ? (
            <div className="flex items-start gap-3 border-b border-gray-100 pb-4">
              <Rocket className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm leading-5 text-gray-500">В статусе «Активна»</p>
                <p className="text-base font-bold leading-6 tabular-nums text-gray-900">
                  {preview.successfulCount}{' '}
                  {getPlural(
                    preview.successfulCount,
                    'кампания',
                    'кампании',
                    'кампаний',
                  )}
                </p>
              </div>
            </div>
          ) : null}

          {preview.readyToLaunchCount > 0 ? (
            <div className="flex items-start gap-3 border-b border-gray-100 py-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#F97316]" />
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-medium leading-5 text-[#F97316]">
                  В статусе «Готова к запуску»
                </p>
                <p className="text-sm leading-5 text-gray-500">
                  Денег для пополнения этих кампаний не хватило
                </p>
                <p className="text-base font-bold leading-6 tabular-nums text-gray-900">
                  {preview.readyToLaunchCount}{' '}
                  {getPlural(
                    preview.readyToLaunchCount,
                    'кампания',
                    'кампании',
                    'кампаний',
                  )}
                </p>
              </div>
            </div>
          ) : null}

          <div className="flex items-start gap-3 border-y border-gray-100 py-4">
            <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm leading-5 text-gray-500">Спишем с единого счёта</p>
              {preview.bonusToDebit > 0 ? (
                <p className="flex items-baseline gap-1.5 text-base leading-6 tabular-nums">
                  <span className="text-gray-400 line-through">
                    {(preview.amountToDebit + preview.bonusToDebit).toLocaleString('ru-RU')} ₽
                  </span>
                  <span className="font-bold text-gray-900">
                    {preview.amountToDebit.toLocaleString('ru-RU')} ₽
                  </span>
                </p>
              ) : (
                <p className="text-base font-bold leading-6 tabular-nums text-gray-900">
                  {preview.amountToDebit.toLocaleString('ru-RU')} ₽
                </p>
              )}
            </div>
          </div>

          {preview.bonusToDebit > 0 ? (
            <div className="flex items-start gap-3 border-b border-gray-100 py-4">
              <Coins className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm leading-5 text-gray-500">Спишем промобонусов</p>
                <p className="text-base font-bold leading-6 tabular-nums text-gray-900">
                  {preview.bonusToDebit.toLocaleString('ru-RU')} B
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleProceedToLaunch}
            className="rounded-xl bg-[#A855F7] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#9333EA]"
          >
            {`Создать ${totalAllValidCount} ${getPlural(totalAllValidCount, 'кампанию', 'кампании', 'кампаний')}`}
          </button>
          <button
            type="button"
            onClick={() => setIsLaunchSummaryModalOpen(false)}
            className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-200"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
    );
  })() : null}
  
  <main className="mx-auto max-w-[1968px] px-6 py-8">
        {showQuickSave && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] transition-all duration-300 ease-out">
            <div className="flex items-center gap-3 bg-black/90 text-white text-sm font-semibold px-6 py-3 rounded-full shadow-2xl min-w-[180px] justify-center">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Сохранено</span>
            </div>
          </div>
        )}
        <section className="mb-6">
            <div className="mx-auto flex w-full min-w-[1392px] max-w-[1920px] flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddItemModalOpen(true)}
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] bg-black px-2.5 text-sm font-medium tracking-[0.3px] text-white transition-colors hover:bg-[#1A1A1A] active:bg-black"
                >
                  <Plus className="h-4 w-4" />
                  <span className="px-1.5">Добавить товары</span>
                </button>

                {templateGroups.length > 0 ? (
                  <>
                    <div className="relative flex h-9 min-w-[220px] flex-1 items-center gap-1 rounded-[10px] bg-white px-1">
                      <Search className="ml-2 h-4 w-4 shrink-0 text-gray-900" />
                      {searchTags.map((tag) => (
                        <div
                          key={tag}
                          className="flex items-center gap-1 rounded-lg bg-[#F2F2F7] py-0.5 pl-2 pr-1 text-sm text-gray-700"
                        >
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => removeSearchTag(tag)}
                            className="rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <input
                        type="text"
                        value={currentSearchInput}
                        onChange={(e) => setCurrentSearchInput(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        placeholder="Поиск"
                        className="min-w-[120px] flex-1 bg-transparent py-2 text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400"
                      />
                      {(searchTags.length > 0 || currentSearchInput) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTags([]);
                            setCurrentSearchInput('');
                          }}
                          className="ml-auto text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {canFilterBySource ? (
                      <MultiSelect
                        options={uniqueFileSources}
                        selected={selectedSources}
                        onChange={setSelectedSources}
                        placeholder="Источник"
                        className="w-full sm:w-[180px] shrink-0"
                        autoApply
                        variant="chipsAction"
                      />
                    ) : null}
                    <MultiSelect
                      options={uniqueCategories}
                      selected={selectedCategories}
                      onChange={setSelectedCategories}
                      placeholder="Категория"
                      className="w-full sm:w-[180px] shrink-0"
                      autoApply
                      variant="chipsAction"
                    />
                  </>
                ) : null}
            </div>
            {templateGroups.length > 0 && hasActiveFilterTags && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-sm font-medium text-gray-500">Активные фильтры:</span>
                {selectedSources.map((source) => (
                  <div
                    key={`source-${source}`}
                    className="flex items-center gap-1.5 rounded-full bg-gray-100 py-1 pl-3 pr-2 text-sm text-gray-700"
                  >
                    <span>{source}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedSources((prev) => prev.filter((s) => s !== source))}
                      className="rounded-full p-0.5 text-gray-400 hover:bg-gray-300 hover:text-gray-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {selectedCategories.map((category) => (
                  <div
                    key={`category-${category}`}
                    className="flex items-center gap-1.5 rounded-full bg-gray-100 py-1 pl-3 pr-2 text-sm text-gray-700"
                  >
                    <span>{category}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedCategories((prev) => prev.filter((c) => c !== category))
                      }
                      className="rounded-full p-0.5 text-gray-400 hover:bg-gray-300 hover:text-gray-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
        </section>

        {templateGroups.length === 0 && (
          <CuratedProductPicksSection
            className="mb-8"
            products={massCreationCuratedCatalog}
            alreadyAddedNmIds={curatedCatalogAlreadyAddedNmIds}
            onAddBundle={handleAddCuratedBundle}
          />
        )}

        {wbDiscountPromoteProducts && wbDiscountPromoteProducts.length > 0 ? (
          <BulkPaymentModelModal
            isOpen
            title="Продвигайте эти товары и получайте до +10% к скидке WB"
            withCategorySelect
            products={wbDiscountPromoteProducts}
            onClose={() => setWbDiscountPromoteProducts(null)}
            onConfirm={handleConfirmWbDiscountPromote}
          />
        ) : null}

        {templateGroups.length > 0 ? (
            <div className="space-y-8">
            {templateGroups.map((group) => { 
            const campaignsForReview = editingGroupId === group.id ? editedCampaigns : group.campaigns.filter(c => c.status !== CampaignStatus.ERROR);
            const filteredGroupCampaigns = campaignsForReview.filter(c => filteredCampaigns.some(fc => fc.id === c.id));
            const validCount = filteredGroupCampaigns.length; 
            const totals = filteredGroupCampaigns.reduce( (acc, campaign) => { const bonus = effectivePromoBonusAmount(campaign); acc.total += campaign.budget; acc.bonus += bonus; return acc; }, { total: 0, bonus: 0 } );
            const paginatedCampaigns = filteredGroupCampaigns.slice((group.currentPage - 1) * PAGE_SIZE, group.currentPage * PAGE_SIZE);
            const paginatedIds = paginatedCampaigns.map(c => c.id);
            const isCpmManual = group.config.paymentModel === PaymentModel.CPM && group.config.bidType === BidType.MANUAL;
            const isCpc = group.config.paymentModel === PaymentModel.CPC;
            // CPM ручная и CPC: две колонки Поиск / Рекомендации с выбором зон
            const showZoneColumns = isCpmManual || isCpc;
            const hasSearchBids = showZoneColumns;
            const hasRecommendationsBids = showZoneColumns;
            const defaultZoneBid = isCpc
              ? CPC_DEFAULT_SEARCH_BID_RUB
              : CPM_DEFAULT_COMPETITIVE_BID_RUB;
            const zonesLabel = (() => {
              const isCpm = group.config.paymentModel === PaymentModel.CPM;
              if (isCpm && group.config.bidType !== BidType.MANUAL) {
                return 'Зоны показов: Поиск, Рекомендации';
              }
              if (isCpm || isCpc) {
                const anySearchEnabled = campaignsForReview.some(c => c.searchBid != null);
                const anyRecsEnabled = campaignsForReview.some(c => c.recommendationsBid != null);
                const zones = [
                  anySearchEnabled ? 'Поиск' : null,
                  anyRecsEnabled ? 'Рекомендации' : null,
                ].filter(Boolean) as string[];
                return `Зоны показов: ${zones.length ? zones.join(', ') : '—'}`;
              }
              return null;
            })();
            const selectedOnPageCount = paginatedIds.filter(id => selectedCampaignIds.includes(id)).length;
            const allOnPageSelected = selectedOnPageCount === paginatedIds.length && paginatedIds.length > 0;
            const isIndeterminate = !allOnPageSelected && selectedOnPageCount > 0;
            const showProspectColumn = campaignsForReview.some((c) => c.prospectCtr != null);
            if (filteredGroupCampaigns.length === 0 && areFiltersActive) return null;

            const islandTitle = isCpc
              ? 'CPC'
              : `CPM ${group.config.bidType === BidType.MANUAL ? 'Ручная ставка' : 'Единая ставка'}`;
            const zonesPill = (() => {
              if (isCpc || isCpmManual) {
                const anySearch = campaignsForReview.some((c) => c.searchBid != null);
                const anyRecs = campaignsForReview.some((c) => c.recommendationsBid != null);
                if (anySearch && anyRecs) return 'Покажем в поиске и рекомендациях';
                if (anySearch) return 'Покажем в поиске';
                if (anyRecs) return 'Покажем в рекомендациях';
                return 'Зоны показов';
              }
              return 'Покажем в поиске';
            })();

            return (
              <div key={group.id} className="space-y-2">
                <MassCreationIsland
                  title={islandTitle}
                  zonesPill={zonesPill}
                  showDailyLimit={isCpc}
                  showAutobidder={isCpc}
                  showAlgorithmTag={isCpc}
                  bidMode={showZoneColumns ? 'zones' : 'unified'}
                  defaultZoneBid={
                    isCpc ? CPC_DEFAULT_SEARCH_BID_RUB : CPM_DEFAULT_COMPETITIVE_BID_RUB
                  }
                  defaultRecsBid={
                    isCpc ? CPC_DEFAULT_SEARCH_BID_RUB : CPM_DEFAULT_COMPETITIVE_BID_RUB
                  }
                  campaigns={paginatedCampaigns}
                  selectedIds={selectedCampaignIds}
                  onToggleSelect={handleSelectCampaign}
                  onToggleSelectAll={handleSelectAllOnPage}
                  onUpdate={(id, patch) => handleUpdateCampaign(group.id, id, patch)}
                  onOpenBudgetSettings={openSingleBudgetModal}
                  unifiedAccountTotal={totals.total - totals.bonus}
                  promoBonusesTotal={totals.bonus}
                  autobidderSetup={creationAutobidderSetup}
                  onAutobidderSetupChange={setCreationAutobidderSetup}
                />
                <Pagination
                  total={validCount}
                  pageSize={PAGE_SIZE}
                  current={group.currentPage}
                  onChange={(page) => handlePageChange(group.id, page)}
                />
              </div>
            );
            })}</div>
        ) : null}
    </main> 

    {selectedCampaignIds.length > 0 && (
      <CreationSelectionBar
        count={selectedCampaignIds.length}
        total={allValidCampaigns.length}
        showAutobidder={templateGroups.some(
          (g) =>
            g.config.paymentModel === PaymentModel.CPC &&
            g.campaigns.some((c) => selectedCampaignIds.includes(c.id)),
        )}
        showDailyLimit={templateGroups.some(
          (g) =>
            g.config.paymentModel === PaymentModel.CPC &&
            g.campaigns.some((c) => selectedCampaignIds.includes(c.id)),
        )}
        bidTargets={creationBulkBidTargetsAvailable}
        onBudget={() => openBulkActionModal('budget')}
        onDailyLimit={openCreationBulkDailyLimit}
        onBidTarget={(target) => {
          setCreationBulkBidTarget(target);
          openBulkActionModal('bid');
        }}
        onZones={openCreationZonesModal}
        onAutobidder={() => openBulkActionModal('autobidder', PaymentModel.CPC)}
        onDelete={() => openBulkActionModal('delete')}
        onClear={() => setSelectedCampaignIds([])}
      />
    )}

    {isCreationBulkDailyLimitOpen && selectedCreationCampaigns.length > 0 ? (
      <AdvancedDailyLimitModal
        dailyLimitOnly
        conditionRuleBuilder
        allowLimitAboveBudget
        isOpen
        onClose={() => setIsCreationBulkDailyLimitOpen(false)}
        isDailyLimitEnabled={creationBulkDailyLimitEnabled}
        onEnableDailyLimit={() => {
          const next = String(Math.max(DAILY_LIMIT_ABSOLUTE_MIN, creationBulkMaxBid));
          setCreationBulkDailyLimitValue(next);
          setCreationBulkSavedDailyLimit(next);
          setCreationBulkDailyLimitEnabled(true);
        }}
        onDisableDailyLimit={() => {
          setCreationBulkDailyLimitEnabled(false);
          setCreationBulkDailyLimitValue('');
          setCreationBulkSavedDailyLimit('');
          setCreationBulkDailyLimitSettings(createDefaultAdvancedDailyLimitSettings());
          applyPatchToSelectedCreationCampaigns({ dailyLimit: null });
          setCreationAutobidderSetup((prev) => {
            const next = { ...prev };
            for (const id of selectedCampaignIds) {
              if (next[id]?.mode === 'profit') delete next[id];
            }
            return next;
          });
          setIsCreationBulkDailyLimitOpen(false);
          setToastMessage('Дневной лимит отключен');
          setShowToast(true);
        }}
        dailyLimitValue={creationBulkDailyLimitValue}
        onDailyLimitValueChange={setCreationBulkDailyLimitValue}
        onDailyLimitCommit={(parsed) => {
          if (Number.isNaN(parsed)) return;
          setCreationBulkDailyLimitValue(String(parsed));
          setCreationBulkSavedDailyLimit(String(parsed));
          setCreationBulkDailyLimitEnabled(true);
          applyPatchToSelectedCreationCampaigns({ dailyLimit: parsed });
        }}
        savedDailyLimit={creationBulkSavedDailyLimit}
        isCarryoverEnabled={creationBulkCarryover}
        onCarryoverChange={setCreationBulkCarryover}
        campaignBudget={creationBulkCampaignBudget}
        initialSettings={creationBulkDailyLimitSettings}
        referenceCpcBidRub={creationBulkMaxBid}
        autoRefillOnRulesTrigger={creationBulkAutoRefillOnRules}
        onAutoRefillOnRulesTriggerChange={(enabled) => {
          setCreationBulkAutoRefillOnRules(enabled);
          if (enabled) {
            applyPatchToSelectedCreationCampaigns({ autoReplenishment: true });
          }
        }}
        onApply={(settings, options) => {
          setCreationBulkDailyLimitSettings(settings);
          if (options?.reset) {
            applyPatchToSelectedCreationCampaigns({ dailyLimit: null });
            setIsCreationBulkDailyLimitOpen(false);
            setToastMessage('Дневной лимит сброшен');
            setShowToast(true);
            return;
          }
          const limitFromSettings =
            settings.strategyId === 'maxSpend' &&
            settings.maxSpendLimitRub != null &&
            settings.maxSpendLimitRub > 0
              ? settings.maxSpendLimitRub
              : Number.parseFloat(creationBulkSavedDailyLimit) ||
                Number.parseFloat(creationBulkDailyLimitValue) ||
                null;
          applyPatchToSelectedCreationCampaigns({
            dailyLimit:
              limitFromSettings != null && limitFromSettings > 0 ? limitFromSettings : null,
          });
          if (isDynamicDailyLimitConfigured(settings)) {
            setCreationAutobidderSetup((prev) => {
              const next = { ...prev };
              for (const id of selectedCampaignIds) {
                next[id] = {
                  mode: 'profit',
                  settings,
                  position: prev[id]?.position ?? DEFAULT_BID_CHASING_POSITION,
                  maxBid: prev[id]?.maxBid ?? creationBulkMaxBid,
                };
              }
              return next;
            });
          } else {
            setCreationAutobidderSetup((prev) => {
              const next = { ...prev };
              for (const id of selectedCampaignIds) {
                if (next[id]?.mode === 'profit') delete next[id];
              }
              return next;
            });
          }
          setIsCreationBulkDailyLimitOpen(false);
          setToastMessage(
            `Дневной лимит обновлён для ${selectedCampaignIds.length} ${getPlural(selectedCampaignIds.length, 'кампании', 'кампаний', 'кампаний')}`,
          );
          setShowToast(true);
        }}
      />
    ) : null}

    {isCreationZonesModalOpen ? (
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4"
        onClick={() => setIsCreationZonesModalOpen(false)}
      >
        <div
          className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Зоны показа</h3>
              <p className="mt-1 text-sm text-gray-500">
                Для {selectedCampaignIds.length}{' '}
                {getPlural(selectedCampaignIds.length, 'кампании', 'кампаний', 'кампаний')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreationZonesModalOpen(false)}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-3">
            <label className="flex cursor-pointer items-center justify-between rounded-xl bg-gray-50 px-3 py-3">
              <span className="text-sm font-medium text-gray-900">Поиск</span>
              <Checkbox
                checked={creationZonesDraft.search}
                onChange={(e) => {
                  const search = e.target.checked;
                  setCreationZonesDraft((prev) => ({
                    search,
                    recommendations: !search && !prev.recommendations ? true : prev.recommendations,
                  }));
                }}
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between rounded-xl bg-gray-50 px-3 py-3">
              <span className="text-sm font-medium text-gray-900">Рекомендации</span>
              <Checkbox
                checked={creationZonesDraft.recommendations}
                onChange={(e) => {
                  const recommendations = e.target.checked;
                  setCreationZonesDraft((prev) => ({
                    recommendations,
                    search: !recommendations && !prev.search ? true : prev.search,
                  }));
                }}
              />
            </label>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreationZonesModalOpen(false)}
              className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={() => {
                const { search, recommendations } = creationZonesDraft;
                if (!search && !recommendations) return;
                applyPatchToSelectedCreationCampaigns((c) => {
                  const defaultBid = c.bid ?? c.searchBid ?? c.recommendationsBid ?? 100;
                  if (c.searchBid != null || c.recommendationsBid != null) {
                    return {
                      searchBid: search ? c.searchBid ?? defaultBid : undefined,
                      recommendationsBid: recommendations
                        ? c.recommendationsBid ?? defaultBid
                        : undefined,
                    };
                  }
                  return {};
                });
                setIsCreationZonesModalOpen(false);
                setToastMessage(
                  `Зоны показа обновлены для ${selectedCampaignIds.length} ${getPlural(selectedCampaignIds.length, 'кампании', 'кампаний', 'кампаний')}`,
                );
                setShowToast(true);
              }}
              className="rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700"
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>
    ) : null}

    {totalAllValidCount > 0 && selectedCampaignIds.length === 0 ? (
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white">
        <div className="mx-auto flex w-full max-w-[1968px] flex-col gap-3 px-6 py-3">
          <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
                <MissedBonusPromoPill
                  alreadyDistributed={launchPreview.alreadyDistributed}
                  maxDistributable={launchPreview.maxDistributable}
                  maxAdditional={launchPreview.maxAdditional}
                  balance={launchPreview.promoAccountBalance}
                  onApply={applyPromoBonusesAmount}
                />
                <div className="min-w-0">
                  <div className="text-[11px] font-bold leading-4 text-[#63616C]">С единого счёта</div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    {globalTotals.bonus > 0 ? (
                      <div className="flex items-center gap-2 text-[17px] font-bold leading-6">
                        <span className="tabular-nums text-[#63616C] line-through">
                          {globalTotals.total.toLocaleString('ru-RU')} ₽
                        </span>
                        <span className="tabular-nums text-gray-900">
                          {globalTotals.real.toLocaleString('ru-RU')} ₽
                        </span>
                      </div>
                    ) : (
                      <div className="text-[17px] font-bold leading-6 tabular-nums text-gray-900">
                        {globalTotals.real.toLocaleString('ru-RU')} ₽
                      </div>
                    )}
                    {globalDeficit > 0 ? (
                      <>
                        <button
                          type="button"
                          onClick={refreshUnifiedBalance}
                          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                          aria-label="Обновить баланс"
                        >
                          <RefreshCw
                            className={`h-3.5 w-3.5 ${isRefreshingBalance ? 'animate-spin' : ''}`}
                          />
                        </button>
                        <span className="text-sm font-medium tabular-nums text-[#F5A623]">
                          Не хватает {globalDeficit.toLocaleString('ru-RU')} ₽
                        </span>
                        <button
                          type="button"
                          onClick={() => navigate('/finance/top-up')}
                          className="text-sm font-medium text-[#3B82F6] underline underline-offset-2 hover:text-[#2563EB]"
                        >
                          Пополнить счет
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">
              {globalDeficit > 0 ? (
                <div className="flex max-w-[320px] items-start gap-2 rounded-xl bg-[#F2F2F7] px-3 py-2 text-xs leading-snug text-gray-700">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F5A623]" />
                  <span>
                    Кампании, на которые не хватает денег, создадим со статусом «Готова к
                    запуску»
                  </span>
                </div>
              ) : null}
              <button
                type="button"
                onClick={launchCampaigns}
                disabled={isLaunching}
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-[10px] bg-[#9C45FD] px-3 text-[17px] font-medium leading-5 tracking-[0.4px] text-white transition-colors hover:bg-[#8A35EE] disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                <span className="px-2">{`Создать ${totalAllValidCount} ${getPlural(totalAllValidCount, 'кампанию', 'кампании', 'кампаний')}`}</span>
              </button>
            </div>
          </div>
        </div>
      </footer>
    ) : null}
    </div>
  );
}