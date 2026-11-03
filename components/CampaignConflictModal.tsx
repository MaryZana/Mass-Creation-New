import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { CampaignRecord } from '../types';
import { X } from './Icons';

export type ConflictCampaignLink = {
  id: string;
  name: string;
};

export type ConflictProductCard = {
  id: string;
  productName: string;
  imageUrl: string;
  article: string;
  campaignCount: number;
  searchConflicts: ConflictCampaignLink[];
  recommendationsConflicts: ConflictCampaignLink[];
};

function getPlural(n: number, one: string, two: string, five: string) {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return five;
  if (last > 1 && last < 5) return two;
  if (last === 1) return one;
  return five;
}

/** Демо-конфликты для строки массового создания. */
export function buildDemoConflictCards(row: CampaignRecord): ConflictProductCard[] {
  const article = String(row.nmId);
  const longName = 'Кампания с очень длинным названием от 26.12.2024';
  const dated = 'Кампания от 26.12.2024';

  return [
    {
      id: row.id,
      productName: row.productName,
      imageUrl: row.imageUrl,
      article,
      campaignCount: 6,
      searchConflicts: [
        { id: `${row.id}-s1`, name: 'Конкурируют в Поиске' },
        { id: `${row.id}-s2`, name: dated },
        { id: `${row.id}-s3`, name: longName },
      ],
      recommendationsConflicts: [
        { id: `${row.id}-r1`, name: dated },
        { id: `${row.id}-r2`, name: dated },
        { id: `${row.id}-r3`, name: longName },
      ],
    },
    {
      id: `${row.id}-related`,
      productName: 'Футболка для настоящих мужиков',
      imageUrl: row.imageUrl,
      article,
      campaignCount: 3,
      searchConflicts: [
        { id: `${row.id}-rs1`, name: 'Конкурируют в Поиске' },
        { id: `${row.id}-rs2`, name: dated },
        { id: `${row.id}-rs3`, name: longName },
      ],
      recommendationsConflicts: [],
    },
  ];
}

function ConflictZoneBlock({
  title,
  items,
}: {
  title: string;
  items: ConflictCampaignLink[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-gray-900">{title}</p>
      <ul className="m-0 list-disc space-y-1 pl-5">
        {items.map((item) => (
          <li key={item.id} className="text-sm leading-5">
            <button
              type="button"
              className="max-w-full truncate text-left text-[#3B82F6] hover:underline"
              onClick={() => undefined}
            >
              {item.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CampaignConflictModal({
  isOpen,
  products,
  onClose,
}: {
  isOpen: boolean;
  products: ConflictProductCard[];
  onClose: () => void;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="campaign-conflict-modal-title"
        className="flex max-h-[min(860px,calc(100vh-2rem))] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 px-6 pb-3 pt-5">
          <div className="flex items-start justify-between gap-3">
            <h2
              id="campaign-conflict-modal-title"
              className="m-0 text-xl font-bold leading-snug text-gray-900"
            >
              Конфликт кампаний
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="-mr-1 -mt-1 shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Закрыть"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mb-0 mt-2 text-sm leading-5 text-gray-900">
            Если товар продвигается в кампаниях с одинаковыми зонами показов, то показы могут
            идти нестабильно
          </p>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-2">
          {products.map((product) => (
            <div key={product.id} className="rounded-2xl bg-[#F2F2F7] px-4 py-3.5">
              <div className="flex items-start gap-3">
                <img
                  src={product.imageUrl}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-lg bg-white object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="mb-0 truncate text-sm font-semibold text-gray-900">
                    {product.productName}
                  </p>
                  <p className="mb-0 mt-0.5 text-xs text-gray-500">
                    Арт. {product.article}
                    <span className="mx-1.5 text-gray-300">·</span>
                    {product.campaignCount}{' '}
                    {getPlural(
                      product.campaignCount,
                      'кампания',
                      'кампании',
                      'кампаний',
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-3 max-h-[220px] space-y-3 overflow-y-auto pr-1">
                <ConflictZoneBlock
                  title="Конфликтуют в Поиске"
                  items={product.searchConflicts}
                />
                <ConflictZoneBlock
                  title="Конфликтуют в Рекомендациях"
                  items={product.recommendationsConflicts}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex shrink-0 justify-end px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#9A41FE] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#8A35EE]"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
