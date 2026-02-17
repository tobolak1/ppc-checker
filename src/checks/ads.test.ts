import { describe, it, expect } from "vitest";
import { checkAds } from "./ads";
import { AdAccountContext } from "./types";

const mockAccount: AdAccountContext = {
  id: "acc-1",
  projectId: "proj-1",
  platform: "GOOGLE_ADS",
  externalId: "123-456-7890",
  name: "Test Account",
  credentials: null,
};

const accountWithCreds: AdAccountContext = {
  ...mockAccount,
  credentials: { token: "test" },
};

describe("checkAds", () => {
  it("returns info finding when no credentials", async () => {
    const findings = await checkAds(mockAccount);
    expect(findings).toHaveLength(1);
    expect(findings[0].checkId).toBe("ads-no-credentials");
    expect(findings[0].severity).toBe("INFO");
  });

  it("returns empty when credentials set but no API data", async () => {
    const findings = await checkAds(accountWithCreds);
    expect(findings).toHaveLength(0);
  });
});
