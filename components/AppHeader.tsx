import React from 'react';
import { NavLink } from 'react-router-dom';
import { Check, ChevronDown } from './Icons';
import { PROFILES, useProfile, type ProfileId } from './ProfileContext';

function truncateCompany(name: string, max = 22): string {
  if (name.length <= max) return name;
  return `${name.slice(0, max - 1)}…`;
}

export function AppHeader({ onNavigate }: { onNavigate: () => void }) {
  const { profileId, setProfileId, activeProfile } = useProfile();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 h-14 bg-white">
        <div className="flex items-center gap-6">
          <button type="button" className="flex items-center gap-1.5 text-black hover:opacity-90 transition-opacity">
            <span className="text-xl font-bold text-[#9a41fe]">wb</span>
            <span className="text-lg font-medium text-black">продвижение</span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          <nav className="flex items-center gap-1 text-sm font-medium">
            <NavLink
              to="/campaigns"
              onClick={onNavigate}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg transition-colors ${isActive ? 'bg-gray-100 text-black' : 'text-black hover:bg-gray-50'}`
              }
            >
              Кампании
            </NavLink>
            <NavLink
              to="/stats"
              onClick={onNavigate}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg transition-colors ${isActive ? 'bg-gray-100 text-black' : 'text-black hover:bg-gray-50'}`
              }
            >
              Статистика
            </NavLink>
            <NavLink
              to="/finance"
              onClick={onNavigate}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg transition-colors ${isActive ? 'bg-gray-100 text-black' : 'text-black hover:bg-gray-50'}`
              }
            >
              Финансы
            </NavLink>
            <div className="relative group/tasks">
              <NavLink
                to="/bonuses?tab=tasks"
                onClick={onNavigate}
                className={({ isActive }) =>
                  `block px-4 py-2 rounded-lg transition-colors ${isActive ? 'bg-gray-100 text-black' : 'text-black group-hover/tasks:bg-gray-100'}`
                }
              >
                Мои задания
              </NavLink>

              <div className="invisible absolute left-0 top-full z-[60] pt-1.5 opacity-0 transition-all group-hover/tasks:visible group-hover/tasks:opacity-100 group-focus-within/tasks:visible group-focus-within/tasks:opacity-100">
                <div
                  className="w-[272px] rounded-2xl border border-gray-100 bg-white p-3 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                >
                  <div className="grid grid-cols-2 gap-2">
                    <NavLink
                      to="/bonuses?tab=tasks"
                      onClick={onNavigate}
                      className="rounded-xl bg-[#f5f5f7] px-3 py-2.5 text-left transition-colors hover:bg-[#ebebef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9a41fe]/40"
                    >
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span>Новые</span>
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#34c759]" aria-hidden />
                      </div>
                      <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">1</p>
                      <p className="mt-1 text-[11px] leading-snug text-emerald-700">
                        Можете заработать еще{' '}
                        <span className="text-xs font-bold tabular-nums text-[#9a41fe]">12&nbsp;400&nbsp;₽</span>
                      </p>
                    </NavLink>
                    <NavLink
                      to="/bonuses?tab=tasks"
                      onClick={onNavigate}
                      className="rounded-xl bg-[#f5f5f7] px-3 py-2.5 text-left transition-colors hover:bg-[#ebebef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9a41fe]/40"
                    >
                      <p className="text-xs text-gray-500">Выполняете</p>
                      <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">3</p>
                    </NavLink>
                  </div>
                  <NavLink
                    to="/bonuses?tab=referral"
                    onClick={onNavigate}
                    className="mt-2 block rounded-xl bg-[#f3efff] px-3 py-2.5 text-left transition-colors hover:bg-[#ebe4ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9a41fe]/40"
                  >
                    <p className="text-sm font-semibold text-gray-900">Реферальная программа</p>
                  </NavLink>
                </div>
              </div>
            </div>
          </nav>
        </div>

        <div className="flex items-center gap-6 text-sm font-medium text-black">
          <a href="#" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            Помощь
            <span className="flex items-center justify-center min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-medium rounded-full">3</span>
          </a>
          <a href="#" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            Новости
            <span className="flex items-center justify-center min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-medium rounded-full">2</span>
          </a>

          <div className="relative group/profile">
            <button
              type="button"
              className="flex max-w-[240px] items-center gap-1.5 rounded-lg py-1 pl-1 pr-0.5 text-black transition-colors hover:bg-gray-50 group-hover/profile:bg-gray-50"
              aria-haspopup="listbox"
              aria-expanded="false"
            >
              <span className="truncate text-left">{truncateCompany(activeProfile.company)}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-gray-500 transition-transform group-hover/profile:rotate-180" />
            </button>

            <div className="invisible absolute right-0 top-full z-[60] pt-1 opacity-0 transition-all group-hover/profile:visible group-hover/profile:opacity-100 group-focus-within/profile:visible group-focus-within/profile:opacity-100">
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
        </div>
      </div>
    </header>
  );
}
