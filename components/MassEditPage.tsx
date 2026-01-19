import React, { useState, useMemo } from 'react';
import { MOCK_CHANGES, CampaignChange } from './ReviewEditsModal';
import { Edit2, Trash2, Bell, HelpCircle, Wallet, ChevronDown } from './Icons';

const PAGE_SIZE = 50;
const UNIFIED_BALANCE = 105350;

const Header = ({ onNavigateToList }: { onNavigateToList: () => void }) => (
  <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
    <div className="flex items-center justify-between px-6 h-14 bg-white">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-gray-400">WB</span>
          <span className="text-xl text-gray-300">|</span>
          <span className="text-lg font-medium text-gray-800">Продвижение</span>
        </div>
        <button className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors">
          Продвижение
        </button>
        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600 font-medium">
          <a href="#" className="hover:text-purple-600">Медиа</a>
          <a href="#" className="hover:text-purple-600">Наружная реклама</a>
          <a href="#" className="hover:text-purple-600">Мой магазин</a>
          <a href="#" className="hover:text-purple-600">Внешний трафик</a>
        </nav>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative">
          <Bell className="w-6 h-6 text-gray-600" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">99+</span>
        </div>
        <HelpCircle className="w-6 h-6 text-gray-600" />
        <div className="flex items-center gap-2 text-gray-700 font-medium cursor-pointer">
          <span>МЕГАПОЛИС...</span>
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
    </div>
    <div className="px-6 h-12 flex items-center justify-between border-t border-gray-100 bg-white">
      <div className="flex items-center gap-8 text-sm font-medium">
        <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToList(); }} className="text-gray-500 hover:text-gray-900 py-3 border-b-2 border-transparent">Кампании</a>
        <a href="#" className="text-gray-500 hover:text-gray-900 py-3 border-b-2 border-transparent">Статистика</a>
        <a href="#" className="text-gray-500 hover:text-gray-900 py-3 border-b-2 border-transparent">Финансы</a>
        <a href="#" className="flex items-center gap-1 text-gray-500 hover:text-gray-900 py-3 border-b-2 border-transparent">
          Новости <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">99+</span>
        </a>
        <a href="#" className="text-gray-500 hover:text-gray-900 py-3 border-b-2 border-transparent">Помощь</a>
        <a href="#" className="text-gray-500 hover:text-gray-900 py-3 border-b-2 border-transparent">Мои бонусы</a>
      </div>
      <div className="flex items-center gap-2 text-gray-800 font-semibold">
        <Wallet className="w-5 h-5 text-gray-400" />
        <span>{UNIFIED_BALANCE.toLocaleString('ru-RU')} ₽</span>
      </div>
    </div>
  </header>
);

const formatForDisplay = (num: number | string | undefined | null): string => {
  if (num === null || num === undefined || num === '') return '';
  const numValue = typeof num === 'string' ? parseDisplayValue(num) : num;
  return numValue.toLocaleString('ru-RU', { useGrouping: true });
};

const parseDisplayValue = (str: string): number => {
  return Number(String(str).replace(/\s/g, '').replace(/,/g, '.'));
};

const ToggleSwitch = ({ checked, onChange, disabled = false }: { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) => (
  <button 
    role="switch" 
    aria-checked={checked} 
    onClick={() => !disabled && onChange(!checked)} 
    disabled={disabled} 
    className={`relative inline-flex h-4 w-7 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${ 
      disabled ? 'cursor-not-allowed bg-gray-200' : 'cursor-pointer' 
    } ${ 
      checked ? (disabled ? 'bg-purple-300' : 'bg-purple-600') : 'bg-gray-300' 
    }`}
  >
    <span 
      aria-hidden="true" 
      className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${ 
        checked ? 'translate-x-3' : 'translate-x-0' 
      }`} 
    />
  </button>
);

const BidInput = ({ value, onChange, presets = [150, 200, 250] }: { value: number; onChange: (value: number) => void; presets?: number[] }) => {
  const [inputValue, setInputValue] = useState(String(value || ''));

  React.useEffect(() => {
    setInputValue(String(value || ''));
  }, [value]);

  const handleBlur = () => {
    let numericValue = parseDisplayValue(inputValue);
    if (isNaN(numericValue) || numericValue < 300) {
      numericValue = 300;
    }
    onChange(numericValue);
    setInputValue(String(numericValue));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handlePresetClick = (p: number) => {
    setInputValue(String(p));
    onChange(p);
  };

  return (
    <div className="w-full border border-gray-300 rounded-lg shadow-sm overflow-hidden">
      <div className="relative bg-white">
        <input
          type="text"
          value={inputValue}
          placeholder="Ставка"
          onChange={handleChange}
          onBlur={handleBlur}
          className="w-full text-sm text-left font-medium bg-transparent outline-none px-2 py-1.5 hide-arrows"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">₽</span>
      </div>
      <div className="flex w-full h-2 border-t border-gray-200">
        {presets.map((p, index) => (
          <button
            key={p}
            onClick={() => handlePresetClick(p)}
            title={`Установить ставку ${p} ₽`}
            className={`flex-1 h-full transition-colors relative ${
              Number(value) === p ? 'bg-green-300' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {index > 0 && <div className="absolute left-0 top-0 bottom-0 w-px bg-white"></div>}
          </button>
        ))}
      </div>
    </div>
  );
};

