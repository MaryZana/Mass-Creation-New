import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeatureVideoGuide } from '../components/FeatureVideoGuide';

const TOP_UP_VIDEO_SRC = '/videos/help-instruction-demo.mp4';
const TOP_UP_VIDEO_TITLE = 'Пополнение счёта и возврат средств';
const MIN_AMOUNT = 500;
const AMOUNT_STEP = 50;

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

const FinanceTopUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { openGuide, modal: videoModal } = useFeatureVideoGuide();
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [amount, setAmount] = useState(String(MIN_AMOUNT));

  const amountError = useMemo(() => {
    const n = Number(String(amount).replace(/\s/g, ''));
    if (!amount.trim() || Number.isNaN(n)) return 'Укажите сумму';
    if (n < MIN_AMOUNT) return `Минимальный платёж — ${MIN_AMOUNT} ₽`;
    if (n % AMOUNT_STEP !== 0) return `Сумма должна быть кратна ${AMOUNT_STEP}`;
    return null;
  }, [amount]);

  return (
    <main className="mx-auto w-full max-w-[920px] px-6 py-8">
      {videoModal}

      <button
        type="button"
        onClick={() => navigate('/finance')}
        className="inline-flex items-center gap-1.5 rounded-xl bg-[#EEF0F4] px-3 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-[#E4E7EC]"
      >
        <BackChevron className="h-4 w-4" />
        Назад
      </button>

      <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/[0.03] sm:p-7">
        <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-[28px]">
            Пополнить счёт WB Продвижение
          </h1>
          <button
            type="button"
            onClick={() =>
              openGuide({
                title: TOP_UP_VIDEO_TITLE,
                videoSrc: TOP_UP_VIDEO_SRC,
                description: 'Видеоинструкция · 5:05',
              })
            }
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#007AFF] transition-colors hover:text-[#0066d6] hover:underline"
          >
            <span
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gray-400 text-black"
              aria-hidden
            >
              <svg viewBox="0 0 24 24" className="ml-px h-2 w-2" fill="currentColor">
                <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l10.5-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14Z" />
              </svg>
            </span>
            Как пополнять счёт
          </button>
        </div>

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

        <p className="mt-6 text-sm text-gray-700">Минимальный платёж — {MIN_AMOUNT} ₽</p>

        <div className="mt-3">
          <label htmlFor="top-up-amount" className="mb-1.5 block text-sm font-medium text-gray-800">
            Сумма пополнения
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1">
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
              <p className={`mt-1.5 text-xs ${amountError ? 'text-red-500' : 'text-gray-500'}`}>
                {amountError ?? `Сумма должна быть кратна ${AMOUNT_STEP}`}
              </p>
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

        {method === 'card' ? (
          <div className="mt-5 space-y-1 text-xs leading-relaxed text-gray-500">
            <p>Принимаем карты Visa, MasterCard и МИР.</p>
            <p>
              Срок зачисления денег: картой — от 15 минут до 1 часа, через СБП — зависит от банка, обычно
              не больше 15 минут.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-1 text-xs leading-relaxed text-gray-500">
            <p>Перевод по банковским реквизитам юрлица или ИП.</p>
            <p>Срок зачисления — до 5 рабочих дней после поступления платежа.</p>
          </div>
        )}

        <div className="mt-8 flex items-start gap-3 rounded-2xl bg-[#F3F5F8] px-4 py-3.5">
          <ShieldIcon className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" />
          <div className="min-w-0 text-sm leading-snug text-gray-700">
            <p>Мы гарантируем безопасность и сохранность ваших данных</p>
            <p className="mt-1">
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
