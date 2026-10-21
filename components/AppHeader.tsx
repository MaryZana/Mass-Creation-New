import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  CAMPAIGNS_WITH_WIDGETS_V1_PATH,
  PRODUCT_PROMOTION_CONCEPT_PATH,
} from '../constants/campaignListRoutes';
import { Check, ChevronDown, MoreVertical, Plus, X } from './Icons';
import { isNewSellerProfile, PROFILES, useProfile, type ProfileId } from './ProfileContext';
import { usePromoBonusDemo } from './PromoBonusDemoContext';
import { FINANCE_BALANCE_DEMO_EVENT, readFinanceBufferRub } from '../utils/financeBalanceDemo';
import { financeHomePath, financeTopUpPath } from '../utils/financeRoutes';

export const NEW_SELLER_CREATE_CAMPAIGN_PATH = '/create-campaign';

const SUPPORT_SUGGESTION_TITLES = [
  'Как работает счёт и баланс продвижения',
  'Как работает ранжирование. Почему ваша карточка внизу',
  'Пополнение счёта и возврат средств',
  'История изменения кампании',
] as const;

function SupportHelpModal({
  open,
  onClose,
  onOpenDialog,
  onSelectSuggestion,
}: {
  open: boolean;
  onClose: () => void;
  onOpenDialog: () => void;
  onSelectSuggestion: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-[440px] rounded-2xl bg-white p-6 shadow-2xl sm:p-7"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-help-modal-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="Закрыть"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>

        <h2
          id="support-help-modal-title"
          className="pr-10 text-lg font-bold leading-snug text-gray-900 sm:text-xl"
        >
          Может ответ на вопрос будет тут
        </h2>

        <ul className="mt-5 space-y-2">
          {SUPPORT_SUGGESTION_TITLES.map((title) => (
            <li key={title}>
              <button
                type="button"
                onClick={onSelectSuggestion}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition-colors hover:bg-gray-50"
              >
                <span className="text-sm font-medium leading-snug text-gray-900">{title}</span>
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F7F1FF] text-[#9A41FE]"
                  aria-hidden
                >
                  <svg viewBox="0 0 24 24" className="ml-px h-3.5 w-3.5" fill="currentColor">
                    <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l10.5-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14Z" />
                  </svg>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onOpenDialog}
            className="rounded-xl bg-[#9A41FE] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#8A35EE]"
          >
            Диалог с поддержкой
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

type HeaderNavMenuId = 'product' | 'campaigns' | 'stats' | 'tasks' | 'more' | 'help' | 'profile';

type ProductSpaceId = 'promotion' | 'media';

const MEDIA_PATH = '/media';

const PRODUCT_SPACES: { id: ProductSpaceId; label: string; shortLabel: string; to: string }[] = [
  { id: 'promotion', label: 'Продвижение', shortLabel: 'продвижение', to: PRODUCT_PROMOTION_CONCEPT_PATH },
  { id: 'media', label: 'Медиа', shortLabel: 'медиа', to: MEDIA_PATH },
];

function resolveProductSpace(pathname: string): ProductSpaceId {
  if (pathname === MEDIA_PATH || pathname.startsWith(`${MEDIA_PATH}/`)) return 'media';
  return 'promotion';
}

function headerMenuPanelClass(
  open: boolean,
  options?: { align?: 'left' | 'right'; pad?: 'pt-1' | 'pt-1.5' },
) {
  const align = options?.align === 'right' ? 'right-0' : 'left-0';
  const pad = options?.pad ?? 'pt-1.5';
  return `absolute ${align} top-full z-[60] ${pad} transition-opacity ${
    open ? 'visible opacity-100' : 'invisible pointer-events-none opacity-0'
  }`;
}
function truncateCompany(name: string, max = 22): string {
  if (name.length <= max) return name;
  return `${name.slice(0, max - 1)}…`;
}

function formatBonusAmount(n: number): string {
  return new Intl.NumberFormat('ru-RU').format(n);
}

export const PROMO_BONUS_TOTAL_BY_PROFILE: Record<ProfileId, number> = {
  '1': 250_000,
  '2': 250_000,
  '3': 5_000,
};

export const PROMOTION_ACCOUNT_BALANCE_BY_PROFILE: Record<ProfileId, number> = {
  '1': 105_350,
  '2': 105_350,
  '3': 12_400,
};

const TASKS_DROPDOWN_NEW_COUNT: Record<ProfileId, number> = {
  '1': 1,
  '2': 3,
  '3': 0,
};

const TASKS_DROPDOWN_EARN_MORE = 12_400;

const CAMPAIGNS_NAV_ITEMS = [
  { to: PRODUCT_PROMOTION_CONCEPT_PATH, label: 'Концепт товарного продвижения' },
  { to: CAMPAIGNS_WITH_WIDGETS_V1_PATH, label: 'Кампании с виджетами 1' },
  { to: '/campaigns-with-widgets', label: 'Кампании с виджетами 2' },
  { to: '/campaigns', label: 'Кампании с виджетами 3' },
] as const;

function isCampaignsNavPath(pathname: string): boolean {
  return CAMPAIGNS_NAV_ITEMS.some((item) => item.to === pathname);
}

const OVERVIEW_PATH = '/overview';

const STATS_NAV_ITEMS = [
  { to: '/stats', label: 'Общая сводка', icon: 'overview' as const },
  { to: '/stats/return', label: 'Вернувшиеся покупатели', icon: 'return' as const },
] as const;

function StatsNavItemIcon({
  name,
  className,
}: {
  name: (typeof STATS_NAV_ITEMS)[number]['icon'];
  className?: string;
}) {
  if (name === 'overview') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
        <path d="M3 3.75A.75.75 0 0 1 3.75 3h5.5a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-.75.75h-5.5A.75.75 0 0 1 3 9.25v-5.5Zm8 0A.75.75 0 0 1 11.75 3h5.5a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-.75.75h-5.5a.75.75 0 0 1-.75-.75v-5.5ZM3 11.75a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-.75.75h-5.5a.75.75 0 0 1-.75-.75v-5.5Zm8 0a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-.75.75h-5.5a.75.75 0 0 1-.75-.75v-5.5Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        d="M7.78 3.22a.75.75 0 0 1 0 1.06L5.56 6.5H11a6 6 0 0 1 0 12H9.75a.75.75 0 0 1 0-1.5H11a4.5 4.5 0 1 0 0-9H5.56l2.22 2.22a.75.75 0 1 1-1.06 1.06l-3.5-3.5a.75.75 0 0 1 0-1.06l3.5-3.5a.75.75 0 0 1 1.06 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function isStatsNavPath(pathname: string): boolean {
  return pathname === '/stats' || pathname.startsWith('/stats/');
}

const navItemClass = (active: boolean) =>
  `whitespace-nowrap px-3 py-2 rounded-lg transition-colors ${
    active ? 'bg-gray-100 text-black' : 'text-black hover:bg-gray-50'
  }`;

export function AppHeader({
  onNavigate,
  onLaunchPromotion,
  onOpenCampaignCreation,
  campaignCreationActive = false,
  researchAccess = null,
}: {
  onNavigate: () => void;
  onLaunchPromotion?: () => void;
  /** Для «Нового селлера»: вернуться на экран создания кампании */
  onOpenCampaignCreation?: () => void;
  /** Подсветка пункта «Создание кампании» */
  campaignCreationActive?: boolean;
  /** Урезанный доступ «Исследования»: скрыть лишнюю навигацию */
  researchAccess?: 'mass-creation' | 'bonuses' | null;
}) {
  const isMassCreationResearch = researchAccess === 'mass-creation';
  const isBonusesResearch = researchAccess === 'bonuses';
  const isResearchAccess = isMassCreationResearch || isBonusesResearch;
  const { profileId, setProfileId, activeProfile } = useProfile();
  const { promoBonusTotal } = usePromoBonusDemo();
  const location = useLocation();
  const navigate = useNavigate();
  const [bufferRub, setBufferRub] = useState(readFinanceBufferRub);
  useEffect(() => {
    const syncBuffer = () => setBufferRub(readFinanceBufferRub());
    window.addEventListener(FINANCE_BALANCE_DEMO_EVENT, syncBuffer);
    return () => window.removeEventListener(FINANCE_BALANCE_DEMO_EVENT, syncBuffer);
  }, []);
  const elsBalanceRub = PROMOTION_ACCOUNT_BALANCE_BY_PROFILE[profileId] + bufferRub;
  const newTasksCount = TASKS_DROPDOWN_NEW_COUNT[profileId];
  const campaignsNavActive = isCampaignsNavPath(location.pathname);
  const statsNavActive = isStatsNavPath(location.pathname);
  const helpNavActive = location.pathname === '/help' || location.pathname.startsWith('/help/');
  const productSpaceId = resolveProductSpace(location.pathname);
  const financeTo = financeHomePath(location.pathname);
  const financeTopUpTo = financeTopUpPath(location.pathname);
  const activeProductSpace =
    PRODUCT_SPACES.find((space) => space.id === productSpaceId) ?? PRODUCT_SPACES[0];
  const isNewSeller = isNewSellerProfile(profileId);
  const creationNavActive =
    campaignCreationActive ||
    (isNewSeller &&
      location.pathname !== '/finance' &&
      !location.pathname.startsWith('/bonuses'));

  const [openNavMenu, setOpenNavMenu] = useState<HeaderNavMenuId | null>(null);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const closeMenuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openNavMenuNow = (id: HeaderNavMenuId) => {
    if (closeMenuTimerRef.current) {
      clearTimeout(closeMenuTimerRef.current);
      closeMenuTimerRef.current = null;
    }
    setOpenNavMenu(id);
  };

  const scheduleCloseNavMenu = (id: HeaderNavMenuId) => {
    if (closeMenuTimerRef.current) clearTimeout(closeMenuTimerRef.current);
    closeMenuTimerRef.current = setTimeout(() => {
      setOpenNavMenu((current) => (current === id ? null : current));
      closeMenuTimerRef.current = null;
    }, 120);
  };

  useEffect(() => {
    return () => {
      if (closeMenuTimerRef.current) clearTimeout(closeMenuTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setOpenNavMenu(null);
  }, [location.pathname]);

  const openCampaignCreation = () => {
    if (onOpenCampaignCreation) {
      onOpenCampaignCreation();
      return;
    }
    navigate(NEW_SELLER_CREATE_CAMPAIGN_PATH);
    onNavigate();
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 h-14 bg-white">
        <div className="flex items-center gap-4">
          {isResearchAccess ? (
            <div className="inline-flex h-9 items-center gap-2 rounded-[10px] px-2.5">
              <span className="text-[15px] font-bold leading-none tracking-tight text-gray-900">
                {activeProductSpace.shortLabel}
              </span>
              <span className="text-sm font-medium text-gray-500">
                {isMassCreationResearch ? 'Массовое создание' : 'Промобонусы'}
              </span>
            </div>
          ) : (
          <div
            className="relative shrink-0"
            onMouseEnter={() => openNavMenuNow('product')}
            onMouseLeave={() => scheduleCloseNavMenu('product')}
          >
            <button
              type="button"
              onClick={() =>
                setOpenNavMenu((current) => (current === 'product' ? null : 'product'))
              }
              className={`inline-flex h-9 items-center gap-1.5 rounded-[10px] px-2.5 transition-colors ${
                openNavMenu === 'product' ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
              aria-expanded={openNavMenu === 'product'}
              aria-haspopup="menu"
              aria-label={`Раздел WB: ${activeProductSpace.label}`}
            >
              <span className="text-[15px] font-bold leading-none tracking-tight text-gray-900">
                {activeProductSpace.shortLabel}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-gray-500 transition-transform ${
                  openNavMenu === 'product' ? 'rotate-180' : ''
                }`}
              />
            </button>

            <div className={headerMenuPanelClass(openNavMenu === 'product', { pad: 'pt-1.5' })}>
              <ul
                className="min-w-[200px] overflow-hidden rounded-2xl border border-gray-200 bg-white p-1.5 shadow-lg"
                role="menu"
                aria-label="Разделы WB"
              >
                {PRODUCT_SPACES.map((space) => {
                  const active = space.id === productSpaceId;
                  return (
                    <li key={space.id} role="none">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setOpenNavMenu(null);
                          if (location.pathname !== space.to) {
                            navigate(space.to);
                            onNavigate();
                          }
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                          active
                            ? 'bg-gray-100 font-semibold text-gray-900'
                            : 'font-medium text-gray-800 hover:bg-gray-50'
                        }`}
                      >
                        <span>{space.label}</span>
                        {active ? (
                          <Check className="h-4 w-4 shrink-0 text-[#9a41fe]" aria-hidden />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
          )}

          {!isResearchAccess ? (
          <nav className="flex items-center gap-1 text-sm font-medium">
            {isNewSeller ? (
              <>
                <button
                  type="button"
                  onClick={openCampaignCreation}
                  className={navItemClass(creationNavActive)}
                  aria-current={creationNavActive ? 'page' : undefined}
                >
                  Создание кампании
                </button>
                <NavLink
                  to="/bonuses?tab=referral"
                  onClick={onNavigate}
                  className={({ isActive }) => navItemClass(isActive)}
                >
                  Мои бонусы
                </NavLink>
                <NavLink
                  to="/finance"
                  onClick={onNavigate}
                  className={({ isActive }) => navItemClass(isActive)}
                >
                  Финансы
                </NavLink>
              </>
            ) : (
              <>
                <NavLink
                  to={OVERVIEW_PATH}
                  onClick={onNavigate}
                  className={({ isActive }) => navItemClass(isActive)}
                >
                  Обзор
                </NavLink>
                <div
                  className="relative"
                  onMouseEnter={() => openNavMenuNow('campaigns')}
                  onMouseLeave={() => scheduleCloseNavMenu('campaigns')}
                >
                  <NavLink
                    to={PRODUCT_PROMOTION_CONCEPT_PATH}
                    onClick={onNavigate}
                    className={`inline-flex items-center gap-1 whitespace-nowrap px-3 py-2 rounded-lg transition-colors ${
                      campaignsNavActive || openNavMenu === 'campaigns'
                        ? 'bg-gray-100 text-black'
                        : 'text-black hover:bg-gray-50'
                    }`}
                  >
                    Кампании
                  </NavLink>

                  <div className={headerMenuPanelClass(openNavMenu === 'campaigns')}>
                    <ul
                      className="min-w-[240px] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
                      role="menu"
                      aria-label="Разделы кампаний"
                    >
                      {CAMPAIGNS_NAV_ITEMS.map((item) => {
                        const active = location.pathname === item.to;
                        return (
                          <li key={item.to} role="none">
                            <NavLink
                              to={item.to}
                              role="menuitem"
                              onClick={onNavigate}
                              className={`flex items-center justify-between gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-gray-50 ${
                                active ? 'bg-violet-50/80 font-medium text-gray-900' : 'text-gray-800'
                              }`}
                            >
                              <span>{item.label}</span>
                              {active && <Check className="h-4 w-4 shrink-0 text-[#9a41fe]" aria-hidden />}
                            </NavLink>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
                <div
                  className="relative"
                  onMouseEnter={() => openNavMenuNow('stats')}
                  onMouseLeave={() => scheduleCloseNavMenu('stats')}
                >
                  <NavLink
                    to="/stats"
                    onClick={onNavigate}
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-lg transition-colors ${
                      statsNavActive || openNavMenu === 'stats'
                        ? 'bg-gray-100 text-black'
                        : 'text-black hover:bg-gray-50'
                    }`}
                  >
                    Статистика
                  </NavLink>

                  <div className={headerMenuPanelClass(openNavMenu === 'stats')}>
                    <ul
                      className="w-max min-w-[280px] overflow-hidden rounded-xl bg-white py-1 shadow-lg"
                      role="menu"
                      aria-label="Разделы статистики"
                    >
                      {STATS_NAV_ITEMS.map((item, index) => {
                        const active = location.pathname === item.to;
                        return (
                          <li key={item.to} role="none">
                            <NavLink
                              to={item.to}
                              role="menuitem"
                              onClick={onNavigate}
                              className={`flex items-center justify-between gap-3 whitespace-nowrap px-3 py-2.5 text-sm transition-colors hover:bg-gray-50 ${
                                active ? 'bg-violet-50/80 font-medium text-gray-900' : 'text-gray-800'
                              }`}
                            >
                              <span>{item.label}</span>
                              <StatsNavItemIcon
                                name={item.icon}
                                className="h-4 w-4 shrink-0 text-gray-200"
                              />
                            </NavLink>
                            {index === 0 && (
                              <div className="my-1 border-t border-gray-100" role="separator" />
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
                <NavLink
                  to={financeTo}
                  onClick={onNavigate}
                  className={({ isActive }) => navItemClass(isActive)}
                >
                  Финансы
                </NavLink>
                <div
                  className="relative"
                  onMouseEnter={() => openNavMenuNow('tasks')}
                  onMouseLeave={() => scheduleCloseNavMenu('tasks')}
                >
                  <NavLink
                    to="/bonuses?tab=tasks"
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `block whitespace-nowrap px-3 py-2 rounded-lg transition-colors ${
                        isActive || openNavMenu === 'tasks'
                          ? 'bg-gray-100 text-black'
                          : 'text-black hover:bg-gray-50'
                      }`
                    }
                  >
                    Мои задания
                  </NavLink>

                  <div className={headerMenuPanelClass(openNavMenu === 'tasks')}>
                    <div
                      className="w-[320px] max-w-[calc(100vw-3rem)] rounded-xl border border-gray-100 bg-white p-3 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                      <div className="rounded-lg border border-gray-100 bg-[#fafafa] px-3 py-2.5">
                        <NavLink
                          to="/bonuses?tab=tasks"
                          onClick={onNavigate}
                          className="inline-block text-[11px] leading-snug text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9a41fe]/40 rounded-sm"
                        >
                          Промобонусы на счёте
                        </NavLink>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <NavLink
                            to="/bonuses?tab=tasks"
                            onClick={onNavigate}
                            className="min-w-0 shrink rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9a41fe]/40"
                          >
                            <p className="text-lg font-bold leading-tight tabular-nums tracking-tight text-gray-900">
                              {formatBonusAmount(promoBonusTotal)}
                              <span className="ml-0.5 text-sm font-semibold text-gray-600">₽</span>
                            </p>
                          </NavLink>
                          {onLaunchPromotion ? (
                            <button
                              type="button"
                              onClick={onLaunchPromotion}
                              className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 text-[10px] font-medium leading-snug text-gray-700 transition-colors hover:bg-gray-200"
                            >
                              Потратить на продвижение
                            </button>
                          ) : (
                            <NavLink
                              to="/campaigns"
                              onClick={onNavigate}
                              className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 text-[10px] font-medium leading-snug text-gray-700 transition-colors hover:bg-gray-200"
                            >
                              Потратить на продвижение
                            </NavLink>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-1.5">
                        <NavLink
                          to="/bonuses?tab=tasks"
                          onClick={onNavigate}
                          className="flex min-w-0 flex-col gap-1 rounded-lg bg-[#f5f5f7] px-2 py-1.5 text-left transition-colors hover:bg-[#ebebef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9a41fe]/40"
                        >
                          <div className="flex items-center gap-1 text-[10px] font-medium leading-none text-gray-500">
                            <span>Новые</span>
                            <span className="h-1 w-1 shrink-0 rounded-full bg-[#34c759]" aria-hidden />
                          </div>
                          <p className="text-base font-bold leading-none tabular-nums text-gray-900">{newTasksCount}</p>
                          <p className="text-[10px] leading-tight text-gray-500">
                            Ещё{' '}
                            <span className="font-semibold tabular-nums text-[#9a41fe]">
                              +{formatBonusAmount(TASKS_DROPDOWN_EARN_MORE)} ₽
                            </span>
                          </p>
                        </NavLink>
                        <NavLink
                          to="/bonuses?tab=tasks"
                          onClick={onNavigate}
                          className="flex min-w-0 flex-col gap-1 rounded-lg bg-[#f5f5f7] px-2 py-1.5 text-left transition-colors hover:bg-[#ebebef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9a41fe]/40"
                        >
                          <p className="text-[10px] font-medium leading-none text-gray-500">Выполняете</p>
                          <p className="text-base font-bold leading-none tabular-nums text-gray-900">3</p>
                        </NavLink>
                      </div>
                      <NavLink
                        to="/bonuses?tab=referral"
                        onClick={onNavigate}
                        className="mt-2 block rounded-lg bg-[#f3efff] px-3 py-2 text-left transition-colors hover:bg-[#ebe4ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9a41fe]/40"
                      >
                        <p className="text-sm font-semibold leading-snug text-gray-900">Реферальная программа</p>
                      </NavLink>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div
              className="relative"
              onMouseEnter={() => openNavMenuNow('help')}
              onMouseLeave={() => scheduleCloseNavMenu('help')}
            >
              <button
                type="button"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  helpNavActive || openNavMenu === 'help'
                    ? 'bg-gray-100 text-black'
                    : 'text-black hover:bg-gray-50'
                }`}
                aria-haspopup="menu"
                aria-expanded={openNavMenu === 'help'}
              >
                Помощь
              </button>

              <div className={headerMenuPanelClass(openNavMenu === 'help', { pad: 'pt-1' })}>
                <ul
                  className="min-w-[240px] overflow-hidden rounded-2xl border border-gray-100 bg-white py-3 shadow-xl"
                  role="menu"
                  aria-label="Помощь"
                >
                  <li role="none">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setOpenNavMenu(null);
                        setIsSupportModalOpen(true);
                      }}
                      className="block w-full px-5 py-2.5 text-left text-sm font-bold text-gray-900 transition-colors hover:bg-gray-50"
                    >
                      Поддержка
                    </button>
                  </li>
                  <li role="none">
                    <NavLink
                      to="/help"
                      role="menuitem"
                      onClick={onNavigate}
                      className="block px-5 py-2.5 text-sm font-bold text-gray-900 transition-colors hover:bg-gray-50"
                    >
                      Справочный центр
                    </NavLink>
                  </li>
                  <li role="none">
                    <NavLink
                      to="/help#help-video-heading"
                      role="menuitem"
                      onClick={onNavigate}
                      className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm font-bold text-gray-900 transition-colors hover:bg-gray-50"
                    >
                      <span>Видеоинструкции</span>
                      <span className="inline-flex shrink-0 items-center rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold leading-none tracking-wide text-emerald-800">
                        Новое
                      </span>
                    </NavLink>
                  </li>
                </ul>
              </div>
            </div>

            <a href="#" className="rounded-lg px-3 py-2 transition-opacity hover:opacity-80">
              Новости
            </a>

            <div
              className="relative"
              onMouseEnter={() => openNavMenuNow('more')}
              onMouseLeave={() => scheduleCloseNavMenu('more')}
            >
              <button
                type="button"
                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                  location.pathname === '/audience-metrics' || openNavMenu === 'more'
                    ? 'bg-gray-100 text-black'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                }`}
                aria-haspopup="menu"
                aria-expanded={openNavMenu === 'more'}
                aria-label="Ещё"
              >
                <MoreVertical className="h-5 w-5 rotate-90" aria-hidden />
              </button>

              <div className={headerMenuPanelClass(openNavMenu === 'more')}>
                <ul
                  className="min-w-[180px] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
                  role="menu"
                  aria-label="Дополнительные разделы"
                >
                  <li role="none">
                    <NavLink
                      to="/audience-metrics"
                      role="menuitem"
                      onClick={onNavigate}
                      className={`flex items-center justify-between gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-gray-50 ${
                        location.pathname === '/audience-metrics'
                          ? 'bg-violet-50/80 font-medium text-gray-900'
                          : 'text-gray-800'
                      }`}
                    >
                      <span>Аудитория</span>
                      {location.pathname === '/audience-metrics' && (
                        <Check className="h-4 w-4 shrink-0 text-[#9a41fe]" aria-hidden />
                      )}
                    </NavLink>
                  </li>
                </ul>
              </div>
            </div>
          </nav>
          ) : null}
        </div>

        <div className="flex items-center gap-3 text-sm font-medium text-black">
          <div className="flex items-center gap-2">
            <div className="min-w-0 leading-none">
              <p className="m-0 text-sm font-semibold tabular-nums tracking-tight text-gray-900">
                {formatBonusAmount(elsBalanceRub)} ₽
              </p>
              <p className="m-0 text-xs font-medium tabular-nums text-gray-500">
                {formatBonusAmount(promoBonusTotal)} B
              </p>
            </div>
            {!isResearchAccess ? (
              <NavLink
                to={financeTopUpTo}
                onClick={onNavigate}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F2F2F7] text-gray-900 transition-colors hover:bg-[#E8E8ED]"
                aria-label="Пополнить счёт"
              >
                <Plus className="h-4 w-4" aria-hidden />
              </NavLink>
            ) : null}
          </div>

          {!isResearchAccess ? (
            <>
              <div className="h-6 w-px shrink-0 bg-gray-200" aria-hidden />

              <div
                className="relative"
                onMouseEnter={() => openNavMenuNow('profile')}
                onMouseLeave={() => scheduleCloseNavMenu('profile')}
              >
                <button
                  type="button"
                  className={`flex max-w-[240px] items-center gap-1.5 rounded-lg py-1 pl-1 pr-0.5 text-black transition-colors hover:bg-gray-50 ${
                    openNavMenu === 'profile' ? 'bg-gray-50' : ''
                  }`}
                  aria-haspopup="listbox"
                  aria-expanded={openNavMenu === 'profile'}
                >
                  <span className="truncate text-left">{truncateCompany(activeProfile.company)}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${
                      openNavMenu === 'profile' ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <div className={headerMenuPanelClass(openNavMenu === 'profile', { align: 'right', pad: 'pt-1' })}>
                  <ul
                    className="min-w-[220px] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
                    role="listbox"
                    aria-label="Выбор профиля"
                  >
                    {PROFILES.map((profile) => {
                      const selected = profile.id === profileId;
                      return (
                        <li key={profile.id} role="option" aria-selected={selected}>
                          <button
                            type="button"
                            onClick={() => setProfileId(profile.id)}
                            className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${
                              selected ? 'bg-violet-50/80 text-gray-900' : 'text-gray-800'
                            }`}
                          >
                            <span>
                              <span className="block font-medium">{profile.label}</span>
                              <span className="block text-xs text-gray-500">{profile.company}</span>
                            </span>
                            {selected && <Check className="h-4 w-4 shrink-0 text-[#9a41fe]" aria-hidden />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="h-6 w-px shrink-0 bg-gray-200" aria-hidden />
              <span className="max-w-[240px] truncate text-sm text-gray-700">
                {truncateCompany(activeProfile.company)}
              </span>
            </>
          )}
        </div>
      </div>

      <SupportHelpModal
        open={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        onOpenDialog={() => setIsSupportModalOpen(false)}
        onSelectSuggestion={() => {
          setIsSupportModalOpen(false);
          navigate('/help#help-video-heading');
          onNavigate();
        }}
      />
    </header>
  );
}
