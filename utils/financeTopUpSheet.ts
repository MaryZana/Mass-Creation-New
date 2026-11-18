const FINANCE_TOP_UP_OPEN_EVENT = 'wb-finance-top-up:open';
const FINANCE_TOP_UP_STATE_EVENT = 'wb-finance-top-up:state';

type FinanceTopUpStateDetail = { open: boolean };

let topUpSheetOpen = false;

function publishTopUpState(open: boolean) {
  topUpSheetOpen = open;
  window.dispatchEvent(
    new CustomEvent<FinanceTopUpStateDetail>(FINANCE_TOP_UP_STATE_EVENT, { detail: { open } }),
  );
}

/** Открыть пополнение счёта в боковой шторке (хедер, финансы и т.д.). */
export function openFinanceTopUp() {
  window.dispatchEvent(new Event(FINANCE_TOP_UP_OPEN_EVENT));
}

export function subscribeFinanceTopUpOpen(handler: () => void) {
  window.addEventListener(FINANCE_TOP_UP_OPEN_EVENT, handler);
  return () => window.removeEventListener(FINANCE_TOP_UP_OPEN_EVENT, handler);
}

/** Сообщить, что шторка пополнения открыта / закрыта. */
export function setFinanceTopUpSheetOpen(open: boolean) {
  publishTopUpState(open);
}

export function isFinanceTopUpSheetOpen() {
  return topUpSheetOpen;
}

/** Подписка на открытость шторки пополнения. */
export function subscribeFinanceTopUpSheetOpen(handler: (open: boolean) => void) {
  const onState = (event: Event) => {
    const detail = (event as CustomEvent<FinanceTopUpStateDetail>).detail;
    handler(Boolean(detail?.open));
  };
  window.addEventListener(FINANCE_TOP_UP_STATE_EVENT, onState);
  return () => window.removeEventListener(FINANCE_TOP_UP_STATE_EVENT, onState);
}
