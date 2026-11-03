import React, { createContext, useContext, useMemo, useState } from 'react';

/** Базовые механики + 10 UI-скинов для футер+CTA. */
export type PromoMissedBonusUxId =
  | 'modal'
  | 'footer-info'
  | 'cta-inline'
  | 'cta-banner'
  | 'cta-column'
  | 'cta-beside'
  | 'cta-snackbar'
  | 'cta-island'
  | 'cta-float'
  | 'cta-link'
  | 'cta-compare'
  | 'cta-toggle'
  | 'cta-alert-row'
  | 'cta-progress'
  | 'near-pill'
  | 'near-chip'
  | 'near-warning'
  | 'near-split'
  | 'near-ghost'
  | 'save-big'
  | 'save-badge'
  | 'save-button'
  | 'save-columns'
  | 'save-percent'
  | 'lat-coupon'
  | 'lat-overpay'
  | 'lat-segmented'
  | 'lat-paybar'
  | 'lat-per-campaign'
  | 'pro-receipt'
  | 'pro-split-pill'
  | 'pro-switch'
  | 'pro-popover'
  | 'pro-boost'
  | 'x-sparkle'
  | 'x-bars'
  | 'x-question'
  | 'x-compare-bars'
  | 'x-assistant'
  | 'hv-info'
  | 'hv-underline'
  | 'hv-chip'
  | 'hv-segments'
  | 'hv-button'
  | 'pb-presets'
  | 'pb-menu'
  | 'pb-input'
  | 'pb-slider'
  | 'pb-meter'
  | 'bal-columns'
  | 'bal-progress'
  | 'bal-chips'
  | 'bal-stepper'
  | 'bal-dual'
  | 'pb-pill';

