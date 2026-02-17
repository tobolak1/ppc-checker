import { supabase } from "@/lib/supabase";

// Re-export supabase as the main db access
export const db = supabase;

// Table name helpers (all prefixed with ppc_)
export const T = {
  users: "ppc_users",
  projects: "ppc_projects",
  userProjects: "ppc_user_projects",
  adAccounts: "ppc_ad_accounts",
  merchantAccounts: "ppc_merchant_accounts",
  checkRuns: "ppc_check_runs",
  findings: "ppc_findings",
  alerts: "ppc_alerts",
  campaignTemplates: "ppc_campaign_templates",
  generatedCampaigns: "ppc_generated_campaigns",
  syncLogs: "ppc_sync_logs",
  checkConfigs: "ppc_check_configs",
} as const;

export type {
  Platform, Severity, AlertStatus, CampaignType, SyncAction,
  UserRole, CheckRunStatus, GeneratedCampaignStatus,
  User, Project, UserProject, AdAccount, MerchantAccount,
  CheckRun, Finding, Alert, CampaignTemplate, GeneratedCampaign,
  SyncLog, CheckConfig
} from "./types";
