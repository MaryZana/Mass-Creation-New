/** Демо-переключатель буфера на странице финансов. Шапка читает ту же сумму. */

export const FINANCE_BALANCE_DEMO_STORAGE_KEY = 'finance_balance_demo_case';
export const FINANCE_BALANCE_DEMO_EVENT = 'finance-balance-demo';

export const FINANCE_BALANCE_DEMO_CASES = [
  { id: 'zero', amount: 0, label: '0 ₽' },
  { id: 'funded', amount: 10_000, label: '10 000 ₽' },
] as const;

export type FinanceBalanceDemoCaseId = (typeof FINANCE_BALANCE_DEMO_CASES)[number]['id'];

export function readFinanceBalanceDemoCase(): FinanceBalanceDemoCaseId {
  try {
    const raw = sessionStorage.getItem(FINANCE_BALANCE_DEMO_STORAGE_KEY);
    if (raw === 'zero' || raw === 'funded') return raw;
  } catch {
    /* ignore */
  }
  return 'zero';
}

export function readFinanceBufferRub(): number {
  const id = readFinanceBalanceDemoCase();
  return FINANCE_BALANCE_DEMO_CASES.find((item) => item.id === id)?.amount ?? 0;
}

export function writeFinanceBalanceDemoCase(id: FinanceBalanceDemoCaseId) {
  try {
    sessionStorage.setItem(FINANCE_BALANCE_DEMO_STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(FINANCE_BALANCE_DEMO_EVENT));
}
