import { describe, it, expect } from "vitest";
import { checkProducts } from "./products";
import { MerchantAccountContext } from "./types";

const mockMerchant: MerchantAccountContext = {
  id: "mc-1",
  projectId: "proj-1",
  externalId: "",
  name: "Test MC",
  feedUrl: null,
};

describe("checkProducts", () => {
  it("returns info when no MC configured", async () => {
    const findings = await checkProducts(mockMerchant);
    expect(findings).toHaveLength(1);
    expect(findings[0].checkId).toBe("mc-no-credentials");
    expect(findings[0].severity).toBe("INFO");
  });

  it("returns empty when MC configured but no products", async () => {
    const findings = await checkProducts({ ...mockMerchant, externalId: "mc-123" });
    expect(findings).toHaveLength(0);
  });
});
