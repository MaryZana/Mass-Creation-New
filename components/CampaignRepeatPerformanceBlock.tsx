import React, { useState } from 'react';
import { ArrowUp, CheckCircle, ClipboardCheck, DollarSign, Info, Package } from './Icons';
import { RankingFactorsSidePanel } from './RankingFactorsSidePanel';
import type { ProfileId } from './ProfileContext';

export type CampaignRepeatPerformanceVariant = 'success' | 'cardWork';

const statCardClass = 'campaign-repeat-performance__card';

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
    <div className="campaign-repeat-performance__card-body flex min-h-0 flex-1 flex-col gap-px">
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
    : 'Отлично! Продолжайте продвижение с новой кампанией';

  const ctaHeadline = 'Поработайте над наполнением карточки';

  const successDescription =
    'Эта бонусная кампания истратила все бонусы, поэтому подготовили новую кампанию и сохранили все настройки этой, просто перезапустите';

  const cardWorkDescription =
    'Стоит поработать над наполнением карточки вместе с продолжением открутки продвижения';

  const ctaButtonLabel = isCardWork ? 'Проверить факторы ранжирования' : 'Проверить и запустить';

  return (
    <>
      <section className="mb-4 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        {isCardWork ? (
          <>
            <div className="px-5 pt-4">
              <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <Info className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
                <span>{sectionTitle}</span>
              </h2>
            </div>
            <div className="campaign-repeat-performance__grid">
              <div className={statCardClass}>
                <BlockIcon>
                  <ClipboardCheck className="h-5 w-5" aria-hidden />
                </BlockIcon>
                <CardHeadlineBlock
                  headline={<p className={`${headlineClass} text-gray-900`}>{ctaHeadline}</p>}
                  description={<>{cardWorkDescription}</>}
                />
                <button
                  type="button"
                  onClick={() => setIsRankingPanelOpen(true)}
                  className="mt-2.5 w-full shrink-0 rounded-lg bg-[#9a41fe] px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#8840e5] sm:w-auto sm:self-start"
                >
                  {ctaButtonLabel}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="campaign-repeat-performance__success-row">
            <div className="campaign-repeat-performance__success-cta">
              <h2 className="flex items-center gap-2 text-lg font-bold leading-snug text-gray-900">
                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                <span>{sectionTitle}</span>
              </h2>
              <p className="text-base leading-snug text-gray-600">{successDescription}</p>
              <button
                type="button"
                onClick={() => onRepeatCampaign?.()}
                className="inline-flex w-fit shrink-0 items-center rounded-lg bg-[#9a41fe] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#8840e5]"
              >
                {ctaButtonLabel}
              </button>
            </div>

            <div className="campaign-repeat-performance__success-metrics">
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
            </div>
          </div>
        )}
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
