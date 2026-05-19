import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowUp, Calendar, ChevronDown, ChevronRight, Check } from '../components/Icons';
import { useProfile } from '../components/ProfileContext';
const REFERRAL_PROMO_BASE = 'https://seller.wildberries.ru/promotion/referral';
const REFERRAL_CODE_PREFIX = '038';

type TrafficSource = {
  id: string;
  label: string;
  slug: string;
  code: string;
};

const DEFAULT_TRAFFIC_SOURCES: TrafficSource[] = [
  { id: 'src-direct', label: 'Основной', slug: 'direct', code: '038UYTK' },
  { id: 'src-youtube', label: 'YouTube', slug: 'youtube', code: '038YT01' },
  { id: 'src-telegram', label: 'Telegram', slug: 'telegram', code: '038TG01' },
  { id: 'src-vk', label: 'VK', slug: 'vk', code: '038VK01' },
];

const DEFAULT_TRAFFIC_SOURCE_IDS = new Set(DEFAULT_TRAFFIC_SOURCES.map((s) => s.id));

function withCanonicalTrafficLabels(list: TrafficSource[]): TrafficSource[] {
  return list.map((s) => (s.id === 'src-direct' ? { ...s, label: 'Основной' } : s));
}

function isCustomTrafficSource(source: TrafficSource): boolean {
  return !DEFAULT_TRAFFIC_SOURCE_IDS.has(source.id);
}

const TRAFFIC_SOURCE_LABELS_FOR_MOCK = DEFAULT_TRAFFIC_SOURCES.map((s) => s.label);

function slugifyTrafficLabel(label: string): string {
  const trimmed = label.trim().toLowerCase();
  const map: Record<string, string> = {
    ютуб: 'youtube',
    youtube: 'youtube',
    телеграм: 'telegram',
    telegram: 'telegram',
    вк: 'vk',
    vk: 'vk',
    инстаграм: 'instagram',
    instagram: 'instagram',
  };
  if (map[trimmed]) return map[trimmed];
  const latin = trimmed
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 32);
  return latin || `custom_${Date.now().toString(36)}`;
}

function buildReferralLinkForSource(source: Pick<TrafficSource, 'code' | 'slug'>): string {
  const url = new URL(REFERRAL_PROMO_BASE);
  url.searchParams.set('code', source.code);
  url.searchParams.set('utm_source', source.slug);
  return url.toString();
}

function generateReferralCodeFromSlug(slug: string, takenCodes: Set<string>): string {
  const tail = slug.replace(/[^a-z0-9]/gi, '').toUpperCase();
  const seeds = [
    tail === 'DIRECT' ? 'UYTK' : tail.slice(0, 5),
    tail.slice(0, 3),
    `${tail.slice(0, 2)}${Date.now().toString(36).toUpperCase()}`,
  ];
  for (const seed of seeds) {
    const candidate = `${REFERRAL_CODE_PREFIX}${seed}`.replace(/[^A-Z0-9]/g, '').slice(0, 8);
    const normalized = candidate.length >= 6 ? candidate : `${REFERRAL_CODE_PREFIX}UYTK`;
    if (!takenCodes.has(normalized)) return normalized;
  }
  let i = 1;
  while (i < 1000) {
    const candidate = `${REFERRAL_CODE_PREFIX}${String(i).padStart(5, '0')}`.slice(0, 8);
    if (!takenCodes.has(candidate)) return candidate;
    i += 1;
  }
  return `${REFERRAL_CODE_PREFIX}${Date.now().toString(36).toUpperCase()}`.slice(0, 8);
}

type TabId = 'tasks' | 'history' | 'referral';

function parseBonusesTab(value: string | null): TabId {
  if (value === 'history' || value === 'referral' || value === 'tasks') return value;
  return 'tasks';
}

const REFERRAL_FAQ_ITEMS = [
  {
    question: 'Сколько человек я могу пригласить?',
    answer:
      'Количество приглашений не ограничено. Каждый новый селлер, который подходит под условия программы (не продвигался больше 6 месяцев), может быть привязан к вашему приглашению.',
  },
  {
    question: 'Как пригласить селлера?',
    answer:
      'В блоке «Пригласите продавца в продвижение» скопируйте ссылку, код или QR для нужного источника трафика и отправьте селлеру. Он может перейти по ссылке или ввести код в задании на вкладке «Задания».',
  },
  {
    question: 'Что делать приглашённому селлеру?',
    answer:
      'Перейти по вашей ссылке или ввести код, активировать приглашение, пополнить бюджет и запустить кампанию с бюджетом от 2 000 ₽. После полной траты бюджета кампании ему начислят до 3 000 ₽ промобонусов; на второй запуск также действует бонус по условиям программы.',
  },
  {
    question: 'На что я могу потратить баллы?',
    answer:
      'Промобонусы (баллы) можно тратить на продвижение товаров: 1 промобонус = 1 ₽ к оплате открутки. Списание происходит при запуске и ведении кампаний, где доступна оплата бонусами.',
  },
  {
    question: 'Как узнать, что приглашённый выполнил условия?',
    answer:
      'В разделе «Вы пригласили» отображается список селлеров и статус этапов: «Потратить 1 000 ₽ на продвижение» и «Продвигался 3 месяца». Когда этап выполнен, в строке будет отметка «Выполнил», а начисленные бонусы появятся в истории и в счётчике «Заработали баллов».',
  },
  {
    question:
      'Как быстро приглашённый должен выполнить условия после перехода по ссылке или введения кода?',
    answer:
      'Сроки считаются с момента активации приглашения (переход по ссылке или успешный ввод кода). Первый этап — потратить 1 000 ₽ на продвижение — нужно выполнить в течение 90 календарных дней; удержание в продвижении 3 месяца отслеживается отдельно после запуска. Подробные сроки смотрите в «Условия и завершенные акции».',
  },
  {
    question: 'Что делать, если ссылка не работает?',
    answer:
      'Попросите селлера открыть ссылку в браузере, где он авторизован в кабинете продавца, или отправьте код отдельно — его можно ввести вручную в задании. Проверьте, что ссылка скопирована целиком. Если проблема остаётся, нажмите «Написать» ниже — поддержка проверит приглашение.',
  },
  {
    question: 'Могу ли я приглашать, если нет кампаний в продвижении?',
    answer:
      'Да. Делиться ссылкой или кодом можно и без активных кампаний. Чтобы получать бонусы за приглашённых, ваш аккаунт должен участвовать в программе продвижения; сами приглашения при этом отправлять можно в любой момент.',
  },
] as const;

