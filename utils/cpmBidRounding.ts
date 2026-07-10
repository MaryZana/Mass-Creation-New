export const CPM_BID_STEP_RUB = 100;

export function roundCpmBidRub(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value / CPM_BID_STEP_RUB) * CPM_BID_STEP_RUB;
}

export function minCpmBidRub(min: number): number {
  const steppedMin = roundCpmBidRub(min);
  return Math.max(steppedMin, CPM_BID_STEP_RUB);
}

/** Нормализует ставку CPM к шагу 100 ₽. didRoundFromInput — введённое значение не кратно 100. */
export function normalizeCpmBidRub(
  raw: number,
  min: number,
): { value: number; didRoundFromInput: boolean } {
  const floorMin = minCpmBidRub(min);
  let value = Number.isFinite(raw) ? raw : floorMin;
  if (value < floorMin) value = floorMin;
  const stepped = Math.max(roundCpmBidRub(value), floorMin);
  const didRoundFromInput = Number.isFinite(raw) && stepped !== raw;
  return { value: stepped, didRoundFromInput };
}

export function formatCpmBidRoundedRub(roundedRub: number): string {
  return roundedRub.toLocaleString('ru-RU', { useGrouping: true });
}
