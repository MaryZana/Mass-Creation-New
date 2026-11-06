import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { X } from './Icons';

export type FeatureVideoGuideProps = {
  /** Заголовок в модалке (если открывает встроенное видео) */
  title?: string;
  /** URL или путь к видео (если открывает встроенное видео) */
  videoSrc?: string;
  /** Короткое описание под заголовком в модалке */
  description?: string;
  /** Подпись для a11y */
  label?: string;
  /** Текст чёрного тултипа при наведении (для icon) */
  tooltip?: string;
  className?: string;
  /**
   * icon — компактная кнопка-иконка (по умолчанию), можно ставить рядом с заголовками
   * pill — редкий вариант с текстом
   */
  variant?: 'icon' | 'pill';
  /** Свой обработчик вместо встроенной видео-модалки (например, открыть инструкцию) */
  onClick?: () => void;
};

type GuideState = {
  open: boolean;
  title: string;
  videoSrc: string;
  description?: string;
  /** Какой экземпляр хука сейчас владеет открытой панелью */
  ownerId: symbol | null;
};

const SIDE_PANEL_OPEN_EVENT = 'wb-side-panel:open';

type SidePanelOpenDetail = { source: 'video-guide' | 'unified-account' | 'balance-faq' };

/** Сообщить другим панелям, что открылась новая — предыдущие должны закрыться. */
export function notifySidePanelOpen(source: SidePanelOpenDetail['source']) {
  window.dispatchEvent(
    new CustomEvent<SidePanelOpenDetail>(SIDE_PANEL_OPEN_EVENT, { detail: { source } }),
  );
}

/** Подписка: закрыть свою панель, если открылась другая. */
export function useCloseOnOtherSidePanel(
  source: SidePanelOpenDetail['source'],
  onClose: () => void,
) {
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<SidePanelOpenDetail>).detail;
      if (detail?.source && detail.source !== source) onClose();
    };
    window.addEventListener(SIDE_PANEL_OPEN_EVENT, handler);
    return () => window.removeEventListener(SIDE_PANEL_OPEN_EVENT, handler);
  }, [source, onClose]);
}

/**
 * Тултип по hover: после закрытия/dismiss не показывать снова,
 * пока курсор не уйдёт с триггера и не вернётся.
 */
export function useDismissibleHoverTooltip(blocked = false) {
  const [hovered, setHovered] = useState(false);
  const [suppressUntilLeave, setSuppressUntilLeave] = useState(false);

  useEffect(() => {
    if (blocked) {
      setHovered(false);
      setSuppressUntilLeave(true);
    }
  }, [blocked]);

  const dismiss = useCallback(() => {
    setHovered(false);
    setSuppressUntilLeave(true);
  }, []);

  return {
    show: hovered && !suppressUntilLeave && !blocked,
    onMouseEnter: () => {
      if (!suppressUntilLeave && !blocked) setHovered(true);
    },
    onMouseLeave: () => {
      setHovered(false);
      setSuppressUntilLeave(false);
    },
    dismiss,
  };
}

let guideState: GuideState = {
  open: false,
  title: '',
  videoSrc: '',
  ownerId: null,
};
const guideListeners = new Set<() => void>();

function emitGuide() {
  guideListeners.forEach((listener) => listener());
}

function setGuideState(next: GuideState) {
  guideState = next;
  emitGuide();
}

function subscribeGuide(listener: () => void) {
  guideListeners.add(listener);
  return () => {
    guideListeners.delete(listener);
  };
}

function getGuideSnapshot() {
  return guideState;
}

function PlayGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l10.5-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14Z" />
    </svg>
  );
}

