import React from 'react';
import { useNavigate } from 'react-router-dom';

const MediaCampaignCreatePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <main className="mx-auto flex w-full min-h-[calc(100vh-3.5rem)] max-w-[1920px] flex-col items-center justify-center bg-[#F3F5F8] px-7 py-16">
      <div className="w-full max-w-lg rounded-2xl bg-white px-8 py-10 text-center shadow-[0_1px_3px_rgba(16,24,40,0.06)] ring-1 ring-black/[0.04]">
        <p className="text-sm font-medium uppercase tracking-wide text-[#9a41fe]">Медиа</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900">
          Создание кампании
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-500">
          Страница в разработке. Здесь появится создание медиакампании.
        </p>
        <button
          type="button"
          onClick={() => navigate('/media')}
          className="mt-8 inline-flex h-11 items-center justify-center rounded-[10px] bg-[#9a41fe] px-5 text-sm font-medium text-white transition-colors hover:bg-[#8840e5]"
        >
          Вернуться к медиа
        </button>
      </div>
    </main>
  );
};

export default MediaCampaignCreatePage;
