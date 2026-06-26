export const DAILY_LIMIT_ABSOLUTE_MIN = 1000;
export const DAILY_LIMIT_MIN_CLICKS_PER_DAY = 30;

export function minDailyLimitForMaxBid(maxBidRub: number): number {
  const byBid = Math.ceil(maxBidRub * DAILY_LIMIT_MIN_CLICKS_PER_DAY);
  return Math.max(DAILY_LIMIT_ABSOLUTE_MIN, byBid);
}

export function maxBidRubForDailyLimit(dailyLimitRub: number): number {
  if (!Number.isFinite(dailyLimitRub) || dailyLimitRub <= 0) return 0;
  return Math.floor(dailyLimitRub / DAILY_LIMIT_MIN_CLICKS_PER_DAY);
}

/** Демо: макс. CPC-ставка в кампании для прототипа списка */
export function demoMaxCpcBidForCampaignId(campaignId: number): number {
  const spread = campaignId % 17;
  if (spread === 0) return 100;
  if (spread === 1) return 200;
  return 10 + (campaignId % 11);
}
