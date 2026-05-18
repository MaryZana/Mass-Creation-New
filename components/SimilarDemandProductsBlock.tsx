import React from 'react';

export type SimilarDemandProduct = {
  id: string;
  title: string;
  imageUrl: string;
};

const DEFAULT_PRODUCTS: SimilarDemandProduct[] = [
  {
    id: 'similar-1',
    title: 'Футболка хлопок мягкая приятная',
    imageUrl:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=160&h=200&fit=crop&q=80',
  },
  {
    id: 'similar-2',
    title: 'Рюкзак городской',
    imageUrl:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=160&h=200&fit=crop&q=80',
  },
  {
    id: 'similar-3',
    title: 'Наушники беспроводные',
    imageUrl:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=160&h=200&fit=crop&q=80',
  },
];

export function SimilarDemandProductsBlock({
  products = DEFAULT_PRODUCTS,
  onAddToLaunch,
}: {
  products?: SimilarDemandProduct[];
  onAddToLaunch?: (product: SimilarDemandProduct) => void;
}) {
  return (
    <section className="mt-8 mb-8 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="text-base font-bold leading-snug text-gray-900">
        Нашли товары с похожим спросом и остатками. Их можно запустить с такими же настройками
      </h2>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex flex-col rounded-lg border border-gray-100 bg-white p-3"
          >
            <div className="flex gap-3">
              <img
                src={product.imageUrl}
                alt=""
                className="h-14 w-10 shrink-0 rounded-lg object-cover bg-gray-100"
              />
              <div className="min-w-0 flex-1 flex items-center">
                <p className="line-clamp-2 text-sm font-medium text-gray-900">{product.title}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onAddToLaunch?.(product)}
              className="mt-3 w-full rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-200"
            >
              Добавить в запуск
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
