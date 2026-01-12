import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { CampaignConfig, PaymentModel, BidType, CampaignRecord, CampaignStatus } from './types';
import { 
  FileSpreadsheet, UploadCloud, Info, Download, Trash2, CheckCircle, Bell, HelpCircle, Wallet, ChevronDown, X, FileIcon, Loader, Edit2, Plus, RefreshCw, DollarSign, Briefcase, Zap, Search, Wand, Settings, SingleAccountIcon
} from './components/Icons';
import { getMockProductsForCategory } from './services/geminiService';
import { MultiSelect } from './components/MultiSelect';
import { ProductMultiSelect } from './components/ProductMultiSelect';
import { SuccessPage } from './components/SuccessPage';

// --- Types ---
interface TemplateGroup {
  id: string; // e.g., "CPC-Manual"
  config: Pick<CampaignConfig, 'paymentModel' | 'bidType'>;
  campaigns: CampaignRecord[];
  duplicateNmIds: Set<number>;
  correctedNmIds: Set<number>;
  currentPage: number;
  sourceFiles: Set<string>;
}

type SelectableProduct = Pick<CampaignRecord, 'nmId' | 'productName' | 'imageUrl' | 'category' | 'cpcCompatible'>;
type BulkActionType = 'bid' | 'budget' | 'funding' | 'autorefill' | 'delete' | 'autobidder' | null;

// --- Constants ---
const CATEGORIES = ['Брюки', 'Платья', 'Футболки', 'Аксессуары', 'Обувь', 'Электроника', 'Дом', 'Кольца', 'Фоторамки', 'Спортивная одежда', 'Косметика', 'Игрушки'];
const ACCOUNT_BALANCES = { 'Баланс': 150000, 'Счет': 30000 };
const PAGE_SIZE = 50;

// --- Helpers ---
export const getPlural = (number: number, one: string, two: string, five: string) => { let n = Math.abs(number); n %= 100; if (n >= 5 && n <= 20) { return five; } n %= 10; if (n === 1) { return one; } if (n >= 2 && n <= 4) { return two; } return five; };

// --- Sub-Components ---

