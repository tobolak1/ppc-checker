import { describe, it, expect } from "vitest";
import { generateCampaignPreview } from "./generate";
import { FeedProduct } from "../templates/types";

const products: FeedProduct[] = [
  { id: "1", title: "Nike Air Max", brand: "Nike", category: "Shoes", price: 2500, availability: "in_stock" },
  { id: "2", title: "Adidas Ultraboost", brand: "Adidas", category: "Shoes", price: 3500, availability: "in_stock" },
  { id: "3", title: "Nike T-Shirt", brand: "Nike", category: "Clothing", price: 800, availability: "out_of_stock" },
];

describe("generateCampaignPreview", () => {
  it("generates preview with all products when no filters", () => {
    const preview = generateCampaignPreview({
      name: "Test Campaign",
      type: "SHOPPING",
      platform: "GOOGLE_ADS",
      products,
    });
    expect(preview.campaignName).toBe("Test Campaign");
    expect(preview.totalProducts).toBe(3);
    expect(preview.adGroups).toHaveLength(1);
  });

  it("filters by availability", () => {
    const preview = generateCampaignPreview({
      name: "Test",
      type: "SEARCH",
      platform: "GOOGLE_ADS",
      products,
      filters: { availability: "in_stock" },
    });
    expect(preview.totalProducts).toBe(2);
  });

  it("filters by price range", () => {
    const preview = generateCampaignPreview({
      name: "Test",
      type: "SEARCH",
      platform: "GOOGLE_ADS",
      products,
      filters: { minPrice: 1000, maxPrice: 3000 },
    });
    expect(preview.totalProducts).toBe(1);
  });

  it("segments into multiple ad groups", () => {
    const preview = generateCampaignPreview({
      name: "Test",
      type: "SEARCH",
      platform: "GOOGLE_ADS",
      products,
      segmentation: [{ type: "category", field: "category" }],
    });
    expect(preview.adGroups.length).toBeGreaterThan(1);
  });

  it("expands ad template placeholders", () => {
    const preview = generateCampaignPreview({
      name: "Test",
      type: "SEARCH",
      platform: "GOOGLE_ADS",
      products: [products[0]],
      adTemplates: [{
        headlines: ["{product_name}", "{brand} - {price}"],
        descriptions: ["Buy {product_name} from {brand}"],
      }],
    });
    const ads = preview.adGroups[0].ads;
    expect(ads).toHaveLength(1);
    expect(ads![0].headlines[0]).toBe("Nike Air Max");
    expect(ads![0].headlines[1]).toBe("Nike - 2500");
    expect(ads![0].descriptions[0]).toBe("Buy Nike Air Max from Nike");
  });

  it("warns about long headlines", () => {
    const preview = generateCampaignPreview({
      name: "Test",
      type: "SEARCH",
      platform: "GOOGLE_ADS",
      products: [{ ...products[0], title: "A Very Long Product Name That Exceeds Thirty Characters" }],
      adTemplates: [{
        headlines: ["{product_name}"],
        descriptions: ["Test"],
      }],
    });
    expect(preview.warnings.length).toBeGreaterThan(0);
    expect(preview.warnings[0]).toContain("Headline too long");
  });

  it("generates keywords for SEARCH but not SHOPPING", () => {
    const searchPreview = generateCampaignPreview({
      name: "Test",
      type: "SEARCH",
      platform: "GOOGLE_ADS",
      products,
    });
    const shoppingPreview = generateCampaignPreview({
      name: "Test",
      type: "SHOPPING",
      platform: "GOOGLE_ADS",
      products,
    });
    expect(searchPreview.adGroups[0].keywords!.length).toBeGreaterThan(0);
    expect(shoppingPreview.adGroups[0].keywords).toHaveLength(0);
  });
});
