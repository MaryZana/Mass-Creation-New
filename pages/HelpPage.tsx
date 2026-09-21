import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { ChevronDown, Settings, FileIcon, Wallet, Briefcase, X } from '../components/Icons';

/** Локальный демо-ролик: природа / закат у моря (не цветок) */
const HELP_DEMO_VIDEO_SRC = '/videos/help-instruction-demo.mp4';

type HelpSidebarTab = 'knowledge' | 'videos' | 'agencies';
type KnowledgeIcon = 'gear' | 'doc' | 'wallet' | 'book';

type VideoInstruction = {
  id: string;
  title: string;
  duration: string;
  src: string;
};

const VIDEO_INSTRUCTIONS: VideoInstruction[] = [
  {
    id: 'v1',
    title: 'Как работает счёт и баланс продвижения',
    duration: '4:12',
    src: HELP_DEMO_VIDEO_SRC,
  },
  {
    id: 'v2',
    title: 'Как работает ранжирование. Почему ваша карточка внизу',
    duration: '6:38',
    src: HELP_DEMO_VIDEO_SRC,
  },
  {
    id: 'v3',
    title: 'Пополнение счёта и возврат средств',
    duration: '5:05',
    src: HELP_DEMO_VIDEO_SRC,
  },
  {
    id: 'v4',
    title: 'История изменения кампании',
    duration: '7:20',
    src: HELP_DEMO_VIDEO_SRC,
  },
];

const KNOWLEDGE_ARTICLES: { id: string; title: string; icon: KnowledgeIcon }[] = [
  { id: 'k1', title: 'Топ поисковых кластеров', icon: 'gear' },
  { id: 'k2', title: 'Продвижение видео в Wibes', icon: 'doc' },
  { id: 'k3', title: 'Дополнительные настройки кампаний', icon: 'gear' },
  { id: 'k4', title: 'Минимальные ставки в кампаниях', icon: 'wallet' },
  { id: 'k5', title: 'MediaKit', icon: 'doc' },
  { id: 'k6', title: 'Как оплатить продвижение', icon: 'wallet' },
  { id: 'k7', title: 'Частые вопросы', icon: 'book' },
  { id: 'k8', title: 'Быстрый старт', icon: 'doc' },
  { id: 'k9', title: 'WB Инфлюенс', icon: 'doc' },
  { id: 'k10', title: 'Как запустить продвижение', icon: 'gear' },
  { id: 'k11', title: 'Как работает зона показов «Поиск»', icon: 'doc' },
  { id: 'k12', title: 'Как оценить результаты продвижения', icon: 'wallet' },
];

function KnowledgeCornerIcon({ type }: { type: KnowledgeIcon }) {
  const iconClass = 'h-5 w-5 text-[#9A41FE]';
  let icon: React.ReactNode;
  switch (type) {
    case 'gear':
      icon = <Settings className={iconClass} aria-hidden />;
      break;
    case 'wallet':
      icon = <Wallet className={iconClass} aria-hidden />;
      break;
    case 'book':
      icon = <Briefcase className={iconClass} aria-hidden />;
      break;
    default:
      icon = <FileIcon className={iconClass} aria-hidden />;
  }

  return (
    <div className="pointer-events-none absolute bottom-0 right-0 h-14 w-14" aria-hidden>
      <svg
        className="absolute bottom-0 right-0 h-full w-full text-[#9A41FE]"
        viewBox="0 0 56 56"
        fill="none"
      >
        <path
          d="M56 56H20C8.954 56 0 47.046 0 36V56"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      <div className="absolute bottom-2 right-2 flex items-center justify-center">{icon}</div>
    </div>
  );
}

function KnowledgeArticleCard({ title, icon }: { title: string; icon: KnowledgeIcon }) {
  return (
    <button
      type="button"
      className="group relative flex min-h-[88px] w-full rounded-xl bg-[#F2F2F7] px-4 py-3.5 text-left transition-colors hover:bg-[#ECECF0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9A41FE]/40"
    >
      <span className="relative z-[1] pr-10 text-sm font-medium leading-snug text-gray-900">{title}</span>
      <KnowledgeCornerIcon type={icon} />
    </button>
  );
}

