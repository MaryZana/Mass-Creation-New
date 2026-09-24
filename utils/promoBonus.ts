/** Лимиты пакетов промобонусов: остаток и доля от бюджета. */
export const PROMO_BONUS_PACKAGE_LIMITS = [
  { id: 'p1', amount: 15000, maxPercent: 50 },
  { id: 'p2', amount: 15000, maxPercent: 99 },
] as const;

/** Сколько можно списать: не больше остатка пакета, бюджета и maxPercent% от суммы. */
export function maxPromoBonusForBudget(packageId: string | undefined, budget: number): number {
  const pkg =
    PROMO_BONUS_PACKAGE_LIMITS.find((item) => item.id === packageId) ??
    PROMO_BONUS_PACKAGE_LIMITS[0];
  if (!Number.isFinite(budget) || budget <= 0) return 0;
  const byPercent = Math.floor((budget * pkg.maxPercent) / 100);
  return Math.max(0, Math.min(pkg.amount, byPercent, Math.floor(budget)));
}

/**
 * Сумма, которую показывает чип бонусов.
 * Если бонусы включены, а сумма ещё не записана, берём лимит пакета от бюджета.
 * Явно заданная сумма не растёт сама; если выше лимита пакета при текущем бюджете — ужимается.
 */
export function effectivePromoBonusAmount(campaign: {
  usePromoBonuses?: boolean;
  bonusAmount?: number | null;
  bonusPackageId?: string;
  budget: number;
}): number {
  if (!campaign.usePromoBonuses) return 0;
  const maxAllowed = maxPromoBonusForBudget(campaign.bonusPackageId, campaign.budget);
  if (campaign.bonusAmount != null && campaign.bonusAmount > 0) {
    return Math.min(campaign.bonusAmount, maxAllowed);
  }
  return maxAllowed;
}

type BonusAllocationCampaign = {
  id?: string;
  usePromoBonuses?: boolean;
  bonusAmount?: number | null;
  bonusPackageId?: string;
  budget: number;
};

/** Остаток пакета после бонусов, уже назначенных другим кампаниям. */
export function packageBalanceAfterCampaigns(
  packageId: string,
  campaigns: readonly BonusAllocationCampaign[],
  excludeIds: ReadonlySet<string> = new Set(),
): number {
  const pkg =
    PROMO_BONUS_PACKAGE_LIMITS.find((item) => item.id === packageId) ??
    PROMO_BONUS_PACKAGE_LIMITS[0];
  let used = 0;
  for (const campaign of campaigns) {
    if (campaign.id && excludeIds.has(campaign.id)) continue;
    if (!campaign.usePromoBonuses) continue;
    const assignedPackageId = campaign.bonusPackageId ?? PROMO_BONUS_PACKAGE_LIMITS[0].id;
    if (assignedPackageId !== packageId) continue;
    const want = effectivePromoBonusAmount(campaign);
    used += Math.min(want, Math.max(0, pkg.amount - used));
  }
  return Math.max(0, pkg.amount - used);
}
