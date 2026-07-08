export const DAILY_LIMIT_ABSOLUTE_MIN = 1000;
export const DAILY_LIMIT_MIN_CLICKS_PER_DAY = 30;
/** Максимальная ставка в CPC (₽) */
export const CPC_MAX_BID_RUB = 150;

export function minDailyLimitForMaxBid(maxBidRub: number): number {
  const byBid = Math.ceil(maxBidRub * DAILY_LIMIT_MIN_CLICKS_PER_DAY);
  return Math.max(DAILY_LIMIT_ABSOLUTE_MIN, byBid);
}

export function isDailyLimitBelowRecommendedForMaxBid(
  dailyLimitRub: number | null | undefined,
  maxBidRub: number,
): boolean {
  if (dailyLimitRub == null || dailyLimitRub <= 0 || maxBidRub <= 0) return false;
  return dailyLimitRub < minDailyLimitForMaxBid(maxBidRub);
}

/** Ставка × 30 выше абсолютного минимума лимита и текущий лимит ниже рекомендуемого */
export function shouldPromptRaiseDailyLimitForMaxBid(
  isDailyLimitEnabled: boolean,
  dailyLimitRub: number,
  maxBidRub: number,
): boolean {
  if (!isDailyLimitEnabled || dailyLimitRub <= 0 || maxBidRub <= 0) return false;
  const recommended = minDailyLimitForMaxBid(maxBidRub);
  return (
    recommended > DAILY_LIMIT_ABSOLUTE_MIN &&
    isDailyLimitBelowRecommendedForMaxBid(dailyLimitRub, maxBidRub)
  );
}

export function maxBidRubForDailyLimit(dailyLimitRub: number): number {
  if (!Number.isFinite(dailyLimitRub) || dailyLimitRub <= 0) return 0;
  return Math.floor(dailyLimitRub / DAILY_LIMIT_MIN_CLICKS_PER_DAY);
}

/** Демо-оценка позиции и кликов при лимите и ставке в поиске (прототип). */
export function estimateDailyLimitSpendPreview(
  dailyLimitRub: number,
  cpcBidRub: number,
  options?: { targetAvgPosition?: number },
): { approxPosition: number; approxClicks: number } | null {
  if (!Number.isFinite(dailyLimitRub) || dailyLimitRub <= 0) return null;
  if (!Number.isFinite(cpcBidRub) || cpcBidRub <= 0) return null;
  const limitPerBid = dailyLimitRub / cpcBidRub;
  if (limitPerBid <= 0) return null;
  const approxPosition =
    options?.targetAvgPosition != null
      ? Math.round(options.targetAvgPosition)
      : Math.min(300, Math.max(1, Math.round(limitPerBid)));
  const approxClicks = Math.max(1, Math.round(limitPerBid * 2.15));
  return { approxPosition, approxClicks };
}

/** Демо: товары, для которых ставки из Excel не применились из‑за дневного лимита */
export const UPLOAD_DAILY_LIMIT_ERROR_DEMO_PRODUCT_IDS = ['pr1', 'pr8', 'pr24'] as const;

export const UPLOAD_DAILY_LIMIT_ERROR_PRODUCTS_FILTER_LABEL = 'Товары с ошибкой лимита';

/** Демо: макс. CPC-ставка в кампании для прототипа списка */
export function demoMaxCpcBidForCampaignId(campaignId: number): number {
  const spread = campaignId % 17;
  if (spread === 0) return 100;
  if (spread === 1) return 200;
  return 10 + (campaignId % 11);
}
