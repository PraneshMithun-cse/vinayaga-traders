"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useAdmin } from "@/context/AdminContext";
import ProductCard from "./ProductCard";
import VariantModal from "./VariantModal";

type SortKey = "relevance" | "price-asc" | "price-desc" | "discount";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "relevance", label: "Relevance" },
  { key: "price-asc", label: "Price: Low to High" },
  { key: "price-desc", label: "Price: High to Low" },
  { key: "discount", label: "% Discount" },
];

function minPrice(p: Product) {
  return Math.min(...p.variants.map((v) => v.price));
}
function maxDiscount(p: Product) {
  return Math.max(...p.variants.map((v) => v.discountPercent));
}

function SortSheet({
  active,
  onSelect,
  onClose,
}: {
  active: SortKey;
  onSelect: (k: SortKey) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, backgroundColor: "rgba(2,6,12,0.5)", zIndex: 200 }}
      />
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 430,
          backgroundColor: "white",
          borderRadius: "20px 20px 0 0",
          zIndex: 201,
          paddingBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", padding: "18px 20px 12px", borderBottom: "1px solid #F0F0F0" }}>
          <span style={{ flex: 1, fontSize: 16, fontWeight: 700, color: "#282C3F" }}>Sort By</span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(2,6,12,0.5)", fontSize: 20, lineHeight: 1, padding: 4 }}
          >
            ×
          </button>
        </div>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => { onSelect(opt.key); onClose(); }}
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              padding: "16px 20px",
              background: "none",
              border: "none",
              borderBottom: "1px solid #F8F8F8",
              cursor: "pointer",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                border: `2px solid ${active === opt.key ? "#0050FF" : "#CCCCCC"}`,
                backgroundColor: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {active === opt.key && (
                <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#0050FF" }} />
              )}
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: active === opt.key ? 700 : 500,
                color: active === opt.key ? "#0050FF" : "#282C3F",
              }}
            >
              {opt.label}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

interface Props {
  products: Product[];
  title: string;
}

export default function CategoryContent({ products: staticProducts, title }: Props) {
  const [sort, setSort] = useState<SortKey>("relevance");
  const [showSort, setShowSort] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const router = useRouter();
  const { totalItems, totalPrice } = useCart();
  const { getActiveProducts } = useAdmin();

  const sorted = useMemo(() => {
    // Get all active products from DB, filter by this category
    const catSlug = staticProducts[0]?.categorySlug || title.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-');
    const dbProducts = getActiveProducts().filter(p => p.categorySlug === catSlug);
    
    // Fallback to static if DB not loaded yet
    const arr = dbProducts.length > 0 ? [...dbProducts] : [...staticProducts];
    
    if (sort === "price-asc") arr.sort((a, b) => minPrice(a) - minPrice(b));
    else if (sort === "price-desc") arr.sort((a, b) => minPrice(b) - minPrice(a));
    else if (sort === "discount") arr.sort((a, b) => maxDiscount(b) - maxDiscount(a));
    return arr;
  }, [staticProducts, sort, getActiveProducts, title]);

  const activeLabel = SORT_OPTIONS.find((o) => o.key === sort)!.label;
  const sortActive = sort !== "relevance";

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", backgroundColor: "#F8F8F8" }}>
      {/* Sticky header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backgroundColor: "white",
          borderBottom: "1px solid #F0F0F0",
          boxShadow: "rgba(2, 6, 12, 0.08) 0px 2px 8px 0px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", gap: 12 }}>
          <button
            onClick={() => { if (window.history.length > 1) router.back(); else router.push("/"); }}
            style={{ background: "none", border: "none", padding: 4, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center" }}
            aria-label="Back"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="#282C3F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 style={{ flex: 1, fontSize: 16, fontWeight: 700, color: "#282C3F", margin: 0 }}>{title}</h1>
          <span style={{ fontSize: 11, color: "rgba(2,6,12,0.45)", backgroundColor: "#F4F4F4", padding: "3px 10px", borderRadius: 20, flexShrink: 0 }}>
            {sorted.length} items
          </span>
          {totalItems > 0 && (
            <button
              onClick={() => router.push("/cart")}
              style={{ display: "flex", alignItems: "center", gap: 5, backgroundColor: "#0050FF", border: "none", borderRadius: 10, padding: "6px 10px", cursor: "pointer", flexShrink: 0 }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="3" y1="6" x2="21" y2="6" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M16 10a4 4 0 01-8 0" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: "white", lineHeight: 1 }}>{totalItems} item{totalItems !== 1 ? "s" : ""}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: "white", lineHeight: 1.2 }}>₹{totalPrice}</span>
              </div>
            </button>
          )}
        </div>

        {/* Sort / Filter bar */}
        <div
          style={{
            display: "flex",
            borderTop: "1px solid #F0F0F0",
            backgroundColor: "white",
          }}
        >
          <button
            onClick={() => setShowSort(true)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "10px 0",
              background: "none",
              border: "none",
              borderRight: "1px solid #F0F0F0",
              cursor: "pointer",
              color: sortActive ? "#0050FF" : "#282C3F",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M7 12h10M11 18h2" stroke={sortActive ? "#0050FF" : "#282C3F"} strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {sortActive ? activeLabel : "Sort"}
            </span>
            {sortActive && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="#0050FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "10px 0",
              color: "#282C3F",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke="#282C3F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Filter</span>
          </div>
        </div>
      </div>

      {/* Product grid */}
      <div style={{ backgroundColor: "white", marginTop: 1 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1px",
            backgroundColor: "#F0F0F0",
          }}
        >
          {sorted.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              layout="grid"
              onAdd={setActiveProduct}
            />
          ))}
        </div>

        {sorted.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 24px", color: "rgba(2,6,12,0.45)", fontSize: 14 }}>
            No products in this category yet.
          </div>
        )}
      </div>

      {showSort && (
        <SortSheet active={sort} onSelect={setSort} onClose={() => setShowSort(false)} />
      )}

      <VariantModal product={activeProduct} onClose={() => setActiveProduct(null)} />
    </div>
  );
}
