import { describe, it, expect } from "vitest";
import { checkBilling } from "./billing";
import { AdAccountContext } from "./types";

const mockAccount: AdAccountContext = {
  id: "acc-1",
  projectId: "proj-1",
  platform: "GOOGLE_ADS",
  externalId: "123-456-7890",
  name: "Test Account",
  credentials: null,
};

describe("checkBilling", () => {
  it("returns empty when no credentials", async () => {
    const findings = await checkBilling(mockAccount);
    expect(findings).toHaveLength(0);
  });

  it("returns empty when credentials set but no API data", async () => {
    const findings = await checkBilling({ ...mockAccount, credentials: { token: "test" } });
    expect(findings).toHaveLength(0);
  });
});
