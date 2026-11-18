import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { PROMOTION_ACCOUNT_BALANCE_BY_PROFILE } from '../components/AppHeader';
import { notifySidePanelOpen, useCloseOnOtherSidePanel } from '../components/FeatureVideoGuide';
import { AlertTriangle, FileIcon, Smartphone, X } from '../components/Icons';
import { useProfile } from '../components/ProfileContext';
import { RitmNotification } from '../components/RitmNotification';
import { financeHomePath } from '../utils/financeRoutes';
import {
  openFinanceTopUp,
  setFinanceTopUpSheetOpen,
  subscribeFinanceTopUpOpen,
} from '../utils/financeTopUpSheet';

export { openFinanceTopUp } from '../utils/financeTopUpSheet';

const MIN_AMOUNT = 500;
const AMOUNT_STEP = 50;
const PERSONAL_PAYMENT_ID = '1330339';

const RECIPIENT_DETAILS = [
  { label: 'БИК', value: '044525450' },
  { label: 'ИНН', value: '9714053621' },
  { label: 'КПП', value: '507401001' },
  { label: 'Банк получателя', value: 'ООО «Вайлдберриз Банк»' },
  { label: 'Получатель', value: 'ООО «РВБ»' },
  { label: 'Расчётный счёт', value: '40702810600000000353' },
  { label: 'Корреспондентский счёт', value: '30101810245250000450' },
] as const;

type PaymentMethod = 'sbp' | 'card' | 'requisites';

function BackChevron({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 12l1.8 1.8L15 10" />
    </svg>
  );
}

