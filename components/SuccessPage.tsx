import React, { useState, useEffect, useRef } from 'react';
import { 
    Plus, 
    Search, 
    Calendar, 
    Filter, 
    CheckCircle, 
    X, 
    ChevronDown, 
    HelpCircle, 
    ArrowUp,
    Zap,
    AlertTriangle,
    ThumbsUp,
    Loader,
    Info,
} from './Icons';
import { CampaignRecord } from '../types';

// --- Helpers ---
const getPlural = (number: number, one: string, two: string, five: string) => { let n = Math.abs(number); n %= 100; if (n >= 5 && n <= 20) { return five; } n %= 10; if (n === 1) { return one; } if (n >= 2 && n <= 4) { return two; } return five; };

// --- Sub-Components ---
const CompactLaunchLoader: React.FC<{ total: number }> = ({ total }) => (
    <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-100 flex items-center gap-4 animate-in fade-in duration-300">
        <Loader className="w-6 h-6 text-purple-600 animate-spin shrink-0" />
        <div>
            <h2 className="text-lg font-bold text-gray-900">
                Запускаем {total} {getPlural(total, 'кампанию', 'кампании', 'кампаний')}...
            </h2>
            <p className="text-gray-500 text-sm">Это может занять некоторое время. Процесс не прервётся, если вы уйдёте со страницы.</p>
        </div>
        <div className="ml-auto w-48 h-2 bg-gray-200 rounded-full overflow-hidden relative">
            <div className="absolute top-0 left-0 h-full bg-purple-500 animate-loader-progress"></div>
        </div>
        <style>{`
            @keyframes loader-progress {
                0% { transform: translateX(-100%) scaleX(0.5); }
                50% { transform: translateX(0) scaleX(1); }
                100% { transform: translateX(100%) scaleX(0.5); }
            }
            .animate-loader-progress {
                width: 100%;
                animation: loader-progress 1.8s ease-in-out infinite;
            }
        `}</style>
    </div>
);


