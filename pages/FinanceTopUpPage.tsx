import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, Download } from '../components/Icons';
import { RitmNotification } from '../components/RitmNotification';
import { financeHomePath } from '../utils/financeRoutes';

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

type PaymentMethod = 'card' | 'requisites';

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

function PaymentRadio({ selected }: { selected: boolean }) {
  return (
    <span
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
        selected ? 'border-[#9A41FE]' : 'border-gray-300'
      }`}
      aria-hidden
    >
      {selected ? <span className="h-2.5 w-2.5 rounded-full bg-[#9A41FE]" /> : null}
    </span>
  );
}

function CardBrandMarks() {
  return (
    <span className="mt-2 flex flex-wrap items-center gap-1.5" aria-hidden>
      <span className="rounded bg-[#1A1F71] px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white">VISA</span>
      <span className="rounded bg-[#EB001B]/90 px-1.5 py-0.5 text-[9px] font-bold text-white">MC</span>
      <span className="rounded bg-[#0B8F4C] px-1.5 py-0.5 text-[9px] font-bold text-white">МИР</span>
      <span className="rounded bg-[#1D1346] px-1.5 py-0.5 text-[9px] font-bold text-white">СБП</span>
    </span>
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

function RequisitesPaymentBlock({
  amount,
  amountRub,
  amountError,
  onAmountChange,
}: {
  amount: string;
  amountRub: number;
  amountError: string | null;
  onAmountChange: (value: string) => void;
}) {
  const [qrEnlarged, setQrEnlarged] = useState(false);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const paymentPurpose = useMemo(() => buildPaymentPurpose(amountRub), [amountRub]);
  const qrSeed = `${paymentPurpose}|${amountRub}`;
  const notifyCopied = () => setCopyNotice('Скопировано');
  const amountCopyValue = Number.isNaN(amountRub) ? amount : String(amountRub);
  const warnText =
    'Скопируйте сумму без округлений, а назначение — слово в слово. Иначе оплата не пройдёт';
  const qrCaption = `Пополнить на ${formatMoney(amountRub)} ₽ в приложении`;

  const downloadPdf = async () => {
    if (pdfBusy) return;
    setPdfBusy(true);
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
    } catch {
      setCopyNotice('Не удалось скачать PDF');
    } finally {
      document.body.removeChild(host);
      setPdfBusy(false);
    }
  };

  return (
    <>
      {copyNotice ? (
        <RitmNotification
          message={copyNotice}
          durationMs={2000}
          onClose={() => setCopyNotice(null)}
        />
      ) : null}

      <div className="mt-6 w-full max-w-[560px] rounded-3xl bg-[#F3F5F8] p-2">
        <div className="rounded-[20px] bg-white px-5 pb-5 pt-6 sm:px-7">
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

          <div className="my-5 border-t border-dashed border-[#D5D7DE]" />

          <button
            type="button"
            onClick={() => setQrEnlarged(true)}
            className="flex w-full items-center gap-3 rounded-2xl border border-[#E3E4E9] bg-white px-4 py-3 text-left transition-colors hover:bg-[#F7F8FA]"
          >
            <span className="rounded-lg bg-[#F3F5F8] p-1">
              <PaymentQrCode seed={qrSeed} size={48} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-medium text-gray-900">{qrCaption}</span>
              <span className="block text-xs text-gray-500">Нажмите, чтобы открыть QR крупнее</span>
            </span>
            <span className="text-xl text-gray-300" aria-hidden>
              ›
            </span>
          </button>

          <button
            type="button"
            onClick={() => void downloadPdf()}
            disabled={pdfBusy}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1C1C1E] text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-wait disabled:opacity-70"
          >
            <Download className="h-4 w-4" />
            {pdfBusy ? 'Готовим PDF…' : 'Скачать в PDF'}
          </button>
        </div>
      </div>

      {qrEnlarged ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4"
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


const FinanceTopUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [amount, setAmount] = useState(String(MIN_AMOUNT));

  const amountRub = parseAmountRub(amount);

  const amountError = useMemo(() => {
    if (!amount.trim() || Number.isNaN(amountRub)) return 'Укажите сумму';
    if (amountRub < MIN_AMOUNT) return `Минимальный платёж — ${MIN_AMOUNT} ₽`;
    if (amountRub % AMOUNT_STEP !== 0) return `Сумма должна быть кратна ${AMOUNT_STEP}`;
    return null;
  }, [amount, amountRub]);


  return (
    <main className="mx-auto w-full max-w-[980px] px-6 py-8">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/[0.03] sm:p-7">
        <button
          type="button"
          onClick={() => navigate(financeHomePath(pathname))}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#EEF0F4] px-3 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-[#E4E7EC]"
        >
          <BackChevron className="h-4 w-4" />
          Назад
        </button>

        <h1 className="mb-6 mt-5 text-2xl font-bold tracking-tight text-gray-900 sm:text-[28px]">
          Пополнить счёт WB Продвижение
        </h1>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMethod('card')}
            className={`rounded-2xl border p-4 text-left transition-colors ${
              method === 'card'
                ? 'border-[#9A41FE] bg-[#FBF7FF]'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <PaymentRadio selected={method === 'card'} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">Картой или через СБП</p>
                <CardBrandMarks />
                <p className="mt-3 text-xs text-gray-500">Срок зачисления — до 1 часа</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMethod('requisites')}
            className={`rounded-2xl border p-4 text-left transition-colors ${
              method === 'requisites'
                ? 'border-[#9A41FE] bg-[#FBF7FF]'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <PaymentRadio selected={method === 'requisites'} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">По реквизитам</p>
                <p className="mt-8 text-xs text-gray-500 sm:mt-10">Срок зачисления — до 5 рабочих дней</p>
              </div>
            </div>
          </button>
        </div>

        {method === 'card' ? (
          <div className="mt-6">
            <label htmlFor="top-up-amount" className="mb-1.5 block text-sm font-medium text-gray-800">
              Сумма пополнения
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="w-full max-w-[calc(100%/3)]">
                <div className="relative">
                  <input
                    id="top-up-amount"
                    type="text"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^\d\s]/g, ''))}
                    className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 pr-10 text-base font-medium tabular-nums text-gray-900 outline-none transition-colors focus:border-[#9A41FE] focus:ring-1 focus:ring-[#9A41FE]"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    ₽
                  </span>
                </div>
                {amountError ? <p className="mt-1.5 text-xs text-red-500">{amountError}</p> : null}
              </div>
              <button
                type="button"
                disabled={Boolean(amountError)}
                className="inline-flex h-12 shrink-0 items-center justify-center rounded-xl bg-[#9A41FE] px-8 text-sm font-semibold text-white transition-colors hover:bg-[#8a38e8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Пополнить
              </button>
            </div>
          </div>
        ) : null}

        {method === 'card' ? (
          <div className="mt-5 space-y-1 text-xs leading-relaxed text-gray-500">
            <p>Принимаем карты Visa, MasterCard и МИР.</p>
            <p>
              Срок зачисления денег: картой — от 15 минут до 1 часа, через СБП — зависит от банка, обычно
              не больше 15 минут.
            </p>
          </div>
        ) : (
          <RequisitesPaymentBlock
            amount={amount}
            amountRub={amountError ? MIN_AMOUNT : Math.max(amountRub, MIN_AMOUNT)}
            amountError={amountError}
            onAmountChange={setAmount}
          />
        )}

        <div className="mt-8 flex items-start gap-3 rounded-2xl bg-[#F3F5F8] px-4 py-3.5">
          <ShieldIcon className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" />
          <div className="min-w-0 text-sm leading-snug text-gray-700">
            <p className="font-semibold text-gray-900">
              Мы гарантируем безопасность и сохранность ваших данных
            </p>
            <p className="mt-1 font-normal text-gray-700">
              Будьте киберосознанным — читайте{' '}
              <button type="button" className="font-medium text-[#007AFF] hover:underline">
                Гид по безопасности
              </button>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default FinanceTopUpPage;
