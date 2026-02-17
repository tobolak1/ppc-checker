import { describe, it, expect } from "vitest";
import { RateLimiter } from "./rate-limiter";

describe("RateLimiter", () => {
  it("allows immediate acquire when tokens available", async () => {
    const limiter = new RateLimiter(5, 1);
    const start = Date.now();
    await limiter.acquire();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(50);
  });

  it("depletes tokens with multiple acquires", async () => {
    const limiter = new RateLimiter(3, 10);
    await limiter.acquire();
    await limiter.acquire();
    await limiter.acquire();
    // Fourth should still work quickly due to high refill rate
    const start = Date.now();
    await limiter.acquire();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(500);
  });
});