function FeatureVideoGuideModal({
  title,
  description,
  videoSrc,
  onClose,
}: {
  title: string;
  description?: string;
  videoSrc: string;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    void el.play().catch(() => {});
    return () => {
      el.pause();
      el.currentTime = 0;
    };
  }, [videoSrc]);

  return createPortal(
    <aside
      role="dialog"
      aria-modal="false"
      aria-labelledby="feature-video-guide-title"
      className="fixed inset-y-0 right-0 z-[130] flex w-full max-w-[480px] flex-col border-l border-gray-200 bg-white shadow-2xl"
      onMouseEnter={(event) => event.stopPropagation()}
      onMouseLeave={(event) => event.stopPropagation()}
      onMouseOver={(event) => event.stopPropagation()}
      onMouseOut={(event) => event.stopPropagation()}
    >
      <div className="relative shrink-0 border-b border-gray-100 px-5 py-4 pr-12">
        <p className="text-sm font-semibold text-[#9A41FE]">Видеоинструкция</p>
        <h2
          id="feature-video-guide-title"
          className="mt-1 text-lg font-bold leading-snug tracking-tight text-gray-900"
        >
          {title}
        </h2>
        {description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="Закрыть видео"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="overflow-hidden rounded-2xl bg-black ring-1 ring-black/[0.06]">
          <div className="aspect-video w-full">
            <video
              ref={videoRef}
              src={videoSrc}
              controls
              playsInline
              className="h-full w-full object-cover"
            >
              Ваш браузер не поддерживает видео.
            </video>
          </div>
        </div>
      </div>
    </aside>,
    document.body,
  );
}

/** Императивный хелпер: открыть то же видео из другого UI (например, из тултипа). */
export function useFeatureVideoGuide() {
  const ownerIdRef = useRef(Symbol('feature-video-guide'));
  const state = useSyncExternalStore(subscribeGuide, getGuideSnapshot, getGuideSnapshot);

  const closeGuide = useCallback(() => {
    if (guideState.ownerId === ownerIdRef.current || guideState.open) {
      setGuideState({
        open: false,
        title: '',
        videoSrc: '',
        ownerId: null,
      });
    }
  }, []);

  const openGuide = useCallback((opts: { title: string; videoSrc: string; description?: string }) => {
    notifySidePanelOpen('video-guide');
    setGuideState({
      open: true,
      title: opts.title,
      videoSrc: opts.videoSrc,
      description: opts.description,
      ownerId: ownerIdRef.current,
    });
  }, []);

  useCloseOnOtherSidePanel('video-guide', closeGuide);

  const isOwner = state.open && state.ownerId === ownerIdRef.current;

  const modal =
    isOwner ? (
      <FeatureVideoGuideModal
        title={state.title}
        description={state.description}
        videoSrc={state.videoSrc}
        onClose={closeGuide}
      />
    ) : null;

  return { openGuide, closeGuide, modal, isOpen: state.open };
}

/**
 * Компактная точка входа в видео/инструкцию фичи.
 * По умолчанию — маленькая иконка play, удобно ставить рядом с любым заголовком.
 */
export function FeatureVideoGuide({
  title,
  videoSrc,
  label = 'Как это работает',
  tooltip = 'Видеоинструкция',
  description,
  className = '',
  variant = 'icon',
  onClick,
}: FeatureVideoGuideProps) {
  const { openGuide, modal } = useFeatureVideoGuide();
  const canOpenBuiltIn = Boolean(title && videoSrc);

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    if (canOpenBuiltIn && title && videoSrc) {
      openGuide({ title, videoSrc, description });
    }
  };

  if (variant === 'pill') {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          aria-label={label}
          className={[
            'group inline-flex items-center gap-1.5 rounded-lg border border-[#E4D4FF] bg-[#F7F1FF] px-2 py-1 text-xs font-semibold text-[#6B21A8] transition-colors',
            'hover:border-[#9A41FE]/40 hover:bg-[#F0E6FF]',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9A41FE]/40',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-gray-400 text-black">
            <PlayGlyph className="ml-px h-2.5 w-2.5" />
          </span>
          <span>{label}</span>
        </button>
        {modal}
      </>
    );
  }

  return (
    <>
      <span className="tooltip">
        <button
          type="button"
          onClick={handleClick}
          aria-label={label}
          className={[
            'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-400 text-black',
            'transition-transform hover:scale-110 hover:bg-gray-500',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/40 focus-visible:ring-offset-1',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <PlayGlyph className="ml-px h-2.5 w-2.5" />
        </button>
        <span className="tooltip-text whitespace-nowrap">{tooltip}</span>
      </span>
      {modal}
    </>
  );
}
