import { BaseApiClient } from "../base-client";

interface MerchantConfig {
  merchantId: string;
  accessToken: string;
}

interface Product {
  id: string;
  title: string;
  price: { value: string; currency: string };
  availability: string;
  status: string;
  category?: string;
  brand?: string;
  customLabels?: string[];
}

interface FeedStatus {
  processingErrors: number;
  warnings: number;
  lastProcessed: string;
}

export class MerchantClient extends BaseApiClient {
  private config: MerchantConfig;

  constructor(config: MerchantConfig) {
    super({
      serviceName: "MerchantCenter",
      baseUrl: "https://shoppingcontent.googleapis.com/content/v2.1",
      timeoutMs: 30000,
      maxRetries: 3,
      rateLimit: { maxTokens: 10, refillPerSecond: 2 },
    });
    this.config = config;
  }

  async getProducts(pageToken?: string): Promise<{ products: Product[]; nextPageToken?: string }> {
    const url = `/products?merchantId=${this.config.merchantId}${pageToken ? `&pageToken=${pageToken}` : ""}`;
    return this.request(url, { headers: this.buildHeaders() });
  }

  async getAllProducts(): Promise<Product[]> {
    const allProducts: Product[] = [];
    let pageToken: string | undefined;
    do {
      const result = await this.getProducts(pageToken);
      allProducts.push(...result.products);
      pageToken = result.nextPageToken;
    } while (pageToken);
    return allProducts;
  }

  async getProductStatus(productId: string): Promise<{ status: string; issues: string[] }> {
    return this.request(
      `/products/${productId}/status?merchantId=${this.config.merchantId}`,
      { headers: this.buildHeaders() }
    );
  }

  async getFeedDiagnostics(): Promise<FeedStatus> {
    return this.request(
      `/feeds?merchantId=${this.config.merchantId}`,
      { headers: this.buildHeaders() }
    );
  }

  private buildHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.config.accessToken}`,
    };
  }
}
