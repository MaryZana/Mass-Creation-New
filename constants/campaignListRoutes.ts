/** «Кампании с виджетами 1» — основной макет с Widgets2Strip и тулбаром v2. */
export const CAMPAIGNS_WITH_WIDGETS_V1_PATH = '/campaigns-with-widgets-2';

/** Дубликат макета виджетов 1 для концепта товарного продвижения. */
export const PRODUCT_PROMOTION_CONCEPT_PATH = '/product-promotion-concept';

export function isCampaignsWidgetsV1Layout(pathname: string): boolean {
  return (
    pathname === CAMPAIGNS_WITH_WIDGETS_V1_PATH ||
    pathname === PRODUCT_PROMOTION_CONCEPT_PATH
  );
}