function formatMoney(n: number): string {
  return n.toLocaleString('ru-RU', {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/** НДС 22% внутри суммы (как в назначении платежа). */
function vatIncludedRub(amountRub: number): number {
  return Math.round(((amountRub * 22) / 122) * 100) / 100;
}

function parseAmountRub(raw: string): number {
  const n = Number(String(raw).replace(/\s/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/** Детерминированный «QR» для демо — меняется при смене суммы / назначения. */
function PaymentQrCode({ seed, size = 120 }: { seed: string; size?: number }) {
  const cells = 21;
  const bits = useMemo(() => {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i += 1) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const out: boolean[] = [];
    for (let i = 0; i < cells * cells; i += 1) {
      h ^= h << 13;
      h ^= h >>> 17;
      h ^= h << 5;
      const row = Math.floor(i / cells);
      const col = i % cells;
      const finder =
        (row < 7 && col < 7) ||
        (row < 7 && col >= cells - 7) ||
        (row >= cells - 7 && col < 7);
      if (finder) {
        const inFinderBorder =
          row === 0 ||
          col === 0 ||
          row === 6 ||
          col === 6 ||
          (row >= cells - 7 && (row === cells - 7 || row === cells - 1)) ||
          (col >= cells - 7 && row < 7 && (col === cells - 7 || col === cells - 1)) ||
          (row >= cells - 7 && col < 7 && (row === cells - 7 || row === cells - 1 || col === 0 || col === 6));
        const inFinderCore =
          (row >= 2 && row <= 4 && col >= 2 && col <= 4) ||
          (row >= 2 && row <= 4 && col >= cells - 5 && col <= cells - 3) ||
          (row >= cells - 5 && row <= cells - 3 && col >= 2 && col <= 4);
        out.push(inFinderBorder || inFinderCore);
      } else {
        out.push((h >>> 0) % 3 !== 0);
      }
    }
    return out;
  }, [seed]);

  const cell = size / cells;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="rounded-md bg-white"
      aria-hidden
    >
      <rect width={size} height={size} fill="#fff" />
      {bits.map((on, i) =>
        on ? (
          <rect
            key={i}
            x={(i % cells) * cell}
            y={Math.floor(i / cells) * cell}
            width={cell}
            height={cell}
            fill="#111"
          />
        ) : null,
      )}
    </svg>
  );
}


function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function vatLabelRub(amountRub: number): string {
  return vatIncludedRub(amountRub).toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function amountVatPurposeTail(amountRub: number): string {
  return `${amountRub} RUB, в т.ч. НДС 22% ${vatLabelRub(amountRub)} RUB`;
}

function buildPaymentPurpose(amountRub: number): string {
  return (
    `${PERSONAL_PAYMENT_ID} Оказание услуги по размещению ИМ по договору Оферты` +
    ` сумма ${amountVatPurposeTail(amountRub)}`
  );
}

function PurposeAmountVatBold({ purpose, amountRub }: { purpose: string; amountRub: number }) {
  const needle = amountVatPurposeTail(amountRub);
  const idx = purpose.indexOf(needle);
  if (idx < 0) return <>{purpose}</>;
  return (
    <>
      {purpose.slice(0, idx)}
      <strong className="font-semibold text-gray-900">{needle}</strong>
      {purpose.slice(idx + needle.length)}
    </>
  );
}

function highlightPurposeHtml(purpose: string, amountRub: number): string {
  const needle = amountVatPurposeTail(amountRub);
  if (!purpose.includes(needle)) return purpose;
  return purpose.replace(needle, `<strong style="font-weight:700;">${needle}</strong>`);
}

async function copyToClipboard(value: string) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const area = document.createElement('textarea');
      area.value = value;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.left = '-9999px';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    }
}

function PlainCopyIconButton({
  label,
  value,
  onCopied,
}: {
  label: string;
  value: string;
  onCopied: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        void copyToClipboard(value).then(onCopied);
      }}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-[#F3F5F8] hover:text-gray-900"
      aria-label={`Скопировать: ${label}`}
      title="Скопировать"
      >
        <CopyIcon className="h-4 w-4" />
    </button>
  );
}

async function downloadRequisitesPdf(amountRub: number, paymentPurpose: string) {
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText =
    'position:fixed;left:-10000px;top:0;width:720px;padding:0;margin:0;background:#fff;z-index:-1;';

  const detailRows = RECIPIENT_DETAILS.map(
    (row) => `
        <div style="display:grid;grid-template-columns:168px 1fr;gap:16px;padding:10px 12px;">
          <div style="color:#6b7280;font-size:14px;">${row.label}</div>
          <div style="font-size:14px;">${row.value}</div>
        </div>`,
  ).join('');

  host.innerHTML = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#111827;background:#fff;padding:28px 32px 32px;">
        <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;">Реквизиты получателя</h1>
        <div style="margin:0 0 18px;padding:10px 12px;border-radius:12px;background:#FFF1B8;font-size:13px;line-height:1.4;">
          Документ для суммы ${formatMoney(amountRub)}&nbsp;₽
        </div>
        <div style="display:grid;grid-template-columns:168px 1fr;gap:16px;padding:10px 12px;">
          <div style="color:#6b7280;font-size:14px;">Сумма</div>
          <div style="font-size:14px;">${amountRub}</div>
        </div>
        <div style="display:grid;grid-template-columns:168px 1fr;gap:16px;padding:10px 12px;">
          <div style="color:#6b7280;font-size:14px;">Назначение платежа</div>
          <div style="font-size:14px;line-height:1.45;">${highlightPurposeHtml(paymentPurpose, amountRub)}</div>
        </div>
        ${detailRows}
        <div style="margin-top:16px;padding:14px 16px;border-radius:12px;background:#FFF1B8;font-size:15px;line-height:1.4;">
          Скопируйте сумму без округлений, а назначение — слово в слово. Иначе оплата не пройдёт.
        </div>
      </div>
    `;
  document.body.appendChild(host);

  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);
    const canvas = await html2canvas(host.firstElementChild as HTMLElement, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 12;
    const usableWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * usableWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = margin;
    pdf.addImage(imgData, 'PNG', margin, position, usableWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;
    while (heightLeft > 0) {
      position = margin - (imgHeight - heightLeft);
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, usableWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;
    }
    pdf.save(`rekvizity-popolnenie-${amountRub}.pdf`);
  } finally {
    document.body.removeChild(host);
  }
}

/** QR + PDF — для sticky footer шторки и inline в блоке реквизитов */
function RequisitesActionButtons({
  amountRub,
  layout = 'stack',
}: {
  amountRub: number;
  /** sheet — PDF по контенту слева, QR-кнопка справа; stack — друг под другом */
  layout?: 'stack' | 'sheet';
}) {
  const [qrEnlarged, setQrEnlarged] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const paymentPurpose = useMemo(() => buildPaymentPurpose(amountRub), [amountRub]);
  const qrSeed = `${paymentPurpose}|${amountRub}`;
  const sheet = layout === 'sheet';
  const payQrLabel = `Оплатить ${formatMoney(amountRub)} ₽ в приложении по QR`;
  const stackQrLabel = `Пополнить на ${formatMoney(amountRub)} ₽ в приложении`;

    return (
    <>
      {errorNotice ? (
        <RitmNotification
          message={errorNotice}
          durationMs={2000}
          onClose={() => setErrorNotice(null)}
        />
      ) : null}
      <div className={sheet ? 'flex items-center gap-3' : 'flex flex-col gap-3'}>
        {sheet ? (
          <>
            <button
              type="button"
              onClick={() => {
                if (pdfBusy) return;
                setPdfBusy(true);
                void downloadRequisitesPdf(amountRub, paymentPurpose)
                  .catch(() => setErrorNotice('Не удалось скачать PDF'))
                  .finally(() => setPdfBusy(false));
              }}
              disabled={pdfBusy}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#E8E9ED] px-5 text-sm font-semibold text-gray-900 transition-colors hover:bg-[#DEDFE4] disabled:cursor-wait disabled:opacity-70"
            >
              <FileIcon className="h-4 w-4" />
              {pdfBusy ? 'Готовим файл…' : 'Скачать реквизиты'}
            </button>
            <button
              type="button"
              onClick={() => setQrEnlarged(true)}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1C1C1E] px-5 text-sm font-semibold text-white transition-colors hover:bg-black"
            >
              <Smartphone className="h-4 w-4" aria-hidden />
              {payQrLabel}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                if (pdfBusy) return;
                setPdfBusy(true);
                void downloadRequisitesPdf(amountRub, paymentPurpose)
                  .catch(() => setErrorNotice('Не удалось скачать PDF'))
                  .finally(() => setPdfBusy(false));
              }}
              disabled={pdfBusy}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1C1C1E] px-5 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-wait disabled:opacity-70"
            >
              <FileIcon className="h-4 w-4" />
              {pdfBusy ? 'Готовим файл…' : 'Скачать реквизиты'}
            </button>
            <button
              type="button"
              onClick={() => setQrEnlarged(true)}
              className="flex w-full items-center gap-3 rounded-2xl border border-[#E3E4E9] bg-white px-4 py-3 text-left transition-colors hover:bg-[#F7F8FA]"
            >
              <span className="rounded-lg bg-[#F3F5F8] p-1">
                <PaymentQrCode seed={qrSeed} size={48} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium text-gray-900">{stackQrLabel}</span>
                <span className="block text-xs text-gray-500">Нажмите, чтобы открыть QR крупнее</span>
              </span>
              <span className="text-xl text-gray-300" aria-hidden>
                ›
              </span>
            </button>
          </>
        )}
      </div>

      {qrEnlarged ? (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onClick={() => setQrEnlarged(false)}
        >
          <div
            role="dialog"
            aria-label="QR-код для оплаты"
            className="rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <PaymentQrCode seed={qrSeed} size={240} />
            <button
              type="button"
              onClick={() => setQrEnlarged(false)}
              className="mt-4 w-full rounded-xl bg-[#F0F0F2] px-4 py-2.5 text-sm font-medium text-gray-900 hover:bg-[#E4E4EA]"
            >
              Закрыть
            </button>
        </div>
      </div>
      ) : null}
    </>
  );
}

function RequisitesPaymentBlock({
  amount,
  amountRub,
  amountError,
  onAmountChange,
  hideAmount = false,
  bare = false,
  hideActions = false,
}: {
  amount: string;
  amountRub: number;
  amountError: string | null;
  onAmountChange: (value: string) => void;
  /** Сумма уже введена выше на странице */
  hideAmount?: boolean;
  /** Без серой подложки и внешнего отступа */
  bare?: boolean;
  /** Кнопки QR/PDF вынесены в footer шторки */
  hideActions?: boolean;
}) {
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const paymentPurpose = useMemo(() => buildPaymentPurpose(amountRub), [amountRub]);
  const notifyCopied = () => setCopyNotice('Скопировано');
  const amountCopyValue = Number.isNaN(amountRub) ? amount : String(amountRub);
  const warnText =
    'Скопируйте сумму без округлений, а назначение — слово в слово. Иначе оплата не пройдёт';

    return (
    <>
      {copyNotice ? (
        <RitmNotification
          message={copyNotice}
          durationMs={2000}
          onClose={() => setCopyNotice(null)}
        />
      ) : null}

      <div className={bare ? 'w-full' : 'mt-6 w-full max-w-[560px] rounded-3xl bg-[#F3F5F8] p-2'}>
        <div className={bare ? '' : 'rounded-[20px] bg-white px-5 pb-5 pt-6 sm:px-7'}>
          {hideAmount ? null : (
            <>
              <label htmlFor="top-up-amount" className="block text-sm text-gray-500">
                Пополнить на сумму
              </label>
              <div className="mt-2 flex items-center gap-2">
                <div className="relative w-48">
                  <input
                    id="top-up-amount"
                    type="text"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => onAmountChange(e.target.value.replace(/[^\d\s]/g, ''))}
                    className="h-12 w-full rounded-xl border border-transparent bg-[#F3F5F8] px-4 pr-9 text-lg font-semibold tabular-nums text-gray-900 outline-none transition-colors hover:bg-[#E6E9EE] focus:border-[#9A41FE] focus:bg-white focus:ring-1 focus:ring-[#9A41FE]"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    ₽
                  </span>
      </div>
                <PlainCopyIconButton label="Сумма" value={amountCopyValue} onCopied={notifyCopied} />
              </div>
              {amountError ? <p className="mb-0 mt-1.5 text-xs text-red-500">{amountError}</p> : null}
              <div className="my-5 border-t border-dashed border-[#D5D7DE]" />
            </>
          )}

          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="mb-0 text-sm text-gray-500">Назначение платежа</p>
              <p className="mb-0 mt-1 select-text text-base leading-relaxed text-gray-900">
                <PurposeAmountVatBold purpose={paymentPurpose} amountRub={amountRub} />
              </p>
            </div>
            <PlainCopyIconButton
            label="Назначение платежа"
            value={paymentPurpose}
              onCopied={notifyCopied}
          />
        </div>
          <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-[#FFF1B8] px-3.5 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gray-900" aria-hidden />
            <p className="mb-0 text-base leading-snug text-gray-900">{warnText}</p>
      </div>

          <div className="my-5 border-t border-dashed border-[#D5D7DE]" />

          <dl className="m-0 flex flex-col gap-1">
            {hideAmount ? (
              <div className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-[#F3F5F8]">
                <dt className="w-40 shrink-0 text-sm text-gray-500">Сумма</dt>
                <dd className="m-0 min-w-0 flex-1 select-text text-right text-sm tabular-nums text-gray-900">
                  {amountCopyValue}
                </dd>
                <PlainCopyIconButton label="Сумма" value={amountCopyValue} onCopied={notifyCopied} />
        </div>
            ) : null}
            {RECIPIENT_DETAILS.map((row) => (
              <div
                key={row.label}
                className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-[#F3F5F8]"
              >
                <dt className="w-40 shrink-0 text-sm text-gray-500">{row.label}</dt>
                <dd className="m-0 min-w-0 flex-1 select-text text-right text-sm tabular-nums text-gray-900">
                  {row.value}
                </dd>
                <PlainCopyIconButton label={row.label} value={row.value} onCopied={notifyCopied} />
        </div>
            ))}
          </dl>

          {hideActions ? null : (
            <>
              <div className="my-5 border-t border-dashed border-[#D5D7DE]" />
              <RequisitesActionButtons amountRub={amountRub} />
            </>
          )}
      </div>
      </div>
    </>
  );
}


const AMOUNT_PRESETS = [1_000, 5_000, 10_000, 50_000];

const METHOD_META: Record<PaymentMethod, { title: string; eta: string }> = {
  sbp: { title: 'СБП', eta: 'до 15 минут' },
  card: { title: 'Банковская карта', eta: 'Visa, MasterCard и МИР · до 1 часа' },
  requisites: { title: 'По реквизитам', eta: 'до 5 рабочих дней' },
};

const METHODS: PaymentMethod[] = ['sbp', 'card', 'requisites'];

function SbpIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M3 6.5 7 4v16l-4-2.5z" fill="#5B57A2" />
      <path d="M7 4l5 3v4.5L7 8.5z" fill="#D90751" />
      <path d="M7 15.5l5-3V17l-5 3z" fill="#FAB718" />
      <path d="M12 7l5-3v6.5l-5 3z" fill="#ED6F26" />
      <path d="M12 13.5l5-3V20l-5-3z" fill="#63B22F" />
      <path d="M17 4l4 2.5v11L17 20z" fill="#1487C9" />
    </svg>
  );
}

function CardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="M3 10h18" strokeLinecap="round" />
      <path d="M7 15h3" strokeLinecap="round" />
    </svg>
  );
}

function BankIcon({ className }: { className?: string }) {
    return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <path d="M3 9.5 12 4l9 5.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v7M9.5 10v7M14.5 10v7M19 10v7M3.5 20h17" strokeLinecap="round" />
    </svg>
  );
}

function MethodIcon({ method, className }: { method: PaymentMethod; className?: string }) {
  if (method === 'sbp') return <SbpIcon className={className} />;
  if (method === 'card') return <CardIcon className={className} />;
  return <BankIcon className={className} />;
}

function SecurityNote({ compact = false }: { compact?: boolean }) {
    return (
    <div className={`flex items-start gap-3 rounded-2xl bg-[#F3F5F8] ${compact ? 'px-3.5 py-3' : 'px-4 py-3.5'}`}>
      <ShieldIcon className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" />
      <div className="min-w-0 text-sm leading-snug text-gray-700">
        <p className="mb-0 font-semibold text-gray-900">Данные карты защищены</p>
        <p className="mb-0 mt-1 text-gray-600">
          Будьте киберосознанным — читайте{' '}
          <button type="button" className="font-medium text-[#007AFF] hover:underline">
            Гид по безопасности
          </button>
        </p>
        </div>
      </div>
    );
  }

function BackButton({ onClick }: { onClick: () => void }) {
    return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-xl bg-[#EEF0F4] px-3 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-[#E4E7EC]"
    >
      <BackChevron className="h-4 w-4" />
      Назад
    </button>
  );
}

const displayAmount = (raw: string) => (raw ? Number(raw).toLocaleString('ru-RU') : '');

function AmountPresets({
  amountRub,
  onPick,
  centered = false,
  size = 'md',
}: {
  amountRub: number;
  onPick: (value: number) => void;
  centered?: boolean;
  size?: 'sm' | 'md';
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${centered ? 'justify-center' : ''}`}>
      {AMOUNT_PRESETS.map((value) => {
        const active = amountRub === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onPick(value)}
            className={`rounded-full font-medium tabular-nums transition-colors ${
              size === 'sm' ? 'h-8 px-3 text-xs' : 'h-9 px-3.5 text-sm'
            } ${active ? 'bg-gray-900 text-white' : 'bg-[#F3F5F8] text-gray-800 hover:bg-[#E8EBF0]'}`}
          >
            {formatMoney(value)} ₽
          </button>
        );
      })}
    </div>
  );
}

function PayButton({
  method,
  amountRub,
  disabled,
  className = '',
}: {
  method: PaymentMethod;
  amountRub: number;
  disabled: boolean;
  className?: string;
}) {
  const label =
    method === 'sbp' ? 'Оплатить через СБП' : method === 'card' ? 'Оплатить картой' : 'Получить реквизиты';
  return (
    <button
      type="button"
      disabled={disabled}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#9A41FE] px-6 text-[15px] font-semibold text-white transition-colors hover:bg-[#8a38e8] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {label}
      {!disabled && method !== 'requisites' ? (
        <span className="tabular-nums opacity-80">· {formatMoney(amountRub)} ₽</span>
      ) : null}
    </button>
  );
}

type TopUpProps = {
  method: PaymentMethod;
  setMethod: (m: PaymentMethod) => void;
  amount: string;
  setAmount: (v: string) => void;
  amountRub: number;
  amountError: string | null;
  balanceRub: number;
  onBack: () => void;
  /** Контент внутри боковой шторки — без «Назад» и page-отступов */
  embedded?: boolean;
  /** CTA вынесен в footer шторки */
  hideCta?: boolean;
};

function VariantShell({
  embedded,
  onBack,
  maxWidthClass,
  children,
}: {
  embedded?: boolean;
  onBack: () => void;
  maxWidthClass: string;
  children: React.ReactNode;
}) {
  return (
    <div className={embedded ? 'w-full' : `mx-auto w-full ${maxWidthClass} px-6 py-8`}>
      {!embedded ? <BackButton onClick={onBack} /> : null}
      {children}
    </div>
  );
}

function requisitesRenderer(props: TopUpProps) {
  const { amount, amountRub, amountError, setAmount, hideCta } = props;
  return (extra?: { bare?: boolean; hideAmount?: boolean; hideActions?: boolean }) => (
    <RequisitesPaymentBlock
      amount={amount}
      amountRub={amountError ? MIN_AMOUNT : Math.max(amountRub, MIN_AMOUNT)}
      amountError={amountError}
      onAmountChange={setAmount}
      bare={extra?.bare}
      hideAmount={extra?.hideAmount}
      hideActions={extra?.hideActions ?? hideCta}
    />
  );
}

/** RITM RtFormFieldText · primary fill + суффикс ₽, лейбл снаружи */
function AmountInput({
  amount,
  setAmount,
  amountError,
  label,
}: Pick<TopUpProps, 'amount' | 'setAmount' | 'amountError'> & { label?: string }) {
  return (
    <div>
      {label ? (
        <label
          htmlFor="top-up-amount"
          className="mb-2 block text-[15px] font-semibold leading-5 text-gray-900"
        >
          {label}
        </label>
      ) : null}
      <div
        className={`flex h-12 cursor-text items-center rounded-[10px] px-3 transition-colors ${
          amountError
            ? 'border border-red-300 bg-[#F2F2F7] focus-within:border-red-400 focus-within:bg-white'
            : 'border border-transparent bg-[#F2F2F7] hover:bg-[#EBEBF0] focus-within:border-black focus-within:bg-white'
        }`}
        onClick={(e) => {
          const input = (e.currentTarget as HTMLElement).querySelector('input');
          input?.focus();
        }}
      >
        <span className="flex min-w-0 w-full items-center gap-1">
          <input
            id="top-up-amount"
            type="text"
            inputMode="numeric"
            value={displayAmount(amount)}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
            placeholder="0"
            className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold tabular-nums leading-5 text-gray-900 outline-none placeholder:text-gray-400"
            aria-label={label || 'Сумма'}
          />
          <span className="shrink-0 text-[14px] font-medium text-[#A0A0AB]">₽</span>
        </span>
            </div>
      <p className={`mb-0 mt-1.5 text-[12px] ${amountError ? 'text-red-500' : 'text-gray-400'}`}>
        {amountError ?? `От ${formatMoney(MIN_AMOUNT)} ₽, кратно ${AMOUNT_STEP}`}
            </p>
          </div>
  );
}

/** Сумма + способ — сплошная белая модалка без островов */
function KeypadVariant(props: TopUpProps) {
  const { method, setMethod, amount, setAmount, amountRub, amountError, onBack, embedded, hideCta } =
    props;
  const requisites = requisitesRenderer(props);
  const valid = !amountError;
  return (
    <VariantShell embedded={embedded} onBack={onBack} maxWidthClass="max-w-[980px]">
      <section
        className={`flex w-full flex-col gap-6 ${embedded ? '' : 'mx-auto mt-6 max-w-[560px]'}`}
      >
        <div>
          {embedded ? null : (
            <p className="mb-0 text-sm text-gray-500">Пополнение счёта WB Продвижение</p>
          )}
          <div className={embedded ? '' : 'mt-5'}>
            <AmountInput
              amount={amount}
              setAmount={setAmount}
              amountError={amountError}
              label="Сумма"
            />
        </div>
          <div className="mt-3">
            <AmountPresets amountRub={amountRub} onPick={(v) => setAmount(String(v))} />
        </div>
      </div>

        <div className="border-t border-gray-100" />

        <div>
          <p className="mb-3 text-[15px] font-semibold text-gray-900">Способ оплаты</p>
          <div className="flex flex-col gap-0.5">
            {METHODS.map((id) => (
                <button
                key={id}
                  type="button"
                onClick={() => setMethod(id)}
                className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors ${
                  method === id ? 'bg-[#F2F2F7]' : 'hover:bg-[#F6F6F8]'
                }`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F2F2F7] text-gray-700">
                  <MethodIcon method={id} className="h-5 w-5" />
                  </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium text-gray-900">{METHOD_META[id].title}</span>
                  <span className="block text-xs text-gray-500">{METHOD_META[id].eta}</span>
                </span>
                </button>
            ))}
          </div>
          {!hideCta && method !== 'requisites' ? (
            <PayButton
              method={method}
              amountRub={amountRub}
              disabled={!valid}
              className="mt-4 h-12 w-full rounded-2xl"
            />
        ) : null}
        </div>
        {method === 'requisites' ? (
          <>
            <div className="border-t border-gray-100" />
            <div>
              <p className="mb-4 text-[15px] font-semibold text-gray-900">Реквизиты</p>
              {requisites({ bare: true, hideAmount: true, hideActions: hideCta })}
      </div>
    </>
        ) : null}
        <div className="border-t border-gray-100" />
        <SecurityNote compact />
      </section>
    </VariantShell>
  );
}