function ReferralHowItWorksSection() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  return (
    <section
      id="referral-faq"
      className="scroll-mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
    >
      <h2 className="mb-4 text-xl font-bold text-gray-900">Как это работает?</h2>
      <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100 bg-gray-50/50">
        {REFERRAL_FAQ_ITEMS.map((item, i) => {
          const open = faqOpen === i;
          return (
            <li key={item.question}>
              <button
                type="button"
                onClick={() => setFaqOpen(open ? null : i)}
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50/80"
              >
                <span className="pr-2">{item.question}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              </button>
              {open && (
                <div className="border-t border-gray-100 bg-white px-4 py-3 text-sm leading-relaxed text-gray-600">
                  {item.answer}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600">Остались вопросы?</p>
        <button
          type="button"
          className="inline-flex items-center justify-center self-start rounded-xl bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-900 sm:self-auto"
        >
          Написать
        </button>
      </div>
    </section>
  );
}


type RowConfig = {
  tone: 'done' | 'progress';
  icon: 'zap' | 'package';
  title: string;
  subtitle: string;
  reward: string;
  rewardStyle: 'done' | 'locked';
};

type Invitee = {
  id: string;
  inviteId: string;
  invitedDaysAgo: number;
  trafficSourceLabel: string;
  rows: RowConfig[];
};

function buildMockInvitees(): Invitee[] {
  return Array.from({ length: 50 }, (_, i) => {
    const doneSpend = i % 3 === 0;
    const doneRetention = i % 7 === 0;
    return {
      id: `inv-${i}`,
      inviteId: String(100_000 + i).padStart(6, '0'),
      invitedDaysAgo: (i % 28) + 1,
      trafficSourceLabel: TRAFFIC_SOURCE_LABELS_FOR_MOCK[i % TRAFFIC_SOURCE_LABELS_FOR_MOCK.length],
      rows: [
        {
          tone: doneSpend ? 'done' : 'progress',
          icon: 'zap',
          title: 'Потратить 1 000 ₽ на продвижение',
          subtitle: doneSpend ? 'Выполнил' : 'Выполняется',
          reward: doneSpend ? '+ 1 000' : '+ 1 000',
          rewardStyle: doneSpend ? 'done' : 'locked',
        },
        {
          tone: doneRetention ? 'done' : 'progress',
          icon: 'package',
          title: 'Продвигался 3 месяца',
          subtitle: doneRetention ? 'Выполнил' : 'Выполняется',
          reward: '+ 4 000',
          rewardStyle: doneRetention ? 'done' : 'locked',
        },
      ],
    };
  });
}

const MOCK_INVITEES = buildMockInvitees();

type InviteeListFilter = 'all' | 'spending' | 'completed';
type InviteeDateSort = 'asc' | 'desc';

const INVITEE_FILTER_TABS: { id: InviteeListFilter; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'spending', label: 'В процессе' },
  { id: 'completed', label: 'Выполнили' },
];

function isInviteeCompleted(inv: Invitee): boolean {
  const spend = inv.rows.find((r) => r.icon === 'zap');
  const retention = inv.rows.find((r) => r.icon === 'package');
  return spend?.tone === 'done' && retention?.tone === 'done';
}

function isInviteeSpending(inv: Invitee): boolean {
  if (isInviteeCompleted(inv)) return false;
  return inv.rows.some((r) => r.tone === 'progress');
}

function filterInvitees(list: Invitee[], filter: InviteeListFilter): Invitee[] {
  if (filter === 'all') return list;
  if (filter === 'completed') return list.filter(isInviteeCompleted);
  return list.filter(isInviteeSpending);
}

function sortInviteesByDate(list: Invitee[], sort: InviteeDateSort): Invitee[] {
  const copy = [...list];
  copy.sort((a, b) =>
    sort === 'asc' ? a.invitedDaysAgo - b.invitedDaysAgo : b.invitedDaysAgo - a.invitedDaysAgo,
  );
  return copy;
}

function invitedDateOnly(daysAgo: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - Math.max(0, daysAgo));
  const formatted = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
  return formatted.replace(/\s*г\.?\s*$/u, '').trim();
}

function formatNum(n: number): string {
  return n.toLocaleString('ru-RU', { useGrouping: true });
}

const REFERRAL_QR_DOT = '#9a41fe';
const QR_GRID = 25;

function finderModule(ax: number, ay: number, ox: number, oy: number): boolean {
  const x = ax - ox;
  const y = ay - oy;
  if (x < 0 || x > 6 || y < 0 || y > 6) return false;
  if (x === 0 || x === 6 || y === 0 || y === 6) return true;
  if (x >= 2 && x <= 4 && y >= 2 && y <= 4) return true;
  return false;
}

function isQrCellFilled(x: number, y: number, n: number): boolean {
  let on =
    finderModule(x, y, 0, 0) || finderModule(x, y, n - 7, 0) || finderModule(x, y, 0, n - 7);
  if (!on && (x * 13 + y * 7) % 6 === 0) on = true;
  return on;
}

function buildReferralQrSvg(dotColor: string, exportSize = 512): string {
  const n = QR_GRID;
  const rects: string[] = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (isQrCellFilled(x, y, n)) {
        rects.push(`<rect x="${x}" y="${y}" width="0.92" height="0.92" fill="${dotColor}"/>`);
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" width="${exportSize}" height="${exportSize}"><rect width="${n}" height="${n}" fill="white"/>${rects.join('')}</svg>`;
}

function triggerFileDownload(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadReferralQrSvg(sourceCode: string, sourceSlug: string) {
  const svg = buildReferralQrSvg(REFERRAL_QR_DOT);
  triggerFileDownload(`referral-qr-${sourceCode}-${sourceSlug}.svg`, new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
}

function downloadReferralQrPng(sourceCode: string, sourceSlug: string): Promise<void> {
  const svg = buildReferralQrSvg(REFERRAL_QR_DOT);
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const size = 512;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('canvas'));
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('blob'));
          return;
        }
        triggerFileDownload(`referral-qr-${sourceCode}-${sourceSlug}.png`, blob);
        resolve();
      }, 'image/png');
    };
    img.onerror = () => reject(new Error('image'));
    img.src = dataUrl;
  });
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}


