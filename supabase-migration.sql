-- PPC Checker Migration - run in Supabase SQL Editor
-- All tables prefixed with ppc_

-- Enums as text check constraints
CREATE TABLE IF NOT EXISTS ppc_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'CLIENT' CHECK (role IN ('ADMIN', 'AUDITOR', 'CLIENT')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ppc_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ppc_user_projects (
  user_id uuid REFERENCES ppc_users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES ppc_projects(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'CLIENT' CHECK (role IN ('ADMIN', 'AUDITOR', 'CLIENT')),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, project_id)
);

CREATE TABLE IF NOT EXISTS ppc_ad_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES ppc_projects(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL CHECK (platform IN ('GOOGLE_ADS', 'SKLIK')),
  external_id text NOT NULL,
  name text NOT NULL,
  active boolean DEFAULT true,
  credentials jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ppc_merchant_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES ppc_projects(id) ON DELETE CASCADE NOT NULL,
  external_id text NOT NULL,
  name text NOT NULL,
  feed_url text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ppc_check_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES ppc_projects(id) ON DELETE CASCADE NOT NULL,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  status text DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed'))
);

CREATE TABLE IF NOT EXISTS ppc_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_run_id uuid REFERENCES ppc_check_runs(id) ON DELETE CASCADE NOT NULL,
  check_id text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO')),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ppc_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id uuid REFERENCES ppc_findings(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RESOLVED', 'MUTED')),
  channel text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE IF NOT EXISTS ppc_campaign_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES ppc_projects(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  campaign_type text NOT NULL CHECK (campaign_type IN ('SHOPPING', 'PMAX', 'SEARCH', 'SEARCH_DSA', 'SKLIK_PRODUCT', 'SKLIK_TEXT')),
  platform text NOT NULL CHECK (platform IN ('GOOGLE_ADS', 'SKLIK')),
  filters jsonb,
  segmentation jsonb,
  ad_templates jsonb,
  budget numeric,
  bidding_strategy text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ppc_generated_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES ppc_campaign_templates(id) ON DELETE CASCADE NOT NULL,
  external_id text,
  name text NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'preview', 'active', 'paused', 'error')),
  synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ppc_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_campaign_id uuid REFERENCES ppc_generated_campaigns(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL CHECK (action IN ('CREATED', 'UPDATED', 'PAUSED', 'RESUMED', 'REMOVED')),
  changes jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ppc_check_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES ppc_projects(id) ON DELETE CASCADE NOT NULL,
  check_id text NOT NULL,
  enabled boolean DEFAULT true,
  threshold jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (project_id, check_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ppc_findings_check_id ON ppc_findings(check_id);
CREATE INDEX IF NOT EXISTS idx_ppc_findings_severity ON ppc_findings(severity);
CREATE INDEX IF NOT EXISTS idx_ppc_findings_created_at ON ppc_findings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ppc_check_runs_project ON ppc_check_runs(project_id);
CREATE INDEX IF NOT EXISTS idx_ppc_check_runs_started ON ppc_check_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_ppc_alerts_status ON ppc_alerts(status);
CREATE INDEX IF NOT EXISTS idx_ppc_ad_accounts_project ON ppc_ad_accounts(project_id);
CREATE INDEX IF NOT EXISTS idx_ppc_campaign_templates_project ON ppc_campaign_templates(project_id);

-- RLS policies (allow all for authenticated via anon key for now)
ALTER TABLE ppc_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppc_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppc_user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppc_ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppc_merchant_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppc_check_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppc_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppc_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppc_campaign_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppc_generated_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppc_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppc_check_configs ENABLE ROW LEVEL SECURITY;

-- Allow full access with anon key (for server-side usage)
CREATE POLICY "Allow all on ppc_users" ON ppc_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on ppc_projects" ON ppc_projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on ppc_user_projects" ON ppc_user_projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on ppc_ad_accounts" ON ppc_ad_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on ppc_merchant_accounts" ON ppc_merchant_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on ppc_check_runs" ON ppc_check_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on ppc_findings" ON ppc_findings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on ppc_alerts" ON ppc_alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on ppc_campaign_templates" ON ppc_campaign_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on ppc_generated_campaigns" ON ppc_generated_campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on ppc_sync_logs" ON ppc_sync_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on ppc_check_configs" ON ppc_check_configs FOR ALL USING (true) WITH CHECK (true);