function TopUpFlow({
  embedded = false,
  hideCta = false,
  onBack,
  method,
  setMethod,
  amount,
  setAmount,
}: {
  embedded?: boolean;
  hideCta?: boolean;
  onBack: () => void;
  method: PaymentMethod;
  setMethod: (m: PaymentMethod) => void;
  amount: string;
  setAmount: (v: string) => void;
}) {
  const { profileId } = useProfile();
  const amountRub = parseAmountRub(amount);

  const amountError = useMemo(() => {
    if (!amount.trim() || Number.isNaN(amountRub)) return 'Укажите сумму';
    if (amountRub < MIN_AMOUNT) return `Минимальный платёж — ${formatMoney(MIN_AMOUNT)} ₽`;
    if (amountRub % AMOUNT_STEP !== 0) return `Сумма должна быть кратна ${AMOUNT_STEP}`;
    return null;
  }, [amount, amountRub]);

  return (
    <KeypadVariant
      method={method}
      setMethod={setMethod}
      amount={amount}
      setAmount={setAmount}
      amountRub={amountRub}
      amountError={amountError}
      balanceRub={PROMOTION_ACCOUNT_BALANCE_BY_PROFILE[profileId] ?? 0}
      onBack={onBack}
      embedded={embedded}
      hideCta={hideCta}
    />
  );
}

