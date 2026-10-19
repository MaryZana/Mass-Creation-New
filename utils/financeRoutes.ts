/** Общая страница финансов: один экран для продвижения и медиа. */

export const PROMOTION_FINANCE_PATH = '/finance';
export const MEDIA_FINANCE_PATH = '/media/finance';

export function isMediaProductPath(pathname: string): boolean {
  return pathname === '/media' || pathname.startsWith('/media/');
}

export function financeHomePath(pathname: string): string {
  return isMediaProductPath(pathname) ? MEDIA_FINANCE_PATH : PROMOTION_FINANCE_PATH;
}

export function financeTopUpPath(pathname: string): string {
  return `${financeHomePath(pathname)}/top-up`;
}
