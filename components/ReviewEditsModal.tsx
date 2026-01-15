import React from 'react';
import { X } from './Icons';

// --- NEW DATA STRUCTURE ---

interface Cluster {
  name: string;
  oldBid: number | null;
  newBid: number | null;
}

interface Product {
  id: number;
  clusters: Cluster[];
}

interface CampaignChange {
  id: number;
  name: string;
  products: Product[];
  replenishmentAmount: number | null;
  oldAutoRefill: boolean;
  newAutoRefill: boolean;
  oldZones: string;
  newZones: string;
}

// --- MOCK DATA GENERATION ---

const CLUSTER_NAMES = [
  "женская одежда", "платья", "летнее платье", "купить платье", "сарафан",
  "платье на выпускной", "вечернее платье", "одежда для женщин", "модное платье", "длинное платье"
];

const MOCK_CHANGES: CampaignChange[] = [];

for (let i = 0; i < 15; i++) { // Generate 15 campaigns
    const campaignId = 1304655 + i;
    const numProducts = (i % 3) + 1; // 1 to 3 products
    const products: Product[] = [];

    for (let j = 0; j < numProducts; j++) {
        const productId = 87654321 + i * 10 + j;
        const numClusters = (i + j) % 5 + 2; // 2 to 6 clusters
        const clusters: Cluster[] = [];
        
        const usedClusterNames = new Set<string>();

        for (let k = 0; k < numClusters; k++) {
            let clusterName: string;
            do {
                clusterName = CLUSTER_NAMES[Math.floor(Math.random() * CLUSTER_NAMES.length)];
            } while (usedClusterNames.has(clusterName));
            usedClusterNames.add(clusterName);

            const oldBid = 100 + (Math.floor(Math.random() * 20)) * 5;
            const shouldChange = Math.random() > 0.7;
            clusters.push({
                name: clusterName,
                oldBid: oldBid,
                newBid: shouldChange ? oldBid + (Math.floor(Math.random() * 10) - 4) * 5 : oldBid,
            });
        }

        products.push({ id: productId, clusters });
    }

    const changeType = i % 4;
    let campaignChange: Partial<CampaignChange> = {};
    if (changeType === 1) campaignChange.replenishmentAmount = 250000;
    if (changeType === 2) {
      campaignChange.oldAutoRefill = true;
      campaignChange.newAutoRefill = false;
    }
    if (changeType === 3) {
      campaignChange.oldZones = 'Поиск';
      campaignChange.newZones = 'Поиск, Рекомендации';
    }

    MOCK_CHANGES.push({
        id: campaignId,
        name: `Кампания #${campaignId}`,
        products,
        replenishmentAmount: 200000,
        oldAutoRefill: true,
        newAutoRefill: true,
        oldZones: 'Единая',
        newZones: 'Единая',
        ...campaignChange,
    });
}