export const PROMO_MISSED_BONUS_UX_CASES: ReadonlyArray<{
  id: PromoMissedBonusUxId;
  label: string;
  title: string;
  group: 'base' | 'cta';
}> = [
  { id: 'modal', label: 'Модалка', title: 'Только в подтверждении', group: 'base' },
  { id: 'footer-info', label: 'Футер', title: 'Инфо в футере без кнопки', group: 'base' },
  {
    id: 'cta-inline',
    label: 'C1',
    title: 'CTA: статус остатка + «всё / часть» под итогами',
    group: 'cta',
  },
  {
    id: 'cta-banner',
    label: 'C2',
    title: 'CTA: баннер на всю ширину футера',
    group: 'cta',
  },
  {
    id: 'cta-column',
    label: 'C3',
    title: 'CTA: вместо колонки «Промобонусы 0 B»',
    group: 'cta',
  },
  {
    id: 'cta-beside',
    label: 'C4',
    title: 'CTA: кнопка рядом с «Создать»',
    group: 'cta',
  },
  {
    id: 'cta-snackbar',
    label: 'C5',
    title: 'CTA: полоска над футером',
    group: 'cta',
  },
  {
    id: 'cta-island',
    label: 'C6',
    title: 'CTA: баннер над таблицей кампаний',
    group: 'cta',
  },
  {
    id: 'cta-float',
    label: 'C7',
    title: 'CTA: плавающая карточка слева внизу',
    group: 'cta',
  },
  {
    id: 'cta-link',
    label: 'C8',
    title: 'CTA: текстовая ссылка под «С единого счёта»',
    group: 'cta',
  },
  {
    id: 'cta-compare',
    label: 'C9',
    title: 'CTA: карточка до/после списания',
    group: 'cta',
  },
  {
    id: 'cta-toggle',
    label: 'C10',
    title: 'CTA: переключатель «Списать N B»',
    group: 'cta',
  },
  {
    id: 'cta-alert-row',
    label: 'C11',
    title: 'CTA Mobbin: alert-row как OpenAI Billing (инфо слева, CTA справа)',
    group: 'cta',
  },
  {
    id: 'cta-progress',
    label: 'C12',
    title: 'CTA Mobbin: sticky progress как Instacart (0 из N B + Apply)',
    group: 'cta',
  },
  {
    id: 'near-pill',
    label: 'C13',
    title: 'Рядом с суммой: зелёная плашка «N B не потрачены» + Распределить',
    group: 'cta',
  },
  {
    id: 'near-chip',
    label: 'C14',
    title: 'Рядом с суммой: колонка «Можно сэкономить» с итогом после бонусов',
    group: 'cta',
  },
  {
    id: 'near-warning',
    label: 'C15',
    title: 'Рядом с суммой: оранжевое предупреждение + ссылка',
    group: 'cta',
  },
  {
    id: 'near-split',
    label: 'C16',
    title: 'Рядом с суммой: стрелка «→ N ₽» и кнопка',
    group: 'cta',
  },
  {
    id: 'near-ghost',
    label: 'C17',
    title: 'Рядом с суммой: компактная карточка-подсказка',
    group: 'cta',
  },
  {
    id: 'save-big',
    label: 'C18',
    title: 'Как C16: крупная выгода «Сэкономите −N ₽» + кнопка',
    group: 'cta',
  },
  {
    id: 'save-badge',
    label: 'C19',
    title: 'Как C16: «→ N ₽» и зелёный бейдж «Выгода N ₽»',
    group: 'cta',
  },
  {
    id: 'save-button',
    label: 'C20',
    title: 'Как C16: выгода прямо в кнопке «Сэкономить N ₽»',
    group: 'cta',
  },
  {
    id: 'save-columns',
    label: 'C21',
    title: 'Как C16: две колонки «С бонусами» и «Выгода»',
    group: 'cta',
  },
  {
    id: 'save-percent',
    label: 'C22',
    title: 'Как C16: выгода в рублях и процентах',
    group: 'cta',
  },
  {
    id: 'lat-coupon',
    label: 'C23',
    title: 'Купон с пунктирной рамкой «−N ₽ на запуск»',
    group: 'cta',
  },
  {
    id: 'lat-overpay',
    label: 'C24',
    title: 'Фрейм потери: «Переплата N ₽» + «Не переплачивать»',
    group: 'cta',
  },
  {
    id: 'lat-segmented',
    label: 'C25',
    title: 'Сегмент-переключатель «Без бонусов / С бонусами»',
    group: 'cta',
  },
  {
    id: 'lat-paybar',
    label: 'C26',
    title: 'Полоса оплаты: деньги vs бонусы',
    group: 'cta',
  },
  {
    id: 'lat-per-campaign',
    label: 'C27',
    title: 'Разбивка: «+N B на каждую из K кампаний»',
    group: 'cta',
  },
  {
    id: 'pro-receipt',
    label: 'C28',
    title: 'Мини-чек: бюджет − бонусы = итого',
    group: 'cta',
  },
  {
    id: 'pro-split-pill',
    label: 'C29',
    title: 'Сплит-кнопка: выгода слева, действие справа',
    group: 'cta',
  },
  {
    id: 'pro-switch',
    label: 'C30',
    title: 'Тумблер «Списать бонусы · −N ₽»',
    group: 'cta',
  },
  {
    id: 'pro-popover',
    label: 'C31',
    title: 'Зелёная сумма с подчёркиванием + поповер с деталями',
    group: 'cta',
  },
  {
    id: 'pro-boost',
    label: 'C32',
    title: '«+N% бюджета за те же деньги» + выгода',
    group: 'cta',
  },
  {
    id: 'x-sparkle',
    label: 'C33',
    title: 'Искра с пульсацией «Бонусы ждут · −N ₽»',
    group: 'cta',
  },
  {
    id: 'x-bars',
    label: 'C34',
    title: 'Мини-график равномерной раздачи по кампаниям',
    group: 'cta',
  },
  {
    id: 'x-question',
    label: 'C35',
    title: 'Вопрос «Платить N ₽ вместо M ₽?» + Да',
    group: 'cta',
  },
  {
    id: 'x-compare-bars',
    label: 'C36',
    title: 'Две полосы: без бонусов vs с бонусами',
    group: 'cta',
  },
  {
    id: 'x-assistant',
    label: 'C37',
    title: 'Подсказка-ассистент «Могу сэкономить N ₽» + Да/Не сейчас',
    group: 'cta',
  },
  {
    id: 'hv-info',
    label: 'C38',
    title: 'C16 + иконка ⓘ: при наведении раскладка по кампаниям',
    group: 'cta',
  },
  {
    id: 'hv-underline',
    label: 'C39',
    title: '«Сэкономите N ₽» с подчёркиванием: наведение → раскладка',
    group: 'cta',
  },
  {
    id: 'hv-chip',
    label: 'C40',
    title: 'Чип «−N ₽ · K кампаний»: наведение → раскладка',
    group: 'cta',
  },
  {
    id: 'hv-segments',
    label: 'C41',
    title: 'Сегментная полоса: наведение на сегмент подсвечивает кампанию',
    group: 'cta',
  },
  {
    id: 'hv-button',
    label: 'C42',
    title: 'Кнопка «Сэкономить N ₽»: наведение → превью распределения',
    group: 'cta',
  },
  {
    id: 'pb-presets',
    label: 'C43',
    title: 'Блок «Промобонусы»: остаток на счету + пресеты 25% / 50% / Всё',
    group: 'cta',
  },
  {
    id: 'pb-menu',
    label: 'C44',
    title: 'Блок «Промобонусы»: кнопка с меню «Всё / Половину / Своя сумма»',
    group: 'cta',
  },
  {
    id: 'pb-input',
    label: 'C45',
    title: 'Блок «Промобонусы»: поле суммы «из N B» + Распределить',
    group: 'cta',
  },
  {
    id: 'pb-slider',
    label: 'C46',
    title: 'Блок «Промобонусы»: ползунок суммы',
    group: 'cta',
  },
  {
    id: 'pb-meter',
    label: 'C47',
    title: 'Блок «Промобонусы»: шкала остатка + «Всё» / «Часть…»',
    group: 'cta',
  },
  {
    id: 'bal-columns',
    label: 'C48',
    title: 'Под итогами: колонки «Распределено / Ещё» + всё/часть',
    group: 'cta',
  },
  {
    id: 'bal-progress',
    label: 'C49',
    title: 'Под итогами: прогресс «A из M» + всё/часть',
    group: 'cta',
  },
  {
    id: 'bal-chips',
    label: 'C50',
    title: 'Под итогами: чипы «уже / ещё» + всё/часть',
    group: 'cta',
  },
  {
    id: 'bal-stepper',
    label: 'C51',
    title: 'Под итогами: статус + степпер суммы',
    group: 'cta',
  },
  {
    id: 'bal-dual',
    label: 'C52',
    title: 'Под итогами: статус + две кнопки «Всё» / «Половину»',
    group: 'cta',
  },
  {
    id: 'pb-pill',
    label: 'C53',
    title: 'Промобонусы: 0 + чёрная «из N B ▾», наведение — всё/часть',
    group: 'cta',
  },
];

