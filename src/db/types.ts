// Types that replace Prisma-generated types
// Maps to ppc_* tables in Supabase

export type Platform = "GOOGLE_ADS" | "SKLIK";
export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
export type AlertStatus = "ACTIVE" | "RESOLVED" | "MUTED";
export type CampaignType = "SHOPPING" | "PMAX" | "SEARCH" | "SEARCH_DSA" | "SKLIK_PRODUCT" | "SKLIK_TEXT";
export type SyncAction = "CREATED" | "UPDATED" | "PAUSED" | "RESUMED" | "REMOVED";
export type UserRole = "ADMIN" | "AUDITOR" | "CLIENT";
export type CheckRunStatus = "running" | "completed" | "failed";
export type GeneratedCampaignStatus = "draft" | "preview" | "active" | "paused" | "error";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProject {
  user_id: string;
  project_id: string;
  role: UserRole;
  created_at: string;
}

export interface AdAccount {
  id: string;
  project_id: string;
  platform: Platform;
  external_id: string;
  name: string;
  active: boolean;
  credentials: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface MerchantAccount {
  id: string;
  project_id: string;
  external_id: string;
  name: string;
  feed_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CheckRun {
  id: string;
  project_id: string;
  started_at: string;
  ended_at: string | null;
  status: CheckRunStatus;
}

export interface Finding {
  id: string;
  check_run_id: string;
  check_id: string;
  severity: Severity;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  resolved_at: string | null;
  created_at: string;
}

export interface Alert {
  id: string;
  finding_id: string;
  status: AlertStatus;
  channel: string;
  sent_at: string;
  resolved_at: string | null;
}

export interface CampaignTemplate {
  id: string;
  project_id: string;
  name: string;
  campaign_type: CampaignType;
  platform: Platform;
  filters: Record<string, unknown> | null;
  segmentation: Record<string, unknown> | null;
  ad_templates: Record<string, unknown> | null;
  budget: number | null;
  bidding_strategy: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GeneratedCampaign {
  id: string;
  template_id: string;
  external_id: string | null;
  name: string;
  status: GeneratedCampaignStatus;
  synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SyncLog {
  id: string;
  generated_campaign_id: string;
  action: SyncAction;
  changes: Record<string, unknown> | null;
  created_at: string;
}

export interface CheckConfig {
  id: string;
  project_id: string;
  check_id: string;
  enabled: boolean;
  threshold: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}