export const ReviewEditsModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null;

  const formatBool = (val: boolean) => val ? 'Вкл' : 'Выкл';
  const formatCurrency = (val: number | null) => val !== null ? `${val.toLocaleString('ru-RU')} ₽` : '-';

  return (
    <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-7xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Проверка изменений</h2>
            <p className="text-sm text-gray-500 mt-1">Проверьте данные перед применением. Изменения выделены фиолетовым.</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100"><X className="w-6 h-6" /></button>
        </div>

        <div className="px-6 py-6 flex-grow overflow-hidden">
          <div className="overflow-auto border border-gray-200 rounded-lg h-full custom-scrollbar">
            <table className="min-w-full text-sm table-fixed">
              <thead className="bg-gray-50/70 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="p-3 font-semibold text-center text-gray-600 w-12 border-r">№</th>
                  <th scope="col" className="p-3 font-semibold text-left text-gray-600 w-48 border-r border-gray-200">Название</th>
                  <th scope="col" className="p-3 font-semibold text-left text-gray-600 w-32">ID Кампании</th>
                  <th scope="col" className="p-3 font-semibold text-left text-gray-600 w-32">ID Товара</th>
                  <th scope="col" className="p-3 font-semibold text-left text-gray-600 w-48">Сумма пополнения</th>
                  <th scope="col" colSpan={2} className="p-3 font-semibold text-center text-gray-600 border-l border-gray-200 w-96">Ставки по кластерам</th>
                  <th scope="col" colSpan={2} className="p-3 font-semibold text-center text-gray-600 border-l border-gray-200 w-48">Автопополнение</th>
                  <th scope="col" colSpan={2} className="p-3 font-semibold text-center text-gray-600 border-l border-gray-200 w-80">Зоны показа</th>
                </tr>
                <tr className="bg-gray-100 border-t border-gray-200">
                  <th className="p-2 font-normal text-left text-gray-500 border-r"></th>
                  <th className="p-2 font-normal text-left text-gray-500 border-r border-gray-200"></th>
                  <th className="p-2 font-normal text-left text-gray-500"></th>
                  <th className="p-2 font-normal text-left text-gray-500"></th>
                  <th className="p-2 font-normal text-left text-gray-500"></th>
                  <th className="p-2 font-normal text-center text-gray-500 border-l border-gray-200">Старая ставка</th>
                  <th className="p-2 font-normal text-center text-gray-500 border-l border-gray-100">Новая ставка</th>
                  <th className="p-2 font-normal text-center text-gray-500 border-l border-gray-200">Старый</th>
                  <th className="p-2 font-normal text-center text-gray-500 border-l border-gray-100">Новый</th>
                  <th className="p-2 font-normal text-center text-gray-500 border-l border-gray-200">Старый</th>
                  <th className="p-2 font-normal text-center text-gray-500 border-l border-gray-100">Новый</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {MOCK_CHANGES.flatMap((campaign, campaignIndex) => {
                  const totalRowsForCampaign = campaign.products.length;
                  return campaign.products.map((product, productIndex) => (
                    <tr key={`${campaign.id}-${product.id}`} className="border-b border-gray-200 last:border-b-0">
                      {productIndex === 0 && (
                        <td rowSpan={totalRowsForCampaign} className="px-3 py-2 align-top text-center whitespace-nowrap text-gray-500 border-r border-gray-200">
                          {campaignIndex + 1}
                        </td>
                      )}
                      {productIndex === 0 && (
                        <>
                          <td rowSpan={totalRowsForCampaign} className="px-3 py-2 align-top whitespace-nowrap font-medium text-gray-800 border-r border-gray-200">{campaign.name}</td>
                          <td rowSpan={totalRowsForCampaign} className="px-3 py-2 align-top whitespace-nowrap text-gray-500 border-r border-gray-200">{campaign.id}</td>
                        </>
                      )}
                      <td className="px-3 py-2 align-top whitespace-nowrap text-gray-500 border-r border-gray-200">{product.id}</td>
                      {productIndex === 0 && (
                        <td rowSpan={totalRowsForCampaign} className="px-3 py-2 align-top whitespace-nowrap text-gray-600 border-r border-gray-200">
                            {formatCurrency(campaign.replenishmentAmount)}
                        </td>
                      )}
                      
                      {/* Cluster Bids */}
                      <td className="px-3 py-2 align-top border-r border-gray-100">
                          <div className="flex flex-col gap-1">
                              {product.clusters.map(cluster => (
                                  <div key={cluster.name} className="flex justify-between items-center text-xs">
                                      <span className="text-gray-500 truncate pr-2">{cluster.name}:</span>
                                      <span className="text-gray-600 font-medium whitespace-nowrap">{formatCurrency(cluster.oldBid)}</span>
                                  </div>
                              ))}
                          </div>
                      </td>
                      <td className="px-3 py-2 align-top border-r border-gray-200">
                          <div className="flex flex-col gap-1">
                              {product.clusters.map(cluster => {
                                  const isChanged = cluster.oldBid !== cluster.newBid;
                                  return (
                                      <div key={cluster.name} className={`flex justify-between items-center p-0.5 rounded text-xs ${isChanged ? 'bg-purple-50' : ''}`}>
                                          <span className={`truncate pr-2 ${isChanged ? 'font-medium text-purple-800' : 'text-gray-500'}`}>{cluster.name}:</span>
                                          <span className={`font-medium whitespace-nowrap ${isChanged ? 'text-purple-800' : 'text-gray-600'}`}>{formatCurrency(cluster.newBid)}</span>
                                      </div>
                                  );
                              })}
                          </div>
                      </td>

                      {productIndex === 0 && (
                        <>
                          {/* Autorefill */}
                          <td rowSpan={totalRowsForCampaign} className="px-3 py-2 align-top text-center whitespace-nowrap text-gray-500 border-r border-gray-100">{formatBool(campaign.oldAutoRefill)}</td>
                          <td rowSpan={totalRowsForCampaign} className={`px-3 py-2 align-top text-center whitespace-nowrap border-r border-gray-200 ${campaign.oldAutoRefill !== campaign.newAutoRefill ? 'bg-purple-50 font-medium text-purple-800' : ''}`}>{formatBool(campaign.newAutoRefill)}</td>
                          
                          {/* Zones */}
                          <td rowSpan={totalRowsForCampaign} className="px-3 py-2 align-top whitespace-nowrap text-gray-500 border-r border-gray-100">{campaign.oldZones}</td>
                          <td rowSpan={totalRowsForCampaign} className={`px-3 py-2 align-top whitespace-nowrap ${campaign.oldZones !== campaign.newZones ? 'bg-purple-50 font-medium text-purple-800' : ''}`}>{campaign.newZones}</td>
                        </>
                      )}
                    </tr>
                  ))
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="flex justify-end items-center gap-4 p-6 bg-gray-50/70 border-t border-gray-200 rounded-b-2xl">
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">вернуться к шагам</button>
        </div>
      </div>
    </div>
  );
};