const LEGACY_UX_MAP: Record<string, PromoMissedBonusUxId> = {
  'footer-cta': 'cta-inline',
};

export function isPromoMissedCtaUx(id: PromoMissedBonusUxId): boolean {
  return id.startsWith('cta-');
}

export function showsPromoMissedFooterInfo(id: PromoMissedBonusUxId): boolean {
  return id === 'footer-info' || id === 'cta-inline';
}

type PromoMissedBonusUxContextValue = {
  uxId: PromoMissedBonusUxId;
  setUxId: (id: PromoMissedBonusUxId) => void;
};

const PromoMissedBonusUxContext = createContext<PromoMissedBonusUxContextValue | null>(null);

const STORAGE_KEY = 'mass_creation_promo_missed_bonus_ux';

function readStoredUxId(): PromoMissedBonusUxId {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw && LEGACY_UX_MAP[raw]) return LEGACY_UX_MAP[raw];
    if (PROMO_MISSED_BONUS_UX_CASES.some((item) => item.id === raw)) {
      return raw as PromoMissedBonusUxId;
    }
  } catch {
    /* ignore */
  }
  return 'modal';
}

export function PromoMissedBonusUxProvider({ children }: { children: React.ReactNode }) {
  const [uxId, setUxIdState] = useState<PromoMissedBonusUxId>(readStoredUxId);

  const setUxId = (id: PromoMissedBonusUxId) => {
    setUxIdState(id);
    try {
      sessionStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  };

  const value = useMemo(() => ({ uxId, setUxId }), [uxId]);

  return (
    <PromoMissedBonusUxContext.Provider value={value}>
      {children}
    </PromoMissedBonusUxContext.Provider>
  );
}

export function usePromoMissedBonusUx(): PromoMissedBonusUxContextValue {
  const ctx = useContext(PromoMissedBonusUxContext);
  if (!ctx) {
    throw new Error('usePromoMissedBonusUx must be used within PromoMissedBonusUxProvider');
  }
  return ctx;
}
