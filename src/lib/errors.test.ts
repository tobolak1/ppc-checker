import { describe, it, expect } from "vitest";
import { ApiError, RateLimitError, AuthError, TimeoutError } from "./errors";

describe("Error classes", () => {
  it("creates ApiError with all fields", () => {
    const err = new ApiError("test error", 500, "TestService", "req-123");
    expect(err.message).toBe("test error");
    expect(err.statusCode).toBe(500);
    expect(err.service).toBe("TestService");
    expect(err.requestId).toBe("req-123");
    expect(err.name).toBe("ApiError");
    expect(err).toBeInstanceOf(Error);
  });

  it("creates RateLimitError", () => {
    const err = new RateLimitError("GoogleAds", 5000);
    expect(err.statusCode).toBe(429);
    expect(err.retryAfterMs).toBe(5000);
    expect(err.name).toBe("RateLimitError");
    expect(err).toBeInstanceOf(ApiError);
  });

  it("creates AuthError", () => {
    const err = new AuthError("Sklik");
    expect(err.statusCode).toBe(401);
    expect(err.name).toBe("AuthError");
  });

  it("creates TimeoutError", () => {
    const err = new TimeoutError("MerchantCenter", 30000);
    expect(err.statusCode).toBe(408);
    expect(err.message).toContain("30000ms");
    expect(err.name).toBe("TimeoutError");
  });
});
