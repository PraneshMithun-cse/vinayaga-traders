"use client";

import { useState } from "react";
import Link from "next/link";
import { PRODUCTS, Product } from "@/data/products";
import ProductCard from "./ProductCard";
import VariantModal from "./VariantModal";

export default function TrendingSection() {
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const trending = PRODUCTS
    .map(p => ({ p, maxDiscount: Math.max(...p.variants.map(v => v.discountPercent)) }))
    .sort((a, b) => b.maxDiscount - a.maxDiscount)
    .slice(0, 10)
    .map(x => x.p);

  return (
    <section style={{ padding: "16px 0 4px" }}>
      <div style={{ padding: "0 16px 8px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#282C3F", margin: 0 }}>
              Trending near you
            </h2>
            <div
              style={{
                display: "inline-block",
                marginTop: 6,
                backgroundColor: "#E8E8E8",
                borderRadius: 4,
                padding: "3px 10px",
                fontSize: 12,
                fontWeight: 600,
                color: "#282C3F",
              }}
            >
              Upto 50% OFF
            </div>
          </div>
          <Link
            href="/category/trending"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#0050FF",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 2,
              paddingTop: 2,
            }}
          >
            See All
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="#0050FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          overflowX: "auto",
          padding: "4px 16px 12px",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {trending.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            layout="horizontal"
            onAdd={setActiveProduct}
          />
        ))}
      </div>

      <VariantModal product={activeProduct} onClose={() => setActiveProduct(null)} />

      <style>{`div::-webkit-scrollbar{display:none}`}</style>
    </section>
  );
}
