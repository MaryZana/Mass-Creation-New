/** Базовые лимиты пакетов промобонусов: доля от бюджета + дефолтный остаток. */
export const PROMO_BONUS_PACKAGE_LIMITS = [
  { id: 'p1', amount: 15000, maxPercent: 50 },
  { id: 'p2', amount: 15000, maxPercent: 99 },
] as const;

/** Текущие остатки пакетов (демо-переключатель / реальный баланс). */
let runtimePackageAmounts: Record<string, number> = {
  p1: PROMO_BONUS_PACKAGE_LIMITS[0].amount,
  p2: PROMO_BONUS_PACKAGE_LIMITS[1].amount,
};

export function setRuntimePromoPackageAmounts(
  amounts: ReadonlyArray<{ id: string; amount: number }>,
): void {
  const next: Record<string, number> = { ...runtimePackageAmounts };
  for (const item of amounts) {
    next[item.id] = Math.max(0, Math.floor(item.amount));
  }
  runtimePackageAmounts = next;
}

export function getRuntimePromoPackageAmount(packageId: string | undefined): number {
  const id = packageId ?? PROMO_BONUS_PACKAGE_LIMITS[0].id;
  return runtimePackageAmounts[id] ?? 0;
}

function packageMeta(packageId: string | undefined) {
  return (
    PROMO_BONUS_PACKAGE_LIMITS.find((item) => item.id === packageId) ??
    PROMO_BONUS_PACKAGE_LIMITS[0]
  );
}

/** Сколько можно списать: не больше остатка пакета, бюджета и maxPercent% от суммы. */
export function maxPromoBonusForBudget(packageId: string | undefined, budget: number): number {
  const pkg = packageMeta(packageId);
  const packageAmount = getRuntimePromoPackageAmount(pkg.id);
  if (!Number.isFinite(budget) || budget <= 0) return 0;
  const byPercent = Math.floor((budget * pkg.maxPercent) / 100);
  return Math.max(0, Math.min(packageAmount, byPercent, Math.floor(budget)));
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
  const packageAmount = getRuntimePromoPackageAmount(packageId);
  let used = 0;
  for (const campaign of campaigns) {
    if (campaign.id && excludeIds.has(campaign.id)) continue;
    if (!campaign.usePromoBonuses) continue;
    const assignedPackageId = campaign.bonusPackageId ?? PROMO_BONUS_PACKAGE_LIMITS[0].id;
    if (assignedPackageId !== packageId) continue;
    const want = effectivePromoBonusAmount(campaign);
    used += Math.min(want, Math.max(0, packageAmount - used));
  }
  return Math.max(0, packageAmount - used);
}

/** Ужимает бонусы кампаний под текущие остатки пакетов (по порядку списка). */
export function clampCampaignsToPromoPackageBalances<T extends BonusAllocationCampaign>(
  campaigns: readonly T[],
): T[] {
  const remaining = new Map(
    PROMO_BONUS_PACKAGE_LIMITS.map((pkg) => [pkg.id, getRuntimePromoPackageAmount(pkg.id)]),
  );

  return campaigns.map((campaign) => {
    if (!campaign.usePromoBonuses) {
      return campaign.bonusAmount
        ? { ...campaign, bonusAmount: 0 }
        : campaign;
    }
    const packageId = campaign.bonusPackageId ?? PROMO_BONUS_PACKAGE_LIMITS[0].id;
    const available = remaining.get(packageId) ?? 0;
    const want = effectivePromoBonusAmount(campaign);
    const next = Math.min(want, available);
    remaining.set(packageId, Math.max(0, available - next));
    if (next <= 0) {
      return { ...campaign, usePromoBonuses: false, bonusAmount: 0 };
    }
    if (campaign.bonusAmount === next) return campaign;
    return { ...campaign, bonusAmount: next };
  });
}
