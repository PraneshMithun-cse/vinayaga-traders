"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Product, PRODUCTS } from "@/data/products";
import { fuzzySearch } from "@/lib/search";
import { useCart } from "@/context/CartContext";
import { useAdmin } from "@/context/AdminContext";
import VariantModal from "./VariantModal";

const SUGGESTED_SLUGS = [
  "manjal-thool", "mango-pickle", "bat-chips", "sambar-thool",
  "milagu", "kadalai-mavu", "garam-masala", "annachi-poo",
  "jeeragam", "milagai-thool"
];
const SUGGESTED_PRODUCTS = PRODUCTS.filter((p) => SUGGESTED_SLUGS.includes(p.slug)).slice(0, 10);

type SortKey = "relevance" | "price-asc" | "price-desc" | "discount";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "relevance", label: "Relevance" },
  { key: "price-asc", label: "Price: Low to High" },
  { key: "price-desc", label: "Price: High to Low" },
  { key: "discount", label: "% Discount" },
];
function minPrice(p: Product) { return Math.min(...p.variants.map((v) => v.price)); }
function maxDiscount(p: Product) { return Math.max(...p.variants.map((v) => v.discountPercent)); }

function SortSheet({ active, onSelect, onClose }: { active: SortKey; onSelect: (k: SortKey) => void; onClose: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(2,6,12,0.5)", zIndex: 200 }} />
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, backgroundColor: "white", borderRadius: "20px 20px 0 0", zIndex: 201, paddingBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", padding: "18px 20px 12px", borderBottom: "1px solid #F0F0F0" }}>
          <span style={{ flex: 1, fontSize: 16, fontWeight: 700, color: "#282C3F" }}>Sort By</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(2,6,12,0.5)", fontSize: 20, lineHeight: 1, padding: 4 }}>×</button>
        </div>
        {SORT_OPTIONS.map((opt) => (
          <button key={opt.key} onClick={() => { onSelect(opt.key); onClose(); }} style={{ display: "flex", alignItems: "center", width: "100%", padding: "16px 20px", background: "none", border: "none", borderBottom: "1px solid #F8F8F8", cursor: "pointer", gap: 14 }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${active === opt.key ? "#0050FF" : "#CCCCCC"}`, backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {active === opt.key && <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#0050FF" }} />}
            </div>
            <span style={{ fontSize: 14, fontWeight: active === opt.key ? 700 : 500, color: active === opt.key ? "#0050FF" : "#282C3F" }}>{opt.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function SearchResultCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  const cheapest = product.variants.reduce((a, b) => (a.price < b.price ? a : b));
  const hasDiscount = cheapest.mrp > cheapest.price;

  return (
    <Link href={`/product/${product.slug}`} style={{ textDecoration: "none" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 16px",
          borderBottom: "1px solid #F0F0F0",
          backgroundColor: "white",
        }}
      >
        <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0, borderRadius: 10, overflow: "hidden", backgroundColor: "#F8F8F8" }}>
          <Image src={product.imageUrl} alt={product.name} fill sizes="72px" style={{ objectFit: "contain", opacity: product.outOfStock ? 0.5 : 1 }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#282C3F", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {product.name}
          </div>
          <div style={{ fontSize: 11, color: "rgba(2,6,12,0.45)", marginBottom: 6 }}>{product.categoryName}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {hasDiscount && (
              <span style={{ fontSize: 11, color: "rgba(2,6,12,0.4)", textDecoration: "line-through" }}>₹{cheapest.mrp}</span>
            )}
            <span style={{ fontSize: 14, fontWeight: 700, color: "#282C3F" }}>₹{cheapest.price}</span>
            {cheapest.discountPercent > 0 && (
              <span style={{ fontSize: 10, fontWeight: 700, color: "#1BA672", backgroundColor: "#EAF7F1", padding: "1px 6px", borderRadius: 4 }}>
                {cheapest.discountPercent}% OFF
              </span>
            )}
          </div>
        </div>
        {product.outOfStock ? (
          <span
            style={{
              padding: "4px 8px",
              borderRadius: 6,
              backgroundColor: "#EF4444",
              color: "white",
              fontSize: 10,
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            OOS
          </span>
        ) : (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAdd(); }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: "1.5px solid #0050FF",
              backgroundColor: "white",
              color: "#0050FF",
              fontSize: 22,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            +
          </button>
        )}
      </div>
    </Link>
  );
}

const POPULAR_SEARCHES = [
  "Vathal", "Sambar Thool", "Rasam Thool", "Kuzhambu Thool",
  "Milagu Thool", "Manjal Thool", "Perungayam", "Gingelly Oil",
  "Mango Pickle", "Sombu",
];

export default function SearchContent() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("relevance");
  const [showSort, setShowSort] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { totalItems, totalPrice } = useCart();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const { applyOverride } = useAdmin();

  const trimmed = query.trim();
  const results = useMemo(() => {
    const filtered = trimmed ? fuzzySearch(trimmed) : [];
    const arr = filtered.map(applyOverride).filter((p) => !p.disabled);
    if (sort === "price-asc") arr.sort((a, b) => minPrice(a) - minPrice(b));
    else if (sort === "price-desc") arr.sort((a, b) => minPrice(b) - minPrice(a));
    else if (sort === "discount") arr.sort((a, b) => maxDiscount(b) - maxDiscount(a));
    return arr;
  }, [trimmed, sort, applyOverride]);

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", backgroundColor: "#F8F8F8" }}>
      {/* Sticky search header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backgroundColor: "white",
          borderBottom: "1px solid #F0F0F0",
          display: "flex",
          alignItems: "center",
          padding: "10px 16px",
          gap: 10,
          boxShadow: "rgba(2, 6, 12, 0.08) 0px 2px 8px 0px",
        }}
      >
        <button
          onClick={() => { if (window.history.length > 1) router.back(); else router.push("/"); }}
          style={{ background: "none", border: "none", padding: 4, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center" }}
          aria-label="Back"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="#282C3F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: "#F2F2F2",
            border: "1px solid #E8E8E8",
            borderRadius: 10,
            padding: "9px 12px",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="7" stroke="rgba(2,6,12,0.45)" strokeWidth="2" />
            <path d="M20 20l-3-3" stroke="rgba(2,6,12,0.45)" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for products…"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: 14,
              color: "#282C3F",
              fontWeight: 500,
            }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "rgba(2,6,12,0.45)", fontSize: 18, lineHeight: 1 }}
            >
              ×
            </button>
          )}
        </div>

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

      {/* No query — show popular searches + suggested products */}
      {!trimmed && (
        <div style={{ backgroundColor: "white", marginTop: 8, padding: "16px 16px 8px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#282C3F", marginBottom: 12 }}>Popular Searches</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {POPULAR_SEARCHES.map((term) => (
              <button
                key={term}
                onClick={() => setQuery(term)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  border: "1px solid #E8E8E8",
                  backgroundColor: "#F8F8F8",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#282C3F",
                  cursor: "pointer",
                }}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No query — suggested products */}
      {!trimmed && SUGGESTED_PRODUCTS.length > 0 && (
        <div style={{ backgroundColor: "white", marginTop: 8, padding: "16px 0 16px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#282C3F", marginBottom: 12, paddingLeft: 16 }}>Trending Near You</div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingLeft: 16, paddingRight: 16, scrollbarWidth: "none" }}>
            {SUGGESTED_PRODUCTS.map((product) => {
              const cheapest = product.variants.reduce((a, b) => (a.price < b.price ? a : b));
              return (
                <Link key={product.id} href={`/product/${product.slug}`} style={{ textDecoration: "none", flexShrink: 0, width: 120 }}>
                  <div style={{ backgroundColor: "#F8F8F8", borderRadius: 12, overflow: "hidden", border: "1px solid #F0F0F0" }}>
                    <div style={{ position: "relative", height: 100 }}>
                      <Image src={product.imageUrl} alt={product.name} fill sizes="120px" style={{ objectFit: "contain", padding: 8 }} />
                    </div>
                    <div style={{ padding: "6px 8px 10px", backgroundColor: "white" }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#282C3F", lineHeight: 1.3, marginBottom: 3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {product.name}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#282C3F" }}>₹{cheapest.price}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Results */}
      {trimmed && (
        <div>
          {/* Result count + sort bar */}
          <div style={{ backgroundColor: "white", borderBottom: "1px solid #F0F0F0" }}>
            <div style={{ padding: "10px 16px 0" }}>
              <span style={{ fontSize: 13, color: "rgba(2,6,12,0.55)", fontWeight: 600 }}>
                {results.length} result{results.length !== 1 ? "s" : ""} for &quot;{trimmed}&quot;
              </span>
            </div>
            <div style={{ display: "flex", borderTop: "1px solid #F0F0F0", marginTop: 10 }}>
              <button
                onClick={() => setShowSort(true)}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", background: "none", border: "none", borderRight: "1px solid #F0F0F0", cursor: "pointer", color: sort !== "relevance" ? "#0050FF" : "#282C3F" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M7 12h10M11 18h2" stroke={sort !== "relevance" ? "#0050FF" : "#282C3F"} strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  {sort !== "relevance" ? SORT_OPTIONS.find((o) => o.key === sort)!.label : "Sort"}
                </span>
              </button>
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", color: "#282C3F" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke="#282C3F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Filter</span>
              </div>
            </div>
          </div>
          {results.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 24px", backgroundColor: "white", marginTop: 1 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#282C3F", marginBottom: 8 }}>No results found</div>
              <div style={{ fontSize: 13, color: "rgba(2,6,12,0.55)" }}>
                Try a different spelling or check popular searches
              </div>
            </div>
          ) : (
            <div style={{ backgroundColor: "white", marginTop: 1 }}>
              {results.map((product) => (
                <SearchResultCard
                  key={product.id}
                  product={product}
                  onAdd={() => setActiveProduct(product)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {showSort && (
        <SortSheet active={sort} onSelect={setSort} onClose={() => setShowSort(false)} />
      )}
      <VariantModal product={activeProduct} onClose={() => setActiveProduct(null)} />
    </div>
  );
}
