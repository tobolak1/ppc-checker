import { BaseApiClient } from "../base-client";

interface GoogleAdsConfig {
  clientId: string;
  clientSecret: string;
  developerToken: string;
  refreshToken: string;
  customerId: string;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  budget: number;
  biddingStrategy: string;
}

interface AdGroup {
  id: string;
  campaignId: string;
  name: string;
  status: string;
  cpcBid?: number;
}

interface CampaignCreateInput {
  name: string;
  budget: number;
  biddingStrategy: string;
  type: "SHOPPING" | "PMAX" | "SEARCH";
  targetCountry?: string;
}

interface AdGroupCreateInput {
  campaignId: string;
  name: string;
  keywords?: { text: string; matchType: string }[];
  ads?: { headlines: string[]; descriptions: string[] }[];
}

export class GoogleAdsClient extends BaseApiClient {
  private config: GoogleAdsConfig;

  constructor(config: GoogleAdsConfig) {
    super({
      serviceName: "GoogleAds",
      baseUrl: "https://googleads.googleapis.com/v17",
      timeoutMs: 30000,
      maxRetries: 3,
      rateLimit: { maxTokens: 10, refillPerSecond: 2 },
    });
    this.config = config;
  }

  async getCampaigns(): Promise<Campaign[]> {
    return this.request<Campaign[]>(
      `/customers/${this.config.customerId}/campaigns`,
      { headers: this.buildHeaders() }
    );
  }

  async getAdGroups(campaignId: string): Promise<AdGroup[]> {
    return this.request<AdGroup[]>(
      `/customers/${this.config.customerId}/adGroups?campaignId=${campaignId}`,
      { headers: this.buildHeaders() }
    );
  }

  async createCampaign(input: CampaignCreateInput): Promise<Campaign> {
    return this.request<Campaign>(
      `/customers/${this.config.customerId}/campaigns:mutate`,
      {
        method: "POST",
        headers: this.buildHeaders(),
        body: JSON.stringify({ operations: [{ create: input }] }),
      }
    );
  }

  async createAdGroup(input: AdGroupCreateInput): Promise<AdGroup> {
    return this.request<AdGroup>(
      `/customers/${this.config.customerId}/adGroups:mutate`,
      {
        method: "POST",
        headers: this.buildHeaders(),
        body: JSON.stringify({ operations: [{ create: input }] }),
      }
    );
  }

  async pauseAdGroup(adGroupId: string): Promise<void> {
    await this.request(
      `/customers/${this.config.customerId}/adGroups:mutate`,
      {
        method: "POST",
        headers: this.buildHeaders(),
        body: JSON.stringify({
          operations: [{ update: { resourceName: adGroupId, status: "PAUSED" } }],
        }),
      }
    );
  }

  private buildHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.config.refreshToken}`,
      "developer-token": this.config.developerToken,
      "login-customer-id": this.config.customerId,
    };
  }
}