function VideoInstructionsBanner({
  previewSrc,
  onOpen,
}: {
  previewSrc: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative flex w-full items-center gap-4 overflow-hidden rounded-[24px] bg-gradient-to-r from-[#C4A6FF] via-[#B07CFF] to-[#9A41FE] p-3 text-left shadow-sm transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9A41FE]/40 focus-visible:ring-offset-2 hover:brightness-[1.03] active:scale-[0.995] sm:gap-5 sm:p-3.5"
      aria-label="Видеоинструкции. Открыть раздел"
    >
      <span
        className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full border-[10px] border-white/15"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute -bottom-16 right-16 h-28 w-28 rounded-full bg-white/10"
        aria-hidden
      />

      <span className="relative z-[1] h-[72px] w-[128px] shrink-0 overflow-hidden rounded-xl bg-black/20 ring-1 ring-white/25 sm:h-[80px] sm:w-[142px]">
        <video
          src={previewSrc}
          muted
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
          aria-hidden
        />
      </span>

      <span className="relative z-[1] flex min-w-0 flex-1 flex-col gap-1">
        <span className="inline-flex items-center gap-2 text-[22px] font-bold leading-none text-white">
          Видеоинструкции
          <ChevronDown
            className="h-5 w-5 -rotate-90 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
        <span className="text-sm leading-snug text-white/85">
          Инструкции как работать в кабинете продвижения
        </span>
      </span>

      <span
        className="relative z-[1] mr-1 hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-white/70 text-white sm:flex"
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5" fill="currentColor">
          <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l10.5-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14Z" />
        </svg>
      </span>
    </button>
  );
}

function HelpVideoModal({ video, onClose }: { video: VideoInstruction; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    void el.play().catch(() => {});
    return () => {
      el.pause();
      el.currentTime = 0;
    };
  }, [video.id]);

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-[880px] overflow-hidden rounded-2xl bg-gray-900 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-video-modal-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
          aria-label="Закрыть видео"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
        <div className="aspect-video w-full bg-black">
          <video
            ref={videoRef}
            key={video.id}
            src={video.src}
            controls
            playsInline
            className="h-full w-full"
          />
        </div>
        <div className="bg-white px-5 py-4 sm:px-6 sm:py-5">
          <h2 id="help-video-modal-title" className="pr-10 text-lg font-bold leading-snug text-gray-900">
            {video.title}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Видеоинструкция · {video.duration}
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}

const VIDEO_CARD_GRADIENTS = [
  'linear-gradient(135deg, #D4DCFF 0%, #6B8CFF 55%, #4A72F5 100%)',
  'linear-gradient(135deg, #D8D0FF 0%, #7B6BFF 50%, #5A4AE8 100%)',
  'linear-gradient(135deg, #CFE4FF 0%, #5B9DFF 55%, #3D7AE8 100%)',
  'linear-gradient(135deg, #E0D4FF 0%, #8B6BFF 50%, #6A52E8 100%)',
] as const;

function VideoInstructionCard({
  title,
  duration,
  src,
  gradientIndex,
  onPlay,
}: {
  title: string;
  duration: string;
  src: string;
  gradientIndex: number;
  onPlay: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  const showVideo = isHovered && videoReady;

  const handlePointerEnter = () => {
    setIsHovered(true);
    const el = videoRef.current;
    if (!el) return;
    if (el.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      el.load();
    }
    el.currentTime = 0;
    void el.play().catch(() => {});
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    const el = videoRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
  };

  const gradient = VIDEO_CARD_GRADIENTS[gradientIndex % VIDEO_CARD_GRADIENTS.length];

  return (
    <button
      type="button"
      onClick={onPlay}
      onMouseEnter={handlePointerEnter}
      onMouseLeave={handlePointerLeave}
      className="group flex h-full w-full flex-col text-left focus:outline-none"
      aria-label={`${title}, видеоинструкция ${duration}. Нажмите для просмотра`}
    >
      <span className="relative block aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-sm ring-1 ring-black/[0.06] transition-shadow group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-[#9A41FE]/50 group-focus-visible:ring-offset-2">
        <video
          ref={videoRef}
          src={src}
          muted
          loop
          playsInline
          preload="auto"
          onLoadedData={() => setVideoReady(true)}
          onCanPlay={() => setVideoReady(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
            showVideo ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden
        />

        <span
          className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
            showVideo ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ background: gradient }}
          aria-hidden
        />

        <span
          className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
            showVideo ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1a1a2e]/35 backdrop-blur-[2px] transition-transform duration-200 group-hover:scale-105 sm:h-12 sm:w-12">
            <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5 text-white" fill="currentColor" aria-hidden>
              <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l10.5-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14Z" />
            </svg>
          </span>
        </span>

        <span className="pointer-events-none absolute right-2.5 top-2.5 rounded-full bg-[#1a1a2e]/55 px-2 py-0.5 text-[11px] font-medium tabular-nums text-white backdrop-blur-[2px]">
          {duration}
        </span>
      </span>

      <span className="mt-2.5 block min-h-[2.5rem] text-sm font-semibold leading-snug text-gray-900 line-clamp-2 sm:min-h-[2.625rem] sm:text-[15px]">
        {title}
      </span>
    </button>
  );
}