const Pagination = ({ total, pageSize, current, onChange }: { total: number; pageSize: number; current: number; onChange: (page: number) => void }) => {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  const handlePrev = () => { if (current > 1) onChange(current - 1); };
  const handleNext = () => { if (current < totalPages) onChange(current + 1); };

  let items = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) items.push(i);
  } else {
    items.push(1);
    if (current > 3) items.push('...');
    if (current > 2) items.push(current - 1);
    if (current > 1 && current < totalPages) items.push(current);
    if (current < totalPages - 1) items.push(current + 1);
    if (current < totalPages - 2) items.push('...');
    items.push(totalPages);
  }
  const uniqueItems = [...new Set(items)];

  return (
    <div className="pagination-container">
      <button onClick={handlePrev} className={`pagination-item ${current === 1 ? 'disabled' : ''}`} disabled={current === 1}>&lt;</button>
      {uniqueItems.map((item, index) => (
        <button 
          key={index} 
          onClick={() => typeof item === 'number' && onChange(item)} 
          className={`pagination-item ${current === item ? 'active' : ''} ${typeof item !== 'number' ? 'disabled' : ''}`} 
          disabled={typeof item !== 'number'}
        >
          {item}
        </button>
      ))}
      <button onClick={handleNext} className={`pagination-item ${current === totalPages ? 'disabled' : ''}`} disabled={current === totalPages}>&gt;</button>
    </div>
  );
};

const StatusIndicator = ({ isActive }: { isActive: boolean }) => (
  <div className="flex items-center gap-2">
    <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
    <span>{isActive ? 'Активна' : 'Не активна'}</span>
  </div>
);

