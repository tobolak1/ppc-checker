import type { CampaignType, Platform } from "@/db/types";
import { segmentProducts } from "../segmentation/segment";
import {
  AdTemplate, CampaignPreview, FeedProduct,
  GeneratedAdGroup, ProductFilter, SegmentationRule,
} from "../templates/types";

interface GenerateInput {
  name: string;
  type: CampaignType;
  platform: Platform;
  products: FeedProduct[];
  filters?: ProductFilter;
  segmentation?: SegmentationRule[];
  adTemplates?: AdTemplate[];
  budget?: number;
}

export function generateCampaignPreview(input: GenerateInput): CampaignPreview {
  const warnings: string[] = [];

  // Apply filters
  let filtered = filterProducts(input.products, input.filters);
  if (filtered.length === 0) {
    warnings.push("No products match the selected filters.");
  }

  // Segment products
  const segments = segmentProducts(filtered, input.segmentation || []);

  // Generate ad groups
  const adGroups: GeneratedAdGroup[] = segments.map((seg) => {
    const ads = input.adTemplates
      ? input.adTemplates.map((tpl) => expandAdTemplate(tpl, seg.products[0]))
      : [];

    const keywords = generateKeywords(seg.products, input.type);

    // Check for warnings
    for (const ad of ads) {
      for (const h of ad.headlines) {
        if (h.length > 30) warnings.push(`Headline too long (${h.length}/30): "${h.slice(0, 40)}..."`);
      }
      for (const d of ad.descriptions) {
        if (d.length > 90) warnings.push(`Description too long (${d.length}/90): "${d.slice(0, 40)}..."`);
      }
    }

    return {
      name: seg.name,
      products: seg.products,
      keywords,
      ads,
    };
  });

  return {
    campaignName: input.name,
    type: input.type,
    platform: input.platform,
    adGroups,
    totalProducts: filtered.length,
    estimatedDailyBudget: input.budget || 0,
    warnings,
  };
}

function filterProducts(products: FeedProduct[], filters?: ProductFilter): FeedProduct[] {
  if (!filters) return products;

  return products.filter((p) => {
    if (filters.categories?.length && !filters.categories.includes(p.category || "")) return false;
    if (filters.brands?.length && !filters.brands.includes(p.brand || "")) return false;
    if (filters.minPrice !== undefined && p.price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && p.price > filters.maxPrice) return false;
    if (filters.availability && filters.availability !== "all" && p.availability !== filters.availability) return false;
    if (filters.customLabels) {
      for (const cl of filters.customLabels) {
        const productLabel = p.customLabels?.[cl.index];
        if (!productLabel || !cl.values.includes(productLabel)) return false;
      }
    }
    return true;
  });
}

function expandAdTemplate(
  template: AdTemplate,
  sampleProduct: FeedProduct
): { headlines: string[]; descriptions: string[] } {
  const replace = (text: string): string =>
    text
      .replace(/\{product_name\}/g, sampleProduct.title)
      .replace(/\{brand\}/g, sampleProduct.brand || "")
      .replace(/\{price\}/g, sampleProduct.price.toString())
      .replace(/\{sale_price\}/g, (sampleProduct.salePrice || sampleProduct.price).toString())
      .replace(/\{category\}/g, sampleProduct.category || "");

  return {
    headlines: template.headlines.map(replace),
    descriptions: template.descriptions.map(replace),
  };
}

function generateKeywords(
  products: FeedProduct[],
  type: CampaignType
): { text: string; matchType: string }[] {
  if (type === "SHOPPING" || type === "PMAX") return []; // Shopping/PMax don't use keywords

  const keywords = new Set<string>();
  for (const p of products) {
    keywords.add(p.title.toLowerCase());
    if (p.brand) keywords.add(p.brand.toLowerCase());
    if (p.category) keywords.add(p.category.toLowerCase());
    // Combine brand + category
    if (p.brand && p.category) {
      keywords.add(`${p.brand} ${p.category}`.toLowerCase());
    }
  }

  return [...keywords].slice(0, 100).map((text) => ({
    text,
    matchType: "PHRASE",
  }));
}