function ReferralSellerPromotionCard() {
  const { beginReferralCreationFlow } = useProfile();
  const [referralInput, setReferralInput] = useState('');
  const [codeApplied, setCodeApplied] = useState(false);

  const handleApplyCode = () => {
    if (!referralInput.trim()) return;
    setCodeApplied(true);
    beginReferralCreationFlow();
  };

  const steps = [
    {
      key: 'code',
      title: 'Примените реферальную ссылку или код',
      done: codeApplied,
    },
    {
      key: 'launch',
      title: 'Запустите кампанию с бюджетом 2 000 ₽',
      done: false,
    },
    {
      key: 'bonus',
      title: 'Получите 3 000 ₽ после траты бюджета кампании',
      done: false,
    },
  ] as const;

  return (
    <article className="rounded-[20px] border border-gray-100/90 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] sm:p-7">
      <div className="flex flex-col gap-6 sm:flex-row sm:gap-6">
        <div className="flex h-[104px] w-[104px] shrink-0 items-center justify-center rounded-2xl bg-[#f3efff] px-3 text-center text-sm font-semibold leading-snug text-[#7c3aed]">
          до 3&nbsp;000&nbsp;₽
        </div>
        <div className="min-w-0 flex-1">
          <div className="space-y-2">
            <span className="inline-flex rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-900">
              Новое
            </span>
            <h3 className="max-w-xl text-lg font-bold leading-snug text-gray-900">
              Бонус за запуск по реферальной ссылке
            </h3>
            <p className="max-w-xl text-sm text-gray-600">
              Задание для селлера: активируйте приглашение и запустите продвижение с минимальным бюджетом.
            </p>
          </div>

          <ul className="mt-6 max-w-xl divide-y divide-gray-100">
            {steps.map((step, index) => (
              <li key={step.key} className={index === 0 ? 'pb-4' : 'py-4'}>
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold leading-none ${
                      step.done ? 'bg-[#9a41fe] text-white' : 'bg-[#f3efff] text-[#7c3aed]'
                    }`}
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm font-medium text-gray-900">{step.title}</p>
                    {step.key === 'code' && (
                      <div className="mt-3 flex overflow-hidden rounded-lg border border-gray-200 bg-white focus-within:border-violet-300 focus-within:ring-1 focus-within:ring-violet-100">
                        <input
                          type="text"
                          value={referralInput}
                          onChange={(e) => {
                            setReferralInput(e.target.value);
                            setCodeApplied(false);
                          }}
                          onKeyDown={(e) => e.key === 'Enter' && handleApplyCode()}
                          placeholder="Вставьте ссылку или код"
                          className="min-w-0 flex-1 border-0 bg-transparent px-2.5 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
                          aria-label="Реферальная ссылка или код"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCode}
                          disabled={!referralInput.trim()}
                          className="m-1 shrink-0 rounded-md bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-900 transition-colors hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Применить
                        </button>
                      </div>
                    )}
                    {step.key === 'code' && codeApplied && (
                      <p className="mt-2 text-xs font-medium text-emerald-600">Код принят</p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

function ReferralInvitePanel() {
  const [toast, setToast] = useState<string | null>(null);
  const [sourceSettingsOpen, setSourceSettingsOpen] = useState(false);
  const [settingsFocus, setSettingsFocus] = useState<'link' | 'code' | 'qr'>('link');
  const [sources, setSources] = useState<TrafficSource[]>(() =>
    withCanonicalTrafficLabels(DEFAULT_TRAFFIC_SOURCES.map((s) => ({ ...s }))),
  );
  const [activeSourceId, setActiveSourceId] = useState(DEFAULT_TRAFFIC_SOURCES[0].id);
  const [newSourceLabel, setNewSourceLabel] = useState('');
  const [addTagFormOpen, setAddTagFormOpen] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeSource = useMemo(
    () => sources.find((s) => s.id === activeSourceId) ?? sources[0],
    [sources, activeSourceId],
  );

  const activeReferralCode = activeSource?.code ?? DEFAULT_TRAFFIC_SOURCES[0].code;

  const activeReferralLink = useMemo(
    () =>
      activeSource
        ? buildReferralLinkForSource(activeSource)
        : buildReferralLinkForSource(DEFAULT_TRAFFIC_SOURCES[0]),
    [activeSource],
  );

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }, []);

  const copyAndToast = useCallback(
    async (text: string, okMsg: string) => {
      const ok = await copyText(text);
      showToast(ok ? okMsg : 'Не удалось скопировать');
    },
    [showToast],
  );

  const addTrafficSource = useCallback(() => {
    const label = newSourceLabel.trim();
    if (!label) return;
    const slug = slugifyTrafficLabel(label);
    if (sources.some((s) => s.slug === slug || s.label.toLowerCase() === label.toLowerCase())) {
      showToast('Такая метка уже есть');
      return;
    }
    const takenCodes = new Set(sources.map((s) => s.code));
    const code = generateReferralCodeFromSlug(slug, takenCodes);
    const created: TrafficSource = {
      id: `src-${slug}-${Date.now().toString(36)}`,
      label,
      slug,
      code,
    };
    setSources((prev) => withCanonicalTrafficLabels([...prev, created]));
    setActiveSourceId(created.id);
    setNewSourceLabel('');
    setAddTagFormOpen(false);
    showToast('Метка добавлена');
  }, [newSourceLabel, sources, showToast]);

  const removeTrafficSource = useCallback(
    (id: string) => {
      const target = sources.find((s) => s.id === id);
      if (!target || !isCustomTrafficSource(target)) return;

      const remaining = sources.filter((s) => s.id !== id);
      setSources(withCanonicalTrafficLabels(remaining));
      setActiveSourceId((current) =>
        current === id ? (remaining[0]?.id ?? DEFAULT_TRAFFIC_SOURCES[0].id) : current,
      );
      showToast('Метка удалена');
    },
    [sources, showToast],
  );

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const handleDownloadQrSvg = useCallback(() => {
    if (!activeSource) return;
    try {
      downloadReferralQrSvg(activeSource.code, activeSource.slug);
      showToast('SVG скачан');
    } catch {
      showToast('Не удалось скачать SVG');
    }
  }, [activeSource, showToast]);

  const handleDownloadQrPng = useCallback(async () => {
    if (!activeSource) return;
    try {
      await downloadReferralQrPng(activeSource.code, activeSource.slug);
      showToast('PNG скачан');
    } catch {
      showToast('Не удалось скачать PNG');
    }
  }, [activeSource, showToast]);

  const openSourceSettings = useCallback((focus: 'link' | 'code' | 'qr') => {
    setSettingsFocus(focus);
    setAddTagFormOpen(false);
    setSourceSettingsOpen(true);
  }, []);

  const closeSourceSettings = useCallback(() => {
    setAddTagFormOpen(false);
    setSourceSettingsOpen(false);
  }, []);

  const renderSourceChips = (chipTone: 'onPurple' | 'onWhite') => {
    const selectedClass =
      chipTone === 'onPurple'
        ? 'bg-white text-[#7c3aed] shadow-sm'
        : 'bg-[#9a41fe] text-white shadow-sm';
    const idleClass =
      chipTone === 'onPurple'
        ? 'bg-white/15 text-white hover:bg-white/25'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200';

    return sources.map((source) => {
      const selected = source.id === activeSource?.id;
      const custom = isCustomTrafficSource(source);
      const chipClass = selected ? selectedClass : idleClass;

      if (!custom) {
        return (
          <button
            key={source.id}
            type="button"
            onClick={() => setActiveSourceId(source.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${chipClass}`}
          >
            {source.label}
          </button>
        );
      }

      return (
        <span
          key={source.id}
          className={`inline-flex items-center rounded-full text-xs font-semibold transition-colors ${chipClass}`}
        >
          <button
            type="button"
            onClick={() => setActiveSourceId(source.id)}
            className="rounded-l-full py-1.5 pl-3 pr-1"
          >
            {source.label}
          </button>
          <button
            type="button"
            onClick={() => removeTrafficSource(source.id)}
            className={`rounded-r-full py-1.5 pr-2 pl-0.5 text-sm leading-none ${
              chipTone === 'onPurple'
                ? selected
                  ? 'text-[#7c3aed]/70 hover:text-[#7c3aed]'
                  : 'text-white/70 hover:text-white'
                : selected
                  ? 'text-white/80 hover:text-white'
                  : 'text-gray-500 hover:text-gray-800'
            }`}
            aria-label={`Удалить метку ${source.label}`}
          >
            ×
          </button>
        </span>
      );
    });
  };

  return (
    <section className="relative overflow-hidden rounded-2xl bg-[#9a41fe] p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1 space-y-1.5 sm:max-w-md">
          <h2 className="text-lg font-bold leading-snug text-white sm:text-xl">
            Пригласите продавца в продвижение
          </h2>
          <ul className="space-y-1 text-xs leading-snug text-white/90 sm:text-sm">
            <li>— Пригласить можно селлера, который не продвигался больше 6 месяцев.</li>
            <li>— Получите по 1 000 ₽, когда реферал запустит продвижение</li>
            <li>— Получите 5 000 ₽, если реферал останется в продвижении на 3 месяца</li>
          </ul>
        </div>

        <div className="grid w-full shrink-0 grid-cols-3 items-stretch gap-2 sm:w-auto sm:max-w-[300px]">
          <button
            type="button"
            className="flex min-h-[4.5rem] min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-gray-200/90 bg-white px-2 py-2.5 text-center shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            aria-label={`Скопировать ссылку, источник ${activeSource?.label ?? ''}`}
            onClick={() => openSourceSettings('link')}
          >
            <LinkChainIcon className="h-4 w-4 shrink-0 text-[#9a41fe]" />
            <span className="text-[10px] font-semibold leading-snug text-gray-900">Скопировать ссылку</span>
          </button>
          <button
            type="button"
            className="flex min-h-[4.5rem] min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-gray-200/90 bg-white px-2 py-2.5 text-center shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            aria-label="Скопировать код приглашения"
            onClick={() => openSourceSettings('code')}
          >
            <HashIcon className="h-4 w-4 shrink-0 text-[#9a41fe]" />
            <span className="text-[10px] font-semibold leading-snug text-gray-900">Скопировать код</span>
          </button>
          <button
            type="button"
            className="flex min-h-[4.5rem] min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-gray-200/90 bg-white px-2 py-2.5 text-center shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            aria-label={`Показать QR, источник ${activeSource?.label ?? ''}`}
            onClick={() => openSourceSettings('qr')}
          >
            <QrPlaceholder className="h-7 w-7 shrink-0 rounded-sm" dotColor="#9a41fe" />
            <span className="text-[10px] font-semibold leading-snug text-gray-900">Показать QR</span>
          </button>
        </div>
      </div>

      {toast && (
        <div
          className="pointer-events-none fixed bottom-28 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-gray-900 px-3 py-2 text-xs font-medium text-white shadow-lg sm:bottom-32"
          role="status"
        >
          {toast}
        </div>
      )}

      {sourceSettingsOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Настройка ссылки"
          onClick={closeSourceSettings}
        >
          <div
            className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-2 top-2 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Закрыть"
              onClick={closeSourceSettings}
            >
              <span className="text-lg leading-none">×</span>
            </button>
            <h3 className="pr-10 text-base font-bold text-gray-900">Настройка ссылки</h3>

            <div className="mt-4 flex rounded-xl bg-gray-100 p-1" role="tablist">
              {(
                [
                  { id: 'link' as const, label: 'Ссылка' },
                  { id: 'code' as const, label: 'Код' },
                  { id: 'qr' as const, label: 'QR' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={settingsFocus === tab.id}
                  onClick={() => setSettingsFocus(tab.id)}
                  className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
                    settingsFocus === tab.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {settingsFocus === 'link' && (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-3.5">
                <p className="min-w-0 flex-1 break-all text-sm leading-snug text-gray-900 sm:text-base">
                  {activeReferralLink}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    copyAndToast(activeReferralLink, `Ссылка «${activeSource?.label ?? ''}» скопирована`)
                  }
                  className="shrink-0 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-200/80 hover:text-gray-900"
                  aria-label="Копировать ссылку"
                >
                  <CopyIcon className="h-5 w-5" />
                </button>
              </div>
            )}

            {settingsFocus === 'code' && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-3.5">
                <p className="min-w-0 flex-1 text-center text-xl font-bold tracking-wide text-gray-900 tabular-nums sm:text-2xl">
                  {activeReferralCode}
                </p>
                <button
                  type="button"
                  onClick={() => copyAndToast(activeReferralCode, 'Код скопирован')}
                  className="shrink-0 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-200/80 hover:text-gray-900"
                  aria-label="Копировать код"
                >
                  <CopyIcon className="h-5 w-5" />
                </button>
              </div>
            )}

            {settingsFocus === 'qr' && (
              <div className="mt-4 space-y-3">
                <div className="flex justify-center rounded-xl bg-gray-50 p-3">
                  <QrPlaceholder className="h-[180px] w-[180px]" dotColor={REFERRAL_QR_DOT} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadQrSvg}
                    className="rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                  >
                    Скачать SVG
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadQrPng}
                    className="rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                  >
                    Скачать PNG
                  </button>
                </div>
              </div>
            )}

            {addTagFormOpen ? (
              <>
                <div className="mt-3 flex flex-wrap gap-1.5">{renderSourceChips('onWhite')}</div>
                <form
                  className="mt-2 flex flex-wrap gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  addTrafficSource();
                }}
              >
                <input
                  type="text"
                  value={newSourceLabel}
                  onChange={(e) => setNewSourceLabel(e.target.value)}
                  placeholder="Новая метка, например TikTok"
                  className="min-w-[12rem] flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newSourceLabel.trim()}
                  className="shrink-0 rounded-xl bg-[#9a41fe] px-3 py-2 text-xs font-semibold text-white hover:bg-[#8840e5] disabled:opacity-40"
                >
                  Добавить
                </button>
              </form>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setAddTagFormOpen(true)}
                className="mt-3 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                добавить метку
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

type HistoryEntry = {
  id: string;
  date: string;
  amount: number;
  kind: 'expiring' | 'permanent';
  expiresAt?: string;
  source?: 'default' | 'referral';
  referralInviteId?: string;
  referralMilestone?: string;
};

const HISTORY_FILTER_OPTIONS = ['История пополнений', 'История списаний'] as const;

const REFERRAL_HISTORY_ENTRIES: HistoryEntry[] = [
  {
    id: 'ref-hist-1',
    date: '18.03.2024',
    amount: 1_000,
    kind: 'expiring',
    expiresAt: '18.04.2024',
    source: 'referral',
    referralInviteId: '100012',
  },
  {
    id: 'ref-hist-2',
    date: '05.03.2024',
    amount: 4_000,
    kind: 'permanent',
    source: 'referral',
    referralInviteId: '100358',
    referralMilestone: 'удержание в продвижении 3 месяца',
  },
];

function buildMockHistory(): HistoryEntry[] {
  return Array.from({ length: 47 }, (_, i) => ({
    id: `hist-${i}`,
    date: '13.03.2024',
    amount: 30_564,
    kind: i % 3 === 0 ? 'permanent' : 'expiring',
    expiresAt: i % 3 === 0 ? undefined : '31.03.2024',
  }));
}

const MOCK_HISTORY = buildMockHistory();

function HistoryEntryRow({ entry }: { entry: HistoryEntry }) {
  const isReferral = entry.source === 'referral';

  return (
    <li
      className={`flex items-center gap-4 px-5 py-4 sm:px-6 ${isReferral ? 'bg-violet-50/50' : ''}`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg font-medium ${
          isReferral ? 'bg-violet-100 text-[#9a41fe]' : 'bg-gray-100 text-emerald-600'
        }`}
      >
        +
      </span>
      <span className="w-[88px] shrink-0 text-sm font-medium text-gray-900 tabular-nums">{entry.date}</span>
      <div className="min-w-0 flex-1 text-sm text-gray-500">
        {isReferral ? (
          <span className="block leading-snug">
            <span className="font-medium text-[#7c3aed]">Реферальная программа</span>
            <span className="text-gray-600">
              {' '}
              — ID {entry.referralInviteId}
              {entry.referralMilestone ? ` ${entry.referralMilestone}` : ''}
            </span>
            {entry.kind === 'expiring' && entry.expiresAt && (
              <span className="mt-1 flex items-center gap-1 text-gray-500">
                <span className="text-[#FF6B6B]" aria-hidden>
                  🔥
                </span>
                сгорит {entry.expiresAt}
              </span>
            )}
          </span>
        ) : entry.kind === 'expiring' ? (
          <span className="inline-flex flex-wrap items-center gap-1">
            <span className="text-[#FF6B6B]" aria-hidden>
              🔥
            </span>
            <span>сгорит {entry.expiresAt}</span>
          </span>
        ) : (
          <span>несгораемые промобонусы</span>
        )}
      </div>
      <span className="shrink-0 text-base font-semibold tabular-nums text-[#9a41fe]">
        + {formatNum(entry.amount)}
      </span>
    </li>
  );
}

function ListPaginationFooter({
  totalItems,
  page,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  onCloseSiblingDropdown,
}: {
  totalItems: number;
  page: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  onCloseSiblingDropdown?: () => void;
}) {
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const [pageInput, setPageInput] = useState('');

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    let start = Math.max(1, safePage - 2);
    const end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [safePage, totalPages]);

  const applyPageInput = () => {
    const n = parseInt(pageInput.trim(), 10);
    if (!Number.isNaN(n) && n >= 1 && n <= totalPages) onPageChange(n);
    setPageInput('');
  };

  return (
    <div className="flex flex-col gap-4 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
        <span>Показать записей</span>
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setPageSizeOpen(!pageSizeOpen);
              onCloseSiblingDropdown?.();
            }}
            className="inline-flex min-w-[56px] items-center justify-between gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm tabular-nums hover:border-gray-300"
          >
            {pageSize}
            <ChevronDown className={`h-4 w-4 text-gray-500 ${pageSizeOpen ? 'rotate-180' : ''}`} />
          </button>
          {pageSizeOpen && (
            <ul className="absolute bottom-full left-0 z-20 mb-1 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              {pageSizeOptions.map((n) => (
                <li key={n}>
                  <button
                    type="button"
                    className="w-full px-4 py-1.5 text-left text-sm hover:bg-gray-50"
                    onClick={() => {
                      onPageSizeChange(n);
                      setPageSizeOpen(false);
                    }}
                  >
                    {n}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:justify-center">
        <input
          type="text"
          inputMode="numeric"
          placeholder="№ страницы"
          value={pageInput}
          onChange={(e) => setPageInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyPageInput()}
          className="w-[120px] rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#9a41fe] focus:outline-none focus:ring-1 focus:ring-[#9a41fe]"
        />
      </div>

      <div className="flex items-center gap-1 sm:justify-end">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40"
          aria-label="Предыдущая страница"
        >
          <ChevronRight className="h-5 w-5 rotate-180" />
        </button>
        {pageNumbers.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onPageChange(n)}
            className={`min-w-[36px] rounded-lg px-2 py-1.5 text-sm font-medium tabular-nums ${
              n === safePage ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40"
          aria-label="Следующая страница"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function BonusHistoryPanel() {
  const [filterIdx, setFilterIdx] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(MOCK_HISTORY.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return MOCK_HISTORY.slice(start, start + pageSize);
  }, [safePage, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [pageSize, filterIdx]);

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold text-gray-900">История бонусов</h2>

      <section
        className="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
        style={{ boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)' }}
      >
        <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="relative">
            <button
              type="button"
              onClick={() => setFilterOpen(!filterOpen)}
              className="inline-flex min-w-[200px] items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 hover:border-gray-300"
            >
              <span>{HISTORY_FILTER_OPTIONS[filterIdx]}</span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
            </button>
            {filterOpen && (
              <ul className="absolute left-0 top-full z-20 mt-1 min-w-full overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                {HISTORY_FILTER_OPTIONS.map((label, i) => (
                  <li key={label}>
                    <button
                      type="button"
                      className="w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-gray-50"
                      onClick={() => {
                        setFilterIdx(i);
                        setFilterOpen(false);
                      }}
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="button"
            className="inline-flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 hover:border-gray-300 sm:w-auto sm:min-w-[240px]"
          >
            <span className="tabular-nums">23.08.2023 – 29.09.2023</span>
            <Calendar className="h-5 w-5 shrink-0 text-gray-500" />
          </button>
        </div>

        <ul className="divide-y divide-gray-100">
          {filterIdx === 0 &&
            REFERRAL_HISTORY_ENTRIES.map((entry) => <HistoryEntryRow key={entry.id} entry={entry} />)}
          {pageItems.map((entry) => (
            <HistoryEntryRow key={entry.id} entry={entry} />
          ))}
        </ul>

        <ListPaginationFooter
          totalItems={MOCK_HISTORY.length}
          page={page}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          onCloseSiblingDropdown={() => setFilterOpen(false)}
        />
      </section>
    </div>
  );
}

function PromotionProgress({ current, max }: { current: number; max: number }) {
  const pct = Math.min(100, Math.max(0, (current / max) * 100));
  const label = `${formatNum(current)} ₽`;
  return (
    <div className="relative pt-7">
      <span
        className="absolute top-0 text-sm font-semibold tabular-nums text-[#9a41fe] whitespace-nowrap -translate-x-1/2"
        style={{ left: `${pct}%` }}
      >
        {label}
      </span>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-[#9a41fe] transition-[width]" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-xs text-gray-400 tabular-nums">
        <span>0 ₽</span>
        <span>{formatNum(max)} ₽</span>
      </div>
    </div>
  );
}

const BonusesPage: React.FC = () => {
  const { profileId } = useProfile();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseBonusesTab(searchParams.get('tab'));
  const setTab = useCallback(
    (id: TabId) => {
      setSearchParams({ tab: id }, { replace: true });
    },
    [setSearchParams],
  );

  const bonusTabs = useMemo(
    () =>
      [
        { id: 'tasks' as const, label: 'Задания', isNew: false },
        { id: 'history' as const, label: 'История бонусов', isNew: false },
        { id: 'referral' as const, label: 'Реферальная программа', isNew: true },
      ] as const,
    [profileId],
  );

  useEffect(() => {
    const raw = searchParams.get('tab');
    const allowed = ['tasks', 'history', 'referral'] as const;
    if (!raw || !(allowed as readonly string[]).includes(raw)) {
      setSearchParams({ tab: 'tasks' }, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  const [pastPromotionsOn, setPastPromotionsOn] = useState(false);
  const [availableOpen, setAvailableOpen] = useState(true);
  const [invitePage, setInvitePage] = useState(1);
  const [invitePageSize, setInvitePageSize] = useState(10);
  const [inviteListFilter, setInviteListFilter] = useState<InviteeListFilter>('all');
  const [inviteDateSort, setInviteDateSort] = useState<InviteeDateSort>('desc');
  const promoTotal = 250_000;
  const promoSplitPrimary = 150_000;
  const promoSplitSecondary = 100_000;

  const profileInvitees = useMemo(
    () => (profileId === '2' ? [] : MOCK_INVITEES),
    [profileId],
  );

  const referralEarnedBonus = profileId === '2' ? 0 : 10_000;

  const filteredInvitees = useMemo(() => {
    const filtered = filterInvitees(profileInvitees, inviteListFilter);
    return sortInviteesByDate(filtered, inviteDateSort);
  }, [profileInvitees, inviteListFilter, inviteDateSort]);

  const inviteFilterCounts = useMemo(
    () => ({
      all: profileInvitees.length,
      spending: profileInvitees.filter(isInviteeSpending).length,
      completed: profileInvitees.filter(isInviteeCompleted).length,
    }),
    [profileInvitees],
  );

  const inviteTotalPages = Math.max(1, Math.ceil(filteredInvitees.length / invitePageSize));
  const safeInvitePage = Math.min(invitePage, inviteTotalPages);

  const pagedInvitees = useMemo(() => {
    const start = (safeInvitePage - 1) * invitePageSize;
    return filteredInvitees.slice(start, start + invitePageSize);
  }, [filteredInvitees, safeInvitePage, invitePageSize]);

  useEffect(() => {
    if (invitePage > inviteTotalPages) setInvitePage(inviteTotalPages);
  }, [invitePage, inviteTotalPages]);

  useEffect(() => {
    setInvitePage(1);
  }, [inviteListFilter, inviteDateSort, invitePageSize]);

  return (
    <>
      <main className={`max-w-[897px] mx-auto px-6 py-8 ${tab === 'tasks' ? 'pb-32' : 'pb-10'}`}>
        {/* Сводка промобонусов — Dribbble-style */}
        <section
          className="rounded-[28px] border border-gray-100/90 bg-white px-4 py-4 sm:px-6 sm:py-5"
          style={{ boxShadow: '0 10px 40px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.03)' }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
            <div className="shrink-0 lg:max-w-[min(100%,380px)]">
              <p className="text-[1.875rem] font-bold leading-none tracking-[-0.02em] text-gray-950 tabular-nums sm:text-3xl lg:text-[2.25rem]">
                {formatNum(promoTotal)}
              </p>
              <p className="mt-1 text-sm font-medium tracking-tight text-[#6e6e73]">Промобонусы</p>
              <p className="mt-2 inline-flex rounded-full bg-[#F2F2F7] px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[#3a3a3c]">
                1 промобонус = 1 ₽
              </p>
            </div>

            <div className="grid w-full flex-1 grid-cols-1 gap-2 sm:grid-cols-2 lg:max-w-[520px] lg:min-w-0">
              <div className="rounded-xl border border-[#f0f0f0] bg-white px-3.5 py-2.5 shadow-[0_1px_0_rgba(0,0,0,0.04)] sm:px-4 sm:py-3">
                <p className="text-lg font-bold tracking-tight text-gray-950 tabular-nums sm:text-xl">{formatNum(promoSplitPrimary)}</p>
                <p className="mt-1 text-xs leading-snug text-[#6e6e73] sm:text-sm">Оплата до 99% от суммы</p>
                <p className="mt-2 text-xs font-semibold leading-snug text-[#FF6B6B] sm:text-sm">
                  <span className="mr-1" aria-hidden>
                    🔥
                  </span>
                  300 сгорят 31.06.25
                </p>
              </div>
              <div className="rounded-xl border border-[#f0f0f0] bg-white px-3.5 py-2.5 shadow-[0_1px_0_rgba(0,0,0,0.04)] sm:px-4 sm:py-3">
                <p className="text-lg font-bold tracking-tight text-gray-950 tabular-nums sm:text-xl">{formatNum(promoSplitSecondary)}</p>
                <p className="mt-1 text-xs leading-snug text-[#6e6e73] sm:text-sm">Оплата до 50% от суммы</p>
                <p className="mt-2 text-xs font-semibold leading-snug text-[#FF6B6B] sm:text-sm">
                  <span className="mr-1" aria-hidden>
                    🔥
                  </span>
                  300 сгорят 31.06.25
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Вкладки */}
        <div className="mt-6 flex flex-wrap gap-2">
          {bonusTabs.map(({ id, label, isNew }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                tab === id
                  ? 'bg-gray-800 text-white'
                  : 'bg-[#E2E5EB] text-gray-800 hover:bg-[#D4D8E0]'
              }`}
            >
              <span>{label}</span>
              {isNew && (
                <span
                  className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none tracking-wide ${
                    tab === id ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  Новое
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'tasks' && (
          <div className="mt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Персональные акции</h2>
              <label className="flex items-center gap-3 cursor-pointer select-none sm:shrink-0">
                <span className="text-sm text-gray-700">Прошедшие акции</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={pastPromotionsOn}
                  onClick={() => setPastPromotionsOn(!pastPromotionsOn)}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${pastPromotionsOn ? 'bg-[#9a41fe]' : 'bg-gray-300'}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${pastPromotionsOn ? 'translate-x-5' : ''}`}
                  />
                </button>
              </label>
            </div>

            <div className="mt-8">
              <button
                type="button"
                onClick={() => setAvailableOpen(!availableOpen)}
                className="flex w-full items-center justify-between text-left text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors py-1"
              >
                <span>Доступные</span>
                <ChevronDown className={`w-5 h-5 shrink-0 text-gray-400 transition-transform ${availableOpen ? 'rotate-180' : ''}`} aria-hidden />
              </button>

              {availableOpen && (
                <div className="mt-5 space-y-5">
                  {profileId === '2' && <ReferralSellerPromotionCard />}
                  {/* Карточка 1 — один прогресс */}
                  <article className="rounded-[20px] bg-white border border-gray-100/90 p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                    <div className="flex flex-col gap-6 sm:flex-row sm:gap-6">
                      <div className="flex h-[104px] w-[104px] shrink-0 items-center justify-center rounded-2xl bg-[#F2F2F7] px-3 text-center text-sm font-semibold leading-snug text-gray-700">
                        + 40% промо-бонусов
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 space-y-2">
                            <span className="inline-flex rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                              Выполняется, доступно до 31.12.2025
                            </span>
                            <h3 className="text-lg font-bold text-gray-900 leading-snug max-w-xl">
                              Название персонально акции в две строки, чтобы не помещалось
                            </h3>
                          </div>
                          <button
                            type="button"
                            className="shrink-0 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            Подробнее
                          </button>
                        </div>
                        <div className="mt-6 max-w-xl">
                          <PromotionProgress current={31_242} max={100_000} />
                        </div>
                      </div>
                    </div>
                  </article>

                  {/* Карточка 2 — варианты */}
                  <article className="rounded-[20px] bg-white border border-gray-100/90 p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                    <div className="flex flex-col gap-6 sm:flex-row sm:gap-6">
                      <div className="flex h-[104px] w-[104px] shrink-0 items-center justify-center rounded-2xl bg-[#F2F2F7] px-3 text-center text-sm font-semibold leading-snug text-gray-700">
                        x2 буст товаров
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 space-y-2">
                            <span className="inline-flex rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                              Выполняется, доступно до 31.12.2025
                            </span>
                            <h3 className="text-lg font-bold text-gray-900 leading-snug max-w-xl">
                              Название персонально акции в две строки, чтобы не помещалось
                            </h3>
                          </div>
                          <button
                            type="button"
                            className="shrink-0 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            Подробнее
                          </button>
                        </div>

                        <ul className="mt-6 space-y-0 divide-y divide-gray-100 max-w-xl">
                          <li className="flex items-start gap-3 py-4 first:pt-0">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 rounded-full border-2 border-gray-300 bg-white" aria-hidden />
                            <span className="text-sm font-medium text-gray-900 pt-0.5">Вариант N</span>
                          </li>
                          <li className="py-4">
                            <div className="flex items-start gap-3">
                              <span className="mt-0.5 flex h-5 w-5 shrink-0 rounded-full border-2 border-gray-300 bg-white" aria-hidden />
                              <div className="min-w-0 flex-1 pt-0.5">
                                <p className="text-sm font-medium text-gray-900">Вариант N</p>
                                <div className="mt-4">
                                  <PromotionProgress current={31_242} max={100_000} />
                                </div>
                              </div>
                            </div>
                          </li>
                          <li className="flex items-start gap-3 py-4">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 rounded-full border-2 border-gray-300 bg-white" aria-hidden />
                            <span className="text-sm font-medium text-gray-900 pt-0.5">Вариант N</span>
                          </li>
                          <li className="flex items-start gap-3 py-4 last:pb-0">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#9a41fe] text-white" aria-hidden>
                              <Check className="w-3 h-3" />
                            </span>
                            <span className="text-sm font-medium text-gray-900 pt-0.5">Вариант N</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </article>
                </div>
              )}
            </div>

            <p className="mt-8">
              <button type="button" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                Условия и завершенные акции
              </button>
            </p>
          </div>
        )}

        {tab === 'referral' && (
          <div className="mt-6 space-y-6">
            <ReferralInvitePanel />

            {/* Вы пригласили */}
                <section>
                  <h2 className="text-base font-bold text-gray-900">Вы пригласили</h2>

                  <div className="mt-3 grid grid-cols-2 gap-2 sm:max-w-md">
                <div className="rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm">
                  <p className="text-[11px] font-medium text-gray-500">Заработали баллов</p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums tracking-tight text-gray-900">
                    {formatNum(referralEarnedBonus)} <span className="text-sm font-semibold text-gray-500">₽</span>
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm">
                  <p className="text-[11px] font-medium text-gray-500">Приглашённых</p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums tracking-tight text-gray-900">
                    {formatNum(profileInvitees.length)}
                  </p>
                </div>
              </div>

              {profileInvitees.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">Пока никого нет в списке приглашённых.</p>
              ) : (
                <>
                  <div
                    className="mt-4 inline-flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1"
                    role="tablist"
                    aria-label="Фильтр приглашённых"
                  >
                    {INVITEE_FILTER_TABS.map((item) => {
                      const active = inviteListFilter === item.id;
                      const count = inviteFilterCounts[item.id];
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          onClick={() => setInviteListFilter(item.id)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                            active
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          {item.label}
                          <span className={`ml-1 tabular-nums ${active ? 'text-gray-500' : 'text-gray-400'}`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {filteredInvitees.length === 0 ? (
                    <p className="mt-4 text-sm text-gray-500">В этой вкладке пока никого нет.</p>
                  ) : (
                    <div className="mt-3 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                      <InviteeTable
                        invitees={pagedInvitees}
                        dateSort={inviteDateSort}
                        onToggleDateSort={() =>
                          setInviteDateSort((s) => (s === 'asc' ? 'desc' : 'asc'))
                        }
                      />
                      <ListPaginationFooter
                        totalItems={filteredInvitees.length}
                        page={invitePage}
                        onPageChange={setInvitePage}
                        pageSize={invitePageSize}
                        onPageSizeChange={setInvitePageSize}
                      />
                    </div>
                  )}
                </>
              )}
            </section>

            <ReferralHowItWorksSection />
          </div>
        )}

        {tab === 'history' && <BonusHistoryPanel />}
      </main>

      {tab === 'tasks' && (
        <div className="fixed bottom-6 left-1/2 z-40 w-full max-w-[897px] -translate-x-1/2 px-6 pointer-events-none">
          <div className="pointer-events-auto flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-lg">
            <p className="text-sm text-gray-800 font-medium">
              Доступно {profileId === '2' ? 3 : 2} новых задания
            </p>
            <button
              type="button"
              className="shrink-0 rounded-xl bg-[#9a41fe] hover:bg-[#8840e5] px-4 py-2 text-sm font-semibold text-white transition-colors"
            >
              Начать все
            </button>
          </div>
        </div>
      )}
    </>
  );
};

function InviteeTableTaskBlock({ row }: { row: RowConfig }) {
  const done = row.tone === 'done';
  return (
    <div className="flex min-w-0 items-start gap-1 leading-tight">
      {done ? (
        <Check className="mt-px h-2.5 w-2.5 shrink-0 text-emerald-600" aria-hidden />
      ) : (
        <LockIcon className="mt-px h-2.5 w-2.5 shrink-0 text-gray-400 opacity-70" aria-hidden />
      )}
      <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-gray-800" title={row.title}>
        {row.title}
      </span>
      <span className={`shrink-0 text-[10px] font-medium ${done ? 'text-emerald-700' : 'text-gray-500'}`}>
        {row.subtitle}
      </span>
      <span
        className={`shrink-0 text-[10px] font-semibold tabular-nums ${done ? 'text-[#9a41fe]' : 'text-gray-400'}`}
      >
        {row.reward.endsWith('₽') ? row.reward : `${row.reward} ₽`}
      </span>
    </div>
  );
}

function InviteeTableTasksCell({ spendRow, retentionRow }: { spendRow: RowConfig; retentionRow: RowConfig }) {
  return (
    <td className="max-w-[min(100%,320px)] align-top px-3 py-2.5">
      <div className="flex flex-col items-stretch gap-1">
        <InviteeTableTaskBlock row={spendRow} />
        <InviteeTableTaskBlock row={retentionRow} />
      </div>
    </td>
  );
}

function InviteeTable({
  invitees,
  dateSort,
  onToggleDateSort,
}: {
  invitees: Invitee[];
  dateSort: InviteeDateSort;
  onToggleDateSort: () => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/90">
            <th className="px-3 py-2.5 text-xs font-semibold text-gray-600">ID приглашённого</th>
            <th className="px-3 py-2.5 text-xs font-semibold text-gray-600">Источник</th>
            <th className="max-w-[min(100%,320px)] px-3 py-2.5 text-xs font-semibold text-gray-600">Задания</th>
            <th className="px-3 py-2.5 text-xs font-semibold text-gray-600 whitespace-nowrap">
              <button
                type="button"
                onClick={onToggleDateSort}
                className="inline-flex items-center gap-1 rounded-md text-left hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                aria-label={`Сортировка по дате приглашения, ${
                  dateSort === 'desc' ? 'сначала новые' : 'сначала старые'
                }`}
              >
                Дата приглашения
                <ArrowUp
                  className={`h-3.5 w-3.5 shrink-0 text-gray-500 transition-transform ${
                    dateSort === 'desc' ? 'rotate-180' : ''
                  }`}
                  aria-hidden
                />
              </button>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {invitees.map((inv) => {
            const spendRow = inv.rows.find((r) => r.icon === 'zap');
            const retentionRow = inv.rows.find((r) => r.icon === 'package');
            if (!spendRow || !retentionRow) return null;
            return (
              <tr key={inv.id} className="transition-colors hover:bg-gray-50/70">
                <td className="px-3 py-2.5 align-top">
                  <p className="font-medium text-gray-900 tabular-nums">{inv.inviteId}</p>
                </td>
                <td className="px-3 py-2.5 align-top text-xs text-gray-600">
                  {inv.trafficSourceLabel}
                </td>
                <InviteeTableTasksCell spendRow={spendRow} retentionRow={retentionRow} />
                <td className="px-3 py-2.5 align-top text-xs text-gray-600 whitespace-nowrap tabular-nums">
                  {invitedDateOnly(inv.invitedDaysAgo)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function HashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  );
}

function LinkChainIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function QrPlaceholder({ className, dotColor = '#111827' }: { className?: string; dotColor?: string }) {
  const n = QR_GRID;
  const rects: React.ReactNode[] = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (isQrCellFilled(x, y, n)) {
        rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={0.92} height={0.92} fill={dotColor} />);
      }
    }
  }
  return (
    <svg className={className} viewBox={`0 0 ${n} ${n}`} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect width={n} height={n} fill="white" />
      {rects}
    </svg>
  );
}

export default BonusesPage;
