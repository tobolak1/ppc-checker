import type { Platform, Severity } from "@/db/types";

export interface CheckFinding {
  checkId: string;
  severity: Severity;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface AdAccountContext {
  id: string;
  projectId: string;
  platform: Platform;
  externalId: string;
  name: string;
  credentials: Record<string, unknown> | null;
}

export interface MerchantAccountContext {
  id: string;
  projectId: string;
  externalId: string;
  name: string;
  feedUrl: string | null;
}

export interface CheckThresholds {
  [key: string]: unknown;
}

export type CheckFunction = (
  account: AdAccountContext,
  thresholds?: CheckThresholds
) => Promise<CheckFinding[]>;

export type MerchantCheckFunction = (
  account: MerchantAccountContext,
  thresholds?: CheckThresholds
) => Promise<CheckFinding[]>;

// Google Ads API data interfaces (used by checks when API is connected)
export interface GoogleAdsAd {
  id: string;
  adGroupId: string;
  adGroupName: string;
  type: "RSA" | "ETA" | "OTHER";
  status: "ENABLED" | "PAUSED" | "REMOVED" | "DISAPPROVED" | "UNDER_REVIEW" | "LIMITED";
  policyStatus?: string;
  headlines?: string[];
  descriptions?: string[];
  pinnedPositions?: number[];
  adStrength?: "EXCELLENT" | "GOOD" | "AVERAGE" | "POOR" | "UNRATED";
  promotionEndDate?: string;
  lastStatusChange?: string;
}

export interface GoogleAdsAdGroup {
  id: string;
  campaignId: string;
  name: string;
  status: "ENABLED" | "PAUSED" | "REMOVED";
  activeAdsCount: number;
}

export interface GoogleAdsKeyword {
  id: string;
  adGroupId: string;
  adGroupName: string;
  campaignId: string;
  campaignName: string;
  text: string;
  matchType: "EXACT" | "PHRASE" | "BROAD";
  status: "ENABLED" | "PAUSED" | "REMOVED";
  qualityScore?: number;
  impressions30d: number;
  isNegative: boolean;
}

export interface GoogleAdsSearchTerm {
  searchTerm: string;
  campaignName: string;
  adGroupName: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
}

export interface GoogleAdsCampaign {
  id: string;
  name: string;
  status: "ENABLED" | "PAUSED" | "REMOVED";
  previousStatus?: string;
  dailyBudget: number;
  previousDailyBudget?: number;
  biddingStrategy: string;
  previousBiddingStrategy?: string;
  dailySpend: number;
  statusChangeDate?: string;
}

export interface GoogleAdsBillingInfo {
  balance: number;
  currency: string;
  lastPaymentStatus: "SUCCESS" | "FAILED" | "PENDING";
  paymentMethods: { type: string; expiryDate?: string }[];
  dailySpend: number;
}

export interface GoogleAdsMetrics {
  date: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number;
  avgCpc: number;
  searchImpressionShareLostBudget?: number;
  searchImpressionShareLostRank?: number;
}

export interface GoogleAdsChangeEvent {
  changeType: "CAMPAIGN_STATUS" | "BUDGET" | "BID" | "ACCESS" | "CONVERSION_ACTION" | "BIDDING_STRATEGY";
  entityName: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  changeDate: string;
}

export interface MerchantProduct {
  id: string;
  title: string;
  status: "APPROVED" | "DISAPPROVED" | "PENDING";
  feedPrice: number;
  webPrice?: number;
  availability: "in_stock" | "out_of_stock" | "preorder";
  webAvailability?: "in_stock" | "out_of_stock";
  expirationDate?: string;
  category?: string;
}

export interface MerchantFeedDiagnostics {
  processingErrors: number;
  validationWarnings: number;
  lastProcessed?: string;
}

export interface MerchantAccountIssues {
  severity: "WARNING" | "ERROR" | "CRITICAL";
  description: string;
}