const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode }> = ({ isActive, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
      isActive
        ? 'text-purple-600 border-purple-600'
        : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
    }`}
  >
    {children}
  </button>
);

const formatBool = (val: boolean) => val ? 'Вкл' : 'Выкл';
const formatCurrency = (val: number | null) => val !== null ? `${val.toLocaleString('ru-RU')} ₽` : '-';
const formatBidChasing = (chasing: { strategy: string; maxBid: number } | null) => {
  if (!chasing) return '-';
  return (
    <div>
      <p>Стратегия: <span className="font-semibold">{chasing.strategy}</span></p>
      <p>Не выше: <span className="font-semibold">{formatCurrency(chasing.maxBid)}</span></p>
    </div>
  );
};

interface MassEditPageProps {
  onNavigateToList: () => void;
}

export const MassEditPage: React.FC<MassEditPageProps> = ({ onNavigateToList }) => {
  const [campaigns, setCampaigns] = useState<CampaignChange[]>(MOCK_CHANGES);
  // default: view mode (like in "массовое создание")
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'base' | 'bids' | 'clusters'>('base');

  const editableInputClass = "w-full text-sm bg-white border shadow-sm outline-none transition-colors focus:border-purple-500 focus:ring-1 focus:ring-purple-500 px-2 py-1.5 rounded-lg";

  const handleUpdateCampaign = (campaignId: number, updates: Partial<CampaignChange>) => {
    setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, ...updates } : c));
  };

  const handleUpdateClusterBid = (campaignId: number, productId: number, clusterName: string, newBid: number | null) => {
    setCampaigns(prev => prev.map(campaign => {
      if (campaign.id !== campaignId) return campaign;
      return {
        ...campaign,
        products: campaign.products.map(product => {
          if (product.id !== productId) return product;
          return {
            ...product,
            clusters: product.clusters.map(cluster => 
              cluster.name === clusterName ? { ...cluster, newBid } : cluster
            )
          };
        })
      };
    }));
  };

  const handleUpdateProductBid = (campaignId: number, productId: number, newBid: number | null) => {
    setCampaigns(prev => prev.map(campaign => {
      if (campaign.id !== campaignId) return campaign;
      return {
        ...campaign,
        products: campaign.products.map(product => {
          if (product.id !== productId) return product;
          // Update all clusters with the same bid (unified bid per product)
          return {
            ...product,
            clusters: product.clusters.map(cluster => ({ ...cluster, newBid }))
          };
        })
      };
    }));
  };

  const handleSelectCampaign = (campaignId: number) => {
    setSelectedCampaignIds(prev => 
      prev.includes(campaignId) 
        ? prev.filter(id => id !== campaignId)
        : [...prev, campaignId]
    );
  };

  // Base settings table rows
  const baseTableRows = useMemo(() => {
    const rows: Array<{ campaign: CampaignChange; product: typeof MOCK_CHANGES[0]['products'][0]; rowKey: string }> = [];
    campaigns.forEach(campaign => {
      campaign.products.forEach(product => {
        rows.push({ campaign, product, rowKey: `${campaign.id}-${product.id}` });
      });
    });
    return rows;
  }, [campaigns]);

  // Bids table rows (one row per product with single bid)
  const bidsTableRows = useMemo(() => {
    const rows: Array<{ campaign: CampaignChange; product: typeof MOCK_CHANGES[0]['products'][0]; rowKey: string }> = [];
    campaigns.forEach(campaign => {
      campaign.products.forEach(product => {
        rows.push({ campaign, product, rowKey: `${campaign.id}-${product.id}` });
      });
    });
    return rows;
  }, [campaigns]);

  // Clusters table rows (one row per cluster)
  const clustersTableRows = useMemo(() => {
    const rows: Array<{ campaign: CampaignChange; product: typeof MOCK_CHANGES[0]['products'][0]; cluster: typeof MOCK_CHANGES[0]['products'][0]['clusters'][0]; rowKey: string }> = [];
    campaigns.forEach(campaign => {
      campaign.products.forEach(product => {
        product.clusters.forEach(cluster => {
          rows.push({ campaign, product, cluster, rowKey: `${campaign.id}-${product.id}-${cluster.name}` });
        });
      });
    });
    return rows;
  }, [campaigns]);

  const totalRows = useMemo(() => {
    if (activeTab === 'base') return baseTableRows.length;
    if (activeTab === 'bids') return bidsTableRows.length;
    return clustersTableRows.length;
  }, [activeTab, baseTableRows, bidsTableRows, clustersTableRows]);

  const paginatedRows = useMemo(() => {
    if (activeTab === 'base') {
      return baseTableRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    } else if (activeTab === 'bids') {
      return bidsTableRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    } else {
      return clustersTableRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    }
  }, [activeTab, currentPage, baseTableRows, bidsTableRows, clustersTableRows]);

  const paginatedCampaignIds = useMemo(() => {
    if (activeTab === 'base') {
      const currentRows = baseTableRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
      return new Set(currentRows.map((r: any) => r.campaign.id));
    } else if (activeTab === 'bids') {
      const currentRows = bidsTableRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
      return new Set(currentRows.map((r: any) => r.campaign.id));
    } else {
      const currentRows = clustersTableRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
      return new Set(currentRows.map((r: any) => r.campaign.id));
    }
  }, [activeTab, currentPage, baseTableRows, bidsTableRows, clustersTableRows]);

  const allOnPageSelected = paginatedCampaignIds.size > 0 && Array.from(paginatedCampaignIds).every(id => selectedCampaignIds.includes(id));
  const isIndeterminate = !allOnPageSelected && Array.from(paginatedCampaignIds).some(id => selectedCampaignIds.includes(id));

  const handleSelectAllOnPage = (checked: boolean) => {
    if (checked) {
      setSelectedCampaignIds(prev => [...new Set([...prev, ...Array.from(paginatedCampaignIds)])]);
    } else {
      setSelectedCampaignIds(prev => prev.filter(id => !paginatedCampaignIds.has(id)));
    }
  };

  const totals = useMemo(() => {
    const selectedCampaigns = campaigns.filter(c => selectedCampaignIds.includes(c.id));
    return selectedCampaigns.reduce((acc, c) => {
      acc.total += c.replenishmentAmount || 0;
      return acc;
    }, { total: 0 });
  }, [campaigns, selectedCampaignIds]);

  return (
    <div className="min-h-screen bg-[#F6F69] font-sans text-gray-900 pb-40 relative">
      <Header onNavigateToList={onNavigateToList} />
      
      <main className="max-w-[1392px] mx-auto px-6 py-8">

        <div className="bg-white rounded-2xl shadow-sm px-6 pb-6 pt-0 space-y-4">
          {/* Tabs */}
          <div className="border-b border-gray-200 -mx-6 px-6 pt-4">
            <div className="flex items-center gap-4">
              <TabButton isActive={activeTab === 'base'} onClick={() => { setActiveTab('base'); setCurrentPage(1); }}>Базовые настройки</TabButton>
              <TabButton isActive={activeTab === 'bids'} onClick={() => { setActiveTab('bids'); setCurrentPage(1); }}>Ставки</TabButton>
              <TabButton isActive={activeTab === 'clusters'} onClick={() => { setActiveTab('clusters'); setCurrentPage(1); }}>Кластера</TabButton>
            </div>
          </div>

          <div className="sticky top-[104px] z-30 bg-white py-3 border-b border-gray-100 mb-0 flex justify-between items-center -mx-6 px-6 rounded-t-2xl shadow-sm h-[57px]">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-gray-900">Кампании</h2>
              <span className="text-gray-400 text-sm font-medium">{totalRows} {totalRows === 1 ? 'запись' : totalRows < 5 ? 'записи' : 'записей'}</span>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-xs font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Отмена</button>
                  <button 
                    onClick={() => {
                      // Save changes logic here
                      setIsEditing(false);
                    }} 
                    className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm"
                  >
                    Сохранить
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-800 text-xs"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Редактировать</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg">
            {activeTab === 'base' && (() => {
              const campaignIndexMap = new Map<number, number>();
              let campaignCounter = 0;
              campaigns.forEach(c => {
                if (!campaignIndexMap.has(c.id)) {
                  campaignIndexMap.set(c.id, campaignCounter++);
                }
              });
              const currentPaginatedRows = baseTableRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

              return (
                <table className="w-full text-xs text-left table-fixed">
                  <thead className="text-gray-600">
                    <tr>
                      <th className="table-header-cell px-2 py-1.5 font-normal w-[4%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <input 
                          type="checkbox" 
                          checked={allOnPageSelected} 
                          ref={el => { if (el) el.indeterminate = isIndeterminate; }} 
                          onChange={(e) => handleSelectAllOnPage(e.target.checked)} 
                          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" 
                        />
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal w-[4%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>№</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal w-[18%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>Название</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal w-[12%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>ID Кампании</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal w-[12%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>ID Товара</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal w-[12%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>Статус</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal w-[12%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>Бюджет</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal w-[12%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>Статус АП</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal w-[12%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>Условия АП</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal w-[12%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>Зоны показа</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal text-left w-[4%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentPaginatedRows.map(({ campaign, product, rowKey }) => {
                      const isFirstProduct = campaign.products[0].id === product.id;
                      const isSelected = selectedCampaignIds.includes(campaign.id);
                      const campaignIndex = campaignIndexMap.get(campaign.id) ?? 0;

                      return (
                        <tr key={rowKey} className={`transition-colors ${isSelected ? 'bg-purple-50' : 'hover:bg-gray-50'}`}>
                          <td className="px-2 py-1.5 align-top">
                            <input 
                              type="checkbox" 
                              checked={isSelected} 
                              onChange={() => handleSelectCampaign(campaign.id)} 
                              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                          </td>
                          {isFirstProduct && (
                            <td rowSpan={campaign.products.length} className="px-2 py-1.5 align-top text-center text-gray-500">
                              {campaignIndex + 1}
                            </td>
                          )}
                          {isFirstProduct && (
                            <>
                              <td rowSpan={campaign.products.length} className="px-2 py-1.5 align-top font-medium text-gray-800">
                                {isEditing ? (
                                  <textarea 
                                    value={campaign.name} 
                                    onChange={(e) => handleUpdateCampaign(campaign.id, { name: e.target.value })} 
                                    rows={2} 
                                    className={`${editableInputClass} resize-y min-h-[34px] border-gray-300`} 
                                  />
                                ) : (
                                  <div className="tooltip w-full">
                                    <textarea value={campaign.name} readOnly rows={2} className="w-full bg-transparent p-0 resize-none outline-none cursor-not-allowed" />
                                    <span className="tooltip-text">Нажмите «Редактировать», чтобы изменить</span>
                                  </div>
                                )}
                              </td>
                              <td rowSpan={campaign.products.length} className="px-2 py-1.5 align-top text-gray-500">
                                {campaign.id}
                              </td>
                            </>
                          )}
                          <td className="px-2 py-1.5 align-top text-gray-500">{product.id}</td>
                          {isFirstProduct && (
                            <>
                              <td rowSpan={campaign.products.length} className="px-2 py-1.5 align-top">
                                <StatusIndicator isActive={campaign.newIsActive} />
                              </td>
                              <td rowSpan={campaign.products.length} className="px-2 py-1.5 align-top text-gray-800">
                                {isEditing ? (
                                  <div className="relative">
                                    <input
                                      type="text"
                                      defaultValue={formatForDisplay(campaign.replenishmentAmount)}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val !== '') {
                                          const parsed = parseDisplayValue(val);
                                          if (!isNaN(parsed)) {
                                            handleUpdateCampaign(campaign.id, { replenishmentAmount: parsed });
                                          }
                                        }
                                      }}
                                      onBlur={() => {
                                        if ((campaign.replenishmentAmount || 0) < 1000) {
                                          handleUpdateCampaign(campaign.id, { replenishmentAmount: 1000 });
                                        }
                                      }}
                                      className={`${editableInputClass} pr-6 border-gray-300`}
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">₽</span>
                                  </div>
                                ) : (
                                  <div className="tooltip">
                                    <span className="font-medium">{formatForDisplay(campaign.replenishmentAmount)} ₽</span>
                                    <span className="tooltip-text">Нажмите «Редактировать», чтобы изменить</span>
                                  </div>
                                )}
                              </td>
                              <td rowSpan={campaign.products.length} className="px-2 py-1.5 align-top text-center">
                                {isEditing ? (
                                  <ToggleSwitch 
                                    checked={campaign.newAutoRefill} 
                                    onChange={(checked) => handleUpdateCampaign(campaign.id, { newAutoRefill: checked })} 
                                  />
                                ) : (
                                  <span>{formatBool(campaign.newAutoRefill)}</span>
                                )}
                              </td>
                              <td rowSpan={campaign.products.length} className="px-2 py-1.5 align-top text-gray-500">
                                {campaign.autoRefillConditions || '-'}
                              </td>
                              <td rowSpan={campaign.products.length} className="px-2 py-1.5 align-top text-gray-500">
                                {campaign.newZones}
                              </td>
                            </>
                          )}
                          <td className="px-2 py-1.5 text-left align-top">
                            <div className="tooltip">
                              <button className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-100 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <span className="tooltip-text">Удалить</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            })()}

            {activeTab === 'bids' && (() => {
              const campaignIndexMap = new Map<number, number>();
              let campaignCounter = 0;
              campaigns.forEach(c => {
                if (!campaignIndexMap.has(c.id)) {
                  campaignIndexMap.set(c.id, campaignCounter++);
                }
              });
              const currentPaginatedRows = bidsTableRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
              let rowIndex = 0;

              return (
                <table className="w-full text-xs text-left table-fixed">
                  <thead className="text-gray-600">
                    <tr>
                      <th className="table-header-cell px-2 py-1.5 font-normal w-[4%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <input 
                          type="checkbox" 
                          checked={allOnPageSelected} 
                          ref={el => { if (el) el.indeterminate = isIndeterminate; }} 
                          onChange={(e) => handleSelectAllOnPage(e.target.checked)} 
                          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" 
                        />
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal w-[4%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>№</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal w-[18%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>Название</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal w-[12%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>ID Кампании</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal w-[12%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>Товары</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal w-[18%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>Ставка</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal w-[30%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>Преследование ставки</span></div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentPaginatedRows.map(({ campaign, product, rowKey }: any) => {
                      const isSelected = selectedCampaignIds.includes(campaign.id);
                      const campaignIndex = campaignIndexMap.get(campaign.id) ?? 0;
                      // Get unified bid for product (use first cluster's bid as unified bid)
                      const unifiedBid = product.clusters.length > 0 ? product.clusters[0].newBid : null;
                      const unifiedOldBid = product.clusters.length > 0 ? product.clusters[0].oldBid : null;
                      const isChanged = unifiedOldBid !== unifiedBid;
                      rowIndex++;

                      return (
                        <tr key={rowKey} className={`transition-colors ${isSelected ? 'bg-purple-50' : 'hover:bg-gray-50'}`}>
                          <td className="px-2 py-1.5 align-top">
                            <input 
                              type="checkbox" 
                              checked={isSelected} 
                              onChange={() => handleSelectCampaign(campaign.id)} 
                              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                          </td>
                          <td className="px-2 py-1.5 align-top text-center text-gray-500">{rowIndex + (currentPage - 1) * PAGE_SIZE}</td>
                          <td className="px-2 py-1.5 align-top font-medium text-gray-800">
                            {isEditing ? (
                              <textarea 
                                value={campaign.name} 
                                onChange={(e) => handleUpdateCampaign(campaign.id, { name: e.target.value })} 
                                rows={2} 
                                className={`${editableInputClass} resize-y min-h-[34px] border-gray-300`} 
                              />
                            ) : (
                              <div className="tooltip w-full">
                                <textarea value={campaign.name} readOnly rows={2} className="w-full bg-transparent p-0 resize-none outline-none cursor-not-allowed" />
                                <span className="tooltip-text">Нажмите «Редактировать», чтобы изменить</span>
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-1.5 align-top text-gray-500">{campaign.id}</td>
                          <td className="px-2 py-1.5 align-top text-gray-500">{product.id}</td>
                          <td className={`px-2 py-1.5 align-top ${isChanged ? 'bg-purple-50' : ''}`}>
                            {isEditing ? (
                              <BidInput 
                                value={unifiedBid || 0} 
                                onChange={(val) => handleUpdateProductBid(campaign.id, product.id, val)} 
                              />
                            ) : (
                              <span className={`font-medium ${isChanged ? 'text-purple-800' : 'text-gray-600'}`}>{formatCurrency(unifiedBid)}</span>
                            )}
                          </td>
                          <td className="px-2 py-1.5 align-top">
                            {formatBidChasing(campaign.newBidChasing)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            })()}

            {activeTab === 'clusters' && (() => {
              const campaignIndexMap = new Map<number, number>();
              let campaignCounter = 0;
              campaigns.forEach(c => {
                if (!campaignIndexMap.has(c.id)) {
                  campaignIndexMap.set(c.id, campaignCounter++);
                }
              });
              const currentPaginatedRows = clustersTableRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
              const campaignClusterCounts = new Map<number, number>();
              campaigns.forEach(c => {
                campaignClusterCounts.set(c.id, c.products.reduce((sum, p) => sum + p.clusters.length, 0));
              });
              const productClusterCounts = new Map<string, number>();
              campaigns.forEach(c => {
                c.products.forEach(p => {
                  productClusterCounts.set(`${c.id}-${p.id}`, p.clusters.length);
                });
              });

              return (
                <table className="w-full text-xs text-left table-fixed">
                  <thead className="text-gray-600">
                    <tr>
                      <th className="table-header-cell px-2 py-1.5 font-normal w-[4%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <input 
                          type="checkbox" 
                          checked={allOnPageSelected} 
                          ref={el => { if (el) el.indeterminate = isIndeterminate; }} 
                          onChange={(e) => handleSelectAllOnPage(e.target.checked)} 
                          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" 
                        />
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal w-[4%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>№</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal w-[18%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>Название</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal w-[12%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>ID Кампании</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal w-[12%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>ID Товара</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal w-[30%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>Кластер</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal w-[20%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>Ставка</span></div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentPaginatedRows.map(({ campaign, product, cluster, rowKey }: any, index: number) => {
                      const isSelected = selectedCampaignIds.includes(campaign.id);
                      const campaignIndex = campaignIndexMap.get(campaign.id) ?? 0;
                      const isFirstClusterOfCampaign = index === 0 || currentPaginatedRows[index - 1]?.campaign?.id !== campaign.id;
                      const isFirstClusterOfProduct = index === 0 || 
                        (currentPaginatedRows[index - 1]?.product?.id !== product.id || 
                        currentPaginatedRows[index - 1]?.campaign?.id !== campaign.id);
                      const totalClustersForCampaign = campaignClusterCounts.get(campaign.id) || 0;
                      const totalClustersForProduct = productClusterCounts.get(`${campaign.id}-${product.id}`) || 0;
                      const isChanged = cluster.oldBid !== cluster.newBid;

                      // Count how many clusters of this campaign are on current page
                      const clustersOnPageForCampaign = currentPaginatedRows.filter((r: any) => r.campaign.id === campaign.id).length;
                      const clustersOnPageForProduct = currentPaginatedRows.filter((r: any) => r.campaign.id === campaign.id && r.product.id === product.id).length;

                      return (
                        <tr key={rowKey} className={`transition-colors ${isSelected ? 'bg-purple-50' : 'hover:bg-gray-50'}`}>
                          <td className="px-2 py-1.5 align-top">
                            <input 
                              type="checkbox" 
                              checked={isSelected} 
                              onChange={() => handleSelectCampaign(campaign.id)} 
                              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                          </td>
                          {isFirstClusterOfCampaign && (
                            <td rowSpan={clustersOnPageForCampaign} className="px-2 py-1.5 align-top text-center text-gray-500">
                              {campaignIndex + 1}
                            </td>
                          )}
                          {isFirstClusterOfCampaign && (
                            <>
                              <td rowSpan={clustersOnPageForCampaign} className="px-2 py-1.5 align-top font-medium text-gray-800">
                                {isEditing ? (
                                  <textarea 
                                    value={campaign.name} 
                                    onChange={(e) => handleUpdateCampaign(campaign.id, { name: e.target.value })} 
                                    rows={2} 
                                    className={`${editableInputClass} resize-y min-h-[34px] border-gray-300`} 
                                  />
                                ) : (
                                  <div className="tooltip w-full">
                                    <textarea value={campaign.name} readOnly rows={2} className="w-full bg-transparent p-0 resize-none outline-none cursor-not-allowed" />
                                    <span className="tooltip-text">Нажмите «Редактировать», чтобы изменить</span>
                                  </div>
                                )}
                              </td>
                              <td rowSpan={clustersOnPageForCampaign} className="px-2 py-1.5 align-top text-gray-500">
                                {campaign.id}
                              </td>
                            </>
                          )}
                          {isFirstClusterOfProduct && (
                            <td rowSpan={clustersOnPageForProduct} className="px-2 py-1.5 align-top text-gray-500">
                              {product.id}
                            </td>
                          )}
                          <td className="px-2 py-1.5 align-top text-gray-700">{cluster.name}</td>
                          <td className={`px-2 py-1.5 align-top font-medium ${isChanged ? 'bg-purple-50 text-purple-800' : 'text-gray-800'}`}>
                            {isEditing ? (
                              <BidInput 
                                value={cluster.newBid || 0} 
                                onChange={(val) => handleUpdateClusterBid(campaign.id, product.id, cluster.name, val)} 
                              />
                            ) : (
                              <span>{formatCurrency(cluster.newBid)}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            })()}
            </div>

          <Pagination 
            total={totalRows} 
            pageSize={PAGE_SIZE} 
            current={currentPage} 
            onChange={setCurrentPage} 
          />
        </div>
      </main>

      {/* Footer with apply button */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-sm border-t border-gray-200">
        <div className="max-w-[1392px] mx-auto px-6 py-4 flex justify-end items-center">
          <button
            onClick={() => {
              // Apply changes logic here
              setIsEditing(false);
            }}
            className="px-6 py-2.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg"
          >
            Применить изменения
          </button>
        </div>
      </footer>
    </div>
  );
};