const ToggleSwitch = ({ id, checked, onChange, disabled = false }: { id?: string; checked: boolean; onChange: (checked: boolean) => void, disabled?: boolean }) => ( <button id={id} role="switch" aria-checked={checked} onClick={() => !disabled && onChange(!checked)} disabled={disabled} className={`relative inline-flex h-4 w-7 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${ disabled ? 'cursor-not-allowed bg-gray-200' : 'cursor-pointer' } ${ checked ? (disabled ? 'bg-purple-300' : 'bg-purple-600') : 'bg-gray-300' }`} > <span aria-hidden="true" className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${ checked ? 'translate-x-3' : 'translate-x-0' }`} /> </button> );

const Pagination = ({ total, pageSize, current, onChange }: { total: number, pageSize: number, current: number, onChange: (page: number) => void }) => {
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

    return ( <div className="pagination-container"> <button onClick={handlePrev} className={`pagination-item ${current === 1 ? 'disabled' : ''}`} disabled={current === 1}>&lt;</button> {uniqueItems.map((item, index) => ( <button key={index} onClick={() => typeof item === 'number' && onChange(item)} className={`pagination-item ${current === item ? 'active' : ''} ${typeof item !== 'number' ? 'disabled' : ''}`} disabled={typeof item !== 'number'}> {item} </button> ))} <button onClick={handleNext} className={`pagination-item ${current === totalPages ? 'disabled' : ''}`} disabled={current === totalPages}>&gt;</button> </div> );
};

interface SuccessPageProps {
  isLaunching: boolean;
  launchTotal: number;
  launchResult: { success: number; error: number } | null;
  failedCampaigns: CampaignRecord[];
  onClearLaunchResult: () => void;
}

interface DisplayCampaign {
  id: string;
  image: string;
  name: string;
  status: 'active' | 'paused' | 'draft' | 'error';
  statusText: string;
  campaignId: number;
  tags: { text: string; icon: React.ReactNode; type: 'warning' | 'info' | 'error' }[];
  type: 'CPC' | 'CPM';
  typeDetails: string;
  typeIcons: React.ReactNode[];
  autoRefill: boolean;
  autoRefillStatus: 'ok' | 'error';
  budget: number | null;
  spend: number | null;
  impressions: number | null;
  ctr: number | null;
  orders: number | null;
  spendShare: number | null;
}

const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return 'Н/Д';
    return num.toLocaleString('ru-RU');
}
const formatCurrency = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return 'Н/Д';
    return `${num.toLocaleString('ru-RU')} ₽`;
}
const formatPercentage = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return 'Н/Д';
    return `${num.toFixed(1).replace('.', ',')}%`;
}

const currentDate = new Date().toLocaleDateString('ru-RU');

const MOCK_CAMPAIGNS: DisplayCampaign[] = [
    // Category 1: Платья (10 items)
    { id: '1', image: 'https://placehold.co/64x64/E9D5FF/4C1D95?text=W', name: `Летнее платье "Ривьера" CPC от ${currentDate}`, status: 'active', statusText: 'активна', campaignId: 1304655, tags: [{ text: 'Сезонный тренд', icon: <Zap className="w-3 h-3" />, type: 'info' }], type: 'CPC', typeDetails: '', typeIcons: [<Search className="w-4 h-4 text-gray-400" />], autoRefill: true, autoRefillStatus: 'ok', budget: 300000, spend: 100350, impressions: 324580, ctr: 1.2, orders: 89, spendShare: 15.8 },
    { id: '2', image: 'https://placehold.co/64x64/E9D5FF/4C1D95?text=W', name: `Вечернее платье "Грация" CPC от ${currentDate}`, status: 'active', statusText: 'активна', campaignId: 1304656, tags: [{ text: 'Заканчивается бюджет', icon: <AlertTriangle className="w-3 h-3 text-amber-600" />, type: 'warning' }], type: 'CPC', typeDetails: '', typeIcons: [<Search className="w-4 h-4 text-gray-400" />], autoRefill: true, autoRefillStatus: 'ok', budget: 300000, spend: 100350, impressions: 324580, ctr: 1.2, orders: 89, spendShare: 15.8 },
    { id: '3', image: 'https://placehold.co/64x64/E9D5FF/4C1D95?text=W', name: `Платье-футляр "Офис" CPM от ${currentDate}`, status: 'active', statusText: 'активна', campaignId: 1304657, tags: [], type: 'CPM', typeDetails: 'Единая', typeIcons: [<Search className="w-4 h-4 text-gray-400" />, <ThumbsUp className="w-4 h-4 text-gray-400" />], autoRefill: true, autoRefillStatus: 'ok', budget: 300000, spend: 100350, impressions: 324580, ctr: 1.2, orders: 89, spendShare: 15.8 },
    { id: '4', image: 'https://placehold.co/64x64/E9D5FF/4C1D95?text=W', name: `Сарафан "Прованс" CPM от ${currentDate}`, status: 'paused', statusText: 'приостановлена', campaignId: 1304658, tags: [], type: 'CPM', typeDetails: 'Ручная', typeIcons: [<ThumbsUp className="w-4 h-4 text-gray-400" />], autoRefill: true, autoRefillStatus: 'ok', budget: 300000, spend: null, impressions: null, ctr: null, orders: null, spendShare: null },
    { id: '5', image: 'https://placehold.co/64x64/E9D5FF/4C1D95?text=W', name: `Платье с принтом "Флора" CPM от ${currentDate}`, status: 'active', statusText: 'активна', campaignId: 1304659, tags: [], type: 'CPM', typeDetails: 'Ручная', typeIcons: [<Search className="w-4 h-4 text-gray-400" />], autoRefill: true, autoRefillStatus: 'ok', budget: 300000, spend: 80200, impressions: 250000, ctr: 1.1, orders: 75, spendShare: 14.1 },
    { id: '6', image: 'https://placehold.co/64x64/E9D5FF/4C1D95?text=W', name: `Коктейльное платье "Шарм" CPC от ${currentDate}`, status: 'draft', statusText: 'черновик', campaignId: 1304660, tags: [], type: 'CPC', typeDetails: '', typeIcons: [<Search className="w-4 h-4 text-gray-400" />], autoRefill: true, autoRefillStatus: 'ok', budget: 300000, spend: 0, impressions: 0, ctr: 0, orders: 0, spendShare: 0 },
    { id: '7', image: 'https://placehold.co/64x64/E9D5FF/4C1D95?text=W', name: `Длинное платье "Макси" CPM от ${currentDate}`, status: 'active', statusText: 'активна', campaignId: 1304661, tags: [], type: 'CPM', typeDetails: 'Единая', typeIcons: [<Search className="w-4 h-4 text-gray-400" />, <ThumbsUp className="w-4 h-4 text-gray-400" />], autoRefill: true, autoRefillStatus: 'ok', budget: 500000, spend: 250000, impressions: 600000, ctr: 1.5, orders: 120, spendShare: 18.2 },
    { id: '8', image: 'https://placehold.co/64x64/E9D5FF/4C1D95?text=W', name: `Платье-рубашка "Кэжуал" CPM от ${currentDate}`, status: 'active', statusText: 'активна', campaignId: 1304662, tags: [], type: 'CPM', typeDetails: 'Единая', typeIcons: [<Search className="w-4 h-4 text-gray-400" />, <ThumbsUp className="w-4 h-4 text-gray-400" />], autoRefill: true, autoRefillStatus: 'ok', budget: 150000, spend: 145000, impressions: 400000, ctr: 0.9, orders: 50, spendShare: 11.0 },
    { id: '9', image: 'https://placehold.co/64x64/E9D5FF/4C1D95?text=W', name: `Пляжное платье "Бриз" CPC от ${currentDate}`, status: 'paused', statusText: 'приостановлена', campaignId: 1304663, tags: [], type: 'CPC', typeDetails: '', typeIcons: [<Search className="w-4 h-4 text-gray-400" />], autoRefill: false, autoRefillStatus: 'error', budget: 100000, spend: 98000, impressions: 150000, ctr: 2.0, orders: 100, spendShare: 25.0 },
    { id: '10', image: 'https://placehold.co/64x64/E9D5FF/4C1D95?text=W', name: `Трикотажное платье "Уют" CPM от ${currentDate}`, status: 'active', statusText: 'активна', campaignId: 1304664, tags: [], type: 'CPM', typeDetails: 'Ручная', typeIcons: [<ThumbsUp className="w-4 h-4 text-gray-400" />], autoRefill: true, autoRefillStatus: 'ok', budget: 200000, spend: 50000, impressions: 180000, ctr: 1.0, orders: 60, spendShare: 12.5 },
    { id: '11', image: 'https://placehold.co/64x64/BFDBFE/1E3A8A?text=W', name: `Джинсы "Classic Fit" CPM от ${currentDate}`, status: 'active', statusText: 'активна', campaignId: 1304665, tags: [], type: 'CPM', typeDetails: 'Единая', typeIcons: [<Search className="w-4 h-4 text-gray-400" />, <ThumbsUp className="w-4 h-4 text-gray-400" />], autoRefill: true, autoRefillStatus: 'ok', budget: 250000, spend: 120000, impressions: 450000, ctr: 1.3, orders: 95, spendShare: 16.0 },
    { id: '12', image: 'https://placehold.co/64x64/BFDBFE/1E3A8A?text=W', name: `Брюки-карго "Комбат" CPC от ${currentDate}`, status: 'draft', statusText: 'черновик', campaignId: 1304666, tags: [], type: 'CPC', typeDetails: '', typeIcons: [<Search className="w-4 h-4 text-gray-400" />], autoRefill: true, autoRefillStatus: 'ok', budget: 180000, spend: 0, impressions: 0, ctr: 0, orders: 0, spendShare: 0 },
    { id: '13', image: 'https://placehold.co/64x64/BFDBFE/1E3A8A?text=W', name: `Классические брюки "Офис" CPM от ${currentDate}`, status: 'active', statusText: 'активна', campaignId: 1304667, tags: [], type: 'CPM', typeDetails: 'Единая', typeIcons: [<Search className="w-4 h-4 text-gray-400" />, <ThumbsUp className="w-4 h-4 text-gray-400" />], autoRefill: true, autoRefillStatus: 'ok', budget: 400000, spend: 390000, impressions: 800000, ctr: 1.1, orders: 150, spendShare: 19.5 },
    { id: '14', image: 'https://placehold.co/64x64/BFDBFE/1E3A8A?text=W', name: `Спортивные брюки "Тренд" CPC от ${currentDate}`, status: 'paused', statusText: 'приостановлена', campaignId: 1304668, tags: [], type: 'CPC', typeDetails: '', typeIcons: [<Search className="w-4 h-4 text-gray-400" />], autoRefill: true, autoRefillStatus: 'ok', budget: 220000, spend: 215000, impressions: 300000, ctr: 1.8, orders: 110, spendShare: 22.0 },
    { id: '15', image: 'https://placehold.co/64x64/BFDBFE/1E3A8A?text=W', name: `Льняные брюки "Лето" CPM от ${currentDate}`, status: 'active', statusText: 'активна', campaignId: 1304669, tags: [{ text: 'Сезонный тренд', icon: <Zap className="w-3 h-3" />, type: 'info' }], type: 'CPM', typeDetails: 'Ручная', typeIcons: [<ThumbsUp className="w-4 h-4 text-gray-400" />], autoRefill: true, autoRefillStatus: 'ok', budget: 120000, spend: 30000, impressions: 100000, ctr: 0.8, orders: 40, spendShare: 10.0 },
    { id: '16', image: 'https://placehold.co/64x64/FED7AA/9A3412?text=W', name: `Сумка-шоппер "Эко" CPM от ${currentDate}`, status: 'error', statusText: 'приостановлена', campaignId: 1304670, tags: [{ text: 'Нарушение +1', icon: <AlertTriangle className="w-3 h-3 text-red-600" />, type: 'error' }], type: 'CPM', typeDetails: 'Ручная', typeIcons: [<Search className="w-4 h-4 text-gray-400" />], autoRefill: false, autoRefillStatus: 'error', budget: 0, spend: null, impressions: null, ctr: null, orders: null, spendShare: null },
    { id: '17', image: 'https://placehold.co/64x64/FED7AA/9A3412?text=W', name: `Кожаный ремень "Классика" CPC от ${currentDate}`, status: 'active', statusText: 'активна', campaignId: 1304671, tags: [], type: 'CPC', typeDetails: '', typeIcons: [<Search className="w-4 h-4 text-gray-400" />], autoRefill: true, autoRefillStatus: 'ok', budget: 90000, spend: 85000, impressions: 120000, ctr: 2.2, orders: 130, spendShare: 28.0 },
    { id: '18', image: 'https://placehold.co/64x64/FED7AA/9A3412?text=W', name: `Шелковый платок "Париж" CPM от ${currentDate}`, status: 'active', statusText: 'активна', campaignId: 1304672, tags: [], type: 'CPM', typeDetails: 'Единая', typeIcons: [<Search className="w-4 h-4 text-gray-400" />, <ThumbsUp className="w-4 h-4 text-gray-400" />], autoRefill: true, autoRefillStatus: 'ok', budget: 75000, spend: 15000, impressions: 90000, ctr: 1.0, orders: 45, spendShare: 11.5 },
    { id: '19', image: 'https://placehold.co/64x64/FED7AA/9A3412?text=W', name: `Солнцезащитные очки "Авиатор" CPC от ${currentDate}`, status: 'draft', statusText: 'черновик', campaignId: 1304673, tags: [], type: 'CPC', typeDetails: '', typeIcons: [<Search className="w-4 h-4 text-gray-400" />], autoRefill: true, autoRefillStatus: 'ok', budget: 150000, spend: 0, impressions: 0, ctr: 0, orders: 0, spendShare: 0 },
    { id: '20', image: 'https://placehold.co/64x64/FED7AA/9A3412?text=W', name: `Наручные часы "Статус" CPM от ${currentDate}`, status: 'active', statusText: 'активна', campaignId: 1304674, tags: [{ text: 'Заканчивается бюджет', icon: <AlertTriangle className="w-3 h-3 text-amber-600" />, type: 'warning' }], type: 'CPM', typeDetails: 'Единая', typeIcons: [<Search className="w-4 h-4 text-gray-400" />, <ThumbsUp className="w-4 h-4 text-gray-400" />], autoRefill: false, autoRefillStatus: 'error', budget: 500000, spend: 495000, impressions: 1000000, ctr: 1.6, orders: 200, spendShare: 20.5 },
];

const StatusBadge = ({ status, text }: { status: DisplayCampaign['status'], text: string }) => {
    const baseClasses = 'px-2 py-0.5 text-xs font-medium rounded-full';
    const styles = {
        active: 'bg-green-100 text-green-700',
        paused: 'bg-yellow-100 text-yellow-700',
        draft: 'bg-gray-200 text-gray-600',
        error: 'bg-red-100 text-red-700',
    };
    return <span className={`${baseClasses} ${styles[status]}`}>{text}</span>;
}

const ResultBlock = ({ successCount, errorCount, onClear }: { successCount: number, errorCount: number, failedCampaigns: CampaignRecord[], onClear: () => void }) => {
    return (
        <div className="bg-white rounded-xl p-5 mb-6 shadow-sm border border-gray-100 relative animate-in fade-in duration-300">
            <button onClick={onClear} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5" />
            </button>
            <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 text-green-500 mt-1 shrink-0" />
                <div>
                    <h2 className="text-xl font-bold text-gray-900">
                        Создано {successCount} {getPlural(successCount, 'кампания', 'кампании', 'кампаний')}
                    </h2>
                    {errorCount > 0 ? (
                        <p className="text-gray-600 mt-1 text-sm">
                            {errorCount} {getPlural(errorCount, 'кампания не была запущена', 'кампании не были запущены', 'кампаний не были запущены')} из-за нехватки средств и {getPlural(errorCount, 'находится', 'находятся', 'находятся')} в статусе «Готово к запуску».{' '}
                            <a href="#" onClick={(e) => e.preventDefault()} className="text-purple-600 font-medium ml-1 hover:underline">показать в списке</a>
                        </p>
                    ) : (
                        <p className="text-gray-600 mt-1 text-sm">Все кампании были успешно запущены.</p>
                    )}
                </div>
            </div>
        </div>
    )
};

const DateFilter = ({ defaultLabel }: { defaultLabel: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [label, setLabel] = useState(defaultLabel);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const setPreset = (preset: 'today' | 'yesterday') => {
    const today = new Date();
    if (preset === 'today') {
        const dateStr = today.toISOString().split('T')[0];
        setStartDate(dateStr);
        setEndDate(dateStr);
        setLabel('Сегодня');
    } else {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toISOString().split('T')[0];
        setStartDate(dateStr);
        setEndDate(dateStr);
        setLabel('Вчера');
    }
    setIsOpen(false);
  };

  const applyCustomRange = () => {
    if (startDate && endDate) {
        const start = new Date(startDate).toLocaleDateString('ru-RU');
        const end = new Date(endDate).toLocaleDateString('ru-RU');
        setLabel(`${start} - ${end}`);
        setIsOpen(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
        <Calendar className="w-5 h-5 text-gray-500" />
        <span>{label}</span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border z-20 p-4 animate-in fade-in zoom-in-95 duration-100">
          <div className="space-y-2">
             <button onClick={() => setPreset('today')} className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 rounded-md transition-colors">Сегодня</button>
             <button onClick={() => setPreset('yesterday')} className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 rounded-md transition-colors">Вчера</button>
          </div>
          <div className="border-t my-3"></div>
          <p className="text-sm font-medium mb-2">Выбрать период</p>
          <div className="space-y-2">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border-gray-300 rounded-md text-sm p-2 focus:ring-purple-500 focus:border-purple-500"/>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border-gray-300 rounded-md text-sm p-2 focus:ring-purple-500 focus:border-purple-500"/>
          </div>
          <button onClick={applyCustomRange} className="w-full mt-3 bg-purple-600 text-white font-semibold py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors">Применить</button>
        </div>
      )}
    </div>
  );
}


export const SuccessPage: React.FC<SuccessPageProps> = ({ isLaunching, launchTotal, launchResult, failedCampaigns, onClearLaunchResult }) => {
  const [campaigns, setCampaigns] = useState<DisplayCampaign[]>(MOCK_CAMPAIGNS);
  const [currentPage, setCurrentPage] = useState(1);
  const CAMPAIGNS_PAGE_SIZE = 10;

  const paginatedCampaigns = campaigns.slice(
    (currentPage - 1) * CAMPAIGNS_PAGE_SIZE,
    currentPage * CAMPAIGNS_PAGE_SIZE
  );

  const handleStatusToggle = (campaignId: string, isChecked: boolean) => {
    setCampaigns(prevCampaigns =>
        prevCampaigns.map(campaign => {
            if (campaign.id === campaignId) {
                const newStatus = isChecked ? 'active' : 'paused';
                return {
                    ...campaign,
                    status: newStatus,
                    statusText: newStatus === 'active' ? 'активна' : 'приостановлена',
                };
            }
            return campaign;
        })
    );
  };

  return (
    <div className="animate-in fade-in duration-300">
      {isLaunching && <CompactLaunchLoader total={launchTotal} />}
      {!isLaunching && launchResult && (
          <ResultBlock
              successCount={launchResult.success}
              errorCount={launchResult.error}
              failedCampaigns={failedCampaigns}
              onClear={onClearLaunchResult}
          />
      )}
      
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-6">
        <button className="flex items-center gap-2 bg-purple-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-purple-700 transition-colors">
          <Plus className="w-5 h-5" />
          <span>Кампания</span>
        </button>
        <button className="bg-gray-700 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors">
          Массовое создание
        </button>
        <div className="relative flex-grow ml-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Поиск по ID кампании или названию"
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
          />
        </div>
        <DateFilter defaultLabel="Период статистики" />
        <DateFilter defaultLabel="Дата создания" />
        <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
          <Filter className="w-5 h-5 text-gray-500" />
          <span>Фильтр</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                    <tr>
                        <th className="p-4 w-12"><input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" /></th>
                        <th className="p-4 w-10"></th>
                        <th className="p-4 text-left font-medium min-w-[300px]">
                            <div className="flex items-center gap-1">
                                Товар/Кампания <ArrowUp className="w-4 h-4" />
                            </div>
                        </th>
                        <th className="p-4 text-left font-medium"><div className="flex items-center gap-1">Тип кампании <HelpCircle className="w-4 h-4" /></div></th>
                        <th className="p-4 text-left font-medium"><div className="flex items-center gap-1">Остаток бюджета <HelpCircle className="w-4 h-4" /></div></th>
                        <th className="p-4 text-left font-medium"><div className="flex items-center gap-1">Затраты <HelpCircle className="w-4 h-4" /></div></th>
                        <th className="p-4 text-left font-medium"><div className="flex items-center gap-1">Показы <HelpCircle className="w-4 h-4" /></div></th>
                        <th className="p-4 text-left font-medium"><div className="flex items-center gap-1">CTR <HelpCircle className="w-4 h-4" /></div></th>
                        <th className="p-4 text-left font-medium"><div className="flex items-center gap-1">Заказы <HelpCircle className="w-4 h-4" /></div></th>
                        <th className="p-4 text-left font-medium"><div className="flex items-center gap-1">Доля затрат <HelpCircle className="w-4 h-4" /></div></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {paginatedCampaigns.map(c => (
                        <tr key={c.id} className="hover:bg-gray-50">
                            <td className="p-4"><input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" /></td>
                            <td className="p-4">
                              <ToggleSwitch
                                  checked={c.status === 'active'}
                                  onChange={(isChecked) => handleStatusToggle(c.id, isChecked)}
                                  disabled={c.status === 'draft' || c.status === 'error'}
                              />
                            </td>
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                    <img src={c.image} alt={c.name} className="w-10 h-10 rounded-md shrink-0"/>
                                    <div>
                                        <p className="font-medium text-gray-800 truncate" title={c.name}>{c.name}</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 flex-wrap">
                                            <StatusBadge status={c.status} text={c.statusText} />
                                            <span>ID {c.campaignId}</span>
                                            {c.tags.map(tag => (
                                                <div key={tag.text} className={`flex items-center gap-1 ${tag.type === 'warning' ? 'text-amber-700' : tag.type === 'error' ? 'text-red-700' : ''}`}>
                                                    {tag.icon} {tag.text}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="p-4">
                                <div className="font-semibold">{c.type}</div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                                    {c.typeDetails && <span>{c.typeDetails}</span>}
                                    {c.typeIcons.map((icon, i) => <span key={i} className="p-1 bg-gray-100 rounded">{icon}</span>)}
                                </div>
                            </td>
                            <td className="p-4">
                                <div className="font-semibold">{formatCurrency(c.budget)}</div>
                                <div className={`flex items-center gap-1 text-xs mt-1 ${c.autoRefillStatus === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
                                    {c.autoRefillStatus === 'ok' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                                    Автопополнение
                                </div>
                            </td>
                            <td className="p-4">{formatCurrency(c.spend)}</td>
                            <td className="p-4">{formatNumber(c.impressions)}</td>
                            <td className="p-4">{formatPercentage(c.ctr)}</td>
                            <td className="p-4">{formatNumber(c.orders)}</td>
                            <td className="p-4">{formatPercentage(c.spendShare)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <Pagination
            total={campaigns.length}
            pageSize={CAMPAIGNS_PAGE_SIZE}
            current={currentPage}
            onChange={setCurrentPage}
        />
      </div>
    </div>
  );
};