const HelpPage: React.FC = () => {
  const { hash } = useLocation();
  const [sidebarTab, setSidebarTab] = useState<HelpSidebarTab>('knowledge');
  const [activeVideo, setActiveVideo] = useState<VideoInstruction | null>(null);

  useEffect(() => {
    if (hash !== '#help-video-heading') return;
    setSidebarTab('videos');
    const id = hash.slice(1);
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [hash]);

  const sidebarNavClass = (active: boolean) =>
    `flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
      active ? 'bg-[#F2F2F7] text-gray-900' : 'text-gray-800 hover:bg-gray-50'
    }`;

  return (
    <main className="mx-auto w-full max-w-[1920px] px-6 py-8">
      {activeVideo && (
        <HelpVideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />
      )}
      <section className="rounded-2xl bg-white px-6 py-8 shadow-sm ring-1 ring-black/[0.03] sm:px-8 sm:py-10">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
        <aside className="w-full shrink-0 lg:w-[240px] lg:pt-1">
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-gray-900">Помощь</h1>
          <nav className="mt-8 flex flex-col gap-1" aria-label="Разделы помощи">
            <button
              type="button"
              onClick={() => setSidebarTab('knowledge')}
              className={sidebarNavClass(sidebarTab === 'knowledge')}
              aria-current={sidebarTab === 'knowledge' ? 'page' : undefined}
            >
              База знаний
              {sidebarTab === 'knowledge' ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => setSidebarTab('videos')}
              className={sidebarNavClass(sidebarTab === 'videos')}
              aria-current={sidebarTab === 'videos' ? 'page' : undefined}
            >
              Видеоинструкции
              {sidebarTab === 'videos' ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => setSidebarTab('agencies')}
              className={sidebarNavClass(sidebarTab === 'agencies')}
              aria-current={sidebarTab === 'agencies' ? 'page' : undefined}
            >
              Сертифицированные рекламные агентства
            </button>
          </nav>
        </aside>

        <div className="min-w-0 flex-1 lg:pt-1">
          {sidebarTab === 'knowledge' ? (
            <>
              <VideoInstructionsBanner
                previewSrc={VIDEO_INSTRUCTIONS[0].src}
                onOpen={() => setSidebarTab('videos')}
              />

              <h2 className="mt-6 text-lg font-bold text-gray-900">База знаний</h2>

              <section className="mt-8">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {KNOWLEDGE_ARTICLES.map((article) => (
                    <KnowledgeArticleCard key={article.id} title={article.title} icon={article.icon} />
                  ))}
                </div>
              </section>
            </>
          ) : sidebarTab === 'videos' ? (
            <section aria-labelledby="help-video-heading">
              <h2 id="help-video-heading" className="text-lg font-bold text-gray-900">
                Видеоинструкции
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
                Короткие ролики про счёт, ранжирование, пополнение и историю кампании
              </p>
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {VIDEO_INSTRUCTIONS.map((video, index) => (
                  <VideoInstructionCard
                    key={video.id}
                    title={video.title}
                    duration={video.duration}
                    src={video.src}
                    gradientIndex={index}
                    onPlay={() => setActiveVideo(video)}
                  />
                ))}
              </div>
            </section>
          ) : (
            <section>
              <h2 className="text-lg font-bold text-gray-900">Сертифицированные рекламные агентства</h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-gray-600">
                Список партнёров, которые помогают настраивать и вести продвижение на маркетплейсе. Раздел в
                разработке — здесь появится каталог агентств и контакты.
              </p>
            </section>
          )}
        </div>
        </div>
      </section>
    </main>
  );
};

export default HelpPage;