/** Боковая шторка пополнения счёта. */
export function FinanceTopUpSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const handleClose = useCallback(() => onClose(), [onClose]);
  const [method, setMethod] = useState<PaymentMethod>('sbp');
  const [amount, setAmount] = useState(String(5_000));

  const amountRub = parseAmountRub(amount);
  const amountError = useMemo(() => {
    if (!amount.trim() || Number.isNaN(amountRub)) return 'Укажите сумму';
    if (amountRub < MIN_AMOUNT) return `Минимальный платёж — ${formatMoney(MIN_AMOUNT)} ₽`;
    if (amountRub % AMOUNT_STEP !== 0) return `Сумма должна быть кратна ${AMOUNT_STEP}`;
    return null;
  }, [amount, amountRub]);
  const canPay = !amountError && method !== 'requisites';
  const showRequisitesActions = method === 'requisites';
  const requisitesAmountRub = amountError ? MIN_AMOUNT : Math.max(amountRub, MIN_AMOUNT);

  useEffect(() => {
    if (!open) return;
    notifySidePanelOpen('finance-top-up');
  }, [open]);

  useCloseOnOtherSidePanel('finance-top-up', handleClose);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, handleClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] bg-black/50" onClick={handleClose} role="presentation">
      <div className="flex h-full w-full justify-end" onClick={handleClose}>
        <div
          className="flex h-full max-h-full min-w-0 items-stretch gap-2"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex shrink-0 flex-col items-end justify-start pt-5 pl-3">
          <button
            type="button"
              onClick={handleClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-500 shadow-md hover:bg-gray-50 hover:text-gray-700"
              aria-label="Закрыть"
            >
              <X className="h-5 w-5" />
          </button>
          </div>

          <div
            className="relative flex h-full w-[720px] max-w-[calc(100vw-3rem)] shrink-0 flex-col overflow-hidden rounded-l-[28px] bg-white shadow-2xl animate-in slide-in-from-right duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="finance-top-up-sheet-title"
          >
            <div className="shrink-0 border-b border-gray-100 px-6 pb-4 pt-6 sm:px-7">
              <h2
                id="finance-top-up-sheet-title"
                className="text-[22px] font-bold tracking-tight text-gray-900"
              >
                Пополнение счёта
              </h2>
              </div>
            <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-6 pb-5 pt-5 sm:px-7">
              <TopUpFlow
                embedded
                hideCta
                onBack={handleClose}
                method={method}
                setMethod={setMethod}
                amount={amount}
                setAmount={setAmount}
              />
            </div>
            {canPay ? (
              <div className="shrink-0 border-t border-gray-100 bg-white px-6 pb-4 pt-3 sm:px-7">
                <div className="flex items-center justify-start">
                  <PayButton
                    method={method}
                    amountRub={amountRub}
                    disabled={!!amountError}
                    className="h-12 min-w-[220px] rounded-2xl"
                  />
              </div>
            </div>
            ) : null}
            {showRequisitesActions ? (
              <div className="shrink-0 border-t border-gray-100 bg-white px-6 pb-4 pt-3 sm:px-7">
                <RequisitesActionButtons amountRub={requisitesAmountRub} layout="sheet" />
          </div>
            ) : null}
        </div>
          </div>
          </div>
    </div>,
    document.body,
  );
}

/** Слушает openFinanceTopUp() и держит шторку (монтировать рядом с хедером). */
export function FinanceTopUpSheetHost() {
  const [open, setOpen] = useState(false);

  useEffect(() => subscribeFinanceTopUpOpen(() => setOpen(true)), []);

  useEffect(() => {
    setFinanceTopUpSheetOpen(open);
    return () => {
      if (open) setFinanceTopUpSheetOpen(false);
    };
  }, [open]);

  return <FinanceTopUpSheet open={open} onClose={() => setOpen(false)} />;
}

/** Deep-link /finance/top-up → открыть шторку и вернуться. */
const FinanceTopUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    openFinanceTopUp();
    navigate(financeHomePath(pathname), { replace: true });
  }, [navigate, pathname]);

  return null;
};

export default FinanceTopUpPage;
