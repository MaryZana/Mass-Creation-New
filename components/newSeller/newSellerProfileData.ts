/**
 * Данные кабинета «Новый селлер».
 * Кампаний и товаров в продвижении нет — селлер ещё ничего не запускал.
 */

export const NEW_SELLER_EMPTY_LIST = {
  campaigns: [] as [],
  productTree: [] as [],
};

/** Промобонусы и акционные пакеты на «Мои бонусы» (без заданий и истории). */
export const NEW_SELLER_BONUSES = {
  promoTotal: 5_000,
  packages: [
    {
      amount: 3_500,
      payShareLabel: 'Оплата до 99% от суммы',
      burnLabel: '500 сгорят 31.08.25',
    },
    {
      amount: 1_500,
      payShareLabel: 'Оплата до 50% от суммы',
      burnLabel: '200 сгорят 31.08.25',
    },
  ],
} as const;