const Header = () => ( <header className="bg-white border-b border-gray-200 sticky top-0 z-50"> <div className="flex items-center justify-between px-6 h-14 bg-white"> <div className="flex items-center gap-8"> <div className="flex items-center gap-2"> <span className="text-2xl font-bold text-gray-400">WB</span> <span className="text-xl text-gray-300">|</span> <span className="text-lg font-medium text-gray-800">Продвижение</span> </div> <button className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"> Продвижение </button> <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600 font-medium"> <a href="#" className="hover:text-purple-600">Медиа</a> <a href="#" className="hover:text-purple-600">Наружная реклама</a> <a href="#" className="hover:text-purple-600">Мой магазин</a> <a href="#" className="hover:text-purple-600">Внешний трафик</a> </nav> </div> <div className="flex items-center gap-6"> <div className="relative"> <Bell className="w-6 h-6 text-gray-600" /> <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">99+</span> </div> <HelpCircle className="w-6 h-6 text-gray-600" /> <div className="flex items-center gap-2 text-gray-700 font-medium cursor-pointer"> <span>МЕГАПОЛИС...</span> <ChevronDown className="w-4 h-4" /> </div> </div> </div> <div className="px-6 h-12 flex items-center justify-between border-t border-gray-100 bg-white"> <div className="flex items-center gap-8 text-sm font-medium"> <a href="#" className="text-gray-500 hover:text-gray-900 py-3 border-b-2 border-transparent">Кампании</a> <a href="#" className="text-gray-500 hover:text-gray-900 py-3 border-b-2 border-transparent">Статистика</a> <a href="#" className="text-gray-500 hover:text-gray-900 py-3 border-b-2 border-transparent">Финансы</a> <a href="#" className="flex items-center gap-1 text-gray-500 hover:text-gray-900 py-3 border-b-2 border-transparent"> Новости <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">99+</span> </a> <a href="#" className="text-gray-500 hover:text-gray-900 py-3 border-b-2 border-transparent">Помощь</a> <a href="#" className="text-gray-500 hover:text-gray-900 py-3 border-b-2 border-transparent">Мои бонусы</a> </div> <div className="flex items-center gap-2 text-gray-800 font-semibold"> <Wallet className="w-5 h-5 text-gray-400" /> <span>10 433 793 ₽</span> </div> </div> </header> );

const Toast = ({ show, message, onClose }: { show: boolean, message: string, onClose: () => void }) => { useEffect(() => { if (show) { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); } }, [show, onClose]); if (!show) return null; return ( <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-xl z-[100] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300"> <CheckCircle className="w-5 h-5 text-green-400" /> <span className="font-medium">{message}</span> </div> ); };

const UndoToast: React.FC<{
  campaign: CampaignRecord | null;
  onUndo: () => void;
}> = ({ campaign, onUndo }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (campaign) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [campaign]);

  if (!isVisible || !campaign) {
    return null;
  }

  return (
    <div
      key={campaign.id} // Use key to force re-mount and reset animation
      className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-lg shadow-xl z-[100] flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <Trash2 className="w-5 h-5 text-gray-400 shrink-0" />
      <div className="flex-grow relative overflow-hidden">
        <p className="font-medium">Кампания "{campaign.productName}" удалена.</p>
        <div className="absolute bottom-[-8px] left-0 right-0 h-1 bg-gray-700">
            <div className="h-1 bg-purple-500 animate-shrink-width"></div>
        </div>
      </div>
      <button onClick={onUndo} className="font-bold text-purple-400 hover:text-purple-300 ml-4 shrink-0">
        Отменить
      </button>
      <style>{`
        @keyframes shrink-width {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-shrink-width {
          animation: shrink-width 5s linear forwards;
        }
      `}</style>
    </div>
  );
};

const ToggleSwitch = ({ id, checked, onChange, disabled = false }: { id?: string; checked: boolean; onChange: (checked: boolean) => void, disabled?: boolean }) => ( <button id={id} role="switch" aria-checked={checked} onClick={() => !disabled && onChange(!checked)} disabled={disabled} className={`relative inline-flex h-4 w-7 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${ disabled ? 'cursor-not-allowed bg-gray-200' : 'cursor-pointer' } ${ checked ? (disabled ? 'bg-purple-300' : 'bg-purple-600') : 'bg-gray-300' }`} > <span aria-hidden="true" className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${ checked ? 'translate-x-3' : 'translate-x-0' }`} /> </button> );

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = 'Удалить',
  confirmColor = 'red',
  secondaryConfirmText,
  onSecondaryConfirm,
  cancelText = "Отмена"
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  confirmColor?: 'red' | 'purple';
  secondaryConfirmText?: string;
  onSecondaryConfirm?: () => void;
  cancelText?: string;
}) => {
    if (!isOpen) return null;

    const colorClasses = {
        red: 'bg-red-600 hover:bg-red-700',
        purple: 'bg-purple-600 hover:bg-purple-700',
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg text-gray-900">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100"><X className="w-5 h-5" /></button>
                </div>
                <div className="text-sm text-gray-600 mb-6">
                    {children}
                </div>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                        {cancelText}
                    </button>
                     {onSecondaryConfirm && secondaryConfirmText && (
                        <button onClick={onSecondaryConfirm} className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors ${colorClasses.purple}`}>
                           {secondaryConfirmText}
                        </button>
                    )}
                    <button onClick={onConfirm} className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors ${colorClasses[confirmColor]}`}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AddItemModal = ({ isOpen, onClose, onSubmit, onTemplateDownload, initialConfig, showToast, setToastMessage }: { isOpen: boolean, onClose: () => void, onSubmit: (config: Pick<CampaignConfig, 'paymentModel' | 'bidType'>, items: CampaignRecord[]) => void, onTemplateDownload: (config: CampaignConfig) => void, initialConfig: CampaignConfig, showToast: (show: boolean) => void, setToastMessage: (message: string) => void }) => {
    const [tempConfig, setTempConfig] = useState(initialConfig);
    const [selectedProducts, setSelectedProducts] = useState<SelectableProduct[]>([]);
    const excelFileInputRef = useRef<HTMLInputElement>(null);
    const [uploadInfo, setUploadInfo] = useState<{ loaded: number, total: number, fileName: string } | null>(null);
    const [isProcessingExcel, setIsProcessingExcel] = useState(false);
    const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);
    
    useEffect(() => {
        if (isOpen) {
            setTempConfig(initialConfig);
            setSelectedProducts([]);
            setUploadInfo(null);
            setIsProcessingExcel(false);
        }
    }, [isOpen, initialConfig]);

    const mockProducts = useMemo(() => {
        if (tempConfig.categories.length === 0) {
            return getMockProductsForCategory('Все товары');
        }
        return tempConfig.categories.flatMap(category => getMockProductsForCategory(category));
    }, [tempConfig.categories]);

    const validSelectedProducts = useMemo(() => {
        return selectedProducts.filter(p => tempConfig.paymentModel === PaymentModel.CPC ? p.cpcCompatible : true);
    }, [selectedProducts, tempConfig.paymentModel]);

    const cpcIncompatibleInSelection = useMemo(() => {
        if (tempConfig.paymentModel !== PaymentModel.CPC) return [];
        return selectedProducts.filter(p => !p.cpcCompatible);
    }, [selectedProducts, tempConfig.paymentModel]);

    const handleDownloadTemplateFile = (fileType: 'xlsx' | 'csv') => {
        const content = "nmId\n12345678\n87654321\n11223344";
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `upload_template.${fileType}`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        setToastMessage(`Шаблон ${fileType.toUpperCase()} скачан`);
        showToast(true);
    };

    const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;
        
        const file = event.target.files[0];
        setUploadInfo(null);
        setSelectedProducts([]);
        setIsProcessingExcel(true);
        setTempConfig(p => ({ ...p, categories: ['Одежда'] }));

        // Simulate file processing
        setTimeout(() => {
            const totalInFile = Math.floor(Math.random() * 10) + 20; // e.g., 20-29
            const foundCount = Math.floor(totalInFile * (Math.random() * 0.2 + 0.8)); // 80-99% found
            
            const allPossibleProducts = getMockProductsForCategory('Одежда');
            const foundProducts = allPossibleProducts.slice(0, foundCount);

            setSelectedProducts(foundProducts);
            setUploadInfo({ loaded: foundCount, total: totalInFile, fileName: file.name });
            setIsProcessingExcel(false);
        }, 2500);

        if (excelFileInputRef.current) {
            excelFileInputRef.current.value = "";
        }
    };

    const handleDeleteUpload = () => {
        setUploadInfo(null);
        setSelectedProducts([]);
        setTempConfig(p => ({ ...p, categories: [] }));
        setToastMessage("Загруженный файл удален.");
        showToast(true);
    };
    
    const handleSubmit = () => {
        const currentDate = new Date().toLocaleDateString('ru-RU');
        const finalCampaigns = validSelectedProducts.map(p => {
            const campaignBase: Omit<CampaignRecord, 'bid' | 'searchBid' | 'recommendationsBid'> = {
                id: `${p.nmId}-${Date.now()}`,
                nmId: p.nmId,
                productName: p.productName,
                campaignName: `${p.productName} ${tempConfig.paymentModel} ${currentDate}`,
                imageUrl: p.imageUrl,
                category: p.category,
                budget: 5000,
                autoReplenishment: true,
                fundingSource: 'Баланс',
                status: CampaignStatus.VALID,
                usePromoBonuses: true,
                source: uploadInfo ? uploadInfo.fileName : 'Ручное добавление',
                cpcCompatible: p.cpcCompatible
            };
    
            if (tempConfig.paymentModel === PaymentModel.CPM) {
                if (tempConfig.bidType === BidType.MANUAL) {
                    return { ...campaignBase, searchBid: 300, recommendationsBid: 300 } as CampaignRecord;
                }
                return { ...campaignBase, bid: 300 } as CampaignRecord;
            } else { // CPC is always Unified
                return { ...campaignBase, bid: 30 } as CampaignRecord;
            }
        });
        onSubmit({paymentModel: tempConfig.paymentModel, bidType: tempConfig.bidType}, finalCampaigns);
        onClose();
    };

    const hasChanges = selectedProducts.length > 0 || !!uploadInfo;

    const handleCloseRequest = () => {
        if (hasChanges) {
            setIsConfirmCloseOpen(true);
        } else {
            onClose();
        }
    };

    const handleConfirmClose = () => {
        setIsConfirmCloseOpen(false);
        onClose();
    };
    
    if (isConfirmCloseOpen) {
      return (
          <ConfirmationModal
              isOpen={true}
              onClose={() => setIsConfirmCloseOpen(false)}
              onConfirm={handleConfirmClose}
              title="Подтвердите закрытие"
              confirmText="Закрыть"
              confirmColor="red"
              children={<p>У вас есть несохраненные изменения. Вы уверены, что хотите закрыть окно? Все настроенные товары будут сброшены.</p>}
          />
      );
    }
    
    if (!isOpen) {
        return null;
    }


    return ( 
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={handleCloseRequest}> 
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl m-auto" onClick={(e) => e.stopPropagation()}> 
                <div className="flex items-start justify-between p-6 border-b border-gray-100"> 
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Добавление списка товаров</h2> 
                        <p className="text-sm text-gray-500 mt-1">создайте один или больше списков и запустите сразу несколько кампаний, один товар = 1 кампания</p>
                    </div>
                    <button onClick={handleCloseRequest} className="text-gray-400 hover:text-gray-600 p-1 rounded-full"><X className="w-6 h-6" /></button> 
                </div> 
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <section>
                        <h3 className="text-lg font-bold">Добавление товара</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Загрузите Excel-файл со списком ID товаров или выберите их вручную по категориям.{' '}
                            <button
                                onClick={() => handleDownloadTemplateFile('xlsx')}
                                className="text-gray-500 underline hover:text-purple-600 focus:outline-none"
                            >
                                Шаблон скачать
                            </button>
                        </p>
                        {isProcessingExcel && (
                            <div className="my-3 p-4 bg-gray-50 rounded-lg flex items-center gap-3 text-sm text-gray-600">
                            <Loader className="w-4 h-4 animate-spin" />
                            <span>Обрабатываем ваш файл...</span>
                            </div>
                        )}

                        {!isProcessingExcel && uploadInfo && (
                            <div className="my-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <FileIcon className="w-5 h-5 text-gray-400 shrink-0" />
                                        <div className="overflow-hidden">
                                            <p className="font-medium text-gray-800 truncate" title={uploadInfo.fileName}>{uploadInfo.fileName}</p>
                                            <p className="text-xs text-gray-500">Найдено {uploadInfo.loaded} из {uploadInfo.total} товаров</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center shrink-0">
                                        <button onClick={() => excelFileInputRef.current?.click()} className="ml-2 px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">Заменить</button>
                                        <button onClick={handleDeleteUpload} className="ml-2 text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-100"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {!isProcessingExcel && !uploadInfo && (
                          <div>
                            <input type="file" ref={excelFileInputRef} className="hidden" onChange={handleExcelUpload} accept=".xlsx,.csv" />
                            <button 
                                onClick={() => excelFileInputRef.current?.click()}
                                className="w-full justify-center text-sm font-medium text-purple-600 hover:text-purple-800 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-1.5 p-4 border-2 border-dashed border-gray-300 hover:border-purple-400 rounded-xl transition-colors"
                            >
                                <UploadCloud className="w-4 h-4" />
                                <span>Добавить Excel с ID товаров</span>
                            </button>
                          </div>
                        )}
                    
                        {!uploadInfo && (
                            <>
                                <div className="relative flex items-center justify-center my-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-200"></div>
                                    </div>
                                    <div className="relative bg-white px-4 text-sm font-medium text-gray-500">ИЛИ</div>
                                </div>

                                <div className="relative">
                                    <div className="space-y-6">
                                        <div>
                                            <MultiSelect options={CATEGORIES} selected={tempConfig.categories} onChange={(c) => { setTempConfig(p => ({...p, categories: c})); setSelectedProducts([]); }} placeholder="Выберите категории" disabled={!!uploadInfo}/>
                                        </div>
                                        <div>
                                            <ProductMultiSelect
                                                options={mockProducts}
                                                selected={selectedProducts}
                                                onChange={setSelectedProducts}
                                                isCpcMode={tempConfig.paymentModel === PaymentModel.CPC}
                                                disabled={!!uploadInfo || tempConfig.categories.length === 0 || isProcessingExcel}
                                                submitLabel="Применить товары"
                                            />
                                            {cpcIncompatibleInSelection.length > 0 && (
                                                <div className="mt-3 text-sm text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
                                                    Часть товаров&nbsp;
                                                    <span className="tooltip underline decoration-dotted cursor-help">
                                                        ({cpcIncompatibleInSelection.length})
                                                        <span className="tooltip-text !w-64 text-left">
                                                            <span className="font-bold block mb-1 text-white">Несовместимые ID товаров:</span>
                                                            <span className="font-normal text-gray-200 break-all">
                                                                {cpcIncompatibleInSelection.map(p => p.nmId).join(', ')}
                                                            </span>
                                                        </span>
                                                    </span>
                                                    &nbsp;не может продвигаться по CPC, они не будут добавлены в кампанию.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </section>
                    
                    {/* --- Common Settings --- */}
                    <div className="space-y-6 pt-4 border-t border-gray-200 mt-6">
                        <section>
                        <h3 className="text-lg font-bold mb-3">Тип продвижения</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className={`relative p-5 rounded-xl border-2 cursor-pointer ${tempConfig.paymentModel === PaymentModel.CPM ? 'bg-gray-100 border-transparent ring-2 ring-purple-600' : 'bg-white border-gray-100'}`} onClick={() => setTempConfig(p => ({...p, paymentModel: PaymentModel.CPM}))}> <div className="flex items-start gap-4"> <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${tempConfig.paymentModel === PaymentModel.CPM ? 'border-purple-600 bg-purple-600' : 'border-gray-300'}`}>{tempConfig.paymentModel === PaymentModel.CPM && <div className="w-2 h-2 bg-white rounded-full"></div>}</div> <div> <span className="block font-semibold text-lg">Оплата за показы (CPM)</span> <span className="text-gray-500 text-sm">Вы платите за 1 000 показов</span> </div> </div> </label>
                            <label className={`relative p-5 rounded-xl border-2 cursor-pointer ${tempConfig.paymentModel === PaymentModel.CPC ? 'bg-gray-100 border-transparent ring-2 ring-purple-600' : 'bg-white border-gray-100'}`} onClick={() => setTempConfig(p => ({...p, paymentModel: PaymentModel.CPC, bidType: BidType.UNIFIED}))}> <div className="flex items-start gap-4"> <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${tempConfig.paymentModel === PaymentModel.CPC ? 'border-purple-600 bg-purple-600' : 'border-gray-300'}`}>{tempConfig.paymentModel === PaymentModel.CPC && <div className="w-2 h-2 bg-white rounded-full"></div>}</div> <div> <span className="block font-semibold text-lg">Оплата за клики (CPC)</span> <span className="text-gray-500 text-sm">Вы платите за 1 клик</span> </div> </div> </label>
                        </div>
                        </section>
                        {tempConfig.paymentModel === PaymentModel.CPM && (
                        <section>
                        <h3 className="text-lg font-bold mb-4">Зоны показов</h3>
                        <div className="space-y-4">
                            <label className="flex items-start gap-3 cursor-pointer" onClick={() => setTempConfig(p => ({...p, bidType: BidType.UNIFIED}))}>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${tempConfig.bidType === BidType.UNIFIED ? 'border-purple-600 bg-purple-600' : 'border-gray-300'}`}>
                                    {tempConfig.bidType === BidType.UNIFIED && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                </div>
                                <div>
                                    <span className="font-medium">Единая ставка: продвижение сразу в поиске и рекомендациях</span>
                                    <p className="text-sm text-gray-500 mt-1">
                                        мин. ставка <span className="font-bold text-purple-600">94–155 ₽</span> в зависимости от категории товаров
                                    </p>
                                </div>
                            </label>
                            <label className="flex items-start gap-3 cursor-pointer" onClick={() => setTempConfig(p => ({...p, bidType: BidType.MANUAL}))}>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${tempConfig.bidType === BidType.MANUAL ? 'border-purple-600 bg-purple-600' : 'border-gray-300'}`}>
                                    {tempConfig.bidType === BidType.MANUAL && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                </div>
                                <div>
                                    <span className="font-medium">Ручная ставка: выбирайте зоны показов и ставку для них</span>
                                    <p className="text-sm text-gray-500 mt-1">
                                        мин. ставка <span className="font-bold text-purple-600">190–240 ₽</span> в зависимости от категории товаров
                                    </p>
                                </div>
                            </label>
                        </div>
                        </section>
                        )}
                    </div>
                </div> 
                <div className="flex justify-end items-center gap-4 p-6 bg-gray-50/70 border-t border-gray-100 rounded-b-2xl"> 
                    <button onClick={handleCloseRequest} className="px-6 py-2.5 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Отмена</button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={validSelectedProducts.length === 0} 
                        className="px-6 py-2.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg disabled:bg-gray-300"
                    >
                    {validSelectedProducts.length > 0 
                        ? `Добавить ${validSelectedProducts.length} ${getPlural(validSelectedProducts.length, 'товар', 'товара', 'товаров')}` 
                        : 'Добавить список'
                    }
                    </button>
                </div> 
            </div> 
        </div> 
    );
};

const AutoRefillModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  campaign: CampaignRecord | null;
}> = ({ isOpen, onClose, onSave, campaign }) => {
  const [threshold, setThreshold] = useState(1000);
  const [amount, setAmount] = useState(3000);
  const [frequencyEnabled, setFrequencyEnabled] = useState(true);
  const [frequencyValue, setFrequencyValue] = useState(1);
  const [usePromoBonuses, setUsePromoBonuses] = useState(true);
  
  const ModalToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) => (
    <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none cursor-pointer ${checked ? 'bg-purple-600' : 'bg-gray-200'}`}>
      <span aria-hidden="true" className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Автопополнение бюджета кампании</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="bg-gray-50/70 p-6 rounded-xl border border-gray-100">
            <h3 className="text-lg font-bold mb-4">Условия пополнения</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 items-center gap-4">
                <label htmlFor="threshold" className="text-gray-600">Если бюджет меньше</label>
                <input id="threshold" type="number" value={threshold} onChange={e => setThreshold(Number(e.target.value))} className="col-span-1 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 w-full" />
                <div></div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <label htmlFor="amount" className="text-gray-600">Пополнять на</label>
                <div className="col-span-1">
                    <input id="amount" type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 w-full" />
                </div>
                 <div className="col-span-1 flex items-center gap-2 text-gray-600">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={frequencyEnabled} onChange={e => setFrequencyEnabled(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"/>
                        <span>не чаще</span>
                    </label>
                    <input type="number" value={frequencyValue} onChange={e => setFrequencyValue(Number(e.target.value))} className="w-16 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500" />
                    <span>раза в день <span className="tooltip inline-flex items-center"><Info className="w-4 h-4" /><span className="tooltip-text">Ограничение на частоту пополнения</span></span></span>
                </div>
              </div>
               <div className="grid grid-cols-3 items-start gap-4">
                <div></div>
                <div className="col-span-2">
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        Минимальный бюджет — 1000 ₽ 
                        <span className="tooltip"><Info className="w-3.5 h-3.5" /><span className="tooltip-text">Сумма на балансе кампании после пополнения</span></span>
                    </div>
                </div>
              </div>
            </div>
            <button className="mt-4 flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-800">
              <Plus className="w-4 h-4" />
              <span>Добавить срок действия</span>
              <span className="tooltip"><Info className="w-4 h-4" /><span className="tooltip-text">Укажите даты начала и окончания автопополнения</span></span>
            </button>
          </div>
          
          <div className="bg-gray-50/70 p-6 rounded-xl border border-gray-100">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">Источники списания <span className="tooltip"><Info className="w-4 h-4 text-gray-400" /><span className="tooltip-text">Выберите, откуда списывать деньги</span></span></h3>
                <button className="flex items-center gap-1.5 text-sm text-purple-600 font-medium hover:text-purple-800">
                    <RefreshCw className="w-4 h-4" />
                    <span>Обновить счета</span>
                </button>
             </div>
             <div className="space-y-4">
                <div className="flex items-center p-4 border border-purple-300 bg-purple-50 rounded-lg">
                    <input type="radio" name="funding-source" defaultChecked className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"/>
                    <div className="ml-3 flex-grow flex items-center gap-2">
                        <SingleAccountIcon className="w-6 h-6 text-purple-700"/>
                        <div>
                            <p className="font-semibold text-gray-800">Единый счёт: 6 234 ₽</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center p-4 border border-gray-200 rounded-lg">
                    <div className="flex-grow">
                        <p className="font-semibold text-gray-800">Промо-бонусы: 226 694 612 В</p>
                        <p className="text-xs text-gray-500">(до 100% от суммы пополнения)</p>
                    </div>
                    <ModalToggleSwitch checked={usePromoBonuses} onChange={setUsePromoBonuses} />
                </div>
             </div>
          </div>

          <div className="bg-gray-50/70 p-6 rounded-xl border border-gray-100">
            <h3 className="text-lg font-bold">История автопополнений</h3>
            <p className="text-sm text-gray-500 mt-2">Появится, когда кампания пополнится автоматически</p>
          </div>
        </div>

        <div className="flex justify-start items-center gap-3 p-6 bg-gray-50/70 border-t border-gray-100 rounded-b-2xl">
            <button onClick={onSave} className="px-6 py-2.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg">
                Сохранить
            </button>
            <button onClick={onClose} className="px-6 py-2.5 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                Отмена
            </button>
        </div>
      </div>
    </div>
  );
};

