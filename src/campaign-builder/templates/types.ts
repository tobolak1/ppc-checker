import type { CampaignType, Platform } from "@/db/types";

export interface SegmentationRule {
  type: "category" | "brand" | "priceRange" | "customLabel" | "margin";
  field: string;
  /** For priceRange: [min, max] pairs */
  ranges?: [number, number][];
  /** For customLabel: which label index (0-4) */
  labelIndex?: number;
}

export interface AdTemplate {
  headlines: string[];
  descriptions: string[];
}

export interface CampaignTemplateInput {
  projectId: string;
  name: string;
  campaignType: CampaignType;
  platform: Platform;
  filters?: ProductFilter;
  segmentation?: SegmentationRule[];
  adTemplates?: AdTemplate[];
  budget?: number;
  biddingStrategy?: string;
}

export interface ProductFilter {
  categories?: string[];
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  availability?: "in_stock" | "out_of_stock" | "all";
  customLabels?: { index: number; values: string[] }[];
}

export interface FeedProduct {
  id: string;
  title: string;
  brand?: string;
  category?: string;
  price: number;
  salePrice?: number;
  availability: string;
  customLabels?: string[];
  imageUrl?: string;
  link?: string;
}

export interface GeneratedAdGroup {
  name: string;
  products: FeedProduct[];
  keywords?: { text: string; matchType: string }[];
  ads?: { headlines: string[]; descriptions: string[] }[];
}

export interface CampaignPreview {
  campaignName: string;
  type: CampaignType;
  platform: Platform;
  adGroups: GeneratedAdGroup[];
  totalProducts: number;
  estimatedDailyBudget: number;
  warnings: string[];
}
