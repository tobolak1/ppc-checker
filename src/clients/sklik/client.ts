import { BaseApiClient } from "../base-client";

interface SklikConfig {
  apiToken: string;
}

interface SklikCampaign {
  id: number;
  name: string;
  status: string;
  budget: number;
}

interface SklikGroup {
  id: number;
  campaignId: number;
  name: string;
  status: string;
}

interface SklikCampaignCreateInput {
  name: string;
  budget: number;
  type: "product" | "text";
}

interface SklikGroupCreateInput {
  campaignId: number;
  name: string;
  keywords?: { text: string; matchType: string }[];
  ads?: { title: string; description: string; url: string }[];
}

export class SklikClient extends BaseApiClient {
  private config: SklikConfig;

  constructor(config: SklikConfig) {
    super({
      serviceName: "Sklik",
      baseUrl: "https://api.sklik.cz/drak/json",
      timeoutMs: 30000,
      maxRetries: 3,
      rateLimit: { maxTokens: 5, refillPerSecond: 1 },
    });
    this.config = config;
  }

  async getCampaigns(): Promise<SklikCampaign[]> {
    return this.request<SklikCampaign[]>("/campaigns.list", {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify({ session: this.config.apiToken }),
    });
  }

  async getGroups(campaignId: number): Promise<SklikGroup[]> {
    return this.request<SklikGroup[]>("/groups.list", {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify({ session: this.config.apiToken, campaignId }),
    });
  }

  async createCampaign(input: SklikCampaignCreateInput): Promise<SklikCampaign> {
    return this.request<SklikCampaign>("/campaigns.create", {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify({ session: this.config.apiToken, ...input }),
    });
  }

  async createGroup(input: SklikGroupCreateInput): Promise<SklikGroup> {
    return this.request<SklikGroup>("/groups.create", {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify({ session: this.config.apiToken, ...input }),
    });
  }

  async getBillingInfo(): Promise<{ balance: number; currency: string }> {
    return this.request("/client.getAttributes", {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify({ session: this.config.apiToken }),
    });
  }

  private buildHeaders(): Record<string, string> {
    return { "Content-Type": "application/json" };
  }
}
