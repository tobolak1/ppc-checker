import { ApiError, AuthError, RateLimitError, TimeoutError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { RateLimiter } from "@/lib/rate-limiter";

interface BaseClientConfig {
  serviceName: string;
  baseUrl: string;
  timeoutMs?: number;
  maxRetries?: number;
  rateLimit?: { maxTokens: number; refillPerSecond: number };
}

export class BaseApiClient {
  protected serviceName: string;
  protected baseUrl: string;
  protected timeoutMs: number;
  protected maxRetries: number;
  protected rateLimiter: RateLimiter;

  constructor(config: BaseClientConfig) {
    this.serviceName = config.serviceName;
    this.baseUrl = config.baseUrl;
    this.timeoutMs = config.timeoutMs ?? 30000;
    this.maxRetries = config.maxRetries ?? 3;
    this.rateLimiter = new RateLimiter(
      config.rateLimit?.maxTokens ?? 10,
      config.rateLimit?.refillPerSecond ?? 2
    );
  }

  protected async request<T>(path: string, init?: RequestInit): Promise<T> {
    await this.rateLimiter.acquire();
    const url = `${this.baseUrl}${path}`;
    const requestId = crypto.randomUUID();

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      const start = Date.now();
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

        const res = await fetch(url, { ...init, signal: controller.signal });
        clearTimeout(timeout);

        const duration = Date.now() - start;
        logger.info(`${this.serviceName} ${init?.method || "GET"} ${path}`, {
          requestId, status: res.status, duration, attempt,
        });

        if (res.status === 401) throw new AuthError(this.serviceName);
        if (res.status === 429) {
          const retryAfter = parseInt(res.headers.get("retry-after") || "5") * 1000;
          throw new RateLimitError(this.serviceName, retryAfter);
        }
        if (!res.ok) throw new ApiError(await res.text(), res.status, this.serviceName, requestId);

        return (await res.json()) as T;
      } catch (err) {
        if (err instanceof AuthError) throw err;

        if (err instanceof DOMException && err.name === "AbortError") {
          if (attempt === this.maxRetries) throw new TimeoutError(this.serviceName, this.timeoutMs);
        }

        if (err instanceof RateLimitError) {
          await this.sleep(err.retryAfterMs);
          continue;
        }

        if (attempt < this.maxRetries) {
          const backoff = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
          logger.warn(`${this.serviceName} retry ${attempt}/${this.maxRetries}`, {
            requestId, error: (err as Error).message,
          });
          await this.sleep(backoff);
          continue;
        }
        throw err;
      }
    }
    throw new ApiError("Max retries exceeded", 0, this.serviceName);
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
