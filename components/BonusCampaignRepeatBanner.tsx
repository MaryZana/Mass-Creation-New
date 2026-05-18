import React, { useCallback, useEffect, useState } from 'react';
import type { RepeatLaunchPreset } from './ProfileContext';
import { X } from './Icons';

const NOTIFICATION_PRODUCT_IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=160&h=160&fit=crop&q=80';

const CARD_WIDTH_PX = 388;
const CARD_HEIGHT_PX = 64;
const PEEK_SHIFT_PX = 9;
const HEIGHT_STEP_PX = 6;
const OPACITY_STEP = 0.32;
const DISMISS_MS = 320;

export type BonusCampaignNotification = {
  id: string;
  imageUrl: string;
  views: number;
  orders: number;
  title?: string;
  launchPreset: RepeatLaunchPreset;
};

function formatMetric(value: number): string {
  const sign = value >= 0 ? '+ ' : '− ';
  const abs = Math.abs(value);
  return sign + abs.toLocaleString('ru-RU').replace(/\u00A0/g, ' ');
}

function stackMetrics(depth: number) {
  const height = Math.max(48, CARD_HEIGHT_PX - depth * HEIGHT_STEP_PX);
  const opacity = Math.max(0.32, 1 - depth * OPACITY_STEP);
  const translateX = depth * PEEK_SHIFT_PX;
  return { height, opacity, translateX };
}

function stackRightEdge(depth: number) {
  const { translateX } = stackMetrics(depth);
  return translateX + CARD_WIDTH_PX;
}

function NotificationProductImage({ src }: { src: string }) {
  const [resolvedSrc, setResolvedSrc] = useState(src);
  useEffect(() => {
    setResolvedSrc(src);
  }, [src]);
  return (
    <img
      src={resolvedSrc}
      alt=""
      className="h-[40px] w-[28px] shrink-0 rounded-lg object-cover bg-gray-100"
      onError={() => {
        if (resolvedSrc !== NOTIFICATION_PRODUCT_IMAGE_FALLBACK) {
          setResolvedSrc(NOTIFICATION_PRODUCT_IMAGE_FALLBACK);
        }
      }}
    />
  );
}

function NotificationCardBody({
  imageUrl,
  title,
  views,
  orders,
  onTitleClick,
}: {
  imageUrl: string;
  title: string;
  views: number;
  orders: number;
  onTitleClick?: () => void;
  statsAction?: React.ReactNode;
}) {
  const titleClassName =
    'm-0 whitespace-nowrap text-left text-[11px] font-semibold leading-[13px] text-gray-900';

  return (
    <>
      <NotificationProductImage src={imageUrl} />
      <div className="flex min-w-0 flex-1 flex-col gap-[4px] pr-1">
        {onTitleClick ? (
          <button
            type="button"
            onClick={onTitleClick}
            className={`${titleClassName} cursor-pointer transition-colors hover:text-[#7c3aed] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40 rounded-sm`}
          >
            {title}
          </button>
        ) : (
          <p className={titleClassName}>{title}</p>
        )}
        <div className="flex items-end gap-3">
          <div className="min-w-0">
            <p className="m-0 text-[9px] leading-[10px] text-[#767386]">Просмотры</p>
            <p className="m-0 truncate text-[11px] font-bold leading-[12px] tabular-nums text-emerald-600">
              {formatMetric(views)}
            </p>
          </div>
          <div className="shrink-0">
            <p className="m-0 text-[9px] leading-[10px] text-[#767386]">Заказы</p>
            <p className="m-0 text-[11px] font-bold leading-[12px] tabular-nums text-emerald-600">
              {formatMetric(orders)}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function NotificationCard({
  item,
  depth,
  isActive,
  isExiting,
  onDismiss,
  onRepeat,
  onOpenDetail,
}: {
  item: BonusCampaignNotification;
  depth: number;
  isActive: boolean;
  isExiting: boolean;
  onDismiss?: () => void;
  onRepeat?: () => void;
  onOpenDetail?: () => void;
}) {
  const title = item.title ?? 'Кампания потратила бонусы';
  const { height, opacity, translateX } = stackMetrics(depth);

  const transform = isExiting
    ? 'translate(-10px, -50%) scale(0.98)'
    : `translate(${translateX}px, -50%)`;

  return (
    <div
      className="pointer-events-none absolute left-0 top-1/2 transition-[transform,opacity,height] duration-300 ease-out"
      style={{
        width: CARD_WIDTH_PX,
        zIndex: 40 - depth,
        height,
        transform,
        opacity: isExiting ? 0 : opacity,
      }}
    >
      <div
        className={`relative flex h-full w-full items-center gap-2 rounded-[12px] bg-white py-0 pl-3 ${
          isActive ? 'pointer-events-auto pr-2' : 'pointer-events-none pr-2'
        }`}
      >
        <NotificationCardBody
          imageUrl={item.imageUrl}
          title={title}
          views={item.views}
          orders={item.orders}
          onTitleClick={isActive && !isExiting ? onOpenDetail : undefined}
        />

        {isActive && !isExiting && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onRepeat}
              className="rounded-lg bg-[#f3e8ff] px-2.5 py-1.5 text-[11px] font-semibold leading-none text-[#7c3aed] transition-colors hover:bg-[#ede9fe]"
            >
              Повторить
            </button>
            <button
              type="button"
              aria-label="Закрыть уведомление"
              onClick={onDismiss}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-3 w-3" aria-hidden />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function BonusCampaignNotificationStack({
  items,
  onDismissItem,
  onRepeatItem,
  onOpenItemDetail,
}: {
  items: BonusCampaignNotification[];
  onDismissItem: (id: string) => void;
  onRepeatItem: (item: BonusCampaignNotification) => void;
  onOpenItemDetail?: (item: BonusCampaignNotification) => void;
}) {
  const [exitingId, setExitingId] = useState<string | null>(null);

  const visible = items.slice(0, 3);
  const peekCount = Math.min(2, Math.max(0, visible.length - 1));
  const containerWidth = Math.ceil(stackRightEdge(peekCount)) + 4;

  const handleDismissActive = useCallback(() => {
    const active = items[0];
    if (!active || exitingId) return;
    setExitingId(active.id);
    window.setTimeout(() => {
      onDismissItem(active.id);
      setExitingId(null);
    }, DISMISS_MS);
  }, [items, exitingId, onDismissItem]);

  if (items.length === 0) return null;

  return (
    <div
      className="relative h-16 shrink-0 overflow-hidden transition-[width] duration-300 ease-out"
      style={{ width: containerWidth, maxWidth: '100%' }}
      aria-live="polite"
    >
      {[...visible].reverse().map((item, reverseIndex) => {
        const index = visible.length - 1 - reverseIndex;
        const depth = exitingId && index > 0 ? index - 1 : index;
        const isActive = index === 0;
        return (
          <NotificationCard
            key={item.id}
            item={item}
            depth={depth}
            isActive={isActive}
            isExiting={isActive && exitingId === item.id}
            onDismiss={isActive ? handleDismissActive : undefined}
            onRepeat={isActive ? () => onRepeatItem(item) : undefined}
            onOpenDetail={isActive && onOpenItemDetail ? () => onOpenItemDetail(item) : undefined}
          />
        );
      })}
    </div>
  );
}
