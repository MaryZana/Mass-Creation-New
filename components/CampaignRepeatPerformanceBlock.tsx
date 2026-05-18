import React, { useState } from 'react';
import { ArrowUp, CheckCircle, ClipboardCheck, DollarSign, Info, Package, Rocket } from './Icons';
import { RankingFactorsSidePanel } from './RankingFactorsSidePanel';
import type { ProfileId } from './ProfileContext';

export type CampaignRepeatPerformanceVariant = 'success' | 'cardWork';

const statCardClass =
  'flex h-full flex-col border border-gray-200 rounded-2xl bg-white px-4 py-3';

const headlineClass =
  'text-2xl font-bold leading-none tracking-tight';

function BlockIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
      {children}
    </span>
  );
}

function CardHeadlineBlock({
  headline,
  description,
}: {
  headline: React.ReactNode;
  description: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-px">
      {headline}
      <p className="text-base leading-tight text-gray-600">{description}</p>
    </div>
  );
}

function variantForProfile(profileId: ProfileId): CampaignRepeatPerformanceVariant {
  return profileId === '2' ? 'cardWork' : 'success';
}

export function CampaignRepeatPerformanceBlock({
  profileId = '1',
  onRepeatCampaign,
  rankingProduct,
}: {
  profileId?: ProfileId;
  onRepeatCampaign?: () => void;
  rankingProduct?: {
    name: string;
    imageUrl: string;
    meta?: string;
  };
}) {
  const [isRankingPanelOpen, setIsRankingPanelOpen] = useState(false);
  const isCardWork = variantForProfile(profileId) === 'cardWork';

  const sectionTitle = isCardWork
    ? 'Бонусы истрачены, есть интерес к товару, но заказов нет'
    : 'Бонусы истрачены и принесли заказы';

  const ctaHeadline = isCardWork
    ? 'Поработайте над наполнением карточки'
    : 'Запустите такую же кампанию еще раз';

  const ctaDescription = isCardWork
    ? 'Стоит поработать над наполнением карточки вместе с продолжением открутки продвижения'
    : 'Эта бонусная кампания истратила все бонусы, поэтому подготовили новую кампанию и сохранили все настройки этой, просто перезапустите';

  const ctaButtonLabel = isCardWork ? 'Проверить факторы ранжирования' : 'Проверить и запустить';

  return (
    <>
    <section className="mb-4 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <p className="text-sm leading-tight text-gray-500">
          Кампания потратила 5000 бонусов · результаты за 10 дней
        </p>
        <h2 className="mt-1.5 flex items-center gap-2 text-lg font-bold text-gray-900">
          {isCardWork ? (
            <Info className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
          ) : (
            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
          )}
          <span>{sectionTitle}</span>
        </h2>
      </div>

      <div
        className={`grid grid-cols-1 gap-4 p-4 ${isCardWork ? '' : 'sm:grid-cols-3'}`}
      >
        <div className={statCardClass}>
          <BlockIcon>
            {isCardWork ? (
              <ClipboardCheck className="h-5 w-5" aria-hidden />
            ) : (
              <Rocket className="h-5 w-5" aria-hidden />
            )}
          </BlockIcon>
          <CardHeadlineBlock
            headline={<p className={`${headlineClass} text-gray-900`}>{ctaHeadline}</p>}
            description={<>{ctaDescription}</>}
          />
          <button
            type="button"
            onClick={() => {
              if (isCardWork) {
                setIsRankingPanelOpen(true);
              } else {
                onRepeatCampaign?.();
              }
            }}
            className="mt-2.5 w-full shrink-0 rounded-lg bg-[#9a41fe] px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#8840e5] sm:w-auto sm:self-start"
          >
            {ctaButtonLabel}
          </button>
        </div>

        {!isCardWork && (
          <>
            <div className={statCardClass}>
              <BlockIcon>
                <DollarSign className="h-5 w-5" aria-hidden />
              </BlockIcon>
              <CardHeadlineBlock
                headline={
                  <p className={`${headlineClass} tabular-nums text-emerald-700`}>+ 1000 ₽</p>
                }
                description={<>Принесла кампания без учёта комиссий</>}
              />
            </div>

            <div className={statCardClass}>
              <BlockIcon>
                <Package className="h-5 w-5" aria-hidden />
              </BlockIcon>
              <CardHeadlineBlock
                headline={
                  <p
                    className={`flex items-center gap-1.5 ${headlineClass} tabular-nums text-emerald-700`}
                  >
                    <ArrowUp className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                    <span>+ 2 заказов</span>
                  </p>
                }
                description={
                  <>
                    Эффективнее прошлого периода на{' '}
                    <span className="font-semibold text-gray-900">15%</span>
                  </>
                }
              />
            </div>
          </>
        )}
      </div>

    </section>

    {isCardWork && (
      <RankingFactorsSidePanel
        open={isRankingPanelOpen}
        onClose={() => setIsRankingPanelOpen(false)}
        productName={rankingProduct?.name}
        productImageUrl={rankingProduct?.imageUrl}
        productMeta={rankingProduct?.meta}
      />
    )}
    </>
  );
}