const BulkEditModal = ({ 
    isOpen, 
    onClose, 
    action, 
    onSave,
    categories = [],
    onOpenAutoRefill,
    selectedCampaignsCount = 0,
}: { 
    isOpen: boolean, 
    onClose: () => void, 
    action: BulkActionType, 
    onSave: (val: any) => void,
    categories?: string[],
    onOpenAutoRefill: () => void,
    selectedCampaignsCount?: number,
}) => {
    const [value, setValue] = useState<any>('');

    useEffect(() => {
        if(isOpen) {
            if (action === 'funding') setValue('Баланс');
            else if (action === 'autorefill') setValue(true);
            else if (action === 'bid' && categories.length > 1) {
                setValue(categories.reduce((acc, cat) => ({...acc, [cat]: ''}), {}));
            }
            else setValue('');
        }
    }, [isOpen, action, categories]);

    if (!isOpen || !action) return null;

    const getTitle = () => {
        switch(action) {
            case 'budget': return 'Задать бюджет';
            case 'bid': return 'Задать ставки';
            case 'funding': return 'Источник списания';
            case 'autorefill': return 'Настроить автопополнение';
            case 'autobidder': return 'Преследование ставки';
            default: return '';
        }
    }

    const handleSave = () => {
        onSave(value);
        onClose();
    }

    if (action === 'autobidder') {
        return (
            <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={onClose}>
                <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-gray-900">{getTitle()}</h3>
                        <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
                    </div>
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                        В разработке
                    </div>
                    <div className="flex justify-end gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg">Закрыть</button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-gray-900">{getTitle()}</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
                </div>
                
                <div className="mb-6 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                    {action === 'budget' && (
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-2">Новый бюджет (₽)</label>
                             <input type="number" autoFocus className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500" placeholder="5000" value={value} onChange={e => setValue(e.target.value)} />
                             <p className="text-xs text-gray-500 mt-2">Применится ко всем выбранным кампаниям.</p>
                        </div>
                    )}
                    {action === 'bid' && (
                        (categories.length > 1) ? (
                            <div className="space-y-4">
                                {categories.map(cat => (
                                    <div key={cat}>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{cat}</label>
                                        <BidInput 
                                            value={value[cat] || ''} 
                                            onChange={(val) => setValue((prev: any) => ({...prev, [cat]: val}))}
                                            presets={[150, 300, 500]} 
                                        />
                                    </div>
                                ))}
                                <p className="text-xs text-gray-500 mt-2">Будет установлена ставка для каждой категории в зависимости от типа кампании.</p>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Новая ставка (₽)</label>
                                <div className="w-1/2">
                                    <BidInput value={value} onChange={setValue} presets={[150, 300, 500]} />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Будет установлена как единая ставка или ставка поиска/рекомендаций в зависимости от типа кампании.</p>
                            </div>
                        )
                    )}
                    {action === 'funding' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Выберите источник</label>
                            <div className="space-y-2">
                                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input type="radio" name="funding" checked={value === 'Баланс'} onChange={() => setValue('Баланс')} className="text-purple-600 focus:ring-purple-500" />
                                    <span>Баланс</span>
                                </label>
                                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input type="radio" name="funding" checked={value === 'Счет'} onChange={() => setValue('Счет')} className="text-purple-600 focus:ring-purple-500" />
                                    <span>Счет</span>
                                </label>
                            </div>
                        </div>
                    )}
                    {action === 'autorefill' && (
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Статус автопополнения</label>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <span className="text-gray-900 font-medium">Автопополнение</span>
                                <div className="flex items-center gap-4">
                                    {Boolean(value) && (
                                        <button 
                                            onClick={() => {
                                                onClose();
                                                onOpenAutoRefill();
                                            }}
                                            className="text-sm font-medium text-purple-600 hover:underline"
                                        >
                                            Настроить
                                        </button>
                                    )}
                                    <ToggleSwitch checked={!!value} onChange={setValue} />
                                </div>
                            </div>
                            {Boolean(value) && (
                                <div className="mt-2 text-xs text-gray-500 px-1">
                                    {selectedCampaignsCount > 5 ? (
                                        <p>Выбраны кампании с разными настройками автопополнения.</p>
                                    ) : (
                                        <p>Если бюджет меньше 1 000 ₽, пополнять на 1 000 ₽ не чаще 1 раза в день.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Отмена</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg">Применить</button>
                </div>
            </div>
        </div>
    )
}

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

const ExcelProcessingLoader = ({ statusText }: { statusText: string }) => (
    <section className="bg-white rounded-2xl shadow-sm p-6 space-y-4 border border-purple-100 overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-purple-100">
            <div className="h-1 bg-purple-500 animate-loader-progress"></div>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600 font-medium pt-2">
            <Loader className="w-4 h-4 animate-spin text-purple-600" />
            <span>{statusText}</span>
        </div>
        <div className="space-y-3 pt-2">
            <div className="h-10 bg-gray-100 rounded-lg opacity-70"></div>
            <div className="h-10 bg-gray-100 rounded-lg opacity-60"></div>
            <div className="h-10 bg-gray-100 rounded-lg opacity-50"></div>
            <div className="h-10 bg-gray-100 rounded-lg opacity-40"></div>
            <div className="h-10 bg-gray-100 rounded-lg opacity-30"></div>
        </div>
        <style>{`
            @keyframes loader-progress {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
            .animate-loader-progress {
                animation: loader-progress 1.5s ease-in-out infinite;
            }
        `}</style>
    </section>
);

const BidInput = ({ value, onChange, paymentModel, presets = [150, 200, 250] }: { value: number | string, onChange: (value: number) => void, paymentModel?: PaymentModel, presets?: number[] }) => {
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const currentValue = Number(e.target.value);
        if (!paymentModel || !currentValue) return;

        if (paymentModel === PaymentModel.CPM && currentValue < 150) {
            onChange(150);
        } else if (paymentModel === PaymentModel.CPC && currentValue < 30) {
            onChange(30);
        }
    };
    
    return (
        <div className="w-full border border-gray-300 rounded-lg shadow-sm overflow-hidden">
            {/* The main input field */}
            <div className="relative bg-white">
                 <input
                    type="number"
                    value={value || ''}
                    placeholder="Ставка"
                    onChange={(e) => onChange(Number(e.target.value))}
                    onBlur={handleBlur}
                    className="w-full text-sm text-left font-medium bg-transparent outline-none px-2 py-1.5 hide-arrows"
                    style={{ MozAppearance: 'textfield' }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">₽</span>
            </div>
            {/* The segmented bar for presets */}
            <div className="flex w-full h-2 border-t border-gray-200">
                {presets.map((p, index) => (
                    <button
                        key={p}
                        onClick={() => onChange(p)}
                        title={`Установить ставку ${p} ₽`}
                        className={`flex-1 h-full transition-colors relative
                            ${Number(value) === p ? 'bg-green-300' : 'bg-gray-100 hover:bg-gray-200'}
                        `}
                        aria-label={`Установить ставку ${p}`}
                    >
                      {index > 0 && <div className="absolute left-0 top-0 bottom-0 w-px bg-white"></div>}
                    </button>
                ))}
            </div>
        </div>
    )
};

const EmptyStatePlaceholder = () => (
    <div className="mt-6 bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
        <h3 className="text-lg font-bold text-gray-800">Список кампаний пока пуст</h3>
        <p className="mt-2 max-w-sm text-gray-500">
            Нажмите «Добавить список товаров» выше, чтобы загрузить файл или выбрать товары. Они появятся здесь для дальнейшей настройки перед запуском.
        </p>
    </div>
);


export default function App() {
  const [appState, setAppState] = useState<'creation' | 'list'>('creation');
  const [activeTab, setActiveTab] = useState<'single' | 'mass'>('mass');
  const [globalConfig, setGlobalConfig] = useState<CampaignConfig>({ paymentModel: PaymentModel.CPM, bidType: BidType.UNIFIED, categories: [] });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [templateGroups, setTemplateGroups] = useState<TemplateGroup[]>([]);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editedCampaigns, setEditedCampaigns] = useState<CampaignRecord[]>([]);
  const [originalCampaignsWhileEditing, setOriginalCampaignsWhileEditing] = useState<CampaignRecord[] | null>(null);
  const [lastDeleted, setLastDeleted] = useState<{ campaign: CampaignRecord, index: number, groupId: string | null } | null>(null);
  const deleteUndoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Search and filter state
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [currentSearchInput, setCurrentSearchInput] = useState('');
  const searchQuery = useMemo(() => searchTags.join(','), [searchTags]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [isLaunching, setIsLaunching] = useState(false);
  const [creationResult, setCreationResult] = useState<{success: number, error: number} | null>(null);
  const [failedCampaigns, setFailedCampaigns] = useState<CampaignRecord[]>([]);

  // State for bulk actions
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [isBulkActionModalOpen, setIsBulkActionModalOpen] = useState(false);
  const [currentBulkAction, setCurrentBulkAction] = useState<BulkActionType>(null);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [loadingStatusText, setLoadingStatusText] = useState("Подготавливаем кампании...");
  
  // Confirmation modal state
  const [isConfirmDeleteGroupOpen, setIsConfirmDeleteGroupOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<TemplateGroup | null>(null);
  const [isConfirmBulkDeleteOpen, setIsConfirmBulkDeleteOpen] = useState(false);
  const [isConfirmCancelEditOpen, setIsConfirmCancelEditOpen] = useState(false);
  const [isConfirmSwitchEditOpen, setIsConfirmSwitchEditOpen] = useState(false);
  const [nextGroupToEdit, setNextGroupToEdit] = useState<TemplateGroup | null>(null);
  const [isConfirmLaunchOpen, setIsConfirmLaunchOpen] = useState(false);
  const [isConfirmLaunchWithFiltersOpen, setIsConfirmLaunchWithFiltersOpen] = useState(false);
  const [showAddMoreHint, setShowAddMoreHint] = useState(true);
  const [isLaunchSummaryModalOpen, setIsLaunchSummaryModalOpen] = useState(false);
  const [isAutoRefillModalOpen, setIsAutoRefillModalOpen] = useState(false);
  const [campaignForAutoRefill, setCampaignForAutoRefill] = useState<CampaignRecord | null>(null);

  useEffect(() => {
    // If we just finished saving/cancelling and have a next group to edit, start editing it.
    if (editingGroupId === null && nextGroupToEdit) {
        handleStartEditing(nextGroupToEdit);
        setNextGroupToEdit(null); // Clear it after use
    }
  }, [editingGroupId, nextGroupToEdit]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', ' ', ','].includes(e.key) && currentSearchInput.trim()) {
        e.preventDefault();
        const newTags = currentSearchInput.trim().split(/[\s,]+/).filter(Boolean);
        setSearchTags(prev => [...new Set([...prev, ...newTags])]);
        setCurrentSearchInput('');
    } else if (e.key === 'Backspace' && !currentSearchInput && searchTags.length > 0) {
        e.preventDefault();
        setSearchTags(prev => prev.slice(0, -1));
    }
  };

  const removeSearchTag = (tagToRemove: string) => {
    setSearchTags(prev => prev.filter(tag => tag !== tagToRemove));
  };
  
  const allValidCampaigns = useMemo(() => 
      templateGroups.flatMap(g => g.campaigns.filter(c => c.status !== CampaignStatus.ERROR)),
      [templateGroups]
  );
  
  const uniqueSources = useMemo(() => Array.from(new Set(allValidCampaigns.map(c => c.source))), [allValidCampaigns]);
  const uniqueCategories = useMemo(() => Array.from(new Set(allValidCampaigns.map(c => c.category))), [allValidCampaigns]);
  
  const areFiltersActive = useMemo(() => {
    return searchTags.length > 0 || currentSearchInput.trim() !== '' || selectedSources.length > 0 || selectedCategories.length > 0;
  }, [searchTags, currentSearchInput, selectedSources, selectedCategories]);

  const filteredCampaigns = useMemo(() => {
    if (!areFiltersActive) return allValidCampaigns;

    return allValidCampaigns.filter(campaign => {
        // Filter by source
        if (selectedSources.length > 0 && !selectedSources.includes(campaign.source)) {
            return false;
        }

        // Filter by category
        if (selectedCategories.length > 0 && !selectedCategories.includes(campaign.category)) {
            return false;
        }

        // Filter by search query
        const hasSearchQuery = searchTags.length > 0 || currentSearchInput.trim() !== '';
        if (hasSearchQuery) {
            const allSearchTerms = [...searchTags, ...currentSearchInput.trim().split(/[\s,]+/)].filter(Boolean).map(s => s.toLowerCase());
            
            const idsToSearch = allSearchTerms.filter(s => !isNaN(Number(s)));
            const textToSearch = allSearchTerms.filter(s => isNaN(Number(s)));
            
            const campaignText = `${campaign.productName.toLowerCase()} ${campaign.campaignName.toLowerCase()}`;
            
            const idMatch = idsToSearch.length > 0 ? idsToSearch.includes(String(campaign.nmId)) : true;
            const textMatch = textToSearch.length > 0 ? textToSearch.every(term => campaignText.includes(term)) : true;
            
            if (idsToSearch.length > 0 && textToSearch.length > 0) {
                if (!idMatch || !textMatch) return false;
            } else if (idsToSearch.length > 0) {
                if (!idMatch) return false;
            } else if (textToSearch.length > 0) {
                if (!textMatch) return false;
            }
        }

        return true;
    });
  }, [allValidCampaigns, selectedSources, selectedCategories, searchTags, currentSearchInput, areFiltersActive]);


  const totalAllValidCount = allValidCampaigns.length;

  const globalTotals = allValidCampaigns.reduce(
    (acc, campaign) => {
        if (campaign.fundingSource === 'Баланс') {
            acc.balance += campaign.budget;
        } else if (campaign.fundingSource === 'Счет') {
            acc.account += campaign.budget;
        }
        acc.total += campaign.budget;
        return acc;
    },
    { balance: 0, account: 0, total: 0 }
  );

  const globalBalanceDeficit = Math.max(0, globalTotals.balance - ACCOUNT_BALANCES['Баланс']);
  const globalAccountDeficit = Math.max(0, globalTotals.account - ACCOUNT_BALANCES['Счет']);

  const launchPreview = useMemo(() => {
    if (!allValidCampaigns || allValidCampaigns.length === 0) {
        return { successfulCount: 0, readyToLaunchCount: 0, amountToDebit: 0 };
    }

    let amountToDebit = 0;
    const campaignsFromBalance = allValidCampaigns.filter(c => c.fundingSource === 'Баланс').sort((a, b) => a.budget - b.budget);
    const campaignsFromAccount = allValidCampaigns.filter(c => c.fundingSource === 'Счет').sort((a, b) => a.budget - b.budget);

    let currentBalance = ACCOUNT_BALANCES['Баланс'];
    let successfulBalanceCampaigns = 0;
    for (const campaign of campaignsFromBalance) {
        if (currentBalance >= campaign.budget) {
            currentBalance -= campaign.budget;
            amountToDebit += campaign.budget;
            successfulBalanceCampaigns++;
        } else {
            break; 
        }
    }

    let currentAccount = ACCOUNT_BALANCES['Счет'];
    let successfulAccountCampaigns = 0;
    for (const campaign of campaignsFromAccount) {
        if (currentAccount >= campaign.budget) {
            currentAccount -= campaign.budget;
            amountToDebit += campaign.budget;
            successfulAccountCampaigns++;
        } else {
            break;
        }
    }

    const successfulCount = successfulBalanceCampaigns + successfulAccountCampaigns;
    return {
        successfulCount,
        readyToLaunchCount: allValidCampaigns.length - successfulCount,
        amountToDebit
    };
  }, [allValidCampaigns]);

  const handleTemplateDownload = (finalConfig: CampaignConfig) => { setGlobalConfig(finalConfig); setToastMessage("Шаблон успешно сформирован и скачан"); setShowToast(true); };

  const handleAddItemSubmit = (config: Pick<CampaignConfig, 'paymentModel' | 'bidType'>, items: CampaignRecord[]) => {
      setIsTableLoading(true);
      setLoadingStatusText("Проверяем минимальные ставки...");

      const timer1 = setTimeout(() => {
        setLoadingStatusText("Загружаем товары в группы...");
      }, 1200);

      const timer2 = setTimeout(() => {
          const sourceFile = items[0]?.source || "Ручное добавление";
          const existingGroupIndex = templateGroups.findIndex(
            (g) =>
              g.config.paymentModel === config.paymentModel &&
              g.config.bidType === config.bidType &&
              g.sourceFiles.has(sourceFile)
          );

          if (existingGroupIndex !== -1) {
            setTemplateGroups(prev => {
              const newGroups = [...prev];
              const existingGroup = newGroups[existingGroupIndex];
              newGroups[existingGroupIndex] = {
                ...existingGroup,
                campaigns: [...existingGroup.campaigns, ...items]
              };
              return newGroups;
            });
            setToastMessage(`${items.length} ${getPlural(items.length, 'товар', 'товара', 'товаров')} добавлено в существующую группу`);
          } else {
            const newGroup: TemplateGroup = {
              id: `manual-${Date.now()}`,
              config,
              campaigns: items,
              duplicateNmIds: new Set(),
              correctedNmIds: new Set(),
              currentPage: 1,
              sourceFiles: new Set([sourceFile])
            };
            setTemplateGroups(prev => [...prev, newGroup]);
            setToastMessage(`Создана новая группа с ${items.length} ${getPlural(items.length, 'товаром', 'товарами', 'товарами')}`);
          }
          setShowToast(true);
          setIsTableLoading(false);
          clearTimeout(timer1);
      }, 2500);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      }
  };
  
  const handlePageChange = (groupId: string, page: number) => { setTemplateGroups(prev => prev.map(g => g.id === groupId ? { ...g, currentPage: page } : g)); };
    
  const handleUpdateCampaign = (groupId: string, campaignId: string, field: keyof CampaignRecord, value: any) => {
    const updater = (campaigns: CampaignRecord[]) => campaigns.map(c => c.id === campaignId ? { ...c, [field]: value } : c);
    if(editingGroupId === groupId) { 
        setEditedCampaigns(updater); 
    } else { 
        setTemplateGroups(prev => prev.map(g => g.id === groupId ? { ...g, campaigns: updater(g.campaigns) } : g)); 
    }
  };

  const handleStartEditing = (group: TemplateGroup) => {
    if (editingGroupId && editingGroupId !== group.id) {
        setNextGroupToEdit(group);
        setIsConfirmSwitchEditOpen(true);
    } else if (editingGroupId !== group.id) {
        setEditingGroupId(group.id);
        const campaignsToEdit = group.campaigns.filter(c => c.status !== CampaignStatus.ERROR);
        setEditedCampaigns(campaignsToEdit);
        setOriginalCampaignsWhileEditing(JSON.parse(JSON.stringify(campaignsToEdit)));
        setSelectedCampaignIds([]);
    }
  };
  
  const handleSaveEditing = () => {
    if (editingGroupId === null) return;
    setTemplateGroups(prev =>
      prev.map(g => (g.id === editingGroupId ? { ...g, campaigns: editedCampaigns } : g))
    );
    setEditingGroupId(null);
    setEditedCampaigns([]);
    setOriginalCampaignsWhileEditing(null);
    setSelectedCampaignIds([]);
    setToastMessage("Изменения сохранены");
    setShowToast(true);
  };
  
  const handleCancelEditing = () => {
    const hasChanges = JSON.stringify(editedCampaigns) !== JSON.stringify(originalCampaignsWhileEditing);
    if (hasChanges) {
        setIsConfirmCancelEditOpen(true);
    } else {
        performCancelEditing();
    }
  };

  const performCancelEditing = () => {
      setEditingGroupId(null);
      setEditedCampaigns([]);
      setOriginalCampaignsWhileEditing(null);
      setSelectedCampaignIds([]);
      setIsConfirmCancelEditOpen(false);
  }
  
  const openDeleteGroupModal = (group: TemplateGroup) => {
    setGroupToDelete(group);
    setIsConfirmDeleteGroupOpen(true);
  };
  
  const handleConfirmDeleteGroup = () => {
    if (groupToDelete) {
      setTemplateGroups(prev => prev.filter(g => g.id !== groupToDelete.id));
      setToastMessage("Группа кампаний удалена");
      setShowToast(true);
    }
    setIsConfirmDeleteGroupOpen(false);
    setGroupToDelete(null);
  };

  const handleDeleteCampaign = (campaignId: string) => {
      if (deleteUndoTimer.current) {
          clearTimeout(deleteUndoTimer.current);
      }
      
      if (editingGroupId) {
          const index = editedCampaigns.findIndex(c => c.id === campaignId);
          if (index === -1) return;
          const campaign = editedCampaigns[index];
          setLastDeleted({ campaign, index, groupId: editingGroupId });
          setEditedCampaigns(prev => prev.filter(c => c.id !== campaignId));
      } else {
         let campaignToDelete: CampaignRecord | undefined;
         let groupIndex = -1;
         let campIndex = -1;
         
         for(let i=0; i<templateGroups.length; i++) {
             const idx = templateGroups[i].campaigns.findIndex(c => c.id === campaignId);
             if (idx !== -1) {
                 campaignToDelete = templateGroups[i].campaigns[idx];
                 groupIndex = i;
                 campIndex = idx;
                 break;
             }
         }
         
         if (campaignToDelete && groupIndex !== -1) {
             setLastDeleted({ campaign: campaignToDelete, index: campIndex, groupId: templateGroups[groupIndex].id });
             setTemplateGroups(prev => {
                 const newGroups = [...prev];
                 newGroups[groupIndex] = {
                     ...newGroups[groupIndex],
                     campaigns: newGroups[groupIndex].campaigns.filter(c => c.id !== campaignId)
                 };
                 return newGroups;
             });
         }
      }

      setSelectedCampaignIds(prev => prev.filter(id => id !== campaignId));
      deleteUndoTimer.current = setTimeout(() => {
          setLastDeleted(null);
      }, 5000);
  };

  const handleUndoDelete = () => {
    if (!lastDeleted) return;

    if (deleteUndoTimer.current) {
        clearTimeout(deleteUndoTimer.current);
    }

    const { campaign, index, groupId } = lastDeleted;

    if (groupId === editingGroupId) {
        setEditedCampaigns(prev => {
            const newCampaigns = [...prev];
            newCampaigns.splice(index, 0, campaign);
            return newCampaigns;
        });
    } else {
        setTemplateGroups(prev => prev.map(g => {
            if (g.id === groupId) {
                const newCampaigns = [...g.campaigns];
                newCampaigns.splice(index, 0, campaign);
                return { ...g, campaigns: newCampaigns };
            }
            return g;
        }));
    }

    setToastMessage(`Кампанию с номером ID ${campaign.nmId} вернули`);
    setShowToast(true);
    setLastDeleted(null);
  };
  
  const launchCampaigns = () => {
    setIsLaunchSummaryModalOpen(true);
  };

  const handleProceedToLaunch = () => {
    setIsLaunchSummaryModalOpen(false);
    if (areFiltersActive) {
      setIsConfirmLaunchWithFiltersOpen(true);
      return;
    }
    if (editingGroupId) {
        setIsConfirmLaunchOpen(true);
        return;
    }
    performLaunch();
  };

  const performLaunch = () => {
    setCreationResult(null);
    setFailedCampaigns([]);
    setIsLaunching(true);
    setAppState('list');
    setIsConfirmLaunchOpen(false);
    setIsConfirmLaunchWithFiltersOpen(false);
  }

  // --- Bulk Action Handlers ---
  const handleSelectCampaign = (id: string) => {
    setSelectedCampaignIds(prev => 
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const handleSelectAllOnPage = (idsOnPage: string[], checked: boolean) => {
    if (checked) {
      setSelectedCampaignIds(prev => [...new Set([...prev, ...idsOnPage])]);
    } else {
      setSelectedCampaignIds(prev => prev.filter(id => !idsOnPage.includes(id)));
    }
  };

  const uniqueCategoriesForSelection = useMemo(() => {
      if (currentBulkAction !== 'bid' || selectedCampaignIds.length === 0) return [];
      const allCampaigns = templateGroups.flatMap(g => g.campaigns);
      const selectedCampaigns = allCampaigns.filter(c => selectedCampaignIds.includes(c.id));
      return [...new Set(selectedCampaigns.map(c => c.category))];
  }, [selectedCampaignIds, currentBulkAction, templateGroups]);

  const openBulkActionModal = (action: BulkActionType) => {
    if (action === 'delete') {
        setIsConfirmBulkDeleteOpen(true);
        return;
    }
    setCurrentBulkAction(action);
    setIsBulkActionModalOpen(true);
  };
  
  const handleBulkDelete = () => {
      setTemplateGroups(prev => prev.map(group => ({
          ...group,
          campaigns: group.campaigns.filter(c => !selectedCampaignIds.includes(c.id))
      })).filter(g => g.campaigns.length > 0)); 

      if (editingGroupId) {
          setEditedCampaigns(prev => prev.filter(c => !selectedCampaignIds.includes(c.id)));
      }

      setToastMessage(`Удалено ${selectedCampaignIds.length} ${getPlural(selectedCampaignIds.length, 'кампания', 'кампании', 'кампаний')}`);
      setShowToast(true);
      setSelectedCampaignIds([]);
  };

  const handleBulkSave = (value: any) => {
      const action = currentBulkAction;
      
      const updateLogic = (campaign: CampaignRecord): CampaignRecord => {
          if (!selectedCampaignIds.includes(campaign.id)) return campaign;
          const newCamp = { ...campaign };
          
          if (action === 'budget') newCamp.budget = Number(value);
          if (action === 'funding') newCamp.fundingSource = value;
          if (action === 'autorefill') newCamp.autoReplenishment = Boolean(value);
          if (action === 'bid') {
                const isMultiCategory = typeof value === 'object' && value !== null && !Array.isArray(value);
                const newBid = isMultiCategory ? value[campaign.category] : value;
                
                if (newBid !== undefined && newBid !== '') {
                    if (newCamp.bid !== undefined) newCamp.bid = Number(newBid);
                    if (newCamp.searchBid !== undefined) newCamp.searchBid = Number(newBid);
                    if (newCamp.recommendationsBid !== undefined) newCamp.recommendationsBid = Number(newBid);
                }
          }
          return newCamp;
      };

      setTemplateGroups(prev => prev.map(group => ({
          ...group,
          campaigns: group.campaigns.map(updateLogic)
      })));

      if (editingGroupId) {
        setEditedCampaigns(prev => prev.map(updateLogic));
        setOriginalCampaignsWhileEditing(prev => prev ? prev.map(updateLogic) : null)
      }
      
      setToastMessage(`Обновлено ${selectedCampaignIds.length} ${getPlural(selectedCampaignIds.length, 'кампания', 'кампании', 'кампаний')}`);
      setShowToast(true);
      setIsBulkActionModalOpen(false);
      setSelectedCampaignIds([]);
  };

  const openAutoRefillModal = (campaign: CampaignRecord) => {
    setCampaignForAutoRefill(campaign);
    setIsAutoRefillModalOpen(true);
  };

  const handleSaveAutoRefill = () => {
    setIsAutoRefillModalOpen(false);
    setCampaignForAutoRefill(null);
    setToastMessage("Настройки автопополнения сохранены");
    setShowToast(true);
  };

  useEffect(() => {
    if (isLaunching) {
      const timer = setTimeout(() => {
        const mutableBalances = { ...ACCOUNT_BALANCES };
        const successfulCampaigns: CampaignRecord[] = [];
        const failed: CampaignRecord[] = [];

        const shuffledCampaigns = [...allValidCampaigns].sort(() => Math.random() - 0.5);

        for (const campaign of shuffledCampaigns) {
            if (mutableBalances[campaign.fundingSource] >= campaign.budget) {
                mutableBalances[campaign.fundingSource] -= campaign.budget;
                successfulCampaigns.push(campaign);
            } else {
                failed.push({
                    ...campaign,
                    errorMessage: `Недостаточно средств на источнике: "${campaign.fundingSource}"`,
                });
            }
        }
        
        setCreationResult({ success: successfulCampaigns.length, error: failed.length });
        setFailedCampaigns(failed);
        setIsLaunching(false);
      }, 10000); 

      return () => clearTimeout(timer);
    }
  }, [isLaunching, allValidCampaigns]);

  const editableInputClass = "w-full text-sm bg-white border border-gray-300 rounded-lg shadow-sm outline-none transition-colors focus:border-purple-500 focus:ring-1 focus:ring-purple-500 px-2 py-1.5";
  const hasActiveFilterTags = selectedSources.length > 0 || selectedCategories.length > 0;

  if (appState === 'list') {
    return (
      <div className="min-h-screen bg-[#F6F69] font-sans text-gray-900 relative">
        <Header />
        <main className="max-w-[1392px] mx-auto px-6 py-8">
          <SuccessPage
            isLaunching={isLaunching}
            launchTotal={totalAllValidCount}
            launchResult={creationResult}
            failedCampaigns={failedCampaigns}
            onClearLaunchResult={() => setCreationResult(null)}
          />
        </main>
      </div>
    );
  }

  return ( <div className="min-h-screen bg-[#F6F69] font-sans text-gray-900 pb-40 relative"> <Header /> <Toast show={showToast} message={toastMessage} onClose={() => setShowToast(false)} /> <UndoToast campaign={lastDeleted?.campaign} onUndo={handleUndoDelete} /> <AddItemModal isOpen={isAddItemModalOpen} onClose={() => setIsAddItemModalOpen(false)} onSubmit={handleAddItemSubmit} onTemplateDownload={handleTemplateDownload} initialConfig={globalConfig} showToast={setShowToast} setToastMessage={setToastMessage} /> 
  <AutoRefillModal isOpen={isAutoRefillModalOpen} onClose={() => setIsAutoRefillModalOpen(false)} onSave={handleSaveAutoRefill} campaign={campaignForAutoRefill} />
  <BulkEditModal 
    isOpen={isBulkActionModalOpen} 
    onClose={() => setIsBulkActionModalOpen(false)} 
    action={currentBulkAction} 
    onSave={handleBulkSave} 
    categories={uniqueCategoriesForSelection}
    selectedCampaignsCount={selectedCampaignIds.length}
    onOpenAutoRefill={() => {
        setCampaignForAutoRefill(null); // Bulk action
        setIsAutoRefillModalOpen(true);
    }}
  />
  
  <ConfirmationModal
    isOpen={isConfirmDeleteGroupOpen}
    onClose={() => setIsConfirmDeleteGroupOpen(false)}
    onConfirm={handleConfirmDeleteGroup}
    title="Подтвердите удаление"
    children={groupToDelete && (
        <p>
            Вы уверены, что хотите удалить всю группу? Это действие удалит{' '}
            <b>
                {groupToDelete.campaigns.length} {getPlural(groupToDelete.campaigns.length, 'кампанию', 'кампании', 'кампаний')}
            </b>
            . Отменить это действие будет невозможно.
        </p>
    )}
  />

  <ConfirmationModal
      isOpen={isConfirmBulkDeleteOpen}
      onClose={() => setIsConfirmBulkDeleteOpen(false)}
      onConfirm={() => {
        handleBulkDelete();
        setIsConfirmBulkDeleteOpen(false);
      }}
      title="Подтвердите удаление"
      confirmText="Да, удалить"
      confirmColor="red"
      children={<p>
        Вы уверены, что хотите удалить{' '}
        <b>
          {selectedCampaignIds.length} {getPlural(selectedCampaignIds.length, 'кампанию', 'кампании', 'кампаний')}
        </b>
        ? Это действие необратимо.
      </p>}
    />
 
    <ConfirmationModal
        isOpen={isConfirmCancelEditOpen}
        onClose={() => setIsConfirmCancelEditOpen(false)}
        onConfirm={performCancelEditing}
        title="Выйти без сохранения?"
        confirmText="Выйти без сохранения"
        confirmColor="red"
        secondaryConfirmText="Сохранить и выйти"
        onSecondaryConfirm={() => {
            handleSaveEditing();
            setIsConfirmCancelEditOpen(false);
        }}
        cancelText="Продолжить редактирование"
        children={<p>У вас есть несохраненные изменения. Что вы хотите сделать?</p>}
    />

    <ConfirmationModal
        isOpen={isConfirmSwitchEditOpen}
        onClose={() => setIsConfirmSwitchEditOpen(false)}
        title="Сохраните изменения"
        confirmText="Выйти без сохранения"
        confirmColor="red"
        onConfirm={() => {
            setIsConfirmSwitchEditOpen(false);
            performCancelEditing(); // Will trigger useEffect to switch
        }}
        secondaryConfirmText="Сохранить"
        onSecondaryConfirm={() => {
            setIsConfirmSwitchEditOpen(false);
            handleSaveEditing(); // Will trigger useEffect to switch
        }}
        cancelText="Отмена"
        children={<p>У вас есть несохраненные изменения. Что вы хотите сделать?</p>}
    />

    <ConfirmationModal
        isOpen={isConfirmLaunchOpen}
        onClose={() => setIsConfirmLaunchOpen(false)}
        onConfirm={() => {
            handleSaveEditing();
            performLaunch();
        }}
        title="Сохранить изменения?"
        confirmText="Сохранить и запустить"
        confirmColor="purple"
        cancelText="Отмена"
        children={<p>У вас есть несохраненные изменения в одной из групп. Сохранить их и продолжить запуск?</p>}
    />
    <ConfirmationModal
        isOpen={isConfirmLaunchWithFiltersOpen}
        onClose={() => setIsConfirmLaunchWithFiltersOpen(false)}
        onConfirm={() => {
          setIsConfirmLaunchWithFiltersOpen(false);
          if (editingGroupId) {
            setIsConfirmLaunchOpen(true);
          } else {
            performLaunch();
          }
        }}
        title="Запуск кампаний с активным фильтром"
        confirmText={`Запустить все ${totalAllValidCount}`}
        confirmColor="purple"
        cancelText="Отмена"
        children={
            <p>
                Применены фильтры для просмотра, но будут запущены <b>все {totalAllValidCount} {getPlural(totalAllValidCount, 'готовая кампания', 'готовые кампании', 'готовых кампаний')}</b>. Вы уверены, что хотите продолжить?
            </p>
        }
    />
    <ConfirmationModal
        isOpen={isLaunchSummaryModalOpen}
        onClose={() => setIsLaunchSummaryModalOpen(false)}
        onConfirm={handleProceedToLaunch}
        title="Всё готово к запуску"
        confirmText={`Запустить ${totalAllValidCount} ${getPlural(totalAllValidCount, 'кампанию', 'кампании', 'кампаний')}`}
        confirmColor="purple"
        cancelText="Отменить"
        children={
            <div className="space-y-3 text-left">
                <p className="text-gray-800">
                    <b>{launchPreview.successfulCount} {getPlural(launchPreview.successfulCount, 'кампания', 'кампании', 'кампаний')}</b> запустятся на <b>{launchPreview.amountToDebit.toLocaleString('ru-RU')} ₽</b>
                </p>
                {launchPreview.readyToLaunchCount > 0 && (
                    <p className="text-gray-800">
                        Остальные <b>{launchPreview.readyToLaunchCount}</b> будут созданы в статусе «Готово к запуску»
                    </p>
                )}
                <p className="text-xs text-gray-500 pt-2">
                    Кампании можно остановить в любой момент и оставшиеся деньги вернуть на счет
                </p>
            </div>
        }
    />
  
  <main className="max-w-[1392px] mx-auto px-6 py-8">
      
      <div className="mb-6"> 
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 mb-6 pb-0"> 
            <div className="flex items-center gap-6">
                <button onClick={() => setActiveTab('single')} className={`pb-3 text-base font-medium flex items-center gap-2 ${activeTab === 'single' ? 'text-black border-b-2 border-black' : 'text-gray-500 hover:text-gray-800'}`}> <div className="w-4 h-4 rounded-full border border-current"></div> Одна кампания </button> 
                <button onClick={() => setActiveTab('mass')} className={`pb-3 text-base font-medium flex items-center gap-2 ${activeTab === 'mass' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-800'}`}> <FileSpreadsheet className="w-4 h-4" /> Массовое создание </button> 
            </div>
        </div> 
      </div> 
        <section className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
                <button onClick={() => setIsAddItemModalOpen(true)} className="px-5 py-2.5 text-sm font-bold text-white bg-gray-700 hover:bg-gray-800 rounded-lg shadow-sm transition-all flex items-center gap-2 w-auto">
                    <Plus className="w-4 h-4" />
                    <span>Добавить список товаров</span>
                </button>
                 {templateGroups.length > 0 && showAddMoreHint && (
                    <div className="flex items-center gap-2 text-sm font-medium animate-in fade-in">
                        <svg width="32" height="28" viewBox="0 0 32 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400 transform -translate-y-1">
                            <path d="M31 27C31 27 21.5 25.5 17 18C12.5 10.5 1.00001 7.49999 1.00001 7.49999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4"/>
                            <path d="M5.5 12L1 7.5L6.5 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="text-gray-500">Можете добавить еще один список товаров</span>
                        <button onClick={() => setShowAddMoreHint(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </section>

        {templateGroups.length > 0 && (
             <div className="mt-6 mb-8">
                <div className="flex items-center flex-wrap gap-4">
                    {/* Search bar */}
                    <div className="relative flex-grow p-2.5 text-sm bg-white border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent outline-none transition-all shadow-sm flex items-center flex-wrap gap-2 min-w-[300px] sm:min-w-[400px]">
                        <Search className="w-4 h-4 text-gray-400 shrink-0 ml-1" />
                        {searchTags.map(tag => (
                            <div key={tag} className="flex items-center gap-1 bg-gray-100 rounded-md pl-2 pr-1 py-0.5 text-gray-700 animate-in fade-in zoom-in-95">
                                <span>{tag}</span>
                                <button onClick={() => removeSearchTag(tag)} className="text-gray-400 hover:text-gray-700 hover:bg-gray-300 rounded-full">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        <input 
                            type="text" 
                            value={currentSearchInput}
                            onChange={(e) => setCurrentSearchInput(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            placeholder="Поиск по названию или ID" 
                            className="flex-grow bg-transparent outline-none min-w-[150px]"
                        />
                        {(searchTags.length > 0 || currentSearchInput) && (
                            <button onClick={() => {setSearchTags([]); setCurrentSearchInput('')}} className="ml-auto text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    {/* Filters */}
                    <MultiSelect
                        options={uniqueSources}
                        selected={selectedSources}
                        onChange={setSelectedSources}
                        placeholder="Источник"
                        className="w-full sm:w-auto sm:min-w-[180px]"
                    />
                    <MultiSelect
                        options={uniqueCategories}
                        selected={selectedCategories}
                        onChange={setSelectedCategories}
                        placeholder="Категория"
                        className="w-full sm:w-auto sm:min-w-[180px]"
                    />
                </div>
                {hasActiveFilterTags && (
                  <div className="mt-4 flex items-center flex-wrap gap-2">
                    <span className="text-sm font-medium text-gray-500 mr-2">Активные фильтры:</span>
                    {selectedSources.map(source => (
                      <div key={`source-${source}`} className="flex items-center gap-1.5 bg-gray-100 rounded-full pl-3 pr-2 py-1 text-sm text-gray-700 animate-in fade-in">
                        <span>{source}</span>
                        <button 
                          onClick={() => setSelectedSources(prev => prev.filter(s => s !== source))}
                          className="text-gray-400 hover:text-gray-700 hover:bg-gray-300 rounded-full p-0.5"
                          aria-label={`Удалить фильтр ${source}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {selectedCategories.map(category => (
                      <div key={`category-${category}`} className="flex items-center gap-1.5 bg-gray-100 rounded-full pl-3 pr-2 py-1 text-sm text-gray-700 animate-in fade-in">
                        <span>{category}</span>
                        <button 
                          onClick={() => setSelectedCategories(prev => prev.filter(c => c !== category))}
                          className="text-gray-400 hover:text-gray-700 hover:bg-gray-300 rounded-full p-0.5"
                          aria-label={`Удалить фильтр ${category}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
            </div>
        )}
        
        {isTableLoading ? (
            <div className="space-y-8 mt-6">
                <ExcelProcessingLoader statusText={loadingStatusText} />
            </div>
        ) : templateGroups.length > 0 ? (
            <div className="space-y-8"> {templateGroups.map((group) => { 
            const campaignsForReview = editingGroupId === group.id ? editedCampaigns : group.campaigns.filter(c => c.status !== CampaignStatus.ERROR);
            
            const filteredGroupCampaigns = campaignsForReview.filter(c => 
                filteredCampaigns.some(fc => fc.id === c.id)
            );

            const validCount = filteredGroupCampaigns.length; 
            
            const totals = filteredGroupCampaigns.reduce( (acc, campaign) => { if (campaign.fundingSource === 'Баланс') { acc.balance += campaign.budget; } else if (campaign.fundingSource === 'Счет') { acc.account += campaign.budget; } acc.total += campaign.budget; return acc; }, { balance: 0, account: 0, total: 0 } ); const paginatedCampaigns = filteredGroupCampaigns.slice((group.currentPage - 1) * PAGE_SIZE, group.currentPage * PAGE_SIZE); const paginatedIds = paginatedCampaigns.map(c => c.id); const isCpmManual = group.config.paymentModel === PaymentModel.CPM && group.config.bidType === BidType.MANUAL; 
            
            const selectedOnPageCount = paginatedIds.filter(id => selectedCampaignIds.includes(id)).length;
            const allOnPageSelected = selectedOnPageCount === paginatedIds.length && paginatedIds.length > 0;
            const isIndeterminate = !allOnPageSelected && selectedOnPageCount > 0;
            
            if (filteredGroupCampaigns.length === 0 && (searchTags.length > 0 || currentSearchInput || selectedSources.length > 0 || selectedCategories.length > 0)) {
                return null;
            }

            return ( <section key={group.id} className="bg-white rounded-2xl shadow-sm px-6 pb-6 pt-0 space-y-4 animate-fade-in"> 
            <div className="sticky top-[104px] z-30 bg-white py-3 border-b border-gray-100 mb-0 flex justify-between items-center -mx-6 px-6 rounded-t-2xl shadow-sm h-[57px]"> 
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{`${group.config.paymentModel} ${group.config.bidType === BidType.MANUAL ? 'Ручная ставка' : 'Единая ставка'}`}</h2>
                  <p className="text-xs text-gray-500 mt-0.5 truncate" title={Array.from(group.sourceFiles).join(', ')}>
                    {Array.from(group.sourceFiles).join(', ')}
                  </p>
                </div>
                <span className="text-gray-400 text-sm font-medium">{validCount} {getPlural(validCount, 'кампания', 'кампании', 'кампаний')}</span> 
              </div> 
              <div className="flex items-center gap-2">
              {editingGroupId === group.id ? ( 
                <>
                  <button onClick={handleCancelEditing} className="px-4 py-2 text-xs font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Отмена</button> 
                  <button onClick={handleSaveEditing} className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm">Сохранить</button> 
                </>
              ) : ( 
                <>
                  <button onClick={() => handleStartEditing(group)} className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-800 text-xs"> 
                    <Edit2 className="w-3 h-3" /> <span>Редактировать</span> 
                  </button>
                   <div className="tooltip">
                    <button onClick={() => openDeleteGroupModal(group)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <span className="tooltip-text">Удалить группу</span>
                   </div>
                </>
              )} 
              </div>
            </div> 
            <div className="bg-white rounded-lg"> <table className="w-full text-xs text-left table-fixed"> 
              <thead className="text-gray-600"> 
                <tr> 
                  <th className="table-header-cell px-2 py-1.5 font-normal w-[4%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"> <input type="checkbox" checked={allOnPageSelected} ref={el => { if (el) el.indeterminate = isIndeterminate; }} onChange={(e) => handleSelectAllOnPage(paginatedIds, e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" /> </th> 
                  <th className="table-header-cell px-2 py-1.5 font-normal w-[16%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"><div className="tooltip justify-start"><span>Товар/Кампания</span><span className="tooltip-text">Информация о товаре и его артикул (ID)</span></div></th> 
                  <th className="table-header-cell px-2 py-1.5 font-normal w-[14%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"><div className="tooltip justify-start"><span>Название кампании</span><span className="tooltip-text">Редактируемое название рекламной кампании</span></div></th> 
                  <th className="table-header-cell px-2 py-1.5 font-normal w-[10%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"><div className="tooltip justify-start"><span>Категория</span><span className="tooltip-text">Категория, к которой относится товар</span></div></th> 
                  <th className="table-header-cell px-2 py-1.5 font-normal w-[10%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"><div className="tooltip justify-start"><span>Зона показов</span><span className="tooltip-text">Места показа рекламы: Поиск и/или Рекомендации</span></div></th> 
                  <th className="table-header-cell px-2 py-1.5 font-normal w-[10%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"><div className="tooltip justify-start"><span>Источник списания</span><span className="tooltip-text">Откуда будут списываться средства за рекламу</span></div></th> 
                  <th className="table-header-cell px-2 py-1.5 font-normal w-[8%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"><div className="tooltip justify-start"><span>Бюджет</span><span className="tooltip-text">Общая сумма, выделенная на кампанию</span></div></th>  
                  <th className="table-header-cell px-2 py-1.5 font-normal w-[8%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"><div className="tooltip justify-start"><span>Преследование ставки</span><span className="tooltip-text">Настроить автоматическое управление ставками</span></div></th> 
                  {isCpmManual ? <> 
                    <th className="table-header-cell px-2 py-1.5 font-normal w-[9%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"><div className="tooltip justify-start"><span>Поиск</span><span className="tooltip-text">Ставка для показов в результатах поиска</span></div></th> 
                    <th className="table-header-cell px-2 py-1.5 font-normal w-[9%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"><div className="tooltip justify-start"><span>Рекоменд.</span><span className="tooltip-text">Ставка для показов в рекомендациях</span></div></th> 
                  </> : <th className="table-header-cell px-2 py-1.5 font-normal w-[10%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"><div className="tooltip justify-start"><span>Ставка</span><span className="tooltip-text">Единая ставка для всех зон показов</span></div></th> } 
                  <th className="table-header-cell px-2 py-1.5 font-normal w-[4%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"><div className="tooltip"><span>Бонусы</span><span className="tooltip-text">Использовать промо-бонусы для оплаты</span></div></th> 
                  <th className="table-header-cell px-2 py-1.5 font-normal w-[4%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"><div className="tooltip"><span>АП</span><span className="tooltip-text">Автоматическое пополнение бюджета</span></div></th> 
                  <th className="table-header-cell px-2 py-1.5 font-normal text-left w-[4%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"></th> 
                </tr> 
              </thead> 
              <tbody className="divide-y divide-gray-100"> {paginatedCampaigns.map((row) => ( <tr key={row.id} className={`transition-colors ${selectedCampaignIds.includes(row.id) ? 'bg-purple-50' : 'hover:bg-gray-50'}`}> <td className="px-2 py-1.5 align-top"><input type="checkbox" checked={selectedCampaignIds.includes(row.id)} onChange={() => handleSelectCampaign(row.id)} className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"/></td> <td className="px-2 py-1.5 align-top"> <div className="flex items-start gap-2"> 
      <div className="relative group">
        <img src={row.imageUrl} alt={row.productName} className="w-8 h-8 rounded-md object-cover bg-gray-100 shrink-0 cursor-zoom-in" />
        <div className="hidden group-hover:block absolute left-full top-0 ml-2 z-[100] w-28 aspect-[3/4] bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden pointer-events-none">
            <img src={row.imageUrl} alt={row.productName} className="w-full h-full object-cover" />
        </div>
      </div>
      <div> <a href="#" className="font-medium text-purple-600 hover:underline leading-tight block">{row.productName}</a> <div className="text-gray-500 mt-0.5">ID {row.nmId}</div> </div> </div> </td> 
      <td className="px-2 py-1.5 align-top">
        {editingGroupId === group.id ? (
            <textarea value={row.campaignName} onChange={(e) => handleUpdateCampaign(group.id, row.id, 'campaignName', e.target.value)} rows={2} className={`${editableInputClass} resize-y min-h-[34px]`} />
        ) : (
            <div className="tooltip w-full">
                <textarea value={row.campaignName} readOnly rows={2} className='w-full bg-transparent p-0 resize-none outline-none cursor-not-allowed' />
                <span className="tooltip-text">Нажмите «Редактировать», чтобы изменить</span>
            </div>
        )}
      </td>
      <td className="px-2 py-1.5 text-gray-600 align-top">{row.category}</td> <td className="px-2 py-1.5 text-gray-600 align-top">{group.config.bidType === BidType.MANUAL ? 'Ручная' : 'Единая'}</td> <td className="px-2 py-1.5 align-top text-gray-800"> {editingGroupId === group.id ? ( <select value={row.fundingSource} onChange={(e) => handleUpdateCampaign(group.id, row.id, 'fundingSource', e.target.value)} className={editableInputClass} > <option value="Баланс">Баланс</option> <option value="Счет">Счет</option> </select> ) : ( row.fundingSource )} </td> 
      <td className="px-2 py-1.5 text-gray-800 align-top">
        {editingGroupId === group.id ? (
            <input type="number" value={row.budget} onChange={(e) => handleUpdateCampaign(group.id, row.id, 'budget', Number(e.target.value))} className={editableInputClass}/>
        ) : (
            <div className="tooltip">
                <span className="cursor-not-allowed">{`${row.budget.toLocaleString()} ₽`}</span>
                <span className="tooltip-text">Нажмите «Редактировать», чтобы изменить</span>
            </div>
        )}
      </td>
      <td className="px-2 py-1.5 align-top">
        {editingGroupId === group.id ? (
            <a href="#" onClick={(e) => { e.preventDefault(); openBulkActionModal('autobidder'); }} className="text-blue-600 hover:underline">настроить</a>
        ) : (
            <div className="tooltip">
                <span className="text-gray-400 cursor-not-allowed">настроить</span>
                <span className="tooltip-text">Нажмите «Редактировать», чтобы изменить</span>
            </div>
        )}
      </td>
      {isCpmManual ? <> 
        <td className="px-2 py-1.5 text-gray-800 align-top">
            <div className="w-2/3">
                {editingGroupId === group.id ? (
                    <BidInput paymentModel={group.config.paymentModel} value={row.searchBid || 0} onChange={(val) => handleUpdateCampaign(group.id, row.id, 'searchBid', val)} />
                ) : (
                    <div className="tooltip">
                        <span className="cursor-not-allowed">{`${row.searchBid || 0} ₽`}</span>
                        <span className="tooltip-text">Нажмите «Редактировать», чтобы изменить</span>
                    </div>
                )}
            </div>
        </td> 
        <td className="px-2 py-1.5 text-gray-800 align-top">
            <div className="w-2/3">
                {editingGroupId === group.id ? (
                    <BidInput paymentModel={group.config.paymentModel} value={row.recommendationsBid || 0} onChange={(val) => handleUpdateCampaign(group.id, row.id, 'recommendationsBid', val)} />
                ) : (
                     <div className="tooltip">
                        <span className="cursor-not-allowed">{`${row.recommendationsBid || 0} ₽`}</span>
                        <span className="tooltip-text">Нажмите «Редактировать», чтобы изменить</span>
                    </div>
                )}
            </div>
        </td> 
        </> : 
        <td className="px-2 py-1.5 text-gray-800 align-top">
            <div className="w-2/3">
                {editingGroupId === group.id ? (
                    <BidInput paymentModel={group.config.paymentModel} value={row.bid || 0} onChange={(val) => handleUpdateCampaign(group.id, row.id, 'bid', val)} />
                ) : (
                     <div className="tooltip">
                        <span className="cursor-not-allowed">{`${row.bid || 0} ₽`}</span>
                        <span className="tooltip-text">Нажмите «Редактировать», чтобы изменить</span>
                    </div>
                )}
            </div>
        </td> 
      } 
      <td className="px-2 py-1.5 align-top"><ToggleSwitch checked={row.usePromoBonuses} onChange={(checked) => handleUpdateCampaign(group.id, row.id, 'usePromoBonuses', checked)} disabled={editingGroupId !== group.id}/></td> 
      <td className="px-2 py-1.5 align-top">
        <div className="flex items-center gap-2">
            <ToggleSwitch checked={row.autoReplenishment} onChange={(checked) => handleUpdateCampaign(group.id, row.id, 'autoReplenishment', checked)} disabled={editingGroupId !== group.id}/>
            {row.autoReplenishment && editingGroupId === group.id && (
                <button onClick={() => openAutoRefillModal(row)} className="text-gray-400 hover:text-purple-600">
                    <Settings className="w-4 h-4" />
                </button>
            )}
        </div>
      </td> 
      <td className="px-2 py-1.5 text-left align-top">
        <div className="tooltip">
            <button onClick={() => handleDeleteCampaign(row.id)} className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-100 transition-colors">
                <Trash2 className="w-4 h-4" />
            </button>
            <span className="tooltip-text">Удалить</span>
        </div>
      </td> 
      </tr> ))} </tbody> {validCount > 0 && ( <tfoot className="border-t-2 border-gray-200 bg-gray-50/50"> <tr> <td colSpan={5} className="px-2 py-2 font-bold text-gray-800 text-sm text-left">Итого по группе:</td> <td colSpan={5} className="px-2 py-2 text-xs"> <div className="text-gray-600">Баланс: <span className="font-semibold text-gray-800">{totals.balance.toLocaleString('ru-RU')} ₽</span></div> <div className="text-gray-600">Счет: <span className="font-semibold text-gray-800">{totals.account.toLocaleString('ru-RU')} ₽</span></div> </td> <td colSpan={isCpmManual ? 4 : 3} className="px-2 py-2 font-bold text-lg text-gray-900 text-right"> {totals.total.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 })} </td> </tr> </tfoot> )} </table> </div> <Pagination total={validCount} pageSize={PAGE_SIZE} current={group.currentPage} onChange={(page) => handlePageChange(group.id, page)} /> </section> ) })}</div>
        ) : (
            <EmptyStatePlaceholder />
        )}
    </main> 
    
    {selectedCampaignIds.length > 0 && (
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-2xl z-[80] p-3 flex flex-col items-center gap-1 animate-in slide-in-from-bottom-4 fade-in border border-gray-200">
          <span className="text-xs text-gray-500 font-medium mb-1">Выбрано {selectedCampaignIds.length}</span>
          <div className="flex items-center gap-1">
           <button onClick={() => openBulkActionModal('budget')} className="px-3 py-1.5 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 text-gray-700">
             <DollarSign className="w-4 h-4 text-gray-500" />
             <span>Задать бюджет</span>
           </button>
           <button onClick={() => openBulkActionModal('bid')} className="px-3 py-1.5 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 text-gray-700">
             <Zap className="w-4 h-4 text-gray-500" />
             <span>Задать ставки</span>
           </button>
           <button onClick={() => openBulkActionModal('funding')} className="px-3 py-1.5 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 text-gray-700">
             <Wallet className="w-4 h-4 text-gray-500" />
             <span>Источник</span>
           </button>
           <button onClick={() => openBulkActionModal('autorefill')} className="px-3 py-1.5 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 text-gray-700">
             <RefreshCw className="w-4 h-4 text-gray-500" />
             <span>Настроить АП</span>
           </button>
           <button onClick={() => openBulkActionModal('autobidder')} className="px-3 py-1.5 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 text-gray-700">
             <Wand className="w-4 h-4 text-gray-500" />
             <span>Автобиддер</span>
           </button>
           <div className="h-6 w-px bg-gray-200 mx-1"></div>
            <div className="tooltip">
             <button onClick={() => openBulkActionModal('delete')} className="p-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5">
               <Trash2 className="w-4 h-4" />
             </button>
             <span className="tooltip-text">Удалить</span>
            </div>
           <button onClick={() => setSelectedCampaignIds([])} className="ml-2 p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full">
             <X className="w-5 h-5" />
           </button>
          </div>
      </div>
    )}

    {totalAllValidCount > 0 && selectedCampaignIds.length === 0 && editingGroupId === null && ( 
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-sm border-t border-gray-200"> 
    <div className="max-w-[1392px] mx-auto px-6 py-4 flex justify-between items-center"> 
    <div> <h3 className="font-bold text-gray-800">Общий итог к списанию за {totalAllValidCount} {getPlural(totalAllValidCount, 'кампанию', 'кампании', 'кампаний')}</h3> 
        <div className="flex items-center gap-6 text-sm mt-1"> 
            <div> 
                <span className="text-gray-500">Баланс: </span> 
                <span className="font-semibold text-gray-900">{globalTotals.balance.toLocaleString('ru-RU')} ₽</span> 
                {globalBalanceDeficit > 0 && 
                    <span className="ml-2 text-red-500 font-medium">
                        (не хватает {globalBalanceDeficit.toLocaleString('ru-RU')} ₽ 
                        <a href="#" onClick={(e) => e.preventDefault()} className="text-blue-600 font-medium hover:underline text-sm ml-2">пополнить</a>)
                    </span>
                } 
            </div> 
            <div> 
                <span className="text-gray-500">Счет: </span> 
                <span className="font-semibold text-gray-900">{globalTotals.account.toLocaleString('ru-RU')} ₽</span> 
                {globalAccountDeficit > 0 && 
                    <span className="ml-2 text-red-500 font-medium">
                        (не хватает {globalAccountDeficit.toLocaleString('ru-RU')} ₽
                        <a href="#" onClick={(e) => e.preventDefault()} className="text-blue-600 font-medium hover:underline text-sm ml-2">пополнить</a>)
                    </span>
                } 
            </div> 
            <div className="pl-6 border-l border-gray-200 flex items-center gap-4"> 
                <div> 
                    <span className="text-gray-500">Всего: </span> 
                    <span className="font-bold text-lg text-purple-600"> {globalTotals.total.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 })} </span> 
                </div> 
            </div> 
        </div> 
    </div>
    <div className="flex items-center gap-4">
        {(globalBalanceDeficit > 0 || globalAccountDeficit > 0) && launchPreview.readyToLaunchCount > 0 && (
            <div className="flex items-start gap-2 max-w-md mr-4 text-xs text-gray-800 leading-tight">
                <Bell className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <div className="text-left">
                    Не хватает средств для {launchPreview.readyToLaunchCount} {getPlural(launchPreview.readyToLaunchCount, 'кампании', 'кампаний', 'кампаний')}.<br/>
                    Они будут созданы в статусе «Готово к запуску».
                </div>
            </div>
        )}
        <button onClick={launchCampaigns} disabled={isLaunching} className="px-8 py-4 rounded-xl text-lg font-bold shadow-lg shadow-purple-200 transition-all transform hover:-translate-y-0.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:shadow-xl disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed"> {`Запустить ${totalAllValidCount} ${getPlural(totalAllValidCount, 'кампанию', 'кампании', 'кампаний')}`} </button>
    </div>
    </div> </footer> )} </div> );
}