import { describe, it, expect } from "vitest";
import { segmentProducts } from "./segment";
import { FeedProduct } from "../templates/types";

const products: FeedProduct[] = [
  { id: "1", title: "Nike Shoes", brand: "Nike", category: "Shoes", price: 100, availability: "in_stock" },
  { id: "2", title: "Adidas Shoes", brand: "Adidas", category: "Shoes", price: 120, availability: "in_stock" },
  { id: "3", title: "Nike Shirt", brand: "Nike", category: "Clothing", price: 50, availability: "in_stock" },
  { id: "4", title: "Puma Hat", brand: "Puma", category: "Accessories", price: 25, availability: "in_stock" },
];

describe("segmentProducts", () => {
  it("returns all products in one segment when no rules", () => {
    const segments = segmentProducts(products, []);
    expect(segments).toHaveLength(1);
    expect(segments[0].name).toBe("All Products");
    expect(segments[0].products).toHaveLength(4);
  });

  it("segments by category", () => {
    const segments = segmentProducts(products, [{ type: "category", field: "category" }]);
    expect(segments).toHaveLength(3);
    const shoesSeg = segments.find((s) => s.name === "Shoes");
    expect(shoesSeg?.products).toHaveLength(2);
  });

  it("segments by brand", () => {
    const segments = segmentProducts(products, [{ type: "brand", field: "brand" }]);
    expect(segments).toHaveLength(3);
    const nikeSeg = segments.find((s) => s.name === "Nike");
    expect(nikeSeg?.products).toHaveLength(2);
  });

  it("segments by price range", () => {
    const segments = segmentProducts(products, [{
      type: "priceRange",
      field: "price",
      ranges: [[0, 50], [50, 150]],
    }]);
    expect(segments).toHaveLength(2);
  });

  it("combines multiple segmentation rules", () => {
    const segments = segmentProducts(products, [
      { type: "brand", field: "brand" },
      { type: "category", field: "category" },
    ]);
    // Nike|Shoes, Adidas|Shoes, Nike|Clothing, Puma|Accessories
    expect(segments).toHaveLength(4);
  });
});
