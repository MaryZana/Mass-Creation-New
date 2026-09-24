export enum PaymentModel {
  CPC = 'CPC',
  CPM = 'CPM'
}

export enum BidType {
  UNIFIED = 'Unified',
  MANUAL = 'Manual'
}

export enum CampaignStatus {
  VALID = 'Valid',
  ERROR = 'Error',
  CORRECTED = 'Corrected' // Auto-corrected by the system
}

export enum AppStep {
  CONFIG = 1,
  DOWNLOAD = 2,
  UPLOAD = 3,
  VALIDATION = 4,
  REVIEW = 5,
  SUCCESS = 6
}

export interface CampaignConfig {
  paymentModel: PaymentModel;
  bidType: BidType;
  categories: string[];
}

export interface CorrectionDetails {
  field: 'bid' | 'budget' | 'searchBid' | 'recommendationsBid';
  oldValue: number;
  newValue: number;
  reason: string;
}

export interface CampaignRecord {
  id: string;
  nmId: number; // Nomenclature ID / SKU
  productName: string;
  campaignName: string; // New field for the campaign name
  imageUrl: string;
  category: string;
  /** Остаток на складе (шт.) */
  stockLeft?: number;
  keyword?: string;
  bid?: number; // For unified bid
  searchBid?: number; // For CPM manual search
  recommendationsBid?: number; // For CPM manual recommendations
  budget: number;
  /** Дневной лимит ₽; null/undefined — «Настроить лимит» */
  dailyLimit?: number | null;
  bonusAmount?: number; // Amount funded by bonuses
  /** Выбранный пакет промо-бонусов */
  bonusPackageId?: string;
  autoReplenishment: boolean;
  /** Порог автопополнения: если бюджет меньше, ₽ */
  autoRefillThreshold?: number;
  /** Сумма автопополнения, ₽ */
  autoRefillAmount?: number;
  fundingSource: 'Единый счёт'; // Changed to Unified Account
  status: CampaignStatus;
  errorMessage?: string;
  correctionDetails?: CorrectionDetails[]; // Detailed info for auto-corrections, now an array
  usePromoBonuses: boolean; // New field for promo bonuses toggle
  source: string; // New field for the source (filename or 'Manual')
  cpcCompatible?: boolean;
  /** CTR товара для колонки «Рост» (подборка) */
  prospectCtr?: number;
  /** Изменение CTR относительно подкатегории, % (например +10) */
  prospectCtrChange?: number;
}