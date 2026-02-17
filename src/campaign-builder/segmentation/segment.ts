import { FeedProduct, SegmentationRule } from "../templates/types";

export interface Segment {
  name: string;
  products: FeedProduct[];
}

export function segmentProducts(
  products: FeedProduct[],
  rules: SegmentationRule[]
): Segment[] {
  if (rules.length === 0) {
    return [{ name: "All Products", products }];
  }

  const segments = new Map<string, FeedProduct[]>();

  for (const product of products) {
    const key = buildSegmentKey(product, rules);
    const existing = segments.get(key) || [];
    existing.push(product);
    segments.set(key, existing);
  }

  return [...segments.entries()]
    .map(([name, prods]) => ({ name, products: prods }))
    .sort((a, b) => b.products.length - a.products.length);
}

function buildSegmentKey(product: FeedProduct, rules: SegmentationRule[]): string {
  const parts: string[] = [];

  for (const rule of rules) {
    switch (rule.type) {
      case "category":
        parts.push(product.category || "Uncategorized");
        break;
      case "brand":
        parts.push(product.brand || "Unknown Brand");
        break;
      case "priceRange":
        if (rule.ranges) {
          const range = rule.ranges.find(([min, max]) => product.price >= min && product.price < max);
          parts.push(range ? `${range[0]}-${range[1]}` : "Other");
        }
        break;
      case "customLabel":
        if (product.customLabels && rule.labelIndex !== undefined) {
          parts.push(product.customLabels[rule.labelIndex] || "No Label");
        }
        break;
      case "margin":
        // Simplified: use sale price as proxy for margin
        if (product.salePrice && product.price > 0) {
          const margin = ((product.price - product.salePrice) / product.price) * 100;
          parts.push(margin > 30 ? "High Margin" : margin > 15 ? "Medium Margin" : "Low Margin");
        } else {
          parts.push("Unknown Margin");
        }
        break;
    }
  }

  return parts.join(" | ");
}
